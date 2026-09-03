import * as React from 'react';

interface Attachment { id: string; name: string; fileSize: number; [key: string]: any; }
interface Props { context: any; fieldsValues: any; readonly: boolean; target: string; value: any; multiple: boolean; }
interface State { files: Attachment[]; uploading: boolean; error: string; }

function attachments(value: any): Attachment[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(function (item) { return !!item; });
  if (typeof value === 'string') {
    try { return attachments(JSON.parse(value)); } catch (error) { return []; }
  }
  return typeof value === 'object' ? [value] : [];
}

function targetFrom(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value.length <= 160 && value.charAt(0) !== '{' && value.charAt(0) !== '[' ? value.trim() : '';
  if (Array.isArray(value)) {
    for (var a = 0; a < value.length; a += 1) { var found = targetFrom(value[a]); if (found) return found; }
    return '';
  }
  var keys = ['fieldId', 'fieldName', 'variableId', 'variableName', 'key', 'id', 'name'];
  for (var i = 0; i < keys.length; i += 1) { var candidate = targetFrom(value[keys[i]]); if (candidate) return candidate; }
  var nested = ['value', 'binding', 'target', 'field', 'variable'];
  for (var n = 0; n < nested.length; n += 1) { var inner = targetFrom(value[nested[n]]); if (inner) return inner; }
  if (value.prefix === '__variables_' || value.prefix === '__list_' || value.prefix === '__temp_') return targetFrom(value.value);
  return '';
}

function normalizeUpload(response: any, file: File): Attachment {
  var result = response && (response.Data || response.data || response);
  if (Array.isArray(result)) result = result[0];
  if (typeof result === 'string' || typeof result === 'number') return { id: String(result), name: file.name, fileSize: file.size };
  result = result || {};
  var id = result.id || result.ID || result.fileId || result.FileId;
  if (!id) throw new Error('Upload returned no file ID.');
  return { id: String(id), name: result.name || result.fileName || file.name, fileSize: Number(result.fileSize || result.size || file.size) };
}

class AttachmentControl extends React.Component<Props, State> {
  private picker: HTMLInputElement | null = null;
  constructor(props: Props) {
    super(props);
    this.state = { files: attachments(props.value), uploading: false, error: '' };
    this.choose = this.choose.bind(this);
    this.changed = this.changed.bind(this);
  }
  choose() { if (!this.props.readonly && this.picker) this.picker.click(); }
  changed(event: any) {
    var selected: File[] = [];
    var list = event.target.files;
    for (var i = 0; list && i < list.length; i += 1) selected.push(list[i]);
    if (!this.props.multiple && selected.length > 1) selected = selected.slice(0, 1);
    if (!selected.length) return;
    var sdk = this.props.context.modules && this.props.context.modules.yeeSDKClient;
    if (!sdk || !sdk.files || typeof sdk.files.upload !== 'function') { this.setState({ error: 'File upload is unavailable.' }); return; }
    var self = this;
    this.setState({ uploading: true, error: '' });
    Promise.all(selected.map(function (file) {
      return file.arrayBuffer().then(function (buffer) { return sdk.files.upload({ fileName: file.name, file: buffer }); })
        .then(function (response: any) { return normalizeUpload(response, file); });
    })).then(function (uploaded) {
      var next = self.props.multiple ? self.state.files.concat(uploaded) : uploaded.slice(0, 1);
      return self.write(self.props.multiple ? next : next[0]).then(function () { self.setState({ files: next, uploading: false }); });
    }).catch(function (error: any) { self.setState({ uploading: false, error: error.message || String(error) }); });
  }
  write(value: Attachment | Attachment[] | null): Promise<void> {
    var context = this.props.context;
    var hosts = [context, context.formContext, context.variableContext, context.runtimeContext];
    var methods = ['setFieldValue', 'setFormFieldValue', 'setVariableValue', 'setVariable'];
    for (var h = 0; h < hosts.length; h += 1) for (var m = 0; hosts[h] && m < methods.length; m += 1) {
      if (typeof hosts[h][methods[m]] === 'function') return Promise.resolve(hosts[h][methods[m]](this.props.target, value));
    }
    return Promise.reject(new Error('No writable Attachment setter is available.'));
  }
  content(file: Attachment): Promise<Blob> {
    var files = this.props.context.modules.yeeSDKClient.files;
    return Promise.resolve(files.getContent(file.id)).then(function (response: any) {
      var data = response && (response.data || response.Data || response);
      if (data instanceof Blob) return data;
      if (data instanceof ArrayBuffer) return new Blob([data]);
      throw new Error('Unsupported file-content response.');
    });
  }
  render() {
    var self = this;
    return <div>
      <input ref={function (node: HTMLInputElement | null) { self.picker = node; }} type="file" multiple={this.props.multiple} onChange={this.changed} style={{ display: 'none' }} />
      {!this.props.readonly ? <button type="button" disabled={this.state.uploading} onClick={this.choose}>Choose file</button> : null}
      {this.state.files.map(function (file) { return <span key={file.id}>{file.name}</span>; })}
      {this.state.error ? <div>{this.state.error}</div> : null}
    </div>;
  }
}

export class CodeInApplication implements CodeInComp {
  private attachmentTarget = '';
  description() { return 'Focused SDK Attachment upload and writeback pattern.'; }
  inputParameters() { return [{ id: 'attachmentTarget', type: 'variable' }, { id: 'multiple', type: 'variable' }]; }
  requiredFields(params: any) { this.attachmentTarget = targetFrom(params && params.attachmentTarget); return this.attachmentTarget ? [this.attachmentTarget] : []; }
  render(context: any, fieldsValues: any, readonly: boolean) {
    var target = this.attachmentTarget || targetFrom(context.params.attachmentTarget);
    var multiple = String(context.params.multiple).toLowerCase() === 'true';
    var value = fieldsValues && fieldsValues[target] !== undefined ? fieldsValues[target] : context.params.attachmentTarget;
    return <AttachmentControl context={context} fieldsValues={fieldsValues} readonly={readonly} target={target} value={value} multiple={multiple} />;
  }
}

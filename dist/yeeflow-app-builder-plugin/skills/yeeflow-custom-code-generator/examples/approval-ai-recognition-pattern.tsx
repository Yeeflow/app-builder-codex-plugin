import * as React from 'react';

interface Props { context: any; fieldsValues: any; readonly: boolean; hasFile: boolean; actionCssId: string; watchFieldIds: string; timeoutSeconds: number; fileSignature: string; }
interface State { status: string; message: string; elapsed: number; }

function outputSignature(values: any, idsText: string): string {
  var ids = (idsText || '').split(',');
  var snapshot: any = {};
  for (var i = 0; i < ids.length; i += 1) { var id = ids[i].trim(); if (id) snapshot[id] = values && values[id]; }
  try { return JSON.stringify(snapshot); } catch (error) { return String(snapshot); }
}

class RecognitionControl extends React.Component<Props, State> {
  private baseline = '';
  private startedAt = 0;
  private ticker: any = null;
  private settle: any = null;
  constructor(props: Props) {
    super(props);
    this.state = { status: props.hasFile ? 'ready' : 'idle', message: '', elapsed: 0 };
    this.start = this.start.bind(this);
  }
  componentDidMount() {
    var self = this;
    this.ticker = setInterval(function () {
      if (self.state.status !== 'running') return;
      var elapsed = Math.floor((Date.now() - self.startedAt) / 1000);
      if (elapsed >= self.props.timeoutSeconds) self.setState({ status: 'error', message: 'Recognition timed out.', elapsed: elapsed });
      else self.setState({ elapsed: elapsed, message: 'Recognizing quotation…' });
    }, 1000);
  }
  componentWillUnmount() { if (this.ticker) clearInterval(this.ticker); if (this.settle) clearTimeout(this.settle); }
  componentWillReceiveProps(next: Props) {
    if (next.fileSignature !== this.props.fileSignature) {
      if (this.settle) clearTimeout(this.settle);
      this.setState({ status: next.hasFile ? 'ready' : 'idle', message: '', elapsed: 0 });
      return;
    }
    if (this.state.status === 'running' && outputSignature(next.fieldsValues, next.watchFieldIds) !== this.baseline) {
      var self = this;
      if (this.settle) clearTimeout(this.settle);
      this.settle = setTimeout(function () { self.setState({ status: 'completed', message: 'Recognition completed.' }); }, 1800);
    }
  }
  start() {
    if (this.props.readonly || !this.props.hasFile || this.state.status === 'running') return;
    var id = (this.props.actionCssId || '').replace(/^#/, '');
    var host = id ? document.getElementById(id) : null;
    var action = host && host.matches('button,[role="button"],a') ? host : host && host.querySelector('button,[role="button"],a');
    if (!action) { this.setState({ status: 'error', message: 'The configured recognition action was not found.' }); return; }
    this.baseline = outputSignature(this.props.fieldsValues, this.props.watchFieldIds);
    this.startedAt = Date.now();
    this.setState({ status: 'running', message: 'Starting recognition…', elapsed: 0 });
    try { (action as HTMLElement).click(); } catch (error) { this.setState({ status: 'error', message: 'Recognition could not be started.' }); }
  }
  render() {
    var label = this.state.status === 'running' ? 'Recognizing…' : this.state.status === 'completed' ? 'Recognize again' : 'Recognize with AI';
    return <div><button type="button" disabled={this.props.readonly || !this.props.hasFile || this.state.status === 'running'} onClick={this.start}>{label}</button><span>{this.state.message}</span></div>;
  }
}

export class CodeInApplication implements CodeInComp {
  description() { return 'Focused explicit Approval Form AI-recognition trigger pattern.'; }
  inputParameters() { return [{ id: 'attachmentTarget', type: 'variable' }, { id: 'attachmentVariableId', type: 'string' }, { id: 'recognitionActionCssId', type: 'string' }, { id: 'watchFieldIds', type: 'string' }, { id: 'recognitionTimeoutSeconds', type: 'string' }]; }
  requiredFields(params: any) { return [params.attachmentVariableId].concat(String(params.watchFieldIds || '').split(',')).filter(function (id) { return !!String(id).trim(); }); }
  render(context: any, fieldsValues: any, readonly: boolean) {
    var params = context.params || {};
    var target = String(params.attachmentVariableId || '');
    var value = fieldsValues && fieldsValues[target];
    var signature = JSON.stringify(value || null);
    return <RecognitionControl context={context} fieldsValues={fieldsValues} readonly={readonly} hasFile={!!value} fileSignature={signature} actionCssId={String(params.recognitionActionCssId || 'btn_vendorQuote_Recog')} watchFieldIds={String(params.watchFieldIds || '')} timeoutSeconds={Number(params.recognitionTimeoutSeconds) || 240} />;
  }
}

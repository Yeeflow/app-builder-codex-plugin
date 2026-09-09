'use strict';
// Local validation inputs only. No product DTO -> MCP/YAPK serialization is implied.
const controlSchemas = require('../control-configurations.normalized.json');
const capability = require('../docs/standards/product-14.5/capabilities.json');
const own = (o, k) => Object.prototype.hasOwnProperty.call(o || {}, k);
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const array = v => Array.isArray(v) ? v : [];
const problem = (code, path, level = 'error') => ({ code, path, level, message: `${code} at ${path}` });
function parse(v) { if (typeof v !== 'string') return v; try { return JSON.parse(v); } catch { return undefined; } }
function visit(v, fn) { if (!object(v) && !Array.isArray(v)) return; fn(v); for (const c of Object.values(v)) visit(c, fn); }
function valuesAt(v, parts) {
  if (!parts.length) return [v];
  const [key, ...rest] = parts;
  if (key === '*') return array(v).flatMap(x => valuesAt(x, rest));
  return object(v) && own(v, key) ? valuesAt(v[key], rest) : [];
}
function matches(v, types) { return types.some(t => t === 'any' || t === 'unknown' || t === 'enum' || (t === 'null' ? v === null : t === 'array' ? Array.isArray(v) : t === 'object' ? object(v) : t === 'integer' ? Number.isInteger(v) : typeof v === t)); }
function validateField(field, { profile = 'product-14.5' } = {}) {
  if (profile !== capability.profile) return [problem('PRODUCT_PROFILE_UNSUPPORTED', 'profile')];
  const issues = [], rules = parse(field.Rules), specs = capability.fields[field.Type];
  if (!specs) return [problem('PRODUCT_FIELD_TYPE_NOT_IN_CATALOG', 'Type', 'warning')];
  if (own(field, 'Rules') && !object(rules)) issues.push(problem('FIELD_RULES_OBJECT_REQUIRED', 'Rules'));
  const value = { ...field, Rules: rules };
  for (const [key, spec] of Object.entries(specs)) {
    if (key.endsWith('.$dynamic')) continue;
    for (let v of valuesAt(value, key.split('.'))) {
      if (v === undefined) continue;
      if (spec.device && Array.isArray(v) && v[0] === null) v = v[1];
      if (!matches(v, spec.types)) issues.push(problem('FIELD_PRODUCT_TYPE_MISMATCH', key));
      if (spec.values && !spec.values.includes(v)) issues.push(problem('FIELD_PRODUCT_ENUM_MISMATCH', key));
    }
  }
  if (own(field, 'DefaultValue') && !specs.DefaultValue) issues.push(problem('FIELD_DEFAULT_UNDECLARED', 'DefaultValue', 'warning'));
  if (typeof field.DefaultValue === 'string') {
    const decoded = parse(field.DefaultValue);
    // Only flag a second encoded expression/object layer, never a legitimate quoted text default.
    if (typeof decoded === 'string' && /^[\[{]/.test(decoded) && object(parse(decoded))) issues.push(problem('FIELD_DEFAULT_DOUBLE_ENCODING', 'DefaultValue'));
  }
  if (own(field, 'IsFilter')) issues.push(problem('ISFILTER_TRANSPORT_MAPPING_UNVERIFIED', 'IsFilter', 'warning'));
  if (object(rules)) {
    if (typeof rules.number_min === 'number' && typeof rules.number_max === 'number' && rules.number_min > rules.number_max) issues.push(problem('FIELD_NUMERIC_RANGE_REVERSED', 'Rules'));
    if (own(rules, 'number_step') && !(rules.number_step > 0)) issues.push(problem('FIELD_NUMERIC_STEP_INVALID', 'Rules.number_step'));
    if (own(rules, 'rounded-to') && (!Number.isInteger(rules['rounded-to']) || rules['rounded-to'] < 0)) issues.push(problem('FIELD_PRECISION_INVALID', 'Rules.rounded-to'));
    if (field.Type === 'file-upload') {
      if (own(rules, 'ver') && rules.ver !== 1) issues.push(problem('FIELD_UPLOAD_VERSION_INVALID', 'Rules.ver'));
      if (own(rules, 'PROP_MAXSIZE') && rules.isLabrary !== true) issues.push(problem('FIELD_LIBRARY_UPLOAD_SCOPE_INVALID', 'Rules.PROP_MAXSIZE'));
      for (const k of ['maxsize', 'file_maxcount', 'PROP_MAXSIZE']) if (own(rules, k) && !(rules[k] > 0)) issues.push(problem('FIELD_UPLOAD_LIMIT_INVALID', `Rules.${k}`));
      if (rules.file_typeslimit === true && !array(rules.file_types?.value).length) issues.push(problem('FIELD_UPLOAD_TYPES_MISSING', 'Rules.file_types'));
      if (array(rules.file_types?.value).includes('other') && !/^[a-z0-9]+(?:,[a-z0-9]+)*$/.test(rules.file_types?.cusValue || '')) issues.push(problem('FIELD_UPLOAD_EXTENSIONS_INVALID', 'Rules.file_types.cusValue'));
    }
    if (field.Type === 'list' && own(rules, 'list-variables')) {
      const seen = new Set();
      if (!array(rules['list-variables']).length) issues.push(problem('SUBLIST_FIELDS_EMPTY', 'Rules.list-variables'));
      for (const [i, row] of array(rules['list-variables']).entries()) {
        for (const k of ['idx', 'id', 'name', 'type', 'editable']) if (!own(row, k)) issues.push(problem('SUBLIST_FIELD_PROPERTY_MISSING', `Rules.list-variables.${i}.${k}`));
        if (seen.has(row.id)) issues.push(problem('SUBLIST_FIELD_ID_DUPLICATE', `Rules.list-variables.${i}.id`));
        seen.add(row.id);
        if (['metadata', 'mutiple-metadata'].includes(row.type) && (!object(row.value) || !['0', 'app'].includes(row.value.source) || typeof row.value.categoryId !== 'string')) issues.push(problem('SUBLIST_METADATA_VALUE_INVALID', `Rules.list-variables.${i}.value`));
        if (row.type === 'lookup' && (!object(row.value) || typeof row.value.ListID !== 'string' || !row.value.ListID)) issues.push(problem('SUBLIST_LOOKUP_VALUE_INVALID', `Rules.list-variables.${i}.value`));
      }
    }
  }
  return issues;
}
function assertClean(issues) { const errors = issues.filter(x => x.level === 'error'); if (errors.length) throw Object.assign(Error(errors.map(x => x.code).join(', ')), { issues }); }
function patchField(existing, patch, options = {}) {
  if (own(patch, 'IsFilter') && !options.confirmedIsFilterTransport) throw Error('ISFILTER_TRANSPORT_MAPPING_UNVERIFIED');
  const next = { ...structuredClone(existing), ...structuredClone(patch) };
  if (own(patch, 'Rules')) {
    const before = parse(existing.Rules) || {}, changes = parse(patch.Rules);
    if (!object(changes)) throw Error('FIELD_RULES_OBJECT_REQUIRED');
    const merged = merge(before, changes);
    next.Rules = typeof existing.Rules === 'string' ? JSON.stringify(merged) : merged;
  }
  assertClean(validateField(next));
  return next;
}
function merge(before, patch) {
  const next = structuredClone(before);
  for (const [k, v] of Object.entries(patch)) {
    if (['__proto__', 'prototype', 'constructor'].includes(k)) throw Error('UNSAFE_PROPERTY');
    next[k] = object(v) && object(next[k]) ? merge(next[k], v) : structuredClone(v);
  }
  return next;
}
const editors = {
  text: ['input','textarea','richtext','radio','checkbox','hyperlink','rate','calculated'],
  number: ['input_number','percent','currency','rate','calculated'], boolean: ['switch','calculated'], date: ['datepicker','time','calculated'],
  metadata: ['metadata','calculated'], 'mutiple-metadata': ['mutiple-metadata','calculated'], user: ['identity-picker','calculated'],
  costcenter: ['cost-center-picker','calculated'], groupselect: ['organization-picker','calculated'], location: ['location-picker','calculated'],
  file: ['file-upload','calculated'], lookup: ['lookup','calculated'], img: ['icon-upload','signer','calculated'], signature: ['signer'], vacation: ['vacation'],
};
function validateSublist({ host, id, binding, fields, sourceFields = [], actions = [], controls = [] }) {
  if (host !== 'workflow') return [problem('SUBLIST_HOST_PROFILE_UNVERIFIED', 'host')];
  const issues = [], targets = new Map(array(fields).map(f => [f.id, f]));
  if (!id || !binding) issues.push(problem("SUBLIST_IDENTITY_MISSING", "binding"));
  if (targets.size !== array(fields).length) issues.push(problem('SUBLIST_FIELD_ID_DUPLICATE', 'fields'));
  for (const [i, f] of array(fields).entries()) {
    if (f.editor?.binding !== f.id || f.editor?.attrs?.list_field_binding !== binding || f.editor?.attrs?.list_control_id !== id) issues.push(problem("SUBLIST_EDITOR_BINDING_INVALID", `fields.${i}`));
    if (!editors[f.type]?.includes(f.editor?.type)) issues.push(problem('SUBLIST_EDITOR_INCOMPATIBLE', `fields.${i}`));
    for (const mapping of array(f.editor?.attrs?.addition)) {
      const source = array(sourceFields).find(x => x.FieldName === mapping.FieldName);
      const target = targets.get(mapping.RelationName);
      if (!source || typeof mapping.IsShow !== 'boolean' || typeof mapping.RelationName !== 'string') issues.push(problem('SUBLIST_LOOKUP_SOURCE_INVALID', `fields.${i}`));
      if (mapping.RelationName !== '' && (!target || !source || target.type !== source.type)) issues.push(problem('SUBLIST_LOOKUP_TARGET_INVALID', `fields.${i}`));
    }
    if (f.changeAction && !actions.some(a => a.id === f.changeAction)) issues.push(problem('SUBLIST_ACTION_UNRESOLVED', `fields.${i}`));
  }
  visit(controls, c => { if (c.attrs?.list_field_binding && (c.attrs.list_field_binding !== binding || c.attrs.list_control_id !== id || !targets.has(c.binding))) issues.push(problem('SUBLIST_LAYOUT_FIELD_UNRESOLVED', 'controls')); });
  return issues;
}
function patchSublistField(state, fieldId, properties, { allowedStaticPaths = [] } = {}) {
  assertClean(validateSublist(state));
  const next = structuredClone(state), field = next.fields.find(f => f.id === fieldId);
  if (!field) throw Error('SUBLIST_FIELD_UNRESOLVED');
  for (const [p, value] of Object.entries(properties)) {
    if (!allowedStaticPaths.includes(p) || /(?:binding|control_action|onChange|label_var|variable|calculated|formula)/i.test(p)) throw Error('SUBLIST_STATIC_PATH_UNSUPPORTED');
    let containsFormula = false;
    visit(value, v => { if (v.exprType || v.type === 'expr' || v.type === 'func') containsFormula = true; });
    if (containsFormula) throw Error('SUBLIST_FORMULA_IN_STATIC_PROPERTIES');
    const schemaPath = p.replace(/^\//, '').replaceAll('/', '.');
    const spec = controlSchemas.byControlType[field.editor.type]?.properties?.[schemaPath];
    if (!spec) throw Error('SUBLIST_STATIC_PATH_NOT_IN_EDITOR_SCHEMA');
    const staticValue = Array.isArray(value) && value[0] === null ? value[1] : value;
    if (!matches(staticValue, spec.valueTypes || ['unknown'])) throw Error('SUBLIST_STATIC_VALUE_TYPE_INVALID');
    const parts = p.replace(/^\//, '').split('/');
    if (parts.some(k => ['__proto__','constructor','prototype','id','type','children'].includes(k))) throw Error('SUBLIST_STRUCTURAL_PATCH_FORBIDDEN');
    const apply = editor => {
      let target = editor;
      for (const k of parts.slice(0, -1)) target = target[k] ??= {};
      const key = parts.at(-1);
      target[key] = object(value) && object(target[key]) ? merge(target[key], value) : structuredClone(value);
    };
    apply(field.editor);
    const applyCopies = (node, table = false) => {
      if (!object(node) && !Array.isArray(node)) return;
      table ||= node.type === 'list-columns';
      if (node.binding === fieldId && node.attrs?.list_field_binding === next.binding && node.attrs?.list_control_id === next.id) {
        if (node.type !== field.editor.type) throw Error('SUBLIST_EDITOR_COPY_MISMATCH');
        const hadLabel = own(node,'displayLabel'), label = node.displayLabel;
        apply(node);
        if (table) { if (hadLabel) node.displayLabel = label; else delete node.displayLabel; }
      }
      for (const child of Object.values(node)) applyCopies(child, table);
    };
    applyCopies(next.controls);
  }
  assertClean(validateSublist(next));
  return next;
}
function validateFilterPlan(plan) {
  const issues = [], controls = new Map(array(plan.controls).map(c => [c.id,c]));
  if (!['dashboard', 'workflow', 'data-list-form'].includes(plan.host)) issues.push(problem('FILTER_HOST_UNVERIFIED','host'));
  const verifiedTypes = plan.host === 'dashboard' ? ['search-filter','select-filter','check-filter','radio-filter','range-filter','check-range','date-filter','relative-period','hierarchy-filter','sorting-filters'] : plan.host === 'workflow' ? ['search-filter','select-filter','check-filter','radio-filter','range-filter','date-filter','relative-period','hierarchy-filter'] : ['search-filter'];
  const filters = array(plan.filters), variables = new Set(filters.map(f => f.variable));
  if (variables.size !== filters.length) issues.push(problem('FILTER_VARIABLE_DUPLICATE','filters'));
  for (const [i, f] of filters.entries()) {
    const p = `filters.${i}`;
    if (!verifiedTypes.includes(f.type) || !array(plan.supportedTypes).includes(f.type)) issues.push(problem('FILTER_HOST_UNVERIFIED', p));
    if (!f.variable || !['immediate','apply-button'].includes(f.mode)) issues.push(problem('FILTER_MODE_OR_VARIABLE_MISSING', p));
    const consumers = array(f.dependents);
    if (!consumers.length) issues.push(problem('FILTER_CONSUMER_MISSING', p));
    for (const id of consumers) {
      const c = controls.get(id);
      // Local plan facts are intentionally explicit, not inferred from arbitrary text/labels.
      if (!c || !array(c.conditionVariables).includes(f.variable)) issues.push(problem('FILTER_CONDITION_UNCONSUMED', `${p}.${id}`));
      if (f.mode === 'immediate' && !array(f.reload).includes(id)) issues.push(problem('FILTER_RELOAD_MISSING', `${p}.${id}`));
    }
    if (f.mode === 'apply-button') {
      const button = controls.get(f.applyButton);
      if (button?.type !== 'apply-button' || own(button,'variable')) issues.push(problem('FILTER_APPLY_BUTTON_INVALID', p));
    }
    if (['select-filter','check-filter','radio-filter'].includes(f.type)) {
      const source = array(plan.sources).find(s => s.id === f.listId);
      if (!source || !array(source.fields).includes(f.field)) issues.push(problem('FILTER_BOUND_FIELD_UNRESOLVED', p));
      if (f.options !== 'runtime-distinct' || own(f,'defaultValue') || own(f,'selected')) issues.push(problem('FILTER_SELECTION_OPTIONS_INVALID', p));
    }
    if (own(f,'emptyValueOverride')) issues.push(problem('FILTER_EMPTY_OVERRIDE_UNPROVEN', p));
  }
  for (const c of controls.values()) if (c.type === 'apply-button' && own(c,'variable')) issues.push(problem('FILTER_APPLY_BUTTON_VARIABLE_FORBIDDEN', c.id));
  if (own(plan,'resetTargets')) {
    if (!Array.isArray(plan.resetTargets) || plan.resetTargets.some(v => !variables.has(v))) issues.push(problem('FILTER_RESET_TARGET_UNRESOLVED','resetTargets'));
  }
  return issues;
}
function buildFilterBehavior(plan) {
  assertClean(validateFilterPlan(plan));
  return { filters: plan.filters.map(f => ({ id: f.id, attrs: { apply_t: f.mode === 'immediate' ? '1' : '2', ...(f.mode === 'apply-button' ? { apply_btn: f.applyButton } : {}) } })),
    resetTargets: own(plan,'resetTargets') ? [...plan.resetTargets] : plan.filters.filter(f => f.mode === 'apply-button').map(f => f.variable) };
}
function validateFilterResource(resource) {
  const issues = [], nodes = [];
  visit(resource, n => { if (n.type) nodes.push(n); });
  const canonical = id => String(id || '').replace(/^__filter_/, '');
  const references = (value, variable) => {
    let found = false;
    visit(value, n => { if ((n.exprType === 'variable' || n.type === 'expr') && [n.id,n.name].some(v => canonical(v) === canonical(variable))) found = true; });
    return found;
  };
  const valueTypes = ['search-filter','select-filter','check-filter','radio-filter','range-filter','date-filter','relative-period','hierarchy-filter'];
  for (const c of nodes) {
    const variable = c.binding || c.attrs?.filterVar;
    if (c.type === 'apply-button' && variable) issues.push(problem('FILTER_APPLY_BUTTON_VARIABLE_FORBIDDEN',c.id));
    if (!valueTypes.includes(c.type)) continue;
    if (!variable) issues.push(problem('FILTER_VARIABLE_MISSING',c.id));
    const consumers = nodes.filter(n => n !== c && n.attrs?.data?.list && (references(n.attrs.data.filter, variable) || references(n.attrs.data.fulltext, variable)));
    // Analytics runtime metadata has a different envelope; preserve an explicit warning there.
    if (variable && !consumers.length) issues.push(problem('FILTER_CONDITION_UNCONSUMED',c.id, array(resource.exts).length ? 'warning' : 'error'));
    const mode = c.attrs?.apply_t;
    if (mode !== undefined && !['1','2'].includes(mode)) issues.push(problem('FILTER_APPLY_MODE_INVALID',c.id));
    if (mode === '2' && !nodes.some(n => n.id === c.attrs.apply_btn && n.type === 'apply-button')) issues.push(problem('FILTER_APPLY_BUTTON_INVALID',c.id));
    if (['select-filter','check-filter','radio-filter'].includes(c.type)) {
      if (!c.attrs?.data?.list?.ListID || !c.attrs?.display_f) issues.push(problem('FILTER_BOUND_FIELD_UNRESOLVED',c.id));
      if (['options','choices','defaultValue','selected'].some(k => own(c,k) || own(c.attrs,k)) || (own(c,'value') && c.value !== null && c.value !== '')) issues.push(problem('FILTER_SELECTION_OPTIONS_INVALID',c.id));
    }
  }
  const variables = nodes.filter(n => valueTypes.includes(n.type)).map(n => canonical(n.binding || n.attrs?.filterVar));
  for (const c of nodes.filter(n => n.type === 'remove-filters')) {
    if (own(c.attrs,'filter') && (!Array.isArray(c.attrs.filter) || c.attrs.filter.some(v => !variables.includes(canonical(typeof v === 'string' ? v : v.id || v.name))))) issues.push(problem('FILTER_RESET_TARGET_UNRESOLVED',c.id));
  }
  return issues;
}
function validateReportFilters(filters, fieldTypes) {
  if (filters == null) return [];
  const issues = [], keys = new Set(), operators = capability.formReport.operators;
  const checkLayer = (layer, depth = 0) => {
    if (!Array.isArray(layer) || !layer.length) { issues.push(problem('REPORT_FILTER_LAYER_EMPTY','Filters')); return; }
    const pre = layer[0]?.pre;
    for (const c of layer) {
      if (!object(c)) { issues.push(problem('REPORT_FILTER_INVALID','Filters')); continue; }
      if (!c.key || keys.has(c.key)) issues.push(problem('REPORT_FILTER_KEY_INVALID','Filters'));
      keys.add(c.key);
      if (!['and','or'].includes(c.pre) || c.pre !== pre) issues.push(problem('REPORT_FILTER_CONNECTOR_INVALID','Filters'));
      if (own(c,'conditions')) {
        if (depth || c.left !== 'FormID' || c.op !== 's.=' || c.right !== null) issues.push(problem('REPORT_FILTER_GROUP_INVALID','Filters'));
        if (depth < 2) checkLayer(c.conditions, depth + 1);
        continue;
      }
      const type = fieldTypes[c.left];
      if (!type) issues.push(problem('REPORT_FILTER_FIELD_UNRESOLVED','Filters'));
      let valid = false;
      if (operators.generalCondition.includes(c.op)) valid = c.right === null;
      else if (operators.textCondition.includes(c.op)) valid = type === 'text' && typeof c.right === 'string';
      else if (operators.numberCondition.includes(c.op)) valid = type === 'number' && typeof c.right === 'number' && Number.isFinite(c.right);
      else if (operators.booleanValueCondition.includes(c.op)) valid = type === 'boolean' && ['true','false'].includes(c.right);
      else if (operators.booleanPredicateCondition.includes(c.op)) valid = type === 'boolean' && c.right === null;
      else if (operators.dateCondition.includes(c.op)) { const d = new Date(c.right); valid = type === 'date' && typeof c.right === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(c.right) && Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === c.right; }
      else if (c.op === 'in') { const values = parse(c.right); valid = c.left === 'Status' && typeof c.right === 'string' && Array.isArray(values) && values.length > 0 && new Set(values).size === values.length && values.every(v => ['In process','Completed','Rejected','Error','Recalled','Canceled'].includes(v)); }
      if (!valid) issues.push(problem('REPORT_FILTER_VALUE_OR_OPERATOR_INVALID','Filters'));
    }
  };
  checkLayer(filters);
  return issues;
}
function validateReportClosure({ report, source, list, views, profile = 'export', filterFieldTypes = {}, pendingViewIds = [] }) {
  const issues = [], settings = parse(report?.Settings);
  if (pendingViewIds.length) issues.push(problem('REPORT_VIEWS_PENDING','Views'));
  if (!object(settings)) return [problem('REPORT_SETTINGS_INVALID','Settings')];
  if (!source || report.DefKey !== source.Key) issues.push(problem('REPORT_SOURCE_UNRESOLVED','DefKey'));
  const model = list?.ListModel || list?.List;
  if (!model || String(model.ListID) !== String(report.ID) || Number(model.Type) !== 32) issues.push(problem('REPORT_BACKING_LIST_UNRESOLVED','List'));
  const fields = array(settings.Fields), defs = array(list?.Defs || list?.Fields);
  const keys = fields.map(f => String(f.Key || ''));
  if (!fields.length || keys.some(k => !k) || new Set(keys).size !== keys.length) issues.push(problem('REPORT_FIELD_KEY_INVALID','Settings.Fields'));
  if (profile === 'product-14.5') {
    const backingKeys = defs.map(f => f.FieldName === 'Title' ? 'RequestTitle' : f.InternalName);
    if (keys.some(k => !backingKeys.includes(k)) || backingKeys.some(k => k !== 'RequestTitle' && !keys.includes(k)) || new Set(backingKeys).size !== backingKeys.length) issues.push(problem('REPORT_BACKING_FIELDS_MISMATCH','Fields'));
    for (const f of fields) if (!f.IsSystem) {
      if (!capability.formReport.mappings[f.Type]?.includes(f.L_Type)) issues.push(problem('REPORT_FIELD_MAPPING_INVALID','Settings.Fields'));
      if (source?.fieldTypes?.[f.Key] !== f.Type) issues.push(problem('REPORT_FIELD_SOURCE_UNRESOLVED','Settings.Fields'));
    }
  } else if (fields.length !== defs.length) issues.push(problem('REPORT_BACKING_FIELDS_MISMATCH','Fields', 'warning'));
  const layouts = views || list?.Layouts;
  if (!Array.isArray(layouts) || !layouts.length) issues.push(problem('REPORT_VIEWS_MISSING','Views'));
  for (const v of array(layouts)) {
    const lv = parse(v.LayoutView);
    if (v.ListID !== undefined && String(v.ListID) !== String(report.ID)) issues.push(problem('REPORT_VIEW_OWNER_MISMATCH','Views'));
    if (own(lv,'Attr_IsViewDetail') && typeof lv.Attr_IsViewDetail !== 'boolean') issues.push(problem('REPORT_VIEW_FLAG_INVALID','Views'));
    for (const column of array(lv?.layout)) if (column.FieldName && !defs.some(f => f.FieldName === column.FieldName)) issues.push(problem('REPORT_VIEW_FIELD_UNRESOLVED','Views'));
  }
  const attr = parse(report.Attr);
  for (const k of ['isExport','isViewDetail']) if (own(attr,k) && typeof attr[k] !== 'boolean') issues.push(problem('REPORT_FLAG_INVALID',`Attr.${k}`));
  if (profile === 'product-14.5') {
    for (const [key,type] of Object.entries(filterFieldTypes)) if (source?.fieldTypes?.[key] !== type) issues.push(problem('REPORT_FILTER_CONTEXT_MISMATCH',key));
    issues.push(...validateReportFilters(settings.Filters, source?.fieldTypes || {}));
  }
  else if (profile !== 'export') issues.push(problem('PRODUCT_PROFILE_UNSUPPORTED','profile'));
  return issues;
}
function finalizeReport(input) { assertClean(validateReportClosure(input)); return structuredClone(input); }
module.exports = { finalizeReport, capability, validateFilterResource, validateField, patchField, validateSublist, patchSublistField, validateFilterPlan, buildFilterBehavior, validateReportFilters, validateReportClosure };

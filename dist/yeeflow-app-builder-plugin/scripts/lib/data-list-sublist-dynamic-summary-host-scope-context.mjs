const privateState = new WeakMap();

/** Per-layout opaque context for already materialized Data List Sublist summary scope evidence. */
export function createDataListSublistDynamicSummaryHostScopeContext({ parentListId, layoutId, layoutResourceId, fields, resource }) {
  if (![parentListId, layoutId, layoutResourceId].every(decimalText) || layoutId !== layoutResourceId || !Array.isArray(fields) || !resource || typeof resource !== "object") fail("SUBLIST_DYNAMIC_SUMMARY_SCOPE_CONTEXT_INVALID");
  const context = {};
  const state = Object.freeze({ disposed: false, parentListId, layoutId, layoutResourceId, fields: freezeFields(fields, parentListId), tempVars: freezeTempVars(resource.tempVars), controls: freezeControls(resource), selections: new Map() });
  privateState.set(context, state);
  Object.defineProperties(context, { resolve: { enumerable: false, value: (request) => resolve(context, request) }, dispose: { enumerable: false, value: () => dispose(context) } });
  return Object.freeze(context);
}

function resolve(context, request) {
  const state = privateState.get(context); if (!state || state.disposed) fail("SUBLIST_DYNAMIC_SUMMARY_CONTEXT_DISPOSED");
  const key = composite(request); const existing = state.selections.get(key); if (existing) return existing;
  if (request.parentListId !== state.parentListId || request.layoutId !== state.layoutId || request.layoutResourceId !== state.layoutResourceId) fail("SUBLIST_DYNAMIC_SUMMARY_WRONG_SCOPE");
  const parent = exactlyOne(state.fields.filter((field) => field.fieldId === request.parentFieldId && field.type === "list"), "SUBLIST_DYNAMIC_SUMMARY_PARENT_FIELD_INVALID");
  const control = exactlyOne(state.controls.filter((item) => item.id === request.sublistControlId && item.fieldId === parent.fieldId), "SUBLIST_DYNAMIC_SUMMARY_CONTROL_INVALID");
  const summary = exactlyOne(control.summaries.filter((item) => item.id === request.summaryId), "SUBLIST_DYNAMIC_SUMMARY_SUMMARY_INVALID");
  const source = exactlyOne(control.columns.filter((column) => column.id === summary.field && (column.type === "number" || column.type === "decimal")), "SUBLIST_DYNAMIC_SUMMARY_SOURCE_INVALID");
  const binding = resolveBinding(state, summary.binding);
  const descriptor = Object.freeze({ surface: "data-list-sublist-dynamic-summary", scope: Object.freeze({ parentListId: state.parentListId, layoutId: state.layoutId, layoutResourceId: state.layoutResourceId, parentFieldId: parent.fieldId, sublistControlId: control.id, summaryId: summary.id }), sourceColumn: Object.freeze({ id: source.id, idx: source.idx, name: source.name, scalarType: source.type }), summary: Object.freeze({ field: summary.field, type: summary.type, display: summary.display === true }), binding: Object.freeze(binding) });
  state.selections.set(key, descriptor); return descriptor;
}

function dispose(context) { const state = privateState.get(context); if (!state || state.disposed) return; state.selections.clear(); privateState.set(context, { ...state, disposed: true }); }
function resolveBinding(state, binding) { if (!binding || !text(binding.value)) fail("SUBLIST_DYNAMIC_SUMMARY_BINDING_INVALID"); if (binding.prefix === "__list_") { const target = exactlyOne(state.fields.filter((field) => field.fieldName === binding.value), "SUBLIST_DYNAMIC_SUMMARY_LIST_BINDING_INVALID"); return { kind: "data-list-field", prefix: "__list_", value: binding.value, targetDescriptor: Object.freeze({ id: target.fieldId, idx: target.idx }) }; } if (binding.prefix === "__temp_") { const target = exactlyOne(state.tempVars.filter((item) => item.id === binding.value), "SUBLIST_DYNAMIC_SUMMARY_TEMP_BINDING_INVALID"); return { kind: "temp-variable", prefix: "__temp_", value: binding.value, targetDescriptor: Object.freeze({ id: target.id, idx: target.idx }) }; } if (binding.prefix === "__variables_") fail("SUBLIST_DYNAMIC_SUMMARY_APPROVAL_FORM_EXCLUDED"); fail("SUBLIST_DYNAMIC_SUMMARY_BINDING_INVALID"); }
function freezeFields(fields, parentListId) { return Object.freeze(fields.map((field) => Object.freeze({ fieldId: String(field?.FieldID || ""), fieldName: String(field?.FieldName || ""), type: String(field?.Type || "").toLowerCase(), idx: String(field?.FieldIndex ?? "") , listId: String(field?.ListID || "") })).filter((field) => field.listId === parentListId)); }
function freezeTempVars(tempVars) { return Object.freeze((Array.isArray(tempVars) ? tempVars : []).map((item) => Object.freeze({ id: String(item?.id || ""), idx: String(item?.idx || "") }))); }
function freezeControls(resource) { return Object.freeze(find(resource, (item) => item?.type === "list" && text(item?.id) && text(item?.fieldID)).map((control) => Object.freeze({ id: String(control.id), fieldId: String(control.fieldID), columns: Object.freeze((Array.isArray(control.attrs?.["list-variables"]) ? control.attrs["list-variables"] : []).map((column) => Object.freeze({ id: String(column?.id || ""), idx: String(column?.idx || ""), name: String(column?.name || ""), type: String(column?.type || "") }))), summaries: Object.freeze((Array.isArray(control.attrs?.["list-fields-summary"]) ? control.attrs["list-fields-summary"] : []).map((summary) => Object.freeze({ id: String(summary?.id || ""), field: String(summary?.field || ""), type: String(summary?.type || ""), display: summary?.display === true, binding: summary?.binding ? Object.freeze({ prefix: String(summary.binding.prefix || ""), value: String(summary.binding.value || "") }) : null }))) }))); }
function find(value, predicate, out = []) { if (Array.isArray(value)) value.forEach((item) => find(item, predicate, out)); else if (value && typeof value === "object") { if (predicate(value)) out.push(value); Object.values(value).forEach((item) => find(item, predicate, out)); } return out; }
function composite(request) { if (!request || ![request.parentListId, request.layoutId, request.layoutResourceId, request.parentFieldId, request.sublistControlId, request.summaryId].every(text)) fail("SUBLIST_DYNAMIC_SUMMARY_SUMMARY_STANDALONE_FORBIDDEN"); return [request.parentListId, request.layoutId, request.layoutResourceId, request.parentFieldId, request.sublistControlId, request.summaryId].join("|"); }
function exactlyOne(values, code) { if (values.length !== 1) fail(code); return values[0]; }
function text(value) { return typeof value === "string" && value.length > 0; }
function decimalText(value) { return typeof value === "string" && /^\d{1,30}$/u.test(value); }
function fail(code) { throw new Error(code); }

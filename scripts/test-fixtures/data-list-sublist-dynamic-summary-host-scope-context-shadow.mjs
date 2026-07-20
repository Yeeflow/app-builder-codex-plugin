const privateState = new WeakMap();

/** Test-only, per-layout opaque context. Its state is private and never serializes. */
export function createDataListSublistDynamicSummaryHostScopeContext(snapshot) {
  const context = {};
  const input = snapshot && typeof snapshot === "object" ? snapshot : null;
  if (!input || input.surface !== "data-list" || input.layout?.type !== 1 || !nonEmpty(input.parentListId) || !nonEmpty(input.layout?.id) || input.layout.id !== input.layout?.resourceId) throw code("SUBLIST_DYNAMIC_SUMMARY_SCOPE_CONTEXT_INVALID");
  const state = { disposed: false, snapshot: freezeSnapshot(input), selections: new Map() };
  privateState.set(context, state);
  Object.defineProperties(context, {
    resolve: { enumerable: false, value: (request) => resolve(context, request) },
    dispose: { enumerable: false, value: () => { state.disposed = true; state.selections.clear(); } }
  });
  return Object.freeze(context);
}

export function lowerDataListSublistDynamicSummaryIntentForTest(intent) {
  if (!intent || !Object.isFrozen(intent) || intent.surface !== "data-list-sublist-dynamic-summary" || intent.binding?.prefix === "__variables_") throw code("SUBLIST_DYNAMIC_SUMMARY_LOWERING_INVALID");
  return Object.freeze({ id: intent.scope.summaryId, field: intent.summary.field, type: intent.summary.type, display: intent.summary.display, binding: Object.freeze({ prefix: intent.binding.prefix, value: intent.binding.value }) });
}

function resolve(context, request) {
  const state = privateState.get(context);
  if (!state || state.disposed) throw code("SUBLIST_DYNAMIC_SUMMARY_CONTEXT_DISPOSED");
  const key = composite(request);
  if (state.selections.has(key)) return state.selections.get(key);
  const { snapshot } = state;
  if (!sameScope(snapshot, request)) throw code("SUBLIST_DYNAMIC_SUMMARY_WRONG_SCOPE");
  const field = exactlyOne(snapshot.fields.filter((item) => item.fieldId === request.parentFieldId && item.type === "list"), "SUBLIST_DYNAMIC_SUMMARY_PARENT_FIELD_INVALID");
  const control = exactlyOne(snapshot.controls.filter((item) => item.id === request.sublistControlId && item.fieldId === field.fieldId), "SUBLIST_DYNAMIC_SUMMARY_CONTROL_INVALID");
  const summary = exactlyOne(control.summaries.filter((item) => item.id === request.summaryId), "SUBLIST_DYNAMIC_SUMMARY_SUMMARY_INVALID");
  const source = exactlyOne(control.columns.filter((item) => item.id === summary.field && (item.type === "number" || item.type === "decimal")), "SUBLIST_DYNAMIC_SUMMARY_SOURCE_INVALID");
  const binding = resolveBinding(snapshot, summary.binding);
  const descriptor = Object.freeze({
    surface: "data-list-sublist-dynamic-summary",
    scope: Object.freeze({ parentListId: snapshot.parentListId, layoutId: snapshot.layout.id, layoutResourceId: snapshot.layout.resourceId, parentFieldId: field.fieldId, sublistControlId: control.id, summaryId: summary.id }),
    sourceColumn: Object.freeze({ id: source.id, idx: source.idx, name: source.name, scalarType: source.type }),
    summary: Object.freeze({ field: summary.field, type: summary.type, display: summary.display === true }),
    binding: Object.freeze(binding)
  });
  state.selections.set(key, descriptor);
  return descriptor;
}

function resolveBinding(snapshot, binding) {
  if (!binding || !nonEmpty(binding.value)) throw code("SUBLIST_DYNAMIC_SUMMARY_BINDING_MISSING");
  if (binding.prefix === "__list_") {
    const target = exactlyOne(snapshot.fields.filter((item) => item.name === binding.value), "SUBLIST_DYNAMIC_SUMMARY_LIST_BINDING_INVALID");
    return { kind: "data-list-field", prefix: "__list_", value: binding.value, targetDescriptor: Object.freeze({ id: target.fieldId, idx: target.idx }) };
  }
  if (binding.prefix === "__temp_") {
    const target = exactlyOne(snapshot.tempVars.filter((item) => item.id === binding.value), "SUBLIST_DYNAMIC_SUMMARY_TEMP_BINDING_INVALID");
    return { kind: "temp-variable", prefix: "__temp_", value: binding.value, targetDescriptor: Object.freeze({ id: target.id, idx: target.idx }) };
  }
  if (binding.prefix === "__variables_") throw code("SUBLIST_DYNAMIC_SUMMARY_APPROVAL_FORM_EXCLUDED");
  throw code("SUBLIST_DYNAMIC_SUMMARY_BINDING_INVALID");
}

function sameScope(snapshot, request) { return request && snapshot.parentListId === request.parentListId && snapshot.layout.id === request.layoutId && snapshot.layout.resourceId === request.layoutResourceId; }
function composite(request) { if (!request || ![request.parentListId, request.layoutId, request.layoutResourceId, request.parentFieldId, request.sublistControlId, request.summaryId].every(nonEmpty)) throw code("SUBLIST_DYNAMIC_SUMMARY_SUMMARY_STANDALONE_FORBIDDEN"); return [request.parentListId, request.layoutId, request.layoutResourceId, request.parentFieldId, request.sublistControlId, request.summaryId].join("|"); }
function exactlyOne(values, codeValue) { if (values.length !== 1) throw code(codeValue); return values[0]; }
function nonEmpty(value) { return typeof value === "string" && value.length > 0; }
function code(value) { return new Error(value); }
function freezeSnapshot(value) { return Object.freeze(JSON.parse(JSON.stringify(value))); }

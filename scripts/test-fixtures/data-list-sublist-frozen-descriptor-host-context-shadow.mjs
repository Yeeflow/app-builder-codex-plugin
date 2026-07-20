const states = new WeakMap();

export function createSublistDescriptorHostContext() { const context = Object.freeze({}); states.set(context, { raw: new WeakMap(), record: new WeakMap(), disposed: false, selections: 0 }); return context; }
export function selectAndBindRaw(context, rawField, descriptor) { const state = requireState(context); if (state.raw.has(rawField)) { if (state.raw.get(rawField) !== descriptor) fail("SUBLIST_DESCRIPTOR_RECOMPUTATION_FORBIDDEN"); return descriptor; } state.raw.set(rawField, descriptor); state.selections += 1; return descriptor; }
export function bindCompletedRecord(context, rawField, completedRecord) { const state = requireState(context); const descriptor = state.raw.get(rawField); if (!descriptor) fail("SUBLIST_DESCRIPTOR_NOT_SELECTED"); state.record.set(completedRecord, descriptor); }
export function readForRules(context, rawField) { const value = requireState(context).raw.get(rawField); if (!value) fail("SUBLIST_DESCRIPTOR_NOT_SELECTED"); return value; }
export function readForCustomForm(context, completedRecord) { const value = requireState(context).record.get(completedRecord); if (!value) fail("SUBLIST_COMPLETED_RECORD_NOT_BOUND"); return value; }
export function selectionCount(context) { return requireState(context).selections; }
export function disposeSublistDescriptorHostContext(context) { const state = requireState(context); state.disposed = true; state.raw = new WeakMap(); state.record = new WeakMap(); }
function requireState(context) { const state = states.get(context); if (!state || state.disposed) fail("SUBLIST_DESCRIPTOR_CONTEXT_DISPOSED"); return state; } function fail(code) { throw new Error(code); }

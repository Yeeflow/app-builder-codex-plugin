/**
 * Phase 9N host-only context. The closure owns private WeakMaps for one
 * build invocation; neither the context nor its descriptor bindings are data.
 */
export function createDataListEmbeddedSublistDescriptorHostContext() {
  let disposed = false;
  let selections = 0;
  let rawToDescriptor = new WeakMap();
  let recordToDescriptor = new WeakMap();

  const requireLive = () => {
    if (disposed) throw new Error("SUBLIST_DESCRIPTOR_CONTEXT_DISPOSED");
  };
  const requireObject = (value, code) => {
    if (!value || (typeof value !== "object" && typeof value !== "function")) throw new Error(code);
  };
  const context = {
    selectAndBindRaw(rawField, descriptor) {
      requireLive();
      requireObject(rawField, "SUBLIST_DESCRIPTOR_RAW_FIELD_INVALID");
      requireObject(descriptor, "SUBLIST_DESCRIPTOR_INVALID");
      const existing = rawToDescriptor.get(rawField);
      if (existing) {
        if (existing !== descriptor) throw new Error("SUBLIST_DESCRIPTOR_RECOMPUTATION_FORBIDDEN");
        return existing;
      }
      rawToDescriptor.set(rawField, descriptor);
      selections += 1;
      return descriptor;
    },
    bindCompletedRecord(rawField, completedRecord) {
      requireLive();
      requireObject(rawField, "SUBLIST_DESCRIPTOR_RAW_FIELD_INVALID");
      requireObject(completedRecord, "SUBLIST_COMPLETED_RECORD_INVALID");
      const descriptor = rawToDescriptor.get(rawField);
      if (!descriptor) throw new Error("SUBLIST_DESCRIPTOR_NOT_SELECTED");
      const existing = recordToDescriptor.get(completedRecord);
      if (existing && existing !== descriptor) throw new Error("SUBLIST_COMPLETED_RECORD_CONTEXT_MISMATCH");
      recordToDescriptor.set(completedRecord, descriptor);
      return descriptor;
    },
    isSelectedRaw(rawField) {
      requireLive();
      return Boolean(rawToDescriptor.get(rawField));
    },
    isBoundCompletedRecord(completedRecord) {
      requireLive();
      return Boolean(recordToDescriptor.get(completedRecord));
    },
    readForRules(rawField) {
      requireLive();
      const descriptor = rawToDescriptor.get(rawField);
      if (!descriptor) throw new Error("SUBLIST_DESCRIPTOR_NOT_SELECTED");
      return descriptor;
    },
    readForCustomForm(completedRecord) {
      requireLive();
      const descriptor = recordToDescriptor.get(completedRecord);
      if (!descriptor) throw new Error("SUBLIST_COMPLETED_RECORD_NOT_BOUND");
      return descriptor;
    },
    selectionCount() {
      requireLive();
      return selections;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      rawToDescriptor = new WeakMap();
      recordToDescriptor = new WeakMap();
    },
  };
  return Object.freeze(context);
}

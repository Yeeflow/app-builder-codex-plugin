/** Test-only host lowering. It consumes explicit host IDs and returns fresh metadata without graph mutation. */
export function lowerDataListSublistNestedControlPlacementForTest(intent, hostBindings) {
  if (!intent || !Object.isFrozen(intent) || !Array.isArray(hostBindings) || hostBindings.length !== intent.placements.length) throw new Error("SUBLIST_NESTED_CONTROL_HOST_LOWERING_INVALID");
  const seen = new Set();
  return Object.freeze(intent.placements.map((placement) => {
    const host = hostBindings.find((item) => item?.childControlReference === placement.childControlReference);
    if (!host || !text(host.controlId) || !text(host.parentBinding) || !text(host.parentControlId) || seen.has(host.childControlReference)) throw new Error("SUBLIST_NESTED_CONTROL_HOST_BINDING_INVALID");
    seen.add(host.childControlReference);
    const control = { id: host.controlId, label: placement.column.name, binding: placement.column.id, attrs: { list_field: true, list_field_binding: host.parentBinding, list_control_id: host.parentControlId }, type: placement.control.type, displayLabel: [null, true] };
    if (placement.control.defaultValue !== null) control.value = placement.control.defaultValue;
    return Object.freeze({ idx: placement.column.idx, id: placement.column.id, name: placement.column.name, type: placement.column.type, editable: placement.column.editable, control: Object.freeze(control) });
  }));
}
function text(value) { return typeof value === "string" && value.length > 0; }

/** Lowers frozen intent and explicit host IDs to fresh metadata; it never loads or mutates a graph. */
export function lowerDataListSublistNestedControlPlacementAtHost(intent, bindings) {
    if (!intent || !Object.isFrozen(intent) || !Array.isArray(bindings) || bindings.length !== intent.placements?.length || intent.template !== undefined || intent.resource !== undefined)
        fail("SUBLIST_NESTED_CONTROL_LOWERING_INVALID");
    const used = new Set();
    const output = intent.placements.map((placement) => {
        const binding = bindings.find((item) => item?.childControlReference === placement.childControlReference);
        if (!binding || !text(binding.controlId) || !text(binding.parentBinding) || !text(binding.parentControlId) || used.has(binding.childControlReference))
            fail("SUBLIST_NESTED_CONTROL_HOST_BINDING_INVALID");
        used.add(binding.childControlReference);
        const control = { id: binding.controlId, label: placement.column.name, binding: placement.column.id, attrs: { list_field: true, list_field_binding: binding.parentBinding, list_control_id: binding.parentControlId }, type: placement.control.type, displayLabel: [null, true] };
        if (placement.control.type === "datepicker")
            control.value = null;
        else if (placement.control.defaultValue !== null)
            control.value = placement.control.defaultValue;
        return Object.freeze({ idx: placement.column.idx, id: placement.column.id, name: placement.column.name, type: placement.column.type, editable: placement.column.editable, control: Object.freeze(control) });
    });
    return Object.freeze(output);
}
function text(value) { return typeof value === "string" && value.length > 0; }
function fail(code) { throw new Error(code); }
//# sourceMappingURL=internal-data-list-sublist-nested-control-placement-lowering.js.map
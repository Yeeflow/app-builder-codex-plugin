export type DataListSublistNestedControlPlacementHostIntent = Readonly<{ readonly surface: "data-list-sublist-nested-control-placement"; readonly placements: readonly Readonly<{ readonly childControlReference: string; readonly column: Readonly<{ readonly id: string; readonly idx: string; readonly name: string; readonly type: "text" | "date" | "number" | "boolean"; readonly editable: boolean }>; readonly control: Readonly<{ readonly type: "input" | "datepicker" | "input_number" | "switch"; readonly defaultValue: null | false }> }>[] }>;
export type DataListSublistNestedControlHostBinding = Readonly<{ readonly childControlReference: string; readonly controlId: string; readonly parentBinding: string; readonly parentControlId: string }>;

/** Lowers frozen intent and explicit host IDs to fresh metadata; it never loads or mutates a graph. */
export function lowerDataListSublistNestedControlPlacementAtHost(intent: DataListSublistNestedControlPlacementHostIntent, bindings: readonly DataListSublistNestedControlHostBinding[]): readonly Readonly<Record<string, unknown>>[] {
  if (!intent || !Object.isFrozen(intent) || !Array.isArray(bindings) || bindings.length !== intent.placements?.length || (intent as Record<string, unknown>).template !== undefined || (intent as Record<string, unknown>).resource !== undefined) fail("SUBLIST_NESTED_CONTROL_LOWERING_INVALID");
  const used = new Set<string>();
  const output = intent.placements.map((placement) => {
    const binding = bindings.find((item) => item?.childControlReference === placement.childControlReference);
    if (!binding || !text(binding.controlId) || !text(binding.parentBinding) || !text(binding.parentControlId) || used.has(binding.childControlReference)) fail("SUBLIST_NESTED_CONTROL_HOST_BINDING_INVALID");
    used.add(binding.childControlReference);
    const control: Record<string, unknown> = { id: binding.controlId, label: placement.column.name, binding: placement.column.id, attrs: { list_field: true, list_field_binding: binding.parentBinding, list_control_id: binding.parentControlId }, type: placement.control.type, displayLabel: [null, true] };
    if (placement.control.type === "datepicker") control.value = null;
    else if (placement.control.defaultValue !== null) control.value = placement.control.defaultValue;
    return Object.freeze({ idx: placement.column.idx, id: placement.column.id, name: placement.column.name, type: placement.column.type, editable: placement.column.editable, control: Object.freeze(control) });
  });
  return Object.freeze(output);
}
function text(value: unknown): value is string { return typeof value === "string" && value.length > 0; }
function fail(code: string): never { throw new Error(code); }

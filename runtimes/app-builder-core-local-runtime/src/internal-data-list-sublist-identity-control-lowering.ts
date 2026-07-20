export type DataListSublistIdentityControlHostIntent = Readonly<{
  surface: "data-list-sublist-identity-control";
  column: Readonly<{ id: string; idx: string; name: string; type: "user"; editable: boolean }>;
  control: Readonly<{ type: "identity-picker"; displayLabel: readonly [null, true] }>;
}>;
export type DataListSublistIdentityControlHostBinding = Readonly<{ controlId: string; parentBinding: string; parentControlId: string }>;

/** Lowers only fresh, static list-field metadata. Identity selection remains product-runtime owned. */
export function lowerDataListSublistIdentityControlIntentAtHost(intent: DataListSublistIdentityControlHostIntent, binding: DataListSublistIdentityControlHostBinding): Readonly<Record<string, unknown>> {
  if (!intent || !Object.isFrozen(intent) || !identityControlHostText(binding?.controlId) || !identityControlHostText(binding?.parentBinding) || !identityControlHostText(binding?.parentControlId)) throw Error("SUBLIST_IDENTITY_CONTROL_HOST_BINDING_INVALID");
  const column = intent.column;
  if (!identityControlHostText(column?.id) || !identityControlHostText(column.idx) || !identityControlHostText(column.name) || column.type !== "user" || typeof column.editable !== "boolean" || intent.control?.type !== "identity-picker") throw Error("SUBLIST_IDENTITY_CONTROL_LOWERING_INVALID");
  return Object.freeze({
    idx: column.idx,
    id: column.id,
    name: column.name,
    type: "user",
    editable: column.editable,
    control: Object.freeze({
      id: binding.controlId,
      label: column.name,
      binding: column.id,
      displayLabel: Object.freeze([null, true]),
      type: "identity-picker",
      attrs: Object.freeze({ list_field: true, list_field_binding: binding.parentBinding, list_control_id: binding.parentControlId }),
    }),
  });
}

const identityControlHostText = (value: unknown): value is string => typeof value === "string" && value.length > 0;

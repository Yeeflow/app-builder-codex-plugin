export type DataListSublistIdentityControlIntentInput = Readonly<{
  surface: "data-list-sublist-identity-control";
  scope: Readonly<{
    parentListId: string;
    parentFieldId: string;
    layoutId: string;
    layoutResourceId: string;
    parentControlReference: string;
    listFieldsSlotReference: "attrs.list-fields";
    childControlSlotReference: "list-field.control";
  }>;
  column: Readonly<{ id: string; idx: string; name: string; type: "user"; editable: boolean }>;
  control?: unknown;
  template?: unknown;
  resource?: unknown;
  package?: unknown;
  runtime?: unknown;
}>;

export type DataListSublistIdentityControlFinding = Readonly<{ code: string; message: string }>;
export type DataListSublistIdentityControlIntent = Readonly<{
  surface: "data-list-sublist-identity-control";
  scope: DataListSublistIdentityControlIntentInput["scope"];
  column: DataListSublistIdentityControlIntentInput["column"];
  control: Readonly<{ type: "identity-picker"; displayLabel: readonly [null, true] }>;
}>;
export type DataListSublistIdentityControlIntentResult = Readonly<{ intent: DataListSublistIdentityControlIntent | null; findings: readonly DataListSublistIdentityControlFinding[] }>;

/** Projects static Data List embedded-user configuration only; it has no identity runtime semantics. */
export function projectDataListSublistIdentityControlIntentInternal(input: DataListSublistIdentityControlIntentInput): DataListSublistIdentityControlIntentResult {
  const findings: DataListSublistIdentityControlFinding[] = [];
  if (input?.surface !== "data-list-sublist-identity-control") findings.push(identityControlFinding("SUBLIST_IDENTITY_CONTROL_SCOPE_MISMATCH"));
  if (input?.control !== undefined || input?.template !== undefined || input?.resource !== undefined || input?.package !== undefined || input?.runtime !== undefined) findings.push(identityControlFinding("SUBLIST_IDENTITY_CONTROL_HOST_STATE_FORBIDDEN"));
  const scope = input?.scope;
  const column = input?.column;
  if (!scope || ![scope.parentListId, scope.parentFieldId, scope.layoutId, scope.layoutResourceId].every(identityControlLosslessId) || !identityControlText(scope.parentControlReference) || scope.listFieldsSlotReference !== "attrs.list-fields" || scope.childControlSlotReference !== "list-field.control") findings.push(identityControlFinding("SUBLIST_IDENTITY_CONTROL_SCOPE_MISMATCH"));
  if (!column || !identityControlText(column.id) || !identityControlText(column.idx) || !identityControlText(column.name) || column.type !== "user" || typeof column.editable !== "boolean") findings.push(identityControlFinding("SUBLIST_IDENTITY_CONTROL_COLUMN_INVALID"));
  return findings.length
    ? identityControlFrozen(null, findings)
    : identityControlFrozen(Object.freeze({ surface: "data-list-sublist-identity-control", scope: Object.freeze({ ...scope! }), column: Object.freeze({ ...column! }), control: Object.freeze({ type: "identity-picker", displayLabel: Object.freeze([null, true]) as readonly [null, true] }) }), []);
}

const identityControlLosslessId = (value: unknown): value is string => typeof value === "string" && /^\d{1,30}$/.test(value);
const identityControlText = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const identityControlFinding = (code: string) => Object.freeze({ code, message: code });
const identityControlFrozen = (intent: DataListSublistIdentityControlIntent | null, findings: readonly DataListSublistIdentityControlFinding[]) => Object.freeze({ intent, findings: Object.freeze([...findings]) });

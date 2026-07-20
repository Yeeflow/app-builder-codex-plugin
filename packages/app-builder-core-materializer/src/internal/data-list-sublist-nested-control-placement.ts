export type NestedScalarType = "text" | "date" | "number" | "boolean";

export interface DataListSublistNestedControlPlacementInput {
  readonly surface: "data-list-sublist-nested-control-placement";
  readonly templateSnapshot: Readonly<{ templateId: string; templateScope: string; parentNodeReference: string; listFieldsSlotReference: "attrs.list-fields"; childControlSlotReference: "list-field.control" }>;
  readonly scope: Readonly<{ parentListId: string; parentFieldId: string; parentControlReference: string }>;
  readonly columns: readonly Readonly<{ id: string; idx: string; name: string; type: NestedScalarType; editable: boolean; childControlReference: string }>[];
  readonly template?: unknown;
  readonly resource?: unknown;
  readonly controlId?: unknown;
  readonly runtimeBinding?: unknown;
}
export interface NestedControlFinding { readonly code: string; readonly message: string; }
export interface NestedControlPlacementIntent { readonly surface: "data-list-sublist-nested-control-placement"; readonly templateSnapshot: Readonly<{ templateId: string; templateScope: string; parentNodeReference: string; listFieldsSlotReference: "attrs.list-fields"; childControlSlotReference: "list-field.control" }>; readonly scope: Readonly<{ parentListId: string; parentFieldId: string; parentControlReference: string }>; readonly placements: readonly Readonly<{ ordinal: number; childControlReference: string; slotReference: "attrs.list-fields"; column: Readonly<{ id: string; idx: string; name: string; type: NestedScalarType; editable: boolean }>; control: Readonly<{ type: "input" | "datepicker" | "input_number" | "switch"; defaultValue: null | false }>; }>[]; }
export interface NestedControlPlacementResult { readonly intent: NestedControlPlacementIntent | null; readonly findings: readonly NestedControlFinding[]; }

const scalarTypes = new Set<NestedScalarType>(["text", "date", "number", "boolean"]);

/** Internal-only projection. It never loads, allocates, mutates, inserts, or binds a template graph. */
export function projectDataListSublistNestedControlPlacementIntentInternal(input: DataListSublistNestedControlPlacementInput): NestedControlPlacementResult {
  const findings: NestedControlFinding[] = [];
  if (input?.surface !== "data-list-sublist-nested-control-placement") findings.push(finding("SUBLIST_NESTED_CONTROL_TEMPLATE_SNAPSHOT_INVALID"));
  if (input?.template !== undefined || input?.resource !== undefined || input?.controlId !== undefined || input?.runtimeBinding !== undefined) findings.push(finding("SUBLIST_NESTED_CONTROL_CORE_HOST_STATE_FORBIDDEN"));
  const snapshot = input?.templateSnapshot;
  if (!snapshot) findings.push(finding("SUBLIST_NESTED_CONTROL_TEMPLATE_SNAPSHOT_MISSING"));
  else if (!text(snapshot.templateId) || !text(snapshot.templateScope) || !text(snapshot.parentNodeReference) || snapshot.listFieldsSlotReference !== "attrs.list-fields" || snapshot.childControlSlotReference !== "list-field.control") findings.push(finding("SUBLIST_NESTED_CONTROL_TEMPLATE_SNAPSHOT_INVALID"));
  const scope = input?.scope;
  if (!scope || !lossless(scope.parentListId) || !lossless(scope.parentFieldId) || !text(scope.parentControlReference)) findings.push(finding("SUBLIST_NESTED_CONTROL_SCOPE_MISMATCH"));
  const columns = Array.isArray(input?.columns) ? input.columns : [];
  if (!columns.length) findings.push(finding("SUBLIST_NESTED_CONTROL_CHILD_REFERENCE_MISSING"));
  const references = new Set<string>();
  columns.forEach((column) => {
    if (!text(column?.childControlReference)) findings.push(finding("SUBLIST_NESTED_CONTROL_CHILD_REFERENCE_MISSING"));
    else if (references.has(column.childControlReference)) findings.push(finding("SUBLIST_NESTED_CONTROL_CHILD_REFERENCE_DUPLICATE"));
    else references.add(column.childControlReference);
    if (!text(column?.id) || !text(column?.idx) || !text(column?.name) || !scalarTypes.has(column?.type) || typeof column?.editable !== "boolean") findings.push(finding("SUBLIST_NESTED_CONTROL_CHILD_REFERENCE_INVALID"));
  });
  if (findings.length) return frozen(null, findings);
  const immutableSnapshot = Object.freeze({ templateId: snapshot!.templateId, templateScope: snapshot!.templateScope, parentNodeReference: snapshot!.parentNodeReference, listFieldsSlotReference: "attrs.list-fields" as const, childControlSlotReference: "list-field.control" as const });
  const immutableScope = Object.freeze({ parentListId: scope!.parentListId, parentFieldId: scope!.parentFieldId, parentControlReference: scope!.parentControlReference });
  const placements = Object.freeze(columns.map((column, ordinal) => Object.freeze({ ordinal, childControlReference: column.childControlReference, slotReference: "attrs.list-fields" as const, column: Object.freeze({ id: column.id, idx: column.idx, name: column.name, type: column.type, editable: column.editable }), control: Object.freeze(controlKind(column.type)) })));
  return frozen(Object.freeze({ surface: "data-list-sublist-nested-control-placement" as const, templateSnapshot: immutableSnapshot, scope: immutableScope, placements }), []);
}

function controlKind(type: NestedScalarType) { return type === "date" ? { type: "datepicker" as const, defaultValue: null } : type === "number" ? { type: "input_number" as const, defaultValue: null } : type === "boolean" ? { type: "switch" as const, defaultValue: false as const } : { type: "input" as const, defaultValue: null }; }
function lossless(value: unknown): value is string { return typeof value === "string" && /^\d{1,30}$/u.test(value); }
function text(value: unknown): value is string { return typeof value === "string" && value.length > 0; }
function finding(code: string): NestedControlFinding { return Object.freeze({ code, message: code }); }
function frozen(intent: NestedControlPlacementIntent | null, findings: readonly NestedControlFinding[]): NestedControlPlacementResult { return Object.freeze({ intent, findings: Object.freeze([...findings]) }); }

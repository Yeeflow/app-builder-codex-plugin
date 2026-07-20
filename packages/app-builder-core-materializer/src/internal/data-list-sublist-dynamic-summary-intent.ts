export type DynamicSummaryBindingKind = "data-list-field" | "temp-variable";

export interface DataListSublistDynamicSummaryIntentInput {
  readonly surface: "data-list-sublist-dynamic-summary";
  readonly scope: Readonly<{ parentListId: string; layoutId: string; layoutResourceId: string; parentFieldId: string; sublistControlId: string; summaryId: string }>;
  readonly sourceColumn: Readonly<{ id: string; idx: string; name: string; scalarType: "number" | "decimal" }>;
  readonly summary: Readonly<{ field: string; type: "total" | "average" | "minimum" | "maximum" | "count"; display: boolean }>;
  readonly binding: Readonly<{ kind: DynamicSummaryBindingKind; prefix: "__list_" | "__temp_"; value: string; targetDescriptor: Readonly<{ id: string; idx: string }> }>;
  readonly runtimeExpression?: unknown;
  readonly hostContext?: unknown;
  readonly temporaryVariableReference?: unknown;
}

export interface DataListSublistDynamicSummaryFinding { readonly code: string; readonly message: string; }
export interface DataListSublistDynamicSummaryIntent {
  readonly surface: "data-list-sublist-dynamic-summary";
  readonly scope: Readonly<{ parentListId: string; layoutId: string; layoutResourceId: string; parentFieldId: string; sublistControlId: string; summaryId: string }>;
  readonly sourceColumn: Readonly<{ id: string; idx: string; name: string; scalarType: "number" | "decimal" }>;
  readonly summary: Readonly<{ field: string; type: "total" | "average" | "minimum" | "maximum" | "count"; display: boolean }>;
  readonly binding: Readonly<{ kind: DynamicSummaryBindingKind; prefix: "__list_" | "__temp_"; value: string; targetDescriptor: Readonly<{ id: string; idx: string }> }>;
}
export interface DataListSublistDynamicSummaryIntentResult { readonly intent: DataListSublistDynamicSummaryIntent | null; readonly descriptor: Readonly<Record<string, unknown>> | null; readonly findings: readonly DataListSublistDynamicSummaryFinding[]; }

const operations = new Set(["total", "average", "minimum", "maximum", "count"]);

/** Internal-only projection. Host scope resolution, variable lifecycle, and runtime execution are prohibited here. */
export function projectDataListSublistDynamicSummaryIntentInternal(input: DataListSublistDynamicSummaryIntentInput): DataListSublistDynamicSummaryIntentResult {
  const findings: DataListSublistDynamicSummaryFinding[] = [];
  if (input?.surface !== "data-list-sublist-dynamic-summary") findings.push(finding("SUBLIST_DYNAMIC_SUMMARY_SURFACE_INVALID"));
  if (input?.hostContext !== undefined || input?.temporaryVariableReference !== undefined) findings.push(finding("SUBLIST_DYNAMIC_SUMMARY_HOST_CONTEXT_FORBIDDEN"));
  if (input?.runtimeExpression !== undefined && input?.runtimeExpression !== null) findings.push(finding("SUBLIST_DYNAMIC_SUMMARY_RUNTIME_EXPRESSION_FORBIDDEN"));
  const scope = input?.scope;
  if (!scope || ![scope.parentListId, scope.layoutId, scope.layoutResourceId, scope.parentFieldId, scope.sublistControlId, scope.summaryId].every(text)) findings.push(finding("SUBLIST_DYNAMIC_SUMMARY_SCOPE_INVALID"));
  if (scope && scope.summaryId && (!scope.parentFieldId || !scope.sublistControlId)) findings.push(finding("SUBLIST_DYNAMIC_SUMMARY_SUMMARY_STANDALONE_FORBIDDEN"));
  const source = input?.sourceColumn;
  if (!source || !text(source.id) || !text(source.idx) || !text(source.name) || (source.scalarType !== "number" && source.scalarType !== "decimal")) findings.push(finding("SUBLIST_DYNAMIC_SUMMARY_SOURCE_INVALID"));
  const summary = input?.summary;
  if (!summary || !text(summary.field) || !operations.has(summary.type) || summary.field !== source?.id) findings.push(finding("SUBLIST_DYNAMIC_SUMMARY_SUMMARY_INVALID"));
  const binding = input?.binding;
  const bindingValid = binding && text(binding.value) && binding.targetDescriptor && text(binding.targetDescriptor.id) && text(binding.targetDescriptor.idx) && ((binding.kind === "data-list-field" && binding.prefix === "__list_") || (binding.kind === "temp-variable" && binding.prefix === "__temp_"));
  if (!bindingValid) findings.push(finding("SUBLIST_DYNAMIC_SUMMARY_BINDING_INVALID"));
  if (findings.length) return frozenResult(null, null, findings);
  const immutableScope = Object.freeze({ parentListId: scope!.parentListId, layoutId: scope!.layoutId, layoutResourceId: scope!.layoutResourceId, parentFieldId: scope!.parentFieldId, sublistControlId: scope!.sublistControlId, summaryId: scope!.summaryId });
  const immutableSource = Object.freeze({ id: source!.id, idx: source!.idx, name: source!.name, scalarType: source!.scalarType });
  const immutableSummary = Object.freeze({ field: summary!.field, type: summary!.type, display: summary!.display === true });
  const targetDescriptor = Object.freeze({ id: binding!.targetDescriptor.id, idx: binding!.targetDescriptor.idx });
  const immutableBinding = Object.freeze({ kind: binding!.kind, prefix: binding!.prefix, value: binding!.value, targetDescriptor });
  const intent = Object.freeze({ surface: "data-list-sublist-dynamic-summary" as const, scope: immutableScope, sourceColumn: immutableSource, summary: immutableSummary, binding: immutableBinding });
  const descriptor = Object.freeze({ scope: immutableScope, field: immutableSummary.field, type: immutableSummary.type, display: immutableSummary.display, binding: immutableBinding });
  return frozenResult(intent, descriptor, []);
}

function text(value: unknown): value is string { return typeof value === "string" && value.length > 0; }
function finding(code: string): DataListSublistDynamicSummaryFinding { return Object.freeze({ code, message: code }); }
function frozenResult(intent: DataListSublistDynamicSummaryIntent | null, descriptor: Readonly<Record<string, unknown>> | null, findings: readonly DataListSublistDynamicSummaryFinding[]): DataListSublistDynamicSummaryIntentResult { return Object.freeze({ intent, descriptor, findings: Object.freeze([...findings]) }); }

export type DynamicSummaryOperation = "total" | "average" | "minimum" | "maximum" | "count";
export type DataListSublistDynamicSummaryHostIntent = Readonly<{
  surface: "data-list-sublist-dynamic-summary";
  scope: Readonly<{ parentListId: string; layoutId: string; layoutResourceId: string; parentFieldId: string; sublistControlId: string; summaryId: string }>;
  sourceColumn: Readonly<{ id: string; idx: string; name: string; scalarType: "number" | "decimal" }>;
  summary: Readonly<{ field: string; type: DynamicSummaryOperation; display: boolean }>;
  binding: Readonly<{ kind: "data-list-field" | "temp-variable"; prefix: "__list_" | "__temp_"; value: string; targetDescriptor: Readonly<{ id: string; idx: string }> }>;
}>;
export type DataListSublistDynamicSummaryMetadata = Readonly<{ id: string; field: string; type: DynamicSummaryOperation; display: boolean; binding: Readonly<{ prefix: "__list_" | "__temp_"; value: string }> }>;

/** Lowers one frozen scope-resolved intent without resolving or mutating any host inventory. */
export function lowerDataListSublistDynamicSummaryIntentAtHost(intent: DataListSublistDynamicSummaryHostIntent): DataListSublistDynamicSummaryMetadata {
  const value = intent as unknown as Record<string, unknown>;
  if (!intent || !Object.isFrozen(intent) || value.runtimeExpression !== undefined || value.hostContext !== undefined || value.tempVars !== undefined || value.template !== undefined || value.resource !== undefined) fail("SUBLIST_DYNAMIC_SUMMARY_LOWERING_INVALID");
  const scope = intent.scope; const source = intent.sourceColumn; const summary = intent.summary; const binding = intent.binding;
  if (!scope || ![scope.parentListId, scope.layoutId, scope.layoutResourceId, scope.parentFieldId, scope.sublistControlId, scope.summaryId].every(text) || !source || !text(source.id) || !text(source.idx) || !text(source.name) || !summary || summary.field !== source.id || !operations.has(summary.type) || !binding || !text(binding.value) || !text(binding.targetDescriptor?.id) || !text(binding.targetDescriptor?.idx)) fail("SUBLIST_DYNAMIC_SUMMARY_SCOPE_INVALID");
  if (!((binding.kind === "data-list-field" && binding.prefix === "__list_") || (binding.kind === "temp-variable" && binding.prefix === "__temp_"))) fail("SUBLIST_DYNAMIC_SUMMARY_BINDING_INVALID");
  return Object.freeze({ id: scope.summaryId, field: summary.field, type: summary.type, display: summary.display === true, binding: Object.freeze({ prefix: binding.prefix, value: binding.value }) });
}
const operations = new Set<DynamicSummaryOperation>(["total", "average", "minimum", "maximum", "count"]);
function text(value: unknown): value is string { return typeof value === "string" && value.length > 0; }
function fail(code: string): never { throw new Error(code); }

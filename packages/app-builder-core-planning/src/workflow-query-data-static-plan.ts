export type WorkflowQueryDataStaticPlanKind = "mode" | "query-properties" | "field-map" | "list-variable" | "loop-properties";

export interface WorkflowQueryDataStaticPlanInput {
  readonly kind: WorkflowQueryDataStaticPlanKind;
  readonly value?: unknown;
}

export interface WorkflowQueryDataStaticPlanProjection {
  readonly kind: WorkflowQueryDataStaticPlanKind;
  readonly value: unknown;
}

const MODE_ALIASES = new Map<string, string>([
  ["multiple_count_only", "multiple_count_only"], ["count_only", "multiple_count_only"],
  ["single_to_variables", "single_to_variables"], ["single", "single_to_variables"],
  ["multiple_to_list_variable", "multiple_to_list_variable"], ["multiple_to_list", "multiple_to_list_variable"],
  ["multiple_to_text_variable", "multiple_to_text_variable"], ["multiple_to_text", "multiple_to_text_variable"],
]);
const SOURCE_TYPES = new Set([1, 16, 32]);

/**
 * Projects one immutable Workflow Query Data static-plan request. It owns only
 * deterministic DTO normalization and deliberately excludes query execution,
 * runtime expressions, workflow mutation, resource/package state, and UI work.
 */
export function projectWorkflowQueryDataStaticPlan(input: WorkflowQueryDataStaticPlanInput): Readonly<WorkflowQueryDataStaticPlanProjection> {
  const kind = input?.kind;
  const value = input?.value;
  if (kind === "mode") return freeze({ kind, value: normalizeMode(value) });
  if (kind === "query-properties") return freeze({ kind, value: queryProperties(asRecord(value)) });
  if (kind === "field-map") return freeze({ kind, value: parseFieldMap(value) });
  if (kind === "list-variable") return freeze({ kind, value: listVariable(asRecord(value)) });
  if (kind === "loop-properties") return freeze({ kind, value: loopProperties(asRecord(value)) });
  throw new Error(`Unsupported Workflow Query Data static-plan projection kind: ${String(kind || "")}`);
}

function queryProperties(config: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const mode = normalizeMode(config.mode) || "multiple_to_text_variable";
  const pageIndex = positiveInteger(config.pageIndex, 1);
  const pageSize = boundedPageSize(config.pageSize, mode === "multiple_to_list_variable" ? 1000 : 100);
  const fieldMap = normalizeFieldMap(config.fieldMap);
  const fields = Array.isArray(config.fields) ? clone(config.fields) : [];
  const resultVariable = clean(config.resultVariable);
  const countVariable = clean(config.countVariable);
  const result: Record<string, unknown> = { type: mode === "single_to_variables" ? "single" : "multiple", pageIndex, pageSize };
  if (mode === "multiple_count_only") Object.assign(result, { fieldMap: null, listName: "", vartype: "", listParent: "", fields: null, totalCount: countVariable, querycount_prefix: "__variables_" });
  else if (mode === "single_to_variables") Object.assign(result, { fieldMap, listName: "", fields: null });
  else if (mode === "multiple_to_list_variable") Object.assign(result, { fieldMap, listName: resultVariable, vartype: "list", listParent: "__variables_", fields: null, ...(countVariable ? { totalCount: countVariable, querycount_prefix: "__variables_" } : {}) });
  else Object.assign(result, { fieldMap: null, listName: resultVariable, vartype: "text", listParent: "__variables_", fields, ...(countVariable ? { totalCount: countVariable, querycount_prefix: "__variables_" } : {}) });
  const listType = Number.isInteger(Number(config.listType)) ? Number(config.listType) : 1;
  if (!SOURCE_TYPES.has(listType)) throw new Error(`Unsupported export-proven Workflow Query Data source type: ${listType}`);
  const sorts = Array.isArray(config.sorts) ? clone(config.sorts) : [];
  if (sorts.length > 2) throw new Error("Workflow Query Data supports at most 2 sort fields");
  return { name: clean(config.name) || "Query data", appid: Number.isInteger(Number(config.appId)) ? Number(config.appId) : 41, listsetid: String(config.listSetId || ""), listid: String(config.listId || ""), listtype: listType, filters: Array.isArray(config.filters) ? clone(config.filters) : [], sorts, result };
}

function listVariable(input: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const variableId = clean(input.id); const refId = clean(input.listRefId); const fields = Array.isArray(input.fields) ? input.fields : [];
  return { variable: { idx: variableId, id: variableId, name: clean(input.name) || variableId, type: "list", editable: true, value: refId }, listref: { id: refId, name: clean(input.name) || refId, fields: fields.map((field) => { const item = asRecord(field); return { idx: clean(item.idx) || clean(item.id), id: clean(item.id), name: clean(item.name) || clean(item.id), type: clean(item.type) || "text", editable: item.editable !== false }; }), idx: refId } };
}

function loopProperties(input: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const mode = clean(input.loopType || "list").toLowerCase();
  if (mode === "list") return { name: clean(input.name) || "Loop through list items", loopType: "list", loopValue: { prefix: input.sourceParent === "__list_" ? "__list_" : "__variables_", value: clean(input.source) } };
  if (mode === "values" || mode === "number") return { name: clean(input.name) || (mode === "values" ? "Loop through multiple values" : "Loop for fixed times"), loopType: mode, loopValue: { type: 2, value: Array.isArray(input.expression) ? clone(input.expression) : [] } };
  return { name: clean(input.name) || "Loop", loopType: mode, loopValue: {} };
}

function parseFieldMap(value: unknown): Record<string, string> {
  if (value && typeof value === "object" && !Array.isArray(value)) return normalizeFieldMap(value);
  const output: Record<string, string> = {};
  for (const pair of String(value || "").split(/\s*;\s*/).filter(Boolean)) {
    const parts = pair.split(/\s*(?:->|=>|→)\s*/);
    if (parts.length !== 2) continue;
    const source = clean(parts[0]); const target = clean(parts[1]);
    if (source && target) output[source] = target;
  }
  return output;
}

function normalizeMode(value: unknown): string { return MODE_ALIASES.get(String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_")) || ""; }
function normalizeFieldMap(value: unknown): Record<string, string> { if (!value || typeof value !== "object" || Array.isArray(value)) return {}; return Object.fromEntries(Object.entries(value).map(([source, target]) => [clean(source), clean(target)]).filter(([source, target]) => source && target)); }
function positiveInteger(value: unknown, fallback: number): number { const numeric = Number(value); return Number.isInteger(numeric) && numeric > 0 ? numeric : fallback; }
function boundedPageSize(value: unknown, fallback: number): number { const numeric = Number(value); return Number.isInteger(numeric) && numeric >= 1 && numeric <= 1000 ? numeric : fallback; }
function clean(value: unknown): string { return String(value || "").trim().replace(/^`|`$/g, ""); }
function asRecord(value: unknown): Readonly<Record<string, unknown>> { return value && typeof value === "object" && !Array.isArray(value) ? value as Readonly<Record<string, unknown>> : {}; }
function clone<T>(value: T): T { return structuredClone(value); }
function freeze<T>(value: T): T { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; for (const child of Object.values(value as Record<string, unknown>)) freeze(child); return Object.freeze(value); }

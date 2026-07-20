import { projectWorkflowQueryDataStaticPlan } from "./workflow-query-data-core-adapter.mjs";

export const WORKFLOW_QUERY_DATA_MODES = Object.freeze(["multiple_count_only", "single_to_variables", "multiple_to_list_variable", "multiple_to_text_variable"]);
export const WORKFLOW_QUERY_DATA_SOURCE_TYPES = Object.freeze({
  DATA_LIST: 1,
  DOCUMENT_LIBRARY: 16,
  FORM_REPORT: 32,
});
export const WORKFLOW_QUERY_DATA_MAX_SORTS = 2;

export function normalizeWorkflowQueryDataMode(value) {
  return project("mode", value);
}

export function buildWorkflowQueryDataProperties(config = {}) {
  return project("query-properties", config);
}

export function buildWorkflowListVariable({ id, name, listRefId, fields = [] } = {}) {
  return project("list-variable", { id, name, listRefId, fields });
}

export function buildWorkflowListLoopProperties({ name, listVariableId } = {}) {
  return project("loop-properties", { name, loopType: "list", sourceParent: "__variables_", source: listVariableId });
}

export function buildWorkflowLoopProperties({ name, loopType = "list", sourceParent = "__variables_", source, expression } = {}) {
  return project("loop-properties", { name, loopType, sourceParent, source, expression });
}

export function parseWorkflowFieldMap(value) {
  return project("field-map", value);
}

export function parseWorkflowSorts(value) {
  const out = [];
  for (const entry of String(value || "").split(/\s*;\s*/).filter(Boolean)) {
    const match = entry.match(/^(.+?)\s+(asc|ascending|desc|descending)$/i);
    if (!match) continue;
    out.push({ SortName: clean(match[1]), SortByDesc: /^desc/i.test(match[2]) });
  }
  return out;
}

function clean(value) {
  return String(value || "").trim().replace(/^`|`$/g, "");
}

function project(kind, value) {
  const projection = projectWorkflowQueryDataStaticPlan({ kind, value });
  return structuredClone(projection.value);
}

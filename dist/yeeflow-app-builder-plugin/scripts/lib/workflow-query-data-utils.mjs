const MODE_ALIASES = new Map([
  ["multiple_count_only", "multiple_count_only"],
  ["count_only", "multiple_count_only"],
  ["single_to_variables", "single_to_variables"],
  ["single", "single_to_variables"],
  ["multiple_to_list_variable", "multiple_to_list_variable"],
  ["multiple_to_list", "multiple_to_list_variable"],
  ["multiple_to_text_variable", "multiple_to_text_variable"],
  ["multiple_to_text", "multiple_to_text_variable"],
]);

export const WORKFLOW_QUERY_DATA_MODES = Object.freeze([...new Set(MODE_ALIASES.values())]);
export const WORKFLOW_QUERY_DATA_SOURCE_TYPES = Object.freeze({
  DATA_LIST: 1,
  DOCUMENT_LIBRARY: 16,
  FORM_REPORT: 32,
});
export const WORKFLOW_QUERY_DATA_MAX_SORTS = 2;

export function normalizeWorkflowQueryDataMode(value) {
  const key = String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return MODE_ALIASES.get(key) || "";
}

export function buildWorkflowQueryDataProperties(config = {}) {
  const mode = normalizeWorkflowQueryDataMode(config.mode) || "multiple_to_text_variable";
  const pageIndex = positiveInteger(config.pageIndex, 1);
  const pageSize = boundedPageSize(config.pageSize, mode === "multiple_to_list_variable" ? 1000 : 100);
  const fieldMap = normalizeFieldMap(config.fieldMap);
  const fields = Array.isArray(config.fields) ? config.fields : [];
  const resultVariable = clean(config.resultVariable);
  const countVariable = clean(config.countVariable);
  const result = { type: mode === "single_to_variables" ? "single" : "multiple", pageIndex, pageSize };

  if (mode === "multiple_count_only") {
    Object.assign(result, {
      fieldMap: null,
      listName: "",
      vartype: "",
      listParent: "",
      fields: null,
      totalCount: countVariable,
      querycount_prefix: "__variables_",
    });
  } else if (mode === "single_to_variables") {
    Object.assign(result, { fieldMap, listName: "", fields: null });
  } else if (mode === "multiple_to_list_variable") {
    Object.assign(result, {
      fieldMap,
      listName: resultVariable,
      vartype: "list",
      listParent: "__variables_",
      fields: null,
      ...(countVariable ? { totalCount: countVariable, querycount_prefix: "__variables_" } : {}),
    });
  } else {
    Object.assign(result, {
      fieldMap: null,
      listName: resultVariable,
      vartype: "text",
      listParent: "__variables_",
      fields,
      ...(countVariable ? { totalCount: countVariable, querycount_prefix: "__variables_" } : {}),
    });
  }

  const listType = Number.isInteger(Number(config.listType)) ? Number(config.listType) : WORKFLOW_QUERY_DATA_SOURCE_TYPES.DATA_LIST;
  if (!Object.values(WORKFLOW_QUERY_DATA_SOURCE_TYPES).includes(listType)) {
    throw new Error(`Unsupported export-proven Workflow Query Data source type: ${listType}`);
  }
  const sorts = Array.isArray(config.sorts) ? structuredClone(config.sorts) : [];
  if (sorts.length > WORKFLOW_QUERY_DATA_MAX_SORTS) {
    throw new Error(`Workflow Query Data supports at most ${WORKFLOW_QUERY_DATA_MAX_SORTS} sort fields`);
  }

  return {
    name: clean(config.name) || "Query data",
    appid: Number.isInteger(Number(config.appId)) ? Number(config.appId) : 41,
    listsetid: String(config.listSetId || ""),
    listid: String(config.listId || ""),
    listtype: listType,
    filters: Array.isArray(config.filters) ? structuredClone(config.filters) : [],
    sorts,
    result,
  };
}

export function buildWorkflowListVariable({ id, name, listRefId, fields = [] } = {}) {
  const variableId = clean(id);
  const refId = clean(listRefId);
  return {
    variable: {
      idx: variableId,
      id: variableId,
      name: clean(name) || variableId,
      type: "list",
      editable: true,
      value: refId,
    },
    listref: {
      id: refId,
      name: clean(name) || refId,
      fields: fields.map((field) => ({
        idx: clean(field.idx) || clean(field.id),
        id: clean(field.id),
        name: clean(field.name) || clean(field.id),
        type: clean(field.type) || "text",
        editable: field.editable !== false,
      })),
      idx: refId,
    },
  };
}

export function buildWorkflowListLoopProperties({ name, listVariableId } = {}) {
  return buildWorkflowLoopProperties({ name, loopType: "list", sourceParent: "__variables_", source: listVariableId });
}

export function buildWorkflowLoopProperties({ name, loopType = "list", sourceParent = "__variables_", source, expression } = {}) {
  const mode = clean(loopType).toLowerCase();
  if (mode === "list") {
    return {
      name: clean(name) || "Loop through list items",
      loopType: "list",
      loopValue: {
        prefix: sourceParent === "__list_" ? "__list_" : "__variables_",
        value: clean(source),
      },
    };
  }
  if (mode === "values" || mode === "number") {
    return {
      name: clean(name) || (mode === "values" ? "Loop through multiple values" : "Loop for fixed times"),
      loopType: mode,
      loopValue: {
        type: 2,
        value: Array.isArray(expression) ? structuredClone(expression) : [],
      },
    };
  }
  return {
    name: clean(name) || "Loop",
    loopType: mode,
    loopValue: {},
  };
}

export function parseWorkflowFieldMap(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return normalizeFieldMap(value);
  const out = {};
  for (const pair of String(value || "").split(/\s*;\s*/).filter(Boolean)) {
    const parts = pair.split(/\s*(?:->|=>|→)\s*/);
    if (parts.length !== 2) continue;
    const source = clean(parts[0]);
    const target = clean(parts[1]);
    if (source && target) out[source] = target;
  }
  return out;
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

function normalizeFieldMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([source, target]) => [clean(source), clean(target)]).filter(([source, target]) => source && target));
}

function positiveInteger(value, fallback) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : fallback;
}

function boundedPageSize(value, fallback) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric >= 1 && numeric <= 1000 ? numeric : fallback;
}

function clean(value) {
  return String(value || "").trim().replace(/^`|`$/g, "");
}

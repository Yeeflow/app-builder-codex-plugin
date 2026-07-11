const crypto = require("node:crypto");

const QUERY_DATA_MODES = Object.freeze({
  SINGLE_TO_VARIABLES: "single_to_variables",
  SINGLE_TO_TEMP_VARIABLES: "single_to_temp_variables",
  SINGLE_TO_LIST_FIELDS: "single_to_list_fields",
  SINGLE_TO_LIST_FIELDS_AND_TEMP_VARIABLES: "single_to_list_fields_and_temp_variables",
  MULTIPLE_TO_SUBLIST: "multiple_to_sublist",
  MULTIPLE_TO_LIST_SUBLIST: "multiple_to_list_sublist",
  MULTIPLE_TO_TEMP_COLLECTION: "multiple_to_temp_collection",
  MULTIPLE_COUNT_ONLY: "multiple_count_only",
});

const ALLOWED_HOST_SURFACES = new Set([
  "approval_submission",
  "approval_task",
  "approval_print",
  "data_list_custom_form",
  "document_library_custom_form",
  "dashboard",
]);

const QUERY_DATA_PAGINATION = Object.freeze({
  DEFAULT_PAGE_SIZE: 100,
  MAX_PAGE_SIZE: 1000,
  DEFAULT_PAGE_NUMBER: 1,
});
const QUERY_DATA_SOURCE_TYPES = Object.freeze({
  DATA_LIST: 1,
  DOCUMENT_LIBRARY: 16,
  FORM_REPORT: 32,
});
const QUERY_DATA_MAX_SORTS = 2;

function buildFormActionQueryDataStep(options = {}) {
  const mode = String(options.mode || "").trim();
  if (!Object.values(QUERY_DATA_MODES).includes(mode)) {
    throw new Error(`Unsupported Form Action Query Data mode: ${mode || "<empty>"}`);
  }
  const hostSurface = String(options.hostSurface || "approval_submission").trim();
  if (!ALLOWED_HOST_SURFACES.has(hostSurface)) {
    if (hostSurface === "public_form") {
      throw new Error("Public Forms do not support Form Action Query Data steps.");
    }
    throw new Error(`Unsupported Form Action Query Data host surface: ${hostSurface || "<empty>"}`);
  }
  if (hostSurface === "dashboard" && ![
    QUERY_DATA_MODES.SINGLE_TO_TEMP_VARIABLES,
    QUERY_DATA_MODES.MULTIPLE_TO_TEMP_COLLECTION,
    QUERY_DATA_MODES.MULTIPLE_COUNT_ONLY,
  ].includes(mode)) {
    throw new Error(`Dashboard Query Data mode must target temp variables: ${mode}`);
  }

  const attrs = {
    querydata_list: normalizeSource(options.source),
  };
  if (Array.isArray(options.filters)) attrs.querydata_filters = options.filters.map(normalizeFilter);
  if (Array.isArray(options.sorts)) {
    if (options.sorts.length > QUERY_DATA_MAX_SORTS) throw new Error(`Query Data supports at most ${QUERY_DATA_MAX_SORTS} sort fields`);
    attrs.querydata_sorts = options.sorts.map(normalizeSort);
  }

  if (mode === QUERY_DATA_MODES.SINGLE_TO_VARIABLES || mode === QUERY_DATA_MODES.SINGLE_TO_TEMP_VARIABLES) {
    attrs.querydata_fieldmap = normalizeFieldMap(options.fieldMap, {
      tempTargets: mode === QUERY_DATA_MODES.SINGLE_TO_TEMP_VARIABLES,
    });
    attrs.querydata_fields = null;
    // The v1.1 export omits querydata_type for the default single-record mode.
    if (options.emitExplicitSingleType === true) attrs.querydata_type = "single";
  }

  if (mode === QUERY_DATA_MODES.SINGLE_TO_LIST_FIELDS) {
    requireDataListHost(hostSurface, mode);
    attrs.querydata_fieldmap = normalizeDataListFieldMap(options.listFieldMap);
    attrs.querydata_fields = null;
    if (options.emitExplicitSingleType === true) attrs.querydata_type = "single";
  }

  if (mode === QUERY_DATA_MODES.SINGLE_TO_LIST_FIELDS_AND_TEMP_VARIABLES) {
    requireDataListHost(hostSurface, mode);
    attrs.querydata_fieldmap = {
      ...normalizeDataListFieldMap(options.listFieldMap),
      ...normalizeFieldMap(options.tempFieldMap, { tempTargets: true }),
    };
    attrs.querydata_fields = null;
    if (options.emitExplicitSingleType === true) attrs.querydata_type = "single";
  }

  if (mode === QUERY_DATA_MODES.MULTIPLE_TO_SUBLIST) {
    attrs.querydata_type = "multiple";
    attrs.querydata_fieldmap = normalizeFieldMap(options.fieldMap);
    attrs.querydata_fields = null;
    attrs.querydata_listname = requiredString(options.resultTarget, "resultTarget");
    attrs.querydata_vartype = "list";
    attrs.querydata_listname_parent = "__variables_";
  }

  if (mode === QUERY_DATA_MODES.MULTIPLE_TO_LIST_SUBLIST) {
    requireDataListHost(hostSurface, mode);
    attrs.querydata_type = "multiple";
    attrs.querydata_fieldmap = normalizeFieldMap(options.fieldMap);
    attrs.querydata_fields = null;
    attrs.querydata_listname = normalizeDataListFieldName(options.resultTarget);
    attrs.querydata_vartype = "list";
    attrs.querydata_listname_parent = "__list_";
  }

  if (mode === QUERY_DATA_MODES.MULTIPLE_TO_TEMP_COLLECTION) {
    attrs.querydata_type = "multiple";
    attrs.querydata_fieldmap = null;
    attrs.querydata_listname = requiredString(options.resultTarget, "resultTarget");
    attrs.querydata_vartype = "text";
    attrs.querydata_listname_parent = "__temp_";
    attrs.querydata_fields = normalizeSelectedFields(options.selectedFields);
  }

  if (mode === QUERY_DATA_MODES.MULTIPLE_COUNT_ONLY) {
    attrs.querydata_type = "multiple";
    // Count-only is intentionally clean: no result collection or stale field map.
  }

  if (options.countTarget) {
    attrs.querydata_totalcount = requiredString(options.countTarget.id, "countTarget.id");
    attrs.querydata_totalparent = normalizeParent(options.countTarget.parent);
    if (hostSurface === "dashboard" && attrs.querydata_totalparent !== "__temp_") {
      throw new Error("Dashboard Query Data count targets must use __temp_.");
    }
  } else if (mode === QUERY_DATA_MODES.MULTIPLE_COUNT_ONLY) {
    throw new Error("multiple_count_only requires countTarget");
  }

  if (options.pageSize !== undefined) {
    const pageSize = Number(options.pageSize);
    if (!Number.isInteger(pageSize) || pageSize <= 0 || pageSize > QUERY_DATA_PAGINATION.MAX_PAGE_SIZE) {
      throw new Error(`pageSize must be an integer from 1 to ${QUERY_DATA_PAGINATION.MAX_PAGE_SIZE}`);
    }
    attrs.querydata_pagesize = pageSize;
  }

  if (options.pageNumber !== undefined) {
    const pageNumber = Number(options.pageNumber);
    if (!Number.isInteger(pageNumber) || pageNumber <= 0) throw new Error("pageNumber must be a positive integer");
    if (pageNumber !== QUERY_DATA_PAGINATION.DEFAULT_PAGE_NUMBER) attrs.querydata_pageindex = pageNumber;
  }

  const step = {
    type: "querydata",
    name: requiredString(options.name, "name"),
    attrs,
  };
  if (Array.isArray(options.condition) && options.condition.length) step.condition = clone(options.condition);
  return step;
}

function effectiveQueryDataType(attrs = {}) {
  const value = String(attrs.querydata_type || "").trim();
  return value || "single";
}

function classifyFormActionQueryDataStep(step = {}) {
  const attrs = step.attrs || {};
  const queryType = effectiveQueryDataType(attrs);
  if (queryType === "single") {
    const targets = Object.values(isObject(attrs.querydata_fieldmap) ? attrs.querydata_fieldmap : {});
    if (!targets.length) return "single_missing_mapping";
    const tempCount = targets.filter((target) => String(target || "").startsWith("__temp_")).length;
    const listFieldCount = targets.filter(isDataListFieldTarget).length;
    if (tempCount === targets.length) return QUERY_DATA_MODES.SINGLE_TO_TEMP_VARIABLES;
    if (listFieldCount === targets.length) return QUERY_DATA_MODES.SINGLE_TO_LIST_FIELDS;
    if (tempCount + listFieldCount === targets.length && tempCount > 0 && listFieldCount > 0) {
      return QUERY_DATA_MODES.SINGLE_TO_LIST_FIELDS_AND_TEMP_VARIABLES;
    }
    if (tempCount === 0 && listFieldCount === 0) return QUERY_DATA_MODES.SINGLE_TO_VARIABLES;
    return "single_mixed_targets";
  }
  if (queryType !== "multiple") return "unknown";
  if (attrs.querydata_listname) {
    if (attrs.querydata_listname_parent === "__variables_" && attrs.querydata_vartype === "list") return QUERY_DATA_MODES.MULTIPLE_TO_SUBLIST;
    if (attrs.querydata_listname_parent === "__list_" && attrs.querydata_vartype === "list") return QUERY_DATA_MODES.MULTIPLE_TO_LIST_SUBLIST;
    if (attrs.querydata_listname_parent === "__temp_") return QUERY_DATA_MODES.MULTIPLE_TO_TEMP_COLLECTION;
    return "multiple_unknown_result_target";
  }
  if (attrs.querydata_totalcount) return QUERY_DATA_MODES.MULTIPLE_COUNT_ONLY;
  return "multiple_missing_output";
}

function isCountOnlyIntent(step = {}) {
  return /(?:count|total|number of results?).*only|only.*(?:count|total|number of results?)/i.test(String(step.name || step.title || ""));
}

function normalizeSource(value) {
  if (!isObject(value)) throw new Error("source must be an object");
  const out = {};
  for (const key of ["AppID", "ListSetID", "ListID", "ListType"]) {
    if (value[key] === undefined || value[key] === null || value[key] === "") throw new Error(`source.${key} is required`);
    out[key] = value[key];
  }
  const listType = Number(out.ListType);
  if (!Object.values(QUERY_DATA_SOURCE_TYPES).includes(listType)) {
    throw new Error(`Unsupported export-proven Query Data source ListType: ${out.ListType}`);
  }
  out.ListType = listType;
  return out;
}

function normalizeFilter(value = {}) {
  if (!isObject(value) || !value.left || value.op === undefined || value.right === undefined) {
    throw new Error("Each Query Data filter requires left, op, and right");
  }
  return {
    key: value.key || crypto.randomUUID(),
    pre: value.pre === "or" ? "or" : "and",
    left: value.left,
    op: String(value.op),
    right: clone(value.right),
    showCus: value.showCus === undefined ? !Array.isArray(value.right) : value.showCus === true,
  };
}

function normalizeSort(value = {}) {
  if (!isObject(value) || !value.SortName) throw new Error("Each Query Data sort requires SortName");
  return { SortName: value.SortName, SortByDesc: value.SortByDesc === true };
}

function normalizeFieldMap(value, { tempTargets = false } = {}) {
  if (!isObject(value) || Object.keys(value).length === 0) throw new Error("fieldMap must contain at least one source-to-target mapping");
  return Object.fromEntries(Object.entries(value).map(([source, target]) => {
    const sourceField = requiredString(source, "fieldMap source");
    let targetField = requiredString(target, `fieldMap.${sourceField}`);
    if (tempTargets && !targetField.startsWith("__temp_")) targetField = `__temp_${targetField}`;
    return [sourceField, targetField];
  }));
}

function normalizeDataListFieldMap(value) {
  if (!isObject(value) || Object.keys(value).length === 0) {
    throw new Error("listFieldMap must contain at least one source-to-current-record mapping");
  }
  return Object.fromEntries(Object.entries(value).map(([source, target]) => [
    requiredString(source, "listFieldMap source"),
    encodeDataListFieldTarget(target),
  ]));
}

function encodeDataListFieldTarget(value) {
  const fieldName = normalizeDataListFieldName(value);
  return `____customListFields_${fieldName}`;
}

function decodeDataListFieldTarget(value) {
  const text = String(value || "");
  return isDataListFieldTarget(text) ? text.slice("____customListFields_".length) : "";
}

function isDataListFieldTarget(value) {
  return /^____customListFields_[A-Za-z][A-Za-z0-9_]*$/.test(String(value || ""));
}

function normalizeDataListFieldName(value) {
  const text = requiredString(value, "Data List field target")
    .replace(/^____customListFields_/, "")
    .trim();
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(text)) throw new Error(`Invalid Data List field target: ${text}`);
  return text;
}

function requireDataListHost(hostSurface, mode) {
  if (!["data_list_custom_form", "document_library_custom_form"].includes(hostSurface)) {
    throw new Error(`${mode} requires a Data List or Document Library custom form hostSurface`);
  }
}

function normalizeSelectedFields(value) {
  if (!Array.isArray(value) || value.length === 0) throw new Error("selectedFields must contain at least one field");
  return value.map((field) => {
    if (!isObject(field) || !field.FieldName) throw new Error("Each selected field requires FieldName");
    return {
      FieldName: field.FieldName,
      Type: field.Type || "input",
      DisplayName: field.DisplayName || field.FieldName,
    };
  });
}

function normalizeParent(value) {
  if (value === "__variables_" || value === "variables" || value === "workflow") return "__variables_";
  if (value === "__temp_" || value === "temp" || value === "temporary") return "__temp_";
  throw new Error("Variable parent must be __variables_ or __temp_");
}

function requiredString(value, name) {
  const text = String(value || "").trim();
  if (!text) throw new Error(`${name} is required`);
  return text;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

module.exports = {
  ALLOWED_HOST_SURFACES,
  QUERY_DATA_PAGINATION,
  QUERY_DATA_SOURCE_TYPES,
  QUERY_DATA_MAX_SORTS,
  QUERY_DATA_MODES,
  buildFormActionQueryDataStep,
  classifyFormActionQueryDataStep,
  decodeDataListFieldTarget,
  encodeDataListFieldTarget,
  effectiveQueryDataType,
  isDataListFieldTarget,
  isCountOnlyIntent,
};

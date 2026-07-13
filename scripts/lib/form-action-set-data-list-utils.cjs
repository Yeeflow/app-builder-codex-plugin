const crypto = require("node:crypto");

const SET_DATA_LIST_OPERATIONS = Object.freeze({
  ADD: "add",
  EDIT: "edit",
  REMOVE: "remove",
});

const SET_DATA_LIST_TARGET_MODES = Object.freeze({
  CURRENT: "current",
  SELECT: "select",
});

const ALLOWED_HOST_SURFACES = new Set([
  "approval_submission",
  "approval_task",
  "data_list_new",
  "data_list_edit",
  "data_list_view",
  "document_library_new",
  "document_library_edit",
  "document_library_view",
  "dashboard",
]);

const ALLOWED_TARGET_RESOURCE_TYPES = new Set([1, 16]);
const ALLOWED_RESULT_PARENTS = new Set(["__variables_", "__temp_", "__list_"]);
const DOCUMENT_LIBRARY_UPLOAD_FIELD = "Text4";
const DOCUMENT_LIBRARY_PATH_FIELD = "_Path";

function buildFormActionSetDataListStep(options = {}) {
  const hostSurface = requiredString(options.hostSurface, "hostSurface");
  if (hostSurface === "public_form") throw new Error("Public Forms do not support Form Action Set Data List steps.");
  if (!ALLOWED_HOST_SURFACES.has(hostSurface)) throw new Error(`Unsupported Form Action Set Data List host surface: ${hostSurface}`);

  const operation = normalizeOperation(options.operation);
  const targetMode = normalizeTargetMode(options.targetMode);
  if (targetMode === SET_DATA_LIST_TARGET_MODES.CURRENT && !/^(?:data_list|document_library)_(?:new|edit|view)$/.test(hostSurface)) {
    throw new Error("Current-record Set Data List is available only on Data List or Document Library custom forms.");
  }
  if (targetMode === SET_DATA_LIST_TARGET_MODES.CURRENT && operation !== SET_DATA_LIST_OPERATIONS.EDIT) {
    throw new Error("Current-record Form Action Set Data List supports edit only.");
  }

  const attrs = { listtype: targetMode, type: operation };
  const targetResourceType = targetMode === SET_DATA_LIST_TARGET_MODES.SELECT
    ? Number(options.target?.ListType ?? options.target?.Type ?? 1)
    : null;
  if (targetMode === SET_DATA_LIST_TARGET_MODES.SELECT) attrs.list = normalizeTarget(options.target);

  if (operation !== SET_DATA_LIST_OPERATIONS.REMOVE) {
    attrs.listdatas = normalizeMappings(options.mappings);
    if (!attrs.listdatas.length) throw new Error(`${operation} requires at least one field mapping.`);
    if (containsSubListBulkSource(attrs.listdatas)) throw new Error("Form Action Set Data List cannot expand Sub List rows into multiple target records; use Workflow Set Data List.");
    if (targetResourceType === 16 && operation === SET_DATA_LIST_OPERATIONS.ADD) assertDocumentLibraryAddMappings(attrs.listdatas);
  } else {
    attrs.listdatas = null;
  }

  const filters = normalizeFilters(options.filters || []);
  if (targetMode === SET_DATA_LIST_TARGET_MODES.SELECT && operation !== SET_DATA_LIST_OPERATIONS.ADD && !filters.length) {
    throw new Error(`${operation} against a selected resource requires at least one filter.`);
  }
  if (filters.length || (targetMode === SET_DATA_LIST_TARGET_MODES.SELECT && operation === SET_DATA_LIST_OPERATIONS.ADD && options.emitEmptyFilters)) {
    attrs.wheres = filters;
  }

  applyResultTarget(attrs, "code", options.statusTarget, hostSurface);
  const defaultItemAttribute = operation === SET_DATA_LIST_OPERATIONS.ADD ? "itemid" : "totalcount";
  const itemAttribute = options.itemResultAttribute || defaultItemAttribute;
  if (!new Set(["itemid", "totalcount"]).has(itemAttribute)) throw new Error("itemResultAttribute must be itemid or totalcount.");
  applyResultTarget(attrs, itemAttribute, options.itemTarget, hostSurface);

  const step = {
    type: "setdatalist",
    name: requiredString(options.name, "name"),
    attrs,
  };
  if (Array.isArray(options.condition) && options.condition.length) step.condition = clone(options.condition);
  if (options.continueNext === true) step.continue = true;
  return step;
}

function classifyFormActionSetDataListStep(step = {}) {
  if (step?.type !== "setdatalist") return "not_setdatalist";
  const attrs = step.attrs || {};
  const targetMode = normalizeTargetMode(attrs.listtype || (attrs.list ? "select" : "current"));
  const operation = normalizeOperation(attrs.type || (targetMode === "current" ? "edit" : "add"));
  return `${targetMode}_${operation}`;
}

function validateFormActionSetDataListStep(step = {}, context = {}) {
  const findings = [];
  const push = (code, message, detail = {}) => findings.push({ code, message, ...detail });
  if (step?.type !== "setdatalist") return findings;
  const attrs = step.attrs || {};
  let operation;
  let targetMode;
  try { targetMode = normalizeTargetMode(attrs.listtype || (attrs.list ? "select" : "current")); } catch (error) { push("FORM_ACTION_SET_DATA_LIST_TARGET_MODE_INVALID", error.message); return findings; }
  try { operation = normalizeOperation(attrs.type || (targetMode === "current" ? "edit" : "add")); } catch (error) { push("FORM_ACTION_SET_DATA_LIST_OPERATION_INVALID", error.message); return findings; }

  const hostSurface = String(context.hostSurface || "");
  if (hostSurface === "public_form") push("FORM_ACTION_SET_DATA_LIST_PUBLIC_FORM_FORBIDDEN", "Public Forms cannot contain Set Data List Form Action steps.");
  if (targetMode === "current" && !/^(?:data_list|document_library)_(?:new|edit|view)$/.test(hostSurface)) {
    push("FORM_ACTION_SET_DATA_LIST_CURRENT_TARGET_HOST_INVALID", "Current-record mode requires a Data List or Document Library custom form host.");
  }
  if (targetMode === "current" && operation !== "edit") push("FORM_ACTION_SET_DATA_LIST_CURRENT_TARGET_OPERATION_INVALID", "Current-record mode supports edit only.");
  if (targetMode === "select") {
    if (!isObject(attrs.list) || !attrs.list.ListID || !attrs.list.ListSetID) push("FORM_ACTION_SET_DATA_LIST_TARGET_MISSING", "Selected-resource mode requires AppID, ListSetID, and ListID.");
    if (operation !== "add" && (!Array.isArray(attrs.wheres) || attrs.wheres.length === 0)) push("FORM_ACTION_SET_DATA_LIST_FILTER_REQUIRED", `${operation} requires at least one target filter.`);
  }
  if (operation !== "remove" && (!Array.isArray(attrs.listdatas) || attrs.listdatas.length === 0)) push("FORM_ACTION_SET_DATA_LIST_FIELD_MAPPING_MISSING", `${operation} requires field mappings.`);
  if (containsSubListBulkSource(attrs.listdatas)) push("FORM_ACTION_SET_DATA_LIST_SUBLIST_BULK_WRITE_UNSUPPORTED", "Form Action Set Data List cannot expand Sub List rows into multiple target records; use Workflow Set Data List.");
  if (Number(context.targetResourceType) === 16 && operation === "add") {
    for (const finding of validateDocumentLibraryAddMappings(attrs.listdatas)) push(finding.code, finding.message);
  }
  validateResultTarget(findings, attrs, "code", hostSurface);
  validateResultTarget(findings, attrs, "itemid", hostSurface);
  validateResultTarget(findings, attrs, "totalcount", hostSurface);
  if (context.strictGenerated && !String(step.name || step.title || "").trim()) push("FORM_ACTION_SET_DATA_LIST_STEP_NAME_MISSING", "Generated Set Data List steps require a concise business name.");
  return findings;
}

function normalizeOperation(value) {
  const operation = String(value || "add").trim().toLowerCase();
  if (!Object.values(SET_DATA_LIST_OPERATIONS).includes(operation)) throw new Error(`Unsupported Set Data List operation: ${value || "<empty>"}`);
  return operation;
}

function normalizeTargetMode(value) {
  const mode = String(value || "").trim().toLowerCase();
  if (!Object.values(SET_DATA_LIST_TARGET_MODES).includes(mode)) throw new Error(`Unsupported Set Data List target mode: ${value || "<empty>"}`);
  return mode;
}

function normalizeTarget(value) {
  if (!isObject(value)) throw new Error("Selected-resource Set Data List requires target.");
  const listType = Number(value.ListType ?? value.Type ?? 1);
  if (!ALLOWED_TARGET_RESOURCE_TYPES.has(listType)) throw new Error(`Set Data List target type must be Data List (1) or Document Library (16), received ${listType}.`);
  for (const key of ["AppID", "ListSetID", "ListID"]) if (value[key] === undefined || value[key] === null || value[key] === "") throw new Error(`target.${key} is required`);
  return { AppID: value.AppID, ListSetID: value.ListSetID, ListID: value.ListID };
}

function normalizeMappings(values) {
  if (!Array.isArray(values)) throw new Error("mappings must be an array");
  return values.map((value) => {
    if (!isObject(value) || !value.Columns || !Array.isArray(value.Data) || value.Data.length === 0) throw new Error("Each field mapping requires Columns and non-empty Data tokens.");
    const per = String(value.Per ?? "0");
    if (!new Set(["0", "1", "2", "3", "4"]).has(per)) throw new Error(`Unsupported numeric field operation Per=${per}`);
    return { Per: per, Columns: String(value.Columns), Data: clone(value.Data) };
  });
}

function normalizeFilters(values) {
  if (!Array.isArray(values)) throw new Error("filters must be an array");
  return values.map((value) => {
    if (!isObject(value) || !value.left || value.op === undefined) throw new Error("Each filter requires left and op.");
    return {
      key: value.key || crypto.randomUUID(),
      pre: value.pre === "or" ? "or" : "and",
      left: String(value.left),
      op: String(value.op),
      right: value.right === undefined ? null : clone(value.right),
      showCus: value.showCus === true,
    };
  });
}

function applyResultTarget(attrs, key, target, hostSurface) {
  if (!target) return;
  const id = requiredString(target.id, `${key} target id`);
  const parent = requiredString(target.parent, `${key} target parent`);
  if (!ALLOWED_RESULT_PARENTS.has(parent)) throw new Error(`Unsupported result target parent: ${parent}`);
  if (hostSurface === "dashboard" && parent !== "__temp_") throw new Error("Dashboard Set Data List result targets must be temp variables.");
  attrs[key] = id.replace(/^__temp_/, "");
  attrs[resultParentKey(key)] = parent;
}

function validateResultTarget(findings, attrs, key, hostSurface) {
  const id = attrs[key];
  const parent = attrs[resultParentKey(key)];
  if (!id && !parent) return;
  if (!id || !parent || !ALLOWED_RESULT_PARENTS.has(parent)) findings.push({ code: "FORM_ACTION_SET_DATA_LIST_RESULT_TARGET_INVALID", message: `${key} requires a valid id and parent.` });
  if (hostSurface === "dashboard" && parent !== "__temp_") findings.push({ code: "FORM_ACTION_SET_DATA_LIST_DASHBOARD_RESULT_NOT_TEMP", message: `Dashboard ${key} target must use __temp_.` });
}

function resultParentKey(key) { return key === "totalcount" ? "totalparent" : `${key}parent`; }

function containsSubListBulkSource(value) {
  let found = false;
  visit(value, (item) => {
    if (found || !isObject(item)) return;
    const id = String(item.id || item.key || item.prop || "");
    if (/^_list\.|^__list_|\.items?\b/i.test(id) || /^(?:list|sublist)$/i.test(String(item.valueType || ""))) found = true;
  });
  return found;
}

function assertDocumentLibraryAddMappings(mappings) {
  const findings = validateDocumentLibraryAddMappings(mappings);
  if (findings.length) throw new Error(findings[0].message);
}

function validateDocumentLibraryAddMappings(mappings) {
  const findings = [];
  const upload = (Array.isArray(mappings) ? mappings : []).find((mapping) => String(mapping?.Columns) === DOCUMENT_LIBRARY_UPLOAD_FIELD);
  if (!upload) {
    findings.push({
      code: "FORM_ACTION_SET_DATA_LIST_DOCUMENT_LIBRARY_UPLOAD_REQUIRED",
      message: `Document Library Add requires the native Upload File mapping ${DOCUMENT_LIBRARY_UPLOAD_FIELD}.`,
    });
    return findings;
  }
  if (containsMultiValueSource(upload.Data)) findings.push({
    code: "FORM_ACTION_SET_DATA_LIST_DOCUMENT_LIBRARY_UPLOAD_MULTI_VALUE_UNSUPPORTED",
    message: "Form Action Set Data List can add only one Document Library file per step; multi-file, array, List, and Sub List sources require Workflow Set Data List or a dedicated workflow.",
  });
  return findings;
}

function containsMultiValueSource(value) {
  let found = false;
  visit(value, (item) => {
    if (found || !isObject(item)) return;
    const valueType = String(item.valueType || item.variableType || "").toLowerCase();
    if (/^(?:array|list|sublist|multi(?:file|attachment|select)?)$/.test(valueType)
      || item.multiple === true || item.isMultiple === true || item.multi === true) found = true;
  });
  return found || containsSubListBulkSource(value);
}

function visit(value, callback) {
  if (Array.isArray(value)) return value.forEach((item) => visit(item, callback));
  if (!isObject(value)) return;
  callback(value);
  for (const child of Object.values(value)) visit(child, callback);
}

function requiredString(value, name) {
  const text = String(value || "").trim();
  if (!text) throw new Error(`${name} is required`);
  return text;
}

function isObject(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }

module.exports = {
  SET_DATA_LIST_OPERATIONS,
  SET_DATA_LIST_TARGET_MODES,
  ALLOWED_HOST_SURFACES,
  buildFormActionSetDataListStep,
  classifyFormActionSetDataListStep,
  validateFormActionSetDataListStep,
  containsSubListBulkSource,
  validateDocumentLibraryAddMappings,
  DOCUMENT_LIBRARY_UPLOAD_FIELD,
  DOCUMENT_LIBRARY_PATH_FIELD,
};

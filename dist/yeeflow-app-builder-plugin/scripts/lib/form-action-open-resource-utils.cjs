const OPEN_RESOURCE_STEP_TYPES = new Set(["listitem", "openform", "opendashboard"]);
const OPEN_MODES = new Set(["slide", "modal", "target", "new"]);
const MODAL_SIZES = new Set([0, 1, 2, 3, 9]);
const ITEM_OPERATIONS = new Set(["add", "edit", "view"]);
const APPROVAL_OPERATIONS = new Set(["new", "submitted"]);
const CURRENT_ITEM_HOST = /^(?:data_list|document_library)_(?:new|edit|view)$/;

function buildFormActionOpenResourceStep(options = {}) {
  const hostSurface = required(options.hostSurface, "hostSurface");
  if (hostSurface === "public_form") throw new Error("Public Forms do not support Open Item Form, Open Approval Form, or Open Dashboard steps.");
  const stepType = required(options.stepType, "stepType").toLowerCase();
  if (!OPEN_RESOURCE_STEP_TYPES.has(stepType)) throw new Error(`Unsupported open-resource step type: ${stepType}`);
  const attrs = {};

  if (stepType === "listitem") buildListItemAttrs(attrs, options, hostSurface);
  if (stepType === "openform") buildApprovalAttrs(attrs, options);
  if (stepType === "opendashboard") buildDashboardAttrs(attrs, options);
  validateGeneratedQueryParams(attrs.queryParams);
  applyOpenPresentation(attrs, options);

  const step = { type: stepType, name: required(options.name, "name"), attrs };
  if (Array.isArray(options.condition) && options.condition.length) step.condition = clone(options.condition);
  if (options.continueNext === true) step.continue = true;
  return step;
}

function buildListItemAttrs(attrs, options, hostSurface) {
  const operation = String(options.operation || "add").toLowerCase();
  if (!ITEM_OPERATIONS.has(operation)) throw new Error(`Open Item Form operation must be add, edit, or view; received ${operation}.`);
  const targetMode = String(options.targetMode || "select").toLowerCase();
  if (!new Set(["current", "select"]).has(targetMode)) throw new Error("Open Item Form targetMode must be current or select.");
  if (targetMode === "current" && !CURRENT_ITEM_HOST.test(hostSurface)) throw new Error("Current item is available only on Data List or Document Library custom forms.");
  if (targetMode === "select") {
    attrs.data = { list: normalizeListTarget(options.target) };
    if (CURRENT_ITEM_HOST.test(hostSurface)) attrs.source_type = "select";
    if (operation !== "add") attrs.listdataid = requiredExpressionTokens(options.itemIdTokens, "selected Edit/View item ID");
  }
  if (operation !== "add") attrs.op_type = operation;
  if (options.layout) attrs.layout = String(options.layout);
  if (Array.isArray(options.defaultValues) && options.defaultValues.length) attrs.passvalues = clone(options.defaultValues);
  if (Array.isArray(options.queryParams) && options.queryParams.length) attrs.queryParams = clone(options.queryParams);
  if (options.resultItemId) {
    attrs.itemid = String(options.resultItemId).replace(/^__temp_/, "");
    attrs.itemidparent = options.resultItemParent || "__temp_";
  }
}

function buildApprovalAttrs(attrs, options) {
  const operation = String(options.operation || "new").toLowerCase();
  if (!APPROVAL_OPERATIONS.has(operation)) throw new Error("Open Approval Form operation must be new or submitted.");
  attrs.data = { form: normalizeApprovalTarget(options.target) };
  attrs.optype = operation;
  if (operation === "submitted") {
    attrs.formid = requiredExpressionTokens(options.formIdTokens, "submitted form ID");
    if (hasItems(options.setVariables) || hasItems(options.queryParams)) throw new Error("Submitted approval forms cannot receive Set Variables or Query Parameters.");
    return;
  }
  if (hasItems(options.setVariables)) {
    validateGeneratedSetVariables(options.setVariables);
    attrs.setVars = { defKey: attrs.data.form.ProcKey, Rules: clone(options.setVariables) };
  }
  if (hasItems(options.queryParams)) attrs.queryParams = clone(options.queryParams);
}

function buildDashboardAttrs(attrs, options) {
  attrs.data = { page: normalizeDashboardTarget(options.target) };
  if (hasItems(options.queryParams)) attrs.queryParams = clone(options.queryParams);
}

function applyOpenPresentation(attrs, options) {
  const mode = String(options.openMode || "target").toLowerCase();
  if (!OPEN_MODES.has(mode)) throw new Error(`Open mode must be slide, modal, target, or new; received ${mode}.`);
  attrs.op = mode;
  if (mode !== "slide" && mode !== "modal") {
    if (options.modalSize !== undefined || options.customWidth !== undefined) throw new Error("Modal size and custom width are available only for Slide in or Pop-up window modes.");
    return;
  }
  const size = options.modalSize === undefined || options.modalSize === "" ? 1 : Number(options.modalSize);
  if (!MODAL_SIZES.has(size)) throw new Error(`Unsupported modal size: ${options.modalSize}`);
  attrs.modalsize = size;
  if (size === 9) {
    const width = Number(options.customWidth);
    if (!Number.isFinite(width) || width <= 0) throw new Error("Custom modal size requires a positive custom width.");
    attrs.cusize = { w: width };
  } else if (options.customWidth !== undefined && options.customWidth !== "") {
    throw new Error("Custom width requires modalSize 9.");
  }
}

function validateFormActionOpenResourceStep(step = {}, context = {}) {
  const findings = [];
  const add = (code, message) => findings.push({ code, message });
  if (!OPEN_RESOURCE_STEP_TYPES.has(String(step?.type || ""))) return findings;
  const attrs = step.attrs || {};
  const surface = String(context.hostSurface || "");
  if (surface === "public_form") add("FORM_ACTION_OPEN_RESOURCE_PUBLIC_FORM_FORBIDDEN", "Public Forms cannot contain open-resource Form Action steps.");
  if (context.strictGenerated && !String(step.name || "").trim()) add("FORM_ACTION_OPEN_RESOURCE_STEP_NAME_MISSING", "Generated open-resource steps require a concise business name.");
  validatePresentation(attrs, add, context.strictGenerated === true);
  validateQueryParams(attrs.queryParams, add, context.strictGenerated === true);
  if (step.type === "listitem") validateListItem(attrs, surface, add, context.strictGenerated === true);
  if (step.type === "openform") validateOpenForm(attrs, add, context.strictGenerated === true);
  if (step.type === "opendashboard" && (!attrs.data?.page?.PageID || !attrs.data?.page?.ListSetID)) add("FORM_ACTION_OPEN_DASHBOARD_TARGET_MISSING", "Open Dashboard requires AppID, ListSetID, and PageID.");
  return findings;
}

function validatePresentation(attrs, add, strictGenerated) {
  const mode = String(attrs.op || "");
  if (!mode && strictGenerated) add("FORM_ACTION_OPEN_RESOURCE_MODE_INVALID", "Generated open-resource steps must explicitly set slide, modal, target, or new.");
  else if (mode && !OPEN_MODES.has(mode)) add("FORM_ACTION_OPEN_RESOURCE_MODE_INVALID", "Open mode must be slide, modal, target, or new.");
  if (["slide", "modal"].includes(mode) || (!mode && attrs.modalsize !== undefined)) {
    if (!MODAL_SIZES.has(Number(attrs.modalsize))) add("FORM_ACTION_OPEN_RESOURCE_SIZE_INVALID", "Slide/Pop-up mode requires a supported modal size.");
    if (Number(attrs.modalsize) === 9 && !(Number(attrs.cusize?.w) > 0)) add("FORM_ACTION_OPEN_RESOURCE_CUSTOM_WIDTH_MISSING", "Custom size requires cusize.w.");
  } else if (mode && (attrs.modalsize !== undefined || attrs.cusize !== undefined)) add("FORM_ACTION_OPEN_RESOURCE_SIZE_NOT_ALLOWED", "Full page/New window must not carry modal size settings.");
}

function validateListItem(attrs, surface, add, strictGenerated) {
  const operation = attrs.op_type || "add";
  if (!ITEM_OPERATIONS.has(operation)) add("FORM_ACTION_OPEN_ITEM_OPERATION_INVALID", "Open Item Form operation must be add, edit, or view.");
  const selected = Boolean(attrs.data?.list);
  if (!selected && !CURRENT_ITEM_HOST.test(surface)) add("FORM_ACTION_OPEN_ITEM_CURRENT_HOST_INVALID", "Current item mode is available only on Data List or Document Library custom forms.");
  if (selected && (!attrs.data.list.ListID || !attrs.data.list.ListSetID)) add("FORM_ACTION_OPEN_ITEM_TARGET_MISSING", "Selected item mode requires a Data List or Document Library target.");
  if (selected && operation !== "add" && !hasItems(attrs.listdataid)) add("FORM_ACTION_OPEN_ITEM_ID_MISSING", "Selected Edit/View requires an item ID expression.");
  else if (selected && operation !== "add" && strictGenerated && !isExpressionTokenArray(attrs.listdataid)) add("FORM_ACTION_OPEN_ITEM_ID_EXPRESSION_INVALID", "Selected Edit/View item ID must be a parseable Yeeflow expression-token array.");
}

function validateOpenForm(attrs, add, strictGenerated) {
  if (!attrs.data?.form?.ProcKey || !attrs.data?.form?.ListSetID) add("FORM_ACTION_OPEN_APPROVAL_TARGET_MISSING", "Open Approval Form requires AppID, ListSetID, and ProcKey.");
  if (!APPROVAL_OPERATIONS.has(attrs.optype)) add("FORM_ACTION_OPEN_APPROVAL_OPERATION_INVALID", "Approval operation must be new or submitted.");
  if (attrs.optype === "submitted") {
    if (!hasItems(attrs.formid)) add("FORM_ACTION_OPEN_APPROVAL_FORM_ID_MISSING", "Submitted form requires a Form ID expression.");
    else if (strictGenerated && !isExpressionTokenArray(attrs.formid)) add("FORM_ACTION_OPEN_APPROVAL_FORM_ID_EXPRESSION_INVALID", "Submitted form ID must be a parseable Yeeflow expression-token array.");
    if (attrs.setVars || attrs.queryParams) add("FORM_ACTION_OPEN_APPROVAL_SUBMITTED_INPUT_FORBIDDEN", "Submitted forms cannot receive Set Variables or Query Parameters.");
  }
  if (attrs.optype === "new" && attrs.setVars && attrs.setVars.defKey !== attrs.data?.form?.ProcKey) add("FORM_ACTION_OPEN_APPROVAL_DEFKEY_MISMATCH", "setVars.defKey must equal the target approval ProcKey.");
  if (attrs.optype === "new" && strictGenerated && attrs.setVars?.Rules) validateSetVariables(attrs.setVars.Rules, add);
}

function validateQueryParams(queryParams, add, strictGenerated) {
  if (!strictGenerated || queryParams === undefined) return;
  if (!Array.isArray(queryParams)) return add("FORM_ACTION_OPEN_RESOURCE_QUERY_PARAMS_INVALID", "Query Parameters must be an array.");
  const names = new Set();
  for (const item of queryParams) {
    const name = String(item?.name || "").trim();
    if (!name) add("FORM_ACTION_OPEN_RESOURCE_QUERY_PARAM_NAME_MISSING", "Every Query Parameter requires a non-empty name.");
    else if (names.has(name.toLowerCase())) add("FORM_ACTION_OPEN_RESOURCE_QUERY_PARAM_DUPLICATE", `Query Parameter ${name} is duplicated.`);
    else names.add(name.toLowerCase());
    const value = item?.value;
    const hasDirect = value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, "value") && value.value !== null && value.value !== undefined;
    const hasVariable = value && typeof value === "object" && isExpressionTokenArray(value.variable);
    if (!hasDirect && !hasVariable) add("FORM_ACTION_OPEN_RESOURCE_QUERY_PARAM_VALUE_INVALID", `Query Parameter ${name || "<unnamed>"} requires a direct value or expression-token variable value.`);
  }
}

function validateSetVariables(rules, add) {
  if (!Array.isArray(rules)) return add("FORM_ACTION_OPEN_APPROVAL_SETVARS_INVALID", "Approval Set Variables rules must be an array.");
  const ids = new Set();
  for (const rule of rules) {
    const id = String(rule?.id || rule?.idx || rule?.source || "").trim();
    if (!id) add("FORM_ACTION_OPEN_APPROVAL_VARIABLE_ID_MISSING", "Every Approval default variable rule requires a target variable ID.");
    else if (ids.has(id.toLowerCase())) add("FORM_ACTION_OPEN_APPROVAL_VARIABLE_DUPLICATE", `Approval default variable ${id} is assigned more than once.`);
    else ids.add(id.toLowerCase());
    if (!String(rule?.type || "").trim()) add("FORM_ACTION_OPEN_APPROVAL_VARIABLE_TYPE_MISSING", `Approval default variable ${id || "<unnamed>"} requires its target type.`);
    if (!isExpressionTokenArray(rule?.rule)) add("FORM_ACTION_OPEN_APPROVAL_VARIABLE_RULE_INVALID", `Approval default variable ${id || "<unnamed>"} requires expression tokens.`);
  }
}

function validateGeneratedQueryParams(queryParams) {
  if (queryParams === undefined) return;
  const findings = [];
  validateQueryParams(queryParams, (code, message) => findings.push({ code, message }), true);
  if (findings.length) throw new Error(`${findings[0].code}: ${findings[0].message}`);
}

function validateGeneratedSetVariables(rules) {
  const findings = [];
  validateSetVariables(rules, (code, message) => findings.push({ code, message }));
  if (findings.length) throw new Error(`${findings[0].code}: ${findings[0].message}`);
}

function normalizeListTarget(value) {
  if (!value || !value.ListID || !value.ListSetID) throw new Error("Selected Open Item Form requires target AppID, ListSetID, and ListID.");
  return { AppID: value.AppID ?? 41, ListSetID: value.ListSetID, ListID: value.ListID };
}
function normalizeApprovalTarget(value) {
  if (!value || !value.ProcKey || !value.ListSetID) throw new Error("Open Approval Form requires target AppID, ListSetID, and ProcKey.");
  return { AppID: value.AppID ?? 41, ListSetID: value.ListSetID, ProcKey: value.ProcKey };
}
function normalizeDashboardTarget(value) {
  if (!value || !value.PageID || !value.ListSetID) throw new Error("Open Dashboard requires target AppID, ListSetID, and PageID.");
  return { AppID: value.AppID ?? 41, ListSetID: value.ListSetID, PageID: value.PageID };
}
function requiredExpressionTokens(value, name) { if (!isExpressionTokenArray(value)) throw new Error(`${name} must be a parseable Yeeflow expression-token array.`); return clone(value); }
function isExpressionTokenArray(value) { return Array.isArray(value) && value.length > 0 && value.every((item) => item && typeof item === "object" && !Array.isArray(item) && (String(item.type || "").trim() || String(item.exprType || "").trim())); }
function hasItems(value) { return Array.isArray(value) && value.length > 0; }
function required(value, name) { const text = String(value || "").trim(); if (!text) throw new Error(`${name} is required`); return text; }
function clone(value) { return JSON.parse(JSON.stringify(value)); }

module.exports = {
  OPEN_RESOURCE_STEP_TYPES,
  OPEN_MODES,
  MODAL_SIZES,
  buildFormActionOpenResourceStep,
  validateFormActionOpenResourceStep,
  isExpressionTokenArray,
};

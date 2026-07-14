"use strict";

const { formActionAssignments, variableAliases } = require("./set-variable-contract-utils.cjs");

const PUBLIC_FORM_ALLOWED_ACTION_STEP_TYPES = new Set([
  "setvar",
  "customcode",
  "confirm",
  "redirect",
  "submit",
  "otheraction",
  "barcode",
  "nfc",
]);

const PUBLIC_FORM_EXPORT_PROVEN_ACTION_STEP_TYPES = new Set(["setvar", "redirect"]);
const PUBLIC_FORM_SHARED_SHAPE_ACTION_STEP_TYPES = new Set(["confirm", "submit", "otheraction"]);
const PUBLIC_FORM_UI_ONLY_ACTION_STEP_TYPES = new Set(["customcode", "barcode", "nfc"]);

const STEP_TYPE_ALIASES = new Map([
  ["set variable", "setvar"],
  ["set variables", "setvar"],
  ["execute custom code", "customcode"],
  ["custom code", "customcode"],
  ["show confirm dialog", "confirm"],
  ["redirect page to", "redirect"],
  ["submit form", "submit"],
  ["start another action", "otheraction"],
  ["barcode scan", "barcode"],
  ["nfc reader", "nfc"],
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function text(value) {
  return String(value == null ? "" : value).trim();
}

function normalizePublicFormActionStepType(value) {
  const raw = text(value).toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  return STEP_TYPE_ALIASES.get(raw) || raw.replace(/\s+/g, "");
}

function aliases(values) {
  return new Set(asArray(values).flatMap((value) => {
    if (typeof value === "string") return [text(value)];
    return variableAliases(value);
  }).filter(Boolean));
}

function fieldAliases(fields) {
  return new Set(asArray(fields).flatMap((field) => {
    if (typeof field === "string") return [text(field)];
    return [field && field.FieldID, field && field.FieldName, field && field.DisplayName, field && field.id, field && field.name, field && field.prop].map(text).filter(Boolean);
  }));
}

function finding(code, message, detail = {}) {
  return { code, message, ...detail };
}

function validateScopedExpressionTokens(tokens, { declaredListFields, declaredTempVariables, path, allowEmpty = false } = {}) {
  const findings = [];
  if (!Array.isArray(tokens)) {
    return [finding("PUBLIC_FORM_ACTION_VALUE_NOT_EXPRESSION_ARRAY", "Public Form action values must use Yeeflow expression-token arrays.", { path })];
  }
  if (!tokens.length && !allowEmpty) findings.push(finding("PUBLIC_FORM_ACTION_VALUE_EMPTY", "Public Form action expression must not be empty.", { path }));
  const listFields = fieldAliases(declaredListFields);
  const tempVariables = aliases(declaredTempVariables);
  walk(tokens, (token, tokenPath) => {
    if (!token || typeof token !== "object" || Array.isArray(token)) return;
    if (token.exprType === "list_field") {
      const refs = [token.id, token.prop, token.name].map(text).filter(Boolean);
      if (!refs.some((ref) => listFields.has(ref) || listFields.has(ref.replace(/^List Fields:/i, "")))) {
        findings.push(finding("PUBLIC_FORM_ACTION_LIST_FIELD_UNRESOLVED", "Public Form action expressions may reference only fields on the current host Data List.", { path: `${path}${tokenPath}`, reference: text(token.prop || token.id || token.name) }));
      }
    } else if (token.exprType === "variable") {
      if (!variableAliases(token).some((ref) => tempVariables.has(ref))) {
        findings.push(finding("PUBLIC_FORM_ACTION_TEMPVAR_UNDECLARED", "Public Form action expressions may reference only temp variables declared on the same Public Form.", { path: `${path}${tokenPath}`, reference: text(token.id || token.name) }));
      }
    } else if (token.exprType) {
      findings.push(finding("PUBLIC_FORM_ACTION_EXPRESSION_SCOPE_INVALID", "Anonymous Public Forms cannot reference application, instance, user, collection-context, lookup, or other external expression scopes.", { path: `${path}${tokenPath}`, exprType: text(token.exprType) }));
    } else if (token.type && !["str", "num", "bool", "date", "datetime", "time", "op", "expr"].includes(text(token.type).toLowerCase())) {
      findings.push(finding("PUBLIC_FORM_ACTION_EXPRESSION_SCOPE_INVALID", "Public Form action values may contain only fixed values, operators, current-list fields, and same-form temp variables.", { path: `${path}${tokenPath}`, tokenType: text(token.type) }));
    }
  });
  return findings;
}

function validatePublicFormActions(resource, options = {}) {
  const findings = [];
  const actions = asArray(resource && resource.actions);
  const actionIds = new Set();
  const declaredListFields = options.declaredListFields || [];
  const declaredTempVariables = asArray(resource && resource.tempVars);
  const generatedOutput = options.generatedOutput === true;
  const basePath = options.pathPrefix || "PublicForm.Resource";

  if (resource && resource.actions !== undefined && !Array.isArray(resource.actions)) {
    findings.push(finding("PUBLIC_FORM_ACTIONS_NOT_ARRAY", "Public Form Resource.actions must be an array.", { path: `${basePath}.actions` }));
    return findings;
  }
  actions.forEach((action, actionIndex) => {
    const actionPath = `${basePath}.actions[${actionIndex}]`;
    const id = text(action && action.id);
    if (!id) findings.push(finding("PUBLIC_FORM_ACTION_ID_MISSING", "Every Public Form action must have a non-empty id.", { path: `${actionPath}.id` }));
    else if (actionIds.has(id)) findings.push(finding("PUBLIC_FORM_ACTION_ID_DUPLICATE", "Public Form action ids must be unique within the form.", { path: `${actionPath}.id`, actionId: id }));
    else actionIds.add(id);
    if (!Array.isArray(action && action.steps)) {
      findings.push(finding("PUBLIC_FORM_ACTION_STEPS_NOT_ARRAY", "Every Public Form action must contain a steps array.", { path: `${actionPath}.steps` }));
      return;
    }
  });

  const referencedActionIds = collectActionReferences(resource);
  for (const reference of referencedActionIds) {
    if (reference.id && !actionIds.has(reference.id)) findings.push(finding("PUBLIC_FORM_ACTION_REFERENCE_UNRESOLVED", "Public Form hooks, controls, and Start another action steps must resolve to an action on the same Public Form.", reference));
  }

  actions.forEach((action, actionIndex) => asArray(action.steps).forEach((step, stepIndex) => {
    const stepPath = `${basePath}.actions[${actionIndex}].steps[${stepIndex}]`;
    const stepType = normalizePublicFormActionStepType(step && step.type);
    if (!PUBLIC_FORM_ALLOWED_ACTION_STEP_TYPES.has(stepType)) {
      findings.push(finding("PUBLIC_FORM_ACTION_STEP_TYPE_NOT_ALLOWED", "This Form Action step type is not available on anonymous Public Forms.", { path: `${stepPath}.type`, stepType: text(step && step.type) }));
      return;
    }
    if (generatedOutput && PUBLIC_FORM_UI_ONLY_ACTION_STEP_TYPES.has(stepType)) {
      findings.push(finding("PUBLIC_FORM_ACTION_STEP_SERIALIZATION_UNPROVEN", "This Public Form step is product-UI-backed but its package serialization is not yet export-proven; generated-final output must not guess it.", { path: stepPath, stepType }));
    }
    if (stepType === "setvar") validateSetVariable(step, { declaredListFields, declaredTempVariables, path: stepPath }).forEach((item) => findings.push(item));
    if (stepType === "redirect") validateRedirect(step, { declaredListFields, declaredTempVariables, path: stepPath }).forEach((item) => findings.push(item));
  }));
  return findings;
}

function validateSetVariable(step, options) {
  const findings = [];
  const listFields = fieldAliases(options.declaredListFields);
  const tempVariables = aliases(options.declaredTempVariables);
  const attrs = step && step.attrs || {};
  const assignments = formActionAssignments(step);
  if (attrs.setvar_multi === true && !assignments.length) findings.push(finding("PUBLIC_FORM_SETVAR_MULTI_ARRAY_EMPTY", "Public Form multi-variable Set variables requires at least one assignment.", { path: `${options.path}.attrs.setvar_array` }));
  assignments.forEach((assignment, index) => {
    const assignmentPath = attrs.setvar_multi === true ? `${options.path}.attrs.setvar_array[${index}]` : `${options.path}.attrs`;
    const target = assignment.target;
    if (!target || typeof target !== "object") {
      findings.push(finding("PUBLIC_FORM_SETVAR_TARGET_MISSING", "Public Form Set variables target is missing.", { path: assignmentPath }));
    } else if (target.exprType === "list_field") {
      const refs = [target.id, target.prop, target.name].map(text).filter(Boolean);
      if (!refs.some((ref) => listFields.has(ref) || listFields.has(ref.replace(/^List Fields:/i, "")))) findings.push(finding("PUBLIC_FORM_SETVAR_TARGET_SCOPE_INVALID", "Public Form Set variables may target only fields on the current Data List or same-form temp variables.", { path: assignmentPath, target: text(target.prop || target.id) }));
    } else if (target.exprType === "variable") {
      if (!variableAliases(target).some((ref) => tempVariables.has(ref))) findings.push(finding("PUBLIC_FORM_SETVAR_TARGET_SCOPE_INVALID", "Public Form Set variables may target only fields on the current Data List or same-form temp variables.", { path: assignmentPath, target: text(target.id || target.name) }));
    } else {
      findings.push(finding("PUBLIC_FORM_SETVAR_TARGET_SCOPE_INVALID", "Public Form Set variables cannot target application resources, workflow variables, instance properties, users, or collection context.", { path: assignmentPath, exprType: text(target && target.exprType) }));
    }
    validateScopedExpressionTokens(assignment.value, { ...options, path: `${assignmentPath}.value` }).forEach((item) => findings.push(item));
  });
  return findings;
}

function validateRedirect(step, options) {
  const link = step && step.attrs && step.attrs.link;
  if (!link || typeof link !== "object" || Array.isArray(link)) return [finding("PUBLIC_FORM_REDIRECT_LINK_INVALID", "Public Form Redirect page to requires attrs.link.", { path: `${options.path}.attrs.link` })];
  const fixedUrl = text(link.url);
  if (fixedUrl) return [];
  return validateScopedExpressionTokens(link.variable, { ...options, path: `${options.path}.attrs.link.variable` });
}

function collectActionReferences(resource) {
  const references = [];
  const add = (id, path) => { if (text(id)) references.push({ id: text(id), path }); };
  const formAction = resource && resource.formAction;
  if (formAction && typeof formAction === "object") Object.entries(formAction).forEach(([key, value]) => add(value, `formAction.${key}`));
  walk(resource && resource.children, (node, path) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    add(node.attrs && node.attrs.control_action, `children${path}.attrs.control_action`);
  });
  asArray(resource && resource.actions).forEach((action, actionIndex) => asArray(action && action.steps).forEach((step, stepIndex) => {
    if (normalizePublicFormActionStepType(step && step.type) === "otheraction") add(step && step.attrs && step.attrs.control_action, `actions[${actionIndex}].steps[${stepIndex}].attrs.control_action`);
  }));
  return references;
}

function walk(value, callback, path = "") {
  if (Array.isArray(value)) return value.forEach((item, index) => walk(item, callback, `${path}[${index}]`));
  if (!value || typeof value !== "object") return;
  callback(value, path);
  Object.entries(value).forEach(([key, item]) => walk(item, callback, `${path}.${key}`));
}

module.exports = {
  PUBLIC_FORM_ALLOWED_ACTION_STEP_TYPES,
  PUBLIC_FORM_EXPORT_PROVEN_ACTION_STEP_TYPES,
  PUBLIC_FORM_SHARED_SHAPE_ACTION_STEP_TYPES,
  PUBLIC_FORM_UI_ONLY_ACTION_STEP_TYPES,
  normalizePublicFormActionStepType,
  validatePublicFormActions,
  validateScopedExpressionTokens,
};

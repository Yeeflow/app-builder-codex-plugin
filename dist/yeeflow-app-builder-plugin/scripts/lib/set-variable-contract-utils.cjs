"use strict";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function text(value) {
  return String(value == null ? "" : value).trim();
}

function formActionAssignments(step) {
  const attrs = step && step.attrs || {};
  return attrs.setvar_multi === true
    ? asArray(attrs.setvar_array).map((entry) => ({ target: entry && entry.var, value: entry && entry.value }))
    : [{ target: attrs.setvar_var, value: attrs.setvar_val }];
}

function validateFormActionSetVariableStep(step, options = {}) {
  const host = text(options.host || "form").toLowerCase();
  const declaredTempVariables = new Set(asArray(options.declaredTempVariables).flatMap(variableAliases));
  const declaredListFields = new Set(asArray(options.declaredListFields).map(text).filter(Boolean));
  const findings = [];
  const attrs = step && step.attrs || {};
  const assignments = formActionAssignments(step);
  if (attrs.setvar_multi === true && !assignments.length) {
    findings.push(finding("FORM_ACTION_SETVAR_MULTI_ARRAY_EMPTY", "Multi-variable Set variable requires at least one attrs.setvar_array assignment."));
  }
  if (attrs.setvar_multi !== true && attrs.setvar_array !== undefined) {
    findings.push(finding("FORM_ACTION_SETVAR_SINGLE_HAS_MULTI_ARRAY", "Single-variable Set variable must not carry attrs.setvar_array."));
  }
  assignments.forEach((assignment, index) => {
    const target = assignment.target;
    const path = attrs.setvar_multi === true ? `attrs.setvar_array[${index}]` : "attrs.setvar_var";
    if (!target || typeof target !== "object" || !text(target.id)) {
      findings.push(finding("FORM_ACTION_SETVAR_TARGET_MISSING", "Set variable assignment target is missing or incomplete.", { path }));
      return;
    }
    if (!Array.isArray(assignment.value)) {
      findings.push(finding("FORM_ACTION_SETVAR_VALUE_NOT_EXPRESSION_ARRAY", "Set variable assignment value must be an expression-token array.", { path: `${path}.value` }));
    }
    if (target.exprType === "variable") {
      const aliases = variableAliases(target);
      if (!aliases.some((alias) => declaredTempVariables.has(alias))) {
        findings.push(finding("FORM_ACTION_SETVAR_TARGET_UNDECLARED", "Set variable temp-variable target must be declared on the same page/form.", { path, target: text(target.id) }));
      }
    } else if (target.exprType === "list_field") {
      if (host === "dashboard" || host === "approval") {
        findings.push(finding("FORM_ACTION_SETVAR_LIST_FIELD_TARGET_UNSUPPORTED_HOST", "Dashboard and Approval Form page Set variable steps cannot target current Data List fields.", { path, host }));
      } else if (!declaredListFields.has(text(target.id)) && !declaredListFields.has(text(target.prop))) {
        findings.push(finding("FORM_ACTION_SETVAR_LIST_FIELD_TARGET_UNRESOLVED", "Data List Form Set variable target must resolve to a current-list field.", { path, target: text(target.id || target.prop) }));
      }
    } else {
      findings.push(finding("FORM_ACTION_SETVAR_TARGET_TYPE_UNSUPPORTED", "Set variable target must be a temp variable or, on a Data List Form, a current list field.", { path, exprType: text(target.exprType) }));
    }
  });
  if (step && step.condition !== undefined && !Array.isArray(step.condition)) {
    findings.push(finding("FORM_ACTION_SETVAR_CONDITION_NOT_EXPRESSION_ARRAY", "Set variable step condition must be an expression-token array when present."));
  }
  if (step && step.continue !== undefined && typeof step.continue !== "boolean") {
    findings.push(finding("FORM_ACTION_SETVAR_CONTINUE_NOT_BOOLEAN", "Continue-next-step behavior must be serialized as a boolean."));
  }
  return findings;
}

function variableAliases(variable) {
  const values = [text(variable && variable.id), text(variable && variable.name)].filter(Boolean);
  return [...new Set(values.flatMap((value) => [value, value.replace(/^__temp_/, ""), value.replace(/^__temp_var_/, "var_")]))];
}

function finding(code, message, detail = {}) {
  return { code, message, ...detail };
}

function buildWorkflowVariableSetting({ id, name, type, value, idx, editable = true }) {
  const variableId = text(id);
  const variableName = text(name) || variableId;
  return {
    idx: text(idx) || variableId,
    id: variableId,
    name: variableName,
    type: text(type) || "text",
    editable: editable !== false,
    value: Array.isArray(value) ? value : [],
  };
}

module.exports = {
  formActionAssignments,
  buildWorkflowVariableSetting,
  validateFormActionSetVariableStep,
  variableAliases,
};

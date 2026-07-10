"use strict";

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function escapeHtmlAttribute(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function serializeWorkflowVariableJson(data, options = {}) {
  if (!isObject(data)) throw new TypeError("Workflow variable JSON must be an object.");
  const json = JSON.stringify(data);
  const prefix = options.leadingSpace === true ? "${ " : "${";
  const body = options.leadingSpace === true
    ? json.slice(1, -1).replace(/,"param":/, ', "param":')
    : json.slice(1, -1);
  return `${prefix}${body}}`;
}

function buildWorkflowExpressionButton(data, label) {
  const variableJson = serializeWorkflowVariableJson(data, { leadingSpace: true });
  return `<input type="button" data="${escapeHtmlAttribute(variableJson)}" expr="__" tabindex="-1" value="${escapeHtmlAttribute(label)}">`;
}

function extractExpressionButtonVariableJson(value) {
  const text = String(value || "");
  const match = text.match(/\bdata=(['"])(.*?)\1/i);
  if (!match) return null;
  return decodeHtmlEntities(match[2]).trim();
}

function parseWorkflowVariableJson(value, options = {}) {
  const text = String(value || "").trim();
  const nested = options.nested === true;
  if (!text.startsWith("${")) {
    return {
      ok: false,
      code: nested ? "WORKFLOW_ASSIGNEE_NESTED_EXPRESSION_MISSING" : "WORKFLOW_ASSIGNEE_EXPRESSION_OUTER_SHAPE_INVALID",
      message: nested
        ? "Nested workflow assignee references must use ${...} variable JSON syntax."
        : "Workflow assignee Expression Button data must start with ${.",
      source: text,
    };
  }
  if (text.startsWith("${{")) {
    return {
      ok: false,
      code: nested ? "WORKFLOW_ASSIGNEE_NESTED_EXPRESSION_INVALID" : "WORKFLOW_ASSIGNEE_EXPRESSION_OUTER_SHAPE_INVALID",
      message: "Workflow assignee variable JSON must not wrap a normal JSON object as ${{...}}.",
      source: text,
    };
  }
  if (!text.endsWith("}")) {
    return {
      ok: false,
      code: nested ? "WORKFLOW_ASSIGNEE_NESTED_EXPRESSION_INVALID" : "WORKFLOW_ASSIGNEE_EXPRESSION_PARSE_FAILED",
      message: "Workflow assignee variable JSON is missing its closing brace.",
      source: text,
    };
  }
  try {
    const data = JSON.parse(`{${text.slice(2, -1)}}`);
    if (!isObject(data) || !String(data.type || "").trim()) {
      return {
        ok: false,
        code: nested ? "WORKFLOW_ASSIGNEE_NESTED_EXPRESSION_INVALID" : "WORKFLOW_ASSIGNEE_EXPRESSION_PARSE_FAILED",
        message: "Workflow assignee variable JSON must decode to an object with a type.",
        source: text,
      };
    }
    return { ok: true, data, source: text };
  } catch (error) {
    return {
      ok: false,
      code: nested ? "WORKFLOW_ASSIGNEE_NESTED_EXPRESSION_INVALID" : "WORKFLOW_ASSIGNEE_EXPRESSION_PARSE_FAILED",
      message: `Workflow assignee variable JSON could not be parsed: ${error.message}`,
      source: text,
    };
  }
}

function parseWorkflowExpressionButton(value) {
  const variableJson = extractExpressionButtonVariableJson(value);
  if (!variableJson) {
    return {
      ok: false,
      code: "WORKFLOW_ASSIGNEE_EXPRESSION_PARSE_FAILED",
      message: "Workflow assignee expression must contain an Expression Button data attribute.",
      source: String(value || ""),
    };
  }
  return parseWorkflowVariableJson(variableJson);
}

function inspectNestedExpressions(data, path = "$", findings = [], expressionNodes = []) {
  if (!isObject(data)) return { findings, expressionNodes };
  expressionNodes.push({ path, data });

  const type = String(data.type || "").toLowerCase();
  const prop = String(data.prop || "").toLowerCase();
  const paramId = data.param && data.param.id;
  const nestedRequired = (type === "user" && ["linemanager", "organizationid"].includes(prop))
    || (type === "org" && prop === "manager");

  if (nestedRequired && (typeof paramId !== "string" || !paramId.trim().startsWith("${"))) {
    findings.push({
      code: "WORKFLOW_ASSIGNEE_NESTED_EXPRESSION_MISSING",
      message: "Manager and organization assignee expressions require param.id to contain a nested ${...} expression.",
      path: `${path}.param.id`,
      actual: paramId ?? null,
    });
    return { findings, expressionNodes };
  }

  if (typeof paramId === "string") {
    const trimmed = paramId.trim();
    if (trimmed.startsWith("${")) {
      const parsed = parseWorkflowVariableJson(trimmed, { nested: true });
      if (!parsed.ok) {
        findings.push({ code: parsed.code, message: parsed.message, path: `${path}.param.id`, actual: trimmed });
      } else {
        inspectNestedExpressions(parsed.data, `${path}.param.id`, findings, expressionNodes);
      }
    } else if (/^[{[]/.test(trimmed)) {
      findings.push({
        code: "WORKFLOW_ASSIGNEE_NESTED_EXPRESSION_MISSING",
        message: "param.id contains plain JSON text; nested workflow assignee references must use ${...} syntax.",
        path: `${path}.param.id`,
        actual: trimmed,
      });
    }
  }
  return { findings, expressionNodes };
}

function validateWorkflowAssigneeExpression(assignment) {
  const value = String(assignment && assignment.value || "");
  const title = String(assignment && assignment.title || "");
  const expressionLike = /<input\b|\bdata=|\$\{/.test(value);
  if (!expressionLike) return { expression: null, findings: [], variableIds: [] };

  const parsed = parseWorkflowExpressionButton(value);
  if (!parsed.ok) {
    return {
      expression: null,
      findings: [{ code: parsed.code, message: parsed.message, path: "value", actual: parsed.source }],
      variableIds: [],
    };
  }

  const { findings, expressionNodes } = inspectNestedExpressions(parsed.data);
  if (/<input\b|\bdata=/.test(title)) {
    const titleParsed = parseWorkflowExpressionButton(title);
    if (!titleParsed.ok) {
      findings.push({ code: titleParsed.code, message: `Assignee title ${titleParsed.message}`, path: "title", actual: titleParsed.source });
    } else if (JSON.stringify(titleParsed.data) !== JSON.stringify(parsed.data)) {
      findings.push({
        code: "WORKFLOW_ASSIGNEE_EXPRESSION_TITLE_VALUE_MISMATCH",
        message: "Assignee title and value must preserve the same Expression Button data.",
        path: "title",
      });
    }
  }

  const variableIds = expressionNodes
    .filter(({ data }) => String(data.type || "").toLowerCase() === "variable")
    .map(({ data }) => String(data.param && data.param.id || "").trim())
    .filter(Boolean);

  return { expression: parsed.data, findings, variableIds };
}

module.exports = {
  buildWorkflowExpressionButton,
  decodeHtmlEntities,
  extractExpressionButtonVariableJson,
  parseWorkflowExpressionButton,
  parseWorkflowVariableJson,
  serializeWorkflowVariableJson,
  validateWorkflowAssigneeExpression,
};

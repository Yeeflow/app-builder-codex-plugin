const NULL_OPERATORS = new Set(["isNull", "isNotNull"]);

const GROUP_BY_VALUE_TYPE = new Map([
  ["text", "string"],
  ["string", "string"],
  ["list", "string"],
  ["richtext", "string"],
  ["rich-text", "string"],
  ["textarea", "string"],
  ["hyperlink", "string"],
  ["metadata", "string"],
  ["mutiple-metadata", "string"],
  ["multiple-metadata", "string"],
  ["dict", "string"],
  ["lookup", "string"],
  ["user", "string"],
  ["users", "string"],
  ["identity-picker", "string"],
  ["groupselect", "string"],
  ["department", "string"],
  ["organization", "string"],
  ["organization-picker", "string"],
  ["location", "string"],
  ["location-picker", "string"],
  ["costcenter", "string"],
  ["cost-center-picker", "string"],
  ["number", "number"],
  ["decimal", "number"],
  ["currency", "number"],
  ["percent", "number"],
  ["rate", "number"],
  ["boolean", "boolean"],
  ["bit", "boolean"],
  ["switch", "boolean"],
  ["date", "datetime"],
  ["datetime", "datetime"],
  ["date-time", "datetime"],
  ["datepicker", "datetime"],
  ["time", "datetime"],
  ["file", "general"],
  ["file-upload", "general"],
  ["img", "general"],
  ["image", "general"],
  ["icon-upload", "general"],
  ["signature", "general"],
  ["signer", "general"],
]);

const OPS_BY_GROUP = {
  general: new Set(["isNull", "isNotNull"]),
  string: new Set(["s.=", "s.!=", "s.contains", "s.notContains", "s.startWith", "s.endWith", "isNull", "isNotNull"]),
  number: new Set(["n.=", "n.!=", "n.>", "n.>=", "n.<", "n.<=", "isNull", "isNotNull"]),
  boolean: new Set(["b.=", "b.!=", "b.isTrue", "b.isFalse", "isNull", "isNotNull"]),
  datetime: new Set(["dt.=", "dt.!=", "dt.>", "dt.>=", "dt.<", "dt.<=", "isNull", "isNotNull"]),
};

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeType(value) {
  return String(value || "").trim().toLowerCase();
}

function workflowConditionEditorGroupForType(valueType) {
  return GROUP_BY_VALUE_TYPE.get(normalizeType(valueType)) || "string";
}

function opGroup(op) {
  if (NULL_OPERATORS.has(op)) return null;
  if (typeof op !== "string") return null;
  if (op.startsWith("s.")) return "string";
  if (op.startsWith("n.")) return "number";
  if (op.startsWith("b.")) return "boolean";
  if (op.startsWith("dt.")) return "datetime";
  return null;
}

function isNumericLiteral(value) {
  return typeof value === "number" || (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value)));
}

function isBooleanLiteral(value) {
  return typeof value === "boolean" || value === "true" || value === "false";
}

function isDatetimeLiteral(value) {
  return typeof value === "string" && value.trim() !== "";
}

function looksLikeExpressionToken(entry) {
  return isObject(entry) && (
    entry.type === "op" ||
    entry.type === "func" ||
    entry.type === "str" ||
    entry.type === "num" ||
    entry.type === "bool" ||
    entry.exprType === "variable" ||
    entry.exprType === "application" ||
    entry.exprType === "variable_ctx" ||
    entry.exprType === "list_field"
  );
}

function looksLikeConditionExpressionArray(value) {
  return Array.isArray(value) && value.length > 0 && value.some(looksLikeExpressionToken);
}

function literalMatchesGroup(group, value) {
  if (group === "number") return isNumericLiteral(value);
  if (group === "boolean") return isBooleanLiteral(value);
  if (group === "datetime") return isDatetimeLiteral(value);
  if (group === "string") {
    if (Array.isArray(value)) return value.every((item) => typeof item === "string" && item.trim() !== "");
    return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
  }
  return false;
}

function isTaskOutcomeSelector(token) {
  const text = JSON.stringify(token || {});
  return token && (
    token.id === "Outcome" ||
    token.id === "TaskOutcome" ||
    /Task outcome|任务结果|:Outcome\b|Instance:Outcome/.test(text)
  );
}

function validateWorkflowConditionEditorRows({
  conditions,
  variablesById,
  path = "$.properties.conditioninfo",
  node = "",
} = {}) {
  const findings = [];
  function add(code, message, conditionIndex, suffix = "", detail = {}, pathOverride = null) {
    findings.push({
      code,
      message,
      path: pathOverride || `${path}[${conditionIndex}]${suffix}`,
      detail: { node, ...detail },
    });
  }

  function validateRows(rows, currentPath, depth = 0) {
    asArray(rows).forEach((condition, conditionIndex) => {
      const conditionPath = `${currentPath}[${conditionIndex}]`;
      if (!isObject(condition)) return;
      if (condition.pre !== undefined && !["and", "or"].includes(condition.pre)) {
        add("WORKFLOW_CONDITION_PRE_INVALID", "Workflow condition pre must be and/or when present.", conditionIndex, ".pre", { actual: condition.pre }, `${conditionPath}.pre`);
      }

      if (Object.prototype.hasOwnProperty.call(condition, "conditions")) {
        if (depth >= 1) {
          add("WORKFLOW_CONDITION_GROUP_NESTING_TOO_DEEP", "Workflow condition editor supports at most two layers: top-level rows plus one child condition group layer.", conditionIndex, ".conditions", {
            depth,
          }, `${conditionPath}.conditions`);
          return;
        }
        if (condition.left !== null || condition.op !== "isNull" || condition.right !== null) {
          add("WORKFLOW_CONDITION_GROUP_WRAPPER_INVALID", "Workflow condition group wrapper must use left:null, op:isNull, right:null and put real rows in conditions[].", conditionIndex, "", {
            left: condition.left,
            op: condition.op,
            right: condition.right,
          }, conditionPath);
        }
        if (!Array.isArray(condition.conditions) || condition.conditions.length === 0) {
          add("WORKFLOW_CONDITION_GROUP_CHILDREN_REQUIRED", "Workflow condition group must include at least one child condition in conditions[].", conditionIndex, ".conditions", {}, `${conditionPath}.conditions`);
          return;
        }
        validateRows(condition.conditions, `${conditionPath}.conditions`, depth + 1);
        return;
      }

      if (depth > 1) {
        add("WORKFLOW_CONDITION_GROUP_NESTING_TOO_DEEP", "Workflow condition editor supports at most two layers: top-level rows plus one child condition group layer.", conditionIndex, "", {
          depth,
        }, conditionPath);
        return;
      }

      const left = condition.left;
      if (!isObject(left) || left.type !== 1) return;
      if (!isObject(left.value) || left.value.exprType !== "variable") return;
      if (isTaskOutcomeSelector(left.value)) return;
      if (left.value.type !== "expr" || !left.value.id) {
        add("WORKFLOW_CONDITION_LEFT_VARIABLE_WRAPPER_INVALID", "Workflow condition left direct selector must use type 1 with a workflow variable expression token.", conditionIndex, ".left", {}, `${conditionPath}.left`);
        return;
      }

      const variable = variablesById instanceof Map ? variablesById.get(left.value.id) : null;
      if (!variable) {
        add("WORKFLOW_CONDITION_LEFT_VARIABLE_UNRESOLVED", "Workflow condition left side references a variable that is not present in DefResource.variables.", conditionIndex, ".left.value", {
          variableId: left.value.id,
        }, `${conditionPath}.left.value`);
        return;
      }

      const variableType = left.value.valueType || variable.type || variable.valueType;
      const expectedGroup = workflowConditionEditorGroupForType(variableType);
      if (condition.group !== expectedGroup) {
        add("WORKFLOW_CONDITION_GROUP_MISMATCH", "Workflow condition group must match the Condition editor group for the selected workflow variable type.", conditionIndex, ".group", {
          variableId: left.value.id,
          variableType,
          expectedGroup,
          actualGroup: condition.group ?? null,
        }, `${conditionPath}.group`);
      }

      const op = condition.op;
      if (!OPS_BY_GROUP[expectedGroup].has(op)) {
        add("WORKFLOW_CONDITION_OP_GROUP_MISMATCH", "Workflow condition operator must match the Condition editor group for the selected workflow variable type.", conditionIndex, ".op", {
          variableId: left.value.id,
          variableType,
          expectedGroup,
          actualOp: op ?? null,
        }, `${conditionPath}.op`);
        return;
      }

      if (NULL_OPERATORS.has(op) || op === "b.isTrue" || op === "b.isFalse") {
        if (condition.right !== null && condition.right !== undefined) {
          add("WORKFLOW_CONDITION_RIGHT_NULL_REQUIRED", "Null-check and boolean shortcut workflow conditions must not include a right operand.", conditionIndex, ".right", {
            op,
          }, `${conditionPath}.right`);
        }
        return;
      }

      const right = condition.right;
      if (!isObject(right) || ![0, 2].includes(right.type) || !Object.prototype.hasOwnProperty.call(right, "value")) {
        add("WORKFLOW_CONDITION_RIGHT_VALUE_REQUIRED", "Workflow condition right side must use right.type = 0 for direct values or right.type = 2 for expression-editor values.", conditionIndex, ".right", {
          op,
        }, `${conditionPath}.right`);
        return;
      }

      if (right.type === 2) {
        if (!looksLikeConditionExpressionArray(right.value)) {
          add("WORKFLOW_CONDITION_RIGHT_EXPRESSION_VALUE_INVALID", "Workflow condition expression-editor right value must be a non-empty expression token array.", conditionIndex, ".right.value", {
            op,
            expectedGroup,
          }, `${conditionPath}.right.value`);
        }
        return;
      }

      if (!literalMatchesGroup(expectedGroup, right.value)) {
        add("WORKFLOW_CONDITION_RIGHT_LITERAL_TYPE_MISMATCH", "Workflow condition direct right value does not match the Condition editor group.", conditionIndex, ".right.value", {
          variableId: left.value.id,
          variableType,
          expectedGroup,
          actualValueType: Array.isArray(right.value) ? "array" : typeof right.value,
        }, `${conditionPath}.right.value`);
      }
    });
  }

  validateRows(conditions, path, 0);

  return findings;
}

module.exports = {
  workflowConditionEditorGroupForType,
  looksLikeConditionExpressionArray,
  validateWorkflowConditionEditorRows,
};

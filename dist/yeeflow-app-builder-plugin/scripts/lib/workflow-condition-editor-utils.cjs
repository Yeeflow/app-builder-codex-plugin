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

function shapeId(shape) {
  return String(shape && (shape.resourceid || shape.id) || "");
}

function refId(ref) {
  return String(ref && (ref.resourceid || ref.id) || "");
}

function shapeType(shape) {
  return String(shape && shape.stencil && shape.stencil.id || "");
}

function literalKey(value) {
  if (Array.isArray(value)) return value.map(literalKey).join("|");
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value ?? "").trim();
}

function literalDisplay(value) {
  const key = literalKey(value);
  return key || String(value ?? "");
}

function extractDirectRightLiteral(condition) {
  const right = condition && condition.right;
  if (!isObject(right) || right.type !== 0 || !Object.prototype.hasOwnProperty.call(right, "value")) return null;
  return right.value;
}

function flattenConditionRows(rows, depth = 0) {
  const result = [];
  for (const condition of asArray(rows)) {
    if (!isObject(condition)) continue;
    if (Array.isArray(condition.conditions)) {
      for (const child of flattenConditionRows(condition.conditions, depth + 1)) {
        result.push({ ...child, parentPre: condition.pre, parentDepth: depth });
      }
    } else {
      result.push({ row: condition, depth });
    }
  }
  return result;
}

function conditionLeftWorkflowVariable(condition) {
  const left = condition && condition.left;
  if (!isObject(left) || left.type !== 1) return null;
  const value = left.value;
  if (!isObject(value) || value.exprType !== "variable" || !value.id) return null;
  if (isTaskOutcomeSelector(value)) return null;
  return value;
}

function extractVariableChoices(variable) {
  if (!isObject(variable)) return [];
  const candidates = [
    variable.choices,
    variable.options,
    variable.values,
    variable.items,
    variable.choiceValues,
    variable.Rules && variable.Rules.choices,
    variable.rules && variable.rules.choices,
  ];
  const values = [];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        if (isObject(item)) {
          const value = item.value ?? item.Value ?? item.key ?? item.Key ?? item.label ?? item.Label ?? item.name ?? item.Name;
          if (value !== undefined && value !== null && String(value).trim()) values.push(String(value).trim());
        } else if (item !== undefined && item !== null && String(item).trim()) {
          values.push(String(item).trim());
        }
      }
    } else if (typeof candidate === "string" && candidate.trim()) {
      for (const value of candidate.split(/[,;|]/).map((entry) => entry.trim()).filter(Boolean)) values.push(value);
    }
  }
  const type = normalizeType(variable.type || variable.valueType);
  if (["boolean", "bit", "switch"].includes(type)) values.push("true", "false");
  return Array.from(new Set(values.map(literalKey).filter(Boolean)));
}

function analyzeFlowBranchConditions(flow) {
  const conditions = asArray(flow && flow.properties && flow.properties.conditioninfo);
  const text = JSON.stringify(conditions);
  const hasTaskOutcome = /Task outcome|任务结果|&quot;type&quot;:&quot;task&quot;|:Outcome\b|Instance:Outcome/.test(text);
  const equalsByVariable = new Map();
  const notEqualsByVariable = new Map();
  const rows = flattenConditionRows(conditions);

  for (const { row } of rows) {
    const token = conditionLeftWorkflowVariable(row);
    if (!token) continue;
    const op = row.op;
    if (!["s.=", "s.!=", "b.=", "b.!="].includes(op)) continue;
    const literal = extractDirectRightLiteral(row);
    if (literal === null) continue;
    const id = token.id;
    const target = op.endsWith("!=") ? notEqualsByVariable : equalsByVariable;
    if (!target.has(id)) target.set(id, new Set());
    target.get(id).add(literalKey(literal));
  }

  return {
    flowId: shapeId(flow),
    sourceId: refId(flow && flow.source),
    targetId: refId(flow && flow.target),
    hasTaskOutcome,
    hasConditions: conditions.length > 0,
    equalsByVariable,
    notEqualsByVariable,
  };
}

function validateWorkflowBranchConditionCoverage({
  shapes,
  variablesById,
  path = "$.childshapes",
  workflow = "",
} = {}) {
  const findings = [];
  const sequenceFlows = asArray(shapes).filter((shape) => shapeType(shape) === "SequenceFlow");
  const flowsBySource = new Map();
  sequenceFlows.forEach((flow, index) => {
    const sourceId = refId(flow && flow.source);
    if (!sourceId) return;
    if (!flowsBySource.has(sourceId)) flowsBySource.set(sourceId, []);
    flowsBySource.get(sourceId).push({ flow, index, analysis: analyzeFlowBranchConditions(flow) });
  });

  function add(code, message, flowIndex, detail = {}) {
    findings.push({
      code,
      message,
      path: `${path}[${flowIndex}].properties.conditioninfo`,
      detail: { workflow, ...detail },
    });
  }

  for (const [sourceId, entries] of flowsBySource.entries()) {
    if (entries.length < 2) continue;
    if (entries.some((entry) => entry.analysis.hasTaskOutcome)) continue;

    const equalityValuesByVariable = new Map();
    for (const entry of entries) {
      for (const [variableId, values] of entry.analysis.equalsByVariable.entries()) {
        if (!equalityValuesByVariable.has(variableId)) equalityValuesByVariable.set(variableId, new Set());
        for (const value of values) equalityValuesByVariable.get(variableId).add(value);
      }
    }

    for (const [variableId, coveredValues] of equalityValuesByVariable.entries()) {
      if (!coveredValues.size) continue;
      const variable = variablesById instanceof Map ? variablesById.get(variableId) : null;
      const choices = extractVariableChoices(variable);
      const choicesSet = new Set(choices);
      const allKnownChoicesCovered = choices.length > 0 && choices.every((choice) => coveredValues.has(choice));
      const complementEntry = entries.find((entry) => {
        const notEquals = entry.analysis.notEqualsByVariable.get(variableId) || new Set();
        const equals = entry.analysis.equalsByVariable.get(variableId) || new Set();
        return equals.size === 0 && Array.from(coveredValues).every((value) => notEquals.has(value));
      });

      const hasUnconditionedFlow = entries.find((entry) => !entry.analysis.hasConditions);
      if (hasUnconditionedFlow) {
        add(
          "WORKFLOW_BRANCH_UNCONDITIONAL_DEFAULT_NOT_SUPPORTED",
          "Yeeflow workflow has no implicit else/default branch; every fan-out SequenceFlow must carry explicit conditioninfo coverage.",
          hasUnconditionedFlow.index,
          {
            sourceId,
            variableId,
            coveredValues: Array.from(coveredValues).map(literalDisplay),
            unconditionedFlowId: entryFlowId(hasUnconditionedFlow),
          },
        );
      }

      if (allKnownChoicesCovered || complementEntry) continue;

      add(
        "WORKFLOW_BRANCH_CONDITION_COVERAGE_INCOMPLETE",
        "Workflow fan-out branches must explicitly cover remaining cases; add a branch with AND not-equals conditions for every already covered equality value.",
        entries[0].index,
        {
          sourceId,
          variableId,
          variableType: variable && (variable.type || variable.valueType) || null,
          coveredValues: Array.from(coveredValues).map(literalDisplay),
          knownChoices: choices,
          missingKnownChoices: choices.length ? choices.filter((choice) => !coveredValues.has(choice)) : [],
          requiredFallbackConditions: Array.from(coveredValues).map((value) => `${variableId} != ${literalDisplay(value)}`),
        },
      );
    }
  }

  return findings;
}

function entryFlowId(entry) {
  return entry && entry.analysis && entry.analysis.flowId || "";
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
  validateWorkflowBranchConditionCoverage,
};

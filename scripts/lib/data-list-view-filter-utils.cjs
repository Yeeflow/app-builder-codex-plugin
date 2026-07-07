"use strict";

const DATA_VIEW_FILTER_EMPTY_OPERATORS = new Set(["7", "isNotNull"]);
const DATA_VIEW_FILTER_NULL_OPERATORS = new Set(["isNull"]);
const DATA_VIEW_FILTER_KNOWN_OPERATORS = new Set([
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "isNull",
  "isNotNull",
]);

function safeString(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function filterExpressionUsesToday(value) {
  if (typeof value === "string") return /\btoday\b/i.test(value);
  if (Array.isArray(value)) return value.some(filterExpressionUsesToday);
  if (!isObject(value)) return false;
  if (typeof value.func === "string" && /^today$/i.test(value.func)) return true;
  if (typeof value.name === "string" && /\btoday\b/i.test(value.name)) return true;
  return Object.values(value).some(filterExpressionUsesToday);
}

function fieldForFilterRef(fieldsByName, fieldRef) {
  const key = safeString(fieldRef);
  if (!key || !fieldsByName || typeof fieldsByName.get !== "function") return null;
  return fieldsByName.get(key) || null;
}

function inferFilterFieldKind(field) {
  const fieldType = safeString(field && field.FieldType).toLowerCase();
  const type = safeString(field && field.Type).toLowerCase();
  if (fieldType === "datetime" || type === "datepicker" || type === "time") return "datetime";
  if (fieldType === "decimal" || ["currency", "percent", "input_number", "rate"].includes(type)) return "number";
  if (fieldType === "bit" || type === "switch") return "boolean";
  return "string";
}

function validateDataViewFixedFilters(options) {
  const {
    filters,
    fieldsByName,
    knownSystemFields = new Set(),
    addIssue,
    severity = "warning",
    viewTitle = null,
    pathPrefix = "LayoutView.filter",
  } = options || {};

  if (filters === undefined || filters === null) return;
  if (!Array.isArray(filters)) {
    addIssue(severity, "DATA_VIEW_FILTER_SHAPE_INVALID", "Data view fixed filter must be an array when present.", {
      title: viewTitle,
      path: pathPrefix,
    });
    return;
  }

  filters.forEach((condition, index) => {
    validateFilterCondition(condition, {
      fieldsByName,
      knownSystemFields,
      addIssue,
      severity,
      viewTitle,
      path: `${pathPrefix}[${index}]`,
    });
  });
}

function validateFilterCondition(condition, context) {
  const { fieldsByName, knownSystemFields, addIssue, severity, viewTitle, path } = context;
  if (!isObject(condition)) {
    addIssue(severity, "DATA_VIEW_FILTER_CONDITION_INVALID", "Data view fixed filter condition must be an object.", {
      title: viewTitle,
      path,
    });
    return;
  }

  const pre = safeString(condition.pre);
  if (pre && !["and", "or"].includes(pre.toLowerCase())) {
    addIssue(severity, "DATA_VIEW_FILTER_PRE_INVALID", "Data view fixed filter pre value must be and/or when present.", {
      title: viewTitle,
      path: `${path}.pre`,
      pre,
    });
  }

  const childConditions = condition.conditions;
  if (childConditions !== undefined) {
    if (!Array.isArray(childConditions) || childConditions.length === 0) {
      addIssue(severity, "DATA_VIEW_FILTER_GROUP_EMPTY", "Data view fixed filter group must include child conditions.", {
        title: viewTitle,
        path: `${path}.conditions`,
      });
    }
    asArray(childConditions).forEach((child, childIndex) => {
      validateFilterCondition(child, {
        ...context,
        path: `${path}.conditions[${childIndex}]`,
      });
    });
    return;
  }

  const fieldName = safeString(condition.left || condition.FieldName || condition.field);
  if (!fieldName) {
    addIssue(severity, "DATA_VIEW_FILTER_FIELD_MISSING", "Data view fixed filter leaf condition must specify a field in left/FieldName/field.", {
      title: viewTitle,
      path,
    });
  } else if (!fieldForFilterRef(fieldsByName, fieldName) && !knownSystemFields.has(fieldName)) {
    addIssue(severity, "DATA_VIEW_FILTER_FIELD_NOT_FOUND", "Data view fixed filter field does not resolve to a list field or known system field.", {
      title: viewTitle,
      path,
      fieldName,
    });
  }

  const op = safeString(condition.op);
  if (!op) {
    addIssue(severity, "DATA_VIEW_FILTER_OPERATOR_MISSING", "Data view fixed filter condition should include an operator.", {
      title: viewTitle,
      path: `${path}.op`,
    });
  } else if (!DATA_VIEW_FILTER_KNOWN_OPERATORS.has(op)) {
    addIssue("warning", "DATA_VIEW_FILTER_OPERATOR_UNPROVEN", "Data view fixed filter operator is not in the current export-proven operator set.", {
      title: viewTitle,
      path: `${path}.op`,
      op,
    });
  }

  if (filterExpressionUsesToday(condition.right)) {
    addIssue(severity, "DATA_VIEW_FILTER_TODAY_FUNCTION_UNSUPPORTED", "Data view fixed filters must use the export-proven now function instead of an unsupported Today function/token.", {
      title: viewTitle,
      path: `${path}.right`,
      op,
    });
  }

  if (DATA_VIEW_FILTER_EMPTY_OPERATORS.has(op) && condition.right !== null && condition.right !== undefined) {
    addIssue(severity, "DATA_VIEW_FILTER_EMPTY_OPERATOR_RIGHT_NOT_NULL", "Data view non-empty fixed filters should use right: null.", {
      title: viewTitle,
      path: `${path}.right`,
      op,
    });
  }
  if (DATA_VIEW_FILTER_NULL_OPERATORS.has(op) && condition.right !== null && condition.right !== undefined) {
    addIssue(severity, "DATA_VIEW_FILTER_NULL_OPERATOR_RIGHT_NOT_NULL", "Data view empty fixed filters should use right: null.", {
      title: viewTitle,
      path: `${path}.right`,
      op,
    });
  }

  const field = fieldForFilterRef(fieldsByName, fieldName);
  const kind = inferFilterFieldKind(field);
  if (op.startsWith("dt.") && field && kind !== "datetime") {
    addIssue(severity, "DATA_VIEW_FILTER_OPERATOR_FIELD_TYPE_MISMATCH", "Date-time data view filter operators must target date/time fields.", {
      title: viewTitle,
      path: `${path}.op`,
      fieldName,
      op,
      fieldKind: kind,
    });
  }
  if (op.startsWith("n.") && field && kind !== "number") {
    addIssue(severity, "DATA_VIEW_FILTER_OPERATOR_FIELD_TYPE_MISMATCH", "Number data view filter operators must target numeric fields.", {
      title: viewTitle,
      path: `${path}.op`,
      fieldName,
      op,
      fieldKind: kind,
    });
  }
  if (op.startsWith("b.") && field && kind !== "boolean") {
    addIssue(severity, "DATA_VIEW_FILTER_OPERATOR_FIELD_TYPE_MISMATCH", "Boolean data view filter operators must target boolean fields.", {
      title: viewTitle,
      path: `${path}.op`,
      fieldName,
      op,
      fieldKind: kind,
    });
  }
}

module.exports = {
  DATA_VIEW_FILTER_EMPTY_OPERATORS,
  DATA_VIEW_FILTER_KNOWN_OPERATORS,
  filterExpressionUsesToday,
  validateDataViewFixedFilters,
};

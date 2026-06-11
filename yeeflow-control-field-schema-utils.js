"use strict";

const fs = require("fs");
const path = require("path");

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function safeString(value) {
  return value === undefined || value === null ? "" : String(value);
}

function repoRoot(startDir = __dirname) {
  let current = startDir;
  for (let i = 0; i < 6; i += 1) {
    if (fs.existsSync(path.join(current, "control-configurations.normalized.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return startDir;
}

function readJsonIfExists(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function loadControlFieldSchemas(options = {}) {
  const baseDir = typeof options === "string" ? options : options.baseDir;
  const base = repoRoot(baseDir || __dirname);
  const control = readJsonIfExists(path.join(base, "control-configurations.normalized.json"));
  const field = readJsonIfExists(path.join(base, "field-configurations.normalized.json"));
  return {
    control,
    field,
    hasControlReference: Boolean(control && control.byControlType),
    hasFieldReference: Boolean(field && field.byFieldType),
  };
}

function getByPath(root, propertyPath) {
  const parts = safeString(propertyPath).split(".");
  let current = root;
  for (const part of parts) {
    if (!part) continue;
    if (!isObject(current) && !Array.isArray(current)) return undefined;
    current = current[part];
  }
  return current;
}

function valueMissing(value) {
  return value === undefined || value === null || value === "";
}

function unwrapConfigValue(value) {
  if (Array.isArray(value) && value.length === 2 && value[0] === null) return value[1];
  return value;
}

function valueMatchesType(value, valueTypes) {
  if (valueMissing(value)) return true;
  const actual = unwrapConfigValue(value);
  if (valueMissing(actual)) return true;
  const types = Array.isArray(valueTypes) ? valueTypes : [valueTypes];
  return types.some((type) => {
    switch (type) {
      case "string":
        return typeof actual === "string";
      case "boolean":
        return typeof actual === "boolean";
      case "number":
        return typeof actual === "number";
      case "array":
        return Array.isArray(actual);
      case "object":
        return isObject(actual);
      case "enum":
        return typeof actual === "string" || typeof actual === "number" || typeof actual === "boolean";
      case "any":
      case "unknown":
        return true;
      default:
        return true;
    }
  });
}

function collectKnownPathIssues(target, typeName, schemaEntry, options = {}) {
  if (!schemaEntry || !isObject(target)) return [];
  const issues = [];
  const supportLevel = schemaEntry.generationSupportLevel || "unknown";
  if (supportLevel !== "proven-safe" && options.warnUnproven !== false) {
    issues.push({
      code: "SCHEMA_SUPPORTED_RUNTIME_UNPROVEN",
      message: `${typeName} is ${supportLevel}; isolate runtime behavior before generator promotion.`,
      detail: { supportLevel },
    });
  }
  for (const [propertyPath, spec] of Object.entries(schemaEntry.properties || {})) {
    const value = getByPath(target, propertyPath);
    if (valueMissing(value)) continue;
    const normalizedValue = unwrapConfigValue(value);
    if (!valueMatchesType(value, spec.valueTypes)) {
      issues.push({
        code: "SCHEMA_VALUE_TYPE_MISMATCH",
        message: `${typeName}.${propertyPath} should match ${spec.valueTypes.join("|")}.`,
        detail: { propertyPath, expected: spec.valueTypes, actual: Array.isArray(value) ? "array" : typeof value },
      });
    }
    if (spec.enum && !valueMissing(normalizedValue)) {
      const stringValue = String(normalizedValue);
      const enumValues = spec.enum.map(String);
      const acceptsRuntimeId = enumValues.includes("{LayoutID}") && /^\d{16,}$/.test(stringValue);
      if (!enumValues.includes(stringValue) && !acceptsRuntimeId) {
        issues.push({
          code: "SCHEMA_ENUM_VALUE_INVALID",
          message: `${typeName}.${propertyPath} has a value outside the normalized enum.`,
          detail: { propertyPath, value: normalizedValue, allowed: spec.enum },
        });
      }
    }
  }
  return issues;
}

function validateControlAgainstSchema(control, schemas, options = {}) {
  const type = safeString(control && (control.type || control.controlType || control.Type)).trim();
  if (!type || !schemas || !schemas.hasControlReference) return [];
  const entry = schemas.control.byControlType[type];
  if (!entry && type === "calculated") {
    return [{
      code: "EXPORT_BACKED_CONTROL_TYPE",
      message: "Control type calculated is export-backed by IT Hardware CAPEX Runtime V2 but not present in control-configurations.normalized.json; validate attrs.calculated before generator promotion.",
      detail: { type, supportLevel: "export-backed-runtime-v2" },
    }];
  }
  if (!entry) {
    return [{
      code: "UNKNOWN_CONTROL_TYPE",
      message: `Control type ${type} is not present in control-configurations.normalized.json.`,
      detail: { type },
    }];
  }
  return collectKnownPathIssues(control, `control ${type}`, entry, options);
}

function validateFieldAgainstSchema(field, schemas, options = {}) {
  const type = safeString(field && (field.Type || field.controlType)).trim();
  if (!type || !schemas || !schemas.hasFieldReference) return [];
  const entry = schemas.field.byFieldType[type];
  if (!entry) {
    return [{
      code: "UNKNOWN_FIELD_TYPE",
      message: `Field/control type ${type} is not present in field-configurations.normalized.json.`,
      detail: { type },
    }];
  }
  const target = { ...field };
  if (typeof field.Rules === "string") {
    try {
      target.Rules = field.Rules ? JSON.parse(field.Rules) : {};
    } catch {
      target.Rules = {};
    }
  }
  return collectKnownPathIssues(target, `field ${type}`, entry, options);
}

function isGeneratedValueControl(controlType) {
  return new Set([
    "input",
    "textarea",
    "richtext",
    "input_number",
    "percent",
    "currency",
    "radio",
    "checkbox",
    "switch",
    "datepicker",
    "daterange",
    "time",
    "file-upload",
    "icon-upload",
    "identity-picker",
    "organization-picker",
    "location-picker",
    "cost-center-picker",
    "lookup",
    "lookup-list",
    "calculated",
    "signer",
    "tag",
    "metadata",
    "mutiple-metadata",
    "rate",
    "hyperlink",
  ]).has(controlType);
}

module.exports = {
  loadControlFieldSchemas,
  validateControlAgainstSchema,
  validateFieldAgainstSchema,
  isGeneratedValueControl,
};

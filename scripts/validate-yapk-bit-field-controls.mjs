#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import zlib from "node:zlib";

const VALID_BIT_CONTROL_TYPE = "switch";
const VALID_BIT_DEFAULT_VALUES = new Set(["0", "1"]);

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.package) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const result = validateYapkBitFieldControls(args.package);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "pass" ? 0 : 1);
}

export function validateYapkBitFieldControls(packagePath) {
  const resolvedPackage = path.resolve(packagePath);
  const findings = [];
  let decoded;

  try {
    decoded = loadDecodedPackage(resolvedPackage);
  } catch (error) {
    findings.push({
      code: "YAPK_BIT_PACKAGE_DECODE_FAILED",
      severity: "error",
      path: "$",
      message: error.message,
    });
    return buildResult(resolvedPackage, findings);
  }

  const children = Array.isArray(decoded.Childs) ? decoded.Childs : [];
  for (const [childIndex, child] of children.entries()) {
    validateChildBitFields(child, childIndex, findings);
  }

  return buildResult(resolvedPackage, findings);
}

function validateChildBitFields(child, childIndex, findings) {
  const listId = stringValue(child?.List?.ListID || child?.ListID);
  const listTitle = stringValue(child?.List?.Title || child?.Title || `Child ${childIndex + 1}`);
  const fields = normalizedFields(child);
  const bitFields = fields.filter((field) => stringValue(field.FieldType) === "Bit");
  if (!bitFields.length) return;

  for (const [fieldIndex, field] of bitFields.entries()) {
    const fieldPath = `$.Childs[${childIndex}].Fields[${fieldIndexByIdentity(fields, field)}]`;
    const fieldLabel = `${listTitle}.${stringValue(field.DisplayName || field.FieldName || field.FieldID || `Bit ${fieldIndex + 1}`)}`;
    if (stringValue(field.Type) !== VALID_BIT_CONTROL_TYPE) {
      findings.push({
        code: "YAPK_BIT_FIELD_CONTROL_TYPE_INVALID",
        severity: "error",
        path: `${fieldPath}.Type`,
        listId,
        fieldId: stringValue(field.FieldID),
        fieldName: stringValue(field.FieldName),
        actual: field.Type,
        expected: VALID_BIT_CONTROL_TYPE,
        message: `${fieldLabel} must use Type "${VALID_BIT_CONTROL_TYPE}" when FieldType is "Bit".`,
      });
    }
    if (!VALID_BIT_DEFAULT_VALUES.has(stringValue(field.DefaultValue))) {
      findings.push({
        code: "YAPK_BIT_DEFAULT_VALUE_INVALID",
        severity: "error",
        path: `${fieldPath}.DefaultValue`,
        listId,
        fieldId: stringValue(field.FieldID),
        fieldName: stringValue(field.FieldName),
        actual: field.DefaultValue,
        expected: [...VALID_BIT_DEFAULT_VALUES],
        message: `${fieldLabel} must use a generated-final default value of "0" or "1".`,
      });
    }
  }

  const bitFieldKeys = new Map();
  for (const field of bitFields) {
    for (const key of fieldMatchKeys(field)) bitFieldKeys.set(key, field);
  }

  for (const layoutRef of collectLayoutViews(child, childIndex)) {
    for (const row of collectFieldRows(layoutRef.value, layoutRef.path, findings)) {
      const matched = matchLayoutRowToBitField(row.value, bitFieldKeys);
      if (!matched) continue;
      if (stringValue(row.value.Type) !== VALID_BIT_CONTROL_TYPE) {
        findings.push({
          code: "YAPK_BIT_LAYOUT_CONTROL_TYPE_INVALID",
          severity: "error",
          path: `${row.path}.Type`,
          listId,
          fieldId: stringValue(matched.FieldID),
          fieldName: stringValue(matched.FieldName),
          actual: row.value.Type,
          expected: VALID_BIT_CONTROL_TYPE,
          message: `${listTitle}.${stringValue(matched.DisplayName || matched.FieldName)} must use "${VALID_BIT_CONTROL_TYPE}" in every LayoutView field row.`,
        });
      }
    }
  }
}

function normalizedFields(child) {
  if (Array.isArray(child?.Fields)) return child.Fields;
  if (Array.isArray(child?.List?.Fields)) return child.List.Fields;
  if (Array.isArray(child?.Defs)) return child.Defs;
  if (Array.isArray(child?.List?.Defs)) return child.List.Defs;
  return [];
}

function collectLayoutViews(child, childIndex) {
  const refs = [];
  if (child?.List?.LayoutView !== undefined) refs.push({ path: `$.Childs[${childIndex}].List.LayoutView`, value: child.List.LayoutView });
  if (child?.LayoutView !== undefined) refs.push({ path: `$.Childs[${childIndex}].LayoutView`, value: child.LayoutView });
  const layouts = Array.isArray(child?.Layouts) ? child.Layouts : Array.isArray(child?.List?.Layouts) ? child.List.Layouts : [];
  for (const [layoutIndex, layout] of layouts.entries()) {
    if (layout?.LayoutView !== undefined) refs.push({ path: `$.Childs[${childIndex}].Layouts[${layoutIndex}].LayoutView`, value: layout.LayoutView });
  }
  return refs;
}

function collectFieldRows(value, sourcePath, findings) {
  if (value === null || value === undefined || value === "") return [];
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch (error) {
      findings.push({
        code: "YAPK_BIT_LAYOUTVIEW_JSON_INVALID",
        severity: "error",
        path: sourcePath,
        message: `LayoutView must be valid JSON when Bit fields are present: ${error.message}`,
      });
      return [];
    }
  }
  const rows = [];
  walk(parsed, sourcePath, rows);
  return rows;
}

function walk(value, currentPath, rows) {
  if (!value || typeof value !== "object") return;
  if (!Array.isArray(value) && "Type" in value && ("FieldID" in value || "FieldName" in value || "field" in value || "Field" in value)) {
    rows.push({ path: currentPath, value });
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${currentPath}[${index}]`, rows));
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    walk(item, `${currentPath}.${key}`, rows);
  }
}

function matchLayoutRowToBitField(row, bitFieldKeys) {
  for (const key of fieldMatchKeys(row)) {
    if (bitFieldKeys.has(key)) return bitFieldKeys.get(key);
  }
  return null;
}

function fieldMatchKeys(value) {
  return [
    value?.FieldID,
    value?.fieldId,
    value?.fieldID,
    value?.FieldName,
    value?.fieldName,
    value?.field,
    value?.Field,
    value?.InternalName,
  ]
    .map((item) => stringValue(item))
    .filter(Boolean);
}

function fieldIndexByIdentity(fields, target) {
  const index = fields.findIndex((field) => field === target);
  return index === -1 ? 0 : index;
}

function loadDecodedPackage(filePath) {
  const wrapper = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (wrapper?.Resource && typeof wrapper.Resource === "string") {
    const inflated = zlib.brotliDecompressSync(Buffer.from(wrapper.Resource, "base64")).toString("utf8");
    return JSON.parse(inflated);
  }
  if (wrapper?.Data && wrapper.Data.Childs) return wrapper.Data;
  return wrapper;
}

function buildResult(packagePath, findings) {
  const errors = findings.filter((finding) => finding.severity === "error");
  return {
    status: errors.length ? "fail" : "pass",
    package: {
      path: packagePath,
      exists: fs.existsSync(packagePath),
      fileSize: fs.existsSync(packagePath) ? fs.statSync(packagePath).size : null,
    },
    summary: {
      findings: findings.length,
      errors: errors.length,
    },
    findings,
  };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help") args.help = true;
    else if (token === "--json") args.json = true;
    else if (token === "--package") {
      args.package = argv[index + 1];
      index += 1;
    } else if (!token.startsWith("--") && !args.package) {
      args.package = token;
    }
  }
  return args;
}

function printUsage() {
  console.log("Usage: node scripts/validate-yapk-bit-field-controls.mjs --package <generated-final.yapk> [--json]");
}

function stringValue(value) {
  return value === undefined || value === null ? "" : String(value);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}

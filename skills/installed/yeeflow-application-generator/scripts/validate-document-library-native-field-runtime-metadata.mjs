#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { asArray, isObject, readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const MAX_UPLOAD_BYTES = 2147483648;
const FIELD_CONTRACTS = Object.freeze([
  {
    fieldName: "Title",
    fieldType: "Text",
    fieldIndex: 0,
    displayName: "Name",
    controlType: "input",
    status: 1,
    isSystem: true,
    isIndex: true,
    rules: { displayLabel: true, isLibrary: true },
  },
  {
    fieldName: "Bigint1",
    fieldType: "Bigint",
    fieldIndex: 1,
    displayName: "ParentID",
    controlType: "input_number",
    status: 127,
    isSystem: false,
    isIndex: false,
    rules: { displayLabel: true, isNotInListFiles: true },
  },
  {
    fieldName: "Text1",
    fieldType: "Text",
    fieldIndex: 1,
    displayName: "Type",
    controlType: "input",
    status: 119,
    isSystem: false,
    isIndex: false,
    rules: { displayLabel: true },
  },
  {
    fieldName: "Bigint2",
    fieldType: "Bigint",
    fieldIndex: 2,
    displayName: "FileSize",
    controlType: "input_number",
    status: 99,
    isSystem: false,
    isIndex: false,
    rules: { displayLabel: true, readonly: true },
  },
  {
    fieldName: "Text2",
    fieldType: "Text",
    fieldIndex: 2,
    displayName: "Extension",
    controlType: "input",
    status: 99,
    isSystem: false,
    isIndex: false,
    rules: { displayLabel: true, readonly: true },
  },
  {
    fieldName: "Text3",
    fieldType: "Text",
    fieldIndex: 3,
    displayName: "UniqueName",
    controlType: "input",
    status: 319,
    isSystem: false,
    isIndex: false,
    rules: { displayLabel: true, isNotInListFiles: true },
  },
  {
    fieldName: "Text4",
    fieldType: "Text",
    fieldIndex: 4,
    displayName: "Upload File",
    controlType: "file-upload",
    status: 57,
    isSystem: false,
    isIndex: false,
    rules: { displayLabel: true, required: true, isLabrary: true, PROP_MAXSIZE: MAX_UPLOAD_BYTES },
    forbiddenRules: ["isLibrary"],
  },
]);

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.package) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateDocumentLibraryNativeFieldRuntimeMetadata(args.package);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateDocumentLibraryNativeFieldRuntimeMetadata(packagePath) {
  const resolvedPackage = path.resolve(packagePath);
  const findings = [];
  if (!fs.existsSync(resolvedPackage)) {
    findings.push(error("DOCUMENT_LIBRARY_RUNTIME_METADATA_PACKAGE_MISSING", "YAPK package does not exist.", { package: resolvedPackage }));
    return report(resolvedPackage, 0, findings);
  }

  let decoded;
  try {
    ({ decoded } = readDecodedYapk(resolvedPackage));
  } catch (err) {
    findings.push(error("DOCUMENT_LIBRARY_RUNTIME_METADATA_PACKAGE_DECODE_FAILED", `Could not decode YAPK Resource: ${err.message}`, { package: resolvedPackage }));
    return report(resolvedPackage, 0, findings);
  }

  const libraries = asArray(decoded?.Childs)
    .map((child, index) => ({ child, index }))
    .filter(({ child }) => Number(child?.List?.Type) === 16);
  for (const library of libraries) validateLibrary(library, findings);
  return report(resolvedPackage, libraries.length, findings);
}

function validateLibrary({ child, index }, findings) {
  const title = String(child?.List?.Title || `Childs[${index}]`);
  const fields = asArray(child?.Fields);
  const fieldByName = new Map(fields.map((field) => [String(field?.FieldName || ""), field]));
  for (const contract of FIELD_CONTRACTS) {
    const field = fieldByName.get(contract.fieldName);
    const fieldPath = `$.Childs[${index}].Fields.${contract.fieldName}`;
    if (!field) {
      findings.push(error("DOCUMENT_LIBRARY_NATIVE_FIELD_MISSING", `Document Library ${title} is missing required native field ${contract.fieldName}.`, { library: title, fieldName: contract.fieldName, path: fieldPath }));
      continue;
    }
    if (String(field.FieldType || "") !== contract.fieldType) {
      findings.push(error("DOCUMENT_LIBRARY_NATIVE_FIELD_TYPE_INVALID", `${contract.fieldName} must preserve FieldType ${contract.fieldType}.`, detail(title, contract.fieldName, fieldPath, contract.fieldType, field.FieldType)));
    }
    if (Number(field.FieldIndex) !== contract.fieldIndex) {
      findings.push(error("DOCUMENT_LIBRARY_NATIVE_FIELD_INDEX_INVALID", `${contract.fieldName} must preserve FieldIndex ${contract.fieldIndex}.`, detail(title, contract.fieldName, fieldPath, contract.fieldIndex, field.FieldIndex)));
    }
    if (String(field.DisplayName || "") !== contract.displayName || String(field.InternalName || "") !== contract.fieldName) {
      findings.push(error("DOCUMENT_LIBRARY_NATIVE_FIELD_IDENTITY_INVALID", `${contract.fieldName} must preserve its export-proven DisplayName and InternalName.`, {
        library: title,
        fieldName: contract.fieldName,
        path: fieldPath,
        expected: { DisplayName: contract.displayName, InternalName: contract.fieldName },
        actual: { DisplayName: field.DisplayName ?? null, InternalName: field.InternalName ?? null },
      }));
    }
    if (String(field.Type || "") !== contract.controlType) {
      findings.push(error("DOCUMENT_LIBRARY_NATIVE_FIELD_CONTROL_INVALID", `${contract.fieldName} must preserve control Type ${contract.controlType}.`, detail(title, contract.fieldName, fieldPath, contract.controlType, field.Type)));
    }
    if (Number(field.Status) !== contract.status) {
      findings.push(error("DOCUMENT_LIBRARY_NATIVE_FIELD_STATUS_INVALID", `${contract.fieldName} must preserve runtime Status ${contract.status}.`, detail(title, contract.fieldName, `${fieldPath}.Status`, contract.status, field.Status)));
    }
    if (Boolean(field.IsSystem) !== contract.isSystem) {
      findings.push(error("DOCUMENT_LIBRARY_NATIVE_FIELD_SYSTEM_FLAG_INVALID", `${contract.fieldName} must preserve IsSystem ${contract.isSystem}.`, detail(title, contract.fieldName, `${fieldPath}.IsSystem`, contract.isSystem, field.IsSystem)));
    }
    if (Boolean(field.IsIndex) !== contract.isIndex) {
      findings.push(error("DOCUMENT_LIBRARY_NATIVE_FIELD_INDEX_FLAG_INVALID", `${contract.fieldName} must preserve IsIndex ${contract.isIndex}.`, detail(title, contract.fieldName, `${fieldPath}.IsIndex`, contract.isIndex, field.IsIndex)));
    }
    const rules = parseRules(field.Rules);
    if (!rules) {
      findings.push(error("DOCUMENT_LIBRARY_NATIVE_FIELD_RULES_INVALID", `${contract.fieldName} Rules must be parseable JSON or an object.`, { library: title, fieldName: contract.fieldName, path: `${fieldPath}.Rules` }));
      continue;
    }
    for (const [ruleName, expected] of Object.entries(contract.rules)) {
      if (rules[ruleName] !== expected) {
        findings.push(error("DOCUMENT_LIBRARY_NATIVE_FIELD_RULE_INVALID", `${contract.fieldName} Rules.${ruleName} must equal ${JSON.stringify(expected)}.`, {
          library: title,
          fieldName: contract.fieldName,
          path: `${fieldPath}.Rules.${ruleName}`,
          expected,
          actual: rules[ruleName] ?? null,
        }));
      }
    }
    for (const forbiddenRule of contract.forbiddenRules || []) {
      if (Object.prototype.hasOwnProperty.call(rules, forbiddenRule)) {
        findings.push(error("DOCUMENT_LIBRARY_NATIVE_FIELD_RULE_UNSUPPORTED", `${contract.fieldName} must not carry unsupported Rules.${forbiddenRule}; preserve the runtime-proven export contract.`, {
          library: title,
          fieldName: contract.fieldName,
          path: `${fieldPath}.Rules.${forbiddenRule}`,
          actual: rules[forbiddenRule],
        }));
      }
    }
  }
}

function parseRules(value) {
  if (isObject(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = JSON.parse(value);
    return isObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function detail(library, fieldName, pathValue, expected, actual) {
  return { library, fieldName, path: pathValue, expected, actual: actual ?? null };
}

function report(packagePath, documentLibraryCount, findings) {
  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    package: packagePath,
    documentLibraryCount,
    contract: "document-library-native-field-runtime-metadata-v1",
    findings,
    proofBoundary: "Static generated-final metadata validation. Runtime browser open, folder navigation, upload, persistence, Version Management, and server behavior remain separate proof stages.",
  };
}

function error(code, message, details = {}) {
  return { level: "error", code, message, ...details };
}

function parseArgs(argv) {
  const args = { package: "", help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") args.help = true;
    else if (token === "--package") {
      args.package = argv[i + 1] || "";
      i += 1;
    } else if (!args.package && !token.startsWith("--")) args.package = token;
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function printUsage() {
  console.log("Usage: node scripts/validate-document-library-native-field-runtime-metadata.mjs --package <generated-final.yapk>");
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}

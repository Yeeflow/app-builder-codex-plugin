#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const INTERNAL_NAME_RE = /^[A-Za-z0-9_]+$/;
const PROCESS_KEY_RE = /^[A-Za-z0-9_]+$/;
const IDENTIFIER_MAX_LENGTH = 255;
const CUSTOM_LIST_MODEL_TYPES = new Set([1, 16, 32, 64, 128, 1024]);
const SUPPORTED_TYPES = new Set([
  "input", "textarea", "richtext", "hyperlink",
  "input_number", "currency", "percent", "calculated-column", "rate",
  "switch", "checkbox", "radio", "select", "tag",
  "datepicker", "time",
  "identity-picker", "organization-picker", "cost-center-picker", "signer",
  "file-upload", "icon-upload",
  "lookup", "metadata", "mutiple-metadata", "location-picker", "flowstatus", "autonumber", "list",
]);
const SYSTEM_FIELDS = new Set(["ListDataID", "Title", "Created", "CreatedBy", "CreatedByName", "Modified", "ModifiedBy", "ModifiedByName", "Author", "Editor", "Status", "TenantID", "AppID", "ListID", "ListSetID"]);

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-app-creation-rules.mjs <app.yap|list.ydl|decoded.json> [--list <name>]",
    "",
    "Checks product-team app creation rules without printing raw package payloads.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function quoteLargeIntegers(jsonText) {
  let out = "";
  let i = 0;
  let inString = false;
  let escaped = false;
  while (i < jsonText.length) {
    const ch = jsonText[i];
    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "\"") inString = false;
      i += 1;
      continue;
    }
    if (ch === "\"") {
      inString = true;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      const start = i;
      let j = i;
      if (jsonText[j] === "-") j += 1;
      while (j < jsonText.length && jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (j < jsonText.length && /[0-9eE+\-.]/.test(jsonText[j])) j += 1;
        out += jsonText.slice(start, j);
      } else {
        const token = jsonText.slice(start, j);
        out += LARGE_INTEGER_RE.test(token) ? `"${token}"` : token;
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJson(text) {
  return JSON.parse(quoteLargeIntegers(text));
}

function decodeInput(inputPath) {
  const wrapper = parseJson(fs.readFileSync(inputPath, "utf8"));
  if (typeof wrapper.Resource === "string" && wrapper.Resource.startsWith(GZIP_PREFIX)) {
    const resource = parseJson(zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"));
    return parseJson(resource.Data);
  }
  return wrapper.Data && wrapper.Item ? wrapper.Data : wrapper;
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, lists: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--list") args.lists.push(argv[++i]);
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input) usage();
  return args;
}

function safeString(value) {
  return value === undefined || value === null ? "" : String(value);
}

function expectedFieldTypeForFieldName(fieldName) {
  const name = safeString(fieldName);
  if (name === "Title" || /^Text\d+$/i.test(name)) return { family: "text", allowed: ["text", "string"] };
  if (/^Datetime\d+$/i.test(name)) return { family: "date", allowed: ["datetime", "date", "time"] };
  if (/^Decimal\d+$/i.test(name)) return { family: "decimal", allowed: ["decimal", "currency", "number"] };
  if (/^Bigint\d+$/i.test(name)) return { family: "integer", allowed: ["bigint", "int", "integer", "number"] };
  if (/^Bit\d+$/i.test(name)) return { family: "boolean", allowed: ["bit", "bool", "boolean"] };
  return null;
}

function label(value, fallback) {
  const raw = safeString(value).trim();
  if (!raw) return fallback;
  return raw.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "__EMAIL_REDACTED__").slice(0, 120);
}

function addFinding(findings, level, code, message, detail = {}) {
  findings.push({ level, code, message, detail });
}

function inspectList(list, index, findings) {
  const title = label(list?.ListModel?.Title, `<list-${index + 1}>`);
  for (const key of ["Defs", "Layouts"]) {
    if (!Object.prototype.hasOwnProperty.call(list || {}, key)) addFinding(findings, "error", `LIST_EXPORT_ITEM_${key.toUpperCase()}_MISSING`, `ListExportItem.${key} is required; use [] when empty.`, { list: title });
    else if (list?.[key] === null) addFinding(findings, "error", `LIST_EXPORT_ITEM_${key.toUpperCase()}_NULL`, `ListExportItem.${key} cannot be null; use [] when empty.`, { list: title });
    else if (!Array.isArray(list?.[key])) addFinding(findings, "error", `LIST_EXPORT_ITEM_${key.toUpperCase()}_NOT_ARRAY`, `ListExportItem.${key} must be an array.`, { list: title, actualType: typeof list?.[key] });
  }
  if (!list?.ListModel || typeof list.ListModel !== "object") {
    addFinding(findings, "error", "LIST_EXPORT_ITEM_LISTMODEL_MISSING", "ListExportItem.ListModel is required for generated app/list resources.", { list: title });
  } else {
    if (list.ListModel.Flags !== 1) {
      addFinding(findings, "error", "LISTMODEL_FLAGS_MISSING_OR_INVALID", "Product schema v2 requires CustomListModel.Flags = 1 on generated root and child list resources; missing or different values can fail import.", { list: title, value: list.ListModel.Flags });
    }
    if (list.ListModel.Status !== undefined && list.ListModel.Status !== 1) {
      addFinding(findings, "error", "LISTMODEL_STATUS_INVALID", "Product schema v2 fixes CustomListModel.Status to 1 when present.", { list: title, value: list.ListModel.Status });
    }
    if (list.ListModel.Type !== undefined && !CUSTOM_LIST_MODEL_TYPES.has(Number(list.ListModel.Type))) {
      addFinding(findings, "error", "LISTMODEL_TYPE_INVALID", "Product schema v2 allows CustomListModel.Type values 1, 16, 32, 64, 128, or 1024.", { list: title, value: list.ListModel.Type });
    }
  }
  const seen = {
    DisplayName: new Map(),
    FieldName: new Map(),
    InternalName: new Map(),
  };
  for (const [fieldIndex, field] of (list?.Defs || []).entries()) {
    const location = `${title}.Defs[${fieldIndex}]`;
    for (const key of ["DisplayName", "FieldName", "InternalName"]) {
      const value = safeString(field?.[key]);
      if (!value) continue;
      if (value.length > IDENTIFIER_MAX_LENGTH) addFinding(findings, "error", `FIELD_${key.toUpperCase()}_TOO_LONG`, `${key} exceeds 255 characters.`, { location, length: value.length });
      if (seen[key].has(value)) addFinding(findings, "error", `FIELD_${key.toUpperCase()}_DUPLICATE`, `${key} must be unique within a list.`, { list: title, value, firstLocation: seen[key].get(value), location });
      else seen[key].set(value, location);
    }
    const internalName = safeString(field?.InternalName);
    if (internalName && !INTERNAL_NAME_RE.test(internalName)) addFinding(findings, "error", "FIELD_INTERNAL_NAME_INVALID_CHARS", "InternalName may contain only letters, numbers, and underscores.", { location, internalName });
    const type = safeString(field?.Type).toLowerCase();
    if (type && !SUPPORTED_TYPES.has(type)) addFinding(findings, "warning", "LIST_FIELD_TYPE_UNSUPPORTED", "List field Type is not in the product-team supported Type list.", { location, type });
    const fieldName = safeString(field?.FieldName);
    const fieldType = safeString(field?.FieldType).toLowerCase();
    const expectedFieldType = expectedFieldTypeForFieldName(fieldName);
    if (expectedFieldType && fieldType && !expectedFieldType.allowed.some((token) => fieldType.includes(token))) {
      addFinding(findings, "error", "FIELD_NAME_FIELDTYPE_MISMATCH", "FieldName storage prefix must align with FieldType; generated fields cloned by array position can import but fail seed/add runtime behavior.", {
        location,
        fieldName,
        fieldType: field?.FieldType,
        expectedFamily: expectedFieldType.family,
      });
    }
    const numericIndex = Number(field?.FieldIndex);
    if (fieldName && !SYSTEM_FIELDS.has(fieldName) && Number.isInteger(numericIndex) && numericIndex > 0) {
      const match = fieldName.match(/(\d+)$/);
      if (!match) addFinding(findings, "error", "FIELD_NAME_NUMERIC_SUFFIX_MISSING", "FieldName numeric suffix must match FieldIndex.", { location, fieldName, fieldIndex: numericIndex });
      else if (Number(match[1]) !== numericIndex) addFinding(findings, "error", "FIELD_NAME_FIELDINDEX_MISMATCH", "FieldName numeric suffix must match FieldIndex.", { location, fieldName, fieldIndex: numericIndex, suffix: Number(match[1]) });
    }
  }
}

function parseDef(form) {
  if (!form?.DefResource) return null;
  if (typeof form.DefResource === "object") return form.DefResource;
  try {
    return JSON.parse(form.DefResource);
  } catch {
    return null;
  }
}

function inspectNoRule(form, index, findings) {
  const name = label(form?.Name, `<form-${index + 1}>`);
  const noRule = form?.NoRule;
  if (!noRule || typeof noRule !== "object" || Array.isArray(noRule)) {
    addFinding(findings, "error", "NORULE_INVALID_OBJECT", "NoRule must be an object with Prefix, StartIndex, CustomLength, and AutoIncrement.", { form: name, actualType: Array.isArray(noRule) ? "array" : noRule === null ? "null" : typeof noRule });
    return;
  }
  if (typeof noRule.Prefix !== "string" || !noRule.Prefix.includes("{index}")) addFinding(findings, "error", "NORULE_PREFIX_INDEX_MISSING", "NoRule.Prefix must include {index}.", { form: name });
  for (const [prop, minimum] of [["StartIndex", 1], ["CustomLength", 1], ["AutoIncrement", 0]]) {
    if (!Number.isInteger(noRule[prop]) || noRule[prop] < minimum) addFinding(findings, "error", `NORULE_${prop.toUpperCase()}_INVALID`, `NoRule.${prop} must be an integer >= ${minimum}.`, { form: name });
  }
}

function inspectProcessKey(form, index, findings) {
  const name = label(form?.Name || form?.FlowName, `<form-${index + 1}>`);
  const def = parseDef(form);
  for (const [source, key] of [["Key", form?.Key || form?.FlowKey], ["defkey", def?.defkey]]) {
    const value = safeString(key);
    if (!value) continue;
    if (value.length > IDENTIFIER_MAX_LENGTH) addFinding(findings, "error", "PROCESS_KEY_TOO_LONG", "Process keys must not exceed 255 characters.", { form: name, source, keyLength: value.length });
    if (!PROCESS_KEY_RE.test(value)) addFinding(findings, "error", "PROCESS_KEY_INVALID_CHARS", "Process keys may contain only letters, numbers, and underscores.", { form: name, source, key: value });
  }
}

function main() {
  const args = parseArgs(process.argv);
  const input = args.input;
  const data = decodeInput(input);
  const targetListNames = new Set(args.lists);
  const lists = [data.Item, ...(data.Childs || [])]
    .filter(Boolean)
    .filter((list) => !targetListNames.size || targetListNames.has(safeString(list?.ListModel?.Title)));
  const findings = [];
  for (const listName of targetListNames) {
    if (!lists.some((list) => safeString(list?.ListModel?.Title) === listName)) {
      addFinding(findings, "error", "TARGET_LIST_NOT_FOUND", "Requested target list was not found.", { list: listName });
    }
  }
  lists.forEach((list, index) => inspectList(list, index, findings));
  (data.Forms || []).forEach((form, index) => {
    inspectProcessKey(form, index, findings);
    const def = parseDef(form);
    const workflowType = String(form.WorkflowType || "");
    const approvalLike = workflowType === "2";
    if (approvalLike) inspectNoRule(form, index, findings);
  });
  const errors = findings.filter((finding) => finding.level === "error").length;
  const warnings = findings.filter((finding) => finding.level === "warning").length;
  console.log(JSON.stringify({
    input: path.basename(input),
    lists: lists.length,
    forms: (data.Forms || []).length,
    errors,
    warnings,
    status: errors ? "fail" : "pass",
    findings,
  }, null, 2));
  if (errors) process.exitCode = 1;
}

main();

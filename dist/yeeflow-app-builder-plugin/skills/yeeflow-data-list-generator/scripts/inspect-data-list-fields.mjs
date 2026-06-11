#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const INTERNAL_NAME_RE = /^[A-Za-z0-9_]+$/;
const IDENTIFIER_MAX_LENGTH = 255;

const SUPPORTED_FIELD_TYPES = new Set([
  "input",
  "textarea",
  "richtext",
  "hyperlink",
  "input_number",
  "currency",
  "percent",
  "calculated-column",
  "rate",
  "switch",
  "checkbox",
  "radio",
  "select",
  "tag",
  "datepicker",
  "time",
  "identity-picker",
  "organization-picker",
  "cost-center-picker",
  "signer",
  "file-upload",
  "icon-upload",
  "lookup",
  "metadata",
  "mutiple-metadata",
  "location-picker",
  "flowstatus",
  "autonumber",
  "list",
]);

const SYSTEM_FIELD_NAMES = new Set([
  "ListDataID",
  "Title",
  "Created",
  "CreatedBy",
  "CreatedByName",
  "Modified",
  "ModifiedBy",
  "ModifiedByName",
  "Author",
  "Editor",
  "Status",
  "TenantID",
  "AppID",
  "ListID",
  "ListSetID",
]);

const TYPE_TO_REF_FILE = {
  input: "field-input-single-line.normalized.json",
  textarea: "field-textarea-multiple-line.normalized.json",
  richtext: "field-richtext.normalized.json",
  hyperlink: "field-hyperlink.normalized.json",
  input_number: "field-input-number.normalized.json",
  currency: "field-currency.normalized.json",
  percent: "field-percent.normalized.json",
  "calculated-column": "field-calculated-column.normalized.json",
  rate: "field-rate.normalized.json",
  switch: "field-switch.normalized.json",
  checkbox: "field-checkbox.normalized.json",
  radio: "field-radio.normalized.json",
  select: "field-select.normalized.json",
  tag: "field-tag.normalized.json",
  datepicker: "field-datepicker.normalized.json",
  time: "field-time.normalized.json",
  "identity-picker": "field-identity-picker.normalized.json",
  "organization-picker": "field-organization-picker.normalized.json",
  "cost-center-picker": "field-cost-center-picker.normalized.json",
  signer: "field-signer.normalized.json",
  "file-upload": "field-file-upload.normalized.json",
  "icon-upload": "field-icon-upload.normalized.json",
  lookup: "field-lookup.normalized.json",
  metadata: "field-metadata.normalized.json",
  "mutiple-metadata": "field-mutiple-metadata.normalized.json",
  "location-picker": "field-location-picker.normalized.json",
  flowstatus: "field-flowstatus.normalized.json",
  autonumber: "field-autonumber.normalized.json",
  list: "field-list-sublist.normalized.json",
};

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-data-list-fields.mjs <app.yap|list.ydl|decoded.json> [--list <name>] [--json <report.json>] [--normalized-dir <dir>]",
    "",
    "Examples:",
    "  node scripts/inspect-data-list-fields.mjs '/Users/Renger/Downloads/Data Lists (2).yap' --list 'Data list with fields part A' --list 'Data list with fields part B'",
    "  node scripts/inspect-data-list-fields.mjs sample.yap --json tmp/report.json --normalized-dir docs/studies/normalized/data-list-fields",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, lists: [], json: null, normalizedDir: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--list") args.lists.push(argv[++i]);
    else if (arg === "--json") args.json = argv[++i];
    else if (arg === "--normalized-dir") args.normalizedDir = argv[++i];
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input) usage();
  return args;
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
      while (jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (/[0-9eE+\-.]/.test(jsonText[j] || "")) j += 1;
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

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value) {
  return value === undefined || value === null ? "" : String(value);
}

function parseMaybeJson(value) {
  if (isObject(value) || Array.isArray(value)) return { ok: true, value };
  if (typeof value !== "string" || !value.trim()) return { ok: true, value: {} };
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch (error) {
    return { ok: false, value: {}, error: error.message };
  }
}

function decodeInput(inputPath) {
  const parsed = parseJson(fs.readFileSync(inputPath, "utf8"));
  if (typeof parsed.Resource === "string" && parsed.Resource.startsWith(GZIP_PREFIX)) {
    const resource = parseJson(zlib.gunzipSync(Buffer.from(parsed.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"));
    return {
      wrapper: { title: parsed.Title || null, isListSet: parsed.IsListSet },
      resource: { mainListType: resource.MainListType, appId: resource.AppID },
      data: typeof resource.Data === "string" ? parseJson(resource.Data) : resource.Data,
    };
  }
  if (typeof parsed.Data === "string") {
    return {
      wrapper: null,
      resource: { mainListType: parsed.MainListType, appId: parsed.AppID },
      data: parseJson(parsed.Data),
    };
  }
  return { wrapper: null, resource: null, data: parsed.Data && parsed.Item ? parsed.Data : parsed };
}

function addFinding(findings, level, code, message, detail = {}) {
  findings.push({ level, code, message, detail });
}

function fieldLabel(field, index) {
  return `field-${index + 1}`;
}

function listLabel(list, index) {
  const title = safeString(list?.ListModel?.Title);
  if (title === "Data list with fields part A" || title === "Data list with fields part B") return title;
  return `list-${index + 1}`;
}

function uniqueSettingKeys(fields) {
  const keys = new Set();
  for (const field of fields) {
    const parsed = parseMaybeJson(field.Rules);
    Object.keys(parsed.value || {}).forEach((key) => keys.add(key));
  }
  return [...keys].sort();
}

function validateField(field, fieldIndex, list, listIndex, fieldNameSeen, internalNameSeen, displayNameSeen, findings, listsById, fieldsByListId) {
  const type = safeString(field.Type);
  const fieldName = safeString(field.FieldName);
  const internalName = safeString(field.InternalName);
  const displayName = safeString(field.DisplayName);
  const location = `${listLabel(list, listIndex)}.Defs[${fieldIndex}]`;
  const rulesParsed = parseMaybeJson(field.Rules);
  const rules = rulesParsed.value || {};

  if (!rulesParsed.ok) addFinding(findings, "error", "FIELD_RULES_JSON_INVALID", "Field Rules must parse as JSON.", { location, field: fieldLabel(field, fieldIndex), error: rulesParsed.error });

  for (const [key, value, seen] of [
    ["DisplayName", displayName, displayNameSeen],
    ["FieldName", fieldName, fieldNameSeen],
    ["InternalName", internalName, internalNameSeen],
  ]) {
    if (value && value.length > IDENTIFIER_MAX_LENGTH) addFinding(findings, "error", `FIELD_${key.toUpperCase()}_TOO_LONG`, `${key} must not exceed 255 characters.`, { location, length: value.length });
    if (value) {
      if (seen.has(value)) addFinding(findings, "error", `FIELD_${key.toUpperCase()}_DUPLICATE`, `${key} must be unique within the same list.`, { location, firstLocation: seen.get(value) });
      else seen.set(value, location);
    }
  }

  if (internalName && !INTERNAL_NAME_RE.test(internalName)) addFinding(findings, "error", "FIELD_INTERNAL_NAME_INVALID_CHARS", "InternalName may contain only letters, numbers, and underscores.", { location });
  if (type && !SUPPORTED_FIELD_TYPES.has(type)) addFinding(findings, "warning", "LIST_FIELD_TYPE_UNSUPPORTED", "Field Type is not in the export-learned supported list.", { location, type });

  const numericIndex = Number(field.FieldIndex);
  if (fieldName && !SYSTEM_FIELD_NAMES.has(fieldName) && Number.isInteger(numericIndex) && numericIndex > 0) {
    const suffix = fieldName.match(/(\d+)$/);
    if (!suffix) addFinding(findings, "error", "FIELD_NAME_NUMERIC_SUFFIX_MISSING", "FieldName numeric suffix must match FieldIndex.", { location, fieldName, fieldIndex: numericIndex });
    else if (Number(suffix[1]) !== numericIndex) addFinding(findings, "error", "FIELD_NAME_FIELDINDEX_MISMATCH", "FieldName numeric suffix must match FieldIndex.", { location, fieldName, fieldIndex: numericIndex, suffix: Number(suffix[1]) });
  }

  if (["checkbox", "radio", "select"].includes(type) && !Array.isArray(rules.choices)) {
    addFinding(findings, "error", "CHOICE_OPTIONS_MISSING", "Choice fields must include Rules.choices.", { location, type });
  }
  if (type === "tag" && rules.customTags !== true && !Array.isArray(rules.customTags) && !Array.isArray(rules.choices)) {
    addFinding(findings, "warning", "TAG_OPTIONS_MISSING", "Tag fields should include customTags or choices when generated.", { location });
  }
  if (type === "lookup") {
    const missing = ["appid", "listid", "listsetid", "listfield"].filter((key) => !rules[key]);
    if (missing.length) addFinding(findings, "error", "LOOKUP_RULES_INCOMPLETE", "Lookup field is missing required target metadata.", { location, missing });
    const targetList = listsById.get(safeString(rules.listid));
    if (rules.listid && !targetList) addFinding(findings, "warning", "LOOKUP_TARGET_EXTERNAL", "Lookup target list is outside the inspected package or not found.", { location });
    const targetFields = fieldsByListId.get(safeString(rules.listid)) || new Map();
    if (rules.listfield && targetList && !targetFields.has(safeString(rules.listfield))) {
      addFinding(findings, "warning", "LOOKUP_DISPLAY_FIELD_NOT_FOUND", "Lookup display field does not resolve on the target list.", { location, listfield: safeString(rules.listfield) });
    }
  }
  if (type === "calculated-column") {
    if (!rules.calculated_result || !rules.calculated) addFinding(findings, "warning", "CALCULATED_COLUMN_RULES_INCOMPLETE", "Calculated column should include calculated_result and calculated Rules.", { location });
  }
  if (["metadata", "mutiple-metadata"].includes(type)) {
    if (!rules.source || !rules.categoryId) addFinding(findings, "warning", "METADATA_SOURCE_MISSING", "Metadata-backed fields should include source and categoryId.", { location, type });
  }
  if (type === "tag" && (!rules.source || !rules.category)) {
    addFinding(findings, "warning", "TAG_SOURCE_MISSING", "Tag fields should include source and category.", { location, type });
  }
  if (type === "list") {
    if (!Array.isArray(rules["list-variables"])) addFinding(findings, "warning", "SUBLIST_VARIABLES_MISSING", "Sub-list fields should include Rules.list-variables.", { location });
    for (const [nestedIndex, nestedField] of asArray(rules["list-variables"]).entries()) {
      const nestedName = safeString(nestedField.name || nestedField.fieldName);
      const nestedType = safeString(nestedField.type || nestedField.controlType);
      if (!nestedName || !nestedType) addFinding(findings, "warning", "SUBLIST_NESTED_FIELD_INCOMPLETE", "Sub-list nested field entries should include name and type.", { location, nestedIndex });
    }
  }
  if (type === "autonumber") {
    for (const key of ["minDigits", "startNum"]) {
      if (rules[key] === undefined) addFinding(findings, "warning", "AUTONUMBER_RULES_INCOMPLETE", "Auto number fields should include minDigits and startNum.", { location, missing: key });
    }
  }
}

function summarizeField(field, index) {
  const rulesParsed = parseMaybeJson(field.Rules);
  const rules = rulesParsed.value || {};
  return {
    sourceField: fieldLabel(field, index),
    displayNamePlaceholder: `__DISPLAY_NAME_${index + 1}__`,
    type: field.Type || null,
    fieldType: field.FieldType || null,
    fieldIndex: field.FieldIndex ?? null,
    fieldName: field.FieldName || null,
    internalNamePlaceholder: `__INTERNAL_NAME_${index + 1}__`,
    required: rules.required === true,
    unique: field.IsUnique === true,
    isSystem: field.IsSystem === true,
    settingKeys: Object.keys(rules).sort(),
    defaultValueShape: field.DefaultValue === null || field.DefaultValue === undefined || field.DefaultValue === "" ? "empty" : Array.isArray(field.DefaultValue) ? "array" : typeof field.DefaultValue,
    proofLevel: "export-proven",
  };
}

function sanitizeRuleValue(value, key = "") {
  if (Array.isArray(value)) return value.map((item, index) => sanitizeRuleValue(item, `${key}[${index}]`));
  if (isObject(value)) {
    const out = {};
    for (const [childKey, child] of Object.entries(value)) out[childKey] = sanitizeRuleValue(child, childKey);
    return out;
  }
  if (/id|appid|listid|listsetid|tenant|user|by|category/i.test(key)) return value === undefined || value === null || value === "" ? value : "__ID_REDACTED__";
  if (/field|name|title|label|value|placeholder|prefix|suffix/i.test(key) && typeof value === "string" && value.trim()) return `__${key.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_REDACTED__`;
  return value;
}

function sanitizeField(field, index) {
  const rulesParsed = parseMaybeJson(field.Rules);
  const rules = sanitizeRuleValue(rulesParsed.value || {});
  return {
    FieldID: "__FIELD_ID__",
    ListID: "__LIST_ID__",
    FieldName: field.FieldName || null,
    FieldType: field.FieldType || null,
    FieldIndex: field.FieldIndex ?? null,
    DisplayName: `__DISPLAY_NAME_${index + 1}__`,
    InternalName: `__INTERNAL_NAME_${index + 1}__`,
    Type: field.Type || null,
    Status: field.Status ?? null,
    Category: field.Category ?? null,
    DefaultValueShape: field.DefaultValue === null || field.DefaultValue === undefined || field.DefaultValue === "" ? "empty" : typeof field.DefaultValue,
    Rules: rules,
    AppCreationRules: {
      fieldNameSuffixMatchesFieldIndex: true,
      identifiersUniqueWithinList: true,
      internalNamePattern: "^[A-Za-z0-9_]+$",
    },
    Proof: "export-proven; values redacted",
  };
}

function buildReport(decoded, targetNames) {
  const allLists = [decoded.data?.Item, ...asArray(decoded.data?.Childs)].filter(Boolean);
  const listsById = new Map(allLists.map((list) => [safeString(list?.ListModel?.ListID), list]));
  const fieldsByListId = new Map(allLists.map((list) => [
    safeString(list?.ListModel?.ListID),
    new Map(asArray(list?.Defs).map((field) => [safeString(field.FieldName), field])),
  ]));
  const targetSet = new Set(targetNames);
  const targetLists = targetNames.length
    ? allLists.filter((list) => targetSet.has(safeString(list?.ListModel?.Title)))
    : allLists.filter((list) => Number(list?.ListModel?.Type) === 1);

  const findings = [];
  for (const name of targetNames) {
    if (!targetLists.some((list) => safeString(list?.ListModel?.Title) === name)) {
      addFinding(findings, "error", "TARGET_LIST_NOT_FOUND", "Requested target list was not found.", { list: name });
    }
  }

  const listReports = targetLists.map((list, listIndex) => {
    const fields = asArray(list.Defs);
    const fieldNameSeen = new Map();
    const internalNameSeen = new Map();
    const displayNameSeen = new Map();
    fields.forEach((field, index) => validateField(field, index, list, listIndex, fieldNameSeen, internalNameSeen, displayNameSeen, findings, listsById, fieldsByListId));
    return {
      list: listLabel(list, allLists.indexOf(list)),
      resourceType: list?.ListModel?.Type ?? null,
      fieldCount: fields.length,
      customFieldCount: fields.filter((field) => field.IsSystem !== true).length,
      systemFieldCount: fields.filter((field) => field.IsSystem === true).length,
      fieldTypes: [...new Set(fields.map((field) => safeString(field.Type)).filter(Boolean))].sort(),
      primitiveFieldTypes: [...new Set(fields.map((field) => safeString(field.FieldType)).filter(Boolean))].sort(),
      settingKeys: uniqueSettingKeys(fields),
      fields: fields.map(summarizeField),
    };
  });

  const fields = targetLists.flatMap((list) => asArray(list.Defs));
  return {
    input: path.basename(process.argv[2] || ""),
    sourcePath: path.resolve(process.argv[2] || ""),
    proofBoundary: {
      dataListFields: "export-proven",
      documentLibraryApplicability: "product/user-understanding-backed unless a Type 16 export proves the exact field shape",
      runtimeBehavior: "not runtime-proven",
    },
    packageSummary: {
      title: decoded.wrapper?.title || null,
      appResourceCount: allLists.length,
      targetListCount: targetLists.length,
      targetLists: listReports.map((list) => list.list),
      totalFields: fields.length,
      totalCustomFields: fields.filter((field) => field.IsSystem !== true).length,
      totalSystemFields: fields.filter((field) => field.IsSystem === true).length,
      fieldTypesFound: [...new Set(fields.map((field) => safeString(field.Type)).filter(Boolean))].sort(),
      primitiveFieldTypesFound: [...new Set(fields.map((field) => safeString(field.FieldType)).filter(Boolean))].sort(),
    },
    lists: listReports,
    findings,
    errors: findings.filter((finding) => finding.level === "error").length,
    warnings: findings.filter((finding) => finding.level === "warning").length,
  };
}

function writeNormalizedRefs(report, decoded, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const targetNames = new Set(report.packageSummary.targetLists);
  const allLists = [decoded.data?.Item, ...asArray(decoded.data?.Childs)].filter(Boolean);
  const targetLists = allLists.filter((list) => targetNames.has(listLabel(list, allLists.indexOf(list))));
  const firstByType = new Map();
  for (const list of targetLists) {
    for (const [index, field] of asArray(list.Defs).entries()) {
      const type = safeString(field.Type);
      if (type && TYPE_TO_REF_FILE[type] && !firstByType.has(type)) firstByType.set(type, { field, index });
    }
  }
  for (const [type, { field, index }] of firstByType.entries()) {
    const fileName = TYPE_TO_REF_FILE[type];
    fs.writeFileSync(path.join(outputDir, fileName), `${JSON.stringify({
      fieldType: type,
      proof: "export-proven from Data Lists (2).yap target data lists; private values redacted",
      exportPath: "Data.Childs[].Defs[]",
      normalizedField: sanitizeField(field, index),
    }, null, 2)}\n`);
  }
}

function main() {
  const args = parseArgs(process.argv);
  const decoded = decodeInput(args.input);
  const report = buildReport(decoded, args.lists);
  const output = JSON.stringify(report, null, 2);
  if (args.json) {
    fs.mkdirSync(path.dirname(args.json), { recursive: true });
    fs.writeFileSync(args.json, `${output}\n`);
  }
  if (args.normalizedDir) writeNormalizedRefs(report, decoded, args.normalizedDir);
  console.log(output);
  if (report.errors) process.exitCode = 1;
}

main();

#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { validateWorkflowActionShapes } = require("./workflow-action-config-validator");
const {
  loadControlFieldSchemas,
  validateFieldAgainstSchema,
} = require("./yeeflow-control-field-schema-utils");

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const PLACEHOLDER_RE = /^__.*REQUIRED.*__$/;
const SECRET_KEY_RE = /(token|secret|password|credential|clientsecret|apikey|api_key|accesskey)/i;
const HEX_COLOR_RE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const ROOT_STYLE_TOKEN_HEX = new Map([
  ["#0065ff", "--c--primary"],
  ["#e6f0ff", "--c--primary-light"],
  ["#00d1ff", "--c--secondary"],
  ["#15df42", "--c--success"],
  ["#f9c434", "--c--warning"],
  ["#f61515", "--c--danger"],
  ["#b3b7c0", "--c--neutral"],
  ["#ffffff", "--c--background"],
  ["#071638", "--c--text"],
  ["#e7e9eb", "--c--neutral-light-active"],
  ["#f7f8f9", "--c--neutral-light"],
  ["#f4f4f6", "--c--neutral-light-hover"],
]);
const CUSTOM_FORM_DISPLAY_USAGES = ["add", "edit", "view"];
const CUSTOM_FORM_OPEN_MODE_LABELS = {
  modal: "Pop-up window",
  slide: "Slide in",
  target: "Current page",
  new: "New page",
  page: "Full page",
  fullpage: "Full page",
  fullPage: "Full page",
};
const CUSTOM_FORM_SIZE_LABELS = new Map([[0, "Medium"], [1, "Small"], [2, "Large"], [3, "Full screen"]]);
const PUBLIC_FORM_ALLOWED_FIELD_TYPES = new Set([
  "input",
  "textarea",
  "richtext",
  "input_number",
  "percent",
  "currency",
  "switch",
  "radio",
  "checkbox",
  "datepicker",
  "time",
  "file-upload",
  "icon-upload",
  "rate",
  "hyperlink",
  "signer",
  "list",
]);
const PUBLIC_FORM_DISALLOWED_FIELD_TYPES = new Set([
  "identity-picker",
  "organization-picker",
  "location-picker",
  "lookup",
  "calculated-column",
  "metadata",
  "mutiple-metadata",
  "cost-center-picker",
  "tag",
  "autonumber",
]);
const PUBLIC_FORM_DISALLOWED_SYSTEM_FIELDS = new Set([
  "ListDataID",
  "Id",
  "ID",
  "Created",
  "CreatedBy",
  "CreatedByName",
  "Modified",
  "ModifiedBy",
  "ModifiedByName",
]);
const PUBLIC_FORM_KNOWN_CONTROL_TYPES = new Set([
  "container",
  "flex_grid",
  "action_button",
  "submit-button",
  ...PUBLIC_FORM_ALLOWED_FIELD_TYPES,
  "text",
  "number",
  "boolean",
  "date",
  "file",
  "metadata",
  "user",
  "costcenter",
  "groupselect",
  "location",
  "lookup",
  "img",
  "total",
]);

const KNOWN_SYSTEM_FIELDS = new Set([
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
const APP_CREATION_SUPPORTED_LIST_TYPES = new Set([
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
const APP_CREATION_IDENTIFIER_MAX_LENGTH = 255;
const APP_CREATION_INTERNAL_NAME_RE = /^[A-Za-z0-9_]+$/;
const APP_CREATION_PROCESS_KEY_RE = /^[A-Za-z0-9_]+$/;

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node validate-ydl-list.js <list.ydl|decoded-data.json> --mode <compatibility|generator> [--stage <draft|final>] [--dependency-map <json>]",
    "",
    "Examples:",
    "  node validate-ydl-list.js \"./Portfolio Management.ydl\" --mode compatibility",
    "  node validate-ydl-list.js \"./generated-list.decoded.json\" --mode generator --stage draft",
    "  node validate-ydl-list.js \"./generated-list.decoded.json\" --mode generator --stage final",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, mode: "generator", stage: "final", dependencyMap: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--mode") args.mode = argv[++i];
    else if (arg === "--stage") args.stage = argv[++i];
    else if (arg === "--dependency-map") args.dependencyMap = argv[++i];
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input || !["compatibility", "generator"].includes(args.mode) || !["draft", "final"].includes(args.stage)) usage();
  return args;
}

function loadDependencyMap(filePath, report) {
  if (!filePath) return null;
  try {
    const dependencyMap = parseJsonPreservingLargeInts(fs.readFileSync(filePath, "utf8"), report._largeNumbers);
    report.dependencyMap = path.resolve(filePath);
    return dependencyMap;
  } catch (error) {
    issue(report, "error", "DEPENDENCY_MAP_PARSE_FAILED", "Dependency map could not be parsed.", { filePath, error: error.message });
    return null;
  }
}

function quoteLargeIntegers(jsonText, largeNumbers) {
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
        if (LARGE_INTEGER_RE.test(token)) {
          largeNumbers.add(token);
          out += `"${token}"`;
        } else {
          out += token;
        }
      }
      i = j;
      continue;
    }

    out += ch;
    i += 1;
  }

  return out;
}

function parseJsonPreservingLargeInts(text, largeNumbers) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function zeroPadding(padding) {
  const value = Array.isArray(padding) ? padding[1] : padding;
  if (!isObject(value)) return false;
  return ["top", "right", "bottom", "left"].every((side) => value[side] === "--sp--s0" || value[side] === 0 || value[side] === "0" || value[side] === "");
}

function safeString(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!isObject(value)) return value;
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    out[key] = SECRET_KEY_RE.test(key) ? "__REDACTED__" : redact(child);
  }
  return out;
}

function tryParseJson(value) {
  if (typeof value !== "string" || !value.trim()) return { ok: false, value: null };
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch (error) {
    return { ok: false, value: null, error: error.message };
  }
}

function walk(value, visitor, pointer = "$") {
  visitor(value, pointer);
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visitor, `${pointer}[${index}]`));
  } else if (isObject(value)) {
    for (const [key, child] of Object.entries(value)) walk(child, visitor, `${pointer}.${key}`);
  }
}

function walkControls(control, visitor, pointer = "$") {
  if (!isObject(control)) return;
  visitor(control, pointer);
  for (const key of ["children", "columns"]) {
    if (Array.isArray(control[key])) {
      control[key].forEach((child, index) => walkControls(child, visitor, `${pointer}.${key}[${index}]`));
    }
  }
}

function findControlByLabel(root, label) {
  let found = null;
  walkControls(root, (control) => {
    if (!found && control && control.nv_label === label) found = control;
  });
  return found;
}

function controlContains(parent, child) {
  if (!parent || !child) return false;
  let found = false;
  walkControls(parent, (control) => {
    if (control === child) found = true;
  });
  return found;
}

function normalizeType(field, rules = {}) {
  const fieldType = safeString(field.FieldType).toLowerCase();
  const controlType = safeString(field.Type).toLowerCase();
  const combined = `${fieldType} ${controlType}`;
  if (controlType === "lookup" || rules.listid || rules.listsetid || rules.listfield) return "lookup";
  if (controlType === "metadata" || controlType === "mutiple-metadata") return "metadata";
  if (controlType === "textarea" || controlType === "richtext") return "longText";
  if (controlType === "checkbox") return "multiChoice";
  if (controlType === "radio" || controlType === "dropdown" || controlType === "select") return "choice";
  if (controlType === "datepicker") return rules.showtime === true || rules.showtime === "true" ? "datetime" : "date";
  if (controlType === "switch" || fieldType === "bit") return "boolean";
  if (controlType === "hyperlink") return "hyperlink";
  if (controlType === "list") return "list";
  if (controlType === "flowstatus") return "flowstatus";
  if (combined.includes("file") || combined.includes("attachment")) return "file";
  if (combined.includes("identity") || combined.includes("user") || combined.includes("person")) return "user";
  if (combined.includes("currency")) return "currency";
  if (combined.includes("percent")) return "percent";
  if (combined.includes("decimal") || combined.includes("number") || combined.includes("int")) return "number";
  if (combined.includes("calculated") || rules.calculated || rules.expression || rules.formula) return "calculated";
  if (combined.includes("datetime")) return "datetime";
  if (combined.includes("date")) return "date";
  if (combined.includes("text") || controlType === "input") return "text";
  return "unknown";
}

function isTruthy(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function isPlaceholder(value) {
  return typeof value === "string" && PLACEHOLDER_RE.test(value);
}

function isLargeNumericId(value) {
  return typeof value === "string" && LARGE_INTEGER_RE.test(value);
}

function validateGeneratedId(report, value, code, message, details = {}) {
  if (report.mode !== "generator" || report.stage !== "final") return;
  if (value === undefined || value === null || value === "" || isPlaceholder(value)) return;
  if (!isLargeNumericId(value)) issue(report, "warning", code, message, { value, ...details });
}

function validateGeneratedAppId(report, value, details = {}) {
  if (report.mode !== "generator" || report.stage !== "final") return;
  if (value === undefined || value === null || value === "" || isPlaceholder(value)) return;
  if (String(value) !== "41") {
    issue(report, "warning", "GENERATED_APP_ID_NOT_DEFAULT_41", "Generated .ydl AppID is not the studied default value 41; confirm target app metadata.", { value, ...details });
  }
}

function generatorFinalSeverity(report) {
  return report.mode === "generator" && report.stage === "final" ? "error" : "warning";
}

function validateAppCreationFieldRules(field, report, context = {}) {
  const severity = generatorFinalSeverity(report);
  const fieldName = safeString(field && field.FieldName);
  const internalName = safeString(field && field.InternalName);
  const displayName = safeString(field && field.DisplayName);
  const type = safeString(field && field.Type).toLowerCase();
  const location = context.location || "field";

  for (const [key, value] of [["DisplayName", displayName], ["FieldName", fieldName], ["InternalName", internalName]]) {
    if (value && value.length > APP_CREATION_IDENTIFIER_MAX_LENGTH) {
      issue(report, severity, `FIELD_${key.toUpperCase()}_TOO_LONG`, `${key} must not exceed 255 characters.`, { location, length: value.length });
    }
  }

  if (internalName && !APP_CREATION_INTERNAL_NAME_RE.test(internalName)) {
    issue(report, severity, "FIELD_INTERNAL_NAME_INVALID_CHARS", "InternalName may contain only letters, numbers, and underscores.", { location, internalName });
  }

  if (type && !APP_CREATION_SUPPORTED_LIST_TYPES.has(type)) {
    issue(report, "warning", "LIST_FIELD_TYPE_UNSUPPORTED", "List field Type is not in the product-team supported Type list.", { location, fieldName, type });
  }

  if (!fieldName || KNOWN_SYSTEM_FIELDS.has(fieldName)) return;
  const fieldIndex = Number(field && field.FieldIndex);
  if (!Number.isInteger(fieldIndex) || fieldIndex <= 0) return;
  const suffixMatch = fieldName.match(/(\d+)$/);
  if (!suffixMatch) {
    issue(report, severity, "FIELD_NAME_NUMERIC_SUFFIX_MISSING", "FieldName numeric suffix must match FieldIndex; generated non-system fields must end with their FieldIndex value.", { location, fieldName, fieldIndex });
    return;
  }
  const suffix = Number(suffixMatch[1]);
  if (suffix !== fieldIndex) {
    issue(report, severity, "FIELD_NAME_FIELDINDEX_MISMATCH", "FieldName numeric suffix must match FieldIndex.", { location, fieldName, fieldIndex, suffix });
  }
}

function validateProcessKey(value, report, context = {}) {
  const key = safeString(value);
  if (!key) return;
  const severity = generatorFinalSeverity(report);
  if (key.length > APP_CREATION_IDENTIFIER_MAX_LENGTH) {
    issue(report, severity, "PROCESS_KEY_TOO_LONG", "Process keys must not exceed 255 characters.", { location: context.location, keyLength: key.length });
  }
  if (!APP_CREATION_PROCESS_KEY_RE.test(key)) {
    issue(report, severity, "PROCESS_KEY_INVALID_CHARS", "Process keys may contain only letters, numbers, and underscores.", { location: context.location, key });
  }
}

function decodeInput(inputPath, report) {
  const raw = fs.readFileSync(inputPath, "utf8");
  let parsed;
  try {
    parsed = parseJsonPreservingLargeInts(raw, report._largeNumbers);
  } catch (error) {
    report.errors.push({ code: "INVALID_JSON", message: `Input is not valid JSON: ${error.message}` });
    return null;
  }

  const decoded = {
    wrapper: null,
    resource: null,
    data: null,
    inputKind: "decodedData",
    format: {
      wrapperJsonValid: true,
      hasResource: false,
      resourceHasGzipPrefix: false,
      resourceBase64GzipValid: false,
      resourceJsonValid: false,
      resourceDataJsonValid: false,
    },
  };

  if (isObject(parsed) && typeof parsed.Resource === "string") {
    decoded.inputKind = "ydlWrapper";
    decoded.wrapper = redact(parsed);
    decoded.format.hasResource = true;
    decoded.format.resourceHasGzipPrefix = parsed.Resource.startsWith(GZIP_PREFIX);
    if (!decoded.format.resourceHasGzipPrefix) {
      report.errors.push({ code: "RESOURCE_PREFIX_MISSING", message: `Resource must start with ${GZIP_PREFIX}` });
      return decoded;
    }

    try {
      const compressed = Buffer.from(parsed.Resource.slice(GZIP_PREFIX.length), "base64");
      const resourceText = zlib.gunzipSync(compressed).toString("utf8");
      decoded.format.resourceBase64GzipValid = true;
      decoded.resource = redact(parseJsonPreservingLargeInts(resourceText, report._largeNumbers));
      decoded.format.resourceJsonValid = true;
      if (typeof decoded.resource.Data !== "string") {
        report.errors.push({ code: "RESOURCE_DATA_MISSING", message: "Resource.Data must be a JSON string." });
      } else {
        decoded.data = redact(parseJsonPreservingLargeInts(decoded.resource.Data, report._largeNumbers));
        decoded.format.resourceDataJsonValid = true;
      }
    } catch (error) {
      report.errors.push({ code: "RESOURCE_DECODE_FAILED", message: `Resource could not be base64/gzip decoded or parsed: ${error.message}` });
    }
    return decoded;
  }

  if (isObject(parsed) && typeof parsed.Data === "string" && parsed.MainListType !== undefined) {
    decoded.inputKind = "decodedResource";
    decoded.resource = redact(parsed);
    decoded.format.resourceJsonValid = true;
    try {
      decoded.data = redact(parseJsonPreservingLargeInts(parsed.Data, report._largeNumbers));
      decoded.format.resourceDataJsonValid = true;
    } catch (error) {
      report.errors.push({ code: "RESOURCE_DATA_PARSE_FAILED", message: `Resource.Data JSON failed to parse: ${error.message}` });
    }
    return decoded;
  }

  decoded.data = redact(parsed);
  decoded.format.resourceDataJsonValid = true;
  return decoded;
}

function addDependency(report, dependency) {
  const key = JSON.stringify(dependency);
  if (!report._dependencyKeys.has(key)) {
    report._dependencyKeys.add(key);
    report.dependencies.push(dependency);
  }
}

function issue(report, severity, code, message, details = {}) {
  const entry = { code, message, ...redact(details) };
  if (severity === "error") report.errors.push(entry);
  else report.warnings.push(entry);
}

function generatorOrWarning(report, code, message, details = {}) {
  issue(report, report.mode === "generator" ? "error" : "warning", code, message, details);
}

function detectPlaceholders(root, report) {
  walk(root, (value, pointer) => {
    if (typeof value === "string" && PLACEHOLDER_RE.test(value)) {
      const placeholder = { placeholder: value, path: pointer };
      report.placeholders.push(placeholder);
      if (report.mode === "generator" && report.stage === "final") {
        issue(report, "error", "UNRESOLVED_PLACEHOLDER", `Unresolved placeholder ${value}`, placeholder);
      } else if (report.mode === "generator" && report.stage === "draft") {
        issue(report, "warning", "UNRESOLVED_PLACEHOLDER_DRAFT", `Draft placeholder remains: ${value}`, placeholder);
      } else {
        issue(report, "warning", "UNRESOLVED_PLACEHOLDER_COMPAT", `Placeholder found in compatibility mode: ${value}`, placeholder);
      }
    }
  });
}

function validateDesignSystemColorUsage(root, report) {
  if (report.mode !== "generator") return;
  const literalHits = [];
  const arbitraryHits = [];
  walk(root, (node, pointer) => {
    if (typeof node !== "string") return;
    for (const match of node.matchAll(HEX_COLOR_RE)) {
      const color = match[0].toLowerCase();
      const token = ROOT_STYLE_TOKEN_HEX.get(color);
      const hit = { color: match[0], path: pointer, token: token || null };
      if (token) literalHits.push(hit);
      else arbitraryHits.push(hit);
    }
  });
  if (literalHits.length) {
    issue(report, "warning", "DESIGN_SYSTEM_RESOLVED_TOKEN_COLOR", "Generated list UI contains literal hex colors that match known Yeeflow root tokens. Prefer token references where supported, but do not fail exports that store resolved values.", {
      count: literalHits.length,
      examples: literalHits.slice(0, 8),
    });
  }
  if (arbitraryHits.length > 8) {
    issue(report, "warning", "DESIGN_SYSTEM_ARBITRARY_COLOR_USAGE", "Generated list UI contains many hard-coded hex colors. Prefer semantic Yeeflow root tokens where supported.", {
      count: arbitraryHits.length,
      examples: arbitraryHits.slice(0, 8),
    });
  }
}

function validateStructure(data, resource, report) {
  if (!isObject(data)) {
    issue(report, "error", "DATA_NOT_OBJECT", "Decoded Data must be an object.");
    return null;
  }
  if (!isObject(data.Item)) issue(report, "error", "ITEM_MISSING", "Data.Item must exist.");
  const item = isObject(data.Item) ? data.Item : {};
  if (!isObject(item.ListModel)) issue(report, "error", "LIST_MODEL_MISSING", "Data.Item.ListModel must exist.");
  for (const key of ["Defs", "Layouts"]) {
    if (!Object.prototype.hasOwnProperty.call(item, key)) {
      issue(report, "error", `${key.toUpperCase()}_MISSING`, `Data.Item.${key} is required by yap-schema.json. Use [] when empty.`);
    } else if (item[key] === null) {
      issue(report, "error", `${key.toUpperCase()}_NULL`, `Data.Item.${key} cannot be null. Use [] when empty.`);
    } else if (!Array.isArray(item[key])) {
      issue(report, "error", `${key.toUpperCase()}_NOT_ARRAY`, `Data.Item.${key} must be an array.`);
    }
  }
  if (item.ListDatas !== undefined && !isObject(item.ListDatas)) issue(report, "error", "LISTDATAS_NOT_OBJECT", "Data.Item.ListDatas must be an object if present.");
  if (data.Forms !== undefined && !Array.isArray(data.Forms)) issue(report, "error", "FORMS_NOT_ARRAY", "Data.Forms must be an array if present.");
  if (resource && resource.MainListType === undefined) issue(report, "error", "MAIN_LIST_TYPE_MISSING", "Resource.MainListType must exist.");
  return item;
}

function validateIdentity(item, resource, report) {
  const model = item.ListModel || {};
  const isDocumentLibrary = Number(model.Type || (resource && resource.MainListType)) === 16;
  if (!model.Title && !model.Name) issue(report, "error", "LIST_TITLE_MISSING", "ListModel title/name is required.");
  if (!model.AppID && !(resource && resource.AppID)) issue(report, "error", "APP_ID_MISSING", "AppID is required.");
  if (!model.ListID) issue(report, "error", "LIST_ID_MISSING", "ListID is required.");
  if (!model.ListSetID) issue(report, "warning", "LISTSET_ID_MISSING", "ListSetID is missing or not included in this standalone list export.");
  if (!isDocumentLibrary && !((resource && resource.MainListType !== undefined) || model.ListType !== undefined)) {
    issue(report, "error", "MAIN_LIST_TYPE_MISSING", "MainListType or ListModel.ListType is required.");
  }
  validateGeneratedAppId(report, model.AppID || (resource && resource.AppID), { path: "Item.ListModel.AppID" });
  validateGeneratedId(report, model.ListSetID, "GENERATED_LISTSET_ID_NOT_LARGE_NUMERIC_STRING", "Generated ListSetID should be a large numeric string ID.", { path: "Item.ListModel.ListSetID" });
  validateGeneratedId(report, model.ListID, "GENERATED_LIST_ID_NOT_LARGE_NUMERIC_STRING", "Generated ListID should be a large numeric string ID.", { path: "Item.ListModel.ListID" });
  if (isDocumentLibrary) {
    if (model.Type !== 16) issue(report, "warning", "DOCUMENT_LIBRARY_TYPE_UNUSUAL", "Standalone document library ListModel.Type should be 16.", { type: model.Type });
    if (model.IsItemPerm !== true) issue(report, "warning", "DOCUMENT_LIBRARY_ITEM_PERMISSION_UNUSUAL", "Studied document libraries keep IsItemPerm true; confirm generated permission behavior if this differs.", { isItemPerm: model.IsItemPerm });
  }
}

function validatePermissionsAndNotifications(item, report) {
  const model = item.ListModel || {};
  const isListOrDocumentLibrary = [1, 16].includes(Number(model.Type || 1));
  if (!isListOrDocumentLibrary) return;
  if (model.Perm !== undefined && typeof model.Perm !== "number") {
    issue(report, "warning", "DATA_LIST_PERMISSION_PERM_INVALID", "ListModel.Perm should be numeric when present.", { location: "Item.ListModel.Perm", valueType: typeof model.Perm });
  }
  if (model.IsBreakInherit !== undefined && typeof model.IsBreakInherit !== "boolean") {
    issue(report, "warning", "DATA_LIST_PERMISSION_INHERIT_FLAG_INVALID", "ListModel.IsBreakInherit should be boolean when present.", { location: "Item.ListModel.IsBreakInherit", valueType: typeof model.IsBreakInherit });
  }
  if (model.IsItemPerm !== undefined && typeof model.IsItemPerm !== "boolean") {
    issue(report, "warning", "DATA_LIST_PERMISSION_ITEM_FLAG_INVALID", "ListModel.IsItemPerm should be boolean when present.", { location: "Item.ListModel.IsItemPerm", valueType: typeof model.IsItemPerm });
  }
  if (model.AdvanceList !== undefined && !Array.isArray(model.AdvanceList)) {
    issue(report, "warning", "DATA_LIST_PERMISSION_ADVANCELIST_INVALID", "ListModel.AdvanceList should be an array when present in studied data-list exports.", { location: "Item.ListModel.AdvanceList" });
  }

  const knownNotificationTypes = new Set(["1", "2", "3", "4"]);
  const knownRecipientTypes = new Set(["1", "2", "3"]);
  asArray(item.RemindRules).forEach((rule, index) => {
    if (!isObject(rule)) {
      issue(report, "warning", "DATA_LIST_NOTIFICATION_RULE_NOT_OBJECT", "RemindRules entries should be objects.", { location: `Item.RemindRules[${index}]` });
      return;
    }
    const type = safeString(rule.Type);
    if (type && !knownNotificationTypes.has(type)) {
      issue(report, "warning", "DATA_LIST_NOTIFICATION_TYPE_UNKNOWN", "Unknown RemindRules Type; export-proven types are 1 item-added, 2 regular reminder, 3 date-field reminder, and 4 item-changed.", { location: `Item.RemindRules[${index}].Type`, type });
    }
    const parsedRules = typeof rule.Rules === "string" ? tryParseJson(rule.Rules) : { ok: isObject(rule.Rules), value: rule.Rules };
    if (!parsedRules.ok || !isObject(parsedRules.value)) {
      issue(report, "warning", "DATA_LIST_NOTIFICATION_RULES_JSON_INVALID", "RemindRules.Rules should parse as JSON.", { location: `Item.RemindRules[${index}].Rules` });
    } else {
      const conditionData = parsedRules.value.Conditions && parsedRules.value.Conditions.Data;
      if (typeof conditionData === "string" && conditionData.trim()) {
        const parsedConditions = tryParseJson(conditionData);
        if (!parsedConditions.ok || !Array.isArray(parsedConditions.value)) {
          issue(report, "warning", "DATA_LIST_NOTIFICATION_CONDITIONS_JSON_INVALID", "RemindRules.Conditions.Data should parse as an array when non-empty.", { location: `Item.RemindRules[${index}].Rules.Conditions.Data` });
        }
      }
    }
    const parsedReceiver = typeof rule.Receiver === "string" ? tryParseJson(rule.Receiver) : { ok: isObject(rule.Receiver), value: rule.Receiver };
    if (!parsedReceiver.ok || !isObject(parsedReceiver.value)) {
      issue(report, "warning", "DATA_LIST_NOTIFICATION_RECEIVER_JSON_INVALID", "RemindRules.Receiver should parse as JSON.", { location: `Item.RemindRules[${index}].Receiver` });
    } else {
      asArray(parsedReceiver.value.Identities).forEach((identity, identityIndex) => {
        const recipientType = safeString(identity && identity.Type);
        if (recipientType && !knownRecipientTypes.has(recipientType)) {
          issue(report, "warning", "DATA_LIST_NOTIFICATION_RECIPIENT_TYPE_UNKNOWN", "Unknown notification recipient Type; export-proven values are 1 user, 2 department, and 3 user group.", { location: `Item.RemindRules[${index}].Receiver.Identities[${identityIndex}].Type`, recipientType });
        }
      });
      if (parsedReceiver.value.ListDefs !== undefined && !Array.isArray(parsedReceiver.value.ListDefs)) {
        issue(report, "warning", "DATA_LIST_NOTIFICATION_LISTDEFS_INVALID", "Notification Receiver.ListDefs should be an array when present.", { location: `Item.RemindRules[${index}].Receiver.ListDefs` });
      }
    }
  });
}

function parsedRulesForField(field, index, report) {
  if (field.Rules === null || field.Rules === undefined || field.Rules === "") return {};
  if (isObject(field.Rules)) return field.Rules;
  if (typeof field.Rules !== "string") {
    issue(report, "warning", "RULES_NOT_STRING_OR_OBJECT", "Field Rules should be a JSON string or object.", { fieldName: field.FieldName, index });
    return {};
  }
  const parsed = tryParseJson(field.Rules);
  if (!parsed.ok) {
    issue(report, "error", "MALFORMED_RULES_JSON", `Rules JSON failed to parse for ${field.DisplayName || field.FieldName || index}.`, {
      fieldName: field.FieldName,
      error: parsed.error,
    });
    return {};
  }
  return redact(parsed.value);
}

function validateDocumentLibraryFields(item, fieldByName, report) {
  const required = [
    { fieldName: "Title", fieldType: "Text", controlType: "input", rule: "isLibrary" },
    { fieldName: "Text1", fieldType: "Text", controlType: "input" },
    { fieldName: "Bigint2", fieldType: "Bigint", controlType: "input_number", rule: "readonly" },
    { fieldName: "Text4", fieldType: "Text", controlType: "file-upload", rule: "isLabrary" },
  ];
  for (const spec of required) {
    const field = fieldByName.get(spec.fieldName);
    if (!field) {
      issue(report, "warning", "DOCUMENT_LIBRARY_DEFAULT_FIELD_MISSING", "Document library is missing an export-proven default field.", { fieldName: spec.fieldName });
      continue;
    }
    const rules = parsedRulesForField(field, -1, report);
    const mismatches = [];
    if (safeString(field.FieldType) !== spec.fieldType) mismatches.push(`FieldType expected ${spec.fieldType}`);
    if (safeString(field.Type) !== spec.controlType) mismatches.push(`Type expected ${spec.controlType}`);
    if (spec.rule && rules[spec.rule] !== true) mismatches.push(`Rules.${spec.rule} expected true`);
    if (spec.fieldName === "Title" && (field.IsSystem !== true || field.IsIndex !== true)) mismatches.push("Title should keep IsSystem and IsIndex true");
    if (mismatches.length) {
      issue(report, "warning", "DOCUMENT_LIBRARY_DEFAULT_FIELD_SIGNATURE_UNUSUAL", "Document library default field signature differs from Projects Center export evidence.", {
        fieldName: spec.fieldName,
        displayName: field.DisplayName || null,
        mismatches,
      });
    }
  }
  const parent = fieldByName.get("Bigint1");
  if (!parent) {
    issue(report, "warning", "DOCUMENT_LIBRARY_PARENT_FIELD_MISSING", "Document library exports include Bigint1/ParentID for folder hierarchy support; keep it unless a focused export proves it is optional.", {});
  }
}

function validateFields(item, report) {
  const fields = asArray(item.Defs);
  const isDocumentLibrary = Number(item.ListModel && item.ListModel.Type) === 16;
  const fieldByName = new Map();
  const fieldNames = new Set();
  const internalNames = new Set();
  const displayNames = new Set();
  const lookupRelationships = [];
  const controlFieldSchemas = loadControlFieldSchemas(__dirname);

  fields.forEach((field, index) => {
    const location = `Item.Defs[${index}]`;
    for (const key of ["FieldID", "ListID", "FieldName", "DisplayName", "FieldType", "Type"]) {
      if (!field[key]) issue(report, "error", `FIELD_${key.toUpperCase()}_MISSING`, `${key} is required for each field.`, { location });
    }
    validateGeneratedId(report, field.FieldID, "GENERATED_FIELD_ID_NOT_LARGE_NUMERIC_STRING", "Generated FieldID should be a large numeric string ID.", { location, fieldName: field.FieldName });
    validateGeneratedId(report, field.ListID, "GENERATED_FIELD_LIST_ID_NOT_LARGE_NUMERIC_STRING", "Generated field ListID should be a large numeric string ID.", { location, fieldName: field.FieldName });
    validateGeneratedAppId(report, field.AppID, { location, fieldName: field.FieldName });
    if (!field.InternalName) issue(report, "warning", "FIELD_INTERNAL_NAME_MISSING", "InternalName is missing; confirm whether this field is system-generated.", { location, fieldName: field.FieldName });

    if (field.FieldName) {
      if (fieldNames.has(field.FieldName)) issue(report, "error", "DUPLICATE_FIELD_NAME", `Duplicate FieldName ${field.FieldName}.`, { location });
      fieldNames.add(field.FieldName);
      fieldByName.set(field.FieldName, field);
    }
    if (field.FieldID) fieldByName.set(String(field.FieldID), field);
    if (field.InternalName) fieldByName.set(String(field.InternalName), field);
    if (!isDocumentLibrary && field.FieldName === "Title" && (field.Status !== 0 || field.IsSystem !== true || field.IsIndex !== true)) {
      issue(
        report,
        generatorFinalSeverity(report),
        "DATA_LIST_TITLE_FIELD_NATIVE_METADATA_INVALID",
        "Generated data lists must preserve Yeeflow's native Title field metadata; otherwise datas/query can fail at runtime.",
        {
          location,
          fieldName: field.FieldName,
          status: field.Status,
          isSystem: field.IsSystem,
          isIndex: field.IsIndex,
          expected: { Status: 0, IsSystem: true, IsIndex: true },
        }
      );
    }
    if (field.InternalName) {
      if (internalNames.has(field.InternalName)) issue(report, "error", "DUPLICATE_INTERNAL_NAME", `Duplicate InternalName ${field.InternalName}.`, { location });
      internalNames.add(field.InternalName);
    }
    if (field.DisplayName) {
      if (displayNames.has(field.DisplayName)) issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "DUPLICATE_DISPLAY_NAME", `Duplicate DisplayName ${field.DisplayName}. Yeeflow generated data-list fields should use unique visible field names to avoid import/materialization failures.`, { location });
      displayNames.add(field.DisplayName);
    }
    validateAppCreationFieldRules(field, report, { location });

    const rules = parsedRulesForField(field, index, report);
    validateFieldAgainstSchema(field, controlFieldSchemas).forEach((schemaIssue) => {
      issue(report, "warning", `FIELD_SCHEMA_${schemaIssue.code}`, schemaIssue.message, {
        location,
        fieldName: field.FieldName || null,
        fieldType: field.Type || null,
        ...(schemaIssue.detail || {}),
      });
    });
    const normalizedType = normalizeType(field, rules);
    if (normalizedType === "unknown") {
      issue(report, "warning", "UNKNOWN_FIELD_CONTROL_TYPE", "Could not determine normalized field type.", {
        location,
        fieldName: field.FieldName,
        fieldType: field.FieldType,
        controlType: field.Type,
      });
    }

    const choices = rules.choices || rules.options || rules.items;
    if (["radio", "dropdown", "select", "checkbox"].includes(safeString(field.Type).toLowerCase())) {
      if (!Array.isArray(choices) || choices.length === 0) {
        issue(report, "error", "CHOICE_OPTIONS_MISSING", "Choice fields should define non-empty choices/options/items in Rules.", {
          location,
          fieldName: field.FieldName,
          controlType: field.Type,
        });
      }
    }
    if (safeString(field.Type).toLowerCase() === "tag") {
      if (rules.customTags !== true && !Array.isArray(rules.customTags) && !Array.isArray(choices)) {
        issue(report, "warning", "TAG_OPTIONS_MISSING", "Tag fields should include customTags=true, a customTags array, or choices before generation.", { location, fieldName: field.FieldName });
      }
      if (!rules.source || !rules.category) {
        issue(report, "warning", "TAG_SOURCE_MISSING", "Tag fields should include source and category Rules.", { location, fieldName: field.FieldName });
      }
    }
    if (["metadata", "mutiple-metadata"].includes(safeString(field.Type).toLowerCase()) && (!rules.source || !rules.categoryId)) {
      issue(report, "warning", "METADATA_SOURCE_MISSING", "Metadata fields should include source and categoryId Rules.", { location, fieldName: field.FieldName, controlType: field.Type });
    }

    if (normalizedType === "lookup") {
      const missing = [];
      if (!rules.appid && !rules.AppID) missing.push("appid");
      if (!rules.listsetid && !rules.ListSetID) missing.push("listsetid");
      if (!rules.listid && !rules.ListID) missing.push("listid");
      if (!rules.listfield && !rules.displayfield && !rules.DisplayField) missing.push("listfield");
      if (missing.length) {
        issue(report, "error", "LOOKUP_RULES_INCOMPLETE", "Lookup field is missing required lookup Rules metadata.", {
          location,
          fieldName: field.FieldName,
          missing,
        });
      }
      lookupRelationships.push({
        sourceFieldName: field.FieldName,
        sourceDisplayName: field.DisplayName,
        sourceInternalName: field.InternalName,
        targetAppId: rules.appid || rules.AppID || null,
        targetListSetId: rules.listsetid || rules.ListSetID || null,
        targetListId: rules.listid || rules.ListID || null,
        targetDisplayField: rules.listfield || rules.displayfield || rules.DisplayField || null,
        multiple: rules.multiple === true || rules.multiple === "true",
      });
    }

    if (safeString(field.Type).toLowerCase() === "datepicker") {
      if (rules.showtime === undefined && rules.date_type === undefined && rules.dateformat === undefined) {
        issue(report, "warning", "DATEPICKER_RULES_SPARSE", "Datepicker field has sparse date Rules; confirm date/time behavior before generation.", { location, fieldName: field.FieldName });
      }
    }

    if (safeString(field.Type).toLowerCase() === "switch") {
      const def = field.DefaultValue;
      if (![null, undefined, "", true, false, "true", "false", "1", "0", 1, 0].includes(def)) {
        issue(report, "warning", "SWITCH_DEFAULT_UNUSUAL", "Switch field has an unusual DefaultValue.", { location, fieldName: field.FieldName, defaultValue: def });
      }
    }

    if (safeString(field.Type).toLowerCase() === "list") {
      const hasVars = Array.isArray(rules["list-variables"]) || Array.isArray(rules.listVariables);
      const hasFields = Array.isArray(rules["list-fields"]) || Array.isArray(rules.listFields);
      if (!hasVars || !hasFields) {
        issue(report, "warning", "LIST_FIELD_METADATA_MISSING", "Nested list field should include list-variables and list-fields metadata when generated.", { location, fieldName: field.FieldName });
      }
    }
    if (safeString(field.Type).toLowerCase() === "autonumber" && (rules.minDigits === undefined || rules.startNum === undefined)) {
      issue(report, "warning", "AUTONUMBER_RULES_INCOMPLETE", "Auto number fields should include minDigits and startNum Rules.", { location, fieldName: field.FieldName });
    }
  });

  if (isDocumentLibrary) validateDocumentLibraryFields(item, fieldByName, report);

  return { fieldByName, lookupRelationships };
}

function layoutType(layout) {
  return layout.Type === undefined || layout.Type === null ? "" : String(layout.Type);
}

function parseLayoutView(layout, index, report) {
  if (isObject(layout.LayoutView)) return layout.LayoutView;
  const parsed = tryParseJson(layout.LayoutView);
  if (!parsed.ok) {
    issue(report, "error", "LAYOUT_VIEW_PARSE_FAILED", "LayoutView must parse as JSON for views.", {
      location: `Item.Layouts[${index}].LayoutView`,
      title: layout.Title || null,
      error: parsed.error || "missing LayoutView",
    });
    return null;
  }
  return redact(parsed.value);
}

function validateViews(item, fieldByName, report) {
  const layouts = asArray(item.Layouts);
  const isDocumentLibrary = Number(item.ListModel && item.ListModel.Type) === 16;
  let viewCount = 0;
  let defaultViews = 0;
  const knownTypes = new Set(["", "0", "100", "104", "999"]);
  const viewNames = new Set();
  const viewUrls = new Set();

  layouts.forEach((layout, index) => {
    validateGeneratedId(report, layout.LayoutID, "GENERATED_LAYOUT_ID_NOT_LARGE_NUMERIC_STRING", "Generated LayoutID should be a large numeric string ID.", {
      location: `Item.Layouts[${index}]`,
      title: layout.Title || null,
    });
    if (layoutType(layout) === "1") return;
    viewCount += 1;
    if (!layout.Title) issue(report, "warning", "VIEW_TITLE_MISSING", "View layout is missing a title.", { location: `Item.Layouts[${index}]` });
    else if (viewNames.has(String(layout.Title))) issue(report, "warning", "VIEW_TITLE_DUPLICATE", "View names should be unique within a list-like resource unless an export proves duplicate-name behavior.", { location: `Item.Layouts[${index}]`, title: layout.Title });
    viewNames.add(String(layout.Title || ""));
    if (isTruthy(layout.IsDefault)) defaultViews += 1;
    const type = layoutType(layout);
    const ext = tryParseJson(layout.Ext1);
    if (ext.ok && ext.value && ext.value.Url) {
      const url = String(ext.value.Url);
      if (viewUrls.has(url)) issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "VIEW_URL_DUPLICATE", "View URL/key should be unique within a resource.", { title: layout.Title || null, url });
      viewUrls.add(url);
    }
    if (report.mode === "generator" && !knownTypes.has(type)) {
      issue(report, "warning", "UNKNOWN_VIEW_TYPE", "Unknown view Type; generated lists should use confirmed view types.", { title: layout.Title || null, type });
    }
    if (isDocumentLibrary && (layout.LayoutView === null || layout.LayoutView === undefined || layout.LayoutView === "")) {
      issue(report, "warning", "DOCUMENT_LIBRARY_VIEW_LAYOUTVIEW_EMPTY", "A newly created document library export may have an empty default view LayoutView; configured libraries should use normal list view JSON.", {
        location: `Item.Layouts[${index}].LayoutView`,
        title: layout.Title || null,
      });
      return;
    }
    const view = parseLayoutView(layout, index, report);
    if (!view && isDocumentLibrary) {
      issue(report, "warning", "DOCUMENT_LIBRARY_VIEW_LAYOUTVIEW_EMPTY_OR_INVALID", "A newly created document library export may have an empty default view LayoutView; configured libraries should use normal list view JSON.", {
        location: `Item.Layouts[${index}].LayoutView`,
        title: layout.Title || null,
      });
      return;
    }
    if (!view) return;
    if (type === "100") {
      if (!isObject(view.Columns)) issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "CALENDAR_VIEW_COLUMNS_MISSING", "Calendar views should include LayoutView.Columns.", { title: layout.Title || null });
      for (const [setting, fieldName] of Object.entries(isObject(view.Columns) ? view.Columns : {})) {
        const ref = String(fieldName || "");
        if (ref && !fieldByName.has(ref) && !KNOWN_SYSTEM_FIELDS.has(ref)) {
          issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "CALENDAR_VIEW_COLUMN_FIELD_NOT_FOUND", "Calendar view Columns setting references an unknown field.", { title: layout.Title || null, setting, fieldName: ref });
        }
      }
    }

    for (const [columnIndex, column] of asArray(view.layout).entries()) {
      const fieldName = column.field || column.name || column.FieldName;
      if (fieldName && !fieldByName.has(fieldName) && !KNOWN_SYSTEM_FIELDS.has(fieldName)) {
        issue(report, "warning", "VIEW_COLUMN_FIELD_NOT_FOUND", "View column references an unknown field.", {
          viewTitle: layout.Title,
          columnIndex,
          fieldName,
        });
      }
    }

    for (const [filterIndex, filter] of asArray(view.filter || view.query).entries()) {
      const fieldName = filter.left || filter.field || filter.FieldName;
      if (fieldName && !fieldByName.has(fieldName) && !KNOWN_SYSTEM_FIELDS.has(fieldName)) {
        issue(report, "warning", "VIEW_FILTER_FIELD_NOT_FOUND", "View filter references an unknown field.", {
          viewTitle: layout.Title,
          filterIndex,
          fieldName,
        });
      }
    }

    for (const [sortIndex, sort] of asArray(view.sort).entries()) {
      const fieldName = sort.SortName || sort.field || sort.FieldName;
      if (fieldName && !fieldByName.has(fieldName) && !KNOWN_SYSTEM_FIELDS.has(fieldName)) {
        issue(report, "warning", "VIEW_SORT_FIELD_NOT_FOUND", "View sort references an unknown field.", {
          viewTitle: layout.Title,
          sortIndex,
          fieldName,
        });
      }
    }
    for (const [queryIndex, query] of asArray(view.query).entries()) {
      const fieldName = query.FieldName || query.field;
      if (fieldName && !fieldByName.has(fieldName) && !KNOWN_SYSTEM_FIELDS.has(fieldName)) {
        issue(report, "warning", "VIEW_USER_FILTER_FIELD_NOT_FOUND", "View query/user-filter field references an unknown field.", {
          viewTitle: layout.Title,
          queryIndex,
          fieldName,
        });
      }
      if (query.IsFilter !== undefined && typeof query.IsFilter !== "boolean") {
        issue(report, "warning", "VIEW_USER_FILTER_FLAG_INVALID", "View query IsFilter should be boolean when present.", { viewTitle: layout.Title, queryIndex });
      }
    }
  });

  if (viewCount && defaultViews === 0) issue(report, "warning", "DEFAULT_VIEW_MISSING", "No default view was found.");
  if (defaultViews > 1) issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "DEFAULT_VIEW_DUPLICATE", "Only one default view is export-proven per list-like resource.", { defaultViews });
  return viewCount;
}

function controlBinding(control) {
  return control.binding || control.field || control.FieldName || control.valueField || (control.attrs && (control.attrs.binding || control.attrs.field));
}

function controlType(control) {
  return safeString(control.type || control.controlType || control.Type || control.name);
}

function isAllowedUnboundControl(type) {
  return [
    "container",
    "section",
    "panel",
    "div",
    "grid",
    "flex_grid",
    "table_grid",
    "text",
    "heading",
    "html",
    "richtext",
    "workflowControlPanel",
    "workflowHistory",
    "button",
    "data-list",
  ].includes(type);
}

function validateCustomForms(item, fieldByName, report) {
  const layouts = asArray(item.Layouts);
  const customFormLayoutIds = [];
  const customFormsByTitle = new Map();
  let customFormCount = 0;
  layouts.forEach((layout, index) => {
    if (layoutType(layout) !== "1") return;
    const layoutResource = layout.LayoutInResources && layout.LayoutInResources[0];
    const resourceText = layoutResource && layoutResource.Resource;
    if (!resourceText) {
      generatorOrWarning(report, "CUSTOM_FORM_RESOURCE_MISSING", "Layout Type 1 has no form Resource.", {
        location: `Item.Layouts[${index}]`,
        title: layout.Title || null,
      });
      return;
    }
    const parsed = isObject(resourceText) ? { ok: true, value: resourceText } : tryParseJson(resourceText);
    if (!parsed.ok) {
      generatorOrWarning(report, "CUSTOM_FORM_RESOURCE_PARSE_FAILED", "Custom form Resource could not be parsed as JSON.", {
        location: `Item.Layouts[${index}].LayoutInResources[0].Resource`,
        title: layout.Title || null,
        error: parsed.error,
      });
      return;
    }
    customFormCount += 1;
    if (layout.LayoutID) customFormLayoutIds.push(String(layout.LayoutID));
    if (layout.Title) customFormsByTitle.set(String(layout.Title).toLowerCase(), layout);
    if (report.mode === "generator" && (!layoutResource.ID || !layoutResource.RefId)) {
      issue(report, "error", "CUSTOM_FORM_RESOURCE_ID_MISSING", "Generated custom form resources should include LayoutInResources ID and RefId like real exports.", {
        location: `Item.Layouts[${index}].LayoutInResources[0]`,
        title: layout.Title || null,
      });
    }
    if (report.mode === "generator" && layoutResource.ID && String(layoutResource.ID) !== String(layout.LayoutID)) {
      issue(report, "error", "CUSTOM_FORM_RESOURCE_ID_MISMATCH", "Generated custom form LayoutInResources ID should match the custom form LayoutID.", {
        location: `Item.Layouts[${index}].LayoutInResources[0].ID`,
        title: layout.Title || null,
        layoutId: layout.LayoutID,
        resourceId: layoutResource.ID,
      });
    }
    if (report.mode === "generator" && layoutResource.RefId && String(layoutResource.RefId) !== String(layout.LayoutID)) {
      issue(report, "error", "CUSTOM_FORM_RESOURCE_REFID_MISMATCH", "Generated custom form LayoutInResources RefId should match the custom form LayoutID.", {
        location: `Item.Layouts[${index}].LayoutInResources[0].RefId`,
        title: layout.Title || null,
        layoutId: layout.LayoutID,
        refId: layoutResource.RefId,
      });
    }
    if (report.mode === "generator" && layout.LayoutView !== null) {
      issue(report, "warning", "CUSTOM_FORM_LAYOUT_VIEW_NOT_NULL", "Custom form layout with embedded Resource usually has LayoutView set to null in real exports.", {
        location: `Item.Layouts[${index}].LayoutView`,
        title: layout.Title || null,
      });
    }
    const ext2 = tryParseJson(layout.Ext2);
    if (report.mode === "generator" && !(ext2.ok && ext2.value && ext2.value.src === true)) {
      issue(report, "warning", "CUSTOM_FORM_SOURCE_FLAG_MISSING", "Custom form layout with embedded Resource should include Ext2 {\"src\":true} like real exports.", {
        location: `Item.Layouts[${index}].Ext2`,
        title: layout.Title || null,
      });
    }
    if (report.mode === "generator" && layout.IsItemPerm !== false) {
      issue(report, "warning", "CUSTOM_FORM_ITEM_PERM_UNUSUAL", "Real embedded custom form layouts use IsItemPerm false; confirm generated form designer behavior.", {
        location: `Item.Layouts[${index}].IsItemPerm`,
        title: layout.Title || null,
        value: layout.IsItemPerm,
      });
    }
    const form = redact(parsed.value);
    validateCustomFormActions(form, fieldByName, report, {
      location: `Item.Layouts[${index}].LayoutInResources[0].Resource`,
      title: layout.Title || null,
    });
    validateUiUxStandardListForm(form, report, {
      location: `Item.Layouts[${index}].LayoutInResources[0].Resource`,
      title: layout.Title || null,
    });
    const children = asArray(form.children);
    if (children.length === 0) {
      generatorOrWarning(report, "CUSTOM_FORM_CHILDREN_EMPTY", "Custom form Resource has no children, so the designer/form will be empty.", {
        location: `Item.Layouts[${index}].LayoutInResources[0].Resource.children`,
        title: layout.Title || null,
      });
    }
    children.forEach((child, childIndex) => {
      walkControls(child, (control, pointer) => {
        const type = controlType(control);
        const binding = controlBinding(control);
        const location = `Item.Layouts[${index}].form.children[${childIndex}]${pointer.slice(1)}`;
        if (binding && !(control.attrs && control.attrs.list_field === true) && !fieldByName.has(binding)) {
          issue(report, "error", "FORM_CONTROL_BINDING_NOT_FOUND", "Form control binds to an unknown field.", {
            location,
            type,
            binding,
            label: control.label || control.title || null,
          });
        } else if (!binding && !isAllowedUnboundControl(type)) {
          issue(report, "warning", "FORM_CONTROL_UNBOUND", "Unbound control is not one of the known display/layout control types.", {
            location,
            type,
            label: control.label || control.title || null,
          });
        }
        if (type === "list") validateCustomFormSubListControl(control, fieldByName, report, { location, title: layout.Title || null });

        if (type === "lookup") {
          const boundField = binding ? fieldByName.get(binding) : null;
          const attrs = control.attrs || {};
          if (boundField && safeString(boundField.Type).toLowerCase() !== "lookup") {
            issue(report, "warning", "LOOKUP_CONTROL_BOUND_TO_NON_LOOKUP_FIELD", "Lookup control is bound to a field that is not typed as lookup.", { location, binding });
          }
          if (!attrs.listid && !attrs.listsetid && !attrs.listfield) {
            issue(report, "warning", "LOOKUP_CONTROL_TARGET_MISSING", "Lookup control has no explicit target list metadata in attrs.", { location, binding });
          }
        }

        if (type.toLowerCase().includes("code")) {
          issue(report, "warning", "CUSTOM_CODE_CONTROL_FOUND", "Custom code control found; review before generated package use.", {
            location,
            type,
            label: control.label || control.title || null,
          });
        }
      });
    });
  });
  if (customFormLayoutIds.length) {
    const isDocumentLibrary = Number(item.ListModel && item.ListModel.Type) === 16;
    const parsedLayoutView = tryParseJson(item.ListModel && item.ListModel.LayoutView);
    if (parsedLayoutView.ok) {
      const assigned = ["add", "edit", "view"].filter((key) => customFormLayoutIds.includes(String(parsedLayoutView.value[key])));
      if (isDocumentLibrary && assigned.length > 0 && assigned.length < 3) {
        issue(report, "warning", "DOCUMENT_LIBRARY_LAYOUTVIEW_PARTIAL_ASSIGNMENT", "Document Library Sample uses null LayoutView for the minimal library, while configured libraries assign add/edit/view together. A partial New-only assignment is runtime-sensitive.", {
          customFormLayoutIds,
          assigned,
        });
      }
      if (!assigned.length && !isDocumentLibrary) {
        issue(report, "warning", "CUSTOM_FORM_NOT_ASSIGNED_TO_DISPLAY_SETTINGS", "Custom form exists, but ListModel.LayoutView does not assign it to New/Edit/View display settings.", {
          customFormLayoutIds,
          layoutView: parsedLayoutView.value,
        });
      }
      const editLayout = customFormsByTitle.get("edit item");
      const viewLayout = customFormsByTitle.get("view item");
      if (report.mode === "generator") {
        if (!editLayout) {
          issue(report, "warning", "UI_STANDARD_EDIT_ITEM_FORM_MISSING", "UI/UX standard generated data lists should include a custom form titled \"Edit Item\".", {});
        }
        if (!viewLayout) {
          issue(report, "warning", "UI_STANDARD_VIEW_ITEM_FORM_MISSING", "UI/UX standard generated data lists should include a custom form titled \"View Item\".", {});
        }
        if (editLayout && String(parsedLayoutView.value.add) !== String(editLayout.LayoutID)) {
          issue(report, "warning", "UI_STANDARD_NEW_NOT_USING_EDIT_ITEM_FORM", "UI/UX standard New item display setting should use the Edit Item custom form.", { expectedLayoutId: editLayout.LayoutID, actualLayoutId: parsedLayoutView.value.add });
        }
        if (editLayout && String(parsedLayoutView.value.edit) !== String(editLayout.LayoutID)) {
          issue(report, "warning", "UI_STANDARD_EDIT_NOT_USING_EDIT_ITEM_FORM", "UI/UX standard Edit item display setting should use the Edit Item custom form.", { expectedLayoutId: editLayout.LayoutID, actualLayoutId: parsedLayoutView.value.edit });
        }
        if (viewLayout && String(parsedLayoutView.value.view) !== String(viewLayout.LayoutID)) {
          issue(report, "warning", "UI_STANDARD_VIEW_NOT_USING_VIEW_ITEM_FORM", "UI/UX standard View item display setting should use the View Item custom form.", { expectedLayoutId: viewLayout.LayoutID, actualLayoutId: parsedLayoutView.value.view });
        }
      }
    } else if (report.mode === "generator" && !isDocumentLibrary) {
      issue(report, "warning", "CUSTOM_FORM_DISPLAY_SETTINGS_UNPARSEABLE", "Custom form exists, but ListModel.LayoutView could not be parsed to confirm display setting assignment.", {
        customFormLayoutIds,
      });
    }
  }
  return customFormCount;
}

function validatePublicForms(item, fieldByName, report) {
  const publicForms = asArray(item.PublicForms);
  publicForms.forEach((publicForm, publicFormIndex) => {
    const context = {
      location: `Item.PublicForms[${publicFormIndex}]`,
      publicForm: publicForm && publicForm.Name || null,
    };
    if (!publicForm || !publicForm.Resource) {
      issue(report, generatorFinalSeverity(report), "PUBLIC_FORM_RESOURCE_MISSING", "PublicForms[] entry must include Resource.", context);
      return;
    }
    const parsed = tryParseJson(publicForm.Resource);
    if (!(parsed.ok && parsed.value)) {
      issue(report, "error", "PUBLIC_FORM_RESOURCE_JSON_INVALID", "PublicForms[] Resource must be valid JSON.", context);
      return;
    }
    const resource = parsed.value;
    if (resource.pagetype !== 3) issue(report, "warning", "PUBLIC_FORM_PAGETYPE_UNKNOWN", "Data List Public Form Resource.pagetype is export-proven as 3.", { ...context, pagetype: resource.pagetype });
    if (!Array.isArray(resource.children)) {
      issue(report, generatorFinalSeverity(report), "PUBLIC_FORM_CHILDREN_NOT_ARRAY", "Data List Public Form Resource.children must be an array.", { ...context, location: `${context.location}.Resource.children` });
      return;
    }
    if (resource.tempVars !== undefined && !Array.isArray(resource.tempVars)) {
      issue(report, "warning", "PUBLIC_FORM_TEMPVARS_NOT_ARRAY", "Data List Public Form Resource.tempVars should be an array when present.", { ...context, location: `${context.location}.Resource.tempVars` });
    }
    const seenControlIds = new Set();
    let submitControls = 0;
    resource.children.forEach((child, childIndex) => {
      walkControls(child, (control, pointer) => {
        const type = controlType(control);
        const location = `${context.location}.Resource.children[${childIndex}]${pointer.slice(1)}`;
        if (!type) return;
        if (type === "submit-button") submitControls += 1;
        if (!PUBLIC_FORM_KNOWN_CONTROL_TYPES.has(type)) {
          issue(report, "warning", "PUBLIC_FORM_CONTROL_TYPE_UNKNOWN", "Public form uses a control type that is not yet export-proven for public forms.", { ...context, location, type });
        }
        const controlId = safeString(control.id);
        if (controlId) {
          if (seenControlIds.has(controlId)) issue(report, "error", "PUBLIC_FORM_CONTROL_ID_DUPLICATE", "Public form control IDs must be unique within a form.", { ...context, location, controlId });
          seenControlIds.add(controlId);
        }
        const binding = controlBinding(control);
        const field = control.fieldID ? fieldByName.get(String(control.fieldID)) : binding ? fieldByName.get(binding) : null;
        const isNestedListField = control.attrs && control.attrs.list_field === true;
        if ((binding || control.fieldID) && !isNestedListField && type !== "total") {
          if (!field) {
            issue(report, generatorFinalSeverity(report), "PUBLIC_FORM_FIELD_BINDING_NOT_FOUND", "Public form list-bound control does not resolve to a field in the same data list.", { ...context, location, binding: binding || null, type });
            return;
          }
          const fieldName = safeString(field.FieldName);
          const fieldType = safeString(field.Type);
          if (PUBLIC_FORM_DISALLOWED_SYSTEM_FIELDS.has(fieldName)) {
            issue(report, generatorFinalSeverity(report), "PUBLIC_FORM_DEFAULT_FIELD_NOT_ALLOWED", "Default/system list fields should not be generated into Public Forms. Title is the export-proven primary-field exception.", { ...context, location, fieldName, fieldType });
          }
          if (PUBLIC_FORM_DISALLOWED_FIELD_TYPES.has(fieldType)) {
            issue(report, generatorFinalSeverity(report), "PUBLIC_FORM_FIELD_TYPE_NOT_ALLOWED", "This field type is UI-reference-backed as unavailable for Data List Public Forms.", { ...context, location, fieldName, fieldType });
          } else if (!PUBLIC_FORM_ALLOWED_FIELD_TYPES.has(fieldType)) {
            issue(report, "warning", "PUBLIC_FORM_FIELD_TYPE_UNPROVEN", "Public form uses a field type that is not in the export-proven allowed set from Data Lists (4).yap.", { ...context, location, fieldName, fieldType });
          }
        }
      });
    });
    if (!submitControls) issue(report, "warning", "PUBLIC_FORM_SUBMIT_CONTROL_MISSING", "Public forms intended for anonymous collection should include an export-proven submit control.", context);
  });
}

function defaultCustomFormOpenModeForUsage(usage) {
  return usage === "view" ? "Slide in" : "Pop-up window";
}

function validateCustomFormDisplaySettings(item, report) {
  const listModel = item && item.ListModel;
  if (!isObject(listModel)) return;
  const parsedLayoutView = tryParseJson(listModel.LayoutView);
  if (!parsedLayoutView.ok) {
    if (asArray(item.Layouts).some((layout) => Number(layout.Type) === 1)) {
      issue(report, "warning", "CUSTOM_FORM_DISPLAY_SETTINGS_UNPARSEABLE", "Custom form display settings live in ListModel.LayoutView, but the value could not be parsed.", {
        location: "Item.ListModel.LayoutView",
        error: parsedLayoutView.error || null,
      });
    }
    return;
  }
  const layoutView = parsedLayoutView.value;
  if (!isObject(layoutView)) {
    issue(report, "warning", "CUSTOM_FORM_DISPLAY_SETTINGS_INVALID", "Custom form display settings should parse to an object.", {
      location: "Item.ListModel.LayoutView",
    });
    return;
  }

  const customFormLayoutIds = new Set(asArray(item.Layouts)
    .filter((layout) => Number(layout.Type) === 1)
    .map((layout) => safeString(layout.LayoutID))
    .filter(Boolean));
  const opentype = isObject(layoutView.opentype) ? layoutView.opentype : {};
  const modalsize = isObject(layoutView.modalsize) ? layoutView.modalsize : {};
  const finalGenerated = report.mode === "generator" && report.stage === "final";

  CUSTOM_FORM_DISPLAY_USAGES.forEach((usage) => {
    const formRef = safeString(layoutView[usage] === undefined ? "default" : layoutView[usage]);
    const usesDefault = formRef === "" || formRef === "default";
    if (usage === "add" && usesDefault && finalGenerated) {
      issue(report, "error", "LAYOUTVIEW_ADD_LAYOUT_MISSING", "Generated data lists must assign ListModel.LayoutView.add to a real custom form layout. A display setting with only opentype/modalsize can make the default New item modal load forever.", {
        location: `Item.ListModel.LayoutView.${usage}`,
        usage,
        formRef,
      });
    }
    if (!usesDefault && !customFormLayoutIds.has(formRef)) {
      issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_DISPLAY_FORM_REF_NOT_FOUND", "New/Edit/View display setting references a custom list form layout that does not exist.", {
        location: `Item.ListModel.LayoutView.${usage}`,
        usage,
        formRef,
      });
    }

    const rawOpenMode = safeString(opentype[usage]);
    const openMode = rawOpenMode ? CUSTOM_FORM_OPEN_MODE_LABELS[rawOpenMode] : defaultCustomFormOpenModeForUsage(usage);
    if (!openMode) {
      issue(report, "warning", "CUSTOM_FORM_DISPLAY_OPEN_MODE_UNKNOWN", "Custom list form display setting uses an unknown open mode.", {
        location: `Item.ListModel.LayoutView.opentype.${usage}`,
        usage,
        openMode: rawOpenMode,
      });
    }

    const rawSize = modalsize[usage];
    const hasSize = rawSize !== undefined && rawSize !== null && rawSize !== "";
    if (hasSize && !CUSTOM_FORM_SIZE_LABELS.has(Number(rawSize))) {
      issue(report, "warning", "CUSTOM_FORM_DISPLAY_SIZE_UNKNOWN", "Custom list form display setting uses an unknown size code.", {
        location: `Item.ListModel.LayoutView.modalsize.${usage}`,
        usage,
        size: rawSize,
      });
    }
    if (openMode === "Full page" && hasSize) {
      issue(report, "warning", "CUSTOM_FORM_DISPLAY_FULL_PAGE_SIZE_SET", "Full page display settings should not rely on pop-up/slide size behavior unless a future export proves it.", {
        location: `Item.ListModel.LayoutView.modalsize.${usage}`,
        usage,
        size: rawSize,
      });
    }
  });
  if (layoutView.sort !== undefined) {
    if (!Array.isArray(layoutView.sort)) {
      issue(report, finalGenerated ? "error" : "warning", "LAYOUTVIEW_SORT_SHAPE_UNSUPPORTED", "Data-list ListModel.LayoutView.sort must be omitted or use an export-supported array shape.", {
        location: "Item.ListModel.LayoutView.sort",
        shape: typeof layoutView.sort,
      });
    } else {
      layoutView.sort.forEach((entry, index) => {
        if (isObject(entry)) {
          issue(report, finalGenerated ? "error" : "warning", "LAYOUTVIEW_SORT_OBJECT_UNSUPPORTED", "Data-list ListModel.LayoutView.sort object entries such as SortName/SortByDesc are not runtime-supported for display settings; omit sort or use an export-shaped field-id array.", {
            location: `Item.ListModel.LayoutView.sort[${index}]`,
          });
        } else if (Array.isArray(entry) && !entry.every((fieldId) => typeof fieldId === "string" || typeof fieldId === "number")) {
          issue(report, finalGenerated ? "error" : "warning", "LAYOUTVIEW_SORT_FIELD_ARRAY_INVALID", "Data-list ListModel.LayoutView.sort field-id arrays must contain field IDs only.", {
            location: `Item.ListModel.LayoutView.sort[${index}]`,
          });
        }
      });
    }
  }
}

function customFormTempVarAliases(tempVar) {
  const id = safeString(tempVar && tempVar.id);
  if (!id) return [];
  return [id, id.startsWith("__temp_") ? id.replace(/^__temp_/, "") : `__temp_${id}`];
}

function collectCustomFormActionRefs(value) {
  const refs = { fields: [], tempVars: [] };
  walk(value, (node) => {
    if (!isObject(node)) return;
    if (node.exprType === "list_field" && node.prop) refs.fields.push(String(node.prop));
    if (node.exprType === "variable" && (node.id || node.name)) refs.tempVars.push(String(node.id || node.name));
  });
  return refs;
}

function validateCustomFormActions(form, fieldByName, report, context) {
  if (form.tempVars !== undefined && !Array.isArray(form.tempVars)) issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_TEMPVARS_NOT_ARRAY", "Custom form tempVars should be an array.", context);
  if (form.actions !== undefined && !Array.isArray(form.actions)) issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_ACTIONS_NOT_ARRAY", "Custom form actions should be an array when present.", context);
  const tempVars = new Set();
  const seenTempVars = new Set();
  asArray(form.tempVars).forEach((tempVar, index) => {
    if (!tempVar || !tempVar.id) {
      issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_TEMPVAR_ID_MISSING", "Custom form tempVars entries should include id.", { ...context, index });
      return;
    }
    const id = safeString(tempVar.id);
    if (seenTempVars.has(id)) issue(report, "error", "CUSTOM_FORM_TEMPVAR_ID_DUPLICATE", "Custom form tempVars ids should be unique within the form.", { ...context, index, id });
    seenTempVars.add(id);
    customFormTempVarAliases(tempVar).forEach((alias) => tempVars.add(alias));
  });

  const actionIds = new Set();
  asArray(form.actions).forEach((action, actionIndex) => {
    if (!action || !action.id) issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_ACTION_ID_MISSING", "Custom form actions should include id.", { ...context, actionIndex });
    else if (actionIds.has(String(action.id))) issue(report, "error", "CUSTOM_FORM_ACTION_ID_DUPLICATE", "Custom form action ids should be unique within the form.", { ...context, actionIndex });
    else actionIds.add(String(action.id));
    if (!Array.isArray(action && action.steps)) issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_ACTION_STEPS_NOT_ARRAY", "Custom form action steps should be an array.", { ...context, actionIndex, actionName: action && action.name || null });
    asArray(action && action.steps).forEach((step, stepIndex) => {
      if (!step || !step.type) issue(report, "warning", "CUSTOM_FORM_ACTION_STEP_TYPE_MISSING", "Custom form action step should include type.", { ...context, actionIndex, stepIndex });
      if (step && step.type && !["setvar", "submit", "submit_form", "save", "close", "open", "message"].includes(String(step.type))) {
        issue(report, "warning", "CUSTOM_FORM_ACTION_STEP_UNKNOWN", "Custom form action step type is not yet export-learned.", { ...context, actionIndex, stepIndex, stepType: step.type });
      }
      const refs = collectCustomFormActionRefs(step);
      refs.fields.forEach((fieldRef) => {
        if (!fieldByName.has(fieldRef) && !KNOWN_SYSTEM_FIELDS.has(fieldRef)) issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_ACTION_FIELD_REF_NOT_FOUND", "Custom form action references an unknown list field.", { ...context, actionIndex, stepIndex, fieldRef });
      });
      refs.tempVars.forEach((tempVar) => {
        if (!tempVars.has(tempVar) && !tempVars.has(tempVar.replace(/^__temp_/, ""))) issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_ACTION_TEMPVAR_REF_NOT_FOUND", "Custom form action references an unknown temp variable.", { ...context, actionIndex, stepIndex, tempVar });
      });
    });
  });

  for (const [hook, actionId] of Object.entries(form.formAction || {})) {
    if (actionId && !actionIds.has(String(actionId))) issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_FORMACTION_REF_NOT_FOUND", "Custom form formAction hook references an unknown action.", { ...context, hook });
  }
  asArray(form.children).forEach((child, childIndex) => {
    walkControls(child, (control, pointer) => {
      const actionId = control && control.attrs && control.attrs.control_action;
      if (actionId && !actionIds.has(String(actionId))) issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_BUTTON_ACTION_REF_NOT_FOUND", "Custom form action button references an unknown action.", { ...context, childIndex, pointer });
    });
  });
}

function validateCustomFormSubListControl(control, fieldByName, report, context) {
  const variables = asArray(control.attrs && control.attrs["list-variables"]);
  const listFields = asArray(control.attrs && control.attrs["list-fields"]);
  if (!variables.length) issue(report, "warning", "CUSTOM_FORM_SUBLIST_VARIABLES_MISSING", "Sub-list custom form control should include attrs.list-variables.", context);
  if (!listFields.length) issue(report, "warning", "CUSTOM_FORM_SUBLIST_FIELDS_MISSING", "Sub-list custom form control should include attrs.list-fields.", context);
  const variableNames = new Set(variables.map((item) => safeString(item && item.name)).filter(Boolean));
  listFields.forEach((entry, index) => {
    const name = safeString(entry && entry.name);
    if (name && !variableNames.has(name)) issue(report, "warning", "CUSTOM_FORM_SUBLIST_FIELD_VARIABLE_NOT_FOUND", "Sub-list attrs.list-fields entry should resolve to attrs.list-variables by name.", { ...context, index, name });
    const nestedControl = entry && entry.control;
    if (!nestedControl || !nestedControl.type || !nestedControl.binding) issue(report, "warning", "CUSTOM_FORM_SUBLIST_NESTED_CONTROL_INCOMPLETE", "Sub-list nested field controls should include type and binding.", { ...context, index, name });
    if (nestedControl && nestedControl.attrs && nestedControl.attrs.list_field_binding !== control.binding) issue(report, "warning", "CUSTOM_FORM_SUBLIST_PARENT_BINDING_MISMATCH", "Sub-list nested field control should point back to the parent sub-list field binding.", { ...context, index, name });
  });
  const boundField = fieldByName.get(safeString(control.binding));
  const rules = tryParseJson(boundField && boundField.Rules);
  const ruleVariables = asArray(rules.ok ? rules.value && rules.value["list-variables"] : []);
  if (boundField && ruleVariables.length && variables.length !== ruleVariables.length) {
    issue(report, "warning", "CUSTOM_FORM_SUBLIST_VARIABLE_COUNT_DIFFERS_FROM_FIELD_RULES", "Sub-list form control variable count differs from the parent field Rules.list-variables count.", { ...context, controlVariables: variables.length, fieldRuleVariables: ruleVariables.length });
  }
}

function validateUiUxStandardListForm(form, report, details) {
  const container = form && form.attrs && form.attrs.container;
  if (container && container.cw !== "2") {
    issue(report, "warning", "UI_STANDARD_CONTENT_WIDTH_NOT_FULL", "UI/UX standard custom list forms should use full-width content area: attrs.container.cw = \"2\".", details);
  }
  if (!zeroPadding(container && container.padding)) {
    issue(report, "warning", "UI_STANDARD_FORM_PADDING_NOT_ZERO", "UI/UX standard custom list forms should use zero page padding with --sp--s0 on all sides.", details);
  }
  const main = findControlByLabel(form, "Main");
  const content = findControlByLabel(form, "Content");
  if (!main) {
    issue(report, "warning", "UI_STANDARD_MAIN_CONTAINER_MISSING", "UI/UX standard custom list forms should have a container with nv_label \"Main\".", details);
    return;
  }
  if (!content) {
    issue(report, "warning", "UI_STANDARD_CONTENT_CONTAINER_MISSING", "UI/UX standard custom list forms should have a container with nv_label \"Content\".", details);
    return;
  }
  if (!controlContains(main, content)) {
    issue(report, "warning", "UI_STANDARD_CONTENT_NOT_INSIDE_MAIN", "UI/UX standard custom list form Content container should be inside Main.", details);
  }
}

function stencilId(node) {
  return node && node.stencil && (node.stencil.id || node.stencil);
}

function parseWorkflowDef(form, index, report) {
  const defText = form.DefResource || form.Def || form.def;
  if (!defText) {
    issue(report, "warning", "WORKFLOW_DEF_MISSING", "Workflow has no DefResource.", { location: `Data.Forms[${index}]`, name: form.FlowName || form.Name || null });
    return null;
  }
  if (isObject(defText)) return defText;
  const parsed = tryParseJson(defText);
  if (!parsed.ok) {
    issue(report, "error", "WORKFLOW_DEF_PARSE_FAILED", "Workflow DefResource could not be parsed as JSON.", {
      location: `Data.Forms[${index}].DefResource`,
      name: form.FlowName || form.Name || null,
      error: parsed.error,
    });
    return null;
  }
  return redact(parsed.value);
}

function collectWorkflowFieldRefs(value) {
  const refs = [];
  walk(value, (node) => {
    if (!isObject(node)) return;
    if (node.exprType === "list_field" || node.type === "list_field") refs.push(node.prop || node.id || node.value);
    if (typeof node.prop === "string" && /^Text\d+|Title|Datetime\d+|Bit\d+/.test(node.prop)) refs.push(node.prop);
  });
  return refs.filter(Boolean);
}

function validateWorkflows(data, item, fieldByName, knownListIds, report) {
  const forms = asArray(data.Forms);
  const currentListId = item.ListModel && item.ListModel.ListID;
  forms.forEach((form, index) => {
    const def = parseWorkflowDef(form, index, report);
    if (!def) return;
    const key = form.FlowKey || form.Key || def.defkey;
    if (!key && !def.defkey) issue(report, "error", "WORKFLOW_KEY_MISSING", "Workflow key/defkey is required.", { location: `Data.Forms[${index}]` });
    validateProcessKey(key, report, { location: `Data.Forms[${index}].Key` });
    validateProcessKey(def.defkey, report, { location: `Data.Forms[${index}].DefResource.defkey` });
    if (def.variables === undefined) issue(report, "warning", "WORKFLOW_VARIABLES_MISSING", "Workflow variables are missing; confirm this is valid for this workflow.", { key });
    const workflowActionReport = validateWorkflowActionShapes(asArray(def.childshapes), {
      mode: report.mode,
      stage: report.stage,
      pointerForIndex: (shapeIndex) => `Data.Forms[${index}].DefResource.childshapes[${shapeIndex}]`,
    });
    for (const actionIssue of workflowActionReport.issues) {
      issue(report, actionIssue.level === "error" ? "error" : "warning", actionIssue.code, actionIssue.message, {
        workflowKey: key,
        ...actionIssue,
      });
    }
    validateDataListWorkflowTaskForms(def, fieldByName, key, report);
    for (const node of asArray(def.childshapes)) {
      const type = stencilId(node);
      const props = node.properties || {};
      const nodeName = props.name || type || node.resourceid;
      if (type === "ContentList") {
        const targetListId = props.listid || currentListId;
        if (!targetListId) {
          issue(report, "error", "CONTENTLIST_LISTID_MISSING", "ContentList node must declare or infer target listid.", { key, nodeName });
        } else if (!knownListIds.has(String(targetListId))) {
          addDependency(report, {
            type: "workflowTargetList",
            listId: String(targetListId),
            workflowKey: key,
            nodeName,
            requiredForGeneratorMode: true,
          });
          if (report.mode === "generator") {
            issue(report, "error", "WORKFLOW_TARGET_LIST_UNRESOLVED", "ContentList target list is not present in this decoded package and is not declared in a dependency file.", { key, nodeName, targetListId });
          } else {
            issue(report, "warning", "WORKFLOW_TARGET_LIST_EXTERNAL", "ContentList target list is external to this standalone package.", { key, nodeName, targetListId });
          }
        }
        for (const ref of collectWorkflowFieldRefs(props)) {
          if (!fieldByName.has(ref) && !KNOWN_SYSTEM_FIELDS.has(ref)) {
            issue(report, "warning", "WORKFLOW_FIELD_REF_NOT_FOUND", "Workflow references a field that is not defined in Item.Defs.", { key, nodeName, fieldRef: ref });
          }
        }
      }
      if (type === "QueryData") {
        const targetListId = props.listid;
        if (!targetListId) issue(report, "error", "QUERYDATA_LISTID_MISSING", "QueryData node must declare target listid.", { key, nodeName });
        else if (!knownListIds.has(String(targetListId))) {
          addDependency(report, { type: "queryDataTargetList", listId: String(targetListId), workflowKey: key, nodeName, requiredForGeneratorMode: true });
          if (report.mode === "generator") issue(report, "error", "QUERYDATA_TARGET_LIST_UNRESOLVED", "QueryData target list is unresolved.", { key, nodeName, targetListId });
          else issue(report, "warning", "QUERYDATA_TARGET_LIST_EXTERNAL", "QueryData target list is external to this standalone package.", { key, nodeName, targetListId });
        }
      }
      if (type === "AI") issue(report, "warning", "AI_NODE_FOUND", "AI workflow node found; validate agent/runtime dependencies before generation/import.", { key, nodeName });
      if (/http|api|webhook/i.test(safeString(type)) || /http|api|webhook/i.test(safeString(nodeName))) {
        issue(report, "warning", "HTTP_OR_API_NODE_FOUND", "HTTP/API-like workflow node found; credentials/endpoints must be reviewed.", { key, nodeName, type });
      }
    }
  });
}

function validateDataListWorkflowTaskForms(def, fieldByName, key, report) {
  for (const [pageIndex, page] of asArray(def.pageurls).entries()) {
    const formdef = page && page.formdef;
    if (!isObject(formdef)) continue;
    walkControls(formdef, (control, pointer) => {
      if (!control || control.isListControl !== true) return;
      const identifier = safeString(control.identifier || control.FieldName || control.fieldName);
      const internalName = safeString(control.InternalName || control.internalName);
      const location = `Data.Forms[${key}].DefResource.pageurls[${pageIndex}].formdef${pointer.replace("$", "")}`;
      if (!identifier) {
        issue(report, "warning", "DATALIST_WORKFLOW_TASK_FORM_FIELD_IDENTIFIER_MISSING", "Data-list workflow task form list-field control is missing identifier.", {
          key,
          location,
        });
      } else if (!fieldByName.has(identifier) && !KNOWN_SYSTEM_FIELDS.has(identifier)) {
        issue(report, report.mode === "generator" ? "error" : "warning", "DATALIST_WORKFLOW_TASK_FORM_FIELD_UNRESOLVED", "Data-list workflow task form list-field control references an unknown field.", {
          key,
          location,
          identifier,
          internalName,
        });
      }
      if (!safeString(control.binding).startsWith("____customListFields_")) {
        issue(report, "warning", "DATALIST_WORKFLOW_TASK_FORM_BINDING_UNSTUDIED", "Data-list workflow task form list-field binding does not use the studied custom-list-field binding prefix.", {
          key,
          location,
          identifier,
          binding: control.binding || null,
        });
      }
      const readonly = control.readonly === true || (control.attrs && control.attrs.readonly === true);
      if (KNOWN_SYSTEM_FIELDS.has(identifier) && control.readonly === false) {
        issue(report, "warning", "DATALIST_WORKFLOW_TASK_FORM_SYSTEM_FIELD_EDITABLE", "Default/native list fields appear read-only in the studied data-list workflow task form; editable native fields need focused proof.", {
          key,
          location,
          identifier,
        });
      }
      if (!KNOWN_SYSTEM_FIELDS.has(identifier) && !readonly) {
        issue(report, "warning", "DATALIST_WORKFLOW_TASK_FORM_CUSTOM_FIELD_EDITABLE", "Custom list fields can be editable on task forms; set readonly=true when the task should not update the source list field.", {
          key,
          location,
          identifier,
        });
      }
    });
  }
}

function dependencySampleRecordIdsForField(field, dependencyMap) {
  if (!dependencyMap) return null;
  const rules = parsedRulesForField(field, -1, { errors: [], warnings: [], mode: "compatibility", stage: "final" });
  const dependencies = Array.isArray(dependencyMap.dependencies) ? dependencyMap.dependencies : [];
  const dependency = dependencies.find((candidate) => {
    if (candidate.status && candidate.status !== "resolved") return false;
    const resolved = candidate.resolvedValue || {};
    const targetListId = resolved.listid || candidate.targetListId || candidate.draftTargetListId;
    return String(targetListId || "") === String(rules.listid || rules.ListID || "")
      && (!candidate.sourceFieldName || candidate.sourceFieldName === field.FieldName)
      && (!candidate.sourceField || candidate.sourceField === field.FieldName || candidate.sourceField === field.DisplayName || candidate.sourceField === field.InternalName);
  });
  const source = dependencyMap.resolvedDepartments || (dependency && dependency.resolvedTarget) || null;
  const sampleRecords = source && Array.isArray(source.sampleRecords) ? source.sampleRecords : [];
  const ids = new Set(sampleRecords.map((record) => String(record.ListDataID || record.id || "")).filter(Boolean));
  return ids.size ? ids : null;
}

function collectResourceReplaceIds(resource) {
  const ids = new Set();
  if (!resource || !Array.isArray(resource.ReplaceIds)) return ids;
  for (const id of resource.ReplaceIds) {
    if (id !== undefined && id !== null && id !== "") ids.add(String(id));
  }
  return ids;
}

function lookupSampleValues(value, multiple) {
  if (multiple) {
    const parsed = tryParseJson(value);
    if (parsed.ok && Array.isArray(parsed.value)) return parsed.value.map(String).filter(Boolean);
    return [];
  }
  if (typeof value === "string" && value) return [value];
  return [];
}

function validateLookupSampleReference(value, recordId, fieldName, field, dependencyMap, report) {
  const ids = dependencySampleRecordIdsForField(field, dependencyMap);
  if (!ids) return;
  const rules = parsedRulesForField(field, -1, { errors: [], warnings: [], mode: "compatibility", stage: "final" });
  const multiple = rules.multiple === true || rules.multiple === "true";
  const values = lookupSampleValues(value, multiple);
  for (const lookupId of values) {
    if (!ids.has(lookupId)) {
      issue(report, report.mode === "generator" ? "error" : "warning", "SAMPLE_LOOKUP_TARGET_RECORD_NOT_FOUND", "Lookup sample value does not reference a known target sample record ID from the dependency map.", {
        recordId,
        fieldName,
        value: lookupId,
      });
    }
  }
}

function validateExternalLookupSample(value, recordId, fieldName, field, dependencyMap, replaceIds, report) {
  const rules = parsedRulesForField(field, -1, { errors: [], warnings: [], mode: "compatibility", stage: "final" });
  const multiple = rules.multiple === true || rules.multiple === "true";
  const values = lookupSampleValues(value, multiple);
  if (!values.length) return;
  const allowedIds = dependencySampleRecordIdsForField(field, dependencyMap);
  if (!allowedIds) {
    issue(report, report.mode === "generator" ? "error" : "warning", "SAMPLE_LOOKUP_EXTERNAL_DEPENDENCY_UNRESOLVED_FOR_SAMPLE", "External lookup sample values require dependency-map sample/reference record IDs so Yeeflow does not import dangling lookup values.", {
      recordId,
      fieldName,
      value,
    });
    return;
  }
  for (const lookupId of values) {
    if (!allowedIds.has(lookupId)) {
      issue(report, report.mode === "generator" ? "error" : "warning", "SAMPLE_LOOKUP_TARGET_RECORD_NOT_FOUND", "Lookup sample value does not reference a known target sample record ID from the dependency map.", {
        recordId,
        fieldName,
        value: lookupId,
      });
    }
    if (replaceIds.has(lookupId)) {
      issue(report, report.mode === "generator" ? "error" : "warning", "SAMPLE_LOOKUP_EXTERNAL_ID_IN_REPLACEIDS", "External lookup sample value is present in Resource.ReplaceIds and may be remapped during standalone import.", {
        recordId,
        fieldName,
        value: lookupId,
      });
    }
  }
}

function validateSampleData(item, fieldByName, report, dependencyMap, externalLookupFields = new Set(), resource = null) {
  const replaceIds = collectResourceReplaceIds(resource);
  const records = item.ListDatas || {};
  const isDocumentLibrary = Number(item.ListModel && item.ListModel.Type) === 16 || Number(resource && resource.MainListType) === 16;
  const seenRecordIds = new Set();
  const documentFolderIds = new Set(Object.entries(records)
    .filter(([, record]) => isObject(record) && String(record.Text1 || "").toLowerCase() === "folder")
    .flatMap(([recordId, record]) => [String(recordId || ""), String(record.ListDataID || "")])
    .filter(Boolean));
  for (const [recordId, record] of Object.entries(records)) {
    if (!isObject(record)) {
      issue(report, "warning", "SAMPLE_RECORD_NOT_OBJECT", "Sample record value is not an object.", { recordId });
      continue;
    }
    if (!record.ListDataID) issue(report, "warning", "SAMPLE_RECORD_LISTDATAID_MISSING", "Sample record is missing ListDataID.", { recordId });
    const listDataId = String(record.ListDataID || recordId || "");
    if (listDataId) {
      if (seenRecordIds.has(listDataId)) issue(report, "error", "LISTDATA_ID_DUPLICATE", "ListDataID/sample record IDs must be unique within a resource.", { recordId: listDataId });
      seenRecordIds.add(listDataId);
    }
    for (const [fieldName, value] of Object.entries(record)) {
      if (!fieldByName.has(fieldName) && !KNOWN_SYSTEM_FIELDS.has(fieldName)) {
        issue(report, "warning", "SAMPLE_FIELD_UNKNOWN", "Sample record contains a field not defined in Item.Defs.", { recordId, fieldName });
        continue;
      }
      const field = fieldByName.get(fieldName);
      if (!field) continue;
      const rules = parsedRulesForField(field, -1, { ...report, errors: [], warnings: [] });
      const normalizedType = normalizeType(field, rules);
      if (value === "" || value === null || value === undefined) continue;
      if (normalizedType === "lookup") {
        const multiple = rules.multiple === true || rules.multiple === "true";
        const parsed = tryParseJson(value);
        if (externalLookupFields.has(fieldName)) {
          validateExternalLookupSample(value, recordId, fieldName, field, dependencyMap, replaceIds, report);
        }
        if (multiple && !(parsed.ok && Array.isArray(parsed.value))) {
          issue(report, "warning", "SAMPLE_LOOKUP_MULTI_VALUE_SHAPE", "Multi lookup sample value should be a JSON-stringified array.", { recordId, fieldName, value });
        }
        if (!multiple && typeof value !== "string") {
          issue(report, "warning", "SAMPLE_LOOKUP_SINGLE_VALUE_SHAPE", "Single lookup sample value should usually be a target ID string.", { recordId, fieldName, value });
        }
        if (!externalLookupFields.has(fieldName)) validateLookupSampleReference(value, recordId, fieldName, field, dependencyMap, report);
      }
      if (normalizedType === "multiChoice") {
        const parsed = tryParseJson(value);
        if (!(parsed.ok && Array.isArray(parsed.value))) {
          issue(report, "warning", "SAMPLE_MULTICHOICE_VALUE_SHAPE", "Checkbox/multi-choice sample value should be a JSON-stringified array.", { recordId, fieldName, value });
        }
      }
      if (normalizedType === "date" && !/^\d{4}-\d{2}-\d{2}/.test(String(value))) {
        issue(report, "warning", "SAMPLE_DATE_VALUE_SHAPE", "Date sample value does not look like an ISO-ish date string.", { recordId, fieldName, value });
      }
      if (normalizedType === "datetime" && !/^\d{4}-\d{2}-\d{2}/.test(String(value))) {
        issue(report, "warning", "SAMPLE_DATETIME_VALUE_SHAPE", "Datetime sample value does not look like an ISO-ish datetime string.", { recordId, fieldName, value });
      }
    }
    if (isDocumentLibrary && String(record.Text1 || "").toLowerCase() === "folder") {
      if (!record.Title) issue(report, "warning", "DOCUMENT_LIBRARY_FOLDER_TITLE_MISSING", "Document library folder rows should include Title/Name.", { recordId });
      const parentId = String(record.Bigint1 ?? "");
      if (parentId === "") issue(report, "warning", "DOCUMENT_LIBRARY_FOLDER_PARENT_MISSING", "Document library folder rows should include Bigint1/ParentID; root folders use \"0\" in studied exports.", { recordId });
      if (parentId && parentId !== "0" && !documentFolderIds.has(parentId)) {
        issue(report, "warning", "DOCUMENT_LIBRARY_FOLDER_PARENT_UNRESOLVED", "Document library folder ParentID should be 0 or point to another folder row.", { recordId, parentId });
      }
      if (record.Text4) issue(report, "warning", "DOCUMENT_LIBRARY_FOLDER_UPLOAD_PAYLOAD_PRESENT", "Document library folder rows should not include uploaded file payloads.", { recordId });
      if (record.Bigint2 !== undefined && record.Bigint2 !== "") issue(report, "warning", "DOCUMENT_LIBRARY_FOLDER_SIZE_UNUSUAL", "Studied document-library folder rows leave Bigint2/FileSize blank.", { recordId, value: record.Bigint2 });
    }
  }
}

function resolvedLookupDependency(lookup, dependencyMap) {
  if (!dependencyMap) return null;
  const dependencies = Array.isArray(dependencyMap.dependencies) ? dependencyMap.dependencies : [];
  return dependencies.find((dependency) => {
    if (dependency.status && dependency.status !== "resolved") return false;
    const resolved = dependency.resolvedValue || {};
    const targetListId = resolved.listid || dependency.targetListId || dependency.draftTargetListId;
    const targetListSetId = resolved.listsetid || dependency.targetListSetId || dependency.draftTargetListSetId;
    const sourceFieldName = dependency.sourceFieldName || dependency.sourceField || null;
    return String(targetListId || "") === String(lookup.targetListId || "")
      && (!lookup.targetListSetId || String(targetListSetId || "") === String(lookup.targetListSetId || ""))
      && (!sourceFieldName || sourceFieldName === lookup.sourceFieldName || sourceFieldName === lookup.sourceDisplayName || sourceFieldName === lookup.sourceInternalName);
  }) || null;
}

function validateLookupRelationships(lookups, knownListIds, report, dependencyMap) {
  for (const lookup of lookups) {
    if (!lookup.targetListId) continue;
    if (!knownListIds.has(String(lookup.targetListId))) {
      const resolvedDependency = resolvedLookupDependency(lookup, dependencyMap);
      if (resolvedDependency) {
        addDependency(report, {
          type: "resolvedLookupTargetList",
          sourceFieldName: lookup.sourceFieldName,
          sourceDisplayName: lookup.sourceDisplayName,
          targetListId: String(lookup.targetListId),
          targetListSetId: lookup.targetListSetId || null,
          dependencyKey: resolvedDependency.dependencyKey || null,
          status: "resolved",
        });
        continue;
      }
      addDependency(report, {
        type: "lookupTargetList",
        sourceFieldName: lookup.sourceFieldName,
        sourceDisplayName: lookup.sourceDisplayName,
        targetListId: String(lookup.targetListId),
        targetListSetId: lookup.targetListSetId || null,
        requiredForGeneratorMode: true,
      });
      if (report.mode === "generator") {
        issue(report, "error", "LOOKUP_TARGET_UNRESOLVED", "Lookup target list is not included in this decoded package and no dependency mapping was provided.", lookup);
      } else {
        issue(report, "warning", "LOOKUP_TARGET_EXTERNAL", "Lookup target list is external to this standalone package.", lookup);
      }
    }
  }
}

function collectKnownListIds(data) {
  const ids = new Set();
  if (data.Item && data.Item.ListModel && data.Item.ListModel.ListID) ids.add(String(data.Item.ListModel.ListID));
  for (const child of asArray(data.Childs)) {
    if (child.ListModel && child.ListModel.ListID) ids.add(String(child.ListModel.ListID));
  }
  return ids;
}

function validate(inputPath, mode, stage, dependencyMapPath = null) {
  const report = {
    status: "pass",
    mode,
    stage,
    input: path.resolve(inputPath),
    inputKind: null,
    errors: [],
    warnings: [],
    placeholders: [],
    dependencies: [],
    dependencyMap: dependencyMapPath ? path.resolve(dependencyMapPath) : null,
    summary: {
      fields: 0,
      views: 0,
      customForms: 0,
      workflows: 0,
      sampleRecords: 0,
      lookupRelationships: 0,
    },
    _largeNumbers: new Set(),
    _dependencyKeys: new Set(),
  };
  const dependencyMap = loadDependencyMap(dependencyMapPath, report);

  const decoded = decodeInput(inputPath, report);
  if (!decoded || !decoded.data) return finishReport(report);
  report.inputKind = decoded.inputKind;
  detectPlaceholders(decoded, report);
  if (report._largeNumbers.size) {
    issue(report, "warning", "LARGE_NUMERIC_IDS_PRESERVED", `${report._largeNumbers.size} large numeric ID values were preserved as strings.`, {
      count: report._largeNumbers.size,
    });
  }

  const item = validateStructure(decoded.data, decoded.resource, report);
  if (!item) return finishReport(report);
  validateIdentity(item, decoded.resource, report);
  validatePermissionsAndNotifications(item, report);
  const { fieldByName, lookupRelationships } = validateFields(item, report);
  const knownListIds = collectKnownListIds(decoded.data);
  const externalLookupFields = new Set(lookupRelationships.filter((lookup) => lookup.targetListId && !knownListIds.has(String(lookup.targetListId))).map((lookup) => lookup.sourceFieldName));
  const viewCount = validateViews(item, fieldByName, report);
  const customFormCount = validateCustomForms(item, fieldByName, report);
  validatePublicForms(item, fieldByName, report);
  validateCustomFormDisplaySettings(item, report);
  validateWorkflows(decoded.data, item, fieldByName, knownListIds, report);
  validateSampleData(item, fieldByName, report, dependencyMap, externalLookupFields, decoded.resource);
  validateLookupRelationships(lookupRelationships, knownListIds, report, dependencyMap);
  validateDesignSystemColorUsage(decoded, report);

  report.summary.fields = asArray(item.Defs).length;
  report.summary.views = viewCount;
  report.summary.customForms = customFormCount;
  report.summary.workflows = asArray(decoded.data.Forms).length;
  report.summary.sampleRecords = item.ListDatas ? Object.keys(item.ListDatas).length : 0;
  report.summary.lookupRelationships = lookupRelationships.length;
  return finishReport(report);
}

function finishReport(report) {
  delete report._largeNumbers;
  delete report._dependencyKeys;
  if (report.errors.length) report.status = "fail";
  else if (report.warnings.length || report.dependencies.length) report.status = "pass_with_warnings";
  else report.status = "pass";
  return report;
}

function main() {
  const args = parseArgs(process.argv);
  const report = validate(args.input, args.mode, args.stage, args.dependencyMap);
  console.log(JSON.stringify(report, null, 2));
  if (report.status === "fail") process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({
    status: "fail",
    errors: [{ code: "VALIDATOR_RUNTIME_ERROR", message: error.message }],
  }, null, 2));
  process.exit(1);
}

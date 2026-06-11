#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const PROCESS_KEY_RE = /^[A-Za-z0-9_]+$/;
const WRAPPER_REQUIRED = ["Title", "Description", "IconUrl", "IsListSet", "Resource"];
const CUSTOM_LIST_MODEL_TYPES = new Set([1, 16, 32, 64, 128, 1024]);
const PERMISSION_RULES = {
  approvalForms: { mask: 1 | 16 | 32, label: "Submit=1, ReadTasks=16, ProcessTasks=32" },
  dataLists: { mask: 1 | 2 | 4 | 8, label: "Submit=1, Edit=2, Delete=4, Read=8" },
  documentLibraries: { mask: 1 | 2 | 4 | 8, label: "Submit=1, Edit=2, Delete=4, Read=8" },
  aiAgents: { mask: 1, label: "Submit=1" },
};
const CONFLICT_PERMISSION_RULES = {
  formReports: { schemaAllowed: new Set([0, 8]), mdAllowed: new Set([0, 1]), label: "schema says Read=8; rules doc says Submit=1" },
  dataReports: { schemaAllowed: new Set([0, 8]), mdAllowed: new Set([0, 1]), label: "schema says Read=8; rules doc says Submit=1" },
};

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-yap-schema-standard.mjs <app.yap|decoded-resource.json|decoded-data.json>",
    "",
    "Checks product-team YAP schema-standard rules without printing raw package payloads.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
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
        } else out += token;
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJson(text, largeNumbers) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
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

function add(findings, level, code, message, detail = {}) {
  findings.push({ level, code, message, detail });
}

function parseMaybeJson(value) {
  if (isObject(value) || Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function decodeInput(inputPath, findings, largeNumbers) {
  const parsed = parseJson(fs.readFileSync(inputPath, "utf8"), largeNumbers);
  if (parsed && typeof parsed.Resource === "string") {
    for (const key of WRAPPER_REQUIRED) {
      if (!Object.prototype.hasOwnProperty.call(parsed, key)) add(findings, "error", "YAP_WRAPPER_REQUIRED_PROPERTY_MISSING", "YAP wrapper is missing a schema-required property.", { path: `$.${key}` });
    }
    if (!parsed.Resource.startsWith(GZIP_PREFIX)) {
      add(findings, "error", "YAP_RESOURCE_PREFIX_INVALID", `Resource must start with ${GZIP_PREFIX}.`);
      return { wrapper: parsed, resource: null, data: null, inputType: "wrapped-yap" };
    }
    let resource;
    try {
      resource = parseJson(zlib.gunzipSync(Buffer.from(parsed.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"), largeNumbers);
    } catch (error) {
      add(findings, "error", "YAP_RESOURCE_DECODE_INVALID", "Resource gzip/base64 or JSON decode failed.", { error: error.message });
      return { wrapper: parsed, resource: null, data: null, inputType: "wrapped-yap" };
    }
    if (isObject(resource.Item) || Array.isArray(resource.Childs)) {
      add(findings, "error", "YAP_RESOURCE_NOT_LIST_EXPORT_RESULT", "Decoded Resource must be ListExportResult with Data, not direct ListExportInfo.", { path: "$.Resource" });
      return { wrapper: parsed, resource, data: resource, inputType: "wrapped-yap-schema-direct-invalid" };
    }
    if (!isObject(resource) || !("Data" in resource)) {
      add(findings, "error", "RESOURCE_DATA_MISSING", "Decoded Resource should be ListExportResult with Data.");
      return { wrapper: parsed, resource, data: null, inputType: "wrapped-yap" };
    }
    if (typeof resource.Data === "string") {
      try {
        return { wrapper: parsed, resource, data: parseJson(resource.Data, largeNumbers), inputType: "wrapped-yap-list-export-result-data-string" };
      } catch (error) {
        add(findings, "error", "RESOURCE_DATA_JSON_INVALID", "Decoded Resource.Data JSON parse failed.", { error: error.message });
        return { wrapper: parsed, resource, data: null, inputType: "wrapped-yap-list-export-result" };
      }
    }
    if (isObject(resource.Data)) return { wrapper: parsed, resource, data: resource.Data, inputType: "wrapped-yap-list-export-result-data-object" };
    add(findings, "error", "RESOURCE_DATA_INVALID", "Decoded Resource.Data must be a JSON string or ListExportInfo object.", { actualType: Array.isArray(resource.Data) ? "array" : resource.Data === null ? "null" : typeof resource.Data });
    return { wrapper: parsed, resource, data: null, inputType: "wrapped-yap-list-export-result" };
  }
  if (parsed && typeof parsed.Data === "string") {
    try {
      return { wrapper: null, resource: parsed, data: parseJson(parsed.Data, largeNumbers), inputType: "decoded-resource-json" };
    } catch (error) {
      add(findings, "error", "RESOURCE_DATA_JSON_INVALID", "Decoded Resource.Data JSON parse failed.", { error: error.message });
      return { wrapper: null, resource: parsed, data: null, inputType: "decoded-resource-json" };
    }
  }
  return { wrapper: null, resource: null, data: parsed, inputType: "decoded-data-json" };
}

function inspectListExportItem(item, exportPath, findings, summary) {
  if (!isObject(item)) {
    add(findings, "error", "LIST_EXPORT_ITEM_INVALID", "ListExportItem must be an object.", { path: exportPath });
    return;
  }
  summary.listExportItems += 1;
  for (const key of ["Defs", "Layouts"]) {
    const value = item[key];
    if (!Object.prototype.hasOwnProperty.call(item, key)) add(findings, "error", `LIST_EXPORT_ITEM_${key.toUpperCase()}_MISSING`, `ListExportItem.${key} is required.`, { path: `${exportPath}.${key}` });
    else if (value === null) add(findings, "error", `LIST_EXPORT_ITEM_${key.toUpperCase()}_NULL`, `ListExportItem.${key} cannot be null; use [] when empty.`, { path: `${exportPath}.${key}` });
    else if (!Array.isArray(value)) add(findings, "error", `LIST_EXPORT_ITEM_${key.toUpperCase()}_NOT_ARRAY`, `ListExportItem.${key} must be an array.`, { path: `${exportPath}.${key}`, actualType: typeof value });
  }
  if (!isObject(item.ListModel)) {
    add(findings, "error", "LIST_EXPORT_ITEM_LISTMODEL_MISSING", "ListExportItem.ListModel is required for generated app/list resources.", { path: `${exportPath}.ListModel` });
  } else {
    if (item.ListModel.Flags !== 1) {
      add(findings, "error", "LISTMODEL_FLAGS_INVALID", "Product schema v2 requires CustomListModel.Flags = 1; missing or different values can fail import.", { path: `${exportPath}.ListModel.Flags`, value: item.ListModel.Flags });
    }
    if (item.ListModel.Status !== undefined && item.ListModel.Status !== 1) {
      add(findings, "error", "LISTMODEL_STATUS_INVALID", "Product schema v2 fixes CustomListModel.Status to 1 when present.", { path: `${exportPath}.ListModel.Status`, value: item.ListModel.Status });
    }
    if (item.ListModel.Type !== undefined && !CUSTOM_LIST_MODEL_TYPES.has(Number(item.ListModel.Type))) {
      add(findings, "error", "LISTMODEL_TYPE_INVALID", "Product schema v2 allows CustomListModel.Type values 1, 16, 32, 64, 128, or 1024.", { path: `${exportPath}.ListModel.Type`, value: item.ListModel.Type });
    }
  }
  summary.defs += asArray(item.Defs).length;
  summary.layouts += asArray(item.Layouts).length;
  for (const [fieldIndex, field] of asArray(item.Defs).entries()) {
    if (!Number.isInteger(field && field.Category)) {
      add(findings, "error", "FIELD_CATEGORY_NOT_INT", "Field.Category must be an integer for generated YAP packages.", {
        path: `${exportPath}.Defs[${fieldIndex}].Category`,
        list: item.ListModel?.Title || null,
        field: field?.DisplayName || field?.FieldName || field?.InternalName || null,
        actualType: field?.Category === undefined ? "missing" : Array.isArray(field?.Category) ? "array" : field?.Category === null ? "null" : typeof field?.Category,
      });
    }
    if (typeof field?.FieldName === "string" && Number.isInteger(field?.FieldIndex)) {
      const match = field.FieldName.match(/(\d+)$/);
      if (!match || Number.parseInt(match[1], 10) !== field.FieldIndex) {
        add(findings, "error", "FIELD_NAME_SUFFIX_INDEX_MISMATCH", "FieldName trailing digits must equal FieldIndex.", {
          path: `${exportPath}.Defs[${fieldIndex}].FieldName`,
          list: item.ListModel?.Title || null,
          field: field.DisplayName || field.FieldName || field.InternalName || null,
          fieldName: field.FieldName,
          fieldIndex: field.FieldIndex,
        });
      }
    }
  }
}

function addDuplicateFinding(findings, code, message, seen, value, detail) {
  const key = String(value);
  const previous = seen.get(key);
  if (previous) add(findings, "error", code, message, { value, previousPath: previous.path, ...detail });
  else seen.set(key, detail);
}

function inspectIdUniqueness(data, findings, largeNumbers = new Set()) {
  const listIds = new Map();
  const fieldIds = new Map();
  const layoutIds = new Map();
  const resourceIds = new Map();
  const idKeys = new Set(["AppID", "ListID", "FieldID", "LayoutID", "ID", "RefId", "ReportID", "ProcModelID", "ResourceID"]);
  const assertSafeInteger = (value, pointer) => {
    if (value === undefined || value === null || value === "") return;
    if (typeof value === "string" && largeNumbers.has(value)) return;
    if (!Number.isInteger(value)) {
      add(findings, "error", "INVALID_ID_TYPE", "Generated YAP ID values must be JSON integers.", {
        path: pointer,
        actualType: Array.isArray(value) ? "array" : value === null ? "null" : typeof value,
      });
    } else if (!Number.isSafeInteger(value)) {
      add(findings, "error", "UNSAFE_INTEGER_ID", "Generated YAP integer IDs must be within Number.MAX_SAFE_INTEGER to avoid JSON rounding duplicates.", {
        path: pointer,
        value,
      });
    }
  };
  const walk = (value, pointer = "Data") => {
    if (Array.isArray(value)) value.forEach((child, index) => walk(child, `${pointer}[${index}]`));
    else if (isObject(value)) {
      for (const [key, child] of Object.entries(value)) {
        const childPath = `${pointer}.${key}`;
        if (idKeys.has(key)) assertSafeInteger(child, childPath);
        walk(child, childPath);
      }
    }
  };
  walk(data);

  const items = [];
  if (isObject(data?.Item)) items.push({ item: data.Item, path: "Data.Item", title: data.Item.ListModel?.Title || "root" });
  asArray(data?.Childs).forEach((child, index) => items.push({ item: child, path: `Data.Childs[${index}]`, title: child.ListModel?.Title || null }));
  for (const { item, path: itemPath, title } of items) {
    const listId = item?.ListModel?.ListID;
    const appId = item?.ListModel?.AppID;
    if (appId !== undefined && String(appId) !== "41") {
      add(findings, "error", "LISTMODEL_APPID_NOT_FIXED_41", "Generated YAP ListModel.AppID must stay fixed at 41; use API-issued IDs for list/field/layout IDs only.", { path: `${itemPath}.ListModel.AppID`, list: title, appId });
    }
    if (listId !== undefined) addDuplicateFinding(findings, "DUPLICATE_LIST_ID", "ListID values must be globally unique across generated ListExportItem resources.", listIds, listId, { path: `${itemPath}.ListModel.ListID`, list: title });

    const fieldIndexes = new Map();
    const fieldNames = new Map();
    const internalNames = new Map();
    const displayNames = new Map();
    asArray(item?.Defs).forEach((field, index) => {
      const fieldPath = `${itemPath}.Defs[${index}]`;
      const fieldLabel = field?.DisplayName || field?.FieldName || field?.InternalName || null;
      if (field?.FieldID !== undefined) addDuplicateFinding(findings, "DUPLICATE_FIELD_ID", "FieldID values must be globally unique in generated packages.", fieldIds, field.FieldID, { path: `${fieldPath}.FieldID`, list: title, field: fieldLabel });
      if (field?.FieldIndex !== undefined) addDuplicateFinding(findings, "DUPLICATE_FIELD_INDEX", "FieldIndex values must be unique within a list.", fieldIndexes, field.FieldIndex, { path: `${fieldPath}.FieldIndex`, list: title, field: fieldLabel });
      if (field?.FieldName) addDuplicateFinding(findings, "DUPLICATE_FIELD_NAME", "FieldName values must be unique within a list.", fieldNames, field.FieldName, { path: `${fieldPath}.FieldName`, list: title, field: fieldLabel });
      if (field?.InternalName) addDuplicateFinding(findings, "DUPLICATE_INTERNAL_NAME", "InternalName values must be unique within a list.", internalNames, field.InternalName, { path: `${fieldPath}.InternalName`, list: title, field: fieldLabel });
      if (field?.DisplayName) addDuplicateFinding(findings, "DUPLICATE_DISPLAY_NAME", "DisplayName values should be unique within a generated list.", displayNames, field.DisplayName, { path: `${fieldPath}.DisplayName`, list: title, field: fieldLabel });
    });

    asArray(item?.Layouts).forEach((layout, index) => {
      const layoutPath = `${itemPath}.Layouts[${index}]`;
      const layoutLabel = layout?.Title || null;
      if (layout?.LayoutID !== undefined) addDuplicateFinding(findings, "DUPLICATE_LAYOUT_ID", "LayoutID values must be globally unique across all ListExportItem.Layouts.", layoutIds, layout.LayoutID, { path: `${layoutPath}.LayoutID`, list: title, layout: layoutLabel });
      asArray(layout?.LayoutInResources).forEach((resource, resourceIndex) => {
        if (resource?.ID !== undefined) addDuplicateFinding(findings, "DUPLICATE_RESOURCE_ID", "LayoutInResources ID values must be globally unique across layout resources.", resourceIds, resource.ID, { path: `${layoutPath}.LayoutInResources[${resourceIndex}].ID`, list: title, layout: layoutLabel });
      });
    });
  }
}

function inspectNoRule(form, index, findings, summary) {
  const noRule = form && form.NoRule;
  const formPath = `Data.Forms[${index}]`;
  const key = safeString(form && form.Key);
  const workflowType = safeString(form && form.WorkflowType);
  const requiresNoRule = workflowType === "2" || (safeString(form && form.ListID) === "0" && noRule !== undefined && noRule !== null && noRule !== "");
  if (key && !PROCESS_KEY_RE.test(key)) add(findings, "error", "PROCESS_KEY_INVALID_CHARS", "Process form Key may contain only letters, numbers, and underscores.", { path: `${formPath}.Key` });
  if (key.length > 255) add(findings, "error", "PROCESS_KEY_TOO_LONG", "Process form Key must not exceed 255 characters.", { path: `${formPath}.Key`, length: key.length });
  if (noRule === undefined || noRule === null || noRule === "") {
    if (requiresNoRule) add(findings, "error", "NORULE_MISSING", "Approval/process form NoRule is required and must be an object.", { path: `${formPath}.NoRule` });
    return;
  }
  summary.noRules += 1;
  if (!isObject(noRule)) {
    add(findings, "error", "NORULE_INVALID_OBJECT", "NoRule must be an object with Prefix, StartIndex, CustomLength, and AutoIncrement.", { path: `${formPath}.NoRule`, actualType: Array.isArray(noRule) ? "array" : noRule === null ? "null" : typeof noRule });
    return;
  }
  for (const keyName of ["Prefix", "StartIndex", "CustomLength", "AutoIncrement"]) {
    if (!Object.prototype.hasOwnProperty.call(noRule, keyName)) add(findings, "error", `NORULE_${keyName.toUpperCase()}_MISSING`, `NoRule.${keyName} is required.`, { path: `${formPath}.NoRule.${keyName}` });
  }
  if (typeof noRule.Prefix !== "string" || !noRule.Prefix.includes("{index}")) add(findings, "error", "NORULE_PREFIX_INDEX_MISSING", "NoRule.Prefix must include {index}.", { path: `${formPath}.NoRule.Prefix` });
  for (const keyName of ["StartIndex", "CustomLength", "AutoIncrement"]) {
    if (noRule[keyName] !== undefined && !Number.isInteger(noRule[keyName])) add(findings, "error", `NORULE_${keyName.toUpperCase()}_INVALID`, `NoRule.${keyName} must be an integer.`, { path: `${formPath}.NoRule.${keyName}` });
  }
}

function inspectPermissions(resources, componentPath, findings, summary) {
  if (!isObject(resources)) return;
  const permissionsRoot = resources.permissions && isObject(resources.permissions) ? resources.permissions : resources;
  for (const [groupName, rule] of Object.entries(PERMISSION_RULES)) {
    for (const [entryIndex, entry] of asArray(permissionsRoot[groupName]?.items).entries()) {
      summary.permissionEntries += 1;
      const raw = entry && entry.permissions;
      const value = Number(raw);
      if (!Number.isInteger(value)) add(findings, "error", "APP_RESOURCE_PERMISSION_INVALID", "App resource permissions must be integer bitmasks.", { path: `${componentPath}.resources.${groupName}.items[${entryIndex}].permissions`, valueType: typeof raw });
      else if ((value & ~rule.mask) !== 0) add(findings, "error", "APP_RESOURCE_PERMISSION_INVALID_BITS", "App resource permissions include bits outside the schema-backed allowed mask.", { path: `${componentPath}.resources.${groupName}.items[${entryIndex}].permissions`, permissions: value, allowed: rule.label });
    }
  }
  for (const [groupName, conflict] of Object.entries(CONFLICT_PERMISSION_RULES)) {
    for (const [entryIndex, entry] of asArray(permissionsRoot[groupName]?.items).entries()) {
      summary.permissionEntries += 1;
      const value = Number(entry && entry.permissions);
      if (!Number.isInteger(value)) add(findings, "error", "APP_RESOURCE_PERMISSION_INVALID", "App resource permissions must be integer bitmasks.", { path: `${componentPath}.resources.${groupName}.items[${entryIndex}].permissions` });
      else if (!conflict.schemaAllowed.has(value) || !conflict.mdAllowed.has(value)) {
        add(findings, "warning", "APP_RESOURCE_PERMISSION_SCHEMA_RULE_CONFLICT", "Schema and updated rules document disagree for this resource permission family; use warning until clarified.", { path: `${componentPath}.resources.${groupName}.items[${entryIndex}].permissions`, permissions: value, conflict: conflict.label });
      }
    }
  }
}

function inspectOtherModules(data, findings, summary) {
  for (const [moduleIndex, module] of asArray(data && data.OtherModules).entries()) {
    const type = safeString(module && module.Type);
    if (!["Connections", "Agents", "Knowledges"].includes(type)) add(findings, "warning", "OTHER_MODULE_TYPE_UNKNOWN", "OtherModules Type is not in the schema-backed known set.", { path: `Data.OtherModules[${moduleIndex}].Type`, type });
    let moduleData = module && module.Data;
    if (typeof moduleData === "string") moduleData = parseMaybeJson(moduleData);
    if (moduleData !== undefined && moduleData !== null && !Array.isArray(moduleData)) add(findings, "warning", "OTHER_MODULE_DATA_NOT_ARRAY", "OtherModules Data should be an array for schema-backed modules.", { path: `Data.OtherModules[${moduleIndex}].Data`, type });
    if (type !== "Agents") continue;
    for (const [agentIndex, agent] of asArray(moduleData).entries()) {
      for (const [componentIndex, component] of asArray(agent && agent.Components).entries()) {
        if (Number(component && component.Type) !== 2 || Number(component && component.SubType) !== 10) continue;
        summary.accessAppResourceTools += 1;
        const settings = parseMaybeJson(component.Settings);
        if (!isObject(settings)) {
          add(findings, "error", "APP_RESOURCE_TOOL_SETTINGS_INVALID", "Access app resources tool Settings must parse as an object.", { path: `Data.OtherModules[${moduleIndex}].Data[${agentIndex}].Components[${componentIndex}].Settings` });
          continue;
        }
        inspectPermissions(settings.resources, `Data.OtherModules[${moduleIndex}].Data[${agentIndex}].Components[${componentIndex}].Settings`, findings, summary);
      }
    }
  }
}

function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h") || process.argv.length < 3) usage(process.argv.length < 3 ? 1 : 0);
  const input = process.argv[2];
  const findings = [];
  const largeNumbers = new Set();
  const decoded = decodeInput(input, findings, largeNumbers);
  const summary = {
    inputType: decoded.inputType,
    listExportItems: 0,
    defs: 0,
    layouts: 0,
    forms: asArray(decoded.data && decoded.data.Forms).length,
    noRules: 0,
    otherModules: asArray(decoded.data && decoded.data.OtherModules).length,
    accessAppResourceTools: 0,
    permissionEntries: 0,
    largeNumericIdsPreserved: largeNumbers.size,
  };
  if (decoded.data) {
    if (!isObject(decoded.data.Item)) add(findings, "error", "LIST_EXPORT_INFO_ITEM_MISSING", "ListExportInfo.Item is required.", { path: "Data.Item" });
    else inspectListExportItem(decoded.data.Item, "Data.Item", findings, summary);
    asArray(decoded.data.Childs).forEach((child, index) => inspectListExportItem(child, `Data.Childs[${index}]`, findings, summary));
    inspectIdUniqueness(decoded.data, findings, largeNumbers);
    asArray(decoded.data.Forms).forEach((form, index) => inspectNoRule(form, index, findings, summary));
    inspectOtherModules(decoded.data, findings, summary);
  }
  const errors = findings.filter((finding) => finding.level === "error").length;
  const warnings = findings.filter((finding) => finding.level === "warning").length;
  console.log(JSON.stringify({
    input: path.basename(input),
    reference: "product-team yap-schema.json plus Yeeflow App Creation Rules.md",
    status: errors ? "fail" : "pass",
    errors,
    warnings,
    summary,
    findings,
  }, null, 2));
  if (errors) process.exitCode = 1;
}

main();

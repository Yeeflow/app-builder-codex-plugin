#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const GZIP_PREFIX = "[______gizp______]";
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { loadYapkSchemaEffective } = require("./lib/load-yapk-schema.js");
const DEFAULT_YAP_SCHEMA = resolveCanonicalSchemaPath("schemas/yap-schema.json");
const DEFAULT_YAPK_SCHEMA = resolveCanonicalSchemaPath("schemas/yapk-schema.json");
const LARGE_INTEGER_RE = /^-?\d{16,}$/;

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/validate-standard-package-schema.mjs <package.yap|package.yapk> [--yap-schema <path>] [--yapk-schema <path>] [--schema-only]",
    "",
    "Validates the package wrapper and decoded Resource against the supplied Yeeflow standard schemas.",
    "--schema-only skips plugin completeness checks so canonical schema behavior can be tested separately.",
    "Output is redacted and does not print raw Resource, Sign, or decoded payloads.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function hasArg(name) {
  return process.argv.includes(name);
}

function resolveCanonicalSchemaPath(relativeSchemaPath) {
  const candidates = [
    path.resolve(process.cwd(), relativeSchemaPath),
    path.resolve(SCRIPT_DIR, "..", relativeSchemaPath),
    path.resolve(SCRIPT_DIR, "..", "..", relativeSchemaPath),
    path.resolve(SCRIPT_DIR, "..", "..", "..", relativeSchemaPath),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
}

function readJson(file) {
  return parseJsonPreservingLargeInts(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function readSchema(type, file) {
  if (type === "yapk" && path.resolve(file) === path.resolve(DEFAULT_YAPK_SCHEMA)) {
    return loadYapkSchemaEffective({ startDir: SCRIPT_DIR });
  }
  return readJson(file);
}

function resolveSchemaPath(type) {
  const requested = type === "yap" ? argValue("--yap-schema", DEFAULT_YAP_SCHEMA) : argValue("--yapk-schema", DEFAULT_YAPK_SCHEMA);
  if (fs.existsSync(requested)) return requested;
  return requested;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function schemaAt(root, ref) {
  if (!ref.startsWith("#/")) throw new Error(`Unsupported schema ref: ${ref}`);
  return ref.slice(2).split("/").reduce((node, part) => node?.[part.replace(/~1/g, "/").replace(/~0/g, "~")], root);
}

function typeMatches(value, expected) {
  if (Array.isArray(expected)) return expected.some((type) => typeMatches(value, type));
  if (expected === "array") return Array.isArray(value);
  if (expected === "object") return isObject(value);
  if (expected === "integer") return isIntegerLike(value);
  if (expected === "number") return typeof value === "number" && Number.isFinite(value);
  if (expected === "string") return typeof value === "string";
  if (expected === "boolean") return typeof value === "boolean";
  if (expected === "null") return value === null;
  return true;
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

function parseJsonPreservingLargeInts(text) {
  return JSON.parse(quoteLargeIntegers(text));
}

function isIntegerLike(value) {
  return Number.isInteger(value) || (typeof value === "string" && LARGE_INTEGER_RE.test(value));
}

const YAP_FIELD_INDEX_RANGE_BY_FIELD_TYPE = new Map([
  ["Text", { min: 1, max: 300 }],
  ["Bit", { min: 1, max: 50 }],
  ["Decimal", { min: 1, max: 200 }],
  ["Datetime", { min: 1, max: 200 }],
]);

function inspectYapFieldSchemaRules(field, group, index, errors) {
  const pathPrefix = `${group.path}[${index}]`;
  const fieldName = typeof field?.FieldName === "string" ? field.FieldName : "";
  const fieldType = typeof field?.FieldType === "string" ? field.FieldType : "";
  const fieldIndex = Number(field?.FieldIndex);
  const isSystem = field?.IsSystem === true;
  const label = field?.DisplayName || field?.FieldName || field?.InternalName || null;

  if (fieldName === "Title") {
    if (!isSystem || fieldIndex !== 0) {
      errors.push({
        scope: "decodedResource.Data",
        path: `${pathPrefix}.FieldName`,
        code: "YAP_TITLE_FIELD_SYSTEM_METADATA_INVALID",
        message: "FieldName=Title must use IsSystem=true and FieldIndex=0.",
        list: group.list,
        field: label,
        isSystem: field?.IsSystem,
        fieldIndex: field?.FieldIndex,
      });
    }
    return;
  }

  if (isSystem) {
    errors.push({
      scope: "decodedResource.Data",
      path: `${pathPrefix}.IsSystem`,
      code: "YAP_SYSTEM_FIELD_NOT_TITLE",
      message: "Only the native Title field may use IsSystem=true.",
      list: group.list,
      field: label,
      fieldName,
    });
    return;
  }

  const expectedFieldName = Number.isInteger(fieldIndex) ? `${fieldType}${fieldIndex}` : null;
  if (expectedFieldName && fieldName !== expectedFieldName) {
    errors.push({
      scope: "decodedResource.Data",
      path: `${pathPrefix}.FieldName`,
      code: "YAP_CUSTOM_FIELDNAME_SCHEMA_MISMATCH",
      message: "Custom FieldName must exactly equal FieldType + FieldIndex.",
      list: group.list,
      field: label,
      fieldName,
      fieldType,
      fieldIndex: field?.FieldIndex,
      expectedFieldName,
    });
  }

  const range = YAP_FIELD_INDEX_RANGE_BY_FIELD_TYPE.get(fieldType);
  if (!Number.isInteger(fieldIndex) || !range || fieldIndex < range.min || fieldIndex > range.max) {
    errors.push({
      scope: "decodedResource.Data",
      path: `${pathPrefix}.FieldIndex`,
      code: "YAP_FIELDINDEX_OUT_OF_RANGE",
      message: "Custom FieldIndex must stay within the schema range for the FieldType.",
      list: group.list,
      field: label,
      fieldName,
      fieldType,
      fieldIndex: field?.FieldIndex,
      min: range?.min,
      max: range?.max,
    });
  }
}

function validate(value, schema, root, instancePath = "$", errors = []) {
  if (!schema || typeof schema !== "object") return errors;
  if (schema.$ref) return validate(value, schemaAt(root, schema.$ref), root, instancePath, errors);
  if (Array.isArray(schema.allOf)) {
    for (const child of schema.allOf) validate(value, child, root, instancePath, errors);
  }
  if (schema.if && schema.then) {
    const ifErrors = [];
    validate(value, schema.if, root, instancePath, ifErrors);
    if (ifErrors.length === 0) validate(value, schema.then, root, instancePath, errors);
  }
  if (Array.isArray(schema.oneOf)) {
    let matches = 0;
    for (const child of schema.oneOf) {
      const childErrors = [];
      validate(value, child, root, instancePath, childErrors);
      if (childErrors.length === 0) matches += 1;
    }
    if (matches !== 1) errors.push({ path: instancePath, code: "oneOf", message: `Expected exactly one oneOf branch to match; matched ${matches}.` });
  }
  if (schema.type !== undefined && !typeMatches(value, schema.type)) {
    errors.push({ path: instancePath, code: "type", message: `Expected type ${JSON.stringify(schema.type)}, got ${Array.isArray(value) ? "array" : value === null ? "null" : typeof value}.` });
    return errors;
  }
  if (schema.const !== undefined && value !== schema.const) {
    errors.push({ path: instancePath, code: "const", message: `Expected const ${JSON.stringify(schema.const)}.` });
  }
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
    errors.push({ path: instancePath, code: "enum", message: "Value is outside schema enum." });
  }
  if (typeof value === "string" && schema.pattern) {
    const re = new RegExp(schema.pattern);
    const titleSystemFieldException = value === "Title" && schema.pattern === ".*\\d+$";
    if (!titleSystemFieldException && !re.test(value)) errors.push({ path: instancePath, code: "pattern", message: `String does not match pattern ${schema.pattern}.` });
  }
  if (typeof value === "string" && schema.minLength !== undefined && value.length < schema.minLength) {
    errors.push({ path: instancePath, code: "minLength", message: `String is shorter than minLength ${schema.minLength}.` });
  }
  if (typeof value === "string" && schema.maxLength !== undefined && value.length > schema.maxLength) {
    errors.push({ path: instancePath, code: "maxLength", message: `String is longer than maxLength ${schema.maxLength}.` });
  }
  if (typeof value === "string" && schema.format === "date-time") {
    const time = Date.parse(value);
    if (!Number.isFinite(time)) errors.push({ path: instancePath, code: "format", message: "String is not a valid date-time." });
  }
  if (typeof value === "number" && schema.minimum !== undefined && value < schema.minimum) {
    errors.push({ path: instancePath, code: "minimum", message: `Number is below minimum ${schema.minimum}.` });
  }
  if (typeof value === "number" && schema.maximum !== undefined && value > schema.maximum) {
    errors.push({ path: instancePath, code: "maximum", message: `Number is above maximum ${schema.maximum}.` });
  }
  if (Array.isArray(value) && schema.items) {
    value.forEach((item, index) => validate(item, schema.items, root, `${instancePath}[${index}]`, errors));
  }
  if (isObject(value)) {
    const properties = schema.properties || {};
    for (const key of schema.required || []) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) errors.push({ path: `${instancePath}.${key}`, code: "required", message: "Required property is missing." });
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.prototype.hasOwnProperty.call(properties, key)) errors.push({ path: `${instancePath}.${key}`, code: "additionalProperties", message: "Property is not allowed by schema." });
      }
    }
    for (const [key, childSchema] of Object.entries(properties)) {
      if (Object.prototype.hasOwnProperty.call(value, key)) validate(value[key], childSchema, root, `${instancePath}.${key}`, errors);
    }
  }
  return errors;
}

function decodeYap(wrapper) {
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error(`YAP Resource must start with ${GZIP_PREFIX}`);
  }
  const text = zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8");
  return parseJsonPreservingLargeInts(text);
}

function decodedYapData(decoded, schema) {
  if (!isObject(decoded) || !("Data" in decoded)) {
    return {
      data: null,
      errors: [{
        scope: "decodedResource",
        path: "$.Resource",
        code: "YAP_RESOURCE_NOT_LIST_EXPORT_RESULT",
        message: "Decoded YAP Resource must be ListExportResult with Data, not direct ListExportInfo.",
      }],
    };
  }
  if (typeof decoded.Data === "string") {
    try {
      return { data: parseJsonPreservingLargeInts(decoded.Data), errors: [] };
    } catch (error) {
      return {
        data: null,
        errors: [{
          scope: "decodedResource",
          path: "$.Data",
          code: "YAP_DATA_JSON_INVALID",
          message: `ListExportResult.Data string did not parse as JSON: ${error.message}`,
        }],
      };
    }
  }
  if (isObject(decoded.Data)) return { data: decoded.Data, errors: [] };
  return {
    data: null,
    errors: [{
      scope: "decodedResource",
      path: "$.Data",
      code: "YAP_DATA_INVALID",
      message: "ListExportResult.Data must be a JSON string or ListExportInfo object.",
    }],
  };
}

async function decodeYapk(wrapper) {
  if (typeof wrapper.Resource !== "string") throw new Error("YAPK Resource must be a string.");
  const bytes = Buffer.from(wrapper.Resource, "base64");
  try {
    return parseJsonPreservingLargeInts(zlib.brotliDecompressSync(bytes).toString("utf8"));
  } catch (syncError) {
    const text = await tolerantBrotliText(bytes);
    if (text) return parseJsonPreservingLargeInts(text);
    throw syncError;
  }
}

function tolerantBrotliText(bytes) {
  return new Promise((resolve) => {
    const stream = zlib.createBrotliDecompress();
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", () => resolve(Buffer.concat(chunks).toString("utf8")));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    stream.end(bytes);
  });
}

function inspectFieldCategories(decoded, type) {
  const errors = [];
  const groups = [];
  if (type === "yap") {
    if (decoded.Item) groups.push({ path: "$.Item.Defs", list: decoded.Item.ListModel?.Title || null, fields: decoded.Item.Defs || [] });
    (decoded.Childs || []).forEach((child, index) => groups.push({ path: `$.Childs[${index}].Defs`, list: child.ListModel?.Title || null, fields: child.Defs || [] }));
  } else {
    if (decoded.ListSet) groups.push({ path: "$.ListSet.Fields", list: decoded.ListSet.List?.Title || null, fields: decoded.ListSet.Fields || [] });
    (decoded.Childs || []).forEach((child, index) => groups.push({ path: `$.Childs[${index}].Fields`, list: child.List?.Title || null, fields: child.Fields || [] }));
  }
  for (const group of groups) {
    group.fields.forEach((field, index) => {
      if (!isIntegerLike(field?.Category)) {
        errors.push({
          scope: "decodedResource",
          path: `${group.path}[${index}].Category`,
          code: "FIELD_CATEGORY_NOT_INT",
          message: "Field.Category must be an integer.",
          list: group.list,
          field: field?.DisplayName || field?.FieldName || field?.InternalName || null,
          actualType: field?.Category === undefined ? "missing" : Array.isArray(field?.Category) ? "array" : field?.Category === null ? "null" : typeof field?.Category,
        });
      }
      if (type === "yap") inspectYapFieldSchemaRules(field, group, index, errors);
      if (type === "yap" && typeof field?.FieldName === "string" && field.FieldName !== "Title" && isIntegerLike(field?.FieldIndex)) {
        const match = field.FieldName.match(/(\d+)$/);
        if (!match || Number.parseInt(match[1], 10) !== Number(field.FieldIndex)) {
          errors.push({
            scope: "decodedResource.Data",
            path: `${group.path}[${index}].FieldName`,
            code: "FIELD_NAME_SUFFIX_INDEX_MISMATCH",
            message: "FieldName trailing digits must equal FieldIndex.",
            list: group.list,
            field: field.DisplayName || field.FieldName || field.InternalName || null,
            fieldName: field.FieldName,
            fieldIndex: field.FieldIndex,
          });
        }
      }
    });
  }
  return errors;
}

function pushDuplicate(errors, code, message, seen, value, detail) {
  const key = String(value);
  const previous = seen.get(key);
  if (previous) {
    errors.push({
      scope: "decodedResource.Data",
      code,
      message,
      value,
      previousPath: previous.path,
      ...detail,
    });
  } else {
    seen.set(key, detail);
  }
}

function inspectYapIds(data) {
  const errors = [];
  const listIds = new Map();
  const fieldIds = new Map();
  const layoutIds = new Map();
  const resourceIds = new Map();
  const idKeys = new Set(["AppID", "ListID", "FieldID", "LayoutID", "ID", "RefId", "ReportID", "ProcModelID", "ResourceID"]);
  const assertSafeIntegerId = (value, path) => {
    if (value === undefined || value === null || value === "") return;
    if (typeof value === "string" && LARGE_INTEGER_RE.test(value)) return;
    if (!Number.isInteger(value)) {
      errors.push({
        scope: "decodedResource.Data",
        path,
        code: "INVALID_ID_TYPE",
        message: "Generated YAP ID values must be JSON integers.",
        actualType: Array.isArray(value) ? "array" : value === null ? "null" : typeof value,
      });
    } else if (!Number.isSafeInteger(value)) {
      errors.push({
        scope: "decodedResource.Data",
        path,
        code: "UNSAFE_INTEGER_ID",
        message: "Generated YAP integer IDs parsed as JavaScript numbers must be within Number.MAX_SAFE_INTEGER; preserve API-issued 64-bit IDs as raw JSON integer tokens during parsing.",
        value,
      });
    }
  };
  const walk = (value, path = "$") => {
    if (Array.isArray(value)) value.forEach((child, index) => walk(child, `${path}[${index}]`));
    else if (isObject(value)) {
      for (const [key, child] of Object.entries(value)) {
        const childPath = `${path}.${key}`;
        if (idKeys.has(key)) assertSafeIntegerId(child, childPath);
        walk(child, childPath);
      }
    }
  };
  walk(data);

  const items = [];
  if (data?.Item) items.push({ item: data.Item, path: "$.Item", title: data.Item.ListModel?.Title || "root" });
  (data?.Childs || []).forEach((child, index) => items.push({ item: child, path: `$.Childs[${index}]`, title: child.ListModel?.Title || null }));
  for (const { item, path: itemPath, title } of items) {
    const listId = item?.ListModel?.ListID;
    const appId = item?.ListModel?.AppID;
    if (appId !== undefined && String(appId) !== "41") {
      errors.push({
        scope: "decodedResource.Data",
        path: `${itemPath}.ListModel.AppID`,
        code: "LISTMODEL_APPID_NOT_FIXED_41",
        message: "Generated YAP ListModel.AppID must stay fixed at 41; use API-issued IDs for list/field/layout IDs only.",
        list: title,
        appId,
      });
    }
    if (listId !== undefined) {
      assertSafeIntegerId(listId, `${itemPath}.ListModel.ListID`);
      pushDuplicate(errors, "DUPLICATE_LIST_ID", "ListID values must be globally unique across generated ListExportItem resources.", listIds, listId, { path: `${itemPath}.ListModel.ListID`, list: title });
    }
    const fieldIndexes = new Map();
    const fieldNames = new Map();
    const internalNames = new Map();
    const displayNames = new Map();
    (item?.Defs || []).forEach((field, index) => {
      const fieldPath = `${itemPath}.Defs[${index}]`;
      const fieldLabel = field?.DisplayName || field?.FieldName || field?.InternalName || null;
      if (field?.FieldID !== undefined) {
        assertSafeIntegerId(field.FieldID, `${fieldPath}.FieldID`);
        pushDuplicate(errors, "DUPLICATE_FIELD_ID", "FieldID values must be globally unique in generated packages.", fieldIds, field.FieldID, { path: `${fieldPath}.FieldID`, list: title, field: fieldLabel });
      }
      if (field?.FieldIndex !== undefined) {
        assertSafeIntegerId(field.FieldIndex, `${fieldPath}.FieldIndex`);
        const indexKey = `${field?.FieldType || ""}:${field.FieldIndex}`;
        pushDuplicate(errors, "DUPLICATE_FIELD_INDEX", "FieldIndex values must be unique within each FieldType family in a list.", fieldIndexes, indexKey, { path: `${fieldPath}.FieldIndex`, list: title, field: fieldLabel, fieldIndex: field.FieldIndex, fieldType: field?.FieldType || null });
      }
      if (field?.FieldName) pushDuplicate(errors, "DUPLICATE_FIELD_NAME", "FieldName values must be unique within a list.", fieldNames, field.FieldName, { path: `${fieldPath}.FieldName`, list: title, field: fieldLabel });
      if (field?.InternalName) pushDuplicate(errors, "DUPLICATE_INTERNAL_NAME", "InternalName values must be unique within a list.", internalNames, field.InternalName, { path: `${fieldPath}.InternalName`, list: title, field: fieldLabel });
      if (field?.DisplayName) pushDuplicate(errors, "DUPLICATE_DISPLAY_NAME", "DisplayName values should be unique within a generated list.", displayNames, field.DisplayName, { path: `${fieldPath}.DisplayName`, list: title, field: fieldLabel });
    });
    (item?.Layouts || []).forEach((layout, index) => {
      const layoutPath = `${itemPath}.Layouts[${index}]`;
      const layoutLabel = layout?.Title || null;
      if (layout?.LayoutID !== undefined) {
        assertSafeIntegerId(layout.LayoutID, `${layoutPath}.LayoutID`);
        pushDuplicate(errors, "DUPLICATE_LAYOUT_ID", "LayoutID values must be globally unique across all ListExportItem.Layouts.", layoutIds, layout.LayoutID, { path: `${layoutPath}.LayoutID`, list: title, layout: layoutLabel });
      }
      (layout?.LayoutInResources || []).forEach((resource, resourceIndex) => {
        if (resource?.ID !== undefined) {
          assertSafeIntegerId(resource.ID, `${layoutPath}.LayoutInResources[${resourceIndex}].ID`);
          pushDuplicate(errors, "DUPLICATE_RESOURCE_ID", "LayoutInResources ID values must be globally unique across layout resources.", resourceIds, resource.ID, { path: `${layoutPath}.LayoutInResources[${resourceIndex}].ID`, list: title, layout: layoutLabel });
        }
        if (resource?.RefId !== undefined) assertSafeIntegerId(resource.RefId, `${layoutPath}.LayoutInResources[${resourceIndex}].RefId`);
      });
    });
  }
  return errors;
}

function inspectYapkIds(decoded) {
  const errors = [];
  const listIds = new Map();
  const fieldIds = new Map();
  const layoutIds = new Map();
  const resourceIds = new Map();
  const assertSafeIntegerId = (value, path) => {
    if (value === undefined || value === null || value === "") return;
    if (typeof value === "string" && LARGE_INTEGER_RE.test(value)) return;
    if (!Number.isInteger(value)) {
      errors.push({
        scope: "decodedResource",
        path,
        code: "INVALID_ID_TYPE",
        message: "Generated YAPK ID values marked as integer must be JSON integers or preserved raw large integer tokens.",
        actualType: Array.isArray(value) ? "array" : value === null ? "null" : typeof value,
      });
    } else if (!Number.isSafeInteger(value)) {
      errors.push({
        scope: "decodedResource",
        path,
        code: "UNSAFE_INTEGER_ID",
        message: "Generated YAPK integer IDs parsed as JavaScript numbers must be within Number.MAX_SAFE_INTEGER; preserve API-issued 64-bit IDs as raw JSON integer tokens during parsing.",
        value,
      });
    }
  };
  const pushDuplicate = (code, message, seen, value, detail) => {
    const key = String(value);
    const previous = seen.get(key);
    if (previous) errors.push({ scope: "decodedResource", code, message, value, previousPath: previous.path, ...detail });
    else seen.set(key, detail);
  };
  if (decoded?.MainListType !== undefined || decoded?.Data !== undefined) {
    errors.push({
      scope: "decodedResource",
      path: "$.Resource",
      code: "YAPK_RESOURCE_NOT_APP_PACKAGE_INFO",
      message: "Decoded YAPK Resource must be AppPackageInfo, not YAP ListExportResult/ListExportInfo.",
    });
    return errors;
  }
  const rootListId = decoded?.ListSet?.ListID;
  if (rootListId !== undefined) {
    assertSafeIntegerId(rootListId, "$.ListSet.ListID");
    pushDuplicate("DUPLICATE_LIST_ID", "ListID values must be globally unique across generated YAPK resources.", listIds, rootListId, { path: "$.ListSet.ListID", list: decoded?.ListSet?.Title || "root" });
  }
  for (const [index, layout] of asArray(decoded?.Pages).entries()) {
    const layoutPath = `$.Pages[${index}]`;
    if (layout?.ListID !== undefined) assertSafeIntegerId(layout.ListID, `${layoutPath}.ListID`);
    if (layout?.LayoutID !== undefined) {
      if (typeof layout.LayoutID !== "string" || !/^\d+$/.test(layout.LayoutID)) {
        errors.push({ scope: "decodedResource", path: `${layoutPath}.LayoutID`, code: "INVALID_ID_TYPE", message: "YAPK LayoutID must be LongAsString." });
      }
      pushDuplicate("DUPLICATE_LAYOUT_ID", "LayoutID values must be globally unique across generated YAPK layouts.", layoutIds, layout.LayoutID, { path: `${layoutPath}.LayoutID`, layout: layout.Title || null });
    }
    for (const [resourceIndex, resource] of asArray(layout?.LayoutInResources).entries()) {
      if (resource?.ID !== undefined) {
        assertSafeIntegerId(resource.ID, `${layoutPath}.LayoutInResources[${resourceIndex}].ID`);
        pushDuplicate("DUPLICATE_RESOURCE_ID", "LayoutInResources ID values must be globally unique.", resourceIds, resource.ID, { path: `${layoutPath}.LayoutInResources[${resourceIndex}].ID`, layout: layout.Title || null });
      }
      if (resource?.RefId !== undefined) assertSafeIntegerId(resource.RefId, `${layoutPath}.LayoutInResources[${resourceIndex}].RefId`);
    }
  }
  for (const [childIndex, child] of asArray(decoded?.Childs).entries()) {
    const childPath = `$.Childs[${childIndex}]`;
    if ("Defs" in child) errors.push({ scope: "decodedResource", path: `${childPath}.Defs`, code: "YAPK_CHILDS_USES_DEFS", message: "YAPK Childs items must use Fields, not YAP Defs." });
    const listId = child?.List?.ListID;
    const title = child?.List?.Title || null;
    if (listId !== undefined) {
      assertSafeIntegerId(listId, `${childPath}.List.ListID`);
      pushDuplicate("DUPLICATE_LIST_ID", "ListID values must be globally unique across generated YAPK resources.", listIds, listId, { path: `${childPath}.List.ListID`, list: title });
    }
    const fieldIndexes = new Map();
    const fieldNames = new Map();
    const internalNames = new Map();
    for (const [fieldIndex, field] of asArray(child?.Fields).entries()) {
      const fieldPath = `${childPath}.Fields[${fieldIndex}]`;
      const fieldLabel = field?.DisplayName || field?.FieldName || field?.InternalName || null;
      if (field?.ListID !== undefined) assertSafeIntegerId(field.ListID, `${fieldPath}.ListID`);
      if (field?.FieldID !== undefined) {
        assertSafeIntegerId(field.FieldID, `${fieldPath}.FieldID`);
        pushDuplicate("DUPLICATE_FIELD_ID", "FieldID values must be globally unique in generated YAPK packages.", fieldIds, field.FieldID, { path: `${fieldPath}.FieldID`, list: title, field: fieldLabel });
      }
      if (field?.FieldIndex !== undefined) {
        const indexKey = `${field?.FieldType || ""}:${field.FieldIndex}`;
        pushDuplicate("DUPLICATE_FIELD_INDEX", "FieldIndex values must be unique within each FieldType family in a list.", fieldIndexes, indexKey, { path: `${fieldPath}.FieldIndex`, list: title, field: fieldLabel, fieldIndex: field.FieldIndex, fieldType: field?.FieldType || null });
      }
      if (field?.FieldName) pushDuplicate("DUPLICATE_FIELD_NAME", "FieldName values must be unique within a list.", fieldNames, field.FieldName, { path: `${fieldPath}.FieldName`, list: title, field: fieldLabel });
      if (field?.InternalName) pushDuplicate("DUPLICATE_INTERNAL_NAME", "InternalName values must be unique within a list.", internalNames, field.InternalName, { path: `${fieldPath}.InternalName`, list: title, field: fieldLabel });
    }
    for (const [layoutIndex, layout] of asArray(child?.Layouts).entries()) {
      const layoutPath = `${childPath}.Layouts[${layoutIndex}]`;
      if (layout?.ListID !== undefined) assertSafeIntegerId(layout.ListID, `${layoutPath}.ListID`);
      if (layout?.LayoutID !== undefined) {
        if (typeof layout.LayoutID !== "string" || !/^\d+$/.test(layout.LayoutID)) {
          errors.push({ scope: "decodedResource", path: `${layoutPath}.LayoutID`, code: "INVALID_ID_TYPE", message: "YAPK LayoutID must be LongAsString." });
        }
        pushDuplicate("DUPLICATE_LAYOUT_ID", "LayoutID values must be globally unique across generated YAPK layouts.", layoutIds, layout.LayoutID, { path: `${layoutPath}.LayoutID`, list: title, layout: layout.Title || null });
      }
    }
  }
  return errors;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function summarizeDecoded(decoded, type) {
  if (type === "yap") {
    const data = isObject(decoded) && "Data" in decoded ? (typeof decoded.Data === "string" ? safeParseJson(decoded.Data) : decoded.Data) : decoded;
    return {
      decodedType: isObject(decoded) && "Data" in decoded ? "ListExportResult" : "ListExportInfo",
      dataShape: typeof decoded?.Data === "string" ? "json-string" : isObject(decoded?.Data) ? "object" : null,
      childLists: Array.isArray(data?.Childs) ? data.Childs.length : 0,
      fields: Array.isArray(data?.Childs) ? data.Childs.reduce((total, child) => total + (Array.isArray(child?.Defs) ? child.Defs.length : 0), 0) : 0,
      layouts: Array.isArray(data?.Childs) ? data.Childs.reduce((total, child) => total + (Array.isArray(child?.Layouts) ? child.Layouts.length : 0), Array.isArray(data?.Item?.Layouts) ? data.Item.Layouts.length : 0) : 0,
    };
  }
  return {
    decodedType: "AppPackageInfo",
    childLists: Array.isArray(decoded.Childs) ? decoded.Childs.length : 0,
    pages: Array.isArray(decoded.Pages) ? decoded.Pages.length : 0,
    forms: Array.isArray(decoded.Forms) ? decoded.Forms.length : 0,
  };
}

function normalizeYapkDecodedForSchema(decoded) {
  if (!isObject(decoded)) return decoded;
  const normalized = structuredClone(decoded);
  for (const page of asArray(normalized.Pages)) {
    if (page.LayoutView === null) page.LayoutView = "";
  }
  for (const child of asArray(normalized.Childs)) {
    if (child?.List?.LayoutView === null) child.List.LayoutView = "";
    if (Number(child?.List?.Type) !== 16) continue;

    // The canonical ListFieldInfo schema models normal Data List fields. Native
    // Document Library support fields are system-managed and include Bigint
    // storage. Project only the Type 16 fields into the closest schema family
    // for this generic schema gate; dedicated package validation still checks
    // the original export-shaped Document Library fields without mutation.
    for (const field of asArray(child.Fields)) {
      if (!isObject(field) || field.FieldName === "Title") continue;
      field.IsSystem = false;
      const bigintMatch = String(field.FieldName || "").match(/^Bigint(\d+)$/);
      if (field.FieldType === "Bigint" && bigintMatch) {
        field.FieldType = "Decimal";
        field.FieldName = `Decimal${bigintMatch[1]}`;
        if (String(field.InternalName || "").match(/^Bigint\d+$/)) field.InternalName = field.FieldName;
      }
    }
  }
  return normalized;
}

function normalizeYapDecodedForSchema(decoded) {
  if (!isObject(decoded)) return decoded;
  const normalized = structuredClone(decoded);
  if (normalized.SimplePortal === null) normalized.SimplePortal = {};
  return normalized;
}

function normalizeYapDataForSchema(data) {
  if (!isObject(data)) return data;
  const normalized = structuredClone(data);
  if (normalized.PortalInfo === null) normalized.PortalInfo = {};
  return normalized;
}

function inspectYapkPortalInfo(decoded) {
  const errors = [];
  if (!isObject(decoded)) return errors;
  if (isObject(decoded.PortalInfo) && Object.keys(decoded.PortalInfo).length === 0) {
    errors.push({
      scope: "decodedResource",
      path: "$.PortalInfo",
      code: "YAPK_PORTALINFO_EMPTY_OBJECT_INVALID",
      message: "The product YAPK schema requires complete portal metadata; do not emit an empty PortalInfo object.",
    });
  } else if (Array.isArray(decoded.PortalInfo)) {
    errors.push({
      scope: "decodedResource",
      path: "$.PortalInfo",
      code: "YAPK_PORTALINFO_ARRAY_INVALID",
      message: "The product YAPK schema requires PortalInfo to be an object with required portal metadata, not an array.",
      length: decoded.PortalInfo.length,
    });
  } else if (decoded.PortalInfo !== undefined && decoded.PortalInfo !== null && !isObject(decoded.PortalInfo)) {
    errors.push({
      scope: "decodedResource",
      path: "$.PortalInfo",
      code: "YAPK_PORTALINFO_INVALID",
      message: "PortalInfo must be an object when present.",
      actualType: typeof decoded.PortalInfo,
    });
  }
  return errors;
}

function decodeApprovalDefResource(raw, path) {
  const errors = [];
  if (typeof raw !== "string" || !raw.trim()) {
    return {
      decoded: null,
      errors: [{ scope: "decodedResource", path, code: "APPROVAL_DEFRESOURCE_MISSING", message: "Generated approval forms must include DefResource before signing." }],
    };
  }
  if (!/^Ojpicm90bGk6O[A-Za-z0-9+/]*={0,2}$/.test(raw)) {
    errors.push({ scope: "decodedResource", path, code: "APPROVAL_DEFRESOURCE_ENCODING_INVALID", message: "Approval DefResource must be base64(\"::brotli::\" + Brotli(JSON.stringify(ProcessDefResourceInfo)))." });
    return { decoded: null, errors };
  }
  const bytes = Buffer.from(raw, "base64");
  const prefix = Buffer.from("::brotli::", "utf8");
  if (bytes.length <= prefix.length || !bytes.subarray(0, prefix.length).equals(prefix)) {
    errors.push({ scope: "decodedResource", path, code: "APPROVAL_DEFRESOURCE_PREFIX_MISSING", message: "Approval DefResource decoded bytes must start with ::brotli::." });
    return { decoded: null, errors };
  }
  let text;
  try {
    text = zlib.brotliDecompressSync(bytes.subarray(prefix.length)).toString("utf8");
  } catch {
    errors.push({ scope: "decodedResource", path, code: "APPROVAL_DEFRESOURCE_BROTLI_DECODE_FAILED", message: "Approval DefResource payload after ::brotli:: must Brotli-decompress to JSON." });
    return { decoded: null, errors };
  }
  try {
    return { decoded: parseJsonPreservingLargeInts(text), errors };
  } catch {
    errors.push({ scope: "decodedResource", path, code: "APPROVAL_DEFRESOURCE_JSON_INVALID", message: "Decoded approval DefResource must parse as ProcessDefResourceInfo JSON." });
    return { decoded: null, errors };
  }
}

function nonZeroApiId(value) {
  const text = String(value ?? "");
  return /^\d{16,}$/.test(text) && !/^0+$/.test(text) && !/0000$/.test(text);
}

function inspectYapkStandardAdditions(decoded) {
  const errors = [];
  if (!isObject(decoded)) return errors;
  for (const [childIndex, child] of asArray(decoded.Childs).entries()) {
    if (isObject(child) && Object.prototype.hasOwnProperty.call(child, "ListDatas")) {
      errors.push({ scope: "decodedResource", path: `$.Childs[${childIndex}].ListDatas`, code: "YAPK_EMBEDDED_LISTDATAS_FORBIDDEN", message: "Generated YAPK AppPackageInfo must not embed sample rows in Childs[].ListDatas; create a companion seed artifact and seed only after explicit live-write approval." });
    }
    if (isObject(child?.List) && Object.prototype.hasOwnProperty.call(child.List, "ListDatas")) {
      errors.push({ scope: "decodedResource", path: `$.Childs[${childIndex}].List.ListDatas`, code: "YAPK_EMBEDDED_LISTDATAS_FORBIDDEN", message: "Generated YAPK AppPackageInfo must not embed sample rows in Childs[].List.ListDatas." });
    }
    if (isObject(child?.List) && Object.prototype.hasOwnProperty.call(child.List, "Items")) {
      const value = child.List.Items;
      const rowCount = Array.isArray(value) ? value.length : isObject(value) ? Object.keys(value).length : null;
      if (rowCount === null || rowCount > 0) {
        if (Number(child.List.Type) === 16) errors.push(...inspectDocumentLibraryFolderItems(child, childIndex));
        else errors.push({ scope: "decodedResource", path: `$.Childs[${childIndex}].List.Items`, code: "YAPK_EMBEDDED_LIST_ITEMS_FORBIDDEN", message: "Generated-final YAPK AppPackageInfo must not embed seed/sample rows in Childs[].List.Items. Only export-shaped structural folder rows are allowed for Type 16 Document Libraries." });
      }
    }
  }
  if (decoded.FormReports !== undefined && !Array.isArray(decoded.FormReports)) {
    errors.push({ scope: "decodedResource", path: "$.FormReports", code: "FORMREPORTS_LEGACY_INVALID", message: "Legacy AppPackageInfo.FormReports may be present for old packages, but it must be an array when present and is not required for generated YAPK apps." });
  }
  if (!Array.isArray(decoded.FormNewReports)) {
    errors.push({ scope: "decodedResource", path: "$.FormNewReports", code: "FORMNEWREPORTS_REQUIRED", message: "AppPackageInfo.FormNewReports is the current workflow report collection and must be present as an array, even when empty." });
  }
  if (asArray(decoded.FormReports).length > 0 && asArray(decoded.FormNewReports).length === 0) {
    errors.push({ scope: "decodedResource", path: "$.FormReports", code: "FORMREPORTS_LEGACY_NOT_CURRENT", message: "Workflow reports must be generated in FormNewReports. FormReports is legacy and cannot be the only workflow report collection." });
  }
  for (const [formIndex, form] of asArray(decoded.Forms).entries()) {
    if (String(form?.WorkflowType ?? form?.workflowType ?? "") !== "2") continue;
    const formPath = `$.Forms[${formIndex}]`;
    const deployed = form.Deployed === true || String(form.Deployed).toLowerCase() === "true";
    if (deployed) {
      for (const key of ["DefResourceID", "DeployedDefID"]) {
        if (!nonZeroApiId(form[key])) {
          errors.push({ scope: "decodedResource", path: `${formPath}.${key}`, code: `APPROVAL_${key.toUpperCase()}_API_ID_REQUIRED`, message: "Deployed generated approval definitions must use non-zero API-issued IDs." });
        }
      }
    }
    const result = decodeApprovalDefResource(form.DefResource, `${formPath}.DefResource`);
    errors.push(...result.errors);
    const def = result.decoded;
    if (!isObject(def)) continue;
    const pageIds = new Set();
    for (const [pageIndex, page] of asArray(def.pageurls).entries()) {
      const pagePath = `${formPath}.DefResource.pageurls[${pageIndex}]`;
      if (!page?.id) errors.push({ scope: "decodedResource", path: `${pagePath}.id`, code: "APPROVAL_PAGEURL_ID_MISSING", message: "Approval DefResource.pageurls[] entries must include id." });
      else pageIds.add(String(page.id));
      if (!isObject(page?.formdef)) errors.push({ scope: "decodedResource", path: `${pagePath}.formdef`, code: "APPROVAL_PAGEURL_FORMDEF_MISSING", message: "Approval DefResource.pageurls[] entries must include embedded formdef." });
      else if (String(page.formdef.id || "") !== String(page.id || "")) {
        errors.push({ scope: "decodedResource", path: `${pagePath}.formdef.id`, code: "APPROVAL_PAGE_FORMDEF_ID_MISMATCH", message: "Decoded pageurls[].formdef.id must match pageurls[].id so approval controls hydrate in designer." });
      }
    }
    const shapes = asArray(def.childshapes);
    const starts = shapes.filter((shape) => shape?.stencil?.id === "StartNoneEvent");
    const flows = shapes.filter((shape) => shape?.stencil?.id === "SequenceFlow");
    const nodes = shapes.filter((shape) => shape?.stencil?.id && shape.stencil.id !== "SequenceFlow");
    if (!shapes.length) errors.push({ scope: "decodedResource", path: `${formPath}.DefResource.childshapes`, code: "APPROVAL_WORKFLOW_CHILDSHAPES_MISSING", message: "Decoded approval DefResource.childshapes must include workflow stencils and sequence connectors." });
    if (!starts.length) errors.push({ scope: "decodedResource", path: `${formPath}.DefResource.childshapes`, code: "APPROVAL_WORKFLOW_START_NODE_MISSING", message: "Approval workflow childshapes must include a StartNoneEvent node." });
    if (!flows.length) errors.push({ scope: "decodedResource", path: `${formPath}.DefResource.childshapes`, code: "APPROVAL_WORKFLOW_SEQUENCE_CONNECTOR_MISSING", message: "Approval workflow childshapes must include SequenceFlow connectors from the Start node." });
    if (nodes.length < 2) errors.push({ scope: "decodedResource", path: `${formPath}.DefResource.childshapes`, code: "APPROVAL_WORKFLOW_TASK_OR_END_NODE_MISSING", message: "Approval workflow childshapes must include workflow nodes beyond Start so actions hydrate in designer." });
    const outgoing = new Set(starts.flatMap((shape) => asArray(shape.outgoing).map((item) => String(item.resourceid || item.id || "")).filter(Boolean)));
    if (starts.length && flows.length && !flows.some((flow) => outgoing.has(String(flow.resourceid || flow.id || "")))) {
      errors.push({ scope: "decodedResource", path: `${formPath}.DefResource.childshapes`, code: "APPROVAL_WORKFLOW_START_SEQUENCE_MISSING", message: "Approval workflow SequenceFlow connectors must be reachable from the Start node outgoing references." });
    }
    for (const [shapeIndex, shape] of shapes.entries()) {
      const taskurl = shape?.properties?.taskurl || shape?.properties?.taskUrl || shape?.properties?.TaskUrl;
      if (taskurl && !pageIds.has(String(taskurl))) {
        errors.push({ scope: "decodedResource", path: `${formPath}.DefResource.childshapes[${shapeIndex}].properties.taskurl`, code: "APPROVAL_WORKFLOW_TASKURL_PAGE_NOT_FOUND", message: "Workflow task URL references must resolve to decoded pageurls[].id." });
      }
    }
  }
  return errors;
}

function inspectDocumentLibraryFolderItems(child, childIndex) {
  const errors = [];
  const items = child?.List?.Items;
  const basePath = `$.Childs[${childIndex}].List.Items`;
  const push = (code, message, path, detail = {}) => errors.push({ scope: "decodedResource", path, code, message, ...detail });
  if (!isObject(items) || Array.isArray(items)) {
    push("DOCUMENT_LIBRARY_FOLDER_ITEMS_OBJECT_REQUIRED", "Type 16 Document Library folder rows must use a record-ID-keyed List.Items object.", basePath);
    return errors;
  }
  const fieldNames = new Set(asArray(child.Fields).map((field) => String(field?.FieldName || "")));
  const coreFields = new Set(["Title", "Bigint1", "Text1", "Bigint2", "Text2", "Text3"]);
  for (const [folderId, row] of Object.entries(items)) {
    const rowPath = `${basePath}[${folderId}]`;
    if (!/^\d{16,}$/.test(folderId)) push("DOCUMENT_LIBRARY_FOLDER_ROW_ID_INVALID", "Document Library folder object keys must be API-style numeric IDs.", rowPath);
    if (!isObject(row) || Array.isArray(row)) {
      push("DOCUMENT_LIBRARY_FOLDER_ROW_INVALID", "Document Library List.Items entries must be folder row objects.", rowPath);
      continue;
    }
    const title = String(row.Title || "").trim();
    if (!title) push("DOCUMENT_LIBRARY_FOLDER_TITLE_REQUIRED", "Document Library folder rows require a non-empty Title.", `${rowPath}.Title`);
    if (String(row.Bigint1 ?? "") !== "0") push("DOCUMENT_LIBRARY_FOLDER_PARENT_INVALID", "Generated-final Document Library folders are currently limited to root folders with Bigint1 = \"0\".", `${rowPath}.Bigint1`);
    if (String(row.Text1 ?? "") !== "folder") push("DOCUMENT_LIBRARY_FOLDER_TYPE_INVALID", "Document Library folder rows require Text1 = \"folder\".", `${rowPath}.Text1`);
    if (String(row.Bigint2 ?? "") !== "" || String(row.Text2 ?? "") !== "") push("DOCUMENT_LIBRARY_FOLDER_FILE_METADATA_INVALID", "Structural folder rows require blank Bigint2 and Text2 file metadata.", rowPath);
    if (title && String(row.Text3 ?? "") !== `0_${title.toLowerCase()}`) push("DOCUMENT_LIBRARY_FOLDER_UNIQUE_NAME_INVALID", "Root folder Text3 must equal 0_<lowercase folder title>.", `${rowPath}.Text3`);
    if (Object.prototype.hasOwnProperty.call(row, "Text4")) push("DOCUMENT_LIBRARY_FOLDER_UPLOAD_FORBIDDEN", "Structural folder rows must omit Text4 upload/file payload data.", `${rowPath}.Text4`);
    if (Object.prototype.hasOwnProperty.call(row, "ListDataID")) push("DOCUMENT_LIBRARY_FOLDER_LISTDATAID_FIELD_FORBIDDEN", "The folder ID belongs in the List.Items object key, not a ListDataID row property.", `${rowPath}.ListDataID`);
    for (const [fieldName, fieldValue] of Object.entries(row)) {
      if (!fieldNames.has(fieldName)) push("DOCUMENT_LIBRARY_FOLDER_FIELD_UNKNOWN", "Folder rows may only use fields declared by the target Document Library.", `${rowPath}.${fieldName}`, { fieldName });
      if (typeof fieldValue !== "string") push("DOCUMENT_LIBRARY_FOLDER_VALUE_NOT_STRING", "Document Library folder field values must serialize as strings.", `${rowPath}.${fieldName}`);
      if (!coreFields.has(fieldName) && String(fieldValue) !== "") push("DOCUMENT_LIBRARY_FOLDER_CUSTOM_VALUE_NOT_BLANK", "Structural folder rows may include custom fields only as blank export-shaped values.", `${rowPath}.${fieldName}`);
    }
  }
  return errors;
}

function safeParseJson(value) {
  try {
    return parseJsonPreservingLargeInts(value);
  } catch {
    return null;
  }
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h") || process.argv.length < 3) usage(process.argv.length < 3 ? 1 : 0);
  const input = process.argv[2];
  const type = path.extname(input).toLowerCase().replace(".", "");
  if (!["yap", "yapk"].includes(type)) throw new Error("Input must end with .yap or .yapk.");

  const schemaPath = resolveSchemaPath(type);
  const schema = readSchema(type, schemaPath);
  const wrapper = readJson(input);
  const wrapperErrors = validate(wrapper, schema, schema);
  let decoded;
  try {
    decoded = type === "yap" ? decodeYap(wrapper) : await decodeYapk(wrapper);
  } catch (error) {
    const errors = [...wrapperErrors.map((item) => ({ scope: "wrapper", ...item })), {
      scope: "decodedResource",
      path: "$.Resource",
      code: "decode",
      message: error.message,
    }];
    console.log(JSON.stringify({
      input: path.basename(input),
      schema: path.basename(schemaPath),
      status: "fail",
      errors: errors.length,
      summary: { decodedType: type === "yap" ? "ListExportInfo" : "AppPackageInfo", decoded: false },
      findings: errors.slice(0, 80),
      truncatedFindings: Math.max(0, errors.length - 80),
    }, null, 2));
    process.exitCode = 1;
    return;
  }
  const decodedRef = schema["x-decodedResourceSchema"] || (type === "yapk" && schema.$defs?.AppPackageInfo ? { $ref: "#/$defs/AppPackageInfo" } : undefined);
  const decodedForSchema = type === "yapk" ? normalizeYapkDecodedForSchema(decoded) : normalizeYapDecodedForSchema(decoded);
  const decodedErrors = validate(decodedForSchema, decodedRef, schema);
  let contentErrors = [];
  let categoryTarget = decoded;
  if (type === "yap") {
    const dataResult = decodedYapData(decoded, schema);
    contentErrors = dataResult.errors;
    categoryTarget = dataResult.data || {};
    if (dataResult.data) {
      const contentRef = schema.$defs?.ListExportInfo ? { $ref: "#/$defs/ListExportInfo" } : decodedRef;
      contentErrors = contentErrors.concat(validate(normalizeYapDataForSchema(dataResult.data), contentRef, schema).map((error) => ({ scope: "decodedResource.Data", ...error })));
    }
  }
  const schemaOnly = hasArg("--schema-only");
  const categoryErrors = schemaOnly ? [] : inspectFieldCategories(categoryTarget, type);
  const idErrors = schemaOnly ? [] : type === "yap" && categoryTarget ? inspectYapIds(categoryTarget) : type === "yapk" ? inspectYapkIds(decoded) : [];
  const portalErrors = schemaOnly ? [] : type === "yapk" ? inspectYapkPortalInfo(decoded) : [];
  const standardAdditionErrors = schemaOnly ? [] : type === "yapk" ? inspectYapkStandardAdditions(decoded) : [];
  const errors = [...wrapperErrors.map((error) => ({ scope: "wrapper", ...error })), ...decodedErrors.map((error) => ({ scope: "decodedResource", ...error })), ...contentErrors, ...categoryErrors, ...idErrors, ...portalErrors, ...standardAdditionErrors];

  console.log(JSON.stringify({
    input: path.basename(input),
    schema: path.basename(schemaPath),
    status: errors.length ? "fail" : "pass",
    errors: errors.length,
    summary: summarizeDecoded(decoded, type),
    findings: errors.slice(0, 80),
    truncatedFindings: Math.max(0, errors.length - 80),
  }, null, 2));
  if (errors.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "fail", error: error.message }, null, 2));
  process.exit(1);
});

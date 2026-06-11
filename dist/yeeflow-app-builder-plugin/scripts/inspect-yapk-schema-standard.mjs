#!/usr/bin/env node

import fs from "node:fs/promises";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const WRAPPER_REQUIRED = [
  "PackageId",
  "TenantID",
  "AppID",
  "ListID",
  "Title",
  "Description",
  "IconUrl",
  "Resource",
  "Notes",
  "Author",
  "Date",
  "Version",
  "Sign",
];
const APP_PACKAGE_REQUIRED = [
  "ListSet",
  "Pages",
  "Forms",
  "FormReports",
  "FormNewReports",
  "DataReports",
  "Groups",
  "Tags",
  "Metadatas",
  "Agents",
  "Connections",
  "Knowledges",
  "Themes",
  "Components",
  "PortalInfo",
  "Childs",
];
const EMPTY_PORTALINFO_IMPORT_ERROR = "YAPK_PORTALINFO_EMPTY_OBJECT_INVALID";
const ARRAY_PORTALINFO_IMPORT_ERROR = "YAPK_PORTALINFO_ARRAY_INVALID";
const LIST_PACKAGE_REQUIRED = ["List", "Fields", "Layouts", "RemindRules", "PublicForms", "FlowMappings"];
const LIST_TYPE_ENUM = new Set([1, 16, 32, 64, 128, 1024]);
const LIST_FLAGS_SHOW = 1;
const FIELD_TYPE_ENUM = new Set(["Text", "Bit", "Decimal", "Datetime"]);
const FIELD_CONTROL_TYPES = new Set([
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
  "mutiple-metadata",
  "location-picker",
  "flowstatus",
  "autonumber",
  "list",
]);
const INTERNAL_NAME_RE = /^[A-Za-z0-9_]+$/;
const FIELD_NAME_SUFFIX_RE = /(\d+)$/;
const UTC_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const NUMERIC_STRING_RE = /^\d+$/;
const LARGE_INTEGER_RE = /^-?\d{16,}$/;

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-yapk-schema-standard.mjs <package.yapk> [more.yapk ...]",
    "",
    "Prints redacted schema-standard inspection summaries for Yeeflow .yapk packages.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function add(findings, level, code, message, detail = {}) {
  findings.push({ level, code, message, detail });
}

async function readFileWithTimeout(file, timeoutMs = 2000) {
  let timeout;
  try {
    return await Promise.race([
      fs.readFile(file),
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`read timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

function parseWrapper(bytes, findings) {
  const text = bytes.toString("utf8").replace(/^\uFEFF/, "");
  try {
    return parseJsonPreservingLargeInts(text);
  } catch (error) {
    add(findings, "error", "YAPK_WRAPPER_JSON_INVALID", "Top-level .yapk JSON parse failed.", { error: error.message });
    return null;
  }
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

function decodeResource(resource, findings) {
  const attempts = [];
  if (typeof resource !== "string" || !resource) {
    add(findings, "error", "YAPK_RESOURCE_INVALID", "Resource must be a non-empty string.");
    return { attempts, decoded: null, decodedTextBytes: 0, resourceDecodedBytes: 0 };
  }

  const variants = [
    ["base64Bytes", Buffer.from(resource, "base64")],
    ["rawResourceUtf8Bytes", Buffer.from(resource, "utf8")],
    ["base64urlBytes", Buffer.from(resource.replace(/-/g, "+").replace(/_/g, "/"), "base64")],
  ];

  for (const [name, bytes] of variants) {
    try {
      const decompressed = zlib.brotliDecompressSync(bytes);
      const decoded = parseJsonPreservingLargeInts(decompressed.toString("utf8"));
      attempts.push({ name, brotli: true, json: true, inputBytes: bytes.length, decodedTextBytes: decompressed.length });
      return { attempts, decoded, decodedTextBytes: decompressed.length, resourceDecodedBytes: variants[0][1].length };
    } catch (error) {
      attempts.push({ name, brotli: false, inputBytes: bytes.length, errorClass: error.code || error.name || "DECODE_ERROR" });
      const tolerant = tolerantBrotliDecodeSync(bytes);
      if (tolerant.text) {
        try {
          const decoded = parseJsonPreservingLargeInts(tolerant.text);
          attempts.push({ name, brotli: "tolerant", json: true, inputBytes: bytes.length, decodedTextBytes: Buffer.byteLength(tolerant.text) });
          return { attempts, decoded, decodedTextBytes: Buffer.byteLength(tolerant.text), resourceDecodedBytes: variants[0][1].length };
        } catch (jsonError) {
          attempts.push({ name, brotli: "tolerant", json: false, inputBytes: bytes.length, errorClass: jsonError.name || "JSON_ERROR" });
        }
      }
    }
  }

  add(findings, "error", "YAPK_RESOURCE_BROTLI_DECODE_FAILED", "Resource did not Brotli-decompress to JSON with tested schema variants.");
  return { attempts, decoded: null, decodedTextBytes: 0, resourceDecodedBytes: variants[0][1].length };
}

function tolerantBrotliDecodeSync(bytes) {
  const script = `
    const zlib = require("zlib");
    const chunks = [];
    const stream = zlib.createBrotliDecompress();
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", () => {
      process.stdout.write(Buffer.concat(chunks).toString("base64"));
    });
    stream.on("end", () => {
      process.stdout.write(Buffer.concat(chunks).toString("base64"));
    });
    stream.end(Buffer.from(process.argv[1], "base64"));
  `;
  const result = spawnSync(process.execPath, ["-e", script, bytes.toString("base64")], {
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  });
  if (result.status !== 0 || !result.stdout) return { text: "" };
  return { text: Buffer.from(result.stdout, "base64").toString("utf8") };
}

function inspectWrapper(wrapper, findings) {
  if (!isObject(wrapper)) {
    add(findings, "error", "YAPK_WRAPPER_NOT_OBJECT", "Top-level .yapk value must be an object.");
    return;
  }
  for (const key of WRAPPER_REQUIRED) {
    if (!(key in wrapper)) add(findings, "error", "YAPK_REQUIRED_KEY_MISSING", "Top-level .yapk wrapper is missing a schema-required key.", { key });
  }
  if (typeof wrapper.TenantID !== "string" || !NUMERIC_STRING_RE.test(wrapper.TenantID)) {
    add(findings, "error", "YAPK_TENANT_ID_INVALID", "TenantID should be a numeric string.");
  }
  if (typeof wrapper.ListID !== "string" || !NUMERIC_STRING_RE.test(wrapper.ListID)) {
    add(findings, "error", "YAPK_LIST_ID_INVALID", "ListID should be a numeric string.");
  }
  if (!["30", "41"].includes(String(wrapper.AppID))) {
    add(findings, "error", "YAPK_APPID_UNSUPPORTED", "Generated YAPK wrapper AppID must be one of the product schema supported values: 30 or 41.", { value: wrapper.AppID ?? null });
  }
  if (typeof wrapper.Date !== "string" || !UTC_DATE_RE.test(wrapper.Date)) {
    add(findings, "error", "YAPK_DATE_FORMAT_INVALID", "Date should be UTC yyyy-MM-ddTHH:mm:ssZ.");
  }
  if (String(wrapper.Resource || "").startsWith("[______gizp______]")) {
    add(findings, "error", "YAPK_RESOURCE_USES_YAP_GZIP_PREFIX", ".yapk Resource must not use .yap gzip prefix.");
  }
}

function inspectField(field, path, findings, summary) {
  if (!isObject(field)) {
    add(findings, "error", "YAPK_FIELD_NOT_OBJECT", "List field entry must be an object.", { path });
    return;
  }
  summary.fieldCount += 1;
  if (!Number.isInteger(field.Category)) {
    add(findings, "error", "FIELD_CATEGORY_NOT_INT", "Field.Category must be an integer for generated YAPK packages.", {
      path: `${path}.Category`,
      field: field.DisplayName || field.FieldName || field.InternalName || null,
      actualType: field.Category === undefined ? "missing" : Array.isArray(field.Category) ? "array" : field.Category === null ? "null" : typeof field.Category,
    });
  }
  const fieldName = String(field.FieldName || "");
  const match = fieldName.match(FIELD_NAME_SUFFIX_RE);
  if (!match && fieldName !== "Title") add(findings, "error", "YAPK_FIELD_NAME_SUFFIX_MISSING", "FieldName must end with digits, except the built-in Title field.", { path: `${path}.FieldName` });
  else if (match && String(field.FieldIndex ?? "") !== match[1]) {
    add(findings, "error", "YAPK_FIELD_NAME_SUFFIX_INDEX_MISMATCH", "FieldName trailing digits must equal FieldIndex.", { path: `${path}.FieldName` });
  }
  if (typeof field.InternalName !== "string" || !INTERNAL_NAME_RE.test(field.InternalName)) {
    add(findings, "error", "YAPK_FIELD_INTERNAL_NAME_INVALID", "InternalName must match ^[a-zA-Z0-9_]+$.", { path: `${path}.InternalName` });
  }
  if (field.FieldType !== undefined && !FIELD_TYPE_ENUM.has(field.FieldType)) {
    add(findings, "error", "YAPK_FIELD_TYPE_INVALID", "FieldType is outside product schema enum.", { path: `${path}.FieldType` });
  }
  if (field.Type !== undefined && !FIELD_CONTROL_TYPES.has(field.Type)) {
    add(findings, "warning", "YAPK_FIELD_CONTROL_TYPE_UNKNOWN", "Field Type is not in the product schema known control-type list.", { path: `${path}.Type` });
  }
}

function inspectListPackage(pkg, path, findings, summary) {
  if (!isObject(pkg)) {
    add(findings, "error", "YAPK_LIST_PACKAGE_NOT_OBJECT", "ListPackageInfo must be an object.", { path });
    return;
  }
  summary.childCount += 1;
  for (const key of LIST_PACKAGE_REQUIRED) {
    if (!(key in pkg)) add(findings, "error", "YAPK_LIST_PACKAGE_KEY_MISSING", "ListPackageInfo is missing a schema-required key.", { path: `${path}.${key}` });
  }
  if ("Defs" in pkg) add(findings, "error", "YAPK_CHILDS_USES_DEFS", "YAPK Childs items must use Fields, not YAP Defs.", { path: `${path}.Defs` });
  const list = pkg.List;
  if (isObject(list)) {
    if (list.Type !== undefined && !LIST_TYPE_ENUM.has(Number(list.Type))) {
      add(findings, "error", "YAPK_LIST_TYPE_INVALID", "List.Type is outside product schema enum.", { path: `${path}.List.Type` });
    }
    if (list.Flags !== undefined && (Number(list.Flags) & LIST_FLAGS_SHOW) !== LIST_FLAGS_SHOW) {
      add(findings, "error", "YAPK_LIST_FLAGS_SHOW_MISSING", "List.Flags should include Show = 1.", { path: `${path}.List.Flags` });
    }
  } else add(findings, "error", "YAPK_LIST_INFO_MISSING", "ListPackageInfo.List must be an object.", { path: `${path}.List` });

  for (const [index, field] of asArray(pkg.Fields).entries()) inspectField(field, `${path}.Fields[${index}]`, findings, summary);
  summary.layoutCount += asArray(pkg.Layouts).length;
}

function inspectGeneratedIds(decoded, findings) {
  const listIds = new Map();
  const fieldIds = new Map();
  const layoutIds = new Map();
  const resourceIds = new Map();
  const safeId = (value, path, longAsString = false) => {
    if (value === undefined || value === null || value === "") return;
    if (longAsString) {
      if (typeof value !== "string" || !NUMERIC_STRING_RE.test(value)) add(findings, "error", "INVALID_ID_TYPE", "YAPK LongAsString ID must be a numeric string.", { path });
      return;
    }
    if (typeof value === "string" && /^\d{16,}$/.test(value)) return;
    if (!Number.isInteger(value)) add(findings, "error", "INVALID_ID_TYPE", "YAPK integer ID must be a JSON integer or preserved raw large integer token.", { path });
    else if (!Number.isSafeInteger(value)) add(findings, "error", "UNSAFE_INTEGER_ID", "YAPK integer ID was parsed as an unsafe JavaScript number; preserve 64-bit IDs without rounding.", { path, value });
  };
  const duplicate = (seen, value, code, message, detail) => {
    const key = String(value || "");
    if (!key) return;
    const previous = seen.get(key);
    if (previous) add(findings, "error", code, message, { value: key, previousPath: previous.path, ...detail });
    else seen.set(key, detail);
  };
  safeId(decoded.ListSet?.ListID, "ListSet.ListID");
  duplicate(listIds, decoded.ListSet?.ListID, "DUPLICATE_LIST_ID", "ListID values must be globally unique.", { path: "ListSet.ListID", list: decoded.ListSet?.Title || "root" });
  for (const [index, page] of asArray(decoded.Pages).entries()) {
    safeId(page.ListID, `Pages[${index}].ListID`);
    safeId(page.LayoutID, `Pages[${index}].LayoutID`, true);
    duplicate(layoutIds, page.LayoutID, "DUPLICATE_LAYOUT_ID", "LayoutID values must be globally unique.", { path: `Pages[${index}].LayoutID`, layout: page.Title || null });
    for (const [resourceIndex, resource] of asArray(page.LayoutInResources).entries()) {
      safeId(resource.ID, `Pages[${index}].LayoutInResources[${resourceIndex}].ID`);
      safeId(resource.RefId, `Pages[${index}].LayoutInResources[${resourceIndex}].RefId`);
      duplicate(resourceIds, resource.ID, "DUPLICATE_RESOURCE_ID", "LayoutInResources ID values must be globally unique.", { path: `Pages[${index}].LayoutInResources[${resourceIndex}].ID` });
    }
  }
  for (const [childIndex, child] of asArray(decoded.Childs).entries()) {
    const title = child.List?.Title || null;
    safeId(child.List?.ListID, `Childs[${childIndex}].List.ListID`);
    duplicate(listIds, child.List?.ListID, "DUPLICATE_LIST_ID", "ListID values must be globally unique.", { path: `Childs[${childIndex}].List.ListID`, list: title });
    for (const [fieldIndex, field] of asArray(child.Fields).entries()) {
      safeId(field.ListID, `Childs[${childIndex}].Fields[${fieldIndex}].ListID`);
      safeId(field.FieldID, `Childs[${childIndex}].Fields[${fieldIndex}].FieldID`);
      duplicate(fieldIds, field.FieldID, "DUPLICATE_FIELD_ID", "FieldID values must be globally unique.", { path: `Childs[${childIndex}].Fields[${fieldIndex}].FieldID`, list: title, field: field.DisplayName || field.FieldName || null });
    }
    for (const [layoutIndex, layout] of asArray(child.Layouts).entries()) {
      safeId(layout.ListID, `Childs[${childIndex}].Layouts[${layoutIndex}].ListID`);
      safeId(layout.LayoutID, `Childs[${childIndex}].Layouts[${layoutIndex}].LayoutID`, true);
      duplicate(layoutIds, layout.LayoutID, "DUPLICATE_LAYOUT_ID", "LayoutID values must be globally unique.", { path: `Childs[${childIndex}].Layouts[${layoutIndex}].LayoutID`, list: title, layout: layout.Title || null });
    }
  }
}

function fieldsByList(decoded) {
  const fields = new Map();
  for (const child of asArray(decoded.Childs)) {
    const listId = String(child.List?.ListID || "");
    if (!listId) continue;
    const names = new Set();
    for (const field of asArray(child.Fields)) {
      for (const candidate of [field.FieldName, field.InternalName, field.DisplayName, field.FieldID].filter(Boolean)) names.add(String(candidate));
    }
    fields.set(listId, names);
  }
  return fields;
}

function walkControls(node, visitor) {
  if (!node || typeof node !== "object") return;
  visitor(node);
  for (const child of asArray(node.children)) walkControls(child, visitor);
}

function inspectDashboardDataTables(decoded, findings) {
  const maps = fieldsByList(decoded);
  for (const [pageIndex, page] of asArray(decoded.Pages).entries()) {
    for (const [resourceIndex, resource] of asArray(page.LayoutInResources).entries()) {
      if (typeof resource.Resource !== "string" || !resource.Resource.trim()) continue;
      let parsed;
      try {
        parsed = JSON.parse(resource.Resource);
      } catch {
        continue;
      }
      walkControls(parsed, (control) => {
        if (control?.type !== "data-list") return;
        const pointer = `Pages[${pageIndex}].LayoutInResources[${resourceIndex}].Resource`;
        const listRef = control.attrs?.data?.list || {};
        for (const key of ["AppID", "ListID", "Type", "Title", "ListSetID"]) {
          if (listRef[key] === undefined || listRef[key] === null || String(listRef[key]) === "") add(findings, "error", "YAPK_DASHBOARD_DATA_TABLE_SOURCE_KEY_MISSING", "Dashboard Data table attrs.data.list must include AppID, ListID, Type, Title, and ListSetID.", { path: `${pointer}.attrs.data.list.${key}`, key });
        }
        const listId = String(listRef.ListID || "");
        const sourceFields = maps.get(listId);
        for (const [columnIndex, column] of asArray(control.attrs?.listarr).entries()) {
          const field = column?.Field === undefined || column?.Field === null ? "" : String(column.Field);
          if (!field) add(findings, "error", "DASHBOARD_DATA_TABLE_DISPLAY_FIELD_BINDING_MISSING", "Dashboard Data table display columns must include Field source bindings; FieldName is only the visible label.", { path: `${pointer}.attrs.listarr[${columnIndex}]`, listId });
          else if (sourceFields && !sourceFields.has(field)) add(findings, "error", "DASHBOARD_DATA_TABLE_DISPLAY_FIELD_UNRESOLVED", "Dashboard Data table Field binding must resolve to the source list.", { path: `${pointer}.attrs.listarr[${columnIndex}].Field`, listId, field });
        }
      });
    }
  }
}

function inspectNoRule(form, path, findings, summary) {
  if (!isObject(form)) return;
  summary.formCount += 1;
  if (form.NoRule === undefined || form.NoRule === null) return;
  if (!isObject(form.NoRule)) {
    add(findings, "error", "YAPK_FORM_NORULE_NOT_OBJECT", "NoRule must be an object when present.", { path: `${path}.NoRule` });
    return;
  }
  summary.noRuleCount += 1;
  for (const key of ["Prefix", "StartIndex", "CustomLength", "AutoIncrement"]) {
    if (!(key in form.NoRule)) add(findings, "error", "YAPK_FORM_NORULE_KEY_MISSING", "NoRule is missing a schema-required key.", { path: `${path}.NoRule.${key}` });
  }
  if (typeof form.NoRule.Prefix !== "string" || !form.NoRule.Prefix.includes("{index}")) {
    add(findings, "error", "YAPK_FORM_NORULE_PREFIX_INDEX_MISSING", "NoRule.Prefix must contain {index}.", { path: `${path}.NoRule.Prefix` });
  }
}

function inspectAppPackage(decoded, findings) {
  const summary = {
    decodedTopLevelKeys: isObject(decoded) ? Object.keys(decoded) : [],
    pages: 0,
    forms: 0,
    formReports: 0,
    formNewReports: 0,
    dataReports: 0,
    groups: 0,
    tags: 0,
    metadatas: 0,
    agents: 0,
    connections: 0,
    knowledges: 0,
    themes: 0,
    components: 0,
    childCount: 0,
    fieldCount: 0,
    layoutCount: 0,
    noRuleCount: 0,
  };
  if (!isObject(decoded)) {
    add(findings, "error", "YAPK_APP_PACKAGE_NOT_OBJECT", "Decoded Resource must be AppPackageInfo object.");
    return summary;
  }
  if ("MainListType" in decoded || "Data" in decoded || "Item" in decoded) {
    add(findings, "error", "YAPK_RESOURCE_NOT_APP_PACKAGE_INFO", "Decoded YAPK Resource must be AppPackageInfo, not YAP ListExportResult/ListExportInfo.");
    return summary;
  }
  for (const key of APP_PACKAGE_REQUIRED) {
    if (!(key in decoded)) add(findings, "error", "YAPK_APP_PACKAGE_KEY_MISSING", "Decoded AppPackageInfo is missing a schema-required key.", { key });
  }
  if (isObject(decoded.PortalInfo) && Object.keys(decoded.PortalInfo).length === 0) {
    add(findings, "error", EMPTY_PORTALINFO_IMPORT_ERROR, "Product import feedback requires PortalInfo to be null when no portal is included; do not emit an empty object.", { path: "PortalInfo" });
  }
  if (Array.isArray(decoded.PortalInfo)) {
    add(findings, "error", ARRAY_PORTALINFO_IMPORT_ERROR, "Product import feedback requires PortalInfo to be null when no portal is included; do not emit an array.", { path: "PortalInfo", length: decoded.PortalInfo.length });
  }
  if (decoded.PortalInfo !== undefined && decoded.PortalInfo !== null && !Array.isArray(decoded.PortalInfo) && !isObject(decoded.PortalInfo)) {
    add(findings, "error", "YAPK_PORTALINFO_INVALID", "PortalInfo must be null for no portal or a portal object when a portal is included.", { path: "PortalInfo", actualType: typeof decoded.PortalInfo });
  }
  summary.pages = asArray(decoded.Pages).length;
  summary.formReports = asArray(decoded.FormReports).length;
  summary.formNewReports = asArray(decoded.FormNewReports).length;
  summary.dataReports = asArray(decoded.DataReports).length;
  summary.groups = asArray(decoded.Groups).length;
  summary.tags = asArray(decoded.Tags).length;
  summary.metadatas = asArray(decoded.Metadatas).length;
  summary.agents = asArray(decoded.Agents).length;
  summary.connections = asArray(decoded.Connections).length;
  summary.knowledges = asArray(decoded.Knowledges).length;
  summary.themes = asArray(decoded.Themes).length;
  summary.components = asArray(decoded.Components).length;

  for (const [index, form] of asArray(decoded.Forms).entries()) inspectNoRule(form, `Forms[${index}]`, findings, summary);
  for (const [index, child] of asArray(decoded.Childs).entries()) inspectListPackage(child, `Childs[${index}]`, findings, summary);
  inspectGeneratedIds(decoded, findings);
  inspectDashboardDataTables(decoded, findings);
  return summary;
}

async function inspectFile(file) {
  const findings = [];
  let bytes;
  try {
    bytes = await readFileWithTimeout(file);
  } catch (error) {
    return { file, readable: false, error: error.message, status: "fail" };
  }
  const wrapper = parseWrapper(bytes, findings);
  if (wrapper) inspectWrapper(wrapper, findings);
  const resource = wrapper ? decodeResource(wrapper.Resource, findings) : { attempts: [], decoded: null, resourceDecodedBytes: 0, decodedTextBytes: 0 };
  const appSummary = resource.decoded ? inspectAppPackage(resource.decoded, findings) : null;
  return {
    file,
    readable: true,
    fileBytes: bytes.length,
    hasBom: bytes.subarray(0, 3).toString("hex") === "efbbbf",
    wrapperKeys: wrapper ? Object.keys(wrapper) : [],
    resourceStringLength: typeof wrapper?.Resource === "string" ? wrapper.Resource.length : 0,
    resourceDecodedBytes: resource.resourceDecodedBytes,
    brotliSuccess: Boolean(resource.decoded),
    decodedTextBytes: resource.decodedTextBytes,
    decodeAttempts: resource.attempts,
    appSummary,
    errors: findings.filter((item) => item.level === "error"),
    warnings: findings.filter((item) => item.level === "warning"),
    status: findings.some((item) => item.level === "error") ? "fail" : "pass",
  };
}

const args = process.argv.slice(2);
if (!args.length || args.includes("--help") || args.includes("-h")) usage(args.length ? 0 : 1);

const results = [];
for (const file of args) results.push(await inspectFile(file));
console.log(JSON.stringify({ status: results.every((item) => item.status === "pass") ? "pass" : "fail", results }, null, 2));
process.exit(results.every((item) => item.status === "pass") ? 0 : 1);

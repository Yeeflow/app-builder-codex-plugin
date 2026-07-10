#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const zlib = require("zlib");
const { validatePackageWrapperIcon } = require(resolveLocalModule([
  path.join(__dirname, "scripts/lib/application-icon-validation.cjs"),
  path.join(__dirname, "lib/application-icon-validation.cjs"),
]));

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
  "Childs",
];
const EMPTY_PORTALINFO_IMPORT_ERROR = "YAPK_PORTALINFO_EMPTY_OBJECT_INVALID";
const ARRAY_PORTALINFO_IMPORT_ERROR = "YAPK_PORTALINFO_ARRAY_INVALID";
const LIST_PACKAGE_REQUIRED = ["List", "Fields", "Layouts", "RemindRules", "PublicForms", "FlowMappings"];
const LIST_TYPE_ENUM = new Set([1, 16, 32, 64, 128, 1024]);
const FIELD_TYPE_ENUM = new Set(["Text", "Bit", "Decimal", "Datetime", "User"]);
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
const PLACEHOLDER_RE = /^__.*REQUIRED.*__$/;
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const API_ISSUED_INTEGER_RE = /^\d{16,}$/;
const LOCAL_FALLBACK_ID_RE = /^(local|temp|tmp|mock|placeholder|fallback|generated|test|demo)[-_]/i;
const SYSTEM_DASHBOARD_FIELDS = new Set(["Title", "ListDataID", "CreatedBy", "ModifiedBy", "Created", "Modified"]);
const CHOICE_FIELD_TYPES = new Set(["select", "radio", "checkbox", "tag"]);
const MULTI_CHOICE_FIELD_TYPES = new Set(["checkbox", "tag"]);
const GENERIC_CHOICE_RE = /^(option|choice|item|value|select|test|sample|demo)\s*\d*$/i;
const DEFAULT_DASHBOARD_RESOURCE_KEYS = ["children", "attrs", "title", "ver", "filterVars", "tempVars", "exts", "actions"];
const DASHBOARD_LAYOUT_TEMPLATE_ID = "dashboard-page-layouts-v1.1";
const STORAGE_FAMILY_BY_PREFIX = new Map([
  ["Text", "Text"],
  ["Decimal", "Decimal"],
  ["Datetime", "Datetime"],
  ["Bit", "Bit"],
  ["User", "User"],
]);
const DOCUMENT_LIBRARY_BIGINT_FIELDS = new Set(["Bigint1", "Bigint2"]);

function resolveLocalModule(candidates) {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`Cannot resolve required local module from: ${candidates.join(", ")}`);
}

function usage() {
  console.error("Usage: node validate-yapk-package.js <package.yapk> [--baseline <baseline.yapk>]");
  process.exit(1);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function walk(value, visitor, pointer = "$") {
  visitor(value, pointer);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visitor, `${pointer}[${index}]`));
  else if (isObject(value)) Object.entries(value).forEach(([key, child]) => walk(child, visitor, `${pointer}.${key}`));
}

function readWrapper(file) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  return parseJsonPreservingLargeInts(text);
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

function add(list, code, message, detail = {}) {
  list.push({ code, message, ...detail });
}

function isBase64(value) {
  if (typeof value !== "string" || !value) return false;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) return false;
  return Buffer.from(value, "base64").toString("base64") === value;
}

function entropy(buffer) {
  if (!buffer.length) return 0;
  const counts = new Map();
  for (const byte of buffer) counts.set(byte, (counts.get(byte) || 0) + 1);
  let out = 0;
  for (const count of counts.values()) {
    const p = count / buffer.length;
    out -= p * Math.log2(p);
  }
  return Number(out.toFixed(4));
}

function compareBuffers(left, right) {
  const min = Math.min(left.length, right.length);
  let commonPrefixBytes = 0;
  while (commonPrefixBytes < min && left[commonPrefixBytes] === right[commonPrefixBytes]) commonPrefixBytes += 1;
  let commonSuffixBytes = 0;
  while (
    commonSuffixBytes < min - commonPrefixBytes &&
    left[left.length - 1 - commonSuffixBytes] === right[right.length - 1 - commonSuffixBytes]
  ) {
    commonSuffixBytes += 1;
  }
  let samePositionBytes = 0;
  for (let i = 0; i < min; i += 1) if (left[i] === right[i]) samePositionBytes += 1;
  return {
    leftBytes: left.length,
    rightBytes: right.length,
    commonPrefixBytes,
    commonSuffixBytes,
    samePositionByteRatio: min ? Number((samePositionBytes / min).toFixed(4)) : 0,
  };
}

function changedKeys(left, right, keys) {
  return keys.filter((key) => JSON.stringify(left[key]) !== JSON.stringify(right[key]));
}

function decodeBrotliResource(resource, errors) {
  const attempts = [];
  const base64Bytes = isBase64(resource) ? Buffer.from(resource, "base64") : Buffer.alloc(0);
  const variants = [
    ["base64Bytes", base64Bytes],
    ["rawResourceUtf8Bytes", Buffer.from(String(resource || ""), "utf8")],
    ["base64urlBytes", Buffer.from(String(resource || "").replace(/-/g, "+").replace(/_/g, "/"), "base64")],
  ];
  for (const [name, bytes] of variants) {
    try {
      const decompressed = zlib.brotliDecompressSync(bytes);
      const decoded = parseJsonPreservingLargeInts(decompressed.toString("utf8"));
      attempts.push({ name, brotli: true, json: true, inputBytes: bytes.length, decodedTextBytes: decompressed.length });
      return { decoded, attempts, resourceBytes: base64Bytes.length, decodedTextBytes: decompressed.length };
    } catch (error) {
      const tolerant = tolerantBrotliDecodeSync(bytes);
      if (tolerant.text) {
        try {
          const decoded = parseJsonPreservingLargeInts(tolerant.text);
          attempts.push({ name, brotli: "tolerant", json: true, inputBytes: bytes.length, decodedTextBytes: Buffer.byteLength(tolerant.text), errorClass: error.code || error.name || "DECODE_ERROR" });
          return { decoded, attempts, resourceBytes: base64Bytes.length, decodedTextBytes: Buffer.byteLength(tolerant.text) };
        } catch {
          // Fall through to record the normal sync decode failure.
        }
      }
      attempts.push({ name, brotli: false, inputBytes: bytes.length, errorClass: error.code || error.name || "DECODE_ERROR" });
    }
  }
  add(errors, "YAPK_RESOURCE_BROTLI_DECODE_FAILED", "Product schema describes Resource as Brotli-compressed AppPackageInfo, but tested decode variants did not produce JSON.");
  return { decoded: null, attempts, resourceBytes: base64Bytes.length, decodedTextBytes: 0 };
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
  const result = spawnSync(process.execPath, ["-e", script, bytes.toString("base64")], { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 });
  if (result.status !== 0 || !result.stdout) return { text: "" };
  return { text: Buffer.from(result.stdout, "base64").toString("utf8") };
}

function validateField(field, path, errors, warnings, context = {}) {
  if (!isObject(field)) {
    add(errors, "YAPK_FIELD_NOT_OBJECT", "List field entry must be an object.", { path });
    return;
  }
  if (!Number.isInteger(field.Category)) {
    add(errors, "FIELD_CATEGORY_NOT_INT", "Field.Category must be an integer for generated YAPK packages.", {
      path: `${path}.Category`,
      field: field.DisplayName || field.FieldName || field.InternalName || null,
      actualType: field.Category === undefined ? "missing" : Array.isArray(field.Category) ? "array" : field.Category === null ? "null" : typeof field.Category,
    });
  }
  const fieldName = String(field.FieldName || "");
  const match = fieldName.match(FIELD_NAME_SUFFIX_RE);
  if (!match && fieldName !== "Title") add(errors, "YAPK_FIELD_NAME_SUFFIX_MISSING", "FieldName must end with digits, except the built-in Title field.", { path: `${path}.FieldName` });
  else if (match && String(field.FieldIndex ?? "") !== match[1]) add(errors, "YAPK_FIELD_NAME_SUFFIX_INDEX_MISMATCH", "FieldName trailing digits must equal FieldIndex.", { path: `${path}.FieldName` });
  if (fieldName === "Text0") add(errors, "TEXT0_PRIMARY_FIELD_INVALID_WHEN_TITLE_USED", "Generated YAPK lists must use native Title, not custom Text0 primary fields.", { path: `${path}.FieldName` });
  const family = storageFamilyForFieldName(fieldName);
  if (family && field.FieldType && normalizeFieldFamily(field.FieldType) !== family) {
    add(errors, "YAPK_FIELD_NAME_STORAGE_FAMILY_MISMATCH", "Generated field storage family must match its FieldName prefix.", { path: `${path}.FieldName`, fieldName, fieldType: field.FieldType, expectedFamily: family });
  }
  if (typeof field.InternalName !== "string" || !INTERNAL_NAME_RE.test(field.InternalName)) add(errors, "YAPK_FIELD_INTERNAL_NAME_INVALID", "InternalName must match ^[a-zA-Z0-9_]+$.", { path: `${path}.InternalName` });
  const documentLibraryBigint = Number(context.listType) === 16
    && field.FieldType === "Bigint"
    && DOCUMENT_LIBRARY_BIGINT_FIELDS.has(fieldName);
  if (field.FieldType !== undefined && !FIELD_TYPE_ENUM.has(field.FieldType) && !documentLibraryBigint) {
    add(errors, "YAPK_FIELD_TYPE_INVALID", "FieldType is outside the generated Data List enum and is not an export-proven native Document Library support field.", {
      path: `${path}.FieldType`,
      listType: context.listType ?? null,
      fieldName,
    });
  }
  if (field.Type !== undefined && !FIELD_CONTROL_TYPES.has(field.Type)) add(warnings, "YAPK_FIELD_CONTROL_TYPE_UNKNOWN", "Field Type is not in product schema known control-type list.", { path: `${path}.Type` });
  if (CHOICE_FIELD_TYPES.has(field.Type)) {
    const choices = collectChoiceValues(field);
    if (!choices.runtimePath) {
      add(errors, "CHOICE_OPTION_RUNTIME_SHAPE_MISSING", "Choice fields must use export-proven Rules.choices; legacy paths such as Rules.Options are ignored by runtime dropdowns.", {
        path,
        field: fieldName || field.DisplayName || null,
        legacyPaths: choices.legacyPaths,
      });
    }
    if (!choices.values.length) {
      add(errors, "SELECT_CHOICES_MISSING", "Select/radio/checkbox/tag fields must include non-empty option values.", { path, field: fieldName || field.DisplayName || null });
      add(errors, "CHOICE_OPTIONS_MISSING", "Choice fields must include non-empty business option values.", { path, field: fieldName || field.DisplayName || null });
      if (MULTI_CHOICE_FIELD_TYPES.has(field.Type)) add(errors, "MULTI_SELECT_OPTIONS_MISSING", "Multi-select style fields must include non-empty option values.", { path, field: fieldName || field.DisplayName || null });
    }
    if (choices.all.some((value) => !String(value).trim())) add(errors, "CHOICE_OPTION_BLANK", "Choice fields must not include blank option rows.", { path, field: fieldName || field.DisplayName || null });
    if (choices.values.some((value) => GENERIC_CHOICE_RE.test(String(value).trim()))) add(errors, "CHOICE_OPTION_GENERIC", "Choice fields must use business option values, not generic placeholders.", { path, field: fieldName || field.DisplayName || null });
  }
}

function validateListPackage(pkg, path, errors, warnings, counts, appId) {
  if (!isObject(pkg)) {
    add(errors, "YAPK_LIST_PACKAGE_NOT_OBJECT", "ListPackageInfo must be an object.", { path });
    return;
  }
  counts.childs += 1;
  for (const key of LIST_PACKAGE_REQUIRED) if (!(key in pkg)) add(errors, "YAPK_LIST_PACKAGE_KEY_MISSING", "ListPackageInfo is missing a schema-required key.", { path: `${path}.${key}` });
  if (!isObject(pkg.List)) add(errors, "YAPK_LIST_INFO_MISSING", "ListPackageInfo.List must be an object.", { path: `${path}.List` });
  else {
    if (pkg.List.Type !== undefined && !LIST_TYPE_ENUM.has(Number(pkg.List.Type))) add(errors, "YAPK_LIST_TYPE_INVALID", "List.Type is outside product schema enum.", { path: `${path}.List.Type` });
    if (Number(pkg.List.Flags) !== 1) add(errors, "YAPK_LISTMODEL_FLAGS_MISSING_OR_INVALID", "Generated AppPackageInfo child list resources require List.Flags = 1 before signing.", { path: `${path}.List.Flags`, value: pkg.List.Flags });
    validateAppStorageCodes(pkg.List, `${path}.List`, errors, appId);
    if (pkg.List.LayoutView !== null && pkg.List.LayoutView !== undefined && !hasExportResolvedCustomFormRouting(pkg)) {
      add(errors, "LIST_LAYOUTVIEW_SHOULD_BE_NULL", "Generated child List.LayoutView must be null unless custom form routing is fully export-resolved.", { path: `${path}.List.LayoutView` });
    }
  }
  counts.fields += asArray(pkg.Fields).length;
  counts.layouts += asArray(pkg.Layouts).length;
  validateNoEmbeddedListDatas(pkg, path, errors);
  for (const [index, field] of asArray(pkg.Fields).entries()) {
    validateField(field, `${path}.Fields[${index}]`, errors, warnings, { listType: pkg.List?.Type });
  }
  validateNativeTitle(pkg.Fields, path, errors);
  validateDefaultViews(pkg, path, errors);
  validateChoiceSampleRows(pkg, path, errors);
  if ("Defs" in pkg) add(errors, "YAPK_CHILDS_USES_DEFS", "YAPK Childs items must use Fields, not YAP Defs.", { path: `${path}.Defs` });
}

function hasExportResolvedCustomFormRouting(pkg) {
  const layoutView = parseMaybeJson(pkg?.List?.LayoutView, null);
  if (!isObject(layoutView)) return false;
  const layouts = new Map(asArray(pkg?.Layouts).map((layout) => [String(layout?.LayoutID || ""), layout]));
  for (const usage of ["add", "edit", "view"]) {
    const layoutId = String(layoutView?.[usage] || "").trim();
    if (!layoutId || layoutId.toLowerCase() === "default") return false;
    const layout = layouts.get(layoutId);
    if (!layout || Number(layout.Type) !== 1) return false;
  }
  return true;
}

function validateNoEmbeddedListDatas(pkg, path, errors) {
  for (const key of Object.keys(pkg || {})) {
    if (/^ListDatas$/i.test(key)) {
      const value = pkg[key];
      add(errors, "YAPK_EMBEDDED_LISTDATAS_FORBIDDEN", "Generated YAPK AppPackageInfo must not embed sample rows in Childs[].ListDatas. Generate a companion seed JSON/script and require explicit live seeding approval instead.", {
        path: `${path}.${key}`,
        rowCount: Array.isArray(value) ? value.length : isObject(value) ? Object.keys(value).length : null,
      });
    }
  }
  if (isObject(pkg.List) && Object.prototype.hasOwnProperty.call(pkg.List, "ListDatas")) {
    add(errors, "YAPK_EMBEDDED_LISTDATAS_FORBIDDEN", "Generated YAPK AppPackageInfo must not embed sample rows in Childs[].List.ListDatas.", { path: `${path}.List.ListDatas` });
  }
  if (isObject(pkg.List) && Object.prototype.hasOwnProperty.call(pkg.List, "Items")) {
    const value = pkg.List.Items;
    const rowCount = Array.isArray(value) ? value.length : isObject(value) ? Object.keys(value).length : null;
    if (rowCount === null || rowCount > 0) {
      if (Number(pkg.List.Type) === 16) validateDocumentLibraryFolderItems(pkg, path, errors);
      else add(errors, "YAPK_EMBEDDED_LIST_ITEMS_FORBIDDEN", "Generated-final YAPK AppPackageInfo must not embed seed/sample rows in Childs[].List.Items. Only export-shaped structural folder rows are allowed for Type 16 Document Libraries.", { path: `${path}.List.Items`, rowCount });
    }
  }
}

function validateDocumentLibraryFolderItems(pkg, path, errors) {
  const items = pkg?.List?.Items;
  if (!isObject(items) || Array.isArray(items)) {
    add(errors, "DOCUMENT_LIBRARY_FOLDER_ITEMS_OBJECT_REQUIRED", "Type 16 Document Library folder rows must use a record-ID-keyed List.Items object.", { path: `${path}.List.Items` });
    return;
  }
  const fieldNames = new Set(asArray(pkg.Fields).map((field) => String(field?.FieldName || "")));
  for (const [folderId, row] of Object.entries(items)) {
    const rowPath = `${path}.List.Items[${folderId}]`;
    if (!/^\d{16,}$/.test(folderId)) add(errors, "DOCUMENT_LIBRARY_FOLDER_ROW_ID_INVALID", "Document Library folder object keys must be API-style numeric IDs.", { path: rowPath });
    if (!isObject(row) || Array.isArray(row)) {
      add(errors, "DOCUMENT_LIBRARY_FOLDER_ROW_INVALID", "Document Library List.Items entries must be folder row objects.", { path: rowPath });
      continue;
    }
    const title = String(row.Title || "").trim();
    if (!title) add(errors, "DOCUMENT_LIBRARY_FOLDER_TITLE_REQUIRED", "Document Library folder rows require a non-empty Title.", { path: `${rowPath}.Title` });
    if (String(row.Bigint1 ?? "") !== "0") add(errors, "DOCUMENT_LIBRARY_FOLDER_PARENT_INVALID", "Generated-final Document Library folders are currently limited to root folders with Bigint1 = \"0\".", { path: `${rowPath}.Bigint1` });
    if (String(row.Text1 ?? "") !== "folder") add(errors, "DOCUMENT_LIBRARY_FOLDER_TYPE_INVALID", "Document Library folder rows require Text1 = \"folder\".", { path: `${rowPath}.Text1` });
    if (String(row.Bigint2 ?? "") !== "" || String(row.Text2 ?? "") !== "") add(errors, "DOCUMENT_LIBRARY_FOLDER_FILE_METADATA_INVALID", "Structural folder rows require blank Bigint2 and Text2 file metadata.", { path: rowPath });
    if (title && String(row.Text3 ?? "") !== `0_${title.toLowerCase()}`) add(errors, "DOCUMENT_LIBRARY_FOLDER_UNIQUE_NAME_INVALID", "Root folder Text3 must equal 0_<lowercase folder title>.", { path: `${rowPath}.Text3` });
    if (Object.prototype.hasOwnProperty.call(row, "Text4")) add(errors, "DOCUMENT_LIBRARY_FOLDER_UPLOAD_FORBIDDEN", "Structural folder rows must omit Text4 upload/file payload data.", { path: `${rowPath}.Text4` });
    if (Object.prototype.hasOwnProperty.call(row, "ListDataID")) add(errors, "DOCUMENT_LIBRARY_FOLDER_LISTDATAID_FIELD_FORBIDDEN", "The folder ID belongs in the List.Items object key, not a ListDataID row property.", { path: `${rowPath}.ListDataID` });
    for (const [fieldName, fieldValue] of Object.entries(row)) {
      if (!fieldNames.has(fieldName)) add(errors, "DOCUMENT_LIBRARY_FOLDER_FIELD_UNKNOWN", "Folder rows may only use fields declared by the target Document Library.", { path: `${rowPath}.${fieldName}`, fieldName });
      if (typeof fieldValue !== "string") add(errors, "DOCUMENT_LIBRARY_FOLDER_VALUE_NOT_STRING", "Document Library folder field values must serialize as strings.", { path: `${rowPath}.${fieldName}` });
      if (!new Set(["Title", "Bigint1", "Text1", "Bigint2", "Text2", "Text3"]).has(fieldName) && String(fieldValue) !== "") {
        add(errors, "DOCUMENT_LIBRARY_FOLDER_CUSTOM_VALUE_NOT_BLANK", "Structural folder rows may include custom fields only as blank export-shaped values.", { path: `${rowPath}.${fieldName}` });
      }
    }
  }
}

function storageFamilyForFieldName(fieldName) {
  for (const [prefix, family] of STORAGE_FAMILY_BY_PREFIX.entries()) {
    if (fieldName.startsWith(prefix) && /\d+$/.test(fieldName)) return family;
  }
  return null;
}

function normalizeFieldFamily(fieldType) {
  return String(fieldType || "");
}

function collectChoiceValues(field) {
  const rules = parseMaybeJson(field.Rules, {});
  const runtimeCandidates = [];
  if (Array.isArray(rules?.choices)) runtimeCandidates.push({ path: "Rules.choices", items: rules.choices });
  if (field.Type === "tag" && Array.isArray(rules?.customTags)) runtimeCandidates.push({ path: "Rules.customTags", items: rules.customTags });
  const legacyCandidates = [
    ["Rules.Options", rules?.Options],
    ["Rules.options", rules?.options],
    ["Rules.Items", rules?.Items],
    ["Rules.items", rules?.items],
    ["Rules.Choices", rules?.Choices],
    ["field.Options", field.Options],
    ["field.Choices", field.Choices],
  ].filter(([, items]) => Array.isArray(items));
  const active = runtimeCandidates.length ? runtimeCandidates : legacyCandidates.map(([path, items]) => ({ path, items }));
  const all = active.flatMap(({ items }) => items).map(choiceValue);
  return {
    all,
    values: all.filter((value) => String(value).trim()),
    runtimePath: runtimeCandidates.find(({ items }) => items.some((item) => String(choiceValue(item)).trim()))?.path || "",
    legacyPaths: legacyCandidates.map(([path]) => path),
  };
}

function choiceValue(item) {
  if (typeof item === "string") return item;
  return item?.value ?? item?.text ?? item?.label ?? item?.Value ?? item?.Name ?? item?.Title ?? "";
}

function normalizeSampleChoiceValues(value) {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  const stringValue = String(value).trim();
  if (!stringValue) return [];
  const parsed = parseMaybeJson(stringValue, null);
  if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
  return stringValue.split(/[;,]/).map((item) => item.trim()).filter(Boolean);
}

function validateChoiceSampleRows(pkg, path, errors) {
  const fields = asArray(pkg.Fields).filter((field) => CHOICE_FIELD_TYPES.has(field?.Type));
  if (!fields.length) return;
  const rawRows = pkg?.List?.Items;
  const rows = Array.isArray(rawRows) ? rawRows : isObject(rawRows) ? Object.values(rawRows) : [];
  if (!rows.length) return;
  const choiceByFieldName = new Map(fields.map((field) => [String(field.FieldName || ""), { field, choices: collectChoiceValues(field) }]));
  for (const [rowIndex, row] of rows.entries()) {
    if (!isObject(row)) continue;
    for (const [fieldName, value] of Object.entries(row)) {
      const entry = choiceByFieldName.get(fieldName);
      if (!entry || !entry.choices.runtimePath || !entry.choices.values.length) continue;
      const allowed = new Set(entry.choices.values.map((choice) => String(choice).trim()));
      const selected = normalizeSampleChoiceValues(value);
      for (const selectedValue of selected) {
        if (allowed.has(selectedValue)) continue;
        add(
          errors,
          MULTI_CHOICE_FIELD_TYPES.has(entry.field.Type) ? "MULTI_SELECT_SAMPLE_VALUE_NOT_IN_OPTIONS" : "CHOICE_SAMPLE_VALUE_NOT_IN_OPTIONS",
          "Sample choice values must resolve to the field's runtime-visible Rules.choices values.",
          { path: `${path}.List.Items[${rowIndex}].${fieldName}`, field: fieldName, value: selectedValue },
        );
      }
    }
  }
}

function parseMaybeJson(value, fallback = null) {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function safeString(value) {
  return value === undefined || value === null ? "" : String(value);
}

function parseApprovalDefResource(form, path, errors) {
  const raw = form?.DefResource;
  if (typeof raw !== "string" || !raw.trim()) {
    add(errors, "APPROVAL_DEFRESOURCE_MISSING", "Generated approval forms must include DefResource before signing.", { path: `${path}.DefResource` });
    return null;
  }
  if (!/^Ojpicm90bGk6O[A-Za-z0-9+/]*={0,2}$/.test(raw)) {
    add(errors, "APPROVAL_DEFRESOURCE_ENCODING_INVALID", "Approval DefResource must be base64(\"::brotli::\" + Brotli(JSON.stringify(ProcessDefResourceInfo))). Plain JSON or simple base64 JSON can import but may render an empty designer.", { path: `${path}.DefResource` });
    return null;
  }
  let bytes;
  try {
    bytes = Buffer.from(raw, "base64");
  } catch {
    add(errors, "APPROVAL_DEFRESOURCE_BASE64_INVALID", "Approval DefResource must be canonical base64.", { path: `${path}.DefResource` });
    return null;
  }
  const prefix = Buffer.from("::brotli::", "utf8");
  if (bytes.length <= prefix.length || !bytes.subarray(0, prefix.length).equals(prefix)) {
    add(errors, "APPROVAL_DEFRESOURCE_PREFIX_MISSING", "Approval DefResource decoded bytes must start with ::brotli::.", { path: `${path}.DefResource` });
    return null;
  }
  let text;
  try {
    text = zlib.brotliDecompressSync(bytes.subarray(prefix.length)).toString("utf8");
  } catch {
    add(errors, "APPROVAL_DEFRESOURCE_BROTLI_DECODE_FAILED", "Approval DefResource payload after ::brotli:: must Brotli-decompress to JSON.", { path: `${path}.DefResource` });
    return null;
  }
  try {
    return parseJsonPreservingLargeInts(text);
  } catch {
    add(errors, "APPROVAL_DEFRESOURCE_JSON_INVALID", "Decoded approval DefResource must parse as ProcessDefResourceInfo JSON.", { path: `${path}.DefResource` });
    return null;
  }
}

function isNonZeroApiId(value) {
  const text = String(value ?? "");
  return API_ISSUED_INTEGER_RE.test(text) && !/^0+$/.test(text) && !/0000$/.test(text);
}

function validateApprovalFormStandardAdditions(form, path, errors) {
  const workflowType = String(form?.WorkflowType ?? form?.workflowType ?? "");
  if (workflowType !== "2") return;
  const deployed = form.Deployed === true || String(form.Deployed).toLowerCase() === "true";
  if (deployed) {
    for (const key of ["DefResourceID", "DeployedDefID"]) {
      if (!isNonZeroApiId(form[key])) {
        add(errors, `APPROVAL_${key.toUpperCase()}_API_ID_REQUIRED`, "Deployed generated approval definitions must use non-zero API-issued IDs.", { path: `${path}.${key}`, value: form[key] ?? null });
      }
    }
  }
  const def = parseApprovalDefResource(form, path, errors);
  if (!isObject(def)) return;
  const pages = asArray(def.pageurls);
  const pageIds = new Set();
  for (const [pageIndex, page] of pages.entries()) {
    const pagePath = `${path}.DefResource.pageurls[${pageIndex}]`;
    if (!page?.id) add(errors, "APPROVAL_PAGEURL_ID_MISSING", "Approval DefResource.pageurls[] entries must include id.", { path: `${pagePath}.id` });
    else pageIds.add(String(page.id));
    if (!isObject(page?.formdef)) add(errors, "APPROVAL_PAGEURL_FORMDEF_MISSING", "Approval DefResource.pageurls[] entries must include embedded formdef.", { path: `${pagePath}.formdef` });
    else if (String(page.formdef.id || "") !== String(page.id || "")) {
      add(errors, "APPROVAL_PAGE_FORMDEF_ID_MISMATCH", "Decoded pageurls[].formdef.id must match pageurls[].id so approval controls hydrate in designer.", { path: `${pagePath}.formdef.id`, pageId: page.id || null, formdefId: page.formdef.id || null });
    }
  }
  const shapes = asArray(def.childshapes);
  const startShapes = shapes.filter((shape) => shape?.stencil?.id === "StartNoneEvent");
  const sequenceFlows = shapes.filter((shape) => shape?.stencil?.id === "SequenceFlow");
  const workflowNodes = shapes.filter((shape) => shape?.stencil?.id && shape.stencil.id !== "SequenceFlow");
  if (!shapes.length) add(errors, "APPROVAL_WORKFLOW_CHILDSHAPES_MISSING", "Decoded approval DefResource.childshapes must include workflow stencils and sequence connectors.", { path: `${path}.DefResource.childshapes` });
  if (!startShapes.length) add(errors, "APPROVAL_WORKFLOW_START_NODE_MISSING", "Approval workflow childshapes must include a StartNoneEvent node.", { path: `${path}.DefResource.childshapes` });
  if (!sequenceFlows.length) add(errors, "APPROVAL_WORKFLOW_SEQUENCE_CONNECTOR_MISSING", "Approval workflow childshapes must include SequenceFlow connectors from the Start node.", { path: `${path}.DefResource.childshapes` });
  if (workflowNodes.length < 2) add(errors, "APPROVAL_WORKFLOW_TASK_OR_END_NODE_MISSING", "Approval workflow childshapes must include workflow nodes beyond Start so actions hydrate in designer.", { path: `${path}.DefResource.childshapes` });
  const outgoingIds = new Set(startShapes.flatMap((shape) => asArray(shape.outgoing).map((item) => String(item.resourceid || item.id || "")).filter(Boolean)));
  if (startShapes.length && sequenceFlows.length && !sequenceFlows.some((flow) => outgoingIds.has(String(flow.resourceid || flow.id || "")))) {
    add(errors, "APPROVAL_WORKFLOW_START_SEQUENCE_MISSING", "Approval workflow SequenceFlow connectors must be reachable from the Start node outgoing references.", { path: `${path}.DefResource.childshapes` });
  }
  for (const [shapeIndex, shape] of shapes.entries()) {
    const taskurl = shape?.properties?.taskurl || shape?.properties?.taskUrl || shape?.properties?.TaskUrl;
    if (taskurl && !pageIds.has(String(taskurl))) {
      add(errors, "APPROVAL_WORKFLOW_TASKURL_PAGE_NOT_FOUND", "Workflow task URL references must resolve to decoded pageurls[].id.", { path: `${path}.DefResource.childshapes[${shapeIndex}].properties.taskurl`, taskurl });
    }
  }
}

function expectedStorageCode(appId) {
  if (String(appId) === "30") return "setting_c";
  if (String(appId) === "41") return "flowcraft";
  return null;
}

function validateAppStorageCodes(list, path, errors, appId) {
  if (!list || typeof list !== "object") return;
  const expected = expectedStorageCode(appId);
  if (list.TableCode !== undefined && list.IndexCode !== undefined && list.TableCode !== list.IndexCode) {
    add(errors, "YAPK_TABLECODE_INDEXCODE_MISMATCH", "TableCode and IndexCode must be the same value for generated YAPK lists.", { path, tableCode: list.TableCode, indexCode: list.IndexCode });
  }
  if (expected && list.TableCode !== expected) {
    add(errors, `YAPK_TABLECODE_${expected.toUpperCase()}_REQUIRED`, `Product schema requires TableCode = ${expected} for AppID ${appId} generated lists.`, { path: `${path}.TableCode`, value: list.TableCode ?? null, appId });
  }
  if (expected && list.IndexCode !== expected) {
    add(errors, `YAPK_INDEXCODE_${expected.toUpperCase()}_REQUIRED`, `Product schema requires IndexCode = ${expected} for AppID ${appId} generated lists.`, { path: `${path}.IndexCode`, value: list.IndexCode ?? null, appId });
  }
}

function validateNativeTitle(fields, path, errors) {
  const list = asArray(fields);
  const title = list.find((field) => field?.FieldName === "Title" || field?.InternalName === "Title");
  if (!title) {
    add(errors, "NATIVE_TITLE_FIELD_MISSING", "Generated data lists must preserve the native/system Title field.", { path: `${path}.Fields` });
    return;
  }
  if (title.FieldName !== "Title" || title.InternalName !== "Title") add(errors, "NATIVE_TITLE_FIELD_INVALID", "Native Title must use FieldName and InternalName equal to Title.", { path: `${path}.Fields.Title` });
  if (title.IsSystem !== true) add(errors, "NATIVE_TITLE_NOT_SYSTEM", "Native Title must be marked IsSystem true.", { path: `${path}.Fields.Title.IsSystem` });
  if (title.Type !== "input" || title.FieldType !== "Text") add(errors, "NATIVE_TITLE_TYPE_INVALID", "Native Title must use Type input and FieldType Text.", { path: `${path}.Fields.Title` });
}

function validateDefaultViews(pkg, path, errors) {
  const defaultView = asArray(pkg.Layouts).find((layout) => Number(layout?.Type) === 0 && (layout.IsDefault === true || layout.Title || layout.LayoutView));
  if (!defaultView) {
    add(errors, "DEFAULT_VIEW_MISSING", "Generated lists must include a default Type 0 data view.", { path: `${path}.Layouts` });
    return;
  }
  const view = parseMaybeJson(defaultView.LayoutView, {});
  const ext1 = parseMaybeJson(defaultView.Ext1, {});
  const layoutItems = Array.isArray(view?.layout) ? view.layout : [];
  const queryItems = Array.isArray(view?.query) ? view.query : [];
  const layoutFields = layoutItems.map(viewFieldName);
  const queryFields = queryItems.map(viewFieldName);
  const queryByFieldName = new Map();
  for (const queryItem of queryItems) {
    const name = viewFieldName(queryItem);
    if (name && !queryByFieldName.has(name)) queryByFieldName.set(name, queryItem);
  }
  const fields = new Set(asArray(pkg.Fields).map((field) => String(field.FieldName || "")).filter(Boolean));
  if (ext1?.Url !== "default") add(errors, "DEFAULT_VIEW_EXT1_URL_MISSING", "Default Type 0 data view must set Ext1.Url to default.", { path: `${path}.Layouts.default.Ext1` });
  if (!layoutFields.length) add(errors, "DEFAULT_VIEW_DISPLAY_FIELDS_MISSING", "Default data views must include visible columns.", { path: `${path}.Layouts.default.LayoutView.layout` });
  if (!queryFields.length) add(errors, "DEFAULT_VIEW_QUERY_EMPTY", "Default data views must include query fields, including required system fields.", { path: `${path}.Layouts.default.LayoutView.query` });
  if (layoutFields.length > 0 && layoutFields[0] !== "Title") add(errors, "DEFAULT_VIEW_TITLE_NOT_FIRST", "Default data views should show native Title as the first visible field.", { path: `${path}.Layouts.default.LayoutView.layout`, field: layoutFields[0] });
  for (const [index, item] of layoutItems.entries()) {
    const missing = ["FieldID", "FieldName", "DisplayName", "Order", "Mobile", "Show"].filter((key) => item?.[key] === undefined || item?.[key] === null || item?.[key] === "");
    if (missing.length) add(errors, "DEFAULT_VIEW_COLUMN_SHAPE_INCOMPLETE", "Default view display columns must be full export-style column objects.", { path: `${path}.Layouts.default.LayoutView.layout[${index}]`, missing });
    const fieldName = viewFieldName(item);
    if (fieldName && !fields.has(fieldName) && !SYSTEM_DASHBOARD_FIELDS.has(fieldName)) add(errors, "DEFAULT_VIEW_DISPLAY_FIELD_NOT_FOUND", "Default view visible fields must resolve to list fields.", { path: `${path}.Layouts.default.LayoutView.layout[${index}]`, field: fieldName });
    if (fieldName && !queryFields.includes(fieldName)) add(errors, "DEFAULT_VIEW_QUERY_FIELDS_MISSING", "Default view query must include every visible display field.", { path: `${path}.Layouts.default.LayoutView.query`, field: fieldName });
    const queryItem = queryByFieldName.get(fieldName);
    const layoutFieldId = viewFieldId(item);
    const queryFieldId = viewFieldId(queryItem);
    if (fieldName && queryItem && layoutFieldId && queryFieldId && layoutFieldId !== queryFieldId) {
      add(errors, "DEFAULT_VIEW_QUERY_FIELD_ID_MISMATCH", "Default view query field must match the visible layout column FieldID for the same FieldName.", {
        path: `${path}.Layouts.default.LayoutView.query`,
        field: fieldName,
        layoutFieldId,
        queryFieldId,
      });
    }
  }
  for (const field of SYSTEM_DASHBOARD_FIELDS) {
    if (!queryFields.includes(field)) add(errors, "DEFAULT_VIEW_SYSTEM_QUERY_FIELD_MISSING", "Default data views must include required system query fields.", { path: `${path}.Layouts.default.LayoutView.query`, field });
  }
}

function viewFieldName(item) {
  return String(item?.field || item?.Field || item?.FieldName || "");
}

function viewFieldId(item) {
  return item === undefined || item === null ? "" : String(item?.FieldID || item?.FieldId || item?.fieldId || item?.Field || "");
}

function validateNoRule(form, path, errors, counts) {
  if (!isObject(form)) return;
  counts.forms += 1;
  if (form.NoRule === undefined || form.NoRule === null) return;
  if (!isObject(form.NoRule)) {
    add(errors, "YAPK_FORM_NORULE_NOT_OBJECT", "NoRule must be an object when present.", { path: `${path}.NoRule` });
    return;
  }
  counts.noRules += 1;
  for (const key of ["Prefix", "StartIndex", "CustomLength", "AutoIncrement"]) {
    if (!(key in form.NoRule)) add(errors, "YAPK_FORM_NORULE_KEY_MISSING", "NoRule is missing a schema-required key.", { path: `${path}.NoRule.${key}` });
  }
  if (typeof form.NoRule.Prefix !== "string" || !form.NoRule.Prefix.includes("{index}")) add(errors, "YAPK_FORM_NORULE_PREFIX_INDEX_MISSING", "NoRule.Prefix must contain {index}.", { path: `${path}.NoRule.Prefix` });
}

function validateAppPackage(decoded, errors, warnings, appId) {
  const errorCountBeforeContent = errors.length;
  const counts = {
    pages: 0,
    forms: 0,
    formReports: 0,
    formNewReports: 0,
    customServices: 0,
    dataReports: 0,
    childs: 0,
    fields: 0,
    layouts: 0,
    agents: 0,
    connections: 0,
    knowledges: 0,
    themes: 0,
    components: 0,
    noRules: 0,
  };
  if (!isObject(decoded)) {
    add(errors, "YAPK_APP_PACKAGE_NOT_OBJECT", "Decoded Resource must be an AppPackageInfo object.");
    return { decodedKeys: [], counts };
  }
  if ("MainListType" in decoded || "Data" in decoded || "Item" in decoded) {
    add(errors, "YAPK_RESOURCE_NOT_APP_PACKAGE_INFO", "Decoded YAPK Resource must be AppPackageInfo, not YAP ListExportResult/ListExportInfo.");
    return { decodedKeys: Object.keys(decoded), counts };
  }
  for (const key of APP_PACKAGE_REQUIRED) if (!(key in decoded)) add(errors, "YAPK_APP_PACKAGE_KEY_MISSING", "Decoded AppPackageInfo is missing a schema-required key.", { key });
  if (isObject(decoded.PortalInfo) && Object.keys(decoded.PortalInfo).length === 0) {
    add(errors, EMPTY_PORTALINFO_IMPORT_ERROR, "Product import feedback requires PortalInfo to be null when no portal is included; do not emit an empty object.", { path: "PortalInfo" });
  }
  if (Array.isArray(decoded.PortalInfo)) {
    add(errors, ARRAY_PORTALINFO_IMPORT_ERROR, "Product import feedback requires PortalInfo to be null when no portal is included; do not emit an array.", { path: "PortalInfo", length: decoded.PortalInfo.length });
  }
  if (decoded.PortalInfo !== undefined && decoded.PortalInfo !== null && !Array.isArray(decoded.PortalInfo) && !isObject(decoded.PortalInfo)) {
    add(errors, "YAPK_PORTALINFO_INVALID", "PortalInfo must be null for no portal or a portal object when a portal is included.", { path: "PortalInfo", actualType: typeof decoded.PortalInfo });
  }
  if (isObject(decoded.ListSet) && Number(decoded.ListSet.Flags) !== 1) {
    add(errors, "YAPK_LISTMODEL_FLAGS_MISSING_OR_INVALID", "Generated AppPackageInfo root app/list-set resource requires ListSet.Flags = 1 before signing.", { path: "ListSet.Flags", value: decoded.ListSet.Flags });
  }
  if (isObject(decoded.ListSet)) {
    validateAppStorageCodes(decoded.ListSet, "ListSet", errors, appId);
    validateRootLayoutView(decoded.ListSet, errors);
    validateRootNavigation(decoded, errors);
  }
  counts.pages = asArray(decoded.Pages).length;
  if (!Array.isArray(decoded.FormReports)) add(errors, "FORMREPORTS_EXPORT_SHAPE_REQUIRED", "Official AppPackageInfo export shape requires FormReports to be present as an array, even when empty.", { path: "FormReports" });
  if (!Array.isArray(decoded.FormNewReports)) add(errors, "FORMNEWREPORTS_REQUIRED", "AppPackageInfo.FormNewReports is the current workflow report collection and must be present as an array, even when empty.", { path: "FormNewReports" });
  if (!Array.isArray(decoded.CustomServices)) add(errors, "CUSTOMSERVICES_EXPORT_SHAPE_REQUIRED", "Official AppPackageInfo export shape requires CustomServices to be present as an array, even when empty.", { path: "CustomServices" });
  if (asArray(decoded.FormReports).length > 0 && asArray(decoded.FormNewReports).length === 0) add(errors, "FORMREPORTS_LEGACY_NOT_CURRENT", "Workflow reports must be generated in FormNewReports. FormReports is legacy and cannot be the only workflow report collection.", { path: "FormReports" });
  counts.formReports = asArray(decoded.FormReports).length;
  counts.formNewReports = asArray(decoded.FormNewReports).length;
  counts.customServices = asArray(decoded.CustomServices).length;
  counts.dataReports = asArray(decoded.DataReports).length;
  counts.agents = asArray(decoded.Agents).length;
  counts.connections = asArray(decoded.Connections).length;
  counts.knowledges = asArray(decoded.Knowledges).length;
  counts.themes = asArray(decoded.Themes).length;
  counts.components = asArray(decoded.Components).length;
  for (const [index, form] of asArray(decoded.Forms).entries()) {
    validateNoRule(form, `Forms[${index}]`, errors, counts);
    validateApprovalFormStandardAdditions(form, `Forms[${index}]`, errors);
  }
  for (const [index, child] of asArray(decoded.Childs).entries()) validateListPackage(child, `Childs[${index}]`, errors, warnings, counts, appId);
  validateSchemaForbiddenAppIds(decoded, errors);
  validateGeneratedYapkIds(decoded, errors);
  validateDashboardShells(decoded, errors);
  validateDashboardDataTables(decoded, errors);
  validateNativeTextControls(decoded, errors);
  validateUnsupportedSummarySurfaces(decoded, errors);
  const placeholders = [];
  walk(decoded, (value, pointer) => {
    if (typeof value === "string" && PLACEHOLDER_RE.test(value)) placeholders.push({ path: pointer, placeholder: value });
  });
  for (const placeholder of placeholders.slice(0, 25)) {
    add(errors, "YAPK_UNRESOLVED_PLACEHOLDER", "Generated AppPackageInfo must not contain unresolved required placeholders before signing.", placeholder);
  }
  if (placeholders.length > 25) {
    add(errors, "YAPK_UNRESOLVED_PLACEHOLDER_TRUNCATED", "Additional unresolved required placeholders remain in generated AppPackageInfo.", { additionalCount: placeholders.length - 25 });
  }
  if (errors.length > errorCountBeforeContent) {
    add(errors, "YAPK_CONTENT_VALIDATION_FAILED_BEFORE_SIGNING", "Do not run setsign for generated YAPK content until decoded AppPackageInfo/package validation, graph validation, workflow publish-readiness checks, and placeholder scans pass.");
  }
  return { decodedKeys: Object.keys(decoded), counts };
}

function validateRootLayoutView(listSet, errors) {
  if (!("LayoutView" in listSet)) return;
  if (typeof listSet.LayoutView !== "string") {
    add(errors, "YAPK_ROOT_LAYOUTVIEW_STRING_REQUIRED", "Generated root ListSet.LayoutView must be a JSON string when present; do not emit null or object.", { path: "ListSet.LayoutView", actualType: listSet.LayoutView === null ? "null" : Array.isArray(listSet.LayoutView) ? "array" : typeof listSet.LayoutView });
    return;
  }
  if (listSet.LayoutView.trim()) {
    try { JSON.parse(listSet.LayoutView); } catch {
      add(errors, "YAPK_ROOT_LAYOUTVIEW_JSON_INVALID", "Generated root ListSet.LayoutView must contain valid JSON when non-empty.", { path: "ListSet.LayoutView" });
    }
  }
}

function validateRootNavigation(decoded, errors) {
  const layoutView = parseMaybeJson(decoded?.ListSet?.LayoutView, null);
  if (!isObject(layoutView)) return;
  const pagesByLayoutId = new Set(asArray(decoded.Pages).map((page) => safeString(page?.LayoutID)).filter(Boolean));
  const formsByKey = new Set(asArray(decoded.Forms).map((form) => safeString(form?.Key || form?.FlowKey || form?.ProcKey)).filter(Boolean));
  const childListsByType = new Map();
  for (const child of asArray(decoded.Childs)) {
    const listId = safeString(child?.List?.ListID || child?.ListModel?.ListID);
    const listType = Number(child?.List?.Type ?? child?.ListModel?.Type);
    if (!listId || !Number.isFinite(listType)) continue;
    if (!childListsByType.has(listType)) childListsByType.set(listType, new Set());
    childListsByType.get(listType).add(listId);
  }
  function visit(items, path, inGroup = false) {
    for (const [index, item] of asArray(items).entries()) {
      const itemPath = `${path}[${index}]`;
      if (!isObject(item)) {
        add(errors, "NAVIGATION_ITEM_NOT_OBJECT", "Navigation entries must be objects.", { path: itemPath });
        continue;
      }
      const type = item.Type;
      const title = safeString(item.Title || item.DisplayName || item.Name);
      if (Array.isArray(item.children) || Array.isArray(item.Childs)) {
        add(errors, "NAVIGATION_GROUP_CHILDREN_UNSUPPORTED", "Generated app navigation groups must use export-proven Type:\"classes\" with list[], not local-only children/Childs arrays.", { path: itemPath, title });
      }
      if (safeString(type) === "classes") {
        if (!Array.isArray(item.list)) add(errors, "NAVIGATION_GROUP_LIST_MISSING", "Type:\"classes\" navigation groups must include list[].", { path: `${itemPath}.list`, title });
        visit(item.list, `${itemPath}.list`, true);
        continue;
      }
      if (Array.isArray(item.list)) {
        add(errors, "NAVIGATION_GROUP_TYPE_CLASSES_REQUIRED", "Navigation items with list[] children must use Type:\"classes\".", { path: `${itemPath}.Type`, title, value: type ?? null });
        visit(item.list, `${itemPath}.list`, true);
        continue;
      }
      if (!inGroup && ![1, 16, 32, 103, 105].includes(Number(type))) continue;
      if (Number(type) === 103) {
        const target = safeString(item.LayoutID || item.PageID || item.ListID);
        if (!target || !pagesByLayoutId.has(target)) add(errors, "NAVIGATION_DASHBOARD_TARGET_INVALID", "Dashboard/page navigation must use Type:103 and target an included Pages[].LayoutID.", { path: itemPath, title, target });
      } else if (Number(type) === 105) {
        const target = safeString(item.ListID || item.ProcKey || item.Key);
        if (!target || !formsByKey.has(target)) add(errors, "NAVIGATION_APPROVAL_FORM_TARGET_INVALID", "Approval form navigation must use Type:105 and ListID equal to an included Forms[].Key.", { path: itemPath, title, target });
      } else if (Number(type) === 1) {
        const target = safeString(item.ListID);
        if (!target || !childListsByType.get(1)?.has(target)) add(errors, "NAVIGATION_DATA_LIST_TARGET_INVALID", "Data list navigation must use Type:1 and ListID equal to an included Type 1 child list ID.", { path: itemPath, title, target });
      } else if (Number(type) === 16) {
        const target = safeString(item.ListID);
        if (!target || !childListsByType.get(16)?.has(target)) add(errors, "NAVIGATION_DOCUMENT_LIBRARY_TARGET_INVALID", "Document Library navigation must use Type:16 and ListID equal to an included Type 16 child resource ID.", { path: itemPath, title, target });
      }
    }
  }
  visit(layoutView.sort || layoutView.list || [], "ListSet.LayoutView.sort");
}

function validateSchemaForbiddenAppIds(decoded, errors) {
  const check = (obj, path) => {
    if (isObject(obj) && Object.prototype.hasOwnProperty.call(obj, "AppID")) {
      add(errors, "YAPK_SCHEMA_FORBIDDEN_APPID", "Do not emit AppID on decoded AppPackageInfo objects where schemas/yapk-schema.json does not allow it.", { path: `${path}.AppID` });
    }
  };
  check(decoded.ListSet, "ListSet");
  for (const [pageIndex, page] of asArray(decoded.Pages).entries()) check(page, `Pages[${pageIndex}]`);
  for (const [childIndex, child] of asArray(decoded.Childs).entries()) {
    check(child.List, `Childs[${childIndex}].List`);
    for (const [fieldIndex, field] of asArray(child.Fields).entries()) check(field, `Childs[${childIndex}].Fields[${fieldIndex}]`);
    for (const [layoutIndex, layout] of asArray(child.Layouts).entries()) check(layout, `Childs[${childIndex}].Layouts[${layoutIndex}]`);
  }
}

function validateGeneratedYapkIds(decoded, errors) {
  const listIds = new Map();
  const fieldIds = new Map();
  const layoutIds = new Map();
  const resourceIds = new Map();
  const safeId = (value, path, longAsString = false) => {
    if (value === undefined || value === null || value === "") return;
    if (typeof value === "string" && LOCAL_FALLBACK_ID_RE.test(value)) add(errors, "LOCAL_FALLBACK_ID_FORBIDDEN", "Generated YAPK resource IDs must be API-issued IDs, not local fallback IDs.", { path, value });
    if (longAsString) {
      if (typeof value !== "string" || !/^\d+$/.test(value)) add(errors, "INVALID_ID_TYPE", "YAPK LongAsString ID must be a numeric string.", { path, actualType: Array.isArray(value) ? "array" : value === null ? "null" : typeof value });
      else if (!API_ISSUED_INTEGER_RE.test(value)) add(errors, "API_ISSUED_ID_REQUIRED", "Generated YAPK LongAsString IDs must be API-issued 64-bit numeric strings.", { path });
      else if (/0000$/.test(value)) add(errors, "ROUNDED_ID_FORBIDDEN", "Generated YAPK IDs look rounded; preserve exact API-issued 64-bit IDs losslessly.", { path, value });
      return;
    }
    if (typeof value === "string" && /^\d{16,}$/.test(value)) {
      if (/0000$/.test(value)) add(errors, "ROUNDED_ID_FORBIDDEN", "Generated YAPK IDs look rounded; preserve exact API-issued 64-bit IDs losslessly.", { path, value });
      return;
    }
    if (typeof value === "string" && /^\d+$/.test(value)) add(errors, "API_ISSUED_ID_REQUIRED", "Generated YAPK object IDs must be API-issued 64-bit numeric IDs.", { path });
    if (!Number.isInteger(value)) add(errors, "INVALID_ID_TYPE", "YAPK integer ID must be a JSON integer or preserved raw large integer token.", { path, actualType: Array.isArray(value) ? "array" : value === null ? "null" : typeof value });
    else if (!Number.isSafeInteger(value)) add(errors, "UNSAFE_INTEGER_ID", "YAPK integer ID was parsed as an unsafe JavaScript number; preserve 64-bit IDs without rounding.", { path, value });
    else if (Math.abs(value) < 1000000000000000) add(errors, "API_ISSUED_ID_REQUIRED", "Generated YAPK object IDs must be API-issued 64-bit numeric IDs.", { path, value });
  };
  const duplicate = (seen, value, code, message, detail) => {
    const key = String(value);
    if (!key) return;
    const previous = seen.get(key);
    if (previous) add(errors, code, message, { value: key, previousPath: previous.path, ...detail });
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
      duplicate(resourceIds, resource.ID, "DUPLICATE_RESOURCE_ID", "LayoutInResources ID values must be globally unique.", { path: `Pages[${index}].LayoutInResources[${resourceIndex}].ID`, layout: page.Title || null });
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

function parseExt2(value) {
  if (value == null || value === "") return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  try { return JSON.parse(value); } catch { return null; }
}

function validateDashboardShells(decoded, errors) {
  const pageLayoutIds = new Set(asArray(decoded.Pages).map((page) => String(page?.LayoutID || "")).filter(Boolean));
  const rootListSetId = String(decoded?.ListSet?.ListID || "");
  for (const [pageIndex, page] of asArray(decoded.Pages).entries()) {
    const path = `Pages[${pageIndex}]`;
    if (Number(page.Type) !== 103) add(errors, "DASHBOARD_TYPE_103_REQUIRED", "Generated dashboards must use current dashboard Type 103.", { path: `${path}.Type`, value: page.Type ?? null });
    if (rootListSetId && String(page.ListID || "") !== rootListSetId) {
      add(errors, "YAPK_DASHBOARD_PAGE_ROOT_BINDING_INVALID", "Dashboard/App page records must be rooted to decoded.ListSet.ListID; LayoutID remains the page layout resource ID.", { path: `${path}.ListID`, title: page.Title || null, expected: rootListSetId, actual: page.ListID ?? null, layoutId: page.LayoutID ?? null });
    }
    if (page.LayoutView !== null && page.LayoutView !== undefined) add(errors, "DASHBOARD_LAYOUTVIEW_MUST_BE_NULL", "Current dashboard pages must keep LayoutView null and store JSON in LayoutInResources[0].Resource.", { path: `${path}.LayoutView` });
    const ext2 = parseExt2(page.Ext2);
    if (!ext2 || ext2.src !== true) add(errors, "DASHBOARD_EXT2_SRC_MARKER_MISSING", "Current dashboard pages require Ext2 containing {\"src\":true}.", { path: `${path}.Ext2` });
    const resource = asArray(page.LayoutInResources)[0];
    if (!resource) {
      add(errors, "DASHBOARD_LAYOUT_RESOURCE_MISSING", "Current dashboard pages require LayoutInResources[0].", { path: `${path}.LayoutInResources` });
      continue;
    }
    if (String(resource.ID) !== String(page.LayoutID) || String(resource.RefId) !== String(page.LayoutID)) {
      add(errors, "DASHBOARD_LAYOUT_RESOURCE_ID_MISMATCH", "LayoutInResources[0].ID and RefId must equal the page LayoutID.", { path: `${path}.LayoutInResources[0]`, layoutId: String(page.LayoutID || "") });
    }
    let parsed = null;
    try { parsed = JSON.parse(resource.Resource); } catch {
      add(errors, "DASHBOARD_RESOURCE_JSON_INVALID", "Dashboard LayoutInResources[0].Resource must be parseable JSON.", { path: `${path}.LayoutInResources[0].Resource` });
    }
    if (parsed) {
      validateDashboardResourceShape(parsed, `${path}.LayoutInResources[0].Resource`, errors);
      validateDashboardSummaryPattern(parsed, `${path}.LayoutInResources[0].Resource`, errors, page.Title || "");
      if (!hasMainContent(parsed) && !hasRootThreeColumnWorkspaceShell(parsed)) {
        add(errors, "DASHBOARD_MAIN_CONTENT_MISSING", "Dashboard JSON must contain Main > Content for standard dashboards, or a root three_column_workspace_shell for three-column workspace dashboards.", { path: `${path}.LayoutInResources[0].Resource` });
      }
    }
  }
  for (const [groupIndex, group] of asArray(decoded.Groups).entries()) {
    const candidates = [group.LayoutID, group.RefId, group.PageID, group.PageLayoutID, group.TargetID, group.Value].filter(Boolean).map(String);
    for (const candidate of candidates) {
      if (/^\d+$/.test(candidate) && !pageLayoutIds.has(candidate)) add(errors, "DASHBOARD_NAVIGATION_LAYOUT_TARGET_MISSING", "Navigation entries that point at dashboards must target an included dashboard LayoutID.", { path: `Groups[${groupIndex}]`, layoutId: candidate });
    }
  }
}

function validateDashboardResourceShape(parsed, path, errors) {
  if (!isObject(parsed)) return;
  if (hasIdentity(parsed, "Main")) {
    add(errors, "DASHBOARD_RESOURCE_WRAPPER_MISSING", "Dashboard Resource must be the full page wrapper with children/attrs/title/ver/filterVars/tempVars/exts/actions, not the direct Main container.", { path });
  }
  const missing = DEFAULT_DASHBOARD_RESOURCE_KEYS.filter((key) => key === "actions" ? false : !(key in parsed));
  if (missing.length) add(errors, "DASHBOARD_RESOURCE_REQUIRED_KEYS_MISSING", "Dashboard Resource wrapper is missing required export-style keys.", { path, missing });
  const topChildren = asArray(parsed.children);
  const hasRootWorkspaceShell = hasRootThreeColumnWorkspaceShell(parsed);
  const main = topChildren.find((child) => hasIdentity(child, "Main"));
  let content = null;
  if (!main && !hasRootWorkspaceShell) {
    add(errors, "DASHBOARD_MAIN_CONTENT_NOT_IN_CHILDREN", "Dashboard Main container must be a top-level child of standard dashboard pages; three-column workspace dashboards must use a root three_column_workspace_shell instead.", { path });
    return;
  }
  if (main) {
    content = asArray(main.children).find((child) => hasIdentity(child, "Content"));
    if (!content) add(errors, "DASHBOARD_MAIN_CONTENT_NOT_IN_CHILDREN", "Dashboard Content container must be inside the top-level Main container for standard dashboard pages.", { path });
  }
  const pagePadding = parsed.attrs?.container?.padding ?? parsed.attrs?.style?.padding ?? parsed.attrs?.padding;
  if (!isZeroPadding(pagePadding)) add(errors, "DASHBOARD_PAGE_PADDING_MISSING", "Dashboard page content-area padding should be explicitly zero; spacing belongs in Main > Content for Style 1 dashboards or in the root shell for Style 2 workspace dashboards.", { path: `${path}.attrs.container.padding` });
  if (content && dashboardUsesV11Template(parsed)) validateDashboardV11ContentPadding(content, `${path}.Main.Content`, errors);
  if (hasRootWorkspaceShell && !pageContentWidthIsFull(parsed)) {
    add(errors, "THREE_COLUMN_PAGE_WIDTH_NOT_FULL", "Three-column workspace dashboard pages must set content width to Full Width.", { path: `${path}.attrs.contentWidth` });
  }
  walkControls(parsed, (control) => {
    const width = control?.attrs?.style?.width ?? control?.style?.width;
    if (String(width || "").trim() === "100%") {
      add(errors, "DASHBOARD_CONTAINER_INVENTED_WIDTH_STYLE", "Container controls should use export-backed width settings rather than invented CSS width: 100%.", { path, control: control?.name || control?.label || control?.id || null });
    }
  });
}

function isZeroPadding(value) {
  if (value === 0 || value === "0" || value === "0px" || value === "--sp--s0") return true;
  if (Array.isArray(value)) return value.every((item) => item === null || isZeroPadding(item));
  if (isObject(value)) return Object.values(value).every(isZeroPadding);
  return false;
}

let cachedDashboardV11ContentPadding = undefined;

function dashboardUsesV11Template(resource) {
  return identityCandidates(resource).some((candidate) => String(candidate) === DASHBOARD_LAYOUT_TEMPLATE_ID);
}

function getDashboardV11ContentPaddingContract() {
  if (cachedDashboardV11ContentPadding !== undefined) return cachedDashboardV11ContentPadding;
  cachedDashboardV11ContentPadding = null;
  try {
    const registryPath = path.join(__dirname, "docs/reference/dashboard-page-layout-templates.json");
    const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    const template = asArray(registry.templates).find((item) => item?.id === DASHBOARD_LAYOUT_TEMPLATE_ID) || asArray(registry.templates)[0];
    const content = findFirstByIdentity(template?.template?.parsedResource, "content") || findFirstByIdentity(template?.template?.parsedResource, "Content");
    cachedDashboardV11ContentPadding = content ? {
      container: content.attrs?.container?.padding,
      common: content.attrs?.common?.padding,
      style: content.attrs?.style?.padding,
    } : null;
  } catch {
    cachedDashboardV11ContentPadding = null;
  }
  return cachedDashboardV11ContentPadding;
}

function findFirstByIdentity(root, expected) {
  let found = null;
  const visit = (node) => {
    if (!node || typeof node !== "object" || found) return;
    if (hasIdentity(node, expected)) {
      found = node;
      return;
    }
    for (const child of asArray(node.children)) visit(child);
  };
  visit(root);
  return found;
}

function validateDashboardV11ContentPadding(content, pointer, errors) {
  const expected = getDashboardV11ContentPaddingContract();
  if (!expected) return;
  const actual = {
    container: content.attrs?.container?.padding,
    common: content.attrs?.common?.padding,
    style: content.attrs?.style?.padding,
  };
  for (const key of ["container", "common", "style"]) {
    if (expected[key] === undefined && actual[key] === undefined) continue;
    if (!deepEqualNormalizedPadding(actual[key], expected[key])) {
      add(errors, "DASHBOARD_V11_CONTENT_PADDING_MISMATCH", "Dashboard Page Layouts v1.1 Content container padding must preserve the canonical template; do not force Content padding to 0.", { path: `${pointer}.attrs.${key}.padding`, expected: expected[key] ?? null, actual: actual[key] ?? null });
    }
  }
}

function deepEqualNormalizedPadding(actual, expected) {
  if (actual === undefined && expected === undefined) return true;
  return stableJson(actual ?? null) === stableJson(expected ?? null);
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (isObject(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function hasRootThreeColumnWorkspaceShell(page) {
  const root = asArray(page?.children)[0];
  if (!root || root.id !== "three_column_workspace_shell") return false;
  const panels = asArray(root.children).slice(0, 3);
  if (panels.length < 3) return false;
  const text = panels.map((panel) => JSON.stringify(panel || "").toLowerCase());
  return /left|queue|context|filter|navigation/.test(text[0])
    && /main|content|inbox|ticket|work|list/.test(text[1])
    && /right|detail|information|action/.test(text[2]);
}

function pageContentWidthIsFull(page) {
  const attrs = page?.attrs || {};
  const candidates = [
    attrs.contentWidth,
    attrs.content_width,
    attrs.cw,
    attrs.container?.contentWidth,
    attrs.container?.content_width,
    attrs.container?.cw,
    attrs.style?.contentWidth,
    attrs.style?.cw,
  ].filter((value) => value !== undefined && value !== null && value !== "");
  return candidates.some((value) => /^(full|full-width|100%|fluid)$/i.test(String(value)));
}

function controlName(control) {
  const candidates = [
    control?.nv_label,
    control?.nav_label,
    control?.attrs?.nv_label,
    control?.attrs?.nav_label,
    control?.name,
    control?.Name,
    control?.label,
    control?.Label,
    control?.title,
    control?.Title,
    control?.attrs?.name,
    control?.attrs?.label,
    control?.attrs?.headc?.title?.value,
  ].filter((value) => value !== undefined && value !== null && String(value).trim() !== "").map(String);
  return candidates.find((value) => !DEFAULT_CONTROL_NAME_RE.test(value)) || candidates[0] || "";
}

const DEFAULT_CONTROL_NAME_RE = /^(Container|Grid|Text|Dynamic field|Dynamic user|Kanban|Collection|Button|Summary|Icon|Text Editor)(\s*\d+)?$/i;

function isDefaultControlName(control) {
  return DEFAULT_CONTROL_NAME_RE.test(controlName(control));
}

function isSummaryControl(control) {
  const type = String(control?.type || control?.Type || "").toLowerCase();
  return type === "summary" || type === "summary-card" || type === "summary_control" || type === "report-summary";
}

function isLikelyKpiNumber(control) {
  const value = control?.attrs?.headc?.title?.value ?? control?.attrs?.title?.value ?? control?.value;
  return typeof value === "string" && /^(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?%?$/.test(value.trim());
}

function hasSaveVar(control) {
  return Boolean(control?.attrs?.save_var || control?.attrs?.saveVar || control?.save_var || control?.saveVar);
}

function textUsesVariable(control, tempVars) {
  const title = control?.attrs?.headc?.title || control?.attrs?.title || {};
  const raw = JSON.stringify(title);
  return tempVars.some((name) => name && raw.includes(name)) || Boolean(title.variable || title.vars || title.expression);
}

function validateDashboardSummaryPattern(parsed, path, errors, title) {
  const tempVars = asArray(parsed.tempVars).map((item) => String(item?.name || item?.key || item?.id || item?.value || "")).filter(Boolean);
  const controls = [];
  walkControls(parsed, (control) => controls.push(control));
  const summaries = controls.filter(isSummaryControl);
  const kpiNumbers = controls.filter(isLikelyKpiNumber);
  const summarySaveVars = summaries.filter(hasSaveVar);
  const visibleTempText = controls.filter((control) => control?.type === "heading" && textUsesVariable(control, tempVars));
  const shouldCheck = /Dashboard|Overview|Executive|Management|KPI|Summary/i.test(title) || summaries.length || kpiNumbers.length >= 3;
  if (!shouldCheck) return;
  for (const control of kpiNumbers) {
    if (!textUsesVariable(control, tempVars)) {
      add(errors, "SUMMARY_CARD_STATIC_VALUE", "KPI summary card values must be bound to Summary-saved temporary variables, not static sample text.", { path, control: controlName(control), value: control?.attrs?.headc?.title?.value ?? null });
    }
  }
  if (kpiNumbers.length >= 3 && summaries.length === 0) add(errors, "SUMMARY_CONTROL_MISSING", "Aggregate KPI cards require hidden Summary controls as data sources.", { path });
  if (summaries.length && summarySaveVars.length < summaries.length) add(errors, "SUMMARY_CONTROL_SAVE_VAR_MISSING", "Every Summary control used for KPI cards must save its value into a temp variable.", { path });
  if (summaries.length && tempVars.length === 0) add(errors, "SUMMARY_TEMP_VAR_MISSING", "Dashboard KPI summary pattern requires named temp variables.", { path });
  if (kpiNumbers.length >= 3 && visibleTempText.length < Math.min(kpiNumbers.length, summarySaveVars.length || kpiNumbers.length)) add(errors, "SUMMARY_VALUE_BINDING_MISSING", "Visible KPI value Text controls must bind to Summary-populated temp variables.", { path });
  for (const control of controls) {
    if (isDefaultControlName(control) && /summary|kpi|card|container|grid|text/i.test(controlName(control))) {
      add(errors, "KPI_CONTROL_DEFAULT_NAME", "Summary/KPI section controls must use meaningful Navigator names, not defaults.", { path, control: controlName(control) });
    }
  }
}

function hasMainContent(node) {
  if (!node || typeof node !== "object") return false;
  if (hasIdentity(node, "Main") && Array.isArray(node.children) && node.children.some((child) => hasIdentity(child, "Content"))) return true;
  return asArray(node.children).some(hasMainContent);
}

function identityCandidates(control) {
  return [
    control?.id,
    control?.ID,
    control?.key,
    control?.Key,
    control?.name,
    control?.Name,
    control?.label,
    control?.Label,
    control?.title,
    control?.Title,
    control?.nv_label,
    control?.nvLabel,
    control?.nav_label,
    control?.navLabel,
    control?.derivedFromDashboardPageLayoutTemplate,
    control?.derivedFromGoldenReference,
    control?.goldenReferenceId,
    control?.attrs?.id,
    control?.attrs?.ID,
    control?.attrs?.key,
    control?.attrs?.Key,
    control?.attrs?.name,
    control?.attrs?.Name,
    control?.attrs?.label,
    control?.attrs?.Label,
    control?.attrs?.title,
    control?.attrs?.Title,
    control?.attrs?.nv_label,
    control?.attrs?.nvLabel,
    control?.attrs?.nav_label,
    control?.attrs?.navLabel,
    control?.attrs?.derivedFromDashboardPageLayoutTemplate,
    control?.attrs?.derivedFromGoldenReference,
    control?.attrs?.goldenReferenceId,
  ].filter((value) => value !== undefined && value !== null && String(value).trim() !== "").map(String);
}

function hasIdentity(control, expected) {
  const normalizedExpected = normalizeIdentity(expected);
  return identityCandidates(control).some((candidate) => normalizeIdentity(candidate) === normalizedExpected);
}

function normalizeIdentity(value) {
  return String(value || "").trim().toLowerCase();
}

function fieldsByList(decoded) {
  const out = new Map();
  for (const child of asArray(decoded.Childs)) {
    const listId = String(child.List?.ListID || "");
    if (!listId) continue;
    const fields = new Set();
    for (const field of asArray(child.Fields)) {
      for (const candidate of [field.FieldName, field.InternalName, field.DisplayName, field.FieldID].filter(Boolean)) fields.add(String(candidate));
    }
    out.set(listId, fields);
  }
  return out;
}

function walkControls(node, visitor) {
  if (!node || typeof node !== "object") return;
  visitor(node);
  for (const child of asArray(node.children)) walkControls(child, visitor);
}

function validateDashboardDataTables(decoded, errors) {
  const maps = fieldsByList(decoded);
  for (const [pageIndex, page] of asArray(decoded.Pages).entries()) {
    for (const [resourceIndex, resource] of asArray(page.LayoutInResources).entries()) {
      if (typeof resource.Resource !== "string" || !resource.Resource.trim()) continue;
      let parsed;
      try { parsed = JSON.parse(resource.Resource); } catch { continue; }
      walkControls(parsed, (control) => {
        if (control?.type !== "data-list") return;
        const pointer = `Pages[${pageIndex}].LayoutInResources[${resourceIndex}].Resource`;
        const listRef = control.attrs?.data?.list || {};
        if (!control.attrs?.data?.list) add(errors, "DASHBOARD_DATA_TABLE_SOURCE_LIST_MISSING", "Dashboard Data table controls require attrs.data.list.", { path: `${pointer}.attrs.data.list` });
        if (!Array.isArray(control.attrs?.listarr) || control.attrs.listarr.length === 0) add(errors, "DASHBOARD_DATA_TABLE_LISTARR_MISSING", "Dashboard Data table controls require non-empty attrs.listarr.", { path: `${pointer}.attrs.listarr` });
        for (const key of ["AppID", "ListID", "Type", "Title", "ListSetID"]) {
          if (listRef[key] === undefined || listRef[key] === null || String(listRef[key]) === "") add(errors, "YAPK_DASHBOARD_DATA_TABLE_SOURCE_KEY_MISSING", "Dashboard Data table attrs.data.list must include AppID, ListID, Type, Title, and ListSetID.", { path: `${pointer}.attrs.data.list.${key}`, key });
        }
        const listId = String(listRef.ListID || "");
        const fields = maps.get(listId);
        for (const [columnIndex, column] of asArray(control.attrs?.listarr).entries()) {
          const field = column?.Field === undefined || column?.Field === null ? "" : String(column.Field);
          if (column?.FieldName === undefined || column?.FieldName === null || String(column.FieldName) === "") add(errors, "DASHBOARD_DATA_TABLE_FIELDNAME_MISSING", "Dashboard Data table display columns must include FieldName labels.", { path: `${pointer}.attrs.listarr[${columnIndex}].FieldName`, listId });
          if (!field) add(errors, "DASHBOARD_DATA_TABLE_DISPLAY_FIELD_BINDING_MISSING", "Dashboard Data table display columns must include Field source bindings; FieldName is only the visible label.", { path: `${pointer}.attrs.listarr[${columnIndex}]`, listId });
          else if (fields && !fields.has(field) && !SYSTEM_DASHBOARD_FIELDS.has(field)) add(errors, "DASHBOARD_DATA_TABLE_DISPLAY_FIELD_UNRESOLVED", "Dashboard Data table Field binding must resolve to the source list or a known system field.", { path: `${pointer}.attrs.listarr[${columnIndex}].Field`, listId, field });
        }
      });
    }
  }
}

function validateNativeTextControls(decoded, errors) {
  for (const [pageIndex, page] of asArray(decoded.Pages).entries()) {
    for (const [resourceIndex, resource] of asArray(page.LayoutInResources).entries()) {
      if (typeof resource.Resource !== "string" || !resource.Resource.trim()) continue;
      let parsed;
      try { parsed = JSON.parse(resource.Resource); } catch { continue; }
      walkControls(parsed, (control) => {
        const explicitType = String(control?.type || "").toLowerCase();
        const looksLikeText = explicitType === "heading" || explicitType === "text" || explicitType === "text-editor";
        const pointer = `Pages[${pageIndex}].LayoutInResources[${resourceIndex}].Resource`;
        if (control?.type === "text") add(errors, "NATIVE_TEXT_CONTROL_TYPE_INVALID", "Generated dashboards/forms must not emit ad hoc type:\"text\" controls; use native heading/Text shape.", { path: pointer });
        if (!looksLikeText) return;
        if (control.type !== "heading") add(errors, "NATIVE_TEXT_CONTROL_TYPE_INVALID", "Generated Text controls must use type:\"heading\".", { path: pointer, type: control.type ?? null });
        if (control.label !== "Text") add(errors, "NATIVE_TEXT_CONTROL_LABEL_INVALID", "Generated Text controls must use label:\"Text\".", { path: pointer, label: control.label ?? null });
        const titleNode = control.attrs?.headc?.title;
        if (!titleNode || (titleNode.value === undefined && titleNode.variable === undefined)) add(errors, "NATIVE_TEXT_CONTROL_TITLE_MISSING", "Generated Text controls require attrs.headc.title.value or attrs.headc.title.variable.", { path: pointer });
        const ty = control.attrs?.heads?.ty;
        const tyValid = Array.isArray(ty) ? ty.length === 2 && ty[0] === null && typeof ty[1] === "string" : isObject(ty);
        if (!tyValid) add(errors, "NATIVE_TEXT_CONTROL_TYPOGRAPHY_INVALID", "Generated Text controls require attrs.heads.ty as [null, token] or export-backed typography object.", { path: pointer });
        if (typeof control.attrs?.heads?.color !== "string") add(errors, "NATIVE_TEXT_CONTROL_COLOR_INVALID", "Generated Text controls require attrs.heads.color as a plain string.", { path: pointer });
        const width = control.attrs?.style?.width ?? control.style?.width ?? control.width;
        if (width && String(width).includes("100%")) add(errors, "NATIVE_TEXT_CONTROL_WIDTH_NOT_INLINE", "Generated Text controls should use inline width by default.", { path: pointer, width });
      });
    }
  }
}

function parseResourceLike(value) {
  if (!value || typeof value !== "string" || !value.trim()) return null;
  try { return JSON.parse(value); } catch { return null; }
}

function surfaceHasSummaryControl(surface) {
  let found = false;
  walk(surface, (node) => {
    if (found || !isObject(node)) return;
    if (isSummaryControl(node)) found = true;
  });
  return found;
}

function validateUnsupportedSummarySurfaces(decoded, errors) {
  for (const [index, form] of asArray(decoded.Forms).entries()) {
    const candidates = [
      form.DefResource,
      form.Resource,
      form.FormResource,
      form.LayoutView,
      form.formdef && JSON.stringify(form.formdef),
    ];
    for (const candidate of candidates) {
      const parsed = typeof candidate === "string" && candidate.trim().startsWith("{") ? parseResourceLike(candidate) : candidate;
      if (parsed && surfaceHasSummaryControl(parsed)) {
        add(errors, "SUMMARY_CONTROL_UNSUPPORTED_SURFACE", "Summary controls are not available on approval forms; use Summary only on dashboards and supported Data List custom forms.", { path: `Forms[${index}]` });
        add(errors, "SUMMARY_CARD_STANDARD_SCOPE_INVALID", "Summary-card standard cannot be satisfied on an approval form host.", { path: `Forms[${index}]` });
        break;
      }
    }
  }
  for (const [childIndex, child] of asArray(decoded.Childs).entries()) {
    for (const [publicIndex, form] of asArray(child.PublicForms).entries()) {
      const parsed = parseResourceLike(form?.DefResource || form?.Resource || form?.LayoutView || "");
      if (parsed && surfaceHasSummaryControl(parsed)) {
        add(errors, "SUMMARY_CONTROL_UNSUPPORTED_SURFACE", "Summary controls are not available on Data List public forms; use Summary only on dashboards and supported Data List custom forms.", { path: `Childs[${childIndex}].PublicForms[${publicIndex}]` });
        add(errors, "SUMMARY_CARD_STANDARD_SCOPE_INVALID", "Summary-card standard cannot be satisfied on a Data List public form host.", { path: `Childs[${childIndex}].PublicForms[${publicIndex}]` });
      }
    }
  }
}

function validate(file, baselineFile = null) {
  const errors = [];
  const warnings = [];
  const wrapper = readWrapper(file);
  if (!isObject(wrapper)) add(errors, "YAPK_WRAPPER_NOT_OBJECT", "Top-level package must be a JSON object.");
  for (const key of WRAPPER_REQUIRED) if (!(key in wrapper)) add(errors, "YAPK_REQUIRED_KEY_MISSING", `Missing required key ${key}.`);
  for (const finding of validatePackageWrapperIcon(wrapper).findings) add(errors, finding.code, finding.message, finding);
  if (typeof wrapper.TenantID !== "string" || !NUMERIC_STRING_RE.test(wrapper.TenantID || "")) add(errors, "YAPK_TENANT_ID_INVALID", "Generated YAPK TenantID must be a LongAsString numeric string.");
  if (typeof wrapper.ListID !== "string" || !NUMERIC_STRING_RE.test(wrapper.ListID || "")) add(errors, "YAPK_LIST_ID_INVALID", "Generated YAPK top-level ListID must be a LongAsString numeric string.");
  if (!["30", "41"].includes(String(wrapper.AppID))) add(errors, "YAPK_APPID_UNSUPPORTED", "Generated YAPK wrapper AppID must be one of the product schema supported values: 30 or 41.", { value: wrapper.AppID ?? null });
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource) add(errors, "YAPK_RESOURCE_INVALID", "Resource must be a non-empty base64 string.");
  if (typeof wrapper.Resource === "string" && !isBase64(wrapper.Resource)) add(errors, "YAPK_RESOURCE_BASE64_INVALID", "Resource must be canonical base64 text.");
  if (String(wrapper.Resource || "").startsWith("[______gizp______]")) add(errors, "YAPK_RESOURCE_USES_YAP_GZIP_PREFIX", ".yapk Resource must not use .yap gzip prefix.");
  if (typeof wrapper.TenantID !== "string" || !NUMERIC_STRING_RE.test(wrapper.TenantID || "")) add(errors, "YAPK_TENANT_ID_INVALID", "TenantID should be a numeric string.");
  if (typeof wrapper.ListID !== "string" || !NUMERIC_STRING_RE.test(wrapper.ListID || "")) add(errors, "YAPK_LIST_ID_INVALID", "ListID should be a numeric string.");
  if (typeof wrapper.Date !== "string" || !UTC_DATE_RE.test(wrapper.Date || "")) add(errors, "YAPK_DATE_FORMAT_INVALID", "Date should be UTC yyyy-MM-ddTHH:mm:ssZ.");
  const signBytes = typeof wrapper.Sign === "string" ? Buffer.from(wrapper.Sign || "", "base64") : Buffer.alloc(0);
  if (typeof wrapper.Sign !== "string" || signBytes.length !== 32) add(warnings, "YAPK_SIGN_UNEXPECTED_SHAPE", "Sign is expected to be a 32-byte base64 value in observed packages.");
  if (typeof wrapper.Sign === "string" && (/placeholder/i.test(wrapper.Sign) || (signBytes.length === 32 && signBytes.every((byte) => byte === 0)))) {
    add(errors, "YAPK_SIGN_PLACEHOLDER", "Generated .yapk packages must not use placeholder or all-zero Sign values for handoff, upload, install, or upgrade. Use setsign and verifysign when API/OAuth access is available.", { path: "Sign" });
  }

  const resource = decodeBrotliResource(wrapper.Resource, errors);
  const appValidation = resource.decoded ? validateAppPackage(resource.decoded, errors, warnings, wrapper.AppID) : { decodedKeys: [], counts: null };

  const metadata = {
    redactedIdentityPresent: {
      PackageId: Boolean(wrapper.PackageId),
      TenantID: Boolean(wrapper.TenantID),
      AppID: Boolean(wrapper.AppID),
      ListID: Boolean(wrapper.ListID),
    },
    titlePresent: Boolean(wrapper.Title),
    versionPresent: Boolean(wrapper.Version),
    datePresent: Boolean(wrapper.Date),
    signByteLength: Buffer.from(wrapper.Sign || "", "base64").length,
    resourceBase64Length: typeof wrapper.Resource === "string" ? wrapper.Resource.length : 0,
    resourceBytes: resource.resourceBytes,
    resourceEntropy: entropy(Buffer.from(wrapper.Resource || "", "base64")),
    brotliSuccess: Boolean(resource.decoded),
    decodedTextBytes: resource.decodedTextBytes,
    decodedKeys: appValidation.decodedKeys,
    decodedCounts: appValidation.counts,
    decodeAttempts: resource.attempts,
  };

  add(warnings, "YAPK_CONTENT_GENERATION_RUNTIME_PROOF_REQUIRED", "Even if Resource decodes and validates, content generation requires edit -> Brotli encode -> sign -> verify -> runtime upgrade proof.");

  let baselineComparison = null;
  if (baselineFile) {
    const baseline = readWrapper(baselineFile);
    const baselineBytes = isBase64(baseline.Resource) ? Buffer.from(baseline.Resource, "base64") : Buffer.alloc(0);
    const resourceBytes = isBase64(wrapper.Resource) ? Buffer.from(wrapper.Resource, "base64") : Buffer.alloc(0);
    const wrapperKeys = Array.from(new Set([...Object.keys(baseline), ...Object.keys(wrapper)])).sort();
    const metadataChangedFields = changedKeys(baseline, wrapper, ["Title", "Description", "IconUrl", "Notes", "Author", "Date", "Version"]);
    const resourceChanged = JSON.stringify(wrapper.Resource) !== JSON.stringify(baseline.Resource);
    baselineComparison = {
      wrapperChangedFields: changedKeys(baseline, wrapper, wrapperKeys),
      metadataChangedFields,
      resourceChanged,
      signChanged: JSON.stringify(wrapper.Sign) !== JSON.stringify(baseline.Sign),
      resourceStats: compareBuffers(baselineBytes, resourceBytes),
    };
    if (!resourceChanged && metadataChangedFields.length) add(warnings, "YAPK_METADATA_ONLY_NO_CONTENT_CHANGE", "Metadata changed while Resource is unchanged. This is a metadata-only package; app content is unchanged.");
    if (resourceChanged) add(warnings, "YAPK_RESOURCE_CHANGED_REQUIRES_RUNTIME_PROOF", "Resource differs from baseline. Treat as Yeeflow-generated or experimental until edit/encode/sign/runtime proof succeeds.");
  }

  return {
    status: errors.length ? "fail" : "pass",
    file,
    baselineFile,
    metadata,
    baselineComparison,
    errors,
    warnings,
  };
}

const args = process.argv.slice(2);
if (!args.length || args.includes("--help") || args.includes("-h")) usage();
let file = null;
let baseline = null;
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--baseline") baseline = args[++i];
  else if (!file) file = args[i];
  else usage();
}
if (!file) usage();

try {
  const report = validate(file, baseline);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
} catch (error) {
  console.log(JSON.stringify({ status: "fail", errors: [{ code: "YAPK_VALIDATION_EXCEPTION", message: error.message }] }, null, 2));
  process.exit(1);
}

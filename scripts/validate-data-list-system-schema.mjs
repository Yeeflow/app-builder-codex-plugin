#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const SUPPORTED_TYPES = new Set([
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

const SYSTEM_QUERY_FIELDS = new Set(["Title", "ListDataID", "CreatedBy", "ModifiedBy", "Created", "Modified"]);
const CHOICE_FIELD_TYPES = new Set(["select", "radio", "checkbox", "tag"]);
const MULTI_CHOICE_FIELD_TYPES = new Set(["checkbox", "tag"]);
const GENERIC_CHOICE_RE = /^(option|choice|item|value|select|test|sample|demo)\s*\d*$/i;
const STORAGE_FIELD_TYPES = new Map([
  ["Text", "Text"],
  ["Decimal", "Decimal"],
  ["Datetime", "Datetime"],
  ["Bigint", "Bigint"],
  ["Bit", "Bit"],
]);

function parseArgs(argv) {
  const args = { packagePath: null, strictGeneratedList: false, json: false };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--strict-generated-list") {
      args.strictGeneratedList = true;
    } else if (arg === "--json") {
      args.json = true;
    } else if (!args.packagePath) {
      args.packagePath = arg;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!args.packagePath) {
    throw new Error("Usage: node scripts/validate-data-list-system-schema.mjs <package.yapk|package.yap> [--strict-generated-list] [--json]");
  }
  return args;
}

function quoteLargeIntegers(jsonText) {
  let out = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < jsonText.length;) {
    const ch = jsonText[i];
    if (inString) {
      out += ch;
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === "\"") {
        inString = false;
      }
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
        out += /^-?\d{16,}$/.test(token) ? `"${token}"` : token;
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJsonLosslessText(text) {
  const cleaned = text.replace(/^\uFEFF/, "");
  return JSON.parse(quoteLargeIntegers(cleaned));
}

function brotliDecodeTolerant(buffer) {
  try {
    return zlib.brotliDecompressSync(buffer).toString("utf8");
  } catch {
    const script = `
const zlib = require("zlib");
let chunks = [];
process.stdin.on("data", c => chunks.push(c));
process.stdin.on("end", () => {
  const input = Buffer.concat(chunks);
  const stream = zlib.createBrotliDecompress();
  let out = [];
  stream.on("data", c => out.push(c));
  stream.on("error", () => {
    const text = Buffer.concat(out).toString("utf8");
    if (text.trim()) process.stdout.write(text);
  });
  stream.on("end", () => process.stdout.write(Buffer.concat(out).toString("utf8")));
  stream.end(input);
});
`;
    const result = spawnSync(process.execPath, ["-e", script], {
      input: buffer,
      maxBuffer: 200 * 1024 * 1024,
    });
    const text = result.stdout.toString("utf8");
    if (!text.trim()) {
      throw new Error("Brotli Resource decode failed and tolerant decoder produced no JSON");
    }
    return text;
  }
}

function decodePackage(packagePath) {
  const raw = fs.readFileSync(packagePath, "utf8");
  const wrapper = parseJsonLosslessText(raw);
  const ext = path.extname(packagePath).toLowerCase();
  if (ext === ".yapk") {
    const resourceText = brotliDecodeTolerant(Buffer.from(wrapper.Resource || "", "base64"));
    return { wrapper, data: parseJsonLosslessText(resourceText), kind: "yapk" };
  }
  if (ext === ".yap") {
    const resource = String(wrapper.Resource || "");
    const prefix = "[______gizp______]";
    const payload = resource.startsWith(prefix) ? resource.slice(prefix.length) : resource;
    const resourceText = zlib.gunzipSync(Buffer.from(payload, "base64")).toString("utf8");
    const result = parseJsonLosslessText(resourceText);
    const data = typeof result.Data === "string" ? parseJsonLosslessText(result.Data) : result.Data;
    return { wrapper, data, result, kind: "yap" };
  }
  throw new Error(`Unsupported package extension: ${ext}`);
}

function parseMaybeJson(value, fallback = null) {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getChildren(decoded) {
  const children = Array.isArray(decoded.data?.Childs) ? decoded.data.Childs : [];
  return children
    .map((child) => {
      const list = child.List || child.ListModel || child;
      const itemRows = list?.Items && typeof list.Items === "object"
        ? Object.entries(list.Items).map(([rowId, row]) => (
          row && typeof row === "object" && !row.ListDataID ? { ListDataID: rowId, ...row } : row
        ))
        : [];
      return {
        title: list?.Title || child.Title || "(untitled list)",
        rawChild: child,
        list,
        fields: child.Fields ?? child.Defs ?? [],
        layouts: child.Layouts ?? [],
        rows: child.ListDatas || child.Datas || itemRows,
      };
    })
    .filter((child) => child.rawChild);
}

function addIssue(issues, level, code, listTitle, message, detail = {}) {
  issues.push({ level, code, listTitle, message, ...detail });
}

function fieldLabel(field) {
  return `${field.DisplayName || field.FieldName || "(unnamed)"} [${field.FieldName || "no FieldName"}]`;
}

function validateSelectionOptions(field, issues, listTitle) {
  if (!CHOICE_FIELD_TYPES.has(field.Type)) return;
  const options = collectRuntimeChoiceOptions(field);
  if (!options.runtimePath) {
    addIssue(
      issues,
      "error",
      "CHOICE_OPTION_RUNTIME_SHAPE_MISSING",
      listTitle,
      `${fieldLabel(field)} must use export-proven Rules.choices; legacy paths such as Rules.Options are ignored by runtime dropdowns.`,
      { legacyPaths: options.legacyPaths },
    );
  }
  const values = options.values;
  if (values.length === 0) {
    addIssue(issues, "error", "SELECT_CHOICES_MISSING", listTitle, `${fieldLabel(field)} has no non-empty option values.`);
    addIssue(issues, "error", "CHOICE_OPTIONS_MISSING", listTitle, `${fieldLabel(field)} has no non-empty option values.`);
    if (MULTI_CHOICE_FIELD_TYPES.has(field.Type)) {
      addIssue(issues, "error", "MULTI_SELECT_OPTIONS_MISSING", listTitle, `${fieldLabel(field)} multi-select style field has no non-empty option values.`);
    }
    return;
  }
  if (options.all.some((value) => !String(value).trim())) {
    addIssue(issues, "error", "CHOICE_OPTION_BLANK", listTitle, `${fieldLabel(field)} includes blank choice option rows.`);
  }
  if (values.some((value) => GENERIC_CHOICE_RE.test(String(value).trim()))) {
    addIssue(issues, "error", "CHOICE_OPTION_GENERIC", listTitle, `${fieldLabel(field)} includes generic placeholder option values instead of business options.`);
  }
}

function collectRuntimeChoiceOptions(field) {
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
  const all = active.flatMap(({ items }) => items).map(choiceOptionValue);
  return {
    all,
    values: all.filter((value) => String(value).trim()),
    runtimePath: runtimeCandidates.find(({ items }) => items.some((item) => String(choiceOptionValue(item)).trim()))?.path || "",
    legacyPaths: legacyCandidates.map(([path]) => path),
  };
}

function choiceOptionValue(item) {
  if (typeof item === "string") return item;
  return item?.value ?? item?.text ?? item?.label ?? item?.Value ?? item?.Name ?? item?.Title ?? "";
}

function normalizeChoiceSampleValues(value) {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  const stringValue = String(value).trim();
  if (!stringValue) return [];
  const parsed = parseMaybeJson(stringValue, null);
  if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
  return stringValue.split(/[;,]/).map((item) => item.trim()).filter(Boolean);
}

function validateLookup(field, issues, listTitle, listById, fieldsByListId) {
  if (field.Type !== "lookup") return;
  const rules = parseMaybeJson(field.Rules, {});
  const targetListId = String(rules?.listid ?? rules?.ListID ?? rules?.listId ?? field.ListSourceID ?? "");
  const displayCandidates = [
    rules?.listfield,
    rules?.ListField,
    rules?.displayField,
    rules?.DisplayField,
    rules?.fieldName,
    rules?.FieldName,
    rules?.field,
    rules?.Field,
    rules?.list_tooltip_field,
    field.ListField,
    field.DisplayField,
  ].filter((value) => value != null && String(value).trim() !== "");
  const targetField = String(displayCandidates[0] || "");
  if (!targetListId || !listById.has(targetListId)) {
    addIssue(issues, "error", "LOOKUP_TARGET_LIST_UNRESOLVED", listTitle, `${fieldLabel(field)} points to a missing lookup list.`);
    addIssue(issues, "error", "LOOKUP_TARGET_LIST_MISSING", listTitle, `${fieldLabel(field)} points to a missing lookup list.`);
    addIssue(issues, "error", "LOOKUP_RULES_INCOMPLETE", listTitle, `${fieldLabel(field)} lookup rules do not resolve to a target list and display field.`);
    return;
  }
  if (!targetField) {
    addIssue(issues, "error", "LOOKUP_DISPLAY_FIELD_MISSING", listTitle, `${fieldLabel(field)} does not select a lookup display field.`);
    addIssue(issues, "error", "LOOKUP_RULES_INCOMPLETE", listTitle, `${fieldLabel(field)} lookup rules do not resolve to a target list and display field.`);
    return;
  }
  if (targetField === "Text0") {
    addIssue(issues, "error", "LOOKUP_DISPLAY_FIELD_TEXT0_INVALID", listTitle, `${fieldLabel(field)} uses Text0 as lookup display field; generated lists must use native Title or another existing target field.`);
  }
  if (!fieldsByListId.get(targetListId)?.has(targetField)) {
    addIssue(issues, "error", "LOOKUP_DISPLAY_FIELD_UNRESOLVED", listTitle, `${fieldLabel(field)} points to a missing lookup display field.`);
    addIssue(issues, "error", "LOOKUP_DISPLAY_FIELD_NOT_FOUND", listTitle, `${fieldLabel(field)} points to a missing lookup display field.`);
  }
}

function lookupTargetListId(field) {
  if (field?.Type !== "lookup") return "";
  const rules = parseMaybeJson(field.Rules, {});
  return String(rules?.listid ?? rules?.ListID ?? rules?.listId ?? field.ListSourceID ?? "");
}

function validateRelationshipModeling(children, issues) {
  const normalizedTitleToList = new Map();
  for (const child of children) {
    const listId = String(child.list.ListID ?? child.list.ID ?? "");
    const key = String(child.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (listId && key) normalizedTitleToList.set(key, { listId, child });
  }
  const masterCandidates = [
    ["vendor", "vendors"],
    ["account", "accounts"],
    ["customer", "customers"],
    ["project", "projects"],
    ["employee", "employees"],
  ];
  for (const [index, child] of children.entries()) {
    const listId = String(child.list.ListID ?? child.list.ID ?? "");
    for (const field of child.fields) {
      const label = `${field.DisplayName || ""} ${field.FieldName || ""} ${field.InternalName || ""}`.toLowerCase();
      for (const [singular, plural] of masterCandidates) {
        const master = normalizedTitleToList.get(plural);
        if (!master || master.listId === listId || !new RegExp(`\\b${singular}\\b`).test(label)) continue;
        if (field.Type === "lookup") {
          const targetListId = lookupTargetListId(field);
          const masterIndex = children.findIndex((candidate) => String(candidate.list.ListID ?? candidate.list.ID ?? "") === targetListId);
          if (targetListId === master.listId && masterIndex > index) {
            addIssue(issues, "error", "DATA_LIST_DEPENDENCY_ORDER_INVALID", child.title, `${fieldLabel(field)} depends on ${master.child.title}, which must be generated before dependent lists.`);
          }
        } else if (["input", "textarea", "select", "radio", "checkbox", "tag"].includes(field.Type)) {
          addIssue(issues, "error", "LOOKUP_RELATIONSHIP_MODELED_AS_TEXT", child.title, `${fieldLabel(field)} appears to reference ${master.child.title}; generated related data should use a lookup field instead of ${field.Type}.`);
        }
      }
    }
  }
}

function visibleFieldFromLayoutItem(item) {
  return String(item?.field || item?.Field || item?.FieldName || "");
}

function validateDefaultViewShape(defaultView, view, child, issues) {
  const ext1 = parseMaybeJson(defaultView.Ext1, {});
  if (ext1?.Url !== "default") {
    addIssue(issues, "error", "DEFAULT_VIEW_EXT1_URL_MISSING", child.title, "Default Type 0 view must set Ext1.Url to default so the runtime materializes it as the default view.");
  }
  const fieldsByName = new Set(child.fields.map((field) => String(field.FieldName || "")).filter(Boolean));
  const layoutItems = Array.isArray(view.layout) ? view.layout : [];
  const queryItems = Array.isArray(view.query) ? view.query : [];
  const queryFields = new Set(queryItems.map(visibleFieldFromLayoutItem).filter(Boolean));
  for (const [index, item] of layoutItems.entries()) {
    const missing = ["FieldID", "FieldName", "DisplayName", "Order", "Mobile", "Show"].filter((key) => item?.[key] === undefined || item?.[key] === null || item?.[key] === "");
    if (missing.length) {
      addIssue(issues, "error", "DEFAULT_VIEW_COLUMN_SHAPE_INCOMPLETE", child.title, `Default view column ${index + 1} is missing ${missing.join(", ")}.`);
    }
    const fieldName = visibleFieldFromLayoutItem(item);
    if (fieldName && !fieldsByName.has(fieldName) && !SYSTEM_QUERY_FIELDS.has(fieldName)) {
      addIssue(issues, "error", "DEFAULT_VIEW_DISPLAY_FIELD_NOT_FOUND", child.title, `Default view display field ${fieldName} does not resolve to a list field.`);
    }
    if (fieldName && !queryFields.has(fieldName)) {
      addIssue(issues, "error", "DEFAULT_VIEW_QUERY_FIELDS_MISSING", child.title, `Default view query must include visible display field ${fieldName}.`);
    }
  }
}

function validateRows(child, issues, listById, rowsByListId) {
  const listId = String(child.list.ListID ?? child.list.ID ?? "");
  const fieldsByName = new Map(child.fields.map((field) => [field.FieldName, field]));
  const rowIds = new Set(child.rows.map((row) => String(row.ListDataID ?? row.ID ?? "")).filter(Boolean));
  if (child.rows.length > 0 && rowIds.size !== child.rows.length) {
    addIssue(issues, "error", "SAMPLE_ROW_ID_DUPLICATE", child.title, "Sample rows contain duplicate or missing row IDs.");
  }
  for (const row of child.rows) {
    for (const [fieldName, value] of Object.entries(row)) {
      const field = fieldsByName.get(fieldName);
      if (field && value !== null && value !== undefined && typeof value !== "string") {
        addIssue(issues, "error", "SAMPLE_VALUE_NOT_STRING", child.title, `${fieldLabel(field)} sample value must serialize as a string for generated YAPK List.Items rows.`);
      }
      if (field && CHOICE_FIELD_TYPES.has(field.Type) && value != null && value !== "") {
        const options = collectRuntimeChoiceOptions(field);
        if (options.runtimePath && options.values.length) {
          const allowed = new Set(options.values.map((option) => String(option).trim()));
          for (const selectedValue of normalizeChoiceSampleValues(value)) {
            if (allowed.has(selectedValue)) continue;
            addIssue(
              issues,
              "error",
              MULTI_CHOICE_FIELD_TYPES.has(field.Type) ? "MULTI_SELECT_SAMPLE_VALUE_NOT_IN_OPTIONS" : "CHOICE_SAMPLE_VALUE_NOT_IN_OPTIONS",
              child.title,
              `${fieldLabel(field)} sample value "${selectedValue}" is not configured in runtime-visible Rules.choices.`,
            );
          }
        }
      }
      if (!field || field.Type !== "lookup" || value == null || value === "") continue;
      const rules = parseMaybeJson(field.Rules, {});
      const targetListId = String(rules?.listid ?? rules?.ListID ?? rules?.listId ?? "");
      const targetRows = rowsByListId.get(targetListId);
      if (targetRows && !targetRows.has(String(value))) {
        addIssue(
          issues,
          "error",
          "SAMPLE_LOOKUP_PARENT_UNRESOLVED",
          child.title,
          `${fieldLabel(field)} sample value does not resolve to a seeded row in ${listById.get(targetListId)?.title || "target list"}.`,
        );
        addIssue(
          issues,
          "error",
          "LOOKUP_SAMPLE_VALUE_UNRESOLVED",
          child.title,
          `${fieldLabel(field)} sample value does not resolve to a seeded row in ${listById.get(targetListId)?.title || "target list"}.`,
        );
        addIssue(
          issues,
          "error",
          "LOOKUP_SAMPLE_TARGET_ROW_MISSING",
          child.title,
          `${fieldLabel(field)} sample value points to a target row that is not included in package sample data.`,
        );
      }
    }
  }
  if (child.rows.length === 0 && listId) {
    addIssue(issues, "warning", "SAMPLE_ROWS_MISSING", child.title, "List has no sample rows in the package.");
  }
}

function validateChild(child, issues, context, args) {
  const { listById, fieldsByListId } = context;
  if (child.rawChild?.Defs === null || child.rawChild?.Fields === null || child.rawChild?.Layouts === null) {
    addIssue(issues, "error", "DEFS_OR_LAYOUTS_NULL", child.title, "Resource.Data.Item/Child Defs, Fields, and Layouts cannot be null; use arrays.");
  }
  if (!Array.isArray(child.fields)) {
    addIssue(issues, "error", "FIELDS_ARRAY_MISSING", child.title, "Fields/Defs must be an array.");
    return;
  }
  if (!Array.isArray(child.layouts)) {
    addIssue(issues, "error", "LAYOUTS_ARRAY_MISSING", child.title, "Layouts must be an array.");
  }

  const uniqueScopes = [
    ["DisplayName", new Map()],
    ["FieldName", new Map()],
    ["InternalName", new Map()],
  ];

  for (const field of child.fields) {
    for (const [key, seen] of uniqueScopes) {
      const value = field[key];
      if (value == null || value === "") continue;
      if (String(value).length > 255) {
        addIssue(issues, "error", `${key.toUpperCase()}_TOO_LONG`, child.title, `${fieldLabel(field)} has ${key} longer than 255 characters.`);
      }
      if (seen.has(value)) {
        addIssue(issues, "error", `${key.toUpperCase()}_DUPLICATE`, child.title, `${key} "${value}" is duplicated within the list.`);
        addIssue(issues, "error", "FIELD_IDENTIFIER_NOT_UNIQUE", child.title, `${key} "${value}" is duplicated within the list.`);
      }
      seen.set(value, field);
    }

    if (field.InternalName && !/^[a-zA-Z0-9_]+$/.test(String(field.InternalName))) {
      addIssue(issues, "error", "FIELD_INTERNAL_NAME_INVALID", child.title, `${fieldLabel(field)} has an invalid InternalName.`);
    }
    if (field.Type && !SUPPORTED_TYPES.has(field.Type)) {
      addIssue(issues, "error", "FIELD_TYPE_UNSUPPORTED", child.title, `${fieldLabel(field)} uses unsupported Type "${field.Type}".`);
    }
    if (field.Category != null && !Number.isInteger(Number(field.Category))) {
      addIssue(issues, "error", "FIELD_CATEGORY_NOT_INTEGER", child.title, `${fieldLabel(field)} has non-integer Category.`);
    }
    const suffix = String(field.FieldName || "").match(/(\d+)$/)?.[1];
    if (suffix && field.FieldIndex != null && Number(suffix) !== Number(field.FieldIndex)) {
      addIssue(issues, "error", "FIELD_NAME_INDEX_MISMATCH", child.title, `${fieldLabel(field)} suffix does not match FieldIndex ${field.FieldIndex}.`);
    }
    if (!field.IsSystem && suffix) {
      const storageMatch = String(field.FieldName || "").match(/^([A-Za-z]+)\d+$/);
      const expectedFieldType = STORAGE_FIELD_TYPES.get(storageMatch?.[1]);
      if (!expectedFieldType || String(field.FieldType || "") !== expectedFieldType) {
        addIssue(
          issues,
          "error",
          "FIELD_STORAGE_FAMILY_MISMATCH",
          child.title,
          `${fieldLabel(field)} uses FieldType ${field.FieldType || "(missing)"} but its FieldName storage family is ${storageMatch?.[1] || "(unknown)"}.`,
        );
      }
    }
    validateSelectionOptions(field, issues, child.title);
    validateLookup(field, issues, child.title, listById, fieldsByListId);
  }

  const titleField = child.fields.find((field) => field.FieldName === "Title" || field.InternalName === "Title");
  if (!titleField) {
    addIssue(issues, "error", "NATIVE_TITLE_FIELD_MISSING", child.title, "List is missing native system Title field.");
  } else {
    if (titleField.FieldName !== "Title" || titleField.InternalName !== "Title") {
      addIssue(issues, "error", "NATIVE_TITLE_FIELD_INVALID", child.title, "Native Title field must use FieldName and InternalName equal to Title.");
    }
    if (titleField.IsSystem !== true) {
      addIssue(issues, "error", "NATIVE_TITLE_NOT_SYSTEM", child.title, "Native Title field must be marked IsSystem true.");
    }
    if (titleField.Type !== "input" || titleField.FieldType !== "Text") {
      addIssue(issues, "error", "NATIVE_TITLE_TYPE_INVALID", child.title, "Native Title field must use Type input and FieldType Text.");
    }
  }

  if (child.fields.some((field) => field.FieldName === "Text0")) {
    addIssue(issues, "error", "TEXT0_PRIMARY_FIELD_INVALID_WHEN_TITLE_USED", child.title, "Generated list still contains Text0; use native Title instead of Text0 as primary display field.");
  }

  if (args.strictGeneratedList && child.list.LayoutView != null) {
    addIssue(issues, "error", "LIST_LAYOUTVIEW_SHOULD_BE_NULL", child.title, "Generated default data-list routing should keep List.LayoutView null unless export-proven custom form routing is configured.");
  }

  const defaultView = child.layouts.find((layout) => Number(layout.Type) === 0 && (layout.IsDefault === true || layout.Title || layout.LayoutView));
  if (!defaultView) {
    addIssue(issues, "error", "DEFAULT_VIEW_MISSING", child.title, "List has no default Type 0 view layout.");
  } else {
    const view = parseMaybeJson(defaultView.LayoutView, {});
    const layoutFields = Array.isArray(view.layout) ? view.layout.map((item) => String(item.field || item.Field || item.FieldName || "")) : [];
    const queryFields = Array.isArray(view.query) ? view.query.map((item) => String(item.field || item.Field || item.FieldName || "")) : [];
    validateDefaultViewShape(defaultView, view, child, issues);
    if (layoutFields.length === 0) {
      addIssue(issues, "error", "DEFAULT_VIEW_DISPLAY_FIELDS_MISSING", child.title, "Default data-list view must include visible display fields.");
    }
    if (queryFields.length === 0) {
      addIssue(issues, "error", "DEFAULT_VIEW_QUERY_EMPTY", child.title, "Default data-list view must include query fields and required system query fields.");
    }
    if (layoutFields.length > 0 && layoutFields[0] !== "Title") {
      addIssue(issues, "error", "DEFAULT_VIEW_TITLE_NOT_FIRST", child.title, `Default view first visible field is ${layoutFields[0] || "(empty)"}, expected Title.`);
    }
    for (const systemField of SYSTEM_QUERY_FIELDS) {
      if (!queryFields.includes(systemField)) {
        addIssue(issues, "error", "DEFAULT_VIEW_SYSTEM_QUERY_FIELD_MISSING", child.title, `Default view query does not include ${systemField}.`);
      }
    }
  }
}

function validate(decoded, args) {
  const issues = [];
  const children = getChildren(decoded);
  const listById = new Map();
  const fieldsByListId = new Map();
  const rowsByListId = new Map();

  for (const child of children) {
    const listId = String(child.list.ListID ?? child.list.ID ?? "");
    if (!listId) continue;
    listById.set(listId, child);
    fieldsByListId.set(listId, new Set(child.fields.map((field) => String(field.FieldName || "")).filter(Boolean)));
    rowsByListId.set(listId, new Set(child.rows.map((row) => String(row.ListDataID ?? row.ID ?? "")).filter(Boolean)));
  }

  for (const child of children) {
    validateChild(child, issues, { listById, fieldsByListId }, args);
  }
  validateRelationshipModeling(children, issues);
  for (const child of children) {
    validateRows(child, issues, listById, rowsByListId);
  }

  return {
    packageKind: decoded.kind,
    listsChecked: children.length,
    errors: issues.filter((issue) => issue.level === "error"),
    warnings: issues.filter((issue) => issue.level === "warning"),
    issues,
  };
}

function main() {
  try {
    const args = parseArgs(process.argv);
    const decoded = decodePackage(args.packagePath);
    const result = validate(decoded, args);
    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`Data list schema validation: ${result.errors.length} error(s), ${result.warnings.length} warning(s), ${result.listsChecked} list(s) checked.`);
      for (const issue of result.issues) {
        console.log(`${issue.level.toUpperCase()} ${issue.code} [${issue.listTitle}]: ${issue.message}`);
      }
    }
    if (result.errors.length > 0) process.exit(1);
  } catch (error) {
    console.error(`Data list schema validation failed: ${error.message}`);
    process.exit(1);
  }
}

main();

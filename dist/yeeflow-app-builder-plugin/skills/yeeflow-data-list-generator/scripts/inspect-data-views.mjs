#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PRIVATE_NUMBER_RE = /\b\d{8,}\b/g;
const SYSTEM_FIELDS = new Set(["Created", "Modified", "CreatedBy", "ModifiedBy", "ListDataID"]);
const VIEW_TYPES = new Map([
  ["0", "list"],
  ["100", "calendar"],
  ["104", "kanban"],
  ["999", "gallery"],
]);

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-data-views.mjs <input.yap> [--out-dir <normalized-dir>]",
    "",
    "Decodes a Yeeflow .yap read-only, inventories list-like data views, and writes redacted normalized references when --out-dir is provided.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, outDir: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out-dir") args.outDir = argv[++i];
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

function parseJsonMaybe(value, fallback = null) {
  if (Array.isArray(value) || isObject(value)) return value;
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function decodeYap(inputPath) {
  const wrapper = parseJson(fs.readFileSync(inputPath, "utf8"));
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error(`Input Resource must start with ${GZIP_PREFIX}`);
  }
  const resourceText = zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8");
  const resource = parseJson(resourceText);
  if (typeof resource.Data !== "string") throw new Error("Decoded Resource.Data is missing.");
  return { wrapper, resource, data: parseJson(resource.Data) };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function safeString(value) {
  return value === null || value === undefined ? "" : String(value);
}

function redactScalar(value, ids = new Map()) {
  if (value === null || value === undefined) return value;
  const text = String(value);
  if (ids.has(text)) return ids.get(text);
  return text.replace(EMAIL_RE, "<email>").replace(PRIVATE_NUMBER_RE, (match) => ids.get(match) || "<id>");
}

function sanitize(value, ids = new Map(), key = "") {
  if (Array.isArray(value)) return value.map((item) => sanitize(item, ids, key));
  if (!isObject(value)) return typeof value === "string" ? redactScalar(value, ids) : value;
  const out = {};
  for (const [childKey, child] of Object.entries(value)) {
    if (/^(TenantID|CreatedBy|ModifiedBy|Created|Modified)$/i.test(childKey)) out[childKey] = `<redacted-${childKey.toLowerCase()}>`;
    else if (/email/i.test(childKey)) out[childKey] = "<email>";
    else if (/^(Title|Name|DisplayName|Label|Description)$/i.test(childKey) && key !== "schema") out[childKey] = typeof child === "string" ? `<redacted-${childKey.toLowerCase()}>` : sanitize(child, ids, childKey);
    else out[childKey] = sanitize(child, ids, childKey);
  }
  return out;
}

function resourceKind(child) {
  const type = Number(child?.ListModel?.Type);
  if (type === 16) return "document library";
  if (type === 32) return "form report";
  if (type === 1 || type === 0 || type === 100) return "data list";
  return `unknown type ${safeString(child?.ListModel?.Type) || "missing"}`;
}

function viewKind(layout) {
  return VIEW_TYPES.get(safeString(layout?.Type)) || "unknown";
}

function fieldIndex(resource) {
  const byName = new Map();
  const byId = new Map();
  for (const field of asArray(resource.Defs)) {
    for (const key of [field.FieldName, field.InternalName, field.DisplayName]) {
      if (safeString(key)) byName.set(safeString(key), field);
    }
    if (safeString(field.FieldID)) byId.set(safeString(field.FieldID), field);
  }
  return { byName, byId };
}

function extSettings(layout) {
  const ext = parseJsonMaybe(layout.Ext1, {});
  for (const key of ["TitleField", "CoverField", "CategoryField"]) {
    if (typeof ext[key] === "string") ext[key] = parseJsonMaybe(ext[key], ext[key]);
  }
  return ext;
}

function fieldRef(ref) {
  if (!ref) return "";
  if (typeof ref === "string") return ref;
  if (isObject(ref)) return safeString(ref.FieldName || ref.FieldID || ref.Name || ref.ID);
  return safeString(ref);
}

function summarizeFilter(filter) {
  if (!filter) return "none";
  const filters = asArray(filter);
  if (!filters.length) return "none";
  const grouped = filters.some((item) => asArray(item.conditions).length);
  const ops = [...new Set(filters.map((item) => safeString(item.op || item.operator)).filter(Boolean))].join(", ") || "unknown operator";
  return `${filters.length} condition${filters.length === 1 ? "" : "s"} (${ops}${grouped ? ", grouped" : ""})`;
}

function visibleFields(layoutView) {
  return asArray(layoutView.layout).filter((column) => column.Show !== false).map((column) => safeString(column.FieldName || column.field || column.name)).filter(Boolean);
}

function userFilterFields(layoutView) {
  return asArray(layoutView.query).filter((query) => query.IsFilter === true).map((query) => safeString(query.FieldName || query.field || query.Name || query.ID)).filter(Boolean);
}

function validateRefs(view, index, fields, warnings) {
  for (const [columnIndex, column] of asArray(view.layout).entries()) {
    const name = safeString(column.FieldName || column.field || column.name);
    const id = safeString(column.FieldID || column.ID);
    if (name && !fields.byName.has(name) && !SYSTEM_FIELDS.has(name)) warnings.push({ code: "VIEW_COLUMN_FIELD_UNKNOWN", viewIndex: index, columnIndex, field: name });
    if (id && !SYSTEM_FIELDS.has(name) && !fields.byId.has(id) && !fields.byName.has(id)) warnings.push({ code: "VIEW_COLUMN_FIELD_ID_UNKNOWN", viewIndex: index, columnIndex, fieldId: "<field-id>" });
  }
  for (const [sortIndex, sort] of asArray(view.sort).entries()) {
    const name = safeString(sort.SortName || sort.FieldName || sort.field);
    if (name && !fields.byName.has(name) && !SYSTEM_FIELDS.has(name)) warnings.push({ code: "VIEW_SORT_FIELD_UNKNOWN", viewIndex: index, sortIndex, field: name });
  }
  const filters = [...asArray(view.filter), ...asArray(view.Filter)];
  for (const [filterIndex, filter] of filters.entries()) {
    const name = safeString(filter.left || filter.FieldName || filter.field);
    if (name && !fields.byName.has(name) && !SYSTEM_FIELDS.has(name)) warnings.push({ code: "VIEW_FILTER_FIELD_UNKNOWN", viewIndex: index, filterIndex, field: name });
  }
  for (const [queryIndex, query] of asArray(view.query).entries()) {
    const name = safeString(query.FieldName || query.field);
    if (name && !fields.byName.has(name) && !SYSTEM_FIELDS.has(name)) warnings.push({ code: "VIEW_USER_FILTER_FIELD_UNKNOWN", viewIndex: index, queryIndex, field: name });
  }
}

function inspectResource(resource, resourceIndex, ids, warnings) {
  const fields = fieldIndex(resource);
  const urls = new Set();
  const names = new Set();
  const views = [];
  for (const [layoutIndex, layout] of asArray(resource.Layouts).entries()) {
    if (Number(layout.Type) === 1) continue;
    const ext = extSettings(layout);
    const layoutView = parseJsonMaybe(layout.LayoutView, {});
    const viewType = viewKind(layout);
    const url = safeString(ext.Url);
    const name = safeString(layout.Title);
    if (!name) warnings.push({ code: "VIEW_NAME_MISSING", resourceIndex, layoutIndex });
    if (name && names.has(name)) warnings.push({ code: "VIEW_NAME_DUPLICATE", resourceIndex, viewName: "<redacted-view-name>" });
    names.add(name);
    if (url && urls.has(url)) warnings.push({ code: "VIEW_URL_DUPLICATE", resourceIndex, url: "<redacted-view-url>" });
    if (url) urls.add(url);
    if (!VIEW_TYPES.has(safeString(layout.Type))) warnings.push({ code: "VIEW_TYPE_UNKNOWN", resourceIndex, layoutIndex, type: safeString(layout.Type) });
    if (isObject(layoutView)) validateRefs(layoutView, layoutIndex, fields, warnings);

    const sort = asArray(layoutView?.sort);
    views.push({
      resourceType: resourceKind(resource),
      resourceRef: `<${resourceKind(resource).replace(/\s+/g, "-")}-${resourceIndex + 1}>`,
      resourceName: `<redacted-resource-name-${resourceIndex + 1}>`,
      viewRef: `<view-${resourceIndex + 1}-${views.length + 1}>`,
      viewName: name === "All Items" || name === "All tasks" ? name : "<redacted-view-name>",
      defaultOrCustom: layout.IsDefault === true ? "default" : "custom",
      viewType,
      typeCode: layout.Type,
      urlKey: url === "default" || url === "all" ? url : url ? "<redacted-view-url>" : "",
      visibleFields: visibleFields(layoutView),
      visibleFieldCount: visibleFields(layoutView).length,
      primarySort: sort[0] ? { field: safeString(sort[0].SortName || sort[0].FieldName || sort[0].field), descending: sort[0].SortByDesc === true } : null,
      secondarySort: sort[1] ? { field: safeString(sort[1].SortName || sort[1].FieldName || sort[1].field), descending: sort[1].SortByDesc === true } : null,
      dataFilterSummary: summarizeFilter(layoutView?.filter || layoutView?.Filter),
      userFilters: userFilterFields(layoutView),
      permissionSummary: layout.IsItemPerm === true ? "view-level item permission flag enabled" : "inherits or no view-level item permission flag",
      extKeys: Object.keys(ext),
      layoutViewKeys: isObject(layoutView) ? Object.keys(layoutView) : [],
      specialSettings: specialSettings(layout, layoutView, ext),
      proofLevel: "export-proven",
    });
  }
  if (views.length === 0) warnings.push({ code: "RESOURCE_VIEWS_MISSING", resourceIndex });
  if (!views.some((view) => view.defaultOrCustom === "default")) warnings.push({ code: "DEFAULT_VIEW_MISSING", resourceIndex });
  return {
    resourceType: resourceKind(resource),
    resourceRef: `<${resourceKind(resource).replace(/\s+/g, "-")}-${resourceIndex + 1}>`,
    resourceName: `<redacted-resource-name-${resourceIndex + 1}>`,
    listId: `<${resourceKind(resource).replace(/\s+/g, "-")}-id-${resourceIndex + 1}>`,
    fieldCount: asArray(resource.Defs).length,
    viewCount: views.length,
    defaultViews: views.filter((view) => view.defaultOrCustom === "default").map((view) => view.viewName),
    viewTypes: [...new Set(views.map((view) => view.viewType))],
    views,
  };
}

function specialSettings(layout, layoutView, ext) {
  const type = viewKind(layout);
  if (type === "gallery") return Object.keys(ext).filter((key) => ["TitleField", "CoverField", "ShowTable", "displayStyle"].includes(key));
  if (type === "kanban") return Object.keys(ext).filter((key) => ["TitleField", "CoverField", "CategoryField", "IncludeUncategorized", "ShowTable", "displayStyle"].includes(key));
  if (type === "calendar") return Object.keys(layoutView).filter((key) => ["Scope", "Columns", "DefaultColor", "ColorClass", "Hidden", "Workcalendar", "ColorClassSetting", "Filter", "Attr_IsViewDetail", "ExternalSetting"].includes(key));
  return Object.keys(ext).filter((key) => ["ShowTable", "displayStyle"].includes(key));
}

function writeJson(outDir, filename, value) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, filename), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function normalizedSamples(resources) {
  const views = resources.flatMap((resource) => resource.views);
  const byType = (type) => views.find((view) => view.viewType === type);
  const custom = views.find((view) => view.defaultOrCustom === "custom" && view.viewType === "list");
  const filtered = views.find((view) => view.dataFilterSummary !== "none");
  const withUserFilters = views.find((view) => view.userFilters.length);
  const withSort = views.find((view) => view.primarySort);
  const systemSort = views.find((view) => ["Created", "CreatedBy", "Modified", "ModifiedBy"].includes(view.primarySort?.field));
  const customSort = views.find((view) => view.primarySort && !["Created", "CreatedBy", "Modified", "ModifiedBy"].includes(view.primarySort.field));
  const columns = views.find((view) => view.visibleFieldCount);
  return {
    "data-view-default-all-items.normalized.json": views.find((view) => view.defaultOrCustom === "default"),
    "data-view-custom-basic.normalized.json": custom,
    "data-view-type-list.normalized.json": byType("list"),
    "data-view-type-gallery.normalized.json": byType("gallery"),
    "data-view-type-calendar.normalized.json": byType("calendar"),
    "data-view-type-kanban.normalized.json": byType("kanban"),
    "data-view-permission-inherited.normalized.json": views.find((view) => /inherits/.test(view.permissionSummary)),
    "data-view-primary-secondary-sort.normalized.json": withSort,
    "data-view-sort-system-field.normalized.json": systemSort,
    "data-view-sort-custom-field.normalized.json": customSort,
    "data-view-data-filter-basic.normalized.json": filtered,
    "data-view-user-filter-fields.normalized.json": withUserFilters,
    "data-view-visible-columns.normalized.json": columns,
    "data-view-column-order.normalized.json": columns,
    "data-view-inventory.normalized.json": { resources, proofLevel: "export-proven" },
  };
}

function main() {
  const args = parseArgs(process.argv);
  const { data } = decodeYap(args.input);
  const ids = new Map();
  const warnings = [];
  const resources = asArray(data.Childs)
    .filter((child) => ["data list", "document library", "form report"].includes(resourceKind(child)))
    .map((resource, index) => inspectResource(resource, index, ids, warnings));

  const summary = {
    status: warnings.length ? "pass_with_warnings" : "pass",
    input: path.resolve(args.input),
    proofLevel: "export-proven",
    resourceCounts: {
      dataLists: resources.filter((resource) => resource.resourceType === "data list").length,
      documentLibraries: resources.filter((resource) => resource.resourceType === "document library").length,
      formReports: resources.filter((resource) => resource.resourceType === "form report").length,
    },
    viewTypes: [...new Set(resources.flatMap((resource) => resource.viewTypes))],
    resources,
    warnings,
  };

  if (args.outDir) {
    const samples = normalizedSamples(resources);
    for (const [filename, value] of Object.entries(samples)) {
      if (value) writeJson(args.outDir, filename, sanitize(value, ids, "schema"));
    }
  }

  console.log(JSON.stringify(summary, null, 2));
}

try {
  main();
} catch (error) {
  console.log(JSON.stringify({ status: "fail", errors: [{ code: "INSPECT_DATA_VIEWS_FAILED", message: error.message }] }, null, 2));
  process.exit(1);
}

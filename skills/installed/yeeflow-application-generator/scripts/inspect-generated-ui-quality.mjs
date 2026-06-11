#!/usr/bin/env node

import fs from "node:fs";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const DATA_TABLE_TYPES = new Set(["data-list"]);
const ITEM_TEMPLATE_TYPES = new Set(["collection", "kanban", "timeline-v", "timeline-h"]);
const CONTAINER_TYPES = new Set(["container", "section", "card", "flex_grid"]);
const PADDING_TOKEN_RE = /--sp--s([3-9]|[1-9]\d+)/;

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-generated-ui-quality.mjs <app.yap|decoded-resource.json|decoded-data.json>",
    "",
    "Checks generated dashboard/form UI quality without printing raw package payloads.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const input = argv[2];
  if (!input || argv.length > 3) usage();
  return { input };
}

function quoteLargeIntegers(jsonText, largeNumbers = new Set()) {
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

function parseMaybeJson(value) {
  if (isObject(value) || Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function add(findings, level, code, message, detail = {}) {
  findings.push({ level, code, message, detail });
}

function decodeInput(inputPath, findings, largeNumbers) {
  const parsed = parseJson(fs.readFileSync(inputPath, "utf8").replace(/^\uFEFF/, ""), largeNumbers);
  if (typeof parsed?.Resource === "string") {
    if (!parsed.Resource.startsWith(GZIP_PREFIX) && inputPath.toLowerCase().endsWith(".yapk")) {
      const decoded = parseJson(zlib.brotliDecompressSync(Buffer.from(parsed.Resource, "base64")).toString("utf8"), largeNumbers);
      return normalizeYapkAppPackage(decoded);
    }
    if (!parsed.Resource.startsWith(GZIP_PREFIX)) {
      add(findings, "error", "YAP_RESOURCE_PREFIX_INVALID", `Resource must start with ${GZIP_PREFIX}.`);
      return null;
    }
    const resource = parseJson(zlib.gunzipSync(Buffer.from(parsed.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"), largeNumbers);
    if (resource && typeof resource === "object" && (resource.Item || Array.isArray(resource.Childs))) return resource;
    return typeof resource.Data === "string" ? parseJson(resource.Data, largeNumbers) : resource.Data;
  }
  if (typeof parsed?.Data === "string") return parseJson(parsed.Data, largeNumbers);
  return parsed;
}

function normalizeYapkAppPackage(decoded) {
  if (!isObject(decoded) || !isObject(decoded.ListSet)) return decoded;
  return {
    Item: {
      ListModel: decoded.ListSet,
      Defs: [],
      Layouts: asArray(decoded.Pages),
    },
    Childs: asArray(decoded.Childs).map((child) => ({
      ListModel: child.List,
      Defs: asArray(child.Fields),
      Layouts: asArray(child.Layouts),
    })),
  };
}

function walkControls(control, visitor, pointer = "$", depth = 0) {
  if (!isObject(control)) return;
  visitor(control, pointer, depth);
  for (const key of ["children", "columns", "controls", "items", "rows", "cells"]) {
    asArray(control[key]).forEach((child, index) => walkControls(child, visitor, `${pointer}.${key}[${index}]`, depth + 1));
  }
}

function fieldMapsForData(data) {
  const listsById = new Map();
  for (const item of [data?.Item, ...asArray(data?.Childs)].filter(Boolean)) {
    const list = item.ListModel || {};
    const listId = safeString(list.ListID);
    if (!listId) continue;
    const fields = new Map();
    for (const field of asArray(item.Defs)) {
      for (const key of [field.FieldName, field.InternalName, field.DisplayName, field.FieldID].map(safeString).filter(Boolean)) {
        fields.set(key, field);
      }
    }
    listsById.set(listId, { title: safeString(list.Title), listId, fields });
  }
  return listsById;
}

function columnFieldName(column) {
  if (!isObject(column)) return safeString(column);
  const candidates = [
    column.Field,
    column.FieldName,
    column.fieldName,
    column.field,
    column.Name,
    column.name,
    column.SortName,
    column.id,
    column.FieldID,
    column.fieldID,
    column.value,
  ];
  for (const candidate of candidates) {
    const value = safeString(candidate);
    if (value) return value;
  }
  return "";
}

function hasSafeHorizontalPadding(value) {
  if (value === undefined || value === null || value === "") return false;
  if (typeof value === "number") return value >= 16;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (PADDING_TOKEN_RE.test(trimmed)) return true;
    const numeric = Number(trimmed.replace(/px$/, ""));
    return Number.isFinite(numeric) && numeric >= 16;
  }
  if (Array.isArray(value)) return value.some(hasSafeHorizontalPadding);
  if (!isObject(value)) return false;
  return ["left", "right", "x", "horizontal"].some((key) => hasSafeHorizontalPadding(value[key]));
}

function controlPadding(control) {
  const attrs = control?.attrs || {};
  const common = attrs.common || {};
  return [
    attrs.padding,
    attrs.container?.padding,
    attrs.style?.padding,
    common.padding,
    common.positioning?.padding,
    control.padding,
  ];
}

function hasSafePaddingNearRoot(root) {
  if (!isObject(root)) return false;
  if (controlPadding(root).some(hasSafeHorizontalPadding)) return true;
  let found = false;
  asArray(root.children).forEach((child, index) => {
    walkControls(child, (control, pointer, depth) => {
      if (found || depth > 2) return;
      if (controlPadding(control).some(hasSafeHorizontalPadding)) found = true;
    }, `$.children[${index}]`, 0);
  });
  return found;
}

function meaningfulTemplateFields(control) {
  const fields = new Set();
  walkControls(control, (node) => {
    const attrs = node.attrs || {};
    for (const candidate of [attrs["obj-f"], attrs.field, attrs.FieldName, node.binding, node.fieldID]) {
      const value = safeString(candidate);
      if (value && !value.startsWith("__filter_") && !value.startsWith("__temp_")) fields.add(value);
    }
    const data = attrs.data || {};
    for (const candidate of [data.title, data.value, data.field, data.FieldName]) {
      const value = safeString(candidate);
      if (value) fields.add(value);
    }
  });
  return fields;
}

function inspectDataTable(control, pointer, page, listsById, findings, summary) {
  summary.dataTables += 1;
  const listId = safeString(control.attrs?.data?.list?.ListID);
  const columns = asArray(control.attrs?.listarr);
  if (!listId) {
    add(findings, "error", "DATA_TABLE_SOURCE_MISSING", "Generated dashboard Data table must configure attrs.data.list.", { page, pointer });
    return;
  }
  const source = listsById.get(listId);
  if (!source) {
    add(findings, "error", "DATA_TABLE_SOURCE_UNRESOLVED", "Generated dashboard Data table source list must resolve to a packaged data list.", { page, pointer, listId });
  }
  if (!columns.length) {
    add(findings, "error", "DATA_TABLE_DISPLAY_COLUMNS_MISSING", "Generated dashboard Data table must include attrs.listarr display columns.", { page, pointer, listId });
    return;
  }
  if (columns.length < 3) {
    add(findings, "warning", "DATA_TABLE_DISPLAY_COLUMNS_THIN", "Generated dashboard Data table should include 3 to 5 meaningful display columns when fields are available.", { page, pointer, listId, columnCount: columns.length });
  }
  const fields = source?.fields || new Map();
  for (const key of ["AppID", "ListID", "Type", "Title", "ListSetID"]) {
    if (!safeString(control.attrs?.data?.list?.[key])) {
      add(findings, "error", "DATA_TABLE_SOURCE_LIST_KEY_MISSING", "Dashboard Data table attrs.data.list must include AppID, ListID, Type, Title, and ListSetID.", { page, pointer: `${pointer}.attrs.data.list.${key}`, listId, key });
    }
  }
  columns.forEach((column, index) => {
    const explicitField = isObject(column) ? safeString(column.Field) : "";
    if (isObject(column) && !explicitField) {
      add(findings, "error", "DATA_TABLE_DISPLAY_COLUMN_FIELD_BINDING_MISSING", "Dashboard Data table display column must include export-proven Field binding; FieldName is the visible label, not the query field.", { page, pointer: `${pointer}.attrs.listarr[${index}]`, listId });
    }
    const fieldName = explicitField || columnFieldName(column);
    if (!fieldName) {
      add(findings, "error", "DATA_TABLE_DISPLAY_COLUMN_FIELD_MISSING", "Data table display column must identify a source field.", { page, pointer: `${pointer}.attrs.listarr[${index}]`, listId });
    } else if (source && !fields.has(fieldName)) {
      add(findings, "error", "DATA_TABLE_DISPLAY_COLUMN_UNRESOLVED", "Data table display column must resolve to the selected source list fields.", { page, pointer: `${pointer}.attrs.listarr[${index}]`, listId, fieldName });
    }
  });
}

function inspectRoot(root, context, listsById, findings, summary) {
  if (!hasSafePaddingNearRoot(root)) {
    add(findings, "warning", `${context.kind.toUpperCase()}_SAFE_HORIZONTAL_PADDING_MISSING`, "Generated dashboard/form layouts should include safe left/right padding on an outer page section or container.", context);
  }
  let topLevelMajorControls = 0;
  asArray(root.children).forEach((child) => {
    if (isObject(child) && !CONTAINER_TYPES.has(safeString(child.type))) topLevelMajorControls += 1;
  });
  if (context.kind === "dashboard" && topLevelMajorControls > 0) {
    add(findings, "warning", "DASHBOARD_MAJOR_CONTROLS_NOT_WRAPPED", "Generated dashboards should wrap major controls in section/card/container layouts instead of placing them directly under the page root.", { ...context, topLevelMajorControls });
  }
  walkControls(root, (control, pointer) => {
    const type = safeString(control.type);
    if (DATA_TABLE_TYPES.has(type)) inspectDataTable(control, pointer, context.title, listsById, findings, summary);
    if (ITEM_TEMPLATE_TYPES.has(type)) {
      summary.itemTemplateControls += 1;
      if (!asArray(control.children).length) {
        add(findings, "error", "ITEM_TEMPLATE_CHILDREN_MISSING", "Collection/Kanban/Timeline controls must include meaningful item-template children.", { ...context, pointer, controlType: type });
      } else if (meaningfulTemplateFields(control).size === 0) {
        add(findings, "warning", "ITEM_TEMPLATE_DYNAMIC_FIELDS_MISSING", "Collection/Kanban/Timeline item templates should include meaningful dynamic fields.", { ...context, pointer, controlType: type });
      }
    }
    if ((type === "progress" || type === "progress-circle") && !safeString(control.attrs?.value) && !safeString(control.binding) && !safeString(control.attrs?.["obj-f"])) {
      add(findings, "warning", "PROGRESS_CONTROL_VALUE_MISSING", "Progress controls should have a numeric value or valid binding.", { ...context, pointer, controlType: type });
    }
    if (type === "steps-bar" && !asArray(control.attrs?.["steps-options"]).length && !safeString(control.attrs?.["current-step"])) {
      add(findings, "warning", "STEPS_BAR_STEPS_MISSING", "Steps bar controls should have valid steps or a valid field binding.", { ...context, pointer });
    }
  });
}

function inspectDashboards(data, listsById, findings, summary) {
  const rootLayouts = asArray(data?.Item?.Layouts);
  rootLayouts.forEach((layout, layoutIndex) => {
    if (Number(layout.Type) !== 103) return;
    const resource = asArray(layout.LayoutInResources)[0]?.Resource;
    const page = parseMaybeJson(resource);
    if (!page) {
      const ext2 = parseMaybeJson(layout.Ext2);
      const currentDashboardShell = layout.LayoutView === null && ext2 && ext2.src === true && Array.isArray(layout.LayoutInResources) && layout.LayoutInResources.length === 0;
      if (currentDashboardShell) {
        summary.dashboardPages += 1;
        add(findings, "warning", "DASHBOARD_CURRENT_SHELL_NO_INLINE_RESOURCE", "Current-version blank dashboard shell is export-proven, but it has no inline page JSON to inspect for padding, controls, or data bindings.", { layoutIndex, title: safeString(layout.Title), layoutId: safeString(layout.LayoutID) });
        return;
      }
      add(findings, "error", "DASHBOARD_RESOURCE_JSON_INVALID", "Dashboard page Resource must parse as JSON.", { layoutIndex, title: safeString(layout.Title) });
      return;
    }
    summary.dashboardPages += 1;
    inspectRoot(page, { kind: "dashboard", title: safeString(layout.Title), layoutId: safeString(layout.LayoutID) }, listsById, findings, summary);
  });
}

function inspectCustomForms(data, listsById, findings, summary) {
  for (const item of asArray(data?.Childs)) {
    const listId = safeString(item?.ListModel?.ListID);
    const listTitle = safeString(item?.ListModel?.Title);
    for (const layout of asArray(item.Layouts)) {
      if (Number(layout.Type) !== 1) continue;
      const resource = asArray(layout.LayoutInResources)[0]?.Resource;
      const form = parseMaybeJson(resource);
      if (!form) {
        add(findings, "error", "CUSTOM_FORM_RESOURCE_JSON_INVALID", "Data List custom form Resource must parse as JSON.", { list: listTitle, layoutId: safeString(layout.LayoutID), title: safeString(layout.Title) });
        continue;
      }
      summary.customForms += 1;
      inspectRoot(form, { kind: "custom_form", list: listTitle, listId, title: safeString(layout.Title), layoutId: safeString(layout.LayoutID) }, listsById, findings, summary);
    }
  }
}

function main() {
  const { input } = parseArgs(process.argv);
  const findings = [];
  const largeNumbers = new Set();
  const data = decodeInput(input, findings, largeNumbers);
  const summary = { dashboardPages: 0, customForms: 0, dataTables: 0, itemTemplateControls: 0 };
  if (data) {
    const listsById = fieldMapsForData(data);
    inspectDashboards(data, listsById, findings, summary);
    inspectCustomForms(data, listsById, findings, summary);
  }
  const errors = findings.filter((finding) => finding.level === "error").length;
  const warnings = findings.filter((finding) => finding.level === "warning").length;
  const report = {
    status: errors ? "fail" : warnings ? "pass_with_warnings" : "pass",
    errors,
    warnings,
    summary,
    findings,
  };
  console.log(JSON.stringify(report, null, 2));
  if (errors) process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.log(JSON.stringify({ status: "fail", errors: 1, warnings: 0, summary: {}, findings: [{ level: "error", code: "UI_QUALITY_INSPECTION_FAILED", message: error.message }] }, null, 2));
  process.exit(1);
}

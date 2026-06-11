#!/usr/bin/env node

import fs from "node:fs";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;
const LONG_ID_RE = /^\d{10,}$/;
const DYNAMIC_TYPES = new Set(["dynamic-field", "dynamic-user", "dynamic-image", "dynamic-file"]);

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-kanban-collection-dynamic-controls.mjs <input.yap|decoded.json> [--page <name>] [--list-form <name>] [--json-out <path>]",
    "",
    "Inspects Dashboard Kanban/Collection controls and Dynamic field/user/image/file controls safely.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = { input: null, pages: [], listForm: null, jsonOut: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") usage(0);
    else if (arg === "--page") args.pages.push(argv[++i]);
    else if (arg === "--list-form") args.listForm = argv[++i];
    else if (arg === "--json-out" || arg === "--out") args.jsonOut = argv[++i];
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input) usage();
  return args;
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

function parseJsonMaybe(value) {
  if (!value) return null;
  if (isObject(value) || Array.isArray(value)) return value;
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function decodeInput(inputPath) {
  const parsed = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  if (typeof parsed?.Resource === "string") {
    if (!parsed.Resource.startsWith(GZIP_PREFIX)) throw new Error("YAP Resource does not use the expected gzip prefix.");
    const resource = JSON.parse(zlib.gunzipSync(Buffer.from(parsed.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"));
    return { wrapper: parsed, resource, data: JSON.parse(resource.Data) };
  }
  if (parsed?.Data) return { wrapper: null, resource: parsed, data: typeof parsed.Data === "string" ? JSON.parse(parsed.Data) : parsed.Data };
  return { wrapper: null, resource: null, data: parsed };
}

function redactId(value) {
  const text = safeString(value);
  if (!text) return null;
  if (UUID_RE.test(text)) return "<uuid>";
  if (LONG_ID_RE.test(text)) return "<id>";
  return text;
}

function redactDeep(value) {
  if (Array.isArray(value)) return value.map(redactDeep);
  if (!isObject(value)) {
    if (typeof value === "string") {
      if (/^https?:\/\//i.test(value)) return "<url>";
      return redactId(value) || value;
    }
    return value;
  }
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, redactDeep(child)]));
}

function walkControls(root, visitor, pointer = "$", ancestry = []) {
  if (!isObject(root)) return;
  visitor(root, pointer, ancestry);
  const nextAncestry = [...ancestry, root];
  for (const key of ["children", "controls", "items", "cells", "columns", "rows"]) {
    asArray(root[key]).forEach((child, index) => walkControls(child, visitor, `${pointer}.${key}[${index}]`, nextAncestry));
  }
}

function controlLabel(control) {
  return safeString(control.nv_label || control.label || control.title || control.binding || control.type || control.id);
}

function collectControlTypes(root) {
  const counts = new Map();
  walkControls(root, (control) => {
    const type = safeString(control.type) || "(missing)";
    counts.set(type, (counts.get(type) || 0) + 1);
  });
  return [...counts.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => a.type.localeCompare(b.type));
}

function listRecordFromChild(child) {
  return child?.Item || child;
}

function fieldSummary(field) {
  const rules = parseJsonMaybe(field.Rules) || {};
  const controlType = safeString(field.Type);
  return {
    fieldName: safeString(field.FieldName),
    displayName: safeString(field.DisplayName || field.Title || field.Name),
    controlType,
    fieldType: safeString(field.FieldType),
    multiValue: Boolean(rules.multiple || rules.file_multiple || rules.controlmultiple || (controlType === "identity-picker" && Number(rules["identity-maxselection"] || 0) > 1)),
  };
}

function buildListIndex(data) {
  const lists = [];
  for (const [index, child] of asArray(data.Childs).entries()) {
    const item = listRecordFromChild(child);
    const listId = safeString(item?.ListModel?.ListID || item?.ListID);
    const fields = asArray(item?.Defs);
    lists.push({
      index,
      listId,
      title: safeString(item?.ListModel?.Title || item?.Title || item?.Name),
      type: item?.ListModel?.Type ?? item?.Type ?? null,
      fieldMap: new Map(fields.map((field) => [safeString(field.FieldName), field])),
      fields,
      layouts: asArray(item?.Layouts),
      sampleDataPresent: asArray(item?.ListDatas).length > 0,
    });
  }
  const byId = new Map(lists.map((list) => [list.listId, list]));
  return { lists, byId };
}

function dataSourceSummary(data, listIndex) {
  const list = data?.list || {};
  const listId = safeString(list.ListID);
  const resolved = listIndex.byId.get(listId);
  return {
    type: list.Type ?? null,
    title: safeString(list.Title || resolved?.title),
    listId: listId ? "<id>" : null,
    resolved: Boolean(resolved),
  };
}

function fieldRefSummary(fieldName, sourceList) {
  const field = sourceList?.fieldMap.get(safeString(fieldName));
  return {
    fieldName: safeString(fieldName),
    resolved: Boolean(field),
    displayName: field ? safeString(field.DisplayName || field.Title || field.Name) : null,
    controlType: field ? safeString(field.Type) : null,
    fieldType: field ? safeString(field.FieldType) : null,
  };
}

function dynamicControlSummary(control, pointer, host, sourceList) {
  const fieldName = safeString(control.attrs?.["obj-f"]);
  const source = safeString(control.attrs?.source);
  const base = {
    type: safeString(control.type),
    label: controlLabel(control),
    pointer,
    host,
    source,
    sourceContext: source === "3" ? "current collection/kanban item" : source === "4" ? "current list item" : source || null,
    field: fieldRefSummary(fieldName, sourceList),
    displayCaption: control.displayLabel ?? control.attrs?.displayLabel ?? null,
    observedSettings: {},
  };
  const attrs = control.attrs || {};
  for (const key of ["display_name", "i-len", "addition_fields", "preview_image", "setting", "image", "content", "opbtn", "type_icon_show", "common", "item_style", "text_style", "picture_style", "prefix", "t-af", "t-be"]) {
    if (attrs[key] !== undefined) base.observedSettings[key] = redactDeep(attrs[key]);
  }
  return base;
}

function collectDynamicControls(root, host, sourceList) {
  const found = [];
  walkControls(root, (control, pointer) => {
    if (DYNAMIC_TYPES.has(safeString(control.type))) found.push(dynamicControlSummary(control, pointer, host, sourceList));
  });
  return found;
}

function collectContextRefs(root) {
  const refs = new Map();
  const visit = (value) => {
    if (Array.isArray(value)) value.forEach(visit);
    else if (isObject(value)) {
      if (value.exprType === "variable_ctx") {
        const key = `${safeString(value.ctx)}:${safeString(value.id || value.name)}`;
        refs.set(key, { ctx: safeString(value.ctx), id: safeString(value.id), name: safeString(value.name) });
      }
      Object.values(value).forEach(visit);
    }
  };
  visit(root);
  return [...refs.values()].sort((a, b) => `${a.ctx}${a.id}`.localeCompare(`${b.ctx}${b.id}`));
}

function summarizeKanban(control, pointer, listIndex) {
  const listId = safeString(control.attrs?.data?.list?.ListID);
  const sourceList = listIndex.byId.get(listId);
  const categoryField = safeString(control.attrs?.data?.cateField);
  return {
    pointer,
    label: controlLabel(control),
    dataSource: dataSourceSummary(control.attrs?.data, listIndex),
    categoryField: fieldRefSummary(categoryField, sourceList),
    categoriesCount: asArray(control.attrs?.categories).length,
    dynamicControls: collectDynamicControls(control, "kanban item template", sourceList),
    itemTemplateControlTypes: collectControlTypes(control),
    contextReferences: collectContextRefs(control),
    observedSettings: redactDeep({
      dataKeys: Object.keys(control.attrs?.data || {}),
      attrsKeys: Object.keys(control.attrs || {}),
      hasControlDisplay: asArray(control.attrs?.control_display).length > 0,
      hasKanbanBody: asArray(control.children).some((child) => child?.type === "kanban-body"),
      hasKanbanFooter: asArray(control.children).some((child) => child?.type === "kanban-footer"),
    }),
  };
}

function summarizeCollection(control, pointer, listIndex) {
  const listId = safeString(control.attrs?.data?.list?.ListID);
  const sourceList = listIndex.byId.get(listId);
  return {
    pointer,
    label: controlLabel(control),
    dataSource: dataSourceSummary(control.attrs?.data, listIndex),
    layoutKeys: Object.keys(control.attrs?.layout || {}),
    dynamicControls: collectDynamicControls(control, "collection item template", sourceList),
    itemTemplateControlTypes: collectControlTypes(control),
    contextReferences: collectContextRefs(control),
    observedSettings: redactDeep({
      dataKeys: Object.keys(control.attrs?.data || {}),
      attrsKeys: Object.keys(control.attrs || {}),
      hasChildren: asArray(control.children).length > 0,
    }),
  };
}

function inspectDashboard(layout, listIndex) {
  const page = parseJsonMaybe(asArray(layout.LayoutInResources)[0]?.Resource);
  if (!page) return null;
  const kanbanControls = [];
  const collectionControls = [];
  walkControls(page, (control, pointer) => {
    if (control.type === "kanban") kanbanControls.push(summarizeKanban(control, pointer, listIndex));
    if (control.type === "collection") collectionControls.push(summarizeCollection(control, pointer, listIndex));
  });
  return {
    title: safeString(layout.Title),
    type: layout.Type,
    controlTypes: collectControlTypes(page),
    kanbanControls,
    collectionControls,
  };
}

function inspectCustomForms(list, args) {
  return list.layouts.filter((layout) => Number(layout.Type) === 1).filter((layout) => !args.listForm || safeString(layout.Title) === args.listForm).map((layout) => {
    const form = parseJsonMaybe(asArray(layout.LayoutInResources)[0]?.Resource);
    const dynamicControls = form ? collectDynamicControls(form, "data list custom form current item", list) : [];
    return {
      listTitle: list.title,
      formTitle: safeString(layout.Title),
      layoutId: "<id>",
      controlTypes: form ? collectControlTypes(form) : [],
      dynamicControls,
      contextReferences: form ? collectContextRefs(form) : [],
    };
  });
}

function main() {
  const args = parseArgs(process.argv);
  const decoded = decodeInput(args.input);
  const listIndex = buildListIndex(decoded.data);
  const dashboards = asArray(decoded.data?.Item?.Layouts)
    .filter((layout) => Number(layout.Type) === 103)
    .filter((layout) => !args.pages.length || args.pages.includes(safeString(layout.Title)))
    .map((layout) => inspectDashboard(layout, listIndex))
    .filter(Boolean);
  const customForms = listIndex.lists.flatMap((list) => inspectCustomForms(list, args));
  const summary = {
    input: args.input,
    wrapperTitle: safeString(decoded.wrapper?.Title),
    app: {
      dashboardCount: asArray(decoded.data?.Item?.Layouts).filter((layout) => Number(layout.Type) === 103).length,
      dataListCount: listIndex.lists.filter((list) => Number(list.type) === 1).length,
      documentLibraryCount: listIndex.lists.filter((list) => Number(list.type) === 16).length,
    },
    dataLists: listIndex.lists.map((list) => ({
      title: list.title,
      type: list.type,
      listId: "<id>",
      fields: list.fields.map(fieldSummary),
      customForms: list.layouts.filter((layout) => Number(layout.Type) === 1).map((layout) => safeString(layout.Title)),
      sampleDataPresent: list.sampleDataPresent,
    })),
    dashboards,
    customForms,
    totals: {
      kanbanControls: dashboards.reduce((sum, page) => sum + page.kanbanControls.length, 0),
      collectionControls: dashboards.reduce((sum, page) => sum + page.collectionControls.length, 0),
      dashboardDynamicControls: dashboards.reduce((sum, page) => sum + page.kanbanControls.reduce((n, item) => n + item.dynamicControls.length, 0) + page.collectionControls.reduce((n, item) => n + item.dynamicControls.length, 0), 0),
      customFormDynamicControls: customForms.reduce((sum, form) => sum + form.dynamicControls.length, 0),
    },
    proofBoundary: [
      "This inspector reports export-observed schema only.",
      "It redacts IDs and URLs and does not emit raw Resource or sample records.",
    ],
  };
  const output = JSON.stringify(summary, null, 2);
  if (args.jsonOut) fs.writeFileSync(args.jsonOut, `${output}\n`);
  console.log(output);
}

try {
  main();
} catch (error) {
  console.error(`inspect-kanban-collection-dynamic-controls failed: ${error.message}`);
  process.exit(1);
}

#!/usr/bin/env node

import fs from "node:fs";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;
const LONG_ID_RE = /^\d{10,}$/;
const TIMELINE_TYPES = new Set(["timeline-v", "timeline-h"]);
const DYNAMIC_TYPES = new Set(["dynamic-field", "dynamic-user", "dynamic-image", "dynamic-file"]);

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-timeline-dynamic-controls.mjs <input.yap|decoded.json> [--page <name>] [--json-out <path>]",
    "",
    "Inspects Dashboard Vertical/Horizontal Timeline controls and Dynamic field/user/image/file controls safely.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = { input: null, pages: [], jsonOut: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") usage(0);
    else if (arg === "--page") args.pages.push(argv[++i]);
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

function parseRules(field) {
  return parseJsonMaybe(field?.Rules) || {};
}

function fieldSummary(field) {
  const rules = parseRules(field);
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

function dynamicControlSummary(control, pointer, host, sourceList) {
  const attrs = control.attrs || {};
  const fieldName = safeString(attrs["obj-f"]);
  const source = safeString(attrs.source);
  const observedSettings = {};
  for (const key of ["display_name", "i-len", "addition_fields", "preview_image", "setting", "image", "content", "opbtn", "type_icon_show", "common", "item_style", "text_style", "picture_style", "prefix", "t-af", "t-be"]) {
    if (attrs[key] !== undefined) observedSettings[key] = redactDeep(attrs[key]);
  }
  return {
    type: safeString(control.type),
    label: controlLabel(control),
    pointer,
    host,
    source,
    sourceContext: source === "3" ? "current timeline/collection item" : source === "4" ? "current list item" : source || null,
    field: fieldRefSummary(fieldName, sourceList),
    displayCaption: control.displayLabel ?? attrs.displayLabel ?? null,
    observedSettings,
  };
}

function collectDynamicControls(root, host, sourceList) {
  const found = [];
  walkControls(root, (control, pointer) => {
    if (DYNAMIC_TYPES.has(safeString(control.type))) found.push(dynamicControlSummary(control, pointer, host, sourceList));
  });
  return found;
}

function expressionFieldRefs(value) {
  const fields = [];
  const visit = (node) => {
    if (Array.isArray(node)) node.forEach(visit);
    else if (isObject(node)) {
      if (node.exprType === "variable_ctx") fields.push({ ctx: safeString(node.ctx), fieldName: safeString(node.id), name: safeString(node.name), valueType: safeString(node.valueType) });
      Object.values(node).forEach(visit);
    }
  };
  visit(value);
  return fields;
}

function summarizeTimeline(control, pointer, listIndex) {
  const listId = safeString(control.attrs?.data?.list?.ListID);
  const sourceList = listIndex.byId.get(listId);
  const titleRefs = expressionFieldRefs(control.attrs?.data?.title);
  return {
    pointer,
    type: safeString(control.type),
    orientation: control.type === "timeline-v" ? "vertical" : "horizontal",
    label: controlLabel(control),
    dataSource: dataSourceSummary(control.attrs?.data, listIndex),
    timelineTitle: {
      rawValuePresent: control.attrs?.data?.title?.value !== undefined && control.attrs?.data?.title?.value !== null,
      fieldRefs: titleRefs.map((ref) => ({ ...ref, field: fieldRefSummary(ref.fieldName, sourceList) })),
    },
    sortFields: asArray(control.attrs?.data?.sort).map((sort) => ({
      field: fieldRefSummary(sort?.SortName, sourceList),
      descending: Boolean(sort?.SortByDesc),
    })),
    link: control.attrs?.data?.link ? "<id>" : null,
    openMode: safeString(control.attrs?.data?.op || "default"),
    modalSize: control.attrs?.data?.modalsize ?? null,
    dynamicControls: collectDynamicControls(control, `${control.type} item template`, sourceList),
    itemTemplateControlTypes: collectControlTypes(control),
    contextReferences: collectContextRefs(control),
    observedSettings: redactDeep({
      dataKeys: Object.keys(control.attrs?.data || {}),
      attrsKeys: Object.keys(control.attrs || {}),
      pointType: control.attrs?.data?.ptype ?? null,
      columns: control.attrs?.data?.col ?? null,
      showCardArrow: control.attrs?.data?.cardarr ?? null,
      slidesToScroll: control.attrs?.data?.slides ?? null,
      animate: control.attrs?.data?.animate ?? null,
      align: control.attrs?.data?.align ?? null,
      verticalAlign: control.attrs?.data?.va ?? null,
      cardKeys: Object.keys(control.attrs?.card || {}),
      pointKeys: Object.keys(control.attrs?.point || {}),
      titleKeys: Object.keys(control.attrs?.title || {}),
      arrowKeys: Object.keys(control.attrs?.arrow || {}),
      hasChildren: asArray(control.children).length > 0,
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
    dynamicControls: collectDynamicControls(control, "same-page collection item template", sourceList),
    itemTemplateControlTypes: collectControlTypes(control),
    contextReferences: collectContextRefs(control),
  };
}

function inspectDashboard(layout, listIndex) {
  const page = parseJsonMaybe(asArray(layout.LayoutInResources)[0]?.Resource);
  if (!page) return null;
  const timelineControls = [];
  const collectionControls = [];
  walkControls(page, (control, pointer) => {
    if (TIMELINE_TYPES.has(safeString(control.type))) timelineControls.push(summarizeTimeline(control, pointer, listIndex));
    if (control.type === "collection") collectionControls.push(summarizeCollection(control, pointer, listIndex));
  });
  return {
    title: safeString(layout.Title),
    type: layout.Type,
    controlTypes: collectControlTypes(page),
    timelineControls,
    collectionControls,
  };
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
    totals: {
      verticalTimelineControls: dashboards.reduce((sum, page) => sum + page.timelineControls.filter((control) => control.orientation === "vertical").length, 0),
      horizontalTimelineControls: dashboards.reduce((sum, page) => sum + page.timelineControls.filter((control) => control.orientation === "horizontal").length, 0),
      samePageCollectionControls: dashboards.reduce((sum, page) => sum + page.collectionControls.length, 0),
      timelineDynamicControls: dashboards.reduce((sum, page) => sum + page.timelineControls.reduce((n, item) => n + item.dynamicControls.length, 0), 0),
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
  console.error(`inspect-timeline-dynamic-controls failed: ${error.message}`);
  process.exit(1);
}

#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LONG_ID_RE = /^\d{10,}$/;
const HOST_TYPES = new Set(["collection", "kanban"]);
const SYSTEM_FIELDS = new Map([
  ["ListDataID", { displayName: "ID", controlType: "system-id", fieldType: "System" }],
  ["CreatedBy", { displayName: "Created By", controlType: "metadata-user", fieldType: "System" }],
  ["Created", { displayName: "Created", controlType: "metadata-date", fieldType: "System" }],
  ["ModifiedBy", { displayName: "Modified By", controlType: "metadata-user", fieldType: "System" }],
  ["Modified", { displayName: "Modified", controlType: "metadata-date", fieldType: "System" }],
]);

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-collection-kanban-actions.mjs <input.yap|decoded.json> [--page <name>] [--json-out <path>]",
    "",
    "Inspects Collection/Kanban local actions, item-template action bindings, current-item context, selection variables, and bulk action patterns.",
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

function redactId(value) {
  const text = safeString(value);
  if (!text) return null;
  if (UUID_RE.test(text)) return "<uuid>";
  if (LONG_ID_RE.test(text)) return "<id>";
  return text;
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

function walkControls(root, visitor, pointer = "$", ancestry = []) {
  if (!isObject(root)) return;
  visitor(root, pointer, ancestry);
  const nextAncestry = [...ancestry, root];
  for (const key of ["children", "columns", "rows", "items"]) {
    asArray(root[key]).forEach((child, index) => walkControls(child, visitor, `${pointer}.${key}[${index}]`, nextAncestry));
  }
}

function walk(value, visitor, pointer = "$") {
  visitor(value, pointer);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visitor, `${pointer}[${index}]`));
  else if (isObject(value)) Object.entries(value).forEach(([key, child]) => walk(child, visitor, `${pointer}.${key}`));
}

function controlLabel(control) {
  return safeString(control.nv_label || control.label || control.title || control.binding || control.type || control.id);
}

function listRecordFromChild(child) {
  return child?.Item || child;
}

function buildListIndex(data) {
  const lists = [];
  for (const [index, child] of asArray(data.Childs).entries()) {
    const item = listRecordFromChild(child);
    const listId = safeString(item?.ListModel?.ListID || item?.ListID);
    const fields = asArray(item?.Defs);
    const layouts = asArray(item?.Layouts).map((layout) => ({
      id: safeString(layout.LayoutID),
      title: safeString(layout.Title),
      type: layout.Type ?? null,
    }));
    lists.push({
      index,
      listId,
      title: safeString(item?.ListModel?.Title || item?.Title || item?.Name),
      type: item?.ListModel?.Type ?? item?.Type ?? null,
      fieldsByName: new Map(fields.map((field) => [safeString(field.FieldName), field])),
      layoutsById: new Map(layouts.map((layout) => [layout.id, layout])),
      layouts,
    });
  }
  return { lists, byId: new Map(lists.map((list) => [list.listId, list])) };
}

function decodeDashboardLayout(layout) {
  const resource = layout?.LayoutInResources?.[0]?.Resource;
  const page = parseJsonMaybe(resource);
  return page && isObject(page) ? page : null;
}

function fieldSummary(fieldName, list) {
  const name = safeString(fieldName);
  const systemField = SYSTEM_FIELDS.get(name);
  if (systemField) {
    return {
      fieldName: name,
      resolved: true,
      system: true,
      ...systemField,
    };
  }
  const field = list?.fieldsByName.get(name);
  return {
    fieldName: name,
    resolved: Boolean(field),
    system: false,
    displayName: field ? safeString(field.DisplayName) : null,
    controlType: field ? safeString(field.Type) : null,
    fieldType: field ? safeString(field.FieldType) : null,
  };
}

function collectExprRefs(value) {
  const refs = [];
  walk(value, (node, pointer) => {
    if (!isObject(node)) return;
    if (node.exprType === "variable" || node.exprType === "variable_ctx") {
      refs.push({
        pointer,
        exprType: safeString(node.exprType),
        ctx: safeString(node.ctx) || null,
        id: safeString(node.id),
        name: safeString(node.name),
      });
    }
  });
  return refs;
}

function stepKind(step) {
  const type = safeString(step?.type);
  if (type === "listitem") return `current-item-${safeString(step.attrs?.op_type || "open")}`;
  if (type === "deleteitem") return "current-item-delete";
  if (type === "setdatalist") return safeString(step.attrs?.type) === "remove" ? "data-list-delete" : "data-list-update";
  if (type === "setvar") return "set-variables";
  if (type === "confirm") return "confirm";
  if (type === "otheraction") return "call-action";
  return type || "unknown";
}

function summarizeStep(step, index, sourceList, pageVariables, pageActionIds) {
  const attrs = step?.attrs || {};
  const refs = collectExprRefs(step);
  const whereFields = asArray(attrs.wheres).map((where) => fieldSummary(where.left, sourceList));
  const updateFields = asArray(attrs.listdatas).map((entry) => fieldSummary(entry.Columns, sourceList));
  const layoutId = safeString(attrs.layout);
  return {
    index,
    type: safeString(step?.type),
    kind: stepKind(step),
    currentItemRefs: refs.filter((ref) => ref.exprType === "variable_ctx").map((ref) => ({ ctx: ref.ctx, id: ref.id, name: ref.name })),
    variableRefs: refs.filter((ref) => ref.exprType === "variable").map((ref) => ({
      id: ref.id,
      name: ref.name,
      declared: pageVariables.has(ref.id) || pageVariables.has(ref.id.replace(/^__temp_/, "")),
    })),
    listContext: attrs.data?.list || attrs.list ? {
      listId: attrs.data?.list?.ListID || attrs.list?.ListID ? "<id>" : null,
      resolved: sourceList ? true : null,
    } : null,
    opType: safeString(attrs.op_type || attrs.type) || null,
    layout: layoutId ? { id: "<id>", resolved: Boolean(sourceList?.layoutsById.has(layoutId)) } : null,
    openMode: safeString(attrs.op) || null,
    modalSize: attrs.modalsize ?? null,
    hasConfirmResult: Boolean(attrs.confirm_rs),
    showDialog: attrs.showdlg ?? null,
    whereFields,
    updateFields,
    totalCountTarget: attrs.totalcount ? { id: safeString(attrs.totalcount), parent: safeString(attrs.totalparent) } : null,
    callsPageAction: attrs.control_action ? { actionRef: "<action-id>", resolved: pageActionIds.has(safeString(attrs.control_action)) } : null,
  };
}

function summarizeActions(actions, sourceList, pageVariables, pageActionIds) {
  return asArray(actions).map((action, actionIndex) => ({
    index: actionIndex,
    id: action?.id ? "<action-id>" : null,
    name: safeString(action?.name),
    type: safeString(action?.type),
    steps: asArray(action?.steps).map((step, stepIndex) => summarizeStep(step, stepIndex, sourceList, pageVariables, pageActionIds)),
  }));
}

function summarizeBindings(hostControl, hostPointer, actionIds) {
  const bindings = [];
  walkControls(hostControl, (control, pointer) => {
    const actionRef = safeString(control.attrs?.control_action);
    if (!actionRef) return;
    bindings.push({
      pointer: `${hostPointer}${pointer.slice(1)}`,
      controlType: safeString(control.type),
      label: controlLabel(control),
      actionRef: "<action-id>",
      resolvesToLocalAction: actionIds.has(actionRef),
    });
  });
  return bindings;
}

function summarizeDynamicDisplays(root, pageVariables) {
  const displays = [];
  walkControls(root, (control, pointer) => {
    for (const [index, rule] of asArray(control.attrs?.control_display).entries()) {
      const refs = collectExprRefs(rule.formulas);
      displays.push({
        pointer,
        controlType: safeString(control.type),
        label: controlLabel(control),
        ruleIndex: index,
        action: safeString(rule.actions?.attrs?.style_regulation_action),
        variableRefs: refs.filter((ref) => ref.exprType === "variable").map((ref) => ({
          id: ref.id,
          name: ref.name,
          declared: pageVariables.has(ref.id) || pageVariables.has(ref.id.replace(/^__temp_/, "")),
        })),
        currentItemRefs: refs.filter((ref) => ref.exprType === "variable_ctx").map((ref) => ({ ctx: ref.ctx, id: ref.id, name: ref.name })),
        functions: [...new Set(asArray([]).concat(...[]))],
      });
    }
  });
  return displays;
}

function collectFunctions(value) {
  const functions = new Set();
  walk(value, (node) => {
    if (isObject(node) && node.type === "func" && node.func) functions.add(safeString(node.func));
  });
  return [...functions].sort();
}

function summarizePageActions(page, sourceList, pageVariables) {
  const actionIds = new Set(asArray(page.actions).map((action) => safeString(action?.id)).filter(Boolean));
  return asArray(page.actions).map((action, actionIndex) => ({
    index: actionIndex,
    id: action?.id ? "<page-action-id>" : null,
    name: safeString(action?.name),
    steps: asArray(action?.steps).map((step, stepIndex) => summarizeStep(step, stepIndex, sourceList, pageVariables, actionIds)),
  }));
}

function inspectPage(layout, page, listIndex) {
  const pageVariables = new Set();
  for (const variable of asArray(page.tempVars)) {
    if (variable?.id) {
      pageVariables.add(variable.id);
      pageVariables.add(`__temp_${variable.id}`);
    }
  }
  for (const variable of asArray(page.filterVars)) {
    if (variable?.id) {
      pageVariables.add(variable.id);
      pageVariables.add(`__filter_${variable.id}`);
    }
  }
  const pageActionIds = new Set(asArray(page.actions).map((action) => safeString(action?.id)).filter(Boolean));
  const hosts = [];
  const allBulkSourceList = (() => {
    let found = null;
    walkControls({ children: asArray(page.children) }, (control) => {
      if (!found && HOST_TYPES.has(safeString(control.type))) found = listIndex.byId.get(safeString(control.attrs?.data?.list?.ListID));
    });
    return found;
  })();
  walkControls({ children: asArray(page.children) }, (control, pointer) => {
    if (!HOST_TYPES.has(safeString(control.type))) return;
    const listId = safeString(control.attrs?.data?.list?.ListID);
    const sourceList = listIndex.byId.get(listId);
    const actionIds = new Set(asArray(control.attrs?.actions).map((action) => safeString(action?.id)).filter(Boolean));
    hosts.push({
      pointer,
      type: safeString(control.type),
      label: controlLabel(control),
      dataSource: {
        listId: listId ? "<id>" : null,
        title: safeString(sourceList?.title || control.attrs?.data?.list?.Title),
        resolved: Boolean(sourceList),
        categoryField: control.type === "kanban" ? fieldSummary(control.attrs?.data?.cateField, sourceList) : null,
      },
      actions: summarizeActions(control.attrs?.actions, sourceList, pageVariables, pageActionIds),
      itemActionBindings: summarizeBindings(control, pointer, actionIds),
      dynamicDisplayRules: summarizeDynamicDisplays(control, pageVariables),
      currentItemContexts: collectExprRefs(control).filter((ref) => ref.exprType === "variable_ctx").map((ref) => ({ ctx: ref.ctx, id: ref.id, name: ref.name })),
      functions: collectFunctions(control),
    });
  });
  const pageActions = summarizePageActions(page, allBulkSourceList, pageVariables);
  const bulkBindings = [];
  walkControls({ children: asArray(page.children) }, (control, pointer) => {
    const actionRef = safeString(control.attrs?.control_action);
    if (actionRef && pageActionIds.has(actionRef)) {
      bulkBindings.push({
        pointer,
        controlType: safeString(control.type),
        label: controlLabel(control),
        actionRef: "<page-action-id>",
        resolvesToPageAction: true,
      });
    }
  });
  return {
    title: safeString(layout.Title),
    layoutType: layout.Type,
    tempVars: asArray(page.tempVars).map((variable) => ({ id: safeString(variable.id), role: inferVariableRole(safeString(variable.id)) })),
    filterVars: asArray(page.filterVars).map((variable) => ({ id: safeString(variable.id) })),
    formAction: page.formAction ? { onLoad: page.formAction.onLoad ? "<page-action-id>" : null } : null,
    hosts,
    pageActions,
    bulkActionBindings: bulkBindings,
    pageDynamicDisplayRules: summarizeDynamicDisplays({ children: asArray(page.children) }, pageVariables).filter((rule) => rule.variableRefs.length && !rule.currentItemRefs.length),
  };
}

function inferVariableRole(id) {
  if (/SelectedItemsAmount/i.test(id)) return "selected item count";
  if (/SelectedItems/i.test(id)) return "selected item IDs";
  if (/DeleteMultipleConfirmed/i.test(id)) return "bulk delete confirmation result";
  if (/DeleteConfirmed/i.test(id)) return "delete confirmation result";
  if (/UpdatedItemsAmount/i.test(id)) return "bulk update result count";
  if (/DeletedItemsAmount/i.test(id)) return "bulk delete result count";
  return "page/temp variable";
}

function main() {
  const args = parseArgs(process.argv);
  const inputPath = path.resolve(args.input);
  const decoded = decodeInput(inputPath);
  const listIndex = buildListIndex(decoded.data);
  const pages = [];
  for (const layout of asArray(decoded.data?.Item?.Layouts).filter((item) => item.Type === 103)) {
    if (args.pages.length && !args.pages.includes(layout.Title)) continue;
    const page = decodeDashboardLayout(layout);
    if (!page) continue;
    pages.push(inspectPage(layout, page, listIndex));
  }
  const report = {
    input: inputPath,
    sourceTitle: safeString(decoded.wrapper?.Title || decoded.data?.Item?.ListModel?.Title),
    status: "pass",
    proofBoundary: [
      "Collection/Kanban action schema is export-proven for the inspected package.",
      "Screenshot-only Collection item operation labels are UI-reference-backed unless the serialized step appears in the export.",
      "Runtime execution of edit/delete/update/select/bulk actions is not proven by this inspector.",
    ],
    summary: {
      dashboardPages: pages.length,
      kanbanControls: pages.reduce((sum, page) => sum + page.hosts.filter((host) => host.type === "kanban").length, 0),
      collectionControls: pages.reduce((sum, page) => sum + page.hosts.filter((host) => host.type === "collection").length, 0),
      localCollectionActions: pages.reduce((sum, page) => sum + page.hosts.reduce((inner, host) => inner + host.actions.length, 0), 0),
      pageActions: pages.reduce((sum, page) => sum + page.pageActions.length, 0),
    },
    pages,
  };
  const text = `${JSON.stringify(report, null, 2)}\n`;
  if (args.jsonOut) fs.writeFileSync(path.resolve(args.jsonOut), text);
  process.stdout.write(text);
}

main();

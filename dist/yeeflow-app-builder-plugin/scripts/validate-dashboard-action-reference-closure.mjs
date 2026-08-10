#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { asArray, isObject, parseJsonMaybe, walk } from "./lib/yapk-decode-utils.mjs";

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  const decoded = JSON.parse(fs.readFileSync(args.input, "utf8"));
  const report = validateDashboardActionReferenceClosure({ decoded, staleIds: args.staleIds });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateDashboardActionReferenceClosure({ decoded, staleIds = [], evidence = {} } = {}) {
  const findings = [];
  const index = buildIndex(decoded);
  const stale = new Set(staleIds.map(String));
  let dashboards = 0;
  let collections = 0;

  for (const page of asArray(decoded?.Pages)) {
    if (String(page?.Type) !== "103") continue;
    for (const layoutResource of asArray(page?.LayoutInResources)) {
      const resource = parseJsonMaybe(layoutResource?.Resource);
      if (!isObject(resource)) continue;
      dashboards += 1;
      const pagePath = `Pages[${dashboards - 1}]`;
      validateStaleTargets(resource, index, stale, findings, pagePath);
      validateListItemSteps(resource, index, findings, pagePath);
      walkControls(resource, (control, pointer) => {
        if (["action_button", "container"].includes(String(control.type)) && isAddListItemControl(control)) {
          validateActionTarget(control.attrs || {}, "add", index, findings, `${pagePath}${pointer}.attrs`);
        }
        if (control.type !== "collection") return;
        collections += 1;
        validateCollectionOpenAction(control, index, findings, `${pagePath}${pointer}`);
      });
    }
  }

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    dashboards,
    collections,
    evidence: normalizeEvidence(evidence),
    findings,
  };
}

function normalizeEvidence(evidence) {
  const levels = ["apiAccepted", "persistedReadback", "designerOpen", "browserActionRuntime"];
  const normalized = Object.fromEntries(levels.map((level) => [level, { status: evidence?.[level]?.status || "unattempted" }]));
  return {
    ...normalized,
    // Static persistence evidence is never enough to call an Add/Edit action usable.
    actionsUsable: normalized.browserActionRuntime.status === "passed",
  };
}

function isAddListItemControl(control) {
  const attrs = control?.attrs || {};
  return String(attrs["action-type"] || attrs.actionType || attrs.action_type || "") === "5";
}

function buildIndex(decoded) {
  const lists = new Map();
  const layouts = new Map();
  const listSets = new Set();
  const fields = new Set();
  for (const child of asArray(decoded?.Childs)) {
    const item = child?.Item || child;
    const list = item?.ListModel || item?.List || item || {};
    const listId = string(list.ListID || item?.ListID);
    if (!listId) continue;
    lists.set(listId, item);
    for (const listSetId of [list.ListSetID, item.ListSetID, decoded?.ListSetID]) if (string(listSetId)) listSets.add(string(listSetId));
    for (const field of asArray(item?.Defs || item?.Fields)) if (string(field?.FieldID)) fields.add(string(field.FieldID));
    for (const layout of asArray(item?.Layouts)) {
      const layoutId = string(layout?.LayoutID);
      if (!layoutId) continue;
      layouts.set(layoutId, { listId, role: layoutRole(layout), layout });
    }
  }
  const actions = new Set();
  for (const page of asArray(decoded?.Pages)) {
    if (String(page?.Type) !== "103") continue;
    for (const layoutResource of asArray(page?.LayoutInResources)) {
      const resource = parseJsonMaybe(layoutResource?.Resource);
      walk(resource, (node) => {
        if (isObject(node) && Array.isArray(node.steps) && string(node.id)) actions.add(string(node.id));
      });
    }
  }
  return { lists, layouts, listSets, fields, actions };
}

function validateListItemSteps(resource, index, findings, pagePath) {
  walk(resource, (node, pointer) => {
    if (!isObject(node) || node.type !== "listitem") return;
    const attrs = node.attrs || {};
    const operation = string(attrs.op_type).toLowerCase();
    if (!["add", "edit"].includes(operation)) return;
    validateActionTarget(attrs, operation, index, findings, `${pagePath}${pointer}.attrs`);
  });
}

function validateActionTarget(attrs, operation, index, findings, pointer) {
  const listId = string(attrs?.data?.list?.ListID || attrs?.list?.ListID);
  const layoutId = string(attrs?.layout);
  const layout = index.layouts.get(layoutId);
  const desiredRole = operation === "add" ? "new" : "edit";
  if (!listId || !index.lists.has(listId) || !layoutId || !layout || layout.listId !== listId || layout.role !== desiredRole) {
    findings.push(error("DASHBOARD_ACTION_LAYOUT_UNRESOLVED", "Dashboard listitem action must resolve its current-app ListID and the target list's current Type-1 New/Edit layout.", { path: pointer, operation, listId: listId || null, layoutId: layoutId || null, expectedLayoutRole: desiredRole }));
  }
}

function validateCollectionOpenAction(collection, index, findings, pointer) {
  const listId = string(collection?.attrs?.data?.list?.ListID);
  if (!listId || !index.lists.has(listId)) return;
  const actions = asArray(collection?.attrs?.actions);
  const editActions = actions.filter((action) => asArray(action?.steps).some((step) => string(step?.type) === "listitem" && string(step?.attrs?.op_type).toLowerCase() === "edit"));
  const validEditActions = editActions.filter((action) => {
    const editStep = asArray(action?.steps).find((step) => string(step?.type) === "listitem" && string(step?.attrs?.op_type).toLowerCase() === "edit");
    if (!editStep) return false;
    const attrs = editStep.attrs || {};
    const layout = index.layouts.get(string(attrs.layout));
    return string(action?.type) === "coll"
      && string(attrs?.data?.list?.ListID || attrs?.list?.ListID) === listId
      && layout?.listId === listId
      && layout?.role === "edit"
      && JSON.stringify(attrs).includes("__ctx_coll")
      && JSON.stringify(attrs).includes("ListDataID");
  });
  const bound = new Set();
  forEachDescendant(collection, (node) => {
    const actionId = string(node?.attrs?.control_action);
    if (actionId) bound.add(actionId);
  });
  const hasBoundEditAction = validEditActions.some((action) => bound.has(string(action.id)));
  if (!hasBoundEditAction) {
    findings.push(error("DASHBOARD_COLLECTION_OPEN_ACTION_MISSING", "Collection record-open requires a local coll edit action with current ListID, Edit Type-1 layout, __ctx_coll/ListDataID, and an item-template control_action bound to it.", { path: pointer, listId, localEditActions: editActions.map((action) => string(action.id) || null) }));
  }
}

function validateStaleTargets(resource, index, stale, findings, pagePath) {
  walk(resource, (node, pointer) => {
    if (!isObject(node)) return;
    for (const [key, value] of Object.entries(node)) {
      if (typeof value !== "string" && typeof value !== "number") continue;
      const id = string(value);
      if (!id) continue;
      const isLayoutRef = ["layout", "LayoutID", "link", "linkLayout"].includes(key);
      const isListRef = key === "ListID";
      const isListSetRef = key === "ListSetID";
      const isFieldRef = key === "FieldID" || key === "fieldID";
      const isActionRef = ["control_action", "action", "actionId", "ActionID"].includes(key);
      if (!isLayoutRef && !isListRef && !isListSetRef && !isFieldRef && !isActionRef) continue;
      const unresolved = stale.has(id)
        || (isLayoutRef && !index.layouts.has(id) && !isPlaceholder(id))
        || (isListRef && !index.lists.has(id))
        || (isListSetRef && index.listSets.size > 0 && !index.listSets.has(id))
        || (isFieldRef && index.fields.size > 0 && !index.fields.has(id))
        || (isActionRef && !index.actions.has(id));
      if (unresolved) findings.push(error("DASHBOARD_STALE_LAYOUT_REFERENCE", "Dashboard clone/remap leaves a stale or unresolved current-app action/reference target.", { path: `${pagePath}${pointer}.${key}`, key, id }));
    }
  });
}

function layoutRole(layout) {
  const title = string(layout?.Title || layout?.Name || layout?.LayoutName).toLowerCase();
  const declared = string(layout?.actionTargetRole || layout?.ActionTargetRole).toLowerCase();
  if (declared === "new" || /\bnew\b/.test(title)) return "new";
  if (declared === "edit" || /\bedit\b/.test(title)) return "edit";
  return "other";
}

function walkControls(root, visitor, pointer = "") {
  if (!isObject(root)) return;
  visitor(root, pointer || "$" );
  for (const key of ["children", "columns", "controls"]) asArray(root[key]).forEach((child, index) => walkControls(child, visitor, `${pointer}.${key}[${index}]`));
}

function forEachDescendant(root, visitor) {
  for (const key of ["children", "columns", "controls"]) {
    for (const child of asArray(root?.[key])) {
      if (!isObject(child)) continue;
      visitor(child);
      forEachDescendant(child, visitor);
    }
  }
}

function isPlaceholder(value) { return /\{\{.+\}\}/.test(value); }
function string(value) { return value === undefined || value === null ? "" : String(value); }
function error(code, message, details) { return { level: "error", code, message, ...details }; }

function parseArgs(argv) {
  const args = { input: null, staleIds: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input") args.input = argv[++i];
    else if (arg === "--stale-id") args.staleIds.push(argv[++i]);
    else throw new Error(`Unexpected argument: ${arg}`);
  }
  if (!args.input) throw new Error("Usage: node scripts/validate-dashboard-action-reference-closure.mjs --input <decoded-app.json> [--stale-id <id>]");
  return args;
}

function isMainModule() { return import.meta.url === pathToFileURL(process.argv[1] || "").href; }

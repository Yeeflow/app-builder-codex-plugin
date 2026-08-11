import { asArray, isObject, parseJsonMaybe } from "./yapk-decode-utils.mjs";

// Live Dashboard components have two persisted surfaces.  Updating only
// LayoutView can be accepted by component_save while the runtime continues to
// render the stale LayoutInResources Resource.  Keep the two surfaces in one
// explicit, fail-closed contract instead of treating component_get as proof of
// a usable page.
export function getLiveDashboardBody(component) {
  const detail = component?.Detail || component?.detail || component;
  if (!isObject(detail)) throw failure("DASHBOARD_LIVE_DETAIL_INVALID", "A Dashboard component detail object is required.");
  const layoutId = text(detail.LayoutID || detail.ID || detail.layoutId);
  const resources = asArray(detail.LayoutInResources);
  const resource = resources.find((entry) => text(entry?.ID) === layoutId || text(entry?.RefId) === layoutId) || resources[0];
  const embedded = parsePage(resource?.Resource);
  const layoutView = parsePage(detail.LayoutView);
  return { detail, layoutId, resource, embedded, layoutView };
}

export function normalizeLiveDashboardDetail(component, pageResource) {
  const cloned = structuredClone(component);
  const body = getLiveDashboardBody(cloned);
  if (!body.layoutId) throw failure("DASHBOARD_LIVE_LAYOUT_ID_MISSING", "Live Dashboard Detail must include LayoutID before save.");
  const page = isObject(pageResource) ? structuredClone(pageResource) : body.embedded || body.layoutView;
  if (!isObject(page)) throw failure("DASHBOARD_LIVE_PAGE_RESOURCE_MISSING", "A parseable Dashboard page resource is required before save.");
  const serialized = JSON.stringify(page);
  const detail = body.detail;
  detail.LayoutInResources = asArray(detail.LayoutInResources);
  const resource = body.resource || { ID: body.layoutId, RefId: body.layoutId };
  if (!detail.LayoutInResources.includes(resource)) detail.LayoutInResources.unshift(resource);
  resource.ID = body.layoutId;
  resource.RefId = body.layoutId;
  resource.Resource = serialized;
  // Preserve the live component's scalar shape where known, but always make
  // it semantically identical to the runtime-authoritative embedded resource.
  detail.LayoutView = typeof detail.LayoutView === "object" && detail.LayoutView !== null ? structuredClone(page) : serialized;
  return cloned;
}

export function validateLiveDashboardDetail(component) {
  const findings = [];
  let body;
  try {
    body = getLiveDashboardBody(component);
  } catch (err) {
    return report([toFinding(err)]);
  }
  if (!body.layoutId) findings.push(finding("DASHBOARD_LIVE_LAYOUT_ID_MISSING", "Live Dashboard Detail must include LayoutID."));
  if (!body.resource || !body.embedded) findings.push(finding("DASHBOARD_LIVE_RESOURCE_MISSING", "Live Dashboard Detail must persist a parseable LayoutInResources Resource."));
  if (body.resource && body.layoutId && (text(body.resource.ID) !== body.layoutId || text(body.resource.RefId) !== body.layoutId)) {
    findings.push(finding("DASHBOARD_LIVE_RESOURCE_ID_MISMATCH", "LayoutInResources ID and RefId must equal the live Dashboard LayoutID."));
  }
  if (!body.layoutView) findings.push(finding("DASHBOARD_LIVE_LAYOUTVIEW_MISSING", "Live Dashboard Detail must retain a parseable LayoutView synchronized with the embedded Resource."));
  if (body.embedded && body.layoutView && stableJson(body.embedded) !== stableJson(body.layoutView)) {
    findings.push(finding("DASHBOARD_LIVE_RESOURCE_DRIFT", "LayoutView and LayoutInResources Resource differ; saving this Dashboard could leave runtime content stale."));
  }
  if (body.embedded) validateMasterDetailSelectionClosure(body.embedded, findings);
  return report(findings);
}

function validateMasterDetailSelectionClosure(page, findings) {
  const left = findByIdentity(page, "left_panel_data_items_wrapper");
  const current = findByIdentity(page, "current_item_wrapper");
  const tempVars = asArray(page.tempVars);
  const isMasterDetail = Boolean(left || current || tempVars.some((entry) => /vCurrentItemID/.test(`${entry?.id || ""} ${entry?.name || ""}`)));
  if (!isMasterDetail) return;
  if (!left || !current) {
    findings.push(finding("DASHBOARD_MASTER_DETAIL_COLLECTION_MISSING", "Master-detail Dashboard requires both left_panel_data_items_wrapper and current_item_wrapper Collections."));
    return;
  }
  const leftListId = text(left?.attrs?.data?.list?.ListID);
  const currentData = current?.attrs?.data || {};
  if (!leftListId || leftListId !== text(currentData?.list?.ListID)) findings.push(finding("DASHBOARD_MASTER_DETAIL_SOURCE_MISMATCH", "Left and current-item Collections must use the same Data List."));
  const action = asArray(left?.attrs?.actions).find((candidate) => hasCurrentItemSetVar(candidate));
  const boundActionIds = new Set();
  visit(left, (node) => { if (text(node?.attrs?.control_action)) boundActionIds.add(text(node.attrs.control_action)); });
  if (!action || !boundActionIds.has(text(action.id))) findings.push(finding("DASHBOARD_MASTER_DETAIL_SELECTION_ACTION_MISSING", "A clickable left Collection item must bind a local coll action that writes __ctx_coll/ListDataID to vCurrentItemID."));
  if (currentData.limit !== true || Number(currentData.ps) !== 1 || !containsCurrentItemFilter(currentData.filter)) {
    findings.push(finding("DASHBOARD_MASTER_DETAIL_CURRENT_ITEM_FILTER_INVALID", "Current-item Collection must limit to one record and filter ListDataID by vCurrentItemID."));
  }
}

function hasCurrentItemSetVar(action) {
  if (text(action?.type) !== "coll") return false;
  return asArray(action?.steps).some((step) => {
    if (text(step?.type) !== "setvar") return false;
    const attrs = step.attrs || {};
    return /vCurrentItemID/.test(stableJson(attrs.setvar_var)) && /__ctx_coll/.test(stableJson(attrs.setvar_val)) && /ListDataID/.test(stableJson(attrs.setvar_val));
  });
}

function containsCurrentItemFilter(filters) {
  return asArray(filters).some((entry) => text(entry?.left) === "ListDataID" && /vCurrentItemID/.test(stableJson(entry?.right)));
}

function parsePage(value) {
  if (isObject(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = parseJsonMaybe(value);
  return isObject(parsed) ? parsed : null;
}

function findByIdentity(root, identity) {
  let found = null;
  visit(root, (node) => {
    if (!found && [node?.id, node?.name, node?.nv_label, node?.attrs?.nv_label].some((value) => text(value) === identity)) found = node;
  });
  return found;
}

function visit(node, fn) {
  if (!isObject(node)) return;
  fn(node);
  for (const key of ["children", "columns", "controls"]) asArray(node[key]).forEach((child) => visit(child, fn));
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (!isObject(value)) return JSON.stringify(value);
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
}
function text(value) { return value === undefined || value === null ? "" : String(value); }
function finding(code, message) { return { level: "error", code, message }; }
function failure(code, message) { const err = new Error(message); err.code = code; return err; }
function toFinding(err) { return finding(err?.code || "DASHBOARD_LIVE_DETAIL_INVALID", err?.message || "Live Dashboard Detail is invalid."); }
function report(findings) { return { status: findings.length ? "fail" : "pass", findings }; }

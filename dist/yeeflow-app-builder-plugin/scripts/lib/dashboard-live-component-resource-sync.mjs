import { asArray, isObject, parseJsonMaybe } from "./yapk-decode-utils.mjs";

// A live Dashboard may have an empty LayoutView while the Designer/runtime use
// LayoutInResources[].Resource.  Treat the embedded resource as authoritative;
// do not turn a legitimate embedded-only component into a made-up dual-surface
// model merely because component_save accepts it.
export function getLiveDashboardBody(component) {
  const detail = component?.Detail || component?.detail || component;
  if (!isObject(detail)) throw failure("DASHBOARD_LIVE_DETAIL_INVALID", "A Dashboard component detail object is required.");
  const layoutId = text(detail.LayoutID || detail.ID || detail.layoutId);
  const resources = asArray(detail.LayoutInResources);
  const resource = resources.find((entry) => text(entry?.ID) === layoutId || text(entry?.RefId) === layoutId) || resources[0];
  const embedded = parsePage(resource?.Resource);
  const layoutView = parsePage(detail.LayoutView);
  return { detail, layoutId, resources, resource, embedded, layoutView };
}

export function classifyLiveDashboardResourceMode(component) {
  const body = getLiveDashboardBody(component);
  if (body.embedded && !body.layoutView) return { mode: "embedded-only", ...body };
  if (body.embedded && body.layoutView && stableJson(body.embedded) === stableJson(body.layoutView)) return { mode: "mirrored", ...body };
  if (body.embedded) return { mode: "embedded-authoritative", ...body };
  if (body.layoutView) return { mode: "layoutview-only", ...body };
  return { mode: "unmaterialized", ...body };
}

// pageResource is the intended runtime page.  Preserve the existing LayoutView
// representation by default: a blank LayoutView is valid and is not a defect.
export function normalizeLiveDashboardDetail(component, pageResource, options = {}) {
  const cloned = structuredClone(component);
  const body = getLiveDashboardBody(cloned);
  if (!body.layoutId) throw failure("DASHBOARD_LIVE_LAYOUT_ID_MISSING", "Live Dashboard Detail must include LayoutID before save.");
  const page = isObject(pageResource) ? structuredClone(pageResource) : body.embedded || body.layoutView;
  if (!isObject(page)) throw failure("DASHBOARD_LIVE_PAGE_RESOURCE_MISSING", "A parseable Dashboard page resource is required before save.");

  const detail = body.detail;
  detail.LayoutInResources = asArray(detail.LayoutInResources);
  const resource = body.resource || { ID: body.layoutId, RefId: body.layoutId };
  if (!detail.LayoutInResources.includes(resource)) detail.LayoutInResources.unshift(resource);
  resource.ID = body.layoutId;
  resource.RefId = body.layoutId;
  resource.Resource = JSON.stringify(page);

  // Explicit opt-in is retained for genuine mirrored legacy components only.
  if (options.syncLayoutView === true) {
    detail.LayoutView = typeof detail.LayoutView === "object" && detail.LayoutView !== null ? structuredClone(page) : JSON.stringify(page);
  }
  return cloned;
}

export function validateLiveDashboardDetail(component, options = {}) {
  const findings = [];
  let body;
  try {
    body = classifyLiveDashboardResourceMode(component);
  } catch (err) {
    return report([toFinding(err)]);
  }

  const customCodeProfile = options.profile === "custom-code" || options.requireCodeIn === true;
  const resourceRequired = options.requireEmbeddedResource !== false;
  if (!body.layoutId) findings.push(finding("DASHBOARD_LIVE_LAYOUT_ID_MISSING", "Live Dashboard Detail must include LayoutID."));
  if (resourceRequired && (!body.resource || !body.embedded)) {
    findings.push(finding("DASHBOARD_RESOURCE_NOT_MATERIALIZED", "Live Dashboard Detail must persist a parseable LayoutInResources Resource; LayoutView alone is not runtime materialization."));
  }
  if (body.resource && body.layoutId && (text(body.resource.ID) !== body.layoutId || text(body.resource.RefId) !== body.layoutId)) {
    findings.push(finding("DASHBOARD_RESOURCE_ID_MISMATCH", "LayoutInResources ID and RefId must equal the live Dashboard LayoutID."));
  }
  if ((customCodeProfile || options.requireSingleResource === true) && body.resources.length !== 1) {
    findings.push(finding("DASHBOARD_RESOURCE_NOT_MATERIALIZED", "A generated Custom Code Dashboard must have exactly one embedded LayoutInResources Resource."));
  }

  if (body.embedded) {
    const containsCodeIn = hasCodeIn(body.embedded);
    if (customCodeProfile || containsCodeIn) validateMainContentTopology(body.embedded, findings);
    if (customCodeProfile) validateCodeIn(body.embedded, findings);
    validateMasterDetailSelectionClosure(body.embedded, findings);
  }
  return report(findings, { resourceMode: body.mode });
}

// Compare the runtime-authoritative resource only. LayoutView mode is preserved
// and intentionally excluded: its blank/legacy representation is not proof of
// a runtime regression.
export function validateLiveDashboardPostSave(intendedComponent, readbackComponent, options = {}) {
  const findings = [
    ...validateLiveDashboardDetail(intendedComponent, options).findings,
    ...validateLiveDashboardDetail(readbackComponent, options).findings,
  ];
  let intended;
  let readback;
  try {
    intended = classifyLiveDashboardResourceMode(intendedComponent);
    readback = classifyLiveDashboardResourceMode(readbackComponent);
  } catch (err) {
    return report([...findings, toFinding(err)]);
  }
  if (intended.layoutId !== readback.layoutId || !intended.embedded || !readback.embedded || stableJson(intended.embedded) !== stableJson(readback.embedded)) {
    findings.push(finding("DASHBOARD_POSTSAVE_DRIFT", "Persisted Dashboard Resource does not match the intended runtime-authoritative Resource after component_save."));
  }
  return report(findings, { intendedResourceMode: intended.mode, readbackResourceMode: readback.mode });
}

// Report evidence levels without promoting API acceptance/readback into an
// interaction claim. This may be used by incremental-build ledgers and handoff
// reports without retaining a tenant payload.
export function buildDashboardEvidenceReport(evidence = {}) {
  const normalized = {
    apiAccepted: evidence.apiAccepted === true,
    persistedReadback: evidence.persistedReadback === true,
    designerOpen: evidence.designerOpen === true,
    browserActionRuntime: evidence.browserActionRuntime === true,
  };
  return {
    ...normalized,
    actionsUsable: normalized.browserActionRuntime,
    strongestEvidence: normalized.browserActionRuntime
      ? "browserActionRuntime"
      : normalized.designerOpen
        ? "designerOpen"
        : normalized.persistedReadback
          ? "persistedReadback"
          : normalized.apiAccepted
            ? "apiAccepted"
            : "none",
  };
}

function validateMainContentTopology(page, findings) {
  const main = findDirectByIdentity(page, "main");
  const content = main && findDirectByIdentity(main, "content");
  if (!main || !content) findings.push(finding("DASHBOARD_ROOT_STRUCTURE_INVALID", "Generated Custom Code Dashboard Resource must use the main -> content root topology."));
}

function validateCodeIn(page, findings) {
  const controls = [];
  visit(page, (node) => { if (text(node?.type) === "codein") controls.push(node); });
  if (controls.length !== 1 || !text(controls[0]?.attrs?.["codein-script"]).trim()) {
    findings.push(finding("DASHBOARD_CODEIN_MISSING", "Generated Custom Code Dashboard must contain exactly one codein control with a non-empty attrs.codein-script."));
  }
}

function hasCodeIn(page) {
  let found = false;
  visit(page, (node) => { if (text(node?.type) === "codein") found = true; });
  return found;
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

function findDirectByIdentity(parent, identity) {
  return asArray(parent?.children).find((node) => isIdentity(node, identity)) || null;
}

function findByIdentity(root, identity) {
  let found = null;
  visit(root, (node) => { if (!found && isIdentity(node, identity)) found = node; });
  return found;
}

function isIdentity(node, identity) {
  return [node?.id, node?.name, node?.nv_label, node?.attrs?.nv_label].some((value) => text(value).toLowerCase() === identity.toLowerCase());
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
function report(findings, extra = {}) { return { status: findings.length ? "fail" : "pass", findings, ...extra }; }

#!/usr/bin/env node

import fs from "node:fs";
import zlib from "node:zlib";
import { pathToFileURL } from "node:url";
import { asArray, isObject, quoteLargeJsonIntegers } from "./lib/yapk-decode-utils.mjs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NUMERIC_RE = /^\d{12,}$/;

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.previousPackage || !args.newPackage || !args.scope) usage(args.help ? 0 : 1);
  const report = validateYapkUpgradeScope(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateYapkUpgradeScope({ previousPackage, newPackage, scope } = {}) {
  const findings = [];
  let previous;
  let next;
  let scopeManifest;
  try {
    previous = readPackageLike(previousPackage).decoded;
    next = readPackageLike(newPackage).decoded;
    scopeManifest = readJson(scope);
  } catch (error) {
    return report(previousPackage, newPackage, scope, [finding("error", "UPGRADE_SCOPE_INPUT_READ_FAILED", error.message)]);
  }

  const rules = normalizeScope(scopeManifest);
  validateDeclaredScope(rules, findings);
  validateWrapperIdentity(readPackageLike(newPackage).wrapper, rules, findings);
  validateRootIdentity(previous, next, findings);
  validateListScope(previous, next, rules, findings);
  validateUnrelatedCollections(previous, next, rules, findings);
  validateDashboardFullPackageScope(previous, next, rules, findings);
  validateApprovalDefResourceScope(previous, next, rules, findings);

  return report(previousPackage, newPackage, scope, findings, {
    upgradeType: rules.upgradeType,
    targetLists: [...rules.targetListIds],
    allowedChanges: [...rules.allowedChanges],
    disallowedChanges: [...rules.disallowedChanges],
  });
}

function validateDashboardFullPackageScope(previous, next, rules, findings) {
  const isDashboardUpgrade = rules.upgradeType === "dashboard" || rules.upgradeType === "dashboard-only" || rules.allowedChangeTypes.has("dashboard");
  if (!isDashboardUpgrade) return;
  const groups = ["Childs", "Forms", "FormNewReports", "DataReports", "Groups", "Tags", "Metadatas", "Agents", "Connections", "Knowledges", "Themes", "Components", "PortalInfo"];
  for (const group of groups) {
    if (group === "FormNewReports" && isInstalledFormNewReportsOmission(previous, next, rules)) continue;
    if (stableJson(previous?.[group] ?? null) !== stableJson(next?.[group] ?? null)) {
      findings.push(finding("error", "UPGRADE_DASHBOARD_ONLY_NON_DASHBOARD_RESOURCE_MUTATION", "Dashboard-only upgrades must be full upgrade packages and preserve non-Dashboard resource groups unchanged.", { resource: group }));
    }
  }
  const previousPages = asArray(previous?.Pages);
  const nextPages = asArray(next?.Pages);
  if (previousPages.length !== nextPages.length) {
    findings.push(finding("error", "UPGRADE_DASHBOARD_ONLY_PAGE_COUNT_DRIFT", "Dashboard-only upgrades must preserve the existing page set and replace only declared Dashboard page resources.", { previousPages: previousPages.length, nextPages: nextPages.length }));
  }
  const targetTitles = new Set(asArray(rules.targetPages || rules.targetDashboardPages).map((item) => scalar(isObject(item) ? item.Title || item.title || item.name : item)).filter(Boolean));
  if (targetTitles.size) {
    const previousByTitle = new Map(previousPages.map((page) => [titleOf(page), stableJson(page)]));
    for (const page of nextPages) {
      const title = titleOf(page);
      if (targetTitles.has(title)) continue;
      if (previousByTitle.has(title) && previousByTitle.get(title) !== stableJson(page)) {
        findings.push(finding("error", "UPGRADE_DASHBOARD_ONLY_UNDECLARED_PAGE_MUTATION", "Dashboard-only upgrades may mutate only declared target Dashboard pages.", { page: title }));
      }
    }
  }
}

function validateDeclaredScope(rules, findings) {
  if (!rules.upgradeType) findings.push(finding("error", "UPGRADE_SCOPE_TYPE_MISSING", "Upgrade scope must declare upgradeType such as field-only, list-only, dashboard, approval, report, workflow, or navigation."));
  if (!rules.targetResourceType) findings.push(finding("error", "UPGRADE_SCOPE_TARGET_TYPE_MISSING", "Upgrade scope must declare targetResourceType."));
  if (!rules.targetListIds.size && ["field-only", "list-only"].includes(rules.upgradeType)) {
    findings.push(finding("error", "UPGRADE_SCOPE_TARGET_LIST_MISSING", "Field-only/list-only upgrade scope must declare the target data list."));
  }
  if (!rules.allowedChanges.size) findings.push(finding("error", "UPGRADE_SCOPE_ALLOWED_CHANGES_MISSING", "Upgrade scope must declare allowed changes."));
  if (!rules.disallowedChanges.size) findings.push(finding("error", "UPGRADE_SCOPE_DISALLOWED_CHANGES_MISSING", "Upgrade scope must declare disallowed unrelated changes."));
}

function validateWrapperIdentity(wrapper, rules, findings) {
  if (!wrapper || !isObject(wrapper)) return;
  if (rules.packageKind !== "upgrade") return;
  if (wrapper.PackageId && NUMERIC_RE.test(String(wrapper.PackageId))) {
    findings.push(finding("error", "UPGRADE_WRAPPER_PACKAGEID_NUMERIC", "Upgrade wrapper PackageId must be Version Management-compatible UUID-like metadata, not a generated numeric content ID.", { packageIdShape: "numeric" }));
  } else if (wrapper.PackageId && !UUID_RE.test(String(wrapper.PackageId))) {
    findings.push(finding("warning", "UPGRADE_WRAPPER_PACKAGEID_NOT_UUID", "Upgrade wrapper PackageId should be UUID-like for Version Management compatibility.", { packageIdShape: "non-uuid" }));
  }
  if (wrapper.TenantID && rules.generatedContentIds.has(String(wrapper.TenantID))) {
    findings.push(finding("error", "UPGRADE_WRAPPER_TENANTID_CONTENT_ID", "Upgrade wrapper TenantID is tenant metadata and must not be a generated app content ID.", { tenantId: redactId(wrapper.TenantID) }));
  }
  if (String(wrapper.Author || "").trim().toLowerCase() === "codex") {
    findings.push(finding("warning", "UPGRADE_WRAPPER_AUTHOR_GENERIC", "Upgrade wrapper Author should use real Yeeflow author metadata when available.", { author: "Codex" }));
  }
}

function validateRootIdentity(previous, next, findings) {
  const prevRoot = previous?.ListSet || {};
  const nextRoot = next?.ListSet || {};
  for (const key of ["ListID", "ListSetID", "AppID"]) {
    const before = scalar(prevRoot[key] ?? previous?.[key]);
    const after = scalar(nextRoot[key] ?? next?.[key]);
    if (before && after && before !== after) {
      findings.push(finding("error", "UPGRADE_ROOT_IDENTITY_DRIFT", "Existing app root IDs must be preserved in upgrade packages.", { field: key, previous: redactId(before), next: redactId(after) }));
    }
  }
}

function validateListScope(previous, next, rules, findings) {
  const prevLists = listMap(previous);
  const nextLists = listMap(next);
  for (const [key, prevChild] of prevLists.entries()) {
    const nextChild = nextLists.get(key);
    if (!nextChild) {
      findings.push(finding("error", "UPGRADE_EXISTING_LIST_REMOVED", "Existing data lists must not disappear during an upgrade.", { list: key }));
      continue;
    }
    const isTarget = rules.targetListIds.has(key) || rules.targetListTitles.has(titleOf(prevChild.List));
    if (!isTarget && stableJson(prevChild) !== stableJson(nextChild)) {
      findings.push(finding("error", "UPGRADE_OUT_OF_SCOPE_LIST_MUTATION", "Data list changed outside declared upgrade scope.", { list: titleOf(prevChild.List) || key }));
    }
  }
  for (const [key, nextChild] of nextLists.entries()) {
    if (!prevLists.has(key) && !rules.allowNewLists) {
      findings.push(finding("error", "UPGRADE_NEW_LIST_OUTSIDE_SCOPE", "New data list appeared without explicit upgrade scope.", { list: titleOf(nextChild.List) || key }));
    }
  }
}

function validateUnrelatedCollections(previous, next, rules, findings) {
  const fieldOnly = ["field-only", "list-only"].includes(rules.upgradeType);
  const checks = [
    ["Pages", "dashboards/pages", "dashboard"],
    ["Workflows", "workflows", "workflow"],
    ["FormNewReports", "FormNewReports", "report"],
    ["DataReports", "DataReports", "report"],
  ];
  for (const [key, label, changeType] of checks) {
    const before = stableJson(asArray(previous?.[key]));
    const after = stableJson(asArray(next?.[key]));
    if (before === after) continue;
    if (key === "FormNewReports" && isInstalledFormNewReportsOmission(previous, next, rules)) continue;
    if (rules.allowedChangeTypes.has(changeType) || rules.allowedChangeTypes.has(key.toLowerCase())) continue;
    if (fieldOnly || rules.disallowedChanges.has(changeType) || rules.disallowedChanges.has(key.toLowerCase())) {
      findings.push(finding("error", "UPGRADE_OUT_OF_SCOPE_RESOURCE_MUTATION", `${label} changed outside declared upgrade scope.`, { resource: key }));
    }
  }
  const previousNavigation = stableJson(previous?.ListSet?.LayoutView || previous?.Navigation || null);
  const nextNavigation = stableJson(next?.ListSet?.LayoutView || next?.Navigation || null);
  if (previousNavigation !== nextNavigation && !rules.allowedChangeTypes.has("navigation")) {
    findings.push(finding("error", "UPGRADE_NAVIGATION_MUTATION_OUTSIDE_SCOPE", "Navigation changed outside declared upgrade scope."));
  }
}

function isInstalledFormNewReportsOmission(previous, next, rules) {
  const isDashboardUpgrade = rules.upgradeType === "dashboard" || rules.upgradeType === "dashboard-only" || rules.allowedChangeTypes.has("dashboard");
  if (!isDashboardUpgrade) return false;
  if (rules.allowedChangeTypes.has("report") || rules.allowedChangeTypes.has("formnewreports")) return false;
  const previousReports = asArray(previous?.FormNewReports);
  const nextReports = asArray(next?.FormNewReports);
  return previousReports.length > 0 && nextReports.length === 0;
}

function validateApprovalDefResourceScope(previous, next, rules, findings) {
  const prevForms = stableJson(asArray(previous?.Forms));
  const nextForms = stableJson(asArray(next?.Forms));
  if (prevForms !== nextForms && !rules.allowedChangeTypes.has("approval") && ["field-only", "list-only"].includes(rules.upgradeType)) {
    findings.push(finding("error", "UPGRADE_APPROVAL_FORM_MUTATION_OUTSIDE_SCOPE", "Field-only/list-only upgrades must not rebuild or mutate approval forms."));
  }
  if (prevForms === nextForms && !rules.allowedChangeTypes.has("approval")) return;
  for (const [index, form] of asArray(next?.Forms).entries()) {
    const def = decodeApprovalDefResource(form?.DefResource);
    if (!def) {
      findings.push(finding("error", "UPGRADE_APPROVAL_DEFRESOURCE_INVALID", "Approval DefResource included in an upgrade must use canonical ::brotli:: Brotli/base64 encoding.", { path: `Forms[${index}].DefResource` }));
      continue;
    }
    validateApprovalDef(def, `Forms[${index}].DefResource`, findings);
  }
}

function validateApprovalDef(def, path, findings) {
  const pages = asArray(def.pageurls);
  const seenPageIds = new Set();
  const seenControlIds = new Set();
  if (!pages.length) findings.push(finding("error", "UPGRADE_APPROVAL_PAGEURLS_MISSING", "Approval DefResource must include page registrations.", { path: `${path}.pageurls` }));
  for (const [pageIndex, page] of pages.entries()) {
    const pagePath = `${path}.pageurls[${pageIndex}]`;
    const pageId = scalar(page?.id || page?.pageId || page?.key);
    if (!UUID_RE.test(pageId)) findings.push(finding("error", "UPGRADE_APPROVAL_PAGE_ID_NOT_UUID", "Approval page IDs in upgrade DefResource must be UUID-shaped.", { path: `${pagePath}.id` }));
    if (seenPageIds.has(pageId)) findings.push(finding("error", "UPGRADE_APPROVAL_PAGE_ID_DUPLICATE", "Approval page IDs must be unique.", { path: `${pagePath}.id` }));
    seenPageIds.add(pageId);
    const formdef = page?.formdef;
    const children = asArray(formdef?.children);
    if (!children.length) findings.push(finding("error", "UPGRADE_APPROVAL_FORMDEF_CHILDREN_MISSING", "Approval page formdef must include designer children.", { path: `${pagePath}.formdef.children` }));
    if (!hasControlNamed(children, "Main") || !hasControlNamed(children, "Content")) {
      findings.push(finding("error", "UPGRADE_APPROVAL_MAIN_CONTENT_MISSING", "Approval pages must contain export-shaped Main and Content containers.", { path: `${pagePath}.formdef.children` }));
    }
    walkControls(children, (control) => {
      const id = scalar(control.id || control.ID || control.key);
      if (!id) return;
      if (seenControlIds.has(id)) findings.push(finding("error", "UPGRADE_APPROVAL_CONTROL_ID_DUPLICATE", "Designer control IDs must be page-scoped and globally unique within DefResource.", { controlId: id }));
      seenControlIds.add(id);
    });
  }
  const shapes = asArray(def.childshapes);
  if (!shapes.length) findings.push(finding("error", "UPGRADE_APPROVAL_WORKFLOW_GRAPH_MISSING", "Approval DefResource must include workflow childshapes.", { path: `${path}.childshapes` }));
  for (const [index, shape] of shapes.entries()) {
    const stencil = scalar(shape?.stencil?.id || shape?.type || shape?.Type);
    const isTask = /task/i.test(stencil);
    if (!isObject(shape?.bounds) && !isObject(shape?.position) && !isObject(shape?.dockers)) {
      findings.push(finding("error", "UPGRADE_APPROVAL_GRAPH_POSITION_MISSING", "Workflow graph shapes must include positions/bounds/dockers.", { path: `${path}.childshapes[${index}]` }));
    }
    if (isTask) {
      const props = shape.properties || {};
      const assignee = props.usertaskassignment || props.assignment || props.assignee || props.assignees;
      if (!assignee || (Array.isArray(assignee) && assignee.length === 0)) findings.push(finding("error", "UPGRADE_APPROVAL_TASK_ASSIGNEE_MISSING", "Approval task nodes must include assignee configuration.", { path: `${path}.childshapes[${index}].properties` }));
      const outgoing = asArray(shape.outgoing).map((item) => scalar(item.resourceId || item.ResourceId || item.id || item.name || item.title || item.label));
      const routeText = stableJson([shape.outgoing, props.outcomes, props.routes, props.actions]).toLowerCase();
      if (!/approved|approve/.test(routeText) || !/rejected|reject/.test(routeText)) {
        findings.push(finding("error", "UPGRADE_APPROVAL_TASK_ROUTES_AMBIGUOUS", "Approval task nodes must expose explicit Approved and Rejected outgoing paths.", { path: `${path}.childshapes[${index}].outgoing`, outgoing }));
      }
      if (!props.taskurl && !props.taskUrl && !props.TaskUrl) findings.push(finding("error", "UPGRADE_APPROVAL_TASKURL_MISSING", "Approval task nodes must include task URL aliases.", { path: `${path}.childshapes[${index}].properties.taskurl` }));
    }
  }
  const text = stableJson(def).toLowerCase();
  if (!/workflow.*history|history.*workflow|workflowpanel|workflow panel|control panel/.test(text)) {
    findings.push(finding("error", "UPGRADE_APPROVAL_WORKFLOW_PANEL_HISTORY_MISSING", "Approval DefResource must include workflow panel/history metadata."));
  }
}

function readPackageLike(file) {
  const parsed = readJson(file);
  if (isObject(parsed) && typeof parsed.Resource === "string") {
    return { wrapper: parsed, decoded: JSON.parse(quoteLargeJsonIntegers(zlib.brotliDecompressSync(Buffer.from(parsed.Resource, "base64")).toString("utf8"))) };
  }
  return { wrapper: null, decoded: parsed };
}

function decodeApprovalDefResource(raw) {
  if (typeof raw !== "string") return null;
  try {
    const bytes = Buffer.from(raw, "base64");
    const prefix = Buffer.from("::brotli::");
    if (!bytes.subarray(0, prefix.length).equals(prefix)) return null;
    return JSON.parse(quoteLargeJsonIntegers(zlib.brotliDecompressSync(bytes.subarray(prefix.length)).toString("utf8")));
  } catch {
    return null;
  }
}

function normalizeScope(scope) {
  const targetLists = asArray(scope?.targetLists || scope?.targetDataLists || scope?.targets?.lists);
  const generatedContentIds = new Set(asArray(scope?.generatedContentIds).map(scalar).filter(Boolean));
  return {
    packageKind: scalar(scope?.packageKind || scope?.packageType || "upgrade").toLowerCase(),
    upgradeType: scalar(scope?.upgradeType || scope?.scopeType || scope?.type).toLowerCase(),
    targetResourceType: scalar(scope?.targetResourceType || scope?.resourceType || scope?.target?.type).toLowerCase(),
    targetListIds: new Set(targetLists.map((item) => scalar(isObject(item) ? item.ListID || item.listId || item.id : item)).filter(Boolean)),
    targetListTitles: new Set(targetLists.map((item) => scalar(isObject(item) ? item.Title || item.title || item.name : "")).filter(Boolean)),
    allowedChanges: new Set(asArray(scope?.allowedChanges).map((item) => scalar(item).toLowerCase()).filter(Boolean)),
    disallowedChanges: new Set(asArray(scope?.disallowedChanges || scope?.forbiddenChanges).map((item) => scalar(item).toLowerCase()).filter(Boolean)),
    allowedChangeTypes: new Set(asArray(scope?.allowedResourceTypes || scope?.allowedChangeTypes).map((item) => scalar(item).toLowerCase()).filter(Boolean)),
    allowNewLists: scope?.allowNewLists === true,
    targetPages: asArray(scope?.targetPages || scope?.targetDashboardPages || scope?.targets?.pages),
    generatedContentIds,
  };
}

function listMap(decoded) {
  const map = new Map();
  for (const child of asArray(decoded?.Childs)) {
    const key = scalar(child?.List?.ListID || child?.ListID || child?.List?.Title || child?.Title);
    if (key) map.set(key, child);
  }
  return map;
}

function hasControlNamed(children, name) {
  let found = false;
  walkControls(children, (control) => {
    const label = scalar(control.id || control.name || control.label || control.type || control.Type);
    if (label === name) found = true;
  });
  return found;
}

function walkControls(value, visitor) {
  for (const item of asArray(value)) walk(item, visitor);
}

function walk(value, visitor) {
  if (!isObject(value)) return;
  visitor(value);
  for (const key of ["children", "columns", "controls", "items", "rows", "cells", "list", "content"]) {
    for (const child of asArray(value[key])) walk(child, visitor);
  }
}

function readJson(file) {
  return JSON.parse(quoteLargeJsonIntegers(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")));
}

function report(previousPackage, newPackage, scope, findings, summary = {}) {
  return {
    status: findings.some((item) => item.level === "error") ? "fail" : "pass",
    previousPackage: safePath(previousPackage),
    newPackage: safePath(newPackage),
    scope: safePath(scope),
    summary,
    proofBoundary: "Upgrade scope validation proves package changes stay inside the declared local scope only. API acceptance, Version Management final status, and runtime proof remain separate gates.",
    findings,
  };
}

function finding(level, code, message, detail = {}) {
  return { level, code, message, ...detail };
}

function stableJson(value) {
  return JSON.stringify(value, Object.keys(flatKeys(value)).sort());
}

function flatKeys(value, keys = {}) {
  if (Array.isArray(value)) value.forEach((item) => flatKeys(item, keys));
  else if (isObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      keys[key] = true;
      flatKeys(child, keys);
    }
  }
  return keys;
}

function scalar(value) {
  return value === undefined || value === null ? "" : String(value);
}

function titleOf(value) {
  return scalar(value?.Title || value?.Name || value?.title || value?.name);
}

function safePath(file) {
  return file ? file.split("/").slice(-3).join("/") : null;
}

function redactId(value) {
  const text = scalar(value);
  return text.length > 8 ? `${text.slice(0, 4)}...${text.slice(-4)}` : text;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") args.help = true;
    else if (token === "--previous-package") args.previousPackage = argv[++i];
    else if (token === "--new-package" || token === "--package") args.newPackage = argv[++i];
    else if (token === "--scope") args.scope = argv[++i];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function usage(exitCode) {
  console.error("Usage:\n  node scripts/validate-yapk-upgrade-scope.mjs --previous-package <previous.json|yapk> --new-package <new.json|yapk> --scope <upgrade-scope.json>");
  process.exit(exitCode);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}

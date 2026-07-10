#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { asArray, isObject, parseJsonMaybe, readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.package || !args.idProvenance) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateYapkNavigationRuntimeMetadata(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateYapkNavigationRuntimeMetadata({ package: packagePath, idProvenance }) {
  const findings = [];
  if (!packagePath || !fs.existsSync(packagePath)) {
    return fail("YAPK_PACKAGE_MISSING", "Package file is missing.", { package: packagePath });
  }
  if (!idProvenance || !fs.existsSync(idProvenance)) {
    return fail("NAVIGATION_ID_PROVENANCE_MANIFEST_MISSING", "ID provenance manifest is required to prove navigation group IDs are API-issued.", { idProvenance });
  }

  let wrapper;
  let decoded;
  let provenance;
  try {
    ({ wrapper, decoded } = readDecodedYapk(packagePath));
  } catch (error) {
    return fail("YAPK_RESOURCE_DECODE_FAILED", `Could not decode package Resource: ${error.message}`);
  }
  try {
    provenance = JSON.parse(fs.readFileSync(idProvenance, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    return fail("NAVIGATION_ID_PROVENANCE_MANIFEST_INVALID_JSON", `Could not parse ID provenance manifest: ${error.message}`);
  }

  const apiIds = allocatedIdSet(provenance);
  const appId = wrapper.AppID;
  const rootListSetId = decoded?.ListSet?.ListID ?? wrapper.ListID;
  const layoutView = parseJsonMaybe(decoded?.ListSet?.LayoutView);
  const sort = asArray(layoutView?.sort);
  if (!sort.length) {
    findings.push(error("NAVIGATION_SORT_MISSING", "Root ListSet.LayoutView.sort[] navigation is missing or empty."));
  }

  const targets = buildTargetIndex(decoded);
  let groupCount = 0;
  let childCount = 0;
  sort.forEach((entry, index) => {
    if (entry?.Type === "classes") {
      groupCount += 1;
      validateGroup(entry, `decoded.ListSet.LayoutView.sort[${index}]`, { appId, rootListSetId, apiIds, targets, findings });
      childCount += asArray(entry.list).length;
      return;
    }
    validateChild(entry, `decoded.ListSet.LayoutView.sort[${index}]`, { appId, rootListSetId, targets, findings });
    childCount += 1;
  });

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    package: path.resolve(packagePath),
    idProvenance: path.resolve(idProvenance),
    appId,
    rootListSetId: rootListSetId === undefined ? null : String(rootListSetId),
    navigationGroups: groupCount,
    navigationItems: childCount,
    findings,
  };
}

function validateGroup(group, pointer, context) {
  const { appId, rootListSetId, apiIds, targets, findings } = context;
  requireField(group, "ID", pointer, findings, "NAVIGATION_GROUP_ID_MISSING");
  requireField(group, "AppID", pointer, findings, "NAVIGATION_GROUP_APPID_MISSING");
  requireField(group, "ListSetID", pointer, findings, "NAVIGATION_GROUP_LISTSETID_MISSING");
  requireField(group, "Type", pointer, findings, "NAVIGATION_GROUP_TYPE_MISSING");
  requireField(group, "Title", pointer, findings, "NAVIGATION_GROUP_TITLE_MISSING");
  requireField(group, "Icon", pointer, findings, "NAVIGATION_GROUP_ICON_MISSING");
  if (!Array.isArray(group.list)) findings.push(error("NAVIGATION_GROUP_LIST_MISSING", "Navigation group must include list[].", { path: pointer }));
  if ("children" in group) findings.push(error("NAVIGATION_GROUP_CHILDREN_FORBIDDEN", "Navigation group must not use children.", { path: pointer }));
  if ("Childs" in group) findings.push(error("NAVIGATION_GROUP_CHILDS_FORBIDDEN", "Navigation group must not use Childs.", { path: pointer }));
  if (group.ID !== undefined && !apiIds.has(String(group.ID))) {
    findings.push(error("NAVIGATION_GROUP_ID_NOT_API_ISSUED", "Navigation group ID is not present in the API ID provenance manifest.", { path: `${pointer}.ID`, id: String(group.ID) }));
  }
  if (group.AppID !== undefined && String(group.AppID) !== String(appId)) {
    findings.push(error("NAVIGATION_GROUP_APPID_MISMATCH", "Navigation group AppID must equal the package/root AppID.", { path: `${pointer}.AppID`, expected: String(appId), actual: String(group.AppID) }));
  }
  if (group.ListSetID !== undefined && String(group.ListSetID) !== String(rootListSetId)) {
    findings.push(error("NAVIGATION_GROUP_LISTSETID_MISMATCH", "Navigation group ListSetID must equal the current root ListSet.ListID.", { path: `${pointer}.ListSetID`, expected: String(rootListSetId), actual: String(group.ListSetID) }));
  }
  asArray(group.list).forEach((child, index) => validateChild(child, `${pointer}.list[${index}]`, { appId, rootListSetId, targets, findings }));
}

function validateChild(child, pointer, context) {
  const { appId, rootListSetId, targets, findings } = context;
  if (!isObject(child)) {
    findings.push(error("NAVIGATION_CHILD_INVALID", "Navigation child item must be an object.", { path: pointer }));
    return;
  }
  requireField(child, "AppID", pointer, findings, "NAVIGATION_CHILD_APPID_MISSING");
  requireField(child, "Title", pointer, findings, "NAVIGATION_CHILD_TITLE_MISSING");
  requireField(child, "ListID", pointer, findings, "NAVIGATION_CHILD_LISTID_MISSING");
  requireField(child, "ListSetID", pointer, findings, "NAVIGATION_CHILD_LISTSETID_MISSING");
  requireField(child, "Type", pointer, findings, "NAVIGATION_CHILD_TYPE_MISSING");
  if (child.AppID !== undefined && String(child.AppID) !== String(appId)) {
    findings.push(error("NAVIGATION_CHILD_APPID_MISMATCH", "Navigation child AppID must equal the package/root AppID.", { path: `${pointer}.AppID`, expected: String(appId), actual: String(child.AppID) }));
  }
  if (child.ListSetID !== undefined && String(child.ListSetID) !== String(rootListSetId)) {
    findings.push(error("NAVIGATION_CHILD_LISTSETID_MISMATCH", "Navigation child ListSetID must equal the current root ListSet.ListID.", { path: `${pointer}.ListSetID`, expected: String(rootListSetId), actual: String(child.ListSetID) }));
  }
  const listId = child.ListID === undefined ? "" : String(child.ListID);
  if (String(child.Type) === "103") {
    if (!child.LayoutID) findings.push(error("NAVIGATION_DASHBOARD_LAYOUTID_MISSING", "Dashboard/page navigation item must include LayoutID.", { path: pointer }));
    if (child.LayoutID && String(child.LayoutID) !== listId) findings.push(error("NAVIGATION_DASHBOARD_LISTID_LAYOUTID_MISMATCH", "Dashboard/page ListID must equal LayoutID.", { path: pointer, listId, layoutId: String(child.LayoutID) }));
    if (!targets.pages.has(listId)) findings.push(error("NAVIGATION_DASHBOARD_TARGET_UNRESOLVED", "Dashboard/page navigation target does not resolve to Pages[].LayoutID.", { path: pointer, listId }));
  } else if (String(child.Type) === "105") {
    if (!targets.forms.has(listId)) findings.push(error("NAVIGATION_APPROVAL_FORM_TARGET_INVALID", "Approval form navigation must use Type 105 and ListID equal to Forms[].Key.", { path: pointer, listId }));
  } else if (String(child.Type) === "1") {
    if (!targets.dataLists.has(listId)) findings.push(error("NAVIGATION_DATA_LIST_TARGET_INVALID", "Data-list navigation must use Type 1 and ListID equal to an included Type 1 Childs[].List.ListID.", { path: pointer, listId }));
  } else if (String(child.Type) === "16") {
    if (!targets.documentLibraries.has(listId)) findings.push(error("NAVIGATION_DOCUMENT_LIBRARY_TARGET_INVALID", "Document Library navigation must use Type 16 and ListID equal to an included Type 16 Childs[].List.ListID.", { path: pointer, listId }));
  } else {
    findings.push(error("NAVIGATION_CHILD_TYPE_UNSUPPORTED", "Navigation child Type must resolve as dashboard/page 103, approval form 105, data-list 1, or Document Library 16.", { path: `${pointer}.Type`, type: child.Type }));
  }
}

function buildTargetIndex(decoded) {
  const childResources = asArray(decoded?.Childs);
  return {
    pages: new Set(asArray(decoded?.Pages).map((page) => String(page.LayoutID)).filter(Boolean)),
    forms: new Set(asArray(decoded?.Forms).map((form) => String(form.Key)).filter(Boolean)),
    dataLists: new Set(childResources.filter((child) => Number(child?.List?.Type) === 1).map((child) => String(child?.List?.ListID)).filter(Boolean)),
    documentLibraries: new Set(childResources.filter((child) => Number(child?.List?.Type) === 16).map((child) => String(child?.List?.ListID)).filter(Boolean)),
  };
}

function allocatedIdSet(manifest) {
  const ids = new Set();
  for (const item of asArray(manifest.allocations || manifest.allocatedIds || manifest.allocated_ids)) {
    if (isObject(item)) ids.add(String(item.id ?? item.ID ?? item.value ?? ""));
    else ids.add(String(item));
  }
  const mapping = manifest.pathToPurpose || manifest.path_to_purpose;
  if (isObject(mapping)) {
    for (const value of Object.values(mapping)) {
      if (isObject(value)) ids.add(String(value.id ?? value.ID ?? ""));
      else ids.add(String(value));
    }
  }
  return ids;
}

function requireField(object, field, pointer, findings, code) {
  if (!(field in object) || object[field] === undefined || object[field] === null || object[field] === "") {
    findings.push(error(code, `Missing required navigation field: ${field}.`, { path: `${pointer}.${field}` }));
  }
}

function fail(code, message, details = {}) {
  return { status: "fail", findings: [error(code, message, details)] };
}

function error(code, message, details = {}) {
  return { level: "error", code, message, ...details };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") args.help = true;
    else if (token === "--package") args.package = argv[++i];
    else if (token === "--id-provenance") args.idProvenance = argv[++i];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function printUsage() {
  console.log("Usage: node scripts/validate-yapk-navigation-runtime-metadata.mjs --package <app.yapk> --id-provenance <app-id-provenance-report.json>");
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}

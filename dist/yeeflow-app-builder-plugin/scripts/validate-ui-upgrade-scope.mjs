#!/usr/bin/env node

import fs from "node:fs";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { asArray, isObject, normalizePackage, readJsonFile, readPackageLike, safePath, scalar, statusFromFindings } from "./lib/yeeflow-ui-hard-gate-utils.mjs";

const NUMERIC_ID_RE = /^\d{6,}$/;
const ID_KEY_RE = /(^id$|id$|ID$|ListID|ListSetID|LayoutID|FieldID|FormID|ResourceID|AppID)/;

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.previousPackage || !args.newPackage || !args.scope) usage(args.help ? 0 : 1);
  const report = validateUiUpgradeScope(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateUiUpgradeScope({ previousPackage, newPackage, scope } = {}) {
  const findings = [];
  let previousDecoded;
  let newDecoded;
  let scopeManifest;
  try {
    previousDecoded = readPackageLike(previousPackage).decoded;
  } catch (error) {
    return failure(previousPackage, newPackage, scope, "UI_SCOPE_PREVIOUS_PACKAGE_READ_FAILED", `Could not read previous package: ${error.message}`);
  }
  try {
    newDecoded = readPackageLike(newPackage).decoded;
  } catch (error) {
    return failure(previousPackage, newPackage, scope, "UI_SCOPE_NEW_PACKAGE_READ_FAILED", `Could not read new package: ${error.message}`);
  }
  try {
    scopeManifest = readJsonFile(scope);
  } catch (error) {
    return failure(previousPackage, newPackage, scope, "UI_SCOPE_MANIFEST_READ_FAILED", `Could not read scope manifest: ${error.message}`);
  }

  const previous = normalizeForScope(previousDecoded);
  const next = normalizeForScope(newDecoded);
  const rules = normalizeScope(scopeManifest);

  validateIdentity(previous, next, rules, findings);
  validateMapChanges("page/resource", previous.pages, next.pages, rules.allowedPageKeys, "UI_SCOPE_UNRELATED_PAGE_RESOURCE_CHANGE", findings);
  validateMapChanges("data list", previous.lists, next.lists, rules.allowedLists, "UI_SCOPE_DATA_LIST_CHANGE_OUTSIDE_SCOPE", findings);
  validateFieldChanges(previous.fields, next.fields, rules.allowedLists, findings);
  validateMapChanges("approval form", previous.forms, next.forms, rules.allowedForms, "UI_SCOPE_APPROVAL_FORM_CHANGE_OUTSIDE_SCOPE", findings);
  validateMapChanges("workflow", previous.workflows, next.workflows, rules.allowedResources, "UI_SCOPE_WORKFLOW_CHANGE_OUTSIDE_SCOPE", findings);
  validateNavigation(previous.navigationHash, next.navigationHash, rules, findings);
  validateNumericIds(previous.numericIds, next.numericIds, rules, findings);
  validateForbiddenChanges(rules, findings);

  return {
    status: statusFromFindings(findings),
    previousPackage: safePath(previousPackage),
    newPackage: safePath(newPackage),
    scope: safePath(scope),
    summary: {
      changeScope: rules.changeScope,
      allowedPages: rules.allowedPages,
      allowedPageLayoutIds: rules.allowedPageLayoutIds,
      allowedResources: rules.allowedResources,
      allowedLists: rules.allowedLists,
      allowedForms: rules.allowedForms,
      allowedNavigationChanges: rules.allowedNavigationChanges,
      previousListSetID: previous.identity.listSetId || null,
      newListSetID: next.identity.listSetId || null,
      newNumericIdCount: [...next.numericIds].filter((id) => !previous.numericIds.has(id)).length,
    },
    proofBoundary: "This validates declared UI upgrade scope only. It does not prove schema validity, signing, install, import, upgrade acceptance, runtime UI quality, dynamic KPI binding, or live Yeeflow API behavior.",
    findings,
  };
}

function validateIdentity(previous, next, rules, findings) {
  const expected = rules.expectedListSetID || previous.identity.listSetId;
  if (expected && next.identity.listSetId && next.identity.listSetId !== expected) {
    finding(findings, "error", "UI_SCOPE_LISTSETID_DRIFT", "ListSetID drifted during a UI-only upgrade.", {
      expectedListSetID: redactId(expected),
      newListSetID: redactId(next.identity.listSetId),
    });
  }
  for (const key of ["appId", "listSetId", "title"]) {
    if (previous.identity[key] && next.identity[key] && previous.identity[key] !== next.identity[key]) {
      finding(findings, "error", "UI_SCOPE_APP_IDENTITY_DRIFT", "App identity drifted during a declared UI upgrade.", { field: key });
    }
  }
}

function validateMapChanges(label, previousMap, nextMap, allowedKeys, code, findings) {
  for (const key of new Set([...previousMap.keys(), ...nextMap.keys()])) {
    const before = previousMap.get(key);
    const after = nextMap.get(key);
    if (before === after) continue;
    if (allowedKeys.has(key)) continue;
    finding(findings, "error", code, `${label} changed outside declared scope.`, { key });
  }
}

function validateFieldChanges(previousFields, nextFields, allowedLists, findings) {
  for (const [listId, previousMap] of previousFields.entries()) {
    const nextMap = nextFields.get(listId) || new Map();
    for (const key of new Set([...previousMap.keys(), ...nextMap.keys()])) {
      if (previousMap.get(key) === nextMap.get(key)) continue;
      if (allowedLists.has(listId)) continue;
      finding(findings, "error", "UI_SCOPE_DATA_FIELD_CHANGE_OUTSIDE_SCOPE", "Data list field changed outside declared scope.", { list: listId, field: key });
    }
  }
  for (const listId of nextFields.keys()) {
    if (!previousFields.has(listId) && !allowedLists.has(listId)) {
      finding(findings, "error", "UI_SCOPE_DATA_LIST_CHANGE_OUTSIDE_SCOPE", "New data list fields appeared outside declared scope.", { list: listId });
    }
  }
}

function validateNavigation(previousHash, nextHash, rules, findings) {
  if (previousHash !== nextHash && !rules.allowedNavigationChanges) {
    finding(findings, "error", "UI_SCOPE_NAVIGATION_DRIFT_OUTSIDE_SCOPE", "Navigation changed outside declared scope.");
  }
}

function validateNumericIds(previousIds, nextIds, rules, findings) {
  const newIds = [...nextIds].filter((id) => !previousIds.has(id));
  for (const id of newIds) {
    if (rules.allowedGeneratedIds.has(id) || rules.allowNewGeneratedIds === true) continue;
    finding(findings, "error", "UI_SCOPE_NEW_GENERATED_ID_WITHOUT_ALLOWANCE", "New generated numeric ID appears without explicit scope allowance.", { id: redactId(id) });
  }
  for (const id of previousIds) {
    if (!nextIds.has(id)) {
      finding(findings, "error", "UI_SCOPE_NUMERIC_ID_LINEAGE_CHANGE_OUTSIDE_SCOPE", "Existing numeric ID lineage changed outside declared scope.", { id: redactId(id) });
    }
  }
}

function validateForbiddenChanges(rules, findings) {
  for (const item of rules.forbiddenChanges) {
    const value = String(item).toLowerCase();
    if (["all", "ui-upgrade", rules.changeScope].includes(value)) {
      finding(findings, "error", "UI_SCOPE_FORBIDDEN_CHANGE_DECLARED", "Scope manifest declares a forbidden change for this upgrade.", { forbiddenChange: item });
    }
  }
}

function normalizeForScope(decoded) {
  const pkg = normalizePackage(decoded);
  const root = pkg.root || {};
  const pages = new Map();
  const lists = new Map();
  const fields = new Map();
  const forms = new Map();
  const workflows = new Map();

  for (const page of pkg.pages) {
    const title = scalar(page.Title || page.Name || page.title);
    const layoutId = scalar(page.LayoutID || page.ID || page.id);
    const key = layoutId || title;
    if (key) pages.set(key, stableHash(page));
    if (title) pages.set(title, stableHash(page));
  }
  for (const child of pkg.children) {
    const listId = scalar(child.list.ListID || child.list.ID || child.list.Name || child.list.Title);
    if (!listId) continue;
    lists.set(listId, stableHash(child.list));
    const map = new Map();
    for (const field of child.fields) {
      const fieldKey = scalar(field.FieldID || field.FieldName || field.InternalName || field.DisplayName || field.Name);
      if (fieldKey) map.set(fieldKey, stableHash(field));
    }
    fields.set(listId, map);
    for (const layout of child.layouts) {
      const formKey = scalar(layout.LayoutID || layout.ID || layout.Title || layout.Name);
      if (formKey) forms.set(formKey, stableHash(layout));
    }
  }

  collectNamedObjects(decoded, /form|approval/i, forms);
  collectNamedObjects(decoded, /workflow|process/i, workflows);

  return {
    identity: {
      listSetId: scalar(root.ListSetID || root.ListID || root.ID),
      appId: scalar(root.AppID || root.AppId || decoded?.AppID || decoded?.appId),
      title: scalar(root.Title || root.Name || decoded?.Title || decoded?.Name),
    },
    pages,
    lists,
    fields,
    forms,
    workflows,
    navigationHash: stableHash(extractNavigation(decoded)),
    numericIds: collectNumericIds(decoded),
  };
}

function collectNamedObjects(value, keyPattern, map, pointer = "$") {
  if (!isObject(value) && !Array.isArray(value)) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectNamedObjects(item, keyPattern, map, `${pointer}[${index}]`));
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    if (keyPattern.test(key)) {
      const itemKey = isObject(item)
        ? scalar(item.ID || item.FormID || item.WorkflowID || item.ProcessID || item.LayoutID || item.Title || item.Name || key)
        : key;
      map.set(itemKey || pointer, stableHash(item));
    }
    collectNamedObjects(item, keyPattern, map, `${pointer}.${key}`);
  }
}

function extractNavigation(decoded) {
  const nav = {};
  for (const key of ["Navigation", "Navigations", "Navs", "Menus", "MenuItems", "AppNavigation", "PortalNavigation"]) {
    if (decoded && decoded[key] !== undefined) nav[key] = decoded[key];
    if (decoded?.ListSet && decoded.ListSet[key] !== undefined) nav[`ListSet.${key}`] = decoded.ListSet[key];
  }
  return nav;
}

function collectNumericIds(value, ids = new Set(), key = "") {
  if (Array.isArray(value)) {
    value.forEach((item) => collectNumericIds(item, ids, key));
    return ids;
  }
  if (!isObject(value)) {
    if (ID_KEY_RE.test(key) && NUMERIC_ID_RE.test(String(value))) ids.add(String(value));
    return ids;
  }
  for (const [childKey, item] of Object.entries(value)) {
    if (/^Sign$/i.test(childKey)) continue;
    collectNumericIds(item, ids, childKey);
  }
  return ids;
}

function normalizeScope(scope) {
  const allowedPages = set(scope.allowedPages);
  const allowedPageLayoutIds = set(scope.allowedPageLayoutIds);
  const allowedResources = set(scope.allowedResources);
  return {
    changeScope: scalar(scope.changeScope || "declared-ui-upgrade"),
    allowedPages,
    allowedPageLayoutIds,
    allowedResources,
    allowedPageKeys: new Set([...allowedPages, ...allowedPageLayoutIds, ...allowedResources]),
    allowedLists: set(scope.allowedLists),
    allowedForms: set(scope.allowedForms),
    allowedNavigationChanges: scope.allowedNavigationChanges === true,
    forbiddenChanges: asArray(scope.forbiddenChanges).map(String),
    expectedListSetID: scalar(scope.expectedListSetID || scope.expectedListSetId),
    previousManifest: scope.previousManifest || null,
    newManifest: scope.newManifest || null,
    allowNewGeneratedIds: scope.allowNewGeneratedIds === true || scope.allowedNewGeneratedIds === true,
    allowedGeneratedIds: set(scope.allowedGeneratedIds || scope.allowedNewIds),
  };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--previous-package") args.previousPackage = argv[++i];
    else if (arg === "--new-package") args.newPackage = argv[++i];
    else if (arg === "--scope") args.scope = argv[++i];
    else usage(1);
  }
  return args;
}

function usage(exitCode) {
  const out = [
    "Usage:",
    "  node scripts/validate-ui-upgrade-scope.mjs --previous-package <previous.json|yapk> --new-package <new.json|yapk> --scope <scope-manifest.json>",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(out);
  process.exit(exitCode);
}

function failure(previousPackage, newPackage, scope, code, message) {
  return {
    status: "fail",
    previousPackage: safePath(previousPackage),
    newPackage: safePath(newPackage),
    scope: safePath(scope),
    summary: {},
    proofBoundary: "Scope validation failed before package comparison.",
    findings: [{ level: "error", code, message }],
  };
}

function finding(findings, level, code, message, detail = {}) {
  findings.push({ level, code, message, ...detail });
}

function set(value) {
  return new Set(asArray(value).map(String).filter(Boolean));
}

function stableHash(value) {
  return crypto.createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (!isObject(value)) return JSON.stringify(value);
  return `{${Object.keys(value).sort().filter((key) => !/^Sign$/i.test(key)).map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

function redactId(id) {
  const text = String(id || "");
  return text.length > 8 ? `${text.slice(0, 4)}...${text.slice(-4)}` : text;
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}

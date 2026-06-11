#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const ID_KEYS = new Set(["id", "idx", "key", "i", "AppID", "ListID", "ListSetID", "TenantID", "FieldID", "LayoutID", "RefId", "PageID", "ProcKey"]);
const KNOWN_ACTION_TYPES = new Map([
  ["1", "form_action_binding"],
  ["2", "link"],
  ["5", "add_list_item"],
  ["6", "open_dashboard"],
  ["8", "open_approval_form"],
]);
const KNOWN_OPEN_MODES = new Map([
  ["", "default"],
  ["modal", "pop_up_window"],
  ["slide", "slide_in"],
  ["target", "full_page"],
  ["new", "new_window"],
]);
const KNOWN_MODAL_SIZES = new Set(["0", "1", "2", "3", "9"]);
const CONTROL_TYPES = new Set(["container", "button", "action_button"]);

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-container-button-actions.mjs <input.yap|decoded.json> [--page \"AP Approval Dashboard\"] [--out report.json] [--out-dir normalized-dir]",
    "",
    "Decodes a Yeeflow .yap read-only and inventories Container/Button Action settings on dashboard pages.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, page: null, out: null, outDir: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--page") args.page = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
    else if (arg === "--out-dir") args.outDir = argv[++i];
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input) usage();
  return args;
}

function quoteLargeIntegers(jsonText) {
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
      while (j < jsonText.length && jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (j < jsonText.length && /[0-9eE+\-.]/.test(jsonText[j])) j += 1;
        out += jsonText.slice(start, j);
      } else {
        const token = jsonText.slice(start, j);
        out += LARGE_INTEGER_RE.test(token) ? `"${token}"` : token;
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJson(text) {
  return JSON.parse(quoteLargeIntegers(text));
}

function decodeInput(inputPath) {
  const parsed = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  if (typeof parsed.Resource === "string" && parsed.Resource.startsWith(GZIP_PREFIX)) {
    const resource = parseJson(zlib.gunzipSync(Buffer.from(parsed.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"));
    return { wrapper: parsed, resource, data: parseJson(resource.Data), inputType: "wrapped-yap" };
  }
  if (typeof parsed.Data === "string") return { wrapper: null, resource: parsed, data: parseJson(parsed.Data), inputType: "resource-json" };
  return { wrapper: null, resource: null, data: parsed, inputType: "decoded-json" };
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value) {
  return value === null || value === undefined ? "" : String(value);
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

function walk(node, visit, pointer = "$") {
  if (!isObject(node) && !Array.isArray(node)) return;
  visit(node, pointer);
  if (Array.isArray(node)) {
    node.forEach((item, index) => walk(item, visit, `${pointer}[${index}]`));
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (isObject(value) || Array.isArray(value)) walk(value, visit, `${pointer}.${key}`);
  }
}

function collectPackageIndexes(data) {
  const rootListSetId = safeString(data?.Item?.ListModel?.ListID || data?.Item?.ListModel?.ListSetID);
  const listsById = new Map();
  const fieldsByList = new Map();
  const layoutsById = new Map();
  const dashboardsById = new Map();
  const approvalFormsByKey = new Map();

  for (const resource of [data?.Item, ...asArray(data?.Childs)]) {
    const listId = safeString(resource?.ListModel?.ListID);
    if (!listId) continue;
    listsById.set(listId, resource);
    fieldsByList.set(listId, new Set(asArray(resource.Defs).map((field) => safeString(field.FieldName)).filter(Boolean)));
    for (const layout of asArray(resource.Layouts)) {
      const layoutId = safeString(layout.LayoutID);
      if (layoutId) layoutsById.set(layoutId, { layout, listId, resource });
      if (Number(layout.Type) === 103 && layoutId) dashboardsById.set(layoutId, layout);
    }
  }
  for (const form of asArray(data?.Forms)) {
    const key = safeString(form.Key || form.DefKey || form.ProcKey);
    if (key) approvalFormsByKey.set(key, form);
  }
  return { rootListSetId, listsById, fieldsByList, layoutsById, dashboardsById, approvalFormsByKey };
}

function dashboardPages(data) {
  const pages = [];
  for (const layout of asArray(data?.Item?.Layouts)) {
    if (Number(layout.Type) !== 103) continue;
    const resource = asArray(layout.LayoutInResources)[0];
    const page = parseMaybeJson(resource?.Resource);
    if (page) pages.push({ layout, resource, page });
  }
  return pages;
}

function actionName(actionType) {
  return KNOWN_ACTION_TYPES.get(safeString(actionType)) || "unknown";
}

function openModeName(op) {
  return KNOWN_OPEN_MODES.get(safeString(op)) || "unknown";
}

function targetSummary(attrs, actionType) {
  const data = isObject(attrs.data) ? attrs.data : {};
  if (actionType === "2") return { targetType: "link", target: attrs.link || null };
  if (actionType === "5") return { targetType: "data_list_or_document_library", target: data.list || null };
  if (actionType === "6") return { targetType: "dashboard", target: data.page || null };
  if (actionType === "8") return { targetType: "approval_form", target: data.form || null };
  if (actionType === "1") return { targetType: "form_action", target: attrs.control_action || attrs.action || attrs["control_action"] || null };
  return { targetType: "unknown", target: null };
}

function addFinding(findings, severity, code, message, details = {}) {
  findings.push({ severity, level: severity, code, message, details: redact(details) });
}

function validateAction(record, indexes, findings) {
  const { attrs, pointer, actionType } = record.raw;
  const action = record.actionType;
  if (!KNOWN_ACTION_TYPES.has(actionType)) {
    addFinding(findings, "warning", "CONTAINER_BUTTON_ACTION_TYPE_UNKNOWN", "Container/Button action-type is not export-proven.", { pointer, controlType: record.controlType, actionType });
  }
  const op = safeString(attrs.op);
  if (!KNOWN_OPEN_MODES.has(op)) {
    addFinding(findings, "warning", "CONTAINER_BUTTON_ACTION_OPEN_MODE_UNKNOWN", "Container/Button action open mode is not export-proven.", { pointer, op, actionType });
  }
  if (attrs.modalsize !== undefined && !KNOWN_MODAL_SIZES.has(safeString(attrs.modalsize))) {
    addFinding(findings, "warning", "CONTAINER_BUTTON_ACTION_SIZE_UNKNOWN", "Container/Button action modal size is not export-proven.", { pointer, modalsize: attrs.modalsize, actionType });
  }

  if (action === "link") {
    const link = attrs.link;
    const hasUrl = typeof link?.url === "string" && link.url.trim();
    const hasVariable = Array.isArray(link?.variable) && link.variable.length > 0;
    if (!isObject(link) || (!hasUrl && !hasVariable)) {
      addFinding(findings, "warning", "CONTAINER_BUTTON_LINK_TARGET_MISSING", "Link actions should include a literal URL or expression variable URL.", { pointer });
    }
    return;
  }

  if (action === "add_list_item") {
    const listId = safeString(attrs.data?.list?.ListID);
    if (!listId) addFinding(findings, "warning", "CONTAINER_BUTTON_ADD_LIST_TARGET_MISSING", "Add list item actions should include attrs.data.list.ListID.", { pointer });
    else if (!indexes.listsById.has(listId)) addFinding(findings, "warning", "CONTAINER_BUTTON_ADD_LIST_TARGET_UNRESOLVED", "Add list item target ListID should resolve to a local list/document library when generated for this app.", { pointer, listId });
    const layoutId = safeString(attrs.layout);
    if (layoutId && !indexes.layoutsById.has(layoutId)) addFinding(findings, "warning", "CONTAINER_BUTTON_ADD_LIST_LAYOUT_UNRESOLVED", "Add list item layout should resolve to a target list form layout when present.", { pointer, layoutId });
    for (const [index, pass] of asArray(attrs.passvalues).entries()) {
      const fieldName = safeString(pass.Name);
      if (fieldName && listId && indexes.fieldsByList.has(listId) && !indexes.fieldsByList.get(listId).has(fieldName)) {
        addFinding(findings, "warning", "CONTAINER_BUTTON_PASSVALUE_FIELD_UNRESOLVED", "Add list item passvalues must reference fields on the target list.", { pointer: `${pointer}.attrs.passvalues[${index}]`, listId, fieldName });
      }
    }
    return;
  }

  if (action === "open_dashboard") {
    const pageId = safeString(attrs.data?.page?.PageID);
    if (!pageId) addFinding(findings, "warning", "CONTAINER_BUTTON_OPEN_DASHBOARD_TARGET_MISSING", "Open dashboard actions should include attrs.data.page.PageID.", { pointer });
    else if (!indexes.dashboardsById.has(pageId)) addFinding(findings, "warning", "CONTAINER_BUTTON_OPEN_DASHBOARD_TARGET_UNRESOLVED", "Open dashboard target PageID should resolve to a local dashboard when generated for this app.", { pointer, pageId });
    return;
  }

  if (action === "open_approval_form") {
    const procKey = safeString(attrs.data?.form?.ProcKey);
    if (!procKey) addFinding(findings, "warning", "CONTAINER_BUTTON_OPEN_APPROVAL_FORM_TARGET_MISSING", "Open approval form actions should include attrs.data.form.ProcKey.", { pointer });
    else if (!indexes.approvalFormsByKey.has(procKey)) addFinding(findings, "warning", "CONTAINER_BUTTON_OPEN_APPROVAL_FORM_TARGET_UNRESOLVED", "Open approval form target ProcKey should resolve to a local approval form when generated for this app.", { pointer, procKey });
    return;
  }

  if (action === "form_action_binding") {
    const target = attrs.control_action || attrs.action || attrs["control_action"];
    if (!target) addFinding(findings, "warning", "CONTAINER_BUTTON_FORM_ACTION_TARGET_MISSING", "Form action binding actions should include an action/control_action reference.", { pointer });
  }
}

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!isObject(value)) {
    if (typeof value === "string" && /^https?:\/\//i.test(value)) return "[REDACTED_URL]";
    if (typeof value === "string" && /^[A-Za-z0-9+/=]{80,}$/.test(value)) return "[REDACTED_LONG_VALUE]";
    return value;
  }
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    if (ID_KEYS.has(key)) out[key] = item === null || item === undefined || item === "" ? item : `[${key}]`;
    else if (/url|link/i.test(key) && typeof item === "string" && item) out[key] = "[REDACTED_URL]";
    else out[key] = redact(item);
  }
  return out;
}

function normalizedAction(record) {
  const attrs = record.raw.attrs;
  const sample = {
    proof: "export-proven",
    host: "dashboard",
    controlType: record.controlType === "action_button" ? "button" : record.controlType,
    actionTypeCode: record.raw.actionType,
    actionType: record.actionType,
    attrs: {
      "action-type": record.raw.actionType,
      op: attrs.op || undefined,
      modalsize: attrs.modalsize,
      cusize: attrs.cusize,
      link: attrs.link ? {
        opentype: attrs.link.opentype,
        url: attrs.link.url ? "[REDACTED_URL]" : attrs.link.url,
        variable: Array.isArray(attrs.link.variable) ? "[REDACTED_EXPRESSION_ARRAY]" : undefined,
      } : undefined,
      data: attrs.data ? redact(attrs.data) : undefined,
      layout: attrs.layout ? "[LayoutID]" : undefined,
      passvalues: Array.isArray(attrs.passvalues) ? attrs.passvalues.map((item) => ({ Name: item.Name, Value: "[REDACTED_EXPRESSION_ARRAY]" })) : undefined,
      queryParams: Array.isArray(attrs.queryParams) ? attrs.queryParams.map((item) => ({ name: item.name, value: "[REDACTED_EXPRESSION]" })) : undefined,
      setVars: attrs.setVars ? "[REDACTED_SET_VARS]" : undefined,
    },
  };
  return JSON.parse(JSON.stringify(sample));
}

function writeNormalized(outDir, controls) {
  fs.mkdirSync(outDir, { recursive: true });
  const wanted = [
    ["container-action-link.normalized.json", (item) => item.controlType === "container" && item.actionType === "link"],
    ["button-action-link.normalized.json", (item) => item.controlType === "action_button" && item.actionType === "link"],
    ["container-action-add-list-item.normalized.json", (item) => item.controlType === "container" && item.actionType === "add_list_item"],
    ["button-action-add-list-item.normalized.json", (item) => item.controlType === "action_button" && item.actionType === "add_list_item"],
    ["container-action-open-dashboard.normalized.json", (item) => item.controlType === "container" && item.actionType === "open_dashboard"],
    ["button-action-open-dashboard.normalized.json", (item) => item.controlType === "action_button" && item.actionType === "open_dashboard"],
    ["container-action-open-approval-form.normalized.json", (item) => item.controlType === "container" && item.actionType === "open_approval_form"],
    ["button-action-open-approval-form.normalized.json", (item) => item.controlType === "action_button" && item.actionType === "open_approval_form"],
    ["action-open-mode-popup.normalized.json", (item) => item.raw.attrs.op === "modal"],
    ["action-open-mode-slide-in.normalized.json", (item) => item.raw.attrs.op === "slide"],
    ["action-open-mode-full-page.normalized.json", (item) => item.raw.attrs.op === "target"],
    ["action-open-mode-new-window.normalized.json", (item) => item.raw.attrs.op === "new"],
    ["action-current-app-target.normalized.json", (item) => item.targetResolves === true],
  ];
  const written = [];
  for (const [filename, predicate] of wanted) {
    const match = controls.find(predicate);
    if (!match) continue;
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, `${JSON.stringify(normalizedAction(match), null, 2)}\n`);
    written.push(filePath);
  }
  return written;
}

function main() {
  const args = parseArgs(process.argv);
  const { data, inputType } = decodeInput(path.resolve(args.input));
  const indexes = collectPackageIndexes(data);
  const pages = dashboardPages(data).filter(({ layout, page }) => !args.page || safeString(layout.Title || page.title) === args.page);
  const findings = [];
  const controls = [];

  if (!pages.length) {
    addFinding(findings, "error", "DASHBOARD_NOT_FOUND", "Target dashboard page was not found.", { page: args.page });
  }

  for (const { layout, page } of pages) {
    walk(page.children || [], (node, pointer) => {
      if (!isObject(node) || !CONTROL_TYPES.has(safeString(node.type))) return;
      const attrs = isObject(node.attrs) ? node.attrs : {};
      if (!Object.prototype.hasOwnProperty.call(attrs, "action-type")) return;
      const actionType = safeString(attrs["action-type"]);
      const target = targetSummary(attrs, actionType);
      const record = {
        pageName: safeString(layout.Title || page.title),
        pageId: "[PageID]",
        controlId: "[ControlID]",
        controlType: safeString(node.type),
        actionTypeCode: actionType,
        actionType: actionName(actionType),
        targetType: target.targetType,
        target: redact(target.target),
        openMode: openModeName(attrs.op),
        openModeCode: safeString(attrs.op),
        size: attrs.modalsize === undefined ? null : safeString(attrs.modalsize),
        customSize: attrs.cusize ? redact(attrs.cusize) : null,
        layout: attrs.layout ? "[LayoutID]" : null,
        passvalueFields: asArray(attrs.passvalues).map((item) => safeString(item.Name)).filter(Boolean),
        queryParams: asArray(attrs.queryParams).map((item) => safeString(item.name)).filter(Boolean),
        setVars: Boolean(attrs.setVars),
        proof: "export-proven",
        raw: { attrs, pointer, actionType },
      };
      const listId = safeString(attrs.data?.list?.ListID);
      const pageId = safeString(attrs.data?.page?.PageID);
      const procKey = safeString(attrs.data?.form?.ProcKey);
      record.targetResolves = record.actionType === "link"
        || (record.actionType === "add_list_item" && indexes.listsById.has(listId))
        || (record.actionType === "open_dashboard" && indexes.dashboardsById.has(pageId))
        || (record.actionType === "open_approval_form" && indexes.approvalFormsByKey.has(procKey))
        || false;
      controls.push(record);
      validateAction(record, indexes, findings);
    });
  }

  const actionCounts = {};
  const controlCounts = {};
  const openModes = {};
  const sizes = {};
  for (const control of controls) {
    actionCounts[control.actionType] = (actionCounts[control.actionType] || 0) + 1;
    controlCounts[control.controlType] = (controlCounts[control.controlType] || 0) + 1;
    openModes[control.openMode] = (openModes[control.openMode] || 0) + 1;
    if (control.size !== null) sizes[control.size] = (sizes[control.size] || 0) + 1;
  }

  const normalizedFiles = args.outDir ? writeNormalized(path.resolve(args.outDir), controls) : [];
  const errors = findings.filter((finding) => finding.severity === "error").length;
  const warnings = findings.filter((finding) => finding.severity === "warning").length;
  const report = {
    status: errors ? "fail" : warnings ? "pass_with_warnings" : "pass",
    input: path.resolve(args.input),
    inputType,
    page: args.page || "ALL_DASHBOARDS",
    summary: {
      dashboardsMatched: pages.length,
      actionControls: controls.length,
      controlCounts,
      actionCounts,
      openModes,
      sizes,
      normalizedFiles: normalizedFiles.map((file) => path.relative(process.cwd(), file)),
    },
    controls: controls.map(({ raw, ...control }) => control),
    findings,
  };

  if (args.out) {
    fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
    fs.writeFileSync(path.resolve(args.out), `${JSON.stringify(report, null, 2)}\n`);
  }
  console.log(JSON.stringify(report, null, 2));
  if (errors) process.exit(1);
}

try {
  main();
} catch (error) {
  console.log(JSON.stringify({ status: "fail", errors: [{ code: "INSPECT_CONTAINER_BUTTON_ACTIONS_FAILED", message: error.message }] }, null, 2));
  process.exit(1);
}

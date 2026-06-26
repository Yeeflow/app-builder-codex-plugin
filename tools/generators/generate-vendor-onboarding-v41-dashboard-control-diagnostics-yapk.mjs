#!/usr/bin/env node

import fs from "node:fs";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { loadDotenvFile, resolveYeeflowEnvironment } from "./scripts/yeeflow-env-utils.mjs";

const APP_ID = 41;
const BASE_YAPK = process.env.VENDOR_ONBOARDING_V41_BASE_YAPK || "/Users/Renger/Downloads/vendor-onboarding-v41-page1-dashboard.yapk";
const OUT_YAPK = process.env.VENDOR_ONBOARDING_V41_DIAGNOSTIC_YAPK || "/Users/Renger/Downloads/vendor-onboarding-v41-dashboard-control-diagnostics.yapk";
const TMP_DIR = ".tmp/vendor-onboarding-v41-dashboard-control-diagnostics";
const GENERATED_AT_UTC = "2026-05-30T04:45:00Z";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
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
      while (jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (/[0-9eE+\-.]/.test(jsonText[j] || "")) j += 1;
        out += jsonText.slice(start, j);
      } else {
        const token = jsonText.slice(start, j);
        out += /^-?\d{16,}$/.test(token) ? `"${token}"` : token;
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJsonPreservingLargeInts(text) {
  return JSON.parse(quoteLargeIntegers(text));
}

function assertEnvReadable(filePath) {
  if (!fs.existsSync(filePath)) return;
  const flags = execFileSync("ls", ["-lO", filePath], { encoding: "utf8" });
  if (/\bdataless\b/.test(flags)) throw new Error(`${filePath} is marked dataless and cannot be read.`);
}

function loadApiEnv() {
  loadDotenvFile(fs, ".env.local", { assertReadable: assertEnvReadable });
  const env = resolveYeeflowEnvironment(process.env);
  if (!env.apiKey) throw new Error("YEEFLOW_API_KEY is required for API-issued ID generation.");
  if (!env.apiBaseUrl) throw new Error("YEEFLOW_API_BASE_URL is required for API-issued ID generation.");
  return env;
}

async function fetchApiIds(env, count) {
  const response = await fetch(`${env.apiBaseUrl.replace(/\/+$/, "")}/utils/generate/ids?count=${count}`, {
    headers: { apiKey: env.apiKey },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`generate ids failed with HTTP ${response.status}.`);
  const parsed = parseJsonPreservingLargeInts(text);
  const ids = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.Data) ? parsed.Data : Array.isArray(parsed?.data) ? parsed.data : [];
  if (ids.length !== count) throw new Error(`generate ids returned ${ids.length} IDs for requested count ${count}.`);
  const out = ids.map((id) => String(id));
  if (new Set(out).size !== out.length) throw new Error("generate ids returned duplicate IDs.");
  return out;
}

function createIdAllocator(ids) {
  const queue = [...ids];
  const used = [];
  return {
    next(label) {
      const id = queue.shift();
      if (!id) throw new Error(`No API-issued ID remains for ${label}.`);
      used.push({ label, id });
      return id;
    },
    used,
  };
}

function postJsonWithCurl(url, apiKey, body) {
  const stdout = execFileSync("curl", [
    "--silent",
    "--show-error",
    "--max-time",
    "20",
    "--request",
    "POST",
    "--header",
    `apiKey: ${apiKey}`,
    "--header",
    "Accept: application/json",
    "--header",
    "Content-Type: application/json",
    "--data-binary",
    "@-",
    "--write-out",
    "\n%{http_code}",
    url,
  ], { input: JSON.stringify(body), maxBuffer: 2 * 1024 * 1024 }).toString("utf8");
  const splitAt = stdout.lastIndexOf("\n");
  return { body: splitAt >= 0 ? stdout.slice(0, splitAt) : "", status: Number(splitAt >= 0 ? stdout.slice(splitAt + 1) : "0") };
}

async function signWrapper(env, wrapper) {
  const signingWrapper = env.tenantId ? { ...wrapper, TenantID: env.tenantId } : wrapper;
  const unsigned = { ...signingWrapper };
  delete unsigned.Sign;
  const signResult = postJsonWithCurl(`${env.apiBaseUrl}/utils/apppackage/setsign`, env.apiKey, unsigned);
  if (signResult.status < 200 || signResult.status > 299) throw new Error(`setsign failed with HTTP ${signResult.status}`);
  const signJson = JSON.parse(signResult.body || "{}");
  const sign = signJson?.Data ?? signJson?.data ?? signJson?.Sign ?? signJson?.sign ?? (typeof signJson === "string" ? signJson : null);
  if (typeof sign !== "string" || Buffer.from(sign, "base64").length !== 32) throw new Error("setsign response did not contain a 32-byte base64 signature.");
  const signed = { ...signingWrapper, Sign: sign };
  const verifyResult = postJsonWithCurl(`${env.apiBaseUrl}/utils/apppackage/verifysign`, env.apiKey, signed);
  if (verifyResult.status < 200 || verifyResult.status > 299) throw new Error(`verifysign failed with HTTP ${verifyResult.status}`);
  return { wrapper: signed, signByteLength: Buffer.from(sign, "base64").length, verifyStatus: verifyResult.status };
}

function readYapk(path) {
  const wrapper = JSON.parse(fs.readFileSync(path, "utf8"));
  const decoded = JSON.parse(zlib.brotliDecompressSync(Buffer.from(wrapper.Resource, "base64")).toString("utf8"));
  return { wrapper, decoded };
}

function listByTitle(decoded, title) {
  const child = decoded.Childs.find((item) => item.List?.Title === title);
  if (!child) throw new Error(`Missing required list: ${title}`);
  return child.List;
}

function listRef(rootId, listId, title, type = 1) {
  return { AppID: APP_ID, ListID: listId, ListSetID: rootId, Type: type, Title: title };
}

function control(type, label, attrs = {}, children = [], extra = {}) {
  return { id: extra.id || `${type}-${crypto.randomUUID()}`, type, label, attrs, children, nv_label: extra.nv_label || label };
}

function heading(value, role = "body") {
  const ty = role === "page" ? "h3-bold" : role === "value" ? "h2-bold" : role === "section" ? "h4-bold" : "s-regular";
  return control("heading", "Text", {
    headc: { title: { value, variable: null } },
    heads: { ty: [null, ty], color: role === "value" || role === "page" ? "var(--c--text)" : "var(--c--neutral-dark-hover)" },
    role,
  }, [], { nv_label: value });
}

function container(label, children = [], attrs = {}) {
  return control("container", label, {
    style: attrs.style || { direction: "column", gap: 16, align_items: "stretch" },
    common: {
      padding: attrs.padding || { left: 24, right: 24, top: 20, bottom: 20 },
      background: { normal: { type: "classic", classic: { color: attrs.background || "#FFFFFF" } } },
      border: attrs.border === false ? undefined : {
        normal: {
          type: "1",
          width: { left: 1, right: 1, top: 1, bottom: 1 },
          color: attrs.borderColor || "#DDE5F2",
          radius: { left: 10, right: 10, top: 10, bottom: 10 },
        },
      },
    },
    grid: attrs.grid,
  }, children, { nv_label: label });
}

function button(rootId, vendorsId) {
  return control("button", "New Vendor Request", {
    text: "New Vendor Request",
    button_type: "primary",
    control_action: { type: "navigate", target: listRef(rootId, vendorsId, "Vendors") },
  });
}

function dynamicField(fieldName, label) {
  return control("dynamic-field", label, {
    source: "3",
    "obj-f": fieldName,
    fieldLabel: label,
    item_style: { ty: [null, "s-medium"], color: "#071638" },
  });
}

function dynamicUser(fieldName, label) {
  return control("dynamic-user", label, {
    source: "3",
    "obj-f": fieldName,
    fieldLabel: label,
    display_name: true,
  });
}

function progressCircle() {
  return control("progress-circle", "Overall onboarding completion", {
    value: 72,
    label: "Overall onboarding completion",
    color: "#0F6BFF",
    trackColor: "#E6EEF8",
    size: 132,
  });
}

function progressBar() {
  return control("progress", "Average vendor completion", {
    label: "Average vendor completion",
    source: "3",
    "obj-f": "Decimal11",
    value: { type: "expr", exprType: "list_field", prop: "Decimal11" },
    color: "#0F6BFF",
  });
}

function alertControl() {
  return control("alert", "High-risk vendor document alert", {
    title: "High-risk vendors need document review",
    description: "Critical or high-risk vendors with expiring insurance, missing tax forms, or blocked compliance reviews should be reviewed today.",
    type: "danger",
  });
}

function dataList(rootId, vendorsId) {
  return control("data-list", "Vendors Data table", {
    data: { list: listRef(rootId, vendorsId, "Vendors") },
    listarr: [
      ["Text0", "Vendor Name"],
      ["Text2", "Vendor Type"],
      ["Text3", "Country / Region"],
      ["Text9", "Risk Level"],
      ["Text8", "Onboarding Status"],
      ["Text10", "Compliance Status"],
      ["DateTime14", "Renewal Date"],
    ].map(([Field, FieldName], index) => ({ Field, FieldName, DisplayName: FieldName, Order: index + 1, Show: true })),
  });
}

function kanban(rootId, vendorsId) {
  return control("kanban", "Onboarding status board", {
    data: { list: listRef(rootId, vendorsId, "Vendors"), cateField: "Text8" },
    cardStyle: { background: "#FFFFFF", borderRadius: 10, borderColor: "#DDE5F2", padding: 14 },
    laneStyle: { width: 300, background: "#F8FAFC" },
    actions: [{
      id: `action-${crypto.randomUUID()}`,
      name: "View Vendor",
      type: "coll",
      steps: [{ type: "listitem", attrs: { opentype: "target", listid: vendorsId } }],
    }],
  }, [
    container("Kanban item template", [
      dynamicField("Text0", "Vendor Name"),
      dynamicField("Text9", "Risk Level"),
      dynamicField("Text10", "Compliance Status"),
      dynamicUser("Text7", "Owner"),
    ], { padding: { left: 16, right: 16, top: 14, bottom: 14 } }),
  ]);
}

function iconList(rootId, vendorsId) {
  return control("icon_list", "Quick links", {
    items: [
      { icon: "fa-regular fa-plus", title: "New Vendor Request", description: "Open Vendors list.", action: { type: "navigate", target: listRef(rootId, vendorsId, "Vendors") } },
      { icon: "fa-regular fa-shield-check", title: "Compliance Queue", description: "Review risk status.", action: { type: "navigate", target: listRef(rootId, vendorsId, "Vendors") } },
    ],
  });
}

function timeline(rootId, activityId) {
  return control("timeline-v", "Recent activity timeline", {
    data: {
      list: listRef(rootId, activityId, "Vendor Activity / History"),
      sort: [{ SortName: "DateTime3", Direction: "desc" }],
      title: { type: "expr", exprType: "list_field", prop: "Text0" },
    },
  }, [
    container("Timeline item template", [
      dynamicField("Text0", "Activity Title"),
      dynamicField("Text2", "Activity Type"),
      dynamicField("DateTime3", "Activity Date"),
    ], { padding: { left: 14, right: 14, top: 12, bottom: 12 } }),
  ]);
}

function page(title, testedControl) {
  return {
    title,
    ver: "2.0",
    filterVars: [],
    tempVars: [],
    attrs: {
      hideHeaderAll: true,
      common: { padding: { left: 28, right: 28, top: 28, bottom: 28 } },
      diagnosticScope: "single-control-page",
    },
    children: [testedControl],
  };
}

function layout(rootId, layoutId, title, resource) {
  return {
    ListID: rootId,
    LayoutID: layoutId,
    Type: 103,
    Title: title,
    LayoutView: "",
    Ext1: "",
    Ext2: JSON.stringify({ src: true }),
    Ext3: "",
    IsDefault: false,
    IsItemPerm: false,
    Perms: [],
    LayoutInResources: [{ ID: layoutId, RefId: layoutId, Resource: JSON.stringify(resource) }],
  };
}

function buildDiagnosticPages(decoded, ids) {
  const rootId = decoded.ListSet.ListID;
  const existingDashboardId = decoded.Pages[0].LayoutID;
  const vendorsId = listByTitle(decoded, "Vendors").ListID;
  const activityId = listByTitle(decoded, "Vendor Activity / History").ListID;
  const pageSpecs = [
    ["01 Heading", existingDashboardId, page("01 Heading control", heading("Heading control diagnostic", "page"))],
    ["02 Container", ids.next("dashboard:container"), page("02 Container control", container("Container control diagnostic", [heading("Container child label", "section")]))],
    ["03 Button", ids.next("dashboard:button"), page("03 Button control", button(rootId, vendorsId))],
    ["04 Dynamic Field", ids.next("dashboard:dynamic-field"), page("04 Dynamic Field control", dynamicField("Text0", "Vendor Name"))],
    ["05 Dynamic User", ids.next("dashboard:dynamic-user"), page("05 Dynamic User control", dynamicUser("Text7", "Owner"))],
    ["06 Progress Circle", ids.next("dashboard:progress-circle"), page("06 Progress Circle control", progressCircle())],
    ["07 Progress Bar", ids.next("dashboard:progress-bar"), page("07 Progress Bar control", progressBar())],
    ["08 Alert", ids.next("dashboard:alert"), page("08 Alert control", alertControl())],
    ["09 Kanban", ids.next("dashboard:kanban"), page("09 Kanban control", kanban(rootId, vendorsId))],
    ["10 Icon List", ids.next("dashboard:icon-list"), page("10 Icon List control", iconList(rootId, vendorsId))],
    ["11 Data Table", ids.next("dashboard:data-list"), page("11 Data Table control", dataList(rootId, vendorsId))],
    ["12 Timeline", ids.next("dashboard:timeline"), page("12 Timeline control", timeline(rootId, activityId))],
  ];
  return pageSpecs.map(([title, id, resource]) => layout(rootId, id, title, resource));
}

function navItem(rootId, pageLayout, icon) {
  return {
    AppID: APP_ID,
    ListID: pageLayout.LayoutID,
    ListSetID: rootId,
    Type: 103,
    IsHidden: false,
    Title: pageLayout.Title,
    Icon: icon,
  };
}

function updateNavigation(decoded, pages, groupId) {
  const rootId = decoded.ListSet.ListID;
  const layoutView = JSON.parse(decoded.ListSet.LayoutView || "{}");
  const childLists = decoded.Childs.map((child) => ({
    AppID: APP_ID,
    ListID: child.List.ListID,
    ListSetID: rootId,
    Type: child.List.Type,
    IsHidden: false,
    Title: child.List.Title,
    Icon: "fa-regular fa-table-list",
  }));
  layoutView.sort = [
    {
      ID: groupId,
      AppID: APP_ID,
      ListSetID: rootId,
      Type: "classes",
      Title: "Dashboard Control Diagnostics",
      Icon: "fa-regular fa-layer-group",
      list: pages.map((pageLayout) => navItem(rootId, pageLayout, "fa-regular fa-grid-2")),
    },
    ...childLists,
  ];
  layoutView.sortVer = 1;
  layoutView.attrs = layoutView.attrs || {};
  layoutView.attrs["navigator-menu"] = {
    ...(layoutView.attrs["navigator-menu"] || {}),
    position: "default",
  };
  decoded.ListSet.LayoutView = JSON.stringify(layoutView);
}

function collectLargeIds(value, output = new Set()) {
  if (typeof value === "string" && /^\d{16,}$/.test(value)) output.add(value);
  else if (Array.isArray(value)) value.forEach((item) => collectLargeIds(item, output));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => collectLargeIds(item, output));
  return output;
}

async function main() {
  ensureDir(TMP_DIR);
  const env = loadApiEnv();
  const { wrapper, decoded } = readYapk(BASE_YAPK);
  const existingIdsBefore = collectLargeIds(decoded);
  const allocator = createIdAllocator(await fetchApiIds(env, 16));
  const groupId = allocator.next("nav-group:dashboard-control-diagnostics");
  const pages = buildDiagnosticPages(decoded, allocator);
  decoded.Pages = pages;
  updateNavigation(decoded, pages, groupId);
  const existingIdsAfter = collectLargeIds(decoded);
  for (const id of existingIdsBefore) {
    if (!existingIdsAfter.has(id)) throw new Error(`Existing ID was not preserved: ${id}`);
  }
  decoded.PortalInfo = null;
  const resourceBase64 = zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64");
  const upgradeWrapper = {
    ...wrapper,
    PackageId: crypto.randomUUID(),
    Title: "Vendor Onboarding v4.1 Dashboard Control Diagnostics",
    Description: "Upgrade diagnostic YAPK that isolates each Vendor dashboard control on its own current dashboard page.",
    Notes: "Preserves existing app/list/field/sample IDs from the current v4.1 dashboard YAPK; adds only new dashboard page and navigation group IDs.",
    Date: GENERATED_AT_UTC,
    Version: "4.1-dashboard-control-diagnostics",
    Resource: resourceBase64,
    Sign: "",
  };
  const signed = await signWrapper(env, upgradeWrapper);
  fs.writeFileSync(OUT_YAPK, `${JSON.stringify(signed.wrapper, null, 2)}\n`);
  fs.writeFileSync(`${TMP_DIR}/diagnostic-summary.normalized.json`, `${JSON.stringify({
    outputYapk: OUT_YAPK,
    baseYapk: BASE_YAPK,
    pageCount: pages.length,
    existingIdsPreserved: existingIdsBefore.size,
    newIdsUsed: allocator.used,
    navigationGroup: "Dashboard Control Diagnostics",
    pages: pages.map((item) => ({ title: item.Title, layoutId: item.LayoutID })),
    sampleData: decoded.Childs.map((child) => ({ title: child.List.Title, rows: Object.keys(child.List.Items || {}).length })),
    signing: { status: "signed_and_verified", signByteLength: signed.signByteLength, verifyStatus: signed.verifyStatus },
  }, null, 2)}\n`);
  console.log(JSON.stringify({
    status: "generated",
    outputYapk: OUT_YAPK,
    baseYapk: BASE_YAPK,
    pageCount: pages.length,
    existingIdsPreserved: existingIdsBefore.size,
    newIdsUsed: allocator.used.length,
    signing: { status: "signed_and_verified", signByteLength: signed.signByteLength, verifyStatus: signed.verifyStatus },
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "fail", error: error.message }, null, 2));
  process.exit(1);
});

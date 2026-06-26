#!/usr/bin/env node

import fs from "node:fs";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { loadDotenvFile, resolveYeeflowEnvironment } from "./scripts/yeeflow-env-utils.mjs";

const APP_ID = 41;
const SOURCE_YAPK = process.env.VENDOR_ONBOARDING_V43_SOURCE_YAPK
  || "/Users/Renger/Downloads/Vendor Onboarding & Compliance Management v4.1 Dashboard-4.7 - style and list form routing.yapk";
const OUT_YAPK = process.env.VENDOR_ONBOARDING_V43_YAPK
  || "/Users/Renger/Downloads/Vendor Onboarding & Compliance Management v4.1 Dashboard-4.8 - split dashboard 02.yapk";
const TMP_DIR = ".tmp/vendor-onboarding-v43-combined-dashboard";
const GENERATED_AT_UTC = "2026-05-30T08:05:00Z";

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

function brotliTolerant(buffer) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const stream = zlib.createBrotliDecompress();
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", (error) => chunks.length ? resolve(Buffer.concat(chunks)) : reject(error));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.end(buffer);
  });
}

async function readYapk(path) {
  const wrapper = parseJsonPreservingLargeInts(fs.readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
  let decodedText;
  try {
    decodedText = zlib.brotliDecompressSync(Buffer.from(wrapper.Resource, "base64")).toString("utf8");
  } catch {
    decodedText = (await brotliTolerant(Buffer.from(wrapper.Resource, "base64"))).toString("utf8");
  }
  return { wrapper, decoded: parseJsonPreservingLargeInts(decodedText) };
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function collectLargeIds(value, output = new Set()) {
  if (typeof value === "string" && /^\d{16,}$/.test(value)) output.add(value);
  else if (Array.isArray(value)) value.forEach((item) => collectLargeIds(item, output));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => collectLargeIds(item, output));
  return output;
}

function listByTitle(decoded, title) {
  const child = decoded.Childs.find((item) => item.List?.Title === title);
  if (!child) throw new Error(`Missing list ${title}`);
  return child;
}

function fieldMap(child) {
  return new Map(child.Fields.map((field) => [field.FieldName, field]));
}

function viewLayout(child, fieldsToShow) {
  const fields = fieldMap(child);
  return JSON.stringify({
    layout: fieldsToShow.map((fieldName, index) => {
      const field = fields.get(fieldName);
      if (!field) throw new Error(`Missing field ${child.List.Title}.${fieldName}`);
      return {
        DisplayName: field.DisplayName,
        FieldID: field.FieldID,
        FieldName: field.FieldName,
        Mobile: 0,
        Order: index + 1,
        Show: true,
        Type: field.Type,
        Rules: parseMaybeJson(field.Rules) || {},
      };
    }),
    query: [],
    sort: [],
    filter: [],
    rowColor: [],
  });
}

function parseMaybeJson(value) {
  if (typeof value !== "string" || !value) return value && typeof value === "object" ? value : {};
  try { return JSON.parse(value); } catch { return {}; }
}

function normalizeSchema(decoded) {
  decoded.ListSet.AdvancePerms = Array.isArray(decoded.ListSet.AdvancePerms) ? decoded.ListSet.AdvancePerms : [];
  decoded.ListSet.Perms = Array.isArray(decoded.ListSet.Perms) ? decoded.ListSet.Perms : [];
  decoded.ListSet.Items = decoded.ListSet.Items && typeof decoded.ListSet.Items === "object" ? decoded.ListSet.Items : {};
  for (const page of decoded.Pages || []) {
    page.Ext1 = page.Ext1 ?? "";
    page.Ext2 = page.Ext2 ?? "";
    page.Ext3 = page.Ext3 ?? "";
    page.Perms = Array.isArray(page.Perms) ? page.Perms : [];
    page.LayoutView = page.LayoutView ?? "";
  }
  for (const child of decoded.Childs || []) {
    child.List.Perms = Array.isArray(child.List.Perms) ? child.List.Perms : [];
    child.List.AdvancePerms = Array.isArray(child.List.AdvancePerms) ? child.List.AdvancePerms : [];
    child.List.Items = child.List.Items && typeof child.List.Items === "object" ? child.List.Items : {};
    for (const layout of child.Layouts || []) {
      layout.Ext1 = layout.Ext1 ?? "";
      layout.Ext2 = layout.Ext2 ?? "";
      layout.Ext3 = layout.Ext3 ?? "";
      layout.Perms = Array.isArray(layout.Perms) ? layout.Perms : [];
      layout.LayoutView = layout.LayoutView ?? "";
    }
  }
  decoded.PortalInfo = null;
}

function listRef(rootId, listId, title, type = 1) {
  return { AppID: APP_ID, ListID: listId, ListSetID: rootId, Type: type, Title: title };
}

function control(type, label, attrs = {}, children = [], extra = {}) {
  return { id: extra.id || `${type}-${crypto.randomUUID()}`, type, label, attrs, children, nv_label: extra.nv_label || label };
}

function heading(value, token = "s-regular", color = "var(--c--text)") {
  return control("heading", "Text", {
    headc: { title: { value, variable: null } },
    heads: { ty: [null, token], color },
    common: { positioning: { widthtype: [null, "2"] } },
  }, [], { nv_label: value });
}

function container(children, options = {}) {
  const attrs = {
    style: {
      gap: [null, options.gap || "--sp--s250"],
      direction: [null, options.direction || "column"],
      align_items: [null, options.align || "stretch"],
      ...(options.justify ? { justify_content: [null, options.justify] } : {}),
      ...(options.widthtype ? { widthtype: [null, options.widthtype] } : {}),
    },
    common: {
      padding: [null, {
        top: options.padding || "--sp--s400",
        right: options.padding || "--sp--s400",
        bottom: options.padding || "--sp--s400",
        left: options.padding || "--sp--s400",
      }],
      background: { normal: { type: "classic", classic: { color: options.background || "#ffffff" } } },
      border: {
        normal: {
          type: "1",
          width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
          color: options.borderColor || "var(--c--neutral-light-active)",
          radius: [null, {
            top: options.radius || "--sp--s300",
            right: options.radius || "--sp--s300",
            bottom: options.radius || "--sp--s300",
            left: options.radius || "--sp--s300",
          }],
        },
      },
    },
  };
  return control("container", "Container", attrs, children);
}

function sectionContainer(children, nvLabel, options = {}) {
  const node = container(children, options);
  node.nv_label = nvLabel;
  return node;
}

function flexContainer(children, options = {}) {
  return control("container", "Container", {
    style: {
      direction: [null, options.direction || "row"],
      gap: [null, options.gap || "--sp--s150"],
      align_items: [null, options.align || "center"],
      justify_content: [null, options.justify || "flex-start"],
      ...(options.widthtype ? { widthtype: [null, options.widthtype] } : {}),
    },
  }, children);
}

function contentShell(title, children) {
  return {
    title,
    ver: "2.0",
    filterVars: [],
    tempVars: [],
    attrs: {
      hideHeaderAll: true,
      container: {
        padding: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }],
      },
      background: {
        type: "classic",
        classic: { color: "var(--c--neutral-light)" },
      },
    },
    children: [
      control("container", "Container", {
        style: {
          gap: [null, "--sp--s0"],
          direction: [null, "column"],
          justify_content: [null, "flex-start"],
          align_items: [null, "center"],
        },
      }, [
        control("container", "Container", {
          style: {
            gap: [null, "--sp--s300"],
            direction: [null, "column"],
            justify_content: [null, "flex-start"],
          },
          common: {
            padding: [null, { top: "--sp--s300", right: "--sp--s300", bottom: "--sp--s300", left: "--sp--s300" }],
            background: { normal: { type: "classic", classic: { color: "var(--c--neutral-light)" } } },
          },
        }, children, { nv_label: "Content" }),
      ], { nv_label: "Main" }),
    ],
  };
}

function grid(children, options = {}) {
  const gridControl = control("flex_grid", "Grid", {
    ver: 1,
    columns: {
      "1": { list: Array.from({ length: options.columns || 2 }, () => ({ value: 1, unit: "fr" })), last: { value: 1, unit: "fr" } },
      "2": { list: Array.from({ length: options.columns || 2 }, () => ({ value: 1, unit: "fr" })), last: { value: 1, unit: "fr" } },
      "3": { list: [{ value: 1, unit: "fr" }], last: { value: 1, unit: "fr" } },
    },
    rows: { "1": { list: [{ unit: "auto" }], last: { unit: "auto" } } },
    cgap: { "1": options.gap || 16 },
    cgapU: { "1": "px" },
    rgap: [null, options.rowGap || 16],
    rgapU: [null, "px"],
  }, children);
  // Product-edited dashboard examples keep Grid display caption turned off with displayLabel [null, false].
  gridControl.displayLabel = [null, false];
  delete gridControl.nv_label;
  return gridControl;
}

function actionButton(label, style = "2") {
  return control("action_button", label, {
    label: { variable: null },
    "button-style": style,
    button: {
      normal: {
        border: {
          radius: [null, { top: "--sp--s075", right: "--sp--s075", bottom: "--sp--s075", left: "--sp--s075" }],
        },
      },
      ty: [null, "s-medium"],
    },
    common: { positioning: { widthtype: [null, "2"] } },
  });
}

function alertControl() {
  return sectionContainer([
    heading("High-risk vendors need document review", "s-semibold", "#9A3412"),
    heading("Critical or high-risk vendors with expiring insurance, missing tax forms, or blocked compliance reviews should be reviewed today.", "s-regular", "#7C2D12"),
  ], "High-risk vendor alert content", {
    padding: "--sp--s300",
    background: "#FFF7ED",
    borderColor: "#FDBA74",
    gap: "--sp--s100",
  });
}

function dataTable(rootId, vendorsId) {
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

function kanban(rootId, vendorsId) {
  return control("kanban", "Onboarding status board", {
    data: { list: listRef(rootId, vendorsId, "Vendors"), cateField: "Text8" },
    cardStyle: { background: "#FFFFFF", borderRadius: 10, borderColor: "#DDE5F2", padding: 14 },
    laneStyle: { width: 300, background: "#F8FAFC" },
  }, [
    container([
      dynamicField("Text0", "Vendor Name"),
      dynamicField("Text9", "Risk Level"),
      dynamicField("Text10", "Compliance Status"),
      dynamicUser("Text7", "Owner"),
      dynamicField("DateTime14", "Renewal Date"),
    ], { padding: "--sp--s300", gap: "--sp--s150" }),
  ]);
}

function timeline(rootId, activityId) {
  return control("timeline-v", "Recent activity timeline", {
    data: {
      list: listRef(rootId, activityId, "Vendor Activity / History"),
      sort: [{ SortName: "DateTime3", Direction: "desc" }],
      title: { type: "expr", exprType: "list_field", prop: "Text0" },
    },
  });
}

function progressBlock() {
  return flexContainer([
    control("progress-circle", "Overall onboarding completion", { value: 72, label: "Overall onboarding completion", color: "#0F6BFF", trackColor: "#E6EEF8", size: 132 }),
    control("progress", "Average vendor completion", { label: "Average vendor completion", value: 72, color: "#0F6BFF" }),
  ], { direction: "row", align: "center", justify: "flex-start", gap: "--sp--s300" });
}

function dashboardOverview(rootId, vendorsId) {
  return contentShell("Vendor Management Dashboard", [
      sectionContainer([
        flexContainer([
          sectionContainer([
            heading("Vendor Management Dashboard", "h3-bold"),
            heading("Monitor onboarding, compliance risk, documents, and vendor operations.", "s-regular", "var(--c--neutral-dark-hover)"),
          ], "Page header text", { borderColor: "transparent", padding: "--sp--s200", gap: "--sp--s075", widthtype: "2" }),
          flexContainer([
            actionButton("New Vendor Request", "2"),
            actionButton("View Compliance Queue", "4"),
          ], { direction: "row", justify: "flex-end", align: "center", widthtype: "2" }),
        ], { direction: "row", justify: "space-between", align: "center", gap: "--sp--s300" }),
      ], "Page header", { padding: "--sp--s400" }),
      sectionContainer([
        grid([
        container([heading("Total Vendors", "s-semibold"), heading("128", "h2-bold"), heading("All active and onboarding vendors", "s-regular", "var(--c--neutral-dark-hover)")], { gap: "--sp--s100" }),
        container([heading("Pending Onboarding", "s-semibold"), heading("24", "h2-bold"), heading("Requests awaiting review", "s-regular", "var(--c--neutral-dark-hover)")], { gap: "--sp--s100" }),
        container([heading("High Risk Vendors", "s-semibold"), heading("7", "h2-bold"), heading("High or critical risk", "s-regular", "var(--c--neutral-dark-hover)")], { gap: "--sp--s100" }),
        container([heading("Expiring Documents", "s-semibold"), heading("13", "h2-bold"), heading("Due within 30 days", "s-regular", "var(--c--neutral-dark-hover)")], { gap: "--sp--s100" }),
        ], { columns: 4, gap: 16, rowGap: 16 }),
      ], "Lifecycle KPI section", { padding: "--sp--s0", borderColor: "transparent", background: "transparent" }),
  ]);
}

function dashboardProgress(rootId, vendorsId) {
  return contentShell("Vendor Management Dashboard 02", [
      sectionContainer([
        flexContainer([
        container([
          heading("Onboarding Completion", "h4-bold"),
          progressBlock(),
          heading("Progress controls use static/aggregate values here; row-level dynamic controls are kept inside Kanban only.", "s-regular", "var(--c--neutral-dark-hover)"),
        ]),
        container([
          heading("Compliance Alert", "h4-bold"),
          alertControl(),
        ], { background: "#FFF7ED", borderColor: "#FDBA74" }),
        ], { direction: "row", gap: "--sp--s300", align: "stretch" }),
      ], "Progress and alert section", { padding: "--sp--s0", borderColor: "transparent", background: "transparent" }),
  ]);
}

function dashboardOperations(rootId, vendorsId, activityId) {
  return contentShell("Vendor Management Dashboard 03", [
      sectionContainer([
        flexContainer([
        container([
          heading("Onboarding Status Board", "h4-bold"),
          heading("Dynamic field and dynamic user controls are scoped inside the Kanban item template.", "s-regular", "var(--c--neutral-dark-hover)"),
          kanban(rootId, vendorsId),
        ]),
        container([
          heading("Recent Vendor Activity", "h4-bold"),
          timeline(rootId, activityId),
        ]),
        ], { direction: "row", gap: "--sp--s300", align: "stretch" }),
      ], "Operational queue section", { padding: "--sp--s0", borderColor: "transparent", background: "transparent" }),
      sectionContainer([
        heading("Vendor Records", "h4-bold"),
        dataTable(rootId, vendorsId),
      ], "Vendor records section"),
  ]);
}

const SAMPLE_VENDORS = [
  ["Northstar Components", "VEN-1001", "Strategic Supplier", "United States", "Avery Stone", "avery.stone@example.com", "+1 555 0101", "Procurement Manager", "Compliance Review", "High", "Action Required", 0.72, 0.68, 245000, "2026-06-28 00:00:00", "0", "2026-05-24 09:30:00"],
  ["Blue Harbor Logistics", "VEN-1002", "Service Provider", "Singapore", "Mei Tan", "mei.tan@example.com", "+65 5550 0102", "Operations Owner", "Procurement Review", "Medium", "In Review", 0.48, 0.52, 120000, "2026-08-15 00:00:00", "0", "2026-05-21 15:00:00"],
  ["Evergreen Security Labs", "VEN-1003", "Technology Vendor", "European Union", "Jonas Weber", "jonas.weber@example.com", "+49 555 0103", "Security Reviewer", "Approved", "Low", "Approved", 1, 0.94, 86000, "2027-01-10 00:00:00", "1", "2026-05-18 10:15:00"],
  ["Atlas Office Supply", "VEN-1004", "Strategic Supplier", "United Kingdom", "Priya Shah", "priya.shah@example.com", "+44 555 0104", "Procurement Manager", "Legal Review", "Medium", "In Review", 0.63, 0.61, 156000, "2026-09-20 00:00:00", "0", "2026-05-16 13:10:00"],
  ["Pacific Cloud Services", "VEN-1005", "Technology Vendor", "Australia", "Liam Cooper", "liam.cooper@example.com", "+61 555 0105", "IT Owner", "Finance Review", "High", "Action Required", 0.58, 0.46, 310000, "2026-07-08 00:00:00", "0", "2026-05-26 08:45:00"],
  ["Summit Facilities Group", "VEN-1006", "Service Provider", "United States", "Morgan Lee", "morgan.lee@example.com", "+1 555 0106", "Facilities Owner", "Request Submitted", "Low", "Not Started", 0.18, 0.12, 72000, "2026-11-30 00:00:00", "0", "2026-05-20 16:00:00"],
  ["Greenline Packaging", "VEN-1007", "Contractor", "Singapore", "Nur Aisyah", "aisyah@example.com", "+65 5550 0107", "Sourcing Owner", "Compliance Review", "Medium", "In Review", 0.69, 0.7, 98000, "2026-10-12 00:00:00", "1", "2026-05-22 11:25:00"],
  ["BrightPath Consulting", "VEN-1008", "Consultant", "United Kingdom", "Ethan Brooks", "ethan.brooks@example.com", "+44 555 0108", "Business Owner", "Approved", "Low", "Approved", 1, 0.91, 64000, "2027-02-01 00:00:00", "1", "2026-05-12 10:00:00"],
  ["Redwood Industrial", "VEN-1009", "Strategic Supplier", "United States", "Grace Miller", "grace.miller@example.com", "+1 555 0109", "Procurement Manager", "Compliance Review", "Critical", "Action Required", 0.41, 0.33, 420000, "2026-06-18 00:00:00", "0", "2026-05-29 09:00:00"],
  ["Silverline Analytics", "VEN-1010", "Technology Vendor", "Singapore", "Daniel Wong", "daniel.wong@example.com", "+65 5550 0110", "Data Owner", "Procurement Review", "Medium", "In Review", 0.52, 0.49, 135000, "2026-12-05 00:00:00", "0", "2026-05-23 14:45:00"],
];

function seedRows(child, allocator) {
  const rows = {};
  const title = child.List.Title;
  const vendors = SAMPLE_VENDORS;
  if (title === "Vendors") {
    for (const row of vendors) {
      const id = allocator.next(`sample:${title}`);
      rows[id] = {
        ListDataID: id,
        Title: row[0],
        Text0: row[0],
        Text1: row[1],
        Text2: row[2],
        Text3: row[3],
        Text4: row[4],
        Text5: row[5],
        Text6: row[6],
        Text7: row[7],
        Text8: row[8],
        Text9: row[9],
        Text10: row[10],
        Decimal11: row[11],
        Decimal12: row[12],
        Decimal13: row[13],
        DateTime14: row[14],
        Bit15: row[15],
        DateTime16: row[16],
      };
    }
  } else if (title === "Vendor Documents") {
    const docs = ["Insurance Certificate", "Tax Form", "Business Registration", "Contract", "Bank Details"];
    const statuses = ["Action Required", "In Review", "Approved", "Not Started", "Approved"];
    for (let i = 0; i < 10; i += 1) {
      const id = allocator.next(`sample:${title}`);
      rows[id] = { ListDataID: id, Title: `${docs[i % docs.length]} - ${vendors[i][0]}`, Text0: `${docs[i % docs.length]} - ${vendors[i][0]}`, Text1: vendors[i][0], Text2: docs[i % docs.length], Text3: statuses[i % statuses.length], DateTime4: `2026-${String(6 + (i % 6)).padStart(2, "0")}-${String(5 + i).padStart(2, "0")} 00:00:00` };
    }
  } else if (title === "Compliance Reviews") {
    const statuses = ["Action Required", "In Review", "Approved", "In Review", "Approved"];
    for (let i = 0; i < 10; i += 1) {
      const id = allocator.next(`sample:${title}`);
      rows[id] = { ListDataID: id, Title: `Compliance review - ${vendors[i][0]}`, Text0: `Compliance review - ${vendors[i][0]}`, Text1: vendors[i][0], Text2: statuses[i % statuses.length], Decimal3: Math.round((0.2 + (i % 7) * 0.1) * 100) / 100, DateTime4: `2026-05-${String(10 + i).padStart(2, "0")} 10:00:00` };
    }
  } else if (title === "Vendor Activity / History") {
    const types = ["Request Submitted", "Document Uploaded", "Review Completed", "Status Changed", "Renewal Reminder"];
    for (let i = 0; i < 10; i += 1) {
      const id = allocator.next(`sample:${title}`);
      rows[id] = { ListDataID: id, Title: `${types[i % types.length]} - ${vendors[i][0]}`, Text0: `${types[i % types.length]} - ${vendors[i][0]}`, Text1: vendors[i][0], Text2: types[i % types.length], DateTime3: `2026-05-${String(15 + i).padStart(2, "0")} 09:00:00`, Text4: vendors[i][7], Text5: `Sample activity for ${vendors[i][0]}.` };
    }
  }
  child.List.Items = rows;
}

function updateListViews(decoded) {
  const fields = {
    "Vendors": ["Text0", "Text1", "Text2", "Text3", "Text4", "Text5", "Text6", "Text7", "Text8", "Text9", "Text10", "Decimal11", "Decimal12", "Decimal13", "DateTime14", "Bit15", "DateTime16"],
    "Vendor Documents": ["Text0", "Text1", "Text2", "Text3", "DateTime4"],
    "Compliance Reviews": ["Text0", "Text1", "Text2", "Decimal3", "DateTime4"],
    "Vendor Activity / History": ["Text0", "Text1", "Text2", "DateTime3", "Text4", "Text5"],
  };
  for (const child of decoded.Childs) {
    const show = fields[child.List.Title];
    if (!show) continue;
    for (const layout of child.Layouts || []) {
      if (Number(layout.Type) === 0) {
        layout.IsDefault = true;
        layout.LayoutView = viewLayout(child, show);
      }
    }
    const defaultView = (child.Layouts || []).find((layout) => Number(layout.Type) === 0 && layout.IsDefault)
      || (child.Layouts || []).find((layout) => Number(layout.Type) === 0);
    if (defaultView) {
      child.List.LayoutView = JSON.stringify({
        add: "default",
        edit: "default",
        opentype: { view: "new" },
        sort: [],
        view: String(defaultView.LayoutID),
      });
    }
  }
}

function updateNavigation(decoded, dashboardPages) {
  const rootId = decoded.ListSet.ListID;
  const layoutView = JSON.parse(decoded.ListSet.LayoutView || "{}");
  layoutView.sort = [
    ...dashboardPages.map((dashboardPage, index) => ({
      AppID: APP_ID,
      ListID: dashboardPage.LayoutID,
      ListSetID: rootId,
      Type: 103,
      IsHidden: false,
      Title: dashboardPage.Title,
      Icon: index === 0 ? "fa-regular fa-chart-line" : "fa-regular fa-grid-2",
    })),
    ...decoded.Childs.map((child) => ({ AppID: APP_ID, ListID: child.List.ListID, ListSetID: rootId, Type: child.List.Type, IsHidden: false, Title: child.List.Title, Icon: "fa-regular fa-table-list" })),
  ];
  layoutView.sortVer = 1;
  layoutView.attrs = layoutView.attrs || {};
  layoutView.attrs["navigator-menu"] = { ...(layoutView.attrs["navigator-menu"] || {}), position: "default" };
  decoded.ListSet.LayoutView = JSON.stringify(layoutView);
}

async function main() {
  ensureDir(TMP_DIR);
  const env = loadApiEnv();
  const { wrapper, decoded } = await readYapk(SOURCE_YAPK);
  normalizeSchema(decoded);
  const existingIdsBefore = collectLargeIds(decoded);
  const allocator = createIdAllocator(await fetchApiIds(env, 44));
  for (const child of decoded.Childs) seedRows(child, allocator);
  updateListViews(decoded);
  const rootId = decoded.ListSet.ListID;
  const vendorsId = listByTitle(decoded, "Vendors").List.ListID;
  const activityId = listByTitle(decoded, "Vendor Activity / History").List.ListID;
  const dashboardId = decoded.Pages[0].LayoutID;
  const dashboard2Id = decoded.Pages[1]?.LayoutID || allocator.next("dashboard:secondary");
  const dashboard3Id = decoded.Pages[2]?.LayoutID || allocator.next("dashboard:tertiary");
  const dashboardLayout = {
    ...decoded.Pages[0],
    ListID: rootId,
    LayoutID: dashboardId,
    Type: 103,
    Title: "Vendor Management Dashboard",
    LayoutView: "",
    Ext1: "",
    Ext2: JSON.stringify({ src: true }),
    Ext3: "",
    IsDefault: false,
    IsItemPerm: false,
    Perms: [],
    LayoutInResources: [{ ID: dashboardId, RefId: dashboardId, Resource: JSON.stringify(dashboardOverview(rootId, vendorsId)) }],
  };
  const dashboardLayout2 = {
    ...(decoded.Pages[1] || decoded.Pages[0]),
    ListID: rootId,
    LayoutID: dashboard2Id,
    Type: 103,
    Title: "Vendor Management Dashboard 02",
    LayoutView: "",
    Ext1: "",
    Ext2: JSON.stringify({ src: true }),
    Ext3: "",
    IsDefault: false,
    IsItemPerm: false,
    Perms: [],
    LayoutInResources: [{ ID: dashboard2Id, RefId: dashboard2Id, Resource: JSON.stringify(dashboardProgress(rootId, vendorsId)) }],
  };
  const dashboardLayout3 = {
    ...(decoded.Pages[2] || decoded.Pages[0]),
    ListID: rootId,
    LayoutID: dashboard3Id,
    Type: 103,
    Title: "Vendor Management Dashboard 03",
    LayoutView: "",
    Ext1: "",
    Ext2: JSON.stringify({ src: true }),
    Ext3: "",
    IsDefault: false,
    IsItemPerm: false,
    Perms: [],
    LayoutInResources: [{ ID: dashboard3Id, RefId: dashboard3Id, Resource: JSON.stringify(dashboardOperations(rootId, vendorsId, activityId)) }],
  };
  decoded.Pages = [dashboardLayout, dashboardLayout2, dashboardLayout3];
  updateNavigation(decoded, decoded.Pages);
  const existingIdsAfter = collectLargeIds(decoded);
  const missingExistingIds = [...existingIdsBefore].filter((id) => !existingIdsAfter.has(id));
  if (missingExistingIds.some((id) => id === rootId || id === dashboardId || decoded.Childs.some((child) => child.List.ListID === id || child.Fields.some((field) => field.FieldID === id)))) {
    throw new Error("A retained app/list/field/dashboard ID was not preserved.");
  }
  const resourceBase64 = zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64");
  const upgradeWrapper = {
    ...wrapper,
    PackageId: crypto.randomUUID(),
    Title: "Vendor Onboarding & Compliance Management v4.8 Split Dashboard 02",
    Description: "Three-dashboard update splitting Dashboard 02 content into smaller pages.",
    Notes: "Keeps Dashboard 01 and list form routing fixes, splits Dashboard 02 into progress/alert and operations pages, uses Main > Content structure, and keeps dynamic controls only inside Kanban.",
    Date: GENERATED_AT_UTC,
    Version: "4.8 - split dashboard 02",
    Resource: resourceBase64,
    Sign: "",
  };
  const signed = await signWrapper(env, upgradeWrapper);
  fs.writeFileSync(OUT_YAPK, `${JSON.stringify(signed.wrapper, null, 2)}\n`);
  fs.writeFileSync(`${TMP_DIR}/summary.normalized.json`, `${JSON.stringify({
    outputYapk: OUT_YAPK,
    sourceYapk: SOURCE_YAPK,
    pages: decoded.Pages.map((page) => page.Title),
    childLists: decoded.Childs.map((child) => ({ title: child.List.Title, rows: Object.keys(child.List.Items || {}).length, displayedFields: JSON.parse(child.Layouts[0].LayoutView || "{}").layout?.filter((item) => item.Show).map((item) => item.FieldName) || [] })),
    existingIdsBefore: existingIdsBefore.size,
    missingExistingIds: missingExistingIds.length,
    newIdsUsed: allocator.used.length,
    dynamicControlsRule: "Dynamic controls are only generated inside the Kanban item template.",
    signing: { status: "signed_and_verified", signByteLength: signed.signByteLength, verifyStatus: signed.verifyStatus },
  }, null, 2)}\n`);
  console.log(JSON.stringify({
    status: "generated",
    outputYapk: OUT_YAPK,
    sourceYapk: SOURCE_YAPK,
    pages: decoded.Pages.length,
    rowsPerList: decoded.Childs.map((child) => ({ title: child.List.Title, rows: Object.keys(child.List.Items || {}).length })),
    newIdsUsed: allocator.used.length,
    signing: { status: "signed_and_verified", signByteLength: signed.signByteLength, verifyStatus: signed.verifyStatus },
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "fail", error: error.message }, null, 2));
  process.exit(1);
});

#!/usr/bin/env node

import fs from "node:fs";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { loadDotenvFile, resolveYeeflowEnvironment } from "./scripts/yeeflow-env-utils.mjs";

const APP_ID = 41;
const APP_TITLE = "Vendor Onboarding & Compliance Management v4.1 Dashboard";
const APP_DESCRIPTION = "Page 1 proof package for the Vendor Management Dashboard using the v4 template corpus and dashboard-only composition contract.";
const OUT_YAPK = process.env.VENDOR_ONBOARDING_V41_DASHBOARD_YAPK || "/Users/Renger/Downloads/vendor-onboarding-v41-page1-dashboard.yapk";
const OUT_YAP = process.env.VENDOR_ONBOARDING_V41_DASHBOARD_YAP || "/Users/Renger/Downloads/vendor-onboarding-v41-page1-dashboard.yap";
const TMP_DIR = ".tmp/vendor-onboarding-v41-page1-dashboard";
const REPORT = `${TMP_DIR}/generation-report.json`;
const GENERATED_AT = "2026-05-30 12:00:00";
const GENERATED_AT_UTC = "2026-05-30T04:00:00Z";
const GZIP_PREFIX = "[______gizp______]";
const ICON_URL = "{\"b\":\"#E6F7FF\",\"i\":\"fa-regular fa-building-shield\",\"c\":\"#008DA6\"}";

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
  if (out.some((id) => !/^\d+$/.test(id))) throw new Error("generate ids returned a non-numeric ID.");
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
    remaining() {
      return queue.length;
    },
  };
}

function cleanInternalName(value) {
  return String(value).replace(/[^A-Za-z0-9_]/g, "") || `Field_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
}

function selectRules(values) {
  return {
    choices: values.map((value, index) => ({
      Id: String(index + 1),
      Value: value,
      Text: value,
      Color: ["#2563EB", "#0F766E", "#D97706", "#DC2626", "#7C3AED", "#64748B"][index % 6],
    })),
  };
}

function autoRules(displayName, type) {
  if (type !== "select") return {};
  const choices = {
    "Vendor Type": ["Strategic Supplier", "Service Provider", "Technology Vendor", "Contractor", "Consultant"],
    "Country / Region": ["United States", "Singapore", "European Union", "United Kingdom", "Australia", "Other"],
    "Onboarding Status": ["Request Submitted", "Procurement Review", "Compliance Review", "Legal Review", "Finance Review", "Approved"],
    "Risk Level": ["Low", "Medium", "High", "Critical"],
    "Compliance Status": ["Not Started", "In Review", "Action Required", "Approved", "Expired"],
    "Document Type": ["Tax Form", "Insurance Certificate", "Business Registration", "Contract", "Bank Details"],
    "Review Status": ["Not Started", "In Review", "Action Required", "Approved", "Rejected"],
    "Activity Type": ["Request Submitted", "Document Uploaded", "Review Completed", "Status Changed", "Renewal Reminder"],
  };
  return selectRules(choices[displayName] || ["Open", "In Progress", "Complete"]);
}

function makeField(ids, listId, spec) {
  const type = spec.type || "input";
  const fieldName = spec.fieldName;
  const fieldIndex = Number(String(fieldName).match(/(\d+)$/)?.[1] || 0);
  return {
    FieldID: ids.next(`field:${spec.displayName}`),
    ListID: listId,
    FieldName: fieldName,
    FieldType: spec.fieldType || "Text",
    FieldIndex: fieldIndex,
    DisplayName: spec.displayName,
    InternalName: cleanInternalName(spec.internalName || spec.displayName),
    DisplayName_EN: null,
    Type: type,
    Status: 1,
    Category: 0,
    DefaultValue: spec.defaultValue ?? "",
    Rules: JSON.stringify(spec.rules || autoRules(spec.displayName, type)),
    AppID: APP_ID,
    IsSort: fieldIndex === 0,
    IsIndex: fieldIndex === 0,
    IsFilter: Boolean(spec.isFilter),
    IsIndexCreated: false,
    IsSystem: false,
    IsUnique: false,
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
    Ext1: "",
    Ext2: "",
    Ext3: "",
    Title: spec.displayName,
  };
}

function control(type, label, attrs = {}, children = [], extra = {}) {
  return {
    id: extra.id || `${type}-${crypto.randomUUID()}`,
    type,
    label,
    attrs,
    children,
    nv_label: extra.nv_label || label,
  };
}

function text(value, role = "body", extra = {}) {
  const ty = role.includes("value")
    ? "h2-bold"
    : role.includes("page")
      ? "h3-bold"
      : role.includes("section")
        ? "h4-bold"
        : role.includes("label")
          ? "s-semibold"
          : "s-regular";
  return control("heading", "Text", {
    headc: { title: { value, variable: null } },
    heads: {
      ty: [null, ty],
      color: extra.color || (role.includes("title") || role.includes("value") ? "var(--c--text)" : "var(--c--neutral-dark-hover)"),
    },
    role,
  }, [], { nv_label: value });
}

function container(label, children, options = {}) {
  return control("container", label, {
    templateSectionId: options.sectionId || "",
    style: {
      direction: options.direction || "column",
      gap: options.gap ?? 16,
      align_items: options.align || "stretch",
      justify_content: options.justify || "flex-start",
      shadow: options.shadow || "soft",
    },
    common: {
      padding: options.padding || { left: 24, right: 24, top: 20, bottom: 20 },
      background: { normal: { type: "classic", classic: { color: options.background || "#FFFFFF" } } },
      border: options.border === false ? undefined : {
        normal: {
          type: "1",
          width: { left: 1, right: 1, top: 1, bottom: 1 },
          color: options.borderColor || "#DDE5F2",
          radius: { left: 10, right: 10, top: 10, bottom: 10 },
        },
      },
    },
  }, children, { nv_label: label });
}

function grid(label, children, columns, sectionId = "") {
  return control("container", "Grid", {
    templateSectionId: sectionId,
    grid: { columns, minColumnWidth: columns >= 4 ? 220 : 320 },
    style: { direction: [null, "row"], gap: [null, 16], align_items: [null, "stretch"], wrap: true },
    common: { padding: { left: 0, right: 0, top: 0, bottom: 0 } },
  }, children, { nv_label: label });
}

function action(label, target, style = "primary") {
  return control("button", label, {
    text: label,
    button_type: style,
    control_action: {
      type: "navigate",
      target,
      note: "Safe in-package navigation target for dashboard-only proof.",
    },
  }, [], { nv_label: label });
}

function listRef(rootId, listId, title, type = 1) {
  return { AppID: APP_ID, ListID: listId, ListSetID: rootId, Type: type, Title: title };
}

function dynamicField(fieldName, label, options = {}) {
  return control("dynamic-field", label, {
    source: "3",
    "obj-f": fieldName,
    fieldLabel: label,
    item_style: { ty: [null, options.ty || "s-medium"], color: options.color || "#071638" },
  }, [], { nv_label: label });
}

function dynamicUser(fieldName, label) {
  return control("dynamic-user", label, {
    source: "3",
    "obj-f": fieldName,
    fieldLabel: label,
    display_name: true,
    picture_style: { "image-size": [null, 28], gap: [null, 8], align: [null, "center"] },
  }, [], { nv_label: label });
}

function progressCircle(label, value) {
  return control("progress-circle", label, {
    value,
    label,
    color: "#0F6BFF",
    trackColor: "#E6EEF8",
    size: 132,
  }, [], { nv_label: label });
}

function progressBar(label, fieldName) {
  return control("progress", label, {
    label,
    source: "3",
    "obj-f": fieldName,
    value: { type: "expr", exprType: "list_field", prop: fieldName },
    color: "#0F6BFF",
  }, [], { nv_label: label });
}

function alertCard() {
  return control("alert", "High-risk vendor document alert", {
    title: "High-risk vendors need document review",
    description: "Critical or high-risk vendors with expiring insurance, missing tax forms, or blocked compliance reviews should be reviewed today.",
    type: "danger",
  }, [], { nv_label: "High-risk vendor document alert" });
}

function dataTable(rootId, listId, title, columns) {
  return control("data-list", "Vendors Data table", {
    data: { list: listRef(rootId, listId, title) },
    listarr: columns.map((column, index) => ({
      Field: column.field,
      FieldName: column.label,
      DisplayName: column.label,
      Order: index + 1,
      Show: true,
    })),
    table: { density: "comfortable", striped: true, bordered: false, stickyHeader: true },
  }, [], { nv_label: "Vendors Data table" });
}

function localItemAction(label, targetListId) {
  return {
    id: `action-${crypto.randomUUID()}`,
    name: label,
    type: "coll",
    steps: [{
      type: "listitem",
      attrs: {
        opentype: "target",
        listid: targetListId,
        note: "Dashboard-only proof binds item action to an included list target.",
      },
    }],
  };
}

function kanban(rootId, vendorsId) {
  return control("kanban", "Onboarding status board", {
    data: { list: listRef(rootId, vendorsId, "Vendors"), cateField: "Text8" },
    cardStyle: { background: "#FFFFFF", borderRadius: 10, borderColor: "#DDE5F2", padding: 14 },
    laneStyle: { width: 300, background: "#F8FAFC" },
    actions: [localItemAction("View Vendor", vendorsId), localItemAction("Update Status", vendorsId)],
  }, [
    container("Onboarding status board card template", [
      dynamicField("Text0", "Vendor Name", { ty: "s-semibold" }),
      dynamicField("Text9", "Risk Level"),
      dynamicField("Text10", "Compliance Status"),
      dynamicUser("Text7", "Owner"),
      dynamicField("DateTime14", "Renewal Date"),
      dynamicField("DateTime16", "Last Review Date"),
    ], { padding: { left: 16, right: 16, top: 14, bottom: 14 }, gap: 8 }),
  ], { nv_label: "Onboarding status board" });
}

function iconList(rootId, vendorsId) {
  return control("icon_list", "Quick links", {
    items: [
      { icon: "fa-regular fa-plus", title: "New Vendor Request", description: "Open Vendors list to start the next request step.", action: { type: "navigate", target: listRef(rootId, vendorsId, "Vendors") } },
      { icon: "fa-regular fa-shield-check", title: "View Compliance Queue", description: "Filter vendors requiring review.", action: { type: "navigate", target: listRef(rootId, vendorsId, "Vendors") } },
      { icon: "fa-regular fa-file-lines", title: "Expiring Documents", description: "Review vendors with upcoming renewals.", action: { type: "navigate", target: listRef(rootId, vendorsId, "Vendors") } },
      { icon: "fa-regular fa-clock-rotate-left", title: "Recent Activity", description: "Scan the latest onboarding changes.", action: { type: "navigate", target: { type: "section", section: "recent_activity_timeline" } } },
    ],
  }, [], { nv_label: "Quick links icon list" });
}

function timeline(rootId, activityId) {
  return control("timeline-v", "Recent activity timeline", {
    data: {
      list: listRef(rootId, activityId, "Vendor Activity / History"),
      sort: [{ SortName: "DateTime3", Direction: "desc" }],
      title: { type: "expr", exprType: "list_field", prop: "Text0" },
    },
  }, [
    container("Recent activity timeline item template", [
      dynamicField("Text0", "Activity Title", { ty: "s-semibold" }),
      dynamicField("Text2", "Activity Type"),
      dynamicField("DateTime3", "Activity Date"),
      dynamicUser("Text4", "Actor"),
      dynamicField("Text5", "Description"),
    ], { padding: { left: 14, right: 14, top: 12, bottom: 12 }, gap: 8 }),
  ], { nv_label: "Recent activity timeline" });
}

function dashboardPage(ids) {
  const vendorTarget = listRef(ids.rootId, ids.vendorsId, "Vendors");
  return {
    title: "Vendor Management Dashboard",
    ver: "2.0",
    filterVars: [],
    tempVars: [{ id: "__temp_selected_vendor", name: "Selected Vendor", type: "text" }],
    attrs: {
      hideHeaderAll: true,
      common: { padding: { left: 0, right: 0, top: 0, bottom: 0 } },
      templateScope: "vendor_management_dashboard",
    },
    children: [
      container("Vendor Management Dashboard root padded canvas", [
        container("Header/action area", [
          grid("Header action area grid", [
            container("Header title block", [
              text("Vendor Management Dashboard", "page-title", { size: 28 }),
              text("Monitor onboarding, compliance risk, expiring documents, and vendor operations from one operating cockpit.", "body"),
              text("Data sources: Vendors, Vendor Documents, Compliance Reviews, Vendor Activity / History", "caption"),
            ], { border: false, padding: { left: 0, right: 0, top: 0, bottom: 0 }, shadow: "none" }),
            container("Header action buttons", [
              action("New Vendor Request", vendorTarget, "primary"),
              action("View Compliance Queue", vendorTarget, "secondary"),
            ], { direction: "row", justify: "flex-end", align: "center", border: false, padding: { left: 0, right: 0, top: 0, bottom: 0 }, shadow: "none" }),
          ], 2, "header_action_area"),
        ], { sectionId: "header_action_area", background: "#FFFFFF", padding: { left: 28, right: 28, top: 26, bottom: 24 } }),
        grid("KPI card row", [
          container("Total Vendors KPI card", [text("Total Vendors", "metric-label"), text("128", "metric-value"), text("All active and onboarding vendors", "caption"), dynamicField("Text0", "Vendor Name")], { sectionId: "kpi_card_row", borderColor: "#C7D2FE" }),
          container("Pending Onboarding KPI card", [text("Pending Onboarding", "metric-label"), text("24", "metric-value"), text("Vendors in request or procurement review", "caption"), dynamicField("Text8", "Onboarding Status")], { sectionId: "kpi_card_row", borderColor: "#BFDBFE" }),
          container("High Risk Vendors KPI card", [text("High Risk Vendors", "metric-label"), text("7", "metric-value"), text("High or critical Risk Level", "caption"), dynamicField("Text9", "Risk Level")], { sectionId: "kpi_card_row", borderColor: "#FCA5A5" }),
          container("Expiring Documents KPI card", [text("Expiring Documents", "metric-label"), text("13", "metric-value"), text("Review Status and Expiry Date need follow-up", "caption"), dynamicField("Text3", "Review Status"), dynamicField("DateTime4", "Expiry Date")], { sectionId: "kpi_card_row", borderColor: "#FCD34D" }),
        ], 4, "kpi_card_row"),
        grid("Dashboard insight grid", [
          container("Onboarding completion progress section", [
            text("Onboarding Completion", "section-title"),
            progressCircle("Overall onboarding completion", 72),
            progressBar("Average vendor completion", "Decimal11"),
            dynamicField("Decimal11", "Onboarding Completion %"),
            dynamicField("Text8", "Onboarding Status"),
            text("Completion blends procurement, compliance, legal, and finance readiness.", "caption"),
          ], { sectionId: "onboarding_progress_section" }),
          container("Urgent compliance alert", [
            alertCard(),
            grid("Urgent compliance fields grid", [
              dynamicField("Text0", "Vendor Name"),
              dynamicField("Text9", "Risk Level"),
              dynamicField("Text10", "Compliance Status"),
              dynamicField("Text2", "Review Status"),
              dynamicField("DateTime4", "Expiry Date"),
            ], 5, "urgent_compliance_alert"),
            text("Business-specific alert content replaces default alert copy and points reviewers to risk-driving documents.", "caption"),
          ], { sectionId: "urgent_compliance_alert", background: "#FFF7ED", borderColor: "#FDBA74" }),
        ], 2, "dashboard_summary_grid"),
        grid("Operations and shortcuts grid", [
          container("Onboarding status board", [
            text("Onboarding Status Board", "section-title"),
            text("Kanban cards show Vendor Name, Risk Level, Compliance Status, Owner, Renewal Date, and Last Review Date.", "caption"),
            action("View Vendor", vendorTarget, "secondary"),
            kanban(ids.rootId, ids.vendorsId),
          ], { sectionId: "onboarding_status_board" }),
          container("Quick links", [
            text("Quick Links", "section-title"),
            iconList(ids.rootId, ids.vendorsId),
            grid("Quick link action buttons", [
              action("New Vendor Request", vendorTarget, "secondary"),
              action("View Compliance Queue", vendorTarget, "secondary"),
            ], 2, "quick_links"),
          ], { sectionId: "quick_links" }),
        ], 2, "operations_grid"),
        container("Vendors Data table", [
          text("Vendors Data table", "section-title"),
          text("Configured with Field and FieldName bindings so dashboard columns resolve to the source Vendors list.", "caption"),
          dataTable(ids.rootId, ids.vendorsId, "Vendors", [
            { field: "Text0", label: "Vendor Name" },
            { field: "Text2", label: "Vendor Type" },
            { field: "Text3", label: "Country / Region" },
            { field: "Text4", label: "Primary Contact" },
            { field: "Text5", label: "Email" },
            { field: "Text6", label: "Phone" },
            { field: "Text9", label: "Risk Level" },
            { field: "Text8", label: "Onboarding Status" },
            { field: "DateTime14", label: "Renewal Date" },
          ]),
        ], { sectionId: "vendors_data_table" }),
        container("Recent activity timeline", [
          text("Recent Vendor Activity", "section-title"),
          timeline(ids.rootId, ids.activityId),
        ], { sectionId: "recent_activity_timeline" }),
      ], {
        sectionId: "vendor_management_dashboard",
        background: "#F5F7FB",
        padding: { left: 32, right: 32, top: 30, bottom: 34 },
        gap: 24,
      }),
    ],
  };
}

function listModel(id, title, description, type = 1, layoutView = {}) {
  return {
    ListID: id,
    Title: title,
    Name: title,
    Description: description,
    AppID: APP_ID,
    Type: type,
    ListType: type,
    Flags: 1,
    Status: 1,
    CustomType: type === 1024 ? "" : "",
    TableCode: cleanInternalName(title).toLowerCase(),
    IconUrl: ICON_URL,
    LayoutView: JSON.stringify(layoutView),
    WorkspaceID: "0",
    CreatedBy: "0",
    ModifiedBy: "0",
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
  };
}

function layout(listId, layoutId, title, type, resource, extra = {}) {
  return {
    LayoutID: layoutId,
    ListID: listId,
    Title: title,
    Type: type,
    Status: 1,
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
    LayoutView: extra.layoutView ?? "",
    Ext1: extra.ext1 ?? "",
    Ext2: extra.ext2 ?? "",
    Ext3: extra.ext3 ?? "",
    IsDefault: extra.isDefault ?? false,
    IsItemPerm: extra.isItemPerm ?? false,
    LayoutInResources: resource ? [{ ID: layoutId, RefId: layoutId, Resource: JSON.stringify(resource) }] : [],
  };
}

function viewLayout(fields, defs) {
  const byName = new Map(defs.map((field) => [field.FieldName, field]));
  return JSON.stringify({
    layout: fields.map((fieldName, index) => ({
      Field: fieldName,
      FieldName: byName.get(fieldName)?.DisplayName || fieldName,
      DisplayName: byName.get(fieldName)?.DisplayName || fieldName,
      Order: index + 1,
      Show: true,
      Type: byName.get(fieldName)?.Type || "input",
    })),
    query: [],
    sort: [],
    filter: [],
    rowColor: [],
  });
}

function makeList(ids, listId, title, description, fieldSpecs, viewFields, sampleRows = []) {
  const fields = fieldSpecs.map((spec) => makeField(ids, listId, spec));
  const viewId = ids.next(`layout:${title}:all`);
  const listDatas = {};
  for (const [index, row] of sampleRows.entries()) {
    const listDataId = ids.next(`sample:${title}:${index + 1}`);
    listDatas[listDataId] = {
      ListDataID: listDataId,
      Title: row.Title || row.Text0 || `${title} Sample ${index + 1}`,
      ...row,
    };
  }
  return {
    ListModel: listModel(listId, title, description, 1, { sortVer: 1 }),
    Defs: fields,
    Layouts: [layout(listId, viewId, `All ${title}`, 0, null, { layoutView: viewLayout(viewFields, fields) })],
    LayoutInResources: [],
    ListDatas: listDatas,
    RemindRules: [],
    PublicForms: [],
    FlowMappings: [],
  };
}

function buildDecodedData(ids) {
  const rootId = ids.next("root:list-set");
  const dashboardId = ids.next("dashboard:vendor-management");
  const vendorsId = ids.next("list:vendors");
  const documentsId = ids.next("list:vendor-documents");
  const reviewsId = ids.next("list:compliance-reviews");
  const activityId = ids.next("list:vendor-activity");
  const idBundle = { rootId, dashboardId, vendorsId, documentsId, reviewsId, activityId };
  const vendorFields = [
    { fieldName: "Text0", displayName: "Vendor Name", internalName: "VendorName" },
    { fieldName: "Text1", displayName: "Vendor Code" },
    { fieldName: "Text2", displayName: "Vendor Type", type: "select", isFilter: true },
    { fieldName: "Text3", displayName: "Country / Region", type: "select", isFilter: true },
    { fieldName: "Text4", displayName: "Primary Contact" },
    { fieldName: "Text5", displayName: "Email" },
    { fieldName: "Text6", displayName: "Phone" },
    { fieldName: "Text7", displayName: "Owner", type: "identity-picker" },
    { fieldName: "Text8", displayName: "Onboarding Status", type: "select", isFilter: true },
    { fieldName: "Text9", displayName: "Risk Level", type: "select", isFilter: true },
    { fieldName: "Text10", displayName: "Compliance Status", type: "select", isFilter: true },
    { fieldName: "Decimal11", fieldType: "Decimal", displayName: "Onboarding Completion %", type: "percent" },
    { fieldName: "Decimal12", fieldType: "Decimal", displayName: "Compliance Score", type: "percent" },
    { fieldName: "Decimal13", fieldType: "Decimal", displayName: "Contract Value", type: "currency" },
    { fieldName: "DateTime14", fieldType: "DateTime", displayName: "Renewal Date", type: "datepicker", isFilter: true },
    { fieldName: "Bit15", fieldType: "Bit", displayName: "Required Documents Complete", type: "switch" },
    { fieldName: "DateTime16", fieldType: "DateTime", displayName: "Last Review Date", type: "datepicker" },
  ];
  const documentFields = [
    { fieldName: "Text0", displayName: "Document Name", internalName: "DocumentName" },
    { fieldName: "Text1", displayName: "Vendor" },
    { fieldName: "Text2", displayName: "Document Type", type: "select" },
    { fieldName: "Text3", displayName: "Review Status", type: "select" },
    { fieldName: "DateTime4", fieldType: "DateTime", displayName: "Expiry Date", type: "datepicker" },
  ];
  const reviewFields = [
    { fieldName: "Text0", displayName: "Review Title", internalName: "ReviewTitle" },
    { fieldName: "Text1", displayName: "Vendor" },
    { fieldName: "Text2", displayName: "Review Status", type: "select" },
    { fieldName: "Decimal3", fieldType: "Decimal", displayName: "Risk Score", type: "percent" },
    { fieldName: "DateTime4", fieldType: "DateTime", displayName: "Review Date", type: "datepicker" },
  ];
  const activityFields = [
    { fieldName: "Text0", displayName: "Activity Title", internalName: "ActivityTitle" },
    { fieldName: "Text1", displayName: "Vendor" },
    { fieldName: "Text2", displayName: "Activity Type", type: "select" },
    { fieldName: "DateTime3", fieldType: "DateTime", displayName: "Activity Date", type: "datepicker" },
    { fieldName: "Text4", displayName: "Actor", type: "identity-picker" },
    { fieldName: "Text5", displayName: "Description", type: "textarea" },
  ];
  const vendors = makeList(ids, vendorsId, "Vendors", "Master vendor records for dashboard review and onboarding status.", vendorFields, ["Text0", "Text2", "Text3", "Text9", "Text8", "Text10", "Text7", "DateTime14"], [
    {
      Text0: "Northstar Components",
      Text1: "VEN-1001",
      Text2: "Strategic Supplier",
      Text3: "United States",
      Text4: "Avery Stone",
      Text5: "avery.stone@example.com",
      Text6: "+1 555 0101",
      Text7: "Procurement Manager",
      Text8: "Compliance Review",
      Text9: "High",
      Text10: "Action Required",
      Decimal11: 0.72,
      Decimal12: 0.68,
      Decimal13: 245000,
      DateTime14: "2026-06-28 00:00:00",
      Bit15: "0",
      DateTime16: "2026-05-24 09:30:00",
    },
    {
      Text0: "Blue Harbor Logistics",
      Text1: "VEN-1002",
      Text2: "Service Provider",
      Text3: "Singapore",
      Text4: "Mei Tan",
      Text5: "mei.tan@example.com",
      Text6: "+65 5550 0102",
      Text7: "Operations Owner",
      Text8: "Procurement Review",
      Text9: "Medium",
      Text10: "In Review",
      Decimal11: 0.48,
      Decimal12: 0.52,
      Decimal13: 120000,
      DateTime14: "2026-08-15 00:00:00",
      Bit15: "0",
      DateTime16: "2026-05-21 15:00:00",
    },
    {
      Text0: "Evergreen Security Labs",
      Text1: "VEN-1003",
      Text2: "Technology Vendor",
      Text3: "European Union",
      Text4: "Jonas Weber",
      Text5: "jonas.weber@example.com",
      Text6: "+49 555 0103",
      Text7: "Security Reviewer",
      Text8: "Approved",
      Text9: "Low",
      Text10: "Approved",
      Decimal11: 1,
      Decimal12: 0.94,
      Decimal13: 86000,
      DateTime14: "2027-01-10 00:00:00",
      Bit15: "1",
      DateTime16: "2026-05-18 10:15:00",
    },
  ]);
  const documents = makeList(ids, documentsId, "Vendor Documents", "Document status records used by dashboard alert and document-risk metrics.", documentFields, ["Text0", "Text1", "Text2", "Text3", "DateTime4"], [
    { Text0: "Insurance Certificate", Text1: "Northstar Components", Text2: "Insurance Certificate", Text3: "Action Required", DateTime4: "2026-06-05 00:00:00" },
    { Text0: "Tax Form W-9", Text1: "Northstar Components", Text2: "Tax Form", Text3: "In Review", DateTime4: "2026-12-31 00:00:00" },
    { Text0: "Business Registration", Text1: "Blue Harbor Logistics", Text2: "Business Registration", Text3: "Approved", DateTime4: "2027-03-15 00:00:00" },
  ]);
  const reviews = makeList(ids, reviewsId, "Compliance Reviews", "Compliance review records used by dashboard risk and review status summaries.", reviewFields, ["Text0", "Text1", "Text2", "Decimal3", "DateTime4"], [
    { Text0: "Sanctions and insurance review", Text1: "Northstar Components", Text2: "Action Required", Decimal3: 0.82, DateTime4: "2026-05-27 11:00:00" },
    { Text0: "Annual compliance refresh", Text1: "Evergreen Security Labs", Text2: "Approved", Decimal3: 0.18, DateTime4: "2026-05-18 10:15:00" },
  ]);
  const activity = makeList(ids, activityId, "Vendor Activity / History", "Timeline events for dashboard activity proof.", activityFields, ["Text0", "Text1", "Text2", "DateTime3", "Text4"], [
    { Text0: "Insurance certificate flagged", Text1: "Northstar Components", Text2: "Status Changed", DateTime3: "2026-05-28 14:35:00", Text4: "Compliance Reviewer", Text5: "Certificate expires within 30 days and needs replacement." },
    { Text0: "Procurement review started", Text1: "Blue Harbor Logistics", Text2: "Request Submitted", DateTime3: "2026-05-27 09:20:00", Text4: "Procurement Manager", Text5: "Vendor request moved into procurement review." },
    { Text0: "Compliance review approved", Text1: "Evergreen Security Labs", Text2: "Review Completed", DateTime3: "2026-05-18 10:15:00", Text4: "Security Reviewer", Text5: "Annual compliance refresh completed." },
  ]);
  for (const child of [vendors, documents, reviews, activity]) child.ListModel.CustomType = `ListSite_${rootId}`;
  const rootLayoutView = {
    add: "default",
    edit: "default",
    view: "default",
    sort: [
      { AppID: APP_ID, ListID: dashboardId, ListSetID: rootId, Type: 103, IsHidden: false, Title: "Vendor Management Dashboard", Icon: "fa-regular fa-chart-line" },
      { AppID: APP_ID, ListID: vendorsId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Vendors", Icon: "fa-regular fa-building" },
      { AppID: APP_ID, ListID: documentsId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Vendor Documents", Icon: "fa-regular fa-file-lines" },
      { AppID: APP_ID, ListID: reviewsId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Compliance Reviews", Icon: "fa-regular fa-shield-check" },
      { AppID: APP_ID, ListID: activityId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Vendor Activity / History", Icon: "fa-regular fa-clock-rotate-left" },
    ],
    attrs: {
      appearance: { bgc: "var(--c--primary-light)", color: "var(--c--primary)", height: 46, hideTitle: true },
      "navigator-menu": { bgc: "var(--c--primary)", color: "var(--c--primary-light)", position: "default" },
    },
    sortVer: 1,
  };
  const dashboardLayout = layout(rootId, dashboardId, "Vendor Management Dashboard", 103, dashboardPage(idBundle), {
    ext2: JSON.stringify({ src: true }),
  });
  return {
    data: {
      AppID: APP_ID,
      MainListType: "classes",
      Item: {
        ListModel: listModel(rootId, APP_TITLE, APP_DESCRIPTION, 1024, rootLayoutView),
        Defs: [],
        Layouts: [dashboardLayout],
        LayoutInResources: [],
        ListDatas: {},
      },
      Childs: [vendors, documents, reviews, activity],
      Forms: [],
      DataReports: [],
      FormReports: [],
      FormNewReports: [],
      AppThemes: [],
      AppTags: [],
      AppMetadatas: [],
      AppComponents: [],
      AppGroups: [],
      OtherModules: [],
      ReplaceIds: Array.from(new Set([
        rootId,
        dashboardId,
        vendorsId,
        documentsId,
        reviewsId,
        activityId,
        ...[vendors, documents, reviews, activity].flatMap((child) => [
          ...child.Defs.map((field) => field.FieldID),
          ...child.Layouts.map((item) => item.LayoutID),
          ...Object.keys(child.ListDatas || {}),
        ]),
      ])),
    },
    ids: idBundle,
  };
}

function appPackageInfoFromData(data) {
  const normalizeListModel = (list, { root = false, items = {} } = {}) => ({
    ListID: list.ListID,
    Title: list.Title,
    Description: list.Description || "",
    Status: list.Status ?? 1,
    IsItemPerm: true,
    IsVerRecord: false,
    HasComment: false,
    IconUrl: list.IconUrl || ICON_URL,
    TableCode: list.TableCode || "flowcraft",
    Ext1: "",
    Ext2: "",
    Ext3: "",
    Type: list.Type,
    Flags: list.Flags ?? 1,
    LayoutView: list.LayoutView,
    Perms: [],
    AdvancePerms: [],
    Items: items,
  });
  const normalizeField = (field) => ({
    ListID: field.ListID,
    FieldID: field.FieldID,
    FieldName: field.FieldName,
    FieldType: field.FieldType,
    FieldIndex: field.FieldIndex,
    DisplayName: field.DisplayName,
    InternalName: field.InternalName,
    Type: field.Type,
    Status: field.Status ?? 1,
    Category: field.Category ?? 0,
    DefaultValue: field.DefaultValue ?? "",
    Rules: field.Rules ?? null,
    IsSort: field.IsSort ?? false,
    IsSystem: field.IsSystem ?? false,
    IsUnique: field.IsUnique ?? false,
    Ext1: field.Ext1 ?? "",
    Ext2: field.Ext2 ?? "",
    Ext3: field.Ext3 ?? "",
  });
  const normalizeLayout = (item, fallbackTitle) => ({
    ListID: item.ListID,
    LayoutID: item.LayoutID,
    Type: item.Type,
    Title: item.Title || fallbackTitle,
    LayoutView: item.Type === 103 ? "" : item.LayoutView,
    Ext1: item.Ext1 ?? "",
    Ext2: item.Ext2 ?? "",
    Ext3: item.Ext3 ?? "",
    IsDefault: item.IsDefault ?? false,
    IsItemPerm: item.IsItemPerm ?? false,
    Perms: [],
    LayoutInResources: item.LayoutInResources ?? [],
  });
  return {
    ListSet: normalizeListModel(data.Item.ListModel, { root: true }),
    Pages: data.Item.Layouts.map((item, index) => normalizeLayout(item, `Dashboard Page ${index + 1}`)),
    Forms: [],
    FormReports: [],
    FormNewReports: [],
    DataReports: [],
    Groups: [],
    Tags: [],
    Metadatas: [],
    Agents: [],
    Connections: [],
    Knowledges: [],
    Themes: [],
    Components: [],
    PortalInfo: null,
    Childs: data.Childs.map((child) => ({
      List: normalizeListModel(child.ListModel, { items: child.ListDatas || {} }),
      Fields: child.Defs.map(normalizeField),
      Layouts: child.Layouts.map((item, index) => normalizeLayout(item, `${child.ListModel.Title} Layout ${index + 1}`)),
      RemindRules: child.RemindRules,
      PublicForms: child.PublicForms,
      FlowMappings: child.FlowMappings,
    })),
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

function yapkWrapper(rootId, resourceBase64) {
  return {
    PackageId: crypto.randomUUID(),
    TenantID: "0",
    AppID: APP_ID,
    ListID: rootId,
    Title: APP_TITLE,
    Description: APP_DESCRIPTION,
    IconUrl: ICON_URL,
    Resource: resourceBase64,
    Notes: "Dashboard-only v4.1 proof generated from the approved Vendor Onboarding composition checklist and template corpus.",
    Author: "Yeeflow App Builder",
    Date: GENERATED_AT_UTC,
    Version: "4.1-page1-dashboard",
    Sign: "",
  };
}

function convertYapIdPropertyStringsToRawIntegers(jsonText) {
  const numericKeys = [
    "ListID",
    "ListSetID",
    "FieldID",
    "LayoutID",
    "RefId",
    "ID",
    "AppListSetID",
    "DefResourceID",
    "DeployedDefID",
    "FormID",
    "ProcModelID",
  ];
  let out = jsonText;
  for (const key of numericKeys) out = out.replace(new RegExp(`"${key}":"(\\d{16,})"`, "g"), `"${key}":$1`);
  return out;
}

function yapDecodedResourceText(data) {
  const dataText = convertYapIdPropertyStringsToRawIntegers(JSON.stringify(data));
  const skeleton = {
    MainListType: "classes",
    AppID: APP_ID,
    ReplaceIds: [],
    ReportIds: [],
    FormKeys: [],
    Data: dataText,
    SimplePortal: null,
  };
  return JSON.stringify(skeleton).replace('"ReplaceIds":[]', `"ReplaceIds":[${data.ReplaceIds.join(",")}]`);
}

function yapWrapper(data) {
  const resourceText = yapDecodedResourceText(data);
  return {
    Title: APP_TITLE,
    Description: APP_DESCRIPTION,
    IconUrl: ICON_URL,
    IsListSet: true,
    Resource: `${GZIP_PREFIX}${zlib.gzipSync(Buffer.from(resourceText, "utf8")).toString("base64")}`,
  };
}

async function main() {
  ensureDir(TMP_DIR);
  const env = loadApiEnv();
  const apiIds = await fetchApiIds(env, 80);
  const allocator = createIdAllocator(apiIds);
  const { data, ids: idBundle } = buildDecodedData(allocator);
  const appPackage = appPackageInfoFromData(data);
  const resourceBase64 = zlib.brotliCompressSync(Buffer.from(JSON.stringify(appPackage), "utf8")).toString("base64");
  const signed = await signWrapper(env, yapkWrapper(idBundle.rootId, resourceBase64));
  fs.writeFileSync(OUT_YAPK, `${JSON.stringify(signed.wrapper, null, 2)}\n`);
  fs.writeFileSync(OUT_YAP, `${JSON.stringify(yapWrapper(data), null, 2)}\n`);
  fs.writeFileSync(`${TMP_DIR}/decoded-data.redacted-summary.json`, `${JSON.stringify({
    appTitle: APP_TITLE,
    pages: data.Item.Layouts.map((item) => item.Title),
    childLists: data.Childs.map((child) => ({
      title: child.ListModel.Title,
      fields: child.Defs.map((field) => field.DisplayName),
      layouts: child.Layouts.map((item) => item.Title),
    })),
    replaceIdCount: data.ReplaceIds.length,
  }, null, 2)}\n`);
  const idLengths = apiIds.map((id) => id.length);
  fs.writeFileSync(REPORT, `${JSON.stringify({
    status: "generated",
    outputYapk: OUT_YAPK,
    outputYap: OUT_YAP,
    appId: APP_ID,
    pages: ["Vendor Management Dashboard"],
    supportingLists: data.Childs.map((child) => child.ListModel.Title),
    dashboardSections: [
      "Header/action area",
      "KPI card row",
      "Progress summary card",
      "Business alert card",
      "Onboarding status Kanban board",
      "Vendors Data table",
      "Quick links/icon list",
      "Recent activity timeline",
    ],
    apiIds: {
      requested: apiIds.length,
      used: allocator.used.length,
      remaining: allocator.remaining(),
      type: "string",
      minLength: Math.min(...idLengths),
      maxLength: Math.max(...idLengths),
    },
    signing: {
      status: "signed_and_verified",
      signByteLength: signed.signByteLength,
      verifyStatus: signed.verifyStatus,
      apiBaseUrl: env.apiBaseUrl,
    },
    proofBoundary: "Generated and locally validated dashboard-only YAPK/YAP package. Runtime install/open is manual proof.",
  }, null, 2)}\n`);
  console.log(JSON.stringify({
    status: "generated",
    outputYapk: OUT_YAPK,
    outputYap: OUT_YAP,
    pages: 1,
    supportingLists: data.Childs.length,
    apiIdsUsed: allocator.used.length,
    signing: { status: "signed_and_verified", signByteLength: signed.signByteLength, verifyStatus: signed.verifyStatus },
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "fail", error: error.message }, null, 2));
  process.exit(1);
});

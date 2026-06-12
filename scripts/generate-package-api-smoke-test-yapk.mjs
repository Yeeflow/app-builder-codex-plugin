#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import zlib from "node:zlib";
import { fetchYeeflowUniqueIds, loadYeeflowApiEnvironment } from "./yeeflow-id-api-utils.mjs";

const APP_ID = 41;
const APP_TITLE = "Package API Smoke Test";
const APP_DESCRIPTION = "Tiny disposable app used only to prove new-package YAPK generation and API installation.";
const OUT_YAPK = process.env.PACKAGE_API_SMOKE_TEST_YAPK || "/Users/Renger/Downloads/package-api-smoke-test.v1.yapk";
const GENERATED_AT = "2026-05-31 10:00:00";
const GENERATED_AT_UTC = "2026-05-31T02:00:00Z";
const ICON_URL = JSON.stringify({ b: "#E6F7FF", i: "fa-regular fa-vial-circle-check", c: "#0078FF" });

const requiredIdCount = 32;

function cleanInternalName(value) {
  return String(value).replace(/[^A-Za-z0-9_]/g, "") || `Field_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
}

function makeAllocator(ids) {
  const queue = [...ids];
  const used = [];
  return {
    next(label) {
      const id = queue.shift();
      if (!id) throw new Error(`No generated ID remains for ${label}.`);
      used.push({ label, id });
      return id;
    },
    usedCount() {
      return used.length;
    },
    remainingCount() {
      return queue.length;
    },
  };
}

function selectRules(values) {
  return JSON.stringify({
    choices: values.map((value, index) => ({
      Id: String(index + 1),
      Value: value,
      Text: value,
      Color: ["#2563EB", "#7C3AED", "#D97706", "#DC2626", "#0F766E", "#64748B"][index % 6],
    })),
  });
}

function nativeTitleField(ids, listId) {
  return {
    FieldID: ids.next("field:title"),
    ListID: listId,
    FieldName: "Title",
    FieldType: "Text",
    FieldIndex: 0,
    DisplayName: "Title",
    InternalName: "Title",
    Type: "input",
    Status: 1,
    Category: 0,
    DefaultValue: "",
    Rules: "{}",
    AppID: APP_ID,
    IsSort: true,
    IsIndex: true,
    IsFilter: true,
    IsIndexCreated: false,
    IsSystem: true,
    IsUnique: false,
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
    Ext1: "",
    Ext2: "",
    Ext3: "",
    Title: "Title",
  };
}

function field(ids, listId, spec) {
  const fieldName = spec.fieldName;
  const index = Number(String(fieldName).match(/(\d+)$/)?.[1] || 0);
  return {
    FieldID: ids.next(`field:${spec.displayName}`),
    ListID: listId,
    FieldName: fieldName,
    FieldType: spec.fieldType || "Text",
    FieldIndex: index,
    DisplayName: spec.displayName,
    InternalName: cleanInternalName(spec.internalName || spec.displayName),
    Type: spec.type || "input",
    Status: 1,
    Category: 0,
    DefaultValue: "",
    Rules: spec.rules || "{}",
    AppID: APP_ID,
    IsSort: Boolean(spec.isSort),
    IsIndex: Boolean(spec.isIndex),
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
    nv_label: extra.nvLabel || label,
    attrs,
    children,
  };
}

function text(label, value, role = "body", color = "#071638") {
  const ty = role === "page-title" ? "h2-bold" : role === "value" ? "h2-bold" : role === "section" ? "h4-bold" : "s-regular";
  return control("heading", label, {
    headc: { title: { value, variable: null } },
    heads: { ty: [null, ty], color },
  }, [], { nvLabel: label });
}

function container(label, children, options = {}) {
  return control("container", label, {
    displayLabel: [null, false],
    templateSectionId: options.sectionId || "",
    style: {
      direction: [null, options.direction || "column"],
      gap: [null, options.gap ?? 16],
      align_items: [null, options.align || "stretch"],
      justify_content: [null, options.justify || "flex-start"],
      wrap: options.wrap ?? true,
    },
    common: {
      padding: options.padding || { left: 24, right: 24, top: 20, bottom: 20 },
      background: { normal: { type: "classic", classic: { color: options.background || "#FFFFFF" } } },
      border: options.border === false ? undefined : {
        normal: {
          type: "1",
          width: { left: 1, right: 1, top: 1, bottom: 1 },
          color: options.borderColor || "#DDE5F2",
          radius: { left: 12, right: 12, top: 12, bottom: 12 },
        },
      },
    },
  }, children, { nvLabel: label });
}

function gridContainer(label, children, columns, sectionId) {
  return container(label, children, {
    sectionId,
    direction: "row",
    gap: 16,
    padding: { left: 0, right: 0, top: 0, bottom: 0 },
    border: false,
    background: "transparent",
    wrap: true,
  });
}

function listRef(rootId, listId, title) {
  return { AppID: APP_ID, ListID: listId, ListSetID: rootId, Type: 1, Title: title };
}

function dataTable(rootId, listId) {
  const columns = [
    ["Title", "Title"],
    ["Text1", "Request Type"],
    ["Text2", "Priority"],
    ["Text3", "Status"],
    ["Text4", "Owner"],
    ["Datetime5", "Due Date"],
  ];
  return control("data-list", "API Smoke Requests data table", {
    data: { list: listRef(rootId, listId, "API Smoke Requests") },
    listarr: columns.map(([Field, FieldName], index) => ({ Field, FieldName, DisplayName: FieldName, Order: index + 1, Show: true })),
    table: { density: "comfortable", striped: true, bordered: false },
  }, [], { nvLabel: "API Smoke Requests data table" });
}

function alertControl() {
  return control("alert", "Package API smoke test alert", {
    title: "Generated package installed through API",
    description: "Use this disposable app to confirm YAPK upload, install, dashboard rendering, and list add/save behavior.",
    type: "info",
  }, [], { nvLabel: "Package API smoke test alert" });
}

function dashboardPage(rootId, listId) {
  return {
    title: "API Smoke Dashboard",
    ver: "2.0",
    filterVars: [],
    tempVars: [],
    attrs: {
      hideHeaderAll: true,
      common: { padding: { left: 0, right: 0, top: 0, bottom: 0 } },
      contentWidth: "full",
    },
    children: [
      container("Main", [
        container("Content", [
          container("Header card", [
            container("Header text and action row", [
              container("Header text", [
                text("Dashboard title", "Package API Smoke Test", "page-title"),
                text("Dashboard description", "Disposable app for proving generated YAPK upload and install automation.", "body", "#5B6472"),
              ], { border: false, padding: { left: 0, right: 0, top: 0, bottom: 0 }, background: "transparent" }),
            ], { direction: "row", justify: "space-between", align: "center", border: false, padding: { left: 0, right: 0, top: 0, bottom: 0 }, background: "transparent" }),
          ], { sectionId: "header_card", padding: { left: 32, right: 32, top: 30, bottom: 30 } }),
          gridContainer("KPI card row", [
            container("Total smoke requests KPI card", [
              text("Total requests label", "Total Requests", "label"),
              text("Total requests value", "3", "value"),
              text("Total requests caption", "Seed rows included for display proof.", "body", "#5B6472"),
            ], { sectionId: "kpi_card_row", borderColor: "#BFDBFE" }),
            container("High priority KPI card", [
              text("High priority label", "High Priority", "label"),
              text("High priority value", "1", "value"),
              text("High priority caption", "Records needing immediate review.", "body", "#5B6472"),
            ], { sectionId: "kpi_card_row", borderColor: "#FCA5A5" }),
            container("Open requests KPI card", [
              text("Open requests label", "Open Requests", "label"),
              text("Open requests value", "2", "value"),
              text("Open requests caption", "Waiting for manual verification.", "body", "#5B6472"),
            ], { sectionId: "kpi_card_row", borderColor: "#FCD34D" }),
          ], 3, "kpi_card_row"),
          container("Business alert section", [alertControl()], { sectionId: "business_alert_card", background: "#EFF6FF", borderColor: "#BFDBFE" }),
          container("API Smoke Requests table section", [
            text("Data table section title", "API Smoke Requests", "section"),
            text("Data table section caption", "Columns include Field and FieldName bindings against the packaged data list.", "body", "#5B6472"),
            dataTable(rootId, listId),
          ], { sectionId: "data_table_section" }),
        ], { sectionId: "content", background: "#F5F7FB", padding: { left: 32, right: 32, top: 30, bottom: 34 }, gap: 24, border: false }),
      ], { sectionId: "main", background: "#F5F7FB", padding: { left: 0, right: 0, top: 0, bottom: 0 }, gap: 0, border: false }),
    ],
  };
}

function listModel(id, title, description, type = 1, layoutView = null) {
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
    CustomType: "",
    TableCode: cleanInternalName(title).toLowerCase(),
    IconUrl: ICON_URL,
    LayoutView: layoutView,
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
  const byName = new Map(defs.map((item) => [item.FieldName, item]));
  return JSON.stringify({
    layout: fields.map((Field, index) => ({
      Field,
      FieldName: byName.get(Field)?.DisplayName || Field,
      DisplayName: byName.get(Field)?.DisplayName || Field,
      Order: index + 1,
      Show: true,
      Type: byName.get(Field)?.Type || "input",
    })),
    query: ["Title", "ListDataID", "CreatedBy", "ModifiedBy", "Created", "Modified"].map((Field) => ({ Field, FieldName: Field, Show: true })),
    sort: [{ SortName: "Title", SortByDesc: false }],
    filter: [],
    rowColor: [],
  });
}

function formResource(title, fields) {
  return {
    title,
    children: [
      container(`${title} form main`, [
        container(`${title} fields card`, fields.map((fieldName) => control("dynamic-field", `${fieldName} field`, {
          source: "1",
          "obj-f": fieldName,
          fieldLabel: fieldName,
        }, [], { nvLabel: `${fieldName} field` })), { sectionId: "form_fields_card" }),
      ], { sectionId: "form_main", padding: { left: 24, right: 24, top: 24, bottom: 24 } }),
    ],
  };
}

function makeDataList(ids, rootId, listId) {
  const fields = [
    nativeTitleField(ids, listId),
    field(ids, listId, { fieldName: "Text1", displayName: "Request Type", type: "select", isFilter: true, rules: selectRules(["Import", "Install", "Upgrade", "Validation"]) }),
    field(ids, listId, { fieldName: "Text2", displayName: "Priority", type: "select", isFilter: true, rules: selectRules(["Low", "Medium", "High"]) }),
    field(ids, listId, { fieldName: "Text3", displayName: "Status", type: "select", isFilter: true, rules: selectRules(["Open", "In Progress", "Completed", "Blocked"]) }),
    field(ids, listId, { fieldName: "Text4", displayName: "Owner", type: "input" }),
    field(ids, listId, { fieldName: "Datetime5", fieldType: "Datetime", displayName: "Due Date", type: "datepicker", isFilter: true }),
    field(ids, listId, { fieldName: "Text6", displayName: "Notes", type: "textarea" }),
  ];
  const viewId = ids.next("layout:api-smoke-requests:view");
  const addId = ids.next("layout:api-smoke-requests:add");
  const editId = ids.next("layout:api-smoke-requests:edit");
  const viewFormId = ids.next("layout:api-smoke-requests:view-form");
  const rowIds = [ids.next("sample:api-smoke-request:1"), ids.next("sample:api-smoke-request:2"), ids.next("sample:api-smoke-request:3")];
  const formFields = ["Title", "Text1", "Text2", "Text3", "Text4", "Datetime5", "Text6"];
  const listDatas = {
    [rowIds[0]]: { ListDataID: rowIds[0], Title: "Generated YAPK local validation", Text1: "Validation", Text2: "High", Text3: "Completed", Text4: "Codex", Datetime5: "2026-06-03 00:00:00", Text6: "Local validators passed before upload." },
    [rowIds[1]]: { ListDataID: rowIds[1], Title: "Upload package through API", Text1: "Install", Text2: "Medium", Text3: "In Progress", Text4: "Codex", Datetime5: "2026-06-04 00:00:00", Text6: "Upload metadata should stay redacted." },
    [rowIds[2]]: { ListDataID: rowIds[2], Title: "Manual dashboard verification", Text1: "Validation", Text2: "Low", Text3: "Open", Text4: "Tester", Datetime5: "2026-06-05 00:00:00", Text6: "Open the dashboard and confirm table columns render." },
  };
  return {
    ListModel: {
      ...listModel(listId, "API Smoke Requests", "Disposable request records used by the package API smoke app.", 1, JSON.stringify({ add: addId, edit: editId, view: viewFormId })),
      CustomType: `ListSite_${rootId}`,
      Items: listDatas,
    },
    Defs: fields,
    Layouts: [
      layout(listId, viewId, "All API Smoke Requests", 0, null, { isDefault: true, layoutView: viewLayout(formFields, fields) }),
      layout(listId, addId, "New API Smoke Request", 1, formResource("New API Smoke Request", formFields)),
      layout(listId, editId, "Edit API Smoke Request", 1, formResource("Edit API Smoke Request", formFields)),
      layout(listId, viewFormId, "View API Smoke Request", 1, formResource("View API Smoke Request", formFields)),
    ],
    LayoutInResources: [],
    ListDatas: listDatas,
    RemindRules: [],
    PublicForms: [],
    FlowMappings: [],
  };
}

function appPackageInfo(ids) {
  const rootId = ids.next("root:list-set");
  const dashboardId = ids.next("dashboard:api-smoke");
  const listId = ids.next("list:api-smoke-requests");
  const dataList = makeDataList(ids, rootId, listId);
  const nav = [
    { AppID: APP_ID, ListID: dashboardId, ListSetID: rootId, Type: 103, IsHidden: false, Title: "API Smoke Dashboard", Icon: "fa-regular fa-chart-simple" },
    { AppID: APP_ID, ListID: listId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "API Smoke Requests", Icon: "fa-regular fa-list-check" },
  ];
  const listSet = listModel(rootId, APP_TITLE, APP_DESCRIPTION, 1024, JSON.stringify({
    sort: nav,
    attrs: {
      appearance: { bgc: "var(--c--primary-light)", color: "var(--c--primary)", height: 46, hideTitle: true },
      "navigator-menu": { bgc: "var(--c--primary)", color: "var(--c--primary-light)", position: "default" },
    },
    sortVer: 1,
  }));
  return {
    app: {
      ListSet: listSet,
      Pages: [layout(rootId, dashboardId, "API Smoke Dashboard", 103, dashboardPage(rootId, listId), { ext2: JSON.stringify({ src: true }) })],
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
      Childs: [{
        List: dataList.ListModel,
        Fields: dataList.Defs,
        Layouts: dataList.Layouts,
        RemindRules: dataList.RemindRules,
        PublicForms: dataList.PublicForms,
        FlowMappings: dataList.FlowMappings,
      }],
    },
    ids: { rootId, dashboardId, listId },
  };
}

function wrapper(rootId, resource) {
  return {
    PackageId: crypto.randomUUID(),
    TenantID: "0",
    AppID: APP_ID,
    ListID: rootId,
    Title: APP_TITLE,
    Description: APP_DESCRIPTION,
    IconUrl: ICON_URL,
    Resource: resource,
    Notes: "Generated disposable v1 package for package API upload/install automation smoke testing.",
    Author: "Yeeflow App Builder",
    Date: GENERATED_AT_UTC,
    Version: "1.0.0",
    Sign: "",
  };
}

function postJsonWithCurl(url, authHeaders, body) {
  const headerArgs = Object.entries(authHeaders || {}).flatMap(([name, value]) => ["--header", `${name}: ${value}`]);
  const stdout = execFileSync("curl", [
    "--silent",
    "--show-error",
    "--max-time",
    "30",
    "--request",
    "POST",
    ...headerArgs,
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

function parseApiJson(text, label) {
  try {
    return JSON.parse(text || "{}");
  } catch {
    throw new Error(`${label} response was not parseable JSON.`);
  }
}

async function signWrapper(env, unsignedWrapper) {
  const signingWrapper = env.tenantId ? { ...unsignedWrapper, TenantID: env.tenantId } : unsignedWrapper;
  const unsigned = { ...signingWrapper };
  delete unsigned.Sign;
  const signResult = postJsonWithCurl(`${env.apiBaseUrl}/utils/apppackage/setsign`, env.authHeaders, unsigned);
  if (signResult.status < 200 || signResult.status > 299) throw new Error(`setsign failed with HTTP ${signResult.status}.`);
  const signJson = parseApiJson(signResult.body, "setsign");
  const sign = signJson?.Data ?? signJson?.data ?? signJson?.Sign ?? signJson?.sign ?? (typeof signJson === "string" ? signJson : null);
  if (typeof sign !== "string" || Buffer.from(sign, "base64").length !== 32) throw new Error("setsign did not return a 32-byte signature.");
  const signed = { ...signingWrapper, Sign: sign };
  const verifyResult = postJsonWithCurl(`${env.apiBaseUrl}/utils/apppackage/verifysign`, env.authHeaders, signed);
  if (verifyResult.status < 200 || verifyResult.status > 299) throw new Error(`verifysign failed with HTTP ${verifyResult.status}.`);
  return signed;
}

async function main() {
  const env = await loadYeeflowApiEnvironment();
  const ids = makeAllocator(await fetchYeeflowUniqueIds({ apiBaseUrl: env.apiBaseUrl, authHeaders: env.authHeaders, count: requiredIdCount }));
  const { app, ids: appIds } = appPackageInfo(ids);
  const resource = zlib.brotliCompressSync(Buffer.from(JSON.stringify(app), "utf8")).toString("base64");
  const signed = await signWrapper(env, wrapper(appIds.rootId, resource));
  fs.writeFileSync(OUT_YAPK, `${JSON.stringify(signed, null, 2)}\n`);
  console.log(JSON.stringify({
    output: OUT_YAPK,
    appTitle: APP_TITLE,
    generatedIdsUsed: ids.usedCount(),
    generatedIdsRemaining: ids.remainingCount(),
    wrapper: "signed",
    portalInfo: "null",
    resource: "brotli-app-package-info",
  }, null, 2));
}

main().catch((error) => {
  console.error(`generate-package-api-smoke-test-yapk failed: ${error.message}`);
  process.exit(1);
});

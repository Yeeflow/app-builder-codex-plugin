import fs from "node:fs";
import { execFileSync } from "node:child_process";

const SOURCE_RESOURCE = "custom-code-smart-lookup-picker-test.resource.json";
const GENERATED_AT = "2026-05-22 10:00:00";
const TITLE_PREFIX = "Application Settings Runtime Baseline";
const SOURCE_ID_BASE = 6081000000000000000n;
const VARIANTS = [
  { key: "default", position: "default", base: 7241000000000000000n },
  { key: "left", position: "left", base: 7242000000000000000n },
  { key: "onheader", position: "onheader", base: 7243000000000000000n },
  { key: "none", position: "none", base: 7244000000000000000n },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseJson(value, fallback = {}) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function replaceSourceIds(value, freshBase) {
  if (typeof value === "string") {
    return value.replace(/\b608100\d{9,}\b/g, (match) => {
      const oldId = BigInt(match);
      return String(freshBase + (oldId - SOURCE_ID_BASE));
    });
  }
  if (Array.isArray(value)) return value.map((item) => replaceSourceIds(item, freshBase));
  if (!value || typeof value !== "object") return value;
  const out = {};
  for (const [key, child] of Object.entries(value)) out[replaceSourceIds(key, freshBase)] = replaceSourceIds(child, freshBase);
  return out;
}

function remapListClone(value, fromBase, toBase) {
  if (typeof value === "string") {
    const prefix = String(fromBase).slice(0, 4);
    const re = new RegExp(`\\b${prefix}\\d{15,}\\b`, "g");
    return value.replace(re, (match) => {
      const oldId = BigInt(match);
      return String(toBase + (oldId - fromBase));
    });
  }
  if (Array.isArray(value)) return value.map((item) => remapListClone(item, fromBase, toBase));
  if (!value || typeof value !== "object") return value;
  const out = {};
  for (const [key, child] of Object.entries(value)) out[remapListClone(key, fromBase, toBase)] = remapListClone(child, fromBase, toBase);
  return out;
}

function collectGeneratedIds(value, familyPrefixes, ids = new Set()) {
  if (typeof value === "string") {
    for (const prefix of familyPrefixes) {
      const re = new RegExp(`\\b${prefix}\\d{15,}\\b`, "g");
      for (const match of value.matchAll(re)) ids.add(match[0]);
    }
    return ids;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectGeneratedIds(item, familyPrefixes, ids));
    return ids;
  }
  if (!value || typeof value !== "object") return ids;
  Object.entries(value).forEach(([key, child]) => {
    collectGeneratedIds(key, familyPrefixes, ids);
    collectGeneratedIds(child, familyPrefixes, ids);
  });
  return ids;
}

function textPageResource(title, body) {
  return JSON.stringify({
    children: [
      {
        id: "application-settings-runtime-main",
        type: "container",
        label: "Container",
        attrs: {
          style: {
            gap: [null, "--sp--s4"],
            direction: [null, "column"],
            justify_content: [null, "flex-start"],
            align_items: [null, "stretch"],
          },
          container: { cw: "2" },
          common: { padding: { t: [null, "--sp--s4"], r: [null, "--sp--s4"], b: [null, "--sp--s4"], l: [null, "--sp--s4"] } },
        },
        children: [
          {
            id: "application-settings-runtime-title",
            type: "heading",
            label: "Text",
            attrs: {
              headc: { title: { value: title, variable: null } },
              heads: { ty: [null, "xl-semibold"], color: "var(--c--text)" },
              common: { positioning: { widthtype: [null, "2"] } },
            },
            children: [],
            nv_label: "Page title",
          },
          {
            id: "application-settings-runtime-body",
            type: "heading",
            label: "Text",
            attrs: {
              headc: { title: { value: body, variable: null } },
              heads: { ty: [null, "s-regular"], color: "var(--c--neutral-dark-hover)" },
              common: { positioning: { widthtype: [null, "2"] } },
            },
            children: [],
            nv_label: "Runtime note",
          },
        ],
        nv_label: "Main",
      },
    ],
    attrs: {
      hideHeaderAll: true,
      common: { padding: { t: [null, "--sp--s0"], r: [null, "--sp--s0"], b: [null, "--sp--s0"], l: [null, "--sp--s0"] } },
    },
    title,
    filterVars: [],
    tempVars: [],
    ver: "2.0",
  });
}

function stripCodeInControls(node) {
  if (Array.isArray(node)) return node.map(stripCodeInControls);
  if (!node || typeof node !== "object") return node;
  if (node.type === "codein") {
    return {
      id: node.id || "application-settings-runtime-code-removed",
      type: "heading",
      label: "Text",
      attrs: {
        headc: { title: { value: "Custom code is intentionally omitted from this application settings runtime baseline.", variable: null } },
        heads: { ty: [null, "s-regular"], color: "var(--c--neutral-dark-hover)" },
        common: { positioning: { widthtype: [null, "2"] } },
      },
      children: [],
      nv_label: "Omitted custom code note",
    };
  }
  const out = {};
  for (const [key, child] of Object.entries(node)) out[key] = stripCodeInControls(child);
  return out;
}

function resetList(list, { listId, rootId, title, description, records }) {
  list.ListModel.ListID = listId;
  list.ListModel.Title = title;
  list.ListModel.Description = description;
  list.ListModel.CustomType = `ListSite_${rootId}`;
  list.ListModel.Created = GENERATED_AT;
  list.ListModel.Modified = GENERATED_AT;
  const view = parseJson(list.ListModel.LayoutView, {});
  list.ListModel.LayoutView = JSON.stringify({ ...view, sort: [{ SortName: "Created", SortByDesc: true }] });

  const displayNames = new Map([
    ["Title", title === "Service Requests" ? "Request Title" : "Article Title"],
    ["Text1", "Summary"],
    ["Text2", "Status"],
    ["Bit1", "Active"],
    ["Decimal1", "Priority Score"],
    ["Datetime1", title === "Service Requests" ? "Requested Date" : "Published Date"],
  ]);
  list.Defs = (list.Defs || []).map((field) => ({
    ...field,
    ListID: listId,
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
    ...(displayNames.has(field.FieldName) ? { DisplayName: displayNames.get(field.FieldName), Title: displayNames.get(field.FieldName) } : {}),
  }));
  for (const layout of list.Layouts || []) {
    layout.ListID = listId;
    layout.Created = GENERATED_AT;
    layout.Modified = GENERATED_AT;
    for (const layoutResource of layout.LayoutInResources || []) {
      const parsed = parseJson(layoutResource.Resource, null);
      if (parsed) layoutResource.Resource = JSON.stringify(stripCodeInControls(parsed));
    }
  }
  list.ListDatas = records;
}

function buildVariant(sourceResource, variant) {
  const title = `${TITLE_PREFIX} - ${variant.key}`;
  const description = `Focused runtime baseline for application settings navigation/header/user groups using ${variant.position} navigation layout.`;
  const resource = replaceSourceIds(clone(sourceResource), variant.base);
  const data = JSON.parse(resource.Data);
  const rootId = String(variant.base);
  const dashboardId = String(variant.base + 1n);
  const serviceListId = String(variant.base + 2n);
  const knowledgeFamily = variant.base + 1000n;
  const knowledgeListId = String(knowledgeFamily + 2n);
  const supportGroupId = String(variant.base + 9001n);
  const operationsGroupId = String(variant.base + 9002n);
  const navGroupId = String(variant.base + 9101n);

  const root = data.Item.ListModel;
  root.ListID = rootId;
  root.Title = title;
  root.Description = description;
  root.IconUrl = "{\"b\":\"#E6F0FF\",\"i\":\"fa-regular fa-sliders\",\"c\":\"#0065FF\"}";
  root.Created = GENERATED_AT;
  root.Modified = GENERATED_AT;
  root.CustomType = "";

  const dashboard = data.Item.Layouts[0];
  dashboard.LayoutID = dashboardId;
  dashboard.ListID = rootId;
  dashboard.Title = "Operations Overview";
  dashboard.LayoutView = null;
  dashboard.Created = GENERATED_AT;
  dashboard.Modified = GENERATED_AT;
  dashboard.LayoutInResources = [
    {
      ID: dashboardId,
      RefId: dashboardId,
      Resource: textPageResource(
        "Operations Overview",
        "Use this page to confirm dashboard navigation, resource-title fallback, and grouped child navigation in the generated application shell.",
      ),
    },
  ];
  data.Item.Layouts = [dashboard];
  data.Item.LayoutInResources = [];

  const serviceList = data.Childs[0];
  const knowledgeList = remapListClone(clone(serviceList), variant.base, knowledgeFamily);
  resetList(serviceList, {
    listId: serviceListId,
    rootId,
    title: "Service Requests",
    description: "Minimal service request records for application settings navigation testing.",
    records: {
      [String(variant.base + 20001n)]: {
        ListDataID: String(variant.base + 20001n),
        Title: "Air conditioning service request",
        Text1: "Sample request used to confirm the Service Requests list opens.",
        Text2: "Open",
        Bit1: true,
        Decimal1: 3,
        Datetime1: "2026-05-22",
      },
      [String(variant.base + 20002n)]: {
        ListDataID: String(variant.base + 20002n),
        Title: "Access card replacement",
        Text1: "Second safe sample request.",
        Text2: "New",
        Bit1: true,
        Decimal1: 2,
        Datetime1: "2026-05-23",
      },
    },
  });
  resetList(knowledgeList, {
    listId: knowledgeListId,
    rootId,
    title: "Knowledge Articles",
    description: "Minimal knowledge article records for grouped navigation testing.",
    records: {
      [String(knowledgeFamily + 20001n)]: {
        ListDataID: String(knowledgeFamily + 20001n),
        Title: "How to submit a service request",
        Text1: "Safe placeholder knowledge article.",
        Text2: "Published",
        Bit1: true,
        Decimal1: 1,
        Datetime1: "2026-05-22",
      },
    },
  });
  data.Childs = [serviceList, knowledgeList];
  data.Forms = [];
  data.OtherModules = [];
  data.FormReports = [];
  data.DataReports = [];
  data.FormNewReports = [];
  data.AppGroups = [
    { ID: supportGroupId, Name: "Support Team", Description: "Placeholder app group for runtime testing. No members are generated." },
    { ID: operationsGroupId, Name: "Operations Managers", Description: "Placeholder app group for runtime testing. No members are generated." },
  ];

  root.LayoutView = JSON.stringify({
    add: "default",
    edit: "default",
    view: "default",
    sort: [
      {
        AppID: 41,
        ListID: serviceListId,
        ListSetID: rootId,
        Type: 1,
        IsHidden: false,
        Title: "Service Requests",
        Icon: "fa-regular fa-list-check",
        DisplayName: "Requests",
      },
      {
        AppID: 41,
        ListID: dashboardId,
        ListSetID: rootId,
        Type: 103,
        IsHidden: false,
        Title: "Operations Overview",
        Icon: "",
      },
      {
        ID: navGroupId,
        AppID: 41,
        ListSetID: rootId,
        Type: "classes",
        Title: "Operations Tools",
        Icon: "fa-regular fa-layer-plus",
        list: [
          {
            AppID: 41,
            ListID: knowledgeListId,
            ListSetID: rootId,
            Type: 1,
            IsHidden: false,
            Title: "Knowledge Articles",
            Icon: "fa-regular fa-book-open",
          },
          {
            AppID: 41,
            ListID: dashboardId,
            ListSetID: rootId,
            Type: 103,
            IsHidden: false,
            Title: "Operations Overview",
            Icon: "",
            DisplayName: "Overview Child",
          },
        ],
      },
      {
        AppID: 41,
        ListID: knowledgeListId,
        ListSetID: rootId,
        Type: 1,
        IsHidden: true,
        Title: "Knowledge Articles",
        Icon: "fa-regular fa-book-open",
      },
    ],
    attrs: {
      appearance: {
        bgc: "var(--c--primary-light)",
        color: "var(--c--primary)",
        height: 46,
        hideTitle: true,
      },
      "navigator-menu": {
        bgc: "var(--c--primary)",
        color: "var(--c--primary-light)",
        position: variant.position,
      },
      CustomColors: [],
      CustomFonts: [],
    },
    sortVer: 1,
  });

  resource.MainListType = 1024;
  resource.AppID = 41;
  resource.Title = title;
  resource.Description = description;
  resource.IconUrl = root.IconUrl;
  resource.FormKeys = [];
  resource.ReportIds = [];
  resource.SimplePortal = null;
  resource.Data = JSON.stringify(data);
  const familyPrefixes = [String(variant.base).slice(0, 4), String(knowledgeFamily).slice(0, 4)];
  resource.ReplaceIds = [...collectGeneratedIds(resource, familyPrefixes)].sort();

  const stem = `application-settings-navigation-${variant.key}.v1`;
  const resourcePath = `${stem}.resource.json`;
  const appDefPath = `${stem}.app-def.json`;
  const yapPath = `${stem}.yap`;
  const reportPath = `${stem}.generation-report.json`;
  fs.writeFileSync(appDefPath, `${JSON.stringify(data, null, 2)}\n`);
  fs.writeFileSync(resourcePath, `${JSON.stringify(resource, null, 2)}\n`);
  const build = JSON.parse(execFileSync("node", [
    "build-yap-wrapper.js",
    resourcePath,
    yapPath,
    "--title",
    title,
    "--description",
    description,
  ], { encoding: "utf8" }));
  const generationReport = {
    status: "generated",
    title,
    variant: variant.key,
    position: variant.position,
    outputs: { appDefPath, resourcePath, yapPath },
    rootId,
    dashboardId,
    serviceListId,
    knowledgeListId,
    appGroups: data.AppGroups,
    navigation: JSON.parse(root.LayoutView).sort,
    replaceIds: resource.ReplaceIds,
    build,
  };
  fs.writeFileSync(reportPath, `${JSON.stringify(generationReport, null, 2)}\n`);
  return generationReport;
}

const sourceResource = JSON.parse(fs.readFileSync(SOURCE_RESOURCE, "utf8"));
const reports = VARIANTS.map((variant) => buildVariant(sourceResource, variant));
console.log(JSON.stringify({
  status: "pass",
  generated: reports.map((report) => ({
    variant: report.variant,
    yap: report.outputs.yapPath,
    position: report.position,
    rootId: report.rootId,
    appGroups: report.appGroups.map((group) => group.Name),
  })),
}, null, 2));

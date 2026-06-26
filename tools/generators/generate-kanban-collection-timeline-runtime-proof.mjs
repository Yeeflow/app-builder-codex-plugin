import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";

const GZIP_PREFIX = "[______gizp______]";
const SOURCE_RESOURCE = "custom-code-smart-lookup-picker-test.resource.json";
const OUT_PACKAGE = "kanban-collection-timeline-runtime-proof.v1.yap";
const OUT_RESOURCE = ".tmp/kanban-collection-timeline-runtime-proof.v1.resource.json";
const OUT_DATA = ".tmp/kanban-collection-timeline-runtime-proof.v1.app-def.json";
const OUT_REPORT = ".tmp/kanban-collection-timeline-runtime-proof.v1.generation-report.json";
const DOWNLOADS_COPY = "/Users/Renger/Downloads/kanban-collection-timeline-runtime-proof.v1.yap";

const APP_TITLE = "Kanban Collection Timeline Runtime Proof";
const APP_DESCRIPTION = "Focused generated package for runtime testing Kanban, Collection, Vertical Timeline, Horizontal Timeline, and Dynamic controls.";
const DASHBOARD_TITLE = "Dynamic Controls Runtime Dashboard";
const LIST_TITLE = "Dynamic Control Runtime Items";
const GENERATED_AT = "2026-05-28 10:30:00";
const APP_ID = 41;
const FAMILY = 7463000000000000000n;
const ROOT_ID = String(FAMILY);
const DASHBOARD_ID = String(FAMILY + 1n);
const LIST_ID = String(FAMILY + 1000n);
const VIEW_LAYOUT_ID = String(FAMILY + 1100n);
const EDIT_LAYOUT_ID = String(FAMILY + 1101n);
const VIEW_RESOURCE_ID = VIEW_LAYOUT_ID;
const EDIT_RESOURCE_ID = EDIT_LAYOUT_ID;

let idOffset = 2000n;

function nextId() {
  idOffset += 1n;
  return String(FAMILY + idOffset);
}

function uuid() {
  return crypto.randomUUID();
}

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

function sanitizeInternalName(value) {
  const cleaned = value.replace(/[^A-Za-z0-9_]/g, "");
  return cleaned || `Field_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
}

function makeField(template, spec, fieldId = nextId()) {
  return {
    ...template,
    FieldID: fieldId,
    ListID: LIST_ID,
    FieldName: spec.fieldName,
    FieldType: spec.fieldType,
    FieldIndex: spec.fieldIndex,
    DisplayName: spec.displayName,
    InternalName: sanitizeInternalName(spec.internalName || spec.displayName),
    DisplayName_EN: null,
    Type: spec.type,
    Status: spec.status ?? (spec.fieldName === "Title" ? 0 : 1),
    Category: 0,
    DefaultValue: spec.defaultValue ?? null,
    Rules: JSON.stringify(spec.rules || {}),
    AppID: APP_ID,
    IsSort: spec.isSort ?? spec.fieldName === "Title",
    IsIndex: spec.isIndex ?? spec.fieldName === "Title",
    IsFilter: spec.isFilter ?? false,
    IsIndexCreated: false,
    IsSystem: spec.isSystem ?? spec.fieldName === "Title",
    IsUnique: false,
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
    Ext1: null,
    Ext2: null,
    Ext3: null,
    Title: spec.displayName,
  };
}

function control(type, label, attrs = {}, children = [], extra = {}) {
  return {
    id: uuid(),
    type,
    label,
    attrs,
    children,
    ...extra,
  };
}

function heading(value, style = "h4-bold", extra = {}) {
  return control("heading", "Text", {
    headc: { title: { value, variable: null } },
    heads: { ty: [null, style], color: "var(--c--text)" },
  }, [], extra);
}

function paragraph(value, extra = {}) {
  return control("heading", "Text", {
    headc: { title: { value, variable: null } },
    heads: { ty: [null, "s-regular"], color: "var(--c--neutral-dark-hover)" },
  }, [], extra);
}

function section(title, children) {
  return control("container", "Container", {
    style: { gap: [null, "--sp--s250"], direction: [null, "column"], align_items: [null, "stretch"] },
    common: {
      padding: [null, { top: "--sp--s400", right: "--sp--s400", bottom: "--sp--s400", left: "--sp--s400" }],
      background: { normal: { type: "classic", classic: { color: "#ffffff" } } },
      border: {
        normal: {
          type: "1",
          width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
          color: "var(--c--neutral-light-active)",
          radius: [null, { top: "--sp--s300", right: "--sp--s300", bottom: "--sp--s300", left: "--sp--s300" }],
        },
      },
    },
  }, [heading(title, "h5-bold"), ...children], { nv_label: `${title} section` });
}

function dynamicField(fieldName, extraAttrs = {}, extra = {}) {
  return control("dynamic-field", "Dynamic field", {
    source: "3",
    "obj-f": fieldName,
    ...extraAttrs,
  }, [], extra);
}

function dynamicUser(fieldName, extra = {}) {
  return control("dynamic-user", "Dynamic user", {
    source: "3",
    "obj-f": fieldName,
    "i-len": [null, 2],
    display_name: true,
    addition_fields: ["Email"],
    picture_style: { "image-size": [null, 28], gap: [null, "--sp--s150"], align: [null, "center"] },
    text_style: { name_ty: [null, "s-medium"], fields_ty: [null, "xs-regular"] },
  }, [], extra);
}

function dynamicImage(fieldName, height = 120, extra = {}) {
  return control("dynamic-image", "Dynamic image", {
    source: "3",
    "obj-f": fieldName,
    preview_image: "2",
    setting: { img_height: [null, height], fit: [null, "2"] },
    image: { border: { radius: [null, { top: "--sp--s200", right: "--sp--s200", bottom: "--sp--s200", left: "--sp--s200" }] } },
  }, [], extra);
}

function dynamicFile(fieldName, extra = {}) {
  return control("dynamic-file", "Dynamic file", {
    source: "3",
    "obj-f": fieldName,
    "i-len": [null, 2],
    content: {
      w: [null, 100],
      wu: [null, "%"],
      iconsize: [null, 18],
      pd: [null, { top: "--sp--s100", right: "--sp--s100", bottom: "--sp--s100", left: "--sp--s100" }],
    },
    opbtn: { normal: {} },
    type_icon_show: true,
  }, [], extra);
}

function cardTemplate(hostLabel, imageHeight = 96) {
  return control("container", "Container", {
    style: { gap: [null, "--sp--s150"], direction: [null, "column"], align_items: [null, "stretch"] },
    common: {
      padding: [null, { top: "--sp--s250", right: "--sp--s250", bottom: "--sp--s250", left: "--sp--s250" }],
      background: { normal: { type: "classic", classic: { color: "#ffffff" } } },
      border: {
        normal: {
          type: "1",
          width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
          color: "var(--c--neutral-light-active)",
          radius: [null, { top: "--sp--s200", right: "--sp--s200", bottom: "--sp--s200", left: "--sp--s200" }],
        },
      },
    },
  }, [
    dynamicImage("Text3", imageHeight, { nv_label: `${hostLabel} cover image` }),
    dynamicField("Title", { item_style: { ty: [null, "base-medium"] } }, { nv_label: `${hostLabel} title` }),
    control("container", "Container", {
      style: { direction: [null, "row"], gap: [null, "--sp--s150"], align_items: [null, "center"], justify_content: [null, "space-between"] },
    }, [
      dynamicField("Text1", { item_style: { ty: [null, "s-medium"] } }, { nv_label: `${hostLabel} status` }),
      dynamicField("Decimal1", { prefix: "Progress:", item_style: { ty: [null, "s-regular"] } }, { nv_label: `${hostLabel} progress` }),
    ], { nv_label: `${hostLabel} status row` }),
    dynamicField("Datetime1", { prefix: "Start:", item_style: { ty: [null, "s-regular"] } }, { nv_label: `${hostLabel} start date` }),
    dynamicUser("Text2", { nv_label: `${hostLabel} owner` }),
    dynamicFile("Text4", { nv_label: `${hostLabel} attachments` }),
  ], { nv_label: `${hostLabel} item template` });
}

function listRef() {
  return {
    AppID: APP_ID,
    ListID: LIST_ID,
    Type: 1,
    Title: LIST_TITLE,
    ListSetID: ROOT_ID,
  };
}

function kanbanControl() {
  return control("kanban", "Kanban", {
    data: {
      list: listRef(),
      cateField: "Text1",
    },
    categories: {
      width: [null, 260],
      collapse: true,
      name: { ty: { size: [null, 14], wei: "600" } },
    },
    items: {
      normal: {
        bgColor: "#ffffff",
        border: { radius: [null, { top: 6, right: 6, bottom: 6, left: 6 }] },
      },
      pd: [null, { top: 8, right: 8, bottom: 8, left: 8 }],
    },
    newItem: { add: false },
  }, [
    control("kanban-body", "Kanban body", {}, [cardTemplate("Kanban", 90)], { nv_label: "Kanban body template" }),
    control("kanban-footer", "Kanban footer", {}, [], { nv_label: "Kanban footer" }),
  ], { nv_label: "Runtime proof Kanban" });
}

function collectionControl() {
  return control("collection", "Collection", {
    data: { list: listRef() },
    layout: {
      cg: [null, 18],
      rg: [null, 18],
      cp: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }],
      "align-i": [null, "7"],
    },
  }, [cardTemplate("Collection", 120)], { nv_label: "Runtime proof Collection" });
}

function verticalTimelineControl() {
  return control("timeline-v", "Vertical timeline", {
    data: {
      list: listRef(),
      title: {
        value: null,
        variable: [{ exprType: "variable_ctx", valueType: "input", id: "Title", ctx: "__ctx_coll", type: "expr", name: "Collection item:Title" }],
      },
      sort: [{ SortName: "Datetime1", SortByDesc: false }],
      icon: "fa-regular fa-timeline",
      modalsize: 0,
      animate: true,
      align: [null, "left"],
      va: [null, "2"],
    },
    title: { ty: [null, "h6-medium"] },
  }, [cardTemplate("Vertical timeline", 120)], { nv_label: "Runtime proof Vertical Timeline" });
}

function horizontalTimelineControl() {
  return control("timeline-h", "Horizontal timeline", {
    data: {
      list: listRef(),
      sort: [{ SortName: "Datetime1", SortByDesc: false }],
      title: {
        value: null,
        variable: [{ exprType: "variable_ctx", valueType: "datepicker", id: "Datetime1", ctx: "__ctx_coll", type: "expr", name: "Collection item:Start date" }],
      },
      icon: "fa-regular fa-calendar-lines",
      ptype: "1",
      col: [null, 3],
      op: "modal",
      modalsize: 0,
      cardarr: true,
      align: [null, "center"],
      va: [null, "2"],
      slides: "3",
    },
    card: { "align-i": [null, "7"], arrow: { size: [null, "--sp--s150"] } },
    point: { size: [null, 28] },
    title: { ty: [null, "s-medium"] },
    arrow: { normal: { size: [null, 28], bgcolor: "var(--c--primary-dark)" } },
  }, [cardTemplate("Horizontal timeline", 120)], { nv_label: "Runtime proof Horizontal Timeline" });
}

function dashboardPage() {
  return {
    children: [
      control("container", "Container", {
        style: { gap: [null, "--sp--s500"], direction: [null, "column"], align_items: [null, "stretch"] },
        common: {
          padding: [null, { top: "--sp--s500", right: "--sp--s600", bottom: "--sp--s600", left: "--sp--s600" }],
          background: { normal: { type: "classic", classic: { color: "var(--c--neutral-light)" } } },
        },
      }, [
        control("container", "Container", {
          style: { gap: [null, "--sp--s100"], direction: [null, "column"] },
        }, [
          heading(DASHBOARD_TITLE, "h2-bold"),
          paragraph("Focused runtime proof for Kanban, Collection, Vertical Timeline, Horizontal Timeline, and Dynamic controls bound to safe synthetic list rows."),
        ], { nv_label: "Dashboard header" }),
        section("Kanban", [kanbanControl()]),
        section("Collection", [collectionControl()]),
        section("Vertical Timeline", [verticalTimelineControl()]),
        section("Horizontal Timeline", [horizontalTimelineControl()]),
      ], { nv_label: "Main" }),
    ],
    attrs: {
      hideHeaderAll: true,
      background: { normal: { type: "classic", classic: { color: "var(--c--neutral-light)" } } },
    },
    title: DASHBOARD_TITLE,
    ver: 2,
    filterVars: [],
    tempVars: [],
    exts: [],
    actions: [],
  };
}

function customFormResource(title, mode) {
  const source = mode === "4" ? "4" : "3";
  const dynamic = (fieldName, label) => control("dynamic-field", "Dynamic field", { source, "obj-f": fieldName }, [], { nv_label: label });
  return JSON.stringify({
    children: [
      control("container", "Container", {
        style: { gap: [null, "--sp--s300"], direction: [null, "column"] },
        common: { padding: [null, { top: "--sp--s500", right: "--sp--s500", bottom: "--sp--s500", left: "--sp--s500" }] },
      }, [
        heading(title, "h4-bold"),
        dynamic("Title", "Current item title"),
        dynamic("Text1", "Current item status"),
        dynamic("Datetime1", "Current item start date"),
      ], { nv_label: "Main" }),
    ],
    attrs: {
      container: { cw: "2" },
    },
    title,
    filterVars: [],
    tempVars: [],
    ver: 2,
  });
}

function makeViewLayout(title, layoutId, resourceId) {
  return {
    LayoutID: layoutId,
    Type: 1,
    Title: title,
    ListID: LIST_ID,
    LayoutView: null,
    Ext2: null,
    IsItemPerm: false,
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
    LayoutInResources: [{ ID: resourceId, RefId: resourceId, Resource: customFormResource(title, "4") }],
  };
}

function makeListView(fields) {
  const layoutId = nextId();
  const visibleFields = fields.filter((field) => field.Type !== "textarea");
  return {
    LayoutID: layoutId,
    Type: 0,
    Title: "All Items",
    IsDefault: true,
    ListID: LIST_ID,
    LayoutView: JSON.stringify({
      layout: visibleFields.map((field, index) => ({
        FieldID: field.FieldID,
        FieldName: field.FieldName,
        Mobile: index === 0 ? 2 : 0,
        Order: index,
        Show: true,
        Type: field.Type,
        DisplayName: field.DisplayName,
      })),
      filter: [],
      query: [],
      sort: [{ SortName: "Datetime1", SortByDesc: false }],
      rowColor: [],
    }),
    Ext2: null,
    IsItemPerm: false,
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
    LayoutInResources: [],
  };
}

function makeRows() {
  const specs = [
    ["Customer Onboarding", "Not started", "2026-06-01", 0.15],
    ["Finance Automation", "In progress", "2026-06-08", 0.45],
    ["Support Portal Refresh", "Blocked", "2026-06-15", 0.3],
    ["Product Launch Plan", "Done", "2026-06-22", 0.95],
  ];
  const rows = {};
  specs.forEach(([title, status, start, progress], index) => {
    const rowId = String(FAMILY + 9000n + BigInt(index + 1));
    rows[rowId] = {
      ListDataID: rowId,
      Title: title,
      Text1: status,
      Datetime1: start,
      Decimal1: progress,
      Text2: "",
      Text3: "",
      Text4: "",
      Text5: `Safe synthetic notes for ${title}.`,
      Created: GENERATED_AT,
      Modified: GENERATED_AT,
    };
  });
  return rows;
}

function makeRuntimeList(baseList, baseField) {
  const specs = [
    { fieldName: "Title", fieldType: "Text", fieldIndex: 0, displayName: "Item Title", internalName: "ItemTitle", type: "input", isSystem: true, isIndex: true, isSort: true, isFilter: true, rules: { required: true } },
    { fieldName: "Text1", fieldType: "Text", fieldIndex: 1, displayName: "Status", internalName: "Status", type: "radio", isFilter: true, rules: { choices: ["Not started", "In progress", "Blocked", "Done"], color_choices: [{ value: "Not started", color: "#64748b" }, { value: "In progress", color: "#2563eb" }, { value: "Blocked", color: "#dc2626" }, { value: "Done", color: "#16a34a" }] } },
    { fieldName: "Datetime1", fieldType: "Datetime", fieldIndex: 1, displayName: "Start date", internalName: "StartDate", type: "datepicker", isFilter: true, rules: { showtime: false } },
    { fieldName: "Decimal1", fieldType: "Decimal", fieldIndex: 1, displayName: "Progress", internalName: "Progress", type: "percent", rules: { "rounded-to": 0, decimalPlaces: 0, number_min: 0, number_max: 1 } },
    { fieldName: "Text2", fieldType: "Text", fieldIndex: 2, displayName: "Owner", internalName: "Owner", type: "identity-picker", rules: { "identity-maxselection": 1, multiple: false, required: false } },
    { fieldName: "Text3", fieldType: "Text", fieldIndex: 3, displayName: "Cover image", internalName: "CoverImage", type: "icon-upload", rules: { controlmultiple: false, picture_size_limit: 10, required: false } },
    { fieldName: "Text4", fieldType: "Text", fieldIndex: 4, displayName: "Reference files", internalName: "ReferenceFiles", type: "file-upload", rules: { ver: 1, file_multiple: true, maxsize: 10, required: false } },
    { fieldName: "Text5", fieldType: "Text", fieldIndex: 5, displayName: "Notes", internalName: "Notes", type: "textarea", rules: { required: false } },
  ];
  const fields = specs.map((spec) => makeField(baseField, spec, spec.fieldName === "Title" ? String(FAMILY + 1001n) : undefined));
  const list = clone(baseList);
  list.ListModel = {
    ...list.ListModel,
    AppID: APP_ID,
    ListID: LIST_ID,
    Title: LIST_TITLE,
    Description: "Safe synthetic rows for Kanban/Collection/Timeline Dynamic control runtime testing.",
    IconUrl: "{\"b\":\"#E6F0FF\",\"i\":\"fa-regular fa-diagram-project\",\"c\":\"#0065FF\"}",
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
    Perm: 4,
    Type: 1,
    Flags: 1,
    CustomType: `ListSite_${ROOT_ID}`,
    LayoutView: JSON.stringify({
      add: EDIT_LAYOUT_ID,
      edit: EDIT_LAYOUT_ID,
      view: VIEW_LAYOUT_ID,
      opentype: { add: "modal", edit: "modal", view: "slide" },
      modalsize: { add: 0, edit: 0, view: 0 },
    }),
    IsBreakInherit: false,
    IsDataSeparate: false,
    AdvanceList: [],
    ListType: 1,
  };
  list.Defs = fields;
  list.Layouts = [makeListView(fields), makeViewLayout("View Item", VIEW_LAYOUT_ID, VIEW_RESOURCE_ID), makeViewLayout("Edit Item", EDIT_LAYOUT_ID, EDIT_RESOURCE_ID)];
  list.PublicForms = [];
  list.RemindRules = [];
  list.FlowMappings = [];
  list.LayoutInResources = [];
  list.ListDatas = makeRows();
  return list;
}

function collectGeneratedIds(value, ids = new Set()) {
  if (typeof value === "string") {
    for (const match of value.matchAll(/\b746300\d{9,}\b/g)) ids.add(match[0]);
    return ids;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectGeneratedIds(item, ids));
    return ids;
  }
  if (!value || typeof value !== "object") return ids;
  for (const [key, child] of Object.entries(value)) {
    collectGeneratedIds(key, ids);
    collectGeneratedIds(child, ids);
  }
  return ids;
}

function buildWrapper(resource) {
  return {
    Title: APP_TITLE,
    Description: APP_DESCRIPTION,
    IconUrl: "{\"b\":\"#E6F0FF\",\"i\":\"fa-regular fa-diagram-project\",\"c\":\"#0065FF\"}",
    IsListSet: true,
    Resource: `${GZIP_PREFIX}${zlib.gzipSync(Buffer.from(JSON.stringify(resource), "utf8")).toString("base64")}`,
  };
}

function main() {
  const sourceResource = JSON.parse(fs.readFileSync(SOURCE_RESOURCE, "utf8"));
  const sourceData = JSON.parse(sourceResource.Data);
  const baseList = sourceData.Childs?.[0];
  const baseField = baseList?.Defs?.find((field) => field.FieldName === "Title") || baseList?.Defs?.[0];
  if (!baseList || !baseField) throw new Error("Source baseline does not contain a usable data-list field template.");

  const root = clone(sourceData.Item);
  root.ListModel = {
    ...root.ListModel,
    AppID: APP_ID,
    ListID: ROOT_ID,
    Title: APP_TITLE,
    Description: APP_DESCRIPTION,
    IconUrl: "{\"b\":\"#E6F0FF\",\"i\":\"fa-regular fa-diagram-project\",\"c\":\"#0065FF\"}",
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
    CustomType: "",
    LayoutView: JSON.stringify({
      sortVer: 1,
      sort: [
        { AppID: APP_ID, ListID: DASHBOARD_ID, ListSetID: ROOT_ID, Type: 103, IsHidden: false, Title: DASHBOARD_TITLE, Icon: "fa-regular fa-diagram-project", DisplayName: "Runtime Dashboard" },
        { AppID: APP_ID, ListID: LIST_ID, ListSetID: ROOT_ID, Type: 1, IsHidden: false, Title: LIST_TITLE, Icon: "fa-regular fa-table-list", DisplayName: LIST_TITLE },
      ],
      attrs: {
        appearance: { bgc: "var(--c--primary-light)", color: "var(--c--primary)" },
        "navigator-menu": { bgc: "var(--c--primary)", color: "var(--c--primary-light)", position: "default" },
        CustomColors: [],
        CustomFonts: [],
      },
    }),
  };
  root.Defs = [];
  root.PublicForms = [];
  root.RemindRules = [];
  root.FlowMappings = [];
  root.ListDatas = {};
  root.Layouts = [
    {
      LayoutID: DASHBOARD_ID,
      Type: 103,
      Title: DASHBOARD_TITLE,
      IsDefault: true,
      ListID: ROOT_ID,
      LayoutView: null,
      Ext2: "{\"src\":true}",
      IsItemPerm: false,
      Created: GENERATED_AT,
      Modified: GENERATED_AT,
      LayoutInResources: [{ ID: DASHBOARD_ID, RefId: DASHBOARD_ID, Resource: JSON.stringify(dashboardPage()) }],
    },
  ];

  const runtimeList = makeRuntimeList(baseList, baseField);
  const data = {
    ...sourceData,
    Item: root,
    Childs: [runtimeList],
    Forms: [],
    AppGroups: [],
    OtherModules: [],
    DataReports: [],
    FormReports: [],
    FormNewReports: [],
  };
  const resource = {
    ...sourceResource,
    MainListType: 1024,
    AppID: APP_ID,
    Title: APP_TITLE,
    Description: APP_DESCRIPTION,
    IconUrl: root.ListModel.IconUrl,
    FormKeys: [],
    ReportIds: [],
    SimplePortal: null,
    Data: JSON.stringify(data),
  };
  resource.ReplaceIds = [...collectGeneratedIds(resource)].sort();

  fs.mkdirSync(path.dirname(OUT_RESOURCE), { recursive: true });
  fs.writeFileSync(OUT_RESOURCE, `${JSON.stringify(resource, null, 2)}\n`);
  fs.writeFileSync(OUT_DATA, `${JSON.stringify(data, null, 2)}\n`);
  fs.writeFileSync(OUT_PACKAGE, `${JSON.stringify(buildWrapper(resource), null, 2)}\n`);
  fs.copyFileSync(OUT_PACKAGE, DOWNLOADS_COPY);
  fs.writeFileSync(OUT_REPORT, `${JSON.stringify({
    status: "generated",
    packagePath: path.resolve(OUT_PACKAGE),
    downloadsPath: DOWNLOADS_COPY,
    appTitle: APP_TITLE,
    dashboard: DASHBOARD_TITLE,
    dataList: LIST_TITLE,
    sampleRows: Object.keys(runtimeList.ListDatas).length,
    controls: ["kanban", "collection", "timeline-v", "timeline-h"],
    dynamicControls: ["dynamic-field", "dynamic-user", "dynamic-image", "dynamic-file"],
    note: "User/image/file fields are schema-safe and empty in synthetic rows; preview/download behavior remains manual-test pending.",
    proofBoundary: "Generated package for manual runtime proof only; validation is not runtime proof.",
  }, null, 2)}\n`);

  console.log(JSON.stringify({
    status: "generated",
    packagePath: path.resolve(OUT_PACKAGE),
    downloadsPath: DOWNLOADS_COPY,
    appTitle: APP_TITLE,
    dashboard: DASHBOARD_TITLE,
    dataList: LIST_TITLE,
    sampleRows: Object.keys(runtimeList.ListDatas).length,
    replaceIds: resource.ReplaceIds.length,
  }, null, 2));
}

main();

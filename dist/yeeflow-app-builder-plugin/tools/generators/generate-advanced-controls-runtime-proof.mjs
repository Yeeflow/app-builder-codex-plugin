import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const SOURCE_RESOURCE = "custom-code-smart-lookup-picker-test.resource.json";
const OUTPUT_YAP = "advanced-controls-runtime-proof.v1.yap";
const DOWNLOADS_YAP = "/Users/Renger/Downloads/advanced-controls-runtime-proof.v1.yap";
const OUT_RESOURCE = ".tmp/advanced-controls-runtime-proof.v1.resource.json";
const OUT_DATA = ".tmp/advanced-controls-runtime-proof.v1.app-def.json";
const OUT_REPORT = ".tmp/advanced-controls-runtime-proof.v1.generation-report.json";

const GZIP_PREFIX = "[______gizp______]";
const FAMILY = 7488000000000000000n;
const APP_ID = 41;
const GENERATED_AT = "2026-05-28 16:30:00";
const APP_TITLE = "Advanced Controls Runtime Proof";
const APP_DESCRIPTION = "Focused safe generated package for runtime proof of Yeeflow advanced controls.";
const ROOT_ID = String(FAMILY);
const DASHBOARD_ID = String(FAMILY + 1n);
const LIST_ID = String(FAMILY + 1000n);
const ADD_FORM_ID = String(FAMILY + 1101n);
const EDIT_FORM_ID = String(FAMILY + 1102n);
const VIEW_FORM_ID = String(FAMILY + 1103n);

let nextOffset = 3000n;

function nextId() {
  nextOffset += 1n;
  return String(FAMILY + nextOffset);
}

function uuid(label = "") {
  nextOffset += 1n;
  const tail = String(nextOffset).padStart(12, "0").slice(-12);
  const head = String(label).replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 8).padEnd(8, "0");
  return `${head.slice(0, 8)}-${tail.slice(0, 4)}-4000-8000-${tail}`;
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
  return String(value).replace(/[^A-Za-z0-9_]/g, "") || `Field_${nextId()}`;
}

function makeField(template, listId, spec, fieldId) {
  const isTitle = spec.fieldName === "Title";
  return {
    ...template,
    FieldID: fieldId || nextId(),
    ListID: listId,
    FieldName: spec.fieldName,
    FieldType: spec.fieldType,
    FieldIndex: spec.fieldIndex,
    DisplayName: spec.displayName,
    InternalName: sanitizeInternalName(spec.internalName || spec.displayName),
    DisplayName_EN: null,
    Type: spec.type,
    Status: spec.status ?? (isTitle ? 0 : 1),
    Category: 0,
    DefaultValue: spec.defaultValue ?? null,
    Rules: JSON.stringify(spec.rules || {}),
    AppID: APP_ID,
    IsSort: spec.isSort ?? isTitle,
    IsIndex: spec.isIndex ?? isTitle,
    IsFilter: spec.isFilter ?? false,
    IsIndexCreated: false,
    IsSystem: spec.isSystem ?? isTitle,
    IsUnique: false,
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
    Ext1: null,
    Ext2: null,
    Ext3: null,
    Title: spec.displayName,
  };
}

function heading(text, size = 20, weight = "600") {
  return {
    id: uuid("heading"),
    type: "heading",
    label: "Text",
    attrs: {
      headc: { title: { value: text, variable: null } },
      heads: { ty: [null, { size, wei: weight }], color: "var(--c--text)" },
    },
    children: [],
  };
}

function note(text) {
  return {
    id: uuid("note"),
    type: "heading",
    label: "Text",
    attrs: {
      headc: { title: { value: text, variable: null } },
      heads: { ty: [null, "s-regular"], color: "var(--c--neutral-dark-hover)" },
    },
    children: [],
  };
}

function container(children, attrs = {}, label = "Container") {
  return {
    id: uuid(label),
    type: "container",
    label,
    attrs: {
      style: { gap: [null, "--sp--s150"], direction: [null, "column"], ...(attrs.style || {}) },
      common: attrs.common || {},
      ...(attrs.extra || {}),
    },
    children,
  };
}

function card(title, children) {
  return container([
    heading(title, 18, "600"),
    ...children,
  ], {
    style: {
      background: { type: "classic", classic: { color: "#ffffff" } },
      border: { type: "1", color: "var(--c--neutral-light-active)", width: [null, { top: 1, right: 1, bottom: 1, left: 1 }] },
      padding: [null, { top: "--sp--s200", right: "--sp--s200", bottom: "--sp--s200", left: "--sp--s200" }],
    },
  }, title);
}

function tabControl() {
  return {
    id: uuid("tabs"),
    type: "aktabs",
    label: "Tab",
    attrs: {
      "tabs-tabposition": "top",
      item: { normal: { is: [null, 14], ty: [null, "base-medium"] }, iconpos: "2" },
      tabs: { tca: [null, "justify"], ta: [null, "justify"] },
    },
    children: [
      {
        id: uuid("tabone"),
        type: "ak-tabs-tab",
        label: "Overview",
        attrs: { isDefault: true, isDesignDefault: true, "icon-type": "3", icon: "fa-regular fa-grid-2" },
        children: [container([note("Nested tab content renders here."), progressBar(42), qrCode()])],
      },
      {
        id: uuid("tabtwo"),
        type: "ak-tabs-tab",
        label: "Sharing",
        attrs: { isDefault: false, isDesignDefault: false, "icon-type": "3", icon: "fa-regular fa-share-nodes" },
        children: [container([barcode("ACR-PROOF-001"), embedControl()])],
      },
    ],
  };
}

function toggleControl() {
  return {
    id: uuid("toggle"),
    type: "toggle",
    label: "Toggle",
    attrs: {
      caption: {
        normal: {
          background: { type: "classic", classic: { color: "#ffffff" } },
          border: { type: "0", radius: [null, { top: "--sp--s150", right: "--sp--s150", bottom: "--sp--s150", left: "--sp--s150" }] },
        },
        ty: [null, "s-medium"],
      },
      general: { space: [null, 12], normal: { border: { type: "0" } } },
    },
    children: [
      {
        id: uuid("panelone"),
        type: "toggle-panel",
        label: "",
        attrs: { title: { value: "Rendering checks", variable: null } },
        children: [container([alertControl("info"), divider(), progressCircle(64)])],
      },
      {
        id: uuid("paneltwo"),
        type: "toggle-panel",
        label: "",
        attrs: { title: { value: "Layout checks", variable: null } },
        children: [container([iconList(), spacer(18), stepsBarStatic()])],
      },
    ],
  };
}

function timerControl() {
  return {
    id: uuid("timer"),
    type: "timer",
    label: "Timer",
    attrs: { set: { date: { value: "2026-12-31 23:59:00", variable: null } } },
    children: [],
  };
}

function iconList() {
  return {
    id: uuid("iconlist"),
    type: "icon_list",
    label: "Icon list",
    attrs: {
      data: {
        links: [
          { icon: "fa-regular fa-house", url: { opentype: true, value: "https://www.yeeflow.com/", variable: null }, mapkey: uuid("linkone"), tit: { value: "Yeeflow website", variable: null } },
          { icon: "fa-regular fa-file-lines", url: { opentype: true, value: "https://www.yeeflow.com/", variable: null }, mapkey: uuid("linktwo"), tit: { value: "Yeeflow support", variable: null } },
        ],
      },
      gen: { sb: [null, 12], align: [null, "left"], dl: false },
      icon: { pl: "", is: [null, 14], normal: { color: "var(--c--primary)" } },
      title: { pl: 12, ty: [null, "base-light"], normal: { color: "var(--c--primary)" } },
    },
    children: [],
  };
}

function divider(text = null) {
  return {
    id: uuid("divider"),
    type: "line",
    label: "Divider",
    attrs: {
      width: [null, ""],
      sketchpicker: "var(--c--neutral-light-active)",
      space: [null, 12],
      "line-width": 1,
      ...(text ? { eletype: "text", "line-text": { value: text, variable: null }, text: { ty: [null, "s-medium"] } } : {}),
    },
    children: [],
  };
}

function alertControl(kind = "info") {
  const titles = {
    info: "Info alert",
    success: "Success alert",
    warning: "Warning alert",
    error: "Error alert",
  };
  return {
    id: uuid(`alert-${kind}`),
    type: "alert",
    label: kind === "info" ? "Alert" : kind,
    attrs: {
      alert: {
        title: { value: titles[kind] || "Alert", variable: null },
        desc: { value: `Safe ${kind} message for runtime rendering proof.`, variable: null },
        type: kind,
      },
    },
    children: [],
  };
}

function progressBar(value = 46) {
  return {
    id: uuid("progress"),
    type: "progress",
    label: "Progress bar",
    attrs: {
      bar: {
        title: { value: "Static progress", variable: null },
        per: { value, variable: null },
        it: { value: "Percentage", variable: null },
      },
      title: { ty: [null, "base-medium"] },
      per: { hei: 26, ty: {}, bgc: "var(--c--primary-light-hover)", color: "var(--c--primary)", innc: "var(--c--background)" },
    },
    children: [],
  };
}

function spacer(space = 24) {
  return {
    id: uuid("spacer"),
    type: "gap",
    label: "Spacer",
    attrs: { space: [null, space] },
    children: [],
  };
}

function progressCircle(value = 64) {
  return {
    id: uuid("circle"),
    type: "progress-circle",
    label: "Progress circle",
    attrs: {
      per: { title: { value: "Completion", variable: null }, per: { value, variable: null } },
      sty: { type: "gradient", width: [null, 10] },
      common: { positioning: { widthtype: [null, "2"] } },
    },
    children: [],
  };
}

function stepsOptions() {
  return [
    { key: uuid("stepone"), value: "Plan" },
    { key: uuid("steptwo"), value: "Build" },
    { key: uuid("stepthree"), value: "Validate" },
    { key: uuid("stepfour"), value: "Runtime test" },
  ];
}

function stepsBarStatic() {
  return {
    id: uuid("steps"),
    type: "steps-bar",
    label: "Steps bar",
    attrs: {
      "current-icon": "fa-regular fa-circle",
      "past-icon": "fa-regular fa-check",
      source: "9",
      "steps-options": stepsOptions(),
      "current-step": { value: "Validate", variable: null },
      layout: "2",
      "text-posi": "4",
      indicator: "number",
    },
    children: [],
  };
}

function qrCode() {
  return {
    id: uuid("qrcode"),
    type: "list-qrcode",
    label: "QR Code",
    attrs: {
      common: { positioning: { widthtype: [null, "2"] } },
      "qr-code-size": [null, 120],
      "qr-code-link": { type: "1", customUrl: { url: "https://www.yeeflow.com/", variable: null } },
    },
    children: [],
  };
}

function barcode(value = "ACR-PROOF-001") {
  return {
    id: uuid("barcode"),
    type: "barcode",
    label: "Barcode",
    attrs: {
      value: { value, variable: null },
      type: "CODE128",
      textPosition: "bottom",
      displayValue: true,
      common: { positioning: { widthtype: [null, "2"] } },
      barcode: { height: [null, 60], width: [null, 2], color: "var(--c--primary)", bgColor: "var(--c--primary-light)" },
    },
    children: [],
  };
}

function embedControl() {
  return {
    id: uuid("embed"),
    type: "embed",
    label: "Embed",
    attrs: {
      code: {
        value: "<iframe width=\"560\" height=\"315\" src=\"https://www.yeeflow.com/\" title=\"Yeeflow safe embed\" frameborder=\"0\"></iframe>",
        variable: null,
      },
    },
    children: [],
  };
}

function documentEmbed() {
  return {
    id: uuid("docembed"),
    type: "document-embed",
    label: "Document embed",
    attrs: {
      "doc-source": [{ exprType: "list_field", valueType: "file-upload-merge", prop: "Text4", id: "Attachment", type: "expr", name: "List Fields:Attachment" }],
      appearance: { height: [null, 60], heightu: [null, "vh"] },
    },
    children: [],
  };
}

function viewStepsBar() {
  return {
    id: uuid("viewsteps"),
    type: "steps-bar",
    label: "Steps bar",
    attrs: {
      "current-icon": "fa-regular fa-circle",
      "past-icon": "fa-regular fa-check",
      source: "4",
      "steps-options": stepsOptions(),
      "obj-f": "Text1",
      "current-step": {
        value: null,
        variable: [{ exprType: "list_field", id: "Stage", name: "List Fields:Stage", prop: "Text1", type: "expr", valueType: "radio" }],
      },
      layout: "2",
      "text-posi": "4",
    },
    children: [],
  };
}

function dashboardPage() {
  return {
    children: [
      container([
        heading("Advanced Controls Runtime Dashboard", 26, "700"),
        note("Safe generated controls for manual import/open/render proof. Runtime behavior remains limited to this package."),
        card("Tabs and Nested Content", [tabControl()]),
        card("Toggle Sections", [toggleControl()]),
        card("Additional Dashboard Controls", [
          timerControl(),
          iconList(),
          divider("Status controls"),
          alertControl("info"),
          alertControl("success"),
          alertControl("warning"),
          alertControl("error"),
          progressBar(58),
          spacer(24),
          progressCircle(72),
          stepsBarStatic(),
          qrCode(),
          barcode("ACR-DASH-001"),
          embedControl(),
        ]),
      ], {
        style: { padding: [null, { top: "--sp--s300", right: "--sp--s300", bottom: "--sp--s300", left: "--sp--s300" }] },
      }, "Main"),
    ],
    attrs: {
      hideHeaderAll: true,
      container: { padding: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }] },
      background: { type: "classic", classic: { color: "var(--c--neutral-light)" } },
    },
    title: "Advanced Controls Runtime Dashboard",
    filterVars: [],
    tempVars: [],
    exts: [],
    actions: [],
    ver: 2,
  };
}

function fieldControl(field, readOnly = false) {
  return {
    id: uuid(`field-${field.FieldName}`),
    type: field.Type,
    label: field.DisplayName,
    binding: field.FieldName,
    fieldID: field.FieldID,
    isListControl: true,
    identifier: field.FieldName,
    InternalName: field.InternalName,
    attrs: { ...parseJson(field.Rules, {}), ...(readOnly ? { readonly: true, disabled: true } : {}) },
    children: [],
  };
}

function listFormResource(title, fields, mode) {
  const readOnly = mode === "view";
  const controls = mode === "view"
    ? [
        heading("Advanced Control Runtime Item", 22, "700"),
        note("This View page proves field-bound Steps bar, QR Code, Barcode, Embed, and Document embed safe empty-state binding."),
        viewStepsBar(),
        qrCode(),
        barcode("ACR-ITEM-001"),
        embedControl(),
        documentEmbed(),
        divider("Record fields"),
        ...fields.map((field) => fieldControl(field, true)),
      ]
    : fields.map((field) => fieldControl(field, readOnly));

  return JSON.stringify({
    children: [container(controls, { style: { padding: [null, { top: "--sp--s200", right: "--sp--s200", bottom: "--sp--s200", left: "--sp--s200" }] } }, "Form Main")],
    attrs: { container: { cw: "2" }, background: { type: "classic", classic: { color: "var(--c--neutral-light)" } } },
    title,
    filterVars: [],
    tempVars: [],
    exts: [],
    actions: [],
    ver: 2,
  });
}

function customFormLayout(layoutId, title, fields, mode) {
  return {
    LayoutID: layoutId,
    Type: 1,
    Title: title,
    IsDefault: false,
    ListID: LIST_ID,
    LayoutView: null,
    Ext2: JSON.stringify({ src: true }),
    IsItemPerm: false,
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
    LayoutInResources: [{ ID: layoutId, RefId: layoutId, Resource: listFormResource(title, fields, mode) }],
  };
}

function listViewLayout(fields) {
  return {
    LayoutID: nextId(),
    Type: 0,
    Title: "All Items",
    IsDefault: true,
    ListID: LIST_ID,
    LayoutView: JSON.stringify({
      layout: fields.map((field, index) => ({ FieldID: field.FieldID, FieldName: field.FieldName, Mobile: index === 0 ? 2 : 0, Order: index, Show: true, Type: field.Type, DisplayName: field.DisplayName })),
      filter: [],
      query: [],
      sort: [{ SortName: "Created", SortByDesc: true }],
    }),
    LayoutInResources: [],
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
  };
}

function buildWrapper(resource) {
  return {
    Title: APP_TITLE,
    Description: APP_DESCRIPTION,
    IconUrl: "{\"b\":\"#E6F0FF\",\"i\":\"fa-regular fa-wand-magic-sparkles\",\"c\":\"#0065FF\"}",
    IsListSet: true,
    Resource: `${GZIP_PREFIX}${zlib.gzipSync(Buffer.from(JSON.stringify(resource), "utf8")).toString("base64")}`,
  };
}

function collectGeneratedIds(value, ids = new Set()) {
  if (typeof value === "string") {
    for (const match of value.matchAll(/\b748800\d{9,}\b/g)) ids.add(match[0]);
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

function ensureListExportArrays(data) {
  for (const item of [data?.Item, ...(Array.isArray(data?.Childs) ? data.Childs : [])].filter(Boolean)) {
    if (!Array.isArray(item.Defs)) item.Defs = [];
    if (!Array.isArray(item.Layouts)) item.Layouts = [];
  }
}

const sourceResource = JSON.parse(fs.readFileSync(SOURCE_RESOURCE, "utf8"));
const sourceData = JSON.parse(sourceResource.Data);
const baseList = sourceData.Childs[0];
const baseField = baseList.Defs[1];

const root = clone(sourceData.Item);
root.ListModel = {
  ...root.ListModel,
  AppID: APP_ID,
  ListID: ROOT_ID,
  Title: APP_TITLE,
  Description: APP_DESCRIPTION,
  IconUrl: "{\"b\":\"#E6F0FF\",\"i\":\"fa-regular fa-wand-magic-sparkles\",\"c\":\"#0065FF\"}",
  Created: GENERATED_AT,
  Modified: GENERATED_AT,
  CustomType: "",
  Flags: 1,
  Status: 1,
  Type: 1024,
  LayoutView: JSON.stringify({
    sortVer: 1,
    sort: [
      { AppID: APP_ID, ListID: DASHBOARD_ID, ListSetID: ROOT_ID, Type: 103, IsHidden: false, Title: "Advanced Controls Runtime Dashboard", Icon: "fa-regular fa-wand-magic-sparkles" },
      { AppID: APP_ID, ListID: LIST_ID, ListSetID: ROOT_ID, Type: 1, IsHidden: false, Title: "Advanced Control Runtime Items", Icon: "fa-regular fa-table-list" },
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
root.Layouts = [{
  LayoutID: DASHBOARD_ID,
  Type: 103,
  Title: "Advanced Controls Runtime Dashboard",
  IsDefault: true,
  ListID: ROOT_ID,
  LayoutView: null,
  Ext2: "{\"src\":true}",
  IsItemPerm: false,
  Created: GENERATED_AT,
  Modified: GENERATED_AT,
  LayoutInResources: [{ ID: DASHBOARD_ID, RefId: DASHBOARD_ID, Resource: JSON.stringify(dashboardPage()) }],
}];

const fieldSpecs = [
  { fieldName: "Title", fieldType: "Text", fieldIndex: 0, displayName: "Title", internalName: "Title", type: "input", isSystem: true, isIndex: true, isSort: true, isFilter: true, rules: { required: true, placeholder: "Runtime item" } },
  { fieldName: "Text1", fieldType: "Text", fieldIndex: 1, displayName: "Stage", internalName: "Stage", type: "radio", isFilter: true, rules: { required: false, choices: ["Plan", "Build", "Validate", "Runtime test"], color_choices: ["#2563EB", "#16A34A", "#F97316", "#7C3AED"] } },
  { fieldName: "Decimal1", fieldType: "Decimal", fieldIndex: 1, displayName: "Progress", internalName: "Progress", type: "percent", isFilter: true, rules: { required: false, "rounded-to": 0, number_min: 0, number_max: 100 } },
  { fieldName: "Text2", fieldType: "Text", fieldIndex: 2, displayName: "Link URL", internalName: "LinkURL", type: "hyperlink", rules: { required: false, placeholder: "https://www.yeeflow.com/" } },
  { fieldName: "Text3", fieldType: "Text", fieldIndex: 3, displayName: "Barcode Value", internalName: "BarcodeValue", type: "input", rules: { required: false, placeholder: "ACR-ITEM-001" } },
  { fieldName: "Text4", fieldType: "Text", fieldIndex: 4, displayName: "Attachment", internalName: "Attachment", type: "file-upload", rules: { required: false, file_multiple: true, maxsize: 10 } },
];
const fields = fieldSpecs.map((spec) => makeField(baseField, LIST_ID, spec, spec.fieldName === "Title" ? LIST_ID : undefined));

const runtimeList = clone(baseList);
runtimeList.ListModel = {
  ...runtimeList.ListModel,
  AppID: APP_ID,
  ListID: LIST_ID,
  Title: "Advanced Control Runtime Items",
  Description: "Safe sample rows for advanced-control runtime proof.",
  IconUrl: "{\"b\":\"#E6F0FF\",\"i\":\"fa-regular fa-table-list\",\"c\":\"#0065FF\"}",
  Created: GENERATED_AT,
  Modified: GENERATED_AT,
  Perm: 4,
  Type: 1,
  Flags: 1,
  Status: 1,
  CustomType: `ListSite_${ROOT_ID}`,
  LayoutView: JSON.stringify({
    add: ADD_FORM_ID,
    edit: EDIT_FORM_ID,
    view: VIEW_FORM_ID,
    opentype: { add: "modal", edit: "modal", view: "modal" },
    modalsize: { add: 1, edit: 1, view: 2 },
  }),
  IsBreakInherit: false,
  IsDataSeparate: false,
  AdvanceList: [],
  ListType: 1,
};
runtimeList.Defs = fields;
runtimeList.Layouts = [
  listViewLayout(fields),
  customFormLayout(ADD_FORM_ID, "New Item", fields, "add"),
  customFormLayout(EDIT_FORM_ID, "Edit Item", fields, "edit"),
  customFormLayout(VIEW_FORM_ID, "View page", fields, "view"),
];
runtimeList.PublicForms = [];
runtimeList.RemindRules = [];
runtimeList.FlowMappings = [];
runtimeList.LayoutInResources = [];
runtimeList.ListDatas = {
  [String(FAMILY + 9001n)]: {
    ListDataID: String(FAMILY + 9001n),
    Title: "Runtime proof item",
    Text1: "Validate",
    Decimal1: "0.58",
    Text2: "https://www.yeeflow.com/",
    Text3: "ACR-ITEM-001",
    Text4: "",
  },
};

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
ensureListExportArrays(data);

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
fs.writeFileSync(OUTPUT_YAP, `${JSON.stringify(buildWrapper(resource), null, 2)}\n`);
fs.copyFileSync(OUTPUT_YAP, DOWNLOADS_YAP);
fs.writeFileSync(OUT_REPORT, `${JSON.stringify({
  status: "generated",
  packagePath: path.resolve(OUTPUT_YAP),
  downloadsPath: DOWNLOADS_YAP,
  appTitle: APP_TITLE,
  dashboard: "Advanced Controls Runtime Dashboard",
  dataList: "Advanced Control Runtime Items",
  customForms: runtimeList.Layouts.filter((layout) => Number(layout.Type) === 1).map((layout) => layout.Title),
  includedControls: ["Tab", "Toggle", "Timer", "Icon list", "Divider", "Alert", "Progress bar", "Spacer", "Progress circle", "Steps bar", "QR Code", "Barcode", "Embed", "Document embed"],
  sampleRows: Object.keys(runtimeList.ListDatas).length,
  replaceIds: resource.ReplaceIds.length,
}, null, 2)}\n`);

console.log(fs.readFileSync(OUT_REPORT, "utf8"));

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const SOURCE_RESOURCE = "custom-code-smart-lookup-picker-test.resource.json";
const OUTPUT_YAP = "data-list-custom-form-runtime-proof.v1.yap";
const DOWNLOADS_YAP = "/Users/Renger/Downloads/data-list-custom-form-runtime-proof.v1.yap";

const GZIP_PREFIX = "[______gizp______]";
const FAMILY = 7484000000000000000n;
const APP_ID = 41;
const GENERATED_AT = "2026-05-25 21:20:00";
const APP_TITLE = "Data List Custom Form Runtime Proof";
const APP_DESCRIPTION = "Focused generated package for Data List custom list form import/open/render proof.";
const ROOT_ID = String(FAMILY);
const HOME_LAYOUT_ID = String(FAMILY + 1n);
const LIST_ID = String(FAMILY + 1000n);
const NEW_FORM_ID = String(FAMILY + 2001n);
const EDIT_FORM_ID = String(FAMILY + 2002n);
const VIEW_FORM_ID = String(FAMILY + 2003n);

let nextOffset = 3000n;

function nextId() {
  nextOffset += 1n;
  return String(FAMILY + nextOffset);
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

function listViewLayout(listId, fields) {
  return {
    LayoutID: nextId(),
    Type: 0,
    Title: "All Items",
    IsDefault: true,
    ListID: listId,
    LayoutView: JSON.stringify({
      layout: fields.filter((field) => field.Type !== "textarea").map((field, index) => ({
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
      sort: [{ SortName: "Created", SortByDesc: true }],
    }),
    LayoutInResources: [],
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
  };
}

function pageResource() {
  return JSON.stringify({
    children: [{
      id: "custom-form-proof-root",
      type: "container",
      label: "Container",
      attrs: {
        style: { gap: [null, "--sp--s4"], direction: [null, "column"], align_items: [null, "stretch"] },
        common: { padding: { t: [null, "--sp--s4"], r: [null, "--sp--s4"], b: [null, "--sp--s4"], l: [null, "--sp--s4"] } },
      },
      children: [{
        id: "custom-form-proof-heading",
        type: "heading",
        label: "Text",
        attrs: {
          headc: { title: { value: APP_TITLE, variable: null } },
          heads: { ty: [null, "xl-semibold"], color: "var(--c--text)" },
        },
        children: [],
      }],
    }],
    attrs: { hideHeaderAll: true },
    title: "Home",
    filterVars: [],
    tempVars: [],
    ver: "2.0",
  });
}

function fieldControl(field, index, readOnly = false) {
  const rules = parseJson(field.Rules, {});
  return {
    id: `cf_${field.FieldName}_${index}`,
    type: field.Type,
    binding: field.FieldName,
    fieldID: field.FieldID,
    label: field.DisplayName,
    attrs: {
      ...rules,
      ...(readOnly ? { readonly: true, disabled: true } : {}),
    },
    isFilter: field.IsFilter,
    isSort: field.IsSort,
    isUnique: field.IsUnique,
    isSystem: field.IsSystem,
    status: field.Status,
    children: [],
  };
}

function customFormResource(title, fields, readOnly = false) {
  const controls = fields.map((field, index) => fieldControl(field, index, readOnly));
  return JSON.stringify({
    children: [{
      id: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-main`,
      type: "container",
      label: "Container",
      attrs: {
        container: { cw: "2" },
        common: { padding: { t: [null, "--sp--s0"], r: [null, "--sp--s0"], b: [null, "--sp--s0"], l: [null, "--sp--s0"] } },
      },
      children: [{
        id: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-content`,
        type: "container",
        label: "Container",
        attrs: {
          container: { cw: "2" },
          common: { padding: { t: [null, "--sp--s0"], r: [null, "--sp--s0"], b: [null, "--sp--s0"], l: [null, "--sp--s0"] } },
        },
        children: [{
          id: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-grid`,
          type: "flex_grid",
          label: "Grid",
          attrs: {
            ver: "2",
            columns: { 1: "1", 3: "2" },
            rows: { 1: "auto" },
            cgap: { 1: "16" },
            cgapU: "px",
          },
          children: controls,
        }],
      }],
    }],
    attrs: { container: { cw: "2" } },
    title,
    filterVars: [],
    tempVars: [],
    exts: [],
    ver: 2,
  });
}

function customFormLayout(layoutId, listId, title, fields, readOnly = false) {
  return {
    LayoutID: layoutId,
    Type: 1,
    Title: title,
    IsDefault: false,
    ListID: listId,
    LayoutView: null,
    LayoutInResources: [{ ID: layoutId, RefId: layoutId, Resource: customFormResource(title, fields, readOnly) }],
    Ext2: JSON.stringify({ src: true }),
    IsItemPerm: false,
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
  };
}

function ensureListExportArrays(data) {
  for (const item of [data?.Item, ...(Array.isArray(data?.Childs) ? data.Childs : [])].filter(Boolean)) {
    if (!Array.isArray(item.Defs)) item.Defs = [];
    if (!Array.isArray(item.Layouts)) item.Layouts = [];
  }
}

function collectGeneratedIds(value, ids = new Set()) {
  if (typeof value === "string") {
    for (const match of value.matchAll(/\b748400\d{9,}\b/g)) ids.add(match[0]);
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
    IconUrl: "{\"b\":\"#E6F0FF\",\"i\":\"fa-regular fa-window-restore\",\"c\":\"#0065FF\"}",
    IsListSet: true,
    Resource: `${GZIP_PREFIX}${zlib.gzipSync(Buffer.from(JSON.stringify(resource), "utf8")).toString("base64")}`,
  };
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
  IconUrl: "{\"b\":\"#E6F0FF\",\"i\":\"fa-regular fa-window-restore\",\"c\":\"#0065FF\"}",
  Created: GENERATED_AT,
  Modified: GENERATED_AT,
  CustomType: "",
  LayoutView: JSON.stringify({
    add: "default",
    edit: "default",
    view: "default",
    sort: [
      { AppID: APP_ID, ListID: HOME_LAYOUT_ID, ListSetID: ROOT_ID, Type: 103, IsHidden: false, Title: "Home", Icon: "fa-regular fa-house" },
      { AppID: APP_ID, ListID: LIST_ID, ListSetID: ROOT_ID, Type: 1, IsHidden: false, Title: "Custom Form Runtime Test", Icon: "fa-regular fa-window-restore" },
    ],
    attrs: {
      appearance: { bgc: "var(--c--primary-light)", color: "var(--c--primary)" },
      "navigator-menu": { bgc: "var(--c--primary)", color: "var(--c--primary-light)", position: "default" },
      CustomColors: [],
      CustomFonts: [],
    },
    sortVer: 1,
  }),
};
root.Defs = [];
root.PublicForms = [];
root.RemindRules = [];
root.FlowMappings = [];
root.ListDatas = {};
root.Layouts = [{
  ...(root.Layouts?.[0] || {}),
  LayoutID: HOME_LAYOUT_ID,
  Type: 103,
  Title: "Home",
  IsDefault: true,
  ListID: ROOT_ID,
  LayoutView: null,
  LayoutInResources: [{ ID: HOME_LAYOUT_ID, RefId: HOME_LAYOUT_ID, Resource: pageResource() }],
  Created: GENERATED_AT,
  Modified: GENERATED_AT,
}];

const fieldSpecs = [
  { fieldName: "Title", fieldType: "Text", fieldIndex: 0, displayName: "Runtime Form Title", internalName: "RuntimeFormTitle", type: "input", isSystem: true, isIndex: true, isSort: true, isFilter: true, rules: { required: true, placeholder: "Title" } },
  { fieldName: "Text1", fieldType: "Text", fieldIndex: 1, displayName: "Runtime Description", internalName: "RuntimeDescription", type: "textarea", rules: { required: false, placeholder: "Description" } },
  { fieldName: "Decimal1", fieldType: "Decimal", fieldIndex: 1, displayName: "Runtime Amount", internalName: "RuntimeAmount", type: "input_number", isFilter: true, rules: { required: false, "rounded-to": 0, number_min: 0, number_max: 9999 } },
  { fieldName: "Datetime1", fieldType: "Datetime", fieldIndex: 1, displayName: "Runtime Date", internalName: "RuntimeDate", type: "datepicker", isFilter: true, rules: { required: false, placeholder: "Select date", showtime: false } },
  { fieldName: "Text2", fieldType: "Text", fieldIndex: 2, displayName: "Runtime Owner", internalName: "RuntimeOwner", type: "identity-picker", rules: { "identity-maxselection": 1, multiple: false, required: false } },
  { fieldName: "Text3", fieldType: "Text", fieldIndex: 3, displayName: "Runtime Department", internalName: "RuntimeDepartment", type: "organization-picker", rules: { "identity-maxselection": 1, multiple: false, required: false } },
  { fieldName: "Text4", fieldType: "Text", fieldIndex: 4, displayName: "Runtime Attachment", internalName: "RuntimeAttachment", type: "file-upload", rules: { ver: 1, file_multiple: true, maxsize: 10, required: false } },
  { fieldName: "Text5", fieldType: "Text", fieldIndex: 5, displayName: "Runtime Image", internalName: "RuntimeImage", type: "icon-upload", rules: { controlmultiple: false, picture_size_limit: 10, required: false } },
];
const fields = fieldSpecs.map((spec) => makeField(baseField, LIST_ID, spec, spec.fieldName === "Title" ? LIST_ID : undefined));

const runtimeList = clone(baseList);
runtimeList.ListModel = {
  ...runtimeList.ListModel,
  AppID: APP_ID,
  ListID: LIST_ID,
  Title: "Custom Form Runtime Test",
  Description: "Focused list for custom list form import/open/render proof.",
  IconUrl: "{\"b\":\"#E6F0FF\",\"i\":\"fa-regular fa-window-restore\",\"c\":\"#0065FF\"}",
  Created: GENERATED_AT,
  Modified: GENERATED_AT,
  Perm: 4,
  Type: 1,
  Flags: 1,
  CustomType: `ListSite_${ROOT_ID}`,
  LayoutView: JSON.stringify({
    add: NEW_FORM_ID,
    edit: EDIT_FORM_ID,
    view: VIEW_FORM_ID,
    opentype: { edit: "slide", view: "slide" },
    modalsize: { add: 1, edit: 2, view: 0 },
  }),
  IsBreakInherit: false,
  IsDataSeparate: false,
  AdvanceList: [],
  ListType: 1,
};
runtimeList.Defs = fields;
runtimeList.Layouts = [
  listViewLayout(LIST_ID, fields),
  customFormLayout(NEW_FORM_ID, LIST_ID, "Runtime New Item Form", fields, false),
  customFormLayout(EDIT_FORM_ID, LIST_ID, "Runtime Edit Item Form", fields, false),
  customFormLayout(VIEW_FORM_ID, LIST_ID, "Runtime View Item Form", fields, true),
];
runtimeList.PublicForms = [];
runtimeList.RemindRules = [];
runtimeList.FlowMappings = [];
runtimeList.LayoutInResources = [];
runtimeList.ListDatas = {
  [String(FAMILY + 9001n)]: {
    ListDataID: String(FAMILY + 9001n),
    Title: "Runtime sample item",
    Text1: "Sample row for opening Edit/View custom forms without creating data.",
    Decimal1: 25,
    Datetime1: "2026-05-25 00:00:00",
  },
};

const data = {
  ...sourceData,
  Item: root,
  Childs: [runtimeList],
  Forms: [],
  AppGroups: [],
  OtherModules: [],
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

fs.writeFileSync(OUTPUT_YAP, `${JSON.stringify(buildWrapper(resource), null, 2)}\n`);
fs.copyFileSync(OUTPUT_YAP, DOWNLOADS_YAP);

console.log(JSON.stringify({
  status: "generated",
  packagePath: path.resolve(OUTPUT_YAP),
  downloadsPath: DOWNLOADS_YAP,
  appTitle: APP_TITLE,
  targetList: runtimeList.ListModel.Title,
  customForms: runtimeList.Layouts.filter((layout) => Number(layout.Type) === 1).map((layout) => layout.Title),
  displaySettings: parseJson(runtimeList.ListModel.LayoutView),
  fieldTypes: fields.map((field) => field.Type),
  sampleRows: Object.keys(runtimeList.ListDatas).length,
  replaceIds: resource.ReplaceIds.length,
}, null, 2));

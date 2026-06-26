import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const SOURCE_RESOURCE = "custom-code-smart-lookup-picker-test.resource.json";
const OUTPUT_YAP = "data-list-public-form-runtime-proof.v1.yap";
const DOWNLOADS_YAP = "/Users/Renger/Downloads/data-list-public-form-runtime-proof.v1.yap";

const GZIP_PREFIX = "[______gizp______]";
const FAMILY = 7493000000000000000n;
const APP_ID = 42;
const GENERATED_AT = "2026-05-25 22:10:00";
const APP_TITLE = "Data List Public Form Runtime Proof";
const APP_DESCRIPTION = "Focused generated package for Data List Public Form import/open/share-link proof.";
const ROOT_ID = String(FAMILY);
const HOME_LAYOUT_ID = String(FAMILY + 1n);
const LIST_ID = String(FAMILY + 1000n);
const PUBLIC_FORM_ID = String(FAMILY + 2001n);

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
      id: "public-form-proof-root",
      type: "container",
      label: "Container",
      attrs: {
        style: { gap: [null, "--sp--s4"], direction: [null, "column"], align_items: [null, "stretch"] },
        common: { padding: { t: [null, "--sp--s4"], r: [null, "--sp--s4"], b: [null, "--sp--s4"], l: [null, "--sp--s4"] } },
      },
      children: [{
        id: "public-form-proof-heading",
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

function fieldControl(field, index) {
  const rules = parseJson(field.Rules, {});
  return {
    id: `pf_${field.FieldName}_${index}`,
    type: field.Type,
    binding: field.FieldName,
    fieldID: field.FieldID,
    label: field.DisplayName,
    attrs: rules,
    isFilter: field.IsFilter,
    isSort: field.IsSort,
    isUnique: field.IsUnique,
    isSystem: field.IsSystem,
    status: field.Status,
    children: [],
  };
}

function publicFormResource(title, fields) {
  const controls = fields.map((field, index) => fieldControl(field, index));

  return JSON.stringify({
    children: [{
      id: "public-form-runtime-main",
      type: "container",
      label: "Container",
      attrs: {
        common: {
          padding: [null, { top: "--sp--s300", right: "--sp--s300", bottom: "--sp--s300", left: "--sp--s300" }],
        },
        style: { gap: [null, "--sp--s0"] },
      },
      children: [{
        id: "public-form-runtime-content",
        type: "container",
        label: "Container",
        attrs: {
          style: { gap: [null, "--sp--s0"] },
        },
        children: [{
          id: "public-form-runtime-grid",
          type: "flex_grid",
          label: "Grid",
          attrs: {
            ver: 1,
            columns: {
              1: { list: [{ value: 1, unit: "fr" }], last: { value: 1, unit: "fr" } },
              2: { list: [{ value: 1, unit: "fr" }], last: { value: 1, unit: "fr" } },
              3: { list: [{ value: 1, unit: "fr" }], last: { value: 1, unit: "fr" } },
            },
            rows: {
              1: { list: [{ unit: "auto" }], last: { unit: "auto" } },
            },
            cgap: { 1: 10 },
            cgapU: { 1: "px" },
          },
          displayLabel: [null, false],
          children: controls,
        }, {
          id: "public-form-runtime-submit-container",
          type: "container",
          label: "Container",
          attrs: {
            style: {
              direction: [null, "row"],
              gap: [null, "--sp--s150"],
              justify_content: [null, "center"],
              align_items: [null, "center"],
            },
          },
          children: [{
            id: "pf_submit_1",
            type: "submit-button",
            binding: null,
            fieldID: null,
            label: "Submit",
            attrs: {
              "button-style": "2",
              common: { positioning: { widthtype: [null, "2"] } },
            },
            children: [],
          }],
        }],
      }],
    }],
    attrs: { container: { cw: "2" } },
    title,
    filterVars: [],
    tempVars: [],
    pagetype: 3,
    ver: 2,
  });
}

function ensureListExportArrays(data) {
  for (const item of [data?.Item, ...(Array.isArray(data?.Childs) ? data.Childs : [])].filter(Boolean)) {
    if (!Array.isArray(item.Defs)) item.Defs = [];
    if (!Array.isArray(item.Layouts)) item.Layouts = [];
  }
}

function collectGeneratedIds(value, ids = new Set()) {
  if (typeof value === "string") {
    for (const match of value.matchAll(/\b749300\d{9,}\b/g)) ids.add(match[0]);
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
    IconUrl: "{\"b\":\"#E6F0FF\",\"i\":\"fa-regular fa-rectangle-list\",\"c\":\"#0065FF\"}",
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
  IconUrl: "{\"b\":\"#E6F0FF\",\"i\":\"fa-regular fa-rectangle-list\",\"c\":\"#0065FF\"}",
  Created: GENERATED_AT,
  Modified: GENERATED_AT,
  CustomType: "",
  LayoutView: JSON.stringify({
    add: "default",
    edit: "default",
    view: "default",
    sort: [
      { AppID: APP_ID, ListID: HOME_LAYOUT_ID, ListSetID: ROOT_ID, Type: 103, IsHidden: false, Title: "Home", Icon: "fa-regular fa-house" },
      { AppID: APP_ID, ListID: LIST_ID, ListSetID: ROOT_ID, Type: 1, IsHidden: false, Title: "Public Form Runtime Test", Icon: "fa-regular fa-rectangle-list" },
    ],
    attrs: {
      appearance: { bgc: "var(--c--primary-light)", color: "var(--c--primary)" },
      "navigator-menu": { bgc: "var(--c--primary)", color: "var(--c--primary-light)", position: "default" },
      CustomColors: [],
      CustomFonts: [],
    },
    sortVer: 1,
  }),
  Flags: 1,
  Status: 1,
  Type: 1024,
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
  { fieldName: "Title", fieldType: "Text", fieldIndex: 0, displayName: "Runtime Public Title", internalName: "RuntimePublicTitle", type: "input", isSystem: true, isIndex: true, isSort: true, isFilter: true, rules: { required: true, placeholder: "Title" } },
  { fieldName: "Text1", fieldType: "Text", fieldIndex: 1, displayName: "Single Line", internalName: "SingleLine", type: "input", rules: { required: true, placeholder: "Enter a short value", "input-maxlength": 200 } },
  { fieldName: "Text2", fieldType: "Text", fieldIndex: 2, displayName: "Multiple Line", internalName: "MultipleLine", type: "textarea", rules: { required: false, placeholder: "Enter details" } },
  { fieldName: "Decimal1", fieldType: "Decimal", fieldIndex: 1, displayName: "Number", internalName: "Number", type: "input_number", rules: { required: false, "rounded-to": 0, number_min: 0, number_max: 9999 } },
  { fieldName: "Decimal2", fieldType: "Decimal", fieldIndex: 2, displayName: "Percent", internalName: "Percent", type: "percent", rules: { required: false, "rounded-to": 2, number_min: 0, number_max: 100 } },
  { fieldName: "Bit1", fieldType: "Bit", fieldIndex: 1, displayName: "Switch", internalName: "Switch", type: "switch", defaultValue: "false", rules: { required: false } },
  { fieldName: "Text3", fieldType: "Text", fieldIndex: 3, displayName: "Radio Choice", internalName: "RadioChoice", type: "radio", rules: { required: false, choices: ["Option A", "Option B"] } },
  { fieldName: "Datetime1", fieldType: "Datetime", fieldIndex: 1, displayName: "Date", internalName: "Date", type: "datepicker", rules: { required: false, placeholder: "Select date", showtime: false } },
  { fieldName: "Datetime2", fieldType: "Datetime", fieldIndex: 2, displayName: "Time", internalName: "Time", type: "time", rules: { required: false, placeholder: "Select time" } },
  { fieldName: "Text4", fieldType: "Text", fieldIndex: 4, displayName: "Hyperlink", internalName: "Hyperlink", type: "hyperlink", rules: { required: false, placeholder: "https://example.com" } },
];
const fields = fieldSpecs.map((spec) => makeField(baseField, LIST_ID, spec, spec.fieldName === "Title" ? LIST_ID : undefined));

const runtimeList = clone(baseList);
runtimeList.ListModel = {
  ...runtimeList.ListModel,
  AppID: APP_ID,
  ListID: LIST_ID,
  Title: "Public Form Runtime Test",
  Description: "Focused list for Data List Public Form import/open/share-link proof.",
  IconUrl: "{\"b\":\"#E6F0FF\",\"i\":\"fa-regular fa-rectangle-list\",\"c\":\"#0065FF\"}",
  Created: GENERATED_AT,
  Modified: GENERATED_AT,
  Perm: 4,
  Type: 1,
  Flags: 1,
  Status: 1,
  CustomType: `ListSite_${ROOT_ID}`,
  LayoutView: JSON.stringify({}),
  IsBreakInherit: false,
  IsDataSeparate: false,
  AdvanceList: [],
  ListType: 1,
};
runtimeList.Defs = fields;
runtimeList.Layouts = [listViewLayout(LIST_ID, fields)];
runtimeList.PublicForms = [{
  ListID: LIST_ID,
  ID: PUBLIC_FORM_ID,
  Type: 0,
  Name: "Runtime Public Form",
  Desc: "Focused generated public form for import/open/share-link proof.",
  Ext: null,
  ExpiredTip: null,
  RefId: LIST_ID,
  Resource: publicFormResource("Runtime Public Form", fields),
}];
runtimeList.RemindRules = [];
runtimeList.FlowMappings = [];
runtimeList.LayoutInResources = [];
runtimeList.ListDatas = {};

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
  publicForms: runtimeList.PublicForms.map((form) => form.Name),
  fieldTypes: fields.map((field) => field.Type),
  submitControls: 1,
  replaceIds: resource.ReplaceIds.length,
}, null, 2));

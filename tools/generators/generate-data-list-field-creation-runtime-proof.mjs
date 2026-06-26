import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";

const SOURCE_RESOURCE = "custom-code-smart-lookup-picker-test.resource.json";
const OUTPUT_YAP = "data-list-field-creation-runtime-proof.v1.yap";
const DOWNLOADS_YAP = "/Users/Renger/Downloads/data-list-field-creation-runtime-proof.v1.yap";

const GZIP_PREFIX = "[______gizp______]";
const FAMILY = 7461000000000000000n;
const APP_ID = 41;
const GENERATED_AT = "2026-05-25 15:45:00";
const APP_TITLE = "Data List Field Creation Runtime Proof";
const APP_DESCRIPTION = "Focused generated package for runtime proof of representative Data List field creation/import/open behavior.";
const ROOT_ID = String(FAMILY);
const HOME_LAYOUT_ID = String(FAMILY + 1n);
const MAIN_LIST_ID = String(FAMILY + 1000n);
const LOOKUP_LIST_ID = String(FAMILY + 2000n);

let nextIdOffset = 3000n;

function nextId() {
  nextIdOffset += 1n;
  return String(FAMILY + nextIdOffset);
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

function makeField(template, listId, spec, fieldId) {
  const displayName = spec.displayName;
  return {
    ...template,
    FieldID: fieldId || nextId(),
    ListID: listId,
    FieldName: spec.fieldName,
    FieldType: spec.fieldType,
    FieldIndex: spec.fieldIndex,
    DisplayName: displayName,
    InternalName: sanitizeInternalName(spec.internalName || displayName),
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
    Title: displayName,
  };
}

function makeLayout(listId, title, fields) {
  const layoutId = nextId();
  const visibleFields = fields.filter((field) => field.Type !== "textarea");
  const layout = {
    LayoutID: layoutId,
    Type: 0,
    Title: `${title} View`,
    IsDefault: true,
    ListID: listId,
    LayoutView: JSON.stringify({
      layout: visibleFields.map((field, index) => ({
        FieldID: field.FieldID,
        FieldName: field.FieldName,
        Mobile: index === 0 ? 2 : 0,
        Order: index,
        Show: index < 12,
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
  return layout;
}

function makeList(baseList, { listId, title, description, fields, rows }) {
  const list = clone(baseList);
  list.ListModel = {
    ...list.ListModel,
    AppID: APP_ID,
    ListID: listId,
    Title: title,
    Description: description,
    IconUrl: "{\"b\":\"#E6F0FF\",\"i\":\"fa-regular fa-table-list\",\"c\":\"#0065FF\"}",
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
    Perm: 4,
    Type: 1,
    Flags: 1,
    CustomType: `ListSite_${ROOT_ID}`,
    LayoutView: JSON.stringify({
      sort: [{ SortName: "Created", SortByDesc: true }],
    }),
    IsBreakInherit: false,
    IsDataSeparate: false,
    AdvanceList: [],
    ListType: 1,
  };
  list.Defs = fields;
  list.Layouts = [makeLayout(listId, title, fields)];
  list.PublicForms = [];
  list.RemindRules = [];
  list.FlowMappings = [];
  list.LayoutInResources = [];
  list.ListDatas = rows || {};
  return list;
}

function simplePageResource() {
  return JSON.stringify({
    children: [
      {
        id: "data-list-field-proof-root",
        type: "container",
        label: "Container",
        attrs: {
          style: { gap: [null, "--sp--s4"], direction: [null, "column"], align_items: [null, "stretch"] },
          common: { padding: { t: [null, "--sp--s4"], r: [null, "--sp--s4"], b: [null, "--sp--s4"], l: [null, "--sp--s4"] } },
        },
        children: [
          {
            id: "data-list-field-proof-title",
            type: "heading",
            label: "Text",
            attrs: {
              headc: { title: { value: APP_TITLE, variable: null } },
              heads: { ty: [null, "xl-semibold"], color: "var(--c--text)" },
            },
            children: [],
            nv_label: "Runtime proof title",
          },
          {
            id: "data-list-field-proof-note",
            type: "heading",
            label: "Text",
            attrs: {
              headc: { title: { value: "Open Field Creation Runtime Test, inspect columns/settings, then add one simple field.", variable: null } },
              heads: { ty: [null, "s-regular"], color: "var(--c--neutral-dark-hover)" },
            },
            children: [],
            nv_label: "Runtime proof scope",
          },
        ],
        nv_label: "Main",
      },
    ],
    attrs: {
      hideHeaderAll: true,
      common: { padding: { t: [null, "--sp--s0"], r: [null, "--sp--s0"], b: [null, "--sp--s0"], l: [null, "--sp--s0"] } },
    },
    title: "Home",
    filterVars: [],
    tempVars: [],
    ver: "2.0",
  });
}

function collectGeneratedIds(value, ids = new Set()) {
  if (typeof value === "string") {
    for (const match of value.matchAll(/\b746100\d{9,}\b/g)) ids.add(match[0]);
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
    IconUrl: "{\"b\":\"#E6F0FF\",\"i\":\"fa-regular fa-table-list\",\"c\":\"#0065FF\"}",
    IsListSet: true,
    Resource: `${GZIP_PREFIX}${zlib.gzipSync(Buffer.from(JSON.stringify(resource), "utf8")).toString("base64")}`,
  };
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
  IconUrl: "{\"b\":\"#E6F0FF\",\"i\":\"fa-regular fa-table-list\",\"c\":\"#0065FF\"}",
  Created: GENERATED_AT,
  Modified: GENERATED_AT,
  CustomType: "",
  LayoutView: JSON.stringify({
    add: "default",
    edit: "default",
    view: "default",
    sort: [
      { AppID: APP_ID, ListID: HOME_LAYOUT_ID, ListSetID: ROOT_ID, Type: 103, IsHidden: false, Title: "Home", Icon: "fa-regular fa-house" },
      { AppID: APP_ID, ListID: MAIN_LIST_ID, ListSetID: ROOT_ID, Type: 1, IsHidden: false, Title: "Field Creation Runtime Test", Icon: "fa-regular fa-table-list" },
      { AppID: APP_ID, ListID: LOOKUP_LIST_ID, ListSetID: ROOT_ID, Type: 1, IsHidden: false, Title: "Lookup Source Runtime Test", Icon: "fa-regular fa-list" },
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
root.Layouts = [
  {
    ...(root.Layouts?.[0] || {}),
    LayoutID: HOME_LAYOUT_ID,
    Type: 103,
    Title: "Home",
    IsDefault: true,
    ListID: ROOT_ID,
    LayoutView: null,
    LayoutInResources: [{ ID: HOME_LAYOUT_ID, RefId: HOME_LAYOUT_ID, Resource: simplePageResource() }],
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
  },
];

const lookupTitleField = makeField(baseField, LOOKUP_LIST_ID, {
  fieldName: "Title",
  fieldType: "Text",
  fieldIndex: 0,
  displayName: "Lookup Source Name",
  internalName: "LookupSourceName",
  type: "input",
  isSystem: true,
  isIndex: true,
  isSort: true,
  isFilter: true,
  rules: { required: true, placeholder: "Source item" },
}, LOOKUP_LIST_ID);
const lookupTextField = makeField(baseField, LOOKUP_LIST_ID, {
  fieldName: "Text1",
  fieldType: "Text",
  fieldIndex: 1,
  displayName: "Lookup Source Code",
  internalName: "LookupSourceCode",
  type: "input",
  isFilter: true,
  rules: { required: false, placeholder: "Code" },
});
const lookupSourceList = makeList(baseList, {
  listId: LOOKUP_LIST_ID,
  title: "Lookup Source Runtime Test",
  description: "Local lookup source list for the Data List field creation runtime proof.",
  fields: [lookupTitleField, lookupTextField],
  rows: {
    [String(FAMILY + 9001n)]: {
      ListDataID: String(FAMILY + 9001n),
      Title: "Runtime Source A",
      Text1: "SRC-A",
    },
    [String(FAMILY + 9002n)]: {
      ListDataID: String(FAMILY + 9002n),
      Title: "Runtime Source B",
      Text1: "SRC-B",
    },
  },
});

const mainSpecs = [
  { fieldName: "Title", fieldType: "Text", fieldIndex: 0, displayName: "Runtime Record Name", internalName: "RuntimeRecordName", type: "input", isSystem: true, isIndex: true, isSort: true, isFilter: true, rules: { required: true, placeholder: "Runtime record" } },
  { fieldName: "Text1", fieldType: "Text", fieldIndex: 1, displayName: "Runtime Notes", internalName: "RuntimeNotes", type: "textarea", rules: { required: false, placeholder: "Longer notes" } },
  { fieldName: "Decimal1", fieldType: "Decimal", fieldIndex: 1, displayName: "Runtime Quantity", internalName: "RuntimeQuantity", type: "input_number", isFilter: true, rules: { required: false, "rounded-to": 0, displayThousandths: "1", number_min: 0, number_max: 9999 } },
  { fieldName: "Decimal2", fieldType: "Decimal", fieldIndex: 2, displayName: "Runtime Budget", internalName: "RuntimeBudget", type: "currency", rules: { currencyCode: "USD", displayFormat: "code", displayThousandths: "1", "rounded-to": 2, required: false } },
  { fieldName: "Decimal3", fieldType: "Decimal", fieldIndex: 3, displayName: "Runtime Completion Percent", internalName: "RuntimeCompletionPercent", type: "percent", rules: { "rounded-to": 2, required: false, number_min: 0, number_max: 1 } },
  { fieldName: "Bit1", fieldType: "Bit", fieldIndex: 1, displayName: "Runtime Approved Flag", internalName: "RuntimeApprovedFlag", type: "switch", isFilter: true, rules: { required: false, displayStyle: "default" } },
  { fieldName: "Text2", fieldType: "Text", fieldIndex: 2, displayName: "Runtime Choice", internalName: "RuntimeChoice", type: "checkbox", isFilter: true, rules: { choices: ["Alpha", "Beta", "Gamma"], color_choices: ["#2563EB", "#16A34A", "#F97316"], displayStyle: "checkbox", required: false } },
  { fieldName: "Datetime1", fieldType: "Datetime", fieldIndex: 1, displayName: "Runtime Due Date", internalName: "RuntimeDueDate", type: "datepicker", isFilter: true, rules: { required: false, placeholder: "Select date", showtime: false } },
  { fieldName: "Datetime2", fieldType: "Datetime", fieldIndex: 2, displayName: "Runtime Due Time", internalName: "RuntimeDueTime", type: "time", rules: { required: false, dateformat: "1", minuteStep: 5 } },
  { fieldName: "Text3", fieldType: "Text", fieldIndex: 3, displayName: "Runtime Owner", internalName: "RuntimeOwner", type: "identity-picker", rules: { "identity-maxselection": 1, multiple: false, required: false } },
  { fieldName: "Text4", fieldType: "Text", fieldIndex: 4, displayName: "Runtime Department", internalName: "RuntimeDepartment", type: "organization-picker", rules: { "identity-maxselection": 1, multiple: false, required: false } },
  { fieldName: "Text5", fieldType: "Text", fieldIndex: 5, displayName: "Runtime Attachment", internalName: "RuntimeAttachment", type: "file-upload", rules: { ver: 1, file_multiple: true, maxsize: 10, required: false } },
  { fieldName: "Text6", fieldType: "Text", fieldIndex: 6, displayName: "Runtime Image", internalName: "RuntimeImage", type: "icon-upload", rules: { controlmultiple: false, picture_size_limit: 10, required: false } },
  { fieldName: "Text7", fieldType: "Text", fieldIndex: 7, displayName: "Runtime Lookup", internalName: "RuntimeLookup", type: "lookup", isFilter: true, rules: { "max-selection": 1, appid: APP_ID, listsetid: ROOT_ID, listid: LOOKUP_LIST_ID, listfield: "Title", list_tooltip_field: null, addition: [{ FieldName: "Text1", FieldID: lookupTextField.FieldID, IsShow: true, RelationName: "", Value: null, Order: "0" }], "sort-first": { SortName: "Title", SortByDesc: false }, "sort-second": null, listfilter: null, "search-scope": null, "search-fields": ["Title", "Text1"], placeholder: "Select source", required: false } },
  { fieldName: "Decimal4", fieldType: "Decimal", fieldIndex: 4, displayName: "Runtime Total Estimate", internalName: "RuntimeTotalEstimate", type: "calculated-column", status: 3, rules: { calculated_result: { type: "number", attrs: { "rounded-to": 2 } }, calculated: [{ exprType: "list_field", valueType: "number", prop: "Decimal1", id: "__customListFields_RuntimeQuantity", type: "expr", name: "Runtime Quantity" }, { type: "op", op: "*" }, { exprType: "list_field", valueType: "number", prop: "Decimal2", id: "__customListFields_RuntimeBudget", type: "expr", name: "Runtime Budget" }] } },
  { fieldName: "Text8", fieldType: "Text", fieldIndex: 8, displayName: "Runtime Sub List", internalName: "RuntimeSubList", type: "list", rules: { required: false, "list-variables": [{ idx: "1", id: "RuntimeLineText", name: "Line Text", type: "text", editable: true }, { idx: "2", id: "RuntimeLineAmount", name: "Line Amount", type: "number", editable: true }, { idx: "3", id: "RuntimeLineDone", name: "Line Done", type: "boolean", editable: true }] } },
];
const mainFields = mainSpecs.map((spec) => makeField(baseField, MAIN_LIST_ID, spec, spec.fieldName === "Title" ? MAIN_LIST_ID : undefined));
const mainList = makeList(baseList, {
  listId: MAIN_LIST_ID,
  title: "Field Creation Runtime Test",
  description: "Representative Data List field subset used to prove import/open/field-creation behavior.",
  fields: mainFields,
  rows: {},
});

const data = {
  ...sourceData,
  Item: root,
  Childs: [mainList, lookupSourceList],
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
  lists: [
    { title: mainList.ListModel.Title, fields: mainList.Defs.length },
    { title: lookupSourceList.ListModel.Title, fields: lookupSourceList.Defs.length },
  ],
  representativeTypes: mainFields.map((field) => field.Type),
  replaceIds: resource.ReplaceIds.length,
}, null, 2));

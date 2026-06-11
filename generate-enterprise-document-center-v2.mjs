import fs from "node:fs";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const SOURCE_EXPORT = process.argv[2] || "/Users/Renger/Downloads/Document Library Sample.yap";
const OUT_PREFIX = "enterprise-document-center-v2-folders";
const OUT_RESOURCE = `${OUT_PREFIX}.resource.json`;
const OUT_APP_DEF = `${OUT_PREFIX}.app-def.json`;
const OUT_YAP = `${OUT_PREFIX}.yap`;
const OUT_REPORT = `${OUT_PREFIX}.generation-report.json`;
const TITLE = "Enterprise Document Center";
const DESCRIPTION = "Document Library v2 generation package with multiple Type 16 document libraries, custom fields, custom views, and generated folder rows. Contains no uploaded files or document binaries.";
const GENERATED_AT = "2026-05-18 20:35:00";
const ID_BASE = 2065000000001000000n;

function quoteLargeIntegers(jsonText, largeNumbers = new Set()) {
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
      while (j < jsonText.length && jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (j < jsonText.length && /[0-9eE+\-.]/.test(jsonText[j])) j += 1;
        out += jsonText.slice(start, j);
      } else {
        const token = jsonText.slice(start, j);
        if (LARGE_INTEGER_RE.test(token)) {
          largeNumbers.add(token);
          out += `"${token}"`;
        } else {
          out += token;
        }
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJson(text, largeNumbers) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function decodeYap(filePath) {
  const largeNumbers = new Set();
  const wrapper = parseJson(fs.readFileSync(filePath, "utf8"), largeNumbers);
  if (!wrapper.Resource || !wrapper.Resource.startsWith(GZIP_PREFIX)) throw new Error("Unsupported .yap Resource wrapper");
  const resource = parseJson(zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"), largeNumbers);
  const data = parseJson(resource.Data, largeNumbers);
  return { wrapper, resource, data };
}

function nextId() {
  const id = String(ID_BASE + BigInt(idOffset));
  idOffset += 1;
  return id;
}

function parseRules(field) {
  try {
    return JSON.parse(field.Rules || "{}");
  } catch {
    return {};
  }
}

function stringifyRules(rules) {
  return JSON.stringify(rules);
}

function createCustomField(baseField, spec, listId, fieldId, fieldIndex) {
  const field = clone(baseField);
  field.FieldID = fieldId;
  field.ListID = listId;
  field.FieldName = spec.fieldName;
  field.DisplayName = spec.displayName;
  field.InternalName = spec.internalName || spec.fieldName;
  field.FieldType = spec.fieldType;
  field.Type = spec.controlType;
  field.Status = 1;
  field.FieldIndex = fieldIndex;
  field.Category = 0;
  field.DefaultValue = null;
  field.Rules = stringifyRules(spec.rules || { displayLabel: true });
  field.IsSystem = false;
  field.IsUnique = false;
  field.IsSort = spec.isSort !== false;
  field.IsIndex = spec.isIndex !== false;
  field.IsFilter = spec.isFilter !== false;
  field.IsIndexCreated = spec.isIndexCreated !== false;
  field.Created = GENERATED_AT;
  field.Modified = GENERATED_AT;
  field.Ext1 = null;
  field.Ext2 = null;
  field.Ext3 = null;
  return field;
}

function viewColumn(field, order, show = true) {
  return {
    FieldID: field.FieldID,
    DisplayName: field.DisplayName,
    FieldName: field.FieldName,
    Show: show,
    Order: order,
    Type: field.Type,
    Mobile: 0,
    Rules: parseRules(field),
  };
}

function viewQuery(field) {
  return {
    FieldName: field.FieldName,
    ID: field.FieldID,
    Name: field.DisplayName,
    Type: field.Type,
  };
}

function createView({ layoutId, listId, title, url, fields, visibleNames, sort = [], filter = [] }, baseLayout) {
  const fieldByName = new Map(fields.map((field) => [field.FieldName, field]));
  const visibleFields = visibleNames.map((name) => {
    const field = fieldByName.get(name);
    if (!field) throw new Error(`View ${title} references missing field ${name}`);
    return field;
  });
  return {
    ...clone(baseLayout),
    LayoutID: layoutId,
    ListID: listId,
    Type: 0,
    Title: title,
    LayoutView: JSON.stringify({
      layout: visibleFields.map((field, index) => viewColumn(field, index + 1, true)),
      query: visibleFields.map(viewQuery),
      sort,
      filter,
      rowColor: [],
    }),
    Ext1: JSON.stringify({ Url: url }),
    Ext2: null,
    Ext3: null,
    IsDefault: false,
    IsItemPerm: false,
    LayoutInResources: null,
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
  };
}

function createUploadForm(baseForm, listId, layoutId, title, uploadField) {
  const form = clone(baseForm);
  form.LayoutID = layoutId;
  form.ListID = listId;
  form.Title = title;
  form.LayoutView = null;
  form.Created = GENERATED_AT;
  form.Modified = GENERATED_AT;
  form.Ext2 = JSON.stringify({ src: true });
  const resource = JSON.parse(form.LayoutInResources[0].Resource);
  resource.title = title;
  const uploadControl = resource.children.find((child) => child.binding === "Text4" || child.type === "file-upload");
  if (!uploadControl) throw new Error("Base New file form has no upload control");
  uploadControl.fieldID = uploadField.FieldID;
  uploadControl.binding = "Text4";
  uploadControl.label = uploadField.DisplayName;
  form.LayoutInResources = [{
    ID: layoutId,
    RefId: layoutId,
    Resource: JSON.stringify(resource),
  }];
  return form;
}

function folderUniqueName(parentId, title) {
  return `${parentId}_${title.toLowerCase()}`;
}

function createFolderRow(folderId, title, customFields) {
  const row = {
    ListDataID: folderId,
    Title: title,
    Bigint1: "0",
    Text1: "folder",
    Bigint2: "",
    Text2: "",
    Text3: folderUniqueName("0", title),
  };

  for (const field of customFields) row[field.FieldName] = "";
  return row;
}

function createLibrary(baseLibrary, spec, rootId, baseDefaultView, baseForm, textBaseField) {
  const listId = nextId();
  const defaultViewId = nextId();
  const formId = nextId();
  const baseFieldNames = ["Title", "Bigint1", "Text1", "Bigint2", "Text2", "Text3", "Text4"];
  const fieldIdByName = new Map(baseFieldNames.map((fieldName) => [fieldName, nextId()]));

  const library = clone(baseLibrary);
  library.ListModel.ListID = listId;
  library.ListModel.Title = spec.title;
  library.ListModel.Description = spec.purpose;
  library.ListModel.Type = 16;
  library.ListModel.CustomType = `ListSite_${rootId}`;
  library.ListModel.Created = GENERATED_AT;
  library.ListModel.Modified = GENERATED_AT;
  library.ListModel.LayoutView = null;
  library.ListDatas = {};
  library.FlowMappings = [];
  library.PublicForms = [];
  library.RemindRules = [];

  library.Defs = library.Defs
    .filter((field) => baseFieldNames.includes(field.FieldName))
    .sort((a, b) => baseFieldNames.indexOf(a.FieldName) - baseFieldNames.indexOf(b.FieldName))
    .map((field) => {
      const cloned = clone(field);
      cloned.FieldID = fieldIdByName.get(field.FieldName);
      cloned.ListID = listId;
      cloned.Created = GENERATED_AT;
      cloned.Modified = GENERATED_AT;
      return cloned;
    });

  const customFields = spec.fields.map((fieldSpec, index) => createCustomField(
    textBaseField,
    fieldSpec,
    listId,
    nextId(),
    5 + index,
  ));
  library.Defs.push(...customFields);
  library.ListDatas = Object.fromEntries((spec.folders || []).map((folderTitle) => {
    const folderId = nextId();
    return [folderId, createFolderRow(folderId, folderTitle, customFields)];
  }));

  const uploadField = library.Defs.find((field) => field.FieldName === "Text4");
  library.Layouts = [
    {
      ...clone(baseDefaultView),
      LayoutID: defaultViewId,
      ListID: listId,
      Type: 0,
      Title: "",
      LayoutView: "",
      Created: GENERATED_AT,
      Modified: GENERATED_AT,
      Ext1: JSON.stringify({ Url: "default" }),
      IsDefault: true,
      LayoutInResources: null,
    },
    createUploadForm(baseForm, listId, formId, "New file", uploadField),
  ];

  for (const viewSpec of spec.views) {
    const filter = viewSpec.statusEquals ? [{
      key: viewSpec.key,
      pre: "and",
      left: viewSpec.statusField || "Text10",
      op: "0",
      right: viewSpec.statusEquals,
    }] : [];
    const sort = viewSpec.sort || [];
    library.Layouts.push(createView({
      layoutId: nextId(),
      listId,
      title: viewSpec.title,
      url: viewSpec.url,
      fields: library.Defs,
      visibleNames: viewSpec.visible,
      sort,
      filter,
    }, baseDefaultView));
  }

  return library;
}

const librarySpecs = [
  {
    title: "Company Policies",
    purpose: "Store HR, IT, Finance, and compliance policies.",
    fields: [
      { fieldName: "Text5", displayName: "Department", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Text6", displayName: "Policy Category", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Datetime1", displayName: "Effective Date", fieldType: "Datetime", controlType: "datepicker", rules: { displayLabel: true, showtime: false, dateformat: "0" } },
      { fieldName: "Datetime2", displayName: "Review Date", fieldType: "Datetime", controlType: "datepicker", rules: { displayLabel: true, showtime: false, dateformat: "0" } },
      { fieldName: "Text7", displayName: "Owner", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Text8", displayName: "Status", fieldType: "Text", controlType: "radio", rules: { displayLabel: true, choices: ["Draft", "Active", "Pending Review", "Archived"] } },
    ],
    folders: [
      "HR Policies",
      "IT Policies",
      "Finance Policies",
      "Compliance Policies",
    ],
    views: [
      { title: "All Policies", url: "all-policies", visible: ["Title", "Text5", "Text6", "Datetime1", "Datetime2", "Text7", "Text8"], sort: [{ SortName: "Title", SortByDesc: false }] },
      { title: "Active Policies", url: "active-policies", visible: ["Title", "Text5", "Text6", "Datetime1", "Text7", "Text8"], statusField: "Text8", statusEquals: "Active", key: "company-policies-active" },
      { title: "Policies Pending Review", url: "policies-pending-review", visible: ["Title", "Text5", "Text6", "Datetime2", "Text7", "Text8"], statusField: "Text8", statusEquals: "Pending Review", key: "company-policies-pending-review" },
      { title: "By Department", url: "policies-by-department", visible: ["Text5", "Title", "Text6", "Text7", "Text8"], sort: [{ SortName: "Text5", SortByDesc: false }] },
    ],
  },
  {
    title: "Project Documents",
    purpose: "Store project-related files such as requirements, contracts, meeting notes, and delivery documents.",
    fields: [
      { fieldName: "Text5", displayName: "Project Name", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Text6", displayName: "Document Category", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Text7", displayName: "Customer", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Text8", displayName: "Version", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Text9", displayName: "Owner", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Text10", displayName: "Status", fieldType: "Text", controlType: "radio", rules: { displayLabel: true, choices: ["Draft", "Active", "Latest", "Archived"] } },
    ],
    folders: [
      "Requirements",
      "Contracts",
      "Meeting Notes",
      "Deliverables",
    ],
    views: [
      { title: "All Project Documents", url: "all-project-documents", visible: ["Title", "Text5", "Text6", "Text7", "Text8", "Text9", "Text10"], sort: [{ SortName: "Text5", SortByDesc: false }] },
      { title: "By Project", url: "by-project", visible: ["Text5", "Title", "Text6", "Text8", "Text9", "Text10"], sort: [{ SortName: "Text5", SortByDesc: false }] },
      { title: "Contracts", url: "contracts", visible: ["Title", "Text5", "Text7", "Text8", "Text9", "Text10"], statusField: "Text6", statusEquals: "Contracts", key: "project-documents-contracts" },
      { title: "Latest Versions", url: "latest-versions", visible: ["Title", "Text5", "Text6", "Text8", "Text9", "Text10"], statusField: "Text10", statusEquals: "Latest", key: "project-documents-latest" },
    ],
  },
  {
    title: "Templates and Forms",
    purpose: "Store reusable company templates and standard forms.",
    fields: [
      { fieldName: "Text5", displayName: "Template Type", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Text6", displayName: "Department", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Text7", displayName: "Version", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Text8", displayName: "Approved By", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Text9", displayName: "Status", fieldType: "Text", controlType: "radio", rules: { displayLabel: true, choices: ["Draft", "Active", "Retired"] } },
    ],
    folders: [
      "HR Forms",
      "Finance Forms",
      "Project Templates",
      "Legal Templates",
    ],
    views: [
      { title: "All Templates", url: "all-templates", visible: ["Title", "Text5", "Text6", "Text7", "Text8", "Text9"], sort: [{ SortName: "Title", SortByDesc: false }] },
      { title: "Active Templates", url: "active-templates", visible: ["Title", "Text5", "Text6", "Text7", "Text8", "Text9"], statusField: "Text9", statusEquals: "Active", key: "templates-active" },
      { title: "By Department", url: "templates-by-department", visible: ["Text6", "Title", "Text5", "Text7", "Text9"], sort: [{ SortName: "Text6", SortByDesc: false }] },
    ],
  },
];

let idOffset = 0;
const decoded = decodeYap(SOURCE_EXPORT);
const sourceData = decoded.data;
const sourceRoot = sourceData.Item;
const sourceLibrary = sourceData.Childs.find((child) => Number(child.ListModel?.Type) === 16 && child.ListModel?.Title === "New Document Library");
if (!sourceLibrary) throw new Error("New Document Library base resource was not found in source export");

const rootId = nextId();
const root = clone(sourceRoot);
root.ListModel.ListID = rootId;
root.ListModel.Title = TITLE;
root.ListModel.Description = DESCRIPTION;
root.ListModel.IconUrl = "{\"b\":\"#2d7ff9\",\"i\":\"*text*\",\"c\":\"#fff\"}";
root.ListModel.Created = GENERATED_AT;
root.ListModel.Modified = GENERATED_AT;
root.ListModel.CustomType = "";
root.Layouts = [];
root.Defs = [];
root.ListDatas = {};

const baseDefaultView = sourceLibrary.Layouts.find((layout) => Number(layout.Type) === 0);
const baseForm = sourceLibrary.Layouts.find((layout) => Number(layout.Type) === 1 && layout.Title === "New file");
const textBaseField = sourceLibrary.Defs.find((field) => field.FieldName === "Title");
if (!baseDefaultView || !baseForm || !textBaseField) throw new Error("Base document library is missing required view/form/field templates");

const data = {
  Item: root,
  Childs: librarySpecs.map((spec) => createLibrary(sourceLibrary, spec, rootId, baseDefaultView, baseForm, textBaseField)),
  Forms: [],
  OtherModules: [],
  FormReports: [],
  DataReports: [],
  FormNewReports: [],
  AppGroups: [],
  AppThemes: [],
  AppTags: [],
  AppMetadatas: [],
  AppComponents: [],
  PortalInfo: null,
};

root.ListModel.LayoutView = JSON.stringify({
  add: "default",
  edit: "default",
  view: "default",
  sort: data.Childs.map((child) => ({
    AppID: 41,
    ListID: child.ListModel.ListID,
    ListSetID: rootId,
    Type: 16,
    Title: child.ListModel.Title,
  })),
  sortVer: 1,
});

function collectIds(value, ids = new Set(), key = "") {
  if (["TenantID", "CreatedBy", "ModifiedBy"].includes(key)) return ids;
  if (typeof value === "string" && LARGE_INTEGER_RE.test(value)) ids.add(value);
  else if (Array.isArray(value)) value.forEach((item) => collectIds(item, ids));
  else if (value && typeof value === "object") Object.entries(value).forEach(([childKey, child]) => collectIds(child, ids, childKey));
  return ids;
}

const resource = {
  ...clone(decoded.resource),
  MainListType: 1024,
  AppID: 41,
  ReportIds: [],
  FormKeys: [],
  SimplePortal: null,
  ReplaceIds: [...collectIds(data)].filter((id) => id.startsWith(String(ID_BASE).slice(0, 4))).sort(),
  Data: JSON.stringify(data),
};

fs.writeFileSync(OUT_APP_DEF, `${JSON.stringify(data, null, 2)}\n`);
fs.writeFileSync(OUT_RESOURCE, `${JSON.stringify(resource, null, 2)}\n`);

const buildOutput = execFileSync("node", [
  "build-yap-wrapper.js",
  OUT_RESOURCE,
  OUT_YAP,
  "--title",
  TITLE,
  "--description",
  DESCRIPTION,
], { encoding: "utf8" });

const report = {
  status: "pass",
  source: SOURCE_EXPORT,
  strategy: "document-library-v2-multi-library-custom-fields-views-root-folder-rows",
  outputs: { resource: OUT_RESOURCE, appDef: OUT_APP_DEF, yap: OUT_YAP },
  rootId,
  generatedIdFamily: String(ID_BASE).slice(0, 4),
  folderRowsGenerated: true,
  folderPlanRuntimeOnly: false,
  documentLibraries: data.Childs.map((child) => ({
    title: child.ListModel.Title,
    listId: child.ListModel.ListID,
    type: child.ListModel.Type,
    nativeFields: child.Defs.slice(0, 7).map((field) => field.FieldName),
    customFields: child.Defs.slice(7).map((field) => ({
      fieldName: field.FieldName,
      displayName: field.DisplayName,
      fieldType: field.FieldType,
      controlType: field.Type,
    })),
    folders: Object.values(child.ListDatas || {}).map((row) => ({
      listDataId: row.ListDataID,
      title: row.Title,
      parentId: row.Bigint1,
      type: row.Text1,
      uniqueName: row.Text3,
    })),
    views: child.Layouts.filter((layout) => Number(layout.Type) === 0).map((layout) => ({
      title: layout.Title || "Default",
      layoutView: layout.LayoutView,
    })),
    forms: child.Layouts.filter((layout) => Number(layout.Type) === 1).map((layout) => layout.Title),
    containsListRows: Object.keys(child.ListDatas || {}).length > 0,
    containsUploadedRows: Object.values(child.ListDatas || {}).some((row) => Boolean(row && row.Text4)),
  })),
  build: JSON.parse(buildOutput),
};
fs.writeFileSync(OUT_REPORT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

import fs from "node:fs";
import crypto from "node:crypto";

const sourcePath = "visitor-access-management-app-def.v11-five-fields-multitype.json";
const outAppPath = "heep-hong-it-eworkflow-option-a-app-def.v8.json";
const outFormDefPath = "heep-hong-it-eworkflow-option-a-purchase-requisition-approval-form-def.v8.json";
const reportPath = "heep-hong-it-eworkflow-option-a-generation-report.v8.json";

const oldPrefix = "216";
const newPrefix = "224";
const rootId = `${newPrefix}0000000000000001`;
const overviewLayoutId = `${newPrefix}0000000000001901`;
const formKey = "HHP";
const processId = `${newPrefix}0030000000000001`;
const iconUrl = JSON.stringify({ b: "#fef2f2", i: "fa-regular fa-laptop-code", c: "#c1121f" });

const now = "2026-05-12 09:30:00";
const includeSampleData = false;
const userId = "1697103066163843073";
const tenantId = "1697103066096734208";
const appId = 41;

const src = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
let app = JSON.parse(JSON.stringify(src).replaceAll(oldPrefix, newPrefix).replaceAll("VBB", formKey).replaceAll("vbb-", "hhi-"));
let data = JSON.parse(app.Data);

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function id(listIndex, suffix) {
  return `${newPrefix}${String(listIndex).padStart(3, "0")}${suffix}`;
}

function makeField(listId, listIndex, fieldIndex, fieldName, displayName, internalName, fieldType = "Text", type = "input", rules = null) {
  const isTitleField = fieldName === "Title";
  return {
    FieldID: id(listIndex, String(1000 + fieldIndex).padStart(13, "0")),
    ListID: listId,
    FieldName: fieldName,
    FieldType: fieldType,
    FieldIndex: fieldIndex - 1,
    DisplayName: displayName,
    InternalName: internalName,
    DisplayName_EN: null,
    Type: type,
    Status: isTitleField ? 0 : 1,
    Category: 0,
    DefaultValue: null,
    Rules: rules,
    TenantID: tenantId,
    AppID: appId,
    IsSort: false,
    IsIndex: isTitleField,
    IsFilter: ["Title", "Text1", "Text2", "Text4", "Text5"].includes(fieldName),
    IsIndexCreated: false,
    IsSystem: isTitleField,
    IsUnique: false,
    Created: now,
    Modified: now,
    CreatedBy: userId,
    ModifiedBy: userId,
    Ext1: null,
    Ext2: null,
    Ext3: null
  };
}

function makeTextRules(placeholder, required = false, maxLength = 200) {
  return JSON.stringify({ required, placeholder, "input-maxlength": maxLength });
}

function makeTextareaRules(placeholder, required = false) {
  return JSON.stringify({ required, placeholder, "input-maxlength": 2000 });
}

function makeChoiceRules(choices, displayStyle = "dropdown", placeholder = "Select value", required = false) {
  return JSON.stringify({ required, placeholder, displayStyle, choices });
}

function makeSwitchRules() {
  return JSON.stringify({});
}

function makeDateRules(placeholder, showtime = false) {
  return JSON.stringify({ required: false, placeholder, showtime, date_type: "0", dateformat: "0" });
}

function makeLookupRules(targetListId, listfield = "Title", searchFields = ["Title", "Text1"], placeholder = "Select value") {
  return JSON.stringify({
    required: true,
    placeholder,
    displayStyle: "datapicker",
    appid: appId,
    listsetid: rootId,
    listid: targetListId,
    listfield,
    multiple: false,
    "max-selection": 20,
    search_fields: searchFields
  });
}

function makeDataListViewLayout(list, visibleFieldNames = null) {
  const visible = visibleFieldNames ? new Set(visibleFieldNames) : null;
  const gridFields = list.Defs.filter((field) => field.Type !== "textarea");
  return JSON.stringify({
    layout: gridFields.map((field, index) => ({
      FieldID: field.FieldID,
      FieldName: field.FieldName,
      Mobile: index === 0 ? 2 : 0,
      Order: index,
      Show: visible ? visible.has(field.FieldName) : true,
      Type: field.Type,
      DisplayName: field.DisplayName
    })),
    sort: [{ SortName: "Created", SortByDesc: true }],
    query: [],
    rowColor: [],
    filter: []
  });
}

function makeListFromTemplate(template, listIndex, title, description, fields, rows, layoutTitlePrefix) {
  const listId = id(listIndex, "0000000001000");
  const list = deepClone(template);
  list.ListModel.ListID = listId;
  list.ListModel.Title = title;
  list.ListModel.Description = description;
  list.ListModel.IconUrl = iconUrl;
  list.ListModel.Created = now;
  list.ListModel.Modified = now;
  list.ListModel.CreatedBy = userId;
  list.ListModel.ModifiedBy = userId;
  list.ListModel.LayoutView = list.ListModel.LayoutView.replaceAll(template.ListModel.ListID, listId);
  list.Defs = fields.map((field, index) =>
    makeField(
      listId,
      listIndex,
      index + 1,
      field.fieldName,
      field.displayName,
      field.internalName,
      field.fieldType,
      field.type,
      field.rules ?? null
    )
  );
  list.Layouts = list.Layouts.map((layout, i) => {
    const cloned = deepClone(layout);
    cloned.ListID = listId;
    const isCustomForm = i === list.Layouts.length - 1;
    cloned.LayoutID = id(listIndex, isCustomForm ? "0000000001900" : String(1801 + i).padStart(13, "0"));
    cloned.Title = i === list.Layouts.length - 1 ? `${layoutTitlePrefix} Form` : `${layoutTitlePrefix} View ${i + 1}`;
    cloned.Created = now;
    cloned.Modified = now;
    cloned.CreatedBy = userId;
    cloned.ModifiedBy = userId;
    cloned.LayoutView = isCustomForm ? null : makeDataListViewLayout(list);
    if (Array.isArray(cloned.LayoutInResources)) {
      cloned.LayoutInResources = cloned.LayoutInResources.map((r, idx) => ({
        ...r,
        ID: cloned.LayoutID,
        RefId: cloned.LayoutID,
        Resource: isCustomForm
          ? JSON.stringify({
              children: [
                {
                  id: `${cloned.LayoutID}-container`,
                  type: "container",
                  label: "Container",
                  attrs: {},
                  children: list.Defs.map((field) => ({
                    id: `${cloned.LayoutID}-${field.FieldName}`,
                    type: field.Type,
                    label: field.DisplayName,
                    binding: field.FieldName,
                    attrs: field.Rules ? JSON.parse(field.Rules) : {},
                    displayLabel: true
                  }))
                }
              ],
              attrs: {},
              filterVars: [],
              ver: 2,
              tempVars: [],
              title: cloned.Title
            })
          : JSON.stringify({ title: cloned.Title, listId, fields: list.Defs.map((f) => f.DisplayName), index: idx })
      }));
    }
    return cloned;
  });
  const customFormLayout = list.Layouts.find((layout) => Number(layout.Type) === 1);
  if (customFormLayout) {
    const listLayoutView = JSON.parse(list.ListModel.LayoutView);
    listLayoutView.add = customFormLayout.LayoutID;
    listLayoutView.edit = customFormLayout.LayoutID;
    listLayoutView.view = customFormLayout.LayoutID;
    list.ListModel.LayoutView = JSON.stringify(listLayoutView);
  }
  list.ListDatas = {};
  if (includeSampleData) {
    rows.forEach((row, index) => {
      const rowId = id(listIndex, String(11001 + index).padStart(13, "0"));
      list.ListDatas[rowId] = { ListDataID: rowId, ...row };
    });
  }
  return list;
}

const baseMaster = data.Childs[0];
const baseRequest = data.Childs[1];

const centersListId = id(1, "0000000001000");
const fundingListId = id(2, "0000000001000");
const catalogListId = id(3, "0000000001000");
const requestListId = id(4, "0000000001000");

const centers = makeListFromTemplate(
  baseMaster,
  1,
  "Centers / Departments",
  "Shared lookup list for Heep Hong centers and departments.",
  [
    { fieldName: "Title", displayName: "Center / Department Name", internalName: "CenterDepartmentName", fieldType: "Text", type: "input", rules: makeTextRules("Enter center or department name") },
    { fieldName: "Text1", displayName: "Short Code", internalName: "ShortCode", fieldType: "Text", type: "input", rules: makeTextRules("Enter short code") },
    { fieldName: "Text2", displayName: "Type", internalName: "CenterDepartmentType", fieldType: "Text", type: "radio", rules: makeChoiceRules(["Center", "Department", "HO"]) },
    { fieldName: "Text3", displayName: "Status", internalName: "Status", fieldType: "Text", type: "radio", rules: makeChoiceRules(["Active", "Inactive"]) },
    { fieldName: "Text4", displayName: "Notes", internalName: "Notes", fieldType: "Text", type: "textarea", rules: makeTextareaRules("Optional notes") }
  ],
  [
    { Title: "Head Office", Text1: "HO", Text2: "HO", Text3: "Active", Text4: "Common sample only." },
    { Title: "Information Technology Department", Text1: "ITD", Text2: "Department", Text3: "Active", Text4: "Common sample only." },
    { Title: "Finance", Text1: "FIN", Text2: "Department", Text3: "Active", Text4: "Common sample only." },
    { Title: "Human Resources", Text1: "HR", Text2: "Department", Text3: "Active", Text4: "Common sample only." },
    { Title: "Special Child Care Centre", Text1: "SCCC", Text2: "Center", Text3: "Active", Text4: "Common sample only." },
    { Title: "On-site Pre-school Rehabilitation Services", Text1: "OPRS", Text2: "Center", Text3: "Active", Text4: "Common sample only." }
  ],
  "Centers / Departments"
);

const funding = makeListFromTemplate(
  baseMaster,
  2,
  "Funding Sources",
  "Funding source lookup values for IT purchase requisitions.",
  [
    { fieldName: "Title", displayName: "Funding Source Name", internalName: "FundingSourceName", fieldType: "Text", type: "input", rules: makeTextRules("Enter funding source") },
    { fieldName: "Text1", displayName: "Funding Category", internalName: "FundingCategory", fieldType: "Text", type: "input", rules: makeTextRules("Enter category") },
    { fieldName: "Bit1", displayName: "Requires Extra Approval", internalName: "RequiresExtraApproval", fieldType: "Bit", type: "switch", rules: makeSwitchRules() },
    { fieldName: "Text2", displayName: "Status", internalName: "Status", fieldType: "Text", type: "radio", rules: makeChoiceRules(["Active", "Inactive"]) },
    { fieldName: "Text3", displayName: "Notes", internalName: "Notes", fieldType: "Text", type: "textarea", rules: makeTextareaRules("Optional notes") }
  ],
  [
    { Title: "IT Budget", Text1: "IT", Bit1: "0", Text2: "Active", Text3: "Standard IT budget." },
    { Title: "LSG", Text1: "Grant", Bit1: "1", Text2: "Active", Text3: "Common sample only." },
    { Title: "Block Grant", Text1: "Grant", Bit1: "1", Text2: "Active", Text3: "Common sample only." },
    { Title: "Capital Fund", Text1: "Capital", Bit1: "1", Text2: "Active", Text3: "Common sample only." },
    { Title: "Center / Department Expenses", Text1: "Local Budget", Bit1: "1", Text2: "Active", Text3: "Requires details." },
    { Title: "Other Funding / Donation", Text1: "Other", Bit1: "1", Text2: "Active", Text3: "Requires details." },
    { Title: "F&E Fund Source", Text1: "F&E", Bit1: "1", Text2: "Active", Text3: "Requires details." }
  ],
  "Funding Sources"
);

const catalogRows = [
  ["PC - Office", "PC", "Office"],
  ["PC - Multimedia", "PC", "Multimedia"],
  ["PC - Management", "PC", "Management"],
  ["Notebook - Office", "Notebook", "Office"],
  ["Notebook - Multimedia", "Notebook", "Multimedia"],
  ["Notebook - Management", "Notebook", "Management"],
  ["Monitor - 21.5", "Monitor", "21.5"],
  ["Monitor - 24", "Monitor", "24"],
  ["iPad 256GB Wi-Fi", "iPad", "Wi-Fi"],
  ["iPad 256GB Wi-Fi + Cellular", "iPad", "Wi-Fi + Cellular"],
  ["Printer - Inkjet", "Printer", "Inkjet"],
  ["Printer - Laser", "Printer", "Laser"],
  ["Barcode Scanner", "Peripheral", "Barcode Scanner"],
  ["Software", "Software", "Software"],
  ["Other", "Other", "Other"]
];

const catalog = makeListFromTemplate(
  baseMaster,
  3,
  "IT Equipment Catalog",
  "Standard equipment choices from ITD Form002.",
  [
    { fieldName: "Title", displayName: "Equipment Name", internalName: "EquipmentName", fieldType: "Text", type: "input", rules: makeTextRules("Enter equipment name") },
    { fieldName: "Text1", displayName: "Equipment Category", internalName: "EquipmentCategory", fieldType: "Text", type: "input", rules: makeTextRules("Enter equipment category") },
    { fieldName: "Text2", displayName: "Standard Type / Model Group", internalName: "StandardTypeModelGroup", fieldType: "Text", type: "input", rules: makeTextRules("Enter standard type or model group") },
    { fieldName: "Bit1", displayName: "Requires Quantity", internalName: "RequiresQuantity", fieldType: "Bit", type: "switch", rules: makeSwitchRules() },
    { fieldName: "Text3", displayName: "Status", internalName: "Status", fieldType: "Text", type: "radio", rules: makeChoiceRules(["Active", "Inactive"]) },
    { fieldName: "Text4", displayName: "Notes", internalName: "Notes", fieldType: "Text", type: "textarea", rules: makeTextareaRules("Optional notes") }
  ],
  catalogRows.map(([name, category, model]) => ({ Title: name, Text1: category, Text2: model, Bit1: "1", Text3: "Active", Text4: "Based on ITD Form002." })),
  "IT Equipment Catalog"
);

const requestFields = [
  ["Title", "Request No.", "RequestNo", "Text", "input", makeTextRules("Workflow request number")],
  ["Text1", "Applicant", "Applicant", "Text", "identity-picker", JSON.stringify({ required: false, placeholder: "Select applicant" })],
  ["Datetime1", "Submission Date", "SubmissionDate", "Datetime", "datepicker", makeDateRules("Select submission date", true)],
  ["Text2", "Center / Department", "CenterDepartment", "Text", "lookup", makeLookupRules(centersListId, "Title", ["Title", "Text1"], "Select center or department")],
  ["Text3", "Center / Department Code", "CenterDepartmentCode", "Text", "input", makeTextRules("Derived short code")],
  ["Text4", "Funding Source", "FundingSource", "Text", "lookup", makeLookupRules(fundingListId, "Title", ["Title", "Text1"], "Select funding source")],
  ["Text8", "Funding Source Category", "FundingSourceCategory", "Text", "input", makeTextRules("Funding category")],
  ["Text9", "Requested Items Summary", "RequestedItemsSummary", "Text", "textarea", makeTextareaRules("Summarize requested equipment or software", true)],
  ["Text10", "Request Reason", "RequestReason", "Text", "textarea", makeTextareaRules("Enter request reason", true)],
  ["Bit1", "New Headcount", "NewHeadcount", "Bit", "switch", makeSwitchRules()],
  ["Text11", "Multi Device Reason / Special Reason", "SpecialReason", "Text", "textarea", makeTextareaRules("Required when not for new headcount or special approval is needed")],
  ["Decimal1", "Estimated Quantity / Total Quantity", "EstimatedQuantity", "Decimal", "input_number", JSON.stringify({ "rounded-to": "0", number_min: 0 })],
  ["Text5", "Approval Status", "ApprovalStatus", "Text", "radio", makeChoiceRules(["Submitted", "Approved", "Rejected", "IT Review"])],
  ["Text12", "IT Decision", "ITDecision", "Text", "radio", makeChoiceRules(["Pending", "Agree", "Reject"])],
  ["Text13", "IT Item Detail", "ITItemDetail", "Text", "textarea", makeTextareaRules("IT internal item detail")],
  ["Text14", "Expense Code", "ExpenseCode", "Text", "input", makeTextRules("Enter expense code")],
  ["Datetime3", "Approved Date", "ApprovedDate", "Datetime", "datepicker", makeDateRules("Select approved date", true)],
  ["Text6", "Created From Workflow", "CreatedFromWorkflow", "Text", "input", makeTextRules("Workflow marker")],
  ["Text7", "Notes", "Notes", "Text", "textarea", makeTextareaRules("Optional notes")],
  ["Text15", "Funding Requires Extra Approval", "FundingRequiresExtraApproval", "Text", "input", makeTextRules("Derived extra approval flag")],
  ["Datetime2", "Requested Completion Date", "RequestedCompletionDate", "Datetime", "datepicker", makeDateRules("Select requested completion date", false)]
];

const requestList = makeListFromTemplate(
  baseRequest,
  4,
  "IT Purchase Requisitions",
  "Main request list for ITD Form002 purchase requisition workflow.",
  requestFields.map(([fieldName, displayName, internalName, fieldType, type, rules]) => ({ fieldName, displayName, internalName, fieldType, type, rules })),
  [
    ...[]
  ],
  "IT Purchase Requisitions"
);

data.Childs = [centers, funding, catalog, requestList];

data.Item.ListModel.ListID = rootId;
data.Item.ListModel.Title = "Heep Hong IT eWorkflow";
data.Item.ListModel.Description = "Generated first-test app for Heep Hong IT Purchase Requisition eWorkflow.";
data.Item.ListModel.IconUrl = iconUrl;
data.Item.ListModel.Created = now;
data.Item.ListModel.Modified = now;
data.Item.ListModel.CreatedBy = userId;
data.Item.ListModel.ModifiedBy = userId;

data.Item.Layouts[0].LayoutID = overviewLayoutId;
data.Item.Layouts[0].Title = "Heep Hong IT eWorkflow Overview";
data.Item.Layouts[0].LayoutView = null;
data.Item.Layouts[0].LayoutInResources = data.Item.Layouts[0].LayoutInResources.map((r) => {
  const resourceId = `${newPrefix}0000000000001900`;
  return {
    ...r,
    ID: resourceId,
    RefId: resourceId,
    Resource: JSON.stringify({
      children: [
        {
          id: crypto.randomUUID(),
          type: "container",
          label: "Container",
          displayLabel: true,
          attrs: {
            common: {
              background: {
                normal: {
                  type: "classic",
                  classic: {
                    color: "var(--c--neutral-light)"
                  }
                }
              },
              padding: [
                null,
                {
                  top: "--sp--s200",
                  right: "--sp--s200",
                  bottom: "--sp--s200",
                  left: "--sp--s200"
                }
              ]
            },
            style: {
              gap: [null, "--sp--s100"],
              direction: [null, "column"]
            }
          },
          children: [
            {
              id: crypto.randomUUID(),
              type: "heading",
              label: "Text",
              displayLabel: true,
              attrs: {
                headc: {
                  title: {
                    value: "Heep Hong IT eWorkflow",
                    variable: null
                  }
                },
                heads: {
                  ty: [null, "h4-medium"]
                }
              },
              parentCol: null
            },
            {
              id: crypto.randomUUID(),
              type: "heading",
              label: "Text",
              displayLabel: true,
              attrs: {
                headc: {
                  title: {
                    value: "Use the navigation to open purchase requisition lists and the approval form.",
                    variable: null
                  }
                },
                heads: {
                  color: "var(--c--neutral-dark-active)"
                }
              },
              parentCol: null
            }
          ]
        }
      ],
      attrs: {},
      title: "Heep Hong IT eWorkflow Overview",
      ver: 1,
      exts: [],
      filterVars: [],
      tempVars: []
    })
  };
});

const nav = {
  add: "default",
  edit: "default",
  view: "default",
  sort: [
    { AppID: appId, ListID: overviewLayoutId, ListSetID: rootId, Type: 103, Title: "Heep Hong IT eWorkflow Overview", Icon: "fa-regular fa-house", DisplayName: "Overview" },
    { AppID: appId, ListID: centersListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Centers / Departments", Icon: "fa-regular fa-database" },
    { AppID: appId, ListID: fundingListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Funding Sources", Icon: "fa-regular fa-coins" },
    { AppID: appId, ListID: catalogListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "IT Equipment Catalog", Icon: "fa-regular fa-laptop" },
    { AppID: appId, ListID: requestListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "IT Purchase Requisitions", Icon: "fa-regular fa-list-check" },
    { AppID: "41", Title: "IT Purchase Requisition", ListID: formKey, ListSetID: rootId, Type: 105, Icon: "fa-regular fa-pen-field" },
    { AppID: appId, Key: "Process_Waiting_Task", ListID: "/p/todo", Path: "/p/todo", ListSetID: rootId, Title: "Pending tasks", Icon: "wait-task", Type: "process", IsHidden: true },
    { AppID: appId, Key: "Process_My_Request", ListID: "/p/requests", Path: "/p/requests", ListSetID: rootId, Title: "My requests", Icon: "apply-task", Type: "process", IsHidden: true },
    { AppID: appId, Key: "Process_Finish_Task", ListID: "/p/completed", Path: "/p/completed", ListSetID: rootId, Title: "Completed tasks", Icon: "done-task", Type: "process", IsHidden: true }
  ],
  attrs: {
    appearance: { bgc: "#fef2f2", color: "#c1121f" },
    "navigator-menu": { bgc: "var(--c--primary)", position: "default" },
    CustomColors: [
      { id: "extra-color-1", label: "Heep Hong Red", value: "#c1121f" },
      { id: "extra-color-2", label: "Deep Neutral", value: "#343a40" }
    ],
    CustomFonts: []
  },
  sortVer: 1
};
data.Item.ListModel.LayoutView = JSON.stringify(nav);

let form = data.Forms[0];
form.Name = "IT Purchase Requisition";
form.Key = formKey;
form.Description = "Approval form for ITD Form002 purchase requisition first-test workflow.";
form.ListID = 0;
form.ProcModelID = processId;
form.ImgResource = iconUrl;
form.DefKey = formKey;
form.ListSetID = rootId;
form.AppListSetID = rootId;
form.ProcModelListSetID = rootId;

let def = JSON.parse(form.DefResource);
def.name = "IT Purchase Requisition";
def.title = "IT Purchase Requisition";
def.workflowType = "approval";
def.pageurls[0].id = crypto.randomUUID();
def.pageurls[0].title = "IT Purchase Requisition";
def.pageurls[0].formdef.title = "IT Purchase Requisition";
def.pageurls[0].formdef.id = def.pageurls[0].id;
def.pageurls[1].id = crypto.randomUUID();
def.pageurls[1].title = "IT Purchase Requisition Review";
def.pageurls[1].formdef.title = "IT Purchase Requisition Review";
def.pageurls[1].formdef.id = def.pageurls[1].id;
for (const shape of def.childshapes) {
  if (shape.stencil?.id === "StartNoneEvent" && shape.properties) {
    shape.properties.taskurl = def.pageurls[0].id;
  }
  if (shape.stencil?.id === "MultiAssignmentTask" && shape.properties) {
    shape.properties.taskurl = def.pageurls[1].id;
  }
}

function variable(idValue, name, type, extra = {}) {
  return { idx: `hhi-var-${idValue.toLowerCase()}`, id: idValue, name, type, editable: true, ...extra };
}

def.variables.basic = [
  variable("__attachments", "Attachments", "file"),
  variable("RequestNo", "Request No.", "text"),
  variable("Applicant", "Applicant", "user"),
  variable("SubmissionDate", "Submission Date", "date"),
  variable("field_9", "Center / Department", "lookup", { value: { AppID: appId, ListID: centersListId, ListSetID: rootId } }),
  variable("CenterDepartmentCode", "Center / Department Code", "text"),
  variable("field_10", "Funding Source", "lookup", { value: { AppID: appId, ListID: fundingListId, ListSetID: rootId } }),
  variable("FundingSourceCategory", "Funding Source Category", "text"),
  variable("RequestedItemsSummary", "Requested Items Summary", "text"),
  variable("RequestReason", "Request Reason", "text"),
  variable("NewHeadcount", "New Headcount", "boolean"),
  variable("SpecialReason", "Multi Device Reason / Special Reason", "text"),
  variable("EstimatedQuantity", "Estimated Quantity / Total Quantity", "number")
];
def.ProcModelListID = processId;
def.ProcModelAppID = appId;
def.ProcModelListSetID = rootId;
def.AppListSetID = rootId;
def.listSet = rootId;
def.listInfo = {
  ListID: requestListId,
  Title: "IT Purchase Requisitions"
};

function control(idValue, binding, type, label, attrs = {}, extra = {}) {
  return {
    id: `hhi-control-${idValue}${extra.approval ? "-approval" : ""}`,
    binding,
    type,
    label,
    attrs,
    displayLabel: true,
    ...extra.props
  };
}

const centerLookupAttrs = {
  appid: appId,
  listsetid: rootId,
  listfield: "Title",
  listfilter: null,
  addition: [
    {
      FieldName: "Text1",
      FieldID: centers.Defs.find((f) => f.FieldName === "Text1").FieldID,
      IsShow: false,
      RelationName: "CenterDepartmentCode",
      Value: null,
      Order: null,
      RelationFieldIsMultiple: false
    }
  ],
  "list_tooltip_field": null,
  "sort-first": { SortName: "Title", SortByDesc: false },
  listid: centersListId,
  placeholder: "Select center or department",
  required: true
};

const fundingLookupAttrs = {
  appid: appId,
  listsetid: rootId,
  listfield: "Title",
  listfilter: null,
  addition: [
    {
      FieldName: "Text1",
      FieldID: funding.Defs.find((f) => f.FieldName === "Text1").FieldID,
      IsShow: false,
      RelationName: "FundingSourceCategory",
      Value: null,
      Order: null,
      RelationFieldIsMultiple: false
    }
  ],
  "list_tooltip_field": null,
  "sort-first": { SortName: "Title", SortByDesc: false },
  listid: fundingListId,
  placeholder: "Select funding source",
  required: true
};

function pageControls(readonly = false) {
  const suffix = readonly ? { approval: true } : {};
  const ro = readonly ? { readonly: true } : {};
  return [
    control("Applicant", "Applicant", "identity-picker", "Applicant", { default: "currentUser" }, { ...suffix, props: { readonly: true, value: "CurrentUser" } }),
    control("SubmissionDate", "SubmissionDate", "datepicker", "Submission Date", { default: "currentDate", showtime: true, dateformat: "0", date_type: "0" }, { ...suffix, props: { readonly: true } }),
    control("RequestNo", "RequestNo", "input", "Request No.", {}, { ...suffix, props: { readonly: true } }),
    control("CenterDepartment", "field_9", "lookup", "Center / Department", centerLookupAttrs, { ...suffix, props: ro }),
    control("CenterDepartmentCode", "CenterDepartmentCode", "input", "Center / Department Code", {}, { ...suffix, props: { readonly: true } }),
    control("FundingSource", "field_10", "lookup", "Funding Source", fundingLookupAttrs, { ...suffix, props: ro }),
    control("FundingSourceCategory", "FundingSourceCategory", "input", "Funding Source Category", {}, { ...suffix, props: { readonly: true } }),
    control("RequestedItemsSummary", "RequestedItemsSummary", "textarea", "Requested Items Summary", { edit: { textarea_minrows: 3 }, required: true, placeholder: "Summarize requested equipment or software" }, { ...suffix, props: ro }),
    control("RequestReason", "RequestReason", "textarea", "Request Reason", { edit: { textarea_minrows: 3 }, required: true, placeholder: "Describe the reason for this purchase request" }, { ...suffix, props: ro }),
    control("NewHeadcount", "NewHeadcount", "switch", "New Headcount", { displayStyle: "default" }, { ...suffix, props: { ...ro, value: false } }),
    control("SpecialReason", "SpecialReason", "textarea", "Multi Device Reason / Special Reason", {
      edit: { textarea_minrows: 3 },
      placeholder: "Required when not for new headcount or when special approval is needed",
      control_display: readonly ? [] : [
        {
          id: crypto.randomUUID(),
          controlId: "hhi-control-SpecialReason",
          formulas: [
            { exprType: "variable", valueType: "boolean", id: "NewHeadcount", type: "expr", name: "Workflow Variables:New Headcount" },
            { type: "op", op: "==" },
            { type: "bool", value: false }
          ],
          actions: {
            id: crypto.randomUUID(),
            type: 1,
            attrs: {
              style_regulation_action: "style_regulation_action_show",
              style_regulation_action_color: null,
              action_style: null,
              icon_type: null
            }
          }
        }
      ]
    }, { ...suffix, props: ro }),
    control("EstimatedQuantity", "EstimatedQuantity", "input_number", "Estimated Quantity / Total Quantity", { displayThousandths: "1", "rounded-to": "0", number_min: 0 }, { ...suffix, props: { ...ro, value: 1 } })
  ];
}

def.pageurls[0].formdef.children[0].children[1].children[0].children = pageControls(false);
def.pageurls[1].formdef.children[0].children[1].children[0].children = pageControls(true);

for (const shape of def.childshapes) {
  if (shape.properties?.name) {
    shape.properties.name = shape.properties.name
      .replaceAll("Visitor Access Request", "IT Purchase Requisition")
      .replaceAll("Department Head Approval", "Supervisor / Department Head Approval")
      .replaceAll("Create IT Purchase Requisition Record Record", "Create IT Purchase Requisition Record");
  }
}
const contentNode = def.childshapes.find((s) => s.stencil?.id === "ContentList");
contentNode.properties.name = "Create IT Purchase Requisition Record";
contentNode.properties.appid = appId;
contentNode.properties.listsetid = rootId;
contentNode.properties.listid = requestListId;
function varButton(varId, name) {
  return `<input type="button" data="\${&quot;type&quot;:&quot;variable&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;${varId}&quot;}}" expr="__" tabindex="-1" value="Workflow Variables:${name}">`;
}
contentNode.properties.listdatas = [
  { Per: "0", Columns: "Title", Data: varButton("RequestNo", "Request No.") },
  { Per: "0", Columns: "Text1", Data: varButton("Applicant", "Applicant") },
  { Per: "0", Columns: "Datetime1", Data: varButton("SubmissionDate", "Submission Date") },
  { Per: "0", Columns: "Text2", Data: varButton("field_9", "Center / Department") },
  { Per: "0", Columns: "Text3", Data: varButton("CenterDepartmentCode", "Center / Department Code") },
  { Per: "0", Columns: "Text4", Data: varButton("field_10", "Funding Source") },
  { Per: "0", Columns: "Text8", Data: varButton("FundingSourceCategory", "Funding Source Category") },
  { Per: "0", Columns: "Text9", Data: varButton("RequestedItemsSummary", "Requested Items Summary") },
  { Per: "0", Columns: "Text10", Data: varButton("RequestReason", "Request Reason") },
  { Per: "0", Columns: "Bit1", Data: varButton("NewHeadcount", "New Headcount") },
  { Per: "0", Columns: "Text11", Data: varButton("SpecialReason", "Multi Device Reason / Special Reason") },
  { Per: "0", Columns: "Decimal1", Data: varButton("EstimatedQuantity", "Estimated Quantity / Total Quantity") },
  { Per: "0", Columns: "Text5", Data: "Approved" },
  { Per: "0", Columns: "Text12", Data: "Agree" },
  { Per: "0", Columns: "Datetime3", Data: [{ type: "func", func: "now", params: [] }] },
  { Per: "0", Columns: "Text6", Data: "Yes" }
];

form.DefResource = JSON.stringify(def);
data.Forms = [form];

app.MainListType = 1024;
app.AppID = appId;
app.FormKeys = [formKey];
app.Data = JSON.stringify(data);
app.ReplaceIds = [
  rootId,
  overviewLayoutId,
  ...data.Childs.flatMap((list) => [
    list.ListModel.ListID,
    ...list.Defs.map((f) => f.FieldID),
    ...list.Layouts.map((l) => l.LayoutID),
    ...Object.keys(list.ListDatas ?? {})
  ]),
  processId,
  formKey
].filter((value, index, all) => value && all.indexOf(value) === index);

fs.writeFileSync(outAppPath, `${JSON.stringify(app, null, 2)}\n`);
fs.writeFileSync(outFormDefPath, `${JSON.stringify(def, null, 2)}\n`);
fs.writeFileSync(reportPath, `${JSON.stringify({
  generatedAt: now,
  appName: "Heep Hong IT eWorkflow",
  idFamily: `${newPrefix}...`,
  flowKey: formKey,
  formKeyStrategy: "Fresh key not found in existing local artifacts before generation",
  sourceBaseline: sourcePath,
  lineItemPersistence: "deferred",
  diagnosticPurpose: "v8 keeps v7 sample-data-disabled scope and restores native Title field metadata to match working Visitor Access v11 and Department Access v5 child lists.",
  v4Fix: "Type 0 data-list LayoutView now uses the baseline layout/sort/query/rowColor/filter schema instead of a lightweight fields array.",
  v5Fix: "Data-list field Rules now use the conservative Visitor Access v11-style shapes for text, textarea, radio/dropdown, switch, identity, and date fields.",
  v6Fix: "Type 0 data-list grid views omit textarea fields, matching the working Visitor Access v11 and Department Access v5 exports.",
  v7Fix: "Diagnostic build keeps the v6 graph and fields but imports no sample data in child lists.",
  v8Fix: "Every child list Title field is generated as the native system/index field: Status 0, IsSystem true, IsIndex true.",
  sampleData: { included: includeSampleData, reason: "Disabled for runtime row-query isolation test." },
  resources: data.Childs.map((list) => ({ title: list.ListModel.Title, listId: list.ListModel.ListID, fields: list.Defs.map((f) => ({ displayName: f.DisplayName, fieldName: f.FieldName, fieldType: f.FieldType, type: f.Type })) })),
  approvalForm: { flowName: form.Name, flowKey: form.Key, procModelId: form.ProcModelID, listId: form.ListID },
  contentListMappings: contentNode.properties.listdatas.map((m) => ({ target: m.Columns, source: typeof m.Data === "string" ? m.Data : "now()" }))
}, null, 2)}\n`);

console.log(`Wrote ${outAppPath}`);
console.log(`Wrote ${outFormDefPath}`);
console.log(`Wrote ${reportPath}`);

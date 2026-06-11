import fs from "node:fs";
import crypto from "node:crypto";

const sourcePath = "design-system-request-tracker-app-def.v1.json";
const outAppPath = "approval-form-controls-test-app-def.v1.json";
const outFormDefPath = "approval-form-controls-test-approval-form-def.v1.json";
const outListDefPath = "approval-form-controls-test-list-def.v1.json";
const outReportPath = "approval-form-controls-test-generation-report.v1.json";

const family = "451";
const generatedAt = "2026-05-14 21:15:00";
const appId = 41;
const tenantId = "1697103066096734208";
const userId = "1697103066163843073";
const rootId = `${family}0010000000000000`;
const dashboardId = `${family}0010000000000001`;
const requestListId = `${family}0020000000001000`;
const processId = `${family}0030000000000001`;
const formKey = "AFC1";
const iconUrl = JSON.stringify({ b: "#E6F0FF", i: "fa-regular fa-rectangle-list", c: "#0065FF" });

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const app = JSON.parse(JSON.stringify(source).replaceAll("427", family).replaceAll("DSX", formKey).replaceAll("dsv-", "afc1-"));
const data = JSON.parse(app.Data);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function uuid() {
  return crypto.randomUUID();
}

function localId(area, suffix) {
  return `${family}${String(area).padStart(3, "0")}${suffix}`;
}

function tokenPadding(value = "--sp--s0") {
  return [null, { top: value, right: value, bottom: value, left: value }];
}

function control(type, label, attrs = {}, children = [], extra = {}) {
  return { id: uuid(), type, label, attrs, children, ...extra };
}

function container(nvLabel, attrs = {}, children = [], extra = {}) {
  return control("container", "Container", attrs, children, { nv_label: nvLabel, ...extra });
}

function inlinePositioning() {
  return { positioning: { widthtype: [null, "2"] } };
}

function textControl(value, nvLabel, ty = "h5-medium", color = "var(--c--text)") {
  return control("heading", "Text", {
    headc: { title: { value, variable: null } },
    heads: { ty: [null, ty], color },
    common: inlinePositioning()
  }, [], { nv_label: nvLabel });
}

function paragraph(value, nvLabel) {
  return control("heading", "Text", {
    headc: { title: { value, variable: null } },
    heads: { ty: [null, "s-regular"], color: "var(--c--neutral-dark-hover)" },
    common: inlinePositioning()
  }, [], { nv_label: nvLabel });
}

function cardAttrs() {
  return {
    style: { gap: [null, "--sp--s200"], direction: [null, "column"] },
    common: {
      padding: tokenPadding("--sp--s300"),
      background: { normal: { type: "classic", classic: { color: "var(--c--background)" } } },
      border: {
        normal: {
          type: "1",
          width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
          color: "var(--c--neutral-light-active)",
          radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }]
        }
      }
    }
  };
}

function makeField(listId, area, index, fieldName, displayName, internalName, fieldType, type, rules = {}) {
  const isTitle = fieldName === "Title";
  return {
    FieldID: localId(area, String(1000 + index).padStart(13, "0")),
    ListID: listId,
    FieldName: fieldName,
    FieldType: fieldType,
    FieldIndex: isTitle ? 0 : index,
    DisplayName: displayName,
    InternalName: internalName,
    DisplayName_EN: null,
    Type: type,
    Status: isTitle ? 0 : 1,
    Category: 0,
    DefaultValue: null,
    Rules: Object.keys(rules).length ? JSON.stringify(rules) : null,
    TenantID: tenantId,
    AppID: appId,
    IsSort: isTitle,
    IsIndex: isTitle,
    IsFilter: ["Title", "Text2", "Text3", "Bit1", "Datetime1"].includes(fieldName),
    IsIndexCreated: false,
    IsSystem: isTitle,
    IsUnique: false,
    Created: generatedAt,
    Modified: generatedAt,
    CreatedBy: userId,
    ModifiedBy: userId,
    Ext1: null,
    Ext2: null,
    Ext3: null
  };
}

function listViewLayout(fields) {
  return JSON.stringify({
    layout: fields.filter((field) => !["textarea", "richtext"].includes(field.Type)).map((field, index) => ({
      FieldID: field.FieldID,
      FieldName: field.FieldName,
      Mobile: index === 0 ? 2 : 0,
      Order: index,
      Show: ["Title", "Text2", "Decimal1", "Decimal3", "Text3", "Bit1", "Datetime1"].includes(field.FieldName),
      Type: field.Type,
      DisplayName: field.DisplayName
    })),
    sort: [{ SortName: "Created", SortByDesc: true }],
    query: [],
    rowColor: [],
    filter: []
  });
}

function listFieldControl(field, readonly = false) {
  const attrs = field.Rules ? JSON.parse(field.Rules) : {};
  const item = {
    id: uuid(),
    type: field.Type,
    label: field.DisplayName,
    binding: field.FieldName,
    displayLabel: [null, true],
    attrs,
    nv_label: `${field.DisplayName} list form control`
  };
  if (readonly) item.readonly = true;
  return item;
}

function customListForm(title, layoutId, fields, readonly = false) {
  const formJson = {
    children: [
      container("Main", {
        style: { gap: [null, "--sp--s0"], direction: [null, "column"], justify_content: [null, "flex-start"], align_items: [null, "center"] }
      }, [
        container("Content", {
          style: { gap: [null, "--sp--s300"], direction: [null, "column"], justify_content: [null, "flex-start"] },
          common: { padding: tokenPadding("--sp--s300") }
        }, [
          container("Page header", { style: { gap: [null, "--sp--s100"], direction: [null, "column"] } }, [
            textControl(title, `${title} heading`, "h4-medium"),
            paragraph(readonly ? "Review the saved approval-control test record." : "Maintain request records created by the approval-control test workflow.", `${title} helper`)
          ]),
          container(readonly ? "Readonly section" : "Field group", cardAttrs(), fields.map((field) => listFieldControl(field, readonly)))
        ])
      ])
    ],
    attrs: {
      container: { cw: "2", padding: tokenPadding("--sp--s0") },
      background: { type: "classic", classic: { color: "var(--c--neutral-light)" } }
    },
    title,
    filterVars: [],
    ver: 2,
    tempVars: []
  };
  return {
    LayoutID: layoutId,
    Type: 1,
    Title: title,
    ListID: requestListId,
    LayoutView: null,
    Ext2: "{\"src\":true}",
    IsItemPerm: false,
    Created: generatedAt,
    Modified: generatedAt,
    CreatedBy: userId,
    ModifiedBy: userId,
    LayoutInResources: [{ ID: layoutId, RefId: layoutId, Resource: JSON.stringify(formJson) }]
  };
}

function dashboardPage() {
  return {
    children: [
      container("Main", {
        style: { gap: [null, "--sp--s0"], direction: [null, "column"], justify_content: [null, "flex-start"], align_items: [null, "center"] }
      }, [
        container("Content", {
          style: { gap: [null, "--sp--s300"], direction: [null, "column"], justify_content: [null, "flex-start"] },
          common: { padding: tokenPadding("--sp--s300") }
        }, [
          container("Page header", cardAttrs(), [
            textControl("Approval Form Controls Test", "Dashboard title", "h3-bold"),
            paragraph("A focused proof package for representative native approval form controls learned from AI Training.", "Dashboard description")
          ])
        ])
      ])
    ],
    attrs: {
      hideHeaderAll: true,
      container: { padding: tokenPadding("--sp--s0") },
      background: { type: "classic", classic: { color: "var(--c--neutral-light)" } }
    },
    title: "Overview",
    ver: 2,
    filterVars: [],
    tempVars: [],
    exts: [],
    actions: []
  };
}

function flexGrid(children, nvLabel) {
  return control("flex_grid", "Grid", {
    ver: 1,
    columns: {
      "1": { list: [{ value: 1, unit: "fr" }, { value: 1, unit: "fr" }], last: { value: 1, unit: "fr" } },
      "2": { list: [{ value: 1, unit: "fr" }, { value: 1, unit: "fr" }], last: { value: 1, unit: "fr" } },
      "3": { list: [{ value: 1, unit: "fr" }], last: { value: 1, unit: "fr" } }
    },
    rows: { "1": { list: [{ unit: "auto" }], last: { unit: "auto" } } },
    cgap: { "1": 16 },
    cgapU: { "1": "px" },
    rgap: { "1": 16 },
    rgapU: { "1": "px" }
  }, children, { nv_label: nvLabel, displayLabel: [null, false] });
}

const choices = {
  priority: ["Low", "Medium", "High"],
  options: ["Laptop", "Monitor", "Keyboard", "Mouse"],
};

function calculatedAttrs() {
  return {
    calculated: [
      { exprType: "variable", valueType: "number", id: "Quantity", type: "expr", name: "Workflow Variables:Quantity" },
      { type: "op", op: "*" },
      { exprType: "variable", valueType: "number", id: "UnitPrice", type: "expr", name: "Workflow Variables:Unit Price" }
    ]
  };
}

function approvalControl(key, type, label, attrs = {}, readonly = false, pageReview = false, extra = {}) {
  const item = {
    id: `afc1-control-${key}-${pageReview ? "review" : "submit"}`,
    binding: key,
    type,
    label,
    attrs,
    displayLabel: true,
    nv_label: `${label} control`,
    ...extra
  };
  if (readonly || type === "calculated") item.readonly = true;
  return item;
}

function longSection(children, nvLabel) {
  return container(nvLabel, {
    style: { gap: [null, "--sp--s150"], direction: [null, "column"] },
    common: { padding: tokenPadding("--sp--s0") }
  }, children);
}

function makeApprovalPage(title, review = false) {
  const readonly = review;
  const mainControls = [
    approvalControl("RequestTitle", "input", "Request Title", { placeholder: "Enter a short request title", required: true }, readonly, review),
    approvalControl("Requester", "identity-picker", "Requester", { default: "currentUser" }, true, review, { value: "CurrentUser" }),
    approvalControl("Quantity", "input_number", "Quantity", { displayThousandths: "1" }, readonly, review),
    approvalControl("UnitPrice", "currency", "Unit Price", { currencyCode: "USD", displayFormat: "code", displayThousandths: "1" }, readonly, review),
    approvalControl("SubTotal", "calculated", "Sub total", calculatedAttrs(), true, review),
    approvalControl("Confidence", "percent", "Confidence", {}, readonly, review),
    approvalControl("Priority", "radio", "Priority", { choices: choices.priority, show_color: false, displayStyle: "dropdown" }, readonly, review),
    approvalControl("Options", "checkbox", "Required Options", {
      choices: choices.options,
      color_choices: choices.options.map((value) => ({ value, key: uuid() })),
      displayStyle: "checkbox"
    }, readonly, review),
    approvalControl("ActiveRequest", "switch", "Active Request", { "comment-allow": false }, readonly, review),
    approvalControl("NeededBy", "datepicker", "Needed By", { date_type: "0" }, readonly, review),
    approvalControl("ServiceWindowFrom", "daterange", "Service Window", {
      "binding-date-range": "ServiceWindowTo",
      placeholder_range: ["Service Window From", "Service Window To"],
      date_picker: "date",
      date_type: "1"
    }, readonly, review),
    approvalControl("RelatedRecord", "lookup", "Related Record", {
      appid: appId,
      listsetid: rootId,
      listid: requestListId,
      listfield: "Title",
      listfilter: null,
      addition: null,
      list_tooltip_field: null,
      "sort-first": { SortName: "Created", SortByDesc: true },
      "search-scope": "3",
      "search-fields": ["Title", "Text1"],
      link: "default",
      "modal-size": 2,
      displayStyle: "dropdown"
    }, readonly, review)
  ];
  const longControls = [
    approvalControl("Description", "textarea", "Description", { edit: { fhlay: "auto", textarea_minrows: 3 }, placeholder: "Describe the request" }, readonly, review),
    approvalControl("RichNotes", "richtext", "Rich Notes", { edit: { fh: [null, 150] } }, readonly, review),
    approvalControl("Attachments", "file-upload", "Attachments", { ver: 1, file_multiple: true, file_maxcount: 5, upload_btn: { value: "", variable: null } }, readonly, review),
    ...(review ? [approvalControl("DecisionNotes", "textarea", "Decision Notes", { edit: { fhlay: "auto", textarea_minrows: 3 }, placeholder: "Reviewer notes" }, false, review)] : [])
  ];
  return {
    children: [
      container("Main", {
        style: { gap: [null, "--sp--s0"], direction: [null, "column"], justify_content: [null, "flex-start"], align_items: [null, "center"] }
      }, [
        container("Content", {
          style: { gap: [null, "--sp--s300"], direction: [null, "column"], justify_content: [null, "flex-start"] },
          common: { padding: tokenPadding("--sp--s300") }
        }, [
          container("Form body", cardAttrs(), [
            textControl(title, `${title} heading`, "h4-medium"),
            paragraph(review ? "Review the submitted control values and approve or reject the request." : "Submit representative native controls generated from the AI Training control study.", `${title} helper`),
            flexGrid(mainControls, "Representative control grid"),
            longSection(longControls, "Long and attachment controls")
          ]),
          container("Form bottom", {
            style: { gap: [null, "--sp--s200"], direction: [null, "column"] }
          }, [
            { id: `afc1-control-panel-${review ? "review" : "submit"}`, type: "workflowControlPanel", label: "Action Panel", attrs: { "show-task-panel": true, rejectValidation: true, align: "center" }, nv_label: "Action panel" },
            { id: `afc1-flow-history-${review ? "review" : "submit"}`, type: "workflowHistory", label: "Flow History", attrs: { "show-history": true }, nv_label: "Flow history" }
          ])
        ])
      ])
    ],
    attrs: {
      container: { cw: "2", padding: tokenPadding("--sp--s0") },
      background: { type: "classic", classic: { color: "var(--c--neutral-light)" } }
    },
    title,
    pagetype: review ? 2 : 1,
    filterVars: [],
    ver: 2,
    tempVars: []
  };
}

const baseList = clone(data.Childs[0]);
const fields = [
  ["Title", "Request Title", "RequestTitle", "Text", "input", { required: true, placeholder: "Request title" }],
  ["Text1", "Description", "Description", "Text", "textarea", { required: false, placeholder: "Description" }],
  ["Text2", "Priority", "Priority", "Text", "radio", { choices: choices.priority, displayStyle: "dropdown", required: false }],
  ["Text3", "Required Options", "RequiredOptions", "Text", "input", { required: false }],
  ["Bit1", "Active Request", "ActiveRequest", "Bit", "switch", { required: false }],
  ["Decimal1", "Quantity", "Quantity", "Decimal", "input_number", { required: false }],
  ["Decimal2", "Unit Price", "UnitPrice", "Decimal", "currency", { currencyCode: "USD", displayFormat: "code", required: false }],
  ["Decimal3", "Sub total", "SubTotal", "Decimal", "input_number", { required: false }],
  ["Decimal4", "Confidence", "Confidence", "Decimal", "input_number", { required: false }],
  ["Datetime1", "Needed By", "NeededBy", "Datetime", "datepicker", { date_type: "0", required: false }],
  ["Datetime2", "Service Window From", "ServiceWindowFrom", "Datetime", "datepicker", { date_type: "0", required: false }],
  ["Datetime3", "Service Window To", "ServiceWindowTo", "Datetime", "datepicker", { date_type: "0", required: false }],
  ["Text4", "Related Record", "RelatedRecord", "Text", "input", { required: false }],
  ["Text5", "Requester", "Requester", "Text", "input", { required: false }],
  ["Text6", "Rich Notes", "RichNotes", "Text", "textarea", { required: false }],
  ["Text7", "Decision Notes", "DecisionNotes", "Text", "textarea", { required: false }]
].map(([fieldName, displayName, internalName, fieldType, type, rules], index) =>
  makeField(requestListId, 2, index, fieldName, displayName, internalName, fieldType, type, rules)
);

baseList.ListModel.ListID = requestListId;
baseList.ListModel.ListType = 1;
baseList.ListModel.Title = "Control Test Requests";
baseList.ListModel.Description = "Persisted records created by the Approval Form Controls Test workflow.";
baseList.ListModel.IconUrl = iconUrl;
baseList.ListModel.CustomType = `ListSite_${rootId}`;
baseList.ListModel.Created = generatedAt;
baseList.ListModel.Modified = generatedAt;
baseList.ListModel.CreatedBy = userId;
baseList.ListModel.ModifiedBy = userId;
baseList.Defs = fields;
baseList.Layouts = [
  {
    LayoutID: localId(2, "0000000001801"),
    Type: 0,
    Title: "All Requests",
    IsDefault: true,
    ListID: requestListId,
    LayoutView: listViewLayout(fields),
    Ext2: null,
    IsItemPerm: false,
    Created: generatedAt,
    Modified: generatedAt,
    CreatedBy: userId,
    ModifiedBy: userId,
    LayoutInResources: []
  },
  customListForm("Edit Item", localId(2, "0000000001901"), fields, false),
  customListForm("View Item", localId(2, "0000000001902"), fields, true)
];
baseList.ListModel.LayoutView = JSON.stringify({
  add: baseList.Layouts[1].LayoutID,
  edit: baseList.Layouts[1].LayoutID,
  view: baseList.Layouts[2].LayoutID,
  opentype: { add: "modal" },
  modalsize: {},
  sort: [{ SortName: "Created", SortByDesc: true }]
});
baseList.ListDatas = {
  [localId(2, "0000000011001")]: {
    ListDataID: localId(2, "0000000011001"),
    Title: "Existing sample request",
    Text1: "Seed record for internal lookup testing.",
    Text2: "Medium",
    Text3: "Laptop, Monitor",
    Bit1: "1",
    Decimal1: 2,
    Decimal2: 1200,
    Decimal3: 2400,
    Decimal4: 0.85,
    Datetime1: "2026-05-20 00:00:00",
    Datetime2: "2026-05-21 00:00:00",
    Datetime3: "2026-05-22 00:00:00",
    Text4: "",
    Text5: "Current User",
    Text6: "Seed rich notes.",
    Text7: ""
  }
};

data.Childs = [baseList];
data.Item.ListModel.ListID = rootId;
data.Item.ListModel.Title = "Approval Form Controls Test";
data.Item.ListModel.Description = "Small app to prove representative native approval form controls from the AI Training study.";
data.Item.ListModel.IconUrl = iconUrl;
data.Item.ListModel.Created = generatedAt;
data.Item.ListModel.Modified = generatedAt;
data.Item.ListModel.CreatedBy = userId;
data.Item.ListModel.ModifiedBy = userId;
data.Item.Layouts = [clone(data.Item.Layouts[0])];
data.Item.Layouts[0].LayoutID = dashboardId;
data.Item.Layouts[0].ListID = rootId;
data.Item.Layouts[0].Title = "Overview";
data.Item.Layouts[0].LayoutView = null;
data.Item.Layouts[0].Ext2 = "{\"src\":true}";
data.Item.Layouts[0].LayoutInResources = [{ ID: dashboardId, RefId: dashboardId, Resource: JSON.stringify(dashboardPage()) }];
data.Item.ListModel.LayoutView = JSON.stringify({
  add: "default",
  edit: "default",
  view: "default",
  sort: [
    { AppID: appId, ListID: dashboardId, ListSetID: rootId, Type: 103, Title: "Overview", Icon: "fa-regular fa-chart-line", DisplayName: "Overview" },
    { AppID: appId, ListID: requestListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Control Test Requests", Icon: "fa-regular fa-list-check" },
    { AppID: "41", Title: "Submit Control Test", ListID: formKey, ListSetID: rootId, Type: 105, Icon: "fa-regular fa-paper-plane" }
  ],
  attrs: {
    appearance: { bgc: "var(--c--primary-light)", color: "var(--c--primary)" },
    "navigator-menu": { bgc: "var(--c--primary)", color: "var(--c--primary-light)", position: "default" },
    CustomColors: [],
    CustomFonts: []
  },
  sortVer: 1
});
data.AppThemes = [
  {
    ID: null,
    Type: 0,
    Name: "application style",
    Description: null,
    Config: JSON.stringify({
      primary: { value: "#0065FF", lightmodel: "Luminance" },
      secondary: { value: "#00D1FF", lightmodel: "Luminance" },
      neutral: { value: "#B3B7C0", lightmodel: "Luminance" },
      typography: { fontfamily: "Default", basevalue: 14, scale: "1.125", lineheight: 1.4 }
    }),
    Ext: null
  }
];

const form = data.Forms[0];
form.Name = "Approval Form Controls Test";
form.Key = formKey;
form.Description = "Approval form with representative native controls learned from AI Training.";
form.ListID = 0;
form.ProcModelID = processId;
form.ImgResource = iconUrl;
form.DefKey = formKey;
form.ListSetID = rootId;
form.AppListSetID = rootId;
form.ProcModelListSetID = rootId;

const def = JSON.parse(form.DefResource);
def.defkey = formKey;
def.name = "Approval Form Controls Test";
def.title = "Approval Form Controls Test";
def.workflowType = "approval";
def.ProcModelListID = processId;
def.ProcModelAppID = appId;
def.ProcModelListSetID = rootId;
def.AppListSetID = rootId;
def.listSet = rootId;
def.listInfo = { ListID: requestListId, Title: "Control Test Requests" };
def.pageurls[0].id = uuid();
def.pageurls[0].title = "Submit Control Test";
def.pageurls[0].type = 1;
def.pageurls[0].formdef = makeApprovalPage("Submit Control Test", false);
def.pageurls[0].formdef.id = def.pageurls[0].id;
def.pageurls[1].id = uuid();
def.pageurls[1].title = "Review Control Test";
def.pageurls[1].type = 2;
def.pageurls[1].formdef = makeApprovalPage("Review Control Test", true);
def.pageurls[1].formdef.id = def.pageurls[1].id;
def.variables.basic = [
  { idx: "afc1-var-request-title", id: "RequestTitle", name: "Request Title", type: "text", editable: true },
  { idx: "afc1-var-description", id: "Description", name: "Description", type: "text", editable: true },
  { idx: "afc1-var-rich-notes", id: "RichNotes", name: "Rich Notes", type: "text", editable: true },
  { idx: "afc1-var-quantity", id: "Quantity", name: "Quantity", type: "number", editable: true },
  { idx: "afc1-var-unit-price", id: "UnitPrice", name: "Unit Price", type: "number", editable: true },
  { idx: "afc1-var-subtotal", id: "SubTotal", name: "Sub total", type: "number", editable: true },
  { idx: "afc1-var-confidence", id: "Confidence", name: "Confidence", type: "number", editable: true },
  { idx: "afc1-var-priority", id: "Priority", name: "Priority", type: "text", editable: true },
  { idx: "afc1-var-options", id: "Options", name: "Required Options", type: "text", editable: true },
  { idx: "afc1-var-active", id: "ActiveRequest", name: "Active Request", type: "boolean", editable: true },
  { idx: "afc1-var-needed-by", id: "NeededBy", name: "Needed By", type: "date", editable: true },
  { idx: "afc1-var-window-from", id: "ServiceWindowFrom", name: "Service Window From", type: "date", editable: true },
  { idx: "afc1-var-window-to", id: "ServiceWindowTo", name: "Service Window To", type: "date", editable: true },
  { idx: "afc1-var-attachments", id: "Attachments", name: "Attachments", type: "file", editable: true },
  { idx: "afc1-var-requester", id: "Requester", name: "Requester", type: "user", editable: true },
  { idx: "afc1-var-related", id: "RelatedRecord", name: "Related Record", type: "lookup", editable: true, value: { AppID: appId, ListID: requestListId, ListSetID: rootId } },
  { idx: "afc1-var-decision-notes", id: "DecisionNotes", name: "Decision Notes", type: "text", editable: true }
];
def.variables.listref = [];

function varButton(varId, name) {
  return `<input type="button" data="\${&quot;type&quot;:&quot;variable&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;${varId}&quot;}}" expr="__" tabindex="-1" value="Workflow Variables:${name}">`;
}

function taskOutcomeButton(taskId, taskName) {
  return `<input type="button" data="\${&quot;type&quot;:&quot;task&quot;,&quot;param&quot;:{&quot;defid&quot;:&quot;${taskId}&quot;}, &quot;prop&quot;:&quot;Outcome&quot;}" expr="__" tabindex="-1" value="${taskName}:Outcome">`;
}

function outcomeValueButton(value) {
  return `<input type="button" data="${value}" expr="__" tabindex="-1" value="Task outcome:${value}">`;
}

function workflowNode(resourceid, type, properties, position, incoming = [], outgoing = []) {
  return {
    resourceid,
    stencil: { id: type },
    properties,
    outgoing: outgoing.map((flowId) => ({ id: flowId, resourceid: flowId })),
    incoming: incoming.map((flowId) => ({ id: flowId, resourceid: flowId })),
    id: resourceid,
    date: 1760001900000,
    position
  };
}

function workflowFlow(resourceid, source, target, properties) {
  return {
    resourceid,
    stencil: { id: "SequenceFlow" },
    properties: { linetype: "rounded", ...properties },
    target: { id: target, resourceid: target },
    id: resourceid,
    date: 1760001910000,
    source: { id: source, resourceid: source }
  };
}

const startNodeId = "afc1-node-start-0001";
const reviewNodeId = "afc1-node-review-0002";
const persistNodeId = "afc1-node-persist-0003";
const endNodeId = "afc1-node-end-0004";
const rejectNodeId = "afc1-node-reject-0005";
const flowStartReview = "afc1-flow-0001";
const flowApproved = "afc1-flow-0002";
const flowRejected = "afc1-flow-0003";
const flowPersistEnd = "afc1-flow-0004";

def.childshapes = [
  workflowNode(startNodeId, "StartNoneEvent", { name: "Start", taskurl: def.pageurls[0].id }, { x: -80, y: 100 }, [], [flowStartReview]),
  workflowNode(reviewNodeId, "MultiAssignmentTask", {
    name: "Reviewer Approval",
    approveway: "allapprove",
    approvepercentage: 100,
    allowskip: true,
    isallowreassign: false,
    isallowsign: false,
    usertaskassignment: [{ type: "user", method: "expression", value: varButton("Requester", "Requester"), title: `User:${varButton("Requester", "Requester")}` }],
    taskurl: def.pageurls[1].id,
    duedatedefinition: 48,
    duedatetype: "hour"
  }, { x: 200, y: 100 }, [flowStartReview], [flowApproved, flowRejected]),
  workflowNode(persistNodeId, "ContentList", {
    name: "Create Control Test Record",
    type: "add",
    appid: appId,
    listsetid: rootId,
    listid: requestListId,
    listtype: "select",
    listdatas: [
      { Per: "0", Columns: "Title", Data: varButton("RequestTitle", "Request Title") },
      { Per: "0", Columns: "Text1", Data: varButton("Description", "Description") },
      { Per: "0", Columns: "Text2", Data: varButton("Priority", "Priority") },
      { Per: "0", Columns: "Text3", Data: varButton("Options", "Required Options") },
      { Per: "0", Columns: "Bit1", Data: varButton("ActiveRequest", "Active Request") },
      { Per: "0", Columns: "Decimal1", Data: varButton("Quantity", "Quantity") },
      { Per: "0", Columns: "Decimal2", Data: varButton("UnitPrice", "Unit Price") },
      { Per: "0", Columns: "Decimal3", Data: varButton("SubTotal", "Sub total") },
      { Per: "0", Columns: "Decimal4", Data: varButton("Confidence", "Confidence") },
      { Per: "0", Columns: "Datetime1", Data: varButton("NeededBy", "Needed By") },
      { Per: "0", Columns: "Datetime2", Data: varButton("ServiceWindowFrom", "Service Window From") },
      { Per: "0", Columns: "Datetime3", Data: varButton("ServiceWindowTo", "Service Window To") },
      { Per: "0", Columns: "Text4", Data: varButton("RelatedRecord", "Related Record") },
      { Per: "0", Columns: "Text5", Data: varButton("Requester", "Requester") },
      { Per: "0", Columns: "Text6", Data: varButton("RichNotes", "Rich Notes") },
      { Per: "0", Columns: "Text7", Data: varButton("DecisionNotes", "Decision Notes") }
    ],
    wheres: []
  }, { x: 460, y: 100 }, [flowApproved], [flowPersistEnd]),
  workflowNode(endNodeId, "EndNoneEvent", { name: "End" }, { x: 720, y: 100 }, [flowPersistEnd], []),
  workflowNode(rejectNodeId, "EndRejectEvent", { name: "Rejected" }, { x: 460, y: 270 }, [flowRejected], []),
  workflowFlow(flowStartReview, startNodeId, reviewNodeId, { name: "Start to Reviewer Approval" }),
  workflowFlow(flowApproved, reviewNodeId, persistNodeId, {
    name: "Reviewer Approved",
    documentation: "Approved",
    conditioninfo: [{ key: "afc1-cond-approved", pre: "and", left: taskOutcomeButton(reviewNodeId, "Reviewer Approval"), op: "s.=", right: outcomeValueButton("Approved") }]
  }),
  workflowFlow(flowRejected, reviewNodeId, rejectNodeId, {
    name: "Reviewer Rejected",
    documentation: "Rejected",
    conditioninfo: [{ key: "afc1-cond-rejected", pre: "and", left: taskOutcomeButton(reviewNodeId, "Reviewer Approval"), op: "s.=", right: outcomeValueButton("Rejected") }]
  }),
  workflowFlow(flowPersistEnd, persistNodeId, endNodeId, { name: "Control Test Record Created to End" })
];

form.DefResource = JSON.stringify(def);
data.Forms = [form];

app.Title = "Approval Form Controls Test";
app.Description = "Small generated app proving representative native approval form controls.";
app.IconUrl = iconUrl;
app.MainListType = 1024;
app.AppID = appId;
app.FormKeys = [formKey];
app.Data = JSON.stringify(data);
app.ReportIds = [];
app.ReplaceIds = [
  rootId,
  dashboardId,
  requestListId,
  ...fields.map((field) => field.FieldID),
  ...baseList.Layouts.map((layout) => layout.LayoutID),
  ...Object.keys(baseList.ListDatas),
  processId,
  formKey
].filter((value, index, all) => value && all.indexOf(value) === index);

fs.writeFileSync(outAppPath, `${JSON.stringify(app, null, 2)}\n`);
fs.writeFileSync(outFormDefPath, `${JSON.stringify(def, null, 2)}\n`);
fs.writeFileSync(outListDefPath, `${JSON.stringify({ Item: baseList, MainListType: 1, AppID: appId, ReplaceIds: app.ReplaceIds }, null, 2)}\n`);
fs.writeFileSync(outReportPath, `${JSON.stringify({
  generatedAt,
  appName: app.Title,
  idFamily: `${family}...`,
  flowKey: formKey,
  sourceBaseline: sourcePath,
  includedControls: [
    "input",
    "textarea",
    "richtext",
    "input_number",
    "currency",
    "percent",
    "radio",
    "checkbox",
    "switch",
    "datepicker",
    "daterange",
    "file-upload",
    "identity-picker",
    "lookup",
    "calculated",
    "workflowControlPanel",
    "workflowHistory"
  ],
  runtimeSensitiveControlsIncludedForProof: ["richtext", "checkbox", "percent", "file-upload", "identity-picker", "lookup", "calculated"],
  deferredControls: ["icon-upload", "organization-picker", "location-picker", "cost-center-picker", "metadata", "mutiple-metadata", "lookup-list", "list/sublist"],
  resources: {
    dataLists: ["Control Test Requests"],
    approvalForms: ["Approval Form Controls Test"],
    dashboards: ["Overview"]
  }
}, null, 2)}\n`);

console.log(JSON.stringify({
  status: "pass",
  appDef: outAppPath,
  formDef: outFormDefPath,
  listDef: outListDefPath,
  report: outReportPath,
  replaceIds: app.ReplaceIds.length
}, null, 2));

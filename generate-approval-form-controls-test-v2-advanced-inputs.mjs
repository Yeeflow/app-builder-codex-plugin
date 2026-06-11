import fs from "node:fs";
import crypto from "node:crypto";

const sourcePath = "design-system-request-tracker-app-def.v1.json";
const outAppPath = "approval-form-controls-test-v2-app-def.json";
const outFormDefPath = "approval-form-controls-test-v2-approval-form-def.json";
const outListDefPath = "approval-form-controls-test-v2-list-def.json";
const outReportPath = "approval-form-controls-test-v2-generation-report.json";

const family = "452";
const generatedAt = "2026-05-14 21:15:00";
const appId = 41;
const tenantId = "1697103066096734208";
const userId = "1697103066163843073";
const rootId = `${family}0010000000000000`;
const dashboardId = `${family}0010000000000001`;
const requestListId = `${family}0020000000001000`;
const processId = `${family}0030000000000001`;
const formKey = "AFC2";
const iconUrl = JSON.stringify({ b: "#E6F0FF", i: "fa-regular fa-rectangle-list", c: "#0065FF" });

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const app = JSON.parse(JSON.stringify(source).replaceAll("427", family).replaceAll("DSX", formKey).replaceAll("dsv-", "afc2-"));
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
    IsFilter: ["Title", "Decimal1", "Decimal2", "Decimal3", "Decimal4", "Datetime1", "Text1"].includes(fieldName),
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
      Show: ["Title", "Decimal1", "Decimal2", "Decimal3", "Decimal4", "Datetime1", "Text1"].includes(field.FieldName),
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
            textControl("Approval Form Controls Test v2", "Dashboard title", "h3-bold"),
            paragraph("A focused proof package for advanced input native approval form controls learned from AI Training.", "Dashboard description")
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

function calculatedAttrs() {
  return {
    calculated: [
      { exprType: "variable", valueType: "number", id: "BaseAmount", type: "expr", name: "Workflow Variables:Base Amount" },
      { type: "op", op: "*" },
      { exprType: "variable", valueType: "number", id: "AdjustmentPercent", type: "expr", name: "Workflow Variables:Adjustment Percent" }
    ]
  };
}

function approvalControl(key, type, label, attrs = {}, readonly = false, pageReview = false, extra = {}) {
  const item = {
    id: `afc2-control-${key}-${pageReview ? "review" : "submit"}`,
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
    approvalControl("BaseAmount", "input_number", "Base Amount", { displayThousandths: "1", number_min: 0 }, readonly, review),
    approvalControl("AdjustmentPercent", "percent", "Adjustment Percent", { "rounded-to": 2, number_min: 0, number_max: 1 }, readonly, review),
    approvalControl("CalculatedScore", "calculated", "Calculated Score", calculatedAttrs(), true, review),
    approvalControl("SatisfactionRate", "rate", "Satisfaction Rate", { "rate-type": "star", "rate-count": 5, "rate-allowHalf": true }, readonly, review),
    approvalControl("PreferredTime", "time", "Preferred Time", { required: false, dateformat: "0", minuteStep: 15 }, readonly, review),
    approvalControl("FollowUpWindowFrom", "daterange", "Follow-up Window", {
      "binding-date-range": "FollowUpWindowTo",
      placeholder_range: ["Window From", "Window To"],
      date_picker: "date",
      date_type: "1",
      layout: "1"
    }, readonly, review),
    approvalControl("ReferenceLink", "hyperlink", "Reference Link", { placeholder: "https://example.com", hyperlink_open: "_blank", hyperlink_buttonname: "Open link" }, readonly, review)
  ];
  const longControls = [
    approvalControl("Notes", "textarea", "Notes", { edit: { fhlay: "auto", textarea_minrows: 3 }, placeholder: "Optional context for this advanced input test" }, readonly, review),
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
            paragraph(review ? "Review the submitted control values and approve or reject the request." : "Submit advanced input controls generated from the AI Training control study.", `${title} helper`),
            flexGrid(mainControls, "Advanced input control grid"),
            longSection(longControls, "Notes and reviewer controls")
          ]),
          container("Form bottom", {
            style: { gap: [null, "--sp--s200"], direction: [null, "column"] }
          }, [
            { id: `afc2-control-panel-${review ? "review" : "submit"}`, type: "workflowControlPanel", label: "Action Panel", attrs: { "show-task-panel": true, rejectValidation: true, align: "center" }, nv_label: "Action panel" },
            { id: `afc2-flow-history-${review ? "review" : "submit"}`, type: "workflowHistory", label: "Flow History", attrs: { "show-history": true }, nv_label: "Flow history" }
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
  ["Decimal1", "Base Amount", "BaseAmount", "Decimal", "input_number", { required: false, number_min: 0 }],
  ["Decimal2", "Adjustment Percent", "AdjustmentPercent", "Decimal", "percent", { required: false, "rounded-to": 2, number_min: 0, number_max: 1 }],
  ["Decimal3", "Calculated Score", "CalculatedScore", "Decimal", "input_number", { required: false }],
  ["Decimal4", "Satisfaction Rate", "SatisfactionRate", "Decimal", "rate", { required: false, "rate-type": "star", "rate-count": 5, "rate-allowHalf": true }],
  ["Datetime1", "Preferred Time", "PreferredTime", "Datetime", "time", { dateformat: "0", minuteStep: 15, required: false }],
  ["Datetime2", "Follow-up Window From", "FollowUpWindowFrom", "Datetime", "datepicker", { date_type: "0", required: false }],
  ["Datetime3", "Follow-up Window To", "FollowUpWindowTo", "Datetime", "datepicker", { date_type: "0", required: false }],
  ["Text1", "Reference Link", "ReferenceLink", "Text", "hyperlink", { required: false, hyperlink_open: "_blank", hyperlink_buttonname: "Open link" }],
  ["Text2", "Requester", "Requester", "Text", "input", { required: false }],
  ["Text3", "Notes", "Notes", "Text", "textarea", { required: false }],
  ["Text4", "Decision Notes", "DecisionNotes", "Text", "textarea", { required: false }]
].map(([fieldName, displayName, internalName, fieldType, type, rules], index) =>
  makeField(requestListId, 2, index, fieldName, displayName, internalName, fieldType, type, rules)
);

baseList.ListModel.ListID = requestListId;
baseList.ListModel.ListType = 1;
baseList.ListModel.Title = "Advanced Input Test Requests";
baseList.ListModel.Description = "Persisted records created by the Approval Form Controls Test v2 workflow.";
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
    Title: "Existing advanced input sample",
    Decimal1: 200,
    Decimal2: 0.25,
    Decimal3: 50,
    Decimal4: 4.5,
    Datetime1: "2026-05-20 10:00:00",
    Datetime2: "2026-05-21 00:00:00",
    Datetime3: "2026-05-22 00:00:00",
    Text1: "https://example.com",
    Text2: "Current User",
    Text3: "Seed row for advanced input control testing.",
    Text4: ""
  }
};

data.Childs = [baseList];
data.Item.ListModel.ListID = rootId;
data.Item.ListModel.Title = "Approval Form Controls Test v2";
data.Item.ListModel.Description = "Small app to prove advanced input approval form controls from the AI Training study.";
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
    { AppID: appId, ListID: requestListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Advanced Input Test Requests", Icon: "fa-regular fa-list-check" },
    { AppID: "41", Title: "Submit Advanced Inputs Test", ListID: formKey, ListSetID: rootId, Type: 105, Icon: "fa-regular fa-paper-plane" }
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
form.Name = "Approval Form Controls Test v2";
form.Key = formKey;
form.Description = "Approval form with advanced input controls learned from AI Training.";
form.ListID = 0;
form.ProcModelID = processId;
form.ImgResource = iconUrl;
form.DefKey = formKey;
form.ListSetID = rootId;
form.AppListSetID = rootId;
form.ProcModelListSetID = rootId;

const def = JSON.parse(form.DefResource);
def.defkey = formKey;
def.name = "Approval Form Controls Test v2";
def.title = "Approval Form Controls Test v2";
def.workflowType = "approval";
def.ProcModelListID = processId;
def.ProcModelAppID = appId;
def.ProcModelListSetID = rootId;
def.AppListSetID = rootId;
def.listSet = rootId;
def.listInfo = { ListID: requestListId, Title: "Advanced Input Test Requests" };
def.pageurls[0].id = uuid();
def.pageurls[0].title = "Submit Advanced Inputs Test";
def.pageurls[0].type = 1;
def.pageurls[0].formdef = makeApprovalPage("Submit Advanced Inputs Test", false);
def.pageurls[0].formdef.id = def.pageurls[0].id;
def.pageurls[1].id = uuid();
def.pageurls[1].title = "Review Advanced Inputs Test";
def.pageurls[1].type = 2;
def.pageurls[1].formdef = makeApprovalPage("Review Advanced Inputs Test", true);
def.pageurls[1].formdef.id = def.pageurls[1].id;
def.variables.basic = [
  { idx: "afc2-var-request-title", id: "RequestTitle", name: "Request Title", type: "text", editable: true },
  { idx: "afc2-var-base-amount", id: "BaseAmount", name: "Base Amount", type: "number", editable: true },
  { idx: "afc2-var-adjustment-percent", id: "AdjustmentPercent", name: "Adjustment Percent", type: "number", editable: true },
  { idx: "afc2-var-calculated-score", id: "CalculatedScore", name: "Calculated Score", type: "number", editable: true },
  { idx: "afc2-var-satisfaction-rate", id: "SatisfactionRate", name: "Satisfaction Rate", type: "number", editable: true },
  { idx: "afc2-var-preferred-time", id: "PreferredTime", name: "Preferred Time", type: "date", editable: true },
  { idx: "afc2-var-window-from", id: "FollowUpWindowFrom", name: "Follow-up Window From", type: "date", editable: true },
  { idx: "afc2-var-window-to", id: "FollowUpWindowTo", name: "Follow-up Window To", type: "date", editable: true },
  { idx: "afc2-var-reference-link", id: "ReferenceLink", name: "Reference Link", type: "text", editable: true },
  { idx: "afc2-var-notes", id: "Notes", name: "Notes", type: "text", editable: true },
  { idx: "afc2-var-requester", id: "Requester", name: "Requester", type: "user", editable: true },
  { idx: "afc2-var-decision-notes", id: "DecisionNotes", name: "Decision Notes", type: "text", editable: true }
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

const startNodeId = "afc2-node-start-0001";
const reviewNodeId = "afc2-node-review-0002";
const persistNodeId = "afc2-node-persist-0003";
const endNodeId = "afc2-node-end-0004";
const rejectNodeId = "afc2-node-reject-0005";
const flowStartReview = "afc2-flow-0001";
const flowApproved = "afc2-flow-0002";
const flowRejected = "afc2-flow-0003";
const flowPersistEnd = "afc2-flow-0004";

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
      { Per: "0", Columns: "Decimal1", Data: varButton("BaseAmount", "Base Amount") },
      { Per: "0", Columns: "Decimal2", Data: varButton("AdjustmentPercent", "Adjustment Percent") },
      { Per: "0", Columns: "Decimal3", Data: varButton("CalculatedScore", "Calculated Score") },
      { Per: "0", Columns: "Decimal4", Data: varButton("SatisfactionRate", "Satisfaction Rate") },
      { Per: "0", Columns: "Datetime1", Data: varButton("PreferredTime", "Preferred Time") },
      { Per: "0", Columns: "Datetime2", Data: varButton("FollowUpWindowFrom", "Follow-up Window From") },
      { Per: "0", Columns: "Datetime3", Data: varButton("FollowUpWindowTo", "Follow-up Window To") },
      { Per: "0", Columns: "Text1", Data: varButton("ReferenceLink", "Reference Link") },
      { Per: "0", Columns: "Text2", Data: varButton("Requester", "Requester") },
      { Per: "0", Columns: "Text3", Data: varButton("Notes", "Notes") },
      { Per: "0", Columns: "Text4", Data: varButton("DecisionNotes", "Decision Notes") }
    ],
    wheres: []
  }, { x: 460, y: 100 }, [flowApproved], [flowPersistEnd]),
  workflowNode(endNodeId, "EndNoneEvent", { name: "End" }, { x: 720, y: 100 }, [flowPersistEnd], []),
  workflowNode(rejectNodeId, "EndRejectEvent", { name: "Rejected" }, { x: 460, y: 270 }, [flowRejected], []),
  workflowFlow(flowStartReview, startNodeId, reviewNodeId, { name: "Start to Reviewer Approval" }),
  workflowFlow(flowApproved, reviewNodeId, persistNodeId, {
    name: "Reviewer Approved",
    documentation: "Approved",
    conditioninfo: [{ key: "afc2-cond-approved", pre: "and", left: taskOutcomeButton(reviewNodeId, "Reviewer Approval"), op: "s.=", right: outcomeValueButton("Approved") }]
  }),
  workflowFlow(flowRejected, reviewNodeId, rejectNodeId, {
    name: "Reviewer Rejected",
    documentation: "Rejected",
    conditioninfo: [{ key: "afc2-cond-rejected", pre: "and", left: taskOutcomeButton(reviewNodeId, "Reviewer Approval"), op: "s.=", right: outcomeValueButton("Rejected") }]
  }),
  workflowFlow(flowPersistEnd, persistNodeId, endNodeId, { name: "Control Test Record Created to End" })
];

form.DefResource = JSON.stringify(def);
data.Forms = [form];

app.Title = "Approval Form Controls Test v2";
app.Description = "Small generated app proving advanced input native approval form controls.";
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
    "input_number",
    "percent",
    "daterange",
    "time",
    "hyperlink",
    "rate",
    "identity-picker",
    "calculated",
    "workflowControlPanel",
    "workflowHistory"
  ],
  runtimeSensitiveControlsIncludedForProof: ["percent", "daterange", "time", "hyperlink", "rate", "calculated"],
  infrastructureControlsNotPartOfStageProof: ["input", "textarea", "input_number", "identity-picker", "workflowControlPanel", "workflowHistory"],
  deferredControls: ["file-upload", "icon-upload", "organization-picker", "location-picker", "cost-center-picker", "metadata", "mutiple-metadata", "lookup-list", "list/sublist", "signer", "tag"],
  resources: {
    dataLists: ["Advanced Input Test Requests"],
    approvalForms: ["Approval Form Controls Test v2"],
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

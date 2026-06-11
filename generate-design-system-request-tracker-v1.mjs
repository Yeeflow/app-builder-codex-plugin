import fs from "node:fs";
import crypto from "node:crypto";

const sourcePath = "visitor-access-management-app-def.v11-five-fields-multitype.json";
const specPath = "yeeflow-design-system-first-test-spec.json";
const outAppPath = "design-system-request-tracker-app-def.v1.json";
const outFormDefPath = "design-system-request-tracker-approval-form-def.v1.json";
const outReportPath = "design-system-request-tracker-generation-report.v1.json";

const family = "427";
const generatedAt = "2026-05-14 10:20:00";
const appId = 41;
const tenantId = "1697103066096734208";
const userId = "1697103066163843073";
const rootId = `${family}0010000000000000`;
const dashboardId = `${family}0010000000000001`;
const requestsListId = `${family}0020000000001000`;
const formKey = "DSX";
const processId = `${family}0030000000000001`;
const iconUrl = JSON.stringify({ b: "#E6F0FF", i: "fa-regular fa-object-group", c: "#0065FF" });

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
const app = JSON.parse(JSON.stringify(source).replaceAll("216", family).replaceAll("VBB", formKey).replaceAll("vbb-", "dsv-"));
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

function heading(value, nvLabel, size = "h4-medium") {
  return control("heading", "Text", {
    headc: { title: { value, variable: null } },
    heads: { ty: [null, size], color: [null, "var(--c--text)"] }
  }, [], { nv_label: nvLabel });
}

function text(value, nvLabel) {
  return control("text-editor", "Text Editor", {
    value,
    common: { padding: tokenPadding("--sp--s0") }
  }, [], { nv_label: nvLabel });
}

function fieldControl(field, readonly = false) {
  const base = {
    id: uuid(),
    type: field.type,
    label: field.displayName,
    binding: field.fieldName,
    displayLabel: [null, true],
    attrs: field.attrs || {},
    nv_label: `${field.displayName} field`
  };
  if (readonly) base.readonly = true;
  return base;
}

function makeField(listId, area, index, fieldName, displayName, internalName, fieldType, type, rules) {
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
    Rules: rules ? JSON.stringify(rules) : null,
    TenantID: tenantId,
    AppID: appId,
    IsSort: isTitle,
    IsIndex: isTitle,
    IsFilter: ["Title", "Text1", "Text2", "Text4", "Datetime1"].includes(fieldName),
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

function makeListViewLayout(fields) {
  const gridFields = fields.filter((field) => field.Type !== "textarea");
  return JSON.stringify({
    layout: gridFields.map((field, index) => ({
      FieldID: field.FieldID,
      FieldName: field.FieldName,
      Mobile: index === 0 ? 2 : 0,
      Order: index,
      Show: ["Title", "Text1", "Text2", "Text3", "Text4", "Datetime1"].includes(field.FieldName),
      Type: field.Type,
      DisplayName: field.DisplayName
    })),
    sort: [{ SortName: "Created", SortByDesc: true }],
    query: [],
    rowColor: [],
    filter: []
  });
}

function makeCustomForm(title, layoutId, fields, readonly = false) {
  const formFields = fields.map((field) => ({
    fieldName: field.FieldName,
    displayName: field.DisplayName,
    type: field.Type === "radio" ? "radio" : field.Type,
    attrs: field.Rules ? JSON.parse(field.Rules) : {}
  }));
  const bodyName = readonly ? "Readonly section" : "Field group";
  const formJson = {
    children: [
      container("Main", {
        style: { gap: [null, "--sp--s0"], direction: [null, "column"], justify_content: [null, "flex-start"], align_items: [null, "center"] }
      }, [
        container("Content", {
          style: { gap: [null, "--sp--s300"], direction: [null, "column"], justify_content: [null, "flex-start"] },
          common: {
            padding: tokenPadding("--sp--s300"),
            background: { normal: { type: "classic", classic: { color: "var(--c--neutral-light)" } } }
          }
        }, [
          container("Page header", { style: { gap: [null, "--sp--s100"], direction: [null, "column"] } }, [
            heading(title, `${title} heading`, "h4-medium"),
            text(readonly ? "<p>Review the request details in readonly form.</p>" : "<p>Capture the request details using the standard design-system form layout.</p>", `${title} helper`)
          ]),
          container(bodyName, {
            style: { gap: [null, "--sp--s200"], direction: [null, "column"] },
            common: {
              padding: tokenPadding("--sp--s300"),
              background: { normal: { type: "classic", classic: { color: "var(--c--background)" } } },
              border: { normal: { type: "1", width: [null, { top: 1, right: 1, bottom: 1, left: 1 }], color: "var(--c--neutral-light-active)", radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }] } }
            }
          }, formFields.map((field) => fieldControl(field, readonly)))
        ])
      ])
    ],
    attrs: { container: { cw: "2", padding: tokenPadding("--sp--s0") } },
    title,
    filterVars: [],
    ver: 2,
    tempVars: []
  };
  return {
    LayoutID: layoutId,
    Type: 1,
    Title: title,
    ListID: requestsListId,
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

function dynamicField(fieldName, nvLabel, attrs = {}) {
  return control("dynamic-field", "Dynamic field", {
    source: "3",
    "obj-f": fieldName,
    ...attrs
  }, [], { nv_label: nvLabel });
}

function requestCollection() {
  const item = container("Collection item", {
    style: { gap: [null, "--sp--s100"], direction: [null, "column"] },
    common: {
      padding: tokenPadding("--sp--s200"),
      background: { normal: { type: "classic", classic: { color: "var(--c--background)" } } },
      border: { normal: { type: "1", width: [null, { top: 1, right: 1, bottom: 1, left: 1 }], color: "var(--c--neutral-light-active)", radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }] } }
    }
  }, [
    dynamicField("Title", "Request number", { item_style: { ty: { size: [null, "--fs--base"], wei: "600" }, normal: { color: "var(--c--primary)" } } }),
    dynamicField("Text1", "Request title", { item_style: { ty: [null, "base-regular"], normal: { color: "var(--c--text)" } } }),
    dynamicField("Text4", "Status badge", { prefix: "Status:", item_style: { ty: [null, "s-medium"], normal: { color: "var(--c--warning-dark)" } } })
  ]);
  return control("collection", "Collection", {
    data: {
      list: { AppID: appId, ListID: requestsListId, Type: 1, Title: "Requests", ListSetID: rootId },
      limit: false,
      disv: false,
      ps: 6,
      filter: [],
      link: "default",
      op: "new"
    },
    layout: {
      cg: [null, 24],
      rg: [null, 24],
      cp: tokenPadding("--sp--s0")
    }
  }, [item], { nv_label: "Request collection" });
}

function kpiCard(label, value, token, nvLabel) {
  return container(nvLabel, {
    style: { gap: [null, "--sp--s050"], direction: [null, "column"] },
    common: {
      padding: tokenPadding("--sp--s200"),
      background: { normal: { type: "classic", classic: { color: "var(--c--background)" } } },
      border: { normal: { type: "1", width: [null, { top: 1, right: 1, bottom: 1, left: 1 }], color: "var(--c--neutral-light-active)", radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }] } }
    }
  }, [
    heading(value, `${nvLabel} value`, "h3-bold"),
    control("heading", "Text", {
      headc: { title: { value: label, variable: null } },
      heads: { ty: [null, "s-medium"], color: [null, `var(${token})`] }
    }, [], { nv_label: `${nvLabel} label` })
  ]);
}

function dashboardPage() {
  return {
    children: [
      container("Main", {
        style: { gap: [null, "--sp--s0"], direction: [null, "column"], justify_content: [null, "flex-start"], align_items: [null, "center"] }
      }, [
        container("Content", {
          style: { gap: [null, "--sp--s300"], direction: [null, "column"], justify_content: [null, "flex-start"] },
          common: {
            padding: tokenPadding("--sp--s300"),
            background: { normal: { type: "classic", classic: { color: "var(--c--neutral-light)" } } }
          }
        }, [
          container("Page header", { style: { gap: [null, "--sp--s100"], direction: [null, "column"] } }, [
            heading("Design System Request Tracker", "Dashboard title", "h2-bold"),
            text("<p>Track simple internal requests using the standard Yeeflow generated-app layout.</p>", "Dashboard description")
          ]),
          container("Summary section", { style: { gap: [null, "--sp--s200"], direction: [null, "row"] } }, [
            kpiCard("Total Requests", "3", "--c--primary", "KPI card"),
            kpiCard("Approved", "1", "--c--success", "KPI card Approved"),
            kpiCard("Pending Review", "2", "--c--warning", "KPI card Pending")
          ]),
          container("Collection section", { style: { gap: [null, "--sp--s200"], direction: [null, "column"] } }, [
            heading("Recent requests", "Collection section heading", "h4-medium"),
            requestCollection()
          ]),
          container("Empty state", {
            style: { gap: [null, "--sp--s075"], direction: [null, "column"] },
            common: {
              padding: tokenPadding("--sp--s200"),
              background: { normal: { type: "classic", classic: { color: "var(--c--background)" } } },
              border: { normal: { type: "1", width: [null, { top: 1, right: 1, bottom: 1, left: 1 }], color: "var(--c--neutral-light-active)", radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }] } }
            }
          }, [
            heading("No requests yet", "Empty state heading", "h6-medium"),
            text("<p>Submitted requests will appear here after the workflow starts.</p>", "Empty state body")
          ])
        ])
      ])
    ],
    attrs: {
      hideHeaderAll: true,
      container: { padding: tokenPadding("--sp--s0") }
    },
    title: "Overview",
    ver: 2,
    filterVars: [],
    tempVars: [],
    exts: [],
    actions: []
  };
}

const baseList = clone(data.Childs[1]);
const requestFieldSpecs = [
  ["Title", "Request No.", "RequestNo", "Text", "input", { required: false, placeholder: "Generated request number" }],
  ["Text1", "Request Title", "RequestTitle", "Text", "input", { required: true, placeholder: "Enter request title", "input-maxlength": 200 }],
  ["Text2", "Request Type", "RequestType", "Text", "radio", { required: true, placeholder: "Select request type", displayStyle: "dropdown", choices: ["General", "IT Support", "Facilities", "Finance"] }],
  ["Text3", "Requested By", "Applicant", "Text", "input", { required: false, placeholder: "Requester" }],
  ["Text4", "Status", "Status", "Text", "radio", { required: false, placeholder: "Select status", displayStyle: "dropdown", choices: ["Draft", "Submitted", "Approved", "Rejected"] }],
  ["Datetime1", "Needed By", "NeededBy", "Datetime", "datepicker", { required: false, placeholder: "Select needed-by date", showtime: false, date_type: "0", dateformat: "0" }],
  ["Text5", "Notes", "Notes", "Text", "textarea", { required: false, placeholder: "Optional notes", "input-maxlength": 2000 }]
];

const requestFields = requestFieldSpecs.map(([fieldName, displayName, internalName, fieldType, type, rules], index) =>
  makeField(requestsListId, 2, index, fieldName, displayName, internalName, fieldType, type, rules)
);

baseList.ListModel.ListID = requestsListId;
baseList.ListModel.Title = "Requests";
baseList.ListModel.Description = "Simple request records for the first Yeeflow design-system proof package.";
baseList.ListModel.IconUrl = iconUrl;
baseList.ListModel.CustomType = `ListSite_${rootId}`;
baseList.ListModel.Created = generatedAt;
baseList.ListModel.Modified = generatedAt;
baseList.ListModel.CreatedBy = userId;
baseList.ListModel.ModifiedBy = userId;
baseList.Defs = requestFields;
baseList.Layouts = [
  {
    LayoutID: localId(2, "0000000001801"),
    Type: 0,
    Title: "All Requests",
    ListID: requestsListId,
    LayoutView: makeListViewLayout(requestFields),
    Ext2: null,
    IsItemPerm: false,
    Created: generatedAt,
    Modified: generatedAt,
    CreatedBy: userId,
    ModifiedBy: userId,
    LayoutInResources: []
  },
  makeCustomForm("Edit Item", localId(2, "0000000001901"), requestFields, false),
  makeCustomForm("View Item", localId(2, "0000000001902"), requestFields, true)
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
    Title: "DSR-1001",
    Text1: "Prepare onboarding checklist",
    Text2: "General",
    Text3: "Alex Chan",
    Text4: "Approved",
    Datetime1: "2026-05-20 00:00:00",
    Text5: "Sample approved request."
  },
  [localId(2, "0000000011002")]: {
    ListDataID: localId(2, "0000000011002"),
    Title: "DSR-1002",
    Text1: "Request meeting room setup",
    Text2: "Facilities",
    Text3: "Mandy Lee",
    Text4: "Submitted",
    Datetime1: "2026-05-22 00:00:00",
    Text5: "Sample pending request."
  },
  [localId(2, "0000000011003")]: {
    ListDataID: localId(2, "0000000011003"),
    Title: "DSR-1003",
    Text1: "Review budget access",
    Text2: "Finance",
    Text3: "Chris Wong",
    Text4: "Submitted",
    Datetime1: "2026-05-25 00:00:00",
    Text5: "Sample pending request."
  }
};

data.Childs = [baseList];

data.Item.ListModel.ListID = rootId;
data.Item.ListModel.Title = spec.name;
data.Item.ListModel.Description = spec.purpose;
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
    { AppID: appId, ListID: requestsListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Requests", Icon: "fa-regular fa-list-check" },
    { AppID: "41", Title: "Submit Request", ListID: formKey, ListSetID: rootId, Type: 105, Icon: "fa-regular fa-paper-plane" },
    { AppID: appId, Key: "Process_Waiting_Task", ListID: "/p/todo", Path: "/p/todo", ListSetID: rootId, Title: "Pending tasks", Icon: "wait-task", Type: "process", IsHidden: true },
    { AppID: appId, Key: "Process_My_Request", ListID: "/p/requests", Path: "/p/requests", ListSetID: rootId, Title: "My requests", Icon: "apply-task", Type: "process", IsHidden: true },
    { AppID: appId, Key: "Process_Finish_Task", ListID: "/p/completed", Path: "/p/completed", ListSetID: rootId, Title: "Completed tasks", Icon: "done-task", Type: "process", IsHidden: true }
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

let form = data.Forms[0];
form.Name = "Submit Request";
form.Key = formKey;
form.Description = "Simple request approval form for the first Yeeflow Application Design System test.";
form.ListID = 0;
form.ProcModelID = processId;
form.ImgResource = iconUrl;
form.DefKey = formKey;
form.ListSetID = rootId;
form.AppListSetID = rootId;
form.ProcModelListSetID = rootId;

let def = JSON.parse(form.DefResource);
def.defkey = formKey;
def.name = "Submit Request";
def.title = "Submit Request";
def.workflowType = "approval";
def.pageurls[0].id = uuid();
def.pageurls[0].title = "Submit Request";
def.pageurls[0].type = 1;
def.pageurls[0].formdef = makeApprovalPage("Submit Request", false);
def.pageurls[0].formdef.id = def.pageurls[0].id;
def.pageurls[1].id = uuid();
def.pageurls[1].title = "Review Request";
def.pageurls[1].type = 2;
def.pageurls[1].formdef = makeApprovalPage("Review Request", true);
def.pageurls[1].formdef.id = def.pageurls[1].id;
def.variables.basic = [
  { idx: "dsv-var-attachments", id: "__attachments", name: "Attachments", type: "file", editable: true },
  { idx: "dsv-var-request-no", id: "RequestNo", name: "Request No.", type: "text", editable: true },
  { idx: "dsv-var-request-title", id: "RequestTitle", name: "Request Title", type: "text", editable: true },
  { idx: "dsv-var-request-type", id: "RequestType", name: "Request Type", type: "text", editable: true },
  { idx: "dsv-var-applicant", id: "Applicant", name: "Requested By", type: "user", editable: true },
  { idx: "dsv-var-status", id: "Status", name: "Status", type: "text", editable: true },
  { idx: "dsv-var-needed-by", id: "NeededBy", name: "Needed By", type: "date", editable: true },
  { idx: "dsv-var-notes", id: "Notes", name: "Notes", type: "text", editable: true },
  { idx: "dsv-var-decision-notes", id: "DecisionNotes", name: "Decision Notes", type: "text", editable: true }
];
def.variables.listref = [];
def.ProcModelListID = processId;
def.ProcModelAppID = appId;
def.ProcModelListSetID = rootId;
def.AppListSetID = rootId;
def.listSet = rootId;
def.listInfo = { ListID: requestsListId, Title: "Requests" };

function approvalControl(idValue, binding, type, label, attrs = {}, readonly = false, pageKey = "submit") {
  const item = { id: `dsv-control-${idValue}-${pageKey}`, binding, type, label, attrs, displayLabel: true, nv_label: `${label} control` };
  if (readonly) item.readonly = true;
  if (binding === "Applicant") item.value = "CurrentUser";
  return item;
}

function makeApprovalPage(title, review) {
  const pageKey = review ? "review" : "submit";
  const controls = [
    approvalControl("RequestNo", "RequestNo", "input", "Request No.", { placeholder: "Generated after submit" }, true, pageKey),
    approvalControl("RequestTitle", "RequestTitle", "input", "Request Title", { required: true, placeholder: "Enter request title" }, review, pageKey),
    approvalControl("RequestType", "RequestType", "radio", "Request Type", { choices: ["General", "IT Support", "Facilities", "Finance"], displayStyle: "dropdown", required: true }, review, pageKey),
    approvalControl("Applicant", "Applicant", "identity-picker", "Requested By", { default: "currentUser", placeholder: "Requester" }, true, pageKey),
    approvalControl("NeededBy", "NeededBy", "datepicker", "Needed By", { showtime: false, date_type: "0", dateformat: "0" }, review, pageKey),
    approvalControl("Notes", "Notes", "textarea", "Notes", { edit: { textarea_minrows: 3 }, placeholder: "Optional notes" }, review, pageKey),
    ...(review ? [
      approvalControl("DecisionNotes", "DecisionNotes", "textarea", "Decision Notes", { edit: { textarea_minrows: 3 }, placeholder: "Add reviewer notes" }, false, pageKey)
    ] : [])
  ];
  return {
    children: [
      container("Main", {
        style: { gap: [null, "--sp--s0"], direction: [null, "column"], justify_content: [null, "flex-start"], align_items: [null, "center"] }
      }, [
        container("Content", {
          style: { gap: [null, "--sp--s300"], direction: [null, "column"], justify_content: [null, "flex-start"] },
          common: {
            padding: tokenPadding("--sp--s300"),
            background: { normal: { type: "classic", classic: { color: "var(--c--neutral-light)" } } }
          }
        }, [
          container("Form body", {
            style: { gap: [null, "--sp--s200"], direction: [null, "column"] },
            common: {
              padding: tokenPadding("--sp--s300"),
              background: { normal: { type: "classic", classic: { color: "var(--c--background)" } } },
              border: { normal: { type: "1", width: [null, { top: 1, right: 1, bottom: 1, left: 1 }], color: "var(--c--neutral-light-active)", radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }] } }
            }
          }, [
            container(review ? "Readonly section" : "Field group", { style: { gap: [null, "--sp--s150"], direction: [null, "column"] } }, [
              heading(title, `${title} form heading`, "h4-medium"),
              ...controls
            ])
          ]),
          container("Form bottom", {
            style: { gap: [null, "--sp--s200"], direction: [null, "column"] }
          }, [
            { id: `dsv-control-panel-${review ? "review" : "submit"}`, type: "workflowControlPanel", label: "Action Panel", attrs: { "show-task-panel": true, rejectValidation: true, align: "center" }, nv_label: "Action panel" },
            { id: `dsv-flow-history-${review ? "review" : "submit"}`, type: "workflowHistory", label: "Flow History", attrs: { "show-history": true }, nv_label: "Flow history" }
          ])
        ])
      ])
    ],
    attrs: { container: { cw: "2", padding: tokenPadding("--sp--s0") } },
    title,
    pagetype: review ? 2 : 1,
    filterVars: [],
    ver: 2,
    tempVars: []
  };
}

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

const startNodeId = "dsv-node-start-0001";
const setNodeId = "dsv-node-set-0002";
const reviewNodeId = "dsv-node-review-0003";
const persistNodeId = "dsv-node-persist-0004";
const endNodeId = "dsv-node-end-0005";
const rejectNodeId = "dsv-node-reject-0006";
const flowStartSet = "dsv-flow-0001";
const flowSetReview = "dsv-flow-0002";
const flowApproved = "dsv-flow-0003";
const flowRejected = "dsv-flow-0004";
const flowPersistEnd = "dsv-flow-0005";

const contentNode = workflowNode(persistNodeId, "ContentList", {
  name: "Create Request Record",
  type: "add",
  appid: appId,
  listsetid: rootId,
  listid: requestsListId,
  listtype: "select",
  listdatas: [
    { Per: "0", Columns: "Title", Data: varButton("RequestNo", "Request No.") },
    { Per: "0", Columns: "Text1", Data: varButton("RequestTitle", "Request Title") },
    { Per: "0", Columns: "Text2", Data: varButton("RequestType", "Request Type") },
    { Per: "0", Columns: "Text3", Data: varButton("Applicant", "Requested By") },
    { Per: "0", Columns: "Text4", Data: "Approved" },
    { Per: "0", Columns: "Datetime1", Data: varButton("NeededBy", "Needed By") },
    { Per: "0", Columns: "Text5", Data: varButton("Notes", "Notes") }
  ],
  wheres: []
}, { x: 650, y: 100 }, [flowApproved], [flowPersistEnd]);

def.childshapes = [
  workflowNode(startNodeId, "StartNoneEvent", { name: "Start", taskurl: def.pageurls[0].id }, { x: -80, y: 100 }, [], [flowStartSet]),
  workflowNode(setNodeId, "SetVariableTask", {
    name: "Set Request No. and Status",
    formtype: "current",
    variablesetting: [
      { key: "dsv-set-request-no", prop: null, id: "RequestNo", name: "Request No.", type: "text", value: `<input type="button" data="\${&quot;type&quot;:&quot;application&quot;,&quot;prop&quot;:&quot;FlowNo&quot;}" expr="__" tabindex="-1" value="Tracking No.">` },
      { key: "dsv-set-status", prop: null, id: "Status", name: "Status", type: "text", value: "Submitted" }
    ]
  }, { x: 150, y: 100 }, [flowStartSet], [flowSetReview]),
  workflowNode(reviewNodeId, "MultiAssignmentTask", {
    name: "Reviewer Approval",
    approveway: "allapprove",
    approvepercentage: 100,
    allowskip: true,
    isallowreassign: false,
    isallowsign: false,
    usertaskassignment: [{ type: "user", method: "expression", value: varButton("Applicant", "Requested By"), title: `User:${varButton("Applicant", "Requested By")}` }],
    taskurl: def.pageurls[1].id,
    duedatedefinition: 48,
    duedatetype: "hour"
  }, { x: 400, y: 100 }, [flowSetReview], [flowApproved, flowRejected]),
  contentNode,
  workflowNode(endNodeId, "EndNoneEvent", { name: "End" }, { x: 900, y: 100 }, [flowPersistEnd], []),
  workflowNode(rejectNodeId, "EndRejectEvent", { name: "Rejected" }, { x: 650, y: 270 }, [flowRejected], []),
  workflowFlow(flowStartSet, startNodeId, setNodeId, { name: "Start to Set Request No." }),
  workflowFlow(flowSetReview, setNodeId, reviewNodeId, { name: "Set Request No. to Reviewer Approval" }),
  workflowFlow(flowApproved, reviewNodeId, persistNodeId, {
    name: "Reviewer Approved",
    documentation: "Approved",
    conditioninfo: [{ key: "dsv-cond-approved", pre: "and", left: taskOutcomeButton(reviewNodeId, "Reviewer Approval"), op: "s.=", right: outcomeValueButton("Approved") }]
  }),
  workflowFlow(flowRejected, reviewNodeId, rejectNodeId, {
    name: "Reviewer Rejected",
    documentation: "Rejected",
    conditioninfo: [{ key: "dsv-cond-rejected", pre: "and", left: taskOutcomeButton(reviewNodeId, "Reviewer Approval"), op: "s.=", right: outcomeValueButton("Rejected") }]
  }),
  workflowFlow(flowPersistEnd, persistNodeId, endNodeId, { name: "Request Record Created to End" })
];

form.DefResource = JSON.stringify(def);
data.Forms = [form];

app.Title = spec.name;
app.Description = spec.purpose;
app.IconUrl = iconUrl;
app.MainListType = 1024;
app.AppID = appId;
app.FormKeys = [formKey];
app.Data = JSON.stringify(data);
app.ReportIds = [];
app.ReplaceIds = [
  rootId,
  dashboardId,
  requestsListId,
  ...requestFields.map((field) => field.FieldID),
  ...baseList.Layouts.map((layout) => layout.LayoutID),
  ...Object.keys(baseList.ListDatas),
  processId,
  formKey
].filter((value, index, all) => value && all.indexOf(value) === index);

fs.writeFileSync(outAppPath, `${JSON.stringify(app, null, 2)}\n`);
fs.writeFileSync(outFormDefPath, `${JSON.stringify(def, null, 2)}\n`);
fs.writeFileSync(outReportPath, `${JSON.stringify({
  generatedAt,
  appName: spec.name,
  idFamily: `${family}...`,
  flowKey: formKey,
  sourceBaseline: sourcePath,
  designSystemDocs: [
    "docs/yeeflow-application-design-system.md",
    "docs/yeeflow-application-layout-standards.md",
    "docs/yeeflow-application-style-token-standards.md",
    "docs/yeeflow-dashboard-design-standards.md",
    "docs/yeeflow-data-list-form-design-standards.md",
    "docs/yeeflow-approval-form-design-standards.md",
    "docs/yeeflow-control-naming-standards.md"
  ],
  resources: {
    dashboards: ["Overview"],
    dataLists: ["Requests"],
    customForms: ["Edit Item", "View Item"],
    approvalForms: ["Submit Request"]
  },
  workflow: ["StartNoneEvent", "SetVariableTask", "MultiAssignmentTask", "ContentList", "EndNoneEvent", "EndRejectEvent"],
  designSystemFeatures: [
    "Dashboard hidden header, zero padding, Main/Content shell",
    "Data list Edit/View custom forms with Main/Content shells",
    "Approval Form body/Form bottom with Action Panel and Flow History",
    "Meaningful nv_label names",
    "Root-token-aligned colors and spacing"
  ]
}, null, 2)}\n`);

console.log(`Wrote ${outAppPath}`);
console.log(`Wrote ${outFormDefPath}`);
console.log(`Wrote ${outReportPath}`);

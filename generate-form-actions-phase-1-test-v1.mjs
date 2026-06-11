import fs from "node:fs";
import crypto from "node:crypto";

const sourcePath = "design-system-request-tracker-app-def.v1.json";
const outAppPath = "form-actions-phase-1-test-v1-app-def.json";
const outFormDefPath = "form-actions-phase-1-test-v1-approval-form-def.json";
const outRequestListDefPath = "form-actions-phase-1-test-v1-request-list-def.json";
const outReportPath = "form-actions-phase-1-test-v1-generation-report.json";

const family = "473";
const formKey = "FAP1S";
const generatedAt = "2026-05-15 11:25:00";
const appId = 41;
const tenantId = "1697103066096734208";
const userId = "1697103066163843073";
const rootId = `${family}0010000000000000`;
const dashboardId = `${family}0010000000000001`;
const requestListId = `${family}0020000000001000`;
const processId = `${family}0040000000000001`;
const iconUrl = JSON.stringify({ b: "#E6F0FF", i: "fa-regular fa-bolt", c: "#0065FF" });

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const app = JSON.parse(JSON.stringify(source).replaceAll("427", family).replaceAll("DSX", formKey).replaceAll("dsv-", "fap1-"));
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

function inlinePositioning() {
  return { positioning: { widthtype: [null, "2"] } };
}

function control(type, label, attrs = {}, children = [], extra = {}) {
  return { id: uuid(), type, label, attrs, children, ...extra };
}

function container(nvLabel, attrs = {}, children = [], extra = {}) {
  return control("container", "Container", attrs, children, { nv_label: nvLabel, ...extra });
}

function textControl(value, nvLabel, ty = "h5-medium", color = "var(--c--text)") {
  return control("heading", "Text", {
    headc: { title: { value, variable: null } },
    heads: { ty: [null, ty], color },
    common: inlinePositioning()
  }, [], { nv_label: nvLabel });
}

function expressionText(tokens, nvLabel, ty = "base-regular", color = "var(--c--text)") {
  return control("heading", "Text", {
    headc: { title: { value: null, variable: tokens } },
    heads: { ty: [null, ty], color },
    common: inlinePositioning()
  }, [], { nv_label: nvLabel });
}

function paragraph(value, nvLabel) {
  return textControl(value, nvLabel, "s-regular", "var(--c--neutral-dark-hover)");
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

function rowAttrs() {
  return {
    style: {
      gap: [null, "--sp--s150"],
      direction: [null, "row"],
      justify_content: [null, "flex-start"],
      align_items: [null, "center"],
      flex_wrap: [null, "wrap"]
    },
    common: { padding: tokenPadding("--sp--s0") }
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
    IsFilter: ["Title", "Text1", "Text2", "Text3", "Text4"].includes(fieldName),
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

function listViewLayout(fields, visible = ["Title", "Text1", "Text3", "Text4"]) {
  return JSON.stringify({
    layout: fields.filter((field) => !["textarea", "richtext"].includes(field.Type)).map((field, index) => ({
      FieldID: field.FieldID,
      FieldName: field.FieldName,
      Mobile: index === 0 ? 2 : 0,
      Order: index,
      Show: visible.includes(field.FieldName),
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

function customListForm(title, layoutId, listId, fields, readonly = false) {
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
            paragraph(readonly ? "Review persisted form action proof records." : "Maintain records created by the Form Actions Phase 1 Test workflow.", `${title} helper`)
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
    ListID: listId,
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

function makeList(listId, area, title, description, fields, samples = {}) {
  const base = clone(data.Childs[0]);
  const editLayout = localId(area, "0000000001901");
  const viewLayout = localId(area, "0000000001902");
  base.ListModel.ListID = listId;
  base.ListModel.ListType = 1;
  base.ListModel.Title = title;
  base.ListModel.Description = description;
  base.ListModel.IconUrl = iconUrl;
  base.ListModel.CustomType = `ListSite_${rootId}`;
  base.ListModel.Created = generatedAt;
  base.ListModel.Modified = generatedAt;
  base.ListModel.CreatedBy = userId;
  base.ListModel.ModifiedBy = userId;
  base.Defs = fields;
  base.Layouts = [
    {
      LayoutID: localId(area, "0000000001801"),
      Type: 0,
      Title: "All Records",
      IsDefault: true,
      ListID: listId,
      LayoutView: listViewLayout(fields),
      Ext2: null,
      IsItemPerm: false,
      Created: generatedAt,
      Modified: generatedAt,
      CreatedBy: userId,
      ModifiedBy: userId,
      LayoutInResources: []
    },
    customListForm("Edit Item", editLayout, listId, fields, false),
    customListForm("View Item", viewLayout, listId, fields, true)
  ];
  base.ListModel.LayoutView = JSON.stringify({
    add: editLayout,
    edit: editLayout,
    view: viewLayout,
    opentype: { add: "modal" },
    modalsize: {},
    sort: [{ SortName: "Created", SortByDesc: true }]
  });
  base.ListDatas = samples;
  return base;
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
            textControl("Form Actions Phase 1 Test v1", "Dashboard title", "h3-bold"),
            paragraph("A focused proof package for action buttons, temp variables, page-load form actions, Set variable steps, and confirm dialogs.", "Dashboard description")
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

function approvalControl(key, type, label, attrs = {}, readonly = false, pageKey = "submit", extra = {}) {
  const item = {
    id: `fap1-control-${key}-${pageKey}`,
    binding: key,
    type,
    label,
    attrs,
    displayLabel: [null, true],
    nv_label: `${label} control`,
    ...extra
  };
  if (readonly) item.readonly = true;
  return item;
}

function tempVarToken(id, name = id) {
  return { exprType: "variable", valueType: "string", id: `__temp_${id}`, type: "expr", name: id === name ? id : name };
}

function workflowVarToken(id, name, valueType = "text") {
  return { exprType: "variable", valueType, id, type: "expr", name: `Workflow Variables:${name}` };
}

function varButton(varId, name) {
  return `<input type="button" data="\${&quot;type&quot;:&quot;variable&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;${varId}&quot;}}" expr="__" tabindex="-1" value="Workflow Variables:${name}">`;
}

function literalString(value) {
  return [{ type: "str", value }];
}

function actionButton(label, style, nvLabel, controlAction = null, icon = null, iconPosi = null) {
  const attrs = {
    "button-style": style,
    common: inlinePositioning()
  };
  if (controlAction) attrs.control_action = controlAction;
  if (icon) {
    attrs.icon = icon;
    attrs["icon-type"] = "3";
    attrs["icon-posi"] = iconPosi || "1";
  }
  return control("action_button", label, attrs, [], { nv_label: nvLabel });
}

const pageLoadActionId = uuid();
const setTitleActionId = uuid();
const toggleActionId = uuid();
const confirmActionId = uuid();
const resetActionId = uuid();

function pageActions() {
  const tempStatus = tempVarToken("var_TempStatus");
  const clickCount = tempVarToken("var_ClickCount");
  const dialogResult = tempVarToken("var_DialogResult");
  const pageLoadStatus = tempVarToken("var_PageLoadStatus");
  const requestTitle = workflowVarToken("RequestTitle", "Request Title");
  const notes = workflowVarToken("Notes", "Final Notes");
  return [
    {
      id: pageLoadActionId,
      name: "Page Load Initialize",
      steps: [
        {
          type: "setvar",
          name: "Initialize temp display values",
          attrs: {
            setvar_multi: true,
            setvar_array: [
              { var: pageLoadStatus, value: literalString("Page load action initialized") },
              { var: tempStatus, value: literalString("Ready") },
              { var: clickCount, value: [{ type: "num", value: "0" }] },
              { var: dialogResult, value: literalString("No confirmation yet") },
              { var: notes, value: literalString("Initialized by the page load form action.") }
            ]
          }
        }
      ]
    },
    {
      id: setTitleActionId,
      name: "Set Default Request Title",
      steps: [
        {
          type: "setvar",
          name: "Set request title when empty",
          condition: [{ type: "func", func: "isNullOrEmpty", params: [[requestTitle]] }],
          attrs: {
            setvar_var: requestTitle,
            setvar_val: literalString("Form Actions Phase 1 Runtime Test")
          }
        },
        {
          type: "setvar",
          name: "Mark temp status for title update",
          attrs: {
            setvar_var: tempStatus,
            setvar_val: literalString("Default title action ran")
          }
        }
      ]
    },
    {
      id: toggleActionId,
      name: "Toggle Temp Status",
      steps: [
        {
          type: "setvar",
          name: "Toggle click count",
          attrs: {
            setvar_var: clickCount,
            setvar_val: [
              {
                type: "func",
                func: "iif",
                params: [
                  [clickCount, { type: "op", op: "==" }, { type: "num", value: "0" }],
                  [{ type: "num", value: "1" }],
                  [{ type: "num", value: "0" }]
                ]
              }
            ]
          }
        },
        {
          type: "setvar",
          name: "Set temp status clicked",
          condition: [clickCount, { type: "op", op: "==" }, { type: "num", value: "0" }],
          continue: true,
          attrs: {
            setvar_var: tempStatus,
            setvar_val: literalString("Clicked by action button")
          }
        },
        {
          type: "setvar",
          name: "Set temp status unclicked",
          condition: [clickCount, { type: "op", op: "==" }, { type: "num", value: "1" }],
          attrs: {
            setvar_var: tempStatus,
            setvar_val: literalString("Unclicked by action button")
          }
        }
      ]
    },
    {
      id: confirmActionId,
      name: "Show Confirmation Dialog",
      steps: [
        {
          type: "confirm",
          name: "Confirm Phase 1 action",
          attrs: {
            confirm_qs: literalString("Confirm this Phase 1 form action test?"),
            confirm_rs: dialogResult
          }
        }
      ]
    },
    {
      id: resetActionId,
      name: "Reset Temp Status",
      steps: [
        {
          type: "setvar",
          name: "Reset temp status",
          attrs: {
            setvar_var: tempStatus,
            setvar_val: literalString("Reset to default")
          }
        }
      ]
    }
  ];
}

function buttonGallery() {
  return container("Button Style Gallery", {
    style: { gap: [null, "--sp--s150"], direction: [null, "column"] },
    common: { padding: tokenPadding("--sp--s0") }
  }, [
    textControl("Button Style Gallery", "Button style gallery heading", "h6-medium"),
    container("Button style sample row", rowAttrs(), [
      actionButton("Start", "2", "Primary start sample button"),
      actionButton("On hold", "3", "Soft secondary on hold sample button"),
      actionButton("Save", "4", "Outline save sample button"),
      actionButton("Verify", "5", "Neutral verify sample button"),
      actionButton("Import", "6", "Dashed import sample button"),
      actionButton("New item", "6", "Dashed new item sample button", null, "fa-regular fa-plus", "1"),
      actionButton("Next", "6", "Dashed next sample button", null, "fa-regular fa-arrow-right", "2")
    ])
  ]);
}

function actionTestSection() {
  return container("Button Action Test", {
    style: { gap: [null, "--sp--s150"], direction: [null, "column"] },
    common: { padding: tokenPadding("--sp--s0") }
  }, [
    textControl("Button Action Test", "Button action test heading", "h6-medium"),
    container("Button action row", rowAttrs(), [
      actionButton("Toggle temp status", "2", "Toggle temp status action button", toggleActionId),
      actionButton("Set default request title", "3", "Set default request title action button", setTitleActionId),
      actionButton("Show confirmation", "4", "Show confirmation dialog action button", confirmActionId),
      actionButton("Reset temp status", "6", "Reset temp status action button", resetActionId, "fa-regular fa-arrow-rotate-left", "1")
    ])
  ]);
}

function tempVariableDisplaySection() {
  return container("Temp Variable Display", {
    style: { gap: [null, "--sp--s150"], direction: [null, "column"] },
    common: { padding: tokenPadding("--sp--s0") }
  }, [
    textControl("Temp Variable Display", "Temp variable display heading", "h6-medium"),
    container("Temp variable display row", rowAttrs(), [
      expressionText([{ type: "str", value: "Page load status: " }, { type: "op", op: "&" }, tempVarToken("var_PageLoadStatus")], "Page load status display text"),
      expressionText([{ type: "str", value: "Temp status: " }, { type: "op", op: "&" }, tempVarToken("var_TempStatus")], "Temp status display text"),
      expressionText([{ type: "str", value: "Confirmation result: " }, { type: "op", op: "&" }, tempVarToken("var_DialogResult")], "Confirmation result display text"),
      expressionText([{ type: "str", value: "Click count: " }, { type: "op", op: "&" }, tempVarToken("var_ClickCount")], "Click count display text")
    ])
  ]);
}

function requestFieldsSection(readonly, pageKey) {
  return container("Request Fields", {
    style: { gap: [null, "--sp--s150"], direction: [null, "column"] },
    common: { padding: tokenPadding("--sp--s0") }
  }, [
    textControl("Request Fields", "Request fields heading", "h6-medium"),
    flexGrid([
      approvalControl("RequestTitle", "input", "Request Title", { placeholder: "Enter a short request title", required: true }, readonly, pageKey),
      approvalControl("Requester", "identity-picker", "Requester", { default: "currentUser" }, readonly, pageKey, { value: "CurrentUser" }),
      approvalControl("Notes", "textarea", "Final Notes", { edit: { fhlay: "auto", textarea_minrows: 3 }, placeholder: "Optional notes for the approver." }, readonly, pageKey)
    ], "Request fields grid")
  ]);
}

function makeApprovalPage(title, review = false, pageKey = review ? "review" : "submit") {
  const children = [
    textControl(title, `${title} heading`, "h4-medium"),
    paragraph(review ? "Review the submitted request and complete the approval task." : "Use these buttons to prove page-load actions, button-click actions, temp variables, Set variable, and confirm dialogs.", `${title} helper`)
  ];
  if (!review) {
    children.push(buttonGallery(), actionTestSection(), tempVariableDisplaySection(), requestFieldsSection(false, pageKey));
  } else {
    children.push(requestFieldsSection(true, pageKey));
  }
  return {
    children: [
      container("Main", {
        style: { gap: [null, "--sp--s0"], direction: [null, "column"], justify_content: [null, "flex-start"], align_items: [null, "center"] }
      }, [
        container("Content", {
          style: { gap: [null, "--sp--s300"], direction: [null, "column"], justify_content: [null, "flex-start"] },
          common: { padding: tokenPadding("--sp--s300") }
        }, [
          container("Form body", cardAttrs(), children),
          container("Form bottom", {
            style: { gap: [null, "--sp--s200"], direction: [null, "column"] }
          }, [
            { id: `fap1-control-panel-${pageKey}`, type: "workflowControlPanel", label: "Action Panel", attrs: { "show-task-panel": true, rejectValidation: true, align: "center" }, nv_label: "Action panel" },
            { id: `fap1-flow-history-${pageKey}`, type: "workflowHistory", label: "Flow History", attrs: { "show-history": true }, nv_label: "Flow history" }
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

const requestFields = [
  ["Title", "Title", "Title", "Text", "input", { required: true, placeholder: "Title" }],
  ["Text1", "Request Title", "RequestTitle", "Text", "input", { required: false, placeholder: "Request title" }],
  ["Text2", "Final Notes", "FinalNotes", "Text", "textarea", { required: false }],
  ["Text3", "Approval Status", "ApprovalStatus", "Text", "input", { required: false }],
  ["Text4", "Created From Workflow", "CreatedFromWorkflow", "Text", "input", { required: false }],
  ["Text5", "Requester", "Requester", "Text", "input", { required: false }]
].map(([fieldName, displayName, internalName, fieldType, type, rules], index) =>
  makeField(requestListId, 2, index, fieldName, displayName, internalName, fieldType, type, rules)
);

const requestSamples = {
  [localId(2, "0000000011001")]: {
    ListDataID: localId(2, "0000000011001"),
    Title: "Existing form action sample",
    Text1: "Existing form action sample",
    Text2: "Seed row for form action list validation.",
    Text3: "Seed",
    Text4: "Yes"
  }
};

const requestsList = makeList(requestListId, 2, "Form Action Test Requests", "Persisted records created by the Form Actions Phase 1 Test workflow.", requestFields, requestSamples);

data.Childs = [requestsList];
data.Item.ListModel.ListID = rootId;
data.Item.ListModel.Title = "Form Actions Phase 1 Test v1";
data.Item.ListModel.Description = "Small app to prove Yeeflow Form Actions Phase 1 generation.";
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
    { AppID: appId, ListID: requestListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Form Action Test Requests", Icon: "fa-regular fa-list-check" },
    { AppID: "41", Title: "Submit Form Actions Test", ListID: formKey, ListSetID: rootId, Type: 105, Icon: "fa-regular fa-bolt" }
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
form.Name = "Form Actions Phase 1 Test v1";
form.Key = formKey;
form.Description = "Approval form with action buttons, temp variables, page-load action, Set variable, and confirm dialog.";
form.ListID = 0;
form.ProcModelID = processId;
form.ImgResource = iconUrl;
form.DefKey = formKey;
form.ListSetID = rootId;
form.AppListSetID = rootId;
form.ProcModelListSetID = rootId;

const def = JSON.parse(form.DefResource);
def.defkey = formKey;
def.name = "Form Actions Phase 1 Test v1";
def.title = "Form Actions Phase 1 Test v1";
def.workflowType = "approval";
def.ProcModelListID = processId;
def.ProcModelAppID = appId;
def.ProcModelListSetID = rootId;
def.AppListSetID = rootId;
def.listSet = rootId;
def.listInfo = { ListID: requestListId, Title: "Form Action Test Requests" };
def.pageurls[0].id = uuid();
def.pageurls[0].title = "Submit Form Actions Test";
def.pageurls[0].type = 1;
def.pageurls[0].formdef = makeApprovalPage("Submit Form Actions Test", false, "submit");
def.pageurls[0].formdef.id = def.pageurls[0].id;
def.pageurls[0].formdef.actions = pageActions();
def.pageurls[0].formdef.formAction = { onLoad: pageLoadActionId };
def.pageurls[1].id = uuid();
def.pageurls[1].title = "Review Form Actions Test";
def.pageurls[1].type = 2;
def.pageurls[1].formdef = makeApprovalPage("Review Form Actions Test", true, "review");
def.pageurls[1].formdef.id = def.pageurls[1].id;
def.pageurls = def.pageurls.slice(0, 2);
def.variables.basic = [
  { idx: "fap1-var-request-title", id: "RequestTitle", name: "Request Title", type: "text", editable: true },
  { idx: "fap1-var-requester", id: "Requester", name: "Requester", type: "user", editable: true },
  { idx: "fap1-var-notes", id: "Notes", name: "Final Notes", type: "text", editable: true }
];
def.variables.listref = [];
def.variables.tempVars = [
  { idx: "fap1-temp-status", id: "var_TempStatus" },
  { idx: "fap1-temp-click-count", id: "var_ClickCount" },
  { idx: "fap1-temp-dialog-result", id: "var_DialogResult" },
  { idx: "fap1-temp-page-load-status", id: "var_PageLoadStatus" }
];

function workflowNode(resourceid, type, properties, position, incoming = [], outgoing = []) {
  return {
    resourceid,
    stencil: { id: type },
    properties,
    outgoing: outgoing.map((flowId) => ({ id: flowId, resourceid: flowId })),
    incoming: incoming.map((flowId) => ({ id: flowId, resourceid: flowId })),
    id: resourceid,
    date: 1760003900000,
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
    date: 1760003910000,
    source: { id: source, resourceid: source }
  };
}

const startNodeId = "fap1-node-start-0001";
const reviewNodeId = "fap1-node-review-0002";
const persistNodeId = "fap1-node-persist-0003";
const endNodeId = "fap1-node-end-0004";
const rejectNodeId = "fap1-node-reject-0005";
const flowStartReview = "fap1-flow-0001";
const flowApproved = "fap1-flow-0002";
const flowRejected = "fap1-flow-0003";
const flowPersistEnd = "fap1-flow-0004";

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
  }, { x: 190, y: 100 }, [flowStartReview], [flowApproved, flowRejected]),
  workflowNode(persistNodeId, "ContentList", {
    name: "Create Form Action Test Record",
    type: "add",
    appid: appId,
    listsetid: rootId,
    listid: requestListId,
    listtype: "select",
    listdatas: [
      { Per: "0", Columns: "Title", Data: varButton("RequestTitle", "Request Title") },
      { Per: "0", Columns: "Text1", Data: varButton("RequestTitle", "Request Title") },
      { Per: "0", Columns: "Text2", Data: varButton("Notes", "Final Notes") },
      { Per: "0", Columns: "Text3", Data: "Approved" },
      { Per: "0", Columns: "Text4", Data: "Yes" },
      { Per: "0", Columns: "Text5", Data: varButton("Requester", "Requester") }
    ],
    wheres: []
  }, { x: 470, y: 100 }, [flowApproved], [flowPersistEnd]),
  workflowNode(endNodeId, "EndNoneEvent", { name: "End" }, { x: 750, y: 100 }, [flowPersistEnd], []),
  workflowNode(rejectNodeId, "EndRejectEvent", { name: "Rejected" }, { x: 470, y: 280 }, [flowRejected], []),
  workflowFlow(flowStartReview, startNodeId, reviewNodeId, { name: "Start to Reviewer Approval" }),
  workflowFlow(flowApproved, reviewNodeId, persistNodeId, {
    name: "Approved",
    documentation: "Approved",
    conditioninfo: [{ key: "fap1-cond-approved", pre: "and", left: "Reviewer Approval:Outcome", op: "s.=", right: "Task outcome:Approved" }]
  }),
  workflowFlow(flowRejected, reviewNodeId, rejectNodeId, {
    name: "Rejected",
    documentation: "Rejected",
    conditioninfo: [{ key: "fap1-cond-rejected", pre: "and", left: "Reviewer Approval:Outcome", op: "s.=", right: "Task outcome:Rejected" }]
  }),
  workflowFlow(flowPersistEnd, persistNodeId, endNodeId, { name: "Record Created to End" })
];

form.DefResource = JSON.stringify(def);
data.Forms = [form];

app.Title = "Form Actions Phase 1 Test v1";
app.Description = "Small generated app proving Yeeflow Form Actions Phase 1 generation.";
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
  ...requestFields.map((field) => field.FieldID),
  ...requestsList.Layouts.map((layout) => layout.LayoutID),
  ...Object.keys(requestSamples),
  processId,
  formKey
].filter((value, index, all) => value && all.indexOf(value) === index);

fs.writeFileSync(outAppPath, `${JSON.stringify(app, null, 2)}\n`);
fs.writeFileSync(outFormDefPath, `${JSON.stringify(def, null, 2)}\n`);
fs.writeFileSync(outRequestListDefPath, `${JSON.stringify({ Item: requestsList, MainListType: 1, AppID: appId, ReplaceIds: app.ReplaceIds }, null, 2)}\n`);
fs.writeFileSync(outReportPath, `${JSON.stringify({
  generatedAt,
  appName: app.Title,
  idFamily: `${family}...`,
  flowKey: formKey,
  sourceBaseline: sourcePath,
  includedControls: [
    "action_button",
    "heading",
    "input",
    "textarea",
    "workflowControlPanel",
    "workflowHistory"
  ],
  formActions: [
    "Page Load Initialize",
    "Set Default Request Title",
    "Toggle Temp Status",
    "Show Confirmation Dialog",
    "Reset Temp Status"
  ],
  phase1Steps: ["setvar", "confirm"],
  deferredFormActionSteps: ["listitem", "api/request", "data operations beyond ContentList workflow persistence"],
  publishFixes: [
    "removed workflow HTML expression fragments from this focused form-action runtime package",
    "uses requester-expression assignment instead of tenant-specific direct user IDs",
    "uses proven ContentList variable-button mappings for workflow persistence"
  ],
  resources: {
    dataLists: ["Form Action Test Requests"],
    approvalForms: ["Form Actions Phase 1 Test v1"],
    dashboards: ["Overview"]
  }
}, null, 2)}\n`);

console.log(JSON.stringify({
  status: "pass",
  appDef: outAppPath,
  formDef: outFormDefPath,
  requestListDef: outRequestListDefPath,
  report: outReportPath,
  replaceIds: app.ReplaceIds.length
}, null, 2));

import fs from "node:fs";
import crypto from "node:crypto";
import expressionUtils from "./yeeflow-expression-utils.js";

const {
  buildSublistRowCalculationExpression,
  buildNumericWorkflowCondition,
} = expressionUtils;

const sourcePath = "design-system-request-tracker-app-def.v1.json";
const outAppPath = "expression-sublist-summary-workflow-test-v1-app-def.json";
const outFormDefPath = "expression-sublist-summary-workflow-test-v1-approval-form-def.json";
const outRequestListDefPath = "expression-sublist-summary-workflow-test-v1-request-list-def.json";
const outReportPath = "expression-sublist-summary-workflow-test-v1-generation-report.json";

const family = "464";
const generatedAt = "2026-05-14 23:20:00";
const appId = 41;
const tenantId = "1697103066096734208";
const userId = "1697103066163843073";
const rootId = `${family}0010000000000000`;
const dashboardId = `${family}0010000000000001`;
const requestListId = `${family}0020000000001000`;
const processId = `${family}0040000000000001`;
const formKey = "ESSW1";
const iconUrl = JSON.stringify({ b: "#E6F0FF", i: "fa-regular fa-magnifying-glass", c: "#0065FF" });

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const app = JSON.parse(JSON.stringify(source).replaceAll("427", family).replaceAll("DSX", formKey).replaceAll("dsv-", "essw1-"));
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
    IsFilter: ["Title", "Text1", "Text2", "Text3"].includes(fieldName),
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

function listViewLayout(fields, visible = ["Title", "Text1", "Text2", "Text3", "Decimal1", "Bit1"]) {
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
            paragraph(readonly ? "Review saved sublist summary workflow proof data." : "Maintain records created by the sublist summary workflow test.", `${title} helper`)
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
            textControl("Expression Sublist Summary Workflow Test v1", "Dashboard title", "h3-bold"),
            paragraph("A focused proof package for sublist row calculations, summaries, and workflow routing.", "Dashboard description")
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

function approvalControl(key, type, label, attrs = {}, readonly = false, pageKey = "submit", extra = {}) {
  const item = {
    id: `essw1-control-${key}-${pageKey}`,
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

const lineListRefId = "essw1-listref-line-items";
const lineFields = [
  { idx: "essw1-row-product", id: "LineProduct", name: "Product", type: "text", editable: true },
  { idx: "essw1-row-quantity", id: "LineQuantity", name: "Quantity", type: "number", editable: true },
  { idx: "essw1-row-unit-price", id: "LineUnitPrice", name: "Unit Price", type: "number", editable: true },
  { idx: "essw1-row-sub-total", id: "LineSubTotal", name: "Sub Total", type: "number", editable: true },
  { idx: "essw1-row-note", id: "LineNote", name: "Line Note", type: "text", editable: true }
];

function listFieldControlForApproval(field, readonly = false, pageKey = "submit") {
  const base = {
    id: `essw1-list-${field.id}-control-${pageKey}`,
    label: field.name,
    binding: field.id,
    displayLabel: [null, true],
    attrs: {
      list_field: true,
      list_field_binding: "LineItems",
      list_control_id: `essw1-control-LineItems-${pageKey}`
    },
    nv_label: `${field.name} line item control`
  };
  if (field.id === "LineSubTotal") {
    base.type = "calculated";
    base.attrs.calculated = buildSublistRowCalculationExpression({
      listVariableId: "LineItems",
      quantityField: { id: "LineQuantity", name: "Quantity" },
      unitPriceField: { id: "LineUnitPrice", name: "Unit Price" }
    });
    base.value = "";
    base.readonly = true;
  } else if (field.type === "number") {
    base.type = "input_number";
    base.attrs.displayThousandths = "1";
    base.attrs["rounded-to"] = field.id === "LineQuantity" ? 0 : 2;
    if (field.id === "LineQuantity") base.attrs.number_min = 1;
  } else {
    base.type = field.id === "LineNote" ? "textarea" : "input";
    base.attrs.placeholder = `Enter ${field.name.toLowerCase()}`;
  }
  if (readonly) base.readonly = true;
  return base;
}

function lineItemsControl(readonly = false, pageKey = "submit") {
  return {
    id: `essw1-control-LineItems-${pageKey}`,
    type: "list",
    label: "Line Items",
    binding: "LineItems",
    readonly,
    displayLabel: [null, true],
    nv_label: "Line items sublist",
    attrs: {
      "list-fields": lineFields.map((field, index) => ({
        ...field,
        control: listFieldControlForApproval(field, readonly, pageKey),
        attrs: {
          table: {
            cw: [null, field.id === "LineProduct" ? 220 : field.id === "LineNote" ? 260 : field.id === "LineSubTotal" ? 150 : 120]
          }
        },
        Order: index
      })),
      "list-variables": lineFields.map((field) => ({ ...field })),
      "list-fields-summary": readonly ? [] : [
        { id: uuid(), field: "LineQuantity", type: "total", display: true, binding: { prefix: "__variables_", value: "TotalQuantity" } },
        { id: uuid(), field: "LineSubTotal", type: "total", display: true, binding: { prefix: "__variables_", value: "TotalAmount" } },
        { id: uuid(), field: "LineUnitPrice", type: "avg", display: true, binding: { prefix: "__variables_", value: "AverageUnitPrice" } }
      ],
      operation: readonly ? false : true
    }
  };
}

function section(children, nvLabel) {
  return container(nvLabel, {
    style: { gap: [null, "--sp--s150"], direction: [null, "column"] },
    common: { padding: tokenPadding("--sp--s0") }
  }, children);
}

function makeApprovalPage(title, review = false, pageKey = review ? "review" : "submit") {
  const readonly = review;
  const summaryControls = [
    approvalControl("RequestTitle", "input", "Request Title", { placeholder: "Enter a short request title", required: true }, readonly, pageKey),
    approvalControl("Requester", "identity-picker", "Requester", { default: "currentUser" }, true, pageKey, { value: "CurrentUser" }),
    approvalControl("TotalAmount", "currency", "Total Amount", { currencyCode: "USD", displayFormat: "code", displayThousandths: "1" }, true, pageKey),
    approvalControl("TotalQuantity", "input_number", "Quantity Sum", { displayThousandths: "1", "rounded-to": 0 }, true, pageKey),
    approvalControl("AverageUnitPrice", "currency", "Average Unit Price", { currencyCode: "USD", displayFormat: "code", displayThousandths: "1" }, true, pageKey),
    approvalControl("WorkflowRoute", "input", "Workflow Route", { placeholder: "Set by workflow branch" }, true, pageKey)
  ];
  const longControls = [
    lineItemsControl(readonly, pageKey),
    approvalControl("LineItemsSummary", "textarea", "Line Items Summary", { edit: { fhlay: "auto", textarea_minrows: 3 }, placeholder: "Describe the submitted line items for persistence." }, readonly, pageKey),
    approvalControl("Notes", "textarea", "Notes", { edit: { fhlay: "auto", textarea_minrows: 3 }, placeholder: "Optional context for this sublist summary test" }, readonly, pageKey),
    ...(review ? [approvalControl("DecisionNotes", "textarea", "Decision Notes", { edit: { fhlay: "auto", textarea_minrows: 3 }, placeholder: "Reviewer notes" }, false, pageKey)] : [])
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
            paragraph(review ? "Review line item totals and approve the branch task." : "Add line items to calculate subtotals and route the workflow by total amount.", `${title} helper`),
            flexGrid(summaryControls, "Request summary and total fields grid"),
            section(longControls, "Line item and notes controls")
          ]),
          container("Form bottom", {
            style: { gap: [null, "--sp--s200"], direction: [null, "column"] }
          }, [
            { id: `essw1-control-panel-${pageKey}`, type: "workflowControlPanel", label: "Action Panel", attrs: { "show-task-panel": true, rejectValidation: true, align: "center" }, nv_label: "Action panel" },
            { id: `essw1-flow-history-${pageKey}`, type: "workflowHistory", label: "Flow History", attrs: { "show-history": true }, nv_label: "Flow history" }
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
  ["Title", "Request Title", "RequestTitle", "Text", "input", { required: true, placeholder: "Request title" }],
  ["Decimal1", "Total Amount", "TotalAmount", "Decimal", "currency", { required: false, currencyCode: "USD" }],
  ["Decimal2", "Quantity Sum", "TotalQuantity", "Decimal", "input_number", { required: false }],
  ["Decimal3", "Average Unit Price", "AverageUnitPrice", "Decimal", "currency", { required: false, currencyCode: "USD" }],
  ["Text1", "Workflow Route", "WorkflowRoute", "Text", "input", { required: false }],
  ["Text2", "Line Items Summary", "LineItemsSummary", "Text", "textarea", { required: false }],
  ["Text3", "Approval Status", "ApprovalStatus", "Text", "input", { required: false }],
  ["Bit1", "Created From Workflow", "CreatedFromWorkflow", "Bit", "switch", { required: false }]
].map(([fieldName, displayName, internalName, fieldType, type, rules], index) =>
  makeField(requestListId, 2, index, fieldName, displayName, internalName, fieldType, type, rules)
);

const requestSamples = {
  [localId(2, "0000000011001")]: {
    ListDataID: localId(2, "0000000011001"),
    Title: "Existing sublist summary sample",
    Decimal1: 5200,
    Decimal2: 4,
    Decimal3: 1300,
    Text1: "Seed",
    Text2: "Seed row for sublist summary controls.",
    Text3: "Seed",
    Bit1: "1"
  }
};

const requestsList = makeList(requestListId, 2, "Sublist Summary Workflow Requests", "Persisted records created by the Expression Sublist Summary Workflow Test v1 workflow.", requestFields, requestSamples);

data.Childs = [requestsList];
data.Item.ListModel.ListID = rootId;
data.Item.ListModel.Title = "Expression Sublist Summary Workflow Test v1";
data.Item.ListModel.Description = "Small app to prove sublist summaries and workflow branch conditions.";
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
    { AppID: appId, ListID: requestListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Sublist Summary Workflow Requests", Icon: "fa-regular fa-list-check" },
    { AppID: "41", Title: "Submit Purchase Line Items", ListID: formKey, ListSetID: rootId, Type: 105, Icon: "fa-regular fa-calculator" }
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
form.Name = "Expression Sublist Summary Workflow Test v1";
form.Key = formKey;
form.Description = "Approval form with sublist row calculations, summaries, and workflow branch conditions.";
form.ListID = 0;
form.ProcModelID = processId;
form.ImgResource = iconUrl;
form.DefKey = formKey;
form.ListSetID = rootId;
form.AppListSetID = rootId;
form.ProcModelListSetID = rootId;

const def = JSON.parse(form.DefResource);
def.defkey = formKey;
def.name = "Expression Sublist Summary Workflow Test v1";
def.title = "Expression Sublist Summary Workflow Test v1";
def.workflowType = "approval";
def.ProcModelListID = processId;
def.ProcModelAppID = appId;
def.ProcModelListSetID = rootId;
def.AppListSetID = rootId;
def.listSet = rootId;
def.listInfo = { ListID: requestListId, Title: "Sublist Summary Workflow Requests" };
def.pageurls[0].id = uuid();
def.pageurls[0].title = "Submit Purchase Line Items";
def.pageurls[0].type = 1;
def.pageurls[0].formdef = makeApprovalPage("Submit Purchase Line Items", false, "submit");
def.pageurls[0].formdef.id = def.pageurls[0].id;
def.pageurls[1].id = uuid();
def.pageurls[1].title = "Reviewer Approval";
def.pageurls[1].type = 2;
def.pageurls[1].formdef = makeApprovalPage("Reviewer Approval", true, "reviewer");
def.pageurls[1].formdef.id = def.pageurls[1].id;
def.pageurls[2] = {
  id: uuid(),
  title: "Department Manager Approval",
  type: 2,
  pagetype: 1,
  formdef: makeApprovalPage("Department Manager Approval", true, "department")
};
def.pageurls[2].formdef.id = def.pageurls[2].id;
def.pageurls[3] = {
  id: uuid(),
  title: "Line Manager Approval",
  type: 2,
  pagetype: 1,
  formdef: makeApprovalPage("Line Manager Approval", true, "line")
};
def.pageurls[3].formdef.id = def.pageurls[3].id;
def.variables.basic = [
  { idx: "essw1-var-request-title", id: "RequestTitle", name: "Request Title", type: "text", editable: true },
  { idx: "essw1-var-requester", id: "Requester", name: "Requester", type: "user", editable: true },
  { idx: "essw1-var-line-items", id: "LineItems", name: "Line Items", type: "list", editable: true, value: lineListRefId },
  { idx: "essw1-var-total-quantity", id: "TotalQuantity", name: "Quantity Sum", type: "number", editable: true },
  { idx: "essw1-var-average-unit-price", id: "AverageUnitPrice", name: "Average Unit Price", type: "number", editable: true },
  { idx: "essw1-var-total-amount", id: "TotalAmount", name: "Total Amount", type: "number", editable: true },
  { idx: "essw1-var-workflow-route", id: "WorkflowRoute", name: "Workflow Route", type: "text", editable: true },
  { idx: "essw1-var-line-items-summary", id: "LineItemsSummary", name: "Line Items Summary", type: "text", editable: true },
  { idx: "essw1-var-notes", id: "Notes", name: "Notes", type: "text", editable: true },
  { idx: "essw1-var-decision-notes", id: "DecisionNotes", name: "Decision Notes", type: "text", editable: true }
];
def.variables.listref = [
  {
    id: lineListRefId,
    name: "LineItems",
    idx: "essw1-listref-line-items-idx",
    fields: lineFields
  }
];

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

const startNodeId = "essw1-node-start-0001";
const reviewNodeId = "essw1-node-review-0002";
const gatewayNodeId = "essw1-node-gateway-0003";
const deptNodeId = "essw1-node-dept-0004";
const lineNodeId = "essw1-node-line-0005";
const deptPersistNodeId = "essw1-node-persist-dept-0006";
const linePersistNodeId = "essw1-node-persist-line-0007";
const endNodeId = "essw1-node-end-0008";
const rejectNodeId = "essw1-node-reject-0009";
const flowStartReview = "essw1-flow-0001";
const flowApproved = "essw1-flow-0002";
const flowRejected = "essw1-flow-0003";
const flowGatewayDept = "essw1-flow-0004";
const flowGatewayLine = "essw1-flow-0005";
const flowDeptApproved = "essw1-flow-0006";
const flowDeptRejected = "essw1-flow-0007";
const flowLineApproved = "essw1-flow-0008";
const flowLineRejected = "essw1-flow-0009";
const flowDeptPersistEnd = "essw1-flow-0010";
const flowLinePersistEnd = "essw1-flow-0011";

function contentListNode(nodeId, name, routeName, position, incoming, outgoing) {
  return workflowNode(nodeId, "ContentList", {
    name,
    type: "add",
    appid: appId,
    listsetid: rootId,
    listid: requestListId,
    listtype: "select",
    listdatas: [
      { Per: "0", Columns: "Title", Data: varButton("RequestTitle", "Request Title") },
      { Per: "0", Columns: "Decimal1", Data: varButton("TotalAmount", "Total Amount") },
      { Per: "0", Columns: "Decimal2", Data: varButton("TotalQuantity", "Quantity Sum") },
      { Per: "0", Columns: "Decimal3", Data: varButton("AverageUnitPrice", "Average Unit Price") },
      { Per: "0", Columns: "Text1", Data: routeName },
      { Per: "0", Columns: "Text2", Data: varButton("LineItemsSummary", "Line Items Summary") },
      { Per: "0", Columns: "Text3", Data: "Approved" },
      { Per: "0", Columns: "Bit1", Data: "1" }
    ],
    wheres: []
  }, position, incoming, outgoing);
}

function numericCondition(variableId, operator, threshold, key) {
  return { ...buildNumericWorkflowCondition({ id: variableId, valueType: "number", key }, operator, threshold), key };
}

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
  }, { x: 170, y: 100 }, [flowStartReview], [flowApproved, flowRejected]),
  workflowNode(gatewayNodeId, "InclusiveGateway", { name: "Total Amount Gateway" }, { x: 430, y: 100 }, [flowApproved], [flowGatewayDept, flowGatewayLine]),
  workflowNode(deptNodeId, "MultiAssignmentTask", {
    name: "Department Manager Approval",
    approveway: "allapprove",
    approvepercentage: 100,
    allowskip: true,
    isallowreassign: false,
    isallowsign: false,
    usertaskassignment: [{ type: "user", method: "expression", value: varButton("Requester", "Requester"), title: `User:${varButton("Requester", "Requester")}` }],
    taskurl: def.pageurls[2].id,
    duedatedefinition: 48,
    duedatetype: "hour"
  }, { x: 650, y: 10 }, [flowGatewayDept], [flowDeptApproved, flowDeptRejected]),
  workflowNode(lineNodeId, "MultiAssignmentTask", {
    name: "Line Manager Approval",
    approveway: "allapprove",
    approvepercentage: 100,
    allowskip: true,
    isallowreassign: false,
    isallowsign: false,
    usertaskassignment: [{ type: "user", method: "expression", value: varButton("Requester", "Requester"), title: `User:${varButton("Requester", "Requester")}` }],
    taskurl: def.pageurls[3].id,
    duedatedefinition: 48,
    duedatetype: "hour"
  }, { x: 650, y: 200 }, [flowGatewayLine], [flowLineApproved, flowLineRejected]),
  contentListNode(deptPersistNodeId, "Create High Value Record", "Department Manager Approval", { x: 940, y: 10 }, [flowDeptApproved], [flowDeptPersistEnd]),
  contentListNode(linePersistNodeId, "Create Normal Value Record", "Line Manager Approval", { x: 940, y: 200 }, [flowLineApproved], [flowLinePersistEnd]),
  workflowNode(endNodeId, "EndNoneEvent", { name: "End" }, { x: 1220, y: 100 }, [flowDeptPersistEnd, flowLinePersistEnd], []),
  workflowNode(rejectNodeId, "EndRejectEvent", { name: "Rejected" }, { x: 940, y: 380 }, [flowRejected, flowDeptRejected, flowLineRejected], []),
  workflowFlow(flowStartReview, startNodeId, reviewNodeId, { name: "Start to Reviewer Approval" }),
  workflowFlow(flowApproved, reviewNodeId, gatewayNodeId, {
    name: "Reviewer Approved",
    documentation: "Approved",
    conditioninfo: [{ key: "essw1-cond-approved", pre: "and", left: taskOutcomeButton(reviewNodeId, "Reviewer Approval"), op: "s.=", right: outcomeValueButton("Approved") }]
  }),
  workflowFlow(flowRejected, reviewNodeId, rejectNodeId, {
    name: "Reviewer Rejected",
    documentation: "Rejected",
    conditioninfo: [{ key: "essw1-cond-rejected", pre: "and", left: taskOutcomeButton(reviewNodeId, "Reviewer Approval"), op: "s.=", right: outcomeValueButton("Rejected") }]
  }),
  workflowFlow(flowGatewayDept, gatewayNodeId, deptNodeId, {
    name: "Amount greater than 5000",
    documentation: "Amount > 5000",
    conditioninfo: [numericCondition("TotalAmount", ">", 5000, "essw1-cond-high-value")]
  }),
  workflowFlow(flowGatewayLine, gatewayNodeId, lineNodeId, {
    name: "Amount less than or equal to 5000",
    documentation: "Amount <= 5000",
    conditioninfo: [numericCondition("TotalAmount", "<=", 5000, "essw1-cond-normal-value")]
  }),
  workflowFlow(flowDeptApproved, deptNodeId, deptPersistNodeId, {
    name: "Department Manager Approved",
    documentation: "Approved",
    conditioninfo: [{ key: "essw1-cond-dept-approved", pre: "and", left: taskOutcomeButton(deptNodeId, "Department Manager Approval"), op: "s.=", right: outcomeValueButton("Approved") }]
  }),
  workflowFlow(flowDeptRejected, deptNodeId, rejectNodeId, {
    name: "Department Manager Rejected",
    documentation: "Rejected",
    conditioninfo: [{ key: "essw1-cond-dept-rejected", pre: "and", left: taskOutcomeButton(deptNodeId, "Department Manager Approval"), op: "s.=", right: outcomeValueButton("Rejected") }]
  }),
  workflowFlow(flowLineApproved, lineNodeId, linePersistNodeId, {
    name: "Line Manager Approved",
    documentation: "Approved",
    conditioninfo: [{ key: "essw1-cond-line-approved", pre: "and", left: taskOutcomeButton(lineNodeId, "Line Manager Approval"), op: "s.=", right: outcomeValueButton("Approved") }]
  }),
  workflowFlow(flowLineRejected, lineNodeId, rejectNodeId, {
    name: "Line Manager Rejected",
    documentation: "Rejected",
    conditioninfo: [{ key: "essw1-cond-line-rejected", pre: "and", left: taskOutcomeButton(lineNodeId, "Line Manager Approval"), op: "s.=", right: outcomeValueButton("Rejected") }]
  }),
  workflowFlow(flowDeptPersistEnd, deptPersistNodeId, endNodeId, { name: "High Value Record Created to End" }),
  workflowFlow(flowLinePersistEnd, linePersistNodeId, endNodeId, { name: "Normal Value Record Created to End" })
];

form.DefResource = JSON.stringify(def);
data.Forms = [form];

app.Title = "Expression Sublist Summary Workflow Test v1";
app.Description = "Small generated app proving sublist row calculations, summaries, and workflow branch routing.";
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
    "list",
    "calculated",
    "list-fields-summary",
    "workflow numeric conditioninfo",
    "workflowControlPanel",
    "workflowHistory"
  ],
  deferredControls: ["direct child-row data-list persistence", "lookup-list", "data-list", "metadata", "mutiple-metadata", "tag", "signer"],
  persistencePolicy: "Sublist row values are summarized through list summary bindings. Direct child-row persistence remains deferred; durable records persist summary variables and line item text summary through ContentList.",
  resources: {
    dataLists: ["Sublist Summary Workflow Requests"],
    approvalForms: ["Expression Sublist Summary Workflow Test v1"],
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

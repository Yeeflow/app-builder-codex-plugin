import fs from "node:fs";
import crypto from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { validateExpressionTokens } = require("./yeeflow-expression-utils.js");

const sourcePath = "design-system-request-tracker-app-def.v1.json";
const outAppPath = "expression-runtime-test-v1-app-def.json";
const outFormDefPath = "expression-runtime-test-v1-approval-form-def.json";
const outRequestListDefPath = "expression-runtime-test-v1-request-list-def.json";
const outProductListDefPath = "expression-runtime-test-v1-products-list-def.json";
const outReportPath = "expression-runtime-test-v1-generation-report.json";

const family = "462";
const generatedAt = "2026-05-15 10:20:00";
const appId = 41;
const tenantId = "1697103066096734208";
const userId = "1697103066163843073";
const rootId = `${family}0010000000000000`;
const dashboardId = `${family}0010000000000001`;
const productListId = `${family}0020000000001000`;
const requestListId = `${family}0030000000001000`;
const processId = `${family}0040000000000001`;
const formKey = "ERT1B";
const iconUrl = JSON.stringify({ b: "#E6F0FF", i: "fa-regular fa-function", c: "#0065FF" });

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const app = JSON.parse(JSON.stringify(source).replaceAll("427", family).replaceAll("DSX", formKey).replaceAll("dsv-", "ert1-"));
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
    IsFilter: ["Title", "Text1", "Text2", "Text3", "Text4", "Decimal1", "Decimal2", "Decimal3", "Decimal4", "Datetime1", "Bit1"].includes(fieldName),
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
            paragraph(readonly ? "Review saved expression runtime proof data." : "Maintain sample records used by the expression runtime test.", `${title} helper`)
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
            textControl("Expression Runtime Test v1", "Dashboard title", "h3-bold"),
            paragraph("A focused proof package for calculated controls, display rules, validation, lookup filters, workflow conditions, request numbers, and ContentList persistence.", "Dashboard description")
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

function workflowVar(id, name, valueType) {
  return { exprType: "variable", valueType, id, type: "expr", name: `Workflow Variables:${name}` };
}

function subtotalExpression() {
  return [
    workflowVar("Quantity", "Quantity", "number"),
    { type: "op", op: "*" },
    workflowVar("UnitPrice", "Unit Price", "number")
  ];
}

function highValueExpression() {
  return [
    workflowVar("TotalAmount", "Total Amount", "number"),
    { type: "op", op: ">" },
    { type: "num", value: "10000" }
  ];
}

function requiredDateExpression() {
  return [
    {
      type: "func",
      func: "dateDiff",
      params: [
        [workflowVar("RequiredDate", "Required Date", "date")],
        [{ type: "func", func: "now", params: [] }],
        [{ type: "str", value: "day" }],
        [{ type: "bool", value: false }]
      ]
    },
    { type: "op", op: ">=" },
    { type: "num", value: "0" }
  ];
}

function requestNoExpression() {
  return [
    { type: "str", value: "REQ-" },
    { type: "op", op: "&" },
    {
      type: "func",
      func: "dateFormat",
      params: [
        [{ type: "func", func: "now", params: [] }],
        [{ type: "str", value: "YYYYMMDD" }]
      ]
    },
    { type: "op", op: "&" },
    { type: "str", value: "-" },
    { type: "op", op: "&" },
    { type: "func", func: "UniqueID", params: [] }
  ];
}

function financeRouteExpression() {
  return [
    workflowVar("TotalAmount", "Total Amount", "number"),
    { type: "op", op: ">=" },
    { type: "num", value: "5000" }
  ];
}

function dynamicShowRule(controlId) {
  return {
    id: `ert1-display-rule-${controlId}`,
    controlId,
    formulas: highValueExpression(),
    actions: {
      id: `ert1-display-action-${controlId}`,
      type: 1,
      attrs: {
        style_regulation_action: "style_regulation_action_show",
        style_regulation_action_color: null,
        action_style: null,
        icon_type: null
      }
    }
  };
}

function validationRule(controlId) {
  return {
    id: `ert1-validation-rule-${controlId}`,
    controlId,
    formulas: requiredDateExpression(),
    message: "Required Date must be today or later.",
    actions: {
      id: `ert1-validation-action-${controlId}`,
      type: "validation",
      attrs: { message: "Required Date must be today or later." }
    }
  };
}

function approvalControl(key, type, label, attrs = {}, readonly = false, pageReview = false, extra = {}) {
  const item = {
    id: `ert1-control-${key}-${pageReview ? "review" : "submit"}`,
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

const lineListRefId = "ert1-listref-line-items";
const lineFields = [
  { idx: "ert1-row-product", id: "LineProduct", name: "Product", type: "text", editable: true },
  { idx: "ert1-row-quantity", id: "LineQuantity", name: "Quantity", type: "number", editable: true },
  { idx: "ert1-row-unit-price", id: "LineUnitPrice", name: "Unit Price", type: "number", editable: true },
  { idx: "ert1-row-note", id: "LineNote", name: "Line Note", type: "text", editable: true }
];

function listFieldControlForApproval(field, readonly = false) {
  const base = {
    id: `ert1-list-${field.id}-control${readonly ? "-review" : "-submit"}`,
    label: field.name,
    binding: field.id,
    displayLabel: [null, true],
    attrs: {
      list_field: true,
      list_field_binding: "LineItems",
      list_control_id: `ert1-control-LineItems-${readonly ? "review" : "submit"}`
    },
    nv_label: `${field.name} line item control`
  };
  if (field.type === "number") {
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

function lineItemsControl(readonly = false) {
  return {
    id: `ert1-control-LineItems-${readonly ? "review" : "submit"}`,
    type: "list",
    label: "Line Items",
    binding: "LineItems",
    readonly,
    displayLabel: [null, true],
    nv_label: "Line items sublist",
    attrs: {
      "list-fields": lineFields.map((field, index) => ({
        ...field,
        control: listFieldControlForApproval(field, readonly),
        attrs: {
          table: {
            cw: [null, field.id === "LineProduct" ? 220 : field.id === "LineNote" ? 260 : 120]
          }
        },
        Order: index
      })),
      "list-variables": lineFields.map((field) => ({ ...field })),
      "list-fields-summary": [],
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

function productLookupAttrs(productFields) {
  const field = (name) => productFields.find((item) => item.FieldName === name);
  return {
    appid: appId,
    listsetid: rootId,
    listid: productListId,
    listfield: "Title",
    listfilter: [
      {
        key: "ert1-filter-active-products",
        pre: "and",
        left: "Bit1",
        op: "0",
        right: "1",
        showCus: true,
        expressionTokens: [
          { exprType: "variable", valueType: "boolean", id: "Active", type: "expr", name: "Reference Products:Active" },
          { type: "op", op: "==" },
          { type: "bool", value: true }
        ]
      }
    ],
    addition: [
      { FieldName: "Title", FieldID: field("Title").FieldID, RelationName: "ProductName", RelationFieldName: "Product Name", RelationFieldIsMultiple: false, IsShow: true, Order: 1 },
      { FieldName: "Text1", FieldID: field("Text1").FieldID, RelationName: "ProductCode", RelationFieldName: "Product Code", RelationFieldIsMultiple: false, IsShow: true, Order: 2 },
      { FieldName: "Decimal1", FieldID: field("Decimal1").FieldID, RelationName: "UnitPrice", RelationFieldName: "Unit Price", RelationFieldIsMultiple: false, IsShow: true, Order: 3 }
    ],
    list_tooltip_field: null,
    "sort-first": { SortName: "Created", SortByDesc: false },
    "search-scope": "3",
    "search-fields": ["Title", "Text1"],
    link: "default",
    "modal-size": 2,
    displayStyle: "dropdown",
    placeholder: "Select a product"
  };
}

function makeApprovalPage(title, productFields, review = false) {
  const readonly = review;
  const requiredDateControlId = `ert1-control-RequiredDate-${review ? "review" : "submit"}`;
  const highValueReasonControlId = `ert1-control-HighValueReason-${review ? "review" : "submit"}`;
  const mainControls = [
    approvalControl("RequestNo", "input", "Request No", { placeholder: "Generated after submit" }, true, review),
    approvalControl("RequestTitle", "input", "Request Title", { placeholder: "Enter a short request title", required: true }, readonly, review),
    approvalControl("Requester", "identity-picker", "Requester", { default: "currentUser" }, true, review, { value: "CurrentUser" }),
    approvalControl("SelectedProduct", "lookup", "Lookup Product", productLookupAttrs(productFields), readonly, review),
    approvalControl("ProductName", "input", "Product Name", { placeholder: "Autofilled from product lookup" }, true, review),
    approvalControl("ProductCode", "input", "Product Code", { placeholder: "Autofilled from product lookup" }, true, review),
    approvalControl("UnitPrice", "currency", "Unit Price", { currencyCode: "USD", displayFormat: "code", displayThousandths: "1" }, true, review),
    approvalControl("Quantity", "input_number", "Quantity", { displayThousandths: "1", "rounded-to": 0, number_min: 1, placeholder: "Enter quantity" }, readonly, review),
    approvalControl("Subtotal", "calculated", "Subtotal", { calculated: subtotalExpression(), currencyCode: "USD", displayFormat: "code" }, true, review),
    approvalControl("TotalAmount", "currency", "Total Amount", { currencyCode: "USD", displayFormat: "code", displayThousandths: "1", number_min: 0, placeholder: "Enter total amount for routing" }, readonly, review),
    approvalControl("RequiredDate", "datepicker", "Required Date", {
      required: true,
      date_picker: "date",
      date_type: "1",
      dateformat: "0",
      placeholder: "Select today or a future date",
      ...(!review ? { control_validation: [validationRule(requiredDateControlId)] } : {})
    }, readonly, review, { id: requiredDateControlId }),
    approvalControl("WorkflowRoute", "input", "Expected Workflow Route", { placeholder: "Route is set by workflow transition condition" }, true, review)
  ];
  const longControls = [
    approvalControl("HighValueReason", "textarea", "High Value Reason", {
      edit: { fhlay: "auto", textarea_minrows: 3 },
      placeholder: "Required when Total Amount is greater than 10,000",
      ...(!review ? { control_display: [dynamicShowRule(highValueReasonControlId)] } : {})
    }, readonly, review, { id: highValueReasonControlId }),
    approvalControl("Notes", "textarea", "Notes", { edit: { fhlay: "auto", textarea_minrows: 3 }, placeholder: "Optional context for this expression runtime test" }, readonly, review),
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
            paragraph(review ? "Review expression-generated values and approve the request." : "Test calculated controls, display rules, validation, lookup filters, workflow conditions, request number generation, and ContentList persistence.", `${title} helper`),
            flexGrid(mainControls, "Expression input and calculated fields grid"),
            section(longControls, "Conditional reason and notes controls")
          ]),
          container("Form bottom", {
            style: { gap: [null, "--sp--s200"], direction: [null, "column"] }
          }, [
            { id: `ert1-control-panel-${review ? "review" : "submit"}`, type: "workflowControlPanel", label: "Action Panel", attrs: { "show-task-panel": true, rejectValidation: true, align: "center" }, nv_label: "Action panel" },
            { id: `ert1-flow-history-${review ? "review" : "submit"}`, type: "workflowHistory", label: "Flow History", attrs: { "show-history": true }, nv_label: "Flow history" }
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

const productFields = [
  ["Title", "Product Name", "ProductName", "Text", "input", { required: true, placeholder: "Product name" }],
  ["Text1", "Product Code", "ProductCode", "Text", "input", { required: true }],
  ["Decimal1", "Unit Price", "UnitPrice", "Decimal", "currency", { required: false, currencyCode: "USD", displayFormat: "code" }],
  ["Bit1", "Active", "Active", "Bit", "switch", { required: false }]
].map(([fieldName, displayName, internalName, fieldType, type, rules], index) =>
  makeField(productListId, 2, index, fieldName, displayName, internalName, fieldType, type, rules)
);

const requestFields = [
  ["Title", "Request No", "RequestNo", "Text", "input", { required: true, placeholder: "Generated request number" }],
  ["Text1", "Product Name", "ProductName", "Text", "input", { required: false }],
  ["Decimal1", "Quantity", "Quantity", "Decimal", "input_number", { required: false }],
  ["Decimal2", "Unit Price", "UnitPrice", "Decimal", "currency", { required: false, currencyCode: "USD" }],
  ["Decimal3", "Subtotal", "Subtotal", "Decimal", "currency", { required: false, currencyCode: "USD" }],
  ["Decimal4", "Total Amount", "TotalAmount", "Decimal", "currency", { required: false, currencyCode: "USD" }],
  ["Text2", "High Value Reason", "HighValueReason", "Text", "textarea", { required: false }],
  ["Datetime1", "Required Date", "RequiredDate", "Datetime", "datepicker", { required: false }],
  ["Text3", "Approval Status", "ApprovalStatus", "Text", "input", { required: false }],
  ["Text4", "Workflow Route", "WorkflowRoute", "Text", "input", { required: false }],
  ["Text5", "Request Title", "RequestTitle", "Text", "input", { required: false }],
  ["Bit1", "Created From Workflow", "CreatedFromWorkflow", "Bit", "switch", { required: false }]
].map(([fieldName, displayName, internalName, fieldType, type, rules], index) =>
  makeField(requestListId, 3, index, fieldName, displayName, internalName, fieldType, type, rules)
);

const productSamples = {
  [localId(2, "0000000011001")]: { ListDataID: localId(2, "0000000011001"), Title: "Standard Laptop", Text1: "LAP-STD", Decimal1: 1250, Bit1: "1" },
  [localId(2, "0000000011002")]: { ListDataID: localId(2, "0000000011002"), Title: "Docking Station", Text1: "DOCK-USB-C", Decimal1: 220, Bit1: "1" },
  [localId(2, "0000000011003")]: { ListDataID: localId(2, "0000000011003"), Title: "Retired Monitor", Text1: "MON-OLD", Decimal1: 180, Bit1: "0" }
};

const requestSamples = {
  [localId(3, "0000000011001")]: {
    ListDataID: localId(3, "0000000011001"),
    Title: "REQ-SEED-001",
    Text1: "Standard Laptop",
    Decimal1: 2,
    Decimal2: 1250,
    Decimal3: 2500,
    Decimal4: 2500,
    Text2: "Seed high value reason.",
    Datetime1: "2026-05-15",
    Text3: "Seed",
    Text4: "Seed route",
    Text5: "Existing expression sample",
    Bit1: "1"
  }
};

const productsList = makeList(productListId, 2, "Reference Products", "Internal packaged source list for active-product lookup filter runtime testing.", productFields, productSamples);
const requestsList = makeList(requestListId, 3, "Expression Test Requests", "Persisted records created by the Expression Runtime Test v1 workflow.", requestFields, requestSamples);

data.Childs = [productsList, requestsList];
data.Item.ListModel.ListID = rootId;
data.Item.ListModel.Title = "Expression Runtime Test v1";
data.Item.ListModel.Description = "Small app to prove expression runtime contexts across approval forms, lookup filters, workflow conditions, and ContentList persistence.";
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
    { AppID: appId, ListID: productListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Reference Products", Icon: "fa-regular fa-boxes-stacked" },
    { AppID: appId, ListID: requestListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Expression Test Requests", Icon: "fa-regular fa-list-check" },
    { AppID: "41", Title: "Submit Expression Test", ListID: formKey, ListSetID: rootId, Type: 105, Icon: "fa-regular fa-magnifying-glass" }
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
form.Name = "Expression Runtime Test v1";
form.Key = formKey;
form.Description = "Approval form with expression runtime controls learned from AI Training.";
form.ListID = 0;
form.ProcModelID = processId;
form.ImgResource = iconUrl;
form.DefKey = formKey;
form.ListSetID = rootId;
form.AppListSetID = rootId;
form.ProcModelListSetID = rootId;

const def = JSON.parse(form.DefResource);
def.defkey = formKey;
def.name = "Expression Runtime Test v1";
def.title = "Expression Runtime Test v1";
def.workflowType = "approval";
def.ProcModelListID = processId;
def.ProcModelAppID = appId;
def.ProcModelListSetID = rootId;
def.AppListSetID = rootId;
def.listSet = rootId;
def.listInfo = { ListID: requestListId, Title: "Expression Test Requests" };
def.pageurls[0].id = uuid();
def.pageurls[0].title = "Submit Expression Test";
def.pageurls[0].type = 1;
def.pageurls[0].formdef = makeApprovalPage("Submit Expression Test", productFields, false);
def.pageurls[0].formdef.id = def.pageurls[0].id;
def.pageurls[1].id = uuid();
def.pageurls[1].title = "Review Expression Test";
def.pageurls[1].type = 2;
def.pageurls[1].formdef = makeApprovalPage("Review Expression Test", productFields, true);
def.pageurls[1].formdef.id = def.pageurls[1].id;
def.variables.basic = [
  { idx: "ert1-var-request-no", id: "RequestNo", name: "Request No", type: "text", editable: true },
  { idx: "ert1-var-request-title", id: "RequestTitle", name: "Request Title", type: "text", editable: true },
  { idx: "ert1-var-requester", id: "Requester", name: "Requester", type: "user", editable: true },
  { idx: "ert1-var-selected-product", id: "SelectedProduct", name: "Selected Product", type: "lookup", editable: true, value: { AppID: appId, ListID: productListId, ListSetID: rootId } },
  { idx: "ert1-var-product-name", id: "ProductName", name: "Product Name", type: "text", editable: true },
  { idx: "ert1-var-product-code", id: "ProductCode", name: "Product Code", type: "text", editable: true },
  { idx: "ert1-var-quantity", id: "Quantity", name: "Quantity", type: "number", editable: true },
  { idx: "ert1-var-unit-price", id: "UnitPrice", name: "Unit Price", type: "number", editable: true },
  { idx: "ert1-var-subtotal", id: "Subtotal", name: "Subtotal", type: "number", editable: true },
  { idx: "ert1-var-total-amount", id: "TotalAmount", name: "Total Amount", type: "number", editable: true },
  { idx: "ert1-var-high-value-reason", id: "HighValueReason", name: "High Value Reason", type: "text", editable: true },
  { idx: "ert1-var-required-date", id: "RequiredDate", name: "Required Date", type: "date", editable: true },
  { idx: "ert1-var-workflow-route", id: "WorkflowRoute", name: "Workflow Route", type: "text", editable: true },
  { idx: "ert1-var-notes", id: "Notes", name: "Notes", type: "text", editable: true },
  { idx: "ert1-var-decision-notes", id: "DecisionNotes", name: "Decision Notes", type: "text", editable: true }
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

const startNodeId = "ert1-node-start-0001";
const setVarsNodeId = "ert1-node-setvars-0002";
const financeNodeId = "ert1-node-finance-0003";
const persistFinanceNodeId = "ert1-node-persist-finance-0005";
const endNodeId = "ert1-node-end-0007";
const rejectNodeId = "ert1-node-reject-0008";
const flowStartSet = "ert1-flow-0001";
const flowSetFinance = "ert1-flow-0002";
const flowFinanceApproved = "ert1-flow-0004";
const flowFinanceRejected = "ert1-flow-0005";
const flowPersistFinanceEnd = "ert1-flow-0008";

function contentListNode(resourceid, name, routeName, position, incoming, outgoing) {
  return workflowNode(resourceid, "ContentList", {
    name,
    type: "add",
    appid: appId,
    listsetid: rootId,
    listid: requestListId,
    listtype: "select",
    listdatas: [
      { Per: "0", Columns: "Title", Data: varButton("RequestNo", "Request No") },
      { Per: "0", Columns: "Text1", Data: varButton("ProductName", "Product Name") },
      { Per: "0", Columns: "Decimal1", Data: varButton("Quantity", "Quantity") },
      { Per: "0", Columns: "Decimal2", Data: varButton("UnitPrice", "Unit Price") },
      { Per: "0", Columns: "Decimal3", Data: varButton("Subtotal", "Subtotal") },
      { Per: "0", Columns: "Decimal4", Data: varButton("TotalAmount", "Total Amount") },
      { Per: "0", Columns: "Text2", Data: varButton("HighValueReason", "High Value Reason") },
      { Per: "0", Columns: "Datetime1", Data: varButton("RequiredDate", "Required Date") },
      { Per: "0", Columns: "Text3", Data: "Approved" },
      { Per: "0", Columns: "Text4", Data: routeName },
      { Per: "0", Columns: "Text5", Data: varButton("RequestTitle", "Request Title") },
      { Per: "0", Columns: "Bit1", Data: "1" }
    ],
    wheres: []
  }, position, incoming, outgoing);
}

def.childshapes = [
  workflowNode(startNodeId, "StartNoneEvent", { name: "Start", taskurl: def.pageurls[0].id }, { x: -140, y: 120 }, [], [flowStartSet]),
  workflowNode(setVarsNodeId, "SetVariableTask", {
    name: "Set Request Number",
    formtype: "current",
    variablesetting: [
      { key: "ert1-set-request-no", prop: null, id: "RequestNo", name: "Request No", type: "text", value: `<input type="button" data="\${&quot;type&quot;:&quot;application&quot;,&quot;prop&quot;:&quot;FlowNo&quot;}" expr="__" tabindex="-1" value="Tracking No.">` }
    ]
  }, { x: 90, y: 120 }, [flowStartSet], [flowSetFinance]),
  workflowNode(financeNodeId, "MultiAssignmentTask", {
    name: "Finance Review",
    approveway: "allapprove",
    approvepercentage: 100,
    allowskip: true,
    isallowreassign: false,
    isallowsign: false,
    usertaskassignment: [{ type: "user", method: "expression", value: varButton("Requester", "Requester"), title: `User:${varButton("Requester", "Requester")}` }],
    taskurl: def.pageurls[1].id,
    duedatedefinition: 48,
    duedatetype: "hour"
  }, { x: 380, y: 30 }, [flowSetFinance], [flowFinanceApproved, flowFinanceRejected]),
  contentListNode(persistFinanceNodeId, "Create Finance Route Record", "Finance Review", { x: 700, y: 30 }, [flowFinanceApproved], [flowPersistFinanceEnd]),
  workflowNode(endNodeId, "EndNoneEvent", { name: "End" }, { x: 990, y: 120 }, [flowPersistFinanceEnd], []),
  workflowNode(rejectNodeId, "EndRejectEvent", { name: "Rejected" }, { x: 700, y: 220 }, [flowFinanceRejected], []),
  workflowFlow(flowStartSet, startNodeId, setVarsNodeId, { name: "Start to Generate Request Number" }),
  workflowFlow(flowSetFinance, setVarsNodeId, financeNodeId, {
    name: "Route to Finance Review",
    documentation: "Finance route used for v1 runtime persistence proof. The Total Amount >= 5000 transition expression is generated and locally validated, but branching is deferred after first runtime isolation showed the condition shape needs more export-backed study."
  }),
  workflowFlow(flowFinanceApproved, financeNodeId, persistFinanceNodeId, {
    name: "Finance Approved",
    documentation: "Approved",
    conditioninfo: [{ key: "ert1-cond-finance-approved", pre: "and", left: taskOutcomeButton(financeNodeId, "Finance Review"), op: "s.=", right: outcomeValueButton("Approved") }]
  }),
  workflowFlow(flowFinanceRejected, financeNodeId, rejectNodeId, {
    name: "Finance Rejected",
    documentation: "Rejected",
    conditioninfo: [{ key: "ert1-cond-finance-rejected", pre: "and", left: taskOutcomeButton(financeNodeId, "Finance Review"), op: "s.=", right: outcomeValueButton("Rejected") }]
  }),
  workflowFlow(flowPersistFinanceEnd, persistFinanceNodeId, endNodeId, { name: "Finance Route Record Created to End" })
];

form.DefResource = JSON.stringify(def);
data.Forms = [form];

app.Title = "Expression Runtime Test v1";
app.Description = "Small generated app proving expression runtime contexts.";
app.IconUrl = iconUrl;
app.MainListType = 1024;
app.AppID = appId;
app.FormKeys = [formKey];
app.Data = JSON.stringify(data);
app.ReportIds = [];
app.ReplaceIds = [
  rootId,
  dashboardId,
  productListId,
  requestListId,
  ...productFields.map((field) => field.FieldID),
  ...requestFields.map((field) => field.FieldID),
  ...productsList.Layouts.map((layout) => layout.LayoutID),
  ...requestsList.Layouts.map((layout) => layout.LayoutID),
  ...Object.keys(productSamples),
  ...Object.keys(requestSamples),
  processId,
  formKey
].filter((value, index, all) => value && all.indexOf(value) === index);

const expressionInventory = {
  calculatedSubtotal: subtotalExpression(),
  dynamicDisplayHighValueReason: highValueExpression(),
  customValidationRequiredDate: requiredDateExpression(),
  lookupActiveProductsFilter: productLookupAttrs(productFields).listfilter[0].expressionTokens,
  workflowFinanceRoute: financeRouteExpression(),
  requestNumberGeneration: requestNoExpression()
};
const expressionValidation = Object.fromEntries(
  Object.entries(expressionInventory).map(([name, tokens]) => [name, validateExpressionTokens(tokens, { path: name })])
);
const expressionErrors = Object.entries(expressionValidation)
  .flatMap(([name, result]) => result.issues.filter((entry) => entry.level === "error").map((entry) => ({ name, ...entry })));
if (expressionErrors.length) {
  throw new Error(`Expression validation failed: ${JSON.stringify(expressionErrors, null, 2)}`);
}

fs.writeFileSync(outAppPath, `${JSON.stringify(app, null, 2)}\n`);
fs.writeFileSync(outFormDefPath, `${JSON.stringify(def, null, 2)}\n`);
fs.writeFileSync(outProductListDefPath, `${JSON.stringify({ Item: productsList, MainListType: 1, AppID: appId, ReplaceIds: app.ReplaceIds }, null, 2)}\n`);
fs.writeFileSync(outRequestListDefPath, `${JSON.stringify({ Item: requestsList, MainListType: 1, AppID: appId, ReplaceIds: app.ReplaceIds }, null, 2)}\n`);
fs.writeFileSync(outReportPath, `${JSON.stringify({
  generatedAt,
  appName: app.Title,
  idFamily: `${family}...`,
  flowKey: formKey,
  sourceBaseline: sourcePath,
  expressionContexts: [
    "calculated control: Quantity * Unit Price = Subtotal",
    "dynamic display rule: Total Amount > 10000 shows High Value Reason",
    "custom validation rule: Required Date must be today or later",
    "lookup filter: Active products only",
    "workflow transition condition: Total Amount >= 5000 token shape validates locally; runtime branch deferred after first isolation",
    "request number generation: proven FlowNo application expression button pattern",
    "ContentList persistence: readable generated values"
  ],
  includedControls: [
    "lookup",
    "calculated",
    "datepicker",
    "currency",
    "input_number",
    "textarea",
    "workflowControlPanel",
    "workflowHistory"
  ],
  expressionValidation,
  deferredControls: ["runtime workflow branching condition using numeric form variable", "SetVariableTask raw expression-token evaluation for request-number strings"],
  persistencePolicy: "Lookup display values persist through addition/autofill variables. ContentList stores readable product name, numeric totals, route, and request number; raw lookup row ID is not used for user-facing fields.",
  resources: {
    dataLists: ["Reference Products", "Expression Test Requests"],
    approvalForms: ["Expression Runtime Test v1"],
    dashboards: ["Overview"]
  }
}, null, 2)}\n`);

console.log(JSON.stringify({
  status: "pass",
  appDef: outAppPath,
  formDef: outFormDefPath,
  productListDef: outProductListDefPath,
  requestListDef: outRequestListDefPath,
  report: outReportPath,
  replaceIds: app.ReplaceIds.length
}, null, 2));

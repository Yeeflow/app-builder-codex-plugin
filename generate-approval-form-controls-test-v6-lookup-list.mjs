import fs from "node:fs";
import crypto from "node:crypto";

const sourcePath = "design-system-request-tracker-app-def.v1.json";
const outAppPath = "approval-form-controls-test-v6-app-def.json";
const outFormDefPath = "approval-form-controls-test-v6-approval-form-def.json";
const outRequestListDefPath = "approval-form-controls-test-v6-request-list-def.json";
const outProductListDefPath = "approval-form-controls-test-v6-products-list-def.json";
const outReportPath = "approval-form-controls-test-v6-generation-report.json";

const family = "456";
const generatedAt = "2026-05-14 23:20:00";
const appId = 41;
const tenantId = "1697103066096734208";
const userId = "1697103066163843073";
const rootId = `${family}0010000000000000`;
const dashboardId = `${family}0010000000000001`;
const productListId = `${family}0020000000001000`;
const requestListId = `${family}0030000000001000`;
const processId = `${family}0040000000000001`;
const formKey = "AFC6";
const iconUrl = JSON.stringify({ b: "#E6F0FF", i: "fa-regular fa-magnifying-glass", c: "#0065FF" });

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const app = JSON.parse(JSON.stringify(source).replaceAll("427", family).replaceAll("DSX", formKey).replaceAll("dsv-", "afc6-"));
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
            paragraph(readonly ? "Review saved lookup/list control proof data." : "Maintain records used by the lookup/list controls test.", `${title} helper`)
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
            textControl("Approval Form Controls Test v6", "Dashboard title", "h3-bold"),
            paragraph("A focused proof package for internal lookup and sublist/listref approval form controls.", "Dashboard description")
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

function approvalControl(key, type, label, attrs = {}, readonly = false, pageReview = false, extra = {}) {
  const item = {
    id: `afc6-control-${key}-${pageReview ? "review" : "submit"}`,
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

const lineListRefId = "afc6-listref-line-items";
const lineFields = [
  { idx: "afc6-row-product", id: "LineProduct", name: "Product", type: "text", editable: true },
  { idx: "afc6-row-quantity", id: "LineQuantity", name: "Quantity", type: "number", editable: true },
  { idx: "afc6-row-unit-price", id: "LineUnitPrice", name: "Unit Price", type: "number", editable: true },
  { idx: "afc6-row-note", id: "LineNote", name: "Line Note", type: "text", editable: true }
];

function listFieldControlForApproval(field, readonly = false) {
  const base = {
    id: `afc6-list-${field.id}-control${readonly ? "-review" : "-submit"}`,
    label: field.name,
    binding: field.id,
    displayLabel: [null, true],
    attrs: {
      list_field: true,
      list_field_binding: "LineItems",
      list_control_id: `afc6-control-LineItems-${readonly ? "review" : "submit"}`
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
    id: `afc6-control-LineItems-${readonly ? "review" : "submit"}`,
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
    listfilter: null,
    addition: [
      { FieldName: "Text1", FieldID: field("Text1").FieldID, RelationName: "ProductCode", RelationFieldName: "Product Code", RelationFieldIsMultiple: false, IsShow: true, Order: 1 },
      { FieldName: "Text2", FieldID: field("Text2").FieldID, RelationName: "ProductCategory", RelationFieldName: "Product Category", RelationFieldIsMultiple: false, IsShow: true, Order: 2 },
      { FieldName: "Decimal1", FieldID: field("Decimal1").FieldID, RelationName: "UnitPrice", RelationFieldName: "Unit Price", RelationFieldIsMultiple: false, IsShow: true, Order: 3 }
    ],
    list_tooltip_field: null,
    "sort-first": { SortName: "Created", SortByDesc: false },
    "search-scope": "3",
    "search-fields": ["Title", "Text1", "Text2"],
    link: "default",
    "modal-size": 2,
    displayStyle: "dropdown",
    placeholder: "Select a product"
  };
}

function makeApprovalPage(title, productFields, review = false) {
  const readonly = review;
  const lookupControls = [
    approvalControl("RequestTitle", "input", "Request Title", { placeholder: "Enter a short request title", required: true }, readonly, review),
    approvalControl("Requester", "identity-picker", "Requester", { default: "currentUser" }, true, review, { value: "CurrentUser" }),
    approvalControl("SelectedProduct", "lookup", "Lookup Product", productLookupAttrs(productFields), readonly, review),
    approvalControl("ProductCode", "input", "Product Code", { placeholder: "Autofilled from product lookup" }, true, review),
    approvalControl("ProductCategory", "input", "Product Category", { placeholder: "Autofilled from product lookup" }, true, review),
    approvalControl("UnitPrice", "currency", "Unit Price", { currencyCode: "USD", displayFormat: "code", displayThousandths: "1" }, true, review)
  ];
  const longControls = [
    lineItemsControl(readonly),
    approvalControl("LineItemsSummary", "textarea", "Line Items Summary", { edit: { fhlay: "auto", textarea_minrows: 3 }, placeholder: "Describe the submitted line items for persistence." }, readonly, review),
    approvalControl("Notes", "textarea", "Notes", { edit: { fhlay: "auto", textarea_minrows: 3 }, placeholder: "Optional context for this lookup/list test" }, readonly, review),
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
            paragraph(review ? "Review selected lookup values and line items before approval." : "Select a packaged product lookup value and add simple line items.", `${title} helper`),
            flexGrid(lookupControls, "Lookup product and derived fields grid"),
            section(longControls, "Line item and notes controls")
          ]),
          container("Form bottom", {
            style: { gap: [null, "--sp--s200"], direction: [null, "column"] }
          }, [
            { id: `afc6-control-panel-${review ? "review" : "submit"}`, type: "workflowControlPanel", label: "Action Panel", attrs: { "show-task-panel": true, rejectValidation: true, align: "center" }, nv_label: "Action panel" },
            { id: `afc6-flow-history-${review ? "review" : "submit"}`, type: "workflowHistory", label: "Flow History", attrs: { "show-history": true }, nv_label: "Flow history" }
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
  ["Text2", "Category", "Category", "Text", "input", { required: false }],
  ["Decimal1", "Unit Price", "UnitPrice", "Decimal", "currency", { required: false, currencyCode: "USD", displayFormat: "code" }],
  ["Bit1", "Active", "Active", "Bit", "switch", { required: false }]
].map(([fieldName, displayName, internalName, fieldType, type, rules], index) =>
  makeField(productListId, 2, index, fieldName, displayName, internalName, fieldType, type, rules)
);

const requestFields = [
  ["Title", "Request Title", "RequestTitle", "Text", "input", { required: true, placeholder: "Request title" }],
  ["Text1", "Selected Product", "SelectedProduct", "Text", "input", { required: false }],
  ["Text2", "Product Code", "ProductCode", "Text", "input", { required: false }],
  ["Text3", "Product Category", "ProductCategory", "Text", "input", { required: false }],
  ["Decimal1", "Unit Price", "UnitPrice", "Decimal", "currency", { required: false, currencyCode: "USD" }],
  ["Text4", "Line Items Summary", "LineItemsSummary", "Text", "textarea", { required: false }],
  ["Text5", "Approval Status", "ApprovalStatus", "Text", "input", { required: false }],
  ["Bit1", "Created From Workflow", "CreatedFromWorkflow", "Bit", "switch", { required: false }]
].map(([fieldName, displayName, internalName, fieldType, type, rules], index) =>
  makeField(requestListId, 3, index, fieldName, displayName, internalName, fieldType, type, rules)
);

const productSamples = {
  [localId(2, "0000000011001")]: { ListDataID: localId(2, "0000000011001"), Title: "Standard Laptop", Text1: "LAP-STD", Text2: "Hardware", Decimal1: 1250, Bit1: "1" },
  [localId(2, "0000000011002")]: { ListDataID: localId(2, "0000000011002"), Title: "Docking Station", Text1: "DOCK-USB-C", Text2: "Accessories", Decimal1: 220, Bit1: "1" },
  [localId(2, "0000000011003")]: { ListDataID: localId(2, "0000000011003"), Title: "27-inch Monitor", Text1: "MON-27", Text2: "Display", Decimal1: 360, Bit1: "1" }
};

const requestSamples = {
  [localId(3, "0000000011001")]: {
    ListDataID: localId(3, "0000000011001"),
    Title: "Existing lookup/list sample",
    Text1: "Standard Laptop",
    Text2: "LAP-STD",
    Text3: "Hardware",
    Decimal1: 1250,
    Text4: "Seed row for lookup/list controls.",
    Text5: "Seed",
    Bit1: "1"
  }
};

const productsList = makeList(productListId, 2, "Reference Products", "Internal packaged source list for lookup control runtime testing.", productFields, productSamples);
const requestsList = makeList(requestListId, 3, "Lookup List Test Requests", "Persisted records created by the Approval Form Controls Test v6 workflow.", requestFields, requestSamples);

data.Childs = [productsList, requestsList];
data.Item.ListModel.ListID = rootId;
data.Item.ListModel.Title = "Approval Form Controls Test v6";
data.Item.ListModel.Description = "Small app to prove lookup and sublist approval form controls from the AI Training study.";
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
    { AppID: appId, ListID: requestListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Lookup List Test Requests", Icon: "fa-regular fa-list-check" },
    { AppID: "41", Title: "Submit Lookup/List Test", ListID: formKey, ListSetID: rootId, Type: 105, Icon: "fa-regular fa-magnifying-glass" }
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
form.Name = "Approval Form Controls Test v6";
form.Key = formKey;
form.Description = "Approval form with lookup and list controls learned from AI Training.";
form.ListID = 0;
form.ProcModelID = processId;
form.ImgResource = iconUrl;
form.DefKey = formKey;
form.ListSetID = rootId;
form.AppListSetID = rootId;
form.ProcModelListSetID = rootId;

const def = JSON.parse(form.DefResource);
def.defkey = formKey;
def.name = "Approval Form Controls Test v6";
def.title = "Approval Form Controls Test v6";
def.workflowType = "approval";
def.ProcModelListID = processId;
def.ProcModelAppID = appId;
def.ProcModelListSetID = rootId;
def.AppListSetID = rootId;
def.listSet = rootId;
def.listInfo = { ListID: requestListId, Title: "Lookup List Test Requests" };
def.pageurls[0].id = uuid();
def.pageurls[0].title = "Submit Lookup/List Test";
def.pageurls[0].type = 1;
def.pageurls[0].formdef = makeApprovalPage("Submit Lookup/List Test", productFields, false);
def.pageurls[0].formdef.id = def.pageurls[0].id;
def.pageurls[1].id = uuid();
def.pageurls[1].title = "Review Lookup/List Test";
def.pageurls[1].type = 2;
def.pageurls[1].formdef = makeApprovalPage("Review Lookup/List Test", productFields, true);
def.pageurls[1].formdef.id = def.pageurls[1].id;
def.variables.basic = [
  { idx: "afc6-var-request-title", id: "RequestTitle", name: "Request Title", type: "text", editable: true },
  { idx: "afc6-var-requester", id: "Requester", name: "Requester", type: "user", editable: true },
  { idx: "afc6-var-selected-product", id: "SelectedProduct", name: "Selected Product", type: "lookup", editable: true, value: { AppID: appId, ListID: productListId, ListSetID: rootId } },
  { idx: "afc6-var-product-code", id: "ProductCode", name: "Product Code", type: "text", editable: true },
  { idx: "afc6-var-product-category", id: "ProductCategory", name: "Product Category", type: "text", editable: true },
  { idx: "afc6-var-unit-price", id: "UnitPrice", name: "Unit Price", type: "number", editable: true },
  { idx: "afc6-var-line-items", id: "LineItems", name: "Line Items", type: "list", editable: true, value: lineListRefId },
  { idx: "afc6-var-line-items-summary", id: "LineItemsSummary", name: "Line Items Summary", type: "text", editable: true },
  { idx: "afc6-var-notes", id: "Notes", name: "Notes", type: "text", editable: true },
  { idx: "afc6-var-decision-notes", id: "DecisionNotes", name: "Decision Notes", type: "text", editable: true }
];
def.variables.listref = [
  {
    id: lineListRefId,
    name: "LineItems",
    idx: "afc6-listref-line-items-idx",
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

const startNodeId = "afc6-node-start-0001";
const reviewNodeId = "afc6-node-review-0002";
const persistNodeId = "afc6-node-persist-0003";
const endNodeId = "afc6-node-end-0004";
const rejectNodeId = "afc6-node-reject-0005";
const flowStartReview = "afc6-flow-0001";
const flowApproved = "afc6-flow-0002";
const flowRejected = "afc6-flow-0003";
const flowPersistEnd = "afc6-flow-0004";

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
    name: "Create Lookup/List Test Record",
    type: "add",
    appid: appId,
    listsetid: rootId,
    listid: requestListId,
    listtype: "select",
    listdatas: [
      { Per: "0", Columns: "Title", Data: varButton("RequestTitle", "Request Title") },
      { Per: "0", Columns: "Text1", Data: varButton("SelectedProduct", "Selected Product") },
      { Per: "0", Columns: "Text2", Data: varButton("ProductCode", "Product Code") },
      { Per: "0", Columns: "Text3", Data: varButton("ProductCategory", "Product Category") },
      { Per: "0", Columns: "Decimal1", Data: varButton("UnitPrice", "Unit Price") },
      { Per: "0", Columns: "Text4", Data: varButton("LineItemsSummary", "Line Items Summary") },
      { Per: "0", Columns: "Text5", Data: "Approved" },
      { Per: "0", Columns: "Bit1", Data: "1" }
    ],
    wheres: []
  }, { x: 460, y: 100 }, [flowApproved], [flowPersistEnd]),
  workflowNode(endNodeId, "EndNoneEvent", { name: "End" }, { x: 720, y: 100 }, [flowPersistEnd], []),
  workflowNode(rejectNodeId, "EndRejectEvent", { name: "Rejected" }, { x: 460, y: 270 }, [flowRejected], []),
  workflowFlow(flowStartReview, startNodeId, reviewNodeId, { name: "Start to Reviewer Approval" }),
  workflowFlow(flowApproved, reviewNodeId, persistNodeId, {
    name: "Reviewer Approved",
    documentation: "Approved",
    conditioninfo: [{ key: "afc6-cond-approved", pre: "and", left: taskOutcomeButton(reviewNodeId, "Reviewer Approval"), op: "s.=", right: outcomeValueButton("Approved") }]
  }),
  workflowFlow(flowRejected, reviewNodeId, rejectNodeId, {
    name: "Reviewer Rejected",
    documentation: "Rejected",
    conditioninfo: [{ key: "afc6-cond-rejected", pre: "and", left: taskOutcomeButton(reviewNodeId, "Reviewer Approval"), op: "s.=", right: outcomeValueButton("Rejected") }]
  }),
  workflowFlow(flowPersistEnd, persistNodeId, endNodeId, { name: "Control Test Record Created to End" })
];

form.DefResource = JSON.stringify(def);
data.Forms = [form];

app.Title = "Approval Form Controls Test v6";
app.Description = "Small generated app proving lookup and sublist native approval form controls.";
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
  includedControls: [
    "lookup",
    "list",
    "workflowControlPanel",
    "workflowHistory"
  ],
  deferredControls: ["lookup-list", "data-list", "metadata", "mutiple-metadata", "tag", "signer"],
  persistencePolicy: "Lookup additional values persist through ContentList when selected. Sublist rows are proved through render/add/edit/task display first; durable row persistence is summarized in text until listref persistence is separately proven.",
  resources: {
    dataLists: ["Reference Products", "Lookup List Test Requests"],
    approvalForms: ["Approval Form Controls Test v6"],
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

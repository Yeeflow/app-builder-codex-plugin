import fs from "node:fs";
import crypto from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { validateExpressionTokens } = require("./yeeflow-expression-utils.js");

const sourcePath = "design-system-request-tracker-app-def.v1.json";
const outAppPath = "expression-user-profile-test-v1-app-def.json";
const outFormDefPath = "expression-user-profile-test-v1-approval-form-def.json";
const outRequestListDefPath = "expression-user-profile-test-v1-request-list-def.json";
const outReportPath = "expression-user-profile-test-v1-generation-report.json";

const family = "463";
const generatedAt = "2026-05-15 14:40:00";
const appId = 41;
const tenantId = "1697103066096734208";
const userId = "1697103066163843073";
const rootId = `${family}0010000000000000`;
const dashboardId = `${family}0010000000000001`;
const requestListId = `${family}0030000000001000`;
const processId = `${family}0040000000000001`;
const formKey = "EUP1";
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
            paragraph(readonly ? "Review saved user profile expression proof data." : "Maintain records created by the user profile expression runtime test.", `${title} helper`)
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
            textControl("Expression User Profile Test v1", "Dashboard title", "h3-bold"),
            paragraph("A focused proof package for getUserAttr, getOrgAttr, getLocAttr, dateFormat, dateAdd, and ContentList persistence.", "Dashboard description")
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

function currentUserToken() {
  return { id: "CurrentUser", exprType: "application", valueType: "string", type: "expr", name: "Context:Current User" };
}

function attrParam(key, label = key) {
  return { key, label };
}

function fallbackParam(value = "N/A") {
  return value === "" ? [] : [{ type: "str", value }];
}

function funcToken(func, params) {
  return { type: "func", func, params };
}

function getUserAttrToken(userExpr, key, label = key, fallback = "N/A") {
  return funcToken("getUserAttr", [[userExpr], attrParam(key, label), fallbackParam(fallback)]);
}

function getOrgAttrToken(orgExpr, key, label = key, fallback = "N/A") {
  return funcToken("getOrgAttr", [[orgExpr], attrParam(key, label), fallbackParam(fallback)]);
}

function getLocAttrToken(locationExpr, key, label = key, fallback = "N/A") {
  return funcToken("getLocAttr", [[locationExpr], attrParam(key, label), fallbackParam(fallback)]);
}

function dateFormatToken(dateExpr, format = "MMM DD, YYYY") {
  return funcToken("dateFormat", [[dateExpr], [{ type: "str", value: format }]]);
}

function dateAddToken(dateExpr, unit, amount) {
  return funcToken("dateAdd", [[dateExpr], [{ type: "str", value: unit }], [{ type: "num", value: String(amount) }]]);
}

const currentUser = currentUserToken();
const currentDepartment = getUserAttrToken(currentUser, "DepartmentID", "Department");
const parentDepartment = getOrgAttrToken(currentDepartment, "ParentID", "Parent");
const lineManager = getUserAttrToken(currentUser, "LineManager", "Line Manager");
const currentLocation = getUserAttrToken(currentUser, "LocationID", "Location");
const boardingDateRaw = getUserAttrToken(currentUser, "LatestHireDate", "Boarding Date");
const boardingAnniversaryRaw = dateAddToken(boardingDateRaw, "year", 1);

const profileExpressions = {
  UserName: getUserAttrToken(currentUser, "Name_CN", "Name"),
  LoginAccount: getUserAttrToken(currentUser, "SPAccount", "Login Account"),
  Email: getUserAttrToken(currentUser, "Email", "Email"),
  DepartmentName: getOrgAttrToken(currentDepartment, "Name", "Name"),
  ParentDepartmentName: getOrgAttrToken(parentDepartment, "Name", "Name"),
  LineManagerName: getUserAttrToken(lineManager, "Name_CN", "Name", ""),
  EmployeeNo: getUserAttrToken(currentUser, "EmployeeNo", "Employee No."),
  JobTitle: getUserAttrToken(currentUser, "JobTitle", "Job Title"),
  JobGrade: getUserAttrToken(currentUser, "JobGrade", "Job Grade"),
  OfficeAddress: getUserAttrToken(currentUser, "OfficeAddress", "Office Address"),
  Phone: getUserAttrToken(currentUser, "Phone", "Phone No."),
  Mobile: getUserAttrToken(currentUser, "Mobile", "Mobile No."),
  Telephone: getUserAttrToken(currentUser, "Telephone", "Telephone"),
  LocationName: getLocAttrToken(currentLocation, "Name", "Name", ""),
  BoardingDate: dateFormatToken(boardingDateRaw),
  BoardingAnniversaryDate: dateFormatToken(boardingAnniversaryRaw),
  CreatedTime: dateFormatToken(getUserAttrToken(currentUser, "Created", "Created Time")),
  CreatedByName: getUserAttrToken(getUserAttrToken(currentUser, "CreatedBy", "Created By"), "Name_CN", "Name")
};

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

function expressionDisplayControl(key, label, expression, review = false) {
  return approvalControl(key, "calculated", label, {
    calculated: [expression],
    placeholder: "Calculated from current user profile",
    displayStyle: "text"
  }, true, review);
}

function makeApprovalPage(title, review = false) {
  const readonly = review;
  const mainControls = [
    approvalControl("RequestNo", "input", "Request No", { placeholder: "Generated after submit" }, true, review),
    approvalControl("RequestTitle", "input", "Request Title", { placeholder: "Enter a short request title", required: true }, readonly, review),
    approvalControl("Requester", "identity-picker", "Requester", { default: "currentUser" }, true, review, { value: "CurrentUser" }),
    expressionDisplayControl("UserName", "Current User Name", profileExpressions.UserName, review),
    expressionDisplayControl("LoginAccount", "Login Account", profileExpressions.LoginAccount, review),
    expressionDisplayControl("Email", "Email", profileExpressions.Email, review),
    expressionDisplayControl("DepartmentName", "Department Name", profileExpressions.DepartmentName, review),
    expressionDisplayControl("ParentDepartmentName", "Parent Department Name", profileExpressions.ParentDepartmentName, review),
    expressionDisplayControl("LineManagerName", "Line Manager Name", profileExpressions.LineManagerName, review),
    expressionDisplayControl("EmployeeNo", "Employee No.", profileExpressions.EmployeeNo, review),
    expressionDisplayControl("JobTitle", "Job Title", profileExpressions.JobTitle, review),
    expressionDisplayControl("JobGrade", "Job Grade", profileExpressions.JobGrade, review),
    expressionDisplayControl("LocationName", "Location Name", profileExpressions.LocationName, review),
    expressionDisplayControl("BoardingDate", "Boarding Date", profileExpressions.BoardingDate, review),
    expressionDisplayControl("BoardingAnniversaryDate", "Boarding Anniversary Date", profileExpressions.BoardingAnniversaryDate, review),
    expressionDisplayControl("CreatedTime", "Created Time", profileExpressions.CreatedTime, review),
    expressionDisplayControl("CreatedByName", "Created By Name", profileExpressions.CreatedByName, review)
  ];
  const longControls = [
    expressionDisplayControl("OfficeAddress", "Office Address", profileExpressions.OfficeAddress, review),
    expressionDisplayControl("Phone", "Phone No.", profileExpressions.Phone, review),
    expressionDisplayControl("Mobile", "Mobile No.", profileExpressions.Mobile, review),
    expressionDisplayControl("Telephone", "Telephone", profileExpressions.Telephone, review),
    approvalControl("Notes", "textarea", "Notes", { edit: { fhlay: "auto", textarea_minrows: 3 }, placeholder: "Optional context for this user profile expression test" }, readonly, review),
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
            paragraph(review ? "Review current-user expression values and approve the request." : "Test export-backed user, department, location, dateFormat, and dateAdd expressions.", `${title} helper`),
            flexGrid(mainControls, "User profile expression fields grid"),
            section(longControls, "Contact expression and notes controls")
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

const requestFields = [
  ["Title", "Request No", "RequestNo", "Text", "input", { required: true, placeholder: "Generated request number" }],
  ["Text1", "User Name", "UserName", "Text", "input", { required: false }],
  ["Text2", "Login Account", "LoginAccount", "Text", "input", { required: false }],
  ["Text3", "Email", "Email", "Text", "input", { required: false }],
  ["Text4", "Department Name", "DepartmentName", "Text", "input", { required: false }],
  ["Text5", "Line Manager Name", "LineManagerName", "Text", "input", { required: false }],
  ["Text6", "Boarding Date", "BoardingDate", "Text", "input", { required: false }],
  ["Text7", "Boarding Anniversary Date", "BoardingAnniversaryDate", "Text", "input", { required: false }],
  ["Text8", "Job Title", "JobTitle", "Text", "input", { required: false }],
  ["Text9", "Location Name", "LocationName", "Text", "input", { required: false }],
  ["Text10", "Approval Status", "ApprovalStatus", "Text", "input", { required: false }],
  ["Text11", "Request Title", "RequestTitle", "Text", "input", { required: false }],
  ["Bit1", "Created From Workflow", "CreatedFromWorkflow", "Bit", "switch", { required: false }]
].map(([fieldName, displayName, internalName, fieldType, type, rules], index) =>
  makeField(requestListId, 3, index, fieldName, displayName, internalName, fieldType, type, rules)
);

const requestSamples = {
  [localId(3, "0000000011001")]: {
    ListDataID: localId(3, "0000000011001"),
    Title: "REQ-SEED-001",
    Text1: "Seed User",
    Text2: "seed@example.com",
    Text3: "seed@example.com",
    Text4: "Seed Department",
    Text5: "Seed Manager",
    Text6: "May 15, 2026",
    Text7: "May 15, 2027",
    Text8: "Seed Job Title",
    Text9: "Seed Location",
    Text10: "Seed",
    Text11: "Existing user profile expression sample",
    Bit1: "1"
  }
};

const requestsList = makeList(requestListId, 3, "Expression User Profile Requests", "Persisted records created by the Expression User Profile Test v1 workflow.", requestFields, requestSamples);

data.Childs = [requestsList];
data.Item.ListModel.ListID = rootId;
data.Item.ListModel.Title = "Expression User Profile Test v1";
data.Item.ListModel.Description = "Small app to prove user, department, and location profile expressions in an approval form.";
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
    { AppID: appId, ListID: requestListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Expression User Profile Requests", Icon: "fa-regular fa-list-check" },
    { AppID: "41", Title: "Submit User Profile Test", ListID: formKey, ListSetID: rootId, Type: 105, Icon: "fa-regular fa-user" }
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
form.Name = "Expression User Profile Test v1";
form.Key = formKey;
form.Description = "Approval form with user, department, and location expression runtime controls.";
form.ListID = 0;
form.ProcModelID = processId;
form.ImgResource = iconUrl;
form.DefKey = formKey;
form.ListSetID = rootId;
form.AppListSetID = rootId;
form.ProcModelListSetID = rootId;

const def = JSON.parse(form.DefResource);
def.defkey = formKey;
def.name = "Expression User Profile Test v1";
def.title = "Expression User Profile Test v1";
def.workflowType = "approval";
def.ProcModelListID = processId;
def.ProcModelAppID = appId;
def.ProcModelListSetID = rootId;
def.AppListSetID = rootId;
def.listSet = rootId;
def.listInfo = { ListID: requestListId, Title: "Expression User Profile Requests" };
def.pageurls[0].id = uuid();
def.pageurls[0].title = "Submit User Profile Test";
def.pageurls[0].type = 1;
def.pageurls[0].formdef = makeApprovalPage("Submit User Profile Test", false);
def.pageurls[0].formdef.id = def.pageurls[0].id;
def.pageurls[1].id = uuid();
def.pageurls[1].title = "Review User Profile Test";
def.pageurls[1].type = 2;
def.pageurls[1].formdef = makeApprovalPage("Review User Profile Test", true);
def.pageurls[1].formdef.id = def.pageurls[1].id;
def.variables.basic = [
  { idx: "ert1-var-request-no", id: "RequestNo", name: "Request No", type: "text", editable: true },
  { idx: "ert1-var-request-title", id: "RequestTitle", name: "Request Title", type: "text", editable: true },
  { idx: "ert1-var-requester", id: "Requester", name: "Requester", type: "user", editable: true },
  { idx: "eup1-var-user-name", id: "UserName", name: "User Name", type: "text", editable: true },
  { idx: "eup1-var-login-account", id: "LoginAccount", name: "Login Account", type: "text", editable: true },
  { idx: "eup1-var-email", id: "Email", name: "Email", type: "text", editable: true },
  { idx: "eup1-var-department-name", id: "DepartmentName", name: "Department Name", type: "text", editable: true },
  { idx: "eup1-var-parent-department-name", id: "ParentDepartmentName", name: "Parent Department Name", type: "text", editable: true },
  { idx: "eup1-var-line-manager-name", id: "LineManagerName", name: "Line Manager Name", type: "text", editable: true },
  { idx: "eup1-var-employee-no", id: "EmployeeNo", name: "Employee No.", type: "text", editable: true },
  { idx: "eup1-var-job-title", id: "JobTitle", name: "Job Title", type: "text", editable: true },
  { idx: "eup1-var-job-grade", id: "JobGrade", name: "Job Grade", type: "text", editable: true },
  { idx: "eup1-var-office-address", id: "OfficeAddress", name: "Office Address", type: "text", editable: true },
  { idx: "eup1-var-phone", id: "Phone", name: "Phone No.", type: "text", editable: true },
  { idx: "eup1-var-mobile", id: "Mobile", name: "Mobile No.", type: "text", editable: true },
  { idx: "eup1-var-telephone", id: "Telephone", name: "Telephone", type: "text", editable: true },
  { idx: "eup1-var-location-name", id: "LocationName", name: "Location Name", type: "text", editable: true },
  { idx: "eup1-var-boarding-date", id: "BoardingDate", name: "Boarding Date", type: "text", editable: true },
  { idx: "eup1-var-boarding-anniversary-date", id: "BoardingAnniversaryDate", name: "Boarding Anniversary Date", type: "text", editable: true },
  { idx: "eup1-var-created-time", id: "CreatedTime", name: "Created Time", type: "text", editable: true },
  { idx: "eup1-var-created-by-name", id: "CreatedByName", name: "Created By Name", type: "text", editable: true },
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
      { Per: "0", Columns: "Text1", Data: varButton("UserName", "User Name") },
      { Per: "0", Columns: "Text2", Data: varButton("LoginAccount", "Login Account") },
      { Per: "0", Columns: "Text3", Data: varButton("Email", "Email") },
      { Per: "0", Columns: "Text4", Data: varButton("DepartmentName", "Department Name") },
      { Per: "0", Columns: "Text5", Data: varButton("LineManagerName", "Line Manager Name") },
      { Per: "0", Columns: "Text6", Data: varButton("BoardingDate", "Boarding Date") },
      { Per: "0", Columns: "Text7", Data: varButton("BoardingAnniversaryDate", "Boarding Anniversary Date") },
      { Per: "0", Columns: "Text8", Data: varButton("JobTitle", "Job Title") },
      { Per: "0", Columns: "Text9", Data: varButton("LocationName", "Location Name") },
      { Per: "0", Columns: "Text10", Data: "Approved" },
      { Per: "0", Columns: "Text11", Data: varButton("RequestTitle", "Request Title") },
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

app.Title = "Expression User Profile Test v1";
app.Description = "Small generated app proving user/profile expression runtime contexts.";
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

const expressionInventory = {
  currentUserName: [profileExpressions.UserName],
  currentUserDepartmentName: [profileExpressions.DepartmentName],
  currentUserParentDepartmentName: [profileExpressions.ParentDepartmentName],
  currentUserManagerName: [profileExpressions.LineManagerName],
  currentUserLocationName: [profileExpressions.LocationName],
  boardingDateFormatted: [profileExpressions.BoardingDate],
  boardingAnniversaryDate: [profileExpressions.BoardingAnniversaryDate],
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
fs.writeFileSync(outRequestListDefPath, `${JSON.stringify({ Item: requestsList, MainListType: 1, AppID: appId, ReplaceIds: app.ReplaceIds }, null, 2)}\n`);
fs.writeFileSync(outReportPath, `${JSON.stringify({
  generatedAt,
  appName: app.Title,
  idFamily: `${family}...`,
  flowKey: formKey,
  sourceBaseline: sourcePath,
  expressionContexts: [
    "calculated controls: user, department, location, and date profile expressions",
    "nested user/profile functions: getUserAttr, getOrgAttr, getLocAttr",
    "date calculation: dateAdd(Boarding Date, year, 1)",
    "date formatting: dateFormat(..., MMM DD, YYYY)",
    "request number generation: proven FlowNo application expression button pattern",
    "ContentList persistence: readable calculated profile variables where runtime supports calculated text variables"
  ],
  includedControls: [
    "calculated",
    "identity-picker",
    "textarea",
    "workflowControlPanel",
    "workflowHistory"
  ],
  expressionValidation,
  deferredControls: ["getDeptAttr exact function name; export used getOrgAttr", "profile expression persistence if calculated text variables render but do not write values"],
  persistencePolicy: "Profile values display through calculated controls bound to text variables. ContentList maps those variables to text fields; if runtime does not evaluate calculated text variables before persistence, mark display as proven and persistence as deferred.",
  resources: {
    dataLists: ["Expression User Profile Requests"],
    approvalForms: ["Expression User Profile Test v1"],
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

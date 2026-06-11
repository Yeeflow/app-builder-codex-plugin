import fs from "node:fs";
import crypto from "node:crypto";

const sourcePath = "design-system-request-tracker-app-def.v1.json";
const specPath = "employee-family-implant-v3-spec.json";
const outAppPath = "employee-family-implant-app-def.v3.json";
const outFormDefPath = "employee-family-implant-approval-form-def.v3.json";
const outReportPath = "employee-family-implant-runtime-test-report.v3.json";
const outBaselineDocPath = "docs/generated-employee-family-implant-baseline-v3.md";

const family = "653";
const generatedAt = "2026-05-17 22:00:00";
const appId = 41;
const tenantId = "1697103066096734208";
const userId = "1697103066163843073";
const rootId = `${family}0010000000000000`;
const dashboardId = `${family}0010000000000001`;
const hrDashboardId = `${family}0010000000000002`;
const formKey = "EJX";
const processId = `${family}0020000000000001`;
const productSelectionListRefId = `${processId}-listref-product-selection-items`;
const productListId = `${family}1010000000001000`;
const quotaListId = `${family}1020000000001000`;
const attachmentRulesListId = `${family}1030000000001000`;
const applicationsListId = `${family}1040000000001000`;
const usageListId = `${family}1050000000001000`;
const routingRulesListId = `${family}1060000000001000`;
const quotaAdjustmentsListId = `${family}1070000000001000`;
const employeeReferenceListId = `${family}1080000000001000`;
const financeHistoryListId = `${family}1090000000001000`;
const iconUrl = JSON.stringify({ b: "#E6F0FF", i: "fa-regular fa-heart", c: "#0065FF" });

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
const app = JSON.parse(JSON.stringify(source).replaceAll("427", family).replaceAll("DSX", formKey).replaceAll("dsv-", "ejx-"));
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
    heads: { ty: [null, size], color: "var(--c--text)" },
    common: { positioning: { widthtype: [null, "2"] } }
  }, [], { nv_label: nvLabel });
}

function text(value, nvLabel) {
  return control("text-editor", "Text Editor", {
    value,
    common: { padding: tokenPadding("--sp--s0"), positioning: { widthtype: [null, "2"] } }
  }, [], { nv_label: nvLabel });
}

function flexGrid(nvLabel, children, columns = 2) {
  const list = Array.from({ length: columns }, () => ({ value: 1, unit: "fr" }));
  return control("flex_grid", "Grid", {
    ver: 1,
    columns: {
      "1": { list, last: { value: 1, unit: "fr" } },
      "2": { list, last: { value: 1, unit: "fr" } },
      "3": { list: [{ value: 1, unit: "fr" }], last: { value: 1, unit: "fr" } }
    },
    rows: { "1": { list: [{ unit: "auto" }], last: { unit: "auto" } } },
    cgap: { "1": 16 },
    cgapU: { "1": "px" },
    rgap: { "1": 16 },
    rgapU: { "1": "px" }
  }, children, { nv_label: nvLabel, displayLabel: [null, false] });
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

function dashboardDataList(listId, title, fields, filters = [], nvLabel = `${title} dashboard list`) {
  return control("data-list", "Data table", {
    listarr: fields.map((field) => ({
      DisplayName: field.label || "",
      FieldName: field.label || field.field,
      Field: field.field
    })),
    data: {
      list: { AppID: appId, ListID: listId, Type: 1, Title: title, ListSetID: rootId },
      ps: 5,
      filter: filters,
      fulltext: [],
      sort: [{ SortName: "Created", SortByDesc: true }]
    },
    header: {
      normal: { bgcolor: "var(--c--primary)", color: "var(--c--primary-light)" },
      ty: [null, "s-semi-bold"]
    },
    body: {
      bdt: "1",
      bdw: [null, { top: null, right: null, bottom: 1, left: null }],
      bdc: "var(--c--neutral-light-hover)"
    },
    fallback: { et: "No records match this dashboard view." },
    common: {
      padding: tokenPadding("--sp--s100"),
      border: {
        normal: {
          type: "1",
          width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
          color: "var(--c--neutral-light-active)",
          radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }]
        }
      }
    }
  }, [], { nv_label: nvLabel });
}

function dashboardActionButton(label, listId, title, nvLabel) {
  return control("action_button", label, {
    "icon-type": "3",
    icon: "fa-solid fa-arrow-up-right-from-square",
    align: [null, "left", null, "justify"],
    "action-type": "5",
    data: {
      list: { AppID: appId, ListID: listId, Type: listId === formKey ? 105 : 1, Title: title, ListSetID: rootId }
    },
    common: {
      padding: tokenPadding("--sp--s100"),
      border: {
        normal: {
          type: "1",
          width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
          color: "var(--c--primary)",
          radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }]
        }
      }
    }
  }, [], { nv_label: nvLabel });
}

function dashboardCondition(left, op, right) {
  return { key: uuid(), pre: "and", left, op, right, showCus: true };
}

function summaryControl(title, description, token = "--c--primary") {
  return control("summary", "Summary", {
    prefix: { value: "", variable: null },
    suffix: { value: "", variable: null },
    layout: {
      number: { sp: 0, ty: [null, "h4-bold"] },
      pic: { pos: [null, "1"] },
      title: { value: title, variable: null },
      desc: { value: description || "", variable: null }
    },
    common: {
      padding: tokenPadding("--sp--s200"),
      border: {
        normal: {
          radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }],
          type: "1",
          width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
          color: "var(--c--neutral-light-active)"
        },
        hover: { boxShadow: { color: "rgba(0, 0, 0, 0.05)", x: 0, y: 1, blur: 3, spread: 0, position: "outline" } }
      },
      background: { normal: { type: "classic", classic: { color: "var(--c--background)" } } }
    },
    titleStyle: { color: `var(${token})` }
  }, [], { nv_label: `Summary ${title}` });
}

function summaryExt(controlId, listId, values, conditions = []) {
  return {
    category: "___Pivot___",
    key: "summary",
    i: controlId,
    attr: {
      AppID: appId,
      ListID: listId,
      ListSetID: rootId,
      settings: {
        values,
        preConditions: null,
        Conditions: conditions
      }
    }
  };
}

function countValue(label = "Records") {
  return {
    type: "input",
    label,
    attr: { displayLabel: true, readonly: true },
    fieldName: "ListDataID",
    fieldType: "Bigint",
    func: "COUNT",
    id: "ListDataID"
  };
}

function sumValue(fieldName, label) {
  return {
    type: "currency",
    label,
    attr: {},
    fieldName,
    fieldType: "Decimal",
    func: "SUM",
    id: fieldName
  };
}

function makeSummaryCard(title, listId, values, conditions, exts, reportIds, description = "", token = "--c--primary") {
  const summary = summaryControl(title, description, token);
  exts.push(summaryExt(summary.id, listId, values, conditions));
  reportIds.push(summary.id);
  return summary;
}

function chartControl(type, title, nvLabel) {
  const label = type === "pie-chart" ? "Pie chart" : type === "line-chart" ? "Line chart" : "Column chart";
  return control(type, label, {
    title: {
      display: true,
      title: { value: title, variable: null },
      position: "1",
      "align-t": "left",
      pd: [null, { top: null, right: null, bottom: "--sp--s200", left: null }],
      color: "var(--c--primary)",
      ty: [null, "base-medium"]
    },
    common: {
      padding: tokenPadding("--sp--s200"),
      border: {
        normal: {
          type: "1",
          width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
          color: "var(--c--neutral-light-active)",
          radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }]
        }
      }
    }
  }, [], { nv_label: nvLabel });
}

function chartExt(controlId, key, chartType, listId, rowField, rowLabel, rowType, valueField, valueLabel, valueType = "input", rowFunc = "") {
  return {
    category: "___Pivot___",
    key,
    i: controlId,
    attr: {
      chartType,
      settings: {
        rows: [{ type: rowType, label: rowLabel, attr: rowType === "datepicker" ? { showtime: false } : {}, fieldName: rowField, fieldType: rowType === "datepicker" ? "Datetime" : "Text", func: rowFunc, id: rowField }],
        values: [{ type: valueType, label: valueLabel, attr: {}, fieldName: valueField, fieldType: valueField.startsWith("Decimal") ? "Decimal" : "Bigint", func: valueField === "ListDataID" ? "COUNT" : "SUM", id: `${valueField}_COUNT_SUM` }]
      },
      AppID: appId,
      ListID: listId,
      ListSetID: rootId
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
    Rules: rules && Object.keys(rules).length ? JSON.stringify(rules) : null,
    TenantID: tenantId,
    AppID: appId,
    IsSort: isTitle,
    IsIndex: isTitle,
    IsFilter: ["Title", "Text1", "Text2", "Text3", "Text4", "Text5", "Datetime1"].includes(fieldName),
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
      Show: index < 8,
      Type: field.Type,
      DisplayName: field.DisplayName
    })),
    sort: [{ SortName: "Created", SortByDesc: true }],
    query: [],
    rowColor: [],
    filter: []
  });
}

function fieldControl(field, readonly = false) {
  const controlType = field.Type === "radio" ? "radio" : field.Type === "currency" ? "currency" : field.Type === "input_number" ? "input_number" : field.Type === "datetime" ? "datepicker" : field.Type === "textarea" ? "textarea" : "input";
  const item = {
    id: uuid(),
    type: controlType,
    label: field.DisplayName,
    binding: field.FieldName,
    displayLabel: [null, true],
    attrs: field.Rules ? JSON.parse(field.Rules) : {},
    nv_label: `${field.DisplayName} field`
  };
  if (readonly) item.readonly = true;
  return item;
}

function makeCustomForm(title, layoutId, listId, fields, readonly = false) {
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
            text(readonly ? "<p>Review the saved record in read-only mode.</p>" : "<p>Maintain this app record using standard Yeeflow fields.</p>", `${title} helper`)
          ]),
          container(readonly ? "Readonly section" : "Field group", {
            style: { gap: [null, "--sp--s150"], direction: [null, "column"] },
            common: {
              padding: tokenPadding("--sp--s300"),
              background: { normal: { type: "classic", classic: { color: "var(--c--background)" } } },
              border: { normal: { type: "1", width: [null, { top: 1, right: 1, bottom: 1, left: 1 }], color: "var(--c--neutral-light-active)", radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }] } }
            }
          }, fields.map((field) => fieldControl(field, readonly)))
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

function makeList(title, listId, area, specs, samples = {}) {
  const base = clone(data.Childs[0]);
  const fields = specs.map((specItem, index) => makeField(listId, area, index, ...specItem));
  base.ListModel.ListID = listId;
  base.ListModel.Title = title;
  base.ListModel.Description = `${title} for Employee & Family Implant Application Management.`;
  base.ListModel.IconUrl = iconUrl;
  base.ListModel.CustomType = `ListSite_${rootId}`;
  base.ListModel.ListSetID = rootId;
  base.ListModel.ListType = 1;
  base.ListModel.Created = generatedAt;
  base.ListModel.Modified = generatedAt;
  base.ListModel.CreatedBy = userId;
  base.ListModel.ModifiedBy = userId;
  base.Defs = fields;
  base.Layouts = [
    {
      LayoutID: localId(area, "0000000001801"),
      Type: 0,
      Title: `All ${title}`,
      ListID: listId,
      LayoutView: makeListViewLayout(fields),
      Ext2: null,
      IsDefault: true,
      IsItemPerm: false,
      Created: generatedAt,
      Modified: generatedAt,
      CreatedBy: userId,
      ModifiedBy: userId,
      LayoutInResources: []
    },
    makeCustomForm("Edit Item", localId(area, "0000000001901"), listId, fields, false),
    makeCustomForm("View Item", localId(area, "0000000001902"), listId, fields, true)
  ];
  base.ListModel.LayoutView = JSON.stringify({
    add: base.Layouts[1].LayoutID,
    edit: base.Layouts[1].LayoutID,
    view: base.Layouts[2].LayoutID,
    opentype: { add: "modal" },
    modalsize: {},
    sort: [{ SortName: "Created", SortByDesc: true }]
  });
  base.ListDatas = samples;
  return { list: base, fields };
}

function makeReportLayout(title, layoutId, listId, fields, query = [], showCount = 8) {
  const gridFields = fields.filter((field) => field.Type !== "textarea");
  return {
    LayoutID: layoutId,
    Type: 0,
    Title: title,
    ListID: listId,
    LayoutView: JSON.stringify({
      layout: gridFields.map((field, index) => ({
        FieldID: field.FieldID,
        FieldName: field.FieldName,
        Mobile: index === 0 ? 2 : 0,
        Order: index,
        Show: index < showCount,
        Type: field.Type,
        DisplayName: field.DisplayName
      })),
      sort: [{ SortName: "Created", SortByDesc: true }],
      query,
      rowColor: [],
      filter: []
    }),
    Ext2: null,
    IsDefault: false,
    IsItemPerm: false,
    Created: generatedAt,
    Modified: generatedAt,
    CreatedBy: userId,
    ModifiedBy: userId,
    LayoutInResources: []
  };
}

function addReportLayout(entry, title, suffix, query = [], showCount = 8) {
  const area = Number(entry.fields[0].FieldID.slice(3, 6));
  entry.list.Layouts.push(makeReportLayout(title, localId(area, suffix), entry.list.ListModel.ListID, entry.fields, query, showCount));
}

const choice = (choices, extra = {}) => ({ displayStyle: "dropdown", choices, ...extra });
const textRule = (placeholder) => ({ placeholder, "input-maxlength": 200 });
const moneyRule = () => ({ placeholder: "0.00", precision: 2 });

const product = makeList("Product Master", productListId, 101, [
  ["Title", "Product Name", "ProductName", "Text", "input", textRule("Product name")],
  ["Text1", "Product Code", "ProductCode", "Text", "input", textRule("Product code")],
  ["Text2", "Product Type", "ProductType", "Text", "radio", choice(["Standard Product", "Custom Package Product"])],
  ["Decimal1", "Product Price", "ProductPrice", "Decimal", "currency", { currencyCode: "USD", displayFormat: "code", displayThousandths: "1" }],
  ["Text3", "Status", "ProductStatus", "Text", "radio", choice(["Active", "Inactive"])],
  ["Text4", "Attachment Set", "RequiresAttachmentSet", "Text", "input", textRule("Attachment rule label")]
], {
  [localId(101, "0000000011001")]: { ListDataID: localId(101, "0000000011001"), Title: "Standard Implant Package", Text1: "IMP-STD-001", Text2: "Standard Product", Decimal1: 2500, Text3: "Active", Text4: "Standard Proof" },
  [localId(101, "0000000011002")]: { ListDataID: localId(101, "0000000011002"), Title: "Custom Implant Package", Text1: "IMP-CUS-001", Text2: "Custom Package Product", Decimal1: 6000, Text3: "Active", Text4: "Custom Package Proof" }
});

const quota = makeList("Annual Quota Configuration", quotaListId, 102, [
  ["Title", "Quota Name", "QuotaName", "Text", "input", textRule("Quota name")],
  ["Text1", "Quota Year", "QuotaYear", "Text", "input", textRule("2026")],
  ["Decimal1", "Annual Quota Amount", "AnnualQuotaAmount", "Decimal", "currency", { currencyCode: "USD", displayFormat: "code", displayThousandths: "1" }],
  ["Datetime1", "Effective Date", "EffectiveDate", "Datetime", "datepicker", { showtime: false, date_type: "0", dateformat: "0" }],
  ["Datetime2", "Expiry Date", "ExpiryDate", "Datetime", "datepicker", { showtime: false, date_type: "0", dateformat: "0" }],
  ["Text2", "Status", "QuotaStatus", "Text", "radio", choice(["Active", "Inactive"])]
], {
  [localId(102, "0000000011001")]: { ListDataID: localId(102, "0000000011001"), Title: "Family Quota 2026", Text1: "2026", Decimal1: 15000, Datetime1: "2026-01-01 00:00:00", Datetime2: "2026-12-31 00:00:00", Text2: "Active" }
});

const attachmentRules = makeList("Attachment Requirement Rules", attachmentRulesListId, 103, [
  ["Title", "Rule Name", "RuleName", "Text", "input", textRule("Rule name")],
  ["Text1", "Application Type", "ApplicationType", "Text", "radio", choice(["Self", "Family", "Any"])],
  ["Text2", "Product Type", "ProductType", "Text", "radio", choice(["Standard Product", "Custom Package Product", "Any"])],
  ["Text3", "Required Attachment Name", "RequiredAttachmentName", "Text", "input", textRule("Attachment name")],
  ["Text4", "Required Flag", "RequiredFlag", "Text", "radio", choice(["Yes", "No"])],
  ["Text5", "Status", "RuleStatus", "Text", "radio", choice(["Active", "Inactive"])],
  ["Text6", "Instructions", "Instructions", "Text", "textarea", { edit: { textarea_minrows: 3 }, placeholder: "Instructions" }]
], {
  [localId(103, "0000000011001")]: { ListDataID: localId(103, "0000000011001"), Title: "Self Standard Supporting Document", Text1: "Self", Text2: "Standard Product", Text3: "Implant request/supporting document", Text4: "Yes", Text5: "Active", Text6: "Required for Self + Standard Product." },
  [localId(103, "0000000011002")]: { ListDataID: localId(103, "0000000011002"), Title: "Self Custom Quotation", Text1: "Self", Text2: "Custom Package Product", Text3: "Custom package quotation", Text4: "Yes", Text5: "Active", Text6: "Required for Self + Custom Package Product." },
  [localId(103, "0000000011003")]: { ListDataID: localId(103, "0000000011003"), Title: "Self Custom Supporting Document", Text1: "Self", Text2: "Custom Package Product", Text3: "Implant request/supporting document", Text4: "Yes", Text5: "Active", Text6: "Required for Self + Custom Package Product." },
  [localId(103, "0000000011004")]: { ListDataID: localId(103, "0000000011004"), Title: "Family Standard Relationship Proof", Text1: "Family", Text2: "Standard Product", Text3: "Family relationship proof", Text4: "Yes", Text5: "Active", Text6: "Required for Family + Standard Product." },
  [localId(103, "0000000011005")]: { ListDataID: localId(103, "0000000011005"), Title: "Family Standard Supporting Document", Text1: "Family", Text2: "Standard Product", Text3: "Implant request/supporting document", Text4: "Yes", Text5: "Active", Text6: "Required for Family + Standard Product." },
  [localId(103, "0000000011006")]: { ListDataID: localId(103, "0000000011006"), Title: "Family Custom Relationship Proof", Text1: "Family", Text2: "Custom Package Product", Text3: "Family relationship proof", Text4: "Yes", Text5: "Active", Text6: "Required for Family + Custom Package Product." },
  [localId(103, "0000000011007")]: { ListDataID: localId(103, "0000000011007"), Title: "Family Custom Quotation", Text1: "Family", Text2: "Custom Package Product", Text3: "Custom package quotation", Text4: "Yes", Text5: "Active", Text6: "Required for Family + Custom Package Product." },
  [localId(103, "0000000011008")]: { ListDataID: localId(103, "0000000011008"), Title: "Family Custom Supporting Document", Text1: "Family", Text2: "Custom Package Product", Text3: "Implant request/supporting document", Text4: "Yes", Text5: "Active", Text6: "Required for Family + Custom Package Product." }
});

const applications = makeList("Implant Applications", applicationsListId, 104, [
  ["Title", "Application No.", "ApplicationNo", "Text", "input", textRule("Generated application number")],
  ["Text1", "Applicant Employee ID", "ApplicantEmployeeID", "Text", "input", textRule("Applicant employee ID")],
  ["Text2", "Applicant Name", "ApplicantEmployeeName", "Text", "input", textRule("Applicant name")],
  ["Text3", "Department", "ApplicantDepartment", "Text", "input", textRule("Department")],
  ["Datetime1", "Boarding Date", "ApplicantBoardingDate", "Datetime", "datepicker", { showtime: false, date_type: "0", dateformat: "0" }],
  ["Text4", "Application Type", "ApplicationType", "Text", "radio", choice(["Self", "Family"])],
  ["Text5", "Product Summary", "ProductSummary", "Text", "textarea", { edit: { textarea_minrows: 3 }, placeholder: "Product line summary" }],
  ["Text6", "Has Custom Package Product", "HasCustomPackageProduct", "Text", "radio", choice(["No", "Yes"])],
  ["Decimal1", "Total Application Amount", "TotalApplicationAmount", "Decimal", "currency", { currencyCode: "USD", displayFormat: "code", displayThousandths: "1" }],
  ["Text7", "Quota Cycle", "QuotaYear", "Text", "input", textRule("Employee anniversary quota cycle")],
  ["Decimal2", "Annual Quota Amount", "AnnualQuotaAmount", "Decimal", "currency", { currencyCode: "USD", displayFormat: "code", displayThousandths: "1" }],
  ["Decimal3", "Used Quota Before", "UsedQuotaBefore", "Decimal", "currency", { currencyCode: "USD", displayFormat: "code", displayThousandths: "1" }],
  ["Decimal4", "Remaining Quota After", "RemainingQuotaAfter", "Decimal", "currency", { currencyCode: "USD", displayFormat: "code", displayThousandths: "1" }],
  ["Decimal5", "Applicant Boarding Years", "ApplicantBoardingYears", "Decimal", "input_number", { precision: 0 }],
  ["Text8", "Eligibility Status", "EligibilityStatus", "Text", "radio", choice(["Eligible", "Not Eligible", "Not Required", "Needs HR Verification"])],
  ["Text9", "Application Status", "ApplicationStatus", "Text", "radio", choice(["Submitted", "Approved", "Rejected"])],
  ["Text10", "Quota Usage Status", "QuotaUsageStatus", "Text", "radio", choice(["Not Applicable", "Occupied", "Released", "Confirmed"])],
  ["Text11", "Applicant Email", "ApplicantEmail", "Text", "input", textRule("Email")],
  ["Text12", "Line Manager", "ApplicantLineManager", "Text", "input", textRule("Line manager")],
  ["Text13", "Family Member Name", "FamilyMemberName", "Text", "input", textRule("Family member name")],
  ["Text14", "Family Relationship", "FamilyRelationship", "Text", "radio", choice(["Spouse", "Child", "Parent", "Other"])],
  ["Text15", "Remarks", "Remarks", "Text", "textarea", { edit: { textarea_minrows: 3 }, placeholder: "Remarks" }],
  ["Text16", "Required Attachments", "RequiredAttachmentSummary", "Text", "textarea", { edit: { textarea_minrows: 3 }, placeholder: "Required attachments" }],
  ["Text17", "Attachment Verification Status", "AttachmentVerificationStatus", "Text", "radio", choice(["Pending", "Complete", "Missing", "Waived", "Needs HR Verification"])],
  ["Text18", "Missing Attachment Flag", "MissingAttachmentFlag", "Text", "radio", choice(["No", "Yes"])],
  ["Text19", "HR Attachment Review Notes", "HRAttachmentReviewNotes", "Text", "textarea", { edit: { textarea_minrows: 3 }, placeholder: "HR attachment verification notes" }],
  ["Text20", "Attachment Requirement Scenario", "AttachmentRequirementScenario", "Text", "radio", choice(["Self + Standard", "Self + Custom", "Family + Standard", "Family + Custom"])],
  ["Text21", "Return Status", "ReturnStatus", "Text", "radio", choice(["Not Returned", "Returned to Applicant", "Resubmitted"])],
  ["Text22", "Return Reason", "ReturnReason", "Text", "textarea", { edit: { textarea_minrows: 3 }, placeholder: "Correction reason" }],
  ["Decimal6", "Return Count", "ReturnCount", "Decimal", "input_number", { precision: 0 }],
  ["Text23", "HR Verification Flag", "HRVerificationFlag", "Text", "radio", choice(["No", "Yes"])],
  ["Text24", "HR Verification Notes", "HRVerificationNotes", "Text", "textarea", { edit: { textarea_minrows: 3 }, placeholder: "HR verification notes" }],
  ["Text25", "Routing Rule Name", "RoutingRuleName", "Text", "input", textRule("Matched or fallback routing rule")],
  ["Text26", "Routing Policy Summary", "RoutingPolicySummary", "Text", "textarea", { edit: { textarea_minrows: 3 }, placeholder: "Routing policy guidance" }],
  ["Text27", "Requires Manager Review", "RequiresManagerReview", "Text", "radio", choice(["No", "Yes", "Fallback to HR"])],
  ["Text28", "Manager Review Status", "ManagerReviewStatus", "Text", "radio", choice(["Not Required", "Pending", "Approved", "Rejected", "Fallback to HR"])],
  ["Text29", "Manager Reviewer Fallback", "ManagerReviewerFallback", "Text", "input", textRule("HR configured reviewer or fallback")],
  ["Text30", "Finance Review Status", "FinanceReviewStatus", "Text", "radio", choice(["Not Required", "Pending", "Approved", "Rejected", "Returned"])],
  ["Text31", "Submitted By", "SubmittedBy", "Text", "input", textRule("Submitting user")],
  ["Text32", "Current Status", "CurrentStatus", "Text", "radio", choice(["Draft", "Submitted", "HR Review", "Finance Review", "Returned", "Resubmitted", "Approved", "Rejected", "Expired"])],
  ["Text33", "Last Action By", "LastActionBy", "Text", "input", textRule("Last action user")],
  ["Decimal7", "Resubmission Count", "ResubmissionCount", "Decimal", "input_number", { precision: 0 }],
  ["Text34", "Quota Usage Record ID", "QuotaUsageRecordID", "Text", "input", textRule("Family Quota Usage correlation")],
  ["Decimal8", "Approved Quota Adjustment Amount", "ApprovedQuotaAdjustmentAmount", "Decimal", "currency", { currencyCode: "USD", displayFormat: "code", displayThousandths: "1" }],
  ["Datetime2", "Submitted Time", "SubmittedTime", "Datetime", "datepicker", { showtime: true, date_type: "0", dateformat: "0" }],
  ["Datetime3", "Last Action Time", "LastActionTime", "Datetime", "datepicker", { showtime: true, date_type: "0", dateformat: "0" }],
  ["Datetime4", "Expiry Date", "ExpiryDate", "Datetime", "datepicker", { showtime: false, date_type: "0", dateformat: "0" }],
  ["Text35", "Expiry Status", "ExpiryStatus", "Text", "radio", choice(["Not Applicable", "Pending", "Due Soon", "Expired", "Manually Closed"])],
  ["Text36", "Expired Flag", "ExpiredFlag", "Text", "radio", choice(["No", "Yes"])],
  ["Datetime5", "Last Reminder Date", "LastReminderDate", "Datetime", "datepicker", { showtime: false, date_type: "0", dateformat: "0" }],
  ["Text37", "Expiry Notes", "ExpiryNotes", "Text", "textarea", { edit: { textarea_minrows: 3 }, placeholder: "Expiry handling notes" }],
  ["Text38", "Profile Missing Flag", "ProfileMissingFlag", "Text", "radio", choice(["No", "Yes"])],
  ["Text39", "Profile Verification Status", "ProfileVerificationStatus", "Text", "radio", choice(["Not Required", "Needs HR Verification", "Verified", "Fallback Reference Used"])],
  ["Text40", "Employee Reference Used", "EmployeeReferenceUsed", "Text", "radio", choice(["No", "Yes"])],
  ["Text41", "Over Quota Attempt Flag", "OverQuotaAttemptFlag", "Text", "radio", choice(["No", "Yes"])]
]);

const usage = makeList("Family Quota Usage", usageListId, 105, [
  ["Title", "Usage Record", "UsageRecord", "Text", "input", textRule("Usage record")],
  ["Text1", "Application No.", "ApplicationNo", "Text", "input", textRule("Application number")],
  ["Text2", "Applicant Employee ID", "ApplicantEmployeeID", "Text", "input", textRule("Applicant employee ID")],
  ["Text3", "Applicant Name", "ApplicantEmployeeName", "Text", "input", textRule("Applicant name")],
  ["Text4", "Quota Cycle Key", "QuotaCycleKey", "Text", "input", textRule("Employee anniversary quota cycle key used for matching")],
  ["Decimal2", "Quota Cycle No.", "QuotaCycleNumber", "Decimal", "input_number", { precision: 0 }],
  ["Text5", "Product Summary", "ProductSummary", "Text", "textarea", { edit: { textarea_minrows: 3 }, placeholder: "Product line summary" }],
  ["Text6", "Has Custom Package Product", "HasCustomPackageProduct", "Text", "radio", choice(["No", "Yes"])],
  ["Decimal1", "Total Application Amount", "TotalApplicationAmount", "Decimal", "currency", { currencyCode: "USD", displayFormat: "code", displayThousandths: "1" }],
  ["Decimal3", "Active Usage Amount", "ActiveUsageAmount", "Decimal", "currency", { currencyCode: "USD", displayFormat: "code", displayThousandths: "1" }],
  ["Text7", "Usage Status", "UsageStatus", "Text", "radio", choice(["In Progress", "Occupied", "Approved", "Confirmed", "Released", "Rejected", "Not Applicable"])],
  ["Text8", "Notes", "Notes", "Text", "textarea", { edit: { textarea_minrows: 3 }, placeholder: "Notes" }],
  ["Text9", "Request Instance Key", "RequestInstanceKey", "Text", "input", textRule("Application or workflow instance correlation key")],
  ["Text10", "Source Application Status", "SourceApplicationStatus", "Text", "radio", choice(["Submitted", "Approved", "Rejected"])],
  ["Text11", "Usage Exception Flag", "UsageExceptionFlag", "Text", "radio", choice(["No", "Yes"])],
  ["Text12", "Usage Exception Reason", "UsageExceptionReason", "Text", "textarea", { edit: { textarea_minrows: 3 }, placeholder: "Quota or usage exception reason" }],
  ["Text13", "Returned Occupation Status", "ReturnedOccupationStatus", "Text", "radio", choice(["Not Returned", "Occupied While Returned"])],
  ["Datetime1", "Submitted Time", "SubmittedTime", "Datetime", "datepicker", { showtime: true, date_type: "0", dateformat: "0" }],
  ["Datetime2", "Approved Time", "ApprovedTime", "Datetime", "datepicker", { showtime: true, date_type: "0", dateformat: "0" }],
  ["Datetime3", "Released Time", "ReleasedTime", "Datetime", "datepicker", { showtime: true, date_type: "0", dateformat: "0" }],
  ["Decimal4", "Approved Adjustment Applied", "ApprovedAdjustmentApplied", "Decimal", "currency", { currencyCode: "USD", displayFormat: "code", displayThousandths: "1" }]
]);

const routingRules = makeList("Workflow Routing Rules", routingRulesListId, 106, [
  ["Title", "Rule Name", "RuleName", "Text", "input", textRule("Routing rule name")],
  ["Text1", "Application Type", "ApplicationType", "Text", "radio", choice(["Self", "Family", "Any"])],
  ["Text2", "Product Type", "ProductType", "Text", "radio", choice(["Standard Product", "Custom Package Product", "Any"])],
  ["Text3", "Custom Package Required", "CustomPackageRequired", "Text", "radio", choice(["No", "Yes", "Any"])],
  ["Decimal1", "Amount Threshold", "AmountThreshold", "Decimal", "currency", { currencyCode: "USD", displayFormat: "code", displayThousandths: "1" }],
  ["Text4", "Requires HR Review", "RequiresHRReview", "Text", "radio", choice(["Yes", "No"])],
  ["Text5", "Requires Finance Review", "RequiresFinanceReview", "Text", "radio", choice(["Yes", "No"])],
  ["Text6", "Requires Manager Review", "RequiresManagerReview", "Text", "radio", choice(["No", "Yes", "Fallback to HR"])],
  ["Text7", "Active", "Active", "Text", "radio", choice(["Yes", "No"])],
  ["Decimal2", "Priority / Sort Order", "PrioritySortOrder", "Decimal", "input_number", { precision: 0 }],
  ["Text8", "Notes", "Notes", "Text", "textarea", { edit: { textarea_minrows: 3 }, placeholder: "Routing guidance and fallback notes" }]
], {
  [localId(106, "0000000011001")]: { ListDataID: localId(106, "0000000011001"), Title: "Standard Requests", Text1: "Any", Text2: "Standard Product", Text3: "No", Decimal1: 0, Text4: "Yes", Text5: "No", Text6: "No", Text7: "Yes", Decimal2: 10, Text8: "Stable route: HR Review only." },
  [localId(106, "0000000011002")]: { ListDataID: localId(106, "0000000011002"), Title: "Custom Package Requests", Text1: "Any", Text2: "Custom Package Product", Text3: "Yes", Decimal1: 0, Text4: "Yes", Text5: "Yes", Text6: "Fallback to HR", Text7: "Yes", Decimal2: 20, Text8: "Stable route: HR Review then Finance/Benefits Review. Manager Review uses fallback until runtime-proven." }
});

const quotaAdjustments = makeList("Family Quota Adjustments", quotaAdjustmentsListId, 107, [
  ["Title", "Adjustment Record", "AdjustmentRecord", "Text", "input", textRule("Adjustment record")],
  ["Text1", "Applicant", "ApplicantName", "Text", "input", textRule("Applicant name")],
  ["Text2", "Applicant Employee ID", "ApplicantEmployeeID", "Text", "input", textRule("Applicant employee ID")],
  ["Decimal1", "Quota Cycle No.", "QuotaCycleNo", "Decimal", "input_number", { precision: 0 }],
  ["Text3", "Adjustment Type", "AdjustmentType", "Text", "radio", choice(["Increase", "Decrease", "Release", "Correction"])],
  ["Decimal2", "Adjustment Amount", "AdjustmentAmount", "Decimal", "currency", { currencyCode: "USD", displayFormat: "code", displayThousandths: "1" }],
  ["Decimal3", "Effective Adjustment Amount", "EffectiveAdjustmentAmount", "Decimal", "currency", { currencyCode: "USD", displayFormat: "code", displayThousandths: "1" }],
  ["Text4", "Adjustment Status", "AdjustmentStatus", "Text", "radio", choice(["Draft", "Approved", "Rejected", "Cancelled"])],
  ["Text5", "Reason", "Reason", "Text", "textarea", { edit: { textarea_minrows: 3 }, placeholder: "Business reason" }],
  ["Text6", "Approved By / Created By", "ApprovedByCreatedBy", "Text", "input", textRule("Approver or creator")],
  ["Datetime1", "Adjustment Date", "AdjustmentDate", "Datetime", "datepicker", { showtime: false, date_type: "0", dateformat: "0" }],
  ["Text7", "Source Application No.", "SourceApplicationNo", "Text", "input", textRule("Optional application no.")],
  ["Text8", "Audit Notes", "AuditNotes", "Text", "textarea", { edit: { textarea_minrows: 3 }, placeholder: "Audit notes" }]
]);

const employeeReference = makeList("Employee Reference", employeeReferenceListId, 108, [
  ["Title", "Employee Name", "EmployeeName", "Text", "input", textRule("Employee name")],
  ["Text1", "Employee ID", "EmployeeID", "Text", "input", textRule("Employee ID")],
  ["Text2", "Department", "Department", "Text", "input", textRule("Department")],
  ["Datetime1", "Boarding Date", "BoardingDate", "Datetime", "datepicker", { showtime: false, date_type: "0", dateformat: "0" }],
  ["Text3", "Email", "Email", "Text", "input", textRule("Email")],
  ["Text4", "Line Manager", "LineManager", "Text", "input", textRule("Line manager")],
  ["Text5", "External Employee ID", "ExternalEmployeeID", "Text", "input", textRule("External profile ID")],
  ["Text6", "Profile Status", "ProfileStatus", "Text", "radio", choice(["Active", "Inactive", "Needs Verification"])],
  ["Text7", "Verification Notes", "VerificationNotes", "Text", "textarea", { edit: { textarea_minrows: 3 }, placeholder: "HR verification notes" }]
]);

const financeHistory = makeList("Finance Review History", financeHistoryListId, 109, [
  ["Title", "Finance Review Record", "FinanceReviewRecord", "Text", "input", textRule("Finance review record")],
  ["Text1", "Application No.", "ApplicationNo", "Text", "input", textRule("Application number")],
  ["Text2", "Applicant Employee ID", "ApplicantEmployeeID", "Text", "input", textRule("Applicant employee ID")],
  ["Text3", "Applicant Name", "ApplicantName", "Text", "input", textRule("Applicant name")],
  ["Text4", "Finance Review Status", "FinanceReviewStatus", "Text", "radio", choice(["Pending", "Approved", "Rejected", "Returned"])],
  ["Decimal1", "Application Amount", "ApplicationAmount", "Decimal", "currency", { currencyCode: "USD", displayFormat: "code", displayThousandths: "1" }],
  ["Text5", "Reviewer", "Reviewer", "Text", "input", textRule("Finance reviewer")],
  ["Datetime1", "Review Time", "ReviewTime", "Datetime", "datepicker", { showtime: true, date_type: "0", dateformat: "0" }],
  ["Text6", "Comments", "Comments", "Text", "textarea", { edit: { textarea_minrows: 3 }, placeholder: "Finance comments" }]
]);

addReportLayout(applications, "Applications by Status", "0000000001802", [{ key: "app-status-view", pre: "and", left: "Text9", op: "notnull", right: "", showCus: true }]);
addReportLayout(applications, "Applications by Applicant", "0000000001803", [{ key: "app-applicant-view", pre: "and", left: "Text1", op: "notnull", right: "", showCus: true }]);
addReportLayout(applications, "Applications by Department", "0000000001804", [{ key: "app-dept-view", pre: "and", left: "Text3", op: "notnull", right: "", showCus: true }]);
addReportLayout(applications, "Custom Package Requests", "0000000001805", [{ key: "app-custom-view", pre: "and", left: "Text6", op: "0", right: "Yes", showCus: true }]);
addReportLayout(applications, "Returned and Resubmitted Requests", "0000000001806", [{ key: "app-return-view", pre: "and", left: "Text21", op: "notnull", right: "", showCus: true }]);
addReportLayout(applications, "Attachment Verification Exceptions", "0000000001807", [{ key: "app-attachment-view", pre: "and", left: "Text18", op: "0", right: "Yes", showCus: true }]);
addReportLayout(applications, "Expiry Exceptions", "0000000001808", [{ key: "app-expiry-view", pre: "and", left: "Text35", op: "notnull", right: "", showCus: true }]);
addReportLayout(usage, "Released and Rejected Usage", "0000000001802", [{ key: "usage-released-view", pre: "and", left: "Text7", op: "notnull", right: "", showCus: true }]);
addReportLayout(quotaAdjustments, "Approved Quota Adjustments", "0000000001802", [{ key: "adjust-approved-view", pre: "and", left: "Text4", op: "0", right: "Approved", showCus: true }]);
addReportLayout(financeHistory, "Finance Review History by Status", "0000000001802", [{ key: "finance-status-view", pre: "and", left: "Text4", op: "notnull", right: "", showCus: true }]);

data.Childs = [product.list, quota.list, attachmentRules.list, applications.list, usage.list, routingRules.list, quotaAdjustments.list, employeeReference.list, financeHistory.list];

const dashboardReportIds = [];

function dashboardPage() {
  const exts = [];
  const reportIds = [];
  const allAppsFields = [
    { field: "Title", label: "Application No." },
    { field: "Text2", label: "Applicant" },
    { field: "Text32", label: "Current Status" },
    { field: "Decimal1", label: "Amount" },
    { field: "Datetime2", label: "Submitted Time" }
  ];
  const cards = [
    makeSummaryCard("My Submitted Requests", applicationsListId, [countValue("Applications")], [], exts, reportIds, "Bound to Implant Applications; current-user filtering is deferred until dashboard identity filters are proven.", "--c--primary"),
    makeSummaryCard("Pending Review", applicationsListId, [countValue("Applications")], [dashboardCondition("Text32", "0", "HR Review")], exts, reportIds, "Applications currently in HR Review.", "--c--warning"),
    makeSummaryCard("Approved Requests", applicationsListId, [countValue("Applications")], [dashboardCondition("Text9", "0", "Approved")], exts, reportIds, "Approved application records.", "--c--success"),
    makeSummaryCard("Rejected Requests", applicationsListId, [countValue("Applications")], [dashboardCondition("Text9", "0", "Rejected")], exts, reportIds, "Rejected application records.", "--c--danger")
  ];
  dashboardReportIds.push(...reportIds);
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
            heading("Employee & Family Implant", "Dashboard title", "h2-bold"),
            text("<p>Submit implant applications, review request status, and open HR/admin areas for product, quota, routing, attachment, employee reference, and adjustment maintenance.</p>", "Dashboard description")
          ]),
          container("Quick status summaries", { style: { gap: [null, "--sp--s200"], direction: [null, "row"] } }, cards),
          container("Applicant actions", { style: { gap: [null, "--sp--s200"], direction: [null, "row"] } }, [
            container("Submit Implant Application", {
              common: { padding: tokenPadding("--sp--s200"), background: { normal: { type: "classic", classic: { color: "var(--c--background)" } } } },
              style: { gap: [null, "--sp--s100"], direction: [null, "column"] }
            }, [
              heading("Submit Implant Application", "Submit application guidance heading", "h5-medium"),
              text("<p>Use the Submit Implant Application navigation entry to start a request. A direct dashboard form-launch control is deferred until its page action binding is runtime-proven.</p>", "Submit application guidance")
            ]),
            dashboardActionButton("Open Implant Applications", applicationsListId, "Implant Applications", "Open applications dashboard action")
          ]),
          container("My recent applications", {
            style: { gap: [null, "--sp--s100"], direction: [null, "column"] },
            common: { padding: tokenPadding("--sp--s200"), background: { normal: { type: "classic", classic: { color: "var(--c--background)" } } } }
          }, [
            heading("My recent applications", "My recent applications heading", "h5-medium"),
            dashboardDataList(applicationsListId, "Implant Applications", allAppsFields, [], "My recent applications data-bound list")
          ]),
          container("Returned requests needing action", {
            style: { gap: [null, "--sp--s100"], direction: [null, "column"] },
            common: { padding: tokenPadding("--sp--s200"), background: { normal: { type: "classic", classic: { color: "var(--c--background)" } } } }
          }, [
            heading("Returned requests needing my action", "Returned requests heading", "h5-medium"),
            dashboardDataList(applicationsListId, "Implant Applications", allAppsFields, [dashboardCondition("Text21", "0", "Returned")], "Returned requests data-bound list")
          ]),
          container("Guidance section", {
            style: { gap: [null, "--sp--s100"], direction: [null, "column"] },
            common: {
              padding: tokenPadding("--sp--s200"),
              background: { normal: { type: "classic", classic: { color: "var(--c--background)" } } },
              border: { normal: { type: "1", width: [null, { top: 1, right: 1, bottom: 1, left: 1 }], color: "var(--c--neutral-light-active)", radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }] } }
            }
          }, [
            heading("Before you apply", "Guidance heading", "h5-medium"),
            text("<p>Self applications do not require family quota validation. Family applications require annual quota and eligibility checks. Attachments may be required depending on application and product type. Returned requests use a 30-day default expiry policy tracked for HR follow-up.</p><p>Dashboard current-user filtering is intentionally documented as a runtime proof item; the visible summaries and lists are data-bound to packaged lists instead of static placeholder values.</p>", "Guidance body")
          ])
        ])
      ])
    ],
    attrs: {
      hideHeaderAll: true,
      container: { padding: tokenPadding("--sp--s0") },
      background: { type: "classic", classic: { color: "var(--c--neutral-light)" } }
    },
    title: "Home",
    ver: 2,
    filterVars: [],
    tempVars: [],
    exts,
    actions: []
  };
}

function hrOperationsDashboardPage() {
  const exts = [];
  const reportIds = [];
  const appFields = [
    { field: "Title", label: "Application No." },
    { field: "Text2", label: "Applicant" },
    { field: "Text4", label: "Type" },
    { field: "Text32", label: "Current Status" },
    { field: "Decimal1", label: "Amount" }
  ];
  const usageFields = [
    { field: "Title", label: "Usage Record" },
    { field: "Text2", label: "Employee ID" },
    { field: "Text7", label: "Usage Status" },
    { field: "Decimal1", label: "Amount" },
    { field: "Datetime1", label: "Submitted Time" }
  ];
  const kpiRows = [
    [
      makeSummaryCard("Total Applications", applicationsListId, [countValue("Applications")], [], exts, reportIds, "All application records.", "--c--primary"),
      makeSummaryCard("Pending HR Review", applicationsListId, [countValue("Applications")], [dashboardCondition("Text32", "0", "HR Review")], exts, reportIds, "Current status is HR Review.", "--c--warning"),
      makeSummaryCard("Pending Finance/Benefits", applicationsListId, [countValue("Applications")], [dashboardCondition("Text32", "0", "Finance Review")], exts, reportIds, "Current status is Finance Review.", "--c--warning"),
      makeSummaryCard("Approved Applications", applicationsListId, [countValue("Applications")], [dashboardCondition("Text9", "0", "Approved")], exts, reportIds, "Approved application records.", "--c--success")
    ],
    [
      makeSummaryCard("Rejected Applications", applicationsListId, [countValue("Applications")], [dashboardCondition("Text9", "0", "Rejected")], exts, reportIds, "Rejected application records.", "--c--danger"),
      makeSummaryCard("Total Family Quota Used", usageListId, [sumValue("Decimal1", "Quota Amount")], [dashboardCondition("Text7", "0", "Approved")], exts, reportIds, "Approved usage amount.", "--c--primary"),
      makeSummaryCard("Quota Exceptions", usageListId, [countValue("Usage Records")], [dashboardCondition("Text11", "0", "Yes")], exts, reportIds, "Usage records flagged for quota exception.", "--c--danger"),
      makeSummaryCard("Missing Attachment / HR Verification", applicationsListId, [countValue("Applications")], [dashboardCondition("Text18", "0", "Yes")], exts, reportIds, "Applications with missing attachment flag.", "--c--warning")
    ],
    [
      makeSummaryCard("Custom Package Pending", applicationsListId, [countValue("Applications")], [dashboardCondition("Text6", "0", "Yes"), dashboardCondition("Text30", "0", "Pending")], exts, reportIds, "Custom package requests pending finance.", "--c--secondary"),
      makeSummaryCard("Returned / Resubmitted", applicationsListId, [countValue("Applications")], [], exts, reportIds, "Returned/resubmitted monitoring is provided by the filtered queue below.", "--c--warning"),
      makeSummaryCard("Expiry Exceptions", applicationsListId, [countValue("Applications")], [dashboardCondition("Text36", "0", "Yes")], exts, reportIds, "Expired or expiring returned requests.", "--c--danger"),
      makeSummaryCard("Quota Adjustments", quotaAdjustmentsListId, [countValue("Adjustments")], [dashboardCondition("Text4", "0", "Approved")], exts, reportIds, "Approved manual quota adjustments.", "--c--primary")
    ]
  ];
  const applicationsByStatusChart = chartControl("pie-chart", "Applications by Status", "Applications by status pie chart");
  const selfVsFamilyChart = chartControl("pie-chart", "Self vs Family Applications", "Self vs family applications pie chart");
  const productTypeChart = chartControl("bar-chart", "Applications by Product Type", "Applications by product type column chart");
  const customVsStandardChart = chartControl("bar-chart", "Custom vs Standard Requests", "Custom vs standard requests column chart");
  const monthlyTrendChart = chartControl("line-chart", "Monthly Application Trend", "Monthly application trend line chart");
  [
    [applicationsByStatusChart, "pie-chart", "0", "Text32", "Current Status", "radio", "ListDataID", "Id", "input", ""],
    [selfVsFamilyChart, "pie-chart", "0", "Text4", "Application Type", "radio", "ListDataID", "Id", "input", ""],
    [productTypeChart, "bar-chart", "2", "Text6", "Has Custom Package Product", "radio", "ListDataID", "Id", "input", ""],
    [customVsStandardChart, "bar-chart", "2", "Text6", "Has Custom Package Product", "radio", "ListDataID", "Id", "input", ""],
    [monthlyTrendChart, "line-chart", "1", "Datetime2", "Submitted Time", "datepicker", "ListDataID", "Id", "input", "MONTH"]
  ].forEach(([chart, key, chartType, rowField, rowLabel, rowType, valueField, valueLabel, valueType, rowFunc]) => {
    exts.push(chartExt(chart.id, key, chartType, applicationsListId, rowField, rowLabel, rowType, valueField, valueLabel, valueType, rowFunc));
    reportIds.push(chart.id);
  });
  dashboardReportIds.push(...reportIds);
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
            heading("HR Operations Dashboard", "HR dashboard title", "h2-bold"),
            text("<p>Final v3 operational view for HR review workload, finance queues, quota occupation, attachment exceptions, returned/resubmitted monitoring, expiry follow-up, configuration readiness, and export-ready reporting.</p>", "HR dashboard description")
          ]),
          container("HR summary row one", { style: { gap: [null, "--sp--s200"], direction: [null, "row"] } }, kpiRows[0]),
          container("HR summary row two", { style: { gap: [null, "--sp--s200"], direction: [null, "row"] } }, kpiRows[1]),
          container("HR summary row three", { style: { gap: [null, "--sp--s200"], direction: [null, "row"] } }, kpiRows[2]),
          container("Charts and report controls", {
            style: { gap: [null, "--sp--s100"], direction: [null, "column"] },
            common: {
              padding: tokenPadding("--sp--s200"),
              background: { normal: { type: "classic", classic: { color: "var(--c--background)" } } },
              border: { normal: { type: "1", width: [null, { top: 1, right: 1, bottom: 1, left: 1 }], color: "var(--c--neutral-light-active)", radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }] } }
            }
          }, [
            heading("Advanced reporting", "Advanced reporting heading", "h5-medium"),
            text("<p>Charts use the packaged Implant Applications list. Runtime validation must seed or confirm representative source rows before judging chart behavior; an empty chart is a no-data condition, not a structural failure.</p>", "Chart data note"),
            container("Chart row one", { style: { gap: [null, "--sp--s200"], direction: [null, "row"] } }, [
              applicationsByStatusChart,
              selfVsFamilyChart
            ]),
            container("Chart row two", { style: { gap: [null, "--sp--s200"], direction: [null, "row"] } }, [
              productTypeChart,
              customVsStandardChart,
              monthlyTrendChart
            ]),
            dashboardDataList(applicationsListId, "Implant Applications", appFields, [], "All applications dashboard table")
          ]),
          container("Operational queues", {
            style: { gap: [null, "--sp--s100"], direction: [null, "column"] },
            common: {
              padding: tokenPadding("--sp--s200"),
              background: { normal: { type: "classic", classic: { color: "var(--c--background)" } } },
              border: { normal: { type: "1", width: [null, { top: 1, right: 1, bottom: 1, left: 1 }], color: "var(--c--neutral-light-active)", radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }] } }
            }
          }, [
            heading("Operational queues", "Operational queues heading", "h5-medium"),
            dashboardDataList(applicationsListId, "Implant Applications", appFields, [dashboardCondition("Text32", "0", "HR Review")], "Pending HR Review queue data-bound list"),
            dashboardDataList(applicationsListId, "Implant Applications", appFields, [dashboardCondition("Text32", "0", "Finance Review")], "Pending Finance Benefits queue data-bound list"),
            dashboardDataList(applicationsListId, "Implant Applications", appFields, [dashboardCondition("Text18", "0", "Yes")], "Missing attachment queue data-bound list"),
            dashboardDataList(applicationsListId, "Implant Applications", appFields, [dashboardCondition("Text21", "notnull", "")], "Returned resubmitted queue data-bound list"),
            dashboardDataList(applicationsListId, "Implant Applications", appFields, [dashboardCondition("Text36", "0", "Yes")], "Expiry follow-up queue data-bound list"),
            dashboardDataList(usageListId, "Family Quota Usage", usageFields, [dashboardCondition("Text11", "0", "Yes")], "Quota exception usage data-bound list"),
            dashboardDataList(usageListId, "Family Quota Usage", usageFields, [dashboardCondition("Text7", "notnull", "")], "Released rejected usage data-bound list")
          ])
        ])
      ])
    ],
    attrs: {
      hideHeaderAll: true,
      container: { padding: tokenPadding("--sp--s0") },
      background: { type: "classic", classic: { color: "var(--c--neutral-light)" } }
    },
    title: "HR Operations Dashboard",
    ver: 2,
    filterVars: [],
    tempVars: [],
    exts,
    actions: []
  };
}

data.Item.ListModel.ListID = rootId;
data.Item.ListModel.Title = "Employee & Family Implant Application Management";
data.Item.ListModel.Description = "Employee Family Implant v3 final full-function clone with HR operations dashboards, reporting views, configuration, attachment verification, quota adjustment audit, expiry monitoring, and v1/v2 runtime baseline preservation.";
data.Item.ListModel.IconUrl = iconUrl;
data.Item.ListModel.Created = generatedAt;
data.Item.ListModel.Modified = generatedAt;
data.Item.ListModel.CreatedBy = userId;
data.Item.ListModel.ModifiedBy = userId;
data.Item.Layouts = [clone(data.Item.Layouts[0])];
data.Item.Layouts[0].LayoutID = dashboardId;
data.Item.Layouts[0].ListID = rootId;
data.Item.Layouts[0].Title = "Home";
data.Item.Layouts[0].LayoutView = null;
data.Item.Layouts[0].Ext2 = "{\"src\":true}";
dashboardReportIds.length = 0;
data.Item.Layouts[0].LayoutInResources = [{ ID: dashboardId, RefId: dashboardId, Resource: JSON.stringify(dashboardPage()) }];
data.Item.Layouts.push({
  ...clone(data.Item.Layouts[0]),
  LayoutID: hrDashboardId,
  Title: "HR Operations Dashboard",
  LayoutInResources: [{ ID: hrDashboardId, RefId: hrDashboardId, Resource: JSON.stringify(hrOperationsDashboardPage()) }]
});
data.Item.ListModel.LayoutView = JSON.stringify({
  add: "default",
  edit: "default",
  view: "default",
  sort: [
    { AppID: appId, ListID: dashboardId, ListSetID: rootId, Type: 103, Title: "Home", Icon: "fa-regular fa-house", DisplayName: "Home" },
    { AppID: appId, ListID: hrDashboardId, ListSetID: rootId, Type: 103, Title: "HR Operations", Icon: "fa-regular fa-chart-line", DisplayName: "HR Operations" },
    { AppID: "41", Title: "Submit Implant Application", ListID: formKey, ListSetID: rootId, Type: 105, Icon: "fa-regular fa-paper-plane" },
    { AppID: appId, ListID: applicationsListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Implant Applications", Icon: "fa-regular fa-list-check" },
    { AppID: appId, ListID: usageListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Family Quota Usage", Icon: "fa-regular fa-chart-bar" },
    { AppID: appId, ListID: routingRulesListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Workflow Routing Rules", Icon: "fa-regular fa-route" },
    { AppID: appId, ListID: quotaAdjustmentsListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Quota Adjustment Records", Icon: "fa-regular fa-scale-balanced" },
    { AppID: appId, ListID: employeeReferenceListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Employee Reference", Icon: "fa-regular fa-address-card" },
    { AppID: appId, ListID: financeHistoryListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Finance Review History", Icon: "fa-regular fa-file-invoice-dollar" },
    { AppID: appId, ListID: productListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Product Master", Icon: "fa-regular fa-box" },
    { AppID: appId, ListID: quotaListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Annual Quota Configuration", Icon: "fa-regular fa-calendar" },
    { AppID: appId, ListID: attachmentRulesListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Attachment Requirement Rules", Icon: "fa-regular fa-paperclip" },
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
form.Name = "Implant Application Request";
form.Key = formKey;
form.Description = "Employee and family implant application approval form.";
form.ListID = 0;
form.ProcModelID = processId;
form.ImgResource = iconUrl;
form.DefKey = formKey;
form.ListSetID = rootId;
form.AppListSetID = rootId;
form.ProcModelListSetID = rootId;

let def = JSON.parse(form.DefResource);
def.defkey = formKey;
def.name = "Implant Application Request";
def.title = "Implant Application Request";
def.workflowType = "approval";
def.ProcModelListID = processId;
def.ProcModelAppID = appId;
def.ProcModelListSetID = rootId;
def.AppListSetID = rootId;
def.listSet = rootId;
def.listInfo = { ListID: applicationsListId, Title: "Implant Applications" };

const variables = [
  ["__attachments", "Attachments", "file"],
  ["ApplicationNo", "Application No.", "text"],
  ["RequesterApplicant", "Requester / Applicant", "user"],
  ["ApplicantEmployeeID", "Applicant Employee ID", "text"],
  ["ApplicantEmployeeName", "Applicant Name", "text"],
  ["ApplicantDepartment", "Applicant Department", "text"],
  ["ApplicantBoardingDate", "Applicant Boarding Date", "date"],
  ["ApplicantUserStatus", "Applicant User Status", "text"],
  ["ApplicantEmail", "Applicant Email", "text"],
  ["ApplicantLineManager", "Applicant Line Manager", "text"],
  ["ApplicantProfileSnapshotStatus", "Applicant Profile Snapshot Status", "text"],
  ["ApplicationType", "Application Type", "text"],
  ["FamilyMemberName", "Family Member Name", "text"],
  ["FamilyRelationship", "Family Relationship", "text"],
  ["ProductSelectionItems", "Product Selection Items", "list"],
  ["ProductSummary", "Product Summary", "text"],
  ["HasCustomPackageProduct", "Has Custom Package Product", "text"],
  ["TotalApplicationAmount", "Total Application Amount", "number"],
  ["AttachmentScenarioProductType", "Attachment Scenario Product Type", "text"],
  ["QuotaYear", "Quota Year", "text"],
  ["ApplicantBoardingYears", "Applicant Boarding Years", "number"],
  ["QuotaCycleNo", "Quota Cycle No.", "number"],
  ["QuotaCycleKey", "Quota Cycle Key", "text"],
  ["AnnualQuotaAmount", "Annual Quota Amount", "number"],
  ["InProgressUsedQuota", "In Progress Used Quota", "number"],
  ["OccupiedUsedQuota", "Occupied Used Quota", "number"],
  ["ApprovedUsedQuota", "Approved Used Quota", "number"],
  ["ConfirmedUsedQuota", "Confirmed Used Quota", "number"],
  ["UsedQuotaBefore", "Used Quota Before", "number"],
  ["RemainingQuotaAfter", "Remaining Quota After", "number"],
  ["EligibilityStatus", "Eligibility Status", "text"],
  ["QuotaExceeded", "Quota Exceeded", "text"],
  ["QuotaUsageStatus", "Quota Usage Status", "text"],
  ["RequiredAttachmentSummary", "Required Attachment Summary", "text"],
  ["AttachmentStatus", "Attachment Status", "text"],
  ["AttachmentVerificationStatus", "Attachment Verification Status", "text"],
  ["MissingAttachmentFlag", "Missing Attachment Flag", "text"],
  ["HRAttachmentReviewNotes", "HR Attachment Review Notes", "text"],
  ["AttachmentRequirementScenario", "Attachment Requirement Scenario", "text"],
  ["ReturnStatus", "Return Status", "text"],
  ["ReturnReason", "Return Reason", "text"],
  ["ReturnCount", "Return Count", "number"],
  ["HRVerificationFlag", "HR Verification Flag", "text"],
  ["HRVerificationNotes", "HR Verification Notes", "text"],
  ["ApplicationStatus", "Application Status", "text"],
  ["Remarks", "Remarks", "text"],
  ["HRComments", "HR Comments", "text"],
  ["FinanceComments", "Finance Comments", "text"],
  ["RoutingRuleName", "Routing Rule Name", "text"],
  ["RoutingPolicySummary", "Routing Policy Summary", "text"],
  ["RequiresManagerReview", "Requires Manager Review", "text"],
  ["ManagerReviewStatus", "Manager Review Status", "text"],
  ["ManagerReviewerFallback", "Manager Reviewer Fallback", "text"],
  ["FinanceReviewStatus", "Finance Review Status", "text"],
  ["SubmittedBy", "Submitted By", "text"],
  ["SubmittedTime", "Submitted Time", "date"],
  ["CurrentStatus", "Current Status", "text"],
  ["LastActionBy", "Last Action By", "text"],
  ["LastActionTime", "Last Action Time", "date"],
  ["ResubmissionCount", "Resubmission Count", "number"],
  ["QuotaUsageRecordID", "Quota Usage Record ID", "text"],
  ["ApprovedQuotaAdjustmentAmount", "Approved Quota Adjustment Amount", "number"],
  ["ExpiryDate", "Expiry Date", "date"],
  ["ExpiryStatus", "Expiry Status", "text"],
  ["ExpiredFlag", "Expired Flag", "text"],
  ["LastReminderDate", "Last Reminder Date", "date"],
  ["ExpiryNotes", "Expiry Notes", "text"],
  ["ProfileMissingFlag", "Profile Missing Flag", "text"],
  ["ProfileVerificationStatus", "Profile Verification Status", "text"],
  ["EmployeeReferenceUsed", "Employee Reference Used", "text"],
  ["OverQuotaAttemptFlag", "Over Quota Attempt Flag", "text"]
];

def.variables.basic = variables.map(([id, name, type], index) => ({
  idx: `${processId}-var-${String(index + 1).padStart(3, "0")}`,
  id,
  name,
  type,
  editable: true,
  ...(id === "ProductSelectionItems" ? { value: productSelectionListRefId } : {})
}));
const productLineFields = [
  { idx: `${processId}-product-row-lookup`, id: "ProductLookup", name: "Product", type: "lookup", editable: true },
  { idx: `${processId}-product-row-name`, id: "ProductName", name: "Product Name", type: "text", editable: true },
  { idx: `${processId}-product-row-type`, id: "ProductType", name: "Product Type", type: "text", editable: true },
  { idx: `${processId}-product-row-unit-price`, id: "UnitPrice", name: "Unit Price", type: "number", editable: true },
  { idx: `${processId}-product-row-quantity`, id: "Quantity", name: "Quantity", type: "number", editable: true },
  { idx: `${processId}-product-row-subtotal`, id: "ProductRowSubtotal", name: "Row Subtotal", type: "number", editable: true }
];

function totalApplicationAmountExpression() {
  return [
    {
      type: "func",
      func: "arraySum",
      params: [
        [workflowVarToken("ProductSelectionItems", "Product Selection Items", "text")],
        [{ type: "str", value: "ProductRowSubtotal" }],
        [],
        []
      ]
    }
  ];
}
def.variables.listref = [
  {
    id: productSelectionListRefId,
    name: "ProductSelectionItems",
    idx: `${processId}-listref-product-selection-items-idx`,
    fields: productLineFields
  }
];
def.variables.tempVars = [];

function approvalControl(idValue, binding, type, label, attrs = {}, readonly = false, pageKey = "submit") {
  const safeAttrs = { ...attrs };
  if (binding === "RequesterApplicant" && pageKey !== "submit") delete safeAttrs.default;
  const item = { id: `${processId}-control-${idValue}-${pageKey}`, binding, type, label, attrs: safeAttrs, displayLabel: true, nv_label: `${label} control` };
  if (readonly) item.readonly = true;
  if (binding === "RequesterApplicant" && pageKey === "submit") item.value = "CurrentUser";
  if (binding === "Quantity" && pageKey === "submit") item.value = "1";
  return item;
}

function productRowControl(field, pageKey, readonly = false) {
  const base = {
    id: `${processId}-control-ProductSelectionItems-${field.id}-${pageKey}`,
    binding: field.id,
    type: "input",
    label: field.name,
    displayLabel: [null, true],
    attrs: {
      list_field: true,
      list_field_binding: "ProductSelectionItems",
      list_control_id: `${processId}-control-ProductSelectionItems-${pageKey}`
    },
    nv_label: `${field.name} product row control`
  };
  if (field.id === "ProductLookup") {
    base.type = "lookup";
    Object.assign(base.attrs, {
    appid: appId,
    listsetid: rootId,
    listid: productListId,
    listfield: "Title",
    listfilter: null,
    addition: [
      { FieldName: "Title", FieldID: product.fields[0].FieldID, RelationName: "ProductName", RelationFieldName: "Product Name", RelationFieldIsMultiple: false, IsShow: true, Order: 1 },
      { FieldName: "Text2", FieldID: product.fields[2].FieldID, RelationName: "ProductType", RelationFieldName: "Product Type", RelationFieldIsMultiple: false, IsShow: true, Order: 2 },
      { FieldName: "Decimal1", FieldID: product.fields[3].FieldID, RelationName: "UnitPrice", RelationFieldName: "Product Price", RelationFieldIsMultiple: false, IsShow: true, Order: 3 }
    ],
    sortFirst: { SortName: "Title", SortByDesc: false },
    "sort-first": { SortName: "Title", SortByDesc: false },
    "search-scope": "3",
    "search-fields": ["Title", "Text1", "Text2"],
    link: "default",
    "modal-size": 2,
    displayStyle: "dropdown",
    placeholder: "Select Product Master record"
    });
  } else if (field.id === "ProductRowSubtotal") {
    base.type = "calculated";
    base.attrs.calculated = [
      { exprType: "variable_ctx", valueType: "number", id: "UnitPrice", ctx: "ProductSelectionItems", type: "expr", name: "Current object:Unit Price" },
      { type: "op", op: "*" },
      { exprType: "variable_ctx", valueType: "number", id: "Quantity", ctx: "ProductSelectionItems", type: "expr", name: "Current object:Quantity" }
    ];
    base.readonly = true;
    base.value = "";
  } else if (field.type === "number") {
    base.type = "input_number";
    base.attrs.precision = field.id === "Quantity" ? 0 : 2;
    if (field.id === "Quantity") {
      base.attrs.number_min = 1;
      if (pageKey === "submit") base.value = "1";
    }
  } else {
    base.type = field.id === "ProductType" ? "radio" : "input";
    if (field.id === "ProductType") {
      base.attrs.displayStyle = "dropdown";
      base.attrs.choices = ["Standard Product", "Custom Package Product"];
    }
    base.attrs.placeholder = field.id === "ProductName" ? "Autofilled" : "Autofilled from Product Master";
  }
  if (readonly || ["ProductName", "ProductType", "UnitPrice", "ProductRowSubtotal"].includes(field.id)) base.readonly = true;
  return base;
}

function productSelectionListControl(pageKey, readonly = false) {
  const attrs = {
    "list-fields": productLineFields.map((field, index) => ({
      ...field,
      control: productRowControl(field, pageKey, readonly),
      attrs: {
        table: {
          cw: [null, field.id === "ProductLookup" ? 240 : field.id === "ProductName" ? 220 : field.id === "ProductType" ? 200 : 150]
        }
      },
      Order: index
    })),
    "list-variables": productLineFields.map((field) => ({ ...field })),
    "list-fields-summary": readonly ? [] : [
      { id: uuid(), field: "ProductRowSubtotal", type: "total", display: true, binding: { prefix: "__variables_", value: "TotalApplicationAmount" } }
    ],
    operation: readonly ? false : true,
    list_add_btn_text: { value: "Add product", variable: null },
    list_row_allow_import: false
  };
  if (!readonly && pageKey === "submit") attrs.control_event_rule = checkQuotaActionId;
  return {
    id: `${processId}-control-ProductSelectionItems-${pageKey}`,
    type: "list",
    label: "Product Selection",
    binding: "ProductSelectionItems",
    readonly,
    displayLabel: [null, true],
    nv_label: "Product selection sublist",
    attrs
  };
}

function fileUploadControl(idValue, label, pageKey, readonly = false) {
  const item = approvalControl(idValue, "__attachments", "file-upload", label, {
    ver: 1,
    file_multiple: true,
    file_maxcount: 10,
    upload_btn: "Upload files"
  }, readonly, pageKey);
  return item;
}

function actionButton(label, actionId, style = "2") {
  return control("action_button", label, {
    "button-style": style,
    common: { positioning: { widthtype: [null, "1"] } },
    control_action: actionId
  }, [], { nv_label: `${label} action button` });
}

function section(title, nvLabel, children) {
  return container(nvLabel, {
    style: { gap: [null, "--sp--s150"], direction: [null, "column"] },
    common: {
      padding: tokenPadding("--sp--s300"),
      background: { normal: { type: "classic", classic: { color: "var(--c--background)" } } },
      border: { normal: { type: "1", width: [null, { top: 1, right: 1, bottom: 1, left: 1 }], color: "var(--c--neutral-light-active)", radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }] } }
    }
  }, [heading(title, `${nvLabel} heading`, "h5-medium"), ...children]);
}

function fieldSection(title, nvLabel, normalControls, fullRowControls = []) {
  return section(title, nvLabel, [
    flexGrid(`${nvLabel} field grid`, normalControls),
    ...fullRowControls
  ]);
}

const pageLoadActionId = uuid();
const recalcAmountActionId = uuid();
const checkQuotaActionId = `${processId}-action-check-quota`;
const checkAndSubmitActionId = uuid();

function makeApprovalPage(title, review, pageKey = review ? "review" : "submit") {
  const readonlyMain = review;
  const requesterApplicantAttrs = { default: "currentUser", placeholder: "Applicant", required: true };
  if (!review && pageKey === "submit") requesterApplicantAttrs.control_event_rule = pageLoadActionId;
  const applicantControls = [
    approvalControl("RequesterApplicant", "RequesterApplicant", "identity-picker", "Requester / Applicant", requesterApplicantAttrs, review, pageKey),
    approvalControl("ApplicantEmployeeName", "ApplicantEmployeeName", "input", "Applicant Name", { placeholder: "Snapshot from RequesterApplicant" }, true, pageKey),
    approvalControl("ApplicantEmployeeID", "ApplicantEmployeeID", "input", "Applicant Employee ID", { placeholder: "Employee No." }, true, pageKey),
    approvalControl("ApplicantDepartment", "ApplicantDepartment", "input", "Department", { placeholder: "Department name" }, true, pageKey),
    approvalControl("ApplicantBoardingDate", "ApplicantBoardingDate", "datepicker", "Boarding Date", { showtime: false, date_type: "0", dateformat: "0" }, true, pageKey),
    approvalControl("ApplicantUserStatus", "ApplicantUserStatus", "input", "User Status", { placeholder: "Status or HR verification" }, true, pageKey),
    approvalControl("ApplicantEmail", "ApplicantEmail", "input", "Email", { placeholder: "Applicant email" }, true, pageKey),
    approvalControl("ApplicantLineManager", "ApplicantLineManager", "input", "Line Manager", { placeholder: "Optional manager name" }, true, pageKey)
  ];
  const requestControls = [
    approvalControl("ApplicationNo", "ApplicationNo", "input", "Application No.", { placeholder: "Generated after submit" }, true, pageKey),
    approvalControl("ApplicationType", "ApplicationType", "radio", "Application Type", { required: true, displayStyle: "dropdown", choices: ["Self", "Family"] }, readonlyMain, pageKey),
    approvalControl("FamilyMemberName", "FamilyMemberName", "input", "Family Member Name", { placeholder: "Required for family application" }, readonlyMain, pageKey),
    approvalControl("FamilyRelationship", "FamilyRelationship", "radio", "Family Relationship", { displayStyle: "dropdown", choices: ["Spouse", "Child", "Parent", "Other"] }, readonlyMain, pageKey)
  ];
  const productControls = [
    approvalControl("TotalApplicationAmount", "TotalApplicationAmount", "input_number", "Total Application Amount", { precision: 2, placeholder: "Summary total from product rows" }, true, pageKey),
    approvalControl("HasCustomPackageProduct", "HasCustomPackageProduct", "radio", "Includes Custom Package Product", { required: true, displayStyle: "dropdown", choices: ["No", "Yes"] }, true, pageKey)
  ];
  const quotaControls = [
    approvalControl("QuotaYear", "QuotaYear", "input", "Quota Cycle", { placeholder: "Employee anniversary quota cycle" }, true, pageKey),
    approvalControl("ApplicantBoardingYears", "ApplicantBoardingYears", "input_number", "Boarding Years", { precision: 0, placeholder: "dateDiff result" }, true, pageKey),
    approvalControl("AnnualQuotaAmount", "AnnualQuotaAmount", "input_number", "Annual Quota Amount", { precision: 2 }, true, pageKey),
    approvalControl("UsedQuotaBefore", "UsedQuotaBefore", "input_number", "Used Quota Before", { precision: 2 }, true, pageKey),
    approvalControl("RemainingQuotaAfter", "RemainingQuotaAfter", "input_number", "Remaining Quota After", { precision: 2 }, true, pageKey),
    approvalControl("EligibilityStatus", "EligibilityStatus", "radio", "Eligibility Status", { displayStyle: "dropdown", choices: ["Eligible", "Not Eligible", "Not Required", "Needs HR Verification"] }, true, pageKey),
    approvalControl("QuotaExceeded", "QuotaExceeded", "radio", "Quota Exceeded", { displayStyle: "dropdown", choices: ["No", "Yes"] }, true, pageKey),
    approvalControl("QuotaUsageStatus", "QuotaUsageStatus", "radio", "Quota Usage Status", { displayStyle: "dropdown", choices: ["Not Applicable", "Occupied", "Released", "Confirmed"] }, true, pageKey)
  ];
  const routingControls = [
    approvalControl("RoutingRuleName", "RoutingRuleName", "input", "Routing Rule Name", { placeholder: "Matched or fallback rule" }, true, pageKey),
    approvalControl("RequiresManagerReview", "RequiresManagerReview", "radio", "Requires Manager Review", { displayStyle: "dropdown", choices: ["No", "Yes", "Fallback to HR"] }, review ? false : true, pageKey),
    approvalControl("ManagerReviewStatus", "ManagerReviewStatus", "radio", "Manager Review Status", { displayStyle: "dropdown", choices: ["Not Required", "Pending", "Approved", "Rejected", "Fallback to HR"] }, review ? false : true, pageKey),
    approvalControl("ManagerReviewerFallback", "ManagerReviewerFallback", "input", "Manager Reviewer Fallback", { placeholder: "HR-configured reviewer or fallback" }, review ? false : true, pageKey),
    approvalControl("FinanceReviewStatus", "FinanceReviewStatus", "radio", "Finance Review Status", { displayStyle: "dropdown", choices: ["Not Required", "Pending", "Approved", "Rejected", "Returned"] }, review ? false : true, pageKey)
  ];
  const lifecycleControls = [
    approvalControl("CurrentStatus", "CurrentStatus", "radio", "Current Status", { displayStyle: "dropdown", choices: ["Draft", "Submitted", "HR Review", "Finance Review", "Returned", "Resubmitted", "Approved", "Rejected", "Expired"] }, review ? false : true, pageKey),
    approvalControl("ExpiryDate", "ExpiryDate", "datepicker", "Expiry Date", { showtime: false, date_type: "0", dateformat: "0" }, review ? false : true, pageKey),
    approvalControl("ExpiryStatus", "ExpiryStatus", "radio", "Expiry Status", { displayStyle: "dropdown", choices: ["Not Applicable", "Pending", "Due Soon", "Expired", "Manually Closed"] }, review ? false : true, pageKey),
    approvalControl("ExpiredFlag", "ExpiredFlag", "radio", "Expired Flag", { displayStyle: "dropdown", choices: ["No", "Yes"] }, review ? false : true, pageKey),
    approvalControl("ResubmissionCount", "ResubmissionCount", "input_number", "Resubmission Count", { precision: 0 }, review ? false : true, pageKey),
    approvalControl("ApprovedQuotaAdjustmentAmount", "ApprovedQuotaAdjustmentAmount", "input_number", "Approved Adjustment Amount", { precision: 2 }, true, pageKey)
  ];
  const profileControls = [
    approvalControl("ProfileMissingFlag", "ProfileMissingFlag", "radio", "Profile Missing Flag", { displayStyle: "dropdown", choices: ["No", "Yes"] }, review ? false : true, pageKey),
    approvalControl("ProfileVerificationStatus", "ProfileVerificationStatus", "radio", "Profile Verification Status", { displayStyle: "dropdown", choices: ["Not Required", "Needs HR Verification", "Verified", "Fallback Reference Used"] }, review ? false : true, pageKey),
    approvalControl("EmployeeReferenceUsed", "EmployeeReferenceUsed", "radio", "Employee Reference Used", { displayStyle: "dropdown", choices: ["No", "Yes"] }, review ? false : true, pageKey),
    approvalControl("OverQuotaAttemptFlag", "OverQuotaAttemptFlag", "radio", "Over Quota Attempt Flag", { displayStyle: "dropdown", choices: ["No", "Yes"] }, true, pageKey)
  ];
  const auditControls = [
    approvalControl("SubmittedBy", "SubmittedBy", "input", "Submitted By", { placeholder: "Submitting user" }, true, pageKey),
    approvalControl("SubmittedTime", "SubmittedTime", "datepicker", "Submitted Time", { showtime: true, date_type: "0", dateformat: "0" }, true, pageKey),
    approvalControl("LastActionBy", "LastActionBy", "input", "Last Action By", { placeholder: "Last action user" }, true, pageKey),
    approvalControl("LastActionTime", "LastActionTime", "datepicker", "Last Action Time", { showtime: true, date_type: "0", dateformat: "0" }, true, pageKey),
    approvalControl("QuotaUsageRecordID", "QuotaUsageRecordID", "input", "Quota Usage Record ID", { placeholder: "Usage row reference" }, true, pageKey)
  ];
  const attachmentVerificationControls = review ? [
    approvalControl("AttachmentVerificationStatus", "AttachmentVerificationStatus", "radio", "Attachment Verification Status", { displayStyle: "dropdown", choices: ["Pending", "Complete", "Missing", "Waived", "Needs HR Verification"] }, false, pageKey),
    approvalControl("MissingAttachmentFlag", "MissingAttachmentFlag", "radio", "Missing Attachment Flag", { displayStyle: "dropdown", choices: ["No", "Yes"] }, false, pageKey),
    approvalControl("AttachmentRequirementScenario", "AttachmentRequirementScenario", "radio", "Attachment Requirement Scenario", { displayStyle: "dropdown", choices: ["Self + Standard", "Self + Custom", "Family + Standard", "Family + Custom"] }, true, pageKey),
    approvalControl("HRVerificationFlag", "HRVerificationFlag", "radio", "HR Verification Flag", { displayStyle: "dropdown", choices: ["No", "Yes"] }, false, pageKey)
  ] : [
    approvalControl("AttachmentRequirementScenario", "AttachmentRequirementScenario", "radio", "Attachment Requirement Scenario", { displayStyle: "dropdown", choices: ["Self + Standard", "Self + Custom", "Family + Standard", "Family + Custom"] }, true, pageKey),
    approvalControl("MissingAttachmentFlag", "MissingAttachmentFlag", "radio", "Missing Attachment Flag", { displayStyle: "dropdown", choices: ["No", "Yes"] }, true, pageKey)
  ];
  const returnControls = review ? [
    approvalControl("ReturnStatus", "ReturnStatus", "radio", "Return Status", { displayStyle: "dropdown", choices: ["Not Returned", "Returned to Applicant", "Resubmitted"] }, false, pageKey),
    approvalControl("ReturnCount", "ReturnCount", "input_number", "Return Count", { precision: 0 }, false, pageKey)
  ] : [
    approvalControl("ReturnStatus", "ReturnStatus", "radio", "Return Status", { displayStyle: "dropdown", choices: ["Not Returned", "Returned to Applicant", "Resubmitted"] }, true, pageKey),
    approvalControl("ReturnCount", "ReturnCount", "input_number", "Return Count", { precision: 0 }, true, pageKey)
  ];
  const reviewControls = review ? [
    approvalControl("HRComments", "HRComments", "textarea", "HR Comments", { edit: { textarea_minrows: 3 }, placeholder: "Add HR review notes" }, false, pageKey),
    approvalControl("FinanceComments", "FinanceComments", "textarea", "Finance Review Comments", { edit: { textarea_minrows: 3 }, placeholder: "Optional finance review notes" }, false, pageKey),
    approvalControl("HRAttachmentReviewNotes", "HRAttachmentReviewNotes", "textarea", "HR Attachment Review Notes", { edit: { textarea_minrows: 3 }, placeholder: "Attachment verification notes" }, false, pageKey),
    approvalControl("HRVerificationNotes", "HRVerificationNotes", "textarea", "HR Verification Notes", { edit: { textarea_minrows: 3 }, placeholder: "Profile, quota, or exception notes" }, false, pageKey),
    approvalControl("ReturnReason", "ReturnReason", "textarea", "Return Reason", { edit: { textarea_minrows: 3 }, placeholder: "Reason when returning to applicant for correction" }, false, pageKey)
  ] : [
    approvalControl("Remarks", "Remarks", "textarea", "Remarks", { edit: { textarea_minrows: 3 }, placeholder: "Add justification or notes" }, false, pageKey)
  ];
  const attachmentGuidanceHtml = "<p><strong>Attachment matrix:</strong></p><ul><li>Self + Standard Product: Implant request/supporting document.</li><li>Self + Custom Package Product: Custom package quotation; Implant request/supporting document.</li><li>Family + Standard Product: Family relationship proof; Implant request/supporting document.</li><li>Family + Custom Package Product: Family relationship proof; Custom package quotation; Implant request/supporting document.</li></ul><p>Strict attachment blocking is used only when runtime-safe. HR verifies incomplete or uncertain attachments.</p>";
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
          container("Form body", { style: { gap: [null, "--sp--s250"], direction: [null, "column"] } }, [
            section(title, "Request summary section", [
              text("<p>Requester / Applicant is fixed for this request. Current User is used only to default the applicant on a new request.</p>", "Requester applicant guidance")
            ]),
            fieldSection("Requester / Applicant Information", "Applicant information section", applicantControls),
            fieldSection("Application Type and Family Details", "Application type section", requestControls),
            fieldSection("Product Selection and Amount", "Product section", productControls, [
              productSelectionListControl(pageKey, review),
              approvalControl("ProductSummary", "ProductSummary", "textarea", "Product Summary", { edit: { textarea_minrows: 3 }, placeholder: "Readable product line summary for persistence" }, readonlyMain, pageKey),
              !review ? actionButton("Refresh Total / Product Summary", recalcAmountActionId, "3") : text("<p>Product and amount values are locked for reviewer inspection.</p>", "Product review guidance")
            ]),
            fieldSection("Family Quota Check", "Quota section", quotaControls, [
              text("<p>Family quota values are based on the Requester / Applicant employee ID and boarding date snapshots. HR should verify missing profile values.</p>", "Quota guidance"),
              !review ? actionButton("Check Family Quota", checkQuotaActionId, "4") : text("<p>Quota check values are locked for reviewer inspection.</p>", "Quota review guidance")
            ]),
            fieldSection("Routing and Manager Review", "Routing manager section", routingControls, [
              approvalControl("RoutingPolicySummary", "RoutingPolicySummary", "textarea", "Routing Policy Summary", { edit: { textarea_minrows: 3 }, placeholder: "Hybrid routing rule guidance" }, true, pageKey),
              text("<p>Workflow Routing Rules provide admin-managed guidance. Stable HR and Finance workflow routes remain the runtime-safe fallback until fully dynamic routing is proven.</p>", "Routing guidance")
            ]),
            fieldSection("Expiry, Profile, and Audit", "Lifecycle profile audit section", lifecycleControls, [
              flexGrid("Profile verification grid", profileControls),
              approvalControl("ExpiryNotes", "ExpiryNotes", "textarea", "Expiry Notes", { edit: { textarea_minrows: 3 }, placeholder: "Manual HR expiry handling notes" }, review ? false : true, pageKey),
              flexGrid("Audit field grid", auditControls)
            ]),
            section("Attachments", "Attachments section", [
              text(attachmentGuidanceHtml, "Attachment matrix guidance"),
              fileUploadControl("RequiredAttachments", "Required Attachments", pageKey, review),
              flexGrid("Attachment verification field grid", attachmentVerificationControls)
            ]),
            section(review ? "Review Notes and Return / Resubmission" : "Remarks", "Remarks section", [
              ...(review ? [flexGrid("Return status field grid", returnControls)] : []),
              ...reviewControls,
              flexGrid("Attachment status field grid", [
                approvalControl("AttachmentStatus", "AttachmentStatus", "radio", "Attachment Status", { displayStyle: "dropdown", choices: ["Pending", "Complete", "Waived"] }, false, pageKey)
              ])
            ])
          ]),
          container("Form bottom", { style: { gap: [null, "--sp--s200"], direction: [null, "column"] } }, [
            { id: `efi-action-panel-${pageKey}`, type: "workflowControlPanel", label: "Action Panel", attrs: { "show-task-panel": true, rejectValidation: true, align: "center" }, nv_label: "Action panel" },
            { id: `efi-flow-history-${pageKey}`, type: "workflowHistory", label: "Flow History", attrs: { "show-history": true }, nv_label: "Flow history" }
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

def.pageurls[0].id = uuid();
def.pageurls[0].title = "Submit Implant Application";
def.pageurls[0].type = 1;
def.pageurls[0].formdef = makeApprovalPage("Submit Implant Application", false);
def.pageurls[0].formdef.id = def.pageurls[0].id;
def.pageurls[1].id = uuid();
def.pageurls[1].title = "HR Review";
def.pageurls[1].type = 2;
def.pageurls[1].formdef = makeApprovalPage("HR Review", true);
def.pageurls[1].formdef.id = def.pageurls[1].id;
const correctionPage = clone(def.pageurls[0]);
correctionPage.id = uuid();
correctionPage.title = "Applicant Correction / Resubmission";
correctionPage.type = 2;
correctionPage.formdef = makeApprovalPage("Applicant Correction / Resubmission", false, "correction");
correctionPage.formdef.id = correctionPage.id;
correctionPage.formdef.pagetype = 2;
const financePage = clone(def.pageurls[1]);
financePage.id = uuid();
financePage.title = "Finance/Benefits Review";
financePage.type = 2;
financePage.formdef = makeApprovalPage("Finance/Benefits Review", true, "finance");
financePage.formdef.id = financePage.id;
def.pageurls = [def.pageurls[0], def.pageurls[1], correctionPage, financePage];

function varButton(varId, name) {
  return `<input type="button" data="\${&quot;type&quot;:&quot;variable&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;${varId}&quot;}}" expr="__" tabindex="-1" value="Workflow Variables:${name}">`;
}

function varFilterExpr(varId, name, valueType = "text") {
  return [{ exprType: "variable", valueType, id: varId, type: "expr", name: `Workflow Variables:${name}` }];
}

function taskOutcomeButton(taskId, taskName) {
  return `<input type="button" data="\${&quot;type&quot;:&quot;task&quot;,&quot;param&quot;:{&quot;defid&quot;:&quot;${taskId}&quot;}, &quot;prop&quot;:&quot;Outcome&quot;}" expr="__" tabindex="-1" value="${taskName}:Outcome">`;
}

function outcomeValueButton(value) {
  return `<input type="button" data="${value}" expr="__" tabindex="-1" value="Task outcome:${value}">`;
}

function workflowVarToken(id, name, valueType = "text") {
  return { exprType: "variable", valueType, id, type: "expr", name: `Workflow Variables:${name}` };
}

function currentUserToken() {
  return { id: "CurrentUser", exprType: "application", valueType: "string", type: "expr", name: "Context:Current User" };
}

function nowToken() {
  return { type: "func", func: "now", params: [] };
}

function profileAttr(func, subject, key, label, fallback = "Needs HR Verification") {
  return { type: "func", func, params: [[subject], { key, label }, fallback === "" ? [] : [{ type: "str", value: fallback }]] };
}

function getUserAttr(subject, key, label, fallback = "Needs HR Verification") {
  return profileAttr("getUserAttr", subject, key, label, fallback);
}

function getOrgAttr(subject, key, label, fallback = "Needs HR Verification") {
  return profileAttr("getOrgAttr", subject, key, label, fallback);
}

function tempVarToken(id, name = id, valueType = "text") {
  return { exprType: "variable", valueType, id: `__temp_${id}`, type: "expr", name };
}

function literalString(value) {
  return [{ type: "str", value }];
}

function literalNumber(value) {
  return [{ type: "num", value }];
}

function multiSetStep(name, entries) {
  return {
    type: "setvar",
    name,
    attrs: {
      setvar_multi: true,
      setvar_array: entries.map(([target, value]) => ({ var: target, value }))
    }
  };
}

function queryUsageListRef() {
  return { AppID: appId, ListSetID: rootId, ListID: usageListId, ListType: 1 };
}

function queryQuotaConfigListRef() {
  return { AppID: appId, ListSetID: rootId, ListID: quotaListId, ListType: 1 };
}

function queryAttachmentRulesListRef() {
  return { AppID: appId, ListSetID: rootId, ListID: attachmentRulesListId, ListType: 1 };
}

function queryQuotaAdjustmentsListRef() {
  return { AppID: appId, ListSetID: rootId, ListID: quotaAdjustmentsListId, ListType: 1 };
}

function queryRoutingRulesListRef() {
  return { AppID: appId, ListSetID: rootId, ListID: routingRulesListId, ListType: 1 };
}

function implantFormActions() {
  const requesterApplicant = workflowVarToken("RequesterApplicant", "Requester / Applicant", "user");
  const applicantStatus = workflowVarToken("ApplicantProfileSnapshotStatus", "Applicant Profile Snapshot Status", "text");
  const applicantEmployeeName = workflowVarToken("ApplicantEmployeeName", "Applicant Name", "text");
  const applicantEmployeeId = workflowVarToken("ApplicantEmployeeID", "Applicant Employee ID", "text");
  const applicantDepartment = workflowVarToken("ApplicantDepartment", "Applicant Department", "text");
  const applicantBoardingDate = workflowVarToken("ApplicantBoardingDate", "Applicant Boarding Date", "date");
  const applicantUserStatus = workflowVarToken("ApplicantUserStatus", "Applicant User Status", "text");
  const applicantEmail = workflowVarToken("ApplicantEmail", "Applicant Email", "text");
  const applicantLineManager = workflowVarToken("ApplicantLineManager", "Applicant Line Manager", "text");
  const quotaStatus = workflowVarToken("QuotaUsageStatus", "Quota Usage Status", "text");
  const annualQuotaAmount = workflowVarToken("AnnualQuotaAmount", "Annual Quota Amount", "number");
  const inProgressUsedQuota = workflowVarToken("InProgressUsedQuota", "In Progress Used Quota", "number");
  const occupiedUsedQuota = workflowVarToken("OccupiedUsedQuota", "Occupied Used Quota", "number");
  const approvedUsedQuota = workflowVarToken("ApprovedUsedQuota", "Approved Used Quota", "number");
  const confirmedUsedQuota = workflowVarToken("ConfirmedUsedQuota", "Confirmed Used Quota", "number");
  const usedQuotaBefore = workflowVarToken("UsedQuotaBefore", "Used Quota Before", "number");
  const remainingQuotaAfter = workflowVarToken("RemainingQuotaAfter", "Remaining Quota After", "number");
  const quotaExceeded = workflowVarToken("QuotaExceeded", "Quota Exceeded", "text");
  const applicantBoardingYears = workflowVarToken("ApplicantBoardingYears", "Applicant Boarding Years", "number");
  const quotaCycleNo = workflowVarToken("QuotaCycleNo", "Quota Cycle No.", "number");
  const quotaCycleKey = workflowVarToken("QuotaCycleKey", "Quota Cycle Key", "text");
  const eligibilityStatus = workflowVarToken("EligibilityStatus", "Eligibility Status", "text");
  const quotaYear = workflowVarToken("QuotaYear", "Quota Year", "text");
  const routingRuleName = workflowVarToken("RoutingRuleName", "Routing Rule Name", "text");
  const routingPolicySummary = workflowVarToken("RoutingPolicySummary", "Routing Policy Summary", "text");
  const requiresManagerReview = workflowVarToken("RequiresManagerReview", "Requires Manager Review", "text");
  const managerReviewStatus = workflowVarToken("ManagerReviewStatus", "Manager Review Status", "text");
  const financeReviewStatus = workflowVarToken("FinanceReviewStatus", "Finance Review Status", "text");
  const currentStatus = workflowVarToken("CurrentStatus", "Current Status", "text");
  const resubmissionCount = workflowVarToken("ResubmissionCount", "Resubmission Count", "number");
  const approvedQuotaAdjustmentAmount = workflowVarToken("ApprovedQuotaAdjustmentAmount", "Approved Quota Adjustment Amount", "number");
  const expiryStatus = workflowVarToken("ExpiryStatus", "Expiry Status", "text");
  const expiredFlag = workflowVarToken("ExpiredFlag", "Expired Flag", "text");
  const profileMissingFlag = workflowVarToken("ProfileMissingFlag", "Profile Missing Flag", "text");
  const profileVerificationStatus = workflowVarToken("ProfileVerificationStatus", "Profile Verification Status", "text");
  const employeeReferenceUsed = workflowVarToken("EmployeeReferenceUsed", "Employee Reference Used", "text");
  const overQuotaAttemptFlag = workflowVarToken("OverQuotaAttemptFlag", "Over Quota Attempt Flag", "text");
  const attachmentSummary = workflowVarToken("RequiredAttachmentSummary", "Required Attachment Summary", "text");
  const attachmentVerificationStatus = workflowVarToken("AttachmentVerificationStatus", "Attachment Verification Status", "text");
  const missingAttachmentFlag = workflowVarToken("MissingAttachmentFlag", "Missing Attachment Flag", "text");
  const attachmentRequirementScenario = workflowVarToken("AttachmentRequirementScenario", "Attachment Requirement Scenario", "text");
  const returnStatus = workflowVarToken("ReturnStatus", "Return Status", "text");
  const returnCount = workflowVarToken("ReturnCount", "Return Count", "number");
  const hrVerificationFlag = workflowVarToken("HRVerificationFlag", "HR Verification Flag", "text");
  const productLines = workflowVarToken("ProductSelectionItems", "Product Selection Items", "text");
  const productSummary = workflowVarToken("ProductSummary", "Product Summary", "text");
  const appAmount = workflowVarToken("TotalApplicationAmount", "Total Application Amount", "number");
  const hasCustomPackage = workflowVarToken("HasCustomPackageProduct", "Has Custom Package Product", "text");
  const attachmentScenarioProductType = workflowVarToken("AttachmentScenarioProductType", "Attachment Scenario Product Type", "text");
  const activeUsageCollection = tempVarToken("var_ActiveUsageAmountCollection", "var_ActiveUsageAmountCollection", "text");
  const inProgressUsageCollection = tempVarToken("var_InProgressUsageAmountCollection", "var_InProgressUsageAmountCollection", "text");
  const occupiedUsageCollection = tempVarToken("var_OccupiedUsageAmountCollection", "var_OccupiedUsageAmountCollection", "text");
  const approvedUsageCollection = tempVarToken("var_ApprovedUsageAmountCollection", "var_ApprovedUsageAmountCollection", "text");
  const confirmedUsageCollection = tempVarToken("var_ConfirmedUsageAmountCollection", "var_ConfirmedUsageAmountCollection", "text");
  const approvedAdjustmentCollection = tempVarToken("var_ApprovedAdjustmentAmountCollection", "var_ApprovedAdjustmentAmountCollection", "text");
  const routingRuleCollection = tempVarToken("var_RoutingRuleCollection", "var_RoutingRuleCollection", "text");
  const attachmentRuleCollection = tempVarToken("var_AttachmentRuleCollection", "var_AttachmentRuleCollection", "text");
  const boardingDateEmpty = [{ type: "func", func: "isNullOrEmpty", params: [[applicantBoardingDate]] }];
  const applicantTenureYears = [{ type: "func", func: "dateDiff", params: [[applicantBoardingDate], [nowToken()], "year", []] }];
  const customPackageDetected = [
    { type: "func", func: "strIndex", params: [[productSummary], [{ type: "str", value: "Custom Package Product" }]] },
    { type: "op", op: ">=" },
    { type: "num", value: 0 }
  ];
  const hasCustomPackageExpression = [{ type: "func", func: "iif", params: [customPackageDetected, literalString("Yes"), literalString("No")] }];
  const attachmentScenarioProductTypeExpression = [{ type: "func", func: "iif", params: [[hasCustomPackage, { type: "op", op: "==" }, { type: "str", value: "Yes" }], literalString("Custom Package Product"), literalString("Standard Product")] }];
  const applicantEligibleCondition = [applicantBoardingYears, { type: "op", op: ">" }, { type: "num", value: 0 }];
  const eligibilityStatusExpression = [
    {
      type: "func",
      func: "iif",
      params: [
        boardingDateEmpty,
        [{ type: "str", value: "Needs HR Verification" }],
        [{
          type: "func",
          func: "iif",
          params: [
            applicantEligibleCondition,
            [{ type: "str", value: "Eligible" }],
            [{ type: "str", value: "Not Eligible" }]
          ]
        }]
      ]
    }
  ];
  const effectiveAnnualQuotaExpression = [
    {
      type: "func",
      func: "iif",
      params: [
        [eligibilityStatus, { type: "op", op: "==" }, { type: "str", value: "Eligible" }],
        [annualQuotaAmount],
        [{ type: "num", value: 0 }]
      ]
    }
  ];
  function activeUsageQueryStep(tempCollectionId) {
    return {
      type: "querydata",
      name: "Load active family quota usage rows from Family Quota Usage",
      attrs: {
        querydata_list: queryUsageListRef(),
        querydata_filters: [
          { key: uuid(), pre: "and", left: "Text2", op: "0", right: varFilterExpr("ApplicantEmployeeID", "Applicant Employee ID"), showCus: false },
          { key: uuid(), pre: "and", left: "Text4", op: "0", right: varFilterExpr("QuotaCycleKey", "Quota Cycle Key"), showCus: false }
        ],
        querydata_type: "multiple",
        querydata_fieldmap: null,
        querydata_listname: tempCollectionId,
        querydata_vartype: "text",
        querydata_listname_parent: "__temp_",
        querydata_fields: [
          { FieldName: "Title", Type: "input", DisplayName: "Usage Record" },
          { FieldName: "Decimal3", Type: "input_number", DisplayName: "Amount" }
        ],
        querydata_totalcount: "var_TotalQueryItems",
        querydata_totalparent: "__temp_",
        querydata_pagesize: 300
      }
    };
  }
  function sumUsageStep(name, target, collection) {
    return {
      type: "setvar",
      name,
      attrs: {
        setvar_var: target,
        setvar_val: [{ type: "func", func: "arraySum", params: [[collection], [{ type: "str", value: "Amount" }], [], []] }]
      }
    };
  }
  function approvedAdjustmentQueryStep() {
    return {
      type: "querydata",
      name: "Load approved quota adjustments for applicant and cycle",
      attrs: {
        querydata_list: queryQuotaAdjustmentsListRef(),
        querydata_filters: [
          { key: uuid(), pre: "and", left: "Text2", op: "0", right: varFilterExpr("ApplicantEmployeeID", "Applicant Employee ID"), showCus: false },
          { key: uuid(), pre: "and", left: "Decimal1", op: "0", right: varFilterExpr("QuotaCycleNo", "Quota Cycle No.", "number"), showCus: false },
          { key: uuid(), pre: "and", left: "Text4", op: "0", right: "Approved", showCus: true }
        ],
        querydata_type: "multiple",
        querydata_fieldmap: null,
        querydata_listname: "var_ApprovedAdjustmentAmountCollection",
        querydata_vartype: "text",
        querydata_listname_parent: "__temp_",
        querydata_fields: [
          { FieldName: "Title", Type: "input", DisplayName: "Adjustment Record" },
          { FieldName: "Decimal3", Type: "input_number", DisplayName: "Amount" }
        ],
        querydata_totalcount: "var_TotalQueryItems",
        querydata_totalparent: "__temp_",
        querydata_pagesize: 300
      }
    };
  }
  function routingRuleQueryStep() {
    return {
      type: "querydata",
      name: "Load active routing rule guidance",
      attrs: {
        querydata_list: queryRoutingRulesListRef(),
        querydata_filters: [
          { key: uuid(), pre: "and", left: "Text7", op: "0", right: "Yes", showCus: true }
        ],
        querydata_sorts: [{ SortName: "Decimal2", SortByDesc: false }],
        querydata_type: "multiple",
        querydata_fieldmap: null,
        querydata_listname: "var_RoutingRuleCollection",
        querydata_vartype: "text",
        querydata_listname_parent: "__temp_",
        querydata_fields: [
          { FieldName: "Title", Type: "input", DisplayName: "Rule Name" },
          { FieldName: "Text5", Type: "radio", DisplayName: "Requires Finance Review" },
          { FieldName: "Text6", Type: "radio", DisplayName: "Requires Manager Review" },
          { FieldName: "Text8", Type: "textarea", DisplayName: "Notes" }
        ],
        querydata_totalcount: "var_TotalQueryItems",
        querydata_totalparent: "__temp_",
        querydata_pagesize: 50
      }
    };
  }
  return [
    {
      id: pageLoadActionId,
      name: "Initialize requester applicant snapshot defaults",
      steps: [
        multiSetStep("Snapshot applicant profile and defaults from RequesterApplicant", [
          [applicantEmployeeName, [getUserAttr(requesterApplicant, "Name_CN", "Name", "Needs HR Verification")]],
          [applicantEmployeeId, [getUserAttr(requesterApplicant, "EmployeeNo", "Employee No.", "Needs HR Verification")]],
          [applicantDepartment, [getOrgAttr(getUserAttr(requesterApplicant, "DepartmentID", "Department", ""), "Name_CN", "Name", "Needs HR Verification")]],
          [applicantBoardingDate, [getUserAttr(requesterApplicant, "LatestHireDate", "Boarding Date", "")]],
          [applicantUserStatus, literalString("Needs HR Verification")],
          [applicantEmail, [getUserAttr(requesterApplicant, "Email", "Email", "Needs HR Verification")]],
          [applicantLineManager, [getUserAttr(getUserAttr(requesterApplicant, "LineManager", "Line Manager", ""), "Name_CN", "Name", "Needs HR Verification")]],
          [applicantStatus, literalString("Profile snapshot required; HR verifies missing profile values.")],
          [quotaStatus, literalString("Not Applicable")],
          [attachmentVerificationStatus, literalString("Pending")],
          [missingAttachmentFlag, literalString("No")],
          [attachmentRequirementScenario, literalString("Self + Standard")],
          [returnStatus, literalString("Not Returned")],
          [returnCount, literalNumber(0)],
          [resubmissionCount, literalNumber(0)],
          [hrVerificationFlag, literalString("No")],
          [routingRuleName, literalString("Standard Requests")],
          [routingPolicySummary, literalString("Hybrid routing rules are admin-managed for guidance. Stable HR and Finance workflow routes remain the safe fallback.")],
          [requiresManagerReview, literalString("No")],
          [managerReviewStatus, literalString("Not Required")],
          [financeReviewStatus, literalString("Not Required")],
          [currentStatus, literalString("Draft")],
          [approvedQuotaAdjustmentAmount, literalNumber(0)],
          [expiryStatus, literalString("Not Applicable")],
          [expiredFlag, literalString("No")],
          [profileMissingFlag, literalString("No")],
          [profileVerificationStatus, literalString("Needs HR Verification")],
          [employeeReferenceUsed, literalString("No")],
          [overQuotaAttemptFlag, literalString("No")],
          [hasCustomPackage, literalString("No")],
          [attachmentScenarioProductType, literalString("Standard Product")],
          [quotaYear, [{ type: "func", func: "dateFormat", params: [[nowToken()], [{ type: "str", value: "YYYY" }]] }]],
          [attachmentSummary, literalString("Self+Standard: Implant request/supporting document. Self+Custom: Custom package quotation and implant request/supporting document. Family+Standard: Family relationship proof and implant request/supporting document. Family+Custom: Family relationship proof, custom package quotation, and implant request/supporting document.")]
        ]),
        {
          type: "otheraction",
          name: "Run family quota check after applicant initialization",
          attrs: { control_action: checkQuotaActionId }
        }
      ]
    },
    {
      id: recalcAmountActionId,
      name: "Refresh total amount and product summary",
      steps: [
        multiSetStep("Refresh total amount and readable product summary", [
          [appAmount, totalApplicationAmountExpression()],
          [productSummary, [{ type: "func", func: "JSONStringfy", params: [[productLines]] }]]
        ]),
        multiSetStep("Derive product routing and attachment scenario", [
          [hasCustomPackage, hasCustomPackageExpression],
          [attachmentScenarioProductType, attachmentScenarioProductTypeExpression],
          [attachmentRequirementScenario, [{ type: "func", func: "iif", params: [[workflowVarToken("ApplicationType", "Application Type", "text"), { type: "op", op: "==" }, { type: "str", value: "Family" }], [{ type: "func", func: "iif", params: [[hasCustomPackage, { type: "op", op: "==" }, { type: "str", value: "Yes" }], literalString("Family + Custom"), literalString("Family + Standard")] }], [{ type: "func", func: "iif", params: [[hasCustomPackage, { type: "op", op: "==" }, { type: "str", value: "Yes" }], literalString("Self + Custom"), literalString("Self + Standard")] }]] }]]
        ])
      ]
    },
    {
      id: checkQuotaActionId,
      name: "Check family quota usage",
      steps: [
        multiSetStep("Refresh total amount, product summary, and boarding year number", [
          [appAmount, [{ type: "func", func: "arraySum", params: [[productLines], [{ type: "str", value: "ProductRowSubtotal" }], [], []] }]],
          [productSummary, [{ type: "func", func: "JSONStringfy", params: [[productLines]] }]],
          [applicantBoardingYears, applicantTenureYears]
        ]),
        multiSetStep("Map boarding tenure to employee-anniversary quota cycle", [
          [quotaCycleNo, [applicantBoardingYears]],
          [quotaCycleKey, [applicantBoardingYears]]
        ]),
        multiSetStep("Derive product routing and attachment scenario", [
          [hasCustomPackage, hasCustomPackageExpression],
          [attachmentScenarioProductType, attachmentScenarioProductTypeExpression],
          [attachmentRequirementScenario, [{ type: "func", func: "iif", params: [[workflowVarToken("ApplicationType", "Application Type", "text"), { type: "op", op: "==" }, { type: "str", value: "Family" }], [{ type: "func", func: "iif", params: [[hasCustomPackage, { type: "op", op: "==" }, { type: "str", value: "Yes" }], literalString("Family + Custom"), literalString("Family + Standard")] }], [{ type: "func", func: "iif", params: [[hasCustomPackage, { type: "op", op: "==" }, { type: "str", value: "Yes" }], literalString("Self + Custom"), literalString("Self + Standard")] }]] }]]
        ]),
        routingRuleQueryStep(),
        {
          type: "setvar",
          name: "Set eligibility status from boarding year number",
          attrs: {
            setvar_var: eligibilityStatus,
            setvar_val: eligibilityStatusExpression
          }
        },
        {
          type: "querydata",
          name: "Load active annual quota amount",
          attrs: {
            querydata_list: queryQuotaConfigListRef(),
            querydata_filters: [{ key: uuid(), pre: "and", left: "Text2", op: "0", right: "Active", showCus: true }],
            querydata_sorts: [{ SortName: "Created", SortByDesc: true }],
            querydata_type: "single",
            querydata_fieldmap: { Decimal1: "AnnualQuotaAmount" },
            querydata_listname: "",
            querydata_vartype: "",
            querydata_listname_parent: "",
            querydata_fields: null,
            querydata_totalcount: "var_TotalQueryItems",
            querydata_totalparent: "__temp_",
            querydata_pagesize: 200
          }
        },
        {
          type: "setvar",
          name: "Apply one-year boarding eligibility to annual quota",
          attrs: {
            setvar_var: annualQuotaAmount,
            setvar_val: effectiveAnnualQuotaExpression
          }
        },
        activeUsageQueryStep("var_ActiveUsageAmountCollection"),
        sumUsageStep("Sum active usage amount with arraySum", usedQuotaBefore, activeUsageCollection),
        approvedAdjustmentQueryStep(),
        sumUsageStep("Sum approved quota adjustments with arraySum", approvedQuotaAdjustmentAmount, approvedAdjustmentCollection),
        {
          type: "setvar",
          name: "Calculate remaining quota after this request and approved adjustments",
          attrs: {
            setvar_var: remainingQuotaAfter,
            setvar_val: [annualQuotaAmount, { type: "op", op: "+" }, approvedQuotaAdjustmentAmount, { type: "op", op: "-" }, usedQuotaBefore, { type: "op", op: "-" }, appAmount]
          }
        },
        multiSetStep("Set quota guard flags", [
          [quotaExceeded, [{ type: "func", func: "iif", params: [[remainingQuotaAfter, { type: "op", op: "<" }, { type: "num", value: 0 }], [{ type: "str", value: "Yes" }], [{ type: "str", value: "No" }]] }]],
          [overQuotaAttemptFlag, [{ type: "func", func: "iif", params: [[remainingQuotaAfter, { type: "op", op: "<" }, { type: "num", value: 0 }], [{ type: "str", value: "Yes" }], [{ type: "str", value: "No" }]] }]],
          [quotaStatus, [{ type: "func", func: "iif", params: [[workflowVarToken("ApplicationType", "Application Type", "text"), { type: "op", op: "==" }, { type: "str", value: "Family" }], literalString("In Progress"), literalString("Not Applicable")] }]],
          [routingRuleName, [{ type: "func", func: "iif", params: [[hasCustomPackage, { type: "op", op: "==" }, { type: "str", value: "Yes" }], literalString("Custom Package Requests"), literalString("Standard Requests")] }]],
          [routingPolicySummary, [{ type: "func", func: "iif", params: [[hasCustomPackage, { type: "op", op: "==" }, { type: "str", value: "Yes" }], literalString("Custom package requests route to HR Review and Finance/Benefits Review. Manager Review remains fallback-to-HR until line-manager assignment is proven."), literalString("Standard requests route to HR Review. Routing rules remain admin-visible guidance with stable workflow fallback.")] }]],
          [requiresManagerReview, [{ type: "func", func: "iif", params: [[hasCustomPackage, { type: "op", op: "==" }, { type: "str", value: "Yes" }], literalString("Fallback to HR"), literalString("No")] }]],
          [managerReviewStatus, [{ type: "func", func: "iif", params: [[hasCustomPackage, { type: "op", op: "==" }, { type: "str", value: "Yes" }], literalString("Fallback to HR"), literalString("Not Required")] }]],
          [financeReviewStatus, [{ type: "func", func: "iif", params: [[hasCustomPackage, { type: "op", op: "==" }, { type: "str", value: "Yes" }], literalString("Pending"), literalString("Not Required")] }]],
          [missingAttachmentFlag, literalString("No")],
          [hrVerificationFlag, [{ type: "func", func: "iif", params: [[quotaExceeded, { type: "op", op: "==" }, { type: "str", value: "Yes" }], literalString("Yes"), literalString("No")] }]]
        ]),
        {
          type: "querydata",
          name: "Load attachment requirement rules for current scenario",
          attrs: {
            querydata_list: queryAttachmentRulesListRef(),
            querydata_filters: [
              { key: uuid(), pre: "and", left: "Text1", op: "0", right: varFilterExpr("ApplicationType", "Application Type"), showCus: false },
              { key: uuid(), pre: "and", left: "Text2", op: "0", right: varFilterExpr("AttachmentScenarioProductType", "Attachment Scenario Product Type"), showCus: false },
              { key: uuid(), pre: "and", left: "Text5", op: "0", right: "Active", showCus: true }
            ],
            querydata_type: "multiple",
            querydata_fieldmap: null,
            querydata_listname: "var_AttachmentRuleCollection",
            querydata_vartype: "text",
            querydata_listname_parent: "__temp_",
            querydata_fields: [
              { FieldName: "Text3", Type: "input", DisplayName: "Required Attachment" },
              { FieldName: "Text6", Type: "textarea", DisplayName: "Instructions" }
            ],
            querydata_totalcount: "var_TotalQueryItems",
            querydata_totalparent: "__temp_",
            querydata_pagesize: 50
          }
        },
        {
          type: "setvar",
          name: "Show attachment requirement guidance from rules",
          attrs: {
            setvar_var: attachmentSummary,
            setvar_val: [{ type: "func", func: "JSONStringfy", params: [[attachmentRuleCollection]] }]
          }
        }
      ]
    },
    {
      id: checkAndSubmitActionId,
      name: "Check and Submit the form",
      steps: [
        {
          type: "otheraction",
          name: "Run family quota check before submit",
          attrs: { control_action: checkQuotaActionId }
        },
        {
          type: "confirm",
          name: "Warn when family quota is exceeded",
          condition: [
            workflowVarToken("ApplicationType", "Application Type", "text"),
            { type: "op", op: "==" },
            { type: "str", value: "Family" },
            { type: "op", op: "and" },
            quotaExceeded,
            { type: "op", op: "==" },
            { type: "str", value: "Yes" }
          ],
          attrs: {
            confirm_qs: literalString("Family quota appears to be exceeded. Submission is blocked for v3; please adjust product rows or ask HR to verify quota/profile data or approved adjustment records."),
            confirm_rs: tempVarToken("var_SubmitGuardResult", "var_SubmitGuardResult", "text")
          },
          continue: true
        },
        {
          type: "submit",
          name: "Submit when quota is valid or not a family request",
          condition: [
            workflowVarToken("ApplicationType", "Application Type", "text"),
            { type: "op", op: "!=" },
            { type: "str", value: "Family" },
            { type: "op", op: "or" },
            quotaExceeded,
            { type: "op", op: "!=" },
            { type: "str", value: "Yes" }
          ]
        }
      ]
    }
  ];
}

def.pageurls[0].formdef.actions = implantFormActions();
def.pageurls[0].formdef.formAction = { onLoad: pageLoadActionId, onSubmit: checkAndSubmitActionId };
correctionPage.formdef.actions = implantFormActions();
correctionPage.formdef.formAction = { onLoad: pageLoadActionId, onSubmit: checkAndSubmitActionId };
def.pageurls[1].formdef.actions = [];
financePage.formdef.actions = [];
def.variables.tempVars = [
  { idx: "efi-temp-total-query-items", id: "var_TotalQueryItems", type: "number" },
  { idx: "efi-temp-active-usage-collection", id: "var_ActiveUsageAmountCollection", type: "text" },
  { idx: "efi-temp-usage-in-progress-collection", id: "var_InProgressUsageAmountCollection", type: "text" },
  { idx: "efi-temp-usage-occupied-collection", id: "var_OccupiedUsageAmountCollection", type: "text" },
  { idx: "efi-temp-usage-approved-collection", id: "var_ApprovedUsageAmountCollection", type: "text" },
  { idx: "efi-temp-usage-confirmed-collection", id: "var_ConfirmedUsageAmountCollection", type: "text" },
  { idx: "efi-temp-approved-adjustment-collection", id: "var_ApprovedAdjustmentAmountCollection", type: "text" },
  { idx: "efi-temp-routing-rule-collection", id: "var_RoutingRuleCollection", type: "text" },
  { idx: "efi-temp-attachment-rule-collection", id: "var_AttachmentRuleCollection", type: "text" },
  { idx: "efi-temp-submit-guard-result", id: "var_SubmitGuardResult", type: "text" }
];

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

function workflowFlow(resourceid, source, target, properties = {}) {
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

function contentListNode(resourceid, name, listid, listdatas, position, incoming, outgoing, extra = {}) {
  return workflowNode(resourceid, "ContentList", {
    name,
    type: extra.type || "add",
    appid: appId,
    listsetid: rootId,
    listid,
    listtype: "select",
    listdatas,
    wheres: extra.wheres || []
  }, position, incoming, outgoing);
}

const startNodeId = "efi-node-start-0001";
const setNodeId = "efi-node-set-0002";
const hrReviewNodeId = "efi-node-hr-review-0003";
const persistAppNodeId = "efi-node-persist-app-0004";
const financeReviewNodeId = "efi-node-finance-review-0005";
const occupyUsageNodeId = "efi-node-occupy-usage-0006";
const endNodeId = "efi-node-end-0007";
const rejectNodeId = "efi-node-reject-0008";
const approveUsageNodeId = "efi-node-approve-usage-0009";
const releaseUsageNodeId = "efi-node-release-usage-0010";
const returnUsageNodeId = "efi-node-return-usage-0011";
const correctionNodeId = "efi-node-correction-0012";
const setResubmittedNodeId = "efi-node-set-resubmitted-0013";
const flowStartSet = "efi-flow-0001";
const flowSetSelfReview = "efi-flow-0002";
const flowSetFamilyUsage = "efi-flow-0002a";
const flowUsageHrReview = "efi-flow-0002b";
const flowHrApprovedStandard = "efi-flow-0003";
const flowHrApprovedFinance = "efi-flow-0004";
const flowHrRejectedSelf = "efi-flow-0005";
const flowHrRejectedFamily = "efi-flow-0005a";
const flowFinanceApproved = "efi-flow-0006";
const flowFinanceRejectedSelf = "efi-flow-0007";
const flowFinanceRejectedFamily = "efi-flow-0007a";
const flowPersistAppUsageApproved = "efi-flow-0008";
const flowPersistAppEnd = "efi-flow-0009";
const flowApproveUsageEnd = "efi-flow-0010";
const flowReleaseUsageEnd = "efi-flow-0011";
const flowHrReturned = "efi-flow-0012";
const flowFinanceReturned = "efi-flow-0013";
const flowReturnUsageCorrection = "efi-flow-0014";
const flowCorrectionResubmit = "efi-flow-0015";
const flowResubmitHrReview = "efi-flow-0016";

const appRecordMappings = [
  { Per: "0", Columns: "Title", Data: varButton("ApplicationNo", "Application No.") },
  { Per: "0", Columns: "Text1", Data: varButton("ApplicantEmployeeID", "Applicant Employee ID") },
  { Per: "0", Columns: "Text2", Data: varButton("ApplicantEmployeeName", "Applicant Name") },
  { Per: "0", Columns: "Text3", Data: varButton("ApplicantDepartment", "Applicant Department") },
  { Per: "0", Columns: "Datetime1", Data: varButton("ApplicantBoardingDate", "Applicant Boarding Date") },
  { Per: "0", Columns: "Text4", Data: varButton("ApplicationType", "Application Type") },
  { Per: "0", Columns: "Text5", Data: varButton("ProductSummary", "Product Summary") },
  { Per: "0", Columns: "Text6", Data: varButton("HasCustomPackageProduct", "Has Custom Package Product") },
  { Per: "0", Columns: "Decimal1", Data: varButton("TotalApplicationAmount", "Total Application Amount") },
  { Per: "0", Columns: "Text7", Data: varButton("QuotaYear", "Quota Year") },
  { Per: "0", Columns: "Decimal2", Data: varButton("AnnualQuotaAmount", "Annual Quota Amount") },
  { Per: "0", Columns: "Decimal3", Data: varButton("UsedQuotaBefore", "Used Quota Before") },
  { Per: "0", Columns: "Decimal4", Data: varButton("RemainingQuotaAfter", "Remaining Quota After") },
  { Per: "0", Columns: "Decimal5", Data: varButton("ApplicantBoardingYears", "Applicant Boarding Years") },
  { Per: "0", Columns: "Text8", Data: varButton("EligibilityStatus", "Eligibility Status") },
  { Per: "0", Columns: "Text9", Data: "Approved" },
  { Per: "0", Columns: "Text10", Data: varButton("QuotaUsageStatus", "Quota Usage Status") },
  { Per: "0", Columns: "Text11", Data: varButton("ApplicantEmail", "Applicant Email") },
  { Per: "0", Columns: "Text12", Data: varButton("ApplicantLineManager", "Applicant Line Manager") },
  { Per: "0", Columns: "Text13", Data: varButton("FamilyMemberName", "Family Member Name") },
  { Per: "0", Columns: "Text14", Data: varButton("FamilyRelationship", "Family Relationship") },
  { Per: "0", Columns: "Text15", Data: varButton("Remarks", "Remarks") },
  { Per: "0", Columns: "Text16", Data: varButton("RequiredAttachmentSummary", "Required Attachment Summary") },
  { Per: "0", Columns: "Text17", Data: varButton("AttachmentVerificationStatus", "Attachment Verification Status") },
  { Per: "0", Columns: "Text18", Data: varButton("MissingAttachmentFlag", "Missing Attachment Flag") },
  { Per: "0", Columns: "Text19", Data: varButton("HRAttachmentReviewNotes", "HR Attachment Review Notes") },
  { Per: "0", Columns: "Text20", Data: varButton("AttachmentRequirementScenario", "Attachment Requirement Scenario") },
  { Per: "0", Columns: "Text21", Data: varButton("ReturnStatus", "Return Status") },
  { Per: "0", Columns: "Text22", Data: varButton("ReturnReason", "Return Reason") },
  { Per: "0", Columns: "Decimal6", Data: varButton("ReturnCount", "Return Count") },
  { Per: "0", Columns: "Text23", Data: varButton("HRVerificationFlag", "HR Verification Flag") },
  { Per: "0", Columns: "Text24", Data: varButton("HRVerificationNotes", "HR Verification Notes") },
  { Per: "0", Columns: "Text25", Data: varButton("RoutingRuleName", "Routing Rule Name") },
  { Per: "0", Columns: "Text26", Data: varButton("RoutingPolicySummary", "Routing Policy Summary") },
  { Per: "0", Columns: "Text27", Data: varButton("RequiresManagerReview", "Requires Manager Review") },
  { Per: "0", Columns: "Text28", Data: varButton("ManagerReviewStatus", "Manager Review Status") },
  { Per: "0", Columns: "Text29", Data: varButton("ManagerReviewerFallback", "Manager Reviewer Fallback") },
  { Per: "0", Columns: "Text30", Data: varButton("FinanceReviewStatus", "Finance Review Status") },
  { Per: "0", Columns: "Text31", Data: varButton("SubmittedBy", "Submitted By") },
  { Per: "0", Columns: "Text32", Data: varButton("CurrentStatus", "Current Status") },
  { Per: "0", Columns: "Text33", Data: varButton("LastActionBy", "Last Action By") },
  { Per: "0", Columns: "Decimal7", Data: varButton("ResubmissionCount", "Resubmission Count") },
  { Per: "0", Columns: "Text34", Data: varButton("QuotaUsageRecordID", "Quota Usage Record ID") },
  { Per: "0", Columns: "Decimal8", Data: varButton("ApprovedQuotaAdjustmentAmount", "Approved Quota Adjustment Amount") },
  { Per: "0", Columns: "Datetime2", Data: varButton("SubmittedTime", "Submitted Time") },
  { Per: "0", Columns: "Datetime3", Data: varButton("LastActionTime", "Last Action Time") },
  { Per: "0", Columns: "Datetime4", Data: varButton("ExpiryDate", "Expiry Date") },
  { Per: "0", Columns: "Text35", Data: varButton("ExpiryStatus", "Expiry Status") },
  { Per: "0", Columns: "Text36", Data: varButton("ExpiredFlag", "Expired Flag") },
  { Per: "0", Columns: "Datetime5", Data: varButton("LastReminderDate", "Last Reminder Date") },
  { Per: "0", Columns: "Text37", Data: varButton("ExpiryNotes", "Expiry Notes") },
  { Per: "0", Columns: "Text38", Data: varButton("ProfileMissingFlag", "Profile Missing Flag") },
  { Per: "0", Columns: "Text39", Data: varButton("ProfileVerificationStatus", "Profile Verification Status") },
  { Per: "0", Columns: "Text40", Data: varButton("EmployeeReferenceUsed", "Employee Reference Used") },
  { Per: "0", Columns: "Text41", Data: varButton("OverQuotaAttemptFlag", "Over Quota Attempt Flag") }
];

const usageRecordMappings = [
  { Per: "0", Columns: "Title", Data: varButton("ApplicationNo", "Application No.") },
  { Per: "0", Columns: "Text1", Data: varButton("ApplicationNo", "Application No.") },
  { Per: "0", Columns: "Text2", Data: varButton("ApplicantEmployeeID", "Applicant Employee ID") },
  { Per: "0", Columns: "Text3", Data: varButton("ApplicantEmployeeName", "Applicant Name") },
  { Per: "0", Columns: "Text4", Data: varButton("QuotaCycleKey", "Quota Cycle Key") },
  { Per: "0", Columns: "Decimal2", Data: varButton("QuotaCycleNo", "Quota Cycle No.") },
  { Per: "0", Columns: "Text5", Data: varButton("ProductSummary", "Product Summary") },
  { Per: "0", Columns: "Text6", Data: varButton("HasCustomPackageProduct", "Has Custom Package Product") },
  { Per: "0", Columns: "Decimal1", Data: varButton("TotalApplicationAmount", "Total Application Amount") },
  { Per: "0", Columns: "Decimal3", Data: varButton("TotalApplicationAmount", "Total Application Amount") },
  { Per: "0", Columns: "Text7", Data: "In Progress" },
  { Per: "0", Columns: "Text8", Data: "Quota occupied on submission for family application v3." },
  { Per: "0", Columns: "Text9", Data: varButton("ApplicationNo", "Application No.") },
  { Per: "0", Columns: "Text10", Data: "Submitted" },
  { Per: "0", Columns: "Text11", Data: varButton("HRVerificationFlag", "HR Verification Flag") },
  { Per: "0", Columns: "Text12", Data: varButton("HRVerificationNotes", "HR Verification Notes") },
  { Per: "0", Columns: "Text13", Data: "Not Returned" },
  { Per: "0", Columns: "Decimal4", Data: varButton("ApprovedQuotaAdjustmentAmount", "Approved Quota Adjustment Amount") }
];

const approveUsageMappings = [
  { Per: "0", Columns: "Decimal3", Data: varButton("TotalApplicationAmount", "Total Application Amount") },
  { Per: "0", Columns: "Text7", Data: "Approved" },
  { Per: "0", Columns: "Text10", Data: "Approved" },
  { Per: "0", Columns: "Text13", Data: "Not Returned" },
  { Per: "0", Columns: "Text8", Data: "Family quota usage confirmed after final approval." }
];

const releaseUsageMappings = [
  { Per: "0", Columns: "Decimal3", Data: 0 },
  { Per: "0", Columns: "Text7", Data: "Released" },
  { Per: "0", Columns: "Text10", Data: "Rejected" },
  { Per: "0", Columns: "Text13", Data: "Not Returned" },
  { Per: "0", Columns: "Text8", Data: "Family quota occupation released after workflow rejection." }
];

const returnUsageMappings = [
  { Per: "0", Columns: "Text7", Data: "In Progress" },
  { Per: "0", Columns: "Text10", Data: "Returned" },
  { Per: "0", Columns: "Text13", Data: "Occupied While Returned" },
  { Per: "0", Columns: "Text8", Data: "Request returned for applicant correction; quota remains occupied and the same usage row continues." }
];

const usageCorrelationWheres = [
  { key: "efi-where-usage-app", pre: "and", left: "Text1", op: "0", right: varButton("ApplicationNo", "Application No."), showCus: true },
  { key: "efi-where-usage-employee", pre: "and", left: "Text2", op: "0", right: varButton("ApplicantEmployeeID", "Applicant Employee ID"), showCus: true },
  { key: "efi-where-usage-cycle", pre: "and", left: "Text4", op: "0", right: varButton("QuotaCycleKey", "Quota Cycle Key"), showCus: true }
];

def.childshapes = [
  workflowNode(startNodeId, "StartNoneEvent", { name: "Start", taskurl: def.pageurls[0].id, TaskUrl: def.pageurls[0].id }, { x: -80, y: 100 }, [], [flowStartSet]),
  workflowNode(setNodeId, "SetVariableTask", {
    name: "Set Application No. and Submitted Status",
    formtype: "current",
    variablesetting: [
      { key: "efi-set-application-no", prop: null, id: "ApplicationNo", name: "Application No.", type: "text", value: `<input type="button" data="\${&quot;type&quot;:&quot;application&quot;,&quot;prop&quot;:&quot;FlowNo&quot;}" expr="__" tabindex="-1" value="Tracking No.">` },
      { key: "efi-set-status", prop: null, id: "ApplicationStatus", name: "Application Status", type: "text", value: "Submitted" },
      { key: "efi-set-current-status", prop: null, id: "CurrentStatus", name: "Current Status", type: "text", value: "Submitted" },
      { key: "efi-set-submitted-by", prop: null, id: "SubmittedBy", name: "Submitted By", type: "text", value: `<input type="button" data="\${&quot;type&quot;:&quot;application&quot;,&quot;prop&quot;:&quot;Creator&quot;}" expr="__" tabindex="-1" value="Context:Creator">` },
      { key: "efi-set-submitted-time", prop: null, id: "SubmittedTime", name: "Submitted Time", type: "date", value: `<input type="button" data="\${&quot;type&quot;:&quot;function&quot;,&quot;prop&quot;:&quot;now&quot;}" expr="__" tabindex="-1" value="Function:now">` }
    ]
  }, { x: 150, y: 100 }, [flowStartSet], [flowSetSelfReview, flowSetFamilyUsage]),
  contentListNode(occupyUsageNodeId, "Occupy Family Quota Usage on Submission", usageListId, usageRecordMappings, { x: 400, y: -80 }, [flowSetFamilyUsage], [flowUsageHrReview]),
  workflowNode(hrReviewNodeId, "MultiAssignmentTask", {
    name: "HR Review",
    approveway: "allapprove",
    approvepercentage: 100,
    allowskip: true,
    isallowreassign: false,
    isallowsign: false,
    usertaskassignment: [{ type: "user", method: "expression", value: varButton("RequesterApplicant", "Requester / Applicant"), title: `User:${varButton("RequesterApplicant", "Requester / Applicant")}` }],
    taskurl: def.pageurls[1].id,
    TaskUrl: def.pageurls[1].id,
    duedatedefinition: 48,
    duedatetype: "hour"
  }, { x: 600, y: 100 }, [flowSetSelfReview, flowUsageHrReview, flowResubmitHrReview], [flowHrApprovedStandard, flowHrApprovedFinance, flowHrRejectedSelf, flowHrRejectedFamily, flowHrReturned]),
  workflowNode(financeReviewNodeId, "MultiAssignmentTask", {
    name: "Finance/Benefits Review",
    approveway: "allapprove",
    approvepercentage: 100,
    allowskip: true,
    isallowreassign: false,
    isallowsign: false,
    usertaskassignment: [{ type: "user", method: "expression", value: varButton("RequesterApplicant", "Requester / Applicant"), title: `User:${varButton("RequesterApplicant", "Requester / Applicant")}` }],
    taskurl: financePage.id,
    TaskUrl: financePage.id,
    duedatedefinition: 48,
    duedatetype: "hour"
  }, { x: 850, y: 30 }, [flowHrApprovedFinance], [flowFinanceApproved, flowFinanceRejectedSelf, flowFinanceRejectedFamily, flowFinanceReturned]),
  contentListNode(persistAppNodeId, "Create Implant Application Record", applicationsListId, appRecordMappings, { x: 1100, y: 100 }, [flowHrApprovedStandard, flowFinanceApproved], [flowPersistAppUsageApproved, flowPersistAppEnd]),
  contentListNode(approveUsageNodeId, "Confirm Family Quota Usage on Approval", usageListId, approveUsageMappings, { x: 1350, y: 20 }, [flowPersistAppUsageApproved], [flowApproveUsageEnd], { type: "edit", wheres: usageCorrelationWheres }),
  contentListNode(returnUsageNodeId, "Keep Family Quota Occupied While Returned", usageListId, returnUsageMappings, { x: 900, y: 270 }, [flowHrReturned, flowFinanceReturned], [flowReturnUsageCorrection], { type: "edit", wheres: usageCorrelationWheres }),
  workflowNode(correctionNodeId, "MultiAssignmentTask", {
    name: "Applicant Correction / Resubmission",
    tasktype: "complete",
    approveway: "allapprove",
    approvepercentage: 100,
    allowskip: false,
    isallowreassign: false,
    isallowsign: false,
    usertaskassignment: [{ type: "user", method: "expression", value: varButton("RequesterApplicant", "Requester / Applicant"), title: `User:${varButton("RequesterApplicant", "Requester / Applicant")}` }],
    taskurl: correctionPage.id,
    TaskUrl: correctionPage.id,
    duedatedefinition: 72,
    duedatetype: "hour"
  }, { x: 1120, y: 250 }, [flowReturnUsageCorrection], [flowCorrectionResubmit]),
  workflowNode(setResubmittedNodeId, "SetVariableTask", {
    name: "Set Resubmitted Status",
    formtype: "current",
    variablesetting: [
      { key: "efi-set-resubmitted-status", prop: null, id: "ReturnStatus", name: "Return Status", type: "text", value: "Resubmitted" },
      { key: "efi-set-app-status-resubmitted", prop: null, id: "ApplicationStatus", name: "Application Status", type: "text", value: "Resubmitted" },
      { key: "efi-set-current-status-resubmitted", prop: null, id: "CurrentStatus", name: "Current Status", type: "text", value: "Resubmitted" },
      { key: "efi-set-resubmission-count", prop: null, id: "ResubmissionCount", name: "Resubmission Count", type: "number", value: `<input type="button" data="\${&quot;type&quot;:&quot;variable&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;ResubmissionCount&quot;}}" expr="__" tabindex="-1" value="Workflow Variables:Resubmission Count">` },
      { key: "efi-set-quota-return-status", prop: null, id: "QuotaUsageStatus", name: "Quota Usage Status", type: "text", value: "In Progress" }
    ]
  }, { x: 1350, y: 250 }, [flowCorrectionResubmit], [flowResubmitHrReview]),
  contentListNode(releaseUsageNodeId, "Release Family Quota Usage on Rejection", usageListId, releaseUsageMappings, { x: 1100, y: 300 }, [flowHrRejectedFamily, flowFinanceRejectedFamily], [flowReleaseUsageEnd], { type: "edit", wheres: usageCorrelationWheres }),
  workflowNode(endNodeId, "EndNoneEvent", { name: "Approved End" }, { x: 1600, y: 100 }, [flowPersistAppEnd, flowApproveUsageEnd], []),
  workflowNode(rejectNodeId, "EndRejectEvent", { name: "Rejected" }, { x: 1350, y: 300 }, [flowHrRejectedSelf, flowFinanceRejectedSelf, flowReleaseUsageEnd], []),
  workflowFlow(flowStartSet, startNodeId, setNodeId, { name: "Start to Set Status" }),
  workflowFlow(flowSetSelfReview, setNodeId, hrReviewNodeId, {
    name: "Self Application to HR Review",
    conditioninfo: [{ key: "efi-cond-self-start", pre: "and", left: varButton("ApplicationType", "Application Type"), op: "s.=", right: "Self" }]
  }),
  workflowFlow(flowSetFamilyUsage, setNodeId, occupyUsageNodeId, {
    name: "Family Application Occupies Quota",
    conditioninfo: [{ key: "efi-cond-family-start", pre: "and", left: varButton("ApplicationType", "Application Type"), op: "s.=", right: "Family" }]
  }),
  workflowFlow(flowUsageHrReview, occupyUsageNodeId, hrReviewNodeId, { name: "Occupied Usage to HR Review" }),
  workflowFlow(flowHrApprovedStandard, hrReviewNodeId, persistAppNodeId, {
    name: "HR Approved - No Finance Required",
    documentation: "Approved",
    conditioninfo: [
      { key: "efi-cond-hr-approved-standard-1", pre: "and", left: taskOutcomeButton(hrReviewNodeId, "HR Review"), op: "s.=", right: outcomeValueButton("Approved") },
      { key: "efi-cond-hr-approved-standard-2", pre: "and", left: varButton("HasCustomPackageProduct", "Has Custom Package Product"), op: "s.=", right: "No" },
      { key: "efi-cond-hr-approved-standard-3", pre: "and", left: varButton("ReturnStatus", "Return Status"), op: "s.!=", right: "Returned to Applicant" }
    ]
  }),
  workflowFlow(flowHrApprovedFinance, hrReviewNodeId, financeReviewNodeId, {
    name: "HR Approved - Finance/Benefits Required or Fallback",
    documentation: "Custom Package, high-value, empty, or unexpected custom flag path",
    conditioninfo: [
      { key: "efi-cond-hr-approved-finance-1", pre: "and", left: taskOutcomeButton(hrReviewNodeId, "HR Review"), op: "s.=", right: outcomeValueButton("Approved") },
      { key: "efi-cond-hr-approved-finance-2", pre: "and", left: varButton("HasCustomPackageProduct", "Has Custom Package Product"), op: "s.!=", right: "No" },
      { key: "efi-cond-hr-approved-finance-3", pre: "and", left: varButton("ReturnStatus", "Return Status"), op: "s.!=", right: "Returned to Applicant" }
    ]
  }),
  workflowFlow(flowHrRejectedSelf, hrReviewNodeId, rejectNodeId, {
    name: "HR Rejected - No Family Usage",
    documentation: "Rejected",
    conditioninfo: [
      { key: "efi-cond-hr-rejected-self-1", pre: "and", left: taskOutcomeButton(hrReviewNodeId, "HR Review"), op: "s.=", right: outcomeValueButton("Rejected") },
      { key: "efi-cond-hr-rejected-self-2", pre: "and", left: varButton("ApplicationType", "Application Type"), op: "s.!=", right: "Family" }
    ]
  }),
  workflowFlow(flowHrRejectedFamily, hrReviewNodeId, releaseUsageNodeId, {
    name: "HR Rejected - Release Family Usage",
    documentation: "Rejected family application releases occupied quota",
    conditioninfo: [
      { key: "efi-cond-hr-rejected-family-1", pre: "and", left: taskOutcomeButton(hrReviewNodeId, "HR Review"), op: "s.=", right: outcomeValueButton("Rejected") },
      { key: "efi-cond-hr-rejected-family-2", pre: "and", left: varButton("ApplicationType", "Application Type"), op: "s.=", right: "Family" }
    ]
  }),
  workflowFlow(flowHrReturned, hrReviewNodeId, returnUsageNodeId, {
    name: "HR Returned - Keep Quota Occupied",
    documentation: "HR uses Return Status = Returned to Applicant and approves the task to route for applicant correction while keeping quota occupied.",
    conditioninfo: [
      { key: "efi-cond-hr-returned-1", pre: "and", left: taskOutcomeButton(hrReviewNodeId, "HR Review"), op: "s.=", right: outcomeValueButton("Approved") },
      { key: "efi-cond-hr-returned-2", pre: "and", left: varButton("ReturnStatus", "Return Status"), op: "s.=", right: "Returned to Applicant" }
    ]
  }),
  workflowFlow(flowFinanceApproved, financeReviewNodeId, persistAppNodeId, {
    name: "Finance/Benefits Approved",
    documentation: "Approved",
    conditioninfo: [
      { key: "efi-cond-finance-approved-1", pre: "and", left: taskOutcomeButton(financeReviewNodeId, "Finance/Benefits Review"), op: "s.=", right: outcomeValueButton("Approved") },
      { key: "efi-cond-finance-approved-2", pre: "and", left: varButton("ReturnStatus", "Return Status"), op: "s.!=", right: "Returned to Applicant" }
    ]
  }),
  workflowFlow(flowFinanceRejectedSelf, financeReviewNodeId, rejectNodeId, {
    name: "Finance/Benefits Rejected - No Family Usage",
    documentation: "Rejected",
    conditioninfo: [
      { key: "efi-cond-finance-rejected-self-1", pre: "and", left: taskOutcomeButton(financeReviewNodeId, "Finance/Benefits Review"), op: "s.=", right: outcomeValueButton("Rejected") },
      { key: "efi-cond-finance-rejected-self-2", pre: "and", left: varButton("ApplicationType", "Application Type"), op: "s.!=", right: "Family" }
    ]
  }),
  workflowFlow(flowFinanceRejectedFamily, financeReviewNodeId, releaseUsageNodeId, {
    name: "Finance/Benefits Rejected - Release Family Usage",
    documentation: "Rejected family application releases occupied quota",
    conditioninfo: [
      { key: "efi-cond-finance-rejected-family-1", pre: "and", left: taskOutcomeButton(financeReviewNodeId, "Finance/Benefits Review"), op: "s.=", right: outcomeValueButton("Rejected") },
      { key: "efi-cond-finance-rejected-family-2", pre: "and", left: varButton("ApplicationType", "Application Type"), op: "s.=", right: "Family" }
    ]
  }),
  workflowFlow(flowFinanceReturned, financeReviewNodeId, returnUsageNodeId, {
    name: "Finance/Benefits Returned - Keep Quota Occupied",
    documentation: "Finance uses Return Status = Returned to Applicant and approves the task to route for applicant correction without releasing or duplicating quota usage.",
    conditioninfo: [
      { key: "efi-cond-finance-returned-1", pre: "and", left: taskOutcomeButton(financeReviewNodeId, "Finance/Benefits Review"), op: "s.=", right: outcomeValueButton("Approved") },
      { key: "efi-cond-finance-returned-2", pre: "and", left: varButton("ReturnStatus", "Return Status"), op: "s.=", right: "Returned to Applicant" }
    ]
  }),
  workflowFlow(flowReturnUsageCorrection, returnUsageNodeId, correctionNodeId, { name: "Returned Request to Applicant Correction" }),
  workflowFlow(flowCorrectionResubmit, correctionNodeId, setResubmittedNodeId, {
    name: "Applicant Resubmits",
    documentation: "Applicant correction task returns to HR Review without creating another Family Quota Usage row.",
    conditioninfo: [{ key: "efi-cond-applicant-resubmitted", pre: "and", left: taskOutcomeButton(correctionNodeId, "Applicant Correction / Resubmission"), op: "s.=", right: outcomeValueButton("Completed") }]
  }),
  workflowFlow(flowResubmitHrReview, setResubmittedNodeId, hrReviewNodeId, { name: "Resubmitted Request to HR Review" }),
  workflowFlow(flowPersistAppUsageApproved, persistAppNodeId, approveUsageNodeId, {
    name: "Family Application Usage Confirmation",
    conditioninfo: [{ key: "efi-cond-family-usage", pre: "and", left: varButton("ApplicationType", "Application Type"), op: "s.=", right: "Family" }]
  }),
  workflowFlow(flowPersistAppEnd, persistAppNodeId, endNodeId, {
    name: "Self Application Record to End",
    conditioninfo: [{ key: "efi-cond-self-no-usage", pre: "and", left: varButton("ApplicationType", "Application Type"), op: "s.=", right: "Self" }]
  }),
  workflowFlow(flowApproveUsageEnd, approveUsageNodeId, endNodeId, { name: "Confirmed Usage to End" }),
  workflowFlow(flowReleaseUsageEnd, releaseUsageNodeId, rejectNodeId, { name: "Released Usage to Rejected End" })
];

form.DefResource = JSON.stringify(def);
data.Forms = [form];

app.Title = "Employee & Family Implant Application Management v3";
app.Description = "Employee Family Implant v3 final full-function clone with advanced HR operations dashboards, export-ready views, hybrid routing configuration, expiry monitoring, quota adjustment audit, employee reference fallback, attachment verification, and v1/v2 runtime baseline preservation.";
app.IconUrl = iconUrl;
app.MainListType = 1024;
app.AppID = appId;
app.FormKeys = [formKey];
app.Data = JSON.stringify(data);
app.ReportIds = dashboardReportIds;
app.ReplaceIds = [
  rootId,
  dashboardId,
  hrDashboardId,
  productListId,
  quotaListId,
  attachmentRulesListId,
  applicationsListId,
  usageListId,
  routingRulesListId,
  quotaAdjustmentsListId,
  employeeReferenceListId,
  financeHistoryListId,
  processId,
  formKey,
  ...[product, quota, attachmentRules, applications, usage, routingRules, quotaAdjustments, employeeReference, financeHistory].flatMap((entry) => [
    ...entry.fields.map((field) => field.FieldID),
    ...entry.list.Layouts.map((layout) => layout.LayoutID),
    ...Object.keys(entry.list.ListDatas || {})
  ])
].filter((value, index, all) => value && all.indexOf(value) === index);

fs.writeFileSync(outAppPath, `${JSON.stringify(app, null, 2)}\n`);
fs.writeFileSync(outFormDefPath, `${JSON.stringify(def, null, 2)}\n`);
fs.writeFileSync(outReportPath, `${JSON.stringify({
  generatedAt,
  appName: app.Title,
  idFamily: `${family}...`,
  flowKey: formKey,
  formListId: 0,
  sourceBaseline: sourcePath,
  resources: {
    dashboards: ["Home", "HR Operations"],
    dataLists: ["Product Master", "Annual Quota Configuration", "Attachment Requirement Rules", "Implant Applications", "Family Quota Usage", "Workflow Routing Rules", "Family Quota Adjustments", "Employee Reference", "Finance Review History"],
    approvalForms: ["Implant Application Request"]
  },
  v3Scope: {
    requesterApplicantModel: "RequesterApplicant is required and defaults to Current User on a new request. It remains editable for proxy submission; when changed, the applicant snapshot/quota initialization action reruns from RequesterApplicant.",
    workflow: "Submit -> family quota occupation on submission -> HR Review -> Finance/Benefits Review for Custom Package requests -> Approved/Rejected. HR and Finance can return to Applicant Correction / Resubmission; resubmission routes back to HR Review without creating another Family Quota Usage row. Workflow Routing Rules are generated as active configuration records, but stable workflow branches remain the runtime-safe fallback.",
    dashboard: "Home and HR Operations dashboards include Summary KPI controls, real chart controls, and data-bound queue/report tables. Chart runtime validation requires representative source data; empty charts are treated as no-data states, not structural failures.",
    quota: "Family quota query/check action includes existing Family Quota Usage plus approved signed Family Quota Adjustment records where local validation passes. Remaining quota is Annual Quota + Approved Adjustments - Prior Usage - Current Request.",
    attachments: "Submission is allowed with missing or uncertain attachments. HR Review has attachment verification status, missing attachment flag, HR notes, and return/reject options for insufficient evidence. Attachment Requirement Rules remain scenario-driven.",
    persistence: "Implant Applications ContentList persistence is included. Family Quota Usage is created on family submission with status In Progress, updated to Approved or Released through ContentList edit, and remains occupied while returned. Finance Review History is available as an export-ready list; workflow-created history remains a runtime proof item.",
    v3Administration: "Navigation includes Product Master, Annual Quota Configuration, Attachment Requirement Rules, Workflow Routing Rules, Quota Adjustment Records, Employee Reference, Finance Review History, Family Quota Usage, and Implant Applications."
  },
  limitations: [
    "Requester-based getUserAttr(RequesterApplicant, ...) expressions are generated with the export-backed direct attribute descriptor shape; runtime testing must prove this variable subject works in the target approval-form context.",
    "RequesterApplicant change refresh uses identity-picker attrs.control_event_rule to rerun applicant snapshot/quota logic when a proxy applicant is selected; this trigger must be runtime-tested.",
    "One-year boarding eligibility uses dateDiff(ApplicantBoardingDate, now(), \"year\", []) to set Applicant Boarding Years; if tenant profile data is missing or date arithmetic fails, route to HR verification instead of granting quota.",
    "If requester-based profile expressions fail at runtime, keep RequesterApplicant fixed and route missing snapshot data to HR verification; never switch applicant logic to the task viewer's Current User.",
    "Return/Resubmission uses a workflow Returned outcome and must be runtime-tested because task-outcome availability is tenant/designer-sensitive.",
    "Strict initial attachment blocking is intentionally not included; v3 flags missing or uncertain attachments for HR Review.",
    "Family Quota Usage return/approval/release uses workflow ContentList edit and must be runtime-tested; if edit is not safe in the tenant, HR must manually correct usage status and a focused learning task should be created.",
    "Dashboard chart controls are included because pie, column, and line chart models are proven when representative source records exist. A chart with no matching rows should be documented as a no-data state, not as an invalid chart model."
  ],
  localValidation: {
    status: "pending",
    note: "Updated after local validation commands run."
  },
  runtimeValidation: {
    status: "not_started",
    target: "https://<yourdomain>.yeeflow.com",
    note: "Do not claim final runtime baseline until import and v1/v2 regression plus v3 scope tests pass."
  }
}, null, 2)}\n`);
fs.writeFileSync(outBaselineDocPath, `# Employee Family Implant v3 Generated Baseline

Generated: ${generatedAt}

## Package

- App definition: \`${outAppPath}\`
- Approval form definition: \`${outFormDefPath}\`
- Runtime report: \`${outReportPath}\`
- Wrapper package: \`employee-family-implant.v3.yap\` after wrapper build
- FlowKey: \`${formKey}\`
- ID family: \`${family}...\`
- App-packaged form ListID: \`0\`

## Baseline preserved

V3 preserves the accepted v1/v2 requester/applicant behavior, readonly applicant snapshot, product sublist lookup/autofill, row subtotal, total amount, family quota check, prior usage aggregation, over-quota guard, usage create/update/release, HR Review, Finance/Benefits Review, return/resubmission, no duplicate usage on resubmission, and Implant Applications / Family Quota Usage persistence.

## V3 additions

- Advanced Home and HR Operations dashboard surfaces implemented with real Summary controls, chart controls, and data-bound queue/report tables.
- Export-ready views for applications, department/status/applicant reporting, custom package requests, return/resubmission, attachment exceptions, expiry exceptions, released/rejected usage, quota adjustments, and finance review history.
- Active Workflow Routing Rules list with hybrid configuration guidance.
- Manager Review status/configuration fields with fallback-to-HR behavior because dynamic requester line-manager assignment remains runtime-unproven.
- Expiry fields and HR exception monitoring for returned/rejected requests using a 30-day policy model; no fake scheduler is generated.
- Scenario-driven attachment rules and HR verification enforcement.
- Family Quota Adjustments list and approved adjustment query/sum path.
- Employee Reference fallback list for profile missing / HR verification cases.
- Finance Review History list for export-ready finance audit.
- Additional audit/lifecycle fields on Implant Applications.

## Runtime limitations to verify

- Requester-based profile expressions.
- Identity picker change event refresh.
- Family Quota Adjustment query/sum inclusion.
- Workflow ContentList edit paths for usage approval/release/return.
- Return/resubmission outcome behavior.
- Dynamic scheduler and dynamic manager assignment are not claimed as implemented; v3 uses documented safe fallbacks.
- Dashboard charts require representative source records during runtime validation. Empty charts are no-data states; only a chart model-load failure after valid source data exists should be treated as a chart defect.

## Validation status

Local validation and runtime import/testing results are recorded in \`${outReportPath}\` after checks run.
`);

console.log(`Wrote ${outAppPath}`);
console.log(`Wrote ${outFormDefPath}`);
console.log(`Wrote ${outReportPath}`);
console.log(`Wrote ${outBaselineDocPath}`);

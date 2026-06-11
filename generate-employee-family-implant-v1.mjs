import fs from "node:fs";
import crypto from "node:crypto";

const sourcePath = "design-system-request-tracker-app-def.v1.json";
const specPath = "employee-family-implant-app-spec.json";
const outAppPath = "employee-family-implant-app-def.v1.json";
const outFormDefPath = "employee-family-implant-approval-form-def.v1.json";
const outReportPath = "employee-family-implant-generation-report.v1.json";

const family = "644";
const generatedAt = "2026-05-17 23:58:00";
const appId = 41;
const tenantId = "1697103066096734208";
const userId = "1697103066163843073";
const rootId = `${family}0010000000000000`;
const dashboardId = `${family}0010000000000001`;
const formKey = "EIQ";
const processId = `${family}0020000000000001`;
const productSelectionListRefId = `${processId}-listref-product-selection-items`;
const productListId = `${family}1010000000001000`;
const quotaListId = `${family}1020000000001000`;
const attachmentRulesListId = `${family}1030000000001000`;
const applicationsListId = `${family}1040000000001000`;
const usageListId = `${family}1050000000001000`;
const iconUrl = JSON.stringify({ b: "#E6F0FF", i: "fa-regular fa-heart", c: "#0065FF" });

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
const app = JSON.parse(JSON.stringify(source).replaceAll("427", family).replaceAll("DSX", formKey).replaceAll("dsv-", "eia-"));
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
  ["Text16", "Required Attachments", "RequiredAttachmentSummary", "Text", "textarea", { edit: { textarea_minrows: 3 }, placeholder: "Required attachments" }]
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
  ["Datetime1", "Submitted Time", "SubmittedTime", "Datetime", "datepicker", { showtime: true, date_type: "0", dateformat: "0" }],
  ["Datetime2", "Approved Time", "ApprovedTime", "Datetime", "datepicker", { showtime: true, date_type: "0", dateformat: "0" }],
  ["Datetime3", "Released Time", "ReleasedTime", "Datetime", "datepicker", { showtime: true, date_type: "0", dateformat: "0" }]
]);

data.Childs = [product.list, quota.list, attachmentRules.list, applications.list, usage.list];

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
            heading("Employee & Family Implant", "Dashboard title", "h2-bold"),
            text("<p>Submit implant applications, maintain products and quotas, and review family usage records.</p>", "Dashboard description")
          ]),
          container("Quick status cards", { style: { gap: [null, "--sp--s200"], direction: [null, "row"] } }, [
            kpiCard("My Submitted Requests", "0", "--c--primary", "KPI My Submitted Requests"),
            kpiCard("Pending Review", "0", "--c--warning", "KPI Pending Review"),
            kpiCard("Approved Requests", "0", "--c--success", "KPI Approved Requests"),
            kpiCard("Rejected Requests", "0", "--c--danger", "KPI Rejected Requests")
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
            text("<p>Self applications do not require family quota validation. Family applications require annual quota and eligibility checks. Attachments may be required depending on application and product type.</p>", "Guidance body")
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
    exts: [],
    actions: []
  };
}

data.Item.ListModel.ListID = rootId;
data.Item.ListModel.Title = "Employee & Family Implant Application Management";
data.Item.ListModel.Description = spec.app.purpose;
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
data.Item.Layouts[0].LayoutInResources = [{ ID: dashboardId, RefId: dashboardId, Resource: JSON.stringify(dashboardPage()) }];
data.Item.ListModel.LayoutView = JSON.stringify({
  add: "default",
  edit: "default",
  view: "default",
  sort: [
    { AppID: appId, ListID: dashboardId, ListSetID: rootId, Type: 103, Title: "Home", Icon: "fa-regular fa-house", DisplayName: "Home" },
    { AppID: "41", Title: "Submit Implant Application", ListID: formKey, ListSetID: rootId, Type: 105, Icon: "fa-regular fa-paper-plane" },
    { AppID: appId, ListID: applicationsListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Implant Applications", Icon: "fa-regular fa-list-check" },
    { AppID: appId, ListID: usageListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Family Quota Usage", Icon: "fa-regular fa-chart-bar" },
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
  ["ApplicationStatus", "Application Status", "text"],
  ["Remarks", "Remarks", "text"],
  ["HRComments", "HR Comments", "text"],
  ["FinanceComments", "Finance Comments", "text"]
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
  const reviewControls = review ? [
    approvalControl("HRComments", "HRComments", "textarea", "HR Comments", { edit: { textarea_minrows: 3 }, placeholder: "Add HR review notes" }, false, pageKey),
    approvalControl("FinanceComments", "FinanceComments", "textarea", "Finance Review Comments", { edit: { textarea_minrows: 3 }, placeholder: "Optional finance review notes" }, false, pageKey)
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
            section("Attachments", "Attachments section", [
              text(attachmentGuidanceHtml, "Attachment matrix guidance"),
              fileUploadControl("RequiredAttachments", "Required Attachments", pageKey, review)
            ]),
            section(review ? "Review Notes" : "Remarks", "Remarks section", [
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
const financePage = clone(def.pageurls[1]);
financePage.id = uuid();
financePage.title = "Finance/Benefits Review";
financePage.type = 2;
financePage.formdef = makeApprovalPage("Finance/Benefits Review", true, "finance");
financePage.formdef.id = financePage.id;
def.pageurls = [def.pageurls[0], def.pageurls[1], financePage];

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
  const attachmentSummary = workflowVarToken("RequiredAttachmentSummary", "Required Attachment Summary", "text");
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
          [attachmentScenarioProductType, attachmentScenarioProductTypeExpression]
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
          [attachmentScenarioProductType, attachmentScenarioProductTypeExpression]
        ]),
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
        {
          type: "setvar",
          name: "Calculate remaining quota after this request",
          attrs: {
            setvar_var: remainingQuotaAfter,
            setvar_val: [annualQuotaAmount, { type: "op", op: "-" }, usedQuotaBefore, { type: "op", op: "-" }, appAmount]
          }
        },
        multiSetStep("Set quota guard flags", [
          [quotaExceeded, [{ type: "func", func: "iif", params: [[remainingQuotaAfter, { type: "op", op: "<" }, { type: "num", value: 0 }], [{ type: "str", value: "Yes" }], [{ type: "str", value: "No" }]] }]],
          [quotaStatus, [{ type: "func", func: "iif", params: [[workflowVarToken("ApplicationType", "Application Type", "text"), { type: "op", op: "==" }, { type: "str", value: "Family" }], literalString("In Progress"), literalString("Not Applicable")] }]]
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
            confirm_qs: literalString("Family quota appears to be exceeded. Submission is blocked for v1; please adjust product rows or ask HR to verify quota/profile data."),
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
def.pageurls[1].formdef.actions = [];
financePage.formdef.actions = [];
def.variables.tempVars = [
  { idx: "efi-temp-total-query-items", id: "var_TotalQueryItems", type: "number" },
  { idx: "efi-temp-active-usage-collection", id: "var_ActiveUsageAmountCollection", type: "text" },
  { idx: "efi-temp-usage-in-progress-collection", id: "var_InProgressUsageAmountCollection", type: "text" },
  { idx: "efi-temp-usage-occupied-collection", id: "var_OccupiedUsageAmountCollection", type: "text" },
  { idx: "efi-temp-usage-approved-collection", id: "var_ApprovedUsageAmountCollection", type: "text" },
  { idx: "efi-temp-usage-confirmed-collection", id: "var_ConfirmedUsageAmountCollection", type: "text" },
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
  { Per: "0", Columns: "Text16", Data: varButton("RequiredAttachmentSummary", "Required Attachment Summary") }
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
  { Per: "0", Columns: "Text8", Data: "Quota occupied on submission for family application v1." },
  { Per: "0", Columns: "Text9", Data: varButton("ApplicationNo", "Application No.") },
  { Per: "0", Columns: "Text10", Data: "Submitted" }
];

const approveUsageMappings = [
  { Per: "0", Columns: "Decimal3", Data: varButton("TotalApplicationAmount", "Total Application Amount") },
  { Per: "0", Columns: "Text7", Data: "Approved" },
  { Per: "0", Columns: "Text10", Data: "Approved" },
  { Per: "0", Columns: "Text8", Data: "Family quota usage confirmed after final approval." }
];

const releaseUsageMappings = [
  { Per: "0", Columns: "Decimal3", Data: 0 },
  { Per: "0", Columns: "Text7", Data: "Released" },
  { Per: "0", Columns: "Text10", Data: "Rejected" },
  { Per: "0", Columns: "Text8", Data: "Family quota occupation released after workflow rejection." }
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
      { key: "efi-set-status", prop: null, id: "ApplicationStatus", name: "Application Status", type: "text", value: "Submitted" }
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
  }, { x: 600, y: 100 }, [flowSetSelfReview, flowUsageHrReview], [flowHrApprovedStandard, flowHrApprovedFinance, flowHrRejectedSelf, flowHrRejectedFamily]),
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
  }, { x: 850, y: 30 }, [flowHrApprovedFinance], [flowFinanceApproved, flowFinanceRejectedSelf, flowFinanceRejectedFamily]),
  contentListNode(persistAppNodeId, "Create Implant Application Record", applicationsListId, appRecordMappings, { x: 1100, y: 100 }, [flowHrApprovedStandard, flowFinanceApproved], [flowPersistAppUsageApproved, flowPersistAppEnd]),
  contentListNode(approveUsageNodeId, "Confirm Family Quota Usage on Approval", usageListId, approveUsageMappings, { x: 1350, y: 20 }, [flowPersistAppUsageApproved], [flowApproveUsageEnd], { type: "edit", wheres: usageCorrelationWheres }),
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
      { key: "efi-cond-hr-approved-standard-2", pre: "and", left: varButton("HasCustomPackageProduct", "Has Custom Package Product"), op: "s.=", right: "No" }
    ]
  }),
  workflowFlow(flowHrApprovedFinance, hrReviewNodeId, financeReviewNodeId, {
    name: "HR Approved - Finance/Benefits Required or Fallback",
    documentation: "Custom Package, high-value, empty, or unexpected custom flag path",
    conditioninfo: [
      { key: "efi-cond-hr-approved-finance-1", pre: "and", left: taskOutcomeButton(hrReviewNodeId, "HR Review"), op: "s.=", right: outcomeValueButton("Approved") },
      { key: "efi-cond-hr-approved-finance-2", pre: "and", left: varButton("HasCustomPackageProduct", "Has Custom Package Product"), op: "s.!=", right: "No" }
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
  workflowFlow(flowFinanceApproved, financeReviewNodeId, persistAppNodeId, {
    name: "Finance/Benefits Approved",
    documentation: "Approved",
    conditioninfo: [{ key: "efi-cond-finance-approved", pre: "and", left: taskOutcomeButton(financeReviewNodeId, "Finance/Benefits Review"), op: "s.=", right: outcomeValueButton("Approved") }]
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

app.Title = "Employee & Family Implant Application Management";
app.Description = spec.app.purpose;
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
  quotaListId,
  attachmentRulesListId,
  applicationsListId,
  usageListId,
  processId,
  formKey,
  ...[product, quota, attachmentRules, applications, usage].flatMap((entry) => [
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
    dashboards: ["Home"],
    dataLists: ["Product Master", "Annual Quota Configuration", "Attachment Requirement Rules", "Implant Applications", "Family Quota Usage"],
    approvalForms: ["Implant Application Request"]
  },
  v1Scope: {
    requesterApplicantModel: "RequesterApplicant is required and defaults to Current User on a new request. It remains editable for proxy submission; when changed, the applicant snapshot/quota initialization action reruns from RequesterApplicant.",
    workflow: "Submit -> family quota occupation on submission -> HR Review -> Finance/Benefits Review for Custom Package Product or fallback -> Approved/Rejected. Standard Product can approve after HR Review.",
    dashboard: "Simple low-risk Home dashboard included; HR Operations Dashboard deferred to v2.",
    quota: "Family quota query/check action included with attrs.querydata_filters, arraySum used quota calculation, remaining quota calculation, and one-year boarding eligibility. Applicants boarded within one year receive an effective family annual quota of 0. Family Quota Usage is matched by Applicant Employee ID plus a separate numeric Quota Cycle No. variable and active statuses In Progress/Occupied/Approved/Confirmed. The Quota Cycle No. is mapped from Applicant Boarding Years for the employee-anniversary v1 policy.",
    attachments: "Confirmed v1 attachment matrix is loaded from Attachment Requirement Rules into visible guidance with upload control; strict blocking remains runtime-safe only, with HR verification fallback.",
    persistence: "Implant Applications ContentList persistence is included. Family Quota Usage is created on family submission with status In Progress, then updated to Approved or Released through ContentList edit when runtime-safe."
  },
  limitations: [
    "Requester-based getUserAttr(RequesterApplicant, ...) expressions are generated with the export-backed direct attribute descriptor shape; runtime testing must prove this variable subject works in the target approval-form context.",
    "RequesterApplicant change refresh uses identity-picker attrs.control_event_rule to rerun applicant snapshot/quota logic when a proxy applicant is selected; this trigger must be runtime-tested.",
    "One-year boarding eligibility uses dateDiff(ApplicantBoardingDate, now(), \"year\", []) to set Applicant Boarding Years; if tenant profile data is missing or date arithmetic fails, route to HR verification instead of granting quota.",
    "If requester-based profile expressions fail at runtime, keep RequesterApplicant fixed and route missing snapshot data to HR verification; never switch applicant logic to the task viewer's Current User.",
    "High-amount Finance/Benefits routing threshold is not business-confirmed; v1 routes Custom Package Product through Finance/Benefits and documents amount-threshold routing as a follow-up configuration.",
    "Strict attachment blocking is only enabled if runtime-safe; v1 routes incomplete or uncertain attachment cases to HR verification.",
    "Family Quota Usage update/release uses workflow ContentList edit and must be runtime-tested; if edit is not safe in the tenant, HR must manually release the in-progress usage and a focused learning task should be created."
  ]
}, null, 2)}\n`);

console.log(`Wrote ${outAppPath}`);
console.log(`Wrote ${outFormDefPath}`);
console.log(`Wrote ${outReportPath}`);

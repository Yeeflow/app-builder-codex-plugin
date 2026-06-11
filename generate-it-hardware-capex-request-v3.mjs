import fs from "node:fs";
import crypto from "node:crypto";

const sourcePath = "design-system-request-tracker-app-def.v1.json";
const outAppPath = "it-hardware-capex-request-app-def.v4-text-standard.json";
const outFormDefPath = "it-hardware-capex-request-approval-form-def.v4-text-standard.json";
const outListDefPath = "it-hardware-capex-request-list-def.v4-text-standard.json";
const outReportPath = "it-hardware-capex-request-generation-report.v4-text-standard.json";

const family = "447";
const generatedAt = "2026-05-14 23:35:00";
const appId = 41;
const tenantId = "1697103066096734208";
const userId = "1697103066163843073";
const rootId = `${family}0010000000000000`;
const dashboardId = `${family}0010000000000001`;
const requestListId = `${family}0020000000001000`;
const formKey = "CPX4T";
const processId = `${family}0030000000000001`;
const iconUrl = JSON.stringify({ b: "#E6F0FF", i: "fa-regular fa-hard-drive", c: "#0065FF" });

const app = JSON.parse(
  JSON.stringify(JSON.parse(fs.readFileSync(sourcePath, "utf8")))
    .replaceAll("427", family)
    .replaceAll("DSX", formKey)
    .replaceAll("dsv-", "capx4t-")
    .replaceAll("capx3w-", "capx4t-"),
);
const data = JSON.parse(app.Data);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function id(prefix = "capx3") {
  if (prefix === "ctrl") return crypto.randomUUID();
  return `${prefix}-${crypto.randomUUID()}`;
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
  return { id: id("ctrl"), type, label, attrs, children, ...extra };
}

function container(nvLabel, attrs = {}, children = [], extra = {}) {
  return control("container", "Container", attrs, children, { nv_label: nvLabel, ...extra });
}

function inlinePositioning() {
  return { positioning: { widthtype: [null, "2"] } };
}

function headingToken(size) {
  if (typeof size === "string") return [null, size];
  const rawSize = Array.isArray(size?.size) ? Number(size.size[1]) : 16;
  const weight = String(size?.wei ?? "");

  if (rawSize >= 24) return [null, "h4-medium"];
  if (rawSize >= 18 || weight === "600") return [null, "h5-bold"];
  return [null, "s-medium"];
}

function heading(value, nvLabel, size = "h4-medium", color = "var(--c--text)") {
  return control("heading", "Text", {
    headc: { title: { value, variable: null } },
    heads: { ty: headingToken(size), color },
    common: inlinePositioning()
  }, [], { nv_label: nvLabel });
}

function text(value, nvLabel, color = "var(--c--neutral-dark-hover)") {
  return control("text-editor", "Text Editor", {
    value,
    common: { padding: tokenPadding("--sp--s0"), ...inlinePositioning() },
    ty: { size: [null, 14] },
    color
  }, [], { nv_label: nvLabel });
}

function cardCommon(color = "var(--c--background)", radius = 12) {
  return {
    padding: tokenPadding("--sp--s300"),
    background: { normal: { type: "classic", classic: { color } } },
    border: {
      normal: {
        type: "1",
        width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
        color: "var(--c--neutral-light-active)",
        radius: [null, { top: radius, right: radius, bottom: radius, left: radius }]
      }
    }
  };
}

function pageBackground(color = "var(--c--neutral-light)") {
  return { type: "classic", classic: { color } };
}

const optionSets = {
  request_type: ["Laptop", "Desktop", "Server", "Network Device", "Peripheral", "Infrastructure"],
  purchase_reason: ["New Requirement", "Replacement", "Upgrade", "Expansion", "Compliance"],
  urgency_level: ["Low", "Medium", "High", "Critical"],
  budget_type: ["Approved CAPEX", "Project Budget", "Department Budget", "Unbudgeted"],
  funding_source: ["IT CAPEX", "Business Unit CAPEX", "Project Funding", "Shared Services"],
  delivery_method: ["Vendor Delivery", "Courier", "Pickup", "Staged Rollout"],
  compliance_impact: ["Security", "Privacy", "Audit", "Regulatory"],
  rollout_approach: ["Single Site", "Phased Rollout", "Pilot First", "Replacement Window"]
};

const sections = [
  {
    id: "applicant",
    title: "Applicant Information",
    icon: "fa-regular fa-user",
    description: "Requester profile information.",
    fields: [
      ["ApplicantID", "Applicant ID", "input", true],
      ["Email", "Email", "input", true],
      ["LineManager", "Line Manager", "identity-picker", false],
      ["LocationID", "Location", "location-picker", false],
      ["JobTitle", "Job Title", "input", true]
    ]
  },
  {
    id: "overview",
    title: "Request Overview",
    icon: "fa-regular fa-file-lines",
    description: "Basic information about the CAPEX hardware request.",
    fields: [
      ["request_title", "Request Title", "input"],
      ["request_date", "Request Date", "datepicker"],
      ["request_type", "Request Type", "radio"],
      ["purchase_reason", "Purchase Reason", "radio"],
      ["urgency_level", "Urgency Level", "radio"],
      ["is_this_part_of_an_approved_initiative", "Approved Initiative", "switch"],
      ["business_justification", "Business Justification", "richtext", false, true],
      ["expected_business_impact", "Expected Business Impact", "richtext", false, true]
    ]
  },
  {
    id: "hardware",
    title: "Hardware Details",
    icon: "fa-regular fa-hard-drive",
    description: "Detailed hardware request information including requested items.",
    fields: [
      ["item_name", "Item Name", "input"],
      ["brand", "Brand", "input"],
      ["model", "Model", "input"],
      ["quantity", "Quantity", "input_number"],
      ["unit_price", "Unit Price", "currency"],
      ["subtotal", "Sub total", "calculated"],
      ["asset_tag_required", "Asset Tag Required", "switch"],
      ["warranty_required", "Warranty Required", "switch"],
      ["specification", "Specification", "textarea", false, true]
    ]
  },
  {
    id: "financial",
    title: "Financial Assessment",
    icon: "fa-regular fa-circle-dollar-to-slot",
    description: "Budget and financial evaluation of the requested purchase.",
    fields: [
      ["total_estimated_cost", "Total Estimated Cost", "calculated"],
      ["budget_available", "Budget Available", "switch"],
      ["budget_type", "Budget Type", "radio"],
      ["cost_center", "Cost Center", "cost-center-picker"],
      ["funding_source", "Funding Source", "radio"],
      ["multi_year_benefit", "Multi-Year Benefit", "switch"],
      ["expected_useful_life", "Expected Useful Life", "input_number"],
      ["residual_value_estimate", "Residual Value Estimate", "currency"],
      ["budget_justification", "Budget Justification", "textarea", false, true]
    ]
  },
  {
    id: "vendor",
    title: "Vendor and Sourcing",
    icon: "fa-regular fa-cart-shopping",
    description: "Vendor selection and sourcing information.",
    fields: [
      ["preferred_vendor", "Preferred Vendor", "input"],
      ["single_source_procurement", "Single Source Procurement", "switch"],
      ["existing_contract_available", "Existing Contract Available", "switch"],
      ["contract_reference", "Contract Reference", "input"],
      ["lead_time_estimate", "Lead Time Estimate", "input_number"],
      ["delivery_method", "Delivery Method", "radio"],
      ["alternative_vendors_considered", "Alternative Vendors Considered", "textarea", false, true],
      ["single_source_justification", "Single Source Justification", "richtext", false, true]
    ]
  },
  {
    id: "risk",
    title: "Risk and Compliance",
    icon: "fa-regular fa-shield-check",
    description: "Security, compliance, and disposal considerations.",
    fields: [
      ["contains_data_storage", "Contains Data Storage", "switch"],
      ["security_review_required", "Security Review Required", "switch"],
      ["software_installation_needed", "Software Installation Needed", "switch"],
      ["compliance_impact", "Compliance Impact", "checkbox"],
      ["disposal_needed_for_replaced_hardware", "Disposal Needed", "switch"],
      ["security_risk_notes", "Security Risk Notes", "textarea", false, true],
      ["regulatory_justification", "Regulatory Justification", "richtext", false, true],
      ["disposal_plan", "Disposal Plan", "textarea", false, true]
    ]
  },
  {
    id: "delivery",
    title: "Delivery and Deployment",
    icon: "fa-regular fa-box",
    description: "Delivery scheduling and deployment planning details.",
    fields: [
      ["needed_by_date", "Needed By Date", "datepicker"],
      ["delivery_location", "Delivery Location", "location-picker"],
      ["installation_required", "Installation Required", "switch"],
      ["deployment_owner", "Deployment Owner", "identity-picker"],
      ["receiving_contact", "Receiving Contact", "identity-picker"],
      ["rollout_approach", "Rollout Approach", "radio"],
      ["downtime_expected", "Downtime Expected", "switch"],
      ["installation_site_details", "Installation Site Details", "textarea", false, true],
      ["downtime_details", "Downtime Details", "textarea", false, true]
    ]
  },
  {
    id: "documents",
    title: "Supporting Documents",
    icon: "fa-regular fa-clipboard-check",
    description: "Required and optional supporting evidence.",
    fields: [
      ["vendor_quotation", "Vendor Quotation", "file-upload"],
      ["comparative_quote_sheet", "Comparative Quote Sheet", "file-upload"],
      ["technical_specification", "Technical Specification", "file-upload"],
      ["budget_evidence", "Budget Evidence", "file-upload"],
      ["security_review_document", "Security Review Document", "file-upload"],
      ["business_case_document", "Business Case Document", "file-upload"],
      ["supporting_images", "Supporting Images", "icon-upload"]
    ]
  },
  {
    id: "review",
    title: "Review Outcomes",
    icon: "fa-regular fa-diagram-project",
    description: "Comments and decisions recorded by reviewers and approvers.",
    fields: [
      ["manager_comments", "Manager Comments", "textarea", false, true],
      ["it_architecture_comments", "IT Architecture Comments", "textarea", false, true],
      ["it_security_comments", "IT Security Comments", "textarea", false, true],
      ["finance_comments", "Finance Comments", "textarea", false, true],
      ["procurement_comments", "Procurement Comments", "textarea", false, true],
      ["final_approval_notes", "Final Approval Notes", "textarea", false, true]
    ]
  },
  {
    id: "fulfillment",
    title: "Fulfillment Tracking",
    icon: "fa-regular fa-box-open",
    description: "Post-approval procurement, delivery, and handover tracking.",
    fields: [
      ["purchase_order_number", "Purchase Order Number", "input"],
      ["order_date", "Order Date", "datepicker"],
      ["delivery_date", "Delivery Date", "datepicker"],
      ["received_in_good_condition", "Received in Good Condition", "switch"],
      ["asset_registration_completed", "Asset Registration Completed", "switch"],
      ["handover_confirmation", "Handover Confirmation", "signer"],
      ["implementation_completion_notes", "Implementation Completion Notes", "textarea", false, true]
    ]
  }
];

const fieldById = new Map(sections.flatMap((section) => section.fields.map((field) => [field[0], { ...fieldToMeta(field), section: section.title }])));

function fieldToMeta([key, label, controlType, readonly = false, wide = false]) {
  return { key, label, controlType, readonly, wide };
}

const persistFieldIds = [
  "request_title", "request_date", "request_type", "purchase_reason", "urgency_level",
  "item_name", "brand", "model", "quantity", "unit_price", "subtotal",
  "total_estimated_cost", "budget_available", "budget_type", "cost_center", "funding_source",
  "preferred_vendor", "single_source_procurement", "existing_contract_available", "contract_reference",
  "contains_data_storage", "security_review_required", "software_installation_needed", "compliance_impact",
  "needed_by_date", "delivery_location", "installation_required", "deployment_owner", "receiving_contact",
  "purchase_order_number", "received_in_good_condition", "asset_registration_completed"
];

function variableType(controlType) {
  if (["input_number", "currency", "calculated"].includes(controlType)) return "number";
  if (controlType === "switch") return "boolean";
  if (controlType === "datepicker") return "date";
  if (controlType === "file-upload" || controlType === "icon-upload") return "file";
  if (controlType === "identity-picker") return "user";
  return "text";
}

function listFieldShape(controlType) {
  if (["input_number", "currency", "calculated"].includes(controlType)) return ["Decimal", "input_number"];
  if (controlType === "switch") return ["Bit", "switch"];
  if (controlType === "datepicker") return ["Datetime", "datepicker"];
  return ["Text", "input"];
}

let textIndex = 1;
let decimalIndex = 1;
let bitIndex = 1;
let dateIndex = 1;
const persistenceMap = new Map();

function nextFieldName(controlType) {
  const [fieldType] = listFieldShape(controlType);
  if (fieldType === "Decimal") return `Decimal${decimalIndex++}`;
  if (fieldType === "Bit") return `Bit${bitIndex++}`;
  if (fieldType === "Datetime") return `Datetime${dateIndex++}`;
  return `Text${textIndex++}`;
}

function dataListFieldSpecs() {
  const specs = [["Title", "Request No.", "RequestNo", "Text", "input", { required: false, placeholder: "Generated request number" }]];
  for (const key of persistFieldIds) {
    const meta = fieldById.get(key);
    const fieldName = nextFieldName(meta.controlType);
    const [fieldType, type] = listFieldShape(meta.controlType);
    const rules = rulesFor(meta.controlType, meta.label, key, true);
    persistenceMap.set(key, fieldName);
    specs.push([fieldName, meta.label, toInternalName(key), fieldType, type, rules]);
  }
  specs.push(["Text99", "Workflow Status", "WorkflowStatus", "Text", "radio", { choices: ["Draft", "Submitted", "Approved", "Rejected", "In Procurement"], displayStyle: "dropdown", placeholder: "Workflow status" }]);
  specs.push(["Text100", "Created From Workflow", "CreatedFromWorkflow", "Text", "radio", { choices: ["Yes", "No"], displayStyle: "dropdown", placeholder: "Workflow source" }]);
  return specs;
}

function toInternalName(key) {
  return key.replace(/(^|_)([a-z])/g, (_, __, char) => char.toUpperCase()).replace(/[^A-Za-z0-9]/g, "");
}

function rulesFor(controlType, label, key, forList = false) {
  const base = { required: false, placeholder: `Enter ${label.toLowerCase()}` };
  if (controlType === "textarea") return { ...base, edit: { textarea_minrows: 3 }, "input-maxlength": 2000 };
  if (controlType === "richtext") return forList ? { ...base, "input-maxlength": 4000 } : { ...base, edit: { richtext_minheight: 160 } };
  if (controlType === "input_number") return { ...base, displayThousandths: "1", "rounded-to": 0, number_min: 0 };
  if (controlType === "currency") return { ...base, displayThousandths: "1", "rounded-to": 2, number_min: 0, prefix: "USD" };
  if (controlType === "radio") return { ...base, choices: optionSets[key] || ["Option 1", "Option 2", "Option 3"], displayStyle: "dropdown" };
  if (controlType === "checkbox") return { ...base, choices: optionSets[key] || ["Option 1", "Option 2"], displayStyle: "checkbox" };
  if (controlType === "switch") return { ...base, displayStyle: "default" };
  if (controlType === "datepicker") return { ...base, showtime: false, date_type: "0", dateformat: "0" };
  if (controlType === "file-upload") return { ...base, maxCount: 5, ver: 1 };
  if (controlType === "icon-upload") return { controlmultiple: true };
  if (controlType === "location-picker" || controlType === "cost-center-picker") return {};
  if (controlType === "calculated") return {};
  if (controlType === "identity-picker") return { ...base, default: key === "ApplicantID" ? "currentUser" : undefined };
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
    IsFilter: ["Title", "Text1", "Text2", "Text3", "Text99", "Datetime1"].includes(fieldName),
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
  return JSON.stringify({
    layout: fields.slice(0, 16).map((field, index) => ({
      FieldID: field.FieldID,
      FieldName: field.FieldName,
      Mobile: index === 0 ? 2 : 0,
      Order: index,
      Show: ["Title", "Text1", "Text2", "Text3", "Decimal1", "Text99", "Text100"].includes(field.FieldName),
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
  const base = {
    id: id("list-field"),
    type: field.Type,
    label: field.DisplayName,
    binding: field.FieldName,
    displayLabel: [null, true],
    attrs: field.Rules ? JSON.parse(field.Rules) : {},
    nv_label: `${field.DisplayName} field`
  };
  if (readonly) base.readonly = true;
  return base;
}

function makeCustomForm(title, layoutId, fields, readonly = false) {
  const visibleFields = fields.filter((field) => ["Title", "Text1", "Text2", "Text3", "Decimal1", "Decimal2", "Text99", "Text100", "Datetime1"].includes(field.FieldName));
  const formJson = {
    children: [
      container("Main", { style: { gap: [null, "--sp--s0"], direction: [null, "column"], justify_content: [null, "flex-start"], align_items: [null, "center"] } }, [
        container("Content", {
          style: { gap: [null, "--sp--s300"], direction: [null, "column"], justify_content: [null, "flex-start"] },
          common: { padding: tokenPadding("--sp--s300"), background: { normal: { type: "classic", classic: { color: "var(--c--neutral-light)" } } } }
        }, [
          container("Page header", { style: { gap: [null, "--sp--s100"], direction: [null, "column"] } }, [
            heading(title, `${title} heading`, "h4-medium"),
            text(readonly ? "<p>Review the CAPEX request record in readonly form.</p>" : "<p>Maintain the persisted request record using the generated list form.</p>", `${title} helper`)
          ]),
          container(readonly ? "Readonly section" : "Field group", {
            style: { gap: [null, "--sp--s200"], direction: [null, "column"] },
            common: cardCommon()
          }, visibleFields.map((field) => listFieldControl(field, readonly)))
        ])
      ])
    ],
    attrs: { container: { cw: "2", padding: tokenPadding("--sp--s0") }, background: pageBackground() },
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

function dynamicShowRule(controlId, sourceVariable, expected = true) {
  return {
    id: id("display-rule"),
    controlId,
    formulas: [
      { exprType: "variable", valueType: "boolean", id: sourceVariable, type: "expr", name: `Workflow Variables:${fieldById.get(sourceVariable)?.label || sourceVariable}` },
      { type: "op", op: "==" },
      { type: "bool", value: expected }
    ],
    actions: {
      id: id("display-action"),
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

function dynamicAnyShowRule(controlId, sources) {
  const formulas = [];
  sources.forEach((source, index) => {
    if (index > 0) formulas.push({ type: "logic", op: "or" });
    formulas.push(
      { exprType: "variable", valueType: "boolean", id: source, type: "expr", name: `Workflow Variables:${fieldById.get(source)?.label || source}` },
      { type: "op", op: "==" },
      { type: "bool", value: true }
    );
  });
  return {
    id: id("display-rule"),
    controlId,
    formulas,
    actions: {
      id: id("display-action"),
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

const conditionalRules = {
  single_source_justification: (controlId) => dynamicShowRule(controlId, "single_source_procurement"),
  contract_reference: (controlId) => dynamicShowRule(controlId, "existing_contract_available"),
  security_risk_notes: (controlId) => dynamicAnyShowRule(controlId, ["security_review_required", "contains_data_storage"]),
  disposal_plan: (controlId) => dynamicShowRule(controlId, "disposal_needed_for_replaced_hardware"),
  installation_site_details: (controlId) => dynamicShowRule(controlId, "installation_required"),
  downtime_details: (controlId) => dynamicShowRule(controlId, "downtime_expected")
};

function calculatedAttrs(meta) {
  if (meta.key !== "subtotal" && meta.key !== "total_estimated_cost") return {};
  return {
    calculated: [
      { exprType: "variable", valueType: "number", id: "quantity", type: "expr", name: "Workflow Variables:Quantity" },
      { type: "op", op: "*" },
      { exprType: "variable", valueType: "number", id: "unit_price", type: "expr", name: "Workflow Variables:Unit Price" }
    ]
  };
}

function approvalControl(meta, review = false) {
  const attrs = meta.controlType === "calculated" ? calculatedAttrs(meta) : rulesFor(meta.controlType, meta.label, meta.key, false);
  const controlId = `capx3w-control-${meta.key}-${review ? "review" : "submit"}`;
  if (conditionalRules[meta.key] && !review) attrs.control_display = [conditionalRules[meta.key](controlId)];
  const item = {
    id: controlId,
    binding: meta.key,
    type: meta.controlType,
    label: meta.label,
    attrs,
    displayLabel: true,
    nv_label: `${meta.label} control`
  };
  if (review || meta.readonly || meta.controlType === "calculated") item.readonly = true;
  if (meta.key === "ApplicantID") item.value = "CurrentUser";
  return item;
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
    cgap: { "1": 10 },
    cgapU: { "1": "px" }
  }, children, { nv_label: nvLabel, displayLabel: [null, false] });
}

function fieldGrid(section, review = false) {
  const normalFields = section.fields.filter((field) => !fieldById.get(field[0]).wide);
  const wideFields = section.fields.filter((field) => fieldById.get(field[0]).wide);
  const children = [];
  if (normalFields.length) {
    children.push(flexGrid(normalFields.map((field) => approvalControl(fieldById.get(field[0]), review)), `${section.title} field grid`));
  }
  children.push(...wideFields.map((field) => approvalControl(fieldById.get(field[0]), review)));
  return container(`${section.title} fields`, {
    style: { gap: [null, "--sp--s200"], direction: [null, "column"] }
  }, children);
}

function iconBadge(icon, nvLabel) {
  return container(`${nvLabel} badge`, {
    style: {
      widthtype: [null, "3"],
      width: [null, 46],
      height: [null, "2"],
      cushei: [null, 46],
      align_items: [null, "center"],
      justify_content: [null, "center"],
      gap: [null, "--sp--s0"]
    },
    common: {
      border: { normal: { radius: [null, { top: 16, right: 16, bottom: 16, left: 16 }] } },
      background: { normal: { type: "classic", classic: { color: "var(--c--primary-light)" } } },
      container: { size: [null, null] }
    }
  }, [
    control("icon", "Icon", {
      icon: { icon, size: [null, 16], normal: { pcolor: "var(--c--primary)" } },
      style: { color: [null, "var(--c--primary)"] },
      common: inlinePositioning()
    }, [], { nv_label: nvLabel })
  ]);
}

function sectionCard(section, review = false) {
  return container(`${section.title} section`, {
    style: { gap: [null, "--sp--s200"], direction: [null, "column"] },
    common: cardCommon("var(--c--background)", 12)
  }, [
    container(`${section.title} header`, { style: { gap: [null, "--sp--s100"], direction: [null, "row"], align_items: [null, "center"] } }, [
      iconBadge(section.icon, `${section.title} icon`),
      container(`${section.title} title group`, { style: { gap: [null, "--sp--s050"], direction: [null, "column"], widthtype: [null, "2"] } }, [
        heading(section.title, `${section.title} heading`, { size: [null, 18], wei: "600" }),
        text(`<p>${section.description}</p>`, `${section.title} description`)
      ])
    ]),
    fieldGrid(section, review)
  ]);
}

function summaryPanel() {
  return container("Request summary panel", {
    style: { gap: [null, "--sp--s200"], direction: [null, "column"] },
    common: {
      ...cardCommon("var(--c--primary-light)", 12),
      css: "selector\n{\n    background-image: linear-gradient(to right, oklch(0.546 0.245 262.881) 0%, oklch(0.541 0.281 293.009) 100%) !important;\n}",
      ty: { normal: { color: "var(--c--background)" } }
    }
  }, [
    container("Request summary eyebrow row", { style: { gap: [null, "--sp--s100"], direction: [null, "row"], align_items: [null, "center"] } }, [
      heading("CAPEX approval request", "Request summary eyebrow", { size: [null, 14] }, "var(--c--background)")
    ]),
    heading("IT Hardware CAPEX Request", "Request summary title", { size: [null, 28], wei: "600" }, "var(--c--background)"),
    text("<p>Submit, review, approve, procure, receive, and hand over new IT hardware purchases with financial, security, procurement, and fulfillment controls.</p>", "Request summary copy", "var(--c--background)")
  ]);
}

function metric(label, value, nvLabel) {
  return container(nvLabel, {
    style: { gap: [null, "--sp--s050"], direction: [null, "column"] },
    common: cardCommon("var(--c--neutral-light)", 8)
  }, [
    heading(label, `${nvLabel} label`, "s-medium", "var(--c--neutral-dark-hover)"),
    heading(value, `${nvLabel} value`, { size: [null, 18], wei: "600" })
  ]);
}

function requestMetricRow() {
  return container("Request metric row", {
    style: { gap: [null, "--sp--s200"], direction: [null, "row"] },
    common: { padding: tokenPadding("--sp--s250") }
  }, [
    metric("Status", "Draft", "Status metric"),
    metric("Total estimated cost", "Calculated", "Cost metric"),
    metric("Current owner", "Requester", "Owner metric"),
    metric("Next step", "Line Manager Approval", "Next step metric")
  ]);
}

function formHeader() {
  return container("Form header", {
    style: { gap: [null, "--sp--s0"], direction: [null, null], align_items: [null, null], justify_content: [null, null], overflow: [null, "hidden"] },
    common: {
      background: { normal: { type: "classic", classic: { color: "#ffffff" } } },
      border: {
        normal: {
          type: "1",
          width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
          color: "#e7e9eb",
          radius: [null, { top: 12, right: 12, bottom: 12, left: 12 }]
        }
      }
    }
  }, [
    summaryPanel(),
    requestMetricRow()
  ]);
}

function workflowRoutePanel() {
  return container("Workflow route panel", {
    style: { gap: [null, "--sp--s150"], direction: [null, "column"] },
    common: cardCommon("var(--c--background)", 12)
  }, [
    heading("Workflow route", "Workflow route heading", "h5-bold"),
    text("<p>Line Manager Approval -> IT Architecture Review -> IT Security Review -> Finance Approval -> Procurement Review -> Procurement Processing -> Goods Receipt and Asset Registration -> Requester Confirmation.</p>", "Workflow route copy")
  ]);
}

function routingControlsPanel() {
  return container("Routing controls panel", {
    style: { gap: [null, "--sp--s150"], direction: [null, "column"] },
    common: cardCommon("var(--c--background)", 12)
  }, [
    heading("Routing controls", "Routing controls heading", "h5-bold"),
    text("<p>Conditional review routing is documented for v2. This v1 keeps the generated workflow linear so import, form rendering, approval pages, and ContentList persistence can be proven first.</p>", "Routing controls copy")
  ]);
}

function makeApprovalPage(title, review = false) {
  const businessSections = review ? sections.filter((section) => section.id !== "documents") : sections;
  const bodyChildren = review
    ? [summaryPanel(), workflowRoutePanel(), routingControlsPanel(), ...businessSections.map((section) => sectionCard(section, review))]
    : [formHeader(), container("Form content", { style: { gap: [null, "--sp--s300"], direction: [null, "column"] } }, [
      workflowRoutePanel(),
      routingControlsPanel(),
      ...businessSections.map((section) => sectionCard(section, review))
    ])];
  return {
    children: [
      container("Main", { style: { gap: [null, "--sp--s0"], direction: [null, "column"], justify_content: [null, "flex-start"], align_items: [null, "center"] } }, [
        container("Content", {
          style: { gap: [null, "--sp--s300"], direction: [null, "column"], justify_content: [null, "flex-start"] },
          common: { padding: tokenPadding("--sp--s300"), background: { normal: { type: "classic", classic: { color: "var(--c--neutral-light)" } } } }
        }, [
          container("Form body", {
            style: { gap: [null, "--sp--s300"], direction: [null, "column"] },
            common: { padding: tokenPadding("--sp--s0") }
          }, bodyChildren),
          container("Form bottom", { style: { gap: [null, "--sp--s200"], direction: [null, "column"] } }, [
            { id: `capx3w-control-panel-${review ? "review" : "submit"}`, type: "workflowControlPanel", label: "Action Panel", attrs: { "show-task-panel": true, rejectValidation: true, align: "center" }, nv_label: "Action panel" },
            { id: `capx3w-flow-history-${review ? "review" : "submit"}`, type: "workflowHistory", label: "Flow History", attrs: { "show-history": true }, nv_label: "Flow history" }
          ])
        ])
      ])
    ],
    attrs: {
      container: { cw: "2", padding: tokenPadding("--sp--s0") },
      background: pageBackground()
    },
    title,
    pagetype: review ? 2 : 1,
    filterVars: [],
    ver: 2,
    tempVars: []
  };
}

function dynamicField(fieldName, nvLabel, attrs = {}) {
  return control("dynamic-field", "Dynamic field", { source: "3", "obj-f": fieldName, ...attrs }, [], { nv_label: nvLabel });
}

function dashboardPage() {
  const item = container("CAPEX collection item", {
    style: { gap: [null, "--sp--s100"], direction: [null, "column"] },
    common: cardCommon("var(--c--background)", 8)
  }, [
    dynamicField("Title", "Request number", { item_style: { ty: [null, "base-medium"], normal: { color: "var(--c--primary)" } } }),
    dynamicField("Text1", "Request title", { item_style: { ty: [null, "base-regular"], normal: { color: "var(--c--text)" } } }),
    dynamicField("Text99", "Workflow status", { prefix: "Status:", item_style: { ty: [null, "s-medium"], normal: { color: "var(--c--warning-dark)" } } })
  ]);
  const collection = control("collection", "Collection", {
    data: {
      list: { AppID: appId, ListID: requestListId, Type: 1, Title: "IT Hardware CAPEX Requests", ListSetID: rootId },
      limit: false,
      disv: false,
      ps: 6,
      filter: [],
      link: "default",
      op: "new"
    },
    layout: { cg: [null, 24], rg: [null, 24], cp: tokenPadding("--sp--s0") }
  }, [item], { nv_label: "CAPEX request collection" });
  return {
    children: [
      container("Main", { style: { gap: [null, "--sp--s0"], direction: [null, "column"], justify_content: [null, "flex-start"], align_items: [null, "center"] } }, [
        container("Content", {
          style: { gap: [null, "--sp--s300"], direction: [null, "column"], justify_content: [null, "flex-start"] },
          common: { padding: tokenPadding("--sp--s300"), background: { normal: { type: "classic", classic: { color: "var(--c--neutral-light)" } } } }
        }, [
          summaryPanel(),
          container("Recent CAPEX requests", { style: { gap: [null, "--sp--s200"], direction: [null, "column"] } }, [
            heading("Recent CAPEX requests", "Recent CAPEX requests heading", "h4-medium"),
            collection
          ])
        ])
      ])
    ],
    attrs: { hideHeaderAll: true, container: { padding: tokenPadding("--sp--s0") }, background: pageBackground() },
    title: "Overview",
    ver: 2,
    filterVars: [],
    tempVars: [],
    exts: [],
    actions: []
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

function taskNode(taskId, name, taskUrl, incoming, approvedFlow, rejectedFlow, x, y, complete = false) {
  return workflowNode(taskId, "MultiAssignmentTask", {
    name,
    approveway: "allapprove",
    approvepercentage: 100,
    allowskip: true,
    isallowreassign: false,
    isallowsign: false,
    usertaskassignment: [{ type: "user", method: "expression", value: varButton("ApplicantID", "Applicant ID"), title: `User:${varButton("ApplicantID", "Applicant ID")}` }],
    taskurl: taskUrl,
    TaskUrl: taskUrl,
    tasktype: complete ? "complete" : "approve",
    duedatedefinition: 48,
    duedatetype: "hour"
  }, { x, y }, [incoming], [approvedFlow, ...(rejectedFlow ? [rejectedFlow] : [])]);
}

function buildWorkflow(def) {
  const startNode = "capx3w-node-start-0001";
  const submitNode = "capx3w-node-request-submission-0002";
  const setNode = "capx3w-node-set-0003";
  const taskIds = [
    [submitNode, "Request Submission", false, def.pageurls[1].id],
    ["capx3w-node-manager-0004", "Line Manager Approval", false, def.pageurls[1].id],
    ["capx3w-node-architecture-0005", "IT Architecture Review", false, def.pageurls[1].id],
    ["capx3w-node-security-0006", "IT Security Review", false, def.pageurls[1].id],
    ["capx3w-node-finance-0007", "Finance Approval", false, def.pageurls[1].id],
    ["capx3w-node-procurement-review-0008", "Procurement Review", false, def.pageurls[1].id],
    ["capx3w-node-procurement-processing-0009", "Procurement Processing", true, def.pageurls[1].id],
    ["capx3w-node-goods-receipt-0010", "Goods Receipt and Asset Registration", true, def.pageurls[1].id],
    ["capx3w-node-requester-confirmation-0011", "Requester Confirmation", true, def.pageurls[1].id]
  ];
  const contentNode = "capx3w-node-contentlist-0012";
  const endNode = "capx3w-node-end-0013";
  const rejectNode = "capx3w-node-reject-0014";
  const mainFlows = Array.from({ length: 12 }, (_, index) => `capx3w-flow-main-${String(index + 1).padStart(4, "0")}`);
  const rejectFlows = Array.from({ length: taskIds.length }, (_, index) => `capx3w-flow-reject-${String(index + 1).padStart(4, "0")}`);
  const nodes = [
    workflowNode(startNode, "StartNoneEvent", { name: "Start", taskurl: def.pageurls[0].id, TaskUrl: def.pageurls[0].id }, { x: -100, y: 120 }, [], [mainFlows[0]]),
    taskNode(submitNode, "Request Submission", def.pageurls[1].id, mainFlows[0], mainFlows[1], rejectFlows[0], 120, 120, false),
    workflowNode(setNode, "SetVariableTask", {
      name: "Set Request No. and Status",
      formtype: "current",
      variablesetting: [
        { key: "capx3w-set-request-no", prop: null, id: "RequestNo", name: "Request No.", type: "text", value: `<input type="button" data="\${&quot;type&quot;:&quot;application&quot;,&quot;prop&quot;:&quot;FlowNo&quot;}" expr="__" tabindex="-1" value="Tracking No.">` },
        { key: "capx3w-set-status", prop: null, id: "WorkflowStatus", name: "Workflow Status", type: "text", value: "Submitted" }
      ]
    }, { x: 360, y: 120 }, [mainFlows[1]], [mainFlows[2]])
  ];
  const reviewTasks = taskIds.slice(1);
  reviewTasks.forEach(([taskId, name, complete, taskUrl], index) => {
    const incoming = mainFlows[index + 2];
    const approved = mainFlows[index + 3];
    const rejected = rejectFlows[index + 1];
    nodes.push(taskNode(taskId, name, taskUrl, incoming, approved, complete ? null : rejected, 600 + index * 220, 120, complete));
  });
  nodes.push(workflowNode(contentNode, "ContentList", {
    name: "Create CAPEX Request Record",
    type: "add",
    appid: appId,
    listsetid: rootId,
    listid: requestListId,
    listtype: "select",
    listdatas: contentListMappings(),
    wheres: []
  }, { x: 2380, y: 120 }, [mainFlows[10]], [mainFlows[11]]));
  nodes.push(workflowNode(endNode, "EndNoneEvent", { name: "End" }, { x: 2600, y: 120 }, [mainFlows[11]], []));
  nodes.push(workflowNode(rejectNode, "EndRejectEvent", { name: "End with Rejection" }, { x: 1180, y: 420 }, rejectFlows.slice(0, 6), []));
  nodes.push(workflowFlow(mainFlows[0], startNode, submitNode, { name: "Start to Request Submission" }));
  nodes.push(workflowFlow(mainFlows[1], submitNode, setNode, {
    name: "Request Submission Approved",
    documentation: "Approved",
    conditioninfo: [{ key: "capx3w-cond-submitted", pre: "and", left: taskOutcomeButton(submitNode, "Request Submission"), op: "s.=", right: outcomeValueButton("Approved") }]
  }));
  nodes.push(workflowFlow(mainFlows[2], setNode, taskIds[1][0], { name: "Set Request No. to Line Manager Approval" }));
  reviewTasks.forEach(([taskId, name, complete], index) => {
    const next = index === reviewTasks.length - 1 ? contentNode : reviewTasks[index + 1][0];
    nodes.push(workflowFlow(mainFlows[index + 3], taskId, next, {
      name: `${name} ${complete ? "Completed" : "Approved"}`,
      documentation: complete ? "Completed" : "Approved",
      conditioninfo: [{ key: `capx3w-cond-${complete ? "completed" : "approved"}-${index}`, pre: "and", left: taskOutcomeButton(taskId, name), op: "s.=", right: outcomeValueButton(complete ? "Completed" : "Approved") }]
    }));
    if (complete) {
      return;
    }
    nodes.push(workflowFlow(rejectFlows[index + 1], taskId, rejectNode, {
      name: `${name} Rejected`,
      documentation: "Rejected",
      conditioninfo: [{ key: `capx3w-cond-rejected-${index}`, pre: "and", left: taskOutcomeButton(taskId, name), op: "s.=", right: outcomeValueButton("Rejected") }]
    }));
  });
  nodes.push(workflowFlow(rejectFlows[0], submitNode, rejectNode, {
    name: "Request Submission Rejected",
    documentation: "Rejected",
    conditioninfo: [{ key: "capx3w-cond-submit-rejected", pre: "and", left: taskOutcomeButton(submitNode, "Request Submission"), op: "s.=", right: outcomeValueButton("Rejected") }]
  }));
  nodes.push(workflowFlow(mainFlows[11], contentNode, endNode, { name: "Request Record Created to End" }));
  return nodes;
}

function contentListMappings() {
  const mappings = [
    { Per: "0", Columns: "Title", Data: varButton("RequestNo", "Request No.") },
    { Per: "0", Columns: "Text99", Data: "Approved" },
    { Per: "0", Columns: "Text100", Data: "Yes" }
  ];
  for (const [key, fieldName] of persistenceMap.entries()) {
    mappings.push({ Per: "0", Columns: fieldName, Data: varButton(key, fieldById.get(key).label) });
  }
  return mappings;
}

const baseList = clone(data.Childs[0]);
const requestFieldSpecs = dataListFieldSpecs();
const requestFields = requestFieldSpecs.map(([fieldName, displayName, internalName, fieldType, type, rules], index) =>
  makeField(requestListId, 2, index, fieldName, displayName, internalName, fieldType, type, rules)
);

baseList.ListModel.ListID = requestListId;
baseList.ListModel.ListSetID = rootId;
baseList.ListModel.AppID = appId;
baseList.ListModel.ListType = 1;
baseList.ListModel.Title = "IT Hardware CAPEX Requests";
baseList.ListModel.Description = "Records created from the IT Hardware CAPEX Request approval workflow.";
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
    Title: "All CAPEX Requests",
    ListID: requestListId,
    LayoutView: makeListViewLayout(requestFields),
    Ext2: null,
    IsItemPerm: false,
    IsDefault: true,
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
    Title: "CAPEX-1001",
    Text1: "Replace aging finance laptops",
    Text2: "Laptop",
    Text3: "Replacement",
    Decimal1: 12,
    Decimal2: 1450,
    Text99: "Approved",
    Text100: "Yes",
    Datetime1: "2026-05-20 00:00:00"
  },
  [localId(2, "0000000011002")]: {
    ListDataID: localId(2, "0000000011002"),
    Title: "CAPEX-1002",
    Text1: "Network switch refresh",
    Text2: "Network Device",
    Text3: "Upgrade",
    Decimal1: 4,
    Decimal2: 2800,
    Text99: "Submitted",
    Text100: "Yes",
    Datetime1: "2026-05-24 00:00:00"
  }
};

data.Childs = [baseList];
data.Item.ListModel.ListID = rootId;
data.Item.ListModel.Title = "IT Hardware CAPEX Request v4 Text Standard";
data.Item.ListModel.Description = "Submit, review, approve, procure, receive, and hand over IT hardware CAPEX purchases.";
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
    { AppID: appId, ListID: requestListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "CAPEX Requests", Icon: "fa-regular fa-list-check" },
    { AppID: "41", Title: "Submit CAPEX Request", ListID: formKey, ListSetID: rootId, Type: 105, Icon: "fa-regular fa-paper-plane" },
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

const form = data.Forms[0];
form.Name = "IT Hardware CAPEX Request";
form.Key = formKey;
form.Description = "Approval form for IT hardware CAPEX request submission, review, procurement, and fulfillment.";
form.ListID = 0;
form.ProcModelID = processId;
form.ImgResource = iconUrl;
form.DefKey = formKey;
form.ListSetID = rootId;
form.AppListSetID = rootId;
form.ProcModelListSetID = rootId;

const def = JSON.parse(form.DefResource);
def.defkey = formKey;
def.name = "IT Hardware CAPEX Request";
def.title = "IT Hardware CAPEX Request";
def.workflowType = "approval";
def.pageurls[0].id = uuid();
def.pageurls[0].title = "IT Hardware CAPEX Request Form";
def.pageurls[0].type = 1;
def.pageurls[0].formdef = makeApprovalPage("IT Hardware CAPEX Request Form", false);
def.pageurls[0].formdef.id = def.pageurls[0].id;
def.pageurls[1].id = uuid();
def.pageurls[1].title = "IT Hardware CAPEX Request Task";
def.pageurls[1].type = 2;
def.pageurls[1].formdef = makeApprovalPage("IT Hardware CAPEX Request Task", true);
def.pageurls[1].formdef.id = def.pageurls[1].id;
def.variables.basic = [
  { idx: "capx4t-var-attachments", id: "__attachments", name: "Attachments", type: "file", editable: true },
  { idx: "capx4t-var-request-no", id: "RequestNo", name: "Request No.", type: "text", editable: true },
  { idx: "capx4t-var-status", id: "WorkflowStatus", name: "Workflow Status", type: "text", editable: true },
  ...Array.from(fieldById.values()).map((meta) => ({
    idx: `capx4t-var-${meta.key}`,
    id: meta.key,
    name: meta.label,
    type: variableType(meta.controlType),
    editable: true
  }))
];
def.variables.listref = [];
def.ProcModelListID = processId;
def.ProcModelAppID = appId;
def.ProcModelListSetID = rootId;
def.AppListSetID = rootId;
def.listSet = rootId;
def.listInfo = { ListID: requestListId, Title: "IT Hardware CAPEX Requests" };
def.childshapes = buildWorkflow(def);

form.DefResource = JSON.stringify(def);
data.Forms = [form];

app.Title = "IT Hardware CAPEX Request v4 Text Standard";
app.Description = "Submit, review, approve, procure, receive, and hand over IT hardware CAPEX purchases.";
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
  jsxReference: "/Users/Renger/Downloads/it_hardware_capex_request_page.jsx",
  functionalReference: "/Users/Renger/Downloads/IT Hardware CAPEX Request.md",
  resources: {
    dashboards: ["Overview"],
    dataLists: ["IT Hardware CAPEX Requests"],
    customForms: ["Edit Item", "View Item"],
    approvalForms: ["IT Hardware CAPEX Request"]
  },
  supportNotes: {
    persistedFields: persistFieldIds.length,
    formOnlyFields: sections.flatMap((section) => section.fields).filter((field) => !persistFieldIds.includes(field[0])).map((field) => field[0]),
    fallbacks: [
      "cost-center-picker, location-picker, and identity-picker are persisted to Text fields in the data list.",
      "file-upload, icon-upload, and signer controls are included as approval-form controls but are not persisted by ContentList in v1.",
      "InclusiveGateway conditional routing is deferred to v2; v1 uses a linear review/procurement/fulfillment workflow."
    ]
  }
}, null, 2)}\n`);

console.log(`Wrote ${outAppPath}`);
console.log(`Wrote ${outFormDefPath}`);
console.log(`Wrote ${outListDefPath}`);
console.log(`Wrote ${outReportPath}`);

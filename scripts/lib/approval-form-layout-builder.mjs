import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { cleanPlanningLabel, isPlanningPlaceholder } from "./planning-placeholder-utils.mjs";

const UUID_CONTROL_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const APPROVAL_FORM_LAYOUT_TEMPLATE_IDS = Object.freeze({
  submission: "approval_form_layout_submission_v1_1",
  task: "approval_form_layout_task_v1_1",
});

export function buildApprovalFormLayoutDef({
  rootDir,
  id,
  title,
  role = "submission",
  fields = [],
} = {}) {
  if (!rootDir) throw new Error("buildApprovalFormLayoutDef requires rootDir");
  const normalizedRole = role === "task" ? "task" : "submission";
  const templateId = APPROVAL_FORM_LAYOUT_TEMPLATE_IDS[normalizedRole];
  const templatePath = path.join(
    rootDir,
    normalizedRole === "task"
      ? "docs/reference/approval-form-layout-task.template.json"
      : "docs/reference/approval-form-layout-submission.template.json",
  );
  const raw = JSON.parse(fs.readFileSync(templatePath, "utf8"));
  const resource = clone(raw.templateResource);
  const safeTitle = sanitizeTitle(title);
  resource.id = id;
  resource.title = normalizedRole === "task" ? `${safeTitle} Task` : `${safeTitle} Submission`;
  resource.name = resource.title;
  resource.approvalFormLayoutTemplateId = templateId;
  resource.derivedFromApprovalFormLayoutTemplate = templateId;
  resource.approvalFormLayoutRole = normalizedRole;
  setTemplateText(resource, "page_title_text", resource.title);
  setTemplateText(resource, "page_title_description", normalizedRole === "task" ? `Review and act on ${safeTitle}.` : `Submit ${safeTitle}.`);
  setTemplateText(resource, "section_title_text", normalizedRole === "task" ? "Review Details" : "Request Details");
  setTemplateText(resource, "section_title_description", normalizedRole === "task" ? `Review submitted ${safeTitle} information before taking action.` : `Complete the required ${safeTitle} information.`);
  materializeApprovalFieldControls(resource, { fields, title: safeTitle, role: normalizedRole, rootDir });
  ensureApprovalBusinessSection(resource, { title: safeTitle, role: normalizedRole });
  removeOperationsWithoutActions(resource);
  removeUnusedApprovalTemplateSections(resource);
  scrubApprovalSourceDomainResidue(resource, safeTitle);
  applyApprovalYwfShellCompatibilityLabels(resource);
  instantiateControlUuids(resource, `${slugify(safeTitle)}-${normalizedRole}-approval-form`);
  resource.id = id;
  return resource;
}

export function approvalVariableTypeForField(field) {
  const type = normalizeApprovalControlType(field);
  if (type === "datepicker") return "date";
  if (type === "currency" || type === "input_number") return "number";
  if (type === "switch") return "boolean";
  if (type === "identity-picker") return "user";
  if (type === "list") return "sublist";
  return "text";
}

function scrubApprovalSourceDomainResidue(node, title) {
  const replacements = [
    [/Active Loan Pipeline/g, `${title} Details`],
    [/Loan Status/g, "Request Status"],
    [/\bPipeline\b/g, "Workflow"],
  ];
  const visit = (value) => {
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) value[index] = visit(value[index]);
      return value;
    }
    if (!value || typeof value !== "object") {
      if (typeof value !== "string") return value;
      return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
    }
    if (value.approvalFieldMaterializedFromPlan === true) return value;
    for (const [key, child] of Object.entries(value)) {
      if (key === "id") continue;
      value[key] = visit(child);
    }
    return value;
  };
  visit(node);
}

function materializeApprovalFieldControls(resource, { fields, title, role, rootDir }) {
  const normalizedFields = uniqueApprovalFieldSpecs(fields);
  const slot = findBusinessSectionContentArea(resource);
  if (!slot) return;
  slot.children = normalizedFields.length
    ? [buildApprovalFormFieldsGrid({ fields: normalizedFields, formName: title, role, rootDir })]
    : [buildApprovalNoFieldsNotice({ title, role })];
}

function ensureApprovalBusinessSection(resource, { title, role }) {
  const wrappers = findDescendants(resource, (node) => hasIdentity(node, "content_card_wrapper"));
  if (wrappers.some((wrapper) => hasMeaningfulBusinessContent(wrapper))) return;
  const wrapper = wrappers[0];
  const slot = wrapper ? findFirstByIdentity(wrapper, "section_content_area") : findBusinessSectionContentArea(resource);
  if (!slot) return;
  slot.children = [buildApprovalNoFieldsNotice({ title, role })];
}

function buildApprovalNoFieldsNotice({ title, role }) {
  return {
    id: deterministicUuid(`${slugify(title)}-${role}-approval-no-additional-fields`),
    name: "No additional fields required",
    title: "No additional fields required",
    label: "No additional fields required",
    nv_label: "approval_no_additional_fields_required",
    type: "heading",
    approvalFormNoFieldsNotice: true,
    attrs: {
      heads: { ty: [null, "body-medium"], color: "#64748b" },
      headc: {
        title: {
          value: role === "task"
            ? "No additional task fields are required. Use the action panel below to complete the workflow task."
            : "No additional submission fields are required for this approval form.",
        },
      },
    },
  };
}

function buildApprovalFormFieldsGrid({ fields, formName, role, rootDir }) {
  const useThreeColumns = fields.length >= 8;
  const templateId = useThreeColumns ? "approval_form_fields_grid_3col_v1_1" : "approval_form_fields_grid_2col_v1_1";
  const templatePath = useThreeColumns
    ? path.join(rootDir, "docs/reference/approval-form-fields-grid-3col.template.json")
    : path.join(rootDir, "docs/reference/approval-form-fields-grid-2col.template.json");
  const raw = JSON.parse(fs.readFileSync(templatePath, "utf8"));
  const wrapper = clone(raw._ak_c || raw.templateResource || raw);
  const wrapperIdentity = useThreeColumns ? "form_grid_fields_3col_wrapper" : "form_grid_fields_2col_wrapper";
  wrapper.id = deterministicUuid(`${slugify(formName)}-${role}-${wrapperIdentity}`);
  wrapper.nv_label = wrapperIdentity;
  wrapper.approvalFormFieldsTemplateId = templateId;
  wrapper.derivedFromApprovalFormFieldsTemplate = templateId;
  wrapper.children = fields.map((field, index) => buildApprovalFormFieldControl({ field, index, formName, role, columns: useThreeColumns ? 3 : 2 }));
  return wrapper;
}

function buildApprovalFormFieldControl({ field, index, formName, role, columns }) {
  const type = normalizeApprovalControlType(field);
  const fullRow = isFullRowApprovalField(field, type);
  const control = {
    type,
    id: deterministicUuid(`${slugify(formName)}-${role}-approval-field-${index + 1}-${field.fieldName}`),
    name: field.displayName,
    title: field.displayName,
    label: field.displayName,
    displayLabel: [null, true],
    nv_label: `approval_field_${slugify(field.displayName).replace(/-/g, "_")}`,
    binding: field.fieldName,
    fieldName: field.fieldName,
    approvalFieldMaterializedFromPlan: true,
    attrs: {
      common: {
        margin: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }],
      },
      placeholder: `Enter ${field.displayName}`,
      data: {
        field: field.fieldName,
        fieldName: field.fieldName,
        displayName: field.displayName,
        variableType: field.fieldType,
      },
    },
  };
  if (role === "task") {
    control.readonly = true;
    control.readOnly = true;
    control.attrs.readonly = true;
    control.attrs.readOnly = true;
  }
  if (type === "radio" || type === "select") {
    control.attrs.displayStyle = "dropdown";
    control.attrs.choices = inferChoiceValues(field);
    control.attrs.color_choices = control.attrs.choices.map((value) => ({ value, key: deterministicUuid(`${control.id}-${value}`) }));
  }
  if (fullRow) control.attrs.common.grid = { position: [null, { cSpan: columns }, { cSpan: Math.min(columns, 2) }, { cSpan: 1 }] };
  return control;
}

function normalizeApprovalControlType(field) {
  const raw = normKey(`${field?.controlType || ""} ${field?.fieldType || ""} ${field?.displayName || ""}`);
  if (/sub\s*list|detail\s*list|line\s*items?/.test(raw)) return "list";
  if (/rich\s*text|html/.test(raw)) return "richtext";
  if (/multi(?:ple)?\s*line|long\s*text|paragraph|purpose|justification|description|notes?/.test(raw)) return "textarea";
  if (/user|identity|people|person|traveler|requester|approver|manager/.test(raw)) return "identity-picker";
  if (/image|photo|picture/.test(raw)) return "image-upload";
  if (/file|attachment|document/.test(raw)) return "file-upload";
  if (/date|datetime|time/.test(raw)) return "datepicker";
  if (/currency|cost|amount|budget|price|fee/.test(raw)) return "currency";
  if (/decimal|number|integer|quantity|count|hours?/.test(raw)) return "input_number";
  if (/bit|boolean|yes\/no|switch/.test(raw)) return "switch";
  if (/choice|select|dropdown|radio|status|category|type|priority/.test(raw)) return "radio";
  return "input";
}

function isFullRowApprovalField(field, controlType) {
  const raw = normKey(`${field?.fieldType || ""} ${field?.controlType || ""} ${field?.displayName || ""}`);
  return controlType === "textarea" || controlType === "richtext" || controlType === "list" || /business purpose|justification|description|notes?/.test(raw);
}

function uniqueApprovalFieldSpecs(fields) {
  const normalized = [];
  const seen = new Set();
  for (const field of fields || []) {
    const displayName = cleanResourceName(field?.displayName);
    if (!displayName || isNonResourceName(displayName)) continue;
    const fieldName = cleanResourceName(field?.fieldName || inferFieldKey(displayName, field?.fieldType || "Text", normalized.length));
    const key = normKey(fieldName || displayName);
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({
      displayName,
      fieldName,
      fieldType: cleanResourceName(field?.fieldType) || "Text",
      controlType: cleanResourceName(field?.controlType) || inferControlType(field?.fieldType || ""),
      choiceValues: cleanResourceName(field?.choiceValues),
    });
  }
  return normalized;
}

function inferChoiceValues(field) {
  if (String(field?.choiceValues || "").trim()) {
    return String(field.choiceValues).split(/[,;]+/).map((value) => value.trim()).filter(Boolean);
  }
  const raw = normKey(`${field?.displayName || ""} ${field?.fieldName || ""} ${field?.fieldType || ""} ${field?.controlType || ""}`);
  if (/priority|urgency|severity|critical/.test(raw)) return ["Low", "Medium", "High", "Critical"];
  if (/condition|inspection|quality/.test(raw)) return ["Good", "Fair", "Damaged", "Lost"];
  if (/availability|available|reservation/.test(raw)) return ["Available", "Checked Out", "Reserved", "Maintenance"];
  if (/approval|decision|review/.test(raw)) return ["Pending Review", "Approved", "Rejected", "Returned"];
  if (/status|state|stage|phase/.test(raw)) return ["Draft", "Submitted", "In Progress", "Completed", "Closed"];
  if (/category|type|class|group/.test(raw)) return ["Standard", "Special", "Replacement", "Repair"];
  return ["Active", "Pending", "Closed"];
}

function removeOperationsWithoutActions(root) {
  const visit = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      if (isGeneratedOperationContainer(child) && !hasActionConfiguration(child)) return false;
      visit(child);
      return true;
    });
  };
  visit(root);
}

function isGeneratedOperationContainer(control) {
  return [
    "Operations",
    "current_item_main_header_operations",
    "current_item_aditional_header_operations",
    "current_item_additional_header_operations",
  ].some((identity) => hasIdentity(control, identity));
}

function removeUnusedApprovalTemplateSections(root) {
  const removableModules = new Set(["content_card_wrapper", "content_card_60_wrapper", "content_card_40_wrapper", "1_columns_section", "2_columns_section", "3_columns_section", "2_columns_60/40_section"]);
  const visit = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      visit(child);
      if (hasIdentity(child, "section_content_area") && !findFirstByIdentity(child, "action_panel_flow_history_wrapper") && !hasWorkflowSurface(child) && !hasMeaningfulBusinessContent(child)) return false;
      if (hasIdentity(child, "section_title_area") && !hasSectionTitleAreaContent(child)) return false;
      if (![...removableModules].some((identity) => hasIdentity(child, identity))) return true;
      if (findFirstByIdentity(child, "action_panel_flow_history_wrapper")) return true;
      return hasMeaningfulBusinessContent(child);
    });
  };
  visit(root);
}

function hasMeaningfulBusinessContent(node) {
  if (!node || typeof node !== "object") return false;
  if (node.approvalFormNoFieldsNotice === true) return true;
  if (!Array.isArray(node.children) || node.children.length === 0) return false;
  return findDescendants(node, (control) => {
    const type = String(control?.type || "");
    if (control?.approvalFormNoFieldsNotice === true) return true;
    if (["collection", "data-list", "data-filter", "select-filter", "radio-filter", "checkbox-filter", "search-filter", "dynamic-field", "dynamic-user", "dynamic-image", "dynamic-file"].includes(type)) return true;
    if (type === "button" && hasActionConfiguration(control)) return true;
    if (hasIdentity(control, "form_grid_fields_wrapper")) return true;
    if (hasIdentity(control, "form_grid_fields_2col_wrapper")) return true;
    if (hasIdentity(control, "form_grid_fields_3col_wrapper")) return true;
    if (["input", "textarea", "richtext", "rich-text", "radio", "checkbox", "switch", "date", "datetime", "number", "input_number", "lookup", "people", "user"].includes(type)) return true;
    return false;
  }).length > 0;
}

function hasSectionTitleAreaContent(node) {
  const header = findFirstByIdentity(node, "section_title_header");
  const operations = findFirstByIdentity(node, "Operations");
  return Boolean(header || (operations && hasActionConfiguration(operations)));
}

function hasWorkflowSurface(node) {
  if (!node || typeof node !== "object") return false;
  return findDescendants(node, (control) => ["workflowControlPanel", "workflowHistory"].includes(String(control?.type || ""))).length > 0;
}

function hasActionConfiguration(control) {
  const attrs = control?.attrs || {};
  if (attrs.control_action || attrs.action || attrs["action-type"] || attrs.actionType) return true;
  if (Array.isArray(attrs.actions) && attrs.actions.length) return true;
  if (Array.isArray(control?.actions) && control.actions.length) return true;
  return findDescendants(control, (node) => {
    const childAttrs = node?.attrs || {};
    return Boolean(childAttrs.control_action || childAttrs.action || childAttrs["action-type"] || childAttrs.actionType || (Array.isArray(childAttrs.actions) && childAttrs.actions.length));
  }).length > 0;
}

function applyApprovalYwfShellCompatibilityLabels(root) {
  applyNvLabelPreservingTemplateIdentity(findFirstByIdentity(root, "main"), "Main", "main");
  applyNvLabelPreservingTemplateIdentity(findFirstByIdentity(root, "content"), "Content", "content");
  const formBody = findDescendants(root, (node) => hasIdentity(node, "content_card_wrapper") && !findFirstByIdentity(node, "action_panel_flow_history_wrapper") && hasMeaningfulBusinessContent(node))[0]
    || findFirstByIdentity(root, "content_card_wrapper");
  applyNvLabelPreservingTemplateIdentity(formBody, "Form body", "content_card_wrapper");
  const formBottom = findFirstByIdentity(root, "action_panel_flow_history_wrapper");
  applyNvLabelPreservingTemplateIdentity(formBottom, "Form bottom", "action_panel_flow_history_wrapper");
}

function applyNvLabelPreservingTemplateIdentity(control, standardNvLabel, templateIdentity) {
  if (!control || typeof control !== "object") return;
  if (control.nv_label && control.nv_label !== standardNvLabel && !control.nav_label) control.nav_label = control.nv_label;
  control.nv_label = standardNvLabel;
  control.approvalFormTemplateIdentity = templateIdentity;
  control.derivedFromApprovalFormTemplateIdentity = templateIdentity;
  control.attrs = control.attrs && typeof control.attrs === "object" ? control.attrs : {};
  if (control.attrs.nv_label && control.attrs.nv_label !== standardNvLabel && !control.attrs.nav_label) control.attrs.nav_label = control.attrs.nv_label;
  control.attrs.nv_label = standardNvLabel;
  control.attrs.approvalFormTemplateIdentity = templateIdentity;
  control.attrs.derivedFromApprovalFormTemplateIdentity = templateIdentity;
}

function findBusinessSectionContentArea(root) {
  for (const wrapperId of ["content_card_wrapper", "content_card_60_wrapper", "content_card_40_wrapper"]) {
    const contentCardWrappers = findDescendants(root, (node) => hasIdentity(node, wrapperId));
    for (const wrapper of contentCardWrappers) {
      const slot = findFirstByIdentity(wrapper, "section_content_area");
      if (slot) return slot;
    }
  }
  return findFirstByIdentity(root, "section_content_area");
}

function findFirstByIdentity(root, expected) {
  let found = null;
  const visit = (node) => {
    if (found || !node || typeof node !== "object") return;
    if (hasIdentity(node, expected)) {
      found = node;
      return;
    }
    for (const child of Array.isArray(node.children) ? node.children : []) visit(child);
  };
  visit(root);
  return found;
}

function findDescendants(root, predicate) {
  const out = [];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (predicate(node)) out.push(node);
    for (const child of Array.isArray(node.children) ? node.children : []) visit(child);
  };
  visit(root);
  return out;
}

function hasIdentity(control, expected) {
  const normalized = normKey(expected);
  return identityCandidates(control).some((candidate) => normKey(candidate) === normalized);
}

function identityCandidates(control) {
  return [
    control?.id,
    control?.ID,
    control?.key,
    control?.name,
    control?.Name,
    control?.label,
    control?.Label,
    control?.nv_label,
    control?.nav_label,
    control?.attrs?.id,
    control?.attrs?.name,
    control?.attrs?.label,
    control?.attrs?.nv_label,
    control?.attrs?.nav_label,
    control?.attrs?.templateMarker,
    control?.attrs?.approvalFormLayoutTemplateId,
    control?.attrs?.derivedFromApprovalFormLayoutTemplate,
    control?.templateMarker,
    control?.approvalFormLayoutTemplateId,
    control?.derivedFromApprovalFormLayoutTemplate,
  ].filter(Boolean).map(String);
}

function setTemplateText(root, identity, value) {
  const node = findFirstByIdentity(root, identity);
  if (!node) return;
  node.name = value;
  node.title = value;
  node.attrs = node.attrs || {};
  node.attrs.headc = node.attrs.headc || {};
  node.attrs.headc.title = node.attrs.headc.title || {};
  node.attrs.headc.title.value = value;
}

function instantiateControlUuids(resource, pageSeed) {
  let index = 0;
  const referenceReplacements = new Map();
  const visit = (node) => {
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (!node || typeof node !== "object") return;
    if (typeof node.id === "string" && UUID_CONTROL_ID_RE.test(node.id)) {
      const oldId = node.id;
      index += 1;
      node.id = deterministicUuid(`${pageSeed}:control:${index}:${node.id}`);
      if (!referenceReplacements.has(oldId)) referenceReplacements.set(oldId, node.id);
    }
    for (const child of Object.values(node)) visit(child);
  };
  visit(resource);
  if (!referenceReplacements.size) return;
  const replaceReferences = (node, key = "") => {
    if (Array.isArray(node)) {
      for (let itemIndex = 0; itemIndex < node.length; itemIndex += 1) node[itemIndex] = replaceReferences(node[itemIndex]);
      return node;
    }
    if (!node || typeof node !== "object") {
      if (typeof node !== "string" || key === "id") return node;
      let out = node;
      for (const [from, to] of referenceReplacements) out = out.split(from).join(to);
      return out;
    }
    for (const [childKey, child] of Object.entries(node)) {
      if (childKey === "id") continue;
      node[childKey] = replaceReferences(child, childKey);
    }
    return node;
  };
  replaceReferences(resource);
}

function deterministicUuid(seed) {
  const hex = crypto.createHash("sha256").update(String(seed)).digest("hex");
  const variant = ((Number.parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(18, 20)}-${hex.slice(20, 32)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function inferFieldKey(displayName, fieldType, index) {
  if (/^title$/i.test(displayName)) return "Title";
  const prefix = fieldPrefix(fieldType);
  return `${prefix}${Math.max(1, index + 1)}`;
}

function fieldPrefix(fieldType) {
  const normalized = normKey(fieldType);
  if (/user|people|person|identity/.test(normalized)) return "Text";
  if (/date|time/.test(normalized)) return "Datetime";
  if (/number|decimal|currency|amount|percent|integer/.test(normalized)) return "Decimal";
  if (/boolean|yes no|checkbox|bit/.test(normalized)) return "Bit";
  return "Text";
}

function inferControlType(fieldType) {
  const normalized = normKey(fieldType);
  if (/user|people|person|identity/.test(normalized)) return "identity-picker";
  if (/date|time/.test(normalized)) return "datepicker";
  if (/number|decimal|currency|amount|percent|integer/.test(normalized)) return "input_number";
  if (/boolean|yes no|checkbox|bit/.test(normalized)) return "switch";
  if (/choice|select|status|category/.test(normalized)) return "select";
  if (/lookup|reference|relation/.test(normalized)) return "lookup";
  if (/file|attachment/.test(normalized)) return "file-upload";
  if (/image|photo|picture/.test(normalized)) return "icon-upload";
  if (/text ?area|textarea|multi line|multiline|long text|description/.test(normalized)) return "textarea";
  return "input";
}

function cleanResourceName(value) {
  return cleanPlanningLabel(value);
}

function isNonResourceName(value) {
  const text = cleanResourceName(value);
  if (isPlanningPlaceholder(text)) return true;
  if (/^(status|resource type|notes?|owner|used by|actions?|fields?)$/i.test(text)) return true;
  if (/^no\s+(?:form\s+)?reports?\b/i.test(text)) return true;
  if (/^no custom\b/i.test(text)) return true;
  if (/^(dashboard|dashboard page|dashboard page name|page|page name|list name|form name|group|item|section|metric name|filter name)$/i.test(text)) return true;
  return false;
}

function sanitizeTitle(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 120) || "Generated Approval Form";
}

function slugify(value) {
  return sanitizeTitle(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "generated-approval-form";
}

function normKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

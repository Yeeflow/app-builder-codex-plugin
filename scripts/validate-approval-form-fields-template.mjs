#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { asArray, isObject, parseJsonMaybe, quoteLargeJsonIntegers, readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = path.join(ROOT, "docs/reference/approval-form-field-layout-templates.json");
const TEMPLATE_2COL_ID = "approval_form_fields_grid_2col_v1_1";
const TEMPLATE_3COL_ID = "approval_form_fields_grid_3col_v1_1";
const TEMPLATE_IDS = new Set([TEMPLATE_2COL_ID, TEMPLATE_3COL_ID]);
const WRAPPER_IDS = new Set(["form_grid_fields_2col_wrapper", "form_grid_fields_3col_wrapper"]);
const REQUIRED_PLACEMENT_SLOT = "section_content_area";
const REQUIRED_CARD_WRAPPER = "content_card_wrapper";
const REQUIRED_FULL_ROW_TYPES = new Set(["textarea", "richtext", "list"]);
const FIELD_CONTROL_TYPES = new Set([
  "input",
  "textarea",
  "richtext",
  "list",
  "lookup",
  "radio",
  "checkbox",
  "tag",
  "datepicker",
  "date",
  "datetime",
  "input_number",
  "number",
  "currency",
  "identity-picker",
  "user-picker",
  "people",
  "location-picker",
  "file-upload",
  "image-upload",
  "switch",
  "select",
]);
const GENERIC_FIELD_NAV_LABELS = new Set(["", "field", "control", "input", "textarea", "richtext", "list", "sublist", "sub list", "container"]);
const BROTLI_PREFIX = Buffer.from("::brotli::", "utf8");

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.registry && !args.resource && !args.package && !args.plan)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateApprovalFormFieldsTemplate(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateApprovalFormFieldsTemplate(options = {}) {
  const findings = [];
  const registryPath = path.resolve(options.registry || REGISTRY_PATH);
  const registry = readJson(registryPath, findings, "APPROVAL_FORM_FIELDS_REGISTRY_MISSING");
  validateRegistry(registry, findings, registryPath);
  let plannedApprovalFields = {};

  if (options.resource) {
    const resource = readJson(path.resolve(options.resource), findings, "APPROVAL_FORM_FIELDS_RESOURCE_MISSING");
    validateResource(resource, {
      findings,
      source: path.basename(options.resource),
      requirePlacement: options.surface === "approval-form",
      requireWrapperWhenFieldsExist: true,
    });
  }

  if (options.plan) plannedApprovalFields = validateAppPlan(path.resolve(options.plan), findings);
  if (options.package) validatePackage(path.resolve(options.package), { findings, plannedApprovalFields });

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    registry: registryPath,
    resource: options.resource ? path.resolve(options.resource) : null,
    package: options.package ? path.resolve(options.package) : null,
    appPlan: options.plan ? path.resolve(options.plan) : null,
    findings,
  };
}

function validateRegistry(registry, findings, registryPath) {
  if (!registry) return;
  for (const id of TEMPLATE_IDS) {
    if (!asArray(registry.approvedTemplateIds).includes(id)) {
      findings.push(error("APPROVAL_FORM_FIELDS_TEMPLATE_REFERENCE_MISSING", "Approval Form field-layout registry must include both approved 2-column and 3-column template IDs.", { templateId: id }));
    }
  }
  for (const wrapperId of WRAPPER_IDS) {
    if (!asArray(registry.approvedRootWrapperIds).includes(wrapperId)) {
      findings.push(error("APPROVAL_FORM_FIELDS_WRAPPER_REFERENCE_MISSING", "Approval Form field-layout registry must include every approved root wrapper ID.", { wrapperId }));
    }
  }
  for (const templateId of TEMPLATE_IDS) {
    const reference = asArray(registry.templates).find((item) => item?.templateId === templateId);
    if (!reference) {
      findings.push(error("APPROVAL_FORM_FIELDS_TEMPLATE_REFERENCE_MISSING", "Approval Form field-layout registry is missing an approved template reference.", { templateId }));
      continue;
    }
    if (!WRAPPER_IDS.has(String(reference.rootWrapperId || "")) || reference.rootControlType !== "flex_grid") {
      findings.push(error("APPROVAL_FORM_FIELDS_TEMPLATE_ROOT_CONTRACT_INVALID", "Approval Form field-layout registry must identify an approved flex_grid root wrapper.", { templateId, rootWrapperId: reference.rootWrapperId, rootControlType: reference.rootControlType }));
    }
    const templatePath = path.resolve(path.dirname(registryPath), "..", "..", reference.sourceTemplate || "");
    if (!fs.existsSync(templatePath)) {
      findings.push(error("APPROVAL_FORM_FIELDS_TEMPLATE_FILE_MISSING", "Approval Form field-layout template file is missing.", { templateId, sourceTemplate: reference.sourceTemplate }));
      continue;
    }
    const template = readJson(templatePath, findings, "APPROVAL_FORM_FIELDS_TEMPLATE_PARSE_FAILED");
    validateResource(template, { findings, source: reference.displayName || templateId, requirePlacement: false, requireWrapperWhenFieldsExist: true, registryMode: true });
  }
}

function validatePackage(packagePath, context) {
  if (!fs.existsSync(packagePath)) {
    context.findings.push(error("APPROVAL_FORM_FIELDS_PACKAGE_MISSING", "Package file is missing.", { package: packagePath }));
    return;
  }
  let decoded;
  try {
    ({ decoded } = readDecodedYapk(packagePath));
  } catch (err) {
    context.findings.push(error("APPROVAL_FORM_FIELDS_PACKAGE_DECODE_FAILED", `Could not decode package Resource: ${err.message}`, { package: packagePath }));
    return;
  }
  const formPages = collectApprovalFormPages(decoded);
  for (const form of formPages) {
    validateResource(form.resource, {
      findings: context.findings,
      source: form.source,
      requirePlacement: true,
      requireWrapperWhenFieldsExist: true,
    });
  }
  if (context.plannedApprovalFields && Object.keys(context.plannedApprovalFields).length) {
    validatePlannedApprovalFieldsMaterialized(formPages, context.plannedApprovalFields, context.findings);
  }
}

function validateAppPlan(planPath, findings) {
  if (!fs.existsSync(planPath)) {
    findings.push(error("APPROVAL_FORM_FIELDS_APP_PLAN_MISSING", "App Plan file is missing.", { plan: planPath }));
    return;
  }
  const text = fs.readFileSync(planPath, "utf8");
  const section = extractSection(text, /^##\s+5\.\s+Approval Forms Plan/im);
  if (!section.trim()) return {};
  const plannedApprovalFields = collectPlannedApprovalFields(section);
  const hasApprovalFieldPlanning = /Submission Form Fields|Task Form Fields|Approval Form Fields Layout Template Selection/i.test(section) && /\|/.test(section);
  if (!hasApprovalFieldPlanning) return plannedApprovalFields;
  if (/intentionally has no approval form field controls/i.test(section)) return plannedApprovalFields;
  if (!/Approval Form Fields Layout Template Selection/i.test(section)) {
    findings.push(error("APPROVAL_FORM_FIELDS_APP_PLAN_SELECTION_TABLE_MISSING", "Approval Forms Plan must include an Approval Form Fields Layout Template Selection table when approval forms display fields."));
    return plannedApprovalFields;
  }
  const selectionBlock = section.split(/#### Form Actions and Temp Variables|#### Sub List List Actions|##\s+6\./i)[0].split(/#### Approval Form Fields Layout Template Selection/i)[1] || "";
  const rows = tableRows(selectionBlock).filter((row) => !/^\|\s*(Approval Form|---)\s*\|/i.test(row.raw));
  const selectedRows = rows.filter((row) => [...TEMPLATE_IDS].some((id) => row.raw.includes(id)));
  if (!selectedRows.length) {
    findings.push(error("APPROVAL_FORM_FIELDS_APP_PLAN_TEMPLATE_SELECTION_REQUIRED", "Approval Form Fields Layout Template Selection must select an approved approval form field-grid template for each generated field group."));
    return plannedApprovalFields;
  }
  for (const row of selectedRows) validateAppPlanFieldGridRow(row.raw, findings);
  return plannedApprovalFields;
}

function validateAppPlanFieldGridRow(row, findings) {
  const ids = [...row.matchAll(/\bapproval_form_fields_grid_[23]col_v1_1\b/g)].map((match) => match[0]);
  for (const id of ids) {
    if (!TEMPLATE_IDS.has(id)) {
      findings.push(error("APPROVAL_FORM_FIELDS_APP_PLAN_TEMPLATE_UNKNOWN", "Approval Form Fields Layout Template Selection must use an approved template ID.", { templateId: id, row }));
    }
  }
  const cells = row.split("|").slice(1, -1).map((cell) => cell.trim());
  const pc = Number(cells[5]);
  const tablet = Number(cells[6]);
  const mobile = Number(cells[7]);
  if (!Number.isFinite(pc) || pc < 2 || pc > 3) {
    findings.push(error("APPROVAL_FORM_FIELDS_APP_PLAN_PC_COLUMNS_INVALID", "PC/laptop columns for approval form field grids must be 2 or 3.", { row }));
  }
  if (Number.isFinite(tablet) && Number.isFinite(pc) && tablet > pc) {
    findings.push(error("APPROVAL_FORM_FIELDS_APP_PLAN_TABLET_COLUMNS_INVALID", "Tablet columns must not exceed PC/laptop columns.", { row }));
  }
  if (Number.isFinite(mobile) && mobile !== 1) {
    findings.push(error("APPROVAL_FORM_FIELDS_APP_PLAN_MOBILE_COLUMNS_INVALID", "Mobile columns should be 1 for approval form field grids.", { row }));
  }
}

function validateResource(rawResource, context) {
  const resource = normalizeTemplateResource(rawResource);
  if (!isObject(resource)) {
    context.findings.push(error("APPROVAL_FORM_FIELDS_RESOURCE_INVALID", "Approval Form field-layout resource must parse as an object.", { source: context.source }));
    return;
  }
  const wrappers = flatten(resource).filter((entry) => identityCandidates(entry.node).some((identity) => WRAPPER_IDS.has(identity))).map((entry) => entry.node);
  const fieldControls = flatten(resource).filter((entry) => isFieldControl(entry.node));
  if (!wrappers.length && context.requireWrapperWhenFieldsExist && fieldControls.length) {
    context.findings.push(error("APPROVAL_FORM_FIELDS_WRAPPER_MISSING", "Generated Approval form field controls must be placed inside an approved approval form field-grid wrapper.", { source: context.source, approvedRootWrapperIds: [...WRAPPER_IDS], fieldControlCount: fieldControls.length }));
    return;
  }
  for (const wrapper of wrappers) validateWrapper(wrapper, context);
  for (const entry of fieldControls) {
    if (!isInsideAny(entry.node, wrappers)) {
      context.findings.push(error("APPROVAL_FORM_FIELDS_CONTROL_OUTSIDE_WRAPPER", "Approval form field controls must not be placed outside the approved field-grid wrapper.", { source: context.source, path: entry.pointer, type: entry.node?.type, identities: identityCandidates(entry.node) }));
    }
  }
  if (context.requirePlacement) {
    for (const wrapper of wrappers) {
      if (!hasApprovedSectionContentPlacement(resource, wrapper)) {
        context.findings.push(error("APPROVAL_FORM_FIELDS_PLACEMENT_INVALID", "When used with Approval Form Layouts v1.1, approval form field-grid wrappers must be placed inside content_card_wrapper > section_content_area.", { source: context.source, requiredCardWrapper: REQUIRED_CARD_WRAPPER, requiredSlot: REQUIRED_PLACEMENT_SLOT }));
      }
    }
  }
}

function validateWrapper(wrapper, context) {
  if (wrapper.type !== "flex_grid") {
    context.findings.push(error("APPROVAL_FORM_FIELDS_WRAPPER_TYPE_INVALID", "Approval form field-grid wrappers must remain flex_grid controls.", { source: context.source, actual: wrapper.type, identities: identityCandidates(wrapper) }));
  }
  validateGrid(wrapper, context, identityCandidates(wrapper).find((id) => WRAPPER_IDS.has(id)) || "approval-form-field-grid");
}

function validateGrid(grid, context, gridLabel) {
  const columnCounts = responsiveColumnCounts(grid);
  const pc = columnCounts.get("1");
  const tablet = columnCounts.get("2");
  const mobile = columnCounts.get("3");
  if (pc !== undefined && (pc < 2 || pc > 3)) {
    context.findings.push(error("APPROVAL_FORM_FIELDS_GRID_PC_COLUMNS_INVALID", "PC/laptop Grid columns should be 2 or 3.", { source: context.source, grid: gridLabel, pcColumns: pc }));
  }
  if (tablet !== undefined && pc !== undefined && tablet > pc) {
    context.findings.push(error("APPROVAL_FORM_FIELDS_GRID_TABLET_COLUMNS_INVALID", "Tablet Grid columns must not exceed PC/laptop columns.", { source: context.source, grid: gridLabel, pcColumns: pc, tabletColumns: tablet }));
  }
  if (mobile !== undefined && mobile !== 1) {
    context.findings.push(error("APPROVAL_FORM_FIELDS_GRID_MOBILE_COLUMNS_INVALID", "Mobile Grid columns should be 1.", { source: context.source, grid: gridLabel, mobileColumns: mobile }));
  }

  for (const child of asArray(grid.children)) {
    if (!isObject(child)) continue;
    const span = responsiveColumnSpan(child);
    for (const [breakpoint, count] of columnCounts.entries()) {
      const childSpan = span.get(breakpoint);
      if (childSpan !== undefined && childSpan > count) {
        context.findings.push(error("APPROVAL_FORM_FIELDS_GRID_COLUMN_SPAN_EXCEEDS_COLUMNS", "A field or group column span must not exceed its parent Grid column count for the same breakpoint.", { source: context.source, grid: gridLabel, child: identityCandidates(child), breakpoint, columnCount: count, columnSpan: childSpan }));
      }
    }
    if (isFieldControl(child)) validateFieldControl(child, context);
    if (isFullRowRequired(child)) validateFullRowSpan(child, columnCounts, context, gridLabel);
    for (const entry of flatten(child)) {
      if (entry.node === child) continue;
      if (isFieldControl(entry.node)) validateFieldControl(entry.node, context);
      if (isFullRowRequired(entry.node)) {
        const host = nearestDirectChildOfGrid(entry.node, grid);
        if (host) validateFullRowSpan(host, columnCounts, context, gridLabel, entry.node);
      }
    }
    if (child.type === "flex_grid") validateGrid(child, context, identityCandidates(child)[0] || "nested-grid");
    for (const nested of flatten(child).filter((entry) => entry.node?.type === "flex_grid").map((entry) => entry.node)) {
      if (nested !== child) validateGrid(nested, context, identityCandidates(nested)[0] || "nested-grid");
    }
  }
}

function validateFieldControl(control, context) {
  if (!hasZeroMargin(control)) {
    context.findings.push(error("APPROVAL_FORM_FIELDS_FIELD_MARGIN_NOT_ZERO", "Every Approval form field control inside the approved field-grid wrapper must explicitly set margin to zero.", { source: context.source, type: control.type, identities: identityCandidates(control) }));
  }
  if (!context.registryMode && !isReferenceTemplateSource(context) && !hasBusinessNavLabel(control)) {
    context.findings.push(error("APPROVAL_FORM_FIELDS_NAV_LABEL_MISSING", "Every generated Approval form field control inside the approved field-grid wrapper must have a business-specific nv_label/nav_label.", { source: context.source, type: control.type, identities: identityCandidates(control) }));
  }
}

function validateFullRowSpan(hostControl, columnCounts, context, gridLabel, originalControl = hostControl) {
  const span = responsiveColumnSpan(hostControl);
  for (const [breakpoint, count] of columnCounts.entries()) {
    const actual = span.get(breakpoint);
    if (actual !== count) {
      context.findings.push(error("APPROVAL_FORM_FIELDS_FULL_ROW_SPAN_INVALID", "Multiple line, Rich text, and Sub list controls must span the full parent Grid width on every configured breakpoint.", { source: context.source, grid: gridLabel, controlType: originalControl.type, host: identityCandidates(hostControl), breakpoint, expectedColumnSpan: count, actualColumnSpan: actual ?? null }));
    }
  }
}

function collectPlannedApprovalFields(section) {
  const planned = {};
  const lines = section.split(/\r?\n/);
  let currentApprovalForm = "";
  let currentRole = "";
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^###\s+\d+\.[x0-9]+\s+(.+?)\s*$/i);
    if (heading) {
      currentApprovalForm = cleanCell(heading[1]);
      currentRole = "";
      if (currentApprovalForm && !planned[norm(currentApprovalForm)]) planned[norm(currentApprovalForm)] = { submission: [], task: [] };
      continue;
    }
    if (/^#{4,6}\s+Submission Form Fields\s*$/i.test(lines[index])) {
      currentRole = "submission";
      continue;
    }
    if (/^#{4,6}\s+Task Form Fields\s*$/i.test(lines[index])) {
      currentRole = "task";
      continue;
    }
    if (!currentApprovalForm || !currentRole || !isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableCells(lines[index]).map(norm);
    const displayIndex = findHeaderIndex(headers, ["business label", "display name", "field name", "label", "name"]);
    if (displayIndex === -1) continue;
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableCells(lines[rowIndex]);
      const displayName = cleanCell(cells[displayIndex]);
      if (displayName && !isPlaceholderFieldName(displayName)) {
        const target = planned[norm(currentApprovalForm)]?.[currentRole] || [];
        if (!target.some((field) => norm(field.displayName) === norm(displayName))) target.push({ displayName });
        planned[norm(currentApprovalForm)][currentRole] = target;
      }
      rowIndex += 1;
    }
    index = rowIndex;
  }
  for (const [formKey, roles] of Object.entries(planned)) {
    if (!roles.task.length && roles.submission.length) roles.task = roles.submission.map((field) => ({ ...field, inheritedFromSubmission: true }));
    if (!roles.submission.length && !roles.task.length) delete planned[formKey];
  }
  return planned;
}

function validatePlannedApprovalFieldsMaterialized(formPages, plannedApprovalFields, findings) {
  for (const [plannedFormKey, roles] of Object.entries(plannedApprovalFields)) {
    const matchingPages = formPages.filter((page) => page.formKey === plannedFormKey || page.sourceKey === plannedFormKey || page.formKey.includes(plannedFormKey) || plannedFormKey.includes(page.formKey));
    if (!matchingPages.length) continue;
    for (const role of ["submission", "task"]) {
      const plannedFields = roles[role] || [];
      if (!plannedFields.length) continue;
      const page = matchingPages.find((candidate) => candidate.role === role) || (role === "task" ? matchingPages.find((candidate) => candidate.role === "submission") : null);
      if (!page) {
        findings.push(error("APPROVAL_FORM_FIELDS_PLANNED_PAGE_MISSING", "A planned Approval form page with field controls was not materialized in DefResource.pageurls[].formdef.", { approvalForm: plannedFormKey, role }));
        continue;
      }
      const materializedFields = collectMaterializedFieldNames(page.resource);
      if (!materializedFields.length) {
        findings.push(error("APPROVAL_FORM_FIELDS_PLANNED_FIELDS_MISSING", "Approval form page is only a template shell; planned field controls were not materialized.", { source: page.source, approvalForm: plannedFormKey, role, plannedFields: plannedFields.map((field) => field.displayName) }));
        continue;
      }
      for (const plannedField of plannedFields) {
        if (!materializedFields.some((actual) => fieldNameMatches(actual, plannedField.displayName))) {
          findings.push(error("APPROVAL_FORM_FIELDS_PLANNED_FIELD_NOT_MATERIALIZED", "A field planned in the Approval Forms Plan is missing from DefResource.pageurls[].formdef.", { source: page.source, approvalForm: plannedFormKey, role, field: plannedField.displayName, materializedFields }));
        }
      }
    }
  }
}

function collectMaterializedFieldNames(resource) {
  const names = [];
  for (const entry of flatten(resource)) {
    const node = entry.node;
    if (!isFieldControl(node)) continue;
    const candidates = [
      node.label,
      node.name,
      node.title,
      node.DisplayName,
      node.displayName,
      node.attrs?.label,
      node.attrs?.title,
      node.attrs?.data?.displayName,
    ].filter(Boolean).map(cleanCell).filter(Boolean);
    for (const candidate of candidates) {
      if (!names.some((name) => norm(name) === norm(candidate))) names.push(candidate);
    }
  }
  return names;
}

function fieldNameMatches(actual, expected) {
  const left = norm(actual);
  const right = norm(expected);
  return left === right || left.includes(right) || right.includes(left);
}

function collectApprovalFormPages(decoded) {
  const forms = [];
  for (const [formIndex, form] of asArray(decoded?.Forms || decoded?.Data?.Forms).entries()) {
    const def = decodeDefResource(form?.DefResource);
    for (const [pageIndex, page] of asArray(def?.pageurls).entries()) {
      if (!isObject(page?.formdef)) continue;
      const role = Number(page?.type) === 1 ? "submission" : Number(page?.type) === 2 ? "task" : "";
      forms.push({
        source: `${form?.Name || form?.Title || `Forms[${formIndex}]`} / ${page?.title || page?.name || `pageurls[${pageIndex}]`}`,
        formKey: norm(form?.Name || form?.Title || form?.Key || ""),
        sourceKey: norm(def?.name || def?.title || def?.key || def?.defkey || ""),
        role,
        resource: page.formdef,
      });
    }
  }
  for (const workflow of collectWorkflowTaskDefResources(decoded)) {
    const def = decodeDefResource(workflow.defResource);
    for (const [pageIndex, page] of asArray(def?.pageurls).entries()) {
      if (Number(page?.type) !== 2 || !isObject(page?.formdef)) continue;
      forms.push({
        source: `${workflow.source} / ${page?.title || page?.name || `task page ${pageIndex + 1}`}`,
        formKey: norm(workflow.source),
        sourceKey: norm(workflow.source),
        role: "task",
        resource: page.formdef,
      });
    }
  }
  return forms;
}

function collectWorkflowTaskDefResources(decoded) {
  const out = [];
  const seen = new Set();
  const roots = [
    ["DataListWorkflows", decoded?.DataListWorkflows],
    ["DataListWorkflow", decoded?.DataListWorkflow],
    ["ListWorkflows", decoded?.ListWorkflows],
    ["Workflows", decoded?.Workflows],
    ["ScheduleWorkflows", decoded?.ScheduleWorkflows],
    ["ScheduledWorkflows", decoded?.ScheduledWorkflows],
    ["Schedules", decoded?.Schedules],
    ["Processes", decoded?.Processes],
    ["Data.DataListWorkflows", decoded?.Data?.DataListWorkflows],
    ["Data.ScheduleWorkflows", decoded?.Data?.ScheduleWorkflows],
  ];
  for (const [label, value] of roots) collectDefResourceObjects(value, `$.${label}`, out, seen);
  return out.filter((entry) => asArray(decodeDefResource(entry.defResource)?.pageurls).some((page) => Number(page?.type) === 2));
}

function collectDefResourceObjects(value, pointer, out, seen) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectDefResourceObjects(item, `${pointer}[${index}]`, out, seen));
    return;
  }
  if (!isObject(value)) return;
  const defResource = value.DefResource || value.defResource || value.WorkflowResource || value.workflowResource;
  if (defResource) {
    const key = `${pointer}:${String(value.Name || value.Title || value.Key || value.ID || out.length)}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ source: `${value.Name || value.Title || value.Key || pointer}`, defResource });
    }
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === "Forms" || key === "DefResource" || key === "defResource" || key === "WorkflowResource" || key === "workflowResource") continue;
    if (/workflow|process|schedule/i.test(key)) collectDefResourceObjects(child, `${pointer}.${key}`, out, seen);
  }
}

function decodeDefResource(value) {
  if (isObject(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = parseJsonMaybe(value);
  if (isObject(parsed)) return parsed;
  try {
    const raw = Buffer.from(value, "base64");
    const payload = raw.subarray(0, BROTLI_PREFIX.length).equals(BROTLI_PREFIX)
      ? zlib.brotliDecompressSync(raw.subarray(BROTLI_PREFIX.length)).toString("utf8")
      : zlib.brotliDecompressSync(raw).toString("utf8");
    const decoded = JSON.parse(quoteLargeJsonIntegers(payload));
    return isObject(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

function hasApprovedSectionContentPlacement(root, node) {
  const entry = findEntry(root, node);
  if (!entry) return false;
  const slotIndex = entry.ancestors.findIndex((ancestor) => hasIdentity(ancestor, REQUIRED_PLACEMENT_SLOT));
  if (slotIndex === -1) return false;
  return entry.ancestors.slice(0, slotIndex).some((ancestor) => hasIdentity(ancestor, REQUIRED_CARD_WRAPPER));
}

function responsiveColumnCounts(grid) {
  const map = new Map();
  const columns = grid?.attrs?.columns || {};
  for (const [breakpoint, config] of Object.entries(columns)) {
    const count = asArray(config?.list).length || 0;
    if (count) map.set(String(breakpoint), count);
  }
  return map;
}

function responsiveColumnSpan(control) {
  const map = new Map();
  const position = control?.attrs?.common?.grid?.position || control?.attrs?.grid?.position;
  if (Array.isArray(position)) {
    for (let index = 1; index < position.length; index += 1) {
      const value = position[index];
      const span = Number(value?.cSpan);
      if (Number.isFinite(span)) map.set(String(index), span);
    }
  }
  const scalar = Number(control?.attrs?.common?.grid?.cSpan ?? control?.attrs?.grid?.cSpan);
  if (Number.isFinite(scalar)) map.set("1", scalar);
  return map;
}

function hasZeroMargin(control) {
  return isZeroMargin(control?.attrs?.common?.margin) || isZeroMargin(control?.attrs?.margin);
}

function isZeroMargin(value) {
  const obj = Array.isArray(value) ? value.find((item) => isObject(item)) : value;
  if (!isObject(obj)) return false;
  return ["top", "right", "bottom", "left"].every((side) => isZeroValue(obj[side]));
}

function isZeroValue(value) {
  return value === 0 || value === "0" || value === "--sp--s0" || value === "var(--sp--s0)";
}

function hasBusinessNavLabel(control) {
  const value = String(control?.nv_label || control?.nav_label || control?.attrs?.nv_label || control?.attrs?.nav_label || "").trim();
  if (!value) return false;
  const normalized = value.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (GENERIC_FIELD_NAV_LABELS.has(normalized)) return false;
  if (/^(input|textarea|richtext|list|field|control)[ _-]?\d*$/i.test(value)) return false;
  return true;
}

function isFieldControl(node) {
  return isObject(node) && FIELD_CONTROL_TYPES.has(String(node.type || ""));
}

function isFullRowRequired(node) {
  return isObject(node) && REQUIRED_FULL_ROW_TYPES.has(String(node.type || ""));
}

function normalizeTemplateResource(raw) {
  if (raw?.templateResource) return raw.templateResource;
  if (raw?._ak_c) return raw._ak_c;
  return raw;
}

function isReferenceTemplateSource(context) {
  return /\.template\.json$/i.test(String(context.source || ""));
}

function isInsideAny(node, ancestors) {
  return ancestors.some((ancestor) => ancestor === node || containsNode(ancestor, node));
}

function containsNode(root, target) {
  if (root === target) return true;
  for (const child of asArray(root?.children)) {
    if (containsNode(child, target)) return true;
  }
  return false;
}

function nearestDirectChildOfGrid(node, grid) {
  for (const child of asArray(grid.children)) {
    if (child === node || containsNode(child, node)) return child;
  }
  return null;
}

function findEntry(root, node) {
  return flatten(root).find((entry) => entry.node === node) || null;
}

function flatten(root, pointer = "$", ancestors = []) {
  if (!isObject(root)) return [];
  const current = { node: root, pointer, ancestors };
  const children = asArray(root.children).flatMap((child, index) => flatten(child, `${pointer}.children[${index}]`, ancestors.concat(root)));
  return [current].concat(children);
}

function hasIdentity(node, identity) {
  return identityCandidates(node).includes(identity);
}

function identityCandidates(node) {
  return [
    node?.id,
    node?.name,
    node?.label,
    node?.nv_label,
    node?.nav_label,
    node?.attrs?.name,
    node?.attrs?.nv_label,
    node?.attrs?.nav_label,
    node?.attrs?.approvalFormFieldsTemplateId,
    node?.attrs?.derivedFromApprovalFormFieldsTemplate,
    node?.approvalFormFieldsTemplateId,
    node?.derivedFromApprovalFormFieldsTemplate,
  ].filter(Boolean).map(String);
}

function tableRows(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .filter((line) => !/^\|\s*:?-{3,}:?/.test(line))
    .map((raw) => ({ raw }));
}

function isTableLine(line) {
  return /^\s*\|.+\|\s*$/.test(line || "");
}

function splitTableCells(line) {
  return String(line || "").trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(cleanCell);
}

function cleanCell(value) {
  return String(value || "").replace(/`/g, "").replace(/\*\*/g, "").trim();
}

function norm(value) {
  return cleanCell(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findHeaderIndex(headers, candidates) {
  const wanted = candidates.map(norm);
  return headers.findIndex((header) => wanted.includes(header));
}

function isPlaceholderFieldName(value) {
  const text = cleanCell(value);
  if (!text || /^<.+>$/.test(text)) return true;
  return /^(not applicable|n\/a|none|no|deferred|field|fields?|business label|display name|placeholder)$/i.test(text);
}

function extractSection(text, headingPattern) {
  const match = headingPattern.exec(text);
  if (!match) return "";
  const start = match.index;
  const rest = text.slice(start);
  const next = rest.slice(match[0].length).search(/\n##\s+\d+\.\s+/);
  return next === -1 ? rest : rest.slice(0, match[0].length + next);
}

function readJson(file, findings, code) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    findings.push(error(code, `Could not read JSON: ${err.message}`, { file }));
    return null;
  }
}

function error(code, message, detail = {}) {
  return { level: "error", code, message, detail };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") args.help = true;
    else if (token === "--registry") {
      args.registry = argv[i + 1] || REGISTRY_PATH;
      if (argv[i + 1] && !argv[i + 1].startsWith("--")) i += 1;
    } else if (token === "--resource") {
      args.resource = argv[i + 1];
      i += 1;
    } else if (token === "--package") {
      args.package = argv[i + 1];
      i += 1;
    } else if (token === "--plan") {
      args.plan = argv[i + 1];
      i += 1;
    } else if (token === "--surface") {
      args.surface = argv[i + 1];
      i += 1;
    } else {
      throw new Error(`Unexpected argument: ${token}`);
    }
  }
  return args;
}

function printUsage() {
  console.error([
    "Usage:",
    "  node scripts/validate-approval-form-fields-template.mjs --registry docs/reference/approval-form-field-layout-templates.json",
    "  node scripts/validate-approval-form-fields-template.mjs --resource <resource.json> [--surface approval-form]",
    "  node scripts/validate-approval-form-fields-template.mjs --package <app.yapk> [--plan <yeeflow-app-plan.md>]",
    "  node scripts/validate-approval-form-fields-template.mjs --plan <yeeflow-app-plan.md>",
  ].join("\n"));
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

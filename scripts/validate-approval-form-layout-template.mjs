#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { asArray, isObject, parseJsonMaybe, quoteLargeJsonIntegers, readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = path.join(ROOT, "docs/reference/approval-form-layout-templates.json");
const SUBMISSION_TEMPLATE_ID = "approval_form_layout_submission_v1_1";
const TASK_TEMPLATE_ID = "approval_form_layout_task_v1_1";
const TEMPLATE_IDS = new Set([SUBMISSION_TEMPLATE_ID, TASK_TEMPLATE_ID]);
const TASK_WORKFLOW_SURFACES = new Set(["approval-form-task", "data-list-workflow-task", "schedule-workflow-task"]);
const BACKGROUND = "#f4f7fb";
const SECTION_CONTENT_AREA_GAP = "--sp--s200";
const ZERO_PADDING = { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" };
const CONTENT_WIDTH = 1280;
const ALLOWED_BUSINESS_SLOTS = new Set(["page_title_content", "Operations", "section_content_area", "section_title_header"]);
const REPEATABLE_MODULES = new Set(["1_columns_section", "content_card_wrapper", "2_columns_section", "3_columns_section", "2_columns_60/40_section", "content_card_60_wrapper", "content_card_40_wrapper"]);
const SECTION_MODULES = new Set(["1_columns_section", "2_columns_section", "3_columns_section", "2_columns_60/40_section"]);
const REQUIRED_REGIONS = ["main", "content", "page_title_section", "page_title_content", "page_title_text", "page_title_description", "1_columns_section", "content_card_wrapper", "section_title_area", "section_title_header", "section_content_area", "action_panel_flow_history_wrapper"];
const DATA_ANALYTICS_TYPES = new Set(["pie-chart", "column-chart", "bar-chart", "line-chart", "area-chart", "pivot-table", "summary"]);
const MEANINGFUL_BUSINESS_TYPES = new Set([
  "input",
  "textarea",
  "richtext",
  "rich-text",
  "radio",
  "checkbox",
  "switch",
  "date",
  "datetime",
  "number",
  "input_number",
  "lookup",
  "people",
  "user",
  "collection",
  "data-filter",
  "select-filter",
  "radio-filter",
  "checkbox-filter",
  "search-filter",
  "dynamic-field",
  "dynamic-user",
  "dynamic-image",
  "dynamic-file",
]);
const BROTLI_PREFIX = Buffer.from("::brotli::", "utf8");

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.registry && !args.resource && !args.package && !args.plan)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateApprovalFormLayoutTemplate(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateApprovalFormLayoutTemplate(options = {}) {
  const findings = [];
  const registryPath = path.resolve(options.registry || REGISTRY_PATH);
  const registry = readJson(registryPath, findings, "APPROVAL_FORM_LAYOUT_REGISTRY_MISSING");
  const references = new Map(asArray(registry?.templates).map((item) => [String(item?.templateId || ""), item]).filter(([id]) => id));
  validateRegistry(registry, references, findings, registryPath);

  if (options.resource) {
    const resource = readJson(path.resolve(options.resource), findings, "APPROVAL_FORM_LAYOUT_RESOURCE_MISSING");
    validateFormResource(resource, {
      findings,
      templateId: String(options.template || ""),
      pageRole: String(options.pageRole || options["page-role"] || ""),
      source: path.basename(options.resource),
      requireMarker: Boolean(options.template),
    });
  }

  if (options.package) validatePackage(path.resolve(options.package), { findings, appPlan: options.plan ? path.resolve(options.plan) : null });
  if (options.plan) validateAppPlan(path.resolve(options.plan), findings);

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    registry: registryPath,
    resource: options.resource ? path.resolve(options.resource) : null,
    package: options.package ? path.resolve(options.package) : null,
    appPlan: options.plan ? path.resolve(options.plan) : null,
    findings,
  };
}

function validateRegistry(registry, references, findings, registryPath) {
  if (!registry) return;
  for (const id of TEMPLATE_IDS) {
    if (!asArray(registry.approvedTemplateIds).includes(id) || !references.has(id)) {
      findings.push(error("APPROVAL_FORM_LAYOUT_TEMPLATE_REFERENCE_MISSING", "Approval Form Layouts v1.1 registry must include both approved template IDs.", { templateId: id }));
    }
  }
  for (const slot of ALLOWED_BUSINESS_SLOTS) {
    if (!asArray(registry.allowedBusinessContentContainers).includes(slot)) {
      findings.push(error("APPROVAL_FORM_LAYOUT_BUSINESS_SLOT_MISSING", "Registry must document every allowed business-content container.", { containerId: slot }));
    }
  }
  for (const moduleId of REPEATABLE_MODULES) {
    if (!asArray(registry.allowedRepeatableRemovableModules).includes(moduleId)) {
      findings.push(error("APPROVAL_FORM_LAYOUT_REPEATABLE_MODULE_MISSING", "Registry must document every repeatable/removable module.", { moduleId }));
    }
  }
  if (!asArray(registry.lockedContainers).includes("action_panel_flow_history_wrapper")) {
    findings.push(error("APPROVAL_FORM_LAYOUT_LOCKED_ACTION_HISTORY_MISSING", "Registry must lock action_panel_flow_history_wrapper.", {}));
  }
  const cleanup = registry.generatedCleanupRules || {};
  for (const key of ["unusedCopiedModulesMustBeRemoved", "operationsWithoutConfiguredActionsMustBeRemoved", "emptyContentCardSectionsMustBeRemoved", "lockedActionPanelFlowHistoryWrapperMustRemain", "taskFormsMirrorSubmissionFieldsByDefault", "taskFieldsReadonlyByDefault"]) {
    if (cleanup[key] !== true) {
      findings.push(error("APPROVAL_FORM_LAYOUT_CLEANUP_RULE_MISSING", "Registry must document generated Approval form cleanup hard rules.", { rule: key }));
    }
  }
  for (const reference of references.values()) {
    if (reference.templateId === TASK_TEMPLATE_ID) {
      for (const surface of TASK_WORKFLOW_SURFACES) {
        if (!asArray(reference.allowedWorkflowTaskSurfaces).includes(surface)) {
          findings.push(error("APPROVAL_FORM_LAYOUT_TASK_WORKFLOW_SURFACE_MISSING", "Task layout template must declare every approved workflow task surface.", { templateId: reference.templateId, surface }));
        }
      }
    }
    const templatePath = path.resolve(path.dirname(registryPath), "..", "..", reference.sourceTemplate || "");
    if (!fs.existsSync(templatePath)) {
      findings.push(error("APPROVAL_FORM_LAYOUT_TEMPLATE_FILE_MISSING", "Approval Form Layout template file is missing.", { templateId: reference.templateId, sourceTemplate: reference.sourceTemplate }));
      continue;
    }
    const template = readJson(templatePath, findings, "APPROVAL_FORM_LAYOUT_TEMPLATE_PARSE_FAILED");
    const resource = template?.templateResource;
    const expectedRole = reference.templateId === SUBMISSION_TEMPLATE_ID ? "submission" : "task";
    validateFormResource(resource, { findings, templateId: reference.templateId, pageRole: expectedRole, source: reference.displayName || reference.templateId, requireMarker: false, registryMode: true });
  }
}

function validatePackage(packagePath, context) {
  if (!fs.existsSync(packagePath)) {
    context.findings.push(error("APPROVAL_FORM_LAYOUT_PACKAGE_MISSING", "Package file is missing.", { package: packagePath }));
    return;
  }
  let decoded;
  try {
    ({ decoded } = readDecodedYapk(packagePath));
  } catch (err) {
    context.findings.push(error("APPROVAL_FORM_LAYOUT_PACKAGE_DECODE_FAILED", `Could not decode package Resource: ${err.message}`, { package: packagePath }));
    return;
  }
  for (const [formIndex, form] of asArray(decoded?.Forms || decoded?.Data?.Forms).entries()) {
    const def = decodeDefResource(form?.DefResource);
    if (!def) {
      context.findings.push(error("APPROVAL_FORM_LAYOUT_DEFRESOURCE_DECODE_FAILED", "Approval form DefResource must decode before Approval Form Layouts v1.1 validation.", { formIndex, formName: form?.Name || form?.Title || "" }));
      continue;
    }
    const pages = asArray(def.pageurls);
    const submissionPages = pages.filter((page) => Number(page?.type) === 1);
    if (submissionPages.length !== 1) {
      context.findings.push(error("APPROVAL_FORM_LAYOUT_SUBMISSION_PAGE_COUNT_INVALID", "Each Approval form must contain exactly one submission form page.", { formIndex, count: submissionPages.length }));
    }
    for (const [pageIndex, page] of pages.entries()) {
      if (!isObject(page?.formdef)) continue;
      const role = Number(page?.type) === 1 ? "submission" : Number(page?.type) === 2 ? "task" : "";
      if (!role) continue;
      validateFormResource(page.formdef, {
        findings: context.findings,
        templateId: role === "submission" ? SUBMISSION_TEMPLATE_ID : TASK_TEMPLATE_ID,
        pageRole: role,
        source: `${form?.Name || form?.Title || `Forms[${formIndex}]`} / ${page?.title || page?.name || `pageurls[${pageIndex}]`}`,
        requireMarker: true,
      });
      if (role === "task") validateTaskReadonlyGuidance(page.formdef, context.findings, `${formIndex}.${pageIndex}`);
    }
    validateTaskSubmissionFieldParity(submissionPages, pages, context.findings, form?.Name || form?.Title || `Forms[${formIndex}]`);
  }
  for (const workflow of collectWorkflowTaskDefResources(decoded)) {
    const def = decodeDefResource(workflow.defResource);
    if (!def) {
      context.findings.push(error("APPROVAL_FORM_LAYOUT_WORKFLOW_DEFRESOURCE_DECODE_FAILED", "Workflow task DefResource must decode before Approval Form Layouts v1.1 validation.", { source: workflow.source }));
      continue;
    }
    const taskPages = asArray(def.pageurls).filter((page) => Number(page?.type) === 2);
    for (const [pageIndex, page] of taskPages.entries()) {
      if (!isObject(page?.formdef)) {
        context.findings.push(error("APPROVAL_FORM_LAYOUT_WORKFLOW_TASK_FORMDEF_MISSING", "Workflow task page must include a parseable formdef using approval_form_layout_task_v1_1.", { source: workflow.source, pageIndex }));
        continue;
      }
      validateFormResource(page.formdef, {
        findings: context.findings,
        templateId: TASK_TEMPLATE_ID,
        pageRole: "task",
        source: `${workflow.source} / ${page?.title || page?.name || `task page ${pageIndex + 1}`}`,
        requireMarker: true,
      });
      validateTaskReadonlyGuidance(page.formdef, context.findings, `${workflow.source}.${pageIndex}`);
    }
  }
}

function validateAppPlan(planPath, findings) {
  if (!fs.existsSync(planPath)) {
    findings.push(error("APPROVAL_FORM_LAYOUT_APP_PLAN_MISSING", "App Plan file is missing.", { plan: planPath }));
    return;
  }
  const text = fs.readFileSync(planPath, "utf8");
  validateWorkflowTaskAppPlanSelection(text, findings, "Schedule Workflows Plan", "schedule workflow task");
  validateWorkflowTaskAppPlanSelection(text, findings, "Data List Workflows Plan", "data list workflow task");
  const section = extractSection(text, /^##\s+5\.\s+Approval Forms Plan/im);
  if (!section.trim()) return;
  const hasApprovalForm = /Approval Form|Submission Form|Task Form|Task forms?/i.test(section) && /\|/.test(section);
  if (!hasApprovalForm) return;
  if (!/Approval Form Layout Template Selection/i.test(section)) {
    findings.push(error("APPROVAL_FORM_LAYOUT_APP_PLAN_SELECTION_TABLE_MISSING", "Approval Forms Plan must include an Approval Form Layout Template Selection table when approval forms are planned."));
    return;
  }
  const selectionBlock = subsectionAfterHeading(section, /####\s+Approval Form Layout Template Selection/i);
  const rows = tableRows(selectionBlock).filter((row) => !/^\|\s*(Approval Form|---)\s*\|/i.test(row.raw));
  const selectedIds = [];
  for (const row of rows) {
    const ids = [...row.raw.matchAll(/\bapproval_form_layout_[a-z0-9_]+\b/g)].map((match) => match[0]);
    selectedIds.push(...ids);
    for (const id of ids) {
      if (!TEMPLATE_IDS.has(id)) {
        findings.push(error("APPROVAL_FORM_LAYOUT_APP_PLAN_TEMPLATE_UNKNOWN", "Approval Form Layout Template Selection must use an approved Approval Form Layouts v1.1 template ID.", { templateId: id, row: row.raw }));
      }
    }
    const lower = row.raw.toLowerCase();
    if (/\bsubmission\b/.test(lower) && !row.raw.includes(SUBMISSION_TEMPLATE_ID)) {
      findings.push(error("APPROVAL_FORM_LAYOUT_APP_PLAN_SUBMISSION_TEMPLATE_MISMATCH", "Submission forms must select approval_form_layout_submission_v1_1.", { row: row.raw }));
    }
    if (/\btask\b/.test(lower) && !row.raw.includes(TASK_TEMPLATE_ID)) {
      findings.push(error("APPROVAL_FORM_LAYOUT_APP_PLAN_TASK_TEMPLATE_MISMATCH", "Task forms must select approval_form_layout_task_v1_1.", { row: row.raw }));
    }
  }
  if (!selectedIds.length) {
    findings.push(error("APPROVAL_FORM_LAYOUT_APP_PLAN_TEMPLATE_SELECTION_REQUIRED", "Approval Forms Plan must select approved templates for submission and task forms.", {}));
  }
}

function subsectionAfterHeading(section, headingPattern) {
  const match = headingPattern.exec(section);
  if (!match) return "";
  const after = section.slice(match.index + match[0].length);
  return after.split(/\n####\s+/)[0] || "";
}

function validateWorkflowTaskAppPlanSelection(text, findings, sectionName, expectedSurface) {
  const section = extractNamedSection(text, sectionName);
  if (!section.trim()) return;
  const actionableRows = tableRows(section).map((row) => row.raw).filter((row) => !/^\|\s*(Workflow|---)\s*\|/i.test(row));
  const hasTaskFormNeed = actionableRows.some((row) => /\b(task form|task page|assignment task|user task|approval_form_layout_task_v1_1)\b/i.test(row));
  if (!hasTaskFormNeed) return;
  if (!/Workflow Task Form Layout Template Selection/i.test(section)) {
    findings.push(error("APPROVAL_FORM_LAYOUT_WORKFLOW_TASK_SELECTION_TABLE_MISSING", `${sectionName} must include a Workflow Task Form Layout Template Selection table when workflow task forms are planned.`, { section: sectionName }));
    return;
  }
  const selectionBlock = section.split(/#### Workflow Task Form Layout Template Selection/i)[1]?.split(/####|##\s+\d+\./i)[0] || "";
  const rows = tableRows(selectionBlock).filter((row) => row.cells[0]?.toLowerCase() !== "workflow");
  const selectedRows = rows.filter((row) => row.raw.includes(TASK_TEMPLATE_ID) || /\btask\b/i.test(row.raw));
  if (!selectedRows.length) {
    findings.push(error("APPROVAL_FORM_LAYOUT_WORKFLOW_TASK_TEMPLATE_SELECTION_REQUIRED", `${sectionName} must select approval_form_layout_task_v1_1 for each generated workflow task form.`, { section: sectionName }));
    return;
  }
  for (const row of selectedRows) {
    const ids = [...row.raw.matchAll(/\bapproval_form_layout_[a-z0-9_]+\b/g)].map((match) => match[0]);
    for (const id of ids) {
      if (id !== TASK_TEMPLATE_ID) {
        findings.push(error("APPROVAL_FORM_LAYOUT_WORKFLOW_TASK_TEMPLATE_UNKNOWN", "Workflow task forms may only use approval_form_layout_task_v1_1.", { section: sectionName, templateId: id, row: row.raw }));
      }
    }
    if (!row.raw.includes(TASK_TEMPLATE_ID)) {
      findings.push(error("APPROVAL_FORM_LAYOUT_WORKFLOW_TASK_TEMPLATE_MISMATCH", "Workflow task forms must select approval_form_layout_task_v1_1.", { section: sectionName, row: row.raw }));
    }
    if (expectedSurface && !new RegExp(expectedSurface.replace(/\s+/g, "\\s+"), "i").test(row.raw)) {
      findings.push(error("APPROVAL_FORM_LAYOUT_WORKFLOW_TASK_SURFACE_MISSING", "Workflow task template selection row must identify the workflow task surface.", { section: sectionName, expectedSurface, row: row.raw }));
    }
  }
}

function validateFormResource(resource, context) {
  if (!isObject(resource)) {
    context.findings.push(error("APPROVAL_FORM_LAYOUT_RESOURCE_INVALID", "Approval form page resource must parse as an object.", { source: context.source }));
    return;
  }
  const actualTemplateId = resolveTemplateId(resource);
  const templateId = actualTemplateId || context.templateId || "";
  if (context.requireMarker && !TEMPLATE_IDS.has(actualTemplateId)) {
    context.findings.push(error("APPROVAL_FORM_LAYOUT_TEMPLATE_MARKER_MISSING", "Generated approval form pages must declare the selected Approval Form Layout template ID.", { source: context.source, expected: context.templateId || null }));
  }
  if (context.templateId && actualTemplateId && actualTemplateId !== context.templateId) {
    context.findings.push(error("APPROVAL_FORM_LAYOUT_TEMPLATE_MISMATCH", "Approval form page template marker does not match its expected page role.", { source: context.source, expected: context.templateId, actual: actualTemplateId }));
  }
  validateRootShell(resource, context);
  validateRequiredRegions(resource, context);
  validateForbiddenFamilies(resource, context);
  validateSectionContentAreaGap(resource, context);
  validateBusinessSlots(resource, context);
}

function validateSectionContentAreaGap(resource, context) {
  for (const entry of flatten(resource)) {
    if (!hasIdentity(entry.node, "section_content_area")) continue;
    const gap = entry.node?.attrs?.style?.gap;
    if (tupleValue(gap) !== SECTION_CONTENT_AREA_GAP) {
      context.findings.push(error("APPROVAL_FORM_LAYOUT_SECTION_CONTENT_AREA_GAP_INVALID", "section_content_area must preserve attrs.style.gap [null,\"--sp--s200\"] in Approval Form golden reference templates and generated forms.", { source: context.source, path: entry.pointer, actual: gap ?? null }));
    }
  }
}

function validateRootShell(resource, context) {
  const background = resource?.attrs?.background?.classic?.color || resource?.attrs?.background?.color || null;
  if (normalizeColor(background) !== BACKGROUND) {
    context.findings.push(error("APPROVAL_FORM_LAYOUT_BACKGROUND_INVALID", "Approval form root background must be #f4f7fb.", { source: context.source, actual: background }));
  }
  if (resource?.attrs?.container?.cw !== "2" || !isZeroTokenPadding(resource?.attrs?.container?.padding)) {
    context.findings.push(error("APPROVAL_FORM_LAYOUT_ROOT_CONTENT_AREA_INVALID", "Approval form root must preserve full-width content area and token-array zero padding.", { source: context.source, container: resource?.attrs?.container || null }));
  }
  const css = String(resource?.attrs?.common?.css || "");
  if (!/\.form-name[\s\S]*display\s*:\s*none\s*!important/i.test(css)) {
    context.findings.push(error("APPROVAL_FORM_LAYOUT_HIDE_FORM_NAME_CSS_MISSING", "Approval form layout must preserve custom CSS that hides the native form title.", { source: context.source }));
  }
  const main = findFirstByIdentity(resource, "main");
  const content = asArray(main?.children).find((child) => hasIdentity(child, "content"));
  if (!main || !content) {
    context.findings.push(error("APPROVAL_FORM_LAYOUT_MAIN_CONTENT_MISSING", "Approval form layout must contain main > content.", { source: context.source }));
    return;
  }
  if (tupleValue(main?.attrs?.style?.direction) !== "column") context.findings.push(error("APPROVAL_FORM_LAYOUT_MAIN_COLUMN_MISSING", "Main container must preserve column layout.", { source: context.source }));
  if (tupleValue(content?.attrs?.style?.widthtype) !== "3" || tupleValue(content?.attrs?.style?.width) !== CONTENT_WIDTH) {
    context.findings.push(error("APPROVAL_FORM_LAYOUT_CONTENT_CUSTOM_WIDTH_INVALID", "Content container must preserve custom width 1280px.", { source: context.source, widthtype: content?.attrs?.style?.widthtype || null, width: content?.attrs?.style?.width || null }));
  }
  if (!isColumnContainer(content)) context.findings.push(error("APPROVAL_FORM_LAYOUT_CONTENT_COLUMN_MISSING", "Content container must preserve column layout.", { source: context.source }));
}

function validateRequiredRegions(resource, context) {
  for (const id of REQUIRED_REGIONS) {
    if (!findFirstByIdentity(resource, id)) {
      context.findings.push(error("APPROVAL_FORM_LAYOUT_REQUIRED_REGION_MISSING", "Approval form layout is missing a required template region.", { source: context.source, region: id }));
    }
  }
  const actionWrapper = findFirstByIdentity(resource, "action_panel_flow_history_wrapper");
  if (actionWrapper) {
    if (!findFirstByType(actionWrapper, "workflowControlPanel")) context.findings.push(error("APPROVAL_FORM_LAYOUT_ACTION_PANEL_MISSING", "action_panel_flow_history_wrapper must preserve the Action panel control.", { source: context.source }));
    if (!findFirstByType(actionWrapper, "workflowHistory")) context.findings.push(error("APPROVAL_FORM_LAYOUT_WORKFLOW_HISTORY_MISSING", "action_panel_flow_history_wrapper must preserve the workflow history control.", { source: context.source }));
  }
}

function validateForbiddenFamilies(resource, context) {
  if (findFirstByIdentity(resource, "kpi_metrics_wrapper")) {
    context.findings.push(error("APPROVAL_FORM_LAYOUT_KPI_METRICS_FORBIDDEN", "Approval form layouts must not include kpi_metrics_wrapper because Approval forms do not support Data Analytics controls.", { source: context.source }));
  }
  for (const entry of flatten(resource)) {
    const type = String(entry.node?.type || "");
    if (DATA_ANALYTICS_TYPES.has(type) || entry.node?.attrs?.dataAnalyticsTemplateId) {
      context.findings.push(error("APPROVAL_FORM_LAYOUT_DATA_ANALYTICS_FORBIDDEN", "Approval form layouts must not use Data Analytics templates or controls.", { source: context.source, path: entry.pointer, type }));
    }
  }
}

function validateBusinessSlots(resource, context) {
  const content = findFirstByIdentity(resource, "content");
  for (const child of asArray(content?.children)) {
    const ids = identityCandidates(child);
    const knownSection = ids.some((id) => REPEATABLE_MODULES.has(id) || id === "page_title_section");
    if (!knownSection) {
      context.findings.push(error("APPROVAL_FORM_LAYOUT_INVENTED_ROOT_MODULE", "Business controls or invented layout modules must not be direct children of root Content; copy an approved section module and place business content in an allowed slot.", { source: context.source, identities: ids }));
    }
  }
  for (const card of [...findAllByIdentity(resource, "content_card_wrapper"), ...findAllByIdentity(resource, "content_card_60_wrapper"), ...findAllByIdentity(resource, "content_card_40_wrapper")]) {
    if (!findFirstByIdentity(card, "section_title_area")) context.findings.push(error("APPROVAL_FORM_LAYOUT_SECTION_TITLE_AREA_MISSING", "Every content card wrapper must preserve section_title_area.", { source: context.source }));
    if (!findFirstByIdentity(card, "section_content_area")) context.findings.push(error("APPROVAL_FORM_LAYOUT_SECTION_CONTENT_AREA_MISSING", "Every content card wrapper must preserve section_content_area.", { source: context.source }));
  }
  if (!context.registryMode) validateGeneratedModuleCleanup(resource, context);
  for (const entry of flatten(resource)) {
    const type = String(entry.node?.type || "");
    if (!isBusinessControlType(type)) continue;
    if (isWorkflowLockedControl(entry, resource) || isInsideAllowedBusinessSlot(entry, resource)) continue;
    context.findings.push(error("APPROVAL_FORM_LAYOUT_BUSINESS_CONTROL_OUTSIDE_ALLOWED_SLOT", "Business controls must be placed only inside approved Approval Form v1.1 business-content slots.", { source: context.source, path: entry.pointer, type, identities: identityCandidates(entry.node) }));
  }
}

function validateGeneratedModuleCleanup(resource, context) {
  for (const entry of flatten(resource)) {
    if (hasIdentity(entry.node, "Operations") && !hasActionConfiguration(entry.node)) {
      context.findings.push(error("APPROVAL_FORM_LAYOUT_OPERATIONS_WITHOUT_ACTIONS", "Generated Approval form Operations containers must be removed unless they contain real configured Yeeflow actions.", { source: context.source, path: entry.pointer }));
    }
    if (hasIdentity(entry.node, "section_content_area") && !containsLockedActionHistory(entry.node) && !hasWorkflowSurface(entry.node) && !hasMeaningfulBusinessContent(entry.node)) {
      context.findings.push(error("APPROVAL_FORM_LAYOUT_EMPTY_SECTION_CONTENT_AREA", "Generated Approval form section_content_area containers must be removed unless they contain real business content.", { source: context.source, path: entry.pointer }));
    }
    if (identityCandidates(entry.node).some((id) => SECTION_MODULES.has(id)) && !containsLockedActionHistory(entry.node) && !hasMeaningfulBusinessContent(entry.node)) {
      context.findings.push(error("APPROVAL_FORM_LAYOUT_UNUSED_SECTION_MODULE", "Generated Approval form section modules must be removed when they do not contain real business content.", { source: context.source, path: entry.pointer }));
    }
  }
}

function containsLockedActionHistory(node) {
  return Boolean(findFirstByIdentity(node, "action_panel_flow_history_wrapper"));
}

function hasWorkflowSurface(node) {
  return flatten(node).some((entry) => ["workflowControlPanel", "workflowHistory"].includes(String(entry.node?.type || "")));
}

function hasMeaningfulBusinessContent(node) {
  if (!isObject(node)) return false;
  return flatten(node).some((entry) => {
    const type = String(entry.node?.type || "");
    if (MEANINGFUL_BUSINESS_TYPES.has(type)) return true;
    if (entry.node?.approvalFormNoFieldsNotice === true) return true;
    if (identityCandidates(entry.node).some((id) => id === "form_grid_fields_wrapper" || id === "form_grid_fields_2col_wrapper" || id === "form_grid_fields_3col_wrapper")) return true;
    if (["button", "action_button"].includes(type) && hasActionConfiguration(entry.node)) return true;
    return false;
  });
}

function hasActionConfiguration(control) {
  const attrs = control?.attrs || {};
  if (attrs.control_action || attrs.action || attrs["action-type"] || attrs.actionType) return true;
  if (Array.isArray(attrs.actions) && attrs.actions.length) return true;
  if (Array.isArray(control?.actions) && control.actions.length) return true;
  return flatten(control).some((entry) => {
    if (entry.node === control) return false;
    const childAttrs = entry.node?.attrs || {};
    return Boolean(childAttrs.control_action || childAttrs.action || childAttrs["action-type"] || childAttrs.actionType || (Array.isArray(childAttrs.actions) && childAttrs.actions.length) || (Array.isArray(entry.node?.actions) && entry.node.actions.length));
  });
}

function validateTaskReadonlyGuidance(resource, findings, source) {
  for (const entry of flatten(resource)) {
    const type = String(entry.node?.type || "");
    if (!/^(input|textarea|richtext|rich-text|radio|checkbox|switch|date|datetime|datepicker|number|input_number|currency|lookup|people|user|identity-picker|image-upload|file-upload|list)$/i.test(type)) continue;
    const readonly = firstDefined(entry.node?.attrs?.readonly, entry.node?.attrs?.readOnly, entry.node?.readonly, entry.node?.readOnly);
    if (readonly !== true) {
      findings.push(error("APPROVAL_FORM_LAYOUT_TASK_FIELD_READONLY_REQUIRED", "Task form field controls must be explicitly readonly unless the App Plan declares assignee input is required.", { source, path: entry.pointer, type }));
    }
  }
}

function validateTaskSubmissionFieldParity(submissionPages, pages, findings, source) {
  const submissionPage = submissionPages.find((page) => isObject(page?.formdef));
  if (!submissionPage) return;
  const submissionFields = collectMaterializedApprovalFields(submissionPage.formdef);
  if (!submissionFields.length) return;
  const taskPages = asArray(pages).filter((page) => Number(page?.type) === 2 && isObject(page?.formdef));
  for (const [taskIndex, taskPage] of taskPages.entries()) {
    const taskFields = collectMaterializedApprovalFields(taskPage.formdef);
    const taskKeys = new Set(taskFields.map((field) => field.key));
    const missing = submissionFields.filter((field) => !taskKeys.has(field.key));
    if (missing.length) {
      findings.push(error("APPROVAL_FORM_LAYOUT_TASK_SUBMISSION_FIELD_MISSING", "Approval task forms must include every Submission form business field as readonly review context unless the App Plan explicitly excludes that field for that task.", {
        source,
        taskPage: taskPage.title || taskPage.name || `task page ${taskIndex + 1}`,
        missingFields: missing.map((field) => field.label),
      }));
    }
  }
}

function collectMaterializedApprovalFields(resource) {
  const fields = [];
  const seen = new Set();
  for (const entry of flatten(resource)) {
    const node = entry.node;
    const key = approvalFieldKey(node);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    fields.push({ key, label: node?.displayLabel || node?.title || node?.label || node?.name || node?.attrs?.data?.displayName || key });
  }
  return fields;
}

function approvalFieldKey(node) {
  if (!isObject(node)) return "";
  if (node.approvalFormNoFieldsNotice === true) return "";
  const type = String(node.type || "");
  if (!/^(input|textarea|richtext|rich-text|radio|checkbox|switch|date|datetime|datepicker|number|input_number|currency|lookup|people|user|identity-picker|image-upload|file-upload|list)$/i.test(type)) return "";
  const key = firstDefined(node.binding, node.fieldName, node.attrs?.data?.fieldName, node.attrs?.data?.field, node.attrs?.fieldName, node.attrs?.field);
  return normalizeFieldKey(key);
}

function normalizeFieldKey(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
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
  ];
  for (const [label, value] of roots) {
    collectDefResourceObjects(value, `$${label}`, out, seen);
  }
  collectDefResourceObjects(decoded?.Data?.DataListWorkflows, "$.Data.DataListWorkflows", out, seen);
  collectDefResourceObjects(decoded?.Data?.ScheduleWorkflows, "$.Data.ScheduleWorkflows", out, seen);
  return out.filter((entry) => {
    const def = decodeDefResource(entry.defResource);
    return asArray(def?.pageurls).some((page) => Number(page?.type) === 2);
  });
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

function resolveTemplateId(resource) {
  return String(resource?.approvalFormLayoutTemplateId || resource?.derivedFromApprovalFormLayoutTemplate || resource?.attrs?.approvalFormLayoutTemplateId || resource?.attrs?.derivedFromApprovalFormLayoutTemplate || "");
}

function isInsideAllowedBusinessSlot(entry, root) {
  const pathIdentities = ancestorsForPointer(root, entry.pointer).flatMap((node) => identityCandidates(node));
  return pathIdentities.some((id) => ALLOWED_BUSINESS_SLOTS.has(id));
}

function isWorkflowLockedControl(entry, root) {
  const pathIdentities = ancestorsForPointer(root, entry.pointer).flatMap((node) => identityCandidates(node));
  return pathIdentities.includes("action_panel_flow_history_wrapper") && ["workflowControlPanel", "workflowHistory"].includes(String(entry.node?.type || ""));
}

function ancestorsForPointer(root, pointer) {
  const indexes = [...pointer.matchAll(/\.children\[(\d+)\]/g)].map((match) => Number(match[1]));
  const nodes = [root];
  let current = root;
  for (const index of indexes) {
    current = asArray(current?.children)[index];
    if (!current) break;
    nodes.push(current);
  }
  return nodes;
}

function findFirstByIdentity(root, id) {
  return flatten(root).find((entry) => hasIdentity(entry.node, id))?.node || null;
}

function findAllByIdentity(root, id) {
  return flatten(root).filter((entry) => hasIdentity(entry.node, id)).map((entry) => entry.node);
}

function findFirstByType(root, type) {
  return flatten(root).find((entry) => String(entry.node?.type || "") === type)?.node || null;
}

function hasIdentity(node, id) {
  return identityCandidates(node).includes(id);
}

function identityCandidates(node) {
  return [
    node?.id,
    node?.name,
    node?.label,
    node?.title,
    node?.nv_label,
    node?.nav_label,
    node?.attrs?.name,
    node?.attrs?.label,
    node?.attrs?.nav_label,
    node?.attrs?.nv_label,
  ].filter(Boolean).map(String);
}

function flatten(root, pointer = "$", out = []) {
  if (!isObject(root)) return out;
  out.push({ node: root, pointer });
  asArray(root.children).forEach((child, index) => flatten(child, `${pointer}.children[${index}]`, out));
  return out;
}

function isBusinessControlType(type) {
  if (!type) return false;
  return !["container", "grid", "flex_grid"].includes(type);
}

function isColumnContainer(node) {
  return tupleValue(node?.attrs?.style?.direction) === "column" && tupleValue(node?.attrs?.style?.align_items) === "stretch";
}

function isZeroTokenPadding(value) {
  return JSON.stringify(tupleValue(value)) === JSON.stringify(ZERO_PADDING);
}

function tupleValue(value) {
  return Array.isArray(value) && value.length === 2 ? value[1] : value;
}

function normalizeColor(value) {
  return String(value || "").trim().toLowerCase();
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function tableRows(sectionText) {
  return sectionText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .filter((line) => !/^\|\s*:?-{3,}:?/.test(line))
    .filter((line) => !/<[^>]+>/.test(line))
    .map((raw) => ({ raw, cells: raw.split("|").slice(1, -1).map((cell) => cell.trim()) }));
}

function extractSection(text, headingPattern) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => headingPattern.test(line));
  if (start < 0) return "";
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s+\d+\.\s+/.test(lines[index])) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}

function extractNamedSection(text, name) {
  const pattern = new RegExp(`^##\\s+\\d+\\.\\s+${escapeRegex(name)}\\s*$`, "im");
  return extractSection(text, pattern);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readJson(file, findings, code) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    findings.push(error(code, err.message, { file }));
    return null;
  }
}

function error(code, message, extra = {}) {
  return { level: "error", code, message, ...extra };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help") args.help = true;
    else if (token === "--registry") args.registry = argv[++index] || REGISTRY_PATH;
    else if (token === "--resource") args.resource = argv[++index];
    else if (token === "--template") args.template = argv[++index];
    else if (token === "--page-role" || token === "--pageRole") args.pageRole = argv[++index];
    else if (token === "--package") args.package = argv[++index];
    else if (token === "--plan" || token === "--app-plan") args.plan = argv[++index];
  }
  return args;
}

function printUsage() {
  console.error("Usage: node scripts/validate-approval-form-layout-template.mjs --registry [file] | --resource <formdef.json> --template <id> --page-role <submission|task> | --package <app.yapk> [--plan <yeeflow-app-plan.md>] | --plan <yeeflow-app-plan.md>");
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

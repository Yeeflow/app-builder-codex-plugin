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
const BACKGROUND = "#f4f7fb";
const ZERO_PADDING = { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" };
const CONTENT_WIDTH = 1280;
const ALLOWED_BUSINESS_SLOTS = new Set(["page_title_content", "Operations", "section_content_area", "section_title_header"]);
const REPEATABLE_MODULES = new Set(["1_columns_section", "content_card_wrapper", "2_columns_section", "3_columns_section", "2_columns_60/40_section", "content_card_60_wrapper", "content_card_40_wrapper"]);
const REQUIRED_REGIONS = ["main", "content", "page_title_section", "page_title_content", "page_title_text", "page_title_description", "1_columns_section", "content_card_wrapper", "section_title_area", "section_title_header", "section_content_area", "action_panel_flow_history_wrapper"];
const DATA_ANALYTICS_TYPES = new Set(["pie-chart", "column-chart", "bar-chart", "line-chart", "area-chart", "pivot-table", "summary"]);
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
  for (const reference of references.values()) {
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
  }
}

function validateAppPlan(planPath, findings) {
  if (!fs.existsSync(planPath)) {
    findings.push(error("APPROVAL_FORM_LAYOUT_APP_PLAN_MISSING", "App Plan file is missing.", { plan: planPath }));
    return;
  }
  const text = fs.readFileSync(planPath, "utf8");
  const section = extractSection(text, /^##\s+5\.\s+Approval Forms Plan/im);
  if (!section.trim()) return;
  const hasApprovalForm = /Approval Form|Submission Form|Task Form|Task forms?/i.test(section) && /\|/.test(section);
  if (!hasApprovalForm) return;
  if (!/Approval Form Layout Template Selection/i.test(section)) {
    findings.push(error("APPROVAL_FORM_LAYOUT_APP_PLAN_SELECTION_TABLE_MISSING", "Approval Forms Plan must include an Approval Form Layout Template Selection table when approval forms are planned."));
    return;
  }
  const selectionBlock = section.split(/#### Form Actions and Temp Variables|#### Sub List List Actions|##\s+6\./i)[0].split(/#### Approval Form Layout Template Selection/i)[1] || "";
  const rows = tableRows(selectionBlock);
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
  validateBusinessSlots(resource, context);
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
  for (const entry of flatten(resource)) {
    const type = String(entry.node?.type || "");
    if (!isBusinessControlType(type)) continue;
    if (isWorkflowLockedControl(entry, resource) || isInsideAllowedBusinessSlot(entry, resource)) continue;
    context.findings.push(error("APPROVAL_FORM_LAYOUT_BUSINESS_CONTROL_OUTSIDE_ALLOWED_SLOT", "Business controls must be placed only inside approved Approval Form v1.1 business-content slots.", { source: context.source, path: entry.pointer, type, identities: identityCandidates(entry.node) }));
  }
}

function validateTaskReadonlyGuidance(resource, findings, source) {
  for (const entry of flatten(resource)) {
    const type = String(entry.node?.type || "");
    if (!/^(input|textarea|rich-text|radio|checkbox|switch|date|datetime|number|input_number|lookup|people|user)$/i.test(type)) continue;
    const readonly = firstDefined(entry.node?.attrs?.readonly, entry.node?.attrs?.readOnly, entry.node?.readonly, entry.node?.readOnly);
    if (readonly === false) {
      findings.push(error("APPROVAL_FORM_LAYOUT_TASK_FIELD_READONLY_REQUIRED", "Task form field controls should be readonly unless the App Plan declares assignee input is required.", { source, path: entry.pointer, type }));
    }
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

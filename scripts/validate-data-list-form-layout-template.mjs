#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { asArray, isObject, parseJsonMaybe, readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = path.join(ROOT, "docs/reference/data-list-form-layout-templates.json");
const TEMPLATE_IDS = new Set(["data_list_form_layout_new_edit_v1_1", "data_list_form_layout_view_item_v1_1", "data_list_form_layout_workbench"]);
const NEW_EDIT_TEMPLATE_ID = "data_list_form_layout_new_edit_v1_1";
const VIEW_TEMPLATE_ID = "data_list_form_layout_view_item_v1_1";
const WORKBENCH_TEMPLATE_ID = "data_list_form_layout_workbench";
const VIEW_TEMPLATE_IDS = new Set([VIEW_TEMPLATE_ID, WORKBENCH_TEMPLATE_ID]);
const BACKGROUND = "#f4f7fb";
const SECTION_CONTENT_AREA_GAP = "--sp--s200";
const ZERO_PADDING = { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" };
const ALLOWED_BUSINESS_SLOTS = new Set(["page_title_content", "Operations", "section_content_area", "section_title_header", "kpi_card_wrapper", "primary_working_area", "right_side_panel", "chart_cards_section", "reverse_related_collection_section"]);
const REPEATABLE_MODULES = new Set(["1_columns_section", "content_card_wrapper", "2_columns_section", "3_columns_section", "2_columns_60/40_section", "kpi_metrics_wrapper", "kpi_card_wrapper", "kpi_cards_kpi_row", "1_row_section", "2_rows_section", "3_rows_section", "chart_cards_section", "right_side_panel", "reverse_related_collection_section"]);
const REMOVABLE_SECTION_MODULES = new Set(["1_columns_section", "content_card_wrapper", "content_card_60_wrapper", "content_card_40_wrapper", "2_columns_section", "3_columns_section", "2_columns_60/40_section", "1_row_section", "2_rows_section", "3_rows_section", "chart_cards_section", "right_side_panel"]);
const REQUIRED_NEW_EDIT_REGIONS = ["main", "content", "1_columns_section", "content_card_wrapper", "section_content_area"];
const REQUIRED_VIEW_REGIONS = ["main", "content", "page_title_section", "page_title_content", "page_title_text", "page_title_description", "1_columns_section", "content_card_wrapper", "section_content_area"];
const REQUIRED_WORKBENCH_REGIONS = ["main", "content", "page_title_header", "page_title_content", "page_title_text", "page_title_description", "main_work_queue_section", "main_work_queue_wrapper", "primary_working_area"];
const WORKBENCH_ROOT_MODULES = new Set(["page_title_header", "section_content_area", "kpi_cards_kpi_row", "main_work_queue_section"]);
const DATA_ANALYTICS_TYPES = new Set(["pie-chart", "bar-chart", "line-chart", "pivot-table", "summary"]);
const DATASET_TYPES = new Set(["collection", "data-table", "datatable", "data-list", "kanban", "timeline-v", "timeline-h", "document-library"]);
const FORM_USAGES = ["add", "edit", "view"];
const RESIDUAL_TEMPLATE_LABEL_PATTERNS = [
  /\bActive Loan Pipeline\b/i,
  /\bCoordinator guidance: prioritize overdue items and returns/i,
  /\bcurrent loan volume\b/i,
  /\breturn activity signal\b/i,
  /\bwatch coordinator follow-up\b/i,
  /\bOffice Asset records\b/i,
];

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.registry && !args.resource && !args.package && !args.plan)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateDataListFormLayoutTemplate(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateDataListFormLayoutTemplate(options = {}) {
  const findings = [];
  const registryPath = path.resolve(options.registry || REGISTRY_PATH);
  const registry = readJson(registryPath, findings, "DATA_LIST_FORM_LAYOUT_REGISTRY_MISSING");
  const references = new Map(asArray(registry?.templates).map((item) => [String(item?.templateId || ""), item]).filter(([id]) => id));
  validateRegistry(registry, references, findings, registryPath);

  if (options.resource) {
    const templateId = String(options.template || "");
    const formUsage = String(options.formUsage || "");
    const resource = readJson(path.resolve(options.resource), findings, "DATA_LIST_FORM_LAYOUT_RESOURCE_MISSING");
    validateFormResource(resource, { findings, templateId, formUsage, source: path.basename(options.resource), requireMarker: Boolean(templateId) });
  }

  const packageCoverage = options.package ? validatePackage(path.resolve(options.package), { findings, appPlan: options.plan ? path.resolve(options.plan) : null }) : null;
  if (options.plan) validateAppPlan(path.resolve(options.plan), findings, { packageCoverage });

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
      findings.push(error("DATA_LIST_FORM_LAYOUT_TEMPLATE_REFERENCE_MISSING", "Data List Form Layouts v1.1 registry must include both approved template IDs.", { templateId: id }));
    }
  }
  for (const slot of ALLOWED_BUSINESS_SLOTS) {
    if (!asArray(registry.allowedBusinessContentContainers).includes(slot)) {
      findings.push(error("DATA_LIST_FORM_LAYOUT_BUSINESS_SLOT_MISSING", "Registry must document every allowed business-content container.", { containerId: slot }));
    }
  }
  for (const moduleId of REPEATABLE_MODULES) {
    if (!asArray(registry.allowedRepeatableRemovableModules).includes(moduleId)) {
      findings.push(error("DATA_LIST_FORM_LAYOUT_REPEATABLE_MODULE_MISSING", "Registry must document every repeatable/removable module.", { moduleId }));
    }
  }
  const unusedPolicy = registry.unusedSectionPolicy || {};
  if (unusedPolicy.generatedFinalMustPruneUnusedSections !== true || unusedPolicy.emptySectionContentAreaForbidden !== true || unusedPolicy.titleOnlyCopiedSectionsForbidden !== true) {
    findings.push(error("DATA_LIST_FORM_LAYOUT_UNUSED_SECTION_POLICY_MISSING", "Registry must explicitly require generated-final Data List forms to prune unused copied sections and reject empty section_content_area containers.", { unusedSectionPolicy: unusedPolicy }));
  }
  for (const moduleId of REMOVABLE_SECTION_MODULES) {
    if (!asArray(unusedPolicy.appliesToModules).includes(moduleId)) {
      findings.push(error("DATA_LIST_FORM_LAYOUT_UNUSED_SECTION_POLICY_MODULE_MISSING", "Registry unused-section policy must list every generated-final removable section module.", { moduleId }));
    }
  }
  for (const reference of references.values()) {
    const templatePath = path.resolve(path.dirname(registryPath), "..", "..", reference.sourceTemplate || "");
    if (!fs.existsSync(templatePath)) {
      findings.push(error("DATA_LIST_FORM_LAYOUT_TEMPLATE_FILE_MISSING", "Data List Form Layout template file is missing.", { templateId: reference.templateId, sourceTemplate: reference.sourceTemplate }));
      continue;
    }
    const template = readJson(templatePath, findings, "DATA_LIST_FORM_LAYOUT_TEMPLATE_PARSE_FAILED");
    const resource = template?.templateResource;
    const expectedUsage = reference.templateId === NEW_EDIT_TEMPLATE_ID ? "new/edit" : "view";
    validateFormResource(resource, { findings, templateId: reference.templateId, formUsage: expectedUsage, source: reference.displayName || reference.templateId, requireMarker: false, registryMode: true });
  }
}

function validatePackage(packagePath, context) {
  if (!fs.existsSync(packagePath)) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUT_PACKAGE_MISSING", "Package file is missing.", { package: packagePath }));
    return;
  }
  let decoded;
  try {
    ({ decoded } = readDecodedYapk(packagePath));
  } catch (err) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUT_PACKAGE_DECODE_FAILED", `Could not decode package Resource: ${err.message}`, { package: packagePath }));
    return;
  }
  const usageByLayoutId = buildUsageByLayoutId(decoded);
  const packageCoverage = buildPackageFormCoverage(decoded);
  packageCoverage.reverseRelated = buildPackageReverseRelatedCoverage(decoded);
  validateListDisplayAssignments(decoded, context);
  let customFormCount = 0;
  for (const form of collectDataListForms(decoded)) {
    customFormCount += 1;
    validateCustomFormRuntimeSource(form, context);
    const usages = usageByLayoutId.get(String(form.layoutId)) || [];
    const expected = inferExpectedTemplate(form, usages);
    validateFormResource(form.resource, {
      findings: context.findings,
      templateId: expected.templateId,
      formUsage: expected.formUsage,
      source: `${form.listTitle} / ${form.title}`,
      requireMarker: true,
    });
  }
  if (customFormCount === 0) return packageCoverage;
  return packageCoverage;
}

function validateAppPlan(planPath, findings, context = {}) {
  if (!fs.existsSync(planPath)) {
    findings.push(error("DATA_LIST_FORM_LAYOUT_APP_PLAN_MISSING", "App Plan file is missing.", { plan: planPath }));
    return;
  }
  const text = fs.readFileSync(planPath, "utf8");
  validateAppPlanListCoverage(text, findings, context);
  validateAppPlanReverseRelatedSelections(text, findings, context);
  const section = extractSection(text, /^##\s+10\.\s+Custom Data List Forms Plan/im);
  if (!section.trim()) return;
  const hasCustomForms = /New\/Edit|New|Edit|View|Detail|Custom Data List Forms Plan/i.test(section) && /\|/.test(section);
  if (!hasCustomForms) return;
  if (!/Data List Form Layout Template Selection/i.test(section)) {
    findings.push(error("DATA_LIST_FORM_LAYOUT_APP_PLAN_SELECTION_TABLE_MISSING", "Custom Data List Forms Plan must include a Data List Form Layout Template Selection table when custom forms are planned."));
    return;
  }
  for (const row of tableRows(section)) {
    const line = row.raw;
    const found = [...TEMPLATE_IDS].filter((id) => line.includes(id));
    if (!found.length) continue;
    const cells = splitTableLine(line);
    const usageText = cleanName(cells[2] || line).toLowerCase();
    const selectedViewTemplate = [...VIEW_TEMPLATE_IDS].some((id) => line.includes(id));
    if (/(new|edit)/.test(usageText) && !line.includes(NEW_EDIT_TEMPLATE_ID)) {
      findings.push(error("DATA_LIST_FORM_LAYOUT_APP_PLAN_NEW_EDIT_TEMPLATE_MISMATCH", "New/Edit custom Data List forms must select data_list_form_layout_new_edit_v1_1.", { row: line }));
    }
    if (/\bview\b/.test(usageText) && !selectedViewTemplate) {
      findings.push(error("DATA_LIST_FORM_LAYOUT_APP_PLAN_VIEW_TEMPLATE_MISMATCH", "View custom Data List forms must select data_list_form_layout_view_item_v1_1 or data_list_form_layout_workbench.", { row: line }));
    }
    const rowList = cleanName(cells[0] || "");
    const packageCoverage = rowList ? context.packageCoverage?.get(norm(rowList)) : null;
    const generatedPackageAlreadyValidatesWorkbenchOpenMode = Boolean(context.packageCoverage);
    if (line.includes(WORKBENCH_TEMPLATE_ID) && !hasWorkbenchFullPageIntent(line) && !generatedPackageAlreadyValidatesWorkbenchOpenMode) {
      findings.push(error("DATA_LIST_FORM_LAYOUT_APP_PLAN_WORKBENCH_FULL_PAGE_REQUIRED", "Workbench View custom Data List forms must declare Full page opening in the App Plan.", { row: line }));
    }
  }
}

function validateAppPlanReverseRelatedSelections(text, findings, context = {}) {
  const section = extractSection(text, /^##\s+10\.\s+Custom Data List Forms Plan/im);
  if (!section.trim()) return;
  const rows = parseReverseRelatedPlanRows(section);
  const mentionsReverseRelated = /reverse[-\s]?related|related child list|child lookup field|current ListDataID/i.test(section);
  if (mentionsReverseRelated && !rows.length) {
    findings.push(error("DATA_LIST_FORM_REVERSE_RELATED_APP_PLAN_TABLE_MISSING", "Custom Data List Forms Plan must include a Reverse-Related Collection Selection table when reverse-related View Item sections are planned.", {}));
    return;
  }
  for (const row of rows) {
    if (!row.hostList || !row.viewItemForm || !row.childList || !row.childLookupField || !row.collectionTemplate) {
      findings.push(error("DATA_LIST_FORM_REVERSE_RELATED_APP_PLAN_ROW_INCOMPLETE", "Reverse-Related Collection Selection rows must name host list, View Item form, related child list, child lookup field, and approved Collection template.", { row: row.raw }));
      continue;
    }
    if (!/collection_control_grid_table|grid[-\s]?table/i.test(row.collectionTemplate)) {
      findings.push(error("DATA_LIST_FORM_REVERSE_RELATED_APP_PLAN_TEMPLATE_INVALID", "Reverse-related Data List View Item sections must use an approved grid-table Collection template for related child records.", { row: row.raw, actual: row.collectionTemplate }));
    }
    if (!/current\s+ListDataID/i.test(row.defaultValue) || !lineMentionsList(row.defaultValue, row.childLookupField)) {
      findings.push(error("DATA_LIST_FORM_REVERSE_RELATED_APP_PLAN_DEFAULT_VALUE_INVALID", "Reverse-related Add defaults must declare <child lookup FieldName> = current ListDataID.", { row: row.raw, expectedField: row.childLookupField }));
    }
    if (context.packageCoverage?.reverseRelated) {
      const match = context.packageCoverage.reverseRelated.find((entry) => {
        const hostMatches = lineMentionsList(entry.hostList, row.hostList);
        const childMatches = lineMentionsList(entry.childList, row.childList) || (entry.childListId && lineMentionsList(row.childList, entry.childListId));
        const lookupMatches = reverseRelatedLookupMatches(entry, row.childLookupField);
        return hostMatches && childMatches && lookupMatches;
      });
      if (!match) {
        findings.push(error("DATA_LIST_FORM_REVERSE_RELATED_APP_PLAN_NOT_MATERIALIZED", "App Plan planned a reverse-related Collection section, but the generated package does not contain the matching View Item section.", {
          hostList: row.hostList,
          viewItemForm: row.viewItemForm,
          childList: row.childList,
          childLookupField: row.childLookupField,
          collectionTemplate: row.collectionTemplate,
        }));
      }
    }
  }
}

function validateAppPlanListCoverage(text, findings, context = {}) {
  const plannedLists = parsePlannedDataLists(text);
  if (!plannedLists.length) return;
  const section = extractSection(text, /^##\s+10\.\s+Custom Data List Forms Plan/im);
  if (!section.trim()) {
    for (const list of plannedLists) {
      findings.push(error("DATA_LIST_FORM_LAYOUT_APP_PLAN_LIST_FORMS_MISSING", "Every planned Data List or Document Library must plan custom New/Edit and View forms, or explicitly declare a system/support-list exemption.", { list }));
    }
    return;
  }
  for (const list of plannedLists) {
    const listRows = tableRows(section).map((row) => row.raw).filter((line) => lineMentionsList(line, list));
    const sectionBody = subsectionForList(section, list);
    const evidence = [...listRows, sectionBody].join("\n");
    if (hasExplicitFormExemption(evidence)) continue;
    const packageCoverage = context.packageCoverage?.get(norm(list));
    if (!hasNewEditPlan(evidence) && packageCoverage?.newEdit !== true) {
      findings.push(error("DATA_LIST_FORM_LAYOUT_APP_PLAN_NEW_EDIT_FORM_REQUIRED", "Every planned Data List or Document Library must plan a New/Edit custom form using data_list_form_layout_new_edit_v1_1. Default New/Edit layouts are not generation-ready.", { list }));
    }
    if (!hasViewPlan(evidence) && packageCoverage?.view !== true) {
      findings.push(error("DATA_LIST_FORM_LAYOUT_APP_PLAN_VIEW_FORM_REQUIRED", "Every planned Data List or Document Library must plan a View custom form using data_list_form_layout_view_item_v1_1 or data_list_form_layout_workbench. Default View layouts are not generation-ready.", { list }));
    }
  }
}

function validateFormResource(resource, context) {
  if (!isObject(resource)) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUT_RESOURCE_INVALID", "Custom Data List form resource must parse as an object.", { source: context.source }));
    return;
  }
  const actualTemplateId = resolveTemplateId(resource);
  const templateId = actualTemplateId || context.templateId || "";
  if (context.requireMarker && !TEMPLATE_IDS.has(actualTemplateId)) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUT_TEMPLATE_MARKER_MISSING", "Generated custom Data List forms must declare the selected Data List Form Layout template ID.", { source: context.source, expected: context.templateId || null }));
  }
  if (context.templateId && actualTemplateId && actualTemplateId !== context.templateId) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUT_TEMPLATE_MISMATCH", "Custom Data List form template marker does not match its expected usage.", { source: context.source, expected: context.templateId, actual: templateId }));
  }
  validateRootShell(resource, context);
  validateUsageContract(resource, context.templateId || templateId, context);
  validateSectionContentAreaGap(resource, context);
  validateBusinessSlots(resource, context);
  validateReverseRelatedCollectionSections(resource, context);
}

function validateSectionContentAreaGap(resource, context) {
  for (const entry of flatten(resource)) {
    if (!hasIdentity(entry.node, "section_content_area")) continue;
    const gap = entry.node?.attrs?.style?.gap;
    if (tupleValue(gap) !== SECTION_CONTENT_AREA_GAP) {
      context.findings.push(error("DATA_LIST_FORM_LAYOUT_SECTION_CONTENT_AREA_GAP_INVALID", "section_content_area must preserve attrs.style.gap [null,\"--sp--s200\"] in Data List Form golden reference templates and generated forms.", { source: context.source, path: entry.pointer, actual: gap ?? null }));
    }
  }
}

function validateRootShell(resource, context) {
  const background = resource?.attrs?.background?.classic?.color || resource?.attrs?.background?.color || null;
  if (normalizeColor(background) !== BACKGROUND) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUT_BACKGROUND_INVALID", "Custom Data List form root background must be #f4f7fb.", { source: context.source, actual: background }));
  }
  if (resource?.attrs?.container?.cw !== "2" || !isZeroTokenPadding(resource?.attrs?.container?.padding)) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUT_ROOT_CONTENT_AREA_INVALID", "Custom Data List form root must preserve full-width content area and token-array zero padding.", { source: context.source, container: resource?.attrs?.container || null }));
  }
  const main = findFirstByIdentity(resource, "main") || findFirstByIdentity(resource, "Main");
  const content = asArray(main?.children).find((child) => hasIdentity(child, "content") || hasIdentity(child, "Content"));
  if (!main || !content) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUT_MAIN_CONTENT_MISSING", "Custom Data List form must contain main > content.", { source: context.source }));
    return;
  }
  if (tupleValue(main?.attrs?.style?.direction) !== "column") context.findings.push(error("DATA_LIST_FORM_LAYOUT_MAIN_COLUMN_MISSING", "Main container must preserve column layout.", { source: context.source }));
  if (!isColumnFullWidth(content)) context.findings.push(error("DATA_LIST_FORM_LAYOUT_CONTENT_FULL_WIDTH_COLUMN_MISSING", "Content container must preserve full-width column layout.", { source: context.source }));
  const contentChildren = asArray(content.children).filter((child) => isObject(child) && child.type);
  if (!contentChildren.length) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUT_CONTENT_EMPTY", "Custom Data List form content must contain selected business section containers.", { source: context.source }));
  }
}

function validateUsageContract(resource, templateId, context) {
  const expected = String(context.formUsage || "").toLowerCase();
  const newEditExpected = templateId === NEW_EDIT_TEMPLATE_ID || /new|edit/.test(expected);
  const workbenchExpected = templateId === WORKBENCH_TEMPLATE_ID;
  const viewExpected = !workbenchExpected && (templateId === VIEW_TEMPLATE_ID || /\bview\b/.test(expected));
  if (newEditExpected) {
    for (const id of REQUIRED_NEW_EDIT_REGIONS) requireIdentity(resource, id, context, "DATA_LIST_FORM_LAYOUT_NEW_EDIT_REQUIRED_REGION_MISSING");
    for (const id of ["page_title_section", "kpi_metrics_wrapper"]) {
      if (findFirstByIdentity(resource, id)) {
        context.findings.push(error("DATA_LIST_FORM_LAYOUT_NEW_EDIT_FORBIDDEN_REGION", "New/Edit custom Data List form template must not include View-only page title or KPI regions.", { source: context.source, region: id }));
      }
    }
    for (const entry of flatten(resource)) {
      const type = String(entry.node?.type || "");
      if (DATASET_TYPES.has(type) || DATA_ANALYTICS_TYPES.has(type)) {
        context.findings.push(error("DATA_LIST_FORM_LAYOUT_NEW_EDIT_RELATED_DATA_FORBIDDEN", "New/Edit custom Data List forms must focus on the current record and must not include related datasets, Collection templates, charts, pivot tables, or KPI analytics.", { source: context.source, path: entry.pointer, type }));
      }
    }
  }
  if (viewExpected) {
    for (const id of REQUIRED_VIEW_REGIONS) requireIdentity(resource, id, context, "DATA_LIST_FORM_LAYOUT_VIEW_REQUIRED_REGION_MISSING");
  }
  if (workbenchExpected) {
    for (const id of REQUIRED_WORKBENCH_REGIONS) requireIdentity(resource, id, context, "DATA_LIST_FORM_LAYOUT_WORKBENCH_REQUIRED_REGION_MISSING");
    if (/new|edit/.test(expected)) {
      context.findings.push(error("DATA_LIST_FORM_LAYOUT_WORKBENCH_FORBIDDEN_NEW_EDIT", "data_list_form_layout_workbench may only be used for View Item custom forms, never New Item or Edit Item.", { source: context.source, formUsage: context.formUsage || "" }));
    }
    if (resource?.attrs?.hideop !== true) {
      context.findings.push(error("DATA_LIST_FORM_LAYOUT_WORKBENCH_HIDE_DEFAULT_OPERATIONS_REQUIRED", "Workbench View forms must keep hide default operation buttons enabled and expose only explicitly configured operation controls.", { source: context.source, actual: resource?.attrs?.hideop ?? null }));
    }
  }
}

function validateBusinessSlots(resource, context) {
  const workbenchContext = (context.templateId || resolveTemplateId(resource)) === WORKBENCH_TEMPLATE_ID;
  for (const card of findAllByIdentity(resource, "content_card_wrapper")) {
    const slot = findFirstByIdentity(card, "section_content_area");
    if (!slot) {
      context.findings.push(error("DATA_LIST_FORM_LAYOUT_SECTION_CONTENT_AREA_MISSING", "Every content_card_wrapper must preserve section_content_area.", { source: context.source }));
    } else if (!context.registryMode && !hasMeaningfulBusinessContent(slot)) {
      context.findings.push(error("DATA_LIST_FORM_LAYOUT_EMPTY_SECTION_CONTENT_AREA", "Generated Data List form content card wrappers must not keep empty copied template sections; remove unused sections or materialize real business content.", { source: context.source, path: pointerForNode(resource, slot) }));
    }
  }
  if (!context.registryMode) {
    for (const area of findAllByIdentity(resource, "section_content_area")) {
      if (!hasMeaningfulBusinessContent(area)) {
        context.findings.push(error("DATA_LIST_FORM_LAYOUT_EMPTY_SECTION_CONTENT_AREA", "Generated Data List form section_content_area containers must be removed when they do not contain real business content.", { source: context.source, path: pointerForNode(resource, area) }));
      }
    }
    for (const entry of flatten(resource)) {
      const ids = identityCandidates(entry.node);
      const isRemovableModule = ids.some((id) => REMOVABLE_SECTION_MODULES.has(id));
      if (!isRemovableModule) continue;
      if (ids.includes("page_title_section") || findFirstByIdentity(entry.node, "page_title_content")) continue;
      if (!hasMeaningfulBusinessContent(entry.node)) {
        context.findings.push(error("DATA_LIST_FORM_LAYOUT_UNUSED_SECTION_MODULE", "Generated Data List form section modules must be removed when they do not contain real business content.", { source: context.source, path: entry.pointer, identities: ids }));
      }
    }
  }
  validateSectionTitleAreaPolicy(resource, context);
  if (!context.registryMode) {
    for (const entry of flatten(resource)) {
      const text = nodeText(entry.node);
      const pattern = RESIDUAL_TEMPLATE_LABEL_PATTERNS.find((candidate) => candidate.test(text));
      if (pattern) {
        context.findings.push(error("DATA_LIST_FORM_LAYOUT_TEMPLATE_RESIDUAL_LABEL", "Generated Data List forms must not retain unrelated source-template section labels or descriptions; map titles/descriptions to the current Data List purpose or remove the unused section.", { source: context.source, path: entry.pointer, text: text.slice(0, 200) }));
      }
    }
    for (const operations of findAllByIdentity(resource, "Operations")) {
      const descendants = flatten(operations).map((entry) => entry.node);
      const actionLike = descendants.filter((node) => isActionLooking(node));
      if (actionLike.length && !actionLike.some((node) => hasActionConfiguration(node))) {
        context.findings.push(error("DATA_LIST_FORM_LAYOUT_OPERATION_ACTION_BINDING_MISSING", "Operations containers may contain action-looking controls only when real Yeeflow action configuration exists.", { source: context.source }));
      }
    }
  }
  const content = findFirstByIdentity(resource, "content") || findFirstByIdentity(resource, "Content");
  for (const child of asArray(content?.children)) {
    const ids = identityCandidates(child);
    const knownSection = ids.some((id) => REPEATABLE_MODULES.has(id) || id === "page_title_section" || (workbenchContext && WORKBENCH_ROOT_MODULES.has(id)));
    if (!knownSection) {
      context.findings.push(error("DATA_LIST_FORM_LAYOUT_INVENTED_ROOT_MODULE", "Business controls or invented layout modules must not be direct children of root Content; copy an approved section module and place business content in an allowed slot.", { source: context.source, identities: ids }));
    }
  }
  if (workbenchContext) validateWorkbenchBusinessRules(resource, context);
  for (const entry of flatten(resource)) {
    const type = String(entry.node?.type || "");
    if (!isBusinessControlType(type)) continue;
    if (isInsideAllowedBusinessSlot(entry, resource)) continue;
    context.findings.push(error("DATA_LIST_FORM_LAYOUT_BUSINESS_CONTROL_OUTSIDE_ALLOWED_SLOT", "Business controls must be placed only inside approved Data List Form v1.1 business-content slots.", { source: context.source, path: entry.pointer, type, identities: identityCandidates(entry.node) }));
  }
}

function validateSectionTitleAreaPolicy(resource, context) {
  if (context.registryMode) return;
  for (const entry of flatten(resource)) {
    if (!hasIdentity(entry.node, "section_title_area")) continue;
    const hasHeader = Boolean(findFirstByIdentity(entry.node, "section_title_header"));
    const operations = findFirstByIdentity(entry.node, "Operations");
    const hasOperations = Boolean(operations && hasActionConfiguration(operations));
    if (!hasHeader && !hasOperations) {
      context.findings.push(error("DATA_LIST_FORM_LAYOUT_EMPTY_SECTION_TITLE_AREA", "Generated Data List forms must remove section_title_area when neither section_title_header nor configured Operations are needed.", { source: context.source, path: entry.pointer }));
    }
  }
}

function validateWorkbenchBusinessRules(resource, context) {
  if (context.registryMode) return;
  for (const section of findAllByIdentity(resource, "chart_cards_section")) {
    if (!hasMeaningfulBusinessContent(section)) {
      context.findings.push(error("DATA_LIST_FORM_LAYOUT_WORKBENCH_EMPTY_CHART_CARDS_SECTION", "Workbench chart_cards_section is optional and must be removed when no Data Analytics or other business content is materialized.", { source: context.source, path: pointerForNode(resource, section) }));
    }
    const analyticsCount = flatten(section).filter((entry) => DATA_ANALYTICS_TYPES.has(String(entry.node?.type || ""))).length;
    if (analyticsCount > 3) {
      context.findings.push(error("DATA_LIST_FORM_LAYOUT_WORKBENCH_CHART_CARDS_SECTION_TOO_MANY_ANALYTICS", "Workbench chart_cards_section should contain no more than three Data Analytics templates; create another chart_cards_section when more are needed.", { source: context.source, path: pointerForNode(resource, section), analyticsCount }));
    }
  }
  for (const panel of findAllByIdentity(resource, "right_side_panel")) {
    if (!hasMeaningfulBusinessContent(panel)) {
      context.findings.push(error("DATA_LIST_FORM_LAYOUT_WORKBENCH_EMPTY_RIGHT_SIDE_PANEL", "Workbench right_side_panel is optional and must be removed when it has no real business content.", { source: context.source, path: pointerForNode(resource, panel) }));
    }
  }
}

function validateReverseRelatedCollectionSections(resource, context) {
  if (context.registryMode) return;
  const sections = findReverseRelatedSections(resource);
  for (const section of sections) {
    const detail = reverseRelatedSectionDetail(section);
    const sectionPath = pointerForNode(resource, section);
    validateReverseRelatedSectionPlacement(section, detail, context, resource);
    const collection = findReverseRelatedCollection(section);
    if (!collection) {
      context.findings.push(error("DATA_LIST_FORM_REVERSE_RELATED_COLLECTION_MISSING", "Reverse-related View Item form sections must contain a child-list Collection.", { source: context.source, path: sectionPath, detail }));
      continue;
    }
    validateReverseRelatedOfficialSectionShape(section, collection, detail, context, resource);
    validateReverseRelatedCollectionOfficialShape(collection, detail, context, resource);
    validateReverseRelatedCollectionFilter(collection, detail, context, resource);
    validateReverseRelatedSearch(section, collection, context, resource);
    validateReverseRelatedAddButton(section, collection, detail, context, resource);
    validateReverseRelatedCollectionHasNoRowOperations(collection, detail, context, resource);
    validateReverseRelatedCollectionItemContext(collection, detail, context, resource);
  }
}

function validateReverseRelatedOfficialSectionShape(section, collection, detail, context, resource) {
  const sectionPath = pointerForNode(resource, section);
  const contentCard = findFirstByIdentity(section, "content_card_wrapper");
  const sectionContent = findFirstByIdentity(section, "section_content_area");
  const collectionWrapper = findReverseRelatedCollectionWrapper(section);
  const caption = collectionWrapper ? findFirstByIdentity(collectionWrapper, "grid_table_col_caption") : null;
  const operations = collectionWrapper ? findFirstByIdentity(collectionWrapper, "grid_table_col_operations") : null;
  const opNormal = operations ? findFirstByIdentity(operations, "op_normal") : null;
  const content = collectionWrapper ? findFirstByIdentity(collectionWrapper, "grid_table_col_content") : null;
  const header = content ? findFirstByIdentity(content, "grid_table_col_header") : null;
  const itemGrid = collection ? findFirstByIdentity(collection, "grid_col_item") : null;
  const missing = [];
  if (!contentCard) missing.push("content_card_wrapper");
  if (!sectionContent) missing.push("section_content_area");
  if (!collectionWrapper) missing.push("related_collection_wrapper");
  if (!caption) missing.push("grid_table_col_caption");
  if (!operations) missing.push("grid_table_col_operations");
  if (!opNormal) missing.push("op_normal");
  if (!content) missing.push("grid_table_col_content");
  if (!header) missing.push("grid_table_col_header");
  if (!itemGrid) missing.push("grid_col_item");
  if (missing.length) {
    context.findings.push(error(
      "DATA_LIST_FORM_REVERSE_RELATED_OFFICIAL_SECTION_SHAPE_MISMATCH",
      "Reverse-related View Item Collections must use the official designer-open .ydl section shape: 1_columns_section > content_card_wrapper > section_content_area > related Collection wrapper with caption, operations/op_normal, grid header, and Collection row grid.",
      { source: context.source, path: sectionPath, detail, missing },
    ));
    return;
  }
  const searchControls = flatten(opNormal).map((entry) => entry.node).filter((node) => String(node?.type || "") === "search-filter");
  const addButtons = flatten(opNormal).map((entry) => entry.node).filter(isReverseRelatedAddButton);
  if (!searchControls.length) {
    context.findings.push(error(
      "DATA_LIST_FORM_REVERSE_RELATED_SEARCH_OFFICIAL_SLOT_MISSING",
      "Reverse-related search-filter controls must live inside grid_table_col_operations > op_normal, matching the official .ydl shape.",
      { source: context.source, path: pointerForNode(resource, operations || section), detail },
    ));
  }
  if (detail.allowAdd !== false && !addButtons.length) {
    context.findings.push(error(
      "DATA_LIST_FORM_REVERSE_RELATED_ADD_OFFICIAL_SLOT_MISSING",
      "Reverse-related Add buttons must live inside grid_table_col_operations > op_normal, matching the official .ydl shape.",
      { source: context.source, path: pointerForNode(resource, operations || section), detail },
    ));
  }
}

function findReverseRelatedCollectionWrapper(section) {
  const wrappers = findAllByIdentity(section, "grid_table_col_caption")
    .map((caption) => findAncestorWithin(section, caption, (node) => findFirstByIdentity(node, "grid_table_col_content")))
    .filter(Boolean);
  return wrappers[0] || null;
}

function findAncestorWithin(root, target, predicate) {
  const stack = [{ node: root, ancestors: [] }];
  while (stack.length) {
    const { node, ancestors } = stack.pop();
    if (node === target) {
      for (let index = ancestors.length - 1; index >= 0; index -= 1) {
        if (predicate(ancestors[index])) return ancestors[index];
      }
      return null;
    }
    for (const child of asArray(node?.children)) stack.push({ node: child, ancestors: [...ancestors, node] });
  }
  return null;
}

function validateReverseRelatedSectionPlacement(section, detail, context, resource) {
  const entry = flatten(resource).find((item) => item.node === section);
  const sectionPath = entry?.pointer || pointerForNode(resource, section);
  if (String(section?.type || "") === "collection") {
    context.findings.push(error("DATA_LIST_FORM_REVERSE_RELATED_SECTION_WRAPPER_MISSING", "Reverse-related Collections must be wrapped by an independent View Item content section, not emitted as a loose Collection node.", { source: context.source, path: sectionPath, detail }));
    return;
  }
  const parent = entry?.ancestors?.[entry.ancestors.length - 1];
  const parentIds = identityCandidates(parent);
  const parentIsContent = parentIds.includes("content") || parentIds.includes("Content");
  const nestedInCurrentDetails = (entry?.ancestors || []).some((ancestor) => {
    const ids = identityCandidates(ancestor);
    return ids.some((id) => [
      "section_content_area",
      "content_card_wrapper",
      "content_card_60_wrapper",
      "content_card_40_wrapper",
      "form_grid_fields_wrapper",
      "current_item_fields_grid",
    ].includes(id));
  });
  if (!parentIsContent || nestedInCurrentDetails) {
    context.findings.push(error(
      "DATA_LIST_FORM_REVERSE_RELATED_INDEPENDENT_SECTION_REQUIRED",
      "Reverse-related View Item Collections must be independent Content child sections after the current-record details section; embedding them inside details cards, field grids, or section_content_area can make the designer load indefinitely.",
      { source: context.source, path: sectionPath, detail, parentIdentities: parentIds },
    ));
  }
}

function findReverseRelatedSections(resource) {
  const explicitSections = flatten(resource)
    .map((entry) => entry.node)
    .filter((node) => isReverseRelatedSection(node));
  const collectionSections = flatten(resource)
    .map((entry) => entry.node)
    .filter((node) => isReverseRelatedCollection(node));
  const sections = [...explicitSections];
  for (const collection of collectionSections) {
    if (sections.some((section) => section === collection || flatten(section).some((entry) => entry.node === collection))) continue;
    sections.push(collection);
  }
  return uniqueNodes(sections);
}

function isReverseRelatedSection(node) {
  if (!isObject(node)) return false;
  return Boolean(
    node.reverseRelatedCollectionSection ||
    node?.attrs?.reverseRelatedCollectionSection ||
    identityCandidates(node).some((id) => /reverse[_-]?related[_-]?collection[_-]?section/i.test(id))
  );
}

function isReverseRelatedCollection(node) {
  if (!isObject(node)) return false;
  if (String(node.type || "") !== "collection") return false;
  return Boolean(
    node.reverseRelatedCollection ||
    node?.attrs?.reverseRelatedCollection ||
    node?.reverseRelatedCollectionSection ||
    node?.attrs?.reverseRelatedCollectionSection ||
    node?.attrs?.reverseRelated ||
    node?.reverseRelated ||
    identityCandidates(node).some((id) => /reverse[_-]?related/i.test(id))
  );
}

function reverseRelatedSectionDetail(section) {
  const attrs = section?.attrs || {};
  const reverse = attrs.reverseRelated || section?.reverseRelated || {};
  const resolved = stringValue(attrs.childLookupField || section?.childLookupField || reverse.childLookupFieldResolved || reverse.childLookupField || reverse.lookupField || attrs.lookupField);
  const planned = stringValue(reverse.childLookupFieldPlanned || attrs.childLookupFieldPlanned || section?.childLookupFieldPlanned);
  return {
    hostList: stringValue(attrs.hostList || section?.hostList || reverse.hostList),
    childList: stringValue(attrs.childList || section?.childList || reverse.childList),
    childListId: stringValue(attrs.childListId || attrs.childListID || section?.childListId || reverse.childListId || reverse.ListID),
    childLookupField: resolved,
    childLookupFieldResolved: resolved,
    childLookupFieldPlanned: planned,
    childLookupFieldAliases: unique([resolved, planned, stringValue(reverse.childLookupField), stringValue(reverse.lookupField), stringValue(attrs.lookupField)]),
    allowAdd: booleanWithDefault(attrs.allowAdd ?? section?.allowAdd ?? reverse.allowAdd, true),
  };
}

function findReverseRelatedCollection(section) {
  const candidates = flatten(section).map((entry) => entry.node).filter((node) => String(node?.type || "") === "collection");
  return candidates.find((node) => isReverseRelatedCollection(node)) || candidates[0] || null;
}

function validateReverseRelatedCollectionFilter(collection, detail, context, resource) {
  const filters = asArray(collection?.attrs?.data?.filter || collection?.attrs?.filter);
  const path = pointerForNode(resource, collection);
  if (!filters.length) {
    context.findings.push(error("DATA_LIST_FORM_REVERSE_RELATED_FILTER_MISSING", "Reverse-related Collections must filter child records by the child lookup field and current host ListDataID.", { source: context.source, path, detail }));
    return;
  }
  const fieldName = detail.childLookupField;
  const matchingFieldFilters = fieldName ? filters.filter((filter) => filterFieldName(filter) === fieldName) : filters;
  if (fieldName && !matchingFieldFilters.length) {
    context.findings.push(error("DATA_LIST_FORM_REVERSE_RELATED_LOOKUP_FIELD_MISMATCH", "Reverse-related Collection filter left side must use the child lookup field declared for the section.", { source: context.source, path, expectedField: fieldName, actualFields: filters.map(filterFieldName).filter(Boolean) }));
    return;
  }
  const matchingIdFilter = matchingFieldFilters.find((filter) => containsCurrentListDataIdExpression(filter?.right ?? filter?.value ?? filter?.rightValue ?? filter));
  if (!matchingIdFilter) {
    context.findings.push(error("DATA_LIST_FORM_REVERSE_RELATED_FILTER_VALUE_INVALID", "Reverse-related Collection filter right side must be the current host item ListDataID expression, not parent display text, title, or a hardcoded ID.", { source: context.source, path, expectedField: fieldName || null }));
  }
}

function validateReverseRelatedCollectionOfficialShape(collection, detail, context, resource) {
  const attrs = collection?.attrs || {};
  const allowedAttrs = new Set(["data", "layout", "actions", "pagination"]);
  const unexpected = Object.keys(attrs).filter((key) => !allowedAttrs.has(key));
  if (unexpected.length) {
    context.findings.push(error(
      "DATA_LIST_FORM_REVERSE_RELATED_COLLECTION_ATTRS_UNOFFICIAL",
      "Reverse-related Collection nodes must use the official export runtime attrs surface: data, layout, actions, and pagination only. Generator metadata belongs on the owning section, not the Collection node.",
      { source: context.source, path: pointerForNode(resource, collection), detail, unexpectedAttrs: unexpected },
    ));
  }
}

function validateReverseRelatedSearch(section, collection, context, resource) {
  const searchControls = flatten(section).map((entry) => entry.node).filter((node) => String(node?.type || "") === "search-filter");
  if (!searchControls.length) return;
  const fulltext = asArray(collection?.attrs?.data?.fulltext || collection?.attrs?.fulltext);
  const collectionPath = pointerForNode(resource, collection);
  if (!fulltext.length) {
    context.findings.push(error("DATA_LIST_FORM_REVERSE_RELATED_SEARCH_FULLTEXT_MISSING", "Reverse-related Collection search-filter controls must be consumed by collection.attrs.data.fulltext.", { source: context.source, path: collectionPath }));
    return;
  }
  for (const search of searchControls) {
    const binding = stringValue(search?.binding || search?.attrs?.binding || search?.attrs?.filterVariable || search?.attrs?.variable);
    if (!binding) {
      context.findings.push(error("DATA_LIST_FORM_REVERSE_RELATED_SEARCH_BINDING_MISSING", "Reverse-related search-filter must declare a stable binding variable.", { source: context.source, path: pointerForNode(resource, search) }));
      continue;
    }
    const consumer = fulltext.find((entry) => containsVariableReference(entry?.value ?? entry, binding));
    if (!consumer) {
      context.findings.push(error("DATA_LIST_FORM_REVERSE_RELATED_SEARCH_BINDING_MISMATCH", "Reverse-related search-filter binding must match a collection.attrs.data.fulltext value expression.", { source: context.source, path: pointerForNode(resource, search), binding }));
      continue;
    }
    if (!asArray(consumer.fields).filter(Boolean).length) {
      context.findings.push(error("DATA_LIST_FORM_REVERSE_RELATED_SEARCH_FIELDS_MISSING", "Reverse-related Collection fulltext search must name at least one resolved child-list field.", { source: context.source, path: collectionPath, binding }));
    }
  }
}

function validateReverseRelatedAddButton(section, collection, detail, context, resource) {
  const addButtons = flatten(section).map((entry) => entry.node).filter(isReverseRelatedAddButton);
  if (!addButtons.length) {
    if (detail.allowAdd !== false) {
      context.findings.push(error("DATA_LIST_FORM_REVERSE_RELATED_ADD_BUTTON_MISSING", "Reverse-related Collection sections that allow child creation must include an Add action_button in the operations area.", { source: context.source, path: pointerForNode(resource, section), detail }));
    }
    return;
  }
  const lookupField = detail.childLookupField;
  const collectionListId = stringValue(collection?.attrs?.data?.list?.ListID || collection?.attrs?.data?.ListID || collection?.attrs?.list?.ListID);
  for (const button of addButtons) {
    const attrs = button?.attrs || {};
    const buttonPath = pointerForNode(resource, button);
    const targetListId = stringValue(attrs?.data?.list?.ListID || attrs?.data?.ListID || attrs?.list?.ListID);
    const expectedChildListId = detail.childListId || collectionListId;
    if (!targetListId) {
      context.findings.push(error("DATA_LIST_FORM_REVERSE_RELATED_ADD_TARGET_MISSING", "Reverse-related Add buttons must target the child Data List.", { source: context.source, path: buttonPath }));
    } else if (expectedChildListId && targetListId !== expectedChildListId) {
      context.findings.push(error("DATA_LIST_FORM_REVERSE_RELATED_ADD_TARGET_MISMATCH", "Reverse-related Add button target list must match the related child Collection source list.", { source: context.source, path: buttonPath, expectedChildListId, actualListId: targetListId }));
    }
    if (!attrs.control_action && !attrs.action && !button.control_action && !button.action) {
      context.findings.push(error("DATA_LIST_FORM_REVERSE_RELATED_ADD_ACTION_MISSING", "Reverse-related Add buttons must include a runtime action/control_action binding.", { source: context.source, path: buttonPath }));
    }
    const passvalues = asArray(attrs.passvalues || attrs.passValues || button.passvalues || button.passValues);
    if (!passvalues.length) {
      context.findings.push(error("DATA_LIST_FORM_REVERSE_RELATED_PASSVALUES_MISSING", "Reverse-related Add buttons must pass the current host ListDataID into the child lookup field.", { source: context.source, path: buttonPath, expectedField: lookupField || null }));
      continue;
    }
    const mapping = lookupField ? passvalues.find((item) => stringValue(item?.Name || item?.name || item?.field || item?.FieldName) === lookupField) : passvalues.find((item) => containsCurrentListDataIdExpression(item?.Value ?? item?.value));
    if (!mapping) {
      context.findings.push(error("DATA_LIST_FORM_REVERSE_RELATED_PASSVALUES_LOOKUP_FIELD_MISSING", "Reverse-related Add button passvalues must map the child lookup field.", { source: context.source, path: buttonPath, expectedField: lookupField || null, actualFields: passvalues.map((item) => stringValue(item?.Name || item?.name || item?.field || item?.FieldName)).filter(Boolean) }));
      continue;
    }
    if (!containsCurrentListDataIdExpression(mapping?.Value ?? mapping?.value)) {
      context.findings.push(error("DATA_LIST_FORM_REVERSE_RELATED_PASSVALUES_VALUE_INVALID", "Reverse-related Add button passvalues value must be the current host item ListDataID expression.", { source: context.source, path: buttonPath, expectedField: lookupField || null }));
    }
  }
}

function validateReverseRelatedCollectionHasNoRowOperations(collection, detail, context, resource) {
  for (const entry of flatten(collection)) {
    const node = entry.node;
    if (!isReverseRelatedRowOperationResidue(node)) continue;
    context.findings.push(error(
      "DATA_LIST_FORM_REVERSE_RELATED_ROW_OPERATION_UNPROVEN",
      "Reverse-related View Item Collections must not contain row operation/dropbar controls unless an export-proven row action structure is explicitly supported.",
      {
        source: context.source,
        path: pointerForNode(resource, node),
        detail,
        type: node?.type || "",
        identities: identityCandidates(node),
      },
    ));
  }
}

function validateReverseRelatedCollectionItemContext(collection, detail, context, resource) {
  for (const entry of flatten(collection)) {
    const node = entry.node;
    if (String(node?.type || "") !== "dynamic-field") continue;
    const attrs = node.attrs || {};
    const source = stringValue(attrs.source || node.source);
    const field = stringValue(attrs["obj-f"] || attrs.field || attrs.fieldName || node.field || node.FieldName);
    if (source !== "3") {
      context.findings.push(error(
        "DATA_LIST_FORM_REVERSE_RELATED_ITEM_CONTEXT_SOURCE_INVALID",
        "Reverse-related Collection item dynamic-field controls must use Collection item context source = \"3\".",
        { source: context.source, path: pointerForNode(resource, node), detail, actualSource: source || null, field: field || null },
      ));
    }
    if (!field) {
      context.findings.push(error(
        "DATA_LIST_FORM_REVERSE_RELATED_ITEM_FIELD_MISSING",
        "Reverse-related Collection item dynamic-field controls must bind an explicit child-list field.",
        { source: context.source, path: pointerForNode(resource, node), detail },
      ));
    }
    const extraBindingKeys = [];
    if (Object.prototype.hasOwnProperty.call(attrs, "field")) extraBindingKeys.push("attrs.field");
    if (Object.prototype.hasOwnProperty.call(attrs, "fieldName")) extraBindingKeys.push("attrs.fieldName");
    if (Object.prototype.hasOwnProperty.call(attrs, "data")) extraBindingKeys.push("attrs.data");
    if (Object.prototype.hasOwnProperty.call(node, "field")) extraBindingKeys.push("field");
    if (Object.prototype.hasOwnProperty.call(node, "FieldName")) extraBindingKeys.push("FieldName");
    if (extraBindingKeys.length) {
      context.findings.push(error(
        "DATA_LIST_FORM_REVERSE_RELATED_ITEM_CONTEXT_EXTRA_BINDINGS",
        "Reverse-related Collection row dynamic-field controls must use the simple official item-context shape: attrs.source = \"3\" and attrs.obj-f only. Extra generated field/data bindings can make the designer load indefinitely.",
        { source: context.source, path: pointerForNode(resource, node), detail, extraBindingKeys },
      ));
    }
  }
}

function isReverseRelatedRowOperationResidue(node) {
  if (!isObject(node)) return false;
  const type = String(node.type || "").toLowerCase();
  const ids = identityCandidates(node).join(" ");
  if (type === "dropbar") return true;
  if (/grid_table_col_item_op_menu|grid_table_col_item_operations|card_col_item_operations|row[_-]?operations/i.test(ids)) return true;
  if (type === "action_button") {
    const attrs = node.attrs || {};
    const text = [
      ids,
      node.label,
      node.title,
      node.name,
      attrs.operation,
      attrs["action-type"],
      attrs?.label?.value,
      attrs?.text?.value,
    ].filter(Boolean).join(" ");
    return /edit|delete|remove|bulk|selected|row[_-]?operation|op_menu/i.test(text);
  }
  return false;
}

function isReverseRelatedAddButton(node) {
  if (!isObject(node)) return false;
  if (String(node.type || "") !== "action_button") return false;
  const attrs = node.attrs || {};
  const actionType = stringValue(attrs["action-type"] || attrs.actionType || attrs.operation);
  const text = identityCandidates(node).concat([node?.label, attrs?.label?.value, attrs?.text?.value]).filter(Boolean).join(" ");
  return actionType === "5" || /\badd\b|new item|create/i.test(text);
}

function hasMeaningfulBusinessContent(node) {
  if (!node) return false;
  for (const entry of flatten(node)) {
    const current = entry.node;
    if (current === node) continue;
    const type = String(current?.type || "");
    if (isBusinessControlType(type)) return true;
    const ids = identityCandidates(current);
    if (ids.some((id) => id === "form_grid_fields_wrapper" || id === "data_list_form_control_sublist_v1_1")) return true;
    if (current?.dataListFormFieldsTemplateId || current?.derivedFromDataListFormFieldsTemplate) return true;
    if (current?.dataListFormControlTemplateId || current?.derivedFromDataListFormControlTemplate) return true;
    if (current?.collectionTemplateId || current?.dataAnalyticsTemplateId || current?.derivedFromCollectionTemplate || current?.derivedFromDataAnalyticsTemplate) return true;
  }
  return false;
}

function nodeText(node) {
  if (!isObject(node)) return "";
  const values = [];
  for (const key of ["text", "title", "value", "DisplayName", "description", "placeholder"]) {
    const value = node?.[key];
    if (typeof value === "string") values.push(value);
    else if (Array.isArray(value)) values.push(...value.filter((item) => typeof item === "string"));
  }
  for (const key of ["text", "title", "value", "description", "placeholder"]) {
    const value = node?.attrs?.[key];
    if (typeof value === "string") values.push(value);
    else if (Array.isArray(value)) values.push(...value.filter((item) => typeof item === "string"));
  }
  return values.join(" ");
}

function requireIdentity(resource, id, context, code) {
  if (!findFirstByIdentity(resource, id)) {
    context.findings.push(error(code, "Custom Data List form template is missing a required region.", { source: context.source, region: id }));
  }
}

function collectDataListForms(decoded) {
  const forms = [];
  for (const [childIndex, child] of asArray(decoded?.Childs || decoded?.Data?.Childs).entries()) {
    const listTitle = child?.List?.Title || child?.ListModel?.Title || child?.Title || child?.Name || `Childs[${childIndex}]`;
    for (const [layoutIndex, layout] of asArray(child?.Layouts || child?.Item?.Layouts).entries()) {
      if (Number(layout?.Type) !== 1) continue;
      const layoutResourceValue = asArray(layout?.LayoutInResources)[0]?.Resource;
      const resource = parseResource(layoutResourceValue);
      const layoutViewResource = parseResource(layout?.LayoutView);
      forms.push({
        listTitle,
        title: layout?.Title || `Layouts[${layoutIndex}]`,
        layoutId: layout?.LayoutID,
        layoutIndex,
        resource: resource || layoutViewResource,
        layoutViewResource,
        layoutResource: resource,
        layoutViewRaw: layout?.LayoutView,
        layoutResourceRaw: layoutResourceValue,
      });
    }
  }
  return forms;
}

function validateCustomFormRuntimeSource(form, context) {
  const detail = {
    list: form.listTitle,
    layout: form.title,
    layoutId: form.layoutId,
    layoutIndex: form.layoutIndex,
  };
  if (!isObject(form.layoutViewResource)) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUTVIEW_RESOURCE_MISSING", "Type 1 custom Data List form Layout.LayoutView must contain the complete form JSON used by runtime/designer, not a placeholder, blank, null, or omitted value.", detail));
    return;
  }
  if (!isObject(form.layoutResource)) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUTINRESOURCE_RESOURCE_MISSING", "Type 1 custom Data List form LayoutInResources[0].Resource must contain the complete form JSON.", detail));
    return;
  }
  if (isPlaceholderLayoutView(form.layoutViewResource)) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUTVIEW_PLACEHOLDER", "Type 1 custom Data List form Layout.LayoutView must not be a minimal/source placeholder. It must duplicate the complete form JSON so runtime and Designer can load fields.", { ...detail, layoutView: form.layoutViewResource }));
  }
  if (!sameStableJson(form.layoutViewResource, form.layoutResource)) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUTVIEW_RESOURCE_DRIFT", "Type 1 custom Data List form Layout.LayoutView must be equivalent to LayoutInResources[0].Resource. Runtime reads LayoutView, while export/materialization also carries LayoutInResources; both surfaces must stay aligned.", detail));
  }
}

function isPlaceholderLayoutView(value) {
  if (!isObject(value)) return false;
  const source = String(value.source || value.generatedBy || "").toLowerCase();
  return source.includes("minimal-resource-graph") || (!Array.isArray(value.children) && !value.type && !value._ak_c);
}

function sameStableJson(left, right) {
  return stableJson(left) === stableJson(right);
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(",")}]`;
  if (isObject(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function validateListDisplayAssignments(decoded, context) {
  for (const [childIndex, child] of asArray(decoded?.Childs || decoded?.Data?.Childs).entries()) {
    if (isExplicitListExempt(child)) continue;
    const listTitle = child?.List?.Title || child?.ListModel?.Title || child?.Title || child?.Name || `Childs[${childIndex}]`;
    const layoutViewValue = child?.List?.LayoutView || child?.ListModel?.LayoutView || child?.LayoutView;
    const layoutView = parseJsonMaybe(layoutViewValue);
    if (!isObject(layoutView)) {
      context.findings.push(error("DATA_LIST_FORM_LAYOUT_DISPLAY_SETTINGS_MISSING", "Every generated business Data List must assign New/Edit/View to custom Data List forms through LayoutView.add/edit/view. Default layouts are not allowed.", { list: listTitle, childIndex }));
      continue;
    }
    const layouts = new Map(asArray(child?.Layouts || child?.Item?.Layouts).map((layout) => [String(layout?.LayoutID || ""), layout]));
    for (const usage of FORM_USAGES) {
      const value = layoutView?.[usage];
      if (value === undefined || value === null || String(value).trim() === "") {
        context.findings.push(error("DATA_LIST_FORM_LAYOUT_USAGE_MISSING", "Every generated business Data List must assign add/edit/view to custom Data List form layout IDs.", { list: listTitle, usage, childIndex }));
        continue;
      }
      const layoutId = String(value);
      if (layoutId.toLowerCase() === "default") {
        context.findings.push(error("DATA_LIST_FORM_LAYOUT_DEFAULT_USAGE_FORBIDDEN", "Generated business Data Lists must not use Yeeflow default layout for New Item, Edit Item, or View Item. Generate and assign custom Data List forms instead.", { list: listTitle, usage, actual: layoutId, childIndex }));
        continue;
      }
      const layout = layouts.get(layoutId);
      if (!layout) {
        context.findings.push(error("DATA_LIST_FORM_LAYOUT_USAGE_UNRESOLVED", "Data List form display setting points to a layout ID that does not belong to this list.", { list: listTitle, usage, layoutId, childIndex }));
        continue;
      }
      if (Number(layout?.Type) !== 1) {
        context.findings.push(error("DATA_LIST_FORM_LAYOUT_USAGE_NOT_CUSTOM_FORM", "Data List form display setting must point to a Type 1 custom Data List form layout.", { list: listTitle, usage, layoutId, actualType: layout?.Type ?? null, childIndex }));
      }
      const layoutResource = parseResource(asArray(layout?.LayoutInResources)[0]?.Resource || layout?.LayoutView);
      const selectedTemplate = resolveTemplateId(layoutResource);
      if (selectedTemplate === WORKBENCH_TEMPLATE_ID && usage !== "view") {
        context.findings.push(error("DATA_LIST_FORM_LAYOUT_WORKBENCH_FORBIDDEN_DISPLAY_USAGE", "data_list_form_layout_workbench can only be assigned to ListModel.LayoutView.view.", { list: listTitle, usage, layoutId, childIndex }));
      }
      if (usage === "view" && selectedTemplate === WORKBENCH_TEMPLATE_ID && String(layoutView?.opentype?.view || "").toLowerCase() !== "new") {
        context.findings.push(error("DATA_LIST_FORM_LAYOUT_WORKBENCH_VIEW_FULL_PAGE_REQUIRED", "Workbench item-detail View forms must be opened as Full page through ListModel.LayoutView.opentype.view.", { list: listTitle, usage, layoutId, expectedOpenType: "new", actualOpenType: layoutView?.opentype?.view ?? null, childIndex }));
      }
    }
  }
}

function isExplicitListExempt(child) {
  const candidates = [
    child?.dataListFormLayoutPolicy,
    child?.customFormPolicy,
    child?.formLayoutPolicy,
    child?.List?.dataListFormLayoutPolicy,
    child?.List?.customFormPolicy,
    child?.List?.formLayoutPolicy,
    child?.ListModel?.dataListFormLayoutPolicy,
    child?.ListModel?.customFormPolicy,
    child?.ListModel?.formLayoutPolicy,
  ].map((value) => String(value || "").toLowerCase());
  return Boolean(child?.IsSystem || child?.List?.IsSystem || child?.ListModel?.IsSystem || candidates.some((value) => /system-support-exempt|support-exempt|custom-forms-exempt|exempt/.test(value)));
}

function buildUsageByLayoutId(decoded) {
  const usageByLayoutId = new Map();
  for (const child of asArray(decoded?.Childs || decoded?.Data?.Childs)) {
    const view = parseJsonMaybe(child?.List?.LayoutView || child?.ListModel?.LayoutView || child?.LayoutView);
    for (const usage of ["add", "edit", "view"]) {
      const layoutId = view?.[usage];
      if (!layoutId) continue;
      const key = String(layoutId);
      if (!usageByLayoutId.has(key)) usageByLayoutId.set(key, []);
      usageByLayoutId.get(key).push(usage);
    }
  }
  return usageByLayoutId;
}

function inferExpectedTemplate(form, usages) {
  const title = String(form.title || "").toLowerCase();
  const marker = resolveTemplateId(form.resource) || resolveTemplateId(form.layoutViewResource);
  if (marker === WORKBENCH_TEMPLATE_ID || /\bworkbench\b/.test(title)) return { templateId: WORKBENCH_TEMPLATE_ID, formUsage: "view" };
  if (marker === VIEW_TEMPLATE_ID) return { templateId: VIEW_TEMPLATE_ID, formUsage: "view" };
  if (marker === NEW_EDIT_TEMPLATE_ID) return { templateId: NEW_EDIT_TEMPLATE_ID, formUsage: "new/edit" };
  if (usages.includes("view") || /\bview\b|detail/.test(title)) return { templateId: VIEW_TEMPLATE_ID, formUsage: "view" };
  if (usages.includes("add") || usages.includes("edit") || /new|edit|create/.test(title)) return { templateId: NEW_EDIT_TEMPLATE_ID, formUsage: "new/edit" };
  return { templateId: "", formUsage: "" };
}

function parseResource(value) {
  const parsed = parseJsonMaybe(value);
  if (isObject(parsed)) return parsed;
  if (isObject(value)) return value;
  return null;
}

function resolveTemplateId(resource) {
  for (const node of flatten(resource).map((entry) => entry.node)) {
    for (const candidate of [
      node?.derivedFromDataListFormLayoutTemplate,
      node?.dataListFormLayoutTemplateId,
      node?.attrs?.derivedFromDataListFormLayoutTemplate,
      node?.attrs?.dataListFormLayoutTemplateId,
      node?.attrs?.templateId,
    ]) {
      if (TEMPLATE_IDS.has(String(candidate || ""))) return String(candidate);
    }
  }
  return "";
}

function flatten(resource) {
  const entries = [];
  function visit(node, pointer, ancestors) {
    if (!isObject(node)) return;
    entries.push({ node, pointer, ancestors });
    for (const [key, child] of Object.entries(node)) {
      if (Array.isArray(child)) child.forEach((item, index) => visit(item, `${pointer}.${key}[${index}]`, ancestors.concat(node)));
      else if (isObject(child) && key !== "attrs") visit(child, `${pointer}.${key}`, ancestors.concat(node));
    }
  }
  visit(resource, "$", []);
  return entries;
}

function pointerForNode(resource, target) {
  return flatten(resource).find((entry) => entry.node === target)?.pointer || "$";
}

function findFirstByIdentity(resource, identity) {
  return flatten(resource).find((entry) => hasIdentity(entry.node, identity))?.node || null;
}

function findAllByIdentity(resource, identity) {
  return flatten(resource).filter((entry) => hasIdentity(entry.node, identity)).map((entry) => entry.node);
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
    node?.attrs?.goldenReferenceId,
    node?.attrs?.derivedFromGoldenReference,
  ].filter(Boolean).map(String);
}

function isInsideAllowedBusinessSlot(entry) {
  return entry.ancestors.some((ancestor) => identityCandidates(ancestor).some((id) => ALLOWED_BUSINESS_SLOTS.has(id)));
}

function isBusinessControlType(type) {
  return DATASET_TYPES.has(type) || DATA_ANALYTICS_TYPES.has(type) || ["input", "input_number", "radio", "select", "checkbox", "switch", "dynamic-field", "dynamic-user", "dynamic-image", "dynamic-file", "button"].includes(type);
}

function isColumnFullWidth(node) {
  const style = node?.attrs?.style || {};
  return tupleValue(style.direction) === "column" && tupleValue(style.widthtype) === "1";
}

function isZeroTokenPadding(value) {
  if (!Array.isArray(value) || !isObject(value[1])) return false;
  return Object.entries(ZERO_PADDING).every(([key, expected]) => value[1]?.[key] === expected);
}

function normalizeColor(value) {
  return String(value || "").trim().toLowerCase();
}

function tupleValue(value) {
  return Array.isArray(value) ? String(value[1] ?? "") : String(value ?? "");
}

function hasActionConfiguration(node) {
  const attrs = node?.attrs || {};
  return Boolean(attrs.control_action || attrs.action || attrs.actions || node?.actions || node?.action || node?.control_action);
}

function filterFieldName(filter) {
  return stringValue(filter?.left || filter?.field || filter?.FieldName || filter?.fieldName || filter?.name || filter?.Name);
}

function containsCurrentListDataIdExpression(value) {
  let found = false;
  walkJson(value, (node) => {
    if (found || !isObject(node)) return;
    const exprType = stringValue(node.exprType).toLowerCase();
    const prop = stringValue(node.prop || node.id || node.field || node.FieldName);
    const name = stringValue(node.name || node.label || node.title);
    if (exprType === "list_field" && (prop === "ListDataID" || prop === "Id" || /\b(?:List Fields|[^:]+):Id\b/i.test(name))) {
      found = true;
    }
  });
  return found;
}

function containsVariableReference(value, binding) {
  const expected = stringValue(binding);
  if (!expected) return false;
  let found = false;
  walkJson(value, (node) => {
    if (found) return;
    if (typeof node === "string" && node === expected) found = true;
    if (!isObject(node)) return;
    for (const candidate of [node.id, node.name, node.binding, node.value, node.variable, node.var]) {
      if (stringValue(candidate) === expected) found = true;
    }
  });
  return found;
}

function walkJson(value, fn) {
  fn(value);
  if (Array.isArray(value)) {
    for (const item of value) walkJson(item, fn);
    return;
  }
  if (!isObject(value)) return;
  for (const child of Object.values(value)) walkJson(child, fn);
}

function booleanWithDefault(value, defaultValue) {
  if (value === undefined || value === null || value === "") return defaultValue;
  if (typeof value === "boolean") return value;
  const text = String(value).trim().toLowerCase();
  if (["false", "0", "no"].includes(text)) return false;
  if (["true", "1", "yes"].includes(text)) return true;
  return defaultValue;
}

function stringValue(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function uniqueNodes(nodes) {
  const seen = new Set();
  const out = [];
  for (const node of nodes) {
    if (!node || seen.has(node)) continue;
    seen.add(node);
    out.push(node);
  }
  return out;
}

function isActionLooking(node) {
  const text = identityCandidates(node).join(" ");
  return /button|btn_|action|save|submit|delete|edit|export|add|create|operation/i.test(text);
}

function tableRows(text) {
  const rows = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (!/^\s*\|/.test(line) || /^\s*\|\s*:?-{3,}/.test(line)) continue;
    rows.push({ raw: line.trim() });
  }
  return rows;
}

function parseReverseRelatedPlanRows(section) {
  const rows = [];
  const subsections = extractSubsections(section, /Reverse-Related Collection Selection/i);
  for (const subsection of subsections) {
    const lines = subsection.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      if (!/^\s*\|.+\|\s*$/.test(lines[index] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1] || "")) continue;
      const headers = splitTableLine(lines[index]).map((header) => norm(header));
      const column = (...names) => headers.findIndex((header) => names.some((name) => header === norm(name) || header.includes(norm(name))));
      const hostColumn = column("Host Data List", "Host List", "Parent Data List");
      const formColumn = column("View Item Form", "View Form", "Custom Form");
      const childColumn = column("Related Child List", "Child List", "Related List");
      const lookupColumn = column("Child Lookup Field", "Lookup Field");
      const titleColumn = column("Section Title", "Title");
      const templateColumn = column("Collection Template", "Collection Presentation", "Template");
      const searchColumn = column("Search");
      const addColumn = column("Add Record", "Add");
      const defaultColumn = column("Default Value", "Default");
      let rowIndex = index + 2;
      while (rowIndex < lines.length && /^\s*\|.+\|\s*$/.test(lines[rowIndex] || "")) {
        const cells = splitTableLine(lines[rowIndex]);
        const raw = lines[rowIndex].trim();
        const hostList = cleanName(cells[hostColumn]);
        const childList = cleanName(cells[childColumn]);
        const childLookupField = cleanName(cells[lookupColumn]);
        if (hostList || childList || childLookupField) {
          rows.push({
            raw,
            hostList,
            viewItemForm: cleanName(cells[formColumn]),
            childList,
            childLookupField,
            sectionTitle: cleanName(cells[titleColumn]),
            collectionTemplate: cleanName(cells[templateColumn]),
            search: cleanName(cells[searchColumn]),
            addRecord: cleanName(cells[addColumn]),
            defaultValue: cleanName(cells[defaultColumn]),
          });
        }
        rowIndex += 1;
      }
      index = rowIndex;
    }
  }
  return rows;
}

function splitTableLine(line) {
  let trimmed = String(line || "").trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
  return trimmed.split("|").map((cell) => cell.trim());
}

function extractSubsection(text, marker) {
  const match = marker.exec(text);
  if (!match) return "";
  const start = match.index;
  const remainder = text.slice(start + match[0].length);
  const next = remainder.search(/\n#{2,4}\s+/);
  return next === -1 ? text.slice(start) : text.slice(start, start + match[0].length + next);
}

function extractSubsections(text, marker) {
  const flags = marker.flags.includes("g") ? marker.flags : `${marker.flags}g`;
  const globalMarker = new RegExp(marker.source, flags);
  const matches = [...text.matchAll(globalMarker)];
  return matches.map((match) => {
    const start = match.index;
    const remainder = text.slice(start + match[0].length);
    const next = remainder.search(/\n#{2,4}\s+/);
    return next === -1 ? text.slice(start) : text.slice(start, start + match[0].length + next);
  });
}

function parsePlannedDataLists(text) {
  const section = extractSection(text, /^##\s+4\.\s+Data Lists and Document Libraries Plan/im);
  if (!section.trim()) return [];
  const names = [];
  const lines = section.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    if (!/^\s*\|.+\|\s*$/.test(lines[index] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1] || "")) continue;
    const headers = splitTableLine(lines[index]).map((header) => norm(header));
    const listColumn = headers.findIndex((header) => ["list", "data list", "list name", "data list name", "document library name"].includes(header));
    if (listColumn === -1) continue;
    let rowIndex = index + 2;
    while (rowIndex < lines.length && /^\s*\|.+\|\s*$/.test(lines[rowIndex] || "")) {
      const cells = splitTableLine(lines[rowIndex]);
      const name = cleanName(cells[listColumn]);
      if (name && !isPlaceholderName(name)) names.push(name);
      rowIndex += 1;
    }
    index = rowIndex;
  }
  if (names.length) return unique(names);
  for (const match of section.matchAll(/^###\s+4\.[x0-9]+\s+(.+?)\s*$/gim)) {
    const name = cleanName(match[1]);
    if (!name || isPlaceholderName(name)) continue;
    if (/\b(?:schema|field|fields|table|selection|template|view|views)\b/i.test(name)) continue;
    names.push(name);
  }
  return unique(names);
}

function lineMentionsList(line, list) {
  const lineKey = norm(line);
  const listKey = norm(list);
  return Boolean(listKey && (lineKey.includes(listKey) || listKey.includes(lineKey)));
}

function subsectionForList(section, list) {
  const headings = [...section.matchAll(/^###\s+10\.[x0-9]+\s+(.+?)\s*$/gim)];
  for (let index = 0; index < headings.length; index += 1) {
    const match = headings[index];
    const name = cleanName(match[1]);
    if (!lineMentionsList(name, list)) continue;
    const next = headings[index + 1]?.index ?? section.length;
    return section.slice(match.index, next);
  }
  return "";
}

function hasExplicitFormExemption(text) {
  return /custom\s+data\s+list\s+forms?\s+(?:not\s+required|not\s+applicable|n\/a)|(?:system|support|technical|hidden)\s+(?:list|resource)[^.\n|]*(?:exempt|no\s+custom\s+forms|not\s+required)|form\s+layout\s+exemption/i.test(text || "");
}

function hasNewEditPlan(text) {
  const body = String(text || "");
  return body.includes(NEW_EDIT_TEMPLATE_ID) && /new\s*\/\s*edit|\bnew\b|\bedit\b/i.test(body);
}

function hasViewPlan(text) {
  const body = String(text || "");
  return [...VIEW_TEMPLATE_IDS].some((id) => body.includes(id)) && /\bview\b|detail/i.test(body);
}

function hasWorkbenchFullPageIntent(text) {
  const body = String(text || "");
  return /full\s*page|open\s*in\s*:\s*full|open\s+as\s+full|full-page/i.test(body);
}

function buildPackageFormCoverage(decoded) {
  const coverage = new Map();
  for (const [childIndex, child] of asArray(decoded?.Childs || decoded?.Data?.Childs).entries()) {
    if (isExplicitListExempt(child)) continue;
    const listTitle = cleanName(child?.List?.Title || child?.ListModel?.Title || child?.Title || child?.Name || `Childs[${childIndex}]`);
    const key = norm(listTitle);
    if (!key) continue;
    const entry = coverage.get(key) || { list: listTitle, newEdit: false, view: false, workbenchFullPage: false };
    const layoutView = parseJsonMaybe(child?.List?.LayoutView || child?.ListModel?.LayoutView || child?.LayoutView);
    const layouts = new Map(asArray(child?.Layouts || child?.Item?.Layouts).map((layout) => [String(layout?.LayoutID || ""), layout]));
    const addLayout = layouts.get(String(layoutView?.add || ""));
    const editLayout = layouts.get(String(layoutView?.edit || ""));
    const viewLayout = layouts.get(String(layoutView?.view || ""));
    if (layoutHasTemplate(addLayout, NEW_EDIT_TEMPLATE_ID) && layoutHasTemplate(editLayout, NEW_EDIT_TEMPLATE_ID)) entry.newEdit = true;
    const viewTemplate = layoutTemplateId(viewLayout);
    if (VIEW_TEMPLATE_IDS.has(viewTemplate)) entry.view = true;
    if (viewTemplate === WORKBENCH_TEMPLATE_ID && String(layoutView?.opentype?.view || "").toLowerCase() === "new") entry.workbenchFullPage = true;
    coverage.set(key, entry);
  }
  return coverage;
}

function buildPackageReverseRelatedCoverage(decoded) {
  const coverage = [];
  for (const form of collectDataListForms(decoded)) {
    const resource = form.resource;
    if (!isObject(resource)) continue;
    const sections = findReverseRelatedSections(resource);
    for (const section of sections) {
      const detail = reverseRelatedSectionDetail(section);
      const collection = findReverseRelatedCollection(section);
      const collectionList = collection?.attrs?.data?.list || collection?.attrs?.list || {};
      coverage.push({
        hostList: cleanName(detail.hostList || form.listTitle),
        viewItemForm: cleanName(form.title),
        childList: cleanName(detail.childList || collectionList.Title || collectionList.Name || ""),
        childListId: stringValue(detail.childListId || collectionList.ListID || collection?.attrs?.data?.ListID),
        childLookupField: stringValue(detail.childLookupField),
        childLookupFieldResolved: stringValue(detail.childLookupFieldResolved || detail.childLookupField),
        childLookupFieldPlanned: stringValue(detail.childLookupFieldPlanned),
        childLookupFieldAliases: asArray(detail.childLookupFieldAliases).filter(Boolean),
        sectionTitle: cleanName(sectionTitleText(section)),
        collectionTemplate: stringValue(collection?.collectionTemplateId || collection?.derivedFromCollectionTemplate || collection?.attrs?.collectionTemplateId || collection?.attrs?.derivedFromCollectionTemplate),
      });
    }
  }
  return coverage;
}

function reverseRelatedLookupMatches(entry, plannedLookupField) {
  const candidates = unique([
    entry?.childLookupField,
    entry?.childLookupFieldResolved,
    entry?.childLookupFieldPlanned,
    ...asArray(entry?.childLookupFieldAliases),
  ]);
  return candidates.some((candidate) => norm(candidate) === norm(plannedLookupField));
}

function sectionTitleText(section) {
  const titleNode = findFirstByIdentity(section, "grid_table_col_title") || findFirstByIdentity(section, "section_title_text") || findFirstByIdentity(section, "section_title_header");
  return titleNode?.attrs?.headc?.title?.value || titleNode?.attrs?.text?.value || titleNode?.attrs?.title?.value || titleNode?.title || titleNode?.label || "";
}

function layoutHasTemplate(layout, templateId) {
  return layoutTemplateId(layout) === templateId;
}

function layoutTemplateId(layout) {
  if (!layout) return "";
  return resolveTemplateId(parseResource(asArray(layout?.LayoutInResources)[0]?.Resource || layout?.LayoutView));
}

function cleanName(value) {
  return String(value ?? "").replace(/<[^>]+>/g, "").replace(/`/g, "").replace(/\s+/g, " ").trim();
}

function isPlaceholderName(value) {
  const text = cleanName(value);
  return !text || /^x$/i.test(text) || /^<.*>$/.test(String(value || "").trim()) || /^(list|library|data list|document library|name)$/i.test(text);
}

function norm(value) {
  return cleanName(value).replace(/[_-]+/g, " ").replace(/[^\p{L}\p{N} ]/gu, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function unique(values) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const key = norm(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function extractSection(text, marker) {
  const match = marker.exec(text);
  if (!match) return "";
  const start = match.index;
  const next = text.slice(start + match[0].length).search(/\n##\s+\d+\.\s+/);
  return next === -1 ? text.slice(start) : text.slice(start, start + match[0].length + next);
}

function readJson(filePath, findings, code) {
  if (!fs.existsSync(filePath)) {
    findings.push(error(code, "File is missing.", { path: filePath }));
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    findings.push(error(code, `Could not parse JSON: ${err.message}`, { path: filePath }));
    return null;
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") args.help = true;
    else if (token === "--registry") args.registry = argv[++index] || REGISTRY_PATH;
    else if (token === "--resource") args.resource = argv[++index];
    else if (token === "--template") args.template = argv[++index];
    else if (token === "--form-usage") args.formUsage = argv[++index];
    else if (token === "--package") args.package = argv[++index];
    else if (token === "--plan" || token === "--app-plan") args.plan = argv[++index];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/validate-data-list-form-layout-template.mjs --registry docs/reference/data-list-form-layout-templates.json
  node scripts/validate-data-list-form-layout-template.mjs --resource <form-resource.json> --template <template-id> --form-usage <new/edit/view>
  node scripts/validate-data-list-form-layout-template.mjs --package <app.yapk> [--plan <yeeflow-app-plan.md>]`);
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

function error(code, message, detail = {}) {
  return { level: "error", code, message, detail };
}

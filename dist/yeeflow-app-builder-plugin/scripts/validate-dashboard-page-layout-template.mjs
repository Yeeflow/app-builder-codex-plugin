#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { asArray, isObject, parseJsonMaybe, readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = path.join(ROOT, "docs/reference/dashboard-page-layout-templates.json");
const TEMPLATE_ID = "dashboard-page-layouts-v1.1";
const WORKBENCH_TEMPLATE_ID = "dashboard-page-layouts-workbench";
const BACKGROUND = "#f4f7fb";
const DEFAULT_REQUIRED_FULL_WIDTH_IDS = [
  "main",
  "content",
  "page_title_section",
  "page_title_header",
  "content_card_wrapper",
  "section_title_area",
  "section_content_area",
  "kpi_metrics_wrapper",
  "2_columns_section",
  "3_columns_section",
  "2_columns_60/40_section",
];
const DEFAULT_ALLOWED_BUSINESS_CONTENT_CONTAINERS = [
  "event_portfolio_pipeline_title_group",
  "Operations",
  "section_content_area",
  "section_title_header",
  "event_portfolio_kpi_planned_events",
  "event_portfolio_kpi_approved_budget",
  "event_portfolio_kpi_registration_rate",
  "event_portfolio_kpi_lead_follow_up",
];
const DEFAULT_ALLOWED_REPEATABLE_MODULES = [
  "content_card_wrapper",
  "2_columns_section",
  "3_columns_section",
  "2_columns_60/40_section",
  "kpi_cards_kpi_row",
  "event_portfolio_kpi_planned_events",
];
const TEMPLATE_TERMS = [
  "Template KPI",
  "Template Section",
  "Lorem",
  "Placeholder",
  "Campaign",
  "Registration",
  "Marketing Event",
];
const USER_FIELD_HINT = /\b(user|owner|assignee|requester|borrower|manager|approver|employee|person|people|accountid|account id)\b/i;

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.registry && !args.package && !args.runtimeProof && !args.upgradeScope)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateDashboardPageLayoutTemplate(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateDashboardPageLayoutTemplate(options = {}) {
  const findings = [];
  const registryPath = path.resolve(options.registry || REGISTRY_PATH);
  const registry = readJson(registryPath, findings, "DASH_LAYOUT_TEMPLATE_REGISTRY_MISSING");
  const template = findDefaultTemplate(registry);

  validateRegistry(registry, template, findings);
  if (options.package) validatePackage(path.resolve(options.package), template, findings, registry);
  if (options.runtimeProof) validateRuntimeProof(readJson(path.resolve(options.runtimeProof), findings, "DASH_LAYOUT_RUNTIME_PROOF_MISSING"), findings);
  if (options.upgradeScope) validateUpgradeScope(readJson(path.resolve(options.upgradeScope), findings, "DASH_LAYOUT_UPGRADE_SCOPE_MISSING"), findings);

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    registry: registryPath,
    package: options.package ? path.resolve(options.package) : null,
    runtimeProof: options.runtimeProof ? path.resolve(options.runtimeProof) : null,
    upgradeScope: options.upgradeScope ? path.resolve(options.upgradeScope) : null,
    findings,
  };
}

function validateRegistry(registry, template, findings) {
  if (!registry) return;
  if (!template) {
    findings.push(error("DASH_LAYOUT_TEMPLATE_DEFAULT_MISSING", "Dashboard Page Layouts registry must include dashboard-page-layouts-v1.1 as the default template."));
    return;
  }
  if (registry.defaultDashboardPageLayoutTemplateId !== TEMPLATE_ID) {
    findings.push(error("DASH_LAYOUT_TEMPLATE_DEFAULT_ID_INVALID", "Dashboard Page Layouts registry must keep dashboard-page-layouts-v1.1 as the default while allowing explicit alternate templates.", { actual: registry.defaultDashboardPageLayoutTemplateId || null }));
  }
  const templates = asArray(registry.templates);
  for (const templateId of [TEMPLATE_ID, WORKBENCH_TEMPLATE_ID]) {
    if (!templates.some((entry) => entry?.id === templateId)) {
      findings.push(error("DASH_LAYOUT_TEMPLATE_ID_MISSING", "Dashboard Page Layout registry must include every approved Dashboard page layout template.", { templateId }));
    }
  }
  for (const entry of templates) {
    if (!entry?.id) continue;
    if (entry.version !== entry.id) {
      findings.push(error("DASH_LAYOUT_TEMPLATE_VERSION_MISMATCH", "Dashboard Page Layout template version must match its approved template id.", { templateId: entry.id, actual: entry.version || null }));
    }
    const resource = entry.template?.parsedResource;
    if (!isObject(resource)) {
      findings.push(error("DASH_LAYOUT_TEMPLATE_RESOURCE_MISSING", "Dashboard Page Layout registry entries must preserve the parsedResource export-shaped page shell.", { templateId: entry.id }));
      continue;
    }
    validatePageShell(resource, findings, { layer: "TEMPLATE", page: entry.name || entry.id, requireDerivedMarker: false, allowTemplateOperations: true, template: entry });
    validateRegistryControlledSlotLists(entry, findings);
    for (const sectionType of requiredSectionTypes(entry)) {
      if (!asArray(entry.standardSectionTypes).includes(sectionType)) {
        findings.push(error("DASH_LAYOUT_TEMPLATE_SECTION_TYPE_MISSING", "Dashboard Page Layout registry must document every standard section type for each template.", { templateId: entry.id, sectionType }));
      }
    }
    const cleanup = entry.generatedCleanupRules || {};
    for (const key of requiredCleanupRules(entry)) {
      if (cleanup[key] !== true) {
        findings.push(error("DASH_LAYOUT_TEMPLATE_CLEANUP_RULE_MISSING", "Dashboard Page Layout registry must document generated cleanup hard rules.", { templateId: entry.id, rule: key }));
      }
    }
  }
}

function validatePackage(packagePath, template, findings, registry) {
  if (!fs.existsSync(packagePath)) {
    findings.push(error("DASH_LAYOUT_PACKAGE_MISSING", "Package file is missing.", { package: packagePath }));
    return;
  }
  let decoded;
  try {
    ({ decoded } = readDecodedYapk(packagePath));
  } catch (err) {
    findings.push(error("DASH_LAYOUT_PACKAGE_DECODE_FAILED", `Could not decode package Resource: ${err.message}`, { package: packagePath }));
    return;
  }
  const listIndex = buildListIndex(decoded);
  registry = registry || readJson(REGISTRY_PATH, findings, "DASH_LAYOUT_TEMPLATE_REGISTRY_MISSING") || {};
  for (const page of collectDashboardPages(decoded)) {
    const selectedTemplate = selectTemplateForResource(registry, page.resource) || template;
    validatePageShell(page.resource, findings, { layer: "RESOURCE", page: page.title, requireDerivedMarker: true, allowTemplateOperations: false, template: selectedTemplate });
    validateBusinessMapping(page.resource, findings, page.title);
    validateDataControls(page, listIndex, findings);
  }
}

function validateRegistryControlledSlotLists(template, findings) {
  const rules = templateRules(template);
  for (const id of rules.allowedBusinessContentContainers) {
    if (!asArray(template.allowedBusinessContentContainers).includes(id)) {
      findings.push(error("DASH_LAYOUT_TEMPLATE_BUSINESS_SLOT_MISSING", "Dashboard Page Layout registry must document every allowed business-content container.", { templateId: template?.id || null, containerId: id }));
    }
  }
  for (const id of rules.allowedRepeatableModules) {
    if (!asArray(template.allowedRepeatableRemovableModules).includes(id)) {
      findings.push(error("DASH_LAYOUT_TEMPLATE_REPEATABLE_MODULE_MISSING", "Dashboard Page Layout registry must document every repeatable/removable module.", { templateId: template?.id || null, moduleId: id }));
    }
  }
}

function requiredSectionTypes(template) {
  if (template?.id === WORKBENCH_TEMPLATE_ID) {
    return [
      "page title/header",
      "top filter group slot",
      "top KPI card row",
      "main work queue two-panel wrapper",
      "primary working area",
      "optional right-side panel",
      "data analytics chart card section",
    ];
  }
  return ["page title/header section", "1-column content card", "2-column section", "3-column section", "60/40 2-column section", "KPI metrics wrapper"];
}

function requiredCleanupRules(template) {
  const common = ["unusedCopiedModulesMustBeRemoved", "operationsWithoutConfiguredActionsMustBeRemoved", "emptySectionContentAreaForbidden", "titleOnlyCopiedSectionsForbidden", "emptyKpiMetricsWrapperForbidden", "kpiCardsMustMatchPlannedMetrics", "repeatableModulesMayBeReordered"];
  if (template?.id === WORKBENCH_TEMPLATE_ID) return [...common, "emptyChartCardsSectionForbidden", "emptyRightSidePanelMustBeRemoved"];
  return common;
}

function templateRules(template) {
  const id = template?.id || TEMPLATE_ID;
  const isWorkbench = id === WORKBENCH_TEMPLATE_ID;
  const allowedBusinessContentContainers = asArray(template?.allowedBusinessContentContainers).length
    ? asArray(template.allowedBusinessContentContainers)
    : DEFAULT_ALLOWED_BUSINESS_CONTENT_CONTAINERS;
  const allowedRepeatableModules = asArray(template?.allowedRepeatableRemovableModules).length
    ? asArray(template.allowedRepeatableRemovableModules)
    : DEFAULT_ALLOWED_REPEATABLE_MODULES;
  return {
    id,
    requiredFullWidthIds: asArray(template?.requiredFullWidthContainerIds).length ? asArray(template.requiredFullWidthContainerIds) : DEFAULT_REQUIRED_FULL_WIDTH_IDS,
    allowedBusinessContentContainers,
    allowedRepeatableModules,
    kpiCardIds: isWorkbench
      ? ["kpi_card_wrapper"]
      : ["event_portfolio_kpi_planned_events", "event_portfolio_kpi_approved_budget", "event_portfolio_kpi_registration_rate", "event_portfolio_kpi_lead_follow_up"],
    emptySectionModuleIds: isWorkbench
      ? ["content_card_wrapper", "content_card_60_wrapper", "content_card_40_wrapper", "1_columns_section", "2_columns_section", "3_columns_section", "2_columns_60/40_section", "1_row_section", "2_rows_section", "3_rows_section", "chart_cards_section"]
      : ["2_columns_section", "3_columns_section", "2_columns_60/40_section"],
  };
}

function selectTemplateForResource(registry, resource) {
  const templates = asArray(registry?.templates);
  const identities = new Set(identityCandidates(resource));
  const explicit = templates.find((entry) => identities.has(entry?.id) || identities.has(entry?.version));
  if (explicit) return explicit;
  return findDefaultTemplate(registry);
}

function validatePageShell(resource, findings, context) {
  if (!isObject(resource)) {
    findings.push(error(`DASH_LAYOUT_${context.layer}_RESOURCE_INVALID`, "Dashboard page resource must parse as Yeeflow page export JSON.", { page: context.page }));
    return;
  }
  const rules = templateRules(context.template);
  if (context.requireDerivedMarker && !identityCandidates(resource).includes(rules.id)) {
    findings.push(error("DASH_LAYOUT_RESOURCE_TEMPLATE_MARKER_MISSING", "Generated dashboard must declare it was derived from the selected Dashboard Page Layout template.", { page: context.page, expected: rules.id }));
  }
  if (resource?.attrs?.hideHeaderAll !== true) {
    findings.push(error(`DASH_LAYOUT_${context.layer}_HIDE_HEADER_ALL_MISSING`, "Dashboard page must set attrs.hideHeaderAll = true.", { page: context.page }));
  }
  const background = resource?.attrs?.background?.classic?.color || resource?.attrs?.background?.color || null;
  if (normalizeColor(background) !== BACKGROUND) {
    findings.push(error(`DASH_LAYOUT_${context.layer}_BACKGROUND_INVALID`, "Dashboard page root background must be #f4f7fb.", { page: context.page, actual: background }));
  }
  if (!isZeroPadding(resource?.attrs?.container?.padding)) {
    findings.push(error(`DASH_LAYOUT_${context.layer}_ROOT_PADDING_NONZERO`, "Dashboard page root container padding must be zero.", { page: context.page, actual: resource?.attrs?.container?.padding ?? null }));
  }
  const main = findFirstByIdentity(resource, "main") || findFirstByIdentity(resource, "Main");
  const content = asArray(main?.children).find((child) => hasIdentity(child, "content") || hasIdentity(child, "Content"));
  if (!main || !content) {
    findings.push(error(`DASH_LAYOUT_${context.layer}_MAIN_CONTENT_MISSING`, "Dashboard page must contain main > content.", { page: context.page }));
    return;
  }
  if (!isColumnLayout(main)) findings.push(error(`DASH_LAYOUT_${context.layer}_MAIN_COLUMN_MISSING`, "Dashboard main container must use column layout.", { page: context.page }));
  if (!isColumnLayout(content)) findings.push(error(`DASH_LAYOUT_${context.layer}_CONTENT_COLUMN_MISSING`, "Dashboard content container must use column layout.", { page: context.page }));
  if (hasConflictingBackground(content)) {
    findings.push(error(`DASH_LAYOUT_${context.layer}_CONTENT_BACKGROUND_CONFLICT`, "Dashboard content container must not override the full-page #f4f7fb background continuity.", { page: context.page, actual: content.attrs?.background || content.attrs?.style?.background || null }));
  }
  validateContentPaddingContract(content, findings, context);
  for (const id of rules.requiredFullWidthIds) {
    for (const entry of findAllByIdentity(resource, id)) {
      if (!isFullWidth(entry)) {
        findings.push(error(`DASH_LAYOUT_${context.layer}_FULL_WIDTH_MISSING`, "Dashboard structural container must explicitly use Full width attrs.style.widthtype [null,\"1\"].", { page: context.page, containerId: id, actual: entry?.attrs?.style?.widthtype || null }));
      }
    }
  }
  const contentChildren = asArray(content.children).filter((child) => isObject(child) && child.type);
  if (!contentChildren.length) {
    findings.push(error(`DASH_LAYOUT_${context.layer}_CONTENT_EMPTY`, "Dashboard content must contain selected business section containers, not an empty shell.", { page: context.page }));
  }
  for (const section of findAllByIdentity(resource, "content_card_wrapper")) {
    if (!findFirstByIdentity(section, "section_title_area")) {
      findings.push(error(`DASH_LAYOUT_${context.layer}_SECTION_TITLE_AREA_MISSING`, "Each business section card must preserve section_title_area.", { page: context.page }));
    }
    if (!findFirstByIdentity(section, "section_content_area")) {
      findings.push(error(`DASH_LAYOUT_${context.layer}_SECTION_CONTENT_AREA_MISSING`, "Each business section card must preserve section_content_area.", { page: context.page }));
    }
  }
  if (!context.allowTemplateOperations) validateOperations(resource, findings, context.page);
  if (!context.allowTemplateOperations) validateGeneratedSectionCleanup(resource, findings, context.page, context);
  validateControlledSlotsAndRepeatableModules(resource, findings, context);
}

function validateOperations(resource, findings, page) {
  for (const operations of findAllByIdentity(resource, "Operations")) {
    const descendants = collectDescendants(operations);
    const actionable = descendants.filter((control) => hasActionConfiguration(control));
    if (!actionable.length) {
      findings.push(error("DASH_LAYOUT_OPERATIONS_WITHOUT_ACTIONS", "Operations container may exist only when it contains real configured action controls.", { page }));
    }
    const visualOnly = descendants.find((control) => isActionLooking(control) && !hasActionConfiguration(control));
    if (visualOnly) {
      findings.push(error("DASH_LAYOUT_VISUAL_ACTION_WITHOUT_BINDING", "Visual button/action-looking controls must include valid Yeeflow action configuration.", { page, control: firstIdentity(visualOnly) || null }));
    }
  }
}

function validateGeneratedSectionCleanup(resource, findings, page, context = {}) {
  const rules = templateRules(context.template);
  const plannedKpiCount = plannedDashboardKpiCount(resource);
  for (const entry of flattenControls(resource, rules)) {
    const control = entry.control;
    if (hasIdentity(control, "section_content_area") && !hasMeaningfulDashboardContent(control)) {
      findings.push(error("DASH_LAYOUT_EMPTY_SECTION_CONTENT_AREA", "Generated Dashboard v1.1 must not keep an empty section_content_area anywhere in the page; remove the empty slot or its owning copied section.", { page, pointer: entry.pointer, control: firstIdentity(control) || null }));
    }
    if (hasAnyIdentity(control, ["content_card_wrapper", "content_card_60_wrapper", "content_card_40_wrapper"])) {
      const slot = findFirstByIdentity(control, "section_content_area");
      if (slot && !hasMeaningfulDashboardContent(slot)) {
        findings.push(error("DASH_LAYOUT_EMPTY_SECTION_CONTENT_AREA", "Generated Dashboard v1.1 sections must not keep an empty section_content_area; remove the unused section module instead of leaving a title-only card.", { page, pointer: entry.pointer, control: firstIdentity(control) || null }));
      }
    }
    if (hasAnyIdentity(control, rules.emptySectionModuleIds) && !hasMeaningfulDashboardContent(control)) {
      findings.push(error("DASH_LAYOUT_UNUSED_SECTION_MODULE", "Generated Dashboard repeatable section modules must be removed when they contain no real business content.", { page, pointer: entry.pointer, control: firstIdentity(control) || null }));
    }
    if (hasIdentity(control, "kpi_metrics_wrapper")) {
      const kpiCards = collectDashboardKpiCards(control, context.template);
      if (!hasMeaningfulDashboardContent(control)) {
        findings.push(error("DASH_LAYOUT_EMPTY_KPI_METRICS_WRAPPER", "Generated Dashboard must remove kpi_metrics_wrapper when no KPI cards are planned or materialized.", { page, pointer: entry.pointer, control: firstIdentity(control) || null }));
      }
      if (plannedKpiCount === 0 && kpiCards.length > 0) {
        findings.push(error("DASH_LAYOUT_UNPLANNED_KPI_CARD_PRESENT", "Generated Dashboard must not include Event Portfolio KPI cards unless Functional Spec/App Plan planned KPI metrics for this page.", { page, pointer: entry.pointer, plannedKpiCount, actualKpiCards: kpiCards.length }));
      } else if (Number.isInteger(plannedKpiCount) && plannedKpiCount > 0 && kpiCards.length !== plannedKpiCount) {
        findings.push(error("DASH_LAYOUT_KPI_CARD_COUNT_MISMATCH", "Generated Dashboard KPI card count must match the planned KPI/Summary Metrics count; do not keep unused source-template KPI cards.", { page, pointer: entry.pointer, plannedKpiCount, actualKpiCards: kpiCards.length }));
      }
    }
    if (hasIdentity(control, "chart_cards_section")) {
      if (!hasMeaningfulDashboardContent(control)) {
        findings.push(error("DASH_LAYOUT_EMPTY_CHART_CARDS_SECTION", "Generated Workbench Dashboard must remove chart_cards_section when no Data Analytics templates are materialized in it.", { page, pointer: entry.pointer, control: firstIdentity(control) || null }));
      }
      if (!["primary_working_area", "right_side_panel"].includes(entry.parentIdentity)) {
        findings.push(error("DASH_LAYOUT_CHART_CARDS_SECTION_PARENT_INVALID", "Workbench chart_cards_section may appear only under primary_working_area or right_side_panel.", { page, pointer: entry.pointer, parent: entry.parentIdentity || null }));
      }
      const analyticsCount = countDataAnalyticsTemplates(control);
      if (analyticsCount > 3) {
        findings.push(error("DASH_LAYOUT_CHART_CARDS_SECTION_TOO_MANY_ANALYTICS", "Each Workbench chart_cards_section should contain no more than three Data Analytics templates; add another chart_cards_section for additional charts.", { page, pointer: entry.pointer, analyticsCount }));
      }
    }
    if (hasIdentity(control, "right_side_panel") && !hasMeaningfulDashboardContent(control)) {
      findings.push(error("DASH_LAYOUT_EMPTY_RIGHT_SIDE_PANEL", "Generated Workbench Dashboard must remove right_side_panel when it contains no real business content.", { page, pointer: entry.pointer }));
    }
  }
}

function plannedDashboardKpiCount(resource) {
  const candidates = [
    resource?.generatedFinalDashboardMaterialization?.kpiCount,
    resource?.plannedControls?.kpiCount,
    resource?.plannedKpiCount,
  ];
  for (const value of candidates) {
    if (Number.isInteger(value) && value >= 0) return value;
    if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  }
  if (resource?.generatedFinalDashboardMaterialization && resource?.plannedControls?.kpis === false) return 0;
  return null;
}

function collectDashboardKpiCards(root, template = null) {
  const ids = templateRules(template).kpiCardIds;
  return flattenControls(root)
    .map((entry) => entry.control)
    .filter((control) => hasAnyIdentity(control, ids));
}

function hasMeaningfulDashboardContent(node) {
  if (!isObject(node)) return false;
  return flattenControls(node).some((entry) => {
    const control = entry.control;
    if (control === node) return false;
    if (isBusinessContentControl(control)) return true;
    const type = String(control?.type || "").toLowerCase();
    if (["pie-chart", "column-chart", "bar-chart", "line-chart", "area-chart", "pivot-table", "dynamic-field", "dynamic-user", "dynamic-image", "dynamic-file", "search-filter"].includes(type)) return true;
    if (control?.attrs?.dataAnalyticsTemplateId || control?.dataAnalyticsTemplateId) return true;
    if (control?.attrs?.dashboardDatasetTemplateId || control?.dashboardDatasetTemplateId) return true;
    if (hasAnyIdentity(control, ["kpi_cards_kpi_row", "event_portfolio_kpi_planned_events", "event_portfolio_kpi_approved_budget", "event_portfolio_kpi_registration_rate", "event_portfolio_kpi_lead_follow_up"])) return true;
    return false;
  });
}

function countDataAnalyticsTemplates(node) {
  return flattenControls(node)
    .map((entry) => entry.control)
    .filter((control) => {
      const type = String(control?.type || "").toLowerCase();
      return ["pie-chart", "column-chart", "bar-chart", "line-chart", "area-chart", "pivot-table"].includes(type)
        || Boolean(control?.attrs?.dataAnalyticsTemplateId || control?.dataAnalyticsTemplateId);
    }).length;
}

function validateControlledSlotsAndRepeatableModules(resource, findings, context) {
  const templateResource = context.template?.template?.parsedResource;
  if (!isObject(templateResource)) return;
  if (!findFirstByIdentity(resource, "content_card_wrapper") && !findFirstByIdentity(resource, "page_title_section")) return;
  const rules = templateRules(context.template);
  const templateIndex = buildTemplateStructureIndex(templateResource);
  const generatedControls = flattenControls(resource, rules);

  for (const entry of generatedControls) {
    const control = entry.control;
    if (entry.insideBusinessSlot) continue;
    const ids = identityCandidates(control);
    if (!ids.length) continue;
    if (isAllowedBusinessSlot(control, rules)) {
      validateTemplateRootStructure(control, templateIndex, findings, context.page);
      validateSpecialModuleChildren(control, findings, context.page);
      continue;
    }
    if (hasAnyIdentity(control, rules.allowedRepeatableModules)) {
      validateTemplateRootStructure(control, templateIndex, findings, context.page);
      validateSpecialModuleChildren(control, findings, context.page);
      continue;
    }
    const knownIdentity = ids.some((id) => templateIndex.identitySet.has(id) || templateIndex.identitySet.has(normalizeIdentity(id)));
    if (!knownIdentity && isBusinessContentControl(control)) {
      findings.push(error("DASH_LAYOUT_BUSINESS_CONTROL_OUTSIDE_ALLOWED_SLOT", "Dashboard business controls such as Collections, filters, KPI values, and actions must be placed inside approved v1.1 business-content containers.", { page: context.page, pointer: entry.pointer, identities: ids.slice(0, 6), type: control.type || null }));
      continue;
    }
    const outsideSlotText = unexpectedBusinessTextOutsideSlot(control);
    if (outsideSlotText.length) {
      findings.push(error("DASH_LAYOUT_BUSINESS_TEXT_OUTSIDE_ALLOWED_SLOT", "Business text changes must stay inside approved v1.1 business-content containers; structural template labels may only use module/control identities.", { page: context.page, pointer: entry.pointer, control: firstIdentity(control) || null, text: outsideSlotText.slice(0, 5) }));
      continue;
    }
    if (!knownIdentity && looksLikeLayoutModule(control)) {
      findings.push(error("DASH_LAYOUT_INVENTED_LAYOUT_MODULE", "Generated dashboards must not invent new dashboard layout modules outside approved business-content containers. Add layout by copying an allowed repeatable/removable module.", { page: context.page, pointer: entry.pointer, identities: ids.slice(0, 6), type: control.type || null }));
      continue;
    }
    if (knownIdentity) validateTemplateRootStructure(control, templateIndex, findings, context.page);
  }
}

function buildTemplateStructureIndex(templateResource) {
  const identitySet = new Set();
  const rootSignaturesByIdentity = new Map();
  for (const entry of flattenControls(templateResource)) {
    const control = entry.control;
    for (const id of identityCandidates(control)) {
      identitySet.add(id);
      identitySet.add(normalizeIdentity(id));
      if (!rootSignaturesByIdentity.has(id)) rootSignaturesByIdentity.set(id, new Set());
      rootSignaturesByIdentity.get(id).add(JSON.stringify(rootStructureSignature(control)));
      const normalizedId = normalizeIdentity(id);
      if (!rootSignaturesByIdentity.has(normalizedId)) rootSignaturesByIdentity.set(normalizedId, new Set());
      rootSignaturesByIdentity.get(normalizedId).add(JSON.stringify(rootStructureSignature(control)));
    }
  }
  return { identitySet, rootSignaturesByIdentity };
}

function validateTemplateRootStructure(control, templateIndex, findings, page) {
  const ids = identityCandidates(control);
  const signature = JSON.stringify(rootStructureSignature(control));
  const matched = ids.some((id) => templateIndex.rootSignaturesByIdentity.get(id)?.has(signature) || templateIndex.rootSignaturesByIdentity.get(normalizeIdentity(id))?.has(signature));
  if (!matched) {
    findings.push(error("DASH_LAYOUT_TEMPLATE_STRUCTURE_MUTATION", "Non-business template containers and copied modules must preserve template control type, width, padding, direction, gap, and background structure.", { page, control: firstIdentity(control) || null, type: control.type || null }));
  }
}

function validateSpecialModuleChildren(control, findings, page) {
  if (hasIdentity(control, "content_card_wrapper")) {
    for (const required of ["section_title_area", "section_content_area"]) {
      if (!findFirstByIdentity(control, required)) {
        findings.push(error("DASH_LAYOUT_REPEATABLE_MODULE_REQUIRED_CHILD_MISSING", "Copied content_card_wrapper modules must preserve required section_title_area and section_content_area children.", { page, module: firstIdentity(control), requiredChild: required }));
      }
    }
  }
  if (hasIdentity(control, "event_portfolio_kpi_planned_events")) {
    for (const required of ["event_portfolio_kpi_planned_events_top_row", "event_portfolio_kpi_planned_events_icon_block", "event_portfolio_kpi_planned_events_icon_native", "event_portfolio_kpi_planned_events_title_stack"]) {
      if (!findFirstByIdentity(control, required)) {
        findings.push(error("DASH_LAYOUT_KPI_COPY_REQUIRED_CHILD_MISSING", "Copied KPI cards must preserve the planned-events KPI card structure and required children.", { page, module: firstIdentity(control), requiredChild: required }));
      }
    }
  }
}

function flattenControls(root, rules = null) {
  const out = [];
  const activeRules = rules || templateRules(null);
  const visit = (node, pointer = "$", insideBusinessSlot = false, parentIdentity = "") => {
    if (!isObject(node)) return;
    const currentIsBusinessSlot = isAllowedBusinessSlot(node, activeRules);
    if (node.type) out.push({ control: node, pointer, insideBusinessSlot, parentIdentity });
    const currentIdentity = semanticIdentity(node);
    asArray(node.children).forEach((child, index) => visit(child, `${pointer}.children[${index}]`, insideBusinessSlot || currentIsBusinessSlot, currentIdentity));
  };
  visit(root);
  return out;
}

function rootStructureSignature(control) {
  const isMainOrContent = hasIdentity(control, "main") || hasIdentity(control, "content");
  return {
    type: control?.type || null,
    widthtype: normalizeWidthMode(control),
    padding: isMainOrContent ? "normalized" : control?.attrs?.container?.padding ?? control?.attrs?.common?.padding ?? null,
    direction: control?.attrs?.style?.direction ?? control?.attrs?.container?.direction ?? null,
    gap: control?.attrs?.style?.gap ?? control?.attrs?.container?.gap ?? null,
    background: isMainOrContent ? "normalized" : control?.attrs?.background ?? control?.attrs?.style?.background ?? control?.attrs?.common?.background ?? null,
  };
}

function validateContentPaddingContract(content, findings, context) {
  const templateContent = findFirstByIdentity(context.template?.template?.parsedResource, "content")
    || findFirstByIdentity(context.template?.template?.parsedResource, "Content");
  if (!templateContent) return;
  const expected = paddingSlots(templateContent);
  const actual = paddingSlots(content);
  for (const key of ["container", "common", "style"]) {
    if (expected[key] === undefined && actual[key] === undefined) continue;
    if (stableJson(actual[key] ?? null) !== stableJson(expected[key] ?? null)) {
      findings.push(error(`DASH_LAYOUT_${context.layer}_CONTENT_PADDING_MISMATCH`, "Dashboard Page Layouts v1.1 Content container padding must preserve the canonical template; obsolete forced-zero normalization is forbidden.", { page: context.page, slot: key, expected: expected[key] ?? null, actual: actual[key] ?? null }));
    }
  }
}

function paddingSlots(control) {
  return {
    container: control?.attrs?.container?.padding,
    common: control?.attrs?.common?.padding,
    style: control?.attrs?.style?.padding,
  };
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (isObject(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function normalizeWidthMode(control) {
  if (isFullWidth(control) || String(control?.width || "").toLowerCase() === "full") return "full";
  const widthtype = control?.attrs?.style?.widthtype ?? null;
  return widthtype === undefined ? null : widthtype;
}

function ownVisibleTextSignature(control) {
  const out = [];
  const visibleKeys = new Set(["value", "text", "title", "Title", "label", "displayLabel", "placeholder"]);
  const visit = (node, key = "") => {
    if (Array.isArray(node)) return node.forEach((item) => visit(item, key));
    if (!isObject(node)) {
      if (typeof node === "string" && visibleKeys.has(key)) out.push(node);
      return;
    }
    for (const [childKey, child] of Object.entries(node)) {
      if (childKey === "children") continue;
      visit(child, childKey);
    }
  };
  visit({ attrs: control?.attrs, title: control?.title, label: control?.label });
  return out.sort();
}

function isAllowedBusinessSlot(control, rules = null) {
  return hasAnyIdentity(control, (rules || templateRules(null)).allowedBusinessContentContainers);
}

function hasAnyIdentity(control, ids) {
  return ids.some((id) => hasIdentity(control, id));
}

function looksLikeLayoutModule(control) {
  if (!["container", "grid", "flex_grid", "ak-flex-grid", "section", "row", "column"].includes(String(control?.type || ""))) return false;
  return identityCandidates(control).some((id) => !looksLikeUuid(id));
}

function isBusinessContentControl(control) {
  const type = String(control?.type || "").toLowerCase();
  if (["collection", "data-list", "kanban", "summary", "select-filter", "radio-filter", "checkbox-filter", "button", "icon"].includes(type)) return true;
  return hasActionConfiguration(control);
}

function unexpectedBusinessTextOutsideSlot(control) {
  const structural = new Set(structuralIdentityCandidates(control).map(normalizeIdentity));
  const allowedGeneric = /^(container|grid|text|dynamic field|dynamic user|kanban|collection|button|summary|icon|text editor)$/i;
  return ownVisibleTextSignature(control).filter((text) => {
    const normalized = normalizeIdentity(text);
    if (!normalized) return false;
    if (allowedGeneric.test(text)) return false;
    if (structural.has(normalized)) return false;
    if (looksLikeUuid(text)) return false;
    return true;
  });
}

function looksLikeUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function validateBusinessMapping(resource, findings, page) {
  const text = collectBusinessText(resource).join("\n");
  const hits = TEMPLATE_TERMS.filter((term) => new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(text));
  for (const term of hits) {
    findings.push(error("DASH_LAYOUT_TEMPLATE_LABEL_LEAKAGE", "Generated dashboard must replace unrelated template/domain labels with current app domain text.", { page, term }));
  }
  const visibleTextCount = countVisibleText(resource);
  if (visibleTextCount < 2) {
    findings.push(error("DASH_LAYOUT_GENERIC_PLACEHOLDER_CONTENT", "Generated dashboard must include domain-mapped business content, not empty or generic placeholder content.", { page, visibleTextCount }));
  }
}

function collectBusinessText(value) {
  const out = [];
  const visibleKeys = new Set(["value", "text", "title", "Title", "label", "displayLabel", "sourceField", "fieldName", "FieldName", "placeholder"]);
  const visit = (node, key = "") => {
    if (Array.isArray(node)) return node.forEach((item) => visit(item, key));
    if (!isObject(node)) {
      if (typeof node === "string" && visibleKeys.has(key)) out.push(node);
      return;
    }
    for (const [childKey, child] of Object.entries(node)) visit(child, childKey);
  };
  visit(value);
  return out;
}

function validateDataControls(page, listIndex, findings) {
  for (const entry of page.controls) {
    const control = entry.control;
    if (control?.type === "dynamic-field" && isUserLikeControl(control)) {
      findings.push(error("DASH_LAYOUT_USER_FIELD_DYNAMIC_FIELD", "User/identity fields must render with dynamic-user, not dynamic-field.", { page: page.title, pointer: entry.pointer }));
    }
    if (["select-filter", "radio-filter", "checkbox-filter"].includes(control?.type)) {
      const data = control?.attrs?.data || {};
      if (!present(control?.binding) && !present(control?.attrs?.save_var) && !present(control?.attrs?.filterVar)) {
        findings.push(error("DASH_LAYOUT_DATA_FILTER_VARIABLE_MISSING", "Data Filters must bind to valid variables.", { page: page.title, pointer: entry.pointer }));
      }
      if (!present(data.field)) findings.push(error("DASH_LAYOUT_DATA_FILTER_FIELD_MISSING", "Data Filters must bind to a source field.", { page: page.title, pointer: entry.pointer }));
      if (data.operator && !["=", "in", "contains", "between", ">=", "<=", ">", "<"].includes(String(data.operator))) {
        findings.push(error("DASH_LAYOUT_DATA_FILTER_OPERATOR_INVALID", "Data Filters must use legal operators.", { page: page.title, pointer: entry.pointer, operator: data.operator }));
      }
    }
    if (control?.type === "collection" || control?.type === "data-list") {
      const listId = String(control?.attrs?.data?.list?.ListID || control?.attrs?.data?.listId || "");
      if (!listId || !listIndex.has(listId)) {
        findings.push(error("DASH_LAYOUT_COLLECTION_LIST_UNRESOLVED", "Collection grid/table controls must point to real app lists.", { page: page.title, pointer: entry.pointer, listId: listId || null }));
      }
    }
    if (["summary", "pie-chart", "bar-chart", "line-chart", "column-chart", "pivot-table"].includes(control?.type) && !control?.runtimeModelProven && !control?.attrs?.runtimeModelProven) {
      findings.push(error("DASH_LAYOUT_MODEL_CONTROL_UNPROVEN", "Summary/chart/model controls may be used only when their runtime model contract is export-proven.", { page: page.title, pointer: entry.pointer, type: control.type }));
    }
  }
}

function validateRuntimeProof(proof, findings) {
  if (!proof) return;
  const url = String(proof.url || proof.runtimeUrl || proof.canonicalRuntimeUrl || "");
  if (!/^https:\/\/codex\.yeeflow\.com\/#\/list-set\/41\/[^/]+\/[^/]+$/i.test(url)) {
    findings.push(error("DASH_LAYOUT_RUNTIME_ROUTE_INVALID", "Runtime proof must use canonical route https://codex.yeeflow.com/#/list-set/41/{ListSetID}/{LayoutID}, not guessed /p/{LayoutID}.", { url: url || null }));
  }
  const text = `${proof.status || ""} ${proof.pageText || ""} ${proof.errorText || ""} ${JSON.stringify(proof.dom || {})}`;
  for (const phrase of ["Access Denied", "model could not be loaded", "model-load error", "chart configuration error", "placeholder-only dashboard"]) {
    if (new RegExp(escapeRegExp(phrase), "i").test(text)) {
      findings.push(error("DASH_LAYOUT_RUNTIME_PROOF_ERROR", "Runtime proof must fail on Access Denied, model-load errors, chart configuration errors, or placeholder-only dashboards.", { phrase }));
    }
  }
}

function validateUpgradeScope(scope, findings) {
  if (!scope) return;
  const declared = scope.scope || scope.intendedScope || {};
  if (!/dashboard/i.test(String(declared.type || declared.resourceType || scope.type || ""))) {
    findings.push(error("DASH_LAYOUT_UPGRADE_SCOPE_DECLARATION_MISSING", "Dashboard-only upgrades must declare dashboard-only scope."));
  }
  const before = scope.before || {};
  const after = scope.after || {};
  for (const key of ["ListSet", "Childs", "Forms", "FormNewReports", "DataReports", "Workflows", "Navigation", "Roles", "Permissions", "IconUrl"]) {
    if (JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null)) {
      findings.push(error("DASH_LAYOUT_UPGRADE_NON_DASHBOARD_MUTATION", "Dashboard-only upgrade must not change non-dashboard resources unless explicitly requested.", { resource: key }));
    }
  }
  const beforeIds = dashboardLayoutIds(before);
  const afterIds = dashboardLayoutIds(after);
  if (beforeIds.length && JSON.stringify(beforeIds.sort()) !== JSON.stringify(afterIds.sort())) {
    findings.push(error("DASH_LAYOUT_UPGRADE_LAYOUT_ID_CHANGED", "Dashboard-only upgrades must preserve existing Dashboard LayoutIDs.", { beforeLayoutIds: beforeIds, afterLayoutIds: afterIds }));
  }
}

function collectDashboardPages(decoded) {
  const pages = [];
  asArray(decoded?.Pages).forEach((page, pageIndex) => {
    if (String(page?.Type) !== "103") return;
    asArray(page?.LayoutInResources).forEach((resource, resourceIndex) => {
      const parsed = parseJsonMaybe(resource?.Resource);
      if (!isObject(parsed)) return;
      const controls = [];
      collectControls(parsed, controls, "$");
      pages.push({ title: String(page?.Title || page?.LayoutID || `dashboard-${pageIndex}`), resource: parsed, controls, pointer: `Pages[${pageIndex}].LayoutInResources[${resourceIndex}].Resource` });
    });
  });
  return pages;
}

function collectControls(node, out, pointer, depth = 0) {
  if (!isObject(node)) return;
  if (node.type) out.push({ control: node, pointer, depth });
  for (const child of asArray(node.children)) collectControls(child, out, `${pointer}.children[${asArray(node.children).indexOf(child)}]`, depth + 1);
}

function buildListIndex(decoded) {
  const ids = new Set();
  for (const child of asArray(decoded?.Childs)) {
    for (const value of [child?.List?.ListID, child?.ListID, child?.Item?.ListID]) if (present(value)) ids.add(String(value));
  }
  return ids;
}

function dashboardLayoutIds(value) {
  return asArray(value?.Pages).filter((page) => String(page?.Type) === "103").map((page) => String(page?.LayoutID || "")).filter(Boolean);
}

function findDefaultTemplate(registry) {
  const templates = asArray(registry?.templates);
  return templates.find((item) => item?.id === (registry?.defaultDashboardPageLayoutTemplateId || TEMPLATE_ID)) || templates.find((item) => item?.id === TEMPLATE_ID) || null;
}

function findFirstByIdentity(root, expected) {
  return findAllByIdentity(root, expected)[0] || null;
}

function findAllByIdentity(root, expected) {
  const matches = [];
  const visit = (node) => {
    if (!isObject(node)) return;
    if (hasIdentity(node, expected)) matches.push(node);
    for (const child of asArray(node.children)) visit(child);
  };
  visit(root);
  return matches;
}

function hasIdentity(control, expected) {
  const normalizedExpected = normalizeIdentity(expected);
  return identityCandidates(control).some((candidate) => normalizeIdentity(candidate) === normalizedExpected);
}

function identityCandidates(control) {
  return [
    control?.id,
    control?.ID,
    control?.key,
    control?.name,
    control?.Name,
    control?.label,
    control?.title,
    control?.Title,
    control?.nv_label,
    control?.nav_label,
    control?.derivedFromDashboardPageLayoutTemplate,
    control?.attrs?.id,
    control?.attrs?.name,
    control?.attrs?.nv_label,
    control?.attrs?.nav_label,
    control?.attrs?.derivedFromDashboardPageLayoutTemplate,
  ].filter(present).map(String);
}

function structuralIdentityCandidates(control) {
  return [
    control?.id,
    control?.ID,
    control?.key,
    control?.name,
    control?.Name,
    control?.nv_label,
    control?.nav_label,
    control?.derivedFromDashboardPageLayoutTemplate,
    control?.attrs?.id,
    control?.attrs?.name,
    control?.attrs?.nv_label,
    control?.attrs?.nav_label,
    control?.attrs?.derivedFromDashboardPageLayoutTemplate,
  ].filter(present).map(String);
}

function collectDescendants(control) {
  const out = [];
  const visit = (node) => {
    for (const child of asArray(node?.children)) {
      out.push(child);
      visit(child);
    }
  };
  visit(control);
  return out;
}

function firstIdentity(control) {
  return identityCandidates(control)[0] || "";
}

function semanticIdentity(control) {
  return [control?.nv_label, control?.nav_label, control?.name, control?.Name, control?.label, control?.title, control?.id].filter(present).map(String)[0] || "";
}

function isFullWidth(control) {
  return isFullWidthType(control?.attrs?.style?.widthtype);
}

function isFullWidthType(value) {
  return Array.isArray(value) && value[0] === null && String(value[1]) === "1";
}

function isColumnLayout(control) {
  const direction = control?.attrs?.style?.direction ?? control?.attrs?.container?.direction;
  if (!present(direction)) return true;
  return JSON.stringify(direction).toLowerCase().includes("column");
}

function isZeroPadding(value) {
  if (Array.isArray(value)) return value.every((entry) => entry === null || isZeroPadding(entry));
  if (typeof value === "number") return value === 0;
  if (typeof value === "string") return value === "0" || value === "--sp--s0";
  if (isObject(value)) return ["top", "right", "bottom", "left"].every((key) => isZeroPadding(value[key] ?? 0));
  return false;
}

function hasConflictingBackground(control) {
  const value = control?.attrs?.background?.classic?.color || control?.attrs?.background?.color || control?.attrs?.style?.background || null;
  return present(value) && normalizeColor(value) !== BACKGROUND;
}

function hasActionConfiguration(control) {
  const attrs = control?.attrs || {};
  return present(attrs.control_action)
    || present(attrs.action)
    || present(attrs.actions)
    || present(attrs["action-type"])
    || present(attrs.actionType)
    || present(attrs.data?.action)
    || asArray(control?.actions).length > 0
    || asArray(attrs.actions).length > 0;
}

function isActionLooking(control) {
  return /button|action|export|create|open|submit|selector|view/i.test(`${control?.type || ""} ${identityCandidates(control).join(" ")}`);
}

function isUserLikeControl(control) {
  const text = JSON.stringify({ id: control?.id, name: control?.name, label: control?.label, attrs: control?.attrs, binding: control?.binding, fieldType: control?.fieldType });
  return USER_FIELD_HINT.test(text) || /user|person|identity/i.test(String(control?.attrs?.fieldType || control?.fieldType || ""));
}

function countVisibleText(value) {
  let count = 0;
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!isObject(node)) return;
    if (["heading", "text"].includes(node.type) && /[A-Za-z0-9]/.test(JSON.stringify(node.attrs || node.title || node.name || ""))) count += 1;
    for (const child of Object.values(node)) visit(child);
  };
  visit(value);
  return count;
}

function normalizeColor(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeIdentity(value) {
  return String(value || "").trim().toLowerCase();
}

function readJson(file, findings, code) {
  if (!fs.existsSync(file)) {
    findings.push(error(code, "JSON artifact is missing.", { file }));
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    findings.push(error(`${code}_INVALID_JSON`, `JSON artifact could not be parsed: ${err.message}`, { file }));
    return null;
  }
}

function present(value) {
  return value !== undefined && value !== null && !(typeof value === "string" && value.trim() === "") && !(Array.isArray(value) && value.length === 0);
}

function error(code, message, details = {}) {
  return { level: "error", code, message, ...details };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg.startsWith("--")) args[toCamel(arg.slice(2))] = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : true;
  }
  return args;
}

function toCamel(value) {
  return value.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function printUsage() {
  console.error("Usage: node scripts/validate-dashboard-page-layout-template.mjs --registry docs/reference/dashboard-page-layout-templates.json [--package app.yapk] [--runtime-proof proof.json] [--upgrade-scope scope.json]");
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileUrl(process.argv[1]);
}

function pathToFileUrl(file) {
  return new URL(`file://${path.resolve(file)}`).href;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

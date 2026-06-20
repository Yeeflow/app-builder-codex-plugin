#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const DEFAULT_REGISTRY = path.join(process.cwd(), "docs/reference/dashboard-golden-reference-registry.normalized.json");
const DEFAULT_REFERENCE = "event_portfolio_dashboard_golden_reference";
const REQUIRED_REFERENCE_IDS = [
  "dashboard_default_shell_event_portfolio_ref",
  "dashboard_header_band_event_portfolio_ref",
  "dashboard_filter_group_event_portfolio_ref",
  "dashboard_kpi_cards_event_portfolio_ref",
  "dashboard_content_section_event_portfolio_ref",
  "dashboard_collection_grid_table_event_portfolio_ref",
];
const EVENT_SPECIFIC_FIELDS = [
  "Event Name",
  "Event Date",
  "Event Type",
  "Registration",
  "Registration Rate",
  "Approved Budget",
  "Lead Follow-up",
  "Campaign",
  "Campaign Assets",
  "Venue",
  "Speakers",
];

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/validate-dashboard-golden-reference-registry.mjs [--registry <registry.json>] [--dashboard-selection <selection.json>] [--dashboard-blueprint <blueprint.json>] [--dashboard-resource <resource-trace.json>] [--dashboard-trace <trace.json>] [--json]",
    "",
    "Validates the default Event Portfolio Dashboard golden reference registry, selection artifacts, blueprint traces, and generated resource traces. No API calls are made.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? "" : process.argv[index + 1] || "";
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value) {
  return value === undefined || value === null ? "" : String(value);
}

function normalize(value) {
  return safeString(value).trim().toLowerCase();
}

function hasText(value) {
  if (Array.isArray(value)) return value.some(hasText);
  if (value && typeof value === "object") return Object.values(value).some(hasText);
  return Boolean(safeString(value).trim());
}

function flatten(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(flatten).join(" ");
  if (typeof value === "object") return Object.values(value).map(flatten).join(" ");
  return "";
}

function push(findings, code, message, extra = {}) {
  findings.push({ level: "error", code, message, ...extra });
}

function validateRegistry(registry) {
  const findings = [];
  if (registry.defaultDashboardGoldenReference !== DEFAULT_REFERENCE) {
    push(findings, "DASHBOARD_GOLDEN_REFERENCE_DEFAULT_MISSING", "Registry must declare event_portfolio_dashboard_golden_reference as the default Dashboard Golden Reference.");
  }

  const family = asArray(registry.goldenReferences).find((entry) => entry.referenceId === DEFAULT_REFERENCE);
  if (!family) {
    push(findings, "DASHBOARD_GOLDEN_REFERENCE_FAMILY_MISSING", "Registry must include the Event Portfolio Dashboard golden reference family.");
  } else {
    for (const id of REQUIRED_REFERENCE_IDS) {
      if (!asArray(family.referenceIds).includes(id)) {
        push(findings, "DASHBOARD_GOLDEN_REFERENCE_FAMILY_REF_MISSING", `Default family must include ${id}.`, { referenceId: id });
      }
    }
    if (!/do not copy marketing event/i.test(flatten(family.generationContract))) {
      push(findings, "DASHBOARD_GOLDEN_REFERENCE_EVENT_CLONE_BOUNDARY_MISSING", "Registry must state that Marketing Event-specific fields/data must not be copied into unrelated apps.");
    }
  }

  const references = new Map(asArray(registry.references).map((entry) => [entry.referenceId, entry]));
  for (const id of REQUIRED_REFERENCE_IDS) {
    const entry = references.get(id);
    if (!entry) {
      push(findings, "DASHBOARD_GOLDEN_REFERENCE_ENTRY_MISSING", `Registry is missing ${id}.`, { referenceId: id });
      continue;
    }
    if (!hasText(entry.purpose)) push(findings, "DASHBOARD_GOLDEN_REFERENCE_PURPOSE_MISSING", "Each golden reference entry must include purpose.", { referenceId: id });
    if (!hasText(entry.sourceControlIds)) push(findings, "DASHBOARD_GOLDEN_REFERENCE_SOURCE_CONTROL_IDS_MISSING", "Each golden reference entry must include source control IDs.", { referenceId: id });
    if (!hasText(entry.proofStatus)) push(findings, "DASHBOARD_GOLDEN_REFERENCE_PROOF_STATUS_MISSING", "Each golden reference entry must include proof status.", { referenceId: id });
    if (!hasText(entry.fallback)) push(findings, "DASHBOARD_GOLDEN_REFERENCE_FALLBACK_MISSING", "Each golden reference entry must include fallback guidance.", { referenceId: id });
  }

  const shell = references.get("dashboard_default_shell_event_portfolio_ref");
  const shellIds = new Set(asArray(shell?.sourceControlIds));
  if (!shellIds.has("Main") || !shellIds.has("Content")) {
    push(findings, "DASHBOARD_GOLDEN_REFERENCE_SHELL_MAIN_CONTENT_MISSING", "Default shell reference must trace to Main and Content containers.");
  }

  const grid = references.get("dashboard_collection_grid_table_event_portfolio_ref");
  const gridText = flatten(grid);
  for (const phrase of ["custom header grid", "Collection-bound row grid", "Dynamic fields", "row/detail action metadata"]) {
    if (!gridText.includes(phrase)) {
      push(findings, "DASHBOARD_GOLDEN_REFERENCE_GRID_TABLE_REQUIREMENT_MISSING", `Grid-table reference must include ${phrase}.`, { phrase });
    }
  }

  return findings;
}

function traceValue(trace, ...keys) {
  for (const key of keys) {
    if (hasText(trace?.[key])) return trace[key];
    if (hasText(trace?.references?.[key])) return trace.references[key];
    if (hasText(trace?.goldenReferenceTrace?.[key])) return trace.goldenReferenceTrace[key];
  }
  return "";
}

function traceHasRef(trace, id) {
  const all = [
    traceValue(trace, "pageShellRef", "shellRef"),
    traceValue(trace, "headerAreaRef", "headerRef"),
    traceValue(trace, "filterAreaRef", "filterRef"),
    traceValue(trace, "kpiAreaRef", "kpiRef"),
    traceValue(trace, "contentSectionRef", "sectionRef"),
    traceValue(trace, "gridTableRegionRef", "gridTableRef"),
    ...asArray(trace.referencesUsed),
    ...asArray(trace.goldenReferenceRefs),
  ].map((value) => safeString(value).trim());
  return all.includes(id);
}

function appPlanFields(trace) {
  return new Set([
    ...asArray(trace.appPlanFields),
    ...asArray(trace.currentAppPlanFields),
    ...asArray(trace.fieldsFromAppPlan),
  ].map(normalize).filter(Boolean));
}

function mappedFields(trace) {
  return [
    ...asArray(trace.mappedFields),
    ...asArray(trace.displayFields),
    ...asArray(trace.gridTableFields),
    ...asArray(trace.collectionFields),
  ].map((field) => typeof field === "string" ? field : safeString(field.name || field.field || field.fieldName)).filter(Boolean);
}

function validateTrace(trace, registry) {
  const findings = validateRegistry(registry);
  const selected = safeString(trace.dashboardGoldenReference || trace.goldenReferenceId || trace.goldenReference).trim();
  if (selected !== DEFAULT_REFERENCE) {
    push(findings, "DASHBOARD_TRACE_DEFAULT_GOLDEN_REFERENCE_NOT_SELECTED", "Dashboard trace must select event_portfolio_dashboard_golden_reference.", { selected });
    return findings;
  }

  for (const [key, id, code] of [
    ["page shell", "dashboard_default_shell_event_portfolio_ref", "DASHBOARD_TRACE_SHELL_REF_MISSING"],
    ["header area", "dashboard_header_band_event_portfolio_ref", "DASHBOARD_TRACE_HEADER_REF_MISSING"],
    ["content section", "dashboard_content_section_event_portfolio_ref", "DASHBOARD_TRACE_CONTENT_SECTION_REF_MISSING"],
  ]) {
    if (!traceHasRef(trace, id)) push(findings, code, `Dashboard claiming the default golden reference must trace ${key} to ${id}.`, { referenceId: id });
  }

  const mainId = trace.structure?.mainContainerId || trace.mainContainerId || trace.Main;
  const contentId = trace.structure?.contentContainerId || trace.contentContainerId || trace.Content;
  if (mainId !== "Main" || contentId !== "Content") {
    push(findings, "DASHBOARD_TRACE_MAIN_CONTENT_STRUCTURE_MISSING", "Dashboard trace must include Main container with nested Content container.");
  }

  const requirements = trace.requirements || {};
  if (requirements.filtersRequired !== false && !traceHasRef(trace, "dashboard_filter_group_event_portfolio_ref")) {
    push(findings, "DASHBOARD_TRACE_FILTER_GROUP_REF_MISSING", "Dashboard with required filters must trace the filter area to dashboard_filter_group_event_portfolio_ref.");
  }
  if (requirements.filtersRequired !== false && !hasText(trace.filterBindings || trace.filters)) {
    push(findings, "DASHBOARD_TRACE_FILTER_BINDINGS_MISSING", "Dashboard with required filters must declare real source-list and field filter bindings.");
  }

  if (requirements.summaryMetricsRequired !== false && !traceHasRef(trace, "dashboard_kpi_cards_event_portfolio_ref")) {
    push(findings, "DASHBOARD_TRACE_KPI_REF_MISSING", "Dashboard with required summary metrics must trace KPI area to dashboard_kpi_cards_event_portfolio_ref.");
  }
  if (requirements.summaryMetricsRequired !== false && !hasText(trace.kpiMetrics || trace.summaryMetrics)) {
    push(findings, "DASHBOARD_TRACE_KPI_METRICS_MISSING", "Dashboard with required summary metrics must declare KPI metric definitions and source/calculation mapping.");
  }

  if (requirements.portfolioRegionRequired !== false && !traceHasRef(trace, "dashboard_collection_grid_table_event_portfolio_ref")) {
    push(findings, "DASHBOARD_TRACE_GRID_TABLE_REF_MISSING", "Dashboard with a portfolio/work-queue/list region must trace the grid-table Collection region to dashboard_collection_grid_table_event_portfolio_ref.");
  }
  if (requirements.portfolioRegionRequired !== false && !hasText(trace.gridTableCollection || trace.collectionGridTable)) {
    push(findings, "DASHBOARD_TRACE_GRID_TABLE_COLLECTION_MISSING", "Dashboard with a portfolio/work-queue/list region must declare a grid-table Collection contract.");
  }

  if (requirements.rowActionsRequired !== false && !hasText(trace.dynamicControls || trace.itemTemplateDynamicControls)) {
    push(findings, "DASHBOARD_TRACE_DYNAMIC_CONTROLS_MISSING", "Default golden-reference Collection rows must include item-template Dynamic controls.");
  }
  if (requirements.rowActionsRequired !== false && !hasText(trace.actions || trace.rowActions)) {
    push(findings, "DASHBOARD_TRACE_ROW_ACTIONS_MISSING", "Default golden-reference Collection rows must include required dynamic controls/actions or an explicit no-action reason.");
  }

  const fields = appPlanFields(trace);
  const copiedEventSpecific = [
    ...asArray(trace.copiedEventSpecificFields),
    ...mappedFields(trace).filter((field) => EVENT_SPECIFIC_FIELDS.some((eventField) => normalize(eventField) === normalize(field)) && !fields.has(normalize(field))),
  ].filter(Boolean);
  const domain = normalize(trace.appDomain || trace.applicationDomain || trace.businessDomain);
  const isEventApp = /\bevent|marketing|campaign\b/.test(domain);
  if (!isEventApp && copiedEventSpecific.length) {
    push(findings, "DASHBOARD_TRACE_EVENT_SPECIFIC_FIELDS_COPIED", "Dashboard generation must map the Event Portfolio structure to current App Plan fields instead of copying Marketing Event-specific fields into unrelated apps.", { fields: copiedEventSpecific });
  }

  for (const field of mappedFields(trace)) {
    if (fields.size && !fields.has(normalize(field)) && !/deferred|runtime-proof|required|export-learning/i.test(flatten(trace))) {
      push(findings, "DASHBOARD_TRACE_FIELD_NOT_IN_APP_PLAN", "Mapped dashboard field must exist in the current App Plan or be explicitly proof/deferred.", { field });
    }
  }

  return findings;
}

function normalizeSelectionToTrace(selection) {
  const selectedSectionRefs = asArray(selection.selectedSectionGoldenReferenceIds || selection.sectionGoldenReferenceIds);
  const mappings = asArray(selection.regionMappings || selection.pfpRegionMappings || selection.mappings);
  return {
    dashboardName: selection.dashboardPageName || selection.dashboardName,
    appDomain: selection.appDomain || selection.businessDomain,
    dashboardGoldenReference: selection.selectedPageGoldenReferenceId || selection.dashboardGoldenReference,
    referencesUsed: [
      selection.pageShellRef,
      selection.headerAreaRef,
      selection.filterAreaRef,
      selection.kpiAreaRef,
      selection.contentSectionRef,
      selection.gridTableRegionRef,
      ...selectedSectionRefs,
      ...mappings.map((entry) => entry.goldenReferenceSectionId || entry.selectedGoldenReferenceId),
    ].filter(Boolean),
    structure: selection.structure,
    requirements: selection.requirements,
    appPlanFields: selection.appPlanFields || selection.currentAppPlanFields,
    filterBindings: selection.filters || selection.filterBindings,
    kpiMetrics: selection.metrics || selection.kpiMetrics || selection.summaryMetrics,
    gridTableCollection: selection.gridTableCollection || mappings.find((entry) => entry.goldenReferenceSectionId === "dashboard_collection_grid_table_event_portfolio_ref"),
    mappedFields: selection.mappedFields || mappings.flatMap((entry) => asArray(entry.displayFields || entry.fields)),
    itemTemplateDynamicControls: selection.dynamicControls || selection.itemTemplateDynamicControls || mappings.flatMap((entry) => asArray(entry.dynamicControls || entry.itemTemplateDynamicControls)),
    rowActions: selection.actions || selection.rowActions || mappings.flatMap((entry) => asArray(entry.actions || entry.rowActions)),
  };
}

function validateSelection(selection, registry) {
  const findings = validateTrace(normalizeSelectionToTrace(selection), registry);
  for (const [value, code, message] of [
    [selection.dashboardPageId || selection.dashboardPageName || selection.dashboardName, "DASHBOARD_SELECTION_PAGE_ID_NAME_MISSING", "Dashboard Golden Reference Selection must declare dashboard page id/name."],
    [selection.sourcePageFunctionPlanId || selection.pageFunctionPlanId || selection.pfpPageId, "DASHBOARD_SELECTION_PFP_REF_MISSING", "Dashboard Golden Reference Selection must declare source Page Function Plan page id."],
    [selection.selectedPageGoldenReferenceId || selection.dashboardGoldenReference, "DASHBOARD_SELECTION_PAGE_REFERENCE_MISSING", "Dashboard Golden Reference Selection must declare selected page-level golden reference id."],
    [selection.selectedSectionGoldenReferenceIds || selection.sectionGoldenReferenceIds, "DASHBOARD_SELECTION_SECTION_REFERENCES_MISSING", "Dashboard Golden Reference Selection must declare selected section-level golden reference ids."],
    [selection.regionMappings || selection.pfpRegionMappings || selection.mappings, "DASHBOARD_SELECTION_REGION_MAPPINGS_MISSING", "Dashboard Golden Reference Selection must map each Page Function Plan business region to a golden reference section."],
  ]) {
    if (!hasText(value)) push(findings, code, message);
  }

  const selected = safeString(selection.selectedPageGoldenReferenceId || selection.dashboardGoldenReference).trim();
  if (selected && selected !== DEFAULT_REFERENCE) {
    push(findings, "DASHBOARD_SELECTION_UNKNOWN_PAGE_REFERENCE", "Dashboard Golden Reference Selection must use a plugin-contained page-level golden reference id.", { selected });
  }

  const selectedSections = new Set(asArray(selection.selectedSectionGoldenReferenceIds || selection.sectionGoldenReferenceIds).map((id) => safeString(id).trim()).filter(Boolean));
  const requirements = selection.requirements || {};
  for (const [id, code, required] of [
    ["dashboard_header_band_event_portfolio_ref", "DASHBOARD_SELECTION_HEADER_REF_MISSING", true],
    ["dashboard_content_section_event_portfolio_ref", "DASHBOARD_SELECTION_CONTENT_SECTION_REF_MISSING", true],
    ["dashboard_filter_group_event_portfolio_ref", "DASHBOARD_SELECTION_FILTER_GROUP_REF_MISSING", requirements.filtersRequired !== false],
    ["dashboard_kpi_cards_event_portfolio_ref", "DASHBOARD_SELECTION_KPI_REF_MISSING", requirements.summaryMetricsRequired !== false],
    ["dashboard_collection_grid_table_event_portfolio_ref", "DASHBOARD_SELECTION_GRID_TABLE_REF_MISSING", requirements.portfolioRegionRequired !== false],
  ]) {
    if (required && !selectedSections.has(id)) {
      push(findings, code, `Dashboard Golden Reference Selection selectedSectionGoldenReferenceIds[] must include ${id}.`, { referenceId: id });
    }
  }

  const mappings = asArray(selection.regionMappings || selection.pfpRegionMappings || selection.mappings);
  for (const mapping of mappings) {
    const context = { region: mapping.pfpRegionId || mapping.pfpRegionName || mapping.regionName };
    for (const [value, code, message] of [
      [mapping.pfpRegionId || mapping.pfpRegionName || mapping.regionName, "DASHBOARD_SELECTION_MAPPING_REGION_MISSING", "Each mapping must identify the Page Function Plan business region."],
      [mapping.goldenReferenceSectionId || mapping.selectedGoldenReferenceId, "DASHBOARD_SELECTION_MAPPING_REFERENCE_MISSING", "Each mapping must identify the selected section-level golden reference id."],
      [mapping.sourceDataList || mapping.sourceList, "DASHBOARD_SELECTION_MAPPING_SOURCE_LIST_MISSING", "Each mapping must preserve the source data list."],
      [mapping.fields || mapping.displayFields || mapping.sourceFields, "DASHBOARD_SELECTION_MAPPING_FIELDS_MISSING", "Each mapping must preserve source/display fields."],
    ]) {
      if (!hasText(value)) push(findings, code, message, context);
    }
    if (!hasText(mapping.filters) && !hasText(mapping.metrics) && !hasText(mapping.actions) && !hasText(mapping.displayFields)) {
      push(findings, "DASHBOARD_SELECTION_MAPPING_FUNCTION_DETAIL_MISSING", "Each mapping must preserve filters, metrics, actions, or display fields from the Page Function Plan.", context);
    }
  }
  return findings;
}

function selectionId(selection) {
  return safeString(selection.selectionId || selection.dashboardGoldenReferenceSelectionId || selection.id).trim();
}

function validateBlueprint(blueprint, selection, registry) {
  const findings = selection ? validateSelection(selection, registry) : validateRegistry(registry);
  if (!selection) {
    push(findings, "DASHBOARD_BLUEPRINT_SELECTION_ARTIFACT_MISSING", "Dashboard blueprint validation requires a Dashboard Golden Reference Selection artifact.");
    return findings;
  }
  const blueprintSelectionRef = safeString(blueprint.dashboardGoldenReferenceSelectionRef || blueprint.goldenReferenceSelectionId || blueprint.selectionId).trim();
  if (!blueprintSelectionRef) {
    push(findings, "DASHBOARD_BLUEPRINT_SELECTION_REF_MISSING", "Every Dashboard blueprint must reference the selected Dashboard Golden Reference Selection.");
  } else if (selectionId(selection) && blueprintSelectionRef !== selectionId(selection)) {
    push(findings, "DASHBOARD_BLUEPRINT_SELECTION_REF_MISMATCH", "Dashboard blueprint selection reference must match the Dashboard Golden Reference Selection artifact.", { blueprintSelectionRef, selectionId: selectionId(selection) });
  }

  const sections = asArray(blueprint.sections || blueprint.dashboardSections);
  if (!sections.length) {
    push(findings, "DASHBOARD_BLUEPRINT_SECTIONS_MISSING", "Dashboard blueprint must include dashboard sections.");
  }
  for (const section of sections) {
    const reference = safeString(section.derivedFromGoldenReference || section.goldenReferenceSectionId).trim();
    const context = { section: section.sectionId || section.name || section.regionName };
    if (!reference) {
      push(findings, "DASHBOARD_BLUEPRINT_SECTION_REFERENCE_MISSING", "Every dashboard blueprint section must declare derivedFromGoldenReference.", context);
    }
    for (const [value, code, message] of [
      [section.sourceDataList || section.sourceList, "DASHBOARD_BLUEPRINT_SECTION_SOURCE_LIST_MISSING", "Blueprint section must preserve source data list from selection."],
      [section.fields || section.displayFields || section.sourceFields, "DASHBOARD_BLUEPRINT_SECTION_FIELDS_MISSING", "Blueprint section must preserve fields from selection."],
    ]) {
      if (!hasText(value)) push(findings, code, message, context);
    }
    if (!hasText(section.filters) && !hasText(section.metrics) && !hasText(section.actions) && !hasText(section.displayFields)) {
      push(findings, "DASHBOARD_BLUEPRINT_SECTION_FUNCTION_DETAIL_MISSING", "Blueprint section must preserve filters, metrics, actions, or display fields from selection.", context);
    }
  }

  return findings;
}

function validateResource(resource, selection, registry) {
  const findings = selection ? validateSelection(selection, registry) : validateRegistry(registry);
  if (!selection) {
    push(findings, "DASHBOARD_RESOURCE_SELECTION_ARTIFACT_MISSING", "Generated Dashboard resource conformance requires a Dashboard Golden Reference Selection artifact.");
    return findings;
  }
  const resourceSelectionRef = safeString(resource.dashboardGoldenReferenceSelectionRef || resource.goldenReferenceSelectionId || resource.selectionId).trim();
  if (!resourceSelectionRef) {
    push(findings, "DASHBOARD_RESOURCE_SELECTION_REF_MISSING", "Generated Dashboard resources must preserve a reference to the Dashboard Golden Reference Selection.");
  } else if (selectionId(selection) && resourceSelectionRef !== selectionId(selection)) {
    push(findings, "DASHBOARD_RESOURCE_SELECTION_REF_MISMATCH", "Generated Dashboard resource selection reference must match the Dashboard Golden Reference Selection artifact.", { resourceSelectionRef, selectionId: selectionId(selection) });
  }

  const trace = normalizeSelectionToTrace({
    ...selection,
    structure: resource.structure || selection.structure,
    selectedSectionGoldenReferenceIds: resource.referencesUsed || selection.selectedSectionGoldenReferenceIds,
    mappedFields: resource.mappedFields || selection.mappedFields,
    itemTemplateDynamicControls: resource.dynamicControls || resource.itemTemplateDynamicControls || selection.itemTemplateDynamicControls,
    rowActions: resource.actions || resource.rowActions || selection.rowActions,
  });
  findings.push(...validateTrace(trace, registry).filter((finding) => !findings.some((existing) => existing.code === finding.code && existing.message === finding.message)));

  const major = new Set([
    ...asArray(resource.majorSections),
    ...asArray(resource.structuralRegions),
    ...asArray(resource.generatedSections).map((section) => section.id || section.name || section.regionId),
  ].map((value) => safeString(value).trim()).filter(Boolean));
  for (const [id, code] of [
    ["Main", "DASHBOARD_RESOURCE_MAIN_CONTAINER_MISSING"],
    ["Content", "DASHBOARD_RESOURCE_CONTENT_CONTAINER_MISSING"],
    ["event_portfolio_header_band", "DASHBOARD_RESOURCE_HEADER_BAND_MISSING"],
    ["event_portfolio_pipeline_section", "DASHBOARD_RESOURCE_CONTENT_SECTION_MISSING"],
  ]) {
    if (!major.has(id)) push(findings, code, `Generated Dashboard resource must include structural region ${id}.`, { structuralRegion: id });
  }
  const requirements = selection.requirements || {};
  if (requirements.filtersRequired !== false && !major.has("event_portfolio_filter_group")) push(findings, "DASHBOARD_RESOURCE_FILTER_GROUP_MISSING", "Generated Dashboard resource must include filter group when filters are required.");
  if (requirements.summaryMetricsRequired !== false && !major.has("kpi_cards_wrapper") && !major.has("event_portfolio_kpi_row")) push(findings, "DASHBOARD_RESOURCE_KPI_CARDS_WRAPPER_MISSING", "Generated Dashboard resource must include KPI cards wrapper when summary metrics are required.");
  if (requirements.portfolioRegionRequired !== false && !major.has("Event Pipeline Grid-Table") && !major.has("Event Pipeline Grid Table") && !major.has("event_pipeline_grid_table_collection")) push(findings, "DASHBOARD_RESOURCE_GRID_TABLE_COLLECTION_MISSING", "Generated Dashboard resource must include grid-table Collection region when a portfolio/work queue/list region is required.");

  const sections = asArray(resource.generatedSections || resource.sections);
  for (const section of sections) {
    if (!hasText(section.derivedFromGoldenReference || section.goldenReferenceSectionId)) {
      push(findings, "DASHBOARD_RESOURCE_SECTION_PROVENANCE_MISSING", "Generated Dashboard major sections must preserve inspectable golden-reference provenance.", { section: section.id || section.name });
    }
  }

  return findings;
}

const json = process.argv.includes("--json");
if (process.argv.includes("--help")) usage(0);
const registryPath = argValue("--registry") || DEFAULT_REGISTRY;
const tracePath = argValue("--dashboard-trace");
const selectionPath = argValue("--dashboard-selection");
const blueprintPath = argValue("--dashboard-blueprint");
const resourcePath = argValue("--dashboard-resource");

let findings = [];
try {
  const registry = readJson(registryPath);
  const selection = selectionPath ? readJson(selectionPath) : null;
  if (resourcePath) findings = validateResource(readJson(resourcePath), selection, registry);
  else if (blueprintPath) findings = validateBlueprint(readJson(blueprintPath), selection, registry);
  else if (selectionPath) findings = validateSelection(selection, registry);
  else findings = tracePath ? validateTrace(readJson(tracePath), registry) : validateRegistry(registry);
} catch (error) {
  findings.push({ level: "error", code: "DASHBOARD_GOLDEN_REFERENCE_VALIDATOR_EXCEPTION", message: error.message });
}

const report = {
  status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
  registryPath,
  dashboardTracePath: tracePath || null,
  dashboardSelectionPath: selectionPath || null,
  dashboardBlueprintPath: blueprintPath || null,
  dashboardResourcePath: resourcePath || null,
  findings,
};

if (json) console.log(JSON.stringify(report, null, 2));
else if (report.status === "pass") console.log("Dashboard golden reference registry validation passed.");
else console.error(JSON.stringify(report, null, 2));

process.exit(report.status === "pass" ? 0 : 1);

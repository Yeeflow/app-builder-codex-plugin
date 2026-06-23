#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { asArray, isObject, parseJsonMaybe, readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = path.join(ROOT, "docs/reference/dashboard-golden-references.json");
const DEFAULT_REFERENCE_ID = "event_portfolio_dashboard_golden_reference";
const DASHBOARD_LAYOUT_TEMPLATE_ID = "dashboard-page-layouts-v1.1";
const FILTER_TYPES = new Set(["select-filter", "radio-filter", "checkbox-filter"]);
const GRID_TYPES = new Set(["grid", "flex_grid"]);
const USER_FIELD_HINT = /\b(user|owner|assignee|requester|borrower|manager|approver|employee|person|people|accountid|account id)\b/i;
const V11_ROOT_CONTENT_CHILD_IDS = new Set(["page_title_section", "content_card_wrapper", "kpi_metrics_wrapper", "2_columns_section", "3_columns_section", "2_columns_60/40_section"]);

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.selection && !args.blueprint && !args.package && !args.registry && !args.runtimeFilterProof)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateDashboardGoldenReferenceConformance(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateDashboardGoldenReferenceConformance(options = {}) {
  const findings = [];
  const registryPath = path.resolve(options.registry || REGISTRY_PATH);
  const registry = readJson(registryPath, findings, "DASH_GOLDEN_REGISTRY_MISSING");
  const references = asArray(registry?.references);
  const defaultId = registry?.defaultDashboardGoldenReferenceId || DEFAULT_REFERENCE_ID;
  const defaultReference = references.find((item) => item?.id === defaultId) || references[0] || null;
  const registryIds = new Set(references.map((item) => item.id).filter(Boolean));

  validateRegistry(registry, defaultReference, { findings });
  if (options.selection) validateSelection(readJson(path.resolve(options.selection), findings, "DASH_GOLDEN_SELECTION_MISSING"), { findings, registryIds, defaultId, defaultReference });
  if (options.blueprint) validateBlueprint(readJson(path.resolve(options.blueprint), findings, "DASH_GOLDEN_BLUEPRINT_MISSING"), { findings, defaultId, defaultReference });
  if (options.package) validatePackage(path.resolve(options.package), { findings, defaultId, defaultReference });
  if (options.runtimeFilterProof) validateRuntimeFilterProof(readJson(path.resolve(options.runtimeFilterProof), findings, "DASH_FILTER_RUNTIME_PROOF_MISSING"), { findings });

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    registry: registryPath,
    selection: options.selection ? path.resolve(options.selection) : null,
    blueprint: options.blueprint ? path.resolve(options.blueprint) : null,
    package: options.package ? path.resolve(options.package) : null,
    runtimeFilterProof: options.runtimeFilterProof ? path.resolve(options.runtimeFilterProof) : null,
    findings,
  };
}

function validateRegistry(registry, reference, context) {
  if (!registry) return;
  if (!reference) {
    context.findings.push(error("DASH_GOLDEN_DEFAULT_REFERENCE_MISSING", "Dashboard Golden Reference registry must include the default Event Portfolio reference."));
    return;
  }
  if (!isObject(reference.exportShape?._ak_c) || !isObject(reference.exportShape?._ak_c_opt)) {
    context.findings.push(error("DASH_GOLDEN_EXPORT_SHAPE_MISSING", "Default Dashboard Golden Reference must preserve export-shaped _ak_c and _ak_c_opt."));
    return;
  }

  const referenceIndex = buildReferenceIndex(reference);
  const approvedFlex = new Set(asArray(reference.allowedGridTableInternalFlexGridIds).map(String));

  for (const requiredId of requiredRegionIds(reference, { includeOptional: true })) {
    if (!referenceIndex.byKey.has(requiredId)) {
      context.findings.push(error("DASH_GOLDEN_REFERENCE_REGION_MISSING", "Default Dashboard Golden Reference is missing a registered reusable region.", { regionId: requiredId }));
    }
  }

  validateReferenceQuality(reference, referenceIndex, context.findings);

  const approvedPresent = [...approvedFlex].filter((id) => referenceIndex.byKey.has(id));
  context.findings.push({
    level: "info",
    code: "DASH_GOLDEN_APPROVED_GRID_TABLE_INTERNALS",
    message: "Approved grid/flex_grid nodes are limited to grid-table internal row/header structures.",
    approvedGridTableInternalFlexGridIds: approvedPresent,
  });
}

function validateReferenceQuality(reference, referenceIndex, findings) {
  const approvedFlex = new Set(asArray(reference.allowedGridTableInternalFlexGridIds).map(String));
  for (const entry of referenceIndex.controls) {
    const keys = identityCandidates(entry.control);
    const key = keys.find((candidate) => approvedFlex.has(candidate)) || keys[0] || entry.pointer;
    if (GRID_TYPES.has(entry.control?.type) && !keys.some((candidate) => approvedFlex.has(candidate))) {
      findings.push(error("DASH_GOLDEN_REFERENCE_HIGH_LEVEL_GRID", "High-level dashboard layout regions must use container, not grid/flex_grid; only registered grid-table internal row/header grids are allowed.", { regionId: key, type: entry.control.type, pointer: entry.pointer }));
    }
  }

  for (const regionId of asArray(reference.highLevelContainerRegionIds)) {
    const entry = referenceIndex.byKey.get(regionId);
    if (entry && entry.control?.type !== "container") {
      findings.push(error("DASH_GOLDEN_REFERENCE_HIGH_LEVEL_NOT_CONTAINER", "High-level dashboard region must be a container.", { regionId, actualType: entry.control?.type, pointer: entry.pointer }));
    }
  }

  for (const regionId of asArray(reference.requiredFullWidthRegionIds)) {
    const entry = referenceIndex.byKey.get(regionId);
    if (entry && !isFullWidth(entry.control)) {
      findings.push(error("DASH_GOLDEN_REFERENCE_REQUIRED_FULL_WIDTH", "Required dashboard reference region must be Full width.", { regionId, pointer: entry.pointer, width: entry.control?.width || null, widthtype: entry.control?.attrs?.style?.widthtype || null }));
    }
  }

  const kpiRow = referenceIndex.byKey.get(reference.kpiCardParentRegionId || "event_portfolio_kpi_row");
  for (const child of asArray(kpiRow?.control?.children).filter((item) => item?.type === "container")) {
    if (!isFullWidth(child)) {
      findings.push(error("DASH_GOLDEN_REFERENCE_KPI_CARD_FULL_WIDTH", "Every KPI card under event_portfolio_kpi_row must be Full width.", { regionId: firstIdentity(child) || null }));
    }
  }

  const main = findFirstByIdentity(reference.exportShape._ak_c, "Main");
  const content = findFirstByIdentity(reference.exportShape._ak_c, "Content");
  if (hasNonzeroPadding(content) || (!hasZeroPadding(main) && !hasZeroPadding(content))) {
    findings.push(error("DASH_GOLDEN_REFERENCE_ROOT_CONTENT_PADDING", "Dashboard root Content area padding must be zero.", { mainPadding: getPadding(main) || null, contentPadding: getPadding(content) || null }));
  }

  for (const entry of referenceIndex.controls.filter((item) => FILTER_TYPES.has(item.control?.type))) {
    validateFilterContract(entry.control, findings, "DASH_GOLDEN_REFERENCE", { pointer: entry.pointer });
  }
}

function validateSelection(selection, context) {
  if (!selection) return;
  const selectedId = String(selection.selectedGoldenReferenceId || selection.goldenReferenceId || "");
  if (!selectedId) {
    context.findings.push(error("DASH_GOLDEN_SELECTION_ID_MISSING", "Dashboard Golden Reference Selection must declare selectedGoldenReferenceId."));
  } else if (!context.registryIds.has(selectedId)) {
    context.findings.push(error("DASH_GOLDEN_SELECTION_ID_UNKNOWN", "Selected dashboard golden reference ID is not registered.", { selectedGoldenReferenceId: selectedId }));
  }
  if (selectedId && selectedId !== context.defaultId && !present(selection.alternativeReason)) {
    context.findings.push(error("DASH_GOLDEN_ALTERNATIVE_REASON_MISSING", "Selections that do not use the default Event Portfolio reference must include an explicit reason.", { selectedGoldenReferenceId: selectedId }));
  }
  const subRegions = new Set(asArray(selection.selectedSubRegionReferences || selection.subRegionReferences).map((item) => String(isObject(item) ? item.id : item)));
  for (const id of ["event_portfolio_header_band", "event_portfolio_pipeline_section"]) {
    if (!subRegions.has(id)) context.findings.push(error("DASH_GOLDEN_SELECTION_SUBREGION_MISSING", "Dashboard Golden Reference Selection is missing a required sub-region reference.", { subRegionReference: id }));
  }
  if (planned(selection, "filters") && !subRegions.has("event_portfolio_filter_group")) context.findings.push(error("DASH_GOLDEN_SELECTION_FILTER_REGION_MISSING", "Planned filters require event_portfolio_filter_group in selectedSubRegionReferences."));
  if (planned(selection, "kpis") && !subRegions.has("kpi_cards_wrapper")) context.findings.push(error("DASH_GOLDEN_SELECTION_KPI_REGION_MISSING", "Planned KPIs require kpi_cards_wrapper in selectedSubRegionReferences."));
  if (planned(selection, "gridTable") && !subRegions.has("Event Pipeline Grid-Table")) context.findings.push(error("DASH_GOLDEN_SELECTION_GRID_TABLE_REGION_MISSING", "Planned table/queue regions require Event Pipeline Grid-Table in selectedSubRegionReferences."));
  for (const [key, code] of [
    ["businessMapping", "DASH_GOLDEN_SELECTION_BUSINESS_MAPPING_MISSING"],
    ["dataListSourceMapping", "DASH_GOLDEN_SELECTION_DATA_LIST_MAPPING_MISSING"],
    ["kpiMetricMapping", "DASH_GOLDEN_SELECTION_KPI_MAPPING_MISSING"],
    ["filterFieldMapping", "DASH_GOLDEN_SELECTION_FILTER_MAPPING_MISSING"],
    ["gridTableFieldMapping", "DASH_GOLDEN_SELECTION_GRID_TABLE_MAPPING_MISSING"],
    ["actionMapping", "DASH_GOLDEN_SELECTION_ACTION_MAPPING_MISSING"],
  ]) {
    if (mappingRequired(selection, key) && emptyMapping(selection[key])) context.findings.push(error(code, `Dashboard Golden Reference Selection must include ${key}.`));
  }
}

function validateBlueprint(blueprint, context) {
  if (!blueprint) return;
  if (!isObject(blueprint.goldenReferenceSelection) && !present(blueprint.goldenReferenceSelectionRef)) {
    context.findings.push(error("DASH_GOLDEN_BLUEPRINT_SELECTION_MISSING", "Dashboard blueprint must include or reference the Dashboard Golden Reference Selection artifact."));
  }
  if (String(blueprint.derivedFromGoldenReference || "") !== context.defaultId) {
    context.findings.push(error("DASH_GOLDEN_BLUEPRINT_DERIVED_FROM_MISSING", "Dashboard blueprint must include derivedFromGoldenReference for the default Event Portfolio reference.", { expected: context.defaultId, actual: blueprint.derivedFromGoldenReference || null }));
  }
  const sectionRefs = collectSectionReferences(blueprint);
  for (const id of requiredRegionsFromPlan(blueprint, context.defaultReference)) {
    if (!sectionRefs.has(id)) context.findings.push(error(regionMissingCode(id, "BLUEPRINT"), "Dashboard blueprint section is missing required golden-reference provenance.", { subRegionReference: id }));
  }
  rejectCopiedMarketingTerms(blueprint, context.findings, "DASH_GOLDEN_BLUEPRINT_MARKETING_FIELD_LEAKAGE");
}

function validatePackage(packagePath, context) {
  if (!fs.existsSync(packagePath)) {
    context.findings.push(error("DASH_GOLDEN_PACKAGE_MISSING", "Package file is missing.", { package: packagePath }));
    return;
  }
  let decoded;
  try {
    ({ decoded } = readDecodedYapk(packagePath));
  } catch (err) {
    context.findings.push(error("DASH_GOLDEN_PACKAGE_DECODE_FAILED", `Could not decode package Resource: ${err.message}`, { package: packagePath }));
    return;
  }
  const unrelatedToMarketing = !/event|marketing|campaign/i.test(`${decoded?.ListSet?.Title || ""} ${decoded?.Title || ""}`);
  for (const page of collectDashboardPages(decoded)) {
    if (String(page.resource?.derivedFromGoldenReference || page.resource?.attrs?.derivedFromGoldenReference || "") !== context.defaultId) {
      context.findings.push(error("DASH_GOLDEN_RESOURCE_DERIVED_FROM_MISSING", "Generated dashboard resource must include derivedFromGoldenReference.", { page: page.title, expected: context.defaultId }));
    }
    if (!hasMainContent(page.resource)) {
      context.findings.push(error("DASH_GOLDEN_MAIN_CONTENT_MISSING", "Generated dashboard must contain Main > Content.", { page: page.title }));
    }
    const childRegions = meaningfulContentChildren(page.resource);
    if (childRegions.length === 0) {
      context.findings.push(error("DASH_GOLDEN_SHELL_ONLY", "Generated dashboard only has Main > Content and no meaningful child regions.", { page: page.title }));
    }
    if (isDashboardPageLayoutsV11(page.resource)) {
      validateNoCompetingGoldenShellAtV11Root(page, context.findings);
    }
    validateExportShapeParity(page, context);
    validateUserFieldControls(page, context.findings);
    const resourceIndex = buildTreeIndex(findFirstByIdentity(page.resource, "Main") || page.resource);
    if (planned(page.resource, "gridTable") && !hasCollectionInsideRegion(resourceIndex, "Event Pipeline Grid-Table")) {
      context.findings.push(error("DASH_GOLDEN_GRID_TABLE_COLLECTION_MISSING", "Planned dashboard table/queue must materialize as a grid-table Collection region derived from Event Pipeline Grid-Table.", { page: page.title }));
    }
    if (unrelatedToMarketing) rejectCopiedMarketingTerms(page.resource, context.findings, "DASH_GOLDEN_MARKETING_FIELD_LEAKAGE", { page: page.title });
  }
}

function validateExportShapeParity(page, context) {
  const reference = context.defaultReference;
  const referenceIndex = buildReferenceIndex(reference);
  const resourceIndex = buildTreeIndex(findFirstByIdentity(page.resource, "Main") || page.resource);
  const isV11 = isDashboardPageLayoutsV11(page.resource);
  const requiredIds = requiredRegionsFromPlan(page.resource, reference);
  const missing = [];

  for (const regionId of requiredIds) {
    const referenceEntry = referenceIndex.byKey.get(regionId);
    const generatedEntry = resourceIndex.byKey.get(regionId);
    if (!referenceEntry || !generatedEntry) {
      missing.push(regionId);
      context.findings.push(error(regionMissingCode(regionId, "RESOURCE"), "Generated dashboard resource is missing required golden-reference export region.", { page: page.title, subRegionReference: regionId }));
      continue;
    }
    if (generatedEntry.control?.type !== referenceEntry.control?.type) {
      context.findings.push(error("DASH_GOLDEN_EXPORT_CONTROL_TYPE_MISMATCH", "Generated dashboard region must preserve golden-reference control type.", { page: page.title, regionId, expected: referenceEntry.control?.type, actual: generatedEntry.control?.type }));
    }
    if (!isV11 && generatedEntry.depth !== referenceEntry.depth) {
      context.findings.push(error("DASH_GOLDEN_EXPORT_NESTING_DEPTH_MISMATCH", "Generated dashboard region must preserve golden-reference nesting depth.", { page: page.title, regionId, expectedDepth: referenceEntry.depth, actualDepth: generatedEntry.depth }));
    }
  }

  if (missing.length > 0) {
    context.findings.push(error("DASH_GOLDEN_EXPORT_SHAPE_SIMPLIFIED", "Generated dashboard has provenance markers but not the required export-shaped Golden Reference structure.", { page: page.title, missingRegions: missing }));
  }

  if (!isV11) validateRegionOrder(page, reference, resourceIndex, context.findings);
  validateResourceLayoutContracts(page, reference, resourceIndex, context.findings, { isDashboardPageLayoutsV11: isV11 });
  validateFilterContractsAndStaticLinks(page, reference, resourceIndex, context.findings);
}

function validateRegionOrder(page, reference, resourceIndex, findings) {
  let previousOrder = -1;
  for (const regionId of asArray(reference.requiredRegionOrder)) {
    const entry = resourceIndex.byKey.get(regionId);
    if (!entry) continue;
    if (entry.order < previousOrder) {
      findings.push(error("DASH_GOLDEN_REGION_ORDER_MISMATCH", "Generated dashboard must preserve required Golden Reference region order.", { page: page.title, regionId }));
    }
    previousOrder = entry.order;
  }
}

function validateResourceLayoutContracts(page, reference, resourceIndex, findings, options = {}) {
  const approvedFlex = new Set(asArray(reference.allowedGridTableInternalFlexGridIds).map(String));
  if (!options.isDashboardPageLayoutsV11) {
    for (const entry of resourceIndex.controls) {
      const keys = identityCandidates(entry.control);
      const regionId = keys.find((candidate) => approvedFlex.has(candidate)) || keys[0] || entry.pointer;
      if (GRID_TYPES.has(entry.control?.type) && !keys.some((candidate) => approvedFlex.has(candidate))) {
        findings.push(error("DASH_GOLDEN_RESOURCE_HIGH_LEVEL_GRID", "Generated high-level dashboard layout regions must use container, not grid/flex_grid; only registered grid-table internal rows may use grid/flex_grid.", { page: page.title, regionId, type: entry.control.type, pointer: entry.pointer }));
      }
    }
  }
  for (const regionId of asArray(reference.highLevelContainerRegionIds)) {
    const entry = resourceIndex.byKey.get(regionId);
    if (entry && entry.control?.type !== "container") {
      findings.push(error("DASH_GOLDEN_RESOURCE_HIGH_LEVEL_NOT_CONTAINER", "Generated high-level dashboard region must be a container.", { page: page.title, regionId, actualType: entry.control?.type }));
    }
  }
  for (const regionId of asArray(reference.requiredFullWidthRegionIds)) {
    const entry = resourceIndex.byKey.get(regionId);
    if (entry && !isGeneratedFullWidth(entry.control)) {
      findings.push(error("DASH_GOLDEN_RESOURCE_REQUIRED_FULL_WIDTH", "Generated dashboard required region must be Full width.", { page: page.title, regionId, width: entry.control?.width || null, widthtype: entry.control?.attrs?.style?.widthtype || null }));
    }
  }
  const kpiRow = resourceIndex.byKey.get(reference.kpiCardParentRegionId || "event_portfolio_kpi_row");
  for (const child of asArray(kpiRow?.control?.children).filter((item) => item?.type === "container")) {
    if (!isGeneratedFullWidth(child)) {
      findings.push(error("DASH_GOLDEN_RESOURCE_KPI_CARD_FULL_WIDTH", "Generated KPI cards under event_portfolio_kpi_row must be Full width.", { page: page.title, regionId: firstIdentity(child) || null }));
    }
  }
  const main = findFirstByIdentity(page.resource, "Main");
  const content = findFirstByIdentity(page.resource, "Content");
  if (!usesDashboardV11Shell(page.resource) && (hasNonzeroPadding(content) || (!hasZeroPadding(main) && !hasZeroPadding(content)))) {
    findings.push(error("DASH_GOLDEN_RESOURCE_ROOT_CONTENT_PADDING", "Generated dashboard root Content area padding must be zero.", { page: page.title, mainPadding: getPadding(main) || null, contentPadding: getPadding(content) || null }));
  }
}

function validateFilterContractsAndStaticLinks(page, reference, resourceIndex, findings) {
  const filterEntries = resourceIndex.controls.filter((entry) => FILTER_TYPES.has(entry.control?.type));
  for (const entry of filterEntries) {
    validateFilterContract(entry.control, findings, "DASH_GOLDEN_RESOURCE", { page: page.title, pointer: entry.pointer });
  }
  if (!planned(page.resource, "filters") || filterEntries.length === 0) return;
  const consumers = resourceIndex.controls.filter((entry) => ["collection", "summary"].includes(entry.control?.type));
  const consumerText = JSON.stringify(consumers.map((entry) => entry.control));
  for (const entry of filterEntries) {
    const tokens = filterReferenceTokens(entry.control);
    if (tokens.length > 0 && !tokens.some((token) => consumerText.includes(token))) {
      findings.push(error("DASH_GOLDEN_FILTER_STATIC_LINK_MISSING", "Generated filter controls must have static query/variable linkage to Collection/KPI consumers; static proof does not replace runtime linkage proof.", { page: page.title, filter: firstIdentity(entry.control) || entry.pointer, tokens }));
    }
  }
}

function validateFilterContract(control, findings, prefix, extra = {}) {
  const label = filterLabel(control);
  const placeholder = filterPlaceholder(control);
  if (!present(label)) findings.push(error(`${prefix}_FILTER_LABEL_MISSING`, "Dashboard filter must preserve a visible label.", { ...extra, filter: firstIdentity(control) || null }));
  if (!present(placeholder)) findings.push(error(`${prefix}_FILTER_PLACEHOLDER_MISSING`, "Dashboard filter must preserve a placeholder.", { ...extra, filter: firstIdentity(control) || null }));
  if (present(label) && present(placeholder) && normalizeText(label) === normalizeText(placeholder)) {
    findings.push(error(`${prefix}_FILTER_LABEL_PLACEHOLDER_DUPLICATED`, "Dashboard filter label and placeholder must be separate text.", { ...extra, filter: firstIdentity(control) || null, label, placeholder }));
  }
  if (["radio-filter", "select-filter", "checkbox-filter"].includes(control?.type) && !present(control?.attrs?.data?.field)) {
    findings.push(error(`${prefix}_FILTER_DATA_FIELD_MISSING`, "Dashboard data filter must preserve attrs.data.field.", { ...extra, filter: firstIdentity(control) || null }));
  }
  if (!present(control?.attrs?.display_f)) findings.push(error(`${prefix}_FILTER_DISPLAY_FIELD_MISSING`, "Dashboard data filter must preserve display_f.", { ...extra, filter: firstIdentity(control) || null }));
  if (!present(control?.attrs?.value_f)) findings.push(error(`${prefix}_FILTER_VALUE_FIELD_MISSING`, "Dashboard data filter must preserve value_f.", { ...extra, filter: firstIdentity(control) || null }));
  if (Object.prototype.hasOwnProperty.call(control?.attrs || {}, "apply_t") && !present(control?.attrs?.apply_t)) {
    findings.push(error(`${prefix}_FILTER_APPLY_TARGET_MISSING`, "Dashboard data filter must preserve apply_t when the reference uses it.", { ...extra, filter: firstIdentity(control) || null }));
  }
}

function validateUserFieldControls(page, findings) {
  for (const entry of page.controls) {
    if (entry.control?.type !== "dynamic-field") continue;
    const text = JSON.stringify({
      id: entry.control?.id,
      name: entry.control?.name,
      label: entry.control?.label,
      attrs: entry.control?.attrs,
      binding: entry.control?.binding,
      fieldType: entry.control?.fieldType,
    });
    if (USER_FIELD_HINT.test(text) || /user|person|identity/i.test(String(entry.control?.attrs?.fieldType || entry.control?.fieldType || ""))) {
      findings.push(error("DASH_GOLDEN_USER_FIELD_DYNAMIC_FIELD", "User/identity fields must render with dynamic-user, not dynamic-field.", { page: page.title, pointer: entry.pointer, field: entry.control?.attrs?.field || entry.control?.attrs?.fieldName || entry.control?.name || null }));
    }
  }
}

function validateRuntimeFilterProof(proof, context) {
  if (!proof) return;
  const selected = proof.selectedFilterValue || proof.selectedValue || proof.filterSelection?.selectedValue || proof.after?.selectedFilterValue;
  if (!present(selected)) {
    context.findings.push(error("DASH_FILTER_RUNTIME_SELECTION_MISSING", "Runtime filter linkage proof must record the selected filter option."));
  }
  const beforeRows = normalizeObservedValues(proof.before?.tableRows || proof.beforeRows || proof.before?.rows || proof.tableBefore);
  const afterRows = normalizeObservedValues(proof.after?.tableRows || proof.afterRows || proof.after?.rows || proof.tableAfter);
  const beforeKpis = normalizeObservedValues(proof.before?.kpiValues || proof.beforeKpis || proof.before?.kpis || proof.kpisBefore);
  const afterKpis = normalizeObservedValues(proof.after?.kpiValues || proof.afterKpis || proof.after?.kpis || proof.kpisAfter);
  const changed = (beforeRows.length > 0 && afterRows.length > 0 && JSON.stringify(beforeRows) !== JSON.stringify(afterRows))
    || (beforeKpis.length > 0 && afterKpis.length > 0 && JSON.stringify(beforeKpis) !== JSON.stringify(afterKpis))
    || proof.dataChanged === true
    || proof.tableDataChanged === true
    || proof.kpiDataChanged === true;
  if (!changed) {
    context.findings.push(error("DASH_FILTER_RUNTIME_DATA_UNCHANGED", "Runtime filter linkage proof must show table and/or KPI data changing after a filter selection; static package validation alone is not runtime proof.", {
      selectedFilterValue: selected || null,
      beforeRowCount: beforeRows.length,
      afterRowCount: afterRows.length,
      beforeKpiCount: beforeKpis.length,
      afterKpiCount: afterKpis.length,
    }));
  }
  const screenshots = asArray(proof.screenshots || proof.evidence?.screenshots);
  if (screenshots.length > 0 && screenshots.length < 2) {
    context.findings.push(error("DASH_FILTER_RUNTIME_SCREENSHOT_PAIR_MISSING", "Runtime filter linkage proof should save before and after screenshots when screenshots are recorded."));
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
      pages.push({
        title: String(page?.Title || page?.Name || page?.LayoutID || `dashboard-${pageIndex}`),
        pointer: `decoded.Pages[${pageIndex}].LayoutInResources[${resourceIndex}].Resource`,
        resource: parsed,
        controls,
      });
    });
  });
  return pages;
}

function buildReferenceIndex(reference) {
  return buildTreeIndex(reference?.exportShape?._ak_c || {});
}

function buildTreeIndex(root) {
  const controls = [];
  collectControls(root, controls, "$", 0, { count: 0 });
  const byKey = new Map();
  for (const entry of controls) {
    for (const key of identityCandidates(entry.control)) {
      if (!byKey.has(key)) byKey.set(key, entry);
    }
  }
  return { root, controls, byKey };
}

function collectControls(node, out, pointer, depth = 0, orderRef = { count: 0 }) {
  if (!isObject(node)) return;
  if (node.type) out.push({ control: node, pointer, depth, order: orderRef.count++ });
  for (const key of ["children", "columns", "controls"]) asArray(node[key]).forEach((child, index) => collectControls(child, out, `${pointer}.${key}[${index}]`, depth + 1, orderRef));
}

function hasMainContent(resource) {
  const main = findFirstByIdentity(resource, "Main");
  const content = asArray(main?.children).find((child) => hasIdentity(child, "Content"));
  return Boolean(main && content);
}

function meaningfulContentChildren(resource) {
  const main = findFirstByIdentity(resource, "Main");
  const content = asArray(main?.children).find((child) => hasIdentity(child, "Content"));
  return asArray(content?.children).filter((child) => isObject(child) && child.type);
}

function findFirstByIdentity(root, expected) {
  let found = null;
  const visit = (node) => {
    if (found || !isObject(node)) return;
    if (hasIdentity(node, expected)) {
      found = node;
      return;
    }
    for (const child of asArray(node.children)) visit(child);
  };
  visit(root);
  return found;
}

function isDashboardPageLayoutsV11(resource) {
  if (hasIdentity(resource, DASHBOARD_LAYOUT_TEMPLATE_ID)) return true;
  const main = findFirstByIdentity(resource, "Main");
  const content = asArray(main?.children).find((child) => hasIdentity(child, "Content"));
  return asArray(content?.children).some((child) => hasAnyIdentity(child, V11_ROOT_CONTENT_CHILD_IDS));
}

function validateNoCompetingGoldenShellAtV11Root(page, findings) {
  const main = findFirstByIdentity(page.resource, "Main");
  const content = asArray(main?.children).find((child) => hasIdentity(child, "Content"));
  for (const child of asArray(content?.children)) {
    if (!isObject(child)) continue;
    if (hasIdentity(child, "Main") || hasIdentity(child, DEFAULT_REFERENCE_ID)) {
      findings.push(error("DASH_GOLDEN_COMPETING_ROOT_SHELL", "Dashboard Page Layouts v1.1 is the page shell; Event Portfolio Golden Reference must be consumed as component regions inside v1.1 sections, not copied as a competing root shell.", { page: page.title, control: firstIdentity(child) || null }));
      continue;
    }
    const hasGoldenComponentIdentity = identityCandidates(child).some((candidate) => /^event_portfolio_|^kpi_cards_wrapper$|^Event Pipeline Grid-Table$/.test(candidate));
    if (hasGoldenComponentIdentity && !hasAnyIdentity(child, V11_ROOT_CONTENT_CHILD_IDS)) {
      findings.push(error("DASH_GOLDEN_COMPETING_ROOT_SHELL", "Event Portfolio component regions at the v1.1 Content root must be wrapped by a registered v1.1 section/module identity.", { page: page.title, control: firstIdentity(child) || null }));
    }
  }
}

function hasAnyIdentity(control, ids) {
  return [...ids].some((id) => hasIdentity(control, id));
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
    control?.derivedFromGoldenReference,
    control?.goldenReferenceId,
    control?.referenceId,
    control?.attrs?.id,
    control?.attrs?.name,
    control?.attrs?.nv_label,
    control?.attrs?.nav_label,
    control?.attrs?.derivedFromDashboardPageLayoutTemplate,
    control?.attrs?.derivedFromGoldenReference,
    control?.attrs?.goldenReferenceId,
  ].filter(present).map(String);
}

function firstIdentity(control) {
  return identityCandidates(control)[0] || "";
}

function collectSectionReferences(root) {
  const refs = new Set();
  const sections = asArray(root?.sections).concat(asArray(root?.controls), asArray(root?.children));
  const visit = (node) => {
    if (!isObject(node)) return;
    for (const value of [node.derivedFromGoldenReference, node.goldenReferenceId, node.referenceId, node.id, node.name]) {
      if (present(value)) refs.add(String(value));
    }
    for (const key of ["sections", "children", "controls"]) asArray(node[key]).forEach(visit);
  };
  sections.forEach(visit);
  return refs;
}

function requiredRegionIds(reference, options = {}) {
  const ids = new Set(["event_portfolio_header_band", "event_portfolio_pipeline_section"]);
  for (const region of asArray(reference?.subRegions)) {
    if (options.includeOptional || /always|required|planned/i.test(String(region.requiredWhen || ""))) ids.add(region.id);
  }
  return [...ids].filter(Boolean);
}

function requiredRegionsFromPlan(source, reference) {
  const ids = ["event_portfolio_header_band", "event_portfolio_pipeline_section"];
  if (planned(source, "filters")) ids.push("event_portfolio_filter_group");
  if (planned(source, "kpis")) ids.push("kpi_cards_wrapper", "event_portfolio_kpi_row");
  if (planned(source, "gridTable")) ids.push("Event Pipeline Grid-Table");
  if (planned(source, "secondaryGridTable")) ids.push("event_portfolio_campaign_readiness_section", "campaign_readiness_grid_table_container");
  return [...new Set(ids.filter((id) => !reference || buildReferenceIndex(reference).byKey.has(id)))];
}

function planned(source, key) {
  const plan = source?.plannedRegions || source?.goldenReferenceSelection?.plannedRegions || source?.selection?.plannedRegions || {};
  if (Object.prototype.hasOwnProperty.call(plan, key)) return Boolean(plan[key]);
  const mappingKey = key === "kpis" ? "kpiMetricMapping" : key === "filters" ? "filterFieldMapping" : key === "gridTable" ? "gridTableFieldMapping" : null;
  return mappingKey ? !emptyMapping(source?.[mappingKey] || source?.goldenReferenceSelection?.[mappingKey]) : false;
}

function mappingRequired(selection, key) {
  if (key === "kpiMetricMapping") return planned(selection, "kpis");
  if (key === "filterFieldMapping") return planned(selection, "filters");
  if (key === "gridTableFieldMapping") return planned(selection, "gridTable");
  if (key === "actionMapping") return planned(selection, "actions") || !emptyMapping(selection.actionMapping);
  return true;
}

function emptyMapping(value) {
  if (Array.isArray(value)) return value.length === 0;
  if (isObject(value)) return Object.keys(value).length === 0;
  return !present(value);
}

function rejectCopiedMarketingTerms(value, findings, code, extra = {}) {
  const terms = new Set(["Event", "Stage", "Region", "Registration", "Budget"]);
  const hits = new Set();
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!isObject(node)) return;
    for (const [key, raw] of Object.entries(node)) {
      if (["sourceField", "field", "fieldName", "displayLabel", "label", "title", "name", "FieldName", "Field", "text"].includes(key) && typeof raw === "string" && terms.has(raw.trim())) hits.add(raw.trim());
      visit(raw);
    }
  };
  visit(value);
  for (const term of hits) findings.push(error(code, "Generated dashboard must not copy Marketing Event field names into unrelated apps.", { ...extra, copiedTerm: term }));
}

function regionMissingCode(id, layer) {
  if (id === "kpi_cards_wrapper") return `DASH_GOLDEN_${layer}_KPI_WRAPPER_MISSING`;
  if (id === "event_portfolio_filter_group") return `DASH_GOLDEN_${layer}_FILTER_GROUP_MISSING`;
  if (id === "Event Pipeline Grid-Table") return `DASH_GOLDEN_${layer}_GRID_TABLE_MISSING`;
  if (id === "event_portfolio_header_band") return `DASH_GOLDEN_${layer}_HEADER_BAND_MISSING`;
  return `DASH_GOLDEN_${layer}_SECTION_MISSING`;
}

function hasRef(control, refId) {
  return hasIdentity(control, refId);
}

function hasCollectionInsideRegion(index, regionId) {
  const region = index.byKey.get(regionId)?.control;
  let found = false;
  const visit = (node) => {
    if (found || !isObject(node)) return;
    if (node.type === "collection") {
      found = true;
      return;
    }
    for (const child of asArray(node.children)) visit(child);
  };
  visit(region);
  return found;
}

function isFullWidth(control) {
  return String(control?.width || "").toLowerCase() === "full" && isFullWidthType(control?.attrs?.style?.widthtype);
}

function isGeneratedFullWidth(control) {
  return String(control?.width || "").toLowerCase() === "full" || isFullWidthType(control?.attrs?.style?.widthtype);
}

function isFullWidthType(value) {
  return Array.isArray(value) && value[0] === null && (String(value[1]) === "1" || String(value[1]) === "2");
}

function usesDashboardV11Shell(resource) {
  return identityCandidates(resource).some((candidate) => String(candidate) === DASHBOARD_LAYOUT_TEMPLATE_ID);
}

function getPadding(control) {
  return control?.attrs?.container?.padding ?? control?.attrs?.style?.padding ?? control?.attrs?.common?.padding ?? control?.attrs?.padding ?? control?.padding;
}

function hasZeroPadding(control) {
  const padding = getPadding(control);
  if (padding === undefined || padding === null) return false;
  return isZeroPaddingValue(padding);
}

function hasNonzeroPadding(control) {
  const padding = getPadding(control);
  if (padding === undefined || padding === null) return false;
  return !isZeroPaddingValue(padding);
}

function isZeroPaddingValue(value) {
  if (Array.isArray(value)) return value.every((item) => item === null || isZeroPaddingValue(item));
  if (typeof value === "number") return value === 0;
  if (typeof value === "string") return value === "0" || value === "--sp--s0";
  if (isObject(value)) return ["top", "right", "bottom", "left"].every((key) => isZeroPaddingValue(value[key] ?? 0));
  return false;
}

function filterLabel(control) {
  return control?.attrs?.lab?.value || control?.label || control?.displayLabel || control?.attrs?.label || "";
}

function filterPlaceholder(control) {
  return control?.attrs?.placeholder || control?.placeholder || control?.attrs?.edit?.placeholder?.value || control?.attrs?.edit?.placeholder?.text || "";
}

function filterReferenceTokens(control) {
  return [control?.binding, control?.attrs?.save_var, control?.attrs?.data?.field, control?.attrs?.display_f, control?.attrs?.value_f].filter(present).map(String);
}

function normalizeObservedValues(value) {
  if (!present(value)) return [];
  return Array.isArray(value) ? value.map((item) => JSON.stringify(item)) : [JSON.stringify(value)];
}

function normalizeText(value) {
  return String(value).trim().toLowerCase();
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
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") args.help = true;
    else if (token === "--selection") args.selection = argv[++i];
    else if (token === "--blueprint") args.blueprint = argv[++i];
    else if (token === "--package") args.package = argv[++i];
    else if (token === "--registry") args.registry = argv[++i];
    else if (token === "--runtime-filter-proof") args.runtimeFilterProof = argv[++i];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/validate-dashboard-golden-reference-conformance.mjs --registry <dashboard-golden-references.json>
  node scripts/validate-dashboard-golden-reference-conformance.mjs --selection <dashboard-golden-reference-selection.json>
  node scripts/validate-dashboard-golden-reference-conformance.mjs --blueprint <dashboard-blueprint.json>
  node scripts/validate-dashboard-golden-reference-conformance.mjs --package <generated-final.yapk>
  node scripts/validate-dashboard-golden-reference-conformance.mjs --runtime-filter-proof <runtime-filter-proof.json>`);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}

#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { asArray, isObject, parseJsonMaybe, readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = path.join(ROOT, "docs/reference/dashboard-dataset-presentation-golden-references.json");
const RESPONSIVE_CARD_GRID_TEMPLATE_PATH = path.join(ROOT, "docs/reference/collection-control-responsive-card-grid.template.json");
const CARD_MULTISELECT_TEMPLATE_PATH = path.join(ROOT, "docs/reference/collection-control-card-with-multiselect-toolbar.template.json");
const GRID_TABLE_TEMPLATE_PATH = path.join(ROOT, "docs/reference/collection-control-grid-table.template.json");
const GRID_MULTISELECT_TEMPLATE_PATH = path.join(ROOT, "docs/reference/collection-control-grid-table-with-multiselect.template.json");

const APPROVED_IDS = new Set([
  "collection_control_responsive_card_grid",
  "collection_control_card_with_multiselect_toolbar",
  "collection_control_grid_table",
  "collection_control_grid_table_with_multiselect",
  "collection_control_grid_table_with_search",
  "Event Pipeline Grid-Table",
]);

const INTERNAL_TEMPLATE_STRUCTURE_IDS = new Set([
  "collection_control_responsive_card_wrapper",
  "grid_table_col_wrapper",
  "grid_table_col_multiselect_wrapper",
  "card_with_multiselect_toolbar_wrapper",
  "card_col_title_wrapper",
  "grid_table_col_title_wrapper",
  "op_normal",
  "op_multipleselected",
  "card_col_item",
  "card_col_item_multi_select",
  "grid_col_item",
  "grid_table_col_item_select",
  "grid_table_col_item_operations",
]);

const GRID_TABLE_IDS = new Set([
  "collection_control_grid_table",
  "collection_control_grid_table_with_multiselect",
  "collection_control_grid_table_with_search",
  "Event Pipeline Grid-Table",
]);

const MULTISELECT_IDS = new Set([
  "collection_control_card_with_multiselect_toolbar",
  "collection_control_grid_table_with_multiselect",
]);

const COLLECTION_ALLOWED_SLOT_IDS = new Set([
  "section_content_area",
]);

const GRID_MULTISELECT_FULL_WIDTH_IDS = [
  "grid_table_col_multiselect_wrapper",
  "grid_table_col_caption",
  "grid_table_col_content",
];

const GRID_MULTISELECT_LOCKED_STYLE_IDS = [
  "grid_table_col_multiselect_wrapper",
  "grid_table_col_caption",
  "grid_table_col_content",
  "op_normal",
  "op_multipleselected",
  "selected_items_amount_wrapper",
  "multiple_operations_wrapper",
];

const GRID_MULTISELECT_TEMPLATE_RESIDUE = [
  "All tasks",
  "All tasks - Multiple select",
  "Search tasks",
  "Add Task",
  "Mark as completed",
  "Assignee",
  "Completion (%)",
  "Progress bar",
];

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.registry && !args.appPlan && !args.package)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateDashboardDatasetPresentationGoldenReferences(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateDashboardDatasetPresentationGoldenReferences(options = {}) {
  const findings = [];
  const registryPath = path.resolve(options.registry || REGISTRY_PATH);
  const registry = readJson(registryPath, findings, "DASH_DATASET_PRESENTATION_REGISTRY_MISSING");
  const registryInfo = validateRegistry(registry, findings, options);

  if (options.appPlan) validateAppPlan(path.resolve(options.appPlan), registryInfo, findings);
  if (options.package) validatePackage(path.resolve(options.package), registryInfo, findings);
  if (options.appPlan && options.package) validateAppPlanToPackageConformance(path.resolve(options.appPlan), path.resolve(options.package), registryInfo, findings);

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    registry: registryPath,
    appPlan: options.appPlan ? path.resolve(options.appPlan) : null,
    package: options.package ? path.resolve(options.package) : null,
    approvedTemplateIds: [...registryInfo.approvedIds],
    findings,
  };
}

function validateRegistry(registry, findings, options = {}) {
  if (!registry) return { approvedIds: APPROVED_IDS, references: new Map() };
  const ids = new Set(asArray(registry.references).map((item) => String(item?.templateId || item?.referenceId || "")).filter(Boolean));
  const references = new Map();
  for (const requiredId of APPROVED_IDS) {
    if (!ids.has(requiredId)) {
      findings.push(error("DASH_DATASET_PRESENTATION_REFERENCE_MISSING", "Dashboard dataset presentation registry is missing a required approved reference.", { referenceId: requiredId }));
    }
  }
  for (const entry of asArray(registry.references)) {
    const id = String(entry?.templateId || entry?.referenceId || "");
    if (!id) {
      findings.push(error("DASH_DATASET_PRESENTATION_REFERENCE_ID_MISSING", "Each Dashboard dataset presentation reference must include templateId.", { entry }));
      continue;
    }
    references.set(id, entry);
    for (const key of ["displayName", "suitableSourceResourceTypes", "whenToUse", "whenNotToUse", "requiredBusinessSignals", "requiredAppPlanDeclaration", "generationProof", "proofBoundary"]) {
      if (entry[key] === undefined || (Array.isArray(entry[key]) && entry[key].length === 0) || String(entry[key] || "").trim() === "") {
        findings.push(error("DASH_DATASET_PRESENTATION_REFERENCE_INCOMPLETE", "Dashboard dataset presentation reference is missing required guidance.", { referenceId: id, missing: key }));
      }
    }
  }
  validateResponsiveCardGridTemplateArtifact(registry, findings, options);
  validateCardMultiselectTemplateArtifact(registry, findings, options);
  validateGridTableTemplateArtifact(registry, findings, options);
  validateGridMultiselectTemplateArtifact(registry, findings, options);
  return { approvedIds: ids.size ? ids : APPROVED_IDS, references };
}

function validateResponsiveCardGridTemplateArtifact(registry, findings, options = {}) {
  const entry = asArray(registry?.references).find((item) => String(item?.templateId || "") === "collection_control_responsive_card_grid");
  const referencePath = String(entry?.fullTemplateReference || "").trim();
  if (referencePath !== "docs/reference/collection-control-responsive-card-grid.template.json") {
    findings.push(error("DASH_DATASET_RESPONSIVE_CARD_TEMPLATE_REFERENCE_MISSING", "collection_control_responsive_card_grid must point to the full export-shaped template artifact.", {
      expected: "docs/reference/collection-control-responsive-card-grid.template.json",
      actual: referencePath || null,
    }));
    return;
  }
  const templatePath = path.resolve(options.responsiveCardTemplate || RESPONSIVE_CARD_GRID_TEMPLATE_PATH);
  const template = readJson(templatePath, findings, "DASH_DATASET_RESPONSIVE_CARD_TEMPLATE_FILE_MISSING");
  if (!template) return;
  if (template.templateId !== "collection_control_responsive_card_grid") {
    findings.push(error("DASH_DATASET_RESPONSIVE_CARD_TEMPLATE_ID_INVALID", "Responsive card grid template artifact has an unexpected templateId.", { actual: template.templateId }));
  }
  if (template.templateResource?.rootContainer?.nv_label !== "collection_control_responsive_card_wrapper") {
    findings.push(error("DASH_DATASET_RESPONSIVE_CARD_TEMPLATE_ROOT_INVALID", "Responsive card grid template artifact must use collection_control_responsive_card_wrapper as the root container.", {
      actual: template.templateResource?.rootContainer?.nv_label || null,
    }));
  }
  for (const label of ["collection_control_responsive_card_wrapper", "card_col_title_wrapper", "op_normal", "card_col_body", "card_col_item", "card_col_item_multi_select", "grid_table_col_item_op_menu"]) {
    if (!template.extractionIndex?.slotPointers?.[label]) {
      findings.push(error("DASH_DATASET_RESPONSIVE_CARD_TEMPLATE_SLOT_MISSING", "Responsive card grid template artifact is missing a required slot pointer.", { slot: label }));
    }
  }
  for (const key of ["filterVars", "tempVars", "filter", "formAction"]) {
    const value = template.pageLevelDependencies?.[key];
    const count = Array.isArray(value) ? value.length : isObject(value) ? Object.keys(value).length : 0;
    if (count < 1) {
      findings.push(error("DASH_DATASET_RESPONSIVE_CARD_TEMPLATE_DEPENDENCY_MISSING", "Responsive card grid template artifact is missing required page-level dependency data.", { dependency: key }));
    }
  }
  const collectionActions = asArray(template.templateResource?.collectionActions);
  if (!collectionActions.some((action) => /edit/i.test(String(action?.name || ""))) || !collectionActions.some((action) => /delete/i.test(String(action?.name || "")))) {
    findings.push(error("DASH_DATASET_RESPONSIVE_CARD_TEMPLATE_COLLECTION_ACTIONS_MISSING", "Responsive card grid template artifact must preserve source edit/delete Collection action contracts for optional item operation menus.", {
      actionNames: collectionActions.map((action) => action?.name).filter(Boolean),
    }));
  }
  const title = findDescendantByIdentity(template.templateResource?.rootContainer, "card_col_title");
  if (!isObject(title?.attrs?.heads) || title.attrs.heads.ty === undefined) {
    findings.push(error("DASH_DATASET_RESPONSIVE_CARD_TEMPLATE_TITLE_TYPOGRAPHY_MISSING", "Responsive card grid source title must preserve exported typography metadata.", {
      actual: title?.attrs?.heads ?? null,
    }));
  }
}

function validateCardMultiselectTemplateArtifact(registry, findings, options = {}) {
  const entry = asArray(registry?.references).find((item) => String(item?.templateId || "") === "collection_control_card_with_multiselect_toolbar");
  const referencePath = String(entry?.fullTemplateReference || "").trim();
  if (referencePath !== "docs/reference/collection-control-card-with-multiselect-toolbar.template.json") {
    findings.push(error("DASH_DATASET_CARD_MULTISELECT_TEMPLATE_REFERENCE_MISSING", "collection_control_card_with_multiselect_toolbar must point to the full export-shaped template artifact.", {
      expected: "docs/reference/collection-control-card-with-multiselect-toolbar.template.json",
      actual: referencePath || null,
    }));
    return;
  }
  const templatePath = path.resolve(options.cardTemplate || CARD_MULTISELECT_TEMPLATE_PATH);
  const template = readJson(templatePath, findings, "DASH_DATASET_CARD_MULTISELECT_TEMPLATE_FILE_MISSING");
  if (!template) return;
  if (template.templateId !== "collection_control_card_with_multiselect_toolbar") {
    findings.push(error("DASH_DATASET_CARD_MULTISELECT_TEMPLATE_ID_INVALID", "Card multiselect template artifact has an unexpected templateId.", { actual: template.templateId }));
  }
  if (template.templateResource?.rootContainer?.nv_label !== "card_with_multiselect_toolbar_wrapper") {
    findings.push(error("DASH_DATASET_CARD_MULTISELECT_TEMPLATE_ROOT_INVALID", "Card multiselect template artifact must use card_with_multiselect_toolbar_wrapper as the root container.", {
      actual: template.templateResource?.rootContainer?.nv_label || null,
    }));
  }
  for (const label of ["card_col_title_wrapper", "op_normal", "op_multipleselected", "card_col_item", "card_col_item_operations", "card_col_item_multi_select", "btn_set_items"]) {
    if (!template.extractionIndex?.slotPointers?.[label]) {
      findings.push(error("DASH_DATASET_CARD_MULTISELECT_TEMPLATE_SLOT_MISSING", "Card multiselect template artifact is missing a required slot pointer.", { slot: label }));
    }
  }
  for (const key of ["filterVars", "tempVars", "actions", "filter", "formAction"]) {
    const value = template.pageLevelDependencies?.[key];
    const count = Array.isArray(value) ? value.length : isObject(value) ? Object.keys(value).length : 0;
    if (count < 1) {
      findings.push(error("DASH_DATASET_CARD_MULTISELECT_TEMPLATE_DEPENDENCY_MISSING", "Card multiselect template artifact is missing required page-level dependency data.", { dependency: key }));
    }
  }
  validateTemplateTextControls(template, findings, {
    codePrefix: "DASH_DATASET_CARD_MULTISELECT_TEMPLATE",
    templateId: "collection_control_card_with_multiselect_toolbar",
  });
}

function validateGridTableTemplateArtifact(registry, findings, options = {}) {
  const entry = asArray(registry?.references).find((item) => String(item?.templateId || "") === "collection_control_grid_table");
  const referencePath = String(entry?.fullTemplateReference || "").trim();
  if (referencePath !== "docs/reference/collection-control-grid-table.template.json") {
    findings.push(error("DASH_DATASET_GRID_TABLE_TEMPLATE_REFERENCE_MISSING", "collection_control_grid_table must point to the full export-shaped template artifact.", {
      expected: "docs/reference/collection-control-grid-table.template.json",
      actual: referencePath || null,
    }));
    return;
  }
  const templatePath = path.resolve(options.gridTableTemplate || GRID_TABLE_TEMPLATE_PATH);
  const template = readJson(templatePath, findings, "DASH_DATASET_GRID_TABLE_TEMPLATE_FILE_MISSING");
  if (!template) return;
  if (template.templateId !== "collection_control_grid_table") {
    findings.push(error("DASH_DATASET_GRID_TABLE_TEMPLATE_ID_INVALID", "Grid-table template artifact has an unexpected templateId.", { actual: template.templateId }));
  }
  if (template.templateResource?.rootContainer?.nv_label !== "grid_table_col_wrapper") {
    findings.push(error("DASH_DATASET_GRID_TABLE_TEMPLATE_ROOT_INVALID", "Grid-table template artifact must use grid_table_col_wrapper as the root container.", {
      actual: template.templateResource?.rootContainer?.nv_label || null,
    }));
  }
  for (const label of ["grid_table_col_title_wrapper", "op_normal", "grid_table_col_header", "grid_table_col_body", "grid_col_item", "grid_table_col_item_operations", "grid_table_col_item_op_menu"]) {
    if (!template.extractionIndex?.slotPointers?.[label]) {
      findings.push(error("DASH_DATASET_GRID_TABLE_TEMPLATE_SLOT_MISSING", "Grid-table template artifact is missing a required slot pointer.", { slot: label }));
    }
  }
  for (const key of ["filterVars", "tempVars", "filter", "formAction"]) {
    const value = template.pageLevelDependencies?.[key];
    const count = Array.isArray(value) ? value.length : isObject(value) ? Object.keys(value).length : 0;
    if (count < 1) {
      findings.push(error("DASH_DATASET_GRID_TABLE_TEMPLATE_DEPENDENCY_MISSING", "Grid-table template artifact is missing required page-level dependency data.", { dependency: key }));
    }
  }
  const collectionActions = asArray(template.templateResource?.collectionActions);
  if (!collectionActions.some((action) => /edit/i.test(String(action?.name || ""))) || !collectionActions.some((action) => /delete/i.test(String(action?.name || "")))) {
    findings.push(error("DASH_DATASET_GRID_TABLE_TEMPLATE_COLLECTION_ACTIONS_MISSING", "Grid-table template artifact must preserve source edit/delete Collection action contracts for optional item operation menus.", {
      actionNames: collectionActions.map((action) => action?.name).filter(Boolean),
    }));
  }
  const headerColumns = asArray(template.templateResource?.headerColumns);
  const itemColumns = asArray(template.templateResource?.itemColumns);
  if (!headerColumns.length || headerColumns.length !== itemColumns.length || JSON.stringify(headerColumns) !== JSON.stringify(itemColumns)) {
    findings.push(error("DASH_DATASET_GRID_TABLE_TEMPLATE_COLUMN_PARITY_INVALID", "Grid-table template artifact must record matching header/item column definitions.", {
      headerColumnCount: headerColumns.length,
      itemColumnCount: itemColumns.length,
    }));
  }
  validateTemplateTextControls(template, findings, {
    codePrefix: "DASH_DATASET_GRID_TABLE_TEMPLATE",
    templateId: "collection_control_grid_table",
  });
}

function validateGridMultiselectTemplateArtifact(registry, findings, options = {}) {
  const entry = asArray(registry?.references).find((item) => String(item?.templateId || "") === "collection_control_grid_table_with_multiselect");
  const referencePath = String(entry?.fullTemplateReference || "").trim();
  if (referencePath !== "docs/reference/collection-control-grid-table-with-multiselect.template.json") {
    findings.push(error("DASH_DATASET_GRID_MULTISELECT_TEMPLATE_REFERENCE_MISSING", "collection_control_grid_table_with_multiselect must point to the full export-shaped template artifact.", {
      expected: "docs/reference/collection-control-grid-table-with-multiselect.template.json",
      actual: referencePath || null,
    }));
    return;
  }
  const templatePath = path.resolve(options.gridTemplate || GRID_MULTISELECT_TEMPLATE_PATH);
  const template = readJson(templatePath, findings, "DASH_DATASET_GRID_MULTISELECT_TEMPLATE_FILE_MISSING");
  if (!template) return;
  if (template.templateId !== "collection_control_grid_table_with_multiselect") {
    findings.push(error("DASH_DATASET_GRID_MULTISELECT_TEMPLATE_ID_INVALID", "Grid-table multiselect template artifact has an unexpected templateId.", { actual: template.templateId }));
  }
  if (template.templateResource?.rootContainer?.nv_label !== "grid_table_col_multiselect_wrapper") {
    findings.push(error("DASH_DATASET_GRID_MULTISELECT_TEMPLATE_ROOT_INVALID", "Grid-table multiselect template artifact must use grid_table_col_multiselect_wrapper as the root container.", {
      actual: template.templateResource?.rootContainer?.nv_label || null,
    }));
  }
  for (const label of ["grid_table_col_title_wrapper", "op_normal", "op_multipleselected", "grid_table_col_header", "grid_col_item", "grid_table_col_item_select", "btn_set_items"]) {
    if (!template.extractionIndex?.slotPointers?.[label]) {
      findings.push(error("DASH_DATASET_GRID_MULTISELECT_TEMPLATE_SLOT_MISSING", "Grid-table multiselect template artifact is missing a required slot pointer.", { slot: label }));
    }
  }
  for (const key of ["filterVars", "tempVars", "actions", "filter", "formAction"]) {
    const value = template.pageLevelDependencies?.[key];
    const count = Array.isArray(value) ? value.length : isObject(value) ? Object.keys(value).length : 0;
    if (count < 1) {
      findings.push(error("DASH_DATASET_GRID_MULTISELECT_TEMPLATE_DEPENDENCY_MISSING", "Grid-table multiselect template artifact is missing required page-level dependency data.", { dependency: key }));
    }
  }
  const headerColumns = asArray(template.templateResource?.headerColumns);
  const itemColumns = asArray(template.templateResource?.itemColumns);
  if (!headerColumns.length || headerColumns.length !== itemColumns.length) {
    findings.push(error("DASH_DATASET_GRID_MULTISELECT_TEMPLATE_COLUMN_COUNT_INVALID", "Grid-table multiselect template artifact must record matching header/item column counts.", {
      headerColumnCount: headerColumns.length,
      itemColumnCount: itemColumns.length,
    }));
  }
  const root = template.templateResource?.rootContainer;
  if (root?.attrs?.container?.gap !== 0) {
    findings.push(error("DASH_DATASET_GRID_MULTISELECT_TEMPLATE_WRAPPER_CONTAINER_GAP_MISSING", "Grid-table multiselect template root must preserve attrs.container.gap = 0 for generated grid-table wrapper parity.", {
      templateId: "collection_control_grid_table_with_multiselect",
      actual: root?.attrs?.container?.gap ?? null,
    }));
  }
  if (!Array.isArray(root?.attrs?.style?.gap) || root.attrs.style.gap[0] !== null || root.attrs.style.gap[1] !== 0) {
    findings.push(error("DASH_DATASET_GRID_MULTISELECT_TEMPLATE_WRAPPER_STYLE_GAP_MISSING", "Grid-table multiselect template root must preserve attrs.style.gap = [null, 0] for generated grid-table wrapper parity.", {
      templateId: "collection_control_grid_table_with_multiselect",
      actual: root?.attrs?.style?.gap ?? null,
    }));
  }
  const collection = findDescendantByIdentity(root, "grid_table_col_body");
  const data = collection?.attrs?.data || {};
  if (String(data.link || "") !== "{{DetailLayoutID}}") {
    findings.push(error("DASH_DATASET_GRID_MULTISELECT_TEMPLATE_DETAIL_LINK_PLACEHOLDER_INVALID", "Grid-table multiselect template must use {{DetailLayoutID}} as a required replacement contract, not default or an empty row-detail link.", {
      templateId: "collection_control_grid_table_with_multiselect",
      actual: data.link ?? null,
    }));
  }
  if (data.opentype !== "slide") {
    findings.push(error("DASH_DATASET_GRID_MULTISELECT_TEMPLATE_DETAIL_OPENTYPE_MISSING", "Grid-table multiselect template must preserve attrs.data.opentype = \"slide\" so generated row detail opens in a slide panel.", {
      templateId: "collection_control_grid_table_with_multiselect",
      actual: data.opentype ?? null,
    }));
  }
  validateTemplateTextControls(template, findings, {
    codePrefix: "DASH_DATASET_GRID_MULTISELECT_TEMPLATE",
    templateId: "collection_control_grid_table_with_multiselect",
  });
}

function validateTemplateTextControls(template, findings, { codePrefix, templateId }) {
  const root = template?.templateResource?.rootContainer;
  const textControls = findDescendants(root, (node) => String(node?.type || "") === "heading" && String(node?.label || "") === "Text");
  if (!textControls.length) {
    findings.push(error(`${codePrefix}_TEXT_CONTROLS_MISSING`, "Collection template artifact must include export-shaped Text controls with typography metadata.", { templateId }));
    return;
  }
  for (const control of textControls) {
    const identity = identityCandidates(control)[0] || control.id || null;
    const heads = control?.attrs?.heads;
    if (!isObject(heads)) {
      findings.push(error(`${codePrefix}_TEXT_HEADS_MISSING`, "Collection template Text controls must preserve attrs.heads metadata from the export-shaped reference.", { templateId, control: identity }));
      continue;
    }
    if (heads.ty === undefined) {
      findings.push(error(`${codePrefix}_TEXT_TYPOGRAPHY_MISSING`, "Collection template Text controls must preserve attrs.heads.ty typography metadata.", { templateId, control: identity }));
    }
    if (typeof heads.color !== "string" || !heads.color.trim()) {
      findings.push(error(`${codePrefix}_TEXT_COLOR_MISSING`, "Collection template Text controls must preserve attrs.heads.color as a plain string for designer/runtime fidelity.", { templateId, control: identity, actual: heads.color ?? null }));
    }
  }
}

function validateAppPlan(appPlanPath, registryInfo, findings) {
  if (!fs.existsSync(appPlanPath)) {
    findings.push(error("DASH_DATASET_APP_PLAN_MISSING", "App Plan file is missing.", { appPlan: appPlanPath }));
    return;
  }
  const text = fs.readFileSync(appPlanPath, "utf8");
  const dashboardDatasetLines = collectDashboardDatasetPlanLines(text);
  if (!dashboardDatasetLines.length) return;

  const approvedIds = registryInfo.approvedIds;
  const invented = [...dashboardDatasetLines.join("\n").matchAll(/\b(collection_control_[A-Za-z0-9_-]+|Event\s+Pipeline\s+Grid-Table)\b/g)]
    .map((match) => match[1])
    .filter((id) => !approvedIds.has(id) && !INTERNAL_TEMPLATE_STRUCTURE_IDS.has(id));
  for (const id of invented) {
    findings.push(error("DASH_DATASET_APP_PLAN_REFERENCE_UNKNOWN", "App Plan selected an unknown Dashboard dataset presentation reference.", { referenceId: id }));
  }

  for (const line of dashboardDatasetLines) {
    if (isMarkdownTableHeaderOrSeparator(line)) continue;
    if (/not applicable|n\/a|deferred|no dashboard dataset/i.test(line)) continue;
    const selected = extractApprovedTemplateIds(line, approvedIds);
    if (!selected.length) {
      findings.push(error("DASH_DATASET_APP_PLAN_REFERENCE_MISSING", "Dashboard Collection dataset regions in App Plan must select one approved dataset presentation reference.", { line: line.trim().slice(0, 500), approvedTemplateIds: [...approvedIds] }));
      continue;
    }
    if (selected.length > 1) {
      findings.push(error("DASH_DATASET_APP_PLAN_REFERENCE_NOT_EXACTLY_ONE", "Each Dashboard Collection dataset region in App Plan must select exactly one approved dataset presentation reference.", { line: line.trim().slice(0, 500), selectedTemplateIds: selected }));
      continue;
    }
    const reference = registryInfo.references.get(selected[0]);
    if (!lineMatchesReferenceGuidance(line, selected[0], reference)) {
      findings.push(error("DASH_DATASET_APP_PLAN_SELECTION_RATIONALE_MISMATCH", "Selected Dashboard Collection presentation reference must be justified by the registry's whenToUse / requiredBusinessSignals guidance.", {
        line: line.trim().slice(0, 500),
        selectedTemplateId: selected[0],
        requiredBusinessSignals: asArray(reference?.requiredBusinessSignals),
        whenToUse: asArray(reference?.whenToUse),
      }));
    }
  }
}

function collectDashboardDatasetPlanRecords(text, approvedIds) {
  const dashboard = extractDashboardPagesPlanSection(text);
  if (!dashboard.trim()) return [];

  const records = [];
  for (const table of markdownTablesWithHeadings(dashboard)) {
    const headers = table.headers.map(normalizeTableCell);
    const selectedReferenceIndex = headers.findIndex((header) => header === "selected collection presentation reference");
    const genericControlIndex = headers.findIndex((header) => header === "control" || header === "selected control");
    const selectedControlIndex = headers.findIndex((header) => header === "selected record display control");
    const dashboardPageIndex = headers.findIndex((header) => header === "dashboard page" || header === "dashboard page name");
    const datasetRegionIndex = headers.findIndex((header) => header === "dataset region" || header === "section");
    const sourceIndex = headers.findIndex((header) => header === "source resource" || header === "data source");

    const canonicalDatasetReferenceTable =
      datasetRegionIndex !== -1
      && sourceIndex !== -1
      && (dashboardPageIndex !== -1 || selectedControlIndex !== -1 || genericControlIndex !== -1);

    if (!canonicalDatasetReferenceTable) continue;

    for (const row of table.rows) {
      if (isMarkdownTableHeaderOrSeparator(row.raw)) continue;
      if (/not applicable|n\/a|deferred|no dashboard dataset/i.test(row.raw)) continue;
      const selectedControl = row.cells[selectedControlIndex] || row.cells[genericControlIndex] || "";
      if ((selectedControlIndex !== -1 || genericControlIndex !== -1) && !/\bcollection\b/i.test(selectedControl)) continue;
      if (selectedReferenceIndex === -1 && !/\bcollection\b/i.test(selectedControl)) continue;
      const selected = extractApprovedTemplateIds(row.raw, approvedIds);
      if (selected.length !== 1) continue;
      records.push({
        dashboardPage: row.cells[dashboardPageIndex] || table.dashboardPage || "",
        datasetRegion: row.cells[datasetRegionIndex] || "",
        sourceResource: row.cells[sourceIndex] || "",
        selectedTemplateId: selected[0],
        raw: row.raw,
      });
    }
  }
  return records;
}

function validateAppPlanToPackageConformance(appPlanPath, packagePath, registryInfo, findings) {
  if (!fs.existsSync(appPlanPath) || !fs.existsSync(packagePath)) return;
  const appPlanText = fs.readFileSync(appPlanPath, "utf8");
  const plannedRecords = collectDashboardDatasetPlanRecords(appPlanText, registryInfo.approvedIds);
  if (!plannedRecords.length) return;

  let decoded;
  try {
    ({ decoded } = readDecodedYapk(packagePath));
  } catch {
    return;
  }

  const generatedRecords = collectDashboardCollectionRecords(decoded, registryInfo.approvedIds);
  const plannedTemplates = new Set(plannedRecords.map((record) => record.selectedTemplateId));
  const generatedTemplates = new Set(generatedRecords.map((record) => record.templateId).filter(Boolean));

  for (const plannedTemplateId of plannedTemplates) {
    if (!generatedRecords.some((record) => record.templateId === plannedTemplateId)) {
      findings.push(error("DASH_DATASET_APP_PLAN_TEMPLATE_NOT_MATERIALIZED", "App Plan selected a Dashboard Collection presentation template that was not materialized in any generated Dashboard Collection.", {
        selectedTemplateId: plannedTemplateId,
        plannedRegions: plannedRecords.filter((record) => record.selectedTemplateId === plannedTemplateId).map(planRecordSummary),
        generatedTemplateIds: [...generatedTemplates],
      }));
    }
  }

  if (plannedTemplates.size > 1 && generatedTemplates.size === 1) {
    findings.push(error("DASH_DATASET_TEMPLATE_DIVERSITY_COLLAPSED", "App Plan selected multiple Dashboard Collection presentation templates but the generated package materialized only one effective template.", {
      plannedTemplateIds: [...plannedTemplates],
      generatedTemplateIds: [...generatedTemplates],
    }));
  }

  for (const planned of plannedRecords) {
    const pageRecords = generatedRecords.filter((record) => dashboardPageMatches(planned.dashboardPage, record.pageTitle));
    const regionRecords = pageRecords.filter((record) => datasetRegionMatches(planned.datasetRegion, record));
    if (!regionRecords.length) {
      findings.push(error("DASH_DATASET_COLLECTION_REGION_MISSING", "App Plan Dashboard Collection region has no matching generated Collection region in the package.", {
        ...planRecordSummary(planned),
        generatedRegionsOnPage: pageRecords.map((record) => ({ region: record.regionIdentity, templateId: record.templateId, path: record.path })),
      }));
      continue;
    }

    const explicitMatches = regionRecords.filter((record) => record.explicitTemplateId);
    if (!explicitMatches.length) {
      findings.push(error("DASH_DATASET_COLLECTION_EXPLICIT_PROVENANCE_MISSING", "Generated Dashboard Collection region matched the App Plan region but lacks explicit Collection-root dataset presentation provenance.", {
        ...planRecordSummary(planned),
        generatedRegions: regionRecords.map((record) => ({ templateId: record.templateId, path: record.path })),
      }));
    }

    if (!regionRecords.some((record) => record.templateId === planned.selectedTemplateId)) {
      findings.push(error("DASH_DATASET_REGION_TEMPLATE_MISMATCH", "Generated Dashboard Collection region uses a different effective template than the App Plan selected for that region.", {
        ...planRecordSummary(planned),
        generatedTemplates: regionRecords.map((record) => ({ templateId: record.templateId, explicitTemplateId: record.explicitTemplateId, path: record.path })),
      }));
    }
  }
}

function collectDashboardDatasetPlanLines(text) {
  const dashboard = extractDashboardPagesPlanSection(text);
  if (!dashboard.trim()) return [];

  const rows = [];
  for (const table of markdownTables(dashboard)) {
    const headers = table.headers.map(normalizeTableCell);
    const selectedReferenceIndex = headers.findIndex((header) => header === "selected collection presentation reference");
    const genericControlIndex = headers.findIndex((header) => header === "control" || header === "selected control");
    const selectedControlIndex = headers.findIndex((header) => header === "selected record display control");
    const dashboardPageIndex = headers.findIndex((header) => header === "dashboard page" || header === "dashboard page name");
    const datasetRegionIndex = headers.findIndex((header) => header === "dataset region" || header === "section");
    const sourceIndex = headers.findIndex((header) => header === "source resource" || header === "data source");

    const canonicalDatasetReferenceTable =
      datasetRegionIndex !== -1
      && sourceIndex !== -1
      && (dashboardPageIndex !== -1 || selectedControlIndex !== -1 || genericControlIndex !== -1);

    if (!canonicalDatasetReferenceTable) continue;

    for (const row of table.rows) {
      const selectedControl = row.cells[selectedControlIndex] || row.cells[genericControlIndex] || "";
      if ((selectedControlIndex !== -1 || genericControlIndex !== -1) && !/\bcollection\b/i.test(selectedControl)) continue;
      if (selectedReferenceIndex === -1 && !/\bcollection\b/i.test(selectedControl)) continue;
      rows.push(row.raw);
    }
  }
  return rows;
}

function extractDashboardPagesPlanSection(text) {
  const lines = String(text || "").split(/\r?\n/);
  const start = lines.findIndex((line) => /^#{1,6}\s+(?:\d+\.\s*)?Dashboard Pages Plan\s*$/i.test(line.trim()));
  if (start === -1) return "";
  let end = lines.length;
  const startLevel = (lines[start].match(/^#+/) || [""])[0].length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#{1,6})\s+(.+?)\s*$/);
    if (match && match[1].length <= startLevel) {
      end = index;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n");
}

function markdownTables(sectionText) {
  const tables = [];
  const lines = String(sectionText || "").split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const header = lines[index].trim();
    const separator = String(lines[index + 1] || "").trim();
    if (!isMarkdownTableRow(header) || !/^\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(separator)) continue;
    const headers = splitMarkdownRow(header);
    const rows = [];
    index += 2;
    while (index < lines.length && isMarkdownTableRow(lines[index].trim())) {
      const raw = lines[index];
      rows.push({ raw, cells: splitMarkdownRow(raw) });
      index += 1;
    }
    index -= 1;
    tables.push({ headers, rows });
  }
  return tables;
}

function markdownTablesWithHeadings(sectionText) {
  const tables = [];
  const lines = String(sectionText || "").split(/\r?\n/);
  let currentDashboardPage = "";
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^###\s+(?:\d+(?:\.\d+)?\s+)?(.+?)\s*$/);
    if (heading) currentDashboardPage = heading[1].trim();
    const header = lines[index].trim();
    const separator = String(lines[index + 1] || "").trim();
    if (!isMarkdownTableRow(header) || !/^\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(separator)) continue;
    const headers = splitMarkdownRow(header);
    const rows = [];
    index += 2;
    while (index < lines.length && isMarkdownTableRow(lines[index].trim())) {
      const raw = lines[index];
      rows.push({ raw, cells: splitMarkdownRow(raw) });
      index += 1;
    }
    index -= 1;
    tables.push({ headers, rows, dashboardPage: currentDashboardPage });
  }
  return tables;
}

function isMarkdownTableRow(line) {
  return String(line || "").trim().startsWith("|") && String(line || "").trim().endsWith("|");
}

function splitMarkdownRow(row) {
  return String(row || "")
    .trim()
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function normalizeTableCell(value) {
  return String(value || "").toLowerCase().replace(/`/g, "").replace(/\s+/g, " ").trim();
}

function extractApprovedTemplateIds(line, approvedIds) {
  return [...approvedIds].filter((id) => containsExactTemplateId(line, id));
}

function containsExactTemplateId(line, templateId) {
  const text = String(line || "");
  if (!text || !templateId) return false;
  const escaped = escapeRegExp(templateId);
  return new RegExp(`(^|[^A-Za-z0-9_-])${escaped}($|[^A-Za-z0-9_-])`).test(text);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lineMatchesReferenceGuidance(line, templateId, reference) {
  let normalized = normalizeForMatch(line);
  normalized = normalized.replaceAll(normalizeForMatch(templateId), " ");
  for (const approvedId of APPROVED_IDS) normalized = normalized.replaceAll(normalizeForMatch(approvedId), " ");
  normalized = normalized.replace(/\s+/g, " ").trim();
  const signals = [
    ...asArray(reference?.requiredBusinessSignals),
    ...asArray(reference?.whenToUse),
  ].map(normalizeForMatch).filter(Boolean);
  if (signals.some((signal) => signal && normalized.includes(signal))) return true;
  const fallbackSignals = {
    collection_control_responsive_card_grid: ["card", "browse", "overview", "portfolio", "asset"],
    collection_control_card_with_multiselect_toolbar: ["card", "multi-select", "multiselect", "bulk", "batch", "selected"],
    collection_control_grid_table: ["dense", "row", "column", "work queue", "task list", "record list", "operational table", "scan"],
    collection_control_grid_table_with_multiselect: ["multi-row", "multi row", "checkbox", "bulk", "batch", "selected count", "selection"],
    collection_control_grid_table_with_search: ["search", "fulltext", "quick find", "lookup"],
    "Event Pipeline Grid-Table": ["primary", "high-fidelity", "pipeline", "portfolio", "work queue", "health", "status", "progress"],
  };
  return asArray(fallbackSignals[templateId]).some((signal) => normalized.includes(normalizeForMatch(signal)));
}

function normalizeForMatch(value) {
  return String(value || "").toLowerCase().replace(/[_/]+/g, " ").replace(/\s+/g, " ").trim();
}

function isMarkdownTableHeaderOrSeparator(line) {
  const trimmed = String(line || "").trim();
  if (!trimmed.startsWith("|")) return false;
  if (/^\|(?:\s*:?-+:?\s*\|)+\s*$/.test(trimmed)) return true;
  return /selected collection presentation reference/i.test(trimmed)
    && /dashboard page|dataset region|source resource|business purpose/i.test(trimmed);
}

function validatePackage(packagePath, registryInfo, findings) {
  if (!fs.existsSync(packagePath)) {
    findings.push(error("DASH_DATASET_PACKAGE_MISSING", "Package file is missing.", { package: packagePath }));
    return;
  }
  let decoded;
  try {
    ({ decoded } = readDecodedYapk(packagePath));
  } catch (err) {
    findings.push(error("DASH_DATASET_PACKAGE_DECODE_FAILED", `Could not decode package Resource: ${err.message}`, { package: packagePath }));
    return;
  }

  const fieldCatalog = collectFieldCatalog(decoded);
  for (const page of collectDashboardPages(decoded)) {
    validateKpiTemplateMaterialization(page, findings);
    const collections = page.controls.filter((entry) => String(entry.control?.type || "") === "collection");
    for (const entry of collections) {
      validateCollectionEntry(entry, page, registryInfo.approvedIds, findings, { fieldCatalog });
    }
  }
}

function validateCollectionEntry(entry, page, approvedIds, findings, context = {}) {
  validateCollectionSlot(entry, page, findings);
  const provenance = resolveTemplateId(entry, page);
  if (!provenance.templateId) {
    findings.push(error("DASH_DATASET_COLLECTION_TEMPLATE_PROVENANCE_MISSING", "Every generated Dashboard Collection must carry or inherit approved dataset presentation template provenance.", { page: page.title, path: entry.pointer, approvedTemplateIds: [...approvedIds] }));
    return;
  }
  if (!approvedIds.has(provenance.templateId)) {
    findings.push(error("DASH_DATASET_COLLECTION_TEMPLATE_UNKNOWN", "Generated Dashboard Collection uses an unknown dataset presentation template.", { page: page.title, path: entry.pointer, templateId: provenance.templateId, approvedTemplateIds: [...approvedIds] }));
    return;
  }

  if (GRID_TABLE_IDS.has(provenance.templateId)) validateGridTable(entry, page, provenance.templateId, findings);
  if (provenance.templateId === "collection_control_grid_table_with_search") validateSearch(entry, page, findings);
  if (MULTISELECT_IDS.has(provenance.templateId)) validateMultiselect(entry, page, provenance.templateId, findings);
  if (provenance.templateId === "collection_control_responsive_card_grid" || provenance.templateId === "collection_control_card_with_multiselect_toolbar") validateCard(entry, page, findings);
  if (provenance.templateId === "collection_control_responsive_card_grid") validateResponsiveCardGrid(entry, page, findings, context);
  if (provenance.templateId === "collection_control_card_with_multiselect_toolbar") validateCardMultiselect(entry, page, findings);
  if (provenance.templateId === "collection_control_grid_table_with_multiselect") validateGridMultiselect(entry, page, findings);
  if (provenance.templateId === "Event Pipeline Grid-Table") validateEventPipeline(entry, page, findings);
}

function collectDashboardCollectionRecords(decoded, approvedIds) {
  const records = [];
  for (const page of collectDashboardPages(decoded)) {
    const collections = page.controls.filter((entry) => String(entry.control?.type || "") === "collection");
    for (const entry of collections) {
      const provenance = resolveTemplateId(entry, page);
      const explicitTemplateId = resolveExplicitCollectionTemplateId(entry, approvedIds);
      records.push({
        pageTitle: page.title,
        regionIdentity: resolveDatasetRegionIdentity(entry),
        path: entry.pointer,
        templateId: provenance.templateId,
        explicitTemplateId,
        identities: [
          ...identityCandidates(entry.control),
          ...entry.ancestors.flatMap(identityCandidates),
        ].map(normalizeIdentity).filter(Boolean),
      });
    }
  }
  return records;
}

function validateCollectionSlot(entry, page, findings) {
  const ancestorIdentities = new Set(entry.ancestors.flatMap(identityCandidates).map(normalizeIdentity));
  if ([...COLLECTION_ALLOWED_SLOT_IDS].some((id) => ancestorIdentities.has(normalizeIdentity(id)))) return;
  findings.push(error("DASH_DATASET_COLLECTION_OUTSIDE_V11_SLOT", "Dashboard Collection presentation templates are component-level references and must be placed inside an approved Dashboard Page Layouts v1.1 business-content slot such as section_content_area, not directly under page root, Main, Content, page title/header, or a copied source-app shell.", {
    page: page.title,
    path: entry.pointer,
    approvedSlotIds: [...COLLECTION_ALLOWED_SLOT_IDS],
  }));
}

function resolveTemplateId(entry, page) {
  const candidates = [];
  for (const node of [entry.control, ...entry.ancestors.slice().reverse(), page.resource]) {
    if (!isObject(node)) continue;
    candidates.push(
      node.datasetPresentationTemplateId,
      node.datasetPresentationReferenceId,
      node.derivedFromDatasetPresentationTemplate,
      node.derivedFromDatasetPresentationReference,
      node.selectedDatasetPresentationTemplateId,
      node.attrs?.datasetPresentationTemplateId,
      node.attrs?.datasetPresentationReferenceId,
      node.attrs?.derivedFromDatasetPresentationTemplate,
      node.attrs?.derivedFromDatasetPresentationReference,
      node.attrs?.templateId,
      node.attrs?.data?.datasetPresentationTemplateId,
      node.attrs?.data?.datasetPresentationReferenceId,
    );
    if (identityCandidates(node).includes("Event Pipeline Grid-Table")) candidates.push("Event Pipeline Grid-Table");
  }
  for (const candidate of candidates.map((item) => String(item || "").trim()).filter(Boolean)) {
    if (/^event pipeline grid-table$/i.test(candidate)) return { templateId: "Event Pipeline Grid-Table" };
    return { templateId: candidate };
  }
  return { templateId: "" };
}

function resolveExplicitCollectionTemplateId(entry, approvedIds) {
  if (!isObject(entry?.control)) return "";
  const candidates = [
    entry.control.datasetPresentationTemplateId,
    entry.control.datasetPresentationReferenceId,
    entry.control.derivedFromDatasetPresentationTemplate,
    entry.control.derivedFromDatasetPresentationReference,
    entry.control.selectedDatasetPresentationTemplateId,
    entry.control.attrs?.datasetPresentationTemplateId,
    entry.control.attrs?.datasetPresentationReferenceId,
    entry.control.attrs?.derivedFromDatasetPresentationTemplate,
    entry.control.attrs?.derivedFromDatasetPresentationReference,
    entry.control.attrs?.templateId,
    entry.control.attrs?.data?.datasetPresentationTemplateId,
    entry.control.attrs?.data?.datasetPresentationReferenceId,
  ].map((item) => String(item || "").trim()).filter(Boolean);
  for (const candidate of candidates) {
    if (/^event pipeline grid-table$/i.test(candidate)) return "Event Pipeline Grid-Table";
    if (approvedIds.has(candidate)) return candidate;
  }
  return "";
}

function resolveDatasetRegionIdentity(entry) {
  const candidates = [
    entry.control?.datasetRegion,
    entry.control?.datasetRegionName,
    entry.control?.appPlanDatasetRegion,
    entry.control?.attrs?.datasetRegion,
    entry.control?.attrs?.datasetRegionName,
    entry.control?.attrs?.appPlanDatasetRegion,
    entry.control?.attrs?.data?.datasetRegion,
    entry.control?.attrs?.data?.appPlanDatasetRegion,
    ...entry.ancestors.flatMap((node) => [
      node?.datasetRegion,
      node?.datasetRegionName,
      node?.appPlanDatasetRegion,
      node?.attrs?.datasetRegion,
      node?.attrs?.datasetRegionName,
      node?.attrs?.appPlanDatasetRegion,
      ...identityCandidates(node),
    ]),
    ...identityCandidates(entry.control),
  ];
  return candidates.map((item) => String(item || "").trim()).find(Boolean) || "";
}

function dashboardPageMatches(expected, actual) {
  const expectedNorm = normalizeIdentity(expected);
  const actualNorm = normalizeIdentity(actual);
  if (!expectedNorm || !actualNorm) return false;
  return expectedNorm === actualNorm || expectedNorm.includes(actualNorm) || actualNorm.includes(expectedNorm);
}

function datasetRegionMatches(expected, generatedRecord) {
  const expectedNorm = normalizeIdentity(expected);
  if (!expectedNorm) return false;
  const candidates = [
    generatedRecord.regionIdentity,
    ...generatedRecord.identities,
  ].map(normalizeIdentity).filter(Boolean);
  return candidates.some((candidate) => candidate === expectedNorm || candidate.includes(expectedNorm) || expectedNorm.includes(candidate));
}

function planRecordSummary(record) {
  return {
    dashboardPage: record.dashboardPage,
    datasetRegion: record.datasetRegion,
    sourceResource: record.sourceResource,
    selectedTemplateId: record.selectedTemplateId,
  };
}

function validateGridTable(entry, page, templateId, findings) {
  if (templateId === "collection_control_grid_table") {
    validateBaseGridTableFullTemplate(entry, page, findings);
  }
  const parent = entry.ancestors[entry.ancestors.length - 1] || null;
  const siblings = asArray(parent?.children);
  const siblingIndex = siblings.indexOf(entry.control);
  const header = siblings.slice(0, Math.max(0, siblingIndex)).reverse().find((node) => String(node?.type || "") === "flex_grid");
  const itemGrid = asArray(entry.control.children).find((node) => String(node?.type || "") === "flex_grid");
  if (!header) findings.push(error("DASH_DATASET_GRID_TABLE_HEADER_GRID_MISSING", "Selected grid-table Collection template requires a header flex_grid sibling before the Collection.", { page: page.title, path: entry.pointer, templateId }));
  if (!itemGrid) findings.push(error("DASH_DATASET_GRID_TABLE_ITEM_GRID_MISSING", "Selected grid-table Collection template requires repeated item flex_grid as a Collection child.", { page: page.title, path: `${entry.pointer}.children`, templateId }));
  if (header && itemGrid) {
    const headerColumns = gridColumnWidths(header, "1");
    const itemColumns = gridColumnWidths(itemGrid, "1");
    if (!headerColumns.length || !itemColumns.length || headerColumns.join("|") !== itemColumns.join("|")) {
      findings.push(error("DASH_DATASET_GRID_TABLE_COLUMN_MISMATCH", "Selected grid-table Collection template requires matching desktop header/item columns.", { page: page.title, path: entry.pointer, templateId, headerColumns, itemColumns }));
    }
  }
}

function validateBaseGridTableFullTemplate(entry, page, findings) {
  const wrapper = findNearestAncestorByIdentity(entry, "grid_table_col_wrapper");
  if (!wrapper) {
    findings.push(error("DASH_DATASET_GRID_TABLE_FULL_TEMPLATE_WRAPPER_MISSING", "collection_control_grid_table must be generated from the full grid_table_col_wrapper subtree, not a simplified header-plus-Collection approximation.", { page: page.title, path: entry.pointer }));
    return;
  }

  const requiredSlots = [
    "grid_table_col_title_wrapper",
    "op_normal",
    "grid_table_col_header",
    "grid_table_col_body",
    "grid_col_item",
  ];
  for (const slot of requiredSlots) {
    if (!findDescendantByIdentity(wrapper, slot)) {
      findings.push(error("DASH_DATASET_GRID_TABLE_FULL_TEMPLATE_SLOT_MISSING", "collection_control_grid_table is missing a required export-shaped slot.", { page: page.title, path: entry.pointer, slot }));
    }
  }

  const header = findDescendantByIdentity(wrapper, "grid_table_col_header");
  const itemGrid = findDescendantByIdentity(wrapper, "grid_col_item");
  const headerColumns = gridColumnWidths(header, "1");
  const itemColumns = gridColumnWidths(itemGrid, "1");
  if (!headerColumns.length || !itemColumns.length || headerColumns.join("|") !== itemColumns.join("|")) {
    findings.push(error("DASH_DATASET_GRID_TABLE_HEADER_ITEM_COLUMN_MISMATCH", "grid_table_col_header and grid_col_item must keep matching column count and widths after business field mapping.", {
      page: page.title,
      path: entry.pointer,
      headerColumns,
      itemColumns,
    }));
  }

  const operations = findDescendantByIdentity(wrapper, "grid_table_col_item_operations");
  const opMenu = findDescendantByIdentity(wrapper, "grid_table_col_item_op_menu");
  if (operations || opMenu) {
    const operationButtons = findDescendants(operations || opMenu, (node) => String(node?.type || "") === "action_button");
    for (const button of operationButtons) {
      if (!hasActionBinding(button)) {
        findings.push(error("DASH_DATASET_GRID_TABLE_OPERATION_ACTION_MISSING", "Every grid_table_col_item_operations button must bind to a Collection/page action when operations are present.", {
          page: page.title,
          path: entry.pointer,
          button: identityCandidates(button)[0] || button.id || null,
        }));
      }
    }
    const collectionActions = asArray(entry.control?.attrs?.actions);
    if (!collectionActions.length) {
      findings.push(error("DASH_DATASET_GRID_TABLE_COLLECTION_ACTIONS_MISSING", "grid-table item operations require matching Collection root attrs.actions[] contracts.", { page: page.title, path: `${entry.pointer}.attrs.actions` }));
    }
    const pageText = JSON.stringify(page.resource || {});
    const hasDeleteButton = operationButtons.some((button) => /delete/i.test(`${identityCandidates(button).join(" ")} ${button?.label || ""}`));
    if (hasDeleteButton && !/var_isDeleteConfirmed|isDeleteConfirmed|confirm/i.test(pageText)) {
      findings.push(error("DASH_DATASET_GRID_TABLE_DELETE_CONFIRMATION_TEMPVAR_MISSING", "Delete item operations require the exported delete-confirmation temp variable/flow.", { page: page.title, path: entry.pointer }));
    }
  }

  const dynamicControls = findDescendants(itemGrid, (node) => String(node?.type || "").startsWith("dynamic-"));
  if (!dynamicControls.length) {
    findings.push(error("DASH_DATASET_GRID_TABLE_DYNAMIC_CONTROLS_MISSING", "grid_col_item should map repeated item columns with Dynamic controls from the selected Collection data source.", { page: page.title, path: entry.pointer }));
  }

  const sourceType = String(entry.control?.attrs?.sourceResourceType || entry.control?.attrs?.data?.sourceResourceType || entry.control?.attrs?.data?.resourceType || "").toLowerCase();
  const isViewOnly = /form report|data report|report/.test(sourceType);
  if (isViewOnly && (operations || opMenu)) {
    findings.push(error("DASH_DATASET_GRID_TABLE_DISPLAY_ONLY_OPERATION_FORBIDDEN", "Form Report/Data Report display-only grid-table regions must not include item operation menus or edit/delete controls.", { page: page.title, path: entry.pointer, sourceType }));
  }
}

function validateSearch(entry, page, findings) {
  const hasSearchControl = page.controls.some((candidate) => String(candidate.control?.type || "") === "search-filter");
  const hasFulltext = asArray(entry.control?.attrs?.data?.fulltext).length > 0;
  if (!hasSearchControl || !hasFulltext) {
    findings.push(error("DASH_DATASET_GRID_TABLE_SEARCH_LINKAGE_MISSING", "collection_control_grid_table_with_search requires search-filter and Collection attrs.data.fulltext[] linkage.", { page: page.title, path: entry.pointer, hasSearchControl, hasFulltext }));
  }
}

function validateMultiselect(entry, page, templateId, findings) {
  const text = JSON.stringify(entry.control);
  const pageText = JSON.stringify(page.resource);
  if (!/fa-square|fa-square-check|checkbox|checked/i.test(text)) {
    findings.push(error("DASH_DATASET_MULTISELECT_CHECKBOX_STATE_MISSING", "Multiselect Collection templates require checked/unchecked checkbox icon state.", { page: page.title, path: entry.pointer, templateId }));
  }
  if (!/__temp_var_SelectedItems|var_SelectedItems|SelectedItemsAmount/.test(pageText)) {
    findings.push(error("DASH_DATASET_MULTISELECT_SELECTED_STATE_MISSING", "Multiselect Collection templates require selected ids/count temp variables and selected count binding.", { page: page.title, path: entry.pointer, templateId }));
  }
  const actions = asArray(entry.control?.attrs?.actions);
  const actionText = JSON.stringify(actions);
  if (!actions.length || !actions.some((action) => String(action?.type || "") === "coll") || !/ListDataID/.test(actionText) || !/__ctx_coll/.test(actionText)) {
    findings.push(error("DASH_DATASET_MULTISELECT_ACTION_CONTRACT_INVALID", "Multiselect Collection templates require Collection root attrs.actions[] type coll with ListDataID and __ctx_coll current-item context.", { page: page.title, path: `${entry.pointer}.attrs.actions`, templateId }));
  }
}

function validateCard(entry, page, findings) {
  if (!asArray(entry.control?.children).length) {
    findings.push(error("DASH_DATASET_CARD_ITEM_TEMPLATE_MISSING", "Card Collection templates require a non-empty item template.", { page: page.title, path: `${entry.pointer}.children` }));
  }
  if (!Array.isArray(entry.control?.attrs?.layout?.col)) {
    findings.push(error("DASH_DATASET_CARD_RESPONSIVE_COLUMNS_MISSING", "Card Collection templates require responsive attrs.layout.col metadata.", { page: page.title, path: `${entry.pointer}.attrs.layout.col` }));
  }
}

function validateResponsiveCardGrid(entry, page, findings, context = {}) {
  const wrapper = findNearestAncestorByIdentity(entry, "collection_control_responsive_card_wrapper");
  if (!wrapper) {
    findings.push(error("DASH_DATASET_RESPONSIVE_CARD_WRAPPER_MISSING", "collection_control_responsive_card_grid must be generated from the full collection_control_responsive_card_wrapper subtree, not a simplified card Collection.", { page: page.title, path: entry.pointer }));
    return;
  }

  const requiredSlots = [
    "card_col_body",
    "card_col_item",
  ];
  for (const slot of requiredSlots) {
    if (!findDescendantByIdentity(wrapper, slot)) {
      findings.push(error("DASH_DATASET_RESPONSIVE_CARD_SLOT_MISSING", "collection_control_responsive_card_grid is missing a required export-shaped slot.", { page: page.title, path: entry.pointer, slot }));
    }
  }
  const caption = findDescendantByIdentity(wrapper, "card_col_caption");
  if (caption) {
    for (const slot of ["card_col_title_wrapper", "op_normal"]) {
      if (!findDescendantByIdentity(caption, slot)) {
        findings.push(error("DASH_DATASET_RESPONSIVE_CARD_SLOT_MISSING", "collection_control_responsive_card_grid caption area is present but missing a required export-shaped slot.", { page: page.title, path: entry.pointer, slot }));
      }
    }
  }

  validateResponsiveCardLockedStyleParity(wrapper, page, entry, findings);
  validateResponsiveCardDynamicControls(entry, wrapper, page, findings, context);
  validateResponsiveCardOperations(entry, wrapper, page, findings);
}

function validateResponsiveCardLockedStyleParity(wrapper, page, entry, findings) {
  const sourceRoot = loadResponsiveCardGridSourceTemplateRoot();
  if (!sourceRoot) return;
  for (const identity of ["collection_control_responsive_card_wrapper", "card_col_caption", "card_col_operations", "card_col_body"]) {
    const generated = identity === "collection_control_responsive_card_wrapper" ? wrapper : findDescendantByIdentity(wrapper, identity);
    const source = identity === "collection_control_responsive_card_wrapper" ? sourceRoot : findDescendantByIdentity(sourceRoot, identity);
    if (!generated || !source) continue;
    const checks = [
      ["attrs.style", source?.attrs?.style, generated?.attrs?.style],
      ["attrs.layout.col", source?.attrs?.layout?.col, generated?.attrs?.layout?.col],
      ["attrs.layout.cg", source?.attrs?.layout?.cg, generated?.attrs?.layout?.cg],
      ["attrs.layout.rg", source?.attrs?.layout?.rg, generated?.attrs?.layout?.rg],
    ];
    for (const [property, expected, actual] of checks) {
      if (expected === undefined) continue;
      if (!deepEqual(expected, actual)) {
        findings.push(error("DASH_DATASET_RESPONSIVE_CARD_LOCKED_STYLE_DRIFT", "Locked responsive card grid template structure must be cloned from the source template and not rebuilt from simplified helper defaults.", {
          page: page.title,
          path: entry.pointer,
          control: identity,
          property,
          expected,
          actual: actual ?? null,
        }));
      }
    }
  }
}

function validateResponsiveCardDynamicControls(entry, wrapper, page, findings, context = {}) {
  const cardItem = findDescendantByIdentity(wrapper, "card_col_item");
  const itemControls = findDescendants(cardItem, (node) => String(node?.type || "").startsWith("dynamic-"));
  if (!itemControls.length) {
    findings.push(error("DASH_DATASET_RESPONSIVE_CARD_DYNAMIC_CONTROLS_MISSING", "card_col_item must map repeated card content with Dynamic controls from the selected Collection data source.", { page: page.title, path: entry.pointer }));
    return;
  }
  if (!itemControls.some((node) => String(node?.type || "") === "dynamic-field")) {
    findings.push(error("DASH_DATASET_RESPONSIVE_CARD_SUBJECT_FIELD_MISSING", "card_col_item should include at least one subject-style Dynamic field for the primary record title/subject.", { page: page.title, path: entry.pointer }));
  }

  const fieldInfo = resolveCollectionFieldCatalog(entry, context.fieldCatalog);
  if (!fieldInfo) return;
  const hasImageField = [...fieldInfo.fields.values()].some((field) => inferFieldKind(field) === "image");
  for (const control of itemControls) {
    const fieldName = resolveDynamicFieldName(control);
    if (!fieldName) continue;
    const field = fieldInfo.fields.get(normalizeIdentity(fieldName));
    if (!field) continue;
    const expected = expectedDynamicControlType(field);
    if (String(control.type || "") !== expected) {
      findings.push(error("DASH_DATASET_RESPONSIVE_CARD_DYNAMIC_CONTROL_TYPE_MISMATCH", "Responsive card grid item fields must use Dynamic controls that match the selected data source field type.", {
        page: page.title,
        path: entry.pointer,
        control: identityCandidates(control)[0] || control.id || null,
        field: fieldName,
        fieldKind: inferFieldKind(field),
        expectedControlType: expected,
        actualControlType: control.type || null,
      }));
    }
  }
  if (!hasImageField) {
    const imageControls = itemControls.filter((node) => String(node?.type || "") === "dynamic-image");
    for (const control of imageControls) {
      findings.push(error("DASH_DATASET_RESPONSIVE_CARD_IMAGE_FIELD_UNAVAILABLE", "Do not generate Dynamic image in collection_control_responsive_card_grid when the selected Collection data source has no Image field.", {
        page: page.title,
        path: entry.pointer,
        control: identityCandidates(control)[0] || control.id || null,
        listId: fieldInfo.listId || null,
      }));
    }
  }
}

function validateResponsiveCardOperations(entry, wrapper, page, findings) {
  const opNormal = findDescendantByIdentity(wrapper, "op_normal");
  const normalButtons = findDescendants(opNormal, (node) => String(node?.type || "") === "action_button");
  for (const button of normalButtons) {
    if (!hasActionBinding(button)) {
      findings.push(error("DASH_DATASET_RESPONSIVE_CARD_BUTTON_ACTION_MISSING", "Every responsive card op_normal action_button must bind to a valid action; Search/Add text may be remapped, but action wiring cannot be omitted.", { page: page.title, path: entry.pointer, button: identityCandidates(button)[0] || button.id || null }));
    }
  }

  const itemOperations = findDescendantByIdentity(wrapper, "card_col_item_multi_select");
  if (!itemOperations) return;
  const dropbar = findDescendantByIdentity(itemOperations, "grid_table_col_item_op_menu");
  if (!dropbar) {
    findings.push(error("DASH_DATASET_RESPONSIVE_CARD_OPERATION_MENU_MISSING", "card_col_item_multi_select is present but missing the grid_table_col_item_op_menu Drop bar operation menu from the source template.", { page: page.title, path: entry.pointer }));
    return;
  }

  const operationButtons = findDescendants(dropbar, (node) => String(node?.type || "") === "action_button");
  for (const button of operationButtons) {
    if (!hasActionBinding(button)) {
      findings.push(error("DASH_DATASET_RESPONSIVE_CARD_BUTTON_ACTION_MISSING", "Every grid_table_col_item_op_menu action_button must bind to a valid Collection action.", { page: page.title, path: entry.pointer, button: identityCandidates(button)[0] || button.id || null }));
    }
  }

  const collectionActions = asArray(entry.control?.attrs?.actions);
  const availableActionIds = new Set([
    ...collectionActions.flatMap((action) => [action?.id, action?.ID, action?.name]),
    ...asArray(page.resource?.actions).flatMap((action) => [action?.id, action?.ID, action?.name]),
  ].map((value) => String(value || "").trim()).filter(Boolean));
  for (const button of operationButtons) {
    const actionId = String(button?.attrs?.control_action || button?.attrs?.action || button?.control_action || "").trim();
    if (actionId && availableActionIds.size && !availableActionIds.has(actionId)) {
      findings.push(error("DASH_DATASET_RESPONSIVE_CARD_BUTTON_ACTION_UNRESOLVED", "Responsive card item operation button action must resolve to a Collection or page action preserved from the template.", {
        page: page.title,
        path: entry.pointer,
        button: identityCandidates(button)[0] || button.id || null,
        controlAction: actionId,
        availableActionIds: [...availableActionIds],
      }));
    }
  }

  const hasDeleteButton = operationButtons.some((button) => /delete|del|remove/i.test(`${button?.label || ""} ${button?.id || ""} ${button?.attrs?.operation || ""}`));
  if (hasDeleteButton) {
    const actionText = JSON.stringify(collectionActions);
    const tempVarText = JSON.stringify(page.resource?.tempVars || []);
    if (!tempVarText.includes("var_isDeleteConfirmed")) {
      findings.push(error("DASH_DATASET_RESPONSIVE_CARD_DELETE_CONFIRMATION_TEMPVAR_MISSING", "Responsive card Delete item operation requires the template delete-confirmation temp variable.", { page: page.title, path: entry.pointer }));
    }
    if (!/confirm/.test(actionText) || !/setdatalist/.test(actionText) || !/ListDataID/.test(actionText) || !/__ctx_coll/.test(actionText)) {
      findings.push(error("DASH_DATASET_RESPONSIVE_CARD_DELETE_ACTION_CONTRACT_INVALID", "Responsive card Delete item operation requires confirm plus conditional setdatalist remove scoped by __ctx_coll ListDataID.", { page: page.title, path: `${entry.pointer}.attrs.actions` }));
    }
  }
}

function validateCardMultiselect(entry, page, findings) {
  const wrapper = findNearestAncestorByIdentity(entry, "card_with_multiselect_toolbar_wrapper");
  if (!wrapper) {
    findings.push(error("DASH_DATASET_CARD_MULTISELECT_WRAPPER_MISSING", "collection_control_card_with_multiselect_toolbar must be generated from the full card_with_multiselect_toolbar_wrapper subtree, not a simplified Collection/card control.", { page: page.title, path: entry.pointer }));
    return;
  }

  const requiredSlots = [
    "card_col_title_wrapper",
    "op_normal",
    "op_multipleselected",
    "card_col_item",
    "card_col_item_multi_select",
  ];
  for (const slot of requiredSlots) {
    if (!findDescendantByIdentity(wrapper, slot)) {
      findings.push(error("DASH_DATASET_CARD_MULTISELECT_SLOT_MISSING", "collection_control_card_with_multiselect_toolbar is missing a required export-shaped slot.", { page: page.title, path: entry.pointer, slot }));
    }
  }

  const multiSelect = findDescendantByIdentity(wrapper, "card_col_item_multi_select");
  const multiSelectIcons = asArray(multiSelect?.children).filter((child) => String(child?.type || "") === "icon");
  if (multiSelect && multiSelectIcons.length < 2) {
    findings.push(error("DASH_DATASET_CARD_MULTISELECT_CONTROL_MUTATED", "card_col_item_multi_select must remain unchanged with checked and unchecked icon controls.", { page: page.title, path: entry.pointer, iconCount: multiSelectIcons.length }));
  }

  const collectionActions = asArray(entry.control?.attrs?.actions);
  if (!collectionActions.length) {
    findings.push(error("DASH_DATASET_CARD_MULTISELECT_COLLECTION_ACTIONS_MISSING", "collection_control_card_with_multiselect_toolbar must preserve Collection root attrs.actions[] for card selection and item/bulk behavior.", { page: page.title, path: `${entry.pointer}.attrs.actions` }));
  }

  const opNormal = findDescendantByIdentity(wrapper, "op_normal");
  const normalButtons = findDescendants(opNormal, (node) => String(node?.type || "") === "action_button");
  for (const button of normalButtons) {
    if (!hasActionBinding(button)) {
      findings.push(error("DASH_DATASET_CARD_MULTISELECT_BUTTON_ACTION_MISSING", "Every op_normal action_button must bind to a valid action; Search/Add labels may be remapped, but action wiring cannot be omitted.", { page: page.title, path: entry.pointer, button: identityCandidates(button)[0] || button.id || null }));
    }
  }

  const opMulti = findDescendantByIdentity(wrapper, "op_multipleselected");
  const batchButtons = findDescendants(opMulti, (node) => String(node?.type || "") === "action_button");
  for (const button of batchButtons) {
    if (!hasActionBinding(button)) {
      findings.push(error("DASH_DATASET_CARD_MULTISELECT_BUTTON_ACTION_MISSING", "Every card multiselect toolbar action_button must bind to a valid action.", { page: page.title, path: entry.pointer, button: identityCandidates(button)[0] || button.id || null }));
    }
  }

  const itemOperations = findDescendantByIdentity(wrapper, "card_col_item_operations");
  const itemOperationButtons = findDescendants(itemOperations, (node) => String(node?.type || "") === "action_button");
  for (const button of itemOperationButtons) {
    if (!hasActionBinding(button)) {
      findings.push(error("DASH_DATASET_CARD_MULTISELECT_BUTTON_ACTION_MISSING", "Every card_col_item_operations action_button must bind to a valid item action.", { page: page.title, path: entry.pointer, button: identityCandidates(button)[0] || button.id || null }));
    }
  }

  const cardItem = findDescendantByIdentity(wrapper, "card_col_item");
  const itemControls = findDescendants(cardItem, (node) => String(node?.type || "").startsWith("dynamic-"));
  if (!itemControls.some((node) => String(node?.type || "") === "dynamic-field" && /survey program name|subject|title/i.test(identityCandidates(node).join(" ")))) {
    findings.push(error("DASH_DATASET_CARD_MULTISELECT_SUBJECT_FIELD_MISSING", "card_col_item should include one subject-style Dynamic field based on the Survey Program name template control.", { page: page.title, path: entry.pointer }));
  }
  if (!itemControls.some((node) => String(node?.type || "") === "dynamic-user")) {
    findings.push(error("DASH_DATASET_CARD_MULTISELECT_DYNAMIC_USER_MISSING", "card_col_item should preserve the Dynamic user control pattern for user/person fields when adapting the template.", { page: page.title, path: entry.pointer }));
  }

  validateCardMultiselectPageDependencies(page, entry, findings);
}

function validateCardMultiselectPageDependencies(page, entry, findings) {
  const dependencyChecks = [
    ["filterVars", "DASH_DATASET_CARD_MULTISELECT_FILTERVARS_MISSING"],
    ["tempVars", "DASH_DATASET_CARD_MULTISELECT_TEMPVARS_MISSING"],
    ["actions", "DASH_DATASET_CARD_MULTISELECT_PAGE_ACTIONS_MISSING"],
    ["formAction", "DASH_DATASET_CARD_MULTISELECT_FORM_ACTION_MISSING"],
  ];
  for (const [key, code] of dependencyChecks) {
    const value = page.resource?.[key];
    const count = Array.isArray(value) ? value.length : isObject(value) ? Object.keys(value).length : 0;
    if (count < 1) {
      findings.push(error(code, "collection_control_card_with_multiselect_toolbar requires page-level dependencies from the source template.", { page: page.title, path: entry.pointer, dependency: key }));
    }
  }
  const pageText = JSON.stringify(page.resource || {});
  for (const requiredToken of ["var_SelectedItems", "var_SelectedItemsAmount"]) {
    if (!pageText.includes(requiredToken)) {
      findings.push(error("DASH_DATASET_CARD_MULTISELECT_SELECTED_VARIABLE_MISSING", "Card multiselect template requires selected item variables from the source template.", { page: page.title, path: entry.pointer, requiredToken }));
    }
  }
}

function validateGridMultiselect(entry, page, findings) {
  const wrapper = findNearestAncestorByIdentity(entry, "grid_table_col_multiselect_wrapper");
  if (!wrapper) {
    findings.push(error("DASH_DATASET_GRID_MULTISELECT_WRAPPER_MISSING", "collection_control_grid_table_with_multiselect must be generated from the full grid_table_col_multiselect_wrapper subtree, not a simplified grid-table or checkbox-column control.", { page: page.title, path: entry.pointer }));
    return;
  }

  const requiredSlots = [
    "grid_table_col_title_wrapper",
    "op_normal",
    "op_multipleselected",
    "grid_table_col_header",
    "grid_col_item",
    "grid_table_col_item_select",
  ];
  for (const slot of requiredSlots) {
    if (!findDescendantByIdentity(wrapper, slot)) {
      findings.push(error("DASH_DATASET_GRID_MULTISELECT_SLOT_MISSING", "collection_control_grid_table_with_multiselect is missing a required export-shaped slot.", { page: page.title, path: entry.pointer, slot }));
    }
  }

  validateGridMultiselectFullWidth(wrapper, page, entry, findings);
  validateGridMultiselectLockedStyleParity(wrapper, page, entry, findings);
  validateGridMultiselectTemplateResidue(wrapper, page, entry, findings);

  const selection = findDescendantByIdentity(wrapper, "grid_table_col_item_select");
  const selectionIcons = asArray(selection?.children).filter((child) => String(child?.type || "") === "icon");
  if (selection && selectionIcons.length < 2) {
    findings.push(error("DASH_DATASET_GRID_MULTISELECT_CONTROL_MUTATED", "grid_table_col_item_select must remain unchanged with checked and unchecked icon controls.", { page: page.title, path: entry.pointer, iconCount: selectionIcons.length }));
  }

  const collectionActions = asArray(entry.control?.attrs?.actions);
  if (!collectionActions.length) {
    findings.push(error("DASH_DATASET_GRID_MULTISELECT_COLLECTION_ACTIONS_MISSING", "collection_control_grid_table_with_multiselect must preserve Collection root attrs.actions[] for row selection and item/bulk behavior.", { page: page.title, path: `${entry.pointer}.attrs.actions` }));
  }
  validateGridMultiselectSelectionAction(selection, collectionActions, page, entry, findings);
  validateGridMultiselectFilterShape(entry, page, findings);

  const header = findDescendantByIdentity(wrapper, "grid_table_col_header");
  const itemGrid = findDescendantByIdentity(wrapper, "grid_col_item");
  const headerColumns = gridColumnWidths(header, "1");
  const itemColumns = gridColumnWidths(itemGrid, "1");
  if (!headerColumns.length || !itemColumns.length || headerColumns.join("|") !== itemColumns.join("|")) {
    findings.push(error("DASH_DATASET_GRID_MULTISELECT_HEADER_ITEM_COLUMN_MISMATCH", "grid_table_col_header and grid_col_item must keep matching column count and widths after business field mapping.", {
      page: page.title,
      path: entry.pointer,
      headerColumns,
      itemColumns,
    }));
  }

  const opNormal = findDescendantByIdentity(wrapper, "op_normal");
  const normalButtons = findDescendants(opNormal, (node) => String(node?.type || "") === "action_button");
  for (const button of normalButtons) {
    if (!hasActionBinding(button)) {
      findings.push(error("DASH_DATASET_GRID_MULTISELECT_BUTTON_ACTION_MISSING", "Every op_normal action_button must bind to a valid action; Search/Add labels may be remapped, but action wiring cannot be omitted.", { page: page.title, path: entry.pointer, button: identityCandidates(button)[0] || button.id || null }));
    }
  }

  const opMulti = findDescendantByIdentity(wrapper, "op_multipleselected");
  const batchButtons = findDescendants(opMulti, (node) => String(node?.type || "") === "action_button");
  for (const button of batchButtons) {
    if (!hasActionBinding(button)) {
      findings.push(error("DASH_DATASET_GRID_MULTISELECT_BUTTON_ACTION_MISSING", "Every grid-table multiselect toolbar action_button must bind to a valid action.", { page: page.title, path: entry.pointer, button: identityCandidates(button)[0] || button.id || null }));
    }
  }

  const itemControls = findDescendants(itemGrid, (node) => String(node?.type || "").startsWith("dynamic-"));
  if (!itemControls.length) {
    findings.push(error("DASH_DATASET_GRID_MULTISELECT_DYNAMIC_CONTROLS_MISSING", "grid_col_item should map repeated item columns with Dynamic controls from the selected Collection data source.", { page: page.title, path: entry.pointer }));
  }

  validateGridMultiselectPageDependencies(page, entry, findings);
}

function validateGridMultiselectFullWidth(wrapper, page, entry, findings) {
  for (const identity of GRID_MULTISELECT_FULL_WIDTH_IDS) {
    const node = findDescendantByIdentity(wrapper, identity);
    if (!node) continue;
    const fullWidth =
      node.width === "full"
      && arrayEquals(node?.attrs?.style?.widthtype, [null, "1"])
      && arrayEquals(node?.attrs?.common?.positioning?.widthtype, [null, "1"]);
    if (!fullWidth) {
      findings.push(error("DASH_DATASET_GRID_MULTISELECT_FULL_WIDTH_CONTRACT_MISSING", "Locked grid-table multiselect structural containers must preserve the full-width contract across Designer-relevant width layers.", {
        page: page.title,
        path: entry.pointer,
        control: identity,
        width: node.width ?? null,
        styleWidthType: node?.attrs?.style?.widthtype ?? null,
        positioningWidthType: node?.attrs?.common?.positioning?.widthtype ?? null,
      }));
    }
  }
}

function validateGridMultiselectLockedStyleParity(wrapper, page, entry, findings) {
  const sourceRoot = loadGridMultiselectSourceTemplateRoot();
  if (!sourceRoot) return;
  for (const identity of GRID_MULTISELECT_LOCKED_STYLE_IDS) {
    const generated = findDescendantByIdentity(wrapper, identity);
    const source = findDescendantByIdentity(sourceRoot, identity);
    if (!generated || !source) continue;
    const checks = [
      ["attrs.style.gap", source?.attrs?.style?.gap, generated?.attrs?.style?.gap],
      ["attrs.container.gap", source?.attrs?.container?.gap, generated?.attrs?.container?.gap],
    ];
    for (const [property, expected, actual] of checks) {
      if (expected === undefined) continue;
      if (!deepEqual(expected, actual)) {
        findings.push(error("DASH_DATASET_GRID_MULTISELECT_LOCKED_STYLE_DRIFT", "Locked grid-table multiselect template spacing must be cloned from the source template and must not be rewritten by a normalizer.", {
          page: page.title,
          path: entry.pointer,
          control: identity,
          property,
          expected,
          actual: actual ?? null,
        }));
      }
    }
  }
}

function validateGridMultiselectTemplateResidue(wrapper, page, entry, findings) {
  const residue = GRID_MULTISELECT_TEMPLATE_RESIDUE.filter((token) => controlTextIncludes(wrapper, token));
  if (!residue.length) return;
  findings.push(error("DASH_DATASET_GRID_MULTISELECT_TEMPLATE_RESIDUE", "Generated grid-table multiselect modules must replace source-domain captions, placeholders, buttons, and field labels with the target business domain.", {
    page: page.title,
    path: entry.pointer,
    residue,
  }));
}

function validateGridMultiselectSelectionAction(selection, collectionActions, page, entry, findings) {
  if (!selection) return;
  const actionId = String(selection?.attrs?.control_action || selection?.attrs?.action || selection?.control_action || "").trim();
  if (!actionId) {
    findings.push(error("DASH_DATASET_GRID_MULTISELECT_SELECT_ACTION_MISSING", "grid_table_col_item_select must keep its select/toggle action binding from the template; the selection checkbox cannot be static.", { page: page.title, path: entry.pointer }));
    return;
  }
  const actionIds = new Set([
    ...asArray(collectionActions).flatMap((action) => [action?.id, action?.ID, action?.name]),
    ...asArray(page.resource?.actions).flatMap((action) => [action?.id, action?.ID, action?.name]),
    ...asArray(page.resource?.formAction).flatMap((action) => [action?.id, action?.ID, action?.name]),
  ].map((value) => String(value || "").trim()).filter(Boolean));
  if (actionIds.size && !actionIds.has(actionId)) {
    findings.push(error("DASH_DATASET_GRID_MULTISELECT_SELECT_ACTION_UNRESOLVED", "grid_table_col_item_select action binding must resolve to a Collection or page action preserved from the template.", {
      page: page.title,
      path: entry.pointer,
      controlAction: actionId,
      availableActionIds: [...actionIds],
    }));
  }
}

function validateGridMultiselectFilterShape(entry, page, findings) {
  for (const [index, filter] of asArray(entry.control?.attrs?.data?.filter).entries()) {
    const serialized = JSON.stringify(filter);
    if (!/filter_/i.test(serialized)) continue;
    const condition = findFilterCondition(filter);
    if (!condition) {
      findings.push(error("DASH_DATASET_GRID_MULTISELECT_FILTER_CONDITION_SHAPE_INVALID", "Grid-table multiselect filter conditions must keep the Designer-recognized condition structure.", { page: page.title, path: `${entry.pointer}.attrs.data.filter[${index}]` }));
      continue;
    }
    const operator = String(condition.op ?? condition.operator ?? "");
    const rhs = condition.right ?? condition.value ?? condition.values ?? condition.rhs;
    const rhsItems = Array.isArray(rhs) ? rhs : [rhs];
    const rhsObject = rhsItems.find(isObject) || {};
    if (operator !== "9" || condition.showCus !== false || rhsObject.valueType !== "string" || !String(rhsObject.id || "").startsWith("__filter_") || String(rhsObject.name || "").startsWith("__filter_")) {
      findings.push(error("DASH_DATASET_GRID_MULTISELECT_FILTER_CONDITION_SHAPE_INVALID", "Grid-table multiselect filter condition must use op/operator 9, showCus:false, string RHS, prefixed variable id, and raw variable name for Designer compatibility.", {
        page: page.title,
        path: `${entry.pointer}.attrs.data.filter[${index}]`,
        operator: operator || null,
        showCus: condition.showCus ?? null,
        rhs: rhsObject,
      }));
    }
  }

  const bindingNames = new Set(asArray(entry.control?.attrs?.data?.filterBindings).map((binding) => String(binding?.name || binding?.id || binding || "").replace(/^__filter_/, "").trim()).filter(Boolean));
  if (bindingNames.size) {
    const filterText = JSON.stringify(entry.control?.attrs?.data?.filter || []);
    for (const binding of bindingNames) {
      if (!filterText.includes(binding)) {
        findings.push(error("DASH_DATASET_GRID_MULTISELECT_FILTER_BINDING_UNCONSUMED", "Grid-table multiselect filterBindings[] must correspond to variables consumed by attrs.data.filter[].", { page: page.title, path: entry.pointer, binding }));
      }
    }
  }
}

function validateGridMultiselectPageDependencies(page, entry, findings) {
  const dependencyChecks = [
    ["filterVars", "DASH_DATASET_GRID_MULTISELECT_FILTERVARS_MISSING"],
    ["tempVars", "DASH_DATASET_GRID_MULTISELECT_TEMPVARS_MISSING"],
    ["actions", "DASH_DATASET_GRID_MULTISELECT_PAGE_ACTIONS_MISSING"],
    ["formAction", "DASH_DATASET_GRID_MULTISELECT_FORM_ACTION_MISSING"],
  ];
  for (const [key, code] of dependencyChecks) {
    const value = page.resource?.[key];
    const count = Array.isArray(value) ? value.length : isObject(value) ? Object.keys(value).length : 0;
    if (count < 1) {
      findings.push(error(code, "collection_control_grid_table_with_multiselect requires page-level dependencies from the source template.", { page: page.title, path: entry.pointer, dependency: key }));
    }
  }
  const pageText = JSON.stringify(page.resource || {});
  for (const requiredToken of ["var_SelectedItems", "var_SelectedItemsAmount"]) {
    if (!pageText.includes(requiredToken)) {
      findings.push(error("DASH_DATASET_GRID_MULTISELECT_SELECTED_VARIABLE_MISSING", "Grid-table multiselect template requires selected item variables from the source template.", { page: page.title, path: entry.pointer, requiredToken }));
    }
  }
}

function validateKpiTemplateMaterialization(page, findings) {
  const kpiWrapper = findDescendantByIdentity(page.resource, "kpi_cards_wrapper");
  if (!kpiWrapper) return;
  if (!findDescendantByIdentity(kpiWrapper, "kpi_cards_kpi_row")) {
    findings.push(error("DASH_DATASET_KPI_MODULE_ROW_MISSING", "Dashboard KPI regions must clone the approved kpi_cards_kpi_row module instead of assembling loose KPI cards.", { page: page.title, path: page.pointer }));
  }
  const helperNodes = findDescendants(kpiWrapper, (node) => identityCandidates(node).some((identity) => /^ops_kpi_/i.test(identity) || /helper[_-]?kpi/i.test(identity)));
  if (helperNodes.length) {
    findings.push(error("DASH_DATASET_KPI_HELPER_CARD_FORBIDDEN", "Dashboard KPI cards must be materialized from approved KPI templates; helper-created ops_kpi_* cards are forbidden.", {
      page: page.title,
      path: page.pointer,
      helperNodes: helperNodes.map((node) => identityCandidates(node)[0] || node.id || null).filter(Boolean),
    }));
  }
}

function validateEventPipeline(entry, page, findings) {
  const ancestorIds = new Set(entry.ancestors.flatMap(identityCandidates));
  if (!ancestorIds.has("Event Pipeline Grid-Table")) {
    findings.push(error("DASH_DATASET_EVENT_PIPELINE_REGION_MISSING", "Event Pipeline Grid-Table Collections must live inside the Event Pipeline Grid-Table reference region.", { page: page.title, path: entry.pointer }));
  }
}

function collectDashboardPages(decoded) {
  const pages = [];
  for (const [index, page] of asArray(decoded?.Pages).entries()) {
    if (!isDashboardPage(page)) continue;
    const resource = readPageResource(page);
    if (!resource) continue;
    pages.push({
      title: page.Title || resource.title || resource.name || `Pages[${index}]`,
      pointer: `$.Pages[${index}]`,
      raw: page,
      resource,
      controls: collectControls(resource, `$.Pages[${index}].Resource`),
    });
  }
  return pages;
}

function isDashboardPage(page) {
  return String(page?.Type || page?.type || "") === "103" || /dashboard/i.test(String(page?.Title || page?.title || ""));
}

function readPageResource(page) {
  const resource = page?.Resource || page?.LayoutInResources?.[0]?.Resource || page?.LayoutView?.Resource || page?.LayoutView;
  const parsed = parseJsonMaybe(resource);
  return isObject(parsed) ? parsed : isObject(resource) ? resource : null;
}

function collectControls(root, rootPointer) {
  const entries = [];
  function visit(node, pointer, ancestors) {
    if (!isObject(node)) return;
    if (node.type || node.id || node.name) entries.push({ control: node, pointer, ancestors });
    for (const [key, value] of Object.entries(node)) {
      if (!Array.isArray(value)) continue;
      value.forEach((child, index) => visit(child, `${pointer}.${key}[${index}]`, [...ancestors, node]));
    }
  }
  visit(root, rootPointer, []);
  return entries;
}

function identityCandidates(node) {
  if (!isObject(node)) return [];
  return [
    node.id,
    node.name,
    node.label,
    node.title,
    node.Title,
    node.nv_label,
    node.nav_label,
    node.attrs?.id,
    node.attrs?.name,
    node.attrs?.label,
    node.attrs?.title,
    node.attrs?.nv_label,
    node.attrs?.nav_label,
  ].map((value) => String(value || "").trim()).filter(Boolean);
}

function findNearestAncestorByIdentity(entry, identity) {
  const normalized = normalizeIdentity(identity);
  return entry.ancestors.slice().reverse().find((ancestor) => identityCandidates(ancestor).map(normalizeIdentity).includes(normalized)) || null;
}

function findDescendantByIdentity(root, identity) {
  const normalized = normalizeIdentity(identity);
  return findDescendants(root, (node) => identityCandidates(node).map(normalizeIdentity).includes(normalized))[0] || null;
}

function findDescendants(root, predicate) {
  const matches = [];
  function visit(node) {
    if (!isObject(node)) return;
    if (predicate(node)) matches.push(node);
    asArray(node.children).forEach(visit);
  }
  visit(root);
  return matches;
}

function hasActionBinding(node) {
  const candidates = [
    node?.attrs?.control_action,
    node?.attrs?.action,
    node?.attrs?.data?.action,
    node?.control_action,
    node?.action,
  ];
  return candidates.some((candidate) => String(candidate || "").trim());
}

function loadGridMultiselectSourceTemplateRoot() {
  try {
    const template = JSON.parse(fs.readFileSync(GRID_MULTISELECT_TEMPLATE_PATH, "utf8"));
    return template?.templateResource?.rootContainer || null;
  } catch {
    return null;
  }
}

function loadResponsiveCardGridSourceTemplateRoot() {
  try {
    const template = JSON.parse(fs.readFileSync(RESPONSIVE_CARD_GRID_TEMPLATE_PATH, "utf8"));
    return template?.templateResource?.rootContainer || null;
  } catch {
    return null;
  }
}

function collectFieldCatalog(decoded) {
  const byListId = new Map();
  const byTitle = new Map();
  for (const list of asArray(decoded?.Childs)) {
    const fields = new Map();
    for (const field of [
      ...asArray(list?.Fields),
      ...asArray(list?.Fields?.Items),
      ...asArray(list?.List?.Fields),
      ...asArray(list?.List?.Fields?.Items),
    ]) {
      if (!isObject(field)) continue;
      for (const key of [field.FieldName, field.Name, field.Title, field.InternalName, field.ID, field.FieldID]) {
        const normalized = normalizeIdentity(key);
        if (normalized) fields.set(normalized, field);
      }
    }
    const info = {
      listId: String(list?.ListID || list?.ID || list?.List?.ListID || "").trim(),
      title: String(list?.Title || list?.Name || list?.List?.Title || "").trim(),
      fields,
    };
    if (info.listId) byListId.set(info.listId, info);
    if (info.title) byTitle.set(normalizeIdentity(info.title), info);
  }
  return { byListId, byTitle };
}

function resolveCollectionFieldCatalog(entry, fieldCatalog) {
  if (!fieldCatalog) return null;
  const data = entry.control?.attrs?.data || {};
  const list = data.list || {};
  const listId = String(list.ListID || list.id || data.ListID || "").trim();
  if (listId && fieldCatalog.byListId?.has(listId)) return fieldCatalog.byListId.get(listId);
  const title = normalizeIdentity(list.Title || data.Title || "");
  if (title && fieldCatalog.byTitle?.has(title)) return fieldCatalog.byTitle.get(title);
  return null;
}

function resolveDynamicFieldName(control) {
  const candidates = [
    control?.attrs?.["obj-f"],
    control?.attrs?.field,
    control?.attrs?.FieldName,
    control?.attrs?.data?.field,
    control?.attrs?.data?.FieldName,
    control?.field,
    control?.FieldName,
  ];
  return candidates.map((value) => String(value || "").trim()).find(Boolean) || "";
}

function expectedDynamicControlType(field) {
  const kind = inferFieldKind(field);
  if (kind === "user") return "dynamic-user";
  if (kind === "image") return "dynamic-image";
  if (kind === "file") return "dynamic-file";
  return "dynamic-field";
}

function inferFieldKind(field) {
  const values = [
    field?.FieldType,
    field?.Type,
    field?.DataType,
    field?.ControlType,
    field?.TypeName,
    field?.FieldTypeName,
    field?.Category,
    field?.Title,
    field?.FieldName,
    field?.Name,
  ].map((value) => String(value || "").toLowerCase()).join(" ");
  if (/\b(user|people|person|member|owner|assignee|requester|employee)\b/.test(values)) return "user";
  if (/\b(image|picture|photo|thumbnail|avatar)\b/.test(values)) return "image";
  if (/\b(file|attachment|document|upload)\b/.test(values)) return "file";
  return "field";
}

function controlTextIncludes(root, token) {
  const needle = String(token || "").toLowerCase();
  if (!needle) return false;
  return findDescendants(root, (node) => {
    const values = [
      node?.label,
      node?.title,
      node?.Title,
      node?.name,
      node?.nv_label,
      node?.attrs?.placeholder,
      node?.attrs?.label,
      node?.attrs?.title,
      node?.attrs?.name,
      node?.attrs?.headc?.title?.value,
      node?.attrs?.heads?.value,
    ];
    return values.some((value) => String(value || "").toLowerCase().includes(needle));
  }).length > 0;
}

function findFilterCondition(filter) {
  if (!isObject(filter)) return null;
  if (filter.op !== undefined || filter.operator !== undefined) return filter;
  for (const value of Object.values(filter)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findFilterCondition(item);
        if (found) return found;
      }
    } else if (isObject(value)) {
      const found = findFilterCondition(value);
      if (found) return found;
    }
  }
  return null;
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function arrayEquals(left, right) {
  return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => value === right[index]);
}

function normalizeIdentity(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s_/-]+/g, "_");
}

function gridColumnWidths(grid, deviceKey) {
  const list = grid?.attrs?.columns?.[deviceKey]?.list;
  return asArray(list).map((item) => {
    if (Array.isArray(item)) return item.join("");
    if (isObject(item)) return `${item.value || item.w || item.width || ""}${item.unit || item.u || ""}`;
    return String(item || "");
  }).filter(Boolean);
}

function readJson(file, findings, missingCode) {
  if (!fs.existsSync(file)) {
    findings.push(error(missingCode, "Required JSON file is missing.", { file }));
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    findings.push(error("DASH_DATASET_PRESENTATION_JSON_INVALID", `JSON file is invalid: ${err.message}`, { file }));
    return null;
  }
}

function error(code, message, details = {}) {
  return { level: "error", code, message, ...details };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") args.help = true;
    else if (token === "--registry") {
      args.registry = argv[i + 1] || REGISTRY_PATH;
      if (argv[i + 1] && !argv[i + 1].startsWith("--")) i += 1;
    } else if (token === "--app-plan" || token === "--plan") {
      args.appPlan = argv[i + 1];
      i += 1;
    } else if (token === "--package") {
      args.package = argv[i + 1];
      i += 1;
    } else if (token === "--responsive-card-template") {
      args.responsiveCardTemplate = argv[i + 1];
      i += 1;
    } else if (token === "--card-template") {
      args.cardTemplate = argv[i + 1];
      i += 1;
    } else if (token === "--grid-table-template") {
      args.gridTableTemplate = argv[i + 1];
      i += 1;
    } else if (token === "--grid-template") {
      args.gridTemplate = argv[i + 1];
      i += 1;
    } else {
      throw new Error(`Unexpected argument: ${token}`);
    }
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/validate-dashboard-dataset-presentation-golden-references.mjs --registry
  node scripts/validate-dashboard-dataset-presentation-golden-references.mjs --registry <registry.json> --responsive-card-template <template.json> --card-template <template.json> --grid-table-template <template.json> --grid-template <template.json>
  node scripts/validate-dashboard-dataset-presentation-golden-references.mjs --app-plan <yeeflow-app-plan.md>
  node scripts/validate-dashboard-dataset-presentation-golden-references.mjs --package <app.yapk>`);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}

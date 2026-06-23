#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { asArray, isObject, parseJsonMaybe, readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = path.join(ROOT, "docs/reference/dashboard-dataset-presentation-golden-references.json");

const APPROVED_IDS = new Set([
  "collection_control_responsive_card_grid",
  "collection_control_card_with_multiselect_toolbar",
  "collection_control_grid_table",
  "collection_control_grid_table_with_multiselect",
  "collection_control_grid_table_with_search",
  "Event Pipeline Grid-Table",
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
  const approvedIds = validateRegistry(registry, findings);

  if (options.appPlan) validateAppPlan(path.resolve(options.appPlan), approvedIds, findings);
  if (options.package) validatePackage(path.resolve(options.package), approvedIds, findings);

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    registry: registryPath,
    appPlan: options.appPlan ? path.resolve(options.appPlan) : null,
    package: options.package ? path.resolve(options.package) : null,
    approvedTemplateIds: [...approvedIds],
    findings,
  };
}

function validateRegistry(registry, findings) {
  if (!registry) return APPROVED_IDS;
  const ids = new Set(asArray(registry.references).map((item) => String(item?.templateId || item?.referenceId || "")).filter(Boolean));
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
    for (const key of ["displayName", "whenToUse", "whenNotToUse", "requiredAppPlanDeclaration", "generationProof", "proofBoundary"]) {
      if (entry[key] === undefined || (Array.isArray(entry[key]) && entry[key].length === 0) || String(entry[key] || "").trim() === "") {
        findings.push(error("DASH_DATASET_PRESENTATION_REFERENCE_INCOMPLETE", "Dashboard dataset presentation reference is missing required guidance.", { referenceId: id, missing: key }));
      }
    }
  }
  return ids.size ? ids : APPROVED_IDS;
}

function validateAppPlan(appPlanPath, approvedIds, findings) {
  if (!fs.existsSync(appPlanPath)) {
    findings.push(error("DASH_DATASET_APP_PLAN_MISSING", "App Plan file is missing.", { appPlan: appPlanPath }));
    return;
  }
  const text = fs.readFileSync(appPlanPath, "utf8");
  const dashboardDatasetLines = text.split(/\r?\n/).filter((line) => {
    const normalized = line.toLowerCase();
    return /dashboard/.test(normalized) && /(collection|dataset|data list|form report|document library|grid-table|grid table|card grid)/.test(normalized);
  });
  if (!dashboardDatasetLines.length) return;

  const approvedMentioned = [...approvedIds].filter((id) => text.includes(id));
  const invented = [...text.matchAll(/\b(collection_control_[A-Za-z0-9_-]+|Event\s+Pipeline\s+Grid-Table)\b/g)]
    .map((match) => match[1])
    .filter((id) => !approvedIds.has(id));
  for (const id of invented) {
    findings.push(error("DASH_DATASET_APP_PLAN_REFERENCE_UNKNOWN", "App Plan selected an unknown Dashboard dataset presentation reference.", { referenceId: id }));
  }

  for (const line of dashboardDatasetLines) {
    if (isMarkdownTableHeaderOrSeparator(line)) continue;
    if (/not applicable|n\/a|deferred|no dashboard dataset/i.test(line)) continue;
    if (!approvedMentioned.some((id) => line.includes(id))) {
      findings.push(error("DASH_DATASET_APP_PLAN_REFERENCE_MISSING", "Dashboard Collection dataset regions in App Plan must select one approved dataset presentation reference.", { line: line.trim().slice(0, 500), approvedTemplateIds: [...approvedIds] }));
    }
  }
}

function isMarkdownTableHeaderOrSeparator(line) {
  const trimmed = String(line || "").trim();
  if (!trimmed.startsWith("|")) return false;
  if (/^\|(?:\s*:?-+:?\s*\|)+\s*$/.test(trimmed)) return true;
  return /selected collection presentation reference/i.test(trimmed)
    && /dashboard page|dataset region|source resource|business purpose/i.test(trimmed);
}

function validatePackage(packagePath, approvedIds, findings) {
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

  for (const page of collectDashboardPages(decoded)) {
    const collections = page.controls.filter((entry) => String(entry.control?.type || "") === "collection");
    for (const entry of collections) {
      validateCollectionEntry(entry, page, approvedIds, findings);
    }
  }
}

function validateCollectionEntry(entry, page, approvedIds, findings) {
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
  if (provenance.templateId === "Event Pipeline Grid-Table") validateEventPipeline(entry, page, findings);
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

function validateGridTable(entry, page, templateId, findings) {
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
    } else {
      throw new Error(`Unexpected argument: ${token}`);
    }
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/validate-dashboard-dataset-presentation-golden-references.mjs --registry
  node scripts/validate-dashboard-dataset-presentation-golden-references.mjs --app-plan <yeeflow-app-plan.md>
  node scripts/validate-dashboard-dataset-presentation-golden-references.mjs --package <app.yapk>`);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}

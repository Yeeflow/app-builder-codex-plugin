#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { asArray, isObject, parseJsonMaybe, readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = path.join(ROOT, "docs/reference/dashboard-golden-references.json");
const DEFAULT_REFERENCE_ID = "event_portfolio_dashboard_golden_reference";
const REQUIRED_REGION_IDS = [
  "event_portfolio_header_band",
  "event_portfolio_filter_group",
  "kpi_cards_wrapper",
  "event_portfolio_pipeline_section",
  "Event Pipeline Grid-Table",
];

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.selection && !args.blueprint && !args.package)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateDashboardGoldenReferenceConformance(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateDashboardGoldenReferenceConformance(options = {}) {
  const findings = [];
  const registry = readJson(REGISTRY_PATH, findings, "DASH_GOLDEN_REGISTRY_MISSING");
  const registryIds = new Set(asArray(registry?.references).map((item) => item.id));
  const defaultId = registry?.defaultDashboardGoldenReferenceId || DEFAULT_REFERENCE_ID;

  if (options.selection) validateSelection(readJson(path.resolve(options.selection), findings, "DASH_GOLDEN_SELECTION_MISSING"), { findings, registryIds, defaultId });
  if (options.blueprint) validateBlueprint(readJson(path.resolve(options.blueprint), findings, "DASH_GOLDEN_BLUEPRINT_MISSING"), { findings, defaultId });
  if (options.package) validatePackage(path.resolve(options.package), { findings, defaultId });

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    registry: REGISTRY_PATH,
    selection: options.selection ? path.resolve(options.selection) : null,
    blueprint: options.blueprint ? path.resolve(options.blueprint) : null,
    package: options.package ? path.resolve(options.package) : null,
    findings,
  };
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
  for (const id of requiredRegionsFromPlan(blueprint)) {
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
    const refs = collectControlReferences(page.resource);
    for (const id of requiredRegionsFromPlan(page.resource)) {
      if (!refs.has(id)) context.findings.push(error(regionMissingCode(id, "RESOURCE"), "Generated dashboard resource is missing required golden-reference provenance.", { page: page.title, subRegionReference: id }));
    }
    if (planned(page.resource, "gridTable") && !page.controls.some((entry) => entry.control?.type === "collection" && hasRef(entry.control, "Event Pipeline Grid-Table"))) {
      context.findings.push(error("DASH_GOLDEN_GRID_TABLE_COLLECTION_MISSING", "Planned dashboard table/queue must materialize as a grid-table Collection region derived from Event Pipeline Grid-Table.", { page: page.title }));
    }
    if (unrelatedToMarketing) rejectCopiedMarketingTerms(page.resource, context.findings, "DASH_GOLDEN_MARKETING_FIELD_LEAKAGE", { page: page.title });
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

function collectControls(node, out, pointer) {
  if (!isObject(node)) return;
  if (node.type) out.push({ control: node, pointer });
  for (const key of ["children", "columns", "controls"]) asArray(node[key]).forEach((child, index) => collectControls(child, out, `${pointer}.${key}[${index}]`));
}

function hasMainContent(resource) {
  const main = asArray(resource?.children).find((child) => matchesName(child, "Main"));
  return Boolean(main && asArray(main.children).some((child) => matchesName(child, "Content")));
}

function meaningfulContentChildren(resource) {
  const main = asArray(resource?.children).find((child) => matchesName(child, "Main"));
  const content = asArray(main?.children).find((child) => matchesName(child, "Content"));
  return asArray(content?.children).filter((child) => isObject(child) && child.type);
}

function matchesName(control, expected) {
  return String(control?.id || control?.name || control?.attrs?.nv_label || control?.attrs?.nav_label || "").toLowerCase() === expected.toLowerCase();
}

function collectControlReferences(root) {
  const refs = new Set();
  collectControls(root, [], "$");
  const visit = (node) => {
    if (!isObject(node)) return;
    for (const value of [node.derivedFromGoldenReference, node.attrs?.derivedFromGoldenReference, node.attrs?.goldenReferenceId, node.goldenReferenceId, node.id, node.name, node.attrs?.nv_label]) {
      if (present(value)) refs.add(String(value));
    }
    for (const key of ["children", "columns", "controls"]) asArray(node[key]).forEach(visit);
  };
  visit(root);
  return refs;
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

function requiredRegionsFromPlan(source) {
  const ids = ["event_portfolio_header_band", "event_portfolio_pipeline_section"];
  if (planned(source, "filters")) ids.push("event_portfolio_filter_group");
  if (planned(source, "kpis")) ids.push("kpi_cards_wrapper");
  if (planned(source, "gridTable")) ids.push("Event Pipeline Grid-Table");
  return ids;
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
  return [control?.derivedFromGoldenReference, control?.attrs?.derivedFromGoldenReference, control?.attrs?.goldenReferenceId, control?.id, control?.name, control?.attrs?.nv_label].map(String).includes(refId);
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
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/validate-dashboard-golden-reference-conformance.mjs --selection <dashboard-golden-reference-selection.json>
  node scripts/validate-dashboard-golden-reference-conformance.mjs --blueprint <dashboard-blueprint.json>
  node scripts/validate-dashboard-golden-reference-conformance.mjs --package <generated-final.yapk>`);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}

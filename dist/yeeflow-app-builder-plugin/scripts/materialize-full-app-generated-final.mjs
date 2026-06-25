#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_ICON = JSON.stringify({ b: "#E6F0FF", i: "fa-solid fa-laptop", c: "#0065FF" });
const DASHBOARD_V11_TEMPLATE_PATH = path.join(ROOT, "docs/reference/dashboard-page-layout-templates.json");
const DATA_LIST_FORM_TEMPLATE_PATHS = {
  newEdit: path.join(ROOT, "docs/reference/data-list-form-layout-new-edit.template.json"),
  view: path.join(ROOT, "docs/reference/data-list-form-layout-view-item.template.json"),
};
const DATA_LIST_FORM_FIELDS_GRID_TEMPLATE_PATH = path.join(ROOT, "docs/reference/data-list-form-fields-grid.template.json");
const DATA_LIST_FORM_SUBLIST_TEMPLATE_PATH = path.join(ROOT, "docs/reference/data-list-form-control-sublist.template.json");
const COLLECTION_TEMPLATE_PATHS = {
  collection_control_grid_table: path.join(ROOT, "docs/reference/collection-control-grid-table.template.json"),
  collection_control_grid_table_with_search: path.join(ROOT, "docs/reference/collection-control-grid-table.template.json"),
  "Event Pipeline Grid-Table": path.join(ROOT, "docs/reference/collection-control-grid-table.template.json"),
  collection_control_grid_table_with_multiselect: path.join(ROOT, "docs/reference/collection-control-grid-table-with-multiselect.template.json"),
  collection_control_card_with_multiselect_toolbar: path.join(ROOT, "docs/reference/collection-control-card-with-multiselect-toolbar.template.json"),
  collection_control_responsive_card_grid: path.join(ROOT, "docs/reference/collection-control-responsive-card-grid.template.json"),
};
const APPROVED_COLLECTION_TEMPLATE_IDS = Object.freeze(Object.keys(COLLECTION_TEMPLATE_PATHS));
const GRID_TABLE_TEMPLATE_IDS = new Set([
  "collection_control_grid_table",
  "collection_control_grid_table_with_search",
  "collection_control_grid_table_with_multiselect",
  "Event Pipeline Grid-Table",
]);
const PAGE_LAYOUT_TEMPLATE_ID = "dashboard-page-layouts-v1.1";
const DASHBOARD_GOLDEN_REFERENCE_ID = "event_portfolio_dashboard_golden_reference";

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }
  const report = materializeFullAppGeneratedFinal(args);
  if (args.json) console.log(JSON.stringify(report, null, 2));
  else printTextReport(report);
  process.exit(report.status === "pass" ? 0 : 1);
}

export function materializeFullAppGeneratedFinal(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const specPath = resolveRequiredPath(cwd, options.functionalSpec || options.spec, "functional-specification.md");
  const planPath = resolveRequiredPath(cwd, options.appPlan || options.plan, "yeeflow-app-plan.md");
  const outDir = path.resolve(cwd, options.outDir || "dist");
  const findings = [];

  if (!specPath) findings.push(error("FULL_APP_MATERIALIZATION_SPEC_REQUIRED", "Missing --functional-spec functional-specification.md input."));
  if (!planPath) findings.push(error("FULL_APP_MATERIALIZATION_PLAN_REQUIRED", "Missing --app-plan yeeflow-app-plan.md input."));
  if (findings.length) return buildFailure(findings, { outDir });

  const fixtureMode = options.allowFixtureApiIdsForTests === true;
  const idSource = loadIdSource({ cwd, apiIdManifest: options.apiIdManifest, fixtureMode, findings });
  if (findings.length) return buildFailure(findings, { outDir, specPath, planPath });

  const specText = fs.readFileSync(specPath, "utf8");
  const planText = fs.readFileSync(planPath, "utf8");
  const planDemand = analyzeAppPlanResourceDemand(planText);
  fs.mkdirSync(outDir, { recursive: true });
  const appTitle = sanitizeTitle(options.title || extractTitle(planText) || extractTitle(specText) || "Generated Yeeflow Application");
  const slug = slugify(appTitle);
  const idPaths = buildIdPaths(planDemand);
  const ids = allocateIds(idSource.ids, idPaths, findings);
  if (findings.length) return buildFailure(findings, { outDir, specPath, planPath });
  const appIconUrl = options.iconUrl || DEFAULT_ICON;

  const decoded = planDemand.hasMaterialResources
    ? buildResourceGraphPackage({ appTitle, rootListId: numberId(ids["decoded.ListSet.ListID"]), planDemand, ids, iconUrl: appIconUrl })
    : buildDecodedPackage({
      appTitle,
      rootListId: numberId(ids["decoded.ListSet.ListID"]),
      dashboardLayoutId: stringId(ids["decoded.Pages[0].LayoutID"]),
      layoutResourceId: numberId(ids["decoded.Pages[0].LayoutInResources[0].ID"]),
      layoutResourceRefId: numberId(ids["decoded.Pages[0].LayoutInResources[0].RefId"]),
      iconUrl: appIconUrl,
    });
  const resource = zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64");
  const wrapper = {
    PackageId: stringId(ids["wrapper.PackageId"]),
    TenantID: options.tenantId ? String(options.tenantId) : "0",
    AppID: 41,
    ListID: stringId(ids["wrapper.ListID"]),
    Title: appTitle,
    Description: `Generated-final package materialized from ${path.basename(specPath)} and ${path.basename(planPath)}.`,
    IconUrl: appIconUrl,
    Resource: resource,
    Notes: fixtureMode
      ? "Fixture-ID materialization for plugin regression only. Not signing/install eligible."
      : "Generated-final materialization. Run generated-final preflight before signing.",
    Author: "Codex Yeeflow App Builder",
    Date: "2026-06-24T00:00:00Z",
    Version: "1.0",
    Sign: "",
  };

  const packagePath = path.join(outDir, `${slug}.generated-final.yapk`);
  const decodedPath = path.join(outDir, `${slug}.generated-final.decoded-resource.json`);
  const provenancePath = path.join(outDir, `${slug}.generated-final-id-provenance-report.json`);
  const generationReportPath = path.join(outDir, `${slug}.generated-final-generation-report.json`);
  fs.writeFileSync(packagePath, `${JSON.stringify(wrapper, null, 2)}\n`);
  fs.writeFileSync(decodedPath, `${JSON.stringify(decoded, null, 2)}\n`);

  const provenance = {
    status: "pass",
    generatorProvenance: {
      name: "materialize-full-app-generated-final",
      pluginVersion: "0.8.35-training",
      mode: fixtureMode ? "fixture-regression" : planDemand.hasMaterialResources ? "minimal-resource-graph" : "schema-smoke-only",
    },
    generator: {
      name: "materialize-full-app-generated-final",
      version: "0.8.34-training",
      mode: fixtureMode ? "fixture-regression" : planDemand.hasMaterialResources ? "minimal-resource-graph" : "schema-smoke-only",
    },
    sourceMarker: fixtureMode ? "api-generated-fixture-for-tests" : "api-generated",
    allocationSource: "api-generated",
    signingEligible: false,
    package: summarizePath(packagePath),
    allocations: Object.entries(ids).map(([pathName, id]) => ({
      path: pathName,
      id: stringId(id),
      purpose: pathName,
      source: fixtureMode ? "api-generated-fixture-for-tests" : "api-generated",
    })),
    proofBoundary: fixtureMode
      ? "Fixture IDs are only for plugin regression. Do not sign, install, import, upgrade, or claim live Yeeflow ID provenance with this package."
      : "API-issued ID provenance report. Signing/install still require generated-final preflight, setsign, verifysign, package API acceptance, Version Management final success, and browser/runtime proof.",
  };
  fs.writeFileSync(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);

  const generationReport = {
    status: "pass",
    mode: fixtureMode ? "fixture-regression" : planDemand.hasMaterialResources ? "minimal-resource-graph" : "schema-smoke-only",
    signingEligible: false,
    plannedResourceDemand: planDemand,
    inputs: {
      functionalSpecification: summarizePath(specPath),
      appPlan: summarizePath(planPath),
      apiIdManifest: options.apiIdManifest ? summarizePath(path.resolve(cwd, options.apiIdManifest)) : null,
    },
    outputs: {
      package: summarizePath(packagePath),
      decodedResource: summarizePath(decodedPath),
      idProvenance: summarizePath(provenancePath),
    },
    hardStopsPreserved: [
      "No signing was attempted.",
      "No install/import/upgrade was attempted.",
      "No browser/runtime proof was attempted.",
      "Generated-final preflight is required before any signing request.",
      "Standalone materialization emits the planned generated-final resource surfaces but remains signing-ineligible until all generated-final hard gates pass.",
    ],
  };
  fs.writeFileSync(generationReportPath, `${JSON.stringify(generationReport, null, 2)}\n`);

  return {
    status: "pass",
    mode: generationReport.mode,
    signingEligible: generationReport.signingEligible,
    outputDirectory: outDir,
    outputs: {
      package: packagePath,
      decodedResource: decodedPath,
      idProvenance: provenancePath,
      generationReport: generationReportPath,
    },
    proofBoundary: generationReport.hardStopsPreserved,
    findings: [],
  };
}

function analyzeAppPlanResourceDemand(planText) {
  const sections = [
    { key: "dataLists", marker: /^##\s+4\.\s+Data Lists and Document Libraries Plan/im, tableHeaders: ["List Name", "Data List Name", "Document Library Name"], outputSurface: "$.Childs[]" },
    { key: "approvalForms", marker: /^##\s+5\.\s+Approval Forms Plan/im, tableHeaders: ["Approval Form Name", "Form Name"], outputSurface: "$.Forms[]" },
    { key: "formReports", marker: /^##\s+6\.\s+Form Reports Plan/im, tableHeaders: ["Form Report Name"], outputSurface: "$.FormNewReports[]" },
    { key: "customForms", marker: /^##\s+10\.\s+Custom Data List Forms Plan/im, tableHeaders: ["Form Name"], outputSurface: "$.Childs[].Layouts[]" },
    { key: "dashboards", marker: /^##\s+14\.\s+Dashboard Pages Plan/im, tableHeaders: ["Dashboard Page Name", "Dashboard Page", "Page Name"], outputSurface: "$.Pages[] Type 103" },
    { key: "navigationGroups", marker: /^##\s+15\.\s+Application Navigation Plan/im, tableHeaders: ["Group"], outputSurface: "$.ListSet.LayoutView.sort[]" },
  ];
  const counts = {};
  const resources = {};
  const evidence = [];
  const navigationItemsByGroup = {};
  for (const { key, marker, tableHeaders, outputSurface } of sections) {
    const section = extractNumberedSection(planText, marker);
    const names = collectPlannedResourceNames(section, { tableHeaders, key });
    if (key === "navigationGroups") Object.assign(navigationItemsByGroup, collectNavigationItemsByGroup(section));
    const count = names.length;
    counts[key] = count;
    resources[key] = names;
    if (count > 0) evidence.push({ section: key, outputSurface, plannedItems: count, names });
  }
  return {
    counts,
    resources,
    navigationItemsByGroup,
    dataListFieldSpecs: collectDataListFieldSpecs(planText),
    customFormRecords: collectCustomFormRecords(planText),
    dashboardFilterRecords: collectDashboardFilterRecords(planText),
    dashboardDatasetRecords: collectDashboardDatasetRecords(planText),
    evidence,
    hasMaterialResources: Object.values(counts).some((count) => count > 0),
  };
}

function collectDashboardDatasetRecords(planText) {
  const section = extractNumberedSection(planText, /^##\s+14\.\s+Dashboard Pages Plan/im);
  if (!section.trim()) return [];
  const lines = section.split(/\r?\n/);
  const records = [];
  let currentDashboardPage = "";
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^###\s+\d+\.[x0-9]+\s+(.+?)\s*$/i);
    if (heading) currentDashboardPage = cleanResourceName(heading[1]);
    if (!isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const normalizedHeaders = headers.map((header) => normKey(header));
    const templateColumn = findHeaderIndex(normalizedHeaders, [
      "selected collection presentation reference",
      "selected record display control",
      "selected collection template",
      "collection template",
      "record display control",
      "control",
    ]);
    const regionColumn = findHeaderIndex(normalizedHeaders, ["dataset region", "section", "section name", "region"]);
    const sourceColumn = findHeaderIndex(normalizedHeaders, ["source resource", "data source", "source data", "source"]);
    const pageColumn = findHeaderIndex(normalizedHeaders, ["dashboard page", "dashboard page name", "page name"]);
    if (templateColumn === -1 || regionColumn === -1 || sourceColumn === -1) continue;
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const raw = lines[rowIndex];
      const selectedTemplateId = extractApprovedCollectionTemplateId(raw);
      if (selectedTemplateId) {
        records.push({
          dashboardPage: cleanResourceName(cells[pageColumn]) || currentDashboardPage,
          datasetRegion: cleanResourceName(cells[regionColumn]),
          sourceResource: cleanResourceName(cells[sourceColumn]),
          selectedTemplateId,
          raw: raw.trim(),
        });
      }
      rowIndex += 1;
    }
    index = rowIndex;
  }
  return records;
}

function collectDataListFieldSpecs(planText) {
  const section = extractNumberedSection(planText, /^##\s+4\.\s+Data Lists and Document Libraries Plan/im);
  const byList = {};
  if (!section.trim()) return byList;
  const lines = section.split(/\r?\n/);
  let currentList = "";
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^###\s+\d+\.[x0-9]+\s+(.+?)\s*$/i);
    if (heading) {
      currentList = cleanResourceName(heading[1]);
      if (currentList && !byList[normKey(currentList)]) byList[normKey(currentList)] = [];
      continue;
    }
    if (!currentList || !isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const normalizedHeaders = headers.map((header) => normKey(header));
    const displayColumn = findHeaderIndex(normalizedHeaders, ["display name", "field name", "name"]);
    const keyColumn = findHeaderIndex(normalizedHeaders, ["internal id field key", "field key", "internal id", "field id", "fieldname"]);
    const fieldTypeColumn = findHeaderIndex(normalizedHeaders, ["exact yeeflow field type", "field type", "type"]);
    const controlTypeColumn = findHeaderIndex(normalizedHeaders, ["exact yeeflow control type", "control type", "control"]);
    const choiceColumn = findHeaderIndex(normalizedHeaders, ["choice values", "options", "values"]);
    if (displayColumn === -1 || fieldTypeColumn === -1) continue;
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const displayName = cleanResourceName(cells[displayColumn]);
      if (!displayName || isNonResourceName(displayName)) {
        rowIndex += 1;
        continue;
      }
      const fieldType = cleanResourceName(cells[fieldTypeColumn]) || "Text";
      const controlType = controlTypeColumn === -1 ? "" : cleanResourceName(cells[controlTypeColumn]);
      const fieldName = cleanResourceName(cells[keyColumn]) || inferFieldKey(displayName, fieldType, byList[normKey(currentList)].length);
      byList[normKey(currentList)].push({
        displayName,
        fieldName,
        fieldType,
        controlType,
        choiceValues: choiceColumn === -1 ? "" : cleanResourceName(cells[choiceColumn]),
      });
      rowIndex += 1;
    }
    index = rowIndex;
  }
  return byList;
}

function collectCustomFormRecords(planText) {
  const section = extractNumberedSection(planText, /^##\s+10\.\s+Custom Data List Forms Plan/im);
  const records = [];
  if (!section.trim()) return records;
  const lines = section.split(/\r?\n/);
  let currentList = "";
  const seen = new Set();
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^###\s+\d+\.[x0-9]+\s+(.+?)\s*$/i);
    if (heading) {
      currentList = cleanResourceName(heading[1]);
      continue;
    }
    if (!currentList || !isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const normalizedHeaders = headers.map((header) => normKey(header));
    const formColumn = findHeaderIndex(normalizedHeaders, ["form name", "custom form name"]);
    const typeColumn = findHeaderIndex(normalizedHeaders, ["form type", "type", "purpose"]);
    if (formColumn === -1) continue;
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const formName = cleanResourceName(cells[formColumn]);
      if (!formName || isNonResourceName(formName)) {
        rowIndex += 1;
        continue;
      }
      const key = `${normKey(currentList)}::${normKey(formName)}`;
      if (!seen.has(key)) {
        seen.add(key);
        records.push({
          listName: currentList,
          formName,
          formType: typeColumn === -1 ? "" : cleanResourceName(cells[typeColumn]),
        });
      }
      rowIndex += 1;
    }
    index = rowIndex;
  }
  return records;
}

function collectDashboardFilterRecords(planText) {
  const section = extractNumberedSection(planText, /^##\s+14\.\s+Dashboard Pages Plan/im);
  const records = [];
  if (!section.trim()) return records;
  const lines = section.split(/\r?\n/);
  let currentDashboardPage = "";
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^###\s+\d+\.[x0-9]+\s+(.+?)\s*$/i);
    if (heading) currentDashboardPage = cleanResourceName(heading[1]);
    if (!isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const normalizedHeaders = headers.map((header) => normKey(header));
    const filterColumn = findHeaderIndex(normalizedHeaders, ["filter name", "filter", "control label"]);
    const sourceColumn = findHeaderIndex(normalizedHeaders, ["source resource", "data source", "source data", "source"]);
    const fieldColumn = findHeaderIndex(normalizedHeaders, ["field", "filter field", "source field", "filter field display name"]);
    const pageColumn = findHeaderIndex(normalizedHeaders, ["dashboard page", "dashboard page name", "page name"]);
    if (filterColumn === -1 || fieldColumn === -1) continue;
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const filterName = cleanResourceName(cells[filterColumn]);
      if (!filterName || isNonResourceName(filterName) || /not applicable|n\/a|none/i.test(filterName)) {
        rowIndex += 1;
        continue;
      }
      records.push({
        dashboardPage: cleanResourceName(cells[pageColumn]) || currentDashboardPage,
        filterName,
        sourceResource: sourceColumn === -1 ? "" : cleanResourceName(cells[sourceColumn]),
        fieldDisplayName: cleanResourceName(cells[fieldColumn]),
      });
      rowIndex += 1;
    }
    index = rowIndex;
  }
  return records;
}

function findHeaderIndex(normalizedHeaders, candidates) {
  const normalizedCandidates = candidates.map(normKey);
  return normalizedHeaders.findIndex((header) => normalizedCandidates.includes(header));
}

function extractApprovedCollectionTemplateId(text) {
  for (const templateId of APPROVED_COLLECTION_TEMPLATE_IDS) {
    const escaped = templateId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|[^A-Za-z0-9_-])${escaped}($|[^A-Za-z0-9_-])`).test(String(text || ""))) return templateId;
  }
  return "";
}

function buildMissingResourceGraph(planDemand) {
  const surfaceByKey = {
    dataLists: "$.Childs[] data list/document library resources",
    approvalForms: "$.Forms[] approval form definitions",
    formReports: "$.FormNewReports[] approval report registrations",
    customForms: "$.Childs[].Layouts[] custom data list form layouts",
    dashboards: "$.Pages[] Type 103 dashboard pages with materialized v1.1 content",
    navigationGroups: "$.ListSet.LayoutView.sort[] grouped navigation runtime metadata",
  };
  return Object.entries(planDemand.resources)
    .filter(([, names]) => names.length)
    .map(([category, names]) => ({
      category,
      plannedCount: names.length,
      plannedNames: names,
      requiredOutputSurface: surfaceByKey[category],
      materializerStatus: "not-implemented",
    }));
}

function buildIdPaths(planDemand) {
  if (!planDemand.hasMaterialResources) {
    return [
      "wrapper.PackageId",
      "wrapper.ListID",
      "decoded.ListSet.ListID",
      "decoded.Pages[0].LayoutID",
      "decoded.Pages[0].LayoutInResources[0].ID",
      "decoded.Pages[0].LayoutInResources[0].RefId",
    ];
  }
  const paths = [
    "wrapper.PackageId",
    "wrapper.ListID",
    "decoded.ListSet.ListID",
  ];
  planDemand.resources.dataLists.forEach((name, index) => {
    const fieldSpecs = fieldSpecsForList(planDemand, name);
    paths.push(`decoded.Childs[${index}].List.ListID`);
    fieldSpecs.forEach((field, fieldIndex) => {
      paths.push(`decoded.Childs[${index}].Fields[${fieldIndex}].FieldID`);
    });
    paths.push(`decoded.Childs[${index}].Layouts[0].LayoutID`);
  });
  for (const assignment of assignCustomFormLayoutPositions(planDemand, planDemand.resources.dataLists)) {
    paths.push(`decoded.Childs[${assignment.listIndex}].Layouts[${assignment.layoutIndex}].LayoutID`);
  }
  const assignedFormNames = new Set(planDemand.customFormRecords.map((record) => normKey(record.formName)));
  planDemand.resources.customForms.filter((name) => !assignedFormNames.has(normKey(name))).forEach((name, index) => {
    paths.push(`decoded.Childs[0].Layouts[${index + 1}].LayoutID`);
  });
  planDemand.resources.approvalForms.forEach((name, index) => {
    paths.push(`decoded.Forms[${index}].Key`);
    paths.push(`decoded.Forms[${index}].DefResourceID`);
  });
  planDemand.resources.formReports.forEach((name, index) => {
    paths.push(`decoded.FormNewReports[${index}].ID`);
  });
  planDemand.resources.dashboards.forEach((name, index) => {
    paths.push(`decoded.Pages[${index}].LayoutID`);
  });
  planDemand.resources.navigationGroups.forEach((name, index) => {
    paths.push(`decoded.ListSet.LayoutView.sort[${index}].ID`);
  });
  return paths;
}

function extractNumberedSection(text, marker) {
  const match = marker.exec(text);
  if (!match) return "";
  const start = match.index;
  const next = text.slice(start + match[0].length).search(/\n##\s+\d+\.\s+/);
  return next === -1 ? text.slice(start) : text.slice(start, start + match[0].length + next);
}

function collectPlannedResourceNames(section, { tableHeaders = [], key = "" } = {}) {
  if (!section.trim()) return [];
  const headingNames = [...section.matchAll(/^###\s+\d+\.[x0-9]+\s+(.+?)\s*$/gim)]
    .map((match) => cleanResourceName(match[1]))
    .filter((name) => !isNonResourceName(name));
  if (headingNames.length && key !== "customForms") return unique(headingNames);

  const tableNames = [];
  for (const table of parseMarkdownTables(section)) {
    const nameHeader = tableHeaders.find((header) => table.headers.includes(header));
    if (!nameHeader) continue;
    for (const row of table.rows) {
      const name = cleanResourceName(row[nameHeader]);
      if (!isNonResourceName(name)) tableNames.push(name);
    }
  }
  if (key === "dashboards") {
    for (const match of section.matchAll(/^-\s*Page name:\s*(.+?)\s*$/gim)) {
      const name = cleanResourceName(match[1]);
      if (!isNonResourceName(name)) tableNames.push(name);
    }
  }
  return unique(tableNames);
}

function collectNavigationItemsByGroup(section) {
  const byGroup = {};
  for (const table of parseMarkdownTables(section)) {
    if (!table.headers.includes("Group") || !table.headers.includes("Item")) continue;
    for (const row of table.rows) {
      const group = cleanResourceName(row.Group);
      const item = cleanResourceName(row.Item || row["Target Resource"]);
      const target = cleanResourceName(row["Target Resource"] || item);
      const type = cleanResourceName(row["Yeeflow Resource Type"] || row.Type || "");
      if (!group || !item || isNonResourceName(group) || isNonResourceName(item)) continue;
      if (!byGroup[group]) byGroup[group] = [];
      byGroup[group].push({ title: item, target: target || item, type });
    }
  }
  return byGroup;
}

function fieldSpecsForList(planDemand, listName) {
  const specs = planDemand.dataListFieldSpecs?.[normKey(listName)] || [];
  const normalized = [];
  const seen = new Set();
  const add = (field) => {
    const fieldName = cleanResourceName(field.fieldName || field.displayName || "Title");
    const displayName = cleanResourceName(field.displayName || fieldName);
    const key = normKey(fieldName || displayName);
    if (!fieldName || seen.has(key)) return;
    seen.add(key);
    normalized.push({
      displayName,
      fieldName,
      fieldType: cleanResourceName(field.fieldType) || "Text",
      controlType: cleanResourceName(field.controlType) || inferControlType(field.fieldType),
      choiceValues: cleanResourceName(field.choiceValues),
    });
  };
  add({ displayName: "Title", fieldName: "Title", fieldType: "Text", controlType: "input" });
  for (const spec of specs) add(spec);
  return normalized.slice(0, 16);
}

function assignCustomFormLayoutPositions(planDemand, dataListNames) {
  const listIndexByName = new Map(dataListNames.map((name, index) => [normKey(name), index]));
  const offsetsByList = new Map();
  return (planDemand.customFormRecords || [])
    .map((record) => {
      const listIndex = listIndexByName.has(normKey(record.listName)) ? listIndexByName.get(normKey(record.listName)) : 0;
      const next = (offsetsByList.get(listIndex) || 0) + 1;
      offsetsByList.set(listIndex, next);
      return { ...record, listIndex, layoutIndex: next };
    });
}

function buildFieldRecord({ field, fieldIndex, listId, fieldId }) {
  const fieldType = normalizeFieldType(field.fieldType);
  const type = controlTypeForFieldType(field, fieldType);
  const isTitle = fieldIndex === 0 || field.fieldName === "Title";
  const fieldName = isTitle ? "Title" : `${fieldType}${fieldIndex}`;
  const rules = buildFieldRules({ field, type });
  return {
    FieldID: fieldId,
    ListID: listId,
    FieldName: fieldName,
    FieldType: fieldType,
    FieldIndex: fieldIndex,
    DisplayName: field.displayName,
    InternalName: fieldName,
    Type: type,
    Status: isTitle ? 0 : 1,
    Category: 0,
    DefaultValue: defaultValueForFieldType(fieldType),
    Rules: rules,
    IsSort: false,
    IsSystem: isTitle,
    IsUnique: false,
    IsIndex: isTitle,
    Ext1: "",
    Ext2: "",
    Ext3: "",
  };
}

function controlTypeForFieldType(field, fieldType) {
  if (fieldType === "Bit") return "switch";
  return normalizeControlType(field.controlType || field.fieldType);
}

function defaultValueForFieldType(fieldType) {
  return fieldType === "Bit" ? "0" : "";
}

function buildCustomFormLayout({ layoutId, listId, listName, formName, formType = "", fields }) {
  const templateKind = /\bview\b|detail/i.test(`${formType} ${formName}`) ? "view" : "newEdit";
  const templateId = templateKind === "view" ? "data_list_form_layout_view_item_v1_1" : "data_list_form_layout_new_edit_v1_1";
  const resource = materializeDataListFormResource({ templateKind, templateId, listId, listName, formName, fields });
  return {
    ListID: listId,
    LayoutID: layoutId,
    Title: formName,
    Type: 1,
    LayoutView: JSON.stringify({ source: "minimal-resource-graph", formName, listName }),
    IsDefault: false,
    IsItemPerm: false,
    Perms: [],
    LayoutInResources: [
      {
        ID: layoutId,
        RefId: layoutId,
        Resource: JSON.stringify(resource),
      },
    ],
  };
}

function materializeDataListFormResource({ templateKind, templateId, listId, listName, formName, fields }) {
  const templateFile = DATA_LIST_FORM_TEMPLATE_PATHS[templateKind];
  const template = JSON.parse(fs.readFileSync(templateFile, "utf8"));
  const resource = clone(template.templateResource);
  resource.derivedFromDataListFormLayoutTemplate = templateId;
  resource.dataListFormLayoutTemplateId = templateId;
  resource.title = formName;
  removeOperationsWithoutActions(resource);
  setTemplateText(resource, "section_title_text", formName);
  setTemplateText(resource, "section_title_description", templateKind === "view" ? `Review ${listName} details and related context.` : `Capture and maintain ${listName} item details.`);
  if (templateKind === "view") {
    setTemplateText(resource, "page_title_text", formName);
    setTemplateText(resource, "page_title_description", `View ${listName} record details and related operational context.`);
  }
  const slot = findBusinessSectionContentArea(resource);
  if (slot) {
    slot.children = [buildDataListFormFieldsGrid({ fields: fields.slice(0, 12), formName, listId, listName, templateKind })];
  }
  return resource;
}

function buildDataListFormFieldsGrid({ fields, formName, listId, listName, templateKind }) {
  const template = JSON.parse(fs.readFileSync(DATA_LIST_FORM_FIELDS_GRID_TEMPLATE_PATH, "utf8"));
  const wrapper = clone(template._ak_c || template.templateResource || template);
  wrapper.id = "form_grid_fields_wrapper";
  wrapper.nv_label = "form_grid_fields_wrapper";
  wrapper.dataListFormFieldsTemplateId = "data_list_form_fields_grid_v1_1";
  wrapper.derivedFromDataListFormFieldsTemplate = "data_list_form_fields_grid_v1_1";
  wrapper.children = fields.map((field, index) => buildDataListFormFieldControl({ field, index, formName, listId, listName, templateKind }));
  return wrapper;
}

function buildDataListFormFieldControl({ field, index, formName, listId, listName, templateKind }) {
  const type = templateKind === "view" && !isSubListFormField(field) ? dynamicControlTypeForField(field) : normalizeControlType(field.Type || field.FieldType || field.DisplayName);
  if (isSubListFormField(field, type)) {
    return buildDataListFormSubListControl({ field, index, formName, listId, listName });
  }
  const fullRow = isFullRowFormField(field, type);
  const control = {
    type,
    id: `${slugify(formName)}_${slugify(field.FieldName)}_${index + 1}`,
    name: field.DisplayName,
    title: field.DisplayName,
    label: field.DisplayName,
    nv_label: fieldNavLabel(field),
    binding: field.FieldName,
    fieldID: field.FieldID,
    displayLabel: [null, true],
    attrs: {
      common: {
        margin: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }],
      },
      data: {
        list: { AppID: 41, ListID: stringId(listId), Type: 1, Title: listName },
        field: field.FieldName,
        fieldName: field.FieldName,
        fieldId: field.FieldID,
      },
    },
  };
  if (fullRow) {
    control.attrs.common.grid = { position: [null, { cSpan: 2 }, null, { cSpan: 1 }] };
  }
  return control;
}

function buildDataListFormSubListControl({ field, index, formName, listId, listName }) {
  const template = JSON.parse(fs.readFileSync(DATA_LIST_FORM_SUBLIST_TEMPLATE_PATH, "utf8"));
  const control = clone(template._ak_c || template.templateResource || template);
  const id = `${slugify(formName)}_${slugify(field.FieldName)}_${index + 1}`;
  control.id = id;
  control.name = field.DisplayName;
  control.title = field.DisplayName;
  control.label = field.DisplayName;
  control.nv_label = fieldNavLabel(field);
  control.binding = field.FieldName;
  control.fieldID = field.FieldID;
  control.dataListFormControlTemplateId = "data_list_form_control_sublist_v1_1";
  control.derivedFromDataListFormControlTemplate = "data_list_form_control_sublist_v1_1";
  control.attrs ||= {};
  control.attrs.common ||= {};
  control.attrs.common.margin = [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }];
  control.attrs.common.grid = { position: [null, { cSpan: 2 }, null, { cSpan: 1 }] };
  control.attrs.data = {
    list: { AppID: 41, ListID: stringId(listId), Type: 1, Title: listName },
    field: field.FieldName,
    fieldName: field.FieldName,
    fieldId: field.FieldID,
  };
  for (const listField of Array.isArray(control.attrs["list-fields"]) ? control.attrs["list-fields"] : []) {
    if (listField?.control?.attrs) {
      listField.control.attrs.list_field_binding = field.FieldName;
      listField.control.attrs.list_control_id = id;
    }
  }
  return control;
}

function isFullRowFormField(field, controlType) {
  const raw = normKey(`${field?.DisplayName || ""} ${field?.FieldType || ""} ${field?.Type || ""} ${controlType || ""}`);
  return /textarea|multi line|multiline|richtext|rich text|sub list|sublist|\blist\b/.test(raw);
}

function isSubListFormField(field, controlType = "") {
  const raw = normKey(`${field?.DisplayName || ""} ${field?.FieldType || ""} ${field?.Type || ""} ${controlType || ""}`);
  return /sub list|sublist|\blist\b/.test(raw);
}

function fieldNavLabel(field) {
  return `field_${slugify(field?.FieldName || field?.DisplayName || "field")}`.replace(/-/g, "_");
}

function buildFieldRules({ field, type }) {
  const choiceTypes = new Set(["select", "radio", "checkbox", "tag"]);
  if (!choiceTypes.has(type)) return "";
  const values = String(field.choiceValues || "")
    .split(/[,;]+/)
    .map((value) => value.trim())
    .filter(Boolean);
  if (!values.length) return "";
  const colors = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];
  const choices = values.map((value, index) => ({
    key: String(index + 1),
    value,
    color: colors[index % colors.length],
  }));
  return JSON.stringify({
    choices,
    color_choices: choices,
    displayStyle: "dropdown",
    show_color: false,
  });
}

function selectDashboardFiltersForPage({ planDemand, pageName, datasetRecord, fallbackListName }) {
  const records = planDemand.dashboardFilterRecords || [];
  const pageMatches = records.filter((record) => dashboardNameMatches(pageName, record.dashboardPage));
  if (pageMatches.length) return pageMatches;
  const sourceName = datasetRecord?.sourceResource || fallbackListName;
  return records.filter((record) => !record.dashboardPage && (!record.sourceResource || normKey(record.sourceResource) === normKey(sourceName)));
}

function dashboardNameMatches(pageName, plannedPageName) {
  if (!plannedPageName) return false;
  const left = normKey(pageName);
  const right = normKey(plannedPageName);
  return left === right || left.includes(right) || right.includes(left);
}

function parseMarkdownTables(section) {
  const lines = section.split(/\r?\n/);
  const tables = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const rows = [];
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const row = {};
      headers.forEach((header, cellIndex) => { row[header] = cells[cellIndex] || ""; });
      rows.push(row);
      rowIndex += 1;
    }
    tables.push({ headers, rows });
    index = rowIndex;
  }
  return tables;
}

function isTableLine(line) {
  return /^\s*\|.+\|\s*$/.test(line || "");
}

function splitTableLine(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cleanResourceName(cell));
}

function unique(values) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function cleanResourceName(value) {
  return String(value || "").replace(/`/g, "").replace(/\*\*/g, "").trim();
}

function isNonResourceName(value) {
  const text = cleanResourceName(value);
  if (!text) return true;
  if (/^(not applicable|n\/a|none|no|deferred|status|resource type|purpose|notes?|owner|used by|actions?|fields?)$/i.test(text)) return true;
  if (/^no custom\b/i.test(text)) return true;
  if (/^(dashboard page name|page name|list name|form name|group|item|section|metric name|filter name)$/i.test(text)) return true;
  return false;
}

function buildDecodedPackage({ appTitle, rootListId, dashboardLayoutId, layoutResourceId, layoutResourceRefId, iconUrl = DEFAULT_ICON }) {
  return {
    ListSet: listInfo({ listId: rootListId, title: appTitle, type: 1024, ext2: "{\"src\":true}", iconUrl }),
    Pages: [
      {
        ListID: rootListId,
        LayoutID: dashboardLayoutId,
        Type: 103,
        Title: "Getting Started Dashboard",
        LayoutView: null,
        Ext2: "{\"src\":true}",
        IsDefault: true,
        IsItemPerm: false,
        LayoutInResources: [
          {
            ID: layoutResourceId,
            RefId: layoutResourceRefId,
            Resource: JSON.stringify({
              id: "Main",
              type: "container",
              title: "Main",
              attrs: { container: { cw: "2", padding: ["--sp--s0", "--sp--s0", "--sp--s0", "--sp--s0"] } },
              children: [
                {
                  id: "Content",
                  type: "container",
                  title: "Content",
                  attrs: { container: { cw: "2", padding: ["--sp--s0", "--sp--s0", "--sp--s0", "--sp--s0"] } },
                  children: [
                    {
                      id: "generated_final_placeholder_notice",
                      type: "text",
                      title: "Generated-final materialization placeholder",
                      attrs: { text: { value: "Generated-final package materialized from approved planning artifacts." } },
                    },
                  ],
                },
              ],
            }),
          },
        ],
      },
    ],
    Forms: [],
    FormNewReports: [],
    DataReports: [],
    PortalInfo: null,
    Groups: [],
    Tags: [],
    Metadatas: [],
    Agents: [],
    Connections: [],
    Knowledges: [],
    Themes: [],
    Components: [],
    Childs: [],
  };
}

function buildResourceGraphPackage({ appTitle, rootListId, planDemand, ids, iconUrl = DEFAULT_ICON }) {
  const dataListNames = planDemand.resources.dataLists.length ? planDemand.resources.dataLists : [`${appTitle} Records`];
  const dataListByName = new Map();
  const listMetaByName = new Map();
  const customFormAssignments = assignCustomFormLayoutPositions(planDemand, dataListNames);
  const assignedFormNames = new Set(customFormAssignments.map((assignment) => normKey(assignment.formName)));
  const fallbackCustomForms = planDemand.resources.customForms
    .filter((name) => !assignedFormNames.has(normKey(name)))
    .map((formName, index) => ({ listName: dataListNames[0], formName, formType: "", listIndex: 0, layoutIndex: index + 1 }));
  const allCustomFormAssignments = customFormAssignments.concat(fallbackCustomForms);
  const childs = dataListNames.map((name, index) => {
    const listId = stringId(ids[`decoded.Childs[${index}].List.ListID`]);
    dataListByName.set(normKey(name), listId);
    const fieldSpecs = fieldSpecsForList(planDemand, name);
    const fields = fieldSpecs.map((field, fieldIndex) => buildFieldRecord({
      field,
      fieldIndex,
      listId,
      fieldId: stringId(ids[`decoded.Childs[${index}].Fields[${fieldIndex}].FieldID`]),
    }));
    const customLayoutsForList = allCustomFormAssignments.filter((assignment) => assignment.listIndex === index);
    const layouts = [
      {
        ListID: listId,
        LayoutID: stringId(ids[`decoded.Childs[${index}].Layouts[0].LayoutID`]),
        Title: "Default View",
        Type: 0,
        LayoutView: JSON.stringify({
          layout: fields.slice(0, 8).map((field, fieldIndex) => ({
            FieldID: field.FieldID,
            FieldName: field.FieldName,
            DisplayName: field.DisplayName,
            Type: field.Type,
            Order: fieldIndex + 1,
            Mobile: 2,
            Show: true,
          })),
          query: [
            ...fields.map((field) => ({ FieldID: field.FieldID, FieldName: field.FieldName, field: field.FieldName })),
            { FieldName: "ListDataID", field: "ListDataID" },
            { FieldName: "CreatedBy", field: "CreatedBy" },
            { FieldName: "ModifiedBy", field: "ModifiedBy" },
            { FieldName: "Created", field: "Created" },
            { FieldName: "Modified", field: "Modified" },
          ],
        }),
        Ext1: JSON.stringify({ Url: "default" }),
        IsDefault: true,
        IsItemPerm: false,
        Perms: [],
        LayoutInResources: [],
      },
    ];
    for (const assignment of customLayoutsForList) {
      const layoutId = stringId(ids[`decoded.Childs[${assignment.listIndex}].Layouts[${assignment.layoutIndex}].LayoutID`]);
      layouts.push(buildCustomFormLayout({ layoutId, listId, listName: name, formName: assignment.formName, formType: assignment.formType, fields }));
    }
    const detailLayoutId = customLayoutsForList.length
      ? stringId(ids[`decoded.Childs[${index}].Layouts[${customLayoutsForList[0].layoutIndex}].LayoutID`])
      : "";
    listMetaByName.set(normKey(name), { listName: name, listId, fields, detailLayoutId });
    return {
      List: listInfo({ listId, title: name, type: 1, ext2: "{\"generatedFinal\":true}" }),
      Fields: fields,
      Layouts: layouts,
      RemindRules: [],
      PublicForms: [],
      FlowMappings: [],
    };
  });

  const forms = planDemand.resources.approvalForms.map((name, index) => {
    const key = stringId(ids[`decoded.Forms[${index}].Key`]);
    const defId = stringId(ids[`decoded.Forms[${index}].DefResourceID`]);
    return {
      Category: "",
      Name: name,
      Key: key,
      IsItemPerm: false,
      AppID: 41,
      ListID: 0,
      ProcModelID: defId,
      Description: "",
      Ext: "",
      DefResourceID: defId,
      DefResource: exportResource(buildApprovalDefResource({ name, formKey: key, defId })),
      Status: 1,
      DeployedDefID: defId,
      WorkflowType: 2,
      Settings: JSON.stringify({
        taskurl: `${defId}_task`,
        actions: [
          { name: "Submit", type: "form_action" },
          { name: "Approve", type: "form_action" },
          { name: "Reject", type: "form_action" },
        ],
      }),
      Deployed: true,
      NoRule: { Prefix: "REQ-{index}", StartIndex: 1, CustomLength: 4, AutoIncrement: 1 },
      Perms: [],
    };
  });

  const formNewReports = planDemand.resources.formReports.map((name, index) => ({
    ID: stringId(ids[`decoded.FormNewReports[${index}].ID`]),
    DefKey: forms[0]?.Key || "",
    Name: name,
    Description: "",
    Attr: "",
    Settings: JSON.stringify({
      Fields: ["Title"],
      Source: forms[0]?.Title || "Approval Forms",
    }),
  }));

  const pages = planDemand.resources.dashboards.map((name, index) => {
    const datasetRecord = selectDashboardDatasetRecord({ planDemand, pageName: name, pageIndex: index });
    const firstListName = datasetRecord?.sourceResource || dataListNames[index % dataListNames.length];
    const firstListMeta = listMetaByName.get(normKey(firstListName)) || listMetaByName.values().next().value || { listName: firstListName, listId: rootListId, fields: fieldSpecsForList(planDemand, firstListName), detailLayoutId: "" };
    const firstListId = firstListMeta.listId || dataListByName.get(normKey(firstListName)) || dataListByName.values().next().value || rootListId;
    const dashboardFilters = selectDashboardFiltersForPage({ planDemand, pageName: name, datasetRecord, fallbackListName: firstListName });
    return {
      ListID: rootListId,
      LayoutID: stringId(ids[`decoded.Pages[${index}].LayoutID`]),
      Type: 103,
      Title: name,
      LayoutView: null,
      Ext2: JSON.stringify({ src: true, generatedFinal: true }),
      IsDefault: index === 0,
      IsItemPerm: false,
      LayoutInResources: [
        {
          ID: stringId(ids[`decoded.Pages[${index}].LayoutID`]),
          RefId: stringId(ids[`decoded.Pages[${index}].LayoutID`]),
            Resource: JSON.stringify(buildMaterialDashboardResource({
              name,
              layoutId: stringId(ids[`decoded.Pages[${index}].LayoutID`]),
              listName: firstListName,
              listId: firstListId,
              listMeta: firstListMeta,
            datasetRecord,
            dashboardFilters,
            summaryId: `${stringId(ids[`decoded.Pages[${index}].LayoutID`])}_summary`,
            filterId: `${stringId(ids[`decoded.Pages[${index}].LayoutID`])}_filter`,
            collectionId: `${stringId(ids[`decoded.Pages[${index}].LayoutID`])}_collection`,
          })),
        },
      ],
    };
  });

  return {
    ListSet: {
      ...listInfo({ listId: rootListId, title: appTitle, type: 1024, ext2: "{\"generatedFinal\":true}", iconUrl }),
      LayoutView: buildNavigationLayoutView({ planDemand, rootListId, ids, dataListByName, forms, pages }),
    },
    Pages: pages,
    Forms: forms,
    FormNewReports: formNewReports,
    DataReports: [],
    PortalInfo: null,
    Groups: [],
    Tags: [],
    Metadatas: [],
    Agents: [],
    Connections: [],
    Knowledges: [],
    Themes: [],
    Components: [],
    Childs: childs,
  };
}

function selectDashboardDatasetRecord({ planDemand, pageName, pageIndex }) {
  const records = planDemand.dashboardDatasetRecords || [];
  if (!records.length) return null;
  return records.find((record) => normKey(record.dashboardPage) && (normKey(pageName).includes(normKey(record.dashboardPage)) || normKey(record.dashboardPage).includes(normKey(pageName))))
    || records[pageIndex % records.length]
    || records[0];
}

function buildMaterialDashboardResource({ name, layoutId, listName, listId, listMeta, datasetRecord, dashboardFilters, summaryId, filterId, collectionId }) {
  const tempVar = `tmp_${slugify(name).replace(/-/g, "_")}_count`;
  const kpiContracts = buildDashboardKpiContracts({ pageName: name, summaryIdBase: summaryId, primaryTempVar: tempVar });
  const resource = buildDashboardV11Shell({ name, layoutId });
  const sourceResource = datasetRecord?.sourceResource || listName;
  const selectedTemplateId = datasetRecord?.selectedTemplateId || "collection_control_grid_table";
  const datasetRegion = datasetRecord?.datasetRegion || `${sourceResource} records`;
  const sourceListMeta = listMeta || { listName: sourceResource, listId, fields: [{ fieldName: "Title", displayName: "Title", fieldType: "Text", controlType: "input" }], detailLayoutId: "" };
  const normalizedFilters = normalizeDashboardFilters({ filters: dashboardFilters, listMeta: sourceListMeta, dashboardName: name });
  const collectionRoot = buildCollectionTemplateInstance({
    templateId: selectedTemplateId,
    dashboardName: name,
    datasetRegion,
    listName: sourceResource,
    listId,
    listMeta: sourceListMeta,
    detailLayoutId: sourceListMeta.detailLayoutId,
    filterBindings: normalizedFilters,
    collectionId,
  });
  const templateDependencies = collectionRoot.pageLevelDependencies || {};
  const contentArea = findBusinessSectionContentArea(resource);
  if (contentArea) {
    contentArea.datasetRegion = datasetRegion;
    contentArea.datasetRegionName = datasetRegion;
    contentArea.attrs = {
      ...(contentArea.attrs || {}),
      datasetRegion,
      datasetRegionName: datasetRegion,
      appPlanDatasetRegion: datasetRegion,
    };
    contentArea.children = [collectionRoot];
  }
  const summaries = kpiContracts.map((contract) => buildSummaryControl({
    summaryId: contract.summaryId,
    tempVar: contract.tempVar,
    listName: sourceResource,
    listId,
    label: contract.label,
  }));
  const summaryHostParent = contentArea || findFirstByIdentity(resource, "Content") || resource;
  summaryHostParent.children = Array.isArray(summaryHostParent.children) ? summaryHostParent.children : [];
  summaryHostParent.children.push(buildHiddenSummaryHost({ dashboardName: name, summaries }));
  materializeDashboardFilters(resource, {
    filters: normalizedFilters,
    listName: sourceResource,
    listId,
    filterIdPrefix: filterId,
    datasetRegion,
    host: contentArea,
  });
  applyDashboardTextMapping(resource, { name, datasetRegion, listName: sourceResource, kpiContracts });
  resource.filterVars = uniqueByName([
    ...normalizeDependencyArray(templateDependencies.filterVars),
    ...normalizedFilters.map((filter) => ({ name: filter.variable, type: "text", source: filter.controlId })),
  ]);
  resource.tempVars = uniqueByName([
    ...normalizeDependencyArray(templateDependencies.tempVars),
    ...kpiContracts.map((contract) => ({
      id: `__temp_${contract.tempVar}`,
      name: contract.tempVar,
      type: "number",
      source: contract.summaryId,
      kpiKey: contract.key,
    })),
    { name: "var_SelectedItems", type: "array", source: collectionId },
    { name: "var_SelectedItemsAmount", type: "number", source: collectionId },
    { name: "var_isDeleteConfirmed", type: "boolean", source: "delete-confirmation" },
  ]);
  resource.ReportIds = kpiContracts.map((contract) => contract.summaryId);
  resource.exts = kpiContracts.map((contract) => ({
    i: contract.summaryId,
    id: contract.summaryId,
    category: "___Pivot___",
    key: "summary",
    attr: {
      ListID: stringId(listId),
      settings: {
        values: [{ fieldName: "ListDataID", field: "ListDataID", id: "ListDataID", func: "COUNT", label: contract.label }],
      },
    },
  }));
  resource.actions = normalizeDependencyArray(templateDependencies.actions);
  resource.formAction = normalizeDependencyArray(templateDependencies.formAction);
  resource.LayoutID = layoutId;
  resource.plannedControls = { kpis: true, gridTable: true };
  resource.generatedFinalDashboardMaterialization = {
    shellTemplate: PAGE_LAYOUT_TEMPLATE_ID,
    datasetRegion,
    selectedCollectionTemplateId: selectedTemplateId,
    sourceResource,
    filters: normalizedFilters.map((filter) => ({ name: filter.filterName, fieldName: filter.fieldName })),
  };
  normalizeGeneratedDashboardControls(resource, name);
  removeEmptyBusinessSections(resource);
  return resource;
}

function buildDashboardKpiContracts({ pageName, summaryIdBase, primaryTempVar }) {
  const pageSlug = slugify(pageName).replace(/-/g, "_");
  const specs = [
    ["planned_events", "Active Records"],
    ["approved_budget", "Approved Records"],
    ["registration_rate", "Completion Signal"],
    ["lead_follow_up", "Follow-up Queue"],
  ];
  return specs.map(([key, label], index) => {
    const tempVar = index === 0 ? primaryTempVar : `tmp_${pageSlug}_${key}_count`;
    const summaryId = index === 0 ? summaryIdBase : `${summaryIdBase}_${key}`;
    return { key, label, tempVar, summaryId };
  });
}

function normalizeDashboardFilters({ filters, listMeta, dashboardName }) {
  return (filters || []).map((filter, index) => {
    const field = resolveFieldSpec(listMeta, filter.fieldDisplayName) || resolveFieldSpec(listMeta, "Title") || fieldsForDynamicControls(listMeta)[0];
    const variable = `flt_${slugify(dashboardName).replace(/-/g, "_")}_${slugify(filter.filterName || field.displayName).replace(/-/g, "_")}`;
    return {
      ...filter,
      fieldName: field.fieldName,
      displayName: field.displayName,
      variable,
      controlId: `${variable}_${index + 1}`,
    };
  });
}

function materializeDashboardFilters(resource, { filters, listName, listId, filterIdPrefix, datasetRegion, host }) {
  if (!filters.length) return;
  const filterGroup = host || findFirstByIdentity(resource, "section_content_area") || findFirstByIdentity(resource, "Content") || resource;
  filterGroup.children = Array.isArray(filterGroup.children) ? filterGroup.children : [];
  for (const [index, filter] of filters.entries()) {
    filterGroup.children.unshift(buildDashboardSelectFilter({
      filter,
      listName,
      listId,
      id: `${filterIdPrefix}_${index + 1}`,
      datasetRegion,
    }));
  }
}

function buildDashboardSelectFilter({ filter, listName, listId, id, datasetRegion }) {
  return {
    type: "select-filter",
    id,
    name: filter.filterName,
    title: filter.filterName,
    label: filter.filterName,
    binding: filter.variable,
    attrs: {
      nv_label: filter.filterName,
      nav_label: filter.filterName,
      display_f: filter.fieldName,
      value_f: filter.fieldName,
      lablay: [null, "top"],
      lab: { value: filter.filterName, ty: [null, "xs-light"], color: "#667085" },
      edit: {
        pcolor: "#98A2B3",
        placeholder: { color: "#98A2B3" },
        normal: { border: { radius: [null, 8] } },
      },
      placeholder: { value: `Select ${filter.filterName}` },
      common: {
        positioning: {
          widthtype: [null, "3"],
          width: [null, 200],
        },
      },
      data: {
        list: { AppID: 41, ListID: stringId(listId), Type: 1, Title: listName },
        field: filter.fieldName,
        displayField: filter.fieldName,
        valueField: filter.fieldName,
        filter: [{ field: filter.fieldName, operator: "not_empty", value: "{{ListDataID}}" }],
        datasetRegion,
      },
      filterVar: filter.variable,
    },
  };
}

function buildCollectionFilterConditions(filters) {
  return (filters || []).map((filter) => ({
    key: `filter_${slugify(filter.variable)}`,
    pre: "and",
    left: filter.fieldName,
    field: filter.fieldName,
    op: "9",
    operator: "9",
    right: [{ exprType: "variable", valueType: "string", id: `__filter_${filter.variable}`, type: "expr", name: filter.variable }],
    showCus: false,
    sourceFilterId: filter.controlId,
  }));
}

function buildDashboardV11Shell({ name }) {
  const registry = JSON.parse(fs.readFileSync(DASHBOARD_V11_TEMPLATE_PATH, "utf8"));
  const template = registry.templates?.find((item) => item?.id === PAGE_LAYOUT_TEMPLATE_ID) || registry.templates?.[0];
  const resource = clone(template?.template?.parsedResource || {});
  resource.id = `${slugify(name)}_dashboard_v11_root`;
  resource.name = name;
  resource.title = name;
  resource.ver = "1.0.0";
  resource.derivedFromGoldenReference = DASHBOARD_GOLDEN_REFERENCE_ID;
  resource.goldenReferenceId = DASHBOARD_GOLDEN_REFERENCE_ID;
  resource.templateMarker = PAGE_LAYOUT_TEMPLATE_ID;
  resource.derivedFromDashboardPageLayoutTemplate = PAGE_LAYOUT_TEMPLATE_ID;
  resource.attrs = {
    ...(resource.attrs || {}),
    derivedFromGoldenReference: DASHBOARD_GOLDEN_REFERENCE_ID,
    templateMarker: PAGE_LAYOUT_TEMPLATE_ID,
    dashboardPageLayoutTemplateId: PAGE_LAYOUT_TEMPLATE_ID,
  };
  removeOperationsWithoutActions(resource);
  return resource;
}

function summarySaveVariable(tempVar) {
  return {
    exprType: "variable",
    valueType: "string",
    id: `__temp_${tempVar}`,
    type: "expr",
    name: tempVar,
  };
}

function buildSummaryFieldMetadata() {
  return {
    FieldID: "ListDataID",
    FieldName: "ListDataID",
    InternalName: "ListDataID",
    DisplayName: "Record ID",
    FieldType: "Text",
    Type: "text",
    IsSystem: true,
    IsIndex: true,
    Status: 0,
  };
}

function buildHiddenSummaryHost({ dashboardName, summaries }) {
  return {
    type: "container",
    id: `${slugify(dashboardName)}_kpi_data_host`,
    name: "KPI data host",
    title: "KPI data host",
    attrs: {
      nv_label: "KPI data host",
      common: { hide: [null, true, true, true] },
      style: {
        direction: [null, "row"],
        widthtype: [null, "1"],
        gap: [null, 0],
        align_items: [null, "center"],
        justify_content: [null, "flex-start"],
      },
      display: { rule: "1 == 0" },
    },
    children: summaries,
  };
}

function buildSummaryControl({ summaryId, tempVar, listName, listId, label = "Active Records" }) {
  const saveVariable = summarySaveVariable(tempVar);
  const fieldMetadata = buildSummaryFieldMetadata();
  return {
    type: "summary",
    id: summaryId,
    name: `${label} Summary`,
    title: `${label} Summary`,
    runtimeModelProven: true,
    attrs: {
      runtimeModelProven: true,
      control_display: { hidden: true },
      data: {
        list: { AppID: 41, ListID: stringId(listId), Type: 1, Title: listName },
        aggregation: "COUNT",
        field: fieldMetadata,
        fieldName: "ListDataID",
        fieldObject: fieldMetadata,
        fieldInfo: fieldMetadata,
      },
      field: fieldMetadata,
      fieldObject: fieldMetadata,
      fieldInfo: fieldMetadata,
      allowAllRecords: true,
      save_var: saveVariable,
    },
    save_var: saveVariable,
  };
}

function buildCollectionTemplateInstance({ templateId, dashboardName, datasetRegion, listName, listId, listMeta, detailLayoutId, filterBindings, collectionId }) {
  const template = loadCollectionTemplate(templateId);
  const root = clone(template?.templateResource?.rootContainer || {});
  root.id = `${collectionId}_${slugify(templateId)}_wrapper`;
  root.name = datasetRegion;
  root.datasetRegion = datasetRegion;
  root.datasetRegionName = datasetRegion;
  root.appPlanDatasetRegion = datasetRegion;
  root.datasetPresentationTemplateId = templateId;
  root.derivedFromDatasetPresentationTemplate = templateId;
  root.attrs = {
    ...(root.attrs || {}),
    datasetRegion,
    datasetRegionName: datasetRegion,
    appPlanDatasetRegion: datasetRegion,
    datasetPresentationTemplateId: templateId,
    derivedFromDatasetPresentationTemplate: templateId,
  };
  if (GRID_TABLE_TEMPLATE_IDS.has(templateId)) enforceGridWrapperGap(root);
  const collection = findFirstByType(root, "collection");
  if (collection) {
    if (GRID_TABLE_TEMPLATE_IDS.has(templateId)) enforceContainerGap(findParent(root, collection));
    const filterConditions = buildCollectionFilterConditions(filterBindings);
    const detailLink = detailLayoutId || "";
    collection.id = collectionId;
    collection.name = `${datasetRegion} Collection`;
    collection.title = `${datasetRegion} Collection`;
    collection.datasetRegion = datasetRegion;
    collection.datasetPresentationTemplateId = templateId;
    collection.derivedFromDatasetPresentationTemplate = templateId;
    collection.attrs = {
      ...(collection.attrs || {}),
      datasetPresentationTemplateId: templateId,
      derivedFromDatasetPresentationTemplate: templateId,
      templateId,
      sourceResourceType: "Data list",
      data: {
        ...(collection.attrs?.data || {}),
        list: { AppID: 41, ListID: stringId(listId), Type: 1, Title: listName },
        source: listName,
        sourceResourceType: "Data list",
        datasetRegion,
        datasetPresentationTemplateId: templateId,
        field: primaryFieldName(listMeta),
        filter: [{ field: primaryFieldName(listMeta), operator: "contains", value: "{{search}}" }, ...filterConditions],
        fulltext: [{ field: primaryFieldName(listMeta), value: "{{search}}" }],
        link: detailLink || collection.attrs?.data?.link || "",
        opentype: detailLink ? "slide" : (collection.attrs?.data?.opentype || "slide"),
        modalsize: detailLink ? 2 : (collection.attrs?.data?.modalsize ?? 2),
        filterBindings: filterBindings.map((filter) => ({ name: filter.variable, id: `__filter_${filter.variable}`, field: filter.fieldName, sourceFilterId: filter.controlId })),
      },
      actions: ensureCollectionActions(collection.attrs?.actions),
      layout: {
        ...(collection.attrs?.layout || {}),
        col: collection.attrs?.layout?.col || [null, { desktop: 3, tablet: 2, mobile: 1 }],
      },
    };
  }
  if (collection && detailLayoutId) {
    collection.attrs.data.link = detailLayoutId;
    collection.attrs.data.opentype = "slide";
    collection.attrs.data.modalsize = 2;
  }
  const bindableFields = fieldsForDynamicControls(listMeta);
  let dynamicIndex = 0;
  for (const control of findDescendants(root, (node) => String(node?.type || "").startsWith("dynamic-"))) {
    const field = bindableFields[dynamicIndex % bindableFields.length] || bindableFields[0];
    dynamicIndex += 1;
    control.attrs = {
      ...(control.attrs || {}),
      data: {
        ...(control.attrs?.data || {}),
        ListID: stringId(listId),
        list: { AppID: 41, ListID: stringId(listId), Type: 1, Title: listName },
        field: field.fieldName,
        fieldName: field.fieldName,
      },
      field: field.fieldName,
      fieldName: field.fieldName,
    };
    control.name = field.displayName;
    control.title = field.displayName;
  }
  for (const search of findDescendants(root, (node) => String(node?.type || "") === "search-filter")) {
    search.attrs = {
      ...(search.attrs || {}),
      placeholder: { value: `Search ${listName}` },
      data: {
        ...(search.attrs?.data || {}),
        list: { AppID: 41, ListID: stringId(listId), Type: 1, Title: listName },
        field: primaryFieldName(listMeta),
      },
    };
  }
  if (templateId === "collection_control_grid_table_with_multiselect") {
    enforceFullWidth(root, ["grid_table_col_multiselect_wrapper", "grid_table_col_caption", "grid_table_col_content"]);
  }
  if (templateId === "collection_control_responsive_card_grid") {
    removeUnavailableImageControls(root);
  }
  replaceTemplateResidue(root, { datasetRegion, listName });
  setTitleText(root, datasetRegion);
  const pageDependencies = template.pageLevelDependencies || {};
  root.pageLevelDependencies = {
    tempVars: pageDependencies.tempVars || [],
    filterVars: pageDependencies.filterVars || [],
    actions: pageDependencies.actions || [],
    formAction: pageDependencies.formAction || [],
  };
  root.generatedFrom = { dashboardName, templateId, sourceResource: listName };
  return root;
}

function normalizeDependencyArray(value) {
  if (Array.isArray(value)) return clone(value);
  if (value && typeof value === "object") return Object.entries(value).map(([name, config]) => ({ name, ...(config && typeof config === "object" ? config : { value: config }) }));
  return [];
}

function uniqueByName(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = String(item?.name || item?.key || item?.id || JSON.stringify(item));
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function loadCollectionTemplate(templateId) {
  const templatePath = COLLECTION_TEMPLATE_PATHS[templateId] || COLLECTION_TEMPLATE_PATHS.collection_control_grid_table;
  const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));
  if (templateId === "collection_control_grid_table_with_search" || templateId === "Event Pipeline Grid-Table") {
    return { ...template, templateId };
  }
  return template;
}

function ensureCollectionActions(actions) {
  const out = Array.isArray(actions) ? clone(actions) : [];
  const text = JSON.stringify(out);
  if (!/ListDataID/.test(text) || !/__ctx_coll/.test(text) || !out.some((action) => String(action?.type || "") === "coll")) {
    out.push({ type: "coll", name: "Open item", field: "ListDataID", value: "{{__ctx_coll.ListDataID}}", context: "__ctx_coll" });
  }
  if (!/confirm/.test(JSON.stringify(out)) || !/setdatalist/.test(JSON.stringify(out))) {
    out.push({
      type: "coll",
      id: "confirm-delete-current-item",
      name: "Confirm delete current item",
      field: "ListDataID",
      value: "{{__ctx_coll.ListDataID}}",
      context: "__ctx_coll",
      steps: [
        { type: "confirm", saveVar: "var_isDeleteConfirmed" },
        { type: "setdatalist", operation: "remove", condition: "{{var_isDeleteConfirmed}}", keyField: "ListDataID", value: "{{__ctx_coll.ListDataID}}" },
      ],
    });
  }
  return out;
}

function enforceFullWidth(root, identities) {
  for (const identity of identities) {
    const node = findFirstByIdentity(root, identity);
    if (!node) continue;
    node.width = "full";
    node.attrs = node.attrs || {};
    node.attrs.style = { ...(node.attrs.style || {}), widthtype: [null, "1"] };
    node.attrs.common = {
      ...(node.attrs.common || {}),
      positioning: {
        ...(node.attrs.common?.positioning || {}),
        widthtype: [null, "1"],
      },
    };
  }
}

function removeUnavailableImageControls(root) {
  const visit = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => String(child?.type || "") !== "dynamic-image");
    for (const child of node.children) visit(child);
  };
  visit(root);
}

function enforceGridWrapperGap(root) {
  for (const identity of ["grid_table_col_wrapper", "grid_table_col_multiselect_wrapper", "Event Pipeline Grid-Table"]) {
    const node = findFirstByIdentity(root, identity);
    if (!node) continue;
    enforceContainerGap(node);
  }
}

function enforceContainerGap(node) {
  if (!node) return;
  node.attrs = node.attrs || {};
  node.attrs.container = { ...(node.attrs.container || {}), gap: 0 };
  node.attrs.style = { ...(node.attrs.style || {}), gap: [null, 0] };
}

function replaceTemplateResidue(root, { datasetRegion, listName }) {
  const singular = listName.replace(/s$/i, "") || "item";
  const replacements = new Map([
    ["All tasks", datasetRegion],
    ["All tasks - Multiple select", datasetRegion],
    ["Search tasks", `Search ${listName}`],
    ["Search items", `Search ${listName}`],
    ["Search events", `Search ${listName}`],
    ["Add Task", `Add ${singular}`],
    ["Add item", `Add ${singular}`],
    ["Mark as completed", "Update selected items"],
    ["Assignee", "Owner"],
    ["Completion (%)", "Status"],
    ["Progress bar", "Status"],
  ]);
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "string" && replacements.has(value)) node[key] = replacements.get(value);
      else if (value && typeof value === "object") visit(value);
    }
  };
  visit(root);
}

function applyDashboardTextMapping(resource, { name, datasetRegion, listName, kpiContracts }) {
  const pageTitle = findFirstByIdentity(resource, "event_portfolio_title");
  setHeadingText(pageTitle, name);
  const subtitle = findFirstByIdentity(resource, "event_portfolio_subtitle");
  setHeadingText(subtitle, `Operational view for ${listName}.`);
  const sectionTitle = findFirstByIdentity(resource, "section_title_header");
  if (sectionTitle) {
    const titleText = findDescendants(sectionTitle, (node) => String(node?.type || "") === "heading")[0];
    setHeadingText(titleText, datasetRegion);
  }
  for (const contract of kpiContracts || []) {
    const kpiLabel = findFirstByIdentity(resource, `event_portfolio_kpi_${contract.key}_label`);
    setHeadingText(kpiLabel, contract.label);
    const kpiValue = findFirstByIdentity(resource, `event_portfolio_kpi_${contract.key}_value`);
    if (!kpiValue) continue;
    const saveVariable = summarySaveVariable(contract.tempVar);
    setHeadingText(kpiValue, "0");
    kpiValue.attrs = {
      ...(kpiValue.attrs || {}),
      headc: {
        ...(kpiValue.attrs?.headc || {}),
        title: {
          ...(kpiValue.attrs?.headc?.title || {}),
          value: "0",
          variable: [saveVariable],
        },
      },
    };
  }
}

function setTitleText(root, title) {
  for (const id of ["grid_table_col_title", "card_col_title"]) {
    const control = findFirstByIdentity(root, id);
    if (control) setHeadingText(control, title);
  }
}

function setHeadingText(control, value) {
  if (!control) return;
  control.name = value;
  control.title = value;
  control.attrs = {
    ...(control.attrs || {}),
    headc: {
      ...(control.attrs?.headc || {}),
      title: {
        ...(control.attrs?.headc?.title || {}),
        value,
      },
    },
  };
}

function normalizeGeneratedDashboardControls(resource, pageName) {
  let index = 0;
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.type) {
      index += 1;
      const identity = firstMeaningfulIdentity(node);
      if (!identity) node.name = `${pageName} ${node.type} ${index}`;
      else if (isDefaultNavigatorName(node.name) && isDefaultNavigatorName(node.attrs?.nav_label) && isDefaultNavigatorName(node.attrs?.nv_label)) node.name = identity;
      if (String(node.type) === "heading" && String(node.label || "") === "Text") {
        node.attrs = node.attrs || {};
        node.attrs.heads = node.attrs.heads || {};
        if (!Array.isArray(node.attrs.heads.ty) && typeof node.attrs.heads.ty !== "object") node.attrs.heads.ty = [null, "body-medium"];
        if (typeof node.attrs.heads.color !== "string" || !node.attrs.heads.color.trim()) node.attrs.heads.color = "#1f2937";
        node.attrs.headc = node.attrs.headc || {};
        node.attrs.headc.title = node.attrs.headc.title || { value: node.name || pageName };
        if (node.attrs.headc.title.value === undefined && node.attrs.headc.title.variable === undefined) node.attrs.headc.title.value = node.name || pageName;
      }
    }
    for (const child of Array.isArray(node.children) ? node.children : []) visit(child);
  };
  visit(resource);
}

function firstMeaningfulIdentity(control) {
  return identityCandidates(control).find((candidate) => !isDefaultNavigatorName(candidate)) || "";
}

function isDefaultNavigatorName(value) {
  return !value || /^(Container|Grid|Text|Dynamic field|Dynamic user|Kanban|Collection|Button|Summary|Icon|Text Editor)(\s*\d+)?$/i.test(String(value).trim());
}

function removeOperationsWithoutActions(root) {
  const visit = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      if (hasIdentity(child, "Operations") && !hasActionConfiguration(child)) return false;
      visit(child);
      return true;
    });
  };
  visit(root);
}

function removeEmptyBusinessSections(root) {
  const removableWrappers = new Set(["content_card_wrapper", "content_card_60_wrapper", "content_card_40_wrapper"]);
  const visit = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      visit(child);
      if (![...removableWrappers].some((identity) => hasIdentity(child, identity))) return true;
      const slot = findFirstByIdentity(child, "section_content_area");
      return hasMeaningfulBusinessContent(slot);
    });
  };
  visit(root);
}

function hasMeaningfulBusinessContent(node) {
  if (!node || !Array.isArray(node.children) || node.children.length === 0) return false;
  return findDescendants(node, (control) => {
    const type = String(control?.type || "");
    if (["collection", "summary", "data-filter", "select-filter", "radio-filter", "checkbox-filter", "search-filter", "pie-chart", "column-chart", "bar-chart", "line-chart", "area-chart", "pivot-table", "dynamic-field", "dynamic-user", "dynamic-image", "dynamic-file"].includes(type)) return true;
    if (type === "button" && hasActionConfiguration(control)) return true;
    if (hasIdentity(control, "form_grid_fields_wrapper")) return true;
    return false;
  }).length > 0;
}

function hasActionConfiguration(control) {
  const attrs = control?.attrs || {};
  if (attrs.control_action || attrs.action || attrs["action-type"] || attrs.actionType) return true;
  if (Array.isArray(attrs.actions) && attrs.actions.length) return true;
  if (Array.isArray(control?.actions) && control.actions.length) return true;
  return findDescendants(control, (node) => {
    const childAttrs = node?.attrs || {};
    return Boolean(childAttrs.control_action || childAttrs.action || childAttrs["action-type"] || childAttrs.actionType || (Array.isArray(childAttrs.actions) && childAttrs.actions.length));
  }).length > 0;
}

function findFirstByIdentity(root, expected) {
  let found = null;
  const visit = (node) => {
    if (found || !node || typeof node !== "object") return;
    if (hasIdentity(node, expected)) {
      found = node;
      return;
    }
    for (const child of Array.isArray(node.children) ? node.children : []) visit(child);
  };
  visit(root);
  return found;
}

function findBusinessSectionContentArea(root) {
  const approvedWrappers = new Set(["content_card_wrapper", "content_card_60_wrapper", "content_card_40_wrapper"]);
  const contentCardWrappers = findDescendants(root, (node) => [...approvedWrappers].some((identity) => hasIdentity(node, identity)));
  for (const wrapper of contentCardWrappers) {
    const slot = findFirstByIdentity(wrapper, "section_content_area");
    if (slot) return slot;
  }
  return findFirstByIdentity(root, "section_content_area");
}

function findFirstByType(root, type) {
  return findDescendants(root, (node) => String(node?.type || "") === type)[0] || null;
}

function findParent(root, target) {
  let parent = null;
  const visit = (node) => {
    if (parent || !node || typeof node !== "object" || !Array.isArray(node.children)) return;
    for (const child of node.children) {
      if (child === target) {
        parent = node;
        return;
      }
      visit(child);
      if (parent) return;
    }
  };
  visit(root);
  return parent;
}

function findDescendants(root, predicate) {
  const out = [];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (predicate(node)) out.push(node);
    for (const child of Array.isArray(node.children) ? node.children : []) visit(child);
  };
  visit(root);
  return out;
}

function hasIdentity(control, expected) {
  const normalized = normKey(expected);
  return identityCandidates(control).some((candidate) => normKey(candidate) === normalized);
}

function identityCandidates(control) {
  return [
    control?.id,
    control?.ID,
    control?.key,
    control?.name,
    control?.Name,
    control?.label,
    control?.Label,
    control?.nv_label,
    control?.nav_label,
    control?.attrs?.id,
    control?.attrs?.name,
    control?.attrs?.label,
    control?.attrs?.nv_label,
    control?.attrs?.nav_label,
    control?.attrs?.templateMarker,
    control?.attrs?.dashboardPageLayoutTemplateId,
    control?.attrs?.dataListFormLayoutTemplateId,
    control?.attrs?.derivedFromDataListFormLayoutTemplate,
    control?.templateMarker,
    control?.derivedFromDashboardPageLayoutTemplate,
    control?.dataListFormLayoutTemplateId,
    control?.derivedFromDataListFormLayoutTemplate,
  ].filter(Boolean).map(String);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function setTemplateText(root, identity, value) {
  const node = findFirstByIdentity(root, identity);
  if (!node) return;
  node.name = value;
  node.title = value;
  node.attrs = node.attrs || {};
  node.attrs.headc = node.attrs.headc || {};
  node.attrs.headc.title = node.attrs.headc.title || {};
  node.attrs.headc.title.value = value;
}

function buildLegacyMaterialDashboardResource({ name, layoutId, listName, listId, summaryId, filterId, collectionId }) {
  const tempVar = `tmp_${slugify(name).replace(/-/g, "_")}_count`;
  return {
    type: "dashboard-page",
    id: `${slugify(name)}_root`,
    name,
    title: name,
    ver: "1.0.0",
    attrs: { container: { padding: ["--sp--s0", "--sp--s0", "--sp--s0", "--sp--s0"] } },
    filterVars: [],
    tempVars: [{ name: tempVar, type: "number", source: summaryId }],
    ReportIds: [summaryId],
    exts: [{
      i: summaryId,
      id: summaryId,
      category: "___Pivot___",
      key: "summary",
      attr: {
        ListID: stringId(listId),
        settings: {
          values: [{ field: "ListDataID", type: "count", label: "Active Records" }],
        },
      },
    }],
    actions: [],
    derivedFromGoldenReference: "dashboard-page-layouts-v1.1",
    templateMarker: "dashboard-page-layouts-v1.1",
    LayoutID: layoutId,
    children: [
      {
        type: "container",
        id: "Main",
        name: "Main",
        title: "Main",
        attrs: { container: { cw: "2", widthtype: [null, "1"], direction: "vertical", gap: 16, align_items: "stretch", justify_content: "flex-start", padding: ["--sp--s0", "--sp--s0", "--sp--s0", "--sp--s0"] } },
        children: [
          {
            type: "container",
            id: "Content",
            name: "Content",
            title: "Content",
            attrs: {
              container: { cw: "2", widthtype: [null, "1"], direction: "vertical", gap: 16, align_items: "stretch", justify_content: "flex-start" },
              common: { padding: [null, { top: 24, right: 28, bottom: 24, left: 28 }] },
            },
            children: [
              { type: "heading", label: "Text", id: `${slugify(name)}_title`, name, title: name, attrs: { headc: { title: { value: name } }, heads: { ty: [null, "h2-bold"], color: "#111827" } } },
              {
                type: "summary",
                id: summaryId,
                name: "Active Records",
                title: "Active Records",
                save_var: { name: tempVar },
                attrs: { data: { list: { AppID: 41, ListID: stringId(listId), Type: 1, Title: listName }, aggregation: "count", field: "ListDataID" }, save_var: { name: tempVar } },
              },
              {
                type: "data-filter",
                id: filterId,
                name: "Status filter",
                title: "Status filter",
                attrs: { data: { list: { AppID: 41, ListID: stringId(listId), Type: 1, Title: listName }, field: "Title" }, label: "Status", placeholder: `Filter ${listName}` },
              },
              {
                type: "collection",
                id: collectionId,
                name: `${listName} collection`,
                title: `${listName} collection`,
                attrs: { data: { list: { AppID: 41, ListID: stringId(listId), Type: 1, Title: listName }, source: listName, field: "Title" }, collection: { template: "collection_control_grid_table" } },
                children: [
                  { type: "dynamic-field", id: `${collectionId}_title`, name: "Title", title: "Title", attrs: { data: { field: "Title", ListID: stringId(listId) } } },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

function buildNavigationLayoutView({ planDemand, rootListId, ids, dataListByName, forms, pages }) {
  const groups = planDemand.resources.navigationGroups.length ? planDemand.resources.navigationGroups : ["Workspace"];
  const dashboardItems = pages.map((page) => ({ Title: page.Title, Type: 103, Target: page.Title, ListID: page.LayoutID, LayoutID: page.LayoutID }));
  const formItems = forms.map((form) => ({ Title: form.Name, Type: 105, Target: form.Name, ListID: form.Key }));
  const listItems = planDemand.resources.dataLists.map((name) => ({ Title: name, Type: 1, Target: name, ListID: dataListByName.get(normKey(name)) }));
  const reportItems = planDemand.resources.formReports.map((name) => ({ Title: name, Type: 105, Target: name, ListID: forms[0]?.Key || "" }));
  const allItems = dashboardItems.concat(formItems, listItems, reportItems);
  const itemsByGroup = planDemand.navigationItemsByGroup || {};
  const targetByName = new Map(allItems.flatMap((item) => [[normKey(item.Target), item], [normKey(item.Title), item]]));
  const sort = groups.map((groupName, index) => ({
    ID: stringId(ids[`decoded.ListSet.LayoutView.sort[${index}].ID`]),
    AppID: 41,
    ListSetID: stringId(rootListId),
    Title: groupName,
    Type: "classes",
    Icon: "fa-solid fa-folder",
    list: (itemsByGroup[groupName] || []).length
      ? itemsByGroup[groupName].map((item) => toRuntimeNavigationItem(targetByName.get(normKey(item.title)) || targetByName.get(normKey(item.target)) || { Title: item.title, Type: inferNavigationType(item.type), ListID: "" }, rootListId))
        .filter(Boolean)
      : allItems.filter((item, itemIndex) => itemIndex % groups.length === index).map((item) => toRuntimeNavigationItem(item, rootListId)),
  }));
  if (sort.length && sort.every((group) => !group.list.length)) sort[0].list = allItems.map((item) => toRuntimeNavigationItem(item, rootListId)).filter(Boolean);
  return JSON.stringify({ sortVer: 1, sort });
}

function toRuntimeNavigationItem(item, rootListId) {
  if (!["1", "103", "105"].includes(String(item.Type))) return null;
  if (!item.ListID) return null;
  const out = {
    AppID: 41,
    Title: item.Title,
    Type: item.Type,
    ListID: stringId(item.ListID || ""),
    ListSetID: stringId(rootListId),
  };
  if (String(item.Type) === "103") out.LayoutID = stringId(item.LayoutID || item.ListID || "");
  return out;
}

function inferNavigationType(value) {
  if (/approval/i.test(value)) return 105;
  if (/dashboard/i.test(value)) return 103;
  if (/report/i.test(value)) return 106;
  return 1;
}

function exportResource(resource) {
  const prefix = Buffer.from("::brotli::", "utf8");
  const compressed = zlib.brotliCompressSync(Buffer.from(JSON.stringify(resource), "utf8"));
  return Buffer.concat([prefix, compressed]).toString("base64");
}

function buildApprovalDefResource({ name, formKey, defId }) {
  const submissionPageId = `${defId}_submission`;
  const taskPageId = `${defId}_task`;
  const startId = `${defId}_start`;
  const flowId = `${defId}_flow_start_task`;
  const taskId = `${defId}_task_node`;
  const approvedFlowId = `${defId}_flow_approved`;
  const rejectedFlowId = `${defId}_flow_rejected`;
  const endId = `${defId}_end`;
  return {
    id: defId,
    key: formKey,
    defkey: formKey,
    name,
    title: name,
    workflowType: 2,
    AppListSetID: "generated-final-app-listset",
    ProcModelAppID: 41,
    ProcModelListID: defId,
    ProcModelListSetID: formKey,
    variables: [{ name: "requestTitle", type: "text", source: "Title" }],
    graphposition: { x: 0, y: 0 },
    graphzoom: 1,
    graphver: "1.0",
    pageurls: [
      { id: submissionPageId, pageUrl: submissionPageId, url: submissionPageId, type: "request", title: "Submission form", formdef: approvalFormDef(submissionPageId, name, "Submit") },
      { id: taskPageId, pageUrl: taskPageId, url: taskPageId, type: "task", title: "Task form", formdef: approvalFormDef(taskPageId, name, "Approve") },
    ],
    childshapes: [
      { id: startId, resourceid: startId, stencil: { id: "StartNoneEvent" }, incoming: [], outgoing: [{ resourceid: flowId }], properties: { name: "Start" }, bounds: { upperLeft: { x: 100, y: 100 }, lowerRight: { x: 130, y: 130 } } },
      { id: flowId, resourceid: flowId, stencil: { id: "SequenceFlow" }, source: { resourceid: startId }, target: { resourceid: taskId }, incoming: [{ resourceid: startId }], outgoing: [{ resourceid: taskId }], properties: { name: "Submit" }, dockers: [{ x: 130, y: 115 }, { x: 220, y: 115 }] },
      { id: taskId, resourceid: taskId, stencil: { id: "MultiAssignmentTask" }, incoming: [{ resourceid: flowId }], outgoing: [{ resourceid: approvedFlowId }, { resourceid: rejectedFlowId }], properties: { name: "Review", taskurl: taskPageId, usertaskassignment: { mode: "initiator-manager", users: [] } }, bounds: { upperLeft: { x: 220, y: 80 }, lowerRight: { x: 340, y: 150 } } },
      { id: approvedFlowId, resourceid: approvedFlowId, stencil: { id: "SequenceFlow" }, source: { resourceid: taskId }, target: { resourceid: endId }, incoming: [{ resourceid: taskId }], outgoing: [{ resourceid: endId }], properties: { name: "Approved", conditioninfo: "approved" }, dockers: [{ x: 340, y: 105 }, { x: 440, y: 105 }] },
      { id: rejectedFlowId, resourceid: rejectedFlowId, stencil: { id: "SequenceFlow" }, source: { resourceid: taskId }, target: { resourceid: endId }, incoming: [{ resourceid: taskId }], outgoing: [{ resourceid: endId }], properties: { name: "Rejected", conditioninfo: "rejected" }, dockers: [{ x: 340, y: 135 }, { x: 440, y: 135 }] },
      { id: endId, resourceid: endId, stencil: { id: "EndNoneEvent" }, incoming: [{ resourceid: approvedFlowId }, { resourceid: rejectedFlowId }], outgoing: [], properties: { name: "End" }, bounds: { upperLeft: { x: 440, y: 100 }, lowerRight: { x: 470, y: 130 } } },
    ],
  };
}

function approvalFormDef(id, title, actionLabel) {
  return {
    id,
    title,
    ver: "1.0.0",
    type: "form",
    children: [
      { type: "container", id: `${id}_main`, name: "Main", children: [
        { type: "heading", label: "Text", id: `${id}_title`, name: title, attrs: { headc: { title: { value: title } }, heads: { ty: [null, "h3-bold"], color: "#111827" } } },
        { type: "dynamic-field", id: `${id}_field_title`, name: "Title", attrs: { data: { field: "Title" } } },
        { type: "button", id: `${id}_action`, name: actionLabel, attrs: { action: { type: "form-action", label: actionLabel } } },
      ] },
    ],
  };
}

function listInfo({ listId, title, type, ext2 = "", iconUrl = "" }) {
  return {
    ListID: listId,
    Title: title,
    Description: "",
    Status: 1,
    IsItemPerm: false,
    IsVerRecord: false,
    HasComment: false,
    IconUrl: iconUrl,
    TableCode: "flowcraft",
    Ext1: "",
    Ext2: ext2,
    Ext3: "",
    Type: type,
    Flags: 1,
    LayoutView: type === 1 ? null : "",
    Perms: [],
    AdvancePerms: [],
    IndexCode: "flowcraft",
  };
}

function loadIdSource({ cwd, apiIdManifest, fixtureMode, findings }) {
  if (apiIdManifest) {
    const file = path.resolve(cwd, apiIdManifest);
    if (!fs.existsSync(file)) {
      findings.push(error("FULL_APP_MATERIALIZATION_API_ID_MANIFEST_MISSING", "The API-issued ID manifest file does not exist.", { path: file }));
      return null;
    }
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const ids = Array.isArray(data.ids) ? data.ids : Array.isArray(data.allocations) ? data.allocations.map((item) => item.id) : [];
    if (!ids.length) findings.push(error("FULL_APP_MATERIALIZATION_API_ID_MANIFEST_EMPTY", "The API-issued ID manifest must contain ids[] or allocations[].id."));
    return { ids };
  }
  if (fixtureMode) {
    return { ids: buildFixtureApiIds(1024) };
  }
  findings.push(error("FULL_APP_MATERIALIZATION_API_ID_SOURCE_REQUIRED", "Generated-final materialization requires --api-id-manifest with API-issued IDs. Use --allow-fixture-api-ids-for-tests only in plugin regression tests."));
  return null;
}

function buildFixtureApiIds(count) {
  const base = 910000000000000001n;
  return Array.from({ length: count }, (_, index) => String(base + BigInt(index)));
}

function allocateIds(ids, paths, findings) {
  const cleanIds = ids.map((id) => String(id || "").trim()).filter(Boolean);
  if (cleanIds.length < paths.length) {
    findings.push(error("FULL_APP_MATERIALIZATION_API_ID_COUNT_INSUFFICIENT", "Not enough API-issued IDs for generated-final materialization.", { required: paths.length, received: cleanIds.length }));
    return {};
  }
  const out = {};
  paths.forEach((pathName, index) => {
    const id = cleanIds[index];
    if (!/^\d{16,}$/.test(id)) {
      findings.push(error("FULL_APP_MATERIALIZATION_API_ID_INVALID", "API-issued IDs must be large numeric strings.", { path: pathName }));
    }
    out[pathName] = id;
  });
  return out;
}

function extractTitle(text) {
  const heading = text.match(/^#\s+(.+)$/m)?.[1];
  if (heading) return heading.replace(/^(Functional Specification|Yeeflow App Plan)\s*[:\-]\s*/i, "").trim();
  return text.match(/\|\s*(?:Application|App) Name\s*\|\s*([^|]+)\|/i)?.[1]?.trim() || "";
}

function resolveRequiredPath(cwd, requested, fallbackName) {
  const candidate = requested ? path.resolve(cwd, requested) : path.resolve(cwd, fallbackName);
  return fs.existsSync(candidate) ? candidate : "";
}

function sanitizeTitle(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 120) || "Generated Yeeflow Application";
}

function inferFieldKey(displayName, fieldType, index) {
  if (/^title$/i.test(displayName)) return "Title";
  const prefix = fieldPrefix(fieldType);
  return `${prefix}${Math.max(1, index + 1)}`;
}

function fieldPrefix(fieldType) {
  const normalized = normKey(fieldType);
  if (/date|time/.test(normalized)) return "Datetime";
  if (/number|decimal|currency|amount|percent|integer/.test(normalized)) return "Decimal";
  if (/boolean|yes no|checkbox|bit/.test(normalized)) return "Bit";
  return "Text";
}

function inferControlType(fieldType) {
  const normalized = normKey(fieldType);
  if (/user|people|person/.test(normalized)) return "identity-picker";
  if (/date|time/.test(normalized)) return "datepicker";
  if (/number|decimal|currency|amount|percent|integer/.test(normalized)) return "input_number";
  if (/boolean|yes no|checkbox|bit/.test(normalized)) return "switch";
  if (/choice|select|status|category/.test(normalized)) return "select";
  if (/file|attachment/.test(normalized)) return "file-upload";
  if (/image|photo|picture/.test(normalized)) return "icon-upload";
  return "input";
}

function normalizeFieldType(fieldType) {
  const normalized = normKey(fieldType);
  if (/date|time/.test(normalized)) return "Datetime";
  if (/number|decimal|currency|amount|percent|integer/.test(normalized)) return "Decimal";
  if (/boolean|yes no|checkbox|bit/.test(normalized)) return "Bit";
  return "Text";
}

function normalizeControlType(controlType) {
  const normalized = normKey(controlType);
  if (/sub list|sublist|\blist\b/.test(normalized)) return "list";
  if (/user|identity/.test(normalized)) return "identity-picker";
  if (/date|datetime/.test(normalized)) return "datepicker";
  if (/number|decimal|currency|amount|percent/.test(normalized)) return "input_number";
  if (/switch|bit|boolean|yes no|flag/.test(normalized)) return "switch";
  if (/checkbox/.test(normalized)) return "checkbox";
  if (/select|choice|dropdown/.test(normalized)) return "select";
  if (/file|attachment/.test(normalized)) return "file-upload";
  if (/image|photo|picture|icon/.test(normalized)) return "icon-upload";
  if (/note|textarea|multi line/.test(normalized)) return "textarea";
  return "input";
}

function dynamicControlTypeForField(field) {
  const normalized = normKey(field.FieldType || field.Type || field.fieldType);
  if (/user/.test(normalized)) return "dynamic-user";
  if (/image|photo|picture/.test(normalized)) return "dynamic-image";
  if (/file|attachment/.test(normalized)) return "dynamic-file";
  return "dynamic-field";
}

function fieldsForDynamicControls(listMeta) {
  const rawFields = listMeta?.fields || [];
  const fields = rawFields.map((field) => ({
    fieldName: field.FieldName || field.fieldName || "Title",
    displayName: field.DisplayName || field.displayName || field.FieldName || "Title",
    fieldType: field.FieldType || field.fieldType || "Text",
  }));
  return fields.length ? fields : [{ fieldName: "Title", displayName: "Title", fieldType: "Text" }];
}

function primaryFieldName(listMeta) {
  const fields = fieldsForDynamicControls(listMeta);
  return (fields.find((field) => field.fieldName === "Title") || fields[0]).fieldName;
}

function resolveFieldSpec(listMeta, requestedName) {
  const requested = normKey(requestedName);
  if (!requested) return null;
  return fieldsForDynamicControls(listMeta).find((field) => normKey(field.fieldName) === requested || normKey(field.displayName) === requested) || null;
}

function slugify(value) {
  return sanitizeTitle(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "generated-yeeflow-application";
}

function stringId(id) {
  return String(id);
}

function numberId(id) {
  return String(id);
}

function normKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function summarizePath(file) {
  return {
    path: file,
    name: path.basename(file),
    exists: fs.existsSync(file),
    fileSize: fs.existsSync(file) ? fs.statSync(file).size : null,
  };
}

function buildFailure(findings, context = {}) {
  return { status: "fail", ...context, findings };
}

function error(code, message, details = {}) {
  return { level: "error", code, message, ...details };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") args.help = true;
    else if (token === "--json") args.json = true;
    else if (token === "--allow-fixture-api-ids-for-tests") args.allowFixtureApiIdsForTests = true;
    else if (token === "--functional-spec" || token === "--spec") args.functionalSpec = argv[++i];
    else if (token === "--app-plan" || token === "--plan") args.appPlan = argv[++i];
    else if (token === "--out-dir") args.outDir = argv[++i];
    else if (token === "--api-id-manifest") args.apiIdManifest = argv[++i];
    else if (token === "--tenant-id") args.tenantId = argv[++i];
    else if (token === "--title") args.title = argv[++i];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/materialize-full-app-generated-final.mjs \\
    --functional-spec functional-specification.md \\
    --app-plan yeeflow-app-plan.md \\
    --out-dir dist \\
    --api-id-manifest api-issued-ids.json [--tenant-id <tenant-id>] [--json]

Regression-only fixture mode:
  node scripts/materialize-full-app-generated-final.mjs --functional-spec <file> --app-plan <file> --out-dir <dir> --allow-fixture-api-ids-for-tests --json

This command materializes generated-final package artifacts only. It never signs, installs, imports, upgrades, seeds data, or runs browser/runtime proof.`);
}

function printTextReport(report) {
  console.log(`Full-app generated-final materialization: ${report.status}`);
  if (report.outputs?.package) console.log(`package: ${report.outputs.package}`);
  for (const finding of report.findings || []) console.log(`- ${finding.code}: ${finding.message}`);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}

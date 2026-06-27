#!/usr/bin/env node

import crypto from "node:crypto";
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
  workbench: path.join(ROOT, "docs/reference/data-list-form-layout-workbench.template.json"),
};
const APPROVAL_FORM_TEMPLATE_PATHS = {
  submission: path.join(ROOT, "docs/reference/approval-form-layout-submission.template.json"),
  task: path.join(ROOT, "docs/reference/approval-form-layout-task.template.json"),
};
const APPROVAL_FORM_TEMPLATE_IDS = {
  submission: "approval_form_layout_submission_v1_1",
  task: "approval_form_layout_task_v1_1",
};
const DATA_LIST_FORM_FIELDS_GRID_TEMPLATE_PATH = path.join(ROOT, "docs/reference/data-list-form-fields-grid.template.json");
const DATA_LIST_FORM_SUBLIST_TEMPLATE_PATH = path.join(ROOT, "docs/reference/data-list-form-control-sublist.template.json");
const DATA_ANALYTICS_REGISTRY_PATH = path.join(ROOT, "docs/reference/data-analytics-golden-references.json");
const DATA_ANALYTICS_TEMPLATE_PATHS = {
  data_analytics_pie_chart_with_title: path.join(ROOT, "docs/reference/data-analytics-pie-chart-with-title.template.json"),
  data_analytics_column_chart_with_title: path.join(ROOT, "docs/reference/data-analytics-column-chart-with-title.template.json"),
  data_analytics_bar_chart_with_title: path.join(ROOT, "docs/reference/data-analytics-bar-chart-with-title.template.json"),
  data_analytics_line_chart_with_title: path.join(ROOT, "docs/reference/data-analytics-line-chart-with-title.template.json"),
  data_analytics_area_chart_with_title: path.join(ROOT, "docs/reference/data-analytics-area-chart-with-title.template.json"),
  data_analytics_pivot_table_standard: path.join(ROOT, "docs/reference/data-analytics-pivot-table-standard.template.json"),
};
const APPROVED_DATA_ANALYTICS_TEMPLATE_IDS = Object.freeze(Object.keys(DATA_ANALYTICS_TEMPLATE_PATHS));
const COLLECTION_TEMPLATE_PATHS = {
  collection_control_grid_table: path.join(ROOT, "docs/reference/collection-control-grid-table.template.json"),
  "Event Pipeline Grid-Table": path.join(ROOT, "docs/reference/collection-control-grid-table.template.json"),
  collection_control_grid_table_with_multiselect: path.join(ROOT, "docs/reference/collection-control-grid-table-with-multiselect.template.json"),
  collection_control_card_with_multiselect_toolbar: path.join(ROOT, "docs/reference/collection-control-card-with-multiselect-toolbar.template.json"),
  collection_control_responsive_card_grid: path.join(ROOT, "docs/reference/collection-control-responsive-card-grid.template.json"),
};
const APPROVED_COLLECTION_TEMPLATE_IDS = Object.freeze(Object.keys(COLLECTION_TEMPLATE_PATHS));
const GRID_TABLE_TEMPLATE_IDS = new Set([
  "collection_control_grid_table",
  "collection_control_grid_table_with_multiselect",
  "Event Pipeline Grid-Table",
]);
const SOURCE_COLLECTION_TEMPLATE_IDS = {
  listSetIds: new Set(["2058726109535285249", "2058571956842409984"]),
  listIds: new Set(["2058726119586017281", "2058571966637289476"]),
};
const PAGE_LAYOUT_TEMPLATE_ID = "dashboard-page-layouts-v1.1";
const DASHBOARD_GOLDEN_REFERENCE_ID = "event_portfolio_dashboard_golden_reference";
const UUID_CONTROL_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    ListID: stringId(ids["decoded.ListSet.ListID"]),
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
  const seedDataPath = path.join(outDir, `${slug}.generated-final.seed-data.json`);
  const provenancePath = path.join(outDir, `${slug}.generated-final-id-provenance-report.json`);
  const generationReportPath = path.join(outDir, `${slug}.generated-final-generation-report.json`);
  fs.writeFileSync(packagePath, `${JSON.stringify(wrapper, null, 2)}\n`);
  fs.writeFileSync(decodedPath, `${JSON.stringify(decoded, null, 2)}\n`);
  fs.writeFileSync(seedDataPath, `${JSON.stringify(buildSeedDataArtifact(decoded), null, 2)}\n`);

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
    materializerSigningEligible: false,
    preflightEligibleForSigning: null,
    signingReadinessSource: "not-run",
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
    materializerSigningEligible: false,
    preflightEligibleForSigning: null,
    signingReadinessSource: "not-run",
    plannedResourceDemand: planDemand,
    inputs: {
      functionalSpecification: summarizePath(specPath),
      appPlan: summarizePath(planPath),
      apiIdManifest: options.apiIdManifest ? summarizePath(path.resolve(cwd, options.apiIdManifest)) : null,
    },
    outputs: {
      package: summarizePath(packagePath),
      decodedResource: summarizePath(decodedPath),
      seedData: summarizePath(seedDataPath),
      idProvenance: summarizePath(provenancePath),
    },
    hardStopsPreserved: [
      "No signing was attempted.",
      "No install/import/upgrade was attempted.",
      "No browser/runtime proof was attempted.",
      "Generated-final preflight is required before any signing request.",
      "Standalone materialization emits the planned generated-final resource surfaces but remains signing-ineligible until all generated-final hard gates pass.",
      "Use yapk-first-generation-preflight output as the signing-readiness handoff; materializer signingEligible remains false because this script does not run the final preflight/signing stage.",
    ],
  };
  fs.writeFileSync(generationReportPath, `${JSON.stringify(generationReport, null, 2)}\n`);

  return {
    status: "pass",
    mode: generationReport.mode,
    signingEligible: generationReport.signingEligible,
    materializerSigningEligible: false,
    preflightEligibleForSigning: null,
    signingReadinessSource: "not-run",
    outputDirectory: outDir,
    outputs: {
      package: packagePath,
      decodedResource: decodedPath,
      seedData: seedDataPath,
      idProvenance: provenancePath,
      generationReport: generationReportPath,
    },
    proofBoundary: generationReport.hardStopsPreserved,
    findings: [],
  };
}

function buildSeedDataArtifact(decoded) {
  const lists = (decoded.Childs || []).map((child) => {
    const fields = (child.Fields || []).filter((field) => Number(field.Status) !== 0 || field.FieldName === "Title");
    const rows = [0, 1, 2].map((rowIndex) => {
      const row = {};
      for (const field of fields.slice(0, 8)) row[field.FieldName] = sampleValueForField(field, rowIndex);
      return row;
    });
    return {
      listTitle: child.List?.Title || child.List?.Name || "Generated List",
      listId: stringId(child.List?.ListID || child.ListID || ""),
      operation: "post-install-seed-only",
      liveWriteRequired: true,
      rows,
    };
  });
  return {
    status: "planned",
    artifactType: "post-install-seed-data",
    proofBoundary: "This companion artifact is not embedded in the .yapk package. Use it only after install/upgrade succeeds and explicit live-write permission is available.",
    lists,
  };
}

function sampleValueForField(field, index) {
  if (field.FieldName === "Title") return `${field.DisplayName || "Item"} ${index + 1}`;
  if (field.FieldType === "Bit") return index % 2 === 0 ? "1" : "0";
  if (field.FieldType === "Datetime") return `2026-07-${String(index + 1).padStart(2, "0")}`;
  if (field.FieldType === "Decimal") return String((index + 1) * 10);
  if (field.Type === "identity-picker") return "";
  if (field.Type === "select") {
    const rules = parseJsonMaybe(field.Rules) || {};
    return String(rules.choices?.[index % Math.max(1, rules.choices.length)]?.value || "Active");
  }
  return `${field.DisplayName || field.FieldName} ${index + 1}`;
}

function parseJsonMaybe(value) {
  if (!value || typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
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
    approvalFormFieldSpecs: collectApprovalFormFieldSpecs(planText),
    dashboardFilterRecords: collectDashboardFilterRecords(planText),
    dashboardSummaryMetricRecords: collectDashboardSummaryMetricRecords(planText),
    dashboardDatasetRecords: collectDashboardDatasetRecords(planText),
    dashboardAnalyticsRecords: collectDashboardAnalyticsRecords(planText),
    evidence,
    hasMaterialResources: Object.values(counts).some((count) => count > 0),
  };
}

function collectDashboardAnalyticsRecords(planText) {
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
      "selected data analytics template",
      "data analytics template",
      "selected analytics template",
      "analytics template",
    ]);
    if (templateColumn === -1) continue;
    const pageColumn = findHeaderIndex(normalizedHeaders, ["dashboard page", "dashboard page name", "page name"]);
    const regionColumn = findHeaderIndex(normalizedHeaders, ["analytics region", "section", "section name", "region"]);
    const sourceColumn = findHeaderIndex(normalizedHeaders, ["source resource", "data source", "source data", "source"]);
    const questionColumn = findHeaderIndex(normalizedHeaders, ["business question", "question", "title", "analytics title"]);
    const groupColumn = findHeaderIndex(normalizedHeaders, ["grouping field", "grouping/axis fields", "axis field", "category field", "row fields"]);
    const valueColumn = findHeaderIndex(normalizedHeaders, ["value field", "value/aggregate fields", "aggregate field", "measure field", "values"]);
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const selectedTemplateId = extractApprovedDataAnalyticsTemplateId(lines[rowIndex]);
      if (selectedTemplateId) {
        records.push({
          dashboardPage: cleanResourceName(cells[pageColumn]) || currentDashboardPage,
          analyticsRegion: cleanResourceName(cells[regionColumn]),
          sourceResource: cleanResourceName(cells[sourceColumn]),
          businessQuestion: cleanResourceName(cells[questionColumn]) || cleanResourceName(cells[regionColumn]),
          groupingFields: cleanResourceName(cells[groupColumn]),
          valueFields: cleanResourceName(cells[valueColumn]),
          selectedTemplateId,
          raw: lines[rowIndex].trim(),
        });
      }
      rowIndex += 1;
    }
    index = rowIndex;
  }
  return records;
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
    const usageColumn = findHeaderIndex(normalizedHeaders, ["form usage", "usage"]);
    const templateColumn = findHeaderIndex(normalizedHeaders, ["selected data list form layout template", "data list form layout template", "selected layout template"]);
    const openColumn = findHeaderIndex(normalizedHeaders, ["open in", "open mode", "display mode"]);
    const reasonColumn = findHeaderIndex(normalizedHeaders, ["selection reason", "proof boundary", "business sections needed"]);
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
      const selectedTemplate = templateColumn === -1 ? "" : cleanResourceName(cells[templateColumn]);
      const openIn = openColumn === -1 ? "" : cleanResourceName(cells[openColumn]);
      const reason = reasonColumn === -1 ? "" : cleanResourceName(cells[reasonColumn]);
      const formType = typeColumn === -1 ? (usageColumn === -1 ? "" : cleanResourceName(cells[usageColumn])) : cleanResourceName(cells[typeColumn]);
      const record = {
        listName: currentList,
        formName,
        formType,
        selectedTemplate,
        openIn,
        selectionReason: reason,
      };
      if (!seen.has(key)) {
        seen.add(key);
        records.push(record);
      } else if (selectedTemplate || openIn || reason) {
        const existing = records.find((item) => `${normKey(item.listName)}::${normKey(item.formName)}` === key);
        if (existing) Object.assign(existing, Object.fromEntries(Object.entries(record).filter(([, value]) => value)));
      }
      rowIndex += 1;
    }
    index = rowIndex;
  }
  return records;
}

function collectApprovalFormFieldSpecs(planText) {
  const section = extractNumberedSection(planText, /^##\s+5\.\s+Approval Forms Plan/im);
  const byForm = {};
  if (!section.trim()) return byForm;
  const lines = section.split(/\r?\n/);
  let currentApprovalForm = "";
  let currentRole = "";
  for (let index = 0; index < lines.length; index += 1) {
    const approvalHeading = lines[index].match(/^###\s+\d+\.[x0-9]+\s+(.+?)\s*$/i);
    if (approvalHeading) {
      currentApprovalForm = cleanResourceName(approvalHeading[1]);
      currentRole = "";
      if (currentApprovalForm && !byForm[normKey(currentApprovalForm)]) byForm[normKey(currentApprovalForm)] = { submission: [], task: [] };
      continue;
    }
    if (/^#{4,6}\s+Submission Form Fields\s*$/i.test(lines[index])) {
      currentRole = "submission";
      continue;
    }
    if (/^#{4,6}\s+Task Form Fields\s*$/i.test(lines[index])) {
      currentRole = "task";
      continue;
    }
    if (!currentApprovalForm || !currentRole || !isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const normalizedHeaders = headers.map((header) => normKey(header));
    const displayColumn = findHeaderIndex(normalizedHeaders, ["business label", "display name", "field name", "label", "name"]);
    const keyColumn = findHeaderIndex(normalizedHeaders, ["field name", "field id / variable id", "variable id", "field key", "internal id field key"]);
    const fieldTypeColumn = findHeaderIndex(normalizedHeaders, ["exact yeeflow variable type", "exact yeeflow field type", "field type", "variable type", "type"]);
    const controlTypeColumn = findHeaderIndex(normalizedHeaders, ["exact yeeflow control type", "control type", "control"]);
    if (displayColumn === -1) continue;
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const displayName = cleanResourceName(cells[displayColumn]);
      if (!displayName || isNonResourceName(displayName)) {
        rowIndex += 1;
        continue;
      }
      const list = byForm[normKey(currentApprovalForm)]?.[currentRole] || [];
      list.push({
        displayName,
        fieldName: cleanResourceName(cells[keyColumn]) || inferFieldKey(displayName, cleanResourceName(cells[fieldTypeColumn]) || "Text", list.length),
        fieldType: cleanResourceName(cells[fieldTypeColumn]) || "Text",
        controlType: cleanResourceName(cells[controlTypeColumn]),
      });
      byForm[normKey(currentApprovalForm)][currentRole] = uniqueApprovalFieldSpecs(list);
      rowIndex += 1;
    }
    index = rowIndex;
  }
  return byForm;
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

function collectDashboardSummaryMetricRecords(planText) {
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
    const metricColumn = findHeaderIndex(normalizedHeaders, ["metric name", "kpi name", "summary metric", "summary metric name"]);
    if (metricColumn === -1) continue;
    const pageColumn = findHeaderIndex(normalizedHeaders, ["dashboard page", "dashboard page name", "page name"]);
    const sourceColumn = findHeaderIndex(normalizedHeaders, ["source data list", "source resource", "data source", "source"]);
    const fieldColumn = findHeaderIndex(normalizedHeaders, ["source field(s)", "source fields", "source field", "field"]);
    const logicColumn = findHeaderIndex(normalizedHeaders, ["calculation logic", "logic", "aggregation"]);
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const metricName = cleanResourceName(cells[metricColumn]);
      if (!metricName || isNonResourceName(metricName) || /not applicable|n\/a|none/i.test(metricName)) {
        rowIndex += 1;
        continue;
      }
      records.push({
        dashboardPage: cleanResourceName(cells[pageColumn]) || currentDashboardPage,
        metricName,
        sourceResource: sourceColumn === -1 ? "" : cleanResourceName(cells[sourceColumn]),
        sourceFields: fieldColumn === -1 ? "" : cleanResourceName(cells[fieldColumn]),
        calculationLogic: logicColumn === -1 ? "" : cleanResourceName(cells[logicColumn]),
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

function extractApprovedDataAnalyticsTemplateId(text) {
  for (const templateId of APPROVED_DATA_ANALYTICS_TEMPLATE_IDS) {
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
      "decoded.ListSet.ListID",
      "decoded.Pages[0].LayoutID",
      "decoded.Pages[0].LayoutInResources[0].ID",
      "decoded.Pages[0].LayoutInResources[0].RefId",
    ];
  }
  const paths = [
    "wrapper.PackageId",
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

function approvalFieldSpecsForForm(planDemand, formName) {
  const planned = planDemand.approvalFormFieldSpecs?.[normKey(formName)] || {};
  const submission = uniqueApprovalFieldSpecs(Array.isArray(planned.submission) ? planned.submission : []);
  const task = uniqueApprovalFieldSpecs(Array.isArray(planned.task) ? planned.task : []);
  return {
    submission,
    task: task.length ? task : submission,
  };
}

function uniqueApprovalFieldSpecs(fields) {
  const normalized = [];
  const seen = new Set();
  for (const field of fields) {
    const displayName = cleanResourceName(field?.displayName);
    if (!displayName || isNonResourceName(displayName)) continue;
    const fieldName = cleanResourceName(field?.fieldName || inferFieldKey(displayName, field?.fieldType || "Text", normalized.length));
    const key = normKey(fieldName || displayName);
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({
      displayName,
      fieldName,
      fieldType: cleanResourceName(field?.fieldType) || "Text",
      controlType: cleanResourceName(field?.controlType) || inferControlType(field?.fieldType || ""),
    });
  }
  return normalized.slice(0, 16);
}

function assignCustomFormLayoutPositions(planDemand, dataListNames) {
  const listIndexByName = new Map(dataListNames.map((name, index) => [normKey(name), index]));
  const offsetsByList = new Map();
  return ensureRequiredCustomFormRecords(planDemand, dataListNames)
    .map((record) => {
      const listIndex = listIndexByName.has(normKey(record.listName)) ? listIndexByName.get(normKey(record.listName)) : 0;
      const next = (offsetsByList.get(listIndex) || 0) + 1;
      offsetsByList.set(listIndex, next);
      return { ...record, listIndex, layoutIndex: next };
    });
}

function ensureRequiredCustomFormRecords(planDemand, dataListNames) {
  const records = [...(planDemand.customFormRecords || [])];
  for (const listName of dataListNames) {
    const listRecords = records.filter((record) => normKey(record.listName) === normKey(listName));
    if (!listRecords.some((record) => customFormUsage(record) === "newEdit")) {
      records.push({
        listName,
        formName: `${listName} New/Edit Form`,
        formType: "New/Edit",
        generatedByPolicy: "required-new-edit-custom-form",
      });
    }
    if (!listRecords.some((record) => customFormUsage(record) === "view")) {
      records.push({
        listName,
        formName: `${listName} View Item`,
        formType: "View",
        generatedByPolicy: "required-view-custom-form",
      });
    }
  }
  return records;
}

function customFormUsage(record) {
  const text = `${record?.formType || ""} ${record?.formName || ""}`.toLowerCase();
  if (/\bview\b|detail/.test(text)) return "view";
  if (/new\s*\/\s*edit|\bnew\b|\bedit\b|create/.test(text)) return "newEdit";
  return "";
}

function buildDataListFormDisplaySettings({ customLayoutsForList, ids }) {
  const byUsage = new Map();
  const viewAssignmentById = new Map();
  for (const assignment of customLayoutsForList) {
    const usage = customFormUsage(assignment);
    if (!usage || byUsage.has(usage)) continue;
    const layoutId = stringId(ids[`decoded.Childs[${assignment.listIndex}].Layouts[${assignment.layoutIndex}].LayoutID`]);
    byUsage.set(usage, layoutId);
    if (usage === "view") viewAssignmentById.set(layoutId, assignment);
  }
  const newEditLayoutId = byUsage.get("newEdit") || byUsage.get("view") || "";
  const viewLayoutId = byUsage.get("view") || newEditLayoutId;
  const settings = {
    add: newEditLayoutId,
    edit: newEditLayoutId,
    view: viewLayoutId,
  };
  if (isWorkbenchCustomForm(viewAssignmentById.get(viewLayoutId))) {
    settings.opentype = { view: "new" };
    settings.modalsize = {};
  }
  return settings;
}

function isWorkbenchCustomForm(record) {
  const text = `${record?.formType || ""} ${record?.formName || ""} ${record?.selectedTemplate || ""} ${record?.openIn || ""}`.toLowerCase();
  return /\bworkbench\b/.test(text) || text.includes("data_list_form_layout_workbench");
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
  const templateKind = isWorkbenchCustomForm({ formName, formType }) ? "workbench" : (/\bview\b|detail/i.test(`${formType} ${formName}`) ? "view" : "newEdit");
  const templateId = templateKind === "workbench" ? "data_list_form_layout_workbench" : (templateKind === "view" ? "data_list_form_layout_view_item_v1_1" : "data_list_form_layout_new_edit_v1_1");
  const resource = materializeDataListFormResource({ templateKind, templateId, listId, listName, formName, fields });
  const resourceJson = JSON.stringify(resource);
  return {
    ListID: listId,
    LayoutID: layoutId,
    Title: formName,
    Type: 1,
    LayoutView: resourceJson,
    IsDefault: false,
    IsItemPerm: false,
    Perms: [],
    LayoutInResources: [
      {
        ID: layoutId,
        RefId: layoutId,
        Resource: resourceJson,
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
  setTemplateText(resource, "section_title_description", templateKind === "newEdit" ? `Capture and maintain ${listName} item details.` : `Review ${listName} details and related context.`);
  if (templateKind === "view" || templateKind === "workbench") {
    setTemplateText(resource, "page_title_text", formName);
    setTemplateText(resource, "page_title_description", `View ${listName} record details and related operational context.`);
  }
  const slot = findBusinessSectionContentArea(resource);
  if (slot) {
    slot.children = [buildDataListFormFieldsGrid({ fields: fields.slice(0, 12), formName, listId, listName, templateKind })];
  }
  removeEmptyBusinessSections(resource);
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
  const type = (templateKind === "view" || templateKind === "workbench") && !isSubListFormField(field) ? dynamicControlTypeForField(field) : normalizeControlType(field.Type || field.FieldType || field.DisplayName);
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
  const values = (String(field.choiceValues || "")
    .split(/[,;]+/)
    .map((value) => value.trim())
    .filter(Boolean)).concat(inferChoiceValues(field));
  const uniqueValues = unique(values).slice(0, 8);
  if (!uniqueValues.length) return "";
  const colors = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];
  const choices = uniqueValues.map((value, index) => ({
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

function inferChoiceValues(field) {
  if (String(field?.choiceValues || "").trim()) return [];
  const raw = normKey(`${field?.displayName || ""} ${field?.fieldName || ""} ${field?.fieldType || ""} ${field?.controlType || ""}`);
  if (/priority|urgency|severity|critical/.test(raw)) return ["Low", "Medium", "High", "Critical"];
  if (/condition|inspection|quality/.test(raw)) return ["Good", "Fair", "Damaged", "Lost"];
  if (/availability|available|reservation/.test(raw)) return ["Available", "Checked Out", "Reserved", "Maintenance"];
  if (/approval|decision|review/.test(raw)) return ["Pending Review", "Approved", "Rejected", "Returned"];
  if (/status|state|stage|phase/.test(raw)) return ["Draft", "Submitted", "In Progress", "Completed", "Closed"];
  if (/category|type|class|group/.test(raw)) return ["Standard", "Special", "Replacement", "Repair"];
  return ["Active", "Pending", "Closed"];
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
    const displayLayoutView = buildDataListFormDisplaySettings({ customLayoutsForList, ids });
    const detailLayoutId = displayLayoutView.view || displayLayoutView.edit || displayLayoutView.add || "";
    listMetaByName.set(normKey(name), { listName: name, listId, fields, detailLayoutId });
    return {
      List: listInfo({ listId, title: name, type: 1, ext2: "{\"generatedFinal\":true}", layoutView: JSON.stringify(displayLayoutView) }),
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
    const approvalFieldSpecs = approvalFieldSpecsForForm(planDemand, name);
    const pageIds = approvalWorkflowIds(defId, key);
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
      DefResource: exportResource(buildApprovalDefResource({ name, formKey: key, defId, rootListSetId: rootListId, approvalFieldSpecs })),
      Status: 1,
      DeployedDefID: defId,
      WorkflowType: 2,
      Settings: JSON.stringify({
        taskurl: pageIds.taskPageId,
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
    const dashboardAnalytics = selectDashboardAnalyticsForPage({ planDemand, pageName: name, pageIndex: index });
    const dashboardSummaryMetrics = selectDashboardSummaryMetricsForPage({ planDemand, pageName: name, pageIndex: index });
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
              rootListSetId: rootListId,
              listName: firstListName,
              listId: firstListId,
              listMeta: firstListMeta,
              listMetaByName,
            datasetRecord,
            dashboardFilters,
            dashboardAnalytics,
            dashboardSummaryMetrics,
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

function selectDashboardAnalyticsForPage({ planDemand, pageName, pageIndex }) {
  const records = planDemand.dashboardAnalyticsRecords || [];
  if (!records.length) return [];
  const pageMatches = records.filter((record) => dashboardNameMatches(pageName, record.dashboardPage));
  if (pageMatches.length) return pageMatches;
  return records.filter((record) => !record.dashboardPage).filter((_, index) => index % Math.max(1, planDemand.resources.dashboards.length || 1) === pageIndex);
}

function selectDashboardSummaryMetricsForPage({ planDemand, pageName, pageIndex }) {
  const records = planDemand.dashboardSummaryMetricRecords || [];
  if (!records.length) return [];
  const pageMatches = records.filter((record) => dashboardNameMatches(pageName, record.dashboardPage));
  if (pageMatches.length) return pageMatches;
  return records.filter((record) => !record.dashboardPage).filter((_, index) => index % Math.max(1, planDemand.resources.dashboards.length || 1) === pageIndex);
}

function buildMaterialDashboardResource({ name, layoutId, rootListSetId, listName, listId, listMeta, listMetaByName, datasetRecord, dashboardFilters, dashboardAnalytics, dashboardSummaryMetrics, summaryId, filterId, collectionId }) {
  const tempVar = `tmp_${slugify(name).replace(/-/g, "_")}_count`;
  const kpiContracts = buildDashboardKpiContracts({ pageName: name, summaryIdBase: summaryId, primaryTempVar: tempVar, plannedMetrics: dashboardSummaryMetrics });
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
    rootListSetId,
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
  const analyticsRuntimeContracts = materializeDashboardAnalytics(resource, {
    analyticsRecords: dashboardAnalytics,
    fallbackListMeta: sourceListMeta,
    listMetaByName,
    dashboardName: name,
    rootListSetId,
  });
  materializeDashboardKpiCards(resource, kpiContracts);
  const summaries = kpiContracts.map((contract) => buildSummaryControl({
    summaryId: contract.summaryId,
    tempVar: contract.tempVar,
    listName: sourceResource,
    listId,
    label: contract.label,
  }));
  if (summaries.length) {
    const summaryHostParent = contentArea || findFirstByIdentity(resource, "Content") || resource;
    summaryHostParent.children = Array.isArray(summaryHostParent.children) ? summaryHostParent.children : [];
    summaryHostParent.children.push(buildHiddenSummaryHost({ dashboardName: name, summaries }));
  }
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
  const summaryRuntimeExts = kpiContracts.map((contract) => ({
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
  resource.ReportIds = unique([
    ...kpiContracts.map((contract) => contract.summaryId),
    ...analyticsRuntimeContracts.map((contract) => contract.controlId),
  ]);
  resource.exts = [
    ...summaryRuntimeExts,
    ...analyticsRuntimeContracts.map((contract) => contract.ext),
  ];
  resource.actions = normalizeDependencyArray(templateDependencies.actions);
  resource.formAction = normalizeDependencyArray(templateDependencies.formAction);
  resource.LayoutID = layoutId;
  resource.plannedControls = { kpis: kpiContracts.length > 0, kpiCount: kpiContracts.length, gridTable: true };
  resource.generatedFinalDashboardMaterialization = {
    shellTemplate: PAGE_LAYOUT_TEMPLATE_ID,
    datasetRegion,
    selectedCollectionTemplateId: selectedTemplateId,
    selectedDataAnalyticsTemplateIds: (dashboardAnalytics || []).map((record) => record.selectedTemplateId),
    sourceResource,
    kpiCount: kpiContracts.length,
    kpis: kpiContracts.map((contract) => ({ key: contract.key, label: contract.label, tempVar: contract.tempVar, summaryId: contract.summaryId })),
    filters: normalizedFilters.map((filter) => ({ name: filter.filterName, fieldName: filter.fieldName })),
  };
  normalizeGeneratedDashboardControls(resource, name);
  removeEmptyDashboardBusinessSections(resource);
  instantiateDashboardControlUuids(resource, slugify(name));
  return resource;
}

function instantiateDashboardControlUuids(resource, pageSeed) {
  let index = 0;
  const referenceReplacements = new Map();
  const visit = (node) => {
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (!node || typeof node !== "object") return;
    if (typeof node.id === "string" && UUID_CONTROL_ID_RE.test(node.id)) {
      const oldId = node.id;
      index += 1;
      node.id = deterministicUuid(`${pageSeed}:control:${index}:${node.id}`);
      if (!referenceReplacements.has(oldId)) referenceReplacements.set(oldId, node.id);
    }
    for (const child of Object.values(node)) visit(child);
  };
  visit(resource);
  if (!referenceReplacements.size) return;
  const replaceReferences = (node, key = "") => {
    if (Array.isArray(node)) {
      for (let itemIndex = 0; itemIndex < node.length; itemIndex += 1) node[itemIndex] = replaceReferences(node[itemIndex]);
      return node;
    }
    if (!node || typeof node !== "object") {
      if (typeof node !== "string" || key === "id") return node;
      let out = node;
      for (const [from, to] of referenceReplacements) out = out.split(from).join(to);
      return out;
    }
    for (const [childKey, child] of Object.entries(node)) {
      if (childKey === "id") continue;
      node[childKey] = replaceReferences(child, childKey);
    }
    return node;
  };
  replaceReferences(resource);
}

function deterministicUuid(seed) {
  const hex = crypto.createHash("sha256").update(seed).digest("hex");
  const variant = ((Number.parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(18, 20)}-${hex.slice(20, 32)}`;
}

function buildDashboardKpiContracts({ pageName, summaryIdBase, primaryTempVar, plannedMetrics = [] }) {
  const pageSlug = slugify(pageName).replace(/-/g, "_");
  const specs = [
    ["planned_events", "Active Records"],
    ["approved_budget", "Approved Records"],
    ["registration_rate", "Completion Signal"],
    ["lead_follow_up", "Follow-up Queue"],
  ];
  return plannedMetrics.slice(0, specs.length).map((metric, index) => {
    const [key, fallbackLabel] = specs[index];
    const label = metric.metricName || fallbackLabel;
    const tempVar = index === 0 ? primaryTempVar : `tmp_${pageSlug}_${key}_count`;
    const summaryId = index === 0 ? summaryIdBase : `${summaryIdBase}_${key}`;
    return { key, label, tempVar, summaryId };
  });
}

function materializeDashboardKpiCards(resource, kpiContracts = []) {
  const wrapper = findFirstByIdentity(resource, "kpi_metrics_wrapper") || findFirstByIdentity(resource, "kpi_cards_wrapper");
  if (!wrapper) return;
  const cardIds = ["event_portfolio_kpi_planned_events", "event_portfolio_kpi_approved_budget", "event_portfolio_kpi_registration_rate", "event_portfolio_kpi_lead_follow_up"];
  const allowedKeys = new Set(kpiContracts.map((contract) => contract.key));
  const prune = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      prune(child);
      const matchedCardId = cardIds.find((id) => hasIdentity(child, id));
      if (!matchedCardId) return true;
      const key = matchedCardId.replace("event_portfolio_kpi_", "");
      return allowedKeys.has(key);
    });
  };
  prune(wrapper);
}

function normalizeDashboardFilters({ filters, listMeta, dashboardName }) {
  return [];
}

function materializeDashboardFilters(resource, { filters, listName, listId, filterIdPrefix, datasetRegion, host }) {
  // Page-level select-filter to Collection runtime linkage is intentionally disabled until an
  // export-proven empty-value bypass contract exists. Collection templates still provide proven
  // search-filter/fulltext behavior for generated dashboards.
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
        filter: [],
        datasetRegion,
      },
      filterVar: filter.variable,
    },
  };
}

function materializeDashboardAnalytics(resource, { analyticsRecords, fallbackListMeta, listMetaByName, dashboardName, rootListSetId }) {
  const records = analyticsRecords || [];
  if (!records.length) return [];
  const slots = findDashboardAnalyticsSlots(resource);
  if (!slots.length) return [];
  const runtimeContracts = [];
  records.forEach((record, index) => {
    const sourceMeta = listMetaByName?.get(normKey(record.sourceResource)) || fallbackListMeta;
    const { root: module, runtimeContract } = buildDataAnalyticsTemplateInstance({
      record,
      listMeta: sourceMeta,
      dashboardName,
      instanceIndex: index,
      rootListSetId,
    });
    const slot = slots[index % slots.length];
    slot.children = Array.isArray(slot.children) ? slot.children : [];
    slot.children.push(module);
    if (runtimeContract) runtimeContracts.push(runtimeContract);
  });
  return runtimeContracts;
}

function findDashboardAnalyticsSlots(resource) {
  const allowedSectionIds = new Set(["content_card_wrapper", "2_columns_section", "3_columns_section", "2_columns_60/40_section"]);
  const slots = [];
  for (const section of findDescendants(resource, (node) => [...allowedSectionIds].some((identity) => hasIdentity(node, identity)))) {
    const slot = findFirstByIdentity(section, "section_content_area");
    if (slot) slots.push(slot);
  }
  return slots;
}

function buildDataAnalyticsTemplateInstance({ record, listMeta, dashboardName, instanceIndex, rootListSetId }) {
  const reference = dataAnalyticsReference(record.selectedTemplateId);
  const template = JSON.parse(fs.readFileSync(DATA_ANALYTICS_TEMPLATE_PATHS[record.selectedTemplateId], "utf8"));
  const root = clone(template._ak_c || template.templateResource || template);
  const title = record.businessQuestion || record.analyticsRegion || reference.displayName || "Analytics";
  root.dataAnalyticsTemplateId = record.selectedTemplateId;
  root.templateId = record.selectedTemplateId;
  root.derivedFromDataAnalyticsGoldenReference = record.selectedTemplateId;
  root.attrs = {
    ...(root.attrs || {}),
    dataAnalyticsTemplateId: record.selectedTemplateId,
    templateId: record.selectedTemplateId,
    derivedFromDataAnalyticsGoldenReference: record.selectedTemplateId,
    appPlanAnalyticsRegion: record.analyticsRegion,
  };
  normalizeAnalyticsContainerContracts(root);
  if (root.id) root.id = `${slugify(dashboardName)}_${slugify(record.selectedTemplateId)}_${instanceIndex + 1}`;
  if (reference.titleControlId) setHeadingText(findFirstByIdentity(root, reference.titleControlId), title);
  const analyticsControl = reference.controlType === String(root.type || "")
    ? root
    : findFirstByType(root, reference.controlType);
  let runtimeContract = null;
  if (analyticsControl) {
    const groupingField = resolveAnalyticsField(listMeta, record.groupingFields) || fieldsForDynamicControls(listMeta)[0];
    const valueField = analyticsCountField(listMeta);
    if (!analyticsControl.id || !UUID_CONTROL_ID_RE.test(String(analyticsControl.id))) {
      analyticsControl.id = deterministicUuid(`${dashboardName}:${record.selectedTemplateId}:${instanceIndex}:analytics-control`);
    }
    analyticsControl.dataAnalyticsTemplateId = record.selectedTemplateId;
    analyticsControl.templateId = record.selectedTemplateId;
    analyticsControl.derivedFromDataAnalyticsGoldenReference = record.selectedTemplateId;
    analyticsControl.runtimeModelProven = true;
    analyticsControl.attrs = {
      ...(analyticsControl.attrs || {}),
      dataAnalyticsTemplateId: record.selectedTemplateId,
      templateId: record.selectedTemplateId,
      derivedFromDataAnalyticsGoldenReference: record.selectedTemplateId,
      runtimeModelProven: true,
      data: {
        ...(analyticsControl.attrs?.data || {}),
        list: { AppID: 41, ListID: stringId(listMeta.listId), Type: 1, Title: listMeta.listName },
        source: listMeta.listName,
        sourceResourceType: "Data list",
        fields: [
          { fieldName: groupingField.fieldName, role: "group", displayName: groupingField.displayName },
          { fieldName: valueField.fieldName, role: "value", displayName: valueField.displayName, aggregate: "COUNT" },
        ],
        groupBy: groupingField.fieldName,
        axisField: groupingField.fieldName,
        categoryField: groupingField.fieldName,
        valueField: valueField.fieldName,
        aggregate: "COUNT",
        title,
      },
      model: {
        source: { AppID: 41, ListID: stringId(listMeta.listId), Type: 1, Title: listMeta.listName },
        categoryField: groupingField.fieldName,
        valueField: valueField.fieldName,
        aggregate: "COUNT",
        runtimeModelProven: true,
      },
      series: [
        {
          name: title,
          categoryField: groupingField.fieldName,
          valueField: valueField.fieldName,
          aggregate: "COUNT",
        },
      ],
      rows: analyticsControl.attrs?.rows || { fields: [groupingField.fieldName] },
      columns: analyticsControl.attrs?.columns || { fields: [] },
      values: analyticsControl.attrs?.values || [{ field: valueField.fieldName, aggregate: "COUNT" }],
    };
    runtimeContract = buildDataAnalyticsRuntimeContract({
      controlId: analyticsControl.id,
      reference,
      listMeta,
      rootListSetId,
      groupingField,
      valueField,
      title,
    });
  }
  return { root, runtimeContract };
}

function buildDataAnalyticsRuntimeContract({ controlId, reference, listMeta, rootListSetId, groupingField, valueField, title }) {
  const controlType = String(reference.controlType || "");
  const extKey = controlType === "pivot-table" ? "PivotTable" : controlType;
  const chartType = String(reference.semanticChartKind || controlType || "");
  const rowField = runtimeFieldRef(groupingField, "row");
  const valueRef = {
    ...runtimeFieldRef(valueField, "value"),
    func: "COUNT",
    aggregate: "COUNT",
    label: title,
  };
  const settings = {
    rows: [rowField],
    columns: [],
    values: [valueRef],
  };
  const attr = {
    AppID: 41,
    ListID: stringId(listMeta.listId),
    ListSetID: stringId(rootListSetId),
    settings,
  };
  if (controlType !== "pivot-table") attr.chartType = chartType;
  return {
    controlId,
    ext: {
      i: controlId,
      category: "___Pivot___",
      key: extKey,
      attr,
    },
  };
}

function runtimeFieldRef(field, role) {
  const fieldName = String(field?.fieldName || field?.FieldName || "ListDataID");
  return {
    field: fieldName,
    fieldName,
    FieldName: fieldName,
    id: String(field?.fieldId || field?.FieldID || fieldName),
    label: String(field?.displayName || field?.DisplayName || fieldName),
    role,
  };
}

function analyticsCountField(listMeta) {
  const fields = fieldsForDynamicControls(listMeta);
  const listDataId = fields.find((field) => String(field.fieldName || field.FieldName || "") === "ListDataID");
  return listDataId || {
    fieldName: "ListDataID",
    FieldName: "ListDataID",
    fieldId: "ListDataID",
    FieldID: "ListDataID",
    displayName: "Record ID",
    DisplayName: "Record ID",
    fieldType: "Text",
    FieldType: "Text",
  };
}

function normalizeAnalyticsContainerContracts(root) {
  for (const container of findDescendants(root, (node) => String(node?.type || "") === "container")) {
    container.attrs = container.attrs || {};
    container.attrs.style = {
      ...(container.attrs.style || {}),
      widthtype: normalizeWidthType(container.attrs.style?.widthtype),
      direction: container.attrs.style?.direction || [null, "column"],
      gap: container.attrs.style?.gap || [null, 12],
      align_items: container.attrs.style?.align_items || [null, "stretch"],
      justify_content: container.attrs.style?.justify_content || [null, "flex-start"],
    };
  }
}

function normalizeWidthType(value) {
  if (Array.isArray(value) && ["1", "2", "3"].includes(String(value[1]))) return value;
  return [null, "1"];
}

function resolveAnalyticsField(listMeta, requestedFields) {
  const requested = String(requestedFields || "").split(/[,;/]+/).map((value) => normKey(value)).filter(Boolean);
  const fields = fieldsForDynamicControls(listMeta);
  if (!requested.length) {
    return fields.find((field) => /status|category|type|priority|date|owner|assigned|user/i.test(`${field.displayName} ${field.fieldName}`)) || fields[0] || null;
  }
  return fields.find((field) => requested.some((item) => normKey(field.displayName) === item || normKey(field.fieldName) === item || normKey(field.displayName).includes(item) || item.includes(normKey(field.displayName)))) || fields[0] || null;
}

function dataAnalyticsReference(templateId) {
  if (!dataAnalyticsReference.cache) {
    const registry = JSON.parse(fs.readFileSync(DATA_ANALYTICS_REGISTRY_PATH, "utf8"));
    dataAnalyticsReference.cache = new Map((registry.references || []).map((reference) => [reference.templateId, reference]));
  }
  return dataAnalyticsReference.cache.get(templateId) || { templateId, displayName: templateId, controlType: "bar-chart" };
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

function buildCollectionFullTextConditions(filters) {
  return (filters || []).map((filter) => ({
    fields: [filter.fieldName],
    field: filter.fieldName,
    value: [{ exprType: "variable", valueType: "string", id: `__filter_${filter.variable}`, type: "expr", name: filter.variable }],
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

function buildCollectionTemplateInstance({ templateId, dashboardName, datasetRegion, listName, rootListSetId, listId, listMeta, detailLayoutId, filterBindings, collectionId }) {
  const template = loadCollectionTemplate(templateId);
  const root = clone(template?.templateResource?.rootContainer || {});
  reinstantiateTemplateUuidValues(root);
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
    const fullTextConditions = buildCollectionFullTextConditions(filterBindings);
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
        sort: [{ SortName: primarySortFieldName(listMeta), SortByDesc: false }],
        filter: filterConditions,
        fulltext: fullTextConditions,
        link: detailLink,
        opentype: detailLink ? "slide" : "none",
        modalsize: detailLink ? 2 : null,
        detailOpenBehavior: detailLink ? "slide" : "none",
        disableOpen: !detailLink,
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
  rewriteCollectionTemplateRuntimeRefs(root, { rootListSetId, listId, detailLayoutId });
  const bindableFields = fieldsForDynamicControls(listMeta);
  let dynamicIndex = 0;
  for (const control of findDescendants(root, (node) => String(node?.type || "").startsWith("dynamic-"))) {
    const field = selectFieldForDynamicControl(control, bindableFields, dynamicIndex);
    dynamicIndex += 1;
    control.type = dynamicControlTypeForField(field);
    control.attrs = {
      ...(control.attrs || {}),
      source: "3",
      "obj-f": field.fieldName,
      field: field.fieldName,
      fieldName: field.fieldName,
      data: {
        ...(control.attrs?.data || {}),
        ListID: stringId(listId),
        list: { AppID: 41, ListID: stringId(listId), Type: 1, Title: listName },
        field: field.fieldName,
        fieldName: field.fieldName,
      },
    };
    control.field = field.fieldName;
    control.FieldName = field.fieldName;
    if (control.type === "dynamic-user") {
      control.attrs.user = {
        ...(control.attrs.user || {}),
        field: field.fieldName,
        fieldName: field.fieldName,
      };
    }
    control.name = field.displayName;
    control.title = field.displayName;
    control.label = field.displayName;
    if (control.type !== "dynamic-user") replaceUserLikeDynamicFieldText(control, field.displayName);
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
  sanitizeCollectionRuntimeReferences(root, {
    rootListSetId,
    listId,
    detailLayoutId,
  });
  const pageDependencies = template.pageLevelDependencies || {};
  root.pageLevelDependencies = {
    tempVars: replaceCollectionTemplatePlaceholders(pageDependencies.tempVars || [], { rootListSetId, listId, detailLayoutId }),
    filterVars: replaceCollectionTemplatePlaceholders(pageDependencies.filterVars || [], { rootListSetId, listId, detailLayoutId }),
    actions: replaceCollectionTemplatePlaceholders(pageDependencies.actions || [], { rootListSetId, listId, detailLayoutId }),
    formAction: replaceCollectionTemplatePlaceholders(pageDependencies.formAction || [], { rootListSetId, listId, detailLayoutId }),
  };
  root.generatedFrom = { dashboardName, templateId, sourceResource: listName };
  return root;
}

function reinstantiateTemplateUuidValues(root) {
  const replacements = new Map();
  const visit = (node) => {
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (!node || typeof node !== "object") return;
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "string" && UUID_CONTROL_ID_RE.test(value)) {
        if (!replacements.has(value)) replacements.set(value, crypto.randomUUID());
        node[key] = replacements.get(value);
      } else {
        visit(value);
      }
    }
  };
  visit(root);
  return replacements;
}

function sanitizeCollectionRuntimeReferences(root, { rootListSetId, listId, detailLayoutId }) {
  const removedActionIds = new Set();
  for (const collection of findDescendants(root, (node) => String(node?.type || "") === "collection")) {
    const actions = Array.isArray(collection?.attrs?.actions) ? collection.attrs.actions : [];
    const keptActions = [];
    for (const action of actions) {
      if (!detailLayoutId && isDetailLayoutAction(action)) {
        for (const actionId of actionIdentityCandidates(action)) removedActionIds.add(actionId);
        continue;
      }
      keptActions.push(replaceCollectionTemplatePlaceholders(action, { rootListSetId, listId, detailLayoutId }));
    }
    collection.attrs = collection.attrs || {};
    collection.attrs.actions = keptActions;
  }
  replaceCollectionTemplatePlaceholders(root, { rootListSetId, listId, detailLayoutId }, { mutate: true });
  if (removedActionIds.size) pruneActionButtonsForRemovedActions(root, removedActionIds);
}

function isDetailLayoutAction(action) {
  const text = JSON.stringify(action || {});
  if (text.includes("{{DetailLayoutID}}")) return true;
  return /"op_type"\s*:\s*"edit"/i.test(text) && /"type"\s*:\s*"listitem"/i.test(text);
}

function actionIdentityCandidates(action) {
  return [
    action?.id,
    action?.ID,
    action?.name,
    action?.Name,
    action?.attrs?.id,
    action?.attrs?.name,
    action?.attrs?.control_action,
  ].map((value) => String(value || "").trim()).filter(Boolean);
}

function pruneActionButtonsForRemovedActions(root, removedActionIds) {
  const visit = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      const actionId = String(child?.attrs?.control_action || child?.attrs?.action || child?.control_action || child?.action || "").trim();
      if (String(child?.type || "") === "action_button" && actionId && removedActionIds.has(actionId)) return false;
      visit(child);
      return true;
    });
  };
  visit(root);
}

function replaceCollectionTemplatePlaceholders(value, { rootListSetId, listId, detailLayoutId }, options = {}) {
  const replacements = {
    "{{ListSetID}}": stringId(rootListSetId || ""),
    "{{ListID}}": stringId(listId || ""),
    "{{DetailLayoutID}}": stringId(detailLayoutId || ""),
    "{{sourceLongId}}": stringId(detailLayoutId || ""),
  };
  const visit = (node) => {
    if (typeof node === "string") {
      let out = node;
      for (const [token, replacement] of Object.entries(replacements)) out = out.split(token).join(replacement);
      return out;
    }
    if (Array.isArray(node)) {
      for (let index = 0; index < node.length; index += 1) node[index] = visit(node[index]);
      return node;
    }
    if (node && typeof node === "object") {
      for (const [key, child] of Object.entries(node)) node[key] = visit(child);
      return node;
    }
    return node;
  };
  const target = options.mutate ? value : clone(value);
  return visit(target);
}

function replaceUserLikeDynamicFieldText(control, replacement) {
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "string" && /\b(user|owner|assignee|requester|borrower|manager|approver|employee|person|people|accountid|account id)\b/i.test(value)) {
        node[key] = replacement;
      } else if (value && typeof value === "object") {
        visit(value);
      }
    }
  };
  visit(control);
}

function selectFieldForDynamicControl(control, fields, index) {
  const type = String(control?.type || "");
  if (type === "dynamic-user") return fields.find((field) => dynamicControlTypeForField(field) === "dynamic-user") || fields[index % fields.length] || fields[0];
  if (type === "dynamic-image") return fields.find((field) => dynamicControlTypeForField(field) === "dynamic-image") || fields[index % fields.length] || fields[0];
  if (type === "dynamic-file") return fields.find((field) => dynamicControlTypeForField(field) === "dynamic-file") || fields[index % fields.length] || fields[0];
  return fields[index % fields.length] || fields[0];
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
  if (templateId === "Event Pipeline Grid-Table") {
    return { ...template, templateId };
  }
  return template;
}

function rewriteCollectionTemplateRuntimeRefs(node, { rootListSetId, listId, detailLayoutId }) {
  const rootId = stringId(rootListSetId);
  const sourceListId = stringId(listId);
  const layoutId = stringId(detailLayoutId);
  const layoutPlaceholderPattern = /\{\{(?:DetailLayoutID|LayoutID|layoutId|layout|PageID|pageId)\}\}/g;
  const layoutPlaceholderTestPattern = /\{\{(?:DetailLayoutID|LayoutID|layoutId|layout|PageID|pageId)\}\}/;
  const isLayoutRefKey = (key) => /^(?:link|layout|LayoutID|layoutId|PageID|pageId)$/i.test(key);
  const hasLayoutPlaceholder = (value) => typeof value === "string" && layoutPlaceholderTestPattern.test(value);
  const replaceLayoutPlaceholders = (value) => String(value).replace(layoutPlaceholderPattern, layoutId);
  const visit = (value, key = "") => {
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) value[index] = visit(value[index], key);
      return value;
    }
    if (!value || typeof value !== "object") {
      if (typeof value !== "string") return value;
      let out = value
        .replaceAll("{{ListSetID}}", rootId)
        .replaceAll("{{ListID}}", sourceListId)
        .replaceAll("{{DetailLayoutID}}", layoutId);
      out = replaceLayoutPlaceholders(out);
      for (const oldId of SOURCE_COLLECTION_TEMPLATE_IDS.listSetIds) out = out.replaceAll(oldId, rootId);
      for (const oldId of SOURCE_COLLECTION_TEMPLATE_IDS.listIds) out = out.replaceAll(oldId, sourceListId);
      if ((isLayoutRefKey(key) || hasLayoutPlaceholder(value)) && !layoutId) {
        return "";
      }
      return out;
    }
    for (const [childKey, child] of Object.entries(value)) {
      if (/^ListSetID$/i.test(childKey) && typeof child === "string" && (SOURCE_COLLECTION_TEMPLATE_IDS.listSetIds.has(child) || /\{\{ListSetID\}\}/.test(child))) {
        value[childKey] = rootId;
      } else if (/^ListID$/i.test(childKey) && typeof child === "string" && (SOURCE_COLLECTION_TEMPLATE_IDS.listIds.has(child) || /\{\{ListID\}\}/.test(child))) {
        value[childKey] = sourceListId;
      } else if (isLayoutRefKey(childKey) && typeof child === "string" && hasLayoutPlaceholder(child)) {
        value[childKey] = layoutId ? replaceLayoutPlaceholders(child) : "";
      } else {
        value[childKey] = visit(child, childKey);
      }
    }
    return value;
  };
  return visit(node);
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
  const removableWrappers = new Set(["content_card_wrapper", "content_card_60_wrapper", "content_card_40_wrapper", "1_columns_section", "2_columns_section", "3_columns_section", "2_columns_60/40_section", "1_row_section", "2_rows_section", "3_rows_section", "chart_cards_section", "right_side_panel"]);
  const visit = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      visit(child);
      if (hasIdentity(child, "section_content_area") && !hasMeaningfulBusinessContent(child)) return false;
      if (![...removableWrappers].some((identity) => hasIdentity(child, identity))) return true;
      return hasMeaningfulBusinessContent(child);
    });
  };
  visit(root);
}

function removeEmptyDashboardBusinessSections(root) {
  const removableWrappers = new Set(["content_card_wrapper", "content_card_60_wrapper", "content_card_40_wrapper", "1_columns_section", "2_columns_section", "3_columns_section", "2_columns_60/40_section", "kpi_metrics_wrapper"]);
  const visit = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      visit(child);
      if (hasIdentity(child, "section_content_area") && !hasMeaningfulBusinessContent(child)) return false;
      if (![...removableWrappers].some((identity) => hasIdentity(child, identity))) return true;
      return hasMeaningfulBusinessContent(child);
    });
  };
  visit(root);
}

function removeUnusedApprovalTemplateSections(root) {
  const removableModules = new Set(["content_card_wrapper", "content_card_60_wrapper", "content_card_40_wrapper", "1_columns_section", "2_columns_section", "3_columns_section", "2_columns_60/40_section"]);
  const visit = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      visit(child);
      if (![...removableModules].some((identity) => hasIdentity(child, identity))) return true;
      if (findFirstByIdentity(child, "action_panel_flow_history_wrapper")) return true;
      return hasMeaningfulBusinessContent(child);
    });
  };
  visit(root);
}

function hasMeaningfulBusinessContent(node) {
  if (!node || typeof node !== "object") return false;
  if (node.approvalFormNoFieldsNotice === true) return true;
  if (!Array.isArray(node.children) || node.children.length === 0) return false;
  return findDescendants(node, (control) => {
    const type = String(control?.type || "");
    if (control?.approvalFormNoFieldsNotice === true) return true;
    if (["collection", "summary", "data-filter", "select-filter", "radio-filter", "checkbox-filter", "search-filter", "pie-chart", "column-chart", "bar-chart", "line-chart", "area-chart", "pivot-table", "dynamic-field", "dynamic-user", "dynamic-image", "dynamic-file"].includes(type)) return true;
    if (type === "button" && hasActionConfiguration(control)) return true;
    if (["event_portfolio_kpi_planned_events", "event_portfolio_kpi_approved_budget", "event_portfolio_kpi_registration_rate", "event_portfolio_kpi_lead_follow_up"].some((identity) => hasIdentity(control, identity))) return true;
    if (hasIdentity(control, "form_grid_fields_wrapper")) return true;
    if (hasIdentity(control, "form_grid_fields_2col_wrapper")) return true;
    if (hasIdentity(control, "form_grid_fields_3col_wrapper")) return true;
    if (["input", "textarea", "richtext", "rich-text", "radio", "checkbox", "switch", "date", "datetime", "number", "input_number", "lookup", "people", "user"].includes(type)) return true;
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
  for (const wrapperId of ["content_card_wrapper", "content_card_60_wrapper", "content_card_40_wrapper"]) {
    const contentCardWrappers = findDescendants(root, (node) => hasIdentity(node, wrapperId));
    for (const wrapper of contentCardWrappers) {
      const slot = findFirstByIdentity(wrapper, "section_content_area");
      if (slot) return slot;
    }
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
    control?.attrs?.approvalFormLayoutTemplateId,
    control?.attrs?.derivedFromApprovalFormLayoutTemplate,
    control?.templateMarker,
    control?.derivedFromDashboardPageLayoutTemplate,
    control?.dataListFormLayoutTemplateId,
    control?.derivedFromDataListFormLayoutTemplate,
    control?.approvalFormLayoutTemplateId,
    control?.derivedFromApprovalFormLayoutTemplate,
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

function workflowUserLineManagerExpression(variableId, label) {
  return `<input type="button" data="\${ &quot;type&quot;:&quot;user&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;\${\\&quot;type\\&quot;:\\&quot;variable\\&quot;, \\&quot;param\\&quot;:{\\&quot;id\\&quot;:\\&quot;${variableId}\\&quot;}}&quot;},&quot;prop&quot;:&quot;LineManager&quot;}" expr="__" tabindex="-1" value="Workflow Variables:${label}:Line Manager">`;
}

function workflowTaskOutcomeExpression(taskId, taskLabel) {
  return `<input type="button" data="\${ &quot;type&quot;:&quot;task&quot;, &quot;param&quot;:{&quot;defid&quot;:&quot;${taskId}&quot;}, &quot;prop&quot;:&quot;Outcome&quot;}" expr="__" tabindex="-1" value="${taskLabel}:Outcome">`;
}

function workflowOutcomeButton(outcome) {
  return `<input type="button" data="${outcome}" value="Task outcome:${outcome}">`;
}

function workflowOutcomeCondition({ key, taskId, taskLabel, outcome }) {
  return {
    key,
    pre: "and",
    left: workflowTaskOutcomeExpression(taskId, taskLabel),
    op: "s.=",
    right: workflowOutcomeButton(outcome),
  };
}

function approvalWorkflowIds(defId, formKey) {
  const seed = `${defId}:${formKey}`;
  return {
    submissionPageId: deterministicUuid(`${seed}:submission-page`),
    taskPageId: deterministicUuid(`${seed}:task-page`),
    startId: deterministicUuid(`${seed}:start`),
    flowId: deterministicUuid(`${seed}:flow-start-task`),
    taskId: deterministicUuid(`${seed}:assignment-task`),
    approvedFlowId: deterministicUuid(`${seed}:flow-approved`),
    rejectedFlowId: deterministicUuid(`${seed}:flow-rejected`),
    endId: deterministicUuid(`${seed}:end-approved`),
    rejectEndId: deterministicUuid(`${seed}:end-rejected`),
  };
}

function flowRef(resourceid) {
  return { id: resourceid, resourceid };
}

function buildApprovalDefResource({ name, formKey, defId, rootListSetId, approvalFieldSpecs = {} }) {
  const {
    submissionPageId,
    taskPageId,
    startId,
    flowId,
    taskId,
    approvedFlowId,
    rejectedFlowId,
    endId,
    rejectEndId,
  } = approvalWorkflowIds(defId, formKey);
  const taskName = "Line manager approval";
  return {
    id: defId,
    key: formKey,
    defkey: formKey,
    name,
    title: name,
    workflowType: 2,
    AppListSetID: stringId(rootListSetId),
    ProcModelAppID: 41,
    ProcModelListID: "0",
    ProcModelListSetID: stringId(rootListSetId),
    ext: {},
    lineType: "orthogonal",
    iconURL: "",
    flowPage: [],
    variables: buildApprovalVariables(approvalFieldSpecs),
    graphposition: { x: 0, y: 0, width: 960, height: 420 },
    graphzoom: 1,
    graphver: 1,
    pageurls: [
      {
        id: submissionPageId,
        key: submissionPageId,
        pageUrl: submissionPageId,
        pageurl: submissionPageId,
        PageUrl: submissionPageId,
        url: submissionPageId,
        type: 1,
        pagetype: 1,
        name: "Submission form",
        title: "Submission form",
        formdef: approvalFormDef(submissionPageId, name, "submission", approvalFieldSpecs.submission || []),
      },
      {
        id: taskPageId,
        key: taskPageId,
        pageUrl: taskPageId,
        pageurl: taskPageId,
        PageUrl: taskPageId,
        url: taskPageId,
        type: 2,
        pagetype: 1,
        name: "Task form",
        title: "Task form",
        formdef: approvalFormDef(taskPageId, name, "task", approvalTaskFieldSpecs(approvalFieldSpecs)),
      },
    ],
    childshapes: [
      {
        id: startId,
        resourceid: startId,
        stencil: { id: "StartNoneEvent" },
        position: { x: 100, y: 150 },
        incoming: [],
        outgoing: [flowRef(flowId)],
        properties: { name: "Start", taskurl: submissionPageId, taskUrl: submissionPageId, TaskUrl: submissionPageId },
      },
      {
        id: flowId,
        resourceid: flowId,
        stencil: { id: "SequenceFlow" },
        source: flowRef(startId),
        target: flowRef(taskId),
        incoming: [flowRef(startId)],
        outgoing: [flowRef(taskId)],
        properties: { name: "Submit" },
        dockers: [{ x: 130, y: 165 }, { x: 360, y: 145 }],
      },
      {
        id: taskId,
        resourceid: taskId,
        stencil: { id: "MultiAssignmentTask" },
        position: { x: 360, y: 110 },
        incoming: [flowRef(flowId)],
        outgoing: [flowRef(approvedFlowId), flowRef(rejectedFlowId)],
        properties: {
          name: taskName,
          pagetype: 1,
          taskurl: taskPageId,
          taskUrl: taskPageId,
          TaskUrl: taskPageId,
          approveway: "anyapprove",
          approvepercentage: 100,
          usertaskassignment: [
            {
              type: "user",
              method: "expression",
              title: `User:${workflowUserLineManagerExpression("ApplicantUserID", "Applicant")}`,
              value: workflowUserLineManagerExpression("ApplicantUserID", "Applicant"),
            },
          ],
        },
      },
      {
        id: approvedFlowId,
        resourceid: approvedFlowId,
        stencil: { id: "SequenceFlow" },
        source: flowRef(taskId),
        target: flowRef(endId),
        incoming: [flowRef(taskId)],
        outgoing: [flowRef(endId)],
        properties: {
          name: "Approved",
          linetype: "rounded",
          conditioninfo: [workflowOutcomeCondition({ key: approvedFlowId, taskId, taskLabel: taskName, outcome: "Approved" })],
        },
        dockers: [{ x: 480, y: 130 }, { x: 700, y: 100 }],
      },
      {
        id: rejectedFlowId,
        resourceid: rejectedFlowId,
        stencil: { id: "SequenceFlow" },
        source: flowRef(taskId),
        target: flowRef(rejectEndId),
        incoming: [flowRef(taskId)],
        outgoing: [flowRef(rejectEndId)],
        properties: {
          name: "Rejected",
          linetype: "rounded",
          conditioninfo: [workflowOutcomeCondition({ key: rejectedFlowId, taskId, taskLabel: taskName, outcome: "Rejected" })],
        },
        dockers: [{ x: 480, y: 170 }, { x: 700, y: 240 }],
      },
      {
        id: endId,
        resourceid: endId,
        stencil: { id: "EndNoneEvent" },
        position: { x: 700, y: 80 },
        incoming: [flowRef(approvedFlowId)],
        outgoing: [],
        properties: { name: "End" },
      },
      {
        id: rejectEndId,
        resourceid: rejectEndId,
        stencil: { id: "EndRejectEvent" },
        position: { x: 700, y: 220 },
        incoming: [flowRef(rejectedFlowId)],
        outgoing: [],
        properties: { name: "Rejected" },
      },
    ],
  };
}

function approvalTaskFieldSpecs(approvalFieldSpecs = {}) {
  const submissionFields = Array.isArray(approvalFieldSpecs.submission) ? approvalFieldSpecs.submission : [];
  const taskOnlyFields = Array.isArray(approvalFieldSpecs.task) ? approvalFieldSpecs.task : [];
  return uniqueApprovalFieldSpecs([...submissionFields, ...taskOnlyFields]);
}

function buildApprovalVariables(approvalFieldSpecs = {}) {
  const fields = uniqueApprovalFieldSpecs([...(approvalFieldSpecs.submission || []), ...(approvalFieldSpecs.task || [])]);
  const basic = [
    { id: "Applicant", idx: "Applicant", name: "Applicant", title: "Applicant", type: "user", source: "Applicant" },
    { id: "ApplicantUserID", idx: "ApplicantUserID", name: "ApplicantUserID", title: "Applicant", type: "user", source: "ApplicantUserID" },
    { id: "requestTitle", idx: "requestTitle", name: "requestTitle", title: "Request Title", type: "text", source: "Title" },
  ];
  for (const field of fields) {
    const id = String(field.fieldName || slugify(field.displayName));
    basic.push({
      id,
      idx: id,
      name: id,
      title: field.displayName,
      label: field.displayName,
      type: approvalVariableType(field),
      source: field.fieldName,
    });
  }
  return { basic: uniqueVariablesById(basic), listref: [], filter: [], tempVars: [] };
}

function uniqueVariablesById(variables) {
  const seen = new Set();
  const out = [];
  for (const variable of variables) {
    const key = String(variable?.id || "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(variable);
  }
  return out;
}

function approvalFormDef(id, title, role, fields = []) {
  const templateId = role === "task" ? APPROVAL_FORM_TEMPLATE_IDS.task : APPROVAL_FORM_TEMPLATE_IDS.submission;
  const templatePath = role === "task" ? APPROVAL_FORM_TEMPLATE_PATHS.task : APPROVAL_FORM_TEMPLATE_PATHS.submission;
  const raw = JSON.parse(fs.readFileSync(templatePath, "utf8"));
  const resource = clone(raw.templateResource);
  resource.id = id;
  resource.title = role === "task" ? `${title} Task` : `${title} Submission`;
  resource.name = resource.title;
  resource.approvalFormLayoutTemplateId = templateId;
  resource.derivedFromApprovalFormLayoutTemplate = templateId;
  resource.approvalFormLayoutRole = role;
  setTemplateText(resource, "page_title_text", resource.title);
  setTemplateText(resource, "page_title_description", role === "task" ? `Review and act on ${title}.` : `Submit ${title}.`);
  setTemplateText(resource, "section_title_text", role === "task" ? "Review Details" : "Request Details");
  setTemplateText(resource, "section_title_description", role === "task" ? `Review submitted ${title} information before taking action.` : `Complete the required ${title} information.`);
  materializeApprovalFieldControls(resource, { fields, title, role });
  ensureApprovalBusinessSection(resource, { title, role });
  removeOperationsWithoutActions(resource);
  removeUnusedApprovalTemplateSections(resource);
  scrubApprovalSourceDomainResidue(resource, title);
  instantiateDashboardControlUuids(resource, `${slugify(title)}-${role}-approval-form`);
  resource.id = id;
  return resource;
}

function scrubApprovalSourceDomainResidue(node, title) {
  const replacements = [
    [/Active Loan Pipeline/g, `${title} Details`],
    [/Loan Status/g, "Request Status"],
    [/\bPipeline\b/g, "Workflow"],
  ];
  const visit = (value) => {
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) value[index] = visit(value[index]);
      return value;
    }
    if (!value || typeof value !== "object") {
      if (typeof value !== "string") return value;
      return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
    }
    if (value.approvalFieldMaterializedFromPlan === true) return value;
    for (const [key, child] of Object.entries(value)) {
      if (key === "id") continue;
      value[key] = visit(child);
    }
    return value;
  };
  visit(node);
}

function materializeApprovalFieldControls(resource, { fields, title, role }) {
  const normalizedFields = uniqueApprovalFieldSpecs(fields);
  const slot = findBusinessSectionContentArea(resource);
  if (!slot) return;
  slot.children = normalizedFields.length
    ? [buildApprovalFormFieldsGrid({ fields: normalizedFields, formName: title, role })]
    : [buildApprovalNoFieldsNotice({ title, role })];
}

function ensureApprovalBusinessSection(resource, { title, role }) {
  const wrappers = findDescendants(resource, (node) => hasIdentity(node, "content_card_wrapper"));
  if (wrappers.some((wrapper) => hasMeaningfulBusinessContent(wrapper))) return;
  const wrapper = wrappers[0];
  const slot = wrapper ? findFirstByIdentity(wrapper, "section_content_area") : findBusinessSectionContentArea(resource);
  if (!slot) return;
  slot.children = [buildApprovalNoFieldsNotice({ title, role })];
}

function buildApprovalNoFieldsNotice({ title, role }) {
  return {
    id: deterministicUuid(`${slugify(title)}-${role}-approval-no-additional-fields`),
    name: "No additional fields required",
    title: "No additional fields required",
    label: "No additional fields required",
    nv_label: "approval_no_additional_fields_required",
    type: "heading",
    approvalFormNoFieldsNotice: true,
    attrs: {
      heads: { ty: [null, "body-medium"], color: "#64748b" },
      headc: {
        title: {
          value: role === "task"
            ? "No additional task fields are required. Use the action panel below to complete the workflow task."
            : "No additional submission fields are required for this approval form.",
        },
      },
    },
  };
}

function buildApprovalFormFieldsGrid({ fields, formName, role }) {
  const useThreeColumns = fields.length >= 8;
  const templateId = useThreeColumns ? "approval_form_fields_grid_3col_v1_1" : "approval_form_fields_grid_2col_v1_1";
  const templatePath = useThreeColumns
    ? path.join(ROOT, "docs/reference/approval-form-fields-grid-3col.template.json")
    : path.join(ROOT, "docs/reference/approval-form-fields-grid-2col.template.json");
  const raw = JSON.parse(fs.readFileSync(templatePath, "utf8"));
  const wrapper = clone(raw._ak_c || raw.templateResource || raw);
  const wrapperIdentity = useThreeColumns ? "form_grid_fields_3col_wrapper" : "form_grid_fields_2col_wrapper";
  wrapper.id = deterministicUuid(`${slugify(formName)}-${role}-${wrapperIdentity}`);
  wrapper.nv_label = wrapperIdentity;
  wrapper.approvalFormFieldsTemplateId = templateId;
  wrapper.derivedFromApprovalFormFieldsTemplate = templateId;
  wrapper.children = fields.map((field, index) => buildApprovalFormFieldControl({ field, index, formName, role, columns: useThreeColumns ? 3 : 2 }));
  return wrapper;
}

function buildApprovalFormFieldControl({ field, index, formName, role, columns }) {
  const type = normalizeApprovalControlType(field);
  const fullRow = isFullRowApprovalField(field, type);
  const control = {
    type,
    id: deterministicUuid(`${slugify(formName)}-${role}-approval-field-${index + 1}-${field.fieldName}`),
    name: field.displayName,
    title: field.displayName,
    label: field.displayName,
    displayLabel: [null, true],
    nv_label: `approval_field_${slugify(field.displayName).replace(/-/g, "_")}`,
    binding: field.fieldName,
    fieldName: field.fieldName,
    approvalFieldMaterializedFromPlan: true,
    attrs: {
      common: {
        margin: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }],
      },
      placeholder: `Enter ${field.displayName}`,
      data: {
        field: field.fieldName,
        fieldName: field.fieldName,
        displayName: field.displayName,
        variableType: field.fieldType,
      },
    },
  };
  if (role === "task") {
    control.readonly = true;
    control.readOnly = true;
    control.attrs.readonly = true;
    control.attrs.readOnly = true;
  }
  if (type === "radio" || type === "select") {
    control.attrs.displayStyle = "dropdown";
    control.attrs.choices = inferChoiceValues(field);
    control.attrs.color_choices = control.attrs.choices.map((value) => ({ value, key: deterministicUuid(`${control.id}-${value}`) }));
  }
  if (fullRow) control.attrs.common.grid = { position: [null, { cSpan: columns }, { cSpan: Math.min(columns, 2) }, { cSpan: 1 }] };
  return control;
}

function normalizeApprovalControlType(field) {
  const raw = normKey(`${field?.controlType || ""} ${field?.fieldType || ""} ${field?.displayName || ""}`);
  if (/sub\s*list|detail\s*list|line\s*items?/.test(raw)) return "list";
  if (/rich\s*text|html/.test(raw)) return "richtext";
  if (/multi(?:ple)?\s*line|long\s*text|paragraph|purpose|justification|description|notes?/.test(raw)) return "textarea";
  if (/user|identity|people|person|traveler|requester|approver|manager/.test(raw)) return "identity-picker";
  if (/image|photo|picture/.test(raw)) return "image-upload";
  if (/file|attachment|document/.test(raw)) return "file-upload";
  if (/date|datetime|time/.test(raw)) return "datepicker";
  if (/currency|cost|amount|budget|price|fee/.test(raw)) return "currency";
  if (/decimal|number|integer|quantity|count|hours?/.test(raw)) return "input_number";
  if (/bit|boolean|yes\/no|switch/.test(raw)) return "switch";
  if (/choice|select|dropdown|radio|status|category|type|priority/.test(raw)) return "radio";
  return "input";
}

function approvalVariableType(field) {
  const type = normalizeApprovalControlType(field);
  if (type === "datepicker") return "date";
  if (type === "currency" || type === "input_number") return "number";
  if (type === "switch") return "boolean";
  if (type === "identity-picker") return "user";
  if (type === "list") return "sublist";
  return "text";
}

function isFullRowApprovalField(field, controlType) {
  const raw = normKey(`${field?.fieldType || ""} ${field?.controlType || ""} ${field?.displayName || ""}`);
  return controlType === "textarea" || controlType === "richtext" || controlType === "list" || /business purpose|justification|description|notes?/.test(raw);
}

function listInfo({ listId, title, type, ext2 = "", iconUrl = "", layoutView = null }) {
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
    LayoutView: type === 1 ? layoutView : "",
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
  const typeShape = normKey(`${field?.FieldType || ""} ${field?.Type || ""} ${field?.fieldType || ""} ${field?.controlType || ""}`);
  const fieldName = normKey(`${field?.FieldName || ""} ${field?.fieldName || ""}`);
  if (/user|identity|people|person/.test(typeShape) || /^(user|identity|person|people)\d*$/.test(fieldName)) return "dynamic-user";
  if (/image|photo|picture/.test(typeShape) || /^(image|photo|picture)\d*$/.test(fieldName)) return "dynamic-image";
  if (/file|attachment/.test(typeShape) || /^(file|attachment)\d*$/.test(fieldName)) return "dynamic-file";
  return "dynamic-field";
}

function fieldsForDynamicControls(listMeta) {
  const rawFields = listMeta?.fields || [];
  const fields = rawFields.map((field) => ({
    fieldName: field.FieldName || field.fieldName || "Title",
    displayName: field.DisplayName || field.displayName || field.FieldName || "Title",
    fieldType: field.FieldType || field.fieldType || "Text",
    controlType: field.Type || field.controlType || "",
    Type: field.Type || field.controlType || "",
  }));
  return fields.length ? fields : [{ fieldName: "Title", displayName: "Title", fieldType: "Text" }];
}

function primaryFieldName(listMeta) {
  const fields = fieldsForDynamicControls(listMeta);
  return (fields.find((field) => field.fieldName === "Title") || fields[0]).fieldName;
}

function primarySortFieldName(listMeta) {
  const fields = fieldsForDynamicControls(listMeta);
  const dateField = fields.find((field) => /datetime|date|modified|created|due|start|end/i.test(`${field.fieldName} ${field.displayName} ${field.fieldType} ${field.controlType}`));
  if (dateField) return dateField.fieldName;
  return primaryFieldName(listMeta);
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

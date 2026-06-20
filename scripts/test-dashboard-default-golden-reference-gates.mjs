#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const SCRIPT = "scripts/validate-dashboard-golden-reference-registry.mjs";

function writeJson(dir, name, value) {
  const file = path.join(dir, `${name}.json`);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
}

function run(args) {
  const result = spawnSync(process.execPath, [SCRIPT, ...args, "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  const report = JSON.parse(result.stdout || "{}");
  return { result, report };
}

function expectPass(args) {
  const { result, report } = run(args);
  assert.equal(result.status, 0, `${args.join(" ")} should pass\n${result.stdout}\n${result.stderr}`);
  assert.equal(report.status, "pass");
}

function expectFail(args, code) {
  const { result, report } = run(args);
  assert.notEqual(result.status, 0, `${args.join(" ")} should fail`);
  assert.equal((report.findings || []).some((finding) => finding.code === code), true, `expected ${code}; findings: ${JSON.stringify(report.findings, null, 2)}`);
}

function facilityTrace(overrides = {}) {
  return {
    dashboardName: "Facility Operations Dashboard",
    appDomain: "facility maintenance",
    dashboardGoldenReference: "event_portfolio_dashboard_golden_reference",
    referencesUsed: [
      "dashboard_default_shell_event_portfolio_ref",
      "dashboard_header_band_event_portfolio_ref",
      "dashboard_filter_group_event_portfolio_ref",
      "dashboard_kpi_cards_event_portfolio_ref",
      "dashboard_content_section_event_portfolio_ref",
      "dashboard_collection_grid_table_event_portfolio_ref",
    ],
    structure: {
      mainContainerId: "Main",
      contentContainerId: "Content",
    },
    requirements: {
      filtersRequired: true,
      summaryMetricsRequired: true,
      portfolioRegionRequired: true,
      rowActionsRequired: true,
    },
    appPlanFields: [
      "Request Title",
      "Maintenance Status",
      "Building Zone",
      "Due Date",
      "SLA Percent",
      "Priority",
      "Assigned Technician",
      "Health Indicator",
    ],
    filterBindings: [
      { filterName: "Status", sourceList: "Maintenance Requests", fieldName: "Maintenance Status", targetRegions: ["Work Queue"] },
      { filterName: "Building Zone", sourceList: "Maintenance Requests", fieldName: "Building Zone", targetRegions: ["KPI Cards", "Work Queue"] },
    ],
    kpiMetrics: [
      { metricName: "Open Requests", sourceList: "Maintenance Requests", sourceFields: ["Maintenance Status"], calculation: "Count open statuses" },
      { metricName: "SLA At Risk", sourceList: "Maintenance Requests", sourceFields: ["SLA Percent", "Due Date"], calculation: "Count requests below SLA threshold or overdue" },
    ],
    gridTableCollection: {
      sourceList: "Maintenance Requests",
      currentItemContext: true,
      displayFields: ["Request Title", "Maintenance Status", "Building Zone", "Due Date", "SLA Percent", "Priority", "Assigned Technician", "Health Indicator"],
      openingBehavior: "slide detail",
    },
    mappedFields: ["Request Title", "Maintenance Status", "Building Zone", "Due Date", "SLA Percent", "Priority", "Assigned Technician", "Health Indicator"],
    itemTemplateDynamicControls: [
      { type: "Dynamic field", field: "Request Title" },
      { type: "Dynamic field", field: "Maintenance Status", treatment: "badge" },
      { type: "Progress", field: "SLA Percent" },
      { type: "Dynamic user", field: "Assigned Technician" },
    ],
    rowActions: [
      { label: "Open Request", actionTypeCode: "6", targetResourceName: "Facility Request Detail", rowContext: "current item" },
    ],
    ...overrides,
  };
}

function facilitySelection(overrides = {}) {
  const trace = facilityTrace();
  return {
    selectionId: "DGRS-FACILITY-OPERATIONS",
    dashboardPageId: "DASH-FACILITY-OPERATIONS",
    dashboardPageName: "Facility Operations Dashboard",
    sourcePageFunctionPlanId: "PFP-DASH-FACILITY-OPERATIONS",
    appDomain: "facility maintenance",
    selectedPageGoldenReferenceId: "event_portfolio_dashboard_golden_reference",
    selectedSectionGoldenReferenceIds: trace.referencesUsed,
    pageShellRef: "dashboard_default_shell_event_portfolio_ref",
    headerAreaRef: "dashboard_header_band_event_portfolio_ref",
    filterAreaRef: "dashboard_filter_group_event_portfolio_ref",
    kpiAreaRef: "dashboard_kpi_cards_event_portfolio_ref",
    contentSectionRef: "dashboard_content_section_event_portfolio_ref",
    gridTableRegionRef: "dashboard_collection_grid_table_event_portfolio_ref",
    structure: trace.structure,
    requirements: trace.requirements,
    appPlanFields: trace.appPlanFields,
    filters: trace.filterBindings,
    metrics: trace.kpiMetrics,
    actions: trace.rowActions,
    mappedFields: trace.mappedFields,
    itemTemplateDynamicControls: trace.itemTemplateDynamicControls,
    regionMappings: [
      {
        pfpRegionId: "PFP-REGION-HEADER",
        pfpRegionName: "Dashboard Header",
        goldenReferenceSectionId: "dashboard_header_band_event_portfolio_ref",
        sourceDataList: "Maintenance Requests",
        fields: ["Request Title"],
        actions: [{ label: "Create Request", actionTypeCode: "5", targetResourceName: "Maintenance Requests" }],
      },
      {
        pfpRegionId: "PFP-REGION-FILTERS",
        pfpRegionName: "Page Filters",
        goldenReferenceSectionId: "dashboard_filter_group_event_portfolio_ref",
        sourceDataList: "Maintenance Requests",
        fields: ["Maintenance Status", "Building Zone"],
        filters: trace.filterBindings,
      },
      {
        pfpRegionId: "PFP-REGION-KPIS",
        pfpRegionName: "Summary Metrics",
        goldenReferenceSectionId: "dashboard_kpi_cards_event_portfolio_ref",
        sourceDataList: "Maintenance Requests",
        fields: ["Maintenance Status", "SLA Percent", "Due Date"],
        metrics: trace.kpiMetrics,
      },
      {
        pfpRegionId: "PFP-REGION-WORK-QUEUE",
        pfpRegionName: "Maintenance Work Queue",
        goldenReferenceSectionId: "dashboard_collection_grid_table_event_portfolio_ref",
        sourceDataList: "Maintenance Requests",
        fields: trace.gridTableCollection.displayFields,
        displayFields: trace.gridTableCollection.displayFields,
        actions: trace.rowActions,
        dynamicControls: trace.itemTemplateDynamicControls,
      },
    ],
    ...overrides,
  };
}

function facilityBlueprint(overrides = {}) {
  const selection = facilitySelection();
  return {
    blueprintId: "BP-FACILITY-OPERATIONS",
    dashboardGoldenReferenceSelectionRef: selection.selectionId,
    sections: selection.regionMappings.map((mapping) => ({
      sectionId: mapping.pfpRegionId,
      name: mapping.pfpRegionName,
      derivedFromGoldenReference: mapping.goldenReferenceSectionId,
      sourceDataList: mapping.sourceDataList,
      fields: mapping.fields,
      filters: mapping.filters,
      metrics: mapping.metrics,
      actions: mapping.actions,
      displayFields: mapping.displayFields,
      dynamicControlIntent: mapping.dynamicControls,
    })),
    ...overrides,
  };
}

function facilityResource(overrides = {}) {
  const selection = facilitySelection();
  return {
    resourceId: "RESOURCE-FACILITY-OPERATIONS",
    dashboardGoldenReferenceSelectionRef: selection.selectionId,
    structure: { mainContainerId: "Main", contentContainerId: "Content" },
    referencesUsed: selection.selectedSectionGoldenReferenceIds,
    majorSections: [
      "Main",
      "Content",
      "event_portfolio_header_band",
      "event_portfolio_filter_group",
      "kpi_cards_wrapper",
      "event_portfolio_pipeline_section",
      "Event Pipeline Grid-Table",
    ],
    appPlanFields: selection.appPlanFields,
    mappedFields: selection.mappedFields,
    itemTemplateDynamicControls: selection.itemTemplateDynamicControls,
    rowActions: selection.actions,
    generatedSections: selection.regionMappings.map((mapping) => ({
      id: mapping.pfpRegionId,
      derivedFromGoldenReference: mapping.goldenReferenceSectionId,
      sourceDataList: mapping.sourceDataList,
      fields: mapping.fields,
    })),
    ...overrides,
  };
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-golden-ref-"));
const results = [];

try {
  expectPass(["--registry", "docs/reference/dashboard-golden-reference-registry.normalized.json"]);
  results.push({ case: "golden reference registry is present and valid", status: "pass" });

  expectPass(["--dashboard-trace", writeJson(tmp, "facility-valid", facilityTrace())]);
  results.push({ case: "Facility Maintenance dashboard maps into Event Portfolio default structure", status: "pass" });

  const selectionFile = writeJson(tmp, "facility-selection", facilitySelection());
  expectPass(["--dashboard-selection", selectionFile]);
  results.push({ case: "Dashboard Golden Reference Selection artifact passes", status: "pass" });

  expectPass(["--dashboard-selection", selectionFile, "--dashboard-blueprint", writeJson(tmp, "facility-blueprint", facilityBlueprint())]);
  results.push({ case: "Dashboard blueprint references selection and section provenance", status: "pass" });

  expectPass(["--dashboard-selection", selectionFile, "--dashboard-resource", writeJson(tmp, "facility-resource", facilityResource())]);
  results.push({ case: "Generated dashboard resource trace proves selected reference structure", status: "pass" });

  expectFail(["--dashboard-trace", writeJson(tmp, "missing-shell", facilityTrace({ structure: { mainContainerId: "Page", contentContainerId: "Body" } }))], "DASHBOARD_TRACE_MAIN_CONTENT_STRUCTURE_MISSING");
  results.push({ case: "missing Main / Content shell fails", status: "pass" });

  expectFail(["--dashboard-trace", writeJson(tmp, "missing-header", facilityTrace({ referencesUsed: facilityTrace().referencesUsed.filter((id) => id !== "dashboard_header_band_event_portfolio_ref") }))], "DASHBOARD_TRACE_HEADER_REF_MISSING");
  results.push({ case: "missing header band fails", status: "pass" });

  expectFail(["--dashboard-trace", writeJson(tmp, "missing-filter", facilityTrace({ referencesUsed: facilityTrace().referencesUsed.filter((id) => id !== "dashboard_filter_group_event_portfolio_ref") }))], "DASHBOARD_TRACE_FILTER_GROUP_REF_MISSING");
  results.push({ case: "missing filter group when filters are required fails", status: "pass" });

  expectFail(["--dashboard-trace", writeJson(tmp, "missing-kpi", facilityTrace({ referencesUsed: facilityTrace().referencesUsed.filter((id) => id !== "dashboard_kpi_cards_event_portfolio_ref") }))], "DASHBOARD_TRACE_KPI_REF_MISSING");
  results.push({ case: "missing KPI cards when summary metrics are required fails", status: "pass" });

  expectFail(["--dashboard-trace", writeJson(tmp, "missing-grid", facilityTrace({ referencesUsed: facilityTrace().referencesUsed.filter((id) => id !== "dashboard_collection_grid_table_event_portfolio_ref") }))], "DASHBOARD_TRACE_GRID_TABLE_REF_MISSING");
  results.push({ case: "missing grid-table Collection for work queue fails", status: "pass" });

  expectFail(["--dashboard-selection", writeJson(tmp, "selection-missing-grid", facilitySelection({ selectedSectionGoldenReferenceIds: facilitySelection().selectedSectionGoldenReferenceIds.filter((id) => id !== "dashboard_collection_grid_table_event_portfolio_ref") }))], "DASHBOARD_SELECTION_GRID_TABLE_REF_MISSING");
  results.push({ case: "work queue region omits grid-table Collection reference fails", status: "pass" });

  expectFail(["--dashboard-selection", writeJson(tmp, "selection-missing-kpi", facilitySelection({ selectedSectionGoldenReferenceIds: facilitySelection().selectedSectionGoldenReferenceIds.filter((id) => id !== "dashboard_kpi_cards_event_portfolio_ref") }))], "DASHBOARD_SELECTION_KPI_REF_MISSING");
  results.push({ case: "summary metrics omit KPI cards reference fails", status: "pass" });

  expectFail(["--dashboard-trace", writeJson(tmp, "missing-dynamics", facilityTrace({ itemTemplateDynamicControls: [] }))], "DASHBOARD_TRACE_DYNAMIC_CONTROLS_MISSING");
  results.push({ case: "missing item-template Dynamic controls fails", status: "pass" });

  expectFail(["--dashboard-trace", writeJson(tmp, "event-fields-copied", facilityTrace({ mappedFields: ["Event Name", "Stage", "Region", "Event Date"], appPlanFields: ["Request Title", "Maintenance Status", "Building Zone", "Due Date"] }))], "DASHBOARD_TRACE_EVENT_SPECIFIC_FIELDS_COPIED");
  results.push({ case: "copying event-specific fields into unrelated app fails", status: "pass" });

  expectFail(["--dashboard-blueprint", writeJson(tmp, "blueprint-no-selection", facilityBlueprint())], "DASHBOARD_BLUEPRINT_SELECTION_ARTIFACT_MISSING");
  results.push({ case: "dashboard blueprint omits golden reference selection fails", status: "pass" });

  expectFail(["--dashboard-selection", selectionFile, "--dashboard-blueprint", writeJson(tmp, "blueprint-no-derived", facilityBlueprint({ sections: facilityBlueprint().sections.map(({ derivedFromGoldenReference, ...section }) => section) }))], "DASHBOARD_BLUEPRINT_SECTION_REFERENCE_MISSING");
  results.push({ case: "dashboard blueprint section without derivedFromGoldenReference fails", status: "pass" });

  expectFail(["--dashboard-selection", selectionFile, "--dashboard-resource", writeJson(tmp, "resource-event-fields", facilityResource({ mappedFields: ["Event Name", "Event Date"], appPlanFields: ["Request Title", "Due Date"] }))], "DASHBOARD_TRACE_EVENT_SPECIFIC_FIELDS_COPIED");
  results.push({ case: "generated dashboard copies Event fields into Facility app fails", status: "pass" });

  expectFail(["--dashboard-selection", selectionFile, "--dashboard-resource", writeJson(tmp, "resource-no-provenance", facilityResource({ generatedSections: facilityResource().generatedSections.map(({ derivedFromGoldenReference, ...section }) => section) }))], "DASHBOARD_RESOURCE_SECTION_PROVENANCE_MISSING");
  results.push({ case: "generated resource without section provenance fails package readiness", status: "pass" });

  console.log(JSON.stringify({ status: "pass", results }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ status: "fail", error: error.message, results }, null, 2));
  process.exit(1);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

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

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-golden-ref-"));
const results = [];

try {
  expectPass(["--registry", "docs/reference/dashboard-golden-reference-registry.normalized.json"]);
  results.push({ case: "golden reference registry is present and valid", status: "pass" });

  expectPass(["--dashboard-trace", writeJson(tmp, "facility-valid", facilityTrace())]);
  results.push({ case: "Facility Maintenance dashboard maps into Event Portfolio default structure", status: "pass" });

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

  expectFail(["--dashboard-trace", writeJson(tmp, "missing-dynamics", facilityTrace({ itemTemplateDynamicControls: [] }))], "DASHBOARD_TRACE_DYNAMIC_CONTROLS_MISSING");
  results.push({ case: "missing item-template Dynamic controls fails", status: "pass" });

  expectFail(["--dashboard-trace", writeJson(tmp, "event-fields-copied", facilityTrace({ mappedFields: ["Event Name", "Stage", "Region", "Event Date"], appPlanFields: ["Request Title", "Maintenance Status", "Building Zone", "Due Date"] }))], "DASHBOARD_TRACE_EVENT_SPECIFIC_FIELDS_COPIED");
  results.push({ case: "copying event-specific fields into unrelated app fails", status: "pass" });

  console.log(JSON.stringify({ status: "pass", results }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ status: "fail", error: error.message, results }, null, 2));
  process.exit(1);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts/validate-data-analytics-golden-references.mjs");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "data-analytics-golden-"));
const results = [];

try {
  expectPass("registry validates", ["--registry"]);
  expectCode("Registry missing App Plan selection guidance fails", ["--registry", writeJson("registry-missing-guidance.json", registryMissingGuidance())], "DATA_ANALYTICS_REFERENCE_GUIDANCE_INCOMPLETE");
  expectPass("Dashboard v1.1 analytics inside approved 2/3-column sections pass", ["--resource", writeJson("valid-dashboard.json", dashboardResource()), "--surface", "dashboard"]);
  expectPass("Data List form analytics usage passes", ["--resource", writeJson("valid-data-list-form.json", dataListFormResource()), "--surface", "data-list-form"]);

  expectCode("Approval form analytics usage is forbidden", ["--resource", writeJson("approval-form.json", approvalFormResource()), "--surface", "approval-form"], "DATA_ANALYTICS_APPROVAL_FORM_FORBIDDEN");
  expectCode("Dashboard v1.1 analytics outside 2/3-column sections fail", ["--resource", writeJson("outside-section.json", dashboardResource({ outsideSection: true })), "--surface", "dashboard"], "DATA_ANALYTICS_DASHBOARD_V11_SECTION_PLACEMENT_INVALID");
  expectCode("Simplified chart without approved wrapper fails", ["--resource", writeJson("missing-wrapper.json", dashboardResource({ missingWrapper: true })), "--surface", "dashboard"], "DATA_ANALYTICS_TEMPLATE_WRAPPER_MISSING");
  expectCode("Unknown analytics template ID fails", ["--resource", writeJson("unknown-template.json", dashboardResource({ unknownTemplate: true })), "--surface", "dashboard"], "DATA_ANALYTICS_TEMPLATE_UNKNOWN");
  expectCode("Chart-with-title template requires title control", ["--resource", writeJson("missing-title.json", dashboardResource({ missingTitle: true })), "--surface", "dashboard"], "DATA_ANALYTICS_TEMPLATE_TITLE_CONTROL_MISSING");
  const appPlan = writeText("analytics-app-plan.md", analyticsAppPlan());
  expectPass("Generated package materializes App Plan selected Data Analytics templates", ["--package", writeYapk("analytics-present.yapk", dashboardResource()), "--plan", appPlan]);
  expectCode("Generated package fails when App Plan selected Data Analytics templates are not materialized", ["--package", writeYapk("analytics-missing.yapk", dashboardResource({ noAnalytics: true })), "--plan", appPlan], "DATA_ANALYTICS_PLANNED_TEMPLATE_NOT_MATERIALIZED");

  printSummary(0);
} catch (error) {
  results.push({ name: "unexpected test harness error", status: "fail", error: error.message });
  printSummary(1);
}

function expectPass(name, args) {
  const result = run(args);
  results.push({ name, status: result.status === 0 ? "pass" : "fail", args, stdout: result.stdout.slice(0, 1000), stderr: result.stderr.slice(0, 1000) });
  assert.equal(result.status, 0, `${name}\n${result.stdout}\n${result.stderr}`);
}

function expectCode(name, args, code) {
  const result = run(args);
  const output = `${result.stdout}\n${result.stderr}`;
  results.push({ name, status: result.status !== 0 && output.includes(code) ? "pass" : "fail", args, expectedCode: code, stdout: result.stdout.slice(0, 1000), stderr: result.stderr.slice(0, 1000) });
  assert.notEqual(result.status, 0, `${name} should fail`);
  assert.match(output, new RegExp(code), `${name} should include ${code}\n${output}`);
}

function run(args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
}

function dashboardResource(options = {}) {
  const analytics = [
    chartModule("data_analytics_pie_chart_with_title", "pie_chart_with_title_wrapper", "pie_chart_title", "pie_chart_control", "pie-chart"),
    chartModule("data_analytics_column_chart_with_title", "column_chart_with_title_wrapper", "column_chart_title", "column_chart_control", "bar-chart"),
    chartModule("data_analytics_bar_chart_with_title", "bar_chart_with_title_wrapper", "bar_chart_title", "bar_chart_control", "bar-chart"),
    chartModule("data_analytics_line_chart_with_title", "line_chart_with_title_wrapper", "line_chart_title", "line_chart_control", "line-chart"),
    chartModule("data_analytics_area_chart_with_title", "area_chart_with_title_wrapper", "area_chart_title", "area_chart_control", "line-chart"),
    pivotModule(),
  ];
  if (options.unknownTemplate) analytics[0].attrs.dataAnalyticsTemplateId = "data_analytics_unknown_chart";
  if (options.missingWrapper) analytics[0] = { type: "pie-chart", nv_label: "pie_chart_control", attrs: { dataAnalyticsTemplateId: "data_analytics_pie_chart_with_title" } };
  if (options.missingTitle) analytics[0].children = analytics[0].children.filter((child) => child.nv_label !== "pie_chart_title");
  if (options.noAnalytics) analytics.length = 0;

  return {
    type: "page",
    nv_label: "dashboard-page-layouts-v1.1",
    derivedFromDashboardPageLayoutTemplate: "dashboard-page-layouts-v1.1",
    children: [
      {
        type: "container",
        nv_label: "Main",
        children: [
          {
            type: "container",
            nv_label: "Content",
            children: options.outsideSection
              ? analytics
              : [
                  section("2_columns_section", analytics.slice(0, 3)),
                  section("3_columns_section", analytics.slice(3)),
                ],
          },
        ],
      },
    ],
  };
}

function analyticsAppPlan() {
  return [
    "# Yeeflow App Plan: Analytics App",
    "",
    "## 14. Dashboard Pages Plan",
    "",
    "### 14.1 Operations Dashboard",
    "",
    "#### Data Analytics Template Selection",
    "| Dashboard Page | Analytics Region | Source Resource | Business Question | Selected Data Analytics Template | Grouping Field | Value Field |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    "| Operations Dashboard | Status mix | Tickets | Tickets by status | data_analytics_pie_chart_with_title | Status | ListDataID |",
    "| Operations Dashboard | Volume trend | Tickets | Ticket volume over time | data_analytics_line_chart_with_title | Created | ListDataID |",
  ].join("\n");
}

function writeYapk(name, dashboard) {
  const decoded = {
    ListSet: { ListID: "app_1", Title: "Analytics App" },
    Pages: [
      {
        Title: "Operations Dashboard",
        Type: 103,
        LayoutInResources: [{ Resource: JSON.stringify(dashboard) }],
      },
    ],
    Childs: [],
    Forms: [],
    FormNewReports: [],
    DataReports: [],
    PortalInfo: null,
  };
  const wrapper = {
    PackageId: "pkg_1",
    TenantID: "tenant_1",
    AppID: 41,
    ListID: "app_1",
    Title: "Analytics App",
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64"),
  };
  return writeJson(name, wrapper);
}

function dataListFormResource() {
  return {
    type: "form",
    nv_label: "Asset Analytics Form",
    children: [
      chartModule("data_analytics_pie_chart_with_title", "pie_chart_with_title_wrapper", "pie_chart_title", "pie_chart_control", "pie-chart"),
      chartModule("data_analytics_area_chart_with_title", "area_chart_with_title_wrapper", "area_chart_title", "area_chart_control", "line-chart"),
      pivotModule(),
    ],
  };
}

function approvalFormResource() {
  return {
    type: "approval-form",
    nv_label: "Approval Task",
    children: [
      chartModule("data_analytics_pie_chart_with_title", "pie_chart_with_title_wrapper", "pie_chart_title", "pie_chart_control", "pie-chart"),
    ],
  };
}

function registryMissingGuidance() {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/data-analytics-golden-references.json"), "utf8"));
  for (const reference of registry.references || []) reference.sourceTemplate = path.join(ROOT, reference.sourceTemplate);
  delete registry.references[0].requiredBusinessSignals;
  return registry;
}

function section(id, children) {
  return {
    type: "container",
    nv_label: id,
    children: [
      {
        type: "container",
        nv_label: "section_content_area",
        children,
      },
    ],
  };
}

function chartModule(templateId, wrapperId, titleId, controlId, controlType) {
  return {
    type: "container",
    nv_label: wrapperId,
    attrs: { dataAnalyticsTemplateId: templateId },
    children: [
      { type: "text", nv_label: titleId, attrs: { headc: { title: { value: "Business-specific title" } } } },
      { type: "container", nv_label: wrapperId.replace("_with_title_wrapper", "_container"), children: [
        { type: controlType, nv_label: controlId, attrs: { dataAnalyticsTemplateId: templateId, data: { list: { ListID: "list_assets" } } } },
      ] },
    ],
  };
}

function pivotModule() {
  return {
    type: "pivot-table",
    nv_label: "pivot_table_standard",
    attrs: { dataAnalyticsTemplateId: "data_analytics_pivot_table_standard", rows: {}, columns: {}, values: {} },
  };
}

function writeJson(name, value) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
  return file;
}

function writeText(name, value) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, value);
  return file;
}

function printSummary(exitCode) {
  console.log(JSON.stringify({ status: exitCode === 0 ? "pass" : "fail", results }, null, 2));
  process.exit(exitCode);
}

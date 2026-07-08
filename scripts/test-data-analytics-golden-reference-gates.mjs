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
  expectPass("Dashboard v1.1 analytics inside approved content card and multi-column sections pass", ["--resource", writeJson("valid-dashboard.json", dashboardResource()), "--surface", "dashboard"]);
  expectPass("Dashboard v1.1 analytics inside 60/40 section pass", ["--resource", writeJson("valid-dashboard-6040.json", dashboardResource({ only6040: true })), "--surface", "dashboard"]);
  expectPass("Workbench dashboard charts inside chart_cards_section and pivot inside content card pass", ["--resource", writeJson("valid-workbench-dashboard.json", workbenchDashboardResource()), "--surface", "dashboard"]);
  expectPass("Data List View Item form analytics inside approved content card and multi-column sections pass", ["--resource", writeJson("valid-data-list-form.json", dataListFormResource()), "--surface", "data-list-form"]);
  expectPass("Data List View Item form analytics inside 60/40 section pass", ["--resource", writeJson("valid-data-list-form-6040.json", dataListFormResource({ only6040: true })), "--surface", "data-list-form"]);
  expectPass("Workbench Data List View Item form charts inside chart_cards_section and pivot inside content card pass", ["--resource", writeJson("valid-workbench-data-list-form.json", dataListFormWorkbenchResource()), "--surface", "data-list-form"]);

  expectCode("Approval form analytics usage is forbidden", ["--resource", writeJson("approval-form.json", approvalFormResource()), "--surface", "approval-form"], "DATA_ANALYTICS_APPROVAL_FORM_FORBIDDEN");
  expectCode("Data List New/Edit form analytics usage is forbidden", ["--resource", writeJson("new-edit-data-list-form.json", dataListFormResource({ newEdit: true })), "--surface", "data-list-form"], "DATA_ANALYTICS_DATA_LIST_FORM_NEW_EDIT_FORBIDDEN");
  expectCode("Dashboard v1.1 analytics outside approved content card or multi-column sections fail", ["--resource", writeJson("outside-section.json", dashboardResource({ outsideSection: true })), "--surface", "dashboard"], "DATA_ANALYTICS_DASHBOARD_V11_SECTION_PLACEMENT_INVALID");
  expectCode("Workbench dashboard analytics outside chart_cards_section fail", ["--resource", writeJson("outside-workbench-chart-section.json", workbenchDashboardResource({ outsideChartSection: true })), "--surface", "dashboard"], "DATA_ANALYTICS_DASHBOARD_CHART_SECTION_PLACEMENT_INVALID");
  expectCode("Workbench dashboard pivot inside chart_cards_section fails", ["--resource", writeJson("workbench-pivot-in-chart-section.json", workbenchDashboardResource({ pivotInChartSection: true })), "--surface", "dashboard"], "DATA_ANALYTICS_PIVOT_CHART_SECTION_FORBIDDEN");
  expectCode("Data List View Item form analytics outside approved content card or multi-column sections fail", ["--resource", writeJson("outside-data-list-form-section.json", dataListFormResource({ outsideSection: true })), "--surface", "data-list-form"], "DATA_ANALYTICS_DATA_LIST_FORM_VIEW_V11_SECTION_PLACEMENT_INVALID");
  expectCode("Workbench Data List View Item form analytics outside chart_cards_section fail", ["--resource", writeJson("outside-workbench-data-list-form-section.json", dataListFormWorkbenchResource({ outsideChartSection: true })), "--surface", "data-list-form"], "DATA_ANALYTICS_DATA_LIST_FORM_WORKBENCH_CHART_SECTION_PLACEMENT_INVALID");
  expectCode("Workbench Data List View Item form pivot inside chart_cards_section fails", ["--resource", writeJson("workbench-data-list-pivot-in-chart-section.json", dataListFormWorkbenchResource({ pivotInChartSection: true })), "--surface", "data-list-form"], "DATA_ANALYTICS_PIVOT_CHART_SECTION_FORBIDDEN");
  expectCode("Simplified chart without approved wrapper fails", ["--resource", writeJson("missing-wrapper.json", dashboardResource({ missingWrapper: true })), "--surface", "dashboard"], "DATA_ANALYTICS_TEMPLATE_WRAPPER_MISSING");
  expectCode("Unknown analytics template ID fails", ["--resource", writeJson("unknown-template.json", dashboardResource({ unknownTemplate: true })), "--surface", "dashboard"], "DATA_ANALYTICS_TEMPLATE_UNKNOWN");
  expectCode("Chart-with-title template requires title control", ["--resource", writeJson("missing-title.json", dashboardResource({ missingTitle: true })), "--surface", "dashboard"], "DATA_ANALYTICS_TEMPLATE_TITLE_CONTROL_MISSING");
  expectCode("Visual analytics template without runtime exts fails", ["--resource", writeJson("missing-runtime.json", dashboardResource({ omitRuntimeBindings: true })), "--surface", "dashboard"], "DATA_ANALYTICS_RUNTIME_EXT_MISSING");
  expectCode("Runtime ext without ReportIds registration fails", ["--resource", writeJson("missing-reportids.json", dashboardResource({ omitReportIds: true })), "--surface", "dashboard"], "DATA_ANALYTICS_RUNTIME_REPORT_ID_MISSING");
  expectCode("Runtime chart type semantic strings fail", ["--resource", writeJson("semantic-chart-type-string.json", dashboardResource({ semanticChartTypeString: true })), "--surface", "dashboard"], "DATA_ANALYTICS_RUNTIME_CHART_TYPE_CODE_INVALID");
  expectCode("Line/area date trend rows without a supported date grouping func fail", ["--resource", writeJson("missing-date-trend-func.json", dashboardResource({ omitDateTrendRowFunc: true })), "--surface", "dashboard"], "DATA_ANALYTICS_RUNTIME_DATE_TREND_ROW_FUNC_MISSING");
  expectPass("Line chart Events by Day with DATE date trend func passes", ["--resource", writeJson("daily-line-chart.json", dashboardResource({ lineChartTitle: "Events by Day", dateTrendFunc: "DATE" })), "--surface", "dashboard"]);
  expectPass("Line chart Events by Month with MONTH date trend func passes", ["--resource", writeJson("monthly-line-chart.json", dashboardResource({ lineChartTitle: "Events by Month", dateTrendFunc: "MONTH" })), "--surface", "dashboard"]);
  expectPass("Line chart Events by Quarter with QUARTER date trend func passes", ["--resource", writeJson("quarterly-line-chart.json", dashboardResource({ lineChartTitle: "Events by Quarter", dateTrendFunc: "QUARTER" })), "--surface", "dashboard"]);
  expectPass("Line chart Events by Year with YEAR date trend func passes", ["--resource", writeJson("yearly-line-chart.json", dashboardResource({ lineChartTitle: "Events by Year", dateTrendFunc: "YEAR" })), "--surface", "dashboard"]);
  expectCode("Line chart Events by Month with DATE func fails business granularity", ["--resource", writeJson("monthly-line-chart-wrong-date-func.json", dashboardResource({ lineChartTitle: "Events by Month", dateTrendFunc: "DATE" })), "--surface", "dashboard"], "DATA_ANALYTICS_RUNTIME_DATE_TREND_GRANULARITY_MISMATCH");
  expectCode("Line chart with unsupported DAY func fails", ["--resource", writeJson("unsupported-day-func.json", dashboardResource({ lineChartTitle: "Events by Day", dateTrendFunc: "DAY" })), "--surface", "dashboard"], "DATA_ANALYTICS_RUNTIME_DATE_TREND_ROW_FUNC_MISSING");
  expectCode("Line chart with unsupported WEEK func fails", ["--resource", writeJson("unsupported-week-func.json", dashboardResource({ lineChartTitle: "Events by Week", dateTrendFunc: "WEEK" })), "--surface", "dashboard"], "DATA_ANALYTICS_RUNTIME_DATE_TREND_ROW_FUNC_MISSING");
  expectCode("Runtime row field metadata must be export-shaped", ["--resource", writeJson("thin-runtime-row.json", dashboardResource({ thinRuntimeRow: true })), "--surface", "dashboard"], "DATA_ANALYTICS_RUNTIME_ROW_EXPORT_SHAPE_INCOMPLETE");
  expectCode("Runtime value field metadata must be export-shaped", ["--resource", writeJson("thin-runtime-value.json", dashboardResource({ thinRuntimeValue: true })), "--surface", "dashboard"], "DATA_ANALYTICS_RUNTIME_VALUE_EXPORT_SHAPE_INCOMPLETE");
  expectCode("Runtime settings must preserve export-shaped conditions keys", ["--resource", writeJson("missing-runtime-conditions.json", dashboardResource({ omitRuntimeConditions: true })), "--surface", "dashboard"], "DATA_ANALYTICS_RUNTIME_CONDITIONS_SHAPE_MISSING");
  expectCode("Runtime ext with unresolved source field fails", ["--package", writeYapk("analytics-bad-field.yapk", dashboardResource({ badRuntimeField: true }))], "DATA_ANALYTICS_RUNTIME_FIELD_UNRESOLVED");
  expectCode("Visible analytics source without ListSetID fails", ["--resource", writeJson("visible-source-missing-listset.json", dashboardResource({ missingVisibleListSetId: true })), "--surface", "dashboard"], "DATA_ANALYTICS_VISIBLE_SOURCE_METADATA_MISSING");
  expectCode("Visible analytics source mismatch fails", ["--resource", writeJson("visible-source-mismatch.json", dashboardResource({ mismatchedVisibleSource: true })), "--surface", "dashboard"], "DATA_ANALYTICS_RUNTIME_SOURCE_SURFACE_MISMATCH");
  expectCode("COUNT analytics values must use ListDataID identity", ["--resource", writeJson("count-identity-mismatch.json", dashboardResource({ countValueUsesTitle: true })), "--surface", "dashboard"], "DATA_ANALYTICS_RUNTIME_COUNT_FIELD_ID_INVALID");
  expectCode("Pivot runtime values cannot be empty objects", ["--resource", writeJson("pivot-empty-value.json", dashboardResource({ emptyPivotValueObject: true })), "--surface", "dashboard"], "DATA_ANALYTICS_RUNTIME_VALUE_FIELD_MISSING");
  expectCode("Generated chart without runtimeModelProven fails", ["--resource", writeJson("missing-runtime-model-proven.json", dashboardResource({ missingRuntimeModelProven: true })), "--surface", "dashboard"], "DATA_ANALYTICS_RUNTIME_MODEL_PROVEN_MISSING");
  expectCode("Generated chart without both template IDs fails", ["--resource", writeJson("template-id-mismatch.json", dashboardResource({ templateIdMismatch: true })), "--surface", "dashboard"], "DATA_ANALYTICS_TEMPLATE_ID_CONTRACT_MISSING");
  expectCode("Generated chart with derived COUNT field ID fails", ["--resource", writeJson("derived-count-field.json", dashboardResource({ derivedValueField: true })), "--surface", "dashboard"], "DATA_ANALYTICS_RUNTIME_DERIVED_FIELD_ID_INVALID");
  expectCode("Generated chart with stale model surface fails", ["--resource", writeJson("stale-model-surface.json", dashboardResource({ staleValueSurface: true })), "--surface", "dashboard"], "DATA_ANALYTICS_RUNTIME_MODEL_SURFACE_MISMATCH");
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
  const charts = [
    chartModule("data_analytics_pie_chart_with_title", "pie_chart_with_title_wrapper", "pie_chart_title", "pie_chart_control", "pie-chart"),
    chartModule("data_analytics_column_chart_with_title", "column_chart_with_title_wrapper", "column_chart_title", "column_chart_control", "bar-chart"),
    chartModule("data_analytics_bar_chart_with_title", "bar_chart_with_title_wrapper", "bar_chart_title", "bar_chart_control", "bar-chart"),
    chartModule("data_analytics_line_chart_with_title", "line_chart_with_title_wrapper", "line_chart_title", "line_chart_control", "line-chart", { title: options.lineChartTitle }),
    chartModule("data_analytics_area_chart_with_title", "area_chart_with_title_wrapper", "area_chart_title", "area_chart_control", "line-chart"),
  ];
  const analytics = [...charts, pivotModule()];
  if (options.unknownTemplate) analytics[0].attrs.dataAnalyticsTemplateId = "data_analytics_unknown_chart";
  if (options.missingWrapper) analytics[0] = { type: "pie-chart", nv_label: "pie_chart_control", attrs: { dataAnalyticsTemplateId: "data_analytics_pie_chart_with_title" } };
  if (options.missingTitle) analytics[0].children = analytics[0].children.filter((child) => child.nv_label !== "pie_chart_title");
  const firstControl = findAnalyticsControl(analytics[0]);
  if (firstControl && options.missingRuntimeModelProven) {
    delete firstControl.runtimeModelProven;
    delete firstControl.attrs.runtimeModelProven;
  }
  if (firstControl && options.templateIdMismatch) firstControl.attrs.templateId = "data_analytics_line_chart_with_title";
  if (firstControl && options.derivedValueField) firstControl.attrs.values = [{ field: "ListDataID_COUNT", aggregate: "COUNT" }];
  if (firstControl && options.staleValueSurface) firstControl.attrs.model.valueField = "Title";
  if (firstControl && options.missingVisibleListSetId) {
    delete firstControl.attrs.data.list.ListSetID;
    delete firstControl.attrs.model.source.ListSetID;
  }
  if (firstControl && options.mismatchedVisibleSource) firstControl.attrs.model.source.ListID = "list_other";
  if (firstControl && options.countValueUsesTitle) firstControl.attrs.values = [{ field: "Title", fieldName: "Title", FieldName: "Title", id: "Title", aggregate: "COUNT" }];
  if (options.emptyPivotValueObject) {
    const pivot = analytics.find((item) => item?.type === "pivot-table");
    if (pivot) pivot.attrs.values = [{}];
  }
  if (options.noAnalytics) analytics.length = 0;

  const resource = {
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
              : options.only6040
                ? [section("2_columns_60/40_section", [...charts, contentCard([pivotModule()])])]
              : [
                  contentCard(analytics.slice(0, 1)),
                  section("2_columns_section", analytics.slice(1, 3)),
                  section("3_columns_section", analytics.slice(3, 5)),
                  section("2_columns_60/40_section", [contentCard(analytics.slice(5))]),
                ],
          },
        ],
      },
    ],
  };
  if (!options.omitRuntimeBindings) addAnalyticsRuntimeBindings(resource, {
    omitReportIds: options.omitReportIds,
    badRuntimeField: options.badRuntimeField,
    countValueUsesTitle: options.countValueUsesTitle,
    emptyPivotValueObject: options.emptyPivotValueObject,
    semanticChartTypeString: options.semanticChartTypeString,
    omitDateTrendRowFunc: options.omitDateTrendRowFunc,
    dateTrendFunc: options.dateTrendFunc,
    thinRuntimeRow: options.thinRuntimeRow,
    thinRuntimeValue: options.thinRuntimeValue,
    omitRuntimeConditions: options.omitRuntimeConditions,
  });
  return resource;
}

function workbenchDashboardResource(options = {}) {
  const charts = [
    chartModule("data_analytics_pie_chart_with_title", "pie_chart_with_title_wrapper", "pie_chart_title", "pie_chart_control", "pie-chart"),
    chartModule("data_analytics_column_chart_with_title", "column_chart_with_title_wrapper", "column_chart_title", "column_chart_control", "bar-chart"),
  ];
  const analytics = options.pivotInChartSection ? [...charts, pivotModule()] : charts;
  const analyticsHost = options.outsideChartSection
    ? analytics
    : [
        {
          type: "container",
          nv_label: "chart_cards_section",
          children: analytics,
        },
        ...(options.pivotInChartSection ? [] : [section("1_columns_section", [contentCard([pivotModule()])])]),
      ];
  const resource = {
    type: "page",
    nv_label: "dashboard-page-layouts-workbench",
    derivedFromDashboardPageLayoutTemplate: "dashboard-page-layouts-workbench",
    children: [
      {
        type: "container",
        nv_label: "main",
        children: [
          {
            type: "container",
            nv_label: "content",
            children: [
              {
                type: "container",
                nv_label: "main_work_queue_section",
                children: [
                  {
                    type: "container",
                    nv_label: "main_work_queue_wrapper",
                    children: [
                      {
                        type: "container",
                        nv_label: "primary_working_area",
                        children: analyticsHost,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  addAnalyticsRuntimeBindings(resource, options);
  return resource;
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
    Childs: [
      {
        List: {
          ListID: "list_assets",
          Title: "Tickets",
          Defs: [
            { FieldName: "ListDataID", FieldID: "field_listdataid", FieldType: "Text" },
            { FieldName: "Status", FieldID: "field_status", FieldType: "Text" },
            { FieldName: "Created", FieldID: "field_created", FieldType: "Datetime" },
          ],
        },
      },
    ],
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

function dataListFormResource(options = {}) {
  const charts = [
    chartModule("data_analytics_pie_chart_with_title", "pie_chart_with_title_wrapper", "pie_chart_title", "pie_chart_control", "pie-chart"),
    chartModule("data_analytics_area_chart_with_title", "area_chart_with_title_wrapper", "area_chart_title", "area_chart_control", "line-chart"),
  ];
  const analytics = [...charts, pivotModule()];
  const resource = {
    type: "form",
    nv_label: options.newEdit ? "data_list_form_layout_new_edit_v1_1" : "data_list_form_layout_view_item_v1_1",
    templateId: options.newEdit ? "data_list_form_layout_new_edit_v1_1" : "data_list_form_layout_view_item_v1_1",
    children: [
      ...(options.outsideSection ? analytics : options.only6040 ? [section("2_columns_60/40_section", [...charts, contentCard([pivotModule()])])] : [
        contentCard(analytics.slice(0, 1)),
        section("2_columns_section", analytics.slice(1, 2)),
        section("3_columns_section", [contentCard(analytics.slice(2))]),
      ]),
    ],
  };
  addAnalyticsRuntimeBindings(resource);
  return resource;
}

function dataListFormWorkbenchResource(options = {}) {
  const charts = [
    chartModule("data_analytics_pie_chart_with_title", "pie_chart_with_title_wrapper", "pie_chart_title", "pie_chart_control", "pie-chart"),
    chartModule("data_analytics_area_chart_with_title", "area_chart_with_title_wrapper", "area_chart_title", "area_chart_control", "line-chart"),
  ];
  const analytics = options.pivotInChartSection ? [...charts, pivotModule()] : charts;
  const resource = {
    type: "form",
    nv_label: "data_list_form_layout_workbench",
    templateId: "data_list_form_layout_workbench",
    children: options.outsideChartSection ? analytics : [
      {
        type: "container",
        nv_label: "primary_working_area",
        children: [
          {
            type: "container",
            nv_label: "chart_cards_section",
            children: analytics,
          },
          ...(options.pivotInChartSection ? [] : [section("1_columns_section", [contentCard([pivotModule()])])]),
        ],
      },
    ],
  };
  addAnalyticsRuntimeBindings(resource);
  return resource;
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

function contentCard(children) {
  return {
    type: "container",
    nv_label: "content_card_wrapper",
    children: [
      {
        type: "container",
        nv_label: "section_content_area",
        children,
      },
    ],
  };
}

function chartModule(templateId, wrapperId, titleId, controlId, controlType, options = {}) {
  const title = options.title || "Business-specific title";
  return {
    type: "container",
    nv_label: wrapperId,
    dataAnalyticsTemplateId: templateId,
    templateId,
    attrs: { dataAnalyticsTemplateId: templateId, templateId },
    children: [
      { type: "text", nv_label: titleId, attrs: { headc: { title: { value: title } } } },
      { type: "container", nv_label: wrapperId.replace("_with_title_wrapper", "_container"), children: [
        {
          type: controlType,
          id: controlId,
          nv_label: controlId,
          dataAnalyticsTemplateId: templateId,
          templateId,
          runtimeModelProven: true,
          attrs: {
            dataAnalyticsTemplateId: templateId,
            templateId,
            runtimeModelProven: true,
            data: { list: { AppID: 41, ListID: "list_assets", ListSetID: "app_1" }, groupBy: controlId.includes("line") || controlId.includes("area") ? "Created" : "Status", axisField: controlId.includes("line") || controlId.includes("area") ? "Created" : "Status", categoryField: controlId.includes("line") || controlId.includes("area") ? "Created" : "Status", valueField: "ListDataID" },
            model: { source: { AppID: 41, ListID: "list_assets", ListSetID: "app_1" }, categoryField: controlId.includes("line") || controlId.includes("area") ? "Created" : "Status", valueField: "ListDataID", aggregate: "COUNT", runtimeModelProven: true },
            series: [{ name: title, categoryField: controlId.includes("line") || controlId.includes("area") ? "Created" : "Status", valueField: "ListDataID", aggregate: "COUNT" }],
            values: [{ field: "ListDataID", fieldName: "ListDataID", FieldName: "ListDataID", id: "ListDataID", aggregate: "COUNT" }],
          },
        },
      ] },
    ],
  };
}

function pivotModule() {
  return {
    type: "pivot-table",
    id: "pivot_table_control",
    nv_label: "pivot_table_standard",
    dataAnalyticsTemplateId: "data_analytics_pivot_table_standard",
    templateId: "data_analytics_pivot_table_standard",
    runtimeModelProven: true,
    attrs: {
      dataAnalyticsTemplateId: "data_analytics_pivot_table_standard",
      templateId: "data_analytics_pivot_table_standard",
      runtimeModelProven: true,
      data: { list: { AppID: 41, ListID: "list_assets", ListSetID: "app_1" } },
      model: { source: { AppID: 41, ListID: "list_assets", ListSetID: "app_1" } },
      rows: {},
      columns: {},
      values: [{ field: "ListDataID", fieldName: "ListDataID", FieldName: "ListDataID", id: "ListDataID", aggregate: "COUNT" }],
    },
  };
}

function findAnalyticsControl(node) {
  let found = null;
  visit(node, (candidate) => {
    if (!found && ["pie-chart", "bar-chart", "line-chart", "pivot-table"].includes(String(candidate?.type || ""))) found = candidate;
  });
  return found;
}

function addAnalyticsRuntimeBindings(resource, options = {}) {
  const controls = [];
  visit(resource, (node) => {
    if (["pie-chart", "bar-chart", "line-chart", "pivot-table"].includes(String(node?.type || ""))) controls.push(node);
  });
  const reportIds = [];
  const exts = [];
  for (const control of controls) {
    const id = control.id;
    if (!id) continue;
    if (!options.omitReportIds) reportIds.push(id);
    const key = control.type === "pivot-table" ? "PivotTable" : control.type;
    const fieldName = options.badRuntimeField ? "MissingField" : (id.includes("line") || id.includes("area") ? "Created" : "Status");
    const isDateRow = id.includes("line") || id.includes("area");
    const row = {
      type: isDateRow ? "datepicker" : "select",
      label: isDateRow ? "Created" : "Status",
      attr: { displayLabel: true, readonly: false },
      fieldName,
      fieldType: isDateRow ? "Datetime" : "Text",
      id: fieldName,
      field: fieldName,
      FieldName: fieldName,
    };
    if (options.thinRuntimeRow) {
      delete row.type;
      delete row.fieldType;
      delete row.attr;
    }
    if ((id.includes("line") || id.includes("area")) && !options.omitDateTrendRowFunc) row.func = String(options.dateTrendFunc || "DATE").toUpperCase();
    const valueEntry = options.emptyPivotValueObject && control.type === "pivot-table"
      ? {}
      : options.countValueUsesTitle
        ? { type: "input", label: "Title", attr: { displayLabel: true, readonly: true }, field: "Title", fieldName: "Title", FieldName: "Title", id: "Title", fieldType: "Text", func: "COUNT", aggregate: "COUNT" }
        : { type: "input", label: "Id", attr: { displayLabel: true, readonly: true }, field: "ListDataID", fieldName: "ListDataID", FieldName: "ListDataID", id: "ListDataID", fieldType: "Bigint", func: "COUNT", aggregate: "COUNT" };
    if (options.thinRuntimeValue && valueEntry && Object.keys(valueEntry).length) {
      delete valueEntry.type;
      delete valueEntry.fieldType;
      delete valueEntry.attr;
    }
    exts.push({
      i: id,
      category: "___Pivot___",
      key,
      attr: {
        AppID: 41,
        ListID: "list_assets",
        ListSetID: "app_1",
        chartType: control.type === "pivot-table" ? undefined : (options.semanticChartTypeString ? semanticChartType(control) : runtimeChartTypeCode(control)),
        settings: {
          rows: [row],
          columns: [],
          values: [valueEntry],
          ...(options.omitRuntimeConditions ? {} : { preConditions: null, Conditions: [] }),
        },
      },
    });
  }
  resource.ReportIds = reportIds;
  resource.exts = exts;
}

function runtimeChartTypeCode(control) {
  const kind = semanticChartType(control);
  if (kind === "pie-chart") return "0";
  if (kind === "line-chart" || kind === "area-chart") return "1";
  if (kind === "bar-chart" || kind === "column-chart") return "2";
  return "";
}

function semanticChartType(control) {
  const id = String(control?.id || control?.nv_label || "");
  if (id.includes("pie")) return "pie-chart";
  if (id.includes("column")) return "column-chart";
  if (id.includes("bar")) return "bar-chart";
  if (id.includes("area")) return "area-chart";
  if (id.includes("line")) return "line-chart";
  return String(control?.type || "");
}

function visit(node, callback) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) visit(item, callback);
    return;
  }
  callback(node);
  for (const value of Object.values(node)) visit(value, callback);
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

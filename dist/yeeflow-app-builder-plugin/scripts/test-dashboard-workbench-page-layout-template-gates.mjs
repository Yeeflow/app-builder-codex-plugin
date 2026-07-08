#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const TEMPLATE_ID = "dashboard-page-layouts-workbench";
const APP_ID = "1909100000000000001";
const LIST_ID = "1909100000000000100";

function registry() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/dashboard-page-layout-templates.json"), "utf8"));
}

function workbenchTemplate() {
  const template = registry().templates.find((entry) => entry.id === TEMPLATE_ID);
  assert.ok(template, "Workbench template must be registered.");
  const resource = clone(template.template.parsedResource);
  resource.derivedFromDashboardPageLayoutTemplate = TEMPLATE_ID;
  resource.generatedFinalDashboardMaterialization = { kpiCount: null };
  removeOperations(resource);
  addTopFilter(resource);
  keepOnlyPrimaryWorkingArea(resource);
  materializePrimaryQueue(resource);
  materializePrimaryCharts(resource, 2);
  return resource;
}

function addTopFilter(resource) {
  const filterGroup = find(resource, "dashboard_standard_filter_group");
  filterGroup.children = [{
    type: "select-filter",
    name: "Loan Status Filter",
    attrs: {
      lab: { value: "Loan status" },
      data: { field: "Status", operator: "=", options: [] },
      save_var: "var_status_filter",
    },
    binding: "var_status_filter",
  }];
}

function keepOnlyPrimaryWorkingArea(resource) {
  const queue = find(resource, "main_work_queue_wrapper");
  queue.children = queue.children.filter((child) => ids(child).includes("primary_working_area"));
  normalizeMainWorkQueueWrapperToSingleColumn(queue);
  const primary = find(resource, "primary_working_area");
  primary.children = primary.children.filter((child) => {
    const childIds = ids(child);
    return childIds.includes("kpi_metrics_wrapper") || childIds.includes("1_columns_section") || childIds.includes("chart_cards_section");
  });
}

function materializePrimaryQueue(resource) {
  const section = find(resource, "1_columns_section");
  const card = find(section, "content_card_wrapper");
  const slot = find(card, "section_content_area");
  slot.children = [{
    type: "collection",
    name: "Asset Loan Work Queue",
    attrs: {
      dashboardDatasetTemplateId: "collection_control_grid_table",
      data: { list: { ListID: LIST_ID, Title: "Loan Transactions" } },
    },
  }];
}

function materializePrimaryCharts(resource, count) {
  const chartSection = find(find(resource, "primary_working_area"), "chart_cards_section");
  chartSection.children = [];
  for (let index = 0; index < count; index += 1) {
    chartSection.children.push({
      type: index % 2 === 0 ? "pie-chart" : "bar-chart",
      name: `Asset Loan Analytics ${index + 1}`,
      runtimeModelProven: true,
      attrs: {
        runtimeModelProven: true,
        dataAnalyticsTemplateId: index % 2 === 0 ? "data_analytics_pie_chart_with_title" : "data_analytics_bar_chart_with_title",
      },
    });
  }
}

function addRightSidePanel(resource, withContent = true) {
  const template = registry().templates.find((entry) => entry.id === TEMPLATE_ID).template.parsedResource;
  const rightSide = clone(find(template, "right_side_panel"));
  if (withContent) {
    rightSide.children = rightSide.children.filter((child) => ids(child).includes("chart_cards_section"));
    find(rightSide, "chart_cards_section").children = [{
      type: "line-chart",
      name: "Return Trend",
      runtimeModelProven: true,
      attrs: { runtimeModelProven: true, dataAnalyticsTemplateId: "data_analytics_line_chart_with_title" },
    }];
  } else {
    rightSide.children = [];
  }
  find(resource, "main_work_queue_wrapper").children.push(rightSide);
}

function decoded(resource = workbenchTemplate()) {
  return {
    ListSet: { ListID: APP_ID, Title: "Office Asset Loan Management" },
    Pages: [{ Type: 103, Title: "Asset Loan Workbench Dashboard", LayoutID: "dashboard-layout-workbench", LayoutInResources: [{ ID: "dashboard-layout-workbench", RefId: "dashboard-layout-workbench", Resource: JSON.stringify(resource) }] }],
    Childs: [{ List: { ListID: LIST_ID, Title: "Loan Transactions" }, Fields: [{ FieldName: "Title" }, { FieldName: "Status" }] }],
    Forms: [],
    FormNewReports: [],
    DataReports: [],
    Workflows: [],
    Navigation: [{ ID: "nav", Title: "Workbench Dashboard" }],
    IconUrl: "{\"b\":\"#0f766e\",\"i\":\"fa-solid fa-laptop\",\"c\":\"#ffffff\"}",
    Roles: [],
    Permissions: [],
  };
}

function writePackage(dir, name, data) {
  const file = path.join(dir, `${name}.yapk`);
  fs.writeFileSync(file, `${JSON.stringify({ Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(data), "utf8")).toString("base64") })}\n`);
  return file;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ids(node) {
  return [node?.id, node?.name, node?.nv_label, node?.attrs?.name, node?.attrs?.nv_label, node?.derivedFromDashboardPageLayoutTemplate].filter(Boolean).map(String);
}

function visit(node, fn) {
  if (!node || typeof node !== "object") return;
  fn(node);
  for (const child of node.children || []) visit(child, fn);
}

function find(node, id) {
  let found = null;
  visit(node, (current) => {
    if (!found && ids(current).includes(id)) found = current;
  });
  return found;
}

function removeOperations(node) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node.children)) {
    node.children = node.children.filter((child) => !ids(child).includes("Operations"));
    node.children.forEach(removeOperations);
  }
}

function run(args) {
  return spawnSync(process.execPath, ["scripts/validate-dashboard-page-layout-template.mjs", ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function expectPass(label, args) {
  const result = run(args);
  assert.equal(result.status, 0, `${label} should pass.\n${result.stdout}\n${result.stderr}`);
}

function expectCode(label, args, code) {
  const result = run(args);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0, `${label} should fail.`);
  assert.match(output, new RegExp(code), `${label} did not report ${code}.\n${output}`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-workbench-layout-"));
try {
  expectPass("registry includes Workbench Dashboard template", ["--registry", "docs/reference/dashboard-page-layout-templates.json"]);
  expectPass("generated Workbench dashboard may delete unused right side panel and unused section modules", ["--package", writePackage(tempDir, "valid-workbench", decoded())]);

  const withRightPanel = workbenchTemplate();
  addRightSidePanel(withRightPanel, true);
  expectPass("generated Workbench dashboard may keep right side panel when it has business content", ["--package", writePackage(tempDir, "valid-right-panel", decoded(withRightPanel))]);

  const badFilterGrid = workbenchTemplate();
  find(badFilterGrid, "dashboard_standard_filter_group").attrs.columns = { count: 6, type: "repeat", minmax: ["160px", "1fr"] };
  expectCode("Workbench standard filter group with simplified Grid columns fails", ["--package", writePackage(tempDir, "bad-filter-grid", decoded(badFilterGrid))], "DASH_WORKBENCH_FILTER_GROUP_GRID_CONTRACT_INVALID");

  const emptyRightColumn = workbenchTemplate();
  find(emptyRightColumn, "main_work_queue_wrapper").attrs.columns["1"].list = [{ value: 2.5, unit: "fr" }, { value: 1, unit: "fr" }];
  expectCode("Workbench main grid with no right content but two desktop columns fails", ["--package", writePackage(tempDir, "empty-right-column", decoded(emptyRightColumn))], "DASH_WORKBENCH_EMPTY_RIGHT_COLUMN_NOT_PRUNED");

  const emptyChartSection = workbenchTemplate();
  find(find(emptyChartSection, "primary_working_area"), "chart_cards_section").children = [];
  expectCode("empty chart_cards_section fails", ["--package", writePackage(tempDir, "empty-chart-section", decoded(emptyChartSection))], "DASH_LAYOUT_EMPTY_CHART_CARDS_SECTION");

  const wrongParent = workbenchTemplate();
  const chart = find(find(wrongParent, "primary_working_area"), "chart_cards_section");
  find(wrongParent, "content").children.push(clone(chart));
  expectCode("chart_cards_section outside approved Workbench panels fails", ["--package", writePackage(tempDir, "wrong-chart-parent", decoded(wrongParent))], "DASH_LAYOUT_CHART_CARDS_SECTION_PARENT_INVALID");

  const tooManyCharts = workbenchTemplate();
  materializePrimaryCharts(tooManyCharts, 4);
  expectCode("chart_cards_section with more than three analytics templates fails", ["--package", writePackage(tempDir, "too-many-charts", decoded(tooManyCharts))], "DASH_LAYOUT_CHART_CARDS_SECTION_TOO_MANY_ANALYTICS");

  const emptyRightPanel = workbenchTemplate();
  addRightSidePanel(emptyRightPanel, false);
  expectCode("empty right_side_panel fails", ["--package", writePackage(tempDir, "empty-right-panel", decoded(emptyRightPanel))], "DASH_LAYOUT_EMPTY_RIGHT_SIDE_PANEL");

  console.log(JSON.stringify({ status: "pass", cases: 9 }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function normalizeMainWorkQueueWrapperToSingleColumn(queue) {
  queue.attrs = queue.attrs || {};
  queue.attrs.columns = {
    "1": {
      list: [
        { value: 1, unit: "fr" },
      ],
      last: { value: 1, unit: "fr" },
    },
    "2": {
      list: [
        { value: 1, unit: "fr" },
      ],
      last: { value: 1, unit: "fr" },
    },
    "3": {
      list: [
        { value: 1, unit: "fr" },
      ],
      last: { value: 1, unit: "fr" },
    },
  };
}

#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const TEMPLATE_ID = "dashboard-page-layouts-v1.1";
const GOLDEN_ID = "event_portfolio_dashboard_golden_reference";
const APP_ID = "1909200000000000001";
const LIST_ID = "1909200000000000100";
const SUMMARY_ID = "summary-open-loans";
const SAVE_VAR = { id: "openLoans", name: "openLoans" };

function templateRegistry() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/dashboard-page-layout-templates.json"), "utf8"));
}

function goldenRegistry() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/dashboard-golden-references.json"), "utf8"));
}

function baseV11Resource() {
  const resource = clone(templateRegistry().templates[0].template.parsedResource);
  resource.derivedFromDashboardPageLayoutTemplate = TEMPLATE_ID;
  resource.derivedFromGoldenReference = GOLDEN_ID;
  resource.goldenReferenceId = GOLDEN_ID;
  resource.plannedRegions = { filters: false, kpis: false, gridTable: false };
  delete resource.actions;
  normalizeShell(resource);
  removeOperations(resource);
  adaptBusinessText(resource);
  ensureCollectionInsideSection(resource);
  ensureSummaryBackedKpis(resource);
  pruneUnusedTemplateModules(resource);
  return resource;
}

function normalizeShell(resource) {
  resource.attrs = resource.attrs || {};
  resource.attrs.hideHeaderAll = true;
  resource.attrs.background = { classic: { color: "#f4f7fb" } };
  resource.attrs.container = resource.attrs.container || {};
  resource.attrs.container.padding = [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }];
  const main = find(resource, "Main");
  const content = find(resource, "Content");
  for (const node of [main, content].filter(Boolean)) {
    node.attrs = node.attrs || {};
    node.attrs.style = node.attrs.style || {};
    node.attrs.style.widthtype = [null, "1"];
    node.attrs.style.direction = node.attrs.style.direction || [null, "column"];
  }
  if (content) {
    delete content.attrs.background;
  }
}

function removeOperations(node) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node.children)) {
    node.children = node.children.filter((child) => !hasIdentity(child, "Operations"));
    node.children.forEach(removeOperations);
  }
}

function adaptBusinessText(node) {
  if (Array.isArray(node)) return node.forEach(adaptBusinessText);
  if (!node || typeof node !== "object") return;
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === "string" && !["id", "key", "type", "name", "nv_label", "nav_label", "derivedFromGoldenReference"].includes(key)) {
      node[key] = value
        .replaceAll("Marketing Event", "Office Asset Loan")
        .replaceAll("Campaign", "Loan")
        .replaceAll("Registration", "Checkout")
        .replaceAll("Budget", "Replacement Cost")
        .replaceAll("Event", "Asset");
    } else {
      adaptBusinessText(value);
    }
  }
}

function ensureCollectionInsideSection(resource) {
  const section = findBusinessSectionContentArea(resource);
  section.children = [gridTableWrapper()];
}

function ensureSummaryBackedKpis(resource) {
  resource.ReportIds = [SUMMARY_ID];
  resource.tempVars = [SAVE_VAR];
  resource.exts = [{
    i: SUMMARY_ID,
    category: "___Pivot___",
    key: "summary",
    attr: {
      ListID: LIST_ID,
      settings: { values: [{ fieldName: "ListDataID", func: "COUNT", id: "ListDataID" }] },
    },
  }];
  const section = findBusinessSectionContentArea(resource);
  section.children = section.children || [];
  section.children.push(summaryControl());
  section.children.push(visibleKpiValue());
}

function pruneUnusedTemplateModules(resource) {
  const content = find(resource, "Content") || find(resource, "content");
  if (content?.children) {
    content.children = content.children.filter((child) => ![
      "2_columns_section",
      "3_columns_section",
      "2_columns_60/40_section",
      "kpi_metrics_wrapper",
    ].some((identity) => hasIdentity(child, identity)));
  }
  const pageTitle = find(resource, "page_title_section");
  if (pageTitle?.children) {
    pageTitle.children = pageTitle.children.filter((child) => !hasIdentity(child, "section_content_area"));
  }
}

function gridTableWrapper() {
  return {
    type: "container",
    id: "grid_table_col_wrapper",
    name: "grid_table_col_wrapper",
    attrs: { style: { widthtype: [null, "1"], direction: [null, "column"] } },
    children: [
      {
        type: "container",
        id: "grid_table_col_caption",
        name: "grid_table_col_caption",
        children: [
          {
            type: "container",
            id: "grid_table_col_title_wrapper",
            name: "grid_table_col_title_wrapper",
            children: [{ type: "heading", id: "grid_table_col_title", name: "grid_table_col_title", attrs: { headc: { title: { value: "Asset Loan Work Queue" } } } }],
          },
          {
            type: "container",
            id: "grid_table_col_operations",
            name: "grid_table_col_operations",
            children: [{
              type: "container",
              id: "op_normal",
              name: "op_normal",
              children: [
                { type: "search-filter", id: "loan_work_queue_search", name: "loan_work_queue_search", attrs: { placeholder: "Search loans" } },
                { type: "action_button", id: "loan_work_queue_add", name: "loan_work_queue_add", label: "Add loan", attrs: { control_action: "loan_work_queue_add_item" } },
              ],
            }],
          },
        ],
      },
      {
        type: "container",
        id: "grid_table_col_content",
        name: "grid_table_col_content",
        children: [
          gridHeader("grid_table_col_header"),
          {
            ...collectionControl(),
            id: "loan_work_queue_collection",
            nv_label: "grid_table_col_body",
            children: [gridItem("grid_col_item")],
          },
        ],
      },
    ],
  };
}

function collectionControl() {
  return {
    type: "collection",
    name: "Asset Loan Work Queue",
    nv_label: "Asset Loan Work Queue",
    attrs: {
      datasetPresentationTemplateId: "collection_control_grid_table",
      data: {
        list: { AppID: 41, ListID: LIST_ID, Type: 1, Title: "Loan Requests", ListSetID: APP_ID },
        sort: [{ SortName: "Title", SortOrder: "asc" }],
        fulltext: [{ fields: ["Title"] }],
      },
      filterBindings: ["LoanStatus"],
    },
    children: [gridItem("loan_work_queue_item_grid")],
  };
}

function gridHeader(id = "loan_work_queue_header_grid") {
  const columns = [[2, "fr"], [1, "fr"], [1, "fr"]];
  return {
    type: "flex_grid",
    id,
    name: id,
    displayLabel: [null, false],
    attrs: { columns: { "1": { list: columns }, "3": { list: [[1, "fr"]] } }, rows: { "1": { list: [[1, "fr"]] } }, common: { hide: [null, false, false, true] } },
    children: ["Loan", "Status", "Owner"].map((label) => ({ type: "heading", name: label, attrs: { headc: { title: { value: label } } } })),
  };
}

function gridItem(id = "loan_work_queue_item_grid") {
  const columns = [[2, "fr"], [1, "fr"], [1, "fr"]];
  return {
    type: "flex_grid",
    id,
    name: id,
    displayLabel: [null, false],
    attrs: { columns: { "1": { list: columns }, "3": { list: [[1, "fr"]] } }, rows: { "1": { list: [[1, "fr"]] } } },
    children: [
      dynamicControl("dynamic-field", "Loan Title", "Title"),
      dynamicControl("dynamic-field", "Loan Status", "Text1"),
      dynamicControl("dynamic-user", "Owner", "User1"),
    ],
  };
}

function dynamicControl(type, name, field) {
  const control = {
    type,
    name,
    field,
    attrs: {
      source: "3",
      "obj-f": field,
      data: { field },
      field,
    },
  };
  if (type === "dynamic-user") control.attrs.user = { field };
  return control;
}

function summaryControl() {
  return {
    type: "summary",
    id: SUMMARY_ID,
    name: "Summary - Open Loans",
    runtimeModelProven: true,
    attrs: {
      data: { list: { AppID: 41, ListID: LIST_ID, Type: 1, Title: "Loan Requests", ListSetID: APP_ID } },
      save_var: SAVE_VAR,
    },
  };
}

function visibleKpiValue() {
  return {
    type: "heading",
    name: "Open Loans KPI Value",
    label: "Text",
    attrs: {
      headc: { title: { variable: [SAVE_VAR] } },
      heads: { ty: [null, "h2-bold"], color: "#071638" },
    },
  };
}

function decoded(resource = baseV11Resource()) {
  return {
    ListSet: { ListID: APP_ID, Title: "Office Asset Loan Management" },
    Pages: [{
      Type: 103,
      Title: "Asset Loan Operations Dashboard",
      LayoutID: "dashboard-layout-1",
      LayoutView: null,
      Ext2: "{\"src\":true}",
      LayoutInResources: [{ ID: "dashboard-layout-1", RefId: "dashboard-layout-1", Resource: JSON.stringify(resource) }],
    }],
    Childs: [{ List: { ListID: LIST_ID, Title: "Loan Requests" }, Fields: [{ FieldName: "Title", FieldType: "Text" }, { FieldName: "ListDataID", FieldID: "ListDataID", FieldType: "Text" }, { FieldName: "Text1", FieldType: "Text" }, { FieldName: "User1", FieldType: "User" }] }],
    Forms: [],
    FormNewReports: [],
    DataReports: [],
    Groups: [],
    IconUrl: "{\"b\":\"#0f766e\",\"i\":\"fa-solid fa-laptop\",\"c\":\"#ffffff\"}",
  };
}

function writePackage(dir, name, data) {
  const file = path.join(dir, `${name}.yapk`);
  fs.writeFileSync(file, `${JSON.stringify({ Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(data), "utf8")).toString("base64") })}\n`);
  return file;
}

function run(script, args) {
  return spawnSync(process.execPath, [script, ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function expectPass(label, script, args) {
  const result = run(script, args);
  assert.equal(result.status, 0, `${label} should pass.\n${result.stdout}\n${result.stderr}`);
}

function expectCode(label, script, args, code) {
  const result = run(script, args);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0, `${label} should fail.`);
  assert.match(output, new RegExp(code), `${label} did not report ${code}.\n${output}`);
}

function expectAbsentCodes(label, script, args, codes) {
  const result = run(script, args);
  const output = `${result.stdout}\n${result.stderr}`;
  for (const code of codes) assert.doesNotMatch(output, new RegExp(code), `${label} unexpectedly reported ${code}.\n${output}`);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function identities(node) {
  return [node?.id, node?.name, node?.Name, node?.label, node?.title, node?.nv_label, node?.nav_label, node?.attrs?.id, node?.attrs?.name, node?.attrs?.label, node?.attrs?.title, node?.attrs?.nv_label, node?.attrs?.nav_label, node?.derivedFromDashboardPageLayoutTemplate, node?.derivedFromGoldenReference].filter(Boolean).map(String);
}

function hasIdentity(node, expected) {
  return identities(node).some((id) => id.trim().toLowerCase() === String(expected).trim().toLowerCase());
}

function visit(node, fn) {
  if (!node || typeof node !== "object") return;
  fn(node);
  for (const child of node.children || []) visit(child, fn);
}

function find(node, expected) {
  let found = null;
  visit(node, (current) => {
    if (!found && hasIdentity(current, expected)) found = current;
  });
  return found;
}

function findBusinessSectionContentArea(resource) {
  let found = null;
  visitWithAncestors(resource, [], (current, ancestors) => {
    if (found || !hasIdentity(current, "section_content_area")) return;
    if (ancestors.some((ancestor) => hasIdentity(ancestor, "page_title_section"))) return;
    found = current;
  });
  assert.ok(found, "Expected a non-title section_content_area in the v1.1 template fixture.");
  return found;
}

function visitWithAncestors(node, ancestors, fn) {
  if (!node || typeof node !== "object") return;
  fn(node, ancestors);
  for (const child of node.children || []) visitWithAncestors(child, [...ancestors, node], fn);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-v11-validator-alignment-"));
try {
  const validPackage = writePackage(tempDir, "valid-v11", decoded());
  expectPass("v1.1 shell with valid Main > Content passes aggregate dashboard gates", "scripts/validate-dashboard-generation-hard-gates.mjs", ["--package", validPackage]);
  expectAbsentCodes("generic YAPK validator recognizes v1.1 identity candidates", "validate-yapk-package.js", [validPackage], [
    "DASHBOARD_RESOURCE_REQUIRED_KEYS_MISSING",
    "DASHBOARD_MAIN_CONTENT_NOT_IN_CHILDREN",
    "DASHBOARD_MAIN_CONTENT_MISSING",
    "KPI_CONTROL_DEFAULT_NAME",
  ]);

  const componentPackage = writePackage(tempDir, "component-v11", decoded(baseV11Resource()));
  expectPass("v1.1 shell may host Event Portfolio component regions inside approved slots", "scripts/validate-dashboard-generation-hard-gates.mjs", ["--package", componentPackage]);

  const competingShell = baseV11Resource();
  find(competingShell, "Content").children.push(clone(goldenRegistry().references[0].exportShape._ak_c));
  expectCode("Event Portfolio root copied under v1.1 Content fails", "scripts/validate-dashboard-golden-reference-conformance.mjs", ["--package", writePackage(tempDir, "competing-shell", decoded(competingShell))], "DASH_GOLDEN_COMPETING_ROOT_SHELL");

  const inventedModule = baseV11Resource();
  find(inventedModule, "Content").children.push({ type: "container", name: "custom_asset_dashboard_lane", attrs: { style: { widthtype: [null, "1"] } }, children: [] });
  expectCode("invented layout module still fails", "scripts/validate-dashboard-page-layout-template.mjs", ["--package", writePackage(tempDir, "invented-module", decoded(inventedModule))], "DASH_LAYOUT_INVENTED_LAYOUT_MODULE");

  const rootCollection = baseV11Resource();
  find(rootCollection, "Content").children.push(collectionControl());
  expectCode("business Collection directly under root Content fails", "scripts/validate-dashboard-page-layout-template.mjs", ["--package", writePackage(tempDir, "root-collection", decoded(rootCollection))], "DASH_LAYOUT_BUSINESS_CONTROL_OUTSIDE_ALLOWED_SLOT");

  const normalized = baseV11Resource();
  find(normalized, "Main").name = "main";
  find(normalized, "Content").name = "content";
  normalized.attrs.background = { color: "#f4f7fb" };
  normalized.attrs.container.padding = [null, 0];
  find(normalized, "Main").attrs.style.widthtype = [null, "1"];
  normalized.actions = [];
  expectPass("normalized labels, padding, full-width, and actions do not trigger mutation failure", "scripts/validate-dashboard-page-layout-template.mjs", ["--package", writePackage(tempDir, "normalized", decoded(normalized))]);

  console.log(JSON.stringify({ status: "pass", cases: 6 }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

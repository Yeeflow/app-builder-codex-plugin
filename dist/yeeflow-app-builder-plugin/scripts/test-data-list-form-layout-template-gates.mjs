#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts/validate-data-list-form-layout-template.mjs");
const NEW_EDIT_TEMPLATE_ID = "data_list_form_layout_new_edit_v1_1";
const VIEW_TEMPLATE_ID = "data_list_form_layout_view_item_v1_1";
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "data-list-form-layout-v11-"));
const results = [];

try {
  expectPass("registry validates", ["--registry", "docs/reference/data-list-form-layout-templates.json"]);

  expectPass("New/Edit template resource with marker passes", ["--resource", writeJson("new-edit-valid.json", newEditResource()), "--template", NEW_EDIT_TEMPLATE_ID, "--form-usage", "new/edit"]);
  expectPass("View item template resource with marker passes", ["--resource", writeJson("view-valid.json", viewResource()), "--template", VIEW_TEMPLATE_ID, "--form-usage", "view"]);
  expectPass("generated package with New/Edit and View templates passes", ["--package", writePackage("valid-package.yapk", decodedPackage())]);
  expectCode("generated package using default New/Edit/View layouts fails", ["--package", writePackage("default-layout-package.yapk", decodedPackage({ layoutView: { add: "default", edit: "default", view: "default" }, layouts: [{ LayoutID: "layout-default", Title: "All Items", Type: 0, LayoutInResources: [] }] }))], "DATA_LIST_FORM_LAYOUT_DEFAULT_USAGE_FORBIDDEN");
  expectCode("generated package missing View custom form assignment fails", ["--package", writePackage("missing-view-assignment.yapk", decodedPackage({ layoutView: { add: "layout-new-edit", edit: "layout-new-edit" } }))], "DATA_LIST_FORM_LAYOUT_USAGE_MISSING");
  expectCode("generated package with display setting pointing to Type 0 layout fails", ["--package", writePackage("type0-form-assignment.yapk", decodedPackage({ layoutView: { add: "layout-default", edit: "layout-new-edit", view: "layout-view" } }))], "DATA_LIST_FORM_LAYOUT_USAGE_NOT_CUSTOM_FORM");

  const newEditWithAnalytics = newEditResource();
  firstSlot(newEditWithAnalytics).children.push({ type: "pie-chart", nv_label: "pie_chart_control", attrs: { dataAnalyticsTemplateId: "data_analytics_pie_chart_with_title" } });
  expectCode("New/Edit form with analytics fails", ["--resource", writeJson("new-edit-analytics.json", newEditWithAnalytics), "--template", NEW_EDIT_TEMPLATE_ID, "--form-usage", "new/edit"], "DATA_LIST_FORM_LAYOUT_NEW_EDIT_RELATED_DATA_FORBIDDEN");

  const viewMissingTitle = viewResource();
  removeByIdentity(viewMissingTitle, "page_title_section");
  expectCode("View form missing page title section fails", ["--resource", writeJson("view-missing-title.json", viewMissingTitle), "--template", VIEW_TEMPLATE_ID, "--form-usage", "view"], "DATA_LIST_FORM_LAYOUT_VIEW_REQUIRED_REGION_MISSING");

  const directRootBusinessControl = viewResource();
  content(directRootBusinessControl).children.push({ type: "collection", nv_label: "loose_collection", attrs: { data: { list: { ListID: "list-1" } } } });
  expectCode("business control directly under Content fails", ["--resource", writeJson("view-root-business.json", directRootBusinessControl), "--template", VIEW_TEMPLATE_ID, "--form-usage", "view"], "DATA_LIST_FORM_LAYOUT_INVENTED_ROOT_MODULE");

  const markerMissing = viewResource({ marker: false });
  expectCode("generated package form missing template marker fails", ["--package", writePackage("missing-marker.yapk", decodedPackage({ viewResource: markerMissing }))], "DATA_LIST_FORM_LAYOUT_TEMPLATE_MARKER_MISSING");

  expectCode("App Plan custom form without layout selection table fails", ["--plan", writeText("plan-missing-selection.md", appPlan({ omitSelection: true }))], "DATA_LIST_FORM_LAYOUT_APP_PLAN_SELECTION_TABLE_MISSING");
  expectCode("App Plan data list missing New/Edit custom form plan fails", ["--plan", writeText("plan-missing-new-edit.md", appPlan({ omitNewEditSelection: true }))], "DATA_LIST_FORM_LAYOUT_APP_PLAN_NEW_EDIT_FORM_REQUIRED");
  expectCode("App Plan data list missing View custom form plan fails", ["--plan", writeText("plan-missing-view.md", appPlan({ omitViewSelection: true }))], "DATA_LIST_FORM_LAYOUT_APP_PLAN_VIEW_FORM_REQUIRED");
  expectCode("App Plan New/Edit selecting View template fails", ["--plan", writeText("plan-new-edit-wrong-template.md", appPlan({ newEditTemplate: VIEW_TEMPLATE_ID }))], "DATA_LIST_FORM_LAYOUT_APP_PLAN_NEW_EDIT_TEMPLATE_MISMATCH");
  expectCode("App Plan View selecting New/Edit template fails", ["--plan", writeText("plan-view-wrong-template.md", appPlan({ viewTemplate: NEW_EDIT_TEMPLATE_ID }))], "DATA_LIST_FORM_LAYOUT_APP_PLAN_VIEW_TEMPLATE_MISMATCH");
  expectPass("App Plan custom form layout selections pass", ["--plan", writeText("plan-valid.md", appPlan())]);

  console.log(JSON.stringify({ status: "pass", results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function run(args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
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

function template(file, templateId, marker = true) {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference", file), "utf8"));
  const resource = clone(raw.templateResource);
  if (marker) {
    resource.derivedFromDataListFormLayoutTemplate = templateId;
    resource.dataListFormLayoutTemplateId = templateId;
  }
  removeOperations(resource);
  return resource;
}

function newEditResource(options = {}) {
  return template("data-list-form-layout-new-edit.template.json", NEW_EDIT_TEMPLATE_ID, options.marker !== false);
}

function viewResource(options = {}) {
  return template("data-list-form-layout-view-item.template.json", VIEW_TEMPLATE_ID, options.marker !== false);
}

function decodedPackage(options = {}) {
  const newEdit = options.newEditResource || newEditResource();
  const view = options.viewResource || viewResource();
  const layouts = options.layouts || [
    { LayoutID: "layout-default", Title: "All Items", Type: 0, LayoutInResources: [] },
    { LayoutID: "layout-new-edit", Title: "New and Edit form", Type: 1, LayoutInResources: [{ ID: "layout-new-edit", RefId: "layout-new-edit", Resource: JSON.stringify(newEdit) }] },
    { LayoutID: "layout-view", Title: "View item", Type: 1, LayoutInResources: [{ ID: "layout-view", RefId: "layout-view", Resource: JSON.stringify(view) }] },
  ];
  const layoutView = options.layoutView || { add: "layout-new-edit", edit: "layout-new-edit", view: "layout-view" };
  return {
    ListSet: { ListID: "1909200000000000001", Title: "Data List Form Layout Test" },
    Childs: [
      {
        List: { ListID: "1909200000000000100", Title: "Assets", LayoutView: JSON.stringify(layoutView) },
        Fields: [{ FieldName: "Title", DisplayName: "Asset Name", FieldType: "Text", Type: "input" }],
        Layouts: layouts,
      },
    ],
    Pages: [],
    Forms: [],
    FormNewReports: [],
    DataReports: [],
    Navigation: [],
    IconUrl: "{\"b\":\"#0f766e\",\"i\":\"fa-solid fa-box\",\"c\":\"#ffffff\"}",
  };
}

function appPlan({ omitSelection = false, omitNewEditSelection = false, omitViewSelection = false, newEditTemplate = NEW_EDIT_TEMPLATE_ID, viewTemplate = VIEW_TEMPLATE_ID } = {}) {
  const selectionRows = [
    omitNewEditSelection ? "" : `| Assets | Asset New/Edit | New/Edit | ${newEditTemplate} | Current item field sections | None | New/Edit focuses on current item editing | Generated-final validation |`,
    omitViewSelection ? "" : `| Assets | Asset View | View | ${viewTemplate} | Page title, KPI, current item and related data sections | Related loans and analytics | View item shows current record and related context | Generated-final validation |`,
  ].filter(Boolean).join("\n");
  const selection = omitSelection ? "" : `
#### Data List Form Layout Template Selection

| Data List or Library | Custom Form | Form Usage | Selected Data List Form Layout Template | Business Sections Needed | Related Data / Analytics Needed | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
${selectionRows}
`;
  return `
# Office Asset Loan Management - Yeeflow App Plan

## 1. Plan Status

Ready.

## 4. Data Lists and Document Libraries Plan

### 4.1 Assets

- Selected Yeeflow resource type: Data list
- Description: Office asset catalog.
- Business purpose: Track loanable assets.

#### Fields

| Field Order | Business Label | Display Name | Internal ID / Field Key | Exact Yeeflow Field Type | Exact Yeeflow Control Type | Support Source | Proof Label | Fallback / Deferred Reason | Required | Unique | Default Value | Placeholder | Validation Rules | Choice Values | Lookup Target | Lookup Display Field | Additional Lookup Fields | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Asset Name | Title | Title | Title | input control | plugin-known field/control type | validator-backed | N/A | Yes | No | | Enter asset name | | | | | | Native title field |

## 10. Custom Data List Forms Plan

### 10.1 Assets

| Form Name | Form Type | Purpose | Used By | Layout Pattern | Actions Required | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Asset New/Edit | New/Edit | Create and update assets | Coordinators | Data List Form Layouts v1.1 | Yes | Uses current item fields |
| Asset View | View | Review asset and related activity | Coordinators | Data List Form Layouts v1.1 | No | Uses related context |

${selection}

#### Form Fields Layout Template Selection

| Data List or Library | Custom Form | Field Group | Selected Form Fields Layout Template | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Assets | Asset New/Edit | Basic fields | data_list_form_fields_grid_v1_1 | 2 | 2 | 1 | Notes | None | Generated-final validation |
| Assets | Asset View | Current record fields | data_list_form_fields_grid_v1_1 | 2 | 2 | 1 | Notes | None | Generated-final validation |

## 11. Data List Workflows Plan
`;
}

function content(resource) {
  return find(resource, "content") || find(resource, "Content");
}

function firstSlot(resource) {
  return find(resource, "section_content_area");
}

function ids(node) {
  return [node?.id, node?.name, node?.label, node?.nv_label, node?.attrs?.name, node?.attrs?.nv_label, node?.attrs?.nav_label].filter(Boolean).map(String);
}

function visit(node, fn) {
  if (!node || typeof node !== "object") return;
  fn(node);
  for (const child of node.children || []) visit(child, fn);
}

function find(node, identity) {
  let found = null;
  visit(node, (current) => {
    if (!found && ids(current).includes(identity)) found = current;
  });
  return found;
}

function removeByIdentity(node, identity) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node.children)) {
    node.children = node.children.filter((child) => !ids(child).includes(identity));
    node.children.forEach((child) => removeByIdentity(child, identity));
  }
}

function removeOperations(node) {
  removeByIdentity(node, "Operations");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function writeJson(name, value) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
}

function writeText(name, value) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, `${value.trim()}\n`);
  return file;
}

function writePackage(name, decoded) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, `${JSON.stringify({ Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64") })}\n`);
  return file;
}

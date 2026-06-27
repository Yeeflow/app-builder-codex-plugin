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
const WORKBENCH_TEMPLATE_ID = "data_list_form_layout_workbench";
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "data-list-form-layout-v11-"));
const results = [];

try {
  expectPass("registry validates", ["--registry", "docs/reference/data-list-form-layout-templates.json"]);

  expectPass("New/Edit template resource with marker passes", ["--resource", writeJson("new-edit-valid.json", newEditResource()), "--template", NEW_EDIT_TEMPLATE_ID, "--form-usage", "new/edit"]);
  expectPass("View item template resource with marker passes", ["--resource", writeJson("view-valid.json", viewResource()), "--template", VIEW_TEMPLATE_ID, "--form-usage", "view"]);
  expectPass("Workbench item details template resource with marker passes", ["--resource", writeJson("workbench-valid.json", workbenchResource()), "--template", WORKBENCH_TEMPLATE_ID, "--form-usage", "view"]);
  expectPass("generated package with New/Edit and View templates passes", ["--package", writePackage("valid-package.yapk", decodedPackage())]);
  expectPass("generated package with full-page Workbench View template passes", ["--package", writePackage("workbench-package.yapk", decodedPackage({ viewResource: workbenchResource(), viewTitle: "Asset Workbench Details", layoutView: { add: "layout-new-edit", edit: "layout-new-edit", view: "layout-view", opentype: { view: "new" }, modalsize: {} } }))]);
  expectCode("generated package with Type 1 form LayoutView placeholder fails", ["--package", writePackage("layoutview-placeholder.yapk", decodedPackage({ layouts: [
    { LayoutID: "layout-default", Title: "All Items", Type: 0, LayoutInResources: [] },
    formLayout("layout-new-edit", "New and Edit form", newEditResource(), { layoutView: { source: "minimal-resource-graph", formName: "New and Edit form", listName: "Assets" } }),
    formLayout("layout-view", "View item", viewResource()),
  ] }))], "DATA_LIST_FORM_LAYOUTVIEW_PLACEHOLDER");
  expectCode("generated package with Type 1 form LayoutView/resource drift fails", ["--package", writePackage("layoutview-resource-drift.yapk", decodedPackage({ layouts: [
    { LayoutID: "layout-default", Title: "All Items", Type: 0, LayoutInResources: [] },
    formLayout("layout-new-edit", "New and Edit form", newEditResource()),
    formLayout("layout-view", "View item", viewResource(), { layoutView: newEditResource() }),
  ] }))], "DATA_LIST_FORM_LAYOUTVIEW_RESOURCE_DRIFT");
  expectCode("generated package with empty Type 1 custom form layout fails", ["--package", writePackage("empty-custom-form-layout.yapk", decodedPackage({ layouts: [
    { LayoutID: "layout-default", Title: "All Items", Type: 0, LayoutInResources: [] },
    { LayoutID: "layout-new-edit", Title: "New and Edit form", Type: 1, LayoutInResources: [] },
    formLayout("layout-view", "View item", viewResource()),
  ] }))], "DATA_LIST_FORM_LAYOUTVIEW_RESOURCE_MISSING");
  expectCode("generated package using default New/Edit/View layouts fails", ["--package", writePackage("default-layout-package.yapk", decodedPackage({ layoutView: { add: "default", edit: "default", view: "default" }, layouts: [{ LayoutID: "layout-default", Title: "All Items", Type: 0, LayoutInResources: [] }] }))], "DATA_LIST_FORM_LAYOUT_DEFAULT_USAGE_FORBIDDEN");
  expectCode("generated package missing View custom form assignment fails", ["--package", writePackage("missing-view-assignment.yapk", decodedPackage({ layoutView: { add: "layout-new-edit", edit: "layout-new-edit" } }))], "DATA_LIST_FORM_LAYOUT_USAGE_MISSING");
  expectCode("generated package with display setting pointing to Type 0 layout fails", ["--package", writePackage("type0-form-assignment.yapk", decodedPackage({ layoutView: { add: "layout-default", edit: "layout-new-edit", view: "layout-view" } }))], "DATA_LIST_FORM_LAYOUT_USAGE_NOT_CUSTOM_FORM");

  const newEditWithAnalytics = newEditResource();
  firstSlot(newEditWithAnalytics).children.push({ type: "pie-chart", nv_label: "pie_chart_control", attrs: { dataAnalyticsTemplateId: "data_analytics_pie_chart_with_title" } });
  expectCode("New/Edit form with analytics fails", ["--resource", writeJson("new-edit-analytics.json", newEditWithAnalytics), "--template", NEW_EDIT_TEMPLATE_ID, "--form-usage", "new/edit"], "DATA_LIST_FORM_LAYOUT_NEW_EDIT_RELATED_DATA_FORBIDDEN");

  const viewMissingTitle = viewResource();
  removeByIdentity(viewMissingTitle, "page_title_section");
  expectCode("View form missing page title section fails", ["--resource", writeJson("view-missing-title.json", viewMissingTitle), "--template", VIEW_TEMPLATE_ID, "--form-usage", "view"], "DATA_LIST_FORM_LAYOUT_VIEW_REQUIRED_REGION_MISSING");

  const workbenchAsEdit = workbenchResource();
  expectCode("Workbench template used as New/Edit fails", ["--resource", writeJson("workbench-as-edit.json", workbenchAsEdit), "--template", WORKBENCH_TEMPLATE_ID, "--form-usage", "new/edit"], "DATA_LIST_FORM_LAYOUT_WORKBENCH_FORBIDDEN_NEW_EDIT");

  expectCode("Workbench View form without full-page display setting fails", ["--package", writePackage("workbench-not-full-page.yapk", decodedPackage({ viewResource: workbenchResource(), viewTitle: "Asset Workbench Details", layoutView: { add: "layout-new-edit", edit: "layout-new-edit", view: "layout-view" } }))], "DATA_LIST_FORM_LAYOUT_WORKBENCH_VIEW_FULL_PAGE_REQUIRED");

  const emptyWorkbenchChartSection = workbenchResource({ emptyChartSection: true });
  expectCode("Workbench empty chart cards section fails", ["--resource", writeJson("workbench-empty-chart-section.json", emptyWorkbenchChartSection), "--template", WORKBENCH_TEMPLATE_ID, "--form-usage", "view"], "DATA_LIST_FORM_LAYOUT_WORKBENCH_EMPTY_CHART_CARDS_SECTION");

  const emptyWorkbenchRightPanel = workbenchResource({ emptyRightPanel: true });
  expectCode("Workbench empty right side panel fails", ["--resource", writeJson("workbench-empty-right-panel.json", emptyWorkbenchRightPanel), "--template", WORKBENCH_TEMPLATE_ID, "--form-usage", "view"], "DATA_LIST_FORM_LAYOUT_WORKBENCH_EMPTY_RIGHT_SIDE_PANEL");

  const directRootBusinessControl = viewResource();
  content(directRootBusinessControl).children.push({ type: "collection", nv_label: "loose_collection", attrs: { data: { list: { ListID: "list-1" } } } });
  expectCode("business control directly under Content fails", ["--resource", writeJson("view-root-business.json", directRootBusinessControl), "--template", VIEW_TEMPLATE_ID, "--form-usage", "view"], "DATA_LIST_FORM_LAYOUT_INVENTED_ROOT_MODULE");

  const emptyCopiedSection = newEditResource();
  addEmptyCopiedContentCard(emptyCopiedSection);
  expectCode("generated Data List form empty copied business section fails", ["--resource", writeJson("new-edit-empty-copied-section.json", emptyCopiedSection), "--template", NEW_EDIT_TEMPLATE_ID, "--form-usage", "new/edit"], "DATA_LIST_FORM_LAYOUT_EMPTY_SECTION_CONTENT_AREA");

  const residualTemplateLabel = newEditResource();
  firstSlot(residualTemplateLabel).children.push({ type: "text", id: "stale_section_text", nv_label: "stale_section_text", text: "Active Loan Pipeline" });
  expectCode("generated Data List form residual template label fails", ["--resource", writeJson("new-edit-residual-template-label.json", residualTemplateLabel), "--template", NEW_EDIT_TEMPLATE_ID, "--form-usage", "new/edit"], "DATA_LIST_FORM_LAYOUT_TEMPLATE_RESIDUAL_LABEL");

  const markerMissing = viewResource({ marker: false });
  expectCode("generated package form missing template marker fails", ["--package", writePackage("missing-marker.yapk", decodedPackage({ viewResource: markerMissing }))], "DATA_LIST_FORM_LAYOUT_TEMPLATE_MARKER_MISSING");

  expectCode("App Plan custom form without layout selection table fails", ["--plan", writeText("plan-missing-selection.md", appPlan({ omitSelection: true }))], "DATA_LIST_FORM_LAYOUT_APP_PLAN_SELECTION_TABLE_MISSING");
  expectCode("App Plan data list missing New/Edit custom form plan fails", ["--plan", writeText("plan-missing-new-edit.md", appPlan({ omitNewEditSelection: true }))], "DATA_LIST_FORM_LAYOUT_APP_PLAN_NEW_EDIT_FORM_REQUIRED");
  expectCode("App Plan data list missing View custom form plan fails", ["--plan", writeText("plan-missing-view.md", appPlan({ omitViewSelection: true }))], "DATA_LIST_FORM_LAYOUT_APP_PLAN_VIEW_FORM_REQUIRED");
  expectCode("App Plan New/Edit selecting View template fails", ["--plan", writeText("plan-new-edit-wrong-template.md", appPlan({ newEditTemplate: VIEW_TEMPLATE_ID }))], "DATA_LIST_FORM_LAYOUT_APP_PLAN_NEW_EDIT_TEMPLATE_MISMATCH");
  expectCode("App Plan View selecting New/Edit template fails", ["--plan", writeText("plan-view-wrong-template.md", appPlan({ viewTemplate: NEW_EDIT_TEMPLATE_ID }))], "DATA_LIST_FORM_LAYOUT_APP_PLAN_VIEW_TEMPLATE_MISMATCH");
  expectCode("App Plan Workbench View without Full page fails", ["--plan", writeText("plan-workbench-missing-full-page.md", appPlan({ viewTemplate: WORKBENCH_TEMPLATE_ID, viewReason: "Workbench related context" }))], "DATA_LIST_FORM_LAYOUT_APP_PLAN_WORKBENCH_FULL_PAGE_REQUIRED");
  expectPass("App Plan Workbench View layout selection passes", ["--plan", writeText("plan-workbench-valid.md", appPlan({ viewTemplate: WORKBENCH_TEMPLATE_ID, viewReason: "Open in: Full page Workbench related context" }))]);
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
  setTemplateText(resource, "section_title_text", "Asset Details");
  setTemplateText(resource, "section_title_description", "Review and maintain asset details.");
  setTemplateText(resource, "page_title_text", "Asset View");
  setTemplateText(resource, "page_title_description", "View asset record details.");
  materializeFirstFieldSlot(resource);
  removeEmptyBusinessSections(resource);
  return resource;
}

function newEditResource(options = {}) {
  return template("data-list-form-layout-new-edit.template.json", NEW_EDIT_TEMPLATE_ID, options.marker !== false);
}

function viewResource(options = {}) {
  return template("data-list-form-layout-view-item.template.json", VIEW_TEMPLATE_ID, options.marker !== false);
}

function workbenchResource(options = {}) {
  const resource = template("data-list-form-layout-workbench.template.json", WORKBENCH_TEMPLATE_ID, options.marker !== false);
  removeByIdentity(resource, "Operations");
  setTemplateText(resource, "page_title_text", "Asset Workbench Details");
  setTemplateText(resource, "page_title_description", "Review asset record details and related operational context.");
  const primary = find(resource, "primary_working_area");
  if (primary) {
    primary.children = [...(primary.children || []), {
      type: "container",
      id: "chart_cards_section",
      nv_label: "chart_cards_section",
      children: options.emptyChartSection ? [] : [
        { type: "pie-chart", id: "asset_status_chart", nv_label: "asset_status_chart", dataAnalyticsTemplateId: "data_analytics_pie_chart_with_title", templateId: "data_analytics_pie_chart_with_title", runtimeModelProven: true },
      ],
    }];
  }
  const queueWrapper = find(resource, "main_work_queue_wrapper");
  if (queueWrapper) {
    queueWrapper.children = [...(queueWrapper.children || []), {
      type: "container",
      id: "right_side_panel",
      nv_label: "right_side_panel",
      children: options.emptyRightPanel ? [] : [
        { type: "container", id: "chart_cards_section", nv_label: "chart_cards_section", children: [
          { type: "bar-chart", id: "asset_workbench_bar", nv_label: "asset_workbench_bar", dataAnalyticsTemplateId: "data_analytics_bar_chart_with_title", templateId: "data_analytics_bar_chart_with_title", runtimeModelProven: true },
        ] },
      ],
    }];
  }
  return resource;
}

function decodedPackage(options = {}) {
  const newEdit = options.newEditResource || newEditResource();
  const view = options.viewResource || viewResource();
  const layouts = options.layouts || [
    { LayoutID: "layout-default", Title: "All Items", Type: 0, LayoutInResources: [] },
    formLayout("layout-new-edit", "New and Edit form", newEdit),
    formLayout("layout-view", options.viewTitle || "View item", view),
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

function formLayout(layoutId, title, resource, options = {}) {
  const resourceJson = JSON.stringify(resource);
  const layoutView = options.layoutView === undefined ? resource : options.layoutView;
  return {
    LayoutID: layoutId,
    Title: title,
    Type: 1,
    LayoutView: typeof layoutView === "string" ? layoutView : JSON.stringify(layoutView),
    LayoutInResources: [{ ID: layoutId, RefId: layoutId, Resource: resourceJson }],
  };
}

function appPlan({ omitSelection = false, omitNewEditSelection = false, omitViewSelection = false, newEditTemplate = NEW_EDIT_TEMPLATE_ID, viewTemplate = VIEW_TEMPLATE_ID, viewReason = "View item shows current record and related context" } = {}) {
  const selectionRows = [
    omitNewEditSelection ? "" : `| Assets | Asset New/Edit | New/Edit | ${newEditTemplate} | Current item field sections | None | New/Edit focuses on current item editing | Generated-final validation |`,
    omitViewSelection ? "" : `| Assets | Asset View | View | ${viewTemplate} | Page title, KPI, current item and related data sections | Related loans and analytics | ${viewReason} | Generated-final validation |`,
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
  const card = find(resource, "content_card_wrapper") || find(resource, "content_card_60_wrapper") || find(resource, "content_card_40_wrapper");
  return card ? find(card, "section_content_area") : find(resource, "section_content_area");
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

function setTemplateText(root, identity, text) {
  const node = find(root, identity);
  if (!node) return;
  node.text = text;
  node.title = text;
  node.value = text;
  node.attrs = { ...(node.attrs || {}), text };
}

function materializeFirstFieldSlot(resource) {
  const slot = firstSlot(resource);
  if (!slot) return;
  slot.children = [
    {
      type: "grid",
      id: "form_grid_fields_wrapper",
      nv_label: "form_grid_fields_wrapper",
      dataListFormFieldsTemplateId: "data_list_form_fields_grid_v1_1",
      children: [
        { type: "input", id: "asset_title", nv_label: "Asset Name", name: "Asset Name", attrs: { data: { field: "Title" } } },
      ],
    },
  ];
}

function addEmptyCopiedContentCard(resource) {
  const card = find(resource, "content_card_wrapper");
  const rootContent = content(resource);
  if (!card || !rootContent) return;
  const copy = clone(card);
  const slot = find(copy, "section_content_area");
  if (slot) slot.children = [];
  rootContent.children.push(copy);
}

function removeEmptyBusinessSections(root) {
  const removableWrappers = new Set(["content_card_wrapper", "content_card_60_wrapper", "content_card_40_wrapper", "1_columns_section", "2_columns_section", "3_columns_section", "2_columns_60/40_section", "1_row_section", "2_rows_section", "3_rows_section", "chart_cards_section", "right_side_panel"]);
  const visitAndFilter = (node) => {
    if (!node || typeof node !== "object" || !Array.isArray(node.children)) return;
    node.children.forEach(visitAndFilter);
    node.children = node.children.filter((child) => {
      if (ids(child).includes("section_content_area") && !hasMeaningfulBusinessContent(child)) return false;
      if (![...removableWrappers].some((identity) => ids(child).includes(identity))) return true;
      return hasMeaningfulBusinessContent(child);
    });
  };
  visitAndFilter(root);
}

function hasMeaningfulBusinessContent(node) {
  let meaningful = false;
  visit(node, (current) => {
    if (meaningful || current === node) return;
    const type = String(current?.type || "");
    if (["input", "input_number", "switch", "textarea", "richtext", "dynamic-field", "dynamic-user", "dynamic-image", "dynamic-file", "collection", "pie-chart", "bar-chart", "line-chart", "pivot-table", "summary"].includes(type)) meaningful = true;
    if (current?.dataListFormFieldsTemplateId || current?.dataListFormControlTemplateId) meaningful = true;
  });
  return meaningful;
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

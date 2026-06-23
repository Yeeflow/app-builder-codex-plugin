#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts/validate-dashboard-dataset-presentation-golden-references.mjs");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-dataset-presentation-"));
const results = [];

try {
  expectPass("registry validates", ["--registry"]);

  const validPlan = write("valid-plan.md", `# Yeeflow App Plan

## Dashboard Pages Plan

| Dashboard Page | Dataset Region | Source Resource | Business Purpose | Selected Collection Presentation Reference | Selection Rationale |
| --- | --- | --- | --- | --- | --- |
| Operations | Asset cards | Assets Data List | Browse available assets as cards | collection_control_responsive_card_grid | Card browsing is better for asset overview |
| Operations | Active loans | Loan Requests Data List | Dense work queue scan | collection_control_grid_table | Dense row/column scanning for an operational work queue |
| Operations | Search documents | Document Library | Search document metadata | collection_control_grid_table_with_search | Fulltext document lookup |
| Operations | Bulk reminders | Loan Requests Data List | Batch send reminders | collection_control_grid_table_with_multiselect | Multi-row selection and batch reminder |
| Operations | Bulk card close | Loan Requests Data List | Batch close selected card records | collection_control_card_with_multiselect_toolbar | Multi-select cards with selected count and batch operation |
| Operations | Primary work queue | Loan Requests Data List | Primary operational pipeline | Event Pipeline Grid-Table | High-fidelity work queue |
`);
  expectPass("App Plan with approved dataset presentation references passes", ["--app-plan", validPlan]);

  const noWorkaroundPlan = write("no-workaround-plan.md", `# Yeeflow App Plan

## 6. Form Reports Plan

Form reports are independent approval-based resources and are separate from Dashboard page planning.

## 14. Dashboard Pages Plan

Dashboard validator commands used during validation:

- Run scripts/validate-dashboard-dataset-presentation-golden-references.mjs --app-plan yeeflow-app-plan.md
- The dashboard page may also include form report status text in a non-dataset note.

#### Record Display Control Selection

| Section | Data Source | Display Need | Selected Record Display Control | Selected Collection Presentation Reference | Required Business Fields | Selection Reason | Detail/Open Behavior | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Active loans | Loan Requests Data List | Dense operational row scanning | Collection | collection_control_grid_table | Loan title, requester, due date, status | Dense row/column scanning for an operational work queue | Open selected loan | Local package proof plus runtime proof |
| Static summary | Loan Requests Data List | Summary table only | Data table | not applicable | Status totals | Native table is enough | None | Local package proof |
`);
  expectPass("App Plan ignores non-dataset prose and validator commands without workaround text", ["--app-plan", noWorkaroundPlan]);

  const missingPlan = write("missing-plan.md", `# Yeeflow App Plan

## Dashboard Pages Plan

| Dashboard Page | Dataset Region | Source Resource | Business Purpose | Control |
| --- | --- | --- | --- | --- |
| Operations Dashboard | Active loans | Loan Requests Data List | Dashboard Collection work queue | Collection |
`);
  expectCode("App Plan missing Collection presentation reference fails", ["--app-plan", missingPlan], "DASH_DATASET_APP_PLAN_REFERENCE_MISSING");

  const inventedPlan = write("invented-plan.md", `# Yeeflow App Plan

## Dashboard Pages Plan

| Dashboard Page | Dataset Region | Source Resource | Business Purpose | Selected Collection Presentation Reference |
| --- | --- | --- | --- | --- |
| Operations Dashboard | Active loans | Loan Requests Data List | Dashboard Collection work queue | collection_control_magic_timeline |
`);
  expectCode("App Plan invented Collection reference fails", ["--app-plan", inventedPlan], "DASH_DATASET_APP_PLAN_REFERENCE_UNKNOWN");

  const mismatchPlan = write("mismatch-plan.md", `# Yeeflow App Plan

## Dashboard Pages Plan

| Dashboard Page | Dataset Region | Source Resource | Business Purpose | Selected Collection Presentation Reference | Selection Rationale |
| --- | --- | --- | --- | --- | --- |
| Operations Dashboard | Active loans | Loan Requests Data List | Dashboard Collection work queue | collection_control_responsive_card_grid | Dense table scanning with row and column comparison |
`);
  expectCode("App Plan selected template must match business signals", ["--app-plan", mismatchPlan], "DASH_DATASET_APP_PLAN_SELECTION_RATIONALE_MISMATCH");

  const multiplePlan = write("multiple-plan.md", `# Yeeflow App Plan

## Dashboard Pages Plan

| Dashboard Page | Dataset Region | Source Resource | Business Purpose | Selected Collection Presentation Reference | Selection Rationale |
| --- | --- | --- | --- | --- | --- |
| Operations Dashboard | Active loans | Loan Requests Data List | Dashboard Collection work queue | collection_control_grid_table and collection_control_grid_table_with_search | Dense scanning and search |
`);
  expectCode("App Plan selects exactly one Collection presentation reference", ["--app-plan", multiplePlan], "DASH_DATASET_APP_PLAN_REFERENCE_NOT_EXACTLY_ONE");

  expectPass("synthetic app using all approved Dashboard Collection references passes", ["--package", writePackage("valid-all", validPages())]);
  const conformancePlan = write("conformance-plan.md", `# Yeeflow App Plan

## Dashboard Pages Plan

| Dashboard Page | Dataset Region | Source Resource | Business Purpose | Selected Record Display Control | Selected Collection Presentation Reference | Selection Rationale |
| --- | --- | --- | --- | --- | --- | --- |
| Asset Cards Dashboard | Asset cards | Assets Data List | Browse available assets as cards | Collection | collection_control_responsive_card_grid | Card browsing is better for asset overview |
| Active Loans Dashboard | Active loans | Loan Requests Data List | Dense operational row scanning | Collection | collection_control_grid_table | Dense row/column scanning for an operational work queue |
| Document Search Dashboard | Document search | Document Library | Search document metadata | Collection | collection_control_grid_table_with_search | Fulltext document lookup |
| Bulk Reminder Dashboard | Bulk reminders | Loan Requests Data List | Batch send reminders | Collection | collection_control_grid_table_with_multiselect | Multi-row selection and batch reminder |
| Card Bulk Dashboard | Bulk cards | Loan Requests Data List | Batch close selected card records | Collection | collection_control_card_with_multiselect_toolbar | Multi-select cards with selected count and batch operation |
| Primary Pipeline Dashboard | Event pipeline | Loan Requests Data List | Primary operational pipeline | Collection | Event Pipeline Grid-Table | High-fidelity work queue |
`);
  expectPass("App Plan-to-package region template conformance passes", ["--app-plan", conformancePlan, "--package", writePackage("valid-plan-package-conformance", validPages())]);

  const collapsedPages = validPages();
  for (const item of findControlsByType(collapsedPages, "collection")) {
    item.attrs = { ...(item.attrs || {}), datasetPresentationTemplateId: "Event Pipeline Grid-Table" };
  }
  expectCode("App Plan-to-package conformance fails when template diversity collapses", ["--app-plan", conformancePlan, "--package", writePackage("collapsed-template-diversity", collapsedPages)], "DASH_DATASET_TEMPLATE_DIVERSITY_COLLAPSED");
  expectCode("App Plan selected template must be materialized", ["--app-plan", conformancePlan, "--package", writePackage("collapsed-template-materialization", collapsedPages)], "DASH_DATASET_APP_PLAN_TEMPLATE_NOT_MATERIALIZED");

  const mismatchedRegionPages = validPages();
  findControl(mismatchedRegionPages[1], "active_loans_collection").attrs.datasetPresentationTemplateId = "collection_control_grid_table_with_search";
  expectCode("App Plan-to-package conformance fails on region template mismatch", ["--app-plan", conformancePlan, "--package", writePackage("region-template-mismatch", mismatchedRegionPages)], "DASH_DATASET_REGION_TEMPLATE_MISMATCH");

  const inheritedOnlyPages = validPages();
  const activeLoansAncestor = findControl(inheritedOnlyPages[1], "active_loans_content_card_wrapper");
  activeLoansAncestor.attrs = { ...(activeLoansAncestor.attrs || {}), datasetPresentationTemplateId: "collection_control_grid_table" };
  delete findControl(inheritedOnlyPages[1], "active_loans_collection").attrs.datasetPresentationTemplateId;
  expectCode("App Plan-to-package conformance requires explicit Collection-root provenance", ["--app-plan", conformancePlan, "--package", writePackage("inherited-only-template", inheritedOnlyPages)], "DASH_DATASET_COLLECTION_EXPLICIT_PROVENANCE_MISSING");

  const outsideSlotPages = validPages();
  outsideSlotPages[1].children[0].children[0].children = [gridTableSection("active_loans", "collection_control_grid_table")];
  expectCode("Collection template outside v1.1 section content slot fails", ["--package", writePackage("outside-slot", outsideSlotPages)], "DASH_DATASET_COLLECTION_OUTSIDE_V11_SLOT");

  const noProvenancePages = validPages();
  findControl(noProvenancePages[0], "asset_cards_collection").attrs.datasetPresentationTemplateId = "";
  expectCode("Collection without approved template provenance fails", ["--package", writePackage("no-provenance", noProvenancePages)], "DASH_DATASET_COLLECTION_TEMPLATE_PROVENANCE_MISSING");

  const inventedTemplatePages = validPages();
  findControl(inventedTemplatePages[0], "asset_cards_collection").attrs.datasetPresentationTemplateId = "collection_control_fake";
  expectCode("invented template id fails", ["--package", writePackage("invented-template", inventedTemplatePages)], "DASH_DATASET_COLLECTION_TEMPLATE_UNKNOWN");

  const simplifiedGridPages = validPages();
  const activeLoans = findControl(simplifiedGridPages[1], "active_loans_collection");
  activeLoans.children = [{ id: "plain_child", type: "container", children: [] }];
  expectCode("simplified grid-table Collection fails", ["--package", writePackage("simplified-grid", simplifiedGridPages)], "DASH_DATASET_GRID_TABLE_ITEM_GRID_MISSING");

  const badMultiselectPages = validPages();
  const bulk = findControl(badMultiselectPages[3], "bulk_reminders_collection");
  bulk.attrs.actions = [];
  expectCode("multiselect Collection without bulk action contract fails", ["--package", writePackage("bad-multiselect", badMultiselectPages)], "DASH_DATASET_MULTISELECT_ACTION_CONTRACT_INVALID");

  const simplifiedCardMultiselectPages = validPages();
  const cardBulk = findControl(simplifiedCardMultiselectPages[4], "card_bulk_collection");
  const cardWrapper = findControl(simplifiedCardMultiselectPages[4], "card_with_multiselect_toolbar_wrapper");
  cardWrapper.children = [cardBulk];
  expectCode("card multiselect without export-shaped slots fails", ["--package", writePackage("simplified-card-multiselect", simplifiedCardMultiselectPages)], "DASH_DATASET_CARD_MULTISELECT_SLOT_MISSING");

  const missingCardDepsPages = validPages();
  delete missingCardDepsPages[4].tempVars;
  expectCode("card multiselect without page-level dependencies fails", ["--package", writePackage("card-multiselect-missing-deps", missingCardDepsPages)], "DASH_DATASET_CARD_MULTISELECT_TEMPVARS_MISSING");

  const missingCardActionPages = validPages();
  findControl(missingCardActionPages[4], "card_bulk_add_button").attrs.control_action = "";
  expectCode("card multiselect Add button without action fails", ["--package", writePackage("card-multiselect-missing-action", missingCardActionPages)], "DASH_DATASET_CARD_MULTISELECT_BUTTON_ACTION_MISSING");

  const noItemOperationsPages = validPages();
  const cardItem = findControl(noItemOperationsPages[4], "card_col_item");
  cardItem.children = cardItem.children.filter((child) => child.id !== "card_col_item_operations");
  expectPass("card multiselect item operations region may be removed", ["--package", writePackage("card-multiselect-no-item-operations", noItemOperationsPages)]);

  console.log(JSON.stringify({ status: "pass", cases: results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function expectPass(name, args) {
  const result = run(args);
  assert.equal(result.status, 0, `${name} should pass\nstdout=${result.stdout}\nstderr=${result.stderr}`);
  results.push(name);
}

function expectCode(name, args, code) {
  const result = run(args);
  assert.notEqual(result.status, 0, `${name} should fail`);
  assert.match(`${result.stdout}\n${result.stderr}`, new RegExp(code), `${name} should include ${code}`);
  results.push(name);
}

function run(args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: ROOT, encoding: "utf8" });
}

function write(name, text) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, text);
  return file;
}

function writePackage(name, pages) {
  const decoded = {
    ListSet: { ListID: "synthetic-listset", Title: "Dataset Presentation Test" },
    Childs: [
      {
        ListID: "list_assets",
        Title: "Assets",
        Fields: [{ FieldName: "Title" }, { FieldName: "Text1" }, { FieldName: "Text2" }, { FieldName: "Decimal2" }, { FieldName: "User1" }],
      },
      {
        ListID: "list_loans",
        Title: "Loan Requests",
        Fields: [{ FieldName: "Title" }, { FieldName: "Text1" }, { FieldName: "Text2" }, { FieldName: "Decimal2" }, { FieldName: "Datetime1" }, { FieldName: "User1" }],
      },
    ],
    Pages: pages.map((resource, index) => ({
      ID: `synthetic-page-${index}`,
      Type: 103,
      Title: resource.title,
      LayoutInResources: [{ Resource: JSON.stringify(resource) }],
    })),
  };
  const wrapper = {
    TenantID: "tenant",
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded))).toString("base64"),
  };
  return write(`${name}.yapk`, JSON.stringify(wrapper, null, 2));
}

function validPages() {
  return [
    page("Asset Cards Dashboard", [
      collection("asset_cards_collection", "collection_control_responsive_card_grid", {
        children: [container("asset_card_item", [dynamic("asset_title", "dynamic-field", "Title")])],
        attrs: { layout: { col: [null, 3, 2, 1] }, data: { list: { ListID: "list_assets" } } },
      }),
    ]),
    page("Active Loans Dashboard", [
      gridTableSection("active_loans", "collection_control_grid_table"),
    ]),
    page("Document Search Dashboard", [
      { id: "loan_search", type: "search-filter", attrs: { variable: "loan_search" } },
      gridTableSection("document_search", "collection_control_grid_table_with_search", { fulltext: [{ fields: ["Title", "Text1"], value: [{ exprType: "variable", id: "__filter_loan_search" }] }] }),
    ]),
    page("Bulk Reminder Dashboard", [
      heading("selected_count", [{ exprType: "variable", valueType: "string", id: "__temp_var_SelectedItemsAmount", type: "expr", name: "var_SelectedItemsAmount" }, { type: "str", value: " Items are selected." }]),
      gridTableSection("bulk_reminders", "collection_control_grid_table_with_multiselect", { multiselect: true }),
    ]),
    page("Card Bulk Dashboard", [
      cardMultiselectSection(),
    ], cardMultiselectPageDeps()),
    page("Primary Pipeline Dashboard", [
      container("Event Pipeline Grid-Table", [
        gridHeader("event_pipeline_grid_table_header_grid", [[2, "fr"], [1, "fr"], [1, "fr"]]),
        collection("event_pipeline_collection", "Event Pipeline Grid-Table", {
          children: [gridItem("event_pipeline_grid_table_item_grid", [[2, "fr"], [1, "fr"], [1, "fr"]])],
          attrs: { data: { list: { ListID: "list_loans" } }, layout: { col: [null, 1] } },
        }),
      ]),
    ]),
  ];
}

function page(title, children, extras = {}) {
  return {
    id: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_page`,
    type: "page",
    title,
    derivedFromDashboardPageLayoutTemplate: "dashboard-page-layouts-v1.1",
    ...extras,
    children: [
      container("Main", [
        container("Content", [
          container("content_card_wrapper", [
            container("section_title_header", [heading(`${title}_section_heading`, title)]),
            container("section_content_area", children),
          ]),
        ]),
      ]),
    ],
  };
}

function cardMultiselectPageDeps() {
  return {
    filterVars: [{ idx: "filter-keywords-idx", id: "filter_keywords" }],
    tempVars: [
      { idx: "selected-items-idx", id: "var_SelectedItems" },
      { idx: "selected-items-count-idx", id: "var_SelectedItemsAmount" },
    ],
    actions: [
      { id: "page_bulk_delete", name: "Delete selected items", steps: [{ type: "setdatalist", attrs: { type: "remove" } }] },
      { id: "page_bulk_complete", name: "Mark selected items completed", steps: [{ type: "setdatalist", attrs: { type: "edit" } }] },
    ],
    filter: [{ id: "filter_keywords" }],
    formAction: [{ id: "form_refresh_after_bulk" }],
  };
}

function cardMultiselectSection() {
  return container("card_with_multiselect_toolbar_wrapper", [
    container("card_col_caption", [
      container("card_col_title_wrapper", [
        heading("card_col_title", "Active Loan Cards"),
      ]),
      container("card_col_operations", [
        container("op_normal", [
          { id: "card_bulk_search", type: "search-filter", label: "Search cards", attrs: { placeholder: "Search cards" } },
          { id: "card_bulk_add_button", type: "action_button", label: "Add item", attrs: { control_action: "page_add_item" }, nv_label: "Add new item" },
        ]),
        container("op_multipleselected", [
          container("selected_items_amount_wrapper", [
            heading("selected_items_amount", [{ exprType: "variable", id: "__temp_var_SelectedItemsAmount", name: "var_SelectedItemsAmount" }, { type: "str", value: " selected" }]),
          ]),
          container("multiple_operations_wrapper", [
            { id: "btn_set_items", type: "action_button", label: "Mark as completed", attrs: { control_action: "page_bulk_complete" }, nv_label: "btn_set_items" },
            { id: "btn_delete_items", type: "action_button", label: "Delete selected items", attrs: { control_action: "page_bulk_delete" }, nv_label: "btn_delete_items" },
          ]),
        ]),
      ]),
    ]),
    collection("card_bulk_collection", "collection_control_card_with_multiselect_toolbar", {
      children: [
        container("card_col_item", [
          { id: "card_item_image", type: "dynamic-image", attrs: { source: "3", "obj-f": "Image1" } },
          { id: "card_item_subject", type: "dynamic-field", nv_label: "Survey Program name", attrs: { source: "3", "obj-f": "Title", typography: "large-semi-bold" } },
          container("card_col_item_multi_select", [
            { id: "card_item_unchecked", type: "icon", attrs: { icon: "fa-regular fa-square" } },
            { id: "card_item_checked", type: "icon", attrs: { icon: "fa-regular fa-square-check" } },
          ]),
          { id: "card_item_owner", type: "dynamic-user", attrs: { source: "3", "obj-f": "User1" } },
          { id: "card_item_file", type: "dynamic-file", attrs: { source: "3", "obj-f": "File1" } },
          container("card_col_item_operations", [
            { id: "card_item_edit", type: "action_button", label: "Edit", attrs: { control_action: "item_edit_action" } },
          ]),
        ]),
      ],
      attrs: {
        data: { list: { ListID: "list_loans" } },
        datasetRegion: "Bulk cards",
        appPlanDatasetRegion: "Bulk cards",
        layout: { col: [null, 3, 2, 1] },
        actions: [
          {
            id: "card_bulk_coll_action",
            type: "coll",
            steps: [
              { type: "setvar", attrs: { variable: "__temp_var_SelectedItems", value: [{ exprType: "variable_ctx", id: "ListDataID", ctx: "__ctx_coll" }] } },
              { type: "setdatalist", attrs: { wheres: [{ left: "ListDataID", right: [{ exprType: "variable_ctx", id: "ListDataID", ctx: "__ctx_coll" }] }] } },
            ],
          },
        ],
      },
    }),
  ]);
}

function gridTableSection(prefix, templateId, options = {}) {
  const columns = options.multiselect ? [[46, "px"], [2, "fr"], [1, "fr"], [1, "fr"], [1, "fr"]] : [[2, "fr"], [1, "fr"], [1, "fr"], [1, "fr"]];
  const itemChildren = [
    ...(options.multiselect ? [container(`${prefix}_select_cell`, [
      { id: `${prefix}_unchecked`, type: "icon", attrs: { icon: "fa-regular fa-square" } },
      { id: `${prefix}_checked`, type: "icon", attrs: { icon: "fa-regular fa-square-check" } },
    ])] : []),
    dynamic(`${prefix}_title`, "dynamic-field", "Title"),
    dynamic(`${prefix}_owner`, "dynamic-user", "User1"),
    dynamic(`${prefix}_status`, "dynamic-field", "Text1"),
    { id: `${prefix}_progress`, type: "progress", attrs: { bar: { per: { variable: [{ exprType: "variable_ctx", id: "Decimal2", ctx: "__ctx_coll" }] } } } },
  ].filter(Boolean);
  return container(`${prefix}_content_card_wrapper`, [
    gridHeader(`${prefix}_header_grid`, columns),
    collection(`${prefix}_collection`, templateId, {
      children: [gridItem(`${prefix}_item_grid`, columns, itemChildren)],
      attrs: {
        data: {
          list: { ListID: "list_loans" },
          fulltext: options.fulltext || undefined,
        },
        layout: { col: [null, 1], hover: { enable: true } },
        pagination: { p: { enabled: true } },
        ...(options.multiselect ? {
          actions: [
            {
              id: `${prefix}_bulk_mark_done`,
              type: "coll",
              steps: [
                { type: "setvar", attrs: { variable: "__temp_var_SelectedItemsAmount", value: [{ exprType: "variable", id: "__temp_var_SelectedItemsAmount", name: "var_SelectedItemsAmount" }] } },
                { type: "setdatalist", attrs: { wheres: [{ left: "ListDataID", right: [{ exprType: "variable_ctx", id: "ListDataID", ctx: "__ctx_coll" }] }] } },
              ],
            },
          ],
        } : {}),
      },
    }),
  ]);
}

function collection(id, templateId, overrides = {}) {
  return {
    id,
    type: "collection",
    label: "Collection",
    attrs: {
      datasetPresentationTemplateId: templateId,
      data: { list: { ListID: "list_loans" } },
      layout: { col: [null, 1] },
      ...(overrides.attrs || {}),
    },
    children: overrides.children || [],
  };
}

function gridHeader(id, columns) {
  return {
    id,
    type: "flex_grid",
    displayLabel: [null, false],
    attrs: { columns: { "1": { list: columns }, "3": { list: [[1, "fr"]] } }, rows: { "1": { list: [[1, "fr"]] } }, common: { hide: [null, false, false, true] } },
    children: columns.map((_, index) => heading(`${id}_h_${index}`, `Column ${index + 1}`)),
  };
}

function gridItem(id, columns, children) {
  return {
    id,
    type: "flex_grid",
    displayLabel: [null, false],
    attrs: { columns: { "1": { list: columns }, "3": { list: [[1, "fr"]] } }, rows: { "1": { list: [[1, "fr"]] } } },
    children: children || [dynamic(`${id}_title`, "dynamic-field", "Title")],
  };
}

function container(id, children = []) {
  return { id, name: id, type: "container", children };
}

function heading(id, value) {
  const title = Array.isArray(value) ? { variable: value } : { value };
  return { id, type: "heading", attrs: { headc: { title } } };
}

function dynamic(id, type, field) {
  return { id, type, attrs: { source: "3", "obj-f": field } };
}

function findControl(root, id) {
  if (root?.id === id) return root;
  for (const value of Object.values(root || {})) {
    if (Array.isArray(value)) {
      for (const child of value) {
        const found = findControl(child, id);
        if (found) return found;
      }
    }
  }
  return null;
}

function findControlsByType(root, type) {
  const found = [];
  function visit(node) {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== "object") return;
    if (node.type === type) found.push(node);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
    }
  }
  visit(root);
  return found;
}

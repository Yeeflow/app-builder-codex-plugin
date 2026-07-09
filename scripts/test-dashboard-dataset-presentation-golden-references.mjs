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
const REGISTRY = path.join(ROOT, "docs/reference/dashboard-dataset-presentation-golden-references.json");
const DYNAMIC_USER_ZERO_ITEM_PADDING = [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }];
const OP_MENU_BUTTON_TRANSPARENT_BG = "rgba(255, 255, 255, 0)";
const GRID_TABLE_CAPTION_TITLE_TYPOGRAPHY = [null, "l-medium"];

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-dataset-presentation-"));
const results = [];

try {
  expectPass("registry validates", ["--registry"]);
  const responsiveTemplate = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/collection-control-responsive-card-grid.template.json"), "utf8"));
  const badResponsiveTemplate = structuredClone(responsiveTemplate);
  delete badResponsiveTemplate.extractionIndex.slotPointers.card_col_item;
  expectCode("responsive card grid source template slots are enforced", ["--registry", REGISTRY, "--responsive-card-template", writeJson("bad-responsive-card-template.json", badResponsiveTemplate)], "DASH_DATASET_RESPONSIVE_CARD_TEMPLATE_SLOT_MISSING");

  const badResponsiveDynamicUserTemplate = structuredClone(responsiveTemplate);
  delete findByType(badResponsiveDynamicUserTemplate.templateResource.rootContainer, "dynamic-user").attrs.item_style.pd;
  expectCode("responsive card source Dynamic user zero item padding is enforced", ["--registry", REGISTRY, "--responsive-card-template", writeJson("bad-responsive-dynamic-user-padding-template.json", badResponsiveDynamicUserTemplate)], "DASH_DATASET_TEMPLATE_DYNAMIC_USER_ITEM_PADDING_NOT_S0");

  const badResponsiveOpMenuTemplate = structuredClone(responsiveTemplate);
  findByIdentity(badResponsiveOpMenuTemplate.templateResource.rootContainer, "btn_edit_item").attrs.button.normal.bg = "var(--c--background)";
  expectCode("responsive card source op-menu button transparent background is enforced", ["--registry", REGISTRY, "--responsive-card-template", writeJson("bad-responsive-op-menu-button-bg-template.json", badResponsiveOpMenuTemplate)], "DASH_DATASET_TEMPLATE_OP_MENU_BUTTON_NORMAL_BG_NOT_TRANSPARENT");

  const cardTemplate = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/collection-control-card-with-multiselect-toolbar.template.json"), "utf8"));
  const badCardTextTemplate = structuredClone(cardTemplate);
  const badCardText = findFirstTemplateText(badCardTextTemplate);
  delete badCardText.attrs.heads;
  expectCode("card multiselect source template Text metadata is enforced", ["--registry", REGISTRY, "--card-template", writeJson("bad-card-text-template.json", badCardTextTemplate)], "DASH_DATASET_CARD_MULTISELECT_TEMPLATE_TEXT_HEADS_MISSING");

  const gridTableTemplate = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/collection-control-grid-table.template.json"), "utf8"));
  const badGridTableSlotTemplate = structuredClone(gridTableTemplate);
  delete badGridTableSlotTemplate.extractionIndex.slotPointers.grid_col_item;
  expectCode("grid-table source template slots are enforced", ["--registry", REGISTRY, "--grid-table-template", writeJson("bad-grid-table-slot-template.json", badGridTableSlotTemplate)], "DASH_DATASET_GRID_TABLE_TEMPLATE_SLOT_MISSING");

  const badGridTableTextTemplate = structuredClone(gridTableTemplate);
  const badGridTableText = findFirstTemplateText(badGridTableTextTemplate);
  delete badGridTableText.attrs.heads;
  expectCode("grid-table source template Text metadata is enforced", ["--registry", REGISTRY, "--grid-table-template", writeJson("bad-grid-table-text-template.json", badGridTableTextTemplate)], "DASH_DATASET_GRID_TABLE_TEMPLATE_TEXT_HEADS_MISSING");

  const badGridTableTitleTypographyTemplate = structuredClone(gridTableTemplate);
  findByIdentity(badGridTableTitleTypographyTemplate.templateResource.rootContainer, "grid_table_col_title").attrs.heads.ty = [null, "h5-medium"];
  expectCode("grid-table source caption title typography is enforced", ["--registry", REGISTRY, "--grid-table-template", writeJson("bad-grid-table-title-typography-template.json", badGridTableTitleTypographyTemplate)], "DASH_DATASET_TEMPLATE_GRID_TABLE_TITLE_TYPOGRAPHY_INVALID");

  const badGridTableColumnTemplate = structuredClone(gridTableTemplate);
  badGridTableColumnTemplate.templateResource.itemColumns = badGridTableColumnTemplate.templateResource.itemColumns.slice(0, -1);
  expectCode("grid-table source template header/item column parity is enforced", ["--registry", REGISTRY, "--grid-table-template", writeJson("bad-grid-table-column-template.json", badGridTableColumnTemplate)], "DASH_DATASET_GRID_TABLE_TEMPLATE_COLUMN_PARITY_INVALID");

  const gridTemplate = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/collection-control-grid-table-with-multiselect.template.json"), "utf8"));
  const badGridWrapperTemplate = structuredClone(gridTemplate);
  delete badGridWrapperTemplate.templateResource.rootContainer.attrs.container;
  badGridWrapperTemplate.templateResource.rootContainer.attrs.style.gap = [null, "--sp--s0"];
  expectCode("grid-table multiselect source wrapper gap is enforced", ["--registry", REGISTRY, "--grid-template", writeJson("bad-grid-wrapper-template.json", badGridWrapperTemplate)], "DASH_DATASET_GRID_MULTISELECT_TEMPLATE_WRAPPER_CONTAINER_GAP_MISSING");

  const badGridDetailTemplate = structuredClone(gridTemplate);
  const badGridCollection = findByIdentity(badGridDetailTemplate.templateResource.rootContainer, "grid_table_col_body");
  badGridCollection.attrs.data.link = "default";
  delete badGridCollection.attrs.data.opentype;
  expectCode("grid-table multiselect source detail-link contract is enforced", ["--registry", REGISTRY, "--grid-template", writeJson("bad-grid-detail-template.json", badGridDetailTemplate)], "DASH_DATASET_GRID_MULTISELECT_TEMPLATE_DETAIL_LINK_PLACEHOLDER_INVALID");

  const badGridMultiselectTitleTypographyTemplate = structuredClone(gridTemplate);
  findByIdentity(badGridMultiselectTitleTypographyTemplate.templateResource.rootContainer, "grid_table_col_title").attrs.heads.ty = [null, "h5-medium"];
  expectCode("grid-table multiselect source caption title typography is enforced", ["--registry", REGISTRY, "--grid-template", writeJson("bad-grid-multiselect-title-typography-template.json", badGridMultiselectTitleTypographyTemplate)], "DASH_DATASET_TEMPLATE_GRID_TABLE_TITLE_TYPOGRAPHY_INVALID");

  const validPlan = write("valid-plan.md", `# Yeeflow App Plan

## Dashboard Pages Plan

| Dashboard Page | Dataset Region | Source Resource | Business Purpose | Selected Collection Presentation Reference | Selection Rationale |
| --- | --- | --- | --- | --- | --- |
| Operations | Asset cards | Assets Data List | Browse available assets as cards | collection_control_responsive_card_grid | Card browsing is better for asset overview |
| Operations | Active loans | Loan Requests Data List | Dense work queue scan | collection_control_grid_table | Dense row/column scanning for an operational work queue |
| Operations | Bulk reminders | Loan Requests Data List | Batch send reminders | collection_control_grid_table_with_multiselect | Multi-row selection and batch reminder |
| Operations | Bulk card close | Loan Requests Data List | Batch close selected card records | collection_control_card_with_multiselect_toolbar | Multi-select cards with selected count and batch operation |
| Operations | Primary work queue | Loan Requests Data List | Primary operational pipeline | Event Pipeline Grid-Table | High-fidelity work queue |
| Operations | Document register | Audit Document Register | Dense audit document tracker | collection_control_grid_table | Customer needs tabulated tracker |
`);
  expectPass("App Plan with approved dataset presentation references passes", ["--app-plan", validPlan]);

  const mixedLegacyAndCanonicalPlan = write("mixed-legacy-canonical-plan.md", `# Yeeflow App Plan

## Dashboard Pages Plan

#### Record Display Control Selection

| Section | Data Source | Display Need | Selected Record Display Control | Selection Reason | Detail/Open Behavior | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- |
| Batch loan queue | Loan Transactions | Dense selectable queue | Collection | Grid-table with multiselect supports batch operations | Open current loan and selected-state actions | Runtime collection proof |
| Asset card browser | Office Assets | Visual asset browsing | Collection | Responsive cards match asset scanning | Open current asset | Runtime collection proof |

### 14.1.2 Record Display Control Selection

| Dashboard | Dataset Region | Selected Record Display Control | Selected Yeeflow Control Type Category | Selected Template | Source List | Selection Reason |
| --- | --- | --- | --- | --- | --- | --- |
| Asset Loan Operations Dashboard | Batch loan queue | Collection | Collection | collection_control_grid_table_with_multiselect | Loan Transactions | Coordinator needs dense multi-row batch selection |
| Asset Availability and Utilization Dashboard | Asset card browser | Collection | Collection | collection_control_responsive_card_grid | Office Assets | Asset browsing benefits from responsive cards |
`);
  expectPass("App Plan canonical exact-ID table overrides earlier legacy prose dataset table", ["--app-plan", mixedLegacyAndCanonicalPlan]);

  const retiredSearchPlan = write("retired-search-plan.md", `# Yeeflow App Plan

## Dashboard Pages Plan

| Dashboard Page | Dataset Region | Source Resource | Business Purpose | Selected Collection Presentation Reference | Selection Rationale |
| --- | --- | --- | --- | --- | --- |
| Operations Dashboard | Document search | Document Library | Search document metadata | collection_control_grid_table_with_search | Fulltext document lookup |
`);
  expectCode("retired search-only Collection template is no longer approved", ["--app-plan", retiredSearchPlan], "DASH_DATASET_APP_PLAN_REFERENCE_UNKNOWN");

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

  const scopedDashboardPlan = write("scoped-dashboard-plan.md", `# Yeeflow App Plan

## Dashboard Pages Plan

### 14.1 Active Loans Dashboard

#### Record Display Control Selection

| Section Name | Data Source | Display Need | Selected Record Display Control | Selected Collection Presentation Reference | Required Business Fields | Selection Reason | Detail/Open Behavior | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Active loans | Loan Requests Data List | Dense operational row scanning | Collection | collection_control_grid_table | Loan title, requester, due date, status | Dense row/column scanning for an operational work queue | Open selected loan | Must preserve the full grid_table_col_wrapper internals |
`);
  expectPass("App Plan-to-package conformance inherits Dashboard heading when table omits Dashboard Page column", ["--app-plan", scopedDashboardPlan, "--package", writePackage("scoped-dashboard-package-conformance", validPages())]);

  const wrapperMentionPlan = write("wrapper-mention-plan.md", `# Yeeflow App Plan

## Dashboard Pages Plan

### 14.1 Asset Cards Dashboard

#### Record Display Control Selection

| Section Name | Data Source | Display Need | Selected Record Display Control | Selected Collection Presentation Reference | Required Business Fields | Selection Reason | Detail/Open Behavior | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Asset cards | Assets Data List | Browse available assets as cards | Collection | collection_control_responsive_card_grid | Asset name, owner, availability | Card browsing is better for asset overview | Open selected asset | Must clone collection_control_responsive_card_wrapper as the internal template root |
`);
  expectPass("App Plan may mention approved internal wrapper IDs without treating them as selected templates", ["--app-plan", wrapperMentionPlan]);

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
| Operations Dashboard | Active loans | Loan Requests Data List | Dashboard Collection work queue | collection_control_grid_table and collection_control_grid_table_with_multiselect | Dense scanning and batch selection |
`);
  expectCode("App Plan selects exactly one Collection presentation reference", ["--app-plan", multiplePlan], "DASH_DATASET_APP_PLAN_REFERENCE_NOT_EXACTLY_ONE");

  expectPass("synthetic app using all approved Dashboard Collection references passes", ["--package", writePackage("valid-all", validPages())]);

  const missingSortPages = validPages();
  delete findControl(missingSortPages[1], "active_loans_collection").attrs.data.sort;
  expectCode("Collection without Primary order sort fails", ["--package", writePackage("collection-sort-missing", missingSortPages)], "DASH_DATASET_COLLECTION_SORT_MISSING");

  const wrongSortPages = validPages();
  findControl(wrongSortPages[1], "active_loans_collection").attrs.data.sort = [{ SortName: "Primary order", SortByDesc: false }];
  expectCode("Collection Primary order must resolve to selected list schema", ["--package", writePackage("collection-sort-unresolved", wrongSortPages)], "DASH_DATASET_COLLECTION_SORT_FIELD_UNRESOLVED");

  const missingDynamicSurfacePages = validPages();
  delete findControl(missingDynamicSurfacePages[1], "active_loans_title").attrs.data.field;
  expectCode("Dynamic field missing runtime binding surface fails", ["--package", writePackage("dynamic-field-surface-missing", missingDynamicSurfacePages)], "DASH_DATASET_DYNAMIC_CONTROL_FIELD_SURFACE_MISSING");

  const mismatchedDynamicSurfacePages = validPages();
  findControl(mismatchedDynamicSurfacePages[1], "active_loans_title").attrs.data.field = "Text2";
  expectCode("Dynamic field binding surfaces must agree", ["--package", writePackage("dynamic-field-surface-mismatch", mismatchedDynamicSurfacePages)], "DASH_DATASET_DYNAMIC_CONTROL_FIELD_SURFACE_MISMATCH");

  const userAsDynamicFieldPages = validPages();
  const owner = findControl(userAsDynamicFieldPages[1], "active_loans_owner");
  owner.type = "dynamic-field";
  expectCode("User field rendered as dynamic-field fails", ["--package", writePackage("dynamic-user-type-mismatch", userAsDynamicFieldPages)], "DASH_DATASET_DYNAMIC_CONTROL_TYPE_MISMATCH");

  const missingDynamicUserPaddingPages = validPages();
  delete findControl(missingDynamicUserPaddingPages[1], "active_loans_owner").attrs.item_style.pd;
  expectCode("Collection Dynamic user item padding must be zero", ["--package", writePackage("dynamic-user-item-padding-missing", missingDynamicUserPaddingPages)], "DASH_DATASET_DYNAMIC_USER_ITEM_PADDING_NOT_S0");

  const opMenuButtonBackgroundPages = validPages();
  findControl(opMenuButtonBackgroundPages[1], "btn_edit_item").attrs.button.normal.bg = "var(--c--background)";
  expectCode("grid_table_col_item_op_menu buttons must keep transparent normal background", ["--package", writePackage("op-menu-button-background", opMenuButtonBackgroundPages)], "DASH_DATASET_OP_MENU_BUTTON_NORMAL_BG_NOT_TRANSPARENT");

  const actionPlaceholderPages = validPages();
  const responsiveCollection = findControl(actionPlaceholderPages[0], "card_col_body");
  responsiveCollection.attrs.actions[0].steps[0].attrs = {
    ...(responsiveCollection.attrs.actions[0].steps[0].attrs || {}),
    data: { list: { AppID: 41, ListSetID: "{{ListSetID}}", ListID: "{{ListID}}" } },
    layout: "{{DetailLayoutID}}",
  };
  expectCode("Dashboard Collection action placeholders fail before signing", ["--package", writePackage("collection-action-placeholders", actionPlaceholderPages)], "DASH_DATASET_COLLECTION_TEMPLATE_PLACEHOLDER_UNRESOLVED");

  const selectFilterPlaceholderPages = validPages();
  const selectFilterHost = findControl(selectFilterPlaceholderPages[0], "section_content_area");
  selectFilterHost.children = [
    {
      type: "select-filter",
      id: "asset_status_filter",
      name: "Asset Status",
      attrs: {
        data: {
          field: "Text2",
          displayField: "Text2",
          valueField: "Text2",
          filter: [{ field: "Text2", operator: "not_empty", value: "{{ListDataID}}" }],
        },
      },
    },
    ...(selectFilterHost.children || []),
  ];
  expectCode("Dashboard select-filter option-source ListDataID placeholder fails before signing", ["--package", writePackage("select-filter-option-placeholder", selectFilterPlaceholderPages)], "DASH_SELECT_FILTER_OPTION_SOURCE_PLACEHOLDER_UNRESOLVED");

  const sixtyCardPages = validPages();
  renameFirstContentCard(sixtyCardPages[1], "content_card_60_wrapper");
  expectPass("Collection template inside 60 percent v1.1 content card section_content_area passes", ["--package", writePackage("valid-60-card-slot", sixtyCardPages)]);

  const fortyCardPages = validPages();
  renameFirstContentCard(fortyCardPages[1], "content_card_40_wrapper");
  expectPass("Collection template inside 40 percent v1.1 content card section_content_area passes", ["--package", writePackage("valid-40-card-slot", fortyCardPages)]);

  const conformancePlan = write("conformance-plan.md", `# Yeeflow App Plan

## Dashboard Pages Plan

| Dashboard Page | Dataset Region | Source Resource | Business Purpose | Selected Record Display Control | Selected Collection Presentation Reference | Selection Rationale |
| --- | --- | --- | --- | --- | --- | --- |
| Asset Cards Dashboard | Asset cards | Assets Data List | Browse available assets as cards | Collection | collection_control_responsive_card_grid | Card browsing is better for asset overview |
| Active Loans Dashboard | Active loans | Loan Requests Data List | Dense operational row scanning | Collection | collection_control_grid_table | Dense row/column scanning for an operational work queue |
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
  findControl(mismatchedRegionPages[1], "active_loans_collection").attrs.datasetPresentationTemplateId = "collection_control_grid_table_with_multiselect";
  expectCode("App Plan-to-package conformance fails on region template mismatch", ["--app-plan", conformancePlan, "--package", writePackage("region-template-mismatch", mismatchedRegionPages)], "DASH_DATASET_REGION_TEMPLATE_MISMATCH");

  const inheritedOnlyPages = validPages();
  const activeLoansAncestor = findControl(inheritedOnlyPages[1], "grid_table_col_wrapper");
  activeLoansAncestor.attrs = { ...(activeLoansAncestor.attrs || {}), datasetPresentationTemplateId: "collection_control_grid_table" };
  delete findControl(inheritedOnlyPages[1], "active_loans_collection").attrs.datasetPresentationTemplateId;
  expectCode("App Plan-to-package conformance requires explicit Collection-root provenance", ["--app-plan", conformancePlan, "--package", writePackage("inherited-only-template", inheritedOnlyPages)], "DASH_DATASET_COLLECTION_EXPLICIT_PROVENANCE_MISSING");

  const outsideSlotPages = validPages();
  outsideSlotPages[1].children[0].children[0].children = [gridTableSection("active_loans", "collection_control_grid_table")];
  expectCode("Collection template outside v1.1 section content slot fails", ["--package", writePackage("outside-slot", outsideSlotPages)], "DASH_DATASET_COLLECTION_OUTSIDE_V11_SLOT");

  const invalidCardSlotPages = validPages();
  renameFirstContentCard(invalidCardSlotPages[1], "custom_unapproved_card_wrapper");
  expectCode("Collection template inside unapproved card wrapper fails", ["--package", writePackage("unapproved-card-slot", invalidCardSlotPages)], "DASH_DATASET_COLLECTION_OUTSIDE_V11_SLOT");

  const noProvenancePages = validPages();
  findControl(noProvenancePages[0], "card_col_body").attrs.datasetPresentationTemplateId = "";
  expectCode("Collection without approved template provenance fails", ["--package", writePackage("no-provenance", noProvenancePages)], "DASH_DATASET_COLLECTION_TEMPLATE_PROVENANCE_MISSING");

  const simplifiedResponsivePages = validPages();
  simplifiedResponsivePages[0].children[0].children[0].children[0].children[1].children = [
    collection("card_col_body", "collection_control_responsive_card_grid", {
      children: [container("card_col_item", [dynamic("asset_title", "dynamic-field", "Title")])],
      attrs: { layout: { col: [null, null, 2, 1] }, data: { list: { ListID: "list_assets", Title: "Assets" } } },
    }),
  ];
  expectCode("responsive card grid without wrapper fails", ["--package", writePackage("responsive-card-simplified-wrapper", simplifiedResponsivePages)], "DASH_DATASET_RESPONSIVE_CARD_WRAPPER_MISSING");

  const badResponsiveImagePages = validPages();
  findControl(badResponsiveImagePages[0], "asset_card_image").attrs["obj-f"] = "Text1";
  expectCode("responsive card Dynamic image requires Image field", ["--package", writePackage("responsive-card-image-wrong-field", badResponsiveImagePages)], "DASH_DATASET_RESPONSIVE_CARD_DYNAMIC_CONTROL_TYPE_MISMATCH");

  const missingResponsiveButtonActionPages = validPages();
  delete findControl(missingResponsiveButtonActionPages[0], "btn_delete_item").attrs.control_action;
  expectCode("responsive card item operation button without action fails", ["--package", writePackage("responsive-card-missing-button-action", missingResponsiveButtonActionPages)], "DASH_DATASET_RESPONSIVE_CARD_BUTTON_ACTION_MISSING");

  const missingResponsiveDeleteTempPages = validPages();
  delete missingResponsiveDeleteTempPages[0].tempVars;
  expectCode("responsive card delete action requires confirmation temp variable", ["--package", writePackage("responsive-card-missing-delete-temp", missingResponsiveDeleteTempPages)], "DASH_DATASET_RESPONSIVE_CARD_DELETE_CONFIRMATION_TEMPVAR_MISSING");

  const displayOnlyResponsivePages = validPages();
  const displayWrapper = findControl(displayOnlyResponsivePages[0], "collection_control_responsive_card_wrapper");
  displayWrapper.children = [
    collection("card_col_body", "collection_control_responsive_card_grid", {
      children: [container("card_col_item", [dynamic("asset_card_subject", "dynamic-field", "Title")], { attrs: { style: { gap: [null, "--sp--s100"], direction: [null, "column"], wrap: [null, "nowrap"], widthtype: [null, "1"], align_items: [null, "stretch"], justify_content: [null, "flex-start"], background: "#ffffff", border: { type: "1", width: [null, { top: 1, right: 1, bottom: 1, left: 1 }], color: "#e5edf5" }, padding: [null, { top: 18, right: 18, bottom: 18, left: 18 }], radius: [null, { top: 16, right: 16, bottom: 16, left: 16 }] } } })],
      attrs: {
        data: { list: { ListID: "list_assets", Title: "Assets" } },
        datasetRegion: "Asset cards",
        appPlanDatasetRegion: "Asset cards",
        layout: { cg: [null, 16], rg: [null, 16], cp: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }], "align-i": [null, "7"], col: [null, null, 2, 1] },
        actions: [],
      },
    }),
  ];
  expectPass("responsive card display-only mode may omit caption and item operations", ["--package", writePackage("responsive-card-display-only", displayOnlyResponsivePages)]);

  const inventedTemplatePages = validPages();
  findControl(inventedTemplatePages[0], "card_col_body").attrs.datasetPresentationTemplateId = "collection_control_fake";
  expectCode("invented template id fails", ["--package", writePackage("invented-template", inventedTemplatePages)], "DASH_DATASET_COLLECTION_TEMPLATE_UNKNOWN");

  const simplifiedGridPages = validPages();
  const activeLoans = findControl(simplifiedGridPages[1], "active_loans_collection");
  activeLoans.children = [{ id: "plain_child", type: "container", children: [] }];
  expectCode("simplified grid-table Collection fails", ["--package", writePackage("simplified-grid", simplifiedGridPages)], "DASH_DATASET_GRID_TABLE_ITEM_GRID_MISSING");

  const missingGridWrapperPages = validPages();
  const activeGridCollection = findControl(missingGridWrapperPages[1], "active_loans_collection");
  findControl(missingGridWrapperPages[1], "section_content_area").children = [
    gridHeader("active_loans_header_grid", [[2, "fr"], [1, "fr"], [1, "fr"], [1, "fr"]]),
    activeGridCollection,
  ];
  expectCode("base grid-table without export-shaped wrapper fails", ["--package", writePackage("base-grid-table-wrapper-missing", missingGridWrapperPages)], "DASH_DATASET_GRID_TABLE_FULL_TEMPLATE_WRAPPER_MISSING");

  const badBaseGridColumnsPages = validPages();
  findControl(badBaseGridColumnsPages[1], "grid_col_item").attrs.columns["1"].list = [[3, "fr"], [1, "fr"]];
  expectCode("base grid-table header/item column mismatch fails", ["--package", writePackage("base-grid-table-column-mismatch", badBaseGridColumnsPages)], "DASH_DATASET_GRID_TABLE_HEADER_ITEM_COLUMN_MISMATCH");

  const staleBaseGridTracksPages = validPages();
  const staleHeader = findControl(staleBaseGridTracksPages[1], "grid_table_col_header");
  const staleItem = findControl(staleBaseGridTracksPages[1], "grid_col_item");
  const staleTracks = [[2, "fr"], [1, "fr"], [1, "fr"], [1, "fr"], [1, "fr"], [1, "fr"]];
  staleHeader.attrs.columns["1"].list = structuredClone(staleTracks);
  staleItem.attrs.columns["1"].list = structuredClone(staleTracks);
  staleHeader.children = staleHeader.children.slice(0, 3);
  staleItem.children = staleItem.children.slice(0, 3);
  expectCode("base grid-table stale tracks after column pruning fail", ["--package", writePackage("base-grid-table-stale-tracks", staleBaseGridTracksPages)], "DASH_DATASET_GRID_TABLE_COLUMN_TRACK_COUNT_MISMATCH");

  const badBaseGridActionPages = validPages();
  delete findControl(badBaseGridActionPages[1], "btn_edit_item").attrs.control_action;
  expectCode("base grid-table item operation button without action fails", ["--package", writePackage("base-grid-table-missing-operation-action", badBaseGridActionPages)], "DASH_DATASET_GRID_TABLE_OPERATION_ACTION_MISSING");

  const badBaseGridTitleTypographyPages = validPages();
  findControl(badBaseGridTitleTypographyPages[1], "grid_table_col_title").attrs.heads.ty = [null, "h5-medium"];
  expectCode("base grid-table caption title typography drift fails", ["--package", writePackage("base-grid-table-title-typography", badBaseGridTitleTypographyPages)], "DASH_DATASET_GRID_TABLE_TITLE_TYPOGRAPHY_INVALID");

  const missingProgressFieldPages = validPages();
  const missingProgressCollection = findControl(missingProgressFieldPages[1], "active_loans_collection");
  missingProgressCollection.attrs.data.list = { ListID: "list_doctors", Title: "Doctor Profiles" };
  missingProgressCollection.attrs.data.sort = [{ SortName: "Title", SortByDesc: false }];
  expectCode("Progress bar bound to missing source-template field fails", ["--package", writePackage("base-grid-table-progress-missing-field", missingProgressFieldPages, {
    childs: doctorProfileChilds({ includeCompletionPercentage: false }),
  })], "DASH_DATASET_COLLECTION_CTX_FIELD_MISSING");

  const textProgressFieldPages = validPages();
  expectCode("Progress bar bound to nonnumeric status/text field fails", ["--package", writePackage("base-grid-table-progress-text-field", textProgressFieldPages, {
    childs: defaultChilds({ loanDecimalFieldType: "Text" }),
  })], "DASH_DATASET_PROGRESS_FIELD_NOT_NUMERIC");

  const duplicateColumnLabelPages = validPages();
  const duplicateHeader = findControl(duplicateColumnLabelPages[1], "grid_table_col_header");
  duplicateHeader.children[2].attrs.headc.title.value = "Status";
  duplicateHeader.children[3].attrs.headc.title.value = "Status";
  expectCode("base grid-table duplicate visible column labels fail", ["--package", writePackage("base-grid-table-duplicate-status-labels", duplicateColumnLabelPages)], "DASH_DATASET_COLLECTION_DUPLICATE_COLUMN_LABEL");

  const viewOnlyBaseGridPages = validPages();
  const viewOnlyCollection = findControl(viewOnlyBaseGridPages[1], "active_loans_collection");
  viewOnlyCollection.attrs.data.sourceResourceType = "Form Report";
  expectCode("base grid-table display-only report source forbids item operations", ["--package", writePackage("base-grid-table-view-only-ops", viewOnlyBaseGridPages)], "DASH_DATASET_GRID_TABLE_DISPLAY_ONLY_OPERATION_FORBIDDEN");

  const badMultiselectPages = validPages();
  const bulk = findControl(badMultiselectPages[2], "bulk_reminders_collection");
  bulk.attrs.actions = [];
  expectCode("multiselect Collection without bulk action contract fails", ["--package", writePackage("bad-multiselect", badMultiselectPages)], "DASH_DATASET_MULTISELECT_ACTION_CONTRACT_INVALID");

  const simplifiedGridMultiselectPages = validPages();
  const simplifiedBulkCollection = findControl(simplifiedGridMultiselectPages[2], "bulk_reminders_collection");
  simplifiedGridMultiselectPages[2].children[0].children[0].children[0].children[1].children = [simplifiedBulkCollection];
  expectCode("grid-table multiselect without export-shaped wrapper fails", ["--package", writePackage("simplified-grid-multiselect", simplifiedGridMultiselectPages)], "DASH_DATASET_GRID_MULTISELECT_WRAPPER_MISSING");

  const missingGridRootIdentityPages = validPages();
  const missingGridRootIdentityCollection = findControl(missingGridRootIdentityPages[2], "bulk_reminders_collection");
  delete missingGridRootIdentityCollection.nv_label;
  missingGridRootIdentityCollection.name = "Bulk Reminders Collection";
  expectCode("grid-table multiselect Collection root identity must be preserved", ["--package", writePackage("grid-multiselect-root-identity-missing", missingGridRootIdentityPages)], "DASH_DATASET_GRID_MULTISELECT_COLLECTION_ROOT_IDENTITY_MISSING");

  const badGridMultiselectColumnsPages = validPages();
  const badItemGrid = findControl(badGridMultiselectColumnsPages[2], "grid_col_item");
  badItemGrid.attrs.columns["1"].list = [[46, "px"], [3, "fr"], [1, "fr"]];
  expectCode("grid-table multiselect header/item column mismatch fails", ["--package", writePackage("bad-grid-multiselect-columns", badGridMultiselectColumnsPages)], "DASH_DATASET_GRID_MULTISELECT_HEADER_ITEM_COLUMN_MISMATCH");

  const staleGridMultiselectTracksPages = validPages();
  const staleMultiselectHeader = findControl(staleGridMultiselectTracksPages[2], "grid_table_col_header");
  const staleMultiselectItem = findControl(staleGridMultiselectTracksPages[2], "grid_col_item");
  const staleMultiselectTracks = [[46, "px"], [2, "fr"], [1, "fr"], [1, "fr"], [1, "fr"], [1, "fr"]];
  staleMultiselectHeader.attrs.columns["1"].list = structuredClone(staleMultiselectTracks);
  staleMultiselectItem.attrs.columns["1"].list = structuredClone(staleMultiselectTracks);
  staleMultiselectHeader.children = staleMultiselectHeader.children.slice(0, 3);
  staleMultiselectItem.children = staleMultiselectItem.children.slice(0, 3);
  expectCode("grid-table multiselect stale tracks after column pruning fail", ["--package", writePackage("bad-grid-multiselect-stale-tracks", staleGridMultiselectTracksPages)], "DASH_DATASET_GRID_MULTISELECT_COLUMN_TRACK_COUNT_MISMATCH");

  const badGridFullWidthPages = validPages();
  delete findControl(badGridFullWidthPages[2], "grid_table_col_caption").attrs.style.widthtype;
  expectCode("grid-table multiselect structural containers require full width", ["--package", writePackage("bad-grid-multiselect-full-width", badGridFullWidthPages)], "DASH_DATASET_GRID_MULTISELECT_FULL_WIDTH_CONTRACT_MISSING");

  const badGridMultiselectTitleTypographyPages = validPages();
  findControl(badGridMultiselectTitleTypographyPages[2], "grid_table_col_title").attrs.heads.ty = [null, "h5-medium"];
  expectCode("grid-table multiselect caption title typography drift fails", ["--package", writePackage("bad-grid-multiselect-title-typography", badGridMultiselectTitleTypographyPages)], "DASH_DATASET_GRID_TABLE_TITLE_TYPOGRAPHY_INVALID");

  const badGridResiduePages = validPages();
  findControl(badGridResiduePages[2], "grid_bulk_search").attrs.placeholder = "Search tasks";
  expectCode("grid-table multiselect source-domain text residue fails", ["--package", writePackage("bad-grid-multiselect-residue", badGridResiduePages)], "DASH_DATASET_GRID_MULTISELECT_TEMPLATE_RESIDUE");

  const badGridGapPages = validPages();
  findControl(badGridGapPages[2], "op_normal").attrs.style.gap = [null, "--sp--s0"];
  expectCode("grid-table multiselect locked gap drift fails", ["--package", writePackage("bad-grid-multiselect-gap-drift", badGridGapPages)], "DASH_DATASET_GRID_MULTISELECT_LOCKED_STYLE_DRIFT");

  const badGridSelectActionPages = validPages();
  delete findControl(badGridSelectActionPages[2], "grid_table_col_item_select").attrs.control_action;
  expectCode("grid-table multiselect row selector must keep action binding", ["--package", writePackage("bad-grid-multiselect-select-action", badGridSelectActionPages)], "DASH_DATASET_GRID_MULTISELECT_SELECT_ACTION_MISSING");

  const badGridFilterShapePages = validPages();
  const badGridFilterCollection = findControl(badGridFilterShapePages[2], "bulk_reminders_collection");
  badGridFilterCollection.attrs.data.filter = [{ operator: "9", showCus: true, right: [{ valueType: "array", id: "filter_bad", name: "__filter_bad" }] }];
  badGridFilterCollection.attrs.data.filterBindings = [{ name: "bad" }];
  expectCode("grid-table multiselect filter condition must keep Designer shape", ["--package", writePackage("bad-grid-multiselect-filter-shape", badGridFilterShapePages)], "DASH_DATASET_GRID_MULTISELECT_FILTER_CONDITION_SHAPE_INVALID");

  const helperKpiPages = validPages();
  helperKpiPages[0].children[0].children[0].children[0].children.push(container("kpi_cards_wrapper", [
    container("ops_kpi_total_loans", [heading("ops_kpi_total_loans_value", "12")]),
  ]));
  expectCode("helper-created KPI cards under KPI wrapper fail", ["--package", writePackage("helper-kpi-card", helperKpiPages)], "DASH_DATASET_KPI_MODULE_ROW_MISSING");

  const missingGridDepsPages = validPages();
  delete missingGridDepsPages[2].tempVars;
  expectCode("grid-table multiselect without page-level dependencies fails", ["--package", writePackage("grid-multiselect-missing-deps", missingGridDepsPages)], "DASH_DATASET_GRID_MULTISELECT_TEMPVARS_MISSING");

  const missingGridButtonActionPages = validPages();
  findControl(missingGridButtonActionPages[2], "grid_bulk_add_button").attrs.control_action = "";
  expectCode("grid-table multiselect Add button without action fails", ["--package", writePackage("grid-multiselect-missing-button-action", missingGridButtonActionPages)], "DASH_DATASET_GRID_MULTISELECT_BUTTON_ACTION_MISSING");

  const simplifiedCardMultiselectPages = validPages();
  const cardBulk = findControl(simplifiedCardMultiselectPages[3], "card_bulk_collection");
  const cardWrapper = findControl(simplifiedCardMultiselectPages[3], "card_with_multiselect_toolbar_wrapper");
  cardWrapper.children = [cardBulk];
  expectCode("card multiselect without export-shaped slots fails", ["--package", writePackage("simplified-card-multiselect", simplifiedCardMultiselectPages)], "DASH_DATASET_CARD_MULTISELECT_SLOT_MISSING");

  const missingCardDepsPages = validPages();
  delete missingCardDepsPages[3].tempVars;
  expectCode("card multiselect without page-level dependencies fails", ["--package", writePackage("card-multiselect-missing-deps", missingCardDepsPages)], "DASH_DATASET_CARD_MULTISELECT_TEMPVARS_MISSING");

  const missingCardActionPages = validPages();
  findControl(missingCardActionPages[3], "card_bulk_add_button").attrs.control_action = "";
  expectCode("card multiselect Add button without action fails", ["--package", writePackage("card-multiselect-missing-action", missingCardActionPages)], "DASH_DATASET_CARD_MULTISELECT_BUTTON_ACTION_MISSING");

  const unresolvedCardLayoutPages = validPages();
  findControl(unresolvedCardLayoutPages[3], "card_item_edit").attrs.control_action = { type: "open-detail", layout: "{{layout}}" };
  expectCode("card multiselect unresolved layout placeholder fails", ["--package", writePackage("card-multiselect-unresolved-layout-placeholder", unresolvedCardLayoutPages)], "DASH_DATASET_COLLECTION_TEMPLATE_PLACEHOLDER_UNRESOLVED");

  const unresolvedCardActionLayoutPages = validPages();
  findControl(unresolvedCardActionLayoutPages[3], "card_bulk_collection").attrs.actions[0].steps.push({
    type: "open-detail",
    attrs: { layout: "{{layout}}" },
  });
  expectCode("card multiselect action-step layout placeholder fails", ["--package", writePackage("card-multiselect-action-layout-placeholder", unresolvedCardActionLayoutPages)], "DASH_DATASET_COLLECTION_TEMPLATE_PLACEHOLDER_UNRESOLVED");

  const noItemOperationsPages = validPages();
  const cardItem = findControl(noItemOperationsPages[3], "card_col_item");
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

function writeJson(name, value) {
  return write(name, `${JSON.stringify(value, null, 2)}\n`);
}

function findFirstTemplateText(template) {
  const text = findNode(template.templateResource.rootContainer, (node) => node?.type === "heading" && node?.label === "Text");
  assert.ok(text, "template has Text control");
  return text;
}

function findByIdentity(root, identity) {
  const normalized = normalizeIdentity(identity);
  const node = findNode(root, (candidate) => [
    candidate?.id,
    candidate?.name,
    candidate?.label,
    candidate?.nv_label,
    candidate?.attrs?.name,
    candidate?.attrs?.label,
    candidate?.attrs?.nv_label,
  ].map(normalizeIdentity).includes(normalized));
  assert.ok(node, `template has ${identity}`);
  return node;
}

function findByType(root, type) {
  const node = findNode(root, (candidate) => String(candidate?.type || "") === type);
  assert.ok(node, `template has ${type}`);
  return node;
}

function findNode(root, predicate) {
  if (!root || typeof root !== "object") return null;
  if (predicate(root)) return root;
  for (const value of Object.values(root)) {
    if (Array.isArray(value)) {
      for (const child of value) {
        const found = findNode(child, predicate);
        if (found) return found;
      }
    } else if (value && typeof value === "object") {
      const found = findNode(value, predicate);
      if (found) return found;
    }
  }
  return null;
}

function normalizeIdentity(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s_/-]+/g, "_");
}

function writePackage(name, pages, options = {}) {
  const decoded = {
    ListSet: { ListID: "synthetic-listset", Title: "Dataset Presentation Test" },
    Childs: options.childs || defaultChilds(),
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

function defaultChilds(options = {}) {
  return [
    {
      ListID: "list_assets",
      Title: "Assets",
      Fields: [
        { FieldName: "Title", FieldType: "Text" },
        { FieldName: "Text1", FieldType: "Text" },
        { FieldName: "Text2", FieldType: "Text" },
        { FieldName: "Decimal2", FieldType: "Number" },
        { FieldName: "User1", FieldType: "User" },
        { FieldName: "Image1", FieldType: "Image" },
        { FieldName: "File1", FieldType: "File" },
      ],
    },
    {
      ListID: "list_loans",
      Title: "Loan Requests",
      Fields: [
        { FieldName: "Title", FieldType: "Text" },
        { FieldName: "Text1", FieldType: "Text" },
        { FieldName: "Text2", FieldType: "Text" },
        { FieldName: "Decimal2", FieldType: options.loanDecimalFieldType || "Number" },
        { FieldName: "Datetime1", FieldType: "DateTime" },
        { FieldName: "User1", FieldType: "User" },
        { FieldName: "Image1", FieldType: "Image" },
        { FieldName: "File1", FieldType: "File" },
      ],
    },
  ];
}

function doctorProfileChilds({ includeCompletionPercentage } = {}) {
  return [
    ...defaultChilds(),
    {
      ListID: "list_doctors",
      Title: "Doctor Profiles",
      Fields: [
        { FieldName: "Title", FieldType: "Text", DisplayName: "Doctor Name" },
        { FieldName: "Text1", FieldType: "Text", DisplayName: "Employee ID" },
        { FieldName: "Text2", FieldType: "Text", DisplayName: "Department" },
        { FieldName: "Text3", FieldType: "Text", DisplayName: "Specialty" },
        { FieldName: "Text4", FieldType: "Text", DisplayName: "Employment Status" },
        { FieldName: "Text8", FieldType: "Text", DisplayName: "Onboarding Status" },
        { FieldName: "User1", FieldType: "Text", Type: "identity-picker", DisplayName: "Profile Owner" },
        ...(includeCompletionPercentage ? [{ FieldName: "Decimal1", FieldType: "Decimal", DisplayName: "Completion Percentage" }] : []),
      ],
    },
  ];
}

function validPages() {
  return [
    page("Asset Cards Dashboard", [
      responsiveCardGridSection(),
    ], responsiveCardGridPageDeps()),
    page("Active Loans Dashboard", [
      gridTableSection("active_loans", "collection_control_grid_table"),
    ], baseGridTablePageDeps()),
    page("Bulk Reminder Dashboard", [
      heading("selected_count", [{ exprType: "variable", valueType: "string", id: "__temp_var_SelectedItemsAmount", type: "expr", name: "var_SelectedItemsAmount" }, { type: "str", value: " Items are selected." }]),
      gridMultiselectSection("bulk_reminders"),
    ], gridMultiselectPageDeps()),
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

function gridMultiselectPageDeps() {
  return {
    filterVars: [{ idx: "grid-filter-keywords-idx", id: "filter_keywords" }],
    tempVars: [
      { idx: "grid-selected-items-idx", id: "var_SelectedItems" },
      { idx: "grid-selected-items-count-idx", id: "var_SelectedItemsAmount" },
    ],
    actions: [
      { id: "grid_page_bulk_delete", name: "Delete selected items", steps: [{ type: "setdatalist", attrs: { type: "remove" } }] },
      { id: "grid_page_bulk_complete", name: "Mark selected items completed", steps: [{ type: "setdatalist", attrs: { type: "edit" } }] },
      { id: "grid_page_add_item", name: "Add item", steps: [{ type: "listitem", attrs: { op_type: "add" } }] },
    ],
    filter: [{ id: "filter_keywords" }],
    formAction: [{ id: "grid_form_refresh_after_bulk" }],
  };
}

function baseGridTablePageDeps() {
  return {
    filterVars: [{ idx: "base-grid-filter-keywords-idx", id: "filter_keywords" }],
    tempVars: [{ idx: "base-grid-delete-confirmed-idx", id: "var_isDeleteConfirmed" }],
    actions: [
      { id: "active_loans_add_item", name: "Add item", steps: [{ type: "listitem", attrs: { op_type: "add" } }] },
    ],
    filter: [{ idx: "base-grid-filter-keywords-idx", id: "filter_keywords" }],
    formAction: [{ id: "base_grid_form_refresh" }],
  };
}

function responsiveCardGridPageDeps() {
  return {
    filterVars: [{ idx: "responsive-filter-keywords-idx", id: "filter_keywords" }],
    tempVars: [{ idx: "responsive-delete-confirmed-idx", id: "var_isDeleteConfirmed" }],
    filter: [{ idx: "responsive-filter-keywords-idx", id: "filter_keywords" }],
    formAction: { onLoad: "responsive_on_load" },
  };
}

function responsiveCardGridSection() {
  return container("collection_control_responsive_card_wrapper", [
    container("card_col_caption", [
      container("card_col_title_wrapper", [
        heading("card_col_title", "Available Asset Cards", { attrs: { heads: { ty: [null, "h5-medium"] }, common: { positioning: { widthtype: [null, "2"] } } } }),
      ], { attrs: { style: { widthtype: [null, "2", "1", "1"], direction: [null, "column"], gap: [null, "--sp--s0"], align_items: [null, null, "flex-start", "flex-start"], justify_content: [null, null, null, "flex-start"] } } }),
      container("card_col_operations", [
        container("op_normal", [
          { id: "responsive_card_search", type: "search-filter", label: "Search assets", attrs: { placeholder: "Search assets" } },
          { id: "responsive_card_add_button", type: "action_button", label: "Add asset", attrs: { control_action: "responsive_add_item", "action-type": "5" }, nv_label: "Add new item" },
        ]),
      ], { attrs: { style: { widthtype: [null, "2", "1", "1"], gap: [null, 10], direction: [null, "row"], align_items: [null, "center"], justify_content: [null, "flex-end", "space-between"] } } }),
    ], { attrs: { style: { direction: [null, "row", "column", "column"], align_items: [null, "center", "flex-start"], justify_content: [null, "space-between"], gap: [null, "--sp--s200", "--sp--s150", "--sp--s100"] } } }),
    collection("card_col_body", "collection_control_responsive_card_grid", {
      children: [
        container("card_col_item", [
          dynamic("asset_card_image", "dynamic-image", "Image1"),
          dynamic("asset_card_subject", "dynamic-field", "Title", { nv_label: "Survey Program name", attrs: { item_style: { ty: [null, "large-semibold"] } } }),
          heading("asset_card_status_text", [{ exprType: "variable_ctx", id: "Text1", ctx: "__ctx_coll", type: "expr", name: "Collection item:Status" }]),
          container("card_col_item_multi_select", [
            {
              id: "grid_table_col_item_op_menu",
              type: "dropbar",
              label: "Drop bar",
              children: [
                container("grid_table_col_item_op_menu_panel", [
                  { id: "btn_edit_item", type: "action_button", label: "Edit item", attrs: { control_action: "responsive_edit_item", operation: "edit", button: { normal: { bg: OP_MENU_BUTTON_TRANSPARENT_BG } } } },
                  { id: "btn_delete_item", type: "action_button", label: "Delete item", attrs: { control_action: "responsive_delete_item", operation: "del", button: { normal: { bg: OP_MENU_BUTTON_TRANSPARENT_BG } } } },
                ]),
              ],
            },
          ], { attrs: { control_action: null, style: { widthtype: [null, "2"], direction: [null, "row"], gap: [null, "--sp--s025"], overflow: [null, "visible"] } } }),
          dynamic("asset_card_owner", "dynamic-user", "User1"),
          dynamic("asset_card_file", "dynamic-file", "File1"),
        ], {
          attrs: {
            style: {
              gap: [null, "--sp--s100"],
              direction: [null, "column"],
              wrap: [null, "nowrap"],
              widthtype: [null, "1"],
              align_items: [null, "stretch"],
              justify_content: [null, "flex-start"],
              background: "#ffffff",
              border: { type: "1", width: [null, { top: 1, right: 1, bottom: 1, left: 1 }], color: "#e5edf5" },
              padding: [null, { top: 18, right: 18, bottom: 18, left: 18 }],
              radius: [null, { top: 16, right: 16, bottom: 16, left: 16 }],
            },
          },
        }),
      ],
      attrs: {
        data: {
          list: { ListID: "list_assets", Title: "Assets" },
          sort: [{ SortName: "Title", SortByDesc: true }],
          ps: 9,
          filter: [],
          fulltext: [{ fields: ["Title", "Text1"], value: [{ exprType: "variable", valueType: "string", id: "__filter_filter_keywords", type: "expr", name: "filter_keywords" }] }],
        },
        datasetRegion: "Asset cards",
        appPlanDatasetRegion: "Asset cards",
        layout: {
          cg: [null, 16],
          rg: [null, 16],
          cp: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }],
          "align-i": [null, "7"],
          col: [null, null, 2, 1],
        },
        actions: [
          {
            id: "responsive_edit_item",
            name: "Edit item",
            type: "coll",
            steps: [{ type: "listitem", attrs: { op_type: "edit", listdataid: [{ exprType: "variable_ctx", id: "ListDataID", ctx: "__ctx_coll" }] } }],
          },
          {
            id: "responsive_delete_item",
            name: "Delete item",
            type: "coll",
            steps: [
              { type: "confirm", attrs: { confirm_rs: { exprType: "variable", id: "__temp_var_isDeleteConfirmed", name: "var_isDeleteConfirmed" } } },
              { type: "setdatalist", attrs: { type: "remove", wheres: [{ left: "ListDataID", right: [{ exprType: "variable_ctx", id: "ListDataID", ctx: "__ctx_coll" }] }] }, condition: [{ exprType: "variable", id: "__temp_var_isDeleteConfirmed", name: "var_isDeleteConfirmed" }, { type: "op", op: "==" }, { type: "bool", value: true }] },
            ],
          },
        ],
        pagination: { p: { sp: [null, 16] } },
      },
    }),
  ], { attrs: { style: { gap: [null, "--sp--s200"], direction: [null, "column"] } } });
}

function gridMultiselectSection(prefix) {
  const columns = [[46, "px"], [2, "fr"], [1, "fr"], [1, "fr"], [1, "fr"]];
  return container("grid_table_col_multiselect_wrapper", [
    container("grid_table_col_caption", [
      container("grid_table_col_title_wrapper", [
        heading("grid_table_col_title", "Bulk reminders"),
      ]),
      container("grid_table_col_operations", [
        container("op_normal", [
          { id: "grid_bulk_search", type: "search-filter", label: "Search loans", attrs: { placeholder: "Search loan requests" } },
          { id: "grid_bulk_add_button", type: "action_button", label: "Add item", attrs: { control_action: "grid_page_add_item" }, nv_label: "Add new item" },
        ]),
        container("op_multipleselected", [
          container("selected_items_amount_wrapper", [
            heading("grid_selected_items_amount", [{ exprType: "variable", id: "__temp_var_SelectedItemsAmount", name: "var_SelectedItemsAmount" }, { type: "str", value: " selected" }]),
          ]),
          container("multiple_operations_wrapper", [
            { id: "btn_set_items", type: "action_button", label: "Send reminders", attrs: { control_action: "grid_page_bulk_complete" }, nv_label: "btn_set_items" },
            { id: "btn_delete_items", type: "action_button", label: "Delete selected items", attrs: { control_action: "grid_page_bulk_delete" }, nv_label: "btn_delete_items" },
          ]),
        ]),
      ]),
    ]),
    container("grid_table_col_content", [
      gridHeader("grid_table_col_header", columns),
      collection(`${prefix}_collection`, "collection_control_grid_table_with_multiselect", {
        nv_label: "grid_table_col_body",
        children: [gridItem("grid_col_item", columns, [
          container("grid_table_col_item_select", [
            { id: "grid_item_unchecked", type: "icon", attrs: { icon: "fa-regular fa-square" } },
            { id: "grid_item_checked", type: "icon", attrs: { icon: "fa-regular fa-square-check" } },
          ], { attrs: { control_action: `${prefix}_select_items` } }),
          dynamic(`${prefix}_title`, "dynamic-field", "Title"),
          dynamic(`${prefix}_owner`, "dynamic-user", "User1"),
          dynamic(`${prefix}_status`, "dynamic-field", "Text1"),
          { id: `${prefix}_progress`, type: "progress", attrs: { bar: { per: { variable: [{ exprType: "variable_ctx", id: "Decimal2", ctx: "__ctx_coll" }] } } } },
        ])],
        attrs: {
          data: {
            list: { ListID: "list_loans" },
            filter: [{ operator: "9", showCus: false, right: [{ valueType: "string", id: "__filter_loan_status", name: "filter_loan_status" }] }],
            filterBindings: [{ name: "loan_status" }],
          },
          datasetRegion: "Bulk reminders",
          appPlanDatasetRegion: "Bulk reminders",
          layout: { col: [null, 1], hover: { enable: true } },
          pagination: { p: { enabled: true } },
          actions: [
            {
              id: `${prefix}_select_items`,
              type: "coll",
              steps: [
                { type: "setvar", attrs: { variable: "__temp_var_SelectedItems", value: [{ exprType: "variable_ctx", id: "ListDataID", ctx: "__ctx_coll" }] } },
                { type: "setvar", attrs: { variable: "__temp_var_SelectedItemsAmount", value: [{ exprType: "variable", id: "__temp_var_SelectedItemsAmount", name: "var_SelectedItemsAmount" }] } },
              ],
            },
            {
              id: `${prefix}_delete_item`,
              type: "coll",
              steps: [
                { type: "confirm", attrs: { confirm_qs: "Delete item?", confirm_rs: "yes" } },
                { type: "setdatalist", attrs: { wheres: [{ left: "ListDataID", right: [{ exprType: "variable_ctx", id: "ListDataID", ctx: "__ctx_coll" }] }] } },
              ],
            },
          ],
        },
      }),
    ]),
  ]);
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
          dynamic("card_item_image", "dynamic-image", "Image1"),
          dynamic("card_item_subject", "dynamic-field", "Title", { nv_label: "Survey Program name", attrs: { typography: "large-semi-bold" } }),
          container("card_col_item_multi_select", [
            { id: "card_item_unchecked", type: "icon", attrs: { icon: "fa-regular fa-square" } },
            { id: "card_item_checked", type: "icon", attrs: { icon: "fa-regular fa-square-check" } },
          ]),
          dynamic("card_item_owner", "dynamic-user", "User1"),
          dynamic("card_item_file", "dynamic-file", "File1"),
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
  const body = collection(`${prefix}_collection`, templateId, {
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
    });
  if (templateId === "collection_control_grid_table_with_multiselect") {
    body.nv_label = "grid_table_col_body";
  }
  if (templateId !== "collection_control_grid_table") {
    return container(`${prefix}_content_card_wrapper`, [
      gridHeader(`${prefix}_header_grid`, columns),
      body,
    ]);
  }
  return container("grid_table_col_wrapper", [
    container("grid_table_col_caption", [
      container("grid_table_col_title_wrapper", [
        heading("grid_table_col_title", "Active loans"),
      ]),
      container("grid_table_col_operations", [
        container("op_normal", [
          { id: `${prefix}_search`, type: "search-filter", label: "Search loans", attrs: { placeholder: "Search loan requests" } },
          { id: `${prefix}_add_button`, type: "action_button", label: "Add item", attrs: { control_action: `${prefix}_add_item` }, nv_label: "Add new item" },
        ]),
      ]),
    ]),
    container("grid_table_col_content", [
      gridHeader("grid_table_col_header", columns),
      {
        ...body,
        id: `${prefix}_collection`,
        nv_label: "grid_table_col_body",
        attrs: {
          ...body.attrs,
          actions: [
            {
              id: `${prefix}_edit_item`,
              name: "Edit item",
              type: "coll",
              steps: [{ type: "listitem", attrs: { op_type: "edit", listdataid: [{ exprType: "variable_ctx", id: "ListDataID", ctx: "__ctx_coll" }] } }],
            },
            {
              id: `${prefix}_delete_item`,
              name: "Delete item",
              type: "coll",
              steps: [
                { type: "confirm", attrs: { confirm_rs: { exprType: "variable", id: "__temp_var_isDeleteConfirmed", name: "var_isDeleteConfirmed" } } },
                { type: "setdatalist", attrs: { type: "remove", wheres: [{ left: "ListDataID", right: [{ exprType: "variable_ctx", id: "ListDataID", ctx: "__ctx_coll" }] }] } },
              ],
            },
          ],
        },
        children: [gridItem("grid_col_item", columns, [
          container("grid_table_col_item_title_column", [
            dynamic(`${prefix}_title`, "dynamic-field", "Title"),
            container("grid_table_col_item_operations", [
              container("grid_table_col_item_op_menu", [
                container("grid_table_col_item_op_menu_panel", [
                  { id: "btn_edit_item", type: "action_button", label: "Edit item", attrs: { control_action: `${prefix}_edit_item`, button: { normal: { bg: OP_MENU_BUTTON_TRANSPARENT_BG } } }, nv_label: "btn_edit_item" },
                  { id: "btn_delete_item", type: "action_button", label: "Delete item", attrs: { control_action: `${prefix}_delete_item`, button: { normal: { bg: OP_MENU_BUTTON_TRANSPARENT_BG } } }, nv_label: "btn_delete_item" },
                ]),
              ]),
            ]),
          ]),
          dynamic(`${prefix}_owner`, "dynamic-user", "User1"),
          dynamic(`${prefix}_status`, "dynamic-field", "Text1"),
          { id: `${prefix}_progress`, type: "progress", attrs: { bar: { per: { variable: [{ exprType: "variable_ctx", id: "Decimal2", ctx: "__ctx_coll" }] } } } },
        ])],
      },
    ]),
  ]);
}

function collection(id, templateId, overrides = {}) {
  const { attrs, children, ...topLevel } = overrides;
  const data = {
    list: { ListID: "list_loans" },
    sort: [{ SortName: "Title", SortByDesc: false }],
    ...((attrs || {}).data || {}),
  };
  return {
    id,
    type: "collection",
    label: "Collection",
    ...topLevel,
    attrs: {
      datasetPresentationTemplateId: templateId,
      data,
      layout: { col: [null, 1] },
      ...(attrs || {}),
      data,
    },
    children: children || [],
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

function container(id, children = [], extras = {}) {
  return {
    id,
    name: id,
    type: "container",
    ...lockedContainerDefaults(id),
    ...extras,
    attrs: {
      ...(lockedContainerDefaults(id).attrs || {}),
      ...(extras.attrs || {}),
      style: {
        ...(lockedContainerDefaults(id).attrs?.style || {}),
        ...(extras.attrs?.style || {}),
      },
      common: {
        ...(lockedContainerDefaults(id).attrs?.common || {}),
        ...(extras.attrs?.common || {}),
        positioning: {
          ...(lockedContainerDefaults(id).attrs?.common?.positioning || {}),
          ...(extras.attrs?.common?.positioning || {}),
        },
      },
      container: {
        ...(lockedContainerDefaults(id).attrs?.container || {}),
        ...(extras.attrs?.container || {}),
      },
    },
    children,
  };
}

function lockedContainerDefaults(id) {
  const fullWidth = {
    width: "full",
    attrs: {
      style: { widthtype: [null, "1"] },
      common: { positioning: { widthtype: [null, "1"] } },
    },
  };
  const map = {
    grid_table_col_multiselect_wrapper: { ...fullWidth, attrs: { ...fullWidth.attrs, style: { ...fullWidth.attrs.style, direction: [null, "column"], align_items: [null, "flex-start"], gap: [null, 0] }, container: { gap: 0 } } },
    grid_table_col_caption: { ...fullWidth, attrs: { ...fullWidth.attrs, style: { ...fullWidth.attrs.style, direction: [null, "row", "column", "column"], align_items: [null, "center", "flex-start"], justify_content: [null, "space-between"], gap: [null, "--sp--s200", "--sp--s150", "--sp--s100"] } } },
    grid_table_col_content: { ...fullWidth, attrs: { ...fullWidth.attrs, style: { ...fullWidth.attrs.style, gap: [null, 0] } } },
    op_normal: { attrs: { style: { widthtype: [null, "2", "1"], gap: [null, 10], direction: [null, "row"], align_items: [null, "center"], justify_content: [null, "flex-end"] } } },
    op_multipleselected: { attrs: { style: { widthtype: [null, "2", "1", "1"], gap: [null, 10], direction: [null, "row", null, "column-reverse"], align_items: [null, "center"], justify_content: [null, "flex-end", "space-between"] } } },
    selected_items_amount_wrapper: { attrs: { style: { direction: [null, "row"], align_items: [null, "center"], justify_content: [null, "flex-end", null, "flex-start"], gap: [null, "--sp--s150"], widthtype: [null, "2", null, "1"] } } },
    multiple_operations_wrapper: { attrs: { style: { widthtype: [null, "2", "1"], gap: [null, 10], direction: [null, "row"], align_items: [null, "center"], justify_content: [null, "flex-end"] } } },
  };
  return structuredClone(map[id] || {});
}

function heading(id, value, extras = {}) {
  const title = Array.isArray(value) ? { variable: value } : { value };
  const defaultAttrs = id === "grid_table_col_title"
    ? { heads: { ty: structuredClone(GRID_TABLE_CAPTION_TITLE_TYPOGRAPHY) } }
    : {};
  return {
    id,
    type: "heading",
    ...extras,
    attrs: {
      ...defaultAttrs,
      ...(extras.attrs || {}),
      headc: {
        ...(extras.attrs?.headc || {}),
        title,
      },
    },
  };
}

function dynamic(id, type, field, extras = {}) {
  const user = type === "dynamic-user" ? {
    user: { field, fieldName: field },
    item_style: {
      ...(extras.attrs?.item_style || {}),
      pd: structuredClone(DYNAMIC_USER_ZERO_ITEM_PADDING),
    },
  } : {};
  return {
    id,
    type,
    field,
    FieldName: field,
    ...extras,
    attrs: {
      ...(extras.attrs || {}),
      source: "3",
      "obj-f": field,
      field,
      fieldName: field,
      data: {
        ...(extras.attrs?.data || {}),
        field,
        fieldName: field,
      },
      ...user,
    },
  };
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

function renameFirstContentCard(resource, identity) {
  const card = findControl(resource, "content_card_wrapper");
  card.id = identity;
  card.name = identity;
  card.nv_label = identity;
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

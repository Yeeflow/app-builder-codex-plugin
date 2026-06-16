#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectUiControlPropertyFidelity } from "./inspect-ui-control-property-fidelity.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isSourceRepo = fs.existsSync(path.join(ROOT, "dist", "yeeflow-app-builder-plugin"));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ui-control-property-fidelity-"));
const cases = [];

try {
  run();
  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

function run() {
  testFilterActionRowPasses();
  testFilterActionRowInlineFails();
  testFilterGroupFullWidthFails();
  testActionGroupFullWidthFails();
  testGridFails();
  testStaticTextFilterFails();
  testFilterWrapperOwnsWidthFails();
  testFilterControlWidthMissingFails();
  testLegacyFilterWrapperWidthFails();
  testVisibleFilterWithoutBindingFails();
  testTargetDoesNotConsumeVariableFails();
  testNavigatorLabelMissingFails();
  testNavigatorLabelGenericFails();
  testNavigatorLabelSemanticPasses();
  testDecodedResourceAttrsPass();
  testDecodedResourceMismatchFails();
  testKpiIconTileFails();
  testPeerKpiCardsInconsistentFails();
  testCamelCaseContainerAttrsFail();
  testMockRuntimeBoundaryPasses();
  testDynamicKpiProofMissingFails();
  testRichKpiCardPasses();
  testRichKpiMissingIconTileFails();
  testRichKpiIconTileWrongSizeFails();
  testRichKpiGridFails();
  testSummaryRawVariableFails();
  testLiveKpiBoundaryPasses();
  testMockValueForcedFails();
  testRichTablePasses();
  testTableStatusPlainTextFails();
  testTableProgressPlainTextFails();
  testTableOwnerAvatarMissingFails();
  testTablePlainScaffoldFails();
  testAddListActionContainerPasses();
  testActionContainerMissingActionTypeFails();
  testActionContainerMissingTargetListFails();
  testActionContainerWrongActionTypeFails();
  testActionContainerMissingChildLabelFails();
  testActionContainerMissingNavigatorLabelFails();
  testDecorativeContainerPasses();
  testVisibleRawVariableFails();
  testInternalBindingHiddenPasses();
  testRuntimeSampleUserPatchProofPasses();
  testRuntimeSampleBatchRetryPasses();
  testRuntimeSampleRawIdsFail();
  testRuntimeSampleBlankUserValuesFail();
  testRuntimeSampleBatchRetryMissingFails();
  testCollectionGridTablePresentationPasses();
  testCollectionGridTableOverflowMissingFails();
  testCollectionGridTablePaddingMismatchFails();
  testCollectionProgressTextFails();
  testCollectionProgressCurrencyFails();
  testCollectionProgressRawFormulaFails();
  testCollectionDynamicUserPasses();
  testCollectionOwnerPlainTextFails();
  testCollectionDynamicUserTextFieldFails();
  testCollectionGridTableNavigatorLabelFails();
  testKpiCompactFormatPasses();
  testKpiFixedDecimalPasses();
  testKpiLongRawDecimalFails();
  testKpiLargeNumberUnformattedFails();
  testKpiRawVariableValueFails();
  testKnowledgeBaseBoundaryReported();
  testRadioFilterDropdownVisualPatternPasses();
  testRadioFilterMissingInputStyleFails();
  testRadioFilterMissingDropdownShadowFails();
  testRadioFilterWrongWidthFails();
  testRelativePeriodDropdownVisualPatternPasses();
  testRelativePeriodMissingFieldFails();
  testRelativePeriodMissingChoicesFails();
  testNativeFilterIconPasses();
  testFilterIconTextGlyphFails();
  testFilterIconSizeFails();
  testExtensionOnlyWithoutEvidenceWarns();
  testContainerCustomWidthHeightPasses();
  testContainerCustomWidthMissingFails();
  testNonContainerFullWidthCommonPositioningPasses();
  testNonContainerInlineCommonPositioningPasses();
  testNonContainerCustomWidthCommonPositioningPasses();
  testNonContainerStyleOnlyWidthFails();
  testDataFilterRuntimeWidthMissingCommonPositioningFails();
  testDataFilterRuntimeWidthCommonPositioningPasses();
  testCommonMarginPaddingPasses();
  testCommonBorderNormalPasses();
  testCommonBorderHoverShadowPasses();
  testCommonClassicBackgroundPasses();
  testCommonBackgroundImagePasses();
  testCommonTwoColorGradientPasses();
  testCommonGradientTooComplexFails();
  testCliSmoke();
  if (isSourceRepo) testDistMirror();
}

function testFilterActionRowPasses() {
  const report = inspectFixture("pass-filter-action-row.json", goodSpec());
  assert.equal(report.status, "pass");
  cases.push("Pass: correct full-width parent row, inline groups, inline wrappers, and Data Filter-owned 180px width");
}

function testFilterActionRowInlineFails() {
  const spec = goodSpec();
  spec.filterActionRow.attrs.style.widthtype = "2";
  expectFail("Fail: parent filter/action row is inline", inspectFixture("inline-parent-row.json", spec), "FILTER_ACTION_ROW_NOT_FULL_WIDTH");
}

function testFilterGroupFullWidthFails() {
  const spec = goodSpec();
  spec.filterGroup.attrs.style.widthtype = "1";
  expectFail("Fail: filter group is full/stretch instead of inline", inspectFixture("full-filter-group.json", spec), "FILTER_GROUP_NOT_INLINE");
}

function testActionGroupFullWidthFails() {
  const spec = goodSpec();
  spec.actionGroup.attrs.style.widthtype = "1";
  expectFail("Fail: action group is full/stretch instead of inline", inspectFixture("full-action-group.json", spec), "ACTION_GROUP_NOT_INLINE");
}

function testGridFails() {
  const spec = goodSpec();
  spec.filterActionRow.controlType = "Grid";
  expectFail("Fail: Grid used where Container is required", inspectFixture("grid-row.json", spec), "GRID_USED_WHERE_CONTAINER_REQUIRED");
}

function testStaticTextFilterFails() {
  const spec = goodSpec();
  spec.dataFilters[0].controlType = "Text";
  expectFail("Fail: static Text used instead of Data Filter", inspectFixture("static-text-filter.json", spec), "DATA_FILTER_CONTROL_TYPE_MISMATCH");
}

function testFilterWrapperOwnsWidthFails() {
  const spec = goodSpec();
  spec.dataFilters.find((filter) => filter.name === "Region").wrapperAttrs.style.width = 180;
  const report = inspectFixture("wrapper-owns-filter-width.json", spec);
  expectFail("Fail: filter wrapper owns 180px width", report, "FILTER_WRAPPER_SHOULD_NOT_OWN_FIXED_FILTER_WIDTH");
}

function testFilterControlWidthMissingFails() {
  const spec = goodSpec();
  const region = spec.dataFilters.find((filter) => filter.name === "Region");
  delete region.attrs.style.width;
  delete region.attrs.common.sizing.width;
  delete region.attrs.common.sizing.minWidth;
  delete region.attrs.common.sizing.maxWidth;
  delete region.attrs.common.positioning.width;
  delete region.attrs.common.positioning.widthtype;
  delete region.attrs.common.positioning.widthu;
  expectFail("Fail: Data Filter control lacks fixed 180px width", inspectFixture("missing-filter-control-width.json", spec), "FILTER_CONTROL_FIXED_WIDTH_MISSING");
}

function testLegacyFilterWrapperWidthFails() {
  const spec = goodSpec();
  spec.dataFilters.find((filter) => filter.name === "Status").wrapperAttrs.style.width = 120;
  spec.dataFilters.find((filter) => filter.name === "Event Type").wrapperAttrs.style.width = 140;
  const report = inspectFixture("legacy-status-event-type-wrapper-width.json", spec);
  expectFail("Fail: Status/Event Type wrapper uses legacy 120/140 width", report, "LEGACY_FILTER_WRAPPER_WIDTH_DETECTED");
}

function testVisibleFilterWithoutBindingFails() {
  const spec = goodSpec();
  delete spec.dataFilters[0].filterVariable;
  expectFail("Fail: Data Filter visible but no filter variable binding", inspectFixture("unbound-filter.json", spec), "DATA_FILTER_VISIBLE_BUT_NOT_BOUND");
}

function testTargetDoesNotConsumeVariableFails() {
  const spec = goodSpec();
  spec.targetControls = [{ name: "Event Pipeline Collection", controlType: "Collection", consumedFilterVariables: ["statusFilter"] }];
  expectFail("Fail: target Collection/Summary/List does not consume filter variable", inspectFixture("unconsumed-filter.json", spec), "FILTER_VARIABLE_NOT_CONSUMED_BY_TARGET_CONTROL");
}

function testNavigatorLabelMissingFails() {
  const spec = goodSpec();
  delete spec.filterGroup.nv_label;
  expectFail("Fail: structural containers have semantic id but no nv_label", inspectFixture("missing-navigator-label.json", spec), "NAVIGATOR_LABEL_MISSING");
}

function testNavigatorLabelGenericFails() {
  const spec = goodSpec();
  spec.filterGroup.nv_label = "Container";
  expectFail("Fail: structural containers use generic nv_label like Container", inspectFixture("generic-navigator-label.json", spec), "NAVIGATOR_LABEL_GENERIC");
}

function testNavigatorLabelSemanticPasses() {
  const report = inspectFixture("semantic-navigator-labels.json", goodSpec());
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: structural controls include semantic nv_label");
}

function testDecodedResourceAttrsPass() {
  const spec = goodSpec();
  spec.decodedResourceAttrsValidated = true;
  spec.decodedResources = [
    decodedResource("event_portfolio_filter_row", "filterActionRow", spec.filterActionRow.attrs),
    decodedResource("event_portfolio_filter_group", "filterGroup", spec.filterGroup.attrs),
    decodedResource("event_portfolio_region_filter_wrapper", "filterWrapper", spec.dataFilters[0].wrapperAttrs),
    decodedResource("event_portfolio_region_filter", "dataFilter", spec.dataFilters[0].attrs),
  ];
  const report = inspectFixture("decoded-resource-attrs-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: decoded Resource responsive attr shapes are accepted when semantically correct");
}

function testDecodedResourceMismatchFails() {
  const spec = goodSpec();
  spec.decodedResourceAttrsValidated = true;
  spec.decodedResources = [
    {
      id: "event_portfolio_region_filter",
      type: "radio-filter",
      expectedRole: "dataFilter",
      nv_label: "event_portfolio_region_filter",
      decodedAttrsMismatched: true,
      attrs: { style: { widthtype: [null, "1"], width: [null, 120], widthu: [null, "px"] } },
    },
  ];
  expectFail("Fail: normalized spec passes but decoded Resource attrs are mismatched", inspectFixture("decoded-resource-mismatch.json", spec), "DECODED_RESOURCE_ATTR_SHAPE_NOT_VALIDATED");
}

function testKpiIconTileFails() {
  const spec = goodSpec();
  delete spec.kpiCards[0].iconTile.fixedWidth;
  expectFail("Fail: KPI icon tile missing fixed size or centered icon", inspectFixture("bad-icon-tile.json", spec), "KPI_ICON_TILE_STYLE_MISMATCH");
}

function testPeerKpiCardsInconsistentFails() {
  const spec = goodSpec();
  spec.kpiCards[2].iconTile.fixedWidth = 72;
  expectFail("Fail: peer KPI cards inconsistent with golden first-card pattern", inspectFixture("peer-kpi-inconsistent.json", spec), "KPI_TEXT_STACK_LAYOUT_MISMATCH");
}

function testCamelCaseContainerAttrsFail() {
  const spec = goodSpec();
  delete spec.filterActionRow.attrs.style.align_items;
  delete spec.filterActionRow.attrs.style.justify_content;
  spec.filterActionRow.attrs.style.alignItems = "center";
  spec.filterActionRow.attrs.style.justifyContent = "space-between";
  const report = inspectFixture("camel-case-container.json", spec);
  expectFail("Fail: container uses camelCase attrs when Yeeflow expects snake_case attrs", report, "CONTAINER_ATTR_SCHEMA_ALIAS_MISMATCH");
}

function testMockRuntimeBoundaryPasses() {
  const spec = goodSpec();
  for (const kpi of spec.kpiCards) {
    kpi.runtimeValueDiffersFromMock = true;
    kpi.mockValueBoundary = "visual-target-only";
  }
  const report = inspectFixture("mock-runtime-boundary.json", spec);
  assert.equal(report.status, "pass");
  cases.push("Pass: live KPI values differ from mock values when marked as visual-target-only");
}

function testDynamicKpiProofMissingFails() {
  const spec = goodSpec();
  spec.kpiCards[0].dynamicKpiProofClaimed = true;
  spec.kpiCards[0].beforeAfterMutationEvidence = false;
  expectFail("Fail: dynamic KPI proof claimed without before/after mutation evidence", inspectFixture("missing-dynamic-proof.json", spec), "DYNAMIC_KPI_PROOF_MISSING");
}

function testRichKpiCardPasses() {
  const spec = goodSpec();
  spec.kpiCards = [richKpiCard("Planned Events")];
  const report = inspectFixture("rich-kpi-card-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: rich KPI card with fixed centered icon tile, inline body, text stack, Summary value, trend, helper text");
}

function testRichKpiMissingIconTileFails() {
  const spec = goodSpec();
  spec.kpiCards = [richKpiCard("Planned Events")];
  delete spec.kpiCards[0].iconTile;
  expectFail("Fail: KPI card missing icon tile", inspectFixture("rich-kpi-missing-icon-tile.json", spec), "KPI_CARD_ICON_TILE_MISSING");
}

function testRichKpiIconTileWrongSizeFails() {
  const spec = goodSpec();
  spec.kpiCards = [richKpiCard("Planned Events")];
  spec.kpiCards[0].iconTile.fixedWidth = 40;
  expectFail("Fail: icon tile wrong size or icon not centered", inspectFixture("rich-kpi-icon-wrong-size.json", spec), "KPI_CARD_ICON_TILE_SIZE_MISMATCH");
}

function testRichKpiGridFails() {
  const spec = goodSpec();
  spec.kpiCards = [richKpiCard("Planned Events")];
  spec.kpiCards[0].controlType = "Grid";
  const report = inspectFixture("rich-kpi-grid.json", spec);
  expectFail("Fail: KPI card uses Grid where Container structure is required", report, "KPI_CARD_GRID_USED_WHERE_CONTAINER_REQUIRED");
}

function testSummaryRawVariableFails() {
  const spec = goodSpec();
  spec.kpiCards = [richKpiCard("Planned Events")];
  spec.kpiCards[0].summaryValue.visibleText = "__temp_planned_events";
  expectFail("Fail: Summary value rendered as raw variable name", inspectFixture("summary-raw-variable-visible.json", spec), "SUMMARY_VALUE_RAW_VARIABLE_VISIBLE");
}

function testLiveKpiBoundaryPasses() {
  const spec = goodSpec();
  spec.kpiCards = [richKpiCard("Planned Events")];
  spec.kpiCards[0].runtimeValueDiffersFromMock = true;
  spec.kpiCards[0].mockValueBoundary = "visual-target-only";
  const report = inspectFixture("live-kpi-boundary-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: live KPI value differs from mock but live-data boundary is documented");
}

function testMockValueForcedFails() {
  const spec = goodSpec();
  spec.kpiCards = [richKpiCard("Planned Events")];
  spec.kpiCards[0].mockValueForcedAsRuntimeProof = true;
  expectFail("Fail: mock value is forced or claimed as runtime proof", inspectFixture("mock-value-forced-runtime-proof.json", spec), "MOCK_VALUE_FORCED_AS_RUNTIME_PROOF");
}

function testRichTablePasses() {
  const spec = goodSpec();
  spec.tables = [richTable()];
  const report = inspectFixture("rich-table-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: rich table with badge, progress bar, owner/avatar treatment, header hierarchy, row density");
}

function testTableStatusPlainTextFails() {
  const spec = goodSpec();
  spec.tables = [richTable()];
  spec.tables[0].richCellTreatments.statusBadge = false;
  expectFail("Fail: status rendered as plain text when badge required", inspectFixture("table-status-plain-text.json", spec), "TABLE_STATUS_BADGE_MISSING");
}

function testTableProgressPlainTextFails() {
  const spec = goodSpec();
  spec.tables = [richTable()];
  spec.tables[0].richCellTreatments.progressBar = false;
  expectFail("Fail: progress rendered as plain text when progress bar required", inspectFixture("table-progress-plain-text.json", spec), "TABLE_PROGRESS_BAR_MISSING");
}

function testTableOwnerAvatarMissingFails() {
  const spec = goodSpec();
  spec.tables = [richTable()];
  spec.tables[0].richCellTreatments.ownerAvatar = false;
  expectFail("Fail: owner/person rendered without avatar/person treatment when required", inspectFixture("table-owner-no-avatar.json", spec), "TABLE_OWNER_AVATAR_MISSING");
}

function testTablePlainScaffoldFails() {
  const spec = goodSpec();
  spec.tables = [richTable()];
  spec.tables[0].plainScaffoldRendering = true;
  expectFail("Fail: table looks like plain scaffold despite design-fidelity claim", inspectFixture("table-plain-scaffold.json", spec), "TABLE_PLAIN_SCAFFOLD_RENDERING");
}

function testAddListActionContainerPasses() {
  const spec = goodSpec();
  spec.actions = [addListActionContainer()];
  const report = inspectFixture("add-list-action-container-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: add-list action Container with fixed size, child Heading/Text, action-type \"5\", target list metadata, and nv_label");
}

function testActionContainerMissingActionTypeFails() {
  const spec = goodSpec();
  spec.actions = [addListActionContainer()];
  delete spec.actions[0].actionType;
  expectFail("Fail: styled action Container missing action-type", inspectFixture("action-missing-type.json", spec), "ACTION_CONTAINER_ACTION_TYPE_MISSING");
}

function testActionContainerMissingTargetListFails() {
  const spec = goodSpec();
  spec.actions = [addListActionContainer()];
  spec.actions[0].targetList = {};
  expectFail("Fail: add-list action missing target list metadata", inspectFixture("action-missing-target-list.json", spec), "ACTION_CONTAINER_TARGET_LIST_MISSING");
}

function testActionContainerWrongActionTypeFails() {
  const spec = goodSpec();
  spec.actions = [addListActionContainer()];
  spec.actions[0].actionType = "2";
  expectFail("Fail: wrong action-type for add-list intent", inspectFixture("action-wrong-type.json", spec), "ACTION_CONTAINER_ACTION_TYPE_MISMATCH");
}

function testActionContainerMissingChildLabelFails() {
  const spec = goodSpec();
  spec.actions = [addListActionContainer()];
  spec.actions[0].children = [];
  expectFail("Fail: child visible label missing", inspectFixture("action-missing-child-label.json", spec), "ACTION_CONTAINER_CHILD_LABEL_MISSING");
}

function testActionContainerMissingNavigatorLabelFails() {
  const spec = goodSpec();
  spec.actions = [addListActionContainer()];
  delete spec.actions[0].nv_label;
  expectFail("Fail: semantic nv_label missing", inspectFixture("action-missing-nv-label.json", spec), "ACTION_CONTAINER_NAVIGATOR_LABEL_MISSING");
}

function testDecorativeContainerPasses() {
  const spec = goodSpec();
  spec.actions = [{ ...action("Decorative Accent", 120, 32), decorative: true, requiresNavigatorLabel: false }];
  const report = inspectFixture("decorative-container-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: decorative Container not intended as action does not require action-type");
}

function testVisibleRawVariableFails() {
  const spec = goodSpec();
  spec.visibleTexts = [{ id: "event_portfolio_visible_value", text: "__temp_event_count" }];
  expectFail("Fail: visible decoded text contains __temp_, temp_event, or internal binding/variable token", inspectFixture("visible-raw-variable.json", spec), "RAW_VARIABLE_TEXT_VISIBLE");
}

function testInternalBindingHiddenPasses() {
  const spec = goodSpec();
  spec.decodedResources = [
    {
      id: "event_portfolio_summary_hidden",
      expectedRole: "summary",
      attrs: { save_var: { name: "__temp_event_count" }, headc: { title: { variable: ["__temp_event_count"] } } },
    },
  ];
  const report = inspectFixture("internal-binding-hidden-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: internal binding variable exists but is not visible text");
}

function testRuntimeSampleUserPatchProofPasses() {
  const spec = goodSpec();
  spec.runtimeSampleDataProof = runtimeSampleProof();
  const report = inspectFixture("runtime-sample-user-patch-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: users-search redacted AccountID provenance + PATCH proof + runtime verification");
}

function testRuntimeSampleBatchRetryPasses() {
  const spec = goodSpec();
  spec.runtimeSampleDataProof = {
    ...runtimeSampleProof(),
    additionalRuntimeRowsRequired: true,
    batchCreateProof: true,
    verifyRetryBackoff: { attempts: 4, delayMs: 1500 },
  };
  const report = inspectFixture("runtime-sample-batch-retry-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: batch create proof with delayed/retry verification");
}

function testRuntimeSampleRawIdsFail() {
  const spec = goodSpec();
  spec.runtimeSampleDataProof = { ...runtimeSampleProof(), rawUserId: "account_1234567890abcdef", rawItemId: "item_1234567890abcdef" };
  expectFail("Fail: raw user IDs or item IDs stored in proof metadata", inspectFixture("runtime-sample-raw-ids.json", spec), "RUNTIME_SAMPLE_USER_ID_NOT_REDACTED");
}

function testRuntimeSampleBlankUserValuesFail() {
  const spec = goodSpec();
  spec.runtimeSampleDataProof = { ...runtimeSampleProof(), blankUserFieldValues: true, itemPatchProof: false };
  expectFail("Fail: Dynamic user runtime proof claimed with blank User field values", inspectFixture("runtime-sample-blank-user-values.json", spec), "RUNTIME_SAMPLE_USER_FIELD_PATCH_PROOF_MISSING");
}

function testRuntimeSampleBatchRetryMissingFails() {
  const spec = goodSpec();
  spec.runtimeSampleDataProof = { ...runtimeSampleProof(), additionalRuntimeRowsRequired: true, batchCreateProof: true, verifyRetryBackoff: false, delayedVerification: false };
  expectFail("Fail: batch create proof has no verification retry/backoff when immediate query misses rows", inspectFixture("runtime-sample-batch-no-retry.json", spec), "RUNTIME_SAMPLE_VERIFY_RETRY_MISSING");
}

function testCollectionGridTablePresentationPasses() {
  const spec = goodSpec();
  spec.gridTables = [collectionGridTable()];
  const report = inspectFixture("collection-grid-table-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: root overflow hidden, header/item align center, matching cell padding");
}

function testCollectionGridTableOverflowMissingFails() {
  const spec = goodSpec();
  spec.gridTables = [collectionGridTable()];
  spec.gridTables[0].rootOverflowHidden = false;
  expectFail("Fail: root overflow hidden missing", inspectFixture("collection-grid-table-overflow-missing.json", spec), "COLLECTION_GRID_TABLE_OVERFLOW_HIDDEN_MISSING");
}

function testCollectionGridTablePaddingMismatchFails() {
  const spec = goodSpec();
  spec.gridTables = [collectionGridTable()];
  spec.gridTables[0].bodyCellPadding = { top: 4, right: 12, bottom: 4, left: 12 };
  expectFail("Fail: header/body padding mismatch", inspectFixture("collection-grid-table-padding-mismatch.json", spec), "COLLECTION_GRID_TABLE_CELL_PADDING_MISMATCH");
}

function testCollectionProgressTextFails() {
  const spec = goodSpec();
  spec.gridTables = [collectionGridTable()];
  spec.gridTables[0].columns[0].controlType = "dynamic-field";
  expectFail("Fail: Registration column uses dynamic text/raw expression instead of progress bar", inspectFixture("collection-grid-table-progress-text.json", spec), "COLLECTION_PROGRESS_CONTROL_MISSING");
}

function testCollectionProgressCurrencyFails() {
  const spec = goodSpec();
  spec.gridTables = [collectionGridTable()];
  spec.gridTables[0].columns[0].sourceFieldType = "Currency";
  expectFail("Fail: progress source field is Currency rather than Number", inspectFixture("collection-grid-table-progress-currency.json", spec), "COLLECTION_PROGRESS_SOURCE_NOT_NUMERIC");
}

function testCollectionProgressRawFormulaFails() {
  const spec = goodSpec();
  spec.gridTables = [collectionGridTable()];
  spec.gridTables[0].columns[0].visibleText = "Registration Count / 600";
  expectFail("Fail: raw progress formula text visible", inspectFixture("collection-grid-table-progress-formula.json", spec), "COLLECTION_PROGRESS_RAW_FORMULA_VISIBLE");
}

function testCollectionDynamicUserPasses() {
  const spec = goodSpec();
  spec.gridTables = [collectionGridTable()];
  const report = inspectFixture("collection-grid-table-owner-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: Owner column uses Dynamic user control bound to User/identity field");
}

function testCollectionOwnerPlainTextFails() {
  const spec = goodSpec();
  spec.gridTables = [collectionGridTable()];
  spec.gridTables[0].columns[1].controlType = "text";
  expectFail("Fail: Owner column uses plain text", inspectFixture("collection-grid-table-owner-text.json", spec), "COLLECTION_DYNAMIC_USER_CONTROL_MISSING");
}

function testCollectionDynamicUserTextFieldFails() {
  const spec = goodSpec();
  spec.gridTables = [collectionGridTable()];
  spec.gridTables[0].columns[1].boundFieldType = "single-line text";
  expectFail("Fail: Dynamic user control bound to single-line text field", inspectFixture("collection-grid-table-owner-text-field.json", spec), "COLLECTION_DYNAMIC_USER_FIELD_NOT_USER_TYPE");
}

function testCollectionGridTableNavigatorLabelFails() {
  const spec = goodSpec();
  spec.gridTables = [collectionGridTable()];
  delete spec.gridTables[0].generatedControls[0].nv_label;
  expectFail("Fail: generated grid-table controls missing semantic nv_label", inspectFixture("collection-grid-table-missing-nv-label.json", spec), "COLLECTION_NV_LABEL_MISSING");
}

function testKpiCompactFormatPasses() {
  const spec = goodSpec();
  spec.kpiCards = [richKpiCard("Approved Budget")];
  spec.kpiCards[0].requiresValueFormatting = true;
  spec.kpiCards[0].requiresCompactNumber = true;
  spec.kpiCards[0].valueExpression = "formatNumber(value / 1000, 1, true) & 'K'";
  spec.kpiCards[0].visibleValue = "225K";
  const report = inspectFixture("kpi-compact-format-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: Approved Budget uses compact formatNumber K/M pattern");
}

function testKpiFixedDecimalPasses() {
  const spec = goodSpec();
  spec.kpiCards = [richKpiCard("Registration Rate")];
  spec.kpiCards[0].requiresValueFormatting = true;
  spec.kpiCards[0].requiresFixedDecimal = true;
  spec.kpiCards[0].metricType = "percentage";
  spec.kpiCards[0].valueExpression = "formatNumber(value, 2, true) & '%'";
  spec.kpiCards[0].visibleValue = "72.15%";
  const report = inspectFixture("kpi-fixed-decimal-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: Registration Rate uses fixed decimal formatNumber(value, 2, true)");
}

function testKpiLongRawDecimalFails() {
  const spec = goodSpec();
  spec.kpiCards = [richKpiCard("Registration Rate")];
  spec.kpiCards[0].visibleValue = "217.16666666666666";
  expectFail("Fail: long raw decimal visible in KPI value", inspectFixture("kpi-long-raw-decimal.json", spec), "KPI_RAW_LONG_DECIMAL_VISIBLE");
}

function testKpiLargeNumberUnformattedFails() {
  const spec = goodSpec();
  spec.kpiCards = [richKpiCard("Approved Budget")];
  spec.kpiCards[0].visibleValue = "225000";
  spec.kpiCards[0].requiresCompactNumber = true;
  spec.kpiCards[0].requiresValueFormatting = true;
  expectFail("Fail: large KPI number unformatted where compact display is expected", inspectFixture("kpi-large-unformatted.json", spec), "KPI_COMPACT_NUMBER_FORMAT_MISSING");
}

function testKpiRawVariableValueFails() {
  const spec = goodSpec();
  spec.kpiCards = [richKpiCard("Planned Events")];
  spec.kpiCards[0].summaryValue.visibleText = "__temp_event_count";
  expectFail("Fail: raw variable name rendered in KPI value", inspectFixture("kpi-raw-variable-value.json", spec), "SUMMARY_VALUE_RAW_VARIABLE_VISIBLE");
}

function testKnowledgeBaseBoundaryReported() {
  const report = inspectFixture("knowledge-base-boundary.json", goodSpec());
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  assert.equal(report.controlPropertyKnowledgeBase.available, true, "control property knowledge base should be discoverable");
  assert.match(report.controlPropertyKnowledgeBase.normalizedRegistry, /yeeflow-control-configurations\.normalized\.json/);
  assert.ok(report.proofBoundary.some((item) => /Control-property paths should align/i.test(item)), "proof boundary should mention the control property knowledge base");
  cases.push("Pass: control-property fidelity report references the Yeeflow control property knowledge base");
}

function testRadioFilterDropdownVisualPatternPasses() {
  const spec = goodSpec();
  spec.dataFilters[0] = visualDataFilter("Region", "radio-filter", "radio-filter.dropdown.visual-fidelity.180px", "regionFilter");
  const report = inspectFixture("radio-filter-visual-pattern-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: radio-filter dropdown with full visual-fidelity 180px extension pattern");
}

function testRadioFilterMissingInputStyleFails() {
  const spec = goodSpec();
  spec.dataFilters[0] = visualDataFilter("Region", "radio-filter", "radio-filter.dropdown.visual-fidelity.180px", "regionFilter");
  delete spec.dataFilters[0].attrs.edit;
  expectFail("Fail: radio-filter dropdown missing attrs.edit input styling", inspectFixture("radio-filter-missing-input.json", spec), "DATA_FILTER_INPUT_STYLE_MISMATCH");
}

function testRadioFilterMissingDropdownShadowFails() {
  const spec = goodSpec();
  spec.dataFilters[0] = visualDataFilter("Region", "radio-filter", "radio-filter.dropdown.visual-fidelity.180px", "regionFilter");
  delete spec.dataFilters[0].attrs.dropdown.body.border.boxShadow;
  expectFail("Fail: radio-filter dropdown missing dropdown body shadow", inspectFixture("radio-filter-missing-shadow.json", spec), "DATA_FILTER_DROPDOWN_PANEL_STYLE_MISSING");
}

function testRadioFilterWrongWidthFails() {
  const spec = goodSpec();
  spec.dataFilters[0] = visualDataFilter("Region", "radio-filter", "radio-filter.dropdown.visual-fidelity.180px", "regionFilter");
  spec.dataFilters[0].attrs.style.width = [null, 160];
  expectFail("Fail: radio-filter dropdown width is not fixed 180px", inspectFixture("radio-filter-wrong-width.json", spec), "DATA_FILTER_FIXED_WIDTH_MISMATCH");
}

function testRelativePeriodDropdownVisualPatternPasses() {
  const spec = goodSpec();
  spec.dataFilters[1] = visualDataFilter("Period", "relative-period", "relative-period.dropdown.visual-fidelity.180px", "periodFilter");
  const report = inspectFixture("relative-period-visual-pattern-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: relative-period dropdown with field, choice-options, and full visual-fidelity 180px pattern");
}

function testRelativePeriodMissingFieldFails() {
  const spec = goodSpec();
  spec.dataFilters[1] = visualDataFilter("Period", "relative-period", "relative-period.dropdown.visual-fidelity.180px", "periodFilter");
  delete spec.dataFilters[1].attrs.field;
  expectFail("Fail: relative-period missing field", inspectFixture("relative-period-missing-field.json", spec), "RELATIVE_PERIOD_FIELD_MISSING");
}

function testRelativePeriodMissingChoicesFails() {
  const spec = goodSpec();
  spec.dataFilters[1] = visualDataFilter("Period", "relative-period", "relative-period.dropdown.visual-fidelity.180px", "periodFilter");
  spec.dataFilters[1].attrs["choice-options"] = [];
  expectFail("Fail: relative-period missing choice-options", inspectFixture("relative-period-missing-choices.json", spec), "RELATIVE_PERIOD_CHOICES_MISSING");
}

function testNativeFilterIconPasses() {
  const spec = goodSpec();
  spec.filterIcon = nativeFilterIcon();
  const report = inspectFixture("native-filter-icon-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: native filter icon with fa-regular fa-filter and 16px size");
}

function testFilterIconTextGlyphFails() {
  const spec = goodSpec();
  spec.filterIcon = {
    controlType: "heading",
    type: "heading",
    extensionPatternId: "icon.filter.native.16px",
    attrs: { headc: { title: { value: "Filter" } } },
  };
  expectFail("Fail: filter icon implemented as heading/text glyph", inspectFixture("filter-icon-text-glyph.json", spec), "FILTER_ICON_NOT_NATIVE_ICON_CONTROL");
}

function testFilterIconSizeFails() {
  const spec = goodSpec();
  spec.filterIcon = nativeFilterIcon();
  spec.filterIcon.attrs.icon.size = [null, 32];
  expectFail("Fail: native icon control missing size or using default 32px", inspectFixture("filter-icon-size-32.json", spec), "FILTER_ICON_SIZE_MISMATCH");
}

function testExtensionOnlyWithoutEvidenceWarns() {
  const spec = goodSpec();
  spec.extensionProperties = [
    {
      controlType: "radio-filter",
      propertyPath: "attrs.dropdown.body.border.futureShadow",
      status: "needs_study",
      confidence: "needs_study",
      evidenceBacked: false,
    },
  ];
  const report = inspectFixture("extension-without-evidence.json", spec);
  assert.equal(report.status, "warning", JSON.stringify(report.findings, null, 2));
  assertHasCode(report, "EXTENSION_PATTERN_NOT_EVIDENCE_BACKED");
  cases.push("Warn/fail: extension-only property path without evidence-backed extension metadata");
}

function testCliSmoke() {
  const candidate = writeJson("cli-candidate.json", goodSpec());
  const result = spawnSync(process.execPath, [
    path.join(ROOT, "scripts", "inspect-ui-control-property-fidelity.mjs"),
    "--candidate",
    candidate,
    "--format",
    "json",
  ], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).status, "pass");
  cases.push("CLI smoke: JSON output is valid and pass exits zero");
}

function testDistMirror() {
  const sourcePath = path.join(ROOT, "scripts", "inspect-ui-control-property-fidelity.mjs");
  const distPath = path.join(ROOT, "dist", "yeeflow-app-builder-plugin", "scripts", "inspect-ui-control-property-fidelity.mjs");
  if (!fs.existsSync(distPath)) return;
  assert.equal(fs.readFileSync(distPath, "utf8"), fs.readFileSync(sourcePath, "utf8"));
  cases.push("Source/dist UI control property fidelity validator mirror exactly");
}

function goodSpec() {
  const filterVariables = ["regionFilter", "periodFilter", "statusFilter", "eventTypeFilter"];
  return {
    page: "Event Portfolio",
    filterActionRow: {
      id: "event_portfolio_filter_action_row",
      label: "Event Portfolio filter and action row",
      name: "Event Portfolio filter and action row",
      nv_label: "event_portfolio_filter_action_row",
      controlType: "Container",
      attrs: {
        style: {
          widthtype: "1",
          direction: "row",
          align_items: "center",
          justify_content: "space-between",
          gap: "16px",
          wrap: "nowrap",
        },
      },
      margin: 0,
      padding: 0,
    },
    filterGroup: structuralContainer("event_portfolio_filter_group", "flex-start"),
    actionGroup: structuralContainer("event_portfolio_action_group", "flex-end"),
    dataFilters: [
      dataFilter("Region", "Radio", 180, "regionFilter"),
      dataFilter("Period", "Relative period", 180, "periodFilter"),
      dataFilter("Status", "Dropdown", 180, "statusFilter"),
      dataFilter("Event Type", "Dropdown", 180, "eventTypeFilter"),
    ],
    actions: [
      action("New Event Request", 168, 40),
      action("Export", 104, 40),
    ],
    targetControls: [
      { name: "Event Pipeline Collection", controlType: "Collection", consumedFilterVariables: filterVariables },
      { name: "KPI Summary Host", controlType: "Summary", consumedFilterVariables: filterVariables },
    ],
    kpiGoldenPattern: kpiCard("Planned Events"),
    kpiCards: [
      kpiCard("Planned Events"),
      kpiCard("Approved Budget"),
      kpiCard("Registration Rate"),
      kpiCard("Open Tasks"),
    ],
  };
}

function dataFilter(name, filterMode, width, filterVariable) {
  const id = `event_portfolio_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}_filter`;
  return {
    id,
    name,
    controlType: "Data Filter",
    filterMode,
    displayStyle: "dropdown",
    displayTitleHidden: true,
    margin: 0,
    padding: 0,
    border: "none",
    placeholderStyle: "compact-muted",
    wrapperAttrs: {
      style: {
        widthtype: "2",
        height: "0",
        direction: "column",
      },
    },
    wrapperControl: {
      id: `${id}_wrapper`,
      controlType: "Container",
      label: `${name} filter wrapper`,
      name: `${name} filter wrapper`,
      nv_label: `${id}_wrapper`,
      attrs: {
        style: {
          widthtype: "2",
          height: "0",
          direction: "column",
        },
      },
    },
    attrs: {
      style: {
        widthtype: [null, "1"],
        width: [null, width],
        widthu: [null, "px"],
      },
      common: {
        positioning: {
          widthtype: [null, "3"],
          width: [null, width],
          widthu: [null, "px"],
        },
        sizing: {
          width: [null, width],
          minWidth: [null, width],
          maxWidth: [null, width],
        },
      },
    },
    filterVariable,
  };
}

function visualDataFilter(name, nativeType, extensionPatternId, filterVariable) {
  const attrs = {
    layout: "dropdown",
    displayStyle: "dropdown",
    "dropdown-enable": true,
    "search-enable": false,
    "more-enable": false,
    displayTitle: false,
    lablay: [null, "hide"],
    placeholder: name === "Region" ? "Select region..." : "Select period...",
    style: {
      gap: [null, 0],
      direction: [null, "column"],
      widthtype: [null, "1"],
      width: [null, 180],
      widthu: [null, "px"],
      align_items: [null, "stretch"],
      justify_content: [null, "center"],
      wrap: [null, "nowrap"],
    },
    common: {
      positioning: { widthtype: [null, "3"], width: [null, 180], widthu: [null, "px"] },
      sizing: {
        width: [null, 180],
        minWidth: [null, 180],
        maxWidth: [null, 180],
        height: [null, 48],
        minHeight: [null, 48],
        maxHeight: [null, 48],
      },
      margin: [null, { top: 0, right: 0, bottom: 0, left: 0 }],
      padding: [null, { top: 0, right: 0, bottom: 0, left: 0 }],
      border: { normal: { type: "0", color: "transparent" } },
    },
    edit: {
      placeholder: { color: "#5f6b7a" },
      normal: {
        color: "#263241",
        border: {
          type: "1",
          color: "var(--c--neutral-light-active)",
          radius: 8,
        },
      },
      pd: 8,
      pcolor: "var(--c--neutral-dark-hover)",
    },
    dropdown: {
      body: {
        border: {
          radius: 8,
          boxShadow: "0 14px 30px rgba(15, 23, 42, 0.16)",
        },
      },
    },
  };
  if (nativeType === "relative-period") {
    attrs.field = { FieldName: "StartDate", Title: "Start Date" };
    attrs["choice-options"] = [{ label: "This Quarter", value: "this-quarter" }];
  }
  return {
    name,
    controlType: "Data Filter",
    type: nativeType,
    filterMode: nativeType,
    displayStyle: "dropdown",
    displayTitleHidden: true,
    margin: 0,
    padding: 0,
    border: "none",
    placeholderStyle: "compact-muted",
    wrapperAttrs: { style: { widthtype: "2", height: "0", direction: "column" } },
    wrapperControl: {
      id: `event_portfolio_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}_filter_wrapper`,
      controlType: "Container",
      label: `${name} filter wrapper`,
      name: `${name} filter wrapper`,
      nv_label: `event_portfolio_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}_filter_wrapper`,
      attrs: { style: { widthtype: "2", height: "0", direction: "column" } },
    },
    filterVariable,
    extensionPatternId,
    attrs,
  };
}

function nativeFilterIcon() {
  return {
    controlType: "icon",
    type: "icon",
    extensionPatternId: "icon.filter.native.16px",
    attrs: {
      icon: {
        icon: "fa-regular fa-filter",
        view: "default",
        shape: "2",
        align: [null, "center"],
        size: [null, 16],
      },
      common: {
        positioning: { widthtype: [null, "2"] },
        margin: [null, { top: 0, right: 0, bottom: 0, left: 0 }],
        padding: [null, { top: 0, right: 0, bottom: 0, left: 0 }],
      },
      style: {
        widthtype: [null, "2"],
      },
    },
  };
}

function testContainerCustomWidthHeightPasses() {
  const spec = goodSpec();
  spec.advancedStyleControls = [
    {
      id: "event_portfolio_card_shell",
      controlType: "Container",
      claimsCustomWidth: true,
      claimsCustomHeight: true,
      expectedWidth: 320,
      expectedHeight: 160,
      attrs: {
        style: {
          widthtype: "3",
          width: 320,
          widthu: "px",
          cushei: 160,
          cusheiu: "px",
        },
      },
    },
  ];
  const report = inspectFixture("container-custom-width-height-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: Container custom width/height through attrs.style");
}

function testContainerCustomWidthMissingFails() {
  const spec = goodSpec();
  spec.advancedStyleControls = [
    {
      id: "event_portfolio_card_shell",
      controlType: "Container",
      claimsCustomWidth: true,
      attrs: { style: { widthtype: "3" } },
    },
  ];
  expectFail("Fail: Container missing attrs.style custom width when claimed", inspectFixture("container-custom-width-missing.json", spec), "CONTAINER_WIDTH_MODEL_REQUIRED");
}

function testNonContainerFullWidthCommonPositioningPasses() {
  const spec = goodSpec();
  spec.advancedStyleControls = [nonContainerAdvancedControl("summary", { positioning: { widthtype: [null, "1"] } }, { expectedWidthMode: "1" })];
  const report = inspectFixture("non-container-full-width-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: non-Container full width through attrs.common.positioning.widthtype [null, \"1\"]");
}

function testNonContainerInlineCommonPositioningPasses() {
  const spec = goodSpec();
  spec.advancedStyleControls = [nonContainerAdvancedControl("icon", { positioning: { widthtype: [null, "2"] } }, { expectedWidthMode: "2" })];
  const report = inspectFixture("non-container-inline-width-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: non-Container inline width through attrs.common.positioning.widthtype [null, \"2\"]");
}

function testNonContainerCustomWidthCommonPositioningPasses() {
  const spec = goodSpec();
  spec.advancedStyleControls = [nonContainerAdvancedControl("action_button", { positioning: { widthtype: [null, "3"], width: [null, 180], widthu: [null, "px"] } }, { claimsCustomWidth: true, expectedWidth: 180 })];
  const report = inspectFixture("non-container-custom-width-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: non-Container custom 180px width through attrs.common.positioning.widthtype [null, \"3\"]");
}

function testNonContainerStyleOnlyWidthFails() {
  const spec = goodSpec();
  spec.advancedStyleControls = [
    {
      id: "event_portfolio_status_filter",
      controlType: "radio-filter",
      claimsCustomWidth: true,
      attrs: { style: { widthtype: [null, "1"], width: [null, 180], widthu: [null, "px"] } },
    },
  ];
  const report = inspectFixture("non-container-style-only-width.json", spec);
  expectFail("Fail: non-Container uses only attrs.style.width for fixed width", report, "NON_CONTAINER_WIDTH_MODEL_MISMATCH");
}

function testDataFilterRuntimeWidthMissingCommonPositioningFails() {
  const spec = goodSpec();
  spec.advancedStyleControls = [
    {
      id: "event_portfolio_region_filter",
      controlType: "Data Filter",
      extensionPatternId: "data-filter.dropdown.runtime-effective-custom-180px-width",
      expectedRuntimeWidth: 180,
      attrs: { common: { sizing: { width: [null, 180] } } },
    },
  ];
  expectFail("Fail: Data Filter 180px dropdown lacks attrs.common.positioning custom width", inspectFixture("data-filter-runtime-width-missing-positioning.json", spec), "DATA_FILTER_RUNTIME_WIDTH_NOT_CUSTOM_POSITIONING");
}

function testDataFilterRuntimeWidthCommonPositioningPasses() {
  const spec = goodSpec();
  spec.advancedStyleControls = [
    {
      id: "event_portfolio_region_filter",
      controlType: "Data Filter",
      extensionPatternId: "data-filter.dropdown.runtime-effective-custom-180px-width",
      expectedRuntimeWidth: 180,
      attrs: { common: { positioning: { widthtype: [null, "3"], width: [null, 180], widthu: [null, "px"] } } },
    },
  ];
  const report = inspectFixture("data-filter-runtime-width-positioning-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: Data Filter 180px dropdown uses attrs.common.positioning custom width");
}

function testCommonMarginPaddingPasses() {
  const spec = goodSpec();
  spec.advancedStyleControls = [nonContainerAdvancedControl("heading", {
    positioning: { widthtype: [null, "2"] },
    margin: zeroBox(),
    padding: zeroBox(),
  }, { requiresCommonMarginPadding: true })];
  const report = inspectFixture("common-margin-padding-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: zero margin/padding under attrs.common");
}

function testCommonBorderNormalPasses() {
  const spec = goodSpec();
  spec.advancedStyleControls = [nonContainerAdvancedControl("action_button", {
    positioning: { widthtype: [null, "2"] },
    border: { normal: { type: "1", color: "#d0d7de", radius: 8, boxShadow: "0 1px 2px rgba(15,23,42,0.08)" } },
  }, { requiresCommonBorderNormal: true })];
  const report = inspectFixture("common-border-normal-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: normal border/radius/shadow under attrs.common.border.normal");
}

function testCommonBorderHoverShadowPasses() {
  const spec = goodSpec();
  spec.advancedStyleControls = [nonContainerAdvancedControl("action_button", {
    positioning: { widthtype: [null, "2"] },
    border: { hover: { boxShadow: "0 8px 18px rgba(15,23,42,0.16)" } },
  }, { requiresCommonBorderHoverShadow: true })];
  const report = inspectFixture("common-border-hover-shadow-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: hover shadow under attrs.common.border.hover");
}

function testCommonClassicBackgroundPasses() {
  const spec = goodSpec();
  spec.advancedStyleControls = [nonContainerAdvancedControl("heading", {
    positioning: { widthtype: [null, "2"] },
    background: { normal: { classic: { color: "#ffffff" } } },
  }, { requiresCommonBackground: true })];
  const report = inspectFixture("common-background-classic-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: classic background color");
}

function testCommonBackgroundImagePasses() {
  const spec = goodSpec();
  spec.advancedStyleControls = [nonContainerAdvancedControl("heading", {
    positioning: { widthtype: [null, "2"] },
    background: { normal: { classic: { image: { url: "redacted-image-ref", fit: "cover" } } } },
  }, { requiresBackgroundImage: true })];
  const report = inspectFixture("common-background-image-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: classic background image shape");
}

function testCommonTwoColorGradientPasses() {
  const spec = goodSpec();
  spec.advancedStyleControls = [nonContainerAdvancedControl("heading", {
    positioning: { widthtype: [null, "2"] },
    background: { normal: { gradient: { colors: ["#ffffff", "#edf2ff"] } } },
  })];
  const report = inspectFixture("common-gradient-two-color-pass.json", spec);
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  cases.push("Pass: two-color gradient background");
}

function testCommonGradientTooComplexFails() {
  const spec = goodSpec();
  spec.advancedStyleControls = [nonContainerAdvancedControl("heading", {
    positioning: { widthtype: [null, "2"] },
    background: { normal: { gradient: { colors: ["#ffffff", "#edf2ff", "#c7d2fe"] } } },
  })];
  expectFail("Fail/warn: gradient with more than two colors without custom CSS evidence", inspectFixture("common-gradient-too-complex.json", spec), "COMMON_BACKGROUND_GRADIENT_TOO_COMPLEX");
}

function nonContainerAdvancedControl(controlType, common, options = {}) {
  return {
    id: `event_portfolio_${String(controlType).replace(/[^a-z0-9]+/gi, "_").toLowerCase()}_advanced`,
    controlType,
    attrs: { common },
    ...options,
  };
}

function zeroBox() {
  return [null, { top: 0, right: 0, bottom: 0, left: 0 }];
}

function action(name, width, height) {
  const id = `event_portfolio_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
  return {
    id,
    name,
    controlType: "Container",
    label: name,
    nv_label: id,
    fixedSizeRequired: true,
    attrs: {
      style: {
        widthtype: "3",
        width,
        widthu: "px",
        cushei: height,
        cusheiu: "px",
      },
    },
  };
}

function addListActionContainer() {
  return {
    ...action("New Event Request", 168, 40),
    actionLike: true,
    actionIntent: "add-list-item",
    actionType: "5",
    expectedWidth: 168,
    expectedHeight: 40,
    targetList: {
      AppID: "app-redacted",
      ListSetID: "listset-redacted",
      ListID: "events-redacted",
    },
    childLabel: "New Event Request",
    children: [
      {
        controlType: "Heading",
        text: "New Event Request",
      },
    ],
  };
}

function structuralContainer(id, justifyContent) {
  return {
    id,
    controlType: "Container",
    label: id.replace(/_/g, " "),
    name: id.replace(/_/g, " "),
    nv_label: id,
    attrs: {
      style: {
        widthtype: "2",
        direction: "row",
        align_items: "center",
        justify_content: justifyContent,
        wrap: "nowrap",
      },
    },
  };
}

function decodedResource(id, expectedRole, attrs) {
  return {
    id,
    expectedRole,
    type: expectedRole === "dataFilter" ? "radio-filter" : "container",
    controlType: expectedRole === "dataFilter" ? "radio-filter" : "Container",
    nv_label: id,
    attrs,
  };
}

function kpiCard(name) {
  return {
    name,
    controlType: "Container",
    iconTile: {
      fixedWidth: 56,
      fixedHeight: 56,
      iconAlign: "center",
      iconJustify: "center",
    },
    textStack: {
      direction: "column",
      alignItems: "flex-start",
    },
    valuePlacement: "below-title",
    trendPlacement: "below-value",
  };
}

function richKpiCard(name) {
  return {
    ...kpiCard(name),
    requiresRichContentFidelity: true,
    outerCardContainer: true,
    containerRole: "outer-card",
    expectedIconTileSize: 56,
    bodyLayout: "inline-icon-text-stack",
    textStack: {
      direction: "column",
      alignItems: "flex-start",
      roles: ["title", "value", "trend", "helper"],
    },
    summaryValue: {
      controlType: "Summary",
      hierarchy: "primary-value",
      visibleText: "24",
    },
    trendText: "+12% vs last month",
    helperText: "Approved events",
  };
}

function richTable() {
  return {
    name: "Event Portfolio table",
    claimsDesignFidelity: true,
    requiresRichCells: true,
    requiresStatusBadge: true,
    requiresProgressBar: true,
    requiresOwnerAvatar: true,
    requiresHeaderHierarchy: true,
    requiresRowDensity: true,
    richCellTreatments: {
      statusBadge: true,
      progressBar: true,
      ownerAvatar: true,
    },
    headerHierarchy: "designed",
    rowDensity: "design-match",
  };
}

function runtimeSampleProof() {
  return {
    userPersonRuntimeProofClaimed: true,
    usersSearchAccountIdProvenanceRedacted: true,
    existingUserValuesWereBlank: true,
    itemPatchProof: true,
    runtimeVerification: true,
  };
}

function collectionGridTable() {
  const padding = { top: 8, right: 12, bottom: 8, left: 12 };
  return {
    name: "Event Pipeline grid table",
    claimsDesignFidelity: true,
    requiresGridTableFidelity: true,
    rootOverflowHidden: true,
    headerAlignItems: "center",
    itemAlignItems: "center",
    headerCellPadding: padding,
    bodyCellPadding: padding,
    columns: [
      {
        name: "Registration",
        role: "progress",
        requiresProgressBar: true,
        controlType: "progress",
        sourceFieldType: "Number",
        sourceExpression: "Registration Count / 600",
        nv_label: "event_pipeline_registration_progress",
      },
      {
        name: "Owner",
        role: "owner",
        requiresDynamicUser: true,
        controlType: "dynamic-user",
        boundFieldType: "User",
        nv_label: "event_pipeline_owner_user",
      },
    ],
    generatedControls: [
      { id: "event_pipeline_grid_root", controlType: "collection", nv_label: "event_pipeline_grid_root" },
      { id: "event_pipeline_header_registration", controlType: "container", nv_label: "event_pipeline_header_registration" },
      { id: "event_pipeline_cell_owner", controlType: "dynamic-user", nv_label: "event_pipeline_cell_owner" },
    ],
  };
}

function inspectFixture(name, spec) {
  return inspectUiControlPropertyFidelity({ candidate: writeJson(name, spec) });
}

function expectFail(label, report, code) {
  assert.equal(report.status, "fail", JSON.stringify(report, null, 2));
  assertHasCode(report, code);
  cases.push(label);
}

function assertHasCode(report, code) {
  assert.ok(report.findings.some((finding) => finding.code === code), `expected ${code} in ${JSON.stringify(report.findings, null, 2)}`);
}

function writeJson(name, value) {
  const filePath = path.join(tmp, name);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
  return filePath;
}

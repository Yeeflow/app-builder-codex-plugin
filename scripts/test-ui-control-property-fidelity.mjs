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
      positioning: { widthtype: [null, "1"] },
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

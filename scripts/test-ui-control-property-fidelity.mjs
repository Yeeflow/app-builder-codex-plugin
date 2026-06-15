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
  testGridFails();
  testStaticTextFilterFails();
  testFixedFilterWidthFails();
  testVisibleFilterWithoutBindingFails();
  testTargetDoesNotConsumeVariableFails();
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
  cases.push("Pass: Event Portfolio-like filter/action row with correct container attrs");
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

function testFixedFilterWidthFails() {
  const spec = goodSpec();
  spec.dataFilters.find((filter) => filter.name === "Region").wrapperAttrs.style.width = 160;
  spec.dataFilters.find((filter) => filter.name === "Period").wrapperAttrs.style.width = 200;
  const report = inspectFixture("wrong-filter-width.json", spec);
  expectFail("Fail: Region/Period filter not fixed 180px", report, "CONTAINER_FIXED_SIZE_MISMATCH");
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
    dataFilters: [
      dataFilter("Region", "Radio", 180, "regionFilter"),
      dataFilter("Period", "Relative period", 180, "periodFilter"),
      dataFilter("Status", "Dropdown", 120, "statusFilter"),
      dataFilter("Event Type", "Dropdown", 140, "eventTypeFilter"),
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
  return {
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
        widthtype: "3",
        width,
        widthu: "px",
        direction: "column",
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
    wrapperAttrs: { style: { width: 180, height: 48, widthtype: "3" } },
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
  return {
    name,
    controlType: "Container",
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

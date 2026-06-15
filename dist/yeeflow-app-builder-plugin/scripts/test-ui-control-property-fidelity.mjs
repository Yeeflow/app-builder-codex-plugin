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

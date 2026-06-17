#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { inspectSupplierRuntimeDesignFidelity } from "./inspect-supplier-runtime-design-fidelity.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "supplier-fidelity-"));
const cases = [];

try {
  testRuntimeProofRejectsInstallLogId();
  testRuntimeProofRejectsDesignerUrl();
  testMissingDesignSectionFails();
  testKpiCountMismatchFails();
  testStaticTextFilterFails();
  testFilterMissingBindingMetadataFails();
  testCollectionWrongListFails();
  testCollectionDetailLinkUnresolvedFails();
  testChartApproximationFails();
  testAnalyticsBindingIncompleteFails();
  testProgressRawFormulaFails();
  testProgressStyleMissingFails();
  testSummaryKpiRawVariableFails();
  testCanonicalPngMissingFails();
  testSvgCanonicalFails();
  testDesignBoardOnlyFails();
  testPageCountOrderMismatchFails();
  testValidManifestPasses();
  testRuntimeScreenshotMapUsingCanonicalPngsPasses();
  testExistingRootPaddingSuiteStillPasses();
  testCliSmoke();
  testDistMirror();

  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

function testRuntimeProofRejectsInstallLogId() {
  const spec = goodSpec();
  spec.runtimeProof.finalUrl = "https://example.invalid/#/list-set/41/install-log-123";
  spec.runtimeProof.installLogIds = ["install-log-123"];
  expectFail("Runtime proof rejects install log ID used as ListSetID", inspectFixture("runtime-install-log-id.json", spec), "INSTALL_LOG_ID_USED_AS_LISTSET_ID");
}

function testRuntimeProofRejectsDesignerUrl() {
  const spec = goodSpec();
  spec.runtimeProof.finalUrl = "https://example.invalid/#/designer/list-set/41/supplier-listset-redacted";
  expectFail("Runtime proof rejects designer/root/admin URL", inspectFixture("runtime-designer-url.json", spec), "RUNTIME_PROOF_LANDED_IN_DESIGNER");
}

function testMissingDesignSectionFails() {
  const spec = goodSpec();
  spec.supplierFidelity.implementation.sections = ["filters", "kpis", "recent supplier intakes"];
  expectFail("Missing design section fails", inspectFixture("missing-design-section.json", spec), "DESIGN_SECTION_MISSING");
}

function testKpiCountMismatchFails() {
  const spec = goodSpec();
  spec.supplierFidelity.implementation.kpis = spec.supplierFidelity.implementation.kpis.slice(0, 4);
  expectFail("KPI count mismatch fails", inspectFixture("kpi-count-mismatch.json", spec), "KPI_CARD_COUNT_MISMATCH");
}

function testStaticTextFilterFails() {
  const spec = goodSpec();
  spec.supplierFidelity.filters[0].controlType = "Text";
  expectFail("Static Text used as filter fails", inspectFixture("static-text-filter.json", spec), "DATA_FILTER_CONTROL_STATIC_TEXT");
}

function testFilterMissingBindingMetadataFails() {
  const spec = goodSpec();
  delete spec.supplierFidelity.filters[0].filterVariable;
  spec.supplierFidelity.filters[0].data = {};
  spec.supplierFidelity.filters[0].field = {};
  const report = inspectFixture("filter-binding-missing.json", spec);
  expectFail("Filter with no binding/list/field metadata fails", report, "DATA_FILTER_BINDING_MISSING");
  assertHasCode(report, "DATA_FILTER_FIELD_METADATA_INVALID");
}

function testCollectionWrongListFails() {
  const spec = goodSpec();
  spec.supplierFidelity.collections[0].data.list.ListID = "wrong-list";
  expectFail("Collection bound to wrong list fails", inspectFixture("collection-wrong-list.json", spec), "COLLECTION_DATA_SOURCE_MISMATCH");
}

function testCollectionDetailLinkUnresolvedFails() {
  const spec = goodSpec();
  spec.supplierFidelity.collections[0].detailLinkResolved = false;
  spec.supplierFidelity.collections[0].detailLinkRawIdOnly = true;
  expectFail("Collection detail link unresolved fails", inspectFixture("collection-link-unresolved.json", spec), "COLLECTION_DETAIL_LINK_INVALID");
}

function testChartApproximationFails() {
  const spec = goodSpec();
  spec.supplierFidelity.analytics[0].approximation = true;
  expectFail("Chart approximation used where line/pie chart required fails", inspectFixture("chart-approximation.json", spec), "ANALYTICS_CONTROL_APPROXIMATION_USED");
}

function testAnalyticsBindingIncompleteFails() {
  const spec = goodSpec();
  spec.supplierFidelity.analytics[0].data = {};
  spec.supplierFidelity.analytics[0].field = {};
  delete spec.supplierFidelity.analytics[0].aggregate;
  expectFail("Analytics control missing binding metadata fails", inspectFixture("analytics-binding-incomplete.json", spec), "ANALYTICS_DATA_BINDING_INCOMPLETE");
}

function testProgressRawFormulaFails() {
  const spec = goodSpec();
  spec.supplierFidelity.progressColumns[0].renderedAsRawFormula = true;
  spec.supplierFidelity.progressColumns[0].visibleText = "{{progress_formula}}";
  expectFail("Progress column rendered as raw formula text fails", inspectFixture("progress-raw-formula.json", spec), "PROGRESS_RENDERED_AS_RAW_TEXT");
}

function testProgressStyleMissingFails() {
  const spec = goodSpec();
  delete spec.supplierFidelity.progressColumns[0].style;
  delete spec.supplierFidelity.progressColumns[0].valueBinding;
  delete spec.supplierFidelity.progressColumns[0].range;
  expectFail("Progress control missing style/value metadata fails", inspectFixture("progress-style-missing.json", spec), "PROGRESS_STYLE_METADATA_MISSING");
}

function testSummaryKpiRawVariableFails() {
  const spec = goodSpec();
  spec.supplierFidelity.kpis[0].visibleText = "__temp_supplier_count";
  expectFail("Summary/KPI raw variable visible fails", inspectFixture("kpi-raw-variable.json", spec), "KPI_RAW_VARIABLE_VISIBLE");
}

function testCanonicalPngMissingFails() {
  const spec = goodSpec();
  spec.designImageManifest.pages[0].canonicalPng = "";
  expectFail("Canonical per-page PNG missing fails", inspectFixture("canonical-png-missing.json", spec), "DESIGN_CANONICAL_PNG_MISSING");
}

function testSvgCanonicalFails() {
  const spec = goodSpec();
  spec.designImageManifest.canonicalFormat = "svg";
  spec.designImageManifest.pages[0].canonicalPng = "assets/generated-ui/supplier/01-supplier-intake-dashboard.svg";
  const report = inspectFixture("svg-canonical.json", spec);
  expectFail("SVG used as canonical design artifact fails", report, "DESIGN_USES_SVG_AS_CANONICAL");
}

function testDesignBoardOnlyFails() {
  const spec = goodSpec();
  spec.designImageManifest.pages[0].canonicalPng = "assets/generated-ui/supplier/00-design-board.png";
  expectFail("Design board used as only page artifact fails", inspectFixture("design-board-only.json", spec), "DESIGN_BOARD_USED_AS_PAGE_ARTIFACT");
}

function testPageCountOrderMismatchFails() {
  const spec = goodSpec();
  spec.designImageManifest.pages = spec.designImageManifest.pages.slice(0, 1);
  spec.designImageManifest.pages[0].canonicalPng = "assets/generated-ui/supplier/02-supplier-intake-dashboard.design.png";
  const report = inspectFixture("page-count-order-mismatch.json", spec);
  expectFail("Page count/order mismatch between app plan and design manifest fails", report, "DESIGN_PAGE_COUNT_MISMATCH");
  assertHasCode(report, "DESIGN_PAGE_ORDER_MISMATCH");
}

function testValidManifestPasses() {
  expectPass("Valid manifest with one PNG per page passes", inspectFixture("valid-manifest.json", goodSpec()));
}

function testRuntimeScreenshotMapUsingCanonicalPngsPasses() {
  const spec = goodSpec();
  spec.supplierFidelity = {};
  expectPass("Runtime screenshot map using canonical PNGs passes", inspectFixture("runtime-map-canonical-png.json", spec));
}

function testExistingRootPaddingSuiteStillPasses() {
  const result = spawnSync(process.execPath, [path.join(ROOT, "scripts", "test-ui-summary-kpi-runtime-hard-gates.mjs")], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Dashboard root exact token-array padding passes/);
  assert.match(result.stdout, /Data-list custom form root exact token-array padding passes/);
  cases.push("Existing 0.6.55 root padding hard-gate tests still pass");
}

function testCliSmoke() {
  const file = writeJson("cli-valid.json", goodSpec());
  const result = spawnSync(process.execPath, [
    path.join(ROOT, "scripts", "inspect-supplier-runtime-design-fidelity.mjs"),
    "--package",
    file,
    "--format",
    "json",
  ], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(JSON.parse(result.stdout).status, "pass");
  cases.push("CLI smoke: Supplier runtime/design fidelity validator passes valid fixture");
}

function testDistMirror() {
  const source = path.join(ROOT, "scripts", "inspect-supplier-runtime-design-fidelity.mjs");
  const dist = path.join(ROOT, "dist", "yeeflow-app-builder-plugin", "scripts", "inspect-supplier-runtime-design-fidelity.mjs");
  if (fs.existsSync(dist)) {
    assert.equal(fs.readFileSync(dist, "utf8"), fs.readFileSync(source, "utf8"));
    cases.push("Source/dist Supplier runtime/design fidelity validator mirror exactly");
  }
}

function goodSpec() {
  const list = { AppID: "41", ListSetID: "supplier-listset-redacted", ListID: "suppliers-list-redacted", Type: "list", Title: "Suppliers" };
  const field = { FieldName: "Text4", DisplayName: "Onboarding Stage", Type: "text" };
  return {
    runtimeProof: {
      expectedAppId: "41",
      expectedListSetId: "supplier-listset-redacted",
      finalUrl: "https://example.invalid/#/list-set/41/supplier-listset-redacted",
      pageTitle: "Supplier Intake Dashboard",
      installLogIds: ["install-log-123"],
    },
    designImageManifest: {
      appSlug: "supplier-onboarding-risk-review",
      layout: "application-layout-2-horizontal-nav",
      canonicalFormat: "png",
      pages: [
        page(1, "Supplier Intake Dashboard", "supplier-intake-dashboard"),
        page(2, "Supplier Review Workbench", "supplier-review-workbench"),
      ],
    },
    supplierFidelity: {
      plan: {
        requiresCanonicalDesignPngs: true,
        pages: [
          { pageTitle: "Supplier Intake Dashboard" },
          { pageTitle: "Supplier Review Workbench" },
        ],
      },
      design: {
        background: "gray",
        sections: ["filters", "kpis", "charts", "recent supplier intakes"],
        kpis: ["New Intakes", "Pending Review", "High Risk", "Cycle Time", "Approved"],
        charts: [
          { title: "Intakes Over Time", type: "line-chart" },
          { title: "Intakes by Stage", type: "pie-chart" },
        ],
      },
      implementation: {
        background: "gray",
        sections: ["filters", "kpis", "charts", "recent supplier intakes"],
        pages: [
          { title: "Supplier Intake Dashboard", chromeStyle: "horizontal" },
          { title: "Supplier Review Workbench", chromeStyle: "horizontal" },
        ],
        kpis: ["New Intakes", "Pending Review", "High Risk", "Cycle Time", "Approved"].map((label) => ({ label, visibleText: "12", requiresFormatting: true, formatNumber: true })),
        analytics: [
          analytics("Intakes Over Time", "line-chart", list, { FieldName: "Datetime1", Type: "datetime" }),
          analytics("Intakes by Stage", "pie-chart", list, field),
        ],
      },
      filters: [
        {
          name: "Onboarding Stage",
          controlType: "radio-filter",
          filterVariable: "stageFilter",
          data: { ...list },
          field,
          requiresDisplayValueFields: true,
          displayField: "Text4",
          valueField: "Text4",
          runtimeRendered: true,
          targetCollection: { consumedFilterVariables: ["stageFilter"] },
        },
      ],
      filterActionRows: [
        {
          id: "supplier_filter_action_row",
          controlType: "container",
          role: "row",
          nv_label: "supplier_filter_action_row",
          groups: [
            { id: "supplier_filter_group", controlType: "container", role: "filter-group", nv_label: "supplier_filter_group", widthMode: "2" },
            { id: "supplier_action_group", controlType: "container", role: "action-group", nv_label: "supplier_action_group", widthMode: "2" },
          ],
        },
      ],
      inventory: { lists: [list] },
      collections: [
        {
          name: "Recent Supplier Intakes",
          data: { list: { ...list } },
          detailLink: "supplier-detail-layout",
          detailLinkResolved: true,
          filterTargetListID: list.ListID,
        },
      ],
      analytics: [
        analytics("Intakes Over Time", "line-chart", list, { FieldName: "Datetime1", Type: "datetime" }),
        analytics("Intakes by Stage", "pie-chart", list, field),
      ],
      progressColumns: [
        {
          title: "Completion",
          controlType: "progress",
          valueBinding: { fieldName: "Number1" },
          range: { min: 0, max: 100 },
          style: { track: "neutral", fill: "brand" },
        },
      ],
      summaries: [
        {
          id: "supplier-count-summary",
          controlType: "summary",
          pivot: { AppID: "41", ListID: list.ListID, ListSetID: list.ListSetID, settings: { values: [{ fieldName: "ListDataID", id: "ListDataID", func: "COUNT" }] } },
          hiddenHost: { hiddenAllDevices: true, displayNone: true },
        },
      ],
      kpis: [
        { label: "New Intakes", visibleText: "12", requiresFormatting: true, formatNumber: true },
      ],
      pixelCompare: {
        pages: [
          { pageSlug: "supplier-intake-dashboard", designInput: "assets/generated-ui/supplier-onboarding-risk-review/01-supplier-intake-dashboard.design.png", runtimeScreenshot: "dist/runtime-evidence/supplier/supplier-intake-dashboard.png" },
        ],
      },
    },
  };
}

function page(order, pageTitle, pageSlug) {
  return {
    order,
    pageTitle,
    pageSlug,
    canonicalPng: `assets/generated-ui/supplier-onboarding-risk-review/${String(order).padStart(2, "0")}-${pageSlug}.design.png`,
    optionalSource: `assets/generated-ui/supplier-onboarding-risk-review/${String(order).padStart(2, "0")}-${pageSlug}.source.svg`,
    viewport: { width: 1859, height: 963 },
    onePage: true,
    includesChrome: true,
    layout: "application-layout-2-horizontal-nav",
  };
}

function analytics(title, controlType, list, field) {
  return {
    title,
    controlType,
    expectedType: controlType,
    data: { ...list, func: "COUNT" },
    field,
    aggregate: "COUNT",
  };
}

function inspectFixture(name, spec) {
  return inspectSupplierRuntimeDesignFidelity({ package: writeJson(name, spec) });
}

function expectPass(label, report) {
  assert.equal(report.status, "pass", `${label}: ${JSON.stringify(report.findings, null, 2)}`);
  cases.push(label);
}

function expectFail(label, report, code) {
  assert.equal(report.status, "fail", `${label}: expected fail`);
  assertHasCode(report, code);
  cases.push(label);
}

function assertHasCode(report, code) {
  assert.ok(report.findings.some((finding) => finding.code === code), `expected ${code}, got ${report.findings.map((finding) => finding.code).join(", ")}`);
}

function writeJson(name, value) {
  const file = path.join(tmp, name);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
}

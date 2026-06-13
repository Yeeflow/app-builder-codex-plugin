#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { inspectDashboardStyleShapes } from "./inspect-dashboard-style-shapes.mjs";
import { inspectDashboardSummaryControlContract } from "./inspect-dashboard-summary-control-contract.mjs";
import { inspectGridTableQuality } from "./inspect-grid-table-quality.mjs";
import { inspectRuntimeEvidence } from "./inspect-runtime-evidence.mjs";
import { inspectVisibleKpiRuntimeBindings } from "./inspect-visible-kpi-runtime-bindings.mjs";
import { inspectYapkUpgradeAppIdentity } from "./inspect-yapk-upgrade-app-identity.mjs";
import { inspectYeeflowUiDesignContract } from "./inspect-yeeflow-ui-design-contract.mjs";
import { decodeYapkTolerantBrotli } from "./decode-yapk-tolerant-brotli.mjs";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ui-summary-kpi-hard-gates-"));
const cases = [];

try {
  run();
  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

function run() {
  expectFail("UI implementation contract missing fails", inspectYeeflowUiDesignContract({ contract: path.join(tmp, "missing.md"), highQualityClaim: true }), "UI_CONTRACT_MISSING");
  const contract = write("contract.md", [
    "# UI Implementation Contract",
    "## Page: Event Portfolio",
    "Target page name: Event Portfolio",
    "Page purpose: Show event portfolio health.",
    "Design/mockup reference: generated dashboard mockup.",
    "Visual sections: header, KPI cards, filters, grid table, badges.",
    "Yeeflow control mapping: Summary, Heading, Text, Collection, Data Filter.",
    "Data/list bindings: Events list and Tasks list.",
    "KPI/Summary plan: hidden Summary controls save to temp variables.",
    "Filter/action plan: search, status filter, open detail action.",
    "Grid/table plan: Collection grid-table with columns.",
    "Status/badge plan: styled status text chips.",
    "Runtime evidence requirement: screenshot must prove visible values.",
    "Proof boundary: install/signing is not UI proof.",
  ].join("\n"));
  expectPass("Page-by-page contract passes", inspectYeeflowUiDesignContract({ contract, highQualityClaim: true, designRequested: true }));
  expectFail("Placeholder/scaffold UI text fails", inspectYeeflowUiDesignContract({ contract: write("placeholder.md", fs.readFileSync(contract, "utf8") + "\nHere is the title\n"), highQualityClaim: true }), "UI_CONTRACT_PLACEHOLDER_TEXT");

  expectPass("Export-proven card style shape passes", inspectDashboardStyleShapes({ package: writeJson("style-valid.json", decoded({ card: "export" })) }));
  expectFail("Weak unsupported style shape fails", inspectDashboardStyleShapes({ package: writeJson("style-weak.json", decoded({ card: "weak" })) }), "DASHBOARD_WEAK_UNSUPPORTED_STYLE_SHAPE");

  expectPass("Hidden Summary container hide/direction/display rule shape passes", inspectDashboardSummaryControlContract({ package: writeJson("summary-valid.json", decoded({ summary: "valid" })) }));
  expectFail("Summary with blank field fails", inspectDashboardSummaryControlContract({ package: writeJson("summary-blank-field.json", decoded({ summary: "blank-field" })) }), "SUMMARY_FIELD_BLANK");
  expectFail("Summary with missing field metadata fails", inspectDashboardSummaryControlContract({ package: writeJson("summary-missing-metadata.json", decoded({ summary: "missing-metadata" })) }), "SUMMARY_FIELD_METADATA_INCOMPLETE");
  expectFail("Count Summary without valid count/ListDataID shape fails", inspectDashboardSummaryControlContract({ package: writeJson("summary-bad-count.json", decoded({ summary: "bad-count" })) }), "SUMMARY_COUNT_FIELD_SHAPE_INVALID");
  expectFail("Sum Summary using non-numeric field fails", inspectDashboardSummaryControlContract({ package: writeJson("summary-bad-sum.json", decoded({ summary: "bad-sum" })) }), "SUMMARY_NUMERIC_FIELD_REQUIRED");
  expectFail("Missing Summary save_var expression object fails", inspectDashboardSummaryControlContract({ package: writeJson("summary-bad-save-var.json", decoded({ summary: "bad-save-var" })) }), "SUMMARY_SAVE_VAR_EXPRESSION_OBJECT_REQUIRED");
  expectFail("Missing page ReportIds for Summary fails", inspectDashboardSummaryControlContract({ package: writeJson("summary-missing-reportids.json", decoded({ summary: "missing-reportids" })) }), "SUMMARY_REPORTIDS_MISSING");

  expectFail("Visible KPI raw variable name fails", inspectVisibleKpiRuntimeBindings({ evidence: writeJson("kpi-raw-var.json", kpiEvidence({ text: "__temp_event_count" })) }), "KPI_VISIBLE_RAW_VARIABLE_NAME");
  expectFail("Visible KPI blank runtime evidence fails", inspectVisibleKpiRuntimeBindings({ evidence: writeJson("kpi-blank.json", kpiEvidence({ text: "" })) }), "KPI_VISIBLE_RUNTIME_BLANK");
  expectPass("Visible KPI fallback passes only when explicitly labeled fallback", inspectVisibleKpiRuntimeBindings({ evidence: writeJson("kpi-labeled-fallback.json", kpiEvidence({ text: "2 events", fallback: true, fallbackLabeled: true })) }));
  expectFail("Visible KPI fallback without label fails", inspectVisibleKpiRuntimeBindings({ evidence: writeJson("kpi-unlabeled-fallback.json", kpiEvidence({ text: "2 events", fallback: true })) }), "KPI_FALLBACK_UNLABELED");

  expectFail("Runtime-evidence missing prevents UI-quality claim", inspectRuntimeEvidence({ evidence: writeJson("runtime-missing.json", { installOrSigningOnly: true }), claimHighQualityUi: true }), "UI_QUALITY_RUNTIME_SCREENSHOT_MISSING");
  expectPass("Runtime evidence with visible KPI/cards/tables passes", inspectRuntimeEvidence({ evidence: writeJson("runtime-valid.json", runtimeEvidence()) , claimHighQualityUi: true }));
  expectFail("Hidden Summary visible in evidence fails", inspectRuntimeEvidence({ evidence: writeJson("runtime-hidden-visible.json", runtimeEvidence({ hiddenSummaryVisible: true })), claimHighQualityUi: true }), "RUNTIME_HIDDEN_SUMMARY_VISIBLE");

  expectFail("Grid-table planned but missing columns fails", inspectGridTableQuality({ package: writeJson("grid-missing-columns.json", decoded({ grid: "missing-columns" })), requireGridTable: true }), "GRID_TABLE_COLUMNS_MISSING");
  expectPass("Grid-table complete Collection passes", inspectGridTableQuality({ package: writeJson("grid-valid.json", decoded({ grid: "valid" })), requireGridTable: true }));

  const upgradePkg = writeJson("upgrade-valid.json", decoded({ listSetId: "1900000000000001001" }));
  expectFail("ListSetID drift in UI upgrade fails", inspectYapkUpgradeAppIdentity({ package: writeJson("upgrade-drift.json", decoded({ listSetId: "1900000000000002002" })), lineage: lineage({ installedListSetID: "1900000000000001001" }) }), "UPGRADE_LISTSETID_DRIFT");
  expectFail("Existing page mutated in test-page-only workflow fails", inspectYapkUpgradeAppIdentity({ package: upgradePkg, lineage: lineage({ outOfScopeResourceChanges: [{ semanticKey: "page:event-portfolio" }] }) }), "UPGRADE_OUT_OF_SCOPE_RESOURCE_MUTATION");
  expectFail("ReplaceIds final coverage remains enforced", inspectYapkUpgradeAppIdentity({ package: upgradePkg, lineage: lineage({ replaceIdsFinalCoverage: false }) }), "UPGRADE_REPLACEIDS_FINAL_COVERAGE_FAILED");
  expectPass("Upgrade ListSetID/app identity passes when lineage is stable", inspectYapkUpgradeAppIdentity({ package: upgradePkg, lineage: lineage() }));

  const decodedYapk = { ListSet: { ListID: "root" }, Pages: [], Childs: [] };
  const encodedResource = zlib.brotliCompressSync(Buffer.from(JSON.stringify(decodedYapk))).toString("base64").replace(/=+$/, "");
  const yapk = writeJson("synthetic-official.yapk", { Resource: encodedResource });
  const decodeReport = decodeYapkTolerantBrotli(yapk);
  assert.equal(decodeReport.status, "pass");
  assert.ok(!JSON.stringify(decodeReport).includes(encodedResource));
  cases.push("Tolerant official YAPK decode helper reports safe structural diagnostics only");

  const privateReport = inspectRuntimeEvidence({ evidence: writeJson("runtime-private-scan.json", runtimeEvidence({ screenshotPath: "/tmp/synthetic-redacted-screenshot.png" })), claimHighQualityUi: true });
  assert.equal(privateReport.status, "pass");
  assert.ok(!JSON.stringify(privateReport).includes("/tmp/synthetic-redacted-screenshot.png"));
  cases.push("No raw/private package data appears in reports");
}

function decoded(flags = {}) {
  const listSetId = flags.listSetId || "1900000000000001001";
  const card = flags.card === "weak" ? weakCard() : exportCard();
  const summaryHost = flags.summary ? hiddenSummaryHost(summaryControl(flags.summary)) : null;
  const gridControl = flags.grid ? grid(flags.grid) : null;
  return {
    ListSet: { ListID: listSetId, Title: "Marketing Event Management" },
    Pages: [{
      Title: "Event Portfolio",
      Type: 103,
      LayoutID: "dashboard-event-portfolio",
      ReportIds: flags.summary === "missing-reportids" ? [] : ["summary-planned-events"],
      LayoutInResources: [{ Resource: JSON.stringify({ type: "page", children: [card, summaryHost, gridControl].filter(Boolean) }) }],
    }],
    Childs: [{
      List: { ListID: "events", Title: "Events" },
      Fields: [
        field("ListDataID", "Text", "Record ID"),
        field("Title", "Text", "Event Name"),
        field("Decimal1", "Decimal", "Budget"),
        field("Text1", "Text", "Status"),
      ],
    }],
  };
}

function field(FieldName, FieldType, DisplayName) {
  return { FieldName, FieldType, Type: FieldType.toLowerCase(), DisplayName, FieldID: `${FieldName}-id` };
}

function hiddenSummaryHost(summary) {
  return {
    id: "hidden-summary-host",
    type: "container",
    attrs: { common: { hide: [null, true, true, true] }, style: { direction: [null, "row"] }, display: { rule: "1 == 0" } },
    children: [summary],
  };
}

function summaryControl(mode) {
  const fieldMeta = mode === "blank-field" ? "" : mode === "bad-sum" ? field("Text1", "Text", "Status") : mode === "bad-count" ? field("Title", "Text", "Event Name") : field("ListDataID", "Text", "Record ID");
  const func = mode === "bad-sum" ? "sum" : "count";
  const metadata = mode === "missing-metadata" ? null : fieldMeta;
  return {
    id: "summary-planned-events",
    type: "summary",
    attrs: {
      data: { app: { ListID: "1900000000000001001" }, list: { ListID: "events" }, field: fieldMeta, func },
      field: metadata,
      fieldObject: metadata,
      fieldInfo: metadata,
      allowAllRecords: true,
      save_var: mode === "bad-save-var" ? "__temp_event_count" : { exprType: "variable", valueType: "string", id: "__temp___temp_event_count", type: "expr", name: "__temp_event_count" },
    },
  };
}

function exportCard() {
  return {
    type: "container",
    attrs: {
      role: "kpi-card",
      common: {
        background: { normal: { classic: { color: "#ffffff" } } },
        border: { normal: { type: "solid", width: 1, color: "#e5e7eb", radius: 8 } },
        padding: { top: 16, right: 16, bottom: 16, left: 16 },
      },
    },
    children: [{ type: "heading", attrs: { headc: { title: { value: "Planned Events" } } } }],
  };
}

function weakCard() {
  return { type: "container", attrs: { role: "kpi-card", style: { border: "1px solid #ddd", radius: 8, background: "#fff" } }, children: [] };
}

function grid(mode) {
  return {
    type: "collection",
    attrs: {
      role: "grid-table",
      layoutIntent: "grid-table",
      columns: mode === "missing-columns" ? [] : [{ title: "Event" }, { title: "Owner" }, { title: "Status" }],
      emptyState: { title: "No events match these filters" },
      data: { list: { ListID: "events" }, link: "event-detail" },
      rowActionPlanned: true,
    },
    children: [{ type: "flex_grid", children: [{ type: "text", attrs: { text: "Event name" } }] }],
  };
}

function kpiEvidence({ text, fallback = false, fallbackLabeled = false } = {}) {
  return {
    dynamicVisibleKpiRuntimeProven: false,
    hiddenSummaryVisible: false,
    kpis: [{ label: "Planned Events", renderedText: text, fallback, fallbackLabeled }],
  };
}

function runtimeEvidence(overrides = {}) {
  return {
    runtimeScreenshotCaptured: true,
    kpiValuesVisible: true,
    hiddenSummaryVisible: false,
    dashboardCardsCardLike: true,
    filtersActionsVisible: true,
    tablesGridsNonScaffold: true,
    badgesDistinct: true,
    pageLooksPlainScaffold: false,
    ...overrides,
  };
}

function lineage(overrides = {}) {
  return writeJson(`lineage-${cases.length}-${Object.keys(overrides).join("-") || "valid"}.json`, {
    installedListSetID: "1900000000000001001",
    requestedOperation: "update",
    packageClassification: "upgrade",
    packageLineageId: "lineage-synthetic",
    existingAppIdentityStable: true,
    existingResourceIdChanges: [],
    outOfScopeResourceChanges: [],
    replaceIdsRebuiltFromFinalPackage: true,
    replaceIdsFinalCoverage: true,
    ...overrides,
  });
}

function expectPass(label, report) {
  assert.equal(report.status, "pass", `${label}: ${JSON.stringify(report.findings, null, 2)}`);
  cases.push(label);
}

function expectFail(label, report, code) {
  assert.equal(report.status, "fail", `${label}: expected fail`);
  assert.ok(report.findings.some((finding) => finding.code === code), `${label}: expected ${code}, got ${report.findings.map((finding) => finding.code).join(", ")}`);
  cases.push(label);
}

function write(name, content) {
  const file = path.join(tmp, name);
  fs.writeFileSync(file, content);
  return file;
}

function writeJson(name, value) {
  return write(name, `${JSON.stringify(value, null, 2)}\n`);
}

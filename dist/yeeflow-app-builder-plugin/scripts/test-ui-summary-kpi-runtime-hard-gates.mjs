#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { inspectDashboardStyleShapes } from "./inspect-dashboard-style-shapes.mjs";
import { inspectDashboardSummaryControlContract } from "./inspect-dashboard-summary-control-contract.mjs";
import { inspectDataAnalyticsControlIdentity } from "./inspect-data-analytics-control-identity.mjs";
import { inspectGridTableQuality } from "./inspect-grid-table-quality.mjs";
import { inspectRuntimeEvidence } from "./inspect-runtime-evidence.mjs";
import { inspectVisibleKpiRuntimeBindings } from "./inspect-visible-kpi-runtime-bindings.mjs";
import { inspectYapkUpgradeAppIdentity } from "./inspect-yapk-upgrade-app-identity.mjs";
import { inspectYeeflowUiDesignContract } from "./inspect-yeeflow-ui-design-contract.mjs";
import { decodeYapkTolerantBrotli } from "./decode-yapk-tolerant-brotli.mjs";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ui-summary-kpi-hard-gates-"));
const cases = [];
const UUID_SUMMARY_ID = "43c38762-5133-430f-af09-faeec1be3bc0";
const scalar = (value) => value === undefined || value === null ? "" : String(value);

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
  expectPass("Exact UUID Summary shape with Resource.exts ReportIds tempVars and visible binding passes", inspectDashboardSummaryControlContract({ package: writeJson("summary-uuid-proof-valid.json", decoded({ summary: "uuid-proof-valid" })) }));
  expectFail("Summary with blank field fails", inspectDashboardSummaryControlContract({ package: writeJson("summary-blank-field.json", decoded({ summary: "blank-field" })) }), "SUMMARY_FIELD_BLANK");
  expectFail("Summary with missing field metadata fails", inspectDashboardSummaryControlContract({ package: writeJson("summary-missing-metadata.json", decoded({ summary: "missing-metadata" })) }), "SUMMARY_FIELD_METADATA_INCOMPLETE");
  expectFail("Count Summary without valid count/ListDataID shape fails", inspectDashboardSummaryControlContract({ package: writeJson("summary-bad-count.json", decoded({ summary: "bad-count" })) }), "SUMMARY_COUNT_FIELD_SHAPE_INVALID");
  expectFail("Sum Summary using non-numeric field fails", inspectDashboardSummaryControlContract({ package: writeJson("summary-bad-sum.json", decoded({ summary: "bad-sum" })) }), "SUMMARY_NUMERIC_FIELD_REQUIRED");
  expectFail("Missing Summary save_var expression object fails", inspectDashboardSummaryControlContract({ package: writeJson("summary-bad-save-var.json", decoded({ summary: "bad-save-var" })) }), "SUMMARY_SAVE_VAR_EXPRESSION_OBJECT_REQUIRED");
  expectFail("Missing page ReportIds for Summary fails", inspectDashboardSummaryControlContract({ package: writeJson("summary-missing-reportids.json", decoded({ summary: "missing-reportids" })) }), "SUMMARY_REPORTIDS_MISSING");
  expectFail("UUID Summary proof missing Resource.exts match fails", inspectDashboardSummaryControlContract({ package: writeJson("summary-uuid-proof-no-exts.json", decoded({ summary: "uuid-proof-no-exts" })) }), "SUMMARY_UUID_PROOF_EXTS_MISSING");
  expectFail("UUID Summary proof missing Resource.ReportIds match fails", inspectDashboardSummaryControlContract({ package: writeJson("summary-uuid-proof-missing-reportids.json", decoded({ summary: "uuid-proof-missing-reportids" })) }), "SUMMARY_REPORTIDS_MISSING");
  expectFail("UUID Summary proof missing Resource.tempVars match fails", inspectDashboardSummaryControlContract({ package: writeJson("summary-uuid-proof-no-tempvars.json", decoded({ summary: "uuid-proof-no-tempvars" })) }), "SUMMARY_UUID_PROOF_TEMPVAR_MISSING");
  expectFail("UUID Summary proof missing attrs.headc.title.variable binding fails", inspectDashboardSummaryControlContract({ package: writeJson("summary-uuid-proof-no-visible-binding.json", decoded({ summary: "uuid-proof-no-visible-binding" })) }), "SUMMARY_UUID_PROOF_VISIBLE_BINDING_MISSING");
  expectPass("Data Analytics Summary with UUID ID, tempVar, count ListDataID, and matching exts ReportIds passes", inspectDataAnalyticsControlIdentity({ package: writeJson("analytics-summary-valid.json", analyticsDecoded({ type: "summary", id: UUID_SUMMARY_ID, extKey: "summary", reportIds: [UUID_SUMMARY_ID] })) }));
  expectPass("Data Analytics Summary with Resource.ReportIds registration passes", inspectDataAnalyticsControlIdentity({ package: writeJson("analytics-summary-resource-reportids.json", analyticsDecoded({ type: "summary", id: UUID_SUMMARY_ID, extKey: "summary", resourceReportIds: [UUID_SUMMARY_ID] })) }));
  expectFail("Data Analytics Summary with missing real source field metadata fails", inspectDataAnalyticsControlIdentity({ package: writeJson("analytics-summary-missing-source-field.json", analyticsDecoded({ type: "summary", id: UUID_SUMMARY_ID, extKey: "summary", reportIds: [UUID_SUMMARY_ID], dataFieldName: "MissingField" })) }), "ANALYTICS_FIELD_REFERENCE_INVALID");
  expectFail("Data Analytics Summary with missing temp variable declaration fails", inspectDataAnalyticsControlIdentity({ package: writeJson("analytics-summary-missing-tempvar.json", analyticsDecoded({ type: "summary", id: UUID_SUMMARY_ID, extKey: "summary", reportIds: [UUID_SUMMARY_ID], omitTempVars: true })) }), "ANALYTICS_SUMMARY_TEMP_VAR_MISSING");
  expectFail("Data Analytics Summary with missing exts entry fails", inspectDataAnalyticsControlIdentity({ package: writeJson("analytics-summary-missing-exts.json", analyticsDecoded({ type: "summary", id: UUID_SUMMARY_ID, reportIds: [UUID_SUMMARY_ID] })) }), "ANALYTICS_EXTS_REGISTRATION_MISSING");
  expectFail("Data Analytics Summary with missing ReportIds entry fails", inspectDataAnalyticsControlIdentity({ package: writeJson("analytics-summary-missing-reportids.json", analyticsDecoded({ type: "summary", id: UUID_SUMMARY_ID, extKey: "summary" })) }), "ANALYTICS_REPORTIDS_REGISTRATION_MISSING");
  expectFail("Data Analytics Summary placeholder field still fails", inspectDataAnalyticsControlIdentity({ package: writeJson("analytics-summary-placeholder-field.json", analyticsDecoded({ type: "summary", id: UUID_SUMMARY_ID, extKey: "summary", reportIds: [UUID_SUMMARY_ID], dataFieldName: "placeholder_field" })) }), "ANALYTICS_PLACEHOLDER_FIELD_REFERENCE");
  expectFail("Non-Summary analytics invalid field still fails", inspectDataAnalyticsControlIdentity({ package: writeJson("analytics-pie-invalid-field.json", analyticsDecoded({ type: "pie-chart", id: "11111111-1111-4111-8111-111111111111", dataFieldName: "MissingField" })) }), "ANALYTICS_FIELD_REFERENCE_INVALID");
  expectFail("Data Analytics Summary with non-UUID ID fails unless export-proven", inspectDataAnalyticsControlIdentity({ package: writeJson("analytics-summary-non-uuid.json", analyticsDecoded({ type: "summary", id: "summary-total" })) }), "ANALYTICS_CONTROL_ID_NOT_RUNTIME_SAFE");
  for (const [label, type] of [
    ["Pie chart", "pie-chart"],
    ["Column chart", "column-chart"],
    ["Line chart", "line-chart"],
    ["Gauge", "gauge"],
    ["Funnel chart", "funnel-chart"],
    ["Color block heatmap", "color-block-heatmap"],
    ["Pivot table", "pivot-table"],
  ]) {
    expectFail(`${label} generated with non-runtime-safe ID fails or is marked unproven`, inspectDataAnalyticsControlIdentity({ package: writeJson(`analytics-${type}-non-uuid.json`, analyticsDecoded({ type, id: `${type}-semantic-id` })) }), "ANALYTICS_CONTROL_ID_NOT_RUNTIME_SAFE");
  }
  expectFail("Runtime proof cannot be claimed for analytics control without runtime evidence", inspectDataAnalyticsControlIdentity({ package: writeJson("analytics-runtime-proof-missing.json", analyticsDecoded({ type: "pie-chart", id: "11111111-1111-4111-8111-111111111111", runtimeProofClaimed: true })) }), "ANALYTICS_RUNTIME_PROOF_EVIDENCE_MISSING");
  expectFail("Upgrade workflow preserves existing analytics control IDs", inspectDataAnalyticsControlIdentity({ package: writeJson("analytics-upgrade-drift.json", analyticsDecoded({ type: "pie-chart", id: "22222222-2222-4222-8222-222222222222", semanticKey: "analytics:campaign-pie" })), lineage: writeJson("analytics-lineage-drift.json", { requestedOperation: "update", previousAnalyticsControlIds: { "analytics:campaign-pie": "11111111-1111-4111-8111-111111111111" } }) }), "ANALYTICS_UPGRADE_CONTROL_ID_DRIFT");

  expectFail("Visible KPI raw variable name fails", inspectVisibleKpiRuntimeBindings({ evidence: writeJson("kpi-raw-var.json", kpiEvidence({ text: "__temp_event_count" })) }), "KPI_VISIBLE_RAW_VARIABLE_NAME");
  expectFail("Visible KPI blank runtime evidence fails", inspectVisibleKpiRuntimeBindings({ evidence: writeJson("kpi-blank.json", kpiEvidence({ text: "" })) }), "KPI_VISIBLE_RUNTIME_BLANK");
  expectPass("Visible KPI fallback passes only when explicitly labeled fallback", inspectVisibleKpiRuntimeBindings({ evidence: writeJson("kpi-labeled-fallback.json", kpiEvidence({ text: "2 events", fallback: true, fallbackLabeled: true })) }));
  expectFail("Visible KPI fallback without label fails", inspectVisibleKpiRuntimeBindings({ evidence: writeJson("kpi-unlabeled-fallback.json", kpiEvidence({ text: "2 events", fallback: true })) }), "KPI_FALLBACK_UNLABELED");
  expectPass("Exact UUID Summary shape with before/after mutation evidence passes as dynamic-proven", inspectVisibleKpiRuntimeBindings({ evidence: writeJson("kpi-uuid-dynamic-proven.json", dynamicKpiEvidence()) }));
  expectFail("Exact UUID Summary shape without after-mutation evidence does not get proven verdict", inspectVisibleKpiRuntimeBindings({ evidence: writeJson("kpi-uuid-no-after.json", dynamicKpiEvidence({ mutationProof: { beforeValues: { totalRecords: 3 }, sourceDataMutated: true, refreshedRecalculatedRuntimeEvidenceCaptured: true } })) }), "KPI_DYNAMIC_PROOF_MUTATION_VALUE_INCOMPLETE");
  expectFail("Non-UUID Summary IDs remain unproven", inspectVisibleKpiRuntimeBindings({ evidence: writeJson("kpi-semantic-summary-id.json", dynamicKpiEvidence({ summaryControlIds: ["summary-total-records"] })) }), "KPI_DYNAMIC_PROOF_SUMMARY_ID_NOT_UUID");
  expectFail("Visible KPI binding not using attrs.headc.title.variable remains unproven", inspectVisibleKpiRuntimeBindings({ evidence: writeJson("kpi-unproven-visible-binding.json", dynamicKpiEvidence({ visibleBindingShape: "attrs.text" })) }), "KPI_DYNAMIC_PROOF_VISIBLE_BINDING_SHAPE_UNPROVEN");
  expectFail("Static fallback values cannot be claimed dynamic-proven", inspectVisibleKpiRuntimeBindings({ evidence: writeJson("kpi-dynamic-fallback.json", dynamicKpiEvidence({ kpis: [{ label: "Total records", renderedText: "Fallback: 4", fallback: true, fallbackLabeled: true, runtimeProven: true }] })) }), "KPI_DYNAMIC_PROOF_USES_FALLBACK");
  expectFail("Stale after-evidence where values do not change remains not proven", inspectVisibleKpiRuntimeBindings({ evidence: writeJson("kpi-stale-after.json", dynamicKpiEvidence({ mutationProof: { beforeValues: { totalRecords: 3, amountSum: 600, openCount: 2, apacAmount: 300 }, afterValues: { totalRecords: 3, amountSum: 600, openCount: 2, apacAmount: 300 }, expectedAfterValues: { totalRecords: 4, amountSum: 1000, openCount: 3, apacAmount: 700 }, sourceDataMutated: true, refreshedRecalculatedRuntimeEvidenceCaptured: true, asyncRecalculationNote: "Synthetic note: stale after-evidence must be replaced after recalculation." } })) }), "KPI_DYNAMIC_PROOF_EXPECTED_VALUE_MISMATCH");

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
  const summary = flags.summary ? summaryControl(flags.summary) : null;
  const summaryHost = flags.summary ? hiddenSummaryHost(summary) : null;
  const gridControl = flags.grid ? grid(flags.grid) : null;
  const uuidProof = scalar(flags.summary).startsWith("uuid-proof");
  const root = { type: "page", children: [card, summaryHost, uuidProofVisibleKpi(flags.summary), gridControl].filter(Boolean) };
  if (uuidProof) {
    root.kpiRuntimeProofShape = "uuid-summary-v1.0.1";
    if (flags.summary !== "uuid-proof-no-exts") root.exts = [{ i: UUID_SUMMARY_ID, category: "___Pivot___", key: "summary" }];
    if (flags.summary !== "uuid-proof-no-tempvars") root.tempVars = [{ id: "__temp___temp_total_records", name: "__temp_total_records" }];
  }
  const summaryId = summary ? scalar(summary.id || summary.ID) : "summary-planned-events";
  return {
    kpiRuntimeProofShape: uuidProof ? "uuid-summary-v1.0.1" : undefined,
    ListSet: { ListID: listSetId, Title: "Marketing Event Management" },
    Pages: [{
      Title: "Event Portfolio",
      Type: 103,
      LayoutID: "dashboard-event-portfolio",
      ReportIds: flags.summary === "missing-reportids" || flags.summary === "uuid-proof-missing-reportids" ? [] : [summaryId],
      LayoutInResources: [{ Resource: JSON.stringify(root) }],
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
  const id = scalar(mode).startsWith("uuid-proof") && mode !== "uuid-proof-non-uuid" ? UUID_SUMMARY_ID : "summary-planned-events";
  const saveVar = scalar(mode).startsWith("uuid-proof")
    ? { exprType: "variable", valueType: "string", id: "__temp___temp_total_records", type: "expr", name: "__temp_total_records" }
    : { exprType: "variable", valueType: "string", id: "__temp___temp_event_count", type: "expr", name: "__temp_event_count" };
  return {
    id,
    type: "summary",
    attrs: {
      kpiRuntimeProofShape: scalar(mode).startsWith("uuid-proof") ? "uuid-summary-v1.0.1" : undefined,
      data: { app: { ListID: "1900000000000001001" }, list: { ListID: "events" }, field: fieldMeta, func },
      field: metadata,
      fieldObject: metadata,
      fieldInfo: metadata,
      allowAllRecords: true,
      save_var: mode === "bad-save-var" ? "__temp_event_count" : saveVar,
    },
  };
}

function uuidProofVisibleKpi(mode) {
  if (!scalar(mode).startsWith("uuid-proof")) return null;
  if (mode === "uuid-proof-no-visible-binding") {
    return { type: "heading", attrs: { headc: { title: { value: "4" } } } };
  }
  return {
    type: "heading",
    attrs: {
      headc: {
        title: {
          variable: [{ id: "__temp___temp_total_records", name: "__temp_total_records" }],
        },
      },
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

function dynamicKpiEvidence(overrides = {}) {
  return {
    dynamicVisibleKpiRuntimeProven: true,
    dynamicBindingShape: "uuid-summary-v1.0.1",
    visibleBindingShape: "attrs.headc.title.variable[]",
    summaryControlIds: [UUID_SUMMARY_ID],
    hiddenSummaryVisible: false,
    kpis: [
      { label: "Total records", renderedText: "4", dynamicBindingClaimed: true, runtimeProven: true },
      { label: "Amount sum", renderedText: "1000", dynamicBindingClaimed: true, runtimeProven: true },
      { label: "Open count", renderedText: "3", dynamicBindingClaimed: true, runtimeProven: true },
      { label: "APAC amount", renderedText: "700", dynamicBindingClaimed: true, runtimeProven: true },
    ],
    mutationProof: {
      beforeValues: { totalRecords: 3, amountSum: 600, openCount: 2, apacAmount: 300 },
      afterValues: { totalRecords: 4, amountSum: 1000, openCount: 3, apacAmount: 700 },
      expectedAfterValues: { totalRecords: 4, amountSum: 1000, openCount: 3, apacAmount: 700 },
      sourceDataMutated: true,
      mutationSummary: "Synthetic Delta record added: Status Open, Amount 400, Region APAC.",
      refreshedRecalculatedRuntimeEvidenceCaptured: true,
      asyncRecalculationNote: "Summary recalculation can be asynchronous or cache-delayed; final evidence was captured after refresh/recalculation.",
    },
    ...overrides,
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

function analyticsDecoded({ type, id, extKey, reportIds = [], resourceReportIds = [], runtimeProofClaimed = false, semanticKey = "analytics:synthetic", dataFieldName = "ListDataID", omitTempVars = false } = {}) {
  const dataField = field(dataFieldName, dataFieldName === "Decimal1" ? "Decimal" : "Text", dataFieldName === "Decimal1" ? "Amount" : "Record ID");
  const saveVar = { exprType: "variable", valueType: "string", id: "__temp___temp_analytics_summary", type: "expr", name: "__temp_analytics_summary" };
  const control = {
    id,
    type,
    attrs: {
      semanticKey,
      runtimeProofClaimed,
      data: { list: { ListID: "events" }, field: dataField, func: "COUNT" },
      field: dataField,
      fieldObject: field("ListDataID", "Text", "Record ID"),
      fieldInfo: field("ListDataID", "Text", "Record ID"),
      settings: { values: [{ fieldName: "ListDataID", id: "ListDataID", func: "COUNT" }] },
      ...(type === "summary" ? { save_var: saveVar } : {}),
    },
  };
  const root = {
    type: "page",
    ReportIds: resourceReportIds,
    tempVars: omitTempVars ? [] : [{ id: "__temp___temp_analytics_summary", name: "__temp_analytics_summary" }],
    children: [control],
  };
  if (extKey) root.exts = [{ i: id, category: "___Pivot___", key: extKey }];
  if (type === "pivot-table" && /^[0-9a-f-]{36}$/i.test(id)) {
    root.exts = [{ i: id, category: "___Pivot___", key: "PivotTable" }];
    reportIds = [id];
  }
  return {
    ListSet: { ListID: "1900000000000001001", Title: "Analytics Identity Proof" },
    Pages: [{ Title: "Analytics Dashboard", Type: 103, LayoutID: "dashboard-analytics", ReportIds: reportIds, LayoutInResources: [{ Resource: JSON.stringify(root) }] }],
    Childs: [{
      List: { ListID: "events", Title: "Events" },
      Fields: [field("ListDataID", "Text", "Record ID"), field("Decimal1", "Decimal", "Amount")],
    }],
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

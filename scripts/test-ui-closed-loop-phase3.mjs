#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { compareDesignToRuntimeStructure } from "./compare-design-to-runtime-structure.mjs";
import { inspectDashboardSummaryControlContract } from "./inspect-dashboard-summary-control-contract.mjs";
import { inspectGridTableQuality } from "./inspect-grid-table-quality.mjs";
import { inspectRuntimeEvidence } from "./inspect-runtime-evidence.mjs";
import { inspectVisibleKpiRuntimeBindings } from "./inspect-visible-kpi-runtime-bindings.mjs";
import { inspectYeeflowUiDesignContract } from "./inspect-yeeflow-ui-design-contract.mjs";
import { validateUiUpgradeScope } from "./validate-ui-upgrade-scope.mjs";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ui-closed-loop-phase3-"));
const cases = [];
const LIST_SET_ID = "1900000000000001001";
const APP_ID = "1900000000000002002";
const SUMMARY_ID = "43c38762-5133-430f-af09-faeec1be3bc0";

try {
  run();
  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

function run() {
  testDesignContractRequired();
  testRuntimeEvidenceRequired();
  testScopeGatePreventsBroadMutation();
  testSummaryLayoutResourceReportIdsShapePasses();
  testTopLevelReportIdsOptionalOnly();
  testAnalyticsSummaryTempVariableFalsePositiveStaysFixed();
  testGridTableDetailLinkIssuesCaught();
  testInstallSuccessCannotFakeRuntimeEvidence();
  testDesignRuntimeMissingTableSection();
  testPlainScaffoldCaught();
  testWarningStrictBehavior();
  testDynamicKpiProofBoundary();
}

function testDesignContractRequired() {
  const report = inspectYeeflowUiDesignContract({
    contract: path.join(tmp, "missing-contract.md"),
    highQualityClaim: true,
    designRequested: true,
  });
  expectFail("Design/mockup request without UI contract fails hard-gate expectation", report, "UI_CONTRACT_MISSING");
}

function testRuntimeEvidenceRequired() {
  const report = inspectRuntimeEvidence({
    evidence: writeJson("install-success-only-evidence.json", {
      upgradeApplyStatus: "success",
      installOrSigningOnly: true,
      runtimeScreenshotCaptured: false,
    }),
    claimHighQualityUi: true,
  });
  expectFail("Package/install success metadata without runtime evidence cannot support high-quality UI claim", report, "INSTALL_SIGNING_NOT_UI_PROOF");
  assertHasCode(report, "UI_QUALITY_RUNTIME_SCREENSHOT_MISSING");
}

function testScopeGatePreventsBroadMutation() {
  const previousPackage = writeJson("scope-previous.json", scopePackage());
  const newPackage = writeJson("scope-new-broad-mutation.json", scopePackage({
    budgetReviewTitle: "Budget Review Changed",
    navigationExtra: true,
  }));
  const scope = writeJson("scope-event-portfolio-only.json", {
    changeScope: "single-page-ui-upgrade",
    allowedPages: ["Event Portfolio"],
    allowedPageLayoutIds: ["layout-event-portfolio"],
    allowedResources: ["layout-event-portfolio"],
    allowedLists: [],
    allowedForms: [],
    allowedNavigationChanges: false,
    forbiddenChanges: [],
    expectedListSetID: LIST_SET_ID,
  });
  const report = validateUiUpgradeScope({ previousPackage, newPackage, scope });
  expectFail("Single-page scope manifest blocks Budget Review and navigation drift", report, "UI_SCOPE_UNRELATED_PAGE_RESOURCE_CHANGE");
  assertHasCode(report, "UI_SCOPE_NAVIGATION_DRIFT_OUTSIDE_SCOPE");
}

function testSummaryLayoutResourceReportIdsShapePasses() {
  const report = inspectDashboardSummaryControlContract({
    package: writeJson("summary-layout-resource-valid.json", summaryPackage({ includeTopLevelReportIds: false })),
  });
  expectPass("Summary layout-resource ReportIds/exts/tempVars shape passes with zero top-level Pages[].ReportIds", report);
}

function testTopLevelReportIdsOptionalOnly() {
  const valid = inspectDashboardSummaryControlContract({
    package: writeJson("summary-no-top-level-reportids.json", summaryPackage({ includeTopLevelReportIds: false })),
  });
  expectPass("Layout-resource registration passes without top-level Pages[].ReportIds", valid);

  const invalid = inspectDashboardSummaryControlContract({
    package: writeJson("summary-top-level-only-reportids.json", summaryPackage({ includeTopLevelReportIds: true, omitLayoutReportIds: true })),
  });
  expectFail("Top-level Pages[].ReportIds without layout-resource registration fails", invalid, "SUMMARY_REPORTIDS_MISSING");
}

function testAnalyticsSummaryTempVariableFalsePositiveStaysFixed() {
  const report = inspectDashboardSummaryControlContract({
    package: writeJson("summary-save-var-name-not-field.json", summaryPackage({
      saveVarName: "__temp_marketing_event_total",
      summaryFunc: "count",
      fieldName: "ListDataID",
    })),
  });
  expectPass("Summary save_var.name is not treated as a source-list field and COUNT ListDataID is accepted", report);
}

function testGridTableDetailLinkIssuesCaught() {
  expectFail(
    "Grid table missing planned row detail link metadata fails",
    inspectGridTableQuality({ package: writeJson("grid-missing-row-link.json", gridPackage({ rowActionLink: false })), requireGridTable: true }),
    "GRID_TABLE_ROW_ACTION_LINK_MISSING",
  );
  expectFail(
    "Grid table with empty Collection item template fails",
    inspectGridTableQuality({ package: writeJson("grid-empty-item-template.json", gridPackage({ emptyItemTemplate: true })), requireGridTable: true }),
    "GRID_TABLE_ITEM_TEMPLATE_EMPTY",
  );
  expectFail(
    "Grid table with expected columns missing fails",
    inspectGridTableQuality({ package: writeJson("grid-missing-columns.json", gridPackage({ columns: [] })), requireGridTable: true }),
    "GRID_TABLE_COLUMNS_MISSING",
  );
}

function testInstallSuccessCannotFakeRuntimeEvidence() {
  const contract = writeJson("install-success-contract.json", marketingContract());
  const evidence = writeJson("install-success-not-runtime-evidence.json", {
    upgradeApplyStatus: "success",
    installOrSigningOnly: true,
  });
  const report = compareDesignToRuntimeStructure({ contract, runtimeEvidence: evidence });
  assert.notEqual(report.status, "pass");
  assertHasCode(report, "RUNTIME_EVIDENCE_WEAK");
  cases.push("Runtime evidence cannot be faked as upgradeApplyStatus success");
}

function testDesignRuntimeMissingTableSection() {
  const contract = writeJson("marketing-contract.json", marketingContract());
  const evidence = writeJson("marketing-evidence-missing-budget-table.json", marketingRuntimeEvidence({
    sections: ["Executive Summary", "Filter Bar", "Registration table", "Status Coverage"],
    tables: [{ name: "Registration table", headers: ["Registrant", "Status"], rows: [["Ada", "Confirmed"]] }],
  }));
  const report = compareDesignToRuntimeStructure({ contract, runtimeEvidence: evidence });
  expectFail("Marketing Event-inspired structure comparison catches missing Budget table section", report, "TABLE_SECTION_MISSING");
}

function testPlainScaffoldCaught() {
  const contract = writeJson("plain-scaffold-contract.json", marketingContract());
  const evidence = writeJson("plain-scaffold-evidence.json", marketingRuntimeEvidence({
    pageLooksPlainScaffold: true,
    placeholderFillerTextScan: { found: true, matches: ["sample dashboard", "placeholder"] },
    cardLikeSectionSignals: [],
    visibleText: ["Sample Dashboard", "Click Button", "placeholder"],
  }));
  const report = compareDesignToRuntimeStructure({ contract, runtimeEvidence: evidence });
  expectFail("Structure comparison catches plain scaffold and placeholder text", report, "PAGE_LOOKS_LIKE_PLAIN_SCAFFOLD");
  assertHasCode(report, "PLACEHOLDER_TEXT_VISIBLE");
}

function testWarningStrictBehavior() {
  const contract = writeJson("strict-warning-contract.json", marketingContract());
  const evidence = writeJson("strict-warning-evidence.json", marketingRuntimeEvidence());
  const script = path.join(process.cwd(), "scripts", "compare-design-to-runtime-structure.mjs");
  const warning = spawnSync(process.execPath, [script, "--contract", contract, "--runtime-evidence", evidence, "--design-image", "/tmp/synthetic-marketing-event.png"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(warning.status, 0);
  const warningReport = JSON.parse(warning.stdout);
  assert.equal(warningReport.status, "warning");
  assertHasCode(warningReport, "DESIGN_IMAGE_PARSE_REVIEW_REQUIRED");

  const strict = spawnSync(process.execPath, [script, "--contract", contract, "--runtime-evidence", evidence, "--design-image", "/tmp/synthetic-marketing-event.png", "--strict"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.notEqual(strict.status, 0);
  cases.push("Structure comparison warning exits 0 and --strict makes warning nonzero");
}

function testDynamicKpiProofBoundary() {
  const contract = writeJson("dynamic-kpi-contract.json", marketingContract());
  const evidence = writeJson("dynamic-kpi-structure-only.json", marketingRuntimeEvidence({
    dynamicVisibleKpiRuntimeProven: false,
    dynamicVisibleKpiRuntimeClaimed: true,
  }));
  const structureReport = compareDesignToRuntimeStructure({ contract, runtimeEvidence: evidence });
  assert.equal(structureReport.status, "warning");
  assertHasCode(structureReport, "DYNAMIC_KPI_PROOF_NOT_ESTABLISHED");

  const kpiReport = inspectVisibleKpiRuntimeBindings({
    evidence: writeJson("dynamic-kpi-no-mutation.json", {
      dynamicVisibleKpiRuntimeProven: true,
      dynamicBindingShape: "uuid-summary-v1.0.1",
      visibleBindingShape: "attrs.headc.title.variable[]",
      summaryControlIds: [SUMMARY_ID],
      hiddenSummaryVisible: false,
      kpis: [{ label: "Registrations", renderedText: "42", dynamicBindingClaimed: true, runtimeProven: true }],
      mutationProof: {
        beforeValues: { registrations: 41 },
        sourceDataMutated: true,
        refreshedRecalculatedRuntimeEvidenceCaptured: true,
      },
    }),
  });
  expectFail("Dynamic KPI proof remains separate and requires before/after mutation evidence", kpiReport, "KPI_DYNAMIC_PROOF_MUTATION_VALUE_INCOMPLETE");
}

function marketingContract() {
  return {
    schema: "yeeflow-ui-implementation-contract/v1",
    designMockupReference: "synthetic-marketing-event-dashboard.png",
    targetPageName: "Event Portfolio",
    pagePurpose: "Manage Marketing Event registration, budget, and status review.",
    visualSections: ["Executive Summary", "Filter Bar", "Registration table", "Budget table", "Status Coverage"],
    yeeflowControlMapping: ["Summary KPI cards", "Data Filter", "Collection grid tables", "status badge text"],
    dataListBindings: ["Events", "Registrations", "Budgets"],
    kpiSummaryPlan: [{ label: "Registrations" }, { label: "Budget Used" }],
    expectedKpiCount: 2,
    filterActionPlan: {
      filters: ["Campaign Filter", "Status Filter"],
      actions: ["Export Brief", "Open Event"],
    },
    gridTablePlan: [
      { section: "Registration table", headers: ["Registrant", "Status"], emptyState: "No registrations yet" },
      { section: "Budget table", headers: ["Budget", "Forecast", "Variance"], emptyState: "No budget lines yet" },
    ],
    statusBadgePlan: ["Confirmed", "Pending", "Over Budget"],
    runtimeEvidenceRequirement: "Redacted runtime evidence with visible sections, KPIs, filters, tables, and badges.",
    proofBoundary: "Structural comparison is not dynamic KPI proof.",
  };
}

function marketingRuntimeEvidence(overrides = {}) {
  return {
    schema: "yeeflow-redacted-runtime-ui-evidence/v1",
    captureMetadata: { tool: "capture-runtime-ui-evidence.mjs", redacted: true },
    pageOpened: true,
    visibleTitle: "Event Portfolio",
    sections: overrides.sections || ["Executive Summary", "Filter Bar", "Registration table", "Budget table", "Status Coverage"],
    kpis: [
      { label: "Registrations", value: "42", renderedText: "42" },
      { label: "Budget Used", value: "$8.2k", renderedText: "$8.2k" },
    ],
    kpiValuesVisible: true,
    filters: ["Campaign Filter", "Status Filter"],
    actions: ["Export Brief", "Open Event"],
    tables: overrides.tables || [
      { name: "Registration table", headers: ["Registrant", "Status"], rows: [["Ada", "Confirmed"]] },
      { name: "Budget table", headers: ["Budget", "Forecast", "Variance"], rows: [["Venue", "$8.2k", "On track"]] },
    ],
    gridTableHeaders: ["Registrant", "Status", "Budget", "Forecast", "Variance"],
    gridTableRows: [["Ada", "Confirmed", "Venue", "$8.2k", "On track"]],
    badgeLikeCells: ["Confirmed", "Pending", "Over Budget"],
    badgesDistinct: true,
    cardLikeSectionSignals: overrides.cardLikeSectionSignals || ["Executive Summary card", "KPI card", "Registration table panel", "Budget table panel"],
    dashboardCardsCardLike: true,
    pageLooksPlainScaffold: overrides.pageLooksPlainScaffold ?? false,
    placeholderFillerTextScan: overrides.placeholderFillerTextScan || { found: false, matches: [] },
    hiddenSummaryVisible: false,
    runtimeScreenshotCaptured: false,
    screenshotEvidence: { status: "not-captured", path: "redacted" },
    dynamicVisibleKpiRuntimeProven: overrides.dynamicVisibleKpiRuntimeProven ?? false,
    dynamicVisibleKpiRuntimeClaimed: overrides.dynamicVisibleKpiRuntimeClaimed ?? false,
    visibleText: overrides.visibleText || [],
    installOrSigningOnly: false,
  };
}

function scopePackage({ budgetReviewTitle = "Budget Review", navigationExtra = false } = {}) {
  const navigation = [
    { ID: "3000000000000001001", Title: "Event Portfolio", LayoutID: "layout-event-portfolio" },
    { ID: "3000000000000001002", Title: "Budget Review", LayoutID: "layout-budget-review" },
  ];
  if (navigationExtra) navigation.push({ ID: "3000000000000001003", Title: "New Broad Navigation", LayoutID: "layout-new-broad" });
  return {
    ListSet: { ListID: LIST_SET_ID, AppID: APP_ID, Title: "Marketing Event Management", Navigation: navigation },
    Pages: [
      { Title: "Event Portfolio", Type: 103, LayoutID: "layout-event-portfolio", LayoutInResources: [{ Resource: JSON.stringify({ type: "page", children: [{ type: "heading", attrs: { text: "Event Portfolio" } }] }) }] },
      { Title: budgetReviewTitle, Type: 103, LayoutID: "layout-budget-review", LayoutInResources: [{ Resource: JSON.stringify({ type: "page", children: [{ type: "heading", attrs: { text: budgetReviewTitle } }] }) }] },
    ],
    Childs: [{
      List: { ListID: "events", Title: "Events" },
      Fields: [field("ListDataID", "Text", "Record ID"), field("Title", "Text", "Event Name")],
    }],
  };
}

function summaryPackage({ includeTopLevelReportIds = false, omitLayoutReportIds = false, saveVarName = "__temp_event_count", summaryFunc = "count", fieldName = "ListDataID" } = {}) {
  const saveVar = { exprType: "variable", valueType: "string", id: `__temp_${saveVarName}`, type: "expr", name: saveVarName };
  const sourceField = field(fieldName, "Text", "Record ID");
  const summary = {
    id: SUMMARY_ID,
    type: "summary",
    attrs: {
      data: { app: { ListID: LIST_SET_ID }, list: { ListID: "events" }, field: sourceField, func: summaryFunc },
      field: sourceField,
      fieldObject: sourceField,
      fieldInfo: sourceField,
      allowAllRecords: true,
      save_var: saveVar,
    },
  };
  const root = {
    type: "page",
    ReportIds: omitLayoutReportIds ? [] : [SUMMARY_ID],
    exts: [summaryExtRegistration()],
    tempVars: [{ id: saveVar.id, name: saveVar.name }],
    children: [
      {
        id: "hidden-summary-host",
        type: "container",
        attrs: { common: { hide: [null, true, true, true] }, style: { direction: [null, "row"] }, display: { rule: "1 == 0" } },
        children: [summary],
      },
      { type: "heading", attrs: { headc: { title: { variable: [{ id: saveVar.id, name: saveVar.name }] } } } },
    ],
  };
  return {
    ListSet: { ListID: LIST_SET_ID, AppID: APP_ID, Title: "Marketing Event Management" },
    Pages: [{
      Title: "Event Portfolio",
      Type: 103,
      LayoutID: "layout-event-portfolio",
      ReportIds: includeTopLevelReportIds ? [SUMMARY_ID] : [],
      LayoutInResources: [{ Resource: JSON.stringify(root) }],
    }],
    Childs: [{
      List: { ListID: "events", Title: "Events" },
      Fields: [field("ListDataID", "Text", "Record ID"), field("Title", "Text", "Event Name")],
    }],
  };
}

function summaryExtRegistration() {
  const source = { AppID: 41, ListSetID: LIST_SET_ID, ListID: "events", Type: 1, Title: "Events" };
  return {
    i: SUMMARY_ID,
    id: SUMMARY_ID,
    category: "___Pivot___",
    key: "summary",
    attr: {
      AppID: 41,
      ListSetID: LIST_SET_ID,
      ListID: "events",
      list: source,
      source,
      settings: {
        values: [{
          fieldName: "ListDataID",
          field: "ListDataID",
          FieldName: "ListDataID",
          id: "ListDataID",
          func: "COUNT",
          aggregate: "COUNT",
          label: "Event count",
          type: "Text",
          fieldType: "Text",
          attr: { FieldName: "ListDataID", FieldType: "Text", DisplayName: "Record ID" },
          preConditions: [],
          Conditions: [],
        }],
      },
    },
  };
}

function gridPackage({ columns = [{ title: "Event" }, { title: "Owner" }, { title: "Status" }], rowActionLink = true, emptyItemTemplate = false } = {}) {
  const collection = {
    type: "collection",
    attrs: {
      role: "grid-table",
      layoutIntent: "grid-table",
      columns,
      emptyState: { title: "No events match these filters" },
      data: rowActionLink ? { list: { ListID: "events" }, link: "event-detail" } : { list: { ListID: "events" } },
      rowActionPlanned: true,
    },
    children: emptyItemTemplate ? [] : [{ type: "flex_grid", children: [{ type: "text", attrs: { text: "Event name" } }] }],
  };
  return {
    ListSet: { ListID: LIST_SET_ID, AppID: APP_ID, Title: "Marketing Event Management" },
    Pages: [{ Title: "Event Portfolio", Type: 103, LayoutID: "layout-event-portfolio", LayoutInResources: [{ Resource: JSON.stringify({ type: "page", children: [collection] }) }] }],
    Childs: [{
      List: { ListID: "events", Title: "Events" },
      Fields: [field("ListDataID", "Text", "Record ID"), field("Title", "Text", "Event Name")],
    }],
  };
}

function field(FieldName, FieldType, DisplayName) {
  return { FieldName, FieldType, Type: FieldType.toLowerCase(), DisplayName, FieldID: `${FieldName}-id` };
}

function expectPass(label, report) {
  assert.equal(report.status, "pass", `${label}: ${JSON.stringify(report.findings, null, 2)}`);
  cases.push(label);
}

function expectFail(label, report, code) {
  assert.equal(report.status, "fail", `${label}: expected fail, got ${report.status}`);
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

#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { compareDesignToRuntimeStructure } from "./compare-design-to-runtime-structure.mjs";
import { captureRuntimeUiEvidence } from "./capture-runtime-ui-evidence.mjs";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ui-closed-loop-phase2-"));
const cases = [];

try {
  await run();
  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

async function run() {
  testPassMatchingStructure();
  testMissingKpiCount();
  testMissingTableSection();
  testMissingTableColumn();
  testMissingRuntimeEvidence();
  testPlainScaffoldWarningOrFail();
  testDesignImageReviewWarning();
  testWeakHandWrittenEvidenceWarning();
  testRawVariableTextFails();
  testDynamicKpiProofBoundary();
  await testPhase1Compatibility();
  testScreenshotUnavailableAccepted();
  testStrictWarningsExitNonzero();
  testMarketingEventMissingTableSection();
}

function testPassMatchingStructure() {
  const contract = writeJson("pass-contract.json", baseContract());
  const evidence = writeJson("pass-evidence.json", baseEvidence({ dynamicVisibleKpiRuntimeProven: true }));
  const report = compareDesignToRuntimeStructure({ contract, runtimeEvidence: evidence });
  assert.equal(report.status, "pass");
  assert.equal(report.comparisonMode, "contract-runtime");
  assert.equal(report.reviewRequired, false);
  cases.push("pass: contract and runtime evidence match sections, KPIs, tables, filters/actions, and badges");
}

function testMissingKpiCount() {
  const contract = writeJson("missing-kpi-contract.json", baseContract({ expectedKpiCount: 4 }));
  const evidence = writeJson("missing-kpi-evidence.json", baseEvidence({ kpis: baseKpis().slice(0, 2), dynamicVisibleKpiRuntimeProven: true }));
  expectStatusAndCode(contract, evidence, "fail", "KPI_CARD_COUNT_MISMATCH");
  cases.push("fail: missing KPI card count");
}

function testMissingTableSection() {
  const contract = writeJson("missing-table-section-contract.json", baseContract());
  const evidence = writeJson("missing-table-section-evidence.json", baseEvidence({
    sections: ["Executive Summary", "Filter Bar", "Follow-up Tasks", "Status Coverage"],
    tables: [{ name: "Follow-up Tasks", headers: ["Task", "Owner"], rows: [["Send deck", "Ari"]] }],
  }));
  expectStatusAndCode(contract, evidence, "fail", "TABLE_SECTION_MISSING");
  cases.push("fail: missing table section");
}

function testMissingTableColumn() {
  const contract = writeJson("missing-column-contract.json", baseContract());
  const evidence = writeJson("missing-column-evidence.json", baseEvidence({
    tables: [{ name: "Event Pipeline", headers: ["Event", "Owner"], rows: [["Launch Briefing", "Ari"]] }],
    gridTableHeaders: ["Event", "Owner"],
    gridTableRows: [["Launch Briefing", "Ari"]],
  }));
  expectStatusAndCode(contract, evidence, "fail", "TABLE_COLUMN_MISSING");
  cases.push("fail: missing table column");
}

function testMissingRuntimeEvidence() {
  const contract = writeJson("missing-runtime-contract.json", baseContract());
  const missing = path.join(tmp, "does-not-exist.json");
  const report = compareDesignToRuntimeStructure({ contract, runtimeEvidence: missing });
  assert.equal(report.status, "fail");
  assertHasCode(report, "RUNTIME_EVIDENCE_MISSING");
  cases.push("fail: missing runtime evidence");
}

function testPlainScaffoldWarningOrFail() {
  const contract = writeJson("scaffold-contract.json", baseContract());
  const evidence = writeJson("scaffold-evidence.json", baseEvidence({
    pageLooksPlainScaffold: true,
    placeholderFillerTextScan: { found: true, matches: ["sample dashboard"] },
  }));
  const report = expectStatusAndCode(contract, evidence, "fail", "PAGE_LOOKS_LIKE_PLAIN_SCAFFOLD");
  assertHasCode(report, "PLACEHOLDER_TEXT_VISIBLE");
  cases.push("warn/fail: page looks like plain scaffold");
}

function testDesignImageReviewWarning() {
  const contract = writeJson("design-contract.json", baseContract());
  const evidence = writeJson("design-evidence.json", baseEvidence({ dynamicVisibleKpiRuntimeProven: true }));
  const report = compareDesignToRuntimeStructure({ contract, runtimeEvidence: evidence, designImage: "/tmp/marketing-event-dashboard.png" });
  assert.equal(report.status, "warning");
  assert.equal(report.reviewRequired, true);
  assert.equal(report.comparisonMode, "contract-runtime");
  assertHasCode(report, "DESIGN_IMAGE_PARSE_REVIEW_REQUIRED");
  cases.push("warn: design image supplied but not parseable, human review required");
}

function testWeakHandWrittenEvidenceWarning() {
  const contract = writeJson("weak-contract.json", baseContract());
  const evidence = writeJson("weak-evidence.json", {
    ...baseEvidence({ dynamicVisibleKpiRuntimeProven: true }),
    schema: "hand-written-runtime-evidence/v0",
    captureNotes: [],
  });
  const report = compareDesignToRuntimeStructure({ contract, runtimeEvidence: evidence });
  assert.equal(report.status, "warning");
  assertHasCode(report, "RUNTIME_EVIDENCE_WEAK");
  cases.push("warn: hand-written runtime evidence is weaker");
}

function testRawVariableTextFails() {
  const contract = writeJson("raw-var-contract.json", baseContract());
  const evidence = writeJson("raw-var-evidence.json", baseEvidence({
    visibleText: ["{{tempVar.openFollowUps}}"],
  }));
  expectStatusAndCode(contract, evidence, "fail", "RAW_VARIABLE_TEXT_VISIBLE");
  cases.push("fail: raw variable text visible");
}

function testDynamicKpiProofBoundary() {
  const contract = writeJson("dynamic-boundary-contract.json", baseContract());
  const evidence = writeJson("dynamic-boundary-evidence.json", baseEvidence({
    dynamicVisibleKpiRuntimeProven: false,
    dynamicVisibleKpiRuntimeClaimed: true,
  }));
  const report = compareDesignToRuntimeStructure({ contract, runtimeEvidence: evidence });
  assert.equal(report.status, "warning");
  assertHasCode(report, "DYNAMIC_KPI_PROOF_NOT_ESTABLISHED");
  assert.match(report.proofBoundary.join(" "), /Static visible KPI values do not establish dynamic KPI proof/i);
  assert.doesNotMatch(JSON.stringify(report), /pixel-perfect visual diffing is complete/i);
  cases.push("does not claim dynamic KPI proof");
}

async function testPhase1Compatibility() {
  const pagesJson = writeJson("phase1-pages.json", {
    pages: [{
      url: "https://example.invalid/event-dashboard",
      pageOpened: true,
      visibleTitle: "Event Portfolio",
      screenshotCaptured: false,
      sections: ["Executive Summary", "Filter Bar", "Event Pipeline", "Status Coverage"],
      html: [
        "<main>",
        "<h1>Event Portfolio</h1>",
        "<section class='card kpi'><span>Planned Events</span><strong>12</strong></section>",
        "<section class='card kpi'><span>Open Follow-ups</span><strong>5</strong></section>",
        "<label>Status Filter</label><select name='status'></select><button>Export Brief</button>",
        "<table><thead><tr><th>Event</th><th>Owner</th><th>Status</th></tr></thead><tbody><tr><td>Launch Briefing</td><td>Ari</td><td><span class='badge status'>Live</span></td></tr></tbody></table>",
        "<div class='hidden-summary' style='display:none'>internal summary</div>",
        "</main>",
      ].join(""),
    }],
  });
  const captured = await captureRuntimeUiEvidence({ pagesJson });
  captured.sections = ["Executive Summary", "Filter Bar", "Event Pipeline", "Status Coverage"];
  captured.tables = [{ name: "Event Pipeline", headers: ["Event", "Owner", "Status"], rows: [["Launch Briefing", "Ari", "Live"]] }];
  captured.badgeLikeCells = ["Live", "Planning"];
  captured.cardLikeSectionSignals = ["Executive Summary card", "Planned Events card", "Open Follow-ups card"];
  captured.dynamicVisibleKpiRuntimeProven = true;
  const contract = writeJson("phase1-contract.json", baseContract());
  const evidence = writeJson("phase1-evidence.json", captured);
  const report = compareDesignToRuntimeStructure({ contract, runtimeEvidence: evidence });
  assert.equal(report.status, "pass");
  cases.push("Phase 1 compatibility: accepts evidence generated by capture-runtime-ui-evidence.mjs");
}

function testScreenshotUnavailableAccepted() {
  const contract = writeJson("no-screenshot-contract.json", baseContract());
  const evidence = writeJson("no-screenshot-evidence.json", baseEvidence({
    runtimeScreenshotCaptured: false,
    screenshotEvidence: { status: "not-captured", path: "redacted" },
    dynamicVisibleKpiRuntimeProven: true,
  }));
  const report = compareDesignToRuntimeStructure({ contract, runtimeEvidence: evidence });
  assert.equal(report.status, "pass");
  cases.push("screenshot unavailable: pass allowed when structural evidence is sufficient and no high-quality visual proof is claimed");
}

function testStrictWarningsExitNonzero() {
  const contract = writeJson("strict-contract.json", baseContract());
  const evidence = writeJson("strict-evidence.json", baseEvidence({ dynamicVisibleKpiRuntimeProven: true }));
  const script = path.join(process.cwd(), "scripts", "compare-design-to-runtime-structure.mjs");
  const result = spawnSync(process.execPath, [script, "--contract", contract, "--runtime-evidence", evidence, "--design-image", "/tmp/mockup.png", "--strict"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, "warning");
  assertHasCode(report, "DESIGN_IMAGE_PARSE_REVIEW_REQUIRED");
  cases.push("strict mode: warnings exit nonzero");
}

function testMarketingEventMissingTableSection() {
  const contract = writeJson("marketing-event-contract.json", baseContract({
    visualSections: ["Executive Summary", "Filter Bar", "Event Pipeline", "Budget Grid", "Status Coverage"],
    gridTablePlan: [
      { section: "Event Pipeline", headers: ["Event", "Owner", "Status"] },
      { section: "Budget Grid", headers: ["Budget", "Forecast", "Variance"] },
    ],
    statusBadgePlan: ["Live", "Planning", "Blocked"],
    filterActionPlan: {
      filters: ["Status Filter", "Owner Filter"],
      actions: ["Export Brief", "Open Event"],
    },
  }));
  const evidence = writeJson("marketing-event-evidence.json", baseEvidence({
    sections: ["Executive Summary", "Filter Bar", "Event Pipeline", "Status Coverage"],
    tables: [{ name: "Event Pipeline", headers: ["Event", "Owner", "Status"], rows: [["Launch Briefing", "Ari", "Live"]] }],
    filters: ["Status Filter", "Owner Filter"],
    actions: ["Export Brief", "Open Event"],
    badgeLikeCells: ["Live", "Planning", "Blocked"],
  }));
  const report = expectStatusAndCode(contract, evidence, "fail", "TABLE_SECTION_MISSING");
  assertHasCode(report, "SECTION_MISSING");
  cases.push("Marketing Event-inspired synthetic case: missing one table section produces TABLE_SECTION_MISSING");
}

function expectStatusAndCode(contract, evidence, status, code) {
  const report = compareDesignToRuntimeStructure({ contract, runtimeEvidence: evidence });
  assert.equal(report.status, status);
  assertHasCode(report, code);
  return report;
}

function assertHasCode(report, code) {
  assert.ok(report.findings.some((finding) => finding.code === code), `expected finding ${code}`);
}

function baseContract(overrides = {}) {
  return {
    schema: "yeeflow-ui-implementation-contract/v1",
    targetPageName: "Event Portfolio",
    pagePurpose: "Track event health and follow-up readiness.",
    visualSections: overrides.visualSections || ["Executive Summary", "Filter Bar", "Event Pipeline", "Status Coverage"],
    kpiSummaryPlan: overrides.kpiSummaryPlan || [
      { label: "Planned Events" },
      { label: "Open Follow-ups" },
    ],
    expectedKpiCount: overrides.expectedKpiCount || 2,
    filterActionPlan: overrides.filterActionPlan || {
      filters: ["Status Filter"],
      actions: ["Export Brief"],
    },
    gridTablePlan: overrides.gridTablePlan || [
      { section: "Event Pipeline", headers: ["Event", "Owner", "Status"], emptyState: "No events yet" },
    ],
    statusBadgePlan: overrides.statusBadgePlan || ["Live", "Planning"],
  };
}

function baseEvidence(overrides = {}) {
  return {
    schema: "yeeflow-redacted-runtime-ui-evidence/v1",
    generatedAt: new Date().toISOString(),
    pageOpened: true,
    visibleTitle: "Event Portfolio",
    sections: overrides.sections || ["Executive Summary", "Filter Bar", "Event Pipeline", "Status Coverage"],
    kpis: overrides.kpis || baseKpis(),
    kpiValuesVisible: true,
    filters: overrides.filters || ["Status Filter"],
    actions: overrides.actions || ["Export Brief"],
    tables: overrides.tables || [
      { name: "Event Pipeline", headers: ["Event", "Owner", "Status"], rows: [["Launch Briefing", "Ari", "Live"]] },
    ],
    gridTableHeaders: overrides.gridTableHeaders || ["Event", "Owner", "Status"],
    gridTableRows: overrides.gridTableRows || [["Launch Briefing", "Ari", "Live"]],
    badgeLikeCells: overrides.badgeLikeCells || ["Live", "Planning"],
    badgesDistinct: overrides.badgesDistinct ?? true,
    cardLikeSectionSignals: overrides.cardLikeSectionSignals || ["Executive Summary card", "KPI card", "Event Pipeline panel"],
    dashboardCardsCardLike: true,
    pageLooksPlainScaffold: overrides.pageLooksPlainScaffold ?? false,
    placeholderFillerTextScan: overrides.placeholderFillerTextScan || { found: false, matches: [] },
    hiddenSummaryVisible: false,
    runtimeScreenshotCaptured: overrides.runtimeScreenshotCaptured ?? false,
    screenshotEvidence: overrides.screenshotEvidence || { status: "not-captured", path: "redacted" },
    dynamicVisibleKpiRuntimeProven: overrides.dynamicVisibleKpiRuntimeProven ?? false,
    dynamicVisibleKpiRuntimeClaimed: overrides.dynamicVisibleKpiRuntimeClaimed ?? false,
    installOrSigningOnly: false,
    captureNotes: ["Captured from provided redacted pages JSON fixture."],
    visibleText: overrides.visibleText || [],
    proofBoundary: "Synthetic redacted runtime evidence only.",
  };
}

function baseKpis() {
  return [
    { label: "Planned Events", renderedText: "12", value: "12", runtimeProven: false },
    { label: "Open Follow-ups", renderedText: "5", value: "5", runtimeProven: false },
  ];
}

function writeJson(name, value) {
  const file = path.join(tmp, name);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
}

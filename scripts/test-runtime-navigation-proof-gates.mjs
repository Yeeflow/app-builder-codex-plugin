#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { inspectRuntimeNavigationProof } from "./inspect-runtime-navigation-proof.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isSourceRepo = fs.existsSync(path.join(ROOT, "dist", "yeeflow-app-builder-plugin"));
const APPROVED_NAV = [
  "Event Portfolio",
  "Planning Workbench",
  "Registration & Leads",
  "Budget Review",
  "Post-event Reporting",
  "Admin",
];
const SUPPORT_RESOURCES = [
  "Events",
  "Event Tasks",
  "Attendees",
  "Leads",
  "Campaign Assets",
  "Venues",
  "Event Suppliers",
  "Sponsors",
  "Event Types",
  "Budget Categories",
];

const cases = [];

run("Pass: approved six-item Marketing Event navigation exactly visible", () => {
  const report = inspectRuntimeNavigationProof(writeFixture({
    contract: goodContract(),
    runtimeEvidence: goodEvidence(),
  }));
  assert.equal(report.status, "pass");
  assert.deepEqual(report.navigationResult.expectedPrimaryNavigation, APPROVED_NAV);
});

run("Fail: support data-list entries visible in primary nav", () => {
  const report = inspectRuntimeNavigationProof(writeFixture({
    contract: goodContract(),
    runtimeEvidence: goodEvidence({ visiblePrimaryNavigation: SUPPORT_RESOURCES, visibleSupportResources: SUPPORT_RESOURCES }),
  }));
  assert.equal(report.status, "fail");
  assertCodes(report, ["SUPPORT_RESOURCE_VISIBLE_IN_PRIMARY_NAV", "VISIBLE_NAV_MENU_MISMATCH"]);
});

run("Fail: six approved items plus extra support items", () => {
  const report = inspectRuntimeNavigationProof(writeFixture({
    contract: goodContract(),
    runtimeEvidence: goodEvidence({ visiblePrimaryNavigation: [...APPROVED_NAV, "Events", "Campaign Assets"] }),
  }));
  assert.equal(report.status, "fail");
  assertCodes(report, ["EXTRA_PRIMARY_NAV_ITEM_VISIBLE", "SUPPORT_RESOURCE_VISIBLE_IN_PRIMARY_NAV", "VISIBLE_NAV_MENU_MISMATCH"]);
});

run("Fail: runtime nav missing one approved item", () => {
  const report = inspectRuntimeNavigationProof(writeFixture({
    contract: goodContract(),
    runtimeEvidence: goodEvidence({ visiblePrimaryNavigation: APPROVED_NAV.filter((label) => label !== "Admin") }),
  }));
  assert.equal(report.status, "fail");
  assertCodes(report, ["PRIMARY_NAV_LABEL_MISSING", "VISIBLE_NAV_MENU_MISMATCH"]);
});

run("Fail: runtime nav order differs from approved contract", () => {
  const report = inspectRuntimeNavigationProof(writeFixture({
    contract: goodContract(),
    runtimeEvidence: goodEvidence({ visiblePrimaryNavigation: [
      "Planning Workbench",
      "Event Portfolio",
      "Registration & Leads",
      "Budget Review",
      "Post-event Reporting",
      "Admin",
    ] }),
  }));
  assert.equal(report.status, "fail");
  assertCodes(report, ["PRIMARY_NAV_ORDER_MISMATCH", "VISIBLE_NAV_MENU_MISMATCH"]);
});

run("Fail: contract omits hidden support-resource expectations", () => {
  const contract = goodContract();
  delete contract.hiddenSupportResources;
  const report = inspectRuntimeNavigationProof(writeFixture({
    contract,
    runtimeEvidence: goodEvidence(),
  }));
  assert.equal(report.status, "fail");
  assertCodes(report, ["HIDDEN_SUPPORT_RESOURCE_EXPECTATION_MISSING"]);
});

run("Fail: screenshot evidence lacks explicit browser refresh before capture", () => {
  const evidence = goodEvidence();
  evidence.screenshot.browserRefreshBeforeCapture = false;
  const report = inspectRuntimeNavigationProof(writeFixture({
    contract: goodContract(),
    runtimeEvidence: evidence,
  }));
  assert.equal(report.status, "fail");
  assertCodes(report, ["BROWSER_REFRESH_REQUIRED_BEFORE_RUNTIME_SCREENSHOT"]);
});

run("Fail: broad body text scan only instead of nav-scoped or exact-line evidence", () => {
  const evidence = goodEvidence({
    navigationEvidence: {
      mode: "broad body text scan",
      scope: "document body",
      visiblePrimaryNavigation: APPROVED_NAV,
      broadBodyTextOnly: true,
    },
  });
  const report = inspectRuntimeNavigationProof(writeFixture({
    contract: goodContract(),
    runtimeEvidence: evidence,
  }));
  assert.equal(report.status, "fail");
  assertCodes(report, ["BROAD_BODY_TEXT_NAV_SCAN_UNRELIABLE", "NAV_SCOPED_EVIDENCE_REQUIRED"]);
});

run("Fail: signing/upgrade proof exists but runtime screenshot/nav evidence is missing", () => {
  const report = inspectRuntimeNavigationProof(writeFixture({
    contract: goodContract(),
    runtimeEvidence: {
      signingSuccess: true,
      verifysignSuccess: true,
      upgradeCheckSuccess: true,
      upgradeApplySuccess: true,
      fidelityReport: {},
    },
  }));
  assert.equal(report.status, "fail");
  assertCodes(report, [
    "SIGN_UPGRADE_SUCCESS_NOT_VISUAL_PROOF",
    "INSTALL_SUCCESS_NOT_VISUAL_PROOF",
    "RUNTIME_SCREENSHOT_EVIDENCE_MISSING",
    "NAV_SCOPED_EVIDENCE_REQUIRED",
  ]);
});

run("Pass: signing/upgrade proof plus refreshed screenshot and exact-line nav evidence", () => {
  const report = inspectRuntimeNavigationProof(writeFixture({
    contract: goodContract(),
    runtimeEvidence: goodEvidence({
      signingSuccess: true,
      upgradeCheckSuccess: true,
      upgradeApplySuccess: true,
    }),
  }));
  assert.equal(report.status, "pass");
});

run("Warn: content structure fidelity is reported separately and does not pass merely because nav proof passed", () => {
  const evidence = goodEvidence();
  evidence.fidelityReport = {
    appChromeFidelity: { status: "pass" },
    primaryNavigationFidelity: { status: "pass" },
    contentStructureFidelity: { status: "warning", note: "KPI/table fidelity remains separate." },
    dynamicKpiProofBoundary: { status: "not-proven" },
  };
  const report = inspectRuntimeNavigationProof(writeFixture({
    contract: goodContract(),
    runtimeEvidence: evidence,
  }));
  assert.equal(report.status, "pass");
  assert.equal(report.artifactSummary.fidelityReportSections.includes("contentStructureFidelity"), true);
});

run("CLI smoke: JSON output is valid and fail exits nonzero", () => {
  const fixture = writeFixture({
    contract: goodContract(),
    runtimeEvidence: goodEvidence({ visiblePrimaryNavigation: [...APPROVED_NAV, "Events"] }),
  });
  const result = spawnSync(process.execPath, [
    path.join(ROOT, "scripts", "inspect-runtime-navigation-proof.mjs"),
    "--contract",
    fixture.contract,
    "--runtime-evidence",
    fixture.runtimeEvidence,
  ], { cwd: ROOT, encoding: "utf8" });
  assert.notEqual(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.status, "fail");
  assertCodes(parsed, ["EXTRA_PRIMARY_NAV_ITEM_VISIBLE"]);
});

if (isSourceRepo) {
  run("Source/dist runtime navigation proof scripts mirror exactly", () => {
    const source = "scripts/inspect-runtime-navigation-proof.mjs";
    const test = "scripts/test-runtime-navigation-proof-gates.mjs";
    for (const file of [source, test]) {
      const dist = path.join("dist/yeeflow-app-builder-plugin", file);
      assert.equal(fs.existsSync(path.join(ROOT, dist)), true, `missing dist mirror: ${dist}`);
      assert.equal(fs.readFileSync(path.join(ROOT, file), "utf8"), fs.readFileSync(path.join(ROOT, dist), "utf8"));
    }
  });
}

console.log(JSON.stringify({ status: "pass", cases }, null, 2));

function run(name, fn) {
  fn();
  cases.push(name);
}

function goodContract(overrides = {}) {
  return {
    primaryNavigation: { labels: APPROVED_NAV },
    supportResources: SUPPORT_RESOURCES,
    hiddenSupportResources: SUPPORT_RESOURCES,
    ...overrides,
  };
}

function goodEvidence(overrides = {}) {
  return {
    screenshot: {
      status: "captured",
      path: "dist/runtime-evidence/marketing-event/redacted.runtime-screenshot.txt",
      browserRefreshBeforeCapture: true,
    },
    navigationEvidence: {
      mode: "exact-line",
      scope: "primary-navigation",
      exactLines: APPROVED_NAV,
      visiblePrimaryNavigation: APPROVED_NAV,
    },
    visiblePrimaryNavigation: APPROVED_NAV,
    visibleSupportResources: [],
    fidelityReport: {
      appChromeFidelity: { status: "pass" },
      primaryNavigationFidelity: { status: "pass" },
      contentStructureFidelity: { status: "not-evaluated", note: "Separate content-fidelity gate required." },
      dynamicKpiProofBoundary: { status: "not-claimed", note: "Before/after mutation evidence required." },
    },
    ...overrides,
  };
}

function writeFixture({ contract, runtimeEvidence }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "runtime-nav-proof-"));
  const contractPath = path.join(dir, "contract.json");
  const runtimeEvidencePath = path.join(dir, "runtime-evidence.json");
  fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2));
  fs.writeFileSync(runtimeEvidencePath, JSON.stringify(runtimeEvidence, null, 2));
  return { contract: contractPath, runtimeEvidence: runtimeEvidencePath };
}

function assertCodes(report, expectedCodes) {
  const actual = new Set(report.findings.map((finding) => finding.code));
  for (const code of expectedCodes) {
    assert.equal(actual.has(code), true, `expected finding code ${code}; actual ${[...actual].join(", ")}`);
  }
}

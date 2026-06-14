#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { inspectUiClosedLoopWorkflowEnforcement } from "./inspect-ui-closed-loop-workflow-enforcement.mjs";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ui-closed-loop-phase3b-"));
const cases = [];

try {
  run();
  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

function run() {
  testPassCompleteWorkflow();
  testDesignHighQualityMissingContract();
  testUpgradeMissingScope();
  testInstallSuccessWithoutRuntimeEvidence();
  testDesignFidelityMissingStructure();
  testStructureComparisonFailBlocks();
  testStrictWarningBlocks();
  testFinalReportMissingPaths();
  testDynamicKpiMissingMutationEvidence();
  testStructureComparisonUsedAsDynamicProof();
  testStaticKpiMislabeledDynamic();
  testWeakRuntimeEvidenceWarning();
  testDesignImageReviewWarning();
  testSchemaOnlyPassesWithoutUiArtifacts();
  testMarketingEventInspiredHappyPath();
  testMarkdownWorkflowReportEnforcesJsonEquivalentGates();
  testCliStrictWarningExit();
}

function testPassCompleteWorkflow() {
  const report = inspectWorkflow("pass-workflow.json", baseWorkflow());
  expectPass("high-quality UI workflow with complete contract/scope/evidence/structure artifacts passes", report);
}

function testDesignHighQualityMissingContract() {
  const workflow = baseWorkflow();
  delete workflow.artifacts.uiContractPath;
  delete workflow.finalReport.artifactPaths.uiContractPath;
  expectFail("design image/high-quality UI request with no UI contract fails", inspectWorkflow("missing-contract.json", workflow), "UI_CONTRACT_MISSING");
}

function testUpgradeMissingScope() {
  const workflow = baseWorkflow();
  delete workflow.artifacts.scopeManifestPath;
  delete workflow.finalReport.artifactPaths.scopeManifestPath;
  expectFail("UI upgrade request without scope manifest fails", inspectWorkflow("missing-scope.json", workflow), "SCOPE_MANIFEST_MISSING");
}

function testInstallSuccessWithoutRuntimeEvidence() {
  const workflow = baseWorkflow();
  delete workflow.artifacts.runtimeEvidencePath;
  delete workflow.finalReport.artifactPaths.runtimeEvidencePath;
  workflow.signingInstallUpgrade.upgradeApply = { status: "success" };
  workflow.finalReport.claimsVisualSuccess = true;
  const report = inspectWorkflow("install-success-no-runtime.json", workflow);
  expectFail("install/upgrade success without runtime evidence but UI quality is claimed fails", report, "RUNTIME_EVIDENCE_MISSING");
  assertHasCode(report, "INSTALL_SUCCESS_NOT_VISUAL_PROOF");
}

function testDesignFidelityMissingStructure() {
  const workflow = baseWorkflow();
  delete workflow.artifacts.structureFindingsPath;
  delete workflow.finalReport.artifactPaths.structureFindingsPath;
  workflow.validations.structureComparison = {};
  const report = inspectWorkflow("design-fidelity-no-structure.json", workflow);
  expectFail("design fidelity claim without structure comparison findings fails", report, "STRUCTURE_COMPARISON_MISSING");
  assertHasCode(report, "DESIGN_FIDELITY_CLAIM_UNPROVEN");
}

function testStructureComparisonFailBlocks() {
  const workflow = baseWorkflow({
    structureComparison: {
      status: "fail",
      findings: [{ code: "TABLE_SECTION_MISSING", severity: "error" }],
    },
  });
  expectFail("structure comparison fail blocks design fidelity", inspectWorkflow("structure-fail.json", workflow), "STRUCTURE_COMPARISON_FAILED");
}

function testStrictWarningBlocks() {
  const workflow = baseWorkflow({
    strictQuality: true,
    structureComparison: {
      status: "warning",
      findings: [{ code: "DESIGN_IMAGE_PARSE_REVIEW_REQUIRED", severity: "warning" }],
    },
  });
  expectFail("strict-quality request with structure comparison warning fails", inspectWorkflow("strict-warning.json", workflow), "STRUCTURE_COMPARISON_WARNING_STRICT");
}

function testFinalReportMissingPaths() {
  const workflow = baseWorkflow();
  workflow.finalReport.artifactPaths = {
    runtimeEvidencePath: workflow.artifacts.runtimeEvidencePath,
  };
  expectFail("final report missing contract/evidence/findings paths fails", inspectWorkflow("final-report-missing-paths.json", workflow), "FINAL_REPORT_ARTIFACT_PATH_MISSING");
}

function testDynamicKpiMissingMutationEvidence() {
  const workflow = baseWorkflow({ dynamicKpiProof: true });
  delete workflow.artifacts.dynamicKpiMutationEvidencePath;
  delete workflow.finalReport.artifactPaths.dynamicKpiMutationEvidencePath;
  workflow.validations.dynamicKpiMutation = {};
  expectFail("dynamic KPI proof claim without before/after mutation evidence fails", inspectWorkflow("dynamic-kpi-missing-mutation.json", workflow), "DYNAMIC_KPI_MUTATION_EVIDENCE_MISSING");
}

function testStructureComparisonUsedAsDynamicProof() {
  const workflow = baseWorkflow({ dynamicKpiProof: true });
  workflow.claims.structureComparisonUsedAsDynamicProof = true;
  expectFail("structure comparison used as dynamic KPI proof fails", inspectWorkflow("structure-used-as-dynamic.json", workflow), "STRUCTURE_COMPARISON_NOT_DYNAMIC_KPI_PROOF");
}

function testStaticKpiMislabeledDynamic() {
  const workflow = baseWorkflow({ dynamicKpiProof: true });
  workflow.claims.staticKpiMislabeledDynamic = true;
  expectFail("static/fallback KPI display mislabeled as dynamic proof fails", inspectWorkflow("static-kpi-dynamic.json", workflow), "STATIC_KPI_MISLABELED_DYNAMIC");
}

function testWeakRuntimeEvidenceWarning() {
  const workflow = baseWorkflow({ runtimeEvidenceWeak: true });
  workflow.claims.strictQuality = false;
  const report = inspectWorkflow("weak-runtime-warning.json", workflow);
  assert.equal(report.status, "warning");
  assertHasCode(report, "WEAK_RUNTIME_EVIDENCE");
  cases.push("weak hand-written runtime evidence without strict quality warns");
}

function testDesignImageReviewWarning() {
  const workflow = baseWorkflow({
    structureComparison: {
      status: "warning",
      findings: [{ code: "DESIGN_IMAGE_PARSE_REVIEW_REQUIRED", severity: "warning" }],
    },
  });
  const report = inspectWorkflow("design-review-warning.json", workflow);
  assert.equal(report.status, "warning");
  assertHasCode(report, "DESIGN_IMAGE_PARSE_REVIEW_REQUIRED");
  cases.push("design image parse review required warns when contract/evidence exist");
}

function testSchemaOnlyPassesWithoutUiArtifacts() {
  const workflow = {
    request: { type: "schema-only package validation", basicSchemaOnly: true },
    claims: { basicSchemaOnly: true },
    validations: { packageValidation: { status: "pass" } },
    finalReport: { artifactPaths: {}, unresolvedFindingsReported: true, warningWaiverSummary: "No UI claim." },
  };
  const report = inspectWorkflow("schema-only.json", workflow);
  assert.equal(report.status, "warning");
  assertHasCode(report, "BASIC_SCHEMA_ONLY_NO_UI_CLAIM");
  assert.ok(!report.findings.some((finding) => finding.code === "UI_CONTRACT_MISSING"));
  cases.push("basic non-design schema-only package validation report does not require closed-loop UI artifacts");
}

function testMarketingEventInspiredHappyPath() {
  const workflow = baseWorkflow({
    app: "marketing-event-management",
    page: "event-portfolio",
    dynamicKpiProof: false,
    summaryProofBoundary: true,
    gridTableProofBoundary: true,
  });
  workflow.request.type = "Marketing Event-style one-page dashboard UI upgrade";
  workflow.finalReport.summaryLayoutResourceProofBoundary = "Summary layout-resource shape validated; dynamic proof separate.";
  workflow.finalReport.gridTableProofBoundary = "Grid-table structure validated; runtime evidence separate.";
  const report = inspectWorkflow("marketing-event-happy.json", workflow);
  expectPass("Marketing Event-inspired synthetic happy path passes", report);
}

function testMarkdownWorkflowReportEnforcesJsonEquivalentGates() {
  const markdown = [
    "# Synthetic Workflow Report",
    "",
    "- request.type: design mockup dashboard UI upgrade",
    "- request.designMockupPresent: true",
    "- claims.highQualityUi: true",
    "- claims.designFidelity: true",
    "- claims.runtimeUiQuality: true",
    "- artifacts.runtimeEvidencePath: dist/runtime-evidence/demo/page.runtime-evidence.redacted.json",
    "- validations.uiContract.status: pass",
    "- validations.runtimeEvidence.status: pass",
    "- validations.structureComparison.status: pass",
    "- finalReport.artifactPaths.runtimeEvidencePath: dist/runtime-evidence/demo/page.runtime-evidence.redacted.json",
    "- finalReport.artifactPaths.structureFindingsPath: dist/runtime-evidence/demo/page.design-runtime-structure.findings.json",
    "- finalReport.unresolvedFindingsReported: true",
    "- finalReport.warningWaiverSummary: none",
  ].join("\n");
  const file = writeText("markdown-missing-contract.md", markdown);
  const report = inspectUiClosedLoopWorkflowEnforcement({ workflow: file });
  expectFail("Markdown workflow report enforces same contract gate as JSON", report, "UI_CONTRACT_MISSING");
}

function testCliStrictWarningExit() {
  const workflowPath = writeJson("cli-warning.json", baseWorkflow({ runtimeEvidenceWeak: true }));
  const script = path.join(process.cwd(), "scripts", "inspect-ui-closed-loop-workflow-enforcement.mjs");
  const normal = spawnSync(process.execPath, [script, "--workflow", workflowPath], { cwd: process.cwd(), encoding: "utf8" });
  assert.equal(normal.status, 0);
  assert.equal(JSON.parse(normal.stdout).status, "warning");
  const strict = spawnSync(process.execPath, [script, "--workflow", workflowPath, "--strict"], { cwd: process.cwd(), encoding: "utf8" });
  assert.notEqual(strict.status, 0);
  assert.equal(JSON.parse(strict.stdout).status, "warning");
  cases.push("workflow enforcement warning exits 0 and --strict makes warning nonzero");
}

function baseWorkflow({
  app = "demo-app",
  page = "event-portfolio",
  strictQuality = false,
  dynamicKpiProof = false,
  runtimeEvidenceWeak = false,
  structureComparison = { status: "pass", findings: [] },
} = {}) {
  const base = `dist/runtime-evidence/${app}/${page}`;
  const contractPath = `docs/generated-ui-contracts/${app}/${page}.ui-contract.md`;
  const scopePath = `docs/ui-upgrade-scopes/${app}/${page}.scope.json`;
  const runtimePath = `${base}.runtime-evidence.redacted.json`;
  const structurePath = `${base}.design-runtime-structure.findings.json`;
  const workflowPath = `${base}.closed-loop-workflow.findings.json`;
  const mutationPath = `${base}.kpi-mutation-evidence.json`;
  return {
    request: {
      type: "high-quality dashboard UI upgrade one-page-at-a-time",
      designMockupPresent: true,
      uiUpgrade: true,
      onePageAtATime: true,
      existingAppUpgrade: true,
    },
    claims: {
      highQualityUi: true,
      designFidelity: true,
      runtimeUiQuality: true,
      dynamicKpiProof,
      strictQuality,
    },
    artifacts: {
      uiContractPath: contractPath,
      scopeManifestPath: scopePath,
      scopeValidationResultPath: `${base}.scope-validation.json`,
      runtimeEvidencePath: runtimePath,
      structureFindingsPath: structurePath,
      workflowFindingsPath: workflowPath,
      ...(dynamicKpiProof ? { dynamicKpiMutationEvidencePath: mutationPath } : {}),
    },
    validations: {
      uiContract: { status: "pass", unresolvedRequiredSections: false },
      scope: { status: "pass", driftCodes: [] },
      packageValidation: { status: "pass" },
      runtimeEvidence: { status: "pass", weak: runtimeEvidenceWeak },
      structureComparison,
      dynamicKpiMutation: dynamicKpiProof ? { status: "pass" } : {},
    },
    signingInstallUpgrade: {
      signing: { status: "not-run" },
      install: { status: "not-run" },
      upgradeApply: { status: "not-run" },
    },
    finalReport: {
      claimsVisualSuccess: true,
      artifactPaths: {
        uiContractPath: contractPath,
        scopeManifestPath: scopePath,
        scopeValidationResultPath: `${base}.scope-validation.json`,
        runtimeEvidencePath: runtimePath,
        structureFindingsPath: structurePath,
        workflowFindingsPath: workflowPath,
        ...(dynamicKpiProof ? { dynamicKpiMutationEvidencePath: mutationPath } : {}),
      },
      unresolvedFindingsReported: true,
      warningWaiverSummary: "No warnings.",
    },
  };
}

function inspectWorkflow(name, workflow) {
  return inspectUiClosedLoopWorkflowEnforcement({ workflow: writeJson(name, workflow) });
}

function expectPass(name, report) {
  assert.equal(report.status, "pass", name);
  cases.push(name);
}

function expectFail(name, report, code) {
  assert.equal(report.status, "fail", name);
  assertHasCode(report, code);
  cases.push(name);
}

function assertHasCode(report, code) {
  assert.ok(report.findings.some((finding) => finding.code === code), `expected finding ${code}`);
}

function writeJson(name, value) {
  return writeText(name, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(name, value) {
  const file = path.join(tmp, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value);
  return file;
}

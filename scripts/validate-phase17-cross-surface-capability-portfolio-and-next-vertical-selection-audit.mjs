#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const matrix = json("compatibility/capability-manifests/cross-surface-capability-portfolio-and-next-vertical-selection-matrix.v0.1.0.json");
const fixture = json("compatibility/differential-fixtures/cross-surface-capability-portfolio-export.v0.1.0.json");
const contract = json("compatibility/capability-manifests/cross-surface-capability-portfolio-and-next-vertical-selection-contract.v0.1.0.json");
const report = read("docs/architecture/yeeflow-app-builder-phase-17-cross-surface-capability-portfolio-and-next-vertical-selection-audit.v0.1.0.md");
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");

assert.equal(matrix.auditOnly, true);
assert.equal(matrix.modelsAreSeparate, true);
assert.deepEqual(matrix.families.map((item) => item.id), ["approval-form-submission-controls-and-sublist", "document-library", "dashboard", "workflow-and-runtime-expression-configuration", "top-level-data-list-outside-closed-sublist-family"]);
assert.equal(fixture.sources.length, 2);
assert(fixture.sources.every((item) => item.readOnly === true && /^[a-f0-9]{64}$/u.test(item.sha256)));
assert.equal(fixture.approvalForm.approvalFormOnly, true);
assert.equal(fixture.approvalForm.lookupColumns.length, 2);
assert(fixture.approvalForm.lookupColumns.every((column) => /^\d{19}$/u.test(column.target.listId) && /^\d{19}$/u.test(column.target.listSetId)));
assert.equal(fixture.candidateAssessment.exactExportShapeProven, true);
assert.equal(fixture.candidateAssessment.exactLegacyLoweringShapeProven, false);
assert.deepEqual(fixture.candidateAssessment.missingLegacyTokens, ["listid", "appid", "listsetid", "listfield"]);
assert.equal(contract.selectedCandidate, null);
assert.equal(contract.decision.marker, "PHASE_17_NO_SAFE_CANDIDATE");
assert.match(contract.rationale, /separate models and identities/u);
assert.throws(() => validateCandidate({ exactLegacyLoweringShapeProven: false }), /CROSS_SURFACE_APPROVAL_SUBLIST_LOOKUP_LEGACY_PARITY_MISSING/u);
assert.throws(() => validateCandidate({ exactLegacyLoweringShapeProven: true, reusesDataListModel: true }), /CROSS_SURFACE_MODEL_ISOLATION_REQUIRED/u);
assert.throws(() => validateCandidate({ exactLegacyLoweringShapeProven: true, runtimeExecution: true }), /CROSS_SURFACE_WORKFLOW_RUNTIME_OWNED/u);
assert.throws(() => validateCandidate({ exactLegacyLoweringShapeProven: true, closedSublistRoute: true }), /CROSS_SURFACE_CLOSED_SUBLIST_ROUTE_REOPENING_REJECTED/u);
for (const marker of ["CROSS_SURFACE_CAPABILITY_PORTFOLIO_AUDITED", "CROSS_SURFACE_NEXT_VERTICAL_SELECTION_VALID", "CROSS_SURFACE_NEXT_VERTICAL_SELECTION_REGRESSIONS_PASSED", "PHASE_17_NO_SAFE_CANDIDATE"]) assert(report.includes(marker));
const phase17Current = state.migration.currentPhase === matrix.phase;
const phase18ParityUnavailable = state.migration.currentPhase === "phase-18a-approval-form-sublist-lookup-legacy-parity-contract-audit" && state.migration.currentPhaseStatus === "complete" && state.proofStatus?.phase18ApprovalFormSublistLookupParity === "unavailable";
const phase18ConfigurationPreserved = state.migration.currentPhase === "phase-18b-approval-form-sublist-lookup-configuration-preservation" && state.migration.currentPhaseStatus === "complete" && state.proofStatus?.approvalFormSublistLookupConfigurationPreservation === "passed_source_archive_installed_materializer_and_rollback";
const coreExtractionProgramBaseline = ["core-extraction-program-baseline-and-finite-wave-plan", "core-extraction-wave-plan-calibration-and-proof-envelope-clustering", "core-extraction-wave-1-planning-normalization-execution", "core-extraction-wave-2-approval-form-sublist-lookup-static-configuration-projection"].includes(state.migration.currentPhase) && state.migration.currentPhaseStatus === "complete" && state.proofStatus?.coreExtractionProgramBaseline === "accepted_zero_unclassified_finite_wave_plan" && (state.migration.currentPhase !== "core-extraction-wave-plan-calibration-and-proof-envelope-clustering" || state.proofStatus?.coreExtractionProofEnvelopeCalibration === "accepted_finite_envelope_execution_model") && (state.migration.currentPhase !== "core-extraction-wave-1-planning-normalization-execution" || state.proofStatus?.coreExtractionWave1PlanningNormalization === "passed_source_archive_installed_rollback") && (state.migration.currentPhase !== "core-extraction-wave-2-approval-form-sublist-lookup-static-configuration-projection" || state.proofStatus?.coreExtractionWave2ApprovalFormSublistLookupStaticConfiguration === "passed_source_archive_installed_materializer_rollback");
assert(phase17Current || phase18ParityUnavailable || phase18ConfigurationPreserved || coreExtractionProgramBaseline);
assert.equal(state.proofStatus.crossSurfaceCapabilityPortfolio, "audited_no_safe_candidate");
console.log("CROSS_SURFACE_CAPABILITY_PORTFOLIO_AUDITED");
console.log("CROSS_SURFACE_NEXT_VERTICAL_SELECTION_VALID");
console.log("CROSS_SURFACE_NEXT_VERTICAL_SELECTION_REGRESSIONS_PASSED");
console.log("PHASE_17_NO_SAFE_CANDIDATE");

function validateCandidate(candidate) {
  if (!candidate.exactLegacyLoweringShapeProven) throw Error("CROSS_SURFACE_APPROVAL_SUBLIST_LOOKUP_LEGACY_PARITY_MISSING");
  if (candidate.reusesDataListModel) throw Error("CROSS_SURFACE_MODEL_ISOLATION_REQUIRED");
  if (candidate.runtimeExecution) throw Error("CROSS_SURFACE_WORKFLOW_RUNTIME_OWNED");
  if (candidate.closedSublistRoute) throw Error("CROSS_SURFACE_CLOSED_SUBLIST_ROUTE_REOPENING_REJECTED");
}
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }

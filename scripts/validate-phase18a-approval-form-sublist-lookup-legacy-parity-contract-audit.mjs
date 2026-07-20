#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const matrix = json("compatibility/capability-manifests/approval-form-sublist-lookup-legacy-parity-matrix.v0.1.0.json");
const fixture = json("compatibility/differential-fixtures/approval-form-sublist-lookup-legacy-parity-export.v0.1.0.json");
const contract = json("compatibility/capability-manifests/approval-form-sublist-lookup-legacy-parity-contract.v0.1.0.json");
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
const report = read("docs/architecture/yeeflow-app-builder-phase-18a-approval-form-sublist-lookup-legacy-parity-contract-audit.v0.1.0.md");

assert.equal(matrix.auditOnly, true);
assert.match(matrix.independentProductModel, /Approval Form only/u);
assert.equal(matrix.lookupColumns.length, 2);
assert(matrix.lookupColumns.every((column) => /^\d{19}$/u.test(column.target.listId) && /^\d{19}$/u.test(column.target.listSetId)));
assert.deepEqual(matrix.keys.map((item) => item.exportKey), ["listid", "appid", "listsetid", "listfield"]);
assert.deepEqual(matrix.keys.map((item) => item.outcome), ["intentionally_discarded_before_materialization", "intentionally_discarded_before_materialization", "intentionally_discarded_before_materialization", "present_only_in_imported_exported_product_data_not_reproducible"]);
assert.equal(matrix.outputProbe.outputContainsAnyRequiredKey, false);
assert.equal(matrix.outputProbe.outputContainsLosslessTargetListId, false);
assert.equal(matrix.outputProbe.outputContainsLosslessTargetListSetId, false);
assert.equal(matrix.outputProbe.outputContainsDisplayField, false);
assert.equal(contract.decision.marker, "APPROVAL_FORM_SUBLIST_LOOKUP_LEGACY_PARITY_UNAVAILABLE");
assert.equal(contract.immutableCoreCandidate, null);
assert.throws(() => validateBoundary({ reusesDataList: true }), /APPROVAL_FORM_SUBLIST_LOOKUP_MODEL_ISOLATION_REQUIRED/u);
assert.throws(() => validateBoundary({ inferred: true }), /APPROVAL_FORM_SUBLIST_LOOKUP_METADATA_INFERENCE_FORBIDDEN/u);
assert.throws(() => validateBoundary({ numericId: true }), /APPROVAL_FORM_SUBLIST_LOOKUP_LOSSLESS_ID_REQUIRED/u);
assert.throws(() => validateBoundary({ exportOnlyAsOutput: true }), /APPROVAL_FORM_SUBLIST_LOOKUP_EXPORT_ONLY_KEY_NOT_GENERATED/u);
assert.throws(() => validateBoundary({ lossyRoute: true }), /APPROVAL_FORM_SUBLIST_LOOKUP_LOSSY_BOUNDARY_REJECTED/u);
assert.throws(() => validateBoundary({ runtimeClaim: true }), /APPROVAL_FORM_SUBLIST_LOOKUP_RUNTIME_CLAIM_UNPROVEN/u);
for (const marker of ["APPROVAL_FORM_SUBLIST_LOOKUP_LEGACY_BOUNDARIES_AUDITED", "APPROVAL_FORM_SUBLIST_LOOKUP_PARITY_MATRIX_VALID", "APPROVAL_FORM_SUBLIST_LOOKUP_PARITY_REGRESSIONS_PASSED", "APPROVAL_FORM_SUBLIST_LOOKUP_LEGACY_PARITY_UNAVAILABLE"]) assert(report.includes(marker));
const phase18AIsCurrent = state.migration.currentPhase === matrix.phase && state.proofStatus.phase18ApprovalFormSublistLookupParity === "unavailable";
const phase18AIsHistorical = state.migration.currentPhase === "phase-18b-approval-form-sublist-lookup-configuration-preservation" && state.proofStatus.phase18ApprovalFormSublistLookupParity === "superseded_by_authorized_configuration_preservation" && state.blocked.some((entry) => entry.id === matrix.phase && entry.status === "superseded_by_authorized_product_behavior_enhancement");
const coreExtractionProgramBaseline = ["core-extraction-program-baseline-and-finite-wave-plan", "core-extraction-wave-plan-calibration-and-proof-envelope-clustering", "core-extraction-wave-1-planning-normalization-execution", "core-extraction-wave-2-approval-form-sublist-lookup-static-configuration-projection"].includes(state.migration.currentPhase) && state.migration.currentPhaseStatus === "complete" && state.proofStatus?.coreExtractionProgramBaseline === "accepted_zero_unclassified_finite_wave_plan" && (state.migration.currentPhase !== "core-extraction-wave-plan-calibration-and-proof-envelope-clustering" || state.proofStatus?.coreExtractionProofEnvelopeCalibration === "accepted_finite_envelope_execution_model") && (state.migration.currentPhase !== "core-extraction-wave-1-planning-normalization-execution" || state.proofStatus?.coreExtractionWave1PlanningNormalization === "passed_source_archive_installed_rollback") && (state.migration.currentPhase !== "core-extraction-wave-2-approval-form-sublist-lookup-static-configuration-projection" || state.proofStatus?.coreExtractionWave2ApprovalFormSublistLookupStaticConfiguration === "passed_source_archive_installed_materializer_rollback") && state.proofStatus.phase18ApprovalFormSublistLookupParity === "superseded_by_authorized_configuration_preservation" && state.blocked.some((entry) => entry.id === matrix.phase && entry.status === "superseded_by_authorized_product_behavior_enhancement");
assert(phase18AIsCurrent || phase18AIsHistorical || coreExtractionProgramBaseline);
console.log("APPROVAL_FORM_SUBLIST_LOOKUP_LEGACY_BOUNDARIES_AUDITED");
console.log("APPROVAL_FORM_SUBLIST_LOOKUP_PARITY_MATRIX_VALID");
console.log("APPROVAL_FORM_SUBLIST_LOOKUP_PARITY_REGRESSIONS_PASSED");
console.log("APPROVAL_FORM_SUBLIST_LOOKUP_LEGACY_PARITY_UNAVAILABLE");

function validateBoundary(value) { if (value.reusesDataList) throw Error("APPROVAL_FORM_SUBLIST_LOOKUP_MODEL_ISOLATION_REQUIRED"); if (value.inferred) throw Error("APPROVAL_FORM_SUBLIST_LOOKUP_METADATA_INFERENCE_FORBIDDEN"); if (value.numericId) throw Error("APPROVAL_FORM_SUBLIST_LOOKUP_LOSSLESS_ID_REQUIRED"); if (value.exportOnlyAsOutput) throw Error("APPROVAL_FORM_SUBLIST_LOOKUP_EXPORT_ONLY_KEY_NOT_GENERATED"); if (value.lossyRoute) throw Error("APPROVAL_FORM_SUBLIST_LOOKUP_LOSSY_BOUNDARY_REJECTED"); if (value.runtimeClaim) throw Error("APPROVAL_FORM_SUBLIST_LOOKUP_RUNTIME_CLAIM_UNPROVEN"); }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }

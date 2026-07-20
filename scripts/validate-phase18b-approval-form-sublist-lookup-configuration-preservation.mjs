#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-18b-approval-form-sublist-lookup-configuration-preservation";
const fixture = json("compatibility/differential-fixtures/approval-form-sublist-lookup-configuration-preservation.v0.1.0.json");
const contract = json("compatibility/capability-manifests/approval-form-sublist-lookup-configuration-preservation.v0.1.0.json");
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
const report = read("docs/architecture/yeeflow-app-builder-phase-18b-approval-form-sublist-lookup-configuration-preservation.v0.1.0.md");
const lowerer = read("scripts/lib/approval-form-layout-builder.mjs");
const materializer = read("scripts/materialize-full-app-generated-final.mjs");
assert.equal(fixture.phase, phase); assert.equal(contract.phase, phase); assert.equal(fixture.exportColumns.length, 2);
assert(fixture.exportColumns.every((column) => /^\d{19}$/u.test(column.target.listId) && /^\d{19}$/u.test(column.target.listSetId) && column.target.appId === "41" && column.target.displayField === "Title"));
assert(fixture.expectedGeneratedAttributes.every((entry) => entry.type === "lookup" && entry.attrs.appid === 41 && /^\d{19}$/u.test(entry.attrs.listid) && /^\d{19}$/u.test(entry.attrs.listsetid)));
assert.match(fixture.modelIsolation, /No Data List/u); assert.equal(contract.marker, "APPROVAL_FORM_SUBLIST_LOOKUP_CONFIGURATION_PRESERVATION_PASSED");
assert(contract.authoritativeScope.runtimeExcluded.includes("runtime lookup execution")); assert.match(contract.historicalSupersession.disposition, /superseded/u);
assert(materializer.includes("lookupDisplayField: lookup?.displayField")); assert(lowerer.includes("normalizeApprovalSubListLookupConfiguration")); assert(lowerer.includes("listid: rowField.lookupConfiguration.listId"));
const phase18BIsCurrent = state.migration.currentPhase === phase;
const coreExtractionProgramBaseline = ["core-extraction-program-baseline-and-finite-wave-plan", "core-extraction-wave-plan-calibration-and-proof-envelope-clustering", "core-extraction-wave-1-planning-normalization-execution", "core-extraction-wave-2-approval-form-sublist-lookup-static-configuration-projection"].includes(state.migration.currentPhase) && state.migration.currentPhaseStatus === "complete" && state.proofStatus?.coreExtractionProgramBaseline === "accepted_zero_unclassified_finite_wave_plan" && (state.migration.currentPhase !== "core-extraction-wave-plan-calibration-and-proof-envelope-clustering" || state.proofStatus?.coreExtractionProofEnvelopeCalibration === "accepted_finite_envelope_execution_model") && (state.migration.currentPhase !== "core-extraction-wave-1-planning-normalization-execution" || state.proofStatus?.coreExtractionWave1PlanningNormalization === "passed_source_archive_installed_rollback") && (state.migration.currentPhase !== "core-extraction-wave-2-approval-form-sublist-lookup-static-configuration-projection" || state.proofStatus?.coreExtractionWave2ApprovalFormSublistLookupStaticConfiguration === "passed_source_archive_installed_materializer_rollback");
assert(phase18BIsCurrent || coreExtractionProgramBaseline); assert.equal(state.proofStatus.approvalFormSublistLookupConfigurationPreservation, "passed_source_archive_installed_materializer_and_rollback");
assert(state.blocked.some((entry) => entry.id === "phase-18a-approval-form-sublist-lookup-legacy-parity-contract-audit" && entry.status === "superseded_by_authorized_product_behavior_enhancement"));
for (const marker of [contract.marker, "APPROVAL_FORM_SUBLIST_LOOKUP_SOURCE_PARITY_PASSED", "APPROVAL_FORM_SUBLIST_LOOKUP_ARCHIVE_PARITY_PASSED", "APPROVAL_FORM_SUBLIST_LOOKUP_INSTALLED_PARITY_PASSED", "APPROVAL_FORM_SUBLIST_LOOKUP_MATERIALIZER_CONFIGURATION_PARITY_PASSED", "APPROVAL_FORM_SUBLIST_LOOKUP_LEGACY_ROLLBACK_PASSED"]) assert(report.includes(marker));
console.log("APPROVAL_FORM_SUBLIST_LOOKUP_CONFIGURATION_CONTRACT_VALID"); console.log("APPROVAL_FORM_SUBLIST_LOOKUP_CONFIGURATION_REGRESSIONS_PASSED");
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }

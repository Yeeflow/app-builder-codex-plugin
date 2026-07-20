#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = json(argument("--contract", "compatibility/capability-manifests/data-list-sublist-dynamic-summary-family-closure.v0.1.0.json"));
const routing = json("compatibility/capability-manifests/data-list-sublist-dynamic-summary-intent-production-routing.v0.1.0.json");
const source = read(argument("--source", "scripts/materialize-full-app-generated-final.mjs"));
const lineagePath = argument("--lineage", "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json");
const lineage = json(lineagePath);
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
const expectedFamilies = ["temporary-variable allocation discovery writeback and cleanup", "runtime expressions and dynamic calculations", "scope lifecycle and stale-binding validation", "Rules control template and resource binding", "nested-control and non-scalar summaries", "Lookup identity binary barcode and actions", "Approval Form Workflow Dashboard and package orchestration"];
const laterApprovedRouting = lineage.approvedTransitions?.find((item) => ["phase-14f-data-list-sublist-lookup-additional-field-configuration-selective-routing-proof", "phase-16e-data-list-sublist-identity-control-selective-routing-proof", "phase-18b-approval-form-sublist-lookup-configuration-preservation"].includes(item.phase) && item.sourceTransition?.afterSha256 === sha(source));

if (contract.phase !== "phase-11g-sublist-summary-dynamic-family-closure-audit" || contract.decision?.status !== "accepted" || contract.decision?.marker !== "PHASE_11_CLOSURE_ACCEPTED" || contract.decision?.additionalSafeDynamicSummaryVerticals !== 0) fail("SUBLIST_DYNAMIC_SUMMARY_FAMILY_CLOSURE_DECISION_INVALID");
if (JSON.stringify(contract.approvedRoute?.bindingModels) !== JSON.stringify(["__list_", "__temp_"]) || JSON.stringify(contract.approvedRoute?.scalarSourceTypes) !== JSON.stringify(["number", "decimal"]) || contract.approvedRoute?.context !== "per Type 1 Data List layout resource" || contract.approvedRoute?.core !== "projectDataListSublistDynamicSummaryIntent" || contract.approvedRoute?.localRuntime !== "lowerDataListSublistDynamicSummaryIntentAtHost") fail("SUBLIST_DYNAMIC_SUMMARY_APPROVED_ROUTE_INVALID");
if (JSON.stringify(contract.deferredFamilies?.map((item) => item.family)) !== JSON.stringify(expectedFamilies) || contract.deferredFamilies.some((item) => !item.legacyBoundary || !item.reason) || contract.invariants?.summaryUuidStandaloneIdentity !== false || contract.invariants?.tempVarNameStandaloneIdentity !== false || contract.invariants?.approvalFormComparisonOnly !== true || contract.invariants?.productionRouteChangedByAudit !== false) fail("SUBLIST_DYNAMIC_SUMMARY_FAMILY_MATRIX_INVALID");
if (((contract.sourceSha256 !== sha(source) || routing.sourceTransition?.afterSha256 !== sha(source)) && !laterApprovedRouting) || routing.route?.selectionCountPerSummary !== 1 || !source.includes("DATA_LIST_SUBLIST_DYNAMIC_SUMMARY_CORE_ROUTE_START") || !source.includes("ensureDataListSubListSummaryTempVars(resource)") || source.includes("coreProjectDataListSublistDynamicSummaryIntent({ tempVars")) fail("SUBLIST_DYNAMIC_SUMMARY_ROUTE_RECONFIRMATION_FAILED");
if ((contract.lineageSha256 !== sha(read(lineagePath)) && !laterApprovedRouting) || !lineage.approvedTransitions?.some((item) => item.phase === routing.phase)) fail("PHASE_CLOSURE_PROOF_LINEAGE_INVALID");
const phase15NoSafeCandidate = state.migration?.currentPhase === "phase-15-data-list-sublist-remaining-configuration-family-selection-contract-audit" && state.migration?.currentPhaseStatus === "complete" && state.proofStatus?.phase15ConfigurationSelection === "no_safe_candidate";
const phase16Closed = state.migration?.currentPhase === "phase-16-data-list-sublist-identity-control-configuration-closure" && state.migration?.currentPhaseStatus === "complete" && state.proofStatus?.phase16IdentityControlFamilyClosure === "accepted";
const phase17PortfolioAudited = state.migration?.currentPhase === "phase-17-cross-surface-capability-portfolio-and-next-vertical-selection-audit" && state.migration?.currentPhaseStatus === "complete" && state.proofStatus?.phase17NextVerticalSelection === "no_safe_candidate";
const phase18ParityUnavailable = state.migration?.currentPhase === "phase-18a-approval-form-sublist-lookup-legacy-parity-contract-audit" && state.migration?.currentPhaseStatus === "complete" && state.proofStatus?.phase18ApprovalFormSublistLookupParity === "unavailable";
const phase18ConfigurationPreserved = state.migration?.currentPhase === "phase-18b-approval-form-sublist-lookup-configuration-preservation" && state.migration?.currentPhaseStatus === "complete" && state.proofStatus?.approvalFormSublistLookupConfigurationPreservation === "passed_source_archive_installed_materializer_and_rollback";
const coreExtractionProgramBaseline = ["core-extraction-program-baseline-and-finite-wave-plan", "core-extraction-wave-plan-calibration-and-proof-envelope-clustering", "core-extraction-wave-1-planning-normalization-execution", "core-extraction-wave-2-approval-form-sublist-lookup-static-configuration-projection"].includes(state.migration?.currentPhase) && state.migration?.currentPhaseStatus === "complete" && state.proofStatus?.coreExtractionProgramBaseline === "accepted_zero_unclassified_finite_wave_plan" && (state.migration?.currentPhase !== "core-extraction-wave-plan-calibration-and-proof-envelope-clustering" || state.proofStatus?.coreExtractionProofEnvelopeCalibration === "accepted_finite_envelope_execution_model") && (state.migration?.currentPhase !== "core-extraction-wave-1-planning-normalization-execution" || state.proofStatus?.coreExtractionWave1PlanningNormalization === "passed_source_archive_installed_rollback") && (state.migration?.currentPhase !== "core-extraction-wave-2-approval-form-sublist-lookup-static-configuration-projection" || state.proofStatus?.coreExtractionWave2ApprovalFormSublistLookupStaticConfiguration === "passed_source_archive_installed_materializer_rollback");
if (contract.historicalZipSha256 !== "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2" || (!(state.migration?.currentPhase === contract.phase && state.migration?.currentPhaseStatus === "complete" && state.migration?.overallStatus === "complete" && state.migration?.nextPhase === "") && !phase15NoSafeCandidate && !phase16Closed && !phase17PortfolioAudited && !phase18ParityUnavailable && !phase18ConfigurationPreserved && !coreExtractionProgramBaseline) || state.proofStatus?.dataListSublistDynamicSummaryFamilyClosure !== "accepted" || state.proofStatus?.phase11Closure !== "accepted") fail("SUBLIST_DYNAMIC_SUMMARY_FAMILY_CLOSURE_STATE_INVALID");
console.log("SUBLIST_DYNAMIC_SUMMARY_ROUTE_RECONFIRMED");
console.log("SUBLIST_DYNAMIC_SUMMARY_TEMP_VARIABLE_NONINTERFERENCE_RECONFIRMED");
console.log("SUBLIST_DYNAMIC_SUMMARY_FAMILY_CLOSURE_VALID");
console.log("PHASE_11_CLOSURE_ACCEPTED");
console.log("PHASE_CLOSURE_PROOF_LINEAGE_VALID");

function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code) { console.error(code); process.exit(1); }

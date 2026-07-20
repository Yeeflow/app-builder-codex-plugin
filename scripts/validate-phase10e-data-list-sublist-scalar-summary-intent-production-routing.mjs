#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = json(argument("--contract", "compatibility/capability-manifests/data-list-sublist-scalar-summary-intent-production-routing.v0.1.0.json"));
const source = read(argument("--source", "scripts/materialize-full-app-generated-final.mjs"));
const coreAdapter = read(argument("--core-adapter", "scripts/lib/materializer-core-adapter.mjs"));
const runtimeAdapter = read(argument("--runtime-adapter", "scripts/lib/local-runtime-core-adapter.mjs"));
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
const lineage = json("compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json");
const corpus = json("compatibility/differential-fixtures/data-list-sublist-scalar-summary-intent-production-routing.v0.1.0.json");
const historicalZip = readFileSync(resolve(root, "dist/yeeflow-app-builder-plugin-0.9.71.zip"));

if (contract.phase !== "phase-10e-data-list-sublist-scalar-summary-intent-selective-routing-proof" || contract.decision?.status !== "complete" || contract.decision?.marker !== "SUBLIST_SCALAR_SUMMARY_INTENT_ADAPTER_ROUTING_PASSED") fail("SUBLIST_SCALAR_SUMMARY_INTENT_ROUTING_CONTRACT_INVALID");
if (contract.route?.boundary !== "buildDataListFormSubListControl -> normalizeDataListSubListSummaries -> ensureDataListSubListSummaryTempVars" || contract.route?.normalizationCallerCount !== 1 || contract.route?.coreSelectionCount !== 1 || contract.route?.localRuntimeLoweringCount !== 1) fail("SUBLIST_SCALAR_SUMMARY_INTENT_ROUTE_BOUNDARY_INVALID");
if (JSON.stringify(contract.route?.operations) !== JSON.stringify(["total", "average", "minimum", "maximum", "count"]) || contract.temporaryVariableBoundary?.owner !== "Legacy ensureDataListSubListSummaryTempVars") fail("SUBLIST_SCALAR_SUMMARY_INTENT_SCOPE_INVALID");
for (const token of ["DATA_LIST_SUBLIST_SCALAR_SUMMARY_INTENT_CORE_ROUTE_START", "DATA_LIST_SUBLIST_SCALAR_SUMMARY_INTENT_CORE_ROUTE_END", "coreProjectDataListSublistScalarSummaryIntent", "coreLowerDataListSublistScalarSummaryIntentAtHost", "ensureDataListSubListSummaryTempVars(resource)"]) if (!source.includes(token)) fail("SUBLIST_SCALAR_SUMMARY_INTENT_ROUTE_MISSING");
if ((source.match(/coreProjectDataListSublistScalarSummaryIntent\(/gu) || []).length !== 1 || (source.match(/coreLowerDataListSublistScalarSummaryIntentAtHost\(/gu) || []).length !== 1) fail("SUBLIST_SCALAR_SUMMARY_INTENT_DUPLICATE_ROUTING");
const route = source.slice(source.indexOf("function normalizeDataListSubListSummaries"), source.indexOf("function ensureDataListSubListSummaryTempVars"));
for (const forbidden of ["tempVars", "resource.", "push(", "globalThis", "new Map()", "binding: {"]) if (route.includes(forbidden)) fail("SUBLIST_SCALAR_SUMMARY_INTENT_TEMP_VARIABLE_OR_GLOBAL_LEAKAGE");
if (!coreAdapter.includes("export const projectDataListSublistScalarSummaryIntent = core.projectDataListSublistScalarSummaryIntent;") || !runtimeAdapter.includes("export const lowerDataListSublistScalarSummaryIntentAtHost = runtime.lowerDataListSublistScalarSummaryIntentAtHost;")) fail("SUBLIST_SCALAR_SUMMARY_INTENT_ADAPTER_EXPORT_MISSING");
if (corpus.caseCount !== 12 || corpus.eligibleStaticCases?.length !== 5 || corpus.requiredTempVar !== "leaveTotalTemp") fail("SUBLIST_SCALAR_SUMMARY_INTENT_CORPUS_INVALID");
const phase11bBlocked = state.migration?.currentPhase === "phase-11b-sublist-summary-runtime-temporary-variable-scope-evidence-audit" && state.migration?.currentPhaseStatus === "blocked" && state.migration?.overallStatus === "blocked" && state.migration?.nextPhase === "" && state.proofStatus?.dataListSublistSummaryTempVariableScopeEvidence === "blocked_missing_external_product_runtime_scope_evidence";
const phase11bExportAccepted = state.migration?.currentPhase === "phase-11b-sublist-summary-runtime-temporary-variable-scope-evidence-audit" && state.migration?.currentPhaseStatus === "complete" && state.migration?.overallStatus === "in_progress" && state.migration?.nextPhase === "phase-11c-sublist-summary-scoped-dynamic-intent-internal-shadow" && state.proofStatus?.dataListSublistSummaryTempVariableScopeEvidence === "accepted_export_proven_nonserialized_host_context";
const phase11cShadowAccepted = state.migration?.currentPhase === "phase-11c-sublist-summary-scoped-dynamic-intent-internal-shadow" && state.migration?.currentPhaseStatus === "complete" && state.migration?.nextPhase === "phase-11d-sublist-summary-dynamic-intent-dual-public-distribution-readiness" && state.proofStatus?.phase11DynamicSummaryMigration === "shadow_passed_internal_only";
const phase11eDistributionPassed = state.migration?.currentPhase === "phase-11e-sublist-summary-dynamic-intent-dual-public-distribution-promotion" && state.migration?.currentPhaseStatus === "complete" && state.migration?.nextPhase === "phase-11f-sublist-summary-dynamic-intent-selective-routing-proof" && state.proofStatus?.dataListSublistDynamicSummaryIntentPublicDistribution === "passed";
const phase11FamilyClosed = state.migration?.currentPhase === "phase-11g-sublist-summary-dynamic-family-closure-audit" && state.migration?.currentPhaseStatus === "complete" && state.migration?.overallStatus === "complete" && state.migration?.nextPhase === "" && state.proofStatus?.phase11Closure === "accepted";
if (!((state.migration?.currentPhase === contract.phase && state.migration?.currentPhaseStatus === "complete" && state.proofStatus?.dataListSublistScalarSummaryIntentRouting === "passed") || (state.migration?.currentPhase === "phase-10f-data-list-sublist-summary-family-closure-audit" && state.migration?.currentPhaseStatus === "complete" && state.migration?.nextPhase === "phase-11-sublist-summary-runtime-temporary-variable-contract-audit" && state.proofStatus?.dataListSublistScalarSummaryIntentRouting === "passed" && state.proofStatus?.phase10Closure === "accepted") || (state.migration?.currentPhase === "phase-11a-data-list-sublist-summary-runtime-temporary-variable-lifecycle-and-scope-contract-audit" && state.migration?.currentPhaseStatus === "complete" && state.migration?.nextPhase === "phase-11b-sublist-summary-runtime-temporary-variable-scope-evidence-audit" && state.proofStatus?.dataListSublistScalarSummaryIntentRouting === "passed" && state.proofStatus?.phase10Closure === "accepted") || (phase11bBlocked && state.proofStatus?.dataListSublistScalarSummaryIntentRouting === "passed" && state.proofStatus?.phase10Closure === "accepted") || (phase11bExportAccepted && state.proofStatus?.dataListSublistScalarSummaryIntentRouting === "passed" && state.proofStatus?.phase10Closure === "accepted") || (phase11cShadowAccepted && state.proofStatus?.dataListSublistScalarSummaryIntentRouting === "passed" && state.proofStatus?.phase10Closure === "accepted") || (phase11eDistributionPassed && state.proofStatus?.dataListSublistScalarSummaryIntentRouting === "passed" && state.proofStatus?.phase10Closure === "accepted") || (phase11FamilyClosed && state.proofStatus?.dataListSublistScalarSummaryIntentRouting === "passed" && state.proofStatus?.phase10Closure === "accepted"))) fail("SUBLIST_SCALAR_SUMMARY_INTENT_STATE_INVALID");
if (!lineage.approvedTransitions?.some((entry) => entry.phase === contract.phase && entry.requiredEvidenceMarker === "SUBLIST_SCALAR_SUMMARY_INTENT_ADAPTER_ROUTING_PASSED")) fail("PHASE_CLOSURE_PROOF_LINEAGE_INVALID");
if (sha(historicalZip) !== "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2") fail("SUBLIST_SCALAR_SUMMARY_INTENT_HISTORICAL_ZIP_CHANGED");
console.log("SUBLIST_SCALAR_SUMMARY_INTENT_ADAPTER_ROUTING_PASSED");
console.log("SUBLIST_SCALAR_SUMMARY_INTENT_ROUTING_SCOPE_GATES_PASSED");

function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code) { console.error(code); process.exit(1); }

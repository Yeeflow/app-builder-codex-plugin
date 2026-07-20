#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = argument("--contract", "compatibility/capability-manifests/data-list-sublist-dynamic-summary-intent-production-routing.v0.1.0.json");
const contract = json(contractPath);
const source = read(argument("--source", "scripts/materialize-full-app-generated-final.mjs"));
const context = read(argument("--context", "scripts/lib/data-list-sublist-dynamic-summary-host-scope-context.mjs"));
const materializerAdapter = read(argument("--materializer-adapter", "scripts/lib/materializer-core-adapter.mjs"));
const runtimeAdapter = read(argument("--runtime-adapter", "scripts/lib/local-runtime-core-adapter.mjs"));
const fixture = json("compatibility/differential-fixtures/data-list-sublist-dynamic-summary-intent-production-routing.v0.1.0.json");
const lineagePath = argument("--lineage", "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json");
const lineage = json(lineagePath);
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const artifactState = Object.fromEntries(distribution.artifacts.map((item) => [item.packageName, { path: item.path, sha256: item.sha256 }]));
const transition = lineage.approvedTransitions?.find((item) => item.phase === contract.phase);

if (contract.phase !== "phase-11f-sublist-summary-dynamic-intent-selective-routing-proof" || contract.decision?.status !== "complete" || contract.decision?.marker !== "SUBLIST_DYNAMIC_SUMMARY_ADAPTER_ROUTING_PASSED" || contract.decision?.nextPhase !== "phase-11g-sublist-summary-dynamic-family-closure-audit") fail("SUBLIST_DYNAMIC_SUMMARY_ROUTING_CONTRACT_INVALID");
if (contract.route?.boundary !== "materializeDataListFormResource -> ensureDataListSubListSummaryTempVars -> routeDataListSublistDynamicSummaryIntentsAtHost" || JSON.stringify(contract.route?.bindingModels) !== JSON.stringify(["__list_", "__temp_"]) || contract.route?.selectionCountPerSummary !== 1 || contract.route?.hostContext !== "one non-serialized context per Type 1 layout resource" || fixture.caseCount !== contract.corpus?.caseCount || fixture.caseCount !== 12 || fixture.eligibleCases?.length !== 2 || fixture.negativeCases?.length !== 10) fail("SUBLIST_DYNAMIC_SUMMARY_ROUTING_SCOPE_INVALID");
if (sha(source) !== contract.sourceTransition?.afterSha256 || !contract.sourceTransition.requiredSourceTokens.every((token) => source.includes(token)) || count(source, "\n  routeDataListSublistDynamicSummaryIntentsAtHost({ resource, fields, listId, layoutId });") !== 1 || count(source, "coreProjectDataListSublistDynamicSummaryIntent(") !== 1 || count(source, "coreLowerDataListSublistDynamicSummaryIntentAtHost(") !== 1) fail("SUBLIST_DYNAMIC_SUMMARY_ROUTING_SOURCE_INVALID");
if (!materializerAdapter.includes("projectDataListSublistDynamicSummaryIntent") || !runtimeAdapter.includes("lowerDataListSublistDynamicSummaryIntentAtHost") || !context.includes("const privateState = new WeakMap()") || !context.includes("Object.freeze(context)") || !context.includes("SUBLIST_DYNAMIC_SUMMARY_CONTEXT_DISPOSED") || !context.includes("SUBLIST_DYNAMIC_SUMMARY_SUMMARY_STANDALONE_FORBIDDEN") || !context.includes("SUBLIST_DYNAMIC_SUMMARY_APPROVAL_FORM_EXCLUDED") || context.includes("globalThis") || context.includes("JSON.stringify")) fail("SUBLIST_DYNAMIC_SUMMARY_HOST_CONTEXT_GUARD_INVALID");
if (context.includes("tempVars.push") || context.includes("resource.tempVars =") || context.includes("binding: {") || source.includes("DATA_LIST_SUBLIST_DYNAMIC_SUMMARY_CORE_ROUTE_START\n  resource.tempVars")) fail("SUBLIST_DYNAMIC_SUMMARY_TEMP_VARIABLE_INTERFERENCE");
if (!transition || transition.kind !== "routing" || transition.requiredEvidenceMarker !== contract.decision.marker || transition.evidencePath !== contractPath || transition.evidenceSha256 !== sha(read(contractPath)) || transition.reportSha256 !== sha(read(transition.reportPath)) || transition.sourceTransition?.afterSha256 !== sha(source) || JSON.stringify(transition.beforeArtifactState) !== JSON.stringify(artifactState) || JSON.stringify(transition.artifactState) !== JSON.stringify(artifactState) || transition.allowedFiles.some((path) => path.includes("*") || path.endsWith("/"))) fail("PHASE_11F_ROUTING_LINEAGE_INVALID");
if (contract.historicalZipSha256 !== "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2" || !["phase-11f-sublist-summary-dynamic-intent-selective-routing-proof", "phase-11g-sublist-summary-dynamic-family-closure-audit"].includes(state.migration?.currentPhase) || state.migration?.currentPhaseStatus !== "complete" || state.proofStatus?.dataListSublistDynamicSummaryIntentRouting !== "passed") fail("SUBLIST_DYNAMIC_SUMMARY_ROUTING_STATE_INVALID");
console.log("SUBLIST_DYNAMIC_SUMMARY_ADAPTER_ROUTING_PASSED");
console.log("SUBLIST_DYNAMIC_SUMMARY_HOST_CONTEXT_ROUTING_PASSED");
console.log("SUBLIST_DYNAMIC_SUMMARY_ROUTING_SCOPE_GATES_PASSED");
console.log("PHASE_CLOSURE_PROOF_LINEAGE_VALID");

function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function count(value, needle) { return value.split(needle).length - 1; }
function fail(code) { console.error(code); process.exit(1); }

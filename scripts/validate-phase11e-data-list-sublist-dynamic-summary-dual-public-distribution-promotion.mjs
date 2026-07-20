#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = option("--contract", "compatibility/capability-manifests/data-list-sublist-dynamic-summary-intent-dual-public-distribution-promotion.v0.1.0.json");
const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
const contract = json(contractPath);
const lineage = json(lineagePath);
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const source = read("scripts/materialize-full-app-generated-final.mjs");
const artifactState = Object.fromEntries(distribution.artifacts.map((artifact) => [artifact.packageName, { path: artifact.path, sha256: artifact.sha256 }]));
const transition = lineage.approvedTransitions?.find((item) => item.phase === contract.phase);
const markers = ["SUBLIST_DYNAMIC_SUMMARY_INTENT_CORE_PUBLIC_API_CONTRACT_PASSED", "SUBLIST_DYNAMIC_SUMMARY_INTENT_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_PASSED", "SUBLIST_DYNAMIC_SUMMARY_DUAL_DISTRIBUTION_VALID", "SUBLIST_DYNAMIC_SUMMARY_ARTIFACT_SOURCE_PARITY_PASSED", "SUBLIST_DYNAMIC_SUMMARY_ARTIFACT_ARCHIVE_PARITY_PASSED", "SUBLIST_DYNAMIC_SUMMARY_ARTIFACT_INSTALLED_PARITY_PASSED", "SUBLIST_DYNAMIC_SUMMARY_DISTRIBUTION_GATES_PASSED", "PHASE_CLOSURE_PROOF_LINEAGE_VALID"];
if (contract.phase !== "phase-11e-sublist-summary-dynamic-intent-dual-public-distribution-promotion" || contract.decision?.status !== "complete" || contract.decision?.marker !== "SUBLIST_DYNAMIC_SUMMARY_DUAL_DISTRIBUTION_VALID" || contract.decision?.nextPhase !== "phase-11f-sublist-summary-dynamic-intent-selective-routing-proof" || JSON.stringify(contract.publicExports) !== JSON.stringify(["projectDataListSublistDynamicSummaryIntent", "lowerDataListSublistDynamicSummaryIntentAtHost"]) || JSON.stringify(contract.verificationMarkers) !== JSON.stringify(markers)) fail("SUBLIST_DYNAMIC_SUMMARY_DUAL_DISTRIBUTION_PROMOTION_CONTRACT_INVALID");
if (contract.corpus?.caseCount !== 16 || contract.corpus?.surfaces?.length !== 4 || !contract.temporaryVariableBoundary?.includes("Neither API receives an inventory") || !contract.temporaryVariableBoundary.includes("scope validation") || !contract.temporaryVariableBoundary.includes("runtime execution")) fail("SUBLIST_DYNAMIC_SUMMARY_DUAL_DISTRIBUTION_BOUNDARY_INVALID");
const approvedRoutingSha = lineage.approvedTransitions?.find((item) => item.phase === "phase-11f-sublist-summary-dynamic-intent-selective-routing-proof")?.sourceTransition?.afterSha256;
if (contract.productionMaterializer?.path !== "scripts/materialize-full-app-generated-final.mjs" || contract.productionMaterializer?.changed !== false || ![contract.productionMaterializer?.afterSha256, approvedRoutingSha].includes(sha(source)) || contract.historicalZipSha256 !== "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2") fail("SUBLIST_DYNAMIC_SUMMARY_DUAL_DISTRIBUTION_PRODUCTION_DRIFT");
if (transition?.phase !== contract.phase || transition.kind !== "artifact-only" || transition.requiredEvidenceMarker !== contract.decision.marker || transition.promotionContractPath !== contractPath || transition.promotionContractSha256 !== sha(read(contractPath)) || transition.promotionReportSha256 !== sha(read(transition.promotionReportPath)) || JSON.stringify(transition.artifactState) !== JSON.stringify(artifactState) || JSON.stringify(contract.artifactTransition?.after) !== JSON.stringify(artifactState) || !transition.allowedFiles?.includes("scripts/test-data-list-sublist-dynamic-summary-intent-distribution.mjs") || transition.allowedFiles.some((path) => path.includes("*") || path.endsWith("/"))) fail("SUBLIST_DYNAMIC_SUMMARY_DUAL_DISTRIBUTION_LINEAGE_INVALID");
if (!([contract.phase, "phase-11f-sublist-summary-dynamic-intent-selective-routing-proof", "phase-11g-sublist-summary-dynamic-family-closure-audit"].includes(state.migration?.currentPhase)) || state.migration?.currentPhaseStatus !== "complete" || state.proofStatus?.dataListSublistDynamicSummaryIntentPublicDistribution !== "passed" || state.proofStatus?.dataListSublistDynamicSummaryDualDistributionReadiness !== "passed") fail("SUBLIST_DYNAMIC_SUMMARY_DUAL_DISTRIBUTION_STATE_INVALID");
console.log("SUBLIST_DYNAMIC_SUMMARY_DUAL_DISTRIBUTION_VALID");
console.log("SUBLIST_DYNAMIC_SUMMARY_DISTRIBUTION_GATES_PASSED");

function option(name, fallback) { const index = process.argv.indexOf(name); return index < 0 ? fallback : process.argv[index + 1]; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code) { console.error(code); process.exit(1); }

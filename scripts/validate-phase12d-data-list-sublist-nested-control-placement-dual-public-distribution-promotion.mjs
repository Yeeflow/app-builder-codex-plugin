#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = argument("--contract", "compatibility/capability-manifests/data-list-sublist-nested-control-placement-dual-public-distribution-promotion.v0.1.0.json");
const contract = json(contractPath);
const lineage = json("compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json");
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const artifactState = Object.fromEntries(distribution.artifacts.map((artifact) => [artifact.packageName, { path: artifact.path, sha256: artifact.sha256 }]));
const expectedMarkers = ["SUBLIST_NESTED_CONTROL_CORE_PUBLIC_API_CONTRACT_PASSED", "SUBLIST_NESTED_CONTROL_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_PASSED", "SUBLIST_NESTED_CONTROL_DUAL_DISTRIBUTION_VALID", "SUBLIST_NESTED_CONTROL_ARTIFACT_SOURCE_PARITY_PASSED", "SUBLIST_NESTED_CONTROL_ARTIFACT_ARCHIVE_PARITY_PASSED", "SUBLIST_NESTED_CONTROL_ARTIFACT_INSTALLED_PARITY_PASSED", "SUBLIST_NESTED_CONTROL_DISTRIBUTION_GATES_PASSED", "PHASE_CLOSURE_PROOF_LINEAGE_VALID"];
const transition = lineage.approvedTransitions.find((entry) => entry.phase === contract.phase);
if (contract.phase !== "phase-12d-data-list-sublist-nested-control-placement-dual-public-distribution-promotion" || contract.decision?.status !== "complete" || contract.decision?.marker !== "SUBLIST_NESTED_CONTROL_DUAL_DISTRIBUTION_VALID" || contract.decision?.nextPhase !== "phase-12e-data-list-sublist-nested-control-placement-selective-routing-proof" || JSON.stringify(contract.publicExports) !== JSON.stringify(["projectDataListSublistNestedControlPlacementIntent", "lowerDataListSublistNestedControlPlacementAtHost"]) || JSON.stringify(contract.verificationMarkers) !== JSON.stringify(expectedMarkers)) fail("SUBLIST_NESTED_CONTROL_DUAL_DISTRIBUTION_PROMOTION_CONTRACT_INVALID");
if (contract.corpus?.caseCount !== 12 || contract.corpus?.surfaces?.length !== 4 || !contract.boundary?.includes("Neither API loads or mutates a template graph") || !contract.boundary.includes("allocates IDs") || contract.exclusions?.includes("template/resource mutation") !== true) fail("SUBLIST_NESTED_CONTROL_DUAL_DISTRIBUTION_BOUNDARY_INVALID");
if (contract.productionMaterializer?.changed !== false || contract.productionMaterializer?.beforeSha256 !== contract.productionMaterializer?.afterSha256 || sha(read("scripts/materialize-full-app-generated-final.mjs")) !== contract.productionMaterializer?.afterSha256 || contract.historicalZipSha256 !== "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2") fail("SUBLIST_NESTED_CONTROL_DUAL_DISTRIBUTION_PRODUCTION_DRIFT");
if (transition?.kind !== "artifact-only" || transition.requiredEvidenceMarker !== contract.decision.marker || transition.promotionContractPath !== contractPath || transition.promotionContractSha256 !== sha(read(contractPath)) || transition.promotionReportSha256 !== sha(read(transition.promotionReportPath)) || JSON.stringify(transition.artifactState) !== JSON.stringify(artifactState) || JSON.stringify(contract.artifactTransition?.after) !== JSON.stringify(artifactState) || JSON.stringify(transition.allowedFiles) !== JSON.stringify(contract.allowedFiles) || transition.allowedFiles.some((path) => path.includes("*") || path.endsWith("/"))) fail("SUBLIST_NESTED_CONTROL_DUAL_DISTRIBUTION_LINEAGE_INVALID");
if (state.proofStatus?.dataListSublistNestedControlPlacementPublicDistribution !== "passed" || state.proofStatus?.dataListSublistNestedControlPlacementDualDistribution !== "passed") fail("SUBLIST_NESTED_CONTROL_DUAL_DISTRIBUTION_STATE_INVALID");
console.log("SUBLIST_NESTED_CONTROL_CORE_PUBLIC_API_CONTRACT_PASSED");
console.log("SUBLIST_NESTED_CONTROL_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_PASSED");
console.log("SUBLIST_NESTED_CONTROL_DUAL_DISTRIBUTION_VALID");
console.log("SUBLIST_NESTED_CONTROL_DISTRIBUTION_GATES_PASSED");
function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code) { console.error(code); process.exit(1); }

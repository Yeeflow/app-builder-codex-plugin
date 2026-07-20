#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-12d-data-list-sublist-nested-control-placement-dual-public-distribution-promotion";
const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
const closurePath = "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json";
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json";
const contractPath = "compatibility/capability-manifests/data-list-sublist-nested-control-placement-dual-public-distribution-promotion.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-12d-data-list-sublist-nested-control-placement-dual-public-distribution-promotion.v0.1.0.md";
const lineage = json(lineagePath);
const previous = lineage.approvedTransitions.at(-1);
const sourceSha = sha(read("scripts/materialize-full-app-generated-final.mjs"));
if (previous?.phase !== "phase-11f-sublist-summary-dynamic-intent-selective-routing-proof" || previous.sourceTransition?.afterSha256 !== sourceSha || lineage.approvedTransitions.some((entry) => entry.phase === phase)) throw Error("PHASE_12D_LINEAGE_BASELINE_INVALID");
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const artifactState = Object.fromEntries(distribution.artifacts.map((artifact) => [artifact.packageName, { path: artifact.path, sha256: artifact.sha256 }]));
const markers = ["SUBLIST_NESTED_CONTROL_CORE_PUBLIC_API_CONTRACT_PASSED", "SUBLIST_NESTED_CONTROL_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_PASSED", "SUBLIST_NESTED_CONTROL_DUAL_DISTRIBUTION_VALID", "SUBLIST_NESTED_CONTROL_ARTIFACT_SOURCE_PARITY_PASSED", "SUBLIST_NESTED_CONTROL_ARTIFACT_ARCHIVE_PARITY_PASSED", "SUBLIST_NESTED_CONTROL_ARTIFACT_INSTALLED_PARITY_PASSED", "SUBLIST_NESTED_CONTROL_DISTRIBUTION_GATES_PASSED", "PHASE_CLOSURE_PROOF_LINEAGE_VALID"];
const allowedFiles = ["packages/app-builder-core-materializer/src/index.ts", "packages/app-builder-core-materializer/src/internal/data-list-sublist-nested-control-placement.ts", "runtimes/app-builder-core-local-runtime/src/index.ts", "runtimes/app-builder-core-local-runtime/src/internal-data-list-sublist-nested-control-placement-lowering.ts", "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json", "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json", "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json", "scripts/build-core-distribution.mjs", "scripts/test-data-list-sublist-nested-control-placement-distribution.mjs", "scripts/create-phase12d-data-list-sublist-nested-control-placement-dual-public-distribution-promotion.mjs", "scripts/validate-phase12d-data-list-sublist-nested-control-placement-dual-public-distribution-promotion.mjs", "scripts/test-phase12d-data-list-sublist-nested-control-placement-dual-public-distribution-promotion.mjs", "scripts/validate-phase-closure-proof-lineage.mjs", "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json", "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs", "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs", "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json", contractPath, reportPath];
const transition = { phase, kind: "artifact-only", promotionContractPath: contractPath, promotionContractSha256: "pending", promotionReportPath: reportPath, promotionReportSha256: "pending", requiredEvidenceMarker: "SUBLIST_NESTED_CONTROL_DUAL_DISTRIBUTION_VALID", sourceTransition: { beforeSha256: sourceSha, afterSha256: sourceSha, requiredSourceTokens: [...previous.sourceTransition.requiredSourceTokens] }, beforeArtifactState: previous.artifactState, artifactState, allowedFiles };
const contract = { schemaVersion: "1.0.0", phase, decision: { status: "complete", marker: transition.requiredEvidenceMarker, nextPhase: "phase-12e-data-list-sublist-nested-control-placement-selective-routing-proof" }, publicExports: ["projectDataListSublistNestedControlPlacementIntent", "lowerDataListSublistNestedControlPlacementAtHost"], verificationMarkers: markers, corpus: { path: "compatibility/differential-fixtures/data-list-sublist-nested-control-placement-shadow.v0.1.0.json", caseCount: 12, surfaces: ["compiled source", "Plugin dist", "temporary official ZIP", "simulated installed Plugin"] }, boundary: "Core accepts only immutable parent identifiers, template slot references, and ordered scalar embedded column semantics. Local Runtime receives only frozen Core intent plus explicit host IDs and returns fresh metadata. Neither API loads or mutates a template graph, allocates IDs, binds controls, or serializes host state.", exclusions: ["child resource identity", "embedded id/idx as identity", "template/resource mutation", "graph insertion", "runtime expressions", "nested Sublist", "Lookup", "identity/user/department", "file/image/binary", "barcode", "actions", "package output"], artifactTransition: { before: transition.beforeArtifactState, after: artifactState }, productionMaterializer: { path: "scripts/materialize-full-app-generated-final.mjs", beforeSha256: sourceSha, afterSha256: sourceSha, changed: false }, historicalZipSha256: "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2", allowedFiles };
write(contractPath, contract);
write(reportPath, "# Phase 12D Nested Control Placement Dual Public Distribution Promotion\n\nThe official builder promoted exactly `projectDataListSublistNestedControlPlacementIntent` and `lowerDataListSublistNestedControlPlacementAtHost`. The 12-case scalar embedded-Sublist placement corpus passed compiled source, Plugin dist, temporary official ZIP, and simulated installed Plugin surfaces. Core remains immutable and JSON-safe; Local Runtime creates fresh metadata only. Template graph loading/mutation, control-ID allocation, graph insertion, bindings, child-resource identity, runtime expressions, package output, and production routing remain excluded.\n");
transition.promotionContractSha256 = sha(read(contractPath));
transition.promotionReportSha256 = sha(read(reportPath));
lineage.approvedTransitions.push(transition);
write(lineagePath, lineage);
const closure = json(closurePath);
closure.closureProofLineage.approvedPhases = lineage.approvedTransitions.map((entry) => entry.phase);
closure.closureProofLineage.sha256 = sha(read(lineagePath));
write(closurePath, closure);
const state = json(statePath);
state.migration.currentPhase = phase;
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = contract.decision.nextPhase;
state.completed.push({ id: phase, status: "complete", evidence: "2026-07-19: exactly two immutable nested-control placement APIs promoted through official source, dist, ZIP, installed, leakage, and lineage proof; production routing remains unchanged." });
state.proofStatus.dataListSublistNestedControlPlacementPublicReadiness = "accepted_and_promoted";
state.proofStatus.dataListSublistNestedControlPlacementPublicDistribution = "passed";
state.proofStatus.dataListSublistNestedControlPlacementDualDistribution = "passed";
write(statePath, state);
console.log("PHASE_12D_PROMOTION_RECORDED");

function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function write(path, value) { writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`); }

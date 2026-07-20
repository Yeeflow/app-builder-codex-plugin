#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const promotionPath = "compatibility/capability-manifests/data-list-type1-identity-control-placement-dual-public-distribution-promotion.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-7d-data-list-type1-identity-control-placement-dual-public-distribution-promotion.v0.1.0.md";
const promotion = json(promotionPath);
if (promotion.decision?.status !== "complete" || promotion.decision?.marker !== "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_DUAL_DISTRIBUTION_VALID") fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_PROMOTION_STATE_INVALID", "The Phase 7D promotion contract is incomplete.");
writeText(reportPath, report(promotion));
const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
const lineage = json(lineagePath);
const phase6 = lineage.approvedTransitions?.find((transition) => transition.phase === "phase-6e-data-list-lookup-resolution-selective-routing-proof");
if (!phase6) fail("PHASE_CLOSURE_PROOF_LINEAGE_BASELINE_STALE", "The sealed Phase 6E transition is missing.");
const transition = {
  phase: "phase-7d-data-list-type1-identity-control-placement-dual-public-distribution-promotion",
  kind: "artifact-only",
  promotionContractPath: promotionPath,
  promotionContractSha256: digest(read(promotionPath)),
  promotionReportPath: reportPath,
  promotionReportSha256: digest(read(reportPath)),
  requiredEvidenceMarker: "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_DUAL_DISTRIBUTION_VALID",
  sourceTransition: { beforeSha256: phase6.sourceTransition.afterSha256, afterSha256: phase6.sourceTransition.afterSha256, requiredSourceTokens: phase6.sourceTransition.requiredSourceTokens },
  beforeArtifactState: phase6.artifactState,
  artifactState: promotion.artifactTransition.after,
  allowedFiles: promotion.allowedFiles
};
lineage.approvedTransitions = [phase6, transition];
writeJson(lineagePath, lineage);
const closurePath = "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json";
const closure = json(closurePath);
closure.closureProofLineage.sha256 = digest(read(lineagePath));
closure.closureProofLineage.approvedPhases = lineage.approvedTransitions.map((item) => item.phase);
writeJson(closurePath, closure);

const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
state.migration.currentPhase = "phase-7d-data-list-type1-identity-control-placement-dual-public-distribution-promotion";
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = "phase-7e-data-list-type1-identity-control-placement-selective-routing-proof";
const evidence = "2026-07-18: DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_PUBLIC_API_CONTRACT_PASSED, DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_PASSED, source/archive/installed 21-case parity, distribution gates, and sealed Phase 7D artifact-only closure lineage passed. Only the approved Core and Local Runtime public APIs were promoted; adapters and production routing remain unchanged.";
const completed = state.completed.find((item) => item.id === "phase-7d-data-list-type1-identity-control-placement-dual-public-distribution-promotion");
if (completed) { completed.status = "complete"; completed.evidence = evidence; } else state.completed.push({ id: "phase-7d-data-list-type1-identity-control-placement-dual-public-distribution-promotion", status: "complete", evidence });
state.nextSteps = (state.nextSteps || []).filter((item) => item.id !== "phase-7d-data-list-type1-identity-control-placement-dual-public-distribution-promotion" && item.id !== state.migration.nextPhase);
state.nextSteps.unshift({ order: 1, id: state.migration.nextPhase, description: "Route only the approved Data List Type 1 view/workbench non-sublist identity-user-people-person placement boundary after a separate actual-materializer, scope, determinism, and Legacy rollback proof." });
state.proofStatus.dataListType1IdentityUserControlPlacementDualPublicDistribution = "passed";
state.proofStatus.dataListType1IdentityUserControlPlacementSelectiveRouting = "not_started";
writeJson("docs/architecture/yeeflow-app-builder-core-migration-state.json", state);
for (const path of ["compatibility/capability-manifests/field-control-projection-audit.v0.1.0.json", "compatibility/capability-manifests/field-control-projection-capability-matrix.v0.1.0.json", "compatibility/capability-manifests/resource-definition-construction-audit.v0.1.0.json", "compatibility/capability-manifests/resource-definition-construction-capability-matrix.v0.1.0.json"]) {
  const value = json(path);
  value.phase7Type1IdentityUserControlPlacementDualDistribution = { status: "complete", marker: promotion.decision.marker, contract: promotionPath, nextPhase: promotion.decision.nextPhase, productionRouting: false };
  writeJson(path, value);
}
console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_PHASE7D_STATE_RECORDED");
function report(value) { return `# Phase 7D Type 1 Identity-Control Dual Public Distribution Promotion

## Decision

\`DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_DUAL_DISTRIBUTION_VALID\`

The official distribution pipeline now exposes exactly \`projectDataListType1IdentityControlPlacement\` and \`lowerDataListType1IdentityControlPlacementAtHost\` alongside previously approved exports. The unchanged 21-case corpus passed compiled source, Plugin dist, temporary official ZIP, and simulated installed Plugin parity.

## Public Boundary

Materializer Core returns immutable JSON-safe placement intent, descriptor, and findings only. It exposes no control ID, mutable template, host context, Legacy fragment, runtime expression, resource, or package state. Local Runtime requires explicit template references and a host-supplied control ID, validates all five template-graph errors, and returns a fresh frozen host fragment without allocation or mutation.

## Artifact Transition

Planning Core remains \`${value.artifactTransition.after["@yeeflow/app-builder-core-planning"].sha256}\`. Materializer Core changed only from \`${value.artifactTransition.before["@yeeflow/app-builder-core-materializer"].sha256}\` to \`${value.artifactTransition.after["@yeeflow/app-builder-core-materializer"].sha256}\`; Local Runtime changed only from \`${value.artifactTransition.before["@yeeflow/app-builder-core-local-runtime"].sha256}\` to \`${value.artifactTransition.after["@yeeflow/app-builder-core-local-runtime"].sha256}\`.

## Phase 7E Routing Proof

Phase 7E may add thin adapters and route only Data List Type 1 view/workbench non-sublist identity, user, people, and person controls. It must preserve host template loading, explicit control-ID supply, placement insertion, and final resource integration. Required proof is actual-materializer source, ZIP, and installed parity, determinism, scope gates, and temporary-copy-only Legacy rollback.

## Non-Goals

No Legacy materializer, adapter, production route, active installation, historical ZIP, protected duplicate, Git, or release state changed.
`; }
function json(path) { return JSON.parse(read(path)); }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function digest(value) { return createHash("sha256").update(value).digest("hex"); }
function writeJson(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, JSON.stringify(value, null, 2) + "\n", "utf8"); }
function writeText(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value, "utf8"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

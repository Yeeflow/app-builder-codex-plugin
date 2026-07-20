#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corePath = "compatibility/capability-manifests/data-list-type1-identity-control-placement-core-public-api-readiness.v0.1.0.json";
const runtimePath = "compatibility/capability-manifests/data-list-type1-identity-control-placement-local-runtime-public-api-readiness.v0.1.0.json";
const dualPath = "compatibility/capability-manifests/data-list-type1-identity-control-placement-dual-distribution-readiness.v0.1.0.json";
const core = json(corePath);
const runtime = json(runtimePath);
const dual = json(dualPath);
if (core.decision?.status !== "accepted" || runtime.decision?.status !== "accepted" || dual.decision?.status !== "accepted") fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_READINESS_STATE_INVALID", "Every Phase 7C readiness contract must be accepted before state is recorded.");

const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
state.migration.currentPhase = "phase-7c-data-list-type1-identity-control-placement-dual-public-distribution-readiness";
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = "phase-7d-data-list-type1-identity-control-placement-dual-public-distribution-promotion";
const evidence = "2026-07-18: DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_PUBLIC_API_READINESS_ACCEPTED, DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_LOCAL_RUNTIME_PUBLIC_API_READINESS_ACCEPTED, DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_DUAL_DISTRIBUTION_READINESS_VALID, six readiness negative regressions, and Phase 5 closure-proof lineage validation passed. No public export, distribution artifact, adapter, Legacy materializer, or production route changed.";
const completed = state.completed.find((item) => item.id === "phase-7c-data-list-type1-identity-control-placement-dual-public-distribution-readiness");
if (completed) { completed.status = "complete"; completed.evidence = evidence; } else state.completed.push({ id: "phase-7c-data-list-type1-identity-control-placement-dual-public-distribution-readiness", status: "complete", evidence });
state.nextSteps = (state.nextSteps || []).filter((item) => item.id !== "phase-7c-data-list-type1-identity-control-placement-dual-public-distribution-readiness" && item.id !== state.migration.nextPhase);
state.nextSteps.unshift({ order: 1, id: state.migration.nextPhase, description: "Promote only projectDataListType1IdentityControlPlacement and lowerDataListType1IdentityControlPlacementAtHost through the official multi-artifact pipeline after separate authorization; no production routing is implied." });
state.proofStatus.dataListType1IdentityControlPlacementDualPublicDistributionReadiness = "accepted";
state.proofStatus.dataListType1IdentityControlPlacementDualPublicDistribution = "not_started";
writeJson("docs/architecture/yeeflow-app-builder-core-migration-state.json", state);

for (const path of ["compatibility/capability-manifests/field-control-projection-audit.v0.1.0.json", "compatibility/capability-manifests/field-control-projection-capability-matrix.v0.1.0.json", "compatibility/capability-manifests/resource-definition-construction-audit.v0.1.0.json", "compatibility/capability-manifests/resource-definition-construction-capability-matrix.v0.1.0.json"]) {
  const value = json(path);
  value.phase7Type1IdentityUserControlPlacementDualDistributionReadiness = { status: "accepted", marker: dual.decision.marker, contracts: [corePath, runtimePath, dualPath], nextPhase: dual.decision.nextPhase, productionRouting: false };
  writeJson(path, value);
}

writeText("docs/architecture/yeeflow-app-builder-phase-7c-data-list-type1-identity-control-placement-dual-public-distribution-readiness.v0.1.0.md", `# Phase 7C Type 1 Identity-Control Dual Public-Distribution Readiness

## Decision

\`DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_DUAL_DISTRIBUTION_READINESS_VALID\`

Both internal boundaries are ready for a future coordinated public promotion. This audit does not promote either API.

## Prospective Materializer Core API

\`projectDataListType1IdentityControlPlacement\` may expose only immutable JSON-safe placement input, descriptor, intent, finding, and result DTOs. It excludes a control ID, mutable template object, host context, Legacy control fragment, runtime expression, resource record, and package state.

## Prospective Local Runtime API

\`lowerDataListType1IdentityControlPlacementAtHost\` may accept immutable Core intent, an explicit template snapshot, and a host-supplied control ID. It owns all five template-reference errors and returns a fresh fragment without allocating a control identity or mutating the snapshot.

## Phase 7D Promotion Proof

Phase 7D must promote exactly these two APIs through the official builder and prove the unchanged 21-case corpus in compiled source, Plugin dist, temporary official ZIP, and simulated installed Plugin layouts. It must verify public export, manifest, checksum, path, version, serialization, immutability, and leakage parity while preserving existing exports.

## Phase 7E Routing Proof

Phase 7E may add thin adapters and route only Data List Type 1 view/workbench non-sublist identity, user, people, and person controls. The host must continue to load templates, supply control IDs, insert controls, and integrate final resources. It requires actual-materializer source, ZIP, and installed parity; determinism; strict scope gates; and temporary-copy-only Legacy rollback.

## Closure-Proof Lineage

The Phase 5 closure baseline remains immutable. The versioned lineage record seals the exact approved Phase 6E Lookup source transition, its routing-proof manifest hash, and the current three-artifact state. Any undocumented source or artifact change, missing baseline, or lineage tampering fails deterministically without a broad path exception.

## Non-Goals

No public index, distribution contract, artifact, Plugin dist, adapter, Legacy materializer, production route, active installation, historical ZIP, protected duplicate, or release state changed.
`);
console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_PHASE7C_STATE_RECORDED");

function json(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }
function writeJson(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, JSON.stringify(value, null, 2) + "\n", "utf8"); }
function writeText(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value, "utf8"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

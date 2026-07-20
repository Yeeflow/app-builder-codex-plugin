#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corePath = "compatibility/capability-manifests/app-builder-core-materializer-lookup-resolution-public-api-readiness.v0.1.0.json";
const runtimePath = "compatibility/capability-manifests/app-builder-core-local-runtime-lookup-resolution-public-api-readiness.v0.1.0.json";
const dualPath = "compatibility/capability-manifests/data-list-lookup-resolution-dual-distribution-readiness.v0.1.0.json";
const core = json(corePath);
const runtime = json(runtimePath);
const dual = json(dualPath);
if (core.decision?.status !== "accepted" || runtime.decision?.status !== "accepted" || dual.decision?.status !== "accepted") fail("DATA_LIST_LOOKUP_RESOLUTION_READINESS_STATE_INVALID", "Every Phase 6C readiness contract must be accepted before state is recorded.");

const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
state.migration.currentPhase = "phase-6c-data-list-lookup-resolution-dual-public-distribution-readiness";
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = "phase-6d-data-list-lookup-resolution-dual-public-distribution-promotion";
const evidence = "2026-07-18: DATA_LIST_LOOKUP_RESOLUTION_CORE_PUBLIC_API_READINESS_ACCEPTED, DATA_LIST_LOOKUP_RESOLUTION_LOCAL_RUNTIME_PUBLIC_API_READINESS_ACCEPTED, DATA_LIST_LOOKUP_RESOLUTION_DUAL_DISTRIBUTION_READINESS_VALID, and nine negative readiness regressions passed. The prospective Core API exposes immutable Lookup intent data only; the prospective Local Runtime API owns supplied map validation and fresh Rules lowering. No public index, distribution contract, artifact, adapter, Legacy materializer, or route changed.";
const completed = state.completed.find((item) => item.id === "phase-6c-data-list-lookup-resolution-dual-public-distribution-readiness");
if (completed) { completed.status = "complete"; completed.evidence = evidence; } else state.completed.push({ id: "phase-6c-data-list-lookup-resolution-dual-public-distribution-readiness", status: "complete", evidence });
state.nextSteps = state.nextSteps.filter((item) => item.id !== "phase-6c-data-list-lookup-resolution-dual-public-distribution-readiness");
state.nextSteps.unshift({ order: 1, id: "phase-6d-data-list-lookup-resolution-dual-public-distribution-promotion", description: "Promote and prove only projectDataListLookupResolutionIntent and lowerDataListLookupResolutionAtHost through the existing self-contained artifacts after separate authorization; no routing is implied." });
state.proofStatus.dataListLookupResolutionDualPublicDistributionReadiness = "accepted";
state.proofStatus.dataListLookupResolutionDualPublicDistribution = "not_started";
writeJson("docs/architecture/yeeflow-app-builder-core-migration-state.json", state);

const hostContract = json("compatibility/capability-manifests/cross-resource-lookup-resolution-host-contract.v0.1.0.json");
hostContract.internalShadow.decision.phase6CDualPublicDistributionReadiness = "accepted";
hostContract.internalShadow.decision.futurePhase = "phase-6d-data-list-lookup-resolution-dual-public-distribution-promotion";
hostContract.publicDistributionReadiness = { coreContract: corePath, localRuntimeContract: runtimePath, dualContract: dualPath, status: "accepted", productionRouting: "not_started" };
writeJson("compatibility/capability-manifests/cross-resource-lookup-resolution-host-contract.v0.1.0.json", hostContract);

for (const path of ["compatibility/capability-manifests/resource-definition-construction-audit.v0.1.0.json", "compatibility/capability-manifests/resource-definition-construction-capability-matrix.v0.1.0.json"]) {
  const value = json(path);
  value.phase6LookupResolutionDualDistributionReadiness = { status: "accepted", marker: dual.decision.marker, contracts: [corePath, runtimePath, dualPath], nextPhase: dual.decision.nextPhase, productionRouting: false };
  writeJson(path, value);
}

writeText("docs/architecture/yeeflow-app-builder-phase-6c-data-list-lookup-resolution-dual-distribution-readiness.v0.1.0.md", report());
console.log("DATA_LIST_LOOKUP_RESOLUTION_PHASE6C_STATE_RECORDED");

function report() {
  return `# Phase 6C Data List Lookup-Resolution Dual Public-Distribution Readiness\n\n## Decision\n\n\`DATA_LIST_LOOKUP_RESOLUTION_DUAL_DISTRIBUTION_READINESS_VALID\`\n\nBoth prospective APIs are safe for a future coordinated public promotion. This audit did not promote either one.\n\n## Prospective Materializer Core API\n\n\`projectDataListLookupResolutionIntent\` may expose only frozen JSON-serializable Lookup intent, deterministic candidate-key request, and finding DTOs. It must not expose a ListID, FieldID, target ListID, target map, host context, Legacy Rules string, Legacy field record, mutable template, caller findings array, generated resource, or runtime state.\n\n## Prospective Local Runtime API\n\n\`lowerDataListLookupResolutionAtHost\` may receive only the immutable Core intent plus explicit readonly target-map and source relationship context. It owns validation and fresh Rules lowering for all six stable errors. It must not allocate IDs, discover fallback targets, perform API lookup, mutate templates/resources, or use a Legacy fallback.\n\n## Phase 6D Promotion Proof\n\nPhase 6D must promote the two APIs together only through the official builder, then prove the fifteen-case corpus and exact export, manifest, path, version, checksum, and leakage parity in compiled source, Plugin dist, temporary official ZIP, and simulated installed Plugin layouts.\n\n## Phase 6E Routing Proof\n\nA later Phase 6E may add thin adapters and route Data List Lookup fields only in the audited \`buildFieldRecord\` boundary. It requires actual-materializer source, ZIP, and installed parity; deterministic output; all six error gates; lossless 19-digit ID checks; strict non-Lookup scope gates; and temporary-copy-only Legacy rollback.\n\n## Non-Goals\n\nNo public package index, distribution contract, artifact, adapter, Plugin dist, Legacy materializer, production route, active installation, historical ZIP, protected duplicate, or release state changed.\n`;
}
function json(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }
function writeJson(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function writeText(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value, "utf8"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

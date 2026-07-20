#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = json("compatibility/capability-manifests/core-extraction-core-v1-closure.v1.0.0.json");
const matrix = json("compatibility/capability-manifests/core-v1-boundary-matrix.v1.0.0.json");
const registry = json(contract.authorities.registry); const inventory = json(contract.authorities.inventory); const plan = json(contract.authorities.plan); const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
const lineage = json(contract.authorities.lineage); const distribution = json(contract.distribution.manifest);
const wave3 = registry.envelopes.filter((item) => item.wave === "Wave 3"); const statuses = new Map(); for (const item of wave3) statuses.set(item.status, (statuses.get(item.status) || 0) + 1);

assert.equal(contract.marker, "CORE_V1_CLOSURE_ACCEPTED");
assert.equal(contract.terminalCoverage.value, "100%");
assert.equal(contract.actualCoreOwnershipScore.value, 56.1236);
assert.equal(wave3.length, 89); assert.equal(statuses.get("accepted-extracted-and-routed"), 34); assert.equal(statuses.get("reclassified-host-or-specialist-route"), 55); assert.equal(statuses.size, 2);
assert(wave3.filter((item) => item.status === "reclassified-host-or-specialist-route").every((item) => typeof item.reclassificationReason === "string" && item.reclassificationReason.length > 20 || typeof item.terminalDisposition === "string" && item.terminalDisposition.length > 20), "CORE_V1_CLOSURE_RECLASSIFICATION_REASON_MISSING");
assert.equal(registry.coreV1Closure.terminalCoverage, "100%"); assert.equal(registry.coreV1Closure.actualCoreOwnershipScore, 56.1236);
assert.equal(inventory.coreV1Closure.marker, "CORE_V1_CLOSURE_ACCEPTED");
assert.equal(plan.execution.terminalCoverage, "100%"); assert.equal(plan.execution.actualCoreOwnershipScore, 56.1236); assert.equal(plan.execution.nextPhase, contract.nextPhase); assert.equal(plan.coreV1.status, "complete");
assert(["core_v1_complete", "core_v1_rc_readiness_accepted"].includes(state.migration.overallStatus), "CORE_V1_CLOSURE_SUCCESSOR_STATE_INVALID");
if (state.migration.overallStatus === "core_v1_complete") assert.equal(state.migration.nextPhase, contract.nextPhase);
else {
  assert.equal(state.migration.currentPhase, "core-v1-release-candidate-integration-and-application-e2e-readiness");
  assert.equal(state.migration.currentPhaseStatus, "complete");
  assert.equal(state.migration.nextPhase, "core-v1-rc-candidate-build-and-isolated-e2e-validation");
}
assert.equal(state.proofStatus.coreV1TerminalCoverage, "100%"); assert.equal(state.proofStatus.actualCoreOwnershipScore, 56.1236);
assert.equal(matrix.marker, "CORE_V1_BOUNDARY_MATRIX_VALID"); assert(matrix.extractedCoreCapabilities.planning.length > 0); assert(matrix.intentionalHostRuntimeOwnership.length >= 4); assert(matrix.legacyCompatibilityShims.length >= 3); assert(matrix.productEnhancementBacklog.length >= 4); assert(matrix.futureMultiHostRequirements.length >= 3);
assert.equal(lineage.approvedTransitions.at(-1).phase, "core-extraction-wave3-batch-l-final-residual-envelope-reconciliation-and-disposition"); assert(!lineage.approvedTransitions.some((item) => item.phase === "core-extraction-core-v1-closure"), "CORE_V1_CLOSURE_MUST_NOT_APPEND_ROUTE_TRANSITION");
for (const artifact of distribution.artifacts) { assert(existsSync(resolve(root, "dist/yeeflow-app-builder-plugin", artifact.path)), `CORE_V1_CLOSURE_ARTIFACT_MISSING:${artifact.packageName}`); }
const apiContracts = ["compatibility/capability-manifests/app-builder-core-planning-public-api.v0.1.0.json", "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json", "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json"];
for (const path of apiContracts) { const api = json(path); assert(Array.isArray(api.runtimeExports) && api.runtimeExports.length, `CORE_V1_CLOSURE_PUBLIC_API_EMPTY:${path}`); }
for (const path of sourceFiles("packages/app-builder-core-planning/src").concat(sourceFiles("packages/app-builder-core-materializer/src"), sourceFiles("runtimes/app-builder-core-local-runtime/src"))) {
  const text = read(path); for (const forbidden of ["node:fs", "node:path", "node:crypto", "codex", "openai", "anthropic", "oauth", "fetch(", "window.", "document.", "react", "next/", "prisma", "git "]) assert(!text.toLowerCase().includes(forbidden), `CORE_V1_CLOSURE_FORBIDDEN_CORE_DEPENDENCY:${path}:${forbidden}`);
}
console.log("CORE_V1_CLOSURE_VALID");
console.log("CORE_V1_BOUNDARY_MATRIX_VALID");

function sourceFiles(relative) { const absolute = resolve(root, relative); const output = []; const visit = (directory) => { for (const entry of readdirSync(directory, { withFileTypes: true })) { const path = resolve(directory, entry.name); if (entry.isDirectory()) visit(path); else if (entry.name.endsWith(".ts")) output.push(path); } }; visit(absolute); return output.map((path) => path.slice(root.length + 1)); }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }

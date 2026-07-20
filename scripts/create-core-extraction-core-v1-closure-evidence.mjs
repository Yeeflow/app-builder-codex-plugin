#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "core-extraction-core-v1-closure";
const contract = "compatibility/capability-manifests/core-extraction-core-v1-closure.v1.0.0.json";
const read = (path) => readFileSync(resolve(root, path), "utf8"); const json = (path) => JSON.parse(read(path)); const write = (path, value) => writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`);
const terminalStatuses = new Set(["accepted-extracted-and-routed", "reclassified-host-or-specialist-route"]);

const registry = json("compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.6.0.json"); const wave3 = registry.envelopes.filter((item) => item.wave === "Wave 3");
if (wave3.length !== 89 || !wave3.every((item) => terminalStatuses.has(item.status))) throw new Error("CORE_V1_CLOSURE_WAVE3_TERMINAL_COVERAGE_INVALID");
const extracted = wave3.filter((item) => item.status === "accepted-extracted-and-routed").length; const reclassified = wave3.filter((item) => item.status === "reclassified-host-or-specialist-route").length;
if (extracted !== 34 || reclassified !== 55) throw new Error("CORE_V1_CLOSURE_WAVE3_DISPOSITION_INVALID");
registry.phase = phase; registry.schemaVersion = "1.7.0"; registry.supersedes = "compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.6.0.json";
registry.coreV1Closure = { marker: "CORE_V1_CLOSURE_ACCEPTED", terminalCoverage: "100%", wave1: "6/6", wave2: "1/1", wave3: "89/89", extractedAndRouted: 34, reclassifiedHostRuntimeSpecialist: 55, coreV2Deferred: 0, actualCoreOwnershipScore: 56.1236, evidence: contract };
write("compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.7.0.json", registry);

const inventory = json("compatibility/capability-manifests/core-extraction-production-ownership-inventory.v1.6.0.json"); inventory.phase = phase; inventory.schemaVersion = "1.7.0"; inventory.supersedes = "compatibility/capability-manifests/core-extraction-production-ownership-inventory.v1.6.0.json";
inventory.coreV1Closure = { marker: "CORE_V1_CLOSURE_ACCEPTED", terminalCoverage: "100%", actualCoreOwnershipScore: 56.1236, reclassifiedEnvelopeCount: 55, coreV2DeferredEnvelopeCount: 0, boundaryMatrix: "compatibility/capability-manifests/core-v1-boundary-matrix.v1.0.0.json", evidence: contract };
write("compatibility/capability-manifests/core-extraction-production-ownership-inventory.v1.7.0.json", inventory);

const plan = json("compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.17.0.json"); plan.phase = phase; plan.schemaVersion = "0.18.0"; plan.supersedes = "compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.17.0.json";
plan.execution = { ...(plan.execution || {}), completedWave: "Core v1 extraction program", inProgressWave: null, nextPhase: "core-v1-release-candidate-integration-and-application-e2e-readiness", terminalCoverage: "100%", actualCoreOwnershipScore: 56.1236, coreV1Closure: { marker: "CORE_V1_CLOSURE_ACCEPTED", wave1: "6/6", wave2: "1/1", wave3: "89/89", extractedAndRouted: 34, reclassifiedHostRuntimeSpecialist: 55, coreV2Deferred: 0, evidence: contract } };
plan.coreV1 = { ...(plan.coreV1 || {}), status: "complete", terminalCoverage: "100%", actualCoreOwnershipScore: 56.1236, closureEvidence: contract, nextPhase: "core-v1-release-candidate-integration-and-application-e2e-readiness" };
const closureWave = plan.waves?.find((item) => item.id === "Core v1 closure"); if (closureWave) { closureWave.status = "complete"; closureWave.executionEvidence = contract; closureWave.actualTerminalDisposition = "accepted-boundary-frozen-no-new-extraction"; }
write("compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.18.0.json", plan);

const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json"); state.migration.currentPhase = phase; state.migration.currentPhaseStatus = "complete"; state.migration.overallStatus = "core_v1_complete"; state.migration.nextPhase = "core-v1-release-candidate-integration-and-application-e2e-readiness";
state.proofStatus.coreV1Closure = "accepted_terminal_coverage_100_actual_core_ownership_56_1236"; state.proofStatus.coreV1TerminalCoverage = "100%"; state.proofStatus.actualCoreOwnershipScore = 56.1236;
state.completed = (state.completed || []).filter((item) => item.id !== phase); state.completed.push({ id: phase, status: "complete", evidence: contract }); state.inProgress = [{ id: "core-v1-release-candidate-integration-and-application-e2e-readiness", description: "Prepare release-candidate integration and application end-to-end readiness without changing Core v1 closure evidence." }];
write("docs/architecture/yeeflow-app-builder-core-migration-state.json", state);
console.log("CORE_V1_CLOSURE_EVIDENCE_WRITTEN");

#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "core-extraction-wave3-batch-l-final-residual-envelope-reconciliation-and-disposition";
const contract = json("compatibility/capability-manifests/core-extraction-wave3-batch-l-final-residual-envelope-reconciliation-and-disposition.v0.1.0.json");
const registry = json("compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.6.0.json");
const inventory = json("compatibility/capability-manifests/core-extraction-production-ownership-inventory.v1.6.0.json");
const plan = json("compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.17.0.json");
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
const source = read("scripts/materialize-full-app-generated-final.mjs");
const core = read("packages/app-builder-core-planning/src/application-plan-static-foundation.ts");
const publicApi = json("compatibility/capability-manifests/app-builder-core-planning-public-api.v0.1.0.json");
const wave = registry.envelopes.filter((item) => item.wave === "Wave 3");
const recognized = new Set(["accepted-extracted-and-routed", "reclassified-host-or-specialist-route"]);
const byId = new Map(wave.map((item) => [item.id, item]));

assert.equal(contract.marker, "CORE_EXTRACTION_WAVE3_BATCH_L_RESIDUAL_ENVELOPES_RECONCILED");
assert.equal(registry.phase, phase);
assert.equal(wave.length, 89);
assert(wave.every((item) => recognized.has(item.status)), "CORE_EXTRACTION_WAVE3_BATCH_L_UNTERMINAL_ENVELOPE");
assert.equal(wave.filter((item) => item.status === "accepted-extracted-and-routed").length, 34);
assert.equal(wave.filter((item) => item.status === "reclassified-host-or-specialist-route").length, 55);
for (const id of ["wave-3-envelope-02", "wave-3-envelope-70", "wave-3-envelope-71", "wave-3-envelope-72", "wave-3-envelope-73", "wave-3-envelope-74"]) assert.equal(byId.get(id).status, "reclassified-host-or-specialist-route");
assert.equal(byId.get("wave-3-envelope-96").status, "accepted-extracted-and-routed");
const failureAssignment = registry.assignments.find((item) => item.functionId === "scripts/materialize-full-app-generated-final.mjs#buildFailure@11355");
assert.equal(failureAssignment.status, "accepted-extracted-and-routed");
assert.equal(failureAssignment.terminalDisposition, "core-planning-materialization-failure-dto");
assert.match(source, /kind: "materialization-failure-dto"/);
assert.match(core, /"materialization-failure-dto"/);
assert.match(core, /APPLICATION_PLAN_STATIC_FAILURE_DTO_UNSAFE/);
for (const forbidden of ["node:fs", "node:path", "node:crypto", "WeakMap", "fetch(", "process."]) assert(!core.includes(forbidden), `CORE_EXTRACTION_WAVE3_BATCH_L_FORBIDDEN_CORE_DEPENDENCY:${forbidden}`);
assert.deepEqual(publicApi.runtimeExports, [...publicApi.runtimeExports]);
assert(publicApi.runtimeExports.includes("projectApplicationPlanStaticFoundation"));
assert(!publicApi.runtimeExports.includes("projectMaterializationFailureDto"));
assert.equal(plan.execution.terminalDispositionEnvelopeProgress, "89/89");
assert.equal(plan.execution.wave3CoreExtractedEnvelopes, 34);
assert.equal(plan.execution.wave3TerminalDispositionEnvelopes.reclassified, 55);
assert.equal(plan.execution.wave3TerminalDispositionEnvelopes.deferred, 0);
assert.equal(plan.execution.currentCoreCompletionScore, 56.1236);
assert.equal(plan.execution.nextPhase, "core-extraction-core-v1-closure");
assert.equal(state.migration.currentPhase, phase);
assert.equal(state.migration.nextPhase, "core-extraction-core-v1-closure");
assert.equal(state.proofStatus.wave3TerminalDispositionEnvelopes.total, "89/89");
assert(JSON.stringify(inventory).includes("CORE_EXTRACTION_WAVE3_TERMINAL_DISPOSITIONS_89_OF_89"));
console.log("CORE_EXTRACTION_WAVE3_BATCH_L_RECONCILIATION_VALID");
console.log("CORE_EXTRACTION_WAVE3_TERMINAL_DISPOSITIONS_89_OF_89");

function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }

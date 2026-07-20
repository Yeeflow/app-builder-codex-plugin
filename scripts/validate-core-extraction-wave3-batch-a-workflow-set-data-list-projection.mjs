#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "core-extraction-wave3-batch-a-workflow-set-data-list-projection";
const registry = json("compatibility/capability-manifests/core-extraction-proof-envelope-registry.v0.4.0.json");
const inventory = json("compatibility/capability-manifests/core-extraction-production-ownership-inventory.v0.4.0.json");
const plan = json("compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.5.0.json");
const contract = json("compatibility/capability-manifests/core-extraction-wave3-batch-a-workflow-set-data-list-projection.v0.1.0.json");
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const source = read("scripts/lib/workflow-set-data-list-projection-utils.mjs");
const core = read("packages/app-builder-core-planning/src/markdown-planning-utils.ts");
const envelope = registry.envelopes.find((item) => item.id === "wave-3-envelope-26");
assert.equal(contract.phase, phase);
assert.equal(envelope?.status, "accepted-extracted-and-routed");
assert.equal(envelope?.productionCallerCount.workflowSetDataListProjectionRecord, 1);
assert.equal(envelope?.productionCallerCount.buildWorkflowVariablesFromSetDataListRecords, 2);
assert.equal(registry.execution.wave3.acceptedEnvelopeProgress, "1/89");
for (const id of contract.scope.selectedFunctionIds) {
  const assignment = registry.assignments.find((item) => item.functionId === id);
  const item = inventory.functions.find((entry) => entry.id === id);
  assert(assignment?.callers > 0, `CORE_EXTRACTION_WAVE3_BATCH_A_ASSIGNMENT_CALLER_INVALID:${id}`);
  assert(item?.callers > 0, `CORE_EXTRACTION_WAVE3_BATCH_A_INVENTORY_CALLER_INVALID:${id}`);
  assert.equal(item?.executionStatus, "accepted-extracted-and-routed");
}
const build = inventory.functions.find((item) => item.id.endsWith("#buildWorkflowVariablesFromSetDataListRecords@35"));
const merge = inventory.functions.find((item) => item.id.endsWith("#mergeWorkflowVariableProjection@86"));
assert.equal(build?.callers, 2); assert.equal(build?.category, "legacy-compatibility");
assert.equal(merge?.callers, 1); assert.equal(merge?.category, "host-runtime");
assert(!core.includes("mergeWorkflowVariableProjection"), "CORE_EXTRACTION_WAVE3_BATCH_A_HOST_MERGE_LEAKED");
assert(source.includes("projectWorkflowSetDataListProjection"), "CORE_EXTRACTION_WAVE3_BATCH_A_ROUTE_MISSING");
assert.equal((source.match(/projectWorkflowSetDataListProjection\(/g) || []).length, 2, "CORE_EXTRACTION_WAVE3_BATCH_A_ROUTE_COUNT_INVALID");
const planning = distribution.artifacts.find((item) => item.packageName === "@yeeflow/app-builder-core-planning");
assert(planning?.exports.includes("projectWorkflowSetDataListProjection"), "CORE_EXTRACTION_WAVE3_BATCH_A_ARTIFACT_EXPORT_MISSING");
assert.equal(plan.waves.find((item) => item.id === "Wave 3")?.acceptedEnvelopeProgress, "1/89");
assert.equal(plan.execution?.provisionalWeightedCoreCompletionScore, 29.7978);
assert.ok([phase, "core-extraction-caller-graph-reconciliation", "core-extraction-wave3-batch-b-workflow-query-data-static-plan", "core-extraction-wave3-batch-c-data-list-sublist-static-configuration", "core-extraction-wave3-batch-d-workflow-static-plan"].includes(state.migration.currentPhase), "CORE_EXTRACTION_WAVE3_BATCH_A_SUCCESSOR_PHASE_INVALID");
if (state.migration.currentPhase === "core-extraction-caller-graph-reconciliation") assert.equal(state.proofStatus.coreExtractionCallerGraph, "reconciled_ast_production_only");
assert.equal(state.proofStatus?.coreExtractionWave3AcceptedEnvelopeProgress, state.migration.currentPhase === "core-extraction-wave3-batch-d-workflow-static-plan" ? "6/89" : state.migration.currentPhase === "core-extraction-wave3-batch-c-data-list-sublist-static-configuration" ? "5/89" : state.migration.currentPhase === "core-extraction-wave3-batch-b-workflow-query-data-static-plan" ? "2/89" : "1/89");
assert.equal(shaBytes("dist/yeeflow-app-builder-plugin-0.9.71.zip"), contract.historicalZipSha256);
console.log("CORE_EXTRACTION_WAVE3_BATCH_A_EXECUTION_CONTRACT_VALID");
console.log("CORE_EXTRACTION_WAVE3_BATCH_A_CALLER_INVENTORY_CORRECTED");
console.log("CORE_EXTRACTION_WAVE3_BATCH_A_PUBLIC_CONTRACT_PASSED");
console.log("CORE_EXTRACTION_WAVE3_BATCH_A_WAVE_PROGRESS_VALID");

function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function shaBytes(path) { return createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex"); }

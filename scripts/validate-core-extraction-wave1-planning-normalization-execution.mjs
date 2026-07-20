#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "core-extraction-wave-1-planning-normalization-execution";
const contract = json("compatibility/capability-manifests/core-extraction-wave1-planning-normalization-execution.v0.1.0.json");
const corpus = json("compatibility/differential-fixtures/core-extraction-wave1-planning-normalization.v0.1.0.json");
const registry = json("compatibility/capability-manifests/core-extraction-proof-envelope-registry.v0.2.0.json");
const inventory = json("compatibility/capability-manifests/core-extraction-production-ownership-inventory.v0.2.0.json");
const plan = json("compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.3.0.json");
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
const lineage = json("compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json");
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const source = read("packages/app-builder-core-planning/src/markdown-planning-utils.ts");
const index = read("packages/app-builder-core-planning/src/index.ts");
const markdownShim = read("scripts/lib/markdown-planning-utils.mjs");
const placeholderShim = read("scripts/lib/planning-placeholder-utils.mjs");
const expectedZip = "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2";

assert.equal(contract.phase, phase); assert.equal(contract.marker, "CORE_EXTRACTION_WAVE1_PLANNING_NORMALIZATION_EXECUTION_PASSED");
const envelopes = registry.envelopes.filter((item) => item.wave === "Wave 1"); const functionIds = envelopes.flatMap((item) => item.functionIds);
assert.equal(envelopes.length, 6, "CORE_EXTRACTION_WAVE1_ENVELOPE_COUNT_INVALID"); assert.equal(functionIds.length, 24, "CORE_EXTRACTION_WAVE1_FUNCTION_COUNT_INVALID"); assert.equal(new Set(functionIds).size, 24, "CORE_EXTRACTION_WAVE1_FUNCTION_OVERLAP");
assert.deepEqual(corpus.envelopes.flatMap((item) => item.functionIds).sort(), functionIds.slice().sort(), "CORE_EXTRACTION_WAVE1_TRACEABILITY_INCOMPLETE");
for (const envelope of envelopes) assert.equal(envelope.status, "accepted-extracted-and-routed", `CORE_EXTRACTION_WAVE1_TERMINAL_DISPOSITION_MISSING: ${envelope.id}`);
for (const id of functionIds) { const item = inventory.functions.find((entry) => entry.id === id); assert(item && item.executionStatus === "accepted-extracted-and-routed", `CORE_EXTRACTION_WAVE1_INVENTORY_TERMINAL_MISSING: ${id}`); }
assert.equal(inventory.summary.coreCompletionScore, 27, "CORE_EXTRACTION_WAVE1_SCORE_UNRECONCILED"); assert.equal(plan.execution?.currentCoreCompletionScore, 27, "CORE_EXTRACTION_WAVE1_SCORE_UNRECONCILED"); assert.equal(plan.waves.find((item) => item.id === "Wave 1")?.status, "complete", "CORE_EXTRACTION_WAVE1_PLAN_NOT_COMPLETE");
assert.ok([phase, "core-extraction-wave-2-approval-form-sublist-lookup-static-configuration-projection", "core-extraction-wave3-batch-a-workflow-set-data-list-projection", "core-extraction-wave3-batch-b-workflow-query-data-static-plan", "core-extraction-wave3-batch-c-data-list-sublist-static-configuration", "core-extraction-wave3-batch-d-workflow-static-plan", "core-extraction-wave3-batch-h-application-plan-foundation-selection-and-execution"].includes(state.migration.currentPhase)); assert.equal(state.proofStatus.coreExtractionWave1PlanningNormalization, "passed_source_archive_installed_rollback");
const currentPlanningSha = (distribution.artifacts.find((item) => item.packageName === "@yeeflow/app-builder-core-planning") || {}).sha256;
if (currentPlanningSha !== contract.artifacts["@yeeflow/app-builder-core-planning"].sha256) assert.equal(lineage.approvedTransitions.find((entry) => entry.phase === "core-extraction-wave3-batch-h-application-plan-foundation-selection-and-execution")?.artifactState?.["@yeeflow/app-builder-core-planning"]?.sha256, currentPlanningSha, "CORE_EXTRACTION_WAVE1_SUCCESSOR_ARTIFACT_MISMATCH");
assert(source.includes("export function projectPlanningLabel"), "CORE_EXTRACTION_WAVE1_FACADE_MISSING"); assert(index.includes("projectPlanningLabel"), "CORE_EXTRACTION_WAVE1_INDEX_EXPORT_MISSING");
assert(markdownShim.includes('from "./markdown-planning-core-adapter.mjs"'), "CORE_EXTRACTION_WAVE1_MARKDOWN_SHIM_NOT_ROUTED"); assert(placeholderShim.includes("projectPlanningLabel"), "CORE_EXTRACTION_WAVE1_PLACEHOLDER_SHIM_NOT_ROUTED");
assert(!/^\s*import\s+/mu.test(source), "CORE_EXTRACTION_WAVE1_FORBIDDEN_CORE_DEPENDENCY: import");
for (const forbidden of ["node:", "process.", "require(", "fetch(", "window.", "document."]) assert(!source.toLowerCase().includes(forbidden), `CORE_EXTRACTION_WAVE1_FORBIDDEN_CORE_DEPENDENCY: ${forbidden}`);
assert.equal(shaBytes("dist/yeeflow-app-builder-plugin-0.9.71.zip"), expectedZip, "CORE_EXTRACTION_WAVE1_HISTORICAL_ZIP_CHANGED");
console.log("CORE_EXTRACTION_WAVE1_EXECUTION_CONTRACT_VALID"); console.log("CORE_EXTRACTION_WAVE1_TRACEABILITY_VALID"); console.log("CORE_EXTRACTION_WAVE1_BOUNDARIES_VALID"); console.log("CORE_EXTRACTION_WAVE1_WAVE_PLAN_AND_STATE_VALID");

function read(path) { return readFileSync(resolve(root, path), "utf8"); } function json(path) { return JSON.parse(read(path)); } function sha(value) { return createHash("sha256").update(value).digest("hex"); } function shaBytes(path) { return createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex"); }

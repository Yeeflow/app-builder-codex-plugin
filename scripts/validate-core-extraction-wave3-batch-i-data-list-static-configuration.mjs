#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "core-extraction-wave3-batch-i-data-list-static-configuration-selection-and-execution";
const read = (path) => readFileSync(resolve(root, path), "utf8");
const json = (path) => JSON.parse(read(path));
const contract = json(`compatibility/capability-manifests/${phase}.v0.1.0.json`);
const registry = json("compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.3.0.json");
const inventory = json("compatibility/capability-manifests/core-extraction-production-ownership-inventory.v1.3.0.json");
const plan = json("compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.14.0.json");
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
const source = read("scripts/materialize-full-app-generated-final.mjs");
const core = read("packages/app-builder-core-materializer/src/internal/data-list-default-view-layout-projection.ts");
const api = json("compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const selected = ["wave-3-envelope-53"];
const reclassified = ["wave-3-envelope-28", "wave-3-envelope-51", "wave-3-envelope-52", "wave-3-envelope-60", "wave-3-envelope-61", "wave-3-envelope-63", "wave-3-envelope-64", "wave-3-envelope-66", "wave-3-envelope-69", "wave-3-envelope-83"];

assert.equal(contract.marker, "CORE_EXTRACTION_WAVE3_BATCH_I_DATA_LIST_STATIC_CONFIGURATION_PASSED");
assert.deepEqual(contract.decision.extractedEnvelopes, selected);
assert.deepEqual(contract.decision.reclassifiedHostOnlyEnvelopes, reclassified);
for (const id of selected) assert.equal(registry.envelopes.find((item) => item.id === id)?.status, "accepted-extracted-and-routed", `CORE_EXTRACTION_WAVE3_BATCH_I_SELECTED:${id}`);
for (const id of reclassified) {
  const envelope = registry.envelopes.find((item) => item.id === id);
  assert.equal(envelope?.status, "reclassified-host-or-specialist-route", `CORE_EXTRACTION_WAVE3_BATCH_I_RECLASSIFIED:${id}`);
  assert(envelope.reclassificationReason, `CORE_EXTRACTION_WAVE3_BATCH_I_REASON:${id}`);
}
assert.equal(inventory.functions.find((item) => item.function === "selectDefaultDataListViewRecord")?.callers, 2);
for (const token of ["coreProjectDataListDefaultViewSelector", "projectDataListDefaultViewSelector", "selectedIndex"]) assert(source.includes(token), `CORE_EXTRACTION_WAVE3_BATCH_I_ROUTE_TOKEN:${token}`);
for (const forbidden of ["node:fs", "node:path", "node:crypto", "WeakMap", "fetch(", "process."]) assert(!core.includes(forbidden), `CORE_EXTRACTION_WAVE3_BATCH_I_CORE_LEAK:${forbidden}`);
assert(api.runtimeExports.includes("projectDataListDefaultViewSelector"), "CORE_EXTRACTION_WAVE3_BATCH_I_PUBLIC_EXPORT_MISSING");
assert.equal(contract.progress.wave3CoreExtractedEnvelopes, "27/89");
assert.equal(contract.progress.wave3TerminalDispositionEnvelopes.total, "64/89");
assert.equal(contract.progress.weightedCoreCompletion, 50.5393);
assert.equal(plan.execution.currentCoreCompletionScore, 50.5393);
assert.equal(plan.execution.nextPhase, "Wave 3 Batch J proof-envelope selection");
assert.equal(state.migration.currentPhase, phase);
assert.equal(state.proofStatus.coreExtractionWave3BatchIDataListStaticConfiguration, "passed_source_archive_installed_materializer_rollback");
console.log("CORE_EXTRACTION_WAVE3_BATCH_I_STRUCTURAL_VALID");

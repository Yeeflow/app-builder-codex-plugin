#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "core-extraction-wave3-batch-h-application-plan-foundation-selection-and-execution";
const contract = json(`compatibility/capability-manifests/${phase}.v0.1.0.json`);
const registry = json("compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.2.0.json");
const inventory = json("compatibility/capability-manifests/core-extraction-production-ownership-inventory.v1.2.0.json");
const plan = json("compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.13.0.json");
const source = read("scripts/materialize-full-app-generated-final.mjs"); const core = read("packages/app-builder-core-planning/src/application-plan-static-foundation.ts");
const extracted = ["wave-3-envelope-29", "wave-3-envelope-62"]; const reclassified = ["wave-3-envelope-30", "wave-3-envelope-32", "wave-3-envelope-37", "wave-3-envelope-39", "wave-3-envelope-75", "wave-3-envelope-76", "wave-3-envelope-77", "wave-3-envelope-84", "wave-3-envelope-87"];
assert.equal(contract.marker, "CORE_EXTRACTION_WAVE3_BATCH_H_APPLICATION_PLAN_STATIC_FOUNDATION_PASSED"); assert(contract.decision.extractedEnvelopes.length <= 6);
for (const id of extracted) assert.equal(registry.envelopes.find((item) => item.id === id)?.status, "accepted-extracted-and-routed");
for (const id of reclassified) { const envelope = registry.envelopes.find((item) => item.id === id); assert.equal(envelope?.status, "reclassified-host-or-specialist-route"); assert(envelope.reclassificationReason); }
assert.equal(registry.envelopes.find((item) => item.id === "wave-3-envelope-96")?.status, "deferred-separate-static-error-projection");
assert.equal(contract.progress.wave3CoreExtractedEnvelopes, "26/89"); assert.equal(contract.progress.wave3TerminalDispositionEnvelopes.total, "53/89"); assert.equal(contract.progress.weightedCoreCompletion, 49.7416);
for (const token of ["coreProjectApplicationPlanStaticFoundation", "parse-json-maybe", "find-header-index", "extract-numbered-section", "unique-case-insensitive"]) assert(source.includes(token));
for (const forbidden of ["node:fs", "node:path", "node:crypto", "WeakMap", "fetch(", "process."]) assert(!core.includes(forbidden), `CORE_EXTRACTION_WAVE3_BATCH_H_CORE_LEAK:${forbidden}`);
const actual = { parseJsonMaybe: 8, findHeaderIndex: 152, extractNumberedSection: 17, extractSubsections: 1, extractSubsection: 0, inferNavigationType: 1, isWorkbenchCustomForm: 2, isTableLine: 46, unique: 18 };
for (const [name, callers] of Object.entries(actual)) assert.equal(contract.callerEvidence.selectedFunctions[name], callers, `CORE_EXTRACTION_WAVE3_BATCH_H_CALLER_EVIDENCE:${name}`);
assert.equal(inventory.functions.find((item) => item.function === "extractSubsection")?.callers, 0);
assert.equal(inventory.functions.find((item) => item.function === "extractSubsection")?.extractionStatus, "terminal-zero-caller-legacy-only");
assert.equal(plan.execution.currentCoreCompletionScore, 49.7416); assert.equal(plan.execution.nextPhase, "Wave 3 Batch I proof-envelope selection");
assert.deepEqual(plan.scores.wave3Provisional, { method: "29 + ((100 - 29) * acceptedEnvelopeWeight / totalWave3EnvelopeWeight); only Core-extracted envelope weight is credited.", acceptedEnvelopeWeight: 26, totalWave3EnvelopeWeight: 89, value: 49.7416 });
console.log("CORE_EXTRACTION_WAVE3_BATCH_H_STRUCTURAL_VALID");
function read(path) { return readFileSync(resolve(root, path), "utf8"); } function json(path) { return JSON.parse(read(path)); }

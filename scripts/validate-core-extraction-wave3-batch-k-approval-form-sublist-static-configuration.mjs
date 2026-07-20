#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "core-extraction-wave3-batch-k-approval-form-sublist-static-configuration-selection-and-execution";
const contract = json("compatibility/capability-manifests/core-extraction-wave3-batch-k-approval-form-sublist-static-configuration.v0.1.0.json");
const registry = json("compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.5.0.json");
const inventory = json("compatibility/capability-manifests/core-extraction-production-ownership-inventory.v1.5.0.json");
const plan = json("compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.16.0.json");
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
const publicApi = json("compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const layoutBuilder = read("scripts/lib/approval-form-layout-builder.mjs");
const core = read("packages/app-builder-core-materializer/src/internal/approval-form-static-configuration.ts");
const ids = ["wave-3-envelope-01", "wave-3-envelope-02", "wave-3-envelope-03", "wave-3-envelope-04", "wave-3-envelope-05", "wave-3-envelope-06", "wave-3-envelope-07", "wave-3-envelope-09", "wave-3-envelope-10"];
const acceptedId = "scripts/lib/approval-form-layout-builder.mjs#approvalRowControlType@374";

assert.equal(contract.marker, "CORE_EXTRACTION_WAVE3_BATCH_K_APPROVAL_FORM_SUBLIST_STATIC_CONFIGURATION_PASSED");
assert.equal(registry.phase, phase);
const envelopes = registry.envelopes.filter((item) => ids.includes(item.id));
assert.equal(envelopes.length, 9);
assert.equal(envelopes.reduce((count, item) => count + item.functionCount, 0), 67);
assert.equal(envelopes.find((item) => item.id === "wave-3-envelope-02").status, "accepted-partial-subset-routed");
assert(envelopes.filter((item) => item.id !== "wave-3-envelope-02").every((item) => item.status === "reclassified-host-or-specialist-route"));
assert.equal(registry.execution.wave3.batchK.assignedFunctionCount, 67);
assert.equal(registry.execution.wave3.batchK.discrepancy, null);
const acceptedAssignment = registry.assignments.find((item) => item.functionId === acceptedId);
assert.equal(acceptedAssignment.status, "accepted-extracted-and-routed");
assert.equal(acceptedAssignment.executionEvidence, "compatibility/capability-manifests/core-extraction-wave3-batch-k-approval-form-sublist-static-configuration.v0.1.0.json");
assert.equal(registry.assignments.find((item) => item.functionId === "scripts/lib/approval-form-layout-builder.mjs#normalizeApprovalRowFieldType@364").status, "reclassified-host-or-specialist-route");
assert.match(layoutBuilder, /kind: "sublist-row-control-type"/);
assert(!layoutBuilder.includes("sublist-row-field-type"));
assert.match(layoutBuilder, /projectApprovalFormSubListLookupStaticConfiguration/);
assert.match(core, /"sublist-row-control-type"/);
const controlTypeProjection = core.slice(core.indexOf("function approvalStaticSublistRowControlType"), core.indexOf("function approvalStaticKey"));
assert(!/WeakMap|template|resource|package|DataList/.test(controlTypeProjection));
assert(publicApi.runtimeExports.includes("projectApprovalFormStaticConfiguration"));
assert(!publicApi.runtimeExports.includes("projectApprovalFormSublistRowControlType"));
assert.equal(plan.execution.acceptedEnvelopeProgress, "29/89");
assert.equal(plan.execution.terminalDispositionEnvelopeProgress, "83/89");
assert.equal(plan.execution.currentCoreCompletionScore, 52.1348);
assert.equal(state.migration.currentPhase, phase);
assert.equal(state.migration.nextPhase, "Wave 3 Batch L proof-envelope selection");
assert.equal(state.proofStatus.wave3CoreExtractedEnvelopes, "29/89");
assert.equal(state.proofStatus.wave3TerminalDispositionEnvelopes.total, "83/89");
assert.equal(state.proofStatus.coreExtractionWave3BatchKApprovalFormSublistStaticConfiguration, "passed_source_archive_installed_layout_lowering_rollback");
assert(JSON.stringify(inventory).includes(acceptedId));
console.log("CORE_EXTRACTION_WAVE3_BATCH_K_STRUCTURAL_VALID");

function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }

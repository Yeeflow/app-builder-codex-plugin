#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "core-extraction-wave3-batch-l-final-residual-envelope-reconciliation-and-disposition";
const contract = "compatibility/capability-manifests/core-extraction-wave3-batch-l-final-residual-envelope-reconciliation-and-disposition.v0.1.0.json";
const residualReclassified = ["wave-3-envelope-02", "wave-3-envelope-70", "wave-3-envelope-71", "wave-3-envelope-72", "wave-3-envelope-73", "wave-3-envelope-74"];
const extracted = "wave-3-envelope-96";
const read = (path) => readFileSync(resolve(root, path), "utf8");
const json = (path) => JSON.parse(read(path));
const write = (path, value) => writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`);

const registry = json("compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.5.0.json");
for (const envelope of registry.envelopes.filter((item) => item.wave === "Wave 3")) {
  if (residualReclassified.includes(envelope.id)) {
    envelope.status = "reclassified-host-or-specialist-route";
    envelope.executionEvidence = contract;
    envelope.terminalDisposition = "reclassified-host-runtime-specialist";
    envelope.reclassificationReason = envelope.id === "wave-3-envelope-02"
      ? "The parent envelope has no coherent immutable boundary; the separately proven approvalRowControlType leaf remains tracked at member scope without envelope credit."
      : "Host IDs, mutable control scope, or existing host-owned route selection prevents a coherent immutable Core boundary.";
  }
  if (envelope.id === extracted) {
    envelope.status = "accepted-extracted-and-routed";
    envelope.executionEvidence = contract;
    envelope.terminalDisposition = "core-planning-materialization-failure-dto";
    envelope.reclassificationReason = undefined;
  }
}
for (const assignment of registry.assignments) {
  const envelope = registry.envelopes.find((item) => item.functionIds.includes(assignment.functionId));
  if (!envelope || envelope.wave !== "Wave 3") continue;
  if (residualReclassified.includes(envelope.id) && assignment.functionId !== "scripts/lib/approval-form-layout-builder.mjs#approvalRowControlType@374") {
    assignment.status = "reclassified-host-or-specialist-route";
    assignment.executionEvidence = contract;
    assignment.terminalDisposition = "host-runtime-specialist-route";
  }
  if (envelope.id === extracted) {
    assignment.status = "accepted-extracted-and-routed";
    assignment.executionEvidence = contract;
    assignment.terminalDisposition = "core-planning-materialization-failure-dto";
  }
}
const terminal = registry.envelopes.filter((item) => item.wave === "Wave 3" && ["accepted-extracted-and-routed", "reclassified-host-or-specialist-route"].includes(item.status));
if (terminal.length !== 89) throw new Error("CORE_EXTRACTION_WAVE3_BATCH_L_TERMINAL_COUNT_INVALID");
const extractedEnvelopes = terminal.filter((item) => item.status === "accepted-extracted-and-routed").length;
const reclassifiedEnvelopes = terminal.filter((item) => item.status === "reclassified-host-or-specialist-route").length;
if (extractedEnvelopes !== 34 || reclassifiedEnvelopes !== 55) throw new Error("CORE_EXTRACTION_WAVE3_BATCH_L_DISPOSITION_COUNT_INVALID");
const score = Number((29 + ((100 - 29) * extractedEnvelopes / 89)).toFixed(4));
registry.phase = phase; registry.schemaVersion = "1.6.0"; registry.supersedes = "compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.5.0.json";
registry.execution = { ...(registry.execution || {}), wave3: { ...(registry.execution?.wave3 || {}), wave3CoreExtractedEnvelopes: "34/89", wave3TerminalDispositionEnvelopes: { total: "89/89", extracted: 34, reclassified: 55, deferred: 0 }, correctedWeightedCoreCompletionScore: score, batchL: { residualAuditSet: [...residualReclassified, extracted], extracted: [extracted], reclassified: residualReclassified, coreV2Deferred: [], batchKLeafRetainedWithoutEnvelopeCredit: "scripts/lib/approval-form-layout-builder.mjs#approvalRowControlType@374", reconciliation: "83/89 omitted one partial and five host-orchestration statuses; all now use one terminal envelope status." } } };
write("compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.6.0.json", registry);

const inventory = json("compatibility/capability-manifests/core-extraction-production-ownership-inventory.v1.5.0.json");
const updateInventory = (value) => {
  if (!value || typeof value !== "object") return;
  if (value.id === "scripts/materialize-full-app-generated-final.mjs#buildFailure@11355") { value.extractionStatus = "accepted-extracted-and-routed"; value.executionEvidence = contract; value.terminalDisposition = "core-planning-materialization-failure-dto"; }
  if (value.id && residualReclassified.some((id) => registry.envelopes.find((item) => item.id === id)?.functionIds.includes(value.id)) && value.id !== "scripts/lib/approval-form-layout-builder.mjs#approvalRowControlType@374") { value.extractionStatus = "reclassified-host-or-specialist-route"; value.executionEvidence = contract; value.terminalDisposition = "host-runtime-specialist-route"; }
  for (const child of Object.values(value)) updateInventory(child);
};
updateInventory(inventory); inventory.phase = phase; inventory.schemaVersion = "1.6.0"; inventory.supersedes = "compatibility/capability-manifests/core-extraction-production-ownership-inventory.v1.5.0.json"; inventory.wave3Execution = { marker: "CORE_EXTRACTION_WAVE3_TERMINAL_DISPOSITIONS_89_OF_89", extractedEnvelopes: 34, reclassifiedEnvelopes: 55, coreV2DeferredEnvelopes: 0, weightedCoreCompletionScore: score, evidence: contract };
write("compatibility/capability-manifests/core-extraction-production-ownership-inventory.v1.6.0.json", inventory);

const plan = json("compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.16.0.json");
plan.phase = phase; plan.schemaVersion = "0.17.0"; plan.supersedes = "compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.16.0.json";
plan.execution = { ...(plan.execution || {}), completedWave: "Wave 3", inProgressWave: null, acceptedEnvelopeProgress: "34/89", acceptedEnvelopeCount: 34, terminalDispositionEnvelopeProgress: "89/89", wave3CoreExtractedEnvelopes: 34, wave3TerminalDispositionEnvelopes: { total: 89, extracted: 34, reclassified: 55, deferred: 0 }, currentCoreCompletionScore: score, provisionalWeightedCoreCompletionScore: score, nextPhase: "core-extraction-core-v1-closure", batchL: { marker: "CORE_EXTRACTION_WAVE3_TERMINAL_DISPOSITIONS_89_OF_89", residualAuditSet: [...residualReclassified, extracted], priorProgress: "83/89", correctedProgress: "89/89", score } };
plan.scores = { ...(plan.scores || {}), wave3Provisional: { method: "29 + ((100 - 29) * fullyExtractedWave3Envelopes / 89); reclassifications and mixed-parent envelopes receive no Core credit.", acceptedEnvelopeWeight: 34, totalWave3EnvelopeWeight: 89, value: score } };
const wave = plan.waves?.find((item) => item.id === "Wave 3"); if (wave) { wave.status = "complete"; wave.acceptedEnvelopeProgress = "34/89"; wave.terminalDispositionEnvelopeProgress = "89/89"; wave.wave3CoreExtractedEnvelopes = 34; wave.wave3TerminalDispositionEnvelopes = { extracted: 34, reclassified: 55, deferred: 0 }; wave.provisionalWeightedCoreCompletionScore = score; wave.executionEvidence = contract; }
write("compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.17.0.json", plan);

const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
state.migration.currentPhase = phase; state.migration.currentPhaseStatus = "complete"; state.migration.nextPhase = "core-extraction-core-v1-closure";
state.proofStatus.coreExtractionWave3BatchLResidualReconciliation = "passed_source_archive_installed_materializer_rollback";
state.proofStatus.wave3CoreExtractedEnvelopes = "34/89"; state.proofStatus.wave3TerminalDispositionEnvelopes = { total: "89/89", extracted: 34, reclassified: 55, deferred: 0 }; state.proofStatus.coreExtractionProvisionalWeightedCompletionScore = score;
state.completed = (state.completed || []).filter((item) => item.id !== phase); state.completed.push({ id: phase, status: "complete", evidence: contract }); state.inProgress = [{ id: "core-extraction-core-v1-closure", description: "Perform the separate Core v1 closure audit only after reviewing the complete Wave 1-3 terminal-disposition evidence." }];
write("docs/architecture/yeeflow-app-builder-core-migration-state.json", state);
console.log("CORE_EXTRACTION_WAVE3_BATCH_L_EVIDENCE_WRITTEN");

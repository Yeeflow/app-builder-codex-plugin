#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "core-extraction-wave3-batch-g-approval-form-static-configuration";
const contractPath = `compatibility/capability-manifests/${phase}.v0.1.0.json`;
const reportPath = `docs/architecture/yeeflow-app-builder-${phase}.v0.1.0.md`;
const selected = ["wave-3-envelope-31", "wave-3-envelope-34", "wave-3-envelope-38", "wave-3-envelope-55", "wave-3-envelope-67", "wave-3-envelope-94", "wave-3-envelope-95"];
const extracted = new Set(["wave-3-envelope-31", "wave-3-envelope-55", "wave-3-envelope-67", "wave-3-envelope-95"]);
const reclassified = new Set(["wave-3-envelope-34", "wave-3-envelope-38", "wave-3-envelope-94"]);
const reclassificationReasons = {
  "wave-3-envelope-34": "The envelope validates Map-backed variable scope and mutates/removes template sections; it is Host-owned.",
  "wave-3-envelope-38": "The envelope writes public-form positions and source-residue/template shapes; it is Host-owned.",
  "wave-3-envelope-94": "The envelope mutates page temp variables and constructs generated field controls; it is Host-owned.",
};

const read = (path) => readFileSync(resolve(root, path), "utf8");
const json = (path) => JSON.parse(read(path));
const write = (path, value) => writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`);
const sha = (value) => createHash("sha256").update(value).digest("hex");
const registry = json("compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.0.0.json");
const envelopes = registry.envelopes.filter((envelope) => selected.includes(envelope.id));
if (envelopes.length !== 7 || envelopes.reduce((count, envelope) => count + envelope.functionCount, 0) !== 21) throw new Error("CORE_EXTRACTION_WAVE3_BATCH_G_ASSIGNMENT_INVALID");
const covered = new Set(envelopes.flatMap((envelope) => envelope.functionIds));
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");

const contract = {
  schemaVersion: "1.0.0",
  phase,
  marker: "CORE_EXTRACTION_WAVE3_BATCH_G_APPROVAL_FORM_STATIC_CONFIGURATION_PASSED",
  decision: {
    status: "complete",
    extractedEnvelopes: [...extracted],
    reclassifiedHostOnlyEnvelopes: [...reclassified],
    facade: "projectApprovalFormStaticConfiguration",
  },
  extracted: {
    functions: envelopes.filter((envelope) => extracted.has(envelope.id)).flatMap((envelope) => envelope.functionIds),
    behavior: "Immutable Approval Form static configuration only: explicit default classification, public step normalization, full-row classification, field-spec deduplication, public field selection, and no-fields presentation DTO projection.",
  },
  reclassifiedHostOnly: Object.fromEntries([...reclassified].map((id) => [id, { functionIds: registry.envelopes.find((envelope) => envelope.id === id).functionIds, reason: reclassificationReasons[id] }])),
  preservedPhase18B: "Approval Form embedded-Sublist Lookup configuration preservation remains an independent route and is neither duplicated nor weakened.",
  exclusions: ["template/resource/page-temp-variable mutation", "host-generated IDs", "layout insertion or removal", "task and workflow execution", "Job Position resolution", "API calls", "frontend Lookup behavior", "runtime expressions", "automatic writeback", "package output", "Data List DTO reuse"],
  corpus: {
    fixture: "compatibility/differential-fixtures/core-extraction-wave3-batch-g-approval-form-static-configuration.v0.1.0.json",
    runner: "scripts/test-core-extraction-wave3-batch-g-approval-form-static-configuration.mjs",
    validator: "scripts/validate-core-extraction-wave3-batch-g-approval-form-static-configuration.mjs",
    rollback: "scripts/test-core-extraction-wave3-batch-g-legacy-rollback.mjs",
    caseCount: 11,
    surfaces: ["compiled source", "Plugin dist", "temporary official ZIP", "simulated installed Plugin"],
  },
  artifacts: distribution.artifacts,
  progress: {
    wave3CoreExtractedEnvelopes: "24/89",
    wave3TerminalDispositionEnvelopes: { total: "42/89", extracted: 24, reclassified: 18, deferred: 0 },
    weightedCoreCompletion: 48.1461,
  },
};
write(contractPath, contract);

registry.schemaVersion = "1.1.0";
registry.phase = phase;
registry.supersedes = "compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.0.0.json";
registry.envelopes = registry.envelopes.map((envelope) => !selected.includes(envelope.id) ? envelope : {
  ...envelope,
  status: extracted.has(envelope.id) ? "accepted-extracted-and-routed" : "reclassified-host-or-specialist-route",
  terminalDisposition: extracted.has(envelope.id) ? "core-approval-form-static-configuration-facade" : "host-mutation-or-context-boundary",
  executionEvidence: contractPath,
  reclassificationReason: reclassified.has(envelope.id) ? reclassificationReasons[envelope.id] : undefined,
});
registry.assignments = registry.assignments.map((assignment) => !covered.has(assignment.functionId) ? assignment : {
  ...assignment,
  status: [...reclassified].some((id) => registry.envelopes.find((envelope) => envelope.id === id).functionIds.includes(assignment.functionId)) ? "reclassified-host-or-specialist-route" : "accepted-extracted-or-envelope-covered",
  executionEvidence: contractPath,
});
registry.execution = {
  ...(registry.execution || {}),
  wave3: {
    ...(registry.execution?.wave3 || {}),
    wave3CoreExtractedEnvelopes: "24/89",
    wave3TerminalDispositionEnvelopes: { total: "42/89", extracted: 24, reclassified: 18, deferred: 0 },
    batchG: { extracted: [...extracted], reclassified: [...reclassified], functionCount: 21 },
  },
};
write("compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.1.0.json", registry);

const inventory = json("compatibility/capability-manifests/core-extraction-production-ownership-inventory.v1.0.0.json");
inventory.schemaVersion = "1.1.0";
inventory.phase = phase;
inventory.supersedes = "compatibility/capability-manifests/core-extraction-production-ownership-inventory.v1.0.0.json";
inventory.functions = inventory.functions.map((functionItem) => !covered.has(functionItem.id) ? functionItem : {
  ...functionItem,
  extractionStatus: [...reclassified].some((id) => registry.envelopes.find((envelope) => envelope.id === id).functionIds.includes(functionItem.id)) ? "reclassified-host-or-specialist-route" : "accepted-extracted-or-envelope-covered",
  executionEvidence: contractPath,
});
inventory.modules = inventory.modules.map((moduleItem) => ({ ...moduleItem, functions: moduleItem.functions.map((functionItem) => inventory.functions.find((candidate) => candidate.id === functionItem.id) || functionItem) }));
inventory.wave3Execution = {
  ...(inventory.wave3Execution || {}),
  marker: contract.marker,
  wave3CoreExtractedEnvelopes: "24/89",
  wave3TerminalDispositionEnvelopes: { total: "42/89", extracted: 24, reclassified: 18, deferred: 0 },
  batchG: { extracted: [...extracted], reclassified: [...reclassified], functionCount: 21 },
};
write("compatibility/capability-manifests/core-extraction-production-ownership-inventory.v1.1.0.json", inventory);

const plan = json("compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.11.0.json");
plan.schemaVersion = "0.12.0";
plan.phase = phase;
plan.supersedes = "compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.11.0.json";
const wave3 = plan.waves.find((wave) => wave.id === "Wave 3");
Object.assign(wave3, { acceptedEnvelopeProgress: "24/89", terminalDispositionEnvelopeProgress: "42/89", wave3CoreExtractedEnvelopes: 24, wave3TerminalDispositionEnvelopes: { extracted: 24, reclassified: 18, deferred: 0 }, executionEvidence: contractPath });
plan.execution = { ...(plan.execution || {}), acceptedEnvelopeProgress: "24/89", currentCoreCompletionScore: 48.1461, provisionalWeightedCoreCompletionScore: 48.1461, nextPhase: "Wave 3 Batch H proof-envelope selection", wave3CoreExtractedEnvelopes: 24, wave3TerminalDispositionEnvelopes: { total: 42, extracted: 24, reclassified: 18, deferred: 0 } };
write("compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.12.0.json", plan);

const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
state.migration.currentPhase = phase;
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = "Wave 3 Batch H proof-envelope selection";
state.proofStatus.coreExtractionWave3BatchGApprovalFormStaticConfiguration = "passed_source_archive_installed_materializer_rollback";
state.proofStatus.wave3CoreExtractedEnvelopes = "24/89";
state.proofStatus.wave3TerminalDispositionEnvelopes = { total: "42/89", extracted: 24, reclassified: 18, deferred: 0 };
state.proofStatus.coreExtractionProvisionalWeightedCompletionScore = 48.1461;
state.completed = (state.completed || []).filter((item) => item.id !== phase);
state.completed.push({ id: phase, status: "complete", evidence: contractPath });
state.inProgress = [{ id: "Wave 3 Batch H proof-envelope selection", description: "Select the next independently reversible calibrated Wave 3 envelope." }];
write("docs/architecture/yeeflow-app-builder-core-migration-state.json", state);

write(reportPath, `# Core Extraction Wave 3 Batch G: Approval Form Static Configuration\n\n\`${contract.marker}\`\n\nThe single Materializer Core facade \`projectApprovalFormStaticConfiguration\` now routes four immutable Approval Form static-configuration envelopes: 31, 55, 67, and 95. It preserves ordering, default values, static output shapes, validation behavior, and lossless string IDs. Host code continues to generate IDs and owns all mutation and runtime behavior.\n\nEnvelopes 34, 38, and 94 are formally Host-only because they combine variable-scope validation, template or page-variable mutation, generated field control construction, or public-form position writes.\n\nThe 11-case corpus passed compiled source, official Plugin dist, and a simulated installed Plugin. The actual Approval Form materializer and retained Phase 18B Lookup configuration-preservation suites passed. The temporary-copy rollback restores the exact pre-Batch-G Legacy function bodies while retaining Phase 18B.\n\nWave 3 progress is \`24/89\` Core-extracted envelopes and \`42/89\` terminal dispositions (24 extracted, 18 reclassified). The provisional weighted Core completion score is \`48.1461\`.\n`);
console.log("CORE_EXTRACTION_WAVE3_BATCH_G_EVIDENCE_WRITTEN", sha(read(contractPath)));

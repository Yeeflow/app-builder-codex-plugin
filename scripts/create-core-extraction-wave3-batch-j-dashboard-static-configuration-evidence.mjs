#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "core-extraction-wave3-batch-j-dashboard-static-configuration-selection-and-execution";
const contractPath = `compatibility/capability-manifests/${phase}.v0.1.0.json`;
const reportPath = `docs/architecture/yeeflow-app-builder-${phase}.v0.1.0.md`;
const selected = new Set(["wave-3-envelope-80"]);
const reclassified = new Set(["wave-3-envelope-44", "wave-3-envelope-45", "wave-3-envelope-46", "wave-3-envelope-78", "wave-3-envelope-79", "wave-3-envelope-81", "wave-3-envelope-82", "wave-3-envelope-85", "wave-3-envelope-86"]);
const reasons = {
  "wave-3-envelope-44": "The cohort combines page-name parsing with mutable filter-binding pruning and action mutation.",
  "wave-3-envelope-45": "The cohort mixes record deduplication with template-control inspection and Collection structural ownership.",
  "wave-3-envelope-46": "Template selection is mixed with page resource selection, hidden-summary parent lookup, temporary-variable inference, and local action scope resolution.",
  "wave-3-envelope-78": "Every member allocates control UUIDs, rewrites template/runtime references, or mutates dashboard and Collection structures.",
  "wave-3-envelope-79": "KPI and analytics runtime contracts require generated IDs, list identities, runtime expression fields, and dashboard runtime ownership.",
  "wave-3-envelope-81": "Select-filter and Collection filter lowering produce host-bound controls, ListID references, and runtime variable expressions.",
  "wave-3-envelope-82": "Slot discovery and field resolution traverse mutable resource/template graphs or Collection runtime context.",
  "wave-3-envelope-85": "Container normalization and runtime-reference sanitization mutate template/resource structures.",
  "wave-3-envelope-86": "Full-text conditions emit runtime variable expressions and must remain with host filter binding lifecycle."
};
const read = (path) => readFileSync(resolve(root, path), "utf8");
const json = (path) => JSON.parse(read(path));
const write = (path, value) => writeFileSync(resolve(root, path), typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`);
const sha = (value) => createHash("sha256").update(value).digest("hex");
const registry = json("compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.3.0.json");
const inventory = json("compatibility/capability-manifests/core-extraction-production-ownership-inventory.v1.3.0.json");
const plan = json("compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.14.0.json");
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const envelopeIds = new Set([...selected, ...reclassified]);
const memberIds = new Set(registry.envelopes.filter((item) => envelopeIds.has(item.id)).flatMap((item) => item.functionIds));
const envelopeForFunction = (id) => registry.envelopes.find((item) => item.functionIds.includes(id))?.id;
const progress = { total: "74/89", extracted: 28, reclassified: 46, deferred: 1 };
const score = 51.3371;
const contract = {
  schemaVersion: "1.0.0", phase, marker: "CORE_EXTRACTION_WAVE3_BATCH_J_DASHBOARD_STATIC_CONFIGURATION_PASSED",
  decision: { status: "complete", extractedEnvelopes: [...selected], reclassifiedHostOnlyEnvelopes: [...reclassified], facade: "projectDashboardStaticConfiguration" },
  extracted: { functions: registry.envelopes.find((item) => item.id === "wave-3-envelope-80").functionIds, behavior: "Frozen empty Legacy-equivalent Dashboard filter normalization and a deterministic date-like analytics field predicate only." },
  reclassifiedHostOnly: Object.fromEntries([...reclassified].map((id) => [id, { functionIds: registry.envelopes.find((item) => item.id === id).functionIds, reason: reasons[id] }])),
  corpus: { fixture: "compatibility/differential-fixtures/core-extraction-wave3-batch-j-dashboard-static-configuration.v0.1.0.json", runner: "scripts/test-core-extraction-wave3-batch-j-dashboard-static-configuration.mjs", caseCount: 5, surfaces: ["compiled source", "Plugin dist", "temporary official ZIP", "simulated installed Plugin", "actual Dashboard materializer", "temporary-copy Legacy rollback"] },
  exclusions: ["control UUID allocation", "template/resource/Collection mutation", "template placeholder or runtime-reference rewriting", "frontend chart rendering", "Dashboard runtime", "runtime expressions", "APIs", "package output", "temporary variables", "Data List/Approval Form/Workflow/Local Runtime behavior"],
  artifacts: distribution.artifacts, progress: { wave3CoreExtractedEnvelopes: "28/89", wave3TerminalDispositionEnvelopes: progress, weightedCoreCompletion: score }
};
write(contractPath, contract);
registry.schemaVersion = "1.4.0"; registry.phase = phase; registry.supersedes = "compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.3.0.json";
registry.envelopes = registry.envelopes.map((item) => !envelopeIds.has(item.id) ? item : { ...item, status: selected.has(item.id) ? "accepted-extracted-and-routed" : "reclassified-host-or-specialist-route", terminalDisposition: selected.has(item.id) ? "core-dashboard-static-configuration" : "dashboard-host-or-runtime-boundary", executionEvidence: contractPath, reclassificationReason: reclassified.has(item.id) ? reasons[item.id] : undefined });
registry.assignments = registry.assignments.map((item) => !memberIds.has(item.functionId) ? item : { ...item, status: selected.has(envelopeForFunction(item.functionId)) ? "accepted-extracted-or-envelope-covered" : "reclassified-host-orchestration", executionEvidence: contractPath });
registry.execution = { ...(registry.execution || {}), wave3: { ...(registry.execution?.wave3 || {}), wave3CoreExtractedEnvelopes: "28/89", wave3TerminalDispositionEnvelopes: progress, batchJ: { extracted: [...selected], reclassified: [...reclassified] } } };
write("compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.4.0.json", registry);
inventory.schemaVersion = "1.4.0"; inventory.phase = phase; inventory.supersedes = "compatibility/capability-manifests/core-extraction-production-ownership-inventory.v1.3.0.json";
inventory.functions = inventory.functions.map((item) => !memberIds.has(item.id) ? item : { ...item, category: reclassified.has(envelopeForFunction(item.id)) ? "host-runtime" : item.category, extractionStatus: selected.has(envelopeForFunction(item.id)) ? "accepted-extracted-or-envelope-covered" : "reclassified-host-orchestration", executionEvidence: contractPath });
inventory.modules = inventory.modules.map((module) => ({ ...module, functions: module.functions.map((item) => inventory.functions.find((candidate) => candidate.id === item.id) || item) }));
write("compatibility/capability-manifests/core-extraction-production-ownership-inventory.v1.4.0.json", inventory);
plan.schemaVersion = "0.15.0"; plan.phase = phase; plan.supersedes = "compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.14.0.json";
const wave = plan.waves.find((item) => item.id === "Wave 3"); Object.assign(wave, { acceptedEnvelopeProgress: "28/89", terminalDispositionEnvelopeProgress: "74/89", wave3CoreExtractedEnvelopes: 28, wave3TerminalDispositionEnvelopes: { extracted: 28, reclassified: 46, deferred: 1 }, executionEvidence: contractPath, provisionalWeightedCoreCompletionScore: score });
plan.execution = { ...(plan.execution || {}), acceptedEnvelopeProgress: "28/89", currentCoreCompletionScore: score, provisionalWeightedCoreCompletionScore: score, nextPhase: "Wave 3 Batch K proof-envelope selection", wave3CoreExtractedEnvelopes: 28, wave3TerminalDispositionEnvelopes: { total: 74, extracted: 28, reclassified: 46, deferred: 1 }, batchJ: { extracted: [...selected], reclassified: [...reclassified] } };
plan.scores = { ...(plan.scores || {}), wave3Provisional: { method: "29 + ((100 - 29) * acceptedEnvelopeWeight / totalWave3EnvelopeWeight); only Core-extracted envelope weight is credited.", acceptedEnvelopeWeight: 28, totalWave3EnvelopeWeight: 89, value: score } };
write("compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.15.0.json", plan);
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
state.migration.currentPhase = phase; state.migration.currentPhaseStatus = "complete"; state.migration.nextPhase = "Wave 3 Batch K proof-envelope selection";
state.proofStatus.coreExtractionWave3BatchJDashboardStaticConfiguration = "passed_source_archive_installed_materializer_rollback"; state.proofStatus.wave3CoreExtractedEnvelopes = "28/89"; state.proofStatus.wave3TerminalDispositionEnvelopes = progress; state.proofStatus.coreExtractionProvisionalWeightedCompletionScore = score;
state.completed = (state.completed || []).filter((item) => item.id !== phase); state.completed.push({ id: phase, status: "complete", evidence: contractPath }); state.inProgress = [{ id: "Wave 3 Batch K proof-envelope selection", description: "Select the next independently reversible calibrated Wave 3 envelope." }];
write("docs/architecture/yeeflow-app-builder-core-migration-state.json", state);
write(reportPath, `# Core Extraction Wave 3 Batch J: Dashboard Static Configuration\n\n\`${contract.marker}\`\n\nOnly envelope 80 has a cohesive immutable boundary. \`projectDashboardStaticConfiguration\` preserves the Legacy empty filter-normalization result and date-like analytics-field predicate. It does not receive ListID, templates, resources, controls, runtime expressions, or host context.\n\nThe other nine envelopes are explicitly reclassified: they allocate control IDs, mutate Dashboard or Collection templates, rewrite runtime references, build Dashboard runtime contracts, bind filter variables, or traverse mutable resource graphs.\n\nThe five-case Dashboard corpus passed source, official ZIP, simulated installed Plugin, actual Dashboard materializer parity, deterministic double run with established UUID normalization, immutability, leakage/scope gates, and temporary-copy Legacy rollback.\n\nWave 3 progress is \`28/89\` Core-extracted and \`74/89\` terminal dispositions. The weighted Core completion score is \`${score}\`, calculated from extracted weight only.\n`);
console.log("CORE_EXTRACTION_WAVE3_BATCH_J_EVIDENCE_WRITTEN", sha(read(contractPath)));

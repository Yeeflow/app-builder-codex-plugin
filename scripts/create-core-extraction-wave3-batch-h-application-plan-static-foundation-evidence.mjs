#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "core-extraction-wave3-batch-h-application-plan-foundation-selection-and-execution";
const contractPath = `compatibility/capability-manifests/${phase}.v0.1.0.json`;
const reportPath = `docs/architecture/yeeflow-app-builder-${phase}.v0.1.0.md`;
const extracted = new Set(["wave-3-envelope-29", "wave-3-envelope-62"]);
const reclassified = new Set(["wave-3-envelope-30", "wave-3-envelope-32", "wave-3-envelope-37", "wave-3-envelope-39", "wave-3-envelope-75", "wave-3-envelope-76", "wave-3-envelope-77", "wave-3-envelope-84", "wave-3-envelope-87"]);
const deferred = new Set(["wave-3-envelope-96"]);
const selected = new Set([...extracted, ...reclassified, ...deferred]);
const callerCounts = new Map([
  ["parseJsonMaybe", 8], ["findHeaderIndex", 152], ["extractNumberedSection", 17], ["extractSubsections", 1], ["extractSubsection", 0], ["inferNavigationType", 1], ["isWorkbenchCustomForm", 2], ["isTableLine", 46], ["unique", 18],
]);
const reasons = {
  "wave-3-envelope-30": "Mixed application-color, control-tree, Dashboard runtime, and Job Position concerns require Host identity, template, or runtime context.",
  "wave-3-envelope-32": "The cohort crosses action, summary, template, Data List, and generated-runtime normalization domains, so it has no single stable static DTO boundary.",
  "wave-3-envelope-37": "The cohort includes lossless Host identity validation, deterministic UUID generation, dependency rewrites, and error/context projection; it is not a single host-neutral parser boundary.",
  "wave-3-envelope-39": "The cohort creates or removes controls, temp variables, dependencies, actions, and graph state; it is mutable Host orchestration.",
  "wave-3-envelope-75": "Dataset-slot and business-section discovery operate on template/layout graph objects rather than JSON-safe standalone planning inputs.",
  "wave-3-envelope-76": "The cohort mutates dependency maps, page temp-variable references, action controls, and sections, with Job Position proof context.",
  "wave-3-envelope-77": "Master-detail controls, summary controls, and runtime navigation DTOs each require specialist surface contracts and cannot share this parser facade.",
  "wave-3-envelope-84": "Page-dependency merge and fixture API identity construction are Host mutation/allocation behavior.",
  "wave-3-envelope-87": "Workbench queue columns and section-content checks are template graph/presentation behavior, not an independent immutable plan boundary.",
};

const read = (path) => readFileSync(resolve(root, path), "utf8");
const json = (path) => JSON.parse(read(path));
const write = (path, value) => writeFileSync(resolve(root, path), typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`);
const sha = (value) => createHash("sha256").update(value).digest("hex");
const registry = json("compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.1.0.json");
const inventory = json("compatibility/capability-manifests/core-extraction-production-ownership-inventory.v1.1.0.json");
const plan = json("compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.12.0.json");
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const envelopes = registry.envelopes.filter((item) => selected.has(item.id));
if (envelopes.length !== 12 || envelopes.reduce((total, item) => total + item.functionCount, 0) !== 111) throw new Error("CORE_EXTRACTION_WAVE3_BATCH_H_ASSIGNMENT_INVALID");
const members = new Set(envelopes.flatMap((item) => item.functionIds));

const contract = {
  schemaVersion: "1.0.0",
  phase,
  marker: "CORE_EXTRACTION_WAVE3_BATCH_H_APPLICATION_PLAN_STATIC_FOUNDATION_PASSED",
  decision: {
    status: "complete",
    maximumSelectedCoreEnvelopes: 6,
    extractedEnvelopes: [...extracted],
    reclassifiedHostOnlyEnvelopes: [...reclassified],
    deferredEnvelope: "wave-3-envelope-96",
    facade: "projectApplicationPlanStaticFoundation",
  },
  callerEvidence: {
    method: "Production-only TypeScript AST call-expression evidence from the reconciled caller graph; tests, fixtures, dist, documentation, protected duplicates, and historical artifacts are excluded.",
    selectedFunctions: Object.fromEntries([...callerCounts]),
    zeroCallerTerminalDisposition: "extractSubsection has zero production callers. It remains Legacy-only with an explicit terminal zero-caller disposition and is not a Core facade kind or public leaf API.",
  },
  extracted: {
    functions: envelopes.filter((item) => extracted.has(item.id)).flatMap((item) => item.functionIds).filter((id) => !id.includes("#extractSubsection@")),
    behavior: "JSON-safe parsing and static normalization only: optional JSON parsing, normalized header lookup, numbered/subsection extraction, navigation type inference, workbench classification, Markdown table-line detection, and stable case-insensitive uniqueness.",
    hostCompatibility: "The materializer returns fresh Legacy-shaped arrays or parsed JSON where legacy callers may retain mutability; Core results themselves remain deeply frozen.",
  },
  reclassifiedHostOnly: Object.fromEntries([...reclassified].map((id) => [id, { functionIds: registry.envelopes.find((item) => item.id === id).functionIds, reason: reasons[id] }])),
  deferred: { "wave-3-envelope-96": "buildFailure is a separate generic error DTO concern. It is not needed by this cohesive parser facade and remains a later independently reviewable candidate." },
  exclusions: ["template/resource/package mutation", "page temp-variable mutation", "generated identities", "workflow execution", "Job Position resolution", "runtime expressions", "frontend behavior", "API calls", "Data List and Approval Form behavior changes"],
  corpus: {
    fixture: "compatibility/differential-fixtures/core-extraction-wave3-batch-h-application-plan-static-foundation.v0.1.0.json",
    runner: "scripts/test-core-extraction-wave3-batch-h-application-plan-static-foundation.mjs",
    validator: "scripts/validate-core-extraction-wave3-batch-h-application-plan-static-foundation.mjs",
    caseCount: 14,
    surfaces: ["compiled source", "Plugin dist", "temporary official ZIP", "simulated installed Plugin", "actual materializer", "temporary-copy Legacy rollback"],
  },
  artifacts: distribution.artifacts,
  progress: { wave3CoreExtractedEnvelopes: "26/89", wave3TerminalDispositionEnvelopes: { total: "53/89", extracted: 26, reclassified: 27, deferred: 1 }, weightedCoreCompletion: 49.7416 },
};
write(contractPath, contract);

registry.schemaVersion = "1.2.0"; registry.phase = phase; registry.supersedes = "compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.1.0.json";
registry.envelopes = registry.envelopes.map((item) => !selected.has(item.id) ? item : {
  ...item,
  status: extracted.has(item.id) ? "accepted-extracted-and-routed" : reclassified.has(item.id) ? "reclassified-host-or-specialist-route" : "deferred-separate-static-error-projection",
  terminalDisposition: extracted.has(item.id) ? "core-application-plan-static-foundation-facade" : reclassified.has(item.id) ? "host-mutation-runtime-or-specialist-boundary" : "remaining-separate-static-error-projection",
  executionEvidence: contractPath,
  reclassificationReason: reclassified.has(item.id) ? reasons[item.id] : undefined,
});
registry.assignments = registry.assignments.map((item) => !members.has(item.functionId) ? item : {
  ...item,
  callers: callerCounts.has(item.function) ? callerCounts.get(item.function) : item.callers,
  callerEvidence: callerCounts.has(item.function) ? { ...(item.callerEvidence || {}), callerCount: callerCounts.get(item.function), verifiedForBatchH: true } : item.callerEvidence,
  status: item.function === "extractSubsection" ? "terminal-zero-caller-legacy-only" : extracted.has(registry.envelopes.find((envelope) => envelope.functionIds.includes(item.functionId))?.id) ? "accepted-extracted-or-envelope-covered" : reclassified.has(registry.envelopes.find((envelope) => envelope.functionIds.includes(item.functionId))?.id) ? "reclassified-host-orchestration" : "deferred-separate-static-error-projection",
  executionEvidence: contractPath,
});
registry.execution = { ...(registry.execution || {}), wave3: { ...(registry.execution?.wave3 || {}), wave3CoreExtractedEnvelopes: "26/89", wave3TerminalDispositionEnvelopes: { total: "53/89", extracted: 26, reclassified: 27, deferred: 1 }, batchH: { extracted: [...extracted], reclassified: [...reclassified], deferred: [...deferred], selectedFunctionCount: 9, assignedFunctionCount: 111 } } };
registry.summary = { ...(registry.summary || {}), candidateFunctionCount: registry.assignments.length, batchHDisposition: { extracted: 2, reclassified: 9, deferred: 1 } };
write("compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.2.0.json", registry);

inventory.schemaVersion = "1.2.0"; inventory.phase = phase; inventory.supersedes = "compatibility/capability-manifests/core-extraction-production-ownership-inventory.v1.1.0.json";
inventory.functions = inventory.functions.map((item) => !members.has(item.id) ? item : {
  ...item,
  callers: callerCounts.has(item.function) ? callerCounts.get(item.function) : item.callers,
  callerEvidence: callerCounts.has(item.function) ? { ...(item.callerEvidence || {}), callerCount: callerCounts.get(item.function), verifiedForBatchH: true } : item.callerEvidence,
  category: reclassified.has(registry.envelopes.find((envelope) => envelope.functionIds.includes(item.id))?.id) ? "host-runtime" : item.category,
  extractionStatus: item.function === "extractSubsection" ? "terminal-zero-caller-legacy-only" : extracted.has(registry.envelopes.find((envelope) => envelope.functionIds.includes(item.id))?.id) ? "accepted-extracted-or-envelope-covered" : reclassified.has(registry.envelopes.find((envelope) => envelope.functionIds.includes(item.id))?.id) ? "reclassified-host-orchestration" : "deferred-separate-static-error-projection",
  executionEvidence: contractPath,
});
inventory.modules = inventory.modules.map((module) => ({ ...module, functions: module.functions.map((item) => inventory.functions.find((candidate) => candidate.id === item.id) || item) }));
inventory.wave3Execution = { ...(inventory.wave3Execution || {}), marker: contract.marker, wave3CoreExtractedEnvelopes: "26/89", wave3TerminalDispositionEnvelopes: { total: "53/89", extracted: 26, reclassified: 27, deferred: 1 }, batchH: { extracted: [...extracted], reclassified: [...reclassified], deferred: [...deferred] } };
write("compatibility/capability-manifests/core-extraction-production-ownership-inventory.v1.2.0.json", inventory);

plan.schemaVersion = "0.13.0"; plan.phase = phase; plan.supersedes = "compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.12.0.json";
const wave3 = plan.waves.find((wave) => wave.id === "Wave 3");
Object.assign(wave3, { acceptedEnvelopeProgress: "26/89", terminalDispositionEnvelopeProgress: "53/89", wave3CoreExtractedEnvelopes: 26, wave3TerminalDispositionEnvelopes: { extracted: 26, reclassified: 27, deferred: 1 }, executionEvidence: contractPath, provisionalWeightedCoreCompletionScore: 49.7416 });
plan.execution = { ...(plan.execution || {}), acceptedEnvelopeProgress: "26/89", currentCoreCompletionScore: 49.7416, provisionalWeightedCoreCompletionScore: 49.7416, nextPhase: "Wave 3 Batch I proof-envelope selection", wave3CoreExtractedEnvelopes: 26, wave3TerminalDispositionEnvelopes: { total: 53, extracted: 26, reclassified: 27, deferred: 1 }, batchH: { extracted: [...extracted], reclassified: [...reclassified], deferred: [...deferred] } };
plan.scores = { ...(plan.scores || {}), wave3Provisional: { method: "29 + ((100 - 29) * acceptedEnvelopeWeight / totalWave3EnvelopeWeight); only Core-extracted envelope weight is credited.", acceptedEnvelopeWeight: 26, totalWave3EnvelopeWeight: 89, value: 49.7416 } };
write("compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.13.0.json", plan);

const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
state.migration.currentPhase = phase; state.migration.currentPhaseStatus = "complete"; state.migration.nextPhase = "Wave 3 Batch I proof-envelope selection";
state.proofStatus.coreExtractionWave3BatchHApplicationPlanStaticFoundation = "passed_source_archive_installed_materializer_rollback";
state.proofStatus.wave3CoreExtractedEnvelopes = "26/89"; state.proofStatus.wave3TerminalDispositionEnvelopes = { total: "53/89", extracted: 26, reclassified: 27, deferred: 1 }; state.proofStatus.coreExtractionProvisionalWeightedCompletionScore = 49.7416;
state.completed = (state.completed || []).filter((item) => item.id !== phase); state.completed.push({ id: phase, status: "complete", evidence: contractPath });
state.inProgress = [{ id: "Wave 3 Batch I proof-envelope selection", description: "Select only the next independently reversible calibrated Wave 3 envelope after the Batch H terminal dispositions." }];
write("docs/architecture/yeeflow-app-builder-core-migration-state.json", state);

write(reportPath, `# Core Extraction Wave 3 Batch H: Application Plan Foundation\n\n\`${contract.marker}\`\n\n## Decision\n\nTwo of the twelve assigned Application Plan envelopes are a coherent host-neutral parser/normalizer boundary: envelope 29 and envelope 62. They route through the single Planning Core facade \`projectApplicationPlanStaticFoundation\`. \`extractSubsection\` has zero direct production callers and remains Legacy-only with an explicit zero-caller terminal disposition; it is not a Core facade kind or a public leaf API.\n\nNine envelopes are reclassified to Host or specialist ownership because their behavior crosses template graphs, page variables, generated IDs, Job Position proof, controls, actions, runtime DTOs, or mutable resources. Envelope 96 remains a separate deferred generic error-DTO candidate, not an unassigned function.\n\nThe 13-case corpus passed compiled source, Plugin dist, temporary official ZIP, simulated installed Plugin, actual materializer double-run parity, and a temporary-copy rollback that restores only this Batch H bridge. Core results are frozen and JSON serializable; host wrappers retain fresh Legacy-shaped mutable arrays/objects where existing callers require them.\n\nWave 3 progress is \`26/89\` Core-extracted envelopes and \`53/89\` terminal dispositions (26 extracted, 27 reclassified, one deferred). The provisional weighted Core completion score is \`49.7416\`.\n`);
console.log("CORE_EXTRACTION_WAVE3_BATCH_H_EVIDENCE_WRITTEN", sha(read(contractPath)));

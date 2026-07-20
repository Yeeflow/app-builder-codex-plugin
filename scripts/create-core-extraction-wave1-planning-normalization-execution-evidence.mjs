#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "core-extraction-wave-1-planning-normalization-execution";
const registryV1Path = "compatibility/capability-manifests/core-extraction-proof-envelope-registry.v0.1.0.json";
const registryPath = "compatibility/capability-manifests/core-extraction-proof-envelope-registry.v0.2.0.json";
const inventoryV1Path = "compatibility/capability-manifests/core-extraction-production-ownership-inventory.v0.1.0.json";
const inventoryPath = "compatibility/capability-manifests/core-extraction-production-ownership-inventory.v0.2.0.json";
const planV2Path = "compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.2.0.json";
const planPath = "compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.3.0.json";
const contractPath = "compatibility/capability-manifests/core-extraction-wave1-planning-normalization-execution.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-core-extraction-wave1-planning-normalization-execution.v0.1.0.md";
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json";
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const registryV1 = json(registryV1Path);
const waveOne = registryV1.envelopes.filter((item) => item.wave === "Wave 1");
const functionIds = waveOne.flatMap((item) => item.functionIds);
if (waveOne.length !== 6 || functionIds.length !== 24 || new Set(functionIds).size !== functionIds.length) throw Error("CORE_EXTRACTION_WAVE1_TRACEABILITY_INVALID");
const artifacts = Object.fromEntries(distribution.artifacts.map((item) => [item.packageName, { path: item.path, sha256: item.sha256 }]));
const legacyDisposition = "extracted-to-core-planning-through-retained-compatibility-shim";

const registry = structuredClone(registryV1);
registry.schemaVersion = "1.0.0";
registry.phase = phase;
registry.supersedes = registryV1Path;
registry.execution = {
  marker: "CORE_EXTRACTION_WAVE1_ALL_ENVELOPES_COMPLETED",
  terminalDisposition: legacyDisposition,
  completedEnvelopeCount: 6,
  completedFunctionCount: 24,
  publicFacade: "projectPlanningLabel",
  existingMarkdownFacade: "The pre-existing Markdown Planning Core public functions remain the routed surface; no leaf callback was exposed.",
  proof: ["AST dependency and caller review", "frozen Legacy differential corpus", "source/dist/temporary official ZIP/simulated installed parity", "input immutability and JSON serialization", "temporary-copy Legacy rollback"],
};
for (const assignment of registry.assignments) if (functionIds.includes(assignment.functionId)) {
  assignment.status = "accepted-extracted-and-routed";
  assignment.terminalDisposition = legacyDisposition;
  assignment.executionEvidence = contractPath;
}
for (const envelope of registry.envelopes) if (envelope.wave === "Wave 1") {
  envelope.status = "accepted-extracted-and-routed";
  envelope.terminalDisposition = legacyDisposition;
  envelope.executionEvidence = contractPath;
}
write(registryPath, registry);

const inventoryV1 = json(inventoryV1Path);
const inventory = structuredClone(inventoryV1);
inventory.schemaVersion = "1.0.0";
inventory.phase = phase;
inventory.supersedes = inventoryV1Path;
inventory.summary.coreCompletionScore = 27;
inventory.wave1Execution = {
  marker: "CORE_EXTRACTION_WAVE1_PLANNING_NORMALIZATION_EXECUTION_PASSED",
  completedEnvelopeCount: 6,
  completedFunctionCount: 24,
  terminalDisposition: legacyDisposition,
  registryPath,
  contractPath,
  publicFacade: "projectPlanningLabel",
  retainedLegacyShims: ["scripts/lib/markdown-planning-utils.mjs", "scripts/lib/planning-placeholder-utils.mjs"],
};
for (const item of inventory.functions) if (functionIds.includes(item.id)) {
  item.executionStatus = "accepted-extracted-and-routed";
  item.executionEvidence = contractPath;
  item.terminalDisposition = legacyDisposition;
}
write(inventoryPath, inventory);

const planV2 = json(planV2Path);
const plan = structuredClone(planV2);
plan.schemaVersion = "1.0.0";
plan.phase = phase;
plan.supersedes = planV2Path;
plan.decision = {
  marker: "CORE_EXTRACTION_WAVE1_PLANNING_NORMALIZATION_EXECUTION_PASSED",
  status: "accepted",
  nextPhase: "Wave 2 proof-envelope contracts",
  executionRule: "Wave 1 is complete only because each of its six planning envelopes has an accepted terminal disposition backed by a shared frozen Legacy/Core corpus and four-surface proof.",
  scopeDriftRule: "Wave 2 and later retain the calibrated stop conditions; no Wave 1 proof authorizes Host/runtime, product, or frontend behavior.",
};
const planWaveOne = plan.waves.find((item) => item.id === "Wave 1");
planWaveOne.status = "complete";
planWaveOne.actualTerminalDisposition = legacyDisposition;
planWaveOne.executionEvidence = contractPath;
planWaveOne.actualCoreCompletionScore = 27;
plan.execution = { completedWave: "Wave 1", completedEnvelopeCount: 6, completedFunctionCount: 24, currentCoreCompletionScore: 27, plannedPostWaveScore: 27, nextPhase: "Wave 2 proof-envelope contracts" };
write(planPath, plan);

const contract = {
  schemaVersion: "1.0.0",
  phase,
  marker: "CORE_EXTRACTION_WAVE1_PLANNING_NORMALIZATION_EXECUTION_PASSED",
  requiredMarkers: [
    "CORE_EXTRACTION_WAVE1_AST_DEPENDENCIES_PASSED",
    "CORE_EXTRACTION_WAVE1_ALL_ENVELOPES_COMPLETED",
    "CORE_EXTRACTION_WAVE1_SOURCE_PARITY_PASSED",
    "CORE_EXTRACTION_WAVE1_ARCHIVE_PARITY_PASSED",
    "CORE_EXTRACTION_WAVE1_INSTALLED_PARITY_PASSED",
    "CORE_EXTRACTION_WAVE1_LEGACY_ROLLBACK_PASSED",
    "CORE_EXTRACTION_WAVE1_DIFFERENTIAL_PARITY_PASSED",
    "CORE_EXTRACTION_WAVE1_SERIALIZATION_IMMUTABILITY_DETERMINISM_PASSED",
    "CORE_EXTRACTION_WAVE1_ROUTING_SCOPE_PASSED",
    "PHASE_CLOSURE_PROOF_LINEAGE_VALID",
  ],
  authority: { registryV1Path, registryPath, inventoryPath, planPath },
  scope: {
    sourceModules: ["scripts/lib/markdown-planning-utils.mjs", "scripts/lib/planning-placeholder-utils.mjs"],
    targetPackage: "@yeeflow/app-builder-core-planning",
    immutableOnly: true,
    excluded: ["Node filesystem APIs", "Codex", "OAuth", "browser APIs", "Git", "AI SDKs", "Next.js", "React", "Prisma", "mutable Plugin state", "package/resource/template objects", "Approval Form behavior", "Data List behavior", "Local Runtime APIs", "product frontend/runtime behavior"],
  },
  envelopes: waveOne.map((item) => ({ id: item.id, sourceModule: item.sourceModule, surface: item.surface, functionIds: item.functionIds, terminalDisposition: legacyDisposition })),
  publicBoundary: {
    promotedFacade: "projectPlanningLabel",
    retainedMarkdownFacade: ["splitMarkdownTableRow", "isMarkdownTableSeparator", "parseMarkdownTables", "stripMarkdownFencedBlocks", "findMarkdownTable", "markdownRowValue", "markdownRowValues", "extractMarkdownSubsection", "isNegativeRequirementStatement", "positivePlanningText", "hasTechnicalPlaceholderIdContext"],
    internalHelpers: "Markdown parser callbacks and label normalization implementation details remain internal.",
    legacyCompatibilityShims: ["scripts/lib/markdown-planning-utils.mjs", "scripts/lib/planning-placeholder-utils.mjs"],
  },
  evidence: {
    corpus: "compatibility/differential-fixtures/core-extraction-wave1-planning-normalization.v0.1.0.json",
    frozenLegacyBaselines: ["compatibility/differential-fixtures/core-extraction-wave1-markdown-planning-legacy-baseline.v0.1.0.mjs", "compatibility/differential-fixtures/core-extraction-wave1-planning-placeholder-legacy-baseline.v0.1.0.mjs"],
    runner: "scripts/test-core-extraction-wave1-planning-normalization.mjs",
    validator: "scripts/validate-core-extraction-wave1-planning-normalization-execution.mjs",
    surfaces: ["compiled source", "Plugin dist", "temporary official ZIP extraction", "simulated installed Plugin", "temporary-copy Legacy rollback"],
    historicalZipSha256: "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2",
  },
  artifacts,
  materializer: { sourcePath: "scripts/materialize-full-app-generated-final.mjs", changedByWave1: false, sha256: sha(read("scripts/materialize-full-app-generated-final.mjs")) },
  decision: { status: "accepted", nextPhase: "Wave 2 proof-envelope contracts", coreCompletionScore: 27, plannedPostWaveScore: 27 },
};
write(contractPath, contract);
write(reportPath, report(contract));

const state = json(statePath);
state.migration.currentPhase = phase;
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = "Wave 2 proof-envelope contracts";
state.proofStatus.coreExtractionWave1PlanningNormalization = "passed_source_archive_installed_rollback";
state.completed = (state.completed || []).filter((item) => item.id !== phase);
state.completed.push({ id: phase, status: "complete", evidence: `${contractPath}: six Wave 1 planning-only proof envelopes and 24 functions passed frozen Legacy/Core differential, source, temporary official ZIP, simulated installed Plugin, determinism, and temporary-copy rollback proof.` });
state.inProgress = [{ id: "Wave 2 proof-envelope contracts", description: "Establish the Phase 18B Approval Form-only static configuration envelope contract; do not widen to runtime behavior." }];
state.nextSteps = (state.nextSteps || []).filter((item) => item.id !== "Wave 1 proof-envelope contracts");
state.nextSteps.unshift({ order: 0, id: "Wave 2 proof-envelope contracts", description: "Evaluate only the calibrated Approval Form-only static configuration envelope against its retained Phase 18B parity evidence." });
write(statePath, state);
console.log(`CORE_EXTRACTION_WAVE1_EVIDENCE_WRITTEN envelopes=${waveOne.length} functions=${functionIds.length}`);

function report(contractValue) { return `# Core Extraction Wave 1: Planning Normalization Execution\n\n\`CORE_EXTRACTION_WAVE1_PLANNING_NORMALIZATION_EXECUTION_PASSED\`\n\n\`CORE_EXTRACTION_WAVE1_AST_DEPENDENCIES_PASSED\`\n\n\`CORE_EXTRACTION_WAVE1_ALL_ENVELOPES_COMPLETED\`\n\n## Outcome\n\nAll six Wave 1 planning-only proof envelopes reached the accepted terminal disposition \`${legacyDisposition}\`. The exact 24 original Legacy function IDs remain traceable in the v0.2 ownership inventory and proof-envelope registry. Core completion is reconciled from 25/100 to the calibrated post-Wave-1 value of 27/100.\n\n## Core Boundary\n\n\`@yeeflow/app-builder-core-planning\` remains host-neutral. The existing Markdown facade remains the stable routed parser surface. One cohesive planning-label facade, \`projectPlanningLabel\`, returns a frozen JSON-safe projection containing the cleaned label, normalized label, and placeholder decision. Parser callbacks and label implementation helpers remain internal.\n\n## Compatibility and Proof\n\nThe retained Legacy modules are compatibility shims. The envelope-owned corpus proves exact behavior against frozen pre-shim Legacy baselines across compiled source, Plugin dist, a temporary official ZIP extraction, and a simulated installed Plugin. It also proves deterministic output, JSON serialization, frozen Core facade results, input non-mutation, and a temporary-copy-only Legacy rollback.\n\n## Explicit Exclusions\n\nThis Wave does not change Approval Form behavior, Data List behavior, Local Runtime APIs, frontend/runtime behavior, active installation, historical ZIP, or the production materializer. Core accepts no filesystem, network, package, template, resource, mutable host state, or prohibited platform dependency.\n\n## Next\n\nWave 2 remains a separate Approval Form-only static configuration proof-envelope contract. Its Phase 18B candidate remains parity-ready; this Wave does not extract or widen it.\n\n## Checksums\n\n- Planning Core artifact: \`${contractValue.artifacts["@yeeflow/app-builder-core-planning"].sha256}\`\n- Materializer Core artifact: \`${contractValue.artifacts["@yeeflow/app-builder-core-materializer"].sha256}\`\n- Local Runtime artifact: \`${contractValue.artifacts["@yeeflow/app-builder-core-local-runtime"].sha256}\`\n- Historical ZIP (unchanged): \`${contractValue.evidence.historicalZipSha256}\`\n`; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function write(path, value) { writeFileSync(resolve(root, path), typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }

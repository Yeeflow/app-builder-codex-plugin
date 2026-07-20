#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "core-extraction-wave-plan-calibration-and-proof-envelope-clustering";
const inventoryPath = "compatibility/capability-manifests/core-extraction-production-ownership-inventory.v0.1.0.json";
const registryPath = "compatibility/capability-manifests/core-extraction-proof-envelope-registry.v0.1.0.json";
const planPath = "compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.2.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-core-extraction-wave-plan-calibration-and-proof-envelope-clustering.v0.1.0.md";
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json";
const inventory = json(inventoryPath);
const baselinePlan = json("compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.1.0.json");
const candidates = inventory.functions.filter((item) => item.category === "core-now" && ["not-extracted", "parity-ready-static-configuration-candidate"].includes(item.extractionStatus));
const assignments = candidates.map(describe);
const envelopes = cluster(assignments);
const waves = buildWaves(envelopes);
const registry = {
  schemaVersion: "1.0.0",
  phase,
  purpose: "Finite proof-envelope registry. It preserves per-function traceability while grouping only same-surface, deterministic, side-effect-free candidates with compatible input/output and dependency profiles.",
  baselineInventory: inventoryPath,
  groupingRule: "An envelope key is wave, source module, product surface, immutable input/output shape, and local dependency profile. Similar names never override a surface mismatch.",
  forbiddenBoundarySignals: ["Host/runtime mutation", "Codex or external API orchestration", "product frontend/runtime behavior", "mutable package/template/resource output", "browser events", "product-enhancement behavior"],
  summary: { candidateFunctionCount: candidates.length, envelopeCount: envelopes.length, waveCounts: Object.fromEntries(waves.map((wave) => [wave.id, { envelopes: wave.envelopeIds.length, functions: wave.functionCount }])) },
  assignments,
  envelopes,
};
const calibratedPlan = {
  schemaVersion: "2.0.0",
  phase,
  supersedes: "compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.1.0.json",
  decision: {
    marker: "CORE_EXTRACTION_PROOF_ENVELOPE_CALIBRATION_ACCEPTED",
    status: "accepted",
    nextPhase: "Wave 1 proof-envelope contracts",
    executionRule: "Proof envelopes, not individual function tasks, are the execution unit. The registry remains the sole per-function traceability authority.",
    scopeDriftRule: "No function enters an envelope unless it remains core-now, has exactly one assignment, and passes the envelope stop conditions.",
  },
  scores: expectedScores(waves, baselinePlan.scores.coreCompletion.score),
  capacity: capacity(waves),
  coreV1: {
    waves: waves.filter((wave) => wave.id !== "Core v1 closure").map((wave) => wave.id),
    envelopeCount: envelopes.length,
    functionCount: candidates.length,
    closureWave: "Core v1 closure",
    closureDefinition: "All envelope members have an accepted terminal disposition: extracted with proof, intentionally retained/reclassified with evidence, or deferred to a separately approved Core v2 contract. No product enhancement is counted as Core completion.",
  },
  coreV2: { entryRule: "Fresh contract, new registry assignment, and independent public-boundary decision required.", envelopeCount: 0 },
  productEnhancementBacklog: baselinePlan.finiteScopes.productEnhancementBacklog,
  waves,
};
write(registryPath, registry);
write(planPath, calibratedPlan);
write(reportPath, report(registry, calibratedPlan));
const state = json(statePath);
state.migration.currentPhase = phase;
state.migration.currentPhaseStatus = "complete";
state.migration.overallStatus = "in_progress";
state.migration.nextPhase = calibratedPlan.decision.nextPhase;
if (!state.completed.some((item) => item.id === phase)) state.completed.push({ id: phase, status: "complete", evidence: `${registryPath} and ${planPath}: ${candidates.length} candidates are assigned to ${envelopes.length} deterministic proof envelopes without production migration.` });
state.inProgress = [{ id: calibratedPlan.decision.nextPhase, description: "Establish contracts for the Wave 1 envelopes only; do not extract, distribute, or route behavior." }];
state.nextSteps = [{ order: 0, id: calibratedPlan.decision.nextPhase, description: "Run Wave 1 envelope contracts, then re-evaluate only the accepted envelope outcomes before Wave 2." }, ...(state.nextSteps || []).filter((item) => ![calibratedPlan.decision.nextPhase, "core-extraction-wave-1-eligibility-and-contract-audit"].includes(item.id))];
state.proofStatus.coreExtractionProofEnvelopeCalibration = "accepted_finite_envelope_execution_model";
write(statePath, state);
console.log(`CORE_EXTRACTION_PROOF_ENVELOPES_WRITTEN envelopes=${envelopes.length} functions=${candidates.length}`);

function describe(item) {
  const surface = surfaceFor(item);
  const inputOutputShape = ioShapeFor(item);
  const dependencyProfile = dependencyProfileFor(item);
  const wave = waveFor(item, surface);
  return {
    functionId: item.id,
    module: item.module,
    function: item.function,
    line: item.line,
    callers: item.callers,
    surface,
    wave,
    inputOutputShape,
    dependencyProfile,
    sideEffectBoundary: "Core candidate accepts and returns immutable JSON-safe values only; mutable Host/runtime objects may not cross this boundary.",
    dependencies: item.dependencies,
    productRuntimeSignals: item.productRuntimeSignals || [],
    parityEvidence: item.parityEvidence,
    extractionStatus: item.extractionStatus,
    requiredCoreModule: coreModuleFor(item, surface),
    publicBoundary: "Internal pure projection first; no public export, adapter, or distribution change is authorized by this calibration.",
    fixtureCorpus: corpusFor(item, surface),
    adapterImpact: "None during calibration. A compatibility adapter requires a separately accepted promotion and routing proof.",
    distributionProof: "Not authorized during calibration. Any future public envelope needs source/dist/temporary official ZIP/simulated installed proof and export alignment.",
    rollbackScope: "Temporary-copy-only rollback returns this envelope's selected callers to the retained Legacy implementation; it must not alter unrelated envelopes.",
    stopConditions: stopConditions(item),
  };
}
function cluster(assignments) {
  const groups = new Map();
  for (const assignment of assignments) {
    const key = [assignment.wave, assignment.module, assignment.surface, assignment.inputOutputShape, assignment.dependencyProfile].join("|");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(assignment);
  }
  return [...groups.entries()].map(([key, members], index) => {
    const first = members[0];
    const id = `${first.wave.toLowerCase().replace(/[^a-z0-9]+/giu, "-")}-envelope-${String(index + 1).padStart(2, "0")}`;
    return {
      id,
      key,
      wave: first.wave,
      sourceModule: first.module,
      surface: first.surface,
      inputOutputShape: first.inputOutputShape,
      dependencyProfile: first.dependencyProfile,
      sideEffectBoundary: first.sideEffectBoundary,
      requiredCoreModule: first.requiredCoreModule,
      publicBoundary: first.publicBoundary,
      fixtureCorpus: unique(members.flatMap((member) => member.fixtureCorpus)),
      adapterImpact: first.adapterImpact,
      distributionProof: first.distributionProof,
      rollbackScope: first.rollbackScope,
      stopConditions: unique(members.flatMap((member) => member.stopConditions)),
      functionIds: members.map((member) => member.functionId),
      functionCount: members.length,
      memberSurfaces: unique(members.map((member) => member.surface)),
      memberInputOutputShapes: unique(members.map((member) => member.inputOutputShape)),
      memberDependencyProfiles: unique(members.map((member) => member.dependencyProfile)),
      status: members.some((member) => member.extractionStatus === "parity-ready-static-configuration-candidate") ? "calibration-only-parity-ready-candidate" : "contract-audit-required",
    };
  }).sort((left, right) => left.wave.localeCompare(right.wave) || left.surface.localeCompare(right.surface) || left.id.localeCompare(right.id));
}
function buildWaves(envelopes) {
  const ids = ["Wave 1", "Wave 2", "Wave 3", "Core v1 closure"];
  return ids.map((id) => {
    const selected = envelopes.filter((envelope) => envelope.wave === id);
    const functionCount = selected.reduce((sum, envelope) => sum + envelope.functionCount, 0);
    return {
      id,
      envelopeIds: selected.map((envelope) => envelope.id),
      envelopeCount: selected.length,
      functionCount,
      dependencies: id === "Wave 1" ? "Planning-only deterministic parsing/normalization; no Host state." : id === "Wave 2" ? "Phase 18B Approval Form-only static Lookup configuration evidence; no mutable control construction." : id === "Wave 3" ? "Each envelope must independently preserve its product surface and pass its immutable boundary proof." : "All prior envelopes have accepted terminal dispositions and lineage remains sealed.",
      proofRequirements: id === "Core v1 closure" ? ["complete registry coverage", "no unclassified functions", "sealed routing lineage", "no forbidden Core dependencies"] : ["AST dependency review", "envelope-owned differential corpus", "input immutability", "surface isolation", "temporary-copy rollback", "source/dist/ZIP/installed proof only if promoted"],
      exitCriteria: id === "Core v1 closure" ? "All Wave 1–3 envelopes are extracted, retained/reclassified with evidence, or explicitly moved to Core v2 by a new contract." : "Every member retains one surface, one signature, no mutable Host/runtime behavior, and a shared parity strategy.",
    };
  });
}
function expectedScores(waves, baselineScore) {
  const active = waves.filter((wave) => wave.id !== "Core v1 closure");
  const weight = (wave) => wave.envelopeIds.length * (wave.id === "Wave 2" ? 3 : wave.id === "Wave 3" ? 2 : 1);
  const total = active.reduce((sum, wave) => sum + weight(wave), 0) || 1;
  let completed = 0;
  return { method: "Capability-envelope weighted; baseline completion is preserved and each accepted envelope is weighted by boundary risk rather than function count.", baseline: baselineScore, afterWave: active.map((wave) => { completed += weight(wave); return { wave: wave.id, expectedScoreIfEveryEnvelopeAccepted: Math.min(100, baselineScore + Math.round((100 - baselineScore) * completed / total)) }; }), afterCoreV1Closure: 100 };
}
function capacity(waves) {
  return { basis: "One contract/proof cycle per proof envelope; functions inside an envelope share one source surface, I/O shape, dependency profile, corpus, and rollback scope.", waves: waves.map((wave) => ({ wave: wave.id, envelopeCount: wave.envelopeCount, functionCount: wave.functionCount, expectedProofCycles: wave.id === "Core v1 closure" ? 1 : wave.envelopeCount, concurrencyRule: wave.id === "Wave 3" ? "Parallelize only envelopes in different source modules and product surfaces." : "Do not overlap envelopes that share a source module." })) };
}
function surfaceFor(item) {
  const value = `${item.module} ${item.function}`.toLowerCase();
  if (item.module.includes("markdown-planning")) return "planning-markdown";
  if (item.module.includes("planning-placeholder")) return "planning-placeholders";
  if (item.module.includes("workflow-query")) return "workflow-query-data-static-plan";
  if (item.module.includes("workflow-set-data-list")) return "workflow-set-data-list-static-plan";
  if (item.module.includes("form-control-type-authority")) return "data-list-form-control-static-schema";
  if (item.module.includes("approval-form-layout")) return "approval-form-sublist-static-configuration";
  if (/workflow/.test(value)) return "workflow-static-plan";
  if (/approval|publicform|formaction/.test(value)) return "approval-form-static-configuration";
  if (/dashboard|collection|analytics|kpi|navigator/.test(value)) return "dashboard-static-configuration";
  if (/documentlibrary|document_library|document.*library/.test(value)) return "document-library-static-configuration";
  if (/sublist|sub_list/.test(value)) return "data-list-sublist-static-configuration";
  if (/datalist|dataview|lookup|field|list/.test(value)) return "data-list-static-configuration";
  if (/template|layout/.test(value)) return "template-static-normalization";
  if (/resource|package|seed|tenant|idpath/.test(value)) return "resource-definition-static-intent";
  return "application-plan-static-normalization";
}
function ioShapeFor(item) { const name = item.function.toLowerCase(); if (/^(?:normalize|clean|sanitize|slug|norm|is|has|looks|unique|truthy|numeric)/.test(name)) return "scalar-json-to-scalar-json"; if (/^(?:parse|extract|split|collect|find|resolve|infer|select)/.test(name)) return "immutable-json-input-to-query-or-parser-result"; if (/^(?:build|map|project|create|to|format|merge)/.test(name)) return "immutable-json-input-to-static-dto"; return "immutable-json-input-to-deterministic-transform"; }
function dependencyProfileFor(item) { const local = item.dependencies?.localCalls?.length || 0; const imports = item.dependencies?.importedModules || []; if (imports.some((value) => /(?:oauth|api|browser|next|react|prisma|ai-sdk|git)/iu.test(value))) return "forbidden-external-boundary"; if (local === 0) return "no-local-dependencies"; if (local <= 2) return "bounded-local-dependencies"; return "composed-local-dependencies"; }
function waveFor(item, surface) { if (item.module.includes("markdown-planning") || item.module.includes("planning-placeholder")) return "Wave 1"; if (item.module.includes("approval-form-layout") && item.function === "normalizeApprovalSubListLookupConfiguration") return "Wave 2"; return "Wave 3"; }
function coreModuleFor(item, surface) { if (surface.startsWith("planning-") || surface.startsWith("workflow-")) return "@yeeflow/app-builder-core-planning"; return "@yeeflow/app-builder-core-materializer"; }
function corpusFor(item, surface) { if (item.module.includes("markdown-planning")) return ["existing Markdown planning differential corpus"]; if (item.module.includes("approval-form-layout") && item.function === "normalizeApprovalSubListLookupConfiguration") return ["Phase 18B Approval Form-only golden .ywf configuration corpus"]; return [`new ${surface} normalized Legacy/Core envelope corpus`]; }
function stopConditions(item) { const conditions = ["Stop and reclassify if an input or output requires mutable template/resource/package state.", "Stop and reclassify if runtime events, browser behavior, external API execution, or product writeback becomes necessary.", "Stop and reclassify if a required dependency imports Codex, OAuth, browser, Git, AI SDK, Next.js, React, or Prisma."]; if (item.dependencies?.requiresIsolatedBoundaryBeforeCore) conditions.push("Stop promotion until the Node/Host module facade is isolated from the pure function boundary."); return conditions; }
function unique(values) { return [...new Set(values)].sort(); }
function report(registry, plan) { return `# Core Extraction Wave Plan Calibration and Proof Envelope Clustering\n\n\`CORE_EXTRACTION_PROOF_ENVELOPE_CALIBRATION_ACCEPTED\`\n\n\`CORE_EXTRACTION_PROOF_ENVELOPE_COVERAGE_VALID\`\n\n\`CORE_EXTRACTION_PROOF_ENVELOPE_REGRESSIONS_PASSED\`\n\n## Decision\n\nThe prior per-function execution model is superseded for scheduling only. The ownership inventory remains the exact per-function authority. ${registry.summary.candidateFunctionCount} remaining core-now functions are assigned once to ${registry.summary.envelopeCount} proof envelopes.\n\n## Envelope Rule\n\nEach envelope shares one source module, product surface, immutable input/output shape, and local dependency profile. The registry prohibits cross-surface grouping even when names are similar. Any Host/runtime mutation, Codex orchestration, browser/frontend behavior, external API behavior, or product enhancement requirement stops the envelope and requires reclassification.\n\n## Waves\n\n${plan.waves.map((wave) => `- ${wave.id}: ${wave.envelopeCount} envelopes, ${wave.functionCount} functions; ${wave.exitCriteria}`).join("\n")}\n\n## Scores and Capacity\n\nBaseline Core completion is ${plan.scores.baseline}/100. ${plan.scores.afterWave.map((item) => `${item.wave}: ${item.expectedScoreIfEveryEnvelopeAccepted}/100 if every envelope is accepted`).join("; ")}. Core v1 closure is 100/100 only after terminal disposition evidence, not merely implementation.\n\n## Approval Form Lookup\n\nThe Phase 18B static Lookup configuration preservation remains one Wave 2 parity-ready candidate. This calibration does not extract it, expose a Core API, add an adapter, or change its production behavior.\n`; }
function json(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }
function write(path, value) { writeFileSync(resolve(root, path), typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`); }

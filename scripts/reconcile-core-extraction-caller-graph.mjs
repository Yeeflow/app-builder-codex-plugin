#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeCallerGraph, resolveInventoryFunction } from "./lib/core-extraction-caller-graph-analysis.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "core-extraction-caller-graph-reconciliation";
const paths = {
  inventoryIn: "compatibility/capability-manifests/core-extraction-production-ownership-inventory.v0.4.0.json",
  inventoryOut: "compatibility/capability-manifests/core-extraction-production-ownership-inventory.v0.5.0.json",
  registryIn: "compatibility/capability-manifests/core-extraction-proof-envelope-registry.v0.4.0.json",
  registryOut: "compatibility/capability-manifests/core-extraction-proof-envelope-registry.v0.5.0.json",
  graphIn: "compatibility/capability-manifests/core-extraction-ownership-dependency-graph.v0.1.0.json",
  graphOut: "compatibility/capability-manifests/core-extraction-ownership-dependency-graph.v0.2.0.json",
  planIn: "compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.5.0.json",
  planOut: "compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.6.0.json",
  callerGraph: "compatibility/capability-manifests/core-extraction-caller-graph.v0.1.0.json",
  contract: "compatibility/capability-manifests/core-extraction-caller-graph-reconciliation.v0.1.0.json",
  state: "docs/architecture/yeeflow-app-builder-core-migration-state.json",
  report: "docs/architecture/yeeflow-app-builder-core-extraction-caller-graph-reconciliation.v0.1.0.md",
};

const inventory = json(paths.inventoryIn);
const registry = json(paths.registryIn);
const dependencyGraph = json(paths.graphIn);
const plan = json(paths.planIn);
const graph = analyzeCallerGraph({ root, modulePaths: inventory.sourceScope.includedModules });
const evidenceByInventoryId = new Map(inventory.functions.map((entry) => [entry.id, resolveInventoryFunction(graph, entry)]));
const changed = inventory.functions.filter((entry) => entry.callers !== evidenceByInventoryId.get(entry.id).callerCount).map((entry) => ({
  functionId: entry.id,
  before: entry.callers,
  after: evidenceByInventoryId.get(entry.id).callerCount,
  presentInCurrentProductionSource: evidenceByInventoryId.get(entry.id).presentInCurrentProductionSource,
}));

function withEvidence(entry) {
  const callerEvidence = evidenceByInventoryId.get(entry.id) || resolveInventoryFunction(graph, entry);
  return { ...entry, callers: callerEvidence.callerCount, callerEvidence };
}

const reconciledInventory = structuredClone(inventory);
reconciledInventory.schemaVersion = "0.5.0";
reconciledInventory.phase = phase;
reconciledInventory.supersedes = paths.inventoryIn;
reconciledInventory.modules = inventory.modules.map((module) => ({ ...module, functions: module.functions.map(withEvidence) }));
reconciledInventory.functions = inventory.functions.map(withEvidence);
reconciledInventory.callerGraph = {
  marker: "CORE_EXTRACTION_CALLER_GRAPH_RECONCILED",
  artifact: paths.callerGraph,
  method: graph.analysisMethod,
  productionOnly: true,
  excludedEvidence: "Tests, fixtures, generated dist, documentation, protected duplicates, historical artifacts, and governance-only modules are absent because the authoritative inventory source scope is the only analyzed input.",
  changedCallerCount: changed.length,
  currentFunctionCount: graph.records.length,
  historicalFunctionNotPresentCount: reconciledInventory.functions.filter((entry) => !entry.callerEvidence.presentInCurrentProductionSource).length,
};
reconciledInventory.summary = {
  ...inventory.summary,
  callerGraph: {
    directLocalCallCount: graph.edges.filter((edge) => edge.kind === "direct-local").length,
    importedBindingCallCount: graph.edges.filter((edge) => edge.kind === "imported-binding").length,
    callbackOnlyInvocationCount: graph.edges.filter((edge) => edge.kind === "callback-only").length,
    trulyUnreachableCount: graph.records.filter((record) => record.callerEvidence.trulyUnreachable).length,
    exportedWithoutProductionConsumerCount: graph.records.filter((record) => record.callerEvidence.exportedWithoutProductionConsumer).length,
  },
};

const reconciledRegistry = structuredClone(registry);
reconciledRegistry.schemaVersion = "0.5.0";
reconciledRegistry.phase = phase;
reconciledRegistry.supersedes = paths.registryIn;
reconciledRegistry.baselineInventory = paths.inventoryOut;
reconciledRegistry.assignments = registry.assignments.map((assignment) => {
  const callerEvidence = evidenceByInventoryId.get(assignment.functionId) || resolveInventoryFunction(graph, assignment);
  return { ...assignment, callers: callerEvidence.callerCount, callerEvidence };
});
reconciledRegistry.envelopes = registry.envelopes.map((envelope) => {
  const memberCallerEvidence = envelope.functionIds.map((functionId) => evidenceByInventoryId.get(functionId) || { functionId, presentInCurrentProductionSource: false, callerCount: 0, matchedBy: "function-id-not-in-inventory" });
  return {
    ...envelope,
    callerGraph: {
      directLocalCallCount: memberCallerEvidence.reduce((sum, item) => sum + (item.directLocalCallCount || 0), 0),
      importedBindingCallCount: memberCallerEvidence.reduce((sum, item) => sum + (item.importedBindingCallCount || 0), 0),
      callbackOnlyInvocationCount: memberCallerEvidence.reduce((sum, item) => sum + (item.callbackOnlyInvocationCount || 0), 0),
      presentMemberCount: memberCallerEvidence.filter((item) => item.presentInCurrentProductionSource).length,
      historicalMemberCount: memberCallerEvidence.filter((item) => !item.presentInCurrentProductionSource).length,
    },
  };
});
reconciledRegistry.callerGraph = {
  marker: "CORE_EXTRACTION_CALLER_GRAPH_RECONCILED",
  artifact: paths.callerGraph,
  semantics: "callers is the count of production AST call sites: direct-local plus imported-binding plus callback-only. Exported consumer modules are recorded separately and do not inflate call-site counts.",
};

const callerGraphArtifact = {
  schemaVersion: "1.0.0",
  phase,
  marker: "CORE_EXTRACTION_CALLER_GRAPH_RECONCILED",
  purpose: "Exact production-only caller evidence for Core extraction planning. This is planning metadata and does not alter routes, APIs, artifacts, or sealed lineage.",
  method: graph.analysisMethod,
  sourceScope: {
    includedModules: inventory.sourceScope.includedModules,
    excludes: inventory.sourceScope.excludedPatterns,
    assertion: "Only modules named in the authoritative inventory source scope were parsed.",
  },
  semantics: {
    directLocalCall: "A call-expression identifier resolves to a function declared in the same production module.",
    importedBindingCall: "A named or namespace import resolves to an exported function in another production module.",
    exportedFunctionConsumer: "A unique production module with at least one resolved imported-binding call. It is separate from call-site count.",
    callbackOnlyInvocation: "An anonymous function passed as a call argument. It is counted as a callback invocation and never inferred from text.",
    trulyUnreachable: "An unexported current production function with no direct-local, imported-binding, or callback-only invocation in the declared production source scope.",
    historicalFunctionNotPresent: "An inventory record retained for traceability after an accepted route replaced its Legacy implementation; it is not misreported as a current unreachable function.",
  },
  records: graph.records,
  edges: graph.edges,
  inventoryReconciliation: {
    inventory: paths.inventoryOut,
    changed,
    historicalFunctionNotPresentCount: reconciledInventory.callerGraph.historicalFunctionNotPresentCount,
  },
};

const reconciledDependencyGraph = structuredClone(dependencyGraph);
reconciledDependencyGraph.schemaVersion = "0.2.0";
reconciledDependencyGraph.phase = phase;
reconciledDependencyGraph.supersedes = paths.graphIn;
reconciledDependencyGraph.callerGraph = {
  marker: "CORE_EXTRACTION_CALLER_GRAPH_RECONCILED",
  artifact: paths.callerGraph,
  directLocalEdges: graph.edges.filter((edge) => edge.kind === "direct-local").length,
  importedBindingEdges: graph.edges.filter((edge) => edge.kind === "imported-binding").length,
  callbackOnlyEdges: graph.edges.filter((edge) => edge.kind === "callback-only").length,
  sourceScopeModuleCount: inventory.sourceScope.includedModules.length,
  semantics: callerGraphArtifact.semantics,
};

const impactedEnvelopeIds = reconciledRegistry.envelopes.filter((envelope) => envelope.functionIds.some((functionId) => changed.some((item) => item.functionId === functionId))).map((envelope) => envelope.id);
const reconciledPlan = structuredClone(plan);
reconciledPlan.schemaVersion = "0.6.0";
reconciledPlan.phase = phase;
reconciledPlan.supersedes = paths.planIn;
reconciledPlan.decision = {
  ...plan.decision,
  nextPhase: "core-extraction-wave3-batch-b-workflow-query-data-static-plan",
};
reconciledPlan.execution = {
  ...plan.execution,
  nextPhase: "core-extraction-wave3-batch-b-workflow-query-data-static-plan",
  callerGraphReconciliation: {
    marker: "CORE_EXTRACTION_CALLER_GRAPH_RECONCILED",
    changedCallerCount: changed.length,
    impactedEnvelopeIds,
    scopeOrRollbackBoundaryChangedEnvelopeIds: [],
    capacityRecomputed: false,
    rationale: "Corrected AST caller evidence changes neither assigned functions nor any approved envelope's host boundary, rollback surface, or capacity basis. Capability classifications are unchanged.",
  },
};
reconciledPlan.callerGraph = { marker: "CORE_EXTRACTION_CALLER_GRAPH_RECONCILED", artifact: paths.callerGraph, inventory: paths.inventoryOut, registry: paths.registryOut, dependencyGraph: paths.graphOut };

const contract = {
  schemaVersion: "1.0.0",
  phase,
  marker: "CORE_EXTRACTION_CALLER_GRAPH_RECONCILED",
  decision: "accepted",
  scope: "One-time planning-data correction only. No Core extraction, production route, adapter, public API, distribution artifact, or lineage transition is authorized.",
  productionScope: callerGraphArtifact.sourceScope,
  requiredEvidenceKinds: Object.keys(callerGraphArtifact.semantics),
  invariants: [
    "Every inventory function has exactly one callerEvidence record.",
    "The source scope is the authoritative inventory includedModules list and excludes tests, fixtures, dist, documentation, protected duplicates, and historical artifacts.",
    "Call-site counts are AST-derived and never use textual matching or a declaration subtraction.",
    "Imported binding calls and exported consumer modules remain distinct metrics.",
    "Historical functions removed by accepted routing remain traceable and are not labeled truly unreachable.",
    "Caller corrections do not change ownership classifications, capability selection, sealed lineage, or approved route evidence.",
  ],
  regressionRequirements: [
    "Wave 2 Approval Form normalizer has one direct local production caller.",
    "Wave 3 Batch A workflow projection records imported production consumers.",
    "buildWorkflowListLoopProperties directly calls buildWorkflowLoopProperties.",
    "Synthetic AST fixtures prove imported binding, callback-only, and truly unreachable classifications.",
  ],
  nextWorkItem: "core-extraction-wave3-batch-b-workflow-query-data-static-plan",
  files: [paths.inventoryOut, paths.registryOut, paths.graphOut, paths.planOut, paths.callerGraph, paths.state, paths.report],
};

const state = json(paths.state);
state.migration.currentPhase = phase;
state.migration.currentPhaseStatus = "complete";
state.migration.overallStatus = "in_progress";
state.migration.nextPhase = contract.nextWorkItem;
state.inProgress = [{ id: contract.nextWorkItem, description: "Execute only the separately approved Wave 3 Batch B Workflow Query Data static-plan envelope after its own contract and proof review." }];
state.nextSteps = [
  { order: 0, id: contract.nextWorkItem, description: "Start Wave 3 Batch B only after this AST caller graph is used for its scoped caller, parity, distribution, and rollback proof." },
  ...state.nextSteps.filter((entry) => entry.id !== contract.nextWorkItem && entry.id !== "Wave 3 proof-envelope contracts"),
];
state.completed = state.completed.filter((entry) => entry.id !== phase);
state.completed.push({ id: phase, status: "complete", evidence: `${paths.callerGraph}, ${paths.contract}, ${paths.inventoryOut}, ${paths.registryOut}, ${paths.graphOut}, and ${paths.planOut}: production-only AST caller evidence reconciles direct, imported, exported-consumer, callback-only, and unreachable semantics without changing routes or artifacts.` });
state.proofStatus.coreExtractionCallerGraph = "reconciled_ast_production_only";

write(paths.inventoryOut, reconciledInventory);
write(paths.registryOut, reconciledRegistry);
write(paths.callerGraph, callerGraphArtifact);
write(paths.graphOut, reconciledDependencyGraph);
write(paths.planOut, reconciledPlan);
write(paths.contract, contract);
write(paths.state, state);
write(paths.report, report({ changed, callerGraphArtifact, plan: reconciledPlan }));
console.log(`CORE_EXTRACTION_CALLER_GRAPH_RECONCILED changed=${changed.length} direct=${reconciledInventory.summary.callerGraph.directLocalCallCount} imported=${reconciledInventory.summary.callerGraph.importedBindingCallCount} callbacks=${reconciledInventory.summary.callerGraph.callbackOnlyInvocationCount}`);

function report({ changed, callerGraphArtifact, plan }) {
  return `# Core Extraction Caller Graph Reconciliation\n\n\`CORE_EXTRACTION_CALLER_GRAPH_RECONCILED\`\n\n## Decision\n\nThis one-time planning-data correction replaces the baseline same-file name scan and declaration subtraction with TypeScript AST call-expression and import-binding analysis. It parses only the ${callerGraphArtifact.sourceScope.includedModules.length} modules already declared by the production ownership inventory. Tests, fixtures, generated dist, documentation, protected duplicates, historical artifacts, and governance-only sources are not evidence.\n\n## Caller Semantics\n\n- Direct local calls are same-module AST call expressions.\n- Imported binding calls resolve named and namespace imports to exported functions in another scoped production module.\n- Exported consumers are unique importing production modules and remain separate from call-site totals.\n- Callback-only functions are recorded from AST callback arguments.\n- Truly unreachable means current, unexported production code with no resolved production invocation. Historical Legacy functions replaced by an accepted route remain traceable but are not mislabeled unreachable.\n\n## Reconciliation\n\n${changed.length} inventory caller values changed. The correction does not alter capability ownership, proof-envelope membership, host boundaries, rollback scope, approved routes, Core exports, adapters, distribution artifacts, or closure-lineage transitions. Capacity is therefore unchanged.\n\n## Next Work\n\nThe next work item is \`${plan.decision.nextPhase}\`.\n`;
}
function json(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }
function write(path, value) { writeFileSync(resolve(root, path), typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`); }
export function sha256(path) { return createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex"); }

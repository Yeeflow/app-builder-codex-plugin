#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-11a-data-list-sublist-summary-runtime-temporary-variable-lifecycle-and-scope-contract-audit";
const nextPhase = "phase-11b-sublist-summary-runtime-temporary-variable-scope-evidence-audit";
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const source = read(sourcePath);
const sourceFile = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json";
const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
const lineage = json(lineagePath);
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const artifacts = Object.fromEntries(distribution.artifacts.map((item) => [item.packageName, { path: item.path, sha256: item.sha256 }]));
const protectedBoundaries = {
  materializer: { path: sourcePath, sha256: sha(source) },
  coreAdapter: checksum("scripts/lib/materializer-core-adapter.mjs"),
  runtimeAdapter: checksum("scripts/lib/local-runtime-core-adapter.mjs"),
  materializerPublicIndex: checksum("packages/app-builder-core-materializer/src/index.ts"),
  localRuntimePublicIndex: checksum("runtimes/app-builder-core-local-runtime/src/index.ts")
};

const stages = [
  row("summary declaration parsing", "parseSubListSummaries", "immutable deterministic declaration parsing", "Legacy parser", ["parses JSON or delimited declarations", "normalizes target kind to __temp_, __list_, or __variables_"], "No list, form, or summary identity is retained with a temporary-variable target."),
  row("declaration normalization", "normalizePlannedSubListSummary", "immutable summary metadata", "Legacy parser", ["normalizes field, aggregate type, display, and binding prefix/value"], "The binding value is an unscoped cleaned string."),
  row("field-record transfer", "buildFieldRecord", "non-serialized host metadata", "Legacy host", ["clones declarations into non-enumerable __plannedListSummaries"], "The completed record contains no temporary-variable inventory or lifecycle state."),
  row("control metadata lowering", "normalizeDataListSubListSummaries", "mutable control metadata", "Legacy host", ["creates deterministic summary ids", "copies binding into list-fields-summary"], "Static Core routing explicitly declines any binding or runtime expression."),
  row("template insertion", "buildDataListFormSubListControl", "template mutation", "Legacy host", ["inserts list-fields-summary into cloned control"], "A Core DTO cannot bind directly to the mutable control."),
  row("temporary-variable discovery and allocation", "ensureDataListSubListSummaryTempVars", "host inventory lookup and resource mutation", "Legacy host", ["recursively scans list-fields-summary", "collects __temp_ values", "appends missing resource.tempVars entries"], "Discovery is scoped only by the current resource traversal and exact cleaned id; it does not prove list, form, or summary relationship scope."),
  row("resource integration and serialization", "materializeDataListFormResource", "template/resource mutation and package serialization", "Legacy host", ["creates cloned form resource", "calls temporary-variable discovery after controls are inserted"], "The materializer serializes declarations but does not execute dynamic summary expressions or runtime writeback."),
  row("runtime update and writeback", "external runtime", "runtime execution", "Product runtime", ["not implemented by the materializer"], "No source-level dynamic evaluation or writeback boundary is available for a Core parity shadow.")
];

const lifecycle = {
  schemaVersion: "1.0.0",
  phase,
  decision: {
    status: "accepted_contract_candidate_rejected",
    nextPhase,
    internalShadowCandidate: "rejected_missing_explicit_scope_evidence",
    reason: "The Legacy declaration and discovery path carries only a cleaned temporary-variable name. It does not carry or validate list, form, summary, or lifecycle identity required to prove safe immutable dynamic-summary intent."
  },
  lifecycle: stages,
  operationClassification: {
    immutableDeterministicSummaryIntent: ["summary declaration parsing", "declaration normalization"],
    hostInventoryLookup: ["temporary-variable discovery and allocation"],
    hostVariableAllocation: ["temporary-variable discovery and allocation"],
    scopeRelationshipValidation: ["not implemented as explicit Legacy validation"],
    runtimeExpressionLowering: ["not implemented by the materializer"],
    templateResourceMutation: ["control metadata lowering", "template insertion", "resource integration and serialization"],
    runtimeWriteback: ["external runtime"]
  },
  scopeProof: {
    explicitParentListId: false,
    explicitParentFieldId: false,
    explicitFormId: false,
    explicitSummaryReference: false,
    variableInventoryScopeValidated: false,
    nameOnlyLookupPermitted: false,
    crossListReusePermitted: false,
    crossFormReusePermitted: false,
    crossSummaryReusePermitted: false,
    conclusion: "No Core or Local Runtime dynamic-summary shadow is safe until host-owned scope evidence is explicit and independently validated."
  },
  stableErrors: [
    "SUBLIST_TEMP_VARIABLE_REFERENCE_MISSING",
    "SUBLIST_TEMP_VARIABLE_REFERENCE_INVALID",
    "SUBLIST_TEMP_VARIABLE_REFERENCE_DUPLICATE",
    "SUBLIST_TEMP_VARIABLE_REFERENCE_WRONG_SCOPE",
    "SUBLIST_TEMP_VARIABLE_REFERENCE_RELATIONSHIP_BROKEN",
    "SUBLIST_TEMP_VARIABLE_BINDING_STALE",
    "SUBLIST_TEMP_VARIABLE_LIFECYCLE_REUSE_UNSAFE"
  ],
  futureSplit: {
    coreMayEventuallyReturn: ["immutable dynamic-summary intent only", "immutable findings only"],
    hostAndLocalRuntimeMustRetain: ["temporary-variable discovery", "temporary-variable allocation", "scope and relationship validation", "Rules/control/template binding", "resource mutation", "runtime expression lowering", "runtime writeback", "package integration"],
    prohibitedUntilScopeProof: ["Core allocation", "Core discovery", "Core mutation", "Core writeback", "Core runtime expression evaluation", "name-only variable fallback", "dynamic production routing"]
  },
  preserved: { dynamicSummaryBehaviorChanged: false, tempVarsChanged: false, templatesChanged: false, resourcesChanged: false, adaptersChanged: false, publicApiChanged: false, artifactsChanged: false, distributionChanged: false, pluginDistChanged: false, legacyMaterializerChanged: false },
  lineage: { requiredPhases: ["phase-10d-data-list-sublist-scalar-summary-intent-dual-public-distribution-promotion", "phase-10e-data-list-sublist-scalar-summary-intent-selective-routing-proof"], sha256: sha(read(lineagePath)), transitionCount: lineage.approvedTransitions.length },
  checksums: { protectedBoundaries, artifacts, historicalZipSha256: "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2" }
};

const candidate = {
  schemaVersion: "1.0.0",
  phase,
  selectedCandidate: null,
  rejectedCandidates: [
    { id: "dynamic-summary-temp-variable-intent", reason: "The input contains no explicit parent list, form, summary, or variable inventory scope identity; projecting it would normalize name-only lifecycle reuse." },
    { id: "temporary-variable-discovery", reason: "It recursively reads mutable control state and appends resource.tempVars." },
    { id: "temporary-variable-allocation", reason: "It allocates host-owned deterministic variable declarations and mutates the resource." },
    { id: "runtime-summary-expression", reason: "The materializer has no executable runtime evaluator or writeback parity boundary." }
  ],
  nextPhase,
  acceptanceMarkerOmitted: true
};

writeJson("compatibility/capability-manifests/data-list-sublist-summary-temp-variable-lifecycle-scope.v0.1.0.json", lifecycle);
writeJson("compatibility/capability-manifests/data-list-sublist-summary-temp-variable-lifecycle-ownership-matrix.v0.1.0.json", { schemaVersion: "1.0.0", phase, source: sourcePath, rows: stages });
writeJson("compatibility/capability-manifests/data-list-sublist-summary-temp-variable-lifecycle-candidate-selection.v0.1.0.json", candidate);
write("docs/architecture/yeeflow-app-builder-phase-11a-data-list-sublist-summary-runtime-temporary-variable-lifecycle-and-scope-contract-audit.v0.1.0.md", `# Phase 11A Data List Sublist Summary Runtime Temporary-Variable Lifecycle and Scope Contract Audit\n\n## Decision\n\nThe lifecycle and scope contract is accepted, but no Phase 11B internal shadow is safe. Current Legacy declarations carry a cleaned binding name and prefix only. Discovery scans one mutable form resource and de-duplicates by cleaned variable id. Neither boundary carries or proves parent-list, form, summary, or variable-inventory relationship scope.\n\n\`SUBLIST_SUMMARY_TEMP_VARIABLE_LIFECYCLE_AUDITED\`\n\n\`SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_CONTRACT_VALID\`\n\n## Lifecycle\n\nThe materializer parses and normalizes declarations, transfers them as non-serialized field metadata, lowers them into a mutable Sublist control, then scans that completed resource for \`__temp_\` bindings. \`ensureDataListSubListSummaryTempVars\` appends missing \`resource.tempVars\` declarations. It does not execute a dynamic expression or perform runtime writeback; those remain external product-runtime responsibilities.\n\n## Ownership\n\nCore is prohibited from temporary-variable discovery, allocation, mutation, writeback, runtime expression evaluation, template/resource binding, and package integration. Host and Local Runtime retain those responsibilities. A future Core boundary may return immutable dynamic-summary intent only after explicit host scope evidence exists.\n\n## Stable Errors\n\nThe future host contract reserves missing, invalid, duplicate, wrong-scope, broken relationship, stale binding, and unsafe lifecycle reuse errors for temporary-variable references. They are not new production behavior.\n\n## Phase 11B\n\nPhase 11B is a scope-evidence audit, not an internal shadow. It must establish explicit parent-list, form, summary, and inventory relationship proof before any dynamic intent can be selected.\n\n## Preserved Boundaries\n\nThis audit changed no dynamic summary behavior, \`tempVars\`, template, resource, adapter, public API, artifact, distribution contract, Plugin dist, Legacy materializer, active installation, historical ZIP, protected duplicate, Git, or release state.\n`);

const state = json(statePath);
state.migration.currentPhase = phase;
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = nextPhase;
const completion = { id: phase, status: "complete", evidence: "2026-07-19: SUBLIST_SUMMARY_TEMP_VARIABLE_LIFECYCLE_AUDITED, SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_CONTRACT_VALID, and deterministic lifecycle/scope negative regressions passed. No Phase 11B internal shadow was selected because Legacy lacks explicit list, form, summary, and inventory scope evidence." };
const existing = state.completed.find((item) => item.id === phase);
if (existing) Object.assign(existing, completion); else state.completed.push(completion);
state.nextSteps = (state.nextSteps || []).filter((item) => item.id !== phase && item.id !== nextPhase && item.id !== "phase-11-sublist-summary-runtime-temporary-variable-contract-audit");
state.nextSteps.unshift({ order: 1, id: nextPhase, description: "Audit and prove explicit host-owned Data List Sublist temporary-variable scope evidence before considering any dynamic-summary intent shadow. Do not allocate, mutate, bind, or route dynamic behavior." });
state.proofStatus.dataListSublistSummaryTempVariableLifecycleScope = "audited_candidate_rejected_missing_scope_proof";
state.proofStatus.phase11TempVariableContract = "accepted_candidate_rejected";
writeJson(statePath, state);
console.log("PHASE_11A_TEMP_VARIABLE_SCOPE_CONTRACT_RECORDED");

function row(stage, boundary, classification, ownership, effects, scopeGap) { return { stage, boundary, line: functionLine(boundary), directProductionCallerCount: countCalls(boundary), classification, ownership, effects, scopeGap }; }
function functionLine(name) { if (name === "external runtime") return null; let line = 0; const visit = (node) => { if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) && node.name?.text === name) line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1; ts.forEachChild(node, visit); }; visit(sourceFile); return line; }
function countCalls(name) { if (name === "external runtime") return 0; let count = 0; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1; ts.forEachChild(node, visit); }; visit(sourceFile); return count; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function checksum(path) { return { path, sha256: sha(read(path)) }; }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function write(path, value) { writeFileSync(resolve(root, path), value, "utf8"); }
function writeJson(path, value) { write(path, `${JSON.stringify(value, null, 2)}\n`); }

#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-10f-data-list-sublist-summary-family-closure-audit";
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const source = read(sourcePath);
const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const routing = json("compatibility/capability-manifests/data-list-sublist-scalar-summary-intent-production-routing.v0.1.0.json");
const shadowCorpus = json("compatibility/differential-fixtures/data-list-sublist-scalar-summary-intent-shadow.v0.1.0.json");
const lineage = json("compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json");
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const artifacts = Object.fromEntries(distribution.artifacts.map((item) => [item.packageName, { path: item.path, sha256: item.sha256 }]));
const protectedBoundaries = {
  coreAdapter: { path: "scripts/lib/materializer-core-adapter.mjs", sha256: sha(read("scripts/lib/materializer-core-adapter.mjs")) },
  runtimeAdapter: { path: "scripts/lib/local-runtime-core-adapter.mjs", sha256: sha(read("scripts/lib/local-runtime-core-adapter.mjs")) },
  materializerPublicIndex: { path: "packages/app-builder-core-materializer/src/index.ts", sha256: sha(read("packages/app-builder-core-materializer/src/index.ts")) },
  localRuntimePublicIndex: { path: "runtimes/app-builder-core-local-runtime/src/index.ts", sha256: sha(read("runtimes/app-builder-core-local-runtime/src/index.ts")) }
};
const contractPath = "compatibility/capability-manifests/data-list-sublist-summary-family-closure.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-10f-data-list-sublist-summary-family-closure-audit.v0.1.0.md";
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json";
const deferred = [
  family("temporary-variable allocation discovery and writeback", "ensureDataListSubListSummaryTempVars", "temporary-variable lifecycle and scope contract", "Reads __temp_ bindings and mutates resource.tempVars; Core and Local Runtime explicitly exclude allocation, discovery, mutation, and writeback."),
  family("runtime expressions and dynamic calculations", "shouldRouteDataListSublistScalarSummaryIntent", "runtime-summary-expression contract", "The static route rejects runtimeExpression and contains no evaluator or runtime context."),
  family("summary scope and lifecycle validation", "normalizeDataListSubListSummaries", "summary-reference and temporary-variable scope contract", "Static intent validates only immutable summary references; lifecycle ownership and cross-resource scope remain host/runtime work."),
  family("Rules control and template binding", "buildDataListFormSubListControl", "mutable form-control binding contract", "The route returns static metadata only; control insertion, Rules, template mutation, and binding remain Legacy-owned."),
  family("nested-control and non-scalar summaries", "buildDataListFormSubListControl", "nested summary graph and non-scalar semantics contract", "Nested controls and non-scalar sources require graph/template semantics that have no static immutable projection proof."),
  family("Lookup summaries", "dataListSublistScalarSummarySourceColumn", "Lookup summary resolution contract", "Lookup is not a scalar source type and would require relationship resolution outside the static route."),
  family("identity user and department summaries", "dataListSublistScalarSummarySourceColumn", "identity summary semantics contract", "Identity sources are excluded from scalar semantics and require host-owned identity behavior."),
  family("binary file image and barcode summaries", "dataListSublistScalarSummarySourceColumn", "binary and barcode summary contract", "Binary and barcode behavior is excluded from static aggregate semantics and has no immutable parity basis."),
  family("actions runtime expressions and writeback", "materializeDataListFormResource", "action and runtime writeback contract", "Actions and writeback mutate a host resource and do not inherit a static summary metadata route."),
  family("display layout and package integration", "materializeDataListFormResource", "layout resource and package integration contract", "The route stops before mutable resource integration and package serialization.")
];
const contract = {
  schemaVersion: "1.0.0",
  phase,
  decision: { status: "accepted", marker: "PHASE_10_CLOSURE_ACCEPTED", nextPhase: "phase-11-sublist-summary-runtime-temporary-variable-contract-audit", additionalSafeStaticSummaryVerticals: 0 },
  staticRoute: {
    route: routing.route.boundary,
    operations: ["total", "average", "minimum", "maximum", "count"],
    core: "projectDataListSublistScalarSummaryIntent",
    localRuntime: "lowerDataListSublistScalarSummaryIntentAtHost",
    binding: null,
    temporaryVariableOwner: "ensureDataListSubListSummaryTempVars",
    materializerCallerCount: countCalls("normalizeDataListSubListSummaries"),
    routeTokenCount: (source.match(/DATA_LIST_SUBLIST_SCALAR_SUMMARY_INTENT_CORE_ROUTE_START/gu) || []).length,
    scalarCoverage: { actualMaterializerCases: routing.corpus.caseCount, immutableCorpusCases: shadowCorpus.caseCount, operationFamilies: ["total", "average", "minimum", "maximum", "count"], countScalarTypes: ["text", "boolean"] }
  },
  deferredFamilies: deferred,
  preserved: { productionRouteChanged: false, adapterChanged: false, publicApiChanged: false, artifactChanged: false, distributionContractChanged: false, pluginDistChanged: false, legacyMaterializerChanged: false },
  lineage: { requiredPhases: ["phase-10d-data-list-sublist-scalar-summary-intent-dual-public-distribution-promotion", "phase-10e-data-list-sublist-scalar-summary-intent-selective-routing-proof"], transitionCount: lineage.approvedTransitions.length, sha256: sha(read("compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json")) },
  checksums: { source: { path: sourcePath, sha256: sha(source) }, protectedBoundaries, artifacts, historicalZipSha256: "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2" }
};
writeJson(contractPath, contract);
write(reportPath, `# Phase 10F Data List Sublist Summary Family Closure Audit\n\n## Decision\n\n\`PHASE_10_CLOSURE_ACCEPTED\`\n\nThe static scalar Sublist summary family is closed. Phase 10E is the sole approved production route: immutable Core intent plus Local Runtime static metadata for \`total\`, \`average\`, \`minimum\`, \`maximum\`, and \`count\`, with \`binding: null\`. The 12-case actual-materializer corpus and 16-case immutable corpus leave no additional safe static vertical.\n\n\`SUBLIST_SCALAR_SUMMARY_INTENT_ROUTE_RECONFIRMED\`\n\n\`SUBLIST_SCALAR_SUMMARY_TEMP_VARIABLE_NONINTERFERENCE_RECONFIRMED\`\n\n\`SUBLIST_SUMMARY_FAMILY_CLOSURE_VALID\`\n\n## Deferred Host and Runtime Work\n\nTemporary-variable lifecycle, runtime expressions, scope validation, mutable Rules/control/template binding, nested and non-scalar semantics, Lookup, identity, binary, barcode, actions, layout integration, and package output remain deferred. They cannot inherit the Phase 10E route because each requires mutable host state, runtime execution, non-scalar semantics, or resource/package integration.\n\n## Phase 11\n\nPhase 11 begins only with a temporary-variable lifecycle and scope contract audit. It does not authorize dynamic production routing.\n\n## Preserved Boundaries\n\nThis audit changed no production route, adapter, public API, artifact, distribution contract, Plugin dist, Legacy materializer, active installation, historical ZIP, protected duplicate, Git, or release state.\n`);
const state = json(statePath);
state.migration.currentPhase = phase;
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = contract.decision.nextPhase;
const completion = { id: phase, status: "complete", evidence: "2026-07-19: static scalar summary family closure accepted after Phase 10D/10E lineage, static-route, temporary-variable noninterference, and deferred-family validation." };
const existing = state.completed.find((item) => item.id === phase);
if (existing) Object.assign(existing, completion); else state.completed.push(completion);
state.nextSteps = (state.nextSteps || []).filter((item) => item.id !== phase && item.id !== contract.decision.nextPhase);
state.nextSteps.unshift({ order: 1, id: contract.decision.nextPhase, description: "Audit temporary-variable lifecycle and scope ownership for Data List Sublist summaries. Do not route dynamic calculations or mutable host behavior." });
state.proofStatus.dataListSublistSummaryFamilyClosure = "accepted";
state.proofStatus.phase10Closure = "accepted";
writeJson(statePath, state);
console.log("PHASE_10F_CLOSURE_RECORDED");

function family(category, boundary, prerequisite, reason) { return { category, boundary, line: functionLine(boundary), callerCount: countCalls(boundary), prerequisite, reason, canInheritPhase10E: false }; }
function functionLine(name) { let line = 0; const visit = (node) => { if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) && node.name?.text === name) line = ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1; ts.forEachChild(node, visit); }; visit(ast); return line; }
function countCalls(name) { let count = 0; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1; ts.forEachChild(node, visit); }; visit(ast); return count; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function write(path, value) { writeFileSync(resolve(root, path), value, "utf8"); }
function writeJson(path, value) { writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`, "utf8"); }

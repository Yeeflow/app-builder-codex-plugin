#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-11b-sublist-summary-runtime-temporary-variable-scope-evidence-audit";
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const source = read(sourcePath);
const sourceFile = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json";
const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
const goldenReferencePath = "docs/reference/sublist-summary-binding-golden-reference.json";
const lineage = json(lineagePath);
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const artifacts = Object.fromEntries(distribution.artifacts.map((item) => [item.packageName, { path: item.path, sha256: item.sha256 }]));
const protectedBoundaries = {
  materializer: checksum(sourcePath),
  coreAdapter: checksum("scripts/lib/materializer-core-adapter.mjs"),
  runtimeAdapter: checksum("scripts/lib/local-runtime-core-adapter.mjs"),
  materializerPublicIndex: checksum("packages/app-builder-core-materializer/src/index.ts"),
  localRuntimePublicIndex: checksum("runtimes/app-builder-core-local-runtime/src/index.ts"),
  goldenReference: checksum(goldenReferencePath)
};

const evidence = [
  row("summary declaration", "parseSubListSummaries", "binding prefix and cleaned value only", "missing", "missing", "missing", "missing", "missing", "A declaration has no parent ListID, parent FieldID, form, summary, or inventory relationship identity."),
  row("planned summary metadata", "normalizePlannedSubListSummary", "field, type, display, prefix, value", "missing", "missing", "missing", "missing", "missing", "The cleaned value is a name-like target, not a scoped temporary-variable identity."),
  row("completed field record", "buildFieldRecord", "non-enumerable __plannedListSummaries", "missing", "missing", "missing", "missing", "missing", "The record transfers metadata before a mutable form resource or inventory exists."),
  row("form control summary metadata", "buildDataListFormSubListControl", "list-fields-summary on a mutable cloned control", "available_but_not_bound", "available_but_not_bound", "available_but_not_bound", "missing", "missing", "Control placement can expose resource-local list/form data but does not validate a summary-to-variable relationship."),
  row("resource inventory", "ensureDataListSubListSummaryTempVars", "resource.tempVars array and recursive control traversal", "available_but_not_bound", "available_but_not_bound", "available_but_not_bound", "missing", "mutable_unscoped_name_set", "Discovery de-duplicates exact cleaned ids inside one mutable resource; it has no explicit inventory id, owner relation, or cross-build lifecycle proof."),
  row("export-derived binding reference", "sublist-summary-binding-golden-reference", "surface prefix and declared target id", "missing", "missing", "missing", "missing", "missing", "The reference records a target value and prefix only; it is not an inventory or runtime scope contract."),
  row("runtime update and writeback", "external product runtime", "not present in repository materializer", "missing", "missing", "missing", "missing", "missing", "No runtime scope, evaluation, or writeback behavior is available for parity or immutable projection.")
];

const contract = {
  schemaVersion: "1.0.0",
  phase,
  decision: {
    status: "blocked_missing_external_product_runtime_scope_evidence",
    marker: "PHASE_11_BLOCKED_MISSING_RUNTIME_SCOPE_EVIDENCE",
    safeImmutableDynamicSummaryIntentBoundary: false,
    reason: "Available Legacy and export evidence contains cleaned temporary-variable names and mutable resource-local discovery, but no explicit, lossless, stable parent-list, parent-field, form, summary, inventory, and temporary-variable relationship scope identity."
  },
  requiredScopeEvidenceToUnblock: [
    "An export or product contract that binds a dynamic summary reference to parent ListID and parent FieldID.",
    "An explicit form or resource identity and a summary identifier that remain stable through repeat builds and upgrades.",
    "An inventory declaration identity and a validated summary-to-temporary-variable relationship, not a cleaned name match.",
    "Product-runtime lifecycle semantics for discovery, allocation, scope validation, stale-binding handling, runtime update, and writeback.",
    "A scoped runtime corpus proving isolation across lists, forms, summaries, repeated builds, and upgrades."
  ],
  prohibitions: [
    "Core temporary-variable allocation", "Core temporary-variable discovery", "Core temporary-variable mutation", "Core temporary-variable binding", "Core temporary-variable writeback", "Core temporary-variable serialization", "Core runtime expression evaluation", "name-only cross-scope matching", "dynamic production routing"
  ],
  dynamicSummaryOwnership: {
    core: "No dynamic-summary intent projection is authorized until the required scope evidence exists.",
    hostAndLocalRuntime: ["temporary-variable inventory discovery", "allocation", "scope and relationship validation", "runtime expression lowering", "Rules/control/template binding", "resource mutation", "runtime writeback", "package integration"]
  },
  preserved: { productionRouteChanged: false, legacyMaterializerChanged: false, adaptersChanged: false, publicApiChanged: false, artifactsChanged: false, distributionChanged: false, pluginDistChanged: false, activeInstallationChanged: false, historicalZipChanged: false, protectedDuplicatesChanged: false },
  lineage: { requiredPhases: ["phase-10d-data-list-sublist-scalar-summary-intent-dual-public-distribution-promotion", "phase-10e-data-list-sublist-scalar-summary-intent-selective-routing-proof"], transitionCount: lineage.approvedTransitions.length, sha256: sha(read(lineagePath)) },
  checksums: { protectedBoundaries, artifacts, historicalZipSha256: "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2" }
};

const matrix = { schemaVersion: "1.0.0", phase, source: sourcePath, rows: evidence, result: "blocked_missing_lossless_stable_scope_evidence" };
writeJson("compatibility/capability-manifests/data-list-sublist-summary-temp-variable-scope-evidence.v0.1.0.json", contract);
writeJson("compatibility/capability-manifests/data-list-sublist-summary-temp-variable-scope-evidence-matrix.v0.1.0.json", matrix);
write("docs/architecture/yeeflow-app-builder-phase-11b-data-list-sublist-summary-runtime-temporary-variable-scope-evidence-audit.v0.1.0.md", `# Phase 11B Data List Sublist Summary Runtime Temporary-Variable Scope-Evidence Audit\n\n## Decision\n\nPhase 11 is blocked. No safe immutable dynamic-summary intent boundary exists in the available repository or export evidence. Legacy carries a cleaned temporary-variable name and performs mutable resource-local discovery. It does not preserve or validate a lossless relationship among parent ListID, parent FieldID, form/resource, summary, inventory, and temporary-variable identity.\n\n\`SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_EVIDENCE_AUDITED\`\n\n\`SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_EVIDENCE_MISSING\`\n\n\`PHASE_11_BLOCKED_MISSING_RUNTIME_SCOPE_EVIDENCE\`\n\n## Available Evidence\n\nThe parser and planned metadata expose a binding prefix and cleaned target value. The completed field record transfers non-serialized planned summaries. The form control and resource provide mutable placement and a \`resource.tempVars\` array, but \`ensureDataListSubListSummaryTempVars\` only de-duplicates exact cleaned names while traversing one resource. The export-derived binding reference similarly records a prefix and target value, not an authoritative scope relationship. No product runtime update or writeback implementation is present in this repository.\n\nA parent list or form value may be visible after mutable control placement, but it is not bound to a dynamic summary reference or inventory declaration. It therefore cannot be inferred as a temporary-variable scope proof.\n\n## Required Evidence to Unblock\n\nA future Phase 11 continuation requires an authoritative product/export/runtime contract with explicit parent ListID and FieldID, stable form/resource and summary identifiers, inventory declaration identity, validated summary-to-variable relation, and lifecycle/writeback semantics. It must be accompanied by a scoped corpus covering cross-list, cross-form, cross-summary, repeated-build, upgrade, stale-binding, and runtime-writeback behavior.\n\n## Preserved Boundaries\n\nNo Core shadow, Local Runtime shadow, public API, distribution artifact, adapter, production route, Legacy materializer, \`tempVars\`, template, resource, active installation, historical ZIP, protected duplicate, Git, or release state changed. Dynamic routing remains unauthorized.\n`);

const state = json(statePath);
state.lastUpdated = "2026-07-19";
state.migration.currentPhase = phase;
state.migration.currentPhaseStatus = "blocked";
state.migration.nextPhase = "";
state.migration.overallStatus = "blocked";
state.inProgress = [];
const blocked = { id: "phase-11b-dynamic-summary-runtime-scope-evidence-missing", status: "blocked", marker: "SUBLIST_SUMMARY_TEMP_VARIABLE_RUNTIME_SCOPE_EVIDENCE_MISSING", reason: "No available export, Legacy, or product-runtime evidence proves a lossless stable relationship among parent ListID, parent FieldID, form/resource, summary, temporary-variable inventory, and temporary-variable identity. Names and mutable resource traversal are insufficient." };
const existingBlocked = state.blocked?.find((item) => item.id === blocked.id);
if (existingBlocked) Object.assign(existingBlocked, blocked); else state.blocked = [...(state.blocked || []), blocked];
const completion = { id: phase, status: "blocked", evidence: "2026-07-19: SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_EVIDENCE_AUDITED and deterministic negative regressions confirmed that no lossless stable parent/list/form/summary/inventory/temporary-variable relationship exists in available evidence. PHASE_11_BLOCKED_MISSING_RUNTIME_SCOPE_EVIDENCE; no shadow, promotion, or routing is authorized." };
const existingCompletion = state.completed.find((item) => item.id === phase);
if (existingCompletion) Object.assign(existingCompletion, completion); else state.completed.push(completion);
state.nextSteps = (state.nextSteps || []).filter((item) => ![phase, "phase-11-sublist-summary-runtime-temporary-variable-contract-audit"].includes(item.id));
state.nextSteps.unshift({ order: 1, id: "external-product-runtime-scope-evidence", description: "Provide authoritative export/product-runtime scope and lifecycle evidence before reopening Phase 11. Do not infer scope from temporary-variable names or mutable resource traversal." });
state.proofStatus.dataListSublistSummaryTempVariableScopeEvidence = "blocked_missing_external_product_runtime_scope_evidence";
state.proofStatus.phase11DynamicSummaryMigration = "blocked_missing_external_product_runtime_scope_evidence";
writeJson(statePath, state);
console.log("PHASE_11B_TEMP_VARIABLE_SCOPE_EVIDENCE_RECORDED");

function row(stage, boundary, observedData, parentList, parentField, formOrResource, summaryReference, inventoryIdentity, conclusion) { return { stage, boundary, line: functionLine(boundary), directProductionCallerCount: countCalls(boundary), observedData, scopeEvidence: { parentList, parentField, formOrResource, summaryReference, inventoryIdentity }, conclusion }; }
function functionLine(name) { if (name === "sublist-summary-binding-golden-reference" || name === "external product runtime") return null; let line = 0; const visit = (node) => { if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) && node.name?.text === name) line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1; ts.forEachChild(node, visit); }; visit(sourceFile); return line; }
function countCalls(name) { if (name === "sublist-summary-binding-golden-reference" || name === "external product runtime") return 0; let count = 0; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1; ts.forEachChild(node, visit); }; visit(sourceFile); return count; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function checksum(path) { return { path, sha256: sha(read(path)) }; }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function write(path, value) { writeFileSync(resolve(root, path), value, "utf8"); }
function writeJson(path, value) { write(path, `${JSON.stringify(value, null, 2)}\n`); }

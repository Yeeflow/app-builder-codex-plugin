#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const source = read(sourcePath);
const file = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const calls = callsOf("dataListSubListVariables");
if (JSON.stringify(calls) !== JSON.stringify([4777, 4960])) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_LEGACY_BOUNDARY_DRIFT", "The two audited shared-seam call expressions changed.");
const result = {
  schemaVersion: "1.0.0",
  phase: "phase-8e-data-list-sublist-scalar-row-schema-coupled-consumer-routing-proof",
  decision: { status: "blocked", marker: "NO_SAFE_DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_ROUTING", reason: "The current production shared seam supplies only a parent field and untyped planned rows. It has no explicit host-supplied child ListID, child FieldID, or row-schema identity map required by the approved public Core and Local Runtime contract." },
  source: { path: sourcePath, sha256: sha(source) },
  sharedSeam: { function: "dataListSubListVariables", line: 4834, productionCallExpressions: calls, consumers: [{ function: "buildDataListFormSubListControl", line: 4777 }, { function: "buildFieldRules", line: 4960 }] },
  observedInput: { parentListIdentity: "available only to buildDataListFormSubListControl as listId", parentFieldIdentity: "available as field.FieldID only after buildFieldRecord", childListIdentity: "absent", childFieldIdentity: "absent", rowSchemaIdentity: "absent", rowDescriptors: "planned rows with id/display/type/control metadata but no host-issued identity map" },
  prohibitedWorkaround: ["derive a child ListID from parent ListID", "reuse parent FieldID as child FieldID", "fabricate row-schema identity from a field name", "allocate a fallback identity", "route only one consumer", "add a hidden environment switch or Legacy fallback"],
  requiredPrerequisite: { contract: "Data List Sublist child-resource identity-map and row-schema allocation contract", hostInputs: ["explicit lossless child ListID", "explicit lossless child FieldID map by row logical key", "explicit row-schema identity", "parent-child hierarchy scope"], proof: ["updated immutable Core corpus", "both-consumer source/ZIP/installed parity", "all ten host errors", "determinism", "temporary-copy Legacy rollback"] },
  routing: { changed: false, adaptersChanged: false, artifactsChanged: false, lineageTransitionAppended: false }
};
writeJson("compatibility/capability-manifests/data-list-sublist-scalar-row-schema-coupled-routing-blocker.v0.1.0.json", result);
writeText("docs/architecture/yeeflow-app-builder-phase-8e-data-list-sublist-scalar-row-schema-coupled-consumer-routing-proof.v0.1.0.md", report(result));
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json"; const state = json(statePath);
state.migration.currentPhase = result.phase; state.migration.currentPhaseStatus = "in_progress"; state.migration.nextPhase = "phase-8e-data-list-sublist-child-resource-identity-map-contract-audit";
state.proofStatus.dataListSublistScalarRowSchemaCoupledConsumerRouting = "blocked_missing_child_identity_map";
const evidence = `2026-07-19: ${result.decision.marker}. The shared dataListSubListVariables seam has exactly two production consumers, but no explicit child ListID, child FieldID, or row-schema identity map. No Core or Local Runtime route, adapter, artifact, or Legacy materializer change was made.`;
const existing = state.completed.find((item) => item.id === result.phase); if (existing) { existing.status = "blocked"; existing.evidence = evidence; } else state.completed.push({ id: result.phase, status: "blocked", evidence });
state.nextSteps = (state.nextSteps || []).filter((item) => item.id !== result.phase && item.id !== state.migration.nextPhase); state.nextSteps.unshift({ order: 1, id: state.migration.nextPhase, description: "Establish explicit host-supplied child ListID, child FieldID, row-schema identity, and parent-child hierarchy inputs before reconsidering the coupled Sublist scalar row-schema route." });
writeJson(statePath, state);
console.log("NO_SAFE_DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_ROUTING");
function report(value) { return `# Phase 8E Data List Sublist Scalar Row-Schema Coupled Routing Proof\n\n## Decision\n\n\`${value.decision.marker}\`\n\nProduction routing is unsafe under the approved Phase 8D contract. The shared \`dataListSubListVariables\` seam has exactly two production call expressions: \`buildDataListFormSubListControl\` at line 4777 and \`buildFieldRules\` at line 4960. It receives an untyped field plus a seed, not the required host identity map.\n\n## Missing Host Boundary\n\nThe form-control consumer has only a parent \`listId\` and \`field.FieldID\`; the rules consumer has neither explicit ListID nor FieldID. Neither caller supplies a child ListID, child FieldID, row-schema ID, or parent-child hierarchy snapshot. The planned rows contain labels, type, and control metadata only.\n\n## Why Routing Would Violate the Contract\n\nThe public Core and Local Runtime API require explicit lossless parent/child/row-schema identities. Deriving or reusing identities at this seam would fabricate host-owned identity and would make one or both consumers observe a different result. A one-consumer route would violate the coupled-consumer parity requirement.\n\n## Required Prerequisite\n\nA separate child-resource identity-map and row-schema allocation contract must supply the explicit lossless inputs listed in the blocker manifest. Only then may a new routing readiness audit define source, ZIP, installed, determinism, all-error, and temporary-copy Legacy rollback evidence.\n\n## Preserved Boundaries\n\nNo Legacy materializer, adapter, artifact, distribution contract, active installation, historical ZIP, protected duplicate, Git, or release state changed. No Phase 8E lineage transition was appended because no route was approved.\n`; }
function callsOf(name) { const result = []; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) result.push(file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1); ts.forEachChild(node, visit); }; visit(file); return result; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); } function json(path) { return JSON.parse(read(path)); } function sha(text) { return createHash("sha256").update(text).digest("hex"); } function writeJson(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, JSON.stringify(value, null, 2) + "\n"); } function writeText(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value); } function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

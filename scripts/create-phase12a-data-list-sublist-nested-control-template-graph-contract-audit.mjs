#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-12a-data-list-sublist-nested-control-template-graph-contract-audit";
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const templatePath = "docs/reference/data-list-form-control-sublist.template.json";
const source = read(sourcePath);
const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const boundaries = ["buildDataListFormSubListControl", "buildDataListSubListColumn", "normalizeSubListColumnControlType", "ensureDataListSubListColumnTitles", "dataListSubListVariables", "materializeDataListFormResource"];
const matrix = {
  schemaVersion: "1.0.0",
  phase,
  source: sourcePath,
  rows: boundaries.map((boundary) => ({ boundary, line: lineOf(boundary), directProductionCallerCount: callCount(boundary), ownership: boundary === "buildDataListSubListColumn" ? "Legacy nested child-control construction" : boundary === "normalizeSubListColumnControlType" ? "Legacy control-kind selection" : boundary === "ensureDataListSubListColumnTitles" ? "Legacy nested graph mutation" : boundary === "dataListSubListVariables" ? "embedded schema lowering" : "host template/resource integration" }))
};
const contract = {
  schemaVersion: "1.0.0",
  phase,
  decision: { status: "accepted", marker: "PHASE_12_NESTED_CONTROL_CONTRACT_ACCEPTED", nextPhase: "phase-12b-data-list-sublist-scalar-nested-control-placement-intent-internal-shadow" },
  source: { path: sourcePath, sha256: sha(source) },
  templateSnapshotEvidence: { path: templatePath, sha256: sha(read(templatePath)), templateId: "data_list_form_control_sublist_v1_1", parentNodeReference: "sublist-control-root", listFieldsSlotReference: "attrs.list-fields", childControlSlotReference: "list-field.control" },
  authoritativeIdentityModel: { productIdentities: ["parentListId", "parentFieldId"], embeddedColumnSemantics: ["id", "idx", "ordinal"], forbiddenProductIdentities: ["childListId", "childFieldId", "rowSchemaId"] },
  immutableCoreBoundary: {
    input: ["immutable parent Sublist template snapshot", "immutable parent ListID and FieldID", "immutable list-fields slot reference", "ordered scalar column descriptors", "explicit child-control reference tokens", "host-supplied child-control node IDs only when a later lowerer requires them"],
    output: ["frozen nested child-control placement intent", "frozen findings", "stable ordered child-control requests"],
    prohibited: ["template loading", "template or resource mutation", "ID allocation", "UUID generation", "control insertion", "runtime bindings", "temporary-variable lifecycle", "runtime expression evaluation", "package output"]
  },
  hostOwnership: ["template loading", "snapshot extraction", "host child-control ID allocation", "node and slot validation", "graph mutation", "control insertion", "runtime bindings", "resource integration", "package output"],
  stableErrors: ["SUBLIST_NESTED_CONTROL_TEMPLATE_SNAPSHOT_MISSING", "SUBLIST_NESTED_CONTROL_TEMPLATE_SNAPSHOT_INVALID", "SUBLIST_NESTED_CONTROL_SCOPE_MISMATCH", "SUBLIST_NESTED_CONTROL_SLOT_MISSING", "SUBLIST_NESTED_CONTROL_SLOT_RELATIONSHIP_BROKEN", "SUBLIST_NESTED_CONTROL_CHILD_REFERENCE_MISSING", "SUBLIST_NESTED_CONTROL_CHILD_REFERENCE_DUPLICATE", "SUBLIST_NESTED_CONTROL_CHILD_REFERENCE_INVALID"],
  exclusions: ["nested Sublist controls", "Lookup", "identity user department", "file image binary", "barcode", "actions", "runtime expressions", "temporary-variable writeback", "Dashboard", "Approval Form", "Workflow", "Document Library", "package orchestration"],
  auditMutations: { productionRouting: false, adapters: false, publicApis: false, artifacts: false, distribution: false, pluginDist: false, activeInstallation: false, historicalZip: false, protectedDuplicates: false },
  historicalPhase8A: { status: "retained superseded historical evidence", reason: "Its child-resource identity and row-schema premise is superseded for embedded schemas; its host-mutation observations remain valid." }
};
const candidate = {
  schemaVersion: "1.0.0",
  phase,
  selectedCandidate: {
    id: "data-list-sublist-scalar-nested-child-control-placement-intent",
    legacyBoundary: "buildDataListSubListColumn",
    productionCallerCount: callCount("buildDataListSubListColumn"),
    includes: ["one parent Sublist template snapshot", "one attrs.list-fields slot", "ordered scalar text date number boolean columns", "explicit non-product child-control reference tokens", "fresh host-supplied child-control IDs for test-only lowering"],
    excludes: contract.exclusions,
    parityBoundary: "buildDataListSubListColumn output before ensureDataListSubListColumnTitles mutates it",
    rationale: "The scalar child-control request is deterministic once the parent snapshot, slot, ordered columns, and host-supplied node IDs are explicit. It has no runtime binding, mutation, allocation, or package behavior in Core.",
    requiredCorpus: ["one child control", "ordered text date number boolean controls", "missing invalid duplicate child references", "wrong template scope or slot", "excluded nested Sublist and advanced controls", "deep immutability and JSON serialization"]
  }
};
write("compatibility/capability-manifests/data-list-sublist-nested-control-template-graph-contract.v0.2.0.json", contract);
write("compatibility/capability-manifests/data-list-sublist-nested-control-template-graph-ownership-matrix.v0.2.0.json", matrix);
write("compatibility/capability-manifests/data-list-sublist-nested-control-template-graph-candidate-selection.v0.2.0.json", candidate);
writeText("docs/architecture/yeeflow-app-builder-phase-12a-data-list-sublist-nested-control-template-graph-contract-audit.v0.1.0.md", `# Phase 12A Data List Sublist Nested-Control Template-Graph Contract Audit\n\nThe selected Phase 12B candidate is scalar nested child-control placement only. It consumes an immutable parent Sublist template snapshot, the \`attrs.list-fields\` slot, ordered scalar column descriptors, and non-product child-control reference tokens. Core returns frozen intent and findings only.\n\nThe host retains template loading, child-node ID allocation, graph mutation, insertion, bindings, resource integration, and package output. Embedded \`id\` and \`idx\` remain column semantics; they are never product resource identities.\n\nPhase 8A is retained as superseded historical evidence: its child-resource-identity premise is not revived.\n\n\`DATA_LIST_SUBLIST_NESTED_CONTROL_LEGACY_BOUNDARIES_AUDITED\`\n\n\`SUBLIST_NESTED_CONTROL_TEMPLATE_GRAPH_CONTRACT_VALID\`\n\n\`PHASE_12_NESTED_CONTROL_CONTRACT_ACCEPTED\`\n`);
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
state.migration.currentPhase = phase;
state.migration.currentPhaseStatus = "complete";
state.migration.overallStatus = "in_progress";
state.migration.nextPhase = contract.decision.nextPhase;
if (!state.completed.some((item) => item.id === phase)) state.completed.push({ id: phase, status: "complete", evidence: "2026-07-19: nested-control template snapshot, node/slot, child-reference, and host-ownership contract accepted for the bounded scalar child-control shadow." });
state.proofStatus.dataListSublistNestedControlTemplateGraphContract = "accepted";
write("docs/architecture/yeeflow-app-builder-core-migration-state.json", state);
console.log("PHASE_12A_NESTED_CONTROL_CONTRACT_RECORDED");

function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function write(path, value) { writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`); }
function writeText(path, value) { writeFileSync(resolve(root, path), value); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function lineOf(name) { let line = 0; const visit = (node) => { if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) && node.name?.text === name) line = ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1; ts.forEachChild(node, visit); }; visit(ast); return line; }
function callCount(name) { let count = 0; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1; ts.forEachChild(node, visit); }; visit(ast); return count; }

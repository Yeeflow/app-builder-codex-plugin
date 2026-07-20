#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = json(argument("--contract", "compatibility/capability-manifests/data-list-sublist-nested-control-template-graph-contract.v0.2.0.json"));
const matrix = json(argument("--matrix", "compatibility/capability-manifests/data-list-sublist-nested-control-template-graph-ownership-matrix.v0.2.0.json"));
const candidate = json(argument("--candidate", "compatibility/capability-manifests/data-list-sublist-nested-control-template-graph-candidate-selection.v0.2.0.json"));
const source = read("scripts/materialize-full-app-generated-final.mjs");
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
const ast = ts.createSourceFile("materialize-full-app-generated-final.mjs", source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const errors = ["SUBLIST_NESTED_CONTROL_TEMPLATE_SNAPSHOT_MISSING", "SUBLIST_NESTED_CONTROL_TEMPLATE_SNAPSHOT_INVALID", "SUBLIST_NESTED_CONTROL_SCOPE_MISMATCH", "SUBLIST_NESTED_CONTROL_SLOT_MISSING", "SUBLIST_NESTED_CONTROL_SLOT_RELATIONSHIP_BROKEN", "SUBLIST_NESTED_CONTROL_CHILD_REFERENCE_MISSING", "SUBLIST_NESTED_CONTROL_CHILD_REFERENCE_DUPLICATE", "SUBLIST_NESTED_CONTROL_CHILD_REFERENCE_INVALID"];

if (contract.phase !== "phase-12a-data-list-sublist-nested-control-template-graph-contract-audit" || contract.decision?.status !== "accepted" || contract.decision?.marker !== "PHASE_12_NESTED_CONTROL_CONTRACT_ACCEPTED" || contract.source?.sha256 !== sha(source)) fail("SUBLIST_NESTED_CONTROL_TEMPLATE_GRAPH_CONTRACT_INVALID");
if (JSON.stringify(contract.authoritativeIdentityModel?.productIdentities) !== JSON.stringify(["parentListId", "parentFieldId"]) || contract.authoritativeIdentityModel?.embeddedColumnSemantics?.join(",") !== "id,idx,ordinal" || contract.authoritativeIdentityModel?.forbiddenProductIdentities?.join(",") !== "childListId,childFieldId,rowSchemaId") fail("SUBLIST_NESTED_CONTROL_IDENTITY_MODEL_INVALID");
if (contract.templateSnapshotEvidence?.listFieldsSlotReference !== "attrs.list-fields" || contract.templateSnapshotEvidence?.childControlSlotReference !== "list-field.control" || !errors.every((code) => contract.stableErrors?.includes(code))) fail("SUBLIST_NESTED_CONTROL_TEMPLATE_SNAPSHOT_INVALID");
for (const forbidden of ["template loading", "template or resource mutation", "ID allocation", "UUID generation", "control insertion", "runtime bindings", "temporary-variable lifecycle", "runtime expression evaluation", "package output"]) if (!contract.immutableCoreBoundary?.prohibited?.includes(forbidden)) fail("SUBLIST_NESTED_CONTROL_CORE_BOUNDARY_INVALID");
if (!contract.hostOwnership?.includes("host child-control ID allocation") || !contract.hostOwnership?.includes("graph mutation") || !contract.hostOwnership?.includes("control insertion")) fail("SUBLIST_NESTED_CONTROL_HOST_BOUNDARY_INVALID");
if (matrix.rows?.some((row) => !row.line || row.directProductionCallerCount !== callCount(row.boundary)) || candidate.selectedCandidate?.id !== "data-list-sublist-scalar-nested-child-control-placement-intent" || candidate.selectedCandidate?.productionCallerCount !== callCount("buildDataListSubListColumn") || !candidate.selectedCandidate?.excludes?.includes("nested Sublist controls") || !candidate.selectedCandidate?.excludes?.includes("Lookup")) fail("SUBLIST_NESTED_CONTROL_CANDIDATE_INVALID");
if (Object.values(contract.auditMutations || {}).some(Boolean) || source.includes("DATA_LIST_SUBLIST_NESTED_CONTROL_CORE_ROUTE")) fail("SUBLIST_NESTED_CONTROL_AUDIT_SCOPE_VIOLATION");
if (state.migration?.currentPhase !== contract.phase || state.migration?.currentPhaseStatus !== "complete" || state.migration?.nextPhase !== contract.decision.nextPhase || state.proofStatus?.dataListSublistNestedControlTemplateGraphContract !== "accepted") fail("SUBLIST_NESTED_CONTROL_STATE_INVALID");
console.log("DATA_LIST_SUBLIST_NESTED_CONTROL_LEGACY_BOUNDARIES_AUDITED");
console.log("SUBLIST_NESTED_CONTROL_TEMPLATE_GRAPH_CONTRACT_VALID");
console.log("PHASE_12_NESTED_CONTROL_CONTRACT_ACCEPTED");

function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function callCount(name) { let count = 0; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1; ts.forEachChild(node, visit); }; visit(ast); return count; }
function fail(code) { console.error(code); process.exit(1); }

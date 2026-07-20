#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = json(argument("--contract", "compatibility/capability-manifests/data-list-sublist-nested-template-graph-contract.v0.1.0.json"));
const selection = json(argument("--selection", "compatibility/capability-manifests/data-list-sublist-nested-template-graph-candidate-selection.v0.1.0.json"));
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const source = read(sourcePath);
const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const expectedFamilies = ["sublist-field-records-and-rules", "sublist-row-schema-normalization", "nested-control-placement", "summary-and-aggregation-definitions", "type-zero-and-type-one-presentation", "default-new-edit-form-lifecycle", "embedded-lookup-and-advanced-controls", "template-identity-layout-and-package-integration"];
const errors = ["SUBLIST_TEMPLATE_GRAPH_REFERENCE_MISSING", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_INVALID", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_DUPLICATE", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_RELATIONSHIP_BROKEN", "SUBLIST_ROW_SCHEMA_REFERENCE_MISSING", "SUBLIST_ROW_SCHEMA_REFERENCE_INVALID", "SUBLIST_ROW_SCHEMA_REFERENCE_SCOPE_MISMATCH", "SUBLIST_ROW_SCHEMA_REFERENCE_DUPLICATE", "SUBLIST_ROW_SCHEMA_REFERENCE_RELATIONSHIP_BROKEN"];
if (contract.phase !== "phase-8a-data-list-sublist-nested-template-graph-contract-audit" || contract.source?.path !== sourcePath || contract.source?.sha256 !== sha(source) || contract.decision?.marker !== "PHASE_8_SUBLIST_CONTRACT_ACCEPTED" || contract.decision?.status !== "accepted") fail("SUBLIST_NESTED_TEMPLATE_GRAPH_CONTRACT_INVALID", "The Phase 8A contract does not match the current audited source.");
if (!Array.isArray(contract.inventory) || contract.inventory.length !== expectedFamilies.length || !expectedFamilies.every((id) => contract.inventory.some((item) => item.id === id))) fail("SUBLIST_NESTED_TEMPLATE_GRAPH_FAMILY_OMITTED", "The full Sublist family inventory is incomplete.");
for (const item of contract.inventory) {
  if (!item.classification || !Array.isArray(item.legacyBoundary) || !item.legacyBoundary.length || !Array.isArray(item.planningInputs) || !item.planningInputs.length || !Array.isArray(item.hostEffects) || !item.hostEffects.length || !item.blocker) fail("SUBLIST_NESTED_TEMPLATE_GRAPH_FAMILY_INVALID", "Each Sublist family requires AST boundaries, inputs, host effects, and a blocker or candidate rationale.");
  for (const boundary of item.legacyBoundary) if (!source.includes(`function ${boundary.function}`) || countCalls(boundary.function) !== boundary.productionCallerCount) fail("SUBLIST_NESTED_TEMPLATE_GRAPH_CALLER_DRIFT", `Sublist boundary drifted: ${boundary.function}.`);
}
if (!errors.every((code) => contract.stableErrors?.codes?.includes(code) && contract.stableErrors?.semantics?.[code])) fail("SUBLIST_NESTED_TEMPLATE_GRAPH_ERROR_CONTRACT_INVALID", "The nested template graph error contract is incomplete.");
const prohibited = contract.coreContract?.prohibitions || [];
for (const value of ["ID allocation", "UUID generation", "template or resource mutation", "caller-owned findings append", "runtime expression evaluation", "cross-resource Lookup resolution", "package writing"]) if (!prohibited.includes(value)) fail("SUBLIST_NESTED_TEMPLATE_GRAPH_CORE_BOUNDARY_INVALID", `Core must prohibit ${value}.`);
if (!contract.coreContract?.hostResponsibility?.includes("child ID supply") || !contract.coreContract?.hostResponsibility?.includes("graph lowering") || !contract.coreContract?.hostResponsibility?.includes("mutable insertion")) fail("SUBLIST_NESTED_TEMPLATE_GRAPH_HOST_BOUNDARY_INVALID", "The host nested identity and lowering boundary is incomplete.");
const candidate = contract.selectedCandidate;
if (selection.selectedCandidate?.id !== candidate?.id || candidate?.id !== "data-list-sublist-explicit-scalar-row-schema-intent" || candidate?.surface !== "data-list" || candidate?.family !== "sublist-row-schema-normalization" || candidate?.productionCallerCount !== countCalls("dataListSubListVariables")) fail("SUBLIST_NESTED_TEMPLATE_GRAPH_CANDIDATE_INVALID", "The selected Phase 8B candidate is not the exact bounded Sublist vertical.");
for (const excluded of ["missing row identity allocation", "nested control placement", "summaries and temporary variables", "Lookup row controls", "identity user people person row controls", "file image binary row controls", "runtime actions and expressions", "template loading and mutation"]) if (!candidate.excluded?.includes(excluded)) fail("SUBLIST_NESTED_TEMPLATE_GRAPH_CANDIDATE_SCOPE_INVALID", `The first candidate must exclude ${excluded}.`);
if (!candidate.coreInput?.includes("immutable parent and child identity references") || !candidate.coreOutput?.includes("immutable scalar row-schema intent") || !candidate.rollback?.includes("Temporary complete Plugin copy") || candidate.requiredParityFixture?.plannedCaseCount !== 12) fail("SUBLIST_NESTED_TEMPLATE_GRAPH_CANDIDATE_PROOF_INVALID", "The candidate lacks the required immutable DTO, corpus, or rollback boundary.");
if (Object.values(contract.auditMutations || {}).some((value) => value !== false)) fail("SUBLIST_NESTED_TEMPLATE_GRAPH_AUDIT_MUTATION_FORBIDDEN", "Phase 8A must not alter routes, APIs, artifacts, adapters, or protected boundaries.");
console.log("DATA_LIST_SUBLIST_LEGACY_BOUNDARIES_AUDITED");
console.log("SUBLIST_NESTED_TEMPLATE_GRAPH_CONTRACT_VALID");
console.log("PHASE_8_SUBLIST_CONTRACT_ACCEPTED");

function countCalls(name) { let count = 0; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1; ts.forEachChild(node, visit); }; visit(ast); return count; }
function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? resolve(root, fallback) : resolve(root, process.argv[index + 1]); }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(readFileSync(path, "utf8")); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

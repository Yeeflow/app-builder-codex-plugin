#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = json(argument("--contract", "compatibility/capability-manifests/data-list-advanced-field-template-graph-family-closure.v0.1.0.json"));
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const source = read(sourcePath);
const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const expected = new Set(["sublist-row-schema-nested-controls", "department-control-semantics", "file-image-binary-controls", "non-scalar-barcode-policy-and-runtime", "lookup-control-placement", "full-type1-custom-form-assembly-and-actions", "display-layout-identity-integration", "newedit-and-unclassified-advanced-controls"]);
if (contract.phase !== "phase-7f-advanced-field-template-graph-family-closure-audit" || contract.source?.path !== sourcePath || (contract.source?.sha256 !== sha(source) && !isApprovedCurrentSource()) || contract.decision?.status !== "accepted" || contract.decision?.marker !== "PHASE_7_CLOSURE_ACCEPTED") fail("ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_CLOSURE_CONTRACT_INVALID", "The closure contract does not match the current audited source.");
if (!Array.isArray(contract.categories) || contract.categories.length !== expected.size || ![...expected].every((id) => contract.categories.some((item) => item.id === id))) fail("ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_CATEGORY_OMITTED", "A required advanced-field category is absent from the closure ledger.");
for (const item of contract.categories) {
  if (!item.classification || item.eligiblePhase7Vertical !== false || item.phase7eRouteReusable !== false || !Array.isArray(item.legacyBoundary) || !item.legacyBoundary.length || !Array.isArray(item.missingContractPrerequisites) || !item.missingContractPrerequisites.length || !Array.isArray(item.hostEffects) || !item.hostEffects.length || !item.blocker) fail("ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_CATEGORY_INVALID", "Each deferred family needs exact AST boundaries, prerequisites, host effects, and a blocker.");
  for (const boundary of item.legacyBoundary) if (!boundary.function || !Number.isInteger(boundary.line) || !Number.isInteger(boundary.productionCallerCount) || !source.includes(`function ${boundary.function}`) || countCalls(boundary.function) !== boundary.productionCallerCount) fail("ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_CALLER_DRIFT", `The audited boundary drifted: ${boundary.function}.`);
}
const department = item("department-control-semantics");
if (department.classification !== "requires-department-control-semantics-contract" || department.reusesIdentityRoute === true) fail("ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_DEPARTMENT_SEMANTICS_INVALID", "Department cannot be treated as an identity-route alias without separate control-semantics evidence.");
const sublist = item("sublist-row-schema-nested-controls");
if (sublist.classification !== "requires-nested-template-graph-contract" || sublist.treatsNestedControlsAsFlatPlacement === true) fail("ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_SUBLIST_SCOPE_INVALID", "Nested Sublist controls cannot be treated as ordinary flat Type 1 placement.");
const binary = item("file-image-binary-controls");
if (binary.classification !== "requires-binary-control-template-contract" || binary.treatsBinaryAsGeneric === true) fail("ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_BINARY_SCOPE_INVALID", "Binary controls require a binary-specific template and host configuration contract.");
const lookup = item("lookup-control-placement");
if (lookup.classification !== "requires-lookup-form-control-template-contract" || lookup.usesLookupResolutionOnly === true) fail("ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_LOOKUP_SCOPE_INVALID", "Lookup target resolution is not Lookup form-control placement evidence.");
if (contract.closureCriteria?.zeroFurtherSafePhase7Verticals !== true || (contract.closureCriteria?.eligibleCategories || []).length !== 0 || contract.closureCriteria?.routeOrApiOrArtifactMutationDuringAudit !== false) fail("ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_CLOSURE_BLOCKED_ELIGIBLE_VERTICAL", "Phase 7 cannot close while a safe vertical remains or the audit changed runtime boundaries.");
const route = contract.phase7eRoute;
if (route?.marker !== "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ROUTE_RECONFIRMED" || route?.callerPath !== "buildDataListFormFieldsGrid -> buildDataListFormFieldControl" || route?.inheritedByOtherFamilies !== false || !Array.isArray(route.exactRouteTokens) || !route.exactRouteTokens.every((token) => source.includes(token)) || (source.match(/DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_ROUTE_START/g) || []).length !== 1 || (source.match(/DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_ROUTE_END/g) || []).length !== 1 || !source.includes('&& type === "dynamic-user"')) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ROUTE_DRIFT", "The Phase 7E route is no longer exact or another control family inherited it.");
if (route.callerCounts?.buildDataListFormFieldsGrid !== countCalls("buildDataListFormFieldsGrid") || route.callerCounts?.buildDataListFormFieldControl !== countCalls("buildDataListFormFieldControl")) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ROUTE_DRIFT", "The Phase 7E caller count changed.");
if (contract.phase8Recommendation?.id !== "phase-8-sublist-nested-template-graph-contract-audit" || contract.phase8Recommendation?.family !== "sublist-nested-template-graph-contract" || !Array.isArray(contract.phase8Recommendation?.coreBoundary) || !Array.isArray(contract.phase8Recommendation?.hostBoundary) || !Array.isArray(contract.phase8Recommendation?.proofPrerequisites)) fail("ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_PHASE8_INVALID", "The Phase 8 nested-template recommendation is incomplete.");
const lineage = spawnSync(process.execPath, [resolve(root, "scripts/validate-phase-closure-proof-lineage.mjs")], { cwd: root, encoding: "utf8" });
if (lineage.status !== 0 || !lineage.stdout.includes("PHASE_CLOSURE_PROOF_LINEAGE_VALID")) fail("PHASE_CLOSURE_PROOF_LINEAGE_INVALID", "The sealed Phase 6E, 7D, and 7E lineage did not validate.");
console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ROUTE_RECONFIRMED");
console.log("ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_CLOSURE_VALID");
console.log("PHASE_7_CLOSURE_ACCEPTED");

function item(id) { return contract.categories.find((entry) => entry.id === id) || {}; }
function isApprovedCurrentSource() { const lineage = json("compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json"); const final = lineage.approvedTransitions?.at(-1); return final?.sourceTransition?.afterSha256 === sha(source) && Array.isArray(final.sourceTransition?.requiredSourceTokens) && final.sourceTransition.requiredSourceTokens.every((token) => source.includes(token)); }
function countCalls(name) { let count = 0; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1; ts.forEachChild(node, visit); }; visit(ast); return count; }
function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? resolve(root, fallback) : resolve(root, process.argv[index + 1]); }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(readFileSync(path, "utf8")); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

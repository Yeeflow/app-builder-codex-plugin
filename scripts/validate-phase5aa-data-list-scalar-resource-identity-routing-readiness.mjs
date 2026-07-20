#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const optionIndex = process.argv.indexOf("--contract");
const contractPath = resolve(root, optionIndex < 0 ? "compatibility/capability-manifests/data-list-scalar-resource-identity-routing-readiness.v0.1.0.json" : process.argv[optionIndex + 1]);
const contract = JSON.parse(readFileSync(contractPath, "utf8"));
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const source = readFileSync(resolve(root, sourcePath), "utf8");
const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const errors = ["DATA_LIST_IDENTITY_ALLOCATION_MISSING", "DATA_LIST_IDENTITY_ALLOCATION_INVALID", "DATA_LIST_IDENTITY_ALLOCATION_COLLISION", "DATA_LIST_IDENTITY_SCOPE_MISMATCH", "DATA_LIST_IDENTITY_RELATIONSHIP_BROKEN", "DATA_LIST_LOOKUP_TARGET_UNRESOLVED", "DATA_LIST_IDENTITY_LOSSY_INPUT"];

if (contract.decision?.marker !== "DATA_LIST_SCALAR_RESOURCE_IDENTITY_ROUTING_READINESS_ACCEPTED" || contract.decision?.status !== "complete") fail("DATA_LIST_SCALAR_RESOURCE_IDENTITY_ROUTING_READINESS_INVALID", "The readiness decision is missing or not accepted.");
if (contract.astEvidence?.buildFieldRecordProductionCallerCount !== 1 || contract.astEvidence?.idBearingCallerCount !== 1 || !hasFunction("buildFieldRecord") || !hasFunction("buildResourceGraphPackage") || countCalls("buildFieldRecord") !== 1) fail("DATA_LIST_SCALAR_RESOURCE_IDENTITY_ROUTING_BOUNDARY_INVALID", "The scalar buildFieldRecord caller boundary is not exact.");
if (!hasCall("buildFieldRecord", "coreProjectDataListScalarField") || (!hasCall("buildFieldRecord", "buildDataListScalarFieldRecordFromProjection") && !hasCall("buildFieldRecord", "coreLowerDataListScalarResourceIdentityAtHost")) || !hasFunction("buildDataListScalarFieldRecordFromProjection")) fail("DATA_LIST_SCALAR_RESOURCE_IDENTITY_ROUTING_BOUNDARY_INVALID", "The scalar route or retained Legacy rollback helper is absent.");
if (!Array.isArray(contract.excludedFamilies) || !["lookup", "sublist", "identity user department", "file image binary", "unresolved lookup target", "template-dependent branch", "cross-resource branch"].every((item) => contract.excludedFamilies.includes(item))) fail("DATA_LIST_SCALAR_RESOURCE_IDENTITY_SCOPE_INVALID", "The non-scalar exclusion matrix is incomplete.");
if (!contract.identityAvailability?.listId?.includes("stringId") || !contract.identityAvailability?.fieldId?.includes("stringId") || !contract.identityAvailability?.relationshipGuarantee?.includes("reject")) fail("DATA_LIST_SCALAR_RESOURCE_IDENTITY_HOST_MAP_UNAVAILABLE", "The host identity map boundary is incomplete.");
if (!contract.requiredAdapters?.materializerCore || !contract.requiredAdapters?.localRuntime || !Array.isArray(contract.requiredAdapters?.prohibitions) || contract.requiredAdapters.prohibitions.length !== 7) fail("DATA_LIST_SCALAR_RESOURCE_IDENTITY_ADAPTER_BOUNDARY_INVALID", "The future adapter boundary is incomplete.");
if (!Array.isArray(contract.phase5ABRoutingProof?.identityErrors) || JSON.stringify(contract.phase5ABRoutingProof.identityErrors) !== JSON.stringify(errors) || !contract.phase5ABRoutingProof?.sourceArchiveInstalledParity || !contract.phase5ABRoutingProof?.rollback || !Array.isArray(contract.phase5ABRoutingProof?.regressionProtection)) fail("DATA_LIST_SCALAR_RESOURCE_IDENTITY_ROUTING_PROOF_MISSING", "The Phase 5AB parity, error, or rollback proof plan is incomplete.");
console.log("DATA_LIST_SCALAR_RESOURCE_IDENTITY_ROUTING_READINESS_ACCEPTED");

function hasFunction(name) { return ast.statements.some((statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === name); }
function hasCall(functionName, callName) { const declaration = ast.statements.find((statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === functionName); let found = false; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === callName) found = true; ts.forEachChild(node, visit); }; if (declaration) visit(declaration); return found; }
function countCalls(name) { let count = 0; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1; ts.forEachChild(node, visit); }; visit(ast); return count; }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

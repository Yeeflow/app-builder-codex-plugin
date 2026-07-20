#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = json(process.argv[2] || "compatibility/capability-manifests/data-list-sublist-child-resource-identity-map-contract.v0.1.0.json");
const flow = json("compatibility/capability-manifests/data-list-sublist-child-resource-identity-flow.v0.1.0.json");
const source = read(contract.source?.path);
const file = ts.createSourceFile(contract.source?.path, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
if (contract.decision?.marker !== "SUBLIST_CHILD_RESOURCE_IDENTITY_CONTRACT_VALID" || contract.decision?.status !== "accepted") fail("SUBLIST_CHILD_RESOURCE_IDENTITY_CONTRACT_INVALID", "The Phase 9A decision is incomplete.");
if (contract.source?.sha256 !== sha(source)) fail("SUBLIST_CHILD_RESOURCE_IDENTITY_FLOW_DRIFT", "The audited materializer source hash is stale.");
if (JSON.stringify(callsOf("dataListSubListVariables")) !== JSON.stringify([4777, 4960])) fail("SUBLIST_CHILD_RESOURCE_IDENTITY_FLOW_DRIFT", "The two coupled consumers changed.");
for (const item of contract.identityFlowMatrix || []) {
  if (item.status.includes("available") && item.representation !== "lossless non-empty decimal string") fail("SUBLIST_CHILD_RESOURCE_IDENTITY_LOSSY_INPUT", `Parent identity representation changed: ${item.identity}.`);
  if (item.status.startsWith("absent") && !/not allocated|not a host allocation/.test(item.availability)) fail("SUBLIST_CHILD_RESOURCE_IDENTITY_FLOW_DRIFT", `Absent identity became implicit: ${item.identity}.`);
}
const ids = ["parentListId", "parentFieldId", "childListId", "childFieldId", "rowSchemaId"];
if (JSON.stringify(contract.relationship?.requiredOrder) !== JSON.stringify(ids)) fail("SUBLIST_CHILD_RESOURCE_IDENTITY_RELATIONSHIP_BROKEN", "The explicit hierarchy contract changed.");
const errors = new Set(contract.hostContract?.validationErrors || []);
for (const code of ["SUBLIST_CHILD_RESOURCE_IDENTITY_MISSING", "SUBLIST_CHILD_RESOURCE_IDENTITY_INVALID", "SUBLIST_CHILD_RESOURCE_IDENTITY_LOSSY", "SUBLIST_CHILD_RESOURCE_IDENTITY_DUPLICATE", "SUBLIST_CHILD_RESOURCE_IDENTITY_SCOPE_MISMATCH", "SUBLIST_CHILD_RESOURCE_IDENTITY_RELATIONSHIP_BROKEN", "SUBLIST_ROW_SCHEMA_IDENTITY_MISSING", "SUBLIST_ROW_SCHEMA_IDENTITY_INVALID", "SUBLIST_ROW_SCHEMA_IDENTITY_DUPLICATE", "SUBLIST_ROW_SCHEMA_IDENTITY_SCOPE_MISMATCH", "SUBLIST_ROW_SCHEMA_IDENTITY_RELATIONSHIP_BROKEN"]) if (!errors.has(code)) fail("SUBLIST_CHILD_RESOURCE_IDENTITY_VALIDATION_INCOMPLETE", `Missing validation error: ${code}.`);
for (const rule of ["fallback allocation", "inferred child list discovery", "numeric coercion", "empty identity", "parent identity reuse as a child identity", "mutation of caller-owned identity maps", "Core resource-inventory access", "Core package output access"]) if (!(contract.hostContract?.prohibited || []).includes(rule)) fail("SUBLIST_CHILD_RESOURCE_IDENTITY_CORE_BOUNDARY_INVALID", `Missing prohibition: ${rule}.`);
const regressionCases = new Set((contract.negativeRegressionMatrix || []).map((item) => item.case));
for (const value of ["missing-child-list", "missing-child-field", "missing-row-schema", "numeric-lossy-or-empty-identity", "parent-identity-reused-as-child", "implicit-fallback-or-inferred-child", "wrong-scope-duplicate-or-broken-hierarchy", "core-resource-inventory-or-package-access"]) if (!regressionCases.has(value)) fail("SUBLIST_CHILD_RESOURCE_IDENTITY_REGRESSION_COVERAGE_INCOMPLETE", `Missing negative regression case: ${value}.`);
if (!contract.futurePhase9B?.proof?.includes("both-consumer identity descriptor equality") || !contract.futurePhase9B?.proof?.includes("temporary-copy-only rollback before any routing")) fail("SUBLIST_CHILD_RESOURCE_IDENTITY_ROUTING_PROOF_MISSING", "The future coupled-consumer proof is incomplete.");
if (flow.source?.sha256 !== contract.source?.sha256 || flow.minimumHostBoundary !== contract.futurePhase9B.boundary || JSON.stringify(flow.flow) !== JSON.stringify(contract.identityFlowMatrix)) fail("SUBLIST_CHILD_RESOURCE_IDENTITY_CONTRACT_INVALID", "The flow ledger does not match the authoritative contract.");
if (contract.integrity?.historicalZipSha256 !== "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2") fail("SUBLIST_CHILD_RESOURCE_IDENTITY_AUDIT_SCOPE_VIOLATION", "The historical ZIP checksum changed during the audit.");
if (/DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORE_ROUTE_START|coreProjectDataListSublistScalarRowSchema|coreLowerDataListSublistScalarRowSchemaAtHost/.test(source)) fail("SUBLIST_CHILD_RESOURCE_IDENTITY_AUDIT_SCOPE_VIOLATION", "Phase 9A must not route the Sublist scalar row-schema APIs.");
console.log("SUBLIST_CHILD_RESOURCE_IDENTITY_FLOW_AUDITED");
console.log("SUBLIST_CHILD_RESOURCE_IDENTITY_CONTRACT_VALID");
function callsOf(name) { const result = []; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) result.push(file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1); ts.forEachChild(node, visit); }; visit(file); return result; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); } function json(path) { return JSON.parse(read(path)); } function sha(value) { return createHash("sha256").update(value).digest("hex"); } function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

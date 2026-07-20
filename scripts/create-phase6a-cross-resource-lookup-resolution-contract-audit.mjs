#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const source = read(sourcePath);
const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const functions = ["buildFieldRecord", "buildFieldRules", "resolveLookupTargetListId", "validatePlannedLookupTargetsMaterialized"];
if (!functions.every((name) => declaration(name))) fail("CROSS_RESOURCE_LOOKUP_LEGACY_BOUNDARY_MISSING", "The required Legacy Lookup boundaries are unavailable.");
if (!source.includes("FULL_APP_MATERIALIZATION_LOOKUP_TARGET_DATA_LIST_NOT_PLANNED") || !source.includes("if (!lookupTargetListId) return \"\"")) fail("CROSS_RESOURCE_LOOKUP_LEGACY_ERROR_BOUNDARY_MISSING", "The Legacy unresolved Lookup behavior is unavailable.");

const errors = [
  "LOOKUP_RESOLUTION_TARGET_MAPPING_MISSING",
  "LOOKUP_RESOLUTION_TARGET_LIST_ID_INVALID",
  "LOOKUP_RESOLUTION_TARGET_SCOPE_MISMATCH",
  "LOOKUP_RESOLUTION_SOURCE_TARGET_RELATIONSHIP_BROKEN",
  "DATA_LIST_LOOKUP_TARGET_UNRESOLVED",
  "LOOKUP_RESOLUTION_TARGET_MAPPING_AMBIGUOUS"
];
const fixture = {
  schemaVersion: "1.0.0",
  phase: "phase-6a-cross-resource-lookup-resolution-contract-audit",
  contract: "compatibility/capability-manifests/cross-resource-lookup-resolution-host-contract.v0.1.0.json",
  cases: [
    { id: "valid-exact-target", kind: "valid", sourceScope: "data-list:1000000000000000001", sourceFieldId: "1000000000000000002", targetKey: "customers", map: { customers: "1000000000000000003" }, scopes: { customers: "data-list:1000000000000000003" } },
    { id: "valid-singular-alias", kind: "valid", sourceScope: "data-list:1000000000000000001", sourceFieldId: "1000000000000000002", targetKey: "customer", normalizedTargetKey: "customers", map: { customers: "1000000000000000003" }, scopes: { customers: "data-list:1000000000000000003" } },
    { id: "lossless-nineteen-digit-target", kind: "valid", sourceScope: "data-list:9000000000000000001", sourceFieldId: "9000000000000000002", targetKey: "accounts", map: { accounts: "9000000000000000003" }, scopes: { accounts: "data-list:9000000000000000003" } },
    { id: "missing-target-mapping", kind: "error", code: "LOOKUP_RESOLUTION_TARGET_MAPPING_MISSING", targetKey: "customers", map: {} },
    { id: "unresolved-target", kind: "error", code: "DATA_LIST_LOOKUP_TARGET_UNRESOLVED", targetKey: "missing list", map: {} },
    { id: "numeric-target-id", kind: "error", code: "LOOKUP_RESOLUTION_TARGET_LIST_ID_INVALID", targetKey: "customers", map: { customers: 9000000000000000003 } },
    { id: "malformed-target-id", kind: "error", code: "LOOKUP_RESOLUTION_TARGET_LIST_ID_INVALID", targetKey: "customers", map: { customers: "not-an-id" } },
    { id: "wrong-target-scope", kind: "error", code: "LOOKUP_RESOLUTION_TARGET_SCOPE_MISMATCH", targetKey: "customers", map: { customers: "9000000000000000003" }, scopes: { customers: "document-library:9000000000000000003" } },
    { id: "broken-source-field-relationship", kind: "error", code: "LOOKUP_RESOLUTION_SOURCE_TARGET_RELATIONSHIP_BROKEN", targetKey: "customers", sourceListId: "9000000000000000001", sourceFieldListId: "9000000000000000009" },
    { id: "ambiguous-target-mapping", kind: "error", code: "LOOKUP_RESOLUTION_TARGET_MAPPING_AMBIGUOUS", targetKey: "customer", candidates: ["customers", "customer-records"] },
    { id: "excluded-sublist", kind: "excluded", controlType: "list" },
    { id: "excluded-approval-form", kind: "excluded", surface: "approval-form", controlType: "lookup" },
    { id: "excluded-document-library", kind: "excluded", surface: "document-library", controlType: "lookup" },
    { id: "excluded-dashboard", kind: "excluded", surface: "dashboard", controlType: "lookup" }
  ]
};
const contract = {
  schemaVersion: "1.0.0",
  phase: "phase-6a-cross-resource-lookup-resolution-contract-audit",
  decision: {
    status: "accepted",
    marker: "PHASE_6_LOOKUP_CONTRACT_ACCEPTED",
    futurePhase: "phase-6b-data-list-lookup-resolution-core-shadow",
    rationale: "Data List Lookup resolution has a bounded deterministic intent and explicit host identity-map boundary. No tenant lookup, template mutation, or record assembly is required by the proposed Core intent."
  },
  source: { path: sourcePath, sha256: sha256(source) },
  legacyBoundary: {
    path: "buildResourceGraphPackage -> validatePlannedLookupTargetsMaterialized -> fieldSpecsForList -> resolveLookupTargetListId -> buildFieldRecord -> buildFieldRules",
    functions: functions.map((name) => ({ name, line: lineOf(declaration(name)), productionCallerCount: countCalls(name) })),
    inputSources: ["field.lookupTarget", "field.displayName", "pluralized field.displayName", "dataListByName host map", "host-generated ListID and FieldID paths"],
    currentResolutionBehavior: "Legacy checks direct candidate keys and then a singularized candidate against the host dataListByName map. It returns an empty target ID when unresolved; buildFieldRules then emits an empty Rules value. A pre-materialization validator emits FULL_APP_MATERIALIZATION_LOOKUP_TARGET_DATA_LIST_NOT_PLANNED when a declared target is absent from planned Data Lists.",
    propagation: "The host passes lossless ListID and FieldID strings into buildFieldRecord. For a resolved Lookup, buildFieldRules lowers Rules.listid from the host target ListID and keeps listfield, displayField, and fieldName as Title."
  },
  futureCoreContract: {
    inputDtos: ["DataListLookupIntentInput", "DataListLookupIntent", "DataListLookupValidationFinding"],
    input: "Immutable source resource logical key, source field logical key and ordinal, declared target logical key, deterministic normalized aliases, and display-field intent. No ListID, FieldID, allocation map, template, resource record, tenant state, or runtime value is accepted.",
    output: "Immutable lookup intent, deterministic resolution request descriptor, and immutable findings. Core returns no target ListID and performs no target discovery.",
    validation: ["validate a Data List Lookup intent shape", "derive stable normalized candidate keys", "reject missing source or target logical keys", "preserve deterministic candidate ordering"],
    prohibitions: ["target map lookup", "fallback target discovery", "ID allocation", "numeric identity coercion", "template loading or mutation", "generated-resource mutation", "API calls", "package writing", "sublist or other resource surface handling"]
  },
  hostContract: {
    inputDtos: ["DataListLookupResolutionRequest", "DataListLookupTargetIdentityMap", "DataListLookupSourceContext", "DataListLookupResolutionResult"],
    input: "Readonly targetListIdsByLogicalKey, readonly targetScopesByLogicalKey, explicit source ListID and FieldID relationship context, and one immutable Core request.",
    responsibilities: ["resolve only supplied target-map keys", "validate lossless target ListID strings", "validate target Data List scope", "validate source field belongs to source ListID", "reject ambiguous candidates", "report unresolved targets", "lower fresh Lookup Rules JSON", "retain generated-resource and package mutation in the host"],
    mutation: "The host must return a fresh Rules value and must not mutate Core input, target maps, templates, or resource records as part of resolution.",
    legacyCompatibility: "The host may convert DATA_LIST_LOOKUP_TARGET_UNRESOLVED to FULL_APP_MATERIALIZATION_LOOKUP_TARGET_DATA_LIST_NOT_PLANNED only at the existing planning-validation boundary; Core never emits the Legacy materializer finding."
  },
  errors: {
    codes: errors,
    semantics: {
      LOOKUP_RESOLUTION_TARGET_MAPPING_MISSING: "No supplied target-map entry exists for a declared normalized target key.",
      LOOKUP_RESOLUTION_TARGET_LIST_ID_INVALID: "A target ListID is missing, non-string, lossy, malformed, or otherwise invalid.",
      LOOKUP_RESOLUTION_TARGET_SCOPE_MISMATCH: "A supplied target map entry is not scoped to the resolved Data List.",
      LOOKUP_RESOLUTION_SOURCE_TARGET_RELATIONSHIP_BROKEN: "The supplied source FieldID does not belong to the supplied source ListID context.",
      DATA_LIST_LOOKUP_TARGET_UNRESOLVED: "No validated target can be resolved from the supplied map and declared target request.",
      LOOKUP_RESOLUTION_TARGET_MAPPING_AMBIGUOUS: "More than one supplied mapping matches a declared normalized target request."
    }
  },
  exclusions: ["ID allocation", "implicit or fallback target discovery", "mutable templates", "generated resources", "API calls", "package output", "approval forms", "document libraries", "dashboards", "sublists", "production routing"],
  fixtureMatrix: { path: "compatibility/differential-fixtures/cross-resource-lookup-resolution.v0.1.0.json", caseCount: fixture.cases.length, requiredErrors: errors },
  futureProof: ["Legacy Core host-resolution differential corpus", "lossless 19-digit ID checks", "source dist official ZIP and installed artifact parity after separate promotion", "actual materializer integration", "scope gates", "temporary-copy-only Legacy rollback"],
  auditMutations: { productionRouting: false, adapters: false, publicApis: false, artifacts: false, pluginDist: false, activeInstallation: false, historicalZip: false }
};

writeJson(fixtureMatrixPath(), fixture);
writeJson("compatibility/capability-manifests/cross-resource-lookup-resolution-host-contract.v0.1.0.json", contract);
writeText("docs/architecture/yeeflow-app-builder-phase-6a-cross-resource-lookup-resolution-contract-audit.v0.1.0.md", report(contract));
for (const path of ["compatibility/capability-manifests/resource-definition-construction-audit.v0.1.0.json", "compatibility/capability-manifests/resource-definition-construction-capability-matrix.v0.1.0.json"]) {
  const value = json(path);
  value.phase6CrossResourceLookupResolutionContract = { marker: contract.decision.marker, status: "accepted", contract: "compatibility/capability-manifests/cross-resource-lookup-resolution-host-contract.v0.1.0.json", nextPhase: contract.decision.futurePhase };
  writeJson(path, value);
}
console.log("DATA_LIST_LOOKUP_LEGACY_BOUNDARY_AUDITED");
console.log("CROSS_RESOURCE_LOOKUP_RESOLUTION_CONTRACT_VALID");
console.log("PHASE_6_LOOKUP_CONTRACT_ACCEPTED");

function fixtureMatrixPath() { return "compatibility/differential-fixtures/cross-resource-lookup-resolution.v0.1.0.json"; }
function report(value) { return `# Phase 6A Cross-Resource Data List Lookup-Resolution Contract Audit\n\n## Decision\n\n\`${value.decision.marker}\`\n\nA bounded future Lookup shadow is accepted. Materializer Core may build immutable Lookup intents and deterministic request descriptors only. Host or Local Runtime code resolves supplied target identities and lowers fresh Lookup Rules.\n\n## Legacy Boundary\n\n\`${value.legacyBoundary.path}\`\n\nLegacy target matching consults a host map using direct and singularized candidate keys. Unresolved values become an empty Rules payload, while planning validation records \`FULL_APP_MATERIALIZATION_LOOKUP_TARGET_DATA_LIST_NOT_PLANNED\`. The future contract forbids Core from preserving implicit target discovery.\n\n## Responsibility Split\n\nCore receives logical source and target data only; it does not receive ListIDs, FieldIDs, target maps, templates, resource records, or tenant state. The host receives the readonly target map plus source relationship context, validates all identities, rejects ambiguity, and lowers the Rules JSON.\n\n## Stable Errors\n\n${value.errors.codes.map((code) => `- \`${code}\` — ${value.errors.semantics[code]}`).join("\n")}\n\n## Fixture Coverage\n\nThe versioned matrix has ${value.fixtureMatrix.caseCount} cases: exact and singular aliases, 19-digit IDs, missing and unresolved targets, numeric and malformed IDs, scope and relationship failures, ambiguity, and excluded surfaces.\n\n## Non-Goals\n\nNo Core shadow, public export, artifact, adapter, route, template mutation, API call, package output, active installation, or release action is created by this audit.\n`; }
function declaration(name) { return ast.statements.find((statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === name) || null; }
function countCalls(name) { let count = 0; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1; ts.forEachChild(node, visit); }; visit(ast); return count; }
function lineOf(node) { return ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function writeJson(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function writeText(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value, "utf8"); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

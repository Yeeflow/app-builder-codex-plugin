#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const source = readFileSync(resolve(root, sourcePath), "utf8");
const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const buildFieldRecord = functionDeclaration("buildFieldRecord");
const buildResourceGraphPackage = functionDeclaration("buildResourceGraphPackage");
if (!buildFieldRecord || !buildResourceGraphPackage) throw new Error("DATA_LIST_SCALAR_RESOURCE_IDENTITY_ROUTING_AUDIT_ENTRYPOINT_MISSING");

const scalarBranch = findCall(buildFieldRecord, "coreProjectDataListScalarField");
const scalarLowering = findCall(buildFieldRecord, "buildDataListScalarFieldRecordFromProjection") || findCall(buildFieldRecord, "coreLowerDataListScalarResourceIdentityAtHost");
const callerCount = countCalls("buildFieldRecord");
const idPathCount = countIdBearingBuildFieldRecordCalls(buildResourceGraphPackage);
if (!scalarBranch || !scalarLowering || callerCount !== 1 || idPathCount !== 1) throw new Error("DATA_LIST_SCALAR_RESOURCE_IDENTITY_ROUTING_AUDIT_BOUNDARY_MISSING");

const contract = {
  schemaVersion: "1.0.0",
  phase: "phase-5aa-data-list-scalar-resource-definition-routing-readiness-audit",
  decision: {
    marker: "DATA_LIST_SCALAR_RESOURCE_IDENTITY_ROUTING_READINESS_ACCEPTED",
    status: "complete",
    rationale: "The scalar-only branch already receives the immutable Core scalar projection and lossless host-supplied ListID and FieldID values before Legacy-shaped record lowering. A future bridge can create an immutable intent and a one-request host allocation map without adding identity allocation, lookup resolution, template loading, package writing, or resource mutation to either distributed API.",
  },
  source: { path: sourcePath, sha256: sha256(source) },
  astEvidence: {
    buildFieldRecordLine: lineOf(buildFieldRecord),
    buildResourceGraphPackageLine: lineOf(buildResourceGraphPackage),
    buildFieldRecordProductionCallerCount: callerCount,
    idBearingCallerCount: idPathCount,
    scalarProjectionCall: "coreProjectDataListScalarField",
    currentLegacyLoweringCall: findCall(buildFieldRecord, "buildDataListScalarFieldRecordFromProjection") ? "buildDataListScalarFieldRecordFromProjection" : "coreLowerDataListScalarResourceIdentityAtHost",
  },
  exactRoutingBoundary: {
    path: "collectDataListFieldSpecs -> fieldSpecsForList -> buildFieldRecord",
    selectedBranch: "The existing shouldRouteDataListScalarFieldProjection branch after projectDataListScalarField returns a non-null projection and before buildDataListScalarFieldRecordFromProjection returns the final scalar record.",
    hostInputs: ["lossless ListID string", "lossless FieldID string", "field logical index", "data-list resource scope", "immutable scalar projection"],
    hostOwnershipAfterLowering: ["fieldRecordsByName insertion", "child resource assembly", "generated resource mutation", "package integration"],
  },
  identityAvailability: {
    listId: "The Data List loop calls stringId(ids[decoded.Childs[index].List.ListID]) before buildFieldRecord.",
    fieldId: "The same loop calls stringId(ids[decoded.Childs[index].Fields[fieldIndex].FieldID]) at the buildFieldRecord call site.",
    fieldLogicalKey: "fieldIndex is the stable scalar ordinal and field.fieldName remains in the immutable projection.",
    resourceScope: "A future adapter bridge must derive a deterministic Data List scope from the host list context and use it consistently for one FieldID request and allocation-map scope.",
    relationshipGuarantee: "The host bridge must reject missing, invalid, colliding, lossy, wrong-scope, or broken ListID FieldID relationships before lowering.",
  },
  includedScalarMatrix: ["Text or unrecognized scalar", "Datetime", "Decimal", "Bit", "approved select and checkbox scalar control variants"],
  excludedFamilies: ["lookup", "sublist", "identity user department", "file image binary", "unresolved lookup target", "template-dependent branch", "cross-resource branch"],
  requiredAdapters: {
    materializerCore: "One compatibility-adapter export for projectDataListScalarResourceDefinitionIntent.",
    localRuntime: "One compatibility-adapter export for lowerDataListScalarResourceIdentityAtHost.",
    prohibitions: ["No API call", "No ID generation", "No fallback ID", "No lookup resolution", "No template loading", "No package writing", "No cross-resource mutation"],
  },
  phase5ABRoutingProof: {
    sourceArchiveInstalledParity: true,
    scalarIntegrationMatrix: ["Text", "Datetime", "Decimal", "Bit", "approved scalar controls", "choices and defaults", "barcode error", "deferred-family scope exclusions"],
    identityErrors: ["DATA_LIST_IDENTITY_ALLOCATION_MISSING", "DATA_LIST_IDENTITY_ALLOCATION_INVALID", "DATA_LIST_IDENTITY_ALLOCATION_COLLISION", "DATA_LIST_IDENTITY_SCOPE_MISMATCH", "DATA_LIST_IDENTITY_RELATIONSHIP_BROKEN", "DATA_LIST_LOOKUP_TARGET_UNRESOLVED", "DATA_LIST_IDENTITY_LOSSY_INPUT"],
    losslessStringIds: ["19-digit ListID", "19-digit FieldID"],
    determinism: "Two Core-routed materializer runs must match after only documented Legacy random-ID normalization.",
    scopeGates: ["non-scalar fields never enter the route", "missing Local Runtime lowerer fails explicitly", "numeric identities fail before Core or host lowering"],
    rollback: "A temporary complete Plugin copy restores only the scalar resource-definition branch to buildDataListScalarFieldRecordFromProjection, retains earlier scalar-field and LayoutView routes, and proves the Legacy baseline.",
    regressionProtection: ["Phase 5D scalar field projection", "Phase 5Q default Type 0 LayoutView", "Phase 5V additional Type 0 LayoutView"],
  },
};

writeJson("compatibility/capability-manifests/data-list-scalar-resource-identity-routing-readiness.v0.1.0.json", contract);
const ledgerPath = "compatibility/capability-manifests/resource-definition-construction-audit.v0.1.0.json";
const matrixPath = "compatibility/capability-manifests/resource-definition-construction-capability-matrix.v0.1.0.json";
for (const path of [ledgerPath, matrixPath]) {
  const value = JSON.parse(readFileSync(resolve(root, path), "utf8"));
  value.scalarResourceIdentityRoutingReadiness = { decision: contract.decision.marker, status: contract.decision.status, contract: "compatibility/capability-manifests/data-list-scalar-resource-identity-routing-readiness.v0.1.0.json", boundary: contract.exactRoutingBoundary.path };
  writeJson(path, value);
}
console.log(contract.decision.marker);
console.log(`DATA_LIST_SCALAR_RESOURCE_IDENTITY_ROUTING_READINESS_AUDIT_WRITTEN callers=${callerCount}`);

function functionDeclaration(name) { return ast.statements.find((statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === name) || null; }
function findCall(node, name) { let found = false; const visit = (child) => { if (ts.isCallExpression(child) && ts.isIdentifier(child.expression) && child.expression.text === name) found = true; ts.forEachChild(child, visit); }; visit(node); return found; }
function countCalls(name) { let count = 0; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1; ts.forEachChild(node, visit); }; visit(ast); return count; }
function countIdBearingBuildFieldRecordCalls(node) { let count = 0; const visit = (child) => { if (ts.isCallExpression(child) && ts.isIdentifier(child.expression) && child.expression.text === "buildFieldRecord") { const argument = child.arguments[0]; const hasProperty = (name) => argument && ts.isObjectLiteralExpression(argument) && argument.properties.some((property) => (ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property)) && ts.isIdentifier(property.name) && property.name.text === name); if (hasProperty("listId") && hasProperty("fieldId")) count += 1; } ts.forEachChild(child, visit); }; visit(node); return count; }
function lineOf(node) { return ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1; }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function writeJson(relativePath, value) { const path = resolve(root, relativePath); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }

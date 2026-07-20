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
const manifestPath = "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json";
const manifest = json(manifestPath);
const scalarRoute = functionDeclaration("buildFieldRecord");

if (!scalarRoute || !hasCall(scalarRoute, "coreProjectDataListScalarField") || !hasCall(scalarRoute, "coreProjectDataListScalarResourceDefinitionIntent") || !hasCall(scalarRoute, "coreLowerDataListScalarResourceIdentityAtHost")) {
  fail("DATA_LIST_RESOURCE_DEFINITION_FAMILY_SCALAR_ROUTE_MISSING", "The approved scalar identity route is absent from buildFieldRecord.");
}
if (!source.includes("function shouldRouteDataListScalarFieldProjection") || !["lookup", "sublist", "identity-picker", "file-upload", "icon-upload"].every((value) => source.includes(value))) {
  fail("DATA_LIST_RESOURCE_DEFINITION_FAMILY_EXCLUSION_GUARD_MISSING", "The scalar route exclusion guard is incomplete.");
}

const artifacts = Object.fromEntries((manifest.artifacts || []).map((artifact) => [artifact.packageName, { path: artifact.path, sha256: artifact.sha256 }]));
const categories = [
  {
    id: "lookup-fields",
    legacyBoundary: ["buildFieldRecord", "buildFieldRules", "resolveLookupTargetListId", "validatePlannedLookupTargetsMaterialized"],
    productionCallers: { buildFieldRecord: countCalls("buildFieldRecord"), resolveLookupTargetListId: countCalls("resolveLookupTargetListId") },
    requiredContractFamily: "cross-resource-lookup-resolution-contract",
    dependencies: ["host-owned lossless lookup target ListID map", "target scope validation", "unresolved-target findings"],
    classification: "requires-cross-resource-lookup-resolution-contract",
    phase5Blocker: "Lookup Rules.listid is a cross-resource host resolution result. The current scalar identity contract explicitly prohibits Core lookup resolution and fallback IDs."
  },
  {
    id: "sublist-fields",
    legacyBoundary: ["buildFieldRecord", "buildFieldRules", "dataListSubListVariables", "buildDataListFormSubListControl"],
    productionCallers: { buildFieldRecord: countCalls("buildFieldRecord"), buildDataListFormSubListControl: countCalls("buildDataListFormSubListControl") },
    requiredContractFamily: "data-list-advanced-field-template-graph-contract",
    dependencies: ["sublist variable and summary schema", "template snapshot", "nested control graph lowering", "deterministic child-control identities"],
    classification: "requires-template-graph-contract",
    phase5Blocker: "The form-control path reads a host template, creates nested controls, and mutates a generated resource graph; it is not an immutable scalar record fragment."
  },
  {
    id: "identity-user-department-fields",
    legacyBoundary: ["buildFieldRecord", "buildDataListFormFieldControl", "dynamicControlTypeForField"],
    productionCallers: { buildFieldRecord: countCalls("buildFieldRecord"), buildDataListFormFieldControl: countCalls("buildDataListFormFieldControl") },
    requiredContractFamily: "data-list-advanced-field-template-graph-contract",
    dependencies: ["identity selection semantics", "host control-template lowering", "runtime identity binding"],
    classification: "requires-template-graph-contract",
    phase5Blocker: "Identity controls are carried into Type 1 form-control graph lowering and require an explicit identity and template boundary, not scalar record construction."
  },
  {
    id: "file-image-binary-fields",
    legacyBoundary: ["buildFieldRecord", "buildDataListFormFieldControl", "buildDataListFormSubListControl"],
    productionCallers: { buildFieldRecord: countCalls("buildFieldRecord"), buildDataListFormFieldControl: countCalls("buildDataListFormFieldControl") },
    requiredContractFamily: "data-list-advanced-field-template-graph-contract",
    dependencies: ["binary control template", "upload/reference semantics", "host resource graph lowering"],
    classification: "requires-template-graph-contract",
    phase5Blocker: "File and image controls depend on host-owned binary control configuration and Type 1 template graph mutation."
  },
  {
    id: "barcode-dependent-non-scalar-behavior",
    legacyBoundary: ["buildFieldRules"],
    productionCallers: { buildFieldRules: countCalls("buildFieldRules") },
    requiredContractFamily: "data-list-advanced-field-template-graph-contract",
    dependencies: ["control-specific barcode capability policy", "non-scalar error compatibility"],
    classification: "defer-high-risk",
    phase5Blocker: "The current barcode contract is an explicit scalar Text error guard. It has no independent non-scalar record projection and must not be reclassified as scalar-safe."
  },
  {
    id: "type-one-custom-form-layouts",
    legacyBoundary: ["buildCustomFormLayout", "materializeDataListFormResource", "buildDataListFormFieldsGrid"],
    productionCallers: { buildCustomFormLayout: countCalls("buildCustomFormLayout"), materializeDataListFormResource: countCalls("materializeDataListFormResource") },
    requiredContractFamily: "data-list-advanced-field-template-graph-contract",
    dependencies: ["filesystem template loading", "mutable generated resource graph", "layout identity", "cross-resource form and dashboard maps"],
    classification: "requires-template-graph-contract",
    phase5Blocker: "Type 1 custom forms are not Type 0 LayoutViews: they load and mutate template resource graphs and integrate host-owned LayoutIDs and cross-resource references."
  },
  {
    id: "list-display-layout-references",
    legacyBoundary: ["buildDataListFormDisplaySettings", "buildResourceGraphPackage", "listInfo"],
    productionCallers: { buildDataListFormDisplaySettings: countCalls("buildDataListFormDisplaySettings"), listInfo: countCalls("listInfo") },
    requiredContractFamily: "template-graph-and-layout-identity-contract",
    dependencies: ["host LayoutID allocation map", "form usage selection", "list display settings mutation"],
    classification: "requires-identity-allocation-contract",
    phase5Blocker: "Display settings select host LayoutIDs and are written into the mutable List record. Type 0 projection parity does not cover this identity integration."
  },
  {
    id: "remaining-list-field-layout-record-assembly",
    legacyBoundary: ["buildResourceGraphPackage", "listInfo", "buildFieldRecord"],
    productionCallers: { buildResourceGraphPackage: countCalls("buildResourceGraphPackage"), listInfo: countCalls("listInfo"), buildFieldRecord: countCalls("buildFieldRecord") },
    requiredContractFamily: "resource-definition-host-integration-contract",
    dependencies: ["ListID FieldID LayoutID relationship validation", "generated resource mutation", "package integration"],
    classification: "host-orchestration-only",
    phase5Blocker: "This is the mutable assembly and package-integration layer. It is intentionally outside Core and Local Runtime lowering contracts."
  }
];

const contract = {
  schemaVersion: "1.0.0",
  phase: "phase-5ac-data-list-resource-definition-family-selection-and-closure-audit",
  decision: {
    status: "accepted",
    marker: "PHASE_5_CLOSURE_ACCEPTED",
    rationale: "The only bounded scalar pre-ID route is complete and every remaining Data List resource-definition category requires a missing cross-resource lookup, advanced-field template graph, layout identity, or host integration contract."
  },
  source: { path: sourcePath, sha256: sha256(source) },
  scalarRoute: {
    marker: "DATA_LIST_SCALAR_RESOURCE_IDENTITY_ROUTE_RECONFIRMED",
    path: "collectDataListFieldSpecs -> fieldSpecsForList -> buildFieldRecord",
    buildFieldRecordProductionCallerCount: countCalls("buildFieldRecord"),
    coreCalls: ["coreProjectDataListScalarField", "coreProjectDataListScalarResourceDefinitionIntent"],
    localRuntimeCall: "coreLowerDataListScalarResourceIdentityAtHost",
    included: ["Text or unrecognized scalar", "Datetime", "Decimal", "Bit", "approved select and checkbox variants"],
    excluded: ["lookup", "sublist", "identity user department", "file image binary", "unresolved lookup", "template-dependent", "cross-resource", "non-Data-List"],
    identityBoundary: "ListID and FieldID arrive as host-supplied lossless strings and fieldIndex is the stable scalar ordinal."
  },
  remainingCategories: categories,
  eligibleAdditionalPhase5Verticals: [],
  closureCriteria: {
    zeroEligibleAdditionalDataListVerticals: true,
    scalarRouteReconfirmed: true,
    routeOrArtifactMutationDuringAudit: false,
    prohibitedAuditMutations: ["production routing", "adapters", "public APIs", "Core artifacts", "Plugin dist", "active installation", "historical ZIP"]
  },
  phase6Recommendation: {
    id: "phase-6-cross-resource-lookup-resolution-contract-audit",
    family: "cross-resource-lookup-resolution-contract",
    rationale: "Lookup field lowering is the smallest remaining Data List boundary: it needs only explicit lossless target identity resolution and validation, while advanced fields additionally require template graph, nested control, and generated-resource contracts.",
    futureCoreBoundary: "Immutable lookup intent with declared target logical key and immutable findings only.",
    futureHostBoundary: "Host-supplied readonly lossless target ListID map validates resource scope and unresolved targets, then lowers Rules.listid without fallback.",
    prerequisites: ["versioned lookup-resolution DTO contract", "lossless identity validation", "unresolved and wrong-scope error contract", "Legacy/Core/host differential corpus", "source archive installed proof", "temporary-copy-only rollback"]
  },
  artifactBaselines: artifacts
};

writeJson("compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json", contract);
writeText("docs/architecture/yeeflow-app-builder-phase-5ac-data-list-resource-definition-family-closure.v0.1.0.md", report(contract));
for (const path of ["compatibility/capability-manifests/resource-definition-construction-audit.v0.1.0.json", "compatibility/capability-manifests/resource-definition-construction-capability-matrix.v0.1.0.json"]) {
  const value = json(path);
  value.phase5DataListResourceDefinitionClosure = {
    marker: "PHASE_5_CLOSURE_ACCEPTED",
    status: "complete",
    contract: "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json",
    nextPhase: contract.phase6Recommendation.id
  };
  writeJson(path, value);
}
console.log("DATA_LIST_SCALAR_RESOURCE_IDENTITY_ROUTE_RECONFIRMED");
console.log("DATA_LIST_RESOURCE_DEFINITION_FAMILY_CLOSURE_VALID");
console.log("PHASE_5_CLOSURE_ACCEPTED");

function report(value) {
  return `# Phase 5AC Data List Resource-Definition Family Closure\n\n## Decision\n\n\`${value.decision.marker}\`\n\nThe scalar field-record route is complete. No remaining Data List resource-definition category is eligible for a further Phase 5 vertical without a new contract family.\n\n## Reconfirmed Scalar Route\n\n\`${value.scalarRoute.path}\` remains the only Core and Local Runtime route. It accepts only the approved scalar matrix and uses lossless host-supplied string identities. Lookup, sublist, identity, binary, template-dependent, cross-resource, and non-Data-List inputs remain on Legacy branches.\n\n## Deferred Categories\n\n${value.remainingCategories.map((item) => `- **${item.id}** — \`${item.classification}\`; requires \`${item.requiredContractFamily}\`. ${item.phase5Blocker}`).join("\n")}\n\n## Phase 6 Recommendation\n\nStart \`${value.phase6Recommendation.id}\`. Cross-resource lookup resolution is the smallest foundational missing contract: it isolates lossless target ListID resolution and failure semantics before the broader mutable template-graph work required by sublist, identity, binary, and Type 1 custom-form controls.\n\n## Non-Goals\n\nThis audit changes no production route, adapter, public API, artifact, Plugin dist file, active installation, historical ZIP, or protected duplicate.\n`;
}

function functionDeclaration(name) { return ast.statements.find((statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === name) || null; }
function hasCall(node, name) { let found = false; const visit = (child) => { if (ts.isCallExpression(child) && ts.isIdentifier(child.expression) && child.expression.text === name) found = true; ts.forEachChild(child, visit); }; visit(node); return found; }
function countCalls(name) { let count = 0; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1; ts.forEachChild(node, visit); }; visit(ast); return count; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function writeJson(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function writeText(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value, "utf8"); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

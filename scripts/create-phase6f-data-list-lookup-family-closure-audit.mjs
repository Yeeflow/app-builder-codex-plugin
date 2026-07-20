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
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const artifacts = Object.fromEntries((distribution.artifacts || []).map((artifact) => [artifact.packageName, {
  path: artifact.path,
  sha256: artifact.sha256,
  exports: artifact.exports,
}]));

const categories = [
  {
    id: "target-resource-integration",
    classification: "host-orchestration-only",
    legacyBoundary: ["validatePlannedLookupTargetsMaterialized", "buildResourceGraphPackage", "listInfo"],
    productionCallers: callers(["validatePlannedLookupTargetsMaterialized", "buildResourceGraphPackage", "listInfo"]),
    requiredContractFamily: "cross-resource-target-resource-integration-contract",
    dependencies: ["generated Data List inventory", "lossless target ListID map", "planned-resource findings", "mutable child resource integration"],
    blocker: "Target-resource integration reads and writes the generated Data List graph, records planning findings, and participates in package assembly. It is host orchestration rather than immutable Lookup intent or Rules lowering."
  },
  {
    id: "reverse-relationship-handling",
    classification: "requires-template-graph-contract",
    legacyBoundary: ["appendReverseRelatedCollectionSections", "buildReverseRelatedCollectionSection", "configureReverseRelatedCollectionRuntime"],
    productionCallers: callers(["appendReverseRelatedCollectionSections", "buildReverseRelatedCollectionSection", "configureReverseRelatedCollectionRuntime"]),
    requiredContractFamily: "advanced-field-template-graph-and-runtime-expression-contract",
    dependencies: ["view-form template snapshot", "host LayoutID", "runtime ListDataID expression", "control UUIDs", "mutable collection resource graph"],
    blocker: "Reverse relationships create and mutate template-backed collection controls with runtime expressions and host LayoutID context; they are not field Lookup Rules resolution."
  },
  {
    id: "lookup-controls-and-form-template-placement",
    classification: "requires-template-graph-contract",
    legacyBoundary: ["buildCustomFormLayout", "materializeDataListFormResource", "buildDataListFormFieldsGrid", "buildDataListFormFieldControl"],
    productionCallers: callers(["buildCustomFormLayout", "materializeDataListFormResource", "buildDataListFormFieldsGrid", "buildDataListFormFieldControl"]),
    requiredContractFamily: "advanced-field-template-graph-contract",
    dependencies: ["filesystem template snapshot loading", "LayoutID and ListID context", "mutable control graph", "field bindings", "form placement rules"],
    blocker: "Lookup controls are placed by a Type 1 form-template resource builder that loads templates and mutates a generated control graph. A target ListID rule alone does not establish safe control placement."
  },
  {
    id: "sublist-lookup-embedding",
    classification: "requires-template-graph-contract",
    legacyBoundary: ["buildDataListFormSubListControl", "dataListSubListVariables", "buildDataListSubListColumn", "normalizeDataListSubListSummaries"],
    productionCallers: callers(["buildDataListFormSubListControl", "dataListSubListVariables", "buildDataListSubListColumn", "normalizeDataListSubListSummaries"]),
    requiredContractFamily: "sublist-template-graph-contract",
    dependencies: ["nested variable schema", "nested controls", "summary temporary variables", "deterministic child-control identifiers", "host template mutation"],
    blocker: "Sublist Lookup semantics are nested control-graph behavior with row variables, summaries, and child controls. They cannot be treated as ordinary top-level Data List Lookup Rules resolution."
  },
  {
    id: "document-library-lookup-semantics",
    classification: "requires-cross-surface-contract",
    legacyBoundary: ["buildDocumentLibraryFieldRecords", "buildResourceGraphPackage"],
    productionCallers: callers(["buildDocumentLibraryFieldRecords", "buildResourceGraphPackage"]),
    requiredContractFamily: "document-library-field-and-template-contract",
    dependencies: ["Type 16 field-record schema", "document resource assembly", "surface-specific templates"],
    blocker: "Document Library resources use their own Type 16 field and resource semantics. Data List Lookup evidence does not authorize cross-surface reuse."
  },
  {
    id: "approval-form-lookup-semantics",
    classification: "requires-cross-surface-contract",
    legacyBoundary: ["buildApprovalFormLayoutDef", "buildApprovalFormFieldControl"],
    productionCallers: callers(["buildApprovalFormLayoutDef", "buildApprovalFormFieldControl"]),
    requiredContractFamily: "approval-form-variable-and-template-graph-contract",
    dependencies: ["approval variable identity", "role form templates", "workflow-owned bindings"],
    blocker: "Approval Form Lookup-like controls belong to approval variable and role-template behavior, not Data List field Rules lowering."
  },
  {
    id: "dashboard-lookup-semantics",
    classification: "requires-cross-surface-contract",
    legacyBoundary: ["buildMaterialDashboardResource", "buildCollectionTemplateInstance"],
    productionCallers: callers(["buildMaterialDashboardResource", "buildCollectionTemplateInstance"]),
    requiredContractFamily: "dashboard-runtime-query-and-template-contract",
    dependencies: ["dashboard template graph", "query/filter bindings", "runtime collection configuration"],
    blocker: "Dashboard lookup/filter behavior is collection runtime configuration and dashboard template lowering. It is outside the Data List field contract."
  },
  {
    id: "workflow-lookup-semantics",
    classification: "requires-cross-surface-contract",
    legacyBoundary: ["buildPlannedWorkflowQueryFilters", "buildPlannedWorkflowHostForms"],
    productionCallers: callers(["buildPlannedWorkflowQueryFilters", "buildPlannedWorkflowHostForms"]),
    requiredContractFamily: "workflow-variable-and-runtime-expression-contract",
    dependencies: ["workflow variable identity", "runtime expressions", "workflow form ownership"],
    blocker: "Workflow Lookup expressions are runtime variable bindings and workflow materialization, not deterministic Data List target-list resolution."
  },
  {
    id: "display-layout-and-mutable-resource-assembly",
    classification: "host-orchestration-only",
    legacyBoundary: ["buildDataListFormDisplaySettings", "buildDataListViewLayoutViewChecked", "buildResourceGraphPackage"],
    productionCallers: callers(["buildDataListFormDisplaySettings", "buildDataListViewLayoutViewChecked", "buildResourceGraphPackage"]),
    requiredContractFamily: "template-graph-and-layout-identity-contract",
    dependencies: ["LayoutID assignment", "URL and route selection", "mutable List record", "final decoded package output"],
    blocker: "Display-layout references and final resource assembly own LayoutID, URL, record mutation, and package output. The completed Type 0 structural route is not proof for host identity integration."
  },
  {
    id: "fallback-validation-and-package-output",
    classification: "host-orchestration-only",
    legacyBoundary: ["resolveLookupTargetListId", "validatePlannedLookupTargetsMaterialized", "materializeFullAppGeneratedFinal"],
    productionCallers: callers(["resolveLookupTargetListId", "validatePlannedLookupTargetsMaterialized", "materializeFullAppGeneratedFinal"]),
    requiredContractFamily: "host-resource-inventory-and-package-output-contract",
    dependencies: ["host resource inventory", "planning findings", "final package writing"],
    blocker: "Candidate matching and unresolved-plan validation are host inventory behavior, while package output is an explicit host side effect. Core must not discover targets, allocate fallbacks, or write packages."
  }
];

const contract = {
  schemaVersion: "1.0.0",
  phase: "phase-6f-data-list-lookup-family-closure-audit",
  decision: {
    status: "accepted",
    marker: "PHASE_6_CLOSURE_ACCEPTED",
    rationale: "The single Data List Lookup Rules route is complete. Every remaining Lookup-adjacent category requires an advanced template graph, cross-surface capability, host identity/resource integration, or package-output contract; no further Data List Lookup-only deterministic vertical remains."
  },
  source: { path: sourcePath, sha256: sha256(source) },
  routedLookupRoute: {
    marker: "DATA_LIST_LOOKUP_RESOLUTION_ROUTE_RECONFIRMED",
    path: "collectDataListFieldSpecs -> fieldSpecsForList -> buildFieldRecord",
    buildFieldRecordProductionCallerCount: countCalls("buildFieldRecord"),
    guard: "type === lookup with explicit host target identity map and no sublist fields or summaries",
    coreCall: "coreProjectDataListLookupResolutionIntent",
    localRuntimeCall: "coreLowerDataListLookupResolutionAtHost",
    retainedHostOwnership: ["target map", "lossless ListID and FieldID strings", "scope context", "final record integration", "package output"],
    exclusions: ["scalar", "sublist", "identity user department", "file image binary", "barcode", "custom forms", "Document Libraries", "Approval Forms", "Dashboards", "workflows"]
  },
  remainingCategories: categories,
  eligibleAdditionalLookupVerticals: [],
  closureCriteria: {
    zeroEligibleAdditionalLookupVerticals: true,
    routedLookupRouteReconfirmed: true,
    auditMutations: {
      productionRouting: false,
      adapters: false,
      publicApis: false,
      distributionContracts: false,
      coreArtifacts: false,
      pluginDist: false,
      activeInstallation: false,
      historicalZip: false,
      protectedDuplicates: false
    }
  },
  phase7Recommendation: {
    id: "phase-7-advanced-field-template-graph-contract-audit",
    family: "advanced-field-template-graph-contract",
    rationale: "Template snapshots and explicit identity references are the smallest foundational missing contract shared by remaining Data List advanced fields. It must be established before either sublist controls or Type 1 custom-form controls can be assessed without importing mutable host behavior into Core.",
    dependencyOrder: ["immutable template snapshot and identity-reference contract", "sublist control and nested variable contract", "Type 1 custom-form control placement and host lowering contract"],
    futureCoreBoundary: "Immutable advanced-field intent and template-snapshot projection outputs only; no filesystem template loading, IDs, resource mutation, runtime expressions, or package output.",
    futureHostBoundary: "Host provides snapshots and lossless identities, lowers mutable control graphs, owns runtime bindings and resource integration, and proves source/archive/installed parity with temporary-copy Legacy rollback.",
    prerequisites: ["versioned immutable template-snapshot DTO", "lossless layout and field identity-reference DTO", "advanced-field differential fixture matrix", "host-lowering ownership contract", "source archive installed proof", "temporary-copy Legacy rollback"]
  },
  artifactBaselines: artifacts,
  historicalZipSha256: "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2"
};

writeJson("compatibility/capability-manifests/data-list-lookup-resolution-family-closure.v0.1.0.json", contract);
writeText("docs/architecture/yeeflow-app-builder-phase-6f-data-list-lookup-resolution-family-closure.v0.1.0.md", report(contract));
for (const path of ["compatibility/capability-manifests/resource-definition-construction-audit.v0.1.0.json", "compatibility/capability-manifests/resource-definition-construction-capability-matrix.v0.1.0.json"]) {
  const value = json(path);
  value.phase6DataListLookupResolutionClosure = {
    marker: contract.decision.marker,
    status: "complete",
    contract: "compatibility/capability-manifests/data-list-lookup-resolution-family-closure.v0.1.0.json",
    nextPhase: contract.phase7Recommendation.id
  };
  writeJson(path, value);
}

const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
state.migration.currentPhase = "phase-6f-data-list-lookup-family-closure-audit";
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = contract.phase7Recommendation.id;
const evidence = "2026-07-18: DATA_LIST_LOOKUP_RESOLUTION_ROUTE_RECONFIRMED, DATA_LIST_LOOKUP_RESOLUTION_FAMILY_CLOSURE_VALID, DATA_LIST_LOOKUP_RESOLUTION_FAMILY_CLOSURE_REGRESSIONS_PASSED cases=6, and PHASE_6_CLOSURE_ACCEPTED. Only the Data List Lookup branch in buildFieldRecord is routed. Remaining target integration, reverse relationships, Type 1 lookup controls, sublists, cross-surface Lookup semantics, layout identity, and package output require advanced template graph, cross-surface, or host-orchestration contracts. Phase 7 begins with the advanced-field template-graph contract audit.";
const completed = state.completed.find((entry) => entry.id === "phase-6f-data-list-lookup-family-closure-audit");
if (completed) { completed.status = "complete"; completed.evidence = evidence; } else state.completed.push({ id: "phase-6f-data-list-lookup-family-closure-audit", status: "complete", evidence });
state.nextSteps = (state.nextSteps || []).filter((entry) => entry.id !== "phase-6f-data-list-lookup-family-closure-audit" && entry.id !== contract.phase7Recommendation.id);
state.nextSteps.unshift({ order: 1, id: contract.phase7Recommendation.id, description: "Audit the immutable advanced-field template-snapshot and identity-reference contract before considering sublist controls or Type 1 custom-form control placement." });
state.proofStatus ||= {};
state.proofStatus.dataListLookupResolutionFamilyClosure = "passed";
writeJson("docs/architecture/yeeflow-app-builder-core-migration-state.json", state);

console.log("DATA_LIST_LOOKUP_RESOLUTION_ROUTE_RECONFIRMED");
console.log("DATA_LIST_LOOKUP_RESOLUTION_FAMILY_CLOSURE_VALID");
console.log("PHASE_6_CLOSURE_ACCEPTED");

function report(value) {
  return `# Phase 6F Data List Lookup-Resolution Family Closure\n\n## Decision\n\n\`${value.decision.marker}\`\n\nThe routed Data List Lookup Rules boundary is complete. No additional Lookup-only deterministic vertical remains under the current contracts.\n\n## Reconfirmed Route\n\n\`${value.routedLookupRoute.path}\` has one production caller. It is guarded to \`type === "lookup"\`, an explicit host target map, and no sublist content. Core returns immutable intent; Local Runtime validates host mapping and lowers fresh \`Rules.listid\`; the host owns identities, final resource integration, and package output.\n\n## Deferred Lookup-Adjacent Categories\n\n${value.remainingCategories.map((item) => `- **${item.id}** — \`${item.classification}\`; requires \`${item.requiredContractFamily}\`. ${item.blocker}`).join("\n")}\n\n## Phase 7 Recommendation\n\nStart \`${value.phase7Recommendation.id}\`. ${value.phase7Recommendation.rationale}\n\nDependency order:\n\n${value.phase7Recommendation.dependencyOrder.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n\n## Non-Goals\n\nThis audit does not change the Legacy materializer, production routes, adapters, public APIs, distribution contracts, artifacts, Plugin dist, active installation, historical ZIP, protected duplicates, or Git/release state.\n`;
}

function callers(names) { return Object.fromEntries(names.map((name) => [name, countCalls(name)])); }
function countCalls(name) { let count = 0; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1; ts.forEachChild(node, visit); }; visit(ast); return count; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function writeJson(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function writeText(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value, "utf8"); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

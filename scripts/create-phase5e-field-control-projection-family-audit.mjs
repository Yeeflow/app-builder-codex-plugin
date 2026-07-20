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
const functionPositions = topLevelFunctions(ast);
const sourceSha256 = sha256(source);
const candidateSpecs = [
  {
    id: "data-list-lookup-field-projection",
    surface: "data-list",
    entryPoints: ["buildFieldRecord", "buildDataListFormFieldControl"],
    dependencies: ["normalizeFieldType", "controlTypeForFieldType", "buildFieldRules", "resolveLookupTargetListId", "buildDataListFormFieldControl"],
    hostEffects: ["lookup-target-resolution", "ListID-and-FieldID-assembly", "generated-resource-control-mutation"],
    classification: "requires-resource-definition-contract",
    reason: "Lookup projection requires a resolved target ListID before the record rule and form control can be correct. That identity is host-owned and cross-resource.",
    requiredContract: "A resource-definition contract for immutable lookup intent, symbolic target reference, and an explicit host identity-resolution result.",
    fixture: "A two-list fixture with symbolic target references, resolved ListIDs, decoded field rules, and form-control binding assertions.",
    rollback: "Restore the lookup lowering call in a temporary complete Plugin copy while retaining all other routes.",
  },
  {
    id: "data-list-sublist-field-projection",
    surface: "data-list",
    entryPoints: ["buildFieldRecord", "buildDataListFormSubListControl"],
    dependencies: ["buildFieldRules", "dataListSubListVariables", "buildDataListSubListColumn", "normalizeDataListSubListSummaries", "deterministicUuid", "fs.readFileSync"],
    hostEffects: ["sublist-row-schema-assembly", "template-file-read", "control-ID-generation", "generated-resource-control-mutation"],
    classification: "requires-resource-definition-contract",
    reason: "Sublist projection combines row schemas, runtime list variables, template loading, generated column IDs, and mutable control construction.",
    requiredContract: "A resource-definition contract separating immutable sublist schema projection from host template loading, ID allocation, and control lowering.",
    fixture: "A sublist matrix covering rows, editable flags, summaries, generated columns, template identity, and decoded resource shape.",
    rollback: "Restore the sublist lowering boundary in a temporary complete Plugin copy.",
  },
  {
    id: "data-list-identity-user-department-projection",
    surface: "data-list",
    entryPoints: ["buildFieldRecord", "buildDataListFormFieldControl"],
    dependencies: ["normalizeFieldType", "controlTypeForFieldType", "dynamicControlTypeForField", "form-control-type-authority.mjs"],
    hostEffects: ["identity-reference-semantics", "FieldID-attachment", "generated-resource-control-mutation"],
    classification: "requires-resource-definition-contract",
    reason: "Identity controls require a field identity and platform-specific user or department semantics before a mutable form control can be lowered.",
    requiredContract: "A canonical identity-reference contract plus a resource-definition lowering boundary.",
    fixture: "A user and department field matrix with symbolic identities, FieldID attachment, and form-control binding assertions.",
    rollback: "Restore only the identity control lowering call in a temporary complete Plugin copy.",
  },
  {
    id: "data-list-file-image-binary-control-projection",
    surface: "data-list",
    entryPoints: ["buildFieldRecord", "buildDataListFormFieldControl"],
    dependencies: ["controlTypeForFieldType", "dynamicControlTypeForField", "data-list-form templates"],
    hostEffects: ["binary-control-platform-semantics", "FieldID-attachment", "template-resource-mutation"],
    classification: "requires-resource-definition-contract",
    reason: "File and image controls require platform binary-control contracts and mutate generated form-template controls after FieldID allocation.",
    requiredContract: "A binary field-definition contract and a host control-lowering adapter.",
    fixture: "A file and image control matrix with decoded template-control attributes and FieldID binding assertions.",
    rollback: "Restore only binary-control lowering in a temporary complete Plugin copy.",
  },
  {
    id: "document-library-default-and-custom-fields",
    surface: "document-library",
    entryPoints: ["buildDocumentLibraryFieldRecords"],
    dependencies: ["DOCUMENT_LIBRARY_DEFAULT_FIELDS", "stringId", "clone"],
    hostEffects: ["ListID-and-FieldID-assembly", "document-library-resource-definition"],
    classification: "requires-resource-definition-contract",
    reason: "Document Library defaults are emitted as resource records with allocated IDs and platform-specific default-field policy; custom-field projection shares that record boundary.",
    requiredContract: "A document-library resource-definition contract with immutable field intent and host-owned ID lowering.",
    fixture: "A default and custom document-library field matrix with exact decoded resource records and ID provenance.",
    rollback: "Restore document-library record lowering in a temporary complete Plugin copy.",
  },
  {
    id: "approval-form-variables",
    surface: "approval-form",
    entryPoints: ["buildApprovalVariables", "addApprovalWorkflowActionVariables"],
    dependencies: ["approvalVariableType", "approvalListRefFieldType", "uniqueApprovalFieldSpecs", "deterministicUuid", "workflow action shapes"],
    hostEffects: ["workflow-variable-identity", "deterministic-ID-generation", "cross-workflow-shape-propagation"],
    classification: "requires-workflow-or-form-contract",
    reason: "Approval variables merge submission and task fields with workflow action results, list references, and generated temp-variable identities.",
    requiredContract: "A workflow/form variable contract that distinguishes immutable variable intent from workflow identity allocation and action-shape propagation.",
    fixture: "A submission, task, sublist, and workflow-action variable matrix with exact listref and temp-variable assertions.",
    rollback: "Restore approval variable lowering before workflow augmentation in a temporary complete Plugin copy.",
  },
  {
    id: "approval-form-controls",
    surface: "approval-form",
    entryPoints: ["buildApprovalFormFieldsGrid", "buildApprovalFormFieldControl", "materializeApprovalFieldControls"],
    dependencies: ["resolveSchemaAuthoritativeFormControlType", "parsePlannedDynamicDisplayRules", "inferChoiceValues", "deterministicUuid", "template resource mutation"],
    hostEffects: ["template-file-read", "control-ID-generation", "dynamic-runtime-expression-binding", "generated-resource-control-mutation"],
    classification: "requires-workflow-or-form-contract",
    reason: "Approval controls are synthesized into mutable template grids with generated IDs, dynamic display expressions, and task or submission semantics.",
    requiredContract: "A form projection contract plus a host template-lowering adapter and workflow expression contract.",
    fixture: "A submission and task control matrix with choices, dynamic display rules, read-only state, grid layout, and decoded template assertions.",
    rollback: "Restore approval control lowering in a temporary complete Plugin copy.",
  },
  {
    id: "dashboard-filter-control-projection",
    surface: "dashboard",
    entryPoints: ["normalizeDashboardFilters", "materializeDashboardFilters", "buildDashboardSelectFilter"],
    dependencies: ["findFirstByIdentity", "buildDashboardSelectFilter", "runtime collection bindings"],
    hostEffects: ["template-resource-mutation", "filter-ID-allocation", "runtime-expression-binding"],
    classification: "host-orchestration-only",
    reason: "The current normalization function intentionally returns no filters. The active lowering function mutates dashboard templates and binds runtime collection behavior, so there is no behaviorally meaningful immutable projection slice today.",
    requiredContract: "A future dashboard runtime-binding contract after an export-proven empty-value bypass contract exists.",
    fixture: "A runtime-backed dashboard filter fixture with template, collection, empty-value, and browser/runtime assertions.",
    rollback: "Restore dashboard filter control insertion in a temporary complete Plugin copy.",
  },
];
const boundaryDetails = {
  "data-list-lookup-field-projection": {
    transitiveDependencies: ["dataListByName", "platform lookup rule schema", "form control binding schema"],
    resourceIdDependencies: ["lookupTargetListId", "ListID", "FieldID"],
    runtimeExpressionDependencies: [],
  },
  "data-list-sublist-field-projection": {
    transitiveDependencies: ["sublist template resource", "list variable schema", "summary binding schema"],
    resourceIdDependencies: ["ListID", "FieldID", "generated sublist control ID", "generated column IDs"],
    runtimeExpressionDependencies: ["__list_ and __temp_ summary bindings"],
  },
  "data-list-identity-user-department-projection": {
    transitiveDependencies: ["identity control authority", "platform identity binding schema"],
    resourceIdDependencies: ["FieldID", "ListID"],
    runtimeExpressionDependencies: ["identity control binding"],
  },
  "data-list-file-image-binary-control-projection": {
    transitiveDependencies: ["binary control template schema", "platform attachment behavior"],
    resourceIdDependencies: ["FieldID", "ListID"],
    runtimeExpressionDependencies: [],
  },
  "document-library-default-and-custom-fields": {
    transitiveDependencies: ["document-library default-field policy", "platform field record schema"],
    resourceIdDependencies: ["ListID", "FieldID"],
    runtimeExpressionDependencies: [],
  },
  "approval-form-variables": {
    transitiveDependencies: ["workflow query result shapes", "SetVariableTask shapes", "approval listref schema"],
    resourceIdDependencies: ["generated summary temp variable IDs", "workflow variable IDs"],
    runtimeExpressionDependencies: ["workflow query result maps", "workflow set-variable settings"],
  },
  "approval-form-controls": {
    transitiveDependencies: ["approval grid templates", "dynamic display rule schema", "choice color schema"],
    resourceIdDependencies: ["generated approval control IDs", "form layout IDs"],
    runtimeExpressionDependencies: ["control_display dynamic rules"],
  },
  "dashboard-filter-control-projection": {
    transitiveDependencies: ["Collection runtime filter contract", "dashboard template identity"],
    resourceIdDependencies: ["filterIdPrefix", "ListID"],
    runtimeExpressionDependencies: ["Collection filter binding", "empty-value bypass behavior"],
  },
};

for (const spec of candidateSpecs) for (const functionName of spec.entryPoints) {
  if (!functionPositions.has(functionName)) throw new Error(`FIELD_CONTROL_PHASE5E_LEGACY_ENTRYPOINT_MISSING: ${functionName}`);
}

const candidates = candidateSpecs.map((spec) => ({
  ...spec,
  ...boundaryDetails[spec.id],
  legacyEntryPoints: spec.entryPoints.map((functionName) => ({
    path: `${sourcePath}#${functionName}`,
    functionName,
    line: functionPositions.get(functionName).line,
    productionCallerCount: countCalls(ast, functionName),
  })),
  requiresHostIds: spec.hostEffects.some((effect) => /ID|identity/i.test(effect)),
  requiresTemplateMutation: spec.hostEffects.some((effect) => /template|mutation/i.test(effect)),
  requiresRuntimeOrWorkflow: spec.hostEffects.some((effect) => /runtime|workflow|expression/i.test(effect)),
  immutableDtoBoundary: null,
  actualMaterializerIntegrationPath: `No eligible Phase 5E vertical exists. ${spec.fixture}`,
  scopedRollbackBoundary: spec.rollback,
}));

const classificationCounts = Object.fromEntries(["eligible-contract-first-vertical", "requires-resource-definition-contract", "requires-workflow-or-form-contract", "host-orchestration-only", "defer-high-risk"].map((classification) => [classification, candidates.filter((candidate) => candidate.classification === classification).length]));
const ledger = {
  schemaVersion: "1.0.0",
  phase: "phase-5e-remaining-field-control-projection-family-selection-audit",
  analysisMethod: "TypeScript AST top-level function inventory and call-expression counting, with direct local dependency and host-boundary review.",
  source: { path: sourcePath, sha256: sourceSha256 },
  candidates,
  classificationCounts,
  selection: {
    status: "NO_SAFE_REMAINING_FIELD_CONTROL_PROJECTION_VERTICAL",
    recommendedNextPhase: "phase-5-resource-definition-construction-contract-audit",
    rationale: "Every remaining field and control projection candidate requires resource IDs, lookup target resolution, template mutation, workflow or runtime bindings, or has no active immutable projection behavior.",
    proposedImmutableDtoBoundary: null,
    requiredFixtureAndRollbackBoundary: null,
  },
};
const matrix = {
  schemaVersion: "1.0.0",
  phase: ledger.phase,
  source: ledger.source,
  surfaces: candidates.map((candidate) => ({
    candidateId: candidate.id,
    surface: candidate.surface,
    classification: candidate.classification,
    legacyEntryPoints: candidate.legacyEntryPoints,
    dependencies: candidate.dependencies,
    transitiveDependencies: candidate.transitiveDependencies,
    resourceIdDependencies: candidate.resourceIdDependencies,
    runtimeExpressionDependencies: candidate.runtimeExpressionDependencies,
    hostEffects: candidate.hostEffects,
    deferredReason: candidate.reason,
    requiredContract: candidate.requiredContract,
    fixtureStrategy: candidate.fixture,
    rollbackBoundary: candidate.rollback,
  })),
  selection: ledger.selection,
};
writeJson("compatibility/capability-manifests/field-control-projection-family-selection-audit.v0.1.0.json", ledger);
writeJson("compatibility/capability-manifests/field-control-projection-remaining-capability-matrix.v0.1.0.json", matrix);
console.log("NO_SAFE_REMAINING_FIELD_CONTROL_PROJECTION_VERTICAL");
console.log(`FIELD_CONTROL_PHASE5E_AUDIT_WRITTEN candidates=${candidates.length} noSafeVertical=true`);

function topLevelFunctions(sourceFile) {
  const result = new Map();
  for (const statement of sourceFile.statements) if (ts.isFunctionDeclaration(statement) && statement.name) {
    const position = sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile));
    result.set(statement.name.text, { line: position.line + 1 });
  }
  return result;
}
function countCalls(sourceFile, functionName) {
  let count = 0;
  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === functionName) count += 1;
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return count;
}
function writeJson(relativePath, value) {
  const output = resolve(root, relativePath);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

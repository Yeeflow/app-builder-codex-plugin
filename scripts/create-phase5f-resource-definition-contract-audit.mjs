#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const source = readFileSync(resolve(root, sourcePath), "utf8");
const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const functions = topLevelFunctions(ast);
const specs = [
  spec("data-list-default-view-layout-projection", "data-list", "default-view-layout", ["buildDataListViewLayoutView", "buildDataListViewLayoutViewChecked"], "eligible-after-fixed-filter-host-contract", ["ensureTitleFirstFields", "resolveDataViewFields", "buildDataViewLayoutColumn", "buildDataViewQueryField", "parseDataViewFixedFilterConditions"], ["resolveDataViewField", "splitPlannedFieldList", "uniqueFieldsByName", "parseDataViewFixedFilterConditionPart", "crypto.randomUUID", "findings.push"], ["FieldID supplied by host field records"], ["explicit immutable DataListDefaultViewTemplateSnapshot only; Core performs no template loading"], [], ["host-owned fixed-filter key allocation and lowering", "host-owned findings append", "host-owned final LayoutView resource integration"], "Layout and query projection are deterministic when the current Legacy fixed-filter parser and findings mutation are replaced only inside a future shadow by the proven Phase 5I Core parser and Local Runtime lowering boundary. FieldIDs are supplied inputs, not allocations."),
  spec("data-list-resource-record-assembly", "data-list", "list-records-and-layouts", ["buildResourceGraphPackage", "listInfo", "buildFieldRecord"], "requires-identity-allocation-contract", ["plannedChildResources", "fieldSpecsForList", "buildDocumentLibraryFieldRecords", "buildCustomFormLayout"], ["dataListByName", "listMetaByName", "approvalMetaByName", "dashboardMetaByName"], ["rootListId", "ListID", "FieldID", "LayoutID"], [], ["lookup target list references", "public form host references"], ["resource record mutation", "identity allocation consumption"], "The package-level Data List assembly coordinates all child resources and consumes generated ID paths and cross-resource identity maps."),
  spec("document-library-resource-definition", "document-library", "default-folders-and-fields", ["buildDocumentLibraryFieldRecords", "buildDocumentLibraryFolderItems"], "requires-identity-allocation-contract", ["DOCUMENT_LIBRARY_DEFAULT_FIELDS", "documentLibraryFoldersForList", "stringId"], ["documentLibraryFolderIdPath", "clone"], ["ListID", "FieldID", "folder IDs"], [], [], ["resource record assembly"], "Document Library default records and folders require explicit generated IDs and platform default-field and folder policy."),
  spec("data-list-custom-form-layout-construction", "data-list", "custom-form-layout", ["buildCustomFormLayout", "materializeDataListFormResource", "buildDataListFormFieldsGrid"], "requires-template-graph-contract", ["DATA_LIST_FORM_TEMPLATE_PATHS", "fs.readFileSync", "clone", "setTemplateText"], ["materializePlannedFormActionSetVariables", "appendReverseRelatedCollectionSections", "reconcilePageTempVariableReferences"], ["LayoutID", "ListID", "FieldID"], ["Data List form template path and template identity"], ["approval, dashboard, and list metadata references"], ["template graph mutation", "filesystem template read", "runtime action bindings"], "Custom form construction loads and mutates a template graph, attaches identity-bearing controls, and crosses resource surfaces."),
  spec("public-form-resource-construction", "data-list", "public-form-resource", ["buildPublicFormEntry", "materializePublicFormResource", "buildPublicFormFieldsGrid"], "requires-template-graph-contract", ["resolvePublicFormFields", "publicFormControlType", "PUBLIC_FORM_ALLOWED_FIELD_CONTROL_TYPES"], ["public-form template mutation", "planned action lowering"], ["publicFormId", "ListID", "FieldID"], ["public form page and field template references"], ["host Data List reference"], ["template graph mutation", "public form resource assembly"], "Public Form resources carry host ListID and public form identity and lower mutable template graphs."),
  spec("dashboard-resource-definition", "dashboard", "page-layout-and-collection", ["buildMaterialDashboardResource", "buildCollectionTemplateInstance", "buildDashboardPageLayoutShell"], "requires-template-graph-contract", ["buildDashboardKpiContracts", "normalizeDashboardFilters", "buildDataAnalyticsTemplateInstance"], ["mergePageDependencies", "materializeDashboardAnalytics", "materializeDashboardDataTables"], ["LayoutID", "ListID", "collection and summary IDs"], ["dashboard page and collection template references"], ["Data List metadata and detail-layout references"], ["template graph mutation", "runtime collection bindings"], "Dashboard construction mutates template graphs and combines page, collection, analytics, and cross-resource bindings."),
  spec("dashboard-navigation-layout-definition", "dashboard", "application-navigation", ["buildNavigationLayoutView", "buildApplicationLayoutContract"], "requires-identity-allocation-contract", ["navigationGroupNames", "toRuntimeNavigationItem", "plannedChildResources"], ["fs.readFileSync", "defaultApplicationLayoutAttrs"], ["rootListId", "ListID", "LayoutID", "workflow Key"], ["application layout template reference"], ["Data Lists, dashboards, forms, and reports"], ["filesystem template read", "identity map consumption"], "Navigation layout serializes references to every generated resource surface and consumes their identities."),
  spec("approval-form-definition", "approval-form", "approval-definition-and-layout", ["approvalFormDef", "materializeApprovalFieldControls", "buildApprovalFormFieldsGrid"], "requires-workflow-or-form-contract", ["buildApprovalFormFieldControl", "buildApprovalVariables", "buildApprovalWorkflowShapes"], ["approvalVariableType", "parsePlannedDynamicDisplayRules", "deterministicUuid"], ["form key", "form layout IDs", "control IDs", "workflow node IDs"], ["approval form and grid template references"], ["workflow variable and action references"], ["template graph mutation", "workflow expression binding", "identity generation"], "Approval Form definitions couple layout graphs to variable, workflow, task, and control identity semantics."),
  spec("approval-workflow-resource-definition", "approval-form", "workflow-definition", ["buildApprovalDefResource", "buildApprovalWorkflowShapes", "buildApprovalWorkflowStepNode"], "requires-workflow-or-form-contract", ["buildWorkflowJobPositionAssignee", "approvalTaskFieldSpecs", "addApprovalWorkflowActionVariables"], ["workflow action and expression helpers", "data list metadata"], ["workflow def IDs", "node IDs", "form keys", "task page IDs"], [], ["approval forms, data lists, dashboards, workflows"], ["workflow graph mutation", "runtime expression binding", "identity allocation consumption"], "Workflow definitions are cross-surface graphs with step, task, expression, and variable identity requirements."),
  spec("workflow-set-data-list-resource-definition", "workflow", "workflow-set-data-list", ["buildWorkflowSetDataListDefResource", "buildWorkflowSetDataListShapes", "buildWorkflowSetDataListProperties"], "requires-workflow-or-form-contract", ["workflow action record parsing", "workflow loop records", "listMetaByName"], ["workflow set-data-list utilities", "workflow condition helpers"], ["workflow def IDs", "host ListID", "node IDs"], [], ["Data List identity maps"], ["workflow graph mutation", "runtime action binding"], "Set Data List workflow resources require action semantics, host list identity, loop contracts, and mutable workflow shapes."),
  spec("decoded-package-root-construction", "application", "decoded-package-root", ["buildDecodedPackage", "buildDefaultApplicationControlStyles"], "requires-identity-allocation-contract", ["listInfo", "default application style logic"], ["application layout and theme helpers"], ["rootListId", "dashboardLayoutId", "layout resource IDs"], ["application layout template reference"], ["all child resource identities"], ["root package resource construction"], "The decoded root package is the aggregate identity-bearing application resource and cannot be a narrow surface projection."),
  spec("generated-final-entry-orchestration", "application", "materialization-orchestration", ["materializeFullAppGeneratedFinal", "buildSeedDataArtifact", "buildFailure"], "host-orchestration-only", ["filesystem paths", "package encode and decode", "report writing"], ["API fixture IDs", "archive package utilities"], ["all generated IDs"], [], ["all resource surfaces"], ["filesystem", "package writing", "archive work", "API/runtime orchestration"], "The generated-final entry point owns filesystem, package, report, and test-fixture orchestration and is not a Core resource-definition candidate."),
];

for (const item of specs) for (const functionName of item.functionNames) if (!functions.has(functionName)) throw new Error(`RESOURCE_DEFINITION_AUDIT_ENTRYPOINT_MISSING: ${functionName}`);
if (!hasPropertyAccessCall(functions.get("parseDataViewFixedFilterConditionPart").node, "crypto", "randomUUID")) throw new Error("RESOURCE_DEFINITION_AUDIT_FILTER_KEY_ALLOCATION_MISSING");
if (!hasPropertyAccessCall(functions.get("buildDataListViewLayoutViewChecked").node, "findings", "push")) throw new Error("RESOURCE_DEFINITION_AUDIT_FINDINGS_MUTATION_MISSING");
const candidates = specs.map((item) => ({
  ...item,
  legacyEntryPoints: item.functionNames.map((functionName) => ({ path: `${sourcePath}#${functionName}`, functionName, line: functions.get(functionName).line, productionCallerCount: countCalls(ast, functionName) })),
  requiresIdentityAllocation: item.classification === "requires-identity-allocation-contract",
  requiresTemplateGraphMutation: item.hostEffects.some((effect) => /template graph mutation|filesystem template read/u.test(effect)),
  requiresWorkflowOrRuntime: item.hostEffects.some((effect) => /workflow|runtime/u.test(effect)),
}));
const defaultViewCandidate = candidates.find((item) => item.id === "data-list-default-view-layout-projection");
const internalShadowPath = "packages/app-builder-core-materializer/src/internal/data-list-default-view-layout-projection.ts";
if (!existsSync(resolve(root, internalShadowPath))) throw new Error("RESOURCE_DEFINITION_AUDIT_INTERNAL_SHADOW_MISSING");
const distributionReadinessPath = "compatibility/capability-manifests/data-list-default-view-layout-distribution-readiness.v0.1.0.json";
if (!existsSync(resolve(root, distributionReadinessPath))) throw new Error("RESOURCE_DEFINITION_AUDIT_DISTRIBUTION_READINESS_MISSING");
const distributionReadiness = JSON.parse(readFileSync(resolve(root, distributionReadinessPath), "utf8"));
const localRuntimeReadinessPath = "compatibility/capability-manifests/local-runtime-fixed-filter-lowering-distribution-readiness.v0.1.0.json";
if (!existsSync(resolve(root, localRuntimeReadinessPath))) throw new Error("RESOURCE_DEFINITION_AUDIT_LOCAL_RUNTIME_READINESS_MISSING");
const localRuntimeReadiness = JSON.parse(readFileSync(resolve(root, localRuntimeReadinessPath), "utf8"));
const publicApiReadinessPath = "compatibility/capability-manifests/data-list-default-view-layout-public-api-readiness.v0.1.0.json";
if (!existsSync(resolve(root, publicApiReadinessPath))) throw new Error("RESOURCE_DEFINITION_AUDIT_PUBLIC_API_READINESS_MISSING");
const publicApiReadiness = JSON.parse(readFileSync(resolve(root, publicApiReadinessPath), "utf8"));
const publicApiPromotionPath = "compatibility/capability-manifests/data-list-default-view-layout-public-api-promotion.v0.1.0.json";
if (!existsSync(resolve(root, publicApiPromotionPath))) throw new Error("RESOURCE_DEFINITION_AUDIT_PUBLIC_API_PROMOTION_MISSING");
const publicApiPromotion = JSON.parse(readFileSync(resolve(root, publicApiPromotionPath), "utf8"));
const additionalViewAuditPath = "compatibility/capability-manifests/data-list-additional-view-layout-contract-audit.v0.1.0.json";
if (!existsSync(resolve(root, additionalViewAuditPath))) throw new Error("RESOURCE_DEFINITION_AUDIT_ADDITIONAL_VIEW_AUDIT_MISSING");
const additionalViewAudit = JSON.parse(readFileSync(resolve(root, additionalViewAuditPath), "utf8"));
const additionalViewShadowPath = "compatibility/capability-manifests/data-list-additional-view-layout-internal-shadow.v0.1.0.json";
if (!existsSync(resolve(root, additionalViewShadowPath))) throw new Error("RESOURCE_DEFINITION_AUDIT_ADDITIONAL_VIEW_SHADOW_MISSING");
const additionalViewShadow = JSON.parse(readFileSync(resolve(root, additionalViewShadowPath), "utf8"));
const additionalViewReadinessPath = "compatibility/capability-manifests/data-list-additional-view-layout-public-api-readiness.v0.1.0.json";
if (!existsSync(resolve(root, additionalViewReadinessPath))) throw new Error("RESOURCE_DEFINITION_AUDIT_ADDITIONAL_VIEW_READINESS_MISSING");
const additionalViewReadiness = JSON.parse(readFileSync(resolve(root, additionalViewReadinessPath), "utf8"));
defaultViewCandidate.hostContractDependency = {
  path: "compatibility/capability-manifests/fixed-filter-key-findings-host-contract.v0.1.0.json",
  status: "parser_and_host_lowering_shadow_implemented_not_routed",
  marker: "FIXED_FILTER_PARSER_HOST_LOWERING_SHADOW_VALID",
  boundary: "Core projects fixed-filter intents and deterministic requests; Local Runtime validates host keys, lowers filters, and appends host-owned findings.",
};
defaultViewCandidate.futureCoreDependencies = ["projectFixedFilterIntents"];
defaultViewCandidate.futureHostDependencies = ["lowerFixedFilterProjectionAtHost"];
defaultViewCandidate.immutableDtoContract = {
  input: "DataListDefaultViewLayoutProjectionInput { viewScope, fields: readonly DataListViewFieldReference[], viewIntent, templateSnapshot: DataListDefaultViewTemplateSnapshot }",
  fieldIdentity: "Every FieldID is supplied in a field reference. Core does not accept ListID or LayoutID and allocates no ID.",
  templateSnapshot: "DataListDefaultViewTemplateSnapshot contains only caller-supplied static query-field descriptors. Core loads and mutates no template graph.",
  coreOutput: "DataListDefaultViewLayoutProjection { layout, query, sort, rowColor, fixedFilterProjection } as fresh immutable JSON-serializable data.",
  hostInputOutput: "Local Runtime consumes fixedFilterProjection plus keysByRequestId, returns Legacy-shaped filter, and appends converted findings only to an explicit caller-owned array.",
};
defaultViewCandidate.prospectiveCoreProhibitions = [
  "Core must not generate UUID or filter keys.",
  "Core must not mutate a caller-owned findings array.",
  "Core must not load or mutate a template graph.",
  "Core must not allocate ListID, LayoutID, FieldID, or any host identity.",
];
defaultViewCandidate.fixtureStrategy = "Versioned Data List view matrix covering Title-first ordering, zero and over-twelve field limits, explicit and fallback display/query fields, duplicate field requests, supplied FieldIDs, static query snapshot fields, no/valid/malformed fixed filters, allocated keys, and ordered findings.";
defaultViewCandidate.proofStrategy = "A future shadow must compare unnormalized LayoutView layout, query, filter, sort, rowColor, supplied keys, and findings in source, temporary official ZIP, and simulated installed Plugin layouts before any route change.";
defaultViewCandidate.rollbackBoundary = "A temporary-copy-only rollback restores only the future DataListDefaultViewLayout projection lowering to buildDataListViewLayoutViewChecked while retaining the Phase 5I fixed-filter shadow; it changes no ListID, LayoutID, template graph, or package route.";
defaultViewCandidate.internalShadow = {
  path: internalShadowPath,
  sha256: sha256(readFileSync(resolve(root, internalShadowPath), "utf8")),
  functionName: "projectDataListDefaultViewLayoutInternal",
  status: "implemented_not_public_not_routed",
  distributionStatus: "excluded_from_public_artifact",
};
defaultViewCandidate.distributionReadiness = {
  path: distributionReadinessPath,
  status: distributionReadiness.decision?.status,
  marker: distributionReadiness.decision?.marker,
  localRuntimeDependency: distributionReadiness.localRuntimeDependencyDecision?.status,
  rationale: distributionReadiness.decision?.rationale,
};
defaultViewCandidate.localRuntimeDistributionReadiness = {
  path: localRuntimeReadinessPath,
  status: localRuntimeReadiness.decision?.status,
  marker: localRuntimeReadiness.decision?.marker,
  functionName: localRuntimeReadiness.publicContract?.runtimeFunction,
  distributionStatus: localRuntimeReadiness.prospectiveDistribution?.status,
  mutationOwnership: localRuntimeReadiness.publicContract?.mutationOwnership?.decision,
};
defaultViewCandidate.publicApiReadiness = {
  path: publicApiReadinessPath,
  status: publicApiReadiness.decision?.status,
  marker: publicApiReadiness.decision?.marker,
  functionName: publicApiReadiness.prospectivePublicApi?.runtimeFunction,
  promotionStatus: publicApiReadiness.prospectivePublicApi?.status,
  phase5PStatus: publicApiReadiness.phase5PDistributionPromotion?.status,
  phase5QStatus: publicApiReadiness.phase5QRoutingProof?.status,
};
defaultViewCandidate.publicApiPromotion = {
  path: publicApiPromotionPath,
  status: publicApiPromotion.decision?.status,
  marker: publicApiPromotion.decision?.marker,
  functionName: publicApiPromotion.publicSurface?.runtimeFunction,
  artifactPath: publicApiPromotion.artifact?.path,
  artifactSha256: publicApiPromotion.artifact?.sha256,
  routing: publicApiPromotion.routing,
};
defaultViewCandidate.additionalViewContractAudit = {
  path: additionalViewAuditPath,
  status: additionalViewAudit.decision?.status,
  marker: additionalViewAudit.decision?.marker,
  classification: additionalViewAudit.selectedVertical?.classification,
  currentRoute: additionalViewAudit.currentProductionGuarantees?.additionalViewsRoutedThroughCore,
  selectedVertical: additionalViewAudit.selectedVertical?.id,
};
defaultViewCandidate.additionalViewInternalShadow = {
  path: additionalViewShadowPath,
  status: additionalViewShadow.decision?.status,
  marker: additionalViewShadow.decision?.marker,
  functionName: additionalViewShadow.core?.functionName,
  publicExport: additionalViewShadow.core?.publicExport,
  distributionStatus: additionalViewShadow.core?.distributionStatus,
  currentRoute: additionalViewShadow.productionGuarantees?.additionalViewsRoutedThroughCore,
};
defaultViewCandidate.additionalViewPublicApiReadiness = {
  path: additionalViewReadinessPath,
  status: additionalViewReadiness.decision?.status,
  marker: additionalViewReadiness.decision?.marker,
  selectedShape: additionalViewReadiness.decision?.selectedShape,
  functionName: additionalViewReadiness.prospectivePublicApi?.runtimeFunction,
  promotionStatus: additionalViewReadiness.prospectivePublicApi?.status,
};
const counts = Object.fromEntries(["eligible-after-fixed-filter-host-contract", "requires-identity-allocation-contract", "requires-template-graph-contract", "requires-workflow-or-form-contract", "host-orchestration-only", "defer-high-risk"].map((classification) => [classification, candidates.filter((candidate) => candidate.classification === classification).length]));
const selection = {
  status: "accepted_after_fixed_filter_host_contract",
  marker: "DATA_LIST_DEFAULT_VIEW_LAYOUT_PROJECTION_REAUDIT_ACCEPTED",
  candidateId: defaultViewCandidate.id,
  phase5KBoundary: defaultViewCandidate.immutableDtoContract,
  fixtureStrategy: defaultViewCandidate.fixtureStrategy,
  proofStrategy: defaultViewCandidate.proofStrategy,
  rollbackBoundary: defaultViewCandidate.rollbackBoundary,
  remainingHostResponsibilities: defaultViewCandidate.hostEffects,
  phase5KInternalShadow: defaultViewCandidate.internalShadow,
  phase5LDistributionReadiness: defaultViewCandidate.distributionReadiness,
  phase5MLocalRuntimeDistributionReadiness: defaultViewCandidate.localRuntimeDistributionReadiness,
  phase5OPublicApiReadiness: defaultViewCandidate.publicApiReadiness,
  phase5PPublicApiPromotion: defaultViewCandidate.publicApiPromotion,
};
const ledger = { schemaVersion: "1.0.0", phase: "phase-5f-resource-definition-construction-contract-audit", analysisMethod: "TypeScript AST top-level function inventory and call-expression counting with local dependency, identity, template, cross-reference, and host-effect analysis.", source: { path: sourcePath, sha256: sha256(source) }, candidates, classificationCounts: counts, selection };
const matrix = { schemaVersion: "1.0.0", phase: ledger.phase, source: ledger.source, entries: candidates.map((candidate) => ({ id: candidate.id, surface: candidate.surface, subfamily: candidate.subfamily, classification: candidate.classification, legacyEntryPoints: candidate.legacyEntryPoints, directDependencies: candidate.directDependencies, transitiveDependencies: candidate.transitiveDependencies, futureCoreDependencies: candidate.futureCoreDependencies || [], futureHostDependencies: candidate.futureHostDependencies || [], resourceIdDependencies: candidate.resourceIdDependencies, templateReferences: candidate.templateReferences, crossResourceReferences: candidate.crossResourceReferences, hostEffects: candidate.hostEffects, hostContractDependency: candidate.hostContractDependency || null, internalShadow: candidate.internalShadow || null, distributionReadiness: candidate.distributionReadiness || null, localRuntimeDistributionReadiness: candidate.localRuntimeDistributionReadiness || null, publicApiReadiness: candidate.publicApiReadiness || null, publicApiPromotion: candidate.publicApiPromotion || null, additionalViewContractAudit: candidate.additionalViewContractAudit || null, additionalViewInternalShadow: candidate.additionalViewInternalShadow || null, additionalViewPublicApiReadiness: candidate.additionalViewPublicApiReadiness || null })), selection };
writeJson("compatibility/capability-manifests/resource-definition-construction-audit.v0.1.0.json", ledger);
writeJson("compatibility/capability-manifests/resource-definition-construction-capability-matrix.v0.1.0.json", matrix);
console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_PROJECTION_REAUDIT_ACCEPTED");
console.log(`RESOURCE_DEFINITION_AUDIT_WRITTEN candidates=${candidates.length} selected=${defaultViewCandidate.id}`);

function spec(id, surface, subfamily, functionNames, classification, directDependencies, transitiveDependencies, resourceIdDependencies, templateReferences, crossResourceReferences, hostEffects, reason) { return { id, surface, subfamily, functionNames, classification, directDependencies, transitiveDependencies, resourceIdDependencies, templateReferences, crossResourceReferences, hostEffects, reason, immutableDtoContract: null, fixtureStrategy: null, proofStrategy: null, rollbackBoundary: null }; }
function topLevelFunctions(sourceFile) { const result = new Map(); for (const statement of sourceFile.statements) if (ts.isFunctionDeclaration(statement) && statement.name) { const point = sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile)); result.set(statement.name.text, { line: point.line + 1, node: statement }); } return result; }
function countCalls(sourceFile, name) { let count = 0; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1; ts.forEachChild(node, visit); }; visit(sourceFile); return count; }
function hasPropertyAccessCall(node, objectName, propertyName) { let found = false; const visit = (child) => { if (ts.isCallExpression(child) && ts.isPropertyAccessExpression(child.expression) && ts.isIdentifier(child.expression.expression) && child.expression.expression.text === objectName && child.expression.name.text === propertyName) found = true; ts.forEachChild(child, visit); }; visit(node); return found; }
function writeJson(relativePath, value) { const path = resolve(root, relativePath); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

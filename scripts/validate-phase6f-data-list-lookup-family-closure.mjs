#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = json(argument("--contract", "compatibility/capability-manifests/data-list-lookup-resolution-family-closure.v0.1.0.json"));
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const source = read(sourcePath);
const distribution = json(argument("--distribution", "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json"));
const expectedCategories = ["target-resource-integration", "reverse-relationship-handling", "lookup-controls-and-form-template-placement", "sublist-lookup-embedding", "document-library-lookup-semantics", "approval-form-lookup-semantics", "dashboard-lookup-semantics", "workflow-lookup-semantics", "display-layout-and-mutable-resource-assembly", "fallback-validation-and-package-output"];
const permittedClassifications = new Set(["host-orchestration-only", "requires-template-graph-contract", "requires-cross-surface-contract", "defer-high-risk"]);

if (contract.decision?.status !== "accepted" || contract.decision?.marker !== "PHASE_6_CLOSURE_ACCEPTED") fail("DATA_LIST_LOOKUP_RESOLUTION_FAMILY_CLOSURE_DECISION_INVALID", "The Phase 6 closure decision is incomplete.");
if (contract.source?.path !== sourcePath || (contract.source?.sha256 !== sha256(source) && !matchesApprovedCurrentRoutingTransition(source, contract.source?.sha256))) fail("DATA_LIST_LOOKUP_RESOLUTION_FAMILY_CLOSURE_SOURCE_DRIFT", "The audited Legacy materializer source changed outside the sealed approved transition chain.");
const route = contract.routedLookupRoute;
if (route?.marker !== "DATA_LIST_LOOKUP_RESOLUTION_ROUTE_RECONFIRMED" || route?.buildFieldRecordProductionCallerCount !== 1 || route?.coreCall !== "coreProjectDataListLookupResolutionIntent" || route?.localRuntimeCall !== "coreLowerDataListLookupResolutionAtHost" || !String(route?.guard || "").includes("type === lookup")) fail("DATA_LIST_LOOKUP_RESOLUTION_ROUTE_INVALID", "The routed Lookup boundary is not exact.");
for (const token of ["coreProjectDataListLookupResolutionIntent", "coreLowerDataListLookupResolutionAtHost", "function shouldRouteDataListLookupResolution", 'type === "lookup"', "targetListIdsByLogicalKey", "targetScopesByLogicalKey"]) if (!source.includes(token)) fail("DATA_LIST_LOOKUP_RESOLUTION_ROUTE_INVALID", `The routed Lookup boundary is missing ${token}.`);
if (!Array.isArray(contract.remainingCategories) || !expectedCategories.every((id) => contract.remainingCategories.some((item) => item.id === id))) fail("DATA_LIST_LOOKUP_RESOLUTION_FAMILY_CATEGORY_OMITTED", "A required Lookup-adjacent category is missing from the closure ledger.");
for (const category of contract.remainingCategories) {
  if (!permittedClassifications.has(category.classification) || category.classification === "eligible-lookup-vertical") fail("DATA_LIST_LOOKUP_RESOLUTION_FAMILY_CLOSURE_BLOCKED_ELIGIBLE_VERTICAL", "Phase 6 cannot close while a further Lookup-only vertical is eligible.");
  if (!category.requiredContractFamily || !category.blocker || !Array.isArray(category.legacyBoundary) || !Object.keys(category.productionCallers || {}).length) fail("DATA_LIST_LOOKUP_RESOLUTION_FAMILY_CATEGORY_INVALID", "Every deferred category needs an exact boundary, caller inventory, missing contract, and blocker.");
}
const sublist = category("sublist-lookup-embedding");
if (sublist?.requiredContractFamily !== "sublist-template-graph-contract" || !sublist.blocker.includes("nested")) fail("DATA_LIST_LOOKUP_RESOLUTION_SUBLIST_SCOPE_INVALID", "Sublist Lookup behavior cannot be classified as ordinary Lookup resolution.");
const controls = category("lookup-controls-and-form-template-placement");
if (controls?.requiredContractFamily !== "advanced-field-template-graph-contract" || !controls.blocker.includes("template")) fail("DATA_LIST_LOOKUP_RESOLUTION_TEMPLATE_CONTROL_INVALID", "Template-bound Lookup controls must remain outside the pure Core route.");
for (const id of ["document-library-lookup-semantics", "approval-form-lookup-semantics", "dashboard-lookup-semantics", "workflow-lookup-semantics"]) if (category(id)?.classification !== "requires-cross-surface-contract") fail("DATA_LIST_LOOKUP_RESOLUTION_CROSS_SURFACE_SCOPE_INVALID", "Data List proof cannot be widened to another resource surface.");
const targetIntegration = category("target-resource-integration");
if (targetIntegration?.classification !== "host-orchestration-only" || !targetIntegration.blocker.includes("mutable")) fail("DATA_LIST_LOOKUP_RESOLUTION_TARGET_INTEGRATION_INVALID", "Target-resource integration and package output are host-owned work.");
if (contract.closureCriteria?.zeroEligibleAdditionalLookupVerticals !== true || (contract.eligibleAdditionalLookupVerticals || []).length !== 0) fail("DATA_LIST_LOOKUP_RESOLUTION_FAMILY_CLOSURE_BLOCKED_ELIGIBLE_VERTICAL", "The closure inventory contains an eligible Lookup-only vertical.");
const mutation = contract.closureCriteria?.auditMutations || {};
if (Object.values(mutation).some((value) => value !== false)) fail("DATA_LIST_LOOKUP_RESOLUTION_FAMILY_CLOSURE_MUTATION_FORBIDDEN", "The closure audit must not change routes, adapters, artifacts, or protected boundaries.");
const actualArtifacts = Object.fromEntries((distribution.artifacts || []).map((artifact) => [artifact.packageName, { path: artifact.path, sha256: artifact.sha256, exports: artifact.exports }]));
if (JSON.stringify(actualArtifacts) !== JSON.stringify(contract.artifactBaselines) && !matchesApprovedArtifactTransitions(identityState(actualArtifacts), identityState(contract.artifactBaselines))) fail("DATA_LIST_LOOKUP_RESOLUTION_FAMILY_CLOSURE_ARTIFACT_DRIFT", "A Core distribution artifact changed outside a sealed artifact-only transition.");
const phase7 = contract.phase7Recommendation;
if (phase7?.id !== "phase-7-advanced-field-template-graph-contract-audit" || phase7?.family !== "advanced-field-template-graph-contract" || !Array.isArray(phase7?.dependencyOrder) || phase7.dependencyOrder.length !== 3 || !Array.isArray(phase7?.prerequisites) || phase7.prerequisites.length < 6) fail("DATA_LIST_LOOKUP_RESOLUTION_FAMILY_PHASE7_INVALID", "The Phase 7 recommendation lacks the required template and identity dependency order.");
console.log("DATA_LIST_LOOKUP_RESOLUTION_ROUTE_RECONFIRMED");
console.log("DATA_LIST_LOOKUP_RESOLUTION_FAMILY_CLOSURE_VALID");
console.log("PHASE_6_CLOSURE_ACCEPTED");
console.log("PHASE_6_CLOSURE_PROOF_LINEAGE_RECONCILED");

function category(id) { return contract.remainingCategories.find((item) => item.id === id); }
function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function matchesApprovedArtifactTransitions(current, baseline) {
  const closurePath = "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json";
  const lineagePath = argument("--lineage", "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json");
  if (!existsSync(resolve(root, closurePath)) || !existsSync(resolve(root, lineagePath))) return false;
  const closure = json(closurePath);
  const raw = read(lineagePath);
  if (lineagePath === "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json" && (closure.closureProofLineage?.path !== lineagePath || closure.closureProofLineage?.sha256 !== sha256(raw))) return false;
  const transitions = JSON.parse(raw).approvedTransitions || [];
  const start = transitions.findIndex((transition) => transition?.kind === "artifact-only" && sameState(transition.beforeArtifactState, baseline));
  if (start < 0) return false;
  let state = baseline;
  for (const transition of transitions.slice(start)) {
    if (!sameState(transition.beforeArtifactState, state) || !sameState(transition.artifactState, transition.kind === "artifact-only" ? transition.artifactState : state)) return false;
    if (transition.kind === "artifact-only") {
      if (!sealedArtifactTransition(transition)) return false;
      state = transition.artifactState;
    } else if (transition.kind !== "routing" || !sealedRoutingTransition(transition)) return false;
  }
  return JSON.stringify(state) === JSON.stringify(current);
}
function sealedArtifactTransition(transition) {
  if (!transition?.promotionContractPath || !transition?.promotionReportPath || !transition?.promotionContractSha256 || !transition?.promotionReportSha256 || !transition?.requiredEvidenceMarker) return false;
  if (!sameHash(transition.promotionContractPath, transition.promotionContractSha256) || !sameHash(transition.promotionReportPath, transition.promotionReportSha256)) return false;
  const sourceTransition = transition.sourceTransition;
  if (!sourceTransition || sourceTransition.beforeSha256 !== sourceTransition.afterSha256 || !Array.isArray(sourceTransition.requiredSourceTokens) || !sourceTransition.requiredSourceTokens.length) return false;
  if (!Array.isArray(transition.allowedFiles) || transition.allowedFiles.some((path) => typeof path !== "string" || path.includes("*") || path.includes("..") || path.startsWith("/"))) return false;
  return read(transition.promotionContractPath).includes(transition.requiredEvidenceMarker) || read(transition.promotionReportPath).includes(transition.requiredEvidenceMarker);
}
function sealedRoutingTransition(transition) { return transition?.sourceTransition?.beforeSha256 && transition?.sourceTransition?.afterSha256 && Array.isArray(transition.sourceTransition.requiredSourceTokens) && transition.sourceTransition.requiredSourceTokens.length > 0; }
function sameHash(path, expected) { return existsSync(resolve(root, path)) && sha256(read(path)) === expected; }
function sameState(left, right) { return JSON.stringify(identityState(left || {})) === JSON.stringify(identityState(right || {})); }
function matchesApprovedCurrentRoutingTransition(currentSource, baselineSha256) {
  const closurePath = "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json";
  const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
  if (!existsSync(resolve(root, closurePath)) || !existsSync(resolve(root, lineagePath))) return false;
  const closure = json(closurePath);
  const raw = read(lineagePath);
  if (closure.closureProofLineage?.path !== lineagePath || closure.closureProofLineage?.sha256 !== sha256(raw)) return false;
  const transitions = JSON.parse(raw).approvedTransitions || [];
  const start = transitions.findIndex((item) => item?.sourceTransition?.beforeSha256 === baselineSha256);
  if (start < 0) return false;
  let sourceSha256 = baselineSha256;
  for (const transition of transitions.slice(start)) {
    const sourceTransition = transition.sourceTransition;
    if (!sourceTransition || sourceTransition.beforeSha256 !== sourceSha256 || !sourceTransition.afterSha256 || !Array.isArray(sourceTransition.requiredSourceTokens) || !sourceTransition.requiredSourceTokens.length || !sourceTransition.requiredSourceTokens.every((token) => currentSource.includes(token))) return false;
    if (transition.kind === "routing") {
      if (!transition.evidencePath || !transition.evidenceSha256 || !sameHash(transition.evidencePath, transition.evidenceSha256)) return false;
      const evidence = json(transition.evidencePath);
      if ((evidence.decision?.marker || evidence.marker) !== transition.requiredEvidenceMarker) return false;
    } else if (transition.kind !== "artifact-only" || !sealedArtifactTransition(transition)) return false;
    sourceSha256 = sourceTransition.afterSha256;
  }
  return sourceSha256 === sha256(currentSource);
}
function identityState(artifacts) { return Object.fromEntries(Object.entries(artifacts).map(([name, artifact]) => [name, { path: artifact.path, sha256: artifact.sha256 }])); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

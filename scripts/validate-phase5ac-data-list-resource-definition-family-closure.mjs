#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = json(argument("--contract", "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json"));
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const source = read(sourcePath);
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const requiredCategories = ["lookup-fields", "sublist-fields", "identity-user-department-fields", "file-image-binary-fields", "barcode-dependent-non-scalar-behavior", "type-one-custom-form-layouts", "list-display-layout-references", "remaining-list-field-layout-record-assembly"];

if (contract.decision?.marker !== "PHASE_5_CLOSURE_ACCEPTED" || contract.decision?.status !== "accepted") fail("DATA_LIST_RESOURCE_DEFINITION_FAMILY_CLOSURE_DECISION_INVALID");
if (contract.source?.path !== sourcePath || contract.source?.sha256 !== contract.closureProofLineage?.baselineSha256) fail("DATA_LIST_RESOURCE_DEFINITION_FAMILY_CLOSURE_MUTATION_FORBIDDEN");
if (!contract.closureProofLineage?.artifactBaselinesSha256 || sha(JSON.stringify(contract.artifactBaselines)) !== contract.closureProofLineage.artifactBaselinesSha256) fail("DATA_LIST_RESOURCE_DEFINITION_FAMILY_CLOSURE_MUTATION_FORBIDDEN");
const lineage = validateClosureLineage(contract);
if (contract.scalarRoute?.marker !== "DATA_LIST_SCALAR_RESOURCE_IDENTITY_ROUTE_RECONFIRMED" || contract.scalarRoute?.buildFieldRecordProductionCallerCount !== 1 || !contract.scalarRoute?.coreCalls?.includes("coreProjectDataListScalarResourceDefinitionIntent") || contract.scalarRoute?.localRuntimeCall !== "coreLowerDataListScalarResourceIdentityAtHost") fail("DATA_LIST_RESOURCE_DEFINITION_FAMILY_SCALAR_ROUTE_INVALID");
if (!contract.scalarRoute?.identityBoundary?.includes("lossless") || !contract.scalarRoute?.identityBoundary?.includes("string")) fail("DATA_LIST_RESOURCE_DEFINITION_FAMILY_LOSSY_IDENTITY");
if (!Array.isArray(contract.remainingCategories) || !requiredCategories.every((id) => contract.remainingCategories.some((item) => item.id === id))) fail("DATA_LIST_RESOURCE_DEFINITION_FAMILY_CATEGORY_OMITTED");
for (const category of contract.remainingCategories) if (!category.requiredContractFamily || !category.phase5Blocker || !Array.isArray(category.legacyBoundary) || !Object.keys(category.productionCallers || {}).length) fail("DATA_LIST_RESOURCE_DEFINITION_FAMILY_CATEGORY_INVALID"); else if (category.classification === "eligible-phase5-vertical") fail("DATA_LIST_RESOURCE_DEFINITION_FAMILY_CLOSURE_BLOCKED_ELIGIBLE_VERTICAL");
const lookup = contract.remainingCategories.find((item) => item.id === "lookup-fields");
if (lookup?.requiredContractFamily !== "cross-resource-lookup-resolution-contract" || !lookup.phase5Blocker.includes("cross-resource")) fail("DATA_LIST_RESOURCE_DEFINITION_FAMILY_LOOKUP_CONTRACT_MISSING");
const typeOne = contract.remainingCategories.find((item) => item.id === "type-one-custom-form-layouts");
if (typeOne?.requiredContractFamily !== "data-list-advanced-field-template-graph-contract" || !typeOne.phase5Blocker.includes("Type 1")) fail("DATA_LIST_RESOURCE_DEFINITION_FAMILY_TYPE1_EVIDENCE_INVALID");
if (contract.closureCriteria?.zeroEligibleAdditionalDataListVerticals !== true || (contract.eligibleAdditionalPhase5Verticals || []).length !== 0) fail("DATA_LIST_RESOURCE_DEFINITION_FAMILY_CLOSURE_BLOCKED_ELIGIBLE_VERTICAL");
if (contract.closureCriteria?.routeOrArtifactMutationDuringAudit !== false || Object.values(contract.artifactBaselines || {}).some((artifact) => !artifact?.path || !artifact?.sha256) || JSON.stringify(contract.artifactBaselines) !== JSON.stringify(lineage.closureArtifactBaselines)) fail("DATA_LIST_RESOURCE_DEFINITION_FAMILY_CLOSURE_MUTATION_FORBIDDEN");
if (contract.phase6Recommendation?.id !== "phase-6-cross-resource-lookup-resolution-contract-audit" || contract.phase6Recommendation?.family !== "cross-resource-lookup-resolution-contract" || !Array.isArray(contract.phase6Recommendation?.prerequisites) || contract.phase6Recommendation.prerequisites.length < 5) fail("DATA_LIST_RESOURCE_DEFINITION_FAMILY_PHASE6_INVALID");
if (!existsSync(resolve(root, "compatibility/capability-manifests/data-list-resource-identity-allocation-contract.v0.1.0.json"))) fail("DATA_LIST_RESOURCE_DEFINITION_FAMILY_IDENTITY_CONTRACT_MISSING");
console.log("DATA_LIST_SCALAR_RESOURCE_IDENTITY_ROUTE_RECONFIRMED");
console.log("DATA_LIST_RESOURCE_DEFINITION_FAMILY_CLOSURE_VALID");
console.log("PHASE_5_CLOSURE_ACCEPTED");

function validateClosureLineage(closure) {
  const reference = closure.closureProofLineage;
  const path = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
  const expected = ["phase-6e-data-list-lookup-resolution-selective-routing-proof", "phase-7d-data-list-type1-identity-control-placement-dual-public-distribution-promotion", "phase-7e-data-list-type1-identity-control-placement-selective-routing-proof", "phase-8d-data-list-sublist-scalar-row-schema-dual-public-distribution-promotion", "phase-9d-data-list-sublist-child-resource-inventory-local-runtime-public-api-and-distribution-promotion", "phase-9m-data-list-sublist-embedded-schema-core-public-api-distribution-promotion", "phase-9n-selective-data-list-embedded-sublist-frozen-descriptor-production-host-context-routing-proof", "phase-10d-data-list-sublist-scalar-summary-intent-dual-public-distribution-promotion", "phase-10e-data-list-sublist-scalar-summary-intent-selective-routing-proof", "phase-11e-sublist-summary-dynamic-intent-dual-public-distribution-promotion", "phase-11f-sublist-summary-dynamic-intent-selective-routing-proof"];
  if (!reference || reference.path !== path || !reference.sha256 || !reference.baselineSha256 || !Array.isArray(reference.approvedPhases) || !existsSync(resolve(root, path))) fail("PHASE_CLOSURE_PROOF_LINEAGE_BASELINE_STALE");
  const raw = read(path); if (sha(raw) !== reference.sha256) fail("PHASE_CLOSURE_PROOF_LINEAGE_TAMPERED");
  const record = JSON.parse(raw);
  if (record.protectedClosure?.sourcePath !== sourcePath || record.protectedClosure?.baselineSha256 !== reference.baselineSha256 || record.protectedClosure?.baselineSha256 !== closure.source?.sha256 || JSON.stringify(record.closureArtifactBaselines) !== JSON.stringify(closure.artifactBaselines)) fail("PHASE_CLOSURE_PROOF_LINEAGE_BASELINE_STALE");
  const transitions = record.approvedTransitions;
  if (!Array.isArray(transitions) || JSON.stringify(transitions.map((item) => item.phase)) !== JSON.stringify(expected) || JSON.stringify(reference.approvedPhases) !== JSON.stringify(expected)) fail("PHASE_CLOSURE_PROOF_LINEAGE_BASELINE_STALE");
  const kinds = [undefined, "artifact-only", "routing", "artifact-only", "artifact-only", "artifact-only", "routing", "artifact-only", "routing", "artifact-only", "routing"];
  let priorSource = record.protectedClosure.baselineSha256;
  let priorArtifacts = record.closureArtifactBaselines;
  for (let index = 0; index < transitions.length; index += 1) {
    const transition = transitions[index];
    if (transition.kind !== kinds[index] || transition.sourceTransition?.beforeSha256 !== priorSource || !transition.sourceTransition?.afterSha256 || !Array.isArray(transition.sourceTransition?.requiredSourceTokens) || !transition.sourceTransition.requiredSourceTokens.length || !transition.artifactState || (index > 0 && (JSON.stringify(transition.beforeArtifactState) !== JSON.stringify(priorArtifacts) || !Array.isArray(transition.allowedFiles) || !transition.allowedFiles.length || transition.allowedFiles.some((file) => !file || file.includes("*") || file.endsWith("/"))))) fail("PHASE_CLOSURE_PROOF_LINEAGE_BASELINE_STALE");
    const evidencePath = transition.evidencePath || transition.promotionContractPath;
    const evidenceHash = transition.evidenceSha256 || transition.promotionContractSha256;
    if (!evidencePath || !evidenceHash || !existsSync(resolve(root, evidencePath)) || sha(read(evidencePath)) !== evidenceHash) fail("PHASE_CLOSURE_PROOF_LINEAGE_TAMPERED");
    if (transition.reportPath || transition.promotionReportPath) { const reportPath = transition.reportPath || transition.promotionReportPath; const reportHash = transition.reportSha256 || transition.promotionReportSha256; if (!reportHash || !existsSync(resolve(root, reportPath)) || sha(read(reportPath)) !== reportHash) fail("PHASE_CLOSURE_PROOF_LINEAGE_TAMPERED"); }
    if (!transition.sourceTransition.requiredSourceTokens.every((token) => source.includes(token))) fail("PHASE_CLOSURE_PROOF_LINEAGE_UNDOCUMENTED_CHANGE");
    priorSource = transition.sourceTransition.afterSha256;
    priorArtifacts = transition.artifactState;
  }
  if (sha(source) !== priorSource || JSON.stringify(artifacts(distribution)) !== JSON.stringify(priorArtifacts)) fail("PHASE_CLOSURE_PROOF_LINEAGE_UNDOCUMENTED_CHANGE");
  return { closureArtifactBaselines: record.closureArtifactBaselines };
}

function artifacts(manifest) { return Object.fromEntries((manifest.artifacts || []).map((artifact) => [artifact.packageName, { path: artifact.path, sha256: artifact.sha256 }])); }
function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function json(path) { return JSON.parse(read(path)); }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code) { console.error(code); process.exit(1); }

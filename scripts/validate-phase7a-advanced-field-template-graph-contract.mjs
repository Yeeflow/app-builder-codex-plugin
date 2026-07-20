#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = json(argument("--contract", "compatibility/capability-manifests/data-list-advanced-field-template-graph-contract.v0.1.0.json"));
const candidate = json(argument("--candidate", contract.selectedCandidatePath));
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const source = read(sourcePath);
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const families = ["sublist-row-schema-and-controls", "identity-user-people-control-placement", "department-control-placement", "file-image-binary-controls", "non-scalar-barcode-policy", "type-one-custom-form-layout-and-field-placement", "display-layout-references", "lookup-form-control-placement"];
const errors = ["TEMPLATE_GRAPH_REFERENCE_MISSING", "TEMPLATE_GRAPH_REFERENCE_INVALID", "TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH", "TEMPLATE_GRAPH_REFERENCE_DUPLICATE", "TEMPLATE_GRAPH_REFERENCE_RELATIONSHIP_BROKEN"];
if (contract.decision?.marker !== "PHASE_7_TEMPLATE_GRAPH_CONTRACT_ACCEPTED" || contract.decision?.status !== "accepted") fail("ADVANCED_FIELD_TEMPLATE_GRAPH_DECISION_INVALID", "The Phase 7A selection decision is incomplete.");
if (contract.source?.path !== sourcePath || (contract.source?.sha256 !== sha256(source) && !matchesApprovedPhase7ERoutingTransition(source, contract.source?.sha256))) fail("ADVANCED_FIELD_TEMPLATE_GRAPH_SOURCE_DRIFT", "The audited Legacy materializer changed outside the sealed Type 1 routing transition.");
if (!Array.isArray(contract.families) || !families.every((id) => contract.families.some((item) => item.id === id))) fail("ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_OMITTED", "An advanced-field family is missing from the AST-derived inventory.");
for (const item of contract.families) if (!item.classification || !Array.isArray(item.legacyBoundary) || !Object.keys(item.productionCallers || {}).length || !Array.isArray(item.mutableInputs) || !Array.isArray(item.templateIdentityRequirements) || !Array.isArray(item.suppliedIdentityReferences) || !Array.isArray(item.hostEffects) || !item.blocker) fail("ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_INVALID", "Every audited family needs exact boundaries, callers, identity requirements, host effects, and a blocker.");
if (!errors.every((code) => contract.templateReferenceErrors?.codes?.includes(code) && contract.templateReferenceErrors?.semantics?.[code])) fail("ADVANCED_FIELD_TEMPLATE_GRAPH_ERROR_CONTRACT_INVALID", "The template-reference error contract is incomplete.");
const prohibited = contract.coreContract?.prohibitions || [];
for (const item of ["mutable template objects", "caller-owned findings arrays", "implicit template or control ID allocation", "runtime expression evaluation", "package writing", "resource mutation"]) if (!prohibited.includes(item)) fail("ADVANCED_FIELD_TEMPLATE_GRAPH_CORE_BOUNDARY_INVALID", "The Core boundary must prohibit " + item + ".");
if (!contract.coreContract?.hostResponsibility?.includes("template loading") || !contract.coreContract?.hostResponsibility?.includes("caller-owned findings append")) fail("ADVANCED_FIELD_TEMPLATE_GRAPH_HOST_BOUNDARY_INVALID", "Host template loading and findings append responsibility is missing.");
const selected = candidate.selectedCandidate;
if (candidate.decision?.marker !== contract.decision.marker || selected?.id !== "data-list-type1-view-workbench-identity-user-control-placement-intent" || selected?.surface !== "data-list" || selected?.family !== "identity-user-people-control-placement" || selected?.productionCallerCount !== 1) fail("ADVANCED_FIELD_TEMPLATE_GRAPH_CANDIDATE_INVALID", "The selected vertical is not the audited single Data List candidate.");
if (!selected.included?.includes("non-sublist fields") || !selected.excluded?.includes("sublist") || !selected.excluded?.includes("Lookup target resolution") || !selected.excluded?.includes("workflows") || !selected.excluded?.includes("runtime expressions") || !selected.excluded?.includes("template mutation")) fail("ADVANCED_FIELD_TEMPLATE_GRAPH_CANDIDATE_SCOPE_INVALID", "The candidate widened beyond its approved Data List-only intent boundary.");
if (!selected.coreInput?.includes("immutable template snapshot descriptor") || !selected.coreInput?.includes("explicit fields-grid node reference") || !selected.coreOutput?.includes("immutable control descriptor without a generated control ID")) fail("ADVANCED_FIELD_TEMPLATE_GRAPH_IDENTITY_BOUNDARY_INVALID", "The selected candidate must use explicit snapshot and placement identities without allocation.");
if (selected.requiredParityFixture?.plannedCaseCount !== 8 || !selected.requiredParityFixture?.coverage?.includes("missing template reference") || !selected.rollback?.includes("Temporary full Plugin copy") || !Array.isArray(selected.routingPrerequisites) || selected.routingPrerequisites.length < 6) fail("ADVANCED_FIELD_TEMPLATE_GRAPH_CANDIDATE_PROOF_INVALID", "The candidate lacks a complete corpus and rollback boundary.");
if (Object.values(contract.auditMutations || {}).some((value) => value !== false) || Object.values(candidate.auditMutations || {}).some((value) => value !== false)) fail("ADVANCED_FIELD_TEMPLATE_GRAPH_AUDIT_MUTATION_FORBIDDEN", "Phase 7A must not change routes, APIs, artifacts, adapters, or protected boundaries.");
const currentArtifacts = Object.fromEntries((distribution.artifacts || []).map((artifact) => [artifact.packageName, { path: artifact.path, sha256: artifact.sha256, exports: artifact.exports }]));
if (JSON.stringify(currentArtifacts) !== JSON.stringify(contract.artifactBaselines) && !matchesApprovedPhase7DArtifactTransition(identityState(currentArtifacts), identityState(contract.artifactBaselines))) fail("ADVANCED_FIELD_TEMPLATE_GRAPH_ARTIFACT_DRIFT", "Core artifacts changed outside the sealed Phase 7D artifact-only transition.");
for (const token of ["function buildCustomFormLayout", "function materializeDataListFormResource", "function buildDataListFormFieldControl", "function buildDataListFormSubListControl", "function dataListSubListVariables", "function buildDataListFormDisplaySettings"]) if (!source.includes(token)) fail("DATA_LIST_ADVANCED_FIELD_LEGACY_BOUNDARY_MISSING", "Legacy boundary missing: " + token + ".");
console.log("DATA_LIST_ADVANCED_FIELD_LEGACY_BOUNDARIES_AUDITED");
console.log("ADVANCED_FIELD_TEMPLATE_GRAPH_CONTRACT_VALID");
console.log("PHASE_7_TEMPLATE_GRAPH_CONTRACT_ACCEPTED");
function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function matchesApprovedPhase7DArtifactTransition(current, baseline) {
  const closurePath = "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json";
  const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
  if (!existsSync(resolve(root, closurePath)) || !existsSync(resolve(root, lineagePath))) return false;
  const closure = json(closurePath);
  const raw = read(lineagePath);
  if (closure.closureProofLineage?.path !== lineagePath || closure.closureProofLineage?.sha256 !== sha256(raw)) return false;
  const transition = JSON.parse(raw).approvedTransitions?.find((item) => item.phase === "phase-7d-data-list-type1-identity-control-placement-dual-public-distribution-promotion");
  return JSON.stringify(transition?.beforeArtifactState) === JSON.stringify(baseline) && JSON.stringify(transition?.artifactState) === JSON.stringify(current) && transition.kind === "artifact-only";
}
function matchesApprovedPhase7ERoutingTransition(currentSource, baselineSha256) {
  const closurePath = "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json";
  const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
  if (!existsSync(resolve(root, closurePath)) || !existsSync(resolve(root, lineagePath))) return false;
  const closure = json(closurePath);
  const raw = read(lineagePath);
  if (closure.closureProofLineage?.path !== lineagePath || closure.closureProofLineage?.sha256 !== sha256(raw)) return false;
  const transition = JSON.parse(raw).approvedTransitions?.find((item) => item.phase === "phase-7e-data-list-type1-identity-control-placement-selective-routing-proof");
  if (transition?.kind !== "routing" || transition.sourceTransition?.beforeSha256 !== baselineSha256 || transition.sourceTransition?.afterSha256 !== sha256(currentSource) || !Array.isArray(transition.sourceTransition?.requiredSourceTokens) || !transition.sourceTransition.requiredSourceTokens.every((token) => currentSource.includes(token)) || !transition.evidencePath || !transition.evidenceSha256) return false;
  const evidencePath = resolve(root, transition.evidencePath);
  if (!existsSync(evidencePath) || sha256(readFileSync(evidencePath, "utf8")) !== transition.evidenceSha256) return false;
  const evidence = json(transition.evidencePath);
  return evidence.decision?.marker === transition.requiredEvidenceMarker && evidence.productionBoundary?.callerPath === "buildDataListFormFieldsGrid -> buildDataListFormFieldControl";
}
function identityState(artifacts) { return Object.fromEntries(Object.entries(artifacts).map(([name, artifact]) => [name, { path: artifact.path, sha256: artifact.sha256 }])); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(code + ": " + message); process.exit(1); }

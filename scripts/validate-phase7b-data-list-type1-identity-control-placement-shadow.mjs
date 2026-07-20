#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const core = read("packages/app-builder-core-materializer/src/internal/data-list-type1-identity-control-placement.ts");
const host = read("runtimes/app-builder-core-local-runtime/src/internal-data-list-type1-identity-control-placement-lowering.ts");
const coreIndex = read("packages/app-builder-core-materializer/src/index.ts");
const hostIndex = read("runtimes/app-builder-core-local-runtime/src/index.ts");
const legacy = read("scripts/materialize-full-app-generated-final.mjs");
const corpus = JSON.parse(read("compatibility/differential-fixtures/data-list-type1-identity-user-control-placement.v0.1.0.json"));
const contract = JSON.parse(read("compatibility/capability-manifests/data-list-advanced-field-template-graph-contract.v0.1.0.json"));
const errors = ["TEMPLATE_GRAPH_REFERENCE_MISSING", "TEMPLATE_GRAPH_REFERENCE_INVALID", "TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH", "TEMPLATE_GRAPH_REFERENCE_DUPLICATE", "TEMPLATE_GRAPH_REFERENCE_RELATIONSHIP_BROKEN"];
if (!core.includes("projectDataListType1IdentityControlPlacementInternal") || !core.includes("Object.freeze") || /randomUUID|node:|process\.|readFile|writeFile|controlId/.test(core)) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_BOUNDARY_INVALID", "Core contains a forbidden host dependency or generated control identity.");
if (!host.includes("lowerDataListType1IdentityControlPlacementAtHost") || !errors.every((code) => host.includes(code)) || /randomUUID|node:|process\.|readFile|writeFile/.test(host)) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_HOST_BOUNDARY_INVALID", "Host lowering is incomplete or contains forbidden allocation behavior.");
const corePublicReexport = 'export { projectDataListType1IdentityControlPlacementInternal as projectDataListType1IdentityControlPlacement } from "./internal/data-list-type1-identity-control-placement.js";';
const hostPublicReexport = 'export { lowerDataListType1IdentityControlPlacementAtHost } from "./internal-data-list-type1-identity-control-placement-lowering.js";';
if (occurrences(coreIndex, "projectDataListType1IdentityControlPlacementInternal") !== 1 || !coreIndex.includes(corePublicReexport) || occurrences(hostIndex, hostPublicReexport) !== 1) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_PUBLIC_EXPORT_FORBIDDEN", "Only the approved Phase 7D aliases may expose the internal Type 1 placement modules.");
if (corpus.caseCount !== 21 || !["view-identity", "workbench-user", "people-alias", "person-field-name", "lossless-nineteen-digit-ids", "missing-reference", "invalid-reference", "wrong-scope", "duplicate-reference", "broken-reference", "excluded-sublist", "excluded-department", "excluded-file", "excluded-image-binary", "excluded-barcode", "excluded-lookup-placement", "excluded-type-zero", "excluded-approval-form", "excluded-document-library", "excluded-dashboard", "excluded-workflow"].every((id) => corpus.cases.some((item) => item.id === id))) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_FIXTURE_INCOMPLETE", "The versioned corpus is incomplete.");
if ((contract.source?.sha256 !== sha256(legacy) && !matchesApprovedPhase7ERoutingTransition(legacy, contract.source?.sha256)) || contract.decision?.marker !== "PHASE_7_TEMPLATE_GRAPH_CONTRACT_ACCEPTED") fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CONTRACT_DRIFT", "The Phase 7A contract no longer matches the Legacy boundary or the sealed Type 1 routing transition.");
for (const token of ["function buildDataListFormFieldControl", "function dynamicControlTypeForField", "function isSubListFormField"]) if (!legacy.includes(token)) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_LEGACY_BOUNDARY_MISSING", "Missing Legacy function: " + token);
console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_INTERNAL_SHADOW_VALID core=" + sha256(core) + " host=" + sha256(host));
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function occurrences(value, text) { return value.split(text).length - 1; }
function matchesApprovedPhase7ERoutingTransition(currentSource, baselineSha256) {
  const closurePath = "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json";
  const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
  if (!existsSync(resolve(root, closurePath)) || !existsSync(resolve(root, lineagePath))) return false;
  const closure = JSON.parse(read("compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json"));
  const raw = read(lineagePath);
  if (closure.closureProofLineage?.path !== lineagePath || closure.closureProofLineage?.sha256 !== sha256(raw)) return false;
  const transition = JSON.parse(raw).approvedTransitions?.find((item) => item.phase === "phase-7e-data-list-type1-identity-control-placement-selective-routing-proof");
  if (transition?.kind !== "routing" || transition.sourceTransition?.beforeSha256 !== baselineSha256 || transition.sourceTransition?.afterSha256 !== sha256(currentSource) || !Array.isArray(transition.sourceTransition?.requiredSourceTokens) || !transition.sourceTransition.requiredSourceTokens.every((token) => currentSource.includes(token)) || !transition.evidencePath || !transition.evidenceSha256) return false;
  const evidencePath = resolve(root, transition.evidencePath);
  if (!existsSync(evidencePath) || sha256(readFileSync(evidencePath, "utf8")) !== transition.evidenceSha256) return false;
  const evidence = JSON.parse(read(transition.evidencePath));
  return evidence.decision?.marker === transition.requiredEvidenceMarker && evidence.productionBoundary?.callerPath === "buildDataListFormFieldsGrid -> buildDataListFormFieldControl";
}
function fail(code, message) { console.error(code + ": " + message); process.exit(1); }

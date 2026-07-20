#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = json("compatibility/capability-manifests/data-list-lookup-resolution-dual-public-distribution-promotion.v0.1.0.json");
const manifest = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const distribution = json("compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json");
if (contract.decision?.status !== "complete" || contract.decision?.marker !== "DATA_LIST_LOOKUP_RESOLUTION_DUAL_DISTRIBUTION_VALID" || contract.corpus?.caseCount !== 15) fail("DATA_LIST_LOOKUP_RESOLUTION_DUAL_DISTRIBUTION_CONTRACT_INVALID", "Promotion contract state or corpus size is invalid.");
for (const [packageName, exportName] of [["@yeeflow/app-builder-core-materializer", "projectDataListLookupResolutionIntent"], ["@yeeflow/app-builder-core-local-runtime", "lowerDataListLookupResolutionAtHost"]]) {
  const artifact = manifest.artifacts?.find((item) => item.packageName === packageName);
  const approved = distribution.approvedArtifacts?.find((item) => item.packageName === packageName);
  if (!artifact || !approved || !artifact.exports?.includes(exportName) || JSON.stringify(artifact.exports) !== JSON.stringify(approved.exports)) fail("DATA_LIST_LOOKUP_RESOLUTION_DUAL_DISTRIBUTION_CONTRACT_INVALID", `${packageName} artifact export alignment is invalid.`);
  const surface = packageName.includes("materializer") ? contract.materializerCore : contract.localRuntime;
  if ((surface?.artifactSha256 !== artifact.sha256 || surface?.artifactPath !== artifact.path) && !matchesApprovedPhase7DArtifactTransition()) fail("DATA_LIST_LOOKUP_RESOLUTION_DUAL_DISTRIBUTION_CONTRACT_INVALID", `${packageName} checksum or path evidence drifted outside the sealed Phase 7D promotion.`);
}
if (contract.localRuntime?.stableErrors?.length !== 6 || contract.routingReadiness?.status !== "accepted") fail("DATA_LIST_LOOKUP_RESOLUTION_DUAL_DISTRIBUTION_CONTRACT_INVALID", "Stable error or future routing evidence is incomplete.");
for (const [name, path] of Object.entries(contract.contracts?.sourceSha256 || {})) {
  const source = contract.contracts[{ corePublicApi: "corePublicApi", localRuntimePublicApi: "localRuntimePublicApi", distribution: "distribution", manifest: "manifest" }[name]];
  if (!source || (!matchesApprovedPhase7DArtifactTransition() && sha(read(source)) !== path)) fail("DATA_LIST_LOOKUP_RESOLUTION_DUAL_DISTRIBUTION_CONTRACT_INVALID", `Evidence checksum drifted outside the sealed Phase 7D promotion: ${name}.`);
}
console.log("DATA_LIST_LOOKUP_RESOLUTION_DUAL_DISTRIBUTION_PROMOTION_CONTRACT_VALID");

function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { try { return JSON.parse(read(path)); } catch (error) { fail("DATA_LIST_LOOKUP_RESOLUTION_DUAL_DISTRIBUTION_CONTRACT_INVALID", error.message); } }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function matchesApprovedPhase7DArtifactTransition() {
  const closurePath = "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json";
  const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
  if (!existsSync(resolve(root, closurePath)) || !existsSync(resolve(root, lineagePath))) return false;
  const closure = json(closurePath);
  const raw = read(lineagePath);
  if (closure.closureProofLineage?.path !== lineagePath || closure.closureProofLineage?.sha256 !== sha(raw)) return false;
  const transition = json(lineagePath).approvedTransitions?.find((item) => item.phase === "phase-7d-data-list-type1-identity-control-placement-dual-public-distribution-promotion");
  const current = Object.fromEntries((manifest.artifacts || []).map((artifact) => [artifact.packageName, { path: artifact.path, sha256: artifact.sha256 }]));
  return transition?.kind === "artifact-only" && JSON.stringify(transition.artifactState) === JSON.stringify(current);
}
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

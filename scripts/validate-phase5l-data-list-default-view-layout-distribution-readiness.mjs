#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readinessPath = argument("--readiness", "compatibility/capability-manifests/data-list-default-view-layout-distribution-readiness.v0.1.0.json");
const publicIndexPath = argument("--public-index", "packages/app-builder-core-materializer/src/index.ts");
const publicContractPath = argument("--public-contract", "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const distributionContractPath = argument("--distribution-contract", "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json");
const readiness = json(readinessPath);
const publicIndex = read(publicIndexPath);
const publicContract = json(publicContractPath);
const distributionContract = json(distributionContractPath);
const internalFunction = "projectDataListDefaultViewLayoutInternal";
const prospectiveFunction = "projectDataListDefaultViewLayout";

if (readiness.phase !== "phase-5l-data-list-default-view-layout-distribution-readiness-audit" || readiness.decision?.status !== "rejected" || readiness.decision?.marker !== "DATA_LIST_DEFAULT_VIEW_LAYOUT_DISTRIBUTION_READINESS_REJECTED") fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_READINESS_DECISION_INVALID", "The readiness audit must record the rejected distribution decision.");
if (readiness.revalidation?.caseCount !== 12 || !Array.isArray(readiness.revalidation?.guarantees) || readiness.revalidation.guarantees.length !== 4) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_READINESS_REVALIDATION_INCOMPLETE", "The readiness audit must retain Phase 5K corpus and boundary evidence.");
const api = readiness.prospectivePublicApi;
if (api?.status !== "defined_not_promoted" || api.runtimeFunction !== prospectiveFunction || !Array.isArray(api.publicInputDtos) || !Array.isArray(api.publicOutputDtos) || !Array.isArray(api.explicitInternalOnly)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_READINESS_API_INVALID", "The readiness audit lacks the bounded prospective public API contract.");
const prohibited = JSON.stringify(api.prohibitedPublicInputs || []).toLowerCase();
for (const required of ["legacy layoutview resource records", "mutable template objects", "caller-owned findings arrays", "host key allocation maps", "listid", "layoutid", "generated resource objects", "filesystem, api, environment, or runtime state"]) if (!prohibited.includes(required)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_LEAKAGE", "The prospective public API does not exclude every host or Legacy shape.");
if (JSON.stringify({ input: api.publicInputDtos, output: api.publicOutputDtos, internal: api.explicitInternalOnly }).match(/legacy|mutable|host|runtime|resource record/iu)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_LEAKAGE", "Public DTO names or internal-only declarations expose a forbidden host or Legacy shape.");
if (!api.explicitInternalOnly.includes(internalFunction) || api.explicitInternalOnly.includes(prospectiveFunction)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_INTERNAL_EXPORT_PROMOTION_FORBIDDEN", "The internal helper must remain internal and the prospective public function must not be declared as internal.");
const runtimeDecision = readiness.localRuntimeDependencyDecision;
if (runtimeDecision?.status !== "required_before_promotion" || runtimeDecision.currentState !== "workspace_only_not_distributed" || runtimeDecision.requiredRuntimeFunction !== "lowerFixedFilterProjectionAtHost" || !runtimeDecision.requiredContract || !runtimeDecision.distributionRequirement) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_LOCAL_RUNTIME_DECISION_MISSING", "The readiness audit lacks an explicit Local Runtime host-lowering distribution decision.");
const proof = readiness.routingPrerequisites?.requiredProof || [];
for (const required of ["source parity", "official ZIP parity", "simulated installed Plugin parity", "deterministic normalized decoded resource output", "temporary-copy-only Legacy rollback that restores only the checked LayoutView lowering"]) if (!proof.includes(required)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_ROUTING_PROOF_INCOMPLETE", "The future routing plan lacks required source, archive, installed, determinism, or rollback evidence.");
const distribution = readiness.prospectiveDistributionEvidence;
if (!Array.isArray(distribution?.requiredSurfaces) || distribution.requiredSurfaces.length !== 4 || !Array.isArray(distribution?.requiredChecks) || !distribution.requiredChecks.some((item) => /workspace, source, node_modules, source-map/u.test(item))) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_DISTRIBUTION_EVIDENCE_INCOMPLETE", "The future distribution evidence is incomplete.");
const materializer = (distributionContract.approvedArtifacts || []).find((artifact) => artifact.packageName === "@yeeflow/app-builder-core-materializer");
if (/export\s*\{\s*projectDataListDefaultViewLayoutInternal\s*,?\s*\}/u.test(publicIndex) || publicContract.runtimeExports?.includes(internalFunction) || materializer?.exports?.includes(internalFunction)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_INTERNAL_EXPORT_PROMOTION_FORBIDDEN", "The internal LayoutView shadow name must not be promoted in current public or distribution surfaces.");
const publicPromotion = [publicIndex.includes(prospectiveFunction), publicContract.runtimeExports?.includes(prospectiveFunction), materializer?.exports?.includes(prospectiveFunction)];
if (publicPromotion.some(Boolean) && !publicPromotion.every(Boolean)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_UNAPPROVED_PUBLIC_EXPORT", "The prospective LayoutView API promotion must align every public surface.");
console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_DISTRIBUTION_READINESS_REJECTED");
console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_DISTRIBUTION_READINESS_VALID");

function argument(option, fallback) { const index = process.argv.indexOf(option); return resolve(root, index < 0 ? fallback : process.argv[index + 1]); }
function read(relativePath) { return readFileSync(relativePath, "utf8"); }
function json(relativePath) { try { return JSON.parse(read(relativePath)); } catch (error) { fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_READINESS_INVALID_JSON", error.message); } }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

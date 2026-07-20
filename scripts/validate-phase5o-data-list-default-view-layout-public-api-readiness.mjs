#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readinessPath = argument("--readiness", "compatibility/capability-manifests/data-list-default-view-layout-public-api-readiness.v0.1.0.json");
const publicIndexPath = argument("--public-index", "packages/app-builder-core-materializer/src/index.ts");
const publicContractPath = argument("--public-contract", "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const distributionContractPath = argument("--distribution-contract", "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json");
const runtimeContractPath = argument("--runtime-contract", "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json");
const readiness = json(readinessPath);
const publicIndex = read(publicIndexPath);
const publicContract = json(publicContractPath);
const distribution = json(distributionContractPath);
const runtime = json(runtimeContractPath);
const api = readiness.prospectivePublicApi;
const publicName = "projectDataListDefaultViewLayout";
const internalName = "projectDataListDefaultViewLayoutInternal";

if (readiness.phase !== "phase-5o-data-list-default-view-layout-public-api-readiness-audit" || readiness.decision?.status !== "accepted" || readiness.decision?.marker !== "DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_READINESS_ACCEPTED") fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_READINESS_DECISION_INVALID", "The Phase 5O readiness decision must be accepted.");
if (!api || api.status !== "defined_not_promoted" || api.runtimeFunction !== publicName || !same(api.requiredFields, ["fields", "viewScope"]) || !same(api.optionalFields, ["viewIntent", "templateSnapshot", "listName"])) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_CONTRACT_INVALID", "The prospective LayoutView input contract is incomplete.");
for (const required of ["serialization", "immutability", "errors", "versioning"]) if (!api[required]) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_POLICY_MISSING", "The prospective LayoutView public API lacks a required policy.");
const forbidden = JSON.stringify(api.prohibitedPublicShapes || []).toLowerCase();
for (const shape of ["legacy layoutview resource records", "mutable template objects", "caller-owned findings arrays", "host key allocation maps", "listid", "layoutid", "generated resource objects", "filesystem", "api state", "environment state", "runtime state"]) if (!forbidden.includes(shape)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_LEAKAGE", "The prospective LayoutView API exposes a forbidden host or Legacy shape.");
if (!Array.isArray(api.explicitInternalOnly) || !api.explicitInternalOnly.includes(internalName) || api.explicitInternalOnly.includes(publicName)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_INTERNAL_SURFACE_INVALID", "The internal LayoutView surface is not bounded.");
const promotedSurfaces = [
  publicIndex.includes(publicName),
  publicContract.runtimeExports?.includes(publicName),
  (distribution.approvedArtifacts || []).some((artifact) => artifact.packageName === "@yeeflow/app-builder-core-materializer" && artifact.exports?.includes(publicName)),
];
if (promotedSurfaces.some(Boolean) && !promotedSurfaces.every(Boolean)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_ACCIDENTAL_PUBLIC_PROMOTION", "The LayoutView projection promotion must align the source, public API, and distribution contracts.");
if (!runtime.runtimeExports?.includes("lowerFixedFilterProjectionAtHost") || !runtime.lowerFixedFilterProjectionAtHost?.mutationOwnership?.includes("callerFindings") || !same(runtime.lowerFixedFilterProjectionAtHost?.errors, ["FIXED_FILTER_KEY_ALLOCATION_MISSING", "FIXED_FILTER_KEY_ALLOCATION_INVALID", "FIXED_FILTER_KEY_ALLOCATION_COLLISION"])) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_LOCAL_RUNTIME_DEPENDENCY_MISSING", "The required Local Runtime lowering artifact contract is incomplete.");
const responsibilities = readiness.interArtifactResponsibilities || {};
if (!/no key|no allocated key|allocates no key/i.test(responsibilities.materializerCore || "") || !/host-supplied keysByRequestId|lowers Legacy-shaped filters/i.test(responsibilities.localRuntime || "") || !/workspace packages|TypeScript source|node_modules/i.test(responsibilities.resolution || "")) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_INTER_ARTIFACT_BOUNDARY_INVALID", "The Materializer and Local Runtime responsibilities are not explicit.");
const p5p = readiness.phase5PDistributionPromotion?.requiredProof || [];
for (const proof of ["compiled source export and twelve-case corpus parity", "Plugin dist export and corpus parity", "temporary official ZIP export and corpus parity", "simulated installed Plugin export and corpus parity", "exact manifest path, version, checksum, and export-list parity", "public export leakage and unexpected-export negative gates"]) if (!p5p.includes(proof)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PHASE5P_PROOF_MISSING", "Phase 5P distribution proof is incomplete.");
const p5q = readiness.phase5QRoutingProof || {};
for (const proof of ["source parity", "official ZIP parity", "simulated installed Plugin parity", "deterministic normalized decoded resource output", "temporary-copy-only Legacy rollback", "retained Local Runtime allocation and findings-lowering ownership"]) if (!p5q.requiredProof?.includes(proof)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PHASE5Q_PROOF_MISSING", "Phase 5Q routing and rollback proof is incomplete.");
console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_READINESS_ACCEPTED");
console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_READINESS_VALID");

function same(value, expected) { return Array.isArray(value) && JSON.stringify(value) === JSON.stringify(expected); }
function argument(option, fallback) { const index = process.argv.indexOf(option); return resolve(root, index < 0 ? fallback : process.argv[index + 1]); }
function read(path) { return readFileSync(path, "utf8"); }
function json(path) { try { return JSON.parse(read(path)); } catch (error) { fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_READINESS_INVALID_JSON", error.message); } }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

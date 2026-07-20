#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readinessPath = argument("--readiness", "compatibility/capability-manifests/data-list-additional-view-layout-public-api-readiness.v0.1.0.json");
const indexPath = argument("--public-index", "packages/app-builder-core-materializer/src/index.ts");
const materializerContractPath = argument("--materializer-contract", "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const distributionContractPath = argument("--distribution-contract", "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json");
const runtimeContractPath = argument("--runtime-contract", "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json");
const readiness = json(readinessPath);
const index = read(indexPath);
const materializer = json(materializerContractPath);
const distribution = json(distributionContractPath);
const runtime = json(runtimeContractPath);
const prospective = "projectDataListAdditionalViewLayout";
const defaultFunction = "projectDataListDefaultViewLayout";
const api = readiness.prospectivePublicApi;

if (readiness.phase !== "phase-5t-data-list-additional-view-layout-public-api-readiness-audit" || readiness.decision?.status !== "accepted" || readiness.decision?.marker !== "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_API_READINESS_ACCEPTED" || readiness.decision?.selectedShape !== "separate-additional-view-function") fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_READINESS_DECISION_INVALID", "The Phase 5T decision must accept only the separate additional-view API shape.");
if (!readiness.revalidation?.phase5SShadow?.marker?.includes("INTERNAL_SHADOW_IMPLEMENTED") || readiness.revalidation?.phase5SShadow?.parityCases !== 7 || readiness.revalidation?.phase5SShadow?.viewScopeCount < 2 || !readiness.revalidation?.publicExportGuard?.includes("absent")) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_READINESS_EVIDENCE_MISSING", "Phase 5S shadow and public-guard evidence is incomplete.");
if (!index.includes(defaultFunction) || !materializer.runtimeExports?.includes(defaultFunction)) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_DEFAULT_API_REGRESSION", "The existing default-view public API must remain unchanged.");
const promotedSurfaces = [index.includes(prospective), materializer.runtimeExports?.includes(prospective), (distribution.approvedArtifacts || []).some((artifact) => artifact.packageName === "@yeeflow/app-builder-core-materializer" && artifact.exports?.includes(prospective))];
if (promotedSurfaces.some(Boolean) && !promotedSurfaces.every(Boolean)) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_ACCIDENTAL_PUBLIC_PROMOTION", "Additional-view public promotion must align source, contract, and distribution surfaces.");
if (!api || api.status !== "defined_not_promoted" || api.runtimeFunction !== prospective || !api.compatibility?.includes(defaultFunction)) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_API_SHAPE_INVALID", "The prospective additional-view API shape is incomplete.");
for (const required of ["viewScope", "fields", "viewIntent", "templateSnapshot", "listName"]) if (!api.publicInputProperties?.includes(required)) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_API_SHAPE_INVALID", "The public additional-view input DTO is incomplete.");
for (const required of ["viewIntent.isDefault=false", "viewScope is non-empty", "viewScope does not end with /default", "FieldID values are caller-supplied", "template snapshot is immutable"]) if (!api.requiredSemantics?.includes(required)) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_NON_DEFAULT_SCOPE_MISSING", "The non-default view-intent boundary is incomplete.");
for (const policy of ["errors", "serialization", "immutability", "versioning", "fixedFilterSemantics"]) if (!api[policy]) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_POLICY_MISSING", "The prospective additional-view API lacks a required policy.");
for (const forbidden of ["LayoutID", "ListID", "URL", "slug", "route key", "layout index", "caller-owned findings arrays", "host key allocation maps", "mutable template objects"]) if (!api.prohibitedPublicShapes?.includes(forbidden)) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_API_LEAKAGE", "The prospective additional-view API leaks a host or mutable shape.");
if (!api.explicitInternalOnly?.includes("projectDataListAdditionalViewLayoutInternal") || api.explicitInternalOnly?.includes(prospective)) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_INTERNAL_SURFACE_INVALID", "The public and internal additional-view surfaces are not separated.");
if (!runtime.runtimeExports?.includes("lowerFixedFilterProjectionAtHost") || !same(runtime.lowerFixedFilterProjectionAtHost?.errors, ["FIXED_FILTER_KEY_ALLOCATION_MISSING", "FIXED_FILTER_KEY_ALLOCATION_INVALID", "FIXED_FILTER_KEY_ALLOCATION_COLLISION"]) || !readiness.interArtifactResponsibilities?.localRuntime?.includes("keysByRequestId")) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_LOCAL_RUNTIME_DEPENDENCY_MISSING", "The Local Runtime lowering dependency is incomplete.");
if (!/LayoutID, ListID, URL, route key, layout index/u.test(readiness.interArtifactResponsibilities?.hostMaterializer || "")) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_HOST_BOUNDARY_INVALID", "The host-owned additional-view identity boundary is incomplete.");
for (const proof of ["compiled source export and seven-case corpus parity", "Plugin dist export and corpus parity", "temporary official ZIP export and corpus parity", "simulated installed Plugin export and corpus parity", "exact manifest path, version, checksum, and export-list parity", "workspace, source, node_modules, source-map, and bare-import leakage gates", "unexpected public export and host-shape leakage gates"]) if (!readiness.futureDistributionEvidence?.requiredProof?.includes(proof)) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_DISTRIBUTION_PLAN_MISSING", "The future distribution evidence plan is incomplete.");
for (const proof of ["source parity", "official ZIP parity", "simulated installed Plugin parity", "deterministic normalized decoded resource output with controlled host UUID allocation", "default-view regression protection", "temporary-copy-only Legacy rollback", "retained Local Runtime allocation and findings-lowering ownership"]) if (!readiness.futureSelectiveRoutingEvidence?.requiredProof?.includes(proof)) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_ROUTING_PLAN_MISSING", "The future routing and rollback evidence plan is incomplete.");
if (/[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/u.test(JSON.stringify(readiness))) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_NON_ENGLISH", "The Phase 5T readiness contract must be English-only.");
console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_API_READINESS_ACCEPTED");
console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_API_READINESS_VALID");

function same(value, expected) { return Array.isArray(value) && JSON.stringify(value) === JSON.stringify(expected); }
function argument(option, fallback) { const index = process.argv.indexOf(option); return resolve(root, index < 0 ? fallback : process.argv[index + 1]); }
function read(relativePath) { return readFileSync(relativePath, "utf8"); }
function json(relativePath) { try { return JSON.parse(read(relativePath)); } catch (error) { fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_READINESS_INVALID_JSON", error.message); } }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

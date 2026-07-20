#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const coreReadiness = json(argument("--core-readiness", "compatibility/capability-manifests/app-builder-core-materializer-lookup-resolution-public-api-readiness.v0.1.0.json"));
const runtimeReadiness = json(argument("--runtime-readiness", "compatibility/capability-manifests/app-builder-core-local-runtime-lookup-resolution-public-api-readiness.v0.1.0.json"));
const dualReadiness = json(argument("--dual-readiness", "compatibility/capability-manifests/data-list-lookup-resolution-dual-distribution-readiness.v0.1.0.json"));
const coreIndex = read(argument("--core-index", "packages/app-builder-core-materializer/src/index.ts"));
const runtimeIndex = read(argument("--runtime-index", "runtimes/app-builder-core-local-runtime/src/index.ts"));
const coreSource = read("packages/app-builder-core-materializer/src/internal/data-list-lookup-resolution-intent.ts");
const runtimeSource = read("runtimes/app-builder-core-local-runtime/src/internal-data-list-lookup-resolution-lowering.ts");
const distribution = json("compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json");
const fixture = json("compatibility/differential-fixtures/data-list-lookup-resolution-shadow.v0.1.0.json");
const errors = ["LOOKUP_RESOLUTION_TARGET_MAPPING_MISSING", "LOOKUP_RESOLUTION_TARGET_LIST_ID_INVALID", "LOOKUP_RESOLUTION_TARGET_SCOPE_MISMATCH", "LOOKUP_RESOLUTION_SOURCE_TARGET_RELATIONSHIP_BROKEN", "DATA_LIST_LOOKUP_TARGET_UNRESOLVED", "LOOKUP_RESOLUTION_TARGET_MAPPING_AMBIGUOUS"];

if (coreReadiness.decision?.status !== "accepted" || coreReadiness.decision?.marker !== "DATA_LIST_LOOKUP_RESOLUTION_CORE_PUBLIC_API_READINESS_ACCEPTED" || coreReadiness.prospectiveRuntimeExport !== "projectDataListLookupResolutionIntent") fail("DATA_LIST_LOOKUP_RESOLUTION_CORE_READINESS_INVALID", "The prospective Core API decision is incomplete.");
if (!sameArray(coreReadiness.prospectiveTypeExports, ["DataListLookupIntentInput", "DataListLookupResolutionRequest", "DataListLookupIntent", "DataListLookupValidationFinding", "DataListLookupIntentProjectionResult"]) || !includesAll(coreReadiness.prohibitedPublicShapes, ["ListID", "FieldID", "target ListID", "target mapping", "host source context", "Legacy Rules string", "Legacy field record", "mutable template", "caller-owned findings array", "generated resource", "host runtime state"])) fail("DATA_LIST_LOOKUP_RESOLUTION_CORE_SHAPE_LEAKAGE", "The Core readiness contract exposes a host or Legacy shape.");
if (runtimeReadiness.decision?.status !== "accepted" || runtimeReadiness.decision?.marker !== "DATA_LIST_LOOKUP_RESOLUTION_LOCAL_RUNTIME_PUBLIC_API_READINESS_ACCEPTED" || runtimeReadiness.prospectiveRuntimeExport !== "lowerDataListLookupResolutionAtHost") fail("DATA_LIST_LOOKUP_RESOLUTION_LOCAL_RUNTIME_READINESS_INVALID", "The prospective Local Runtime API decision is incomplete.");
if (!sameArray(runtimeReadiness.stableErrors, errors) || !runtimeReadiness.mutationOwnership?.includes("does not mutate") || !includesAll(runtimeReadiness.prohibitedBehavior, ["fallback target mapping", "ID allocation", "lookup API access", "template or resource mutation", "Legacy fallback"])) fail("DATA_LIST_LOOKUP_RESOLUTION_LOCAL_RUNTIME_CONTRACT_INVALID", "The Local Runtime contract lacks required errors or host restrictions.");
if (dualReadiness.decision?.status !== "accepted" || dualReadiness.decision?.marker !== "DATA_LIST_LOOKUP_RESOLUTION_DUAL_DISTRIBUTION_READINESS_VALID" || dualReadiness.decision?.nextPhase !== "phase-6d-data-list-lookup-resolution-dual-public-distribution-promotion") fail("DATA_LIST_LOOKUP_RESOLUTION_DUAL_READINESS_INVALID", "The dual-artifact decision is incomplete.");
if (!includesText(dualReadiness.futurePhase6DProof, ["15-case corpus on source, dist, ZIP, and installed", "exact export lists, manifest identity, paths, versions, and checksums"]) || !includesText(dualReadiness.futurePhase6ERoutingProof, ["deterministic output, all six errors, lossless 19-digit IDs, and scope gates", "temporary-copy-only Legacy rollback"])) fail("DATA_LIST_LOOKUP_RESOLUTION_PROOF_PLAN_INCOMPLETE", "The distribution or routing proof plan is incomplete.");
if (!includesAll(dualReadiness.scopeExclusions, ["sublists", "approval forms", "document libraries", "dashboards", "workflows"])) fail("DATA_LIST_LOOKUP_RESOLUTION_SCOPE_WIDENED", "The readiness contract widened beyond Data List Lookup fields.");
const corePublicReexport = 'export { projectDataListLookupResolutionIntentInternal as projectDataListLookupResolutionIntent } from "./internal/data-list-lookup-resolution-intent.js";';
const runtimePublicReexport = 'export { lowerDataListLookupResolutionAtHost } from "./internal-data-list-lookup-resolution-lowering.js";';
if (!coreIndex.includes(corePublicReexport) || occurrences(coreIndex, "projectDataListLookupResolutionIntentInternal") !== 1 || occurrences(runtimeIndex, runtimePublicReexport) !== 1) fail("DATA_LIST_LOOKUP_RESOLUTION_ACCIDENTAL_PUBLIC_EXPORT", "Only the approved Phase 6D public re-exports may expose the Lookup boundary.");
if (!coreSource.includes("projectDataListLookupResolutionIntentInternal") || /targetListIdsByLogicalKey|randomUUID|node:|process\.|readFile|writeFile/.test(coreSource)) fail("DATA_LIST_LOOKUP_RESOLUTION_CORE_BOUNDARY_INVALID", "The Core implementation is not a pure intent boundary.");
if (!runtimeSource.includes("lowerDataListLookupResolutionAtHost") || !errors.every((code) => runtimeSource.includes(code)) || /randomUUID|process\.|readFile|writeFile/.test(runtimeSource)) fail("DATA_LIST_LOOKUP_RESOLUTION_LOCAL_RUNTIME_BOUNDARY_INVALID", "The Local Runtime implementation is missing a stable host boundary.");
const materializerArtifact = distribution.approvedArtifacts?.find((item) => item.packageName === "@yeeflow/app-builder-core-materializer");
const runtimeArtifact = distribution.approvedArtifacts?.find((item) => item.packageName === "@yeeflow/app-builder-core-local-runtime");
if (!materializerArtifact || !runtimeArtifact || !materializerArtifact.exports.includes("projectDataListLookupResolutionIntent") || !runtimeArtifact.exports.includes("lowerDataListLookupResolutionAtHost")) fail("DATA_LIST_LOOKUP_RESOLUTION_ACCIDENTAL_DISTRIBUTION_PROMOTION", "The approved Phase 6D Lookup exports are missing from the artifact contract.");
if (!Array.isArray(fixture.cases) || fixture.cases.length !== 15) fail("DATA_LIST_LOOKUP_RESOLUTION_READINESS_FIXTURE_INVALID", "The proven internal shadow corpus is unavailable.");
if (Object.values(coreReadiness.auditMutations || {}).some(Boolean) || Object.values(runtimeReadiness.auditMutations || {}).some(Boolean) || Object.values(dualReadiness.auditMutations || {}).some(Boolean)) fail("DATA_LIST_LOOKUP_RESOLUTION_AUDIT_MUTATION_FORBIDDEN", "A readiness audit cannot modify exports, artifacts, adapters, routes, or Legacy behavior.");
console.log("DATA_LIST_LOOKUP_RESOLUTION_CORE_PUBLIC_API_READINESS_ACCEPTED");
console.log("DATA_LIST_LOOKUP_RESOLUTION_LOCAL_RUNTIME_PUBLIC_API_READINESS_ACCEPTED");
console.log("DATA_LIST_LOOKUP_RESOLUTION_DUAL_DISTRIBUTION_READINESS_VALID");

function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function includesAll(values, expected) { return Array.isArray(values) && expected.every((value) => values.includes(value)); }
function includesText(values, expected) { return Array.isArray(values) && expected.every((text) => values.some((value) => String(value).includes(text))); }
function sameArray(values, expected) { return JSON.stringify(values) === JSON.stringify(expected); }
function occurrences(value, text) { return value.split(text).length - 1; }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

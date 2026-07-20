#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const core = json(argument("--core-contract", "compatibility/capability-manifests/data-list-type1-identity-control-placement-core-public-api-readiness.v0.1.0.json"));
const runtime = json(argument("--runtime-contract", "compatibility/capability-manifests/data-list-type1-identity-control-placement-local-runtime-public-api-readiness.v0.1.0.json"));
const dual = json(argument("--dual-contract", "compatibility/capability-manifests/data-list-type1-identity-control-placement-dual-distribution-readiness.v0.1.0.json"));
const coreIndex = read("packages/app-builder-core-materializer/src/index.ts");
const runtimeIndex = read("runtimes/app-builder-core-local-runtime/src/index.ts");
const coreSource = read("packages/app-builder-core-materializer/src/internal/data-list-type1-identity-control-placement.ts");
const runtimeSource = read("runtimes/app-builder-core-local-runtime/src/internal-data-list-type1-identity-control-placement-lowering.ts");
const corpus = json("compatibility/differential-fixtures/data-list-type1-identity-user-control-placement.v0.1.0.json");
const errors = ["TEMPLATE_GRAPH_REFERENCE_MISSING", "TEMPLATE_GRAPH_REFERENCE_INVALID", "TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH", "TEMPLATE_GRAPH_REFERENCE_DUPLICATE", "TEMPLATE_GRAPH_REFERENCE_RELATIONSHIP_BROKEN"];
if (core.decision?.status !== "accepted" || core.decision?.marker !== "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_PUBLIC_API_READINESS_ACCEPTED" || core.prospectiveApi?.function !== "projectDataListType1IdentityControlPlacement" || !Array.isArray(core.prospectiveApi?.publicDtos) || core.prospectiveApi.publicDtos.length !== 5) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_READINESS_INVALID", "The prospective Core API is incomplete.");
if (!Array.isArray(core.inputBoundary?.prohibited) || !["control ID", "mutable template object", "host context or allocation map", "Legacy control fragment", "runtime expression", "resource record", "package or runtime state"].every((value) => core.inputBoundary.prohibited.includes(value)) || !core.outputBoundary?.guarantees?.includes("no control ID")) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_LEAKAGE", "The Core contract leaks host or Legacy shapes.");
if (runtime.decision?.status !== "accepted" || runtime.decision?.marker !== "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_LOCAL_RUNTIME_PUBLIC_API_READINESS_ACCEPTED" || runtime.prospectiveApi?.function !== "lowerDataListType1IdentityControlPlacementAtHost" || !errors.every((code) => runtime.errorContract?.codes?.includes(code)) || !runtime.errorContract?.guarantees?.includes("control ID is required and host supplied")) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_RUNTIME_READINESS_INVALID", "The prospective Local Runtime API or error contract is incomplete.");
if (dual.decision?.status !== "accepted" || dual.decision?.marker !== "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_DUAL_DISTRIBUTION_READINESS_VALID" || dual.corpus?.caseCount !== 21 || !Array.isArray(dual.contracts) || dual.contracts.length !== 2) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_DUAL_READINESS_INVALID", "The dual readiness contract is incomplete.");
if (JSON.stringify(dual.scope?.included) !== JSON.stringify(["Data List Type 1 view", "Data List Type 1 workbench", "non-sublist identity user people person fields"]) || !Array.isArray(dual.scope?.excluded) || !["sublist", "department", "file image binary", "barcode", "Lookup placement", "Type 0 views", "Approval Forms", "Document Libraries", "Dashboards", "workflows"].every((value) => dual.scope.excluded.includes(value))) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ROUTING_SCOPE_INVALID", "The routing plan widens beyond approved Type 1 identity controls.");
if (!Array.isArray(dual.requiredFutureProof?.distribution) || !["source", "Plugin dist", "temporary official ZIP", "simulated installed Plugin"].every((value) => dual.requiredFutureProof.distribution.includes(value)) || !Array.isArray(dual.requiredFutureProof?.routing) || !dual.requiredFutureProof.routing.includes("temporary-copy-only Legacy rollback")) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_PROOF_PLAN_INCOMPLETE", "Source archive installed or rollback proof is missing.");
const approvedCoreReexport = 'export { projectDataListType1IdentityControlPlacementInternal as projectDataListType1IdentityControlPlacement } from "./internal/data-list-type1-identity-control-placement.js";';
const approvedRuntimeReexport = 'export { lowerDataListType1IdentityControlPlacementAtHost } from "./internal-data-list-type1-identity-control-placement-lowering.js";';
if (occurrences(coreIndex, approvedCoreReexport) !== 1 || occurrences(runtimeIndex, approvedRuntimeReexport) !== 1 || occurrences(coreIndex, "projectDataListType1IdentityControlPlacementInternal") !== 1) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ACCIDENTAL_PUBLIC_EXPORT", "Only the approved Phase 7D aliases may promote the prospective APIs.");
if (!coreSource.includes("projectDataListType1IdentityControlPlacementInternal") || /randomUUID|node:|process\.|readFile|writeFile|controlId/.test(coreSource) || !runtimeSource.includes("lowerDataListType1IdentityControlPlacementAtHost") || !errors.every((code) => runtimeSource.includes(code))) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_BOUNDARY_DRIFT", "The proven internal boundaries drifted.");
if (corpus.caseCount !== 21 || corpus.cases.length !== 21 || !errors.every((code) => corpus.cases.some((item) => item.error === code))) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORPUS_DRIFT", "The 21-case parity corpus drifted.");
console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_PUBLIC_API_READINESS_ACCEPTED");
console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_LOCAL_RUNTIME_PUBLIC_API_READINESS_ACCEPTED");
console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_DUAL_DISTRIBUTION_READINESS_VALID");

function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function occurrences(value, text) { return value.split(text).length - 1; }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

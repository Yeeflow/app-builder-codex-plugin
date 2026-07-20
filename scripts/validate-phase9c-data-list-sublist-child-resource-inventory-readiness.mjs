#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const api = json(argument("--api-contract", "compatibility/capability-manifests/data-list-sublist-child-resource-inventory-local-runtime-public-api-readiness.v0.1.0.json"));
const distribution = json(argument("--distribution-contract", "compatibility/capability-manifests/data-list-sublist-child-resource-inventory-local-runtime-distribution-readiness.v0.1.0.json"));
const host = read(argument("--host", "runtimes/app-builder-core-local-runtime/src/internal-data-list-sublist-child-resource-inventory.ts"));
const runtimeIndex = read(argument("--runtime-index", "runtimes/app-builder-core-local-runtime/src/index.ts"));
const artifact = read(argument("--artifact", "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"));
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
const lineage = json("compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json");
const corpus = json("compatibility/differential-fixtures/data-list-sublist-child-resource-inventory-shadow.v0.1.0.json");
const errors = ["SUBLIST_CHILD_RESOURCE_IDENTITY_MISSING", "SUBLIST_CHILD_RESOURCE_IDENTITY_INVALID", "SUBLIST_CHILD_RESOURCE_IDENTITY_LOSSY", "SUBLIST_CHILD_RESOURCE_IDENTITY_DUPLICATE", "SUBLIST_CHILD_RESOURCE_IDENTITY_SCOPE_MISMATCH", "SUBLIST_CHILD_RESOURCE_IDENTITY_RELATIONSHIP_BROKEN", "SUBLIST_ROW_SCHEMA_IDENTITY_MISSING", "SUBLIST_ROW_SCHEMA_IDENTITY_INVALID", "SUBLIST_ROW_SCHEMA_IDENTITY_DUPLICATE", "SUBLIST_ROW_SCHEMA_IDENTITY_SCOPE_MISMATCH", "SUBLIST_ROW_SCHEMA_IDENTITY_RELATIONSHIP_BROKEN"];
const functionName = "buildDataListSublistChildResourceInventoryAtHost";
if (api.decision?.status !== "accepted" || api.decision?.marker !== "SUBLIST_CHILD_RESOURCE_INVENTORY_LOCAL_RUNTIME_PUBLIC_API_READINESS_ACCEPTED" || api.prospectiveApi?.function !== functionName || api.prospectiveApi?.publicDtos?.length !== 5) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_PUBLIC_API_READINESS_INVALID");
if (!api.inputBoundary?.allowed?.includes("explicit post-API-allocation host data") || !["allocation authority", "API handle or API call", "mutable resource graph", "mutable package state", "row-schema generation", "Legacy fallback", "numeric or lossy identity"].every((value) => api.inputBoundary?.prohibited?.includes(value))) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_PUBLIC_API_LEAKAGE");
if (!api.outputBoundary?.allowed?.includes("deep-frozen descriptorsByParentField object") || !["Legacy record fragment", "control ID", "row-schema creation", "mutable resource", "package state", "private helper exposure"].every((value) => api.outputBoundary?.prohibited?.includes(value))) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_OUTPUT_LEAKAGE");
if (!same(api.errorContract?.codes, errors) || !api.errorContract?.guarantees?.includes("no fallback allocation or inferred child resource exists")) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_ERROR_CONTRACT_INVALID");
if (distribution.decision?.status !== "accepted" || distribution.decision?.marker !== "SUBLIST_CHILD_RESOURCE_INVENTORY_DISTRIBUTION_READINESS_VALID" || distribution.prospectiveArtifact?.requiredExport !== functionName || distribution.prospectiveArtifact?.currentArtifactContainsProspectiveExport !== false || distribution.corpus?.caseCount !== 20) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_DISTRIBUTION_READINESS_INVALID");
if (!["compiled Local Runtime source", "official Plugin dist artifact", "temporary official ZIP extraction", "simulated installed Plugin layout"].every((value) => distribution.futurePromotionProof?.includes(value))) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_DISTRIBUTION_PROOF_INCOMPLETE");
if (!distribution.futureRoutingPrerequisites?.includes("one shared inventory selection supplied to both buildDataListFormSubListControl and buildFieldRules") || !distribution.futureRoutingPrerequisites?.includes("temporary-copy-only Legacy rollback restoring the shared bridge")) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_ROUTING_PLAN_INCOMPLETE");
if (distribution.phase8EDependency?.status !== "blocked" || state.proofStatus?.dataListSublistScalarRowSchemaCoupledConsumerRouting !== "blocked_missing_child_identity_map_not_wired") fail("SUBLIST_CHILD_RESOURCE_INVENTORY_PHASE8E_STATUS_DRIFT");
if (!host.includes("buildDataListSublistChildResourceInventoryInternal") || !errors.every((code) => host.includes(code)) || /node:|process\.|readFile|writeFile|randomUUID|crypto\.|fetch\(/.test(host)) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_HOST_BOUNDARY_INVALID");
const promotion = lineage.approvedTransitions?.find((item) => item.phase === "phase-9d-data-list-sublist-child-resource-inventory-local-runtime-public-api-and-distribution-promotion");
const approvedAlias = `export { buildDataListSublistChildResourceInventoryInternal as ${functionName} } from "./internal-data-list-sublist-child-resource-inventory.js";`;
if (!promotion && (runtimeIndex.includes(functionName) || runtimeIndex.includes("buildDataListSublistChildResourceInventoryInternal") || artifact.includes(functionName) || artifact.includes("buildDataListSublistChildResourceInventoryInternal"))) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_ACCIDENTAL_PUBLIC_PROMOTION");
if (promotion && (!runtimeIndex.includes(approvedAlias) || /export\s*\{\s*buildDataListSublistChildResourceInventoryInternal\s*\}/u.test(runtimeIndex) || artifact.includes("buildDataListSublistChildResourceInventoryInternal") || !artifact.includes(`function ${functionName}`) || promotion.artifactState?.["@yeeflow/app-builder-core-local-runtime"]?.sha256 !== sha(artifact))) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_ACCIDENTAL_PUBLIC_PROMOTION");
if (!errors.every((code) => corpus.cases.some((item) => item.error === code)) || corpus.caseCount !== 20 || corpus.cases.length !== 20) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_CORPUS_DRIFT");
if (!["workspace import", "TypeScript source path", "repository path", "node_modules", "source map", "bare package import", "private helper export", "allocation or API exposure", "mutable resource or package-state exposure"].every((value) => distribution.leakageGates?.includes(value))) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_LEAKAGE_PLAN_INCOMPLETE");
if (!promotion) for (const [name, expected] of Object.entries(distribution.artifactState || {})) { const actual = sha(read(`dist/yeeflow-app-builder-plugin/${expected.path}`)); if (actual !== expected.sha256) fail(`SUBLIST_CHILD_RESOURCE_INVENTORY_${name.toUpperCase()}_ARTIFACT_DRIFT`); }
console.log("SUBLIST_CHILD_RESOURCE_INVENTORY_LOCAL_RUNTIME_PUBLIC_API_READINESS_ACCEPTED");
console.log("SUBLIST_CHILD_RESOURCE_INVENTORY_DISTRIBUTION_READINESS_VALID");

function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function same(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
function fail(code) { console.error(code); process.exit(1); }

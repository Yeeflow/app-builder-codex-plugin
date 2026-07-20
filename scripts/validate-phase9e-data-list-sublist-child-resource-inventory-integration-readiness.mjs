#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = json(argument("--contract", "compatibility/capability-manifests/data-list-sublist-child-resource-inventory-post-allocation-integration-readiness.v0.1.0.json"));
const flow = json(argument("--flow", "compatibility/capability-manifests/data-list-sublist-child-resource-inventory-post-allocation-identity-flow.v0.1.0.json"));
const sourcePath = argument("--source", "scripts/materialize-full-app-generated-final.mjs");
const source = read(sourcePath);
const requiredAbsent = ["childListId", "childFieldId", "rowSchemaId"];
const forbidden = ["plan idx", "deterministic UUID", "placeholder", "parent identity", "numeric coercion", "fallback allocation", "inferred child resource"];
if (contract.decision?.status !== "rejected" || contract.decision?.marker !== "SUBLIST_CHILD_RESOURCE_INVENTORY_INTEGRATION_READINESS_REJECTED" || !contract.decision?.externalPrerequisite?.includes("API-issued")) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_INTEGRATION_DECISION_INVALID");
if (flow.source?.path !== "scripts/materialize-full-app-generated-final.mjs" || flow.source?.sha256 !== sha(source) || contract.evidence?.source?.sha256 !== sha(source)) fail("SUBLIST_CHILD_RESOURCE_INTEGRATION_SOURCE_DRIFT");
if (flow.allocationBoundary?.function !== "allocateIds" || flow.allocationBoundary?.callerCount !== 1 || flow.allocationBoundary?.requestPlanner?.function !== "buildIdPaths" || flow.allocationBoundary?.requestPlanner?.callerCount !== 1 || flow.minimalFutureIntegrationPoint?.function !== "buildResourceGraphPackage" || flow.minimalFutureIntegrationPoint?.callerCount !== 1 || flow.minimalFutureIntegrationPoint?.status !== "not constructible from current API response" || !flow.minimalFutureIntegrationPoint?.position?.startsWith("function entry after allocateIds")) fail("SUBLIST_CHILD_RESOURCE_INTEGRATION_BOUNDARY_INVALID");
if (!same(flow.allocationBoundary?.absentRequestedPaths, ["Sublist child ListID", "Sublist child FieldID", "Sublist row-schema identity"])) fail("SUBLIST_CHILD_RESOURCE_INTEGRATION_IDENTITY_OMITTED");
if (!same(flow.coupledConsumers?.map((item) => `${item.function}:${item.callLine}`), ["buildDataListFormSubListControl:4777", "buildFieldRules:4960"])) fail("SUBLIST_CHILD_RESOURCE_INTEGRATION_ONE_CONSUMER_ONLY");
for (const name of requiredAbsent) { const identity = flow.identities?.find((item) => item.identity === name); if (!identity || identity.availability !== "absent" || identity.source !== "unavailable" || identity.representation !== "required lossless non-empty decimal string") fail("SUBLIST_CHILD_RESOURCE_INTEGRATION_IDENTITY_OMITTED"); if (!["plan idx", "deterministic UUID", "placeholder", "parent identity"].every((value) => identity.prohibitedRepresentations?.includes(value))) fail("SUBLIST_CHILD_RESOURCE_INTEGRATION_PROHIBITED_SUBSTITUTION"); }
for (const name of ["parentListId", "parentFieldId"]) { const identity = flow.identities?.find((item) => item.identity === name); if (!identity || identity.availability !== "available" || identity.representation !== "lossless non-empty decimal string") fail("SUBLIST_CHILD_RESOURCE_INTEGRATION_PARENT_IDENTITY_INVALID"); }
if (!forbidden.every((value) => flow.prohibitedSubstitutions?.includes(value))) fail("SUBLIST_CHILD_RESOURCE_INTEGRATION_PROHIBITED_SUBSTITUTION");
if (!source.includes("const idPaths = buildIdPaths(planDemand);") || !source.includes("const ids = allocateIds(idSource.ids, idPaths, findings);") || !source.includes("function buildResourceGraphPackage(") || !source.includes("function dataListSubListVariables(field, seed)") || !source.includes("deterministicUuid(`${seed}:row:${id}:${index}`)")) fail("SUBLIST_CHILD_RESOURCE_INTEGRATION_SOURCE_BOUNDARY_DRIFT");
if ((source.match(/buildResourceGraphPackage\(/g) || []).length !== 2 || (source.match(/dataListSubListVariables\(/g) || []).length !== 3) fail("SUBLIST_CHILD_RESOURCE_INTEGRATION_CALLER_COUNT_DRIFT");
for (const [path, hash] of Object.entries(contract.protectedAuditOnlyFiles || {})) if (sha(read(argument(optionFor(path), path))) !== hash) fail("SUBLIST_CHILD_RESOURCE_INTEGRATION_AUDIT_MUTATION", path);
if (contract.phase8EDependency?.status !== "blocked" || contract.auditMutations?.productionSource !== false || contract.auditMutations?.adapters !== false || contract.auditMutations?.artifacts !== false || contract.auditMutations?.publicApis !== false) fail("SUBLIST_CHILD_RESOURCE_INTEGRATION_AUDIT_SCOPE_INVALID");
console.log("SUBLIST_CHILD_RESOURCE_INVENTORY_POST_ALLOCATION_BOUNDARY_AUDITED");
console.log("SUBLIST_CHILD_RESOURCE_INVENTORY_INTEGRATION_READINESS_REJECTED");

function optionFor(path) { return path === "scripts/materialize-full-app-generated-final.mjs" ? "--source" : path === "scripts/lib/materializer-core-adapter.mjs" ? "--materializer-adapter" : path === "scripts/lib/local-runtime-core-adapter.mjs" ? "--runtime-adapter" : path === "runtimes/app-builder-core-local-runtime/src/index.ts" ? "--runtime-index" : path.includes("planning") ? "--planning-artifact" : path.includes("materializer") ? "--materializer-artifact" : "--runtime-artifact"; }
function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function same(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
function fail(code, detail = "") { console.error(`${code}${detail ? `: ${detail}` : ""}`); process.exit(1); }

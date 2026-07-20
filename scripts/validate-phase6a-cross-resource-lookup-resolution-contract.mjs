#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = json(argument("--contract", "compatibility/capability-manifests/cross-resource-lookup-resolution-host-contract.v0.1.0.json"));
const fixture = json(argument("--fixture", "compatibility/differential-fixtures/cross-resource-lookup-resolution.v0.1.0.json"));
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const source = read(sourcePath);
const requiredErrors = ["LOOKUP_RESOLUTION_TARGET_MAPPING_MISSING", "LOOKUP_RESOLUTION_TARGET_LIST_ID_INVALID", "LOOKUP_RESOLUTION_TARGET_SCOPE_MISMATCH", "LOOKUP_RESOLUTION_SOURCE_TARGET_RELATIONSHIP_BROKEN", "DATA_LIST_LOOKUP_TARGET_UNRESOLVED", "LOOKUP_RESOLUTION_TARGET_MAPPING_AMBIGUOUS"];

if (contract.decision?.marker !== "PHASE_6_LOOKUP_CONTRACT_ACCEPTED" || contract.decision?.status !== "accepted" || contract.decision?.futurePhase !== "phase-6b-data-list-lookup-resolution-core-shadow") fail("CROSS_RESOURCE_LOOKUP_RESOLUTION_DECISION_INVALID", "The bounded Phase 6B Lookup shadow decision is incomplete.");
if (contract.source?.path !== sourcePath) fail("CROSS_RESOURCE_LOOKUP_RESOLUTION_SOURCE_DRIFT", "The audited Lookup source path changed after the contract was generated.");
if (contract.source?.sha256 !== sha256(source) && (!source.includes("DATA_LIST_LOOKUP_RESOLUTION_CORE_ROUTE_START") || !source.includes("coreProjectDataListLookupResolutionIntent") || !source.includes("coreLowerDataListLookupResolutionAtHost"))) fail("CROSS_RESOURCE_LOOKUP_RESOLUTION_SOURCE_DRIFT", "The audited Lookup source changed outside the approved Phase 6E route.");
if (!contract.legacyBoundary?.path?.includes("resolveLookupTargetListId") || !contract.legacyBoundary?.path?.includes("buildFieldRules") || !contract.legacyBoundary?.functions?.every((item) => item.productionCallerCount >= 1)) fail("CROSS_RESOURCE_LOOKUP_RESOLUTION_LEGACY_BOUNDARY_INVALID", "The Legacy Lookup boundary or caller evidence is incomplete.");
if (!contract.legacyBoundary?.propagation?.includes("lossless") || !contract.legacyBoundary?.propagation?.includes("Rules.listid")) fail("CROSS_RESOURCE_LOOKUP_RESOLUTION_IDENTITY_PROPAGATION_INVALID", "Lookup identity propagation must remain explicit and lossless.");
if (!Array.isArray(contract.errors?.codes) || JSON.stringify(contract.errors.codes) !== JSON.stringify(requiredErrors) || !requiredErrors.every((code) => contract.errors.semantics?.[code])) fail("CROSS_RESOURCE_LOOKUP_RESOLUTION_ERRORS_INVALID", "The stable Lookup-resolution error contract is incomplete.");
if (!contract.futureCoreContract?.prohibitions?.includes("target map lookup") || !contract.futureCoreContract?.prohibitions?.includes("fallback target discovery") || !contract.futureCoreContract?.prohibitions?.includes("template loading or mutation")) fail("CROSS_RESOURCE_LOOKUP_RESOLUTION_CORE_BOUNDARY_INVALID", "The proposed Core boundary permits host behavior.");
if (!contract.hostContract?.responsibilities?.includes("reject ambiguous candidates") || !contract.hostContract?.responsibilities?.includes("validate lossless target ListID strings") || !contract.hostContract?.mutation?.includes("must not mutate")) fail("CROSS_RESOURCE_LOOKUP_RESOLUTION_HOST_BOUNDARY_INVALID", "The host resolution boundary is incomplete.");
if (!Array.isArray(contract.exclusions) || !["approval forms", "document libraries", "dashboards", "sublists", "production routing"].every((item) => contract.exclusions.includes(item))) fail("CROSS_RESOURCE_LOOKUP_RESOLUTION_SCOPE_WIDENED", "The Lookup contract includes an excluded surface or routing behavior.");
if (!Array.isArray(fixture.cases) || fixture.cases.length < 14 || !["valid-exact-target", "lossless-nineteen-digit-target", "missing-target-mapping", "numeric-target-id", "wrong-target-scope", "broken-source-field-relationship", "ambiguous-target-mapping", "excluded-sublist", "excluded-approval-form", "excluded-document-library", "excluded-dashboard"].every((id) => fixture.cases.some((item) => item.id === id))) fail("CROSS_RESOURCE_LOOKUP_RESOLUTION_FIXTURE_INCOMPLETE", "The Lookup fixture matrix is incomplete.");
if (Object.values(contract.auditMutations || {}).some((value) => value !== false)) fail("CROSS_RESOURCE_LOOKUP_RESOLUTION_AUDIT_MUTATION_FORBIDDEN", "The audit must not change routing, APIs, artifacts, or Plugin distribution.");
console.log("DATA_LIST_LOOKUP_LEGACY_BOUNDARY_AUDITED");
console.log("CROSS_RESOURCE_LOOKUP_RESOLUTION_CONTRACT_VALID");
console.log("PHASE_6_LOOKUP_CONTRACT_ACCEPTED");

function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

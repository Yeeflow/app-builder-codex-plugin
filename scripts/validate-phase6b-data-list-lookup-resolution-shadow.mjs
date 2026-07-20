#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corePath = "packages/app-builder-core-materializer/src/internal/data-list-lookup-resolution-intent.ts";
const hostPath = "runtimes/app-builder-core-local-runtime/src/internal-data-list-lookup-resolution-lowering.ts";
const publicCore = read("packages/app-builder-core-materializer/src/index.ts");
const publicHost = read("runtimes/app-builder-core-local-runtime/src/index.ts");
const core = read(corePath);
const host = read(hostPath);
const fixture = json("compatibility/differential-fixtures/data-list-lookup-resolution-shadow.v0.1.0.json");
const contract = json("compatibility/capability-manifests/cross-resource-lookup-resolution-host-contract.v0.1.0.json");
const legacy = read("scripts/materialize-full-app-generated-final.mjs");
const requiredErrors = ["LOOKUP_RESOLUTION_TARGET_MAPPING_MISSING", "LOOKUP_RESOLUTION_TARGET_LIST_ID_INVALID", "LOOKUP_RESOLUTION_TARGET_SCOPE_MISMATCH", "LOOKUP_RESOLUTION_SOURCE_TARGET_RELATIONSHIP_BROKEN", "DATA_LIST_LOOKUP_TARGET_UNRESOLVED", "LOOKUP_RESOLUTION_TARGET_MAPPING_AMBIGUOUS"];

if (!core.includes("projectDataListLookupResolutionIntentInternal") || !core.includes("Object.freeze") || /randomUUID|node:|process\.|readFile|targetListIdsByLogicalKey|ListID|FieldID/.test(core)) fail("DATA_LIST_LOOKUP_RESOLUTION_CORE_BOUNDARY_INVALID", "The Core Lookup intent module contains host identity or host behavior.");
if (!host.includes("lowerDataListLookupResolutionAtHost") || !requiredErrors.every((code) => host.includes(code)) || /randomUUID|process\.|readFile|writeFile|lookupTargetListId/.test(host)) fail("DATA_LIST_LOOKUP_RESOLUTION_HOST_BOUNDARY_INVALID", "The Local Runtime lowerer is incomplete or contains forbidden host behavior.");
const corePublicReexport = 'export { projectDataListLookupResolutionIntentInternal as projectDataListLookupResolutionIntent } from "./internal/data-list-lookup-resolution-intent.js";';
const hostPublicReexport = 'export { lowerDataListLookupResolutionAtHost } from "./internal-data-list-lookup-resolution-lowering.js";';
if (occurrences(publicCore, "projectDataListLookupResolutionIntentInternal") !== 1 || !publicCore.includes(corePublicReexport) || occurrences(publicHost, hostPublicReexport) !== 1) fail("DATA_LIST_LOOKUP_RESOLUTION_PUBLIC_EXPORT_FORBIDDEN", "Only the approved Phase 6D Lookup re-exports may expose the Phase 6B internal modules.");
if (!Array.isArray(fixture.cases) || fixture.cases.length < 15 || !["direct-target-success", "singular-alias-success", "lossless-nineteen-digit-target", "missing-target-mapping", "unresolved-empty-intent", "numeric-target-id", "wrong-target-scope", "broken-source-field-relationship", "ambiguous-target-mapping", "excluded-sublist", "excluded-approval-form", "excluded-document-library", "excluded-dashboard"].every((id) => fixture.cases.some((item) => item.id === id))) fail("DATA_LIST_LOOKUP_RESOLUTION_FIXTURE_INCOMPLETE", "The Phase 6B Lookup parity matrix is incomplete.");
if (contract.decision?.futurePhase !== "phase-6b-data-list-lookup-resolution-core-shadow" || !requiredErrors.every((code) => contract.errors?.codes?.includes(code))) fail("DATA_LIST_LOOKUP_RESOLUTION_CONTRACT_DRIFT", "The authoritative Phase 6A contract drifted.");
if (!legacy.includes("function resolveLookupTargetListId") || !legacy.includes("function buildFieldRules") || !legacy.includes("function validatePlannedLookupTargetsMaterialized")) fail("DATA_LIST_LOOKUP_RESOLUTION_LEGACY_BOUNDARY_MISSING", "The Legacy Lookup boundary is unavailable.");
console.log(`DATA_LIST_LOOKUP_RESOLUTION_INTERNAL_SHADOW_VALID core=${sha256(core)} host=${sha256(host)}`);

function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function occurrences(value, text) { return value.split(text).length - 1; }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

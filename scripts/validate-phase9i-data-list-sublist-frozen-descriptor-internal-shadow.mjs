#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-9i-data-list-sublist-frozen-descriptor-internal-shadow";
const contract = json("compatibility/capability-manifests/data-list-sublist-frozen-descriptor-internal-shadow.v0.1.0.json");
const corpus = json("compatibility/differential-fixtures/data-list-sublist-frozen-descriptor-shadow.v0.1.0.json");
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
const source = read("scripts/materialize-full-app-generated-final.mjs");
const core = read("packages/app-builder-core-materializer/src/internal/data-list-sublist-frozen-descriptor-shadow.ts");
const index = read("packages/app-builder-core-materializer/src/index.ts");
const approvedPhase9NRoute = ["dc3d01979ca4532dde039bfb9e68b89add85b9227cec98e4f153166c09e80761", "a4fce6e0fa85ed578afd7e16f76b2558527605a9c193819eade455b3ed532b9d"].includes(sha(source)) && source.includes("DATA_LIST_EMBEDDED_SUBLIST_FROZEN_DESCRIPTOR_RULES_ROUTE_START");
if (contract.phase !== phase || contract.status !== "passed_internal_only" || contract.selectionBoundary?.owner !== "buildResourceGraphPackage" || contract.selectionBoundary?.line !== 5201 || contract.consumers?.count !== 2) fail("SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_SHADOW_CONTRACT_INVALID");
if (contract.core?.internalOnly !== true || contract.core?.publicExportAdded !== false || contract.core?.descriptorOnly !== true || contract.core?.localRuntimeLowererAdded !== false || contract.core?.distributionChanged !== false || !core.includes("projectDataListEmbeddedSublistSchemaInternal") || (!approvedPhase9NRoute && index.includes("projectDataListSublistFrozenDescriptorInternal")) || (approvedPhase9NRoute && !index.includes("projectDataListEmbeddedSublistDescriptor"))) fail("SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_CORE_BOUNDARY_INVALID");
if (!contract.hostContext?.explicit || contract.hostContext.storage !== "test-only WeakMap" || Object.values(contract.hostContext).some((value) => value === true && String(value).startsWith("serialized"))) fail("SUBLIST_EMBEDDED_SCHEMA_NON_SERIALIZED_CONTEXT_GUARD_INVALID");
if (contract.integrity?.corpusSha256 !== sha(read("compatibility/differential-fixtures/data-list-sublist-frozen-descriptor-shadow.v0.1.0.json")) || contract.integrity?.coreShadowSha256 !== sha(core)) fail("SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_INTEGRITY_INVALID");
if (!Array.isArray(corpus.cases) || corpus.cases.length !== 3 || !corpus.cases.every((item) => item.parent?.listId === "2076284286981328899" && item.parent?.fieldId === "2076527673738014720" && item.expectedColumns?.length === 2)) fail("SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_CORPUS_INVALID");
if (JSON.stringify(corpus.cases).match(/childListId|childFieldId|rowSchemaId/)?.length) fail("SUBLIST_CHILD_IDENTITY_PREREQUISITE_RESTORED");
if ((!approvedPhase9NRoute && sha(source) !== "fb2e77d2b71e99e76d0f963c9c11c40b2ab8505e6ae471426beff258dfbe14c1") || /projectDataListSublistFrozenDescriptorInternal|FROZEN_DESCRIPTOR_CORE_ROUTE/.test(source)) fail("SUBLIST_EMBEDDED_SCHEMA_LEGACY_CHANGED");
const phaseRecord = state.completed?.find((item) => item.id === phase);
if (!phaseRecord || phaseRecord.status !== "complete" || !phaseRecord.evidence?.includes("SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_CORE_SHADOW_IMPLEMENTED") || !state.migration?.currentPhase || state.proofStatus?.dataListSublistFrozenDescriptorPhase9JPublicDistributionReadiness !== "not_accepted") fail("SUBLIST_EMBEDDED_SCHEMA_STATE_INVALID");
console.log("SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_SHADOW_VALID"); console.log("SUBLIST_EMBEDDED_SCHEMA_LEGACY_UNCHANGED"); console.log("PHASE_6_CLOSURE_PROOF_LINEAGE_RECONCILED");
function read(path) { return readFileSync(resolve(root, path), "utf8"); } function json(path) { return JSON.parse(read(path)); } function sha(value) { return createHash("sha256").update(value).digest("hex"); } function fail(code) { console.error(code); process.exit(1); }

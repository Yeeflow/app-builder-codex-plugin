#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ledger = json(argument("--ledger", "compatibility/capability-manifests/data-list-sublist-child-identity-provenance.v0.1.0.json"));
const matrix = json(argument("--matrix", "compatibility/capability-manifests/data-list-sublist-child-identity-source-of-truth-timing.v0.1.0.json"));
const source = read(argument("--source", "scripts/materialize-full-app-generated-final.mjs"));
const expectedMissing = ["childListId", "childFieldId", "rowSchemaId"];
if (ledger.decision?.status !== "rejected" || ledger.decision?.marker !== "SUBLIST_LEGACY_IDENTITY_PROVIDER_REJECTED" || !ledger.decision?.productApiPrerequisite?.includes("API-issued")) fail("SUBLIST_LEGACY_IDENTITY_PROVIDER_DECISION_INVALID");
if (ledger.source?.sha256 !== sha(source) || matrix.source?.sha256 !== sha(source) || ledger.provenance?.source?.sha256 !== sha(source)) fail("SUBLIST_LEGACY_IDENTITY_PROVENANCE_SOURCE_DRIFT");
if (!same(matrix.chain?.map((item) => `${item.function}:${item.line}`), ["buildIdPaths:2666", "allocateIds:274", "buildResourceGraphPackage:284", "buildFieldRecord:5201", "buildFieldRules:4960", "buildDataListFormSubListControl:4777", "encodeYapkResourceOfficial:295"])) fail("SUBLIST_LEGACY_IDENTITY_PROVENANCE_TIMING_INVALID");
if (!same(matrix.coupledConsumerBoundary?.consumers?.map((item) => `${item.function}:${item.callLine}`), ["buildDataListFormSubListControl:4777", "buildFieldRules:4960"])) fail("SUBLIST_LEGACY_IDENTITY_PROVIDER_UNAVAILABLE_TO_CONSUMER");
const identities = matrix.identities || [];
for (const name of ["parentListId", "parentFieldId"]) { const item = identities.find((candidate) => candidate.identity === name); if (!item || item.status !== "valid-host-issued-parent-identity" || item.representation !== "lossless decimal string through allocateIds and stringId") fail("SUBLIST_LEGACY_PARENT_IDENTITY_INVALID"); }
for (const name of expectedMissing) { const item = identities.find((candidate) => candidate.identity === name); if (!item) fail("SUBLIST_LEGACY_IDENTITY_PROVENANCE_INCOMPLETE"); if (name === "rowSchemaId") { if (item.status !== "internal-presentation-key-not-provider" || item.source?.function !== "dataListSubListVariables" || item.source?.line !== 4845 || !item.notes?.includes("differ between consumers")) fail("SUBLIST_LEGACY_ROW_SCHEMA_PROVIDER_INVALID"); } else { if (/parent (?:ListID|FieldID)/u.test(JSON.stringify(item.source))) fail("SUBLIST_LEGACY_IDENTITY_PARENT_REUSE"); if (item.status !== "missing" || item.source !== null || item.allocation !== null || item.timing !== "never created or serialized" || item.representation !== "required lossless non-empty decimal string") fail("SUBLIST_LEGACY_IDENTITY_PROVIDER_INVALID"); } if (!["plan idx", "deterministic UUID", "placeholder", "numeric coercion"].every((value) => item.prohibitedCandidates?.includes(value))) fail("SUBLIST_LEGACY_IDENTITY_PROHIBITED_SUBSTITUTION"); }
if (identities.find((item) => item.identity === "childListId")?.prohibitedCandidates?.includes("parent ListID") !== true || identities.find((item) => item.identity === "childFieldId")?.prohibitedCandidates?.includes("parent FieldID") !== true) fail("SUBLIST_LEGACY_IDENTITY_PARENT_REUSE");
if (!matrix.coupledConsumerBoundary?.consequence?.includes("after their paths diverge") || !ledger.providerAssessment?.rejectedCandidates?.includes("deterministicUuid(seed)") || ledger.providerAssessment?.existingProvider !== false) fail("SUBLIST_LEGACY_IDENTITY_POST_DIVERGENCE_PROVIDER");
for (const [path, hash] of Object.entries(ledger.protectedAuditOnlyFiles || {})) if (sha(read(argument(optionFor(path), path))) !== hash) fail("SUBLIST_LEGACY_IDENTITY_AUDIT_MUTATION", path);
if (ledger.phase8EDependency?.status !== "blocked" || ledger.auditMutations?.productionSource !== false || ledger.auditMutations?.apiAllocation !== false || ledger.auditMutations?.artifacts !== false) fail("SUBLIST_LEGACY_IDENTITY_AUDIT_SCOPE_INVALID");
console.log("SUBLIST_LEGACY_IDENTITY_PROVENANCE_AUDITED");
console.log("SUBLIST_LEGACY_IDENTITY_PROVENANCE_VALID");
console.log("SUBLIST_LEGACY_IDENTITY_PROVIDER_REJECTED");

function optionFor(path) { return path === "scripts/materialize-full-app-generated-final.mjs" ? "--source" : path === "scripts/lib/materializer-core-adapter.mjs" ? "--materializer-adapter" : path === "scripts/lib/local-runtime-core-adapter.mjs" ? "--runtime-adapter" : path === "runtimes/app-builder-core-local-runtime/src/index.ts" ? "--runtime-index" : path.includes("planning") ? "--planning-artifact" : path.includes("materializer") ? "--materializer-artifact" : "--runtime-artifact"; }
function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function same(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
function fail(code, detail = "") { console.error(`${code}${detail ? `: ${detail}` : ""}`); process.exit(1); }

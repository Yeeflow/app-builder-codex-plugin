#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = readJson(argument("--contract", "compatibility/capability-manifests/fixed-filter-key-findings-host-contract.v0.1.0.json"));
const fixtures = readJson(argument("--fixtures", "compatibility/differential-fixtures/fixed-filter-key-findings-host-contract.v0.1.0.json"));
if (contract.phase !== "phase-5h-fixed-filter-key-and-findings-lowering-contract-audit" || contract.shadowReadiness?.status !== "parser_and_host_lowering_shadow_implemented_not_routed" || contract.implementationStatus?.coreParser !== "shadow_implemented_not_routed" || contract.implementationStatus?.hostLowering !== "shadow_implemented_not_routed") fail("FIXED_FILTER_HOST_CONTRACT_INVALID", "The fixed-filter host contract is incomplete.");
if (!contract.coreDtos?.keyRequest || !contract.coreDtos?.allocationResponse || !contract.coreDtos?.finding || !contract.coreDtos?.result) fail("FIXED_FILTER_HOST_CONTRACT_INVALID", "Required immutable DTO boundaries are missing.");
const prohibitions = JSON.stringify(contract.coreProhibitions || []);
if (!/crypto\.randomUUID/u.test(prohibitions)) fail("CORE_UUID_GENERATION_FORBIDDEN", "The contract must prohibit Core UUID generation.");
if (!/caller-owned arrays/u.test(prohibitions)) fail("CORE_FINDINGS_MUTATION_FORBIDDEN", "The contract must prohibit caller-owned findings mutation.");
if (!/requestId/u.test(contract.identitySemantics?.requestIdentity || "") || !/viewScope/u.test(contract.identitySemantics?.allocationScope || "")) fail("HOST_KEY_ALLOCATION_IMPLICIT", "The contract must specify deterministic request and allocation scope identities.");
if (!/immutable/u.test(contract.findingsSemantics?.shape || "") || !/never receives or mutates/u.test(contract.findingsSemantics?.hostLowering || "")) fail("CORE_FINDINGS_OUTPUT_MUTABLE", "The contract must require immutable Core findings and host-only lowering.");
for (const key of ["missingResponse", "malformedResponse", "collisions"]) if (!contract.identitySemantics?.[key]) fail("HOST_KEY_ALLOCATION_ERROR_SEMANTICS_MISSING", "The contract lacks allocation error semantics.");
if (!contract.parityAndRollback?.parity || !contract.parityAndRollback?.rollback) fail("FIXED_FILTER_HOST_CONTRACT_PROOF_BOUNDARY_MISSING", "The contract lacks parity or rollback boundaries.");
if (!Array.isArray(fixtures.fixtures) || fixtures.fixtures.length !== 10 || fixtures.fixtureCount !== 10) fail("FIXED_FILTER_HOST_CONTRACT_FIXTURE_MATRIX_INVALID", "The contract fixture matrix is incomplete.");
const ids = new Set(fixtures.fixtures.map((fixture) => fixture.id));
for (const id of ["no-filter", "one-filter", "multiple-filters", "duplicate-filters", "malformed-filter", "supplied-allocation", "missing-allocation", "colliding-allocation", "finding-ordering", "legacy-mutation"]) if (!ids.has(id)) fail("FIXED_FILTER_HOST_CONTRACT_FIXTURE_MATRIX_INVALID", `The contract lacks fixture ${id}.`);
const cjkPattern = new RegExp("[\\u3040-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff]", "u");
if (cjkPattern.test(JSON.stringify({ contract, fixtures }))) fail("FIXED_FILTER_HOST_CONTRACT_NON_ENGLISH", "Contract artifacts must be English-only.");
console.log(`FIXED_FILTER_KEY_FINDINGS_HOST_CONTRACT_VALID fixtures=${fixtures.fixtureCount}`);

function argument(option, fallback) { const index = process.argv.indexOf(option); return resolve(root, index < 0 ? fallback : process.argv[index + 1]); }
function readJson(path) { try { return JSON.parse(readFileSync(path, "utf8")); } catch (error) { fail("FIXED_FILTER_HOST_CONTRACT_INVALID_JSON", error.message); } }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

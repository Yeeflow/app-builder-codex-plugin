#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = resolve(root, "compatibility/capability-manifests/fixed-filter-key-findings-host-contract.v0.1.0.json");
const fixturesPath = resolve(root, "compatibility/differential-fixtures/fixed-filter-key-findings-host-contract.v0.1.0.json");
const validator = resolve(root, "scripts/validate-phase5h-fixed-filter-key-findings-host-contract.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase5h-fixed-filter-contract-"));
const cases = [
  { id: "core-uuid", code: "CORE_UUID_GENERATION_FORBIDDEN", mutate: (contract) => { contract.coreProhibitions = contract.coreProhibitions.filter((item) => !item.includes("crypto.randomUUID")); } },
  { id: "findings-mutation", code: "CORE_FINDINGS_MUTATION_FORBIDDEN", mutate: (contract) => { contract.coreProhibitions = contract.coreProhibitions.filter((item) => !item.includes("caller-owned arrays")); } },
  { id: "implicit-allocation", code: "HOST_KEY_ALLOCATION_IMPLICIT", mutate: (contract) => { contract.identitySemantics.requestIdentity = "Host decides request identity."; } },
  { id: "mutable-findings", code: "CORE_FINDINGS_OUTPUT_MUTABLE", mutate: (contract) => { contract.findingsSemantics.shape = "Finding objects."; } },
  { id: "allocation-errors", code: "HOST_KEY_ALLOCATION_ERROR_SEMANTICS_MISSING", mutate: (contract) => { delete contract.identitySemantics.collisions; } },
  { id: "proof-boundary", code: "FIXED_FILTER_HOST_CONTRACT_PROOF_BOUNDARY_MISSING", mutate: (contract) => { contract.parityAndRollback.rollback = ""; } },
];
try {
  for (const testCase of cases) runCase(testCase);
  console.log(`FIXED_FILTER_HOST_CONTRACT_REGRESSIONS_PASSED cases=${cases.length}`);
} finally { rmSync(temporary, { recursive: true, force: true }); }

function runCase(testCase) {
  const contract = JSON.parse(readFileSync(contractPath, "utf8"));
  testCase.mutate(contract);
  const contractCopy = resolve(temporary, `${testCase.id}.json`);
  const fixturesCopy = resolve(temporary, `${testCase.id}.fixtures.json`);
  writeFileSync(contractCopy, `${JSON.stringify(contract, null, 2)}\n`, "utf8");
  cpSync(fixturesPath, fixturesCopy);
  const result = spawnSync(process.execPath, [validator, "--contract", contractCopy, "--fixtures", fixturesCopy], { encoding: "utf8" });
  assert.notEqual(result.status, 0, `${testCase.id} must fail.`);
  assert.match(`${result.stdout}\n${result.stderr}`, new RegExp(testCase.code), `${testCase.id} must emit ${testCase.code}.`);
}

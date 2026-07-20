#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = resolve(root, "compatibility/capability-manifests/cross-resource-lookup-resolution-host-contract.v0.1.0.json");
const fixturePath = resolve(root, "compatibility/differential-fixtures/cross-resource-lookup-resolution.v0.1.0.json");
const validator = resolve(root, "scripts/validate-phase6a-cross-resource-lookup-resolution-contract.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase6a-lookup-contract-"));

try {
  assert.equal(run(contractPath, fixturePath).status, 0);
  for (const [id, mutateContract, mutateFixture, code] of [
    ["numeric-target", null, (fixture) => { fixture.cases = fixture.cases.filter((item) => item.id !== "numeric-target-id"); }, "CROSS_RESOURCE_LOOKUP_RESOLUTION_FIXTURE_INCOMPLETE"],
    ["implicit-fallback", (value) => { value.futureCoreContract.prohibitions = value.futureCoreContract.prohibitions.filter((item) => item !== "fallback target discovery"); }, null, "CROSS_RESOURCE_LOOKUP_RESOLUTION_CORE_BOUNDARY_INVALID"],
    ["cross-scope", null, (fixture) => { fixture.cases = fixture.cases.filter((item) => item.id !== "wrong-target-scope"); }, "CROSS_RESOURCE_LOOKUP_RESOLUTION_FIXTURE_INCOMPLETE"],
    ["relationship", null, (fixture) => { fixture.cases = fixture.cases.filter((item) => item.id !== "broken-source-field-relationship"); }, "CROSS_RESOURCE_LOOKUP_RESOLUTION_FIXTURE_INCOMPLETE"],
    ["unresolved", (value) => { delete value.errors.semantics.DATA_LIST_LOOKUP_TARGET_UNRESOLVED; }, null, "CROSS_RESOURCE_LOOKUP_RESOLUTION_ERRORS_INVALID"],
    ["template-mutation", (value) => { value.futureCoreContract.prohibitions = value.futureCoreContract.prohibitions.filter((item) => item !== "template loading or mutation"); }, null, "CROSS_RESOURCE_LOOKUP_RESOLUTION_CORE_BOUNDARY_INVALID"],
    ["widened-surface", (value) => { value.exclusions = value.exclusions.filter((item) => item !== "sublists"); }, null, "CROSS_RESOURCE_LOOKUP_RESOLUTION_SCOPE_WIDENED"],
    ["audit-mutation", (value) => { value.auditMutations.artifacts = true; }, null, "CROSS_RESOURCE_LOOKUP_RESOLUTION_AUDIT_MUTATION_FORBIDDEN"],
  ]) {
    const contract = JSON.parse(readFileSync(contractPath, "utf8"));
    const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
    mutateContract?.(contract); mutateFixture?.(fixture);
    const contractTemp = resolve(temporary, `${id}.contract.json`); const fixtureTemp = resolve(temporary, `${id}.fixture.json`);
    writeFileSync(contractTemp, `${JSON.stringify(contract, null, 2)}\n`, "utf8"); writeFileSync(fixtureTemp, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
    const result = run(contractTemp, fixtureTemp);
    assert.notEqual(result.status, 0, id); assert.match(result.output, new RegExp(code), id);
  }
  console.log("CROSS_RESOURCE_LOOKUP_RESOLUTION_CONTRACT_REGRESSIONS_PASSED cases=8");
} finally { rmSync(temporary, { recursive: true, force: true }); }

function run(contract, fixture) { const result = spawnSync(process.execPath, [validator, "--contract", contract, "--fixture", fixture], { cwd: root, encoding: "utf8" }); return { status: result.status, output: `${result.stdout}${result.stderr}` }; }

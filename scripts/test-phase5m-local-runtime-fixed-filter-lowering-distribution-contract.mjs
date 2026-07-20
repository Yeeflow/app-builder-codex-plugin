#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase5m-local-runtime-fixed-filter-lowering-distribution-contract.mjs");
const readiness = resolve(root, "compatibility/capability-manifests/local-runtime-fixed-filter-lowering-distribution-readiness.v0.1.0.json");
const runtime = resolve(root, "runtimes/app-builder-core-local-runtime/src/index.ts");
const runtimePackage = resolve(root, "runtimes/app-builder-core-local-runtime/package.json");
const distributionContract = resolve(root, "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase5m-runtime-contract-"));

try {
  assert.equal(run({}).status, 0, "The valid Local Runtime readiness contract must pass.");
  runNegative("implicit-allocation", (value) => { value.publicContract.allocationRequirements.fallbackAllocation = "allowed"; }, "LOCAL_RUNTIME_FIXED_FILTER_LOWERING_IMPLICIT_ALLOCATION_FORBIDDEN");
  runNegative("mutation", (value) => { value.publicContract.mutationOwnership.decision = "implicit"; }, "LOCAL_RUNTIME_FIXED_FILTER_LOWERING_CALLER_FINDINGS_MUTATION_UNDECLARED");
  runNegative("allocation-errors", (value) => { value.publicContract.stableAllocationErrors = value.publicContract.stableAllocationErrors.slice(0, 2); }, "LOCAL_RUNTIME_FIXED_FILTER_LOWERING_ALLOCATION_ERROR_CONTRACT_INCOMPLETE");
  runNegative("distribution", (value) => { value.prospectiveDistribution.artifact.path = "runtime/fixed-filter.mjs"; }, "LOCAL_RUNTIME_FIXED_FILTER_LOWERING_DISTRIBUTION_STRATEGY_INVALID");
  runNegative("leakage", (value) => { value.prospectiveDistribution.leakageProhibitions = value.prospectiveDistribution.leakageProhibitions.filter((item) => item !== "node_modules references"); }, "LOCAL_RUNTIME_FIXED_FILTER_LOWERING_LEAKAGE_GUARD_INCOMPLETE");
  runNegative("routing", (value) => { value.futureIntegrationPrerequisites.requiredProof = value.futureIntegrationPrerequisites.requiredProof.filter((item) => item !== "official ZIP parity"); }, "LOCAL_RUNTIME_FIXED_FILTER_LOWERING_ROUTING_PROOF_INCOMPLETE");
  console.log("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_DISTRIBUTION_CONTRACT_REGRESSIONS_PASSED cases=6");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

function runNegative(id, mutate, code) {
  const readinessPath = resolve(temporary, `${id}.readiness.json`);
  cpSync(readiness, readinessPath);
  const value = JSON.parse(readFileSync(readinessPath, "utf8"));
  mutate(value);
  writeFileSync(readinessPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  const result = run({ readinessPath });
  assert.notEqual(result.status, 0, `${id} must fail the Local Runtime contract validator.`);
  assert.match(result.output, new RegExp(code), `${id} must report ${code}.`);
}

function run({ readinessPath = readiness }) {
  const result = spawnSync(process.execPath, [validator, "--readiness", readinessPath, "--runtime", runtime, "--runtime-package", runtimePackage, "--distribution-contract", distributionContract], { cwd: root, encoding: "utf8" });
  return { status: result.status, output: `${result.stdout || ""}${result.stderr || ""}` };
}

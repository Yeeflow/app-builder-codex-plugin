#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "compatibility/capability-manifests/data-list-sublist-child-resource-identity-map-contract.v0.1.0.json");
const validator = resolve(root, "scripts/validate-phase9a-data-list-sublist-child-resource-identity-contract.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase9a-sublist-identity-"));
try {
  assert.equal(run(source).status, 0);
  for (const [id, mutate, code] of [
    ["missing-child", value => value.identityFlowMatrix.find((entry) => entry.identity === "childListId").status = "available", "SUBLIST_CHILD_RESOURCE_IDENTITY_LOSSY_INPUT"],
    ["lossy-parent", value => value.identityFlowMatrix.find((entry) => entry.identity === "parentFieldId").representation = "number", "SUBLIST_CHILD_RESOURCE_IDENTITY_LOSSY_INPUT"],
    ["fallback", value => value.hostContract.prohibited = value.hostContract.prohibited.filter((item) => item !== "fallback allocation"), "SUBLIST_CHILD_RESOURCE_IDENTITY_CORE_BOUNDARY_INVALID"],
    ["parent-reuse", value => value.hostContract.prohibited = value.hostContract.prohibited.filter((item) => item !== "parent identity reuse as a child identity"), "SUBLIST_CHILD_RESOURCE_IDENTITY_CORE_BOUNDARY_INVALID"],
    ["scope-error", value => value.hostContract.validationErrors = value.hostContract.validationErrors.filter((item) => item !== "SUBLIST_CHILD_RESOURCE_IDENTITY_SCOPE_MISMATCH"), "SUBLIST_CHILD_RESOURCE_IDENTITY_VALIDATION_INCOMPLETE"],
    ["map-mutation", value => value.hostContract.prohibited = value.hostContract.prohibited.filter((item) => item !== "mutation of caller-owned identity maps"), "SUBLIST_CHILD_RESOURCE_IDENTITY_CORE_BOUNDARY_INVALID"],
    ["core-package", value => value.hostContract.prohibited = value.hostContract.prohibited.filter((item) => item !== "Core package output access"), "SUBLIST_CHILD_RESOURCE_IDENTITY_CORE_BOUNDARY_INVALID"],
    ["negative-coverage", value => value.negativeRegressionMatrix = value.negativeRegressionMatrix.filter((item) => item.case !== "missing-row-schema"), "SUBLIST_CHILD_RESOURCE_IDENTITY_REGRESSION_COVERAGE_INCOMPLETE"],
  ]) { const path = resolve(temporary, `${id}.json`); const value = JSON.parse(readFileSync(source, "utf8")); mutate(value); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`); const result = run(path); assert.notEqual(result.status, 0, id); assert.match(result.output, new RegExp(code), id); }
  console.log("SUBLIST_CHILD_RESOURCE_IDENTITY_CONTRACT_REGRESSIONS_PASSED cases=9");
} finally { rmSync(temporary, { recursive: true, force: true }); }
function run(path) { const result = spawnSync(process.execPath, [validator, path], { cwd: root, encoding: "utf8" }); return { status: result.status, output: `${result.stdout}${result.stderr}` }; }

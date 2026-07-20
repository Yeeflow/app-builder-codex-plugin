#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase12d-data-list-sublist-nested-control-placement-dual-public-distribution-promotion.mjs");
const contract = "compatibility/capability-manifests/data-list-sublist-nested-control-placement-dual-public-distribution-promotion.v0.1.0.json";
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase12d-gates-"));
try {
  assert.equal(run().status, 0);
  for (const [id, mutate, expected] of [["extra-export", (value) => { value.publicExports.push("unsafe"); }, "SUBLIST_NESTED_CONTROL_DUAL_DISTRIBUTION_PROMOTION_CONTRACT_INVALID"], ["mutable-boundary", (value) => { value.boundary = "mutable template graph"; }, "SUBLIST_NESTED_CONTROL_DUAL_DISTRIBUTION_BOUNDARY_INVALID"], ["production-drift", (value) => { value.productionMaterializer.changed = true; }, "SUBLIST_NESTED_CONTROL_DUAL_DISTRIBUTION_PRODUCTION_DRIFT"]]) {
    const file = resolve(temporary, `${id}.json`); const value = JSON.parse(readFileSync(resolve(root, contract), "utf8")); mutate(value); writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); const result = run(file); assert.notEqual(result.status, 0, id); assert.match(result.output, new RegExp(expected), id);
  }
  console.log("SUBLIST_NESTED_CONTROL_DUAL_DISTRIBUTION_REGRESSIONS_PASSED cases=3");
} finally { rmSync(temporary, { recursive: true, force: true }); }
function run(contractPath) { const result = spawnSync(process.execPath, contractPath ? [validator, "--contract", contractPath] : [validator], { cwd: root, encoding: "utf8" }); return { status: result.status, output: `${result.stdout}${result.stderr}` }; }

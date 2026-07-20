#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-data-list-sublist-dynamic-summary-intent-public-api.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase11e-public-api-"));
const files = ["compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json", "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json", "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json"];
try {
  assert.equal(run([]).status, 0);
  const cases = [
    ["missing-core-export", 0, (value) => { value.runtimeExports = value.runtimeExports.filter((item) => item !== "projectDataListSublistDynamicSummaryIntent"); }, "SUBLIST_DYNAMIC_SUMMARY_PUBLIC_API_EXPORT_ALIGNMENT_INVALID"],
    ["missing-runtime-export", 1, (value) => { value.runtimeExports = value.runtimeExports.filter((item) => item !== "lowerDataListSublistDynamicSummaryIntentAtHost"); }, "SUBLIST_DYNAMIC_SUMMARY_PUBLIC_API_EXPORT_ALIGNMENT_INVALID"],
    ["missing-core-contract", 0, (value) => { delete value.projectDataListSublistDynamicSummaryIntent; }, "SUBLIST_DYNAMIC_SUMMARY_PUBLIC_API_CONTRACT_MISSING"],
    ["missing-runtime-prohibition", 1, (value) => { value.lowerDataListSublistDynamicSummaryIntentAtHost.prohibited = ""; }, "SUBLIST_DYNAMIC_SUMMARY_RUNTIME_PUBLIC_BOUNDARY_INVALID"]
  ];
  for (const [id, index, mutate, expected] of cases) {
    const copied = files.map((path) => copy(id, path));
    const value = JSON.parse(readFileSync(copied[index], "utf8")); mutate(value); writeFileSync(copied[index], `${JSON.stringify(value, null, 2)}\n`);
    const result = run(copied); assert.notEqual(result.status, 0, id); assert.match(result.output, new RegExp(expected), id);
  }
  console.log("SUBLIST_DYNAMIC_SUMMARY_PUBLIC_API_REGRESSIONS_PASSED cases=4");
} finally { rmSync(temporary, { recursive: true, force: true }); }

function copy(id, path) { const target = resolve(temporary, `${id}-${path.split("/").at(-1)}`); writeFileSync(target, readFileSync(resolve(root, path), "utf8")); return target; }
function run(paths) { const args = [validator]; if (paths.length) args.push("--materializer", paths[0], "--runtime", paths[1], "--distribution", paths[2]); const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" }); return { status: result.status, output: `${result.stdout}${result.stderr}` }; }

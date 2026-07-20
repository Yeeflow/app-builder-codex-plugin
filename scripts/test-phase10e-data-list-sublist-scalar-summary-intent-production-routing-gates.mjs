#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase10e-data-list-sublist-scalar-summary-intent-production-routing.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase10e-summary-gates-"));
try {
  assert.equal(run().status, 0);
  mutate("scripts/materialize-full-app-generated-final.mjs", (value) => value.replace("coreLowerDataListSublistScalarSummaryIntentAtHost(projected.intent)", "coreProjectDataListSublistScalarSummaryIntent(Object.freeze({}))"), "--source", "SUBLIST_SCALAR_SUMMARY_INTENT_DUPLICATE_ROUTING");
  mutate("scripts/materialize-full-app-generated-final.mjs", (value) => value.replace("DATA_LIST_SUBLIST_SCALAR_SUMMARY_INTENT_CORE_ROUTE_START", "DATA_LIST_SUBLIST_SCALAR_SUMMARY_INTENT_CORE_ROUTE_ALTERED"), "--source", "SUBLIST_SCALAR_SUMMARY_INTENT_ROUTE_MISSING");
  mutate("scripts/materialize-full-app-generated-final.mjs", (value) => value.replace("const projected =", "control.tempVars = [];\n  const projected ="), "--source", "SUBLIST_SCALAR_SUMMARY_INTENT_TEMP_VARIABLE_OR_GLOBAL_LEAKAGE");
  mutate("scripts/lib/materializer-core-adapter.mjs", (value) => value.replace("export const projectDataListSublistScalarSummaryIntent = core.projectDataListSublistScalarSummaryIntent;", ""), "--core-adapter", "SUBLIST_SCALAR_SUMMARY_INTENT_ADAPTER_EXPORT_MISSING");
  mutate("scripts/lib/local-runtime-core-adapter.mjs", (value) => value.replace("export const lowerDataListSublistScalarSummaryIntentAtHost = runtime.lowerDataListSublistScalarSummaryIntentAtHost;", ""), "--runtime-adapter", "SUBLIST_SCALAR_SUMMARY_INTENT_ADAPTER_EXPORT_MISSING");
  console.log("SUBLIST_SCALAR_SUMMARY_INTENT_ROUTING_REGRESSIONS_PASSED cases=6");
} finally { rmSync(temporary, { recursive: true, force: true }); }
function run(args = []) { const result = spawnSync(process.execPath, [validator, ...args], { cwd: root, encoding: "utf8" }); return { status: result.status, output: `${result.stdout}${result.stderr}` }; }
function mutate(path, change, option, code) { const target = resolve(temporary, path.replaceAll("/", "_")); writeFileSync(target, change(readFileSync(resolve(root, path), "utf8")), "utf8"); const result = run([option, target]); assert.notEqual(result.status, 0); assert.match(result.output, new RegExp(code)); }

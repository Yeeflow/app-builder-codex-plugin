#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase11f-data-list-sublist-dynamic-summary-routing.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase11f-routing-gates-"));
try {
  assert.equal(run().status, 0);
  mutateJson("compatibility/capability-manifests/data-list-sublist-dynamic-summary-intent-production-routing.v0.1.0.json", (value) => { value.route.bindingModels = ["__temp_"]; }, "--contract", "SUBLIST_DYNAMIC_SUMMARY_ROUTING_SCOPE_INVALID");
  mutateText("scripts/materialize-full-app-generated-final.mjs", (value) => value.replace("DATA_LIST_SUBLIST_DYNAMIC_SUMMARY_CORE_ROUTE_START", "DATA_LIST_SUBLIST_DYNAMIC_SUMMARY_CORE_ROUTE_MISSING"), "--source", "SUBLIST_DYNAMIC_SUMMARY_ROUTING_SOURCE_INVALID");
  mutateText("scripts/lib/data-list-sublist-dynamic-summary-host-scope-context.mjs", (value) => `${value}\nglobalThis.dynamicSummaryContext = {};\n`, "--context", "SUBLIST_DYNAMIC_SUMMARY_HOST_CONTEXT_GUARD_INVALID");
  mutateJson("compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json", (value) => { value.approvedTransitions = value.approvedTransitions.filter((item) => item.phase !== "phase-11f-sublist-summary-dynamic-intent-selective-routing-proof"); }, "--lineage", "PHASE_11F_ROUTING_LINEAGE_INVALID");
  console.log("SUBLIST_DYNAMIC_SUMMARY_ROUTING_NEGATIVE_GATES_PASSED cases=5");
} finally { rmSync(temporary, { recursive: true, force: true }); }

function run(args = []) { const result = spawnSync(process.execPath, [validator, ...args], { cwd: root, encoding: "utf8" }); return { status: result.status, output: `${result.stdout}${result.stderr}` }; }
function mutateJson(path, change, option, code) { const target = resolve(temporary, path.replaceAll("/", "_").replaceAll(".json", ".mutated.json")); const value = JSON.parse(readFileSync(resolve(root, path), "utf8")); change(value); writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`); expect(option, target, code); }
function mutateText(path, change, option, code) { const target = resolve(temporary, path.replaceAll("/", "_").replaceAll(".mjs", ".mutated.mjs")); writeFileSync(target, change(readFileSync(resolve(root, path), "utf8"))); expect(option, target, code); }
function expect(option, target, code) { const result = run([option, target]); assert.notEqual(result.status, 0); assert.match(result.output, new RegExp(code)); }

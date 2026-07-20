#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase10f-data-list-sublist-summary-family-closure.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase10f-summary-closure-"));
try {
  assert.equal(run().status, 0);
  mutateContract((value) => { value.decision.additionalSafeStaticSummaryVerticals = 1; }, "SUBLIST_SUMMARY_FAMILY_CLOSURE_DECISION_INVALID");
  mutateContract((value) => { value.staticRoute.binding = "summaryTemp"; }, "SUBLIST_SCALAR_SUMMARY_ROUTE_INVALID");
  mutateContract((value) => { value.deferredFamilies[0].canInheritPhase10E = true; }, "SUBLIST_SUMMARY_DEFERRED_FAMILY_MATRIX_INVALID");
  mutateContract((value) => { value.preserved.productionRouteChanged = true; }, "SUBLIST_SUMMARY_CLOSURE_AUDIT_MUTATION");
  mutateSource((value) => value.replace("DATA_LIST_SUBLIST_SCALAR_SUMMARY_INTENT_CORE_ROUTE_START", "DATA_LIST_SUBLIST_SCALAR_SUMMARY_INTENT_CORE_ROUTE_ALTERED"), "SUBLIST_SCALAR_SUMMARY_ROUTE_RECONFIRMATION_FAILED");
  mutateLineage((value) => { value.approvedTransitions = value.approvedTransitions.filter((entry) => entry.phase !== "phase-10e-data-list-sublist-scalar-summary-intent-selective-routing-proof"); }, "PHASE_CLOSURE_PROOF_LINEAGE_INVALID");
  console.log("SUBLIST_SUMMARY_FAMILY_CLOSURE_REGRESSIONS_PASSED cases=7");
} finally { rmSync(temporary, { recursive: true, force: true }); }
function run(args = []) { const result = spawnSync(process.execPath, [validator, ...args], { cwd: root, encoding: "utf8" }); return { status: result.status, output: `${result.stdout}${result.stderr}` }; }
function mutateContract(change, code) { mutate("compatibility/capability-manifests/data-list-sublist-summary-family-closure.v0.1.0.json", change, "--contract", code); }
function mutateLineage(change, code) { mutate("compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json", change, "--lineage", code); }
function mutateSource(change, code) { const path = "scripts/materialize-full-app-generated-final.mjs"; const target = resolve(temporary, "source.mjs"); writeFileSync(target, change(readFileSync(resolve(root, path), "utf8")), "utf8"); const result = run(["--source", target]); assert.notEqual(result.status, 0); assert.match(result.output, new RegExp(code)); }
function mutateText(path, option, code) { const target = resolve(temporary, path.replaceAll("/", "_").replaceAll(".mjs", ".mutated.mjs")); writeFileSync(target, `${readFileSync(resolve(root, path), "utf8")}\n// audit mutation\n`, "utf8"); const result = run([option, target]); assert.notEqual(result.status, 0); assert.match(result.output, new RegExp(code)); }
function mutate(path, change, option, code) { const target = resolve(temporary, `${path.replaceAll("/", "_")}.json`); const value = JSON.parse(readFileSync(resolve(root, path), "utf8")); change(value); writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8"); const result = run([option, target]); assert.notEqual(result.status, 0); assert.match(result.output, new RegExp(code)); }

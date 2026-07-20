#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase11b-data-list-sublist-summary-temp-variable-scope-evidence-audit.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase11b-temp-variable-"));
try {
  assert.equal(run().status, 0);
  mutateJson("compatibility/capability-manifests/data-list-sublist-summary-temp-variable-scope-evidence.v0.1.0.json", (value) => { value.decision.safeImmutableDynamicSummaryIntentBoundary = true; }, "SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_EVIDENCE_DECISION_INVALID", "--contract");
  mutateJson("compatibility/capability-manifests/data-list-sublist-summary-temp-variable-scope-evidence.v0.1.0.json", (value) => { value.prohibitions = value.prohibitions.filter((item) => item !== "Core temporary-variable allocation"); }, "SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_EVIDENCE_CONTRACT_INVALID", "--contract");
  mutateJson("compatibility/capability-manifests/data-list-sublist-summary-temp-variable-scope-evidence-matrix.v0.1.0.json", (value) => { value.rows[4].scopeEvidence.inventoryIdentity = "validated"; }, "SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_EVIDENCE_INFERRED", "--matrix");
  mutateJson("compatibility/capability-manifests/data-list-sublist-summary-temp-variable-scope-evidence-matrix.v0.1.0.json", (value) => { value.rows[0].boundary = "unknown"; }, "SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_EVIDENCE_MATRIX_INVALID", "--matrix");
  mutateJson("compatibility/capability-manifests/data-list-sublist-summary-temp-variable-scope-evidence.v0.1.0.json", (value) => { value.preserved.publicApiChanged = true; }, "SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_EVIDENCE_AUDIT_MUTATION", "--contract");
  mutateText("scripts/materialize-full-app-generated-final.mjs", "--source", "\n// DATA_LIST_SUBLIST_DYNAMIC_SUMMARY_CORE_ROUTE\n", "SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_EVIDENCE_MATRIX_INVALID");
  mutateText("scripts/lib/materializer-core-adapter.mjs", "--core-adapter", "\n// adapter mutation\n", "SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_EVIDENCE_AUDIT_MUTATION");
  console.log("SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_EVIDENCE_REGRESSIONS_PASSED cases=8");
} finally { rmSync(temporary, { recursive: true, force: true }); }

function run(args = []) { const result = spawnSync(process.execPath, [validator, ...args], { cwd: root, encoding: "utf8" }); return { status: result.status, output: `${result.stdout}${result.stderr}` }; }
function mutateJson(path, change, code, option) { const value = JSON.parse(readFileSync(resolve(root, path), "utf8")); change(value); const target = resolve(temporary, `${path.replaceAll("/", "_")}.json`); writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8"); const result = run([option, target]); assert.notEqual(result.status, 0); assert.match(result.output, new RegExp(code)); }
function mutateText(path, option, suffix, code) { const target = resolve(temporary, `${path.replaceAll("/", "_")}.mjs`); writeFileSync(target, `${readFileSync(resolve(root, path), "utf8")}${suffix}`, "utf8"); const result = run([option, target]); assert.notEqual(result.status, 0); assert.match(result.output, new RegExp(code)); }

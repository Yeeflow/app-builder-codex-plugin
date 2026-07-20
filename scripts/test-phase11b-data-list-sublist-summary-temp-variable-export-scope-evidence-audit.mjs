#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase11b-data-list-sublist-summary-temp-variable-export-scope-evidence-audit.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase11b-export-scope-"));
try {
  assert.equal(run().status, 0);
  mutateJson("compatibility/capability-manifests/data-list-sublist-summary-temp-variable-export-scope-evidence.v0.1.0.json", (value) => { value.decision.status = "blocked"; }, "SUBLIST_SUMMARY_TEMP_VARIABLE_EXPORT_SCOPE_DECISION_INVALID", "--contract");
  mutateJson("compatibility/capability-manifests/data-list-sublist-summary-temp-variable-export-scope-evidence.v0.1.0.json", (value) => { value.dataListScopeEvidence.tempBoundSummary.target.inventoryEntryMatchedExactlyOnce = false; }, "SUBLIST_SUMMARY_TEMP_VARIABLE_EXPORT_BINDING_RELATIONSHIP_INVALID", "--contract");
  mutateJson("compatibility/capability-manifests/data-list-sublist-summary-temp-variable-export-scope-evidence.v0.1.0.json", (value) => { value.dataListScopeEvidence.summaryIdStandaloneIdentity = true; }, "SUBLIST_SUMMARY_TEMP_VARIABLE_EXPORT_BINDING_RELATIONSHIP_INVALID", "--contract");
  mutateJson("compatibility/capability-manifests/data-list-sublist-summary-temp-variable-export-scope-evidence.v0.1.0.json", (value) => { value.safeHostContext.prohibitions = value.safeHostContext.prohibitions.filter((item) => item !== "name-only matching without the composite scope"); }, "SUBLIST_SUMMARY_TEMP_VARIABLE_HOST_CONTEXT_CONTRACT_INVALID", "--contract");
  mutateJson("compatibility/capability-manifests/data-list-sublist-summary-temp-variable-export-scope-evidence-matrix.v0.1.0.json", (value) => { value.rows[2].eligibleForDataListHostContext = true; }, "SUBLIST_SUMMARY_TEMP_VARIABLE_EXPORT_MATRIX_INVALID", "--matrix");
  mutateJson("compatibility/capability-manifests/data-list-sublist-summary-temp-variable-export-scope-evidence.v0.1.0.json", (value) => { value.preserved.publicApiChanged = true; }, "SUBLIST_SUMMARY_TEMP_VARIABLE_EXPORT_AUDIT_MUTATION", "--contract");
  mutateText("scripts/materialize-full-app-generated-final.mjs", "--source", "\n// DATA_LIST_SUBLIST_DYNAMIC_SUMMARY_CORE_ROUTE\n", "SUBLIST_SUMMARY_TEMP_VARIABLE_EXPORT_AUDIT_MUTATION");
  console.log("SUBLIST_SUMMARY_TEMP_VARIABLE_EXPORT_SCOPE_EVIDENCE_REGRESSIONS_PASSED cases=8");
} finally { rmSync(temporary, { recursive: true, force: true }); }

function run(args = []) { const result = spawnSync(process.execPath, [validator, ...args], { cwd: root, encoding: "utf8" }); return { status: result.status, output: `${result.stdout}${result.stderr}` }; }
function mutateJson(path, change, code, option) { const value = JSON.parse(readFileSync(resolve(root, path), "utf8")); change(value); const target = resolve(temporary, `${path.replaceAll("/", "_")}.json`); writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8"); const result = run([option, target]); assert.notEqual(result.status, 0); assert.match(result.output, new RegExp(code)); }
function mutateText(path, option, suffix, code) { const target = resolve(temporary, `${path.replaceAll("/", "_")}.mjs`); writeFileSync(target, `${readFileSync(resolve(root, path), "utf8")}${suffix}`, "utf8"); const result = run([option, target]); assert.notEqual(result.status, 0); assert.match(result.output, new RegExp(code)); }

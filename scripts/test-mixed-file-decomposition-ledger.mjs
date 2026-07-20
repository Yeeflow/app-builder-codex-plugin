#!/usr/bin/env node

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ledgerPath = resolve(root, "compatibility/capability-manifests/yeeflow-app-builder-mixed-file-decomposition.v0.9.71.json");
const validator = resolve(root, "scripts/validate-mixed-file-decomposition-ledger.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-decomposition-ledger-"));
try {
  positive();
  negative("missing-source", (ledger) => { ledger.records.pop(); }, "DECOMPOSITION_LEDGER_SOURCE_RECORD_MISSING");
  negative("duplicate", (ledger) => { ledger.records.push(structuredClone(ledger.records[0])); }, "DECOMPOSITION_LEDGER_DUPLICATE_SOURCE_PATH");
  negative("unknown-target", (ledger) => { ledger.records[0].proposedTargetPackage = "@yeeflow/unknown"; }, "DECOMPOSITION_LEDGER_TARGET_PACKAGE_UNKNOWN");
  negative("mixed-plan", (ledger) => { const record = find(ledger, "mixed"); record.proposedLocalRuntimeModule = null; }, "DECOMPOSITION_LEDGER_MIXED_SPLIT_PLAN_MISSING");
  negative("core-side-effect", (ledger) => { find(ledger, "core").detectedSideEffects = ["filesystem-or-process"]; }, "DECOMPOSITION_LEDGER_CORE_HOST_SIDE_EFFECT");
  negative("shim-target", (ledger) => { find(ledger, "compatibility-shim").compatibilityShimPath = null; }, "DECOMPOSITION_LEDGER_COMPATIBILITY_TARGET_MISSING");
  negative("test-requirements", (ledger) => { ledger.records[0].requiredBaselineFixtures = []; }, "DECOMPOSITION_LEDGER_TEST_REQUIREMENT_MISSING");
  negative("protected", (ledger) => { ledger.records[0].sourcePath = "docs/example 2.md"; }, "DECOMPOSITION_LEDGER_PROTECTED_PATH");
  negative("dist", (ledger) => { ledger.records[0].sourcePath = "dist/yeeflow-app-builder-plugin/example.mjs"; }, "DECOMPOSITION_LEDGER_GENERATED_DIST_SOURCE");
  negative("materializer", (ledger) => { const record = ledger.records.find((item) => /(?:materialize-|generated-final|generate-.*yapk)/i.test(item.sourcePath.split("/").at(-1))); record.migrationBatch = "batch-now"; }, "DECOMPOSITION_LEDGER_MATERIALIZER_IMMEDIATE_BATCH");
  negative("non-english", (ledger) => { ledger.records[0].rationale = "Chinese text fixture"; ledger.records[0].rationale += String.fromCodePoint(0x4e2d, 0x6587); }, "DECOMPOSITION_LEDGER_NON_ENGLISH");
  console.log("DECOMPOSITION_LEDGER_TESTS_PASSED cases=12");
} finally { rmSync(temporary, { recursive: true, force: true }); }

function positive() { const result = run(ledgerPath); if (result.status !== 0) throw new Error(`Positive ledger validation failed: ${result.stderr}`); }
function negative(name, mutate, code) { const ledger = JSON.parse(readFileSync(ledgerPath, "utf8")); mutate(ledger); const candidate = resolve(temporary, `${name}.json`); writeFileSync(candidate, `${JSON.stringify(ledger, null, 2)}\n`, "utf8"); const result = run(candidate); if (result.status === 0 || !`${result.stdout}${result.stderr}`.includes(code)) throw new Error(`Negative case ${name} did not report ${code}.`); }
function run(candidate) { return spawnSync(process.execPath, [validator, "--ledger", candidate], { cwd: root, encoding: "utf8" }); }
function find(ledger, classification) { const record = ledger.records.find((item) => item.currentClassification === classification); if (!record) throw new Error(`Missing ${classification} fixture record.`); return record; }

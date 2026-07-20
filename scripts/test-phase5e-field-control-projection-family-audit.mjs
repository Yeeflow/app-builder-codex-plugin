#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ledgerPath = resolve(root, "compatibility/capability-manifests/field-control-projection-family-selection-audit.v0.1.0.json");
const matrixPath = resolve(root, "compatibility/capability-manifests/field-control-projection-remaining-capability-matrix.v0.1.0.json");
const validator = resolve(root, "scripts/validate-phase5e-field-control-projection-family-audit.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase5e-field-control-audit-"));
const cases = [
  { id: "cross-surface-selection", code: "FIELD_CONTROL_PHASE5E_CROSS_SURFACE_SELECTION", mutate: (ledger) => { ledger.candidates[0].classification = "eligible-contract-first-vertical"; ledger.candidates[0].surface = "data-list,approval-form"; ledger.candidates[0].immutableDtoBoundary = "Invalid"; } },
  { id: "id-bearing-candidate", code: "FIELD_CONTROL_PHASE5E_CANDIDATE_TOO_BROAD", mutate: (ledger) => { ledger.candidates[0].classification = "eligible-contract-first-vertical"; ledger.candidates[0].requiresHostIds = true; ledger.candidates[0].immutableDtoBoundary = "Invalid"; } },
  { id: "template-mutation-candidate", code: "FIELD_CONTROL_PHASE5E_CANDIDATE_TOO_BROAD", mutate: (ledger) => { ledger.candidates[6].classification = "eligible-contract-first-vertical"; ledger.candidates[6].immutableDtoBoundary = "Invalid"; } },
  { id: "missing-proof-boundary", code: "FIELD_CONTROL_PHASE5E_PROOF_BOUNDARY_MISSING", mutate: (ledger) => { ledger.candidates[0].fixture = ""; } },
];

try {
  for (const testCase of cases) runCase(testCase);
  console.log(`FIELD_CONTROL_PHASE5E_AUDIT_REGRESSIONS_PASSED cases=${cases.length}`);
} finally { rmSync(temporary, { recursive: true, force: true }); }

function runCase(testCase) {
  const directory = resolve(temporary, testCase.id);
  mkdirSync(directory, { recursive: true });
  const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
  testCase.mutate(ledger);
  const ledgerCopy = resolve(directory, "ledger.json");
  const matrixCopy = resolve(directory, "matrix.json");
  cpSync(matrixPath, matrixCopy, { recursive: false });
  writeFileSync(ledgerCopy, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
  const result = spawnSync(process.execPath, [validator, "--ledger", ledgerCopy, "--matrix", matrixCopy], { encoding: "utf8" });
  assert.notEqual(result.status, 0, `${testCase.id} must fail.`);
  assert.match(`${result.stdout}\n${result.stderr}`, new RegExp(testCase.code), `${testCase.id} must emit ${testCase.code}.`);
}

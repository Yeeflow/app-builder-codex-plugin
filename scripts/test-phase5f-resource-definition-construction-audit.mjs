#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ledgerPath = resolve(root, "compatibility/capability-manifests/resource-definition-construction-audit.v0.1.0.json");
const matrixPath = resolve(root, "compatibility/capability-manifests/resource-definition-construction-capability-matrix.v0.1.0.json");
const validator = resolve(root, "scripts/validate-phase5f-resource-definition-construction-audit.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase5f-resource-definition-audit-"));
const cases = [
  { id: "core-uuid", code: "RESOURCE_DEFINITION_AUDIT_CORE_UUID_FORBIDDEN", mutate: (ledger, candidate) => { candidate.prospectiveCoreProhibitions = candidate.prospectiveCoreProhibitions.filter((item) => !item.includes("UUID")); } },
  { id: "findings-mutation", code: "RESOURCE_DEFINITION_AUDIT_CORE_FINDINGS_MUTATION_FORBIDDEN", mutate: (ledger, candidate) => { candidate.prospectiveCoreProhibitions = candidate.prospectiveCoreProhibitions.filter((item) => !item.includes("findings")); } },
  { id: "template-mutation", code: "RESOURCE_DEFINITION_AUDIT_TEMPLATE_MUTATION_FORBIDDEN", mutate: (ledger, candidate) => { candidate.prospectiveCoreProhibitions = candidate.prospectiveCoreProhibitions.filter((item) => !item.includes("template")); } },
  { id: "id-allocation", code: "RESOURCE_DEFINITION_AUDIT_ID_ALLOCATION_FORBIDDEN", mutate: (ledger, candidate) => { candidate.requiresIdentityAllocation = true; } },
  { id: "absent-host-lowering", code: "RESOURCE_DEFINITION_AUDIT_HOST_MUTATION_UNDECLARED", mutate: (ledger, candidate) => { candidate.hostContractDependency = null; } },
  { id: "cross-surface", code: "RESOURCE_DEFINITION_AUDIT_SELECTION_INVALID", mutate: (ledger, candidate) => { candidate.surface = "data-list,approval-form"; } },
];
try {
  for (const testCase of cases) runCase(testCase);
  console.log(`RESOURCE_DEFINITION_AUDIT_REGRESSIONS_PASSED cases=${cases.length}`);
} finally { rmSync(temporary, { recursive: true, force: true }); }
function runCase(testCase) {
  const directory = resolve(temporary, testCase.id);
  mkdirSync(directory, { recursive: true });
  const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
  testCase.mutate(ledger, ledger.candidates.find((candidate) => candidate.id === ledger.selection.candidateId));
  const ledgerCopy = resolve(directory, "ledger.json");
  const matrixCopy = resolve(directory, "matrix.json");
  cpSync(matrixPath, matrixCopy);
  writeFileSync(ledgerCopy, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
  const result = spawnSync(process.execPath, [validator, "--ledger", ledgerCopy, "--matrix", matrixCopy], { encoding: "utf8" });
  assert.notEqual(result.status, 0, `${testCase.id} must fail.`);
  assert.match(`${result.stdout}\n${result.stderr}`, new RegExp(testCase.code), `${testCase.id} must emit ${testCase.code}.`);
}

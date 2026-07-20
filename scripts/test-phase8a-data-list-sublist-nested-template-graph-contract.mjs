#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = resolve(root, "compatibility/capability-manifests/data-list-sublist-nested-template-graph-contract.v0.1.0.json");
const selectionPath = resolve(root, "compatibility/capability-manifests/data-list-sublist-nested-template-graph-candidate-selection.v0.1.0.json");
const validator = resolve(root, "scripts/validate-phase8a-data-list-sublist-nested-template-graph-contract.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase8a-sublist-contract-"));
const cases = [
  { id: "mutable-template-core", code: "SUBLIST_NESTED_TEMPLATE_GRAPH_CORE_BOUNDARY_INVALID", mutate: (value) => { value.coreContract.prohibitions = value.coreContract.prohibitions.filter((item) => item !== "template or resource mutation"); } },
  { id: "implicit-child-id", code: "SUBLIST_NESTED_TEMPLATE_GRAPH_CORE_BOUNDARY_INVALID", mutate: (value) => { value.coreContract.prohibitions = value.coreContract.prohibitions.filter((item) => item !== "ID allocation"); } },
  { id: "missing-row-error", code: "SUBLIST_NESTED_TEMPLATE_GRAPH_ERROR_CONTRACT_INVALID", mutate: (value) => { value.stableErrors.codes = value.stableErrors.codes.filter((item) => item !== "SUBLIST_ROW_SCHEMA_REFERENCE_MISSING"); } },
  { id: "invalid-row-schema-scope", code: "SUBLIST_NESTED_TEMPLATE_GRAPH_CANDIDATE_SCOPE_INVALID", mutate: (value) => { value.selectedCandidate.excluded = value.selectedCandidate.excluded.filter((item) => item !== "Lookup row controls"); } },
  { id: "advanced-control-leak", code: "SUBLIST_NESTED_TEMPLATE_GRAPH_CANDIDATE_SCOPE_INVALID", mutate: (value) => { value.selectedCandidate.excluded = value.selectedCandidate.excluded.filter((item) => item !== "file image binary row controls"); } },
  { id: "runtime-package-leak", code: "SUBLIST_NESTED_TEMPLATE_GRAPH_CORE_BOUNDARY_INVALID", mutate: (value) => { value.coreContract.prohibitions = value.coreContract.prohibitions.filter((item) => item !== "package writing"); } },
  { id: "audit-route-mutation", code: "SUBLIST_NESTED_TEMPLATE_GRAPH_AUDIT_MUTATION_FORBIDDEN", mutate: (value) => { value.auditMutations.productionRouting = true; } },
];
try { for (const testCase of cases) runCase(testCase); console.log(`SUBLIST_NESTED_TEMPLATE_GRAPH_CONTRACT_REGRESSIONS_PASSED cases=${cases.length}`); } finally { rmSync(temporary, { recursive: true, force: true }); }
function runCase(testCase) { const contract = JSON.parse(readFileSync(contractPath, "utf8")); testCase.mutate(contract); const target = resolve(temporary, `${testCase.id}.json`); writeFileSync(target, `${JSON.stringify(contract, null, 2)}\n`, "utf8"); const result = spawnSync(process.execPath, [validator, "--contract", target, "--selection", selectionPath], { cwd: root, encoding: "utf8" }); assert.notEqual(result.status, 0, testCase.id); assert.match(`${result.stdout}\n${result.stderr}`, new RegExp(testCase.code), testCase.id); }

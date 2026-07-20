#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = resolve(root, "compatibility/capability-manifests/data-list-advanced-field-template-graph-contract.v0.1.0.json");
const candidatePath = resolve(root, "compatibility/capability-manifests/data-list-advanced-field-template-graph-candidate-selection.v0.1.0.json");
const validator = resolve(root, "scripts/validate-phase7a-advanced-field-template-graph-contract.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase7a-template-contract-"));
try {
  assert.equal(run(contractPath, candidatePath).status, 0, "positive");
  for (const [id, contractMutation, candidateMutation, code] of [
    ["mutable-template", (value) => { value.coreContract.prohibitions = value.coreContract.prohibitions.filter((item) => item !== "mutable template objects"); }, null, "ADVANCED_FIELD_TEMPLATE_GRAPH_CORE_BOUNDARY_INVALID"],
    ["findings-array", (value) => { value.coreContract.prohibitions = value.coreContract.prohibitions.filter((item) => item !== "caller-owned findings arrays"); }, null, "ADVANCED_FIELD_TEMPLATE_GRAPH_CORE_BOUNDARY_INVALID"],
    ["implicit-id", (value) => { value.coreContract.prohibitions = value.coreContract.prohibitions.filter((item) => item !== "implicit template or control ID allocation"); }, null, "ADVANCED_FIELD_TEMPLATE_GRAPH_CORE_BOUNDARY_INVALID"],
    ["template-error", (value) => { value.templateReferenceErrors.codes = value.templateReferenceErrors.codes.filter((item) => item !== "TEMPLATE_GRAPH_REFERENCE_DUPLICATE"); }, null, "ADVANCED_FIELD_TEMPLATE_GRAPH_ERROR_CONTRACT_INVALID"],
    ["runtime-mutation", (value) => { value.coreContract.prohibitions = value.coreContract.prohibitions.filter((item) => item !== "runtime expression evaluation"); }, null, "ADVANCED_FIELD_TEMPLATE_GRAPH_CORE_BOUNDARY_INVALID"],
    ["widened-surface", null, (value) => { value.selectedCandidate.surface = "approval-form"; }, "ADVANCED_FIELD_TEMPLATE_GRAPH_CANDIDATE_INVALID"],
    ["missing-proof", null, (value) => { delete value.selectedCandidate.requiredParityFixture; }, "ADVANCED_FIELD_TEMPLATE_GRAPH_CANDIDATE_PROOF_INVALID"],
    ["audit-mutation", (value) => { value.auditMutations.adapters = true; }, null, "ADVANCED_FIELD_TEMPLATE_GRAPH_AUDIT_MUTATION_FORBIDDEN"]
  ]) {
    const contract = JSON.parse(readFileSync(contractPath, "utf8"));
    const candidate = JSON.parse(readFileSync(candidatePath, "utf8"));
    contractMutation?.(contract);
    candidateMutation?.(candidate);
    const temporaryContract = resolve(temporary, id + ".contract.json");
    const temporaryCandidate = resolve(temporary, id + ".candidate.json");
    writeFileSync(temporaryContract, JSON.stringify(contract, null, 2) + "\n", "utf8");
    writeFileSync(temporaryCandidate, JSON.stringify(candidate, null, 2) + "\n", "utf8");
    const result = run(temporaryContract, temporaryCandidate);
    assert.notEqual(result.status, 0, id);
    assert.match(result.output, new RegExp(code), id);
  }
  console.log("ADVANCED_FIELD_TEMPLATE_GRAPH_CONTRACT_REGRESSIONS_PASSED cases=8");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
function run(contract, candidate) {
  const result = spawnSync(process.execPath, [validator, "--contract", contract, "--candidate", candidate], { cwd: root, encoding: "utf8" });
  return { status: result.status, output: result.stdout + result.stderr };
}

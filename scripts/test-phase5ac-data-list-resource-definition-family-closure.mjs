#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = resolve(root, "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json");
const validator = resolve(root, "scripts/validate-phase5ac-data-list-resource-definition-family-closure.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase5ac-closure-"));

try {
  assert.equal(run(contractPath).status, 0);
  for (const [id, mutate, code] of [
    ["lookup-scalar-safe", (value) => { value.remainingCategories.find((item) => item.id === "lookup-fields").classification = "eligible-phase5-vertical"; }, "DATA_LIST_RESOURCE_DEFINITION_FAMILY_CLOSURE_BLOCKED_ELIGIBLE_VERTICAL"],
    ["sublist-scalar-safe", (value) => { const item = value.remainingCategories.find((entry) => entry.id === "sublist-fields"); item.requiredContractFamily = "scalar-resource-definition-contract"; item.classification = "eligible-phase5-vertical"; }, "DATA_LIST_RESOURCE_DEFINITION_FAMILY_CLOSURE_BLOCKED_ELIGIBLE_VERTICAL"],
    ["lossy-id", (value) => { value.scalarRoute.identityBoundary = "ListID and FieldID are numbers."; }, "DATA_LIST_RESOURCE_DEFINITION_FAMILY_LOSSY_IDENTITY"],
    ["type-one-type-zero", (value) => { const item = value.remainingCategories.find((entry) => entry.id === "type-one-custom-form-layouts"); item.requiredContractFamily = "type-zero-layoutview-contract"; }, "DATA_LIST_RESOURCE_DEFINITION_FAMILY_TYPE1_EVIDENCE_INVALID"],
    ["lookup-no-contract", (value) => { const item = value.remainingCategories.find((entry) => entry.id === "lookup-fields"); item.requiredContractFamily = "scalar-resource-definition-contract"; }, "DATA_LIST_RESOURCE_DEFINITION_FAMILY_LOOKUP_CONTRACT_MISSING"],
    ["eligible-omitted", (value) => { value.eligibleAdditionalPhase5Verticals = ["unclassified-data-list-path"]; }, "DATA_LIST_RESOURCE_DEFINITION_FAMILY_CLOSURE_BLOCKED_ELIGIBLE_VERTICAL"],
    ["audit-mutation", (value) => { value.closureCriteria.routeOrArtifactMutationDuringAudit = true; }, "DATA_LIST_RESOURCE_DEFINITION_FAMILY_CLOSURE_MUTATION_FORBIDDEN"],
    ["routing-drift", (value) => { value.source.sha256 = "routing-drift"; }, "DATA_LIST_RESOURCE_DEFINITION_FAMILY_CLOSURE_MUTATION_FORBIDDEN"],
    ["artifact-drift", (value) => { value.artifactBaselines[Object.keys(value.artifactBaselines)[0]].sha256 = "artifact-drift"; }, "DATA_LIST_RESOURCE_DEFINITION_FAMILY_CLOSURE_MUTATION_FORBIDDEN"],
  ]) {
    const value = JSON.parse(readFileSync(contractPath, "utf8"));
    mutate(value);
    const path = resolve(temporary, `${id}.json`);
    writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    const result = run(path);
    assert.notEqual(result.status, 0, id);
    assert.match(result.output, new RegExp(code), id);
  }
  console.log("DATA_LIST_RESOURCE_DEFINITION_FAMILY_CLOSURE_REGRESSIONS_PASSED cases=9");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

function run(path) { const result = spawnSync(process.execPath, [validator, "--contract", path], { cwd: root, encoding: "utf8" }); return { status: result.status, output: `${result.stdout}${result.stderr}` }; }

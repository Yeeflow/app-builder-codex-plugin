#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = resolve(root, "compatibility/capability-manifests/data-list-lookup-resolution-family-closure.v0.1.0.json");
const validator = resolve(root, "scripts/validate-phase6f-data-list-lookup-family-closure.mjs");
const lineagePath = resolve(root, "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase6f-lookup-closure-"));

try {
  assert.equal(run(contractPath).status, 0, "positive");
  for (const [id, mutate, code] of [
    ["sublist-omitted", (value) => { value.remainingCategories = value.remainingCategories.filter((item) => item.id !== "sublist-lookup-embedding"); }, "DATA_LIST_LOOKUP_RESOLUTION_FAMILY_CATEGORY_OMITTED"],
    ["template-control-safe", (value) => { value.remainingCategories.find((item) => item.id === "lookup-controls-and-form-template-placement").classification = "eligible-lookup-vertical"; }, "DATA_LIST_LOOKUP_RESOLUTION_FAMILY_CLOSURE_BLOCKED_ELIGIBLE_VERTICAL"],
    ["cross-surface-widened", (value) => { value.remainingCategories.find((item) => item.id === "approval-form-lookup-semantics").classification = "host-orchestration-only"; }, "DATA_LIST_LOOKUP_RESOLUTION_CROSS_SURFACE_SCOPE_INVALID"],
    ["target-integration-safe", (value) => { value.remainingCategories.find((item) => item.id === "target-resource-integration").classification = "requires-template-graph-contract"; }, "DATA_LIST_LOOKUP_RESOLUTION_TARGET_INTEGRATION_INVALID"],
    ["eligible-omitted", (value) => { value.eligibleAdditionalLookupVerticals = ["unrecorded-candidate"]; value.closureCriteria.zeroEligibleAdditionalLookupVerticals = false; }, "DATA_LIST_LOOKUP_RESOLUTION_FAMILY_CLOSURE_BLOCKED_ELIGIBLE_VERTICAL"],
    ["audit-mutation", (value) => { value.closureCriteria.auditMutations.adapters = true; }, "DATA_LIST_LOOKUP_RESOLUTION_FAMILY_CLOSURE_MUTATION_FORBIDDEN"],
  ]) {
    const contract = JSON.parse(readFileSync(contractPath, "utf8"));
    mutate(contract);
    const path = resolve(temporary, `${id}.json`);
    writeFileSync(path, `${JSON.stringify(contract, null, 2)}\n`, "utf8");
    const result = run(path);
    assert.notEqual(result.status, 0, id);
    assert.match(result.output, new RegExp(code), id);
  }
  for (const [id, mutate] of [
    ["missing-9d", (value) => { value.approvedTransitions = value.approvedTransitions.filter((item) => !String(item.phase).startsWith("phase-9d")); }],
    ["reordered-artifacts", (value) => { const a = value.approvedTransitions.findIndex((item) => String(item.phase).startsWith("phase-8d")); const b = value.approvedTransitions.findIndex((item) => String(item.phase).startsWith("phase-9d")); [value.approvedTransitions[a], value.approvedTransitions[b]] = [value.approvedTransitions[b], value.approvedTransitions[a]]; }],
    ["tampered-contract-hash", (value) => { value.approvedTransitions.find((item) => String(item.phase).startsWith("phase-9d")).promotionContractSha256 = "0".repeat(64); }],
    ["broad-path", (value) => { value.approvedTransitions.find((item) => String(item.phase).startsWith("phase-9d")).allowedFiles.push("dist/**"); }],
    ["hidden-route", (value) => { value.approvedTransitions.find((item) => String(item.phase).startsWith("phase-9d")).sourceTransition.afterSha256 = "1".repeat(64); }],
  ]) {
    const lineage = JSON.parse(readFileSync(lineagePath, "utf8")); mutate(lineage);
    const path = resolve(temporary, `${id}.json`); writeFileSync(path, `${JSON.stringify(lineage, null, 2)}\n`, "utf8");
    const result = run(contractPath, ["--lineage", path]); assert.notEqual(result.status, 0, id); assert.match(result.output, /DATA_LIST_LOOKUP_RESOLUTION_FAMILY_CLOSURE_ARTIFACT_DRIFT/, id);
  }
  console.log("DATA_LIST_LOOKUP_RESOLUTION_FAMILY_CLOSURE_REGRESSIONS_PASSED cases=11");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

function run(contract, args = []) {
  const result = spawnSync(process.execPath, [validator, "--contract", contract, ...args], { cwd: root, encoding: "utf8" });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

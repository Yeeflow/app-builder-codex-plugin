#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase5l-data-list-default-view-layout-distribution-readiness.mjs");
const readiness = resolve(root, "compatibility/capability-manifests/data-list-default-view-layout-distribution-readiness.v0.1.0.json");
const publicIndex = resolve(root, "packages/app-builder-core-materializer/src/index.ts");
const publicContract = resolve(root, "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const distributionContract = resolve(root, "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase5l-layoutview-readiness-"));

try {
  assert.equal(run({}).status, 0, "The valid Phase 5L readiness audit must pass.");
  runNegative("public-api-leakage", (value) => { value.prospectivePublicApi.prohibitedPublicInputs = []; }, "DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_LEAKAGE");
  runNegative("runtime-decision", (value) => { value.localRuntimeDependencyDecision.status = "undecided"; }, "DATA_LIST_DEFAULT_VIEW_LAYOUT_LOCAL_RUNTIME_DECISION_MISSING");
  runNegative("routing-proof", (value) => { value.routingPrerequisites.requiredProof = value.routingPrerequisites.requiredProof.filter((item) => item !== "official ZIP parity"); }, "DATA_LIST_DEFAULT_VIEW_LAYOUT_ROUTING_PROOF_INCOMPLETE");
  runNegative("internal-promotion", () => {}, "DATA_LIST_DEFAULT_VIEW_LAYOUT_INTERNAL_EXPORT_PROMOTION_FORBIDDEN", { indexAppend: "\nexport { projectDataListDefaultViewLayoutInternal } from \"./internal/data-list-default-view-layout-projection.js\";\n" });
  console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_DISTRIBUTION_READINESS_REGRESSIONS_PASSED cases=4");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

function runNegative(id, mutate, code, files = {}) {
  const readinessPath = resolve(temporary, `${id}.readiness.json`);
  const indexPath = resolve(temporary, `${id}.index.ts`);
  const publicContractPath = resolve(temporary, `${id}.public.json`);
  const distributionContractPath = resolve(temporary, `${id}.distribution.json`);
  cpSync(readiness, readinessPath);
  cpSync(publicIndex, indexPath);
  cpSync(publicContract, publicContractPath);
  cpSync(distributionContract, distributionContractPath);
  const value = JSON.parse(readFileSync(readinessPath, "utf8"));
  mutate(value);
  writeFileSync(readinessPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  if (files.indexAppend) writeFileSync(indexPath, `${readFileSync(indexPath, "utf8")}${files.indexAppend}`, "utf8");
  const result = run({ readinessPath, indexPath, publicContractPath, distributionContractPath });
  assert.notEqual(result.status, 0, `${id} must fail the readiness validator.`);
  assert.match(result.output, new RegExp(code), `${id} must report ${code}.`);
}

function run({ readinessPath = readiness, indexPath = publicIndex, publicContractPath = publicContract, distributionContractPath = distributionContract }) {
  const result = spawnSync(process.execPath, [validator, "--readiness", readinessPath, "--public-index", indexPath, "--public-contract", publicContractPath, "--distribution-contract", distributionContractPath], { cwd: root, encoding: "utf8" });
  return { status: result.status, output: `${result.stdout || ""}${result.stderr || ""}` };
}

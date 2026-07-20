#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase10c-data-list-sublist-scalar-summary-intent-dual-distribution-readiness.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase10c-summary-readiness-"));
const paths = {
  core: "compatibility/capability-manifests/data-list-sublist-scalar-summary-intent-core-public-api-readiness.v0.1.0.json",
  runtime: "compatibility/capability-manifests/data-list-sublist-scalar-summary-intent-local-runtime-public-api-readiness.v0.1.0.json",
  dual: "compatibility/capability-manifests/data-list-sublist-scalar-summary-intent-dual-distribution-readiness.v0.1.0.json",
  coreIndex: "packages/app-builder-core-materializer/src/index.ts",
  runtimeIndex: "runtimes/app-builder-core-local-runtime/src/index.ts",
  materializer: "scripts/materialize-full-app-generated-final.mjs"
};
const original = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, readFileSync(resolve(root, path), "utf8")]));
const promoted = JSON.parse(readFileSync(resolve(root, "docs/architecture/yeeflow-app-builder-core-migration-state.json"), "utf8")).proofStatus?.dataListSublistScalarSummaryIntentPublicDistribution === "passed";

try {
  assert.equal(run({}).status, 0);
  const cases = [
    ["core-temp-allocation", (value) => { value.core.inputBoundary.prohibited = value.core.inputBoundary.prohibited.filter((item) => item !== "temporary-variable allocation"); }, "SUBLIST_SCALAR_SUMMARY_INTENT_CORE_BOUNDARY_INVALID"],
    ["core-host-context", (value) => { value.core.inputBoundary.prohibited = value.core.inputBoundary.prohibited.filter((item) => item !== "host context"); }, "SUBLIST_SCALAR_SUMMARY_INTENT_CORE_BOUNDARY_INVALID"],
    ["runtime-temp-writeback", (value) => { value.runtime.prohibitedBehavior = value.runtime.prohibitedBehavior.filter((item) => item !== "temporary-variable writeback"); }, "SUBLIST_SCALAR_SUMMARY_INTENT_LOCAL_RUNTIME_BOUNDARY_INVALID"],
    ["runtime-binding", (value) => { value.runtime.outputShape.binding = "tempVar"; }, "SUBLIST_SCALAR_SUMMARY_INTENT_LOCAL_RUNTIME_BOUNDARY_INVALID"],
    ["runtime-template-binding", (value) => { value.runtime.prohibitedBehavior = value.runtime.prohibitedBehavior.filter((item) => item !== "template binding"); }, "SUBLIST_SCALAR_SUMMARY_INTENT_LOCAL_RUNTIME_BOUNDARY_INVALID"],
    ["missing-installed-plan", (value) => { value.dual.futurePhase10DPromotionProof = value.dual.futurePhase10DPromotionProof.filter((item) => !item.includes("simulated installed Plugin")); }, "SUBLIST_SCALAR_SUMMARY_INTENT_PROOF_PLAN_INCOMPLETE"],
    ["missing-rollback-plan", (value) => { value.dual.futurePhase10ERoutingProof = value.dual.futurePhase10ERoutingProof.filter((item) => !item.includes("Legacy rollback")); }, "SUBLIST_SCALAR_SUMMARY_INTENT_PROOF_PLAN_INCOMPLETE"],
    ["scope-widened", (value) => { value.dual.scope.excluded = value.dual.scope.excluded.filter((item) => item !== "Lookup"); }, "SUBLIST_SCALAR_SUMMARY_INTENT_PROOF_PLAN_INCOMPLETE"],
    ["public-core", (value) => { value.coreIndex += "\nexport { projectDataListSublistScalarSummaryIntentInternal as projectDataListSublistScalarSummaryIntent } from './internal/data-list-sublist-scalar-summary-intent.js';\n"; }, "SUBLIST_SCALAR_SUMMARY_INTENT_ACCIDENTAL_PUBLIC_EXPORT"],
    ["public-runtime", (value) => { value.runtimeIndex += "\nexport { lowerDataListSublistScalarSummaryIntentAtHost } from './internal-data-list-sublist-scalar-summary-intent.js';\n"; }, "SUBLIST_SCALAR_SUMMARY_INTENT_ACCIDENTAL_PUBLIC_EXPORT"],
    ["production-route", (value) => { value.materializer += "\nprojectDataListSublistScalarSummaryIntent({});\n"; }, "SUBLIST_SCALAR_SUMMARY_INTENT_AUDIT_ARTIFACT_OR_ROUTE_DRIFT"]
  ];
  for (const [id, mutate, expected] of (promoted ? cases.filter(([caseId]) => !caseId.startsWith("public-")) : cases)) {
    const value = { core: JSON.parse(original.core), runtime: JSON.parse(original.runtime), dual: JSON.parse(original.dual), coreIndex: original.coreIndex, runtimeIndex: original.runtimeIndex, materializer: original.materializer };
    mutate(value);
    const files = write(value, id);
    const result = run(files);
    assert.notEqual(result.status, 0, id);
    assert.match(result.output, new RegExp(expected), id);
  }
  console.log(`SUBLIST_SCALAR_SUMMARY_INTENT_DUAL_DISTRIBUTION_READINESS_REGRESSIONS_PASSED cases=${promoted ? 9 : 11}`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

function write(value, id) {
  const result = {};
  for (const [key, suffix] of [["core", "core.json"], ["runtime", "runtime.json"], ["dual", "dual.json"], ["coreIndex", "core-index.ts"], ["runtimeIndex", "runtime-index.ts"], ["materializer", "materializer.mjs"]]) {
    const path = resolve(temporary, `${id}-${suffix}`);
    writeFileSync(path, typeof value[key] === "string" ? value[key] : `${JSON.stringify(value[key], null, 2)}\n`, "utf8");
    result[key] = path;
  }
  return result;
}
function run(files) {
  const args = [validator];
  if (files.core) args.push("--core-readiness", files.core, "--runtime-readiness", files.runtime, "--dual-readiness", files.dual, "--core-index", files.coreIndex, "--runtime-index", files.runtimeIndex, "--materializer", files.materializer);
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

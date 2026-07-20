#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase6c-data-list-lookup-resolution-dual-distribution-readiness.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase6c-lookup-readiness-"));
const paths = {
  core: "compatibility/capability-manifests/app-builder-core-materializer-lookup-resolution-public-api-readiness.v0.1.0.json",
  runtime: "compatibility/capability-manifests/app-builder-core-local-runtime-lookup-resolution-public-api-readiness.v0.1.0.json",
  dual: "compatibility/capability-manifests/data-list-lookup-resolution-dual-distribution-readiness.v0.1.0.json",
  coreIndex: "packages/app-builder-core-materializer/src/index.ts",
  runtimeIndex: "runtimes/app-builder-core-local-runtime/src/index.ts",
};
const original = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, readFileSync(resolve(root, path), "utf8")]));
try {
  assert.equal(run({}).status, 0);
  for (const [id, mutate, code] of [
    ["core-id-leak", (value) => { value.core.prohibitedPublicShapes = value.core.prohibitedPublicShapes.filter((item) => item !== "ListID"); }, "DATA_LIST_LOOKUP_RESOLUTION_CORE_SHAPE_LEAKAGE"],
    ["core-map-leak", (value) => { value.core.prohibitedPublicShapes = value.core.prohibitedPublicShapes.filter((item) => item !== "target mapping"); }, "DATA_LIST_LOOKUP_RESOLUTION_CORE_SHAPE_LEAKAGE"],
    ["runtime-error", (value) => { value.runtime.stableErrors = value.runtime.stableErrors.slice(1); }, "DATA_LIST_LOOKUP_RESOLUTION_LOCAL_RUNTIME_CONTRACT_INVALID"],
    ["runtime-fallback", (value) => { value.runtime.prohibitedBehavior = value.runtime.prohibitedBehavior.filter((item) => item !== "fallback target mapping"); }, "DATA_LIST_LOOKUP_RESOLUTION_LOCAL_RUNTIME_CONTRACT_INVALID"],
    ["distribution-plan", (value) => { value.dual.futurePhase6DProof = value.dual.futurePhase6DProof.filter((item) => !item.includes("source, dist, ZIP")); }, "DATA_LIST_LOOKUP_RESOLUTION_PROOF_PLAN_INCOMPLETE"],
    ["routing-plan", (value) => { value.dual.futurePhase6ERoutingProof = value.dual.futurePhase6ERoutingProof.filter((item) => !item.includes("Legacy rollback")); }, "DATA_LIST_LOOKUP_RESOLUTION_PROOF_PLAN_INCOMPLETE"],
    ["public-core", (value) => { value.coreIndex += "\nexport { projectDataListLookupResolutionIntentInternal } from \"./internal/data-list-lookup-resolution-intent.js\";\n"; }, "DATA_LIST_LOOKUP_RESOLUTION_ACCIDENTAL_PUBLIC_EXPORT"],
    ["public-runtime", (value) => { value.runtimeIndex += "\nexport { lowerDataListLookupResolutionAtHost } from \"./internal-data-list-lookup-resolution-lowering.js\";\n"; }, "DATA_LIST_LOOKUP_RESOLUTION_ACCIDENTAL_PUBLIC_EXPORT"],
    ["scope", (value) => { value.dual.scopeExclusions = value.dual.scopeExclusions.filter((item) => item !== "sublists"); }, "DATA_LIST_LOOKUP_RESOLUTION_SCOPE_WIDENED"],
  ]) {
    const value = { core: JSON.parse(original.core), runtime: JSON.parse(original.runtime), dual: JSON.parse(original.dual), coreIndex: original.coreIndex, runtimeIndex: original.runtimeIndex };
    mutate(value);
    const files = write(value, id);
    const result = run(files);
    assert.notEqual(result.status, 0, id);
    assert.match(result.output, new RegExp(code), id);
  }
  console.log("DATA_LIST_LOOKUP_RESOLUTION_DUAL_DISTRIBUTION_READINESS_REGRESSIONS_PASSED cases=9");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

function write(value, id) {
  const output = {};
  for (const [key, suffix] of [["core", "core.json"], ["runtime", "runtime.json"], ["dual", "dual.json"], ["coreIndex", "core-index.ts"], ["runtimeIndex", "runtime-index.ts"]]) {
    const path = resolve(temporary, `${id}-${suffix}`);
    writeFileSync(path, typeof value[key] === "string" ? value[key] : `${JSON.stringify(value[key], null, 2)}\n`, "utf8");
    output[key] = path;
  }
  return output;
}
function run(files) {
  const args = [validator];
  if (files.core) args.push("--core-readiness", files.core, "--runtime-readiness", files.runtime, "--dual-readiness", files.dual, "--core-index", files.coreIndex, "--runtime-index", files.runtimeIndex);
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase7c-data-list-type1-identity-control-placement-readiness.mjs");
const corePath = "compatibility/capability-manifests/data-list-type1-identity-control-placement-core-public-api-readiness.v0.1.0.json";
const runtimePath = "compatibility/capability-manifests/data-list-type1-identity-control-placement-local-runtime-public-api-readiness.v0.1.0.json";
const dualPath = "compatibility/capability-manifests/data-list-type1-identity-control-placement-dual-distribution-readiness.v0.1.0.json";
const coreIndexPath = "packages/app-builder-core-materializer/src/index.ts";
const files = [corePath, runtimePath, dualPath, coreIndexPath];
const originals = new Map(files.map((path) => [path, readFileSync(resolve(root, path), "utf8")]));
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase7c-readiness-"));
try {
  assert.equal(run().status, 0);
  mutate(corePath, (value) => { value.inputBoundary.prohibited = value.inputBoundary.prohibited.filter((item) => item !== "control ID"); return value; });
  expect("core-leakage", "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_LEAKAGE"); restore(corePath);
  mutate(runtimePath, (value) => { value.errorContract.codes = value.errorContract.codes.filter((item) => item !== "TEMPLATE_GRAPH_REFERENCE_DUPLICATE"); return value; });
  expect("runtime-error", "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_RUNTIME_READINESS_INVALID"); restore(runtimePath);
  mutate(dualPath, (value) => { value.scope.included.push("Approval Forms"); return value; });
  expect("scope-widening", "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ROUTING_SCOPE_INVALID"); restore(dualPath);
  mutate(dualPath, (value) => { value.requiredFutureProof.distribution = ["source"]; return value; });
  expect("proof-plan", "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_PROOF_PLAN_INCOMPLETE"); restore(dualPath);
  writeFileSync(resolve(root, coreIndexPath), originals.get(coreIndexPath) + "\nexport { projectDataListType1IdentityControlPlacementInternal as projectDataListType1IdentityControlPlacement } from \"./internal/data-list-type1-identity-control-placement.js\";\n", "utf8");
  expect("accidental-export", "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ACCIDENTAL_PUBLIC_EXPORT"); restore(coreIndexPath);
  console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_DUAL_DISTRIBUTION_READINESS_REGRESSIONS_PASSED cases=6");
} finally {
  for (const [path, value] of originals) writeFileSync(resolve(root, path), value, "utf8");
  rmSync(temporary, { recursive: true, force: true });
}
function mutate(path, operation) { const value = JSON.parse(originals.get(path)); writeFileSync(resolve(root, path), JSON.stringify(operation(value), null, 2) + "\n", "utf8"); }
function restore(path) { writeFileSync(resolve(root, path), originals.get(path), "utf8"); }
function run() { const result = spawnSync(process.execPath, [validator], { cwd: root, encoding: "utf8" }); return { status: result.status, output: result.stdout + result.stderr }; }
function expect(id, code) { const result = run(); assert.notEqual(result.status, 0, id); assert.match(result.output, new RegExp(code), id); }

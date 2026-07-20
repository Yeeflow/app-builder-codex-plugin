#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase8c-data-list-sublist-scalar-row-schema-readiness.mjs");
const corePath = "compatibility/capability-manifests/data-list-sublist-scalar-row-schema-core-public-api-readiness.v0.1.0.json";
const runtimePath = "compatibility/capability-manifests/data-list-sublist-scalar-row-schema-local-runtime-public-api-readiness.v0.1.0.json";
const dualPath = "compatibility/capability-manifests/data-list-sublist-scalar-row-schema-dual-distribution-readiness.v0.1.0.json";
const coreIndexPath = "packages/app-builder-core-materializer/src/index.ts";
const originals = new Map([corePath, runtimePath, dualPath, coreIndexPath].map((path) => [path, readFileSync(resolve(root, path), "utf8")]));
const temp = mkdtempSync(resolve(tmpdir(), "yeeflow-phase8c-readiness-"));
try {
  assert.equal(run().status, 0);
  mutate(corePath, (value) => { value.inputBoundary.prohibited = value.inputBoundary.prohibited.filter((item) => item !== "nested control"); }); expect("core-leak", "DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORE_LEAKAGE"); restore(corePath);
  mutate(runtimePath, (value) => { value.errorContract.codes = value.errorContract.codes.slice(1); }); expect("missing-error", "DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_RUNTIME_READINESS_INVALID"); restore(runtimePath);
  mutate(dualPath, (value) => { value.coupledLegacyConsumers[0].consumers = ["buildFieldRules"]; }); expect("one-consumer-route", "DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_DUAL_READINESS_INVALID"); restore(dualPath);
  mutate(dualPath, (value) => { value.requiredFutureProof.distribution = ["compiled source"]; }); expect("missing-four-surface-proof", "DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_PROOF_PLAN_INCOMPLETE"); restore(dualPath);
  mutate(dualPath, (value) => { value.scope.excluded = value.scope.excluded.filter((item) => item !== "Lookup"); }); expect("scope-widening", "DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_SCOPE_WIDENED"); restore(dualPath);
  writeFileSync(resolve(root, coreIndexPath), originals.get(coreIndexPath).replace(/export \{ projectDataListSublistScalarRowSchemaInternal as projectDataListSublistScalarRowSchema \} from ".\/internal\/data-list-sublist-scalar-row-schema\.js";\n/u, ""), "utf8"); expect("promoted-export-missing", "DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_PUBLIC_PROMOTION_DRIFT"); restore(coreIndexPath);
  console.log("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_DUAL_DISTRIBUTION_READINESS_REGRESSIONS_PASSED cases=7");
} finally { for (const [path, value] of originals) writeFileSync(resolve(root, path), value, "utf8"); rmSync(temp, { recursive: true, force: true }); }
function mutate(path, operation) { const value = JSON.parse(originals.get(path)); operation(value); writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function restore(path) { writeFileSync(resolve(root, path), originals.get(path), "utf8"); }
function run() { const result = spawnSync(process.execPath, [validator], { cwd: root, encoding: "utf8" }); return { status: result.status, output: result.stdout + result.stderr }; }
function expect(id, code) { const result = run(); assert.notEqual(result.status, 0, id); assert.match(result.output, new RegExp(code), id); }

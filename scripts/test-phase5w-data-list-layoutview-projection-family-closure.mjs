#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "compatibility/capability-manifests/data-list-layoutview-projection-family-closure.v0.1.0.json");
const validator = resolve(root, "scripts/validate-phase5w-data-list-layoutview-projection-family-closure.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase5w-layoutview-closure-"));
try {
  assert.equal(run(source).status, 0);
  for (const [id, mutate, code] of [
    ["open", (value) => { value.decision.marker = "DATA_LIST_LAYOUTVIEW_PROJECTION_FAMILY_OPEN"; }, "DATA_LIST_LAYOUTVIEW_PROJECTION_FAMILY_OPEN"],
    ["unclassified", (value) => { value.matrix = value.matrix.filter((entry) => entry.id !== "data-list-custom-form-type-one"); }, "DATA_LIST_LAYOUTVIEW_UNCLASSIFIED_PATH"],
    ["cross-type", (value) => { value.matrix.find((entry) => entry.id === "data-list-custom-form-type-one").classification = "routed-core-local-runtime"; }, "DATA_LIST_LAYOUTVIEW_CROSS_TYPE_PROOF_FORBIDDEN"],
    ["boundary", (value) => { delete value.nextFamily.hostBoundary; }, "DATA_LIST_LAYOUTVIEW_NEXT_FAMILY_BOUNDARY_MISSING"],
  ]) { const path = resolve(temporary, `${id}.json`); const value = JSON.parse(readFileSync(source, "utf8")); mutate(value); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`); const result = run(path); assert.notEqual(result.status, 0); assert.match(result.output, new RegExp(code)); }
  console.log("DATA_LIST_LAYOUTVIEW_PROJECTION_FAMILY_CLOSURE_REGRESSIONS_PASSED cases=4");
} finally { rmSync(temporary, { recursive: true, force: true }); }
function run(path) { const result = spawnSync(process.execPath, [validator, path], { cwd: root, encoding: "utf8" }); return { status: result.status, output: `${result.stdout}${result.stderr}` }; }

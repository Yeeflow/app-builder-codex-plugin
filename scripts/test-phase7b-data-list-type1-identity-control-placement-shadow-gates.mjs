#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase7b-data-list-type1-identity-control-placement-shadow.mjs");
const files = ["packages/app-builder-core-materializer/src/internal/data-list-type1-identity-control-placement.ts", "runtimes/app-builder-core-local-runtime/src/internal-data-list-type1-identity-control-placement-lowering.ts", "packages/app-builder-core-materializer/src/index.ts", "compatibility/differential-fixtures/data-list-type1-identity-user-control-placement.v0.1.0.json"];
const originals = new Map(files.map((file) => [file, readFileSync(resolve(root, file), "utf8")]));
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase7b-gates-"));
try {
  assert.equal(run().status, 0);
  for (const [id, file, mutate, code] of [
    ["core-uuid", files[0], (text) => text + "\ncrypto.randomUUID();", "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_BOUNDARY_INVALID"],
    ["host-error", files[1], (text) => text.replace("TEMPLATE_GRAPH_REFERENCE_DUPLICATE", "REMOVED_CODE"), "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_HOST_BOUNDARY_INVALID"],
    ["public-export", files[2], (text) => text + "\nexport { projectDataListType1IdentityControlPlacementInternal } from \"./internal/data-list-type1-identity-control-placement.js\";", "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_PUBLIC_EXPORT_FORBIDDEN"],
    ["fixture", files[3], (text) => text.replace("\"excluded-workflow\"", "\"removed\""), "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_FIXTURE_INCOMPLETE"]
  ]) {
    writeFileSync(resolve(root, file), mutate(originals.get(file)), "utf8");
    const result = run();
    assert.notEqual(result.status, 0, id);
    assert.match(result.output, new RegExp(code), id);
    writeFileSync(resolve(root, file), originals.get(file), "utf8");
  }
  console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_SHADOW_GATES_PASSED cases=4");
} finally { for (const [file, text] of originals) writeFileSync(resolve(root, file), text, "utf8"); rmSync(temporary, { recursive: true, force: true }); }
function run() { const result = spawnSync(process.execPath, [validator], { cwd: root, encoding: "utf8" }); return { status: result.status, output: result.stdout + result.stderr }; }

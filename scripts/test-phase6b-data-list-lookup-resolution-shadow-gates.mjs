#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase6b-data-list-lookup-resolution-shadow.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase6b-lookup-gates-"));
const originals = new Map();
const files = [
  "packages/app-builder-core-materializer/src/internal/data-list-lookup-resolution-intent.ts",
  "runtimes/app-builder-core-local-runtime/src/internal-data-list-lookup-resolution-lowering.ts",
  "packages/app-builder-core-materializer/src/index.ts",
  "runtimes/app-builder-core-local-runtime/src/index.ts",
  "compatibility/differential-fixtures/data-list-lookup-resolution-shadow.v0.1.0.json",
];
for (const file of files) originals.set(file, readFileSync(resolve(root, file), "utf8"));
try {
  assert.equal(run().status, 0);
  for (const [id, file, mutate, code] of [
    ["core-host-map", files[0], (text) => `${text}\nconst targetListIdsByLogicalKey = {};`, "DATA_LIST_LOOKUP_RESOLUTION_CORE_BOUNDARY_INVALID"],
    ["core-uuid", files[0], (text) => `${text}\ncrypto.randomUUID();`, "DATA_LIST_LOOKUP_RESOLUTION_CORE_BOUNDARY_INVALID"],
    ["host-error", files[1], (text) => text.replace("LOOKUP_RESOLUTION_TARGET_MAPPING_AMBIGUOUS", "REMOVED_CODE"), "DATA_LIST_LOOKUP_RESOLUTION_HOST_BOUNDARY_INVALID"],
    ["public-core", files[2], (text) => `${text}\nexport { projectDataListLookupResolutionIntentInternal } from "./internal/data-list-lookup-resolution-intent.js";`, "DATA_LIST_LOOKUP_RESOLUTION_PUBLIC_EXPORT_FORBIDDEN"],
    ["public-host", files[3], (text) => `${text}\nexport { lowerDataListLookupResolutionAtHost } from "./internal-data-list-lookup-resolution-lowering.js";`, "DATA_LIST_LOOKUP_RESOLUTION_PUBLIC_EXPORT_FORBIDDEN"],
    ["fixture-surface", files[4], (text) => text.replace('"excluded-dashboard"', '"removed-dashboard"'), "DATA_LIST_LOOKUP_RESOLUTION_FIXTURE_INCOMPLETE"],
  ]) {
    writeFileSync(resolve(root, file), mutate(originals.get(file)), "utf8");
    const result = run();
    assert.notEqual(result.status, 0, id);
    assert.match(result.output, new RegExp(code), id);
    writeFileSync(resolve(root, file), originals.get(file), "utf8");
  }
  console.log("DATA_LIST_LOOKUP_RESOLUTION_SHADOW_REGRESSIONS_PASSED cases=6");
} finally {
  for (const [file, text] of originals) writeFileSync(resolve(root, file), text, "utf8");
  rmSync(temporary, { recursive: true, force: true });
}

function run() { const result = spawnSync(process.execPath, [validator], { cwd: root, encoding: "utf8" }); return { status: result.status, output: `${result.stdout}${result.stderr}` }; }

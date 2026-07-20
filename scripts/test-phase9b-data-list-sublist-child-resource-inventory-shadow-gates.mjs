#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase9b-data-list-sublist-child-resource-inventory-shadow.mjs");
const host = read("runtimes/app-builder-core-local-runtime/src/internal-data-list-sublist-child-resource-inventory.ts");
const runtimeIndex = read("runtimes/app-builder-core-local-runtime/src/index.ts");
const corpus = JSON.parse(read("compatibility/differential-fixtures/data-list-sublist-child-resource-inventory-shadow.v0.1.0.json"));
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase9b-inventory-gates-"));
try {
  assert.equal(run([]).status, 0);
  expect(["--host", write("host-node.ts", `import { readFileSync } from "node:fs";\n${host}`)], "SUBLIST_CHILD_RESOURCE_INVENTORY_HOST_BOUNDARY_INVALID");
  expect(["--host", write("host-error.ts", host.replaceAll("SUBLIST_ROW_SCHEMA_IDENTITY_RELATIONSHIP_BROKEN", "REMOVED_ERROR"))], "SUBLIST_CHILD_RESOURCE_INVENTORY_HOST_BOUNDARY_INVALID");
  expect(["--runtime-index", write("public-index.ts", `${runtimeIndex}\nexport { buildDataListSublistChildResourceInventoryInternal } from "./internal-data-list-sublist-child-resource-inventory.js";`)], "SUBLIST_CHILD_RESOURCE_INVENTORY_PUBLIC_EXPORT_FORBIDDEN");
  const incomplete = structuredClone(corpus); incomplete.cases.pop(); incomplete.caseCount -= 1;
  expect(["--corpus", write("corpus.json", JSON.stringify(incomplete))], "SUBLIST_CHILD_RESOURCE_INVENTORY_CORPUS_INCOMPLETE");
  console.log("SUBLIST_CHILD_RESOURCE_INVENTORY_NEGATIVE_GATES_PASSED cases=5");
} finally { rmSync(temporary, { recursive: true, force: true }); }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function write(name, value) { const path = resolve(temporary, name); writeFileSync(path, value); return path; }
function run(args) { const result = spawnSync(process.execPath, [validator, ...args], { cwd: root, encoding: "utf8" }); return { status: result.status, output: `${result.stdout}${result.stderr}` }; }
function expect(args, code) { const result = run(args); assert.notEqual(result.status, 0); assert.match(result.output, new RegExp(code)); }

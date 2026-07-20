#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), ".."); const validator = resolve(root, "scripts/validate-phase8e-data-list-sublist-scalar-row-schema-routing-blocker.mjs"); const source = readFileSync(resolve(root, "scripts/materialize-full-app-generated-final.mjs"), "utf8"); const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase8e-blocker-"));
try {
  assert.equal(run(source).status, 0);
  expect("one-consumer-removed", source.replace(/\n\s*const listVariables = dataListSubListVariables\(field, `field-rules:\$\{field\?\.fieldName \|\| field\?\.displayName \|\| "sublist"\}`\)/u, ""), "DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_ROUTING_BLOCKER_INVALID");
  expect("unsafe-route", `${source}\n// DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORE_ROUTE_START\n`, "DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_ROUTING_SCOPE_VIOLATION");
  console.log("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_ROUTING_BLOCKER_REGRESSIONS_PASSED cases=3");
} finally { rmSync(temporary, { recursive: true, force: true }); }
function run(value) { const path = resolve(temporary, "materializer.mjs"); writeFileSync(path, value); const result = spawnSync(process.execPath, [validator, "--source", path], { cwd: root, encoding: "utf8" }); return { status: result.status, output: result.stdout + result.stderr }; } function expect(id, value, code) { const result = run(value); assert.notEqual(result.status, 0, id); assert.match(result.output, new RegExp(code), id); }

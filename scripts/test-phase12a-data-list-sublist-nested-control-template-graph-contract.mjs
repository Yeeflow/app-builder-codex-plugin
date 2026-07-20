#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase12a-data-list-sublist-nested-control-template-graph-contract.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase12a-nested-control-"));
try {
  assert.equal(run().status, 0);
  mutate((value) => { value.authoritativeIdentityModel.productIdentities.push("childFieldId"); }, "SUBLIST_NESTED_CONTROL_IDENTITY_MODEL_INVALID");
  mutate((value) => { value.immutableCoreBoundary.prohibited = value.immutableCoreBoundary.prohibited.filter((item) => item !== "ID allocation"); }, "SUBLIST_NESTED_CONTROL_CORE_BOUNDARY_INVALID");
  mutate((value) => { value.immutableCoreBoundary.prohibited = value.immutableCoreBoundary.prohibited.filter((item) => item !== "template or resource mutation"); }, "SUBLIST_NESTED_CONTROL_CORE_BOUNDARY_INVALID");
  mutate((value) => { value.stableErrors = value.stableErrors.filter((item) => item !== "SUBLIST_NESTED_CONTROL_CHILD_REFERENCE_DUPLICATE"); }, "SUBLIST_NESTED_CONTROL_TEMPLATE_SNAPSHOT_INVALID");
  mutate((value) => { value.auditMutations.productionRouting = true; }, "SUBLIST_NESTED_CONTROL_AUDIT_SCOPE_VIOLATION");
  console.log("SUBLIST_NESTED_CONTROL_TEMPLATE_GRAPH_CONTRACT_REGRESSIONS_PASSED cases=6");
} finally { rmSync(temporary, { recursive: true, force: true }); }

function run(args = []) { const result = spawnSync(process.execPath, [validator, ...args], { cwd: root, encoding: "utf8" }); return { status: result.status, output: `${result.stdout}${result.stderr}` }; }
function mutate(change, code) { const path = "compatibility/capability-manifests/data-list-sublist-nested-control-template-graph-contract.v0.2.0.json"; const value = JSON.parse(readFileSync(resolve(root, path), "utf8")); change(value); const target = resolve(temporary, `${code}.json`); writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`); const result = run(["--contract", target]); assert.notEqual(result.status, 0); assert.match(result.output, new RegExp(code)); }

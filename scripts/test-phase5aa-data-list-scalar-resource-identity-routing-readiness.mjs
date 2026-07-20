#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "compatibility/capability-manifests/data-list-scalar-resource-identity-routing-readiness.v0.1.0.json");
const validator = resolve(root, "scripts/validate-phase5aa-data-list-scalar-resource-identity-routing-readiness.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase5aa-routing-readiness-"));
try {
  assert.equal(run(source).status, 0);
  for (const [id, mutate, code] of [
    ["missing-host-map", (value) => { value.identityAvailability.listId = "available"; }, "DATA_LIST_SCALAR_RESOURCE_IDENTITY_HOST_MAP_UNAVAILABLE"],
    ["lossy-route", (value) => { value.identityAvailability.fieldId = "number coercion"; }, "DATA_LIST_SCALAR_RESOURCE_IDENTITY_HOST_MAP_UNAVAILABLE"],
    ["non-scalar", (value) => { value.excludedFamilies = value.excludedFamilies.filter((item) => item !== "lookup"); }, "DATA_LIST_SCALAR_RESOURCE_IDENTITY_SCOPE_INVALID"],
    ["fallback", (value) => { value.requiredAdapters.prohibitions = value.requiredAdapters.prohibitions.slice(0, 6); }, "DATA_LIST_SCALAR_RESOURCE_IDENTITY_ADAPTER_BOUNDARY_INVALID"],
    ["missing-runtime", (value) => { value.requiredAdapters.localRuntime = ""; }, "DATA_LIST_SCALAR_RESOURCE_IDENTITY_ADAPTER_BOUNDARY_INVALID"],
    ["missing-rollback", (value) => { value.phase5ABRoutingProof.rollback = ""; }, "DATA_LIST_SCALAR_RESOURCE_IDENTITY_ROUTING_PROOF_MISSING"],
  ]) {
    const path = resolve(temporary, `${id}.json`);
    const value = JSON.parse(readFileSync(source, "utf8"));
    mutate(value);
    writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    const result = run(path);
    assert.notEqual(result.status, 0);
    assert.match(result.output, new RegExp(code));
  }
  console.log("DATA_LIST_SCALAR_RESOURCE_IDENTITY_ROUTING_READINESS_REGRESSIONS_PASSED cases=6");
} finally { rmSync(temporary, { recursive: true, force: true }); }

function run(path) { const result = spawnSync(process.execPath, [validator, "--contract", path], { cwd: root, encoding: "utf8" }); return { status: result.status, output: `${result.stdout}${result.stderr}` }; }

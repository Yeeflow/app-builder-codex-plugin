#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-data-list-sublist-child-resource-inventory-public-api.mjs");
const distributionValidator = resolve(root, "scripts/validate-core-distribution.mjs");
const runtimePath = resolve(root, "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json");
const source = resolve(root, "dist/yeeflow-app-builder-plugin/core");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-sublist-child-inventory-gates-"));
try {
  const runtime = JSON.parse(readFileSync(runtimePath, "utf8"));
  apiFailure("missing-export", change(runtime, (x) => { x.runtimeExports = x.runtimeExports.filter((name) => name !== "buildDataListSublistChildResourceInventoryAtHost"); }), "SUBLIST_CHILD_RESOURCE_INVENTORY_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID");
  apiFailure("internal-helper", change(runtime, (x) => { x.runtimeExports.push("buildDataListSublistChildResourceInventoryInternal"); }), "SUBLIST_CHILD_RESOURCE_INVENTORY_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID");
  apiFailure("missing-error", change(runtime, (x) => { x.buildDataListSublistChildResourceInventoryAtHost.errors.pop(); }), "SUBLIST_CHILD_RESOURCE_INVENTORY_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID");
  apiFailure("host-leak", change(runtime, (x) => { x.buildDataListSublistChildResourceInventoryAtHost.prohibited = "No helper."; }), "SUBLIST_CHILD_RESOURCE_INVENTORY_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID");
  distributionFailure("missing-manifest-export", (dir) => manifest(dir, (entry) => { entry.exports = entry.exports.filter((name) => name !== "buildDataListSublistChildResourceInventoryAtHost"); }), "CORE_DISTRIBUTION_EXPORT_UNRESOLVED");
  distributionFailure("unexpected-manifest-export", (dir) => manifest(dir, (entry) => { entry.exports.push("buildDataListSublistChildResourceInventoryInternal"); }), "CORE_DISTRIBUTION_EXPORT_UNRESOLVED");
  distributionFailure("checksum", (dir) => { const path = resolve(dir, "yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"); writeFileSync(path, `${readFileSync(path, "utf8")}\n`); }, "CORE_DISTRIBUTION_CHECKSUM_MISMATCH");
  distributionFailure("workspace-leak", (dir) => { const path = resolve(dir, "yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"); const text = `${readFileSync(path, "utf8")}\nimport "@yeeflow/forbidden";\n`; writeFileSync(path, text); manifest(dir, (entry) => { entry.sha256 = sha(text); }); }, "CORE_DISTRIBUTION_WORKSPACE_LEAKAGE");
  console.log("SUBLIST_CHILD_RESOURCE_INVENTORY_DISTRIBUTION_GATES_PASSED cases=8");
} finally { rmSync(temporary, { recursive: true, force: true }); }
function change(value, operation) { const copy = structuredClone(value); operation(copy); return copy; } function apiFailure(id, runtime, code) { const path = resolve(temporary, `${id}.json`); writeFileSync(path, JSON.stringify(runtime)); const result = spawnSync(process.execPath, [validator, "--runtime-contract", path], { cwd: root, encoding: "utf8" }); assert.notEqual(result.status, 0, id); assert.match(result.stdout + result.stderr, new RegExp(code), id); } function distributionFailure(id, operation, code) { const dir = resolve(temporary, id); cpSync(source, dir, { recursive: true }); operation(dir); const result = spawnSync(process.execPath, [distributionValidator, dir], { cwd: root, encoding: "utf8" }); assert.notEqual(result.status, 0, id); assert.match(result.stdout + result.stderr, new RegExp(code), id); } function manifest(dir, operation) { const path = resolve(dir, "yeeflow-app-builder-core-distribution.v0.1.0.json"); const value = JSON.parse(readFileSync(path, "utf8")); operation(value.artifacts.find((entry) => entry.packageName === "@yeeflow/app-builder-core-local-runtime")); writeFileSync(path, JSON.stringify(value, null, 2) + "\n"); } function sha(text) { return createHash("sha256").update(text).digest("hex"); }

#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-data-list-sublist-scalar-row-schema-public-api.mjs");
const distributionValidator = resolve(root, "scripts/validate-core-distribution.mjs");
const corePath = resolve(root, "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const runtimePath = resolve(root, "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json");
const source = resolve(root, "dist/yeeflow-app-builder-plugin/core");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-sublist-distribution-gates-"));
try {
  const core = JSON.parse(readFileSync(corePath, "utf8")); const runtime = JSON.parse(readFileSync(runtimePath, "utf8"));
  apiFailure("core-missing", change(core, (x) => { x.runtimeExports = x.runtimeExports.filter((name) => name !== "projectDataListSublistScalarRowSchema"); }), runtime, "DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORE_PUBLIC_API_CONTRACT_INVALID");
  apiFailure("core-leak", change(core, (x) => { x.projectDataListSublistScalarRowSchema.input = "A row input."; x.projectDataListSublistScalarRowSchema.prohibited = "No helper."; }), runtime, "DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORE_PUBLIC_API_CONTRACT_INVALID");
  apiFailure("runtime-missing", core, change(runtime, (x) => { x.runtimeExports = x.runtimeExports.filter((name) => name !== "lowerDataListSublistScalarRowSchemaAtHost"); }), "DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID");
  apiFailure("runtime-errors", core, change(runtime, (x) => { x.lowerDataListSublistScalarRowSchemaAtHost.errors.pop(); }), "DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID");
  distributionFailure("missing-export", (dir) => manifest(dir, "@yeeflow/app-builder-core-materializer", (entry) => { entry.exports.pop(); }), "CORE_DISTRIBUTION_EXPORT_UNRESOLVED");
  distributionFailure("extra-export", (dir) => manifest(dir, "@yeeflow/app-builder-core-local-runtime", (entry) => { entry.exports.push("Internal"); }), "CORE_DISTRIBUTION_EXPORT_UNRESOLVED");
  distributionFailure("checksum", (dir) => { const path = resolve(dir, "yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"); writeFileSync(path, `${readFileSync(path, "utf8")}\n`); }, "CORE_DISTRIBUTION_CHECKSUM_MISMATCH");
  distributionFailure("workspace-leak", (dir) => { const path = resolve(dir, "yeeflow-app-builder-core-materializer.v0.1.0.mjs"); const text = `${readFileSync(path, "utf8")}\nimport \"@yeeflow/forbidden\";\n`; writeFileSync(path, text); manifest(dir, "@yeeflow/app-builder-core-materializer", (entry) => { entry.sha256 = sha(text); }); }, "CORE_DISTRIBUTION_WORKSPACE_LEAKAGE");
  console.log("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_DISTRIBUTION_GATES_PASSED cases=8");
} finally { rmSync(temporary, { recursive: true, force: true }); }
function change(value, operation) { const copy = structuredClone(value); operation(copy); return copy; }
function apiFailure(id, core, runtime, code) { const a = resolve(temporary, `${id}-core.json`); const b = resolve(temporary, `${id}-runtime.json`); writeFileSync(a, JSON.stringify(core)); writeFileSync(b, JSON.stringify(runtime)); const result = spawnSync(process.execPath, [validator, "--materializer-contract", a, "--runtime-contract", b], { cwd: root, encoding: "utf8" }); assert.notEqual(result.status, 0, id); assert.match(result.stdout + result.stderr, new RegExp(code), id); }
function distributionFailure(id, operation, code) { const dir = resolve(temporary, id); cpSync(source, dir, { recursive: true }); operation(dir); const result = spawnSync(process.execPath, [distributionValidator, dir], { cwd: root, encoding: "utf8" }); assert.notEqual(result.status, 0, id); assert.match(result.stdout + result.stderr, new RegExp(code), id); }
function manifest(dir, name, operation) { const path = resolve(dir, "yeeflow-app-builder-core-distribution.v0.1.0.json"); const value = JSON.parse(readFileSync(path, "utf8")); operation(value.artifacts.find((entry) => entry.packageName === name)); writeFileSync(path, JSON.stringify(value, null, 2) + "\n"); }
function sha(text) { return createHash("sha256").update(text).digest("hex"); }

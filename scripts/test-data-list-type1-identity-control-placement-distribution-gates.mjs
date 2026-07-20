#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const apiValidator = resolve(root, "scripts/validate-data-list-type1-identity-control-placement-public-api.mjs");
const distributionValidator = resolve(root, "scripts/validate-core-distribution.mjs");
const corePath = resolve(root, "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const runtimePath = resolve(root, "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json");
const sourceDistribution = resolve(root, "dist/yeeflow-app-builder-plugin/core");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-type1-placement-distribution-gates-"));
try {
  const core = JSON.parse(readFileSync(corePath, "utf8"));
  const runtime = JSON.parse(readFileSync(runtimePath, "utf8"));
  assertApiFailure("core-missing", mutate(core, (value) => { value.runtimeExports = value.runtimeExports.filter((name) => name !== "projectDataListType1IdentityControlPlacement"); }), runtime, "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_PUBLIC_API_CONTRACT_INVALID");
  assertApiFailure("core-host-leak", mutate(core, (value) => { value.projectDataListType1IdentityControlPlacement.input = "A placement input."; value.projectDataListType1IdentityControlPlacement.prohibited = "No internal helper export."; }), runtime, "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_PUBLIC_API_CONTRACT_INVALID");
  assertApiFailure("runtime-missing", core, mutate(runtime, (value) => { value.runtimeExports = []; }), "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID");
  assertApiFailure("runtime-error", core, mutate(runtime, (value) => { value.lowerDataListType1IdentityControlPlacementAtHost.errors = value.lowerDataListType1IdentityControlPlacementAtHost.errors.slice(1); }), "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID");
  assertApiFailure("runtime-extra", core, mutate(runtime, (value) => { value.runtimeExports.push("clone"); }), "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID");
  assertDistributionFailure("missing-export", (directory) => editManifest(directory, "@yeeflow/app-builder-core-materializer", (entry) => { entry.exports = entry.exports.filter((name) => name !== "projectDataListType1IdentityControlPlacement"); }), "CORE_DISTRIBUTION_EXPORT_UNRESOLVED");
  assertDistributionFailure("extra-export", (directory) => editManifest(directory, "@yeeflow/app-builder-core-local-runtime", (entry) => { entry.exports.push("clone"); }), "CORE_DISTRIBUTION_EXPORT_UNRESOLVED");
  assertDistributionFailure("checksum", (directory) => writeFileSync(resolve(directory, "yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"), `${readFileSync(resolve(directory, "yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"), "utf8")}\n`), "CORE_DISTRIBUTION_CHECKSUM_MISMATCH");
  assertDistributionFailure("workspace-leak", (directory) => { const artifact = resolve(directory, "yeeflow-app-builder-core-materializer.v0.1.0.mjs"); const text = `${readFileSync(artifact, "utf8")}\nimport \"@yeeflow/forbidden\";\n`; writeFileSync(artifact, text); editManifest(directory, "@yeeflow/app-builder-core-materializer", (entry) => { entry.sha256 = sha(text); }); }, "CORE_DISTRIBUTION_WORKSPACE_LEAKAGE");
  console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_DISTRIBUTION_GATES_PASSED cases=9");
} finally { rmSync(temporary, { recursive: true, force: true }); }
function mutate(value, operation) { const copy = structuredClone(value); operation(copy); return copy; }
function assertApiFailure(id, core, runtime, code) { const materializer = resolve(temporary, `${id}-materializer.json`); const localRuntime = resolve(temporary, `${id}-runtime.json`); writeFileSync(materializer, JSON.stringify(core, null, 2) + "\n"); writeFileSync(localRuntime, JSON.stringify(runtime, null, 2) + "\n"); const result = spawnSync(process.execPath, [apiValidator, "--materializer-contract", materializer, "--runtime-contract", localRuntime], { cwd: root, encoding: "utf8" }); assert.notEqual(result.status, 0, id); assert.match(result.stdout + result.stderr, new RegExp(code), id); }
function assertDistributionFailure(id, operation, code) { const directory = resolve(temporary, id); cpSync(sourceDistribution, directory, { recursive: true }); operation(directory); const result = spawnSync(process.execPath, [distributionValidator, directory], { cwd: root, encoding: "utf8" }); assert.notEqual(result.status, 0, id); assert.match(result.stdout + result.stderr, new RegExp(code), id); }
function editManifest(directory, packageName, operation) { const path = resolve(directory, "yeeflow-app-builder-core-distribution.v0.1.0.json"); const manifest = JSON.parse(readFileSync(path, "utf8")); operation(manifest.artifacts.find((item) => item.packageName === packageName)); writeFileSync(path, JSON.stringify(manifest, null, 2) + "\n"); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }

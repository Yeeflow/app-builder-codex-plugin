#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const apiValidator = resolve(root, "scripts/validate-data-list-lookup-resolution-public-api.mjs");
const distributionValidator = resolve(root, "scripts/validate-core-distribution.mjs");
const sourceCore = resolve(root, "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const sourceRuntime = resolve(root, "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json");
const sourceDistribution = resolve(root, "dist/yeeflow-app-builder-plugin/core");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-lookup-distribution-gates-"));

try {
  const core = JSON.parse(readFileSync(sourceCore, "utf8"));
  const runtime = JSON.parse(readFileSync(sourceRuntime, "utf8"));
  assertFailure("core-missing-export", mutate(core, (value) => { value.runtimeExports = value.runtimeExports.filter((name) => name !== "projectDataListLookupResolutionIntent"); }), runtime, "DATA_LIST_LOOKUP_RESOLUTION_CORE_PUBLIC_API_CONTRACT_INVALID");
  assertFailure("core-host-shape", mutate(core, (value) => { value.projectDataListLookupResolutionIntent.input = value.projectDataListLookupResolutionIntent.input.replace(/ListID/gu, "List identity"); }), runtime, "DATA_LIST_LOOKUP_RESOLUTION_CORE_PUBLIC_API_CONTRACT_INVALID");
  assertFailure("runtime-missing-export", core, mutate(runtime, (value) => { value.runtimeExports = value.runtimeExports.filter((name) => name !== "lowerDataListLookupResolutionAtHost"); }), "DATA_LIST_LOOKUP_RESOLUTION_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID");
  assertFailure("runtime-missing-error", core, mutate(runtime, (value) => { value.lowerDataListLookupResolutionAtHost.errors = value.lowerDataListLookupResolutionAtHost.errors.slice(1); }), "DATA_LIST_LOOKUP_RESOLUTION_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID");
  assertFailure("runtime-internal-export", core, mutate(runtime, (value) => { value.runtimeExports.push("validateLosslessId"); }), "DATA_LIST_LOOKUP_RESOLUTION_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID");

  assertDistributionFailure("artifact-export-mismatch", (directory) => {
    const manifestPath = resolve(directory, "yeeflow-app-builder-core-distribution.v0.1.0.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const artifact = manifest.artifacts.find((item) => item.packageName === "@yeeflow/app-builder-core-materializer");
    artifact.exports = artifact.exports.filter((name) => name !== "projectDataListLookupResolutionIntent");
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }, "CORE_DISTRIBUTION_EXPORT_UNRESOLVED");
  assertDistributionFailure("artifact-checksum-mismatch", (directory) => {
    const artifact = resolve(directory, "yeeflow-app-builder-core-materializer.v0.1.0.mjs");
    writeFileSync(artifact, `${readFileSync(artifact, "utf8")}\n`);
  }, "CORE_DISTRIBUTION_CHECKSUM_MISMATCH");
  assertDistributionFailure("artifact-workspace-leak", (directory) => {
    const artifact = resolve(directory, "yeeflow-app-builder-core-materializer.v0.1.0.mjs");
    const text = `${readFileSync(artifact, "utf8")}\nimport \"@yeeflow/forbidden\";\n`;
    writeFileSync(artifact, text);
    const manifestPath = resolve(directory, "yeeflow-app-builder-core-distribution.v0.1.0.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const entry = manifest.artifacts.find((item) => item.path.endsWith("materializer.v0.1.0.mjs"));
    entry.sha256 = sha(text);
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }, "CORE_DISTRIBUTION_WORKSPACE_LEAKAGE");

  console.log("DATA_LIST_LOOKUP_RESOLUTION_DISTRIBUTION_GATES_PASSED cases=8");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

function mutate(value, callback) { const copy = structuredClone(value); callback(copy); return copy; }
function assertFailure(id, core, runtime, code) {
  const corePath = resolve(temporary, `${id}-core.json`);
  const runtimePath = resolve(temporary, `${id}-runtime.json`);
  writeFileSync(corePath, `${JSON.stringify(core, null, 2)}\n`);
  writeFileSync(runtimePath, `${JSON.stringify(runtime, null, 2)}\n`);
  const result = spawnSync(process.execPath, [apiValidator, "--materializer-contract", corePath, "--runtime-contract", runtimePath], { cwd: root, encoding: "utf8" });
  assert.notEqual(result.status, 0, id);
  assert.match(`${result.stdout}${result.stderr}`, new RegExp(code), id);
}
function assertDistributionFailure(id, change, code) {
  const directory = resolve(temporary, id);
  cpSync(sourceDistribution, directory, { recursive: true });
  change(directory);
  const result = spawnSync(process.execPath, [distributionValidator, directory], { cwd: root, encoding: "utf8" });
  assert.notEqual(result.status, 0, id);
  assert.match(`${result.stdout}${result.stderr}`, new RegExp(code), id);
}
function sha(text) { return createHash("sha256").update(text).digest("hex"); }

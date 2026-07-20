#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-data-list-sublist-scalar-summary-intent-public-api.mjs");
const distributionValidator = resolve(root, "scripts/validate-core-distribution.mjs");
const corePath = resolve(root, "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const runtimePath = resolve(root, "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json");
const artifactDirectory = resolve(root, "dist/yeeflow-app-builder-plugin/core");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-summary-intent-distribution-gates-"));
try {
  const core = json(corePath); const runtime = json(runtimePath);
  apiFailure("core-missing", mutate(core, (value) => value.runtimeExports = value.runtimeExports.filter((entry) => entry !== "projectDataListSublistScalarSummaryIntent")), runtime, "SUBLIST_SCALAR_SUMMARY_INTENT_CORE_PUBLIC_API_CONTRACT_INVALID");
  apiFailure("core-temp-leak", mutate(core, (value) => value.projectDataListSublistScalarSummaryIntent.prohibited = "No prohibition."), runtime, "SUBLIST_SCALAR_SUMMARY_INTENT_CORE_PUBLIC_API_CONTRACT_INVALID");
  apiFailure("runtime-missing", core, mutate(runtime, (value) => value.runtimeExports = value.runtimeExports.filter((entry) => entry !== "lowerDataListSublistScalarSummaryIntentAtHost")), "SUBLIST_SCALAR_SUMMARY_INTENT_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID");
  apiFailure("runtime-binding", core, mutate(runtime, (value) => value.lowerDataListSublistScalarSummaryIntentAtHost.return = "binding: string"), "SUBLIST_SCALAR_SUMMARY_INTENT_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID");
  distributionFailure("extra-export", (directory) => { const manifest = json(resolve(directory, "yeeflow-app-builder-core-distribution.v0.1.0.json")); manifest.artifacts.find((entry) => entry.packageName === "@yeeflow/app-builder-core-materializer").exports.push("Internal"); writeFileSync(resolve(directory, "yeeflow-app-builder-core-distribution.v0.1.0.json"), `${JSON.stringify(manifest, null, 2)}\n`); }, "CORE_DISTRIBUTION_EXPORT_UNRESOLVED");
  distributionFailure("workspace-leak", (directory) => { const path = resolve(directory, "yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"); writeFileSync(path, `${readFileSync(path, "utf8")}\nimport \"@yeeflow/forbidden\";\n`); }, "CORE_DISTRIBUTION_CHECKSUM_MISMATCH");
  console.log("SUBLIST_SCALAR_SUMMARY_INTENT_DISTRIBUTION_GATES_PASSED cases=6");
} finally { rmSync(temporary, { recursive: true, force: true }); }
function mutate(value, operation) { const copy = structuredClone(value); operation(copy); return copy; }
function apiFailure(id, core, runtime, expected) { const coreFile = resolve(temporary, `${id}-core.json`); const runtimeFile = resolve(temporary, `${id}-runtime.json`); writeFileSync(coreFile, `${JSON.stringify(core, null, 2)}\n`); writeFileSync(runtimeFile, `${JSON.stringify(runtime, null, 2)}\n`); const result = spawnSync(process.execPath, [validator, "--materializer-contract", coreFile, "--runtime-contract", runtimeFile], { cwd: root, encoding: "utf8" }); assert.notEqual(result.status, 0, id); assert.match(`${result.stdout}${result.stderr}`, new RegExp(expected)); }
function distributionFailure(id, operation, expected) { const directory = resolve(temporary, id); cpSync(artifactDirectory, directory, { recursive: true }); operation(directory); const result = spawnSync(process.execPath, [distributionValidator, directory], { cwd: root, encoding: "utf8" }); assert.notEqual(result.status, 0, id); assert.match(`${result.stdout}${result.stderr}`, new RegExp(expected)); }
function json(path) { return JSON.parse(readFileSync(path, "utf8")); }

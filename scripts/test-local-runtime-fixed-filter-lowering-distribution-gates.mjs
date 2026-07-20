#!/usr/bin/env node

import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceApi = resolve(root, "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json");
const validator = resolve(root, "scripts/validate-local-runtime-fixed-filter-lowering-public-api.mjs");
const distributionValidator = resolve(root, "scripts/validate-core-distribution.mjs");
const sourceCoreDirectory = resolve(root, "dist/yeeflow-app-builder-plugin/core");
const runtimeArtifactName = "yeeflow-app-builder-core-local-runtime.v0.1.0.mjs";
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-local-runtime-distribution-gates-"));

try {
  run("missing-runtime-export", (api) => { api.runtimeExports = ["capabilityMetadata"]; }, "LOCAL_RUNTIME_FIXED_FILTER_LOWERING_PUBLIC_API_EXPORT_UNRESOLVED");
  run("unexpected-runtime-export", (api) => { api.runtimeExports.push("internalHelper"); }, "LOCAL_RUNTIME_FIXED_FILTER_LOWERING_PUBLIC_API_EXPORT_UNRESOLVED");
  run("missing-mutation-ownership", (api) => { api.lowerFixedFilterProjectionAtHost.mutationOwnership = "immutable only"; }, "LOCAL_RUNTIME_FIXED_FILTER_LOWERING_MUTATION_OWNERSHIP_INVALID");
  run("allocation-error-mismatch", (api) => { api.lowerFixedFilterProjectionAtHost.errors.pop(); }, "LOCAL_RUNTIME_FIXED_FILTER_LOWERING_ALLOCATION_ERROR_CONTRACT_INVALID");
  run("version-mismatch", (api) => { api.packageVersion = "0.0.0"; }, "LOCAL_RUNTIME_FIXED_FILTER_LOWERING_PUBLIC_API_CONTRACT_INVALID");
  await runArtifact("surface-output-mismatch", (text) => text.replace("pre: intent.pre,", 'pre: "or",'), async (runtime) => {
    const value = runtime.lowerFixedFilterProjectionAtHost(projection(), allocation(), []);
    if (value.filter[0].pre !== "and") throw new Error("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_SURFACE_PARITY_MISMATCH");
  }, "LOCAL_RUNTIME_FIXED_FILTER_LOWERING_SURFACE_PARITY_MISMATCH");
  await runArtifact("allocation-error-mismatch", (text) => text.replace("FIXED_FILTER_KEY_ALLOCATION_MISSING", "FIXED_FILTER_KEY_ALLOCATION_OTHER"), async (runtime) => {
    try { runtime.lowerFixedFilterProjectionAtHost(projection(), { keysByRequestId: {} }, []); }
    catch (error) { if (!String(error.message).startsWith("FIXED_FILTER_KEY_ALLOCATION_MISSING")) throw new Error("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_ALLOCATION_ERROR_CONTRACT_INVALID"); }
  }, "LOCAL_RUNTIME_FIXED_FILTER_LOWERING_ALLOCATION_ERROR_CONTRACT_INVALID");
  await runArtifact("fallback-allocation", (text) => text.replace("const key = keys?.[request.requestId];", 'const key = keys?.[request.requestId] ?? "fallback";'), async (runtime) => {
    try { runtime.lowerFixedFilterProjectionAtHost(projection(), { keysByRequestId: {} }, []); }
    catch { return; }
    throw new Error("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_IMPLICIT_ALLOCATION_FORBIDDEN");
  }, "LOCAL_RUNTIME_FIXED_FILTER_LOWERING_IMPLICIT_ALLOCATION_FORBIDDEN");
  console.log("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_DISTRIBUTION_GATES_PASSED cases=8");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

function run(name, mutate, expectedCode) {
  const path = resolve(temporary, `${name}.json`);
  const api = JSON.parse(readFileSync(sourceApi, "utf8"));
  mutate(api);
  writeFileSync(path, `${JSON.stringify(api, null, 2)}\n`, "utf8");
  const result = spawnSync(process.execPath, [validator, "--public-api", path], { cwd: root, encoding: "utf8" });
  if (result.status === 0 || !`${result.stdout}${result.stderr}`.includes(expectedCode)) throw new Error(`Expected ${expectedCode}: ${name}`);
}

async function runArtifact(name, mutate, assertion, expectedCode) {
  const directory = resolve(temporary, name);
  cpSync(sourceCoreDirectory, directory, { recursive: true });
  const artifactPath = resolve(directory, runtimeArtifactName);
  const text = mutate(readFileSync(artifactPath, "utf8"));
  writeFileSync(artifactPath, text, "utf8");
  const manifestPath = resolve(directory, "yeeflow-app-builder-core-distribution.v0.1.0.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const artifact = manifest.artifacts.find((item) => item.path === `core/${runtimeArtifactName}`);
  artifact.sha256 = createHash("sha256").update(text).digest("hex");
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const validation = spawnSync(process.execPath, [distributionValidator, directory], { cwd: root, encoding: "utf8" });
  if (validation.status !== 0) throw new Error(`Expected valid generic artifact mutation: ${name}`);
  const runtime = await import(`${pathToFileURL(artifactPath).href}?case=${name}`);
  try { await assertion(runtime); }
  catch (error) {
    if (String(error.message).includes(expectedCode)) return;
    throw error;
  }
  throw new Error(`Expected ${expectedCode}: ${name}`);
}

function projection() {
  return Object.freeze({
    intents: Object.freeze([Object.freeze({ requestId: "view:fixed-filter:0", ordinal: 0, pre: "and", left: "Status", op: "=", right: "Active" })]),
    keyRequests: Object.freeze([Object.freeze({ requestId: "view:fixed-filter:0", ordinal: 0 })]),
    findings: Object.freeze([]),
  });
}
function allocation() { return { keysByRequestId: { "view:fixed-filter:0": "key-status" } }; }

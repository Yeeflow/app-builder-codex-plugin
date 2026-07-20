#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist/yeeflow-app-builder-plugin");
const historicalZip = resolve(root, "dist/yeeflow-app-builder-plugin-0.9.71.zip");
const historicalChecksum = sha256(readFileSync(historicalZip));
const corpus = readJson("compatibility/differential-fixtures/fixed-filter-parser-host-lowering.v0.1.0.json");
const runtimeApi = readJson("compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-local-runtime-fixed-filter-distribution-"));
const runtimeArtifactName = "yeeflow-app-builder-core-local-runtime.v0.1.0.mjs";
const materializerArtifactName = "yeeflow-app-builder-core-materializer.v0.1.0.mjs";

try {
  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
  execFileSync(process.execPath, [resolve(root, "scripts/validate-local-runtime-fixed-filter-lowering-public-api.mjs")], { cwd: root, stdio: "inherit" });
  const sourceCore = await load(resolve(root, "packages/app-builder-core-materializer/lib/index.js"));
  const sourceRuntime = await load(resolve(root, "runtimes/app-builder-core-local-runtime/lib/index.js"));
  const expected = await collect(sourceCore, sourceRuntime, "source");
  console.log(`LOCAL_RUNTIME_FIXED_FILTER_LOWERING_ARTIFACT_SOURCE_PARITY_PASSED cases=${corpus.cases.length}`);

  await verifyArtifactSurface("dist", resolve(dist, "core"), expected);

  const proofZip = resolve(temporary, "proof.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", proofZip], { cwd: root, stdio: "inherit" });
  const archiveRoot = resolve(temporary, "archive");
  mkdirSync(archiveRoot, { recursive: true });
  execFileSync("unzip", ["-q", proofZip, "-d", archiveRoot]);
  await verifyArtifactSurface("archive", resolve(archiveRoot, "yeeflow-app-builder-plugin/core"), expected);
  console.log(`LOCAL_RUNTIME_FIXED_FILTER_LOWERING_ARTIFACT_ARCHIVE_PARITY_PASSED cases=${corpus.cases.length}`);

  const installed = resolve(temporary, "installed/yeeflow-app-builder-plugin");
  cpSync(dist, installed, { recursive: true });
  await verifyArtifactSurface("installed", resolve(installed, "core"), expected);
  console.log(`LOCAL_RUNTIME_FIXED_FILTER_LOWERING_ARTIFACT_INSTALLED_PARITY_PASSED cases=${corpus.cases.length}`);

  assert.equal(sha256(readFileSync(historicalZip)), historicalChecksum, "Historical ZIP checksum must remain unchanged.");
  console.log("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_DISTRIBUTION_VALID");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

async function verifyArtifactSurface(label, coreDirectory, expected) {
  execFileSync(process.execPath, [resolve(root, "scripts/validate-core-distribution.mjs"), coreDirectory], { cwd: root, stdio: "inherit" });
  const manifest = JSON.parse(readFileSync(resolve(coreDirectory, "yeeflow-app-builder-core-distribution.v0.1.0.json"), "utf8"));
  const runtimeArtifact = manifest.artifacts.find((artifact) => artifact.packageName === "@yeeflow/app-builder-core-local-runtime");
  assert.ok(runtimeArtifact, `${label} must declare the Local Runtime artifact.`);
  assert.deepEqual(runtimeArtifact.exports, runtimeApi.runtimeExports, `${label} Local Runtime manifest exports must match the public API.`);
  const core = await load(resolve(coreDirectory, materializerArtifactName));
  const runtime = await load(resolve(coreDirectory, runtimeArtifactName));
  assert.deepEqual(Object.keys(runtime).sort(), [...runtimeApi.runtimeExports].sort(), `${label} runtime exports must match the public API.`);
  const actual = await collect(core, runtime, label);
  assert.deepEqual(actual, expected, `${label} Local Runtime output, errors, serialization, and mutation behavior must match compiled source.`);
}

async function collect(core, runtime, label) {
  assert.equal(typeof core.projectFixedFilterIntents, "function", `${label} must expose projectFixedFilterIntents.`);
  assert.equal(typeof runtime.lowerFixedFilterProjectionAtHost, "function", `${label} must expose lowerFixedFilterProjectionAtHost.`);
  const result = [];
  for (const fixture of corpus.cases) {
    const parserInput = structuredClone(fixture.input);
    const parserBefore = JSON.stringify(parserInput);
    const projection = core.projectFixedFilterIntents(parserInput);
    assert.equal(JSON.stringify(parserInput), parserBefore, `${label} parser input changed for ${fixture.id}.`);
    assert.ok(Object.isFrozen(projection) && Object.isFrozen(projection.intents) && Object.isFrozen(projection.keyRequests) && Object.isFrozen(projection.findings), `${label} projection must remain immutable for ${fixture.id}.`);
    const prepared = fixture.syntheticFindings ? Object.freeze({ ...projection, findings: Object.freeze(fixture.syntheticFindings.map((finding) => Object.freeze({ ...finding, context: Object.freeze({ ...finding.context }) }))) }) : projection;
    const allocation = { keysByRequestId: structuredClone(fixture.keys || {}) };
    const allocationBefore = JSON.stringify(allocation);
    const callerFindings = [];
    const lowered = invoke(() => runtime.lowerFixedFilterProjectionAtHost(prepared, allocation, callerFindings));
    assert.equal(JSON.stringify(allocation), allocationBefore, `${label} allocation changed for ${fixture.id}.`);
    if (fixture.hostError) {
      assert.ok(lowered.thrown?.message?.startsWith(fixture.hostError), `${label} must preserve ${fixture.hostError} for ${fixture.id}.`);
      assert.deepEqual(callerFindings, [], `${label} must not append findings when allocation fails for ${fixture.id}.`);
      result.push({ id: fixture.id, thrown: lowered.thrown, callerFindings });
      continue;
    }
    assert.equal(lowered.thrown, null, `${label} lowering must succeed for ${fixture.id}.`);
    assert.ok(Object.isFrozen(lowered.value) && Object.isFrozen(lowered.value.filter) && Object.isFrozen(lowered.value.findings), `${label} lowered result must remain immutable for ${fixture.id}.`);
    assert.deepEqual(callerFindings, lowered.value.findings, `${label} explicit findings append must preserve ordering for ${fixture.id}.`);
    result.push({ id: fixture.id, value: lowered.value, serialized: JSON.stringify(lowered.value), callerFindings });
  }
  return result;
}

async function load(path) { return import(pathToFileURL(path).href); }
function invoke(callback) { try { return { value: callback(), thrown: null }; } catch (error) { return { value: undefined, thrown: { name: error?.name || "Error", message: error?.message || String(error) } }; } }
function readJson(relativePath) { return JSON.parse(readFileSync(resolve(root, relativePath), "utf8")); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

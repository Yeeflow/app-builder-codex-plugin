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
const coreArtifactName = "yeeflow-app-builder-core-materializer.v0.1.0.mjs";
const historicalZip = resolve(root, "dist/yeeflow-app-builder-plugin-0.9.71.zip");
const historicalChecksum = sha256(readFileSync(historicalZip));
const publicApi = readJson("compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const distributionContract = readJson("compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json");
const corpus = readJson("compatibility/differential-fixtures/fixed-filter-parser-host-lowering.v0.1.0.json");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-fixed-filter-parser-distribution-"));

try {
  const approvedExports = [...publicApi.runtimeExports].sort();
  const approvedArtifact = distributionContract.approvedArtifacts.find((artifact) => artifact.packageName === "@yeeflow/app-builder-core-materializer");
  assert.ok(approvedArtifact, "Materializer distribution artifact must be approved.");
  assert.deepEqual([...approvedArtifact.exports].sort(), approvedExports, "The Materializer public API and distribution contract must declare the same runtime exports.");
  assert.ok(approvedExports.includes("projectFixedFilterIntents"), "projectFixedFilterIntents must be an approved public runtime export.");
  console.log("FIXED_FILTER_PARSER_DISTRIBUTION_CONTRACT_ALIGNED");

  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
  const sourceCore = await import(pathToFileURL(resolve(root, "packages/app-builder-core-materializer/lib/index.js")).href);
  const hostLowering = await import(pathToFileURL(resolve(root, "runtimes/app-builder-core-local-runtime/lib/index.js")).href);

  await verifySurface("source", resolve(dist, "core"), sourceCore, hostLowering, approvedExports);
  console.log(`FIXED_FILTER_PARSER_ARTIFACT_SOURCE_PARITY_PASSED cases=${corpus.cases.length}`);

  const proofZip = resolve(temporary, "proof.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", proofZip], { cwd: root, stdio: "inherit" });
  const archiveRoot = resolve(temporary, "archive");
  mkdirSync(archiveRoot, { recursive: true });
  execFileSync("unzip", ["-q", proofZip, "-d", archiveRoot]);
  await verifySurface("archive", resolve(archiveRoot, "yeeflow-app-builder-plugin/core"), sourceCore, hostLowering, approvedExports);
  console.log(`FIXED_FILTER_PARSER_ARTIFACT_ARCHIVE_PARITY_PASSED cases=${corpus.cases.length}`);

  const installed = resolve(temporary, "installed/yeeflow-app-builder-plugin");
  cpSync(dist, installed, { recursive: true });
  await verifySurface("installed", resolve(installed, "core"), sourceCore, hostLowering, approvedExports);
  console.log(`FIXED_FILTER_PARSER_ARTIFACT_INSTALLED_PARITY_PASSED cases=${corpus.cases.length}`);

  assert.equal(sha256(readFileSync(historicalZip)), historicalChecksum, "Historical ZIP checksum must remain unchanged.");
  console.log("FIXED_FILTER_PARSER_DISTRIBUTION_GATES_PASSED");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

async function verifySurface(label, coreDirectory, sourceCore, hostLowering, approvedExports) {
  execFileSync(process.execPath, [resolve(root, "scripts/validate-core-distribution.mjs"), coreDirectory], { cwd: root, stdio: "inherit" });
  const manifest = JSON.parse(readFileSync(resolve(coreDirectory, "yeeflow-app-builder-core-distribution.v0.1.0.json"), "utf8"));
  const artifact = manifest.artifacts.find((item) => item.packageName === "@yeeflow/app-builder-core-materializer");
  assert.ok(artifact, `${label} must contain the Materializer artifact.`);
  assert.deepEqual([...artifact.exports].sort(), approvedExports, `${label} manifest exports must match the public contract.`);
  const distributedCore = await import(pathToFileURL(resolve(coreDirectory, coreArtifactName)).href);
  assert.deepEqual(Object.keys(distributedCore).sort(), approvedExports, `${label} runtime exports must match the public contract.`);
  for (const fixture of corpus.cases) {
    const sourceInput = structuredClone(fixture.input);
    const distributedInput = structuredClone(fixture.input);
    const sourceResult = invoke(sourceCore.projectFixedFilterIntents, sourceInput);
    const distributedResult = invoke(distributedCore.projectFixedFilterIntents, distributedInput);
    assert.deepEqual(distributedResult, sourceResult, `${label} parser parity must match source for ${fixture.id}.`);
    assert.deepEqual(distributedInput, fixture.input, `${label} parser must not mutate input for ${fixture.id}.`);
    if (!distributedResult.thrown) assertFrozenProjection(distributedResult.value, `${label} ${fixture.id}`);
    if (label === "source") verifyHostLowering(fixture, distributedResult, hostLowering);
  }
}

function verifyHostLowering(fixture, result, hostLowering) {
  assert.equal(result.thrown, null, `The fixed-filter parser must not throw for ${fixture.id}.`);
  const callerFindings = [];
  const lowered = invoke((projection) => hostLowering.lowerFixedFilterProjectionAtHost(projection, { keysByRequestId: fixture.keys || {} }, callerFindings), result.value);
  if (fixture.hostError) {
    assert.ok(lowered.thrown?.message?.startsWith(fixture.hostError), `Host lowering must retain ${fixture.hostError} for ${fixture.id}.`);
    return;
  }
  assert.equal(lowered.thrown, null, `Host lowering must succeed for ${fixture.id}.`);
  assert.deepEqual(callerFindings, lowered.value.findings, `Host findings append must preserve output for ${fixture.id}.`);
}

function assertFrozenProjection(value, label) {
  assert.ok(Object.isFrozen(value) && Object.isFrozen(value.intents) && Object.isFrozen(value.keyRequests) && Object.isFrozen(value.findings), `${label} result must be immutable.`);
  for (const item of [...value.intents, ...value.keyRequests, ...value.findings]) assert.ok(Object.isFrozen(item), `${label} child value must be immutable.`);
}

function invoke(functionUnderTest, input) {
  try { return { value: functionUnderTest(input), thrown: null }; }
  catch (error) { return { value: undefined, thrown: { name: error?.name || "Error", message: error?.message || String(error) } }; }
}

function readJson(relativePath) { return JSON.parse(readFileSync(resolve(root, relativePath), "utf8")); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

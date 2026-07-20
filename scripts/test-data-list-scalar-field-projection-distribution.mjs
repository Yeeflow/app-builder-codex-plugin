#!/usr/bin/env node

import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist/yeeflow-app-builder-plugin");
const historicalZip = resolve(root, "dist/yeeflow-app-builder-plugin-0.9.71.zip");
const historicalChecksum = createHash("sha256").update(readFileSync(historicalZip)).digest("hex");
const corpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/data-list-scalar-field-projection.v0.1.0.json"), "utf8"));
const publicApi = JSON.parse(readFileSync(resolve(root, "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json"), "utf8"));
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-data-list-scalar-distribution-"));

try {
  execFileSync(process.execPath, [resolve(root, "scripts/test-data-list-scalar-field-projection-differential.mjs")], { cwd: root, stdio: "inherit" });
  execFileSync(process.execPath, [resolve(root, "scripts/validate-data-list-scalar-field-projection-public-api.mjs")], { cwd: root, stdio: "inherit" });
  const sourceModule = await import(pathToFileURL(resolve(root, "packages/app-builder-core-materializer/lib/index.js")).href);
  const sourceOutputs = await verifySurface(sourceModule, "compiled-source");
  console.log("DATA_LIST_SCALAR_FIELD_PROJECTION_ARTIFACT_SOURCE_PARITY_PASSED");

  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
  const distCore = resolve(dist, "core");
  const distOutputs = await verifyArtifactSurface(distCore, "dist");
  assertEqual(distOutputs, sourceOutputs, "DATA_LIST_SCALAR_FIELD_PROJECTION_SURFACE_PARITY_MISMATCH");
  console.log("DATA_LIST_SCALAR_FIELD_PROJECTION_ARTIFACT_DIST_PARITY_PASSED");

  const proofZip = resolve(temporary, "proof.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", proofZip], { cwd: root, stdio: "inherit" });
  const archiveRoot = resolve(temporary, "archive");
  mkdirSync(archiveRoot, { recursive: true });
  execFileSync("unzip", ["-q", proofZip, "-d", archiveRoot]);
  const archiveOutputs = await verifyArtifactSurface(resolve(archiveRoot, "yeeflow-app-builder-plugin/core"), "archive");
  assertEqual(archiveOutputs, sourceOutputs, "DATA_LIST_SCALAR_FIELD_PROJECTION_SURFACE_PARITY_MISMATCH");
  console.log("DATA_LIST_SCALAR_FIELD_PROJECTION_ARTIFACT_ARCHIVE_PARITY_PASSED");

  const installed = resolve(temporary, "installed/yeeflow-app-builder-plugin");
  cpSync(dist, installed, { recursive: true });
  const installedOutputs = await verifyArtifactSurface(resolve(installed, "core"), "installed");
  assertEqual(installedOutputs, sourceOutputs, "DATA_LIST_SCALAR_FIELD_PROJECTION_SURFACE_PARITY_MISMATCH");
  console.log("DATA_LIST_SCALAR_FIELD_PROJECTION_ARTIFACT_INSTALLED_PARITY_PASSED");

  if (createHash("sha256").update(readFileSync(historicalZip)).digest("hex") !== historicalChecksum) throw new Error("DATA_LIST_SCALAR_FIELD_PROJECTION_HISTORICAL_ZIP_CHANGED");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

async function verifyArtifactSurface(coreDirectory, surface) {
  execFileSync(process.execPath, [resolve(root, "scripts/validate-core-distribution.mjs"), coreDirectory], { cwd: root, stdio: "inherit" });
  const manifest = JSON.parse(readFileSync(resolve(coreDirectory, "yeeflow-app-builder-core-distribution.v0.1.0.json"), "utf8"));
  const artifact = manifest.artifacts.find((item) => item.packageName === "@yeeflow/app-builder-core-materializer");
  if (!artifact) throw new Error(`DATA_LIST_SCALAR_FIELD_PROJECTION_ARTIFACT_MISSING surface=${surface}`);
  const artifactPath = resolve(coreDirectory, artifact.path.split("/").at(-1));
  execFileSync(process.execPath, [resolve(root, "scripts/validate-data-list-scalar-field-projection-public-api.mjs"), "--compiled", artifactPath], { cwd: root, stdio: "inherit" });
  const module = await import(pathToFileURL(artifactPath).href);
  return verifySurface(module, surface);
}

function verifySurface(module, surface) {
  if (typeof module.projectDataListScalarField !== "function") throw new Error(`DATA_LIST_SCALAR_FIELD_PROJECTION_EXPORT_MISSING surface=${surface}`);
  const actualExports = Object.keys(module).sort();
  const expectedExports = [...publicApi.runtimeExports].sort();
  assertEqual(actualExports, expectedExports, "DATA_LIST_SCALAR_FIELD_PROJECTION_PUBLIC_SURFACE_MISMATCH");
  return corpus.cases.map((fixture) => {
    const input = structuredClone(fixture.input);
    const before = JSON.stringify(input);
    const outcome = invoke(module.projectDataListScalarField, input);
    if (JSON.stringify(input) !== before) throw new Error(`DATA_LIST_SCALAR_FIELD_PROJECTION_MUTATION surface=${surface} fixture=${fixture.id}`);
    if (fixture.outcome === "throws") {
      if (!outcome.thrown?.message?.startsWith(fixture.errorCode)) throw new Error(`DATA_LIST_SCALAR_FIELD_PROJECTION_OUTPUT_MISMATCH surface=${surface} fixture=${fixture.id}`);
    } else if (fixture.outcome === "deferred") {
      if (outcome.thrown || outcome.value?.projection !== null || JSON.stringify(outcome.value?.findings?.map((finding) => finding.code)) !== JSON.stringify([fixture.findingCode])) throw new Error(`DATA_LIST_SCALAR_FIELD_PROJECTION_OUTPUT_MISMATCH surface=${surface} fixture=${fixture.id}`);
    } else if (outcome.thrown || !outcome.value?.projection || outcome.value.findings.length !== 0) {
      throw new Error(`DATA_LIST_SCALAR_FIELD_PROJECTION_OUTPUT_MISMATCH surface=${surface} fixture=${fixture.id}`);
    }
    if (outcome.value && (!Object.isFrozen(outcome.value) || !Object.isFrozen(outcome.value.findings) || (outcome.value.projection && !Object.isFrozen(outcome.value.projection)))) throw new Error(`DATA_LIST_SCALAR_FIELD_PROJECTION_RUNTIME_IMMUTABILITY_MISMATCH surface=${surface} fixture=${fixture.id}`);
    if (outcome.value) JSON.parse(JSON.stringify(outcome.value));
    return outcome;
  });
}

function invoke(functionUnderTest, input) {
  try { return { value: functionUnderTest(input), thrown: null }; }
  catch (error) { return { value: undefined, thrown: { name: error?.name || "Error", message: error?.message || String(error) } }; }
}

function assertEqual(actual, expected, code) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(code);
}

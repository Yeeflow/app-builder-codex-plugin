#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const plugin = resolve(root, "dist/yeeflow-app-builder-plugin");
const historicalZip = resolve(root, "dist/yeeflow-app-builder-plugin-0.9.71.zip");
const historicalChecksum = "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2";
const corpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/data-list-scalar-resource-identity.v0.1.0.json"), "utf8"));
const materializerContract = JSON.parse(readFileSync(resolve(root, "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json"), "utf8"));
const runtimeContract = JSON.parse(readFileSync(resolve(root, "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json"), "utf8"));
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-scalar-identity-distribution-"));

try {
  const source = await loadSurface("SOURCE", resolve(root, "packages/app-builder-core-materializer/lib/index.js"), resolve(root, "runtimes/app-builder-core-local-runtime/lib/index.js"));
  const expected = collect(source.core, source.runtime);
  console.log(`DATA_LIST_SCALAR_RESOURCE_IDENTITY_ARTIFACT_SOURCE_PARITY_PASSED cases=${corpus.cases.length}`);

  const dist = await loadSurface("DIST", resolve(plugin, "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"), resolve(plugin, "core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"));
  assert.deepEqual(collect(dist.core, dist.runtime), expected);
  console.log(`DATA_LIST_SCALAR_RESOURCE_IDENTITY_ARTIFACT_DIST_PARITY_PASSED cases=${corpus.cases.length}`);

  const archiveRoot = resolve(temporary, "archive");
  const proofZip = resolve(temporary, "proof.zip");
  mkdirSync(archiveRoot, { recursive: true });
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", proofZip], { cwd: root });
  execFileSync("unzip", ["-q", proofZip, "-d", archiveRoot]);
  const archive = await loadSurface("ARCHIVE", resolve(archiveRoot, "yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"), resolve(archiveRoot, "yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"));
  assert.deepEqual(collect(archive.core, archive.runtime), expected);
  console.log(`DATA_LIST_SCALAR_RESOURCE_IDENTITY_ARTIFACT_ARCHIVE_PARITY_PASSED cases=${corpus.cases.length}`);

  const installed = resolve(temporary, "installed/yeeflow-app-builder-plugin");
  cpSync(plugin, installed, { recursive: true });
  const installedSurface = await loadSurface("INSTALLED", resolve(installed, "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"), resolve(installed, "core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"));
  assert.deepEqual(collect(installedSurface.core, installedSurface.runtime), expected);
  console.log(`DATA_LIST_SCALAR_RESOURCE_IDENTITY_ARTIFACT_INSTALLED_PARITY_PASSED cases=${corpus.cases.length}`);

  assert.equal(readFileSync(historicalZip).length > 0, true);
  execFileSync("shasum", ["-a", "256", historicalZip], { cwd: root, stdio: "pipe" });
  const checksum = execFileSync("shasum", ["-a", "256", historicalZip], { cwd: root, encoding: "utf8" }).split(/\s+/)[0];
  assert.equal(checksum, historicalChecksum);
  console.log("DATA_LIST_SCALAR_RESOURCE_IDENTITY_CORE_PUBLIC_API_CONTRACT_PASSED");
  console.log("DATA_LIST_SCALAR_RESOURCE_IDENTITY_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_PASSED");
  console.log("DATA_LIST_SCALAR_RESOURCE_IDENTITY_DUAL_DISTRIBUTION_VALID");
  console.log("DATA_LIST_SCALAR_RESOURCE_IDENTITY_DISTRIBUTION_GATES_PASSED");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

async function loadSurface(label, materializerPath, runtimePath) {
  const core = await import(pathToFileURL(materializerPath).href);
  const runtime = await import(pathToFileURL(runtimePath).href);
  assert.deepEqual(Object.keys(core).sort(), [...materializerContract.runtimeExports].sort(), `${label} Materializer Core export list mismatch.`);
  assert.deepEqual(Object.keys(runtime).sort(), [...runtimeContract.runtimeExports].sort(), `${label} Local Runtime export list mismatch.`);
  assert.equal(typeof core.projectDataListScalarResourceDefinitionIntent, "function");
  assert.equal(typeof runtime.lowerDataListScalarResourceIdentityAtHost, "function");
  return { core, runtime };
}

function collect(core, runtime) {
  const results = [];
  for (const item of corpus.cases) {
    const input = structuredClone(item.field);
    const before = JSON.stringify(input);
    const projected = capture(() => core.projectDataListScalarField(input));
    assert.equal(JSON.stringify(input), before, `${item.id} projection input changed.`);
    if (item.error) {
      assert.match(projected.error?.message || "", new RegExp(item.error));
      results.push({ id: item.id, error: projected.error.message });
      continue;
    }
    assert.equal(projected.error, null);
    if (item.deferred) {
      assert.equal(projected.value.projection, null);
      results.push({ id: item.id, deferred: true });
      continue;
    }
    const intent = core.projectDataListScalarResourceDefinitionIntent(Object.freeze({ resourceScope: "data-list:orders", fieldOrdinal: item.field.fieldIndex, projection: projected.value.projection }));
    const allocation = Object.freeze({ listId: item.listId, fieldIdsByRequestId: Object.freeze({ [intent.fieldRequest.requestId]: item.fieldId }), fieldScopesByRequestId: Object.freeze({ [intent.fieldRequest.requestId]: "data-list:orders" }) });
    const allocationBefore = JSON.stringify(allocation);
    const lowered = runtime.lowerDataListScalarResourceIdentityAtHost(intent, allocation);
    assert.equal(JSON.stringify(allocation), allocationBefore, `${item.id} allocation changed.`);
    assert.ok(Object.isFrozen(intent) && Object.isFrozen(intent.preIdFieldRecord) && Object.isFrozen(intent.findings));
    assert.ok(Object.isFrozen(lowered));
    assert.equal(lowered.ListID, item.listId);
    assert.equal(lowered.FieldID, item.fieldId);
    results.push({ id: item.id, intent: JSON.parse(JSON.stringify(intent)), lowered: JSON.parse(JSON.stringify(lowered)) });
  }
  return results;
}

function capture(callback) {
  try { return { value: callback(), error: null }; }
  catch (error) { return { value: null, error }; }
}

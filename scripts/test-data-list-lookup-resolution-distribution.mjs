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
const corpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/data-list-lookup-resolution-shadow.v0.1.0.json"), "utf8"));
const materializerContract = JSON.parse(readFileSync(resolve(root, "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json"), "utf8"));
const runtimeContract = JSON.parse(readFileSync(resolve(root, "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json"), "utf8"));
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-lookup-resolution-distribution-"));

try {
  const source = await loadSurface("SOURCE", resolve(root, "packages/app-builder-core-materializer/lib/index.js"), resolve(root, "runtimes/app-builder-core-local-runtime/lib/index.js"));
  const expected = collect(source);
  console.log(`DATA_LIST_LOOKUP_RESOLUTION_ARTIFACT_SOURCE_PARITY_PASSED cases=${corpus.cases.length}`);

  const dist = await loadSurface("DIST", resolve(plugin, "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"), resolve(plugin, "core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"));
  assert.deepEqual(collect(dist), expected, "Plugin dist Lookup behavior differs from compiled source.");

  const archiveRoot = resolve(temporary, "archive");
  const proofZip = resolve(temporary, "proof.zip");
  mkdirSync(archiveRoot, { recursive: true });
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", proofZip], { cwd: root, stdio: "pipe" });
  execFileSync("unzip", ["-q", proofZip, "-d", archiveRoot]);
  const archive = await loadSurface("ARCHIVE", resolve(archiveRoot, "yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"), resolve(archiveRoot, "yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"));
  assert.deepEqual(collect(archive), expected, "Archive Lookup behavior differs from compiled source.");
  console.log(`DATA_LIST_LOOKUP_RESOLUTION_ARTIFACT_ARCHIVE_PARITY_PASSED cases=${corpus.cases.length}`);

  const installed = resolve(temporary, "installed/yeeflow-app-builder-plugin");
  cpSync(plugin, installed, { recursive: true });
  const installedSurface = await loadSurface("INSTALLED", resolve(installed, "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"), resolve(installed, "core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"));
  assert.deepEqual(collect(installedSurface), expected, "Installed Lookup behavior differs from compiled source.");
  console.log(`DATA_LIST_LOOKUP_RESOLUTION_ARTIFACT_INSTALLED_PARITY_PASSED cases=${corpus.cases.length}`);

  const checksum = execFileSync("shasum", ["-a", "256", historicalZip], { cwd: root, encoding: "utf8" }).split(/\s+/)[0];
  assert.equal(checksum, historicalChecksum, "Historical Plugin ZIP checksum changed.");
  console.log(`DATA_LIST_LOOKUP_RESOLUTION_DUAL_DISTRIBUTION_VALID cases=${corpus.cases.length}`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

async function loadSurface(label, materializerPath, runtimePath) {
  const core = await import(`${pathToFileURL(materializerPath).href}?surface=${label}`);
  const runtime = await import(`${pathToFileURL(runtimePath).href}?surface=${label}`);
  assert.deepEqual(Object.keys(core).sort(), [...materializerContract.runtimeExports].sort(), `${label} Materializer export list mismatch.`);
  assert.deepEqual(Object.keys(runtime).sort(), [...runtimeContract.runtimeExports].sort(), `${label} Local Runtime export list mismatch.`);
  assert.equal(typeof core.projectDataListLookupResolutionIntent, "function", `${label} Core Lookup export missing.`);
  assert.equal(typeof runtime.lowerDataListLookupResolutionAtHost, "function", `${label} Local Runtime Lookup export missing.`);
  return { core, runtime };
}

function collect(surface) {
  return corpus.cases.map((item) => {
    if (item.kind === "excluded") {
      assert.ok(item.surface !== "data-list" || item.field.controlType !== "lookup", `${item.id} excluded fixture is routeable.`);
      return { id: item.id, excluded: true };
    }
    const input = Object.freeze({ surface: "data-list", sourceResourceKey: "Orders", sourceFieldKey: item.field.fieldName, sourceFieldOrdinal: 0, lookupTarget: item.field.lookupTarget, displayName: item.field.displayName, controlType: "lookup" });
    const inputBefore = JSON.stringify(input);
    const projected = surface.core.projectDataListLookupResolutionIntent(input);
    assert.equal(JSON.stringify(input), inputBefore, `${item.id} Core input changed.`);
    assert.ok(Object.isFrozen(projected) && Object.isFrozen(projected.findings), `${item.id} Core output is not frozen.`);
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(projected)), item.id);
    if (item.kind === "core-finding") {
      assert.equal(projected.intent, null, item.id);
      assert.equal(projected.findings[0]?.code, item.code, item.id);
      return { id: item.id, projected: JSON.parse(JSON.stringify(projected)) };
    }
    assert.ok(projected.intent, item.id);
    const targetMap = Object.freeze({ targetListIdsByLogicalKey: Object.freeze(item.targetMap || {}), targetScopesByLogicalKey: Object.freeze(item.targetScopes || {}) });
    const source = Object.freeze({ sourceListId: item.sourceListId || "1000000000000000001", sourceFieldId: item.sourceFieldId || "1000000000000000002", sourceFieldListId: item.sourceFieldListId || item.sourceListId || "1000000000000000001" });
    const targetBefore = JSON.stringify(targetMap);
    if (item.kind === "host-error") {
      const error = capture(() => surface.runtime.lowerDataListLookupResolutionAtHost(projected.intent, targetMap, source)).error;
      assert.ok(error, item.id);
      assert.match(error.message, new RegExp(item.code), item.id);
      assert.equal(JSON.stringify(targetMap), targetBefore, `${item.id} target map changed.`);
      return { id: item.id, projected: JSON.parse(JSON.stringify(projected)), error: error.message };
    }
    const lowered = surface.runtime.lowerDataListLookupResolutionAtHost(projected.intent, targetMap, source);
    assert.ok(Object.isFrozen(lowered), `${item.id} host result is not frozen.`);
    assert.equal(typeof JSON.parse(lowered.rules).listid, "string", `${item.id} target identity is not a string.`);
    assert.equal(JSON.stringify(targetMap), targetBefore, `${item.id} target map changed.`);
    return { id: item.id, projected: JSON.parse(JSON.stringify(projected)), lowered: JSON.parse(JSON.stringify(lowered)) };
  });
}
function capture(callback) { try { return { value: callback(), error: null }; } catch (error) { return { value: null, error }; } }

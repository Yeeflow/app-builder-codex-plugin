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
const corpus = json("compatibility/differential-fixtures/data-list-sublist-scalar-summary-intent-shadow.v0.1.0.json");
const coreContract = json("compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const runtimeContract = json("compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-summary-intent-distribution-"));
try {
  const source = await load("source", resolve(root, "packages/app-builder-core-materializer/lib/index.js"), resolve(root, "runtimes/app-builder-core-local-runtime/lib/index.js"));
  const expected = collect(source);
  console.log(`SUBLIST_SCALAR_SUMMARY_INTENT_ARTIFACT_SOURCE_PARITY_PASSED cases=${corpus.caseCount}`);
  const dist = await load("dist", resolve(plugin, "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"), resolve(plugin, "core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"));
  assert.deepEqual(collect(dist), expected);
  const archive = resolve(temporary, "archive"); const zip = resolve(temporary, "proof.zip"); mkdirSync(archive, { recursive: true });
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", zip], { cwd: root, stdio: "pipe" });
  execFileSync("unzip", ["-q", zip, "-d", archive]);
  const zipped = await load("archive", resolve(archive, "yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"), resolve(archive, "yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"));
  assert.deepEqual(collect(zipped), expected);
  console.log(`SUBLIST_SCALAR_SUMMARY_INTENT_ARTIFACT_ARCHIVE_PARITY_PASSED cases=${corpus.caseCount}`);
  const installed = resolve(temporary, "installed/yeeflow-app-builder-plugin"); cpSync(plugin, installed, { recursive: true });
  const installedSurface = await load("installed", resolve(installed, "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"), resolve(installed, "core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"));
  assert.deepEqual(collect(installedSurface), expected);
  console.log(`SUBLIST_SCALAR_SUMMARY_INTENT_ARTIFACT_INSTALLED_PARITY_PASSED cases=${corpus.caseCount}`);
  assert.equal(execFileSync("shasum", ["-a", "256", historicalZip], { encoding: "utf8" }).split(/\s+/)[0], historicalChecksum);
  console.log(`SUBLIST_SCALAR_SUMMARY_INTENT_DUAL_DISTRIBUTION_VALID cases=${corpus.caseCount}`);
} finally { rmSync(temporary, { recursive: true, force: true }); }

async function load(surface, corePath, runtimePath) {
  const core = await import(`${pathToFileURL(corePath).href}?surface=${surface}`);
  const runtime = await import(`${pathToFileURL(runtimePath).href}?surface=${surface}`);
  assert.deepEqual(Object.keys(core).sort(), [...coreContract.runtimeExports].sort());
  assert.deepEqual(Object.keys(runtime).sort(), [...runtimeContract.runtimeExports].sort());
  if (surface !== "source") for (const text of [readFileSync(corePath, "utf8"), readFileSync(runtimePath, "utf8")]) assert.doesNotMatch(text, /node_modules|\.ts\b|sourceMappingURL|\/Users\/|bare-package/u);
  return { core, runtime };
}
function collect(surface) {
  return corpus.cases.map((entry) => {
    const input = inputFor(entry);
    const before = JSON.stringify(input);
    const result = surface.core.projectDataListSublistScalarSummaryIntent(Object.freeze(input));
    assert.equal(JSON.stringify(input), before, entry.id);
    assert.ok(Object.isFrozen(result) && Object.isFrozen(result.findings));
    assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
    if (entry.kind === "valid") {
      assert.equal(result.findings.length, 0, entry.id);
      assert.ok(Object.isFrozen(result.intent), entry.id);
      const lowered = surface.runtime.lowerDataListSublistScalarSummaryIntentAtHost(result.intent);
      assert.ok(Object.isFrozen(lowered), entry.id);
      assert.deepEqual(Object.keys(lowered), ["field", "type", "display", "binding"]);
      assert.equal(lowered.binding, null, entry.id);
      return { id: entry.id, result: JSON.parse(JSON.stringify(result)), lowered: JSON.parse(JSON.stringify(lowered)) };
    }
    assert.equal(result.intent, null, entry.id);
    assert.ok(result.findings.some((finding) => finding.code === entry.expected), entry.id);
    return { id: entry.id, findings: JSON.parse(JSON.stringify(result.findings)) };
  });
}
function inputFor(entry) {
  const base = { surface: "data-list-sublist-summary", summaryKey: "total_amount", summaryReference: "summary:total_amount", scope: "data-list-sublist", sourceColumn: { id: "amount", name: "Amount", scalarType: "decimal" }, aggregateOperation: "total", display: true, format: "currency" };
  return { ...base, ...(entry.input || {}), sourceColumn: { ...base.sourceColumn, ...(entry.input?.sourceColumn || {}) } };
}
function json(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }

#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pluginDist = resolve(root, "dist/yeeflow-app-builder-plugin");
const historicalZip = resolve(root, "dist/yeeflow-app-builder-plugin-0.9.71.zip");
const expectedHistoricalZipSha256 = "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2";
const fixture = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/materializer-escape-regexp-materializer-integration.v0.1.0.json"), "utf8"));
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-materializer-escape-regexp-routing-"));

assert.equal(sha256(readFileSync(historicalZip)), expectedHistoricalZipSha256, "Historical ZIP checksum must match before routing proof.");

try {
  const materializerSource = readFileSync(resolve(root, "scripts/materialize-full-app-generated-final.mjs"), "utf8");
  assert.equal(count(materializerSource, "coreEscapeRegExp("), fixture.expectedCallSites.postCutoverCoreCallCount, "Post-cutover Core call-site count must match the approved scope.");
  assert.equal(count(materializerSource, "escapeRegExp("), fixture.expectedCallSites.postCutoverLegacyCallCount + 1, "Only the retained Legacy helper declaration may retain the Legacy function name.");
  assert.match(materializerSource, /function escapeRegExp\(value\)/u, "Legacy helper must remain intact for rollback.");

  const legacyRoot = createLegacyRollbackSurface(resolve(temporary, "legacy-baseline"), root);
  const legacyBaseline = await materialize(legacyRoot, "legacy-baseline", 1);

  const sourceFirst = await materialize(root, "source", 1);
  const sourceSecond = await materialize(root, "source", 2);
  assertParity(legacyBaseline, sourceFirst, "source");
  assert.deepEqual(sourceFirst.normalizedDecoded, sourceSecond.normalizedDecoded, "The scoped normalized source output must be deterministic across two runs.");
  console.log("MATERIALIZER_ESCAPE_REGEXP_SOURCE_ROUTING_PASSED");
  console.log("MATERIALIZER_ESCAPE_REGEXP_MATERIALIZER_DETERMINISM_PASSED");

  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
  const proofZip = resolve(temporary, "proof.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", proofZip], { cwd: root, stdio: "inherit" });
  const archiveRoot = resolve(temporary, "archive");
  mkdirSync(archiveRoot, { recursive: true });
  execFileSync("unzip", ["-q", proofZip, "-d", archiveRoot]);
  const archiveResult = await materialize(resolve(archiveRoot, "yeeflow-app-builder-plugin"), "archive", 1);
  assertParity(legacyBaseline, archiveResult, "archive");
  console.log("MATERIALIZER_ESCAPE_REGEXP_ARCHIVE_ROUTING_PASSED");

  const installedRoot = resolve(temporary, "installed/yeeflow-app-builder-plugin");
  cpSync(pluginDist, installedRoot, { recursive: true });
  const installedResult = await materialize(installedRoot, "installed", 1);
  assertParity(legacyBaseline, installedResult, "installed");
  console.log("MATERIALIZER_ESCAPE_REGEXP_INSTALLED_ROUTING_PASSED");

  console.log("MATERIALIZER_ESCAPE_REGEXP_MATERIALIZER_INTEGRATION_PARITY_PASSED");
  console.log("MATERIALIZER_ESCAPE_REGEXP_LEGACY_ROLLBACK_PASSED");
  assert.equal(sha256(readFileSync(historicalZip)), expectedHistoricalZipSha256, "Historical ZIP checksum must match after routing proof.");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

function createLegacyRollbackSurface(target, sourceRoot) {
  cpSync(resolve(sourceRoot, "scripts"), resolve(target, "scripts"), { recursive: true });
  cpSync(resolve(sourceRoot, "docs/reference"), resolve(target, "docs/reference"), { recursive: true });
  cpSync(resolve(pluginDist, "core"), resolve(target, "core"), { recursive: true });
  const materializer = resolve(target, "scripts/materialize-full-app-generated-final.mjs");
  const source = readFileSync(materializer, "utf8");
  const legacy = source
    .replace('  escapeRegExp as coreEscapeRegExp,\n', "")
    .replace("coreEscapeRegExp(", "escapeRegExp(");
  assert.notEqual(legacy, source, "Rollback surface must restore the scoped Legacy route.");
  writeFileSync(materializer, legacy, "utf8");
  return target;
}

async function materialize(surfaceRoot, surface, run) {
  const fixtureRoot = resolve(temporary, `${surface}-${run}`);
  mkdirSync(fixtureRoot, { recursive: true });
  const spec = resolve(fixtureRoot, "functional-specification.md");
  const plan = resolve(fixtureRoot, "yeeflow-app-plan.md");
  const output = resolve(fixtureRoot, "output");
  writeFileSync(spec, `${fixture.functionalSpecificationLines.join("\n")}\n`, "utf8");
  writeFileSync(plan, `${fixture.appPlanLines.join("\n")}\n`, "utf8");
  const moduleUrl = `${pathToFileURL(resolve(surfaceRoot, "scripts/materialize-full-app-generated-final.mjs")).href}?surface=${surface}-${run}`;
  const materializer = await import(moduleUrl);
  const result = materializer.materializeFullAppGeneratedFinal({
    cwd: fixtureRoot,
    functionalSpec: spec,
    appPlan: plan,
    outDir: output,
    allowFixtureApiIdsForTests: true,
  });
  assert.equal(result.status, "pass", `${surface} materialization must pass.`);
  const outputFiles = readdirSync(output).sort();
  assert.deepEqual(outputFiles, [...fixture.expectedOutputFiles].sort(), `${surface} materialization must not write unrelated output files.`);
  const decoded = JSON.parse(readFileSync(result.outputs.decodedResource, "utf8"));
  const colors = colorConfig(decoded);
  assert.deepEqual(colors, fixture.expectedColors, `${surface} materialization must route the named-section pattern through escapeRegExp.`);
  return { colors, normalizedDecoded: normalizeDecoded(decoded), outputFiles };
}

function colorConfig(decoded) {
  const style = decoded.Themes?.find((item) => item.Type === 0);
  assert.ok(style, "Materialized package must contain the application style record.");
  const config = JSON.parse(style.Config);
  return Object.fromEntries(["primary", "secondary", "neutral"].map((role) => [role, config[role]?.value]));
}

function normalizeDecoded(decoded) {
  return JSON.parse(JSON.stringify(decoded).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu, "<control-style-uuid>"));
}

function assertParity(legacy, actual, surface) {
  assert.deepEqual(actual.colors, legacy.colors, `${surface} materialized colors must match the Legacy baseline.`);
  assert.deepEqual(actual.normalizedDecoded, legacy.normalizedDecoded, `${surface} normalized decoded materializer output must match the Legacy baseline without unrelated resource shape changes.`);
  assert.deepEqual(actual.outputFiles, legacy.outputFiles, `${surface} materialization output files must match the Legacy baseline.`);
}

function count(text, token) { return text.split(token).length - 1; }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

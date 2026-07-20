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
const fixture = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/materializer-safe-dependency-identifier-integration.v0.1.0.json"), "utf8"));
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-materializer-dependency-identifier-routing-"));

assert.equal(sha256(readFileSync(historicalZip)), expectedHistoricalZipSha256, "Historical ZIP checksum must match before routing proof.");

try {
  const materializerSource = readFileSync(resolve(root, "scripts/materialize-full-app-generated-final.mjs"), "utf8");
  assert.equal(count(materializerSource, "coreSafeDependencyIdentifier("), fixture.expectedCallSites.postCutoverCoreCallCount, "Post-cutover Core call-site count must match the approved scope.");
  assert.equal(count(materializerSource, "safeDependencyIdentifier("), fixture.expectedCallSites.postCutoverLegacyCallCount + 1, "Only the retained Legacy helper declaration may retain the Legacy function name.");
  assert.match(materializerSource, /function safeDependencyIdentifier\(value, options = \{\}\)/u, "Legacy helper must remain intact for rollback.");

  const legacyRoot = createLegacyRollbackSurface(resolve(temporary, "legacy-baseline"), root);
  const legacyBaseline = await materialize(legacyRoot, "legacy-baseline", 1);
  const sourceFirst = await materialize(root, "source", 1);
  const sourceSecond = await materialize(root, "source", 2);
  assertParity(legacyBaseline, sourceFirst, "source");
  assert.deepEqual(sourceFirst.normalizedDecoded, sourceSecond.normalizedDecoded, "The scoped normalized source output must be deterministic across two runs.");
  console.log("MATERIALIZER_DEPENDENCY_IDENTIFIER_SOURCE_ROUTING_PASSED");
  console.log("MATERIALIZER_DEPENDENCY_IDENTIFIER_MATERIALIZER_DETERMINISM_PASSED");

  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
  const proofZip = resolve(temporary, "proof.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", proofZip], { cwd: root, stdio: "inherit" });
  const archiveRoot = resolve(temporary, "archive");
  mkdirSync(archiveRoot, { recursive: true });
  execFileSync("unzip", ["-q", proofZip, "-d", archiveRoot]);
  const archiveResult = await materialize(resolve(archiveRoot, "yeeflow-app-builder-plugin"), "archive", 1);
  assertParity(legacyBaseline, archiveResult, "archive");
  console.log("MATERIALIZER_DEPENDENCY_IDENTIFIER_ARCHIVE_ROUTING_PASSED");

  const installedRoot = resolve(temporary, "installed/yeeflow-app-builder-plugin");
  cpSync(pluginDist, installedRoot, { recursive: true });
  const installedResult = await materialize(installedRoot, "installed", 1);
  assertParity(legacyBaseline, installedResult, "installed");
  console.log("MATERIALIZER_DEPENDENCY_IDENTIFIER_INSTALLED_ROUTING_PASSED");
  console.log("MATERIALIZER_DEPENDENCY_IDENTIFIER_MATERIALIZER_INTEGRATION_PARITY_PASSED");
  console.log("MATERIALIZER_DEPENDENCY_IDENTIFIER_LEGACY_ROLLBACK_PASSED");
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
  const legacy = source.replace("  safeDependencyIdentifier as coreSafeDependencyIdentifier,\n", "").replaceAll("coreSafeDependencyIdentifier(", "safeDependencyIdentifier(");
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
  const result = materializer.materializeFullAppGeneratedFinal({ cwd: fixtureRoot, functionalSpec: spec, appPlan: plan, outDir: output, allowFixtureApiIdsForTests: true });
  assert.equal(result.status, "pass", `${surface} materialization must pass.`);
  const outputFiles = readdirSync(output).sort();
  assert.ok(outputFiles.length > 0 && outputFiles.every((file) => file.startsWith(fixture.expectedOutputPrefix)), `${surface} output files must retain the expected materialized application name.`);
  const decoded = JSON.parse(readFileSync(result.outputs.decodedResource, "utf8"));
  assert.match(JSON.stringify(decoded), new RegExp(fixture.requiredGeneratedDependencyPrefix), `${surface} must materialize the normalized dependency identifier.`);
  return { outputFiles, normalizedDecoded: normalizeDecoded(decoded) };
}

function normalizeDecoded(decoded) {
  return JSON.parse(JSON.stringify(decoded).replace(/[0-9a-f]{8}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{12}/giu, "<control-style-uuid>"));
}

function assertParity(legacy, actual, surface) {
  assert.deepEqual(actual.normalizedDecoded, legacy.normalizedDecoded, `${surface} normalized decoded materializer output must match the Legacy baseline without unrelated resource shape changes.`);
  assert.deepEqual(actual.outputFiles, legacy.outputFiles, `${surface} materialization output files must match the Legacy baseline.`);
}

function count(text, token) { return text.split(token).length - 1; }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

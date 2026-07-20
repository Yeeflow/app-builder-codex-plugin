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
const fixture = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/data-list-scalar-field-projection-routing.v0.1.0.json"), "utf8"));
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-data-list-scalar-routing-"));

assert.equal(sha256(readFileSync(historicalZip)), expectedHistoricalZipSha256, "Historical ZIP checksum must match before routing proof.");

try {
  const materializerSource = readFileSync(resolve(root, "scripts/materialize-full-app-generated-final.mjs"), "utf8");
  assert.equal(countCallExpressions(materializerSource, "buildFieldRecord"), fixture.expectedCallSites.productionBuildFieldRecordCallExpressionCount, "The approved production buildFieldRecord caller boundary must remain one expression.");
  assert.equal(countCallExpressions(materializerSource, "coreProjectDataListScalarField"), fixture.expectedCallSites.coreProjectionInvocationCount, "The approved Core scalar projection route must have one invocation.");
  assert.match(materializerSource, /function buildFieldRecord\(/u, "The retained Legacy buildFieldRecord helper must remain callable for rollback.");
  assert.match(materializerSource, /DATA_LIST_SCALAR_FIELD_PROJECTION_CORE_ROUTE_START/u, "The approved scalar-only Core route marker must remain present.");

  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
  const legacyRoot = createLegacyRollbackSurface(resolve(temporary, "legacy-baseline"), root);
  const legacyBaseline = await materialize(legacyRoot, "legacy-baseline", 1);
  const sourceFirst = await materialize(root, "source", 1);
  const sourceSecond = await materialize(root, "source", 2);
  assertParity(legacyBaseline, sourceFirst, "source");
  assert.deepEqual(sourceFirst.normalizedDecoded, sourceSecond.normalizedDecoded, "The scoped Core-routed source output must be deterministic after documented UUID normalization.");
  console.log("DATA_LIST_SCALAR_FIELD_PROJECTION_ADAPTER_ROUTING_PASSED");
  console.log("DATA_LIST_SCALAR_FIELD_PROJECTION_SOURCE_ROUTING_PASSED");
  console.log("DATA_LIST_SCALAR_FIELD_PROJECTION_MATERIALIZER_DETERMINISM_PASSED");

  const proofZip = resolve(temporary, "proof.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", proofZip], { cwd: root, stdio: "inherit" });
  const archiveRoot = resolve(temporary, "archive");
  mkdirSync(archiveRoot, { recursive: true });
  execFileSync("unzip", ["-q", proofZip, "-d", archiveRoot]);
  const archiveResult = await materialize(resolve(archiveRoot, "yeeflow-app-builder-plugin"), "archive", 1);
  assertParity(legacyBaseline, archiveResult, "archive");
  console.log("DATA_LIST_SCALAR_FIELD_PROJECTION_ARCHIVE_ROUTING_PASSED");

  const installedRoot = resolve(temporary, "installed/yeeflow-app-builder-plugin");
  cpSync(pluginDist, installedRoot, { recursive: true });
  const installedResult = await materialize(installedRoot, "installed", 1);
  assertParity(legacyBaseline, installedResult, "installed");
  console.log("DATA_LIST_SCALAR_FIELD_PROJECTION_INSTALLED_ROUTING_PASSED");

  const legacyInvalid = await materializeInvalid(legacyRoot, "legacy-invalid");
  const sourceInvalid = await materializeInvalid(root, "source-invalid");
  assert.deepEqual(sourceInvalid, legacyInvalid, "The preserved barcode validation error must match the Legacy baseline.");
  assert.match(sourceInvalid.message, /DATA_LIST_BARCODE_SCAN_FIELD_TYPE_INVALID/u, "The invalid barcode fixture must retain the stable validation code.");
  console.log("DATA_LIST_SCALAR_FIELD_PROJECTION_MATERIALIZER_INTEGRATION_PARITY_PASSED");
  console.log("DATA_LIST_SCALAR_FIELD_PROJECTION_LEGACY_ROLLBACK_PASSED");
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
    .replace("  projectDataListScalarField as coreProjectDataListScalarField,\n", "")
    .replace(/\n  \/\/ DATA_LIST_SCALAR_FIELD_PROJECTION_CORE_ROUTE_START[\s\S]*?\n  \/\/ DATA_LIST_SCALAR_FIELD_PROJECTION_CORE_ROUTE_END\n/u, "\n");
  assert.notEqual(legacy, source, "Rollback surface must restore only the scoped Legacy scalar projection route.");
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
  const materializer = await import(`${pathToFileURL(resolve(surfaceRoot, "scripts/materialize-full-app-generated-final.mjs")).href}?surface=${surface}-${run}`);
  const result = materializer.materializeFullAppGeneratedFinal({ cwd: fixtureRoot, functionalSpec: spec, appPlan: plan, outDir: output, allowFixtureApiIdsForTests: true });
  assert.equal(result.status, "pass", `${surface} materialization must pass.`);
  const decoded = JSON.parse(readFileSync(result.outputs.decodedResource, "utf8"));
  const fieldDetails = scalarFields(decoded);
  const fields = Object.fromEntries(Object.entries(fieldDetails).map(([fieldName, field]) => [fieldName, { fieldType: field.fieldType, type: field.type, defaultValue: field.defaultValue }]));
  assert.deepEqual(fields, fixture.expectedFields, `${surface} must materialize the complete scalar field matrix through the approved route.`);
  assert.match(fieldDetails.Text5.rules, /color_choices/u, `${surface} select choices must retain color-choice rules.`);
  assert.match(fieldDetails.Text6.rules, /color_choices/u, `${surface} checkbox choices must retain color-choice rules.`);
  assert.equal(fieldDetails.Text7.rules, JSON.stringify({ allowScan: true }), `${surface} Text barcode scan must retain its Legacy rule.`);
  return { fields, normalizedDecoded: normalizeDecoded(decoded), outputFiles: readdirSync(output).sort() };
}

async function materializeInvalid(surfaceRoot, surface) {
  const fixtureRoot = resolve(temporary, surface);
  mkdirSync(fixtureRoot, { recursive: true });
  const spec = resolve(fixtureRoot, "functional-specification.md");
  const plan = resolve(fixtureRoot, "yeeflow-app-plan.md");
  writeFileSync(spec, `${fixture.functionalSpecificationLines.join("\n")}\n`, "utf8");
  writeFileSync(plan, `${fixture.invalidBarcodePlanLines.join("\n")}\n`, "utf8");
  const materializer = await import(`${pathToFileURL(resolve(surfaceRoot, "scripts/materialize-full-app-generated-final.mjs")).href}?invalid=${surface}`);
  try {
    materializer.materializeFullAppGeneratedFinal({ cwd: fixtureRoot, functionalSpec: spec, appPlan: plan, outDir: resolve(fixtureRoot, "output"), allowFixtureApiIdsForTests: true });
  } catch (error) {
    return { name: error?.name || "Error", message: error?.message || String(error) };
  }
  throw new Error(`${surface} invalid barcode materialization must throw.`);
}

function scalarFields(decoded) {
  const list = decoded.Childs?.find((child) => child.List?.Title === "Scalar Records");
  assert.ok(list, "The materialized package must contain Scalar Records.");
  return Object.fromEntries(Object.entries(fixture.expectedFields).map(([fieldName]) => {
    const field = list.Fields?.find((candidate) => candidate.FieldName === fieldName);
    assert.ok(field, `The materialized list must contain ${fieldName}.`);
    return [fieldName, { fieldType: field.FieldType, type: field.Type, defaultValue: field.DefaultValue, rules: field.Rules }];
  }));
}

function normalizeDecoded(decoded) {
  return JSON.parse(JSON.stringify(decoded).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu, "<control-style-uuid>"));
}

function assertParity(legacy, actual, surface) {
  assert.deepEqual(actual.fields, legacy.fields, `${surface} scalar fields must match the Legacy baseline.`);
  assert.deepEqual(actual.normalizedDecoded, legacy.normalizedDecoded, `${surface} normalized decoded output must match the Legacy baseline.`);
  assert.deepEqual(actual.outputFiles, legacy.outputFiles, `${surface} output files must match the Legacy baseline.`);
}

function countCallExpressions(source, name) {
  if (name === "buildFieldRecord") return [...source.matchAll(/=>\s*buildFieldRecord\s*\(/gu)].length;
  return [...source.matchAll(new RegExp(`\\b${name}\\s*\\(`, "gu"))].length;
}
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

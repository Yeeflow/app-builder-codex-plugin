#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dataListSublistScalarSummaryProductionRoutingPlan } from "./test-fixtures/data-list-sublist-scalar-summary-production-routing-plan.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/data-list-sublist-scalar-summary-intent-production-routing.v0.1.0.json"), "utf8"));
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase10e-summary-routing-"));

try {
  const source = readFileSync(resolve(root, "scripts/materialize-full-app-generated-final.mjs"), "utf8");
  assert.match(source, /DATA_LIST_SUBLIST_SCALAR_SUMMARY_INTENT_CORE_ROUTE_START/u);
  assert.equal((source.match(/coreProjectDataListSublistScalarSummaryIntent\(/gu) || []).length, 1, "One Core selection call is permitted.");
  assert.equal((source.match(/coreLowerDataListSublistScalarSummaryIntentAtHost\(/gu) || []).length, 1, "One Local Runtime lowering call is permitted.");
  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });

  const legacy = await materialize(createLegacyRollbackSurface(resolve(temporary, "legacy")), "legacy", 1);
  const first = await materialize(root, "source", 1);
  const second = await materialize(root, "source", 2);
  assertParity(legacy, first, "source");
  assert.deepEqual(first.normalizedDecoded, second.normalizedDecoded, "Routed materialization must be deterministic.");
  assertStaticAndTempShape(first, "source");
  console.log("SUBLIST_SCALAR_SUMMARY_INTENT_ADAPTER_ROUTING_PASSED");
  console.log("SUBLIST_SCALAR_SUMMARY_INTENT_SOURCE_ROUTING_PASSED");
  console.log("SUBLIST_SCALAR_SUMMARY_INTENT_MATERIALIZER_INTEGRATION_PARITY_PASSED");
  console.log("SUBLIST_SCALAR_SUMMARY_INTENT_MATERIALIZER_DETERMINISM_PASSED");
  console.log("SUBLIST_SCALAR_SUMMARY_INTENT_TEMP_VARIABLE_NONINTERFERENCE_PASSED");

  const archive = resolve(temporary, "phase10e-proof.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", archive], { cwd: root, stdio: "inherit" });
  const archiveRoot = resolve(temporary, "archive");
  mkdirSync(archiveRoot, { recursive: true });
  execFileSync("unzip", ["-q", archive, "-d", archiveRoot]);
  const zipped = await materialize(resolve(archiveRoot, "yeeflow-app-builder-plugin"), "archive", 1);
  assertParity(legacy, zipped, "archive");
  assertStaticAndTempShape(zipped, "archive");
  console.log("SUBLIST_SCALAR_SUMMARY_INTENT_ARCHIVE_ROUTING_PASSED");

  const installedRoot = resolve(temporary, "installed/yeeflow-app-builder-plugin");
  cpSync(resolve(root, "dist/yeeflow-app-builder-plugin"), installedRoot, { recursive: true });
  const installed = await materialize(installedRoot, "installed", 1);
  assertParity(legacy, installed, "installed");
  assertStaticAndTempShape(installed, "installed");
  console.log("SUBLIST_SCALAR_SUMMARY_INTENT_INSTALLED_ROUTING_PASSED");
  assertScopeGates(source);
  console.log("SUBLIST_SCALAR_SUMMARY_INTENT_ROUTING_SCOPE_GATES_PASSED");
  console.log("SUBLIST_SCALAR_SUMMARY_INTENT_LEGACY_ROLLBACK_PASSED");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

async function materialize(surfaceRoot, label, run) {
  const cwd = resolve(temporary, `${label}-${run}`);
  const specification = resolve(cwd, "functional-specification.md");
  const plan = resolve(cwd, "yeeflow-app-plan.md");
  const outDir = resolve(cwd, "output");
  mkdirSync(cwd, { recursive: true });
  writeFileSync(specification, "# Functional Specification: Scalar Summary Routing\n\n| Application Name | Employee Leave Balances |\n", "utf8");
  writeFileSync(plan, dataListSublistScalarSummaryProductionRoutingPlan(), "utf8");
  const materializer = await import(`${pathToFileURL(resolve(surfaceRoot, "scripts/materialize-full-app-generated-final.mjs")).href}?phase10e=${label}-${run}`);
  const result = materializer.materializeFullAppGeneratedFinal({ cwd, functionalSpec: specification, appPlan: plan, outDir, allowFixtureApiIdsForTests: true });
  assert.equal(result.status, "pass", `${label}: ${JSON.stringify(result.findings || [])}`);
  const decoded = JSON.parse(readFileSync(result.outputs.decodedResource, "utf8"));
  const list = decoded.Childs.find((entry) => entry.List?.Title === "Employee Leave Balances");
  const form = list.Layouts.find((entry) => entry.Type === 1 && entry.Title === "Employee Leave Balance Form");
  const resource = JSON.parse(form.LayoutView);
  const control = findNodes(resource, (value) => value?.type === "list" && value?.binding === "Text7")[0];
  assert.ok(control, `${label}: missing Sublist control.`);
  return { summaries: control.attrs?.["list-fields-summary"] || [], tempVars: (resource.tempVars || []).map((item) => ({ id: item.id })), normalizedDecoded: normalize(decoded), outputFiles: readdirSync(outDir).sort() };
}

function assertStaticAndTempShape(result, label) {
  assert.equal(result.summaries.length, fixture.eligibleStaticCases.length + 1, `${label}: summary count changed.`);
  for (const expected of fixture.eligibleStaticCases) {
    const actual = result.summaries.find((item) => item.field === expected.field && item.type === expected.type);
    assert.ok(actual, `${label}: missing ${expected.id}.`);
    assert.equal(actual.binding, null, `${label}: static route must retain binding: null for ${expected.id}.`);
  }
  assert.deepEqual(result.tempVars, [{ id: fixture.requiredTempVar }], `${label}: Core/Local Runtime must not create, discover, or mutate temporary variables.`);
  const temporaryBinding = result.summaries.find((item) => item.binding?.prefix === "__temp_" && item.binding?.value === fixture.requiredTempVar);
  assert.ok(temporaryBinding, `${label}: retained Legacy temporary-variable binding is missing.`);
}

function assertParity(legacy, actual, label) { assert.deepEqual(actual.normalizedDecoded, legacy.normalizedDecoded, `${label}: complete decoded output differs from the temporary-copy Legacy rollback.`); assert.deepEqual(actual.outputFiles, legacy.outputFiles, `${label}: output file set differs from Legacy rollback.`); }
function findNodes(value, predicate, output = []) { if (Array.isArray(value)) { value.forEach((entry) => findNodes(entry, predicate, output)); return output; } if (!value || typeof value !== "object") return output; if (predicate(value)) output.push(value); Object.values(value).forEach((entry) => findNodes(entry, predicate, output)); return output; }
function normalize(value) { return JSON.parse(JSON.stringify(value).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu, "<control-uuid>")); }

function createLegacyRollbackSurface(target) {
  cpSync(resolve(root, "scripts"), resolve(target, "scripts"), { recursive: true });
  cpSync(resolve(root, "docs/reference"), resolve(target, "docs/reference"), { recursive: true });
  cpSync(resolve(root, "dist/yeeflow-app-builder-plugin/core"), resolve(target, "core"), { recursive: true });
  const targetPath = resolve(target, "scripts/materialize-full-app-generated-final.mjs");
  const source = readFileSync(targetPath, "utf8");
  const legacy = source
    .replace("  projectDataListSublistScalarSummaryIntent as coreProjectDataListSublistScalarSummaryIntent,\n", "")
    .replace("  lowerDataListSublistScalarSummaryIntentAtHost as coreLowerDataListSublistScalarSummaryIntentAtHost,\n", "")
    .replace(/\n    \/\/ DATA_LIST_SUBLIST_SCALAR_SUMMARY_INTENT_CORE_ROUTE_START[\s\S]*?\n    \/\/ DATA_LIST_SUBLIST_SCALAR_SUMMARY_INTENT_CORE_ROUTE_END/u, "")
    .replace("      field: staticMetadata?.field || field,\n      type: staticMetadata?.type || normKey(summary?.type) || \"total\",\n      display: staticMetadata ? staticMetadata.display : summary?.display !== false,\n      binding: staticMetadata ? staticMetadata.binding : (prefix && value ? { prefix, value } : null),", "      field,\n      type: normKey(summary?.type) || \"total\",\n      display: summary?.display !== false,\n      binding: prefix && value ? { prefix, value } : null,")
    .replace(/\nfunction shouldRouteDataListSublistScalarSummaryIntent[\s\S]*?\nfunction ensureDataListSubListSummaryTempVars/u, "\nfunction ensureDataListSubListSummaryTempVars");
  assert.notEqual(legacy, source, "Rollback must remove the new bridge.");
  assert.equal(legacy.includes("coreProjectDataListSublistScalarSummaryIntent"), false, "Rollback must remove the Core adapter call.");
  assert.equal(legacy.includes("coreLowerDataListSublistScalarSummaryIntentAtHost"), false, "Rollback must remove the Local Runtime adapter call.");
  writeFileSync(targetPath, legacy, "utf8");
  return target;
}

function assertScopeGates(source) {
  for (const token of ["DATA_LIST_SUBLIST_SCALAR_SUMMARY_INTENT_CORE_ROUTE_START", "DATA_LIST_SUBLIST_SCALAR_SUMMARY_INTENT_CORE_ROUTE_END", "coreProjectDataListSublistScalarSummaryIntent", "coreLowerDataListSublistScalarSummaryIntentAtHost"]) assert.match(source, new RegExp(token));
  assert.match(source, /ensureDataListSubListSummaryTempVars\(resource\)/u);
  const route = source.slice(source.indexOf("function normalizeDataListSubListSummaries"), source.indexOf("function ensureDataListSubListSummaryTempVars"));
  for (const forbidden of ["tempVars", "push(", "resource.", "template", "package", "globalThis", "new Map()", "binding: {"]) assert.equal(route.includes(forbidden), false, `Forbidden route token: ${forbidden}`);
}

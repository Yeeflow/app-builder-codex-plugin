#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const plugin = resolve(root, "dist/yeeflow-app-builder-plugin");
const historicalZip = resolve(root, "dist/yeeflow-app-builder-plugin-0.9.71.zip");
const historicalChecksum = "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2";
const fixture = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/data-list-lookup-resolution-routing.v0.1.0.json"), "utf8"));
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-lookup-routing-"));

assert.equal(sha(readFileSync(historicalZip)), historicalChecksum);
try {
  const sourceText = readFileSync(resolve(root, "scripts/materialize-full-app-generated-final.mjs"), "utf8");
  assert.equal(fixture.caseCount, 15);
  assert.equal(count(sourceText, "coreProjectDataListLookupResolutionIntent"), 1);
  assert.equal(count(sourceText, "coreLowerDataListLookupResolutionAtHost"), 1);
  assert.match(sourceText, /DATA_LIST_LOOKUP_RESOLUTION_CORE_ROUTE_START/u);
  assert.match(sourceText, /function resolveLookupTargetListId\(/u);
  assert.match(sourceText, /function buildFieldRules\(/u);

  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
  const legacy = createLegacySurface(resolve(temporary, "legacy"));
  const rollback = createRollbackSurface(resolve(temporary, "rollback"));
  const baseline = await materialize(legacy, "legacy", 1);
  const source = await materialize(root, "source", 1);
  const sourceSecond = await materialize(root, "source", 2);
  const rolledBack = await materialize(rollback, "rollback", 1);
  assertParity(baseline, source, "source");
  assertParity(baseline, rolledBack, "rollback");
  assert.deepEqual(source.normalizedDecoded, sourceSecond.normalizedDecoded, "Core-routed Lookup materialization is not deterministic.");
  assert.equal(source.lookupIds.every((value) => typeof value === "string" && /^\d+$/u.test(value)), true, JSON.stringify(source.lookupIds));
  console.log("DATA_LIST_LOOKUP_RESOLUTION_ADAPTER_ROUTING_PASSED");
  console.log("DATA_LIST_LOOKUP_RESOLUTION_SOURCE_ROUTING_PASSED");
  console.log("DATA_LIST_LOOKUP_RESOLUTION_MATERIALIZER_DETERMINISM_PASSED");
  console.log("DATA_LIST_LOOKUP_RESOLUTION_LOSSLESS_TARGET_ID_ROUTING_PASSED");

  const proofZip = resolve(temporary, "proof.zip");
  const archiveRoot = resolve(temporary, "archive");
  mkdirSync(archiveRoot, { recursive: true });
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", proofZip], { cwd: root, stdio: "inherit" });
  execFileSync("unzip", ["-q", proofZip, "-d", archiveRoot]);
  const archive = await materialize(resolve(archiveRoot, "yeeflow-app-builder-plugin"), "archive", 1);
  assertParity(baseline, archive, "archive");
  console.log("DATA_LIST_LOOKUP_RESOLUTION_ARCHIVE_ROUTING_PASSED");

  const installed = resolve(temporary, "installed/yeeflow-app-builder-plugin");
  cpSync(plugin, installed, { recursive: true });
  const installedResult = await materialize(installed, "installed", 1);
  assertParity(baseline, installedResult, "installed");
  console.log("DATA_LIST_LOOKUP_RESOLUTION_INSTALLED_ROUTING_PASSED");

  await assertHostErrors();
  assertScopeGates(sourceText);
  console.log("DATA_LIST_LOOKUP_RESOLUTION_MATERIALIZER_INTEGRATION_PARITY_PASSED");
  console.log("DATA_LIST_LOOKUP_RESOLUTION_ROUTING_SCOPE_GATES_PASSED");
  console.log("DATA_LIST_LOOKUP_RESOLUTION_LEGACY_ROLLBACK_PASSED");
  assert.equal(sha(readFileSync(historicalZip)), historicalChecksum);
} finally { rmSync(temporary, { recursive: true, force: true }); }

function createSurface(target) {
  cpSync(resolve(root, "scripts"), resolve(target, "scripts"), { recursive: true });
  cpSync(resolve(root, "docs/reference"), resolve(target, "docs/reference"), { recursive: true });
  cpSync(resolve(plugin, "core"), resolve(target, "core"), { recursive: true });
  return target;
}
function createLegacySurface(target) {
  createSurface(target);
  const path = resolve(target, "scripts/materialize-full-app-generated-final.mjs");
  const text = readFileSync(path, "utf8")
    .replace("  projectDataListLookupResolutionIntent as coreProjectDataListLookupResolutionIntent,\n", "")
    .replace("  lowerDataListLookupResolutionAtHost as coreLowerDataListLookupResolutionAtHost,\n", "")
    .replace(/\n  \/\/ DATA_LIST_LOOKUP_RESOLUTION_CORE_ROUTE_START[\s\S]*?\n  \/\/ DATA_LIST_LOOKUP_RESOLUTION_CORE_ROUTE_END\n/u, "\n")
    .replace(/const rules = lookupRoute \? lookupRoute\.rules : buildFieldRules\(\{ field, type, lookupTargetListId[^}]*\}\);/u, "const rules = buildFieldRules({ field, type, lookupTargetListId });")
    .replace(/\nfunction shouldRouteDataListLookupResolution[\s\S]*?\n\}\n\nfunction resolveDataListLookupRulesThroughCore[\s\S]*?\n\}\n/u, "\n");
  writeFileSync(path, text, "utf8");
  return target;
}
function createRollbackSurface(target) { return createLegacySurface(target); }
async function materialize(surfaceRoot, label, run) {
  const fixtureRoot = resolve(temporary, `${label}-${run}`); mkdirSync(fixtureRoot, { recursive: true });
  const specification = resolve(fixtureRoot, "functional-specification.md");
  const plan = resolve(fixtureRoot, "yeeflow-app-plan.md");
  const output = resolve(fixtureRoot, "output");
  writeFileSync(specification, "# Functional Specification: Lookup Routing Fixture\n\n| Application Name | Lookup Routing Fixture |\n", "utf8");
  writeFileSync(plan, planText(), "utf8");
  const module = await import(`${pathToFileURL(resolve(surfaceRoot, "scripts/materialize-full-app-generated-final.mjs")).href}?${label}-${run}`);
  const result = module.materializeFullAppGeneratedFinal({ cwd: fixtureRoot, functionalSpec: specification, appPlan: plan, outDir: output, allowFixtureApiIdsForTests: true });
  assert.equal(result.status, "pass", `${label} materialization failed: ${JSON.stringify(result.findings || result)}`);
  const decoded = JSON.parse(readFileSync(result.outputs.decodedResource, "utf8"));
  const customers = decoded.Childs.find((child) => child.List?.Title === "Customers");
  const orders = decoded.Childs.find((child) => child.List?.Title === "Orders");
  assert.ok(customers && orders, `${label} Data Lists are missing.`);
  const lookupFields = orders.Fields.filter((field) => field.Type === "lookup");
  assert.equal(lookupFields.length, 2, `${label} lookup field count changed: ${JSON.stringify(orders.Fields.map((field) => ({ fieldName: field.FieldName, type: field.Type, rules: field.Rules })))}.`);
  const lookupIds = lookupFields.map((field) => JSON.parse(field.Rules).listid);
  assert.deepEqual(lookupIds, [customers.List.ListID, customers.List.ListID], `${label} Lookup Rules target changed.`);
  return { lookupIds, normalizedDecoded: normalize(decoded), files: readdirSync(output).sort() };
}
function planText() { return `# Lookup Routing Fixture - Yeeflow App Plan

## 1. Plan Status

Business defaults approval status: user-default-approved-for-generation.

## 4. Data Lists and Document Libraries Plan

### 4.1 Customers
- Resource type: Data list

#### Fields
| Display Name | Storage Name | Exact Yeeflow Field Type | Control | Lookup Target | Notes |
| --- | --- | --- | --- | --- | --- |
| Customer Name | Title | Text | input | | Native title field. |

### 4.2 Orders
- Resource type: Data list

#### Fields
| Display Name | Storage Name | Exact Yeeflow Field Type | Control | Lookup Target | Notes |
| --- | --- | --- | --- | --- | --- |
| Order Name | Title | Text | input | | Native title field. |
| Customer | Text1 | Text | lookup | Customers | Direct Lookup target. |
| Backup Customer | Text2 | Text | lookup | Customers | Second deterministic Lookup target. |
| Notes | Text3 | Text | textarea | | Scalar branch exclusion. |

## 15. Application Navigation Plan
| Group | Item | Target Resource | Yeeflow Resource Type | Icon |
| --- | --- | --- | --- | --- |
| Operations | Customers | Customers | Data List | fa-solid fa-list |
| Operations | Orders | Orders | Data List | fa-solid fa-list |
`; }
async function assertHostErrors() {
  const core = await import(pathToFileURL(resolve(root, "scripts/lib/materializer-core-adapter.mjs")).href);
  const runtime = await import(pathToFileURL(resolve(root, "scripts/lib/local-runtime-core-adapter.mjs")).href);
  const projection = core.projectDataListLookupResolutionIntent(Object.freeze({ surface: "data-list", sourceResourceKey: "orders", sourceFieldKey: "text1", sourceFieldOrdinal: 1, lookupTarget: "Customers", displayName: "Customer", controlType: "lookup" }));
  const source = Object.freeze({ sourceListId: "9000000000000000001", sourceFieldId: "9000000000000000002", sourceFieldListId: "9000000000000000001" });
  const base = { targetListIdsByLogicalKey: { customers: "9000000000000000003" }, targetScopesByLogicalKey: { customers: "data-list:9000000000000000003" } };
  const singular = core.projectDataListLookupResolutionIntent(Object.freeze({ surface: "data-list", sourceResourceKey: "orders", sourceFieldKey: "text2", sourceFieldOrdinal: 2, lookupTarget: "Customer", displayName: "Customer", controlType: "lookup" }));
  const singularLowered = runtime.lowerDataListLookupResolutionAtHost(singular.intent, Object.freeze(base), source);
  assert.equal(JSON.parse(singularLowered.rules).listid, "9000000000000000003");
  for (const [code, map, context] of [
    ["LOOKUP_RESOLUTION_TARGET_MAPPING_MISSING", { targetListIdsByLogicalKey: {}, targetScopesByLogicalKey: {} }, source],
    ["LOOKUP_RESOLUTION_TARGET_LIST_ID_INVALID", { targetListIdsByLogicalKey: { customers: 9000000000000000000 }, targetScopesByLogicalKey: { customers: "data-list:9000000000000000000" } }, source],
    ["LOOKUP_RESOLUTION_TARGET_SCOPE_MISMATCH", { targetListIdsByLogicalKey: { customers: "9000000000000000003" }, targetScopesByLogicalKey: { customers: "document-library:9000000000000000003" } }, source],
    ["LOOKUP_RESOLUTION_SOURCE_TARGET_RELATIONSHIP_BROKEN", base, { ...source, sourceFieldListId: "9000000000000000009" }],
    ["LOOKUP_RESOLUTION_TARGET_MAPPING_AMBIGUOUS", { targetListIdsByLogicalKey: { customer: "9000000000000000003", customers: "9000000000000000004" }, targetScopesByLogicalKey: { customer: "data-list:9000000000000000003", customers: "data-list:9000000000000000004" } }, source],
  ]) assert.throws(() => runtime.lowerDataListLookupResolutionAtHost(projection.intent, Object.freeze(map), Object.freeze(context)), new RegExp(code));
  const unresolved = core.projectDataListLookupResolutionIntent(Object.freeze({ surface: "data-list", sourceResourceKey: "orders", sourceFieldKey: "text9", sourceFieldOrdinal: 9, lookupTarget: "", displayName: "", controlType: "lookup" }));
  assert.equal(unresolved.intent, null);
  assert.equal(unresolved.findings[0]?.code, "DATA_LIST_LOOKUP_TARGET_UNRESOLVED");
}
function assertScopeGates(source) {
  assert.match(source, /shouldRouteDataListLookupResolution\(field, type, lookupTargetIdentityMap\)/u);
  assert.match(source, /type === "lookup"/u);
  for (const control of ["list", "identity-picker", "file-upload", "icon-upload"]) assert.match(source, new RegExp(control));
  assert.doesNotMatch(source, /fallback target mapping|randomUUID\(.*lookup/iu);
}
function assertParity(expected, actual, label) { assert.deepEqual(actual.lookupIds, expected.lookupIds, `${label} Lookup target IDs differ.`); assert.deepEqual(actual.normalizedDecoded, expected.normalizedDecoded, `${label} decoded output differs.`); assert.deepEqual(actual.files, expected.files, `${label} output files differ.`); }
function count(text, name) { return [...text.matchAll(new RegExp(`\\b${name}\\s*\\(`, "gu"))].length; }
function normalize(value) { return JSON.parse(JSON.stringify(value).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu, "<legacy-uuid>")); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }

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
const historicalChecksum = "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2";
const integration = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/data-list-scalar-resource-identity-routing.v0.1.0.json"), "utf8"));
const fixture = JSON.parse(readFileSync(resolve(root, integration.baseFixture), "utf8"));
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-scalar-resource-identity-routing-"));

assert.equal(sha256(readFileSync(historicalZip)), historicalChecksum);
try {
  const current = readFileSync(resolve(root, "scripts/materialize-full-app-generated-final.mjs"), "utf8");
  assert.equal(integration.caseCount, 18);
  assert.equal(integration.matrix.length, 18);
  assert.equal(count(current, "buildFieldRecord"), 1);
  assert.equal(count(current, "coreProjectDataListScalarResourceDefinitionIntent"), 1);
  assert.equal(count(current, "coreLowerDataListScalarResourceIdentityAtHost"), 1);
  assert.match(current, /function buildDataListScalarFieldRecordFromProjection\(/u);
  assert.match(current, /function shouldRouteDataListScalarFieldProjection\(/u);

  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
  const legacy = createFullLegacySurface(resolve(temporary, "legacy"));
  const scalarRollback = createScalarIdentityRollbackSurface(resolve(temporary, "scalar-rollback"));
  const baseline = await materialize(legacy, "legacy", 1);
  const source = await materialize(root, "source", 1);
  const sourceSecond = await materialize(root, "source", 2);
  const rollback = await materialize(scalarRollback, "rollback", 1);
  assertParity(baseline, source, "source");
  assertParity(baseline, rollback, "rollback");
  assert.deepEqual(source.normalizedDecoded, sourceSecond.normalizedDecoded);
  assert.equal(source.listIdType, "string");
  assert.equal(source.fieldIdTypes.every((type) => type === "string"), true);
  console.log("DATA_LIST_SCALAR_RESOURCE_IDENTITY_ADAPTER_ROUTING_PASSED");
  console.log("DATA_LIST_SCALAR_RESOURCE_IDENTITY_SOURCE_ROUTING_PASSED");
  console.log("DATA_LIST_SCALAR_RESOURCE_IDENTITY_MATERIALIZER_DETERMINISM_PASSED");
  console.log("DATA_LIST_SCALAR_RESOURCE_IDENTITY_LOSSLESS_ID_ROUTING_PASSED");

  const proofZip = resolve(temporary, "proof.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", proofZip], { cwd: root, stdio: "inherit" });
  const archiveRoot = resolve(temporary, "archive");
  mkdirSync(archiveRoot, { recursive: true });
  execFileSync("unzip", ["-q", proofZip, "-d", archiveRoot]);
  const archive = await materialize(resolve(archiveRoot, "yeeflow-app-builder-plugin"), "archive", 1);
  assertParity(baseline, archive, "archive");
  console.log("DATA_LIST_SCALAR_RESOURCE_IDENTITY_ARCHIVE_ROUTING_PASSED");

  const installedRoot = resolve(temporary, "installed/yeeflow-app-builder-plugin");
  cpSync(pluginDist, installedRoot, { recursive: true });
  const installed = await materialize(installedRoot, "installed", 1);
  assertParity(baseline, installed, "installed");
  console.log("DATA_LIST_SCALAR_RESOURCE_IDENTITY_INSTALLED_ROUTING_PASSED");

  await assertHostValidationGates();
  await assertScopeGates(root);
  console.log("DATA_LIST_SCALAR_RESOURCE_IDENTITY_MATERIALIZER_INTEGRATION_PARITY_PASSED");
  console.log("DATA_LIST_SCALAR_RESOURCE_IDENTITY_ROUTING_SCOPE_GATES_PASSED");
  console.log("DATA_LIST_SCALAR_RESOURCE_IDENTITY_LEGACY_ROLLBACK_PASSED");
  assert.equal(sha256(readFileSync(historicalZip)), historicalChecksum);
} finally { rmSync(temporary, { recursive: true, force: true }); }

function createSurface(target) {
  cpSync(resolve(root, "scripts"), resolve(target, "scripts"), { recursive: true });
  cpSync(resolve(root, "docs/reference"), resolve(target, "docs/reference"), { recursive: true });
  cpSync(resolve(pluginDist, "core"), resolve(target, "core"), { recursive: true });
  return target;
}
function createFullLegacySurface(target) {
  createSurface(target);
  const path = resolve(target, "scripts/materialize-full-app-generated-final.mjs");
  const source = readFileSync(path, "utf8");
  const legacy = source
    .replace("  projectDataListScalarField as coreProjectDataListScalarField,\n", "")
    .replace("  projectDataListScalarResourceDefinitionIntent as coreProjectDataListScalarResourceDefinitionIntent,\n", "")
    .replace("  lowerDataListScalarResourceIdentityAtHost as coreLowerDataListScalarResourceIdentityAtHost,\n", "")
    .replace(/\n  \/\/ DATA_LIST_SCALAR_FIELD_PROJECTION_CORE_ROUTE_START[\s\S]*?\n  \/\/ DATA_LIST_SCALAR_FIELD_PROJECTION_CORE_ROUTE_END\n/u, "\n")
    .replace(/\nfunction requireLosslessHostIdentity[\s\S]*?\n\}\n/u, "\n");
  writeFileSync(path, legacy, "utf8");
  return target;
}
function createScalarIdentityRollbackSurface(target) {
  createSurface(target);
  const path = resolve(target, "scripts/materialize-full-app-generated-final.mjs");
  const source = readFileSync(path, "utf8");
  const rollback = source
    .replace("  projectDataListScalarResourceDefinitionIntent as coreProjectDataListScalarResourceDefinitionIntent,\n", "")
    .replace("  lowerDataListScalarResourceIdentityAtHost as coreLowerDataListScalarResourceIdentityAtHost,\n", "")
    .replace(/    const scalarListId[\s\S]*?\n    \}\)\);\n/u, "    return buildDataListScalarFieldRecordFromProjection({ projection: result.projection, listId, fieldId });\n")
    .replace(/\nfunction requireLosslessHostIdentity[\s\S]*?\n\}\n/u, "\n");
  assert.notEqual(rollback, source);
  writeFileSync(path, rollback, "utf8");
  return target;
}
async function materialize(surfaceRoot, label, run) {
  const fixtureRoot = resolve(temporary, `${label}-${run}`); mkdirSync(fixtureRoot, { recursive: true });
  const spec = resolve(fixtureRoot, "functional-specification.md"); const plan = resolve(fixtureRoot, "yeeflow-app-plan.md"); const output = resolve(fixtureRoot, "output");
  writeFileSync(spec, `${fixture.functionalSpecificationLines.join("\n")}\n`); writeFileSync(plan, `${fixture.appPlanLines.join("\n")}\n`);
  const module = await import(`${pathToFileURL(resolve(surfaceRoot, "scripts/materialize-full-app-generated-final.mjs")).href}?${label}-${run}`);
  const result = module.materializeFullAppGeneratedFinal({ cwd: fixtureRoot, functionalSpec: spec, appPlan: plan, outDir: output, allowFixtureApiIdsForTests: true });
  assert.equal(result.status, "pass");
  const decoded = JSON.parse(readFileSync(result.outputs.decodedResource, "utf8"));
  const list = decoded.Childs.find((child) => child.List?.Title === "Scalar Records"); assert.ok(list);
  const fields = Object.fromEntries(Object.entries(fixture.expectedFields).map(([name]) => { const field = list.Fields.find((item) => item.FieldName === name); assert.ok(field); return [name, { fieldType: field.FieldType, type: field.Type, defaultValue: field.DefaultValue, rules: field.Rules, listId: field.ListID, fieldId: field.FieldID }]; }));
  assert.match(fields.Text5.rules, /color_choices/u); assert.match(fields.Text6.rules, /color_choices/u);
  return { fields, normalizedDecoded: normalize(decoded), outputFiles: readdirSync(output).sort(), listIdType: typeof list.List.ListID, fieldIdTypes: Object.values(fields).map((field) => typeof field.fieldId) };
}
async function assertHostValidationGates() {
  const core = await import(pathToFileURL(resolve(root, "scripts/lib/materializer-core-adapter.mjs")).href);
  const runtime = await import(pathToFileURL(resolve(root, "scripts/lib/local-runtime-core-adapter.mjs")).href);
  const projection = core.projectDataListScalarField({ fieldName: "Text1", fieldType: "Text", controlType: "input", fieldIndex: 1 }).projection;
  const intent = core.projectDataListScalarResourceDefinitionIntent({ resourceScope: "data-list:9000000000000000001", fieldOrdinal: 1, projection });
  const allocation = { listId: "9000000000000000001", fieldIdsByRequestId: { [intent.fieldRequest.requestId]: "9000000000000000002" }, fieldScopesByRequestId: { [intent.fieldRequest.requestId]: intent.resourceScope } };
  const lowered = runtime.lowerDataListScalarResourceIdentityAtHost(intent, allocation);
  assert.equal(lowered.ListID, "9000000000000000001");
  assert.equal(lowered.FieldID, "9000000000000000002");
  for (const [code, value, override] of [
    ["DATA_LIST_IDENTITY_ALLOCATION_MISSING", { ...allocation, fieldIdsByRequestId: {} }],
    ["DATA_LIST_IDENTITY_ALLOCATION_INVALID", { ...allocation, listId: "invalid" }],
    ["DATA_LIST_IDENTITY_ALLOCATION_COLLISION", { ...allocation, fieldIdsByRequestId: { ...allocation.fieldIdsByRequestId, other: "9000000000000000002" } }],
    ["DATA_LIST_IDENTITY_SCOPE_MISMATCH", { ...allocation, fieldScopesByRequestId: { [intent.fieldRequest.requestId]: "wrong" } }],
    ["DATA_LIST_IDENTITY_RELATIONSHIP_BROKEN", allocation, { ...intent, fieldOrdinal: 2 }],
    ["DATA_LIST_LOOKUP_TARGET_UNRESOLVED", allocation, { ...intent, requiredLookupTarget: "Customer" }],
    ["DATA_LIST_IDENTITY_LOSSY_INPUT", { ...allocation, listId: 9000000000000000001 }],
  ]) assert.throws(() => runtime.lowerDataListScalarResourceIdentityAtHost(override || intent, value), new RegExp(code));
}
async function assertScopeGates(surfaceRoot) {
  const source = readFileSync(resolve(surfaceRoot, "scripts/materialize-full-app-generated-final.mjs"), "utf8");
  assert.equal(count(source, "coreProjectDataListScalarResourceDefinitionIntent"), 1);
  assert.equal(count(source, "coreLowerDataListScalarResourceIdentityAtHost"), 1);
  for (const value of ["lookup", "sublist", "identity-picker", "file-upload", "icon-upload"]) assert.match(source, new RegExp(value));
}
function assertParity(expected, actual, label) { assert.deepEqual(actual.fields, expected.fields, `${label} fields differ`); assert.deepEqual(actual.normalizedDecoded, expected.normalizedDecoded, `${label} decoded output differs`); assert.deepEqual(actual.outputFiles, expected.outputFiles, `${label} output files differ`); }
function count(text, name) { return name === "buildFieldRecord" ? [...text.matchAll(/=>\s*buildFieldRecord\s*\(/gu)].length : [...text.matchAll(new RegExp(`\\b${name}\\s*\\(`, "gu"))].length; }
function normalize(value) { return JSON.parse(JSON.stringify(value).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu, "<legacy-uuid>")); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

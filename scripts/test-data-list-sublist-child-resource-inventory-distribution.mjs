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
const corpus = json("compatibility/differential-fixtures/data-list-sublist-child-resource-inventory-shadow.v0.1.0.json");
const contract = json("compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-sublist-child-inventory-distribution-"));
try {
  const expected = collect(await load("source", resolve(root, "runtimes/app-builder-core-local-runtime/lib/index.js")));
  console.log(`SUBLIST_CHILD_RESOURCE_INVENTORY_ARTIFACT_SOURCE_PARITY_PASSED cases=${corpus.caseCount}`);
  assert.deepEqual(collect(await load("dist", resolve(plugin, "core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"))), expected);
  const archive = resolve(temporary, "archive"); const zip = resolve(temporary, "proof.zip"); mkdirSync(archive, { recursive: true });
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", zip], { cwd: root, stdio: "pipe" }); execFileSync("unzip", ["-q", zip, "-d", archive]);
  assert.deepEqual(collect(await load("archive", resolve(archive, "yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"))), expected);
  console.log(`SUBLIST_CHILD_RESOURCE_INVENTORY_ARTIFACT_ARCHIVE_PARITY_PASSED cases=${corpus.caseCount}`);
  const installed = resolve(temporary, "installed/yeeflow-app-builder-plugin"); cpSync(plugin, installed, { recursive: true });
  assert.deepEqual(collect(await load("installed", resolve(installed, "core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"))), expected);
  console.log(`SUBLIST_CHILD_RESOURCE_INVENTORY_ARTIFACT_INSTALLED_PARITY_PASSED cases=${corpus.caseCount}`);
  assert.equal(execFileSync("shasum", ["-a", "256", historicalZip], { cwd: root, encoding: "utf8" }).split(/\s+/)[0], historicalChecksum);
  console.log(`SUBLIST_CHILD_RESOURCE_INVENTORY_DISTRIBUTION_VALID cases=${corpus.caseCount}`);
} finally { rmSync(temporary, { recursive: true, force: true }); }

async function load(label, path) { const module = await import(`${pathToFileURL(path).href}?surface=${label}`); assert.deepEqual(Object.keys(module).sort(), [...contract.runtimeExports].sort(), `${label} export list mismatch`); return module; }
function collect(runtime) { return corpus.cases.map((item) => {
  if (item.kind === "valid") { const input = validInput(item); const before = JSON.stringify(input); const result = runtime.buildDataListSublistChildResourceInventoryAtHost(input); assert.equal(JSON.stringify(input), before, `${item.id} input mutated`); assert.ok(Object.isFrozen(result) && Object.isFrozen(result.descriptors) && Object.isFrozen(result.descriptorsByParentField), item.id); assert.equal(JSON.stringify(result), JSON.stringify(JSON.parse(JSON.stringify(result))), item.id); if (item.id === "valid-nineteen-digit-identities") assert.equal(result.descriptors[0].childListId, id(3)); if (result.descriptors[0]) assert.deepEqual(formControlSimulation(result, result.descriptors[0].parentListId, result.descriptors[0].parentFieldId), fieldRulesSimulation(result, result.descriptors[0].parentListId, result.descriptors[0].parentFieldId), item.id); return { id: item.id, result: JSON.parse(JSON.stringify(result)) }; }
  if (item.kind === "host-error") { const input = errorInput(item.id); const before = JSON.stringify(input); const error = capture(() => runtime.buildDataListSublistChildResourceInventoryAtHost(input)).error; assert.match(error?.message || "", new RegExp(item.error), item.id); assert.equal(JSON.stringify(input), before, `${item.id} input mutated`); return { id: item.id, error: error.message }; }
  const error = capture(() => runtime.buildDataListSublistChildResourceInventoryAtHost({ relationships: [{ ...allocation(), fieldFamily: item.fieldFamily }] })).error; assert.match(error?.message || "", /SUBLIST_CHILD_RESOURCE_IDENTITY_INVALID/, item.id); return { id: item.id, excluded: true };
}); }
function allocation(overrides = {}) { const values = { fieldFamily: "sublist-scalar", parentListId: id(1), parentFieldId: id(2), childListId: id(3), childFieldId: id(4), rowSchemaId: id(5), childLogicalFieldKey: "Title", childOrdinal: 0, ...overrides }; return { ...values, parentScope: `data-list:${values.parentListId}`, childScope: `data-list:${values.childListId}`, rowSchemaScope: `data-list:${values.childListId}:row-schema:${values.rowSchemaId}` }; }
function validInput(item) { if (item.id === "valid-no-child") return { relationships: [] }; if (item.id === "valid-multiple-ordered") return { relationships: [allocation({ childFieldId: id(7), childLogicalFieldKey: "When", childOrdinal: 1 }), allocation({ childFieldId: id(6), childLogicalFieldKey: "Title", childOrdinal: 0 })] }; if (item.id === "valid-multiple-parent-fields") return { relationships: [allocation(), allocation({ parentListId: id(11), parentFieldId: id(12), childListId: id(13), childFieldId: id(14), rowSchemaId: id(15), childLogicalFieldKey: "Amount" })] }; return { relationships: [allocation()] }; }
function errorInput(name) { if (name === "child-missing") return { relationships: [allocation({ childListId: undefined })] }; if (name === "child-invalid") return { relationships: [allocation({ childFieldId: "not-an-api-id" })] }; if (name === "child-lossy") return { relationships: [allocation({ childListId: Number(id(3)) })] }; if (name === "child-duplicate") return { relationships: [allocation(), allocation({ childFieldId: id(6) })] }; if (name === "child-scope") { const value = allocation(); value.parentScope = "data-list:wrong"; return { relationships: [value] }; } if (name === "child-relationship") return { relationships: [allocation({ childListId: id(1) })] }; if (name === "row-schema-missing") return { relationships: [allocation({ rowSchemaId: undefined })] }; if (name === "row-schema-invalid") return { relationships: [allocation({ rowSchemaId: "schema" })] }; if (name === "row-schema-duplicate") return { relationships: [allocation(), allocation({ childFieldId: id(6), childLogicalFieldKey: "When", childOrdinal: 0 })] }; if (name === "row-schema-scope") { const value = allocation(); value.rowSchemaScope = "data-list:wrong:row-schema:wrong"; return { relationships: [value] }; } if (name === "row-schema-relationship") return { relationships: [allocation(), allocation({ childFieldId: id(6), childLogicalFieldKey: "When", rowSchemaId: id(9), childOrdinal: 1 })] }; throw new Error(`Unknown corpus case ${name}`); }
function formControlSimulation(inventory, parentListId, parentFieldId) { return select(inventory, parentListId, parentFieldId).map(shape); } function fieldRulesSimulation(inventory, parentListId, parentFieldId) { return select(inventory, parentListId, parentFieldId).map(shape); } function shape(item) { return { childFieldId: item.childFieldId, rowSchemaId: item.rowSchemaId, childLogicalFieldKey: item.childLogicalFieldKey, childOrdinal: item.childOrdinal }; } function select(inventory, parentListId, parentFieldId) { return inventory.descriptorsByParentField[`${parentListId}:${parentFieldId}`] || []; } function capture(callback) { try { return { value: callback(), error: null }; } catch (error) { return { value: null, error }; } } function id(offset) { return String(9000000000000000000n + BigInt(offset)); } function json(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }

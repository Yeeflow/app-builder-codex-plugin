#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corpus = json("compatibility/differential-fixtures/data-list-sublist-child-resource-inventory-shadow.v0.1.0.json");
const runtime = await moduleFromSource("runtimes/app-builder-core-local-runtime/src/internal-data-list-sublist-child-resource-inventory.ts");
let valid = 0; let hostErrors = 0; let excluded = 0;
for (const item of corpus.cases) {
  if (item.kind === "valid") {
    const input = validInput(item); const before = JSON.stringify(input);
    const first = runtime.buildDataListSublistChildResourceInventoryInternal(input);
    const second = runtime.buildDataListSublistChildResourceInventoryInternal(input);
    assert.equal(JSON.stringify(first), JSON.stringify(second), `${item.id}-deterministic`);
    assert.equal(JSON.stringify(input), before, `${item.id}-input-immutable`);
    assert.equal(JSON.stringify(first), JSON.stringify(JSON.parse(JSON.stringify(first))), `${item.id}-serializable`);
    assert.equal(Object.isFrozen(first), true, `${item.id}-result-frozen`);
    assert.equal(Object.isFrozen(first.descriptors), true, `${item.id}-descriptors-frozen`);
    if (first.descriptors[0]) assert.equal(Object.isFrozen(first.descriptors[0]), true, `${item.id}-descriptor-frozen`);
    if (item.id === "valid-nineteen-digit-identities") assert.equal(first.descriptors[0].parentListId, "9000000000000000001", "lossless-parent-list");
    if (item.relationshipCount) assert.deepEqual(formControlSimulation(first, first.descriptors[0].parentListId, first.descriptors[0].parentFieldId), fieldRulesSimulation(first, first.descriptors[0].parentListId, first.descriptors[0].parentFieldId), `${item.id}-coupled-consumers`);
    if (!item.relationshipCount) assert.deepEqual(first.descriptors, [], `${item.id}-no-child`);
    valid += 1;
    continue;
  }
  if (item.kind === "host-error") {
    const input = errorInput(item.id); const before = JSON.stringify(input);
    assert.throws(() => runtime.buildDataListSublistChildResourceInventoryInternal(input), new RegExp(item.error), item.id);
    assert.equal(JSON.stringify(input), before, `${item.id}-input-immutable`);
    hostErrors += 1;
    continue;
  }
  assert.throws(() => runtime.buildDataListSublistChildResourceInventoryInternal({ relationships: [{ ...allocation(), fieldFamily: item.fieldFamily }] }), /SUBLIST_CHILD_RESOURCE_IDENTITY_INVALID/, item.id);
  excluded += 1;
}
console.log("SUBLIST_CHILD_RESOURCE_INVENTORY_HOST_SHADOW_IMPLEMENTED");
console.log(`SUBLIST_CHILD_RESOURCE_INVENTORY_IDENTITY_VALIDATION_PASSED cases=${hostErrors}`);
console.log(`SUBLIST_CHILD_RESOURCE_INVENTORY_SERIALIZATION_PARITY_PASSED validCases=${valid}`);
console.log(`SUBLIST_CHILD_RESOURCE_INVENTORY_IMMUTABILITY_PASSED cases=${corpus.caseCount}`);
console.log("SUBLIST_CHILD_RESOURCE_INVENTORY_LOSSLESS_ID_PARITY_PASSED");
console.log(`SUBLIST_CHILD_RESOURCE_INVENTORY_CONSUMER_COMPATIBILITY_PASSED validCases=${valid - 1}`);
console.log(`SUBLIST_CHILD_RESOURCE_INVENTORY_LEGACY_UNCHANGED excludedCases=${excluded}`);

function allocation(overrides = {}) { const values = { fieldFamily: "sublist-scalar", parentListId: id(1), parentFieldId: id(2), childListId: id(3), childFieldId: id(4), rowSchemaId: id(5), childLogicalFieldKey: "Title", childOrdinal: 0, ...overrides }; return { ...values, parentScope: `data-list:${values.parentListId}`, childScope: `data-list:${values.childListId}`, rowSchemaScope: `data-list:${values.childListId}:row-schema:${values.rowSchemaId}` }; }
function validInput(item) {
  if (item.id === "valid-no-child") return { relationships: [] };
  if (item.id === "valid-multiple-ordered") return { relationships: [allocation({ childFieldId: id(7), childLogicalFieldKey: "When", childOrdinal: 1 }), allocation({ childFieldId: id(6), childLogicalFieldKey: "Title", childOrdinal: 0 })] };
  if (item.id === "valid-multiple-parent-fields") return { relationships: [allocation(), allocation({ parentListId: id(11), parentFieldId: id(12), childListId: id(13), childFieldId: id(14), rowSchemaId: id(15), childLogicalFieldKey: "Amount" })] };
  return { relationships: [allocation()] };
}
function errorInput(idValue) {
  if (idValue === "child-missing") return { relationships: [allocation({ childListId: undefined })] };
  if (idValue === "child-invalid") return { relationships: [allocation({ childFieldId: "not-an-api-id" })] };
  if (idValue === "child-lossy") return { relationships: [allocation({ childListId: Number(id(3)) })] };
  if (idValue === "child-duplicate") return { relationships: [allocation(), allocation({ childFieldId: id(6) })] };
  if (idValue === "child-scope") { const value = allocation(); value.parentScope = "data-list:wrong"; return { relationships: [value] }; }
  if (idValue === "child-relationship") return { relationships: [allocation({ childListId: id(1) })] };
  if (idValue === "row-schema-missing") return { relationships: [allocation({ rowSchemaId: undefined })] };
  if (idValue === "row-schema-invalid") return { relationships: [allocation({ rowSchemaId: "schema" })] };
  if (idValue === "row-schema-duplicate") return { relationships: [allocation(), allocation({ childFieldId: id(6), childLogicalFieldKey: "When", childOrdinal: 0 })] };
  if (idValue === "row-schema-scope") { const value = allocation(); value.rowSchemaScope = "data-list:wrong:row-schema:wrong"; return { relationships: [value] }; }
  if (idValue === "row-schema-relationship") return { relationships: [allocation(), allocation({ childFieldId: id(6), childLogicalFieldKey: "When", rowSchemaId: id(9), childOrdinal: 1 })] };
  throw new Error(`Unknown corpus case ${idValue}`);
}
function formControlSimulation(inventory, parentListId, parentFieldId) { return select(inventory, parentListId, parentFieldId).map((item) => ({ childFieldId: item.childFieldId, rowSchemaId: item.rowSchemaId, childLogicalFieldKey: item.childLogicalFieldKey, childOrdinal: item.childOrdinal })); }
function fieldRulesSimulation(inventory, parentListId, parentFieldId) { return select(inventory, parentListId, parentFieldId).map((item) => ({ childFieldId: item.childFieldId, rowSchemaId: item.rowSchemaId, childLogicalFieldKey: item.childLogicalFieldKey, childOrdinal: item.childOrdinal })); }
function select(inventory, parentListId, parentFieldId) { return inventory.descriptorsByParentField[`${parentListId}:${parentFieldId}`] || []; }
function id(offset) { return String(9000000000000000000n + BigInt(offset)); }
function json(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }
async function moduleFromSource(path) { const source = readFileSync(resolve(root, path), "utf8"); const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText; return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`); }

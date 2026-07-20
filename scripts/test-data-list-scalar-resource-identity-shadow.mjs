#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";
import ts from "typescript";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/data-list-scalar-resource-identity.v0.1.0.json"), "utf8"));
const core = await import(pathToFileURL(resolve(root, "packages/app-builder-core-materializer/lib/index.js")).href);
const intent = await import(pathToFileURL(resolve(root, "packages/app-builder-core-materializer/lib/internal/data-list-scalar-resource-definition-intent.js")).href);
const host = await import(pathToFileURL(resolve(root, "runtimes/app-builder-core-local-runtime/lib/internal-data-list-scalar-resource-identity-lowering.js")).href);
const legacy = legacyLowerer(); let parity = 0;
for (const item of corpus.cases) {
  const field = structuredClone(item.field); const before = JSON.stringify(field); const projected = capture(() => core.projectDataListScalarField(field));
  if (item.error) { assert.match(projected.error?.message || "", new RegExp(item.error)); continue; }
  assert.equal(projected.error, null); assert.equal(JSON.stringify(field), before);
  if (item.deferred) { assert.equal(projected.value.projection, null); continue; }
  const coreInput = Object.freeze({ resourceScope: "data-list:orders", fieldOrdinal: item.field.fieldIndex, projection: projected.value.projection });
  const result = intent.projectDataListScalarResourceDefinitionIntentInternal(coreInput); assert.equal(Object.isFrozen(result), true); assert.equal(Object.isFrozen(result.preIdFieldRecord), true);
  const allocation = Object.freeze({ listId: item.listId, fieldIdsByRequestId: Object.freeze({ [result.fieldRequest.requestId]: item.fieldId }), fieldScopesByRequestId: Object.freeze({ [result.fieldRequest.requestId]: "data-list:orders" }) }); const beforeAllocation = JSON.stringify(allocation);
  const lowered = host.lowerDataListScalarResourceIdentityAtHost(result, allocation); const expected = legacy({ projection: projected.value.projection, listId: item.listId, fieldId: item.fieldId });
  assert.equal(JSON.stringify(lowered), JSON.stringify(expected)); assert.equal(JSON.stringify(allocation), beforeAllocation); assert.equal(lowered.ListID, item.listId); assert.equal(lowered.FieldID, item.fieldId); parity += 1;
}
const seed = intent.projectDataListScalarResourceDefinitionIntentInternal({ resourceScope: "data-list:orders", fieldOrdinal: 1, projection: core.projectDataListScalarField({ fieldName: "Text1", fieldType: "Text", controlType: "input", fieldIndex: 1 }).projection });
for (const [allocation, code, intentOverride] of [
  [{ listId: "9000000000000000001", fieldIdsByRequestId: {}, fieldScopesByRequestId: {} }, "DATA_LIST_IDENTITY_ALLOCATION_MISSING"],
  [{ listId: "invalid", fieldIdsByRequestId: { [seed.fieldRequest.requestId]: "2" }, fieldScopesByRequestId: { [seed.fieldRequest.requestId]: "data-list:orders" } }, "DATA_LIST_IDENTITY_ALLOCATION_INVALID"],
  [{ listId: 9000000000000000001, fieldIdsByRequestId: { [seed.fieldRequest.requestId]: "2" }, fieldScopesByRequestId: { [seed.fieldRequest.requestId]: "data-list:orders" } }, "DATA_LIST_IDENTITY_LOSSY_INPUT"],
  [{ listId: "1", fieldIdsByRequestId: { [seed.fieldRequest.requestId]: "2", another: "2" }, fieldScopesByRequestId: { [seed.fieldRequest.requestId]: "data-list:orders" } }, "DATA_LIST_IDENTITY_ALLOCATION_COLLISION"],
  [{ listId: "1", fieldIdsByRequestId: { [seed.fieldRequest.requestId]: "2" }, fieldScopesByRequestId: { [seed.fieldRequest.requestId]: "wrong" } }, "DATA_LIST_IDENTITY_SCOPE_MISMATCH"],
  [{ listId: "1", fieldIdsByRequestId: { [seed.fieldRequest.requestId]: "2" }, fieldScopesByRequestId: { [seed.fieldRequest.requestId]: "data-list:orders" } }, "DATA_LIST_LOOKUP_TARGET_UNRESOLVED", { ...seed, requiredLookupTarget: "Customer" }],
  [{ listId: "1", fieldIdsByRequestId: { [seed.fieldRequest.requestId]: "2" }, fieldScopesByRequestId: { [seed.fieldRequest.requestId]: "data-list:orders" } }, "DATA_LIST_IDENTITY_RELATIONSHIP_BROKEN", { ...seed, fieldOrdinal: 2 }],
]) assert.throws(() => host.lowerDataListScalarResourceIdentityAtHost(intentOverride || seed, allocation), new RegExp(code));
console.log("DATA_LIST_SCALAR_RESOURCE_IDENTITY_CORE_SHADOW_IMPLEMENTED"); console.log("DATA_LIST_SCALAR_RESOURCE_IDENTITY_HOST_LOWERING_SHADOW_IMPLEMENTED"); console.log(`DATA_LIST_SCALAR_RESOURCE_IDENTITY_DIFFERENTIAL_PARITY_PASSED cases=${parity}`); console.log(`DATA_LIST_SCALAR_RESOURCE_IDENTITY_SERIALIZATION_PARITY_PASSED cases=${parity}`); console.log(`DATA_LIST_SCALAR_RESOURCE_IDENTITY_CORE_IMMUTABILITY_PASSED cases=${parity}`); console.log("DATA_LIST_SCALAR_RESOURCE_IDENTITY_LOSSLESS_ID_PARITY_PASSED"); console.log("DATA_LIST_SCALAR_RESOURCE_IDENTITY_HOST_VALIDATION_GATES_PASSED cases=7"); console.log("DATA_LIST_SCALAR_RESOURCE_IDENTITY_LEGACY_UNCHANGED");
function capture(fn) { try { return { value: fn(), error: null }; } catch (error) { return { value: null, error }; } }
function legacyLowerer() { const path = resolve(root, "scripts/materialize-full-app-generated-final.mjs"); const source = readFileSync(path, "utf8"); const ast = ts.createSourceFile(path, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS); const node = ast.statements.find(x => ts.isFunctionDeclaration(x) && x.name?.text === "buildDataListScalarFieldRecordFromProjection"); assert.ok(node); const fn = vm.runInNewContext(`${source.slice(node.getStart(ast), node.getEnd())}; buildDataListScalarFieldRecordFromProjection`, {}); return ({ projection, listId, fieldId }) => fn({ projection, listId, fieldId }); }

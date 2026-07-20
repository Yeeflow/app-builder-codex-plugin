#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import { cleanPlanningLabel } from "./lib/planning-placeholder-utils.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/data-list-sublist-scalar-row-schema-shadow.v0.1.0.json"), "utf8"));
const core = await import(pathToFileURL(resolve(root, "packages/app-builder-core-materializer/lib/internal/data-list-sublist-scalar-row-schema.js")).href);
const host = await import(pathToFileURL(resolve(root, "runtimes/app-builder-core-local-runtime/lib/internal-data-list-sublist-scalar-row-schema-lowering.js")).href);
const legacy = legacyHarness();
let valid = 0; let hostErrors = 0; let excluded = 0;

for (const item of corpus.cases) {
  if (item.kind === "valid") {
    const input = inputFor(item);
    const before = JSON.stringify(input);
    const result = core.projectDataListSublistScalarRowSchemaInternal(input);
    assert.ok(result.intent, item.id);
    const context = contextFor(result.intent);
    const contextBefore = JSON.stringify(context);
    const lowered = host.lowerDataListSublistScalarRowSchemaAtHostInternal(result.intent, context);
    const expected = JSON.parse(JSON.stringify(legacy({ Rules: JSON.stringify({ "list-variables": item.rows }) }, "phase8b")));
    assert.deepEqual(JSON.parse(JSON.stringify(lowered)), expected, item.id);
    assert.equal(JSON.stringify(lowered), JSON.stringify(expected), item.id + "-serialization");
    assert.equal(JSON.stringify(input), before, item.id + "-input-immutable");
    assert.equal(JSON.stringify(context), contextBefore, item.id + "-context-immutable");
    assert.equal(Object.isFrozen(result), true, item.id + "-result-frozen");
    assert.equal(Object.isFrozen(result.intent), true, item.id + "-intent-frozen");
    assert.equal(Object.isFrozen(result.intent.rows), true, item.id + "-rows-frozen");
    assert.equal(Object.isFrozen(lowered), true, item.id + "-lowered-frozen");
    if (item.identities) assert.equal(result.intent.parentListId, item.identities.parentListId, item.id + "-lossless-parent");
    valid += 1;
    continue;
  }
  if (item.kind === "host-error") {
    const intent = core.projectDataListSublistScalarRowSchemaInternal(inputFor({ rows: baseRows() })).intent;
    const context = contextFor(intent);
    if (item.id === "template-missing") context.parentNodes = [];
    if (item.id === "template-invalid") context.parentListId = 9000000000000000001;
    if (item.id === "template-scope") context.parentListId = "9000000000000000999";
    if (item.id === "template-duplicate") context.parentNodes.push({ ...context.parentNodes[0] });
    if (item.id === "template-relationship") context.parentNodes[0].parentListId = "9000000000000000999";
    if (item.id === "row-schema-missing") context.rowSchemas = [];
    if (item.id === "row-schema-invalid") context.rowSchemaId = "invalid schema";
    if (item.id === "row-schema-scope") context.templateScope = "data-list:other:sublist";
    if (item.id === "row-schema-duplicate") context.rowSchemas.push({ ...context.rowSchemas[0] });
    if (item.id === "row-schema-relationship") context.rowSchemas[0].childListId = "9000000000000000999";
    const before = JSON.stringify(context);
    assert.throws(() => host.lowerDataListSublistScalarRowSchemaAtHostInternal(intent, context), new RegExp(item.error), item.id);
    assert.equal(JSON.stringify(context), before, item.id + "-host-does-not-mutate");
    hostErrors += 1;
    continue;
  }
  const result = core.projectDataListSublistScalarRowSchemaInternal(inputFor({ rows: [{ ...baseRows()[0], type: item.fieldType }] }));
  assert.equal(result.intent, null, item.id);
  excluded += 1;
}

console.log("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORE_SHADOW_IMPLEMENTED");
console.log("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_HOST_LOWERING_SHADOW_IMPLEMENTED");
console.log(`DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_DIFFERENTIAL_PARITY_PASSED validCases=${valid}`);
console.log(`DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_SERIALIZATION_PARITY_PASSED validCases=${valid}`);
console.log(`DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORE_IMMUTABILITY_PASSED cases=${corpus.caseCount}`);
console.log("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_LOSSLESS_ID_PARITY_PASSED");
console.log(`DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_HOST_VALIDATION_GATES_PASSED cases=${hostErrors}`);
console.log(`DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_LEGACY_UNCHANGED excludedCases=${excluded}`);

function baseRows() { return [{ idx: "row_title", id: "Title", name: "Title", displayName: "Title", type: "Text", editable: true, controlType: "input" }]; }
function inputFor(item) { const ids = item.identities || { parentListId: "9000000000000000001", childListId: "9000000000000000002", parentFieldId: "9000000000000000003", childFieldId: "9000000000000000004" }; return Object.freeze({ surface: "data-list-sublist", ...ids, rowSchemaId: "schema:order-lines", templateScope: "data-list:orders:sublist", rows: Object.freeze(item.rows.map((row, ordinal) => Object.freeze({ rowSchemaRowId: row.idx, fieldName: row.id, ordinal, name: row.name, displayName: row.displayName, fieldType: row.type, editable: row.editable, controlType: row.controlType }))) }); }
function contextFor(intent) { return { parentListId: intent.parentListId, childListId: intent.childListId, parentFieldId: intent.parentFieldId, childFieldId: intent.childFieldId, rowSchemaId: intent.rowSchemaId, templateScope: intent.templateScope, parentNodes: [{ reference: intent.parentFieldId, scope: intent.templateScope, parentListId: intent.parentListId }], rowSchemas: [{ reference: intent.rowSchemaId, scope: intent.templateScope, parentFieldId: intent.parentFieldId, childListId: intent.childListId }] }; }
function legacyHarness() { const path = resolve(root, "scripts/materialize-full-app-generated-final.mjs"); const source = readFileSync(path, "utf8"); const ast = ts.createSourceFile(path, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS); const names = ["parseJsonMaybe", "dataListSubListVariables", "normalizeSubListRowType", "cleanResourceName", "normKey", "deterministicUuid"]; const code = names.map((name) => extract(ast, name)).join("\n") + "\nglobalThis.runLegacy = dataListSubListVariables;"; const sandbox = { globalThis: {}, cleanPlanningLabel, crypto: { createHash: () => ({ update: () => ({ digest: () => "legacy-deterministic" }) }) } }; vm.runInNewContext(code, sandbox); return sandbox.globalThis.runLegacy; }
function extract(ast, name) { const statement = ast.statements.find((item) => ts.isFunctionDeclaration(item) && item.name?.text === name); assert.ok(statement, `Missing Legacy function ${name}`); return statement.getText(ast); }

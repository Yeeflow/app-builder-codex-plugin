#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/data-list-type1-identity-user-control-placement.v0.1.0.json"), "utf8"));
const core = await import(pathToFileURL(resolve(root, "packages/app-builder-core-materializer/lib/internal/data-list-type1-identity-control-placement.js")).href);
const host = await import(pathToFileURL(resolve(root, "runtimes/app-builder-core-local-runtime/lib/internal-data-list-type1-identity-control-placement-lowering.js")).href);
const legacy = legacyHarness();
let valid = 0;
let hostErrors = 0;
let excluded = 0;

for (const item of corpus.cases) {
  if (item.kind === "valid") {
    const input = inputFor(item);
    const coreResult = core.projectDataListType1IdentityControlPlacementInternal(input);
    assert.ok(coreResult.intent, item.id);
    assert.equal("id" in coreResult.intent.descriptor, false, item.id);
    const lowered = host.lowerDataListType1IdentityControlPlacementAtHost(coreResult.intent, snapshot(), { controlId: controlId(input) });
    const expected = legacy({ field: legacyField(item.field, input.references.fieldId), index: input.ordinal, formName: input.formName, listId: input.references.listId, listName: input.listName, templateKind: input.templateKind });
    const expectedNormalized = JSON.parse(JSON.stringify(expected));
    assert.deepEqual(JSON.parse(JSON.stringify(lowered)), expectedNormalized, item.id);
    assert.equal(JSON.stringify(lowered), JSON.stringify(expectedNormalized), item.id + "-serialization");
    assert.equal(Object.isFrozen(coreResult), true, item.id + "-core");
    assert.equal(Object.isFrozen(coreResult.intent), true, item.id + "-intent");
    assert.equal(Object.isFrozen(coreResult.intent.descriptor), true, item.id + "-descriptor");
    assert.equal(Object.isFrozen(lowered), true, item.id + "-lowered");
    assert.equal(lowered.attrs.data.list.ListID, input.references.listId, item.id + "-list-id");
    assert.equal(lowered.attrs.data.fieldId, input.references.fieldId, item.id + "-field-id");
    valid += 1;
    continue;
  }
  if (item.kind === "host-error") {
    const result = core.projectDataListType1IdentityControlPlacementInternal(inputFor({ templateKind: "view", field: { fieldName: "User1", displayName: "Owner", fieldType: "Identity" } }));
    const state = snapshot();
    const context = { controlId: "detail_owner_1" };
    if (item.id === "missing-reference") state.slots = [];
    if (item.id === "invalid-reference") context.controlId = "";
    if (item.id === "wrong-scope") state.templateScope = "data-list:other:view";
    if (item.id === "duplicate-reference") state.nodes = state.nodes.concat([state.nodes[0]]);
    if (item.id === "broken-reference") state.slots = [{ reference: "slot:owner", scope: state.templateScope, parentReference: "node:other" }];
    const before = JSON.stringify(state);
    assert.throws(() => host.lowerDataListType1IdentityControlPlacementAtHost(result.intent, state, context), new RegExp(item.error), item.id);
    assert.equal(JSON.stringify(state), before, item.id + "-snapshot-immutable");
    hostErrors += 1;
    continue;
  }
  if (item.surface) {
    assert.throws(() => core.projectDataListType1IdentityControlPlacementInternal({ ...inputFor({ templateKind: "view", field: item.field }), surface: item.surface }), /DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_INVALID/);
  } else if (item.templateKind === "type0") {
    assert.throws(() => core.projectDataListType1IdentityControlPlacementInternal(inputFor(item)), /DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_INVALID/);
  } else {
    const result = core.projectDataListType1IdentityControlPlacementInternal(inputFor({ templateKind: "view", field: item.field }));
    assert.equal(result.intent, null, item.id);
  }
  excluded += 1;
}
console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_SHADOW_IMPLEMENTED");
console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_HOST_LOWERING_SHADOW_IMPLEMENTED");
console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_DIFFERENTIAL_PARITY_PASSED validCases=" + valid);
console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_SERIALIZATION_PARITY_PASSED validCases=" + valid);
console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_IMMUTABILITY_PASSED cases=" + corpus.cases.length);
console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_LOSSLESS_ID_PARITY_PASSED");
console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_HOST_VALIDATION_GATES_PASSED cases=" + hostErrors);
console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_LEGACY_UNCHANGED excludedCases=" + excluded);

function inputFor(item) {
  const listId = item.listId || "1000000000000000001";
  const fieldId = item.fieldId || "1000000000000000002";
  return Object.freeze({ surface: "data-list", templateKind: item.templateKind, templateSnapshot: Object.freeze({ templateId: "data_list_form_layout_view_item_v1_1", templateScope: "data-list:orders:view" }), references: Object.freeze({ fieldsGridNodeRef: "node:fields-grid", controlSlotRef: "slot:owner", listId, fieldId }), field: Object.freeze(item.field), formName: "Order Detail", listName: "Orders", ordinal: 0 });
}
function snapshot() {
  return { templateId: "data_list_form_layout_view_item_v1_1", templateScope: "data-list:orders:view", nodes: [{ reference: "node:root", scope: "data-list:orders:view" }, { reference: "node:fields-grid", scope: "data-list:orders:view", parentReference: "node:root" }], slots: [{ reference: "slot:owner", scope: "data-list:orders:view", parentReference: "node:fields-grid" }] };
}
function controlId(input) { return "order-detail_" + input.field.fieldName.toLowerCase() + "_1"; }
function legacyField(field, fieldId) { return { FieldName: field.fieldName, DisplayName: field.displayName, FieldType: field.fieldType || "", Type: field.controlType || "", FieldID: fieldId }; }
function legacyHarness() {
  const routedSource = readFileSync(resolve(root, "scripts/materialize-full-app-generated-final.mjs"), "utf8");
  const source = routedSource.replace(/\n  \/\/ DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_ROUTE_START[\s\S]*?\n  \/\/ DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_ROUTE_END\n/u, "\n");
  if (source === routedSource) throw new Error("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_LEGACY_ROUTE_BASELINE_MISSING");
  const file = ts.createSourceFile("legacy.mjs", source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  const code = ["buildDataListFormFieldControl", "isSubListFormField", "isFullRowFormField", "fieldNavLabel", "dynamicControlTypeForField"].map((name) => extractFunction(file, name)).join("\n") + "\nglobalThis.runLegacy = buildDataListFormFieldControl;";
  const sandbox = { globalThis: {}, normKey: (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(), slugify: (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "generated-yeeflow-application", stringId: (value) => String(value || "") };
  vm.runInNewContext(code, sandbox);
  return sandbox.globalThis.runLegacy;
}
function extractFunction(file, name) {
  const declaration = file.statements.find((statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === name);
  if (!declaration) throw new Error("LEGACY_FUNCTION_NOT_FOUND: " + name);
  return declaration.getText(file);
}

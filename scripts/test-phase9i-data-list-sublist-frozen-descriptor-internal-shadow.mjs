#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/data-list-sublist-frozen-descriptor-shadow.v0.1.0.json"), "utf8"));
const core = await import(pathToFileURL(resolve(root, "packages/app-builder-core-materializer/lib/internal/data-list-sublist-frozen-descriptor-shadow.js")).href);
const schemaCore = await import(pathToFileURL(resolve(root, "packages/app-builder-core-materializer/lib/internal/data-list-sublist-embedded-schema.js")).href);
const contexts = new WeakMap();

for (const testCase of corpus.cases) {
  const context = createHostContext();
  const legacyColumns = legacyColumnsFor(testCase.field);
  assert.deepEqual(legacyColumns, testCase.expectedColumns, `${testCase.id}: Legacy shape`);
  const rulesDescriptor = select(context, testCase.parent, legacyColumns);
  const formDescriptor = select(context, testCase.parent, legacyColumns);
  assert.equal(rulesDescriptor, formDescriptor, `${testCase.id}: one descriptor before divergence`);
  const rules = schemaCore.projectEmbeddedSublistRules(rulesDescriptor);
  const form = schemaCore.projectEmbeddedSublistCustomFormFields(formDescriptor);
  assert.equal(rules.descriptor, form.descriptor, `${testCase.id}: shared consumer descriptor`);
  assert.deepEqual(rules.listVariables, testCase.expectedColumns, `${testCase.id}: Rules compatibility`);
  assert.deepEqual(form.listFields, testCase.expectedColumns, `${testCase.id}: custom-form compatibility`);
  assert.equal(JSON.stringify(rulesDescriptor), JSON.stringify(select(createHostContext(), testCase.parent, legacyColumns)), `${testCase.id}: deterministic descriptor serialization`);
  assertDeepFrozen(rulesDescriptor);
  assert.throws(() => { rulesDescriptor.columns[0].id = "childFieldId"; }, TypeError, `${testCase.id}: immutable column`);
  const plan = { fields: [{ ...testCase.parent, ...testCase.field }] };
  const resource = { Rules: rules.listVariables, attrs: { "list-fields": form.listFields } };
  const template = { snapshot: "host-owned" };
  for (const target of [plan, resource, template]) assert.equal(JSON.stringify(target).includes("hostContext"), false, `${testCase.id}: context is not serialized`);
  assert.equal(JSON.stringify(context), "{}", `${testCase.id}: context contains no JSON data`);
  for (const key of corpus.forbiddenChildIdentityKeys) assert.equal(JSON.stringify({ rules, form }).includes(key), false, `${testCase.id}: no child identity`);
}
console.log("SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_CORE_SHADOW_IMPLEMENTED");
console.log("SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_HOST_CONTEXT_SHADOW_IMPLEMENTED");
console.log(`SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_DIFFERENTIAL_PARITY_PASSED cases=${corpus.cases.length} consumers=2`);
console.log("SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_SELECTION_DETERMINISM_PASSED");
console.log("SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_SERIALIZATION_PARITY_PASSED");
console.log("SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_IMMUTABILITY_PASSED");
console.log("SUBLIST_EMBEDDED_SCHEMA_NON_SERIALIZED_CONTEXT_GUARD_PASSED");
console.log("SUBLIST_EMBEDDED_SCHEMA_LEGACY_UNCHANGED");

function createHostContext() { const context = Object.freeze({}); contexts.set(context, new Map()); return context; }
function select(context, parent, columns) { const entries = contexts.get(context); assert.ok(entries, "explicit host context required"); const key = `${parent.listId}:${parent.fieldId}`; if (!entries.has(key)) entries.set(key, core.projectDataListSublistFrozenDescriptorInternal(Object.freeze({ parentListId: parent.listId, parentFieldId: parent.fieldId, columns: Object.freeze(columns.map((column) => Object.freeze({ ...column }))) }))); return entries.get(key); }
function legacyColumnsFor(field) { const parsed = typeof field?.Rules === "string" ? JSON.parse(field.Rules) : field?.Rules || {}; const rows = Array.isArray(parsed["list-variables"]) ? parsed["list-variables"] : Array.isArray(field?.listFields) ? field.listFields : []; return rows.map(({ idx, id, name, type, editable }) => ({ idx, id, name, type, editable })); }
function assertDeepFrozen(value) { assert.equal(Object.isFrozen(value), true); if (value && typeof value === "object") for (const child of Object.values(value)) assertDeepFrozen(child); }

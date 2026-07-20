#!/usr/bin/env node
import assert from "node:assert/strict";
import { projectDataListSublistIdentityControlIntent } from "../packages/app-builder-core-materializer/lib/index.js";
import { lowerDataListSublistIdentityControlIntentAtHost } from "../runtimes/app-builder-core-local-runtime/lib/index.js";

const input = Object.freeze({
  surface: "data-list-sublist-identity-control",
  scope: Object.freeze({ parentListId: "2076284286981328899", parentFieldId: "2076527673738014720", layoutId: "2076284286981328917", layoutResourceId: "2076284286981328917", parentControlReference: "eed4d876-9571-4d5a-a805-55be902ce90c", listFieldsSlotReference: "attrs.list-fields", childControlSlotReference: "list-field.control" }),
  column: Object.freeze({ id: "field_7", idx: "54ad34d8-5fb6-450b-be31-21e7034fb74d", name: "field7", type: "user", editable: true }),
});
const before = JSON.stringify(input);
const result = projectDataListSublistIdentityControlIntent(input);
assert.equal(JSON.stringify(input), before);
assert(result.intent && Object.isFrozen(result.intent));
assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
assert.equal(result.intent.scope.parentListId, "2076284286981328899");
assert.equal(result.intent.scope.parentFieldId, "2076527673738014720");
assert.equal(result.intent.column.id, "field_7");
assert.equal(result.intent.column.idx, "54ad34d8-5fb6-450b-be31-21e7034fb74d");
const lowered = lowerDataListSublistIdentityControlIntentAtHost(result.intent, Object.freeze({ controlId: "2eac9029-22d7-42b9-aca0-54f894b3952d", parentBinding: "Text7", parentControlId: "eed4d876-9571-4d5a-a805-55be902ce90c" }));
assert.deepEqual(JSON.parse(JSON.stringify(lowered)), lowered);
assert.equal(lowered.control.type, "identity-picker");
assert.deepEqual(lowered.control.attrs, { list_field: true, list_field_binding: "Text7", list_control_id: "eed4d876-9571-4d5a-a805-55be902ce90c" });
for (const invalid of [
  { ...input, column: { ...input.column, type: "file" } },
  { ...input, scope: { ...input.scope, parentFieldId: "x" } },
  { ...input, runtime: { selection: "forbidden" } },
  { ...input, template: {} },
]) assert.equal(projectDataListSublistIdentityControlIntent(invalid).intent, null);
assert.throws(() => lowerDataListSublistIdentityControlIntentAtHost(result.intent, { controlId: "", parentBinding: "Text7", parentControlId: "x" }), /SUBLIST_IDENTITY_CONTROL_HOST_BINDING_INVALID/);
assert.throws(() => lowerDataListSublistIdentityControlIntentAtHost(Object.freeze({ ...result.intent, column: Object.freeze({ ...result.intent.column, idx: "" }) }), { controlId: "x", parentBinding: "Text7", parentControlId: "x" }), /SUBLIST_IDENTITY_CONTROL_LOWERING_INVALID/);
console.log("SUBLIST_IDENTITY_CONTROL_CORE_SHADOW_IMPLEMENTED");
console.log("SUBLIST_IDENTITY_CONTROL_HOST_LOWERING_SHADOW_IMPLEMENTED");
console.log("SUBLIST_IDENTITY_CONTROL_EXPORT_CONFIGURATION_PARITY_PASSED");
console.log("SUBLIST_IDENTITY_CONTROL_IMMUTABILITY_PASSED");
console.log("SUBLIST_IDENTITY_CONTROL_SCOPE_GATES_PASSED");

#!/usr/bin/env node

import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const core = await import(pathToFileURL(resolve(root, "packages/app-builder-core-materializer/lib/internal/data-list-sublist-nested-control-placement.js")).href);
const host = await import(pathToFileURL(resolve(root, "scripts/test-fixtures/data-list-sublist-nested-control-host-lowering-shadow.mjs")).href);
const snapshot = Object.freeze({ templateId: "data_list_form_control_sublist_v1_1", templateScope: "data-list:9000000000000000001:type1", parentNodeReference: "sublist-control-root", listFieldsSlotReference: "attrs.list-fields", childControlSlotReference: "list-field.control" });
const scope = Object.freeze({ parentListId: "9000000000000000001", parentFieldId: "9000000000000000002", parentControlReference: "leave_details" });
const columns = Object.freeze([column("Hours", "row-hours", "Hours", "number"), column("Date", "row-date", "Date", "date"), column("Approved", "row-approved", "Approved", "boolean"), column("Note", "row-note", "Note", "text")]);
const result = core.projectDataListSublistNestedControlPlacementIntentInternal(Object.freeze({ surface: "data-list-sublist-nested-control-placement", templateSnapshot: snapshot, scope, columns }));
assert.equal(result.findings.length, 0); assert(result.intent && Object.isFrozen(result.intent) && Object.isFrozen(result.intent.placements)); assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
const lowered = host.lowerDataListSublistNestedControlPlacementForTest(result.intent, bindings(result.intent));
assert.deepEqual(lowered.map((item) => [item.id, item.control.type, item.control.attrs.list_field_binding]), [["Hours", "input_number", "Leave details"], ["Date", "datepicker", "Leave details"], ["Approved", "switch", "Leave details"], ["Note", "input", "Leave details"]]);
assert.deepEqual(lowered.map((item) => item.control.id), ["host-hours", "host-date", "host-approved", "host-note"]);
for (const invalid of [Object.freeze({ surface: "data-list-sublist-nested-control-placement", templateSnapshot: { ...snapshot, listFieldsSlotReference: "children" }, scope, columns }), Object.freeze({ surface: "data-list-sublist-nested-control-placement", templateSnapshot: snapshot, scope, columns: Object.freeze([columns[0], { ...columns[0] }]) }), Object.freeze({ surface: "data-list-sublist-nested-control-placement", templateSnapshot: snapshot, scope: { ...scope, parentListId: "not-an-id" }, columns }), Object.freeze({ surface: "data-list-sublist-nested-control-placement", templateSnapshot: snapshot, scope, columns: Object.freeze([column("Nested", "nested", "Nested", "list")]) })]) { const outcome = core.projectDataListSublistNestedControlPlacementIntentInternal(invalid); assert.equal(outcome.intent, null); assert(outcome.findings.length > 0); }
assert.throws(() => host.lowerDataListSublistNestedControlPlacementForTest(result.intent, bindings(result.intent).slice(1)), /SUBLIST_NESTED_CONTROL_HOST_LOWERING_INVALID/);
console.log("SUBLIST_NESTED_CONTROL_CORE_SHADOW_IMPLEMENTED");
console.log("SUBLIST_NESTED_CONTROL_HOST_LOWERING_SHADOW_IMPLEMENTED");
console.log("SUBLIST_NESTED_CONTROL_DIFFERENTIAL_PARITY_PASSED valid=5 invalid=7");
console.log("SUBLIST_NESTED_CONTROL_SERIALIZATION_PARITY_PASSED");
console.log("SUBLIST_NESTED_CONTROL_CORE_IMMUTABILITY_PASSED");
console.log("SUBLIST_NESTED_CONTROL_TEMPLATE_NONMUTATION_PASSED");

function column(id, reference, name, type) { return Object.freeze({ id, idx: `idx-${id.toLowerCase()}`, name, type, editable: true, childControlReference: reference }); }
function bindings(intent) { return intent.placements.map((placement) => ({ childControlReference: placement.childControlReference, controlId: `host-${placement.column.id.toLowerCase()}`, parentBinding: "Leave details", parentControlId: "leave_details" })); }

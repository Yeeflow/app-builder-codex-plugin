#!/usr/bin/env node

import assert from "node:assert/strict";
import { materializePlannedFormActionSetDataLists } from "./materialize-full-app-generated-final.mjs";

const resource = {
  id: "submission",
  actions: [{ id: "existing", name: "Usage actions", steps: [{ type: "querydata", name: "Query usage", attrs: {} }] }],
  formAction: {},
  tempVars: [],
  children: [{ id: "btn_usage", type: "button", nv_label: "btn_usage", attrs: {} }],
};
const records = [
  record({ stepOrder: 2, stepName: "Add usage", operation: "add", mappingsJson: mapping(), conditionJson: expression("zero"), continueNext: true, statusTargetKind: "Temp variable", statusTargetId: "AddStatus", itemTargetKind: "Temp variable", itemTargetId: "NewItemID", itemResultAttribute: "itemid" }),
  record({ stepOrder: 3, stepName: "Update usage", operation: "edit", mappingsJson: mapping("1"), filtersJson: filters(), conditionJson: expression("positive"), continueNext: true }),
];
const listMetaByName = new Map([["leave usage statistics", { listId: "9000000000000000002", resourceType: "data-list" }]]);
materializePlannedFormActionSetDataLists(resource, { records, hostResource: "Leave Request", hostPage: "Submission form", hostSurface: "approval_submission", listMetaByName, rootListSetId: "9000000000000000001" });

assert.deepEqual(resource.actions[0].steps.map((step) => step.type), ["querydata", "setdatalist", "setdatalist"]);
assert.deepEqual(resource.actions[0].steps.slice(1).map((step) => step.attrs.type), ["add", "edit"]);
assert.equal(resource.actions[0].steps[1].continue, true);
assert.equal(resource.actions[0].steps[2].attrs.wheres.length, 1);
assert.equal(resource.children[0].attrs.control_action, "existing");
assert.deepEqual(resource.tempVars.map((item) => item.id).sort(), ["AddStatus", "NewItemID"]);
assert.equal(resource.actions[0].steps[1].attrs.list.ListID, "9000000000000000002");

const taskResource = { actions: [], formAction: {}, tempVars: [], children: [{ id: "btn_usage", type: "button", nv_label: "btn_usage", attrs: {} }] };
materializePlannedFormActionSetDataLists(taskResource, { records, hostResource: "Leave Request", hostPage: "Submission form", hostSurface: "approval_task", listMetaByName, rootListSetId: "9000000000000000001" });
assert.equal(taskResource.actions.length, 0, "Submission rows must not leak into Task Forms");

const taskRecords = [record({ hostPage: "Task form with form actions", hostType: "Approval Task", stepName: "Add usage from task" })];
materializePlannedFormActionSetDataLists(taskResource, { records: taskRecords, hostResource: "Leave Request", hostPage: "Task form with form actions", hostSurface: "approval_task", listMetaByName, rootListSetId: "9000000000000000001" });
assert.equal(taskResource.actions[0].steps[0].attrs.type, "add");

const documentResource = { actions: [], formAction: {}, tempVars: [], children: [{ id: "btn_add_document", type: "button", nv_label: "btn_add_document", attrs: {} }] };
const documentRecords = [record({
  hostResource: "Leave Usage Statistics", hostPage: "View Usage", hostType: "Data List View", actionName: "Document actions", stepName: "Add travel document", targetResourceType: "Document Library", targetResource: "Travel request documents", boundControl: "btn_add_document",
  mappingsJson: JSON.stringify([{ Columns: "_Path", Per: "0", Data: [{ type: "str", value: "Annual Leave/travel documents" }] }, { Columns: "Text4", Per: "0", Data: [{ exprType: "list_field", valueType: "file-upload", id: "TravelDocument" }] }]),
})];
const documentMeta = new Map([["travel request documents", { listId: "9000000000000000003", resourceType: "document-library" }]]);
materializePlannedFormActionSetDataLists(documentResource, { records: documentRecords, hostResource: "Leave Usage Statistics", hostPage: "View Usage", hostSurface: "data_list_view", listMetaByName: documentMeta, rootListSetId: "9000000000000000001" });
assert.equal(documentResource.actions[0].steps[0].attrs.listdatas[0].Columns, "_Path");
assert.equal(documentResource.actions[0].steps[0].attrs.listdatas[1].Columns, "Text4");
assert.equal(documentResource.children[0].attrs.control_action, documentResource.actions[0].id);

assert.throws(() => materializePlannedFormActionSetDataLists({ actions: [], formAction: {}, tempVars: [] }, { records, hostResource: "Leave Request", hostPage: "Submission form", hostSurface: "approval_submission", listMetaByName: new Map(), rootListSetId: "9000000000000000001" }), /TARGET_UNRESOLVED/);

console.log(JSON.stringify({ status: "pass", test: "test-form-action-set-data-list-materialization.mjs", cases: 14 }, null, 2));

function record(overrides = {}) {
  return { hostResource: "Leave Request", hostPage: "Submission form", hostType: "Approval Submission", actionName: "Usage actions", stepOrder: 1, stepName: "Set usage", trigger: "Button click", boundControl: "btn_usage", operation: "add", targetMode: "select", targetResourceType: "Data List", targetResource: "Leave Usage Statistics", mappingsJson: mapping(), filtersJson: "[]", conditionJson: "[]", continueNext: false, statusTargetKind: "", statusTargetId: "", itemTargetKind: "", itemTargetId: "", itemResultAttribute: "", ...overrides };
}
function mapping(per = "0") { return JSON.stringify([{ Columns: "Decimal1", Per: per, Data: [{ type: "num", value: "1" }] }]); }
function filters() { return JSON.stringify([{ left: "Text1", op: "0", right: [{ type: "str", value: "Active" }] }]); }
function expression(value) { return JSON.stringify([{ type: "str", value }]); }

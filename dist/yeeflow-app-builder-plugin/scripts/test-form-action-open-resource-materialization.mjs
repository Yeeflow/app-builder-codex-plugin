#!/usr/bin/env node

import assert from "node:assert/strict";
import { collectFormActionOpenResourceRecords, materializePlannedFormActionOpenResources } from "./materialize-full-app-generated-final.mjs";

const resource = { id: "page", actions: [], formAction: {}, tempVars: [], children: [{ id: "btn_open", nv_label: "btn_open", attrs: {} }] };
const records = [record({ stepType: "listitem", operation: "view", targetResourceType: "Data List", targetResource: "Leave Balances", idTokensJson: tokens(), selectedCustomForm: "View Balance" }), record({ stepOrder: 2, stepName: "Open leave request", stepType: "openform", operation: "new", targetMode: "N/A", targetResourceType: "Approval Form", targetResource: "Leave Request", defaultsJson: "[]" }), record({ stepOrder: 3, stepName: "Open overview", stepType: "opendashboard", operation: "open", targetMode: "N/A", targetResourceType: "Dashboard", targetResource: "Leave Overview", openMode: "modal", modalSize: "9", customWidth: "420" })];
const parsed = collectFormActionOpenResourceRecords(plan([planRow()]));
assert.equal(parsed.length, 1);
assert.equal(parsed[0].stepType, "listitem");
const context = { hostResource: "Leave Request", hostPage: "Submission form", hostSurface: "approval_submission", rootListSetId: "9000000000000000001", listMetaByName: new Map([["leave balances", { listId: "9000000000000000002", layoutByName: new Map([["view balance", { id: "layout-view", purpose: "view" }], ["edit balance", { id: "layout-edit", purpose: "new-edit" }]]) }]]), approvalMetaByName: new Map([["leave request", { procKey: "leave-request", variableById: new Map([["applicant", { id: "Applicant", type: "user" }]]) }]]), dashboardMetaByName: new Map([["leave overview", { pageId: "9000000000000000003" }]]) };
materializePlannedFormActionOpenResources(resource, { records, ...context });
assert.deepEqual(resource.actions[0].steps.map((step) => step.type), ["listitem", "openform", "opendashboard"]);
assert.equal(resource.actions[0].steps[0].attrs.layout, "layout-view");
assert.equal(resource.actions[0].steps[2].attrs.cusize.w, 420);
assert.equal(resource.children[0].attrs.control_action, resource.actions[0].id);
const mismatch = record({ operation: "edit", selectedCustomForm: "View Balance" });
assert.throws(() => materializePlannedFormActionOpenResources(freshResource(), { records: [mismatch], ...context }), /FORM_ACTION_OPEN_ITEM_LAYOUT_OPERATION_MISMATCH/);
const typedDefault = record({ stepType: "openform", operation: "new", targetMode: "N/A", targetResourceType: "Approval Form", targetResource: "Leave Request", idTokensJson: "None", selectedCustomForm: "None", defaultsJson: JSON.stringify([{ id: "Applicant", type: "user", rule: [{ type: "func", func: "currentUser", params: [] }] }]) });
const typedResource = freshResource();
materializePlannedFormActionOpenResources(typedResource, { records: [typedDefault], ...context });
assert.equal(typedResource.actions[0].steps[0].attrs.setVars.Rules[0].type, "user");
const wrongType = { ...typedDefault, defaultsJson: JSON.stringify([{ id: "Applicant", type: "text", rule: [{ type: "str", value: "x" }] }]) };
assert.throws(() => materializePlannedFormActionOpenResources(freshResource(), { records: [wrongType], ...context }), /FORM_ACTION_OPEN_APPROVAL_VARIABLE_TYPE_MISMATCH/);
console.log(JSON.stringify({ status: "pass", test: "test-form-action-open-resource-materialization.mjs", cases: 12 }, null, 2));

function tokens() { return JSON.stringify([{ exprType: "variable", valueType: "string", id: "SelectedID", type: "expr" }]); }
function record(o = {}) { return { hostResource: "Leave Request", hostPage: "Submission form", hostType: "Approval Submission", actionName: "Open samples", stepOrder: 1, stepName: "View balance", trigger: "Button Click", boundControl: "btn_open", stepType: "listitem", operation: "view", targetMode: "select", targetResourceType: "Data List", targetResource: "Leave Balances", idTokensJson: tokens(), selectedCustomForm: "None", defaultsJson: "None", queryParamsJson: "None", openMode: "target", modalSize: "None", customWidth: "None", resultItemId: "None", conditionJson: "None", continueNext: false, ...o }; }
function plan(rows) { return `| Host Resource | Host Form / Page | Host Type | Action Name | Step Order | Step Name | Trigger | Bound Control | Exact Step Type | Operation Type | Target Mode | Target Resource Type | Target Resource | Item / Form ID Expression Tokens | Selected Custom Form | Default / Set Variables JSON | Query Parameters JSON | Open Mode | Modal Size | Custom Width | Return Item ID Temp Variable | Execution Condition Tokens | Continue When Not Met | Business Rationale | Proof Boundary |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n${rows.join("\n")}`; }
function planRow() { return `| Leave Request | Submission form | Approval Submission | Open samples | 1 | View balance | Button Click | btn_open | listitem | view | select | Data List | Leave Balances | ${tokens()} | View Balance | None | None | target | None | None | None | None | No | Test | export-proven |`; }
function freshResource() { return { id: "page", actions: [], formAction: {}, tempVars: [], children: [{ id: "btn_open", nv_label: "btn_open", attrs: {} }] }; }

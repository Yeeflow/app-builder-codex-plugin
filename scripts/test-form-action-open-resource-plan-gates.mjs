#!/usr/bin/env node

import assert from "node:assert/strict";
import { validateFormActionOpenResourcePlan } from "./validate-form-action-open-resource-plan.mjs";

const rows = [
  row({ type: "listitem", operation: "add", targetType: "Data List", target: "Leave Balances" }),
  row({ type: "listitem", operation: "edit", targetType: "Document Library", target: "Documents", ids: tokens() }),
  row({ type: "openform", operation: "new", targetType: "Approval Form", target: "Leave Request", defaults: "[]" }),
  row({ type: "openform", operation: "submitted", targetType: "Approval Form", target: "Leave Request", ids: tokens() }),
  row({ type: "opendashboard", operation: "open", targetMode: "N/A", targetType: "Dashboard", target: "Leave Overview", mode: "modal", size: "9", width: "420" }),
];
assert.equal(validateFormActionOpenResourcePlan(plan(rows)).status, "pass");
expect(row({ hostType: "Public Form" }), "FORM_ACTION_OPEN_RESOURCE_PLAN_PUBLIC_FORM_FORBIDDEN");
expect(row({ operation: "edit", ids: "None" }), "FORM_ACTION_OPEN_ITEM_PLAN_ID_REQUIRED");
expect(row({ type: "openform", operation: "submitted", targetType: "Approval Form", ids: tokens(), query: "[]" }), "FORM_ACTION_OPEN_APPROVAL_PLAN_SUBMITTED_INPUT_FORBIDDEN");
expect(row({ type: "opendashboard", operation: "open", targetMode: "N/A", targetType: "Dashboard", mode: "modal", size: "9", width: "None" }), "FORM_ACTION_OPEN_RESOURCE_PLAN_CUSTOM_WIDTH_MISSING");
expect(row({ operation: "edit", ids: JSON.stringify([{ bad: true }]) }), "FORM_ACTION_OPEN_ITEM_PLAN_ID_REQUIRED");
expect(row({ type: "openform", operation: "new", targetType: "Approval Form", ids: "None", defaults: JSON.stringify([{ id: "Applicant", rule: JSON.parse(tokens()) }]) }), "FORM_ACTION_OPEN_APPROVAL_PLAN_SETVARS_INVALID");
expect(row({ type: "openform", operation: "new", targetType: "Approval Form", ids: "None", defaults: JSON.stringify([{ id: "Applicant", type: "user", rule: [] }]) }), "FORM_ACTION_OPEN_APPROVAL_PLAN_SETVARS_INVALID");
expect(row({ type: "opendashboard", operation: "open", targetMode: "N/A", targetType: "Dashboard", query: JSON.stringify([{ name: "source", value: { value: "a" } }, { name: "Source", value: { value: "b" } }]) }), "FORM_ACTION_OPEN_RESOURCE_PLAN_QUERY_PARAMS_INVALID");
expect(row({ type: "opendashboard", operation: "open", targetMode: "N/A", targetType: "Dashboard", query: JSON.stringify([{ name: "source", value: {} }]) }), "FORM_ACTION_OPEN_RESOURCE_PLAN_QUERY_PARAMS_INVALID");
console.log(JSON.stringify({ status: "pass", test: "test-form-action-open-resource-plan-gates.mjs", cases: 14 }, null, 2));

function expect(data, code) { const report = validateFormActionOpenResourcePlan(plan([data])); assert.ok(report.findings.some((item) => item.code === code), JSON.stringify(report, null, 2)); }
function tokens() { return JSON.stringify([{ exprType: "variable", valueType: "string", id: "SelectedID", type: "expr" }]); }
function row(o = {}) { const v = { hostType: "Approval Submission", type: "listitem", operation: "view", targetMode: "select", targetType: "Data List", target: "Leave Balances", ids: tokens(), custom: "None", defaults: "None", query: "None", mode: "target", size: "None", width: "None", ...o }; return `| Leave Request | Submission form | ${v.hostType} | Open samples | 1 | Open sample | Button Click | btn_open | ${v.type} | ${v.operation} | ${v.targetMode} | ${v.targetType} | ${v.target} | ${v.ids} | ${v.custom} | ${v.defaults} | ${v.query} | ${v.mode} | ${v.size} | ${v.width} | None | None | No | Test | export-proven |`; }
function plan(rows) { return `| Host Resource | Host Form / Page | Host Type | Action Name | Step Order | Step Name | Trigger | Bound Control | Exact Step Type | Operation Type | Target Mode | Target Resource Type | Target Resource | Item / Form ID Expression Tokens | Selected Custom Form | Default / Set Variables JSON | Query Parameters JSON | Open Mode | Modal Size | Custom Width | Return Item ID Temp Variable | Execution Condition Tokens | Continue When Not Met | Business Rationale | Proof Boundary |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n${rows.join("\n")}`; }

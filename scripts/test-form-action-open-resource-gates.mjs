#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { buildFormActionOpenResourceStep, validateFormActionOpenResourceStep } = require("./lib/form-action-open-resource-utils.cjs");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const list = { AppID: 41, ListSetID: "9000000000000000001", ListID: "9000000000000000002" };
const form = { AppID: 41, ListSetID: "9000000000000000001", ProcKey: "leave-request" };
const page = { AppID: 41, ListSetID: "9000000000000000001", PageID: "9000000000000000003" };
const id = [{ exprType: "variable", valueType: "string", id: "SelectedID", type: "expr" }];

for (const operation of ["add", "edit", "view"]) {
  const step = buildFormActionOpenResourceStep({ hostSurface: "approval_submission", stepType: "listitem", name: `${operation} item`, operation, targetMode: "select", target: list, itemIdTokens: operation === "add" ? [] : id, openMode: "modal", modalSize: 1 });
  assert.equal(validateFormActionOpenResourceStep(step, { hostSurface: "approval_submission", strictGenerated: true }).length, 0);
  assert.equal(step.attrs.op_type, operation === "add" ? undefined : operation);
}

const current = buildFormActionOpenResourceStep({ hostSurface: "data_list_view", stepType: "listitem", name: "Edit current item", operation: "edit", targetMode: "current", target: list, openMode: "slide", modalSize: 2 });
assert.equal(current.attrs.data, undefined);
const newForm = buildFormActionOpenResourceStep({ hostSurface: "approval_task", stepType: "openform", name: "New request", operation: "new", target: form, setVariables: [{ id: "Applicant", type: "user", rule: [{ type: "func", func: "currentUser", params: [] }] }], queryParams: [{ name: "source", value: { value: "task" } }], openMode: "target" });
assert.equal(newForm.attrs.setVars.defKey, form.ProcKey);
const submitted = buildFormActionOpenResourceStep({ hostSurface: "dashboard", stepType: "openform", name: "View request", operation: "submitted", target: form, formIdTokens: id, openMode: "new" });
assert.equal(submitted.attrs.formid.length, 1);
const dashboard = buildFormActionOpenResourceStep({ hostSurface: "dashboard", stepType: "opendashboard", name: "Open overview", target: page, openMode: "modal", modalSize: 9, customWidth: 420 });
assert.deepEqual(dashboard.attrs.cusize, { w: 420 });

expectThrow({ hostSurface: "public_form", stepType: "opendashboard", name: "Bad", target: page, openMode: "target" }, /Public Forms/);
expectThrow({ hostSurface: "approval_submission", stepType: "listitem", name: "Bad", operation: "edit", targetMode: "current", target: list, openMode: "target" }, /Current item/);
expectThrow({ hostSurface: "dashboard", stepType: "listitem", name: "Bad", operation: "view", targetMode: "select", target: list, openMode: "target" }, /item ID/);
expectThrow({ hostSurface: "dashboard", stepType: "openform", name: "Bad", operation: "submitted", target: form, formIdTokens: id, queryParams: [{ name: "x" }], openMode: "target" }, /cannot receive/);
expectThrow({ hostSurface: "dashboard", stepType: "opendashboard", name: "Bad", target: page, openMode: "target", modalSize: 1 }, /only for Slide/);
expectThrow({ hostSurface: "dashboard", stepType: "opendashboard", name: "Bad", target: page, openMode: "modal", modalSize: 9 }, /custom width/);
expectThrow({ hostSurface: "dashboard", stepType: "listitem", name: "Bad ID", operation: "edit", targetMode: "select", target: list, itemIdTokens: [{ bad: true }], openMode: "target" }, /expression-token array/);
expectThrow({ hostSurface: "dashboard", stepType: "openform", name: "Bad Form ID", operation: "submitted", target: form, formIdTokens: [{ bad: true }], openMode: "target" }, /expression-token array/);
expectThrow({ hostSurface: "dashboard", stepType: "opendashboard", name: "Missing query name", target: page, queryParams: [{ name: "", value: { value: "x" } }], openMode: "target" }, /QUERY_PARAM_NAME_MISSING/);
expectThrow({ hostSurface: "dashboard", stepType: "opendashboard", name: "Duplicate query", target: page, queryParams: [{ name: "source", value: { value: "a" } }, { name: "Source", value: { value: "b" } }], openMode: "target" }, /QUERY_PARAM_DUPLICATE/);
expectThrow({ hostSurface: "dashboard", stepType: "opendashboard", name: "Missing query value", target: page, queryParams: [{ name: "source", value: {} }], openMode: "target" }, /QUERY_PARAM_VALUE_INVALID/);
expectThrow({ hostSurface: "approval_submission", stepType: "openform", name: "Missing target type", operation: "new", target: form, setVariables: [{ id: "Applicant", rule: id }], openMode: "target" }, /VARIABLE_TYPE_MISSING/);
expectThrow({ hostSurface: "approval_submission", stepType: "openform", name: "Missing rule", operation: "new", target: form, setVariables: [{ id: "Applicant", type: "user", rule: [] }], openMode: "target" }, /VARIABLE_RULE_INVALID/);

for (const file of ["form-action-open-item-form.template.json", "form-action-open-approval-form.template.json", "form-action-open-dashboard.template.json"]) {
  assert.ok(JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference", file), "utf8")).templateId);
}
console.log(JSON.stringify({ status: "pass", test: "test-form-action-open-resource-gates.mjs", cases: 25 }, null, 2));
function expectThrow(options, pattern) { assert.throws(() => buildFormActionOpenResourceStep(options), pattern); }

#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { validatePackage } from "./validate-form-action-open-resource.mjs";

const targetList = {
  List: { ListID: "9000000000000000002", ListSetID: "9000000000000000001", Type: 1, Title: "Leave Balances", LayoutView: JSON.stringify({ view: "layout-view" }) },
  Layouts: [{ LayoutID: "layout-view", Type: 1, Title: "View Balance", LayoutInResources: [{ Resource: JSON.stringify(formdef([])) }] }],
};
const itemStep = { type: "listitem", name: "View balance", attrs: { data: { list: { AppID: 41, ListSetID: "9000000000000000001", ListID: "9000000000000000002" } }, op_type: "view", listdataid: tokens("SelectedID", "string"), layout: "layout-view", op: "target" } };
assert.equal(validatePackage(writePackage({ Childs: [withAction(targetList, itemStep)] }), { strictGenerated: true }).status, "pass");

const mismatch = structuredClone(itemStep);
mismatch.attrs.op_type = "edit";
expectCode({ Childs: [withAction(targetList, mismatch)] }, "FORM_ACTION_OPEN_ITEM_LAYOUT_OPERATION_MISMATCH");

const unresolvedPurpose = structuredClone(targetList);
unresolvedPurpose.List.LayoutView = "{}";
expectCode({ Childs: [withAction(unresolvedPurpose, itemStep)] }, "FORM_ACTION_OPEN_ITEM_LAYOUT_PURPOSE_UNRESOLVED");

const approval = approvalTarget();
const validOpenForm = { type: "openform", name: "New request", attrs: { data: { form: { AppID: 41, ListSetID: "9000000000000000001", ProcKey: "leave-request" } }, optype: "new", setVars: { defKey: "leave-request", Rules: [{ id: "Applicant", type: "user", rule: [{ type: "func", func: "currentUser", params: [] }] }] }, op: "target" } };
assert.equal(validatePackage(writePackage({ Forms: [approval], Pages: [dashboardHost(validOpenForm)] }), { strictGenerated: true }).status, "pass");

const wrongType = structuredClone(validOpenForm);
wrongType.attrs.setVars.Rules[0] = { id: "Applicant", type: "text", rule: [{ type: "str", value: "x" }] };
expectCode({ Forms: [approval], Pages: [dashboardHost(wrongType)] }, "FORM_ACTION_OPEN_APPROVAL_VARIABLE_TYPE_MISMATCH");

const duplicateQuery = { type: "opendashboard", name: "Open dashboard", attrs: { data: { page: { AppID: 41, ListSetID: "9000000000000000001", PageID: "page-target" } }, queryParams: [{ name: "source", value: { value: "a" } }, { name: "Source", value: { value: "b" } }], op: "target" } };
expectCode({ Pages: [dashboardHost(duplicateQuery), targetDashboard()] }, "FORM_ACTION_OPEN_RESOURCE_QUERY_PARAM_DUPLICATE");

console.log(JSON.stringify({ status: "pass", test: "test-form-action-open-resource-package-gates.mjs", cases: 6 }, null, 2));

function withAction(target, step) { const value = structuredClone(target); value.Layouts[0].LayoutInResources[0].Resource = JSON.stringify(formdef([step])); return value; }
function formdef(steps) { return { actions: steps.length ? [{ id: "action", name: "Open sample", steps }] : [], tempVars: [] }; }
function dashboardHost(step) { return { LayoutID: "page-host", Type: 103, Title: "Host", LayoutInResources: [{ Resource: JSON.stringify(formdef([step])) }] }; }
function targetDashboard() { return { LayoutID: "page-target", Type: 103, Title: "Target", LayoutInResources: [{ Resource: JSON.stringify(formdef([])) }] }; }
function approvalTarget() { return { Key: "leave-request", Name: "Leave Request", WorkflowType: 2, DefResource: encodeDef({ variables: [{ id: "Applicant", name: "Applicant", type: "user" }], pageurls: [] }) }; }
function tokens(id, valueType) { return [{ exprType: "variable", valueType, id, type: "expr" }]; }
function encodeDef(value) { return Buffer.concat([Buffer.from("::brotli::"), zlib.brotliCompressSync(Buffer.from(JSON.stringify(value))) ]).toString("base64"); }
function writePackage(value) { const dir = fs.mkdtempSync(path.join(os.tmpdir(), "open-resource-gate-")); const file = path.join(dir, "fixture.yapk"); fs.writeFileSync(file, JSON.stringify({ Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify({ Childs: [], Forms: [], Pages: [], ...value }))).toString("base64") })); return file; }
function expectCode(value, code) { const report = validatePackage(writePackage(value), { strictGenerated: true }); assert.equal(report.status, "fail", JSON.stringify(report, null, 2)); assert.ok(report.findings.some((item) => item.code === code), JSON.stringify(report, null, 2)); }

#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { buildApprovalFormLayoutDef } from "./lib/approval-form-layout-builder.mjs";

const require = createRequire(import.meta.url);
const { parseChoiceOptionValues } = require("./lib/choice-field-option-utils.cjs");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "choice-field-options-"));

assert.deepEqual(
  parseChoiceOptionValues("Annual Leave、Sick Leave、Personal Leave、Other（Planning Default）"),
  ["Annual Leave", "Sick Leave", "Personal Leave", "Other"],
);
assert.deepEqual(parseChoiceOptionValues("Active、Inactive"), ["Active", "Inactive"]);
assert.deepEqual(parseChoiceOptionValues("Approved、Reversed"), ["Approved", "Reversed"]);
assert.deepEqual(parseChoiceOptionValues("Draft; Approved, Rejected；Returned"), ["Draft", "Approved", "Rejected", "Returned"]);
assert.equal(parseChoiceOptionValues(Array.from({ length: 15 }, (_, index) => `Option ${index + 1}`)).length, 15);

const approvalLayout = buildApprovalFormLayoutDef({
  rootDir: ROOT,
  id: "choice-layout-test",
  title: "Leave Request",
  fields: [{ displayName: "Leave Type", fieldName: "LeaveType", fieldType: "Choice", controlType: "select", choiceValues: "Annual Leave、Sick Leave、Personal Leave、Other（Planning Default）" }],
});
const approvalChoice = findControl(approvalLayout, (control) => control.binding === "LeaveType");
assert.deepEqual(approvalChoice?.attrs?.choices, ["Annual Leave", "Sick Leave", "Personal Leave", "Other"]);
assert.deepEqual(approvalChoice?.attrs?.color_choices?.map((choice) => choice.value), approvalChoice.attrs.choices);

const materializedChoices = materializeChoicePlan();
assert.deepEqual(materializedChoices["Employee Leave Balances/Leave Type"], ["Annual Leave", "Sick Leave", "Personal Leave", "Other"]);
assert.deepEqual(materializedChoices["Employee Leave Balances/Active Status"], ["Active", "Inactive"]);
assert.equal(materializedChoices["Employee Leave Balances/Extended Category"].length, 15);
assert.deepEqual(materializedChoices["Leave Usage Statistics/Leave Type"], ["Annual Leave", "Sick Leave", "Personal Leave", "Other"]);
assert.deepEqual(materializedChoices["Leave Usage Statistics/Usage Status"], ["Approved", "Reversed"]);

const malformed = writePackage("merged", "Annual Leave、Sick Leave、Personal Leave、Other（Planning Default）", ["Annual Leave、Sick Leave、Personal Leave、Other（Planning Default）"]);
expectCodes(malformed, ["CHOICE_OPTION_CONTAINS_MULTIPLE_VALUES", "CHOICE_OPTION_PLANNING_ANNOTATION_PRESENT"]);

const mismatch = writePackage("mismatch", "Annual Leave", ["Sick Leave"]);
expectCodes(mismatch, ["CHOICE_COLOR_OPTIONS_MISMATCH"]);

const valid = writePackage("valid", "Annual Leave", ["Annual Leave"]);
const validResult = runValidator(valid);
assert.equal(validResult.status, 0, `${validResult.stdout}\n${validResult.stderr}`);

console.log(JSON.stringify({ status: "pass", test: "test-choice-field-option-materialization-gates.mjs", cases: 14 }, null, 2));

function materializeChoicePlan() {
  const spec = path.join(tempDir, "functional-specification.md");
  const plan = path.join(tempDir, "yeeflow-app-plan.md");
  const outDir = path.join(tempDir, "materialized");
  fs.writeFileSync(spec, "# Functional Specification: Leave Choice Regression\n\nBusiness defaults approval status: user-default-approved-for-generation.\n");
  fs.writeFileSync(plan, [
    "# Leave Choice Regression - Yeeflow App Plan",
    "",
    "## Plan Status",
    "",
    "- Application name: Leave Choice Regression",
    "- Business defaults approval status: user-default-approved-for-generation.",
    "",
    "## 4. Data Lists and Document Libraries Plan",
    "",
    "### 4.1 Employee Leave Balances",
    "",
    "| Field Order | Display Name | Internal ID / Field Key | Exact Yeeflow Field Type | Exact Yeeflow Control Type | Choice Values |",
    "| --- | --- | --- | --- | --- | --- |",
    "| 1 | Leave Type | LeaveType | Choice | select | Annual Leave、Sick Leave、Personal Leave、Other（Planning Default） |",
    "| 2 | Active Status | ActiveStatus | Choice | select | Active、Inactive |",
    `| 3 | Extended Category | ExtendedCategory | Choice | select | ${Array.from({ length: 15 }, (_, index) => `Option ${index + 1}`).join("、")} |`,
    "",
    "### 4.2 Leave Usage Statistics",
    "",
    "| Field Order | Display Name | Internal ID / Field Key | Exact Yeeflow Field Type | Exact Yeeflow Control Type | Choice Values |",
    "| --- | --- | --- | --- | --- | --- |",
    "| 1 | Leave Type | LeaveType | Choice | select | Annual Leave、Sick Leave、Personal Leave、Other（Planning Default） |",
    "| 2 | Usage Status | UsageStatus | Choice | select | Approved、Reversed |",
  ].join("\n"));
  const result = spawnSync(process.execPath, [
    path.join(ROOT, "scripts/materialize-full-app-generated-final.mjs"),
    "--functional-spec", spec,
    "--app-plan", plan,
    "--out-dir", outDir,
    "--allow-fixture-api-ids-for-tests",
    "--json",
  ], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const report = JSON.parse(result.stdout);
  const decoded = JSON.parse(fs.readFileSync(report.outputs.decodedResource, "utf8"));
  const values = {};
  for (const child of decoded.Childs || []) {
    for (const field of child.Fields || []) {
      if (!new Set(["select", "radio", "checkbox", "tag"]).has(field.Type)) continue;
      const rules = JSON.parse(field.Rules || "{}");
      const key = `${child.List?.Title}/${field.DisplayName}`;
      values[key] = (rules.choices || []).map((choice) => choice.value);
      assert.deepEqual((rules.color_choices || []).map((choice) => choice.value), values[key]);
    }
  }
  return values;
}

function writePackage(name, choice, colorChoices) {
  const rootId = "1700000000001001";
  const listId = "1700000000001002";
  const titleFieldId = "1700000000001010";
  const choiceFieldId = "1700000000001011";
  const rules = JSON.stringify({
    choices: [{ key: "1", value: choice, color: "#2563eb" }],
    color_choices: colorChoices.map((value, index) => ({ key: String(index + 1), value, color: "#2563eb" })),
    displayStyle: "dropdown",
    show_color: false,
  });
  const layoutView = JSON.stringify({
    layout: [
      { FieldID: titleFieldId, FieldName: "Title", DisplayName: "Title", Type: "input", Order: 1, Mobile: 2, Show: true },
      { FieldID: choiceFieldId, FieldName: "Text1", DisplayName: "Leave Type", Type: "select", Order: 2, Mobile: 2, Show: true },
    ],
    query: ["Title", "Text1", "ListDataID", "CreatedBy", "ModifiedBy", "Created", "Modified"].map((field) => ({ FieldName: field, field })),
  });
  const listBase = { Description: "", Status: 1, IsItemPerm: false, IsVerRecord: false, HasComment: false, IconUrl: "" };
  const fieldBase = { Status: 1, Category: 1, IsSort: false, IsUnique: false };
  const decoded = {
    ListSet: { ...listBase, ListID: Number(rootId), Title: "Choice Test", Type: 1024, Flags: 1, TableCode: "flowcraft", IndexCode: "flowcraft", LayoutView: "{}" },
    Pages: [], Forms: [], FormReports: [], FormNewReports: [], CustomServices: [], DataReports: [], Groups: [], Tags: [], Metadatas: [], Agents: [], Connections: [], Knowledges: [], Themes: [], Components: [], PortalInfo: null,
    Childs: [{
      List: { ...listBase, ListID: Number(listId), Title: "Leave Balances", Type: 1, Flags: 1, LayoutView: null, TableCode: "flowcraft", IndexCode: "flowcraft" },
      Fields: [
        { ...fieldBase, Status: 0, ListID: Number(listId), FieldID: Number(titleFieldId), FieldName: "Title", InternalName: "Title", DisplayName: "Title", FieldIndex: 0, IsSystem: true, Type: "input", FieldType: "Text", Rules: "{}" },
        { ...fieldBase, ListID: Number(listId), FieldID: Number(choiceFieldId), FieldName: "Text1", InternalName: "LeaveType", DisplayName: "Leave Type", FieldIndex: 1, IsSystem: false, Type: "select", FieldType: "Text", Rules: rules },
      ],
      Layouts: [{ ListID: Number(listId), LayoutID: "1700000000001020", Type: 0, Title: "Default", IsDefault: true, IsItemPerm: false, Ext1: JSON.stringify({ Url: "default" }), LayoutView: layoutView, LayoutInResources: [] }],
      RemindRules: [], PublicForms: [], FlowMappings: [],
    }],
  };
  const wrapper = {
    PackageId: `choice-${name}`,
    TenantID: "1700000000001101",
    AppID: 41,
    ListID: rootId,
    Title: "Choice Test",
    Description: "",
    IconUrl: JSON.stringify({ b: "#E6F0FF", i: "fa-solid fa-list", c: "#0065FF" }),
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded))).toString("base64"),
    Notes: "",
    Author: "regression",
    Date: "2026-07-14T00:00:00Z",
    Version: "test",
    Sign: Buffer.alloc(32, 1).toString("base64"),
  };
  const file = path.join(tempDir, `${name}.yapk`);
  fs.writeFileSync(file, `${JSON.stringify(wrapper)}\n`);
  return file;
}

function findControl(root, predicate) {
  if (!root || typeof root !== "object") return null;
  if (predicate(root)) return root;
  for (const value of Object.values(root)) {
    if (Array.isArray(value)) {
      for (const child of value) {
        const found = findControl(child, predicate);
        if (found) return found;
      }
    } else if (value && typeof value === "object") {
      const found = findControl(value, predicate);
      if (found) return found;
    }
  }
  return null;
}

function runValidator(file) {
  return spawnSync(process.execPath, [path.join(ROOT, "validate-yapk-package.js"), file], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
}

function expectCodes(file, codes) {
  const result = runValidator(file);
  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  for (const code of codes) assert.match(output, new RegExp(code));
}

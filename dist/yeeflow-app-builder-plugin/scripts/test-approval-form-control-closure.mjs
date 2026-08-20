#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildApprovalFormLayoutDef } from "./lib/approval-form-layout-builder.mjs";
import { validateApprovalFormControlClosure } from "./validate-approval-form-control-closure.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = path.join(ROOT, "fixtures/approval-form-control-closure/sales-quotation-approval.valid.json");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "approval-form-control-closure-"));
const results = [];

try {
  expectPass("Sales Quotation Approval fixture passes the complete control closure", readFixture());

  const unknownType = readFixture();
  unknownType.pageurls[1].formdef.children[0].type = "drop";
  expectCode("unknown drop control fails closed", unknownType, "APPROVAL_CONTROL_TYPE_UNKNOWN");

  const missingBuilderMarker = readFixture();
  delete missingBuilderMarker.pageurls[0].formdef.children[0].approvalFieldMaterializedFromPlan;
  expectCode("hand-built bound field cannot bypass shared builder", missingBuilderMarker, "APPROVAL_FIELD_SHARED_BUILDER_MARKER_MISSING");

  const missingChoiceOptions = readFixture();
  missingChoiceOptions.pageurls[0].formdef.children[0].attrs.choices = [];
  expectCode("choice without business options fails", missingChoiceOptions, "CHOICE_CONTROL_OPTIONS_MISSING");

  const missingSubListPlaceholder = readFixture();
  delete missingSubListPlaceholder.pageurls[0].formdef.children[1].attrs["list-fields"][0].control.attrs.placeholder;
  expectCode("editable Sub List row without placeholder fails", missingSubListPlaceholder, "SUBLIST_EDITABLE_PLACEHOLDER_MISSING");

  const inconsistentTaskType = readFixture();
  inconsistentTaskType.pageurls[1].formdef.children[0].type = "input";
  expectCode("Submission and Task field types must stay normalised", inconsistentTaskType, "APPROVAL_PAGE_FIELD_TYPE_MISMATCH");

  const fields = [
    { displayName: "Closing Period", fieldName: "ClosingPeriod", fieldType: "Choice", controlType: "select", choiceValues: "2026-08;2026-09" },
    { displayName: "Quotation Lines", fieldName: "QuotationLines", fieldType: "List", controlType: "list", listFields: [
      { id: "Description", displayName: "Description", columnTitle: "Description", fieldType: "Text", controlType: "input" },
      { id: "Approver", displayName: "Approver", columnTitle: "Approver", fieldType: "Lookup", controlType: "lookup" },
    ] },
  ];
  const submission = buildApprovalFormLayoutDef({ rootDir: ROOT, id: "sales-quotation-submission", title: "Sales Quotation Approval", role: "submission", fields });
  const task = buildApprovalFormLayoutDef({ rootDir: ROOT, id: "sales-quotation-task", title: "Sales Quotation Approval", role: "task", fields });
  const generated = { key: "SalesQuotationApproval", pageurls: [
    { type: 1, title: "Submission", formdef: submission },
    { type: 2, title: "Task", formdef: task },
  ] };
  expectPass("shared builder emits markers and business placeholders for top-level and Sub List fields", generated);
  const generatedControls = collectControls(submission);
  assert.equal(generatedControls.find((control) => control.binding === "ClosingPeriod")?.attrs?.placeholder, "Select Closing Period");
  const generatedList = generatedControls.find((control) => control.binding === "QuotationLines");
  assert.equal(generatedList?.attrs?.["list-fields"]?.[0]?.control?.attrs?.placeholder, "Enter Description");
  assert.equal(generatedList?.attrs?.["list-fields"]?.[1]?.control?.attrs?.placeholder, "Select Approver");
  results.push({ name: "shared builder uses typed placeholders for top-level and Sub List fields", status: "pass" });

  console.log(JSON.stringify({ status: "pass", results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function readFixture() {
  return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
}

function expectPass(name, resource) {
  const file = writeResource(`${slug(name)}.json`, resource);
  const report = validateApprovalFormControlClosure({ resource: file });
  results.push({ name, status: report.status, findingCodes: report.findings.map((finding) => finding.code) });
  assert.equal(report.status, "pass", `${name}: ${JSON.stringify(report.findings, null, 2)}`);
}

function expectCode(name, resource, code) {
  const file = writeResource(`${slug(name)}.json`, resource);
  const report = validateApprovalFormControlClosure({ resource: file });
  results.push({ name, status: report.findings.some((finding) => finding.code === code) ? "pass" : "fail", expectedCode: code, findingCodes: report.findings.map((finding) => finding.code) });
  assert.equal(report.status, "fail", `${name} should fail`);
  assert.equal(report.findings.some((finding) => finding.code === code), true, `${name} should include ${code}: ${JSON.stringify(report.findings, null, 2)}`);
}

function writeResource(name, value) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
}

function collectControls(root) {
  if (!root || typeof root !== "object") return [];
  return [root]
    .concat(Array.isArray(root.children) ? root.children.flatMap(collectControls) : [])
    .concat(Array.isArray(root?.attrs?.["list-fields"]) ? root.attrs["list-fields"].flatMap((row) => collectControls(row?.control)) : []);
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readDecodedYapk } from "./lib/yapk-decode-utils.mjs";
import { validateApprovalFormFieldsTemplate } from "./validate-approval-form-fields-template.mjs";
import { leavePlan } from "./test-fixtures/release-1.0.3-clean-room-plan.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "release-1.0.3-contracts-"));
const plan = path.join(temp, "yeeflow-app-plan.md");
const spec = path.join(temp, "functional-specification.md");
const out = path.join(temp, "dist");
fs.writeFileSync(plan, `${leavePlan}\n`);
fs.writeFileSync(spec, "# Functional Specification: Leave Operations\n\nBusiness defaults approval status: user-default-approved-for-generation.\n");

const planReport = validateApprovalFormFieldsTemplate({ plan });
assert.equal(planReport.status, "pass", JSON.stringify(planReport.findings));

const secondSelectionRowPlan = path.join(temp, "second-selection-row-plan.md");
fs.writeFileSync(secondSelectionRowPlan, leavePlan.replace("| Leave Request | Review task form | Review fields | approval_form_fields_grid_2col_v1_1 | Task fields | 2 | 2 | 1 |", "| Leave Request | Review task form | Review fields | approval_form_fields_grid_2col_v1_1 | Task fields | 2 | 2 | 3 |"));
assert.ok(validateApprovalFormFieldsTemplate({ plan: secondSelectionRowPlan }).findings.some((finding) => finding.code === "APPROVAL_FORM_FIELDS_APP_PLAN_MOBILE_COLUMNS_INVALID"));

const textSelectPlan = path.join(temp, "text-select-plan.md");
fs.writeFileSync(textSelectPlan, leavePlan.replace("| Leave Type | LeaveType | Choice | select | Annual Leave; Sick Leave; Other | Yes | No |", "| Leave Type | LeaveType | Text | select | Annual Leave; Sick Leave; Other | Yes | No |"));
assert.ok(validateApprovalFormFieldsTemplate({ plan: textSelectPlan }).findings.some((finding) => finding.code === "APPROVAL_FORM_FIELDS_TEXT_CHOICE_CONTROL_FORBIDDEN"));

const missingChoicesPlan = path.join(temp, "missing-choices-plan.md");
fs.writeFileSync(missingChoicesPlan, leavePlan.replaceAll("Choice | select | Annual Leave; Sick Leave; Other", "Choice | select | "));
assert.ok(validateApprovalFormFieldsTemplate({ plan: missingChoicesPlan }).findings.some((finding) => finding.code === "APPROVAL_FORM_FIELDS_CHOICE_VALUES_REQUIRED"));

const materialized = run("scripts/materialize-full-app-generated-final.mjs", [
  "--functional-spec", spec,
  "--app-plan", plan,
  "--out-dir", out,
  "--allow-fixture-api-ids-for-tests",
  "--json",
]);
const report = JSON.parse(materialized.stdout);
assert.equal(report.status, "pass", materialized.stdout);
const packagePath = report.outputs.package;
const { wrapper, decoded } = readDecodedYapk(packagePath);
assert.match(wrapper.IconUrl, /calendar-check/);

const unknownDomainPlan = path.join(temp, "unknown-domain-plan.md");
const unknownDomainSpec = path.join(temp, "unknown-domain-spec.md");
fs.writeFileSync(unknownDomainPlan, leavePlan
  .replace("# Leave Operations - Yeeflow App Plan", "# Generic Operations - Yeeflow App Plan")
  .replace("- Application name: Leave Operations", "- Application name: Generic Operations"));
fs.writeFileSync(unknownDomainSpec, "# Functional Specification: Generic Operations\n\nBusiness defaults approval status: user-default-approved-for-generation.\n");
const unknownDomain = spawnSync(process.execPath, [
  path.join(root, "scripts/materialize-full-app-generated-final.mjs"),
  "--functional-spec", unknownDomainSpec,
  "--app-plan", unknownDomainPlan,
  "--out-dir", path.join(temp, "unknown-domain-dist"),
  "--allow-fixture-api-ids-for-tests",
  "--json",
], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
assert.notEqual(unknownDomain.status, 0);
assert.match(`${unknownDomain.stdout}\n${unknownDomain.stderr}`, /FULL_APP_APPLICATION_ICON_SELECTION_REQUIRED/);

const approvalDef = decodeApprovalDef(decoded.Forms.find((form) => form.Name === "Leave Request").DefResource);
const action = approvalDef.childshapes.find((shape) => shape?.stencil?.id === "ContentList");
assert.ok(action);
assert.deepEqual(action.properties.listdatas.map((mapping) => mapping.Columns), ["RequestNumber", "Employee", "LeaveType", "LeaveDays", "UsageStatus"]);
for (const mapping of action.properties.listdatas) assert.equal(mapping.Per, "0");
for (const token of action.properties.listdatas.slice(0, 4).map((mapping) => mapping.Data[0])) {
  assert.equal(token.type, "expr");
  assert.match(token.name, /^Workflow Variables:/);
}
assert.deepEqual(action.properties.listdatas[4].Data, [{ type: "str", value: "Recorded" }]);

const leaveTypeChoices = findAll(approvalDef, (value) => value?.binding === "LeaveType" && value?.type === "select");
assert.equal(leaveTypeChoices.length, 2);
const [submissionChoice, taskChoice] = leaveTypeChoices;
assert.deepEqual(submissionChoice.attrs.choices, ["Annual Leave", "Sick Leave", "Other"]);

for (const [script, args] of [
  ["scripts/validate-approval-workflow-publish-readiness.mjs", ["--package", packagePath, "--plan", plan]],
  ["scripts/inspect-dashboard-summary-control-contract.mjs", ["--package", packagePath]],
  ["scripts/validate-dashboard-generation-hard-gates.mjs", ["--package", packagePath]],
  ["scripts/validate-application-icon.js", ["--package", packagePath]],
]) run(script, args);

const preflight = spawnSync(process.execPath, [
  path.join(root, "scripts/yapk-first-generation-preflight.mjs"),
  "--package", packagePath,
  "--plan", plan,
  "--id-provenance", report.outputs.idProvenance,
  "--json",
], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
assert.notEqual(preflight.status, 0);
const preflightReport = JSON.parse(preflight.stdout);
assert.equal(preflightReport.failedGate, "api-issued-content-id-provenance");
assert.deepEqual(preflightReport.gates.filter((gate) => !gate.ok).map((gate) => gate.gate), ["api-issued-content-id-provenance"]);
const unsignedCodes = preflightReport.gates.find((gate) => gate.gate === "decoded-app-package-runtime")?.codes || [];
assert.ok(unsignedCodes.includes("YAPK_SIGN_UNEXPECTED_SHAPE"));
assert.ok(unsignedCodes.includes("YAPK_CONTENT_GENERATION_RUNTIME_PROOF_REQUIRED"));

const pageResource = JSON.parse(decoded.Pages[0].LayoutInResources[0].Resource);
const summary = find(pageResource, (value) => value?.type === "summary");
assert.ok(summary);
assert.equal(summary.attrs.save_var.id.startsWith("__temp___temp_"), false);
assert.ok(pageResource.tempVars.some((variable) => variable.id === summary.attrs.save_var.id && variable.name === summary.attrs.save_var.name));
assert.ok(pageResource.ReportIds.includes(summary.id));
assert.ok(pageResource.exts.some((entry) => entry.i === summary.id && entry.id === summary.id));
assert.ok(find(pageResource, (value) => value?.type !== "summary" && JSON.stringify(value?.attrs?.headc?.title?.variable || null) === JSON.stringify([summary.attrs.save_var])));

console.log(JSON.stringify({ status: "pass", test: "release-1.0.3-clean-room-contracts", cases: 24 }, null, 2));

function run(script, args) {
  const result = spawnSync(process.execPath, [path.join(root, script), ...args], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  assert.equal(result.status, 0, `${script}\nstdout=${result.stdout}\nstderr=${result.stderr}`);
  return result;
}

function decodeApprovalDef(value) {
  const bytes = Buffer.from(value, "base64");
  const prefix = Buffer.from("::brotli::", "utf8");
  return JSON.parse(zlib.brotliDecompressSync(bytes.subarray(0, prefix.length).equals(prefix) ? bytes.subarray(prefix.length) : bytes).toString("utf8"));
}

function find(value, predicate) {
  if (predicate(value)) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const match = find(item, predicate);
      if (match) return match;
    }
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      const match = find(item, predicate);
      if (match) return match;
    }
  }
  return null;
}

function findAll(value, predicate, matches = []) {
  if (predicate(value)) matches.push(value);
  if (Array.isArray(value)) value.forEach((item) => findAll(item, predicate, matches));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => findAll(item, predicate, matches));
  return matches;
}

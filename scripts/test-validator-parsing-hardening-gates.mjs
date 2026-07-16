#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  findMarkdownTable,
  hasTechnicalPlaceholderIdContext,
  markdownRowValue,
} from "./lib/markdown-planning-utils.mjs";
import { validateFormActionPrintBarcodePlan } from "./validate-form-action-print-barcode-plan.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "validator-parsing-hardening-"));
const results = [];

function write(name, body) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, `${body.trim()}\n`);
  return file;
}

function run(script, args) {
  const result = spawnSync(process.execPath, [script, ...args, "--json"], { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  const output = `${result.stdout}\n${result.stderr}`;
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    throw new Error(`Could not parse ${script} output:\n${output}`);
  }
  return { result, report, output };
}

function expectPass(name, script, args) {
  const output = run(script, args);
  assert.equal(output.report.status, "pass", `${name}:\n${JSON.stringify(output.report.findings, null, 2)}`);
  assert.equal(output.result.status, 0, `${name} exited ${output.result.status}:\n${output.output}`);
  results.push({ name, status: "pass" });
}

function expectCode(name, script, args, code) {
  const output = run(script, args);
  assert.equal(output.report.status, "fail", `${name} unexpectedly passed`);
  assert.equal(output.report.findings.some((finding) => finding.code === code), true, `${name} missing ${code}:\n${output.output}`);
  results.push({ name, status: "pass", expectedCode: code });
}

try {
  const reordered = `
| Selection Reason | Selected Control | Data Source |
| --- | --- | --- |
| Scannable queue | Collection | Requests |
`;
  const table = findMarkdownTable(reordered, ["Selection Reason"]);
  assert.equal(markdownRowValue(table, table.rows[0], ["Selected Record Display Control", "Selected Control"]), "Collection");
  results.push({ name: "semantic header lookup survives reordered and aliased columns", status: "pass" });

  assert.equal(hasTechnicalPlaceholderIdContext("Page-level FORM-REQUEST business section"), false);
  assert.equal(hasTechnicalPlaceholderIdContext("PageID: PAGE-REQUEST"), true);
  results.push({ name: "fake ID detection ignores business hyphenated prose and requires technical context", status: "pass" });

  const canonicalPlan = fs.readFileSync(path.join(ROOT, "docs/standards/app-plan-standard-template.md"), "utf8");
  const prosePlan = canonicalPlan.replace(
    "#### Dashboard Filters",
    "Business labels may use Page-level, Form-level, and FORM-REQUEST wording without declaring generated IDs. No chart is required for that prose.\n\n#### Dashboard Filters",
  );
  expectPass("resource-order validator accepts Page-level Form-level and business FORM-REQUEST prose", "scripts/validate-app-plan-resource-order.mjs", [write("resource-order-business-prose.md", prosePlan)]);
  const technicalIdPlan = canonicalPlan.replace("#### Dashboard Filters", "PageID: PAGE-REQUEST\n\n#### Dashboard Filters");
  expectCode("resource-order validator still rejects fake IDs in technical contexts", "scripts/validate-app-plan-resource-order.mjs", [write("resource-order-technical-fake-id.md", technicalIdPlan)], "APP_PLAN_DASHBOARD_FAKE_PLACEHOLDER_ID_LEAK");

  const approvalPlan = `
# Approval Parsing Test - Yeeflow App Plan
## 5. Approval Forms Plan
Approval form pages are planned.

#### Approval Form Layout Template Selection
| Approval Form | Form Page | Page Role | Selected Approval Form Layout Template | Business Sections Needed | Related Data Needed | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Request | Submission form | Submission | approval_form_layout_submission_v1_1 | Intake | None | Captures data for later task processing | Generated-final validation |
| Request | Review task | Task | approval_form_layout_task_v1_1 | Review | None | Shows the original submission context | Generated-final validation |
`;
  const approvalFile = write("approval-cross-keywords.md", approvalPlan);
  expectPass("approval page role parsing ignores task/submission words in reason text", "scripts/validate-approval-form-layout-template.mjs", ["--plan", approvalFile]);

  const clarification = `
# Clarification Test
## Business Clarification Decisions
| Key | Question | Status | Answer |
| --- | --- | --- | --- |
| UI-1 | Which page opens? | answered | Open dashboard in a full page. |
`;
  expectPass("clarification status parsing ignores the word open in Answer", "scripts/validate-business-clarification-gate.mjs", ["--plan", write("clarification-open-answer.md", clarification), "--mode", "generation"]);

  const spec = `
# Traceability Test - Functional Specification
## UI and Experience Requirements
- REQ-UI-1: Provide a simple operations page.
`;
  const mappedPlan = `
# Traceability Test - Yeeflow App Plan
## 14. Dashboard Pages Plan
- REQ-UI-1 maps to the Operations Dashboard page.
## 22. Deferred or Runtime-Proof Items
No deferred items are required.
`;
  expectPass("requirement ID mapping passes when the exact marker is present", "scripts/validate-functional-spec-to-app-plan-traceability.mjs", ["--spec", write("trace-spec.md", spec), "--plan", write("trace-plan-mapped.md", mappedPlan)]);
  expectCode("requirement ID mapping fails when only generic page wording exists", "scripts/validate-functional-spec-to-app-plan-traceability.mjs", ["--spec", write("trace-spec-missing.md", spec), "--plan", write("trace-plan-missing.md", mappedPlan.replace("REQ-UI-1 maps to the ", "The "))], "TRACEABILITY_REQUIREMENT_ID_UNMAPPED");

  const deferredComplete = `
# Deferred Contract - Yeeflow App Plan
## 22. Deferred or Runtime-Proof Items
| Item | Category | Reason | User Impact | Fallback | Required Proof or Follow-up |
| --- | --- | --- | --- | --- | --- |
| Live notification | runtime-proof-required | Delivery depends on tenant mail configuration | Delivery is not yet claimed | Keep an in-app status | Send a test notification after install |
`;
  expectPass("structured deferred disposition passes with complete contract", "scripts/validate-functional-spec-to-app-plan-traceability.mjs", ["--spec", write("empty-spec.md", "# Empty Functional Specification"), "--plan", write("deferred-complete.md", deferredComplete)]);
  expectCode("structured deferred disposition fails when fallback is missing", "scripts/validate-functional-spec-to-app-plan-traceability.mjs", ["--spec", write("empty-spec-2.md", "# Empty Functional Specification"), "--plan", write("deferred-missing.md", deferredComplete.replace("| Keep an in-app status |", "|  |"))], "TRACEABILITY_DEFERRED_WITHOUT_REASON");

  const printTemplateOnly = `
| Host Resource | Host Form / Page | Host Type | Action Name | Step Name | Trigger | Bound Control | Exact Step Type | Target Page Type | Target Page | Print Title Expression Tokens | Paper Size | Print Layout | Scale Percent | Margins |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Resource> | <Page> | Dashboard | <Action> | <Step> | Button Click | <Control> | print | Dashboard | <Target> | <Expression-token JSON> | A4 | landscape | 80 | Minimum |
`;
  assert.deepEqual(validateFormActionPrintBarcodePlan(printTemplateOnly), { status: "pass", rows: 0, findings: [] });
  results.push({ name: "form-action print validator ignores canonical template placeholder rows", status: "pass" });

  const concretePrint = printTemplateOnly.replace(
    "| <Resource> | <Page> | Dashboard | <Action> | <Step> | Button Click | <Control> | print | Dashboard | <Target> | <Expression-token JSON> |",
    '| Inventory | Inventory | Dashboard | Print | Print records | Button Click | btn_print | print | Dashboard | Print Inventory | `[{"type":"str","value":"Inventory"}]` |',
  );
  const concretePrintReport = validateFormActionPrintBarcodePlan(concretePrint);
  assert.equal(concretePrintReport.status, "pass", JSON.stringify(concretePrintReport.findings, null, 2));
  results.push({ name: "form-action print validator accepts markdown-wrapped expression-token JSON", status: "pass" });

  console.log(JSON.stringify({ status: "pass", results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();

function runValidator(script, file) {
  const result = spawnSync(process.execPath, [script, file, "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  let report;
  try {
    report = JSON.parse(result.stdout || "{}");
  } catch (error) {
    throw new Error(`Could not parse validator output: ${error.message}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  }
  return { result, report };
}

function writeFixture(dir, name, text) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, `${text.trim()}\n`);
  return file;
}

function expectFinding(report, code) {
  assert.equal(
    (report.findings || []).some((finding) => finding.code === code),
    true,
    `expected ${code}; findings: ${JSON.stringify(report.findings, null, 2)}`,
  );
}

function replaceSection(text, startHeading, nextHeading, replacement) {
  const start = text.indexOf(startHeading);
  const end = text.indexOf(nextHeading, start);
  assert.notEqual(start, -1, `missing start heading ${startHeading}`);
  assert.notEqual(end, -1, `missing next heading ${nextHeading}`);
  return `${text.slice(0, start)}${replacement.trim()}\n\n${text.slice(end)}`;
}

const functionalTemplate = fs.readFileSync(path.join(ROOT, "docs/standards/functional-specification-standard-template.md"), "utf8");
const appPlanTemplate = fs.readFileSync(path.join(ROOT, "docs/standards/app-plan-standard-template.md"), "utf8");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "planning-markdown-template-standardization-"));
const results = [];

try {
  let file = writeFixture(tempDir, "complete-functional-specification.md", functionalTemplate);
  let output = runValidator("scripts/validate-functional-specification.mjs", file);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "complete Functional Specification Markdown using standardized template passes", status: "pass" });

  const noDashboardSpec = replaceSection(
    functionalTemplate,
    "## 13. Dashboard Page Requirements",
    "## 14. Reporting and Audit Requirements",
    "## 13. Dashboard Page Requirements\n\nNo dashboard required.",
  );
  file = writeFixture(tempDir, "functional-spec-missing-dashboard.md", noDashboardSpec);
  output = runValidator("scripts/validate-functional-specification.mjs", file);
  assert.equal(output.report.status, "fail");
  expectFinding(output.report, "FUNCTIONAL_SPEC_DASHBOARD_PAGE_CONTENT_REQUIREMENTS_INCOMPLETE");
  expectFinding(output.report, "FUNCTIONAL_SPEC_DASHBOARD_IDENTITY_TABLE_SCHEMA_MISSING");
  results.push({ case: "Functional Specification missing Dashboard business requirements fails", status: "pass" });

  const shallowSpec = replaceSection(
    replaceSection(
      functionalTemplate,
      "## 5. User Roles and Responsibilities",
      "## 6. Business Objects and Data Requirements",
      "## 5. User Roles and Responsibilities\n\nUsers manage requests.",
    ),
    "## 8. Core Business Process",
    "## 9. Business Rules and Status Lifecycles",
    "## 8. Core Business Process\n\nManage requests and track status.",
  );
  file = writeFixture(tempDir, "functional-spec-shallow-summary.md", shallowSpec);
  output = runValidator("scripts/validate-functional-specification.mjs", file);
  assert.equal(output.report.status, "fail");
  expectFinding(output.report, "FUNCTIONAL_SPEC_ROLE_RESPONSIBILITIES_INCOMPLETE");
  expectFinding(output.report, "FUNCTIONAL_SPEC_BUSINESS_PROCESS_STEPS_INCOMPLETE");
  results.push({ case: "Functional Specification with only shallow app summary fails", status: "pass" });

  file = writeFixture(tempDir, "complete-yeeflow-app-plan.md", appPlanTemplate);
  output = runValidator("scripts/validate-app-plan-resource-order.mjs", file);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "complete App Plan Markdown using standardized template passes", status: "pass" });

  const semanticEquivalentPlan = appPlanTemplate
    .replaceAll("#### Submission Form Fields", "#### Submission fields")
    .replaceAll("##### Task Form Fields", "##### Task page fields")
    .replace(
      "Form report is a standalone Yeeflow resource type created from a specific Approval form. Do not merge Form report planning with Dashboard page planning or Data List view planning.",
      "Form reports are independent approval-based resources created from a specific Approval form and are separate from Dashboard/page planning and Data List view planning.",
    )
    .replaceAll("Do not invent unsupported", "Unsupported shapes should not be generated as")
    .replaceAll("#### Sub List List Actions", "#### Sub List actions")
    .replaceAll("No custom Sub List actions required", "No Sub List actions are needed");
  file = writeFixture(tempDir, "app-plan-semantic-equivalent-required-wording.md", semanticEquivalentPlan);
  output = runValidator("scripts/validate-app-plan-resource-order.mjs", file);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "App Plan semantic equivalents for required wording pass", status: "pass" });

  const noDashboardPlan = replaceSection(
    appPlanTemplate,
    "## 14. Dashboard Pages Plan",
    "## 15. Application Navigation Plan",
    "## 14. Dashboard Pages Plan\n\nDashboard will show dashboard information.",
  );
  file = writeFixture(tempDir, "app-plan-missing-dashboard-pages-plan.md", noDashboardPlan);
  output = runValidator("scripts/validate-app-plan-resource-order.mjs", file);
  assert.equal(output.report.status, "fail");
  expectFinding(output.report, "APP_PLAN_DASHBOARD_SECTIONS_MISSING");
  expectFinding(output.report, "APP_PLAN_DASHBOARD_CONTROL_TYPE_PLANNING_MISSING");
  results.push({ case: "App Plan missing detailed Dashboard Pages Plan fails", status: "pass" });

  const noLegalControlPlan = appPlanTemplate.replace(
    "Summary / KPI card, Data Filter, Collection, Data table, Kanban, Vertical Timeline, Horizontal Timeline, Text / Heading, Button / action button, Container, Grid / flex grid, Chart / Data analytics if supported/proof-required",
    "Dashboard content",
  );
  file = writeFixture(tempDir, "app-plan-dashboard-no-legal-control.md", noLegalControlPlan);
  output = runValidator("scripts/validate-app-plan-resource-order.mjs", file);
  assert.equal(output.report.status, "fail");
  expectFinding(output.report, "APP_PLAN_DASHBOARD_CONTROL_TYPE_PLANNING_MISSING");
  results.push({ case: "App Plan Dashboard planning without legal Yeeflow control type categories fails", status: "pass" });

  const implementationLeakPlan = appPlanTemplate.replace(
    "Runtime proof required:",
    "Runtime proof required:\n- Implementation leak: ListID: LIST-REQ, PageID: 2054181564731764736, actionTypeCode: 5, attrs.data.list = \"LIST-REQ\"",
  );
  file = writeFixture(tempDir, "app-plan-dashboard-runtime-leakage.md", implementationLeakPlan);
  output = runValidator("scripts/validate-app-plan-resource-order.mjs", file);
  assert.equal(output.report.status, "fail");
  expectFinding(output.report, "APP_PLAN_DASHBOARD_LOW_LEVEL_ID_LEAK");
  expectFinding(output.report, "APP_PLAN_DASHBOARD_ACTIONTYPECODE_LEAK");
  expectFinding(output.report, "APP_PLAN_DASHBOARD_JSON_PROPERTY_PATH_LEAK");
  results.push({ case: "App Plan containing runtime IDs action codes and property paths fails", status: "pass" });

  console.log(JSON.stringify({ status: "pass", results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

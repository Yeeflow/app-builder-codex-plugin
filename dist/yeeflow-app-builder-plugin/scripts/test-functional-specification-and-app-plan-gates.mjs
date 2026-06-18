#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();

function run(script, file) {
  const result = spawnSync(process.execPath, [script, file, "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  let report;
  try {
    report = JSON.parse(result.stdout || "{}");
  } catch (error) {
    throw new Error(`Could not parse ${script} output: ${error.message}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
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

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "functional-spec-app-plan-gates-"));
const results = [];

try {
  let output = run("scripts/validate-functional-specification.mjs", "docs/standards/functional-specification-standard-template.md");
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "canonical Functional Specification template passes", status: "pass" });

  output = run("scripts/validate-app-plan-resource-order.mjs", "docs/standards/app-plan-standard-template.md");
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "canonical App Plan template passes", status: "pass" });

  const badSpec = writeFixture(tempDir, "bad-spec.md", `
# Broken - Functional Specification

## 1. Specification Status
## 2. Source Input Summary
## 3. Requirement Interpretation Method
## 4. Business Purpose
## 5. Target Users and Business Roles
## 6. Business Objects and Data Concepts
No objects here.
## 8. Business Process Overview
## 9. Status Lifecycles
## 10. Approval and Review Requirements
## 11. Data Entry and Form Requirements
## 12. Workflow, Automation, and Action Requirements
## 13. Reporting, Dashboard, and Analytics Requirements
## 14. Document and Attachment Requirements
## 15. AI, Copilot, and Intelligent Assistance Requirements
## 16. Integration Requirements
## 17. Permissions and Access Requirements
## 18. UI and Experience Requirements
## 19. Business Decision Gates
## 20. Assumptions
## 21. Risks, Constraints, and Unknowns
## 22. Functional Specification Completeness Review
## 23. Readiness for App Plan
`);
  output = run("scripts/validate-functional-specification.mjs", badSpec);
  assert.equal(output.report.status, "fail");
  expectFinding(output.report, "FUNCTIONAL_SPEC_REQUIRED_HEADING_MISSING");
  results.push({ case: "Functional Specification missing relationships section fails", status: "pass" });

  const badPlan = writeFixture(tempDir, "bad-plan.md", `
# Broken - Yeeflow App Plan

## 1. Plan Status
## 2. Requirement-to-Yeeflow Resource Mapping Summary
## 3. Resource Generation Order
1. Dashboard pages
2. Data lists and Document libraries
## 4. Data Lists and Document Libraries Plan
## 5. Approval Forms Plan
## 6. Form Reports Plan
Form report is a Dashboard summary.
## 7. Schedule Workflows Plan
## 8. AI Agents Plan
## 9. Copilots Plan
## 10. Custom Data List Forms Plan
## 11. Data List Workflows Plan
## 12. Notifications Plan
## 13. Data List Views Plan
## 14. Dashboard Pages Plan
## 15. Application Navigation Plan
## 16. Target Users, Roles, Groups, and Permissions
## 17. Plugin Capability and Standards Compliance
## 18. Generation Contract and Hard Gates
## 19. Validation Plan
## 20. Proof Boundary
## 21. Assumptions
## 22. Deferred or Runtime-Proof Items
## 23. Recommended Next Prompt
`);
  output = run("scripts/validate-app-plan-resource-order.mjs", badPlan);
  assert.equal(output.report.status, "fail");
  expectFinding(output.report, "APP_PLAN_RESOURCE_ORDER_ITEM_MISSING");
  expectFinding(output.report, "APP_PLAN_DATALIST_PLACEHOLDER_MISSING");
  results.push({ case: "App Plan missing standard resource order and placeholders fails", status: "pass" });

  console.log(JSON.stringify({ status: "pass", results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

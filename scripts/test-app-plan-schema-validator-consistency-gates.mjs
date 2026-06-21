#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();

function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  let report;
  try {
    report = JSON.parse(result.stdout || "{}");
  } catch (error) {
    throw new Error(`Could not parse validator output: ${error.message}\ncommand: node ${args.join(" ")}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  }
  return { result, report };
}

function writeFixture(dir, name, text) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, `${text.trim()}\n`);
  return file;
}

function expectPass(output, label) {
  assert.equal(output.report.status, "pass", `${label} failed:\n${JSON.stringify(output.report.findings, null, 2)}`);
  assert.equal(output.result.status, 0, `${label} exited with ${output.result.status}:\n${output.result.stderr}`);
}

function expectFail(output, code, label) {
  assert.equal(output.report.status, "fail", `${label} unexpectedly passed`);
  assert.equal(
    (output.report.findings || []).some((finding) => finding.code === code),
    true,
    `${label} expected ${code}; findings:\n${JSON.stringify(output.report.findings, null, 2)}`,
  );
}

function replaceTitle(text, title) {
  return text.replace(/^#\s+.+$/m, title);
}

function removeDashboardSubtable(text, heading) {
  const pattern = new RegExp(`\\n#### ${heading}[\\s\\S]*?(?=\\n#### |\\n## 15\\.)`, "i");
  return text.replace(pattern, "");
}

const appTemplate = fs.readFileSync(path.join(ROOT, "docs/standards/app-plan-standard-template.md"), "utf8");
const functionalTemplate = fs.readFileSync(path.join(ROOT, "docs/standards/functional-specification-standard-template.md"), "utf8");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "app-plan-schema-validator-consistency-"));
const results = [];

try {
  const officeSpec = replaceTitle(functionalTemplate, "# Office Asset Loan Management - Functional Specification")
    .replace("Direct user request:", "Direct user request: Manage office asset loan intake, approval, issue, return, overdue follow-up, and audit reporting.")
    .replace("Business problem:", "Business problem: Shared office assets are loaned without consistent approval, due-date tracking, return evidence, or overdue escalation.")
    .replace("Target users:", "Target users: employees, asset custodians, department managers, finance reviewers, and operations leaders.");
  let file = writeFixture(tempDir, "functional-specification.md", officeSpec);
  let output = run(["scripts/validate-functional-specification.mjs", file, "--json"]);
  expectPass(output, "Office Asset Loan style Functional Specification with canonical sections");
  results.push({ case: "generated Office Asset Loan style Functional Specification with all canonical sections passes", status: "pass" });

  const officePlan = replaceTitle(appTemplate, "# Office Asset Loan Management - Yeeflow App Plan")
    .replace("Application name:", "Application name: Office Asset Loan Management")
    .replace("Functional specification path:", "Functional specification path: functional-specification.md")
    .replace("Planning plugin:", "Planning plugin: yeeflow-app-builder@yeeflow")
    .replace("Plugin version:", "Plugin version: 0.8.0");
  file = writeFixture(tempDir, "yeeflow-app-plan.md", officePlan);
  const templateOutput = run(["scripts/validate-app-plan-template.mjs", file, "--json"]);
  const resourceOrderOutput = run(["scripts/validate-app-plan-resource-order.mjs", file, "--json"]);
  expectPass(templateOutput, "canonical primary yeeflow-app-plan.md template validator");
  expectPass(resourceOrderOutput, "canonical primary yeeflow-app-plan.md resource-order validator");
  assert.equal(templateOutput.report.schema, "yeeflow-app-plan-resource-order");
  results.push({ case: "template validator and resource-order validator both accept the same primary Yeeflow App Plan Markdown", status: "pass" });

  file = writeFixture(tempDir, "missing-dashboard-subtable.md", removeDashboardSubtable(officePlan, "Summary Metrics"));
  output = run(["scripts/validate-app-plan-resource-order.mjs", file, "--json"]);
  expectFail(output, "APP_PLAN_DASHBOARD_SUMMARY_METRICS_MISSING", "App Plan missing Dashboard Pages Plan subtables");
  results.push({ case: "App Plan missing required Dashboard Pages Plan subtables fails", status: "pass" });

  file = writeFixture(tempDir, "legal-dashboard-control-planning.md", officePlan);
  output = run(["scripts/validate-app-plan-resource-order.mjs", file, "--json"]);
  expectPass(output, "Dashboard Pages Plan with legal control-type planning and no runtime IDs");
  results.push({ case: "Dashboard Pages Plan with legal control-type planning and no runtime IDs passes", status: "pass" });

  const lowLevelPlan = officePlan.replace(
    "#### Dashboard Filters",
    "Dashboard implementation leak: ListID: LIST-ASSETS, PageID: 2054181564731764736, actionTypeCode: 5, attrs.data.list = \"LIST-ASSETS\".\n\n#### Dashboard Filters",
  );
  file = writeFixture(tempDir, "runtime-id-leakage.md", lowLevelPlan);
  output = run(["scripts/validate-app-plan-resource-order.mjs", file, "--json"]);
  expectFail(output, "APP_PLAN_DASHBOARD_LOW_LEVEL_ID_LEAK", "App Plan containing runtime IDs/action codes/property paths");
  assert.equal((output.report.findings || []).some((finding) => finding.code === "APP_PLAN_DASHBOARD_ACTIONTYPECODE_LEAK"), true);
  assert.equal((output.report.findings || []).some((finding) => finding.code === "APP_PLAN_DASHBOARD_JSON_PROPERTY_PATH_LEAK"), true);
  results.push({ case: "App Plan containing ListID/PageID/actionTypeCode/property paths fails", status: "pass" });

  const guardrailPlan = officePlan.replace(
    "Do not invent unsupported controls, Dynamic controls, field types, workflow node types, variable types, action shapes, property paths, bindings, or configuration shapes.",
    "Do not invent unsupported controls, Dynamic controls, field types, workflow node types, variable types, action shapes, property paths, bindings, or configuration shapes. Unsupported control shapes are blockers unless marked runtime-proof-required, export-learning-required, or deferred.",
  );
  file = writeFixture(tempDir, "negative-guardrail-wording.md", guardrailPlan);
  output = run(["scripts/validate-generation-readiness-review.mjs", "--plan", file, "--json"]);
  expectPass(output, "negative guardrail wording generation-readiness check");
  output = run(["scripts/validate-app-plan-resource-order.mjs", file, "--json"]);
  expectPass(output, "negative guardrail wording resource-order check");
  results.push({ case: "negative guardrail wording does not trigger unsupported-control false positive", status: "pass" });

  const legacyTitlePlan = replaceTitle(appTemplate, "# Office Asset Loan Management - Yeeflow Application Plan");
  file = writeFixture(tempDir, "legacy-application-plan-title.md", legacyTitlePlan);
  output = run(["scripts/validate-app-plan-template.mjs", file, "--json"]);
  expectFail(output, "APP_PLAN_TITLE_HEADING_MISSING", "legacy Yeeflow Application Plan schema as primary artifact");
  results.push({ case: "conflicting Yeeflow Application Plan primary schema fails", status: "pass" });

  console.log(JSON.stringify({ status: "pass", results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

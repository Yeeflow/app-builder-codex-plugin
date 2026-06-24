#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MATERIALIZER = path.join(ROOT, "scripts/materialize-full-app-generated-final.mjs");
const SCHEMA_VALIDATOR = path.join(ROOT, "scripts/validate-standard-package-schema.mjs");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "full-app-materializer-"));
const cases = [];

try {
  const spec = path.join(tempDir, "functional-specification.md");
  const plan = path.join(tempDir, "yeeflow-app-plan.md");
  fs.writeFileSync(spec, [
    "# Functional Specification: Office Asset Loan Management",
    "",
    "| Application Name | Office Asset Loan Management |",
    "",
    "Business defaults approval status: user-default-approved-for-generation.",
  ].join("\n"));
  fs.writeFileSync(plan, [
    "# Yeeflow App Plan: Office Asset Loan Management",
    "",
    "## Plan Status",
    "",
    "Business defaults approval status: user-default-approved-for-generation.",
  ].join("\n"));

  expectCode("missing API-issued ID source fails", [
    MATERIALIZER,
    "--functional-spec", spec,
    "--app-plan", plan,
    "--out-dir", path.join(tempDir, "no-ids"),
    "--json",
  ], "FULL_APP_MATERIALIZATION_API_ID_SOURCE_REQUIRED");

  const outDir = path.join(tempDir, "fixture-materialized");
  const materialized = expectPass("fixture mode materializes generated-final artifacts", [
    MATERIALIZER,
    "--functional-spec", spec,
    "--app-plan", plan,
    "--out-dir", outDir,
    "--allow-fixture-api-ids-for-tests",
    "--json",
  ]);
  const report = JSON.parse(materialized.stdout);
  assert.equal(report.status, "pass");
  assert.equal(report.signingEligible, false);
  assert.equal(fs.existsSync(report.outputs.package), true, "package exists");
  assert.equal(fs.existsSync(report.outputs.decodedResource), true, "decoded resource exists");
  assert.equal(fs.existsSync(report.outputs.idProvenance), true, "id provenance exists");
  assert.equal(fs.existsSync(report.outputs.generationReport), true, "generation report exists");
  assert.match(fs.readFileSync(report.outputs.generationReport, "utf8"), /No signing was attempted/);
  assert.match(fs.readFileSync(report.outputs.idProvenance, "utf8"), /api-generated-fixture-for-tests/);
  cases.push("materialized outputs include package, decoded resource, provenance, and generation report");

  expectPass("materialized package passes canonical schema validation", [
    SCHEMA_VALIDATOR,
    report.outputs.package,
    "--schema-only",
  ]);

  const wrapper = JSON.parse(fs.readFileSync(report.outputs.package, "utf8"));
  assert.equal(wrapper.Sign, "", "materializer must not sign package");
  assert.equal(wrapper.AppID, 41, "materializer emits Flowcraft YAPK wrapper");
  assert.equal(typeof wrapper.Resource, "string");
  cases.push("materializer keeps signing/install boundary clean");

  const apiIdManifest = path.join(tempDir, "api-issued-ids.json");
  fs.writeFileSync(apiIdManifest, JSON.stringify({
    ids: [
      "920000000000000001",
      "920000000000000002",
      "920000000000000003",
      "920000000000000004",
      "920000000000000005",
      "920000000000000006",
    ],
  }, null, 2));
  const apiOut = path.join(tempDir, "api-materialized");
  const apiRun = expectPass("API ID manifest mode can emit schema-smoke artifacts only for trivial plans", [
    MATERIALIZER,
    "--functional-spec", spec,
    "--app-plan", plan,
    "--out-dir", apiOut,
    "--api-id-manifest", apiIdManifest,
    "--tenant-id", "1234567890123456",
    "--json",
  ]);
  const apiReport = JSON.parse(apiRun.stdout);
  assert.equal(apiReport.signingEligible, false);
  assert.equal(JSON.parse(fs.readFileSync(apiReport.outputs.package, "utf8")).TenantID, "1234567890123456");
  assert.match(fs.readFileSync(apiReport.outputs.generationReport, "utf8"), /Generated-final preflight is required before any signing request/);
  assert.match(fs.readFileSync(apiReport.outputs.idProvenance, "utf8"), /"allocationSource": "api-generated"/);
  cases.push("API ID manifest mode writes schema-smoke artifacts without signing");

  const resourcePlan = path.join(tempDir, "resource-yeeflow-app-plan.md");
  fs.writeFileSync(resourcePlan, [
    "# Yeeflow App Plan: Office Asset Loan Management",
    "",
    "## Plan Status",
    "",
    "Business defaults approval status: user-default-approved-for-generation.",
    "",
    "## 4. Data Lists and Document Libraries Plan",
    "",
    "### 4.1 Office Assets",
    "",
    "| Field Name | Type | Purpose |",
    "| --- | --- | --- |",
    "| Asset Tag | Text | Identify asset. |",
    "| Assigned To | User | Current assignee. |",
    "",
    "### 4.2 Loan Transactions",
    "",
    "| Field Name | Type | Purpose |",
    "| --- | --- | --- |",
    "| Due Date | Date | Expected return. |",
    "| Status | Choice | Loan status. |",
    "",
    "### 4.3 Asset Categories",
    "",
    "### 4.4 Return Inspections",
    "",
    "## 5. Approval Forms Plan",
    "",
    "### 5.1 Asset Loan Request",
    "",
    "### 5.2 Asset Return Review",
    "",
    "## 6. Form Reports Plan",
    "",
    "| Form Report Name | Related Approval Form | Purpose |",
    "| --- | --- | --- |",
    "| Asset Loan Request Report | Asset Loan Request | Loan approval reporting. |",
    "",
    "## 10. Custom Data List Forms Plan",
    "",
    "| Form Name | Form Type | Purpose |",
    "| --- | --- | --- |",
    "| Asset Quick View | View item | Compact asset details. |",
    "| Loan Edit Form | Edit item | Coordinator loan edits. |",
    "",
    "## 14. Dashboard Pages Plan",
    "",
    "### 14.1 Asset Loan Operations Dashboard",
    "",
    "#### Dashboard Sections",
    "| Section Name | Data Source | Selected Record Display Control |",
    "| --- | --- | --- |",
    "| Active loans | Loan Transactions | collection_control_grid_table |",
    "| Availability cards | Office Assets | collection_control_responsive_card_grid |",
    "",
    "### 14.2 Overdue Monitor",
    "",
    "## 15. Application Navigation Plan",
    "",
    "| Group | Item | Target |",
    "| --- | --- | --- |",
    "| Dashboards | Asset Loan Operations Dashboard | Dashboard page |",
    "| Requests | Asset Loan Request | Approval form |",
    "| Administration | Office Assets | Data list |",
  ].join("\n"));
  const resourceOut = path.join(tempDir, "resource-plan");
  const failClosed = expectCode("nontrivial App Plan fails closed instead of placeholder package", [
    MATERIALIZER,
    "--functional-spec", spec,
    "--app-plan", resourcePlan,
    "--out-dir", resourceOut,
    "--api-id-manifest", apiIdManifest,
    "--json",
  ], "FULL_APP_MATERIALIZATION_RESOURCE_GRAPH_NOT_IMPLEMENTED");
  const failClosedReport = JSON.parse(failClosed.stdout);
  assert.equal(failClosedReport.signingEligible, false);
  assert.equal(fs.existsSync(resourceOut), false, "nontrivial fail-closed path must not emit an output directory or package");
  const blocker = failClosedReport.findings.find((finding) => finding.code === "FULL_APP_MATERIALIZATION_RESOURCE_GRAPH_NOT_IMPLEMENTED");
  assert.deepEqual(blocker.planned, {
    dataLists: 4,
    approvalForms: 2,
    formReports: 1,
    customForms: 2,
    dashboards: 2,
    navigationGroups: 3,
  });
  assert.equal(blocker.missingResourceGraph.length, 6);
  assert.deepEqual(blocker.plannedResources.dataLists, ["Office Assets", "Loan Transactions", "Asset Categories", "Return Inspections"]);
  assert.deepEqual(blocker.plannedResources.dashboards, ["Asset Loan Operations Dashboard", "Overdue Monitor"]);
  cases.push("nontrivial App Plan reports exact missing resource graph without over-counting field/section rows");

  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function expectPass(name, args) {
  const result = run(args);
  assert.equal(result.status, 0, `${name} should pass\nstdout=${result.stdout}\nstderr=${result.stderr}`);
  cases.push(name);
  return result;
}

function expectCode(name, args, code) {
  const result = run(args);
  assert.notEqual(result.status, 0, `${name} should fail`);
  assert.match(`${result.stdout}\n${result.stderr}`, new RegExp(code), `${name} should include ${code}`);
  cases.push(name);
  return result;
}

function run(args) {
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
}

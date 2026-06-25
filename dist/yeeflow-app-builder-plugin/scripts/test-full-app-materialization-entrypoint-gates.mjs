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
const COMPLETENESS_VALIDATOR = path.join(ROOT, "scripts/validate-generated-final-resource-completeness.mjs");
const ID_PROVENANCE_VALIDATOR = path.join(ROOT, "scripts/validate-yapk-id-provenance.mjs");
const NAVIGATION_VALIDATOR = path.join(ROOT, "scripts/validate-yapk-navigation-runtime-metadata.mjs");
const DATA_LIST_SCHEMA_VALIDATOR = path.join(ROOT, "scripts/validate-data-list-system-schema.mjs");
const EXPORT_SHAPE_VALIDATOR = path.join(ROOT, "scripts/validate-generated-yapk-export-shape.mjs");
const DASHBOARD_LAYOUT_VALIDATOR = path.join(ROOT, "scripts/validate-dashboard-page-layout-template.mjs");
const DASHBOARD_DATASET_VALIDATOR = path.join(ROOT, "scripts/validate-dashboard-dataset-presentation-golden-references.mjs");
const DASHBOARD_GOLDEN_VALIDATOR = path.join(ROOT, "scripts/validate-dashboard-golden-reference-conformance.mjs");
const DASHBOARD_HARD_GATES_VALIDATOR = path.join(ROOT, "scripts/validate-dashboard-generation-hard-gates.mjs");
const SUMMARY_CONTRACT_VALIDATOR = path.join(ROOT, "scripts/inspect-dashboard-summary-control-contract.mjs");
const FIRST_GENERATION_PREFLIGHT = path.join(ROOT, "scripts/yapk-first-generation-preflight.mjs");
const YAPK_PACKAGE_VALIDATOR = path.join(ROOT, "validate-yapk-package.js");
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
    ids: Array.from({ length: 120 }, (_, index) => String(920000000000000001n + BigInt(index))),
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
    "### 10.1 Office Assets",
    "",
    "| Form Name | Form Type | Purpose |",
    "| --- | --- | --- |",
    "| Asset Quick View | View item | Compact asset details. |",
    "| Asset Quick View | 1 | Title field row that must not create a duplicate form. |",
    "",
    "#### Data List Form Layout Template Selection",
    "| Data List or Library | Custom Form | Form Usage | Selected Data List Form Layout Template | Business Sections Needed | Related Data / Analytics Needed | Selection Reason | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Office Assets | Asset Quick View | View | data_list_form_layout_view_item_v1_1 | Page title, KPI, current item details | Related loan context | View item requires current record and related context | Generated-final validation |",
    "",
    "### 10.2 Loan Transactions",
    "",
    "| Form Name | Form Type | Purpose |",
    "| --- | --- | --- |",
    "| Loan Edit Form | Edit item | Coordinator loan edits. |",
    "| Loan Edit Form | 1 | Title field row that must not create a duplicate form. |",
    "",
    "#### Data List Form Layout Template Selection",
    "| Data List or Library | Custom Form | Form Usage | Selected Data List Form Layout Template | Business Sections Needed | Related Data / Analytics Needed | Selection Reason | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Loan Transactions | Loan Edit Form | Edit | data_list_form_layout_new_edit_v1_1 | Current item edit fields | None | Edit item focuses on current record editing | Generated-final validation |",
    "",
    "## 14. Dashboard Pages Plan",
    "",
    "### 14.1 Asset Loan Operations Dashboard",
    "",
    "#### Dashboard Sections",
    "| Section Name | Data Source | Selected Record Display Control |",
    "| --- | --- | --- |",
    "| Active loans | Loan Transactions | collection_control_grid_table_with_multiselect |",
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
    "| Reports | Asset Loan Request Report | Form report |",
    "| Administration | Office Assets | Data list |",
  ].join("\n"));
  const resourceOut = path.join(tempDir, "resource-plan");
  const resourceRun = expectPass("nontrivial App Plan materializes minimal resource graph instead of placeholder package", [
    MATERIALIZER,
    "--functional-spec", spec,
    "--app-plan", resourcePlan,
    "--out-dir", resourceOut,
    "--api-id-manifest", apiIdManifest,
    "--json",
  ]);
  const resourceReport = JSON.parse(resourceRun.stdout);
  assert.equal(resourceReport.status, "pass");
  assert.equal(resourceReport.mode, "minimal-resource-graph");
  assert.equal(resourceReport.signingEligible, false);
  assert.equal(fs.existsSync(resourceReport.outputs.package), true, "nontrivial materializer writes package");
  assert.equal(fs.existsSync(resourceReport.outputs.decodedResource), true, "nontrivial materializer writes decoded resource");
  const resourceGenerationReport = JSON.parse(fs.readFileSync(resourceReport.outputs.generationReport, "utf8"));
  assert.deepEqual(resourceGenerationReport.plannedResourceDemand.counts, {
    dataLists: 4,
    approvalForms: 2,
    formReports: 1,
    customForms: 2,
    dashboards: 2,
    navigationGroups: 4,
  });
  assert.deepEqual(resourceGenerationReport.plannedResourceDemand.resources.dataLists, ["Office Assets", "Loan Transactions", "Asset Categories", "Return Inspections"]);
  assert.deepEqual(resourceGenerationReport.plannedResourceDemand.resources.dashboards, ["Asset Loan Operations Dashboard", "Overdue Monitor"]);
  const decodedResource = JSON.parse(fs.readFileSync(resourceReport.outputs.decodedResource, "utf8"));
  assert.equal(decodedResource.Childs.length, 4, "planned data lists are materialized");
  assert.equal(decodedResource.Forms.length, 2, "planned approval forms are materialized");
  assert.equal(decodedResource.FormNewReports.length, 1, "planned form reports are materialized");
  assert.equal(decodedResource.Pages.length, 2, "planned dashboards are materialized");
  assert.equal(decodedResource.Pages.some((page) => page.Title === "Getting Started Dashboard"), false, "nontrivial path must not emit placeholder dashboard");
  assert.equal(new Set(decodedResource.Childs.map((child) => String(child.List.ListID))).size, decodedResource.Childs.length, "data list IDs must not collapse through JavaScript number precision");
  assert.equal(new Set(decodedResource.Pages.map((page) => String(page.LayoutID))).size, decodedResource.Pages.length, "dashboard LayoutIDs must be unique");
  for (const page of decodedResource.Pages) {
    assert.equal(String(page.LayoutInResources[0].ID), String(page.LayoutID), "dashboard LayoutInResources[0].ID must equal LayoutID");
    assert.equal(String(page.LayoutInResources[0].RefId), String(page.LayoutID), "dashboard LayoutInResources[0].RefId must equal LayoutID");
  }
  assert.match(decodedResource.ListSet.LayoutView, /Dashboards/);
  const resourceFixtureOut = path.join(tempDir, "resource-plan-fixture");
  const resourceFixtureRun = expectPass("nontrivial fixture mode allocates enough synthetic API-shaped IDs", [
    MATERIALIZER,
    "--functional-spec", spec,
    "--app-plan", resourcePlan,
    "--out-dir", resourceFixtureOut,
    "--allow-fixture-api-ids-for-tests",
    "--json",
  ]);
  const resourceFixtureReport = JSON.parse(resourceFixtureRun.stdout);
  assert.equal(resourceFixtureReport.status, "pass");
  assert.equal(resourceFixtureReport.mode, "fixture-regression");
  assert.equal(resourceFixtureReport.signingEligible, false);
  assert.match(fs.readFileSync(resourceFixtureReport.outputs.idProvenance, "utf8"), /api-generated-fixture-for-tests/);
  assert.match(decodedResource.ListSet.LayoutView, /Requests/);
  assert.match(decodedResource.ListSet.LayoutView, /Administration/);

  expectPass("nontrivial generated package passes canonical schema validation", [
    SCHEMA_VALIDATOR,
    resourceReport.outputs.package,
    "--schema-only",
  ]);
  expectPass("nontrivial generated package satisfies App Plan resource completeness", [
    COMPLETENESS_VALIDATOR,
    "--plan", resourcePlan,
    "--package", resourceReport.outputs.package,
  ]);
  expectPass("nontrivial generated package passes ID provenance validation", [
    ID_PROVENANCE_VALIDATOR,
    "--package", resourceReport.outputs.package,
    "--manifest", resourceReport.outputs.idProvenance,
  ]);
  expectPass("nontrivial generated package passes runtime navigation metadata validation", [
    NAVIGATION_VALIDATOR,
    "--package", resourceReport.outputs.package,
    "--id-provenance", resourceReport.outputs.idProvenance,
  ]);
  expectPass("nontrivial generated package passes generated data-list schema validation", [
    DATA_LIST_SCHEMA_VALIDATOR,
    resourceReport.outputs.package,
    "--strict-generated-list",
  ]);
  expectPass("nontrivial generated package passes default YAPK package validation", [
    YAPK_PACKAGE_VALIDATOR,
    resourceReport.outputs.package,
  ]);
  expectPass("nontrivial generated package passes generated YAPK export-shape validation", [
    EXPORT_SHAPE_VALIDATOR,
    "--package", resourceReport.outputs.package,
  ]);
  expectPass("nontrivial generated package passes Dashboard Page Layouts v1.1 validation", [
    DASHBOARD_LAYOUT_VALIDATOR,
    "--package", resourceReport.outputs.package,
  ]);
  expectPass("nontrivial generated package passes Dashboard Collection template materialization validation", [
    DASHBOARD_DATASET_VALIDATOR,
    "--app-plan", resourcePlan,
    "--package", resourceReport.outputs.package,
  ]);
  expectPass("nontrivial generated package passes Dashboard Golden Reference validation", [
    DASHBOARD_GOLDEN_VALIDATOR,
    "--package", resourceReport.outputs.package,
  ]);
  expectPass("nontrivial generated package passes aggregate Dashboard hard gates", [
    DASHBOARD_HARD_GATES_VALIDATOR,
    "--plan", resourcePlan,
    "--package", resourceReport.outputs.package,
  ]);
  expectPass("nontrivial generated package passes Dashboard Summary hidden-host and field-metadata contract", [
    SUMMARY_CONTRACT_VALIDATOR,
    "--package", resourceReport.outputs.package,
  ]);
  expectPass("nontrivial generated package passes first-generation preflight including Summary contract", [
    FIRST_GENERATION_PREFLIGHT,
    "--package", resourceReport.outputs.package,
    "--plan", resourcePlan,
    "--json",
  ]);
  cases.push("nontrivial App Plan materializes data lists, approval forms, reports, dashboards, custom forms, and navigation without placeholder output");
  cases.push("nontrivial App Plan materialization passes ID provenance, runtime navigation, data-list schema, YAPK package, export-shape, Dashboard v1.1, Dashboard Collection template, Golden Reference, aggregate Dashboard hard gates, Summary contract, and first-generation preflight");

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

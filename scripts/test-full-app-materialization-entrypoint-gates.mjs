#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateApprovalFormFieldsTemplate } from "./validate-approval-form-fields-template.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MATERIALIZER = path.join(ROOT, "scripts/materialize-full-app-generated-final.mjs");
const SCHEMA_VALIDATOR = path.join(ROOT, "scripts/validate-standard-package-schema.mjs");
const APPLICATION_CONTROL_STYLE_VALIDATOR = path.join(ROOT, "scripts/validate-application-control-style-template.mjs");
const COMPLETENESS_VALIDATOR = path.join(ROOT, "scripts/validate-generated-final-resource-completeness.mjs");
const ID_PROVENANCE_VALIDATOR = path.join(ROOT, "scripts/validate-yapk-id-provenance.mjs");
const NAVIGATION_VALIDATOR = path.join(ROOT, "scripts/validate-yapk-navigation-runtime-metadata.mjs");
const LIVE_INSTALL_READINESS_VALIDATOR = path.join(ROOT, "scripts/validate-yapk-live-install-readiness.mjs");
const DATA_LIST_SCHEMA_VALIDATOR = path.join(ROOT, "scripts/validate-data-list-system-schema.mjs");
const BIT_FIELD_VALIDATOR = path.join(ROOT, "scripts/validate-yapk-bit-field-controls.mjs");
const EXPORT_SHAPE_VALIDATOR = path.join(ROOT, "scripts/validate-generated-yapk-export-shape.mjs");
const APPROVAL_FORM_FIELDS_VALIDATOR = path.join(ROOT, "scripts/validate-approval-form-fields-template.mjs");
const APPROVAL_WORKFLOW_VALIDATOR = path.join(ROOT, "scripts/validate-approval-workflow-publish-readiness.mjs");
const DASHBOARD_LAYOUT_VALIDATOR = path.join(ROOT, "scripts/validate-dashboard-page-layout-template.mjs");
const DASHBOARD_DATASET_VALIDATOR = path.join(ROOT, "scripts/validate-dashboard-dataset-presentation-golden-references.mjs");
const DATA_ANALYTICS_VALIDATOR = path.join(ROOT, "scripts/validate-data-analytics-golden-references.mjs");
const DATA_TABLE_VALIDATOR = path.join(ROOT, "scripts/validate-data-table-golden-references.mjs");
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
    "# Office Asset Loan Management - Yeeflow App Plan",
    "",
    "## Plan Status",
    "",
    "- Application name: Office Asset Loan Management",
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
  assert.equal(report.materializerSigningEligible, false);
  assert.equal(report.preflightEligibleForSigning, null);
  assert.equal(report.signingReadinessSource, "not-run");
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
  expectPass("materialized package includes default Soft outline application control style", [
    APPLICATION_CONTROL_STYLE_VALIDATOR,
    "--package", report.outputs.package,
  ]);

  const wrapper = JSON.parse(fs.readFileSync(report.outputs.package, "utf8"));
  assert.equal(wrapper.Sign, "", "materializer must not sign package");
  assert.equal(wrapper.AppID, 41, "materializer emits Flowcraft YAPK wrapper");
  assert.equal(wrapper.Title, "Office Asset Loan Management", "materializer must use the App Plan application name instead of the Markdown document title suffix");
  assert.equal(typeof wrapper.Resource, "string");
  cases.push("materializer keeps signing/install boundary clean");
  cases.push("materializer derives app title from App Plan Application name without appending the document heading suffix");

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
  assert.equal(apiReport.materializerSigningEligible, false);
  assert.equal(apiReport.preflightEligibleForSigning, null);
  assert.equal(apiReport.signingReadinessSource, "not-run");
  assert.equal(JSON.parse(fs.readFileSync(apiReport.outputs.package, "utf8")).TenantID, "1234567890123456");
  assert.match(fs.readFileSync(apiReport.outputs.generationReport, "utf8"), /Generated-final preflight is required before any signing request/);
  assert.match(fs.readFileSync(apiReport.outputs.idProvenance, "utf8"), /"allocationSource": "api-generated"/);
  expectPass("API materialized package includes default Soft outline application control style", [
    APPLICATION_CONTROL_STYLE_VALIDATOR,
    "--package", apiReport.outputs.package,
  ]);
  cases.push("API ID manifest mode writes schema-smoke artifacts without signing");

  const envTenantOut = path.join(tempDir, "env-tenant-materialized");
  const envTenantRun = expectPass("materializer uses YEEFLOW_TENANT_ID when --tenant-id is omitted", [
    MATERIALIZER,
    "--functional-spec", spec,
    "--app-plan", plan,
    "--out-dir", envTenantOut,
    "--api-id-manifest", apiIdManifest,
    "--json",
  ], { env: { ...process.env, YEEFLOW_TENANT_ID: "1234567890999999" } });
  const envTenantReport = JSON.parse(envTenantRun.stdout);
  assert.equal(JSON.parse(fs.readFileSync(envTenantReport.outputs.package, "utf8")).TenantID, "1234567890999999");
  cases.push("materializer resolves target TenantID from environment when explicitly available");

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
    "| Requires Approval | Boolean | Flag assets that require coordinator approval before checkout. |",
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
    "##### Submission Form Fields",
    "",
    "| Field Order | Business Label | Field Name | Exact Yeeflow Variable Type | Exact Yeeflow Control Type | Choice Values | Proof Label |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    "| 1 | Requester | Requester | User | identity-picker | | Generated-final validation |",
    "| 2 | Asset | Asset | Text | input | | Generated-final validation |",
    "| 3 | Business Purpose | BusinessPurpose | Multiple line | textarea | | Generated-final validation |",
    "| 4 | Purpose | Purpose | Multiple line text | textarea | | Generated-final validation |",
    "| 5 | Payment Terms | PaymentTerms | Choice | radio dropdown | Prepaid; Net 30; Net 60 | Generated-final validation |",
    "| 6 | Tax Number | TaxNumber | Text | input | | Generated-final validation |",
    "| 7 | Bank Name | BankName | Text | input | | Generated-final validation |",
    "| 8 | Bank Account | BankAccount | Text | input | | Generated-final validation |",
    "| 9 | Risk Self Assessment | RiskSelfAssessment | Choice | radio dropdown | Low; Medium; High | Generated-final validation |",
    "| 10 | Risk Explanation | RiskExplanation | Multiple line | textarea | | Generated-final validation |",
    "| 11 | Business License Attachment | BusinessLicenseAttachment | File | file upload | | Generated-final validation |",
    "| 12 | Bank Proof Attachment | BankProofAttachment | File | file upload | | Generated-final validation |",
    "",
    "##### Task Form Fields",
    "",
    "| Field Order | Business Label | Field Name | Exact Yeeflow Variable Type | Exact Yeeflow Control Type | Read Only | Proof Label |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    "| 1 | Requester | Requester | User | identity-picker | Yes | Generated-final validation |",
    "| 2 | Asset | Asset | Text | input | Yes | Generated-final validation |",
    "| 3 | Business Purpose | BusinessPurpose | Multiple line | textarea | Yes | Generated-final validation |",
    "| 4 | Decision Comment | DecisionComment | Text | input | Yes | Generated-final validation |",
    "",
    "#### Approval Form Fields Layout Template Selection",
    "| Approval Form | Form Page | Field Group | Selected Approval Form Fields Layout Template | Field Source | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Asset Loan Request | Submission form | Request fields | approval_form_fields_grid_2col_v1_1 | Submission fields | 2 | 2 | 1 | Business Purpose | None | Generated-final validation |",
    "| Asset Loan Request | Coordinator task form | Review fields | approval_form_fields_grid_2col_v1_1 | Task fields | 2 | 2 | 1 | Business Purpose | None | Generated-final validation |",
    "",
    "#### Approval Form Layout Template Selection",
    "| Approval Form | Form Page | Page Role | Selected Approval Form Layout Template | Business Sections Needed | Related Data Needed | Selection Reason | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Asset Loan Request | Submission form | Submission | approval_form_layout_submission_v1_1 | Page title and request fields | Current request data only | Submission captures requester-entered approval fields | Generated-final validation |",
    "| Asset Loan Request | Coordinator task form | Task | approval_form_layout_task_v1_1 | Page title, readonly request context, action/history section | Related loan context | Task reviewers need consistent readonly context and workflow action area | Generated-final validation |",
    "",
    "### 5.2 Asset Return Review",
    "",
    "##### Submission Form Fields",
    "",
    "| Field Order | Business Label | Field Name | Exact Yeeflow Variable Type | Exact Yeeflow Control Type | Choice Values | Proof Label |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    "| 1 | Loan Number | LoanNumber | Text | input | | Generated-final validation |",
    "| 2 | Return Condition | ReturnCondition | Choice | radio | Good; Damaged; Lost | Generated-final validation |",
    "| 3 | Workflow Proof Status | WorkflowProofStatus | Text | input | | Generated-final validation |",
    "",
    "##### Task Form Fields",
    "",
    "| Field Order | Business Label | Field Name | Exact Yeeflow Variable Type | Exact Yeeflow Control Type | Choice Values | Read Only | Proof Label |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    "| 1 | Loan Number | LoanNumber | Text | input | | Yes | Generated-final validation |",
    "| 2 | Return Condition | ReturnCondition | Choice | radio | Good; Damaged; Lost | Yes | Generated-final validation |",
    "| 3 | Reviewer Decision | ReviewerDecision | Choice | radio | Approve; Reject; Request Changes | No | Generated-final validation |",
    "| 4 | Workflow Proof Status | WorkflowProofStatus | Text | input | | Yes | Generated-final validation |",
    "",
    "#### Approval Form Fields Layout Template Selection",
    "| Approval Form | Form Page | Field Group | Selected Approval Form Fields Layout Template | Field Source | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Asset Return Review | Submission form | Return fields | approval_form_fields_grid_2col_v1_1 | Submission fields | 2 | 2 | 1 | None | None | Generated-final validation |",
    "| Asset Return Review | Coordinator task form | Review fields | approval_form_fields_grid_2col_v1_1 | Task fields | 2 | 2 | 1 | None | None | Generated-final validation |",
    "",
    "#### Approval Form Layout Template Selection",
    "| Approval Form | Form Page | Page Role | Selected Approval Form Layout Template | Business Sections Needed | Related Data Needed | Selection Reason | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Asset Return Review | Submission form | Submission | approval_form_layout_submission_v1_1 | Page title and return fields | Current return data only | Submission captures asset return details | Generated-final validation |",
    "| Asset Return Review | Coordinator task form | Task | approval_form_layout_task_v1_1 | Page title, readonly return context, action/history section | Related return context | Task reviewers need consistent readonly context and workflow action area | Generated-final validation |",
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
    "| Asset New/Edit Form | New/Edit item | Create and maintain office asset records. |",
    "| Asset Workbench Details | View item | Full-page workbench asset details. |",
    "| Asset Workbench Details | 1 | Title field row that must not create a duplicate form. |",
    "",
    "#### Data List Form Layout Template Selection",
    "| Data List or Library | Custom Form | Form Usage | Selected Data List Form Layout Template | Business Sections Needed | Related Data / Analytics Needed | Selection Reason | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Office Assets | Asset New/Edit Form | New/Edit | data_list_form_layout_new_edit_v1_1 | Current item edit fields | None | New/Edit item requires governed custom form routing | Generated-final validation |",
    "| Office Assets | Asset Workbench Details | View | data_list_form_layout_workbench | Page title, primary working area, right-side context | Related loan context and analytics | View item needs Full page workbench details | Generated-final validation |",
    "",
    "#### Form Fields Layout Template Selection",
    "| Data List or Library | Custom Form | Field Group | Selected Form Fields Layout Template | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Office Assets | Asset New/Edit Form | Basic information | data_list_form_fields_grid_v1_1 | 2 | 2 | 1 | Notes | None | Generated-final validation |",
    "| Office Assets | Asset Workbench Details | Basic information | data_list_form_fields_grid_v1_1 | 2 | 2 | 1 | Notes | None | Generated-final validation |",
    "",
    "### 10.2 Loan Transactions",
    "",
    "| Form Name | Form Type | Purpose |",
    "| --- | --- | --- |",
    "| Loan Edit Form | Edit item | Coordinator loan edits. |",
    "| Loan Transactions View | View item | Review loan transaction details. |",
    "| Loan Edit Form | 1 | Title field row that must not create a duplicate form. |",
    "",
    "#### Data List Form Layout Template Selection",
    "| Data List or Library | Custom Form | Form Usage | Selected Data List Form Layout Template | Business Sections Needed | Related Data / Analytics Needed | Selection Reason | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Loan Transactions | Loan Edit Form | New/Edit | data_list_form_layout_new_edit_v1_1 | Current item edit fields | None | New/Edit item focuses on current record editing | Generated-final validation |",
    "| Loan Transactions | Loan Transactions View | View | data_list_form_layout_view_item_v1_1 | Page title, current item details | Related asset context | View item requires custom form routing | Generated-final validation |",
    "",
    "#### Form Fields Layout Template Selection",
    "| Data List or Library | Custom Form | Field Group | Selected Form Fields Layout Template | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Loan Transactions | Loan Edit Form | Loan fields | data_list_form_fields_grid_v1_1 | 2 | 2 | 1 | Notes | None | Generated-final validation |",
    "| Loan Transactions | Loan Transactions View | Loan fields | data_list_form_fields_grid_v1_1 | 2 | 2 | 1 | Notes | None | Generated-final validation |",
    "",
    "### 10.3 Asset Categories",
    "",
    "| Form Name | Form Type | Purpose |",
    "| --- | --- | --- |",
    "| Asset Categories New/Edit Form | New/Edit item | Create and maintain asset category records. |",
    "| Asset Categories View Item | View item | Review asset category details. |",
    "",
    "#### Data List Form Layout Template Selection",
    "| Data List or Library | Custom Form | Form Usage | Selected Data List Form Layout Template | Business Sections Needed | Related Data / Analytics Needed | Selection Reason | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Asset Categories | Asset Categories New/Edit Form | New/Edit | data_list_form_layout_new_edit_v1_1 | Current item edit fields | None | New/Edit item requires governed custom form routing | Generated-final validation |",
    "| Asset Categories | Asset Categories View Item | View | data_list_form_layout_view_item_v1_1 | Page title, current item details | Related asset context | View item requires custom form routing | Generated-final validation |",
    "",
    "#### Form Fields Layout Template Selection",
    "| Data List or Library | Custom Form | Field Group | Selected Form Fields Layout Template | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Asset Categories | Asset Categories New/Edit Form | Category fields | data_list_form_fields_grid_v1_1 | 2 | 2 | 1 | Notes | None | Generated-final validation |",
    "| Asset Categories | Asset Categories View Item | Category fields | data_list_form_fields_grid_v1_1 | 2 | 2 | 1 | Notes | None | Generated-final validation |",
    "",
    "### 10.4 Return Inspections",
    "",
    "| Form Name | Form Type | Purpose |",
    "| --- | --- | --- |",
    "| Return Inspections New/Edit Form | New/Edit item | Create and maintain return inspection records. |",
    "| Return Inspections View Item | View item | Review return inspection details. |",
    "",
    "#### Data List Form Layout Template Selection",
    "| Data List or Library | Custom Form | Form Usage | Selected Data List Form Layout Template | Business Sections Needed | Related Data / Analytics Needed | Selection Reason | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Return Inspections | Return Inspections New/Edit Form | New/Edit | data_list_form_layout_new_edit_v1_1 | Current item edit fields | None | New/Edit item requires governed custom form routing | Generated-final validation |",
    "| Return Inspections | Return Inspections View Item | View | data_list_form_layout_view_item_v1_1 | Page title, current item details | Related loan context | View item requires custom form routing | Generated-final validation |",
    "",
    "#### Form Fields Layout Template Selection",
    "| Data List or Library | Custom Form | Field Group | Selected Form Fields Layout Template | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Return Inspections | Return Inspections New/Edit Form | Inspection fields | data_list_form_fields_grid_v1_1 | 2 | 2 | 1 | Notes | None | Generated-final validation |",
    "| Return Inspections | Return Inspections View Item | Inspection fields | data_list_form_fields_grid_v1_1 | 2 | 2 | 1 | Notes | None | Generated-final validation |",
    "",
    "## 14. Dashboard Pages Plan",
    "",
    "### 14.0 Dashboard Template Coverage Matrix",
    "",
    "#### Data Analytics Template Selection",
    "| Section | Surface | Data Source | Business Question | Selected Data Analytics Template | Grouping/Axis Fields | Value/Aggregate Fields |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    "| Loan status mix | Dashboard | Loan Transactions | Loan transactions by status | data_analytics_pie_chart_with_title | Status | Count ListDataID |",
    "| Loan volume trend | Dashboard | Loan Transactions | Loan transactions over time | data_analytics_line_chart_with_title | Due Date | Count ListDataID |",
    "",
    "### 14.1 Asset Loan Operations Dashboard",
    "",
    "#### Dashboard Sections",
    "| Section Name | Data Source | Selected Record Display Control |",
    "| --- | --- | --- |",
    "| Active loans | Loan Transactions | collection_control_grid_table_with_multiselect |",
    "| Availability cards | Office Assets | collection_control_responsive_card_grid |",
    "| Batch card selection | Office Assets | collection_control_card_with_multiselect_toolbar |",
    "| Asset categories work queue | Asset Categories | collection_control_grid_table |",
    "",
    "#### Data Analytics Template Selection",
    "| Dashboard Page | Analytics Region | Source Resource | Business Question | Selected Data Analytics Template | Grouping Field | Value Field |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    "| Asset Loan Operations Dashboard | Loan status mix | Loan Transactions | Loan transactions by status | data_analytics_pie_chart_with_title | Status | ListDataID |",
    "| Asset Loan Operations Dashboard | Loan volume trend | Loan Transactions | Loan transactions over time | data_analytics_line_chart_with_title | Due Date | ListDataID |",
    "",
    "#### Data Table Template Selection",
    "| Host Surface | Page/Form | Region | Source Resource | Selected Data Table Template | Display Columns | Selection Rationale | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Dashboard | Asset Loan Operations Dashboard | Loan transaction table | Loan Transactions | data_table_control_standard_scroll | Title, Due Date, Status | Many fields, horizontal scrolling acceptable | Generated-final validation |",
    "| Dashboard | Asset Loan Operations Dashboard | Asset availability compact table | Office Assets | data_table_control_standard_no_scroll | Title, Assigned To, Requires Approval | Few fields, no horizontal scroll preferred | Generated-final validation |",
    "| Dashboard | Overdue Monitor | Return inspections managed table | Return Inspections | data_table_control_caption_scroll | Title, Status | Caption search/add/import/export toolbar needed | Generated-final validation |",
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
  const correctedApprovalFieldsReport = validateApprovalFormFieldsTemplate({ plan: resourcePlan });
  assert.equal(correctedApprovalFieldsReport.status, "pass", JSON.stringify(correctedApprovalFieldsReport.findings));
  cases.push("Office Asset Loan App Plan declares explicit Choice Values for every approval select and radio field");

  for (const [field, populatedCell, emptyCell] of [
    ["Payment Terms", "| Payment Terms | PaymentTerms | Choice | radio dropdown | Prepaid; Net 30; Net 60 |", "| Payment Terms | PaymentTerms | Choice | radio dropdown | |"],
    ["Risk Self Assessment", "| Risk Self Assessment | RiskSelfAssessment | Choice | radio dropdown | Low; Medium; High |", "| Risk Self Assessment | RiskSelfAssessment | Choice | radio dropdown | |"],
    ["Return Condition (Submission)", "| Return Condition | ReturnCondition | Choice | radio | Good; Damaged; Lost | Generated-final validation |", "| Return Condition | ReturnCondition | Choice | radio | | Generated-final validation |"],
    ["Return Condition (Task)", "| Return Condition | ReturnCondition | Choice | radio | Good; Damaged; Lost | Yes |", "| Return Condition | ReturnCondition | Choice | radio | | Yes |"],
    ["Reviewer Decision", "| Reviewer Decision | ReviewerDecision | Choice | radio | Approve; Reject; Request Changes |", "| Reviewer Decision | ReviewerDecision | Choice | radio | |"],
  ]) {
    const invalidPlan = path.join(tempDir, `missing-choice-values-${field.toLowerCase().replace(/[^a-z]+/g, "-")}.md`);
    const source = fs.readFileSync(resourcePlan, "utf8");
    assert.ok(source.includes(populatedCell), `${field} populated Choice Values cell must exist in fixture`);
    fs.writeFileSync(invalidPlan, source.replace(populatedCell, emptyCell));
    const invalidReport = validateApprovalFormFieldsTemplate({ plan: invalidPlan });
    assert.ok(
      invalidReport.findings.some((finding) => finding.code === "APPROVAL_FORM_FIELDS_CHOICE_VALUES_REQUIRED"),
      `${field} must fail when its Choice Values cell is removed`,
    );
    cases.push(`${field} missing Choice Values fails approval-form planning validation`);
  }

  const resourceOut = path.join(tempDir, "resource-plan");
  const resourceRun = expectPass("nontrivial App Plan materializes minimal resource graph instead of placeholder package", [
    MATERIALIZER,
    "--functional-spec", spec,
    "--app-plan", resourcePlan,
    "--out-dir", resourceOut,
    "--api-id-manifest", apiIdManifest,
    "--tenant-id", "1234567890123456",
    "--json",
  ]);
  const resourceReport = JSON.parse(resourceRun.stdout);
  assert.equal(resourceReport.status, "pass");
  assert.equal(resourceReport.mode, "minimal-resource-graph");
  assert.equal(resourceReport.signingEligible, false);
  assert.equal(resourceReport.materializerSigningEligible, false);
  assert.equal(resourceReport.preflightEligibleForSigning, null);
  assert.equal(resourceReport.signingReadinessSource, "not-run");
  assert.equal(fs.existsSync(resourceReport.outputs.package), true, "nontrivial materializer writes package");
  assert.equal(fs.existsSync(resourceReport.outputs.decodedResource), true, "nontrivial materializer writes decoded resource");
  assert.equal(fs.existsSync(resourceReport.outputs.seedData), true, "nontrivial materializer writes post-install seed-data companion artifact");
  const resourceGenerationReport = JSON.parse(fs.readFileSync(resourceReport.outputs.generationReport, "utf8"));
  assert.equal(resourceGenerationReport.materializerSigningEligible, false);
  assert.equal(resourceGenerationReport.preflightEligibleForSigning, null);
  assert.equal(resourceGenerationReport.signingReadinessSource, "not-run");
  assert.equal(resourceGenerationReport.outputs.seedData.path.endsWith(".generated-final.seed-data.json"), true, "generation report exposes seed-data companion artifact");
  assert.deepEqual(resourceGenerationReport.plannedResourceDemand.counts, {
    dataLists: 4,
    documentLibraries: 0,
    approvalForms: 2,
    formReports: 1,
    scheduleWorkflows: 0,
    customForms: 8,
    dataListWorkflows: 0,
    dashboards: 2,
    navigationGroups: 4,
  });
  assert.deepEqual(resourceGenerationReport.plannedResourceDemand.resources.dataLists, ["Office Assets", "Loan Transactions", "Asset Categories", "Return Inspections"]);
  assert.deepEqual(resourceGenerationReport.plannedResourceDemand.resources.dashboards, ["Asset Loan Operations Dashboard", "Overdue Monitor"]);
  assert.equal(resourceGenerationReport.plannedResourceDemand.dashboardAnalyticsRecords.length, 2, "planned Data Analytics template selections are parsed");
  assert.equal(resourceGenerationReport.plannedResourceDemand.dashboardDatasetRecords.length, 4, "planned Dashboard Collection template selections are parsed");
  assert.equal(resourceGenerationReport.plannedResourceDemand.dashboardDataTableRecords.length, 3, "planned Data Table template selections are parsed");
  const decodedResource = JSON.parse(fs.readFileSync(resourceReport.outputs.decodedResource, "utf8"));
  const resourceWrapper = JSON.parse(fs.readFileSync(resourceReport.outputs.package, "utf8"));
  assert.equal(String(resourceWrapper.ListID), String(decodedResource.ListSet.ListID), "wrapper.ListID must equal decoded ListSet.ListID");
  assert.equal(String(resourceWrapper.ListID), String(decodedResource.Pages[0].ListID), "dashboard pages must belong to decoded root ListSetID");
  const dashboardUuids = new Set();
  for (const page of decodedResource.Pages) {
    const parsedDashboard = JSON.parse(page.LayoutInResources[0].Resource);
    assert.equal(hasControlIdentity(parsedDashboard, "kpi_metrics_wrapper"), false, "dashboards without planned Summary Metrics must not keep empty KPI wrapper");
    assert.equal(hasControlIdentity(parsedDashboard, "event_portfolio_kpi_planned_events"), false, "dashboards without planned Summary Metrics must not keep source KPI cards");
    for (const value of collectObjectIdUuids(parsedDashboard)) {
      assert.equal(dashboardUuids.has(value), false, `dashboard UUID ${value} must be unique across generated dashboard pages`);
      dashboardUuids.add(value);
    }
  }
  const seedDataArtifact = JSON.parse(fs.readFileSync(resourceReport.outputs.seedData, "utf8"));
  assert.equal(seedDataArtifact.artifactType, "post-install-seed-data", "seed rows are separated from package content");
  assert.equal(seedDataArtifact.lists.length, 4, "seed companion artifact covers planned data lists");
  assert.equal(decodedResource.Childs.length, 4, "planned data lists are materialized");
  assert.equal(decodedResource.Forms.length, 2, "planned approval forms are materialized");
  assert.equal(decodedResource.FormNewReports.length, 1, "planned form reports are materialized");
  assert.equal(decodedResource.Pages.length, 2, "planned dashboards are materialized");
  assert.equal(decodedResource.Pages.some((page) => page.Title === "Getting Started Dashboard"), false, "nontrivial path must not emit placeholder dashboard");
  assertDataListCustomFormRuntimeSources(decodedResource);
  const assetLoanDef = decodeDefResource(decodedResource.Forms.find((form) => form.Name === "Asset Loan Request").DefResource);
  const assetLoanDefText = JSON.stringify(assetLoanDef);
  assert.match(assetLoanDefText, /Requester/, "approval submission/task formdef materializes planned Requester field");
  assert.match(assetLoanDefText, /Asset/, "approval submission/task formdef materializes planned Asset field");
  assert.match(assetLoanDefText, /Business Purpose/, "approval submission/task formdef materializes planned Business Purpose field");
  assert.match(assetLoanDefText, /Purpose/, "approval submission/task formdef preserves literal planned Purpose field labels");
  assert.doesNotMatch(assetLoanDefText, /\b(?:Loan Status|Active Loan Pipeline)\b/, "approval formdef must not retain unrelated source-template business labels");
  const assetReturnDef = decodeDefResource(decodedResource.Forms.find((form) => form.Name === "Asset Return Review").DefResource);
  const assetReturnDefText = JSON.stringify(assetReturnDef);
  assert.match(assetReturnDefText, /Loan Number/, "approval formdef preserves planned Loan Number visible label");
  assert.match(assetReturnDefText, /LoanNumber/, "approval formdef preserves planned LoanNumber field binding");
  const workflowProofStatusControls = (assetReturnDef.pageurls || [])
    .flatMap((page) => collectApprovalFieldControls(page.formdef))
    .filter((field) => field.key === "workflowproofstatus");
  assert.ok(workflowProofStatusControls.length >= 1, "Workflow Proof Status is materialized from the App Plan");
  assert.equal(
    workflowProofStatusControls.every((field) => field.type === "input"),
    true,
    "Text field names ending in Status remain input controls",
  );
  assert.doesNotMatch(assetReturnDefText, /Request Number/, "approval source-domain cleanup must not rewrite planned Loan Number into Request Number");
  assert.equal(Array.isArray(assetLoanDef.flowPage), true, "approval workflow includes flowPage for Designer publish readiness");
  assert.equal(Array.isArray(assetLoanDef.variables?.basic), true, "approval workflow variables.basic is an array");
  assert.equal(Array.isArray(assetLoanDef.variables?.listref), true, "approval workflow variables.listref is an array");
  assert.equal(Array.isArray(assetLoanDef.variables?.filter), true, "approval workflow variables.filter is an array");
  const submissionPage = assetLoanDef.pageurls.find((page) => Number(page.type) === 1);
  const taskPage = assetLoanDef.pageurls.find((page) => Number(page.type) === 2);
  const submissionFieldKeys = collectApprovalFieldKeys(submissionPage.formdef);
  const taskFieldKeys = collectApprovalFieldKeys(taskPage.formdef);
  for (const key of [
    "requester",
    "asset",
    "businesspurpose",
    "paymentterms",
    "taxnumber",
    "bankname",
    "bankaccount",
    "riskselfassessment",
    "riskexplanation",
    "businesslicenseattachment",
    "bankproofattachment",
  ]) {
    assert.equal(submissionFieldKeys.has(key), true, `submission page includes ${key}`);
    assert.equal(taskFieldKeys.has(key), true, `task page mirrors submission field ${key}`);
  }
  assert.equal(taskFieldKeys.has("decisioncomment"), true, "task page may add planned task-only field");
  for (const field of collectApprovalFieldControls(taskPage.formdef)) {
    assert.equal(field.readonly, true, `task field ${field.key} is explicitly readonly`);
  }
  const startNode = assetLoanDef.childshapes.find((shape) => shape?.stencil?.id === "StartNoneEvent");
  const taskNode = assetLoanDef.childshapes.find((shape) => shape?.stencil?.id === "MultiAssignmentTask");
  assert.equal(startNode.properties.taskurl, submissionPage.id, "StartNoneEvent taskurl references submission page");
  assert.equal(startNode.properties.taskUrl, submissionPage.id, "StartNoneEvent taskUrl alias mirrors submission page");
  assert.equal(startNode.properties.TaskUrl, submissionPage.id, "StartNoneEvent TaskUrl alias mirrors submission page");
  assert.equal(taskNode.properties.taskurl, taskPage.id, "MultiAssignmentTask taskurl references task page");
  assert.equal(taskNode.properties.taskUrl, taskPage.id, "MultiAssignmentTask taskUrl alias mirrors task page");
  assert.equal(taskNode.properties.TaskUrl, taskPage.id, "MultiAssignmentTask TaskUrl alias mirrors task page");
  assert.equal(Array.isArray(taskNode.properties.usertaskassignment), true, "MultiAssignmentTask usertaskassignment is array-shaped");
  assert.equal(Boolean(taskNode.properties.approveway), true, "MultiAssignmentTask approveway metadata is present");
  assert.equal(taskNode.properties.approvepercentage, 100, "MultiAssignmentTask approvepercentage metadata is present");
  const shapeById = new Map(assetLoanDef.childshapes.map((shape) => [shape.resourceid || shape.id, shape]));
  const rejectedFlow = assetLoanDef.childshapes.find((shape) => shape?.stencil?.id === "SequenceFlow" && /Rejected/i.test(JSON.stringify(shape?.properties?.conditioninfo || [])));
  assert.equal(shapeById.get(rejectedFlow.target.resourceid).stencil.id, "EndRejectEvent", "Rejected workflow path targets EndRejectEvent");
  const workflowPositionKeys = assetLoanDef.childshapes
    .filter((shape) => shape?.stencil?.id !== "SequenceFlow")
    .map((shape) => `${shape.position?.x},${shape.position?.y}`);
  assert.equal(new Set(workflowPositionKeys).size, workflowPositionKeys.length, "workflow node canvas positions do not collide");
  assert.equal(new Set(decodedResource.Childs.map((child) => String(child.List.ListID))).size, decodedResource.Childs.length, "data list IDs must not collapse through JavaScript number precision");
  assert.equal(new Set(decodedResource.Pages.map((page) => String(page.LayoutID))).size, decodedResource.Pages.length, "dashboard LayoutIDs must be unique");
  const officeAssets = decodedResource.Childs.find((child) => child.List.Title === "Office Assets");
  const approvalFlag = officeAssets.Fields.find((field) => field.DisplayName === "Requires Approval");
  assert.equal(approvalFlag.FieldType, "Bit", "planned boolean field uses Bit storage");
  assert.equal(approvalFlag.Type, "switch", "planned boolean field uses switch control type");
  assert.equal(approvalFlag.DefaultValue, "0", "planned boolean field uses string zero default");
  const officeAssetsDefaultView = JSON.parse(officeAssets.Layouts.find((layout) => Number(layout.Type) === 0).LayoutView);
  const approvalFlagLayoutRow = officeAssetsDefaultView.layout.find((row) => row.FieldID === approvalFlag.FieldID);
  assert.equal(approvalFlagLayoutRow.Type, "switch", "default view row for Bit field uses switch control type");
  for (const page of decodedResource.Pages) {
    assert.equal(String(page.LayoutInResources[0].ID), String(page.LayoutID), "dashboard LayoutInResources[0].ID must equal LayoutID");
    assert.equal(String(page.LayoutInResources[0].RefId), String(page.LayoutID), "dashboard LayoutInResources[0].RefId must equal LayoutID");
  }
  const decodedText = JSON.stringify(decodedResource);
  assert.match(decodedText, /data_list_form_layout_workbench/, "planned Workbench data-list form layout template is materialized");
  assert.match(decodedText, /collection_control_grid_table_with_multiselect/, "planned grid-table multiselect collection template is materialized");
  assert.match(decodedText, /collection_control_responsive_card_grid/, "planned responsive card collection template is materialized");
  assert.match(decodedText, /collection_control_card_with_multiselect_toolbar/, "planned card multiselect toolbar collection template is materialized");
  assert.match(decodedText, /collection_control_grid_table/, "planned grid-table collection template is materialized");
  assert.match(decodedText, /data_analytics_pie_chart_with_title/, "planned pie chart analytics template is materialized");
  assert.match(decodedText, /data_analytics_line_chart_with_title/, "planned line chart analytics template is materialized");
  assert.match(decodedText, /data_table_control_standard_scroll/, "planned standard-scroll Data Table template is materialized");
  assert.match(decodedText, /data_table_control_standard_no_scroll/, "planned standard-no-scroll Data Table template is materialized");
  assert.match(decodedText, /data_table_control_caption_scroll/, "planned caption-scroll Data Table template is materialized");
  assert.doesNotMatch(decodedText, /\{\{(?:DetailLayoutID|ListSetID|ListID|FieldID|ListDataID|LayoutID|layoutId|layout|PageID|pageId)[^}]*\}\}/, "materialized generated-final package must not retain template action/reference placeholders");
  for (const search of findNodes(decodedResource, (node) => String(node?.type || "") === "search-filter")) {
    assert.equal(typeof search.attrs?.placeholder, "string", "generated search-filter attrs.placeholder must be a primitive string");
  }
  for (const page of decodedResource.Pages) {
    const parsedDashboard = JSON.parse(page.LayoutInResources[0].Resource);
    const consumedFilterVars = consumedDashboardFilterVars(parsedDashboard);
    for (const filterVar of parsedDashboard.filterVars || []) {
      const name = String(filterVar?.name || filterVar?.id || "").trim();
      assert.equal(consumedFilterVars.has(name), true, `${page.Title} filterVars[] entry ${name} must be consumed by a data/analytics control`);
    }
    for (const search of findNodes(parsedDashboard, (node) => String(node?.type || "") === "search-filter")) {
      const binding = String(search?.binding || search?.attrs?.binding || "");
      if (!binding.startsWith("__filter_")) continue;
      const name = binding.slice("__filter_".length);
      assert.equal(consumedFilterVars.has(name), true, `${page.Title} search-filter ${name} must feed a real consumer fulltext/filter contract`);
    }
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
  assert.equal(resourceFixtureReport.materializerSigningEligible, false);
  assert.equal(resourceFixtureReport.preflightEligibleForSigning, null);
  assert.equal(resourceFixtureReport.signingReadinessSource, "not-run");
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
  expectPass("nontrivial generated package passes live install readiness validation", [
    LIVE_INSTALL_READINESS_VALIDATOR,
    "--package", resourceReport.outputs.package,
    "--id-provenance", resourceReport.outputs.idProvenance,
  ]);
  expectPass("nontrivial generated package passes generated data-list schema validation", [
    DATA_LIST_SCHEMA_VALIDATOR,
    resourceReport.outputs.package,
    "--strict-generated-list",
  ]);
  expectPass("nontrivial generated package passes Bit/switch field control validation", [
    BIT_FIELD_VALIDATOR,
    "--package", resourceReport.outputs.package,
  ]);
  expectPass("nontrivial generated package passes default YAPK package validation", [
    YAPK_PACKAGE_VALIDATOR,
    resourceReport.outputs.package,
  ]);
  expectPass("nontrivial generated package passes generated YAPK export-shape validation", [
    EXPORT_SHAPE_VALIDATOR,
    "--package", resourceReport.outputs.package,
  ]);
  expectPass("nontrivial generated package materializes App Plan approval form fields", [
    APPROVAL_FORM_FIELDS_VALIDATOR,
    "--package", resourceReport.outputs.package,
    "--plan", resourcePlan,
  ]);
  expectPass("nontrivial generated package passes Approval workflow publish-readiness validation", [
    APPROVAL_WORKFLOW_VALIDATOR,
    "--package", resourceReport.outputs.package,
  ]);
  expectPass("nontrivial generated package passes Dashboard Page Layouts v1.1 validation", [
    DASHBOARD_LAYOUT_VALIDATOR,
    "--package", resourceReport.outputs.package,
    "--app-plan", resourcePlan,
  ]);
  expectPass("nontrivial generated package passes Dashboard Collection template materialization validation", [
    DASHBOARD_DATASET_VALIDATOR,
    "--app-plan", resourcePlan,
    "--package", resourceReport.outputs.package,
  ]);
  expectPass("nontrivial generated package passes Data Analytics template materialization validation", [
    DATA_ANALYTICS_VALIDATOR,
    "--package", resourceReport.outputs.package,
    "--plan", resourcePlan,
  ]);
  expectPass("nontrivial generated package passes Data Table template materialization validation", [
    DATA_TABLE_VALIDATOR,
    "--package", resourceReport.outputs.package,
    "--plan", resourcePlan,
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
  const preflightRun = expectPass("nontrivial generated package passes first-generation preflight including Summary contract", [
    FIRST_GENERATION_PREFLIGHT,
    "--package", resourceReport.outputs.package,
    "--plan", resourcePlan,
    "--json",
  ]);
  const preflightReport = JSON.parse(preflightRun.stdout);
  assert.equal(preflightReport.ok, true);
  assert.equal(preflightReport.failedGate, null);
  assert.equal(preflightReport.preflightEligibleForSigning, true);
  assert.equal(preflightReport.signingReadinessSource, "yapk-first-generation-preflight");
  assert.deepEqual(preflightReport.signingReadiness, {
    status: "preflight-pass",
    preflightEligibleForSigning: true,
    source: "yapk-first-generation-preflight",
    blockedBy: null,
    nextRequiredStages: ["setsign", "verifysign", "package API install/import or upgrade", "Version Management final success where applicable", "browser/runtime proof"],
  });
  const relativePreflightRun = expectPass("first-generation preflight resolves relative --plan from caller cwd", [
    FIRST_GENERATION_PREFLIGHT,
    "--package", path.relative(tempDir, resourceReport.outputs.package),
    "--plan", path.relative(tempDir, resourcePlan),
    "--id-provenance", path.relative(tempDir, resourceReport.outputs.idProvenance),
    "--json",
  ], { cwd: tempDir });
  assert.equal(JSON.parse(relativePreflightRun.stdout).ok, true);
  cases.push("nontrivial App Plan materializes data lists, approval forms, reports, dashboards, custom forms, and navigation without placeholder output");
  cases.push("nontrivial App Plan materialization passes ID provenance, runtime navigation, live install readiness, data-list schema, YAPK package, export-shape, Dashboard v1.1, Dashboard Collection template, Golden Reference, aggregate Dashboard hard gates, Summary contract, and first-generation preflight");
  cases.push("preflight pass emits signing-readiness handoff fields without changing materializer signing boundary");
  cases.push("first-generation preflight resolves relative package, plan, and provenance paths from the caller working directory");

console.log(JSON.stringify({ status: "pass", cases }, null, 2));

function findNodes(root, predicate, found = []) {
  if (!root || typeof root !== "object") return found;
  if (predicate(root)) found.push(root);
  if (Array.isArray(root)) {
    for (const item of root) findNodes(item, predicate, found);
    return found;
  }
  for (const value of Object.values(root)) findNodes(value, predicate, found);
  return found;
}

function consumedDashboardFilterVars(root) {
  const consumed = new Set();
  const consumerTypes = new Set(["summary", "collection", "data-list", "data-table", "pivot-table", "pie-chart", "bar-chart", "column-chart", "line-chart", "area-chart"]);
  const inspect = (value) => {
    const text = JSON.stringify(value || {});
    for (const match of text.matchAll(/__filter_([A-Za-z0-9_-]+)/g)) consumed.add(match[1]);
  };
  for (const node of findNodes(root, (item) => consumerTypes.has(String(item?.type || "")), [])) {
    inspect(node?.attrs?.data?.filter);
    inspect(node?.attrs?.data?.fulltext);
    inspect(node?.attrs?.data?.sortingfilter);
    inspect(node?.attrs?.data?.Conditions);
    inspect(node?.attrs?.data?.conditions);
  }
  for (const ext of Array.isArray(root?.exts) ? root.exts : []) inspect(ext?.attr?.settings?.Conditions);
  return consumed;
}
} finally {
  if (process.env.KEEP_FULL_APP_TEST_TEMP === "1") console.error(`Preserved full-app test temp: ${tempDir}`);
  else fs.rmSync(tempDir, { recursive: true, force: true });
}

function expectPass(name, args, options = {}) {
  const result = run(args, options);
  assert.equal(result.status, 0, `${name} should pass\nstdout=${result.stdout}\nstderr=${result.stderr}`);
  cases.push(name);
  return result;
}

function expectCode(name, args, code, options = {}) {
  const result = run(args, options);
  assert.notEqual(result.status, 0, `${name} should fail`);
  assert.match(`${result.stdout}\n${result.stderr}`, new RegExp(code), `${name} should include ${code}`);
  cases.push(name);
  return result;
}

function run(args, options = {}) {
  return spawnSync(process.execPath, args, { cwd: options.cwd || ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024, env: options.env || process.env });
}

function assertDataListCustomFormRuntimeSources(decodedResource) {
  for (const child of decodedResource.Childs || []) {
    for (const layout of child.Layouts || []) {
      if (Number(layout.Type) !== 1) continue;
      const layoutView = parseJson(layout.LayoutView);
      const embedded = parseJson((layout.LayoutInResources || [])[0]?.Resource);
      assert.ok(layoutView && typeof layoutView === "object", `${child.List.Title} ${layout.Title} LayoutView must contain form JSON`);
      assert.ok(embedded && typeof embedded === "object", `${child.List.Title} ${layout.Title} LayoutInResources[0].Resource must contain form JSON`);
      assert.ok(Array.isArray(layoutView.children) && layoutView.children.length > 0, `${child.List.Title} ${layout.Title} LayoutView must contain rendered form children`);
      assert.ok(Array.isArray(embedded.children) && embedded.children.length > 0, `${child.List.Title} ${layout.Title} embedded Resource must contain rendered form children`);
      assert.doesNotMatch(JSON.stringify(layoutView), /minimal-resource-graph|placeholder/i, `${child.List.Title} ${layout.Title} LayoutView must not be a placeholder`);
      assert.equal(stableJson(layoutView), stableJson(embedded), `${child.List.Title} ${layout.Title} LayoutView must mirror LayoutInResources[0].Resource`);
    }
  }
}

function parseJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function collectObjectIdUuids(root) {
  const out = [];
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const visit = (node) => {
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (!node || typeof node !== "object") return;
    if (typeof node.id === "string" && uuidRe.test(node.id)) out.push(node.id);
    for (const child of Object.values(node)) visit(child);
  };
  visit(root);
  return out;
}

function hasControlIdentity(root, identity) {
  let found = false;
  const visit = (node) => {
    if (found) return;
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (!node || typeof node !== "object") return;
    const candidates = [
      node.id,
      node.name,
      node.label,
      node.nav_label,
      node.nv_label,
      node.attrs?.name,
      node.attrs?.label,
      node.attrs?.nav_label,
      node.attrs?.nv_label,
      node.attrs?.data?.templateId,
      node.attrs?.data?.sourceTemplateId,
      node.derivedFromDashboardPageLayoutTemplate,
      node.dataAnalyticsTemplateId,
      node.collectionTemplateId,
    ].filter(Boolean).map(String);
    if (candidates.includes(identity)) {
      found = true;
      return;
    }
    for (const child of node.children || []) visit(child);
  };
  visit(root);
  return found;
}

function collectApprovalFieldKeys(root) {
  return new Set(collectApprovalFieldControls(root).map((field) => field.key));
}

function collectApprovalFieldControls(root) {
  const out = [];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    const type = String(node.type || "");
    if (/^(input|textarea|richtext|rich-text|radio|checkbox|switch|date|datetime|datepicker|number|input_number|currency|lookup|people|user|identity-picker|image-upload|file-upload|list)$/i.test(type)) {
      const key = String(node.binding || node.fieldName || node.attrs?.data?.fieldName || node.attrs?.data?.field || "").trim().toLowerCase();
      if (key) out.push({
        key,
        type: String(node.type || "").trim().toLowerCase(),
        readonly: node.attrs?.readonly === true || node.attrs?.readOnly === true || node.readonly === true || node.readOnly === true,
      });
    }
    for (const child of node.children || []) visit(child);
  };
  visit(root);
  return out;
}

function decodeDefResource(value) {
  const raw = Buffer.from(value, "base64");
  const prefix = Buffer.from("::brotli::", "utf8");
  const payload = raw.subarray(0, prefix.length).equals(prefix)
    ? zlib.brotliDecompressSync(raw.subarray(prefix.length)).toString("utf8")
    : zlib.brotliDecompressSync(raw).toString("utf8");
  return JSON.parse(payload);
}

#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { encodeYapkResourceOfficial } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { validatePublicFormPageLayout } = require(path.join(ROOT, "scripts/lib/public-form-template-utils.cjs"));
const MATERIALIZER = path.join(ROOT, "scripts/materialize-full-app-generated-final.mjs");
const FORM_LAYOUT_VALIDATOR = path.join(ROOT, "scripts/validate-data-list-form-layout-template.mjs");
const PACKAGE_VALIDATOR = path.join(ROOT, "validate-yapk-package.js");
const FIRST_GENERATION_PREFLIGHT = path.join(ROOT, "scripts/yapk-first-generation-preflight.mjs");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "public-form-complete-data-list-"));
const cases = [];

try {
  const specPath = path.join(tempDir, "functional-specification.md");
  const planPath = path.join(tempDir, "yeeflow-app-plan.md");
  fs.writeFileSync(specPath, "# Functional Specification: Customer Survey\n\nCreate a customer feedback Public Form and an internal response-management Data List.\n");
  const planText = [
    "# Yeeflow App Plan: Customer Survey",
    "",
    "## Plan Status",
    "",
    "- Application name: Customer Survey",
    "",
    "## 4. Data Lists and Document Libraries Plan",
    "",
    "### 4.1 Survey Responses",
    "",
    "| Field Name | Type | Purpose |",
    "| --- | --- | --- |",
    "| Customer Name | Text | Response owner display name. |",
    "| Email | Text | Customer contact email. |",
    "| Overall Satisfaction | Choice | Survey rating. Choices: Very satisfied, Satisfied, Neutral, Dissatisfied |",
    "| Improvement Feedback | Multiple line | Open feedback. |",
    "",
    "## 10. Custom Data List Forms Plan",
    "",
    "### 10.1 Survey Responses",
    "",
    "#### Data List Form Layout Template Selection",
    "| Data List or Library | Custom Form | Form Usage | Selected Data List Form Layout Template | Business Sections Needed | Related Data / Analytics Needed | Selection Reason | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Survey Responses | Survey Responses New/Edit Form | New/Edit | data_list_form_layout_new_edit_v1_1 | Current response fields | None | Internal users create and maintain responses | Generated-final validation |",
    "| Survey Responses | Survey Responses View Item | View | data_list_form_layout_view_item_v1_1 | Current response details | None | Internal users review responses | Generated-final validation |",
    "",
    "#### Form Fields Layout Template Selection",
    "| Data List or Library | Custom Form | Field Group | Selected Form Fields Layout Template | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Survey Responses | Survey Responses New/Edit Form | Survey fields | data_list_form_fields_grid_v1_1 | 2 | 2 | 1 | Improvement Feedback | None | Generated-final validation |",
    "| Survey Responses | Survey Responses View Item | Survey fields | data_list_form_fields_grid_v1_1 | 2 | 2 | 1 | Improvement Feedback | None | Generated-final validation |",
    "",
    "#### Public Forms Plan",
    "| Host Data List | Public Form Name | Form Title | Description / Purpose | Included Fields | Public Form Page Layout Template | Public Form Fields Layout Template | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Survey Responses | Customer Feedback Public Form | Customer Feedback Survey | Tell us about your experience. | Customer Name, Email, Overall Satisfaction, Improvement Feedback | public-form-page-layout-standard | public_form_fields_1col_v1_1 | Generated-final validation |",
  ].join("\n");
  fs.writeFileSync(planPath, planText);

  const outDir = path.join(tempDir, "out");
  const materialized = run(MATERIALIZER, [
    "--functional-spec", specPath,
    "--app-plan", planPath,
    "--out-dir", outDir,
    "--allow-fixture-api-ids-for-tests",
    "--json",
  ]);
  assert.equal(materialized.status, 0, materialized.stderr || materialized.stdout);
  const report = JSON.parse(materialized.stdout);
  const decoded = JSON.parse(fs.readFileSync(report.outputs.decodedResource, "utf8"));
  const child = decoded.Childs.find((item) => item.List?.Title === "Survey Responses");
  assert.ok(child, "Survey Responses Data List must materialize");
  assert.equal(child.PublicForms.length, 1, "planned Public Form must materialize under the host Data List");
  assertStandardCustomForms(child);
  const publicResource = JSON.parse(child.PublicForms[0].Resource);
  assert.equal(publicResource.publicFormPageLayoutTemplateId, "public-form-page-layout-standard");
  assert.equal(publicResource.publicFormFieldsLayoutTemplateId, "public_form_fields_1col_v1_1");
  const expectedPublicFieldNames = child.Fields
    .filter((field) => ["Customer Name", "Email", "Overall Satisfaction", "Improvement Feedback"].includes(field.DisplayName))
    .map((field) => field.FieldName)
    .sort();
  const actualPublicFieldNames = collectFieldBindings(publicResource).filter((fieldName) => expectedPublicFieldNames.includes(fieldName)).sort();
  assert.deepEqual(actualPublicFieldNames, expectedPublicFieldNames, "planned Public Form fields must materialize inside the golden-reference field grid");
  assert.deepEqual(validatePublicFormPageLayout(publicResource, { pathPrefix: "Survey Responses.PublicForms[0].Resource", severity: "error", generatedOutput: true }), []);
  assertGeneratedPublicFormOptionalRegionsPruned(publicResource);
  cases.push("full-app materializer keeps Public Form additive to standard New/Edit/View custom forms");

  const noPublicPlanPath = path.join(tempDir, "yeeflow-app-plan-no-public-form.md");
  fs.writeFileSync(noPublicPlanPath, `${planText.replace(/\n#### Public Forms Plan[\s\S]*$/, "")}\n`);
  const noPublicOutDir = path.join(tempDir, "out-no-public-form");
  const noPublicMaterialized = run(MATERIALIZER, [
    "--functional-spec", specPath,
    "--app-plan", noPublicPlanPath,
    "--out-dir", noPublicOutDir,
    "--allow-fixture-api-ids-for-tests",
    "--json",
  ]);
  assert.equal(noPublicMaterialized.status, 0, noPublicMaterialized.stderr || noPublicMaterialized.stdout);
  const noPublicReport = JSON.parse(noPublicMaterialized.stdout);
  const noPublicDecoded = JSON.parse(fs.readFileSync(noPublicReport.outputs.decodedResource, "utf8"));
  const noPublicChild = noPublicDecoded.Childs.find((item) => item.List?.Title === "Survey Responses");
  assert.ok(noPublicChild, "Survey Responses Data List without a Public Form must materialize");
  assert.equal(noPublicChild.PublicForms.length, 0, "unplanned Public Forms must not materialize");
  assertStandardCustomForms(noPublicChild);
  cases.push("full-app materializer generates the same standard New/Edit/View custom forms when no Public Form is planned");

  const publicOnlyPlanPath = path.join(tempDir, "yeeflow-app-plan-public-form-only.md");
  fs.writeFileSync(publicOnlyPlanPath, `${planText.replace(/### 10\.1 Survey Responses[\s\S]*?#### Public Forms Plan/, "### 10.1 Survey Responses\n\n#### Public Forms Plan")}\n`);
  expectFailureCode(FORM_LAYOUT_VALIDATOR, ["--plan", publicOnlyPlanPath], "DATA_LIST_FORM_LAYOUT_APP_PLAN_NEW_EDIT_FORM_REQUIRED");
  expectFailureCode(FORM_LAYOUT_VALIDATOR, ["--plan", publicOnlyPlanPath], "DATA_LIST_FORM_LAYOUT_APP_PLAN_VIEW_FORM_REQUIRED");
  cases.push("App Plan Public Forms cannot satisfy or replace internal custom-form planning requirements");

  const formGate = run(FORM_LAYOUT_VALIDATOR, ["--package", report.outputs.package, "--plan", planPath]);
  assert.equal(formGate.status, 0, formGate.stderr || formGate.stdout);
  cases.push("generated package passes Data List Form Layouts v1.1 with PublicForms[] present");

  expectPreflightDataListFormGatesPass(report.outputs.package);
  expectPreflightDataListFormGatesPass(noPublicReport.outputs.package);
  cases.push("with-Public-Form and without-Public-Form packages both enter complete preflight and pass Data List form gates");

  const brokenDecoded = structuredClone(decoded);
  const brokenChild = brokenDecoded.Childs.find((item) => item.List?.Title === "Survey Responses");
  brokenChild.List.LayoutView = null;
  brokenChild.Layouts = brokenChild.Layouts.filter((layout) => Number(layout.Type) !== 1);
  const brokenWrapper = JSON.parse(fs.readFileSync(report.outputs.package, "utf8"));
  brokenWrapper.Resource = encodeYapkResourceOfficial(brokenDecoded);
  const brokenPath = path.join(tempDir, "public-form-without-custom-forms.yapk");
  fs.writeFileSync(brokenPath, `${JSON.stringify(brokenWrapper, null, 2)}\n`);

  expectFailureCode(PACKAGE_VALIDATOR, [brokenPath], "YAPK_PUBLIC_FORM_CANNOT_REPLACE_CUSTOM_FORMS");
  expectFailureCode(FORM_LAYOUT_VALIDATOR, ["--package", brokenPath], "DATA_LIST_PUBLIC_FORM_CUSTOM_FORMS_REQUIRED");
  cases.push("Public Form-only Data List failure shape is blocked by package and layout hard gates");

  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function run(script, args) {
  return spawnSync(process.execPath, [script, ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function expectFailureCode(script, args, code) {
  const result = run(script, args);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0, `${path.basename(script)} should reject the Public Form-only Data List`);
  assert.match(output, new RegExp(code), `${path.basename(script)} should include ${code}\n${output}`);
}

function expectPreflightDataListFormGatesPass(packagePath) {
  const result = run(FIRST_GENERATION_PREFLIGHT, ["--package", packagePath, "--json"]);
  const report = JSON.parse(result.stdout);
  for (const gateName of ["data-list-form-layouts-v1.1", "data-list-form-fields-v1.1"]) {
    const gate = report.gates.find((item) => item.gate === gateName);
    assert.ok(gate, `complete preflight must execute ${gateName}`);
    assert.equal(gate.ok, true, `${gateName} must pass for ${path.basename(packagePath)}`);
  }
}

function assertStandardCustomForms(child) {
  const display = JSON.parse(child.List.LayoutView);
  for (const usage of ["add", "edit", "view"]) {
    assert.ok(display[usage], `List.LayoutView.${usage} must resolve to a custom form`);
    assert.equal(child.Layouts.some((layout) => String(layout.LayoutID) === String(display[usage]) && Number(layout.Type) === 1), true, `${usage} must target a Type 1 custom form layout`);
  }
  assert.equal(child.Layouts.some((layout) => Number(layout.Type) === 1 && JSON.parse(layout.LayoutView).dataListFormLayoutTemplateId === "data_list_form_layout_new_edit_v1_1"), true);
  assert.equal(child.Layouts.some((layout) => Number(layout.Type) === 1 && JSON.parse(layout.LayoutView).dataListFormLayoutTemplateId === "data_list_form_layout_view_item_v1_1"), true);
}

function collectFieldBindings(value, bindings = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectFieldBindings(item, bindings);
    return bindings;
  }
  if (!value || typeof value !== "object") return bindings;
  if (typeof value.binding === "string" && value.binding.trim()) bindings.push(value.binding.trim());
  for (const item of Object.values(value)) collectFieldBindings(item, bindings);
  return bindings;
}

function assertGeneratedPublicFormOptionalRegionsPruned(resource) {
  const labels = collectLabels(resource);
  assert.equal(labels.has("public_form_title_cta_area"), false, "unplanned CTA area must be removed");
  assert.equal(labels.has("2_columns_section"), false, "unused 2-column section must be removed");
  assert.equal(labels.has("3_columns_section"), false, "unused 3-column section must be removed");
  assert.equal(labels.has("2_columns_60/40_section"), false, "unused 60/40 section must be removed");
  assert.equal(labels.has("Operations"), false, "placeholder Operations regions must be removed");
}

function collectLabels(value, labels = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectLabels(item, labels));
    return labels;
  }
  if (!value || typeof value !== "object") return labels;
  const label = value.nv_label || value.nav_label || value.name || value.title || value.label || value.id;
  if (label) labels.add(label);
  Object.values(value).forEach((item) => collectLabels(item, labels));
  return labels;
}

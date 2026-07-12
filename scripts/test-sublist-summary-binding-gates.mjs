#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { decodeYapkResource } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MATERIALIZER = path.join(ROOT, "scripts/materialize-full-app-generated-final.mjs");
const DATA_LIST_VALIDATOR = path.join(ROOT, "scripts/validate-data-list-form-fields-template.mjs");
const require = createRequire(import.meta.url);
const { validateDecodedDef } = require(path.join(ROOT, "validate-ywf-def.js"));
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sublist-summary-binding-"));

try {
  const spec = path.join(tempDir, "functional-specification.md");
  const plan = path.join(tempDir, "yeeflow-app-plan.md");
  const outDir = path.join(tempDir, "generated-final");
  fs.writeFileSync(spec, "# Functional Specification: Campaign Travel Operations\n\nBusiness defaults approval status: user-default-approved-for-generation.\n");
  fs.writeFileSync(plan, appPlan());
  const run = spawnSync(process.execPath, [
    MATERIALIZER,
    "--functional-spec", spec,
    "--app-plan", plan,
    "--out-dir", outDir,
    "--allow-fixture-api-ids-for-tests",
    "--json",
  ], { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  assert.equal(run.status, 0, `materializer should pass\n${run.stdout}\n${run.stderr}`);
  const report = JSON.parse(run.stdout);
  const resource = decodeYapkResource(JSON.parse(fs.readFileSync(report.outputs.package, "utf8")));

  const campaign = resource.Childs.find((child) => child?.List?.Title === "Campaign");
  const campaignView = campaign.Layouts.find((layout) => layout.Title === "View Campaign");
  const campaignForm = JSON.parse(campaignView.LayoutInResources[0].Resource);
  const campaignList = collectControls(campaignForm, (control) => control.type === "list" && control.binding === "Text3")[0];
  assert.deepEqual(campaignList.attrs["list-fields-summary"].map(summaryShape), [
    { field: "field_4", type: "total", prefix: "__list_", value: "Decimal1" },
    { field: "field_5", type: "total", prefix: "__temp_", value: "var_TotalNumber" },
  ]);
  assert.equal(campaignForm.tempVars.some((entry) => entry.id === "var_TotalNumber"), true);

  const approval = resource.Forms.find((form) => form.Name === "Business Travel Request Approval");
  const approvalDef = decodeDefResource(approval.DefResource);
  const approvalList = collectControls(approvalDef, (control) => control.type === "list" && control.binding === "TravelItinerary")[0];
  assert.deepEqual(approvalList.attrs["list-fields-summary"].map(summaryShape), [
    { field: "Nights", type: "total", prefix: "__temp_", value: "var_TotalNights" },
    { field: "EstimatedCost", type: "total", prefix: "__variables_", value: "TotalEstimatedCost" },
  ]);
  assert.equal(approvalDef.variables.tempVars.some((entry) => entry.id === "var_TotalNights"), true);
  assert.equal(approvalDef.variables.basic.find((entry) => entry.id === "TotalEstimatedCost")?.type, "number");

  const dataListValidation = spawnSync(process.execPath, [DATA_LIST_VALIDATOR, "--package", report.outputs.package], { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  assert.equal(dataListValidation.status, 0, `Data List summary package gate should pass\n${dataListValidation.stdout}\n${dataListValidation.stderr}`);
  const approvalValidation = validateDecodedDef(approvalDef, { mode: "final" });
  assert.notEqual(approvalValidation.status, "fail", JSON.stringify(approvalValidation.errors, null, 2));

  const badApprovalDef = structuredClone(approvalDef);
  const badApprovalList = collectControls(badApprovalDef, (control) => control.type === "list" && control.binding === "TravelItinerary")[0];
  badApprovalList.attrs["list-fields-summary"][0].binding.value = "missing_temp";
  assert.equal(validateDecodedDef(badApprovalDef, { mode: "final" }).errors.some((entry) => entry.code === "LIST_SUMMARY_BINDING_UNKNOWN_TEMP_VARIABLE"), true);

  console.log(JSON.stringify({
    status: "pass",
    test: "test-sublist-summary-binding-gates",
    assertions: {
      approvalSummaries: 2,
      dataListSummaries: 2,
      supportedBindings: ["__variables_", "__temp_", "__list_"],
      generatedTempVariables: 2,
      packageAndApprovalValidators: "pass",
    },
  }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function summaryShape(summary) {
  return { field: summary.field, type: summary.type, prefix: summary.binding?.prefix, value: summary.binding?.value };
}

function decodeDefResource(value) {
  const raw = Buffer.from(value, "base64");
  const prefix = Buffer.from("::brotli::", "utf8");
  const payload = raw.subarray(0, prefix.length).equals(prefix) ? raw.subarray(prefix.length) : raw;
  return JSON.parse(zlib.brotliDecompressSync(payload).toString("utf8"));
}

function collectControls(root, predicate) {
  const controls = [];
  const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== "object") return;
    if (value.type && predicate(value)) controls.push(value);
    Object.values(value).forEach(visit);
  };
  visit(root);
  return controls;
}

function appPlan() {
  return [
    "# Yeeflow App Plan: Campaign Travel Operations",
    "",
    "## Plan Status",
    "",
    "- Application name: Campaign Travel Operations",
    "- Business defaults approval status: user-default-approved-for-generation.",
    "",
    "## 4. Data Lists and Document Libraries Plan",
    "",
    "### 4.1 Campaign",
    "",
    "| Field Label | Field Name | Field Type | Control Type | Sub List Row Fields | Sub List Summaries | Purpose |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    "| Campaign Name | Title | Text | input | None | None | Primary campaign label |",
    "| Event Items | Text3 | Text | list | field_Name:Name:text:input; field_Description:Description:text:input; field_User:Owner:user:identity-picker; field_4:Quantity:number:input_number; field_5:Budget:number:input_number | field_4:total:list:Decimal1; field_5:total:temp:var_TotalNumber | Editable event rows |",
    "| Total number | Decimal1 | Decimal | input_number | None | None | Persisted quantity summary |",
    "",
    "## 5. Approval Forms Plan",
    "",
    "### 5.1 Business Travel Request Approval",
    "",
    "##### Submission Form Fields",
    "",
    "| Field Order | Business Label | Field Name | Exact Yeeflow Variable Type | Exact Yeeflow Control Type | Sub List Row Fields | Sub List Summaries | Proof Label |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    "| 1 | Request title | RequestTitle | Text | input | None | None | Generated-final validation |",
    "| 2 | Itinerary lines | TravelItinerary | Sub list | list | Nights:Nights:number:input_number; EstimatedCost:Estimated Cost:number:input_number | Nights:total:temp:var_TotalNights; EstimatedCost:total:variable:TotalEstimatedCost | Generated-final validation |",
    "| 3 | Total estimated cost | TotalEstimatedCost | Number | input_number | None | None | Generated-final validation |",
    "",
    "##### Task Form Fields",
    "",
    "| Field Order | Business Label | Field Name | Exact Yeeflow Variable Type | Exact Yeeflow Control Type | Proof Label |",
    "| --- | --- | --- | --- | --- | --- |",
    "| 1 | Request title | RequestTitle | Text | input | Generated-final validation |",
    "",
    "#### Approval Form Fields Layout Template Selection",
    "",
    "| Approval Form | Form Page | Field Group | Selected Approval Form Fields Layout Template | Field Source | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Business Travel Request Approval | Submission form | Request fields | approval_form_fields_grid_2col_v1_1 | Submission fields | 2 | 2 | 1 | Itinerary lines | None | Generated-final validation |",
    "| Business Travel Request Approval | Task form | Review fields | approval_form_fields_grid_2col_v1_1 | Submission mirror | 2 | 2 | 1 | Itinerary lines | None | Generated-final validation |",
    "",
    "## 10. Custom Data List Forms Plan",
    "",
    "### 10.1 Campaign",
    "",
    "| Data List | Form Name | Form Type | Purpose | Selected Data List Form Layout Template | Open In | Selection Reason |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    "| Campaign | View Campaign | View | Review campaign and event items | data_list_form_layout_view_item_v1_1 | Current page | Standard view form |",
    "",
    "#### Form Fields Layout Template Selection",
    "",
    "| Data List or Library | Custom Form | Field Group | Selected Form Fields Layout Template | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Campaign | View Campaign | Campaign fields | data_list_form_fields_grid_v1_1 | 2 | 2 | 1 | Event Items | None | Generated-final validation |",
    "",
    "## 11. Data List Workflows Plan",
    "",
  ].join("\n");
}

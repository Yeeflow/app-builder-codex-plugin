#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { decodeYapkResource } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MATERIALIZER = path.join(ROOT, "scripts/materialize-full-app-generated-final.mjs");
const VALIDATOR = path.join(ROOT, "scripts/validate-data-list-form-fields-template.mjs");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "data-list-sublist-column-title-"));

try {
  const spec = path.join(tempDir, "functional-specification.md");
  const plan = path.join(tempDir, "yeeflow-app-plan.md");
  const outDir = path.join(tempDir, "generated-final");
  fs.writeFileSync(spec, "# Functional Specification: Campaign Management\n\nBusiness defaults approval status: user-default-approved-for-generation.\n");
  fs.writeFileSync(plan, appPlan());

  const run = spawnSync(process.execPath, [
    MATERIALIZER,
    "--functional-spec", spec,
    "--app-plan", plan,
    "--out-dir", outDir,
    "--allow-fixture-api-ids-for-tests",
    "--json",
  ], { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  assert.equal(run.status, 0, `materializer should pass\nstdout=${run.stdout}\nstderr=${run.stderr}`);
  const report = JSON.parse(run.stdout);
  const resource = decodeYapkResource(JSON.parse(fs.readFileSync(report.outputs.package, "utf8")));
  const campaign = resource.Childs.find((child) => child?.List?.Title === "Campaign");
  assert.ok(campaign, "Campaign Data List should be materialized");
  const subListField = campaign.Fields.find((field) => field.Type === "list" && field.DisplayName === "Event Items");
  assert.ok(subListField, "Event Items Sub list field should be materialized");
  assert.equal(typeof subListField.Rules, "string", "Data List Sub list Rules must remain stringified JSON");
  assert.ok(subListField.Rules, `Data List Sub list Rules must include row schema: ${JSON.stringify(subListField)}`);
  const rules = JSON.parse(subListField.Rules);
  assert.deepEqual(rules["list-variables"].map((field) => field.id), ["field_Name", "field_Description", "field_User"]);

  const viewLayout = campaign.Layouts.find((layout) => layout.Title === "View Campaign");
  assert.ok(viewLayout, "View Campaign custom form should be materialized");
  const formResource = JSON.parse(viewLayout.LayoutInResources[0].Resource);
  const controls = collectControls(formResource, (control) => control.type === "list" && control.binding === subListField.FieldName);
  assert.equal(controls.length, 1, "View Campaign should contain one Event Items Sub list control");
  const columns = controls[0].attrs["list-fields"];
  assert.equal(columns.length, 3, "Sub list template rows must be pruned and rebuilt to the three Campaign row fields");
  assert.deepEqual(columns.map((field) => field.control.label), ["Name", "Description", "Owner"]);
  assert.deepEqual(columns.map((field) => field.control.type), ["input", "input", "identity-picker"]);
  assert.equal(columns.every((field) => field.control.binding === field.id), true);
  assert.equal(columns.every((field) => field.control.attrs.list_field_binding === subListField.FieldName), true);
  assert.equal(columns.every((field) => field.control.attrs.list_control_id === controls[0].id), true);
  assert.equal(columns.every((field) => !("label_var" in field.control)), true, "Official Data List export does not require label_var");

  const validation = spawnSync(process.execPath, [VALIDATOR, "--package", report.outputs.package], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  assert.equal(validation.status, 0, `generated package should pass Data List form fields gate\n${validation.stdout}\n${validation.stderr}`);

  console.log(JSON.stringify({
    status: "pass",
    test: "test-data-list-sublist-column-title-gates",
    assertions: {
      dataLists: 1,
      customForms: 1,
      subListColumns: 3,
      completeColumnTitles: 3,
      fieldRulesSchemaMatchesForm: true,
      labelVarRequired: false,
    },
  }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function appPlan() {
  return [
    "# Yeeflow App Plan: Campaign Management",
    "",
    "## Plan Status",
    "",
    "- Application name: Campaign Management",
    "- Business defaults approval status: user-default-approved-for-generation.",
    "",
    "## 4. Data Lists and Document Libraries Plan",
    "",
    "### 4.1 Campaign",
    "",
    "| Field Label | Field Name | Field Type | Control Type | Sub List Row Fields | Purpose |",
    "| --- | --- | --- | --- | --- | --- |",
    "| Campaign Name | Title | Text | input | None | Primary campaign label |",
    "| Event Items | Text3 | Text | list | field_Name:Name:text:input; field_Description:Description:text:input; field_User:Owner:user:identity-picker | Editable event item rows |",
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

function collectControls(root, predicate) {
  const controls = [];
  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") return;
    if (value.type && predicate(value)) controls.push(value);
    Object.values(value).forEach(visit);
  };
  visit(root);
  return controls;
}

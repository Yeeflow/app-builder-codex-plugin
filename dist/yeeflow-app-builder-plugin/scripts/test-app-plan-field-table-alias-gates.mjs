#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { materializeFullAppGeneratedFinal } from "./materialize-full-app-generated-final.mjs";
import { readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "app-plan-field-table-alias-"));

function write(file, content) {
  fs.writeFileSync(file, `${content.trim()}\n`);
  return file;
}

function fieldByName(fields, fieldName) {
  return fields.find((field) => String(field.FieldName) === fieldName);
}

try {
  const specPath = write(path.join(tempDir, "functional-specification.md"), `
# Functional Specification: Field Table Alias Regression

Generate a hospital staffing data list from an App Plan table that uses legacy field-table headings.
Business defaults approval status: user-default-approved-for-generation.
`);

  const planPath = write(path.join(tempDir, "yeeflow-app-plan.md"), `
# Field Table Alias Regression - Yeeflow App Plan

## 1. Plan Status
Business defaults approval status: user-default-approved-for-generation.

## 4. Data Lists and Document Libraries Plan

### 4.1 Departments
- Resource type: Data list
- Business purpose: Track department staffing.

#### Fields
| Display Name | Storage Name | Control | Required | Notes |
| --- | --- | --- | --- | --- |
| Department Name | Title | input | Yes | Native title mirrors department name |
| Department Code | Text1 | input | Yes | Unique department code |
| Staffing Target | Decimal1 | input_number | No | Planned number storage inferred from Control |
| Active | Bit1 | switch | No | Planned boolean storage inferred from Control |
| Review Date | Datetime1 | datepicker | No | Planned date storage inferred from Control |
| Status | Text2 | select | Yes | Active, Paused, Closed |

## 15. Application Navigation Plan
| Group | Item | Target Resource | Yeeflow Resource Type | Icon |
| --- | --- | --- | --- | --- |
| Operations | Departments | Departments | Data List | fa-solid fa-hospital |
`);

  const apiIdManifestPath = path.join(tempDir, "api-issued-ids.json");
  fs.writeFileSync(apiIdManifestPath, `${JSON.stringify({
    ids: Array.from({ length: 200 }, (_, index) => String(940000000000000000n + BigInt(index))),
  }, null, 2)}\n`);

  const report = materializeFullAppGeneratedFinal({
    functionalSpec: specPath,
    appPlan: planPath,
    outDir: path.join(tempDir, "dist"),
    apiIdManifest: apiIdManifestPath,
    tenantId: "940000000000099999",
    cwd: tempDir,
  });

  assert.equal(report.status, "pass", JSON.stringify(report.findings || [], null, 2));

  const { decoded } = readDecodedYapk(report.outputs.package);
  const departments = decoded.Childs.find((child) => child.List?.Title === "Departments");
  assert.ok(departments, "Departments data list must be generated");
  const fields = departments.Fields || [];

  assert.ok(fields.length >= 6, "legacy field-table headings must not collapse to Title-only generation");
  assert.equal(fieldByName(fields, "Text1")?.DisplayName, "Department Code");
  assert.equal(fieldByName(fields, "Text1")?.FieldType, "Text");
  assert.equal(fieldByName(fields, "Decimal1")?.DisplayName, "Staffing Target");
  assert.equal(fieldByName(fields, "Decimal1")?.FieldType, "Decimal");
  assert.equal(fieldByName(fields, "Bit1")?.DisplayName, "Active");
  assert.equal(fieldByName(fields, "Bit1")?.FieldType, "Bit");
  assert.equal(fieldByName(fields, "Datetime1")?.DisplayName, "Review Date");
  assert.equal(fieldByName(fields, "Datetime1")?.FieldType, "Datetime");
  assert.equal(fieldByName(fields, "Text2")?.DisplayName, "Status");
  assert.equal(fieldByName(fields, "Text2")?.Type, "select");

  console.log(JSON.stringify({
    status: "pass",
    cases: [
      "Display Name / Storage Name / Control field tables materialize business fields",
      "Storage Name is accepted as an internal field alias",
      "Control-only field tables infer Text, Decimal, Bit, Datetime, and select shapes",
      "legacy field-table headings no longer collapse generated lists to native Title only",
    ],
  }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

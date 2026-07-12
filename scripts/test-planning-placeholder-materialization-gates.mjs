#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { materializeFullAppGeneratedFinal } from "./materialize-full-app-generated-final.mjs";
import { readDecodedYapk } from "./lib/yapk-decode-utils.mjs";
import { isPlanningPlaceholder } from "./lib/planning-placeholder-utils.mjs";
import { validatePlanningPlaceholderMaterialization } from "./validate-planning-placeholder-materialization.mjs";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "planning-placeholder-materialization-"));
const cases = [];

try {
  for (const value of ["Not applicable.", "Not planned", "N/A", "None", "No Dashboard required", "Dashboard not required"]) {
    assert.equal(isPlanningPlaceholder(value), true, `${value} must be recognized as planning-only text`);
  }
  assert.equal(isPlanningPlaceholder("Not Applicable Cases"), false);
  assert.equal(isPlanningPlaceholder("None Loss Review"), false);
  cases.push("placeholder normalization covers punctuation and common no-resource variants without substring false positives");

  const badDecodedPath = writeJson("bad-decoded.json", decodedFixture({
    pages: [{ Title: "Not applicable.", LayoutID: "9001", Type: 103 }],
    formReports: [{ Name: "Not planned" }],
    navigationItems: [{ Title: "N/A", Type: 103, ListID: "9001" }],
  }));
  const badReport = validatePlanningPlaceholderMaterialization({ package: badDecodedPath });
  assert.equal(badReport.status, "fail");
  assert.ok(badReport.findings.every((finding) => finding.code === "PLANNING_PLACEHOLDER_MATERIALIZED_AS_RESOURCE"));
  assert.ok(badReport.findings.some((finding) => finding.path === "$.Pages[0].Title"));
  assert.ok(badReport.findings.some((finding) => finding.path === "$.FormNewReports[0].Name"));
  assert.ok(badReport.findings.some((finding) => finding.resourceKind === "navigation-item"));
  cases.push("hard gate rejects planning placeholders in Pages, FormNewReports, and navigation identity fields");

  const goodDecodedPath = writeJson("good-decoded.json", decodedFixture({
    pages: [{ Title: "Not Applicable Cases", LayoutID: "9002", Type: 103 }],
    navigationItems: [{ Title: "Not Applicable Cases", Type: 103, ListID: "9002" }],
  }));
  assert.equal(validatePlanningPlaceholderMaterialization({ package: goodDecodedPath }).status, "pass");
  cases.push("hard gate preserves legitimate business resource names that only contain similar words");

  const functionalSpecPath = writeText("functional-specification.md", `
# Functional Specification: Placeholder Regression

Generate one Data List and no Dashboard pages.
Business defaults approval status: user-default-approved-for-generation.
`);
  const appPlanPath = writeText("yeeflow-app-plan.md", `
# Placeholder Regression - Yeeflow App Plan

## 1. Plan Status
Business defaults approval status: user-default-approved-for-generation.

## 4. Data Lists and Document Libraries Plan

### 4.1 Runtime Records
- Resource type: Data list

#### Fields
| Field label | Field name | Field type |
| --- | --- | --- |
| Record name | Title | Text |

## 14. Dashboard Pages Plan

### 14.1 Not applicable.

No Dashboard is required for this focused application.

## 15. Application Navigation Plan
| Group | Item | Target Resource | Yeeflow Resource Type | Icon |
| --- | --- | --- | --- | --- |
| Operations | Runtime Records | Runtime Records | Data List | fa-solid fa-table |
`);
  const idManifestPath = writeJson("api-issued-ids.json", {
    ids: Array.from({ length: 220 }, (_, index) => String(970000000000000000n + BigInt(index))),
  });
  const materialized = materializeFullAppGeneratedFinal({
    functionalSpec: functionalSpecPath,
    appPlan: appPlanPath,
    outDir: path.join(tempDir, "generated-final"),
    apiIdManifest: idManifestPath,
    tenantId: "970000000000999999",
    cwd: tempDir,
  });
  assert.equal(materialized.status, "pass", JSON.stringify(materialized.findings || [], null, 2));
  const decoded = readDecodedYapk(materialized.outputs.package).decoded;
  assert.deepEqual(decoded.Pages, []);
  const navigation = JSON.parse(decoded.ListSet.LayoutView);
  const navigationTitles = (navigation.sort || []).flatMap((group) => (group.list || []).map((item) => item.Title));
  assert.ok(!navigationTitles.some((title) => isPlanningPlaceholder(title)));
  assert.equal(validatePlanningPlaceholderMaterialization({ package: materialized.outputs.package, plan: appPlanPath }).status, "pass");
  cases.push("full-app materializer emits zero Type 103 pages and zero placeholder navigation items when Dashboard plan says Not applicable.");

  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function decodedFixture({ pages = [], formReports = [], navigationItems = [] } = {}) {
  return {
    ListSet: {
      ListID: "9000",
      Title: "Placeholder Gate Fixture",
      LayoutView: JSON.stringify({
        sortVer: 1,
        sort: [{ ID: "9100", Title: "Operations", Type: "classes", list: navigationItems }],
        attrs: {},
      }),
    },
    Pages: pages,
    Childs: [],
    Forms: [],
    FormReports: [],
    FormNewReports: formReports,
    DataReports: [],
    OtherModules: [],
  };
}

function writeText(name, content) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, `${content.trim()}\n`);
  return file;
}

function writeJson(name, value) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
}


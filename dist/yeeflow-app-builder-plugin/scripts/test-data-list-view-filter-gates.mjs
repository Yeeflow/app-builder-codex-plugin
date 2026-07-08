#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodeYapkResource } from "./lib/yapk-decode-utils.mjs";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { validateDataViewFixedFilters, filterExpressionUsesToday } = require(path.join(ROOT, "scripts/lib/data-list-view-filter-utils.cjs"));

const fieldsByName = new Map([
  ["Title", field("Title", "Text", "input")],
  ["Datetime1", field("Datetime1", "Datetime", "datepicker")],
  ["Text3", field("Text3", "Text", "identity-picker")],
  ["Text4", field("Text4", "Text", "radio")],
  ["Decimal1", field("Decimal1", "Decimal", "currency")],
  ["Text7", field("Text7", "Text", "input")],
]);

const results = [];

expectPass("All Events no fixed filter passes", []);
expectPass("Schedule Overview date non-empty and now lower bound passes", [
  { key: "date-not-empty", pre: "and", left: "Datetime1", op: "7", right: null },
  { key: "date-now", pre: "and", left: "Datetime1", op: "3", right: [{ type: "func", func: "now", params: [] }], showCus: false },
]);
expectPass("RSVP Tracker and non-empty filters pass", [
  { key: "guest-list-not-empty", pre: "and", left: "Text3", op: "7", right: null },
  { key: "rsvp-status-not-empty", pre: "and", left: "Text4", op: "7", right: null },
]);
expectPass("Budget and Vendors or non-empty filters pass", [
  { key: "vendors-not-empty", pre: "or", left: "Text7", op: "7", right: null },
  { key: "budget-not-empty", pre: "or", left: "Decimal1", op: "7", right: null },
]);
expectPass("nested two-level data view filters pass", [
  {
    key: "outer",
    pre: "and",
    conditions: [
      { key: "budget", pre: "and", left: "Decimal1", op: "7", right: null },
      { key: "vendor", pre: "or", left: "Text7", op: "7", right: null },
    ],
  },
]);

expectCode("unknown fixed-filter field fails", [
  { key: "bad-field", pre: "and", left: "Text999", op: "7", right: null },
], "DATA_VIEW_FILTER_FIELD_NOT_FOUND");
expectCode("Today function is rejected in favor of now", [
  { key: "today", pre: "and", left: "Datetime1", op: "3", right: [{ type: "func", func: "Today", params: [] }] },
], "DATA_VIEW_FILTER_TODAY_FUNCTION_UNSUPPORTED");
expectCode("literal Today token is rejected", [
  { key: "today-literal", pre: "and", left: "Datetime1", op: "3", right: "Today" },
], "DATA_VIEW_FILTER_TODAY_FUNCTION_UNSUPPORTED");
expectCode("non-empty operator right must be null", [
  { key: "bad-right", pre: "and", left: "Text7", op: "7", right: "not empty" },
], "DATA_VIEW_FILTER_EMPTY_OPERATOR_RIGHT_NOT_NULL");
expectCode("invalid pre combinator fails", [
  { key: "bad-pre", pre: "xor", left: "Text7", op: "7", right: null },
], "DATA_VIEW_FILTER_PRE_INVALID");

assert.equal(filterExpressionUsesToday([{ type: "func", func: "now", params: [] }]), false);
assert.equal(filterExpressionUsesToday([{ type: "func", func: "Today", params: [] }]), true);

expectEventPlanningMaterialization();
expectCorporateSecretarialExplicitFilterMaterialization();
expectVagueBusinessFilterMaterializationFailure();
expectPlannedViewRequiresFieldTableFailure();

console.log(JSON.stringify({
  status: "pass",
  test: "test-data-list-view-filter-gates",
  results,
}, null, 2));

function field(FieldName, FieldType, Type) {
  return { FieldName, FieldType, Type };
}

function collectIssues(filters) {
  const issues = [];
  validateDataViewFixedFilters({
    filters,
    fieldsByName,
    knownSystemFields: new Set(["ListDataID", "Created", "CreatedBy", "Modified", "ModifiedBy"]),
    severity: "error",
    viewTitle: "Fixture View",
    pathPrefix: "fixture.LayoutView.filter",
    addIssue: (severity, code, message, details) => issues.push({ severity, code, message, details }),
  });
  return issues;
}

function expectPass(name, filters) {
  const issues = collectIssues(filters).filter((issue) => issue.severity === "error");
  results.push({ name, status: issues.length ? "fail" : "pass", issues });
  assert.deepEqual(issues, [], name);
}

function expectCode(name, filters, code) {
  const issues = collectIssues(filters);
  results.push({ name, status: issues.some((issue) => issue.code === code) ? "pass" : "fail", expectedCode: code, issues });
  assert.ok(issues.some((issue) => issue.code === code), `${name} should include ${code}: ${JSON.stringify(issues, null, 2)}`);
}

function expectEventPlanningMaterialization() {
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-dataview-filter-gate-"));
  const specPath = path.join(tmpdir, "functional-specification.md");
  const planPath = path.join(tmpdir, "yeeflow-app-plan.md");
  const outDir = path.join(tmpdir, "dist");
  fs.writeFileSync(specPath, "# Functional Specification\n\nBuild an Event Planning application.\n", "utf8");
  fs.writeFileSync(planPath, `# Event Planning - Yeeflow App Plan

## 1. Application Overview
Event Planning app.

## 4. Data Lists and Document Libraries Plan
| List Name | Purpose |
| --- | --- |
| Event Planning | Store event planning records. |

### 4.1 Event Planning
| Field label | Field name | Field type | Control type | Purpose |
| --- | --- | --- | --- | --- |
| Name | Title | Text | input | Event name |
| Date | Datetime1 | Datetime | datepicker | Event date |
| Budget | Decimal1 | Decimal | input_number | Event budget |
| Guest List | Text3 | Text | identity-picker | Guests |
| RSVP Status | Text4 | Text | select | choices: Confirmed, Declined, Pending |
| Vendors | Text7 | Text | input | Vendors |

## 13. Data List Views Plan
| View Name | Data List | URL / Route Key | Display Fields | Query/Search Fields | Filters | Default |
| --- | --- | --- | --- | --- | --- | --- |
| All Events | Event Planning | all-events | Name, Date, RSVP Status | Name, Date, RSVP Status | No fixed filter | Yes |
| Schedule Overview | Event Planning | schedule-overview | Name, Date | Name, Date | Date is not empty AND Date >= Today | No |
| RSVP Tracker | Event Planning | rsvp-tracker | Name, RSVP Status, Guest List | Name, RSVP Status, Guest List | Guest List is not empty AND RSVP Status is not empty | No |
| Budget and Vendors | Event Planning | budget-and-vendors | Name, Budget, Vendors | Name, Vendors | Budget is not empty OR Vendors is not empty | No |
`, "utf8");

  execFileSync(process.execPath, [
    path.join(ROOT, "scripts/materialize-full-app-generated-final.mjs"),
    "--functional-spec", specPath,
    "--app-plan", planPath,
    "--out-dir", outDir,
    "--allow-fixture-api-ids-for-tests",
    "--json",
  ], { cwd: ROOT, stdio: "ignore" });

  const packageName = fs.readdirSync(outDir).find((name) => name.endsWith(".yapk"));
  assert.ok(packageName, "materializer should produce a generated-final YAPK fixture");
  const wrapper = JSON.parse(fs.readFileSync(path.join(outDir, packageName), "utf8"));
  const decoded = decodeYapkResource(wrapper);
  const child = decoded.Childs?.[0];
  assert.ok(child, "materialized Event Planning package should include the Event Planning data list");
  const views = new Map(child.Layouts.filter((layout) => layout.Type === 0).map((layout) => [layout.Title, JSON.parse(layout.LayoutView)]));
  assert.equal(views.size, 4, "App Plan data views should materialize as four Type 0 layouts");
  assert.deepEqual(views.get("All Events").filter, [], "All Events should remain unfiltered");
  assert.deepEqual(views.get("All Events").layout.map((field) => field.FieldName), ["Title", "Datetime1", "Text4"]);
  assert.deepEqual(views.get("Schedule Overview").filter.map((condition) => ({ left: condition.left, op: condition.op, right: condition.right })), [
    { left: "Datetime1", op: "7", right: null },
    { left: "Datetime1", op: "3", right: [{ type: "func", func: "now", params: [] }] },
  ]);
  assert.deepEqual(views.get("RSVP Tracker").filter.map((condition) => ({ pre: condition.pre, left: condition.left, op: condition.op, right: condition.right })), [
    { pre: "and", left: "Text3", op: "7", right: null },
    { pre: "and", left: "Text4", op: "7", right: null },
  ]);
  assert.deepEqual(views.get("Budget and Vendors").filter.map((condition) => ({ pre: condition.pre, left: condition.left, op: condition.op, right: condition.right })), [
    { pre: "or", left: "Decimal1", op: "7", right: null },
    { pre: "or", left: "Text7", op: "7", right: null },
  ]);
  results.push({ name: "Event Planning App Plan data views materialize fixed filters", status: "pass" });
}

function expectVagueBusinessFilterMaterializationFailure() {
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-dataview-filter-vague-"));
  const specPath = path.join(tmpdir, "functional-specification.md");
  const planPath = path.join(tmpdir, "yeeflow-app-plan.md");
  const outDir = path.join(tmpdir, "dist");
  fs.writeFileSync(specPath, "# Functional Specification\n\nBuild a corporate secretarial application.\n", "utf8");
  fs.writeFileSync(planPath, `# Corporate Secretarial Information System - Yeeflow App Plan

## 1. Application Overview
Corporate secretarial application.

## 4. Data Lists and Document Libraries Plan
| List Name | Purpose |
| --- | --- |
| Board Committee Meetings | Store board and committee meeting records. |

### 4.1 Board Committee Meetings
| Field label | Field name | Field type | Control type | Purpose |
| --- | --- | --- | --- | --- |
| Meeting Title | Title | Text | input | Meeting title |
| Meeting Date | Datetime1 | Datetime | datepicker | Meeting date |
| Meeting Status | Text1 | Text | radio | choices: Active, Closed |

## 13. Data List Views Plan
| Data List | View Name | Purpose | Filters | Columns | Sort |
| --- | --- | --- | --- | --- | --- |
| Board Committee Meetings | Meeting Tracker | Meeting lifecycle | All active meetings | Meeting Title, Meeting Date, Meeting Status | Meeting Date desc |
`, "utf8");

  let failed = false;
  let parsed = null;
  try {
    execFileSync(process.execPath, [
      path.join(ROOT, "scripts/materialize-full-app-generated-final.mjs"),
      "--functional-spec", specPath,
      "--app-plan", planPath,
      "--out-dir", outDir,
      "--allow-fixture-api-ids-for-tests",
      "--json",
    ], { cwd: ROOT, encoding: "utf8" });
  } catch (error) {
    failed = true;
    parsed = JSON.parse(error.stdout || "{}");
  }
  assert.equal(failed, true, "vague fixed filter text should block generated-final materialization");
  assert.ok(parsed?.findings?.some((finding) => finding.code === "DATA_VIEW_FILTER_PLANNED_BUT_NOT_MATERIALIZED"), JSON.stringify(parsed, null, 2));
  results.push({ name: "Vague business fixed filters fail instead of materializing empty LayoutView.filter[]", status: "pass" });
}

function expectCorporateSecretarialExplicitFilterMaterialization() {
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-dataview-filter-corpsec-"));
  const specPath = path.join(tmpdir, "functional-specification.md");
  const planPath = path.join(tmpdir, "yeeflow-app-plan.md");
  const outDir = path.join(tmpdir, "dist");
  fs.writeFileSync(specPath, "# Functional Specification\n\nBuild a corporate secretarial information system.\n", "utf8");
  fs.writeFileSync(planPath, `# Corporate Secretarial Information System - Yeeflow App Plan

## 1. Application Overview
Corporate secretarial application.

## 4. Data Lists and Document Libraries Plan
| List Name | Purpose |
| --- | --- |
| Board Committee Meetings | Store board and committee meeting records. |

### 4.1 Board Committee Meetings
| Field label | Field name | Field type | Control type | Purpose |
| --- | --- | --- | --- | --- |
| Meeting Title | Title | Text | input | Meeting title |
| Entity | Text1 | Text | lookup | Entity |
| Committee | Text2 | Text | radio | Committee |
| Meeting Date | Datetime1 | Datetime | datepicker | Meeting date |
| Agenda Status | Text3 | Text | radio | Agenda status |
| Pack Status | Text4 | Text | radio | Pack status |
| Minutes Status | Text5 | Text | radio | choices: Draft, Approved, Closed |

## 13. Data List Views Plan
| Data List | View Name | Purpose | Filters | Columns | Sort |
| --- | --- | --- | --- | --- | --- |
| Board Committee Meetings | Meeting Tracker | Meeting lifecycle | Meeting Date is not empty AND Minutes Status != Closed | Meeting Title, Entity, Committee, Meeting Date, Agenda Status, Pack Status, Minutes Status | Meeting Date desc |
`, "utf8");

  execFileSync(process.execPath, [
    path.join(ROOT, "scripts/materialize-full-app-generated-final.mjs"),
    "--functional-spec", specPath,
    "--app-plan", planPath,
    "--out-dir", outDir,
    "--allow-fixture-api-ids-for-tests",
    "--json",
  ], { cwd: ROOT, stdio: "ignore" });

  const packageName = fs.readdirSync(outDir).find((name) => name.endsWith(".yapk"));
  assert.ok(packageName, "materializer should produce a corporate-secretarial fixture package");
  const decoded = decodeYapkResource(JSON.parse(fs.readFileSync(path.join(outDir, packageName), "utf8")));
  const child = decoded.Childs?.find((item) => item.List?.Title === "Board Committee Meetings");
  assert.ok(child, "Board Committee Meetings data list should materialize");
  const tracker = child.Layouts.find((layout) => layout.Title === "Meeting Tracker");
  assert.ok(tracker, "Meeting Tracker view should materialize");
  const layoutView = JSON.parse(tracker.LayoutView);
  assert.deepEqual(layoutView.layout.map((field) => field.FieldName), ["Title", "Text1", "Text2", "Datetime1", "Text3", "Text4", "Text5"]);
  assert.deepEqual(layoutView.filter.map((condition) => ({ pre: condition.pre, left: condition.left, op: condition.op, right: condition.right })), [
    { pre: "and", left: "Datetime1", op: "7", right: null },
    { pre: "and", left: "Text5", op: "1", right: "Closed" },
  ]);
  results.push({ name: "Corporate Secretarial Meeting Tracker materializes explicit fixed filters", status: "pass" });
}

function expectPlannedViewRequiresFieldTableFailure() {
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-dataview-filter-titleonly-"));
  const specPath = path.join(tmpdir, "functional-specification.md");
  const planPath = path.join(tmpdir, "yeeflow-app-plan.md");
  const outDir = path.join(tmpdir, "dist");
  fs.writeFileSync(specPath, "# Functional Specification\n\nBuild a corporate secretarial information system.\n", "utf8");
  fs.writeFileSync(planPath, `# Corporate Secretarial Information System - Yeeflow App Plan

## 1. Application Overview
Corporate secretarial application.

## 4. Data Lists and Document Libraries Plan
| List Name | Purpose |
| --- | --- |
| Board Committee Meetings | Store board and committee meeting records. |

## 13. Data List Views Plan
| Data List | View Name | Purpose | Filters | Columns | Sort |
| --- | --- | --- | --- | --- | --- |
| Board Committee Meetings | Meeting Tracker | Meeting lifecycle | Meeting Date is not empty | Meeting Title, Entity, Committee, Meeting Date | Meeting Date desc |
`, "utf8");

  let failed = false;
  let parsed = null;
  try {
    execFileSync(process.execPath, [
      path.join(ROOT, "scripts/materialize-full-app-generated-final.mjs"),
      "--functional-spec", specPath,
      "--app-plan", planPath,
      "--out-dir", outDir,
      "--allow-fixture-api-ids-for-tests",
      "--json",
    ], { cwd: ROOT, encoding: "utf8" });
  } catch (error) {
    failed = true;
    parsed = JSON.parse(error.stdout || "{}");
  }
  assert.equal(failed, true, "planned business view without a field table should block Title-only fallback");
  assert.ok(parsed?.findings?.some((finding) => finding.code === "DATA_LIST_FIELD_TABLE_REQUIRED_FOR_PLANNED_VIEW"), JSON.stringify(parsed, null, 2));
  results.push({ name: "Planned business data views require parseable field tables instead of Title-only fallback", status: "pass" });
}

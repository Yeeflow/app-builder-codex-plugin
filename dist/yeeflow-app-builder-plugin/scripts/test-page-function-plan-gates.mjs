#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();

function writeJson(dir, name, value) {
  const file = path.join(dir, `${name}.json`);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
}

function run(script, args) {
  const result = spawnSync(process.execPath, [script, ...args, "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  let report;
  try {
    report = JSON.parse(result.stdout || "{}");
  } catch (error) {
    throw new Error(`Could not parse ${script} output: ${error.message}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  }
  return { result, report };
}

function expectCode(report, code) {
  assert.equal(
    (report.findings || []).some((finding) => finding.code === code),
    true,
    `expected ${code}; findings: ${JSON.stringify(report.findings, null, 2)}`,
  );
}

function appPlan(overrides = {}) {
  return {
    dashboards: [{ name: "Operations Dashboard", fields: ["Title"], actions: ["Open Request"] }],
    approvalForms: [{
      name: "Purchase Approval",
      fields: ["Title", "Amount", "Requester", "Justification", "Manager Comment"],
      actions: ["Save as draft", "Submit", "Approve", "Reject", "Print"],
      taskForms: [{ name: "Manager Review", actions: ["Approve", "Reject"] }],
      printPages: [{ name: "Purchase Approval Print" }],
    }],
    formReports: [{ name: "Purchase Approval Report", approvalForm: "Purchase Approval" }],
    dataLists: [{
      name: "Purchase Requests",
      fields: ["Title", "Amount", "Status", "Requester", "Created Date", "Manager Comment"],
      forms: [
        { name: "New Purchase Request", type: "New", fields: ["Title", "Amount", "Justification"], actions: ["Save", "Cancel"] },
        { name: "Edit Purchase Request", type: "Edit", fields: ["Title", "Amount", "Justification"], actions: ["Save", "Cancel"] },
        { name: "View Purchase Request", type: "View", fields: ["Title", "Amount", "Status", "Requester"], actions: ["Open Request"] },
      ],
    }],
    documentLibraries: [{
      name: "Purchase Documents",
      fields: ["Title", "Status", "Created Date"],
      forms: [{ name: "View Purchase Document", type: "View", fields: ["Title", "Status"], actions: ["Open Document"] }],
    }],
    ...overrides,
  };
}

function pagePlan(overrides = {}) {
  return {
    applicationName: "Purchase Operations",
    applicationLayout: "application-layout-1-vertical-nav",
    dashboards: [{
      name: "Operations Dashboard",
      desktopBehavior: "Two-column operations dashboard with KPI row and queue.",
      mobileBehavior: "Stacks KPI cards first, then request queue.",
      regions: [{
        name: "Request Queue",
        controlType: "Collection",
        source: "Purchase Requests",
        fields: ["Title", "Amount", "Status"],
        filters: ["Status is not Completed"],
        actions: ["Open Request"],
      }],
    }],
    approvalForms: [{
      name: "Purchase Approval",
      submissionForm: {
        desktopBehavior: "Sectioned request form.",
        mobileBehavior: "Single-column stacked fields with action bar at bottom.",
        actions: ["Save as draft", "Submit"],
        fields: [
          { name: "Title", controlType: "Text", field: "Title" },
          { name: "Amount", controlType: "Dynamic field", field: "Amount" },
          { name: "Justification", controlType: "Text", field: "Justification" },
        ],
      },
      taskForms: [{
        name: "Manager Review",
        differencesFromSubmission: "Adds manager comment and decision buttons; request fields are read-only.",
        desktopBehavior: "Same section rhythm as submission with decision panel.",
        mobileBehavior: "Request summary first, decision controls second.",
        actions: ["Approve", "Reject"],
        fields: [{ name: "Manager Comment", controlType: "Text", field: "Manager Comment" }],
      }],
      printPages: [{
        name: "Purchase Approval Print",
        desktopBehavior: "Printable single-column evidence layout.",
        mobileBehavior: "Print page remains readable in one column.",
        content: [{ name: "Title", controlType: "Text", field: "Title" }],
      }],
    }],
    dataListForms: [{
      resourceName: "Purchase Requests",
      forms: [
        {
          name: "New Purchase Request",
          type: "New",
          desktopBehavior: "Compact two-column editable form.",
          mobileBehavior: "Single-column editable fields.",
          fields: [{ name: "Title", controlType: "Text", field: "Title" }, { name: "Amount", controlType: "Dynamic field", field: "Amount" }],
          actions: ["Save", "Cancel"],
        },
        {
          name: "Edit Purchase Request",
          type: "Edit",
          desktopBehavior: "Compact two-column editable form.",
          mobileBehavior: "Single-column editable fields.",
          fields: [{ name: "Title", controlType: "Text", field: "Title" }, { name: "Amount", controlType: "Dynamic field", field: "Amount" }],
          actions: ["Save", "Cancel"],
        },
        {
          name: "View Purchase Request",
          type: "View",
          desktopBehavior: "Summary header with related document region.",
          mobileBehavior: "Summary first, related documents below.",
          fields: [{ name: "Title", controlType: "Text", field: "Title" }, { name: "Status", controlType: "Dynamic field", field: "Status" }],
          actions: ["Open Request"],
          relatedRegions: [{
            name: "Related Documents",
            regionType: "Data table",
            source: "Purchase Documents",
            binding: "Purchase Documents.Title matches current Title",
            fields: ["Title", "Status"],
            filters: ["Current purchase request"],
            actions: ["Open Document"],
            openingBehavior: "Open document view form in slide panel",
          }],
        },
      ],
    }],
    documentLibraryForms: [{
      resourceName: "Purchase Documents",
      forms: [{
        name: "View Purchase Document",
        type: "View",
        desktopBehavior: "Document preview with metadata side panel.",
        mobileBehavior: "Metadata stacks above document preview.",
        fields: [{ name: "Title", controlType: "Text", field: "Title" }, { name: "Status", controlType: "Dynamic field", field: "Status" }],
        actions: ["Open Document"],
      }],
    }],
    ...overrides,
  };
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "page-function-plan-gates-"));
const results = [];

try {
  let planFile = writeJson(tempDir, "valid-page-plan", pagePlan());
  let output = run("scripts/validate-page-function-plan.mjs", [planFile]);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "complete valid Page Function Plan passes", status: "pass" });

  const appFile = writeJson(tempDir, "valid-app-plan", appPlan());
  output = run("scripts/validate-app-plan-page-function-traceability.mjs", ["--app-plan", appFile, "--page-function-plan", planFile]);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "complete App Plan to Page Function Plan traceability passes", status: "pass" });

  output = run("scripts/validate-app-plan-page-function-traceability.mjs", ["--app-plan", appFile, "--page-function-plan", writeJson(tempDir, "missing-dashboard", pagePlan({ dashboards: [] }))]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "TRACEABILITY_DASHBOARD_PAGE_FUNCTION_MISSING");
  results.push({ case: "missing dashboard page function entry fails", status: "pass" });

  output = run("scripts/validate-app-plan-page-function-traceability.mjs", ["--app-plan", appFile, "--page-function-plan", writeJson(tempDir, "missing-approval", pagePlan({ approvalForms: [{ name: "Purchase Approval", submissionForm: null, taskForms: [], printPages: [] }] }))]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "TRACEABILITY_APPROVAL_SUBMISSION_MISSING");
  expectCode(output.report, "TRACEABILITY_APPROVAL_TASK_MISSING");
  expectCode(output.report, "TRACEABILITY_APPROVAL_PRINT_MISSING");
  results.push({ case: "missing approval submission/task/print entries fail", status: "pass" });

  output = run("scripts/validate-app-plan-page-function-traceability.mjs", ["--app-plan", appFile, "--page-function-plan", writeJson(tempDir, "missing-data-form", pagePlan({ dataListForms: [{ resourceName: "Purchase Requests", forms: [] }] }))]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "TRACEABILITY_DATA_LIST_FORM_MISSING");
  results.push({ case: "missing data list form entry fails", status: "pass" });

  output = run("scripts/validate-app-plan-page-function-traceability.mjs", ["--app-plan", appFile, "--page-function-plan", planFile]);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "Form Report is correctly not required as UI surface", status: "pass" });

  const badNewEdit = pagePlan();
  badNewEdit.dataListForms[0].forms[0].relatedRegions = [{ name: "Audit Analytics", regionType: "Collection", source: "Purchase Requests" }];
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "bad-new-edit", badNewEdit)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_NEW_EDIT_UNRELATED_REGION");
  results.push({ case: "New/Edit dashboard-style related region fails", status: "pass" });

  output = run("scripts/validate-page-function-plan.mjs", [planFile]);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "View form related Data table region with source/binding/actions passes", status: "pass" });

  const badRefs = pagePlan();
  badRefs.dashboards[0].regions[0].controlType = "Magic Board";
  badRefs.dashboards[0].regions[0].fields.push("Ghost Field");
  output = run("scripts/validate-app-plan-page-function-traceability.mjs", ["--app-plan", appFile, "--page-function-plan", writeJson(tempDir, "unsupported-and-ghost", badRefs)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "TRACEABILITY_UNSUPPORTED_CONTROL");
  expectCode(output.report, "TRACEABILITY_FIELD_NOT_IN_APP_PLAN");
  results.push({ case: "unsupported controls and fields not in App Plan fail", status: "pass" });

  console.log(JSON.stringify({ status: "pass", results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

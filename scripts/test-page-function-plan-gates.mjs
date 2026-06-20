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
      pagePurpose: "Operations overview dashboard for request queues and KPIs.",
      businessTaskSolved: "Help managers see workload metrics and open pending requests.",
      dashboardPagePattern: "standard_dashboard_page_shell",
      desktopBehavior: "Two-column operations dashboard with KPI row and queue.",
      mobileBehavior: "Stacks KPI cards first, then request queue.",
      dashboardSectionTemplates: [
        {
          templateId: "kpi_card_row",
          regionName: "Operations KPI Row",
          businessPurpose: "KPI metrics for open request counts and total amount.",
          source: "Purchase Requests",
          displayedFields: ["Title", "Amount", "Status"],
          filters: ["Current fiscal period"],
          grouping: ["Status"],
          sorting: ["Created Date descending"],
          actions: [],
          requiredControls: ["container", "grid", "text", "summary"],
          proofStatus: "export-proven",
          whyTemplateFits: "KPI metrics need the export-proven KPI/Summary card row.",
        },
        {
          templateId: "data_table_section",
          regionName: "Request Queue",
          businessPurpose: "Record table work queue for pending purchase requests.",
          source: "Purchase Requests",
          displayedFields: ["Title", "Amount", "Status"],
          filters: ["Status is not Completed"],
          grouping: [],
          sorting: ["Created Date descending"],
          actions: ["Open Request"],
          requiredControls: ["data-list"],
          proofStatus: "runtime-proven",
          whyTemplateFits: "A data table section fits a scannable record queue.",
        },
      ],
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
  results.push({ case: "valid dashboard using kpi_card_row plus data_table_section passes", status: "pass" });

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

  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "valid-kanban-dashboard", pagePlan({
    dashboards: [{
      name: "Operations Dashboard",
      pagePurpose: "Status board dashboard for triage queues.",
      businessTaskSolved: "Managers triage requests by status lane.",
      dashboardPagePattern: "standard_dashboard_page_shell",
      desktopBehavior: "Kanban board with actions.",
      mobileBehavior: "Stacks lanes into vertical status groups.",
      dashboardSectionTemplates: [{
        templateId: "kanban_status_board",
        regionName: "Request Status Board",
        businessPurpose: "Kanban status board for request triage.",
        source: "Purchase Requests",
        displayedFields: ["Title", "Status", "Requester"],
        filters: ["Status is not Completed"],
        grouping: ["Status"],
        sorting: ["Created Date descending"],
        actions: ["Open Request"],
        requiredControls: ["kanban", "container", "text", "dynamic-field"],
        proofStatus: "runtime-proven",
        whyTemplateFits: "Status lanes are the intended use for kanban_status_board.",
      }],
      regions: [{
        name: "Request Status Board",
        controlType: "Kanban",
        source: "Purchase Requests",
        fields: ["Title", "Status", "Requester"],
        filters: ["Status is not Completed"],
        actions: ["Open Request"],
      }],
    }],
  }))]);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "valid dashboard using kanban_status_board passes", status: "pass" });

  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "valid-three-column-dashboard", pagePlan({
    dashboards: [{
      name: "Operations Dashboard",
      pagePurpose: "Three column review queue workspace for request triage.",
      businessTaskSolved: "Managers work a list-detail review queue with context and actions.",
      dashboardPagePattern: "three_column_workspace_shell",
      desktopBehavior: "Left filters, main request queue, right selected request detail.",
      mobileBehavior: "Panels stack as filters, queue, then detail.",
      threeColumnPanels: {
        left: { purpose: "Queue filters", source: "Purchase Requests", content: ["Status filters", "Requester filters"] },
        main: { purpose: "Request queue", source: "Purchase Requests", content: ["Request cards", "Open Request action"] },
        right: { purpose: "Selected request detail", source: "Purchase Requests", content: ["Amount", "Requester", "Manager Comment"] },
      },
      dashboardSectionTemplates: [{
        templateId: "three_column_workspace_shell",
        regionName: "Manager Review Workspace",
        businessPurpose: "Three column workspace for list-detail triage.",
        source: "Purchase Requests",
        displayedFields: ["Title", "Amount", "Status", "Requester"],
        filters: ["Status is not Completed"],
        grouping: ["Status"],
        sorting: ["Created Date descending"],
        actions: ["Open Request"],
        requiredControls: ["container", "heading", "icon"],
        proofStatus: "export-proven",
        whyTemplateFits: "The page needs left context, main work queue, and right detail panels.",
      }],
      regions: [{
        name: "Manager Review Workspace",
        controlType: "Container",
        source: "Purchase Requests",
        fields: ["Title", "Amount", "Status", "Requester"],
        filters: ["Status is not Completed"],
        actions: ["Open Request"],
      }],
    }],
  }))]);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "valid three_column_workspace_shell with meaningful panels passes", status: "pass" });

  const unknownTemplate = pagePlan();
  unknownTemplate.dashboards[0].dashboardSectionTemplates[0].templateId = "executive_magic_template";
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "unknown-template", unknownTemplate)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_TEMPLATE_GENERIC_OR_UNKNOWN");
  results.push({ case: "invalid dashboard with unknown templateId fails", status: "pass" });

  const noSectionTemplates = pagePlan();
  noSectionTemplates.dashboards[0].dashboardSectionTemplates = [];
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "no-section-templates", noSectionTemplates)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_SECTION_TEMPLATES_MISSING");
  results.push({ case: "invalid dashboard with no section templates fails", status: "pass" });

  const incompatibleTemplate = pagePlan();
  incompatibleTemplate.dashboards[0].dashboardSectionTemplates[0].templateId = "business_alert_card";
  incompatibleTemplate.dashboards[0].dashboardSectionTemplates[0].businessPurpose = "KPI metric row for totals";
  incompatibleTemplate.dashboards[0].dashboardSectionTemplates[0].whyTemplateFits = "This is a metric row";
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "incompatible-template", incompatibleTemplate)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_TEMPLATE_PURPOSE_INCOMPATIBLE");
  results.push({ case: "invalid dashboard with incompatible template purpose fails", status: "pass" });

  const badThreeColumn = pagePlan({
    dashboards: [{
      name: "Operations Dashboard",
      pagePurpose: "Simple dashboard overview.",
      businessTaskSolved: "Show a few metrics.",
      dashboardPagePattern: "three_column_workspace_shell",
      desktopBehavior: "Three columns.",
      mobileBehavior: "Stacked.",
      dashboardSectionTemplates: [{
        templateId: "three_column_workspace_shell",
        regionName: "Simple Overview",
        businessPurpose: "Three column workspace shell.",
        source: "Purchase Requests",
        displayedFields: ["Title", "Status"],
        filters: ["All"],
        grouping: [],
        sorting: ["Created Date descending"],
        actions: ["Open Request"],
        requiredControls: ["container", "heading", "icon"],
        proofStatus: "export-proven",
        whyTemplateFits: "Uses three columns.",
      }],
      regions: [{
        name: "Simple Overview",
        controlType: "Container",
        source: "Purchase Requests",
        fields: ["Title", "Status"],
        filters: ["All"],
        actions: ["Open Request"],
      }],
    }],
  });
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "bad-three-column", badThreeColumn)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_THREE_COLUMN_LEFT_PANEL_MISSING");
  expectCode(output.report, "PAGE_FUNCTION_THREE_COLUMN_SIMPLE_DASHBOARD_INVALID");
  results.push({ case: "invalid three_column_workspace_shell without meaningful panels fails", status: "pass" });

  const proseOnly = pagePlan();
  proseOnly.dashboards[0].dashboardPagePattern = "";
  proseOnly.dashboards[0].dashboardSectionTemplates = [];
  proseOnly.dashboards[0].notes = "Use kpi_card_row and data_table_section templates.";
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "prose-only-template", proseOnly)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_TEMPLATE_PROSE_ONLY");
  results.push({ case: "invalid prose-only template mention without structured fields fails", status: "pass" });

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

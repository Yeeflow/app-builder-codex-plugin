#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function plan({ deferred = false, dataReports = false } = {}) {
  return `# Office Asset Loan Management - Yeeflow App Plan

## 1. Plan Status
- Application name: Office Asset Loan Management

## 4. Data Lists and Document Libraries Plan
### 4.1 Asset Registry
- Selected Yeeflow resource type: Data list
### 4.2 Asset Loan Records
- Selected Yeeflow resource type: Data list

## 5. Approval Forms Plan
### 5.1 Asset Loan Request
- Approval form name: Asset Loan Request
- Assignment task required: No
- Form reports required: Yes
- Generation blocker if missing: Yes

## 6. Form Reports Plan
| Form Report Name | Related Approval Form | Purpose | Includes Sublist | Fields Included | Extra Field Configuration | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Asset Loan Request Report | Asset Loan Request | Loan approval reporting | No | Requester, asset, status | Current FormNewReports schema | Required |

## 7. Schedule Workflows Plan
| Schedule Workflow Name | Description | Schedule Configuration | Trigger Frequency | Nodes | Branches | Data Read/Write | Proof Level | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

## 10. Custom Data List Forms Plan
### 10.1 Asset Loan Records
| Form Name | Form Type | Purpose | Used By | Layout Pattern | Actions Required | Notes |
| --- | --- | --- | --- | --- | --- | --- |

## 11. Data List Workflows Plan
| Workflow Name | Host List/Library | Trigger Condition | Nodes in Order | Branches | Branch Conditions | Data Read/Write | Notifications/AI/External Calls | Proof Level | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## 12. Notifications Plan
| Notification Name | Host Resource | Trigger Condition | Recipients | Message Content | Data Fields Used | Proof Level | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |

## 14. Dashboard Pages Plan
### 14.1 Loan Operations Dashboard
- Page name: Loan Operations Dashboard
- Business purpose: Monitor loan demand, overdue returns, and active assignments.

#### Dashboard Sections
| Section Order | Section Name | Business Purpose | Source Data List or Business Object | Required Fields or Metrics | Selected Yeeflow Control Type Category | Why This Control Type Is Appropriate | User Actions Needed | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | KPI strip | Show active, overdue, and returned counts | Asset Loan Records | Active loans, overdue loans | Summary / KPI card | Summary cards expose count metrics | Open filtered list | validator-backed |
| 2 | Work queue | Show current loan records | Asset Loan Records | Requester, asset, due date, status | Collection | Portfolio/work queue display | Open detail | validator-backed |

#### Dashboard Filters
| Filter Name | Source Data List | Filter Field | Applies-to Dashboard Sections | Selected Yeeflow Filter/Control Type If Known | Default Business Scope | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- |
| Status filter | Asset Loan Records | Status | KPI strip, Work queue | Data Filter | Active and overdue | validator-backed |

#### Summary Metrics
| Metric Name | Source Data List | Source Field(s) | Calculation Logic | Selected Yeeflow Control Type Category | Display Format Intent | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- |
| Active Loans | Asset Loan Records | ListDataID, Status | Count records where Status is Active | Summary / KPI card | count | validator-backed |

#### Record Display Control Selection
| Section | Data Source | Display Need | Selected Record Display Control | Selection Reason | Detail/Open Behavior | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- |
| Work queue | Asset Loan Records | Portfolio work queue | Collection | Card queue works for repeated loan records | Open detail | validator-backed |

#### Item Template Dynamic Controls
| Host Control | Source List | Business Label | Source Field | Expected Dynamic Display Control Category | Display Purpose | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- |
| Work queue | Asset Loan Records | Asset tag | Asset Tag | dynamic field | Identify loaned asset | validator-backed |

## 15. Application Navigation Plan
| Navigation Order | Group | Item | Yeeflow Resource Type | Target Resource | Visible | Icon | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Requests | Asset Loan Request | Approval form | Asset Loan Request | Yes | fa-regular fa-calendar-check | Required |
| 2 | Monitoring | Loan Operations Dashboard | Dashboard | Loan Operations Dashboard | Yes | fa-solid fa-chart-line | Required |
| 3 | Administration | Asset Registry | Data list | Asset Registry | Yes | fa-solid fa-boxes-stacked | Required |

## 18. Generation Contract and Hard Gates
- Forms: [] is forbidden when approval forms are planned.
${dataReports ? "- DataReports planned: Yes\n" : ""}

## 22. Deferred or Runtime-Proof Items
| Item | Category | Reason | User Impact | Fallback | Required Proof or Follow-up |
| --- | --- | --- | --- | --- | --- |
${deferred ? "| Asset Loan Request Report | FormNewReports | Product decision defers report generation | Report unavailable until follow-up | Manual reporting | Follow-up generation proof |\n" : ""}
`;
}

function dashboardResource({ empty = false } = {}) {
  return JSON.stringify({
    type: "page",
    name: "Root",
    children: [
      {
        type: "container",
        name: "Main",
        children: [
          {
            type: "container",
            name: "Content",
            children: empty ? [] : [
              { type: "summary", id: "summary-active", name: "Active Loans" },
              { type: "data-filter", id: "filter-status", name: "Status filter" },
              { type: "collection", id: "work-queue", name: "Work queue", children: [{ type: "dynamic-field", name: "Asset tag" }] },
            ],
          },
        ],
      },
    ],
  });
}

function layoutView({ genericOnly = false } = {}) {
  const groups = genericOnly
    ? [{ Title: "Workspace", Type: "classes", list: [{ Title: "Loan Operations Dashboard", Type: 103, ListID: "page-dashboard" }] }]
    : [
      { Title: "Requests", Type: "classes", list: [{ Title: "Asset Loan Request", Type: 105, ListID: "form-loan" }] },
      { Title: "Monitoring", Type: "classes", list: [{ Title: "Loan Operations Dashboard", Type: 103, ListID: "page-dashboard" }] },
      { Title: "Administration", Type: "classes", list: [{ Title: "Asset Registry", Type: 1, ListID: "list-assets" }] },
    ];
  return JSON.stringify({ sortVer: 1, sort: groups });
}

function decoded({
  forms = true,
  reports = true,
  dataReports = false,
  dashboardEmpty = false,
  genericNavigation = false,
  partialDescription = "",
} = {}) {
  return {
    ListSet: { Title: "Office Asset Loan Management", ListID: "app-root", LayoutView: layoutView({ genericOnly: genericNavigation }) },
    Childs: [
      { List: { Title: "Asset Registry", ListID: "list-assets" }, Fields: [], Layouts: [] },
      { List: { Title: "Asset Loan Records", ListID: "list-loans" }, Fields: [], Layouts: [] },
    ],
    Forms: forms ? [{ Name: "Asset Loan Request", Key: "form-loan" }] : [],
    FormNewReports: reports ? [{ Title: "Asset Loan Request Report", DefKey: "form-loan" }] : [],
    DataReports: dataReports ? [{ Title: "Asset Utilization Data Report" }] : [],
    Pages: [{ Title: "Loan Operations Dashboard", Type: 103, LayoutID: "page-dashboard", LayoutInResources: [{ Resource: dashboardResource({ empty: dashboardEmpty }) }] }],
    Description: partialDescription,
  };
}

function writeFile(dir, name, content) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, typeof content === "string" ? content : `${JSON.stringify(content, null, 2)}\n`);
  return file;
}

function run(planFile, packageFile) {
  const result = spawnSync(process.execPath, ["scripts/validate-generated-final-resource-completeness.mjs", "--plan", planFile, "--package", packageFile], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  let report;
  try {
    report = JSON.parse(result.stdout || "{}");
  } catch (error) {
    throw new Error(`Validator did not emit JSON: ${error.message}\n${result.stdout}\n${result.stderr}`);
  }
  return { result, report };
}

function codes(report) {
  return new Set((report.findings || []).map((finding) => finding.code));
}

function expectFail(caseName, report, code) {
  if (report.status !== "fail" || !codes(report).has(code)) {
    throw new Error(`${caseName} did not fail with ${code}: ${JSON.stringify(report.findings, null, 2)}`);
  }
}

function expectPass(caseName, report) {
  if (report.status !== "pass") throw new Error(`${caseName} should pass: ${JSON.stringify(report.findings, null, 2)}`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "generated-final-completeness-"));
const results = [];

try {
  const basePlan = writeFile(tempDir, "yeeflow-app-plan.md", plan());

  let output = run(basePlan, writeFile(tempDir, "forms-empty.json", decoded({ forms: false })));
  expectFail("approval form planned but Forms empty", output.report, "GENERATED_FINAL_FORMS_EMPTY_WITH_PLANNED_APPROVAL_FORMS");
  results.push({ case: "fail: planned approval form with Forms empty", status: "pass" });

  output = run(basePlan, writeFile(tempDir, "dashboard-empty.json", decoded({ dashboardEmpty: true })));
  expectFail("dashboard planned but Content empty", output.report, "GENERATED_FINAL_DASHBOARD_SHELL_ONLY");
  results.push({ case: "fail: dashboard Content.children empty", status: "pass" });

  output = run(basePlan, writeFile(tempDir, "generic-nav.json", decoded({ genericNavigation: true })));
  expectFail("navigation groups planned but generic only", output.report, "GENERATED_FINAL_NAVIGATION_GENERIC_ONLY");
  results.push({ case: "fail: planned navigation groups missing", status: "pass" });

  const reportsPlan = writeFile(tempDir, "reports-plan.md", plan({ dataReports: true }));
  output = run(reportsPlan, writeFile(tempDir, "missing-reports.json", decoded({ reports: false, dataReports: false, partialDescription: "generated-final package complete" })));
  expectFail("planned FormNewReports missing", output.report, "GENERATED_FINAL_FORMNEWREPORTS_EMPTY_WITH_PLANNED_REPORTS");
  expectFail("planned DataReports missing", output.report, "GENERATED_FINAL_DATAREPORTS_EMPTY_WITH_PLANNED_REPORTS");
  results.push({ case: "fail: generated-final omits planned FormNewReports/DataReports", status: "pass" });

  output = run(reportsPlan, writeFile(tempDir, "complete.json", decoded({ dataReports: true })));
  expectPass("complete generated-final package", output.report);
  results.push({ case: "pass: generated-final includes planned forms, dashboards, navigation, reports, lists", status: "pass" });

  const deferredPlan = writeFile(tempDir, "deferred-plan.md", plan({ deferred: true }));
  output = run(deferredPlan, writeFile(tempDir, "deferred-report.json", decoded({ reports: false })));
  const findingCodes = codes(output.report);
  if (findingCodes.has("GENERATED_FINAL_FORMNEWREPORT_MISSING") || findingCodes.has("GENERATED_FINAL_FORMNEWREPORTS_EMPTY_WITH_PLANNED_REPORTS")) {
    throw new Error(`deferred form report should not fail report completeness: ${JSON.stringify(output.report.findings, null, 2)}`);
  }
  results.push({ case: "pass: explicitly deferred report omission is allowed", status: "pass" });

  console.log(JSON.stringify({ status: "pass", cases: results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

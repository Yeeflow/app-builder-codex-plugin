#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();

function run(file) {
  const result = spawnSync(process.execPath, ["scripts/validate-app-plan-resource-order.mjs", file, "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  let report;
  try {
    report = JSON.parse(result.stdout || "{}");
  } catch (error) {
    throw new Error(`Could not parse validator output: ${error.message}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  }
  return { result, report };
}

function writeFixture(dir, name, text) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, `${text.trim()}\n`);
  return file;
}

function expectFinding(report, code) {
  assert.equal(
    (report.findings || []).some((finding) => finding.code === code),
    true,
    `expected ${code}; findings: ${JSON.stringify(report.findings, null, 2)}`,
  );
}

function planWithDashboard(dashboardPlan) {
  return `
# Facility Maintenance Request Management - Yeeflow App Plan

## 1. Plan Status
- Functional Specification review gate passed: Yes
- App Plan review gate passed: Yes
- Business decision gates answered/user-default-approved-for-generation or no blockers: Yes
- No invented unsupported shapes: Yes

## 2. Requirement-to-Yeeflow Resource Mapping Summary
| Requirement Area | Business Requirement | Yeeflow Resource Type | Planned Resource Name | Required | Notes |
| --- | --- | --- | --- | --- | --- |
| Data management | Maintenance requests | Data list | Maintenance Requests | Yes | Select one exact Yeeflow resource type |
| Approval/review | Intake review | Approval form | Maintenance Intake Review | Yes | Review process |
| Approval output | Intake report | Form report | Maintenance Intake Report | Yes | Must be based on a specific Approval form |
| List browsing | Active requests | Data List view | Active Requests | Yes | View records |
| Dashboard/workbench | Facility operations dashboard | Dashboard page | Facility Operations Dashboard | Yes | Dashboard planning |
| Automation | Assignment notifications | Data-list workflow / Schedule workflow / Form action | Assignment Notice | Yes | Notification |
| AI | No AI needed | AI Agent / Copilot / AI Assistant node | Not applicable | No | No AI |

Rules:
- Every core business requirement must map to a Yeeflow resource, a supported configuration, or an explicitly deferred item.
- Form report is a standalone Yeeflow resource type created from a specific Approval form. Do not merge Form report planning with Dashboard page planning or Data List view planning.
- Do not invent unsupported controls, Dynamic controls, field types, workflow node types, variable types, action shapes, property paths, bindings, or configuration shapes.
- Unknown capability labels: export-learning-required, runtime-proof-required, deferred.

## 3. Resource Generation Order
1. Data lists and Document libraries
2. Approval forms
3. Form reports
4. Schedule workflows
5. AI Agents
6. Copilots
7. Custom Data List forms
8. Data List workflows
9. Notifications
10. Data List views
11. Dashboard pages
12. Application navigation
13. Target users, roles, groups, and permissions

## 4. Data Lists and Document Libraries Plan
### 4.1 Maintenance Requests
#### Fields
| Field Order | Display Name | Internal ID / Field Key | Exact Yeeflow Field Type | Exact Yeeflow Control Type | Placeholder |
| --- | --- | --- | --- | --- | --- |
| 1 | Request Title | Title | Title | input control | Enter request title |

## 5. Approval Forms Plan
### 5.1 Maintenance Intake Review
#### Submission Form Fields
| Field | Placeholder |
| --- | --- |
| Request Title | Enter request title |
#### Task Form Fields
| Field | Placeholder |
| --- | --- |
| Review Decision | Select decision |
#### Sub List List Actions
No custom Sub List actions required.

## 6. Form Reports Plan
Form Report is an independent Yeeflow resource based on their related Approval forms.
| Form Report Name | Related Approval Form | Purpose |
| --- | --- | --- |
| Maintenance Intake Report | Maintenance Intake Review | Print review outcome |

## 7. Schedule Workflows Plan
No schedule workflows required; not applicable.

## 8. AI Agents Plan
No AI Agent required; not applicable.

## 9. Copilots Plan
No Copilot required; not applicable.

## 10. Custom Data List Forms Plan
Placeholder planning included for request detail form.

## 11. Data List Workflows Plan
Assignment notification workflow with trigger, action, and proof boundary.

## 12. Notifications Plan
Assignment and overdue notifications are planned.

## 13. Data List Views Plan
Active Requests view with Title, Status, Priority, Due Date display fields.

## 14. Dashboard Pages Plan
${dashboardPlan}

## 15. Application Navigation Plan
| Navigation Order | Group | Item | Yeeflow Resource Type | Target Resource | Visible | Icon | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Operations | Facility Operations Dashboard | Dashboard | Facility Operations Dashboard | Yes | dashboard | Main dashboard |

## 16. Target Users, Roles, Groups, and Permissions
| Role | Resource/Page/Form | View | Create | Edit | Approve |
| --- | --- | --- | --- | --- | --- |
| Coordinator | Dashboard | Yes | No | No | Yes |

## 17. Plugin Capability and Standards Compliance
All App Plan resource types, field types, variable types, controls, Dynamic controls, workflow nodes, form actions, Collection/Kanban actions, Sub List actions, property paths, bindings, and configuration shapes come from active plugin-known skills, standards, validators, template library, control/property knowledge base, extension registry, or export-proven references.

## 18. Generation Contract and Hard Gates
- Functional Specification review gate passed: Yes
- App Plan review gate passed: Yes
- Business decision gates answered/user-default-approved-for-generation or no blockers: Yes
- No invented unsupported shapes: Yes

## 19. Validation Plan
Run planning validators and local package validators.

## 20. Proof Boundary
Planning readiness only; runtime proof is separate.

## 21. Assumptions
Facility coordinator owns dashboard review.

## 22. Deferred or Runtime-Proof Items
| Item | Category | Reason | Fallback | Proof Impact |
| --- | --- | --- | --- | --- |
| Notification delivery | runtime-proof-required | Delivery requires tenant proof | Manual follow-up | Runtime proof later |

## 23. Recommended Next Prompt
Generate the app from this approved plan after gates pass.
`;
}

const validDashboard = `
### 14.1 Facility Operations Dashboard
- Page name: Facility Operations Dashboard
- Business purpose: Monitor request workload, SLA risk, and technician activity.
- Source Functional Specification dashboard requirement reference: FS-13 Facility Operations Dashboard.
- Source data lists/business objects: Maintenance Requests, Work Assignments, Locations.
- Navigation placement: Operations group.
- Page Function Plan reference if applicable: To be created after App Plan approval.
- Depends on: Maintenance Requests and Work Assignments.
- Temp variables required: Metrics for open, overdue, completion rate.
- Page/form actions required: open detail, add data list item.
- Runtime proof required: Summary/KPI and action execution proof are separate.

Dashboard page identity:

| Dashboard Page Name | Business Purpose | Functional Spec Dashboard Requirement Reference | Source Data Lists/Business Objects | Navigation Placement | Page Function Plan Reference |
| --- | --- | --- | --- | --- | --- |
| Facility Operations Dashboard | Monitor request workload, SLA risk, and technician activity. | FS-13 Facility Operations Dashboard | Maintenance Requests, Work Assignments, Locations | Operations group | To be created after App Plan approval |

#### Dashboard Sections
| Section Order | Section Name | Business Purpose | Source Data List or Business Object | Required Fields or Metrics | Selected Yeeflow Control Type Category | Why This Control Type Is Appropriate | User Actions Needed | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | KPI Summary | Show workload and SLA risk | Maintenance Requests | open count, overdue count, completion rate | Summary / KPI card | Summary/KPI is appropriate for aggregate metrics | review trend | validator-backed planning only |
| 2 | Filter Bar | Narrow all operational regions | Maintenance Requests | location, priority, date range | Data Filter | Data Filter is appropriate for scoped dashboard filtering | change filter scope | runtime-proof-required for final binding |
| 3 | Triage Queue | Show active work queue | Maintenance Requests | title, location, priority, status, due date | Collection | Collection is appropriate for portfolio/work queue cards | open detail, assign, add request | runtime-proof-required for action execution |
| 4 | Dense Export Queue | Show export-ready records | Maintenance Requests | title, status, due date, owner | Data table | Data table is appropriate for dense tabular records | open detail | validator-backed planning only |
| 5 | Header | Identify dashboard and context | Dashboard page | title and helper text | Text / Heading | Text/Heading is appropriate for static context | none | validator-backed planning only |
| 6 | Add Request | Start a new request | Maintenance Request | create intent | Button / action button | Button/action button is appropriate for command action | add data list item | runtime-proof-required |

#### Dashboard Filters
| Filter Name | Source Data List | Filter Field | Applies-to Dashboard Sections | Selected Yeeflow Filter/Control Type If Known | Default Business Scope | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- |
| Location | Maintenance Requests | location | KPI Summary, Triage Queue, Dense Export Queue | Data Filter | all active locations | runtime-proof-required |
| Priority | Maintenance Requests | priority | KPI Summary, Triage Queue | Data Filter | High and Critical | runtime-proof-required |

#### Summary Metrics
| Metric Name | Source Data List | Source Field(s) | Calculation Logic | Selected Yeeflow Control Type Category | Display Format Intent | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- |
| Open Requests | Maintenance Requests | status | Count requests where status is not final | Summary / KPI card | count | runtime-proof-required |
| Completion Rate | Maintenance Requests | status, completed at, submitted at | Completed divided by submitted for selected period | Summary / KPI card | percentage | runtime-proof-required |

#### Dashboard Actions
| Action Name | Business Purpose | Source/Target Business Object | Expected User Outcome | Supported Yeeflow Action Category When Known | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- |
| Add Request | Create a new maintenance request | Maintenance Request | User opens the new request form | add data list item | runtime-proof-required |
| Open Detail | Inspect a request | Maintenance Request | User opens request details | open detail | runtime-proof-required |

#### Record Display Control Selection
| Section | Data Source | Display Need | Selected Record Display Control | Selection Reason | Detail/Open Behavior | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- |
| Triage Queue | Maintenance Requests | portfolio/work queue region | Collection | Prefer Collection for portfolio/card/grid-table style display | open detail | runtime-proof-required |
| Dense Export Queue | Maintenance Requests | dense tabular records | Data table | Use Data table for dense tabular records | open detail | validator-backed |

#### Item Template Dynamic Controls
| Host Control | Source List | Business Label | Source Field | Expected Dynamic Display Control Category | Display Purpose | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- |
| Triage Queue Collection | Maintenance Requests | Request title | title | dynamic field | show request title | validator-backed |
| Triage Queue Collection | Maintenance Requests | Owner | assigned technician | dynamic user | show assignee | runtime-proof-required |

#### Collection and Kanban Item Actions
| Host Control | Action Name | Business Purpose | Source/Target Business Object | Expected User Outcome | Supported Yeeflow Action Category When Known | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- |
| Triage Queue Collection | Open Detail | Review request | Maintenance Request | User opens request detail | open detail | runtime-proof-required |
`;

const noControlDashboard = `
### 14.1 Facility Operations Dashboard
- Page name: Facility Operations Dashboard
- Business purpose: Show dashboard.
- Source Functional Specification dashboard requirement reference: FS-13.
- Source data lists/business objects: Maintenance Requests.
- Navigation placement: Operations group.
- Page Function Plan reference if applicable: none.
Dashboard page for maintenance work.
`;

const inventedControlDashboard = validDashboard.replace("Summary / KPI card", "Mega Widget");
const lowLevelDashboard = `${validDashboard}
- Implementation leakage: ListID: LIST-REQUESTS, PageID: 2054181564731764736, actionTypeCode: 5, attrs.data.list = "LIST-REQUESTS".
`;
const collectionPortfolioDashboard = validDashboard.replace("portfolio/work queue region", "portfolio/work queue region for coordinator cards");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "app-plan-dashboard-pages-plan-gates-"));
const results = [];

try {
  let file = writeFixture(tempDir, "valid-dashboard-plan.md", planWithDashboard(validDashboard));
  let output = run(file);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "dashboard sections map to Summary, Data Filter, Collection/Data table, Text/Heading, Button/action categories", status: "pass" });
  results.push({ case: "non-Dashboard App Plan sections remain backward compatible with existing compact formats", status: "pass" });

  file = writeFixture(tempDir, "no-control-dashboard-plan.md", planWithDashboard(noControlDashboard));
  output = run(file);
  assert.equal(output.report.status, "fail");
  expectFinding(output.report, "APP_PLAN_DASHBOARD_CONTROL_TYPE_PLANNING_MISSING");
  results.push({ case: "dashboard page with no control-type planning fails", status: "pass" });

  file = writeFixture(tempDir, "invented-control-dashboard-plan.md", planWithDashboard(inventedControlDashboard));
  output = run(file);
  assert.equal(output.report.status, "fail");
  expectFinding(output.report, "APP_PLAN_DASHBOARD_UNSUPPORTED_CONTROL_TYPE");
  results.push({ case: "invented dashboard control type fails without proof label", status: "pass" });

  file = writeFixture(tempDir, "low-level-dashboard-plan.md", planWithDashboard(lowLevelDashboard));
  output = run(file);
  assert.equal(output.report.status, "fail");
  expectFinding(output.report, "APP_PLAN_DASHBOARD_LOW_LEVEL_ID_LEAK");
  expectFinding(output.report, "APP_PLAN_DASHBOARD_ACTIONTYPECODE_LEAK");
  expectFinding(output.report, "APP_PLAN_DASHBOARD_JSON_PROPERTY_PATH_LEAK");
  results.push({ case: "dashboard plan containing IDs actionTypeCode and property paths fails", status: "pass" });

  file = writeFixture(tempDir, "collection-portfolio-dashboard-plan.md", planWithDashboard(collectionPortfolioDashboard));
  output = run(file);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "Collection chosen for portfolio/work queue region passes without runtime properties", status: "pass" });

  console.log(JSON.stringify({ status: "pass", results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

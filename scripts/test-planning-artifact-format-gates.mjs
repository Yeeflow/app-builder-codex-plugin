#!/usr/bin/env node

import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();

function run(dir) {
  const result = spawnSync(process.execPath, ["scripts/validate-planning-artifact-formats.mjs", "--dir", dir, "--json"], {
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

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function write(file, text) {
  fs.writeFileSync(file, `${text.trim()}\n`);
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function expectFinding(report, code) {
  assert.equal(
    (report.findings || []).some((finding) => finding.code === code),
    true,
    `expected ${code}; findings: ${JSON.stringify(report.findings, null, 2)}`,
  );
}

function richFunctionalSpec() {
  return `
# Facility Maintenance Request Management - Functional Specification

## 1. Specification Status
- Application name: Facility Maintenance Request Management
- Current status: ready for App Plan

## 2. Source Input Summary
- Direct user request: manage facility maintenance requests from intake to closure.

## 3. Requirement Interpretation Method
- Detailed business requirements are organized as Markdown first; JSON traces are projections only.

## 4. Business Context
- Business problem: facility issues lack clear ownership, SLA visibility, and closure evidence.
- Target users: requesters, coordinators, technicians, and operations managers.
- Operational scope: request intake, triage, assignment, fulfillment, closure, exception handling, reporting, and audit history.
- Expected outcome: every request has owner, priority, due date, status, evidence, and closure path.
- Business goal: reduce overdue work and improve maintenance transparency.
- What the application manages: maintenance requests, work assignments, assets, locations, completion evidence.
- Primary business value: faster resolution and reliable operations reporting.
- Success criteria: open, overdue, unassigned, and completed work are visible.
- Out of scope: inventory purchasing.

## 5. User Roles and Responsibilities
| Role | What They Need To Do | Records They Can See | Actions They Can Perform | Decisions They Own | Dashboards/Pages They Need | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Coordinator | triage and assign work | all requests | review, assign, reject, rework, close | priority, assignment, escalation | Facility Operations Dashboard | owns process |
| Technician | complete assigned work | assigned requests | update status, upload evidence | completion readiness | Technician Workbench | mobile updates |

## 6. Business Objects and Data Requirements
| Business Object | Business Purpose | Required Fields | Field Meaning | Field Type Expectation | Lookup/Reference Relationships | Lifecycle/Status Fields | Audit Fields | Reporting/Dashboard Fields |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Maintenance Request | service demand | title, location, priority, status, assignee, due date | describes issue and ownership | text, choice, date, user, attachment | location, asset, technician | status, priority, overdue flag | created, assigned, completed, closed | status, priority, due date, assignee |

## 7. Business Relationships and Dependency Rules
| Parent Object | Child/Related Object | Relationship Type | Business Rule | Required for Creation? | Notes |
| --- | --- | --- | --- | --- | --- |
| Location | Maintenance Request | lookup/reference | request needs a location for triage and filters | Yes | dashboard filtering |

## 8. Core Business Process
1. Requester submits request.
2. Coordinator triages and assigns technician.
3. Technician completes work.
4. Coordinator or requester confirms closure.
- Start trigger: issue reported.
- Submission/intake: location, priority, category, description, attachment.
- Review/approval: coordinator accepts, rejects, or requests rework.
- Assignment/fulfillment: technician assigned by category and workload.
- Status tracking: Submitted, In Review, Assigned, In Progress, Waiting, Completed, Closed, Rework, Rejected.
- Completion/closure: completion notes and evidence required.
- Exception handling: missing data, no access, parts unavailable, duplicate, rework.
- Audit/history needs: actor, timestamp, previous status, reason.

## 9. Business Rules and Status Lifecycles
| Lifecycle Name | Applies To | Status Values | Initial Status | Final Statuses | Transition Rules |
| --- | --- | --- | --- | --- | --- |
| Request lifecycle | Maintenance Request | Submitted, In Review, Assigned, In Progress, Completed, Closed, Rework, Rejected | Submitted | Closed, Rejected | coordinator controls assignment and rejection |
| Rule Area | Business Rule | Applies To | Condition | Required Data/Fields | Responsible Role | Exception/Rework Behavior | Reporting Impact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SLA | high priority overdue after one business day | request | not final | priority, due date, status | coordinator | escalate | overdue KPI |

## 10. Approval and Review Requirements
| Approval/Review Process | Trigger | Submitter | Reviewers/Approvers | Decisions | Required Task Work | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Intake review | request submitted | requester | coordinator | accept, reject, rework, assign | validate fields and attachments | completion requires evidence |

## 11. Data Entry and Form Requirements
| Form Purpose | Used By | When Used | Information Captured | Read-only Context | Validation Needs | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| request intake | requester | new issue | location, priority, category, description, attachments | requester and date | required location and category | mobile |

## 12. Workflow and Notification Requirements
| Workflow/Notification | Trigger Condition | Business Condition | Actor/Recipient | Action/Result | Timing/SLA | Notification Content Intent | Data Read | Data Updated | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assignment notice | assignee changes | request accepted | technician | notify assignment | immediate | assigned work and due date | assignee, due date | assigned at | audit retained |

## 13. Dashboard Page Requirements
| Dashboard Name | Primary Users | Business Purpose | Business Questions It Must Answer | Source Business Objects/Data Lists | Mobile Support Requirement | Business Exceptions/Alerts To Highlight |
| --- | --- | --- | --- | --- | --- | --- |
| Facility Operations Dashboard | Coordinator | monitor workload and SLA risk | How many open, overdue, high-priority, and unassigned requests exist? | Maintenance Request, Work Assignment | mobile summary readable | overdue critical and unassigned high-priority |
| Dashboard | Metric | Source Object/List | Source Fields | Calculation Logic | Default Scope | Alert/Threshold Logic |
| --- | --- | --- | --- | --- | --- | --- |
| Facility Operations Dashboard | Open Requests | Maintenance Request | status | count non-final requests | current month | alert if rising |
| Dashboard | Data Region | Business Purpose | Source Object/List | Display Fields | User Actions Needed | Sorting/Grouping Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| Facility Operations Dashboard | Triage Queue | review incoming work | Maintenance Request | title, location, priority, status, due date | open detail and assign | sort by priority then due date |
| Dashboard | Filter | Source Object/List | Source Field | Default Scope | Applies To Regions | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Facility Operations Dashboard | Priority | Maintenance Request | priority | high and critical | KPI Summary, Triage Queue | SLA scope |

## 14. Reporting and Audit Requirements
| Report/Page/KPI | Business Question | Users | Data Needed | Filters | Actions | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Monthly report | What work was completed and overdue? | Operations | status, priority, due date, completed at | date, location | export | auditable history, reports, dashboards, compliance and operational evidence |

## 15. Document and Attachment Requirements
| Document/Attachment | Used By | Required When | Storage Need | Preview/Print Need | Notes |
| --- | --- | --- | --- | --- | --- |
| photo | requester | damage | request attachment | preview | required for damage |

## 16. AI, Copilot, and Intelligent Assistance Requirements
No AI Agent or Copilot requirement identified.

## 17. Integration Requirements
No integration required.

## 18. Permissions and Access Requirements
| Role | Resource/Process | View | Create | Edit | Delete/Archive | Approve | Admin | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Coordinator | requests | Yes | Yes | Yes | archive with reason | Yes | Yes | full operations access |

## 19. UI and Experience Requirements
- Main pages: dashboard, triage queue, technician workbench.
- Mobile/tablet expectations: requester and technician flows.

## 20. Business Clarification Gates
| Decision Key | Question | Options | Recommended Default | Why It Matters | Required Before App Plan? | Approval Status |
| --- | --- | --- | --- | --- | --- | --- |
| slaPolicy | SLA thresholds? | standard/custom | critical same day high one day | affects overdue metrics | Yes | default-applied-for-planning |

## 21. Assumptions
- Dashboard defaults to current month.

## 22. Risks, Constraints, and Unknowns
| Area | Risk/Unknown | Impact | Proposed Handling | Requires User Confirmation |
| --- | --- | --- | --- | --- |
| SLA | exact threshold unknown | metrics may change | default for planning | Yes |

## 23. Functional Specification Completeness Review
| Review Item | Status | Notes |
| --- | --- | --- |
| Business context is clear | pass | rich Markdown source |
| Dashboard page content requirements include metrics, calculations, data regions, display fields, filters, sorting/grouping, actions, mobile needs, and alerts | pass | included |

## 24. Readiness for App Plan
- Ready for App Plan: Yes
`;
}

function richAppPlan() {
  return `
# Facility Maintenance Request Management - Yeeflow App Plan

## 1. Plan Status
- Functional specification path: functional-specification.md

## 2. Requirement-to-Yeeflow Resource Mapping Summary
| Requirement Area | Business Requirement | Yeeflow Resource Type | Planned Resource Name | Required | Notes |
| --- | --- | --- | --- | --- | --- |
| Data management | maintenance requests | Data list | Maintenance Requests | Yes | primary list |

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
Placeholder planning for Maintenance Requests with fields title, priority, status, due date.

## 5. Approval Forms Plan
Submission Form Fields include Placeholder values. Task Form Fields include Placeholder values. No custom Sub List actions required.

## 6. Form Reports Plan
Form Report is an independent Yeeflow resource based on their related Approval forms.

## 7. Schedule Workflows Plan
Not applicable.

## 8. AI Agents Plan
No AI Agent required.

## 9. Copilots Plan
No Copilot required.

## 10. Custom Data List Forms Plan
Placeholder planning included.

## 11. Data List Workflows Plan
Assignment workflow planned.

## 12. Notifications Plan
Assignment notification planned.

## 13. Data List Views Plan
Active Requests view planned.

## 14. Dashboard Pages Plan
### 14.1 Facility Operations Dashboard
- Page name: Facility Operations Dashboard
- Business purpose: Monitor workload and SLA risk.
- Source Functional Specification dashboard requirement reference: FS-13 Facility Operations Dashboard.
- Source data lists/business objects: Maintenance Requests, Work Assignments.
- Navigation placement: Operations.
- Page Function Plan reference if applicable: page-function-plan.md after App Plan approval.

#### Dashboard Sections
| Section Order | Section Name | Business Purpose | Source Data List or Business Object | Required Fields or Metrics | Selected Yeeflow Control Type Category | Why This Control Type Is Appropriate | User Actions Needed | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | KPI Summary | show aggregate workload | Maintenance Requests | open count, overdue count | Summary / KPI card | appropriate for aggregate metrics | review | runtime-proof-required |
| 2 | Filters | narrow dashboard regions | Maintenance Requests | priority, location | Data Filter | appropriate for dashboard filtering | filter regions | runtime-proof-required |
| 3 | Triage Queue | review portfolio/work queue | Maintenance Requests | title, priority, status, due date | Collection | appropriate for portfolio/card work queue display | open detail | runtime-proof-required |
| 4 | Header | explain dashboard context | Dashboard page | title, helper text | Text / Heading | appropriate for static page context | none | validator-backed |
| 5 | Add Request | create new request | Maintenance Request | create action | Button / action button | appropriate for command action | add data list item | runtime-proof-required |

#### Dashboard Filters
| Filter Name | Source Data List | Filter Field | Applies-to Dashboard Sections | Selected Yeeflow Filter/Control Type If Known | Default Business Scope | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- |
| Priority | Maintenance Requests | priority | KPI Summary, Triage Queue | Data Filter | high and critical | runtime-proof-required |

#### Summary Metrics
| Metric Name | Source Data List | Source Field(s) | Calculation Logic | Selected Yeeflow Control Type Category | Display Format Intent | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- |
| Open Requests | Maintenance Requests | status | count non-final requests | Summary / KPI card | count | runtime-proof-required |

#### Dashboard Actions
| Action Name | Business Purpose | Source/Target Business Object | Expected User Outcome | Supported Yeeflow Action Category When Known | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- |
| Open Detail | inspect request | Maintenance Request | user opens request detail | open detail | runtime-proof-required |

#### Record Display Control Selection
| Section | Data Source | Display Need | Selected Record Display Control | Selection Reason | Detail/Open Behavior | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- |
| Triage Queue | Maintenance Requests | portfolio/work queue cards | Collection | Prefer Collection for portfolio/card/grid-table style display | open detail | runtime-proof-required |

#### Item Template Dynamic Controls
| Host Control | Source List | Business Label | Source Field | Expected Dynamic Display Control Category | Display Purpose | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- |
| Triage Queue Collection | Maintenance Requests | Request title | title | dynamic field | show request title | validator-backed |

#### Collection and Kanban Item Actions
No Collection/Kanban item actions required.

## 15. Application Navigation Plan
Dashboard navigation planned.

## 16. Target Users, Roles, Groups, and Permissions
Coordinator role can view dashboard and manage requests.

## 17. Plugin Capability and Standards Compliance
All App Plan resource types, field types, variable types, controls, Dynamic controls, workflow nodes, form actions, Collection/Kanban actions, Sub List actions, property paths, bindings, and configuration shapes are plugin-supported or proof/deferred.

## 18. Generation Contract and Hard Gates
Functional Specification review gate passed. App Plan review gate passed.

## 19. Validation Plan
Run validators.

## 20. Proof Boundary
Planning readiness only.

## 21. Assumptions
Dashboard default month.

## 22. Deferred or Runtime-Proof Items
Runtime-proof-required items include Summary/KPI and action execution with reason, fallback, proof impact.

## 23. Recommended Next Prompt
Generate after approval.
`;
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "planning-artifact-format-gates-"));
const results = [];

try {
  const validDir = path.join(tempRoot, "valid");
  fs.mkdirSync(validDir);
  const spec = richFunctionalSpec();
  const plan = richAppPlan();
  write(path.join(validDir, "functional-specification.md"), spec);
  write(path.join(validDir, "yeeflow-app-plan.md"), plan);
  writeJson(path.join(validDir, "functional-specification.trace.json"), { sourceMarkdown: "functional-specification.md", sourceSha256: sha256(`${spec.trim()}\n`), sections: ["Business Context", "Dashboard Page Requirements"] });
  writeJson(path.join(validDir, "app-plan.trace.json"), { sourceMarkdown: "yeeflow-app-plan.md", sourceSha256: sha256(`${plan.trim()}\n`), sections: ["Resource Generation Order", "Dashboard Pages Plan"] });
  let output = run(validDir);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "Markdown primary artifacts with consistent companion JSON pass", status: "pass" });

  const jsonOnlySpecDir = path.join(tempRoot, "json-only-spec");
  fs.mkdirSync(jsonOnlySpecDir);
  writeJson(path.join(jsonOnlySpecDir, "functional-specification.trace.json"), { sourceMarkdown: "functional-specification.md" });
  write(path.join(jsonOnlySpecDir, "yeeflow-app-plan.md"), plan);
  output = run(jsonOnlySpecDir);
  assert.equal(output.report.status, "fail");
  expectFinding(output.report, "PLANNING_ARTIFACT_FUNCTIONAL_SPEC_JSON_ONLY");
  results.push({ case: "Functional Specification JSON-only artifact fails", status: "pass" });

  const jsonOnlyPlanDir = path.join(tempRoot, "json-only-plan");
  fs.mkdirSync(jsonOnlyPlanDir);
  write(path.join(jsonOnlyPlanDir, "functional-specification.md"), spec);
  writeJson(path.join(jsonOnlyPlanDir, "app-plan.trace.json"), { sourceMarkdown: "yeeflow-app-plan.md" });
  output = run(jsonOnlyPlanDir);
  assert.equal(output.report.status, "fail");
  expectFinding(output.report, "PLANNING_ARTIFACT_APP_PLAN_JSON_ONLY");
  results.push({ case: "Yeeflow App Plan JSON-only artifact fails", status: "pass" });

  const skeletalDir = path.join(tempRoot, "skeletal");
  fs.mkdirSync(skeletalDir);
  write(path.join(skeletalDir, "functional-specification.md"), "# Facility - Functional Specification\n\nSee functional-specification.trace.json");
  write(path.join(skeletalDir, "yeeflow-app-plan.md"), "# Facility - Yeeflow App Plan\n\nSee app-plan.trace.json");
  output = run(skeletalDir);
  assert.equal(output.report.status, "fail");
  expectFinding(output.report, "PLANNING_ARTIFACT_FUNCTIONAL_SPEC_MARKDOWN_SKELETAL");
  expectFinding(output.report, "PLANNING_ARTIFACT_APP_PLAN_MARKDOWN_SKELETAL");
  results.push({ case: "skeletal Markdown that only links JSON fails", status: "pass" });

  const mismatchDir = path.join(tempRoot, "mismatch");
  fs.mkdirSync(mismatchDir);
  write(path.join(mismatchDir, "functional-specification.md"), spec);
  write(path.join(mismatchDir, "yeeflow-app-plan.md"), plan);
  writeJson(path.join(mismatchDir, "functional-specification.trace.json"), { sourceMarkdown: "other.md", sourceSha256: "bad" });
  output = run(mismatchDir);
  assert.equal(output.report.status, "fail");
  expectFinding(output.report, "PLANNING_ARTIFACT_COMPANION_JSON_SOURCE_MISMATCH");
  expectFinding(output.report, "PLANNING_ARTIFACT_COMPANION_JSON_HASH_MISMATCH");
  results.push({ case: "companion JSON source mismatch fails", status: "pass" });

  console.log(JSON.stringify({ status: "pass", results }, null, 2));
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

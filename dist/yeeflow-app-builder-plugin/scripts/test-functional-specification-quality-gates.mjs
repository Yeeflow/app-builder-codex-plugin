#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();

function run(file) {
  const result = spawnSync(process.execPath, ["scripts/validate-functional-specification.mjs", file, "--json"], {
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

function richFacilitySpec(extraDashboardText = "") {
  return `
# Facility Maintenance Request Management - Functional Specification

## 1. Specification Status
- Application name: Facility Maintenance Request Management
- Requirement detail level: detailed
- Current status: ready for review

## 2. Source Input Summary
- Direct user request: Build a maintenance request process for employees, facility coordinators, technicians, and managers.

## 3. Requirement Interpretation Method
- The request is detailed and reorganized into a business requirement document before planning.

## 4. Business Context
- Business problem: Facility issues are reported inconsistently and overdue repairs are not visible.
- Target users: Employees, facility coordinators, technicians, department managers, and operations leaders.
- Operational scope: intake, triage, assignment, fulfillment, closure, exception handling, reporting, and audit evidence for workplace maintenance.
- Expected outcome: requests are prioritized, assigned, completed, and reviewed with clear service accountability.
- Business goal: reduce overdue work and improve facility service transparency.
- What the application manages: maintenance requests, assets, work assignments, completion evidence, and service history.
- Primary business value: faster issue resolution and reliable operational reporting.
- Success criteria: every request has an owner, status, priority, due date, location, and closure outcome.
- Out of scope: inventory purchasing and vendor contract management.

## 5. User Roles and Responsibilities
| Role | What They Need To Do | Records They Can See | Actions They Can Perform | Decisions They Own | Dashboards/Pages They Need | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Requester | Submit workplace repair needs and add completion feedback | Own submitted requests | Create, comment, cancel before triage, confirm closure | Whether closure satisfies the request | My Requests dashboard and request detail page | Needs mobile intake |
| Facility Coordinator | Triage incoming requests and assign technicians | All open facility requests | Review, prioritize, assign, rework, escalate, close administratively | Priority, assignment, escalation, and rejection decisions | Operations Dashboard and Triage Queue page | Owns service flow |
| Technician | Fulfill assigned work | Assigned requests and asset context | Accept, update progress, upload evidence, mark complete | Completion readiness and parts-needed exception | Technician Workbench page | Needs due-date visibility |

## 6. Business Objects and Data Requirements
| Business Object | Business Purpose | Required Fields | Field Meaning | Field Type Expectation | Lookup/Reference Relationships | Lifecycle/Status Fields | Audit Fields | Reporting/Dashboard Fields |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Maintenance Request | Captures the service demand from intake through closure | title, location, category, priority, requester, target date, status, assigned technician, completion notes, attachments | Describes issue, ownership, urgency, and closure evidence | Text, choice, date, user, attachment, lookup at business level | References Location, Asset, Technician | status, priority, due date, overdue flag | created by, submitted at, triaged by, assigned at, completed at, closed at | status, priority, category, technician, due date, overdue flag |
| Asset | Provides equipment or room context | asset name, location, owner team, criticality | Identifies the affected operational asset | Text, lookup, choice | Referenced by Maintenance Request | active/inactive | created and updated history | criticality, location, open request count |

## 7. Business Relationships and Dependency Rules
| Parent Object | Child/Related Object | Relationship Type | Business Rule | Required for Creation? | Notes |
| --- | --- | --- | --- | --- | --- |
| Location | Maintenance Request | lookup/reference | A request must identify the workplace location before triage | Yes | Relationship supports dashboard filtering |
| Maintenance Request | Work Assignment | one-to-many history | Reassignment keeps prior owner and reason for audit | No | Relationship supports escalation analysis |

## 8. Core Business Process
1. Requester submits a maintenance request with location, category, urgency, and supporting evidence.
2. Facility Coordinator reviews intake, validates required data, sets priority, and assigns a technician.
3. Technician accepts work, updates status, records parts or access exceptions, and submits completion evidence.
4. Requester or coordinator verifies completion and closes the request or sends it back for rework.

- Start trigger: employee reports a facility issue or coordinator logs a phone/email request.
- Submission/intake: requester captures location, asset, category, description, priority signal, target date, and attachments.
- Review/approval: coordinator accepts, rejects, or requests more information before assignment.
- Assignment/fulfillment: coordinator assigns technician based on category, location, workload, and SLA risk.
- Status tracking: statuses move from Draft to Submitted to In Review to Assigned to In Progress to Completed to Closed, with Rework and Cancelled exceptions.
- Completion/closure: closure requires completion notes, evidence, completion date, and requester/coordinator confirmation.
- Exception handling: missing information, safety-critical issue, parts unavailable, duplicate request, no-access visit, and rejected completion require reason and next action.
- Audit/history needs: every status change, reassignment, priority change, rejection, rework, and closure action must retain actor, timestamp, reason, and previous value.
- Actor: requester, coordinator, technician, manager.
- Data created or updated: request details, assignment record, status history, completion evidence.
- Decision points: accept/reject intake, priority, assignment, escalation, closure acceptance, rework.
- Status changes: lifecycle values and final states are business-critical.
- Notifications or handoffs: submitter, assignee, coordinator, and manager receive condition-based updates.
- Completion outcome: issue resolved, cancelled, duplicate, rejected, or deferred with reason.

## 9. Business Rules and Status Lifecycles
| Lifecycle Name | Applies To | Status Values | Initial Status | Final Statuses | Transition Rules |
| --- | --- | --- | --- | --- | --- |
| Request status lifecycle | Maintenance Request | Draft, Submitted, In Review, Assigned, In Progress, Waiting for Parts, Completed, Closed, Rework, Rejected, Cancelled | Draft | Closed, Rejected, Cancelled | Only coordinators can reject; technicians can move assigned work to in progress or completed; requester can cancel before triage |

| Rule Area | Business Rule | Applies To | Condition | Required Data/Fields | Responsible Role | Exception/Rework Behavior | Reporting Impact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| status lifecycle | Submitted requests must be triaged before assignment | Maintenance Request | status is Submitted | status, submitted at, coordinator | Missing data returns to requester | Triage aging metric |
| approval | Safety-critical requests require manager notification before closure | Maintenance Request | priority is Critical | priority, manager, safety flag | Escalate if not acknowledged | Critical open count |
| assignment | Technician assignment must consider category and location coverage | Work Assignment | request accepted | category, location, technician | Reassign with reason | Workload by technician |
| SLA | High priority requests are overdue after one business day | Maintenance Request | priority High and not final | priority, due date, status | Escalate to manager | Overdue KPI |
| validation | Closure requires completion notes and evidence | Maintenance Request | status Completed or Closed | completion notes, attachment, completed at | Rework if incomplete | Closure quality metric |
| notification | Assignment sends task intent to technician and update intent to requester | Maintenance Request | assignee changes | assignee, requester, request title | Retry or coordinator follow-up | Notification audit |
| escalation | Overdue critical requests notify operations leader daily | Maintenance Request | overdue flag and priority Critical | priority, due date, status | Escalate until closed | Escalation count |
| completion | Closed requests cannot be edited except by coordinator with reason | Maintenance Request | status Closed | close reason, actor | Reopen creates history | Closure audit |
| cancellation | Requester cancellation requires reason after submission | Maintenance Request | cancellation requested | reason, actor, status | Coordinator review if assigned | Cancelled reason report |
| permission | Requesters see own records, coordinators see all, technicians see assigned | Maintenance Request | page or dashboard access | role, requester, assignee | Unauthorized access denied | Permission evidence |

## 10. Approval and Review Requirements
| Approval/Review Process | Trigger | Submitter | Reviewers/Approvers | Decisions | Required Task Work | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Maintenance intake review | Request is submitted | Requester | Facility Coordinator | accept, reject, request rework, assign | Review required data, priority, location, attachment evidence, and duplicate risk | Rejection/rework behavior sends reason to requester; completion requires notes and evidence; required attachments include photos for damage; print/report needs include request summary if requested by operations |

## 11. Data Entry and Form Requirements
| Form Purpose | Used By | When Used | Information Captured | Read-only Context | Validation Needs | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Request submission | Requester | New issue intake | location, asset, category, description, urgency, photos, target date | requester and submitted date | location, category, description required | Mobile-friendly |
| Work update | Technician | During fulfillment | progress notes, parts needed, completion evidence, completion date | request summary and assignment | completion notes and evidence required for completion | Supports rework |

## 12. Workflow and Notification Requirements
| Workflow/Notification | Trigger Condition | Business Condition | Actor/Recipient | Action/Result | Timing/SLA | Notification Content Intent | Data Read | Data Updated | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Intake acknowledgement | Request submitted | Required fields complete | Requester | Confirm request number and expected triage | Immediate | Tell requester the request is awaiting triage | requester, title, location | submitted timestamp | Notification audit retained |
| Assignment notice | Coordinator assigns technician | request accepted | Technician and requester | Notify assignment and due date | Immediate | Explain assigned technician and target response | assignee, due date, priority | assigned timestamp | Supports SLA |
| Overdue escalation | Due date passes and status not final | high or critical priority | Coordinator and manager | Escalate overdue work | Daily until closed | Highlight overdue request, priority, and next action | status, priority, due date | escalation history | Includes SLA |

## 13. Dashboard Page Requirements
| Dashboard Name | Primary Users | Business Purpose | Business Questions It Must Answer | Source Business Objects/Data Lists | Mobile Support Requirement | Business Exceptions/Alerts To Highlight |
| --- | --- | --- | --- | --- | --- | --- |
| Facility Operations Dashboard | Facility Coordinator, Operations Leader | Monitor operational workload and SLA risk | How many requests are open, overdue, critical, waiting for parts, unassigned, and completed this week? Which technicians are overloaded? | Maintenance Request, Work Assignment, Asset, Location | Summary metrics and triage queue must remain readable on mobile | overdue critical requests, unassigned high priority requests, waiting for parts over three days |

Required summary metrics:
| Dashboard | Metric | Source Object/List | Source Fields | Calculation Logic | Default Scope | Alert/Threshold Logic |
| --- | --- | --- | --- | --- | --- | --- |
| Facility Operations Dashboard | Open Requests | Maintenance Request | status | Count requests where status is not Closed, Rejected, or Cancelled | Current month and active locations | Alert when open count increases more than 20 percent week over week |
| Facility Operations Dashboard | Overdue High Priority | Maintenance Request | priority, due date, status | Count high or critical priority requests where due date is before today and status is not final | Active requests | Highlight when count is greater than zero |
| Facility Operations Dashboard | Completion Rate | Maintenance Request | completed at, submitted at, status | Completed requests divided by submitted requests for the selected period | Current month | Alert when below 85 percent |

Required data regions:
| Dashboard | Data Region | Business Purpose | Source Object/List | Display Fields | User Actions Needed | Sorting/Grouping Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| Facility Operations Dashboard | Triage Queue | Show requests needing coordinator review | Maintenance Request | request title, location, category, priority, submitted at, requester, status | open request, assign technician, reject with reason, request rework | sort by priority then submitted at; group by location |
| Facility Operations Dashboard | Technician Workload | Compare assigned work and overdue risk | Work Assignment | technician, open count, overdue count, critical count, oldest due date | open technician workload detail | group by technician and sort by overdue count |

Filter requirements:
| Dashboard | Filter | Source Object/List | Source Field | Default Scope | Applies To Regions | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Facility Operations Dashboard | Location | Maintenance Request | location | all active locations | summary metrics, Triage Queue, Technician Workload | Coordinator can narrow workload |
| Facility Operations Dashboard | Priority | Maintenance Request | priority | High and Critical visible by default for alert review | summary metrics, Triage Queue | Supports SLA risk review |
| Facility Operations Dashboard | Date Range | Maintenance Request | submitted at and completed at | current month | summary metrics and completion reporting | Supports trend reporting |
${extraDashboardText}

## 14. Reporting and Audit Requirements
| Report/Page/KPI | Business Question | Users | Data Needed | Filters | Actions | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Monthly maintenance report | What volume, SLA, and closure trends occurred? | Operations Leader | request status, priority, due date, completed at, technician | date, location, category | export summary | Reports and dashboards include auditable history, compliance evidence, operational evidence, status history, assignment history, and visible closure/rework reasons |

## 15. Document and Attachment Requirements
| Document/Attachment | Used By | Required When | Storage Need | Preview/Print Need | Notes |
| --- | --- | --- | --- | --- | --- |
| Damage photo | Requester and Technician | safety or physical damage requests | retained with request | preview needed | Required documents/rich data rules apply |

## 16. AI, Copilot, and Intelligent Assistance Requirements
| Capability | Purpose | Users | Inputs | Outputs | Human Review | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| No AI Agent or Copilot requirement identified | Not applicable | Not applicable | Not applicable | Not applicable | Not required | No AI is required |

## 17. Integration Requirements
| Integration | Purpose | Direction | Data Exchanged | Credential Sensitivity | Required Now? | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| No external integration identified | Not applicable | Not applicable | Not applicable | low | No | Post-import configuration not required |

## 18. Permissions and Access Requirements
| Role | Resource/Process | View | Create | Edit | Delete/Archive | Approve | Admin | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Requester | Own Maintenance Request | Yes | Yes | Limited | No | No | No | Permission rules restrict visibility to own records |
| Facility Coordinator | Maintenance Request | Yes | Yes | Yes | Archive with reason | Yes | Yes | Owns triage and assignment |
| Technician | Assigned Maintenance Request | Yes | No | Update assigned fields | No | No | No | Can complete assigned work |

## 19. UI and Experience Requirements
- Navigation style: role-oriented pages for My Requests, Operations Dashboard, Technician Workbench, and request history.
- Main pages: submission page, request detail, triage queue, technician workbench, Facility Operations Dashboard.
- Workbench or dashboard needs: operational dashboard for coordinator and technician workbench for daily execution.
- Form layout expectations: business sections for issue details, location, priority, assignment, evidence, and history.
- Mobile/tablet expectations: requester intake and technician updates work on mobile.
- Visual style requirements: clear priority and overdue alerts.
- Provided mockups/design references: none.
- Accessibility/readability concerns: status and due-date signals must be readable.

## 20. Business Clarification Gates
| Decision Key | Question | Options | Recommended Default | Why It Matters | Required Before App Plan? | Approval Status |
| --- | --- | --- | --- | --- | --- | --- |
| slaPolicy | Which SLA thresholds apply by priority? | same day critical / one day high / three days normal; custom thresholds | same day critical / one day high / three days normal | Changes overdue metrics, escalation, and dashboard alerts | Yes | default-applied-for-planning |
| closureAuthority | Who can close completed requests? | requester only; coordinator only; either requester or coordinator | either requester or coordinator | Changes completion rules and rework behavior | Yes | default-applied-for-planning |

## 21. Assumptions
- Business assumptions: Facility coordinator owns triage.
- Data assumptions: location and priority are mandatory.
- Role assumptions: technicians only see assigned work.
- Workflow assumptions: overdue escalation runs daily.
- Reporting assumptions: dashboard defaults to current month.
- UI assumptions: mobile support is required for intake and technician updates.
- Integration assumptions: no external integration is required.

## 22. Risks, Constraints, and Unknowns
| Area | Risk/Unknown | Impact | Proposed Handling | Requires User Confirmation |
| --- | --- | --- | --- | --- |
| SLA | Exact thresholds may differ by site | Dashboard and escalation rules may change | Use recommended default for planning | Yes |

## 23. Functional Specification Completeness Review
| Review Item | Status | Notes |
| --- | --- | --- |
| Business context is clear | pass | includes business problem, target users, operational scope, expected outcome |
| User roles and responsibilities are identified | pass | includes role actions, decisions, record visibility, dashboards/pages |
| Business objects and data requirements are identified | pass | includes required fields and reporting fields |
| Relationships are identified | pass | includes lookup/reference and history relationships |
| Main process is documented | pass | includes decision points, exceptions, and audit |
| Business process steps, decision points, exceptions, and audit needs are documented | pass | included |
| Business rules and status lifecycles are documented | pass | includes status lifecycle, approval, assignment, SLA, validation, notification, escalation, completion, cancellation, permission |
| Approval/review needs are documented or explicitly not required | pass | intake review included |
| Form/data-entry needs are documented | pass | submission and work update included |
| Workflow/notification needs are documented | pass | trigger condition, business condition, actor/recipient, action/result, timing/SLA, notification content intent included |
| Dashboard page content requirements include metrics, calculations, data regions, display fields, filters, sorting/grouping, actions, mobile needs, and alerts | pass | included |
| Reporting and audit needs are documented | pass | auditable reports, dashboards, history, compliance, operational evidence included |
| Document/attachment needs are documented or explicitly not required | pass | included |
| AI/integration needs are documented or explicitly not required | pass | no AI/integration required |
| Permissions are documented | pass | included |
| Business clarification gates are resolved or listed | pass | listed |
| Assumptions are explicit | pass | included |

## 24. Readiness for App Plan
- Ready for App Plan: Yes
- Blocking clarification questions: SLA and closure authority defaults need user approval before generation.
- Defaults approved by user: none yet.
- Requirement document path: local planning artifact.
- App Plan should be created after: Functional Specification validation and planning-mode clarification gate.
`;
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "functional-spec-quality-gates-"));
const results = [];

try {
  let file = writeFixture(tempDir, "rich-facility-spec.md", richFacilitySpec());
  let output = run(file);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "rich Facility Maintenance Functional Specification passes", status: "pass" });

  file = writeFixture(tempDir, "shallow-spec.md", `
# Shallow Request App - Functional Specification

## 1. Specification Status
## 2. Source Input Summary
## 3. Requirement Interpretation Method
## 4. Business Context
This app will manage requests.
## 5. User Roles and Responsibilities
Users manage requests.
## 6. Business Objects and Data Requirements
Business Object: Request.
## 7. Business Relationships and Dependency Rules
Relationship: not applicable.
## 8. Core Business Process
Users submit requests and staff track status.
## 9. Business Rules and Status Lifecycles
Track status.
## 10. Approval and Review Requirements
Managers approve.
## 11. Data Entry and Form Requirements
Users enter data.
## 12. Workflow and Notification Requirements
Send notifications.
## 13. Dashboard Page Requirements
Show dashboard.
## 14. Reporting and Audit Requirements
Reports are needed.
## 15. Document and Attachment Requirements
No documents required.
## 16. AI, Copilot, and Intelligent Assistance Requirements
No AI Agent or Copilot requirement identified.
## 17. Integration Requirements
No integration required.
## 18. Permissions and Access Requirements
Admins can do everything.
## 19. UI and Experience Requirements
Simple UI.
## 20. Business Clarification Gates
None.
## 21. Assumptions
Basic assumptions.
## 22. Risks, Constraints, and Unknowns
None.
## 23. Functional Specification Completeness Review
All pass.
## 24. Readiness for App Plan
Ready for App Plan: Yes.
`);
  output = run(file);
  assert.equal(output.report.status, "fail");
  expectFinding(output.report, "FUNCTIONAL_SPEC_ROLE_RESPONSIBILITIES_INCOMPLETE");
  expectFinding(output.report, "FUNCTIONAL_SPEC_BUSINESS_RULES_INCOMPLETE");
  expectFinding(output.report, "FUNCTIONAL_SPEC_VAGUE_SHOW_DASHBOARD");
  results.push({ case: "shallow generic Functional Specification fails", status: "pass" });

  file = writeFixture(tempDir, "dashboard-missing-details.md", richFacilitySpec(`
Required summary metrics:
| Dashboard | Metric |
| --- | --- |
| Facility Operations Dashboard | Open work |

Required data regions:
| Dashboard | Data Region |
| --- | --- |
| Facility Operations Dashboard | Queue |

Filter requirements:
| Dashboard | Filter |
| --- | --- |
| Facility Operations Dashboard | Location |
`).replace(/Source Object\/List \| Source Fields \| Calculation Logic/g, "Source Object/List | Source Fields").replace(/Display Fields \| User Actions Needed/g, "User Actions Needed"));
  output = run(file);
  assert.equal(output.report.status, "fail");
  expectFinding(output.report, "FUNCTIONAL_SPEC_DASHBOARD_PAGE_CONTENT_REQUIREMENTS_INCOMPLETE");
  results.push({ case: "dashboard without metrics fields filters and regions fails", status: "pass" });

  file = writeFixture(tempDir, "implementation-leakage.md", richFacilitySpec("- Implementation detail: set ListID: 2054181564731764736 and actionTypeCode: 5 for a collection control."));
  output = run(file);
  assert.equal(output.report.status, "fail");
  expectFinding(output.report, "FUNCTIONAL_SPEC_LOW_LEVEL_YEEFLOW_ID_LEAK");
  expectFinding(output.report, "FUNCTIONAL_SPEC_LOW_LEVEL_ACTIONTYPECODE_LEAK");
  results.push({ case: "Functional Specification with low-level IDs and control types fails", status: "pass" });

  console.log(JSON.stringify({ status: "pass", results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

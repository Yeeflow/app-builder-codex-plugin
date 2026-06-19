#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();

function writeFixture(dir, name, text) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, `${text.trim()}\n`);
  return file;
}

function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  let report;
  try {
    report = JSON.parse(result.stdout || "{}");
  } catch (error) {
    throw new Error(`Could not parse output for ${args.join(" ")}: ${error.message}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  }
  return { result, report };
}

function expectPass(name, args, results) {
  const { result, report } = run(args);
  assert.equal(result.status, 0, `${name} should exit 0: ${result.stderr}`);
  assert.equal(report.status, "pass", `${name} should pass: ${JSON.stringify(report.findings, null, 2)}`);
  results.push({ case: name, status: "pass" });
}

function expectFail(name, args, code, results) {
  const { result, report } = run(args);
  assert.notEqual(result.status, 0, `${name} should exit nonzero`);
  assert.equal(report.status, "fail", `${name} should fail`);
  assert.equal((report.findings || []).some((finding) => finding.code === code), true, `${name} expected ${code}; findings: ${JSON.stringify(report.findings, null, 2)}`);
  results.push({ case: name, status: "pass" });
}

function clarificationSpec(status = "answered", extra = "") {
  return `
# Example - Functional Specification

## 19. Business Decision Gates

| Key | Question | Options | Recommended Default | Required Before App Plan? | Status | Why This Matters |
| --- | --- | --- | --- | --- | --- | --- |
| BD-1 | Who approves high value requests? | Manager / Finance | Finance | Yes | ${status} | Controls approval routing |
| BD-2 | Is AI required? | Yes / No | No | No | default-approved | Scope decision |

${extra}
`;
}

function clarificationSpecMissingStatus() {
  return `
# Example - Functional Specification

## 19. Business Decision Gates

| Key | Question | Options | Why This Matters |
| --- | --- | --- | --- |
| BD-1 | Who approves high value requests? | Manager / Finance | Controls approval routing |
`;
}

const allAreas = {
  dataLists: "### 4.1 Requests\n- Resource type: Data list\n- Business purpose: Track requests.\n#### Fields\n| Field Order | Display Name | Internal ID / Field Key | Yeeflow Field Type | Placeholder |\n| --- | --- | --- | --- | --- |\n| 1 | Request Title | Title | Title/Text | Enter title |",
  approvalForms: "### 5.1 Request Approval\n- Approval form name: Request Approval\n- Form reports required: Yes\n#### Submission Form Fields\n| Field | Placeholder |\n| --- | --- |\n| Title | Enter title |\n#### Approval Workflow Nodes\n| Node Name | Node Type |\n| --- | --- |\n| Manager Approval | Assignment task |",
  formReports: "| Form Report Name | Related Approval Form | Purpose | Notes |\n| --- | --- | --- | --- |\n| Request Approval Report | Request Approval | Print approval outcome | Based on the Approval form |",
  scheduleWorkflows: "No schedule workflows required; not applicable.",
  aiAgents: "No AI Agent requirement identified; not applicable.",
  copilots: "No Copilot requirement identified; not applicable.",
  customForms: "### 10.1 Requests\n| Form Name | Form Type | Purpose |\n| --- | --- | --- |\n| Request Detail | Detail | View request details |",
  dataListWorkflows: "None required for this scope; not applicable.",
  notifications: "Notification: Request approved email; delivery proof boundary is runtime-proof-required because delivery is not locally proven.",
  views: "| View Name | Display Fields |\n| --- | --- |\n| Active Requests | Title, Status |",
  dashboards: "### 14.1 Operations Dashboard\n- Page name: Operations Dashboard\n- Business purpose: Monitor request throughput.\n#### Sections and Controls\n| Section Name | Purpose | Yeeflow Controls | Data Source | Fields Displayed |\n| --- | --- | --- | --- | --- |\n| Requests | Display Data List records | Collection | Requests | Title, Status |\n#### Record Display Control Selection\n| Section | Data Source | Display Need | Selected Control | Selection Reason | Detail/Open Behavior | Proof Boundary |\n| --- | --- | --- | --- | --- | --- | --- |\n| Requests | Requests | Card list for active requests | Collection | Collection supports scannable operational cards | Open detail slide | Runtime proof required |\n#### Item Template Dynamic Controls\n| Host Control | Source List | Item Template Region | Dynamic Control Type | Bound Field | Display Purpose | Empty/Fallback Behavior | Style/Badge/Format Notes |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n| Request Collection | Requests | Card title | dynamic-field | Title | Request title | Show Untitled | Title style |\n| Request Collection | Requests | Card status | dynamic-field | Status | Request status | Show No status | Badge style |\n#### Collection and Kanban Item Actions\nNo Collection/Kanban item actions required.",
  navigation: "| Group | Item | Yeeflow Resource Type | Target Resource |\n| --- | --- | --- | --- |\n| Operations | Requests | Data list | Requests |",
  permissions: "| Role | Resource/Page/Form | View | Create | Edit | Approve |\n| --- | --- | --- | --- | --- | --- |\n| Requester | Requests | Yes | Yes | Own | No |",
};

function readinessPlan(overrides = {}) {
  const area = { ...allAreas, ...overrides };
  return `
# Example - Yeeflow App Plan

## 1. Plan Status
- Functional Specification review gate passed: Yes
- App Plan review gate passed: Yes
- Business decision gates answered/default-approved or no blockers: Yes
- No invented unsupported shapes: Yes

## 4. Data Lists and Document Libraries Plan
${area.dataLists}

## 5. Approval Forms Plan
${area.approvalForms}

## 6. Form Reports Plan
${area.formReports}

## 7. Schedule Workflows Plan
${area.scheduleWorkflows}

## 8. AI Agents Plan
${area.aiAgents}

## 9. Copilots Plan
${area.copilots}

## 10. Custom Data List Forms Plan
${area.customForms}

## 11. Data List Workflows Plan
${area.dataListWorkflows}

## 12. Notifications Plan
${area.notifications}

## 13. Data List Views Plan
${area.views}

## 14. Dashboard Pages Plan
${area.dashboards}

## 15. Application Navigation Plan
${area.navigation}

## 16. Target Users, Roles, Groups, and Permissions
${area.permissions}

## 18. Generation Contract and Hard Gates
- Functional Specification review gate passed: Yes
- App Plan review gate passed: Yes
- Business decision gates answered/default-approved or no blockers: Yes
- No invented unsupported shapes: Yes
`;
}

function traceSpec(overrides = {}) {
  const defaults = {
    objects: "| Business Object | Description |\n| --- | --- |\n| Request | Employee request record |",
    approvals: "| Approval/Review Process | Trigger | Reviewers/Approvers |\n| --- | --- | --- |\n| Request Approval | Submit request | Manager |",
    workflows: "| Requirement | Trigger | Expected Action |\n| --- | --- | --- |\n| Notify approval | Approval complete | Send notification |",
    reporting: "| Report/Page/KPI | Business Question |\n| --- | --- |\n| Request dashboard | How many requests are open? |",
    permissions: "| Role | Resource/Process | View | Create |\n| --- | --- | --- | --- |\n| Requester | Requests | Yes | Yes |",
  };
  const body = { ...defaults, ...overrides };
  return `
# Example - Functional Specification

## 6. Business Objects and Data Concepts
${body.objects}

## 7. Business Relationships and Dependency Rules
No relationships required.

## 8. Business Process Overview
1. Requester submits a request.

## 9. Status Lifecycles
No complex lifecycle required.

## 10. Approval and Review Requirements
${body.approvals}

## 11. Data Entry and Form Requirements
No additional data entry beyond request form required.

## 12. Workflow, Automation, and Action Requirements
${body.workflows}

## 13. Reporting, Dashboard, and Analytics Requirements
${body.reporting}

## 14. Document and Attachment Requirements
No attachments required.

## 15. AI, Copilot, and Intelligent Assistance Requirements
No AI Agent or Copilot requirement identified.

## 16. Integration Requirements
No integrations required.

## 17. Permissions and Access Requirements
${body.permissions}

## 18. UI and Experience Requirements
Dashboard page and navigation are required.
`;
}

function tracePlan(overrides = {}) {
  const defaults = {
    mapping: "| Requirement Area | Business Requirement | Yeeflow Resource Type | Planned Resource Name |\n| --- | --- | --- | --- |\n| Data management | Request | Data list | Requests |\n| Approval/review | Request Approval | Approval form | Request Approval |\n| Reporting | Request dashboard | Dashboard page | Operations Dashboard |",
    dataLists: "Data list: Requests with Title and Status fields.",
    approvals: "Approval form: Request Approval with submission fields and approval workflow.",
    reports: "Form Report: Request Approval Report based on Request Approval.",
    workflows: "Notification workflow: Notify approval. Reason: delivery proof is runtime-proof-required with fallback to manual notification.",
    dashboards: "Dashboard page: Operations Dashboard with Summary controls bound to Requests.",
    views: "Active Requests view.",
    permissions: "Roles and permissions: Requester can view/create Requests; Manager can approve.",
    deferred: "| Item | Category | Reason | User Impact | Fallback | Required Proof or Follow-up |\n| --- | --- | --- | --- | --- | --- |\n| Notification delivery | runtime-proof-required | Delivery requires tenant mail proof | Users may need manual follow-up | Manual email | Runtime proof after install |",
  };
  const body = { ...defaults, ...overrides };
  return `
# Example - Yeeflow App Plan

## 2. Requirement-to-Yeeflow Resource Mapping Summary
${body.mapping}

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
${body.dataLists}

## 5. Approval Forms Plan
${body.approvals}

## 6. Form Reports Plan
${body.reports}

## 7. Schedule Workflows Plan
None required; not applicable.

## 8. AI Agents Plan
No AI Agent requirement identified; not applicable.

## 9. Copilots Plan
No Copilot requirement identified; not applicable.

## 10. Custom Data List Forms Plan
Request New/Edit/View forms with fields and Placeholder planning.

## 11. Data List Workflows Plan
${body.workflows}

## 12. Notifications Plan
${body.workflows}

## 13. Data List Views Plan
${body.views}

## 14. Dashboard Pages Plan
${body.dashboards}

## 15. Application Navigation Plan
Navigation item: Requests and Operations Dashboard.

## 16. Target Users, Roles, Groups, and Permissions
${body.permissions}

## 17. Plugin Capability and Standards Compliance
All unsupported capabilities are marked deferred, runtime-proof-required, or not applicable. Integration planning is not applicable.

## 22. Deferred or Runtime-Proof Items
${body.deferred}
`;
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "clarification-readiness-traceability-"));
const results = [];

try {
  const clarificationPass = writeFixture(tempDir, "clarification-pass.md", clarificationSpec("answered"));
  expectPass("Business Clarification pass: answered/default-approved/not applicable", ["scripts/validate-business-clarification-gate.mjs", "--spec", clarificationPass, "--json"], results);

  const clarificationUnanswered = writeFixture(tempDir, "clarification-unanswered.md", clarificationSpec("unanswered"));
  expectFail("Business Clarification fail: unanswered gate", ["scripts/validate-business-clarification-gate.mjs", "--spec", clarificationUnanswered, "--json"], "BUSINESS_CLARIFICATION_UNANSWERED_GATE", results);

  const clarificationPending = writeFixture(tempDir, "clarification-pending.md", clarificationSpec("TBD"));
  expectFail("Business Clarification fail: pending/TBD gate", ["scripts/validate-business-clarification-gate.mjs", "--spec", clarificationPending, "--json"], "BUSINESS_CLARIFICATION_UNANSWERED_GATE", results);

  const clarificationPaused = writeFixture(tempDir, "clarification-paused.md", clarificationSpec("answered", "Generation is paused until these questions are answered."));
  expectFail("Business Clarification fail: generation paused wording", ["scripts/validate-business-clarification-gate.mjs", "--spec", clarificationPaused, "--json"], "BUSINESS_CLARIFICATION_GENERATION_PAUSED", results);

  const clarificationMissingStatus = writeFixture(tempDir, "clarification-missing-status.md", clarificationSpecMissingStatus());
  expectFail("Business Clarification fail: status missing in table", ["scripts/validate-business-clarification-gate.mjs", "--spec", clarificationMissingStatus, "--json"], "BUSINESS_CLARIFICATION_STATUS_MISSING", results);

  const readinessPass = writeFixture(tempDir, "readiness-pass.md", readinessPlan());
  expectPass("Generation Readiness pass: all 13 areas planned or not applicable/deferred", ["scripts/validate-generation-readiness-review.mjs", "--plan", readinessPass, "--json"], results);

  const readinessMissing = writeFixture(tempDir, "readiness-missing.md", readinessPlan({ notifications: "" }).replace("## 12. Notifications Plan\n\n", ""));
  expectFail("Generation Readiness fail: missing resource area section", ["scripts/validate-generation-readiness-review.mjs", "--plan", readinessMissing, "--json"], "GENERATION_READINESS_SECTION_MISSING", results);

  const readinessPlaceholder = writeFixture(tempDir, "readiness-placeholder.md", readinessPlan({ scheduleWorkflows: "<Workflow>" }));
  expectFail("Generation Readiness fail: placeholder-only resource area", ["scripts/validate-generation-readiness-review.mjs", "--plan", readinessPlaceholder, "--json"], "GENERATION_READINESS_PLACEHOLDER_ONLY", results);

  const readinessApprovalIncomplete = writeFixture(tempDir, "readiness-approval-incomplete.md", readinessPlan({ approvalForms: "### 5.1 Request Approval\n- Approval form name: Request Approval" }));
  expectFail("Generation Readiness fail: Approval form without fields/workflow", ["scripts/validate-generation-readiness-review.mjs", "--plan", readinessApprovalIncomplete, "--json"], "GENERATION_READINESS_APPROVAL_FORM_INCOMPLETE", results);

  const readinessReportMissing = writeFixture(tempDir, "readiness-report-missing.md", readinessPlan({ formReports: "Dashboard-only approval status page." }));
  expectFail("Generation Readiness fail: Form Report missing for Approval form", ["scripts/validate-generation-readiness-review.mjs", "--plan", readinessReportMissing, "--json"], "GENERATION_READINESS_FORM_REPORT_MISSING", results);

  const readinessDashboardMissing = writeFixture(tempDir, "readiness-dashboard-missing.md", readinessPlan({ dashboards: "Dashboard page: Operations Dashboard." }));
  expectFail("Generation Readiness fail: Dashboard lacks controls/data source/bindings", ["scripts/validate-generation-readiness-review.mjs", "--plan", readinessDashboardMissing, "--json"], "GENERATION_READINESS_DASHBOARD_BINDING_MISSING", results);

  const readinessNavigationMissing = writeFixture(tempDir, "readiness-navigation-missing.md", readinessPlan({ navigation: "" }));
  expectFail("Generation Readiness fail: missing navigation", ["scripts/validate-generation-readiness-review.mjs", "--plan", readinessNavigationMissing, "--json"], "GENERATION_READINESS_NAVIGATION_MISSING", results);

  const readinessPermissionsMissing = writeFixture(tempDir, "readiness-permissions-missing.md", readinessPlan({ permissions: "" }));
  expectFail("Generation Readiness fail: missing roles/permissions", ["scripts/validate-generation-readiness-review.mjs", "--plan", readinessPermissionsMissing, "--json"], "GENERATION_READINESS_ROLES_PERMISSIONS_MISSING", results);

  const traceSpecPass = writeFixture(tempDir, "trace-spec-pass.md", traceSpec());
  const tracePlanPass = writeFixture(tempDir, "trace-plan-pass.md", tracePlan());
  expectPass("Traceability pass: objects/approval/workflow/reporting/permissions mapped", ["scripts/validate-functional-spec-to-app-plan-traceability.mjs", "--spec", traceSpecPass, "--plan", tracePlanPass, "--json"], results);

  const traceObjectMissing = writeFixture(tempDir, "trace-object-missing.md", tracePlan({ mapping: "Approval/review maps to Request Approval.", dataLists: "No list planning provided." }));
  expectFail("Traceability fail: business object missing from App Plan", ["scripts/validate-functional-spec-to-app-plan-traceability.mjs", "--spec", traceSpecPass, "--plan", traceObjectMissing, "--json"], "TRACEABILITY_BUSINESS_OBJECT_UNMAPPED", results);

  const traceApprovalMissing = writeFixture(tempDir, "trace-approval-missing.md", tracePlan({ mapping: "Data management maps to Requests.", approvals: "No review resource planned." }));
  expectFail("Traceability fail: approval requirement missing Approval form/deferred", ["scripts/validate-functional-spec-to-app-plan-traceability.mjs", "--spec", traceSpecPass, "--plan", traceApprovalMissing, "--json"], "TRACEABILITY_APPROVAL_REQUIREMENT_UNMAPPED", results);

  const traceReportingMissing = writeFixture(tempDir, "trace-reporting-missing.md", tracePlan({ reports: "None.", dashboards: "None.", views: "None.", mapping: "Data management maps to Requests data list." }));
  expectFail("Traceability fail: reporting requirement missing report/view/dashboard/deferred", ["scripts/validate-functional-spec-to-app-plan-traceability.mjs", "--spec", traceSpecPass, "--plan", traceReportingMissing, "--json"], "TRACEABILITY_REPORTING_REQUIREMENT_UNMAPPED", results);

  const tracePermissionMissing = writeFixture(tempDir, "trace-permission-missing.md", tracePlan({ permissions: "No security coverage planned." }));
  expectFail("Traceability fail: permission requirement missing roles/permissions", ["scripts/validate-functional-spec-to-app-plan-traceability.mjs", "--spec", traceSpecPass, "--plan", tracePermissionMissing, "--json"], "TRACEABILITY_PERMISSION_REQUIREMENT_UNMAPPED", results);

  const traceDeferredNoReason = writeFixture(tempDir, "trace-deferred-no-reason.md", tracePlan({ deferred: "- Notification delivery deferred" }));
  expectFail("Traceability fail: deferred item has no reason/fallback/proof impact", ["scripts/validate-functional-spec-to-app-plan-traceability.mjs", "--spec", traceSpecPass, "--plan", traceDeferredNoReason, "--json"], "TRACEABILITY_DEFERRED_WITHOUT_REASON", results);

  console.log(JSON.stringify({ status: "pass", results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

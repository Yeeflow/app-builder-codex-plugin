#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts/validate-approval-form-layout-template.mjs");
const SUBMISSION_TEMPLATE_ID = "approval_form_layout_submission_v1_1";
const TASK_TEMPLATE_ID = "approval_form_layout_task_v1_1";
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "approval-form-layout-v11-"));
const results = [];

try {
  expectPass("registry validates", ["--registry", "docs/reference/approval-form-layout-templates.json"]);
  expectPass("Submission form template resource passes", ["--resource", writeJson("submission-valid.json", submissionResource()), "--template", SUBMISSION_TEMPLATE_ID, "--page-role", "submission"]);
  expectPass("Task form template resource passes", ["--resource", writeJson("task-valid.json", taskResource()), "--template", TASK_TEMPLATE_ID, "--page-role", "task"]);
  expectPass("generated package with submission and task templates passes", ["--package", writePackage("valid-approval-layout.yapk", decodedPackage())]);
  expectPass("generated package with data-list and schedule workflow task templates passes", ["--package", writePackage("valid-workflow-task-layouts.yapk", decodedPackage({ workflowTasks: true }))]);
  expectPass("App Plan approval layout selections pass", ["--plan", writeText("valid-app-plan.md", appPlan())]);

  const missingMarker = taskResource({ marker: false });
  expectCode("generated package task form missing template marker fails", ["--package", writePackage("missing-marker.yapk", decodedPackage({ taskResource: missingMarker }))], "APPROVAL_FORM_LAYOUT_TEMPLATE_MARKER_MISSING");

  const wrongTask = taskResource();
  wrongTask.approvalFormLayoutTemplateId = SUBMISSION_TEMPLATE_ID;
  wrongTask.derivedFromApprovalFormLayoutTemplate = SUBMISSION_TEMPLATE_ID;
  expectCode("task form using submission marker fails", ["--package", writePackage("wrong-task-template.yapk", decodedPackage({ taskResource: wrongTask }))], "APPROVAL_FORM_LAYOUT_TEMPLATE_MISMATCH");

  const analytics = submissionResource();
  firstSectionSlot(analytics).children.push({ id: "analytics-1", type: "pie-chart", nv_label: "pie_chart_control", attrs: { dataAnalyticsTemplateId: "data_analytics_pie_chart_with_title" } });
  expectCode("Approval form data analytics controls fail", ["--resource", writeJson("submission-analytics.json", analytics), "--template", SUBMISSION_TEMPLATE_ID, "--page-role", "submission"], "APPROVAL_FORM_LAYOUT_DATA_ANALYTICS_FORBIDDEN");

  const missingHistory = taskResource();
  removeByType(missingHistory, "workflowHistory");
  expectCode("action panel/history wrapper without workflow history fails", ["--resource", writeJson("task-missing-history.json", missingHistory), "--template", TASK_TEMPLATE_ID, "--page-role", "task"], "APPROVAL_FORM_LAYOUT_WORKFLOW_HISTORY_MISSING");

  const inventedRoot = submissionResource();
  content(inventedRoot).children.push({ id: "loose-control", type: "input", nv_label: "loose_business_input", attrs: {} });
  expectCode("business control directly under approval Content fails", ["--resource", writeJson("submission-root-business.json", inventedRoot), "--template", SUBMISSION_TEMPLATE_ID, "--page-role", "submission"], "APPROVAL_FORM_LAYOUT_INVENTED_ROOT_MODULE");

  expectCode("App Plan approval form without layout selection table fails", ["--plan", writeText("plan-missing-selection.md", appPlan({ omitSelection: true }))], "APPROVAL_FORM_LAYOUT_APP_PLAN_SELECTION_TABLE_MISSING");
  expectCode("App Plan submission selecting task template fails", ["--plan", writeText("plan-submission-wrong.md", appPlan({ submissionTemplate: TASK_TEMPLATE_ID }))], "APPROVAL_FORM_LAYOUT_APP_PLAN_SUBMISSION_TEMPLATE_MISMATCH");
  expectCode("App Plan task selecting submission template fails", ["--plan", writeText("plan-task-wrong.md", appPlan({ taskTemplate: SUBMISSION_TEMPLATE_ID }))], "APPROVAL_FORM_LAYOUT_APP_PLAN_TASK_TEMPLATE_MISMATCH");
  expectCode("App Plan schedule workflow task without layout table fails", ["--plan", writeText("plan-schedule-task-missing.md", appPlan({ omitScheduleTaskSelection: true }))], "APPROVAL_FORM_LAYOUT_WORKFLOW_TASK_SELECTION_TABLE_MISSING");
  expectCode("App Plan data-list workflow task selecting submission template fails", ["--plan", writeText("plan-data-list-task-wrong.md", appPlan({ dataListWorkflowTaskTemplate: SUBMISSION_TEMPLATE_ID }))], "APPROVAL_FORM_LAYOUT_WORKFLOW_TASK_TEMPLATE_UNKNOWN");

  const workflowTaskWrong = taskResource();
  workflowTaskWrong.approvalFormLayoutTemplateId = SUBMISSION_TEMPLATE_ID;
  workflowTaskWrong.derivedFromApprovalFormLayoutTemplate = SUBMISSION_TEMPLATE_ID;
  expectCode("data-list workflow task using submission marker fails", ["--package", writePackage("wrong-workflow-task-template.yapk", decodedPackage({ workflowTasks: true, workflowTaskResource: workflowTaskWrong }))], "APPROVAL_FORM_LAYOUT_TEMPLATE_MISMATCH");

  console.log(JSON.stringify({ status: "pass", results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function run(args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function expectPass(name, args) {
  const result = run(args);
  results.push({ name, status: result.status === 0 ? "pass" : "fail", args, stdout: result.stdout.slice(0, 1000), stderr: result.stderr.slice(0, 1000) });
  assert.equal(result.status, 0, `${name}\n${result.stdout}\n${result.stderr}`);
}

function expectCode(name, args, code) {
  const result = run(args);
  const output = `${result.stdout}\n${result.stderr}`;
  results.push({ name, status: result.status !== 0 && output.includes(code) ? "pass" : "fail", args, expectedCode: code, stdout: result.stdout.slice(0, 1000), stderr: result.stderr.slice(0, 1000) });
  assert.notEqual(result.status, 0, `${name} should fail`);
  assert.match(output, new RegExp(code), `${name} should include ${code}\n${output}`);
}

function template(file, templateId, marker = true) {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference", file), "utf8"));
  const resource = clone(raw.templateResource);
  if (marker) {
    resource.derivedFromApprovalFormLayoutTemplate = templateId;
    resource.approvalFormLayoutTemplateId = templateId;
  } else {
    delete resource.derivedFromApprovalFormLayoutTemplate;
    delete resource.approvalFormLayoutTemplateId;
  }
  return resource;
}

function submissionResource(options = {}) {
  return template("approval-form-layout-submission.template.json", SUBMISSION_TEMPLATE_ID, options.marker !== false);
}

function taskResource(options = {}) {
  return template("approval-form-layout-task.template.json", TASK_TEMPLATE_ID, options.marker !== false);
}

function decodedPackage(options = {}) {
  const submission = options.submissionResource || submissionResource();
  const task = options.taskResource || taskResource();
  const def = {
    defkey: "APPR-LAYOUT-TEST",
    key: "APPR-LAYOUT-TEST",
    workflowType: 2,
    childshapes: [
      { resourceid: "start", id: "start", stencil: { id: "StartNoneEvent" }, outgoing: [{ resourceid: "flow-1" }] },
      { resourceid: "flow-1", id: "flow-1", stencil: { id: "SequenceFlow" }, source: { resourceid: "start" }, target: { resourceid: "task-1" } },
      { resourceid: "task-1", id: "task-1", stencil: { id: "AssignmentTask" }, properties: { taskurl: "task-page" } },
      { resourceid: "end", id: "end", stencil: { id: "EndNoneEvent" } },
    ],
    pageurls: [
      { id: "submission-page", type: 1, title: "Submission form page layout", pagetype: 1, formdef: submission },
      { id: "task-page", type: 2, title: "Task form page layout", pagetype: 1, formdef: task },
    ],
  };
  const decoded = {
    ListSet: { ListID: "1909200000000000001", Title: "Approval Form Layout Test" },
    Childs: [],
    Forms: [
      {
        Key: "APPR-LAYOUT-TEST",
        Name: "Approval form page layout",
        Title: "Approval form page layout",
        WorkflowType: 2,
        DefResource: encodeDefResource(def),
      },
    ],
    Pages: [],
    FormNewReports: [],
    DataReports: [],
    Navigation: [],
    IconUrl: "{\"b\":\"#0f766e\",\"i\":\"fa-solid fa-clipboard-check\",\"c\":\"#ffffff\"}",
  };
  if (options.workflowTasks) {
    const workflowTask = options.workflowTaskResource || taskResource();
    decoded.DataListWorkflows = [
      {
        Name: "Asset return review workflow",
        DefResource: encodeDefResource({
          key: "DL-WF-TASK",
          defkey: "DL-WF-TASK",
          workflowType: "data-list",
          pageurls: [
            { id: "dl-task-page", type: 2, title: "Data list workflow task", pagetype: 1, formdef: workflowTask },
          ],
        }),
      },
    ];
    decoded.ScheduleWorkflows = [
      {
        Name: "Overdue escalation workflow",
        DefResource: encodeDefResource({
          key: "SCHED-WF-TASK",
          defkey: "SCHED-WF-TASK",
          workflowType: "schedule",
          pageurls: [
            { id: "schedule-task-page", type: 2, title: "Schedule workflow task", pagetype: 1, formdef: taskResource() },
          ],
        }),
      },
    ];
  }
  return decoded;
}

function appPlan({ omitSelection = false, submissionTemplate = SUBMISSION_TEMPLATE_ID, taskTemplate = TASK_TEMPLATE_ID, omitScheduleTaskSelection = false, dataListWorkflowTaskTemplate = TASK_TEMPLATE_ID } = {}) {
  const selection = omitSelection ? "" : `
#### Approval Form Layout Template Selection

| Approval Form | Form Page | Page Role | Selected Approval Form Layout Template | Business Sections Needed | Related Data Needed | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Asset Loan Approval | Submission form | Submission | ${submissionTemplate} | Page title and request sections | Current request data only | Submission captures requester-entered approval fields | Generated-final validation |
| Asset Loan Approval | Coordinator task form | Task | ${taskTemplate} | Page title, readonly request context, action/history section | Related loan context | Task reviewers need consistent readonly context and workflow action area | Generated-final validation |
`;
  const scheduleSelection = omitScheduleTaskSelection ? "" : `
#### Workflow Task Form Layout Template Selection

| Workflow | Host Resource | Task Form | Workflow Surface | Selected Workflow Task Form Layout Template | Business Sections Needed | Editable Task Inputs | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Overdue Escalation | Schedule | Escalation task form | Schedule workflow task | ${TASK_TEMPLATE_ID} | Page title, readonly overdue context, action/history section | None | Scheduled reviewers need the same workflow task form standard | Generated-final validation |
`;
  const dataListWorkflowSelection = `
#### Workflow Task Form Layout Template Selection

| Workflow | Host Resource | Task Form | Workflow Surface | Selected Workflow Task Form Layout Template | Business Sections Needed | Editable Task Inputs | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Return Review | Loan Requests | Return review task form | Data list workflow task | ${dataListWorkflowTaskTemplate} | Page title, readonly return context, action/history section | Return notes when required | Data list workflow task forms use the same v1.1 task template | Generated-final validation |
`;
  return `
# Office Asset Loan Management - Yeeflow App Plan

## 1. Plan Status
Ready.

## 2. Requirement-to-Yeeflow Resource Mapping Summary
Placeholder.

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
Placeholder.

## 5. Approval Forms Plan

| Approval Form | Business Purpose | Submission Form Fields | Task Form Fields | Task Forms | ContentList Persistence | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- |
| Asset Loan Approval | Route asset requests | Placeholder and input hint for request fields | Placeholder task page fields | Coordinator task form | Loan Requests | Generated-final validation |

${selection}

## 6. Form Reports Plan
Form report is a standalone Yeeflow resource type based on one specific Approval Form. Do not merge Form report with Dashboard page planning.

## 7. Schedule Workflows Plan
| Schedule Workflow Name | Description | Schedule Configuration | Trigger Frequency | Nodes | Branches | Data Read/Write | Proof Level | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Overdue Escalation | Create review tasks for overdue returns | Supported config | Daily | Assignment Task with task form | Approved/Rejected | Reads Loan Requests | runtime-proof-required | Task form required |

${scheduleSelection}

## 8. AI Agents Plan
Placeholder.

## 9. Copilots Plan
Placeholder.

## 10. Custom Data List Forms Plan
No custom data list forms are planned for this fixture.

## 11. Data List Workflows Plan
| Workflow Name | Host List/Library | Trigger Condition | Nodes in Order | Branches | Branch Conditions | Data Read/Write | Notifications/AI/External Calls | Proof Level | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Return Review | Loan Requests | Returned with exception | Assignment Task with task form | Approved/Rejected | Reviewer decision | Updates Loan Requests | None | runtime-proof-required | Task form required |

${dataListWorkflowSelection}

No Sub List actions are needed.

## 12. Notifications Plan
Placeholder.

## 13. Data List Views Plan
Placeholder.

## 14. Dashboard Pages Plan
Page name: Not planned.
Business purpose: Not planned.
Source Functional Specification dashboard requirement reference: Not planned.
Source data lists/business objects: Not planned.
Navigation placement: Not planned.
Page Function Plan reference if applicable: Not planned.
#### Dashboard Sections
| Section Order | Section Name | Business Purpose | Source Data List or Business Object | Required Fields or Metrics | Selected Yeeflow Control Type Category | Why This Control Type Is Appropriate | User Actions Needed | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | None | None | None | None | Text / Heading | No dashboard page planned | None | deferred |
#### Dashboard Filters
| Filter Name | Source Data List | Filter Field | Applies-to Dashboard Sections | Selected Yeeflow Filter/Control Type If Known | Default Business Scope | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- |
| None | None | None | None | None | None | deferred |
#### Summary Metrics
| Metric Name | Source Data List | Source Field(s) | Calculation Logic | Selected Yeeflow Control Type Category | Display Format Intent | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- |
| None | None | None | None | Summary | None | deferred |
#### Data Analytics Template Selection
| Section | Surface | Data Source | Business Question | Selected Data Analytics Template | Grouping/Axis Fields | Value/Aggregate Fields | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| None | Dashboard | None | None | data_analytics_pie_chart_with_title | None | None | Placeholder only | deferred |
#### Dashboard Actions
| Action Name | Business Purpose | Source/Target Business Object | Expected User Outcome | Supported Yeeflow Action Category When Known | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- |
| None | None | None | None | Button / action button | deferred |
#### Record Display Control Selection
| Section | Data Source | Display Need | Selected Record Display Control | Selection Reason | Detail/Open Behavior | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- |
| None | None | None | Collection | No dashboard collection planned | None | deferred |
#### Item Template Dynamic Controls
| Host Control | Source List | Business Label | Source Field | Expected Dynamic Display Control Category | Display Purpose | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- |
| None | None | None | None | Dynamic field | None | deferred |

## 15. Application Navigation Plan
Placeholder.

## 16. Target Users, Roles, Groups, and Permissions
Placeholder.

## 17. Plugin Capability and Standards Compliance
Only supported resource types, field types, variable types, controls, Dynamic controls, workflow nodes, form actions, Collection/Kanban actions, Sub List actions, property paths, and configuration shapes may be generated. Do not invent unsupported control shapes; unsupported shapes should not be generated. Unknown capabilities must be marked export-learning-required, runtime-proof-required, or deferred.

## 18. Generation Contract and Hard Gates
Placeholder.

## 19. Validation Plan
Placeholder.

## 20. Proof Boundary
Placeholder.

## 21. Assumptions
Placeholder.

## 22. Deferred or Runtime-Proof Items
Placeholder.

## 23. Recommended Next Prompt
Placeholder.
`;
}

function encodeDefResource(def) {
  const payload = zlib.brotliCompressSync(Buffer.from(JSON.stringify(def), "utf8"));
  return Buffer.concat([Buffer.from("::brotli::", "utf8"), payload]).toString("base64");
}

function writePackage(name, decoded) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, `${JSON.stringify({ Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64") })}\n`);
  return file;
}

function content(resource) {
  return find(resource, "content");
}

function firstSectionSlot(resource) {
  return find(resource, "section_content_area");
}

function find(node, identity) {
  let found = null;
  visit(node, (current) => {
    if (!found && ids(current).includes(identity)) found = current;
  });
  return found;
}

function ids(node) {
  return [node?.id, node?.name, node?.label, node?.title, node?.nv_label, node?.nav_label, node?.attrs?.name, node?.attrs?.nav_label, node?.attrs?.nv_label].filter(Boolean).map(String);
}

function visit(node, fn) {
  if (!node || typeof node !== "object") return;
  fn(node);
  for (const child of node.children || []) visit(child, fn);
}

function removeByType(node, type) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node.children)) {
    node.children = node.children.filter((child) => String(child?.type || "") !== type);
    node.children.forEach((child) => removeByType(child, type));
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function writeJson(name, value) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
}

function writeText(name, value) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, `${value.trim()}\n`);
  return file;
}

#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const REQUEST_PAGE_ID = "11111111-1111-4111-8111-111111111111";
const TASK_PAGE_ID = "22222222-2222-4222-8222-222222222222";

function page(id, key, type, formdefPagetype) {
  return {
    id,
    key,
    type,
    pagetype: 1,
    title: key,
    pageUrl: key,
    pageurl: key,
    PageUrl: key,
    formdef: {
      id,
      key,
      pagetype: formdefPagetype,
      children: [
        { id: `${id}-panel`, type: "workflowControlPanel", attrs: {}, children: [] },
        { id: `${id}-history`, type: "workflowHistory", attrs: {}, children: [] },
      ],
    },
  };
}

function app(assignment) {
  const def = {
    defkey: "ASSIGNMENT_GUARDRAIL_TEST",
    key: "ASSIGNMENT_GUARDRAIL_TEST",
    name: "Assignment Guardrail Test",
    workflowType: 2,
    variables: { basic: [], listref: [], filter: [] },
    graphposition: { x: 0, y: 0, width: 800, height: 600 },
    graphzoom: 1,
    graphver: 2,
    lineType: "rounded",
    flowPage: [],
    pageurls: [
      page(REQUEST_PAGE_ID, "ASSIGNMENT_GUARDRAIL_TEST_1", 1, 1),
      page(TASK_PAGE_ID, "ASSIGNMENT_GUARDRAIL_TEST_2", 2, 2),
    ],
    childshapes: [
      { id: "start", resourceid: "start", stencil: { id: "StartNoneEvent" }, properties: { name: "Start", taskurl: REQUEST_PAGE_ID, taskUrl: REQUEST_PAGE_ID, TaskUrl: REQUEST_PAGE_ID }, outgoing: [{ resourceid: "flow-start-task" }] },
      { id: "flow-start-task", resourceid: "flow-start-task", stencil: { id: "SequenceFlow" }, source: { id: "start", resourceid: "start" }, target: { id: "task", resourceid: "task" }, properties: { name: "Submit", linetype: "rounded", documentation: "" }, dockers: [] },
      {
        id: "task",
        resourceid: "task",
        stencil: { id: "MultiAssignmentTask" },
        properties: {
          name: "Review",
          pagetype: 1,
          taskurl: TASK_PAGE_ID,
          taskUrl: TASK_PAGE_ID,
          TaskUrl: TASK_PAGE_ID,
          approveway: "anyapprove",
          approvepercentage: 100,
          usertaskassignment: assignment === null ? [] : Array.isArray(assignment) ? assignment : [assignment],
        },
        incoming: [{ resourceid: "flow-start-task" }],
        outgoing: [{ resourceid: "flow-task-end" }],
      },
      { id: "flow-task-end", resourceid: "flow-task-end", stencil: { id: "SequenceFlow" }, source: { id: "task", resourceid: "task" }, target: { id: "end", resourceid: "end" }, properties: { name: "Complete", linetype: "rounded", documentation: "" }, dockers: [] },
      { id: "end", resourceid: "end", stencil: { id: "EndNoneEvent" }, properties: { name: "End" }, incoming: [{ resourceid: "flow-task-end" }] },
    ],
  };
  return {
    Item: {
      ListModel: { Title: "Assignment Guardrail Test", ListID: "1000000000000000001", Type: 1024, Status: 1 },
      Defs: [],
      Layouts: [],
    },
    Childs: [],
    Forms: [{
      ID: "1000000000000000002",
      Name: "Assignment Guardrail Test",
      Key: "ASSIGNMENT_GUARDRAIL_TEST",
      ListID: 0,
      WorkflowType: 2,
      Status: 1,
      Deployed: true,
      NoRule: { Prefix: "AG-{index}", StartIndex: 1, CustomLength: 4, AutoIncrement: 1 },
      DefResource: JSON.stringify(def),
    }],
    AppGroups: [],
    AppThemes: [],
    Pages: [],
    FormReports: [],
    FormNewReports: [],
    DataReports: [],
    Reports: [],
    Dashboards: [],
    ReplaceIds: {},
  };
}

function jobPosition(overrides = {}) {
  return {
    type: "position",
    method: "position",
    position: "1000000000000000999",
    title: "Finance Manager",
    source: "discovered-existing-job-position",
    proofStatus: "discovered",
    requiredJobPositionName: "Finance Manager",
    ...overrides,
  };
}

function managerExpression(label, value) {
  return {
    type: "user",
    method: "expression",
    title: label,
    value,
  };
}

function expressionButton(data, label) {
  const escapedData = JSON.stringify(data).replace(/"/g, "&quot;");
  return `<input type="button" data="\${${escapedData}}" expr="__" tabindex="-1" value="${label}">`;
}

function applicantUserExpr() {
  return JSON.stringify({ type: "application", prop: "ApplicantUserID" });
}

function variableUserRef(variableId) {
  return JSON.stringify({ type: "variable", param: { id: variableId } });
}

function applicantLineManager() {
  return managerExpression("User: Applicant:Line Manager", expressionButton({
    type: "user",
    param: { id: applicantUserExpr() },
    prop: "LineManager",
  }, "Applicant:Line Manager"));
}

function applicantDepartmentManager() {
  return managerExpression("User: Applicant:Department:Manager", expressionButton({
    type: "org",
    param: {
      id: JSON.stringify({
        type: "user",
        param: { id: applicantUserExpr() },
        prop: "OrganizationID",
      }),
    },
    prop: "Manager",
  }, "Applicant:Department:Manager"));
}

function workflowVariableUser(variableId = "Owner") {
  return managerExpression(`User: Workflow Variables:${variableId}`, expressionButton({
    type: "variable",
    param: { id: variableId },
  }, `Workflow Variables:${variableId}`));
}

function workflowVariableUserLineManager(variableId = "Owner") {
  return managerExpression(`User: Workflow Variables:${variableId}:Line Manager`, expressionButton({
    type: "user",
    param: { id: variableUserRef(variableId) },
    prop: "LineManager",
  }, `Workflow Variables:${variableId}:Line Manager`));
}

function directUser(overrides = {}) {
  return {
    type: "user",
    method: "direct",
    title: "Explicit User",
    value: "1000000000000000888",
    explicitlyRequested: true,
    ...overrides,
  };
}

function writeFixture(dir, name, assignment) {
  const file = path.join(dir, `${name}.json`);
  fs.writeFileSync(file, `${JSON.stringify(app(assignment), null, 2)}\n`, "utf8");
  return file;
}

function run(file) {
  const result = spawnSync(process.execPath, ["validate-yap-package.js", file, "--mode", "generator", "--stage", "final"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 24 * 1024 * 1024,
  });
  const report = JSON.parse(result.stdout || "{}");
  return { result, report };
}

function codes(report) {
  return new Set([...(report.errors || []), ...(report.warnings || []), ...(report.dependencies || [])].map((finding) => finding.code));
}

function expectPass(name, assignment) {
  const file = writeFixture(tmp, name, assignment);
  const { result, report } = run(file);
  const findingCodes = codes(report);
  for (const code of ["TASK_USERTASKASSIGNMENT_EMPTY", "TASK_ASSIGNEE_EMPTY", "TASK_ASSIGNEE_PLACEHOLDER", "TASK_ASSIGNEE_INVENTED_REFERENCE", "TASK_JOB_POSITION_PROOF_MISSING", "TASK_JOB_POSITION_MISSING_BLOCKED", "TASK_MANAGER_EXPRESSION_MALFORMED", "TASK_DIRECT_USER_REQUIRES_EXPLICIT_REQUEST"]) {
    assert.equal(findingCodes.has(code), false, `${name} unexpectedly reported ${code}: ${JSON.stringify(report.errors, null, 2)}`);
  }
}

function expectCode(name, assignment, code) {
  const file = writeFixture(tmp, name, assignment);
  const { result, report } = run(file);
  assert.notEqual(result.status, 0, `${name} should fail`);
  assert.equal(codes(report).has(code), true, `${name} did not report ${code}: ${JSON.stringify(report.errors, null, 2)}`);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-assignee-guardrails-"));

try {
  expectPass("job-position-discovered", jobPosition());
  expectPass("line-manager", applicantLineManager());
  expectPass("department-manager", applicantDepartmentManager());
  expectPass("location-manager", managerExpression("Applicant:Location:Manager", "{{Applicant.Location.Manager}}"));
  expectPass("workflow-variable-user", workflowVariableUser("Owner"));
  expectPass("workflow-variable-line-manager", workflowVariableUserLineManager("Owner"));
  expectPass("multiple-workflow-variable-assignees", [workflowVariableUser("Owner"), workflowVariableUserLineManager("Owner")]);
  expectPass("explicit-direct-user", directUser());

  expectCode("empty-assignee", null, "TASK_USERTASKASSIGNMENT_EMPTY");
  expectCode("placeholder-assignee", jobPosition({ position: "__POSITION_REQUIRED__" }), "TASK_ASSIGNEE_PLACEHOLDER");
  expectCode("invented-job-position", jobPosition({ position: "mock-position-1" }), "TASK_ASSIGNEE_INVENTED_REFERENCE");
  expectCode("missing-job-position-proof", jobPosition({ source: undefined, proofStatus: undefined }), "TASK_JOB_POSITION_PROOF_MISSING");
  expectCode("missing-job-position-blocked", jobPosition({ source: "unresolved", proofStatus: "blocked", creationRequired: true }), "TASK_JOB_POSITION_MISSING_BLOCKED");
  expectCode("write-not-confirmed", jobPosition({ source: "admin-created-job-position", proofStatus: "created-after-confirmation", creationRequired: true, creationConfirmed: true, systemAdminConfirmed: false }), "TASK_JOB_POSITION_WRITE_NOT_CONFIRMED");
  expectCode("hardcoded-user-without-request", directUser({ explicitlyRequested: false, userAssignmentExplicitlyRequested: false }), "TASK_DIRECT_USER_REQUIRES_EXPLICIT_REQUEST");
  expectCode("malformed-manager-expression", managerExpression("Reviewer expression", "not an expression"), "TASK_MANAGER_EXPRESSION_MALFORMED");

  console.log(JSON.stringify({ status: "pass", cases: 16 }, null, 2));
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

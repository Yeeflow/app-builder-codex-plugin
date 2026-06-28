#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MATERIALIZER = path.join(ROOT, "scripts/materialize-full-app-generated-final.mjs");
const VALIDATOR = path.join(ROOT, "scripts/validate-approval-workflow-publish-readiness.mjs");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "approval-workflow-publish-"));
const cases = [];

try {
  const { packagePath, planPath } = materializeApprovalPackage();
  expectPass("materialized Approval workflow package passes publish-readiness gate", ["--package", packagePath, "--plan", planPath]);
  cases.push({ case: "pass: materialized package workflow is publish-ready", status: "pass" });

  const materializedDef = decodeFirstApprovalDef(packagePath);
  const materializedTaskNames = materializedDef.childshapes
    .filter((shape) => shape?.stencil?.id === "MultiAssignmentTask")
    .map((shape) => shape?.properties?.name);
  assert.deepEqual(materializedTaskNames, ["Department Manager Review", "Finance Review"], "materializer must preserve planned approval task nodes");
  assert.equal(materializedDef.childshapes.some((shape) => shape?.stencil?.id === "ContentList" && shape?.properties?.name === "Create Travel Record"), true, "materializer must preserve planned action nodes");
  cases.push({ case: "pass: App Plan workflow nodes materialize into DefResource graph", status: "pass" });

  expectCode("planned workflow node parity fails when a planned task is missing", mutateResource(materializedDef, (def) => {
    def.childshapes = def.childshapes.filter((shape) => shape?.properties?.name !== "Finance Review");
  }), "APPROVAL_WORKFLOW_PLANNED_NODE_NOT_MATERIALIZED", ["--plan", planPath]);
  cases.push({ case: "fail: missing planned workflow task node", status: "pass" });

  expectPass("package without Approval forms is a no-op pass", ["--package", writeNoApprovalPackage()]);
  cases.push({ case: "pass: package without Approval workflows is not blocked", status: "pass" });

  const validDef = decodeFirstApprovalDef(packagePath);
  expectCode("missing flowPage fails", mutateResource(validDef, (def) => {
    delete def.flowPage;
  }), "APPROVAL_WORKFLOW_FLOWPAGE_MISSING");
  cases.push({ case: "fail: missing flowPage", status: "pass" });

  expectCode("flat variables fail", mutateResource(validDef, (def) => {
    def.variables = [];
  }), "APPROVAL_WORKFLOW_VARIABLES_SHAPE_INVALID");
  cases.push({ case: "fail: flat variables array", status: "pass" });

  expectCode("Start missing submission taskurl aliases fails", mutateResource(validDef, (def) => {
    const start = def.childshapes.find((shape) => shape?.stencil?.id === "StartNoneEvent");
    delete start.properties.taskurl;
    delete start.properties.taskUrl;
    delete start.properties.TaskUrl;
  }), "APPROVAL_WORKFLOW_TASKURL_ALIAS_MISSING");
  cases.push({ case: "fail: StartNoneEvent missing taskurl aliases", status: "pass" });

  expectCode("assignment object fails", mutateResource(validDef, (def) => {
    const task = def.childshapes.find((shape) => shape?.stencil?.id === "MultiAssignmentTask");
    task.properties.usertaskassignment = { method: "expression", value: "{{Applicant.LineManager}}" };
  }), "APPROVAL_WORKFLOW_ASSIGNMENT_SHAPE_INVALID");
  cases.push({ case: "fail: assignment object instead of array", status: "pass" });

  expectCode("legacy outcome condition shape fails", mutateResource(validDef, (def) => {
    const approvedFlow = def.childshapes.find((shape) => shape?.stencil?.id === "SequenceFlow" && /Approved/i.test(JSON.stringify(shape?.properties || {})));
    approvedFlow.properties.conditioninfo = [{ label: "Task outcome:Approved", value: "Approved" }];
  }), "APPROVAL_WORKFLOW_OUTCOME_CONDITION_LEGACY_SHAPE");
  cases.push({ case: "fail: simplified label/value outcome condition", status: "pass" });

  expectCode("outcome condition missing current task reference fails", mutateResource(validDef, (def) => {
    const approvedFlow = def.childshapes.find((shape) => shape?.stencil?.id === "SequenceFlow" && /Approved/i.test(JSON.stringify(shape?.properties || {})));
    approvedFlow.properties.conditioninfo[0].left = approvedFlow.properties.conditioninfo[0].left.replace(/defid&quot;:&quot;[^&]+/, "defid&quot;:&quot;wrong-task-id");
  }), "APPROVAL_WORKFLOW_OUTCOME_CONDITION_INVALID");
  cases.push({ case: "fail: outcome condition does not reference current task id", status: "pass" });

  expectCode("rejected transition to normal end fails", mutateResource(validDef, (def) => {
    const normalEnd = def.childshapes.find((shape) => shape?.stencil?.id === "EndNoneEvent");
    const rejectedFlow = def.childshapes.find((shape) => shape?.stencil?.id === "SequenceFlow" && /Rejected/i.test(JSON.stringify(shape?.properties?.conditioninfo || [])));
    rejectedFlow.target = { id: normalEnd.id, resourceid: normalEnd.resourceid };
  }), "APPROVAL_WORKFLOW_REJECTED_PATH_NOT_END_REJECT");
  cases.push({ case: "fail: rejected transition does not target EndRejectEvent", status: "pass" });

  expectCode("stacked workflow node positions fail", mutateResource(validDef, (def) => {
    const nodes = def.childshapes.filter((shape) => shape?.stencil?.id !== "SequenceFlow");
    nodes[1].position = { ...nodes[0].position };
  }), "APPROVAL_WORKFLOW_NODE_POSITION_COLLISION");
  cases.push({ case: "fail: stacked workflow node coordinates", status: "pass" });

  console.log(JSON.stringify({
    status: "pass",
    test: path.basename(fileURLToPath(import.meta.url)),
    cases,
  }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function materializeApprovalPackage() {
  const spec = path.join(tempDir, "functional-specification.md");
  const plan = path.join(tempDir, "yeeflow-app-plan.md");
  const outDir = path.join(tempDir, "out");
  const idManifest = path.join(tempDir, "api-issued-ids.json");
  fs.writeFileSync(spec, [
    "# Functional Specification: Business Travel Request",
    "",
    "| Application Name | Business Travel Request |",
    "",
    "Business defaults approval status: user-default-approved-for-generation.",
  ].join("\n"));
  fs.writeFileSync(plan, approvalPlanMarkdown());
  fs.writeFileSync(idManifest, JSON.stringify({
    ids: Array.from({ length: 140 }, (_, index) => String(940000000000000001n + BigInt(index))),
  }, null, 2));
  const result = spawnSync(process.execPath, [
    MATERIALIZER,
    "--functional-spec", spec,
    "--app-plan", plan,
    "--out-dir", outDir,
    "--api-id-manifest", idManifest,
    "--tenant-id", "1234567890123456",
    "--json",
  ], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, "pass");
  assert.equal(fs.existsSync(report.outputs.package), true);
  return { packagePath: report.outputs.package, planPath: plan };
}

function approvalPlanMarkdown() {
  return [
    "# Yeeflow App Plan: Business Travel Request",
    "",
    "## Plan Status",
    "",
    "Business defaults approval status: user-default-approved-for-generation.",
    "",
    "## 4. Data Lists and Document Libraries Plan",
    "",
    "### 4.1 Travel Requests",
    "",
    "| Field Name | Type | Purpose |",
    "| --- | --- | --- |",
    "| Destination | Text | Travel destination. |",
    "| Estimated Cost | Decimal | Estimated travel cost. |",
    "",
    "## 5. Approval Forms Plan",
    "",
    "### 5.1 Business Travel Request Approval",
    "",
    "##### Submission Form Fields",
    "",
    "| Field Order | Business Label | Field Name | Exact Yeeflow Variable Type | Exact Yeeflow Control Type | Proof Label |",
    "| --- | --- | --- | --- | --- | --- |",
    "| 1 | Traveler | Traveler | User | identity-picker | Generated-final validation |",
    "| 2 | Destination | Destination | Text | input | Generated-final validation |",
    "| 3 | Business Purpose | BusinessPurpose | Multiple line | textarea | Generated-final validation |",
    "",
    "##### Task Form Fields",
    "",
    "| Field Order | Business Label | Field Name | Exact Yeeflow Variable Type | Exact Yeeflow Control Type | Read Only | Proof Label |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    "| 1 | Traveler | Traveler | User | identity-picker | Yes | Generated-final validation |",
    "| 2 | Destination | Destination | Text | input | Yes | Generated-final validation |",
    "| 3 | Business Purpose | BusinessPurpose | Multiple line | textarea | Yes | Generated-final validation |",
    "",
    "#### Approval Form Layout Template Selection",
    "| Approval Form | Form Page | Page Role | Selected Approval Form Layout Template | Business Sections Needed | Related Data Needed | Selection Reason | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Business Travel Request Approval | Submission form | Submission | approval_form_layout_submission_v1_1 | Request details | Current request only | Submission captures requester-entered approval fields | Generated-final validation |",
    "| Business Travel Request Approval | Review task form | Task | approval_form_layout_task_v1_1 | Readonly request context and action/history section | Workflow context | Task reviewers need consistent context and action area | Generated-final validation |",
    "",
    "#### Approval Form Fields Layout Template Selection",
    "| Approval Form | Form Page | Field Group | Selected Approval Form Fields Layout Template | Field Source | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Business Travel Request Approval | Submission form | Request fields | approval_form_fields_grid_2col_v1_1 | Submission fields | 2 | 2 | 1 | Business Purpose | None | Generated-final validation |",
    "| Business Travel Request Approval | Review task form | Review fields | approval_form_fields_grid_2col_v1_1 | Task fields | 2 | 2 | 1 | Business Purpose | None | Generated-final validation |",
    "",
    "#### Approval Workflow Nodes",
    "",
    "| Step | Node Name | Node Type | Description | Assignee/Role | Assignment Strategy | Outcomes | Condition/Branch | Data Read/Write | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    "| 1 | Start | StartNoneEvent | Request submission starts the process. | Requester | Submission | Submitted | Always | Read submission fields | Generated-final validation |",
    "| 2 | Department Manager Review | MultiAssignmentTask | Manager reviews business purpose. | Department Manager | Role based | Approved; Rejected | Always | Read submitted request fields | Generated-final validation |",
    "| 3 | Finance Review | MultiAssignmentTask | Finance reviews estimated cost. | Finance | Role based | Approved; Rejected | Always | Read submitted request fields | Generated-final validation |",
    "| 4 | Create Travel Record | ContentList | Persist accepted travel request. | System | System action | Complete | Approved path only | Create related list record | Generated-final validation |",
    "| 5 | End | EndNoneEvent | Approved process ends. | System | End | Complete | Approved path | No data write | Generated-final validation |",
    "",
    "## 6. Form Reports Plan",
    "",
    "| Form Report Name | Related Approval Form | Purpose |",
    "| --- | --- | --- |",
    "| Business Travel Request Report | Business Travel Request Approval | Approval reporting. |",
  ].join("\n");
}

function writeNoApprovalPackage() {
  const decoded = {
    ListSet: { ListID: "940000000000000001", ListSetID: "940000000000000001", Title: "Data Only App", Type: 103 },
    Childs: [],
    Forms: [],
    Pages: [],
  };
  const wrapper = {
    Name: "Data Only App",
    ListID: "940000000000000001",
    TenantID: "1234567890123456",
    PortalInfo: null,
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64"),
  };
  const file = path.join(tempDir, "no-approval-package.yapk");
  fs.writeFileSync(file, `${JSON.stringify(wrapper, null, 2)}\n`);
  return file;
}

function decodeFirstApprovalDef(packagePath) {
  const { decoded } = readDecodedYapk(packagePath);
  const form = decoded.Forms[0];
  const bytes = Buffer.from(form.DefResource, "base64");
  const prefix = Buffer.from("::brotli::", "utf8");
  const payload = bytes.subarray(0, prefix.length).equals(prefix) ? bytes.subarray(prefix.length) : bytes;
  return JSON.parse(zlib.brotliDecompressSync(payload).toString("utf8"));
}

function mutateResource(baseDef, mutate) {
  const def = structuredClone(baseDef);
  mutate(def);
  const file = path.join(tempDir, `resource-${Math.random().toString(16).slice(2)}.json`);
  fs.writeFileSync(file, `${JSON.stringify(def, null, 2)}\n`);
  return file;
}

function expectPass(label, args) {
  const result = runValidator(args);
  assert.equal(result.status, 0, `${label}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

function expectCode(label, resourcePath, code, extraArgs = []) {
  const result = runValidator(["--resource", resourcePath, ...extraArgs]);
  assert.notEqual(result.status, 0, `${label} should fail`);
  assert.match(`${result.stdout}\n${result.stderr}`, new RegExp(code), label);
}

function runValidator(args) {
  return spawnSync(process.execPath, [VALIDATOR, ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

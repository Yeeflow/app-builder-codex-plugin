#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildApprovalFormLayoutDef } from "./lib/approval-form-layout-builder.mjs";
import { validateApprovalFormLayoutTemplate } from "./validate-approval-form-layout-template.mjs";

const require = createRequire(import.meta.url);
const { validateDecodedDef } = require("../validate-ywf-def.js");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const IDS = {
  requestPage: "11111111-1111-4111-8111-111111111111",
  taskPage: "22222222-2222-4222-8222-222222222222",
  start: "33333333-3333-4333-8333-333333333333",
  task: "44444444-4444-4444-8444-444444444444",
  approved: "55555555-5555-4555-8555-555555555555",
  rejected: "66666666-6666-4666-8666-666666666666",
  end: "77777777-7777-4777-8777-777777777777",
  endReject: "88888888-8888-4888-8888-888888888888",
};

const cases = [];

expectPass("valid export-shaped approval form workflow");
expectStandaloneYwfApprovalLayoutPass();
expectCode("object binding fails", (def) => {
  firstValueControl(def).binding = { value: "RequestTitle" };
}, "CONTROL_BINDING_NOT_STRING");
expectCode("legacy date control fails", (def) => {
  firstValueControl(def).type = "date";
}, "DATE_CONTROL_TYPE_LEGACY");
expectCode("numeric string width fails", (def) => {
  firstValueControl(def).attrs.common.positioning.width = [null, "960"];
}, "CONTROL_WIDTH_STRING_INVALID");
expectCode("missing Form body fails", (def) => {
  def.pageurls[0].formdef.children[0].children[0].children = def.pageurls[0].formdef.children[0].children[0].children.filter((child) => child.label !== "Form body");
}, "UI_STANDARD_FORM_BODY_MISSING");
expectCode("label-only task outcome condition fails", (def) => {
  const flow = def.childshapes.find((shape) => shape.id === IDS.approved);
  flow.properties.conditioninfo = [{ label: "Approved" }];
}, "APPROVAL_CONDITION_SHAPE_INCOMPLETE");
expectCode("simple Outcome token task outcome condition fails", (def) => {
  const flow = def.childshapes.find((shape) => shape.id === IDS.approved);
  flow.properties.conditioninfo = simpleOutcomeCondition("Approved");
}, "APPROVAL_CONDITION_LEFT_TASK_REF_INVALID");

console.log(JSON.stringify({
  status: "pass",
  test: "test-approval-ywf-form-structure-gates",
  cases,
}, null, 2));

function expectPass(label) {
  const report = validateDecodedDef(validDef(), { mode: "final" });
  assert.equal(report.status, "pass", `${label}\n${JSON.stringify(report, null, 2)}`);
  cases.push({ case: `pass: ${label}`, status: "pass" });
}

function expectStandaloneYwfApprovalLayoutPass() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "standalone-ywf-approval-layout-"));
  const fields = [
    { displayName: "Request Title", fieldName: "RequestTitle", fieldType: "Text", controlType: "input" },
    { displayName: "Estimated Amount", fieldName: "EstimatedAmount", fieldType: "Decimal", controlType: "currency" },
    { displayName: "Business Justification", fieldName: "BusinessJustification", fieldType: "Text", controlType: "textarea" },
  ];
  const casesToValidate = [
    {
      file: path.join(tmpDir, "submission.formdef.json"),
      template: "approval_form_layout_submission_v1_1",
      pageRole: "submission",
      resource: buildApprovalFormLayoutDef({
        rootDir: ROOT,
        id: IDS.requestPage,
        title: "Standalone Approval Layout Proof",
        role: "submission",
        fields,
      }),
    },
    {
      file: path.join(tmpDir, "task.formdef.json"),
      template: "approval_form_layout_task_v1_1",
      pageRole: "task",
      resource: buildApprovalFormLayoutDef({
        rootDir: ROOT,
        id: IDS.taskPage,
        title: "Standalone Approval Layout Proof",
        role: "task",
        fields,
      }),
    },
  ];
  for (const item of casesToValidate) {
    fs.writeFileSync(item.file, JSON.stringify(item.resource, null, 2));
    const report = validateApprovalFormLayoutTemplate({
      resource: item.file,
      template: item.template,
      pageRole: item.pageRole,
    });
    assert.equal(report.status, "pass", `standalone .ywf ${item.pageRole} should use ${item.template}\n${JSON.stringify(report, null, 2)}`);
  }
  cases.push({ case: "pass: standalone .ywf approval pages use Approval Form Layouts v1.1", status: "pass" });
}

function expectCode(label, mutate, expectedCode) {
  const def = validDef();
  mutate(def);
  const report = validateDecodedDef(def, { mode: "final" });
  assert.equal(report.status, "fail", `${label} should fail\n${JSON.stringify(report, null, 2)}`);
  assert.ok(report.errors.some((error) => error.code === expectedCode), `${label} expected ${expectedCode}\n${JSON.stringify(report, null, 2)}`);
  cases.push({ case: `fail: ${label}`, status: "pass", code: expectedCode });
}

function validDef() {
  const start = node(IDS.start, "StartNoneEvent", "Start", 100, 220, {
    taskurl: IDS.requestPage,
    taskUrl: IDS.requestPage,
    TaskUrl: IDS.requestPage,
  });
  const task = node(IDS.task, "MultiAssignmentTask", "Manager approval", 420, 220, {
    pagetype: 1,
    approveway: "anyapprove",
    approvepercentage: 100,
    usertaskassignment: [applicantLineManager()],
    taskurl: IDS.taskPage,
    taskUrl: IDS.taskPage,
    TaskUrl: IDS.taskPage,
  });
  const end = node(IDS.end, "EndNoneEvent", "End", 760, 160);
  const endReject = node(IDS.endReject, "EndRejectEvent", "End with rejection", 760, 320);
  const approved = sequence(IDS.approved, task, end, "Approved", outcomeCondition(task, "Approved"));
  const rejected = sequence(IDS.rejected, task, endReject, "Rejected", outcomeCondition(task, "Rejected"));
  const submit = sequence("99999999-9999-4999-8999-999999999999", start, task, "Submit", []);

  return {
    defkey: "EmployeeEquipmentPurchaseApproval",
    lineType: "rounded",
    graphver: 2,
    graphzoom: 1,
    graphposition: { x: 0, y: 0, width: 1100, height: 700 },
    flowPage: [],
    variables: {
      basic: [{ id: "RequestTitle", name: "Request Title", type: "text" }],
      listref: [],
      filter: [],
    },
    pageurls: [
      page(IDS.requestPage, "request", 1),
      page(IDS.taskPage, "task", 2),
    ],
    childshapes: [start, submit, task, approved, rejected, end, endReject],
  };
}

function page(id, key, type) {
  return {
    id,
    key,
    pageUrl: key,
    pageurl: key,
    PageUrl: key,
    type,
    pagetype: type === 2 ? 1 : 1,
    name: `${key} page`,
    formdef: formdef(`${key} page`, type),
  };
}

function formdef(title, pagetype) {
  return {
    title,
    name: title,
    pagetype,
    ver: 2,
    attrs: {
      background: { normal: { color: "var(--c--neutral-light)" } },
      container: {
        cw: "2",
        padding: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }],
      },
    },
    actions: [],
    formAction: {},
    exts: [],
    children: [
      container("Main", [
        container("Content", [
          container("Form body", [
            {
              id: uuidFromLabel(`${title} request title`),
              type: "input",
              label: "Request Title",
              binding: "RequestTitle",
              attrs: {
                common: { positioning: { widthtype: [null, "3"], width: [null, 960], widthu: [null, "px"] } },
              },
              children: [],
            },
          ]),
          container("Form bottom", [
            { id: uuidFromLabel(`${title} workflow panel`), type: "workflowControlPanel", label: "Action Panel", attrs: {}, children: [] },
            { id: uuidFromLabel(`${title} workflow history`), type: "workflowHistory", label: "Flow History", attrs: {}, children: [] },
          ]),
        ]),
      ]),
    ],
  };
}

function container(label, children) {
  return {
    id: uuidFromLabel(label + Math.random().toString(16).slice(2)),
    type: "container",
    label,
    nv_label: label,
    attrs: {},
    children,
  };
}

function node(id, stencil, name, x, y, properties = {}) {
  return {
    id,
    resourceid: id,
    stencil: { id: stencil },
    position: { x, y },
    incoming: [],
    outgoing: [],
    properties: { name, ...properties },
  };
}

function sequence(id, source, target, name, conditioninfo) {
  const flow = {
    id,
    resourceid: id,
    stencil: { id: "SequenceFlow" },
    source: { id: source.id, resourceid: source.id },
    target: { id: target.id, resourceid: target.id },
    incoming: [{ id: source.id, resourceid: source.id }],
    outgoing: [{ id: target.id, resourceid: target.id }],
    dockers: [],
    properties: { name, linetype: "rounded", documentation: "", conditioninfo },
  };
  source.outgoing.push({ id, resourceid: id });
  target.incoming.push({ id, resourceid: id });
  return flow;
}

function outcomeCondition(task, outcome) {
  return [{
    key: uuidFromLabel(`condition ${outcome}`),
    pre: "and",
    left: expressionButton({
      type: "task",
      param: { defid: task.id },
      prop: "Outcome",
    }, `${task.properties.name}:Outcome`),
    op: "s.=",
    right: `<input type="button" data="${outcome}" expr="__" tabindex="-1" value="Task outcome:${outcome}">`,
  }];
}

function simpleOutcomeCondition(outcome) {
  return [{
    key: uuidFromLabel(`simple condition ${outcome}`),
    pre: "and",
    left: {
      type: 1,
      value: {
        exprType: "variable",
        valueType: "text",
        id: "Outcome",
        type: "expr",
        name: "Task outcome:Outcome",
      },
    },
    op: "s.=",
    right: {
      type: 0,
      value: `Task outcome:${outcome}`,
    },
  }];
}

function applicantLineManager() {
  return {
    type: "user",
    method: "expression",
    title: "User: Applicant:Line Manager",
    value: expressionButton({
      type: "user",
      param: { id: JSON.stringify({ type: "application", prop: "ApplicantUserID" }) },
      prop: "LineManager",
    }, "Applicant:Line Manager"),
  };
}

function expressionButton(data, label) {
  const escapedData = JSON.stringify(data).replace(/"/g, "&quot;");
  return `<input type="button" data="\${${escapedData}}" expr="__" tabindex="-1" value="${label}">`;
}

function firstValueControl(def) {
  return def.pageurls[0].formdef.children[0].children[0].children[0].children[0];
}

function uuidFromLabel(label) {
  let hash = 0;
  for (const ch of String(label)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `${hex(hash, 8)}-${hex(hash + 1, 4)}-4${hex(hash + 2, 3)}-8${hex(hash + 3, 3)}-${hex(hash + 4, 12)}`;
}

function hex(value, length) {
  return (Number(value) >>> 0).toString(16).padStart(length, "0").slice(0, length);
}

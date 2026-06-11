#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const source = require("../validate-ywf-def.js");
const dist = require("../dist/yeeflow-app-builder-plugin/scripts/validate-ywf-def.js");

const REQUEST_PAGE_ID = "11111111-1111-4111-8111-111111111111";
const TASK_PAGE_ID = "22222222-2222-4222-8222-222222222222";

function control(type, id) {
  return { id, type, nv_label: id, attrs: {}, children: [] };
}

function page({ id, type, pagetype, formdefPagetype, name }) {
  return {
    id,
    type,
    pagetype,
    name,
    title: name,
    formdef: {
      id,
      title: name,
      pagetype: formdefPagetype,
      ver: 2,
      exts: [],
      children: [control("workflowControlPanel", `${id}-panel`), control("workflowHistory", `${id}-history`)],
    },
  };
}

function taskNode(taskurl = TASK_PAGE_ID) {
  return {
    resourceid: "task-1",
    stencil: { id: "MultiAssignmentTask" },
    properties: {
      name: "Review",
      pagetype: 1,
      taskurl,
      taskUrl: taskurl,
      TaskUrl: taskurl,
      approveway: "anyone",
      approvepercentage: 100,
      usertaskassignment: [],
    },
    incoming: [],
    outgoing: [],
  };
}

function baseDef(overrides = {}) {
  const taskPage = page({
    id: TASK_PAGE_ID,
    type: 2,
    pagetype: 1,
    formdefPagetype: 2,
    name: "Review Request",
  });
  const requestPage = page({
    id: REQUEST_PAGE_ID,
    type: 1,
    pagetype: 1,
    formdefPagetype: 1,
    name: "Submit Request",
  });
  return {
    defkey: "WorkflowTaskUrlHardGate",
    variables: { basic: [], listref: [], tempVars: [] },
    pageurls: [requestPage, taskPage],
    childshapes: [
      {
        resourceid: "start-1",
        stencil: { id: "StartNoneEvent" },
        properties: {
          name: "Start",
          taskurl: REQUEST_PAGE_ID,
          taskUrl: REQUEST_PAGE_ID,
          TaskUrl: REQUEST_PAGE_ID,
        },
        incoming: [],
        outgoing: [],
      },
      taskNode(overrides.taskurl || TASK_PAGE_ID),
    ],
    graphposition: { x: 0, y: 0, width: 800, height: 600 },
    graphzoom: 1,
    ...overrides.root,
  };
}

function codes(report) {
  return new Set(report.errors.map((entry) => entry.code));
}

function runCase(label, mutate, expectedCode) {
  for (const [validatorName, validator] of [["source", source], ["dist", dist]]) {
    const def = baseDef();
    mutate(def);
    const report = validator.validateDecodedDef(def, { mode: "draft" });
    const errorCodes = codes(report);
    assert(errorCodes.has(expectedCode), `${validatorName} ${label} should emit ${expectedCode}; got ${[...errorCodes].join(", ")}`);
  }
}

runCase(
  "rejects outer task page pagetype 2",
  (def) => {
    def.pageurls[1].pagetype = 2;
  },
  "WORKFLOW_TASK_PAGEURL_PAGETYPE_INVALID"
);

runCase(
  "rejects embedded task formdef pagetype 1",
  (def) => {
    def.pageurls[1].formdef.pagetype = 1;
  },
  "WORKFLOW_TASK_FORMDEF_PAGETYPE_INVALID"
);

runCase(
  "rejects missing taskurl page",
  (def) => {
    const missing = "33333333-3333-4333-8333-333333333333";
    Object.assign(def.childshapes[1].properties, { taskurl: missing, taskUrl: missing, TaskUrl: missing });
  },
  "WORKFLOW_TASKURL_PAGE_NOT_FOUND"
);

runCase(
  "rejects taskurl page type other than 2",
  (def) => {
    def.pageurls[1].type = 1;
    def.pageurls[1].formdef.pagetype = 1;
  },
  "WORKFLOW_TASKURL_PAGE_TYPE_INVALID"
);

for (const [validatorName, validator] of [["source", source], ["dist", dist]]) {
  const report = validator.validateDecodedDef(baseDef(), { mode: "draft" });
  const errorCodes = codes(report);
  for (const code of [
    "WORKFLOW_TASK_PAGEURL_PAGETYPE_INVALID",
    "WORKFLOW_TASK_FORMDEF_PAGETYPE_INVALID",
    "WORKFLOW_TASKURL_PAGE_NOT_FOUND",
    "WORKFLOW_TASKURL_PAGE_TYPE_INVALID",
  ]) {
    assert(!errorCodes.has(code), `${validatorName} valid fixture should not emit ${code}`);
  }
}

console.log(JSON.stringify({ status: "pass", validators: ["source", "dist"] }, null, 2));

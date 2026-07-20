#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  normKey,
  validatePlanWorkflowNodeParity,
} from "./validate-approval-workflow-publish-readiness.mjs";

const managerName = "\u76f4\u5c5e\u7ecf\u7406\u5ba1\u6279";
const persistName = "\u5199\u5165\u6279\u51c6\u4f7f\u7528\u91cf";

assert.equal(
  normKey("Department Manager Review"),
  "department manager review",
  "ASCII node-name normalization must remain backward compatible",
);
assert.notEqual(
  normKey(managerName),
  normKey(persistName),
  "different Unicode node names must not canonicalize to the same key",
);

const plannedWorkflowNodes = [
  { nodeName: managerName, nodeType: "MultiAssignmentTask" },
  { nodeName: persistName, nodeType: "ContentList" },
];

const passingContext = createContext(plannedWorkflowNodes);
validatePlanWorkflowNodeParity(createDef("MultiAssignmentTask"), passingContext);
assert.deepEqual(passingContext.findings, [], "distinct Unicode task and action nodes must preserve exact type parity");

const mismatchContext = createContext(plannedWorkflowNodes);
validatePlanWorkflowNodeParity(createDef("ContentList"), mismatchContext);
assert.deepEqual(
  mismatchContext.findings.map((finding) => finding.code),
  ["APPROVAL_WORKFLOW_PLANNED_TASK_COUNT_MISMATCH", "APPROVAL_WORKFLOW_PLANNED_NODE_TYPE_MISMATCH"],
  "a real Unicode manager-node type replacement must still report the exact mismatch",
);
const mismatch = mismatchContext.findings.find((finding) => finding.code === "APPROVAL_WORKFLOW_PLANNED_NODE_TYPE_MISMATCH");
assert.equal(mismatch.plannedNodeName, managerName);
assert.equal(mismatch.plannedNodeType, "MultiAssignmentTask");
assert.equal(mismatch.actualNodeType, "ContentList");

console.log("APPROVAL_WORKFLOW_UNICODE_NODE_NAME_REGRESSIONS_PASSED cases=4");

function createContext(nodes) {
  return {
    findings: [],
    source: "focused-unicode-node-name-regression",
    formName: "Leave Request Approval",
    plannedWorkflowNodes: nodes,
  };
}

function createDef(managerStencil) {
  return {
    childshapes: [
      {
        resourceid: "manager-node",
        stencil: { id: managerStencil },
        properties: { name: managerName },
      },
      {
        resourceid: "persist-node",
        stencil: { id: "ContentList" },
        properties: { name: persistName },
      },
    ],
  };
}

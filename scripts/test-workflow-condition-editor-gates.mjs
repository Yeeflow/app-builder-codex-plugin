#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  workflowConditionEditorGroupForType,
  validateWorkflowConditionEditorRows,
} = require("./lib/workflow-condition-editor-utils.cjs");

const variables = new Map([
  ["Name", { id: "Name", type: "text" }],
  ["Amount", { id: "Amount", type: "number" }],
  ["SensitiveData", { id: "SensitiveData", type: "boolean" }],
  ["CategoryofProducti", { id: "CategoryofProducti", type: "metadata" }],
  ["ProjectManager", { id: "ProjectManager", type: "user" }],
  ["ProjectCostCenter", { id: "ProjectCostCenter", type: "costcenter" }],
  ["ProjectDepartment", { id: "ProjectDepartment", type: "groupselect" }],
  ["SelectProject", { id: "SelectProject", type: "lookup" }],
  ["ProjectLocation", { id: "ProjectLocation", type: "location" }],
  ["ProjectDocument", { id: "ProjectDocument", type: "file" }],
  ["ProjectImages", { id: "ProjectImages", type: "img" }],
  ["MultipleCategories", { id: "MultipleCategories", type: "mutiple-metadata" }],
  ["ESignature", { id: "ESignature", type: "signature" }],
  ["EquipmentType", { id: "EquipmentType", type: "dict" }],
  ["DueDate", { id: "DueDate", type: "datetime" }],
  ["EffectiveDate", { id: "EffectiveDate", type: "date" }],
]);

function left(id, valueType = variables.get(id).type) {
  return {
    type: 1,
    value: {
      exprType: "variable",
      valueType,
      id,
      type: "expr",
    },
  };
}

function condition(id, op, group, right, pre = "and") {
  const row = { key: `${id}-${op}`, pre, left: left(id), op, group };
  if (right !== undefined) row.right = right;
  return row;
}

function conditionGroup(children, pre = "and") {
  return {
    key: `group-${pre}-${children.length}`,
    pre,
    left: null,
    op: "isNull",
    right: null,
    conditions: children,
  };
}

function expr(value) {
  return { type: 2, value };
}

function issues(rows) {
  return validateWorkflowConditionEditorRows({
    conditions: rows,
    variablesById: variables,
    path: "$.childshapes[0].properties.conditioninfo",
    node: "Submitted",
  });
}

function expectCodes(rows, expectedCodes) {
  const actual = issues(rows).map((entry) => entry.code).sort();
  assert.deepEqual(actual, [...expectedCodes].sort());
}

assert.equal(workflowConditionEditorGroupForType("user"), "string");
assert.equal(workflowConditionEditorGroupForType("groupselect"), "string");
assert.equal(workflowConditionEditorGroupForType("lookup"), "string");
assert.equal(workflowConditionEditorGroupForType("file"), "general");
assert.equal(workflowConditionEditorGroupForType("number"), "number");
assert.equal(workflowConditionEditorGroupForType("boolean"), "boolean");
assert.equal(workflowConditionEditorGroupForType("datetime"), "datetime");

expectCodes([
  condition("Name", "s.=", "string", { type: 0, value: "ABC" }),
  condition("Amount", "n.>=", "number", { type: 0, value: 100 }),
  condition("SensitiveData", "b.=", "boolean", { type: 0, value: "true" }),
  condition("CategoryofProducti", "s.=", "string", { type: 0, value: "2058776862736003073" }),
  condition("ProjectManager", "s.=", "string", { type: 0, value: "2054071950001324033" }),
  condition("ProjectCostCenter", "isNotNull", "string"),
  condition("ProjectDepartment", "s.=", "string", { type: 0, value: "2058056028341944321" }),
  condition("SelectProject", "s.=", "string", { type: 0, value: "2073780324607475712" }),
  condition("ProjectLocation", "s.=", "string", { type: 0, value: "2058055812112986112" }),
  condition("ProjectDocument", "isNotNull", "general"),
  condition("ProjectImages", "isNull", "general"),
  condition("MultipleCategories", "s.=", "string", { type: 0, value: ["2058776821229170688"] }),
  condition("ESignature", "isNotNull", "general"),
  condition("EquipmentType", "isNotNull", "string"),
  condition("DueDate", "dt.>=", "datetime", { type: 0, value: "2026-07-07" }),
  condition("EffectiveDate", "dt.=", "datetime", { type: 0, value: "2026-07-07 04:45:58" }),
  condition("EffectiveDate", "dt.!=", "datetime", { type: 0, value: "2026-07-08 04:46:21" }),
  condition("EffectiveDate", "dt.>=", "datetime", { type: 0, value: "2026-01-01 04:46:38" }),
  condition("EffectiveDate", "dt.<=", "datetime", { type: 0, value: "2026-12-31 04:47:13" }),
  condition("EffectiveDate", "dt.>", "datetime", { type: 0, value: "2026-03-16 04:47:41" }),
  condition("EffectiveDate", "dt.<", "datetime", { type: 0, value: "2026-07-15 04:48:02" }),
  condition("EffectiveDate", "isNull", "datetime"),
  condition("EffectiveDate", "isNotNull", "datetime"),
], []);

expectCodes([
  condition("Name", "s.=", "string", expr([
    { type: "str", value: "ABC" },
    { type: "op", op: "&" },
    { type: "str", value: "D" },
  ])),
  condition("Amount", "n.>=", "number", expr([
    { type: "num", value: "1204" },
    { type: "op", op: "+" },
    { type: "num", value: "3" },
  ])),
  condition("SensitiveData", "b.=", "boolean", expr([
    {
      type: "func",
      func: "iif",
      params: [
        [
          { exprType: "variable", valueType: "dict", id: "EquipmentType", type: "expr", name: "Workflow Variables:Equipment Type" },
          { type: "op", op: "==" },
          { type: "str", value: "abc" },
        ],
        [{ type: "bool", value: true }],
        [{ type: "bool", value: false }],
      ],
    },
  ])),
  condition("ProjectManager", "s.=", "string", expr([
    { type: "func", func: "currentUser", params: [] },
  ])),
  condition("ProjectDepartment", "s.=", "string", expr([
    {
      type: "func",
      func: "getUserAttr",
      params: [
        [{ id: "ApplicantID", exprType: "application", valueType: "string", type: "expr", name: "Instance:Applicant" }],
        { key: "DepartmentID", label: "DepartmentID" },
        [],
      ],
      name: "Instance:Applicant:Department",
    },
  ])),
  condition("ProjectLocation", "s.=", "string", expr([
    {
      type: "func",
      func: "getUserAttr",
      params: [
        [{ id: "ApplicantID", exprType: "application", valueType: "string", type: "expr", name: "Instance:Applicant" }],
        { key: "LocationID", label: "LocationID" },
        [],
      ],
      name: "Instance:Applicant:Location",
    },
  ])),
  condition("EquipmentType", "s.=", "string", expr([
    { exprType: "variable", valueType: "lookup", id: "SelectProject", type: "expr", name: "Workflow Variables:Select Project" },
  ])),
  condition("EffectiveDate", "dt.>=", "datetime", expr([
    {
      type: "func",
      func: "dateAdd",
      params: [
        [{ type: "func", func: "now", params: [] }],
        "month",
        [{ type: "num", value: "1" }],
      ],
    },
  ])),
], []);

expectCodes([
  condition("EquipmentType", "s.=", "string", { type: 0, value: "ABC" }),
  condition("Amount", "n.>", "number", { type: 0, value: 200 }),
  condition("Amount", "n.<=", "number", { type: 0, value: 600 }),
  conditionGroup([
    condition("EffectiveDate", "dt.>=", "datetime", { type: 0, value: "2026-07-07 05:21:53" }),
    condition("EffectiveDate", "dt.<", "datetime", { type: 0, value: "2026-05-13 05:22:30" }),
  ], "and"),
  conditionGroup([
    condition("Name", "s.=", "string", { type: 0, value: "Food" }, "or"),
    condition("Name", "s.=", "string", { type: 0, value: "Drink" }, "or"),
  ], "and"),
  condition("SensitiveData", "b.=", "boolean", { type: 0, value: "true" }),
], []);

expectCodes([
  {
    key: "missing-variable",
    pre: "and",
    left: { type: 1, value: { exprType: "variable", valueType: "text", id: "MissingVariable", type: "expr" } },
    op: "s.=",
    right: { type: 0, value: "ABC" },
    group: "string",
  },
], ["WORKFLOW_CONDITION_LEFT_VARIABLE_UNRESOLVED"]);

expectCodes([
  condition("ProjectManager", "s.=", "general", { type: 0, value: "2054071950001324033" }),
], ["WORKFLOW_CONDITION_GROUP_MISMATCH"]);

expectCodes([
  condition("Amount", "s.=", "number", { type: 0, value: 100 }),
], ["WORKFLOW_CONDITION_OP_GROUP_MISMATCH"]);

expectCodes([
  condition("Amount", "n.>=", "number", { type: 0, value: "not-a-number" }),
], ["WORKFLOW_CONDITION_RIGHT_LITERAL_TYPE_MISMATCH"]);

expectCodes([
  condition("Name", "s.=", "string", "ABC"),
], ["WORKFLOW_CONDITION_RIGHT_VALUE_REQUIRED"]);

expectCodes([
  condition("Name", "s.=", "string", { type: 2, value: [] }),
], ["WORKFLOW_CONDITION_RIGHT_EXPRESSION_VALUE_INVALID"]);

expectCodes([
  conditionGroup([]),
], ["WORKFLOW_CONDITION_GROUP_CHILDREN_REQUIRED"]);

expectCodes([
  conditionGroup([
    conditionGroup([
      condition("Name", "s.=", "string", { type: 0, value: "Food" }),
    ]),
  ]),
], ["WORKFLOW_CONDITION_GROUP_NESTING_TOO_DEEP"]);

expectCodes([
  {
    key: "bad-group-wrapper",
    pre: "and",
    left: left("Name"),
    op: "s.=",
    right: { type: 0, value: "Food" },
    conditions: [
      condition("Name", "s.=", "string", { type: 0, value: "Drink" }),
    ],
  },
], ["WORKFLOW_CONDITION_GROUP_WRAPPER_INVALID"]);

expectCodes([
  condition("ProjectDocument", "isNotNull", "general", { type: 0, value: "unexpected" }),
], ["WORKFLOW_CONDITION_RIGHT_NULL_REQUIRED"]);

expectCodes([
  condition("Name", "s.=", "string", { type: 0, value: "ABC" }, "xor"),
], ["WORKFLOW_CONDITION_PRE_INVALID"]);

console.log(JSON.stringify({
  status: "pass",
  cases: 16,
  message: "Workflow condition editor variable condition gates passed",
}, null, 2));

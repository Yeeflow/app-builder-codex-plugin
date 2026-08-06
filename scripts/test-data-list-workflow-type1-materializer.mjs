#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  buildDataListWorkflowType1DefResource,
  buildLinearDataListWorkflowShapes,
  materializeDataListWorkflowType1,
  validateDataListWorkflowType1,
} from "./lib/data-list-workflow-type1-materializer.mjs";

const IDs = {
  listSetId: "1000000000000000001",
  listId: "1000000000000000002",
  defResourceId: "11111111-1111-4111-8111-111111111111",
  flowMappingId: "1000000000000000003",
};

function fixture() {
  const variables = {
    basic: [{ idx: "actual-hours-variable", id: "ActualHours", name: "Actual hours", type: "number", editable: false }],
    listref: [],
    filter: [],
  };
  const conditions = [{
    key: "actual-hours-over-10",
    pre: "and",
    left: {
      type: 1,
      value: { exprType: "variable", valueType: "number", id: "ActualHours", type: "expr", name: "Workflow Variables:Actual hours" },
    },
    group: "number",
    op: "n.>",
    right: { type: 0, value: 10 },
  }];
  const childshapes = buildLinearDataListWorkflowShapes({
    seed: "employee-training-record-created-over-10-hours",
    ids: {
      start: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      end: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      flows: ["cccccccc-cccc-4ccc-8ccc-cccccccccccc", "dddddddd-dddd-4ddd-8ddd-dddddddddddd"],
    },
    entryConditions: conditions,
    actions: [{
      type: "MailTask",
      name: "Notify employee",
      properties: {
        to: "employee@example.invalid",
        cc: "",
        subject: "Training record created with Actual hours greater than 10",
        html: "<p>A new training record with Actual hours greater than 10 has been created.</p>",
      },
    }],
  });
  const defResource = buildDataListWorkflowType1DefResource({
    name: "Notify employee when actual hours exceed 10",
    key: "EMPLOYEE_TRAINING_ACTUAL_HOURS_OVER_10",
    defResourceId: IDs.defResourceId,
    listSetId: IDs.listSetId,
    listId: IDs.listId,
    variables,
    childshapes,
  });
  return materializeDataListWorkflowType1({
    name: defResource.name,
    key: defResource.key,
    description: "Notify the Employee user when a new training record has Actual hours greater than 10.",
    listId: IDs.listId,
    procModelId: "1000000000000000004",
    defResourceId: IDs.defResourceId,
    flowMappingId: IDs.flowMappingId,
    triggerFieldName: "",
    triggerSettings: { NewTrigger: true },
    defResource,
  });
}

const materialized = fixture();
assert.equal(materialized.validation.ok, true);
assert.equal(materialized.workflow.WorkflowType, 1);
assert.equal(materialized.workflow.ProcModelID, "1000000000000000004");
assert.equal(materialized.workflow.Settings, "");
assert.equal(materialized.flowMapping.DefKey, materialized.workflow.Key);
assert.deepEqual(JSON.parse(materialized.flowMapping.Setting), { NewTrigger: true });

const def = materialized.defResource;
const mail = def.childshapes.find((shape) => shape.stencil.id === "MailTask");
const conditionalFlow = def.childshapes.find((shape) => shape.stencil.id === "SequenceFlow" && shape.properties.conditioninfo.length);
assert.ok(mail);
assert.ok(conditionalFlow);
assert.equal(def.childshapes.find((shape) => shape.stencil.id === "StartNoneEvent").id, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
assert.equal(def.childshapes.find((shape) => shape.stencil.id === "EndNoneEvent").id, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
assert.equal(conditionalFlow.properties.conditioninfo[0].op, "n.>");
assert.equal(conditionalFlow.properties.conditioninfo[0].right.value, 10);

function findingCodes(candidate) {
  return validateDataListWorkflowType1(candidate).findings.map((finding) => finding.code);
}

const invalidMailDef = structuredClone(def);
invalidMailDef.childshapes.find((shape) => shape.stencil.id === "MailTask").properties.to = "";
assert.ok(findingCodes({ workflow: materialized.workflow, flowMapping: materialized.flowMapping, defResource: invalidMailDef }).includes("DATA_LIST_WORKFLOW_MAIL_PROPERTY_REQUIRED"));

const invalidConditionDef = structuredClone(def);
invalidConditionDef.childshapes.find((shape) => shape.stencil.id === "SequenceFlow" && shape.properties.conditioninfo.length).properties.conditioninfo[0].op = "s.>";
assert.ok(findingCodes({ workflow: materialized.workflow, flowMapping: materialized.flowMapping, defResource: invalidConditionDef }).includes("WORKFLOW_CONDITION_OP_GROUP_MISMATCH"));

const invalidDesignerConditionDef = structuredClone(def);
invalidDesignerConditionDef.childshapes.find((shape) => shape.stencil.id === "SequenceFlow" && shape.properties.conditioninfo.length).properties.conditioninfo = [{
  key: "designer-condition",
  pre: "and",
  left: "<input type=\"button\" data=\"${&quot;type&quot;:&quot;listitem&quot;,&quot;prop&quot;:&quot;Decimal10&quot;}\" expr=\"__\" value=\"Actual hours\">",
  op: "s.=",
  right: "10",
  group: "number",
}];
assert.ok(findingCodes({ workflow: materialized.workflow, flowMapping: materialized.flowMapping, defResource: invalidDesignerConditionDef }).includes("DATA_LIST_WORKFLOW_CONDITION_OPERATOR_INVALID"));

const invalidEdgeDef = structuredClone(def);
invalidEdgeDef.childshapes.find((shape) => shape.stencil.id === "SequenceFlow").target = { id: "missing", resourceid: "missing" };
assert.ok(findingCodes({ workflow: materialized.workflow, flowMapping: materialized.flowMapping, defResource: invalidEdgeDef }).includes("DATA_LIST_WORKFLOW_EDGE_ENDPOINT_UNRESOLVED"));

const invalidMapping = { ...materialized.flowMapping, Setting: JSON.stringify({ NewTrigger: false }) };
assert.ok(findingCodes({ workflow: materialized.workflow, flowMapping: invalidMapping, defResource: def }).includes("DATA_LIST_WORKFLOW_NEW_TRIGGER_REQUIRED"));

assert.throws(() => materializeDataListWorkflowType1({
  name: def.name,
  key: def.key,
  listId: IDs.listId,
  defResourceId: IDs.defResourceId,
  flowMappingId: IDs.flowMappingId,
  triggerSettings: { NewTrigger: false },
  defResource: def,
}), (error) => error.code === "DATA_LIST_WORKFLOW_TYPE1_VALIDATION_FAILED");

console.log("DATA_LIST_WORKFLOW_TYPE1_MATERIALIZER_PASSED");

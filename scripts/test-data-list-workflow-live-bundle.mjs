#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import { materializeDataListWorkflowLiveBundle } from "./lib/data-list-workflow-live-bundle.mjs";
import { mergeDataListWorkflowLiveComponent, validateDataListWorkflowLiveReadback } from "./lib/data-list-workflow-live-merge.mjs";

const BASE_SPEC = {
  name: "Notify employee for high training hours",
  key: "TRAINING_ACTUAL_HOURS_OVER_10",
  description: "Notify the Employee user when a new training record exceeds ten actual hours.",
  appId: 41,
  listSetId: "100000000000000001",
  listId: "100000000000000002",
  ids: {
    procModelId: "100000000000000003",
    defResourceId: "100000000000000004",
    deployedDefId: "100000000000000005",
    flowMappingId: "100000000000000006",
    remindRuleId: "100000000000000007",
    flowStatusFieldId: "100000000000000008",
  },
  graphIds: {
    start: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    end: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    flows: [
      "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    ],
  },
  flowStatus: {
    fieldName: "Text12",
    fieldIndex: 12,
    displayName: "Notify employee for high training hours",
  },
  entryConditions: [{
    key: "actual-hours-over-10",
    pre: "and",
    left: "<input type=\"button\" data=\"${&quot;type&quot;:&quot;listitem&quot;,&quot;prop&quot;:&quot;Decimal10&quot;}\" expr=\"__\" value=\"Actual hours\">",
    op: "n.>",
    right: "10",
    group: "number",
  }],
  actions: [{
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    type: "MailTask",
    name: "Notify employee",
    properties: {
      to: "employee@example.invalid",
      subject: "Training record created with Actual hours greater than 10",
      html: "<p>A new training record with Actual hours greater than 10 has been created.</p>",
    },
  }],
};

function materialize(overrides = {}) {
  return materializeDataListWorkflowLiveBundle({
    ...structuredClone(BASE_SPEC),
    ...overrides,
  });
}

function decodeDefResource(value) {
  const bytes = Buffer.from(value, "base64");
  assert.equal(bytes.subarray(0, 10).toString("utf8"), "::brotli::");
  return JSON.parse(zlib.brotliDecompressSync(bytes.subarray(10)).toString("utf8"));
}

const result = materialize();
assert.equal(result.validation.ok, true);
assert.deepEqual(Object.keys(result.bundle).sort(), ["flowMapping", "flowStatusField", "remindRule", "workflow"]);
assert.equal(result.bundle.workflow.ProcModelID, BASE_SPEC.ids.procModelId);
assert.equal(result.bundle.workflow.DefResourceID, BASE_SPEC.ids.defResourceId);
assert.equal(result.bundle.workflow.DeployedDefID, BASE_SPEC.ids.deployedDefId);
assert.notEqual(result.bundle.workflow.ProcModelID, result.bundle.workflow.DefResourceID);
assert.equal(result.bundle.flowMapping.ID, BASE_SPEC.ids.flowMappingId);
assert.deepEqual(JSON.parse(result.bundle.flowMapping.Setting), { NewTrigger: true });
assert.equal(result.bundle.flowStatusField.FieldID, BASE_SPEC.ids.flowStatusFieldId);
assert.equal(result.bundle.flowStatusField.FieldName, "Text12");
assert.equal(result.bundle.remindRule.CategoryID, BASE_SPEC.ids.flowMappingId);
assert.equal(result.bundle.remindRule.ID, BASE_SPEC.ids.remindRuleId);
assert.deepEqual(JSON.parse(JSON.parse(result.bundle.remindRule.Rules).Conditions.Data), BASE_SPEC.entryConditions);
assert.deepEqual(result.proofBoundary, {
  localMaterialization: "passed",
  mcpSave: "not-run",
  mcpReadback: "not-run",
  designerOpen: "not-run",
  workflowExecution: "not-run",
  emailDelivery: "not-run",
});

const cliResult = JSON.parse(execFileSync(process.execPath, [resolve(dirname(fileURLToPath(import.meta.url)), "materialize-live-data-list-workflow-type1.mjs")], {
  input: JSON.stringify(BASE_SPEC),
  encoding: "utf8",
}));
assert.deepEqual(cliResult, result);

const decoded = decodeDefResource(result.bundle.workflow.DefResource);
assert.equal(decoded.id, BASE_SPEC.ids.defResourceId);
assert.equal(decoded.childshapes.find((shape) => shape.stencil.id === "StartNoneEvent").id, BASE_SPEC.graphIds.start);
assert.equal(decoded.childshapes.find((shape) => shape.stencil.id === "EndNoneEvent").id, BASE_SPEC.graphIds.end);
assert.equal(decoded.childshapes.find((shape) => shape.stencil.id === "MailTask").id, BASE_SPEC.actions[0].id);
assert.deepEqual(decoded.childshapes.filter((shape) => shape.stencil.id === "SequenceFlow").map((shape) => shape.id), BASE_SPEC.graphIds.flows);
assert.equal(decoded.childshapes.find((shape) => shape.stencil.id === "SequenceFlow" && shape.properties.conditioninfo.length).properties.conditioninfo[0].op, "n.>");

const detail = { List: { ListID: BASE_SPEC.listId }, Fields: [], RemindRules: [], FlowMappings: [], Workflows: [] };
const merged = mergeDataListWorkflowLiveComponent({ detail, mode: "create", bundle: result.bundle });
const readback = validateDataListWorkflowLiveReadback({ detail: merged.detail, key: BASE_SPEC.key });
assert.equal(readback.status, "pass");
assert.equal(readback.identitiesResolved, true);
assert.equal(readback.defResourceDecoded, true);
assert.equal(readback.proofBoundary.mcpReadback, "passed");

const corruptedReadback = structuredClone(merged.detail);
corruptedReadback.Workflows[0].DefResource = Buffer.from("not-brotli", "utf8").toString("base64");
assert.throws(() => validateDataListWorkflowLiveReadback({ detail: corruptedReadback, key: BASE_SPEC.key }), (error) => error.code === "DATA_LIST_WORKFLOW_LIVE_DEFRESOURCE_PREFIX_INVALID");

assert.throws(() => materialize({ ids: { ...BASE_SPEC.ids, defResourceId: "" } }), (error) => error.code === "DATA_LIST_WORKFLOW_LIVE_ID_REQUIRED");
assert.throws(() => materialize({ graphIds: { ...BASE_SPEC.graphIds, flows: [BASE_SPEC.graphIds.flows[0]] } }), (error) => error.code === "DATA_LIST_WORKFLOW_LIVE_GRAPH_FLOW_COUNT_INVALID");
assert.throws(() => materialize({ flowStatus: { fieldName: "Text12", fieldIndex: 13 } }), (error) => error.code === "DATA_LIST_WORKFLOW_LIVE_FLOWSTATUS_FIELD_INDEX_MISMATCH");
assert.throws(() => materialize({ appId: "not-an-app" }), (error) => error.code === "DATA_LIST_WORKFLOW_LIVE_APP_ID_INVALID");
assert.throws(() => materialize({ actions: [{ ...BASE_SPEC.actions[0], properties: { ...BASE_SPEC.actions[0].properties, to: "" } }] }), (error) => error.code === "DATA_LIST_WORKFLOW_TYPE1_VALIDATION_FAILED" && error.findings.some((finding) => finding.code === "DATA_LIST_WORKFLOW_MAIL_PROPERTY_REQUIRED"));

console.log("DATA_LIST_WORKFLOW_LIVE_BUNDLE_PASSED");

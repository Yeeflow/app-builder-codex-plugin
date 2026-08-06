#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { materializeDataListWorkflowLiveBundle } from "./lib/data-list-workflow-live-bundle.mjs";
import { mergeDataListWorkflowLiveComponent } from "./lib/data-list-workflow-live-merge.mjs";

function bundle(suffix = "1") {
  return materializeDataListWorkflowLiveBundle({
    name: "High hours",
    key: "HIGH_HOURS",
    listSetId: "99",
    listId: "100",
    ids: {
      procModelId: `200${suffix}`,
      defResourceId: `300${suffix}`,
      deployedDefId: `350${suffix}`,
      flowMappingId: `400${suffix}`,
      flowStatusFieldId: `500${suffix}`,
      remindRuleId: `600${suffix}`,
    },
    graphIds: { start: `start-${suffix}`, end: `end-${suffix}`, flows: [`flow-a-${suffix}`, `flow-b-${suffix}`] },
    flowStatus: { fieldName: `Text${suffix}`, fieldIndex: Number(suffix) },
    actions: [{
      id: `mail-${suffix}`,
      type: "MailTask",
      name: "Notify employee",
      properties: { to: "employee@example.invalid", subject: "High hours", html: "<p>High hours</p>" },
    }],
  }).bundle;
}

function emptyDetail() {
  return { List: { ListID: "100" }, Fields: [], RemindRules: [], FlowMappings: [], Workflows: [], Layouts: [] };
}

const original = emptyDetail();
const created = mergeDataListWorkflowLiveComponent({ detail: original, mode: "create", bundle: bundle() });
assert.deepEqual([created.detail.Fields.length, created.detail.Workflows.length, created.detail.FlowMappings.length, created.detail.RemindRules.length], [1, 1, 1, 1]);
assert.equal(created.report.deleteMissingRequired, false);
assert.equal(created.report.readbackRequired, true);
assert.deepEqual(original, emptyDetail(), "merge must not mutate the MCP readback object");

const cli = resolve(dirname(fileURLToPath(import.meta.url)), "merge-live-data-list-workflow-type1.mjs");
const cliCreated = JSON.parse(execFileSync(process.execPath, [cli], {
  input: JSON.stringify({ operation: "merge", detail: original, mode: "create", bundle: bundle() }),
  encoding: "utf8",
}));
assert.deepEqual(cliCreated, created);
const cliReadback = JSON.parse(execFileSync(process.execPath, [cli], {
  input: JSON.stringify({ operation: "validate-readback", detail: cliCreated.detail, key: "HIGH_HOURS" }),
  encoding: "utf8",
}));
assert.equal(cliReadback.status, "pass");

assert.throws(() => mergeDataListWorkflowLiveComponent({ detail: created.detail, mode: "create", bundle: bundle() }), (error) => error.code === "DATA_LIST_WORKFLOW_LIVE_ALREADY_EXISTS");

const updatedBundle = structuredClone(bundle());
updatedBundle.workflow.Name = "High hours updated";
const updated = mergeDataListWorkflowLiveComponent({ detail: created.detail, mode: "update", bundle: updatedBundle });
assert.equal(updated.detail.Workflows[0].Name, "High hours updated");
assert.equal(updated.detail.Workflows[0].ProcModelID, "2001");

assert.throws(() => mergeDataListWorkflowLiveComponent({ detail: created.detail, mode: "update", bundle: bundle("2") }), (error) => error.code === "DATA_LIST_WORKFLOW_LIVE_UPDATE_ID_CONTINUITY_FAILED");

const replaced = mergeDataListWorkflowLiveComponent({ detail: created.detail, mode: "replace", bundle: bundle("2") });
assert.equal(replaced.detail.Workflows[0].ProcModelID, "2002");
assert.equal(replaced.detail.FlowMappings[0].ID, "4002");
assert.equal(replaced.detail.Fields[0].FieldID, "5002");
assert.equal(replaced.detail.RemindRules[0].ID, "6002");

const brokenMapping = bundle("3");
brokenMapping.flowMapping.Setting = JSON.stringify({ NewTrigger: false });
assert.throws(() => mergeDataListWorkflowLiveComponent({ detail: emptyDetail(), mode: "create", bundle: brokenMapping }), (error) => error.code === "DATA_LIST_WORKFLOW_LIVE_NEW_TRIGGER_REQUIRED");

const wrongList = bundle("3");
wrongList.workflow.ListID = "999";
assert.throws(() => mergeDataListWorkflowLiveComponent({ detail: emptyDetail(), mode: "create", bundle: wrongList }), (error) => error.code === "DATA_LIST_WORKFLOW_LIVE_LIST_ID_MISMATCH");

const corrupted = bundle("3");
corrupted.workflow.DefResource = Buffer.from("not-brotli", "utf8").toString("base64");
assert.throws(() => mergeDataListWorkflowLiveComponent({ detail: emptyDetail(), mode: "create", bundle: corrupted }), (error) => error.code === "DATA_LIST_WORKFLOW_LIVE_DEFRESOURCE_PREFIX_INVALID");

console.log("DATA_LIST_WORKFLOW_LIVE_MERGE_PASSED");

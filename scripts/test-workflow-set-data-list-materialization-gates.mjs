#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { materializeFullAppGeneratedFinal } from "./materialize-full-app-generated-final.mjs";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-set-data-list-materialization-"));
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
try {
  fs.writeFileSync(path.join(tempDir, "functional-specification.md"), "# Functional Specification: Leave Usage Workflow\n\nBusiness defaults approval status: user-default-approved-for-generation.\n");
  fs.writeFileSync(path.join(tempDir, "yeeflow-app-plan.md"), plan());
  const report = materializeFullAppGeneratedFinal({
    cwd: tempDir,
    functionalSpec: "functional-specification.md",
    appPlan: "yeeflow-app-plan.md",
    outDir: "dist",
    allowFixtureApiIdsForTests: true,
  });
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  const decoded = JSON.parse(fs.readFileSync(report.outputs.decodedResource, "utf8"));
  assert.equal(decoded.Forms.length, 3, JSON.stringify(decoded.Forms.map((form) => ({ name: form.Name, workflowType: form.WorkflowType })), null, 2));
  const dataListWorkflow = decoded.Forms.find((form) => form.WorkflowType === 1);
  const scheduledWorkflow = decoded.Forms.find((form) => form.WorkflowType === 3);
  const documentLoopWorkflow = decoded.Forms.find((form) => form.Name === "Store additional documents");
  assert.ok(dataListWorkflow);
  assert.ok(scheduledWorkflow);
  assert.ok(documentLoopWorkflow);
  assert.deepEqual(JSON.parse(scheduledWorkflow.Settings), scheduleSettings());
  const dataListDef = decodeDef(dataListWorkflow.DefResource);
  const scheduledDef = decodeDef(scheduledWorkflow.DefResource);
  const documentLoopDef = decodeDef(documentLoopWorkflow.DefResource);
  assert.equal(dataListDef.workflowType, 1);
  assert.equal(scheduledDef.workflowType, 3);
  const currentMutation = dataListDef.childshapes.find((shape) => shape?.stencil?.id === "ContentList");
  const selectedMutation = scheduledDef.childshapes.find((shape) => shape?.stencil?.id === "ContentList");
  assert.equal(currentMutation.properties.listtype, "current");
  assert.equal(currentMutation.properties.appid, "");
  assert.equal(selectedMutation.properties.listtype, "select");
  assert.equal(selectedMutation.properties.appid, 41);
  assert.equal(selectedMutation.properties.listsetid, decoded.ListSet.ListID);
  assert.equal(selectedMutation.properties.listdatas.find((entry) => entry.Columns === "Text3").Data[0].key, "_list.LeaveType");
  const loop = documentLoopDef.childshapes.find((shape) => shape?.stencil?.id === "Loop");
  const loopBody = documentLoopDef.childshapes.find((shape) => shape?.stencil?.id === "LoopBody");
  assert.ok(loop);
  assert.ok(loopBody);
  assert.equal(loop.properties.loopType, "values");
  assert.equal(loop.properties.loopValue.type, 2);
  const loopMutation = loopBody.children.find((shape) => shape?.stencil?.id === "ContentList");
  assert.equal(loopMutation.properties.listtype, "select");
  assert.equal(loopMutation.properties.listdatas.find((entry) => entry.Columns === "Text4").Data[0].exprType, "loop_ctx");
  assert.equal(decoded.Childs[0].FlowMappings.length, 1);
  assert.equal(decoded.Childs[0].FlowMappings[0].DefKey, dataListWorkflow.Key);
  assert.deepEqual(JSON.parse(decoded.Childs[0].FlowMappings[0].Setting), { NewTrigger: true });
  const schema = spawnSync(process.execPath, [path.join(ROOT, "scripts/validate-standard-package-schema.mjs"), report.outputs.package, "--schema-only"], { encoding: "utf8" });
  assert.equal(schema.status, 0, schema.stdout || schema.stderr);
  // This fixture intentionally uses fixture IDs and omits full page surfaces, so
  // it is not signing-ready. The preflight still must not misclassify Workflow
  // Types 1/3 as Approval Forms.
  const preflight = spawnSync(process.execPath, [
    path.join(ROOT, "scripts/yapk-first-generation-preflight.mjs"),
    "--package", report.outputs.package,
    "--plan", path.join(tempDir, "yeeflow-app-plan.md"),
    "--id-provenance", report.outputs.idProvenance,
    "--json",
  ], { encoding: "utf8" });
  assert.notEqual(preflight.status, 0);
  const preflightReport = JSON.parse(preflight.stdout);
  assert.equal(preflightReport.gates.find((gate) => gate.gate === "generated-yapk-export-shape-materialization")?.ok, true);
  assert.equal(preflightReport.gates.find((gate) => gate.gate === "approval-workflow-publish-readiness")?.ok, true);
  console.log("workflow Set Data List materialization gates: pass (Type 1 + Type 3 + FlowMappings + LoopBody)");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function decodeDef(value) {
  const raw = Buffer.from(value, "base64");
  return JSON.parse(zlib.brotliDecompressSync(raw.subarray(Buffer.byteLength("::brotli::"))).toString("utf8"));
}

function scheduleSettings() {
  return { TimeZone: "Singapore Standard Time", Times: ["01:00AM"], StartDate: "2026-07-13", EndDate: "2026-07-17", Frequency: "0", Interval: 1, IsWorkday: true };
}

function plan() {
  const mapping = JSON.stringify([{ Columns: "Decimal5", TargetType: "number", Per: "0", Data: [{ type: "num", value: "0" }] }]);
  const batchMapping = JSON.stringify([
    { Columns: "Text2", TargetType: "user", Per: "0", Data: [{ exprType: "variable", valueType: "user", id: "Applicant", type: "expr", name: "Workflow Variables:Applicant" }] },
    { Columns: "Text3", TargetType: "text", Per: "0", Data: [{ exprType: "variable", valueType: "string", id: "LeaveRequestDetails", key: "_list.LeaveType", type: "expr", name: "Workflow Variables:Leave request details:Leave Type" }] },
    { Columns: "Decimal5", TargetType: "number", Per: "0", Data: [{ exprType: "variable", valueType: "number", id: "LeaveRequestDetails", key: "_list.Hours", type: "expr", name: "Workflow Variables:Leave request details:Hours" }] },
  ]);
  const batchDeclarations = JSON.stringify([
    { id: "Applicant", type: "user", valueType: "user", name: "Applicant", expressionName: "Workflow Variables:Applicant" },
    { id: "LeaveRequestDetails", type: "list", valueType: "string", name: "Leave request details", expressionName: "Workflow Variables:Leave request details:Leave Type", key: "_list.LeaveType" },
    { id: "LeaveRequestDetails", type: "list", valueType: "number", name: "Leave request details", expressionName: "Workflow Variables:Leave request details:Hours", key: "_list.Hours" },
  ]);
  const documentMapping = JSON.stringify([
    { Columns: "Title", TargetType: "text", Per: "0", Data: [{ type: "str", value: "Additional document-" }, { exprType: "loop_ctx", key: "LoopIndex", type: "expr", name: "Current Loop:Current iteration" }] },
    { Columns: "Text4", TargetType: "file-upload", Per: "0", Data: [{ exprType: "loop_ctx", key: "LoopItem", type: "expr", name: "Current Loop:Current object" }] },
    { Columns: "_Path", TargetType: "text", Per: "0", Data: [{ type: "str", value: "leave/additional documents" }] },
  ]);
  const loopExpression = JSON.stringify([{ exprType: "variable", valueType: "file", id: "AdditionalDocuments", type: "expr", name: "Workflow Variables:Additional documents" }]);
  return [
    "# Leave Usage Workflow - Yeeflow App Plan",
    "",
    "Business defaults approval status: user-default-approved-for-generation.",
    "",
    "## 4. Data Lists and Document Libraries Plan",
    "",
    "### 4.1 Leave Usage Statistics",
    "",
    "| Field Name | Internal Field Name | Type | Purpose |",
    "| --- | --- | --- | --- |",
    "| Used Days | Decimal5 | Number | Track used days. |",
    "",
    "| Document Library Name | Type | Purpose |",
    "| --- | --- | --- |",
    "| Travel request documents | Document Library | Store uploaded leave-request documents. |",
    "",
    "## 7. Scheduled Workflows Plan",
    "",
    "| Workflow Name | Schedule Settings JSON | Purpose |",
    "| --- | --- | --- |",
    `| Daily usage update | \`${JSON.stringify(scheduleSettings())}\` | Add a daily usage record. |`,
    `| Store additional documents | \`${JSON.stringify(scheduleSettings())}\` | Store each uploaded document. |`,
    "",
    "## 11. Data List Workflows Plan",
    "",
    "| Workflow Name | Host List / Library | Trigger | Trigger Settings JSON | Purpose |",
    "| --- | --- | --- | --- | --- |",
    "| Update usage | Leave Usage Statistics | Decimal5 | `{\"NewTrigger\":true}` | Update the current item. |",
    "",
    "#### Workflow Set Data List Action Plan",
    "",
    "| Workflow Host | Workflow Name | Node Name | Target Mode | Target Resource | Target Resource Type | Operation | Mappings JSON | Filters JSON | Workflow Variable Declarations JSON | Batch Source Type | Batch Source | Batch Source Fields JSON | Parent Loop | Proof Boundary | Notes |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    `| Data List | Update usage | Update current usage | current | Host list | Data List | add | \`${mapping}\` | \`[]\` | \`[]\` |  |  | \`[]\` |  | export-proven | Update current item. |`,
    `| Scheduled | Daily usage update | Save leave detail list | select | Leave Usage Statistics | Data List | add | \`${batchMapping}\` | \`[]\` | \`${batchDeclarations}\` | Workflow List Variable | LeaveRequestDetails | \`[\"LeaveType\",\"Hours\"]\` |  | export-proven | Add one usage item for every leave detail. |`,
    `| Scheduled | Store additional documents | Add additional document | select | Travel request documents | Document Library | add | \`${documentMapping}\` | \`[]\` | \`[]\` |  |  | \`[]\` | Loop additional documents | export-proven | Add each uploaded document. |`,
    "",
    "#### Workflow Loop Planning",
    "",
    "| Workflow | Workflow Host Type | Loop Node Name | Loop Mode | Loop Source Parent | Loop Source | Loop Value Expression JSON | LoopBody Actions | Current Iteration / Current Item Use | Delay or Repeated Side Effects | Proof Boundary | Business Rationale |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    `| Store additional documents | Scheduled | Loop additional documents | values |  |  | \`${loopExpression}\` | Add additional document | Current item -> Text4 |  | export-proven | One document-library row per uploaded file. |`,
  ].join("\n");
}

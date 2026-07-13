#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validateWorkflowSetDataListPlan } from "./validate-workflow-set-data-list-plan.mjs";
import { materializeFullAppGeneratedFinal } from "./materialize-full-app-generated-final.mjs";

const header = "| Workflow Host | Workflow Name | Node Name | Target Mode | Target Resource | Target Resource Type | Operation | Mappings JSON | Filters JSON | Proof Boundary | Notes |";
const divider = "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |";
const mappings = JSON.stringify([{ Columns: "Decimal5", TargetType: "number", Per: "1", Data: [{ type: "num", value: "3" }] }]);
const filters = JSON.stringify([{ key: "f1", pre: "and", left: "Text2", op: "0", right: [{ type: "str", value: "Applicant" }], showCus: false }]);
const documentMappings = JSON.stringify([
  { Columns: "_Path", TargetType: "text", Per: "0", Data: [{ exprType: "variable", valueType: "text", id: "LeaveType", type: "expr" }, { type: "op", op: "&" }, { type: "str", value: "/travel documents" }] },
  { Columns: "Title", TargetType: "text", Per: "0", Data: [{ exprType: "application", valueType: "string", id: "CurrentProcInstID", type: "expr" }] },
  { Columns: "Text4", TargetType: "file", Per: "0", Data: [{ exprType: "variable", valueType: "file", id: "TravelDocument", type: "expr" }] },
]);
const valid = [
  "# Plan",
  "#### Workflow Set Data List Action Plan",
  header,
  divider,
  `| Approval Form | Leave Request | Update usage | select | Leave Usage Statistics | Data List | edit | ${mappings} | ${filters} | export-proven | Increase used days |`,
  `| Data List | Add default usage | Update current | current | Host list | Data List | add | ${JSON.stringify([{ Columns: "Decimal5", TargetType: "number", Per: "0", Data: [{ type: "num", value: "0" }] }])} | [] | export-proven | Current record update |`,
  `| Scheduled | Set Data List Sample | Multiply usage | select | Leave Usage Statistics | Data List | edit | ${JSON.stringify([{ Columns: "Decimal5", TargetType: "number", Per: "3", Data: [{ type: "num", value: "2" }] }])} | ${filters} | export-proven | Loop body |`,
  `| Approval Form | Leave Request | Add travel document | select | Travel request documents | Document Library | add | ${documentMappings} | [] | export-proven | Single attachment |`,
].join("\n");

assert.equal(validateWorkflowSetDataListPlan(valid).status, "pass");
const batchHeader = "| Workflow Host | Workflow Name | Node Name | Target Mode | Target Resource | Target Resource Type | Operation | Mappings JSON | Filters JSON | Batch Source Type | Batch Source | Batch Source Fields JSON | Parent Loop | Proof Boundary | Notes |";
const batchDivider = "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |";
const approvalBatchMappings = JSON.stringify([
  { Columns: "Text2", TargetType: "user", Per: "0", Data: [{ exprType: "variable", valueType: "user", id: "Applicant", type: "expr" }] },
  { Columns: "Text3", TargetType: "text", Per: "0", Data: [{ exprType: "variable", valueType: "string", id: "LeaveRequestDetails", key: "_list.LeaveType", type: "expr" }] },
  { Columns: "Decimal5", TargetType: "number", Per: "0", Data: [{ exprType: "variable", valueType: "number", id: "LeaveRequestDetails", key: "_list.Hours", type: "expr" }] },
]);
const dataListBatchMappings = JSON.stringify([
  { Columns: "Text2", TargetType: "user", Per: "0", Data: [{ exprType: "list_field", valueType: "identity-picker", id: "Text2", prop: "Text2", type: "expr" }] },
  { Columns: "Text3", TargetType: "text", Per: "0", Data: [{ exprType: "list_field", valueType: "list", id: "LeaveDetails", key: "_list.LeaveType", type: "expr" }] },
]);
const batchValid = [
  "# Batch plan",
  "#### Workflow Set Data List Action Plan",
  batchHeader,
  batchDivider,
  `| Approval Form | Leave Request | Save sub list | select | Leave Usage Statistics | Data List | add | ${approvalBatchMappings} | [] | Workflow List Variable | LeaveRequestDetails | [\"LeaveType\",\"Hours\"] |  | export-proven | One target row per leave detail. |`,
  `| Scheduled | Daily leave usage | Save sub list | select | Leave Usage Statistics | Data List | add | ${approvalBatchMappings} | [] | Workflow List Variable | LeaveRequestDetails | [\"LeaveType\",\"Hours\"] |  | export-proven | Same List-variable pattern. |`,
  `| Data List | Add default usage | Save sub list | select | Leave Usage Statistics | Data List | add | ${dataListBatchMappings} | [] | Data List Sub List Field | LeaveDetails | [\"LeaveType\"] |  | export-proven | One target row per current-record detail. |`,
].join("\n");
assert.equal(validateWorkflowSetDataListPlan(batchValid).status, "pass");
function expectCode(markdown, code) { assert.ok(validateWorkflowSetDataListPlan(markdown).findings.some((finding) => finding.code === code), `expected ${code}`); }
expectCode(valid.replace("| Scheduled | Set Data List Sample | Multiply usage | select", "| Scheduled | Set Data List Sample | Multiply usage | current"), "WORKFLOW_SET_DATALIST_PLAN_CURRENT_TARGET_HOST_INVALID");
expectCode(valid.replace(filters, "[]"), "WORKFLOW_SET_DATALIST_PLAN_FILTERS_REQUIRED");
expectCode(valid.replace('"TargetType":"number","Per":"1"', '"TargetType":"text","Per":"1"'), "WORKFLOW_SET_DATALIST_PLAN_NUMERIC_TARGET_INVALID");
expectCode(valid.replace("| Data List | Add default usage | Update current | current", "| Data List | Add default usage | Update current | current").replace("| add |", "| remove |"), "WORKFLOW_SET_DATALIST_PLAN_CURRENT_REMOVE_UNPROVEN");
expectCode(valid.replace('"Columns":"Text4","TargetType":"file","Per":"0","Data":[{"exprType":"variable","valueType":"file","id":"TravelDocument","type":"expr"}]', '"Columns":"Text7","TargetType":"file","Per":"0","Data":[{"exprType":"variable","valueType":"file","id":"TravelDocument","type":"expr"}]'), "WORKFLOW_SET_DATALIST_PLAN_DOCUMENT_LIBRARY_ADD_FIELD_MISSING");
expectCode(valid.replace('"Columns":"Title","TargetType":"text","Per":"0","Data":[{"exprType":"application","valueType":"string","id":"CurrentProcInstID","type":"expr"}]', '"Columns":"Title","TargetType":"text","Per":"0","Data":[{"type":"str","value":"Travel document"}]'), "WORKFLOW_SET_DATALIST_PLAN_DOCUMENT_LIBRARY_TITLE_UNIQUE_COMPONENT_MISSING");
expectCode(batchValid.replace("Workflow List Variable | LeaveRequestDetails", "Data List Sub List Field | LeaveRequestDetails"), "WORKFLOW_SET_DATALIST_PLAN_BATCH_SOURCE_HOST_MISMATCH");
expectCode(batchValid.replace('"_list.LeaveType"', '"_list.UnknownChild"'), "WORKFLOW_SET_DATALIST_PLAN_BATCH_CHILD_FIELD_UNKNOWN");
expectCode(batchValid.replace("| add |", "| edit |"), "WORKFLOW_SET_DATALIST_PLAN_BATCH_OPERATION_UNPROVEN");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-set-data-list-plan-"));
try {
  fs.writeFileSync(path.join(tempDir, "functional-specification.md"), "# Set Data List Gate\n");
  fs.writeFileSync(path.join(tempDir, "yeeflow-app-plan.md"), valid.replace(filters, "[]"));
  const report = materializeFullAppGeneratedFinal({
    cwd: tempDir,
    functionalSpec: "functional-specification.md",
    appPlan: "yeeflow-app-plan.md",
    outDir: "dist",
    allowFixtureApiIdsForTests: true,
  });
  assert.equal(report.status, "fail");
  assert.ok(report.findings.some((finding) => finding.code === "FULL_APP_WORKFLOW_SET_DATALIST_PLAN_FILTERS_REQUIRED"));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log("workflow Set Data List plan gates: pass (bulk Sub list source contracts included)");

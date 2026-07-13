#!/usr/bin/env node

import assert from "node:assert/strict";
import { validateFormActionSetDataListPlan } from "./validate-form-action-set-data-list-plan.mjs";

const valid = validateFormActionSetDataListPlan(plan([
  row({ hostType: "Approval Submission", operation: "add", mode: "select", step: "Add usage", condition: expr("Count == 0"), cont: "Yes" }),
  row({ hostType: "Approval Submission", operation: "edit", mode: "select", step: "Update usage", filters: where(), condition: expr("Count > 0"), cont: "Yes" }),
  row({ host: "View Usage", hostType: "Data List View Item", operation: "edit", mode: "current", step: "Update current item", targetType: "None", target: "None" }),
  row({ host: "View Usage", hostType: "Data List View Item", operation: "add", mode: "select", step: "Add travel document", targetType: "Document Library", target: "Travel request documents", mappings: documentMapping() }),
  row({ hostType: "Dashboard", operation: "remove", mode: "select", step: "Delete usage", mappings: "None", filters: where(), statusKind: "Temp variable", statusId: "DeleteStatus", itemKind: "Temp variable", itemId: "DeletedCount", itemAttr: "totalcount" }),
]));
assert.equal(valid.status, "pass", JSON.stringify(valid, null, 2));

expectCode("Public Form", row({ hostType: "Public Form" }), "FORM_ACTION_SET_DATA_LIST_PLAN_PUBLIC_FORM_FORBIDDEN");
expectCode("selected edit filter", row({ operation: "edit", filters: "None" }), "FORM_ACTION_SET_DATA_LIST_PLAN_FILTER_REQUIRED");
expectCode("mapping", row({ mappings: "not-json" }), "FORM_ACTION_SET_DATA_LIST_PLAN_FIELD_MAPPING_INVALID");
expectCode("Sub List", row({ mappings: JSON.stringify([{ Columns: "Text1", Per: "0", Data: [{ id: "Rows", key: "_list.Name", valueType: "list" }] }]) }), "FORM_ACTION_SET_DATA_LIST_PLAN_SUBLIST_BULK_WRITE_UNSUPPORTED");
expectCode("Dashboard result", row({ hostType: "Dashboard", statusKind: "Workflow variable" }), "FORM_ACTION_SET_DATA_LIST_PLAN_DASHBOARD_RESULT_NOT_TEMP");
expectCode("New current rationale", row({ host: "New usage", hostType: "Data List New Item", operation: "edit", mode: "current", targetType: "None", target: "None", rationale: "Convenience" }), "FORM_ACTION_SET_DATA_LIST_PLAN_NEW_EDIT_DIRECT_WRITE_RATIONALE_MISSING");
expectCode("operation", row({ operation: "upsert" }), "FORM_ACTION_SET_DATA_LIST_PLAN_OPERATION_INVALID");
expectCode("target mode", row({ mode: "all" }), "FORM_ACTION_SET_DATA_LIST_PLAN_TARGET_MODE_INVALID");
expectCode("unsupported host", row({ hostType: "Approval Print" }), "FORM_ACTION_SET_DATA_LIST_PLAN_HOST_TYPE_INVALID");
expectCode("incomplete status result", row({ statusKind: "Temp variable", statusId: "None" }), "FORM_ACTION_SET_DATA_LIST_PLAN_STATUS_RESULT_INCOMPLETE");
expectCode("incomplete item result", row({ itemKind: "Temp variable", itemId: "None" }), "FORM_ACTION_SET_DATA_LIST_PLAN_ITEM_RESULT_INCOMPLETE");
expectCode("item result attribute", row({ itemKind: "Temp variable", itemId: "Result", itemAttr: "record" }), "FORM_ACTION_SET_DATA_LIST_PLAN_ITEM_RESULT_ATTRIBUTE_INVALID");
expectCode("Document Library upload missing", row({ targetType: "Document Library", target: "Travel request documents", mappings: JSON.stringify([{ Columns: "_Path", Per: "0", Data: [{ type: "str", value: "Annual Leave" }] }]) }), "FORM_ACTION_SET_DATA_LIST_PLAN_DOCUMENT_LIBRARY_UPLOAD_REQUIRED");
expectCode("Document Library multi-file", row({ targetType: "Document Library", target: "Travel request documents", mappings: JSON.stringify([{ Columns: "Text4", Per: "0", Data: [{ exprType: "list_field", valueType: "array", id: "AdditionalDocuments" }] }]) }), "FORM_ACTION_SET_DATA_LIST_PLAN_DOCUMENT_LIBRARY_UPLOAD_MULTI_VALUE_UNSUPPORTED");
expectCode("click trigger without control", row({ boundControl: "None" }), "FORM_ACTION_SET_DATA_LIST_PLAN_BOUND_CONTROL_REQUIRED");

console.log(JSON.stringify({ status: "pass", test: "test-form-action-set-data-list-plan-gates.mjs", cases: 20 }, null, 2));

function expectCode(label, dataRow, code) {
  const report = validateFormActionSetDataListPlan(plan([dataRow]));
  assert.equal(report.status, "fail", `${label}: ${JSON.stringify(report, null, 2)}`);
  assert.ok(report.findings.some((item) => item.code === code), `${label}: expected ${code}`);
}
function expr(value) { return JSON.stringify([{ type: "str", value }]); }
function where() { return JSON.stringify([{ left: "Text1", op: "0", right: [{ type: "str", value: "Active" }] }]); }
function mapping() { return JSON.stringify([{ Columns: "Text1", Per: "0", Data: [{ type: "str", value: "Active" }] }]); }
function documentMapping() { return JSON.stringify([{ Columns: "_Path", Per: "0", Data: [{ type: "str", value: "Annual Leave/travel documents" }] }, { Columns: "Text4", Per: "0", Data: [{ exprType: "list_field", valueType: "file-upload", id: "TravelDocument" }] }]); }
function row(options = {}) {
  const o = { host: "Submission form", hostType: "Approval Submission", operation: "add", mode: "select", step: "Add usage", mappings: mapping(), filters: "None", condition: "None", cont: "No", targetType: "Data List", target: "Leave Usage Statistics", statusKind: "None", statusId: "None", itemKind: "None", itemId: "None", itemAttr: "None", rationale: "Conditional usage mutation", boundControl: "btn_usage", ...options };
  return `| Leave Request | ${o.host} | ${o.hostType} | Usage actions | 1 | ${o.step} | Button click | ${o.boundControl} | Set Data List | ${o.operation} | ${o.mode} | ${o.targetType} | ${o.target} | ${o.mappings} | ${o.filters} | ${o.condition} | ${o.cont} | ${o.statusKind} | ${o.statusId} | ${o.itemKind} | ${o.itemId} | ${o.itemAttr} | export-proven | ${o.rationale} |`;
}
function plan(rows) {
  return `| Host Resource | Host Form / Page | Host Type | Action Name | Step Order | Step Name | Trigger | Bound Control | Exact Step Type | Operation | Target Mode | Target Resource Type | Target Resource | Field Mapping JSON | Filter JSON | Execution Condition Tokens | Continue When Not Met | Status Target Kind | Status Target ID | Item Result Target Kind | Item Result Target ID | Item Result Attribute | Proof Boundary | Business Rationale |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n${rows.join("\n")}`;
}

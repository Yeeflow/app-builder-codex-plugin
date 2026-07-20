#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import setVariableUtils from "./lib/set-variable-contract-utils.cjs";
import workflowValidator from "../workflow-action-config-validator.js";
import { buildPlannedWorkflowSetVariableAssignments, materializePlannedFormActionSetVariables } from "./materialize-full-app-generated-final.mjs";
import { validateSetVariablePlan } from "./validate-set-variable-plan.mjs";

const { validateFormActionSetVariableStep, buildWorkflowVariableSetting } = setVariableUtils;
const { validateWorkflowActionShapes } = workflowValidator;

const tempVars = [{ id: "var_Status" }, { id: "var_Amount" }];
const single = {
  type: "setvar",
  attrs: {
    setvar_var: { exprType: "variable", id: "__temp_var_Status", name: "var_Status", type: "expr" },
    setvar_val: [{ type: "str", value: "Active" }],
  },
};
assert.deepEqual(validateFormActionSetVariableStep(single, { host: "dashboard", declaredTempVariables: tempVars }), []);

const multi = {
  type: "setvar",
  attrs: {
    setvar_multi: true,
    setvar_array: [
      { var: { exprType: "variable", id: "__temp_var_Status", name: "var_Status" }, value: [{ type: "str", value: "Inactive" }] },
      { var: { exprType: "variable", id: "__temp_var_Amount", name: "var_Amount" }, value: [{ type: "num", value: "1000" }] },
    ],
  },
};
assert.deepEqual(validateFormActionSetVariableStep(multi, { host: "dashboard", declaredTempVariables: tempVars }), []);

expectCode({ type: "setvar", attrs: { setvar_multi: true, setvar_array: [] } }, "FORM_ACTION_SETVAR_MULTI_ARRAY_EMPTY", { host: "dashboard", declaredTempVariables: tempVars });
expectCode({ type: "setvar", attrs: { setvar_var: { exprType: "variable", id: "__temp_var_Missing" }, setvar_val: [] } }, "FORM_ACTION_SETVAR_TARGET_UNDECLARED", { host: "dashboard", declaredTempVariables: tempVars });
expectCode({ type: "setvar", attrs: { setvar_var: { exprType: "list_field", id: "Decimal1" }, setvar_val: [] } }, "FORM_ACTION_SETVAR_LIST_FIELD_TARGET_UNSUPPORTED_HOST", { host: "dashboard", declaredTempVariables: tempVars });
expectCode({ type: "setvar", condition: "not-an-array", attrs: { setvar_var: { exprType: "list_field", id: "Decimal1" }, setvar_val: [] } }, "FORM_ACTION_SETVAR_CONDITION_NOT_EXPRESSION_ARRAY", { host: "data-list-form", declaredListFields: ["Decimal1"] });
expectCode({ type: "setvar", continue: "true", attrs: { setvar_var: { exprType: "list_field", id: "Decimal1" }, setvar_val: [] } }, "FORM_ACTION_SETVAR_CONTINUE_NOT_BOOLEAN", { host: "data-list-form", declaredListFields: ["Decimal1"] });
assert.deepEqual(validateFormActionSetVariableStep({ type: "setvar", continue: true, attrs: { setvar_var: { exprType: "list_field", id: "Decimal1", prop: "Decimal1" }, setvar_val: [{ type: "num", value: "1200" }] } }, { host: "data-list-form", declaredListFields: ["Decimal1"] }), []);

const setting = buildWorkflowVariableSetting({ id: "DeliveryDate", name: "Delivery Date", type: "date", value: [{ type: "func", func: "now", params: [] }] });
assert.equal(setting.idx, "DeliveryDate");
assert.equal(setting.value[0].func, "now");

const plannedSettings = buildPlannedWorkflowSetVariableAssignments({
  nodeName: "Set multiple variables",
  setVariableAssignments: 'UniPrice :: number :: Uni Price :: [{"type":"num","value":"2000"}] ;; DeliveryDate :: date :: Delivery Date :: [{"type":"func","func":"now","params":[]}] ;; IsExisted :: boolean :: Is Existed :: [{"exprType":"variable","valueType":"number","id":"UniPrice","type":"expr"}]',
}, 0);
assert.equal(plannedSettings.length, 3);
assert.equal(plannedSettings[0].value[0].value, "2000");
assert.equal(plannedSettings[1].value[0].func, "now");
assert.equal(plannedSettings[2].value[0].id, "UniPrice");
assert.deepEqual(buildPlannedWorkflowSetVariableAssignments({ nodeName: "Missing assignments" }, 0), []);

const requesterControl = { id: "requester-control", binding: "Requester", attrs: {} };
const plannedApprovalForm = { id: "submission-form", children: [requesterControl], actions: [], formAction: {}, tempVars: [] };
materializePlannedFormActionSetVariables(plannedApprovalForm, {
  hostResource: "Business Travel Request Approval",
  hostPage: "Submission form",
  hostType: "Approval",
  records: [
    { hostResource: "Business Travel Request Approval", hostPage: "Submission form", hostType: "Approval", actionName: "Page Load", stepOrder: 1, stepName: "Set requester", trigger: "Page Load", targetKind: "Workflow variable", targetId: "Requester", targetValueType: "user", rhsTokens: '[{"type":"func","func":"currentUser","params":[]}]' },
    { hostResource: "Business Travel Request Approval", hostPage: "Submission form", hostType: "Approval", actionName: "Page Load", stepOrder: 2, stepName: "Set page context", trigger: "Page Load", targetKind: "Temp variable", targetId: "var_IsAdmin", targetValueType: "boolean", rhsTokens: '[{"type":"func","func":"isInGroup","params":[]}]', nextAction: "Set Requester Department" },
    { hostResource: "Business Travel Request Approval", hostPage: "Submission form", hostType: "Approval", actionName: "Set Requester Department", stepOrder: 1, stepName: "Set department values", trigger: "Field Change", boundControl: "Requester", targetKind: "Workflow variable", targetId: "Department", targetValueType: "groupselect", rhsTokens: '[{"type":"func","func":"getUserAttr","params":[]}]' },
    { hostResource: "Business Travel Request Approval", hostPage: "Submission form", hostType: "Approval", actionName: "Set Requester Department", stepOrder: 1, stepName: "Set department values", trigger: "Field Change", boundControl: "Requester", targetKind: "Workflow variable", targetId: "DepartmentName", targetValueType: "text", rhsTokens: '[{"type":"func","func":"getOrgAttr","params":[]}]' },
  ],
});
assert.equal(plannedApprovalForm.actions.length, 2);
assert.equal(plannedApprovalForm.formAction.onLoad, plannedApprovalForm.actions.find((action) => action.name === "Page Load").id);
assert.equal(requesterControl.attrs.control_event_rule, plannedApprovalForm.actions.find((action) => action.name === "Set Requester Department").id);
assert.equal(plannedApprovalForm.actions.find((action) => action.name === "Set Requester Department").steps[0].attrs.setvar_array.length, 2);
assert.equal(plannedApprovalForm.actions.find((action) => action.name === "Page Load").steps[2].type, "otheraction");
assert.ok(plannedApprovalForm.tempVars.some((variable) => variable.id === "__temp_var_IsAdmin"));

const approvalAliasForm = { id: "alias-submission", children: [], actions: [], formAction: {}, tempVars: [] };
materializePlannedFormActionSetVariables(approvalAliasForm, {
  hostResource: "Alias Approval",
  hostPage: "Submission form",
  hostType: "Approval",
  records: [{ hostResource: "Alias Approval", hostPage: "Submission form", hostType: "Approval Submission", actionName: "Page Load", stepOrder: 1, stepName: "Set context", trigger: "Page Load", targetKind: "Temp variable", targetId: "var_Context", targetValueType: "text", rhsTokens: '[{"type":"str","value":"ready"}]' }],
});
assert.equal(approvalAliasForm.actions.length, 1);
assert.equal(approvalAliasForm.formAction.onLoad, approvalAliasForm.actions[0].id);
assert.throws(() => materializePlannedFormActionSetVariables({ children: [], actions: [], formAction: {}, tempVars: [] }, {
  hostResource: "Mismatched Host",
  hostPage: "Submission form",
  hostType: "Approval",
  records: [{ hostResource: "Mismatched Host", hostPage: "Submission form", hostType: "Dashboard", actionName: "Page Load", stepOrder: 1, trigger: "Page Load", targetKind: "Temp variable", targetId: "var_Context", targetValueType: "text", rhsTokens: '[{"type":"str","value":"ready"}]' }],
}), /FORM_ACTION_SETVAR_HOST_TYPE_MISMATCH/);

const listFieldControl = { id: "travel-type-control", binding: "Text1", attrs: {} };
const plannedDataListForm = { id: "allowance-form", children: [listFieldControl], actions: [], formAction: {}, tempVars: [] };
materializePlannedFormActionSetVariables(plannedDataListForm, {
  hostResource: "Travel Allowance Policies",
  hostPage: "Allowance Policy New/Edit",
  hostType: "Data List Form",
  records: [{ hostResource: "Travel Allowance Policies", hostPage: "Allowance Policy New/Edit", hostType: "Data List Form", actionName: "Set meal allowance", stepOrder: 1, stepName: "Set domestic allowance", trigger: "Field Change", boundControl: "Text1", targetKind: "Current list field", targetId: "Decimal1", targetValueType: "number", rhsTokens: '[{"type":"num","value":"1200"}]', conditionTokens: '[{"exprType":"list_field","id":"Text1","type":"expr"}]', continueNext: true }],
});
assert.equal(plannedDataListForm.actions[0].steps[0].attrs.setvar_var.exprType, "list_field");
assert.equal(plannedDataListForm.actions[0].steps[0].continue, true);
assert.equal(listFieldControl.attrs.control_event_rule, plannedDataListForm.actions[0].id);
assert.throws(() => materializePlannedFormActionSetVariables({ children: [], actions: [], formAction: {}, tempVars: [] }, {
  hostResource: "Dashboard",
  hostPage: "Dashboard",
  hostType: "Dashboard",
  records: [{ hostResource: "Dashboard", hostPage: "Dashboard", hostType: "Dashboard", actionName: "Change status", stepOrder: 1, trigger: "Button Click", boundControl: "missing-button", targetKind: "Temp variable", targetId: "var_Status", targetValueType: "text", rhsTokens: '[{"type":"str","value":"Active"}]' }],
}), /FORM_ACTION_SETVAR_BOUND_CONTROL_UNRESOLVED/);

const integrationDir = fs.mkdtempSync(path.join(os.tmpdir(), "set-variable-materializer-"));
try {
  const specPath = path.join(integrationDir, "functional-specification.md");
  const planPath = path.join(integrationDir, "yeeflow-app-plan.md");
  fs.writeFileSync(specPath, "# Functional Specification\n\nMaintain travel allowance policies.\n");
  fs.writeFileSync(planPath, `
# Travel Allowance Policies App Plan

## Plan Status
- Application name: Travel Allowance Policies

## 4. Data Lists and Document Libraries Plan
### 4.1 Travel Allowance Policies
| Display Name | Internal ID / Field Key | Exact Yeeflow Field Type | Purpose |
| --- | --- | --- | --- |
| Travel Type | Text1 | Text | Policy type |
| Daily Meal Allowance | Decimal1 | Number | Allowance amount |

## 10. Custom Data List Forms Plan
### 10.1 Travel Allowance Policies
| Data List or Library | Custom Form | Form Usage | Selected Data List Form Layout Template | Open In |
| --- | --- | --- | --- | --- |
| Travel Allowance Policies | Travel Allowance Policies New/Edit Form | New/Edit | data_list_form_layout_new_edit_v1_1 | Dialog |
| Travel Allowance Policies | Travel Allowance Policies View Item | View | data_list_form_layout_view_item_v1_1 | Dialog |

## 5. Approval Forms Plan
### 5.1 Travel Approval
#### Submission Form Fields
| Business Label | Field Name | Exact Yeeflow Variable Type | Exact Yeeflow Control Type |
| --- | --- | --- | --- |
| Request title | requestTitle | text | input |

#### Approval Workflow Nodes
| Step Order | Node Name | Node Type | Set Variable Assignments |
| --- | --- | --- | --- |
| 1 | Initialize request status | SetVariableTask | Status :: text :: Status :: [{"type":"str","value":"Ready"}] |

##### Form Action Set Variable Planning
| Host Resource | Host Form / Page | Host Type | Action Name | Step Order | Step Name | Trigger | Bound Control / Field | Target Kind | Target ID | Target Value Type | RHS Expression Tokens | Condition Tokens | Continue | Start Another Action Target | Result Consumer / Use | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Travel Allowance Policies | Travel Allowance Policies New/Edit Form | Data List Form | Set meal allowance | 1 | Set domestic allowance | Field Change | Text1 | Current list field | Decimal1 | number | [{"type":"num","value":"1200"}] | [{"exprType":"list_field","id":"Text1","type":"expr"}] | true | None | Persisted allowance field | validator-backed |
`);
  const outputDir = path.join(integrationDir, "out");
  const run = spawnSync(process.execPath, [fileURLToPath(new URL("./materialize-full-app-generated-final.mjs", import.meta.url)), "--functional-spec", specPath, "--app-plan", planPath, "--out-dir", outputDir, "--allow-fixture-api-ids-for-tests", "--json"], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const report = JSON.parse(run.stdout);
  const decoded = JSON.parse(fs.readFileSync(report.outputs.decodedResource, "utf8"));
  const list = decoded.Childs.find((child) => child.List?.Title === "Travel Allowance Policies");
  const layout = list.Layouts.find((item) => item.Title === "Travel Allowance Policies New/Edit Form");
  assert.ok(layout, `Expected planned New/Edit layout; found ${JSON.stringify(list.Layouts.map((item) => item.Title))}`);
  const formResource = JSON.parse(layout.LayoutInResources[0].Resource);
  assert.equal(formResource.actions.find((action) => action.name === "Set meal allowance").steps[0].attrs.setvar_var.id, "Decimal1");
  assert.ok(JSON.stringify(formResource).includes("control_event_rule"));
  const approval = decoded.Forms.find((form) => form.Name === "Travel Approval");
  const approvalDef = decodeFixtureDefResource(approval.DefResource);
  const setVariableNode = approvalDef.childshapes.find((shape) => shape.stencil?.id === "SetVariableTask");
  assert.equal(setVariableNode.properties.variablesetting[0].id, "Status");
  assert.equal(setVariableNode.properties.variablesetting[0].value[0].value, "Ready");
} finally {
  fs.rmSync(integrationDir, { recursive: true, force: true });
}

const validPlan = `
| Action Name | Exact Step Type | Result Target | Notes and business rationale |
| --- | --- | --- | --- |
| Page Load | Set variable | var_Status | Fixed value Active; consumed by Dynamic Display |

| Node Name | Node Type | Set Variable Assignments |
| --- | --- | --- |
| Set defaults | SetVariableTask | UniPrice :: number :: Uni Price :: [{"type":"num","value":"2000"}] |
`;
assert.equal(validateSetVariablePlan(validPlan).status, "pass");
const invalidPlan = `
| Action Name | Exact Step Type | Result Target | Notes |
| --- | --- | --- | --- |
| Page Load | Set variable | N/A | N/A |
| Node Name | Node Type | Notes |
| --- | --- | --- |
| Set defaults | SetVariableTask | placeholder |
`;
const invalidPlanReport = validateSetVariablePlan(invalidPlan);
assert.ok(invalidPlanReport.findings.some((finding) => finding.code === "SET_VARIABLE_PLAN_TARGET_MISSING"));
assert.ok(invalidPlanReport.findings.some((finding) => finding.code === "WORKFLOW_SET_VARIABLE_PLAN_ASSIGNMENTS_MISSING"));
const invalidDetailedPlan = `
| Host Resource | Host Form / Page | Host Type | Action Name | Step Order | Step Name | Trigger | Bound Control / Field | Target Kind | Target ID | Target Value Type | RHS Expression Tokens | Condition Tokens | Continue | Start Another Action Target | Result Consumer / Use | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard | Dashboard | Dashboard | Page Load | 1 | Invalid field target | Page Load | None | Current list field | Decimal1 | number | not-json | None | false | Missing action | Display | validator-backed |
`;
const invalidDetailedReport = validateSetVariablePlan(invalidDetailedPlan);
for (const code of ["SET_VARIABLE_PLAN_RHS_EXPRESSION_INVALID", "SET_VARIABLE_PLAN_LIST_FIELD_TARGET_UNSUPPORTED_HOST", "SET_VARIABLE_PLAN_CHAIN_TARGET_UNRESOLVED"]) {
  assert.ok(invalidDetailedReport.findings.some((finding) => finding.code === code), `Expected ${code}`);
}

const unsupportedHostPlan = invalidDetailedPlan.replace("| Dashboard | Dashboard | Dashboard |", "| Page | Page | Portal | ");
assert.ok(validateSetVariablePlan(unsupportedHostPlan).findings.some((finding) => finding.code === "FORM_ACTION_SETVAR_HOST_TYPE_UNSUPPORTED"));

const approvalAliasPlan = invalidDetailedPlan
  .replace("| Dashboard | Dashboard | Dashboard |", "| Travel Approval | Submission form | Approval Form |")
  .replace("| Current list field | Decimal1 |", "| Temp variable | var_Status |")
  .replace("not-json", '[{"type":"str","value":"Ready"}]')
  .replace("Missing action", "None");
assert.equal(validateSetVariablePlan(approvalAliasPlan).findings.some((finding) => finding.code === "FORM_ACTION_SETVAR_HOST_TYPE_UNSUPPORTED"), false);

const validWorkflow = [{ id: "set-1", resourceid: "set-1", stencil: { id: "SetVariableTask" }, properties: { formtype: "current", data: null, variablesetting: [setting] } }];
assert.equal(validateWorkflowActionShapes(validWorkflow, { strict: true }).issues.filter((item) => item.level === "error").length, 0);
const dataListWorkflowSetVariable = [{
  id: "set-list-rhs",
  resourceid: "set-list-rhs",
  stencil: { id: "SetVariableTask" },
  properties: {
    name: "Read travel type",
    formtype: "current",
    variablesetting: [{ idx: "TravelType", id: "TravelType", name: "Travel Type", type: "text", editable: true, value: [{ exprType: "list_field", valueType: "radio", id: "Text1", prop: "Text1", type: "expr" }] }],
  },
}, {
  id: "update-current",
  resourceid: "update-current",
  stencil: { id: "ContentList" },
  properties: { name: "Update current allowance", type: "add", listtype: "current", listid: "LIST", listdatas: [{ Per: "0", Columns: "Decimal1", Data: [{ type: "num", value: "40" }] }] },
}];
const dataListWorkflowActionReport = validateWorkflowActionShapes(dataListWorkflowSetVariable, { strict: true });
assert.equal(dataListWorkflowActionReport.issues.some((item) => item.code === "SET_VARIABLE_LIST_FIELD_VALUE_RUNTIME_UNPROVEN"), false);
assert.equal(dataListWorkflowActionReport.issues.filter((item) => item.level === "error").length, 0);
const invalidWorkflow = [{ id: "set-2", resourceid: "set-2", stencil: { id: "SetVariableTask" }, properties: { formtype: "current", data: null, variablesetting: [] } }];
assert.ok(validateWorkflowActionShapes(invalidWorkflow, { strict: true }).issues.some((item) => item.code === "SET_VARIABLE_VARIABLESETTING_EMPTY"));

const materializer = fs.readFileSync(new URL("./materialize-full-app-generated-final.mjs", import.meta.url), "utf8");
const packageValidator = fs.readFileSync(new URL("../validate-yap-package.js", import.meta.url), "utf8");
assert.match(materializer, /buildPlannedWorkflowSetVariableAssignments\(step, index\)/);
assert.doesNotMatch(materializer, /Workflow variable \$\{index \+ 1\}`\} Result[\s\S]{0,500}value: \[\{ type: "str", value: "" \}\]/);
for (const code of [
  "APPROVAL_FORM_START_ANOTHER_ACTION_UNRESOLVED",
  "APPROVAL_FORM_FIELD_CHANGE_ACTION_UNRESOLVED",
  "APPROVAL_DYNAMIC_DISPLAY_CONTROL_ID_MISMATCH",
  "APPROVAL_DYNAMIC_DISPLAY_VARIABLE_UNDECLARED",
  "SETVARIABLE_TARGET_TYPE_MISMATCH",
  "DATALIST_WORKFLOW_SETVARIABLE_RHS_FIELD_UNRESOLVED",
  "DATALIST_WORKFLOW_CURRENT_LIST_FIELD_UNRESOLVED",
]) assert.match(packageValidator, new RegExp(code));

console.log(JSON.stringify({ status: "pass", cases: 48, proof: "export-proven-validator-backed" }, null, 2));

function expectCode(step, code, options) {
  assert.ok(validateFormActionSetVariableStep(step, options).some((finding) => finding.code === code), `Expected ${code}`);
}

function decodeFixtureDefResource(value) {
  const raw = Buffer.from(String(value || ""), "base64");
  const candidates = raw.subarray(0, 10).toString("utf8") === "::brotli::" ? [raw.subarray(10), raw] : [raw];
  for (const candidate of candidates) {
    try { return JSON.parse(zlib.brotliDecompressSync(candidate).toString("utf8")); } catch {}
    try { return JSON.parse(zlib.gunzipSync(candidate).toString("utf8")); } catch {}
  }
  throw new Error("Could not decode fixture DefResource");
}

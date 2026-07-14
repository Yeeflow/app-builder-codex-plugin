#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const {
  PUBLIC_FORM_ALLOWED_ACTION_STEP_TYPES,
  validatePublicFormActions,
} = require(path.join(ROOT, "scripts/lib/public-form-action-utils.cjs"));

const fields = [
  { FieldID: "1", FieldName: "Title", DisplayName: "Title", Type: "input" },
  { FieldID: "2", FieldName: "Text2", DisplayName: "Feedback", Type: "textarea" },
];
const tempVars = [{ idx: "temp-1", id: "var_Value1", name: "var_Value1", type: "string" }];
const currentField = { exprType: "list_field", valueType: "input", id: "Title", prop: "Title", type: "expr", name: "List Fields:Title" };
const tempValue = { exprType: "variable", valueType: "string", id: "var_Value1", type: "expr", name: "var_Value1" };
const fixed = { type: "str", value: "ABC" };
const base = {
  children: [{ type: "action_button", id: "redirect-button", attrs: { control_action: "redirect-action" } }],
  tempVars,
  formAction: { onLoad: "set-action" },
  actions: [
    { id: "set-action", name: "Public form set variables", steps: [
      { type: "setvar", attrs: { setvar_var: currentField, setvar_val: [fixed, { type: "op", op: "&" }, tempValue] } },
      { type: "setvar", attrs: { setvar_multi: true, setvar_array: [
        { var: currentField, value: [fixed] },
        { var: tempValue, value: [currentField] },
      ] } },
    ] },
    { id: "redirect-action", name: "Redirect to", steps: [
      { type: "redirect", attrs: { link: { opentype: false, url: null, variable: [fixed, { type: "op", op: "&" }, currentField, { type: "op", op: "&" }, tempValue] } } },
    ] },
  ],
};

assert.deepEqual([...PUBLIC_FORM_ALLOWED_ACTION_STEP_TYPES].sort(), ["barcode", "confirm", "customcode", "nfc", "otheraction", "redirect", "setvar", "submit"]);
assert.deepEqual(validate(base), []);

expectCode(withStep("querydata"), "PUBLIC_FORM_ACTION_STEP_TYPE_NOT_ALLOWED");
expectCode(withStep("setdatalist"), "PUBLIC_FORM_ACTION_STEP_TYPE_NOT_ALLOWED");
expectCode(withStep("listitem"), "PUBLIC_FORM_ACTION_STEP_TYPE_NOT_ALLOWED");
expectCode(withStep("openform"), "PUBLIC_FORM_ACTION_STEP_TYPE_NOT_ALLOWED");
expectCode(withStep("opendashboard"), "PUBLIC_FORM_ACTION_STEP_TYPE_NOT_ALLOWED");
expectCode(withStep("invokeservice"), "PUBLIC_FORM_ACTION_STEP_TYPE_NOT_ALLOWED");

const badTarget = structuredClone(base);
badTarget.actions[0].steps[0].attrs.setvar_var = { exprType: "variable", id: "WorkflowVariable" };
expectCode(badTarget, "PUBLIC_FORM_SETVAR_TARGET_SCOPE_INVALID");

const badValue = structuredClone(base);
badValue.actions[0].steps[0].attrs.setvar_val = [{ exprType: "application", prop: "ApplicantUserID", type: "expr" }];
expectCode(badValue, "PUBLIC_FORM_ACTION_EXPRESSION_SCOPE_INVALID");

const unknownField = structuredClone(base);
unknownField.actions[1].steps[0].attrs.link.variable = [{ exprType: "list_field", id: "Missing", prop: "Missing", type: "expr" }];
expectCode(unknownField, "PUBLIC_FORM_ACTION_LIST_FIELD_UNRESOLVED");

const unknownTemp = structuredClone(base);
unknownTemp.actions[1].steps[0].attrs.link.variable = [{ exprType: "variable", id: "var_Missing", type: "expr" }];
expectCode(unknownTemp, "PUBLIC_FORM_ACTION_TEMPVAR_UNDECLARED");

const functionValue = structuredClone(base);
functionValue.actions[0].steps[0].attrs.setvar_val = [{ type: "func", func: "currentUser", params: [] }];
expectCode(functionValue, "PUBLIC_FORM_ACTION_EXPRESSION_SCOPE_INVALID");

const disallowedField = structuredClone(base);
disallowedField.actions[0].steps[0].attrs.setvar_val = [{ exprType: "list_field", id: "User1", prop: "User1", type: "expr" }];
expectCode(disallowedField, "PUBLIC_FORM_ACTION_LIST_FIELD_UNRESOLVED");

const badReference = structuredClone(base);
badReference.formAction.onLoad = "missing-action";
expectCode(badReference, "PUBLIC_FORM_ACTION_REFERENCE_UNRESOLVED");

for (const type of ["customcode", "barcode", "nfc"]) {
  const resource = withStep(type);
  assert.equal(validate(resource, false).some((item) => item.code === "PUBLIC_FORM_ACTION_STEP_SERIALIZATION_UNPROVEN"), false);
  assert.equal(validate(resource, true).some((item) => item.code === "PUBLIC_FORM_ACTION_STEP_SERIALIZATION_UNPROVEN"), true);
}

console.log(JSON.stringify({ status: "pass", cases: 17 }, null, 2));

function validate(resource, generatedOutput = true) {
  return validatePublicFormActions(resource, { pathPrefix: "PublicForm.Resource", declaredListFields: fields, generatedOutput });
}

function withStep(type) {
  return { children: [], tempVars, actions: [{ id: "action-1", name: type, steps: [{ type, attrs: {} }] }] };
}

function expectCode(resource, code) {
  const findings = validate(resource);
  assert.ok(findings.some((item) => item.code === code), `${code} missing from ${JSON.stringify(findings, null, 2)}`);
}

#!/usr/bin/env node

import assert from "node:assert/strict";
import expressionUtils from "../yeeflow-expression-utils.js";

const {
  buildComparison,
  buildCurrentObjectFieldToken,
  buildCurrentUserToken,
  buildFunctionToken,
  buildOrgAttributeToken,
  buildNumericWorkflowCondition,
  buildSublistRowCalculationExpression,
  buildUserAttributeToken,
  buildVariableToken,
  validateExpressionTokens,
  validateSublistCurrentObjectExpression,
  validateWorkflowNumericCondition,
} = expressionUtils;

function v(id, name, valueType) {
  return buildVariableToken({ id, name, valueType });
}

function ok(name, expr) {
  const report = validateExpressionTokens(expr, { path: name });
  assert.equal(report.valid, true, `${name}: ${JSON.stringify(report.issues, null, 2)}`);
}

const amount = v("Amount", "Amount", "number");
const quantity = v("Quantity", "Quantity", "number");
const unitPrice = v("UnitPrice", "Unit Price", "number");
const status = v("Status", "Status", "text");
const dueDate = v("DueDate", "Due Date", "date");
const active = v("Active", "Active", "boolean");
const lineItems = v("LineItems", "Line Items", "number");
const currentUser = buildCurrentUserToken();
const requesterApplicant = v("RequesterApplicant", "Requester / Applicant", "user");

function assertInvalid(name, expr, code) {
  const report = validateExpressionTokens(expr, { path: name });
  assert.equal(report.valid, false, `${name}: expected invalid`);
  assert.ok(report.issues.some((issue) => issue.code === code), `${name}: missing ${code}: ${JSON.stringify(report.issues, null, 2)}`);
}

function assertWarns(name, expr, code) {
  const report = validateExpressionTokens(expr, { path: name });
  assert.ok(report.issues.some((issue) => issue.code === code), `${name}: missing ${code}: ${JSON.stringify(report.issues, null, 2)}`);
}

function getUserAttr(userExpr, key, label = key, fallback = "N/A") {
  return buildUserAttributeToken(userExpr, { key, label }, fallback);
}

function getOrgAttr(orgExpr, key, label = key, fallback = "N/A") {
  return buildOrgAttributeToken(orgExpr, { key, label }, fallback);
}

ok("simple arithmetic", [quantity, { type: "op", op: "*" }, unitPrice]);
ok("string concat", [{ type: "str", value: "REQ-" }, { type: "op", op: "&" }, buildFunctionToken("UniqueID", [])]);
ok("boolean comparison", buildComparison(active, "==", { type: "bool", value: true }));
ok("logical and/or", [amount, { type: "op", op: ">" }, { type: "num", value: "1000" }, { type: "op", op: "and" }, status, { type: "op", op: "!=" }, { type: "str", value: "" }]);
ok("dateAdd", [buildFunctionToken("dateAdd", [[buildFunctionToken("now", [])], [{ type: "str", value: "day" }], [{ type: "num", value: "3" }]])]);
ok("dateDiff", [buildFunctionToken("dateDiff", [[dueDate], [buildFunctionToken("now", [])], "day", [{ type: "bool", value: false }]])]);
ok("dateDiff year raw unit", [buildFunctionToken("dateDiff", [[dueDate], [buildFunctionToken("now", [])], "year", []])]);
assertWarns("dateDiff wrapped unit", [buildFunctionToken("dateDiff", [[dueDate], [buildFunctionToken("now", [])], [{ type: "str", value: "Year" }], []])], "EXPRESSION_DATEDIFF_UNIT_WRAPPED");
ok("dateFormat", [buildFunctionToken("dateFormat", [[buildFunctionToken("now", [])], [{ type: "str", value: "YYYYMMDD" }]])]);
ok("iif", [buildFunctionToken("iif", [[amount, { type: "op", op: ">" }, { type: "num", value: "5000" }], [{ type: "str", value: "Finance Review" }], [{ type: "str", value: "Manager Review" }]])]);
ok("isNullOrEmpty", [buildFunctionToken("isNullOrEmpty", [[status]])]);
ok("arraySum", [buildFunctionToken("arraySum", [[lineItems], [{ type: "str", value: "LineTotal" }], [], []])]);
ok("JSONStringfy query collection", [buildFunctionToken("JSONStringfy", [[{ exprType: "variable", valueType: "string", id: "__temp_var_CollectionofQueryItems", type: "expr", name: "var_CollectionofQueryItems" }]])]);
ok("formatNumber", [buildFunctionToken("formatNumber", [[amount], [{ type: "num", value: "2" }], [{ type: "num", value: "1" }]])]);
ok("UniqueID", [buildFunctionToken("UniqueID", [])]);
ok("current user name", [getUserAttr(currentUser, "Name_CN", "Name")]);
ok("current user department name", [getOrgAttr(getUserAttr(currentUser, "DepartmentID", "Department"), "Name", "Name")]);
ok("current user manager name", [getUserAttr(getUserAttr(currentUser, "LineManager", "Line Manager"), "Name_CN", "Name", "")]);
ok("requester applicant name", [getUserAttr(requesterApplicant, "Name_CN", "Name")]);
assertInvalid(
  "profile attribute descriptor wrapped array",
  [buildFunctionToken("getUserAttr", [[currentUser], [{ key: "Name_CN", label: "Name" }], []])],
  "EXPRESSION_PROFILE_ATTR_DESCRIPTOR_ARRAY_WRAPPED",
);
ok("boarding date formatted", [buildFunctionToken("dateFormat", [[getUserAttr(currentUser, "LatestHireDate", "Boarding Date")], [{ type: "str", value: "MMM DD, YYYY" }]])]);
ok("boarding date plus one year", [buildFunctionToken("dateAdd", [[getUserAttr(currentUser, "LatestHireDate", "Boarding Date")], [{ type: "str", value: "year" }], [{ type: "num", value: "1" }]])]);
const rowQuantity = buildCurrentObjectFieldToken({ id: "LineQuantity", name: "Quantity", valueType: "number", ctx: "LineItems" });
const rowUnitPrice = buildCurrentObjectFieldToken({ id: "LineUnitPrice", name: "Unit Price", valueType: "number", ctx: "LineItems" });
ok("sublist row current object subtotal", [rowQuantity, { type: "op", op: "*" }, rowUnitPrice]);
const rowSubtotal = buildSublistRowCalculationExpression({
  listVariableId: "LineItems",
  quantityField: { id: "LineQuantity", name: "Quantity" },
  unitPriceField: { id: "LineUnitPrice", name: "Unit Price" },
});
const rowReport = validateSublistCurrentObjectExpression(rowSubtotal, {
  ctx: "LineItems",
  allowedFields: ["LineProduct", "LineQuantity", "LineUnitPrice", "LineSubTotal", "LineNote"],
  path: "sublist subtotal",
});
assert.equal(rowReport.valid, true, `sublist subtotal: ${JSON.stringify(rowReport.issues, null, 2)}`);
const highValueCondition = buildNumericWorkflowCondition({ id: "TotalAmount", valueType: "number" }, ">", 5000);
const highValueReport = validateWorkflowNumericCondition(highValueCondition, { allowedVariables: ["TotalAmount"], path: "amount > 5000" });
assert.equal(highValueReport.valid, true, `amount > 5000: ${JSON.stringify(highValueReport.issues, null, 2)}`);
const normalValueCondition = buildNumericWorkflowCondition({ id: "TotalAmount", valueType: "number" }, "<=", 5000);
const normalValueReport = validateWorkflowNumericCondition(normalValueCondition, { allowedVariables: ["TotalAmount"], path: "amount <= 5000" });
assert.equal(normalValueReport.valid, true, `amount <= 5000: ${JSON.stringify(normalValueReport.issues, null, 2)}`);

console.log("Expression validation smoke tests passed.");

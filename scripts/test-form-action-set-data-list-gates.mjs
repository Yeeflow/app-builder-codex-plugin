#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const {
  buildFormActionSetDataListStep,
  classifyFormActionSetDataListStep,
  validateFormActionSetDataListStep,
} = require("./lib/form-action-set-data-list-utils.cjs");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = { AppID: 41, ListSetID: "9000000000000000001", ListID: "9000000000000000002", ListType: 1 };
const documentLibraryTarget = { AppID: 41, ListSetID: "9000000000000000001", ListID: "9000000000000000003", ListType: 16 };
const mapping = (per = "0") => [{ Per: per, Columns: "Decimal1", Data: [{ type: "num", value: "1" }] }];
const filters = [{ left: "Text1", op: "0", right: [{ type: "str", value: "Active" }] }];

const add = buildFormActionSetDataListStep({ hostSurface: "approval_submission", name: "Add usage", operation: "add", targetMode: "select", target, mappings: mapping(), statusTarget: { id: "AddStatus", parent: "__temp_" }, itemTarget: { id: "NewItemID", parent: "__temp_" } });
assert.equal(add.attrs.type, "add");
assert.equal(classifyFormActionSetDataListStep(add), "select_add");
assert.equal(validateFormActionSetDataListStep(add, { hostSurface: "approval_submission", strictGenerated: true }).length, 0);

for (const operation of ["edit", "remove"]) {
  const step = buildFormActionSetDataListStep({ hostSurface: "dashboard", name: `${operation} record`, operation, targetMode: "select", target, mappings: operation === "remove" ? [] : mapping(), filters, statusTarget: { id: "Status", parent: "__temp_" } });
  assert.equal(classifyFormActionSetDataListStep(step), `select_${operation}`);
  assert.equal(validateFormActionSetDataListStep(step, { hostSurface: "dashboard" }).length, 0);
}

const current = buildFormActionSetDataListStep({ hostSurface: "data_list_view", name: "Update current item", operation: "edit", targetMode: "current", mappings: mapping() });
assert.equal(classifyFormActionSetDataListStep(current), "current_edit");
const taskAdd = buildFormActionSetDataListStep({ hostSurface: "approval_task", name: "Add usage from task", operation: "add", targetMode: "select", target, mappings: mapping() });
assert.equal(classifyFormActionSetDataListStep(taskAdd), "select_add");
const documentCurrent = buildFormActionSetDataListStep({ hostSurface: "document_library_view", name: "Update document info", operation: "edit", targetMode: "current", mappings: [{ Per: "0", Columns: "Datetime1", Data: [{ type: "str", value: "2026-07-13" }] }] });
assert.equal(classifyFormActionSetDataListStep(documentCurrent), "current_edit");
const documentAdd = buildFormActionSetDataListStep({ hostSurface: "data_list_view", name: "Add travel document", operation: "add", targetMode: "select", target: documentLibraryTarget, mappings: [
  { Per: "0", Columns: "_Path", Data: [{ type: "str", value: "Annual Leave/travel documents" }] },
  { Per: "0", Columns: "Text4", Data: [{ exprType: "list_field", valueType: "file-upload", id: "Ref_Document", type: "expr" }] },
] });
assert.equal(classifyFormActionSetDataListStep(documentAdd), "select_add");
for (const per of ["0", "1", "2", "3", "4"]) assert.equal(buildFormActionSetDataListStep({ hostSurface: "data_list_view", name: `Per ${per}`, operation: "edit", targetMode: "current", mappings: mapping(per) }).attrs.listdatas[0].Per, per);

expectThrow("Public Form", { hostSurface: "public_form", name: "Bad", operation: "add", targetMode: "select", target, mappings: mapping() }, /Public Forms/);
expectThrow("current add", { hostSurface: "data_list_view", name: "Bad", operation: "add", targetMode: "current", mappings: mapping() }, /supports edit only/);
expectThrow("current dashboard", { hostSurface: "dashboard", name: "Bad", operation: "edit", targetMode: "current", mappings: mapping() }, /custom forms/);
expectThrow("edit filter", { hostSurface: "dashboard", name: "Bad", operation: "edit", targetMode: "select", target, mappings: mapping() }, /requires at least one filter/);
expectThrow("missing mapping", { hostSurface: "dashboard", name: "Bad", operation: "add", targetMode: "select", target, mappings: [] }, /at least one field mapping/);
expectThrow("bad Per", { hostSurface: "dashboard", name: "Bad", operation: "add", targetMode: "select", target, mappings: mapping("5") }, /Per=5/);
expectThrow("dashboard workflow result", { hostSurface: "dashboard", name: "Bad", operation: "add", targetMode: "select", target, mappings: mapping(), statusTarget: { id: "Status", parent: "__variables_" } }, /temp variables/);
expectThrow("Sub List bulk", { hostSurface: "approval_submission", name: "Bad", operation: "add", targetMode: "select", target, mappings: [{ Per: "0", Columns: "Text1", Data: [{ exprType: "variable", valueType: "list", id: "Rows", key: "_list.Name", type: "expr" }] }] }, /cannot expand Sub List/);
expectThrow("Document Library upload missing", { hostSurface: "data_list_view", name: "Bad", operation: "add", targetMode: "select", target: documentLibraryTarget, mappings: [{ Per: "0", Columns: "_Path", Data: [{ type: "str", value: "Annual Leave" }] }] }, /Upload File mapping Text4/);
expectThrow("Document Library multi-file", { hostSurface: "data_list_view", name: "Bad", operation: "add", targetMode: "select", target: documentLibraryTarget, mappings: [{ Per: "0", Columns: "Text4", Data: [{ exprType: "list_field", valueType: "array", id: "AdditionalDocuments", type: "expr" }] }] }, /only one Document Library file/);

for (const file of [
  "form-action-set-data-list-approval-conditional-crud.template.json",
  "form-action-set-data-list-data-list-view-current-edit.template.json",
  "form-action-set-data-list-dashboard-crud.template.json",
  "form-action-set-data-list-approval-task-conditional-crud.template.json",
  "form-action-set-data-list-document-library-add.template.json",
  "form-action-set-data-list-document-library-view-current-edit.template.json",
]) {
  const reference = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference", file), "utf8"));
  assert.ok(reference.templateId && reference.hostSurface, `${file} must identify its template and host`);
}

console.log(JSON.stringify({ status: "pass", test: "test-form-action-set-data-list-gates.mjs", cases: 23 }, null, 2));

function expectThrow(label, options, pattern) {
  assert.throws(() => buildFormActionSetDataListStep(options), pattern, label);
}

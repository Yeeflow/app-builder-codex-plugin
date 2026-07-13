#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { validateWorkflowActionShapes } = require("../workflow-action-config-validator.js");

const TARGET_FIELD_TYPES = {
  Title: "text",
  Text2: "text",
  Text3: "text",
  Decimal5: "number",
};
const TARGET_FIELD_NAMES = Object.keys(TARGET_FIELD_TYPES);
const BASE_OPTIONS = {
  mode: "generator",
  stage: "final",
  targetFieldTypes: TARGET_FIELD_TYPES,
  targetFieldNames: TARGET_FIELD_NAMES,
};

function expression(value = "1") {
  return [{ type: "num", value }];
}

function equals(field = "Text2") {
  return [{ key: "where-1", pre: "and", left: field, op: "0", right: expression("1"), showCus: false }];
}

function contentList(properties) {
  return {
    id: "set-data-list",
    resourceid: "set-data-list",
    stencil: { id: "ContentList" },
    properties: {
      name: "Update leave usage",
      appid: 41,
      listsetid: "1000000000000000001",
      listid: "1000000000000000002",
      ...properties,
    },
  };
}

function report(shape, workflowHostType, options = {}) {
  return validateWorkflowActionShapes([shape], { ...BASE_OPTIONS, workflowHostType, ...options });
}

function expectPass(name, shape, host, options = {}) {
  const result = report(shape, host, options);
  const errors = result.issues.filter((entry) => entry.level === "error");
  assert.equal(errors.length, 0, `${name}: ${JSON.stringify(errors)}`);
}

function expectCode(name, shape, host, code, options = {}) {
  const result = report(shape, host, options);
  assert.ok(result.issues.some((entry) => entry.code === code && entry.level === "error"), `${name}: expected ${code}, got ${JSON.stringify(result.issues)}`);
}

expectPass("Approval update supports Increase with exact filters", contentList({
  listtype: "select",
  type: "edit",
  listdatas: [{ Columns: "Decimal5", Per: "1", Data: expression("3") }],
  wheres: equals("Text2"),
}), "approval");

expectPass("Approval rejected branch supports Decrease", contentList({
  listtype: "select",
  type: "edit",
  listdatas: [{ Columns: "Decimal5", Per: "2", Data: expression("3") }],
  wheres: equals("Text3"),
}), "approval");

expectPass("Data List workflow current-list add preserves export shape", contentList({
  listtype: "current",
  type: "add",
  listdatas: [{ Columns: "Decimal5", Per: "0", Data: expression("0") }],
}), "data-list");

expectPass("Data List workflow selected remove supports exact filter", contentList({
  listtype: "select",
  type: "remove",
  wheres: equals("Text2"),
}), "data-list");

expectPass("Scheduled Loop update supports Multiply", contentList({
  listtype: "select",
  type: "edit",
  listdatas: [{ Columns: "Decimal5", Per: "3", Data: expression("2") }],
  wheres: equals("Text2"),
}), "scheduled");

expectPass("Scheduled Loop update supports Divide", contentList({
  listtype: "select",
  type: "edit",
  listdatas: [{ Columns: "Decimal5", Per: "4", Data: expression("2") }],
  wheres: equals("Text2"),
}), "scheduled");

expectPass("Approval workflow bulk-writes each Workflow List row", contentList({
  listtype: "select",
  type: "add",
  listdatas: [
    { Columns: "Text2", Per: "0", Data: [{ exprType: "variable", valueType: "user", id: "Applicant", type: "expr", name: "Workflow Variables:Applicant" }] },
    { Columns: "Text3", Per: "0", Data: [{ exprType: "variable", valueType: "string", id: "LeaveRequestDetails", key: "_list.LeaveType", type: "expr", name: "Workflow Variables:Leave request details:Leave Type" }] },
  ],
}), "approval");

expectPass("Data List workflow bulk-writes each current Sub list row", contentList({
  listtype: "select",
  type: "add",
  listdatas: [
    { Columns: "Text2", Per: "0", Data: [{ exprType: "list_field", valueType: "identity-picker", id: "Text2", prop: "Text2", type: "expr", name: "List Fields:Employee" }] },
    { Columns: "Text3", Per: "0", Data: [{ exprType: "list_field", valueType: "list", id: "LeaveDetails", key: "_list.LeaveType", type: "expr", name: "List Fields:Leave details:Leave type" }] },
  ],
}), "data-list");

expectCode("Approval bulk Sub list mapping cannot use a current List field token", contentList({
  listtype: "select",
  type: "add",
  listdatas: [{ Columns: "Text3", Per: "0", Data: [{ exprType: "list_field", id: "LeaveDetails", key: "_list.LeaveType", type: "expr" }] }],
}), "approval", "CONTENTLIST_BATCH_SUBLIST_VARIABLE_TOKEN_INVALID");

expectCode("Data List bulk Sub list mapping cannot use a workflow variable token", contentList({
  listtype: "select",
  type: "add",
  listdatas: [{ Columns: "Text3", Per: "0", Data: [{ exprType: "variable", id: "LeaveDetails", key: "_list.LeaveType", type: "expr" }] }],
}), "data-list", "CONTENTLIST_BATCH_SUBLIST_LIST_FIELD_TOKEN_INVALID");

expectCode("Scheduled workflow cannot use current list", contentList({
  listtype: "current",
  type: "add",
  listdatas: [{ Columns: "Decimal5", Per: "0", Data: expression("1") }],
}), "scheduled", "CONTENTLIST_CURRENT_TARGET_HOST_INVALID");

expectCode("Numeric operation cannot target text", contentList({
  listtype: "select",
  type: "edit",
  listdatas: [{ Columns: "Text2", Per: "1", Data: expression("1") }],
  wheres: equals("Text2"),
}), "approval", "CONTENTLIST_NUMERIC_OPERATION_TARGET_NOT_NUMBER");

expectCode("Unknown target mapping is rejected", contentList({
  listtype: "select",
  type: "add",
  listdatas: [{ Columns: "Decimal99", Per: "0", Data: expression("1") }],
}), "approval", "CONTENTLIST_MAPPING_TARGET_UNKNOWN");

expectCode("Update without filter is rejected", contentList({
  listtype: "select",
  type: "edit",
  listdatas: [{ Columns: "Decimal5", Per: "0", Data: expression("1") }],
  wheres: [],
}), "approval", "CONTENTLIST_BROAD_MUTATION_FILTER_MISSING");

expectCode("Add requires at least one mapping", contentList({
  listtype: "select",
  type: "add",
  listdatas: [],
}), "approval", "CONTENTLIST_LISTDATAS_EMPTY");

expectCode("Unknown filter field is rejected", contentList({
  listtype: "select",
  type: "remove",
  wheres: equals("Text99"),
}), "data-list", "CONTENTLIST_WHERE_FIELD_UNKNOWN");

const documentLibraryFields = {
  Title: "text",
  Text4: "file",
  Text5: "text",
  Datetime1: "datetime",
  Decimal1: "number",
};
const documentAddMappings = [
  { Columns: "_Path", Per: "0", Data: [{ exprType: "variable", valueType: "text", id: "LeaveType", type: "expr", name: "Workflow Variables:Leave Type" }, { type: "op", op: "&" }, { type: "str", value: "/travel documents" }] },
  { Columns: "Title", Per: "0", Data: [{ exprType: "application", valueType: "string", id: "CurrentProcInstID", type: "expr", name: "Instance:Instance Id" }, { type: "op", op: "&" }, { type: "str", value: "-travel" }] },
  { Columns: "Text4", Per: "0", Data: [{ exprType: "variable", valueType: "file", id: "TravelDocument", type: "expr", name: "Workflow Variables:Travel Document" }] },
];
expectPass("Approval workflow adds a single attachment to a Document Library", contentList({
  listtype: "select",
  type: "add",
  listdatas: documentAddMappings,
}), "approval", { targetResourceType: "Document Library", targetFieldTypes: documentLibraryFields, targetFieldNames: Object.keys(documentLibraryFields) });

expectPass("Loop body adds each additional attachment to a Document Library", contentList({
  listtype: "select",
  type: "add",
  listdatas: [
    ...documentAddMappings.slice(0, 2),
    { Columns: "Text4", Per: "0", Data: [{ exprType: "loop_ctx", valueType: "string", key: "LoopItem", type: "expr", name: "Current Loop:Current object" }] },
  ],
}), "approval", { targetResourceType: 16, targetFieldTypes: documentLibraryFields, targetFieldNames: Object.keys(documentLibraryFields) });

expectPass("Document Library workflow updates its current document record", contentList({
  listtype: "current",
  type: "add",
  listdatas: [
    { Columns: "Text5", Per: "0", Data: [{ type: "str", value: "Active" }] },
    { Columns: "Datetime1", Per: "0", Data: expression("1") },
    { Columns: "Decimal1", Per: "1", Data: expression("1") },
  ],
}), "data-list", { targetResourceType: "Document Library", targetFieldTypes: documentLibraryFields, targetFieldNames: Object.keys(documentLibraryFields) });

expectCode("Document Library add requires Upload file", contentList({
  listtype: "select",
  type: "add",
  listdatas: documentAddMappings.filter((mapping) => mapping.Columns !== "Text4"),
}), "approval", "CONTENTLIST_DOCUMENT_LIBRARY_ADD_FIELD_MISSING", { targetResourceType: 16, targetFieldTypes: documentLibraryFields, targetFieldNames: Object.keys(documentLibraryFields) });

expectCode("Document Library add requires dynamic unique Title", contentList({
  listtype: "select",
  type: "add",
  listdatas: documentAddMappings.map((mapping) => mapping.Columns === "Title" ? { ...mapping, Data: [{ type: "str", value: "Travel document" }] } : mapping),
}), "approval", "CONTENTLIST_DOCUMENT_LIBRARY_TITLE_UNIQUENESS_UNPROVEN", { targetResourceType: 16, targetFieldTypes: documentLibraryFields, targetFieldNames: Object.keys(documentLibraryFields) });

expectCode("Document Library add rejects fixed text Upload file", contentList({
  listtype: "select",
  type: "add",
  listdatas: documentAddMappings.map((mapping) => mapping.Columns === "Text4" ? { ...mapping, Data: [{ type: "str", value: "not-a-file" }] } : mapping),
}), "approval", "CONTENTLIST_DOCUMENT_LIBRARY_UPLOAD_FILE_INVALID", { targetResourceType: 16, targetFieldTypes: documentLibraryFields, targetFieldNames: Object.keys(documentLibraryFields) });

console.log("workflow Set Data List golden-reference gates: pass (18 cases)");

#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { validatePackage } from "./validate-form-action-set-data-list.mjs";

const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "form-action-doclib-"));
try {
  const valid = validateSynthetic("valid", [pathMapping(), uploadMapping("file-upload")], 16);
  assert.equal(valid.status, "pass", JSON.stringify(valid, null, 2));

  expectCode("missing upload", [pathMapping()], 16, "FORM_ACTION_SET_DATA_LIST_DOCUMENT_LIBRARY_UPLOAD_REQUIRED");
  expectCode("multi-file", [uploadMapping("array")], 16, "FORM_ACTION_SET_DATA_LIST_DOCUMENT_LIBRARY_UPLOAD_MULTI_VALUE_UNSUPPORTED");
  expectCode("Data List _Path", [pathMapping(), { Per: "0", Columns: "Text1", Data: [{ type: "str", value: "Active" }] }], 1, "FORM_ACTION_SET_DATA_LIST_MAPPING_FIELD_UNRESOLVED");

  console.log(JSON.stringify({ status: "pass", test: "test-form-action-set-data-list-document-library-gates.mjs", cases: 4 }, null, 2));
} finally {
  fs.rmSync(workspace, { recursive: true, force: true });
}

function expectCode(label, mappings, targetType, code) {
  const report = validateSynthetic(label.replace(/\s+/g, "-"), mappings, targetType);
  assert.equal(report.status, "fail", `${label}: ${JSON.stringify(report, null, 2)}`);
  assert.ok(report.findings.some((finding) => finding.code === code), `${label}: expected ${code}`);
}

function validateSynthetic(name, mappings, targetType) {
  const targetId = targetType === 16 ? "9000000000000000003" : "9000000000000000002";
  const formdef = {
    actions: [{ id: "action-add-document", name: "Add document", steps: [{ type: "setdatalist", name: "Add travel document", attrs: { listtype: "select", type: "add", list: { AppID: 41, ListSetID: "9000000000000000001", ListID: targetId }, listdatas: mappings } }] }],
    children: [], tempVars: [],
  };
  const decoded = {
    Childs: [
      { List: { ListID: "9000000000000000004", Title: "Leave Usage Statistics", Type: 1 }, Fields: [], Layouts: [{ Type: 1, Title: "View Usage", LayoutInResources: [{ Resource: JSON.stringify(formdef) }] }] },
      { List: { ListID: targetId, Title: targetType === 16 ? "Travel request documents" : "Leave Usage Statistics", Type: targetType }, Fields: targetType === 16 ? [{ FieldName: "Text4", FieldType: "Text", Rules: "{\"isLabrary\":true}" }] : [{ FieldName: "Text1", FieldType: "Text", Rules: "{}" }], Layouts: [] },
    ],
  };
  const wrapper = { Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded))).toString("base64") };
  const file = path.join(workspace, `${name}.yapk`);
  fs.writeFileSync(file, JSON.stringify(wrapper));
  return validatePackage(file, { strictGenerated: true });
}

function pathMapping() { return { Per: "0", Columns: "_Path", Data: [{ type: "str", value: "Annual Leave/travel documents" }] }; }
function uploadMapping(valueType) { return { Per: "0", Columns: "Text4", Data: [{ exprType: "list_field", valueType, id: "TravelDocument", type: "expr" }] }; }

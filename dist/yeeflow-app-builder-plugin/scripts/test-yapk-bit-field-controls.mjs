#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "yapk-bit-field-controls-"));

try {
  const validPackage = writePackage("valid.yapk", {
    fieldType: "switch",
    defaultValue: "0",
    layoutType: "switch",
  });
  assert.equal(runValidator(validPackage).status, 0, "valid Bit/switch package passes");

  const invalidFieldType = writePackage("invalid-field-type.yapk", {
    fieldType: "input",
    defaultValue: "0",
    layoutType: "switch",
  });
  assertGate(invalidFieldType, "YAPK_BIT_FIELD_CONTROL_TYPE_INVALID");

  const invalidDefault = writePackage("invalid-default.yapk", {
    fieldType: "switch",
    defaultValue: "",
    layoutType: "switch",
  });
  assertGate(invalidDefault, "YAPK_BIT_DEFAULT_VALUE_INVALID");

  const invalidLayoutType = writePackage("invalid-layout-type.yapk", {
    fieldType: "switch",
    defaultValue: "0",
    layoutType: "input",
  });
  assertGate(invalidLayoutType, "YAPK_BIT_LAYOUT_CONTROL_TYPE_INVALID");

  const invalidLayoutJson = writePackage("invalid-layout-json.yapk", {
    fieldType: "switch",
    defaultValue: "0",
    layoutType: "switch",
    layoutView: "{not-json",
  });
  assertGate(invalidLayoutJson, "YAPK_BIT_LAYOUTVIEW_JSON_INVALID");

  console.log("YAPK Bit field control gates passed.");
} finally {
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
}

function assertGate(packagePath, expectedCode) {
  const result = runValidator(packagePath);
  assert.notEqual(result.status, 0, `${expectedCode} fixture fails`);
  assert.match(`${result.stdout}\n${result.stderr}`, new RegExp(expectedCode), `${expectedCode} is reported`);
}

function runValidator(packagePath) {
  return spawnSync(process.execPath, ["scripts/validate-yapk-bit-field-controls.mjs", "--package", packagePath], {
    cwd: ROOT,
    encoding: "utf8",
  });
}

function writePackage(fileName, options) {
  const decoded = buildDecodedPackage(options);
  const resource = zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64");
  const wrapper = {
    Name: "Bit Field Control Test",
    AppID: "41",
    TenantID: "fixture-tenant",
    ListID: "100",
    Resource: resource,
    PortalInfo: null,
  };
  const packagePath = path.join(TEMP_DIR, fileName);
  fs.writeFileSync(packagePath, JSON.stringify(wrapper, null, 2));
  return packagePath;
}

function buildDecodedPackage({ fieldType, defaultValue, layoutType, layoutView }) {
  const layoutPayload = layoutView ?? JSON.stringify({
    layout: [
      { FieldID: "101", FieldName: "Title", DisplayName: "Title", Type: "input", Order: 1, Mobile: 2, Show: true },
      { FieldID: "102", FieldName: "Bit1", DisplayName: "Requires Approval", Type: layoutType, Order: 2, Mobile: 2, Show: true },
    ],
    query: [
      { FieldID: "101", FieldName: "Title", field: "Title" },
      { FieldID: "102", FieldName: "Bit1", field: "Bit1" },
    ],
  });
  return {
    ListSet: { ListSetID: "100", Title: "Bit Field Control Test", Type: 103, LayoutView: { sort: [] } },
    Childs: [
      {
        List: { ListID: "200", Title: "Requests", Type: 1, LayoutView: "" },
        Fields: [
          { FieldID: "101", ListID: "200", FieldName: "Title", InternalName: "Title", FieldType: "Text", Type: "input", DefaultValue: "", DisplayName: "Title", Status: 0, IsSystem: true, IsIndex: true },
          { FieldID: "102", ListID: "200", FieldName: "Bit1", InternalName: "Bit1", FieldType: "Bit", Type: fieldType, DefaultValue: defaultValue, DisplayName: "Requires Approval", Status: 1, IsSystem: false, IsIndex: false },
        ],
        Layouts: [
          {
            ListID: "200",
            LayoutID: "300",
            Title: "Default View",
            Type: 0,
            IsDefault: true,
            Ext1: JSON.stringify({ Url: "default" }),
            LayoutView: layoutPayload,
          },
        ],
      },
    ],
    Forms: [],
    Pages: [],
  };
}

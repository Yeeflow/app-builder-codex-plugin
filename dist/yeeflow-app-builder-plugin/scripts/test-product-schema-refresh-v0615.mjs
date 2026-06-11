#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const GZIP_PREFIX = "[______gizp______]";

function runSchema(file) {
  return spawnSync(process.execPath, ["scripts/validate-standard-package-schema.mjs", file], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
}

function expectPass(label, file) {
  const result = runSchema(file);
  assert.equal(result.status, 0, `${label} failed\n${result.stdout}\n${result.stderr}`);
}

function expectFailure(label, file, code) {
  const result = runSchema(file);
  assert.notEqual(result.status, 0, `${label} should fail`);
  assert.match(`${result.stdout}\n${result.stderr}`, new RegExp(code), `${label} should report ${code}`);
}

function yapField({ fieldName, fieldType, index, system = false, type = "input", displayName = fieldName }) {
  const fieldIdOffset = [...fieldName].reduce((total, ch) => total + ch.charCodeAt(0), 0);
  return {
    FieldID: 2000 + fieldIdOffset,
    ListID: 1001,
    FieldName: fieldName,
    FieldType: fieldType,
    FieldIndex: index,
    DisplayName: displayName,
    InternalName: fieldName,
    Type: type,
    IsSystem: system,
    Status: system ? 0 : 1,
    Category: 1,
    Rules: "{}",
  };
}

function yapWrapper(fields) {
  const listModel = (listId, title, type) => ({
    TenantID: 9001,
    AppID: 41,
    ListID: listId,
    Title: title,
    Description: "",
    Status: 1,
    IsItemPerm: false,
    IsVerRecord: false,
    HasComment: false,
    IconUrl: "",
    TableCode: "flowcraft",
    IndexCode: "flowcraft",
    Created: "2026-06-10T00:00:00Z",
    Modified: "2026-06-10T00:00:00Z",
    CreatedBy: 9001,
    ModifiedBy: 9001,
    Perm: 0,
    Type: type,
    Flags: 1,
    CustomType: "",
    LayoutView: "{}",
  });
  const data = {
    Item: {
      ListModel: listModel(1000, "Schema Refresh YAP", 1024),
      Defs: [],
      Layouts: [],
    },
    Childs: [{
      ListModel: listModel(1001, "Requests", 1),
      Defs: fields,
      Layouts: [],
    }],
    Forms: [],
    DataReports: [],
    FormNewReports: [],
    AppGroups: [],
    AppTags: [],
    AppMetadatas: [],
    AppThemes: [],
    AppComponents: [],
    PortalInfo: {
      ID: 3001,
      Type: 1,
      Name: "Schema Refresh Portal",
      Description: "",
    },
    OtherModules: [],
  };
  const resource = {
    MainListType: 1024,
    AppID: 41,
    ReplaceIds: [],
    ReportIds: [],
    FormKeys: [],
    Data: JSON.stringify(data),
    SimplePortal: {
      ID: 3001,
      Domain: "",
    },
  };
  return {
    Title: "Schema Refresh YAP",
    Description: "",
    IconUrl: "",
    IsListSet: true,
    Resource: `${GZIP_PREFIX}${zlib.gzipSync(Buffer.from(JSON.stringify(resource), "utf8")).toString("base64")}`,
  };
}

function yapkList(id, title, type = 1) {
  return {
    ListID: id,
    Title: title,
    Description: "",
    Status: 1,
    IsItemPerm: false,
    IsVerRecord: false,
    HasComment: false,
    IconUrl: "",
    TableCode: "flowcraft",
    Type: type,
    Flags: 1,
    IndexCode: "flowcraft",
  };
}

function yapkField({ fieldId, listId, fieldName, fieldType, index, system = false, type = "input", displayName = fieldName }) {
  return {
    FieldID: fieldId,
    ListID: listId,
    FieldName: fieldName,
    FieldType: fieldType,
    FieldIndex: index,
    DisplayName: displayName,
    InternalName: fieldName,
    Type: type,
    Status: system ? 0 : 1,
    Category: 1,
    Rules: "{}",
    IsSort: false,
    IsSystem: system,
    IsUnique: false,
  };
}

function portalInfo() {
  return {
    ID: 3001,
    Type: 1,
    Name: "Schema Refresh Portal",
    Description: "",
    IconUrl: "",
    LogoUrl: "",
    Settings: "{}",
    Flag: 0,
    Status: 1,
    DefaultGroupId: 0,
    Domain: "",
    Groups: [],
    Resources: [],
    Perms: [],
  };
}

function yapkWrapper(decoded) {
  return {
    PackageId: "schema-refresh-v0617",
    TenantID: "9001",
    AppID: 41,
    ListID: "1000",
    Title: "Schema Refresh YAPK",
    Description: "",
    IconUrl: "",
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64"),
    Notes: "",
    Author: "regression",
    Date: "2026-06-10T00:00:00Z",
    Version: "0.0.0-test",
    Sign: Buffer.alloc(32).toString("base64"),
  };
}

function validYapkDecoded() {
  return {
    ListSet: yapkList(1000, "Schema Refresh App", 1024),
    Pages: [],
    Forms: [],
    FormNewReports: [],
    DataReports: [],
    Groups: [],
    Tags: [],
    Metadatas: [],
    Agents: [],
    Connections: [],
    Knowledges: [],
    Themes: [],
    Components: [],
    Childs: [{
      List: yapkList(1001, "Requests"),
      Fields: [
        yapkField({ fieldId: 2000, listId: 1001, fieldName: "Title", fieldType: "Text", index: 0, system: true }),
        yapkField({ fieldId: 2001, listId: 1001, fieldName: "Text1", fieldType: "Text", index: 1, displayName: "Business Label" }),
        yapkField({ fieldId: 2002, listId: 1001, fieldName: "Bit1", fieldType: "Bit", index: 1, type: "switch", displayName: "Approved" }),
        yapkField({ fieldId: 2003, listId: 1001, fieldName: "Decimal1", fieldType: "Decimal", index: 1, type: "input_number", displayName: "Budget" }),
        yapkField({ fieldId: 2004, listId: 1001, fieldName: "Datetime1", fieldType: "Datetime", index: 1, type: "datepicker", displayName: "Due Date" }),
      ],
      Layouts: [],
      RemindRules: [],
      PublicForms: [],
      FlowMappings: [],
    }],
  };
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "schema-refresh-v0617-"));
try {
  const validYapFields = [
    yapField({ fieldName: "Title", fieldType: "Text", index: 0, system: true }),
    yapField({ fieldName: "Text1", fieldType: "Text", index: 1, displayName: "Text Label" }),
    yapField({ fieldName: "Decimal1", fieldType: "Decimal", index: 1, type: "input_number", displayName: "Budget" }),
    yapField({ fieldName: "Bit1", fieldType: "Bit", index: 1, type: "switch", displayName: "Approved" }),
    yapField({ fieldName: "Datetime1", fieldType: "Datetime", index: 1, type: "datepicker", displayName: "Due Date" }),
  ];

  const validYap = path.join(tmp, "valid-fields.yap");
  fs.writeFileSync(validYap, `${JSON.stringify(yapWrapper(validYapFields))}\n`);
  expectPass("valid YAP custom fields", validYap);

  const legacyDateTimeYap = path.join(tmp, "legacy-datetime-field.yap");
  fs.writeFileSync(legacyDateTimeYap, `${JSON.stringify(yapWrapper([
    yapField({ fieldName: "Title", fieldType: "Text", index: 0, system: true }),
    yapField({ fieldName: "DateTime1", fieldType: "DateTime", index: 1, type: "datepicker", displayName: "Legacy Date" }),
  ]))}\n`);
  expectFailure("legacy DateTime YAP field rejected", legacyDateTimeYap, "enum");

  const semanticDateYap = path.join(tmp, "semantic-date-field.yap");
  fs.writeFileSync(semanticDateYap, `${JSON.stringify(yapWrapper([
    yapField({ fieldName: "Title", fieldType: "Text", index: 0, system: true }),
    yapField({ fieldName: "StartDate", fieldType: "Datetime", index: 1, type: "datepicker", displayName: "Start Date" }),
  ]))}\n`);
  expectFailure("semantic Datetime FieldName rejected", semanticDateYap, "YAP_CUSTOM_FIELDNAME_SCHEMA_MISMATCH");

  const businessNameYap = path.join(tmp, "business-name-field.yap");
  fs.writeFileSync(businessNameYap, `${JSON.stringify(yapWrapper([
    yapField({ fieldName: "Title", fieldType: "Text", index: 0, system: true }),
    yapField({ fieldName: "Budget", fieldType: "Decimal", index: 1, type: "input_number" }),
  ]))}\n`);
  expectFailure("custom FieldName uses business label", businessNameYap, "YAP_CUSTOM_FIELDNAME_SCHEMA_MISMATCH");

  const badTitleYap = path.join(tmp, "bad-title.yap");
  fs.writeFileSync(badTitleYap, `${JSON.stringify(yapWrapper([
    yapField({ fieldName: "Title", fieldType: "Text", index: 1, system: false }),
  ]))}\n`);
  expectFailure("Title field missing system metadata", badTitleYap, "YAP_TITLE_FIELD_SYSTEM_METADATA_INVALID");

  const badIndexYap = path.join(tmp, "bad-index.yap");
  fs.writeFileSync(badIndexYap, `${JSON.stringify(yapWrapper([
    yapField({ fieldName: "Title", fieldType: "Text", index: 0, system: true }),
    yapField({ fieldName: "Bit51", fieldType: "Bit", index: 51, type: "switch" }),
  ]))}\n`);
  expectFailure("Bit FieldIndex above schema range", badIndexYap, "YAP_FIELDINDEX_OUT_OF_RANGE");

  const validYapk = path.join(tmp, "valid-required-metadata.yapk");
  fs.writeFileSync(validYapk, `${JSON.stringify(yapkWrapper(validYapkDecoded()))}\n`);
  expectPass("valid YAPK required metadata", validYapk);

  const legacyDateTimeYapkDecoded = validYapkDecoded();
  legacyDateTimeYapkDecoded.Childs[0].Fields[4].FieldName = "DateTime1";
  legacyDateTimeYapkDecoded.Childs[0].Fields[4].FieldType = "DateTime";
  const legacyDateTimeYapk = path.join(tmp, "legacy-datetime-field.yapk");
  fs.writeFileSync(legacyDateTimeYapk, `${JSON.stringify(yapkWrapper(legacyDateTimeYapkDecoded))}\n`);
  expectFailure("legacy DateTime YAPK field rejected", legacyDateTimeYapk, "enum");

  const missingListField = validYapkDecoded();
  delete missingListField.Childs[0].List.Description;
  delete missingListField.Childs[0].Fields[1].Rules;
  const invalidYapk = path.join(tmp, "missing-required-metadata.yapk");
  fs.writeFileSync(invalidYapk, `${JSON.stringify(yapkWrapper(missingListField))}\n`);
  expectFailure("YAPK missing required metadata", invalidYapk, "required");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log("product schema refresh v0.6.17 Datetime regression tests passed");

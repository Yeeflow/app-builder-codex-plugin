#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { loadYapkSchemaEffective } = require("./lib/load-yapk-schema.js");

const canonical = JSON.parse(fs.readFileSync(path.join(ROOT, "schemas/yapk-schema.json"), "utf8"));
const dist = JSON.parse(fs.readFileSync(path.join(ROOT, "dist/yeeflow-app-builder-plugin/schemas/yapk-schema.json"), "utf8"));
const overlay = JSON.parse(fs.readFileSync(path.join(ROOT, "schemas/yapk-schema-codex.json"), "utf8"));
const yap = JSON.parse(fs.readFileSync(path.join(ROOT, "schemas/yap-schema.json"), "utf8"));
const effective = loadYapkSchemaEffective({ startDir: path.join(ROOT, "scripts") });

assert.deepEqual(canonical, dist, "source and dist canonical YAPK schemas must match");
assert.equal(canonical.$id, "https://akmii.local/schemas/listset-package-info.schema.json");
assert.equal(canonical.title, "AppExportPackageInfo");
assert.deepEqual(canonical.required, ["PackageId", "TenantID", "AppID", "ListID", "Title", "Description", "IconUrl", "Resource", "Notes", "Author", "Date", "Version", "Sign"]);
assert.deepEqual(canonical.$defs.AppPackageInfo.required, ["ListSet", "Pages", "Childs"]);
assert.deepEqual(canonical.$defs.ListFieldInfo.properties.FieldType.enum, ["Text", "Bit", "Decimal", "Datetime"]);
assert.equal(canonical.$defs.ListFieldInfo.properties.FieldType.enum.includes("DateTime"), false);
assert.equal(JSON.stringify(canonical).includes("^(Text|Bit|Decimal|Datetime)[1-9]\\\\d*$"), true);
assert.deepEqual(canonical.$defs.ListFieldInfo["x-fieldIndexRangeByFieldType"], {
  Text: { min: 1, max: 300 },
  Bit: { min: 1, max: 50 },
  Decimal: { min: 1, max: 200 },
  Datetime: { min: 1, max: 200 },
});
assert.ok(canonical["x-rules"]?.GlobalPackageIdGeneration, "GlobalPackageIdGeneration rule must exist");
assert.ok(canonical["x-conditionalConstraints"]?.byAppID, "byAppID conditional constraints must exist");
assert.equal(Object.prototype.hasOwnProperty.call(canonical, "x-yeeflow-standard-additions"), false);
assert.ok(overlay["x-yeeflow-standard-additions"], "Codex overlay additions must remain separate");
assert.ok(effective["x-yeeflow-standard-additions"], "effective loader must expose Codex additions");
assert.deepEqual(findEnum(yap, "FieldType"), ["Text", "Bit", "Decimal", "Datetime"], "YAP schema remains on v0.6.17 Datetime enum");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yapk-schema-v0618-"));
try {
  const minimal = writePackage("minimal-canonical", minimalDecoded());
  expectPass("minimal canonical YAPK without optional modules", minimal, ["--schema-only"]);
  expectFailure("minimal canonical YAPK fails internal completeness without FormNewReports", minimal, [], "FORMNEWREPORTS_REQUIRED");

  const validDatetime = fullDecoded();
  const validDatetimeFile = writePackage("valid-datetime", validDatetime);
  expectPass("valid Datetime package", validDatetimeFile);

  const legacyDateTime = fullDecoded();
  legacyDateTime.Childs[0].Fields[1].FieldName = "DateTime1";
  legacyDateTime.Childs[0].Fields[1].FieldType = "DateTime";
  expectFailure("legacy DateTime rejected", writePackage("legacy-datetime", legacyDateTime), [], "enum");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log("YAPK schema refresh v0.6.18 tests passed");

function findEnum(node, key) {
  if (!node || typeof node !== "object") return null;
  if (node.properties?.[key]?.enum) return node.properties[key].enum;
  for (const value of Object.values(node)) {
    const found = findEnum(value, key);
    if (found) return found;
  }
  return null;
}

function runValidator(file, args = []) {
  return spawnSync(process.execPath, ["scripts/validate-standard-package-schema.mjs", file, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
}

function expectPass(label, file, args = []) {
  const result = runValidator(file, args);
  assert.equal(result.status, 0, `${label} failed\n${result.stdout}\n${result.stderr}`);
}

function expectFailure(label, file, args = [], pattern = "fail") {
  const result = runValidator(file, args);
  assert.notEqual(result.status, 0, `${label} should fail`);
  assert.match(`${result.stdout}\n${result.stderr}`, new RegExp(pattern));
}

function writePackage(name, decoded) {
  const file = path.join(tempDir, `${name}.yapk`);
  fs.writeFileSync(file, `${JSON.stringify(wrapper(decoded))}\n`);
  return file;
}

function wrapper(decoded) {
  return {
    PackageId: "schema-v0618-test",
    TenantID: "1700000000002999",
    AppID: 41,
    ListID: "1700000000002001",
    Title: "Schema v0.6.18 Test",
    Description: "",
    IconUrl: "",
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64"),
    Notes: "",
    Author: "regression",
    Date: "2026-06-10T00:00:00Z",
    Version: "0.0.0-test",
    Sign: Buffer.alloc(32, 1).toString("base64"),
  };
}

function minimalDecoded() {
  return {
    ListSet: listInfo("Schema v0.6.18 Minimal"),
    Pages: [],
    Childs: [],
  };
}

function fullDecoded() {
  const childListId = "1700000000002002";
  return {
    ListSet: listInfo("Schema v0.6.18 Full"),
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
      List: listInfo("Tasks", childListId),
      Fields: [
        field("Title", "Text", 0, "input", true, childListId),
        field("Datetime1", "Datetime", 1, "datepicker", false, childListId),
      ],
      Layouts: [],
      RemindRules: [],
      PublicForms: [],
      FlowMappings: [],
    }],
  };
}

function listInfo(title, listId = "1700000000002001") {
  return {
    ListID: listId,
    Title: title,
    Description: "",
    Status: 1,
    IsItemPerm: false,
    IsVerRecord: false,
    HasComment: false,
    IconUrl: "",
    TableCode: "flowcraft",
    Type: 1024,
    Flags: 1,
    IndexCode: "flowcraft",
  };
}

function field(fieldName, fieldType, index, type, system, listId) {
  return {
    FieldID: `1700000000003${String(index).padStart(3, "0")}`,
    ListID: listId,
    FieldName: fieldName,
    InternalName: fieldName,
    DisplayName: fieldName === "Title" ? "Title" : "Due Date",
    FieldType: fieldType,
    Type: type,
    FieldIndex: index,
    IsSystem: system,
    IsUnique: false,
    IsSort: false,
    Category: system ? 0 : 1,
    Status: 1,
    DefaultValue: "",
    Rules: "{}",
  };
}

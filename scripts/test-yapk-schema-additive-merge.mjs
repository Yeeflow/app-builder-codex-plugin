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
const canonicalPath = path.join(ROOT, "schemas/yapk-schema.json");
const distPath = path.join(ROOT, "dist/yeeflow-app-builder-plugin/schemas/yapk-schema.json");
const overlayPath = path.join(ROOT, "schemas/yapk-schema-codex.json");
const distOverlayPath = path.join(ROOT, "dist/yeeflow-app-builder-plugin/schemas/yapk-schema-codex.json");

const canonical = JSON.parse(fs.readFileSync(canonicalPath, "utf8"));
const dist = JSON.parse(fs.readFileSync(distPath, "utf8"));
const overlay = JSON.parse(fs.readFileSync(overlayPath, "utf8"));
const distOverlay = JSON.parse(fs.readFileSync(distOverlayPath, "utf8"));
const effective = loadYapkSchemaEffective({ startDir: path.join(ROOT, "scripts") });

assert.deepEqual(canonical, dist, "source and dist YAPK schemas must match");
assert.deepEqual(overlay, distOverlay, "source and dist YAPK Codex overlays must match");
assert.equal(canonical.title, "AppExportPackageInfo");
assert.deepEqual(canonical.properties.AppID.enum, [30, 41]);
assert.deepEqual(canonical.$defs.ListInfo.properties.TableCode.enum, ["setting_c", "flowcraft"]);
assert.deepEqual(canonical.$defs.ListInfo.properties.IndexCode.enum, ["setting_c", "flowcraft"]);
assert.deepEqual(canonical.$defs.ListGroupInfo.required, ["ID", "Code", "Name", "Description"]);
assert.deepEqual(canonical.$defs.MetadataCategoryInfo.required, ["CategoryID", "Name", "Code", "Status"]);
assert.deepEqual(canonical.$defs.MetadataInfo.required, ["ID", "ParentID", "Name", "Code", "Status", "Description"]);
assert.deepEqual(canonical.$defs.AppPackageInfo.required, ["ListSet", "Pages", "Childs"]);
assert.equal(canonical.$defs.AppPackageInfo.required.includes("FormNewReports"), false);
assert.equal(canonical.$defs.AppPackageInfo.required.includes("Forms"), false);
assert.equal(canonical.$defs.AppPackageInfo.required.includes("DataReports"), false);
assert.equal(Boolean(canonical.$defs.AppPackageInfo.properties.FormReports), false, "canonical product schema stays unmodified");
assert.equal(Boolean(canonical.$defs.AppPackageInfo.properties.PortalInfo), false, "canonical product schema must not keep removed PortalInfo property");
assert.equal(Boolean(canonical["x-yeeflow-standard-additions"]), false, "canonical YAPK schema must not contain Codex additions");
assert.ok(overlay["x-yeeflow-standard-additions"], "Codex additions are preserved in the overlay");
assert.ok(effective["x-yeeflow-standard-additions"], "effective YAPK schema exposes Codex additions");
assert.equal(Boolean(effective.$defs.AppPackageInfo.properties.FormReports), false, "effective schema does not re-add legacy FormReports unless product schema requires compatibility");
assert.ok(canonical["x-conditionalConstraints"]?.byAppID?.["41"], "AppID 41 conditional is preserved");
assert.ok(canonical["x-conditionalConstraints"]?.byAppID?.["30"], "AppID 30 conditional is preserved");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yapk-schema-additive-merge-"));
try {
  expectPass("valid package with group and metadata", writePackage("valid", baseDecoded()));

  const missingGroupName = baseDecoded();
  delete missingGroupName.Groups[0].Name;
  expectSchemaFailure("group missing Name", writePackage("group-missing-name", missingGroupName));

  const missingMetadataCategoryStatus = baseDecoded();
  delete missingMetadataCategoryStatus.Metadatas[0].Status;
  expectSchemaFailure("metadata category missing Status", writePackage("metadata-category-missing-status", missingMetadataCategoryStatus));

  const missingMetadataCode = baseDecoded();
  delete missingMetadataCode.Metadatas[0].Metadatas[0].Code;
  expectSchemaFailure("metadata missing Code", writePackage("metadata-missing-code", missingMetadataCode));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log("YAPK schema additive merge tests passed");

function expectPass(label, file) {
  const result = runSchemaValidator(file);
  assert.equal(result.status, 0, `${label} failed\n${result.stdout}\n${result.stderr}`);
}

function expectSchemaFailure(label, file) {
  const result = runSchemaValidator(file);
  assert.notEqual(result.status, 0, `${label} should fail schema validation`);
  assert.match(`${result.stdout}\n${result.stderr}`, /"code": "required"/);
  assert.match(`${result.stdout}\n${result.stderr}`, /Required property is missing/);
}

function runSchemaValidator(file) {
  return spawnSync(process.execPath, ["scripts/validate-standard-package-schema.mjs", file], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
}

function writePackage(name, decoded) {
  const file = path.join(tempDir, `${name}.yapk`);
  fs.writeFileSync(file, `${JSON.stringify(wrapper(decoded))}\n`);
  return file;
}

function wrapper(decoded) {
  return {
    PackageId: "schema-additive-merge-test",
    TenantID: "9100",
    AppID: 41,
    ListID: "9101",
    Title: "Schema Additive Merge Test",
    Description: "",
    IconUrl: "",
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64"),
    Notes: "",
    Author: "regression",
    Date: "2026-06-05T00:00:00Z",
    Version: "0.0.0-test",
    Sign: Buffer.alloc(32).toString("base64"),
  };
}

function baseDecoded() {
  return {
    ListSet: {
      ListID: 9101,
      Title: "Schema Additive Merge Test",
      Description: "",
      Status: 1,
      IsItemPerm: false,
      IsVerRecord: false,
      HasComment: false,
      IconUrl: "",
      Flags: 1,
      TableCode: "flowcraft",
      Type: 1024,
      IndexCode: "flowcraft",
    },
    Pages: [],
    Forms: [],
    FormNewReports: [],
    DataReports: [],
    Groups: [{ ID: 1, Code: "builders", Name: "Builders", Description: "" }],
    Tags: [],
    Metadatas: [{
      CategoryID: "9201",
      Name: "Priority",
      Code: "priority",
      Description: "",
      Ext: "{}",
      Status: 1,
      Metadatas: [{
        ID: "9202",
        ParentID: "9201",
        Name: "High",
        Description: "",
        Code: "high",
        Ext: "{}",
        Status: 1,
      }],
    }],
    Agents: [],
    Connections: [],
    Knowledges: [],
    Themes: [],
    Components: [],
    Childs: [],
  };
}

#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const GZIP_PREFIX = "[______gizp______]";
const canonicalFiles = [
  "schemas/yapk-schema.json",
  "schemas/yap-schema.json",
  "dist/yeeflow-app-builder-plugin/schemas/yapk-schema.json",
  "dist/yeeflow-app-builder-plugin/schemas/yap-schema.json",
];

for (const file of canonicalFiles) {
  assert.equal(fs.existsSync(path.join(ROOT, file)), true, `${file} exists`);
  JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
}

assert.deepEqual(
  JSON.parse(fs.readFileSync("schemas/yapk-schema.json", "utf8")),
  JSON.parse(fs.readFileSync("dist/yeeflow-app-builder-plugin/schemas/yapk-schema.json", "utf8")),
);
assert.deepEqual(
  JSON.parse(fs.readFileSync("schemas/yap-schema.json", "utf8")),
  JSON.parse(fs.readFileSync("dist/yeeflow-app-builder-plugin/schemas/yap-schema.json", "utf8")),
);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "canonical-schema-test-"));
try {
  const yapFile = path.join(tempDir, "canonical-valid.yap");
  const ypkFile = path.join(tempDir, "canonical-valid.yapk");
  const invalidYapFile = path.join(tempDir, "yapk-wrapper-in-yap.yap");
  const invalidYapkFile = path.join(tempDir, "yap-wrapper-in-yapk.yapk");

  fs.writeFileSync(yapFile, `${JSON.stringify(makeYapWrapper())}\n`);
  fs.writeFileSync(ypkFile, `${JSON.stringify(makeYapkWrapper())}\n`);
  fs.writeFileSync(invalidYapFile, `${JSON.stringify(makeYapkWrapper())}\n`);
  fs.writeFileSync(invalidYapkFile, `${JSON.stringify(makeYapWrapper())}\n`);

  const yapResult = run(["scripts/validate-standard-package-schema.mjs", yapFile]);
  assert.equal(yapResult.status, 0, yapResult.stdout + yapResult.stderr);
  assert.match(yapResult.stdout, /yap-schema\.json/);

  const yapkResult = run(["scripts/validate-standard-package-schema.mjs", ypkFile]);
  assert.equal(yapkResult.status, 0, yapkResult.stdout + yapkResult.stderr);
  assert.match(yapkResult.stdout, /yapk-schema\.json/);

  const invalidYapResult = run(["scripts/validate-standard-package-schema.mjs", invalidYapFile]);
  assert.notEqual(invalidYapResult.status, 0, "YAP validator rejects YAPK-style wrapper/resource.");

  const invalidYapkResult = run(["scripts/validate-standard-package-schema.mjs", invalidYapkFile]);
  assert.notEqual(invalidYapkResult.status, 0, "YAPK validator rejects YAP-style wrapper/resource.");

  const activeReferenceScan = run([
    "-e",
    `
const fs = require("fs");
const path = require("path");
const roots = ["scripts", "skills/installed", "dist/yeeflow-app-builder-plugin/scripts", "dist/yeeflow-app-builder-plugin/skills"];
const banned = /(?:yapk-schema_v\\d+|yap-schema_v\\d+|\\/Downloads\\/yapk-schema|\\/Downloads\\/yap-schema)/;
const hits = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\\.(?:mjs|js|md|yaml|yml)$/.test(file)) {
      const text = fs.readFileSync(file, "utf8");
      if (banned.test(text)) hits.push(file);
    }
  }
}
roots.forEach(walk);
if (hits.length) {
  console.error(hits.join("\\n"));
  process.exit(1);
}
`,
  ]);
  assert.equal(activeReferenceScan.status, 0, activeReferenceScan.stderr);

  for (const doc of ["README.md", "docs/README.md", "docs/yeeflow-app-builder-plugin.md", "docs/yeeflow-application-package-generation-rules.md"]) {
    const text = fs.readFileSync(doc, "utf8");
    assert.match(text, /schemas\/yapk-schema\.json/);
    assert.match(text, /schemas\/yap-schema\.json/);
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log("canonical schema file tests passed");

function run(args) {
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function makeYapWrapper() {
  const data = {
    Item: {
      ListModel: {
        TenantID: 1000,
        AppID: 41,
        ListID: 1001,
        Title: "Canonical YAP",
        Description: "Canonical YAP schema fixture.",
        Status: 1,
        IsItemPerm: false,
        IsVerRecord: false,
        HasComment: false,
        IconUrl: "",
        Type: 1024,
        Flags: 1,
        TableCode: "flowcraft",
        IndexCode: "flowcraft",
        Created: "2026-06-01T00:00:00Z",
        Modified: "2026-06-01T00:00:00Z",
        CreatedBy: 1000,
        ModifiedBy: 1000,
        Perm: 0,
        CustomType: "",
        LayoutView: "{}",
      },
      Defs: [],
      Layouts: [],
    },
    Childs: [],
    Forms: [],
    DataReports: [],
    FormNewReports: [],
    AppGroups: [],
    AppTags: [],
    AppMetadatas: [],
    AppThemes: [],
    AppComponents: [],
    PortalInfo: {
      ID: 1002,
      Type: 1,
      Name: "Canonical Portal",
      Description: "Canonical portal placeholder.",
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
      ID: 1002,
      Domain: "canonical",
    },
  };
  return {
    Title: "Canonical YAP",
    Description: "",
    IconUrl: "",
    IsListSet: true,
    Resource: `${GZIP_PREFIX}${zlib.gzipSync(Buffer.from(JSON.stringify(resource), "utf8")).toString("base64")}`,
  };
}

function makeYapkWrapper() {
  const decoded = {
    ListSet: {
      ListID: 1700000000002001,
      Title: "Canonical YAPK",
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
    },
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
    Childs: [],
  };
  return {
    PackageId: "canonical-schema-test",
    TenantID: "1700000000002999",
    AppID: 41,
    ListID: "1700000000002001",
    Title: "Canonical YAPK",
    Description: "",
    IconUrl: "",
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64"),
    Notes: "",
    Author: "regression",
    Date: "2026-06-01T00:00:00Z",
    Version: "0.0.0-test",
    Sign: Buffer.alloc(32).toString("base64"),
  };
}

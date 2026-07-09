#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { materializeFullAppGeneratedFinal } from "./materialize-full-app-generated-final.mjs";
import { readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "document-library-materialization-gate-"));

function write(file, content) {
  fs.writeFileSync(file, `${content.trim()}\n`, "utf8");
  return file;
}

function navigationItems(decoded) {
  const layoutView = JSON.parse(decoded.ListSet?.LayoutView || decoded.Item?.ListModel?.LayoutView || "{}");
  return (layoutView.sort || []).flatMap((group) => group.list || []);
}

try {
  const specPath = write(path.join(tempDir, "functional-specification.md"), `
# Functional Specification: Internal Audit Document Library Regression

Build an internal audit management app with a document register data list and a native document library for audit evidence files.
`);

  const planPath = write(path.join(tempDir, "yeeflow-app-plan.md"), `
# Internal Audit Workflow Management - Yeeflow App Plan

## 1. Plan Status
Business defaults approval status: user-default-approved-for-generation.

## 4. Data Lists and Document Libraries Plan

### 4.1 Audit Document Register
- Resource type: Data List
- Business purpose: Track approved audit document metadata and lifecycle status.

| Field label | Field name | Field type | Purpose |
| --- | --- | --- | --- |
| Document Title | Title | Text | Native document register title. |
| Document Type | Text1 | Choice | Policy, Evidence, Report. |
| Approval Status | Text2 | Choice | Draft, Approved, Retired. |

### 4.2 Audit Evidence Library
- Resource type: Document Library
- Business purpose: Store native uploaded audit evidence documents and final audit reports.

## 15. Application Navigation Plan
| Group | Item | Target Resource | Yeeflow Resource Type | Icon |
| --- | --- | --- | --- | --- |
| Audit Workspace | Audit Document Register | Audit Document Register | Data List | fa-regular fa-table-list |
| Audit Workspace | Audit Evidence Library | Audit Evidence Library | Document library | fa-regular fa-folder-open |
`);

  const apiIdManifestPath = path.join(tempDir, "api-issued-ids.json");
  fs.writeFileSync(apiIdManifestPath, `${JSON.stringify({
    ids: Array.from({ length: 300 }, (_, index) => String(980000000000000000n + BigInt(index))),
  }, null, 2)}\n`);

  const report = materializeFullAppGeneratedFinal({
    functionalSpec: specPath,
    appPlan: planPath,
    outDir: path.join(tempDir, "dist"),
    apiIdManifest: apiIdManifestPath,
    tenantId: "980000000000099999",
    cwd: tempDir,
  });

  assert.equal(report.status, "pass", JSON.stringify(report.findings || [], null, 2));
  const { decoded } = readDecodedYapk(report.outputs.package);
  const childByTitle = new Map((decoded.Childs || []).map((child) => [child.List?.Title, child]));
  const register = childByTitle.get("Audit Document Register");
  const library = childByTitle.get("Audit Evidence Library");
  assert.ok(register, "planned data list must materialize");
  assert.ok(library, "planned document library must materialize");
  assert.equal(Number(register.List?.Type), 1, "document register must remain a Type 1 data list");
  assert.equal(Number(library.List?.Type), 16, "document library must materialize as native Type 16");
  assert.ok((library.Fields || []).some((field) => field.FieldName === "Text4" && field.Type === "file-upload"), "document library must include native Upload File field");

  const nav = navigationItems(decoded);
  assert.ok(nav.some((item) => item.Title === "Audit Document Register" && Number(item.Type) === 1), "data-list navigation item must be Type 1");
  assert.ok(nav.some((item) => item.Title === "Audit Evidence Library" && Number(item.Type) === 16), "document-library navigation item must be Type 16");

  console.log(JSON.stringify({
    status: "pass",
    cases: [
      "App Plan Document Library rows materialize as Type 16 child resources",
      "Document Libraries are not downgraded to Data Lists with file-upload fields",
      "Document Library navigation uses Type 16",
      "Document Library default upload field is present",
    ],
  }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

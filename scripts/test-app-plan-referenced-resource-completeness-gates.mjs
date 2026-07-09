#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { materializeFullAppGeneratedFinal } from "./materialize-full-app-generated-final.mjs";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "app-plan-referenced-resource-completeness-"));

function write(file, content) {
  fs.writeFileSync(file, `${content.trim()}\n`);
  return file;
}

try {
  const specPath = write(path.join(tempDir, "functional-specification.md"), `
# Functional Specification: Referenced Resource Completeness Regression

Generate a data list with a lookup field whose target resource was accidentally omitted from the App Plan resource list.
Business defaults approval status: user-default-approved-for-generation.
`);

  const planPath = write(path.join(tempDir, "yeeflow-app-plan.md"), `
# Referenced Resource Completeness Regression - Yeeflow App Plan

## 1. Plan Status
Business defaults approval status: user-default-approved-for-generation.

## 4. Data Lists and Document Libraries Plan

### 4.1 Audit Observations
- Resource type: Data list

#### Fields
| Field label | Field name | Field type | Control type | Lookup Target | Purpose |
| --- | --- | --- | --- | --- | --- |
| Observation Title | Title | Text | input | | Native title |
| Risk Category | Text1 | Text | lookup | Risk Categories | Classify risk |

## 15. Application Navigation Plan
| Group | Item | Target Resource | Yeeflow Resource Type | Icon |
| --- | --- | --- | --- | --- |
| Audit | Audit Observations | Audit Observations | Data List | fa-solid fa-list-check |
| Audit | Risk Categories | Risk Categories | Data List | fa-solid fa-triangle-exclamation |
`);

  const apiIdManifestPath = path.join(tempDir, "api-issued-ids.json");
  fs.writeFileSync(apiIdManifestPath, `${JSON.stringify({
    ids: Array.from({ length: 200 }, (_, index) => String(950000000000000000n + BigInt(index))),
  }, null, 2)}\n`);

  const report = materializeFullAppGeneratedFinal({
    functionalSpec: specPath,
    appPlan: planPath,
    outDir: path.join(tempDir, "dist"),
    apiIdManifest: apiIdManifestPath,
    tenantId: "950000000000099999",
    cwd: tempDir,
  });

  assert.equal(report.status, "fail", "materializer must reject lookup targets that are not planned/generated");
  const codes = new Set((report.findings || []).map((finding) => finding.code));
  assert.ok(codes.has("FULL_APP_MATERIALIZATION_LOOKUP_TARGET_DATA_LIST_NOT_PLANNED"), JSON.stringify(report.findings || [], null, 2));

  console.log(JSON.stringify({
    status: "pass",
    cases: [
      "materializer rejects lookup target Data Lists omitted from the App Plan resource list",
      "unresolved lookup fields cannot silently emit empty Rules payloads",
    ],
  }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

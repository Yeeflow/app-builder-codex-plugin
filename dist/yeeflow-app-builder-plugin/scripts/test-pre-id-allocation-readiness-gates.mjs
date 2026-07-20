#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "pre-id-allocation-readiness-"));

try {
  const validPlan = path.join(temporary, "valid-plan.md");
  const malformedPlan = path.join(temporary, "malformed-plan.md");
  fs.writeFileSync(validPlan, genericPlan());
  fs.writeFileSync(malformedPlan, genericPlan()
    .replace("#### Data List Form Layout Template Selection", "#### Data List Form Layout Notes")
    .replace("#### Form Fields Layout Template Selection", "#### Form Fields Layout Notes")
    .replaceAll("Open; Closed", ""));

  const archive = path.join(temporary, "official-plugin.zip");
  execFileSync(process.execPath, [path.join(ROOT, "scripts/build-plugin-archive.mjs"), "--output", archive], {
    cwd: ROOT,
    env: { ...process.env, YEEFLOW_CANDIDATE_CORE_VERSION: "1.0.0" },
    stdio: "pipe",
  });
  const archiveRoot = path.join(temporary, "archive");
  fs.mkdirSync(archiveRoot);
  execFileSync("unzip", ["-qq", archive, "-d", archiveRoot]);
  const installedRoot = path.join(temporary, "installed", "yeeflow-app-builder-plugin");
  fs.cpSync(path.join(archiveRoot, "yeeflow-app-builder-plugin"), installedRoot, { recursive: true });

  const roots = [
    ["source", ROOT],
    ["official-dist", path.join(ROOT, "dist/yeeflow-app-builder-plugin")],
    ["archive", path.join(archiveRoot, "yeeflow-app-builder-plugin")],
    ["simulated-installed", installedRoot],
  ];
  for (const [surface, root] of roots) await verifySurface(surface, root, validPlan, malformedPlan);

  console.log(JSON.stringify({
    status: "pass",
    marker: "FULL_APP_PRE_ID_ALLOCATION_READINESS_PARITY_PASSED",
    surfaces: roots.map(([surface]) => surface),
    cases: 16,
  }, null, 2));
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}

async function verifySurface(surface, root, validPlan, malformedPlan) {
  const modulePath = path.join(root, "scripts/validate-pre-id-allocation-readiness.mjs");
  const module = await import(`${pathToFileURL(modulePath).href}?surface=${surface}`);
  let malformedAllocationCalls = 0;
  const malformed = await module.runPreIdAllocationReadiness({
    appPlan: malformedPlan,
    allocateIds: async () => { malformedAllocationCalls += 1; return ["not-called"]; },
  });
  assert.equal(malformed.status, "fail", surface);
  assert.equal(malformed.allocationInvoked, false, surface);
  assert.equal(malformedAllocationCalls, 0, surface);
  const codes = new Set(malformed.findings.map((finding) => finding.code));
  assert.ok(codes.has("DATA_LIST_FORM_LAYOUT_APP_PLAN_SELECTION_TABLE_MISSING"), surface);
  assert.ok(codes.has("DATA_LIST_FORM_FIELDS_APP_PLAN_SELECTION_TABLE_MISSING"), surface);
  assert.ok(codes.has("APPROVAL_FORM_FIELDS_CHOICE_VALUES_REQUIRED"), surface);
  assert.deepEqual(malformed.proofBoundary, {
    apiIdAllocationAllowed: false,
    packageMaterializationAllowed: false,
    signingAllowed: false,
    installationAllowed: false,
    tenantMutationAllowed: false,
  }, surface);

  let validAllocationCalls = 0;
  const valid = await module.runPreIdAllocationReadiness({
    appPlan: validPlan,
    allocateIds: async () => { validAllocationCalls += 1; return ["api-issued-id-placeholder"]; },
  });
  assert.equal(valid.status, "pass", JSON.stringify(valid.findings));
  assert.equal(valid.allocationInvoked, true, surface);
  assert.equal(validAllocationCalls, 1, surface);
}

function genericPlan() {
  return `# Generic Operations - Yeeflow App Plan

## 4. Data Lists and Document Libraries Plan

### 4.1 Operational Records

| Field Order | Display Name | Internal ID / Field Key | Exact Yeeflow Field Type | Exact Yeeflow Control Type | Choice Values |
| --- | --- | --- | --- | --- | --- |
| 1 | Record Title | Title | Text | input | |
| 2 | Record Status | RecordStatus | Choice | select | Open; Closed |

## 5. Approval Forms Plan

### 5.1 Record Approval

#### Submission Form Fields

| Business Label | Field Name | Exact Yeeflow Variable Type | Exact Yeeflow Control Type | Choice Values | Required | Read Only |
| --- | --- | --- | --- | --- | --- | --- |
| Record Title | requestTitle | Text | input | | Yes | No |
| Record Status | RecordStatus | Choice | select | Open; Closed | Yes | No |

#### Task Form Fields

| Business Label | Field Name | Exact Yeeflow Variable Type | Exact Yeeflow Control Type | Choice Values | Required | Read Only |
| --- | --- | --- | --- | --- | --- | --- |
| Record Status | RecordStatus | Choice | select | Open; Closed | Yes | Yes |

#### Approval Form Fields Layout Template Selection

| Approval Form | Form Page | Field Group | Selected Approval Form Fields Layout Template | Field Source | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Record Approval | Submission form | Record fields | approval_form_fields_grid_2col_v1_1 | Submission fields | 2 | 2 | 1 | None | None | Generated-final validation |
| Record Approval | Task form | Review fields | approval_form_fields_grid_2col_v1_1 | Task fields | 2 | 2 | 1 | None | None | Generated-final validation |

## 10. Custom Data List Forms Plan

### 10.1 Operational Records

#### Data List Form Layout Template Selection

| Data List or Library | Custom Form | Form Usage | Selected Data List Form Layout Template | Business Sections Needed | Related Data / Analytics Needed | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Operational Records | Record New/Edit | New/Edit | data_list_form_layout_new_edit_v1_1 | Record fields | None | Standard editor | Generated-final validation |
| Operational Records | Record View | View | data_list_form_layout_view_item_v1_1 | Record details | None | Standard detail | Generated-final validation |

#### Form Fields Layout Template Selection

| Data List or Library | Custom Form | Field Group | Selected Form Fields Layout Template | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Operational Records | Record New/Edit | Record fields | data_list_form_fields_grid_v1_1 | 2 | 2 | 1 | None | None | Generated-final validation |
| Operational Records | Record View | Record fields | data_list_form_fields_grid_v1_1 | 2 | 2 | 1 | None | None | Generated-final validation |
`;
}

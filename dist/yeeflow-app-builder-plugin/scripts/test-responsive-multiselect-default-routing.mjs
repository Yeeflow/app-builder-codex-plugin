#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { materializeFullAppGeneratedFinal } from "./materialize-full-app-generated-final.mjs";
import { readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "responsive-multiselect-default-"));

function write(file, value) {
  fs.writeFileSync(file, `${value.trim()}\n`);
  return file;
}

function identities(node) {
  return [node?.id, node?.name, node?.label, node?.title, node?.nv_label, node?.nav_label, node?.attrs?.nv_label, node?.attrs?.nav_label]
    .filter(Boolean)
    .map(String);
}

function findByIdentity(root, identity) {
  if (!root || typeof root !== "object") return null;
  if (identities(root).includes(identity)) return root;
  for (const child of Array.isArray(root.children) ? root.children : []) {
    const found = findByIdentity(child, identity);
    if (found) return found;
  }
  return null;
}

function containsType(root, type) {
  if (!root || typeof root !== "object") return false;
  if (root.type === type) return true;
  return (root.children || []).some((child) => containsType(child, type));
}

try {
  const specPath = write(path.join(tempDir, "functional-specification.md"), `
# Functional Specification: Responsive Batch Workbench

Operations users need a desktop/tablet table and mobile cards. They must select
multiple records, inspect the selected count, batch-complete records, and delete
selected records.
`);
  const planPath = write(path.join(tempDir, "yeeflow-app-plan.md"), `
# Responsive Batch Workbench - Yeeflow App Plan

## 1. Plan Status
Business defaults approval status: user-default-approved-for-generation.
Application icon: fa-solid fa-list-check

## 4. Data Lists and Document Libraries Plan

### 4.1 Data List Schema Table

| List | Field label | Internal field | Field type | Purpose |
| --- | --- | --- | --- | --- |
| Work Items | Title | Title | Text | Work item title |
| Work Items | Status | Text1 | Choice | Completion state |
| Work Items | Owner | User1 | User | Work owner |

## 10. Custom Data List Forms Plan

| Data List | Form Name | Form Type | Selected Data List Form Layout Template | Open in |
| --- | --- | --- | --- | --- |
| Work Items | Work Items New Edit | New/Edit | data_list_form_layout_new_edit_v1_1 | Pop-up window |
| Work Items | Work Items View Item | View | data_list_form_layout_view_item_v1_1 | Slide panel |

## 14. Dashboard Pages Plan

### 14.1 Responsive Batch Workbench
- Page name: Responsive Batch Workbench
- Business purpose: Select and complete or delete multiple work items.
- Layout template: dashboard-page-layouts-workbench

#### Dashboard Sections

| Section Order | Section Name | Business Purpose | Source Data List or Business Object | Required Fields or Metrics | Selected Yeeflow Control Type Category | Why This Control Type Is Appropriate | User Actions Needed | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Work item queue | Responsive batch work queue | Work Items | Title, Status, Owner | Collection | Multiple selection with batch completion and deletion; native desktop/tablet table with mobile Card view | Select items, change selected items to completed, delete multiple items | generated-final validation |

#### Record Display Control Selection

| Dashboard Page | Dataset Region | Source List | Selected Collection Template | Selection Reason |
| --- | --- | --- | --- | --- |
| Responsive Batch Workbench | Work item queue | Work Items |  | Multi-row selection, selected count, batch complete and delete operations, with a desktop/tablet table and mobile Card view. |

## 15. Application Navigation Plan

| Group | Item | Target Resource | Yeeflow Resource Type | Icon |
| --- | --- | --- | --- | --- |
| Operations | Responsive Batch Workbench | Responsive Batch Workbench | Dashboard | fa-solid fa-list-check |
| Operations | Work Items | Work Items | Data list | fa-solid fa-list-check |
`);
  const manifestPath = path.join(tempDir, "api-issued-ids.json");
  fs.writeFileSync(manifestPath, `${JSON.stringify({ ids: Array.from({ length: 700 }, (_, index) => String(970000000000000000n + BigInt(index))) })}\n`);

  const report = materializeFullAppGeneratedFinal({
    functionalSpec: specPath,
    appPlan: planPath,
    outDir: path.join(tempDir, "dist"),
    apiIdManifest: manifestPath,
    tenantId: "970000000000099999",
    cwd: tempDir,
  });
  assert.equal(report.status, "pass", JSON.stringify(report.findings || [], null, 2));
  const { decoded } = readDecodedYapk(report.outputs.package);
  const page = decoded.Pages.find((candidate) => candidate.Title === "Responsive Batch Workbench");
  assert.ok(page, "responsive batch Dashboard must materialize");
  const resource = JSON.parse(page.LayoutInResources[0].Resource);
  const collection = findByIdentity(resource, "grid_table_col_body");
  assert.equal(collection?.type, "collection", "generic multiselect requirements must default to the responsive Collection template");
  assert.ok(Array.isArray(collection?.attrs?.tablecols) && collection.attrs.tablecols.length >= 3, "default template must keep native desktop/tablet Table columns");
  assert.ok(Array.isArray(collection?.children) && collection.children.length > 0, "default template must keep a non-empty mobile Card view");
  assert.equal(containsType(collection, "flex_grid"), false, "generic multiselect requirements must not route to the legacy Flex Grid template");
  for (const key of ["filterVars", "tempVars", "filter", "actions", "formAction"]) {
    const value = resource[key];
    assert.ok(Array.isArray(value) ? value.length > 0 : Boolean(value && Object.keys(value).length), `responsive multiselect default must preserve ${key}`);
  }
  for (const identity of ["grid_table_col_operations", "op_normal"]) {
    assert.deepEqual(findByIdentity(resource, identity)?.attrs?.style?.widthtype, [null, "2", "1"], `${identity} must preserve the live mobile Full-width contract`);
  }
  console.log(JSON.stringify({ status: "pass", assertion: "generic multiselect requirements default to collection_control_responsive_multiple_select with full responsive behavior" }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

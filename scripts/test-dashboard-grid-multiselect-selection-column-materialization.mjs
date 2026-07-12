#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { materializeFullAppGeneratedFinal } from "./materialize-full-app-generated-final.mjs";
import { readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-grid-multiselect-column-"));

function write(file, content) {
  fs.writeFileSync(file, `${content.trim()}\n`);
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

function desktopTracks(grid) {
  return (grid?.attrs?.columns?.["1"]?.list || []).map((track) => {
    if (Array.isArray(track)) return `${track[0]}${track[1]}`;
    return `${track?.value ?? ""}${track?.unit ?? ""}`;
  });
}

try {
  const specPath = write(path.join(tempDir, "functional-specification.md"), `
# Functional Specification: Legal Intake Workbench

Legal intake triage queue with dense multi-row selection and a future bulk assignment action.
`);
  const planPath = write(path.join(tempDir, "yeeflow-app-plan.md"), `
# Legal Intake Workbench - Yeeflow App Plan

## 1. Plan Status
Business defaults approval status: user-default-approved-for-generation.

## 4. Data Lists and Document Libraries Plan

### 4.1 Data List Schema Table

| List | Field label | Internal field | Field type | Purpose |
| --- | --- | --- | --- | --- |
| Legal Requests | Title | Title | Text | Request title |
| Legal Requests | Business Unit | Text1 | Text | Requesting business unit |
| Legal Requests | Priority | Text2 | Choice | Triage priority |

## 10. Custom Data List Forms Plan

| Data List | Form Name | Form Type | Selected Data List Form Layout Template | Open in |
| --- | --- | --- | --- | --- |
| Legal Requests | Legal Requests New Edit | New/Edit | data_list_form_layout_new_edit_v1_1 | Pop-up window |
| Legal Requests | Legal Requests View Item | View | data_list_form_layout_view_item_v1_1 | Slide panel |

## 14. Dashboard Pages Plan

### 14.1 Legal Intake Workbench
- Page name: Legal Intake Workbench
- Business purpose: Triage incoming legal requests and prepare bulk assignment.
- Layout template: dashboard-page-layouts-workbench

#### Dashboard Sections

| Section Order | Section Name | Business Purpose | Source Data List or Business Object | Required Fields or Metrics | Selected Yeeflow Control Type Category | Why This Control Type Is Appropriate | User Actions Needed | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Triage Queue | Dense row scanning and multi-row selection | Legal Requests | Title, Business Unit, Priority | Collection | Dense selectable operational queue | Select requests and bulk assign | generated-final validation |

#### Record Display Control Selection

| Dashboard Page | Dataset Region | Source List | Selected Collection Template | Selection Reason |
| --- | --- | --- | --- | --- |
| Legal Intake Workbench | Triage Queue | Legal Requests | collection_control_grid_table_with_multiselect | Dense row and column scanning with multi-row selection and future bulk assignment operations. |
| My Travel Requests | Request Queue | Legal Requests | collection_control_grid_table | Read-only dense request tracking without multiselect operations. |

### 14.2 My Travel Requests
- Page name: My Travel Requests
- Business purpose: Review the current user's travel requests.
- Layout template: dashboard-page-layouts-workbench

#### Dashboard Sections

| Section Order | Section Name | Business Purpose | Source Data List or Business Object | Required Fields or Metrics | Selected Yeeflow Control Type Category | Why This Control Type Is Appropriate | User Actions Needed | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Request Queue | Review current-user requests | Legal Requests | Title, Business Unit, Priority | Collection | Dense read-only request table | Open request | generated-final validation |

## 15. Application Navigation Plan

| Group | Item | Target Resource | Yeeflow Resource Type | Icon |
| --- | --- | --- | --- | --- |
| Legal Operations | Legal Intake Workbench | Legal Intake Workbench | Dashboard | fa-solid fa-scale-balanced |
| Legal Operations | Legal Requests | Legal Requests | Data list | fa-solid fa-list-check |
| Legal Operations | My Travel Requests | My Travel Requests | Dashboard | fa-solid fa-plane |
`);

  const idManifest = path.join(tempDir, "api-issued-ids.json");
  fs.writeFileSync(idManifest, `${JSON.stringify({
    ids: Array.from({ length: 700 }, (_, index) => String(970000000000000000n + BigInt(index))),
  }, null, 2)}\n`);

  const report = materializeFullAppGeneratedFinal({
    functionalSpec: specPath,
    appPlan: planPath,
    outDir: path.join(tempDir, "dist"),
    apiIdManifest: idManifest,
    tenantId: "970000000000099999",
    cwd: tempDir,
  });
  assert.equal(report.status, "pass", JSON.stringify(report.findings || [], null, 2));

  const { decoded } = readDecodedYapk(report.outputs.package);
  const dashboard = decoded.Pages.find((page) => page.Title === "Legal Intake Workbench");
  assert.ok(dashboard, "Legal Intake Workbench Dashboard must materialize");
  const resource = JSON.parse(dashboard.LayoutInResources[0].Resource);
  const header = findByIdentity(resource, "grid_table_col_header");
  const item = findByIdentity(resource, "grid_col_item");
  assert.ok(header, "multiselect header grid must exist");
  assert.ok(item, "multiselect item grid must exist");

  const headerTracks = desktopTracks(header);
  const itemTracks = desktopTracks(item);
  assert.deepEqual(headerTracks, itemTracks, "header and item track definitions must match");
  assert.deepEqual(headerTracks.slice(0, 2), ["46px", "2fr"], "selection track must be 46px and primary title track must be 2fr");
  assert.equal(headerTracks.length, header.children.length, "header tracks must match actual header cell count after pruning");
  assert.equal(itemTracks.length, item.children.length, "item tracks must match actual item cell count after pruning");
  assert.ok(identities(header.children[0]).includes("grid_table_col_header_select"), "header selection cell must remain first");
  assert.ok(identities(item.children[0]).includes("grid_table_col_item_select"), "item selection cell must remain first");
  assert.ok(identities(header.children[1]).includes("grid_table_col_header_title_column"), "primary header cell must follow selection cell");
  assert.ok(identities(item.children[1]).includes("grid_table_col_item_title_column"), "primary item cell must follow selection cell");

  assert.ok(resource.tempVars.length > 0, "multiselect Dashboard must declare its consumed template temp variables");
  for (const tempVar of resource.tempVars) {
    assert.ok(String(tempVar.id || "").trim(), "every generated Dashboard temp variable must include id");
    assert.ok(String(tempVar.name || "").trim(), "every generated Dashboard temp variable must include name");
    assert.ok(String(tempVar.idx || "").trim(), "every generated Dashboard temp variable must include idx");
  }
  const tempIds = resource.tempVars.map((item) => String(item.id));
  assert.equal(tempIds.some((id) => ["var_SelectedItems", "var_SelectedItemsAmount", "var_isDeleteConfirmed"].includes(id)), false, "generic template temp variable ids must not survive generated-final materialization");
  assert.equal(tempIds.some((id) => /selecteditemsamount/i.test(id)), true, "consumed selected-count temp variable must be declared with a scoped id");
  assert.equal(resource.tempVars.find((item) => /SelectedItems$/i.test(item.id))?.type, "array", "selected-items temp variable must retain array type");
  assert.equal(resource.tempVars.find((item) => /SelectedItemsAmount$/i.test(item.id))?.type, "number", "selected-count temp variable must retain number type");
  assert.equal(resource.tempVars.find((item) => /isDeleteConfirmed$/i.test(item.id))?.type, "boolean", "delete-confirmation temp variable must retain boolean type");
  const body = structuredClone(resource);
  delete body.tempVars;
  const bodyText = JSON.stringify(body);
  for (const id of tempIds) {
    const unprefixed = id.replace(/^__temp_/, "");
    assert.equal(bodyText.includes(id) || bodyText.includes(`__temp_${unprefixed}`), true, `temp variable ${id} must be consumed by the generated Dashboard`);
  }

  const plainDashboard = decoded.Pages.find((page) => page.Title === "My Travel Requests");
  assert.ok(plainDashboard, "plain grid-table Dashboard must materialize");
  const plainResource = JSON.parse(plainDashboard.LayoutInResources[0].Resource);
  assert.ok(plainResource.tempVars.length > 0, "plain grid template must declare its consumed temp variables");
  assert.equal(plainResource.tempVars.every((item) => item.id && item.name && item.idx), true, "plain grid temp variables must be complete Designer declarations");
  assert.equal(plainResource.tempVars.some((item) => ["var_SelectedItems", "var_SelectedItemsAmount", "var_isDeleteConfirmed"].includes(item.id)), false, "plain grid template variables must be namespaced");
  assert.equal(plainResource.tempVars.some((item) => /SelectedItems$/.test(item.id)), false, "plain grid must not retain unused multiselect selected-items array");
  const plainBody = structuredClone(plainResource);
  delete plainBody.tempVars;
  const plainBodyText = JSON.stringify(plainBody);
  for (const item of plainResource.tempVars) {
    const unprefixed = item.id.replace(/^__temp_/, "");
    assert.equal(plainBodyText.includes(item.id) || plainBodyText.includes(`__temp_${unprefixed}`), true, `plain grid temp variable ${item.id} must be consumed`);
  }

  console.log(JSON.stringify({
    status: "pass",
    dashboard: dashboard.Title,
    headerTracks,
    itemTracks,
    tempVars: resource.tempVars,
    assertion: "checkbox column and scoped, complete, consumed temp-variable dependencies remain valid after materialization",
  }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

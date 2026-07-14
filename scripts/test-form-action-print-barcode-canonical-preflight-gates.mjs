#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const MATERIALIZER = path.join(ROOT, "scripts/materialize-full-app-generated-final.mjs");
const PREFLIGHT = path.join(ROOT, "scripts/yapk-first-generation-preflight.mjs");

const spec = `# Functional Specification: Print and Barcode Regression

Generate an inventory Data List, an operational Dashboard, and a canonical multi-record print Dashboard.
`;

const plan = `# Print and Barcode Regression - Yeeflow App Plan

## Plan Status

- Application name: Print and Barcode Regression

Business defaults approval status: user-default-approved-for-generation.

## 4. Data Lists and Document Libraries Plan

### 4.1 Inventory Items

| Data List Name | Resource Type | Purpose |
| --- | --- | --- |
| Inventory Items | Data List | Inventory rows used for print and barcode proof. |

| Data List | Field Order | Display Name | Field Name | Exact Yeeflow Field Type | Exact Yeeflow Control Type | Choice Values | Allow Scan | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Inventory Items | 1 | Item Name | Title | Text | input | N/A | No | Inventory display name. |
| Inventory Items | 2 | Serial Number | Text1 | Text | input | N/A | Yes | Scan-enabled serial number. |
| Inventory Items | 3 | ISBN | Text2 | Text | input | N/A | Yes | Scan-enabled ISBN. |
| Inventory Items | 4 | Status | Text3 | Text | select | Active; Inactive | No | Operational status. |
| Inventory Items | 5 | Location | Text4 | Text | input | N/A | No | Storage location. |
| Inventory Items | 6 | Description | Text5 | Text | textarea | N/A | No | Printable description. |

## 10. Custom Data List Forms Plan

### 10.1 Inventory Items

| Data List | Form Name | Form Type | Selected Data List Form Layout Template |
| --- | --- | --- | --- |
| Inventory Items | Inventory New Edit | New/Edit | data_list_form_layout_new_edit_v1_1 |
| Inventory Items | Inventory View | View | data_list_form_layout_view_item_v1_1 |

#### Data List Form Layout Template Selection

| Data List | Usage | Form Name | Selected Data List Form Layout Template |
| --- | --- | --- | --- |
| Inventory Items | New/Edit | Inventory New Edit | data_list_form_layout_new_edit_v1_1 |
| Inventory Items | View | Inventory View | data_list_form_layout_view_item_v1_1 |

#### Form Fields Layout Template Selection

| Data List | Form Name | Selected Form Fields Layout Template | PC/Laptop Columns | Tablet Columns | Mobile Columns |
| --- | --- | --- | --- | --- | --- |
| Inventory Items | Inventory New Edit | data_list_form_fields_grid_v1_1 | 3 | 2 | 1 |
| Inventory Items | Inventory View | data_list_form_fields_grid_v1_1 | 3 | 2 | 1 |

## 14. Dashboard Pages Plan

| Dashboard Page Name | Business Purpose |
| --- | --- |
| Inventory | Operational inventory and barcode scan page. |
| Print Inventory | Multi-record print page. |

#### Dashboard Page Layout Template Selection

| Dashboard Page | Selected Dashboard Page Layout Template | Business Reason |
| --- | --- | --- |
| Inventory | dashboard-page-layouts-v1.1 | Interactive operational Dashboard. |
| Print Inventory | dashboard-print-multi-record-table-v1 | Multi-record printable inventory layout. |

#### Dashboard Dataset Presentation Template Selection

| Dashboard Page | Dataset Region | Source Resource | Business Purpose | Selected Collection Presentation Reference | Selection Rationale | Display Columns |
| --- | --- | --- | --- | --- | --- | --- |
| Inventory | Inventory Queue | Inventory Items | Dense operational record list | collection_control_grid_table | Dense row and column scanning for an operational table. | Item Name, Serial Number, ISBN, Status, Location |
| Print Inventory | Printable Inventory | Inventory Items | Dense printable record list | collection_control_grid_table | Dense row and column scanning for comparable printable fields. | Item Name, Serial Number, ISBN, Status, Location, Description |

#### Form Action Print Page and Barcode Scan Planning

| Host Resource | Host Form / Page | Host Type | Action Name | Step Order | Step Name | Trigger | Bound Control | Exact Step Type | Target Page Type | Target Page | Print Title Expression Tokens | Paper Size | Print Layout | Scale Percent | Margins | Scanning Mode | Barcode Type | Result Temp Variable | Error Temp Variable | On Read Error | Barcode Filter Field | Business Rationale | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Inventory | Inventory | Dashboard | Print inventory | 1 | Print inventory records | Button Click | btn_print_inventory | print | Dashboard | Print Inventory | [{"type":"str","value":"Inventory"}] | A4 | landscape | 80 | Minimum | N/A | N/A | N/A | N/A | N/A | N/A | Print inventory records | export-proven |
| Inventory | Inventory | Dashboard | Scan multiple items | 1 | Scan multiple barcodes | Container Click | scan_multiple_trigger | barcode | N/A | N/A | N/A | N/A | N/A | N/A | N/A | multiple | auto | var_SelectedItems | var_ScanErrorMsg | Stop | Text1 | Filter Collection to scanned serial numbers | camera-runtime-proof-required |
| Inventory | Inventory | Dashboard | Scan selected item | 1 | Select and scan ISBN | Container Click | scan_select_trigger | barcode | N/A | N/A | N/A | N/A | N/A | N/A | N/A | select | ean-13 | var_SelectedISBN | var_SelectScanError | Stop | Text2 | Confirm one scanned ISBN | camera-runtime-proof-required |
| Inventory | Inventory | Dashboard | Scan automatic item | 1 | Automatically scan ISBN | Container Click | scan_auto_trigger | barcode | N/A | N/A | N/A | N/A | N/A | N/A | N/A | auto | ean-13 | var_AutoISBN | var_AutoScanError | Stop | Text2 | Capture one ISBN | camera-runtime-proof-required |

## 15. Application Navigation Plan

| Group | Item | Resource Type |
| --- | --- | --- |
| Inventory | Inventory Items | Data List |
| Inventory | Inventory | Dashboard |
| Inventory | Print Inventory | Dashboard |
`;

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "print-barcode-canonical-preflight-"));
try {
  const specPath = path.join(tempDir, "functional-specification.md");
  const planPath = path.join(tempDir, "yeeflow-app-plan.md");
  const manifestPath = path.join(tempDir, "api-issued-ids.json");
  const outDir = path.join(tempDir, "generated-final");
  fs.writeFileSync(specPath, spec);
  fs.writeFileSync(planPath, plan);
  fs.writeFileSync(manifestPath, JSON.stringify({ ids: Array.from({ length: 1024 }, (_, index) => String(960000000000000001n + BigInt(index))) }, null, 2));

  const materialized = run(MATERIALIZER, [
    "--functional-spec", specPath,
    "--app-plan", planPath,
    "--out-dir", outDir,
    "--api-id-manifest", manifestPath,
    "--tenant-id", "960000000000009999",
    "--json",
  ]);
  assert.equal(materialized.status, 0, `materializer should pass\n${materialized.stdout}\n${materialized.stderr}`);
  const report = JSON.parse(materialized.stdout);
  const { decoded } = readDecodedYapk(report.outputs.package);
  const inventory = decoded.Childs.find((child) => child.List?.Title === "Inventory Items");
  assert.ok(inventory, "Inventory Items must materialize");
  for (const fieldName of ["Text1", "Text2"]) {
    const field = inventory.Fields.find((item) => item.FieldName === fieldName);
    assert.ok(field?.Rules, `${fieldName} must emit scan Rules: ${JSON.stringify(field)}`);
    assert.equal(JSON.parse(field.Rules).allowScan, true, `${fieldName} must preserve Allow Scan from the App Plan`);
  }

  const inventoryPage = pageResource(decoded, "Inventory");
  const printPage = pageResource(decoded, "Print Inventory");
  assert.equal(printPage.templateMarker, "dashboard-page-layouts-v1.1");
  assert.equal(printPage.printDashboardTemplateId, "dashboard-print-multi-record-table-v1");
  assert.ok(find(printPage, (node) => node.type === "table-v2" && node.nv_label === "print_record_table"));
  assert.ok(find(printPage, (node) => node.type === "list-qrcode" && node.attrs?.["qr-code-link"]?.type === "2"));
  for (const identity of ["btn_print_inventory", "scan_multiple_trigger", "scan_select_trigger", "scan_auto_trigger"]) {
    assert.ok(find(inventoryPage, (node) => node.nv_label === identity && node.attrs?.control_action), `${identity} must be generated in an approved action slot and bound`);
  }

  const preflight = run(PREFLIGHT, [
    "--package", report.outputs.package,
    "--plan", planPath,
    "--id-provenance", report.outputs.idProvenance,
    "--json",
  ]);
  const dashboardHardGate = preflight.status === 0 ? null : run(path.join(ROOT, "scripts/validate-dashboard-generation-hard-gates.mjs"), ["--package", report.outputs.package, "--plan", planPath]);
  assert.equal(preflight.status, 0, `canonical first-generation preflight should pass\n${preflight.stdout}\n${preflight.stderr}\n${dashboardHardGate?.stdout || ""}`);
  const preflightReport = JSON.parse(preflight.stdout);
  assert.equal(preflightReport.ok, true);
  for (const gateName of ["decoded-app-package-runtime", "dashboard-grid-table-collections", "dashboard-dataset-presentation-golden-references", "dashboard-generation-hard-gates", "dashboard-golden-reference-conformance", "form-action-print-barcode"]) {
    assert.equal(preflightReport.gates.find((gate) => gate.gate === gateName)?.ok, true, `${gateName} must pass`);
  }

  console.log(JSON.stringify({ status: "pass", test: path.basename(import.meta.filename), cases: 6 }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function run(command, args) {
  return spawnSync(process.execPath, [command, ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 });
}

function pageResource(decoded, title) {
  const page = decoded.Pages.find((item) => item.Title === title && Number(item.Type) === 103);
  assert.ok(page, `${title} Dashboard must materialize`);
  return JSON.parse(page.LayoutInResources[0].Resource);
}

function find(root, predicate) {
  if (!root || typeof root !== "object") return null;
  if (predicate(root)) return root;
  for (const child of Array.isArray(root.children) ? root.children : []) {
    const match = find(child, predicate);
    if (match) return match;
  }
  return null;
}

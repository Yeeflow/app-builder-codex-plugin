#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";

const repoRoot = process.cwd();
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vo-v41-hard-checks-"));

function writeYapk(name, decoded) {
  const packagePath = path.join(tmpDir, name);
  fs.writeFileSync(packagePath, JSON.stringify({
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64"),
    PortalInfo: null,
  }));
  return packagePath;
}

function dashboardPage(children, tempVars = [], exts = []) {
  return {
    type: "page",
    attrs: {},
    tempVars,
    exts,
    children,
  };
}

function dashboardLayout(title, page) {
  return {
    Title: title,
    Type: 103,
    Ext2: JSON.stringify({ src: true }),
    LayoutInResources: [{ Resource: JSON.stringify(page) }],
  };
}

function runInspect(packagePath) {
  const result = spawnSync(process.execPath, [
    path.join(repoRoot, "scripts/inspect-generated-app-quality.mjs"),
    "--package",
    packagePath,
    "--strict-visual-app-quality",
  ], { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const report = JSON.parse(result.stdout || "{}");
  return new Set((report.findings || []).map((finding) => finding.code));
}

function runSchema(packagePath) {
  const result = spawnSync(process.execPath, [
    path.join(repoRoot, "scripts/validate-data-list-system-schema.mjs"),
    packagePath,
    "--strict-generated-list",
    "--json",
  ], { cwd: repoRoot, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  const report = JSON.parse(result.stdout || "{}");
  return new Set((report.issues || []).map((issue) => issue.code));
}

function basePackage(layouts = [], childs = []) {
  return {
    ListSet: { Title: "Synthetic App", ListID: "1000", AppID: 41 },
    Pages: layouts,
    Childs: childs,
  };
}

function badDashboardPackage() {
  const page = dashboardPage([
    {
      type: "container",
      label: "Container",
      children: [
        { type: "flex_grid", label: "Grid", displayLabel: true, children: [
          { type: "text", label: "Total Vendors KPI", attrs: { headc: { title: { value: "128" } } } },
        ] },
        { type: "button", label: "New Vendor Request", attrs: { text: "New Vendor Request" } },
        { type: "dynamic-field", label: "Vendor Name", attrs: { field: "Title" } },
      ],
    },
  ]);
  return basePackage([dashboardLayout("Vendor Management Dashboard", page)]);
}

function badDataListPackage() {
  return basePackage([], [
    {
      List: { Title: "Vendors", ListID: "2000", AppID: 41, LayoutView: null },
      Fields: [
        { DisplayName: "Vendor Name", FieldName: "Title", InternalName: "Title", Type: "input", FieldType: "Text", IsSystem: true },
        { DisplayName: "Vendor Name", FieldName: "Text0", InternalName: "Text0", Type: "input", FieldType: "Text", FieldIndex: 0 },
        { DisplayName: "Risk Level", FieldName: "Text2", InternalName: "Risk Level", Type: "select", FieldType: "Text", FieldIndex: 3, Rules: JSON.stringify({ options: [] }) },
      ],
      Layouts: [{ Type: 0, IsDefault: true, LayoutView: JSON.stringify({ layout: [], query: [] }) }],
      ListDatas: [],
    },
    {
      List: { Title: "Vendor Documents", ListID: "3000", AppID: 41, LayoutView: null },
      Fields: [
        { DisplayName: "Document Name", FieldName: "Title", InternalName: "Title", Type: "input", FieldType: "Text", IsSystem: true },
        { DisplayName: "Vendor", FieldName: "Text1", InternalName: "Vendor", Type: "lookup", FieldType: "Text", FieldIndex: 1, Rules: JSON.stringify({ listid: "2000", listfield: "Text0" }) },
        { DisplayName: "Vendor Missing Display", FieldName: "Text2", InternalName: "VendorMissingDisplay", Type: "lookup", FieldType: "Text", FieldIndex: 2, Rules: JSON.stringify({ listid: "2000", listfield: "MissingField" }) },
      ],
      Layouts: [{ Type: 0, IsDefault: true, LayoutView: JSON.stringify({ layout: [{ field: "Title" }], query: [{ field: "Title" }] }) }],
      ListDatas: [{ ListDataID: "doc-1", Title: "Insurance", Text1: "missing-vendor-id" }],
    },
  ]);
}

const dashboardCodes = runInspect(writeYapk("bad-dashboard.yapk", badDashboardPackage()));
for (const code of [
  "DASHBOARD_MAIN_CONTAINER_MISSING",
  "DASHBOARD_CONTENT_CONTAINER_MISSING",
  "DASHBOARD_CONTENT_STRUCTURE_INVALID",
  "GRID_DISPLAY_LABEL_NOT_DISABLED",
  "GRID_DEFAULT_CAPTION_VISIBLE",
  "CONTROL_NAVIGATOR_LABEL_DEFAULT",
  "KPI_STATIC_NUMBER_TEXT",
  "KPI_SUMMARY_TEMP_VAR_PATTERN_MISSING",
  "BUTTON_ACTION_MISSING",
  "NEW_VENDOR_ACTION_MISSING",
  "DYNAMIC_CONTROL_OUTSIDE_ITEM_TEMPLATE",
]) {
  assert(dashboardCodes.has(code), `Expected dashboard hard-check code ${code}`);
}

const schemaCodes = runSchema(writeYapk("bad-data-lists.yapk", badDataListPackage()));
for (const code of [
  "FIELD_IDENTIFIER_NOT_UNIQUE",
  "TEXT0_PRIMARY_FIELD_INVALID_WHEN_TITLE_USED",
  "FIELD_NAME_INDEX_MISMATCH",
  "SELECT_CHOICES_MISSING",
  "CHOICE_OPTIONS_MISSING",
  "LOOKUP_DISPLAY_FIELD_TEXT0_INVALID",
  "LOOKUP_DISPLAY_FIELD_NOT_FOUND",
  "DEFAULT_VIEW_DISPLAY_FIELDS_MISSING",
  "DEFAULT_VIEW_EXT1_URL_MISSING",
  "SAMPLE_LOOKUP_PARENT_UNRESOLVED",
  "LOOKUP_SAMPLE_VALUE_UNRESOLVED",
]) {
  assert(schemaCodes.has(code), `Expected data-list hard-check code ${code}`);
}

console.log("Vendor Onboarding v4.1 hard-check regression tests passed.");

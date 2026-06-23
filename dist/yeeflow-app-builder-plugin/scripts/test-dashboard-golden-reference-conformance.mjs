#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const APP_ID = "1909000000000000001";
const LIST_ID = "1909000000000000100";
const REFERENCE_ID = "event_portfolio_dashboard_golden_reference";

function registry() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/dashboard-golden-references.json"), "utf8"));
}

function selection(patch = {}) {
  return {
    selectedGoldenReferenceId: REFERENCE_ID,
    selectedSubRegionReferences: [
      "event_portfolio_header_band",
      "event_portfolio_filter_group",
      "kpi_cards_wrapper",
      "event_portfolio_kpi_row",
      "event_portfolio_pipeline_section",
      "Event Pipeline Grid-Table",
      "event_portfolio_campaign_readiness_section",
      "campaign_readiness_grid_table_container",
    ],
    plannedRegions: { filters: true, kpis: true, gridTable: true, secondaryGridTable: true, actions: true },
    businessMapping: { pagePurpose: "Office asset loan operations dashboard" },
    dataListSourceMapping: [{ businessObject: "Loan Requests", listTitle: "Loan Requests" }],
    kpiMetricMapping: [{ metric: "Open Loans", sourceField: "ListDataID", calculation: "COUNT active loans" }],
    filterFieldMapping: [{ filter: "Location", sourceField: "Loan Location" }],
    gridTableFieldMapping: [
      { displayLabel: "Asset", sourceField: "Asset Name" },
      { displayLabel: "Borrower", sourceField: "Borrower" },
      { displayLabel: "Due Date", sourceField: "Due Date" },
    ],
    actionMapping: [{ action: "Open detail", target: "Loan Request" }],
    ...patch,
  };
}

function blueprint(patch = {}) {
  return {
    pageName: "Office Asset Loan Dashboard",
    derivedFromGoldenReference: REFERENCE_ID,
    goldenReferenceSelection: selection(),
    plannedRegions: { filters: true, kpis: true, gridTable: true, secondaryGridTable: true },
    sections: [
      { id: "header", derivedFromGoldenReference: "event_portfolio_header_band" },
      { id: "filters", derivedFromGoldenReference: "event_portfolio_filter_group" },
      { id: "kpis", derivedFromGoldenReference: "kpi_cards_wrapper", children: [{ id: "row", derivedFromGoldenReference: "event_portfolio_kpi_row" }] },
      { id: "pipeline", derivedFromGoldenReference: "event_portfolio_pipeline_section", children: [{ id: "queue", derivedFromGoldenReference: "Event Pipeline Grid-Table" }] },
      { id: "secondary", derivedFromGoldenReference: "event_portfolio_campaign_readiness_section", children: [{ id: "readiness", derivedFromGoldenReference: "campaign_readiness_grid_table_container" }] },
    ],
    ...patch,
  };
}

function dashboardResource(mutator) {
  const root = clone(registry().references[0].exportShape._ak_c);
  adaptReferenceToOfficeAssetDomain(root);
  addStaticFilterConsumerBindings(root);
  if (mutator) mutator(root);
  return {
    type: "page",
    title: "Office Asset Loan Dashboard",
    derivedFromGoldenReference: REFERENCE_ID,
    plannedRegions: { filters: true, kpis: true, gridTable: true, secondaryGridTable: true },
    goldenReferenceSelection: selection(),
    children: [root],
  };
}

function semanticShellResource() {
  return {
    type: "page",
    title: "Office Asset Loan Dashboard",
    derivedFromGoldenReference: REFERENCE_ID,
    plannedRegions: { filters: true, kpis: true, gridTable: true },
    goldenReferenceSelection: selection({ plannedRegions: { filters: true, kpis: true, gridTable: true } }),
    children: [{
      type: "container",
      name: "Main",
      children: [{
        type: "container",
        name: "Content",
        attrs: { container: { padding: { top: 0, right: 0, bottom: 0, left: 0 } } },
        children: [
          { type: "container", name: "Header", attrs: { derivedFromGoldenReference: "event_portfolio_header_band", style: { widthtype: [null, "1"] } }, width: "full", children: [] },
          { type: "container", name: "Filters", attrs: { derivedFromGoldenReference: "event_portfolio_filter_group", style: { widthtype: [null, "1"] } }, width: "full", children: [] },
          { type: "container", name: "KPI Cards", attrs: { derivedFromGoldenReference: "kpi_cards_wrapper", style: { widthtype: [null, "1"] } }, width: "full", children: [] },
          { type: "container", name: "Pipeline", attrs: { derivedFromGoldenReference: "event_portfolio_pipeline_section", style: { widthtype: [null, "1"] } }, width: "full", children: [{ type: "collection", attrs: { derivedFromGoldenReference: "Event Pipeline Grid-Table" } }] },
        ],
      }],
    }],
  };
}

function decoded(resource = dashboardResource(), title = "Office Asset Loan Management") {
  return {
    ListSet: { ListID: APP_ID, Title: title },
    Pages: [{ Type: 103, Title: "Office Asset Loan Dashboard", LayoutID: "dashboard", LayoutInResources: [{ ID: "dashboard", RefId: "dashboard", Resource: JSON.stringify(resource) }] }],
    Childs: [{ List: { ListID: LIST_ID, Title: "Loan Requests" }, Fields: [{ FieldName: "Title" }, { FieldName: "Text1" }] }],
  };
}

function adaptReferenceToOfficeAssetDomain(node) {
  const rewrite = (current) => {
    if (Array.isArray(current)) {
      current.forEach(rewrite);
      return;
    }
    if (!current || typeof current !== "object") return;
    for (const [key, value] of Object.entries(current)) {
      if (typeof value === "string" && !["id", "key", "nv_label", "nav_label", "binding", "derivedFromGoldenReference", "goldenReferenceId"].includes(key)) {
        current[key] = domainString(value);
      } else {
        rewrite(value);
      }
    }
    if (current?.attrs?.data?.list) {
      current.attrs.data.list = { AppID: 41, ListID: LIST_ID, Type: 1, Title: "Loan Requests", ListSetID: APP_ID };
    }
  };
  rewrite(node);
}

function domainString(value) {
  const replacements = new Map([
    ["Event", "Asset"],
    ["Stage", "Loan Phase"],
    ["Region", "Location"],
    ["Registration", "Checkout"],
    ["Budget", "Replacement Cost"],
    ["Events", "Loan Requests"],
    ["Event Type", "Asset Type"],
  ]);
  return replacements.get(value) || value
    .replaceAll("Event Portfolio", "Asset Loan Portfolio")
    .replaceAll("event_portfolio", "asset_loan_portfolio")
    .replaceAll("campaign", "readiness")
    .replaceAll("Campaign", "Readiness");
}

function addStaticFilterConsumerBindings(root) {
  const tokens = [];
  visit(root, (node) => {
    if (["radio-filter", "select-filter", "checkbox-filter"].includes(node.type)) {
      tokens.push(node.binding, node?.attrs?.data?.field, node?.attrs?.display_f, node?.attrs?.value_f);
    }
  });
  const filterBindings = tokens.filter(Boolean).map(String);
  visit(root, (node) => {
    if (["collection", "summary"].includes(node.type)) {
      node.attrs = node.attrs || {};
      node.attrs.filterBindings = filterBindings;
      node.attrs.data = node.attrs.data || { list: { ListID: LIST_ID, Title: "Loan Requests" } };
      node.attrs.data.list = { ListID: LIST_ID, Title: "Loan Requests" };
    }
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ids(node) {
  return [node?.id, node?.name, node?.nv_label, node?.attrs?.nv_label, node?.attrs?.derivedFromGoldenReference].filter(Boolean).map(String);
}

function find(node, id) {
  let found = null;
  visit(node, (current) => {
    if (!found && ids(current).includes(id)) found = current;
  });
  return found;
}

function visit(node, fn) {
  if (!node || typeof node !== "object") return;
  fn(node);
  for (const child of node.children || []) visit(child, fn);
}

function writeJson(dir, name, value) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
}

function writePackage(dir, name, data) {
  const file = path.join(dir, `${name}.yapk`);
  fs.writeFileSync(file, `${JSON.stringify({ Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(data), "utf8")).toString("base64") })}\n`);
  return file;
}

function run(args) {
  return spawnSync(process.execPath, ["scripts/validate-dashboard-golden-reference-conformance.mjs", ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function expectPass(label, args) {
  const result = run(args);
  assert.equal(result.status, 0, `${label} should pass.\n${result.stdout}\n${result.stderr}`);
}

function expectCode(label, args, code) {
  const result = run(args);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0, `${label} should fail.`);
  assert.match(output, new RegExp(code), `${label} did not report ${code}.\n${output}`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-golden-reference-"));
try {
  expectPass("updated golden reference lints cleanly with approved table-internal flex_grid nodes", ["--registry", "docs/reference/dashboard-golden-references.json"]);
  expectPass("Office Asset dashboard maps own fields into export-shaped Event Portfolio structure", ["--selection", writeJson(tempDir, "selection.json", selection()), "--blueprint", writeJson(tempDir, "blueprint.json", blueprint()), "--package", writePackage(tempDir, "valid", decoded())]);

  const kpiGridRegistry = registry();
  find(kpiGridRegistry.references[0].exportShape._ak_c, "event_portfolio_kpi_row").type = "flex_grid";
  expectCode("high-level event_portfolio_kpi_row as flex_grid", ["--registry", writeJson(tempDir, "kpi-grid-registry.json", kpiGridRegistry)], "DASH_GOLDEN_REFERENCE_HIGH_LEVEL_GRID");

  const pipelineHeaderGridRegistry = registry();
  find(pipelineHeaderGridRegistry.references[0].exportShape._ak_c, "event_portfolio_pipeline_header").type = "grid";
  expectCode("event_portfolio_pipeline_header as Grid", ["--registry", writeJson(tempDir, "pipeline-header-grid-registry.json", pipelineHeaderGridRegistry)], "DASH_GOLDEN_REFERENCE_HIGH_LEVEL_GRID");

  const missingWidthRegistry = registry();
  delete find(missingWidthRegistry.references[0].exportShape._ak_c, "event_portfolio_header_band").width;
  expectCode("required section not Full width", ["--registry", writeJson(tempDir, "missing-width-registry.json", missingWidthRegistry)], "DASH_GOLDEN_REFERENCE_REQUIRED_FULL_WIDTH");

  const contentPaddingRegistry = registry();
  find(contentPaddingRegistry.references[0].exportShape._ak_c, "Content").attrs.container.padding = { top: 12, right: 0, bottom: 0, left: 0 };
  expectCode("root Content padding nonzero", ["--registry", writeJson(tempDir, "content-padding-registry.json", contentPaddingRegistry)], "DASH_GOLDEN_REFERENCE_ROOT_CONTENT_PADDING");

  const duplicatedFilterRegistry = registry();
  const statusFilter = find(duplicatedFilterRegistry.references[0].exportShape._ak_c, "event_portfolio_status_filter");
  statusFilter.attrs.placeholder = statusFilter.attrs.lab.value;
  expectCode("filter label and placeholder duplicated", ["--registry", writeJson(tempDir, "duplicated-filter-registry.json", duplicatedFilterRegistry)], "DASH_GOLDEN_REFERENCE_FILTER_LABEL_PLACEHOLDER_DUPLICATED");

  const missingDataFieldRegistry = registry();
  delete find(missingDataFieldRegistry.references[0].exportShape._ak_c, "event_portfolio_region_filter").attrs.data.field;
  expectCode("radio-filter missing attrs.data.field", ["--registry", writeJson(tempDir, "missing-data-field-registry.json", missingDataFieldRegistry)], "DASH_GOLDEN_REFERENCE_FILTER_DATA_FIELD_MISSING");
  const titleTypographyDrift = registry();
  find(titleTypographyDrift.references[0].exportShape._ak_c, "event_portfolio_title").attrs.heads.ty = [null, "h5-medium"];
  expectCode("reference title typography token drift", ["--registry", writeJson(tempDir, "title-typography-drift-registry.json", titleTypographyDrift)], "DASH_GOLDEN_REFERENCE_TYPOGRAPHY_TOKEN_DRIFT");

  const filterScalarLablayRegistry = registry();
  find(filterScalarLablayRegistry.references[0].exportShape._ak_c, "event_portfolio_status_filter").attrs.lablay = "top";
  expectCode("filter scalar lablay rejected", ["--registry", writeJson(tempDir, "filter-scalar-lablay-registry.json", filterScalarLablayRegistry)], "DASH_GOLDEN_REFERENCE_FILTER_LABEL_LAYOUT_DRIFT");

  const filterMissingPlaceholderColorRegistry = registry();
  delete find(filterMissingPlaceholderColorRegistry.references[0].exportShape._ak_c, "event_portfolio_status_filter").attrs.edit.placeholder;
  expectCode("filter placeholder color missing", ["--registry", writeJson(tempDir, "filter-placeholder-color-registry.json", filterMissingPlaceholderColorRegistry)], "DASH_GOLDEN_REFERENCE_FILTER_PLACEHOLDER_COLOR_MISSING");

  const filterMissingFixedWidthRegistry = registry();
  delete find(filterMissingFixedWidthRegistry.references[0].exportShape._ak_c, "event_portfolio_status_filter").attrs.common.positioning.width;
  expectCode("filter fixed width positioning missing", ["--registry", writeJson(tempDir, "filter-fixed-width-registry.json", filterMissingFixedWidthRegistry)], "DASH_GOLDEN_REFERENCE_FILTER_WIDTH_POSITIONING_MISSING");

  expectCode("provenance markers with simplified reconstructed structure", ["--package", writePackage(tempDir, "semantic-shell", decoded(semanticShellResource()))], "DASH_GOLDEN_EXPORT_SHAPE_SIMPLIFIED");
  expectCode("unrelated generated app copies Event-specific fields", ["--package", writePackage(tempDir, "marketing-leak", decoded({ ...dashboardResource(), goldenReferenceSelection: selection({ gridTableFieldMapping: [{ displayLabel: "Region", sourceField: "Budget" }] }) }))], "DASH_GOLDEN_MARKETING_FIELD_LEAKAGE");
  expectCode("user field rendered as dynamic-field", ["--package", writePackage(tempDir, "user-dynamic-field", decoded(dashboardResource((root) => { const user = find(root, "event_pipeline_grid_table_item_grid_row_6"); user.children[0].type = "dynamic-field"; user.children[0].name = "Borrower"; user.children[0].attrs = { field: "Borrower", fieldType: "User" }; })))], "DASH_GOLDEN_USER_FIELD_DYNAMIC_FIELD");
  expectPass("user field rendered as dynamic-user", ["--package", writePackage(tempDir, "user-dynamic-user", decoded())]);
  expectCode("generated dashboard title typography drift rejected", ["--package", writePackage(tempDir, "generated-title-typography-drift", decoded(dashboardResource((root) => { find(root, "event_portfolio_title").attrs.heads.ty = [null, "h5-medium"]; })))], "DASH_GOLDEN_RESOURCE_TYPOGRAPHY_TOKEN_DRIFT");
  expectCode("generated dashboard KPI value typography drift rejected", ["--package", writePackage(tempDir, "generated-kpi-typography-drift", decoded(dashboardResource((root) => { find(root, "event_portfolio_kpi_planned_events_value").attrs.heads.ty = [null, "h5-medium"]; })))], "DASH_GOLDEN_RESOURCE_TYPOGRAPHY_TOKEN_DRIFT");
  expectCode("generated grid-table header typography drift rejected", ["--package", writePackage(tempDir, "generated-grid-header-typography-drift", decoded(dashboardResource((root) => { find(root, "Event Column Header").attrs.heads.ty = [null, "h5-medium"]; })))], "DASH_GOLDEN_RESOURCE_GRID_TABLE_HEADER_TYPOGRAPHY_TOKEN_DRIFT");
  expectCode("generated filter scalar lablay rejected", ["--package", writePackage(tempDir, "generated-filter-scalar-lablay", decoded(dashboardResource((root) => { find(root, "event_portfolio_status_filter").attrs.lablay = "top"; })))], "DASH_GOLDEN_RESOURCE_FILTER_LABEL_LAYOUT_DRIFT");
  expectCode("generated filter fixed width missing rejected", ["--package", writePackage(tempDir, "generated-filter-width-missing", decoded(dashboardResource((root) => { delete find(root, "event_portfolio_status_filter").attrs.common.positioning.width; })))], "DASH_GOLDEN_RESOURCE_FILTER_WIDTH_POSITIONING_MISSING");

  expectCode("runtime filter proof selected value but no table or KPI change", ["--runtime-filter-proof", writeJson(tempDir, "runtime-no-change.json", { selectedFilterValue: "Singapore", before: { tableRows: [["Laptop", "Open"]], kpiValues: ["4"] }, after: { tableRows: [["Laptop", "Open"]], kpiValues: ["4"] }, screenshots: ["before.png", "after.png"] })], "DASH_FILTER_RUNTIME_DATA_UNCHANGED");
  expectPass("runtime filter proof shows before and after data change", ["--runtime-filter-proof", writeJson(tempDir, "runtime-change.json", { selectedFilterValue: "Singapore", before: { tableRows: [["Laptop", "Open"]], kpiValues: ["4"] }, after: { tableRows: [["Monitor", "Open"]], kpiValues: ["1"] }, screenshots: ["before.png", "after.png"] })]);

  console.log(JSON.stringify({ status: "pass", cases: 23 }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const APP_ID = "2069000000000000001";
const LIST_ID = "2069000000000000100";

function style() {
  return { widthtype: [null, "2"], direction: [null, "row"], gap: [null, 12], align_items: [null, "center"], justify_content: [null, "space-between"] };
}

function selection(patch = {}) {
  return {
    selectedGoldenReferenceId: "event_portfolio_dashboard_golden_reference",
    selectedSubRegionReferences: [
      "event_portfolio_header_band",
      "event_portfolio_filter_group",
      "kpi_cards_wrapper",
      "event_portfolio_pipeline_section",
      "Event Pipeline Grid-Table",
    ],
    plannedRegions: { filters: true, kpis: true, gridTable: true, actions: true },
    businessMapping: { pagePurpose: "Office asset loan operations dashboard" },
    dataListSourceMapping: [{ businessObject: "Loan Requests", listTitle: "Loan Requests" }],
    kpiMetricMapping: [{ metric: "Open Loans", sourceField: "ListDataID", calculation: "COUNT active loans" }],
    filterFieldMapping: [{ filter: "Status", sourceField: "Loan Status" }],
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
    derivedFromGoldenReference: "event_portfolio_dashboard_golden_reference",
    goldenReferenceSelection: selection(),
    plannedRegions: { filters: true, kpis: true, gridTable: true },
    sections: [
      { id: "header", derivedFromGoldenReference: "event_portfolio_header_band" },
      { id: "filters", derivedFromGoldenReference: "event_portfolio_filter_group" },
      { id: "kpis", derivedFromGoldenReference: "kpi_cards_wrapper" },
      { id: "pipeline", derivedFromGoldenReference: "event_portfolio_pipeline_section", children: [{ id: "queue", derivedFromGoldenReference: "Event Pipeline Grid-Table" }] },
    ],
    ...patch,
  };
}

function dashboardResource(patch = {}) {
  return {
    type: "page",
    title: "Office Asset Loan Dashboard",
    derivedFromGoldenReference: "event_portfolio_dashboard_golden_reference",
    plannedRegions: { filters: true, kpis: true, gridTable: true },
    goldenReferenceSelection: selection(),
    children: [{
      type: "container",
      name: "Main",
      attrs: { style: style() },
      children: [{
        type: "container",
        name: "Content",
        attrs: { style: style() },
        children: [
          { type: "container", name: "Header", attrs: { derivedFromGoldenReference: "event_portfolio_header_band", style: style() }, children: [{ type: "heading", attrs: { headc: { title: { value: "Office Asset Loan Dashboard" } } } }] },
          { type: "container", name: "Filters", attrs: { derivedFromGoldenReference: "event_portfolio_filter_group", style: style() }, children: [{ type: "select-filter", name: "Loan Status Filter", attrs: { data: { list: { ListID: LIST_ID, Title: "Loan Requests" }, field: "Text1" } } }] },
          { type: "container", name: "KPI Cards", attrs: { derivedFromGoldenReference: "kpi_cards_wrapper", style: style() }, children: [{ type: "container", name: "Open Loans KPI Card", children: [{ type: "icon", attrs: { icon: { icon: "fa-solid fa-boxes-stacked", size: [null, 20] } } }] }] },
          { type: "container", name: "Pipeline", attrs: { derivedFromGoldenReference: "event_portfolio_pipeline_section", style: style() }, children: [
            { type: "collection", name: "Loan Request Grid-Table", attrs: { derivedFromGoldenReference: "Event Pipeline Grid-Table", data: { list: { ListID: LIST_ID, Title: "Loan Requests" } } }, children: [{ type: "dynamic-field", attrs: { field: "Title" } }] },
          ] },
        ],
      }],
    }],
    ...patch,
  };
}

function decoded(resource = dashboardResource(), title = "Office Asset Loan Management") {
  return {
    ListSet: { ListID: APP_ID, Title: title },
    Pages: [{ Type: 103, Title: "Office Asset Loan Dashboard", LayoutID: "dashboard", LayoutInResources: [{ ID: "dashboard", RefId: "dashboard", Resource: JSON.stringify(resource) }] }],
    Childs: [{ List: { ListID: LIST_ID, Title: "Loan Requests" }, Fields: [{ FieldName: "Title" }, { FieldName: "Text1" }] }],
  };
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
  return spawnSync(process.execPath, ["scripts/validate-dashboard-golden-reference-conformance.mjs", ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
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
  expectPass("Facility/Office Asset dashboard maps own fields into Event Portfolio structure", ["--selection", writeJson(tempDir, "selection.json", selection()), "--blueprint", writeJson(tempDir, "blueprint.json", blueprint()), "--package", writePackage(tempDir, "valid", decoded())]);

  expectCode("blueprint missing golden-reference selection", ["--blueprint", writeJson(tempDir, "no-selection-blueprint.json", blueprint({ goldenReferenceSelection: undefined, goldenReferenceSelectionRef: undefined }))], "DASH_GOLDEN_BLUEPRINT_SELECTION_MISSING");
  expectCode("generated dashboard missing derivedFromGoldenReference", ["--package", writePackage(tempDir, "no-derived", decoded(dashboardResource({ derivedFromGoldenReference: undefined })))], "DASH_GOLDEN_RESOURCE_DERIVED_FROM_MISSING");
  expectCode("KPI section missing kpi_cards_wrapper provenance", ["--package", writePackage(tempDir, "no-kpi-ref", decoded(dashboardResource({ children: dashboardResource().children.map((main) => ({ ...main, children: main.children.map((content) => ({ ...content, children: content.children.map((child) => child.name === "KPI Cards" ? { ...child, attrs: { ...child.attrs, derivedFromGoldenReference: undefined } } : child) })) })) })))], "DASH_GOLDEN_RESOURCE_KPI_WRAPPER_MISSING");
  expectCode("filter section missing event_portfolio_filter_group provenance", ["--package", writePackage(tempDir, "no-filter-ref", decoded(dashboardResource({ children: dashboardResource().children.map((main) => ({ ...main, children: main.children.map((content) => ({ ...content, children: content.children.map((child) => child.name === "Filters" ? { ...child, attrs: { ...child.attrs, derivedFromGoldenReference: undefined } } : child) })) })) })))], "DASH_GOLDEN_RESOURCE_FILTER_GROUP_MISSING");
  expectCode("grid/table section missing Event Pipeline Grid-Table provenance", ["--package", writePackage(tempDir, "no-grid-ref", decoded(dashboardResource({ children: dashboardResource().children.map((main) => ({ ...main, children: main.children.map((content) => ({ ...content, children: content.children.map((child) => child.name === "Pipeline" ? { ...child, children: child.children.map((grandchild) => ({ ...grandchild, attrs: { ...grandchild.attrs, derivedFromGoldenReference: undefined } })) } : child) })) })) })))], "DASH_GOLDEN_RESOURCE_GRID_TABLE_MISSING");
  expectCode("unrelated app copies Event-specific fields", ["--package", writePackage(tempDir, "marketing-leak", decoded(dashboardResource({ goldenReferenceSelection: selection({ gridTableFieldMapping: [{ displayLabel: "Event", sourceField: "Stage" }] }) })))], "DASH_GOLDEN_MARKETING_FIELD_LEAKAGE");
  expectCode("dashboard only has Main > Content shell", ["--package", writePackage(tempDir, "shell-only", decoded({ type: "page", derivedFromGoldenReference: "event_portfolio_dashboard_golden_reference", plannedRegions: { filters: true, kpis: true, gridTable: true }, children: [{ type: "container", name: "Main", children: [{ type: "container", name: "Content", children: [] }] }] }))], "DASH_GOLDEN_SHELL_ONLY");
  expectCode("planned table/queue lacks grid-table Collection", ["--package", writePackage(tempDir, "no-collection", decoded(dashboardResource({ children: dashboardResource().children.map((main) => ({ ...main, children: main.children.map((content) => ({ ...content, children: content.children.map((child) => child.name === "Pipeline" ? { ...child, children: [{ type: "data-list", attrs: { derivedFromGoldenReference: "Event Pipeline Grid-Table" } }] } : child) })) })) })))], "DASH_GOLDEN_GRID_TABLE_COLLECTION_MISSING");

  console.log(JSON.stringify({ status: "pass", cases: 9 }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

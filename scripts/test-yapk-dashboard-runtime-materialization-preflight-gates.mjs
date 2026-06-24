#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const APP_ID = "2069059894715052033";
const LIST_ID = "2069059894715052043";
const PAGE_ID = "2069063982622138369";

function field(name, type = "input", fieldType = "Text", extra = {}) {
  return {
    FieldID: `${name}-id`,
    FieldName: name,
    InternalName: name,
    DisplayName: name,
    Type: type,
    FieldType: fieldType,
    Category: 0,
    FieldIndex: name === "Title" ? 0 : 1,
    IsSystem: name === "Title",
    IsIndex: name === "Title",
    Status: 0,
    ...extra,
  };
}

function style() {
  return {
    widthtype: [null, "1"],
    direction: [null, "column"],
    gap: [null, 12],
    align_items: [null, "stretch"],
    justify_content: [null, "flex-start"],
  };
}

function collection(name = "Loan Collection", extra = {}) {
  return {
    type: "collection",
    id: `${name.toLowerCase().replace(/\W+/g, "-")}-collection`,
    name,
    attrs: {
      data: {
        list: { ListID: LIST_ID, Title: "Loan Transactions" },
        filter: [{ field: "Text1", value: "filter_status" }],
        link: "2069063982622139000",
        opentype: "slide",
        modalsize: 2,
      },
      ...(extra.attrs || {}),
    },
    children: [{ type: "flex_grid", id: `${name}-item-grid`, children: [] }],
    ...extra,
  };
}

function filterControl() {
  return {
    type: "select-filter",
    id: "priority-filter",
    name: "Priority Filter",
    attrs: {
      data: { list: { ListID: LIST_ID, Title: "Loan Transactions" }, field: "Text1" },
      binding: "priorityFilter",
      display_f: "Text1",
      value_f: "ListDataID",
      lablay: [null, "top"],
      lab: { value: "Priority", ty: [null, "xs-light"] },
      edit: { pcolor: "#667085", normal: { border: { radius: [null, 6] } } },
    },
  };
}

function summaryControl() {
  return {
    type: "summary",
    id: "open-requests-summary",
    name: "Open Requests Summary",
    attrs: {
      data: {
        list: { ListID: LIST_ID, Title: "Loan Transactions" },
        field: "ListDataID",
        method: "count",
      },
    },
  };
}

function visibleKpiText() {
  return {
    type: "heading",
    id: "open-requests-kpi-value",
    name: "Open Requests KPI Value",
    attrs: { heads: { title: { value: "Open Requests" }, ty: [null, "h2-bold"], color: [null, "text-primary"] } },
  };
}

function dashboardResource(children) {
  return JSON.stringify({
    title: "Asset Loan Operations Dashboard",
    type: "page",
    children: [{
      type: "container",
      id: "Main",
      name: "Main",
      attrs: { style: style() },
      children: [{
        type: "container",
        id: "Content",
        name: "Content",
        attrs: { style: style() },
        children,
      }],
    }],
  });
}

function decoded({ dashboardChildren = [], childPatch = {} } = {}) {
  return {
    ListSet: { ListID: APP_ID, Title: "Office Asset Loan Management", Flags: 1, LayoutView: JSON.stringify({ sort: [] }) },
    Pages: [{
      Type: 103,
      Title: "Asset Loan Operations Dashboard",
      LayoutID: PAGE_ID,
      LayoutInResources: [{ ID: PAGE_ID, RefId: PAGE_ID, Resource: dashboardResource(dashboardChildren) }],
    }],
    Childs: [{
      List: { ListID: LIST_ID, Title: "Loan Transactions", Flags: 1, LayoutView: null },
      Fields: [
        field("Title"),
        field("Text1", "select"),
        field("Text2", "identity-picker"),
        field("Decimal1", "input_number", "Decimal"),
      ],
      Layouts: [],
      RemindRules: [],
      PublicForms: [],
      FlowMappings: [],
      ...childPatch,
    }],
    Forms: [],
    FormNewReports: [],
    DataReports: [],
    PortalInfo: null,
  };
}

function wrapper(data) {
  return {
    PackageId: "dashboard-runtime-materialization-test",
    TenantID: "2069000000000000001",
    AppID: 41,
    ListID: data.ListSet.ListID,
    Title: "Office Asset Loan Management",
    Description: "",
    IconUrl: JSON.stringify({ b: "#E6F0FF", i: "fa-solid fa-boxes-stacked", c: "#0065FF" }),
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(data), "utf8")).toString("base64"),
    Notes: "",
    Author: "test",
    Date: "2026-06-23T00:00:00Z",
    Version: "0.0.0-test",
    Sign: Buffer.alloc(32, 1).toString("base64"),
  };
}

function writePackage(dir, name, data) {
  const file = path.join(dir, `${name}.yapk`);
  fs.writeFileSync(file, `${JSON.stringify(wrapper(data))}\n`);
  return file;
}

function run(args) {
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function expectCode(label, result, code) {
  assert.notEqual(result.status, 0, `${label} should fail.\n${result.stdout}\n${result.stderr}`);
  assert.match(`${result.stdout}\n${result.stderr}`, new RegExp(code), `${label} did not report ${code}.\n${result.stdout}\n${result.stderr}`);
}

function expectPass(label, result) {
  assert.equal(result.status, 0, `${label} should pass.\n${result.stdout}\n${result.stderr}`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yapk-dashboard-runtime-materialization-"));
const results = [];

try {
  const kpiNoSummary = writePackage(tempDir, "kpi-no-summary", decoded({
    dashboardChildren: [{
      type: "container",
      id: "event_portfolio_kpi_planned_events",
      name: "KPI Card - Active Loans",
      attrs: { style: style() },
      children: [{ type: "heading", name: "Active Loans Value", attrs: { headc: { title: { value: "12" } } } }],
    }, collection()],
  }));
  expectCode("KPI without Summary fails export-shape", run(["scripts/validate-generated-yapk-export-shape.mjs", "--package", kpiNoSummary]), "DASHBOARD_KPI_SUMMARY_CONTROL_MISSING");
  results.push("kpi-no-summary");

  const embeddedRows = writePackage(tempDir, "embedded-listdatas", decoded({ childPatch: { ListDatas: [{ Title: "Sample row" }] } }));
  expectCode("embedded ListDatas fails generic YAPK validator", run(["validate-yapk-package.js", embeddedRows]), "YAPK_EMBEDDED_LISTDATAS_FORBIDDEN");
  expectCode("embedded ListDatas fails canonical schema validator", run(["scripts/validate-standard-package-schema.mjs", embeddedRows]), "YAPK_EMBEDDED_LISTDATAS_FORBIDDEN");
  results.push("embedded-listdatas");

  const planFile = path.join(tempDir, "empty-parse-app-plan.md");
  fs.writeFileSync(planFile, `# Office Asset Loan Management - Yeeflow App Plan

This non-empty App Plan says the app requires data lists, dashboard pages, navigation groups, approval forms, FormNewReports, DataReports, and workflows, but intentionally omits the canonical resource tables/headings to prove the parser must fail closed rather than returning zero planned resources.

## Notes

Dashboard pages and data lists are required.
`);
  expectCode("non-empty resource-like App Plan with zero parsed resources fails closed", run(["scripts/validate-generated-final-resource-completeness.mjs", "--plan", planFile, "--package", kpiNoSummary]), "GENERATED_FINAL_APP_PLAN_RESOURCE_PARSE_EMPTY");
  results.push("plan-parser-fail-closed");

  const currentSchemaPlan = path.join(tempDir, "current-schema-app-plan.md");
  fs.writeFileSync(currentSchemaPlan, `# Office Asset Loan Management - Yeeflow App Plan

## 4. Data Lists and Document Libraries Plan
| List Name | Purpose | Key Fields |
|---|---|---|
| Loan Transactions | active and historical loans | Title, Text1 |

## 14. Dashboard Pages Plan
Page name: Asset Loan Operations Dashboard.
Business purpose: active loan operations.

| Dashboard Page Name | Business Purpose | Source Data Lists/Business Objects |
|---|---|---|
| Asset Loan Operations Dashboard | active loan operations | Loan Transactions |

#### Dashboard Filters
| Filter Name | Source Data List | Filter Field |
|---|---|---|
| Priority Filter | Loan Transactions | Text1 |

#### Summary Metrics
| Metric Name | Source Data List | Source Field(s) | Calculation Logic |
|---|---|---|---|
| Open Requests | Loan Transactions | ListDataID | count records |

#### Record Display Control Selection
| Dashboard Page | Section | Data Source | Display Need | Selected Record Display Control | Selected Collection Presentation Reference |
|---|---|---|---|---|---|
| Asset Loan Operations Dashboard | Active Loans | Loan Transactions | dense operational row scanning | Collection | collection_control_grid_table |
`);
  const currentSchemaPackage = writePackage(tempDir, "current-schema-completeness-pass", decoded({
    dashboardChildren: [filterControl(), summaryControl(), visibleKpiText(), collection()],
  }));
  expectPass("current unified App Plan schema parses resources and passes completeness", run(["scripts/validate-generated-final-resource-completeness.mjs", "--plan", currentSchemaPlan, "--package", currentSchemaPackage]));
  results.push("current-schema-parser-pass");

  const pageTitleCollection = writePackage(tempDir, "page-title-collection", decoded({
    dashboardChildren: [{
      type: "container",
      id: "page_title_section",
      name: "page_title_section",
      attrs: { style: style() },
      children: [collection()],
    }],
  }));
  expectCode("Collection in page_title_section fails", run(["scripts/validate-dashboard-generation-hard-gates.mjs", "--package", pageTitleCollection]), "DASH_PAGE_TITLE_SECTION_BUSINESS_CONTROL_FORBIDDEN");
  results.push("page-title-purity");

  const unboundFilter = writePackage(tempDir, "unbound-filter", decoded({
    dashboardChildren: [{
      type: "select-filter",
      id: "status-filter",
      name: "Status Filter",
      attrs: {
        data: { list: { ListID: LIST_ID, Title: "Loan Transactions" }, field: "Text1", filter: [{ operator: 0, value: 0 }] },
        display_f: "Text1",
        value_f: "ListDataID",
        lablay: [null, "top"],
        lab: { ty: [null, "xs-light"] },
        edit: { pcolor: "#667085", normal: { border: { radius: [null, 6] } } },
      },
    }, collection("Unbound Collection", { attrs: { data: { list: { ListID: LIST_ID, Title: "Loan Transactions" }, filter: [] } } })],
  }));
  expectCode("unbound filter fails", run(["scripts/validate-dashboard-generation-hard-gates.mjs", "--package", unboundFilter]), "DASH_FILTER_COLLECTION_BINDING_MISSING|DASH_FILTER_OPERATOR_VALUE_PLACEHOLDER");
  results.push("filter-linkage");

  const sharedWrapper = writePackage(tempDir, "shared-wrapper", decoded({
    dashboardChildren: [{
      type: "container",
      id: "content_card_wrapper",
      name: "content_card_wrapper",
      attrs: { style: style() },
      children: [collection("Primary Queue"), collection("Secondary Queue")],
    }],
  }));
  expectCode("shared content_card_wrapper fails", run(["scripts/validate-dashboard-generation-hard-gates.mjs", "--package", sharedWrapper]), "DASH_CONTENT_CARD_WRAPPER_COLLECTION_COUNT_INVALID");
  results.push("independent-wrapper");

  const wrongDynamicUser = writePackage(tempDir, "wrong-dynamic-user", decoded({
    dashboardChildren: [{
      type: "container",
      id: "content_card_wrapper",
      name: "content_card_wrapper",
      attrs: { style: style() },
      children: [collection("User Queue", { children: [{ type: "dynamic-field", name: "Owner", attrs: { data: { list: { ListID: LIST_ID }, field: "Text2" } } }] })],
    }],
  }));
  expectCode("user field rendered as dynamic-field fails", run(["scripts/validate-dashboard-generation-hard-gates.mjs", "--package", wrongDynamicUser]), "DASH_DYNAMIC_USER_FIELD_TYPE_REQUIRED");
  results.push("dynamic-user-type");

  console.log(JSON.stringify({ status: "pass", cases: results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

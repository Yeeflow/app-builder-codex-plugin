#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts/validate-data-table-golden-references.mjs");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "data-table-golden-"));
const results = [];

try {
  expectPass("registry validates", ["--registry"]);
  expectPass("standard scroll generated Data table passes", ["--resource", writeJson("standard-scroll.json", dataTable("data_table_control_standard_scroll")), "--surface", "dashboard"]);
  expectPass("standard no-scroll generated Data table passes", ["--resource", writeJson("standard-no-scroll.json", dataTable("data_table_control_standard_no_scroll")), "--surface", "data-list-form"]);
  expectPass("caption scroll generated Data table passes", ["--resource", writeJson("caption-scroll.json", dataTable("data_table_control_caption_scroll")), "--surface", "approval-form-task"]);
  expectPass("package with all Data table templates passes", ["--package", writeYapk("all-data-tables.yapk", [dataTable("data_table_control_standard_scroll"), dataTable("data_table_control_standard_no_scroll"), dataTable("data_table_control_caption_scroll")])]);

  expectCode("unknown template fails", ["--resource", writeJson("unknown-template.json", dataTable("data_table_control_unknown")), "--surface", "dashboard"], "DATA_TABLE_TEMPLATE_UNKNOWN");
  expectCode("missing approved template id fails", ["--resource", writeJson("missing-template.json", dataTable("data_table_control_standard_scroll", { omitTemplateId: true })), "--surface", "dashboard"], "DATA_TABLE_TEMPLATE_ID_MISSING");
  expectCode("wrong column width mode fails", ["--resource", writeJson("wrong-cwt.json", dataTable("data_table_control_standard_no_scroll", { forceCwt: [null, "0"] })), "--surface", "dashboard"], "DATA_TABLE_COLUMN_WIDTH_MODE_INVALID");
  expectCode("caption template missing caption contract fails", ["--resource", writeJson("missing-caption.json", dataTable("data_table_control_caption_scroll", { removeCaption: true })), "--surface", "dashboard"], "DATA_TABLE_CAPTION_CONTRACT_INVALID");
  expectCode("standard template enabling caption fails", ["--resource", writeJson("caption-forbidden.json", dataTable("data_table_control_standard_scroll", { enableCaption: true })), "--surface", "dashboard"], "DATA_TABLE_CAPTION_FORBIDDEN");
  expectCode("locked style mutation fails", ["--resource", writeJson("style-drift.json", dataTable("data_table_control_standard_scroll", { mutateRadius: true })), "--surface", "dashboard"], "DATA_TABLE_LOCKED_STYLE_DRIFT");
  expectCode("missing data source fails", ["--resource", writeJson("missing-source.json", dataTable("data_table_control_standard_scroll", { missingSource: true })), "--surface", "dashboard"], "DATA_TABLE_SOURCE_MISSING");
  expectCode("missing display Field binding fails", ["--resource", writeJson("missing-column-field.json", dataTable("data_table_control_standard_scroll", { missingColumnField: true })), "--surface", "dashboard"], "DATA_TABLE_COLUMN_BINDING_INVALID");
  expectCode("placeholder token fails", ["--resource", writeJson("placeholder.json", dataTable("data_table_control_caption_scroll", { placeholderToken: true })), "--surface", "dashboard"], "DATA_TABLE_CONTROL_PLACEHOLDER_UNRESOLVED");

  const appPlan = writeText("app-plan.md", appPlanText());
  expectPass("App Plan-selected Data table templates materialized pass", ["--package", writeYapk("planned-present.yapk", [dataTable("data_table_control_standard_scroll"), dataTable("data_table_control_caption_scroll")]), "--plan", appPlan]);
  expectCode("App Plan-selected Data table template missing from package fails", ["--package", writeYapk("planned-missing.yapk", [dataTable("data_table_control_standard_scroll")]), "--plan", appPlan], "DATA_TABLE_PLANNED_TEMPLATE_NOT_MATERIALIZED");

  printSummary(0);
} catch (error) {
  results.push({ name: "unexpected test harness error", status: "fail", error: error.message });
  printSummary(1);
}

function dataTable(templateId, options = {}) {
  const file = {
    data_table_control_standard_scroll: "data-table-control-standard-scroll.template.json",
    data_table_control_standard_no_scroll: "data-table-control-standard-no-scroll.template.json",
    data_table_control_caption_scroll: "data-table-control-caption-scroll.template.json",
  }[templateId] || "data-table-control-standard-scroll.template.json";
  const source = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference", file), "utf8"));
  const root = JSON.parse(JSON.stringify(source._ak_c || source));
  root.id = `${templateId}-control`;
  if (!options.omitTemplateId) {
    root.templateId = templateId;
    root.dataTableTemplateId = templateId;
    root.attrs.templateId = templateId;
    root.attrs.dataTableTemplateId = templateId;
  }
  if (templateId === "data_table_control_unknown") {
    root.templateId = templateId;
    root.dataTableTemplateId = templateId;
    root.attrs.templateId = templateId;
    root.attrs.dataTableTemplateId = templateId;
  }
  root.attrs.data = options.missingSource ? {} : {
    list: { AppID: 41, ListID: "list_travel", ListSetID: "app_travel", Title: "Travel Requests" },
  };
  root.attrs.listarr = [
    { FieldName: "Title", Field: options.missingColumnField ? "" : "Title" },
    { FieldName: "Traveler", Field: "Text0" },
    { FieldName: "Status", Field: "Text1" },
  ];
  if (options.forceCwt) root.attrs.table.cwt = options.forceCwt;
  if (options.removeCaption) root.attrs.caption = {};
  if (options.enableCaption) root.attrs.caption = { display: true };
  if (options.mutateRadius) root.attrs.table.br.top = "--sp--s100";
  if (options.placeholderToken) root.attrs.caption.placeholder = "{{ListID}}";
  return root;
}

function writeYapk(name, controls) {
  const resource = {
    type: "page",
    nv_label: "dashboard-page-layouts-v1.1",
    children: [
      { type: "container", nv_label: "content_card_wrapper", children: controls },
    ],
  };
  const decoded = {
    ListSet: { ListID: "app_travel", Title: "Travel App" },
    Pages: [{ Title: "Operations Dashboard", Type: 103, LayoutInResources: [{ Resource: JSON.stringify(resource) }] }],
    Childs: [{ List: { ListID: "list_travel", Title: "Travel Requests", Defs: [{ FieldName: "Title" }, { FieldName: "Text0" }, { FieldName: "Text1" }] } }],
    Forms: [],
    FormNewReports: [],
    DataReports: [],
    PortalInfo: null,
  };
  const wrapper = {
    PackageId: "pkg_travel",
    TenantID: "tenant",
    AppID: 41,
    ListID: "app_travel",
    Title: "Travel App",
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64"),
  };
  return writeJson(name, wrapper);
}

function appPlanText() {
  return [
    "# Yeeflow App Plan: Travel App",
    "",
    "#### Data Table Template Selection",
    "| Host Surface | Page/Form | Region | Source Resource | Selected Data Table Template | Display Columns | Selection Rationale | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Dashboard | Operations Dashboard | Travel request list | Travel Requests | data_table_control_standard_scroll | Title, Traveler, Status | Many fields, horizontal scrolling acceptable | Generated-final validation |",
    "| Approval Task | Manager Review | Request lookup | Travel Requests | data_table_control_caption_scroll | Title, Traveler, Status | Search/add/import/export toolbar needed | Generated-final validation |",
  ].join("\n");
}

function expectPass(name, args) {
  const result = run(args);
  results.push({ name, status: result.status === 0 ? "pass" : "fail", args, stdout: result.stdout.slice(0, 1000), stderr: result.stderr.slice(0, 1000) });
  assert.equal(result.status, 0, `${name}\n${result.stdout}\n${result.stderr}`);
}

function expectCode(name, args, code) {
  const result = run(args);
  const output = `${result.stdout}\n${result.stderr}`;
  results.push({ name, status: result.status !== 0 && output.includes(code) ? "pass" : "fail", args, expectedCode: code, stdout: result.stdout.slice(0, 1000), stderr: result.stderr.slice(0, 1000) });
  assert.notEqual(result.status, 0, `${name} should fail`);
  assert.match(output, new RegExp(code), `${name} should include ${code}\n${output}`);
}

function run(args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
}

function writeJson(name, value) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
}

function writeText(name, value) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, `${value}\n`);
  return file;
}

function printSummary(exitCode) {
  console.log(JSON.stringify({ status: exitCode === 0 ? "pass" : "fail", results }, null, 2));
  process.exit(exitCode);
}

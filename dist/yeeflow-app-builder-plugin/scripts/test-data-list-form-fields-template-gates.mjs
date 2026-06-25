#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts/validate-data-list-form-fields-template.mjs");
const SUBLIST_TEMPLATE = path.join(ROOT, "docs/reference/data-list-form-control-sublist.template.json");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "data-list-form-fields-v11-"));
const TEMPLATE_ID = "data_list_form_fields_grid_v1_1";
const SUBLIST_TEMPLATE_ID = "data_list_form_control_sublist_v1_1";
const results = [];

try {
  expectPass("registry validates", ["--registry", "docs/reference/data-list-form-field-layout-templates.json"]);
  expectPass("source field-grid template validates", ["--resource", "docs/reference/data-list-form-fields-grid.template.json"]);

  const validForm = dataListFormResource();
  expectPass("Data List form with field-grid inside section_content_area passes", ["--resource", writeJson("valid-form.json", validForm), "--surface", "data-list-form"]);

  const validSixty = dataListFormResource();
  renameContentCard(validSixty, "content_card_60_wrapper");
  expectPass("Data List form field-grid inside 60 percent content card section_content_area passes", ["--resource", writeJson("valid-60-card-form.json", validSixty), "--surface", "data-list-form"]);

  const validForty = dataListFormResource();
  renameContentCard(validForty, "content_card_40_wrapper");
  expectPass("Data List form field-grid inside 40 percent content card section_content_area passes", ["--resource", writeJson("valid-40-card-form.json", validForty), "--surface", "data-list-form"]);

  const outsideSlot = dataListFormResource();
  content(outsideSlot).children.push(fieldGrid());
  firstSectionSlot(outsideSlot).children = [];
  expectCode("field-grid outside section_content_area fails", ["--resource", writeJson("outside-slot.json", outsideSlot), "--surface", "data-list-form"], "DATA_LIST_FORM_FIELDS_PLACEMENT_INVALID");

  const invalidCardSlot = dataListFormResource();
  renameContentCard(invalidCardSlot, "custom_unapproved_card_wrapper");
  expectCode("field-grid inside unapproved card section_content_area fails", ["--resource", writeJson("invalid-card-slot.json", invalidCardSlot), "--surface", "data-list-form"], "DATA_LIST_FORM_FIELDS_PLACEMENT_INVALID");

  const noWrapper = dataListFormResource();
  firstSectionSlot(noWrapper).children = [fieldControl({ type: "input", label: "Asset Name" })];
  expectCode("field control outside wrapper fails", ["--resource", writeJson("field-outside-wrapper.json", noWrapper), "--surface", "data-list-form"], "DATA_LIST_FORM_FIELDS_WRAPPER_MISSING");

  const badMargin = dataListFormResource();
  firstWrapper(badMargin).children[0].attrs.common.margin = [null, { top: 5, right: 5, bottom: 5, left: 5 }];
  expectCode("field control non-zero margin fails", ["--resource", writeJson("bad-margin.json", badMargin), "--surface", "data-list-form"], "DATA_LIST_FORM_FIELDS_FIELD_MARGIN_NOT_ZERO");

  const badNavLabel = dataListFormResource();
  delete firstWrapper(badNavLabel).children[0].nv_label;
  expectCode("field control without business nav_label fails", ["--resource", writeJson("bad-nav-label.json", badNavLabel), "--surface", "data-list-form"], "DATA_LIST_FORM_FIELDS_NAV_LABEL_MISSING");

  const badSpan = dataListFormResource();
  firstWrapper(badSpan).children[1].attrs.common.grid.position = [null, { cSpan: 1 }, null, { cSpan: 1 }];
  expectCode("rich text full-row span mismatch fails", ["--resource", writeJson("bad-span.json", badSpan), "--surface", "data-list-form"], "DATA_LIST_FORM_FIELDS_FULL_ROW_SPAN_INVALID");

  const badSubListProvenance = dataListFormResource();
  delete firstWrapper(badSubListProvenance).children[2].dataListFormControlTemplateId;
  delete firstWrapper(badSubListProvenance).children[2].derivedFromDataListFormControlTemplate;
  expectCode("Sub list without approved control template provenance fails", ["--resource", writeJson("bad-sublist-provenance.json", badSubListProvenance), "--surface", "data-list-form"], "DATA_LIST_FORM_SUBLIST_TEMPLATE_PROVENANCE_MISSING");

  const badSubListStyle = dataListFormResource();
  firstWrapper(badSubListStyle).children[2].attrs.header.ty = [null, "h5-medium"];
  expectCode("Sub list locked template style drift fails", ["--resource", writeJson("bad-sublist-style.json", badSubListStyle), "--surface", "data-list-form"], "DATA_LIST_FORM_SUBLIST_TEMPLATE_STYLE_DRIFT");

  const badMobile = dataListFormResource();
  firstWrapper(badMobile).attrs.columns["3"].list = [{ value: 1, unit: "fr" }, { value: 1, unit: "fr" }];
  expectCode("mobile grid columns above one fails", ["--resource", writeJson("bad-mobile.json", badMobile), "--surface", "data-list-form"], "DATA_LIST_FORM_FIELDS_GRID_MOBILE_COLUMNS_INVALID");

  expectPass("package with form field-grid passes", ["--package", writePackage("valid-package.yapk", decodedPackage(validForm))]);
  expectCode("App Plan missing field layout selection fails", ["--plan", writeText("plan-missing-field-layout.md", appPlan({ omitFieldSelection: true }))], "DATA_LIST_FORM_FIELDS_APP_PLAN_SELECTION_TABLE_MISSING");
  expectCode("App Plan tablet columns above PC fails", ["--plan", writeText("plan-bad-tablet.md", appPlan({ pc: 2, tablet: 3, mobile: 1 }))], "DATA_LIST_FORM_FIELDS_APP_PLAN_TABLET_COLUMNS_INVALID");
  expectPass("App Plan field layout selection passes", ["--plan", writeText("plan-valid.md", appPlan())]);

  console.log(JSON.stringify({ status: "pass", results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function run(args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function expectPass(name, args) {
  const result = run(args);
  results.push({ name, status: result.status === 0 ? "pass" : "fail", args, stdout: result.stdout.slice(0, 1200), stderr: result.stderr.slice(0, 1200) });
  assert.equal(result.status, 0, `${name}\n${result.stdout}\n${result.stderr}`);
}

function expectCode(name, args, code) {
  const result = run(args);
  const output = `${result.stdout}\n${result.stderr}`;
  results.push({ name, status: result.status !== 0 && output.includes(code) ? "pass" : "fail", args, expectedCode: code, stdout: result.stdout.slice(0, 1200), stderr: result.stderr.slice(0, 1200) });
  assert.notEqual(result.status, 0, `${name} should fail`);
  assert.match(output, new RegExp(code), `${name} should include ${code}\n${output}`);
}

function dataListFormResource() {
  return {
    id: "form-root",
    type: "page",
    attrs: { background: { classic: { color: "#f4f7fb" } }, container: { cw: "2", padding: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }] } },
    children: [
      {
        id: "main",
        type: "container",
        attrs: { style: { direction: [null, "column"] } },
        children: [
          {
            id: "content",
            type: "container",
            attrs: { style: { direction: [null, "column"], widthtype: [null, "1"] } },
            children: [
              {
                id: "content_card_wrapper",
                type: "container",
                children: [
                  { id: "section_title_area", type: "container", children: [{ id: "section_title_header", type: "container", children: [] }] },
                  { id: "section_content_area", type: "container", children: [fieldGrid()] },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

function fieldGrid() {
  return {
    id: "form_grid_fields_wrapper",
    type: "flex_grid",
    nv_label: "form_grid_fields_wrapper",
    attrs: {
      columns: {
        "1": { list: [{ value: 1, unit: "fr" }, { value: 1, unit: "fr" }] },
        "2": { list: [{ value: 1, unit: "fr" }, { value: 1, unit: "fr" }] },
        "3": { list: [{ value: 1, unit: "fr" }] },
      },
      rows: { "1": { list: [{ unit: "auto" }] } },
      cgap: { "1": 24 },
      rgap: [null, 12],
    },
    children: [
      fieldControl({ type: "input", label: "Asset Name" }),
      fieldControl({ type: "richtext", label: "Description", span: [null, { cSpan: 2 }, { cSpan: 2 }, { cSpan: 1 }] }),
      fieldControl({ type: "list", label: "Line Items", span: [null, { cSpan: 2 }, { cSpan: 2 }, { cSpan: 1 }] }),
    ],
  };
}

function fieldControl({ type, label, span = null }) {
  if (type === "list") return subListControl({ label, span });
  const control = {
    id: `${type}-${label}`.replace(/\W+/g, "-").toLowerCase(),
    type,
    label,
    nv_label: fieldNavLabel(label),
    attrs: {
      common: {
        margin: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }],
      },
    },
  };
  if (span) control.attrs.common.grid = { position: span };
  return control;
}

function subListControl({ label, span }) {
  const template = JSON.parse(fs.readFileSync(SUBLIST_TEMPLATE, "utf8"));
  const control = structuredClone(template._ak_c || template.templateResource || template);
  control.id = `sublist-${label}`.replace(/\W+/g, "-").toLowerCase();
  control.label = label;
  control.name = label;
  control.title = label;
  control.binding = "LineItems";
  control.nv_label = fieldNavLabel(label);
  control.dataListFormControlTemplateId = SUBLIST_TEMPLATE_ID;
  control.derivedFromDataListFormControlTemplate = SUBLIST_TEMPLATE_ID;
  control.attrs.common.grid = { position: span };
  return control;
}

function fieldNavLabel(label) {
  return `field_${label}`.replace(/\W+/g, "_").toLowerCase();
}

function content(resource) {
  return find(resource, "content");
}

function firstSectionSlot(resource) {
  return find(resource, "section_content_area");
}

function firstWrapper(resource) {
  return find(resource, "form_grid_fields_wrapper");
}

function renameContentCard(resource, identity) {
  const card = find(resource, "content_card_wrapper");
  card.id = identity;
  card.name = identity;
  card.nv_label = identity;
}

function find(node, identity) {
  if (!node || typeof node !== "object") return null;
  if ([node.id, node.name, node.label, node.nv_label].filter(Boolean).map(String).includes(identity)) return node;
  for (const child of node.children || []) {
    const found = find(child, identity);
    if (found) return found;
  }
  return null;
}

function decodedPackage(resource) {
  return {
    ListSet: { ListID: "1909200000000000001", Title: "Data List Form Fields Test" },
    Childs: [
      {
        List: { ListID: "1909200000000000100", Title: "Assets", LayoutView: JSON.stringify({ add: "layout-new-edit", edit: "layout-new-edit" }) },
        Fields: [{ FieldName: "Title", DisplayName: "Asset Name", FieldType: "Text", Type: "input" }],
        Layouts: [
          { LayoutID: "layout-new-edit", Title: "New and Edit form", Type: 1, LayoutInResources: [{ ID: "layout-new-edit", RefId: "layout-new-edit", Resource: JSON.stringify(resource) }] },
        ],
      },
    ],
    Pages: [],
    Forms: [],
    FormNewReports: [],
    DataReports: [],
    IconUrl: "{\"b\":\"#0f766e\",\"i\":\"fa-solid fa-box\",\"c\":\"#ffffff\"}",
  };
}

function appPlan({ omitFieldSelection = false, pc = 2, tablet = 2, mobile = 1 } = {}) {
  const fieldSelection = omitFieldSelection ? "" : `
#### Form Fields Layout Template Selection

| Data List or Library | Custom Form | Field Group | Selected Form Fields Layout Template | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Assets | Asset New/Edit | Basic information | ${TEMPLATE_ID} | ${pc} | ${tablet} | ${mobile} | Description, Line Items | None | Generated-final validation |
`;
  return `
# Office Asset Loan Management - Yeeflow App Plan

## 10. Custom Data List Forms Plan

| Form Name | Form Type | Purpose | Used By | Layout Pattern | Actions Required | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Asset New/Edit | New/Edit | Create and update assets | Coordinators | Data List Form Layouts v1.1 | Yes | Uses current item fields |

#### Data List Form Layout Template Selection

| Data List or Library | Custom Form | Form Usage | Selected Data List Form Layout Template | Business Sections Needed | Related Data / Analytics Needed | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Assets | Asset New/Edit | New/Edit | data_list_form_layout_new_edit_v1_1 | Current item field sections | None | New/Edit focuses on current item editing | Generated-final validation |

${fieldSelection}

## 11. Data List Workflows Plan
`;
}

function writeJson(name, value) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
}

function writeText(name, value) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, `${value.trim()}\n`);
  return file;
}

function writePackage(name, decoded) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, `${JSON.stringify({ Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64") })}\n`);
  return file;
}

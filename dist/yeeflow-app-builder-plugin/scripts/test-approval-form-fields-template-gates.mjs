#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts/validate-approval-form-fields-template.mjs");
const TEMPLATE_2COL_ID = "approval_form_fields_grid_2col_v1_1";
const TEMPLATE_3COL_ID = "approval_form_fields_grid_3col_v1_1";
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "approval-form-fields-v11-"));
const results = [];

try {
  expectPass("registry validates", ["--registry", "docs/reference/approval-form-field-layout-templates.json"]);
  expectPass("2-column source template validates", ["--resource", "docs/reference/approval-form-fields-grid-2col.template.json"]);
  expectPass("3-column source template validates", ["--resource", "docs/reference/approval-form-fields-grid-3col.template.json"]);

  expectPass("Approval form with 2-column field grid inside section_content_area passes", ["--resource", writeJson("valid-2col-form.json", approvalFormResource({ templateId: TEMPLATE_2COL_ID, columns: 2 })), "--surface", "approval-form"]);
  expectPass("Approval form with 3-column field grid inside section_content_area passes", ["--resource", writeJson("valid-3col-form.json", approvalFormResource({ templateId: TEMPLATE_3COL_ID, columns: 3 })), "--surface", "approval-form"]);

  const outsideSlot = approvalFormResource();
  content(outsideSlot).children.push(fieldGrid());
  firstSectionSlot(outsideSlot).children = [];
  expectCode("field grid outside section_content_area fails", ["--resource", writeJson("outside-slot.json", outsideSlot), "--surface", "approval-form"], "APPROVAL_FORM_FIELDS_PLACEMENT_INVALID");

  const invalidCardSlot = approvalFormResource();
  renameContentCard(invalidCardSlot, "content_card_60_wrapper");
  expectCode("field grid inside non-standard approval card wrapper fails", ["--resource", writeJson("invalid-card-slot.json", invalidCardSlot), "--surface", "approval-form"], "APPROVAL_FORM_FIELDS_PLACEMENT_INVALID");

  const noWrapper = approvalFormResource();
  firstSectionSlot(noWrapper).children = [fieldControl({ type: "input", label: "Requester Name" })];
  expectCode("field control outside approved wrapper fails", ["--resource", writeJson("field-outside-wrapper.json", noWrapper), "--surface", "approval-form"], "APPROVAL_FORM_FIELDS_WRAPPER_MISSING");

  const badMargin = approvalFormResource();
  firstWrapper(badMargin).children[0].attrs.common.margin = [null, { top: 5, right: 5, bottom: 5, left: 5 }];
  expectCode("field control non-zero margin fails", ["--resource", writeJson("bad-margin.json", badMargin), "--surface", "approval-form"], "APPROVAL_FORM_FIELDS_FIELD_MARGIN_NOT_ZERO");

  const badNavLabel = approvalFormResource();
  delete firstWrapper(badNavLabel).children[0].nv_label;
  expectCode("field control without business nav_label fails", ["--resource", writeJson("bad-nav-label.json", badNavLabel), "--surface", "approval-form"], "APPROVAL_FORM_FIELDS_NAV_LABEL_MISSING");

  const badSpan = approvalFormResource();
  firstWrapper(badSpan).children[1].attrs.common.grid.position = [null, { cSpan: 1 }, { cSpan: 1 }, { cSpan: 1 }];
  expectCode("rich text full-row span mismatch fails", ["--resource", writeJson("bad-span.json", badSpan), "--surface", "approval-form"], "APPROVAL_FORM_FIELDS_FULL_ROW_SPAN_INVALID");

  const badMobile = approvalFormResource();
  firstWrapper(badMobile).attrs.columns["3"].list = [{ value: 1, unit: "fr" }, { value: 1, unit: "fr" }];
  expectCode("mobile grid columns above one fails", ["--resource", writeJson("bad-mobile.json", badMobile), "--surface", "approval-form"], "APPROVAL_FORM_FIELDS_GRID_MOBILE_COLUMNS_INVALID");

  const badColumnSpan = approvalFormResource({ columns: 2 });
  firstWrapper(badColumnSpan).children[0].attrs.common.grid = { position: [null, { cSpan: 3 }] };
  expectCode("field column span above parent columns fails", ["--resource", writeJson("bad-column-span.json", badColumnSpan), "--surface", "approval-form"], "APPROVAL_FORM_FIELDS_GRID_COLUMN_SPAN_EXCEEDS_COLUMNS");

  expectPass("package with approval form field grid passes", ["--package", writePackage("valid-package.yapk", decodedPackage(approvalFormResource()))]);
  expectCode("App Plan missing approval field layout selection fails", ["--plan", writeText("plan-missing-field-layout.md", appPlan({ omitFieldSelection: true }))], "APPROVAL_FORM_FIELDS_APP_PLAN_SELECTION_TABLE_MISSING");
  expectCode("App Plan tablet columns above PC fails", ["--plan", writeText("plan-bad-tablet.md", appPlan({ pc: 2, tablet: 3, mobile: 1 }))], "APPROVAL_FORM_FIELDS_APP_PLAN_TABLET_COLUMNS_INVALID");
  expectPass("App Plan approval field layout selection passes", ["--plan", writeText("plan-valid.md", appPlan())]);
  expectPass("Package materializes App Plan approval form fields", ["--package", writePackage("package-with-planned-fields.yapk", decodedPackage(approvalFormResource())), "--plan", writeText("plan-valid-with-fields.md", appPlan())]);
  expectCode("Package missing planned approval form field fails", ["--package", writePackage("package-missing-planned-field.yapk", decodedPackage(approvalFormResource())), "--plan", writeText("plan-extra-field.md", appPlan({ extraSubmissionField: "Traveler" }))], "APPROVAL_FORM_FIELDS_PLANNED_FIELD_NOT_MATERIALIZED");

  const attrsOnlyReadonlyPackage = decodedPackage(approvalFormResource());
  const attrsOnlyDef = decodeDefResource(attrsOnlyReadonlyPackage.Forms[0].DefResource);
  const taskRequester = find(attrsOnlyDef.pageurls[1].formdef, "input-requester-name");
  delete taskRequester.readonly;
  delete taskRequester.readOnly;
  taskRequester.attrs.readonly = true;
  taskRequester.attrs.readOnly = true;
  attrsOnlyReadonlyPackage.Forms[0].DefResource = encodeDefResource(attrsOnlyDef);
  expectCode("Task form mirror fields require runtime-effective top-level readonly", ["--package", writePackage("package-task-attrs-only-readonly.yapk", attrsOnlyReadonlyPackage)], "APPROVAL_TASK_CONTEXT_FIELD_READONLY_MISSING");

  const editableTaskPackage = decodedPackage(approvalFormResource());
  const editableTaskDef = decodeDefResource(editableTaskPackage.Forms[0].DefResource);
  const taskBusinessJustification = find(editableTaskDef.pageurls[1].formdef, "richtext-business-justification");
  delete taskBusinessJustification.readonly;
  delete taskBusinessJustification.readOnly;
  delete taskBusinessJustification.attrs.readonly;
  delete taskBusinessJustification.attrs.readOnly;
  editableTaskPackage.Forms[0].DefResource = encodeDefResource(editableTaskDef);
  expectCode("Task form mirror fields cannot remain editable without plan override", ["--package", writePackage("package-task-editable-mirror.yapk", editableTaskPackage)], "APPROVAL_TASK_CONTEXT_FIELD_READONLY_MISSING");

  const loanNumberResource = approvalFormResource();
  firstWrapper(loanNumberResource).children.push(fieldControl({ type: "input", label: "Loan Number" }));
  expectPass("Package preserves planned Approval field visible label with Loan terminology", ["--package", writePackage("package-loan-number-field.yapk", decodedPackage(loanNumberResource)), "--plan", writeText("plan-loan-number-field.md", appPlan({ extraSubmissionField: "Loan Number" }))]);

  const driftedLoanNumberResource = approvalFormResource();
  const driftedLoanNumber = fieldControl({ type: "input", label: "Request Number" });
  driftedLoanNumber.binding = "LoanNumber";
  driftedLoanNumber.fieldName = "LoanNumber";
  driftedLoanNumber.attrs.data = { field: "LoanNumber", fieldName: "LoanNumber", displayName: "Request Number" };
  firstWrapper(driftedLoanNumberResource).children.push(driftedLoanNumber);
  expectCode("Package with only technical LoanNumber binding but drifted visible label fails", ["--package", writePackage("package-loan-number-label-drift.yapk", decodedPackage(driftedLoanNumberResource)), "--plan", writeText("plan-loan-number-label-drift.md", appPlan({ extraSubmissionField: "Loan Number" }))], "APPROVAL_FORM_FIELDS_PLANNED_FIELD_NOT_MATERIALIZED");

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

function approvalFormResource({ templateId = TEMPLATE_2COL_ID, columns = 2 } = {}) {
  return {
    id: "form-root",
    type: "page",
    attrs: { background: { classic: { color: "#f4f7fb" } }, container: { cw: "2", padding: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }] } },
    children: [
      {
        id: "main",
        type: "container",
        children: [
          {
            id: "content",
            type: "container",
            children: [
              {
                id: "content_card_wrapper",
                type: "container",
                children: [
                  { id: "section_title_area", type: "container", children: [{ id: "section_title_header", type: "container", children: [] }] },
                  { id: "section_content_area", type: "container", children: [fieldGrid({ templateId, columns })] },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

function fieldGrid({ templateId = TEMPLATE_2COL_ID, columns = 2 } = {}) {
  const wrapperId = columns === 3 ? "form_grid_fields_3col_wrapper" : "form_grid_fields_2col_wrapper";
  return {
    id: wrapperId,
    type: "flex_grid",
    nv_label: wrapperId,
    approvalFormFieldsTemplateId: templateId,
    derivedFromApprovalFormFieldsTemplate: templateId,
    attrs: {
      columns: {
        "1": { list: Array.from({ length: columns }, () => ({ value: 1, unit: "fr" })) },
        "2": { list: Array.from({ length: Math.min(columns, 2) }, () => ({ value: 1, unit: "fr" })) },
        "3": { list: [{ value: 1, unit: "fr" }] },
      },
      rows: { "1": { list: [{ unit: "auto" }] } },
      cgap: { "1": 24 },
      rgap: [null, 12],
    },
    children: [
      fieldControl({ type: "input", label: "Requester Name" }),
      fieldControl({ type: "richtext", label: "Business Justification", span: [null, { cSpan: columns }, { cSpan: Math.min(columns, 2) }, { cSpan: 1 }] }),
      fieldControl({ type: "list", label: "Requested Items", span: [null, { cSpan: columns }, { cSpan: Math.min(columns, 2) }, { cSpan: 1 }] }),
    ],
  };
}

function fieldControl({ type, label, span = null }) {
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
  if (type === "list") {
    control.attrs["list-variables"] = [];
    control.attrs["list-fields"] = [];
  }
  return control;
}

function fieldNavLabel(label) {
  return `approval_field_${label}`.replace(/\W+/g, "_").toLowerCase();
}

function content(resource) {
  return find(resource, "content");
}

function firstSectionSlot(resource) {
  return find(resource, "section_content_area");
}

function firstWrapper(resource) {
  return find(resource, "form_grid_fields_2col_wrapper") || find(resource, "form_grid_fields_3col_wrapper");
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
  const taskResource = markTaskReadonly(approvalFormResource({ templateId: TEMPLATE_3COL_ID, columns: 3 }));
  const def = {
    key: "APPROVAL-FIELDS-TEST",
    defkey: "APPROVAL-FIELDS-TEST",
    workflowType: 2,
    pageurls: [
      { id: "submission-page", type: 1, title: "Submission form", pagetype: 1, formdef: resource },
      { id: "task-page", type: 2, title: "Task form", pagetype: 1, formdef: taskResource },
    ],
  };
  return {
    ListSet: { ListID: "1909200000000000001", Title: "Approval Form Fields Test" },
    Childs: [],
    Forms: [
      {
        Key: "APPROVAL-FIELDS-TEST",
        Name: "Asset Loan Approval",
        Title: "Asset Loan Approval",
        WorkflowType: 2,
        DefResource: encodeDefResource(def),
      },
    ],
    Pages: [],
    FormNewReports: [],
    DataReports: [],
    IconUrl: "{\"b\":\"#0f766e\",\"i\":\"fa-solid fa-clipboard-check\",\"c\":\"#ffffff\"}",
  };
}

function markTaskReadonly(resource) {
  for (const control of fieldControls(resource)) {
    control.readonly = true;
    control.readOnly = true;
    control.attrs = control.attrs || {};
    control.attrs.readonly = true;
    control.attrs.readOnly = true;
  }
  return resource;
}

function fieldControls(root) {
  const out = [];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (["input", "textarea", "richtext", "list"].includes(String(node.type || ""))) out.push(node);
    for (const child of node.children || []) visit(child);
  };
  visit(root);
  return out;
}

function decodeDefResource(value) {
  const raw = Buffer.from(value, "base64");
  const payload = raw.subarray(0, 10).toString("utf8") === "::brotli::"
    ? zlib.brotliDecompressSync(raw.subarray(10)).toString("utf8")
    : zlib.brotliDecompressSync(raw).toString("utf8");
  return JSON.parse(payload);
}

function encodeDefResource(def) {
  const payload = Buffer.concat([Buffer.from("::brotli::", "utf8"), zlib.brotliCompressSync(Buffer.from(JSON.stringify(def), "utf8"))]);
  return payload.toString("base64");
}

function appPlan({ omitFieldSelection = false, pc = 2, tablet = 2, mobile = 1, extraSubmissionField = "" } = {}) {
  const fieldSelection = omitFieldSelection ? "" : `
#### Approval Form Fields Layout Template Selection

| Approval Form | Form Page | Field Group | Selected Approval Form Fields Layout Template | Field Source | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Asset Loan Approval | Submission form | Request information | ${TEMPLATE_2COL_ID} | Submission fields | ${pc} | ${tablet} | ${mobile} | Business Justification, Requested Items | None | Generated-final validation |
| Asset Loan Approval | Coordinator task form | Review context | ${TEMPLATE_3COL_ID} | Task fields | 3 | 2 | 1 | Requested Items | None | Generated-final validation |
`;
  const extraRow = extraSubmissionField ? `| 4 | ${extraSubmissionField} | ${extraSubmissionField.replace(/\W+/g, "")} | Text | input | Generated-final validation |` : "";
  return `
# Office Asset Loan Management - Yeeflow App Plan

## 5. Approval Forms Plan

| Approval Form | Business Purpose | Submission Form Fields | Task Form Fields | Task Forms | ContentList Persistence | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- |
| Asset Loan Approval | Route asset requests | Requester Name, Business Justification, Requested Items | Readonly request context | Coordinator task form | Loan Requests | Generated-final validation |

### 5.1 Asset Loan Approval

##### Submission Form Fields

| Field Order | Business Label | Field Name | Exact Yeeflow Variable Type | Exact Yeeflow Control Type | Proof Label |
| --- | --- | --- | --- | --- | --- |
| 1 | Requester Name | RequesterName | Text | input | Generated-final validation |
| 2 | Business Justification | BusinessJustification | Multiple line | textarea | Generated-final validation |
| 3 | Requested Items | RequestedItems | Sub list | list | Generated-final validation |
${extraRow}

##### Task Form Fields

| Field Order | Business Label | Field Name | Exact Yeeflow Variable Type | Exact Yeeflow Control Type | Read Only | Proof Label |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Requester Name | RequesterName | Text | input | Yes | Generated-final validation |
| 2 | Business Justification | BusinessJustification | Multiple line | textarea | Yes | Generated-final validation |
| 3 | Requested Items | RequestedItems | Sub list | list | Yes | Generated-final validation |

${fieldSelection}

#### Approval Form Layout Template Selection

| Approval Form | Form Page | Page Role | Selected Approval Form Layout Template | Business Sections Needed | Related Data Needed | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Asset Loan Approval | Submission form | Submission | approval_form_layout_submission_v1_1 | Page title and request sections | Current request data only | Submission captures requester-entered approval fields | Generated-final validation |
| Asset Loan Approval | Coordinator task form | Task | approval_form_layout_task_v1_1 | Page title, readonly request context, action/history section | Related loan context | Task reviewers need consistent readonly context | Generated-final validation |

## 6. Form Reports Plan
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

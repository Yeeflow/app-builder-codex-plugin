#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const {
  QUERY_DATA_MODES,
  buildFormActionQueryDataStep,
  classifyFormActionQueryDataStep,
} = require("./lib/form-action-query-data-utils.cjs");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const templates = [
  ["form-action-query-data-single-to-variables.template.json", QUERY_DATA_MODES.SINGLE_TO_VARIABLES],
  ["form-action-query-data-single-to-temp-variables.template.json", QUERY_DATA_MODES.SINGLE_TO_TEMP_VARIABLES],
  ["form-action-query-data-multiple-to-sublist.template.json", QUERY_DATA_MODES.MULTIPLE_TO_SUBLIST],
  ["form-action-query-data-multiple-count-only.template.json", QUERY_DATA_MODES.MULTIPLE_COUNT_ONLY],
  ["form-action-query-data-single-to-list-fields-and-temp.template.json", QUERY_DATA_MODES.SINGLE_TO_LIST_FIELDS_AND_TEMP_VARIABLES],
  ["form-action-query-data-multiple-to-list-sublist.template.json", QUERY_DATA_MODES.MULTIPLE_TO_LIST_SUBLIST],
  ["form-action-query-data-dashboard-count-only.template.json", QUERY_DATA_MODES.MULTIPLE_COUNT_ONLY],
  ["form-action-query-data-dashboard-chained-single.template.json", QUERY_DATA_MODES.SINGLE_TO_TEMP_VARIABLES],
  ["form-action-query-data-dashboard-multiple-to-temp-json.template.json", QUERY_DATA_MODES.MULTIPLE_TO_TEMP_COLLECTION],
  ["form-action-query-data-document-library-single-to-temp.template.json", QUERY_DATA_MODES.SINGLE_TO_TEMP_VARIABLES],
];

for (const [file] of templates) {
  const parsed = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference", file), "utf8"));
  assert.equal(parsed.type, "querydata", `${file} must be a Query Data step`);
  assert.ok(parsed.attrs?.querydata_list, `${file} must include source metadata`);
  assert.equal(parsed.attrs?.querydata_filter, undefined, `${file} must not use singular querydata_filter`);
}

const appPlanTemplate = fs.readFileSync(path.join(ROOT, "docs/standards/app-plan-standard-template.md"), "utf8");
for (const requiredColumn of ["Query Mode", "Source Resource Type", "Result Target Type", "Field Mapping", "Count Target Type", "Page Size", "Page Number", "Persistence / Lifetime"]) {
  assert.ok(appPlanTemplate.includes(requiredColumn), `App Plan Form Actions table must include ${requiredColumn}`);
}
assert.match(appPlanTemplate, /Public Forms must not plan or materialize Query Data/);
const jsonStringfy = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/dashboard-query-data-json-stringfy-expression.template.json"), "utf8"));
assert.equal(jsonStringfy.func, "JSONStringfy");
const taskWrapper = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/form-action-query-data-approval-task-wrapper.template.json"), "utf8"));
assert.equal(taskWrapper.type, 2);
assert.ok(taskWrapper.formdef.formAction.onLoad);

const steps = buildGoldenSteps();
assert.deepEqual(steps.map(classifyFormActionQueryDataStep), templates.slice(0, 6).map(([, mode]) => mode));
assert.equal(steps[0].attrs.querydata_type, undefined, "v1.1 single mode should omit querydata_type by default");
assert.equal(steps[1].attrs.querydata_fieldmap.Title, "__temp_Name", "single temp mapping must use __temp_ expression id");
assert.equal(steps[2].attrs.querydata_listname_parent, "__variables_");
assert.equal(steps[2].attrs.querydata_vartype, "list");
for (const forbidden of ["querydata_fieldmap", "querydata_fields", "querydata_listname", "querydata_vartype", "querydata_listname_parent"]) {
  assert.equal(steps[3].attrs[forbidden], undefined, `count-only must omit ${forbidden}`);
}
assert.equal(steps[4].attrs.querydata_fieldmap.Text1, "____customListFields_Text3");
assert.equal(steps[4].attrs.querydata_fieldmap.Text2, "__temp_CampaignDescription");
assert.equal(steps[5].attrs.querydata_listname_parent, "__list_");
assert.equal(steps[5].attrs.querydata_listname, "Text3");
assert.equal(steps[5].attrs.querydata_totalparent, "__temp_");
assert.throws(() => buildFormActionQueryDataStep({
  mode: QUERY_DATA_MODES.MULTIPLE_TO_LIST_SUBLIST,
  hostSurface: "approval_submission",
  name: "Wrong host",
  source: source(),
  fieldMap: { Title: "field_Title" },
  resultTarget: "Text3",
}), /requires a Data List or Document Library custom form/);
assert.throws(() => buildFormActionQueryDataStep({
  mode: QUERY_DATA_MODES.SINGLE_TO_VARIABLES,
  hostSurface: "public_form",
  name: "Invalid public query",
  source: source(),
  fieldMap: { Title: "Name" },
}), /Public Forms do not support/);
assert.throws(() => buildFormActionQueryDataStep({
  mode: QUERY_DATA_MODES.MULTIPLE_COUNT_ONLY,
  name: "Missing count target",
  source: source(),
}), /requires countTarget/);
assert.throws(() => buildFormActionQueryDataStep({
  mode: QUERY_DATA_MODES.MULTIPLE_COUNT_ONLY,
  name: "Invalid page size",
  source: source(),
  countTarget: { id: "Count", parent: "__temp_" },
  pageSize: 1001,
}), /1 to 1000/);
const secondPageStep = buildFormActionQueryDataStep({
  mode: QUERY_DATA_MODES.MULTIPLE_COUNT_ONLY,
  name: "Second page",
  source: source(),
  countTarget: { id: "Count", parent: "__temp_" },
  pageNumber: 2,
});
assert.equal(secondPageStep.attrs.querydata_pageindex, 2);
const documentLibraryStep = buildFormActionQueryDataStep({
  mode: QUERY_DATA_MODES.SINGLE_TO_TEMP_VARIABLES,
  hostSurface: "document_library_custom_form",
  name: "Load related record",
  source: source(),
  fieldMap: { Title: "RelatedName" },
});
assert.equal(documentLibraryStep.attrs.querydata_fieldmap.Title, "__temp_RelatedName");
const expressionFilterStep = buildFormActionQueryDataStep({
  mode: QUERY_DATA_MODES.SINGLE_TO_VARIABLES,
  name: "Expression filter",
  source: source(),
  fieldMap: { Title: "Name" },
  filters: [{ left: "Text1", op: "0", right: [{ exprType: "variable", valueType: "text", id: "FilterValue", type: "expr" }] }],
});
assert.equal(expressionFilterStep.attrs.querydata_filters[0].showCus, false, "expression-token filters must use expression-editor mode");

console.log(JSON.stringify({
  status: "pass",
  test: "test-form-action-query-data-golden-reference-gates.mjs",
  templates: templates.length,
  modes: steps.map(classifyFormActionQueryDataStep),
  cases: 37,
}, null, 2));

function buildGoldenSteps() {
  return [
    buildFormActionQueryDataStep({ mode: QUERY_DATA_MODES.SINGLE_TO_VARIABLES, name: "Single to variables", source: source(), fieldMap: { Title: "Name" } }),
    buildFormActionQueryDataStep({ mode: QUERY_DATA_MODES.SINGLE_TO_TEMP_VARIABLES, name: "Single to temp", source: source(), fieldMap: { Title: "Name" } }),
    buildFormActionQueryDataStep({ mode: QUERY_DATA_MODES.MULTIPLE_TO_SUBLIST, name: "Multiple to Sub list", source: source(), fieldMap: { Title: "row_Title" }, resultTarget: "Rows", countTarget: { id: "Count", parent: "__variables_" } }),
    buildFormActionQueryDataStep({ mode: QUERY_DATA_MODES.MULTIPLE_COUNT_ONLY, name: "Multiple count only", source: source(), countTarget: { id: "TempCount", parent: "__temp_" } }),
    buildFormActionQueryDataStep({
      mode: QUERY_DATA_MODES.SINGLE_TO_LIST_FIELDS_AND_TEMP_VARIABLES,
      hostSurface: "data_list_custom_form",
      name: "Single to current record and temp",
      source: source(),
      listFieldMap: { Text1: "Text3" },
      tempFieldMap: { Text2: "CampaignDescription" },
    }),
    buildFormActionQueryDataStep({
      mode: QUERY_DATA_MODES.MULTIPLE_TO_LIST_SUBLIST,
      hostSurface: "data_list_custom_form",
      name: "Multiple to current record Sub list",
      source: source(),
      fieldMap: { Title: "field_Name", Text2: "field_Description" },
      resultTarget: "Text3",
      countTarget: { id: "ReturnRecords", parent: "__temp_" },
    }),
  ];
}

function source() {
  return { AppID: 41, ListSetID: "9000000000000000001", ListID: "9000000000000000002", ListType: 1 };
}

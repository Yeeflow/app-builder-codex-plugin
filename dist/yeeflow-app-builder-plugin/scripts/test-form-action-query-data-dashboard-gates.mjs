#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { validateDashboardQueryData } from "./validate-form-action-query-data-dashboards.mjs";

const require = createRequire(import.meta.url);
const { QUERY_DATA_MODES, buildFormActionQueryDataStep } = require("./lib/form-action-query-data-utils.cjs");

const positive = fixture();
const report = validateDashboardQueryData(positive, { strictGenerated: true, planMarkdown: matchingPlan() });
assert.equal(report.ok, true, JSON.stringify(report.findings, null, 2));
assert.equal(report.queryStepCount, 3);
assert.deepEqual(report.paginationContract, { defaultPageSize: 100, maxPageSize: 1000, defaultPageNumber: 1 });

expectFailure("page size above product limit", (decoded) => querySteps(decoded)[0].attrs.querydata_pagesize = 1001, "FORM_ACTION_QUERYDATA_PAGE_SIZE_INVALID");
expectFailure("Dashboard workflow output", (decoded) => querySteps(decoded)[1].attrs.querydata_fieldmap.Title = "WorkflowName", "FORM_ACTION_QUERYDATA_DASHBOARD_MODE_INVALID");
expectFailure("undeclared temp output", (decoded) => querySteps(decoded)[1].attrs.querydata_fieldmap.Title = "__temp_Missing", "FORM_ACTION_QUERYDATA_TEMP_TARGET_MISSING");
expectFailure("chained step before producer", (decoded) => {
  const steps = querySteps(decoded);
  steps.splice(1, 0, steps.pop());
}, "FORM_ACTION_QUERYDATA_CHAIN_INPUT_NOT_PRODUCED");
expectFailure("chained query without guard", (decoded) => delete querySteps(decoded)[2].condition, "FORM_ACTION_QUERYDATA_CHAIN_GUARD_MISSING");
expectFailure("unbound Dashboard action", (decoded) => dashboard(decoded).formAction = {}, "FORM_ACTION_QUERYDATA_DASHBOARD_ACTION_UNBOUND");
expectFailure("invalid page number", (decoded) => querySteps(decoded)[0].attrs.querydata_pageindex = 0, "FORM_ACTION_QUERYDATA_PAGE_NUMBER_INVALID");
expectFailure("wrong page number property", (decoded) => querySteps(decoded)[0].attrs.querydata_page = 2, "FORM_ACTION_QUERYDATA_PAGE_NUMBER_PROPERTY_INVALID");
expectFailure("temp JSON selected fields missing", (decoded) => querySteps(decoded)[0].attrs.querydata_fields = [], "FORM_ACTION_QUERYDATA_SELECTED_FIELDS_MISSING");
expectFailure("Collection binds temp JSON", () => {}, "FORM_ACTION_QUERYDATA_TEMP_COLLECTION_DIRECT_DATA_CONTROL_BINDING");
assert.throws(() => buildFormActionQueryDataStep({ mode: QUERY_DATA_MODES.SINGLE_TO_VARIABLES, hostSurface: "dashboard", name: "Bad dashboard target", source: source(), fieldMap: { Title: "Name" } }), /must target temp variables/);
assert.throws(() => buildFormActionQueryDataStep({ mode: QUERY_DATA_MODES.MULTIPLE_COUNT_ONLY, hostSurface: "dashboard", name: "Bad count", source: source(), countTarget: { id: "Count", parent: "__variables_" } }), /must use __temp_/);
assert.throws(() => buildFormActionQueryDataStep({ mode: QUERY_DATA_MODES.MULTIPLE_COUNT_ONLY, hostSurface: "dashboard", name: "Too many", source: source(), countTarget: { id: "Count", parent: "__temp_" }, pageSize: 1001 }), /1 to 1000/);
const secondPage = buildFormActionQueryDataStep({ mode: QUERY_DATA_MODES.MULTIPLE_COUNT_ONLY, hostSurface: "dashboard", name: "Second page", source: source(), countTarget: { id: "Count", parent: "__temp_" }, pageNumber: 2 });
assert.equal(secondPage.attrs.querydata_pageindex, 2);

console.log(JSON.stringify({ status: "pass", test: "test-form-action-query-data-dashboard-gates.mjs", cases: 16 }, null, 2));

function fixture() {
  const actionId = "action-dashboard-query";
  const count = buildFormActionQueryDataStep({
    mode: QUERY_DATA_MODES.MULTIPLE_TO_TEMP_COLLECTION,
    hostSurface: "dashboard",
    name: "Count current user events",
    source: source(),
    filters: [{ left: "Text3", op: "11", right: null }],
    sorts: [{ SortName: "Datetime1", SortByDesc: true }],
    countTarget: { id: "var_MyTotalEventAmount", parent: "__temp_" },
    resultTarget: "var_QueryDataValue",
    selectedFields: [
      { FieldName: "Title", Type: "input", DisplayName: "Name" },
      { FieldName: "Datetime1", Type: "datepicker", DisplayName: "Date" },
      { FieldName: "Text2", Type: "input", DisplayName: "Description" },
      { FieldName: "Decimal1", Type: "currency", DisplayName: "Budget" },
    ],
    pageSize: 5,
    pageNumber: 2,
  });
  const latest = buildFormActionQueryDataStep({
    mode: QUERY_DATA_MODES.SINGLE_TO_TEMP_VARIABLES,
    hostSurface: "dashboard",
    name: "Load latest current user event",
    source: source(),
    filters: [{ left: "Text3", op: "11", right: null }],
    sorts: [{ SortName: "Datetime1", SortByDesc: true }],
    fieldMap: { Title: "var_EventName", Text12: "var_CampaignID" },
  });
  const campaign = buildFormActionQueryDataStep({
    mode: QUERY_DATA_MODES.SINGLE_TO_TEMP_VARIABLES,
    hostSurface: "dashboard",
    name: "Load related campaign",
    source: { ...source(), ListID: "9000000000000000003" },
    filters: [{ left: "ListDataID", op: "0", right: [{ exprType: "variable", valueType: "string", id: "__temp_var_CampaignID", type: "expr" }] }],
    sorts: [{ SortName: "Created", SortByDesc: true }],
    fieldMap: { Title: "var_CampaignName" },
    condition: notEmpty("var_CampaignID"),
  });
  const formdef = {
    tempVars: ["var_MyTotalEventAmount", "var_QueryDataValue", "var_EventName", "var_CampaignID", "var_CampaignName"].map((id) => ({ id, idx: `idx-${id}` })),
    formAction: { onLoad: actionId },
    actions: [{ id: actionId, name: "Load latest event dashboard", steps: [count, latest, campaign] }],
    children: [{ type: "flex_grid", nv_label: "form_grid_fields_3col_wrapper", attrs: { control_display: { formula: notEmptyAndPositive("var_MyTotalEventAmount"), action: "show" } } }],
  };
  return { Pages: [{ Title: "My latest event", Type: 103, LayoutInResources: [{ Resource: JSON.stringify(formdef) }] }] };
}

function source() { return { AppID: 41, ListSetID: "9000000000000000001", ListID: "9000000000000000002", ListType: 1 }; }
function notEmpty(id) { return [{ type: "func", func: "isNullOrEmpty", params: [[{ exprType: "variable", valueType: "string", id: `__temp_${id}`, type: "expr" }]] }, { type: "op", op: "==" }, { type: "bool", value: false }]; }
function notEmptyAndPositive(id) { return [...notEmpty(id), { type: "op", op: "and" }, { exprType: "variable", valueType: "number", id: `__temp_${id}`, type: "expr" }, { type: "op", op: ">" }, { type: "number", value: 0 }]; }
function dashboard(decoded) { return JSON.parse(decoded.Pages[0].LayoutInResources[0].Resource); }
function querySteps(decoded) { const value = dashboard(decoded); const steps = value.actions[0].steps; decoded.Pages[0].LayoutInResources[0].Resource = JSON.stringify(value); return new Proxy(steps, { set(target, property, value) { target[property] = value; decoded.Pages[0].LayoutInResources[0].Resource = JSON.stringify(dashboardObject(target, decoded)); return true; } }); }
function dashboardObject(steps, decoded) { const value = JSON.parse(decoded.Pages[0].LayoutInResources[0].Resource); value.actions[0].steps = steps; return value; }

function expectFailure(name, mutate, code) {
  const decoded = structuredClone(positive);
  const value = JSON.parse(decoded.Pages[0].LayoutInResources[0].Resource);
  const api = {
    querySteps: value.actions[0].steps,
    dashboard: value,
  };
  if (name === "unbound Dashboard action") value.formAction = {};
  else if (name === "chained step before producer") api.querySteps.splice(1, 0, api.querySteps.pop());
  else if (name === "chained query without guard") delete api.querySteps[2].condition;
  else if (name === "page size above product limit") api.querySteps[0].attrs.querydata_pagesize = 1001;
  else if (name === "Dashboard workflow output") api.querySteps[1].attrs.querydata_fieldmap.Title = "WorkflowName";
  else if (name === "undeclared temp output") api.querySteps[1].attrs.querydata_fieldmap.Title = "__temp_Missing";
  else if (name === "invalid page number") api.querySteps[0].attrs.querydata_pageindex = 0;
  else if (name === "wrong page number property") api.querySteps[0].attrs.querydata_page = 2;
  else if (name === "temp JSON selected fields missing") api.querySteps[0].attrs.querydata_fields = [];
  else if (name === "Collection binds temp JSON") value.children.push({ type: "collection", attrs: { source: "__temp_var_QueryDataValue" } });
  else mutate(decoded);
  decoded.Pages[0].LayoutInResources[0].Resource = JSON.stringify(value);
  const report = validateDashboardQueryData(decoded, { strictGenerated: true });
  assert.equal(report.ok, false, `${name} should fail\n${JSON.stringify(report, null, 2)}`);
  assert.ok(report.findings.some((item) => item.code === code), `${name} expected ${code}\n${JSON.stringify(report, null, 2)}`);
}

function matchingPlan() {
  return `#### Form Actions and Temp Variables

| Action Name | Step Name | Host Resource | Host Form | Host Surface / Page | Trigger | Exact Step Type | Query Mode | Source Resource Type | Source Resource | Filters | Sorts | Result Target Type | Result Target | Field Mapping | Count Target Type | Count Target | Page Size | Page Number | Persistence / Lifetime | Bound Control | Proof Boundary | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Load latest event dashboard | Count current user events | My latest event | My latest event | Dashboard | Page Load | Query Data | multiple_to_temp_collection | Data List | Event Planning | Current user | Date desc | Temp collection | var_QueryDataValue | Name; Date; Description; Budget | Temp variable | var_MyTotalEventAmount | 5 | 2 | Current page session | None | export-proven | JSON object plus count |
| Load latest event dashboard | Load latest current user event | My latest event | My latest event | Dashboard | Page Load | Query Data | single_to_temp_variables | Data List | Event Planning | Current user | Date desc | Temp variables | var_EventName; var_CampaignID | Title -> var_EventName; Text12 -> var_CampaignID | None | None | 100 | 1 | Current page session | None | export-proven | Latest event |
| Load latest event dashboard | Load related campaign | My latest event | My latest event | Dashboard | Page Load | Query Data | single_to_temp_variables | Data List | Campaign | ListDataID = temp CampaignID | Created desc | Temp variables | var_CampaignName | Title -> var_CampaignName | None | None | 100 | 1 | Current page session | None | export-proven | Chained query |`;
}

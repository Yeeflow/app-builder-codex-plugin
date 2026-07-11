#!/usr/bin/env node

import assert from "node:assert/strict";
import { validateFormActionQueryDataPlan } from "./validate-form-action-query-data-plan.mjs";

const valid = validateFormActionQueryDataPlan(planRows([
  row("Single values", "Single values", "Approval Submission", "Page Load", "single_to_variables", "Workflow variables", "Name", "Title -> Name", "None", "None"),
  row("Single temp", "Single temp", "Approval Task", "Button", "single_to_temp_variables", "Temp variables", "TempName", "Title -> TempName", "None", "None"),
  row("Load rows", "Load rows", "Approval Submission", "Button", "multiple_to_sublist", "Sub list", "Rows", "Title -> RowTitle", "Workflow number", "Count"),
  row("Count rows", "Count rows only", "Approval Submission", "Page Load", "multiple_count_only", "None", "None", "None", "Temp variable", "TempCount"),
  row("Apply campaign", "Load campaign", "Data List New Item", "Campaign field change", "single_to_list_fields_and_temp_variables", "Current fields + Temp variables", "Owner; CampaignDescription", "Text2 -> Text3; Text1 -> CampaignDescription", "None", "None"),
  row("Load quote lines", "Load products", "Data List New Item", "Product type field change", "multiple_to_list_sublist", "Current record Sub list", "QuoteLines", "Title -> LineName", "Temp variable", "LineCount", "Editable quotation line items; user updates quantity and description"),
  row("Load event", "Load related event", "Document Library View Item", "Page Load", "single_to_temp_variables", "Temp variables", "EventName", "Title -> EventName", "None", "None", "Display related Event", 5, 2),
  row("Load dashboard JSON", "Load recent rows", "Dashboard", "Page Load", "multiple_to_temp_collection", "Temp collection", "RecentRows", "Title; Status", "Temp variable", "RecentCount", "JSONStringfy text display", 5, 1, "JSON text"),
]));
assert.equal(valid.status, "pass", JSON.stringify(valid, null, 2));

expectCode("Public Form host", planRows([row("Bad", "Bad", "Public Form", "Page Load", "single_to_variables", "Workflow variables", "Name", "Title -> Name", "None", "None")]), "FORM_ACTION_QUERYDATA_PLAN_PUBLIC_FORM_FORBIDDEN");
expectCode("count only with stale mapping", planRows([row("Bad", "Count only", "Approval Submission", "Page Load", "multiple_count_only", "Sub list", "Rows", "Title -> RowTitle", "Temp variable", "Count")]), "FORM_ACTION_QUERYDATA_PLAN_COUNT_ONLY_RESULT_PRESENT");
expectCode("multiple Sub list missing mapping", planRows([row("Bad", "Rows", "Approval Submission", "Page Load", "multiple_to_sublist", "Sub list", "Rows", "None", "None", "None")]), "FORM_ACTION_QUERYDATA_PLAN_FIELD_MAPPING_MISSING");
expectCode("Data List mode on Approval host", planRows([row("Bad", "Rows", "Approval Submission", "Page Load", "multiple_to_list_sublist", "Current record Sub list", "Rows", "Title -> RowTitle", "Temp variable", "Count")]), "FORM_ACTION_QUERYDATA_PLAN_DATALIST_MODE_HOST_INVALID");
expectCode("read-only reverse relation uses Sub list", planRows([row("Bad", "Rows", "Data List View Item", "Page Load", "multiple_to_list_sublist", "Current record Sub list", "Rows", "Title -> RowTitle", "Temp variable", "Count", "Read-only related records display only")]), "FORM_ACTION_QUERYDATA_PLAN_READONLY_SUBLIST_MISUSE");
expectCode("page size above 1000", planRows([row("Bad", "Rows", "Dashboard", "Page Load", "multiple_count_only", "None", "None", "None", "Temp variable", "Count", "Test", 1001, 1)]), "FORM_ACTION_QUERYDATA_PLAN_PAGE_SIZE_INVALID");
expectCode("Dashboard workflow output", planRows([row("Bad", "Rows", "Dashboard", "Page Load", "single_to_temp_variables", "Workflow variables", "Name", "Title -> Name", "None", "None")]), "FORM_ACTION_QUERYDATA_PLAN_DASHBOARD_RESULT_NOT_TEMP");
expectCode("Form Report cannot host Form Action", planRows([row("Bad", "Rows", "Form Report", "Page Load", "single_to_temp_variables", "Temp variables", "Name", "Title -> Name", "None", "None")]), "FORM_ACTION_QUERYDATA_PLAN_REPORT_HOST_FORBIDDEN");
expectCode("ambiguous import buffer target", planRows([row("Bad", "Rows", "Data List New Item", "Page Load", "multiple_to_list_sublist", "Current record Sub list", "Page temp collection / import buffer", "Title -> LineName", "Temp variable", "Count", "Editable line items")]), "FORM_ACTION_QUERYDATA_PLAN_AMBIGUOUS_IMPLEMENTATION");
expectCode("temp JSON cannot feed Collection", `${planRows([row("Load recent", "Recent requests", "Dashboard", "Page Load", "multiple_to_temp_collection", "Temp collection", "RecentRows", "Title; Status", "Temp variable", "Count", "Read-only recent requests", 5, 1, "Recent requests section")])}\n\n| Section | Selected Control | Data Source |\n| --- | --- | --- |\n| Recent requests | Collection | RecentRows |`, "FORM_ACTION_QUERYDATA_PLAN_TEMP_JSON_DATASET_CONTROL_FORBIDDEN");
expectCode("temp JSON requires supported consumer", planRows([row("Load recent", "Recent requests", "Dashboard", "Page Load", "multiple_to_temp_collection", "Temp collection", "RecentRows", "Title; Status", "Temp variable", "Count", "Read-only recent requests", 5, 1, "Recent requests region")]), "FORM_ACTION_QUERYDATA_PLAN_RESULT_CONSUMER_UNPROVEN");
expectCode("lookup display value cannot become chained id", planRows([row("Load latest", "Latest request", "Dashboard", "Page Load", "single_to_temp_variables", "Temp variables", "Latest", "Customer -> vLatestCustomerId", "None", "None")]), "FORM_ACTION_QUERYDATA_PLAN_LOOKUP_DISPLAY_VALUE_USED");
expectCode("ambiguous lookup value filter fails", planRows([row("Load campaign", "Campaign", "Data List New Item", "Campaign change", "single_to_temp_variables", "Temp variables", "CampaignName", "Title -> CampaignName", "None", "None", "Display campaign", 1, 1, "Campaign panel", "Campaigns record ID equals selected Campaign lookup value")]), "FORM_ACTION_QUERYDATA_PLAN_LOOKUP_DISPLAY_VALUE_USED");

console.log(JSON.stringify({ status: "pass", test: "test-form-action-query-data-plan-gates.mjs", cases: 21 }, null, 2));

function expectCode(label, markdown, code) {
  const report = validateFormActionQueryDataPlan(markdown);
  assert.equal(report.status, "fail", `${label}\n${JSON.stringify(report, null, 2)}`);
  assert.ok(report.findings.some((item) => item.code === code), `${label} expected ${code}\n${JSON.stringify(report, null, 2)}`);
}

function planRows(rows) {
  return `#### Form Actions and Temp Variables

| Action Name | Step Name | Host Resource | Host Form | Host Surface / Page | Trigger | Exact Step Type | Query Mode | Source Resource Type | Source Resource | Filters | Sorts | Result Target Type | Result Target | Field Mapping | Count Target Type | Count Target | Page Size | Page Number | Persistence / Lifetime | Bound Control | Proof Boundary | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows.join("\n")}`;
}

function row(action, step, host, trigger, mode, resultType, result, mapping, countType, count, notes = "Test", pageSize = 100, pageNumber = 1, boundControl = "None", filters = "Status = Confirmed") {
  const dataListHost = /data\s*list/i.test(host);
  const hostResource = dataListHost ? "Event Planning" : "Purchase Approval";
  const hostForm = dataListHost ? (/new/i.test(host) ? "New event" : "View event") : "Submission form";
  return `| ${action} | ${step} | ${hostResource} | ${hostForm} | ${host} | ${trigger} | Query Data | ${mode} | Data List | Event Planning | ${filters} | Date desc | ${resultType} | ${result} | ${mapping} | ${countType} | ${count} | ${pageSize} | ${pageNumber} | Current page session | ${boundControl} | export-proven | ${notes} |`;
}

#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildWorkflowListLoopProperties,
  buildWorkflowLoopProperties,
  buildWorkflowListVariable,
  buildWorkflowQueryDataProperties,
} from "./lib/workflow-query-data-utils.mjs";
import { validateWorkflowQueryDataPlan } from "./validate-workflow-query-data-plan.mjs";
import { validateWorkflowLoopPlan } from "./validate-workflow-loop-plan.mjs";
import { materializeFullAppGeneratedFinal } from "./materialize-full-app-generated-final.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const actionValidatorPath = [
  path.join(ROOT, "skills/installed/yeeflow-application-generator/scripts/workflow-action-config-validator.js"),
  path.join(ROOT, "skills/yeeflow-application-generator/scripts/workflow-action-config-validator.js"),
].find((candidate) => fs.existsSync(candidate));
assert.ok(actionValidatorPath, "workflow action validator must exist in source or bundled skill path");
const { validateWorkflowActionShapes } = require(actionValidatorPath);
const { validateDecodedDef } = require(path.join(ROOT, "validate-ywf-def.js"));
const cases = [];

const countOnly = buildWorkflowQueryDataProperties({
  name: "Query Campaigns",
  mode: "multiple_count_only",
  listSetId: "1000000000000000001",
  listId: "1000000000000000002",
  countVariable: "TotalCampaigns",
  pageSize: 100,
});
assert.deepEqual(countOnly.result, {
  type: "multiple",
  pageIndex: 1,
  pageSize: 100,
  fieldMap: null,
  listName: "",
  vartype: "",
  listParent: "",
  fields: null,
  totalCount: "TotalCampaigns",
  querycount_prefix: "__variables_",
});
expectActionPass("count-only QueryData permits an empty row target", queryShape(countOnly));
cases.push({ case: "count-only export shape", status: "pass" });

const single = buildWorkflowQueryDataProperties({
  name: "Get Campaign Owner",
  mode: "single_to_variables",
  listSetId: "1000000000000000001",
  listId: "1000000000000000002",
  fieldMap: { Text2: "CampaignOwner" },
  filters: [{ key: "filter-1", pre: "and", left: "ListDataID", op: "0", right: [{ exprType: "variable", valueType: "lookup", id: "SelectedCampaign", type: "expr" }], showCus: false }],
});
assert.deepEqual(single.result.fieldMap, { Text2: "CampaignOwner" });
assert.equal(single.filters[0].right[0].id, "SelectedCampaign");
expectActionPass("single QueryData field mapping", queryShape(single));
cases.push({ case: "single result to workflow variables", status: "pass" });

const multipleList = buildWorkflowQueryDataProperties({
  name: "Query upcoming events",
  mode: "multiple_to_list_variable",
  listSetId: "1000000000000000001",
  listId: "1000000000000000003",
  resultVariable: "UpcomingEventList",
  countVariable: "TotalUpcomingEvents",
  fieldMap: { Title: "EventName", Text2: "EventDescription", Text3: "EventGuest" },
  pageSize: 1000,
});
assert.equal(multipleList.result.vartype, "list");
assert.equal(multipleList.result.fields, null);
assert.deepEqual(multipleList.result.fieldMap, { Title: "EventName", Text2: "EventDescription", Text3: "EventGuest" });
expectActionPass("multiple QueryData into List variable", queryShape(multipleList));
cases.push({ case: "multiple result to List variable", status: "pass" });

const documentLibraryList = buildWorkflowQueryDataProperties({
  name: "Query Documents",
  mode: "multiple_to_list_variable",
  listSetId: "1000000000000000001",
  listId: "1000000000000000016",
  listType: 16,
  resultVariable: "ListofDocuments",
  countVariable: "TotalRelatedDocuments",
  fieldMap: { Title: "Name", Text4: "File" },
  filters: [{ key: "doc-filter", pre: "and", left: "Text5", op: "0", right: [{ exprType: "list_field", valueType: "input", prop: "ListDataID", id: "ListDataID", type: "expr" }], showCus: false }],
  sorts: [{ SortName: "Created", SortByDesc: true }, { SortName: "Bigint2", SortByDesc: false }],
  pageIndex: 2,
  pageSize: 3,
});
assert.equal(documentLibraryList.listtype, 16);
assert.equal(documentLibraryList.result.pageIndex, 2);
assert.equal(documentLibraryList.result.pageSize, 3);
assert.equal(documentLibraryList.sorts.length, 2);
expectActionPass("Document Library QueryData into List variable", queryShape(documentLibraryList));

const formReportList = buildWorkflowQueryDataProperties({
  name: "Query Form reports",
  mode: "multiple_to_list_variable",
  listSetId: "1000000000000000001",
  listId: "1000000000000000032",
  listType: 32,
  resultVariable: "FormReportData",
  countVariable: "TotalFormReportItems",
  fieldMap: { Bigint1: "FormID", Text2: "Applicant", Datetime1: "Submitted" },
  filters: [{ key: "report-filter", pre: "and", left: "Bigint1", op: "7", right: null }],
  sorts: [{ SortName: "Datetime1", SortByDesc: true }, { SortName: "Text2", SortByDesc: false }],
  pageIndex: 3,
  pageSize: 1000,
});
assert.equal(formReportList.listtype, 32);
assert.equal(formReportList.result.pageIndex, 3);
assert.equal(formReportList.result.pageSize, 1000);
expectActionPass("Form Report QueryData into List variable", queryShape(formReportList));
cases.push({ case: "V1.10 Document Library and Form Report sources with pagination and two sorts", status: "pass" });

const listContract = buildWorkflowListVariable({ id: "UpcomingEventList", name: "Upcoming Events", listRefId: "UpcomingEvents", fields: [{ id: "EventName", type: "text" }, { id: "EventGuest", type: "user" }] });
assert.equal(listContract.variable.value, listContract.listref.id);
assert.deepEqual(buildWorkflowListLoopProperties({ name: "Loop each upcoming event", listVariableId: "UpcomingEventList" }), {
  name: "Loop each upcoming event",
  loopType: "list",
  loopValue: { prefix: "__variables_", value: "UpcomingEventList" },
});
expectActionPass("Loop list mode uses V1.6 shape without invented loopValue.type", {
  id: "loop-1",
  resourceid: "loop-1",
  stencil: { id: "Loop" },
  bodyRef: "loop-body-start",
  properties: buildWorkflowListLoopProperties({ name: "Loop each upcoming event", listVariableId: "UpcomingEventList" }),
});
cases.push({ case: "List variable, ListRef, and Loop contract", status: "pass" });

const subListLoop = buildWorkflowLoopProperties({ name: "Loop Sub list", loopType: "list", sourceParent: "__list_", source: "Event_Items" });
assert.deepEqual(subListLoop.loopValue, { prefix: "__list_", value: "Event_Items" });
expectActionPass("Data List Sub List Loop", loopShape("loop-sublist", "loop-body-sublist", subListLoop));

const valuesLoop = buildWorkflowLoopProperties({
  name: "Loop Members",
  loopType: "values",
  expression: [{ exprType: "list_field", valueType: "identity-picker", prop: "Text6", id: "Members", type: "expr" }],
});
assert.deepEqual(valuesLoop.loopValue, { type: 2, value: [{ exprType: "list_field", valueType: "identity-picker", prop: "Text6", id: "Members", type: "expr" }] });
expectActionPass("multiple-values Loop", loopShape("loop-values", "loop-body-values", valuesLoop));

const numberLoop = buildWorkflowLoopProperties({ name: "Loop fixed times", loopType: "number", expression: [{ type: "num", value: "3" }] });
assert.deepEqual(numberLoop.loopValue, { type: 2, value: [{ type: "num", value: "3" }] });
expectActionPass("fixed-times Loop", loopShape("loop-number", "loop-body-number", numberLoop));
expectActionCode("values Loop cannot use an empty expression", loopShape("loop-values-empty", "loop-body-values", buildWorkflowLoopProperties({ loopType: "values" })), "LOOP_EXPRESSION_VALUE_INVALID");
expectActionCode("every Loop mode requires bodyRef", loopShape("loop-number-no-body", "", numberLoop), "LOOP_BODYREF_MISSING");
cases.push({ case: "V1.7 Sub List, multiple-values, and fixed-times Loop contracts", status: "pass" });

const nestedLoopReport = validateDecodedDef({
  defkey: "DL_LOOP_TEST",
  key: "DL_LOOP_TEST",
  name: "Data List Loop Test",
  workflowType: 1,
  variables: { basic: [], listref: [], filter: [] },
  pageurls: [],
  childshapes: [
    {
      id: "loop-values-nested",
      resourceid: "loop-values-nested",
      stencil: { id: "Loop" },
      bodyRef: "loop-body-nested",
      properties: valuesLoop,
    },
    {
      id: "loop-body-nested",
      resourceid: "loop-body-nested",
      stencil: { id: "LoopBody" },
      properties: { name: "Loop body" },
      children: [
        {
          id: "nested-content-list",
          resourceid: "nested-content-list",
          stencil: { id: "ContentList" },
          properties: { name: "Add item", type: "add", appid: 41, listsetid: "1", listid: "2", listtype: "select" },
        },
      ],
    },
  ],
}, { mode: "final" });
assert.equal(nestedLoopReport.summary.contentListNodes, 1);
assert.ok(nestedLoopReport.errors.some((entry) => entry.code === "CONTENTLIST_MISSING_LISTDATAS" && entry.path.includes("children")));
assert.ok(!nestedLoopReport.errors.some((entry) => ["WORKFLOW_LOOP_EXPRESSION_VALUE_INVALID", "WORKFLOW_LOOP_BODYREF_UNRESOLVED"].includes(entry.code)));
cases.push({ case: "YWF validator recursively inspects LoopBody children", status: "pass" });

const goldenReferences = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/workflow-query-data-golden-references.json"), "utf8"));
const listService = goldenReferences.references.workflow_list_to_html_custom_service;
assert.equal(listService.stencil, "InvokeCode");
assert.equal(listService.properties.params[0].value.value.valueType, "list");
assert.equal(listService.properties.params[0].value.value.id, "<list-variable-id>");
assert.equal(listService.properties.outputs[0].value.prefix, "__variables_");
assert.equal(listService.properties.outputs[0].value.value, "<html-output-variable-id>");
assert.equal(listService.properties.serviceId, "<included-custom-service-id>");
cases.push({ case: "Scheduled List variable to Custom Service text output contract", status: "pass" });

expectActionCode("invalid QueryData page size", queryShape(buildWorkflowQueryDataProperties({ ...multipleList, mode: "multiple_to_list_variable", listSetId: "1", listId: "2", resultVariable: "Rows", fieldMap: { Title: "Title" } }), (shape) => {
  shape.properties.result.pageSize = 1001;
}), "QUERYDATA_PAGE_SIZE_INVALID");
expectActionCode("count-only row fields are forbidden", queryShape(countOnly, (shape) => {
  shape.properties.result.fields = [];
}), "QUERYDATA_COUNT_ONLY_ROW_TARGET_PRESENT");
expectActionCode("unproven QueryData source type", queryShape(documentLibraryList, (shape) => {
  shape.properties.listtype = 999;
}), "QUERYDATA_SOURCE_TYPE_UNPROVEN");
expectActionCode("more than two QueryData sorts", queryShape(documentLibraryList, (shape) => {
  shape.properties.sorts.push({ SortName: "Title", SortByDesc: false });
}), "QUERYDATA_SORT_COUNT_EXCEEDED");
assert.throws(() => buildWorkflowQueryDataProperties({ ...documentLibraryList, sorts: [...documentLibraryList.sorts, { SortName: "Title", SortByDesc: false }] }), /at most 2 sort fields/);
expectActionCode("Loop list mode requires bodyRef", {
  id: "loop-2",
  resourceid: "loop-2",
  stencil: { id: "Loop" },
  properties: buildWorkflowListLoopProperties({ listVariableId: "Rows" }),
}, "LOOP_BODYREF_MISSING");
cases.push({ case: "action validator negative gates", status: "pass" });

const validPlan = planTable([
  ["Campaign approval", "Approval Workflow", "Query Campaigns", "multiple_count_only", "Data List", "Campaign", "None", "Created desc", "None", "None", "None", "None", "TotalCampaigns", "100", "1", "Branch on count", "TotalCampaigns > 0; TotalCampaigns <= 0", "export-proven", "Existence decision"],
  ["Campaign approval", "Approval Workflow", "Get Campaign Owner", "single_to_variables", "Data List", "Campaign", "ListDataID equals SelectedCampaign stored target record id", "Created desc", "CampaignOwner", "Workflow User variable", "None", "Text2 -> CampaignOwner", "None", "100", "1", "Assignment assignee", "N/A", "export-proven", "Resolve owner"],
  ["Event reminder", "Scheduled Workflow", "Query upcoming events", "multiple_to_list_variable", "Data List", "Event Planning", "Date in one month", "Date asc", "UpcomingEventList", "List workflow variable", "Upcoming Events", "Title -> EventName; Text3 -> EventGuest", "TotalUpcomingEvents", "1000", "1", "Loop through list items", "N/A", "export-proven", "Reminder rows"],
  ["Get related documents", "Data List Workflow", "Query Documents", "multiple_to_list_variable", "Document Library", "Event Documents", "Event lookup equals current ListDataID", "Created desc; Bigint2 asc", "ListofDocuments", "List workflow variable", "RelatedDocuments", "Title -> Name; Text4 -> File", "TotalRelatedDocuments", "3", "2", "Downstream workflow actions", "N/A", "export-proven", "V1.10 document rows"],
  ["Get related documents", "Data List Workflow", "Query Form reports", "multiple_to_list_variable", "Form Report", "Approval form report", "Form ID is not empty", "Datetime1 desc; Text2 asc", "FormReportData", "List workflow variable", "FormReportData", "Bigint1 -> FormID; Text2 -> Applicant; Datetime1 -> Submitted", "TotalFormReportItems", "1000", "3", "Downstream workflow actions", "N/A", "export-proven", "V1.10 report rows"],
]);
assert.equal(validateWorkflowQueryDataPlan(validPlan).status, "pass");
expectPlanCode(validPlan.replace("TotalCampaigns > 0; TotalCampaigns <= 0", "TotalCampaigns > 0"), "WORKFLOW_QUERYDATA_PLAN_COUNT_BRANCH_INCOMPLETE");
expectPlanCode(validPlan.replace("ListDataID equals SelectedCampaign stored target record id", "Lookup display title equals SelectedCampaign"), "WORKFLOW_QUERYDATA_PLAN_LOOKUP_IDENTITY_MISSING");
expectPlanCode(validPlan.replace("multiple_to_list_variable", "multiple_to_text_variable"), "WORKFLOW_QUERYDATA_PLAN_LOOP_REQUIRES_LIST");
expectPlanCode(validPlan.replace("Document Library", "Data Report"), "WORKFLOW_QUERYDATA_PLAN_SOURCE_TYPE_UNPROVEN");
expectPlanCode(validPlan.replace("Created desc; Bigint2 asc", "Created desc; Bigint2 asc; Title asc"), "WORKFLOW_QUERYDATA_PLAN_SORT_COUNT_EXCEEDED");
cases.push({ case: "App Plan and Generation Readiness planning contracts", status: "pass" });

const validLoopPlan = loopPlanTable([
  ["Add new events", "Data List Workflow", "Loop Sub list", "list", "__list_", "Event Items Sub List field", "Add event record", "LoopIndex; LoopItem.field_Name", "ContentList add", "runtime-proof-required", "Create one Event per template row"],
  ["Add new events", "Data List Workflow", "Loop Members", "values", "expression", "Members multiple User field expression", "Send email", "Current item", "Repeated email", "runtime-proof-required", "Notify each member"],
  ["Add new events", "Data List Workflow", "Loop fixed times", "number", "expression", "Fixed number 3", "Send email; Delay", "LoopIndex", "Repeated email and Delay", "runtime-proof-required", "Send three reminders"],
]);
assert.equal(validateWorkflowLoopPlan(validLoopPlan).status, "pass");
expectLoopPlanCode(validLoopPlan.replace("__list_", "__temp_"), "WORKFLOW_LOOP_PLAN_LIST_PARENT_INVALID");
expectLoopPlanCode(validLoopPlan.replaceAll("runtime-proof-required", "export-proven"), "WORKFLOW_LOOP_PLAN_SIDE_EFFECT_PROOF_MISSING");
cases.push({ case: "V1.7 Workflow Loop App Plan contracts", status: "pass" });

const materializerTemp = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-host-materializer-gate-"));
try {
  const specPath = path.join(materializerTemp, "functional-specification.md");
  const planPath = path.join(materializerTemp, "yeeflow-app-plan.md");
  fs.writeFileSync(specPath, "# Workflow Host Materializer Gate\n");
  fs.writeFileSync(planPath, [
    "# Workflow Host Materializer Gate",
    "## 4. Data Lists and Document Libraries Plan",
    "| List Name | Resource Type |",
    "| --- | --- |",
    "| Campaign | Data List |",
    "## 7. Schedule Workflows Plan",
    "| Workflow Name | Notes |",
    "| --- | --- |",
    "| Event Reminder | Planned |",
    "## 11. Data List Workflows Plan",
    "| Workflow Name | Host Data List |",
    "| --- | --- |",
    "| Add new events | Campaign |",
  ].join("\n"));
  const materializerReport = materializeFullAppGeneratedFinal({ cwd: materializerTemp, functionalSpec: specPath, appPlan: planPath, outDir: path.join(materializerTemp, "dist"), allowFixtureApiIdsForTests: true });
  assert.equal(materializerReport.status, "fail");
  const materializerCodes = new Set(materializerReport.findings.map((finding) => finding.code));
  assert.ok(materializerCodes.has("FULL_APP_SCHEDULED_WORKFLOW_MATERIALIZER_NOT_IMPLEMENTED"));
  assert.ok(materializerCodes.has("FULL_APP_DATA_LIST_WORKFLOW_MATERIALIZER_NOT_IMPLEMENTED"));
} finally {
  fs.rmSync(materializerTemp, { recursive: true, force: true });
}
cases.push({ case: "full-app materializer cannot silently omit WorkflowType 1/3 plans", status: "pass" });

console.log(JSON.stringify({ status: "pass", test: path.basename(fileURLToPath(import.meta.url)), cases }, null, 2));

function queryShape(properties, mutate) {
  const shape = { id: "query-1", resourceid: "query-1", stencil: { id: "QueryData" }, properties: structuredClone(properties) };
  if (mutate) mutate(shape);
  return shape;
}

function loopShape(id, bodyRef, properties) {
  return { id, resourceid: id, stencil: { id: "Loop" }, bodyRef, properties: structuredClone(properties) };
}

function expectActionPass(label, shape) {
  const report = validateWorkflowActionShapes([shape], { mode: "generator", stage: "final" });
  const errors = report.issues.filter((issue) => issue.level === "error");
  assert.deepEqual(errors, [], `${label}: ${JSON.stringify(errors)}`);
}

function expectActionCode(label, shape, code) {
  const report = validateWorkflowActionShapes([shape], { mode: "generator", stage: "final" });
  assert.ok(report.issues.some((issue) => issue.code === code), `${label} should emit ${code}: ${JSON.stringify(report.issues)}`);
}

function expectPlanCode(markdown, code) {
  const report = validateWorkflowQueryDataPlan(markdown);
  assert.ok(report.findings.some((finding) => finding.code === code), `expected ${code}: ${JSON.stringify(report.findings)}`);
}

function expectLoopPlanCode(markdown, code) {
  const report = validateWorkflowLoopPlan(markdown);
  assert.ok(report.findings.some((finding) => finding.code === code), `expected ${code}: ${JSON.stringify(report.findings)}`);
}

function planTable(rows) {
  const headers = ["Workflow", "Workflow Host Type", "Node Name", "Workflow Query Mode", "Source Resource Type", "Source Resource", "Filters", "Sorts", "Result Variable", "Result Variable Type", "ListRef / Complex Type", "Field Mapping", "Count Variable", "Page Size", "Page Number", "Downstream Consumer / Use", "Branch Coverage", "Proof Boundary", "Notes"];
  return [
    "#### Workflow Query Data Planning",
    "",
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

function loopPlanTable(rows) {
  const headers = ["Workflow", "Workflow Host Type", "Loop Node Name", "Loop Mode", "Loop Source Parent", "Loop Source", "LoopBody Actions", "Current Iteration / Current Item Use", "Delay or Repeated Side Effects", "Proof Boundary", "Business Rationale"];
  return [
    "#### Workflow Loop Planning",
    "",
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

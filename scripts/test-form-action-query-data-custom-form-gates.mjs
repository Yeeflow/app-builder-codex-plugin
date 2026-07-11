#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { validateCustomFormQueryData } from "./validate-form-action-query-data-custom-forms.mjs";

const require = createRequire(import.meta.url);
const { QUERY_DATA_MODES, buildFormActionQueryDataStep } = require("./lib/form-action-query-data-utils.cjs");

const positive = fixture();
const report = validateCustomFormQueryData(positive, { strictGenerated: true });
assert.equal(report.ok, true, JSON.stringify(report.findings, null, 2));
assert.equal(report.queryStepCount, 4);
assert.ok(report.findings.some((item) => item.code === "FORM_ACTION_QUERYDATA_VIEW_FORM_SUBLIST_WORKING_COPY"));
const planReport = validateCustomFormQueryData(positive, { strictGenerated: true, planMarkdown: matchingPlan() });
assert.equal(planReport.ok, true, JSON.stringify(planReport.findings, null, 2));

expectFailure("unbound action", (decoded) => {
  form(decoded, "New event").formAction = {};
  form(decoded, "New event").children[0].attrs.control_event_rule = "";
}, "FORM_ACTION_QUERYDATA_ACTION_UNBOUND");
expectFailure("missing current-record target", (decoded) => {
  form(decoded, "New event").actions[0].steps[0].attrs.querydata_fieldmap.Text1 = "____customListFields_Text99";
}, "FORM_ACTION_QUERYDATA_LIST_FIELD_TARGET_MISSING");
expectFailure("plain target encoding", (decoded) => {
  form(decoded, "New event").actions[0].steps[0].attrs.querydata_fieldmap.Text1 = "Text3";
}, "FORM_ACTION_QUERYDATA_DATALIST_TARGET_ENCODING_INVALID");
expectFailure("missing Sub list row field", (decoded) => {
  form(decoded, "View Campaign").actions[0].steps[0].attrs.querydata_fieldmap.Text2 = "field_Missing";
}, "FORM_ACTION_QUERYDATA_SUBLIST_ROW_FIELD_MISSING");
expectFailure("missing count temp", (decoded) => {
  form(decoded, "View Campaign").actions[0].steps[0].attrs.querydata_totalcount = "MissingCount";
}, "FORM_ACTION_QUERYDATA_COUNT_TEMP_TARGET_MISSING");
expectFailure("Approval target parent on Data List form", (decoded) => {
  form(decoded, "View Campaign").actions[0].steps[0].attrs.querydata_listname_parent = "__variables_";
}, "FORM_ACTION_QUERYDATA_APPROVAL_TARGET_ON_DATALIST_FORM");
expectFailure("invalid Document Library page number", (decoded) => {
  form(decoded, "View Document").actions[0].steps[0].attrs.querydata_pageindex = 0;
}, "FORM_ACTION_QUERYDATA_PAGE_NUMBER_INVALID");
const missingPlanStep = validateCustomFormQueryData(positive, { strictGenerated: true, planMarkdown: matchingPlan().replace("Apply selected campaign", "Missing step") });
assert.equal(missingPlanStep.ok, false);
assert.ok(missingPlanStep.findings.some((item) => item.code === "FORM_ACTION_QUERYDATA_PLAN_STEP_NOT_MATERIALIZED"));

console.log(JSON.stringify({
  status: "pass",
  test: "test-form-action-query-data-custom-form-gates.mjs",
  cases: 10,
}, null, 2));

function fixture() {
  const listSetId = "9000000000000000001";
  const campaignId = "9000000000000000002";
  const eventId = "9000000000000000003";
  const source = { AppID: 41, ListSetID: listSetId, ListID: campaignId, ListType: 1 };
  const eventFields = [field("Title", "input"), field("Text3", "identity-picker"), field("Text12", "lookup")];
  const campaignFields = [field("Title", "input"), field("Text1", "textarea"), field("Text2", "identity-picker"), field("Text3", "list")];
  const documentId = "9000000000000000004";
  const documentFields = [field("Title", "input"), field("Text5", "lookup")];
  const viewEvent = formdef({
    title: "View event",
    actionId: "action-view-event",
    trigger: "onLoad",
    tempVars: ["CampaignName", "CampaignDescription"],
    step: buildFormActionQueryDataStep({
      mode: QUERY_DATA_MODES.SINGLE_TO_TEMP_VARIABLES,
      hostSurface: "data_list_custom_form",
      name: "Load campaign details",
      source,
      fieldMap: { Title: "CampaignName", Text1: "CampaignDescription" },
      filters: [currentIdFilter("ListDataID")],
    }),
  });
  const newEvent = formdef({
    title: "New event",
    actionId: "action-new-event",
    trigger: "control",
    tempVars: ["CampaignDescription"],
    step: buildFormActionQueryDataStep({
      mode: QUERY_DATA_MODES.SINGLE_TO_LIST_FIELDS_AND_TEMP_VARIABLES,
      hostSurface: "data_list_custom_form",
      name: "Apply selected campaign",
      source,
      listFieldMap: { Text2: "Text3" },
      tempFieldMap: { Text1: "CampaignDescription" },
      filters: [currentIdFilter("Text12", "lookup")],
    }),
  });
  const viewCampaign = formdef({
    title: "View Campaign",
    actionId: "action-view-campaign",
    trigger: "onLoad",
    tempVars: ["ReturnRecords"],
    subList: true,
    step: buildFormActionQueryDataStep({
      mode: QUERY_DATA_MODES.MULTIPLE_TO_LIST_SUBLIST,
      hostSurface: "data_list_custom_form",
      name: "Load campaign event items",
      source: { ...source, ListID: eventId },
      fieldMap: { Title: "field_Name", Text2: "field_Description" },
      resultTarget: "Text3",
      countTarget: { id: "ReturnRecords", parent: "__temp_" },
      filters: [currentIdFilter("ListDataID")],
    }),
  });
  const viewDocument = formdef({
    title: "View Document",
    actionId: "action-view-document",
    trigger: "onLoad",
    tempVars: ["EventName", "EventDescription"],
    step: buildFormActionQueryDataStep({
      mode: QUERY_DATA_MODES.SINGLE_TO_TEMP_VARIABLES,
      hostSurface: "document_library_custom_form",
      name: "Load related event",
      source: { ...source, ListID: eventId },
      fieldMap: { Title: "EventName", Text2: "EventDescription" },
      filters: [currentIdFilter("Text5", "lookup")],
      pageSize: 5,
      pageNumber: 2,
    }),
  });
  return {
    Childs: [
      child("Event Planning", eventId, eventFields, { add: "layout-new-event", view: "layout-view-event" }, [
        layout("layout-view-event", "View event", viewEvent),
        layout("layout-new-event", "New event", newEvent),
      ]),
      child("Campaign", campaignId, campaignFields, { view: "layout-view-campaign" }, [
        layout("layout-view-campaign", "View Campaign", viewCampaign),
      ]),
      child("Event Documents", documentId, documentFields, { view: "layout-view-document" }, [
        layout("layout-view-document", "View Document", viewDocument),
      ], 16),
    ],
  };
}

function formdef({ title, actionId, trigger, tempVars, step, subList = false }) {
  const controls = [{ type: "lookup", binding: "Text12", attrs: trigger === "control" ? { control_event_rule: actionId } : {} }];
  if (subList) controls.push({ type: "list", binding: "Text3", attrs: { "list-variables": [{ id: "field_Name" }, { id: "field_Description" }] } });
  return {
    title,
    children: controls,
    tempVars: tempVars.map((id) => ({ idx: `idx-${id}`, id })),
    actions: [{ id: actionId, name: `${title} query`, steps: [step] }],
    formAction: trigger === "onLoad" ? { onLoad: actionId } : {},
  };
}

function child(title, id, fields, layoutView, layouts, type = 1) {
  return { List: { Title: title, ListID: id, Type: type, LayoutView: JSON.stringify(layoutView) }, Fields: fields, Layouts: layouts };
}

function layout(id, title, resource) {
  return { Type: 1, Title: title, LayoutID: id, LayoutInResources: [{ ID: id, RefId: id, Resource: resource }] };
}

function field(FieldName, Type) {
  return { FieldName, Type, FieldType: "Text", DisplayName: FieldName };
}

function currentIdFilter(prop, valueType = "input") {
  return { left: "ListDataID", op: "0", right: [{ exprType: "list_field", valueType, prop, id: prop, type: "expr" }] };
}

function form(decoded, title) {
  for (const child of decoded.Childs) for (const layout of child.Layouts) if (layout.Title === title) return layout.LayoutInResources[0].Resource;
  throw new Error(`Missing form ${title}`);
}

function expectFailure(name, mutate, code) {
  const decoded = structuredClone(positive);
  mutate(decoded);
  const report = validateCustomFormQueryData(decoded, { strictGenerated: true });
  assert.equal(report.ok, false, `${name} should fail`);
  assert.ok(report.findings.some((item) => item.code === code), `${name} should report ${code}: ${JSON.stringify(report.findings)}`);
}

function matchingPlan() {
  return `#### Form Actions and Temp Variables

| Action Name | Step Name | Host Resource | Host Form | Host Surface / Page | Trigger | Exact Step Type | Query Mode | Source Resource Type | Source Resource | Filters | Sorts | Result Target Type | Result Target | Field Mapping | Count Target Type | Count Target | Page Size | Page Number | Persistence / Lifetime | Bound Control | Proof Boundary | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| New event query | Apply selected campaign | Event Planning | New event | Data List New Item | Field Change | Query Data | single_to_list_fields_and_temp_variables | Data List | Campaign | ListDataID = current:Text12 | Created desc | Current fields + Temp variables | Text3; CampaignDescription | Text2 -> field:Text3; Text1 -> temp:CampaignDescription | None | None | 100 | 1 | Mixed | Text12 | export-proven | Campaign enrichment |
| View Document query | Load related event | Event Documents | View Document | Document Library View Item | Page Load | Query Data | single_to_temp_variables | Data List | Event Planning | ListDataID = current:Text5 | None | Temp variables | EventName; EventDescription | Title -> EventName; Text2 -> EventDescription | None | None | 5 | 2 | Current page session | None | export-proven | Related Event display |`;
}

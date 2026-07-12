#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildApprovalFormLayoutDef, ensureApprovalSubListColumnTitles } from "./lib/approval-form-layout-builder.mjs";
import { approvalWorkflowNodeSize } from "./lib/approval-workflow-designer-shape-utils.mjs";
import { validateApprovalFormLayoutTemplate } from "./validate-approval-form-layout-template.mjs";
import workflowAssigneeExpressionUtils from "./lib/workflow-assignee-expression-utils.cjs";
import formActionQueryDataUtils from "./lib/form-action-query-data-utils.cjs";

const require = createRequire(import.meta.url);
const { validateDecodedDef } = require("../validate-ywf-def.js");
const {
  buildWorkflowExpressionButton,
  serializeWorkflowVariableJson,
} = workflowAssigneeExpressionUtils;
const {
  QUERY_DATA_MODES,
  buildFormActionQueryDataStep,
} = formActionQueryDataUtils;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const IDS = {
  requestPage: "11111111-1111-4111-8111-111111111111",
  taskPage: "22222222-2222-4222-8222-222222222222",
  start: "33333333-3333-4333-8333-333333333333",
  task: "44444444-4444-4444-8444-444444444444",
  approved: "55555555-5555-4555-8555-555555555555",
  rejected: "66666666-6666-4666-8666-666666666666",
  end: "77777777-7777-4777-8777-777777777777",
  endReject: "88888888-8888-4888-8888-888888888888",
};

const cases = [];

expectPass("valid export-shaped approval form workflow");
expectStandaloneYwfApprovalLayoutPass();
expectApprovalSubListColumnTitlesPass();
expectApprovalSubListCustomColumnTitlePreserved();
expectCode("Sub List column without control label fails", (def) => {
  addApprovalSubListFixture(def);
  delete approvalSubListControls(def)[0].attrs["list-fields"][0].control.label;
}, "APPROVAL_SUBLIST_COLUMN_CONTROL_LABEL_MISSING");
expectCode("Sub List column without label_var fails", (def) => {
  addApprovalSubListFixture(def);
  delete approvalSubListControls(def)[0].attrs["list-fields"][0].control.label_var;
}, "APPROVAL_SUBLIST_COLUMN_CONTROL_LABEL_VAR_MISSING");
expectCode("canonically duplicate Approval variable id fails", (def) => {
  def.variables.basic.push({ id: "Request Title", idx: "Request Title", name: "Request Title", type: "text" });
}, "DUPLICATE_VARIABLE_ID_CANONICAL");
expectCode("Approval basic and temp variable ids share one resource namespace", (def) => {
  def.variables.tempVars = [{ id: "Request Title", idx: "Request Title" }];
}, "DUPLICATE_VARIABLE_ID_CANONICAL");
expectCode("Approval basic and filter variable ids share one resource namespace", (def) => {
  def.variables.filter = [{ id: "Request-Title", idx: "Request-Title" }];
}, "DUPLICATE_VARIABLE_ID_CANONICAL");
expectCode("object binding fails", (def) => {
  firstValueControl(def).binding = { value: "requestTitle" };
}, "CONTROL_BINDING_NOT_STRING");
expectCode("legacy date control fails", (def) => {
  firstValueControl(def).type = "date";
}, "DATE_CONTROL_TYPE_LEGACY");
expectCode("numeric string width fails", (def) => {
  firstValueControl(def).attrs.common.positioning.width = [null, "960"];
}, "CONTROL_WIDTH_STRING_INVALID");
expectCode("missing Form body fails", (def) => {
  def.pageurls[0].formdef.children[0].children[0].children = def.pageurls[0].formdef.children[0].children[0].children.filter((child) => child.label !== "Form body");
}, "UI_STANDARD_FORM_BODY_MISSING");
expectCode("label-only task outcome condition fails", (def) => {
  const flow = def.childshapes.find((shape) => shape.id === IDS.approved);
  flow.properties.conditioninfo = [{ label: "Approved" }];
}, "APPROVAL_CONDITION_SHAPE_INCOMPLETE");
expectCode("simple Outcome token task outcome condition fails", (def) => {
  const flow = def.childshapes.find((shape) => shape.id === IDS.approved);
  flow.properties.conditioninfo = simpleOutcomeCondition("Approved");
}, "APPROVAL_CONDITION_LEFT_TASK_REF_INVALID");
expectCode("JSON-wrapped assignee expression fails", (def) => {
  const task = def.childshapes.find((shape) => shape.id === IDS.task);
  task.properties.usertaskassignment = [legacyJsonWrappedApplicantLineManager()];
}, "WORKFLOW_ASSIGNEE_EXPRESSION_OUTER_SHAPE_INVALID");
expectCode("plain JSON nested applicant expression fails", (def) => {
  const task = def.childshapes.find((shape) => shape.id === IDS.task);
  task.properties.usertaskassignment = [applicantLineManagerWithPlainJsonParam()];
}, "WORKFLOW_ASSIGNEE_NESTED_EXPRESSION_MISSING");
expectQueryDataGoldenModesPass();
expectTaskFormQueryDataWrapperPass();
expectCode("Query Data multiple query missing all outputs fails", (def) => {
  addQueryDataFixture(def, [{
    type: "querydata",
    name: "Query multiple without output",
    attrs: { querydata_list: querySource(), querydata_type: "multiple" },
  }]);
}, "FORM_ACTION_QUERYDATA_OUTPUT_MISSING");
expectCode("Query Data count-only stale Sub list mapping fails", (def) => {
  const step = querySteps()[3];
  step.attrs.querydata_fieldmap = { Title: "row_title" };
  step.attrs.querydata_listname = "QueryRows";
  step.attrs.querydata_vartype = "list";
  step.attrs.querydata_listname_parent = "__variables_";
  addQueryDataFixture(def, [step]);
}, "FORM_ACTION_QUERYDATA_COUNT_ONLY_STALE_RESULT_MAPPING");
expectCode("Query Data single mapping to undeclared temp variable fails", (def) => {
  const step = buildFormActionQueryDataStep({
    mode: QUERY_DATA_MODES.SINGLE_TO_TEMP_VARIABLES,
    name: "Query single to missing temp",
    source: querySource(),
    fieldMap: { Title: "MissingTemp" },
  });
  addQueryDataFixture(def, [step]);
}, "FORM_ACTION_QUERYDATA_VARIABLE_TARGET_MISSING");
expectCode("Query Data workflow count target must be numeric", (def) => {
  const step = buildFormActionQueryDataStep({
    mode: QUERY_DATA_MODES.MULTIPLE_COUNT_ONLY,
    name: "Query count only",
    source: querySource(),
    countTarget: { id: "requestTitle", parent: "__variables_" },
  });
  addQueryDataFixture(def, [step]);
}, "FORM_ACTION_QUERYDATA_COUNT_TARGET_NOT_NUMBER");
expectCode("Query Data page size above 1000 fails", (def) => {
  const step = querySteps()[0];
  step.attrs.querydata_pagesize = 1001;
  addQueryDataFixture(def, [step]);
}, "FORM_ACTION_QUERYDATA_PAGE_SIZE_INVALID");

console.log(JSON.stringify({
  status: "pass",
  test: "test-approval-ywf-form-structure-gates",
  cases,
}, null, 2));

function expectPass(label) {
  const report = validateDecodedDef(validDef(), { mode: "final" });
  assert.equal(report.status, "pass", `${label}\n${JSON.stringify(report, null, 2)}`);
  cases.push({ case: `pass: ${label}`, status: "pass" });
}

function expectStandaloneYwfApprovalLayoutPass() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "standalone-ywf-approval-layout-"));
  const fields = [
    { displayName: "Request Title", fieldName: "RequestTitle", fieldType: "Text", controlType: "input" },
    { displayName: "Estimated Amount", fieldName: "EstimatedAmount", fieldType: "Decimal", controlType: "currency" },
    { displayName: "Business Justification", fieldName: "BusinessJustification", fieldType: "Text", controlType: "textarea" },
  ];
  const casesToValidate = [
    {
      file: path.join(tmpDir, "submission.formdef.json"),
      template: "approval_form_layout_submission_v1_1",
      pageRole: "submission",
      resource: buildApprovalFormLayoutDef({
        rootDir: ROOT,
        id: IDS.requestPage,
        title: "Standalone Approval Layout Proof",
        role: "submission",
        fields,
      }),
    },
    {
      file: path.join(tmpDir, "task.formdef.json"),
      template: "approval_form_layout_task_v1_1",
      pageRole: "task",
      resource: buildApprovalFormLayoutDef({
        rootDir: ROOT,
        id: IDS.taskPage,
        title: "Standalone Approval Layout Proof",
        role: "task",
        fields,
      }),
    },
  ];
  for (const item of casesToValidate) {
    fs.writeFileSync(item.file, JSON.stringify(item.resource, null, 2));
    const report = validateApprovalFormLayoutTemplate({
      resource: item.file,
      template: item.template,
      pageRole: item.pageRole,
    });
    assert.equal(report.status, "pass", `standalone .ywf ${item.pageRole} should use ${item.template}\n${JSON.stringify(report, null, 2)}`);
  }
  cases.push({ case: "pass: standalone .ywf approval pages use Approval Form Layouts v1.1", status: "pass" });
}

function expectApprovalSubListColumnTitlesPass() {
  const def = validDef();
  addApprovalSubListFixture(def);
  const controls = approvalSubListControls(def);
  assert.equal(controls.length, 2, "Submission and Task forms should both materialize the Itinerary Sub List");
  for (const control of controls) {
    assert.equal(control.attrs["list-fields"].length, 7, "each Itinerary Sub List should materialize 7 visible columns");
    for (const field of control.attrs["list-fields"]) {
      assert.equal(typeof field.control.label, "string", `${field.id} should include a string control.label`);
      assert.ok(field.control.label.trim(), `${field.id} should include a non-empty control.label`);
      assert.equal(field.control.label_var, null, `${field.id} should use label_var=null for its fixed column title`);
    }
  }
  const report = validateDecodedDef(def, { mode: "final" });
  assert.notEqual(report.status, "fail", `7/7 Submission and Task Sub List column titles should not fail\n${JSON.stringify(report, null, 2)}`);
  assert.equal(report.errors.length, 0, `7/7 Submission and Task Sub List column titles should have no errors\n${JSON.stringify(report, null, 2)}`);
  cases.push({ case: "pass: Approval Sub List 7/7 column titles on Submission and Task forms", status: "pass" });
}

function expectApprovalSubListCustomColumnTitlePreserved() {
  const resource = buildApprovalFormLayoutDef({
    rootDir: ROOT,
    id: IDS.requestPage,
    title: "Business Travel Request Approval",
    role: "submission",
    fields: [itinerarySubListField()],
  });
  const listControl = findControls(resource, (control) => control.type === "list")[0];
  listControl.attrs["list-fields"][0].control.label = "Custom Itinerary Date";
  ensureApprovalSubListColumnTitles(resource);
  assert.equal(listControl.attrs["list-fields"][0].control.label, "Custom Itinerary Date", "normalizer must preserve an existing custom business column title");
  cases.push({ case: "pass: existing custom Approval Sub List column title is preserved", status: "pass" });
}

function addApprovalSubListFixture(def) {
  const fields = [
    { displayName: "Request Title", fieldName: "RequestTitle", fieldType: "Text", controlType: "input" },
    itinerarySubListField(),
  ];
  def.pageurls[0].formdef = buildApprovalFormLayoutDef({
    rootDir: ROOT,
    id: IDS.requestPage,
    title: "Business Travel Request Approval",
    role: "submission",
    fields,
  });
  def.pageurls[1].formdef = buildApprovalFormLayoutDef({
    rootDir: ROOT,
    id: IDS.taskPage,
    title: "Business Travel Request Approval",
    role: "task",
    fields,
  });
  def.variables.basic.push({
    id: "Travel Itinerary",
    idx: "Travel Itinerary",
    name: "Travel Itinerary",
    type: "list",
    value: "TravelItineraryListRef",
  });
  def.variables.listref.push({
    id: "TravelItineraryListRef",
    idx: "TravelItineraryListRef",
    name: "Travel Itinerary",
    fields: itinerarySubListField().listFields.map((field) => ({
      id: field.id,
      idx: field.id,
      name: field.displayName,
      type: field.fieldType,
      editable: true,
    })),
  });
}

function itinerarySubListField() {
  return {
    displayName: "Itinerary lines",
    fieldName: "Travel Itinerary",
    fieldType: "Sub list",
    controlType: "list",
    listRefId: "TravelItineraryListRef",
    listFields: [
      { id: "ItineraryDate", displayName: "Date", columnTitle: "Itinerary Date", fieldType: "date", controlType: "datepicker" },
      { id: "FromLocation", displayName: "From", columnTitle: "From Location", fieldType: "text", controlType: "input" },
      { id: "ToLocation", displayName: "To", columnTitle: "To Location", fieldType: "text", controlType: "input" },
      { id: "TransportMode", displayName: "Transport Mode", fieldType: "text", controlType: "input" },
      { id: "Nights", displayName: "Nights", fieldType: "number", controlType: "input_number" },
      { id: "AccommodationNeeded", displayName: "Accommodation Needed", fieldType: "boolean", controlType: "switch" },
      { id: "ItineraryNotes", displayName: "Notes", fieldType: "text", controlType: "input" },
    ],
  };
}

function approvalSubListControls(def) {
  return def.pageurls.flatMap((page) => findControls(page.formdef, (control) => control.type === "list" && control.binding === "Travel Itinerary"));
}

function findControls(root, predicate) {
  const controls = [];
  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") return;
    if (value.type && predicate(value)) controls.push(value);
    Object.values(value).forEach(visit);
  };
  visit(root);
  return controls;
}

function expectCode(label, mutate, expectedCode) {
  const def = validDef();
  mutate(def);
  const report = validateDecodedDef(def, { mode: "final" });
  assert.equal(report.status, "fail", `${label} should fail\n${JSON.stringify(report, null, 2)}`);
  assert.ok(report.errors.some((error) => error.code === expectedCode), `${label} expected ${expectedCode}\n${JSON.stringify(report, null, 2)}`);
  cases.push({ case: `fail: ${label}`, status: "pass", code: expectedCode });
}

function expectQueryDataGoldenModesPass() {
  const def = validDef();
  addQueryDataFixture(def, querySteps());
  const report = validateDecodedDef(def, { mode: "final" });
  assert.equal(report.status, "pass", `four Query Data golden modes should pass\n${JSON.stringify(report, null, 2)}`);
  cases.push({ case: "pass: four Form Action Query Data golden modes", status: "pass" });
}

function expectTaskFormQueryDataWrapperPass() {
  const def = validDef();
  addQueryDataFixture(def, querySteps());
  const taskPage = def.pageurls[1];
  taskPage.formdef.actions = structuredClone(def.pageurls[0].formdef.actions);
  taskPage.formdef.formAction.onLoad = def.pageurls[0].formdef.formAction.onLoad;
  const report = validateDecodedDef(def, { mode: "final" });
  assert.equal(report.status, "pass", `Approval Task Form Query Data wrapper should match Submission Form\n${JSON.stringify(report, null, 2)}`);
  cases.push({ case: "pass: Approval Task Form uses Submission-style Query Data wrapper", status: "pass" });
}

function addQueryDataFixture(def, steps) {
  def.variables.basic.push(
    { id: "QueryRows", idx: "QueryRows", name: "Query Rows", type: "list", value: "QueryRowsRef" },
    { id: "QueryCount", idx: "QueryCount", name: "Query Count", type: "number" },
  );
  def.variables.listref.push({
    id: "QueryRowsRef",
    idx: "QueryRowsRef",
    name: "Query Rows",
    fields: [{ id: "row_title", idx: "row_title", name: "Title", type: "text" }],
  });
  def.variables.tempVars = [
    { id: "QueryName", idx: "QueryName" },
    { id: "TempCount", idx: "TempCount" },
  ];
  def.pageurls[0].formdef.actions = [{
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    name: "Query data sample",
    steps,
  }];
  def.pageurls[0].formdef.formAction.onLoad = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
}

function querySteps() {
  return [
    buildFormActionQueryDataStep({
      mode: QUERY_DATA_MODES.SINGLE_TO_VARIABLES,
      name: "Query single data and save to variables",
      source: querySource(),
      filters: queryFilters(),
      sorts: querySorts(),
      fieldMap: { Title: "requestTitle" },
    }),
    buildFormActionQueryDataStep({
      mode: QUERY_DATA_MODES.SINGLE_TO_TEMP_VARIABLES,
      name: "Query single data and save to temp variables",
      source: querySource(),
      filters: queryFilters(),
      sorts: querySorts(),
      fieldMap: { Title: "QueryName" },
    }),
    buildFormActionQueryDataStep({
      mode: QUERY_DATA_MODES.MULTIPLE_TO_SUBLIST,
      name: "Query multiple data and save to Sub list",
      source: querySource(),
      filters: queryFilters(),
      sorts: querySorts(),
      fieldMap: { Title: "row_title" },
      resultTarget: "QueryRows",
      countTarget: { id: "QueryCount", parent: "__variables_" },
    }),
    buildFormActionQueryDataStep({
      mode: QUERY_DATA_MODES.MULTIPLE_COUNT_ONLY,
      name: "Query multiple data and save result count only",
      source: querySource(),
      filters: queryFilters(),
      sorts: querySorts(),
      countTarget: { id: "TempCount", parent: "__temp_" },
    }),
  ];
}

function querySource() {
  return { AppID: 41, ListSetID: "9000000000000000001", ListID: "9000000000000000002", ListType: 1 };
}

function queryFilters() {
  return [{ left: "Text4", op: "0", right: "Confirmed", showCus: true }];
}

function querySorts() {
  return [{ SortName: "Datetime1", SortByDesc: true }];
}

function validDef() {
  const start = node(IDS.start, "StartNoneEvent", "Start", 100, 220, {
    taskurl: IDS.requestPage,
    taskUrl: IDS.requestPage,
    TaskUrl: IDS.requestPage,
  });
  const task = node(IDS.task, "MultiAssignmentTask", "Manager approval", 420, 220, {
    pagetype: 1,
    approveway: "anyapprove",
    approvepercentage: 100,
    usertaskassignment: [applicantLineManager()],
    taskurl: IDS.taskPage,
    taskUrl: IDS.taskPage,
    TaskUrl: IDS.taskPage,
  });
  const end = node(IDS.end, "EndNoneEvent", "End", 760, 160);
  const endReject = node(IDS.endReject, "EndRejectEvent", "End with rejection", 760, 320);
  const approved = sequence(IDS.approved, task, end, "Approved", outcomeCondition(task, "Approved"));
  const rejected = sequence(IDS.rejected, task, endReject, "Rejected", outcomeCondition(task, "Rejected"));
  const submit = sequence("99999999-9999-4999-8999-999999999999", start, task, "Submit", []);

  return {
    defkey: "EmployeeEquipmentPurchaseApproval",
    lineType: "rounded",
    graphver: 2,
    graphzoom: 1,
    graphposition: { x: 0, y: 0, width: 1100, height: 700 },
    flowPage: [],
    variables: {
      basic: [{ id: "requestTitle", idx: "requestTitle", name: "requestTitle", title: "Request Title", type: "text" }],
      listref: [],
      filter: [],
    },
    pageurls: [
      page(IDS.requestPage, "request", 1),
      page(IDS.taskPage, "task", 2),
    ],
    childshapes: [start, submit, task, approved, rejected, end, endReject],
  };
}

function page(id, key, type) {
  return {
    id,
    key,
    pageUrl: key,
    pageurl: key,
    PageUrl: key,
    type,
    pagetype: type === 2 ? 1 : 1,
    name: `${key} page`,
    formdef: formdef(`${key} page`, type),
  };
}

function formdef(title, pagetype) {
  return {
    title,
    name: title,
    pagetype,
    ver: 2,
    attrs: {
      background: { normal: { color: "var(--c--neutral-light)" } },
      container: {
        cw: "2",
        padding: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }],
      },
    },
    actions: [],
    formAction: {},
    exts: [],
    children: [
      container("Main", [
        container("Content", [
          container("Form body", [
            {
              id: uuidFromLabel(`${title} request title`),
              type: "input",
              label: "Request Title",
              binding: "requestTitle",
              attrs: {
                common: { positioning: { widthtype: [null, "3"], width: [null, 960], widthu: [null, "px"] } },
              },
              children: [],
            },
          ]),
          container("Form bottom", [
            { id: uuidFromLabel(`${title} workflow panel`), type: "workflowControlPanel", label: "Action Panel", attrs: {}, children: [] },
            { id: uuidFromLabel(`${title} workflow history`), type: "workflowHistory", label: "Flow History", attrs: {}, children: [] },
          ]),
        ]),
      ]),
    ],
  };
}

function container(label, children) {
  return {
    id: uuidFromLabel(label + Math.random().toString(16).slice(2)),
    type: "container",
    label,
    nv_label: label,
    attrs: {},
    children,
  };
}

function node(id, stencil, name, x, y, properties = {}) {
  const size = approvalWorkflowNodeSize(stencil);
  return {
    id,
    resourceid: id,
    stencil: { id: stencil },
    position: { x, y },
    bounds: {
      upperLeft: { x, y },
      lowerRight: { x: x + size.width, y: y + size.height },
    },
    incoming: [],
    outgoing: [],
    properties: { name, ...properties },
  };
}

function sequence(id, source, target, name, conditioninfo) {
  const flow = {
    id,
    resourceid: id,
    stencil: { id: "SequenceFlow" },
    source: { id: source.id, resourceid: source.id },
    target: { id: target.id, resourceid: target.id },
    incoming: [{ id: source.id, resourceid: source.id }],
    outgoing: [{ id: target.id, resourceid: target.id }],
    dockers: [],
    properties: { name, linetype: "rounded", documentation: name === "Complete" ? "Completed" : name, conditioninfo },
  };
  source.outgoing.push({ id, resourceid: id });
  target.incoming.push({ id, resourceid: id });
  return flow;
}

function outcomeCondition(task, outcome) {
  return [{
    key: uuidFromLabel(`condition ${outcome}`),
    pre: "and",
    left: expressionButton({
      type: "task",
      param: { defid: task.id },
      prop: "Outcome",
    }, `${task.properties.name}:Outcome`),
    op: "s.=",
    right: `<input type="button" data="${outcome}" expr="__" tabindex="-1" value="Task outcome:${outcome}">`,
  }];
}

function simpleOutcomeCondition(outcome) {
  return [{
    key: uuidFromLabel(`simple condition ${outcome}`),
    pre: "and",
    left: {
      type: 1,
      value: {
        exprType: "variable",
        valueType: "text",
        id: "Outcome",
        type: "expr",
        name: "Task outcome:Outcome",
      },
    },
    op: "s.=",
    right: {
      type: 0,
      value: `Task outcome:${outcome}`,
    },
  }];
}

function applicantLineManager() {
  return {
    type: "user",
    method: "expression",
    title: `User: ${expressionButton({
      type: "user",
      param: { id: serializeWorkflowVariableJson({ type: "application", prop: "ApplicantUserID" }) },
      prop: "LineManager",
    }, "Applicant:Line Manager")}`,
    value: expressionButton({
      type: "user",
      param: { id: serializeWorkflowVariableJson({ type: "application", prop: "ApplicantUserID" }) },
      prop: "LineManager",
    }, "Applicant:Line Manager"),
  };
}

function expressionButton(data, label) {
  return buildWorkflowExpressionButton(data, label);
}

function legacyJsonWrappedApplicantLineManager() {
  const data = {
    type: "user",
    param: { id: JSON.stringify({ type: "application", prop: "ApplicantUserID" }) },
    prop: "LineManager",
  };
  const escapedData = JSON.stringify(data).replace(/"/g, "&quot;");
  const value = `<input type="button" data="\${${escapedData}}" expr="__" tabindex="-1" value="Applicant:Line Manager">`;
  return { type: "user", method: "expression", title: `User: ${value}`, value };
}

function applicantLineManagerWithPlainJsonParam() {
  const value = expressionButton({
    type: "user",
    param: { id: JSON.stringify({ type: "application", prop: "ApplicantUserID" }) },
    prop: "LineManager",
  }, "Applicant:Line Manager");
  return { type: "user", method: "expression", title: `User: ${value}`, value };
}

function firstValueControl(def) {
  return def.pageurls[0].formdef.children[0].children[0].children[0].children[0];
}

function uuidFromLabel(label) {
  let hash = 0;
  for (const ch of String(label)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `${hex(hash, 8)}-${hex(hash + 1, 4)}-4${hex(hash + 2, 3)}-8${hex(hash + 3, 3)}-${hex(hash + 4, 12)}`;
}

function hex(value, length) {
  return (Number(value) >>> 0).toString(16).padStart(length, "0").slice(0, length);
}

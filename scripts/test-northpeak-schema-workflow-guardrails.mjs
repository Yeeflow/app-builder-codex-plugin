#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const GZIP_PREFIX = "[______gizp______]";
const REQUEST_PAGE_ID = "11111111-1111-4111-8111-111111111111";
const TASK_PAGE_ID = "22222222-2222-4222-8222-222222222222";

function runNode(args) {
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function parseReport(result) {
  return JSON.parse(result.stdout || result.stderr);
}

function field(fieldName, fieldType, type, index) {
  return {
    FieldID: String(1000000000000001000n + BigInt(index)),
    ListID: "1000000000000000101",
    AppID: 41,
    FieldName: fieldName,
    InternalName: fieldName,
    DisplayName: fieldName,
    FieldType: fieldType,
    Type: type,
    Category: 1,
    FieldIndex: index,
    Status: 1,
    IsSystem: false,
    IsIndex: false,
    Rules: "{}",
  };
}

function titleField() {
  return {
    FieldID: "1000000000000001000",
    ListID: "1000000000000000101",
    AppID: 41,
    FieldName: "Title",
    InternalName: "Title",
    DisplayName: "Title",
    FieldType: "Text",
    Type: "input",
    Category: 1,
    FieldIndex: 0,
    Status: 0,
    IsSystem: true,
    IsIndex: true,
    Rules: "{}",
  };
}

function page({ id, key, type, pagetype, formdefPagetype, includeRegistration = true }) {
  const entry = {
    id,
    key,
    type,
    pagetype,
    title: key,
    name: key,
    formdef: {
      id,
      key,
      pagetype: formdefPagetype,
      title: key,
      name: key,
      attrs: { hideHeader: true, container: { cw: "2", padding: { "1": { top: 0, right: 0, bottom: 0, left: 0 } } } },
      children: [
        { id: `${id}-body`, type: "container", nv_label: "Form body", attrs: {}, children: [] },
        {
          id: `${id}-bottom`,
          type: "container",
          nv_label: "Form bottom",
          attrs: {},
          children: [
            { id: `${id}-panel`, type: "workflowControlPanel", attrs: {}, children: [] },
            { id: `${id}-history`, type: "workflowHistory", attrs: {}, children: [] },
          ],
        },
      ],
    },
  };
  if (includeRegistration) {
    entry.pageUrl = key;
    entry.pageurl = key;
    entry.PageUrl = key;
  }
  return entry;
}

function approvalDef({ invalidPage = false, noTask = false } = {}) {
  const startId = "start";
  const taskId = "task";
  const approveFlowId = "flow-approve";
  const rejectFlowId = "flow-reject";
  const endId = "end";
  const rejectEndId = "reject";
  const requestPage = page({
    id: REQUEST_PAGE_ID,
    key: invalidPage ? "" : "NORTHPEAK_RESOURCE_APPROVAL_1",
    type: 1,
    pagetype: invalidPage ? 0 : 1,
    formdefPagetype: invalidPage ? 2 : 1,
    includeRegistration: !invalidPage,
  });
  const taskPage = page({
    id: TASK_PAGE_ID,
    key: "NORTHPEAK_RESOURCE_APPROVAL_2",
    type: 2,
    pagetype: 1,
    formdefPagetype: 2,
  });
  const shapes = noTask
    ? [
        { id: startId, resourceid: startId, stencil: { id: "StartNoneEvent" }, properties: { name: "Start", taskurl: invalidPage ? "missing" : REQUEST_PAGE_ID, taskUrl: invalidPage ? "missing" : REQUEST_PAGE_ID, TaskUrl: invalidPage ? "missing" : REQUEST_PAGE_ID }, outgoing: [{ id: approveFlowId, resourceid: approveFlowId }] },
        { id: approveFlowId, resourceid: approveFlowId, stencil: { id: "SequenceFlow" }, source: { id: startId, resourceid: startId }, target: { id: endId, resourceid: endId }, properties: { linetype: "rounded", documentation: "" }, dockers: [] },
        { id: endId, resourceid: endId, stencil: { id: "EndNoneEvent" }, incoming: [{ id: approveFlowId, resourceid: approveFlowId }], properties: { name: "End" } },
      ]
    : [
        { id: startId, resourceid: startId, stencil: { id: "StartNoneEvent" }, properties: { name: "Start", taskurl: REQUEST_PAGE_ID, taskUrl: REQUEST_PAGE_ID, TaskUrl: REQUEST_PAGE_ID }, outgoing: [{ id: "flow-start-task", resourceid: "flow-start-task" }] },
        { id: "flow-start-task", resourceid: "flow-start-task", stencil: { id: "SequenceFlow" }, source: { id: startId, resourceid: startId }, target: { id: taskId, resourceid: taskId }, properties: { linetype: "rounded", documentation: "" }, dockers: [] },
        {
          id: taskId,
          resourceid: taskId,
          stencil: { id: "MultiAssignmentTask" },
          properties: {
            name: "Review",
            pagetype: 1,
            taskurl: TASK_PAGE_ID,
            taskUrl: TASK_PAGE_ID,
            TaskUrl: TASK_PAGE_ID,
            approveway: "anyapprove",
            approvepercentage: 100,
            usertaskassignment: [{ type: "user", method: "expression", title: "Requester manager", value: "{{Requester.LineManager}}" }],
          },
          incoming: [{ id: "flow-start-task", resourceid: "flow-start-task" }],
          outgoing: [{ id: approveFlowId, resourceid: approveFlowId }, { id: rejectFlowId, resourceid: rejectFlowId }],
        },
        { id: approveFlowId, resourceid: approveFlowId, stencil: { id: "SequenceFlow" }, source: { id: taskId, resourceid: taskId }, target: { id: endId, resourceid: endId }, properties: { linetype: "rounded", documentation: "", conditioninfo: [{ label: "Approved" }] }, dockers: [] },
        { id: rejectFlowId, resourceid: rejectFlowId, stencil: { id: "SequenceFlow" }, source: { id: taskId, resourceid: taskId }, target: { id: rejectEndId, resourceid: rejectEndId }, properties: { linetype: "rounded", documentation: "", conditioninfo: [{ label: "Rejected" }] }, dockers: [] },
        { id: endId, resourceid: endId, stencil: { id: "EndNoneEvent" }, incoming: [{ id: approveFlowId, resourceid: approveFlowId }], properties: { name: "End" } },
        { id: rejectEndId, resourceid: rejectEndId, stencil: { id: "EndRejectEvent" }, incoming: [{ id: rejectFlowId, resourceid: rejectFlowId }], properties: { name: "Rejected" } },
      ];
  return {
    defkey: "NORTHPEAK_RESOURCE_APPROVAL",
    key: "NORTHPEAK_RESOURCE_APPROVAL",
    name: "Northpeak Approval Fixture",
    title: "Northpeak Approval Fixture",
    workflowType: 2,
    AppListSetID: "1000000000000000100",
    ProcModelAppID: 41,
    ProcModelListID: "0",
    ProcModelListSetID: "1000000000000000100",
    ext: {},
    lineType: "rounded",
    iconURL: "",
    flowPage: [],
    variables: { basic: [], listref: [], filter: [] },
    graphposition: { x: 0, y: 0, width: 800, height: 600 },
    graphzoom: 1,
    graphver: 2,
    pageurls: [requestPage, taskPage],
    childshapes: shapes,
  };
}

function app({ fields, def = approvalDef() }) {
  return {
    Item: {
      ListModel: {
        TenantID: 1000,
        AppID: 41,
        ListID: "1000000000000000100",
        Title: "Northpeak Guardrail Fixture",
        Description: "",
        Status: 1,
        IsItemPerm: false,
        IsVerRecord: false,
        HasComment: false,
        IconUrl: "",
        Type: 1024,
        Flags: 1,
        TableCode: "flowcraft",
        IndexCode: "flowcraft",
        CustomType: "",
        Perm: 0,
        WorkspaceID: "workspace",
        CreatedBy: "test",
        ModifiedBy: "test",
      },
      Layouts: [],
    },
    Childs: [{
      ListModel: { TenantID: 1000, AppID: 41, ListID: "1000000000000000101", Title: "Requests", Type: 1, ListType: 1, Status: 1, Flags: 1, CustomType: "ListSite_1000000000000000100" },
      Defs: fields,
      Layouts: [],
      ListDatas: {},
    }],
    Forms: [{
      ID: "1000000000000000200",
      Name: "Northpeak Approval Fixture",
      Key: "NORTHPEAK_RESOURCE_APPROVAL",
      ListID: 0,
      WorkflowType: 2,
      Status: 1,
      Deployed: true,
      NoRule: { Prefix: "NP-{index}", StartIndex: 1, CustomLength: 4, AutoIncrement: 1 },
      DefResource: JSON.stringify(def),
    }],
    AppGroups: [],
    AppThemes: [],
    Pages: [],
    FormReports: [],
    FormNewReports: [],
    DataReports: [],
    Reports: [],
    Dashboards: [],
    ReplaceIds: {},
  };
}

function wrapper(decodedApp) {
  const resource = { Data: JSON.stringify(decodedApp), FormKeys: ["NORTHPEAK_RESOURCE_APPROVAL"], ReplaceIds: { "1000000000000000100": 0 } };
  return {
    Title: "Northpeak Guardrail Fixture",
    Description: "Sanitized regression fixture.",
    IconUrl: "fixture",
    IsListSet: true,
    Resource: `${GZIP_PREFIX}${zlib.gzipSync(Buffer.from(JSON.stringify(resource), "utf8")).toString("base64")}`,
  };
}

function writePackage(tmp, name, decodedApp) {
  const file = path.join(tmp, `${name}.yap`);
  fs.writeFileSync(file, `${JSON.stringify(wrapper(decodedApp))}\n`);
  return file;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "northpeak-guardrails-"));
try {
  const invalidFields = [
    titleField(),
    field("Decimal1", "Int", "input_number", 1),
    field("Datetime1", "Date", "datepicker", 2),
    field("DateTime1", "DateTime", "datepicker", 3),
    field("Bit1", "Boolean", "switch", 4),
  ];
  const invalidFieldReport = parseReport(runNode(["validate-yap-package.js", writePackage(tmp, "invalid-fieldtype", app({ fields: invalidFields }))]));
  assert.ok(invalidFieldReport.errors.some((error) => error.code === "YAP_DATALIST_FIELDTYPE_UNSUPPORTED_LEAKED_VALUE"));
  assert.ok(invalidFieldReport.errors.some((error) => error.code === "YAP_DATALIST_FIELDTYPE_CONTROL_MAPPING_INVALID"));

  const validFields = [
    titleField(),
    field("Decimal1", "Decimal", "input_number", 1),
    field("Datetime1", "Datetime", "datepicker", 1),
    field("Bit1", "Bit", "switch", 1),
    field("Text1", "Text", "input", 1),
  ];
  const validFieldReport = parseReport(runNode(["validate-yap-package.js", writePackage(tmp, "valid-fieldtype", app({ fields: validFields }))]));
  assert.equal(validFieldReport.errors.some((error) => /^YAP_DATALIST_FIELDTYPE_/.test(error.code)), false);

  const invalidApprovalReport = parseReport(runNode(["validate-yap-package.js", writePackage(tmp, "invalid-approval", app({ fields: validFields, def: approvalDef({ invalidPage: true, noTask: true }) }))]));
  for (const code of ["PAGEURL_KEY_MISSING", "PAGEURL_REGISTRATION_MISSING", "WORKFLOW_REQUEST_PAGEURL_PAGETYPE_INVALID", "WORKFLOW_REQUEST_FORMDEF_PAGETYPE_INVALID", "START_TASKURL_PAGE_NOT_FOUND", "APPROVAL_ASSIGNMENT_TASK_MISSING"]) {
    assert.ok(invalidApprovalReport.errors.some((error) => error.code === code), `missing ${code}`);
  }

  const validApprovalReport = parseReport(runNode(["validate-yap-package.js", writePackage(tmp, "valid-approval", app({ fields: validFields }))]));
  for (const code of ["PAGEURL_KEY_MISSING", "PAGEURL_REGISTRATION_MISSING", "WORKFLOW_REQUEST_PAGEURL_PAGETYPE_INVALID", "WORKFLOW_REQUEST_FORMDEF_PAGETYPE_INVALID", "START_TASKURL_PAGE_NOT_FOUND", "APPROVAL_ASSIGNMENT_TASK_MISSING", "TASK_USERTASKASSIGNMENT_EMPTY"]) {
    assert.equal(validApprovalReport.errors.some((error) => error.code === code), false, `valid approval should not emit ${code}`);
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log("Northpeak schema/workflow guardrail tests passed");

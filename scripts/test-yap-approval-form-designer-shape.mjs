#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const GZIP_PREFIX = "[______gizp______]";

function id(offset) {
  return String(2065001000000000n + BigInt(offset));
}

function json(value) {
  return JSON.stringify(value);
}

function outcomeCondition(outcome) {
  return {
    left: {
      exprType: "variable_ctx",
      valueType: "string",
      id: "TaskOutcome",
      ctx: "__ctx_task",
      type: "expr",
      name: "Task outcome:Outcome",
    },
    op: "s.=",
    right: {
      exprType: "constant",
      valueType: "string",
      id: outcome,
      type: "expr",
      name: `Task outcome:${outcome}`,
    },
  };
}

function listModel({ listId, title, rootId, tableCode }) {
  return {
    WorkspaceID: id(900),
    TenantID: id(901),
    AppID: 41,
    ListID: listId,
    Title: title,
    Type: 1,
    ListType: 1,
    CustomType: `ListSite_${rootId}`,
    TableCode: tableCode,
    IndexCode: tableCode,
    Flags: 1,
    Status: 1,
    Perm: 15,
    Ext1: "{}",
    Ext2: "{}",
    Ext3: "{}",
    Created: "2026-01-01T00:00:00Z",
    CreatedBy: id(902),
    Modified: "2026-01-01T00:00:00Z",
    ModifiedBy: id(902),
    LayoutView: null,
    AdvanceList: [],
    IsBreakInherit: false,
    IsItemPerm: false,
    IsDataSeparate: false,
    IsVerRecord: false,
  };
}

function field({ fieldId, listId, fieldName, displayName, index, type = "input", fieldType = "Text", system = false }) {
  return {
    FieldID: fieldId,
    ListID: listId,
    AppID: 41,
    FieldName: fieldName,
    InternalName: fieldName,
    DisplayName: displayName,
    FieldType: fieldType,
    Type: type,
    Category: 1,
    FieldIndex: index,
    Status: system ? 0 : 1,
    IsSystem: system,
    IsIndex: system,
    Rules: "{}",
  };
}

function defaultView({ layoutId, listId, titleFieldId, textFieldId }) {
  return {
    LayoutID: layoutId,
    ListID: listId,
    AppID: 41,
    Title: "All Items",
    Type: 0,
    Status: 1,
    IsDefault: true,
    Ext1: json({ Url: "default" }),
    Ext2: "{}",
    Ext3: "{}",
    LayoutInResources: [],
    LayoutView: json({
      layout: [
        { FieldID: titleFieldId, FieldName: "Title", DisplayName: "Title", Mobile: true, Order: 0, Show: true, Type: "input" },
        { FieldID: textFieldId, FieldName: "Text2", DisplayName: "Status", Mobile: true, Order: 1, Show: true, Type: "input" },
      ],
      query: [
        { FieldID: titleFieldId, FieldName: "Title", DisplayName: "Title", Type: "input" },
        { FieldID: textFieldId, FieldName: "Text2", DisplayName: "Status", Type: "input" },
      ],
      sort: [],
      rowColor: [],
      filter: [],
    }),
  };
}

function defResource({ formKey, formId, rootId, pageId, taskPageId, startId, sequenceId, taskId, approveSequenceId, rejectSequenceId, endId, rejectEndId }) {
  let controlIndex = 0;
  const controlId = (label) => `designer_${String(++controlIndex).padStart(3, "0")}_${label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
  const heading = (label) => ({
    id: controlId(label),
    type: "heading",
    label,
    attrs: {
      common: { positioning: { widthtype: [null, "2"] } },
      headc: { title: { value: label } },
    },
    children: [],
    ver: 1,
  });
  const panel = (label, children) => ({
    id: controlId(label),
    type: "container",
    label,
    attrs: {
      common: { positioning: { widthtype: [null, "2"], width: [null, 320], height: [null, "100%"] } },
      style: { overflow: [null, "scroll"], direction: [null, "column"], gap: [null, "--sp--s100"] },
    },
    children,
    ver: 1,
  });
  const shell = {
    id: controlId("multi_column_form_workspace_shell"),
    type: "container",
    label: "multi_column_form_workspace_shell",
    attrs: {
      common: { positioning: { pos: [null, "absolute"], widthtype: [null, "3"], width: [null, "100%"], height: [null, "100%"] } },
      style: { overflow: [null, "hidden"], direction: [null, "row"], gap: [null, 0], align_items: [null, "stretch"], justify_content: [null, "flex-start"] },
    },
    children: [
      panel("left_help_desk_navigation_panel", [heading("Inbox"), heading("Flagged")]),
      panel("ticket_collection_panel", [heading("Tickets"), panel("ticket_collection_scroll_region", [heading("Access request")])]),
      panel("selected_ticket_workspace_panel", [heading("Selected ticket"), panel("selected_ticket_body_scroll_region", [heading("Details")])]),
      panel("right_ticket_attributes_panel", [heading("Attributes"), panel("right_ticket_scroll_region", [heading("Priority")])]),
    ],
    ver: 1,
  };
  const formdef = (title, pagetype, children = []) => ({
    pagetype,
    name: title,
    title,
    attrs: { hideHeader: true, container: { cw: "2", padding: { "1": { top: 0, right: 0, bottom: 0, left: 0 } } } },
    children: children.length ? children : [
      { id: controlId(`${title}_form_body`), type: "container", label: "Form body", attrs: {}, children: [heading(`${title} details`)], ver: 1 },
      { id: controlId(`${title}_form_bottom`), type: "container", label: "Form bottom", attrs: {}, children: [
        { id: controlId(`${title}_workflow_panel`), type: "workflowControlPanel", attrs: {}, children: [], ver: 1 },
        { id: controlId(`${title}_workflow_history`), type: "workflowHistory", attrs: {}, children: [], ver: 1 },
      ], ver: 1 },
    ],
    exts: [],
    actions: [],
    formAction: {},
    ver: 1,
  });
  const page = ({ id, key, type, pagetype, formdefPagetype, formdefChildren }) => ({
    id,
    key,
    pageUrl: key,
    pageurl: key,
    PageUrl: key,
    type,
    pagetype,
    name: key,
    title: key,
    formdef: formdef(key, formdefPagetype, formdefChildren),
  });
  return {
    defkey: formKey,
    key: formKey,
    name: "Workspace",
    title: "Workspace",
    workflowType: 2,
    AppListSetID: rootId,
    ProcModelAppID: 41,
    ProcModelListID: "0",
    ProcModelListSetID: rootId,
    ext: {},
    lineType: "rounded",
    iconURL: "",
    graphposition: { x: 0, y: 0 },
    graphzoom: 1,
    graphver: 2,
    flowPage: [],
    variables: { basic: [], listref: [], filter: [] },
    pageurls: [
      page({
        id: pageId,
        key: `${formKey}_REQUEST`,
        type: 1,
        pagetype: 1,
        formdefPagetype: 1,
        formdefChildren: [{ id: controlId("hidden_helper_region"), type: "container", label: "hidden helper region", attrs: { common: { positioning: { widthtype: [null, "3"] } } }, children: [], ver: 1 }, shell],
      }),
      page({
        id: taskPageId,
        key: `${formKey}_TASK`,
        type: 2,
        pagetype: 1,
        formdefPagetype: 2,
      }),
    ],
    childshapes: [
      { id: startId, resourceid: startId, stencil: { id: "StartNoneEvent" }, position: { x: 100, y: 100 }, outgoing: [{ id: sequenceId, resourceid: sequenceId }], properties: { name: "Start", taskurl: pageId, taskUrl: pageId, TaskUrl: pageId } },
      { id: sequenceId, resourceid: sequenceId, stencil: { id: "SequenceFlow" }, source: { id: startId, resourceid: startId }, target: { id: taskId, resourceid: taskId }, properties: { name: "Start to review", linetype: "rounded", documentation: "" }, dockers: [] },
      {
        id: taskId,
        resourceid: taskId,
        stencil: { id: "MultiAssignmentTask" },
        position: { x: 400, y: 100 },
        incoming: [{ id: sequenceId, resourceid: sequenceId }],
        outgoing: [{ id: approveSequenceId, resourceid: approveSequenceId }, { id: rejectSequenceId, resourceid: rejectSequenceId }],
        properties: {
          name: "Review",
          pagetype: 1,
          taskurl: taskPageId,
          taskUrl: taskPageId,
          TaskUrl: taskPageId,
          approveway: "anyapprove",
          approvepercentage: 100,
          usertaskassignment: [{ type: "user", method: "direct", title: "Sanitized approver", value: "1000000000000000999", explicitlyRequested: true }],
        },
      },
      { id: approveSequenceId, resourceid: approveSequenceId, stencil: { id: "SequenceFlow" }, source: { id: taskId, resourceid: taskId }, target: { id: endId, resourceid: endId }, properties: { name: "Approved", linetype: "rounded", documentation: "", conditioninfo: [outcomeCondition("Approved")] }, dockers: [] },
      { id: rejectSequenceId, resourceid: rejectSequenceId, stencil: { id: "SequenceFlow" }, source: { id: taskId, resourceid: taskId }, target: { id: rejectEndId, resourceid: rejectEndId }, properties: { name: "Rejected", linetype: "rounded", documentation: "", conditioninfo: [outcomeCondition("Rejected")] }, dockers: [] },
      { id: endId, resourceid: endId, stencil: { id: "EndNoneEvent" }, position: { x: 700, y: 80 }, incoming: [{ id: approveSequenceId, resourceid: approveSequenceId }], properties: { name: "End" } },
      { id: rejectEndId, resourceid: rejectEndId, stencil: { id: "EndRejectEvent" }, position: { x: 700, y: 180 }, incoming: [{ id: rejectSequenceId, resourceid: rejectSequenceId }], properties: { name: "Rejected" } },
    ],
  };
}

function makeFixture() {
  const rootId = id(1);
  const dashboardId = id(2);
  const listId = id(3);
  const titleFieldId = id(4);
  const statusFieldId = id(5);
  const layoutId = id(6);
  const sampleId = id(7);
  const formId = id(8);
  const startId = "start_event_export_shape";
  const sequenceId = "sequence_flow_export_shape";
  const taskId = "assignment_task_export_shape";
  const approveSequenceId = "sequence_flow_approve_export_shape";
  const rejectSequenceId = "sequence_flow_reject_export_shape";
  const endId = "end_event_export_shape";
  const rejectEndId = "reject_event_export_shape";
  const pageId = "request_page_export_shape";
  const taskPageId = "task_page_export_shape";
  const groupId = id(9);
  const formKey = "SDP_WS_EXPORT_SHAPE";
  const child = {
    ListModel: listModel({ listId, title: "Tickets", rootId, tableCode: "flowcraft" }),
    Defs: [
      field({ fieldId: titleFieldId, listId, fieldName: "Title", displayName: "Title", index: 0, system: true }),
      field({ fieldId: statusFieldId, listId, fieldName: "Text2", displayName: "Status", index: 2 }),
    ],
    Layouts: [defaultView({ layoutId, listId, titleFieldId, textFieldId: statusFieldId })],
    ListDatas: { [sampleId]: { ListDataID: sampleId, Title: "Access request", Text2: "Open" } },
  };
  const rootLayoutView = { sortVer: 1, sort: [{ Title: "Home", Type: 103, ListID: dashboardId }, { Title: "Workspace", Type: 105, ListID: formKey }, { Title: "Tickets", Type: 1, ListID: listId }] };
  const data = {
    Item: {
      ListModel: {
        WorkspaceID: id(900),
        TenantID: id(901),
        AppID: 41,
        ListID: rootId,
        Title: "Export Shaped Fixture",
        Type: 1024,
        ListType: 1024,
        CustomType: "",
        TableCode: "flowcraft",
        IndexCode: "flowcraft",
        Flags: 1,
        Status: 1,
        Perm: 0,
        Ext1: "{}",
        Ext2: "{}",
        Ext3: "{}",
        Created: "2026-01-01T00:00:00Z",
        CreatedBy: id(902),
        Modified: "2026-01-01T00:00:00Z",
        ModifiedBy: id(902),
        LayoutView: json(rootLayoutView),
      },
      Defs: [],
      Layouts: [{ LayoutID: dashboardId, ListID: rootId, AppID: 41, Title: "Home", Type: 103, Status: 1, Ext1: "{}", Ext2: json({ src: true }), Ext3: "{}", LayoutView: null, LayoutInResources: [] }],
    },
    Childs: [child],
    Forms: [{
      ID: formId,
      AppID: 41,
      Description: "",
      Ext: "{}",
      ImgResource: "",
      IsItemPerm: false,
      Key: formKey,
      ListID: 0,
      Name: "Workspace",
      NoRule: { Prefix: "REQ-{index}", StartIndex: 1, CustomLength: 4, AutoIncrement: 1 },
      ProcModelID: formId,
      Settings: null,
      WorkflowType: 2,
      Deployed: true,
      Status: 1,
      DefResource: json(defResource({ formKey, formId, rootId, pageId, taskPageId, startId, sequenceId, taskId, approveSequenceId, rejectSequenceId, endId, rejectEndId })),
    }],
    FormReports: [],
    FormNewReports: [],
    DataReports: [],
    OtherModules: [],
    AppTags: [],
    AppMetadatas: [],
    AppComponents: [],
    AppThemes: [],
    AppGroups: [{ ID: groupId, Name: "Support Agents", Description: "" }],
    PortalInfo: null,
  };
  const replaceIds = [rootId, dashboardId, listId, titleFieldId, statusFieldId, layoutId, sampleId, formId, groupId];
  const resource = { AppID: 41, MainListType: 1024, Data: json(data), FormKeys: [formKey], ReportIds: [], ReplaceIds: replaceIds, SimplePortal: null };
  return {
    Title: "Export Shaped Fixture",
    Description: "Sanitized export-shaped generated-final YAP fixture.",
    IconUrl: JSON.stringify({ b: "#E6F0FF", i: "fa-solid fa-laptop", c: "#0065FF" }),
    IsListSet: true,
    Resource: `${GZIP_PREFIX}${zlib.gzipSync(Buffer.from(json(resource), "utf8")).toString("base64")}`,
  };
}

function writeFixture(tmp, name, fixture) {
  const file = path.join(tmp, `${name}.yap`);
  fs.writeFileSync(file, `${json(fixture)}\n`);
  return file;
}

function editFixture(fixture, mutator) {
  const resource = JSON.parse(zlib.gunzipSync(Buffer.from(fixture.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"));
  const data = JSON.parse(resource.Data);
  mutator({ resource, data });
  resource.Data = json(data);
  fixture.Resource = `${GZIP_PREFIX}${zlib.gzipSync(Buffer.from(json(resource), "utf8")).toString("base64")}`;
  return fixture;
}

function validate(file) {
  const result = spawnSync(process.execPath, ["validate-yap-package.js", file, "--mode", "generator", "--stage", "final"], { encoding: "utf8" });
  assert.ok(result.stdout.trim(), result.stderr || "validator produced no stdout");
  return JSON.parse(result.stdout);
}

function validateReport(file) {
  const result = spawnSync(process.execPath, ["scripts/validate-yap-generation-report.mjs", file], { encoding: "utf8" });
  assert.ok(result.stdout.trim(), result.stderr || "report validator produced no stdout");
  return JSON.parse(result.stdout);
}

function expectError(tmp, name, mutator, code) {
  const report = validate(writeFixture(tmp, name, editFixture(makeFixture(), mutator)));
  assert.equal(report.status, "fail", `${name} should fail`);
  assert.ok(report.errors.some((error) => error.code === code), `${name} missing ${code}; got ${report.errors.map((error) => error.code).join(", ")}`);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "yap-approval-form-designer-shape-"));
const passing = validate(writeFixture(tmp, "passing", makeFixture()));
assert.notEqual(passing.status, "fail", `passing fixture should have no hard errors: ${passing.errors.map((error) => error.code).join(", ")}`);

function mutateFormdef(data, mutator) {
  const def = JSON.parse(data.Forms[0].DefResource);
  const page = def.pageurls.find((candidate) => candidate.formdef);
  mutator(page.formdef, def);
  data.Forms[0].DefResource = json(def);
}

function firstControl(formdef, predicate = () => true) {
  const stack = [...formdef.children];
  while (stack.length) {
    const control = stack.shift();
    if (predicate(control)) return control;
    stack.unshift(...(control.children || []));
  }
  return null;
}

expectError(tmp, "missing-control-id", ({ data }) => {
  mutateFormdef(data, (formdef) => { delete firstControl(formdef).id; });
}, "YAP_FORM_CONTROL_ID_MISSING");

expectError(tmp, "duplicate-control-id", ({ data }) => {
  mutateFormdef(data, (formdef) => {
    const first = firstControl(formdef);
    const second = firstControl(formdef, (control) => control !== first && control.id);
    second.id = first.id;
  });
}, "YAP_FORM_CONTROL_ID_DUPLICATE");

expectError(tmp, "invalid-control-reference", ({ data }) => {
  mutateFormdef(data, (formdef) => { firstControl(formdef).attrs.targetControlId = "missing_designer_control"; });
}, "YAP_FORM_CONTROL_ID_REFERENCE_INVALID");

expectError(tmp, "heading-native-title-missing", ({ data }) => {
  mutateFormdef(data, (formdef) => {
    const heading = firstControl(formdef, (control) => control.type === "heading");
    delete heading.attrs.headc.title.value;
  });
}, "YAP_HEADING_NATIVE_TITLE_MISSING");

expectError(tmp, "heading-placeholder", ({ data }) => {
  mutateFormdef(data, (formdef) => {
    const heading = firstControl(formdef, (control) => control.type === "heading");
    heading.label = "Here is the title";
    heading.attrs.headc.title.value = "Here is the title";
  });
}, "YAP_HEADING_NATIVE_TITLE_PLACEHOLDER");

expectError(tmp, "heading-label-native-mismatch", ({ data }) => {
  mutateFormdef(data, (formdef) => {
    const heading = firstControl(formdef, (control) => control.type === "heading");
    heading.attrs.headc.title.value = "Different rendered title";
  });
}, "YAP_CONTROL_LABEL_NATIVE_TEXT_MISMATCH");

expectError(tmp, "unproven-control-family", ({ data }) => {
  mutateFormdef(data, (formdef) => { firstControl(formdef, (control) => control.type === "heading").type = "collection"; });
}, "YAP_FORM_DESIGNER_UNPROVEN_CONTROL");

expectError(tmp, "missing-child-listtype", ({ data }) => { delete data.Childs[0].ListModel.ListType; }, "YAP_CHILD_LISTTYPE_MISSING");
expectError(tmp, "defresource-metadata", ({ data }) => { const def = JSON.parse(data.Forms[0].DefResource); delete def.graphver; data.Forms[0].DefResource = json(def); }, "YAP_APPROVAL_DEFRESOURCE_METADATA_INCOMPLETE");
expectError(tmp, "invalid-norule", ({ data }) => { data.Forms[0].NoRule = null; }, "YAP_NORULE_INVALID");
expectError(tmp, "unpublished-form", ({ data }) => { data.Forms[0].Status = 0; }, "YAP_FORM_STATUS_NOT_PUBLISHED");
expectError(tmp, "missing-app-group-replaceids", ({ resource }) => { resource.ReplaceIds = resource.ReplaceIds.filter((id) => id !== resource.ReplaceIds[resource.ReplaceIds.length - 1]); }, "YAP_REPLACEIDS_APP_GROUP_ID_MISSING");

console.log(JSON.stringify({
  status: "pass",
  cases: [
    "designer-qualified passing fixture passes",
    "missing and duplicate designer IDs fail",
    "invalid designer ID references fail",
    "heading native title missing/placeholder/mismatch fails",
    "unproven control families fail",
    "ListType, DefResource, NoRule, publish status, and AppGroup ReplaceIds gaps fail",
  ],
}, null, 2));

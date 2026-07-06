#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const GZIP_PREFIX = "[______gizp______]";
const script = path.resolve("scripts/inspect-yap-form-workspace-generation.mjs");
let designerIdCounter = 0;

function designerId(label) {
  designerIdCounter += 1;
  return `lesson_designer_${String(designerIdCounter).padStart(3, "0")}_${String(label).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
}

function attrs({ widthtype = "2", overflow, icon, size = "--sp--s200", width = 16, height = 16, direction, gap, alignItems, justifyContent } = {}) {
  return {
    common: { positioning: { widthtype: [null, widthtype], width: [null, width], height: [null, height] } },
    icon: icon ? { icon: [null, icon], size: [null, size] } : undefined,
    style: {
      overflow: overflow ? [null, overflow] : undefined,
      direction: direction ? [null, direction] : undefined,
      gap: gap ? [null, gap] : undefined,
      align_items: alignItems ? [null, alignItems] : undefined,
      justify_content: justifyContent ? [null, justifyContent] : undefined,
    },
  };
}

function control(type, label, extraAttrs = {}, children = []) {
  return { id: designerId(label || type), type, label, attrs: { ...extraAttrs }, actions: extraAttrs.actions, children, ver: 1 };
}

function heading(label, widthtype = "2") {
  return control("heading", label, { common: { positioning: { widthtype: [null, widthtype] } }, headc: { title: { value: label } } });
}

function icon(label, iconName = "fa-regular fa-inboxes", widthtype = "2", size = "--sp--s200", width = 16) {
  return control("icon", label, attrs({ widthtype, icon: iconName, size, width, height: width }));
}

function navItem(label, iconName = "fa-regular fa-inboxes") {
  return control("container", `nav_${label}`, { ...attrs({ overflow: "visible", direction: "row", gap: "--sp--s100", alignItems: "center" }), actions: [{ type: "setVariable", var: "workspace_filter_state", value: label }] }, [
    icon(`${label} icon`, iconName),
    heading(label),
  ]);
}

function button(label, widthtype = "2") {
  return control("button", label, { common: { positioning: { widthtype: [null, widthtype] } }, actions: [{ type: "click" }] });
}

function dynamicField(label, widthtype = "2") {
  return control("dynamic-field", label, { exportProven: true, common: { positioning: { widthtype: [null, widthtype] } }, binding: "{{selected_ticket.title}}" });
}

function panel(label, width, children = []) {
  return control("container", label, {
    ...attrs({ overflow: "scroll", direction: "column", gap: "--sp--s150", alignItems: "stretch", justifyContent: "flex-start" }),
    style: { overflow: [null, "scroll"], width: [null, width], height: [null, "100%"], direction: [null, "column"], gap: [null, "--sp--s150"] },
  }, children);
}

function formdef(overrides = {}) {
  const shell = control("container", "multi_column_form_workspace_shell", {
    ...attrs({ overflow: "hidden", direction: "row", gap: 0, alignItems: "stretch", justifyContent: "flex-start" }),
    common: { positioning: { pos: [null, "absolute"], widthtype: [null, "3"], width: [null, "100%"], height: [null, "100%"] } },
    style: { overflow: [null, "hidden"], direction: [null, "row"], gap: [null, 0], align_items: [null, "stretch"], justify_content: [null, "flex-start"] },
  }, [
    panel("left_help_desk_navigation_panel", 400, [navItem("Your inbox"), navItem("Mentioned you", "fa-regular fa-at"), navItem("Flagged", "fa-regular fa-flag")]),
    panel("ticket_collection_panel", 500, [
      heading("All Tickets"),
      control("container", "ticket_collection_scroll_region", { ...attrs({ overflow: "scroll", direction: "column", gap: "--sp--s100" }) }, [
        control("container", "ticket_collection_item_container", { ...attrs({ overflow: "visible", direction: "row", gap: "--sp--s100", alignItems: "center" }), actions: [{ type: "setVariable", var: "selected_ticket_state", value: "{{item.id}}" }] }, [icon("ticket icon", "fa-regular fa-folder"), heading("Access to Project X Shared Folder")]),
      ]),
    ]),
    panel("selected_ticket_workspace_panel", "fill", [
      heading("Access to Project X Shared Folder"),
      dynamicField("Selected ticket title"),
      control("container", "selected_ticket_body_scroll_region", { ...attrs({ overflow: "scroll", direction: "column", gap: "--sp--s100" }) }, [heading("Description"), button("Add comment")]),
    ]),
    panel("right_ticket_attributes_panel", 420, [heading("Details"), dynamicField("Priority"), dynamicField("Status")]),
  ]);
  return {
    children: [control("list", "hidden helper list", { common: { positioning: { widthtype: [null, "3"] } } }), shell],
    attrs: { hideHeader: true, container: { cw: "2", padding: { "1": { top: 0, right: 0, bottom: 0, left: 0 } } } },
    pagetype: 1,
    ver: 1,
    name: "Workspace",
    title: "Workspace",
    exts: [],
    actions: [],
    formAction: {},
    ...overrides,
  };
}

function defResource(overrides = {}) {
  const startId = "start";
  const seqId = "sequence";
  const endId = "end";
  const pageId = "requester-page";
  return {
    childshapes: [
      { stencil: { id: "StartNoneEvent" }, id: startId, resourceid: startId, outgoing: [{ id: seqId, resourceid: seqId }], properties: { name: "Start", taskurl: pageId, taskUrl: pageId, TaskUrl: pageId } },
      { stencil: { id: "EndNoneEvent" }, id: endId, resourceid: endId, incoming: [{ id: seqId, resourceid: seqId }], properties: { name: "End" } },
      { stencil: { id: "SequenceFlow" }, id: seqId, resourceid: seqId, source: { id: startId, resourceid: startId }, target: { id: endId, resourceid: endId }, properties: { linetype: "rounded", documentation: "" }, dockers: [] },
    ],
    pageurls: [{ id: pageId, type: 1, pagetype: 1, formdef: formdef() }],
    variables: [{ name: "workspace_filter_state" }, { name: "selected_ticket_state" }],
    workflowType: 2,
    AppListSetID: "1000000000000000000",
    ProcModelAppID: 41,
    ProcModelListID: "0",
    ProcModelListSetID: "1000000000000000000",
    ext: {},
    lineType: "rounded",
    iconURL: "",
    flowPage: [],
    graphposition: { x: 0, y: 0 },
    graphzoom: 1,
    graphver: 2,
    defkey: "SDP-WS-TEST",
    key: "SDP-WS-TEST",
    name: "Workspace",
    title: "Workspace",
    ...overrides,
  };
}

function appFixture({ form = {}, def = {}, layoutView, childDefs = true } = {}) {
  const rootId = "1000000000000000000";
  const childId = "1000000000000000001";
  const titleFieldId = "1000000000000000002";
  const textFieldId = "1000000000000000003";
  const sampleRecordId = "1000000000000000004";
  const formId = "1000000000000000005";
  const resource = {
    FormKeys: ["SDP-WS-TEST"],
    ReplaceIds: {
      [rootId]: 0,
      [childId]: 0,
      [titleFieldId]: 0,
      [textFieldId]: 0,
      [sampleRecordId]: 0,
      [formId]: 0,
    },
    Data: JSON.stringify({
      Item: {
        ListModel: {
          Title: "Synthetic Service Desk Workspace",
          ListID: rootId,
          Type: 1024,
          LayoutView: JSON.stringify(layoutView ?? { sortVer: 1, sort: [{ Title: "Workspace", Type: 105, ListID: "SDP-WS-TEST" }] }),
        },
        Layouts: [],
      },
      Childs: childDefs ? [{
        ListModel: { Title: "Tickets", ListID: childId, Type: 1, ListType: 1 },
        Defs: [
          { FieldID: titleFieldId, FieldName: "Title", InternalName: "Title", Rules: "{}" },
          { FieldID: textFieldId, FieldName: "Text2", InternalName: "Text2", FieldIndex: 2, Rules: "{}" },
        ],
        ListDatas: {
          [sampleRecordId]: { ListDataID: sampleRecordId, Title: "Access to Project X", Text2: "T-SE-1001" },
        },
      }] : [],
      Forms: [{
        ID: formId,
        Name: "Workspace",
        Key: "SDP-WS-TEST",
        ListID: 0,
        WorkflowType: 2,
        Status: 1,
        Deployed: true,
        NoRule: { Prefix: "REQ-{index}", StartIndex: 1, CustomLength: 4, AutoIncrement: 1 },
        ProcModelID: "proc",
        DefResource: JSON.stringify(defResource(def)),
        ...form,
      }],
    }),
  };
  return {
    Title: "Synthetic Service Desk Workspace",
    IsListSet: true,
    Resource: `${GZIP_PREFIX}${zlib.gzipSync(Buffer.from(JSON.stringify(resource))).toString("base64")}`,
  };
}

function writeFixture(tmp, name, fixture) {
  const file = path.join(tmp, `${name}.yap`);
  fs.writeFileSync(file, `${JSON.stringify(fixture, null, 2)}\n`);
  return file;
}

function run(file) {
  const result = spawnSync(process.execPath, [script, file], { encoding: "utf8" });
  const output = JSON.parse(result.stdout);
  return { exitCode: result.status, output };
}

function expectError(tmp, name, mutate, code) {
  const fixture = appFixture();
  mutate(fixture);
  const result = run(writeFixture(tmp, name, fixture));
  assert.notEqual(result.exitCode, 0, `${name} should fail`);
  assert.ok(result.output.errors.some((error) => error.code === code), `${name} missing ${code}`);
}

function editApp(fixture, fn) {
  const resource = JSON.parse(zlib.gunzipSync(Buffer.from(fixture.Resource.slice(GZIP_PREFIX.length), "base64")).toString());
  const app = JSON.parse(resource.Data);
  fn(app, resource);
  resource.Data = JSON.stringify(app);
  fixture.Resource = `${GZIP_PREFIX}${zlib.gzipSync(Buffer.from(JSON.stringify(resource))).toString("base64")}`;
}

function editDef(fixture, fn) {
  editApp(fixture, (app) => {
    const def = JSON.parse(app.Forms[0].DefResource);
    fn(def, app.Forms[0]);
    app.Forms[0].DefResource = JSON.stringify(def);
  });
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "yap-form-workspace-lessons-"));
const passFile = writeFixture(tmp, "passing", appFixture());
const pass = run(passFile);
assert.equal(pass.exitCode, 0, JSON.stringify(pass.output.errors, null, 2));
assert.equal(pass.output.errors.length, 0);
assert.ok(pass.output.warnings.some((warning) => warning.code === "YAP_NATIVE_TITLE_SCHEMA_CONFLICT"));

const branchedApprovalFixture = appFixture();
editDef(branchedApprovalFixture, (def) => {
  const pageId = "requester-page";
  def.childshapes = [
    { stencil: { id: "StartNoneEvent" }, id: "start", resourceid: "start", outgoing: [{ id: "flow-start-task", resourceid: "flow-start-task" }], properties: { name: "Start", taskurl: pageId, taskUrl: pageId, TaskUrl: pageId } },
    { stencil: { id: "SequenceFlow" }, id: "flow-start-task", resourceid: "flow-start-task", source: { id: "start", resourceid: "start" }, target: { id: "task", resourceid: "task" }, properties: { linetype: "rounded", documentation: "" }, dockers: [] },
    {
      stencil: { id: "MultiAssignmentTask" },
      id: "task",
      resourceid: "task",
      incoming: [{ id: "flow-start-task", resourceid: "flow-start-task" }],
      outgoing: [{ id: "flow-approve", resourceid: "flow-approve" }, { id: "flow-reject", resourceid: "flow-reject" }],
      properties: {
        name: "Approval Review",
        pagetype: 1,
        taskurl: pageId,
        taskUrl: pageId,
        TaskUrl: pageId,
        approveway: "anyapprove",
        usertaskassignment: [{ type: "user", method: "expression", title: "Approver", value: "{{Requester.LineManager}}" }],
      },
    },
    { stencil: { id: "SequenceFlow" }, id: "flow-approve", resourceid: "flow-approve", source: { id: "task", resourceid: "task" }, target: { id: "end", resourceid: "end" }, properties: { linetype: "rounded", documentation: "" }, dockers: [] },
    { stencil: { id: "SequenceFlow" }, id: "flow-reject", resourceid: "flow-reject", source: { id: "task", resourceid: "task" }, target: { id: "reject", resourceid: "reject" }, properties: { linetype: "rounded", documentation: "" }, dockers: [] },
    { stencil: { id: "EndNoneEvent" }, id: "end", resourceid: "end", incoming: [{ id: "flow-approve", resourceid: "flow-approve" }], properties: { name: "End" } },
    { stencil: { id: "EndRejectEvent" }, id: "reject", resourceid: "reject", incoming: [{ id: "flow-reject", resourceid: "flow-reject" }], properties: { name: "Rejected" } },
  ];
});
const branchedApproval = run(writeFixture(tmp, "branched-approval", branchedApprovalFixture));
assert.equal(branchedApproval.exitCode, 0, JSON.stringify(branchedApproval.output.errors, null, 2));
assert.equal(branchedApproval.output.errors.some((error) => error.code === "YAP_WORKFLOW_SEQUENCE_SOURCE_TARGET_MISSING"), false);
assert.ok(branchedApproval.output.warnings.some((warning) => warning.code === "YAP_WORKFLOW_HELPER_DIRECT_START_END_NOT_APPLICABLE"));

expectError(tmp, "listid-nonzero", (fixture) => editApp(fixture, (app) => { app.Forms[0].ListID = "1000000000000000001"; }), "YAP_FORM_LISTID_MATERIALIZATION_INVALID");
expectError(tmp, "missing-type105-nav", (fixture) => editApp(fixture, (app) => { app.Item.ListModel.LayoutView = JSON.stringify({ sortVer: 1, sort: [] }); }), "YAP_FORM_NAV_TYPE105_MISSING");
expectError(tmp, "form-key-mismatch", (fixture) => editApp(fixture, (app) => { app.Forms[0].Key = "OTHER"; }), "YAP_FORM_KEY_MISMATCH");
expectError(tmp, "defkey-mismatch", (fixture) => editDef(fixture, (def) => { def.defkey = "OTHER"; def.key = "OTHER"; }), "YAP_FORM_DEFKEY_MISMATCH");
expectError(tmp, "listdatas-wrapper", (fixture) => editApp(fixture, (app) => { app.Childs[0].ListDatas = { Datas: Object.values(app.Childs[0].ListDatas) }; }), "YAP_LISTDATAS_KEYED_RECORDS_MISSING");
expectError(tmp, "unknown-row-key", (fixture) => editApp(fixture, (app) => {
  const recordId = Object.keys(app.Childs[0].ListDatas)[0];
  app.Childs[0].ListDatas[recordId].Datetime8 = "2026-06-05";
}), "YAP_LISTDATA_FIELD_UNKNOWN");
expectError(tmp, "rules-object", (fixture) => editApp(fixture, (app) => { app.Childs[0].Defs[1].Rules = {}; }), "YAP_FIELD_RULES_NOT_STRING");
expectError(tmp, "service-desk-field-numbering-drift", (fixture) => editApp(fixture, (app) => { app.Childs[0].Defs[1].FieldName = "Text1"; app.Childs[0].Defs[1].InternalName = "Text1"; }), "YAP_SERVICE_DESK_FIELD_NUMBERING_DRIFT");
expectError(tmp, "controls-only", (fixture) => editDef(fixture, (def) => { def.pageurls[0].formdef.controls = def.pageurls[0].formdef.children; delete def.pageurls[0].formdef.children; }), "YAP_FORMDEF_CONTROLS_UNSUPPORTED");
expectError(tmp, "missing-children", (fixture) => editDef(fixture, (def) => { def.pageurls[0].formdef.children = []; }), "YAP_FORMDEF_CHILDREN_MISSING");
expectError(tmp, "capital-control-type", (fixture) => editDef(fixture, (def) => { def.pageurls[0].formdef.children[1].type = "Container"; }), "YAP_FORM_CONTROL_EXPORT_SHAPE_INVALID");
expectError(tmp, "unproven-designer-control", (fixture) => editDef(fixture, (def) => { delete def.pageurls[0].formdef.children[1].children[2].children[1].attrs.exportProven; }), "YAP_FORM_DESIGNER_UNPROVEN_CONTROL");
expectError(tmp, "missing-start", (fixture) => editDef(fixture, (def) => { def.childshapes = def.childshapes.filter((shape) => shape.stencil.id !== "StartNoneEvent"); }), "YAP_WORKFLOW_START_MISSING");
expectError(tmp, "missing-sequence", (fixture) => editDef(fixture, (def) => { def.childshapes = def.childshapes.filter((shape) => shape.stencil.id !== "SequenceFlow"); }), "YAP_WORKFLOW_SEQUENCE_MISSING");
expectError(tmp, "missing-end", (fixture) => editDef(fixture, (def) => { def.childshapes = def.childshapes.filter((shape) => shape.stencil.id !== "EndNoneEvent"); }), "YAP_WORKFLOW_END_MISSING");
expectError(tmp, "end-only", (fixture) => editDef(fixture, (def) => { def.childshapes = def.childshapes.filter((shape) => shape.stencil.id === "EndNoneEvent"); }), "YAP_WORKFLOW_START_MISSING");
expectError(tmp, "missing-task-url", (fixture) => editDef(fixture, (def) => { const start = def.childshapes.find((shape) => shape.stencil.id === "StartNoneEvent"); delete start.properties.taskurl; delete start.properties.taskUrl; delete start.properties.TaskUrl; }), "YAP_WORKFLOW_START_TASKURL_MISSING");
expectError(tmp, "header-visible", (fixture) => editDef(fixture, (def) => { def.pageurls[0].formdef.attrs.hideHeader = false; }), "YAP_FORM_PAGE_HEADER_NOT_HIDDEN");
expectError(tmp, "width-not-full", (fixture) => editDef(fixture, (def) => { def.pageurls[0].formdef.attrs.container.cw = "1"; }), "YAP_FORM_PAGE_WIDTH_NOT_FULL");
expectError(tmp, "padding-nonzero", (fixture) => editDef(fixture, (def) => { def.pageurls[0].formdef.attrs.container.padding["1"].left = 24; }), "YAP_FORM_PAGE_PADDING_NOT_ZERO");
expectError(tmp, "icon-not-inline", (fixture) => editDef(fixture, (def) => { def.pageurls[0].formdef.children[1].children[0].children[0].children[0].attrs.common.positioning.widthtype[1] = "3"; }), "YAP_ICON_WIDTH_NOT_INLINE");
expectError(tmp, "text-not-inline", (fixture) => editDef(fixture, (def) => { def.pageurls[0].formdef.children[1].children[0].children[0].children[1].attrs.common.positioning.widthtype[1] = "3"; }), "YAP_TEXT_WIDTH_NOT_INLINE");
expectError(tmp, "button-not-inline", (fixture) => editDef(fixture, (def) => { def.pageurls[0].formdef.children[1].children[2].children[2].children[1].attrs.common.positioning.widthtype[1] = "3"; }), "YAP_BUTTON_WIDTH_NOT_INLINE");
expectError(tmp, "dynamic-field-not-inline", (fixture) => editDef(fixture, (def) => { def.pageurls[0].formdef.children[1].children[2].children[1].attrs.common.positioning.widthtype[1] = "3"; }), "YAP_DYNAMIC_FIELD_WIDTH_NOT_INLINE");
expectError(tmp, "generic-icon", (fixture) => editDef(fixture, (def) => { def.pageurls[0].formdef.children[1].children[0].children[0].children[0].attrs.icon.icon[1] = "generic"; }), "YAP_ICON_CONTEXT_GENERIC");
expectError(tmp, "large-icon", (fixture) => editDef(fixture, (def) => { def.pageurls[0].formdef.children[1].children[0].children[0].children[0].attrs.common.positioning.width[1] = 48; }), "YAP_ICON_SIZE_LAYOUT_RISK");
expectError(tmp, "shell-overflow-default", (fixture) => editDef(fixture, (def) => { def.pageurls[0].formdef.children[1].attrs.style.overflow[1] = "default"; }), "YAP_WORKSPACE_SHELL_OVERFLOW_INVALID");
expectError(tmp, "column-overflow-default", (fixture) => editDef(fixture, (def) => { def.pageurls[0].formdef.children[1].children[0].attrs.style.overflow[1] = "default"; }), "YAP_WORKSPACE_COLUMN_SCROLL_MISSING");

console.log(JSON.stringify({
  status: "pass",
  cases: [
    "passing YAP form workspace fixture has zero YAP_* errors",
    "native Title schema conflict is warning only",
    "materialization failures are detected",
    "sample ListDatas and field-numbering import failures are detected",
    "designer-readable form tree failures are detected",
    "designer-load risky generated controls are detected",
    "minimal Start to SequenceFlow to End workflow failures are detected",
    "workspace page settings failures are detected",
    "Icon/Text/Button/Dynamic field inline-width failures are detected",
    "icon sizing/context failures are detected",
    "workspace shell and column overflow failures are detected",
  ],
}, null, 2));

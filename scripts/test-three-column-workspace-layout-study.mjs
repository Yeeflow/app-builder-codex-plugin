#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";

function control(type, label, children = [], attrs = {}) {
  return { id: `${label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_id`, type, label, attrs, children };
}

function heading(text) {
  return control("heading", text, [], { headc: { title: { value: text } } });
}

function panel(name, bodyText, bottomText) {
  return control("container", name, [
    control("container", `${name} header`, [control("icon", `${name} icon`), heading(name)]),
    control("container", `${name} body`, [heading(bodyText)]),
    control("container", `${name} bottom`, [heading(bottomText)]),
  ]);
}

function workspacePage(title, pagetype = undefined) {
  return {
    children: [
      control("container", "three column workspace", [
        panel("Left ticket queue context", "Open ticket queues by priority", "Bottom queue notes"),
        panel("Main work ticket list", "Ticket list work area status owner", "Bottom work activity"),
        panel("Right detail information action panel", "Selected ticket detail SLA notes actions", "Bottom detail history"),
      ], { style: { gap: [null, "--sp--s100"] } }),
    ],
    attrs: { container: { padding: [null, { top: "--sp--s075", right: "--sp--s075", bottom: "--sp--s075", left: "--sp--s075" }] } },
    title,
    ver: 2,
    filterVars: [],
    tempVars: [],
    exts: [],
    ...(pagetype === undefined ? {} : { pagetype }),
  };
}

function approvalDef(pageurl) {
  return {
    childshapes: [],
    pageurls: [pageurl],
    variables: { basic: [], listref: [], filter: [] },
    flowPage: [],
    graphver: 1,
  };
}

function makeYap() {
  const data = {
    Item: { ListModel: { Title: "Synthetic Workspace App", Type: 1024 }, Layouts: [] },
    Childs: [],
    Forms: [{
      Name: "Workspace Approval",
      Key: "SYN-WA",
      Deployed: true,
      DefResource: JSON.stringify(approvalDef({
        id: "submit-page",
        type: 1,
        name: "",
        title: "Workspace Approval",
        pagetype: 1,
        formdef: workspacePage("Workspace Approval", 1),
      })),
    }],
    FormReports: [],
    FormNewReports: [],
    DataReports: [],
    PortalInfo: null,
  };
  const decoded = {
    MainListType: 1024,
    AppID: 41,
    ReplaceIds: [],
    ReportIds: [],
    FormKeys: ["SYN-WA"],
    Data: JSON.stringify(data),
    SimplePortal: null,
  };
  return {
    Title: "Synthetic Workspace App",
    Description: "",
    IconUrl: "",
    IsListSet: true,
    Resource: GZIP_PREFIX + zlib.gzipSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64"),
  };
}

function encodeDefResource(def) {
  return Buffer.concat([
    Buffer.from("::brotli::", "utf8"),
    zlib.brotliCompressSync(Buffer.from(JSON.stringify(def), "utf8")),
  ]).toString("base64");
}

function makeYapk(validTaskPage = true) {
  const taskPage = {
    id: "task-page",
    type: 2,
    name: "",
    title: "Workspace Task",
    pagetype: validTaskPage ? 1 : 2,
    formdef: workspacePage("Workspace Task", 2),
  };
  const appPackage = {
    ListSet: { Title: "Synthetic Workspace App", ListID: "1001", Type: 1024, Flags: 1, LayoutView: "{}" },
    Pages: [{
      ListID: "1001",
      LayoutID: "2001",
      Type: 103,
      Title: "Service Desk Inbox",
      LayoutView: null,
      Ext1: "",
      Ext2: "{\"src\":true}",
      Ext3: "",
      IsDefault: true,
      IsItemPerm: false,
      Perms: [],
      LayoutInResources: [{ ID: "2001", RefId: "2001", Resource: JSON.stringify(workspacePage("Service Desk Inbox")) }],
    }],
    Forms: [{
      Category: 0,
      Name: "Workspace Approval",
      Key: "SYN-WA",
      IsItemPerm: false,
      AppID: 41,
      ListID: 0,
      ProcModelID: "3001",
      Description: "",
      Ext: "",
      DefResourceID: "3002",
      DefResource: encodeDefResource(approvalDef(taskPage)),
      Status: 1,
      DeployedDefID: "3002",
      WorkflowType: 0,
      Settings: null,
      Deployed: true,
      NoRule: null,
      Perms: [],
    }],
    FormReports: [],
    FormNewReports: [],
    DataReports: [],
    Groups: [],
    Tags: [],
    Metadatas: [],
    Agents: [],
    Connections: [],
    Knowledges: [],
    Themes: [],
    Components: [],
    PortalInfo: null,
    Childs: [{
      List: { Title: "Tickets", ListID: "4001", Type: 1, Flags: 1, LayoutView: null },
      Fields: [{ FieldName: "Title", InternalName: "Title", DisplayName: "Title", FieldType: "Text", Type: "input", FieldIndex: 0 }],
      Layouts: [],
      RemindRules: [],
      PublicForms: [],
      FlowMappings: [],
    }],
  };
  return {
    PackageId: "synthetic-package",
    TenantID: "0",
    AppID: 41,
    ListID: "1001",
    Title: "Synthetic Workspace App",
    Description: "",
    IconUrl: "",
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(appPackage), "utf8")).toString("base64"),
    Notes: "synthetic fixture only",
    Author: "test",
    Date: "2026-06-03T00:00:00Z",
    Version: "test",
    Sign: "synthetic-sign",
  };
}

function decodeYap(wrapper) {
  const decoded = JSON.parse(zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"));
  decoded.Data = JSON.parse(decoded.Data);
  return decoded;
}

function decodeYapk(wrapper) {
  return JSON.parse(zlib.brotliDecompressSync(Buffer.from(wrapper.Resource, "base64")).toString("utf8"));
}

function decodeDefResource(raw) {
  const bytes = Buffer.from(raw, "base64");
  const prefix = Buffer.from("::brotli::", "utf8");
  assert.equal(bytes.subarray(0, prefix.length).equals(prefix), true);
  return JSON.parse(zlib.brotliDecompressSync(bytes.subarray(prefix.length)).toString("utf8"));
}

function assertThreeColumn(page) {
  assert.equal(page.children.length, 1);
  const panels = page.children[0].children;
  assert.equal(panels.length, 3);
  assert.match(JSON.stringify(panels[0]), /Left ticket queue context/);
  assert.match(JSON.stringify(panels[1]), /Main work ticket list/);
  assert.match(JSON.stringify(panels[2]), /Right detail information action panel/);
  assert.equal(panels.every((panelItem) => panelItem.children.length === 3), true);
}

function assertTaskPageRule(def) {
  const task = def.pageurls.find((pageurl) => pageurl.type === 2);
  assert.ok(task, "task page is present");
  assert.equal(task.pagetype, 1, "outer task pageurl pagetype remains host page type 1");
  assert.equal(task.formdef.pagetype, 2, "embedded task formdef pagetype is task form type 2");
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "three-column-workspace-study-"));
try {
  const yap = makeYap();
  const yapDecoded = decodeYap(yap);
  assert.equal(yapDecoded.SimplePortal, null);
  assert.equal(Array.isArray(yapDecoded.Data.Childs), true);
  assert.equal(yapDecoded.Data.Forms.length, 1);
  assert.equal(yapDecoded.Data.FormNewReports.length, 0);
  assertThreeColumn(JSON.parse(yapDecoded.Data.Forms[0].DefResource).pageurls[0].formdef);

  const yapk = makeYapk(true);
  const yapkFile = path.join(tempDir, "synthetic-workspace.yapk");
  fs.writeFileSync(yapkFile, `${JSON.stringify(yapk)}\n`);
  const app = decodeYapk(yapk);
  assert.equal(app.PortalInfo, null);
  assert.equal(app.Pages.length, 1);
  assert.equal(app.Forms.length, 1);
  assert.equal(app.FormNewReports.length, 0);
  assert.equal(app.Childs[0].Fields.length, 1);
  assertThreeColumn(JSON.parse(app.Pages[0].LayoutInResources[0].Resource));
  assertTaskPageRule(decodeDefResource(app.Forms[0].DefResource));

  const invalid = decodeYapk(makeYapk(false));
  assert.throws(() => assertTaskPageRule(decodeDefResource(invalid.Forms[0].DefResource)), /pagetype remains host page type 1/);

  console.log(JSON.stringify({
    status: "pass",
    cases: [
      "synthetic YAP decodes serialized Data and approval form workspace layout",
      "synthetic YAPK decodes AppPackageInfo with Pages, Forms, FormNewReports, PortalInfo, Childs[].Fields",
      "workflow task page URL pagetype guard rejects invalid outer pagetype",
    ],
  }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

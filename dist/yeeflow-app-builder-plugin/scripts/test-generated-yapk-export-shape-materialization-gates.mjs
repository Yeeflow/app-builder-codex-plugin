#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const APP_ID = "2068704921732997123";
const LIST_ID = "2068704921732997130";
const FORM_KEY = "2068704921732997124";
const DASHBOARD_ID = "2068704921732997204";
const SUMMARY_ID = "43c38762-5133-430f-af09-faeec1be3bc0";
const TENANT_ID = "1900000000000101";

function defResource({ positions = true, assignee = true } = {}) {
  const pageRequest = "page-request";
  const pageTask = "page-task";
  const def = {
    key: FORM_KEY,
    defkey: FORM_KEY,
    title: "Asset Loan Request",
    workflowType: 2,
    AppListSetID: APP_ID,
    ProcModelAppID: "41",
    ProcModelListID: FORM_KEY,
    ProcModelListSetID: APP_ID,
    variables: [{ id: "var-title", name: "Title", type: "Text" }],
    graphposition: { x: 0, y: 0 },
    graphzoom: 1,
    graphver: "2",
    pageurls: [
      {
        id: pageRequest,
        key: pageRequest,
        pageUrl: pageRequest,
        type: "request",
        pagetype: 1,
        title: "Request submission",
        formdef: { id: pageRequest, ver: 2, children: [{ id: "ctrl-title", type: "heading", attrs: { headc: { title: { value: "Asset Loan Request" } } } }] },
      },
      {
        id: pageTask,
        key: pageTask,
        pageUrl: pageTask,
        type: "task",
        pagetype: 2,
        title: "Coordinator review",
        formdef: { id: pageTask, ver: 2, children: [{ id: "ctrl-decision", type: "heading", attrs: { headc: { title: { value: "Coordinator Review" } } } }] },
      },
    ],
    childshapes: [
      shape("start", "StartNoneEvent", { outgoing: [{ resourceid: "flow-start-task" }], positions }),
      shape("task", "MultiAssignmentTask", {
        incoming: [{ resourceid: "flow-start-task" }],
        outgoing: [{ resourceid: "flow-task-approved" }, { resourceid: "flow-task-rejected" }],
        taskurl: pageTask,
        positions,
        properties: assignee ? {
          approveway: "anyapprove",
          usertaskassignment: [{ type: "user", method: "direct", title: "Sanitized approver", value: "1000000000000000999" }],
        } : { approveway: "anyapprove" },
      }),
      shape("end-approved", "EndNoneEvent", { incoming: [{ resourceid: "flow-task-approved" }], positions }),
      shape("end-rejected", "EndRejectEvent", { incoming: [{ resourceid: "flow-task-rejected" }], positions }),
      flow("flow-start-task", "start", "task", positions),
      flow("flow-task-approved", "task", "end-approved", positions, "Approved"),
      flow("flow-task-rejected", "task", "end-rejected", positions, "Rejected"),
    ],
  };
  return Buffer.concat([
    Buffer.from("::brotli::", "utf8"),
    zlib.brotliCompressSync(Buffer.from(JSON.stringify(def), "utf8")),
  ]).toString("base64");
}

function shape(id, stencil, { incoming = [], outgoing = [], taskurl, positions = true, properties = {} } = {}) {
  return {
    id,
    resourceid: id,
    stencil: { id: stencil },
    incoming,
    outgoing,
    properties: { ...(taskurl ? { taskurl, taskUrl: taskurl, TaskUrl: taskurl } : {}), ...properties },
    ...(positions ? { bounds: { upperLeft: { x: 10, y: 10 }, lowerRight: { x: 110, y: 60 } } } : {}),
  };
}

function flow(id, source, target, positions = true, name = "") {
  return {
    id,
    resourceid: id,
    stencil: { id: "SequenceFlow" },
    source: { resourceid: source },
    target: { resourceid: target },
    incoming: [{ resourceid: source }],
    outgoing: [{ resourceid: target }],
    properties: name ? { name, conditioninfo: [{ label: name }] } : {},
    ...(positions ? { dockers: [] } : {}),
  };
}

function field(name, extra = {}) {
  return {
    FieldID: name === "Title" ? "title-field" : `${name}-id`,
    FieldName: name,
    InternalName: name,
    DisplayName: name,
    FieldType: name.startsWith("Decimal") ? "Decimal" : "Text",
    Type: name.startsWith("Decimal") ? "input_number" : "input",
    ...extra,
  };
}

function titleField(extra = {}) {
  return field("Title", { IsSystem: true, IsIndex: true, Status: 0, FieldIndex: 0, ...extra });
}

function dashboardResource({ hiddenSummary = false, unsafeSummary = false, unsafeChart = false, textOnlyNavLabel = false, residueText = "" } = {}) {
  const children = [];
  if (residueText) {
    children.push({ type: "heading", name: "Residue Text", attrs: { headc: { title: { value: residueText } } } });
  }
  if (textOnlyNavLabel) {
    children.push({ type: "heading", attrs: { nv_label: "Loan Operations KPI" } });
  } else {
    children.push({
      type: "select-filter",
      name: "Status Filter",
      attrs: { data: { list: { ListID: LIST_ID, Title: "Loan Transactions" }, field: "Text1" } },
    });
    children.push({
      type: "collection",
      name: "Loan Work Queue",
      attrs: { data: { list: { ListID: LIST_ID, Title: "Loan Transactions" } } },
      children: [{ type: "heading", label: "Text", attrs: { headc: { title: { value: "Asset Tag" } } } }],
    });
  }
  if (hiddenSummary) {
    children.push({ type: "summary", id: SUMMARY_ID, name: "Hidden Summary Host", attrs: { common: { hide: [null, true, true, true] }, style: { display: "none" } } });
  }
  if (unsafeSummary) {
    children.push({ type: "summary", id: SUMMARY_ID, name: "Open Loans Summary", attrs: { data: { list: { ListID: LIST_ID } } } });
  }
  if (unsafeChart) {
    children.push({ type: "pie-chart", name: "Status Chart", attrs: { data: { list: { ListID: LIST_ID, Title: "Loan Transactions" } } } });
  }
  return JSON.stringify({ type: "page", children: [{ type: "container", name: "Main", children: [{ type: "container", name: "Content", children }] }] });
}

function decoded(patch = {}) {
  return {
    ListSet: { ListID: APP_ID, Title: "Office Asset Loan Management", LayoutView: JSON.stringify({ sort: [] }) },
    Pages: [{ Type: 103, LayoutID: DASHBOARD_ID, Title: "Asset Loan Operations Dashboard", LayoutInResources: [{ ID: DASHBOARD_ID, RefId: DASHBOARD_ID, Resource: dashboardResource(patch.dashboard || {}) }] }],
    Childs: [{
      List: { ListID: LIST_ID, Title: "Loan Transactions" },
      Fields: [titleField(patch.titleField || {}), field("Text1"), field("Decimal1")],
      Layouts: [],
    }],
    Forms: [{ Key: FORM_KEY, Name: "Asset Loan Request", WorkflowType: 2, Deployed: true, DefResourceID: "2068704921732997140", DeployedDefID: "2068704921732997141", DefResource: defResource(patch.approval || {}) }],
    FormNewReports: [{ ID: "2068704921732997150", Title: "Asset Loan Request Report", DefKey: FORM_KEY, Settings: { Fields: [{ FieldName: "Title" }] } }],
    DataReports: [{ ID: "2068704921732997160", Title: "Asset Utilization Report", Settings: { Fields: [{ FieldName: "Title" }] } }],
    PortalInfo: null,
    ...patch.decoded,
  };
}

function wrapper(data) {
  return {
    PackageId: "office-asset-test",
    TenantID: TENANT_ID,
    AppID: 41,
    ListID: data.ListSet.ListID,
    Title: "Office Asset Loan Management",
    Description: "",
    IconUrl: JSON.stringify({ b: "#E6F0FF", i: "fa-solid fa-laptop", c: "#0065FF" }),
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(data), "utf8")).toString("base64"),
    Notes: "",
    Author: "test",
    Date: "2026-06-21T00:00:00Z",
    Version: "0.0.0-test",
    Sign: Buffer.alloc(32, 1).toString("base64"),
  };
}

function writePackage(dir, name, data) {
  const file = path.join(dir, `${name}.yapk`);
  fs.writeFileSync(file, `${JSON.stringify(wrapper(data))}\n`);
  return file;
}

function writeJson(dir, name, data) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  return file;
}

function runValidator(file) {
  return spawnSync(process.execPath, ["scripts/validate-generated-yapk-export-shape.mjs", "--package", file], { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
}

function run(args) {
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
}

function expectPass(label, result) {
  assert.equal(result.status, 0, `${label} should pass.\n${result.stdout}\n${result.stderr}`);
}

function expectCode(label, result, code) {
  assert.notEqual(result.status, 0, `${label} should fail.`);
  assert.match(`${result.stdout}\n${result.stderr}`, new RegExp(code), `${label} did not report ${code}.\n${result.stdout}\n${result.stderr}`);
}

function idManifest(data) {
  const allocations = [
    { path: "decoded.ListSet.ListID", id: APP_ID, purpose: "root app", source: "api-generated" },
    { path: "decoded.Pages[0].LayoutID", id: DASHBOARD_ID, purpose: "dashboard", source: "api-generated" },
    { path: "decoded.Childs[0].List.ListID", id: LIST_ID, purpose: "loan list", source: "api-generated" },
    { path: "decoded.Forms[0].Key", id: FORM_KEY, purpose: "approval form", source: "api-generated" },
    { path: "decoded.Forms[0].DefResourceID", id: data.Forms[0].DefResourceID, purpose: "approval def resource", source: "api-generated" },
    { path: "decoded.Forms[0].DeployedDefID", id: data.Forms[0].DeployedDefID, purpose: "deployed def", source: "api-generated" },
    { path: "decoded.FormNewReports[0].ID", id: data.FormNewReports[0].ID, purpose: "form report", source: "api-generated" },
    { path: "decoded.DataReports[0].ID", id: data.DataReports[0].ID, purpose: "data report", source: "api-generated" },
  ];
  return { sourceMarker: "api-generated", generatorProvenance: { generator: "test" }, allocations, pathToPurpose: Object.fromEntries(allocations.map((item) => [item.path, item])), nonApiIds: [] };
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "generated-yapk-export-shape-"));
const cases = [];

try {
  expectPass("export-style approval DefResource passes", runValidator(writePackage(tempDir, "valid", decoded())));
  cases.push({ case: "pass: export-style approval DefResource and visual-safe dashboard", status: "pass" });

  expectCode("minimal approval DefResource fails", runValidator(writePackage(tempDir, "minimal-defresource", decoded({ decoded: { Forms: [{ Key: FORM_KEY, Name: "Asset Loan Request", DefResource: Buffer.from("{}").toString("base64") }] } }))), "APPROVAL_DEFRESOURCE_PREFIX_MISSING");
  cases.push({ case: "fail: minimal approval DefResource", status: "pass" });

  expectCode("approval DefResource without graph positions fails", runValidator(writePackage(tempDir, "no-positions", decoded({ approval: { positions: false } }))), "APPROVAL_WORKFLOW_GRAPH_POSITION_MISSING");
  cases.push({ case: "fail: approval DefResource without graph positions", status: "pass" });

  expectCode("approval DefResource without task assignee fails", runValidator(writePackage(tempDir, "no-assignee", decoded({ approval: { assignee: false } }))), "APPROVAL_TASK_ASSIGNEE_METADATA_MISSING");
  cases.push({ case: "fail: approval DefResource without task assignee", status: "pass" });

  expectCode("hidden Summary host does not count as visible KPI content", runValidator(writePackage(tempDir, "hidden-summary-only", decoded({ dashboard: { hiddenSummary: true, textOnlyNavLabel: true } }))), "DASHBOARD_VISIBLE_BUSINESS_CONTENT_MISSING|DASHBOARD_BOUND_BUSINESS_CONTROL_MISSING|DASHBOARD_TEXT_CONTROL_CONTENT_MISSING");
  cases.push({ case: "fail: hidden Summary host not visible content proof", status: "pass" });

  expectCode("Summary without complete model config fails", runValidator(writePackage(tempDir, "unsafe-summary", decoded({ dashboard: { unsafeSummary: true } }))), "DASHBOARD_SUMMARY_RUNTIME_MODEL_INCOMPLETE");
  expectCode("Chart without complete model config fails", runValidator(writePackage(tempDir, "unsafe-chart", decoded({ dashboard: { unsafeChart: true } }))), "DASHBOARD_CHART_RUNTIME_MODEL_INCOMPLETE");
  cases.push({ case: "fail: Summary/chart without complete model config", status: "pass" });

  expectCode("generic visible control label residue fails", runValidator(writePackage(tempDir, "generic-grid-residue", decoded({ dashboard: { residueText: "Grid" } }))), "DASHBOARD_VISIBLE_CONTROL_LABEL_RESIDUE");
  expectCode("source template business text residue fails", runValidator(writePackage(tempDir, "survey-source-residue", decoded({ dashboard: { residueText: "Active Survey Programs" } }))), "DASHBOARD_SOURCE_TEMPLATE_TEXT_RESIDUE");
  cases.push({ case: "fail: visible generic/source-template dashboard residue", status: "pass" });

  expectPass("visual-safe table/filter/collection dashboard passes", runValidator(writePackage(tempDir, "visual-safe", decoded())));
  cases.push({ case: "pass: visible filter/collection without unsafe Summary", status: "pass" });

  expectCode("FormNewReports placeholder fails", runValidator(writePackage(tempDir, "form-report-placeholder", decoded({ decoded: { FormNewReports: [{ Title: "Report", Count: 0 }] } }))), "FORMNEWREPORT_PLACEHOLDER_FORBIDDEN|FORMNEWREPORT_SETTINGS_MISSING");
  expectCode("DataReports placeholder fails", runValidator(writePackage(tempDir, "data-report-placeholder", decoded({ decoded: { DataReports: [{ Title: "Data Report", Count: 0 }] } }))), "DATAREPORT_PLACEHOLDER_FORBIDDEN|DATAREPORT_SETTINGS_MISSING");
  cases.push({ case: "fail: DataReports/FormNewReports count-only placeholders", status: "pass" });

  expectCode("Native Title without IsIndex true fails", runValidator(writePackage(tempDir, "title-no-isindex", decoded({ titleField: { IsIndex: false } }))), "NATIVE_TITLE_ISINDEX_MISSING");
  cases.push({ case: "fail: native Title without IsIndex:true", status: "pass" });

  expectCode("nav_label/nv_label metadata does not satisfy Text control content", runValidator(writePackage(tempDir, "text-nav-label-only", decoded({ dashboard: { textOnlyNavLabel: true } }))), "DASHBOARD_TEXT_CONTROL_CONTENT_MISSING");
  cases.push({ case: "fail: nav_label/nv_label metadata is not rendered text proof", status: "pass" });

  const tenantDecoded = decoded();
  const tenantPackage = writePackage(tempDir, "tenant-id-valid", tenantDecoded);
  const tenantManifest = writeJson(tempDir, "tenant-id-provenance.json", idManifest(tenantDecoded));
  expectPass("TenantID excluded from content ID provenance", run(["scripts/validate-yapk-id-provenance.mjs", "--package", tenantPackage, "--manifest", tenantManifest]));
  cases.push({ case: "pass: TenantID excluded from content ID provenance", status: "pass" });

  const mismatchReport = writeJson(tempDir, "runtime-mismatch.json", {
    canonicalApplication: { listSetId: APP_ID, url: `https://codex.yeeflow.com/#/list-set/41/${APP_ID}` },
    installApiReturn: { id: "operation-1", listSetId: "2068705803182682113" },
    runtimeUrl: "https://codex.yeeflow.com/#/list-set/41/2068705803182682113",
  });
  expectCode("runtime URL mismatch is reported separately", run(["scripts/validate-dashboard-generation-hard-gates.mjs", "--package", tenantPackage, "--report", mismatchReport]), "DASH_INSTALL_API_LISTSETID_MISMATCH|DASH_CANONICAL_APP_URL_LISTSETID_MISMATCH");
  cases.push({ case: "fail: install API ListSetID/runtime URL mismatch reported separately", status: "pass" });

  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

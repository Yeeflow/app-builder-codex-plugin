#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const BASE = 2100000000000000000n;

function id(offset) {
  return String(BASE + BigInt(offset));
}

function clone(value) {
  return structuredClone(value);
}

function layoutView(extraLayout = [], extraQuery = []) {
  return JSON.stringify({
    layout: [
      { FieldID: id(11), FieldName: "Title", DisplayName: "Title", Order: 0, Mobile: true, Show: true },
      { FieldID: id(12), FieldName: "Text1", DisplayName: "Loan ID", Order: 1, Mobile: true, Show: true },
      ...extraLayout,
    ],
    query: [
      { FieldID: id(11), FieldName: "Title" },
      { FieldID: id(12), FieldName: "Text1" },
      { FieldName: "ListDataID" },
      { FieldName: "CreatedBy" },
      { FieldName: "ModifiedBy" },
      { FieldName: "Created" },
      { FieldName: "Modified" },
      ...extraQuery,
    ],
  });
}

function decodedBase() {
  return {
    PortalInfo: null,
    ListSet: { ListID: id(1), AppID: "41", Title: "Office Asset Loan Management", LayoutView: JSON.stringify({ sort: [{ Type: "classes", Title: "Workspace", list: [] }] }) },
    Pages: [{ LayoutID: id(30), Title: "Asset Dashboard", Type: 103, LayoutView: null, LayoutInResources: [{ ID: id(31), RefId: id(30), Resource: JSON.stringify({ type: "page", children: [] }) }] }],
    Childs: [{
      List: { ListID: id(10), AppID: "41", ListSetID: id(1), Title: "Loan Transactions", Type: 1, LayoutView: null, TableCode: "flowcraft", IndexCode: "flowcraft" },
      Fields: [
        { FieldID: id(11), FieldName: "Title", InternalName: "Title", DisplayName: "Title", Type: "input", FieldType: "Text", FieldIndex: 0, IsSystem: true, IsIndex: true, Status: 0 },
        { FieldID: id(12), FieldName: "Text1", InternalName: "LoanId", DisplayName: "Loan ID", Type: "input", FieldType: "Text", FieldIndex: 1, IsSystem: false, IsIndex: false, Status: 0 },
      ],
      Layouts: [{ LayoutID: id(20), Title: "Loan Transactions Default View", Type: 0, IsDefault: true, Ext1: JSON.stringify({ Url: "default" }), LayoutView: layoutView() }],
      RemindRules: [],
      PublicForms: [],
      FlowMappings: [],
    }],
    Forms: [],
    FormNewReports: [],
    DataReports: [],
    Workflows: [],
  };
}

function addReturnNotes(pkg, { query = true, queryFieldId = id(101) } = {}) {
  pkg.Childs[0].Fields.push({ FieldID: id(101), FieldName: "Text5", InternalName: "ReturnNotes", DisplayName: "Return Notes", Type: "input", FieldType: "Text", FieldIndex: 5, IsSystem: false, IsIndex: false, Status: 0 });
  pkg.Childs[0].Layouts[0].LayoutView = layoutView(
    [{ FieldID: id(101), FieldName: "Text5", DisplayName: "Return Notes", Order: 2, Mobile: true, Show: true }],
    query ? [{ FieldID: queryFieldId, FieldName: "Text5" }] : [],
  );
}

function scope(overrides = {}) {
  return {
    packageKind: "upgrade",
    upgradeType: "field-only",
    targetResourceType: "data-list-field",
    targetLists: [{ ListID: id(10), Title: "Loan Transactions" }],
    allowedChanges: ["add field Text5", "update default view layout", "update default view query"],
    disallowedChanges: ["dashboard", "approval", "workflow", "navigation", "report", "FormNewReports", "DataReports"],
    generatedContentIds: [id(101)],
    ...overrides,
  };
}

function wrapper(decoded, overrides = {}) {
  return {
    PackageId: "fa9573d3-30cf-4e70-a93a-ac7de98f05ea",
    TenantID: id(900),
    AppID: "41",
    ListID: decoded.ListSet.ListID,
    Title: decoded.ListSet.Title,
    Description: "Synthetic upgrade test",
    IconUrl: JSON.stringify({ b: "#2563EB", i: "fa-solid fa-boxes-stacked", c: "#ffffff" }),
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64"),
    Notes: "Synthetic upgrade test",
    Author: "Renger from Yeeflow",
    Date: "2026-06-22T00:00:00Z",
    Version: "1.0.2",
    Sign: Buffer.alloc(32, 3).toString("base64"),
    ...overrides,
  };
}

function approvalDef({ uuid = true, duplicateControls = false, graphPositions = true, assignee = true, routes = true } = {}) {
  const pageId = uuid ? "11111111-1111-4111-8111-111111111111" : "12345";
  const contentId = duplicateControls ? "Content" : "page1_Content";
  const def = {
    key: "approval-key",
    defkey: "approval-key",
    variables: [{ name: "Title" }],
    pageurls: [{
      id: pageId,
      type: 1,
      formdef: {
        children: [
          { id: "Main", name: "Main", type: "container", children: [{ id: contentId, name: "Content", type: "container", children: [] }] },
        ],
      },
    }],
    childshapes: [{
      resourceId: "task-1",
      stencil: { id: "MultiAssignmentTask" },
      ...(graphPositions ? { bounds: { lowerRight: { x: 1, y: 1 }, upperLeft: { x: 0, y: 0 } } } : {}),
      properties: {
        taskurl: pageId,
        workflowPanel: true,
        workflowHistory: true,
        ...(assignee ? { usertaskassignment: [{ type: "user", value: "reviewer" }] } : {}),
        ...(routes ? { outcomes: ["Approved", "Rejected"] } : {}),
      },
      outgoing: routes ? [{ resourceId: "approved", label: "Approved" }, { resourceId: "rejected", label: "Rejected" }] : [],
    }],
  };
  return Buffer.concat([
    Buffer.from("::brotli::"),
    zlib.brotliCompressSync(Buffer.from(JSON.stringify(def), "utf8")),
  ]).toString("base64");
}

function writeJson(dir, name, data) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  return file;
}

function run(script, args) {
  return spawnSync(process.execPath, [script, ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function expectPass(label, script, args) {
  const result = run(script, args);
  assert.equal(result.status, 0, `${label} should pass\n${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

function expectFail(label, script, args, code) {
  const result = run(script, args);
  assert.notEqual(result.status, 0, `${label} should fail`);
  const combined = `${result.stdout}\n${result.stderr}`;
  assert.match(combined, new RegExp(code), `${label} should report ${code}\n${combined}`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yapk-upgrade-hard-gates-"));
const cases = [];

try {
  const previous = decodedBase();
  const previousFile = writeJson(tempDir, "previous.json", previous);
  const scopeFile = writeJson(tempDir, "scope.json", scope());

  const valid = clone(previous);
  addReturnNotes(valid);
  const validFile = writeJson(tempDir, "valid.json", valid);
  expectPass("field-only upgrade with layout/query field passes scope", "scripts/validate-yapk-upgrade-scope.mjs", ["--previous-package", previousFile, "--new-package", validFile, "--scope", scopeFile]);
  cases.push("pass: field-only upgrade adds one field and updates both layout/query");

  const missingQuery = clone(previous);
  addReturnNotes(missingQuery, { query: false });
  const missingQueryYapk = writeJson(tempDir, "missing-query.yapk", wrapper(missingQuery));
  expectFail("visible field missing from query fails package validation", "validate-yapk-package.js", [missingQueryYapk], "DEFAULT_VIEW_QUERY_FIELDS_MISSING");
  cases.push("fail: visible field appears in layout but not query");

  const queryMismatch = clone(previous);
  addReturnNotes(queryMismatch, { query: true, queryFieldId: id(999) });
  expectFail("visible field query FieldID mismatch fails package validation", "validate-yapk-package.js", [writeJson(tempDir, "query-mismatch.yapk", wrapper(queryMismatch))], "DEFAULT_VIEW_QUERY_FIELD_ID_MISMATCH");
  cases.push("fail: default view layout/query FieldID mismatch");

  const withReports = clone(valid);
  withReports.FormNewReports = [{ ID: id(300), Title: "Asset Loan Request Report" }];
  withReports.DataReports = [{ ID: id(301), Title: "Loan Data Report" }];
  expectFail("field-only upgrade with reports fails", "scripts/validate-yapk-upgrade-report-scope.mjs", ["--previous-package", previousFile, "--new-package", writeJson(tempDir, "with-reports.json", withReports), "--scope", scopeFile], "UPGRADE_REPORT_OUT_OF_SCOPE");
  cases.push("fail: field-only upgrade includes existing FormNewReports/DataReports");

  const reportScope = writeJson(tempDir, "report-scope.json", scope({ allowedResourceTypes: ["report"], allowedChanges: ["update report"], disallowedChanges: ["dashboard", "approval"] }));
  const reportProof = writeJson(tempDir, "report-proof.json", { reports: [{ type: "FormNewReports", id: id(300), updateSafe: true, classification: "existing-update-safe" }, { type: "DataReports", id: id(301), updateSafe: true, classification: "existing-update-safe" }] });
  expectPass("report intentionally included with update-safe proof passes", "scripts/validate-yapk-upgrade-report-scope.mjs", ["--previous-package", previousFile, "--new-package", writeJson(tempDir, "with-reports-update-safe.json", withReports), "--scope", reportScope, "--report-proof", reportProof]);
  cases.push("pass: report intentionally included with update-safe proof");

  const previousDashboardWithReport = clone(previous);
  previousDashboardWithReport.FormNewReports = [{ ID: id(300), Title: "Asset Loan Request Approval Report", DefKey: "asset-loan-approval", Settings: { Fields: [{ FieldName: "Title" }] } }];
  const dashboardRuntimeFix = clone(previousDashboardWithReport);
  dashboardRuntimeFix.Pages[0].Title = "Asset Dashboard Runtime Fix";
  dashboardRuntimeFix.FormNewReports = [];
  const dashboardScopeFile = writeJson(tempDir, "dashboard-scope.json", scope({
    upgradeType: "dashboard-only",
    targetResourceType: "dashboard",
    targetLists: [],
    targetPages: [{ Title: "Asset Dashboard" }],
    allowedResourceTypes: ["dashboard"],
    allowedChanges: ["replace declared dashboard page"],
    disallowedChanges: ["data-list", "approval", "workflow", "navigation", "report"],
  }));
  expectPass("dashboard-only runtime fix may omit unchanged installed FormNewReports", "scripts/validate-yapk-upgrade-scope.mjs", ["--previous-package", writeJson(tempDir, "previous-dashboard-with-report.json", previousDashboardWithReport), "--new-package", writeJson(tempDir, "dashboard-runtime-fix-omits-formreports.json", dashboardRuntimeFix), "--scope", dashboardScopeFile]);
  cases.push("pass: dashboard-only runtime fix omits unchanged installed FormNewReports to avoid duplicate live creation");

  const dashboardReportMutation = clone(previousDashboardWithReport);
  dashboardReportMutation.Pages[0].Title = "Asset Dashboard Runtime Fix";
  dashboardReportMutation.FormNewReports[0].Title = "Mutated Approval Report";
  expectFail("dashboard-only upgrade mutating FormNewReports still fails", "scripts/validate-yapk-upgrade-scope.mjs", ["--previous-package", writeJson(tempDir, "previous-dashboard-with-report-mutation.json", previousDashboardWithReport), "--new-package", writeJson(tempDir, "dashboard-report-mutated.json", dashboardReportMutation), "--scope", dashboardScopeFile], "UPGRADE_DASHBOARD_ONLY_NON_DASHBOARD_RESOURCE_MUTATION|UPGRADE_OUT_OF_SCOPE_RESOURCE_MUTATION");
  cases.push("fail: dashboard-only upgrade mutates FormNewReports instead of omitting unchanged installed reports");

  const dashboardChanged = clone(valid);
  dashboardChanged.Pages[0].Title = "Changed Dashboard";
  expectFail("field-only upgrade mutating dashboard fails", "scripts/validate-yapk-upgrade-scope.mjs", ["--previous-package", previousFile, "--new-package", writeJson(tempDir, "dashboard-changed.json", dashboardChanged), "--scope", scopeFile], "UPGRADE_OUT_OF_SCOPE_RESOURCE_MUTATION");
  cases.push("fail: field-only upgrade mutates dashboards");

  const approvalChanged = clone(valid);
  approvalChanged.Forms = [{ Key: id(500), Title: "Asset Loan Request", DefResource: approvalDef() }];
  expectFail("field-only upgrade mutating approval form fails", "scripts/validate-yapk-upgrade-scope.mjs", ["--previous-package", previousFile, "--new-package", writeJson(tempDir, "approval-changed.json", approvalChanged), "--scope", scopeFile], "UPGRADE_APPROVAL_FORM_MUTATION_OUTSIDE_SCOPE");
  cases.push("fail: field-only upgrade mutates approval forms");

  const badApproval = clone(previous);
  badApproval.Forms = [{ Key: id(501), Title: "Asset Loan Request", DefResource: approvalDef({ uuid: false, graphPositions: false, assignee: false, routes: false }) }];
  const approvalScope = writeJson(tempDir, "approval-scope.json", scope({ upgradeType: "approval", targetResourceType: "approval-form", targetLists: [], allowedResourceTypes: ["approval"], allowedChanges: ["modify approval form"], disallowedChanges: ["dashboard", "report"] }));
  expectFail("bad approval DefResource fails upgrade readiness", "scripts/validate-yapk-upgrade-scope.mjs", ["--previous-package", previousFile, "--new-package", writeJson(tempDir, "bad-approval.json", badApproval), "--scope", approvalScope], "UPGRADE_APPROVAL_PAGE_ID_NOT_UUID|UPGRADE_APPROVAL_GRAPH_POSITION_MISSING|UPGRADE_APPROVAL_TASK_ASSIGNEE_MISSING|UPGRADE_APPROVAL_TASK_ROUTES_AMBIGUOUS");
  cases.push("fail: approval DefResource included with non-UUID page IDs, missing graph positions, missing assignees, or ambiguous routes");

  const apiOnly = writeJson(tempDir, "api-only.json", { packageId: "fa9573d3-30cf-4e70-a93a-ac7de98f05ea", apiStatus: 0, rows: [] });
  expectFail("api status 0 without version row fails", "scripts/inspect-yapk-upgrade-version-row.mjs", ["--evidence", apiOnly], "UPGRADE_API_ACCEPTANCE_NOT_FINAL_SUCCESS");
  cases.push("fail: upgrade API status 0 without Version Management Succeed proof");

  const failedNoLog = writeJson(tempDir, "failed-no-log.json", { packageId: "fa9573d3-30cf-4e70-a93a-ac7de98f05ea", rows: [{ PackageId: "fa9573d3-30cf-4e70-a93a-ac7de98f05ea", Status: "Failed" }] });
  expectFail("failed version row without error log fails", "scripts/inspect-yapk-upgrade-version-row.mjs", ["--evidence", failedNoLog], "UPGRADE_ERROR_LOG_MISSING");
  cases.push("fail: Version Management row Failed without captured error log");

  const succeedRuntime = writeJson(tempDir, "succeed-runtime.json", {
    packageId: "fa9573d3-30cf-4e70-a93a-ac7de98f05ea",
    rows: [{ PackageId: "fa9573d3-30cf-4e70-a93a-ac7de98f05ea", Status: "Succeed" }],
    screenshot: "validation/version-management.png",
    runtimeProof: { status: "pass", surface: "Loan Transactions", expectedLabel: "Return Notes", visibleLabels: ["Title", "Loan ID", "Return Notes"], screenshot: "validation/runtime.png" },
  });
  expectPass("succeed version row plus runtime proof passes", "scripts/inspect-yapk-upgrade-version-row.mjs", ["--evidence", succeedRuntime]);
  cases.push("pass: final Succeed row plus runtime list-field proof");

  const approvalSucceedNoDefBlob = writeJson(tempDir, "approval-succeed-no-defblob.json", {
    packageId: "fa9573d3-30cf-4e70-a93a-ac7de98f05ea",
    rows: [{ PackageId: "fa9573d3-30cf-4e70-a93a-ac7de98f05ea", Status: "Succeed" }],
    expectedApprovalWorkflow: {
      taskName: "Line manager approval",
      assigneeExpressionHash: "assignee-v2",
      approvedConditionHash: "approved-v2",
      rejectedConditionHash: "rejected-v2",
    },
    runtimeProof: { status: "pass", surface: "Approval workflow designer", screenshot: "validation/workflow.png" },
  });
  expectFail("approval workflow upgrade without live DefBlob proof fails", "scripts/inspect-yapk-upgrade-version-row.mjs", ["--evidence", approvalSucceedNoDefBlob], "UPGRADE_APPROVAL_DEF_BLOB_PROOF_MISSING");
  cases.push("fail: approval workflow Version Management Succeed without live DefBlob proof");

  const approvalSucceedRuntime = writeJson(tempDir, "approval-succeed-runtime.json", {
    packageId: "fa9573d3-30cf-4e70-a93a-ac7de98f05ea",
    rows: [{ PackageId: "fa9573d3-30cf-4e70-a93a-ac7de98f05ea", Status: "Succeed" }],
    screenshot: "validation/version-management.png",
    expectedApprovalWorkflow: {
      taskName: "Line manager approval",
      assigneeExpressionHash: "assignee-v2",
      approvedConditionHash: "approved-v2",
      rejectedConditionHash: "rejected-v2",
    },
    runtimeProof: {
      status: "pass",
      surface: "Approval workflow designer",
      designerOpened: true,
      publishSucceeded: true,
      screenshot: "validation/workflow-publish.png",
      liveDefBlobSummary: {
        taskName: "Line manager approval",
        assigneeExpressionHash: "assignee-v2",
        approvedConditionHash: "approved-v2",
        rejectedConditionHash: "rejected-v2",
      },
    },
  });
  expectPass("approval workflow Succeed plus live DefBlob proof passes", "scripts/inspect-yapk-upgrade-version-row.mjs", ["--evidence", approvalSucceedRuntime]);
  cases.push("pass: approval workflow Succeed row plus live DefBlob/publish proof");

  const previousLineage = {
    objects: [
      { semanticKey: "layout:Return Reviews:Return Review Form", objectType: "layout", path: "decoded.Childs[0].Layouts[0].LayoutID", id: id(20), idSource: "previous-version-preserved" },
    ],
  };
  const nextLineage = {
    objects: [
      { semanticKey: "layout:Return Reviews:Return Review Form", objectType: "layout", path: "decoded.Childs[0].Layouts[0].LayoutID", id: id(20), idSource: "previous-version-preserved" },
    ],
  };
  expectFail("undisambiguated layout semantic key fails", "scripts/validate-yapk-upgrade-id-stability.mjs", [
    "--previous-package", writeJson(tempDir, "previous-lineage-package.yapk", wrapper(previous)),
    "--previous-manifest", writeJson(tempDir, "previous-lineage.json", previousLineage),
    "--new-package", writeJson(tempDir, "next-lineage-package.yapk", wrapper(previous)),
    "--new-manifest", writeJson(tempDir, "next-lineage.json", nextLineage),
  ], "UPGRADE_LAYOUT_SEMANTIC_KEY_UNDISAMBIGUATED");
  cases.push("fail: duplicate/same-title layout semantic keys without type/index disambiguator");

  const applyDryRun = spawnSync(process.execPath, [
    "scripts/yeeflow-package-api-automation.mjs",
    "--operation", "upgrade-apply-yapk",
    "--package", writeJson(tempDir, "valid-upgrade.yapk", wrapper(valid)),
    "--selected-workspace-id", "workspace-user-selected-target",
    "--previous-package", writeJson(tempDir, "previous-upgrade.yapk", wrapper(previous)),
    "--previous-manifest", writeJson(tempDir, "previous-upgrade-lineage.json", { objects: [
      { semanticKey: "app:listset", objectType: "application", path: "decoded.ListSet.ListID", id: id(1), idSource: "previous-version-preserved" },
      { semanticKey: "data-list:Loan Transactions", objectType: "data-list", path: "decoded.Childs[0].List.ListID", id: id(10), idSource: "previous-version-preserved" },
      { semanticKey: "layout:Loan Transactions:Loan Transactions Default View:0:0", objectType: "layout", path: "decoded.Childs[0].Layouts[0].LayoutID", id: id(20), idSource: "previous-version-preserved" },
    ] }),
    "--new-manifest", writeJson(tempDir, "new-upgrade-lineage.json", { apiIssuedNewIds: [id(101)], objects: [
      { semanticKey: "app:listset", objectType: "application", path: "decoded.ListSet.ListID", id: id(1), idSource: "previous-version-preserved" },
      { semanticKey: "data-list:Loan Transactions", objectType: "data-list", path: "decoded.Childs[0].List.ListID", id: id(10), idSource: "previous-version-preserved" },
      { semanticKey: "layout:Loan Transactions:Loan Transactions Default View:0:0", objectType: "layout", path: "decoded.Childs[0].Layouts[0].LayoutID", id: id(20), idSource: "previous-version-preserved" },
      { semanticKey: "field:Loan Transactions:Return Notes", objectType: "field", path: "decoded.Childs[0].Fields[2].FieldID", id: id(101), status: "new", idSource: "api-issued-new" },
    ] }),
  ], { cwd: ROOT, encoding: "utf8", env: { PATH: process.env.PATH || "" } });
  assert.equal(applyDryRun.status, 0, `${applyDryRun.stdout}\n${applyDryRun.stderr}`);
  const parsedApply = JSON.parse(applyDryRun.stdout);
  assert.equal(parsedApply.result.request.UpgradeCheck, false);
  cases.push("pass: upgrade apply helper keeps apply as submitted boundary in dry-run");

  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

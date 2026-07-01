#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const BASE = 2200000000000000000n;

function id(offset) {
  return String(BASE + BigInt(offset));
}

function writeJson(dir, name, value) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
}

function run(args) {
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function expectPass(label, args) {
  const result = run(args);
  assert.equal(result.status, 0, `${label} should pass\n${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

function expectFail(label, args, code) {
  const result = run(args);
  assert.notEqual(result.status, 0, `${label} should fail`);
  assert.match(`${result.stdout}\n${result.stderr}`, new RegExp(code), `${label} should report ${code}\n${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

function dashboardResource({ unsafeSelect = false, search = false } = {}) {
  const children = [];
  if (unsafeSelect) {
    children.push({
      type: "select-filter",
      id: "loan_status_filter",
      name: "Loan Status",
      binding: "loan_status",
      attrs: { data: { field: "Text2" } },
    });
  }
  if (search) {
    children.push({
      type: "search-filter",
      id: "loan_search_filter",
      name: "Search Loans",
      binding: "loan_search",
    });
  }
  children.push({
    type: "collection",
    id: "loan_collection",
    attrs: {
      data: {
        list: { ListID: id(10), Title: "Loan Requests" },
        filter: unsafeSelect ? [{
          op: "9",
          operator: "9",
          showCus: false,
          right: [{ exprType: "variable", valueType: "string", id: "__filter_loan_status", name: "loan_status", sourceFilterId: "loan_status_filter" }],
        }] : [],
        fulltext: search ? [{
          fields: ["Title", "Text1"],
          value: [{ exprType: "variable", valueType: "string", id: "__filter_loan_search", name: "loan_search" }],
        }] : [],
        filterBindings: unsafeSelect ? [{ name: "loan_status", sourceFilterId: "loan_status_filter" }] : [],
      },
    },
  });
  return {
    type: "page",
    title: "Asset Loan Operations Dashboard",
    filterVars: unsafeSelect ? [{ id: "loan_status", name: "loan_status" }] : search ? [{ id: "loan_search", name: "loan_search" }] : [],
    children,
  };
}

function packageFromResources(resources) {
  const decoded = {
    ListSet: { ListID: id(1), AppID: "41", Title: "Office Asset Loan Management" },
    Pages: resources.map((resource, index) => ({
      LayoutID: id(100 + index),
      ListID: id(1),
      Type: 103,
      Title: resource.title || `Dashboard ${index + 1}`,
      LayoutInResources: [{ ID: id(200 + index), RefId: id(100 + index), Resource: JSON.stringify(resource) }],
    })),
    Childs: [{ List: { ListID: id(10), Title: "Loan Requests" }, Fields: [], Layouts: [] }],
    Forms: [],
    FormNewReports: [],
    DataReports: [],
  };
  return {
    ListID: id(1),
    Title: decoded.ListSet.Title,
    TenantID: id(900),
    AppID: "41",
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64"),
  };
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-filter-runtime-proof-"));
const cases = [];

try {
  const unsafeResource = writeJson(tempDir, "unsafe-select-resource.json", dashboardResource({ unsafeSelect: true }));
  expectFail("select-filter consumed by Collection In condition fails", ["scripts/validate-dashboard-select-filter-runtime-contract.mjs", "--resource", unsafeResource], "DASH_SELECT_FILTER_COLLECTION_IN_EMPTY_UNPROVEN");
  cases.push("fail: page-level select-filter consumed by Collection op/operator 9");

  const unsafePackage = writeJson(tempDir, "unsafe-select-package.yapk", packageFromResources([dashboardResource({ unsafeSelect: true })]));
  expectFail("package select-filter In condition fails", ["scripts/validate-dashboard-select-filter-runtime-contract.mjs", "--package", unsafePackage], "DASH_SELECT_FILTER_COLLECTION_IN_EMPTY_UNPROVEN");
  cases.push("fail: package-level Dashboard select-filter In condition");

  const searchResource = writeJson(tempDir, "search-resource.json", dashboardResource({ search: true }));
  expectPass("search-filter fulltext linkage passes", ["scripts/validate-dashboard-select-filter-runtime-contract.mjs", "--resource", searchResource]);
  cases.push("pass: proven search-filter/fulltext linkage is not blocked");

  const badRuntime = writeJson(tempDir, "bad-runtime.json", {
    packageId: "2070211736924803073",
    upgradeCheck: { apiStatus: 0 },
    upgradeApply: { apiStatus: 0 },
    versionManagement: { status: "Submitted" },
    scopeDiffProof: { status: "pass", unchangedResourceGroups: ["Childs"] },
    runtimeProof: { pages: [{ title: "Asset Loan Operations Dashboard", rowCount: 0, noDataVisible: true, objectObjectPlaceholderFound: false, collectionBoundToRealDataList: true }] },
  });
  expectFail("api status 0 and no data runtime proof fails", ["scripts/inspect-dashboard-upgrade-runtime-proof.mjs", "--evidence", badRuntime], "DASH_UPGRADE_API_STATUS_SUBMITTED_ONLY|DASH_RUNTIME_BUSINESS_ROWS_MISSING|DASH_RUNTIME_NO_DATA_VISIBLE");
  cases.push("fail: API submitted-only plus No data runtime proof");

  const sparseRuntime = writeJson(tempDir, "sparse-runtime.json", {
    packageId: "2070211736924803073",
    versionManagement: { status: "Succeed" },
    sparsePackage: true,
    scopeDiffProof: { status: "pass", unchangedResourceGroups: ["Childs"] },
    runtimeProof: { pages: [{ title: "Asset Loan Operations Dashboard", rowCount: 3, noDataVisible: false, objectObjectPlaceholderFound: false, collectionBoundToRealDataList: true }] },
    searchFilterProof: { status: "pass", targetRecordVisibleAfter: true, unrelatedRowsRemoved: true },
  });
  expectFail("dashboard-only sparse upgrade fails", ["scripts/inspect-dashboard-upgrade-runtime-proof.mjs", "--evidence", sparseRuntime], "DASH_FULL_UPGRADE_SPARSE_PACKAGE_FORBIDDEN|DASH_FULL_UPGRADE_NON_DASHBOARD_UNCHANGED_PROOF_MISSING");
  cases.push("fail: dashboard-only sparse upgrade package");

  const prematureExpansion = writeJson(tempDir, "premature-expansion-runtime.json", {
    packageId: "2070211736924803073",
    versionManagement: { status: "Succeed" },
    scopeDiffProof: {
      status: "pass",
      unchangedResourceGroups: ["Childs", "Forms", "FormNewReports", "DataReports", "Groups", "Tags", "Metadatas", "Agents", "Connections", "Knowledges", "Themes", "Components", "PortalInfo"],
    },
    dashboardExpansion: {
      expandedDashboardPages: ["Asset Loan Operations Dashboard", "Overdue Monitor"],
      targetDashboardProof: { status: "fail", reason: "KPI values not visible before refresh" },
    },
    runtimeProof: { pages: [{ title: "Asset Loan Operations Dashboard", rowCount: 4, noDataVisible: false, objectObjectPlaceholderFound: false, collectionBoundToRealDataList: true }] },
    searchFilterProof: { status: "pass", targetRecordVisibleAfter: true, unrelatedRowsRemoved: true },
  });
  expectFail("dashboard-only fix expanded before target delayed runtime proof fails", ["scripts/inspect-dashboard-upgrade-runtime-proof.mjs", "--evidence", prematureExpansion], "DASH_DASHBOARD_ONLY_EXPANSION_BEFORE_TARGET_RUNTIME_PROOF");
  cases.push("fail: dashboard-only fix expands before target page delayed runtime proof");

  const validRuntime = writeJson(tempDir, "valid-runtime.json", {
    packageId: "2070211736924803073",
    upgradeCheck: { apiStatus: 0 },
    upgradeApply: { apiStatus: 0 },
    versionManagement: { status: "Succeed" },
    scopeDiffProof: {
      status: "pass",
      unchangedResourceGroups: ["Childs", "Forms", "FormNewReports", "DataReports", "Groups", "Tags", "Metadatas", "Agents", "Connections", "Knowledges", "Themes", "Components", "PortalInfo"],
    },
    runtimeProof: {
      pages: [
        { title: "Asset Loan Operations Dashboard", rowCount: 4, noDataVisible: false, objectObjectPlaceholderFound: false, collectionBoundToRealDataList: true },
        { title: "Asset Availability and Utilization Dashboard", businessRowsVisible: true, noDataVisible: false, objectObjectPlaceholderFound: false, collectionBoundToRealDataList: true },
      ],
    },
    dashboardExpansion: {
      expandedDashboardPages: ["Asset Loan Operations Dashboard", "Asset Availability and Utilization Dashboard"],
      targetDashboardProof: { status: "pass", fullRuntimeProofChainPassed: true },
    },
    searchFilterProof: { status: "pass", targetRecordVisibleAfter: true, unrelatedRowsRemoved: true },
  });
  expectPass("full dashboard upgrade runtime proof passes", ["scripts/inspect-dashboard-upgrade-runtime-proof.mjs", "--evidence", validRuntime]);
  cases.push("pass: full package dashboard upgrade with Succeed row, runtime rows, and search proof");

  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

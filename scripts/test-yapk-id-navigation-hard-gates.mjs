#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const HARD_GATE_ICON = JSON.stringify({ b: "#E6F0FF", i: "fa-regular fa-calendar-check", c: "#0065FF" });

function id(offset) {
  return String(1900000000000000n + BigInt(offset));
}

function clone(value) {
  return structuredClone(value);
}

function baseDecoded() {
  const rootId = id(1);
  const dashboardId = id(2);
  const listId = id(3);
  const formKey = id(4);
  const groupId = id(5);
  return {
    ListSet: {
      ListID: rootId,
      Title: "Hard Gate Test",
      Type: 1024,
      LayoutView: JSON.stringify({
        sort: [{
          ID: groupId,
          AppID: 41,
          ListSetID: rootId,
          Type: "classes",
          Title: "Travel",
          Icon: "folder",
          list: [
            { AppID: 41, Title: "Dashboard", ListID: dashboardId, ListSetID: rootId, Type: 103, LayoutID: dashboardId },
            { AppID: 41, Title: "Request", ListID: formKey, ListSetID: rootId, Type: 105 },
            { AppID: 41, Title: "Requests", ListID: listId, ListSetID: rootId, Type: 1 },
          ],
        }],
      }),
    },
    Pages: [{ ListID: rootId, LayoutID: dashboardId, Type: 103, Title: "Dashboard", LayoutView: null, LayoutInResources: [{ ID: dashboardId, RefId: dashboardId, Resource: "{}" }] }],
    Forms: [{ Key: formKey, Title: "Travel Request", DefResourceID: id(6), DeployedDefID: id(7) }],
    Childs: [{ List: { ListID: listId, Title: "Travel Requests", Type: 1 }, Fields: [{ FieldID: id(8), FieldName: "Title" }], Layouts: [{ LayoutID: id(9), Title: "Default" }] }],
  };
}

function wrapper(decoded) {
  return {
    PackageId: "hard-gate-test",
    TenantID: id(101),
    AppID: 41,
    ListID: decoded.ListSet.ListID,
    Title: "Hard Gate Test",
    Description: "",
    IconUrl: HARD_GATE_ICON,
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64"),
    Notes: "",
    Author: "test",
    Date: "2026-06-12T00:00:00Z",
    Version: "0.0.0-test",
    Sign: Buffer.alloc(32, 1).toString("base64"),
  };
}

function writePackage(dir, name, decoded) {
  const file = path.join(dir, `${name}.yapk`);
  fs.writeFileSync(file, `${JSON.stringify(wrapper(decoded))}\n`);
  return file;
}

function manifest(decoded, overrides = {}) {
  const ids = [
    ["wrapper.ListID", decoded.ListSet.ListID, "root list set ID"],
    ["decoded.Pages[0].LayoutID", decoded.Pages[0].LayoutID, "dashboard layout ID"],
    ["decoded.Childs[0].List.ListID", decoded.Childs[0].List.ListID, "data list ID"],
    ["decoded.Forms[0].Key", decoded.Forms[0].Key, "approval form key"],
    ["decoded.Forms[0].DefResourceID", decoded.Forms[0].DefResourceID, "approval form def resource ID"],
    ["decoded.Forms[0].DeployedDefID", decoded.Forms[0].DeployedDefID, "approval form deployed def ID"],
    ["decoded.Childs[0].Fields[0].FieldID", decoded.Childs[0].Fields[0].FieldID, "field ID"],
    ["decoded.Childs[0].Layouts[0].LayoutID", decoded.Childs[0].Layouts[0].LayoutID, "list layout ID"],
    ["decoded.ListSet.LayoutView.sort[0].ID", JSON.parse(decoded.ListSet.LayoutView).sort[0].ID, "navigation group ID"],
  ];
  const allocations = ids.map(([pathValue, value, purpose]) => ({ path: pathValue, id: String(value), purpose, source: "api-generated" }));
  return {
    sourceMarker: "api-generated",
    totalRequestedIds: allocations.length,
    totalReceivedIds: allocations.length,
    allocationCount: allocations.length,
    unusedCount: 0,
    duplicateCheck: { passed: true, duplicateIds: [] },
    generatorProvenance: { generator: "synthetic-hard-gate-test", localIdFallbackAllowed: false },
    pathToPurpose: Object.fromEntries(allocations.map((allocation) => [allocation.path, { id: allocation.id, purpose: allocation.purpose, source: allocation.source }])),
    allocations,
    nonApiIds: [],
    ...overrides,
  };
}

function writeManifest(dir, name, data) {
  const file = path.join(dir, `${name}.json`);
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  return file;
}

function run(args) {
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function expectPass(label, result) {
  if (result.status !== 0) throw new Error(`${label} should pass.\n${result.stdout}\n${result.stderr}`);
}

function expectCode(label, result, code) {
  if (result.status === 0) throw new Error(`${label} should fail with ${code}.`);
  const output = `${result.stdout}\n${result.stderr}`;
  if (!output.includes(code)) throw new Error(`${label} did not report ${code}.\n${output}`);
}

function mutateNavigation(decoded, mutator) {
  const view = JSON.parse(decoded.ListSet.LayoutView);
  mutator(view.sort[0], view);
  decoded.ListSet.LayoutView = JSON.stringify(view);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yapk-id-navigation-hard-gates-"));
const cases = [];

try {
  const validDecoded = baseDecoded();
  const validPackage = writePackage(tempDir, "valid", validDecoded);
  const validManifest = writeManifest(tempDir, "valid-id-provenance-report", manifest(validDecoded));

  expectPass("valid API-ID-backed package", run(["scripts/validate-yapk-id-provenance.mjs", "--package", validPackage, "--manifest", validManifest]));
  cases.push({ case: "valid API-ID-backed package passes ID provenance validation", status: "pass" });
  expectPass("valid navigation metadata", run(["scripts/validate-yapk-navigation-runtime-metadata.mjs", "--package", validPackage, "--id-provenance", validManifest]));
  cases.push({ case: "valid navigation metadata passes", status: "pass" });

  expectCode("missing manifest", run(["scripts/validate-yapk-id-provenance.mjs", "--package", validPackage, "--manifest", path.join(tempDir, "missing.json")]), "ID_PROVENANCE_MANIFEST_MISSING");
  cases.push({ case: "missing manifest fails", status: "pass" });

  const localSequential = clone(validDecoded);
  localSequential.Childs[0].Fields[0].FieldID = "1111111000000001";
  const localSequentialPackage = writePackage(tempDir, "local-sequential", localSequential);
  expectCode("local sequential IDs", run(["scripts/validate-yapk-id-provenance.mjs", "--package", localSequentialPackage, "--manifest", validManifest]), "ID_PROVENANCE_PACKAGE_ID_NOT_IN_MANIFEST");
  cases.push({ case: "local sequential IDs fail", status: "pass" });

  const hardcoded = clone(validDecoded);
  hardcoded.Forms[0].Key = "9862114802000009";
  const hardcodedPackage = writePackage(tempDir, "hardcoded", hardcoded);
  expectCode("hardcoded IDs", run(["scripts/validate-yapk-id-provenance.mjs", "--package", hardcodedPackage, "--manifest", validManifest]), "ID_PROVENANCE_PACKAGE_ID_NOT_IN_MANIFEST");
  cases.push({ case: "hardcoded IDs fail", status: "pass" });

  const duplicateManifest = manifest(validDecoded, { allocations: [...manifest(validDecoded).allocations, { id: validDecoded.Pages[0].LayoutID, path: "decoded.Somewhere", purpose: "duplicate", source: "api-generated" }] });
  const duplicateManifestFile = writeManifest(tempDir, "duplicate", duplicateManifest);
  expectCode("duplicate manifest IDs", run(["scripts/validate-yapk-id-provenance.mjs", "--package", validPackage, "--manifest", duplicateManifestFile]), "ID_PROVENANCE_DUPLICATE_ALLOCATED_ID");
  cases.push({ case: "duplicate manifest IDs fail", status: "pass" });

  const navCases = [
    ["minimal group", "NAVIGATION_GROUP_ID_MISSING", (group) => { for (const key of ["ID", "AppID", "ListSetID", "Icon"]) delete group[key]; }],
    ["missing group ID", "NAVIGATION_GROUP_ID_MISSING", (group) => { delete group.ID; }],
    ["missing group AppID", "NAVIGATION_GROUP_APPID_MISSING", (group) => { delete group.AppID; }],
    ["missing group ListSetID", "NAVIGATION_GROUP_LISTSETID_MISSING", (group) => { delete group.ListSetID; }],
    ["missing group Icon", "NAVIGATION_GROUP_ICON_MISSING", (group) => { delete group.Icon; }],
    ["child missing AppID", "NAVIGATION_CHILD_APPID_MISSING", (group) => { delete group.list[0].AppID; }],
    ["child missing ListSetID", "NAVIGATION_CHILD_LISTSETID_MISSING", (group) => { delete group.list[0].ListSetID; }],
    ["children navigation", "NAVIGATION_GROUP_CHILDREN_FORBIDDEN", (group) => { group.children = group.list; }],
    ["Childs navigation", "NAVIGATION_GROUP_CHILDS_FORBIDDEN", (group) => { group.Childs = group.list; }],
    ["dashboard missing LayoutID", "NAVIGATION_DASHBOARD_LAYOUTID_MISSING", (group) => { delete group.list[0].LayoutID; }],
    ["approval wrong target", "NAVIGATION_APPROVAL_FORM_TARGET_INVALID", (group) => { group.list[1].ListID = id(999); }],
    ["data-list wrong target", "NAVIGATION_DATA_LIST_TARGET_INVALID", (group) => { group.list[2].ListID = id(998); }],
  ];

  for (const [label, code, mutator] of navCases) {
    const decoded = clone(validDecoded);
    mutateNavigation(decoded, mutator);
    const file = writePackage(tempDir, label.replace(/[^a-z0-9]+/gi, "-"), decoded);
    expectCode(label, run(["scripts/validate-yapk-navigation-runtime-metadata.mjs", "--package", file, "--id-provenance", validManifest]), code);
    cases.push({ case: `${label} fails`, expected: code, status: "pass" });
  }

  const navNonApi = clone(validDecoded);
  mutateNavigation(navNonApi, (group) => { group.ID = id(777); });
  const navNonApiFile = writePackage(tempDir, "nav-non-api-id", navNonApi);
  expectCode("non-API group ID", run(["scripts/validate-yapk-navigation-runtime-metadata.mjs", "--package", navNonApiFile, "--id-provenance", validManifest]), "NAVIGATION_GROUP_ID_NOT_API_ISSUED");
  cases.push({ case: "non-API navigation group ID fails", status: "pass" });

  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

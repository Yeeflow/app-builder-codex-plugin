#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");

function id(offset) {
  return String(2100000000000000n + BigInt(offset));
}

function clone(value) {
  return structuredClone(value);
}

function decodedPackage() {
  return {
    ListSet: { ListID: id(1), Title: "Stable App", LayoutView: "" },
    Childs: [{
      List: { ListID: id(10), Title: "Tasks", Type: 1 },
      Fields: [
        { FieldID: id(11), FieldName: "Title" },
        { FieldID: id(12), FieldName: "Status" },
      ],
      Layouts: [{ LayoutID: id(13), Title: "Task Detail", LayoutView: "" }],
    }],
    Pages: [{ LayoutID: id(20), Title: "Task Dashboard", Type: 103, LayoutView: "" }],
    Forms: [{ Key: id(30), Title: "Task Approval", FlowKey: id(31), DefResourceID: id(32), DeployedDefID: id(33) }],
    Workflows: [{ ID: id(40), Title: "Task Workflow" }],
    UserGroups: [{ ID: id(50), Title: "Task Reviewers" }],
    Agents: [{ ID: id(60), Title: "Task Agent" }],
    Copilots: [{ ID: id(70), Title: "Task Copilot" }],
  };
}

function wrapper(decoded) {
  return {
    PackageId: "upgrade-id-stability-test",
    AppID: 41,
    ListID: decoded.ListSet.ListID,
    Title: decoded.ListSet.Title,
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64"),
    Sign: Buffer.alloc(32, 2).toString("base64"),
  };
}

function writePackage(dir, name, decoded) {
  const file = path.join(dir, `${name}.yapk`);
  fs.writeFileSync(file, `${JSON.stringify(wrapper(decoded))}\n`);
  return file;
}

function lineage(decoded, overrides = {}) {
  const base = [
    obj("app:listset", "application", "decoded.ListSet.ListID", decoded.ListSet.ListID),
    obj("data-list:tasks", "data-list", "decoded.Childs[0].List.ListID", decoded.Childs[0].List.ListID),
    obj("field:tasks:title", "field", "decoded.Childs[0].Fields[0].FieldID", decoded.Childs[0].Fields[0].FieldID),
    obj("field:tasks:status", "field", "decoded.Childs[0].Fields[1].FieldID", decoded.Childs[0].Fields[1].FieldID),
    obj("layout:Tasks:Task Detail:0:0", "layout", "decoded.Childs[0].Layouts[0].LayoutID", decoded.Childs[0].Layouts[0].LayoutID),
    obj("dashboard:task-dashboard", "dashboard", "decoded.Pages[0].LayoutID", decoded.Pages[0].LayoutID),
    obj("approval-form:task-approval", "approval-form", "decoded.Forms[0].Key", decoded.Forms[0].Key),
    obj("approval-process:task-approval", "approval-process", "decoded.Forms[0].FlowKey", decoded.Forms[0].FlowKey),
    obj("workflow:task-workflow", "workflow", "decoded.Workflows[0].ID", decoded.Workflows[0].ID),
    obj("user-group:task-reviewers", "user-group", "decoded.UserGroups[0].ID", decoded.UserGroups[0].ID),
    obj("ai-agent:task-agent", "ai-agent", "decoded.Agents[0].ID", decoded.Agents[0].ID),
    obj("copilot:task-copilot", "copilot", "decoded.Copilots[0].ID", decoded.Copilots[0].ID),
  ];
  return {
    manifestType: "yapk-id-lineage",
    sourceMarker: "api-generated",
    generatorProvenance: { generator: "synthetic-upgrade-id-stability-test" },
    objects: base,
    apiIssuedNewIds: [],
    ...overrides,
  };
}

function obj(semanticKey, objectType, packagePath, value, extra = {}) {
  return {
    semanticKey,
    objectType,
    path: packagePath,
    id: String(value),
    status: "existing",
    idSource: "previous-version-preserved",
    ...extra,
  };
}

function writeJson(dir, name, data) {
  const file = path.join(dir, `${name}.json`);
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  return file;
}

function run(args) {
  return spawnSync(process.execPath, ["scripts/validate-yapk-upgrade-id-stability.mjs", ...args], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
}

function expectPass(label, args) {
  const result = run(args);
  assert.equal(result.status, 0, `${label} should pass.\n${result.stdout}\n${result.stderr}`);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.status, "pass", label);
  return parsed;
}

function expectCode(label, args, code) {
  const result = run(args);
  assert.notEqual(result.status, 0, `${label} should fail.`);
  const combined = `${result.stdout}\n${result.stderr}`;
  assert.match(combined, new RegExp(code), `${label} should report ${code}.\n${combined}`);
}

function args(prevPackage, prevManifest, nextPackage, nextManifest) {
  return [
    "--previous-package", prevPackage,
    "--previous-manifest", prevManifest,
    "--new-package", nextPackage,
    "--new-manifest", nextManifest,
  ];
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yapk-upgrade-id-stability-"));
const cases = [];

try {
  const previous = decodedPackage();
  const previousPackage = writePackage(tempDir, "previous", previous);
  const previousManifest = writeJson(tempDir, "previous-lineage", lineage(previous));

  const validNext = clone(previous);
  validNext.ListSet.Title = "Stable App Renamed";
  validNext.Childs[0].Fields.push({ FieldID: id(101), FieldName: "Priority" });
  const validObjects = lineage(validNext).objects;
  validObjects.push(obj("field:tasks:priority", "field", "decoded.Childs[0].Fields[2].FieldID", id(101), { status: "new", idSource: "api-issued-new" }));
  const validNextPackage = writePackage(tempDir, "valid-next", validNext);
  const validNextManifest = writeJson(tempDir, "valid-next-lineage", lineage(validNext, { objects: validObjects, apiIssuedNewIds: [id(101)] }));
  const valid = expectPass("valid upgrade preserves existing IDs and allocates new field", args(previousPackage, previousManifest, validNextPackage, validNextManifest));
  assert.equal(valid.summary.preservedCount >= 12, true);
  assert.equal(valid.summary.addedCount, 1);
  cases.push("valid upgrade preserves data list, field, dashboard, approval, layout, workflow, user group, AI Agent, and Copilot IDs");

  const packageUpgradeDryRun = spawnSync(process.execPath, [
    "scripts/yeeflow-package-api-automation.mjs",
    "--operation", "upgrade-check-yapk",
    "--package", validNextPackage,
    "--selected-workspace-id", "workspace-user-selected-target",
    "--previous-package", previousPackage,
    "--previous-manifest", previousManifest,
    "--new-manifest", validNextManifest,
  ], { cwd: ROOT, encoding: "utf8", env: { PATH: process.env.PATH || "" } });
  assert.equal(packageUpgradeDryRun.status, 0, `upgrade-check dry-run with valid lineage should pass.\n${packageUpgradeDryRun.stdout}\n${packageUpgradeDryRun.stderr}`);
  const packageUpgradeDryRunParsed = JSON.parse(packageUpgradeDryRun.stdout);
  assert.equal(packageUpgradeDryRunParsed.result.endpoint, "POST /listset/package/upgrade");
  assert.equal(packageUpgradeDryRunParsed.result.request.UpgradeCheck, true);
  assert.equal(packageUpgradeDryRun.stdout.includes("workspace-user-selected-target"), false);
  cases.push("upgrade-check request shaping requires and accepts valid ID stability lineage");

  const changedList = clone(validNext);
  changedList.Childs[0].List.ListID = id(201);
  const changedListObjects = lineage(changedList).objects;
  changedListObjects.push(obj("field:tasks:priority", "field", "decoded.Childs[0].Fields[2].FieldID", id(101), { status: "new", idSource: "api-issued-new" }));
  expectCode(
    "existing data list ID changed",
    args(previousPackage, previousManifest, writePackage(tempDir, "changed-list", changedList), writeJson(tempDir, "changed-list-lineage", lineage(changedList, { objects: changedListObjects, apiIssuedNewIds: [id(101)] }))),
    "UPGRADE_EXISTING_ID_CHANGED",
  );
  cases.push("existing data list ID change fails");

  const changedField = clone(validNext);
  changedField.Childs[0].Fields[0].FieldID = id(202);
  expectCode("existing field ID changed", args(previousPackage, previousManifest, writePackage(tempDir, "changed-field", changedField), validNextManifest), "UPGRADE_MANIFEST_PATH_ID_MISMATCH");
  cases.push("existing field ID change fails");

  const reallocated = clone(previous);
  reallocated.ListSet.ListID = id(301);
  reallocated.Childs[0].List.ListID = id(302);
  reallocated.Childs[0].Fields[0].FieldID = id(303);
  reallocated.Childs[0].Fields[1].FieldID = id(304);
  reallocated.Childs[0].Layouts[0].LayoutID = id(305);
  reallocated.Pages[0].LayoutID = id(306);
  reallocated.Forms[0].Key = id(307);
  reallocated.Forms[0].FlowKey = id(308);
  reallocated.Workflows[0].ID = id(309);
  reallocated.UserGroups[0].ID = id(310);
  reallocated.Agents[0].ID = id(311);
  reallocated.Copilots[0].ID = id(312);
  const reallocatedManifest = lineage(reallocated);
  expectCode("all IDs reallocated", args(previousPackage, previousManifest, writePackage(tempDir, "reallocated", reallocated), writeJson(tempDir, "reallocated-lineage", reallocatedManifest)), "UPGRADE_ALL_IDS_REALLOCATED");
  cases.push("reallocated-all-IDs upgrade fails");

  const removedReuse = clone(previous);
  removedReuse.Childs[0].Fields.splice(1, 1);
  removedReuse.Pages.push({ LayoutID: id(12), Title: "Reused Removed ID", Type: 103, LayoutView: "" });
  const removedReuseObjects = lineage(previous).objects.filter((item) => item.semanticKey !== "field:tasks:status");
  removedReuseObjects.push(obj("dashboard:reused-removed-id", "dashboard", "decoded.Pages[1].LayoutID", id(12), { status: "new", idSource: "api-issued-new" }));
  expectCode(
    "removed ID reused by different semantic key",
    args(previousPackage, previousManifest, writePackage(tempDir, "removed-reuse", removedReuse), writeJson(tempDir, "removed-reuse-lineage", {
      manifestType: "yapk-id-lineage",
      sourceMarker: "api-generated",
      objects: removedReuseObjects,
      apiIssuedNewIds: [id(12)],
    })),
    "UPGRADE_REMOVED_ID_REUSED",
  );
  cases.push("removed ID reuse fails");

  const noApiNewObjects = clone(validNext);
  const noApiObjects = lineage(noApiNewObjects).objects;
  noApiObjects.push(obj("field:tasks:priority", "field", "decoded.Childs[0].Fields[2].FieldID", id(101), { status: "new", idSource: "local-fallback" }));
  expectCode(
    "new object without API-issued ID",
    args(previousPackage, previousManifest, validNextPackage, writeJson(tempDir, "no-api-new-lineage", lineage(noApiNewObjects, { objects: noApiObjects, apiIssuedNewIds: [] }))),
    "UPGRADE_NEW_ID_NOT_API_ISSUED",
  );
  cases.push("new object without API-issued ID fails");

  const duplicateObjects = lineage(validNext).objects;
  duplicateObjects.push({ ...duplicateObjects[0] });
  expectCode(
    "duplicate semantic key",
    args(previousPackage, previousManifest, validNextPackage, writeJson(tempDir, "duplicate-lineage", lineage(validNext, { objects: duplicateObjects }))),
    "UPGRADE_SEMANTIC_KEY_DUPLICATE",
  );
  cases.push("ambiguous duplicate semantic key fails");

  expectCode("missing previous manifest fails closed", args(previousPackage, path.join(tempDir, "missing.json"), validNextPackage, validNextManifest), "UPGRADE_PREVIOUS_MANIFEST_REQUIRED_MISSING");
  cases.push("missing previous manifest fails closed");

  const badPathObjects = lineage(validNext).objects;
  badPathObjects[0] = { ...badPathObjects[0], path: "decoded.ListSet.MissingID" };
  expectCode(
    "manifest path missing",
    args(previousPackage, previousManifest, validNextPackage, writeJson(tempDir, "bad-path-lineage", lineage(validNext, { objects: badPathObjects }))),
    "UPGRADE_MANIFEST_PATH_MISSING",
  );
  cases.push("manifest path mismatch fails");

  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

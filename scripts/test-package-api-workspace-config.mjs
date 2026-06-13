#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { environmentPresence, resolveYeeflowEnvironment } from "./yeeflow-env-utils.mjs";
import {
  APP_PACKAGE_WORKSPACE_CATEGORY,
  combineWorkspaceSummaries,
  DOCUMENTED_WORKSPACE_CATEGORIES,
  redactWorkspaceId,
  resolveTargetWorkspaceId,
  summarizeWorkspaceList,
  WORKSPACE_STATUS_MEANINGS,
} from "./lib/yeeflow-workspace-selection.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const helper = path.join(repoRoot, "scripts", "yeeflow-package-api-automation.mjs");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-package-api-workspace-test-"));
const yapPath = path.join(tempDir, "dry-run.yap");
const yapkPath = path.join(tempDir, "dry-run.yapk");
const workspaceId = "workspace-redaction-test";
const discoveredWorkspaceId = "workspace-discovered-000002";
const discoveryPath = path.join(tempDir, "flowcraft-workspaces.json");

fs.writeFileSync(
  yapPath,
  JSON.stringify({
    AppID: 41,
    Title: "Workspace Dry Run",
    Description: "Dry run only",
    IconUrl: "",
    Resource: "[______gizp______]redacted-test-resource",
  }),
);
fs.writeFileSync(yapkPath, "dry-run-yapk");
fs.writeFileSync(discoveryPath, JSON.stringify({
  Data: [
    { Category: "flowcraft", ID: "workspace-normal-000001", Title: "Operations", Status: 0 },
    { Category: "flowcraft", ID: discoveredWorkspaceId, Title: "", Status: 1 },
  ],
}));

try {
  testEnvResolverWorkspacePresence();
  testDocumentedWorkspaceCategoriesAndStatusFallback();
  testWorkspaceResolutionOrder();
  testWorkspaceListRedaction();
  testMissingWorkspaceBlocksBeforeRequestShape();
  testWorkspaceFromEnvIsIgnoredAndBlocked();
  testCliWorkspaceOverridePassesAndIsRedacted();
  testSelectedWorkspacePassesAndIsRedacted();
  testPackageWriteOperationsShareWorkspaceGate();
  testUploadDoesNotRequireWorkspace();
  console.log("package-api-workspace-config tests passed");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function testEnvResolverWorkspacePresence() {
  const resolved = resolveYeeflowEnvironment({
    YEEFLOW_API_KEY: "base-key",
    YEEFLOW_WORKSPACE_ID: "base-workspace",
    YEEFLOW_PROFILE: "prod",
    YEEFLOW_PROD_API_KEY: "profile-key",
    YEEFLOW_PROD_WORKSPACE_ID: "profile-workspace",
  });

  assert.equal(resolved.workspaceId, "profile-workspace");
  assert.equal(resolved.apiBaseUrl, "https://api.yeeflow.com/v1");
  assert.equal(resolved.usedDefaultApiBaseUrl, true);
  const presence = environmentPresence(resolved);
  assert.equal(presence.YEEFLOW_WORKSPACE_ID_PRESENT, true);
  assert.equal(presence.YEEFLOW_API_BASE_URL_SOURCE, "plugin-default");
  assert.equal(JSON.stringify(presence).includes("profile-workspace"), false);
}

function testDocumentedWorkspaceCategoriesAndStatusFallback() {
  assert.deepEqual(DOCUMENTED_WORKSPACE_CATEGORIES, ["settings", "flowcraft"]);
  assert.equal(APP_PACKAGE_WORKSPACE_CATEGORY, "flowcraft");
  assert.equal(WORKSPACE_STATUS_MEANINGS[0], "normal user-created/editable workspace");
  assert.equal(WORKSPACE_STATUS_MEANINGS[1], "tenant default/shared workspace, editable but not deletable");

  const settings = summarizeWorkspaceList({ Data: [] });
  const flowcraft = summarizeWorkspaceList({
    Data: [
      { Category: "flowcraft", ID: "workspace-normal-000001", Title: "Operations", Status: 0 },
      { Category: "flowcraft", ID: "workspace-default-000002", Title: "", Status: 1 },
    ],
  });
  const combined = combineWorkspaceSummaries([
    { category: "settings", ...settings },
    { category: "flowcraft", ...flowcraft },
  ]);

  assert.equal(combined.workspaceCount, 2);
  assert.deepEqual(combined.categories, ["settings", "flowcraft"]);
  assert.equal(combined.workspaces[0].displayName, "Operations");
  assert.equal(combined.workspaces[0].statusMeaningProvenance, "product-knowledge");
  assert.equal(combined.workspaces[1].title, "");
  assert.equal(combined.workspaces[1].displayName, "Shared Workspace");
  assert.equal(combined.workspaces[1].statusMeaning, WORKSPACE_STATUS_MEANINGS[1]);
  assert.equal(JSON.stringify(combined).includes("workspace-default-000002"), false);
}

function testWorkspaceResolutionOrder() {
  assert.deepEqual(resolveTargetWorkspaceId({
    cliWorkspaceId: "cli-workspace",
    envWorkspaceId: "env-workspace",
    selectedWorkspaceId: "selected-workspace",
  }), { workspaceId: "selected-workspace", source: "user-selection" });

  assert.deepEqual(resolveTargetWorkspaceId({
    envWorkspaceId: "env-workspace",
    selectedWorkspaceId: "selected-workspace",
  }), { workspaceId: "selected-workspace", source: "user-selection" });

  assert.deepEqual(resolveTargetWorkspaceId({
    cliWorkspaceId: "cli-workspace",
    envWorkspaceId: "env-workspace",
  }), { workspaceId: "cli-workspace", source: "cli-user-selected" });

  assert.deepEqual(resolveTargetWorkspaceId({
    envWorkspaceId: "env-workspace",
  }), { workspaceId: "", source: "environment-default-ignored", ignoredWorkspaceIdPresent: true });

  assert.deepEqual(resolveTargetWorkspaceId({}), { workspaceId: "", source: "missing" });
}

function testWorkspaceListRedaction() {
  const rawId = "workspace-1234567890";
  const summary = summarizeWorkspaceList({
    Data: [
      {
        TenantID: 12345,
        Category: "flowcraft",
        ID: rawId,
        Title: "Operations",
        Status: 0,
        Owners: [{ ID: "private-owner" }],
      },
    ],
  });
  assert.equal(summary.workspaceCount, 1);
  assert.equal(summary.workspaces[0].title, "Operations");
  assert.equal(summary.workspaces[0].displayName, "Operations");
  assert.equal(summary.workspaces[0].category, "flowcraft");
  assert.equal(summary.workspaces[0].status, 0);
  assert.equal(summary.workspaces[0].statusMeaning, WORKSPACE_STATUS_MEANINGS[0]);
  assert.equal(summary.workspaces[0].idPreview, redactWorkspaceId(rawId));
  assert.equal(JSON.stringify(summary).includes(rawId), false);
  assert.equal(JSON.stringify(summary).includes("TenantID"), false);
  assert.equal(JSON.stringify(summary).includes("private-owner"), false);
}

function testMissingWorkspaceBlocksBeforeRequestShape() {
  const dotenv = path.join(tempDir, "missing-workspace.env");
  fs.writeFileSync(dotenv, "\n");
  const result = runHelper([
    "--operation",
    "import-yap",
    "--package",
    yapPath,
    "--dotenv",
    dotenv,
    "--workspace-discovery-json",
    discoveryPath,
  ]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.workspaceId, "missing");
  assert.equal(parsed.workspaceSelectionRequired, true);
  assert.equal(parsed.result.resultClass, "workspace_selection_required");
  assert.equal(parsed.result.source, "missing");
  assert.equal(parsed.result.discoveredCategory, "flowcraft");
  assert.equal(parsed.result.workspaceDiscovery.source, "fixture");
  assert.equal(parsed.result.workspaceChoices.workspaceCount, 2);
  assert.equal(parsed.result.requestShaped, false);
  assert.equal(parsed.result.livePackageWriteExecuted, false);
  assert.equal(Object.hasOwn(parsed.result, "request"), false);
}

function testWorkspaceFromEnvIsIgnoredAndBlocked() {
  const dotenv = path.join(tempDir, "workspace.env");
  fs.writeFileSync(dotenv, `YEEFLOW_WORKSPACE_ID=${workspaceId}\n`);
  const result = runHelper([
    "--operation",
    "install-yapk",
    "--package",
    yapkPath,
    "--dotenv",
    dotenv,
    "--workspace-discovery-json",
    discoveryPath,
  ]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.workspaceId, "missing");
  assert.equal(parsed.workspaceIdSource, "environment-default-ignored");
  assert.equal(parsed.workspaceSelectionRequired, true);
  assert.equal(parsed.environment.YEEFLOW_WORKSPACE_ID_PRESENT, true);
  assert.equal(parsed.result.resultClass, "workspace_selection_required");
  assert.equal(parsed.result.source, "environment-default-ignored");
  assert.equal(parsed.result.workspaceChoices.workspaceCount, 2);
  assert.equal(parsed.result.workspaceChoices.workspaces[1].displayName, "Shared Workspace");
  assert.equal(JSON.stringify(parsed.result).includes("WorkspaceID"), false);
  assert.equal(result.stdout.includes(workspaceId), false);
  assert.equal(result.stdout.includes(discoveredWorkspaceId), false);
}

function testCliWorkspaceOverridePassesAndIsRedacted() {
  const override = "workspace-cli-override";
  const dotenv = path.join(tempDir, "no-workspace.env");
  fs.writeFileSync(dotenv, "\n");
  const result = runHelper([
    "--operation",
    "upgrade-yapk",
    "--package",
    yapkPath,
    "--dotenv",
    dotenv,
    "--workspace-id",
    override,
  ]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.workspaceId, "present");
  assert.equal(parsed.workspaceIdSource, "cli-user-selected");
  assert.equal(parsed.workspaceSelectionRequired, false);
  assert.equal(parsed.result.resultClass, "upgrade_id_stability_required");
  assert.equal(parsed.result.requestShaped, false);
  assert.equal(Object.hasOwn(parsed.result, "request"), false);
  assert.equal(result.stdout.includes(override), false);
}

function testSelectedWorkspacePassesAndIsRedacted() {
  const selected = "workspace-selected-value";
  const dotenv = path.join(tempDir, "selected-workspace.env");
  fs.writeFileSync(dotenv, "\n");
  const result = runHelper([
    "--operation",
    "install-yapk",
    "--package",
    yapkPath,
    "--dotenv",
    dotenv,
    "--selected-workspace-id",
    selected,
  ]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.workspaceId, "present");
  assert.equal(parsed.workspaceIdSource, "user-selection");
  assert.equal(parsed.workspaceSelectionRequired, false);
  assert.equal(result.stdout.includes(selected), false);
}

function testPackageWriteOperationsShareWorkspaceGate() {
  const dotenv = path.join(tempDir, "package-write-gate.env");
  fs.writeFileSync(dotenv, `YEEFLOW_WORKSPACE_ID=${workspaceId}\n`);
  for (const operation of ["import-yap", "install-yapk", "upgrade-check-yapk", "upgrade-apply-yapk", "upgrade-yapk"]) {
    const packageFile = operation === "import-yap" ? yapPath : yapkPath;
    const result = runHelper([
      "--operation",
      operation,
      "--package",
      packageFile,
      "--dotenv",
      dotenv,
      "--workspace-discovery-json",
      discoveryPath,
    ]);
    assert.equal(result.status, 0, `${operation} failed:\n${result.stderr}`);
    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.workspaceIdSource, "environment-default-ignored");
    assert.equal(parsed.result.resultClass, "workspace_selection_required");
    assert.equal(parsed.result.requestShaped, false);
    assert.equal(result.stdout.includes(workspaceId), false);
    assert.equal(result.stdout.includes(discoveredWorkspaceId), false);
  }
}

function testUploadDoesNotRequireWorkspace() {
  const dotenv = path.join(tempDir, "upload-only.env");
  fs.writeFileSync(dotenv, "\n");
  const result = runHelper(["--operation", "upload", "--package", yapkPath, "--dotenv", dotenv]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.workspaceId, "missing");
  assert.equal(parsed.workspaceSelectionRequired, false);
  assert.equal(parsed.result.endpoint, "POST /files/upload");
}

function runHelper(args) {
  return spawnSync(process.execPath, [helper, ...args], {
    encoding: "utf8",
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
    },
  });
}

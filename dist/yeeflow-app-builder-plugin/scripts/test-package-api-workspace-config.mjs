#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { environmentPresence, resolveYeeflowEnvironment } from "./yeeflow-env-utils.mjs";
import { redactWorkspaceId, resolveTargetWorkspaceId, summarizeWorkspaceList } from "./lib/yeeflow-workspace-selection.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const helper = path.join(repoRoot, "scripts", "yeeflow-package-api-automation.mjs");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-package-api-workspace-test-"));
const yapPath = path.join(tempDir, "dry-run.yap");
const yapkPath = path.join(tempDir, "dry-run.yapk");
const workspaceId = "workspace-redaction-test";

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

try {
  testEnvResolverWorkspacePresence();
  testWorkspaceResolutionOrder();
  testWorkspaceListRedaction();
  testMissingWorkspaceFailsImport();
  testWorkspaceFromEnvPassesAndIsRedacted();
  testCliWorkspaceOverridePassesAndIsRedacted();
  testSelectedWorkspacePassesAndIsRedacted();
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

function testWorkspaceResolutionOrder() {
  assert.deepEqual(resolveTargetWorkspaceId({
    cliWorkspaceId: "cli-workspace",
    envWorkspaceId: "env-workspace",
    selectedWorkspaceId: "selected-workspace",
  }), { workspaceId: "cli-workspace", source: "cli-argument" });

  assert.deepEqual(resolveTargetWorkspaceId({
    envWorkspaceId: "env-workspace",
    selectedWorkspaceId: "selected-workspace",
  }), { workspaceId: "env-workspace", source: "environment-default" });

  assert.deepEqual(resolveTargetWorkspaceId({
    selectedWorkspaceId: "selected-workspace",
  }), { workspaceId: "selected-workspace", source: "user-selection" });

  assert.deepEqual(resolveTargetWorkspaceId({}), { workspaceId: "", source: "missing" });
}

function testWorkspaceListRedaction() {
  const rawId = "workspace-1234567890";
  const summary = summarizeWorkspaceList({
    Data: [
      {
        TenantID: 12345,
        Category: "app",
        ID: rawId,
        Title: "Operations",
        Status: 1,
        Owners: [{ ID: "private-owner" }],
      },
    ],
  });
  assert.equal(summary.workspaceCount, 1);
  assert.equal(summary.workspaces[0].title, "Operations");
  assert.equal(summary.workspaces[0].category, "app");
  assert.equal(summary.workspaces[0].status, 1);
  assert.equal(summary.workspaces[0].idPreview, redactWorkspaceId(rawId));
  assert.equal(JSON.stringify(summary).includes(rawId), false);
  assert.equal(JSON.stringify(summary).includes("TenantID"), false);
  assert.equal(JSON.stringify(summary).includes("private-owner"), false);
}

function testMissingWorkspaceFailsImport() {
  const dotenv = path.join(tempDir, "missing-workspace.env");
  fs.writeFileSync(dotenv, "\n");
  const result = runHelper(["--operation", "import-yap", "--package", yapPath, "--dotenv", dotenv]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Target workspace is required/);
  assert.match(result.stderr, /yeeflow-workspace-list\.mjs/);
}

function testWorkspaceFromEnvPassesAndIsRedacted() {
  const dotenv = path.join(tempDir, "workspace.env");
  fs.writeFileSync(dotenv, `YEEFLOW_WORKSPACE_ID=${workspaceId}\n`);
  const result = runHelper(["--operation", "install-yapk", "--package", yapkPath, "--dotenv", dotenv]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.workspaceId, "present");
  assert.equal(parsed.environment.YEEFLOW_WORKSPACE_ID_PRESENT, true);
  assert.equal(result.stdout.includes(workspaceId), false);
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
  assert.equal(result.stdout.includes(selected), false);
}

function testUploadDoesNotRequireWorkspace() {
  const dotenv = path.join(tempDir, "upload-only.env");
  fs.writeFileSync(dotenv, "\n");
  const result = runHelper(["--operation", "upload", "--package", yapkPath, "--dotenv", dotenv]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.workspaceId, "missing");
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

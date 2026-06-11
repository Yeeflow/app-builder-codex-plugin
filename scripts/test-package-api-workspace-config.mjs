#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { environmentPresence, resolveYeeflowEnvironment } from "./yeeflow-env-utils.mjs";

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
  testMissingWorkspaceFailsImport();
  testWorkspaceFromEnvPassesAndIsRedacted();
  testCliWorkspaceOverridePassesAndIsRedacted();
  testUploadDoesNotRequireWorkspace();
  console.log("package-api-workspace-config tests passed");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function testEnvResolverWorkspacePresence() {
  const resolved = resolveYeeflowEnvironment({
    YEEFLOW_API_BASE_URL: "https://api.yeeflow.com/v1",
    YEEFLOW_API_KEY: "base-key",
    YEEFLOW_WORKSPACE_ID: "base-workspace",
    YEEFLOW_PROFILE: "prod",
    YEEFLOW_PROD_API_KEY: "profile-key",
    YEEFLOW_PROD_WORKSPACE_ID: "profile-workspace",
  });

  assert.equal(resolved.workspaceId, "profile-workspace");
  const presence = environmentPresence(resolved);
  assert.equal(presence.YEEFLOW_WORKSPACE_ID_PRESENT, true);
  assert.equal(JSON.stringify(presence).includes("profile-workspace"), false);
}

function testMissingWorkspaceFailsImport() {
  const dotenv = path.join(tempDir, "missing-workspace.env");
  fs.writeFileSync(dotenv, "YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1\n");
  const result = runHelper(["--operation", "import-yap", "--package", yapPath, "--dotenv", dotenv]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /YEEFLOW_WORKSPACE_ID is required/);
}

function testWorkspaceFromEnvPassesAndIsRedacted() {
  const dotenv = path.join(tempDir, "workspace.env");
  fs.writeFileSync(dotenv, `YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1\nYEEFLOW_WORKSPACE_ID=${workspaceId}\n`);
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
  fs.writeFileSync(dotenv, "YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1\n");
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

function testUploadDoesNotRequireWorkspace() {
  const dotenv = path.join(tempDir, "upload-only.env");
  fs.writeFileSync(dotenv, "YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1\n");
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

#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const helper = path.join(ROOT, "scripts", "yeeflow-package-api-automation.mjs");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-package-workspace-gate-"));
const envWorkspaceId = "workspace-env-should-not-be-targeted";
const selectedWorkspaceId = "workspace-user-selected-target";
const discoveredWorkspaceId = "workspace-discovered-raw-value";
const dotenv = path.join(tempDir, ".env.local");
const discovery = path.join(tempDir, "flowcraft-workspaces.json");
const yap = path.join(tempDir, "sample.yap");
const yapk = path.join(tempDir, "sample.yapk");

try {
  fs.writeFileSync(dotenv, `YEEFLOW_WORKSPACE_ID=${envWorkspaceId}\n`);
  fs.writeFileSync(discovery, JSON.stringify({
    Data: [
      { Category: "flowcraft", ID: discoveredWorkspaceId, Title: "", Status: 1 },
    ],
  }));
  fs.writeFileSync(yap, JSON.stringify({
    AppID: 41,
    Title: "Workspace Gate Fixture",
    Resource: "[______gizp______]redacted",
  }));
  fs.writeFileSync(yapk, "{}\n");

  for (const operation of ["import-yap", "install-yapk", "upgrade-check-yapk", "upgrade-apply-yapk", "upgrade-yapk"]) {
    const packagePath = operation === "import-yap" ? yap : yapk;
    const blocked = run([
      "--operation",
      operation,
      "--package",
      packagePath,
      "--dotenv",
      dotenv,
      "--workspace-discovery-json",
      discovery,
    ]);
    assert.equal(blocked.status, 0, `${operation} blocked dry-run failed:\n${blocked.stderr}`);
    const parsed = JSON.parse(blocked.stdout);
    assert.equal(parsed.workspaceId, "missing");
    assert.equal(parsed.workspaceIdSource, "environment-default-ignored");
    assert.equal(parsed.workspaceSelectionRequired, true);
    assert.equal(parsed.result.resultClass, "workspace_selection_required");
    assert.equal(parsed.result.source, "environment-default-ignored");
    assert.equal(parsed.result.discoveredCategory, "flowcraft");
    assert.equal(parsed.result.requestShaped, false);
    assert.equal(parsed.result.livePackageWriteExecuted, false);
    assert.equal(parsed.result.workspaceChoices.workspaces[0].displayName, "Shared Workspace");
    assert.equal(Object.hasOwn(parsed.result, "request"), false);
    assert.equal(blocked.stdout.includes(envWorkspaceId), false);
    assert.equal(blocked.stdout.includes(discoveredWorkspaceId), false);

    const selected = run([
      "--operation",
      operation,
      "--package",
      packagePath,
      "--dotenv",
      dotenv,
      "--selected-workspace-id",
      selectedWorkspaceId,
    ]);
    assert.equal(selected.status, 0, `${operation} selected dry-run failed:\n${selected.stderr}`);
    const selectedParsed = JSON.parse(selected.stdout);
    assert.equal(selectedParsed.workspaceId, "present");
    assert.equal(selectedParsed.workspaceIdSource, "user-selection");
    assert.equal(selectedParsed.workspaceSelectionRequired, false);
    assert.match(selectedParsed.result.endpoint, /^POST \/listset\/package\//);
    assert.equal(selected.stdout.includes(envWorkspaceId), false);
    assert.equal(selected.stdout.includes(selectedWorkspaceId), false);
  }

  const unauthenticatedDiscovery = run([
    "--operation",
    "install-yapk",
    "--package",
    yapk,
    "--dotenv",
    dotenv,
  ], { YEEFLOW_OAUTH_TOKEN_FILE: path.join(tempDir, "missing-token.json") });
  assert.equal(unauthenticatedDiscovery.status, 0, unauthenticatedDiscovery.stderr);
  const unauthenticatedParsed = JSON.parse(unauthenticatedDiscovery.stdout);
  assert.equal(unauthenticatedParsed.workspaceSelectionRequired, true);
  assert.equal(unauthenticatedParsed.result.resultClass, "workspace_selection_required");
  assert.equal(unauthenticatedParsed.result.requestShaped, false);
  assert.equal(unauthenticatedParsed.result.livePackageWriteExecuted, false);
  assert.equal(unauthenticatedParsed.result.workspaceDiscovery.resultClass, "auth_required");
  assert.equal(unauthenticatedParsed.result.workspaceDiscovery.reason, "login_flow_required");
  assert.equal(unauthenticatedParsed.result.workspaceDiscovery.originalOperation, "package workspace discovery");
  assert.equal(unauthenticatedParsed.result.workspaceDiscovery.originalCapability, "workspaces.listByCategory");
  assert.equal(unauthenticatedParsed.result.workspaceDiscovery.liveCall, false);
  assert.equal(unauthenticatedParsed.result.workspaceDiscovery.requestShaped, false);
  assert.equal(Object.hasOwn(unauthenticatedParsed.result, "request"), false);
  assertNoLocalLoginRecovery(unauthenticatedDiscovery.stdout);

  console.log("package workspace-selection hard-gate tests passed");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function run(args, extraEnv = {}) {
  return spawnSync(process.execPath, [helper, ...args], {
    encoding: "utf8",
    env: { PATH: process.env.PATH || "", ...extraEnv },
  });
}

function assertNoLocalLoginRecovery(text) {
  assert.doesNotMatch(text, /yeeflow-oauth-login\.mjs/);
  assert.doesNotMatch(text, /node\s+/);
  assert.doesNotMatch(text, /\.codex\/plugins\/cache/);
  assert.doesNotMatch(text, /(ask|set|configure|use|paste|run).*YEEFLOW_API_KEY/i);
  assert.doesNotMatch(text, /(ask|set|configure|create|use).*\.env\.local/i);
}

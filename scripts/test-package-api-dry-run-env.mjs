#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-package-dry-run-"));
const dotenv = path.join(tempDir, ".env.local");
const packagePath = path.join(tempDir, "dry-run-smoke.yapk");
const discoveryPath = path.join(tempDir, "flowcraft-workspaces.json");
const secretApiKey = "dry_run_secret_api_key_should_not_print";
const workspaceId = "9876543210123456";
const selectedWorkspaceId = "selected-workspace-123456";

try {
  fs.writeFileSync(dotenv, [
    `YEEFLOW_WORKSPACE_ID="${workspaceId}"`,
  ].join("\n"));
  fs.writeFileSync(discoveryPath, JSON.stringify({
    Data: [{ Category: "flowcraft", ID: "workspace-discovered-123456", Title: "", Status: 1 }],
  }));
  fs.writeFileSync(packagePath, "{}\n");

  const minimal = spawnSync(process.execPath, [
    "scripts/yeeflow-package-api-automation.mjs",
    "--operation",
    "install-yapk",
    "--package",
    packagePath,
    "--dotenv",
    dotenv,
    "--workspace-discovery-json",
    discoveryPath,
  ], { cwd: ROOT, encoding: "utf8", env: { PATH: process.env.PATH || "" } });
  assert.equal(minimal.status, 0, `minimal dry-run failed:\n${minimal.stdout}\n${minimal.stderr}`);
  assert.equal(`${minimal.stdout}\n${minimal.stderr}`.includes(workspaceId), false, "minimal dry-run printed WorkspaceID");
  const minimalParsed = JSON.parse(minimal.stdout);
  assert.equal(minimalParsed.environment.YEEFLOW_API_BASE_URL_PRESENT, true);
  assert.equal(minimalParsed.environment.YEEFLOW_API_BASE_URL_SOURCE, "plugin-default");
  assert.equal(minimalParsed.environment.YEEFLOW_API_KEY_PRESENT, false);
  assert.equal(minimalParsed.environment.YEEFLOW_API_KEY_MODE, "not-configured");
  assert.equal(minimalParsed.environment.YEEFLOW_WORKSPACE_ID_PRESENT, true);
  assert.equal(minimalParsed.workspaceId, "missing");
  assert.equal(minimalParsed.workspaceIdSource, "environment-default-ignored");
  assert.equal(minimalParsed.workspaceSelectionRequired, true);
  assert.equal(minimalParsed.result.resultClass, "workspace_selection_required");
  assert.equal(minimalParsed.result.workspaceDiscovery.source, "fixture");
  assert.equal(minimalParsed.result.workspaceChoices.workspaces[0].displayName, "Shared Workspace");
  assert.equal(minimalParsed.result.requestShaped, false);
  assert.equal(Object.hasOwn(minimalParsed.result, "request"), false);

  fs.writeFileSync(dotenv, [
    "YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1",
    `YEEFLOW_API_KEY="${secretApiKey}"`,
    `YEEFLOW_WORKSPACE_ID="${workspaceId}"`,
    "YEEFLOW_TENANT_URL=https://example.yeeflow.com",
  ].join("\n"));
  fs.writeFileSync(packagePath, "{}\n");

  for (const operation of ["upload", "install-yapk", "upgrade-check-yapk", "upgrade-apply-yapk"]) {
    const args = [
      "scripts/yeeflow-package-api-automation.mjs",
      "--operation",
      operation,
      "--package",
      packagePath,
      "--dotenv",
      dotenv,
    ];
    if (operation !== "upload") args.push("--selected-workspace-id", selectedWorkspaceId);
    const result = spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", env: { PATH: process.env.PATH || "" } });

    assert.equal(result.status, 0, `${operation} dry-run failed:\n${result.stdout}\n${result.stderr}`);
    const combined = `${result.stdout}\n${result.stderr}`;
    assert.equal(combined.includes(secretApiKey), false, `${operation} printed API key`);
    assert.equal(combined.includes(workspaceId), false, `${operation} printed WorkspaceID`);
    assert.equal(combined.includes(selectedWorkspaceId), false, `${operation} printed selected WorkspaceID`);
    assert.equal(combined.includes("\"Resource\""), false, `${operation} printed raw Resource key`);

    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.execute, false);
    assert.equal(parsed.environment.YEEFLOW_API_KEY_PRESENT, true);
    assert.equal(parsed.environment.YEEFLOW_API_KEY_MODE, "legacy-fallback");
    assert.equal(parsed.environment.YEEFLOW_WORKSPACE_ID_PRESENT, true);
    assert.equal(parsed.workspaceId, operation === "upload" ? "missing" : "present");
    assert.equal(parsed.workspaceSelectionRequired, false);
    assert.match(parsed.result.endpoint, /^POST \//);
    if (operation === "upgrade-check-yapk") assert.equal(parsed.result.request.UpgradeCheck, true);
    if (operation === "upgrade-apply-yapk") assert.equal(parsed.result.request.UpgradeCheck, false);
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log("package-api dry-run env tests passed");

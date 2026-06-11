#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadDotenvFile, parseDotenvValue, resolveYeeflowEnvironment } from "./yeeflow-env-utils.mjs";

assert.equal(parseDotenvValue("plain-value"), "plain-value");
assert.equal(parseDotenvValue("plain value # comment"), "plain value");
assert.equal(parseDotenvValue("https://api.yeeflow.com/v1#fragment"), "https://api.yeeflow.com/v1#fragment");
assert.equal(parseDotenvValue("\"quoted value # not comment\""), "quoted value # not comment");
assert.equal(parseDotenvValue("'single quoted # not comment'"), "single quoted # not comment");
assert.equal(parseDotenvValue("\"line\\nvalue\""), "line\nvalue");
assert.equal(parseDotenvValue("\"tab\\tvalue\""), "tab\tvalue");
assert.equal(parseDotenvValue("\"escaped \\\" quote\""), "escaped \" quote");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-env-utils-"));
const dotenv = path.join(tempDir, ".env.local");
const originalEnv = { ...process.env };

try {
  fs.writeFileSync(dotenv, [
    "",
    "# comment",
    "YEEFLOW_API_BASE_URL=https://api.yeeflow.com",
    "YEEFLOW_PROFILE=dev",
    "YEEFLOW_DEV_API_KEY=\"secret value # redacted\"",
    "YEEFLOW_DEV_TENANT_URL=https://example.yeeflow.com # public placeholder in test",
    "YEEFLOW_DEV_WORKSPACE_ID='9876543210123456'",
    "IGNORED-NOT-VALID=value",
    "",
  ].join("\n"));

  for (const key of Object.keys(process.env)) {
    if (key.startsWith("YEEFLOW_")) delete process.env[key];
  }

  assert.equal(loadDotenvFile(fs, dotenv), true);
  const resolved = resolveYeeflowEnvironment(process.env);
  assert.equal(resolved.apiBaseUrl, "https://api.yeeflow.com/v1");
  assert.equal(resolved.profile, "dev");
  assert.equal(resolved.apiKey, "secret value # redacted");
  assert.equal(resolved.workspaceId, "9876543210123456");
  assert.equal(resolved.tenantUrl, "https://example.yeeflow.com");
  assert.equal(process.env["IGNORED-NOT-VALID"], undefined);
} finally {
  process.env = originalEnv;
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log("yeeflow-env-utils tests passed");

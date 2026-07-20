#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const plugin = resolve(root, "dist/yeeflow-app-builder-plugin");
const temp = mkdtempSync(resolve(tmpdir(), "yeeflow-oauth-on-demand-distribution-"));
const originalEnv = process.env;

try {
  const source = await probe("source", resolve(root, "scripts"));
  const dist = await probe("dist", resolve(plugin, "scripts"));
  assert.deepEqual(dist, source);
  const archive = resolve(temp, "official-plugin.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", archive], { cwd: root, stdio: "pipe" });
  assertArchiveHasNoCredentials(archive);
  const archiveRoot = resolve(temp, "archive");
  mkdirSync(archiveRoot, { recursive: true });
  execFileSync("unzip", ["-q", archive, "-d", archiveRoot]);
  assertPackagedEntrypointGate(resolve(archiveRoot, "yeeflow-app-builder-plugin/scripts"));
  const zipped = await probe("archive", resolve(archiveRoot, "yeeflow-app-builder-plugin/scripts"));
  assert.deepEqual(zipped, source);
  const installedRoot = resolve(temp, "installed", "yeeflow-app-builder-plugin");
  cpSync(plugin, installedRoot, { recursive: true });
  const installed = await probe("installed", resolve(installedRoot, "scripts"));
  assert.deepEqual(installed, source);
  assertActiveEntrypointBaseline();
  console.log("PLUGIN_YEEFLOW_OAUTH_ARCHIVE_ENTRYPOINT_GATE_PASSED");
  console.log("PLUGIN_YEEFLOW_OAUTH_SOURCE_DIST_ARCHIVE_INSTALLED_PARITY_PASSED");
} finally {
  process.env = originalEnv;
  rmSync(temp, { recursive: true, force: true });
}

function assertPackagedEntrypointGate(archiveScripts) {
  const sourceScripts = resolve(root, "scripts");
  const entrypoint = "yeeflow-oauth-login.mjs";
  const flow = "lib/yeeflow-oauth-login-flow.mjs";
  for (const scriptsRoot of [sourceScripts, resolve(plugin, "scripts"), archiveScripts]) {
    const entry = readFileSync(resolve(scriptsRoot, entrypoint), "utf8");
    assert.match(entry, /import\s*\{\s*startYeeflowOAuthBrowserLogin\s*\}/u);
    assert.doesNotMatch(entry, /startHttpsCallbackServer/u);
    assert.match(readFileSync(resolve(scriptsRoot, flow), "utf8"), /ensureLocalOAuthCallbackCertificate/u);
  }
  for (const relative of [entrypoint, flow]) {
    const expected = sha(readFileSync(resolve(sourceScripts, relative)));
    assert.equal(sha(readFileSync(resolve(plugin, "scripts", relative))), expected, `DIST_ENTRYPOINT_HASH_MISMATCH:${relative}`);
    assert.equal(sha(readFileSync(resolve(archiveScripts, relative))), expected, `ARCHIVE_ENTRYPOINT_HASH_MISMATCH:${relative}`);
  }
}
function sha(value) { return createHash("sha256").update(value).digest("hex"); }

async function probe(surface, scriptsRoot) {
  const auth = await import(`${pathToFileURL(resolve(scriptsRoot, "lib/yeeflow-api-auth.mjs")).href}?${surface}`);
  const client = await import(`${pathToFileURL(resolve(scriptsRoot, "lib/yeeflow-oauth-client.mjs")).href}?${surface}`);
  const tokenFile = resolve(temp, surface, "user-local", "token.json");
  process.env = {
    ...originalEnv,
    HOME: resolve(temp, surface, "home"),
    YEEFLOW_API_BASE_URL: "https://api.yeeflow.com/v1",
    YEEFLOW_OAUTH_TOKEN_FILE: tokenFile,
  };
  let loginCalls = 0;
  let operationCalls = 0;
  const value = await auth.resumeYeeflowOAuthOperation(async (authorized) => {
    operationCalls += 1;
    return authorized.headers.Authorization;
  }, {
    loadDotenv: false,
    startBrowserLogin: async ({ config }) => {
      loginCalls += 1;
      client.saveStoredToken(config, {
        access_token: "surface-token",
        refresh_token: "surface-refresh",
        expires_at: new Date(Date.now() + 3_600_000).toISOString(),
        token_type: "Bearer",
        scope: "basic_api openid offline_access",
      });
      return { status: "authenticated", authenticated: true };
    },
  });
  assert.equal(value, "Bearer surface-token");
  assert.equal(loginCalls, 1);
  assert.equal(operationCalls, 1);
  return { loginCalls, operationCalls, value };
}

function assertArchiveHasNoCredentials(archive) {
  const names = execFileSync("unzip", ["-Z1", archive], { encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
  for (const name of names) assert.doesNotMatch(name, /(?:^|\/)(?:\.yeeflow-oauth|\.yeeflow)(?:\/|$)|\.(?:pem|key|p12)$/iu);
  const listing = names.join("\n");
  assert.doesNotMatch(listing, /codex-oauth-token\.json|localhost-(?:cert|key)\.pem/iu);
  for (const name of names.filter((item) => /\.(?:mjs|cjs|json|md|txt)$/iu.test(item) && !/(?:^|\/)test-[^/]+$/u.test(item))) {
    const text = execFileSync("unzip", ["-p", archive, name], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
    assert.doesNotMatch(text, /(?:access|refresh)_token\s*[:=]\s*["'][A-Za-z0-9._~-]{12,}/iu);
    assert.doesNotMatch(text, /code_verifier\s*[:=]\s*["'][A-Za-z0-9._~-]{24,}/iu);
  }
}

function assertActiveEntrypointBaseline() {
  const active = "/Users/rengerhu/.codex/.tmp/marketplaces/yeeflow/dist/yeeflow-app-builder-plugin/scripts/yeeflow-oauth-login.mjs";
  const text = readFileSync(active, "utf8");
  const legacyFlow = /startHttpsCallbackServer/u.test(text);
  const currentFlow = /startYeeflowOAuthBrowserLogin/u.test(text);
  assert.notEqual(legacyFlow, currentFlow, "ACTIVE_OAUTH_ENTRYPOINT_BASELINE_UNRECOGNIZED");
}

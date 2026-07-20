#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureLocalOAuthCallbackCertificate, startYeeflowOAuthBrowserLogin } from "./lib/yeeflow-oauth-login-flow.mjs";
import { clearStoredToken, resolveOAuthConfig, saveStoredToken } from "./lib/yeeflow-oauth-client.mjs";
import { requireYeeflowOAuthAuth, resumeYeeflowOAuthOperation } from "./lib/yeeflow-api-auth.mjs";

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-oauth-on-demand-"));
const tokenFile = path.join(temp, "user-local", "token.json");
const certFile = path.join(temp, "user-local", "oauth-callback", "localhost-cert.pem");
const keyFile = path.join(temp, "user-local", "oauth-callback", "localhost-key.pem");
const originalEnv = process.env;

try {
  process.env = {
    HOME: path.join(temp, "home"),
    YEEFLOW_API_BASE_URL: "https://api.yeeflow.com/v1",
    YEEFLOW_OAUTH_TOKEN_FILE: tokenFile,
    YEEFLOW_OAUTH_CALLBACK_CERT_FILE: certFile,
    YEEFLOW_OAUTH_CALLBACK_KEY_FILE: keyFile,
  };
  await testNoTokenResumesOnce();
  await testExpiredRefreshSkipsBrowser();
  await testRefreshFailureStartsBrowserAndResumesOnce();
  await testFailClosedStatuses();
  testCertificateAutomationIsUserLocal();
  await testBrowserFlowStateMismatchAndExchangeFailureAreFailClosed();
  console.log("PLUGIN_YEEFLOW_OAUTH_ON_DEMAND_BROWSER_LOGIN_RECONCILED");
  console.log("PLUGIN_YEEFLOW_OAUTH_LOCAL_CALLBACK_CERTIFICATE_AUTOMATION_PASSED");
  console.log("PLUGIN_YEEFLOW_OAUTH_RESUME_AFTER_LOGIN_PASSED");
} finally {
  process.env = originalEnv;
  fs.rmSync(temp, { recursive: true, force: true });
}

async function testNoTokenResumesOnce() {
  clear();
  let loginCalls = 0;
  let operationCalls = 0;
  const result = await resumeYeeflowOAuthOperation(async (auth) => {
    operationCalls += 1;
    return auth.headers.Authorization;
  }, {
    loadDotenv: false,
    startBrowserLogin: async ({ config }) => {
      loginCalls += 1;
      saveStoredToken(config, validToken("fresh-after-login"));
      return { status: "authenticated", authenticated: true };
    },
  });
  assert.equal(result, "Bearer fresh-after-login");
  assert.equal(loginCalls, 1);
  assert.equal(operationCalls, 1);
}

async function testExpiredRefreshSkipsBrowser() {
  const config = localConfig();
  saveStoredToken(config, expiredToken());
  let loginCalls = 0;
  const auth = await requireYeeflowOAuthAuth({
    loadDotenv: false,
    fetchImpl: mockFetch({ access_token: "refreshed", refresh_token: "refresh-two", expires_in: 3600, token_type: "Bearer" }),
    startBrowserLogin: async () => { loginCalls += 1; return { authenticated: false }; },
  });
  assert.equal(auth.headers.Authorization, "Bearer refreshed");
  assert.equal(auth.refreshed, true);
  assert.equal(auth.resumedAfterLogin, undefined);
  assert.equal(loginCalls, 0);
}

async function testRefreshFailureStartsBrowserAndResumesOnce() {
  const config = localConfig();
  saveStoredToken(config, expiredToken());
  let loginCalls = 0;
  let operationCalls = 0;
  const result = await resumeYeeflowOAuthOperation(async (auth) => {
    operationCalls += 1;
    return auth.headers.Authorization;
  }, {
    loadDotenv: false,
    fetchImpl: mockFetch({ error: "invalid_grant" }, { ok: false, status: 400 }),
    startBrowserLogin: async ({ config: loginConfig }) => {
      loginCalls += 1;
      saveStoredToken(loginConfig, validToken("fresh-after-refresh-failure"));
      return { status: "authenticated", authenticated: true };
    },
  });
  assert.equal(result, "Bearer fresh-after-refresh-failure");
  assert.equal(loginCalls, 1);
  assert.equal(operationCalls, 1);
}

async function testFailClosedStatuses() {
  for (const status of ["cancelled", "timeout", "state_mismatch", "login_failed"]) {
    clear();
    let operationCalls = 0;
    await assert.rejects(
      () => resumeYeeflowOAuthOperation(async () => { operationCalls += 1; }, {
        loadDotenv: false,
        startBrowserLogin: async () => ({ status, authenticated: false, message: status }),
      }),
      /browser login did not complete/i,
    );
    assert.equal(operationCalls, 0, `${status} must not execute the original operation`);
  }
}

function testCertificateAutomationIsUserLocal() {
  clear();
  fs.rmSync(path.dirname(certFile), { recursive: true, force: true });
  const config = localConfig();
  const result = ensureLocalOAuthCallbackCertificate(config, {
    execFileSync(_command, args) {
      fs.writeFileSync(args[args.indexOf("-keyout") + 1], "key");
      fs.writeFileSync(args[args.indexOf("-out") + 1], "cert");
    },
  });
  assert.equal(result.created, true);
  assert.equal(config.certFile, certFile);
  assert.equal(config.keyFile, keyFile);
  assert.equal(fs.existsSync(certFile), true);
  assert.equal(fs.existsSync(keyFile), true);
  assert.equal(certFile.includes(process.cwd()), false);
}

async function testBrowserFlowStateMismatchAndExchangeFailureAreFailClosed() {
  const config = localConfig();
  const mismatch = await startYeeflowOAuthBrowserLogin({
    config,
    ensureCertificate: () => {},
    openBrowser: () => true,
    startHttpsCallbackServer: async () => ({ redirectUri: "https://127.0.0.1:53720/callback", callback: Promise.reject(new Error("OAuth state mismatch.")), close() {} }),
  });
  assert.equal(mismatch.status, "state_mismatch");
  assert.equal(mismatch.authenticated, false);
  const exchangeFailure = await startYeeflowOAuthBrowserLogin({
    config,
    ensureCertificate: () => {},
    openBrowser: () => true,
    startHttpsCallbackServer: async ({ expectedState }) => ({ redirectUri: "https://127.0.0.1:53720/callback", callback: Promise.resolve({ code: "code-secret", state: expectedState, redirectUri: "https://127.0.0.1:53720/callback" }), close() {} }),
    fetchImpl: mockFetch({ error: "invalid_grant" }, { ok: false, status: 400 }),
  });
  assert.equal(exchangeFailure.status, "login_failed");
  assert.equal(exchangeFailure.authenticated, false);
}

function localConfig() {
  return resolveOAuthConfig(process.env);
}

function validToken(accessToken) {
  return { access_token: accessToken, refresh_token: "refresh-local", expires_at: new Date(Date.now() + 3600_000).toISOString(), token_type: "Bearer", scope: "basic_api openid offline_access" };
}

function expiredToken() {
  return { access_token: "expired-local", refresh_token: "refresh-local", expires_at: new Date(Date.now() - 3600_000).toISOString(), token_type: "Bearer", scope: "basic_api openid offline_access" };
}

function clear() {
  clearStoredToken(localConfig());
}

function mockFetch(payload, response = {}) {
  return async () => ({ ok: response.ok ?? true, status: response.status ?? 200, async text() { return JSON.stringify(payload); } });
}

#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  CALLBACK_PORTS,
  OAUTH_FLOW_CONFIDENTIAL_FALLBACK,
  OAUTH_FLOW_PKCE,
  authorizationCodeTokenBody,
  buildAuthorizationUrl,
  buildRedirectUri,
  clearStoredToken,
  createOAuthState,
  createPkcePair,
  exchangeAuthorizationCode,
  isTokenExpired,
  loadDotenvIntoEnv,
  loadStoredToken,
  normalizeTokenResponse,
  pickAvailableCallbackPort,
  redactSensitive,
  refreshAccessToken,
  refreshTokenBody,
  resolveOAuthConfig,
  saveStoredToken,
  summarizeStoredToken,
} from "./lib/yeeflow-oauth-client.mjs";
import { resolveYeeflowApiAuth } from "./lib/yeeflow-api-auth.mjs";

const ROOT = findRepoRoot(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-oauth-auth-test-"));
const tokenFile = path.join(tempDir, "token.json");

try {
  await testAuthorizationUrlGeneration();
  await testCallbackPortSelection();
  testStateGeneration();
  testStateMismatchShape();
  testPkceChallengeGeneration();
  testPkceTokenBodyHelpers();
  await testTokenExchangeRequestShape();
  await testTokenExchangeFallbackRequestShape();
  await testRefreshRequestShape();
  await testRefreshFallbackRequestShape();
  await testMissingClientSecretMessage();
  await testExpiredTokenRefreshBehavior();
  await testRefreshFailureClearsInvalidAuthState();
  testRedaction();
  testEnvLocalIgnored();
  testNoTokenSecretFilesTracked();
  testOAuthDefaultsWithoutEnv();
  await testOAuthAuthWithoutApiKey();
  await testOAuthPreferredOverApiKey();
  await testApiKeyFallback();
  console.log("yeeflow-oauth-auth tests passed");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

async function testAuthorizationUrlGeneration() {
  const config = testConfig();
  const state = "state-test";
  const pkce = createPkcePair();
  const redirectUri = buildRedirectUri(53720);
  const url = buildAuthorizationUrl(config, { redirectUri, state, codeChallenge: pkce.codeChallenge });
  assert.equal(url.origin + url.pathname, "https://login.yeeflow.com/connect/authorize");
  assert.equal(url.searchParams.get("client_id"), "266479ba-1f82-463b-856d-9a50b6166e0d");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("redirect_uri"), "https://127.0.0.1:53720/callback");
  assert.equal(url.searchParams.get("scope"), "basic_api openid offline_access");
  assert.equal(url.searchParams.get("state"), state);
  assert.equal(url.searchParams.get("code_challenge"), pkce.codeChallenge);
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
}

async function testCallbackPortSelection() {
  const blocker = net.createServer();
  await new Promise((resolve, reject) => {
    blocker.listen(53720, "127.0.0.1", resolve);
    blocker.once("error", reject);
  });
  try {
    const selected = await pickAvailableCallbackPort(CALLBACK_PORTS);
    assert.equal(selected, 53721);
  } finally {
    await new Promise((resolve) => blocker.close(resolve));
  }
}

function testStateGeneration() {
  const a = createOAuthState();
  const b = createOAuthState();
  assert.match(a, /^[A-Za-z0-9_-]{32,}$/);
  assert.notEqual(a, b);
}

function testStateMismatchShape() {
  const expected = createOAuthState();
  const returned = createOAuthState();
  assert.notEqual(returned, expected);
  assert.throws(() => {
    if (returned !== expected) throw new Error("OAuth state mismatch.");
  }, /state mismatch/);
}

function testPkceChallengeGeneration() {
  const pkce = createPkcePair();
  assert.match(pkce.codeVerifier, /^[A-Za-z0-9_-]{43,}$/);
  assert.match(pkce.codeChallenge, /^[A-Za-z0-9_-]{43,}$/);
  assert.equal(pkce.codeChallengeMethod, "S256");
  assert.notEqual(pkce.codeVerifier, pkce.codeChallenge);
}

function testPkceTokenBodyHelpers() {
  const config = testConfig();
  const codeBody = authorizationCodeTokenBody(config, {
    code: "auth-code-secret",
    redirectUri: buildRedirectUri(53722),
    codeVerifier: "verifier-secret",
  });
  assert.equal(codeBody.get("grant_type"), "authorization_code");
  assert.equal(codeBody.get("client_id"), config.clientId);
  assert.equal(codeBody.get("client_secret"), null);
  assert.equal(codeBody.get("code"), "auth-code-secret");
  assert.equal(codeBody.get("code_verifier"), "verifier-secret");

  const refreshBody = refreshTokenBody(config, { refresh_token: "refresh-secret" });
  assert.equal(refreshBody.get("grant_type"), "refresh_token");
  assert.equal(refreshBody.get("client_id"), config.clientId);
  assert.equal(refreshBody.get("client_secret"), null);
  assert.equal(refreshBody.get("refresh_token"), "refresh-secret");

  assert.equal(authorizationCodeTokenBody(config, {
    code: "auth-code-secret",
    redirectUri: buildRedirectUri(53722),
    codeVerifier: "verifier-secret",
    includeClientSecret: true,
  }).get("client_secret"), "test-client-secret");
  assert.equal(refreshTokenBody(config, { refresh_token: "refresh-secret" }, { includeClientSecret: true }).get("client_secret"), "test-client-secret");
}

async function testTokenExchangeRequestShape() {
  const config = resolveOAuthConfig({
    HOME: os.homedir(),
    YEEFLOW_OAUTH_TOKEN_FILE: tokenFile,
  });
  const calls = [];
  const token = await exchangeAuthorizationCode(config, {
    code: "auth-code-secret",
    redirectUri: buildRedirectUri(53722),
    codeVerifier: "verifier-secret",
  }, mockFetch(calls, { access_token: "access-secret", refresh_token: "refresh-secret", expires_in: 120, token_type: "Bearer", scope: "basic_api" }));
  assert.equal(token.access_token, "access-secret");
  assert.equal(calls[0].url, config.tokenUrl);
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].body.get("grant_type"), "authorization_code");
  assert.equal(calls[0].body.get("client_id"), config.clientId);
  assert.equal(calls[0].body.get("client_secret"), null);
  assert.equal(calls[0].body.get("code"), "auth-code-secret");
  assert.equal(calls[0].body.get("redirect_uri"), "https://127.0.0.1:53722/callback");
  assert.equal(calls[0].body.get("code_verifier"), "verifier-secret");
  assert.equal(token.oauth_flow, OAUTH_FLOW_PKCE);
}

async function testTokenExchangeFallbackRequestShape() {
  const config = testConfig();
  const calls = [];
  const token = await exchangeAuthorizationCode(config, {
    code: "auth-code-secret",
    redirectUri: buildRedirectUri(53722),
    codeVerifier: "verifier-secret",
  }, sequenceFetch(calls, [
    { payload: { error: "invalid_request" }, response: { ok: false, status: 400 } },
    { payload: { access_token: "access-secret", refresh_token: "refresh-secret", expires_in: 120, token_type: "Bearer", scope: "basic_api" } },
  ]));
  assert.equal(calls.length, 2);
  assert.equal(calls[0].body.get("client_secret"), null);
  assert.equal(calls[1].body.get("client_secret"), "test-client-secret");
  assert.equal(calls[1].body.get("code_verifier"), "verifier-secret");
  assert.equal(token.oauth_flow, OAUTH_FLOW_CONFIDENTIAL_FALLBACK);
}

async function testRefreshRequestShape() {
  const config = resolveOAuthConfig({
    HOME: os.homedir(),
    YEEFLOW_OAUTH_TOKEN_FILE: tokenFile,
  });
  const calls = [];
  const refreshed = await refreshAccessToken(config, {
    refresh_token: "refresh-secret",
    scope: "basic_api openid offline_access",
  }, mockFetch(calls, { access_token: "new-access-secret", expires_in: 120, token_type: "Bearer" }));
  assert.equal(calls[0].body.get("grant_type"), "refresh_token");
  assert.equal(calls[0].body.get("client_id"), config.clientId);
  assert.equal(calls[0].body.get("client_secret"), null);
  assert.equal(calls[0].body.get("refresh_token"), "refresh-secret");
  assert.equal(calls[0].body.get("scope"), "basic_api openid offline_access");
  assert.equal(refreshed.oauth_refresh_flow, OAUTH_FLOW_PKCE);
}

async function testRefreshFallbackRequestShape() {
  const config = testConfig();
  const calls = [];
  const refreshed = await refreshAccessToken(config, {
    refresh_token: "refresh-secret",
    scope: "basic_api openid offline_access",
  }, sequenceFetch(calls, [
    { payload: { error: "invalid_client" }, response: { ok: false, status: 400 } },
    { payload: { access_token: "new-access-secret", expires_in: 120, token_type: "Bearer" } },
  ]));
  assert.equal(calls.length, 2);
  assert.equal(calls[0].body.get("client_secret"), null);
  assert.equal(calls[1].body.get("client_secret"), "test-client-secret");
  assert.equal(refreshed.oauth_refresh_flow, OAUTH_FLOW_CONFIDENTIAL_FALLBACK);
}

async function testMissingClientSecretMessage() {
  const config = resolveOAuthConfig({
    HOME: os.homedir(),
    YEEFLOW_OAUTH_TOKEN_FILE: tokenFile,
  });
  await assert.rejects(
    () => refreshAccessToken(config, { refresh_token: "refresh-secret" }, mockFetch([], {})),
    /no-secret refresh failed and no local client secret fallback is configured.*YEEFLOW_OAUTH_CLIENT_SECRET/,
  );
}

async function testExpiredTokenRefreshBehavior() {
  const config = testConfig();
  saveStoredToken(config, {
    access_token: "expired-access",
    refresh_token: "refresh-secret",
    expires_at: new Date(Date.now() - 60_000).toISOString(),
    token_type: "Bearer",
    scope: "basic_api",
  });
  const originalEnv = process.env;
  process.env = {
    HOME: os.homedir(),
    YEEFLOW_API_BASE_URL: "https://api.yeeflow.com/v1",
    YEEFLOW_API_KEY: "legacy-secret",
    YEEFLOW_OAUTH_CLIENT_SECRET: "test-client-secret",
    YEEFLOW_OAUTH_TOKEN_FILE: tokenFile,
  };
  try {
    const calls = [];
    const auth = await resolveYeeflowApiAuth({
      loadDotenv: false,
      fetchImpl: mockFetch(calls, { access_token: "fresh-access", refresh_token: "fresh-refresh", expires_in: 120, token_type: "Bearer" }),
    });
    assert.equal(auth.mode, "oauth");
    assert.equal(auth.refreshed, true);
    assert.equal(auth.headers.Authorization, "Bearer fresh-access");
    assert.equal(loadStoredToken(config).access_token, "fresh-access");
  } finally {
    process.env = originalEnv;
    clearStoredToken(config);
  }
}

async function testRefreshFailureClearsInvalidAuthState() {
  const config = testConfig();
  saveStoredToken(config, {
    access_token: "expired-access",
    refresh_token: "refresh-secret",
    expires_at: new Date(Date.now() - 60_000).toISOString(),
    token_type: "Bearer",
    scope: "basic_api",
  });
  const originalEnv = process.env;
  process.env = {
    HOME: os.homedir(),
    YEEFLOW_API_BASE_URL: "https://api.yeeflow.com/v1",
    YEEFLOW_API_KEY: "legacy-secret",
    YEEFLOW_OAUTH_CLIENT_SECRET: "test-client-secret",
    YEEFLOW_OAUTH_TOKEN_FILE: tokenFile,
  };
  try {
    const auth = await resolveYeeflowApiAuth({
      loadDotenv: false,
      fetchImpl: mockFetch([], { error: "invalid_grant" }, { ok: false, status: 400 }),
    });
    assert.equal(auth.mode, "apiKey");
    assert.equal(fs.existsSync(tokenFile), false);
  } finally {
    process.env = originalEnv;
  }
}

function testRedaction() {
  const bearerFixture = ["abc", "def", "ghi"].join(".");
  const redacted = redactSensitive({
    access_token: "access-secret",
    client_secret: "client-secret",
    nested: `Authorization: Bearer ${bearerFixture} client_secret=client-secret code=abc123`,
  }, ["client-secret"]);
  const text = JSON.stringify(redacted);
  assert.equal(text.includes("access-secret"), false);
  assert.equal(text.includes("client-secret"), false);
  assert.equal(text.includes("abc.def.ghi"), false);
  assert.equal(text.includes("code=abc123"), false);
}

function testEnvLocalIgnored() {
  const result = spawnSync("git", ["check-ignore", ".env.local", ".yeeflow-oauth/local-key.pem"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\.env\.local/);
  assert.match(result.stdout, /\.yeeflow-oauth\/local-key\.pem/);
}

function testNoTokenSecretFilesTracked() {
  const result = spawnSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.includes(".env.local"), false);
  assert.equal(result.stdout.includes(".yeeflow-oauth"), false);
  assert.equal(result.stdout.includes("codex-oauth-token.json"), false);
}

function testOAuthDefaultsWithoutEnv() {
  const config = resolveOAuthConfig({
    HOME: os.homedir(),
    YEEFLOW_OAUTH_TOKEN_FILE: tokenFile,
  });
  assert.equal(config.clientId, "266479ba-1f82-463b-856d-9a50b6166e0d");
  assert.equal(config.authUrl, "https://login.yeeflow.com/connect/authorize");
  assert.equal(config.tokenUrl, "https://login.yeeflow.com/connect/token");
  assert.equal(config.scopes, "basic_api openid offline_access");
  assert.equal(config.sources.clientId, "plugin-default");
  assert.equal(config.sources.authUrl, "plugin-default");
  assert.equal(config.sources.tokenUrl, "plugin-default");
  assert.equal(config.sources.scopes, "plugin-default");
  assert.equal(config.sources.clientSecret, "not-configured");
}

async function testOAuthAuthWithoutApiKey() {
  const config = testConfig();
  saveStoredToken(config, normalizeTokenResponse({
    access_token: "valid-access-no-api-key",
    refresh_token: "valid-refresh-no-api-key",
    expires_in: 3600,
    token_type: "Bearer",
  }));
  const originalEnv = process.env;
  process.env = {
    HOME: os.homedir(),
    YEEFLOW_OAUTH_TOKEN_FILE: tokenFile,
  };
  try {
    const auth = await resolveYeeflowApiAuth({ loadDotenv: false });
    assert.equal(auth.mode, "oauth");
    assert.equal(auth.env.apiBaseUrl, "https://api.yeeflow.com/v1");
    assert.equal(auth.env.apiKey, "");
    assert.equal(auth.headers.Authorization, "Bearer valid-access-no-api-key");
    assert.equal(auth.headers.apiKey, undefined);
  } finally {
    process.env = originalEnv;
    clearStoredToken(config);
  }
}

async function testOAuthPreferredOverApiKey() {
  const config = testConfig();
  saveStoredToken(config, normalizeTokenResponse({
    access_token: "valid-access",
    refresh_token: "valid-refresh",
    expires_in: 3600,
    token_type: "Bearer",
  }));
  const originalEnv = process.env;
  process.env = {
    HOME: os.homedir(),
    YEEFLOW_API_BASE_URL: "https://api.yeeflow.com/v1",
    YEEFLOW_API_KEY: "legacy-secret",
    YEEFLOW_OAUTH_TOKEN_FILE: tokenFile,
  };
  try {
    const auth = await resolveYeeflowApiAuth({ loadDotenv: false });
    assert.equal(auth.mode, "oauth");
    assert.equal(auth.headers.Authorization, "Bearer valid-access");
    assert.equal(auth.headers.apiKey, undefined);
  } finally {
    process.env = originalEnv;
    clearStoredToken(config);
  }
}

async function testApiKeyFallback() {
  const originalEnv = process.env;
  process.env = {
    YEEFLOW_API_BASE_URL: "https://api.yeeflow.com/v1",
    YEEFLOW_API_KEY: "legacy-secret",
    YEEFLOW_OAUTH_TOKEN_FILE: path.join(tempDir, "missing-token.json"),
  };
  try {
    const auth = await resolveYeeflowApiAuth({ loadDotenv: false });
    assert.equal(auth.mode, "apiKey");
    assert.equal(auth.headers.apiKey, "legacy-secret");
  } finally {
    process.env = originalEnv;
  }
}

function testConfig() {
  return resolveOAuthConfig({
    HOME: os.homedir(),
    YEEFLOW_OAUTH_CLIENT_SECRET: "test-client-secret",
    YEEFLOW_OAUTH_TOKEN_FILE: tokenFile,
  });
}

function mockFetch(calls, payload, response = {}) {
  return async (url, options) => {
    calls.push({ url, options, body: options.body });
    return {
      ok: response.ok ?? true,
      status: response.status ?? 200,
      async text() {
        return JSON.stringify(payload);
      },
    };
  };
}

function sequenceFetch(calls, results) {
  let index = 0;
  return async (url, options) => {
    calls.push({ url, options, body: options.body });
    const next = results[index++] || results.at(-1);
    return {
      ok: next.response?.ok ?? true,
      status: next.response?.status ?? 200,
      async text() {
        return JSON.stringify(next.payload);
      },
    };
  };
}

function findRepoRoot(startDir) {
  let current = startDir;
  while (current && current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, ".git"))) return current;
    current = path.dirname(current);
  }
  return startDir;
}

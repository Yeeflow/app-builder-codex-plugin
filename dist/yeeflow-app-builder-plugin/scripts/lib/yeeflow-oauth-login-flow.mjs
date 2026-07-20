import { spawn } from "node:child_process";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  buildAuthorizationUrl,
  clearStoredToken,
  createOAuthState,
  createPkcePair,
  exchangeAuthorizationCode,
  isTokenExpired,
  loadStoredToken,
  refreshAccessToken,
  resolveOAuthConfig,
  saveStoredToken,
  startHttpsCallbackServer,
  summarizeStoredToken,
  redactSensitive,
} from "./yeeflow-oauth-client.mjs";

/**
 * Host-only OAuth browser login orchestration.
 *
 * This module is intentionally outside every Core package. It owns local HTTPS
 * callback credentials and local OAuth token storage, neither of which is part
 * of a Plugin archive, a Core distribution artifact, or a materialized package.
 */
export async function startYeeflowOAuthBrowserLogin(options = {}) {
  const config = options.config || resolveOAuthConfig(options.env || process.env, options);
  const ensureCertificate = options.ensureCertificate || ensureLocalOAuthCallbackCertificate;
  const open = options.openBrowser || openBrowser;
  const startCallback = options.startHttpsCallbackServer || startHttpsCallbackServer;
  const timeoutMs = options.timeoutMs;

  try {
    ensureCertificate(config, options);
  } catch (error) {
    return safeResult("certificate_unavailable", error);
  }

  const state = createOAuthState();
  const pkce = createPkcePair();
  let callbackServer;
  try {
    callbackServer = await startCallback(config, { expectedState: state, timeoutMs });
    const authUrl = buildAuthorizationUrl(config, {
      redirectUri: callbackServer.redirectUri,
      state,
      codeChallenge: pkce.codeChallenge,
    });
    if (!open(authUrl.toString())) {
      callbackServer.close();
      return {
        status: "browser_unavailable",
        authenticated: false,
        message: "Yeeflow authorization could not be opened in the local browser.",
      };
    }

    const callback = await callbackServer.callback;
    const token = await exchangeAuthorizationCode(config, {
      code: callback.code,
      redirectUri: callback.redirectUri,
      codeVerifier: pkce.codeVerifier,
    }, options.fetchImpl || fetch);
    saveStoredToken(config, token);
    const summary = summarizeStoredToken(config, token);
    return {
      status: "authenticated",
      authenticated: true,
      expiresAt: summary.expiresAt || null,
      scope: summary.scope || null,
      message: "Yeeflow login completed. You can retry the original operation.",
    };
  } catch (error) {
    callbackServer?.close();
    return safeResult(loginFailureStatus(error), error);
  }
}

/**
 * Return a safe, fail-closed local status. An expired
 * token is refreshed once when possible; an expired token without a successful
 * refresh is removed so callers cannot accidentally use stale credentials.
 */
export async function getYeeflowOAuthLoginStatus(options = {}) {
  const config = options.config || resolveOAuthConfig(options.env || process.env, options);
  let token;
  try {
    token = loadStoredToken(config);
  } catch (error) {
    return safeResult("storage_invalid", error);
  }
  if (!token?.access_token) {
    return {
      status: "signed_out",
      authenticated: false,
      message: "Yeeflow is not signed in. The next authorized Yeeflow API operation starts browser login automatically.",
    };
  }
  if (!isTokenExpired(token)) return safeAuthenticatedStatus(config, token, "authenticated");

  if (token.refresh_token) {
    try {
      const refreshed = await refreshAccessToken(config, token, options.fetchImpl || fetch);
      saveStoredToken(config, refreshed);
      return safeAuthenticatedStatus(config, refreshed, "refreshed");
    } catch (error) {
      clearStoredToken(config);
      return safeResult("refresh_failed", error);
    }
  }

  clearStoredToken(config);
  return {
    status: "expired",
    authenticated: false,
    message: "The Yeeflow login expired and was cleared. The next authorized Yeeflow API operation starts browser login automatically.",
  };
}

export function ensureLocalOAuthCallbackCertificate(config, options = {}) {
  const certFile = path.resolve(config.certFile);
  const keyFile = path.resolve(config.keyFile);
  const certExists = fs.existsSync(certFile);
  const keyExists = fs.existsSync(keyFile);
  if (certExists && keyExists) return { created: false, certFile, keyFile };
  if (certExists || keyExists) {
    throw new Error("The local OAuth callback certificate and private key must be created together. Remove the incomplete local pair and retry.");
  }

  const directory = path.dirname(certFile);
  if (directory !== path.dirname(keyFile)) {
    throw new Error("The local OAuth callback certificate and private key must use the same user-local directory.");
  }
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const exec = options.execFileSync || execFileSync;
  try {
    exec("openssl", [
      "req", "-x509", "-newkey", "rsa:2048", "-sha256", "-nodes",
      "-keyout", keyFile,
      "-out", certFile,
      "-days", "7",
      "-subj", "/CN=127.0.0.1",
      "-addext", "subjectAltName=IP:127.0.0.1",
    ], { stdio: "ignore" });
    fs.chmodSync(keyFile, 0o600);
    fs.chmodSync(certFile, 0o600);
  } catch (error) {
    for (const candidate of [certFile, keyFile]) {
      try { fs.rmSync(candidate, { force: true }); } catch { /* Cleanup is best effort. */ }
    }
    throw new Error(`A local HTTPS callback certificate could not be created: ${redactSensitive(error?.message || String(error))}`);
  }
  return { created: true, certFile, keyFile };
}

export function openBrowser(url) {
  const platform = process.platform;
  const command = platform === "darwin" ? "open" : platform === "win32" ? "cmd" : "xdg-open";
  const args = platform === "win32" ? ["/c", "start", "", url] : [url];
  try {
    const child = spawn(command, args, { detached: true, stdio: "ignore" });
    child.unref();
    return true;
  } catch {
    return false;
  }
}

function safeAuthenticatedStatus(config, token, status) {
  const summary = summarizeStoredToken(config, token);
  return {
    status,
    authenticated: true,
    expiresAt: summary.expiresAt || null,
    scope: summary.scope || null,
    message: status === "refreshed"
      ? "Yeeflow login was refreshed."
      : "Yeeflow is signed in.",
  };
}

function loginFailureStatus(error) {
  const message = String(error?.message || error || "").toLowerCase();
  if (message.includes("timed out")) return "timeout";
  if (message.includes("provider returned error") || message.includes("not completed")) return "cancelled";
  if (message.includes("state mismatch")) return "state_mismatch";
  return "login_failed";
}

function safeResult(status, error) {
  const detail = redactSensitive(error?.message || String(error || "Unknown OAuth failure"));
  return {
    status,
    authenticated: false,
    message: `Yeeflow login did not complete safely: ${detail}`,
  };
}

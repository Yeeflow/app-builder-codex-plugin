import crypto from "node:crypto";
import fs from "node:fs";
import https from "node:https";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadDotenvFile, parseDotenvValue } from "../yeeflow-env-utils.mjs";

export const DEFAULT_OAUTH_CLIENT_ID = "266479ba-1f82-463b-856d-9a50b6166e0d";
export const DEFAULT_OAUTH_AUTH_URL = "https://login.yeeflow.com/connect/authorize";
export const DEFAULT_OAUTH_TOKEN_URL = "https://login.yeeflow.com/connect/token";
export const DEFAULT_OAUTH_SCOPES = "basic_api openid offline_access";
export const CALLBACK_HOST = "127.0.0.1";
export const CALLBACK_PATH = "/callback";
export const CALLBACK_PORTS = [53720, 53721, 53722, 53723, 53724];
export const TOKEN_EXPIRY_SKEW_MS = 60_000;

const SENSITIVE_KEY_RE = /(access[_-]?token|refresh[_-]?token|id[_-]?token|client[_-]?secret|authorization|cookie|code_verifier|code|api[_-]?key)/i;

export function loadLocalEnv(dotenvPath = ".env.local") {
  return loadDotenvFile(fs, dotenvPath);
}

export function loadDotenvIntoEnv(filePath, env = {}) {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (env[key] !== undefined) continue;
    env[key] = parseDotenvValue(rawValue);
  }
  return true;
}

export function resolveOAuthConfig(env = process.env, options = {}) {
  const clientId = nonEmpty(env.YEEFLOW_OAUTH_CLIENT_ID, DEFAULT_OAUTH_CLIENT_ID);
  return {
    clientId,
    clientSecret: env.YEEFLOW_OAUTH_CLIENT_SECRET || "",
    authUrl: normalizeHttpsUrl(nonEmpty(env.YEEFLOW_OAUTH_AUTH_URL, DEFAULT_OAUTH_AUTH_URL), "YEEFLOW_OAUTH_AUTH_URL"),
    tokenUrl: normalizeHttpsUrl(nonEmpty(env.YEEFLOW_OAUTH_TOKEN_URL, DEFAULT_OAUTH_TOKEN_URL), "YEEFLOW_OAUTH_TOKEN_URL"),
    scopes: nonEmpty(env.YEEFLOW_OAUTH_SCOPES, DEFAULT_OAUTH_SCOPES),
    callbackHost: CALLBACK_HOST,
    callbackPath: CALLBACK_PATH,
    callbackPorts: CALLBACK_PORTS,
    tokenFile: resolveTokenFile(env, options),
    certFile: env.YEEFLOW_OAUTH_CALLBACK_CERT_FILE || path.resolve(process.cwd(), ".yeeflow-oauth", "localhost-cert.pem"),
    keyFile: env.YEEFLOW_OAUTH_CALLBACK_KEY_FILE || path.resolve(process.cwd(), ".yeeflow-oauth", "localhost-key.pem"),
  };
}

export function createOAuthState() {
  return base64Url(crypto.randomBytes(32));
}

export function createPkcePair() {
  const codeVerifier = base64Url(crypto.randomBytes(48));
  const codeChallenge = base64Url(crypto.createHash("sha256").update(codeVerifier).digest());
  return { codeVerifier, codeChallenge, codeChallengeMethod: "S256" };
}

export function buildRedirectUri(port) {
  if (!CALLBACK_PORTS.includes(Number(port))) throw new Error("OAuth callback port must be one of 53720-53724.");
  return `https://${CALLBACK_HOST}:${port}${CALLBACK_PATH}`;
}

export function buildAuthorizationUrl(config, { redirectUri, state, codeChallenge }) {
  if (!state) throw new Error("OAuth state is required.");
  if (!codeChallenge) throw new Error("OAuth PKCE code challenge is required.");
  const url = new URL(config.authUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", config.scopes);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url;
}

export async function pickAvailableCallbackPort(ports = CALLBACK_PORTS) {
  for (const port of ports) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error("No OAuth callback port is available in 53720-53724.");
}

export async function startHttpsCallbackServer(config, { expectedState, timeoutMs = 180_000 } = {}) {
  assertCallbackCertificate(config);
  const port = await pickAvailableCallbackPort(config.callbackPorts);
  const redirectUri = buildRedirectUri(port);
  const server = https.createServer({
    cert: fs.readFileSync(config.certFile),
    key: fs.readFileSync(config.keyFile),
  });

  let timer;
  const callback = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      closeServer(server);
      reject(new Error("OAuth login timed out waiting for browser callback."));
    }, timeoutMs);

    server.on("request", (req, res) => {
      try {
        const url = new URL(req.url || "/", redirectUri);
        if (url.pathname !== CALLBACK_PATH) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not found");
          return;
        }
        const returnedState = url.searchParams.get("state") || "";
        if (returnedState !== expectedState) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("OAuth state mismatch. Return to Codex and retry login.");
          throw new Error("OAuth state mismatch.");
        }
        const providerError = url.searchParams.get("error");
        if (providerError) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("OAuth login was not completed. Return to Codex for the safe error summary.");
          throw new Error(`OAuth provider returned error: ${providerError}`);
        }
        const code = url.searchParams.get("code") || "";
        if (!code) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("OAuth callback did not include an authorization code.");
          throw new Error("OAuth callback did not include an authorization code.");
        }
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Yeeflow OAuth login succeeded. You can close this browser tab and return to Codex.");
        clearTimeout(timer);
        closeServer(server);
        resolve({ code, state: returnedState, redirectUri });
      } catch (error) {
        clearTimeout(timer);
        closeServer(server);
        reject(error);
      }
    });

    server.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });

  await new Promise((resolve, reject) => {
    server.listen(port, CALLBACK_HOST, () => resolve());
    server.once("error", reject);
  });

  return { port, redirectUri, callback, close: () => closeServer(server) };
}

export async function exchangeAuthorizationCode(config, { code, redirectUri, codeVerifier }, fetchImpl = fetch) {
  requireClientSecret(config);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });
  return normalizeTokenResponse(await postTokenRequest(config.tokenUrl, body, fetchImpl), config.scopes);
}

export async function refreshAccessToken(config, tokenRecord, fetchImpl = fetch) {
  requireClientSecret(config);
  if (!tokenRecord?.refresh_token) throw new Error("No refresh token is available. Run OAuth login again.");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: tokenRecord.refresh_token,
    scope: config.scopes,
  });
  const refreshed = normalizeTokenResponse(await postTokenRequest(config.tokenUrl, body, fetchImpl), tokenRecord.scope || config.scopes);
  if (!refreshed.refresh_token) refreshed.refresh_token = tokenRecord.refresh_token;
  if (!refreshed.id_token && tokenRecord.id_token) refreshed.id_token = tokenRecord.id_token;
  return refreshed;
}

export async function postTokenRequest(tokenUrl, body, fetchImpl = fetch) {
  const response = await fetchImpl(tokenUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const text = await response.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }
  if (!response.ok) {
    const message = parsed?.error_description || parsed?.error || `HTTP ${response.status}`;
    throw new Error(redactSensitive(`OAuth token request failed: ${message}`));
  }
  if (!parsed || typeof parsed !== "object") throw new Error("OAuth token response was not JSON.");
  return parsed;
}

export function normalizeTokenResponse(response, fallbackScope = DEFAULT_OAUTH_SCOPES, now = Date.now()) {
  if (!response.access_token) throw new Error("OAuth token response did not include an access token.");
  const expiresIn = Number(response.expires_in || 3600);
  return {
    access_token: String(response.access_token),
    refresh_token: response.refresh_token ? String(response.refresh_token) : "",
    expires_at: new Date(now + expiresIn * 1000).toISOString(),
    token_type: String(response.token_type || "Bearer"),
    scope: String(response.scope || fallbackScope || ""),
    id_token: response.id_token ? String(response.id_token) : undefined,
    obtained_at: new Date(now).toISOString(),
  };
}

export function loadStoredToken(config) {
  if (!fs.existsSync(config.tokenFile)) return null;
  const text = fs.readFileSync(config.tokenFile, "utf8");
  const parsed = JSON.parse(text);
  return parsed && typeof parsed === "object" ? parsed : null;
}

export function saveStoredToken(config, tokenRecord) {
  fs.mkdirSync(path.dirname(config.tokenFile), { recursive: true, mode: 0o700 });
  const tmp = `${config.tokenFile}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(tokenRecord, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(tmp, config.tokenFile);
  try {
    fs.chmodSync(config.tokenFile, 0o600);
  } catch {
    // Best-effort on platforms that support POSIX modes.
  }
  return config.tokenFile;
}

export function clearStoredToken(config) {
  if (fs.existsSync(config.tokenFile)) fs.rmSync(config.tokenFile, { force: true });
}

export function tokenExpiresAt(tokenRecord) {
  const time = Date.parse(tokenRecord?.expires_at || "");
  return Number.isFinite(time) ? time : 0;
}

export function isTokenExpired(tokenRecord, now = Date.now(), skewMs = TOKEN_EXPIRY_SKEW_MS) {
  return tokenExpiresAt(tokenRecord) <= now + skewMs;
}

export function summarizeStoredToken(config, tokenRecord = loadStoredToken(config), now = Date.now()) {
  if (!tokenRecord) return { authenticated: false, tokenFile: config.tokenFile, tokenFilePresent: false };
  return {
    authenticated: !isTokenExpired(tokenRecord, now),
    tokenFile: config.tokenFile,
    tokenFilePresent: true,
    tokenType: tokenRecord.token_type || null,
    scope: tokenRecord.scope || null,
    expiresAt: tokenRecord.expires_at || null,
    expired: isTokenExpired(tokenRecord, now, 0),
    refreshTokenPresent: Boolean(tokenRecord.refresh_token),
    idTokenPresent: Boolean(tokenRecord.id_token),
  };
}

export function redactSensitive(value, extraSecrets = []) {
  const secrets = extraSecrets.filter((item) => typeof item === "string" && item.length >= 4);
  if (typeof value === "string") {
    let out = value;
    for (const secret of secrets) out = out.split(secret).join("[redacted]");
    out = out.replace(/Authorization\s*:\s*Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Authorization: Bearer [redacted]");
    out = out.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]");
    out = out.replace(/(access_token|refresh_token|id_token|client_secret|code|apiKey|api_key)=([^&\s]+)/gi, "$1=[redacted]");
    return out;
  }
  if (Array.isArray(value)) return value.map((item) => redactSensitive(item, secrets));
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = SENSITIVE_KEY_RE.test(key) ? "[redacted]" : redactSensitive(child, secrets);
    }
    return out;
  }
  return value;
}

export function assertCallbackCertificate(config) {
  if (!fs.existsSync(config.certFile) || !fs.existsSync(config.keyFile)) {
    throw new Error(
      [
        "OAuth browser login requires a local HTTPS callback certificate for https://127.0.0.1.",
        `Expected certificate: ${config.certFile}`,
        `Expected private key: ${config.keyFile}`,
        "Create local development cert/key files outside Git-tracked content, or set YEEFLOW_OAUTH_CALLBACK_CERT_FILE and YEEFLOW_OAUTH_CALLBACK_KEY_FILE.",
        "Do not commit certificate private keys.",
      ].join("\n"),
    );
  }
}

function resolveTokenFile(env, options) {
  if (options.tokenFile) return path.resolve(options.tokenFile);
  if (env.YEEFLOW_OAUTH_TOKEN_FILE) return path.resolve(env.YEEFLOW_OAUTH_TOKEN_FILE);
  const home = env.HOME || os.homedir();
  return path.join(home, ".yeeflow", "codex-oauth-token.json");
}

function requireClientSecret(config) {
  if (!config.clientSecret) {
    throw new Error("YEEFLOW_OAUTH_CLIENT_SECRET is required for OAuth token exchange or refresh. Store it locally; do not paste it into chat.");
  }
}

function normalizeHttpsUrl(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL.`);
  }
  if (url.protocol !== "https:") throw new Error(`${label} must use https.`);
  return url.toString();
}

function nonEmpty(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function base64Url(buffer) {
  return Buffer.from(buffer).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, CALLBACK_HOST);
  });
}

function closeServer(server) {
  try {
    server.close();
  } catch {
    // Already closed.
  }
}

export function isMainModule(importMetaUrl) {
  return importMetaUrl === fileURLToPath(import.meta.url);
}

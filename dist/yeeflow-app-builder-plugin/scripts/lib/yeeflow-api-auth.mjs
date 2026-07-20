import fs from "node:fs";
import { environmentPresence, loadDotenvFile, resolveYeeflowEnvironment } from "../yeeflow-env-utils.mjs";
import {
  clearStoredToken,
  isTokenExpired,
  loadStoredToken,
  redactSensitive,
  refreshAccessToken,
  resolveOAuthConfig,
  saveStoredToken,
  summarizeStoredToken,
} from "./yeeflow-oauth-client.mjs";
import { startYeeflowOAuthBrowserLogin } from "./yeeflow-oauth-login-flow.mjs";
import { resolveTenantUrlFromTokenOrEnv } from "./yeeflow-oauth-token-claims.mjs";

export async function resolveYeeflowApiAuth(options = {}) {
  const dotenv = options.dotenv || ".env.local";
  if (options.loadDotenv !== false) loadDotenvFile(fs, dotenv);
  const env = resolveYeeflowEnvironment(process.env);
  const oauthConfig = resolveOAuthConfig(process.env);
  const token = loadStoredToken(oauthConfig);
  applyOAuthTenantContext(env, token);
  const oauthSummary = summarizeStoredToken(oauthConfig, token);

  if (token?.access_token) {
    if (!isTokenExpired(token)) {
      return {
        mode: "oauth",
        env,
        oauth: oauthSummary,
        headers: { Authorization: `${token.token_type || "Bearer"} ${token.access_token}` },
      };
    }
    if (token.refresh_token && options.refresh !== false) {
      try {
        const refreshed = await refreshAccessToken(oauthConfig, token, options.fetchImpl || fetch);
        saveStoredToken(oauthConfig, refreshed);
        applyOAuthTenantContext(env, refreshed);
        return {
          mode: "oauth",
          env,
          oauth: summarizeStoredToken(oauthConfig, refreshed),
          refreshed: true,
          headers: { Authorization: `${refreshed.token_type || "Bearer"} ${refreshed.access_token}` },
        };
      } catch (error) {
        clearStoredToken(oauthConfig);
        if (!env.apiKey && options.onDemandLogin !== true) throw new Error(redactSensitive(`OAuth refresh failed and no legacy API key fallback is configured: ${error.message}`));
      }
    }
  }

  if (options.onDemandLogin === true) {
    const login = await (options.startBrowserLogin || startYeeflowOAuthBrowserLogin)({
      config: oauthConfig,
      fetchImpl: options.fetchImpl || fetch,
      timeoutMs: options.loginTimeoutMs,
      openBrowser: options.openBrowser,
      ensureCertificate: options.ensureCertificate,
      startHttpsCallbackServer: options.startHttpsCallbackServer,
    });
    if (!login.authenticated) {
      return {
        mode: "none",
        env,
        oauth: summarizeStoredToken(oauthConfig),
        headers: {},
        login,
      };
    }
    const resumed = await resolveYeeflowApiAuth({
      ...options,
      loadDotenv: false,
      onDemandLogin: false,
      oauthOnly: true,
    });
    if (resumed.mode !== "oauth") {
      clearStoredToken(oauthConfig);
      return {
        mode: "none",
        env,
        oauth: summarizeStoredToken(oauthConfig),
        headers: {},
        login: {
          status: "post_login_auth_unavailable",
          authenticated: false,
          message: "Yeeflow login completed but a valid local OAuth authorization was not available for the original operation.",
        },
      };
    }
    return {
      ...resumed,
      login: {
        status: "authenticated",
        authenticated: true,
        resumedOperation: true,
      },
      resumedAfterLogin: true,
    };
  }

  if (env.apiKey && options.oauthOnly !== true) {
    return {
      mode: "apiKey",
      env,
      oauth: oauthSummary,
      headers: { apiKey: env.apiKey },
    };
  }

  return {
    mode: "none",
    env,
    oauth: oauthSummary,
    headers: {},
  };
}

export function applyOAuthTenantContext(env, tokenRecord) {
  const resolved = resolveTenantUrlFromTokenOrEnv(tokenRecord, env);
  if (resolved.tenantUrl) {
    env.tenantUrl = resolved.tenantUrl;
    env.tenantUrlSource = resolved.source;
  } else if (!env.tenantUrlSource) {
    env.tenantUrlSource = resolved.source;
  }
  env.oauthTenantContext = resolved.context;
  env.tenantContextMessage = resolved.message || "";
  return env;
}

export async function requireYeeflowApiAuth(options = {}) {
  const auth = await resolveYeeflowApiAuth({ ...options, onDemandLogin: options.onDemandLogin ?? options.allowLegacyApiKey !== true, oauthOnly: options.allowLegacyApiKey !== true });
  if (auth.mode === "apiKey" && options.allowLegacyApiKey === true) {
    return auth;
  }
  if (auth.mode !== "oauth") {
    throw new Error(pluginLoginRequiredMessage());
  }
  return auth;
}

export async function requireYeeflowOAuthAuth(options = {}) {
  const auth = await resolveYeeflowApiAuth({ ...options, onDemandLogin: options.onDemandLogin !== false, oauthOnly: true });
  if (auth.mode !== "oauth") {
    throw new Error(pluginLoginRequiredMessage("Yeeflow OAuth authentication is required."));
  }
  return auth;
}

export async function resumeYeeflowOAuthOperation(operation, options = {}) {
  if (typeof operation !== "function") throw new Error("Yeeflow OAuth resume requires an operation function.");
  const auth = await requireYeeflowOAuthAuth(options);
  return await operation(auth);
}

export function authPresenceSummary(auth) {
  return {
    mode: auth.mode,
    environment: environmentPresence(auth.env),
    oauth: {
      tokenFilePresent: Boolean(auth.oauth?.tokenFilePresent),
      authenticated: Boolean(auth.oauth?.authenticated),
      expired: Boolean(auth.oauth?.expired),
      refreshTokenPresent: Boolean(auth.oauth?.refreshTokenPresent),
      expiresAt: auth.oauth?.expiresAt || null,
      clientIdSource: auth.oauth?.configSources?.clientId || null,
      authUrlSource: auth.oauth?.configSources?.authUrl || null,
      tokenUrlSource: auth.oauth?.configSources?.tokenUrl || null,
      scopesSource: auth.oauth?.configSources?.scopes || null,
      tokenContext: auth.oauth?.tokenContext || auth.env?.oauthTenantContext || null,
    },
  };
}

export function mergeAuthHeaders(auth, headers = {}) {
  return { ...headers, ...auth.headers };
}

export function safeAuthError(error) {
  return redactSensitive(error?.message || String(error || "Unknown Yeeflow API authentication error"));
}

export function pluginLoginRequiredMessage(prefix = "Yeeflow API authentication is not configured.") {
  return `${prefix} Yeeflow browser login did not complete, so the original operation was not sent.`;
}

export function pluginLoginUnavailableMessage() {
  return "I need Yeeflow login before I can continue, but the local browser-login flow did not complete safely. The original operation was not sent.";
}

export function buildLoginRequiredResult({
  auth = null,
  originalOperation = "",
  originalCapability = "",
  originalEndpoint = "",
  capability = null,
} = {}) {
  const result = {
    resultClass: "auth_required",
    reason: "login_flow_required",
    liveCall: false,
    requestShaped: false,
    rawResponsePrinted: false,
    login: {
      required: true,
      flow: "on-demand-browser-pkce",
      message: "Yeeflow browser login did not complete, so the original operation was not sent.",
      unavailableMessage: pluginLoginUnavailableMessage(),
      retry: "The original operation is retried once automatically only after a successful browser login.",
    },
    auth: auth ? authRequiredStatusSummary(auth) : null,
  };
  if (originalOperation) result.originalOperation = originalOperation;
  if (originalCapability) result.originalCapability = originalCapability;
  if (originalEndpoint) result.originalEndpoint = originalEndpoint;
  if (capability) result.capability = capability;
  return result;
}

function authRequiredStatusSummary(auth) {
  return {
    mode: auth.mode,
    oauth: {
      tokenFilePresent: Boolean(auth.oauth?.tokenFilePresent),
      authenticated: Boolean(auth.oauth?.authenticated),
      expired: Boolean(auth.oauth?.expired),
      refreshTokenPresent: Boolean(auth.oauth?.refreshTokenPresent),
    },
  };
}

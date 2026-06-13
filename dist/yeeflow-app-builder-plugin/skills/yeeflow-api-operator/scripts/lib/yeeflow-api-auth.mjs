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
        if (!env.apiKey) throw new Error(redactSensitive(`OAuth refresh failed and no legacy API key fallback is configured: ${error.message}`));
      }
    }
  }

  if (env.apiKey) {
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
  const auth = await resolveYeeflowApiAuth(options);
  if (auth.mode === "apiKey" && options.allowLegacyApiKey === true) {
    return auth;
  }
  if (auth.mode !== "oauth") {
    throw new Error(pluginLoginRequiredMessage());
  }
  return auth;
}

export async function requireYeeflowOAuthAuth(options = {}) {
  const auth = await resolveYeeflowApiAuth(options);
  if (auth.mode !== "oauth") {
    throw new Error(pluginLoginRequiredMessage("Yeeflow OAuth authentication is required."));
  }
  return auth;
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
  return `${prefix} Please sign in to Yeeflow using the plugin login flow so I can continue this operation. If the plugin login action is unavailable in this runtime, open the Yeeflow plugin login flow in Codex, then ask me to retry this operation.`;
}

export function pluginLoginUnavailableMessage() {
  return "I need Yeeflow login before I can continue, but the plugin login action is not available in this runtime. Please open the Yeeflow plugin login flow in Codex, then ask me to retry this operation.";
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
      flow: "plugin-login-request",
      message: "Please sign in to Yeeflow using the plugin login flow so I can continue this operation.",
      unavailableMessage: pluginLoginUnavailableMessage(),
      retry: originalCapability
        ? `After login completes, retry ${originalCapability}.`
        : originalOperation
          ? `After login completes, retry ${originalOperation}.`
          : "After login completes, retry the original operation.",
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

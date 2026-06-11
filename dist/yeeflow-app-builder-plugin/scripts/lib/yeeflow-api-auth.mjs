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

export async function resolveYeeflowApiAuth(options = {}) {
  const dotenv = options.dotenv || ".env.local";
  if (options.loadDotenv !== false) loadDotenvFile(fs, dotenv);
  const env = resolveYeeflowEnvironment(process.env);
  const oauthConfig = resolveOAuthConfig(process.env);
  const token = loadStoredToken(oauthConfig);
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

export async function requireYeeflowApiAuth(options = {}) {
  const auth = await resolveYeeflowApiAuth(options);
  if (auth.mode === "none") {
    throw new Error("Yeeflow API authentication is not configured. Run OAuth login or configure legacy YEEFLOW_API_KEY locally.");
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
    },
  };
}

export function mergeAuthHeaders(auth, headers = {}) {
  return { ...headers, ...auth.headers };
}

export function safeAuthError(error) {
  return redactSensitive(error?.message || String(error || "Unknown Yeeflow API authentication error"));
}

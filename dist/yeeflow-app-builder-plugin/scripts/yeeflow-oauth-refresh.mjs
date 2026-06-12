#!/usr/bin/env node

import {
  loadLocalEnv,
  loadStoredToken,
  refreshAccessToken,
  resolveOAuthConfig,
  saveStoredToken,
  summarizeStoredToken,
} from "./lib/yeeflow-oauth-client.mjs";

loadLocalEnv(valueAfter("--dotenv", ".env.local"));
const config = resolveOAuthConfig(process.env);
const token = loadStoredToken(config);
if (!token?.refresh_token) {
  console.error("No refresh token is available. Run OAuth login again.");
  process.exit(1);
}

try {
  const refreshed = await refreshAccessToken(config, token);
  saveStoredToken(config, refreshed);
  const summary = summarizeStoredToken(config, refreshed);
  console.log(JSON.stringify({
    refreshed: true,
    authenticated: summary.authenticated,
    expiresAt: summary.expiresAt,
    tokenFilePresent: summary.tokenFilePresent,
    refreshFlow: refreshed.oauth_refresh_flow || null,
    tokenContext: summary.tokenContext ?? null,
  }, null, 2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

function valueAfter(flag, fallback) {
  const index = process.argv.indexOf(flag);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

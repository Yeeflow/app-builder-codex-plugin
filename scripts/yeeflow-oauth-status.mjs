#!/usr/bin/env node

import {
  loadLocalEnv,
  loadStoredToken,
  refreshAccessToken,
  resolveOAuthConfig,
  saveStoredToken,
  summarizeStoredToken,
} from "./lib/yeeflow-oauth-client.mjs";

const args = new Set(process.argv.slice(2));
loadLocalEnv(args.has("--dotenv") ? valueAfter("--dotenv") : ".env.local");

const config = resolveOAuthConfig(process.env);
let token = loadStoredToken(config);
let refreshed = false;

if (args.has("--refresh") && token?.refresh_token) {
  const next = await refreshAccessToken(config, token);
  saveStoredToken(config, next);
  token = next;
  refreshed = true;
}

const summary = summarizeStoredToken(config, token);
console.log(JSON.stringify({
  authenticated: summary.authenticated,
  tokenFilePresent: summary.tokenFilePresent,
  tokenFile: summary.tokenFile,
  expired: summary.expired ?? null,
  refreshTokenPresent: summary.refreshTokenPresent ?? false,
  idTokenPresent: summary.idTokenPresent ?? false,
  expiresAt: summary.expiresAt ?? null,
  scope: summary.scope ?? null,
  oauthFlow: summary.oauthFlow ?? null,
  refreshFlow: summary.refreshFlow ?? null,
  tokenContext: summary.tokenContext ?? null,
  configSources: summary.configSources,
  refreshed,
}, null, 2));

function valueAfter(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : ".env.local";
}

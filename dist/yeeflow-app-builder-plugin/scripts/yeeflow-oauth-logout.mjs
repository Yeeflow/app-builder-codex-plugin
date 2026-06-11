#!/usr/bin/env node

import { clearStoredToken, loadLocalEnv, resolveOAuthConfig } from "./lib/yeeflow-oauth-client.mjs";

loadLocalEnv(valueAfter("--dotenv", ".env.local"));
const config = resolveOAuthConfig(process.env);
clearStoredToken(config);
console.log("Local Yeeflow OAuth token storage cleared. Remote token revocation is not implemented because no revoke endpoint is configured.");

function valueAfter(flag, fallback) {
  const index = process.argv.indexOf(flag);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

#!/usr/bin/env node

import {
  loadLocalEnv,
  resolveOAuthConfig,
} from "./lib/yeeflow-oauth-client.mjs";
import { startYeeflowOAuthBrowserLogin } from "./lib/yeeflow-oauth-login-flow.mjs";

const args = new Set(process.argv.slice(2));
loadLocalEnv(valueAfter("--dotenv", ".env.local"));

const config = resolveOAuthConfig(process.env);
const result = await startYeeflowOAuthBrowserLogin({
  config,
  openBrowser: args.has("--no-open") ? () => false : undefined,
});
console.log(JSON.stringify(result, null, 2));
if (!result.authenticated) process.exit(1);

function valueAfter(flag, fallback) {
  const index = process.argv.indexOf(flag);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

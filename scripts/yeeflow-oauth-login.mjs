#!/usr/bin/env node

import { spawn } from "node:child_process";
import {
  buildAuthorizationUrl,
  createOAuthState,
  createPkcePair,
  exchangeAuthorizationCode,
  loadLocalEnv,
  resolveOAuthConfig,
  saveStoredToken,
  startHttpsCallbackServer,
} from "./lib/yeeflow-oauth-client.mjs";

const args = new Set(process.argv.slice(2));
loadLocalEnv(valueAfter("--dotenv", ".env.local"));

const config = resolveOAuthConfig(process.env);
const state = createOAuthState();
const pkce = createPkcePair();
const callbackServer = await startHttpsCallbackServer(config, { expectedState: state });
const authUrl = buildAuthorizationUrl(config, {
  redirectUri: callbackServer.redirectUri,
  state,
  codeChallenge: pkce.codeChallenge,
});

const opened = args.has("--no-open") ? false : openBrowser(authUrl.toString());
if (!opened) {
  console.log("Open this Yeeflow OAuth authorization URL in your browser:");
  console.log(authUrl.toString());
} else {
  console.log(`Opened Yeeflow OAuth login in your browser. Waiting for HTTPS callback on ${callbackServer.redirectUri}`);
}

try {
  const callback = await callbackServer.callback;
  const token = await exchangeAuthorizationCode(config, {
    code: callback.code,
    redirectUri: callback.redirectUri,
    codeVerifier: pkce.codeVerifier,
  });
  const tokenFile = saveStoredToken(config, token);
  console.log(`Yeeflow OAuth login succeeded. Token storage updated at ${tokenFile}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

function openBrowser(url) {
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

function valueAfter(flag, fallback) {
  const index = process.argv.indexOf(flag);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = readJson("compatibility/capability-manifests/yeeflow-oauth-browser-login-entrypoint-platform-support.v1.0.0.json");
const plugin = readJson("dist/yeeflow-app-builder-plugin/.codex-plugin/plugin.json");
const builder = readText("scripts/build-core-distribution.mjs");
const report = readText("docs/architecture/yeeflow-oauth-browser-login-entrypoint-platform-support-audit.v1.0.0.md");

assert(manifest.decision?.status === "superseded_for_host_triggered_oauth_only", "OAUTH_BROWSER_LOGIN_AUDIT_DECISION_INVALID");
assert(manifest.decision?.marker === "PLUGIN_YEEFLOW_OAUTH_BROWSER_LOGIN_ENTRYPOINT_UI_BLOCKER_RETAINED_HOST_FLOW_ACCEPTED", "OAUTH_BROWSER_LOGIN_AUDIT_MARKER_INVALID");
assert(manifest.candidateDecision?.status === "eligible_after_host_triggered_continuation_validation", "OAUTH_BROWSER_LOGIN_CANDIDATE_DECISION_INVALID");
assert(Array.isArray(manifest.authoritativePluginContract?.supportedExtensionPoints), "OAUTH_BROWSER_LOGIN_EXTENSION_POINTS_INVALID");
assert(JSON.stringify(manifest.authoritativePluginContract.supportedExtensionPoints) === JSON.stringify(["skills", "mcpServers", "apps"]), "OAUTH_BROWSER_LOGIN_EXTENSION_POINTS_DRIFT");
assert(!Object.hasOwn(plugin, "mcpServers"), "OAUTH_BROWSER_LOGIN_MCP_ROUTE_PRESENT");
assert(!Object.hasOwn(plugin, "apps"), "OAUTH_BROWSER_LOGIN_UNREGISTERED_APP_ROUTE_PRESENT");
assert(!builder.includes("yeeflow-oauth-mcp-server.mjs"), "OAUTH_BROWSER_LOGIN_MCP_BUILDER_ROUTE_PRESENT");
assert(!builder.includes("yeeflow-oauth.mcp.json"), "OAUTH_BROWSER_LOGIN_MCP_CONFIGURATION_ROUTE_PRESENT");
assert(report.includes("A native user-action or login registration surface"), "OAUTH_BROWSER_LOGIN_REQUIRED_PREREQUISITE_MISSING");
assert(!report.includes("Connect Yeeflow tool"), "OAUTH_BROWSER_LOGIN_MCP_CLAIM_PRESENT");
console.log("PLUGIN_YEEFLOW_OAUTH_BROWSER_LOGIN_ENTRYPOINT_UI_BLOCKER_RETAINED_HOST_FLOW_ACCEPTED");

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function readText(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

function assert(condition, code) {
  if (!condition) throw new Error(code);
}

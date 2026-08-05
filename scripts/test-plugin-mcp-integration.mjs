#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pluginRoot = resolve(root, "dist/yeeflow-app-builder-plugin");
const manifestText = readFileSync(resolve(pluginRoot, ".codex-plugin/plugin.json"), "utf8");
const manifest = readJson(resolve(pluginRoot, ".codex-plugin/plugin.json"));
const mcpManifest = readJson(resolve(pluginRoot, ".mcp.json"));
const sourceApiSkill = readFileSync(resolve(root, "generated-skills/yeeflow-api-operator/SKILL.md"), "utf8");
const distributedApiSkill = readFileSync(resolve(pluginRoot, "skills/yeeflow-api-operator/SKILL.md"), "utf8");

assert.equal(manifest.name, "yeeflow-app-builder");
assert.equal(manifest.version, "1.3.0");
assert.equal(manifest.skills, "./skills/");
assert.equal(manifest.mcpServers, "./.mcp.json");
assert.deepEqual(manifest.interface?.capabilities, ["Skills", "Interactive", "Write"]);
assert.equal((manifestText.match(/"capabilities"/g) ?? []).length, 1, "plugin manifest must not contain duplicate capabilities keys");

assert.deepEqual(Object.keys(mcpManifest), ["mcpServers"]);
assert.deepEqual(Object.keys(mcpManifest.mcpServers ?? {}), ["yeeflow_app_builder_mcp"]);
assert.deepEqual(mcpManifest.mcpServers.yeeflow_app_builder_mcp, {
  type: "http",
  url: "https://api.yeeflow.com/v1/mcp",
});

const endpoint = new URL(mcpManifest.mcpServers.yeeflow_app_builder_mcp.url);
assert.equal(endpoint.protocol, "https:");
assert.equal(endpoint.username, "");
assert.equal(endpoint.password, "");
assert.equal(endpoint.search, "");
assert.equal(endpoint.hash, "");

assert.equal(distributedApiSkill, sourceApiSkill, "source and distributed API Operator skills must remain byte-identical");
assert.match(distributedApiSkill, /use the bundled MCP route before local REST helper scripts/);
assert.match(distributedApiSkill, /Require explicit user authorization for MCP create\/save\/import\/install\/upgrade calls/);
assert.match(distributedApiSkill, /MCP tool acceptance is API acceptance only/);

const serialized = JSON.stringify(mcpManifest).toLowerCase();
for (const forbidden of ["authorization", "bearer", "token", "secret", "password", "api_key", "apikey", "http_headers"]) {
  assert.equal(serialized.includes(forbidden), false, `MCP configuration must not embed ${forbidden}`);
}

console.log(JSON.stringify({
  status: "pass",
  marker: "YEEFLOW_PLUGIN_MCP_INTEGRATION_PASSED",
  pluginVersion: manifest.version,
  serverName: "yeeflow_app_builder_mcp",
  transport: "http",
  authentication: "server-negotiated-oauth",
  embeddedCredentials: false,
}, null, 2));

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

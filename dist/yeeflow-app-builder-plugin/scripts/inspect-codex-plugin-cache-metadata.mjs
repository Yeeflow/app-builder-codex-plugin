#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

const root = path.resolve(argValue("--root", process.cwd()));
const expectedVersion = argValue("--expect-version", "0.6.38");
const expectedMarketplaceId = argValue("--expect-marketplace-id", "yeeflow");
const expectedMarketplaceLabel = argValue("--expect-marketplace-label", "Yeeflow");
const expectedPluginId = argValue("--expect-plugin-id", "yeeflow-app-builder");
const expectedPluginName = argValue("--expect-plugin-name", "Yeeflow App Builder");

const marketplacePath = path.join(root, ".agents/plugins/marketplace.json");
const pluginPath = path.join(root, "dist/yeeflow-app-builder-plugin/.codex-plugin/plugin.json");

const marketplace = readJson(marketplacePath);
const plugin = readJson(pluginPath);

const summary = {
  sparsePaths: [
    ".agents/plugins/marketplace.json",
    "dist/yeeflow-app-builder-plugin",
  ],
  marketplaceId: marketplace.name,
  marketplaceLabel: marketplace.interface?.displayName ?? null,
  pluginEntryId: marketplace.plugins?.[0]?.name ?? null,
  pluginId: plugin.name,
  pluginDisplayName: plugin.interface?.displayName ?? null,
  pluginVersion: plugin.version,
};

const failures = [];
if (summary.marketplaceId !== expectedMarketplaceId) {
  failures.push(`marketplace id expected ${expectedMarketplaceId}, got ${summary.marketplaceId}`);
}
if (summary.marketplaceLabel !== expectedMarketplaceLabel) {
  failures.push(`marketplace label expected ${expectedMarketplaceLabel}, got ${summary.marketplaceLabel}`);
}
if (summary.pluginEntryId !== expectedPluginId) {
  failures.push(`marketplace plugin id expected ${expectedPluginId}, got ${summary.pluginEntryId}`);
}
if (summary.pluginId !== expectedPluginId) {
  failures.push(`plugin id expected ${expectedPluginId}, got ${summary.pluginId}`);
}
if (summary.pluginDisplayName !== expectedPluginName) {
  failures.push(`plugin display name expected ${expectedPluginName}, got ${summary.pluginDisplayName}`);
}
if (summary.pluginVersion !== expectedVersion) {
  failures.push(`plugin version expected ${expectedVersion}, got ${summary.pluginVersion}`);
}

console.log(JSON.stringify(summary, null, 2));

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

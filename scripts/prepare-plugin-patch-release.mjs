#!/usr/bin/env node

import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageManifest = readJson("package.json");
const pluginManifestPath = "dist/yeeflow-app-builder-plugin/.codex-plugin/plugin.json";
const pluginManifest = readJson(pluginManifestPath);

if (!/^\d+\.\d+\.\d+$/u.test(packageManifest.version || "")) {
  throw new Error("PLUGIN_PATCH_RELEASE_VERSION_INVALID");
}

pluginManifest.version = packageManifest.version;
writeFileSync(resolve(root, pluginManifestPath), `${JSON.stringify(pluginManifest, null, 2)}\n`);

for (const sourcePath of [
  "scripts/validate-approval-workflow-publish-readiness.mjs",
  "scripts/test-approval-workflow-unicode-node-name-regressions.mjs",
]) {
  copyFileSync(resolve(root, sourcePath), resolve(root, "dist/yeeflow-app-builder-plugin", sourcePath));
}

console.log(`PLUGIN_PATCH_RELEASE_PREPARED version=${packageManifest.version} mirroredFiles=2`);

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(root, relativePath), "utf8"));
}

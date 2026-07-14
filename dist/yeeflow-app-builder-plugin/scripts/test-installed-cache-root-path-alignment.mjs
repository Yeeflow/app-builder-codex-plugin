#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { artifactPathsForRoot, DIST_PLUGIN_ROOT, pluginRootMode } from "./lib/plugin-root-layout.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plugin-root-layout-"));
const cases = [];

try {
  const sourceRoot = path.join(tempRoot, "source-root");
  fs.mkdirSync(path.join(sourceRoot, "scripts"), { recursive: true });
  fs.mkdirSync(path.join(sourceRoot, DIST_PLUGIN_ROOT, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(sourceRoot, "scripts", "example.mjs"), "export const value = 1;\n");
  fs.writeFileSync(path.join(sourceRoot, DIST_PLUGIN_ROOT, "scripts", "example.mjs"), "export const value = 1;\n");

  assert.equal(pluginRootMode(sourceRoot), "source-root");
  const sourcePaths = artifactPathsForRoot(sourceRoot, "scripts/example.mjs");
  assert.equal(sourcePaths.mode, "source-root");
  assert.equal(sourcePaths.mirrorRequired, true);
  assert.equal(fs.readFileSync(sourcePaths.mirror, "utf8"), fs.readFileSync(sourcePaths.source, "utf8"));
  cases.push("source root requires dist mirror parity");

  const cacheRoot = path.join(tempRoot, "installed-cache-root");
  fs.mkdirSync(path.join(cacheRoot, ".codex-plugin"), { recursive: true });
  fs.mkdirSync(path.join(cacheRoot, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(cacheRoot, ".codex-plugin", "plugin.json"), JSON.stringify({ name: "yeeflow-app-builder", version: "test", interface: { displayName: "Yeeflow App Builder" } }));
  fs.writeFileSync(path.join(cacheRoot, "scripts", "example.mjs"), "export const value = 2;\n");

  assert.equal(pluginRootMode(cacheRoot), "installed-cache-root");
  const cachePaths = artifactPathsForRoot(cacheRoot, "scripts/example.mjs");
  assert.equal(cachePaths.mode, "installed-cache-root");
  assert.equal(cachePaths.mirrorRequired, false);
  assert.equal(cachePaths.mirror, cachePaths.source);
  assert.equal(fs.existsSync(path.join(cacheRoot, DIST_PLUGIN_ROOT)), false);
  cases.push("installed cache root resolves root payload without nested dist mirror");

  const metadataResult = spawnSync(process.execPath, [
    path.join(ROOT, "scripts/inspect-codex-plugin-cache-metadata.mjs"),
    "--root",
    cacheRoot,
    "--expect-version",
    "test",
  ], { encoding: "utf8" });
  assert.equal(metadataResult.status, 0, metadataResult.stderr || metadataResult.stdout);
  const metadata = JSON.parse(metadataResult.stdout);
  assert.equal(metadata.rootMode, "installed-cache-root");
  assert.equal(metadata.marketplaceId, null);
  assert.equal(metadata.pluginVersion, "test");
  cases.push("cache metadata inspector validates installed payload without marketplace files");

  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

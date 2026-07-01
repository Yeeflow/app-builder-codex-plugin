#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const canonical = "validate-yapk-package.js";
const sourceRootEntrypoints = [
  "dist/yeeflow-app-builder-plugin/validate-yapk-package.js",
  "dist/yeeflow-app-builder-plugin/scripts/validate-yapk-package.js",
  "skills/installed/yeeflow-application-generator/scripts/validate-yapk-package.js",
  "dist/yeeflow-app-builder-plugin/skills/yeeflow-application-generator/scripts/validate-yapk-package.js",
];
const installedCacheRootEntrypoints = [
  "scripts/validate-yapk-package.js",
  "skills/yeeflow-application-generator/scripts/validate-yapk-package.js",
];

const canonicalPath = path.join(ROOT, canonical);
assert.equal(fs.existsSync(canonicalPath), true, `${canonical} exists`);
const canonicalBytes = fs.readFileSync(canonicalPath, "utf8");
const nestedDistPath = path.join(ROOT, "dist/yeeflow-app-builder-plugin");
const isSourceRoot = fs.existsSync(nestedDistPath);
const mirroredEntrypoints = isSourceRoot ? sourceRootEntrypoints : installedCacheRootEntrypoints;
const checked = [];

for (const entrypoint of mirroredEntrypoints) {
  const file = path.join(ROOT, entrypoint);
  assert.equal(fs.existsSync(file), true, `${entrypoint} exists`);
  assert.equal(fs.readFileSync(file, "utf8"), canonicalBytes, `${entrypoint} must byte-match ${canonical}`);
  checked.push(entrypoint);
}

console.log(JSON.stringify({
  status: "pass",
  canonical,
  checked,
  rule: "All public validate-yapk-package.js entrypoints must mirror the canonical validator to prevent duplicate-rule drift.",
}, null, 2));

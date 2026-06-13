#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SCAN_ROOTS = [
  "README.md",
  "CHANGELOG.md",
  "docs",
  "generated-skills",
  "skills",
  "scripts",
  "dist/yeeflow-app-builder-plugin",
  ".env.example",
];

const developerCliAllowlist = new Set([
  ".env.example",
  "docs/browser-oauth-login.md",
  "docs/environment-configuration.md",
  "dist/yeeflow-app-builder-plugin/.env.example",
  "dist/yeeflow-app-builder-plugin/docs/browser-oauth-login.md",
  "dist/yeeflow-app-builder-plugin/docs/environment-configuration.md",
]);

const normalUserLoginCommandFindings = [];
const staleCacheFindings = [];
const needsFixFindings = [];
const unresolvedMarkerPattern = new RegExp("needs" + " fix", "i");

for (const relativeFile of scanFiles()) {
  const text = fs.readFileSync(path.join(ROOT, relativeFile), "utf8");
  if (unresolvedMarkerPattern.test(text)) needsFixFindings.push(relativeFile);
  if (/\.codex\/plugins\/cache\/yeeflow\/yeeflow-app-builder\/\d+\.\d+\.\d+/.test(text) && !relativeFile.startsWith("docs/legacy/")) {
    staleCacheFindings.push(relativeFile);
  }
  if (/node\s+scripts\/yeeflow-oauth-login\.mjs/.test(text)) {
    if (!developerCliAllowlist.has(relativeFile) || !/developer\/local diagnostic|Developer\/local diagnostic|developer diagnostics|Developer CLI Diagnostics/.test(text)) {
      normalUserLoginCommandFindings.push(relativeFile);
    }
  }
  if (/ask (?:the )?(?:current )?user to run `?node scripts\/yeeflow-oauth-login\.mjs`?/i.test(text)) {
    normalUserLoginCommandFindings.push(relativeFile);
  }
}

assert.deepEqual([...new Set(normalUserLoginCommandFindings)].sort(), [], "Normal user-facing docs/skills must not ask users to run local Node OAuth login commands.");
assert.deepEqual([...new Set(staleCacheFindings)].sort(), [], "Active docs/scripts/skills must not include hardcoded versioned Yeeflow plugin cache paths.");
assert.deepEqual([...new Set(needsFixFindings)].sort(), [], "Audited login UX classification must have zero unresolved references.");

assertFileIncludes("docs/browser-oauth-login.md", "sign in to Yeeflow using the plugin login flow");
assertFileIncludes("docs/browser-oauth-login.md", "I need Yeeflow login before I can continue, but the plugin login action is not available in this runtime.");
assertFileIncludes("docs/browser-oauth-login.md", "Please sign in to Yeeflow using the plugin login flow so I can continue this operation.");
assertFileIncludes("docs/plugin-installation.md", "refresh or reinstall the plugin from Git ref `stable`");
assertFileIncludes("generated-skills/yeeflow-api-operator/SKILL.md", "plugin login flow");
assertFileIncludes("generated-skills/yeeflow-api-operator/SKILL.md", "auth_required");
assertFileIncludes("generated-skills/yeeflow-api-operator/SKILL.md", "login_flow_required");
assertFileIncludes("dist/yeeflow-app-builder-plugin/skills/yeeflow-api-operator/SKILL.md", "plugin login flow");
assertFileIncludes("dist/yeeflow-app-builder-plugin/skills/yeeflow-api-operator/SKILL.md", "auth_required");
assertFileIncludes("dist/yeeflow-app-builder-plugin/skills/yeeflow-api-operator/SKILL.md", "login_flow_required");

console.log("login request UX wording tests passed");

function assertFileIncludes(relativeFile, expected) {
  const text = fs.readFileSync(path.join(ROOT, relativeFile), "utf8");
  assert.ok(text.includes(expected), `${relativeFile} missing ${expected}`);
}

function* scanFiles() {
  for (const entry of SCAN_ROOTS) {
    const fullPath = path.join(ROOT, entry);
    if (!fs.existsSync(fullPath)) continue;
    if (fs.statSync(fullPath).isFile()) {
      yield entry;
    } else {
      yield* walk(fullPath);
    }
  }
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.includes(" 2.")) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else if (entry.isFile() && /\.(?:md|mjs|js|json|example)$/.test(entry.name)) {
      yield path.relative(ROOT, fullPath);
    }
  }
}

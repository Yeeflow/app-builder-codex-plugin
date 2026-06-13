#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_ROOTS = [
  "scripts",
  "dist/yeeflow-app-builder-plugin/scripts",
  "generated-skills",
  "skills",
  "dist/yeeflow-app-builder-plugin/skills",
];

const VERSIONED_CACHE_PATH_PATTERN =
  /(?:~|\/Users\/[^/\s]+)\/\.codex\/plugins\/cache\/yeeflow\/yeeflow-app-builder\/\d+\.\d+\.\d+|yeeflow-app-builder\/\d+\.\d+\.\d+\/(?:scripts|skills|docs)/;

const matches = [];
for (const root of SCAN_ROOTS) {
  const resolvedRoot = path.join(ROOT, root);
  if (!fs.existsSync(resolvedRoot)) continue;
  for (const file of walkFiles(resolvedRoot)) {
    if (!/\.(?:mjs|js)$/.test(file)) continue;
    if (path.basename(file).includes(" 2.")) continue;
    const text = fs.readFileSync(file, "utf8");
    if (VERSIONED_CACHE_PATH_PATTERN.test(text)) {
      matches.push(path.relative(ROOT, file));
    }
  }
}

assert.deepEqual(
  matches,
  [],
  `Signing/package helper scripts must not import from hardcoded versioned Codex cache paths:\n${matches.join("\n")}`,
);

console.log("signing helper cache-path regression tests passed");

function* walkFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(fullPath);
    } else if (entry.isFile()) {
      yield fullPath;
    }
  }
}

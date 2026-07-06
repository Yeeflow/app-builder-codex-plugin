#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST_ROOT = fs.existsSync(path.join(ROOT, "dist/yeeflow-app-builder-plugin"))
  ? path.join(ROOT, "dist/yeeflow-app-builder-plugin")
  : ROOT;

const checks = [];

expectFileContains("standard mentions ydl shared generation", "docs/standards/standalone-export-shared-generation-standard.md", [
  "Standalone `.ydl` generation and full-application `.yapk` Data List materialization must share",
  "Data List Form Layouts v1.1",
  "Reverse-related Collection sections",
]);

expectFileContains("standard mentions ydp shared generation", "docs/standards/standalone-export-shared-generation-standard.md", [
  "Standalone `.ydp` generation and full-application `.yapk` Dashboard materialization must share",
  "dashboard-page-layouts-two-panel-workspace",
  "validate-dashboard-generation-hard-gates.mjs",
]);

expectFileContains("training report records both standalone export paths", "docs/training/standalone-ydl-ydp-shared-generation-training-report.md", [
  "Data List `.ydl` standalone exports",
  "Dashboard page `.ydp` standalone exports",
  "must not maintain separate",
]);

expectFileContains("data-list skill enforces shared ydl path", "skills/installed/yeeflow-data-list-generator/SKILL.md", [
  "Standalone `.ydl` generation and full-application `.yapk` Data List materialization must share",
  "Do not hand-build a separate standalone `.ydl`",
  "STANDALONE_YDL_SHARED_GENERATION_BYPASSED",
]);

expectFileContains("dashboard skill enforces shared ydp path", "skills/installed/yeeflow-dashboard-generator/SKILL.md", [
  "Standalone `.ydp` generation and full-application `.yapk` Dashboard materialization must share",
  "Do not hand-build a separate standalone `.ydp`",
  "STANDALONE_YDP_SHARED_GENERATION_BYPASSED",
]);

expectMirror("docs/standards/standalone-export-shared-generation-standard.md");
expectMirror("docs/training/standalone-ydl-ydp-shared-generation-training-report.md");
expectMirror("skills/installed/yeeflow-data-list-generator/SKILL.md", "skills/yeeflow-data-list-generator/SKILL.md");
expectMirror("skills/installed/yeeflow-dashboard-generator/SKILL.md", "skills/yeeflow-dashboard-generator/SKILL.md");
expectMirror("scripts/test-standalone-export-shared-generation-gates.mjs");

console.log(JSON.stringify({
  status: "pass",
  test: "test-standalone-export-shared-generation-gates",
  checks,
}, null, 2));

function expectFileContains(label, relativeFile, requiredSnippets) {
  const file = path.join(ROOT, relativeFile);
  assert.ok(fs.existsSync(file), `${label}: missing ${relativeFile}`);
  const text = fs.readFileSync(file, "utf8");
  for (const snippet of requiredSnippets) {
    assert.ok(text.includes(snippet), `${label}: missing snippet ${JSON.stringify(snippet)} in ${relativeFile}`);
  }
  checks.push({ case: label, status: "pass" });
}

function expectMirror(sourceRelative, distRelative = sourceRelative) {
  const source = path.join(ROOT, sourceRelative);
  const dist = path.join(DIST_ROOT, distRelative);
  assert.ok(fs.existsSync(source), `missing source mirror input ${sourceRelative}`);
  assert.ok(fs.existsSync(dist), `missing dist mirror ${distRelative}`);
  const sourceText = fs.readFileSync(source, "utf8");
  const distText = fs.readFileSync(dist, "utf8");
  assert.equal(distText, sourceText, `dist mirror differs: ${distRelative}`);
  checks.push({ case: `mirror: ${sourceRelative}`, status: "pass" });
}

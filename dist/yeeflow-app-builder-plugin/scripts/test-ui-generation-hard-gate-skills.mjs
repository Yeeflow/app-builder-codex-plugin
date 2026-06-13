#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceSkillsRoot = path.join(ROOT, "skills", "installed");
const distSkillsRoot = path.join(ROOT, "dist", "yeeflow-app-builder-plugin", "skills");

const requiredPhrases = [
  "High-quality UI requires a page-by-page implementation contract",
  "uncertain UI/runtime patterns should be proven on a sandbox page first",
  "use export-proven Yeeflow control/style shapes",
  "Summary/KPI controls require designer-shaped hidden Summary configuration",
  "Summary controls must bind real fields, filters, temp variables, `save_var` expression objects, and `ReportIds`",
  "visible KPI dynamic binding is not considered solved unless runtime-proven",
  "fallback KPI values must be explicitly labeled as fallback",
  "runtime screenshot evidence is required before claiming UI quality",
  "install/signing/API acceptance is not runtime UI proof",
  "UI upgrades must preserve ListSetID, app identity, existing IDs, and declared change scope",
  "broad scaffold-like UI must not be claimed as high-quality UI",
];

const updatedSkills = [
  "yeeflow-application-builder",
  "yeeflow-application-generator",
  "yeeflow-dashboard-generator",
  "yeeflow-package-validator",
  "yeeflow-yapk-package-generator",
  "yeeflow-runtime-test-orchestrator",
  "yeeflow-feature-learning-orchestrator",
];

const newSkill = "yeeflow-ui-generation-hard-gates";
const allSkills = [newSkill, ...updatedSkills];

for (const root of [sourceSkillsRoot, distSkillsRoot]) {
  for (const skill of allSkills) {
    const skillPath = path.join(root, skill, "SKILL.md");
    assert.equal(fs.existsSync(skillPath), true, `missing skill file: ${skillPath}`);
    const content = fs.readFileSync(skillPath, "utf8");
    const normalizedContent = content.toLowerCase();
    assert.match(content, /yeeflow-ui-generation-hard-gates/, `${skill} does not reference the UI hard-gate skill`);
    for (const phrase of requiredPhrases) {
      assert.equal(normalizedContent.includes(phrase.toLowerCase()), true, `${skill} missing phrase: ${phrase}`);
    }
  }
}

const sourceNewSkill = path.join(sourceSkillsRoot, newSkill, "SKILL.md");
const distNewSkill = path.join(distSkillsRoot, newSkill, "SKILL.md");
assert.equal(
  fs.readFileSync(sourceNewSkill, "utf8"),
  fs.readFileSync(distNewSkill, "utf8"),
  "new UI hard-gate skill source/dist mirror differs",
);

const docs = [
  path.join(ROOT, "skills", "README.md"),
  path.join(ROOT, "dist", "yeeflow-app-builder-plugin", "skills", "README.md"),
  path.join(ROOT, "docs", "README.md"),
  path.join(ROOT, "dist", "yeeflow-app-builder-plugin", "docs", "README.md"),
  path.join(ROOT, "docs", "quick-start.md"),
  path.join(ROOT, "dist", "yeeflow-app-builder-plugin", "docs", "quick-start.md"),
];

for (const docPath of docs) {
  assert.equal(fs.existsSync(docPath), true, `missing doc file: ${docPath}`);
  const content = fs.readFileSync(docPath, "utf8");
  const normalizedContent = content.toLowerCase();
  assert.match(content, /yeeflow-ui-generation-hard-gates/, `${docPath} missing skill name`);
  for (const phrase of requiredPhrases) {
    assert.equal(normalizedContent.includes(phrase.toLowerCase()), true, `${docPath} missing phrase: ${phrase}`);
  }
}

const sourceSkillDirs = fs.readdirSync(sourceSkillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => name.includes("ui-generation-hard-gate"));
assert.deepEqual(sourceSkillDirs, [newSkill], "expected one clear UI generation hard-gate skill");

const privatePatterns = [
  /raw API responses/i,
  /raw package payloads/i,
  /raw `Resource`/i,
  /raw `Sign`/i,
];
const newSkillContent = fs.readFileSync(sourceNewSkill, "utf8");
for (const pattern of privatePatterns) {
  assert.doesNotMatch(newSkillContent, pattern, `new skill should not instruct printing private data: ${pattern}`);
}

console.log("UI generation hard-gate skill wording tests passed");

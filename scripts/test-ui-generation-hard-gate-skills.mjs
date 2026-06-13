#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceSkillsRoot = path.join(ROOT, "skills", "installed");
const installedSkillsRoot = path.join(ROOT, "skills");
const distSkillsRoot = path.join(ROOT, "dist", "yeeflow-app-builder-plugin", "skills");

const requiredPhrases = [
  "High-quality UI requires a page-by-page implementation contract",
  "uncertain UI/runtime patterns should be proven on a sandbox page first",
  "use export-proven Yeeflow control/style shapes",
  "Summary/KPI controls require designer-shaped hidden Summary configuration",
  "Summary controls must bind real fields, filters, temp variables, `save_var` expression objects, and `ReportIds`",
  "dynamic visible KPI binding is proven only for the exact UUID Summary v1.0.1 shape",
  "before/after mutation proof",
  "refreshed/recalculated runtime evidence",
  "Summary recalculation can be asynchronous or cache-delayed",
  "semantic/non-UUID Summary IDs",
  "visible KPI dynamic binding is not considered solved unless runtime-proven",
  "fallback KPI values must be explicitly labeled as fallback",
  "runtime screenshot evidence is required before claiming UI quality",
  "install/signing/API acceptance is not runtime UI proof",
  "UI upgrades must preserve ListSetID, app identity, existing IDs, and declared change scope",
  "broad scaffold-like UI must not be claimed as high-quality UI",
];

const requiredValidatorNames = [
  "scripts/inspect-yeeflow-ui-design-contract.mjs",
  "scripts/inspect-dashboard-style-shapes.mjs",
  "scripts/inspect-dashboard-summary-control-contract.mjs",
  "scripts/inspect-visible-kpi-runtime-bindings.mjs",
  "scripts/inspect-runtime-evidence.mjs",
  "scripts/inspect-grid-table-quality.mjs",
  "scripts/inspect-yapk-upgrade-app-identity.mjs",
  "scripts/decode-yapk-tolerant-brotli.mjs",
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

function skillPath(root, skill) {
  return path.join(root, skill, "SKILL.md");
}

function resolvePrimarySkillsRoot() {
  const sourceSkillPath = skillPath(sourceSkillsRoot, newSkill);
  if (fs.existsSync(sourceSkillPath)) {
    console.log(`Using source skill path: ${sourceSkillPath}`);
    return { label: "source", root: sourceSkillsRoot };
  }

  const installedSkillPath = skillPath(installedSkillsRoot, newSkill);
  if (fs.existsSync(installedSkillPath)) {
    console.log(`Using installed plugin skill path: ${installedSkillPath}`);
    return { label: "installed", root: installedSkillsRoot };
  }

  assert.fail(
    `missing UI hard-gate skill file. Checked source path ${sourceSkillPath} and installed plugin path ${installedSkillPath}`,
  );
}

const primarySkillsRoot = resolvePrimarySkillsRoot();
const skillRoots = [primarySkillsRoot];
if (fs.existsSync(skillPath(distSkillsRoot, newSkill))) {
  console.log(`Using dist mirror skill path: ${skillPath(distSkillsRoot, newSkill)}`);
  skillRoots.push({ label: "dist", root: distSkillsRoot });
}

for (const { root } of skillRoots) {
  for (const skill of allSkills) {
    const currentSkillPath = skillPath(root, skill);
    assert.equal(fs.existsSync(currentSkillPath), true, `missing skill file: ${currentSkillPath}`);
    const content = fs.readFileSync(currentSkillPath, "utf8");
    const normalizedContent = content.toLowerCase();
    assert.match(content, /yeeflow-ui-generation-hard-gates/, `${skill} does not reference the UI hard-gate skill`);
    for (const phrase of requiredPhrases) {
      assert.equal(normalizedContent.includes(phrase.toLowerCase()), true, `${skill} missing phrase: ${phrase}`);
    }
  }
}

const primaryNewSkill = skillPath(primarySkillsRoot.root, newSkill);
const distNewSkill = skillPath(distSkillsRoot, newSkill);
if (primarySkillsRoot.label === "source" && fs.existsSync(distNewSkill)) {
  assert.equal(
    fs.readFileSync(primaryNewSkill, "utf8"),
    fs.readFileSync(distNewSkill, "utf8"),
    "new UI hard-gate skill source/dist mirror differs",
  );
}

for (const currentSkillPath of skillRoots.map(({ root }) => skillPath(root, newSkill))) {
  const content = fs.readFileSync(currentSkillPath, "utf8");
  for (const validatorName of requiredValidatorNames) {
    assert.equal(content.includes(validatorName), true, `${currentSkillPath} missing validator reference: ${validatorName}`);
  }
}

const docCandidates = [
  path.join(ROOT, "skills", "README.md"),
  path.join(ROOT, "dist", "yeeflow-app-builder-plugin", "skills", "README.md"),
  path.join(ROOT, "docs", "README.md"),
  path.join(ROOT, "dist", "yeeflow-app-builder-plugin", "docs", "README.md"),
  path.join(ROOT, "docs", "quick-start.md"),
  path.join(ROOT, "dist", "yeeflow-app-builder-plugin", "docs", "quick-start.md"),
];
const docs = docCandidates.filter((docPath) => fs.existsSync(docPath));
assert.notEqual(docs.length, 0, `missing UI hard-gate docs. Checked: ${docCandidates.join(", ")}`);

for (const docPath of docs) {
  const content = fs.readFileSync(docPath, "utf8");
  const normalizedContent = content.toLowerCase();
  assert.match(content, /yeeflow-ui-generation-hard-gates/, `${docPath} missing skill name`);
  for (const phrase of requiredPhrases) {
    assert.equal(normalizedContent.includes(phrase.toLowerCase()), true, `${docPath} missing phrase: ${phrase}`);
  }
}

const sourceSkillDirs = fs.readdirSync(primarySkillsRoot.root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => name.includes("ui-generation-hard-gate"));
assert.deepEqual(sourceSkillDirs, [newSkill], "expected one clear UI generation hard-gate skill");

const privatePatterns = [
  /\b(print|output|emit|include|commit)\s+raw API responses/i,
  /\b(print|output|emit|include|commit)\s+raw package payloads/i,
  /\b(print|output|emit|include|commit)\s+raw `Resource`/i,
  /\b(print|output|emit|include|commit)\s+raw `Sign`/i,
];
const newSkillContent = fs.readFileSync(primaryNewSkill, "utf8");
for (const pattern of privatePatterns) {
  assert.doesNotMatch(newSkillContent, pattern, `new skill should not instruct printing private data: ${pattern}`);
}

console.log("UI generation hard-gate skill wording tests passed");

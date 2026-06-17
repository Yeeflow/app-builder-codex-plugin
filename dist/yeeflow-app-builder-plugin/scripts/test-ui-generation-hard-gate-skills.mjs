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
  "Summary controls must bind real fields, filters, temp variables, `save_var` expression objects, layout-resource `Resource.ReportIds`, matching layout-resource `Resource.exts`, and layout-resource `Resource.tempVars`; top-level `Pages[].ReportIds` is optional compatibility metadata",
  "Dashboard/app page root content-area padding is a hard gate",
  "Data-list custom form root content-area padding uses the same hard gate",
  "attrs.container.cw = \"2\"",
  "attrs.container.padding = [null, { top: \"--sp--s0\", right: \"--sp--s0\", bottom: \"--sp--s0\", left: \"--sp--s0\" }]",
  "Inner layout containers may keep intentional spacing",
  "dynamic visible KPI binding is proven only for the exact UUID Summary v1.0.1 shape",
  "before/after mutation proof",
  "refreshed/recalculated runtime evidence",
  "Summary recalculation can be asynchronous or cache-delayed",
  "semantic/non-UUID Summary IDs",
  "Data Analytics controls require UUID/runtime-safe IDs",
  "Pie chart, Column chart, Line chart, Gauge, Funnel chart, Color block heatmap, Summary, and Pivot table",
  "Preserve existing Data Analytics control IDs during upgrades",
  "visible KPI dynamic binding is not considered solved unless runtime-proven",
  "fallback KPI values must be explicitly labeled as fallback",
  "runtime screenshot evidence is required before claiming UI quality",
  "install/signing/API acceptance is not runtime UI proof",
  "UI upgrades must preserve ListSetID, app identity, existing IDs, and declared change scope",
  "broad scaffold-like UI must not be claimed as high-quality UI",
];

const requiredValidatorNames = [
  "scripts/generate-ui-contract-from-design.mjs",
  "scripts/validate-ui-upgrade-scope.mjs",
  "scripts/capture-runtime-ui-evidence.mjs",
  "scripts/compare-design-to-runtime-structure.mjs",
  "scripts/inspect-ui-closed-loop-workflow-enforcement.mjs",
  "scripts/inspect-application-layout-design-rules.mjs",
  "scripts/inspect-yeeflow-ui-design-contract.mjs",
  "scripts/inspect-dashboard-style-shapes.mjs",
  "scripts/inspect-dashboard-summary-control-contract.mjs",
  "scripts/inspect-data-analytics-control-identity.mjs",
  "scripts/inspect-visible-kpi-runtime-bindings.mjs",
  "scripts/inspect-runtime-evidence.mjs",
  "scripts/inspect-grid-table-quality.mjs",
  "scripts/inspect-yapk-upgrade-app-identity.mjs",
  "scripts/decode-yapk-tolerant-brotli.mjs",
];

const phase3RequiredPhrases = [
  "Design/mockup reference -> choose one official Yeeflow application layout -> generate UI implementation contract -> validate application layout design rules -> validate UI contract -> define page/scope manifest -> generate or update one allowed page/scope only -> validate upgrade scope -> run local UI/package hard gates -> sign/install/upgrade only after write confirmation -> capture redacted runtime evidence -> compare design/runtime structure -> iterate exact failing controls",
  "Before generating design images for a Yeeflow app, choose one of the four official Yeeflow application layouts",
  "PNG/JPEG layout screenshots are the primary source for generated design-image layout rules",
  "YAPK exports are supporting structural references",
  "All page images for the same app must use the same selected layout",
  "Design-image prompts must preserve the selected Yeeflow header/nav/content safe-area structure",
  "Do not invent arbitrary app shells, nav bars, sidebars, or top bars",
  "Screenshot-derived rules are human-reviewed derived rules, not pixel-perfect or automated screenshot proof",
  "Application layout compliance is required before using a generated image as a UI implementation reference",
  "Run `scripts/generate-ui-contract-from-design.mjs` before generation when a design/mockup exists",
  "run `scripts/inspect-application-layout-design-rules.mjs` for generated design image specs/UI contracts",
  "run `scripts/validate-ui-upgrade-scope.mjs` before package mutation",
  "Use `scripts/capture-runtime-ui-evidence.mjs` after runtime install/upgrade",
  "Compare design/runtime structure before claiming design fidelity",
  "Package validation, schema validation, signing, install, upgrade-check, and upgrade-apply are not visual proof",
  "Structure comparison cannot establish dynamic KPI proof",
  "no UI contract exists for a design/mockup request",
  "no official Yeeflow application layout is declared for generated design images",
  "page images in the same app use inconsistent application layouts",
  "scope validation fails",
  "structure comparison has fail findings",
  "structure comparison has warning findings and the user requested strict quality",
  "package signing/install/upgrade succeeded but visual/runtime evidence is missing",
  "Real Marketing Event private artifacts must not be committed; use synthetic or redacted Marketing Event-inspired fixtures only",
];

const phase3bRequiredPhrases = [
  "Phase 3B adds workflow-level enforcement",
  "Final reports for high-quality UI work must include contract, scope, runtime evidence, and structure-comparison artifact paths as applicable",
  "Run `scripts/inspect-ui-closed-loop-workflow-enforcement.mjs` before claiming high-quality UI or design fidelity",
  "Generation from design/mockup requires a UI contract",
  "UI upgrades require a scope manifest",
  "Runtime UI quality claims require runtime evidence",
  "Design fidelity claims require structure comparison",
  "Dynamic KPI proof requires before/after mutation evidence",
  "Install/sign/upgrade success is not visual proof",
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
  const normalizedContent = content.toLowerCase();
  for (const validatorName of requiredValidatorNames) {
    assert.equal(content.includes(validatorName), true, `${currentSkillPath} missing validator reference: ${validatorName}`);
  }
  for (const phrase of phase3RequiredPhrases) {
    assert.equal(normalizedContent.includes(phrase.toLowerCase()), true, `${currentSkillPath} missing Phase 3A phrase: ${phrase}`);
  }
  for (const phrase of phase3bRequiredPhrases) {
    assert.equal(normalizedContent.includes(phrase.toLowerCase()), true, `${currentSkillPath} missing Phase 3B phrase: ${phrase}`);
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

const phase3DocCandidates = [
  path.join(ROOT, "docs", "quick-start.md"),
  path.join(ROOT, "dist", "yeeflow-app-builder-plugin", "docs", "quick-start.md"),
  path.join(ROOT, "docs", "standards", "ui-summary-kpi-runtime-hard-gates.md"),
  path.join(ROOT, "dist", "yeeflow-app-builder-plugin", "docs", "standards", "ui-summary-kpi-runtime-hard-gates.md"),
  path.join(ROOT, "docs", "yeeflow-app-builder-plugin-user-guide.md"),
  path.join(ROOT, "dist", "yeeflow-app-builder-plugin", "docs", "yeeflow-app-builder-plugin-user-guide.md"),
].filter((docPath) => fs.existsSync(docPath));

for (const docPath of phase3DocCandidates) {
  const content = fs.readFileSync(docPath, "utf8").toLowerCase();
  for (const phrase of [
    "Phase 3A makes the workflow stricter in hard-gate guidance and regression tests",
    "Phase 3B is the workflow enforcement layer",
    "Phase 3B closes the planned UI-quality track",
    "Package validation/signing/install/upgrade success is not visual proof",
    "High-quality UI claims require evidence chain, not just install success",
    "Runtime evidence plus structural comparison is required before design fidelity claims",
    "Dynamic KPI proof remains separate and requires before/after mutation evidence",
    "Workflow enforcement helper purpose",
    "Real Marketing Event private artifacts are not committed; regression fixtures are synthetic/inspired",
  ]) {
    assert.equal(content.includes(phrase.toLowerCase()), true, `${docPath} missing Phase 3A doc phrase: ${phrase}`);
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

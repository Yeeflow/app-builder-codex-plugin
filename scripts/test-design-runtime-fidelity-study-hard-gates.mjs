#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isSourceRepo = fs.existsSync(path.join(ROOT, "dist", "yeeflow-app-builder-plugin"));

const mirroredFiles = [
  "docs/studies/marketing-event-v045-design-runtime-fidelity-study.md",
  "skills/installed/yeeflow-ui-generation-hard-gates/SKILL.md",
  "docs/standards/yeeflow-application-layout-design-rules.md",
  "docs/standards/ui-summary-kpi-runtime-hard-gates.md",
  "docs/quick-start.md",
  "docs/yeeflow-app-builder-plugin-user-guide.md",
];

if (isSourceRepo) {
  for (const sourcePath of mirroredFiles) {
    const pluginRelativePath = sourcePath.replace("skills/installed/", "skills/");
    const distPath = path.join("dist/yeeflow-app-builder-plugin", pluginRelativePath);
    assert.equal(fs.existsSync(path.join(ROOT, sourcePath)), true, `missing source file: ${sourcePath}`);
    assert.equal(fs.existsSync(path.join(ROOT, distPath)), true, `missing dist mirror: ${distPath}`);
    assert.equal(
      fs.readFileSync(path.join(ROOT, sourcePath), "utf8"),
      fs.readFileSync(path.join(ROOT, distPath), "utf8"),
      `${distPath} must mirror ${sourcePath}`,
    );
  }
} else {
  for (const pluginPath of [
    "docs/studies/marketing-event-v045-design-runtime-fidelity-study.md",
    "skills/yeeflow-ui-generation-hard-gates/SKILL.md",
    "docs/standards/yeeflow-application-layout-design-rules.md",
    "docs/standards/ui-summary-kpi-runtime-hard-gates.md",
    "docs/quick-start.md",
    "docs/yeeflow-app-builder-plugin-user-guide.md",
  ]) {
    assert.equal(fs.existsSync(path.join(ROOT, pluginPath)), true, `missing plugin file: ${pluginPath}`);
  }
}

const study = read("docs/studies/marketing-event-v045-design-runtime-fidelity-study.md");
const trainingCorpus = [
  study,
  read(isSourceRepo ? "skills/installed/yeeflow-ui-generation-hard-gates/SKILL.md" : "skills/yeeflow-ui-generation-hard-gates/SKILL.md"),
  read("docs/standards/yeeflow-application-layout-design-rules.md"),
  read("docs/standards/ui-summary-kpi-runtime-hard-gates.md"),
  read("docs/quick-start.md"),
  read("docs/yeeflow-app-builder-plugin-user-guide.md"),
].join("\n\n");

const requiredPhrases = [
  "exact primary navigation labels and order",
  "Event Portfolio",
  "Planning Workbench",
  "Registration & Leads",
  "Budget Review",
  "Post-event Reporting",
  "Admin",
  "hidden support resources",
  "Support data lists, forms, approval pages, and implementation-only resources must not automatically appear in the primary navigation",
  "Visible primary navigation must be generated from the approved UI contract, not inferred from all resources in the package",
  "ListSet.LayoutView.sort",
  "explicitly refresh Chrome before screenshot capture",
  "nav-scoped or exact-line",
  "Broad body-text scans are not reliable navigation proof",
  "Signing, verifysign, upgrade-check, and upgrade-apply are not visual proof",
  "KPI card",
  "badge",
  "progress",
  "avatar",
  "spacing",
  "hierarchy",
  "mock-vs-runtime KPI",
  "before/after mutation evidence",
  "BROWSER_REFRESH_REQUIRED_BEFORE_RUNTIME_SCREENSHOT",
  "VISIBLE_NAV_MENU_MISMATCH",
  "SUPPORT_RESOURCE_VISIBLE_IN_PRIMARY_NAV",
  "BROAD_BODY_TEXT_NAV_SCAN_UNRELIABLE",
  "SCHEMA_INVALID_HIDDEN_RESOURCE_MUTATION",
  "INSTALL_SUCCESS_NOT_VISUAL_PROOF",
  "MOCK_VALUE_RUNTIME_VALUE_BOUNDARY_REQUIRED",
  "KPI_CARD_VISUAL_FIDELITY_WEAK",
  "TABLE_VISUAL_FIDELITY_WEAK",
  "CONTENT_HIERARCHY_FIDELITY_WEAK",
  "DESIGNER_SURFACE_CONTROL_PRESENT",
];

for (const phrase of requiredPhrases) {
  assert.ok(trainingCorpus.includes(phrase), `training materials missing phrase: ${phrase}`);
}

const backlogPhrases = [
  "Implemented in P0 by `scripts/inspect-runtime-navigation-proof.mjs`",
  "exact primary navigation contract validator",
  "runtime refresh evidence gate",
  "nav-scoped or exact-line runtime evidence checker",
  "support-resource primary-nav visibility checker",
  "sign/upgrade visual-proof boundary checker",
  "Content-fidelity report schema",
  "KPI card visual structure checker",
  "Table badge/progress/avatar structure checker",
  "Mock-vs-runtime KPI value boundary checker",
  "Visual comparison helper if a reliable screenshot parser is later introduced",
];

for (const phrase of backlogPhrases) {
  assert.ok(study.includes(phrase), `study backlog missing phrase: ${phrase}`);
}

const forbiddenPatterns = [
  /\.(png|jpg|jpeg|yapk)\b/i,
  /"Resource"\s*:/,
  /"Sign"\s*:/,
  /\b(?:access|refresh|id)_token\b/i,
  /\bBearer\s+[A-Za-z0-9._-]+/i,
  /\bsk-[A-Za-z0-9_-]+/i,
  /\bhttps?:\/\/(?!github\.com|example\.invalid)[^\s)]+/i,
  /\b\d{15,}\b/,
];

for (const pattern of forbiddenPatterns) {
  assert.doesNotMatch(study, pattern, `study contains forbidden private/raw-looking content: ${pattern}`);
}

console.log(JSON.stringify({
  status: "pass",
  cases: [
    "sanitized Marketing Event v0.6.45 study exists and is mirrored",
    "training docs mention exact primary navigation labels/order",
    "training docs mention hidden support resources and ListSet.LayoutView.sort",
    "training docs require explicit Chrome refresh before runtime screenshots",
    "training docs require nav-scoped or exact-line navigation evidence",
    "training docs reject broad body-text navigation scans",
    "training docs preserve signing/upgrade visual-proof boundary",
    "training docs cover KPI/table/badge/progress/avatar/spacing/hierarchy content-fidelity categories",
    "training docs preserve mock-vs-runtime KPI value boundary",
    "training docs require before/after mutation evidence for dynamic KPI proof",
    "study keeps future validators in backlog and avoids raw evidence artifacts",
  ],
}, null, 2));

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

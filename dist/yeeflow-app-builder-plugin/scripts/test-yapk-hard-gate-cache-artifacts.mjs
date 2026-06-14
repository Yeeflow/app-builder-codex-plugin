#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const hardGateScripts = [
  "scripts/validate-yapk-id-provenance.mjs",
  "scripts/validate-yapk-navigation-runtime-metadata.mjs",
  "scripts/validate-yapk-upgrade-id-stability.mjs",
  "scripts/validate-dashboard-grid-table-collections.mjs",
  "scripts/generate-ui-contract-from-design.mjs",
  "scripts/capture-runtime-ui-evidence.mjs",
  "scripts/validate-ui-upgrade-scope.mjs",
  "scripts/compare-design-to-runtime-structure.mjs",
  "scripts/inspect-ui-closed-loop-workflow-enforcement.mjs",
  "scripts/inspect-application-layout-design-rules.mjs",
  "scripts/yapk-first-generation-preflight.mjs",
  "scripts/test-yapk-id-navigation-hard-gates.mjs",
  "scripts/test-yapk-upgrade-id-stability.mjs",
  "scripts/test-dashboard-grid-table-collections.mjs",
  "scripts/test-ui-closed-loop-phase1.mjs",
  "scripts/test-ui-closed-loop-phase2.mjs",
  "scripts/test-ui-closed-loop-phase3.mjs",
  "scripts/test-ui-closed-loop-phase3b.mjs",
  "scripts/test-application-layout-design-rules.mjs",
];

for (const sourcePath of hardGateScripts) {
  const distPath = path.join("dist/yeeflow-app-builder-plugin", sourcePath);
  assert.equal(fs.existsSync(path.join(ROOT, sourcePath)), true, `${sourcePath} exists`);
  assert.equal(fs.existsSync(path.join(ROOT, distPath)), true, `${distPath} exists for materialized cache smoke`);
  assert.equal(
    fs.readFileSync(path.join(ROOT, distPath), "utf8"),
    fs.readFileSync(path.join(ROOT, sourcePath), "utf8"),
    `${distPath} mirrors ${sourcePath}`,
  );
}

const requiredDocs = [
  "docs/standards/yeeflow-application-layout-design-rules.md",
];

for (const sourcePath of requiredDocs) {
  const distPath = path.join("dist/yeeflow-app-builder-plugin", sourcePath);
  assert.equal(fs.existsSync(path.join(ROOT, sourcePath)), true, `${sourcePath} exists`);
  assert.equal(fs.existsSync(path.join(ROOT, distPath)), true, `${distPath} exists for materialized cache smoke`);
  assert.equal(
    fs.readFileSync(path.join(ROOT, distPath), "utf8"),
    fs.readFileSync(path.join(ROOT, sourcePath), "utf8"),
    `${distPath} mirrors ${sourcePath}`,
  );
}

console.log("YAPK hard-gate cache artifact checks passed");

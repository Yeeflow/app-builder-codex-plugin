#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateDashboardDatasetPresentationGoldenReferences } from "./validate-dashboard-dataset-presentation-golden-references.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = path.join(ROOT, "docs/reference/dashboard-dataset-presentation-golden-references.json");
const MATERIALIZER_PATH = path.join(ROOT, "scripts/materialize-full-app-generated-final.mjs");
const VALIDATOR_PATH = path.join(ROOT, "scripts/validate-dashboard-dataset-presentation-golden-references.mjs");
const retired = {
  collection_control_grid_table: "collection_control_responsive",
  collection_control_grid_table_with_multiselect: "collection_control_responsive_multiple_select",
};

const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
const activeTemplateIds = new Set(registry.approvedTemplateIds || []);
const activeReferenceIds = new Set((registry.references || []).map((entry) => entry.templateId));

for (const [retiredId, replacementId] of Object.entries(retired)) {
  assert.equal(activeTemplateIds.has(retiredId), false, `${retiredId} must not remain an approved Collection template`);
  assert.equal(activeReferenceIds.has(retiredId), false, `${retiredId} must not remain a Collection golden-reference entry`);
  assert.equal(registry.retiredTemplateMigrations?.[retiredId]?.replacementTemplateId, replacementId, `${retiredId} must retain its explicit responsive migration target`);
  assert.equal(activeTemplateIds.has(replacementId), true, `${replacementId} must remain approved`);
}

const materializer = fs.readFileSync(MATERIALIZER_PATH, "utf8");
const collectionTemplatePaths = materializer.match(/const COLLECTION_TEMPLATE_PATHS = \{([\s\S]*?)\n\};/u)?.[1] || "";
assert.doesNotMatch(collectionTemplatePaths, /collection_control_grid_table(?:_with_multiselect)?\s*:/u, "retired templates must not be materializable Collection template paths");
assert.match(materializer, /collection_control_grid_table:\s*"collection_control_responsive"/u, "base legacy template must migrate to the responsive Collection");
assert.match(materializer, /collection_control_grid_table_with_multiselect:\s*"collection_control_responsive_multiple_select"/u, "legacy multiselect template must migrate to the responsive multiselect Collection");
assert.match(materializer, /retiredCollectionTemplateMigrations/u, "materialization metadata must record retired-template migrations");
assert.match(materializer, /function configureReverseRelatedCollectionRuntime[\s\S]*?collection\.attrs = \{\s*\.\.\.\(collection\.attrs \|\| \{\}\)/u, "reverse-related runtime binding must preserve the responsive Collection's native Table/Card structure");

const validator = fs.readFileSync(VALIDATOR_PATH, "utf8");
assert.match(validator, /DASH_DATASET_APP_PLAN_TEMPLATE_RETIRED_MIGRATED/u, "App Plan validation must emit a retirement migration warning");
assert.match(validator, /DASH_DATASET_PACKAGE_TEMPLATE_RETIRED/u, "existing packages must remain compatibility-readable with a retirement warning");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "retired-collection-template-migration-"));
try {
  const appPlan = path.join(tempDir, "yeeflow-app-plan.md");
  fs.writeFileSync(appPlan, `# Legacy Collection Migration\n\n## 14. Dashboard Pages Plan\n\n| Dashboard Page | Dataset Region | Source Resource | Selected Record Display Control | Selected Collection Presentation Reference | Selection Rationale |\n| --- | --- | --- | --- | --- | --- |\n| Project Register | Projects | Projects | Collection | collection_control_grid_table | Dense operational table with native columns and a mobile card view. |\n| Project Register | Project batch update | Projects | Collection | collection_control_grid_table_with_multiselect | Multi-row selection, selected count, and batch completion with a responsive mobile card view. |\n`, "utf8");
  const report = validateDashboardDatasetPresentationGoldenReferences({ appPlan });
  assert.equal(report.status, "pass", JSON.stringify(report.findings, null, 2));
  const migrations = report.findings.filter((finding) => finding.code === "DASH_DATASET_APP_PLAN_TEMPLATE_RETIRED_MIGRATED");
  assert.deepEqual(migrations.map((finding) => [finding.retiredTemplateId, finding.replacementTemplateId]).sort(), Object.entries(retired).sort(), "both retired IDs must produce an explicit App Plan migration warning");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log(JSON.stringify({
  status: "pass",
  assertion: "legacy Collection golden references are retired and migrate only to responsive replacements",
}, null, 2));

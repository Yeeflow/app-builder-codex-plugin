#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MATERIALIZER = path.join(ROOT, "scripts/materialize-full-app-generated-final.mjs");
const RESPONSIVE_TEMPLATE = path.join(ROOT, "docs/reference/collection-control-responsive.template.json");

function identities(node) {
  return [node?.id, node?.name, node?.label, node?.title, node?.nv_label, node?.nav_label, node?.attrs?.nv_label, node?.attrs?.nav_label]
    .filter(Boolean)
    .map(String);
}

function findByIdentity(root, identity) {
  if (!root || typeof root !== "object") return null;
  if (identities(root).includes(identity)) return root;
  for (const child of Array.isArray(root.children) ? root.children : []) {
    const found = findByIdentity(child, identity);
    if (found) return found;
  }
  return null;
}

const source = fs.readFileSync(MATERIALIZER, "utf8");
const responsiveDefaults = [
  'collectionTemplate: cleanResourceName(cells[templateColumn]) || "collection_control_responsive",',
  'const selectedTemplateId = primaryDatasetRecord?.selectedTemplateId || "collection_control_responsive";',
  'templateId: record.selectedTemplateId || "collection_control_responsive",',
  'selectedTemplateId: leftTemplateId || "collection_control_responsive",',
  'selectedTemplateId: currentTemplateId || leftTemplateId || "collection_control_responsive",',
  'const templateId = selectedTemplateId || "collection_control_responsive";',
  'const templatePath = COLLECTION_TEMPLATE_PATHS[templateId] || COLLECTION_TEMPLATE_PATHS.collection_control_responsive;',
];

for (const expectedDefault of responsiveDefaults) {
  assert.ok(source.includes(expectedDefault), `responsive Collection fallback is missing: ${expectedDefault}`);
}
assert.doesNotMatch(
  source,
  /\|\|\s*"collection_control_grid_table"/u,
  "ordinary Collection fallback paths must not default to the legacy Flex Grid template",
);

const template = JSON.parse(fs.readFileSync(RESPONSIVE_TEMPLATE, "utf8"));
const collection = findByIdentity(template.templateResource?.rootContainer || template, "grid_table_col_body");
assert.equal(collection?.type, "collection", "the ordinary Collection fallback must resolve to the responsive Collection template");
assert.ok(Array.isArray(collection?.attrs?.tablecols) && collection.attrs.tablecols.length >= 3, "the responsive fallback must retain native desktop/tablet Table columns");
assert.ok(Array.isArray(collection?.children) && collection.children.length > 0, "the responsive fallback must retain a non-empty mobile Card view");

console.log(JSON.stringify({
  status: "pass",
  assertion: "ordinary Collection fallback routes to collection_control_responsive with Table and Card views",
}, null, 2));

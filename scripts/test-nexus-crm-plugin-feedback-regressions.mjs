#!/usr/bin/env node

// Nexus CRM feedback is intentionally guarded at the Plugin static/fixture
// layer. Tenant Designer, persisted readback, and runtime proof remain
// separate evidence boundaries and are not synthesized by this regression.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");

function findByIdentity(node, identity) {
  if (!node || typeof node !== "object") return null;
  if ([node.id, node.name, node.nv_label, node.label].includes(identity)) return node;
  for (const child of Array.isArray(node.children) ? node.children : []) {
    const found = findByIdentity(child, identity);
    if (found) return found;
  }
  return null;
}

function runFixture(script) {
  const result = spawnSync(process.execPath, [path.join(ROOT, "scripts", script)], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  assert.equal(result.status, 0, `${script} failed.\n${result.stdout}\n${result.stderr}`);
}

const responsive = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/collection-control-responsive.template.json"), "utf8"));
const root = responsive?.templateResource?.rootContainer;
for (const identity of ["grid_table_col_wrapper", "grid_table_col_caption", "grid_table_col_content"]) {
  assert.deepEqual(findByIdentity(root, identity)?.attrs?.style?.widthtype, [null, "1"], `${identity} must remain Full width after business mapping.`);
}
for (const identity of ["grid_table_col_operations", "op_normal"]) {
  const style = findByIdentity(root, identity)?.attrs?.style || {};
  assert.deepEqual(style.widthtype, [null, "2", "1"], `${identity} must be inline on PC/tablet and Full width on mobile.`);
  assert.deepEqual(style.gap, [null, 10], `${identity} must preserve the exported operation spacing.`);
  assert.deepEqual(style.align_items, [null, "center"], `${identity} must preserve centered item alignment.`);
  assert.deepEqual(style.justify_content, [null, "flex-end"], `${identity} must preserve right-aligned item operations.`);
}

const dashboardGates = fs.readFileSync(path.join(ROOT, "scripts/validate-dashboard-generation-hard-gates.mjs"), "utf8");
for (const code of [
  "DASH_SEARCH_FILTER_LABEL_VISIBLE",
  "DASH_SEARCH_FILTER_BINDING_MISSING",
  "DASH_SEARCH_FILTER_COLLECTION_FULLTEXT_CONSUMER_MISSING",
  "DASH_CAPTION_ACTION_BUTTON_INLINE_WIDTH_MISSING",
  "DASH_CAPTION_ADD_ACTION_TARGET_MISSING",
  "DASH_KPI_SUMMARY_HOST_VISIBLE",
]) assert.match(dashboardGates, new RegExp(code));

const formGates = fs.readFileSync(path.join(ROOT, "scripts/validate-data-list-form-layout-template.mjs"), "utf8");
for (const code of [
  "DATA_LIST_FORM_CONTROL_DISPLAY_CROSS_NODE_TARGET",
  "DATA_LIST_FORM_REVERSE_RELATED_FULL_WIDTH_MISSING",
  "DATA_LIST_FORM_REVERSE_RELATED_COLLECTION_ATTRS_UNOFFICIAL",
  "DATA_LIST_FORM_REVERSE_RELATED_RESPONSIVE_ATTRS_MISSING",
  "DATA_LIST_FORM_REVERSE_RELATED_RESPONSIVE_PRESENTATION_MISSING",
  "DATA_LIST_FORM_LAYOUTVIEW_RESOURCE_DRIFT",
]) assert.match(formGates, new RegExp(code));

for (const script of [
  "test-dashboard-generation-hard-gates.mjs",
  "test-dashboard-dataset-presentation-golden-references.mjs",
  "test-data-list-form-layout-template-gates.mjs",
  "test-dashboard-v11-summary-host-dynamic-user-gates.mjs",
]) runFixture(script);

console.log(JSON.stringify({
  status: "pass",
  marker: "NEXUS_CRM_PLUGIN_FEEDBACK_PIF_001_011_STATIC_FIXTURE_GATES_PASSED",
  covered: {
    "PIF-001": "dashboard search hidden-label and primitive-placeholder contracts",
    "PIF-002": "caption Add self-contained action and inline width contracts",
    "PIF-003": "responsive operation presentation and mobile Full width contracts",
    "PIF-004": "direct type-5 Add target contract",
    "PIF-005": "non-rendering KPI Summary host static/fixture proof only",
    "PIF-006": "search binding requires Collection fulltext consumer",
    "PIF-007": "Type-1 control_display target ownership gate",
    "PIF-008": "reverse-related responsive Full width and template-residue gates",
    "PIF-009": "LayoutView and LayoutInResources equivalence regression",
    "PIF-010": "responsive reverse-related native attrs, Card tree, and child mapping shape gates",
    "PIF-011": "responsive template source contracts",
  },
  proofBoundary: {
    staticFixture: ["PIF-001", "PIF-002", "PIF-003", "PIF-004", "PIF-005", "PIF-006", "PIF-007", "PIF-008", "PIF-009", "PIF-010", "PIF-011"],
    tenantDesigner: "not exercised",
    tenantRuntime: "not exercised",
    roundTrip: "not exercised",
  },
}, null, 2));

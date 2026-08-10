#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { remapDashboardActionTargets } from "./lib/dashboard-action-target-remapper.mjs";
import { validateDashboardActionReferenceClosure } from "./validate-dashboard-action-reference-closure.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = path.join(root, "fixtures/dashboard-action-reference-closure/clone-before-remap.json");
const source = JSON.parse(fs.readFileSync(fixture, "utf8"));
const mappings = {
  listIds: { "old-opportunities": "target-opportunities", "old-activities": "target-activities" },
  layoutIds: { "old-opportunities-new": "target-opportunities-new", "old-activities-new": "target-activities-new", "old-activities-edit": "target-activities-edit" },
  actionIds: { "old-open-activity": "open-target-activity" },
};

const remapped = structuredClone(source);
const result = remapDashboardActionTargets(remapped, mappings);
assert.equal(result.counts.list, 4, "Button and Collection list targets must be remapped");
assert.equal(result.counts.layout, 3, "Add/Edit layouts must be remapped");
assert.equal(result.counts.action, 2, "local action id and item-template control_action must be remapped");
const closure = validateDashboardActionReferenceClosure({ decoded: remapped, staleIds: Object.keys(mappings.listIds).concat(Object.keys(mappings.layoutIds), Object.keys(mappings.actionIds)), evidence: { apiAccepted: { status: "passed" }, persistedReadback: { status: "passed" } } });
assert.equal(closure.status, "pass", "remapped in-current-app actions must close");
assert.equal(closure.evidence.actionsUsable, false, "API acceptance and readback must not be reported as action-runtime proof");

const staleLayout = structuredClone(remapped);
const staleResource = JSON.parse(staleLayout.Pages[0].LayoutInResources[0].Resource);
staleResource.children[0].attrs.layout = "old-opportunities-new";
staleLayout.Pages[0].LayoutInResources[0].Resource = JSON.stringify(staleResource);
expectCode(staleLayout, "DASHBOARD_STALE_LAYOUT_REFERENCE");
expectCode(staleLayout, "DASHBOARD_ACTION_LAYOUT_UNRESOLVED");

const missingOpen = structuredClone(remapped);
const openResource = JSON.parse(missingOpen.Pages[0].LayoutInResources[0].Resource);
delete openResource.children[1].children[0].attrs.control_action;
missingOpen.Pages[0].LayoutInResources[0].Resource = JSON.stringify(openResource);
expectCode(missingOpen, "DASHBOARD_COLLECTION_OPEN_ACTION_MISSING");

console.log("DASHBOARD_ACTION_REFERENCE_CLOSURE_TESTS_PASSED");

function expectCode(decoded, code) {
  const report = validateDashboardActionReferenceClosure({ decoded, staleIds: Object.keys(mappings.listIds).concat(Object.keys(mappings.layoutIds), Object.keys(mappings.actionIds)) });
  assert.equal(report.status, "fail", `${code} case must fail`);
  assert.ok(report.findings.some((finding) => finding.code === code), `${code} must be emitted`);
}

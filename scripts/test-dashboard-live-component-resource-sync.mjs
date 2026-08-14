#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDashboardEvidenceReport,
  classifyLiveDashboardResourceMode,
  normalizeLiveDashboardDetail,
  validateLiveDashboardDetail,
  validateLiveDashboardPostSave,
} from "./lib/dashboard-live-component-resource-sync.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const embeddedOnly = JSON.parse(readFileSync(resolve(root, "fixtures/dashboard-live-component-resource-sync/embedded-custom-code-dashboard-component.json"), "utf8"));
const page = JSON.parse(embeddedOnly.Detail.LayoutInResources[0].Resource);
assert.equal(classifyLiveDashboardResourceMode(embeddedOnly).mode, "embedded-only");
assert.equal(validateLiveDashboardDetail(embeddedOnly, { profile: "custom-code" }).status, "pass", "an embedded-only Dashboard with blank LayoutView is valid");

const normalized = normalizeLiveDashboardDetail(embeddedOnly, page);
assert.equal(normalized.Detail.LayoutView, "", "normalization must preserve the existing embedded-only LayoutView mode");
assert.equal(normalized.Detail.Ext2, embeddedOnly.Detail.Ext2, "normalization must retain src/generatedFinal component markers");

const missingResource = structuredClone(embeddedOnly);
missingResource.Detail.LayoutInResources = [];
assert.ok(validateLiveDashboardDetail(missingResource, { profile: "custom-code" }).findings.some((entry) => entry.code === "DASHBOARD_RESOURCE_NOT_MATERIALIZED"));

const idMismatch = structuredClone(embeddedOnly);
idMismatch.Detail.LayoutInResources[0].RefId = "wrong-layout";
assert.ok(validateLiveDashboardDetail(idMismatch, { profile: "custom-code" }).findings.some((entry) => entry.code === "DASHBOARD_RESOURCE_ID_MISMATCH"));

const noMain = structuredClone(embeddedOnly);
noMain.Detail.LayoutInResources[0].Resource = JSON.stringify({ id: "root", children: [] });
assert.ok(validateLiveDashboardDetail(noMain, { profile: "custom-code" }).findings.some((entry) => entry.code === "DASHBOARD_ROOT_STRUCTURE_INVALID"));

const noCodeIn = structuredClone(embeddedOnly);
noCodeIn.Detail.LayoutInResources[0].Resource = JSON.stringify({ id: "root", children: [{ id: "main", children: [{ id: "content", children: [] }] }] });
assert.ok(validateLiveDashboardDetail(noCodeIn, { profile: "custom-code" }).findings.some((entry) => entry.code === "DASHBOARD_CODEIN_MISSING"));

const persistedDrift = structuredClone(normalized);
persistedDrift.Detail.LayoutInResources[0].Resource = JSON.stringify({ id: "root", children: [{ id: "main", children: [{ id: "content", children: [] }] }] });
assert.ok(validateLiveDashboardPostSave(normalized, persistedDrift, { profile: "custom-code" }).findings.some((entry) => entry.code === "DASHBOARD_POSTSAVE_DRIFT"));

assert.deepEqual(buildDashboardEvidenceReport({ apiAccepted: true, persistedReadback: true }), {
  apiAccepted: true,
  persistedReadback: true,
  designerOpen: false,
  browserActionRuntime: false,
  actionsUsable: false,
  strongestEvidence: "persistedReadback",
});

console.log("DASHBOARD_LIVE_COMPONENT_RESOURCE_SYNC_TESTS_PASSED");

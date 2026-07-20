#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "compatibility/capability-manifests/dashboard-v11-summary-host-dynamic-user-fixture-and-slot-selection-reconciliation.v0.1.0.json");
const testPath = path.join(root, "scripts/test-dashboard-v11-summary-host-dynamic-user-gates.mjs");
const materializerPath = path.join(root, "scripts/materialize-full-app-generated-final.mjs");
const materializerArtifactPath = path.join(root, "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs");
const historicalZipPath = path.join(root, "dist/yeeflow-app-builder-plugin-0.9.71.zip");
const batchJPath = path.join(root, "compatibility/capability-manifests/core-extraction-wave3-batch-j-dashboard-static-configuration-selection-and-execution.v0.1.0.json");

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const testSource = fs.readFileSync(testPath, "utf8");
const materializerSource = fs.readFileSync(materializerPath, "utf8");
const batchJ = JSON.parse(fs.readFileSync(batchJPath, "utf8"));

assert.equal(manifest.marker, "DASHBOARD_V11_SUMMARY_HOST_DYNAMIC_USER_FIXTURE_SLOT_SELECTION_RECONCILED");
assert.equal(manifest.decision.classification, "stale_incomplete_fixture_test");
assert.equal(manifest.decision.productionSourceBug, false);
assert.equal(manifest.decision.approvedTransitionRegression, false);
assert.equal(manifest.decision.nextWorkItem, "Wave 3 Batch K proof-envelope selection");
assert.equal(sha256(materializerPath), manifest.checksums.materializerSha256, "Reconciliation must not change the sealed Batch J materializer source");
assert.equal(sha256(materializerArtifactPath), manifest.checksums.materializerCoreArtifactSha256, "Reconciliation must not change the Core artifact");
assert.equal(sha256(historicalZipPath), manifest.checksums.historicalZipSha256, "Reconciliation must not change the historical ZIP");
assert.equal(batchJ.marker, "CORE_EXTRACTION_WAVE3_BATCH_J_DASHBOARD_STATIC_CONFIGURATION_PASSED");
assert.deepEqual(batchJ.extracted.functions, [
  "scripts/materialize-full-app-generated-final.mjs#normalizeDashboardFilters@6870",
  "scripts/materialize-full-app-generated-final.mjs#isDateLikeAnalyticsField@7354",
]);
assert.match(materializerSource, /function collectDataListFieldSpecs\(/);
assert.match(materializerSource, /function buildCollectionTemplateInstance\(/);
assert.match(materializerSource, /function selectFieldForDynamicControl\(/);
assert.match(materializerSource, /function dynamicControlTypeForField\(/);
assert.match(testSource, /### 4\.1 Doctor Profiles/);
assert.doesNotMatch(testSource, /### 4\.1 Data List Schema Table/);
assert.match(testSource, /Employee Number \| Text2 \| Text/);
assert.match(testSource, /Profile Owner \| Text4 \| identity-picker/);
assert.match(testSource, /\["Title", "Text4", "Text2"\]/);
assert.match(testSource, /DASHBOARD_V11_SUMMARY_HOST_DYNAMIC_USER_FIXTURE_SLOT_SELECTION_RECONCILED/);

const output = execFileSync(process.execPath, [testPath], { cwd: root, encoding: "utf8" });
assert.match(output, /"status": "pass"/);
assert.match(output, /DASHBOARD_V11_SUMMARY_HOST_DYNAMIC_USER_FIXTURE_SLOT_SELECTION_RECONCILED/);

console.log("DASHBOARD_V11_SUMMARY_HOST_DYNAMIC_USER_FIXTURE_SLOT_SELECTION_RECONCILIATION_VALID");

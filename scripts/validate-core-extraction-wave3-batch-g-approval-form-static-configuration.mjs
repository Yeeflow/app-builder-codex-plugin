#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = json("compatibility/capability-manifests/core-extraction-wave3-batch-g-approval-form-static-configuration.v0.1.0.json");
const registry = json("compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.1.0.json");
const inventory = json("compatibility/capability-manifests/core-extraction-production-ownership-inventory.v1.1.0.json");
const materializer = read("scripts/materialize-full-app-generated-final.mjs");
const core = read("packages/app-builder-core-materializer/src/internal/approval-form-static-configuration.ts");
const extracted = ["wave-3-envelope-31", "wave-3-envelope-55", "wave-3-envelope-67", "wave-3-envelope-95"];
const hostOnly = ["wave-3-envelope-34", "wave-3-envelope-38", "wave-3-envelope-94"];

if (contract.marker !== "CORE_EXTRACTION_WAVE3_BATCH_G_APPROVAL_FORM_STATIC_CONFIGURATION_PASSED") fail("CORE_EXTRACTION_WAVE3_BATCH_G_CONTRACT_INVALID");
for (const id of extracted) {
  const envelope = registry.envelopes.find((item) => item.id === id);
  if (envelope?.status !== "accepted-extracted-and-routed") fail("CORE_EXTRACTION_WAVE3_BATCH_G_EXTRACTED_ENVELOPE_INVALID");
}
for (const id of hostOnly) {
  const envelope = registry.envelopes.find((item) => item.id === id);
  if (envelope?.status !== "reclassified-host-or-specialist-route" || !envelope.reclassificationReason) fail("CORE_EXTRACTION_WAVE3_BATCH_G_HOST_BOUNDARY_INVALID");
}
if (contract.progress?.wave3CoreExtractedEnvelopes !== "24/89" || contract.progress?.wave3TerminalDispositionEnvelopes?.total !== "42/89" || contract.progress?.weightedCoreCompletion !== 48.1461) fail("CORE_EXTRACTION_WAVE3_BATCH_G_PROGRESS_INVALID");
if (!materializer.includes("coreProjectApprovalFormStaticConfiguration") || !materializer.includes("legacyUniqueApprovalFieldSpecs") || !materializer.includes("legacyBuildApprovalNoFieldsNotice")) fail("CORE_EXTRACTION_WAVE3_BATCH_G_ROUTE_OR_ROLLBACK_INVALID");
if (core.includes("node:") || core.includes("WeakMap") || core.includes("fetch(") || core.includes("DataList")) fail("CORE_EXTRACTION_WAVE3_BATCH_G_CORE_BOUNDARY_LEAK");
if (inventory.functions.some((item) => extracted.some((id) => registry.envelopes.find((envelope) => envelope.id === id).functionIds.includes(item.id)) && item.extractionStatus !== "accepted-extracted-or-envelope-covered")) fail("CORE_EXTRACTION_WAVE3_BATCH_G_INVENTORY_INVALID");
console.log("CORE_EXTRACTION_WAVE3_BATCH_G_STRUCTURAL_VALID");

function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function fail(code) { console.error(code); process.exit(1); }

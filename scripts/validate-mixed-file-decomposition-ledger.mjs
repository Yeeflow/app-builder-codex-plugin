#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const options = parseArgs(process.argv.slice(2));
const ledgerPath = resolve(root, options.ledger || "compatibility/capability-manifests/yeeflow-app-builder-mixed-file-decomposition.v0.9.71.json");
const manifestPath = resolve(root, options.manifest || "compatibility/capability-manifests/yeeflow-app-builder-capability-classification.v0.9.71.json");
const graphPath = resolve(root, options.graph || "compatibility/capability-manifests/app-builder-core-package-dependency-graph.v0.1.0.json");
const requiredFields = ["sourcePath", "currentClassification", "fileRole", "sourceDistTopologyRelationship", "publicEntryPoints", "exportedFunctionsClassesConstants", "internalSignificantFunctions", "callers", "importsAndDependencies", "detectedSideEffects", "codexSpecificResponsibilities", "localRuntimeResponsibilities", "deterministicCoreResponsibilities", "compatibilityResponsibilities", "evidenceOnlyResponsibilities", "proposedTargetPackage", "proposedLocalRuntimeModule", "proposedCodexAdapterModule", "compatibilityShimPath", "migrationBatch", "migrationPriority", "migrationRisk", "requiredBaselineFixtures", "requiredDifferentialTests", "blockingUnknowns", "recommendedAction", "rationale"];
const actions = new Set(["extract-to-core", "split-core-runtime-adapter", "retain-in-adapter", "retain-as-compatibility-shim", "evidence-only", "generated-only", "defer-materializer"]);
let ledger;
try { ledger = readJson(ledgerPath); } catch (error) { fail("DECOMPOSITION_LEDGER_INVALID_JSON", `Ledger could not be parsed: ${error.message}`); }
const manifest = readJson(manifestPath);
const graph = readJson(graphPath);
const expected = new Set(manifest.records.filter((record) => ["core", "mixed", "compatibility-shim"].includes(record.classification) && !record.sourcePath.startsWith("dist/") && !isProtected(record.sourcePath)).map((record) => record.sourcePath));
const approved = new Set(graph.packages.map((item) => item.name));
const seen = new Set();
const records = Array.isArray(ledger.records) ? ledger.records : fail("DECOMPOSITION_LEDGER_MISSING", "Ledger records must be an array.");
for (const record of records) validateRecord(record);
for (const sourcePath of expected) if (!seen.has(sourcePath)) fail("DECOMPOSITION_LEDGER_SOURCE_RECORD_MISSING", `Missing classified source record: ${sourcePath}`);
for (const sourcePath of seen) if (!expected.has(sourcePath)) fail("DECOMPOSITION_LEDGER_SOURCE_RECORD_OUT_OF_SCOPE", `Ledger source record is outside the classified audit scope: ${sourcePath}`);
const rawLedger = readFileSync(ledgerPath, "utf8");
if (/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/u.test(rawLedger)) fail("DECOMPOSITION_LEDGER_NON_ENGLISH", "Ledger contains CJK text; persisted audit content must be English.");
console.log(`DECOMPOSITION_LEDGER_VALID records=${records.length}`);

function validateRecord(record) {
  if (!record || typeof record !== "object") fail("DECOMPOSITION_LEDGER_RECORD_INVALID", "Ledger record must be an object.");
  for (const field of requiredFields) if (!(field in record)) fail("DECOMPOSITION_LEDGER_RECORD_FIELD_MISSING", `Ledger record is missing required field ${field}.`);
  if (typeof record.sourcePath !== "string" || !record.sourcePath) fail("DECOMPOSITION_LEDGER_RECORD_FIELD_MISSING", "Ledger record sourcePath must be a non-empty string.");
  if (seen.has(record.sourcePath)) fail("DECOMPOSITION_LEDGER_DUPLICATE_SOURCE_PATH", `Duplicate ledger sourcePath: ${record.sourcePath}`);
  seen.add(record.sourcePath);
  if (isProtected(record.sourcePath)) fail("DECOMPOSITION_LEDGER_PROTECTED_PATH", `Protected duplicate path is not allowed in the ledger: ${record.sourcePath}`);
  if (record.sourcePath.startsWith("dist/")) fail("DECOMPOSITION_LEDGER_GENERATED_DIST_SOURCE", `Generated distribution path cannot be a migration source: ${record.sourcePath}`);
  if (!approved.has(record.proposedTargetPackage)) fail("DECOMPOSITION_LEDGER_TARGET_PACKAGE_UNKNOWN", `Unknown proposed target package: ${record.proposedTargetPackage}`);
  if (!actions.has(record.recommendedAction)) fail("DECOMPOSITION_LEDGER_ACTION_INVALID", `Unknown recommended action: ${record.recommendedAction}`);
  if (record.currentClassification === "mixed" && record.proposedFinalClassification !== "core" && (!record.proposedLocalRuntimeModule || !record.proposedCodexAdapterModule)) fail("DECOMPOSITION_LEDGER_MIXED_SPLIT_PLAN_MISSING", `Mixed record lacks a Local Runtime and Codex Adapter split plan: ${record.sourcePath}`);
  if (record.currentClassification === "mixed" && record.proposedFinalClassification === "core" && (record.proposedLocalRuntimeModule || record.proposedCodexAdapterModule)) fail("DECOMPOSITION_LEDGER_CORE_EXTRACTION_HOST_MODULE", `Pure Core extraction cannot declare Runtime or Adapter modules: ${record.sourcePath}`);
  if (record.currentClassification === "core" && record.detectedSideEffects.length) fail("DECOMPOSITION_LEDGER_CORE_HOST_SIDE_EFFECT", `Core candidate declares host side effects: ${record.sourcePath}`);
  if (record.currentClassification === "compatibility-shim" && (!record.proposedTargetPackage || !record.compatibilityShimPath)) fail("DECOMPOSITION_LEDGER_COMPATIBILITY_TARGET_MISSING", `Compatibility shim lacks a target implementation: ${record.sourcePath}`);
  if (!Array.isArray(record.requiredBaselineFixtures) || !record.requiredBaselineFixtures.length || !Array.isArray(record.requiredDifferentialTests) || !record.requiredDifferentialTests.length) fail("DECOMPOSITION_LEDGER_TEST_REQUIREMENT_MISSING", `Migration record lacks baseline fixture or differential-test requirements: ${record.sourcePath}`);
  if (/(?:materialize-|generated-final|generate-.*yapk)/i.test(record.sourcePath.split("/").at(-1)) && (!record.migrationBatch.startsWith("deferred-") || record.recommendedAction !== "defer-materializer")) fail("DECOMPOSITION_LEDGER_MATERIALIZER_IMMEDIATE_BATCH", `Materializer record cannot be assigned to an immediate migration batch: ${record.sourcePath}`);
}
function isProtected(sourcePath) { return / [23]\.[^/]+$/.test(sourcePath); }
function readJson(path) { return JSON.parse(readFileSync(path, "utf8")); }
function parseArgs(args) { const result = {}; for (let index = 0; index < args.length; index += 2) { if (!args[index].startsWith("--") || !args[index + 1]) fail("DECOMPOSITION_LEDGER_ARGUMENT_INVALID", "Arguments must use --name value."); result[args[index].slice(2)] = args[index + 1]; } return result; }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

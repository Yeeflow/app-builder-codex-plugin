#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultManifestPath = resolve(
  repositoryRoot,
  "compatibility/capability-manifests/yeeflow-app-builder-capability-classification.v0.9.71.json",
);
const manifestPath = resolve(repositoryRoot, argumentValue("--manifest") || defaultManifestPath);
const classifications = new Set(["core", "adapter", "mixed", "compatibility-shim", "evidence-only", "generated-distribution"]);
const approvedPackages = new Set([
  "@yeeflow/app-builder-core",
  "@yeeflow/app-builder-core-contracts",
  "@yeeflow/app-builder-core-schemas",
  "@yeeflow/app-builder-core-identity",
  "@yeeflow/app-builder-core-canonical-model",
  "@yeeflow/app-builder-core-planning",
  "@yeeflow/app-builder-core-templates",
  "@yeeflow/app-builder-core-validators",
  "@yeeflow/app-builder-core-builder",
  "@yeeflow/app-builder-core-materializer",
  "@yeeflow/app-builder-core-package-engine",
  "@yeeflow/app-builder-core-repair-engine",
  "@yeeflow/app-builder-core-runtime-client",
  "@yeeflow/app-builder-core-runtime-verification",
  "@yeeflow/app-builder-core-test-fixtures",
  "@yeeflow/app-builder-core-local-runtime",
  "@yeeflow/codex-plugin-adapter",
]);
const hostSideEffects = new Set(["codex", "oauth", "browser", "git", "ai-sdk", "nextjs", "react", "prisma", "terminal", "release", "marketplace"]);
const requiredKeys = ["sourcePath", "classification", "sideEffects", "targetPackage", "parityFixtures", "migrationStatus"];
const findings = [];

if (!existsSync(manifestPath)) {
  fail("CAPABILITY_MANIFEST_MISSING", "Capability classification manifest is missing.");
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (error) {
  fail("CAPABILITY_MANIFEST_INVALID_JSON", `Capability classification manifest cannot be parsed: ${error.message}`);
}

const expectedPaths = new Set([
  ...execFileSync("git", ["ls-files", "-z"], { cwd: repositoryRoot, encoding: "utf8" }).split("\0").filter(Boolean),
  ...(Array.isArray(manifest.migrationOwnedPaths) ? manifest.migrationOwnedPaths : []),
].filter((sourcePath) => !isProtectedDuplicate(sourcePath)));
const records = Array.isArray(manifest.records) ? manifest.records : [];
const recordPaths = new Set();

for (const record of records) {
  for (const key of requiredKeys) {
    if (!(key in record)) findings.push({ code: "CAPABILITY_MANIFEST_RECORD_FIELD_MISSING", path: record.sourcePath || "<unknown>", message: `Record is missing required field ${key}.` });
  }
  if (!classifications.has(record.classification)) findings.push({ code: "CAPABILITY_MANIFEST_CLASSIFICATION_INVALID", path: record.sourcePath, message: "Record has an unsupported classification." });
  if (!Array.isArray(record.sideEffects) || !Array.isArray(record.parityFixtures)) findings.push({ code: "CAPABILITY_MANIFEST_RECORD_SHAPE_INVALID", path: record.sourcePath, message: "sideEffects and parityFixtures must be arrays." });
  if (record.targetPackage !== null && !approvedPackages.has(record.targetPackage)) findings.push({ code: "CAPABILITY_MANIFEST_TARGET_PACKAGE_INVALID", path: record.sourcePath, message: "Record targetPackage is not in the approved package registry." });
  if (record.classification === "core" && record.sideEffects.some((effect) => hostSideEffects.has(effect))) findings.push({ code: "CAPABILITY_MANIFEST_CORE_HOST_SIDE_EFFECT", path: record.sourcePath, message: "Core records cannot declare host side effects." });
  if (record.classification === "generated-distribution" && !record.sourcePath.startsWith("dist/")) findings.push({ code: "CAPABILITY_MANIFEST_GENERATED_DISTRIBUTION_PATH_INVALID", path: record.sourcePath, message: "Generated-distribution records must live under dist/." });
  if (record.classification === "compatibility-shim" && record.targetPackage !== "@yeeflow/codex-plugin-adapter") findings.push({ code: "CAPABILITY_MANIFEST_COMPATIBILITY_OWNER_INVALID", path: record.sourcePath, message: "Compatibility shims must declare Codex Plugin Adapter ownership." });
  if (record.classification === "mixed" && (!Array.isArray(record.sideEffects) || record.sideEffects.length === 0 || !record.targetPackage || record.targetPackage === "@yeeflow/codex-plugin-adapter")) findings.push({ code: "CAPABILITY_MANIFEST_MIXED_SPLIT_TARGET_MISSING", path: record.sourcePath, message: "Mixed records must declare side effects and a Core split target." });
  if (recordPaths.has(record.sourcePath)) findings.push({ code: "CAPABILITY_MANIFEST_DUPLICATE_PATH", path: record.sourcePath, message: "Source path is classified more than once." });
  recordPaths.add(record.sourcePath);
}

for (const sourcePath of expectedPaths) {
  if (!recordPaths.has(sourcePath)) findings.push({ code: "CAPABILITY_MANIFEST_PATH_UNCLASSIFIED", path: sourcePath, message: "Tracked or migration-owned path has no classification record." });
}
for (const sourcePath of recordPaths) {
  if (!expectedPaths.has(sourcePath)) findings.push({ code: "CAPABILITY_MANIFEST_PATH_OUT_OF_SCOPE", path: sourcePath, message: "Classification record is not a tracked or migration-owned path." });
}

const protectedRecords = records.filter((record) => isProtectedDuplicate(record.sourcePath));
if (protectedRecords.length > 0) findings.push({ code: "CAPABILITY_MANIFEST_PROTECTED_DUPLICATE_INCLUDED", path: protectedRecords[0].sourcePath, message: "Protected duplicate files must remain outside migration classification scope." });

if (findings.length > 0) {
  console.error(JSON.stringify({ status: "failed", findings }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: "passed", code: "CAPABILITY_MANIFEST_VALID", recordCount: records.length, protectedDuplicateRecords: 0 }, null, 2));

function isProtectedDuplicate(sourcePath) {
  return sourcePath.startsWith("dist/yeeflow-app-builder-plugin/") && / [23]\.[^/]+$/.test(sourcePath);
}

function fail(code, message) {
  console.error(JSON.stringify({ status: "failed", findings: [{ code, message }] }, null, 2));
  process.exit(1);
}

function argumentValue(option) {
  const index = process.argv.indexOf(option);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) fail("CAPABILITY_MANIFEST_ARGUMENT_VALUE_MISSING", `${option} requires a value.`);
  return value;
}

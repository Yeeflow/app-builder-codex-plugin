#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { distributionLeakageFindings } from "./lib/core-distribution-validation.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const directory = resolve(root, process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "dist/yeeflow-app-builder-plugin/execution");
const contractOption = process.argv.indexOf("--contract");
const contractPath = resolve(root, contractOption === -1 ? "compatibility/capability-manifests/app-builder-execution-service-distribution-contract.v0.1.0.json" : requiredValue(contractOption + 1, "--contract"));
const graphPath = resolve(root, "compatibility/capability-manifests/app-builder-core-package-dependency-graph.v0.1.0.json");
const coreManifestPath = resolve(dirname(directory), "core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const manifestPath = resolve(directory, "yeeflow-app-builder-execution-service-distribution.v0.1.0.json");
const contract = readJson(contractPath, "EXECUTION_DISTRIBUTION_VERSION_MISMATCH");
const graph = readJson(graphPath, "EXECUTION_DISTRIBUTION_VERSION_MISMATCH");
const coreManifest = readJson(coreManifestPath, "EXECUTION_DISTRIBUTION_CORE_DEPENDENCY_MISMATCH");
const manifest = readJson(manifestPath, "EXECUTION_DISTRIBUTION_ARTIFACT_MISSING");

if (manifest.contractVersion !== contract.contractVersion || manifest.protocolVersion !== contract.protocolVersion || manifest.packageGraphVersion !== contract.packageGraphVersion || manifest.packageGraphVersion !== graph.graphVersion) fail("EXECUTION_DISTRIBUTION_VERSION_MISMATCH", "Execution distribution versions do not match the approved contracts.");
if (!isSha256(manifest.dependencyGraphSha256)) fail("EXECUTION_DISTRIBUTION_CHECKSUM_MISMATCH", "Dependency graph checksum is invalid.");
if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length !== contract.approvedArtifacts?.length) fail("EXECUTION_DISTRIBUTION_EXPORT_UNRESOLVED", "Execution distribution does not declare every approved artifact.");

for (const requiredPath of contract.requiredCoreArtifacts || []) {
  const approved = coreManifest.artifacts?.find((item) => item.path === requiredPath);
  const recorded = manifest.coreDependencies?.find((item) => item.path === requiredPath);
  if (!approved || !recorded || !isSha256(recorded.sha256) || recorded.sha256 !== approved.sha256) fail("EXECUTION_DISTRIBUTION_CORE_DEPENDENCY_MISMATCH", `Core dependency checksum does not match: ${requiredPath}.`);
}

for (const approved of contract.approvedArtifacts || []) await validateArtifact(approved);
console.log(`EXECUTION_SERVICE_DISTRIBUTION_VALID artifacts=${contract.approvedArtifacts.length} protocol=${contract.protocolVersion}`);

async function validateArtifact(approved) {
  const artifact = manifest.artifacts.find((item) => item.path === approved.path);
  if (!artifact) fail("EXECUTION_DISTRIBUTION_ARTIFACT_MISSING", `Approved artifact is absent: ${approved.path}.`);
  if (artifact.packageName !== approved.packageName || artifact.packageVersion !== approved.packageVersion) fail("EXECUTION_DISTRIBUTION_VERSION_MISMATCH", `Package identity differs from the contract: ${approved.path}.`);
  if (JSON.stringify(artifact.exports) !== JSON.stringify(approved.exports)) fail("EXECUTION_DISTRIBUTION_EXPORT_UNRESOLVED", `Export list differs from the contract: ${approved.path}.`);
  if (![artifact.sourceInputSha256, artifact.compiledInputSha256, artifact.sha256].every(isSha256)) fail("EXECUTION_DISTRIBUTION_CHECKSUM_MISMATCH", `Artifact provenance hashes are invalid: ${approved.path}.`);
  const path = resolve(directory, approved.path.split("/").at(-1));
  if (!existsSync(path)) fail("EXECUTION_DISTRIBUTION_ARTIFACT_MISSING", `Artifact file is absent: ${approved.path}.`);
  const text = readFileSync(path, "utf8");
  if (sha256(text) !== artifact.sha256) fail("EXECUTION_DISTRIBUTION_CHECKSUM_MISMATCH", `Artifact checksum differs from the manifest: ${approved.path}.`);
  if (distributionLeakageFindings(text).length) fail("EXECUTION_DISTRIBUTION_WORKSPACE_LEAKAGE", `Artifact contains workspace or source leakage: ${approved.path}.`);
  let module;
  try {
    module = await import(`${pathToFileURL(path).href}?sha=${artifact.sha256}`);
  } catch (error) {
    fail("EXECUTION_DISTRIBUTION_EXPORT_UNRESOLVED", `Artifact cannot be imported: ${approved.path}: ${error.message}`);
  }
  if (JSON.stringify(Object.keys(module).sort()) !== JSON.stringify([...approved.exports].sort())) fail("EXECUTION_DISTRIBUTION_EXPORT_UNRESOLVED", `Runtime export surface differs from the contract: ${approved.path}.`);
}

function requiredValue(index, option) { const value = process.argv[index]; if (!value || value.startsWith("--")) fail("EXECUTION_DISTRIBUTION_VERSION_MISMATCH", `${option} requires a path.`); return value; }
function readJson(path, code) { if (!existsSync(path)) fail(code, `Required JSON is missing: ${path}.`); try { return JSON.parse(readFileSync(path, "utf8")); } catch (error) { fail(code, error.message); } }
function isSha256(value) { return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

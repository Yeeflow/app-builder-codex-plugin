#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { distributionLeakageFindings } from "./lib/core-distribution-validation.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = resolve(root, optionValue("--output") || "dist/yeeflow-app-builder-plugin/execution");
const contractPath = resolve(root, optionValue("--contract") || "compatibility/capability-manifests/app-builder-execution-service-distribution-contract.v0.1.0.json");
const graphPath = resolve(root, "compatibility/capability-manifests/app-builder-core-package-dependency-graph.v0.1.0.json");
const coreManifestPath = resolve(root, "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const manifestName = "yeeflow-app-builder-execution-service-distribution.v0.1.0.json";
const contract = readJson(contractPath, "EXECUTION_DISTRIBUTION_VERSION_MISMATCH");
const graphText = readFileSync(graphPath, "utf8");
const graph = JSON.parse(graphText);
const coreManifest = readJson(coreManifestPath, "EXECUTION_DISTRIBUTION_CORE_DEPENDENCY_MISMATCH");

const definitions = [
  definition("@yeeflow/app-builder-core-contracts", "packages/app-builder-core-contracts/src/index.ts", "packages/app-builder-core-contracts/lib/index.js", "app-builder-core-domain-contracts.v0.1.0.mjs"),
  definition("@yeeflow/app-builder-execution-contracts", "packages/app-builder-execution-contracts/src/index.ts", "packages/app-builder-execution-contracts/lib/index.js", "app-builder-execution-contracts.v0.1.0.mjs"),
  definition("@yeeflow/app-builder-core", "packages/app-builder-core/src/index.ts", "packages/app-builder-core/lib/index.js", "app-builder-core-application-facade.v0.1.0.mjs"),
  definition("@yeeflow/app-builder-execution-service", "runtimes/app-builder-execution-service/src/index.ts", "runtimes/app-builder-execution-service/lib/index.js", "app-builder-execution-service.v0.1.0.mjs"),
  definition("@yeeflow/codex-plugin-adapter", "adapters/codex-plugin-adapter/src/index.ts", "adapters/codex-plugin-adapter/lib/index.js", "codex-plugin-adapter.v0.1.0.mjs"),
];

if (contract.packageGraphVersion !== graph.graphVersion) fail("EXECUTION_DISTRIBUTION_VERSION_MISMATCH", "Execution distribution contract does not approve the active package graph.");
if (!Array.isArray(contract.approvedArtifacts) || contract.approvedArtifacts.length !== definitions.length) fail("EXECUTION_DISTRIBUTION_EXPORT_UNRESOLVED", "Execution distribution contract does not declare every artifact.");

mkdirSync(outputDirectory, { recursive: true });
removeCanonicalDistributionOutputs(outputDirectory);
const artifacts = [];
for (const item of definitions) artifacts.push(await buildArtifact(item));
for (const artifact of artifacts) await verifyImport(resolve(outputDirectory, artifact.path.split("/").at(-1)), artifact.exports);

const coreDependencies = (contract.requiredCoreArtifacts || []).map((path) => {
  const artifact = coreManifest.artifacts?.find((item) => item.path === path);
  if (!artifact || !isSha256(artifact.sha256)) fail("EXECUTION_DISTRIBUTION_CORE_DEPENDENCY_MISMATCH", `Required Core artifact is missing or invalid: ${path}.`);
  return { path, sha256: artifact.sha256 };
});
const manifest = {
  schemaVersion: "1.0.0",
  contractVersion: contract.contractVersion,
  protocolVersion: contract.protocolVersion,
  packageGraphVersion: graph.graphVersion,
  sourceCommit: process.env.YEEFLOW_CANDIDATE_SOURCE_COMMIT || gitMetadata(["rev-parse", "HEAD"]) || "isolated-snapshot",
  sourceTreeState: process.env.YEEFLOW_CANDIDATE_SOURCE_TREE_STATE || ((gitMetadata(["status", "--porcelain"]) || "") ? "dirty" : "clean"),
  dependencyGraphSha256: sha256(graphText),
  coreDependencies,
  artifacts,
};
writeFileSync(resolve(outputDirectory, manifestName), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`EXECUTION_SERVICE_DISTRIBUTION_BUILT artifacts=${artifacts.length} protocol=${contract.protocolVersion}`);

function definition(packageName, sourcePath, compiledPath, artifactName) {
  return { packageName, sourcePath, compiledPath, artifactName };
}

function removeCanonicalDistributionOutputs(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (isProtectedCopyArtifact(entry.name)) continue;
    rmSync(resolve(directory, entry.name), { recursive: true, force: true });
  }
}

function isProtectedCopyArtifact(name) {
  return / [23](?:\..+)?$/u.test(name);
}

async function buildArtifact(item) {
  const approved = contract.approvedArtifacts.find((artifact) => artifact.packageName === item.packageName && artifact.path === `execution/${item.artifactName}`);
  if (!approved) fail("EXECUTION_DISTRIBUTION_EXPORT_UNRESOLVED", `Artifact is not approved: ${item.packageName}.`);
  const sourcePath = resolve(root, item.sourcePath);
  const compiledPath = resolve(root, item.compiledPath);
  if (!existsSync(sourcePath) || !existsSync(compiledPath)) fail("EXECUTION_DISTRIBUTION_ARTIFACT_MISSING", `Source or compiled input is missing: ${item.packageName}.`);
  const compiledModule = await import(pathToFileURL(compiledPath).href);
  const actualExports = Object.keys(compiledModule).sort();
  const approvedExports = [...approved.exports].sort();
  if (JSON.stringify(actualExports) !== JSON.stringify(approvedExports)) fail("EXECUTION_DISTRIBUTION_EXPORT_UNRESOLVED", `Compiled export surface differs from the approved contract: ${item.packageName}.`);
  const rawCompiled = readFileSync(compiledPath, "utf8");
  const artifactText = rewriteWorkspaceImports(rawCompiled).replace(/\n?\/\/# sourceMappingURL=.*$/mu, "");
  if (distributionLeakageFindings(artifactText).length) fail("EXECUTION_DISTRIBUTION_WORKSPACE_LEAKAGE", `Artifact contains workspace resolution leakage: ${item.artifactName}.`);
  const outputPath = resolve(outputDirectory, item.artifactName);
  writeFileSync(outputPath, artifactText, "utf8");
  return {
    path: `execution/${item.artifactName}`,
    packageName: item.packageName,
    packageVersion: approved.packageVersion,
    sourceInputSha256: sha256(readFileSync(sourcePath)),
    compiledInputSha256: sha256(rawCompiled),
    sha256: sha256(artifactText),
    exports: approved.exports,
  };
}

function rewriteWorkspaceImports(text) {
  const replacements = new Map([
    ["@yeeflow/app-builder-core-contracts", "./app-builder-core-domain-contracts.v0.1.0.mjs"],
    ["@yeeflow/app-builder-execution-contracts", "./app-builder-execution-contracts.v0.1.0.mjs"],
    ["@yeeflow/app-builder-core-planning", "../core/yeeflow-app-builder-core-planning.v0.1.0.mjs"],
    ["@yeeflow/app-builder-core-materializer", "../core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"],
    ["@yeeflow/app-builder-core", "./app-builder-core-application-facade.v0.1.0.mjs"],
    ["@yeeflow/app-builder-execution-service", "./app-builder-execution-service.v0.1.0.mjs"],
  ]);
  let result = text;
  for (const [workspaceName, relativePath] of replacements) {
    const escaped = workspaceName.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    result = result.replace(new RegExp(`(from\\s+["'])${escaped}(["'])`, "gu"), `$1${relativePath}$2`);
    result = result.replace(new RegExp(`(import\\s+["'])${escaped}(["'])`, "gu"), `$1${relativePath}$2`);
  }
  return result;
}

async function verifyImport(path, exports) {
  let module;
  try {
    module = await import(`${pathToFileURL(path).href}?sha=${sha256(readFileSync(path))}`);
  } catch (error) {
    fail("EXECUTION_DISTRIBUTION_EXPORT_UNRESOLVED", `Artifact could not be imported: ${path}: ${error.message}`);
  }
  if (JSON.stringify(Object.keys(module).sort()) !== JSON.stringify([...exports].sort())) fail("EXECUTION_DISTRIBUTION_EXPORT_UNRESOLVED", `Artifact runtime exports differ from the approved contract: ${path}.`);
}

function optionValue(option) {
  const index = process.argv.indexOf(option);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) fail("EXECUTION_DISTRIBUTION_VERSION_MISMATCH", `${option} requires a value.`);
  return value;
}
function readJson(path, code) { try { return JSON.parse(readFileSync(path, "utf8")); } catch (error) { fail(code, error.message); } }
function gitMetadata(argumentsList) { try { return execFileSync("git", argumentsList, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return null; } }
function isSha256(value) { return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

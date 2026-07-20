#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { distributionLeakageFindings } from "./lib/core-distribution-validation.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const options = parseArguments(process.argv.slice(2));
const directory = resolve(root, options.directory || "dist/yeeflow-app-builder-plugin/core");
const manifestPath = resolve(directory, "yeeflow-app-builder-core-distribution.v0.1.0.json");
const contractPath = resolve(root, options.contract || "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json");
const materializerPublicApiPath = resolve(root, "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const localRuntimePublicApiPath = resolve(root, "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json");
const materializerCompiledPath = resolve(root, "packages/app-builder-core-materializer/lib/index.js");
const localRuntimeCompiledPath = resolve(root, "runtimes/app-builder-core-local-runtime/lib/index.js");
const expectedCoreVersion = process.env.YEEFLOW_CANDIDATE_CORE_VERSION || "0.1.0";
const contract = readJsonOrFail(contractPath, "CORE_DISTRIBUTION_VERSION_MISMATCH", "Distribution contract is invalid");
const materializerPublicApi = readJsonOrFail(materializerPublicApiPath, "CORE_DISTRIBUTION_VERSION_MISMATCH", "Materializer public API contract is invalid");
const localRuntimePublicApi = readJsonOrFail(localRuntimePublicApiPath, "CORE_DISTRIBUTION_VERSION_MISMATCH", "Local Runtime public API contract is invalid");
const approvedArtifacts = contract.approvedArtifacts;

await validateMaterializerSourceContract();
await validateLocalRuntimeSourceContract();

if (!existsSync(manifestPath)) fail("CORE_DISTRIBUTION_ARTIFACT_MISSING", "Distribution manifest is missing.");
const manifest = readJsonOrFail(manifestPath, "CORE_DISTRIBUTION_VERSION_MISMATCH", "Distribution manifest is invalid");
if (manifest.coreVersion !== expectedCoreVersion || manifest.packageGraphVersion !== "0.1.0") fail("CORE_DISTRIBUTION_VERSION_MISMATCH", "Distribution Core or package graph version does not match the approved contract.");
if (!Array.isArray(approvedArtifacts) || !approvedArtifacts.length || !Array.isArray(manifest.artifacts) || manifest.artifacts.length !== approvedArtifacts.length) fail("CORE_DISTRIBUTION_EXPORT_UNRESOLVED", "Distribution manifest does not declare every approved artifact.");
if (manifest.primaryArtifactPath !== approvedArtifacts[0].path || !isSha256(manifest.artifactSha256)) fail("CORE_DISTRIBUTION_CHECKSUM_MISMATCH", "Primary artifact checksum contract is invalid.");
if (!isSha256(manifest.dependencyGraphSha256) || !isSha256(manifest.sourceInputSha256) || !isSha256(manifest.compiledInputSha256)) fail("CORE_DISTRIBUTION_VERSION_MISMATCH", "Distribution provenance hash contract is invalid.");

for (const approved of approvedArtifacts) await validateArtifact(approved);
console.log(`CORE_DISTRIBUTION_VALID artifacts=${approvedArtifacts.length}`);

async function validateArtifact(approved) {
  const artifact = manifest.artifacts.find((item) => item?.path === approved.path);
  if (!artifact) fail("CORE_DISTRIBUTION_ARTIFACT_MISSING", `Approved artifact is missing from the distribution manifest: ${approved.path}.`);
  if (artifact.packageName !== approved.packageName || artifact.packageVersion !== approved.packageVersion) fail("CORE_DISTRIBUTION_VERSION_MISMATCH", `Artifact package identity does not match the approved contract: ${approved.path}.`);
  if (!isSha256(artifact.sha256) || !isSha256(artifact.sourceInputSha256) || !isSha256(artifact.compiledInputSha256)) fail("CORE_DISTRIBUTION_CHECKSUM_MISMATCH", `Artifact provenance hashes are invalid: ${approved.path}.`);
  if (!Array.isArray(artifact.exports) || !artifact.exports.length || JSON.stringify(artifact.exports) !== JSON.stringify(approved.exports)) fail("CORE_DISTRIBUTION_EXPORT_UNRESOLVED", `Artifact export contract does not match the approved contract: ${approved.path}.`);
  const directArtifactPath = resolve(directory, artifact.path.split("/").at(-1));
  const pluginRelativeArtifactPath = resolve(dirname(directory), artifact.path);
  const artifactPath = existsSync(directArtifactPath) ? directArtifactPath : pluginRelativeArtifactPath;
  if (!existsSync(artifactPath)) fail("CORE_DISTRIBUTION_ARTIFACT_MISSING", `Artifact file is missing: ${approved.path}.`);
  const text = readFileSync(artifactPath, "utf8");
  const digest = sha256(text);
  if (artifact.sha256 !== digest || (approved.path === manifest.primaryArtifactPath && manifest.artifactSha256 !== digest)) fail("CORE_DISTRIBUTION_CHECKSUM_MISMATCH", `Artifact checksum does not match the manifest: ${approved.path}.`);
  if (distributionLeakageFindings(text).length) fail("CORE_DISTRIBUTION_WORKSPACE_LEAKAGE", `Artifact contains forbidden workspace or source leakage: ${approved.path}.`);
  let module;
  try { module = await import(pathToFileURL(artifactPath).href); } catch (error) { fail("CORE_DISTRIBUTION_EXPORT_UNRESOLVED", `Artifact could not be imported: ${approved.path}: ${error.message}`); }
  for (const exportName of artifact.exports) if (!(exportName in module)) fail("CORE_DISTRIBUTION_EXPORT_UNRESOLVED", `Declared artifact export is unresolved: ${approved.path}#${exportName}.`);
  const actualExports = Object.keys(module).sort();
  const approvedExports = [...approved.exports].sort();
  if (JSON.stringify(actualExports) !== JSON.stringify(approvedExports)) fail("CORE_DISTRIBUTION_EXPORT_UNRESOLVED", `Artifact runtime export surface does not exactly match the approved contract: ${approved.path}.`);
}

function readJsonOrFail(path, code, message) { try { return JSON.parse(readFileSync(path, "utf8")); } catch (error) { fail(code, `${message}: ${error.message}`); } }
async function validateMaterializerSourceContract() {
  const approved = Array.isArray(approvedArtifacts) && approvedArtifacts.find((artifact) => artifact?.packageName === "@yeeflow/app-builder-core-materializer");
  if (!approved || !Array.isArray(materializerPublicApi.runtimeExports)) fail("CORE_DISTRIBUTION_EXPORT_UNRESOLVED", "Materializer public export contract is missing.");
  let sourceModule;
  try { sourceModule = await import(pathToFileURL(materializerCompiledPath).href); } catch (error) { fail("CORE_DISTRIBUTION_EXPORT_UNRESOLVED", `Compiled Materializer Core could not be imported: ${error.message}`); }
  const sourceExports = Object.keys(sourceModule).sort();
  const publicExports = [...materializerPublicApi.runtimeExports].sort();
  const distributionExports = [...(approved.exports || [])].sort();
  if (JSON.stringify(sourceExports) !== JSON.stringify(publicExports) || JSON.stringify(sourceExports) !== JSON.stringify(distributionExports)) fail("CORE_DISTRIBUTION_EXPORT_UNRESOLVED", "Materializer source, public API, and distribution export contracts do not match.");
}
async function validateLocalRuntimeSourceContract() {
  const approved = Array.isArray(approvedArtifacts) && approvedArtifacts.find((artifact) => artifact?.packageName === "@yeeflow/app-builder-core-local-runtime");
  if (!approved || !Array.isArray(localRuntimePublicApi.runtimeExports)) fail("CORE_DISTRIBUTION_EXPORT_UNRESOLVED", "Local Runtime public export contract is missing.");
  let sourceModule;
  try { sourceModule = await import(pathToFileURL(localRuntimeCompiledPath).href); } catch (error) { fail("CORE_DISTRIBUTION_EXPORT_UNRESOLVED", `Compiled Local Runtime could not be imported: ${error.message}`); }
  const sourceExports = Object.keys(sourceModule).sort();
  const publicExports = [...localRuntimePublicApi.runtimeExports].sort();
  const distributionExports = [...(approved.exports || [])].sort();
  if (JSON.stringify(sourceExports) !== JSON.stringify(publicExports) || JSON.stringify(sourceExports) !== JSON.stringify(distributionExports)) fail("CORE_DISTRIBUTION_EXPORT_UNRESOLVED", "Local Runtime source, public API, and distribution export contracts do not match.");
}
function parseArguments(argumentsList) {
  const result = { directory: null, contract: null };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--contract") result.contract = value(argumentsList, ++index, argument);
    else if (argument.startsWith("--")) fail("CORE_DISTRIBUTION_VERSION_MISMATCH", `Unsupported validator option: ${argument}.`);
    else if (!result.directory) result.directory = argument;
    else fail("CORE_DISTRIBUTION_VERSION_MISMATCH", "Only one distribution directory may be supplied.");
  }
  return result;
}
function value(argumentsList, index, option) { const result = argumentsList[index]; if (!result || result.startsWith("--")) fail("CORE_DISTRIBUTION_VERSION_MISMATCH", `${option} requires a path.`); return result; }
function isSha256(value) { return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

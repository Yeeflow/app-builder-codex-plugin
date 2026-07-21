#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = resolve(root, "compatibility/capability-manifests/app-builder-execution-sdk-package-contract.v1.0.0.json");
const coreManifestPath = resolve(root, "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const executionManifestPath = resolve(root, "dist/yeeflow-app-builder-plugin/execution/yeeflow-app-builder-execution-service-distribution.v0.1.0.json");
const graphPath = resolve(root, "compatibility/capability-manifests/app-builder-core-package-dependency-graph.v0.1.0.json");
const pluginManifestPath = resolve(root, "dist/yeeflow-app-builder-plugin/.codex-plugin/plugin.json");
const outputArgument = optionValue("--output-dir");
if (!outputArgument) fail("EXECUTION_SDK_OUTPUT_DIRECTORY_REQUIRED", "--output-dir must identify a temporary directory outside the repository.");
const outputDirectory = resolve(outputArgument);
assertTemporaryOutput(outputDirectory);

const contract = readJson(contractPath, "EXECUTION_SDK_PACKAGE_VERSION_MISMATCH");
const coreManifest = readJson(coreManifestPath, "EXECUTION_SDK_CORE_VERSION_MISMATCH");
const executionManifest = readJson(executionManifestPath, "EXECUTION_SDK_PROTOCOL_VERSION_MISMATCH");
const graph = readJson(graphPath, "EXECUTION_SDK_PACKAGE_VERSION_MISMATCH");
const pluginManifest = readJson(pluginManifestPath, "EXECUTION_SDK_PACKAGE_VERSION_MISMATCH");
assertVersionContract();
assertOfficialInputs();

const packageDirectory = resolve(outputDirectory, "package-source");
const tarballName = `${contract.packageName.replace(/^@/u, "").replace(/\//gu, "-")}-${contract.sdkVersion}.tgz`;
const tarballPath = resolve(outputDirectory, tarballName);
const checksumPath = `${tarballPath}.sha256`;
rmSync(packageDirectory, { recursive: true, force: true });
rmSync(tarballPath, { force: true });
rmSync(checksumPath, { force: true });
mkdirSync(resolve(packageDirectory, "dist"), { recursive: true });

for (const module of contract.approvedRuntimeModules) {
  const sourcePath = resolve(root, module.source);
  let text = readRequired(sourcePath);
  text = rewriteRuntimeImports(text).replace(/\n?\/\/# sourceMappingURL=.*$/gmu, "");
  writeText(resolve(packageDirectory, module.target), text);
}

for (const module of contract.approvedDeclarationModules) {
  const sourcePath = resolve(root, module.source);
  const text = rewriteDeclarationImports(readRequired(sourcePath)).replace(/\n?\/\/# sourceMappingURL=.*$/gmu, "");
  writeText(resolve(packageDirectory, module.target), text);
}

writeText(resolve(packageDirectory, "dist/index.js"), sdkIndexSource());
writeText(resolve(packageDirectory, "dist/index.d.ts"), sdkIndexDeclaration());
writeText(resolve(packageDirectory, "README.md"), sdkReadme());
writeText(resolve(packageDirectory, "package.json"), `${JSON.stringify(packageMetadata(), null, 2)}\n`);

const packageFiles = files(packageDirectory)
  .filter((path) => relative(packageDirectory, path) !== "manifest.json")
  .map((path) => ({
    path: posix(relative(packageDirectory, path)),
    bytes: statSync(path).size,
    sha256: sha256(readFileSync(path)),
  }))
  .sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
const manifest = {
  schemaVersion: contract.schemaVersion,
  packageName: contract.packageName,
  sdkVersion: contract.sdkVersion,
  pluginProductVersion: contract.pluginProductVersion,
  coreDistributionVersion: contract.coreDistributionVersion,
  executionProtocolVersion: contract.executionProtocolVersion,
  structuredIntentVersion: contract.structuredIntentVersion,
  packageGraphVersion: contract.packageGraphVersion,
  artifactFormat: contract.artifactFormat,
  capabilities: contract.capabilities,
  sourceProvenance: {
    gitHead: git(["rev-parse", "HEAD"]),
    pluginTag: `yeeflow-app-builder-plugin-v${contract.pluginProductVersion}`,
    coreDistributionManifestSha256: sha256(readFileSync(coreManifestPath)),
    coreDistributionSourceCommit: coreManifest.sourceCommit,
    executionDistributionManifestSha256: sha256(readFileSync(executionManifestPath)),
    executionDistributionSourceCommit: executionManifest.sourceCommit,
  },
  compatibility: {
    coreDistribution: { exact: contract.coreDistributionVersion },
    executionProtocol: { exact: contract.executionProtocolVersion },
    structuredIntent: { exact: contract.structuredIntentVersion },
  },
  bundledModules: contract.approvedRuntimeModules.map(({ packageName, target }) => ({ packageName, path: target })),
  excludedResponsibilities: contract.forbiddenBundledResponsibilities,
  files: packageFiles,
};
writeText(resolve(packageDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

mkdirSync(outputDirectory, { recursive: true });
let packResult;
try {
  packResult = JSON.parse(execFileSync("npm", ["pack", packageDirectory, "--pack-destination", outputDirectory, "--ignore-scripts", "--json"], {
    cwd: outputDirectory,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }));
} catch (error) {
  fail("EXECUTION_SDK_ARTIFACT_MISSING", `npm pack failed: ${String(error.stderr || error.message).trim()}`);
}
const packedName = packResult?.[0]?.filename;
if (packedName !== tarballName || !existsSync(tarballPath)) fail("EXECUTION_SDK_ARTIFACT_MISSING", "npm pack did not create the approved final filename.");
const tarballSha256 = sha256(readFileSync(tarballPath));
writeText(checksumPath, `${tarballSha256}  ${tarballName}\n`);
console.log(`EXECUTION_SDK_PACKAGE_BUILT package=${contract.packageName}@${contract.sdkVersion}`);
console.log(`EXECUTION_SDK_CANDIDATE path=${tarballPath}`);
console.log(`EXECUTION_SDK_CANDIDATE_SHA256 ${tarballSha256}`);

function assertVersionContract() {
  if (contract.sdkVersion !== "1.0.0") fail("EXECUTION_SDK_PACKAGE_VERSION_MISMATCH", "The package contract does not declare the approved final SDK version.");
  if (pluginManifest.version !== contract.pluginProductVersion) fail("EXECUTION_SDK_PACKAGE_VERSION_MISMATCH", "The Plugin product version does not match the SDK source contract.");
  if (coreManifest.coreVersion !== contract.coreDistributionVersion) fail("EXECUTION_SDK_CORE_VERSION_MISMATCH", "The Core distribution version is incompatible with the SDK contract.");
  if (executionManifest.protocolVersion !== contract.executionProtocolVersion) fail("EXECUTION_SDK_PROTOCOL_VERSION_MISMATCH", "The execution protocol version is incompatible with the SDK contract.");
  if (executionManifest.packageGraphVersion !== contract.packageGraphVersion || graph.graphVersion !== contract.packageGraphVersion || coreManifest.packageGraphVersion !== contract.packageGraphVersion) {
    fail("EXECUTION_SDK_PACKAGE_VERSION_MISMATCH", "The package graph version is incompatible with the SDK contract.");
  }
}

function assertOfficialInputs() {
  const manifests = [coreManifest, executionManifest];
  for (const module of contract.approvedRuntimeModules) {
    const artifact = manifests.flatMap((manifestItem) => manifestItem.artifacts || []).find((item) => item.packageName === module.packageName);
    if (!artifact) fail("EXECUTION_SDK_ARTIFACT_MISSING", `The official distribution manifest does not contain ${module.packageName}.`);
    const sourcePath = resolve(root, module.source);
    if (!existsSync(sourcePath)) fail("EXECUTION_SDK_ARTIFACT_MISSING", `The approved runtime module is missing: ${module.source}.`);
    if (artifact.sha256 !== sha256(readFileSync(sourcePath))) fail("EXECUTION_SDK_CHECKSUM_MISMATCH", `The approved runtime checksum differs from its official distribution manifest: ${module.source}.`);
  }
  for (const module of contract.approvedDeclarationModules) {
    if (!existsSync(resolve(root, module.source))) fail("EXECUTION_SDK_ARTIFACT_MISSING", `The approved declaration module is missing: ${module.source}.`);
  }
}

function rewriteRuntimeImports(text) {
  return text
    .replaceAll("./app-builder-core-domain-contracts.v0.1.0.mjs", "./core-contracts.js")
    .replaceAll("./app-builder-execution-contracts.v0.1.0.mjs", "./execution-contracts.js")
    .replaceAll("../core/yeeflow-app-builder-core-planning.v0.1.0.mjs", "./core-planning.js")
    .replaceAll("../core/yeeflow-app-builder-core-materializer.v0.1.0.mjs", "./core-materializer.js")
    .replaceAll("./app-builder-core-application-facade.v0.1.0.mjs", "./core-application.js");
}

function rewriteDeclarationImports(text) {
  return text
    .replaceAll('"@yeeflow/app-builder-core-contracts"', '"./core-contracts.js"')
    .replaceAll('"@yeeflow/app-builder-execution-contracts"', '"./execution-contracts.js"');
}

function sdkIndexSource() {
  return `export { CORE_APPLICATION_INTENT_VERSION } from "./core-contracts.js";
export { EXECUTION_PROTOCOL_VERSION, STRUCTURED_INTENT_VERSION } from "./execution-contracts.js";
export { buildApplicationFromCanonicalIntent } from "./core-application.js";
export { createInProcessExecutionKernel, executeInProcess, negotiateExecutionContext, supportedExecutionCapabilities } from "./execution-service.js";

export const executionSdkMetadata = Object.freeze({
  packageName: "${contract.packageName}",
  sdkVersion: "${contract.sdkVersion}",
  pluginProductVersion: "${contract.pluginProductVersion}",
  coreDistributionVersion: "${contract.coreDistributionVersion}",
  executionProtocolVersion: "${contract.executionProtocolVersion}",
  structuredIntentVersion: "${contract.structuredIntentVersion}",
  packageGraphVersion: "${contract.packageGraphVersion}",
});

export function assertExecutionSdkCompatibility(requirement) {
  if (!requirement || requirement.sdkVersion !== executionSdkMetadata.sdkVersion) throw compatibilityError("EXECUTION_SDK_PACKAGE_VERSION_MISMATCH");
  if (requirement.coreDistributionVersion !== executionSdkMetadata.coreDistributionVersion) throw compatibilityError("EXECUTION_SDK_CORE_VERSION_MISMATCH");
  if (requirement.executionProtocolVersion !== executionSdkMetadata.executionProtocolVersion) throw compatibilityError("EXECUTION_SDK_PROTOCOL_VERSION_MISMATCH");
  return executionSdkMetadata;
}

function compatibilityError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}
`;
}

function sdkIndexDeclaration() {
  return `export { CORE_APPLICATION_INTENT_VERSION } from "./core-contracts.js";
export type { CanonicalApplicationIntent, CanonicalFieldIntent, CanonicalResourceIntent, CoreApplicationBuildResult, CoreApplicationPlan, CoreFinding, CoreMaterialization, CoreRepairAction, CoreRepairResult, CoreVerificationCheck, CoreVerificationResult } from "./core-contracts.js";
export { EXECUTION_PROTOCOL_VERSION, STRUCTURED_INTENT_VERSION } from "./execution-contracts.js";
export type { ApplicationBuildOutput, CapabilityDescriptor, CapabilityProfile, ExecutionAuthority, ExecutionContext, ExecutionDiagnostic, ExecutionRequest, ExecutionResult, JsonPrimitive, JsonValue, ModelInvocationPort, ModelInvocationRequest, ModelInvocationResult, StructuredApplicationIntent, StructuredFieldIntent, StructuredResourceIntent } from "./execution-contracts.js";
export { buildApplicationFromCanonicalIntent } from "./core-application.js";
export { createInProcessExecutionKernel, executeInProcess, negotiateExecutionContext, supportedExecutionCapabilities } from "./execution-service.js";
export type { ApplicationCorePort, ExecutionNegotiation, InProcessExecutionKernel } from "./execution-service.js";
export declare const executionSdkMetadata: Readonly<{
  packageName: "${contract.packageName}";
  sdkVersion: "${contract.sdkVersion}";
  pluginProductVersion: "${contract.pluginProductVersion}";
  coreDistributionVersion: "${contract.coreDistributionVersion}";
  executionProtocolVersion: "${contract.executionProtocolVersion}";
  structuredIntentVersion: "${contract.structuredIntentVersion}";
  packageGraphVersion: "${contract.packageGraphVersion}";
}>;
export interface ExecutionSdkCompatibilityRequirement {
  readonly sdkVersion: string;
  readonly coreDistributionVersion: string;
  readonly executionProtocolVersion: string;
}
export declare function assertExecutionSdkCompatibility(requirement: ExecutionSdkCompatibilityRequirement): typeof executionSdkMetadata;
`;
}

function packageMetadata() {
  const entry = (name) => ({ types: `./dist/${name}.d.ts`, import: `./dist/${name}.js`, default: `./dist/${name}.js` });
  return {
    name: contract.packageName,
    version: contract.sdkVersion,
    description: "Host-neutral, no-write Yeeflow App Builder Core execution SDK.",
    type: "module",
    sideEffects: false,
    engines: { node: ">=20" },
    files: ["dist", "manifest.json", "README.md"],
    exports: {
      ".": entry("index"),
      "./contracts": entry("execution-contracts"),
      "./core": entry("core-application"),
      "./service": entry("execution-service"),
      "./manifest": "./manifest.json",
    },
  };
}

function sdkReadme() {
  return `# Yeeflow App Builder Execution SDK

This package contains the host-neutral Core application facade and in-process
execution protocol from Yeeflow App Builder Plugin ${contract.pluginProductVersion}.

The host owns model and provider selection, credentials, provider calls,
transport, authentication, sessions, persistence, queues, retries, telemetry
transport, tenant policy, and UI. This package contains no host adapter and
accepts only empty write authority.

Compatibility is exact: SDK ${contract.sdkVersion}, Core distribution
${contract.coreDistributionVersion}, and protocol ${contract.executionProtocolVersion}.
`;
}

function assertTemporaryOutput(path) {
  const rootRelative = relative(root, path);
  if (!isAbsolute(path) || rootRelative === "" || (!rootRelative.startsWith("..") && !isAbsolute(rootRelative))) {
    fail("EXECUTION_SDK_OUTPUT_DIRECTORY_FORBIDDEN", "SDK outputs must be outside the repository.");
  }
}

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

function readRequired(path) {
  if (!existsSync(path)) fail("EXECUTION_SDK_ARTIFACT_MISSING", `Required input is missing: ${relative(root, path)}.`);
  return readFileSync(path, "utf8");
}

function readJson(path, code) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(code, `Cannot parse ${relative(root, path)}: ${error.message}`);
  }
}

function writeText(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, "utf8");
}

function optionValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) fail("EXECUTION_SDK_PACKAGE_VERSION_MISMATCH", `${name} requires a value.`);
  return value;
}

function git(argumentsList) {
  try {
    return execFileSync("git", argumentsList, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "unavailable";
  }
}

function posix(path) {
  return path.replaceAll("\\", "/");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fail(code, message) {
  console.error(`${code}: ${message}`);
  process.exit(1);
}

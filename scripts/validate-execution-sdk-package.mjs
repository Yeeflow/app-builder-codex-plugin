#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = JSON.parse(readFileSync(resolve(root, "compatibility/capability-manifests/app-builder-execution-sdk-package-contract.v1.0.0.json"), "utf8"));
const expectedFiles = [
  "README.md",
  "dist/core-application.d.ts",
  "dist/core-application.js",
  "dist/core-contracts.d.ts",
  "dist/core-contracts.js",
  "dist/core-materializer.js",
  "dist/core-planning.js",
  "dist/execution-contracts.d.ts",
  "dist/execution-contracts.js",
  "dist/execution-service.d.ts",
  "dist/execution-service.js",
  "dist/index.d.ts",
  "dist/index.js",
  "manifest.json",
  "package.json",
];
const expectedRuntimeExports = [
  "CORE_APPLICATION_INTENT_VERSION",
  "EXECUTION_PROTOCOL_VERSION",
  "STRUCTURED_INTENT_VERSION",
  "assertExecutionSdkCompatibility",
  "buildApplicationFromCanonicalIntent",
  "createInProcessExecutionKernel",
  "executeInProcess",
  "executionSdkMetadata",
  "negotiateExecutionContext",
  "supportedExecutionCapabilities",
];

try {
  const packageDirectoryArgument = optionValue("--package-dir");
  const tarballArgument = optionValue("--tarball");
  if (Boolean(packageDirectoryArgument) === Boolean(tarballArgument)) fail("EXECUTION_SDK_ARTIFACT_MISSING", "Provide exactly one of --package-dir or --tarball.");
  if (tarballArgument) await validateTarball(resolve(tarballArgument));
  else await validatePackageDirectory(resolve(packageDirectoryArgument));
} catch (error) {
  const code = error?.code || "EXECUTION_SDK_VALIDATION_FAILED";
  console.error(`${code}: ${error.message}`);
  process.exit(1);
}

async function validateTarball(tarballPath) {
  if (!existsSync(tarballPath)) fail("EXECUTION_SDK_ARTIFACT_MISSING", "The SDK tarball is missing.");
  const sidecarPath = `${tarballPath}.sha256`;
  if (!existsSync(sidecarPath)) fail("EXECUTION_SDK_ARTIFACT_MISSING", "The SDK checksum sidecar is missing.");
  const expectedChecksum = readFileSync(sidecarPath, "utf8").trim().split(/\s+/u)[0];
  if (expectedChecksum !== sha256(readFileSync(tarballPath))) fail("EXECUTION_SDK_CHECKSUM_MISMATCH", "The SDK tarball checksum differs from its sidecar.");
  const temporaryDirectory = mkdtempSync(resolve(tmpdir(), "yeeflow-execution-sdk-validate-"));
  try {
    execFileSync("tar", ["-xzf", tarballPath, "-C", temporaryDirectory], { stdio: "pipe" });
    await validatePackageDirectory(resolve(temporaryDirectory, "package"));
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
  console.log(`EXECUTION_SDK_TARBALL_VALID sha256=${expectedChecksum}`);
}

async function validatePackageDirectory(packageDirectory) {
  if (!existsSync(packageDirectory)) fail("EXECUTION_SDK_ARTIFACT_MISSING", "The expanded SDK package is missing.");
  const actualFiles = files(packageDirectory).map((path) => posix(relative(packageDirectory, path))).sort();
  if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) fail("EXECUTION_SDK_FILE_SET_INVALID", "The SDK package file set is not the approved allowlist.");
  for (const path of actualFiles) {
    if (/(?:adapter|skill|oauth|credential|provider|http|database|queue|retry|telemetry|secret|token)/iu.test(path)) fail("EXECUTION_SDK_MODULE_FORBIDDEN", `A forbidden module path is bundled: ${path}.`);
  }

  const packageMetadata = readJson(resolve(packageDirectory, "package.json"), "EXECUTION_SDK_PACKAGE_VERSION_MISMATCH");
  const manifest = readJson(resolve(packageDirectory, "manifest.json"), "EXECUTION_SDK_PACKAGE_VERSION_MISMATCH");
  validatePackageMetadata(packageMetadata);
  validateManifest(packageDirectory, manifest);
  validateModuleBoundaries(packageDirectory, actualFiles);
  await validateRuntimeExports(packageDirectory);
  console.log(`EXECUTION_SDK_PACKAGE_VALID package=${contract.packageName}@${contract.sdkVersion} files=${actualFiles.length}`);
}

function validatePackageMetadata(packageMetadata) {
  if (packageMetadata.name !== contract.packageName || packageMetadata.version !== contract.sdkVersion || packageMetadata.type !== "module" || packageMetadata.sideEffects !== false) {
    fail("EXECUTION_SDK_PACKAGE_VERSION_MISMATCH", "The SDK package identity or ESM metadata is incompatible.");
  }
  for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies", "bundledDependencies"]) {
    if (field in packageMetadata && Object.keys(packageMetadata[field] || {}).length) fail("EXECUTION_SDK_DEPENDENCY_FORBIDDEN", `The SDK package declares forbidden ${field}.`);
  }
  if (JSON.stringify(Object.keys(packageMetadata.exports || {})) !== JSON.stringify(contract.requiredExportMap)) fail("EXECUTION_SDK_EXPORT_MAP_INVALID", "The SDK export map does not match the approved public subpaths.");
  const expectedFilesMetadata = ["dist", "manifest.json", "README.md"];
  if (JSON.stringify(packageMetadata.files) !== JSON.stringify(expectedFilesMetadata)) fail("EXECUTION_SDK_FILE_SET_INVALID", "The npm files allowlist is invalid.");
}

function validateManifest(packageDirectory, manifest) {
  const versionsMatch = manifest.packageName === contract.packageName
    && manifest.sdkVersion === contract.sdkVersion
    && manifest.pluginProductVersion === contract.pluginProductVersion
    && manifest.coreDistributionVersion === contract.coreDistributionVersion
    && manifest.executionProtocolVersion === contract.executionProtocolVersion
    && manifest.structuredIntentVersion === contract.structuredIntentVersion
    && manifest.packageGraphVersion === contract.packageGraphVersion;
  if (!versionsMatch) {
    if (manifest.coreDistributionVersion !== contract.coreDistributionVersion) fail("EXECUTION_SDK_CORE_VERSION_MISMATCH", "The SDK manifest Core version is incompatible.");
    if (manifest.executionProtocolVersion !== contract.executionProtocolVersion) fail("EXECUTION_SDK_PROTOCOL_VERSION_MISMATCH", "The SDK manifest protocol version is incompatible.");
    fail("EXECUTION_SDK_PACKAGE_VERSION_MISMATCH", "The SDK manifest version relationship is incompatible.");
  }
  if (JSON.stringify(manifest.capabilities) !== JSON.stringify(contract.capabilities)) fail("EXECUTION_SDK_PACKAGE_VERSION_MISMATCH", "The SDK capability manifest differs from the approved contract.");
  if (JSON.stringify(manifest.excludedResponsibilities) !== JSON.stringify(contract.forbiddenBundledResponsibilities)) fail("EXECUTION_SDK_MODULE_FORBIDDEN", "The SDK boundary declaration is incomplete.");
  const expectedManifestPaths = expectedFiles.filter((path) => path !== "manifest.json");
  const manifestPaths = (manifest.files || []).map((item) => item.path);
  if (JSON.stringify(manifestPaths) !== JSON.stringify(expectedManifestPaths)) fail("EXECUTION_SDK_FILE_SET_INVALID", "The SDK checksum manifest file inventory is invalid.");
  for (const item of manifest.files || []) {
    const path = resolve(packageDirectory, item.path);
    if (!existsSync(path)) fail("EXECUTION_SDK_ARTIFACT_MISSING", `A manifested SDK file is missing: ${item.path}.`);
    if (item.bytes !== statSync(path).size || item.sha256 !== sha256(readFileSync(path))) fail("EXECUTION_SDK_CHECKSUM_MISMATCH", `A manifested SDK file checksum differs: ${item.path}.`);
  }
}

function validateModuleBoundaries(packageDirectory, actualFiles) {
  const modulePaths = actualFiles.filter((path) => /\.(?:js|d\.ts)$/u.test(path));
  const forbiddenIdentity = /(?:codex-plugin-adapter|web-managed-provider-fake-adapter|host-extension-fixture-adapter|@openai\/|@anthropic\/|oauth|credential|node:(?:http|https|net|tls|fs)|skills\/)/iu;
  const bareImport = /(?:from\s+|import\s*\(|import\s+|require\s*\()\s*["'](?!\.?\.\/)/u;
  const repositoryLeakage = /(?:\/Users\/|[A-Za-z]:\\|node_modules|packages\/app-builder|runtimes\/app-builder|sourceMappingURL)/u;
  for (const relativePath of modulePaths) {
    const text = readFileSync(resolve(packageDirectory, relativePath), "utf8");
    if (forbiddenIdentity.test(text) || bareImport.test(text) || repositoryLeakage.test(text)) fail("EXECUTION_SDK_MODULE_FORBIDDEN", `A forbidden module dependency or source path is bundled: ${relativePath}.`);
  }
}

async function validateRuntimeExports(packageDirectory) {
  const entryPath = resolve(packageDirectory, "dist/index.js");
  let sdk;
  try {
    sdk = await import(`${pathToFileURL(entryPath).href}?sha=${sha256(readFileSync(entryPath))}`);
  } catch (error) {
    fail("EXECUTION_SDK_EXPORT_MAP_INVALID", `The SDK root export cannot be imported: ${error.message}`);
  }
  if (JSON.stringify(Object.keys(sdk).sort()) !== JSON.stringify([...expectedRuntimeExports].sort())) fail("EXECUTION_SDK_EXPORT_MAP_INVALID", "The SDK runtime export surface is incompatible.");
  const compatible = sdk.assertExecutionSdkCompatibility({
    sdkVersion: contract.sdkVersion,
    coreDistributionVersion: contract.coreDistributionVersion,
    executionProtocolVersion: contract.executionProtocolVersion,
  });
  if (compatible !== sdk.executionSdkMetadata) fail("EXECUTION_SDK_PACKAGE_VERSION_MISMATCH", "The SDK compatibility assertion did not return its immutable metadata.");
  assertRejected(() => sdk.assertExecutionSdkCompatibility({ sdkVersion: "0.0.0", coreDistributionVersion: contract.coreDistributionVersion, executionProtocolVersion: contract.executionProtocolVersion }), "EXECUTION_SDK_PACKAGE_VERSION_MISMATCH");
  assertRejected(() => sdk.assertExecutionSdkCompatibility({ sdkVersion: contract.sdkVersion, coreDistributionVersion: "0.0.0", executionProtocolVersion: contract.executionProtocolVersion }), "EXECUTION_SDK_CORE_VERSION_MISMATCH");
  assertRejected(() => sdk.assertExecutionSdkCompatibility({ sdkVersion: contract.sdkVersion, coreDistributionVersion: contract.coreDistributionVersion, executionProtocolVersion: "app-builder.execution/0.0.0" }), "EXECUTION_SDK_PROTOCOL_VERSION_MISMATCH");
}

function assertRejected(operation, code) {
  try {
    operation();
  } catch (error) {
    if (error?.code === code && error.message === code) return;
    fail(code, `The compatibility assertion returned an unexpected error: ${error?.message || "unknown"}.`);
  }
  fail(code, "The compatibility assertion accepted an incompatible version.");
}

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

function readJson(path, code) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(code, `Cannot parse ${path}: ${error.message}`);
  }
}

function optionValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) fail("EXECUTION_SDK_ARTIFACT_MISSING", `${name} requires a value.`);
  return value;
}

function posix(path) {
  return path.replaceAll("\\", "/");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

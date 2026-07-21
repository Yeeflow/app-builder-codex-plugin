#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporaryDirectory = mkdtempSync(resolve(tmpdir(), "yeeflow-execution-sdk-gates-"));
const buildScript = resolve(root, "scripts/build-execution-sdk-package.mjs");
const validateScript = resolve(root, "scripts/validate-execution-sdk-package.mjs");
const tarballName = "yeeflow-app-builder-execution-sdk-1.0.0.tgz";

try {
  const first = resolve(temporaryDirectory, "first");
  const second = resolve(temporaryDirectory, "second");
  build(first);
  build(second);
  const firstTarball = resolve(first, tarballName);
  const secondTarball = resolve(second, tarballName);
  assert.equal(sha256(readFileSync(firstTarball)), sha256(readFileSync(secondTarball)));
  assert.equal(readFileSync(resolve(first, "package-source/manifest.json"), "utf8"), readFileSync(resolve(second, "package-source/manifest.json"), "utf8"));
  validate(["--package-dir", resolve(first, "package-source")]);
  validate(["--tarball", firstTarball]);
  console.log(`EXECUTION_SDK_DETERMINISTIC_BUILD_PASSED sha256=${sha256(readFileSync(firstTarball))}`);

  negative("unexpected-file", "EXECUTION_SDK_FILE_SET_INVALID", (directory) => {
    writeFileSync(resolve(directory, "dist/unapproved.js"), "export const unapproved = true;\n", "utf8");
  });
  negative("dependency", "EXECUTION_SDK_DEPENDENCY_FORBIDDEN", (directory) => {
    const path = resolve(directory, "package.json");
    const value = json(path);
    value.dependencies = { "provider-sdk": "1.0.0" };
    writeJson(path, value);
  });
  negative("checksum", "EXECUTION_SDK_CHECKSUM_MISMATCH", (directory) => {
    const path = resolve(directory, "README.md");
    writeFileSync(path, `${readFileSync(path, "utf8")}tampered\n`, "utf8");
  });
  negative("core-version", "EXECUTION_SDK_CORE_VERSION_MISMATCH", (directory) => {
    const path = resolve(directory, "manifest.json");
    const value = json(path);
    value.coreDistributionVersion = "0.0.0";
    writeJson(path, value);
  });
  negative("protocol-version", "EXECUTION_SDK_PROTOCOL_VERSION_MISMATCH", (directory) => {
    const path = resolve(directory, "manifest.json");
    const value = json(path);
    value.executionProtocolVersion = "app-builder.execution/0.0.0";
    writeJson(path, value);
  });
  negative("export-map", "EXECUTION_SDK_EXPORT_MAP_INVALID", (directory) => {
    const path = resolve(directory, "package.json");
    const value = json(path);
    value.exports["./adapter"] = "./dist/index.js";
    writeJson(path, value);
    refreshManifestFile(directory, "package.json");
  });
  negative("forbidden-module", "EXECUTION_SDK_MODULE_FORBIDDEN", (directory) => {
    const path = resolve(directory, "dist/index.js");
    writeFileSync(path, `import "node:http";\n${readFileSync(path, "utf8")}`, "utf8");
    refreshManifestFile(directory, "dist/index.js");
  });
  console.log("EXECUTION_SDK_PACKAGE_GATES_PASSED negativeCases=7");
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

function build(outputDirectory) {
  execFileSync(process.execPath, [buildScript, "--output-dir", outputDirectory], { cwd: root, stdio: "pipe" });
}

function validate(argumentsList) {
  execFileSync(process.execPath, [validateScript, ...argumentsList], { cwd: root, stdio: "pipe" });
}

function negative(name, code, mutate) {
  const directory = resolve(temporaryDirectory, name);
  cpSync(resolve(temporaryDirectory, "first/package-source"), directory, { recursive: true });
  mutate(directory);
  const result = spawnSync(process.execPath, [validateScript, "--package-dir", directory], { cwd: root, encoding: "utf8" });
  assert.notEqual(result.status, 0, `${name} unexpectedly passed.`);
  assert.match(`${result.stdout}\n${result.stderr}`, new RegExp(`${code}:`, "u"), `${name} returned an unexpected error.`);
}

function refreshManifestFile(directory, relativePath) {
  const manifestPath = resolve(directory, "manifest.json");
  const manifest = json(manifestPath);
  const item = manifest.files.find((entry) => entry.path === relativePath);
  assert.ok(item, `Missing manifest item for ${relativePath}.`);
  const path = resolve(directory, relativePath);
  item.bytes = statSync(path).size;
  item.sha256 = sha256(readFileSync(path));
  writeJson(manifestPath, manifest);
}

function json(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

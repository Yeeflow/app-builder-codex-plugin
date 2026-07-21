#!/usr/bin/env node

import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePlugin = resolve(root, "dist/yeeflow-app-builder-plugin");
const validator = resolve(root, "scripts/validate-execution-service-distribution.mjs");
const contractPath = resolve(root, "compatibility/capability-manifests/app-builder-execution-service-distribution-contract.v0.1.0.json");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-execution-distribution-gates-"));
const servicePath = "execution/app-builder-execution-service.v0.1.0.mjs";
const adapterPath = "execution/codex-plugin-adapter.v0.1.0.mjs";

try {
  const protectedOutput = resolve(temporary, "protected-output");
  const protectedCopy = resolve(protectedOutput, "app-builder-execution-service.v0.1.0 2.mjs");
  cpSync(resolve(root, "dist/yeeflow-app-builder-plugin/core"), resolve(temporary, "core"), { recursive: true });
  mkdirSync(protectedOutput, { recursive: true });
  writeFileSync(protectedCopy, "protected-copy-must-remain\n", "utf8");
  const build = spawnSync(process.execPath, [resolve(root, "scripts/build-execution-service-distribution.mjs"), "--output", protectedOutput], { cwd: root, encoding: "utf8" });
  if (build.status !== 0) throw new Error(`Expected protected-copy build to pass: ${build.stdout}${build.stderr}`);
  if (!existsSync(protectedCopy) || readFileSync(protectedCopy, "utf8") !== "protected-copy-must-remain\n") throw new Error("Protected copy artifact was modified.");
  console.log("EXECUTION_SERVICE_DISTRIBUTION_PROTECTED_COPY_PRESERVED");

  run("manifest-missing", (plugin) => unlinkSync(resolve(plugin, "execution/yeeflow-app-builder-execution-service-distribution.v0.1.0.json")), "EXECUTION_DISTRIBUTION_ARTIFACT_MISSING");
  run("artifact-missing", (plugin) => unlinkSync(resolve(plugin, servicePath)), "EXECUTION_DISTRIBUTION_ARTIFACT_MISSING");
  run("artifact-checksum", (plugin) => mutateManifest(plugin, (manifest) => artifact(manifest, servicePath).sha256 = "0".repeat(64)), "EXECUTION_DISTRIBUTION_CHECKSUM_MISMATCH");
  run("package-version", (plugin) => mutateManifest(plugin, (manifest) => artifact(manifest, servicePath).packageVersion = "9.9.9"), "EXECUTION_DISTRIBUTION_VERSION_MISMATCH");
  run("protocol-version", (plugin) => mutateManifest(plugin, (manifest) => manifest.protocolVersion = "app-builder.execution/9.0.0"), "EXECUTION_DISTRIBUTION_VERSION_MISMATCH");
  run("export-list", (plugin) => mutateManifest(plugin, (manifest) => artifact(manifest, adapterPath).exports.push("unexpected")), "EXECUTION_DISTRIBUTION_EXPORT_UNRESOLVED");
  run("core-dependency", (plugin) => mutateManifest(plugin, (manifest) => manifest.coreDependencies[0].sha256 = "0".repeat(64)), "EXECUTION_DISTRIBUTION_CORE_DEPENDENCY_MISMATCH");
  run("workspace-leakage", (plugin) => appendArtifact(plugin, servicePath, 'import "@yeeflow/forbidden";'), "EXECUTION_DISTRIBUTION_WORKSPACE_LEAKAGE");
  run("runtime-export-extra", (plugin) => appendArtifact(plugin, adapterPath, "export const unexpectedRuntimeExport = true;"), "EXECUTION_DISTRIBUTION_EXPORT_UNRESOLVED");
  runContract("contract-export-removed", (contract) => contract.approvedArtifacts.find((item) => item.path === servicePath).exports.pop(), "EXECUTION_DISTRIBUTION_EXPORT_UNRESOLVED");
  console.log("EXECUTION_SERVICE_DISTRIBUTION_GATE_REGRESSIONS_PASSED cases=10");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

function run(name, change, code, customContract = null) {
  const plugin = resolve(temporary, name, "yeeflow-app-builder-plugin");
  cpSync(sourcePlugin, plugin, { recursive: true });
  change(plugin);
  const args = [validator, resolve(plugin, "execution")];
  if (customContract) args.push("--contract", customContract);
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" });
  if (result.status === 0 || !`${result.stdout}${result.stderr}`.includes(code)) throw new Error(`Expected ${code}: ${name}: ${result.stdout}${result.stderr}`);
}

function runContract(name, change, code) {
  const contract = JSON.parse(readFileSync(contractPath, "utf8"));
  change(contract);
  const path = resolve(temporary, `${name}.json`);
  writeFileSync(path, JSON.stringify(contract), "utf8");
  run(name, () => {}, code, path);
}

function mutateManifest(plugin, change) {
  const path = resolve(plugin, "execution/yeeflow-app-builder-execution-service-distribution.v0.1.0.json");
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  change(manifest);
  writeFileSync(path, JSON.stringify(manifest), "utf8");
}

function appendArtifact(plugin, artifactPath, addition) {
  const path = resolve(plugin, artifactPath);
  const text = `${readFileSync(path, "utf8")}\n${addition}\n`;
  writeFileSync(path, text, "utf8");
  mutateManifest(plugin, (manifest) => artifact(manifest, artifactPath).sha256 = createHash("sha256").update(text).digest("hex"));
}

function artifact(manifest, path) {
  const item = manifest.artifacts.find((entry) => entry.path === path);
  if (!item) throw new Error(`Missing artifact fixture: ${path}`);
  return item;
}

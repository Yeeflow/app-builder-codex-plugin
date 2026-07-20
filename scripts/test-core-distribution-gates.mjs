#!/usr/bin/env node

import { cpSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "dist/yeeflow-app-builder-plugin/core");
const validator = resolve(root, "scripts/validate-core-distribution.mjs");
const distributionContract = resolve(root, "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-core-gates-"));
const planningPath = "core/yeeflow-app-builder-core-planning.v0.1.0.mjs";
const materializerPath = "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs";
const localRuntimePath = "core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs";

try {
  run("manifest-missing", (directory) => unlinkSync(resolve(directory, "yeeflow-app-builder-core-distribution.v0.1.0.json")), "CORE_DISTRIBUTION_ARTIFACT_MISSING");
  run("planning-missing", (directory) => unlinkSync(resolve(directory, basename(planningPath))), "CORE_DISTRIBUTION_ARTIFACT_MISSING");
  run("materializer-missing", (directory) => unlinkSync(resolve(directory, basename(materializerPath))), "CORE_DISTRIBUTION_ARTIFACT_MISSING");
  run("local-runtime-missing", (directory) => unlinkSync(resolve(directory, basename(localRuntimePath))), "CORE_DISTRIBUTION_ARTIFACT_MISSING");
  run("primary-sha", (directory) => mutate(directory, (manifest) => { manifest.artifactSha256 = "0".repeat(64); }), "CORE_DISTRIBUTION_CHECKSUM_MISMATCH");
  run("planning-item-sha", (directory) => mutate(directory, (manifest) => artifact(manifest, planningPath).sha256 = "0".repeat(64)), "CORE_DISTRIBUTION_CHECKSUM_MISMATCH");
  run("materializer-item-sha", (directory) => mutate(directory, (manifest) => artifact(manifest, materializerPath).sha256 = "0".repeat(64)), "CORE_DISTRIBUTION_CHECKSUM_MISMATCH");
  run("local-runtime-item-sha", (directory) => mutate(directory, (manifest) => artifact(manifest, localRuntimePath).sha256 = "0".repeat(64)), "CORE_DISTRIBUTION_CHECKSUM_MISMATCH");
  run("core-version", (directory) => mutate(directory, (manifest) => { manifest.coreVersion = "0.0.0"; }), "CORE_DISTRIBUTION_VERSION_MISMATCH");
  run("package-version", (directory) => mutate(directory, (manifest) => { artifact(manifest, materializerPath).packageVersion = "0.0.0"; }), "CORE_DISTRIBUTION_VERSION_MISMATCH");
  run("local-runtime-package-version", (directory) => mutate(directory, (manifest) => { artifact(manifest, localRuntimePath).packageVersion = "0.0.0"; }), "CORE_DISTRIBUTION_VERSION_MISMATCH");
  run("artifact-path", (directory) => mutate(directory, (manifest) => { artifact(manifest, materializerPath).path = "core/wrong.mjs"; }), "CORE_DISTRIBUTION_ARTIFACT_MISSING");
  run("local-runtime-artifact-path", (directory) => mutate(directory, (manifest) => { artifact(manifest, localRuntimePath).path = "core/wrong.mjs"; }), "CORE_DISTRIBUTION_ARTIFACT_MISSING");
  run("exports-missing", (directory) => mutate(directory, (manifest) => { delete artifact(manifest, materializerPath).exports; }), "CORE_DISTRIBUTION_EXPORT_UNRESOLVED");
  run("manifest-omits-fixed-filter-export", (directory) => mutate(directory, (manifest) => artifact(manifest, materializerPath).exports = artifact(manifest, materializerPath).exports.filter((name) => name !== "projectFixedFilterIntents")), "CORE_DISTRIBUTION_EXPORT_UNRESOLVED");
  run("manifest-omits-local-runtime-export", (directory) => mutate(directory, (manifest) => artifact(manifest, localRuntimePath).exports = artifact(manifest, localRuntimePath).exports.filter((name) => name !== "lowerFixedFilterProjectionAtHost")), "CORE_DISTRIBUTION_EXPORT_UNRESOLVED");
  run("exports-extra", (directory) => mutate(directory, (manifest) => artifact(manifest, planningPath).exports.push("missingExport")), "CORE_DISTRIBUTION_EXPORT_UNRESOLVED");
  run("unexpected-runtime-export", (directory) => append(directory, localRuntimePath, "export const unexpectedInternalRuntimeExport = true;"), "CORE_DISTRIBUTION_EXPORT_UNRESOLVED");
  for (const [name, addition] of [
    ["posix", "/Users/example/repository/source.ts"], ["packages", "packages/source.ts"], ["workspace", 'import "@yeeflow/x";'], ["side-effect", 'import "bare-package";'], ["import-from", 'import x from "bare-package";'], ["export-from", 'export * from "bare-package";'], ["dynamic", 'import("bare-package");'], ["require", 'require("bare-package");'], ["file", "file:///x"], ["windows", "C:\\repo\\source.ts"], ["node-modules", "node_modules/x"], ["source-map", "//# sourceMappingURL=x"]
  ]) run(`leakage-${name}`, (directory) => append(directory, localRuntimePath, addition), "CORE_DISTRIBUTION_WORKSPACE_LEAKAGE");
  runContract("contract-omits-fixed-filter-export", (contract) => contractArtifact(contract, materializerPath).exports = contractArtifact(contract, materializerPath).exports.filter((name) => name !== "projectFixedFilterIntents"), "CORE_DISTRIBUTION_EXPORT_UNRESOLVED");
  runContract("contract-declares-absent-source-export", (contract) => contractArtifact(contract, materializerPath).exports.push("missingSourceExport"), "CORE_DISTRIBUTION_EXPORT_UNRESOLVED");
  console.log("CORE_DISTRIBUTION_GATE_REGRESSIONS_PASSED cases=32");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

function run(name, change, code) {
  const directory = resolve(temporary, name);
  cpSync(source, directory, { recursive: true });
  change(directory);
  const result = spawnSync(process.execPath, [validator, directory], { cwd: root, encoding: "utf8" });
  if (result.status === 0 || !`${result.stdout}${result.stderr}`.includes(code)) throw new Error(`Expected ${code}: ${name}`);
}

function runContract(name, change, code) {
  const path = resolve(temporary, `${name}.json`);
  const contract = JSON.parse(readFileSync(distributionContract, "utf8"));
  change(contract);
  writeFileSync(path, JSON.stringify(contract));
  const result = spawnSync(process.execPath, [validator, source, "--contract", path], { cwd: root, encoding: "utf8" });
  if (result.status === 0 || !`${result.stdout}${result.stderr}`.includes(code)) throw new Error(`Expected ${code}: ${name}`);
}

function mutate(directory, change) {
  const path = resolve(directory, "yeeflow-app-builder-core-distribution.v0.1.0.json");
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  change(manifest);
  writeFileSync(path, JSON.stringify(manifest));
}

function append(directory, artifactPath, addition) {
  const path = resolve(directory, basename(artifactPath));
  const text = `${readFileSync(path, "utf8")}\n${addition}\n`;
  writeFileSync(path, text);
  const digest = createHash("sha256").update(text).digest("hex");
  mutate(directory, (manifest) => {
    artifact(manifest, artifactPath).sha256 = digest;
    if (manifest.primaryArtifactPath === artifactPath) manifest.artifactSha256 = digest;
  });
}

function artifact(manifest, path) {
  const result = manifest.artifacts.find((item) => item.path === path);
  if (!result) throw new Error(`Missing test artifact: ${path}`);
  return result;
}
function contractArtifact(contract, path) {
  const result = contract.approvedArtifacts.find((item) => item.path === path);
  if (!result) throw new Error(`Missing contract artifact: ${path}`);
  return result;
}

function basename(path) { return path.split("/").at(-1); }

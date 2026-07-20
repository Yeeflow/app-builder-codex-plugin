#!/usr/bin/env node

import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "dist/yeeflow-app-builder-plugin/core");
const distributionValidator = resolve(root, "scripts/validate-core-distribution.mjs");
const publicApiValidator = resolve(root, "scripts/validate-data-list-scalar-field-projection-public-api.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-data-list-scalar-gates-"));
const materializerPath = "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs";

try {
  runDistributionCase("missing-projection-export", (directory) => removeProjectionExport(directory), "CORE_DISTRIBUTION_EXPORT_UNRESOLVED");
  runDistributionCase("unexpected-runtime-export", (directory) => appendArtifact(directory, "export const unexpectedInternalRuntimeExport = true;"), "CORE_DISTRIBUTION_EXPORT_UNRESOLVED");
  runDistributionCase("checksum-mismatch", (directory) => mutateManifest(directory, (manifest) => artifact(manifest).sha256 = "0".repeat(64)), "CORE_DISTRIBUTION_CHECKSUM_MISMATCH");
  runDistributionCase("workspace-source-leakage", (directory) => appendArtifact(directory, "packages/source.ts"), "CORE_DISTRIBUTION_WORKSPACE_LEAKAGE");
  runDistributionCase("node-modules-leakage", (directory) => appendArtifact(directory, "node_modules/example"), "CORE_DISTRIBUTION_WORKSPACE_LEAKAGE");
  runDistributionCase("source-map-leakage", (directory) => appendArtifact(directory, "//# sourceMappingURL=source.map"), "CORE_DISTRIBUTION_WORKSPACE_LEAKAGE");
  runPublicContractCase();
  assertSurfaceMismatchRejected();
  console.log("DATA_LIST_SCALAR_FIELD_PROJECTION_DISTRIBUTION_GATES_PASSED cases=8");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

function runDistributionCase(name, mutate, code) {
  const directory = resolve(temporary, name);
  cpSync(source, directory, { recursive: true });
  mutate(directory);
  const result = spawnSync(process.execPath, [distributionValidator, directory], { cwd: root, encoding: "utf8" });
  if (result.status === 0 || !`${result.stdout}${result.stderr}`.includes(code)) throw new Error(`Expected ${code}: ${name}`);
}

function runPublicContractCase() {
  const path = resolve(temporary, "public-contract-mismatch.json");
  const contract = JSON.parse(readFileSync(resolve(root, "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json"), "utf8"));
  contract.runtimeExports = contract.runtimeExports.filter((name) => name !== "projectDataListScalarField");
  writeFileSync(path, JSON.stringify(contract));
  const result = spawnSync(process.execPath, [publicApiValidator, "--contract", path], { cwd: root, encoding: "utf8" });
  if (result.status === 0 || !`${result.stdout}${result.stderr}`.includes("DATA_LIST_SCALAR_FIELD_PROJECTION_PUBLIC_API_CONTRACT_MISMATCH")) throw new Error("Expected DATA_LIST_SCALAR_FIELD_PROJECTION_PUBLIC_API_CONTRACT_MISMATCH: public-contract-mismatch");
}

function assertSurfaceMismatchRejected() {
  try {
    assertMatchingSurfaceOutputs([{ value: "source" }], [{ value: "installed" }]);
  } catch (error) {
    if (error.message === "DATA_LIST_SCALAR_FIELD_PROJECTION_SURFACE_PARITY_MISMATCH") return;
    throw error;
  }
  throw new Error("Expected DATA_LIST_SCALAR_FIELD_PROJECTION_SURFACE_PARITY_MISMATCH: surface-output-mismatch");
}

function assertMatchingSurfaceOutputs(left, right) {
  if (JSON.stringify(left) !== JSON.stringify(right)) throw new Error("DATA_LIST_SCALAR_FIELD_PROJECTION_SURFACE_PARITY_MISMATCH");
}

function mutateManifest(directory, mutate) {
  const path = resolve(directory, "yeeflow-app-builder-core-distribution.v0.1.0.json");
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  mutate(manifest);
  writeFileSync(path, JSON.stringify(manifest));
}

function appendArtifact(directory, addition) {
  const path = resolve(directory, materializerPath.split("/").at(-1));
  const text = `${readFileSync(path, "utf8")}\n${addition}\n`;
  writeFileSync(path, text);
  const digest = createHash("sha256").update(text).digest("hex");
  mutateManifest(directory, (manifest) => { artifact(manifest).sha256 = digest; });
}

function removeProjectionExport(directory) {
  const path = resolve(directory, materializerPath.split("/").at(-1));
  const original = readFileSync(path, "utf8");
  const text = original.replace("export function projectDataListScalarField", "function projectDataListScalarField");
  if (text === original) throw new Error("DATA_LIST_SCALAR_FIELD_PROJECTION_TEST_EXPORT_NOT_FOUND");
  writeFileSync(path, text);
  const digest = createHash("sha256").update(text).digest("hex");
  mutateManifest(directory, (manifest) => { artifact(manifest).sha256 = digest; });
}

function artifact(manifest) {
  const item = manifest.artifacts.find((candidate) => candidate.path === materializerPath);
  if (!item) throw new Error("DATA_LIST_SCALAR_FIELD_PROJECTION_TEST_ARTIFACT_MISSING");
  return item;
}

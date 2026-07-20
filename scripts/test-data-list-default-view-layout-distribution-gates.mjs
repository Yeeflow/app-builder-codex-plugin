#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const core = resolve(root, "dist/yeeflow-app-builder-plugin/core");
const distributionValidator = resolve(root, "scripts/validate-core-distribution.mjs");
const apiValidator = resolve(root, "scripts/validate-data-list-default-view-layout-public-api.mjs");
const publicContract = resolve(root, "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const materializerPath = "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs";
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-layoutview-public-gates-"));

try {
  distributionCase("missing-approved-export", removePublicExport, "CORE_DISTRIBUTION_EXPORT_UNRESOLVED");
  distributionCase("unexpected-internal-export", (directory) => appendArtifact(directory, "export const projectDataListDefaultViewLayoutInternal = null;"), "CORE_DISTRIBUTION_EXPORT_UNRESOLVED");
  distributionCase("checksum-mismatch", (directory) => mutateManifest(directory, (manifest) => artifact(manifest).sha256 = "0".repeat(64)), "CORE_DISTRIBUTION_CHECKSUM_MISMATCH");
  distributionCase("version-mismatch", (directory) => mutateManifest(directory, (manifest) => artifact(manifest).packageVersion = "9.9.9"), "CORE_DISTRIBUTION_VERSION_MISMATCH");
  distributionCase("path-mismatch", (directory) => mutateManifest(directory, (manifest) => artifact(manifest).path = "core/unapproved-layoutview.mjs"), "CORE_DISTRIBUTION_ARTIFACT_MISSING");
  distributionCase("workspace-leakage", (directory) => appendArtifact(directory, "import \"@yeeflow/workspace-leak\";"), "CORE_DISTRIBUTION_WORKSPACE_LEAKAGE");
  distributionCase("source-map-leakage", (directory) => appendArtifact(directory, "//# sourceMappingURL=layoutview.map"), "CORE_DISTRIBUTION_WORKSPACE_LEAKAGE");
  publicContractCase("contract-mismatch", (value) => { value.runtimeExports = value.runtimeExports.filter((name) => name !== "projectDataListDefaultViewLayout"); }, "DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_CONTRACT_MISMATCH");
  publicContractCase("shape-leakage", (value) => { value.projectDataListDefaultViewLayout.input = "Accepts a Legacy LayoutView resource record."; }, "DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_SHAPE_LEAKAGE");
  apiArtifactCase("runtime-lowering-in-materializer", "export const lowerFixedFilterProjectionAtHost = null;", "DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_EXPORT_MISMATCH");
  assertSurfaceMismatchRejected();
  console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_DISTRIBUTION_GATES_PASSED cases=11");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

function distributionCase(name, mutate, code) {
  const directory = resolve(temporary, name);
  cpSync(core, directory, { recursive: true });
  mutate(directory);
  assertFailure([distributionValidator, directory], code, name);
}

function publicContractCase(name, mutate, code) {
  const contractPath = resolve(temporary, `${name}.json`);
  const contract = JSON.parse(readFileSync(publicContract, "utf8"));
  mutate(contract);
  writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`, "utf8");
  assertFailure([apiValidator, "--contract", contractPath], code, name);
}

function apiArtifactCase(name, addition, code) {
  const directory = resolve(temporary, name);
  cpSync(core, directory, { recursive: true });
  appendArtifact(directory, addition);
  assertFailure([apiValidator, "--compiled", resolve(directory, materializerPath.split("/").at(-1))], code, name);
}

function assertFailure(command, code, name) {
  const result = spawnSync(process.execPath, command, { cwd: root, encoding: "utf8" });
  assert.notEqual(result.status, 0, `${name} must fail.`);
  assert.match(`${result.stdout || ""}${result.stderr || ""}`, new RegExp(code), `${name} must emit ${code}.`);
}

function removePublicExport(directory) {
  const path = artifactFile(directory);
  const original = readFileSync(path, "utf8");
  const text = original.replace("export function projectDataListDefaultViewLayout", "function projectDataListDefaultViewLayout");
  if (text === original) throw new Error("DATA_LIST_DEFAULT_VIEW_LAYOUT_TEST_EXPORT_NOT_FOUND");
  writeArtifact(directory, text);
}

function appendArtifact(directory, addition) { writeArtifact(directory, `${readFileSync(artifactFile(directory), "utf8")}\n${addition}\n`); }
function writeArtifact(directory, text) { writeFileSync(artifactFile(directory), text, "utf8"); mutateManifest(directory, (manifest) => { artifact(manifest).sha256 = sha256(text); }); }
function artifactFile(directory) { return resolve(directory, materializerPath.split("/").at(-1)); }
function mutateManifest(directory, mutate) { const path = resolve(directory, "yeeflow-app-builder-core-distribution.v0.1.0.json"); const manifest = JSON.parse(readFileSync(path, "utf8")); mutate(manifest); writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`, "utf8"); }
function artifact(manifest) { const value = manifest.artifacts.find((item) => item.path === materializerPath); if (!value) throw new Error("DATA_LIST_DEFAULT_VIEW_LAYOUT_TEST_ARTIFACT_MISSING"); return value; }
function assertSurfaceMismatchRejected() { assert.throws(() => { if (JSON.stringify([{ output: "source" }]) !== JSON.stringify([{ output: "installed" }])) throw new Error("DATA_LIST_DEFAULT_VIEW_LAYOUT_SURFACE_PARITY_MISMATCH"); }, /DATA_LIST_DEFAULT_VIEW_LAYOUT_SURFACE_PARITY_MISMATCH/); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist/yeeflow-app-builder-plugin");
const historicalZip = resolve(root, "dist/yeeflow-app-builder-plugin-0.9.71.zip");
const expectedHistoricalZipSha256 = "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2";
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-layoutview-public-distribution-"));
const materializerName = "yeeflow-app-builder-core-materializer.v0.1.0.mjs";
const runtimeName = "yeeflow-app-builder-core-local-runtime.v0.1.0.mjs";

assert.equal(sha256(readFileSync(historicalZip)), expectedHistoricalZipSha256, "Historical ZIP checksum must match before the LayoutView distribution proof.");

try {
  execFileSync(process.execPath, [resolve(root, "scripts/test-data-list-default-view-layout-projection-differential.mjs"), "--core", resolve(root, "packages/app-builder-core-materializer/lib/index.js"), "--function", "projectDataListDefaultViewLayout"], { cwd: root, stdio: "inherit" });
  execFileSync(process.execPath, [resolve(root, "scripts/validate-data-list-default-view-layout-public-api.mjs")], { cwd: root, stdio: "inherit" });
  console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_ARTIFACT_SOURCE_PARITY_PASSED cases=12");

  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
  await verifySurface("dist", resolve(dist, "core"));
  console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_ARTIFACT_DIST_PARITY_PASSED cases=12");

  const proofZip = resolve(temporary, "proof.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", proofZip], { cwd: root, stdio: "inherit" });
  const archiveRoot = resolve(temporary, "archive");
  mkdirSync(archiveRoot, { recursive: true });
  execFileSync("unzip", ["-q", proofZip, "-d", archiveRoot]);
  await verifySurface("archive", resolve(archiveRoot, "yeeflow-app-builder-plugin/core"));
  console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_ARTIFACT_ARCHIVE_PARITY_PASSED cases=12");

  const installed = resolve(temporary, "installed/yeeflow-app-builder-plugin");
  cpSync(dist, installed, { recursive: true });
  await verifySurface("installed", resolve(installed, "core"));
  console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_ARTIFACT_INSTALLED_PARITY_PASSED cases=12");

  assert.equal(sha256(readFileSync(historicalZip)), expectedHistoricalZipSha256, "Historical ZIP checksum must match after the LayoutView distribution proof.");
  console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_DISTRIBUTION_VALID");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

async function verifySurface(label, coreDirectory) {
  execFileSync(process.execPath, [resolve(root, "scripts/validate-core-distribution.mjs"), coreDirectory], { cwd: root, stdio: "inherit" });
  const materializer = resolve(coreDirectory, materializerName);
  execFileSync(process.execPath, [resolve(root, "scripts/validate-data-list-default-view-layout-public-api.mjs"), "--compiled", materializer], { cwd: root, stdio: "inherit" });
  execFileSync(process.execPath, [resolve(root, "scripts/test-data-list-default-view-layout-projection-differential.mjs"), "--core", materializer, "--function", "projectDataListDefaultViewLayout", "--runtime", resolve(coreDirectory, runtimeName)], { cwd: root, stdio: "inherit" });
  if (!readFileSync(materializer, "utf8").includes("projectDataListDefaultViewLayout")) throw new Error(`DATA_LIST_DEFAULT_VIEW_LAYOUT_SURFACE_EXPORT_MISSING surface=${label}`);
}

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

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
const zip = resolve(root, "dist/yeeflow-app-builder-plugin-0.9.71.zip");
const expectedZip = "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2";
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-additional-layout-distribution-"));
const artifact = "yeeflow-app-builder-core-materializer.v0.1.0.mjs";
const runtime = "yeeflow-app-builder-core-local-runtime.v0.1.0.mjs";
try {
  assert.equal(hash(readFileSync(zip)), expectedZip, "Historical ZIP changed before proof.");
  verify("source", resolve(root, "packages/app-builder-core-materializer/lib"), resolve(root, "runtimes/app-builder-core-local-runtime/lib/index.js"));
  console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_ARTIFACT_SOURCE_PARITY_PASSED cases=7");
  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
  verify("dist", resolve(dist, "core", artifact), resolve(dist, "core", runtime));
  const proof = resolve(temporary, "proof.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", proof], { cwd: root, stdio: "inherit" });
  const archive = resolve(temporary, "archive"); mkdirSync(archive, { recursive: true }); execFileSync("unzip", ["-q", proof, "-d", archive]);
  verify("archive", resolve(archive, "yeeflow-app-builder-plugin/core", artifact), resolve(archive, "yeeflow-app-builder-plugin/core", runtime));
  console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_ARTIFACT_ARCHIVE_PARITY_PASSED cases=7");
  const installed = resolve(temporary, "installed/yeeflow-app-builder-plugin"); cpSync(dist, installed, { recursive: true });
  verify("installed", resolve(installed, "core", artifact), resolve(installed, "core", runtime));
  console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_ARTIFACT_INSTALLED_PARITY_PASSED cases=7");
  assert.equal(hash(readFileSync(zip)), expectedZip, "Historical ZIP changed after proof.");
  console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_API_CONTRACT_PASSED");
  console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_DISTRIBUTION_VALID");
} finally { rmSync(temporary, { recursive: true, force: true }); }
function verify(label, core, runtimePath) {
  const source = label === "source" ? resolve(core, "index.js") : core;
  execFileSync(process.execPath, [resolve(root, "scripts/test-data-list-additional-view-layout-projection-differential.mjs"), "--core", source, "--function", "projectDataListAdditionalViewLayout", "--runtime", runtimePath], { cwd: root, stdio: "inherit" });
  if (label !== "source") execFileSync(process.execPath, [resolve(root, "scripts/validate-core-distribution.mjs"), dirname(core)], { cwd: root, stdio: "inherit" });
  if (!readFileSync(source, "utf8").includes("projectDataListAdditionalViewLayout")) throw new Error(`DATA_LIST_ADDITIONAL_VIEW_LAYOUT_SURFACE_EXPORT_MISSING ${label}`);
}
function hash(value) { return createHash("sha256").update(value).digest("hex"); }

#!/usr/bin/env node

import { copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist/yeeflow-app-builder-plugin");
const historicalZip = resolve(root, "dist/yeeflow-app-builder-plugin-0.9.71.zip");
const historicalChecksum = createHash("sha256").update(readFileSync(historicalZip)).digest("hex");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-core-proof-"));

try {
  for (const name of ["one", "two"]) execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs"), "--output", resolve(temporary, name)], { cwd: root });
  assertDeterministic(resolve(temporary, "one"), resolve(temporary, "two"));
  console.log("CORE_DISTRIBUTION_DETERMINISM_PASSED");

  const source = await verify(resolve(dist, "core"));
  console.log(`CORE_DISTRIBUTION_SOURCE_EXPORTS_VALID count=${source.planningExportCount}`);
  console.log(`CORE_DISTRIBUTION_SOURCE_ALL_ARTIFACT_EXPORTS_VALID count=${source.totalExportCount}`);

  const proofZip = resolve(temporary, "proof.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", proofZip], { cwd: root });
  const archiveRoot = resolve(temporary, "archive");
  mkdirSync(archiveRoot, { recursive: true });
  execFileSync("unzip", ["-q", proofZip, "-d", archiveRoot]);
  const archive = await verify(resolve(archiveRoot, "yeeflow-app-builder-plugin/core"));
  console.log(`CORE_DISTRIBUTION_ARCHIVE_EXPORTS_VALID count=${archive.planningExportCount}`);
  console.log(`CORE_DISTRIBUTION_ARCHIVE_ALL_ARTIFACT_EXPORTS_VALID count=${archive.totalExportCount}`);
  console.log("CORE_DISTRIBUTION_ARCHIVE_RESOLUTION_PASSED");

  const installed = resolve(temporary, "installed/yeeflow-app-builder-plugin");
  cpSync(dist, installed, { recursive: true });
  const installedResult = await verify(resolve(installed, "core"));
  console.log(`CORE_DISTRIBUTION_INSTALLED_EXPORTS_VALID count=${installedResult.planningExportCount}`);
  console.log(`CORE_DISTRIBUTION_INSTALLED_ALL_ARTIFACT_EXPORTS_VALID count=${installedResult.totalExportCount}`);
  console.log("CORE_DISTRIBUTION_INSTALLED_RESOLUTION_PASSED");

  const rollback = resolve(temporary, "rollback");
  cpSync(dist, rollback, { recursive: true });
  copyFileSync(resolve(root, "compatibility/differential-fixtures/core-extraction-wave1-markdown-planning-legacy-baseline.v0.1.0.mjs"), resolve(rollback, "scripts/lib/markdown-planning-utils.mjs"));
  renameSync(resolve(rollback, "core"), resolve(rollback, "core-hidden"));
  const legacy = await import(pathToFileURL(resolve(rollback, "scripts/lib/markdown-planning-utils.mjs")).href);
  if (legacy.parseMarkdownTables("| A |\n| --- |\n| B |").length !== 1) throw new Error("Legacy rollback failed");
  console.log("CORE_DISTRIBUTION_ROLLBACK_PASSED");
  if (createHash("sha256").update(readFileSync(historicalZip)).digest("hex") !== historicalChecksum) throw new Error("Historical ZIP changed");
  console.log("CORE_DISTRIBUTION_RESOLUTION_PASSED");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

function assertDeterministic(left, right) {
  const leftManifest = normalizeManifest(JSON.parse(readFileSync(resolve(left, "yeeflow-app-builder-core-distribution.v0.1.0.json"), "utf8")));
  const rightManifest = normalizeManifest(JSON.parse(readFileSync(resolve(right, "yeeflow-app-builder-core-distribution.v0.1.0.json"), "utf8")));
  if (JSON.stringify(leftManifest) !== JSON.stringify(rightManifest)) throw new Error("CORE_DISTRIBUTION_CHECKSUM_MISMATCH");
  for (const artifact of leftManifest.artifacts) {
    const file = artifact.path.split("/").at(-1);
    if (!readFileSync(resolve(left, file)).equals(readFileSync(resolve(right, file)))) throw new Error("CORE_DISTRIBUTION_CHECKSUM_MISMATCH");
  }
}

function normalizeManifest(manifest) { const normalized = structuredClone(manifest); delete normalized.sourceTreeState; return normalized; }

async function verify(coreDirectory) {
  execFileSync(process.execPath, [resolve(root, "scripts/validate-core-distribution.mjs"), coreDirectory], { cwd: root, stdio: "inherit" });
  const manifest = JSON.parse(readFileSync(resolve(coreDirectory, "yeeflow-app-builder-core-distribution.v0.1.0.json"), "utf8"));
  let totalExportCount = 0;
  let planningExportCount = 0;
  for (const artifact of manifest.artifacts) {
    const module = await import(pathToFileURL(resolve(coreDirectory, artifact.path.split("/").at(-1))).href);
    for (const name of artifact.exports) if (!(name in module)) throw new Error(`CORE_DISTRIBUTION_EXPORT_UNRESOLVED ${artifact.path}#${name}`);
    totalExportCount += artifact.exports.length;
    if (artifact.packageName === "@yeeflow/app-builder-core-planning") planningExportCount = artifact.exports.length;
  }
  return { totalExportCount, planningExportCount };
}

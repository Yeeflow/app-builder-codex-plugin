#!/usr/bin/env node

import { cpSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = resolve(root, "dist/yeeflow-app-builder-plugin");
const fixturePath = resolve(root, "compatibility/differential-fixtures/approval-form-layout-template.v0.9.71.json");
const historicalZip = resolve(root, "dist/yeeflow-app-builder-plugin-0.9.71.zip");
const expectedHistoricalSha256 = "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2";
const historicalBefore = sha256(readFileSync(historicalZip));
if (historicalBefore !== expectedHistoricalSha256) throw new Error("CORE_COMPAT_ADAPTER_APPROVAL_LAYOUT_HISTORICAL_ZIP_CHANGED: Historical ZIP checksum does not match the protected baseline.");
const temporaryRoot = mkdtempSync(resolve(tmpdir(), "yeeflow-approval-layout-resolution-"));
const validPlan = JSON.parse(readFileSync(fixturePath, "utf8")).fixtures.find((fixture) => fixture.expectedExitStatus === 0).plan;

try {
  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
  const planPath = resolve(temporaryRoot, "valid-plan.md");
  writeFileSync(planPath, validPlan, "utf8");
  execute(resolve(root, "scripts/validate-approval-form-layout-template.mjs"), planPath, "CORE_COMPAT_ADAPTER_APPROVAL_LAYOUT_SOURCE_PASSED");

  const archivePath = resolve(temporaryRoot, "proof.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", archivePath], { cwd: root, stdio: "inherit" });
  const archiveRoot = resolve(temporaryRoot, "archive");
  execFileSync("unzip", ["-q", archivePath, "-d", archiveRoot]);
  execute(resolve(archiveRoot, "yeeflow-app-builder-plugin/scripts/validate-approval-form-layout-template.mjs"), planPath, "CORE_COMPAT_ADAPTER_APPROVAL_LAYOUT_ARCHIVE_PASSED");

  const installedRoot = resolve(temporaryRoot, "installed/yeeflow-app-builder-plugin");
  cpSync(distRoot, installedRoot, { recursive: true });
  execute(resolve(installedRoot, "scripts/validate-approval-form-layout-template.mjs"), planPath, "CORE_COMPAT_ADAPTER_APPROVAL_LAYOUT_INSTALLED_PASSED");

  const historicalAfter = sha256(readFileSync(historicalZip));
  if (historicalAfter !== historicalBefore) throw new Error("CORE_COMPAT_ADAPTER_APPROVAL_LAYOUT_HISTORICAL_ZIP_CHANGED: Historical ZIP changed during proof.");
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

function execute(scriptPath, planPath, marker) {
  const result = spawnSync(process.execPath, [realpathSync(scriptPath), "--plan", planPath], { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`CORE_COMPAT_ADAPTER_APPROVAL_LAYOUT_RESOLUTION_FAILED: ${marker}: ${result.stderr || result.stdout}`);
  const report = JSON.parse(result.stdout);
  if (report.status !== "pass" || report.findings.length !== 0) throw new Error(`CORE_COMPAT_ADAPTER_APPROVAL_LAYOUT_OUTPUT_INVALID: ${marker}.`);
  console.log(marker);
}
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

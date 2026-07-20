#!/usr/bin/env node

import { cpSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = resolve(root, "dist/yeeflow-app-builder-plugin");
const fixturePath = resolve(root, "compatibility/differential-fixtures/functional-spec-to-app-plan-traceability.v0.9.71.json");
const historicalZip = resolve(root, "dist/yeeflow-app-builder-plugin-0.9.71.zip");
const expectedHistoricalSha256 = "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2";
const historicalBefore = sha256(readFileSync(historicalZip));
if (historicalBefore !== expectedHistoricalSha256) throw new Error("CORE_COMPAT_ADAPTER_TRACEABILITY_HISTORICAL_ZIP_CHANGED: Historical ZIP checksum does not match the protected baseline.");
const temporaryRoot = mkdtempSync(resolve(tmpdir(), "yeeflow-traceability-resolution-"));
const validFixture = JSON.parse(readFileSync(fixturePath, "utf8")).fixtures.find((fixture) => fixture.expectedExitStatus === 0);

try {
  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
  const specPath = resolve(temporaryRoot, "valid-spec.md");
  const planPath = resolve(temporaryRoot, "valid-plan.md");
  writeFileSync(specPath, validFixture.spec, "utf8");
  writeFileSync(planPath, validFixture.plan, "utf8");
  execute(resolve(root, "scripts/validate-functional-spec-to-app-plan-traceability.mjs"), specPath, planPath, "CORE_COMPAT_ADAPTER_TRACEABILITY_SOURCE_PASSED");

  const archivePath = resolve(temporaryRoot, "proof.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", archivePath], { cwd: root, stdio: "inherit" });
  const archiveRoot = resolve(temporaryRoot, "archive");
  execFileSync("unzip", ["-q", archivePath, "-d", archiveRoot]);
  execute(resolve(archiveRoot, "yeeflow-app-builder-plugin/scripts/validate-functional-spec-to-app-plan-traceability.mjs"), specPath, planPath, "CORE_COMPAT_ADAPTER_TRACEABILITY_ARCHIVE_PASSED");

  const installedRoot = resolve(temporaryRoot, "installed/yeeflow-app-builder-plugin");
  cpSync(distRoot, installedRoot, { recursive: true });
  execute(resolve(installedRoot, "scripts/validate-functional-spec-to-app-plan-traceability.mjs"), specPath, planPath, "CORE_COMPAT_ADAPTER_TRACEABILITY_INSTALLED_PASSED");

  const historicalAfter = sha256(readFileSync(historicalZip));
  if (historicalAfter !== historicalBefore) throw new Error("CORE_COMPAT_ADAPTER_TRACEABILITY_HISTORICAL_ZIP_CHANGED: Historical ZIP changed during proof.");
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

function execute(scriptPath, specPath, planPath, marker) {
  const result = spawnSync(process.execPath, [realpathSync(scriptPath), "--spec", specPath, "--plan", planPath, "--json"], { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`CORE_COMPAT_ADAPTER_TRACEABILITY_RESOLUTION_FAILED: ${marker}: ${result.stderr || result.stdout}`);
  const report = JSON.parse(result.stdout);
  if (report.status !== "pass" || report.findings.length !== 0) throw new Error(`CORE_COMPAT_ADAPTER_TRACEABILITY_OUTPUT_INVALID: ${marker}.`);
  console.log(marker);
}
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

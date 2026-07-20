#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "compatibility/capability-manifests/core-v1-rc-integration-readiness.v1.0.0.json");
const temp = mkdtempSync(resolve(tmpdir(), "yeeflow-core-v1-rc-readiness-"));

function copyContract(name, mutate) {
  const path = resolve(temp, `${name}.json`);
  const contract = JSON.parse(readFileSync(source, "utf8"));
  mutate(contract);
  writeFileSync(path, `${JSON.stringify(contract, null, 2)}\n`, "utf8");
  return path;
}
function rejected(path, marker) {
  assert.throws(() => execFileSync(process.execPath, [resolve(root, "scripts/validate-core-v1-rc-integration-readiness.mjs"), "--contract", path], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), (error) => `${error.stdout || ""}${error.stderr || ""}`.includes(marker));
}

try {
  execFileSync(process.execPath, [resolve(root, "scripts/validate-core-v1-rc-integration-readiness.mjs")], { cwd: root, stdio: "pipe" });
  const version = copyContract("version", (value) => { const assembly = JSON.parse(readFileSync(resolve(root, value.candidateAssemblyContract), "utf8")); assembly.candidate.releaseVersion = "1.0.0"; writeFileSync(resolve(temp, "assembly.json"), `${JSON.stringify(assembly)}\n`); value.candidateAssemblyContract = `${temp}/assembly.json`; });
  rejected(version, "CORE_V1_RC_VERSION_POLICY_INVALID");
  const coverage = copyContract("coverage", (value) => { const matrix = JSON.parse(readFileSync(resolve(root, value.coverageMatrix), "utf8")); matrix.surfaces = matrix.surfaces.filter((item) => item.id !== "dashboard-static-configuration"); writeFileSync(resolve(temp, "matrix.json"), `${JSON.stringify(matrix)}\n`); value.coverageMatrix = `${temp}/matrix.json`; });
  rejected(coverage, "CORE_V1_RC_COVERAGE_SURFACE_MISSING");
  const bypass = copyContract("bypass", (value) => { const assembly = JSON.parse(readFileSync(resolve(root, value.candidateAssemblyContract), "utf8")); assembly.releaseGates.prohibitedInThisReadinessAudit = assembly.releaseGates.prohibitedInThisReadinessAudit.filter((item) => item !== "installation"); writeFileSync(resolve(temp, "bypass-assembly.json"), `${JSON.stringify(assembly)}\n`); value.candidateAssemblyContract = `${temp}/bypass-assembly.json`; });
  rejected(bypass, "CORE_V1_RC_RELEASE_BYPASS_NOT_REJECTED");
  const checksum = copyContract("checksum", (value) => { value.authorities.distributionManifestSha256 = "0".repeat(64); });
  rejected(checksum, "CORE_V1_RC_AUTHORITY_CHECKSUM_MISMATCH:distributionManifest");
  const active = copyContract("active", (value) => { const rollback = JSON.parse(readFileSync(resolve(root, value.rollbackInstallPlan), "utf8")); rollback.rejectionConditions = rollback.rejectionConditions.filter((item) => item !== "Target equals active installation"); writeFileSync(resolve(temp, "rollback.json"), `${JSON.stringify(rollback)}\n`); value.rollbackInstallPlan = `${temp}/rollback.json`; });
  rejected(active, "CORE_V1_RC_ACTIVE_INSTALL_GUARD_INVALID");
  console.log("CORE_V1_RC_INTEGRATION_READINESS_REGRESSIONS_PASSED cases=5");
} finally { rmSync(temp, { recursive: true, force: true }); }

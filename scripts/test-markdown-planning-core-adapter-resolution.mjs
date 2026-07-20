#!/usr/bin/env node

import { cpSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = resolve(root, "dist/yeeflow-app-builder-plugin");
const historicalZip = resolve(root, "dist/yeeflow-app-builder-plugin-0.9.71.zip");
const expectedHistoricalSha256 = "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2";
const historicalBefore = sha256(readFileSync(historicalZip));
if (historicalBefore !== expectedHistoricalSha256) throw new Error("CORE_COMPAT_ADAPTER_HISTORICAL_ZIP_CHANGED: Historical Plugin ZIP checksum does not match its protected baseline.");
const temp = mkdtempSync(resolve(tmpdir(), "yeeflow-core-adapter-proof-"));

try {
  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
  execFileSync(process.execPath, [resolve(root, "scripts/validate-markdown-planning-core-adapter.mjs")], { cwd: root, stdio: "inherit" });
  await verifyAdapter(resolve(root, "scripts/lib/markdown-planning-core-adapter.mjs"));
  console.log("CORE_COMPAT_ADAPTER_SOURCE_RESOLUTION_PASSED");

  const proofZip = resolve(temp, "proof.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", proofZip], { cwd: root, stdio: "inherit" });
  const archiveRoot = resolve(temp, "archive");
  execFileSync("unzip", ["-q", proofZip, "-d", archiveRoot]);
  const archivePlugin = resolve(archiveRoot, "yeeflow-app-builder-plugin");
  execFileSync(process.execPath, [resolve(root, "scripts/validate-markdown-planning-core-adapter.mjs"), "--adapter", resolve(archivePlugin, "scripts/lib/markdown-planning-core-adapter.mjs")], { cwd: root, stdio: "inherit" });
  await verifyAdapter(resolve(archivePlugin, "scripts/lib/markdown-planning-core-adapter.mjs"));
  console.log("CORE_COMPAT_ADAPTER_ARCHIVE_RESOLUTION_PASSED");

  const installedPlugin = resolve(temp, "installed/yeeflow-app-builder-plugin");
  cpSync(distRoot, installedPlugin, { recursive: true });
  execFileSync(process.execPath, [resolve(root, "scripts/validate-markdown-planning-core-adapter.mjs"), "--adapter", resolve(installedPlugin, "scripts/lib/markdown-planning-core-adapter.mjs")], { cwd: root, stdio: "inherit" });
  await verifyAdapter(resolve(installedPlugin, "scripts/lib/markdown-planning-core-adapter.mjs"));
  console.log("CORE_COMPAT_ADAPTER_INSTALLED_RESOLUTION_PASSED");

  const missingArtifact = resolve(temp, "missing-artifact");
  cpSync(distRoot, missingArtifact, { recursive: true });
  renameSync(resolve(missingArtifact, "core"), resolve(missingArtifact, "core-hidden"));
  await expectImportFailure(resolve(missingArtifact, "scripts/lib/markdown-planning-core-adapter.mjs"), "CORE_COMPAT_ADAPTER_ARTIFACT_MISSING");

  const missingExport = resolve(temp, "missing-export");
  cpSync(distRoot, missingExport, { recursive: true });
  writeFileSync(resolve(missingExport, "core/yeeflow-app-builder-core-planning.v0.1.0.mjs"), "export const splitMarkdownTableRow = () => [];\n", "utf8");
  await expectImportFailure(resolve(missingExport, "scripts/lib/markdown-planning-core-adapter.mjs"), "CORE_COMPAT_ADAPTER_EXPORT_MISSING");

  const forbidden = resolve(temp, "forbidden-adapter.mjs");
  writeFileSync(forbidden, `${readFileSync(resolve(root, "scripts/lib/markdown-planning-core-adapter.mjs"), "utf8")}\nimport \"../../packages/app-builder-core-planning/src/markdown-planning-utils.ts\";\n`, "utf8");
  const forbiddenResult = spawnSync(process.execPath, [resolve(root, "scripts/validate-markdown-planning-core-adapter.mjs"), "--adapter", forbidden], { cwd: root, encoding: "utf8" });
  if (forbiddenResult.status === 0 || !`${forbiddenResult.stdout}${forbiddenResult.stderr}`.includes("CORE_COMPAT_ADAPTER_FORBIDDEN_RESOLUTION")) throw new Error("CORE_COMPAT_ADAPTER_FAILURE_GATE_MISSING: Forbidden source resolution was not rejected.");
  console.log("CORE_COMPAT_ADAPTER_FAILURE_GATES_PASSED");

  const historicalAfter = sha256(readFileSync(historicalZip));
  if (historicalAfter !== historicalBefore) throw new Error("CORE_COMPAT_ADAPTER_HISTORICAL_ZIP_CHANGED: Historical Plugin ZIP checksum changed during adapter proof.");
} finally {
  rmSync(temp, { recursive: true, force: true });
}

async function verifyAdapter(adapterPath) {
  const module = await import(`${pathToFileURL(adapterPath).href}?proof=${Date.now()}-${Math.random()}`);
  for (const name of ["splitMarkdownTableRow", "stripMarkdownFencedBlocks"]) if (typeof module[name] !== "function") throw new Error(`CORE_COMPAT_ADAPTER_EXPORT_MISSING: ${name}.`);
  if (module.splitMarkdownTableRow("| A | B |").join("|") !== "A|B") throw new Error("CORE_COMPAT_ADAPTER_SEMANTICS_MISMATCH: splitMarkdownTableRow result differs.");
}
async function expectImportFailure(adapterPath, code) {
  try { await import(`${pathToFileURL(adapterPath).href}?failure=${Date.now()}-${Math.random()}`); }
  catch (error) { if (String(error).includes(code)) return; throw error; }
  throw new Error(`CORE_COMPAT_ADAPTER_FAILURE_GATE_MISSING: ${code}.`);
}
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

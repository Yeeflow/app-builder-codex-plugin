#!/usr/bin/env node
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = json("compatibility/differential-fixtures/core-extraction-wave1-planning-normalization.v0.1.0.json");
const registry = json("compatibility/capability-manifests/core-extraction-proof-envelope-registry.v0.1.0.json");
const historicalZip = resolve(root, "dist/yeeflow-app-builder-plugin-0.9.71.zip");
const expectedHistoricalZip = "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2";
const historicalBefore = sha(readFileSync(historicalZip));
assert.equal(historicalBefore, expectedHistoricalZip, "CORE_EXTRACTION_WAVE1_HISTORICAL_ZIP_CHANGED");
const temp = mkdtempSync(resolve(tmpdir(), "yeeflow-core-wave1-"));
try {
  execFileSync("pnpm", ["run", "typecheck"], { cwd: root, stdio: "inherit" });
  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
  execFileSync(process.execPath, [resolve(root, "scripts/validate-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
  validateTraceability();
  const source = await loadSurface(resolve(root, "scripts/lib"));
  const compiled = await import(moduleUrl(resolve(root, "packages/app-builder-core-planning/lib/markdown-planning-utils.js")));
  await parity("source", source, compiled);
  console.log("CORE_EXTRACTION_WAVE1_SOURCE_PARITY_PASSED");
  const proofZip = resolve(temp, "wave1-proof.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", proofZip], { cwd: root, stdio: "inherit" });
  const archiveRoot = resolve(temp, "archive"); execFileSync("unzip", ["-q", proofZip, "-d", archiveRoot]);
  const archive = await loadSurface(resolve(archiveRoot, "yeeflow-app-builder-plugin/scripts/lib"));
  await parity("archive", archive, archive.core);
  console.log("CORE_EXTRACTION_WAVE1_ARCHIVE_PARITY_PASSED");
  const installedRoot = resolve(temp, "installed/yeeflow-app-builder-plugin"); cpSync(resolve(root, "dist/yeeflow-app-builder-plugin"), installedRoot, { recursive: true });
  const installed = await loadSurface(resolve(installedRoot, "scripts/lib"));
  await parity("installed", installed, installed.core);
  console.log("CORE_EXTRACTION_WAVE1_INSTALLED_PARITY_PASSED");
  await rollbackProof(installedRoot);
  console.log("CORE_EXTRACTION_WAVE1_LEGACY_ROLLBACK_PASSED");
  assert.equal(sha(readFileSync(historicalZip)), historicalBefore, "CORE_EXTRACTION_WAVE1_HISTORICAL_ZIP_CHANGED");
  console.log("CORE_EXTRACTION_WAVE1_DIFFERENTIAL_PARITY_PASSED");
  console.log("CORE_EXTRACTION_WAVE1_SERIALIZATION_IMMUTABILITY_DETERMINISM_PASSED");
  console.log("CORE_EXTRACTION_WAVE1_ROUTING_SCOPE_PASSED");
} finally { rmSync(temp, { recursive: true, force: true }); }

function validateTraceability() {
  const expected = registry.envelopes.filter((item) => item.wave === "Wave 1").flatMap((item) => item.functionIds).sort();
  const actual = fixture.envelopes.flatMap((item) => item.functionIds).sort();
  assert.deepEqual(actual, expected, "CORE_EXTRACTION_WAVE1_TRACEABILITY_INCOMPLETE");
  assert.equal(new Set(actual).size, actual.length, "CORE_EXTRACTION_WAVE1_TRACEABILITY_OVERLAP");
  assert.equal(fixture.envelopes.length, 6, "CORE_EXTRACTION_WAVE1_ENVELOPE_COUNT_INVALID");
}
async function loadSurface(libDirectory) {
  const markdown = await import(moduleUrl(resolve(libDirectory, "markdown-planning-utils.mjs")));
  const placeholder = await import(moduleUrl(resolve(libDirectory, "planning-placeholder-utils.mjs")));
  const localCore = resolve(libDirectory, "../../core/yeeflow-app-builder-core-planning.v0.1.0.mjs");
  const core = await import(moduleUrl(existsSync(localCore) ? localCore : resolve(root, "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-planning.v0.1.0.mjs")));
  return { markdown, placeholder, core };
}
async function parity(surface, actual, core) {
  const legacyMarkdown = await import(moduleUrl(resolve(root, "compatibility/differential-fixtures/core-extraction-wave1-markdown-planning-legacy-baseline.v0.1.0.mjs")));
  const legacyPlaceholder = await import(moduleUrl(resolve(root, "compatibility/differential-fixtures/core-extraction-wave1-planning-placeholder-legacy-baseline.v0.1.0.mjs")));
  for (const fixtureCase of fixture.fixtures) for (const call of fixtureCase.calls) {
    const baseline = invoke(call.module === "markdown" ? legacyMarkdown : legacyPlaceholder, call, legacyMarkdown);
    const shim = invoke(call.module === "markdown" ? actual.markdown : actual.placeholder, call, actual.markdown);
    const projected = invokeCore(core, call);
    assert.equal(stable(shim), stable(baseline), `CORE_EXTRACTION_WAVE1_LEGACY_SHIM_PARITY_MISMATCH: ${surface}:${fixtureCase.id}:${call.function}`);
    assert.equal(stable(projected), stable(baseline), `CORE_EXTRACTION_WAVE1_CORE_PARITY_MISMATCH: ${surface}:${fixtureCase.id}:${call.function}`);
    assert.equal(stable(invoke(call.module === "markdown" ? actual.markdown : actual.placeholder, call, actual.markdown)), stable(shim), `CORE_EXTRACTION_WAVE1_NONDETERMINISM: ${surface}:${fixtureCase.id}:${call.function}`);
  }
  const sourceValue = { label: "**<b>N/A</b>**" }; const before = stable(sourceValue); const projection = core.projectPlanningLabel(sourceValue.label);
  assert.equal(stable(sourceValue), before, `CORE_EXTRACTION_WAVE1_INPUT_MUTATION: ${surface}`);
  assert(Object.isFrozen(projection), `CORE_EXTRACTION_WAVE1_CORE_RESULT_NOT_FROZEN: ${surface}`);
  assert.equal(stable(JSON.parse(JSON.stringify(projection))), stable(projection), `CORE_EXTRACTION_WAVE1_SERIALIZATION_PARITY_MISMATCH: ${surface}`);
  assert.equal(typeof core.projectPlanningLabel, "function", `CORE_EXTRACTION_WAVE1_PUBLIC_FACADE_MISSING: ${surface}`);
}
function invoke(module, call, markdown) { const args = call.args.map((value) => revive(value, markdown)); try { return { kind: "return", value: normalize(module[call.function](...args)) }; } catch (error) { return { kind: "throw", name: error?.constructor?.name || "Error", message: String(error?.message || error) }; } }
function invokeCore(core, call) { if (call.module === "markdown") return invoke(core, call, core); const value = call.args[0]; const projection = core.projectPlanningLabel(value); const field = call.function === "cleanPlanningLabel" ? "cleanLabel" : call.function === "normalizePlanningLabel" ? "normalizedLabel" : "isPlaceholder"; return { kind: "return", value: projection[field] }; }
function revive(value, markdown) { if (!value || typeof value !== "object") return value; if (value.$regex) return new RegExp(value.$regex.source, value.$regex.flags || ""); if (value.$table) return markdown.parseMarkdownTables(value.$table)[0]; if (value.$row) return markdown.parseMarkdownTables(value.$row)[0].rows[0]; if (Array.isArray(value)) return value.map((item) => revive(item, markdown)); return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, revive(item, markdown)])); }
async function rollbackProof(installedRoot) {
  const rollbackRoot = resolve(temp, "rollback/yeeflow-app-builder-plugin"); cpSync(installedRoot, rollbackRoot, { recursive: true });
  for (const [target, baseline] of [["markdown-planning-utils.mjs", "core-extraction-wave1-markdown-planning-legacy-baseline.v0.1.0.mjs"], ["planning-placeholder-utils.mjs", "core-extraction-wave1-planning-placeholder-legacy-baseline.v0.1.0.mjs"]]) writeFileSync(resolve(rollbackRoot, "scripts/lib", target), readFileSync(resolve(root, "compatibility/differential-fixtures", baseline), "utf8"));
  const rollback = await loadSurface(resolve(rollbackRoot, "scripts/lib"));
  const legacyMarkdown = await import(moduleUrl(resolve(root, "compatibility/differential-fixtures/core-extraction-wave1-markdown-planning-legacy-baseline.v0.1.0.mjs")));
  const legacyPlaceholder = await import(moduleUrl(resolve(root, "compatibility/differential-fixtures/core-extraction-wave1-planning-placeholder-legacy-baseline.v0.1.0.mjs")));
  for (const fixtureCase of fixture.fixtures) for (const call of fixtureCase.calls) assert.equal(stable(invoke(call.module === "markdown" ? rollback.markdown : rollback.placeholder, call, rollback.markdown)), stable(invoke(call.module === "markdown" ? legacyMarkdown : legacyPlaceholder, call, legacyMarkdown)), `CORE_EXTRACTION_WAVE1_ROLLBACK_MISMATCH: ${fixtureCase.id}:${call.function}`);
}
function normalize(value) { if (Array.isArray(value)) return value.map(normalize); if (!value || typeof value !== "object") return value; return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])])); }
function stable(value) { return JSON.stringify(value); }
function moduleUrl(path) { return `${pathToFileURL(path).href}?wave1=${Date.now()}-${Math.random()}`; }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function json(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }

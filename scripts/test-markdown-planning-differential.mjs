#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corpusPath = resolve(root, "compatibility/differential-fixtures/markdown-planning-utils.v0.9.71.json");
const legacyPath = resolve(root, "scripts/lib/markdown-planning-utils.mjs");
const corePath = resolve(root, "packages/app-builder-core-planning/lib/markdown-planning-utils.js");
if (!existsSync(corePath)) fail("MARKDOWN_PLANNING_DIFFERENTIAL_CORE_MODULE_MISSING", "Compiled Core markdown planning module is missing; run pnpm run typecheck first.");
const corpus = JSON.parse(readFileSync(corpusPath, "utf8"));
const legacy = await load(legacyPath, "MARKDOWN_PLANNING_DIFFERENTIAL_LEGACY_LOAD_FAILED");
const core = await load(corePath, "MARKDOWN_PLANNING_DIFFERENTIAL_CORE_LOAD_FAILED");
const findings = [];
let callCount = 0;
for (const fixture of corpus.fixtures) {
  for (const call of fixture.calls) {
    callCount += 1;
    const args = call.args.map(reviveArgument);
    const legacyResult = invoke(legacy, call.function, args);
    const coreResult = invoke(core, call.function, args);
    if (stable(legacyResult) !== stable(coreResult)) findings.push({ code: "MARKDOWN_PLANNING_DIFFERENTIAL_MISMATCH", fixtureId: fixture.id, function: call.function, args: normalized(args), legacy: legacyResult, core: coreResult, message: "Legacy and Core observable results differ." });
  }
}
if (findings.length) {
  console.error(JSON.stringify({ status: "failed", findings }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: "passed", code: "MARKDOWN_PLANNING_DIFFERENTIAL_PARITY_PASSED", fixtureCount: corpus.fixtures.length, callCount }, null, 2));

async function load(path, code) {
  try { return await import(pathToFileURL(path).href); } catch (error) { fail(code, `Could not load module: ${error instanceof Error ? error.message : String(error)}`); }
}
function invoke(module, name, args) {
  try { return { kind: "return", value: normalized(module[name](...args)) }; } catch (error) { return { kind: "throw", name: error?.constructor?.name || "Error", message: error instanceof Error ? error.message : String(error) }; }
}
function reviveArgument(value) {
  if (Array.isArray(value)) return value.map(reviveArgument);
  if (!value || typeof value !== "object") return value;
  if (value.$regex) return new RegExp(value.$regex.source, value.$regex.flags || "");
  if (value.$table || value.$row) return reviveArgument(value.$table || value.$row);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, reviveArgument(item)]));
}
function normalized(value) {
  if (Array.isArray(value)) return value.map(normalized);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalized(value[key])]));
}
function stable(value) { return JSON.stringify(value); }
function fail(code, message) { console.error(JSON.stringify({ status: "failed", findings: [{ code, message }] }, null, 2)); process.exit(1); }

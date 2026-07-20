#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corpusPath = resolve(root, "compatibility/differential-fixtures/markdown-planning-utils.v0.9.71.json");
const legacyPath = resolve(root, "scripts/lib/markdown-planning-utils.mjs");
const corePath = resolve(root, "packages/app-builder-core-planning/lib/markdown-planning-utils.js");
const adapterPath = resolve(root, "scripts/lib/markdown-planning-core-adapter.mjs");
if (!existsSync(corePath)) throw new Error("CORE_COMPAT_ADAPTER_CORE_MODULE_MISSING: Run pnpm run typecheck first.");
execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
const corpus = JSON.parse(readFileSync(corpusPath, "utf8"));
const legacy = await import(pathToFileURL(legacyPath).href);
const core = await import(pathToFileURL(corePath).href);
const adapter = await import(pathToFileURL(adapterPath).href);
let callCount = 0;
for (const fixture of corpus.fixtures) {
  for (const call of fixture.calls) {
    callCount += 1;
    const args = call.args.map(revive);
    const expected = invoke(legacy, call.function, args);
    for (const [name, module] of [["core", core], ["adapter", adapter]]) {
      const actual = invoke(module, call.function, args);
      if (stable(expected) !== stable(actual)) throw new Error(`CORE_COMPAT_ADAPTER_PARITY_MISMATCH: ${fixture.id} ${call.function} ${name}.`);
    }
  }
}
console.log(`CORE_COMPAT_ADAPTER_PARITY_PASSED fixtures=${corpus.fixtures.length} calls=${callCount} apiCount=${Object.keys(adapter).length}`);

function invoke(module, name, args) {
  try { return { kind: "return", value: normalized(module[name](...args)) }; }
  catch (error) { return { kind: "throw", name: error?.constructor?.name || "Error", message: error instanceof Error ? error.message : String(error) }; }
}
function revive(value) {
  if (Array.isArray(value)) return value.map(revive);
  if (!value || typeof value !== "object") return value;
  if (value.$regex) return new RegExp(value.$regex.source, value.$regex.flags || "");
  if (value.$table || value.$row) return revive(value.$table || value.$row);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, revive(item)]));
}
function normalized(value) {
  if (Array.isArray(value)) return value.map(normalized);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalized(value[key])]));
}
function stable(value) { return JSON.stringify(value); }

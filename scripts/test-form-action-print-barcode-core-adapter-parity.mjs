#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validatorPath = resolve(root, "scripts/validate-form-action-print-barcode-plan.mjs");
const legacyParserPath = resolve(root, "scripts/lib/markdown-planning-utils.mjs");
const compiledCorePath = resolve(root, "packages/app-builder-core-planning/lib/markdown-planning-utils.js");
const fixturePath = resolve(root, "compatibility/differential-fixtures/form-action-print-barcode-plan.v0.9.71.json");
const source = readFileSync(validatorPath, "utf8");
const importLine = 'import { parseMarkdownTables } from "./lib/markdown-planning-core-adapter.mjs";';
if (!source.includes(importLine) || (source.match(/parseMarkdownTables/g) || []).length !== 2) throw new Error("CORE_COMPAT_ADAPTER_PRINT_BARCODE_API_SCOPE_INVALID: Validator must import and call only parseMarkdownTables.");
console.log("CORE_COMPAT_ADAPTER_PRINT_BARCODE_API_SCOPE_VALID");

execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
const fixtures = JSON.parse(readFileSync(fixturePath, "utf8")).fixtures;
const temporaryRoot = mkdtempSync(resolve(tmpdir(), "yeeflow-print-barcode-parity-"));
try {
  const legacyValidator = writeVariant("legacy", pathToFileURL(legacyParserPath).href);
  const coreValidator = writeVariant("core", pathToFileURL(compiledCorePath).href);
  let callCount = 0;
  for (const fixture of fixtures) {
    const planPath = resolve(temporaryRoot, `${fixture.id}.md`);
    writeFileSync(planPath, fixture.plan, "utf8");
    const results = {
      legacy: execute(legacyValidator, planPath),
      core: execute(coreValidator, planPath),
      adapter: execute(validatorPath, planPath),
    };
    callCount += 3;
    const expectedCodes = [...fixture.expectedCodes].sort();
    for (const [name, result] of Object.entries(results)) {
      if (result.status !== fixture.expectedExitStatus) throw new Error(`CORE_COMPAT_ADAPTER_PRINT_BARCODE_EXIT_STATUS_MISMATCH: ${fixture.id} ${name}.`);
      if (stable(result.codes) !== stable(expectedCodes)) throw new Error(`CORE_COMPAT_ADAPTER_PRINT_BARCODE_CODES_MISMATCH: ${fixture.id} ${name}: ${JSON.stringify(result.codes)}.`);
    }
    if (stable(results.legacy) !== stable(results.core) || stable(results.legacy) !== stable(results.adapter)) throw new Error(`CORE_COMPAT_ADAPTER_PRINT_BARCODE_OUTPUT_MISMATCH: ${fixture.id}.`);
  }
  execFileSync(process.execPath, [resolve(root, "scripts/test-form-action-print-barcode-gates.mjs")], { cwd: root, stdio: "inherit" });
  console.log(`CORE_COMPAT_ADAPTER_PRINT_BARCODE_VALIDATOR_PARITY_PASSED fixtures=${fixtures.length} calls=${callCount}`);
  console.log("CORE_COMPAT_ADAPTER_PRINT_BARCODE_REGRESSION_PASSED");
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

function writeVariant(name, parserUrl) {
  const path = resolve(temporaryRoot, `${name}-validator.mjs`);
  writeFileSync(path, source.replace(importLine, `import { parseMarkdownTables } from ${JSON.stringify(parserUrl)};`), "utf8");
  return realpathSync(path);
}
function execute(script, planPath) {
  const result = spawnSync(process.execPath, [script, "--plan", planPath], { cwd: root, encoding: "utf8" });
  let report;
  try { report = JSON.parse(result.stdout); } catch { throw new Error(`CORE_COMPAT_ADAPTER_PRINT_BARCODE_OUTPUT_INVALID: ${script}: ${result.stderr || result.stdout}`); }
  return {
    status: result.status,
    codes: report.findings.map((finding) => finding.code).sort(),
    output: normalized(report),
    error: result.stderr.trim(),
  };
}
function normalized(value) {
  if (Array.isArray(value)) return value.map(normalized);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalized(value[key])]));
}
function stable(value) { return JSON.stringify(value); }

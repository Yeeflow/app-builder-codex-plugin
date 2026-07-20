#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validatorPath = resolve(root, "scripts/validate-app-plan-resource-order.mjs");
const legacyParserPath = resolve(root, "scripts/lib/markdown-planning-utils.mjs");
const compiledCorePath = resolve(root, "packages/app-builder-core-planning/lib/markdown-planning-utils.js");
const fixturePath = resolve(root, "compatibility/differential-fixtures/app-plan-resource-order.v0.9.71.json");
const source = readFileSync(validatorPath, "utf8");
const parserImport = `import {
  extractMarkdownSubsection,
  findMarkdownTable,
  hasTechnicalPlaceholderIdContext,
  markdownRowValue,
  parseMarkdownTables,
  positivePlanningText,
} from "./lib/markdown-planning-core-adapter.mjs";`;
const requiredApi = ["extractMarkdownSubsection", "findMarkdownTable", "hasTechnicalPlaceholderIdContext", "markdownRowValue", "parseMarkdownTables", "positivePlanningText"];
if (!source.includes(parserImport) || !requiredApi.every((name) => source.includes(name)) || source.includes("markdown-planning-utils.mjs")) throw new Error("CORE_COMPAT_ADAPTER_RESOURCE_ORDER_API_SCOPE_INVALID: Validator must import only the approved adapter API.");
console.log("CORE_COMPAT_ADAPTER_RESOURCE_ORDER_API_SCOPE_VALID");

execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
const corpus = JSON.parse(readFileSync(fixturePath, "utf8"));
const basePlan = readFileSync(resolve(root, corpus.basePlanPath), "utf8");
const temporaryRoot = mkdtempSync(resolve(tmpdir(), "yeeflow-resource-order-parity-"));
try {
  const legacyValidator = writeVariant("legacy", pathToFileURL(legacyParserPath).href);
  const coreValidator = writeVariant("core", pathToFileURL(compiledCorePath).href);
  let callCount = 0;
  for (const fixture of corpus.fixtures) {
    const planPath = resolve(temporaryRoot, `${fixture.id}.md`);
    writeFileSync(planPath, applyOperations(basePlan, fixture.operations), "utf8");
    const results = {
      legacy: execute(legacyValidator, planPath),
      core: execute(coreValidator, planPath),
      adapter: execute(validatorPath, planPath),
    };
    callCount += 3;
    const expectedCodes = [...fixture.expectedCodes].sort();
    for (const [name, result] of Object.entries(results)) {
      if (result.status !== fixture.expectedExitStatus) throw new Error(`CORE_COMPAT_ADAPTER_RESOURCE_ORDER_EXIT_STATUS_MISMATCH: ${fixture.id} ${name}.`);
      if (stable(result.codes) !== stable(expectedCodes)) throw new Error(`CORE_COMPAT_ADAPTER_RESOURCE_ORDER_CODES_MISMATCH: ${fixture.id} ${name}: ${JSON.stringify(result.codes)}.`);
    }
    if (stable(results.legacy) !== stable(results.core) || stable(results.legacy) !== stable(results.adapter)) throw new Error(`CORE_COMPAT_ADAPTER_RESOURCE_ORDER_OUTPUT_MISMATCH: ${fixture.id}.`);
  }
  for (const script of [
    "scripts/test-app-plan-schema-validator-consistency-gates.mjs",
    "scripts/test-app-plan-dashboard-pages-plan-gates.mjs",
    "scripts/test-planning-markdown-template-standardization-gates.mjs",
    "scripts/test-functional-specification-and-app-plan-gates.mjs",
    "scripts/test-data-list-form-layout-template-gates.mjs",
  ]) execFileSync(process.execPath, [resolve(root, script)], { cwd: root, stdio: "inherit" });
  console.log("CORE_COMPAT_ADAPTER_RESOURCE_ORDER_REGRESSION_PASSED");
  execFileSync(process.execPath, [resolve(root, "scripts/test-validator-parsing-hardening-gates.mjs")], { cwd: root, stdio: "inherit" });
  console.log("CORE_COMPAT_ADAPTER_RESOURCE_ORDER_PARSING_HARDENING_PASSED");
  console.log(`CORE_COMPAT_ADAPTER_RESOURCE_ORDER_PARITY_PASSED fixtures=${corpus.fixtures.length} calls=${callCount}`);
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

function writeVariant(name, parserUrl) {
  const targetPath = resolve(temporaryRoot, `${name}-validator.mjs`);
  const variant = source.replace(parserImport, `import { extractMarkdownSubsection, findMarkdownTable, hasTechnicalPlaceholderIdContext, markdownRowValue, parseMarkdownTables, positivePlanningText } from ${JSON.stringify(parserUrl)};`);
  writeFileSync(targetPath, variant, "utf8");
  return realpathSync(targetPath);
}
function applyOperations(plan, operations) {
  return operations.reduce((result, operation) => {
    if (operation.type === "replace") {
      if (!result.includes(operation.from)) throw new Error(`CORE_COMPAT_ADAPTER_RESOURCE_ORDER_FIXTURE_INVALID: Missing replacement text for ${operation.from}.`);
      return result.replace(operation.from, operation.to);
    }
    if (operation.type === "insert-before") {
      if (!result.includes(operation.marker)) throw new Error(`CORE_COMPAT_ADAPTER_RESOURCE_ORDER_FIXTURE_INVALID: Missing insertion marker ${operation.marker}.`);
      return result.replace(operation.marker, `${operation.text}${operation.marker}`);
    }
    throw new Error(`CORE_COMPAT_ADAPTER_RESOURCE_ORDER_FIXTURE_INVALID: Unsupported operation ${operation.type}.`);
  }, plan);
}
function execute(scriptPath, planPath) {
  const result = spawnSync(process.execPath, [scriptPath, planPath, "--json"], { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  let report;
  try { report = JSON.parse(result.stdout); } catch { throw new Error(`CORE_COMPAT_ADAPTER_RESOURCE_ORDER_OUTPUT_INVALID: ${scriptPath}: ${result.stderr || result.stdout}`); }
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
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalized(value[key]) ]));
}
function stable(value) { return JSON.stringify(value); }

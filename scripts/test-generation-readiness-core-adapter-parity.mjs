#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validatorPath = resolve(root, "scripts/validate-generation-readiness-review.mjs");
const legacyParserPath = resolve(root, "scripts/lib/markdown-planning-utils.mjs");
const compiledCorePath = resolve(root, "packages/app-builder-core-planning/lib/markdown-planning-utils.js");
const fixturePath = resolve(root, "compatibility/differential-fixtures/generation-readiness-review.v0.9.71.json");
const source = readFileSync(validatorPath, "utf8");
const parserImport = `import {
  findMarkdownTable,
  markdownRowValue,
  positivePlanningText,
  splitMarkdownTableRow,
  stripMarkdownFencedBlocks,
} from "./lib/markdown-planning-core-adapter.mjs";`;
const requiredApi = ["findMarkdownTable", "markdownRowValue", "positivePlanningText", "splitMarkdownTableRow", "stripMarkdownFencedBlocks"];
const dependencyImports = [
  ["validate-form-action-query-data-plan.mjs", "validateFormActionQueryDataPlan"],
  ["validate-workflow-query-data-plan.mjs", "validateWorkflowQueryDataPlan"],
  ["validate-workflow-loop-plan.mjs", "validateWorkflowLoopPlan"],
  ["validate-workflow-set-data-list-plan.mjs", "validateWorkflowSetDataListPlan"],
  ["validate-set-variable-plan.mjs", "validateSetVariablePlan"],
  ["validate-form-action-set-data-list-plan.mjs", "validateFormActionSetDataListPlan"],
  ["validate-form-action-open-resource-plan.mjs", "validateFormActionOpenResourcePlan"],
  ["validate-form-action-print-barcode-plan.mjs", "validateFormActionPrintBarcodePlan"],
];
if (!source.includes(parserImport) || !requiredApi.every((name) => source.includes(name)) || source.includes("markdown-planning-utils.mjs")) throw new Error("CORE_COMPAT_ADAPTER_GENERATION_READINESS_API_SCOPE_INVALID: Validator must import only the approved adapter API.");
console.log("CORE_COMPAT_ADAPTER_GENERATION_READINESS_API_SCOPE_VALID");

execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
const corpus = JSON.parse(readFileSync(fixturePath, "utf8"));
const basePlan = readFileSync(resolve(root, corpus.basePlanPath), "utf8");
const temporaryRoot = mkdtempSync(resolve(tmpdir(), "yeeflow-generation-readiness-parity-"));
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
      if (result.status !== fixture.expectedExitStatus) throw new Error(`CORE_COMPAT_ADAPTER_GENERATION_READINESS_EXIT_STATUS_MISMATCH: ${fixture.id} ${name}.`);
      if (stable(result.codes) !== stable(expectedCodes)) throw new Error(`CORE_COMPAT_ADAPTER_GENERATION_READINESS_CODES_MISMATCH: ${fixture.id} ${name}: ${JSON.stringify(result.codes)}.`);
    }
    if (stable(results.legacy) !== stable(results.core) || stable(results.legacy) !== stable(results.adapter)) throw new Error(`CORE_COMPAT_ADAPTER_GENERATION_READINESS_OUTPUT_MISMATCH: ${fixture.id}.`);
  }
  for (const script of [
    "scripts/test-generation-readiness-markdown-parser-gates.mjs",
    "scripts/test-clarification-readiness-traceability-gates.mjs",
    "scripts/test-app-plan-schema-validator-consistency-gates.mjs",
    "scripts/test-app-plan-control-action-property-gates.mjs",
    "scripts/test-business-clarification-and-app-plan-precision-gates.mjs",
    "scripts/test-planning-default-approval-and-exact-type-gates.mjs",
  ]) execFileSync(process.execPath, [resolve(root, script)], { cwd: root, stdio: "inherit" });
  console.log("CORE_COMPAT_ADAPTER_GENERATION_READINESS_REGRESSION_PASSED");
  execFileSync(process.execPath, [resolve(root, "scripts/test-validator-parsing-hardening-gates.mjs")], { cwd: root, stdio: "inherit" });
  console.log("CORE_COMPAT_ADAPTER_GENERATION_READINESS_PARSING_HARDENING_PASSED");
  console.log(`CORE_COMPAT_ADAPTER_GENERATION_READINESS_PARITY_PASSED fixtures=${corpus.fixtures.length} calls=${callCount}`);
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

function writeVariant(name, parserUrl) {
  const targetPath = resolve(temporaryRoot, `${name}-validator.mjs`);
  let variant = source.replace(parserImport, `import { findMarkdownTable, markdownRowValue, positivePlanningText, splitMarkdownTableRow, stripMarkdownFencedBlocks } from ${JSON.stringify(parserUrl)};`);
  for (const [file, exported] of dependencyImports) {
    const sourceImport = `import { ${exported} } from "./${file}";`;
    const replacement = `import { ${exported} } from ${JSON.stringify(pathToFileURL(resolve(root, "scripts", file)).href)};`;
    if (!variant.includes(sourceImport)) throw new Error(`CORE_COMPAT_ADAPTER_GENERATION_READINESS_VARIANT_IMPORT_MISSING: ${file}.`);
    variant = variant.replace(sourceImport, replacement);
  }
  writeFileSync(targetPath, variant, "utf8");
  return realpathSync(targetPath);
}
function applyOperations(plan, operations) {
  return operations.reduce((result, operation) => {
    if (operation.type === "insert-before") {
      if (!result.includes(operation.marker)) throw new Error(`CORE_COMPAT_ADAPTER_GENERATION_READINESS_FIXTURE_INVALID: Missing insertion marker ${operation.marker}.`);
      return result.replace(operation.marker, `${operation.text}${operation.marker}`);
    }
    if (operation.type === "remove-section") {
      const start = result.indexOf(operation.start);
      const end = result.indexOf(operation.end, start);
      if (start < 0 || end < 0) throw new Error(`CORE_COMPAT_ADAPTER_GENERATION_READINESS_FIXTURE_INVALID: Missing section bounds for ${operation.start}.`);
      return `${result.slice(0, start)}${result.slice(end)}`;
    }
    throw new Error(`CORE_COMPAT_ADAPTER_GENERATION_READINESS_FIXTURE_INVALID: Unsupported operation ${operation.type}.`);
  }, plan);
}
function execute(scriptPath, planPath) {
  const result = spawnSync(process.execPath, [scriptPath, "--plan", planPath, "--json"], { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  let report;
  try { report = JSON.parse(result.stdout); } catch { throw new Error(`CORE_COMPAT_ADAPTER_GENERATION_READINESS_OUTPUT_INVALID: ${scriptPath}: ${result.stderr || result.stdout}`); }
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

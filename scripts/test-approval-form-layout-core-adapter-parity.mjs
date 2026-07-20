#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validatorPath = resolve(root, "scripts/validate-approval-form-layout-template.mjs");
const legacyParserPath = resolve(root, "scripts/lib/markdown-planning-utils.mjs");
const compiledCorePath = resolve(root, "packages/app-builder-core-planning/lib/markdown-planning-utils.js");
const yapkUtilityPath = resolve(root, "scripts/lib/yapk-decode-utils.mjs");
const registryPath = resolve(root, "docs/reference/approval-form-layout-templates.json");
const fixturePath = resolve(root, "compatibility/differential-fixtures/approval-form-layout-template.v0.9.71.json");
const source = readFileSync(validatorPath, "utf8");
const parserImport = `import {
  extractMarkdownSubsection,
  findMarkdownTable,
  markdownRowValue,
} from "./lib/markdown-planning-core-adapter.mjs";`;
const yapkImport = 'import { asArray, isObject, parseJsonMaybe, quoteLargeJsonIntegers, readDecodedYapk } from "./lib/yapk-decode-utils.mjs";';
const requiredApi = ["extractMarkdownSubsection", "findMarkdownTable", "markdownRowValue"];
if (!source.includes(parserImport) || !requiredApi.every((name) => source.includes(name)) || source.includes("markdown-planning-utils.mjs")) throw new Error("CORE_COMPAT_ADAPTER_APPROVAL_LAYOUT_API_SCOPE_INVALID: Validator must import only the approved adapter API.");
console.log("CORE_COMPAT_ADAPTER_APPROVAL_LAYOUT_API_SCOPE_VALID");

execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
const fixtures = JSON.parse(readFileSync(fixturePath, "utf8")).fixtures;
const temporaryRoot = mkdtempSync(resolve(tmpdir(), "yeeflow-approval-layout-parity-"));
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
      if (result.status !== fixture.expectedExitStatus) throw new Error(`CORE_COMPAT_ADAPTER_APPROVAL_LAYOUT_EXIT_STATUS_MISMATCH: ${fixture.id} ${name}.`);
      if (stable(result.codes) !== stable(expectedCodes)) throw new Error(`CORE_COMPAT_ADAPTER_APPROVAL_LAYOUT_CODES_MISMATCH: ${fixture.id} ${name}: ${JSON.stringify(result.codes)}.`);
    }
    if (stable(results.legacy) !== stable(results.core) || stable(results.legacy) !== stable(results.adapter)) throw new Error(`CORE_COMPAT_ADAPTER_APPROVAL_LAYOUT_OUTPUT_MISMATCH: ${fixture.id}.`);
  }
  execFileSync(process.execPath, [resolve(root, "scripts/test-approval-form-layout-template-gates.mjs")], { cwd: root, stdio: "inherit" });
  console.log("CORE_COMPAT_ADAPTER_APPROVAL_LAYOUT_REGRESSION_PASSED");
  execFileSync(process.execPath, [resolve(root, "scripts/test-validator-parsing-hardening-gates.mjs")], { cwd: root, stdio: "inherit" });
  console.log("CORE_COMPAT_ADAPTER_APPROVAL_LAYOUT_PARSING_HARDENING_PASSED");
  console.log(`CORE_COMPAT_ADAPTER_APPROVAL_LAYOUT_PARITY_PASSED fixtures=${fixtures.length} calls=${callCount}`);
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

function writeVariant(name, parserUrl) {
  const targetPath = resolve(temporaryRoot, `${name}-validator.mjs`);
  const variant = source
    .replace(parserImport, `import { extractMarkdownSubsection, findMarkdownTable, markdownRowValue } from ${JSON.stringify(parserUrl)};`)
    .replace(yapkImport, `import { asArray, isObject, parseJsonMaybe, quoteLargeJsonIntegers, readDecodedYapk } from ${JSON.stringify(pathToFileURL(yapkUtilityPath).href)};`);
  writeFileSync(targetPath, variant, "utf8");
  return realpathSync(targetPath);
}
function execute(scriptPath, planPath) {
  const result = spawnSync(process.execPath, [scriptPath, "--registry", registryPath, "--plan", planPath], { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  let report;
  try { report = JSON.parse(result.stdout); } catch { throw new Error(`CORE_COMPAT_ADAPTER_APPROVAL_LAYOUT_OUTPUT_INVALID: ${scriptPath}: ${result.stderr || result.stdout}`); }
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

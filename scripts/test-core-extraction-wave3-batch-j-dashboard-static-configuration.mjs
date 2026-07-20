#!/usr/bin/env node
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temp = mkdtempSync(resolve(tmpdir(), "yeeflow-wave3-batch-j-"));
const corpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/core-extraction-wave3-batch-j-dashboard-static-configuration.v0.1.0.json"), "utf8"));
try {
  const source = await verify(root, "source");
  const repeat = await verify(root, "repeat");
  assert.deepEqual(source, repeat, "CORE_EXTRACTION_WAVE3_BATCH_J_NONDETERMINISM");
  assert.deepEqual(source.materialized, await materialize(rollbackSurface(resolve(temp, "rollback")), "rollback"), "CORE_EXTRACTION_WAVE3_BATCH_J_LEGACY_ROLLBACK_DIFFERENTIAL");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_J_SOURCE_PARITY_PASSED");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_J_MATERIALIZER_PARITY_PASSED");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_J_LEGACY_ROLLBACK_PASSED");
  const zip = resolve(temp, "official.zip"); execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", zip], { cwd: root, stdio: "pipe" });
  const archive = resolve(temp, "archive"); mkdirSync(archive); execFileSync("unzip", ["-q", zip, "-d", archive]);
  assert.deepEqual(await verify(resolve(archive, "yeeflow-app-builder-plugin"), "archive"), source); console.log("CORE_EXTRACTION_WAVE3_BATCH_J_ARCHIVE_PARITY_PASSED");
  const installed = resolve(temp, "installed/yeeflow-app-builder-plugin"); cpSync(resolve(root, "dist/yeeflow-app-builder-plugin"), installed, { recursive: true });
  assert.deepEqual(await verify(installed, "installed"), source); console.log("CORE_EXTRACTION_WAVE3_BATCH_J_INSTALLED_PARITY_PASSED");
  console.log(`CORE_EXTRACTION_WAVE3_BATCH_J_DASHBOARD_STATIC_CONFIGURATION_CORPUS_PASSED cases=${corpus.caseCount}`);
  console.log("CORE_EXTRACTION_WAVE3_BATCH_J_SERIALIZATION_IMMUTABILITY_DETERMINISM_PASSED");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_J_SCOPE_AND_LEAKAGE_GATES_PASSED");
} finally { rmSync(temp, { recursive: true, force: true }); }

async function verify(surface, label) {
  const core = await import(url(corePath(surface)));
  assert.equal(typeof core.projectDashboardStaticConfiguration, "function", `CORE_EXTRACTION_WAVE3_BATCH_J_FACADE_MISSING:${label}`);
  const output = corpus.cases.map((entry) => {
    const input = structuredClone(entry.input); const before = structuredClone(input); const result = core.projectDashboardStaticConfiguration(input);
    assert.deepEqual(result, entry.expected, `CORE_EXTRACTION_WAVE3_BATCH_J_CORPUS:${label}:${entry.id}`); assert.deepEqual(input, before, `CORE_EXTRACTION_WAVE3_BATCH_J_INPUT_MUTATION:${label}:${entry.id}`);
    assert(Object.isFrozen(result) && Object.isFrozen(result.filters), `CORE_EXTRACTION_WAVE3_BATCH_J_NOT_FROZEN:${label}:${entry.id}`); assert.deepEqual(JSON.parse(JSON.stringify(result)), result); return result;
  });
  assert.equal(core.projectDashboardStaticConfiguration({ kind: "is-date-like-analytics-field", template: { mutable: true }, resource: { id: "host" } }).isDateLike, false, `CORE_EXTRACTION_WAVE3_BATCH_J_HOST_LEAK:${label}`);
  const implementation = readFileSync(resolve(surface === root ? root : surface, surface === root ? "packages/app-builder-core-materializer/src/internal/dashboard-static-configuration.ts" : "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"), "utf8");
  for (const forbidden of ["node:fs", "node:path", "node:crypto", "WeakMap", "fetch(", "process."]) assert(!implementation.includes(forbidden), `CORE_EXTRACTION_WAVE3_BATCH_J_CORE_LEAK:${forbidden}`);
  return { output, materialized: await materialize(surface, label) };
}
async function materialize(surface, label) {
  const work = resolve(temp, `materialize-${label}`); mkdirSync(work, { recursive: true }); const spec = resolve(work, "functional-specification.md"); const plan = resolve(work, "yeeflow-app-plan.md"); const out = resolve(work, "out");
  writeFileSync(spec, "# Functional Specification: Dashboard Static Configuration\n\nBusiness defaults approval status: user-default-approved-for-generation.\n"); writeFileSync(plan, planText());
  const module = await import(url(resolve(surface, "scripts/materialize-full-app-generated-final.mjs"))); const report = module.materializeFullAppGeneratedFinal({ cwd: work, functionalSpec: spec, appPlan: plan, outDir: out, allowFixtureApiIdsForTests: true });
  assert.equal(report.status, "pass", JSON.stringify(report.findings)); return normalize(JSON.parse(readFileSync(report.outputs.decodedResource, "utf8")));
}
function rollbackSurface(target) {
  cpSync(resolve(root, "scripts"), resolve(target, "scripts"), { recursive: true }); cpSync(resolve(root, "docs/reference"), resolve(target, "docs/reference"), { recursive: true }); cpSync(resolve(root, "dist/yeeflow-app-builder-plugin/core"), resolve(target, "core"), { recursive: true });
  const path = resolve(target, "scripts/materialize-full-app-generated-final.mjs"); let source = readFileSync(path, "utf8");
  source = source.replace("  projectDashboardStaticConfiguration as coreProjectDashboardStaticConfiguration,\n", "").replace("  return coreProjectDashboardStaticConfiguration(Object.freeze({ kind: \"normalize-dashboard-filters\", filters: Array.isArray(filters) ? filters : [] })).filters;", "  return [];").replace("  return coreProjectDashboardStaticConfiguration(Object.freeze({ kind: \"is-date-like-analytics-field\", field: Object.freeze({ fieldName: field?.fieldName, FieldName: field?.FieldName, displayName: field?.displayName, DisplayName: field?.DisplayName, fieldType: field?.fieldType, FieldType: field?.FieldType, controlType: field?.controlType, Type: field?.Type }) })).isDateLike;", "  return /date|datetime|time|created|modified|period|month|week|year/i.test(`${field?.fieldName || field?.FieldName || \"\"} ${field?.displayName || field?.DisplayName || \"\"} ${field?.fieldType || field?.FieldType || \"\"} ${field?.controlType || field?.Type || \"\"}`);");
  assert(!source.includes("coreProjectDashboardStaticConfiguration")); writeFileSync(path, source); return target;
}
function corePath(surface) { return surface === root ? resolve(root, "packages/app-builder-core-materializer/lib/index.js") : resolve(surface, "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"); }
function url(path) { return `${pathToFileURL(path).href}?wave3j=${Date.now()}-${Math.random()}`; }
function normalize(value) { return JSON.parse(JSON.stringify(value).replace(/[0-9a-f]{8}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{12}/giu, "<uuid>")); }
function planText() { return `# Yeeflow App Plan: Dashboard Static Configuration\n\n## Plan Status\n\n- Business defaults approval status: user-default-approved-for-generation.\n\n## 4. Data Lists and Document Libraries Plan\n\n### 4.1 Operations Records\n\n| Field Label | Field Name | Field Type | Control Type |\n| --- | --- | --- | --- |\n| Title | Title | Text | input |\n| Created Date | CreatedDate | Datetime | datepicker |\n\n## 14. Dashboard Pages Plan\n\n### 14.1 Operations Dashboard\n\n#### Dashboard Sections\n\n| Section Name | Data Source | Selected Record Display Control |\n| --- | --- | --- |\n| Operations | Operations Records | collection_control_grid_table |\n\n#### Data Analytics Template Selection\n\n| Dashboard Page | Analytics Region | Source Resource | Business Question | Selected Data Analytics Template | Grouping Field | Value Field |\n| --- | --- | --- | --- | --- | --- | --- |\n| Operations Dashboard | Monthly Operations | Operations Records | Operations by month | data_analytics_line_chart_with_title | Created Date | ListDataID |\n`; }

#!/usr/bin/env node
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-core-wave3c-"));
const corpus = json("compatibility/differential-fixtures/core-extraction-wave3-batch-c-data-list-sublist-static-configuration.v0.1.0.json");
const legacy = await import(moduleUrl(resolve(root, "compatibility/differential-fixtures/core-extraction-wave3-batch-c-data-list-sublist-static-configuration-legacy-baseline.v0.1.0.mjs")));

try {
  const rollbackRoot = createLegacyRollbackSurface(resolve(temporary, "rollback"));
  const source = await verifySurface(root, "source");
  const second = await verifySurface(root, "source-second");
  assert.deepEqual(source, second, "CORE_EXTRACTION_WAVE3_BATCH_C_NONDETERMINISM");
  const rollback = await materialize(rollbackRoot, "rollback");
  assert.deepEqual(source.materialized, rollback, "CORE_EXTRACTION_WAVE3_BATCH_C_LEGACY_ROLLBACK_DIFFERENTIAL");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_C_SOURCE_PARITY_PASSED");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_C_MATERIALIZER_PARITY_PASSED");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_C_LEGACY_ROLLBACK_PASSED");

  const archiveZip = resolve(temporary, "wave3-batch-c-proof.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", archiveZip], { cwd: root, stdio: "inherit" });
  const archiveDir = resolve(temporary, "archive"); mkdirSync(archiveDir, { recursive: true }); execFileSync("unzip", ["-q", archiveZip, "-d", archiveDir]);
  const archive = await verifySurface(resolve(archiveDir, "yeeflow-app-builder-plugin"), "archive");
  assert.deepEqual(archive, source, "CORE_EXTRACTION_WAVE3_BATCH_C_ARCHIVE_DIFFERENTIAL");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_C_ARCHIVE_PARITY_PASSED");

  const installedRoot = resolve(temporary, "installed/yeeflow-app-builder-plugin"); cpSync(resolve(root, "dist/yeeflow-app-builder-plugin"), installedRoot, { recursive: true });
  const installed = await verifySurface(installedRoot, "installed");
  assert.deepEqual(installed, source, "CORE_EXTRACTION_WAVE3_BATCH_C_INSTALLED_DIFFERENTIAL");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_C_INSTALLED_PARITY_PASSED");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_C_DIFFERENTIAL_PARITY_PASSED");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_C_SERIALIZATION_IMMUTABILITY_DETERMINISM_PASSED");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_C_SCOPE_AND_LEAKAGE_GATES_PASSED");
} finally { rmSync(temporary, { recursive: true, force: true }); }

async function verifySurface(surface, label) {
  const core = await import(moduleUrl(corePath(surface)));
  assert.equal(typeof core.projectDataListSublistStaticConfiguration, "function", `CORE_EXTRACTION_WAVE3_BATCH_C_PUBLIC_FACADE_MISSING:${label}`);
  const projected = [];
  for (const entry of corpus.cases) {
    const input = structuredClone(entry.input); const before = structuredClone(input);
    const expected = invokeLegacy(entry.kind, structuredClone(input));
    const result = core.projectDataListSublistStaticConfiguration(Object.freeze({ surface: "data-list-sublist-static-configuration", kind: entry.kind, value: input }));
    assert.equal(stable(result.value), stable(expected), `CORE_EXTRACTION_WAVE3_BATCH_C_CORE_PARITY:${label}:${entry.id}`);
    assert.deepEqual(input, before, `CORE_EXTRACTION_WAVE3_BATCH_C_INPUT_MUTATION:${label}:${entry.id}`);
    assert(frozenDeep(result), `CORE_EXTRACTION_WAVE3_BATCH_C_RESULT_NOT_FROZEN:${label}:${entry.id}`);
    assert.equal(stable(JSON.parse(JSON.stringify(result))), stable(result), `CORE_EXTRACTION_WAVE3_BATCH_C_SERIALIZATION:${label}:${entry.id}`);
    projected.push({ id: entry.id, value: result.value });
  }
  assert.throws(() => core.projectDataListSublistStaticConfiguration({ surface: "data-list-sublist-static-configuration", kind: "parse-row-fields", value: "", hostContext: {} }), /DATA_LIST_SUBLIST_STATIC_CONFIGURATION_HOST_STATE_FORBIDDEN/);
  assert.throws(() => core.projectDataListSublistStaticConfiguration({ surface: "approval-form-sublist-static-configuration", kind: "parse-row-fields", value: "" }), /DATA_LIST_SUBLIST_STATIC_CONFIGURATION_SCOPE_INVALID/);
  assert.equal("parseSubListRowFields" in core, false, `CORE_EXTRACTION_WAVE3_BATCH_C_LEAF_EXPORT_LEAKED:${label}`);
  return { projected, materialized: await materialize(surface, label) };
}

async function materialize(surface, label) {
  const work = resolve(temporary, `materialize-${label}`); mkdirSync(work, { recursive: true });
  const spec = resolve(work, "functional-specification.md"); const plan = resolve(work, "yeeflow-app-plan.md"); const out = resolve(work, "generated-final");
  writeFileSync(spec, "# Functional Specification: Leave Balances\n\nBusiness defaults approval status: user-default-approved-for-generation.\n");
  writeFileSync(plan, materializerPlan());
  const materializer = await import(moduleUrl(resolve(surface, "scripts/materialize-full-app-generated-final.mjs")));
  const report = materializer.materializeFullAppGeneratedFinal({ cwd: work, functionalSpec: spec, appPlan: plan, outDir: out, allowFixtureApiIdsForTests: true });
  assert.equal(report.status, "pass", `CORE_EXTRACTION_WAVE3_BATCH_C_MATERIALIZER_FAILED:${label}:${JSON.stringify(report.findings)}`);
  const decoded = jsonAt(report.outputs.decodedResource); const list = decoded.Childs.find((entry) => entry?.List?.Title === "Employee Leave Balances");
  const field = list.Fields.find((entry) => entry.DisplayName === "Leave details"); const rules = JSON.parse(field.Rules)["list-variables"];
  const form = list.Layouts.find((entry) => entry.Type === 1 && entry.Title === "Create Balance"); const control = findNodes(JSON.parse(form.LayoutView), (entry) => entry?.type === "list" && entry.binding === field.FieldName)[0];
  return normalize({ rules, formVariables: control.attrs["list-variables"], formFields: control.attrs["list-fields"], summaries: control.attrs["list-fields-summary"] || [] });
}

function createLegacyRollbackSurface(target) {
  cpSync(resolve(root, "scripts"), resolve(target, "scripts"), { recursive: true }); cpSync(resolve(root, "docs/reference"), resolve(target, "docs/reference"), { recursive: true }); cpSync(resolve(root, "dist/yeeflow-app-builder-plugin/core"), resolve(target, "core"), { recursive: true });
  const path = resolve(target, "scripts/materialize-full-app-generated-final.mjs"); const source = readFileSync(path, "utf8");
  const legacy = source
    .replace("  projectDataListSublistStaticConfiguration as coreProjectDataListSublistStaticConfiguration,\n", "")
    .replace("parseSubListRowFields(cells[subListFieldsColumn], { surface: \"data-list\" })", "parseSubListRowFields(cells[subListFieldsColumn])")
    .replace("parseSubListSummaries(cells[subListSummariesColumn], { surface: \"data-list\" })", "parseSubListSummaries(cells[subListSummariesColumn])")
    .replace("function parseSubListRowFields(value, options = {}) {\n  if (options?.surface === \"data-list\") return coreProjectDataListSublistStaticConfiguration(Object.freeze({ surface: \"data-list-sublist-static-configuration\", kind: \"parse-row-fields\", value })).value;", "function parseSubListRowFields(value) {")
    .replace("function parseSubListSummaries(value, options = {}) {\n  if (options?.surface === \"data-list\") return coreProjectDataListSublistStaticConfiguration(Object.freeze({ surface: \"data-list-sublist-static-configuration\", kind: \"parse-summaries\", value })).value;", "function parseSubListSummaries(value) {")
    .replace(/function normalizeSubListRowType\(value\) \{[\s\S]*?\n\}/u, `function normalizeSubListRowType(value) {\n  const type = normKey(value);\n  if (/lookup|reference|relation/.test(type)) return "lookup";\n  if (/user|identity|person/.test(type)) return "user";\n  if (/date|time/.test(type)) return "date";\n  if (/bool|switch|yes no/.test(type)) return "boolean";\n  if (/number|decimal|currency|integer/.test(type)) return "number";\n  if (/file|attachment/.test(type)) return "file";\n  return "text";\n}`)
    .replace(/function normalizeSubListColumnControlType\(controlType, rowType\) \{[\s\S]*?\n\}/u, `function normalizeSubListColumnControlType(controlType, rowType) {\n  const explicit = normKey(controlType);\n  if (/lookup|reference|relation/.test(explicit)) return "lookup";\n  if (/identity|user picker/.test(explicit)) return "identity-picker";\n  if (/date/.test(explicit)) return "datepicker";\n  if (/number/.test(explicit)) return "input_number";\n  if (/switch|toggle/.test(explicit)) return "switch";\n  if (/file|upload/.test(explicit)) return "file-upload";\n  if (/input/.test(explicit)) return "input";\n  return { user: "identity-picker", date: "datepicker", number: "input_number", boolean: "switch", file: "file-upload", lookup: "lookup" }[rowType] || "input";\n}`)
    .replace(/function isSubListFormField\(field, controlType = ""\) \{[\s\S]*?\n\}/u, `function isSubListFormField(field, controlType = "") {\n  const raw = normKey(\`${"${field?.DisplayName || \"\"} ${field?.FieldType || \"\"} ${field?.Type || \"\"} ${controlType || \"\"}" }\`);\n  return /sub list|sublist|\\blist\\b/.test(raw);\n}`);
  assert.notEqual(legacy, source, "CORE_EXTRACTION_WAVE3_BATCH_C_ROLLBACK_NO_CHANGE"); assert.equal(legacy.includes("coreProjectDataListSublistStaticConfiguration"), false, "CORE_EXTRACTION_WAVE3_BATCH_C_ROLLBACK_BRIDGE_RETAINED");
  writeFileSync(path, legacy); return target;
}

function invokeLegacy(kind, input) { if (kind === "parse-row-fields") return legacy.parseSubListRowFields(input); if (kind === "parse-summaries") return legacy.parseSubListSummaries(input); if (kind === "normalize-row-type") return legacy.normalizeSubListRowType(input); if (kind === "normalize-control-type") return legacy.normalizeSubListColumnControlType(input.controlType, input.rowType); return legacy.isSubListFormField(input.field, input.controlType); }
function corePath(surface) { return surface === root ? resolve(root, "packages/app-builder-core-materializer/lib/index.js") : resolve(surface, "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"); }
function frozenDeep(value) { return !value || typeof value !== "object" || Object.isFrozen(value) && Object.values(value).every(frozenDeep); }
function findNodes(value, predicate, output = []) { if (Array.isArray(value)) { value.forEach((entry) => findNodes(entry, predicate, output)); return output; } if (!value || typeof value !== "object") return output; if (predicate(value)) output.push(value); Object.values(value).forEach((entry) => findNodes(entry, predicate, output)); return output; }
function normalize(value) { return JSON.parse(JSON.stringify(value).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu, "<uuid>")); }
function stable(value) { return JSON.stringify(value); } function moduleUrl(path) { return `${pathToFileURL(path).href}?wave3c=${Date.now()}-${Math.random()}`; } function json(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); } function jsonAt(path) { return JSON.parse(readFileSync(path, "utf8")); }
function materializerPlan() { return `# Yeeflow App Plan: Employee Leave Balances

## Plan Status

- Business defaults approval status: user-default-approved-for-generation.

## 4. Data Lists and Document Libraries Plan

### 4.1 Employee Leave Balances

| Field Label | Field Name | Field Type | Control Type | Sub List Row Fields | Sub List Summaries |
| --- | --- | --- | --- | --- | --- |
| Title | Title | Text | input | None | None |
| Leave details | Text7 | Text | list | LeaveType:Leave type:text:input:row-1:true; UsedDays:Used Days:number:input_number:row-2:true; StartDate:Start date:date:datepicker:row-3:true; Leave Usage Hours:Leave Usage Hours:number:input_number:row-4:false | None |

## 10. Custom Data List Forms Plan

### 10.1 Employee Leave Balances

| Form Name | Form Type | Purpose |
| --- | --- | --- |
| Create Balance | New/Edit | Create leave balance |

#### Form Fields Layout Template Selection
| Data List or Library | Custom Form | Field Group | Selected Form Fields Layout Template |
| --- | --- | --- | --- |
| Employee Leave Balances | Create Balance | Fields | data_list_form_fields_grid_v1_1 |
`; }

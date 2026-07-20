#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const plugin = resolve(root, "dist/yeeflow-app-builder-plugin");
const historicalZip = resolve(root, "dist/yeeflow-app-builder-plugin-0.9.71.zip");
const historicalChecksum = "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2";
const corpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/data-list-sublist-scalar-row-schema-shadow.v0.1.0.json"), "utf8"));
const coreContract = JSON.parse(readFileSync(resolve(root, "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json"), "utf8"));
const runtimeContract = JSON.parse(readFileSync(resolve(root, "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json"), "utf8"));
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-sublist-row-schema-distribution-"));
try {
  const source = await load("source", resolve(root, "packages/app-builder-core-materializer/lib/index.js"), resolve(root, "runtimes/app-builder-core-local-runtime/lib/index.js"));
  const expected = collect(source);
  console.log(`DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_ARTIFACT_SOURCE_PARITY_PASSED cases=${corpus.caseCount}`);
  const dist = await load("dist", resolve(plugin, "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"), resolve(plugin, "core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"));
  assert.deepEqual(collect(dist), expected, "Plugin dist behavior differs from source.");
  const archive = resolve(temporary, "archive"); const zip = resolve(temporary, "proof.zip"); mkdirSync(archive, { recursive: true });
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", zip], { cwd: root, stdio: "pipe" }); execFileSync("unzip", ["-q", zip, "-d", archive]);
  const zipSurface = await load("archive", resolve(archive, "yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"), resolve(archive, "yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"));
  assert.deepEqual(collect(zipSurface), expected, "Archive behavior differs from source.");
  console.log(`DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_ARTIFACT_ARCHIVE_PARITY_PASSED cases=${corpus.caseCount}`);
  const installed = resolve(temporary, "installed/yeeflow-app-builder-plugin"); cpSync(plugin, installed, { recursive: true });
  const installedSurface = await load("installed", resolve(installed, "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"), resolve(installed, "core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"));
  assert.deepEqual(collect(installedSurface), expected, "Installed Plugin behavior differs from source.");
  console.log(`DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_ARTIFACT_INSTALLED_PARITY_PASSED cases=${corpus.caseCount}`);
  assert.equal(execFileSync("shasum", ["-a", "256", historicalZip], { cwd: root, encoding: "utf8" }).split(/\s+/)[0], historicalChecksum, "Historical ZIP changed.");
  console.log(`DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_DUAL_DISTRIBUTION_VALID cases=${corpus.caseCount}`);
} finally { rmSync(temporary, { recursive: true, force: true }); }
async function load(label, corePath, runtimePath) { const core = await import(`${pathToFileURL(corePath).href}?surface=${label}`); const runtime = await import(`${pathToFileURL(runtimePath).href}?surface=${label}`); assert.deepEqual(Object.keys(core).sort(), [...coreContract.runtimeExports].sort(), `${label} Core export list mismatch.`); assert.deepEqual(Object.keys(runtime).sort(), [...runtimeContract.runtimeExports].sort(), `${label} Runtime export list mismatch.`); return { core, runtime }; }
function collect(surface) { return corpus.cases.map((item) => {
  if (item.kind === "valid") { const input = inputFor(item); const before = JSON.stringify(input); const projected = surface.core.projectDataListSublistScalarRowSchema(input); assert.equal(JSON.stringify(input), before, `${item.id} input mutated`); assert.ok(Object.isFrozen(projected) && Object.isFrozen(projected.intent) && Object.isFrozen(projected.findings), item.id); const context = contextFor(projected.intent); const contextBefore = JSON.stringify(context); const lowered = surface.runtime.lowerDataListSublistScalarRowSchemaAtHost(projected.intent, context); assert.equal(JSON.stringify(context), contextBefore, `${item.id} context mutated`); assert.ok(Object.isFrozen(lowered), item.id); return { id: item.id, result: JSON.parse(JSON.stringify(projected)), lowered: JSON.parse(JSON.stringify(lowered)) }; }
  if (item.kind === "host-error") { const intent = surface.core.projectDataListSublistScalarRowSchema(inputFor({ rows: baseRows() })).intent; const context = contextFor(intent); alter(context, item.id); const before = JSON.stringify(context); const error = capture(() => surface.runtime.lowerDataListSublistScalarRowSchemaAtHost(intent, context)).error; assert.ok(error && new RegExp(item.error).test(error.message), item.id); assert.equal(JSON.stringify(context), before, `${item.id} host context mutated`); return { id: item.id, error: error.message }; }
  const result = surface.core.projectDataListSublistScalarRowSchema(inputFor({ rows: [{ ...baseRows()[0], type: item.fieldType }] })); assert.equal(result.intent, null, item.id); return { id: item.id, excluded: true };
}); }
function baseRows() { return [{ idx: "row_title", id: "Title", name: "Title", displayName: "Title", type: "Text", editable: true, controlType: "input" }]; }
function inputFor(item) { const ids = item.identities || { parentListId: "9000000000000000001", childListId: "9000000000000000002", parentFieldId: "9000000000000000003", childFieldId: "9000000000000000004" }; return Object.freeze({ surface: "data-list-sublist", ...ids, rowSchemaId: "schema:order-lines", templateScope: "data-list:orders:sublist", rows: Object.freeze(item.rows.map((row, ordinal) => Object.freeze({ rowSchemaRowId: row.idx, fieldName: row.id, ordinal, name: row.name, displayName: row.displayName, fieldType: row.type, editable: row.editable, controlType: row.controlType }))) }); }
function contextFor(intent) { return { parentListId: intent.parentListId, childListId: intent.childListId, parentFieldId: intent.parentFieldId, childFieldId: intent.childFieldId, rowSchemaId: intent.rowSchemaId, templateScope: intent.templateScope, parentNodes: [{ reference: intent.parentFieldId, scope: intent.templateScope, parentListId: intent.parentListId }], rowSchemas: [{ reference: intent.rowSchemaId, scope: intent.templateScope, parentFieldId: intent.parentFieldId, childListId: intent.childListId }] }; }
function alter(context, id) { if (id === "template-missing") context.parentNodes = []; if (id === "template-invalid") context.parentListId = 9000000000000000001; if (id === "template-scope") context.parentListId = "9000000000000000999"; if (id === "template-duplicate") context.parentNodes.push({ ...context.parentNodes[0] }); if (id === "template-relationship") context.parentNodes[0].parentListId = "9000000000000000999"; if (id === "row-schema-missing") context.rowSchemas = []; if (id === "row-schema-invalid") context.rowSchemaId = "invalid schema"; if (id === "row-schema-scope") context.templateScope = "data-list:other:sublist"; if (id === "row-schema-duplicate") context.rowSchemas.push({ ...context.rowSchemas[0] }); if (id === "row-schema-relationship") context.rowSchemas[0].childListId = "9000000000000000999"; }
function capture(callback) { try { return { value: callback(), error: null }; } catch (error) { return { value: null, error }; } }

#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { quoteLargeJsonIntegers } from "./lib/yapk-decode-utils.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const exportPath = resolve(argument("--export", "/Users/rengerhu/Downloads/Employee Leave Balances.ydl"));
const fixturePath = resolve(root, "compatibility/differential-fixtures/data-list-sublist-embedded-schema-export.v0.1.0.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
const validation = spawnSync(process.execPath, [resolve(root, "scripts/validate-phase9g-export-proven-data-list-sublist-embedded-schema-reconciliation.mjs")], { cwd: root, encoding: "utf8" });
assert.equal(validation.status, 0, validation.stdout + validation.stderr);
const actual = decodeExport(exportPath);
assert.equal(actual.wrapperSha256, fixture.source.wrapperSha256, "the regression must run against the recorded product export");
assert.equal(actual.resourceSha256, fixture.source.decodedResourceSha256, "the decoded product resource must match the recorded export");
assert.deepEqual(actual.parent, fixture.parent, "parent product identity must remain lossless");
assert.deepEqual(actual.columns, fixture.columns, "Rules list-variables must match the frozen export fixture");
assert.deepEqual(actual.customFormControl.listVariables, fixture.columns, "custom-form list-variables must match Rules");
assert.deepEqual(actual.customFormControl.listFields, fixture.columns, "custom-form list-fields metadata must match Rules");
assert.equal(actual.forbiddenKeys.length, 0, "product export must not introduce child product identities");
const core = await import(pathToFileURL(resolve(root, "packages/app-builder-core-materializer/lib/internal/data-list-sublist-embedded-schema.js")).href);
const input = Object.freeze({ parentListId: actual.parent.listId, parentFieldId: actual.parent.fieldId, columns: Object.freeze(actual.columns.map((column) => Object.freeze({ ...column }))) });
const descriptor = core.projectDataListEmbeddedSublistSchemaInternal(input);
const rulesProjection = core.projectEmbeddedSublistRules(descriptor);
const formProjection = core.projectEmbeddedSublistCustomFormFields(descriptor);
assert.equal(rulesProjection.descriptor, descriptor, "Rules must receive the supplied frozen descriptor");
assert.equal(formProjection.descriptor, descriptor, "custom-form fields must receive the supplied frozen descriptor");
assert.equal(Object.isFrozen(descriptor), true);
assert.equal(Object.isFrozen(descriptor.columns), true);
assert.equal(Object.isFrozen(rulesProjection.listVariables), true);
assert.equal(Object.isFrozen(formProjection.listFields), true);
assert.deepEqual(rulesProjection.listVariables, actual.columns, "Core Rules lowering must equal exported Rules metadata");
assert.deepEqual(formProjection.listFields, actual.columns, "Core custom-form schema lowering must equal exported list-fields metadata");
const serialized = JSON.stringify({ descriptor, rulesProjection, formProjection });
for (const key of fixture.forbiddenProductIdentityKeys) assert.equal(serialized.includes(key), false, `${key} must never be serialized as a child product identity`);
assert.throws(() => core.projectDataListEmbeddedSublistSchemaInternal({ ...input, columns: [{ ...actual.columns[0] }, { ...actual.columns[0] }] }), /DATA_LIST_EMBEDDED_SUBLIST_SCHEMA_INVALID/);
assert.throws(() => core.projectDataListEmbeddedSublistSchemaInternal({ ...input, parentFieldId: "not-a-product-id" }), /DATA_LIST_EMBEDDED_SUBLIST_SCHEMA_INVALID/);
runNegativeValidatorRegression();
console.log("DATA_LIST_SUBLIST_EMBEDDED_SCHEMA_CORE_SHADOW_IMPLEMENTED");
console.log("DATA_LIST_SUBLIST_EMBEDDED_SCHEMA_DIFFERENTIAL_PASSED exportCases=1 consumerCases=2");
console.log("DATA_LIST_SUBLIST_EMBEDDED_SCHEMA_SHARED_DESCRIPTOR_PASSED");
console.log("DATA_LIST_SUBLIST_EMBEDDED_SCHEMA_NO_CHILD_IDENTITY_PASSED");

function decodeExport(path) {
  const wrapperText = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
  const wrapper = JSON.parse(quoteLargeJsonIntegers(wrapperText));
  const prefix = "[______gizp______]";
  assert.equal(typeof wrapper.Resource, "string"); assert.equal(wrapper.Resource.startsWith(prefix), true);
  const resourceText = gunzipSync(Buffer.from(wrapper.Resource.slice(prefix.length), "base64")).toString("utf8");
  const resource = JSON.parse(quoteLargeJsonIntegers(resourceText));
  const decoded = typeof resource.Data === "string" ? JSON.parse(quoteLargeJsonIntegers(resource.Data)) : resource.Data || resource;
  const item = decoded.Item || decoded;
  const list = item.ListModel || item.List;
  const field = (item.Defs || item.Fields || []).find((candidate) => candidate?.DisplayName === "Leave details");
  assert.ok(field); const rules = JSON.parse(quoteLargeJsonIntegers(field.Rules));
  const columns = normalizeColumns(rules["list-variables"]);
  const matches = [];
  const forbiddenKeys = [];
  walkJsonStrings(decoded, (node, pointer) => { for (const key of Object.keys(node || {})) if (["childlistid", "childfieldid", "rowschemaid"].includes(key.toLowerCase())) forbiddenKeys.push({ key, pointer }); if (node?.type === "list" && node?.binding === field.FieldName) matches.push({ node, pointer }); });
  assert.equal(matches.length, 1);
  const control = matches[0].node;
  return { wrapperSha256: sha(wrapperText), resourceSha256: sha(resourceText), parent: { listId: list.ListID, fieldId: field.FieldID, fieldName: field.FieldName, displayName: field.DisplayName, fieldType: field.FieldType, type: field.Type, rulesStoredAs: "string" }, columns, customFormControl: { pointer: matches[0].pointer, binding: control.binding, fieldId: control.fieldID, listVariables: normalizeColumns(control.attrs?.["list-variables"]), listFields: normalizeColumns(control.attrs?.["list-fields"]), controlBindings: (control.attrs?.["list-fields"] || []).map((column) => ({ binding: column?.control?.binding, parentBinding: column?.control?.attrs?.list_field_binding, controlType: column?.control?.type })) }, forbiddenKeys };
}

function runNegativeValidatorRegression() { const temp = mkdtempSync(resolve(tmpdir(), "yeeflow-phase9g-validator-")); try { const bad = JSON.parse(JSON.stringify(fixture)); bad.parent.type = "text"; const badPath = resolve(temp, "bad-fixture.json"); writeFileSync(badPath, `${JSON.stringify(bad, null, 2)}\n`, "utf8"); const result = spawnSync(process.execPath, [resolve(root, "scripts/validate-phase9g-export-proven-data-list-sublist-embedded-schema-reconciliation.mjs"), "--fixture", badPath], { cwd: root, encoding: "utf8" }); assert.notEqual(result.status, 0); assert.match(`${result.stdout}${result.stderr}`, /DATA_LIST_SUBLIST_EXPORT_PARENT_IDENTITY_INVALID/); } finally { rmSync(temp, { recursive: true, force: true }); } }
function normalizeColumns(rows) { return (Array.isArray(rows) ? rows : []).map((column) => ({ idx: column?.idx, id: column?.id, name: column?.name, type: column?.type, editable: column?.editable })); }
function walkJsonStrings(value, visitor, pointer = "$") { if (typeof value === "string" && (value.startsWith("{") || value.startsWith("["))) { try { return walkJsonStrings(JSON.parse(quoteLargeJsonIntegers(value)), visitor, `${pointer}<json>`); } catch { return; } } if (!value || typeof value !== "object") return; visitor(value, pointer); for (const [key, child] of Object.entries(value)) walkJsonStrings(child, visitor, `${pointer}.${key}`); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }

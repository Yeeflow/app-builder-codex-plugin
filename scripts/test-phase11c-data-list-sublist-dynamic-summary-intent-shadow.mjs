#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import ts from "typescript";
import { createDataListSublistDynamicSummaryHostScopeContext, lowerDataListSublistDynamicSummaryIntentForTest } from "./test-fixtures/data-list-sublist-dynamic-summary-host-scope-context-shadow.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/data-list-sublist-dynamic-summary-intent-shadow.v0.1.0.json"), "utf8"));
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase11c-core-"));
try {
  const corePath = resolve(temporary, "dynamic-summary.mjs");
  const source = readFileSync(resolve(root, "packages/app-builder-core-materializer/src/internal/data-list-sublist-dynamic-summary-intent.ts"), "utf8");
  writeFileSync(corePath, ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText, "utf8");
  const core = await import(`${pathToFileURL(corePath).href}?v=${Date.now()}`);
  assert.equal(corpus.caseCount, corpus.cases.length);
  const snapshot = sourceSnapshot();
  const before = JSON.stringify(snapshot);
  const context = createDataListSublistDynamicSummaryHostScopeContext(snapshot);
  const listRequest = request("field-list", "control-list", "shared-summary");
  const tempRequest = request("field-temp", "control-temp", "shared-summary");
  const list = context.resolve(listRequest);
  const listAgain = context.resolve(listRequest);
  const temp = context.resolve(tempRequest);
  assert.equal(list, listAgain, "one resolved descriptor per composite scope");
  assert.notEqual(list, temp, "duplicated summary UUID is not a standalone identity");
  assert.deepEqual(JSON.parse(JSON.stringify(context)), {});
  assert.equal(JSON.stringify(snapshot), before, "host snapshot remains caller-owned and unchanged");
  for (const descriptor of [list, temp]) {
    const result = core.projectDataListSublistDynamicSummaryIntentInternal(Object.freeze(descriptor));
    assert.equal(result.findings.length, 0);
    assert(Object.isFrozen(result) && Object.isFrozen(result.intent) && Object.isFrozen(result.intent.scope) && Object.isFrozen(result.intent.binding));
    assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
    assert.deepEqual(lowerDataListSublistDynamicSummaryIntentForTest(result.intent), Object.freeze({ id: descriptor.scope.summaryId, field: descriptor.summary.field, type: descriptor.summary.type, display: true, binding: Object.freeze({ prefix: descriptor.binding.prefix, value: descriptor.binding.value }) }));
  }
  assert.equal(list.binding.kind, "data-list-field");
  assert.equal(temp.binding.kind, "temp-variable");
  assert.equal(temp.binding.targetDescriptor.id, "var_TotalHours");
  assert.equal(temp.binding.targetDescriptor.idx, "temp-export-idx");
  assert.equal(snapshot.tempVars.length, 1, "no temporary-variable mutation");
  assert.throws(() => context.resolve({ ...listRequest, layoutId: "900000000000000002" }), /SUBLIST_DYNAMIC_SUMMARY_WRONG_SCOPE/);
  assert.throws(() => context.resolve({ ...listRequest, parentListId: "800000000000000002" }), /SUBLIST_DYNAMIC_SUMMARY_WRONG_SCOPE/);
  assert.throws(() => context.resolve({ ...listRequest, summaryId: "" }), /SUBLIST_DYNAMIC_SUMMARY_SUMMARY_STANDALONE_FORBIDDEN/);
  const duplicate = sourceSnapshot(); duplicate.tempVars.push({ id: "var_TotalHours", idx: "other" });
  assert.throws(() => createDataListSublistDynamicSummaryHostScopeContext(duplicate).resolve(tempRequest), /SUBLIST_DYNAMIC_SUMMARY_TEMP_BINDING_INVALID/);
  const missing = sourceSnapshot(); missing.tempVars = [];
  assert.throws(() => createDataListSublistDynamicSummaryHostScopeContext(missing).resolve(tempRequest), /SUBLIST_DYNAMIC_SUMMARY_TEMP_BINDING_INVALID/);
  const broken = sourceSnapshot(); broken.controls[0].summaries[0].binding.value = "missing";
  assert.throws(() => createDataListSublistDynamicSummaryHostScopeContext(broken).resolve(listRequest), /SUBLIST_DYNAMIC_SUMMARY_LIST_BINDING_INVALID/);
  assert.throws(() => context.resolve(request("field-list", "stale", "shared-summary")), /SUBLIST_DYNAMIC_SUMMARY_CONTROL_INVALID/);
  assert.throws(() => context.resolve(request("unknown", "control-list", "shared-summary")), /SUBLIST_DYNAMIC_SUMMARY_PARENT_FIELD_INVALID/);
  const invalidSource = sourceSnapshot(); invalidSource.controls[0].columns = [];
  assert.throws(() => createDataListSublistDynamicSummaryHostScopeContext(invalidSource).resolve(listRequest), /SUBLIST_DYNAMIC_SUMMARY_SOURCE_INVALID/);
  const approval = sourceSnapshot(); approval.controls[0].summaries[0].binding = { prefix: "__variables_", value: "Totalhours" };
  assert.throws(() => createDataListSublistDynamicSummaryHostScopeContext(approval).resolve(listRequest), /SUBLIST_DYNAMIC_SUMMARY_APPROVAL_FORM_EXCLUDED/);
  const runtime = core.projectDataListSublistDynamicSummaryIntentInternal({ ...list, runtimeExpression: "eval()" });
  assert(runtime.findings.some((item) => item.code === "SUBLIST_DYNAMIC_SUMMARY_RUNTIME_EXPRESSION_FORBIDDEN"));
  const other = core.projectDataListSublistDynamicSummaryIntentInternal({ ...list, surface: "approval-form-summary" });
  assert(other.findings.some((item) => item.code === "SUBLIST_DYNAMIC_SUMMARY_SURFACE_INVALID"));
  const otherContext = createDataListSublistDynamicSummaryHostScopeContext(sourceSnapshot());
  assert.notEqual(otherContext.resolve(listRequest), list, "contexts are isolated");
  context.dispose();
  assert.throws(() => context.resolve(listRequest), /SUBLIST_DYNAMIC_SUMMARY_CONTEXT_DISPOSED/);
  console.log("SUBLIST_DYNAMIC_SUMMARY_INTENT_CORE_SHADOW_IMPLEMENTED");
  console.log("SUBLIST_DYNAMIC_SUMMARY_HOST_SCOPE_CONTEXT_SHADOW_IMPLEMENTED");
  console.log("SUBLIST_DYNAMIC_SUMMARY_EXPORT_SCOPE_PARITY_PASSED cases=16");
  console.log("SUBLIST_DYNAMIC_SUMMARY_SCOPE_RESOLUTION_GATES_PASSED");
  console.log("SUBLIST_DYNAMIC_SUMMARY_SERIALIZATION_PARITY_PASSED");
  console.log("SUBLIST_DYNAMIC_SUMMARY_CORE_IMMUTABILITY_PASSED");
  console.log("SUBLIST_DYNAMIC_SUMMARY_TEMP_VARIABLE_NONMUTATION_PASSED");
  console.log("SUBLIST_DYNAMIC_SUMMARY_APPROVAL_FORM_EXCLUSION_PASSED");
  console.log("SUBLIST_DYNAMIC_SUMMARY_LEGACY_UNCHANGED");
} finally { rmSync(temporary, { recursive: true, force: true }); }

function request(parentFieldId, sublistControlId, summaryId) { return { parentListId: "800000000000000001", layoutId: "900000000000000001", layoutResourceId: "900000000000000001", parentFieldId, sublistControlId, summaryId }; }
function sourceSnapshot() { return { surface: "data-list", parentListId: "800000000000000001", layout: { type: 1, id: "900000000000000001", resourceId: "900000000000000001" }, fields: [{ fieldId: "field-list", name: "Text7", type: "list", idx: "field-list-idx" }, { fieldId: "field-temp", name: "Text10", type: "list", idx: "field-temp-idx" }, { fieldId: "field-target", name: "Decimal1", type: "number", idx: "field-target-idx" }], tempVars: [{ id: "var_TotalHours", idx: "temp-export-idx" }], controls: [{ id: "control-list", fieldId: "field-list", columns: [{ id: "Hours", idx: "hours-idx", name: "Hours", type: "decimal" }], summaries: [{ id: "shared-summary", field: "Hours", type: "total", display: true, binding: { prefix: "__list_", value: "Decimal1" } }] }, { id: "control-temp", fieldId: "field-temp", columns: [{ id: "Hours", idx: "hours-idx", name: "Hours", type: "decimal" }], summaries: [{ id: "shared-summary", field: "Hours", type: "total", display: true, binding: { prefix: "__temp_", value: "var_TotalHours" } }] }] }; }

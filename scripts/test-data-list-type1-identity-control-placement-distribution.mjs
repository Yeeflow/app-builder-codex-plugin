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
const corpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/data-list-type1-identity-user-control-placement.v0.1.0.json"), "utf8"));
const materializerContract = JSON.parse(readFileSync(resolve(root, "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json"), "utf8"));
const runtimeContract = JSON.parse(readFileSync(resolve(root, "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json"), "utf8"));
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-type1-placement-distribution-"));
try {
  const source = await loadSurface("SOURCE", resolve(root, "packages/app-builder-core-materializer/lib/index.js"), resolve(root, "runtimes/app-builder-core-local-runtime/lib/index.js"));
  const expected = collect(source);
  console.log(`DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ARTIFACT_SOURCE_PARITY_PASSED cases=${corpus.cases.length}`);
  const dist = await loadSurface("DIST", resolve(plugin, "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"), resolve(plugin, "core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"));
  assert.deepEqual(collect(dist), expected, "Plugin dist Type 1 behavior differs from source.");
  const archiveRoot = resolve(temporary, "archive");
  const proofZip = resolve(temporary, "proof.zip");
  mkdirSync(archiveRoot, { recursive: true });
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", proofZip], { cwd: root, stdio: "pipe" });
  execFileSync("unzip", ["-q", proofZip, "-d", archiveRoot]);
  const archive = await loadSurface("ARCHIVE", resolve(archiveRoot, "yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"), resolve(archiveRoot, "yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"));
  assert.deepEqual(collect(archive), expected, "Archive Type 1 behavior differs from source.");
  console.log(`DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ARTIFACT_ARCHIVE_PARITY_PASSED cases=${corpus.cases.length}`);
  const installed = resolve(temporary, "installed/yeeflow-app-builder-plugin");
  cpSync(plugin, installed, { recursive: true });
  const installedSurface = await loadSurface("INSTALLED", resolve(installed, "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"), resolve(installed, "core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"));
  assert.deepEqual(collect(installedSurface), expected, "Installed Type 1 behavior differs from source.");
  console.log(`DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ARTIFACT_INSTALLED_PARITY_PASSED cases=${corpus.cases.length}`);
  assert.equal(execFileSync("shasum", ["-a", "256", historicalZip], { cwd: root, encoding: "utf8" }).split(/\s+/)[0], historicalChecksum, "Historical Plugin ZIP checksum changed.");
  console.log(`DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_DUAL_DISTRIBUTION_VALID cases=${corpus.cases.length}`);
} finally { rmSync(temporary, { recursive: true, force: true }); }
async function loadSurface(label, corePath, runtimePath) {
  const core = await import(`${pathToFileURL(corePath).href}?surface=${label}`);
  const runtime = await import(`${pathToFileURL(runtimePath).href}?surface=${label}`);
  assert.deepEqual(Object.keys(core).sort(), [...materializerContract.runtimeExports].sort(), `${label} Core export list mismatch.`);
  assert.deepEqual(Object.keys(runtime).sort(), [...runtimeContract.runtimeExports].sort(), `${label} Local Runtime export list mismatch.`);
  assert.equal(typeof core.projectDataListType1IdentityControlPlacement, "function", `${label} Core Type 1 export missing.`);
  assert.equal(typeof runtime.lowerDataListType1IdentityControlPlacementAtHost, "function", `${label} Local Runtime Type 1 export missing.`);
  return { core, runtime };
}
function collect(surface) {
  return corpus.cases.map((item) => {
    if (item.kind === "valid") {
      const input = inputFor(item);
      const before = JSON.stringify(input);
      const projected = surface.core.projectDataListType1IdentityControlPlacement(input);
      assert.equal(JSON.stringify(input), before, `${item.id} Core input changed.`);
      assert.ok(Object.isFrozen(projected) && Object.isFrozen(projected.findings) && Object.isFrozen(projected.intent), `${item.id} Core result is not frozen.`);
      assert.equal("id" in projected.intent.descriptor, false, `${item.id} Core descriptor leaks a control ID.`);
      const lowered = surface.runtime.lowerDataListType1IdentityControlPlacementAtHost(projected.intent, snapshot(), { controlId: controlId(input) });
      assert.ok(Object.isFrozen(lowered), `${item.id} host fragment is not frozen.`);
      assert.equal(lowered.attrs.data.list.ListID, input.references.listId, `${item.id} ListID changed.`);
      assert.equal(lowered.attrs.data.fieldId, input.references.fieldId, `${item.id} FieldID changed.`);
      return { id: item.id, projection: JSON.parse(JSON.stringify(projected)), lowered: JSON.parse(JSON.stringify(lowered)) };
    }
    if (item.kind === "host-error") {
      const input = inputFor({ templateKind: "view", field: { fieldName: "User1", displayName: "Owner", fieldType: "Identity" } });
      const projected = surface.core.projectDataListType1IdentityControlPlacement(input);
      const state = snapshot(); const context = { controlId: "detail_owner_1" };
      if (item.id === "missing-reference") state.slots = [];
      if (item.id === "invalid-reference") context.controlId = "";
      if (item.id === "wrong-scope") state.templateScope = "data-list:other:view";
      if (item.id === "duplicate-reference") state.nodes = state.nodes.concat([state.nodes[0]]);
      if (item.id === "broken-reference") state.slots = [{ reference: "slot:owner", scope: state.templateScope, parentReference: "node:other" }];
      const before = JSON.stringify(state);
      const error = capture(() => surface.runtime.lowerDataListType1IdentityControlPlacementAtHost(projected.intent, state, context)).error;
      assert.ok(error && new RegExp(item.error).test(error.message), item.id);
      assert.equal(JSON.stringify(state), before, `${item.id} template snapshot changed.`);
      return { id: item.id, error: error.message };
    }
    if (item.surface || item.templateKind === "type0") {
      const input = { ...inputFor({ templateKind: "view", field: item.field }), ...(item.surface ? { surface: item.surface } : { templateKind: item.templateKind }) };
      const error = capture(() => surface.core.projectDataListType1IdentityControlPlacement(input)).error;
      assert.ok(error, item.id); return { id: item.id, error: error.message };
    }
    const result = surface.core.projectDataListType1IdentityControlPlacement(inputFor({ templateKind: "view", field: item.field }));
    assert.equal(result.intent, null, item.id); return { id: item.id, excluded: true };
  });
}
function inputFor(item) { const listId = item.listId || "1000000000000000001"; const fieldId = item.fieldId || "1000000000000000002"; return Object.freeze({ surface: "data-list", templateKind: item.templateKind, templateSnapshot: Object.freeze({ templateId: "data_list_form_layout_view_item_v1_1", templateScope: "data-list:orders:view" }), references: Object.freeze({ fieldsGridNodeRef: "node:fields-grid", controlSlotRef: "slot:owner", listId, fieldId }), field: Object.freeze(item.field), formName: "Order Detail", listName: "Orders", ordinal: 0 }); }
function snapshot() { return { templateId: "data_list_form_layout_view_item_v1_1", templateScope: "data-list:orders:view", nodes: [{ reference: "node:root", scope: "data-list:orders:view" }, { reference: "node:fields-grid", scope: "data-list:orders:view", parentReference: "node:root" }], slots: [{ reference: "slot:owner", scope: "data-list:orders:view", parentReference: "node:fields-grid" }] }; }
function controlId(input) { return "order-detail_" + input.field.fieldName.toLowerCase() + "_1"; }
function capture(callback) { try { return { value: callback(), error: null }; } catch (error) { return { value: null, error }; } }

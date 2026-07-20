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
const corpus = json("compatibility/differential-fixtures/data-list-sublist-nested-control-placement-shadow.v0.1.0.json");
const coreContract = json("compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const runtimeContract = json("compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-nested-control-placement-distribution-"));

try {
  const source = await load("source", resolve(root, "packages/app-builder-core-materializer/lib/index.js"), resolve(root, "runtimes/app-builder-core-local-runtime/lib/index.js"));
  const expected = collect(source);
  console.log(`SUBLIST_NESTED_CONTROL_ARTIFACT_SOURCE_PARITY_PASSED cases=${corpus.caseCount}`);
  const dist = await load("dist", resolve(plugin, "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"), resolve(plugin, "core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"));
  assert.deepEqual(collect(dist), expected);
  const archive = resolve(temporary, "archive");
  const zip = resolve(temporary, "proof.zip");
  mkdirSync(archive, { recursive: true });
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", zip], { cwd: root, stdio: "pipe" });
  execFileSync("unzip", ["-q", zip, "-d", archive]);
  const zipped = await load("archive", resolve(archive, "yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"), resolve(archive, "yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"));
  assert.deepEqual(collect(zipped), expected);
  console.log(`SUBLIST_NESTED_CONTROL_ARTIFACT_ARCHIVE_PARITY_PASSED cases=${corpus.caseCount}`);
  const installed = resolve(temporary, "installed/yeeflow-app-builder-plugin");
  cpSync(plugin, installed, { recursive: true });
  const installedSurface = await load("installed", resolve(installed, "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"), resolve(installed, "core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs"));
  assert.deepEqual(collect(installedSurface), expected);
  console.log(`SUBLIST_NESTED_CONTROL_ARTIFACT_INSTALLED_PARITY_PASSED cases=${corpus.caseCount}`);
  assert.equal(execFileSync("shasum", ["-a", "256", historicalZip], { encoding: "utf8" }).split(/\s+/)[0], historicalChecksum);
  console.log(`SUBLIST_NESTED_CONTROL_DUAL_DISTRIBUTION_VALID cases=${corpus.caseCount}`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

async function load(surface, corePath, runtimePath) {
  const core = await import(`${pathToFileURL(corePath).href}?surface=${surface}`);
  const runtime = await import(`${pathToFileURL(runtimePath).href}?surface=${surface}`);
  assert.deepEqual(Object.keys(core).sort(), [...coreContract.runtimeExports].sort());
  assert.deepEqual(Object.keys(runtime).sort(), [...runtimeContract.runtimeExports].sort());
  if (surface !== "source") for (const text of [readFileSync(corePath, "utf8"), readFileSync(runtimePath, "utf8")]) assert.doesNotMatch(text, /node_modules|\.ts\b|sourceMappingURL|\/Users\/|bare-package/u);
  return { core, runtime };
}

function collect(surface) {
  const input = validInput();
  const before = JSON.stringify(input);
  const result = surface.core.projectDataListSublistNestedControlPlacementIntent(Object.freeze(input));
  assert.equal(JSON.stringify(input), before);
  assert.ok(Object.isFrozen(result) && Object.isFrozen(result.findings));
  assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
  assert.ok(result.intent && Object.isFrozen(result.intent) && Object.isFrozen(result.intent.placements));
  const bindings = result.intent.placements.map((placement) => ({ childControlReference: placement.childControlReference, controlId: `host-${placement.column.id}`, parentBinding: "Leave details", parentControlId: "parent-control" }));
  const lowered = surface.runtime.lowerDataListSublistNestedControlPlacementAtHost(result.intent, bindings);
  assert.ok(Object.isFrozen(lowered));
  assert.deepEqual(JSON.parse(JSON.stringify(lowered)), lowered);
  assert.deepEqual(lowered.map((field) => [field.id, field.idx, field.control.type]), [["Text1", "idx-text", "input"], ["Date1", "idx-date", "datepicker"], ["Decimal1", "idx-number", "input_number"], ["Bit1", "idx-bit", "switch"]]);
  gates(surface, input, result.intent, bindings);
  return { result: JSON.parse(JSON.stringify(result)), lowered: JSON.parse(JSON.stringify(lowered)) };
}

function gates(surface, input, intent, bindings) {
  for (const [name, value, code] of [
    ["wrong-slot", { ...input, templateSnapshot: { ...input.templateSnapshot, listFieldsSlotReference: "children" } }, "SUBLIST_NESTED_CONTROL_TEMPLATE_SNAPSHOT_INVALID"],
    ["duplicate-reference", { ...input, columns: [input.columns[0], { ...input.columns[1], childControlReference: input.columns[0].childControlReference }] }, "SUBLIST_NESTED_CONTROL_CHILD_REFERENCE_DUPLICATE"],
    ["numeric-idx", { ...input, columns: [{ ...input.columns[0], idx: 0 }] }, "SUBLIST_NESTED_CONTROL_CHILD_REFERENCE_INVALID"],
    ["nested-sublist", { ...input, columns: [{ ...input.columns[0], type: "list" }] }, "SUBLIST_NESTED_CONTROL_CHILD_REFERENCE_INVALID"],
    ["forbidden-template", { ...input, template: {} }, "SUBLIST_NESTED_CONTROL_CORE_HOST_STATE_FORBIDDEN"]
  ]) {
    const result = surface.core.projectDataListSublistNestedControlPlacementIntent(value);
    assert.equal(result.intent, null, name);
    assert.ok(result.findings.some((finding) => finding.code === code), name);
  }
  assert.throws(() => surface.runtime.lowerDataListSublistNestedControlPlacementAtHost(intent, bindings.slice(1)), /SUBLIST_NESTED_CONTROL_LOWERING_INVALID/);
  assert.throws(() => surface.runtime.lowerDataListSublistNestedControlPlacementAtHost(intent, [{ ...bindings[0], childControlReference: "other" }, ...bindings.slice(1)]), /SUBLIST_NESTED_CONTROL_HOST_BINDING_INVALID/);
  assert.throws(() => surface.runtime.lowerDataListSublistNestedControlPlacementAtHost({ ...intent }, bindings), /SUBLIST_NESTED_CONTROL_LOWERING_INVALID/);
}

function validInput() {
  return {
    surface: "data-list-sublist-nested-control-placement",
    templateSnapshot: { templateId: "data_list_form_control_sublist_v1_1", templateScope: "data-list-layout", parentNodeReference: "parent-control", listFieldsSlotReference: "attrs.list-fields", childControlSlotReference: "list-field.control" },
    scope: { parentListId: "9000000000000000001", parentFieldId: "9000000000000000002", parentControlReference: "leave-details" },
    columns: [
      { id: "Text1", idx: "idx-text", name: "Note", type: "text", editable: true, childControlReference: "child-text" },
      { id: "Date1", idx: "idx-date", name: "Date", type: "date", editable: true, childControlReference: "child-date" },
      { id: "Decimal1", idx: "idx-number", name: "Amount", type: "number", editable: true, childControlReference: "child-number" },
      { id: "Bit1", idx: "idx-bit", name: "Approved", type: "boolean", editable: true, childControlReference: "child-bit" }
    ]
  };
}

function json(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }

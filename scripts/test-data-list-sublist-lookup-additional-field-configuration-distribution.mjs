#!/usr/bin/env node
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const plugin = resolve(root, "dist/yeeflow-app-builder-plugin");
const temp = mkdtempSync(resolve(tmpdir(), "yeeflow-phase14-configuration-distribution-"));
const contract = JSON.parse(readFileSync(resolve(root, "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json"), "utf8"));
try {
  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "pipe" });
  const source = await load("source", resolve(root, "packages/app-builder-core-materializer/lib/index.js"));
  const expected = run(source);
  console.log("SUBLIST_LOOKUP_ADDITIONAL_CONFIGURATION_ARTIFACT_SOURCE_PARITY_PASSED");
  const dist = await load("dist", resolve(plugin, "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"));
  assert.deepEqual(run(dist), expected);
  const zip = resolve(temp, "official.zip"), out = resolve(temp, "zip");
  mkdirSync(out, { recursive: true });
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", zip], { cwd: root, stdio: "pipe" });
  execFileSync("unzip", ["-q", zip, "-d", out]);
  const archived = await load("archive", resolve(out, "yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"));
  assert.deepEqual(run(archived), expected);
  console.log("SUBLIST_LOOKUP_ADDITIONAL_CONFIGURATION_ARTIFACT_ARCHIVE_PARITY_PASSED");
  const installed = resolve(temp, "installed/yeeflow-app-builder-plugin");
  cpSync(plugin, installed, { recursive: true });
  assert.deepEqual(run(await load("installed", resolve(installed, "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"))), expected);
  console.log("SUBLIST_LOOKUP_ADDITIONAL_CONFIGURATION_ARTIFACT_INSTALLED_PARITY_PASSED");
  console.log("SUBLIST_LOOKUP_ADDITIONAL_CONFIGURATION_DISTRIBUTION_GATES_PASSED");
} finally { rmSync(temp, { recursive: true, force: true }); }

async function load(surface, file) {
  const module = await import(`${pathToFileURL(file).href}?${surface}`);
  assert.deepEqual(Object.keys(module).sort(), [...contract.runtimeExports].sort());
  if (surface !== "source") assert.doesNotMatch(readFileSync(file, "utf8"), /node_modules|\.ts\b|sourceMappingURL|\/Users\//u);
  assert.equal(typeof module.projectDataListSublistLookupAdditionalFieldIntent, "function");
  return module;
}

function run(core) {
  const input = Object.freeze({
    surface: "data-list-sublist-lookup-additional-field",
    scope: Object.freeze({ parentListId: "2076284286981328899", parentFieldId: "2078724596997828609", layoutId: "2076284286981328917", layoutResourceId: "2076284286981328917", parentSublistBinding: "Text10", parentSublistControlId: "aadfcf31-53bb-43eb-bffa-3dc54aa7756c" }),
    lookup: Object.freeze({ id: "LeaveUsage", idx: "e10ff48d-d5fc-42a1-a3a5-f3a8c521e24d", targetListId: "2076284286981328907", targetListSetId: "2076284286981328898", appId: 41, displayField: "Title", valueField: "LeaveUsage" }),
    source: Object.freeze({ fieldName: "Decimal5", fieldId: "2076284286981328912", order: "2", isShow: true, relationName: "LeaveUsageHours" }),
    destination: Object.freeze({ id: "LeaveUsageHours", idx: "3743eb1d-b47f-4963-94cd-6c7b37cda86f", name: "Leave Usage Hours", type: "number", editable: true, readonly: true, controlBinding: "LeaveUsageHours" }),
  });
  const before = JSON.stringify(input), result = core.projectDataListSublistLookupAdditionalFieldIntent(input);
  assert.equal(JSON.stringify(input), before);
  assert(result.intent && Object.isFrozen(result.intent));
  assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
  for (const invalid of [{ ...input, runtime: {} }, { ...input, destination: { ...input.destination, readonly: false } }, { ...input, source: { ...input.source, relationName: "Other" } }]) assert.equal(core.projectDataListSublistLookupAdditionalFieldIntent(invalid).intent, null);
  return JSON.parse(JSON.stringify(result));
}

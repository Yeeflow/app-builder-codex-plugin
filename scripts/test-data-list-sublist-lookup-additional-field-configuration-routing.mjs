#!/usr/bin/env node
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dataListSublistEmbeddedLookupRoutingPlan } from "./test-fixtures/data-list-sublist-embedded-lookup-routing-plan.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temp = mkdtempSync(resolve(tmpdir(), "yeeflow-phase14-configuration-routing-"));

try {
  const source = readFileSync(resolve(root, "scripts/materialize-full-app-generated-final.mjs"), "utf8");
  for (const token of [
    "DATA_LIST_SUBLIST_LOOKUP_ADDITIONAL_CONFIGURATION_CORE_ROUTE_START",
    "applyDataListSublistLookupAdditionalFieldConfigurationAtHost",
    "coreProjectDataListSublistLookupAdditionalFieldIntent",
  ]) assert(source.includes(token), `Missing configuration-only route token: ${token}`);
  assert.doesNotMatch(source, /lookupAdditional.*(?:event|writeback|targetRecord|clearSelection)/iu, "The configuration route must not implement runtime behavior.");

  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "pipe" });
  const first = await materialize(root, "source", 1);
  const second = await materialize(root, "source", 2);
  assert.deepEqual(first.normalized, second.normalized, "Configuration generation must be deterministic.");
  assertConfiguration(first);
  console.log("SUBLIST_LOOKUP_ADDITIONAL_CONFIGURATION_SOURCE_ROUTING_PASSED");
  console.log("SUBLIST_LOOKUP_ADDITIONAL_CONFIGURATION_DETERMINISM_PASSED");

  const archive = resolve(temp, "plugin.zip");
  const extracted = resolve(temp, "archive");
  mkdirSync(extracted, { recursive: true });
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", archive], { cwd: root, stdio: "pipe" });
  execFileSync("unzip", ["-q", archive, "-d", extracted]);
  const archived = await materialize(resolve(extracted, "yeeflow-app-builder-plugin"), "archive", 1);
  assertConfiguration(archived);
  assert.deepEqual(archived.normalized, first.normalized);
  console.log("SUBLIST_LOOKUP_ADDITIONAL_CONFIGURATION_ARCHIVE_ROUTING_PASSED");

  const installed = resolve(temp, "installed", "yeeflow-app-builder-plugin");
  cpSync(resolve(root, "dist/yeeflow-app-builder-plugin"), installed, { recursive: true });
  const installedResult = await materialize(installed, "installed", 1);
  assertConfiguration(installedResult);
  assert.deepEqual(installedResult.normalized, first.normalized);
  console.log("SUBLIST_LOOKUP_ADDITIONAL_CONFIGURATION_INSTALLED_ROUTING_PASSED");

  await assertRejects(root, "wrong-scope", { target: true, addition: true, malformedAddition: true }, "SUBLIST_LOOKUP_ADDITIONAL_CONFIGURATION_SCOPE_MISMATCH");
  const noAddition = await materialize(root, "no-addition", 1, { target: true, addition: false });
  assert.equal(noAddition.lookup.control.attrs.addition, undefined);
  assert.equal(noAddition.destination.control.readonly, undefined);
  console.log("SUBLIST_LOOKUP_ADDITIONAL_CONFIGURATION_SCOPE_GATES_PASSED");

  const rollback = resolve(temp, "rollback-plugin");
  cpSync(root, rollback, { recursive: true, filter: (path) => !path.includes("/.git") && !path.includes("/node_modules") });
  const rollbackSource = readFileSync(resolve(rollback, "scripts/materialize-full-app-generated-final.mjs"), "utf8")
    .replace("if (lookupField) return applyDataListSublistLookupAdditionalFieldConfigurationAtHost({ lookupField, variable, lookupAdditionalMappings, listId, parentFieldId, layoutId, parentBinding, parentControlId });", "if (lookupField) return lookupField;")
    .replace("destinationReadonly: readonlyLookupDestinations.has(variable.id)", "destinationReadonly: false");
  writeFileSync(resolve(rollback, "scripts/materialize-full-app-generated-final.mjs"), rollbackSource);
  const rollbackResult = await materialize(rollback, "rollback", 1);
  assert.equal(rollbackResult.lookup.control.attrs.addition, undefined);
  assert.equal(rollbackResult.destination.control.readonly, undefined);
  console.log("SUBLIST_LOOKUP_ADDITIONAL_CONFIGURATION_LEGACY_ROLLBACK_PASSED");
} finally {
  rmSync(temp, { recursive: true, force: true });
}

async function materialize(surface, label, run, options = { target: true, addition: true }) {
  const cwd = resolve(temp, `${label}-${run}`);
  const specification = resolve(cwd, "functional-specification.md");
  const plan = resolve(cwd, "yeeflow-app-plan.md");
  const out = resolve(cwd, "out");
  mkdirSync(cwd, { recursive: true });
  writeFileSync(specification, "# Functional Specification\n\n| Application Name | Lookup Additional Configuration |\n");
  writeFileSync(plan, dataListSublistEmbeddedLookupRoutingPlan(options));
  const module = await import(`${pathToFileURL(resolve(surface, "scripts/materialize-full-app-generated-final.mjs")).href}?${label}-${run}`);
  const result = module.materializeFullAppGeneratedFinal({ cwd, functionalSpec: specification, appPlan: plan, outDir: out, allowFixtureApiIdsForTests: true });
  assert.equal(result.status, "pass", JSON.stringify(result.findings));
  const decoded = JSON.parse(readFileSync(result.outputs.decodedResource, "utf8"));
  const balance = decoded.Childs.find((item) => item.List?.Title === "Employee Leave Balances");
  const resource = JSON.parse(balance.Layouts.find((item) => item.Type === 1).LayoutView);
  const sublist = find(resource, (item) => item?.type === "list" && Array.isArray(item?.attrs?.["list-fields"]))[0];
  const lookup = sublist.attrs["list-fields"].find((item) => item.id === "LeaveUsage");
  const destination = sublist.attrs["list-fields"].find((item) => item.id === "LeaveUsageHours") || { control: {} };
  return { normalized: JSON.parse(JSON.stringify(decoded).replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/giu, "<uuid>")), lookup, destination, sublist };
}

async function assertRejects(surface, label, options, code) {
  const cwd = resolve(temp, label);
  const specification = resolve(cwd, "functional-specification.md");
  const plan = resolve(cwd, "yeeflow-app-plan.md");
  mkdirSync(cwd, { recursive: true });
  writeFileSync(specification, "# Functional Specification\n");
  writeFileSync(plan, dataListSublistEmbeddedLookupRoutingPlan(options));
  const module = await import(`${pathToFileURL(resolve(surface, "scripts/materialize-full-app-generated-final.mjs")).href}?${label}`);
  assert.throws(() => module.materializeFullAppGeneratedFinal({ cwd, functionalSpec: specification, appPlan: plan, outDir: resolve(cwd, "out"), allowFixtureApiIdsForTests: true }), new RegExp(code));
}

function assertConfiguration(result) {
  assert.equal(result.lookup.control.type, "lookup");
  assert.equal(result.lookup.control.attrs.listid, "2076284286981328907");
  assert.equal(result.lookup.control.attrs.listsetid, "2076284286981328898");
  assert.deepEqual(result.lookup.control.attrs.addition, [{ FieldName: "Decimal5", FieldID: "2076284286981328912", IsShow: true, RelationName: "LeaveUsageHours", Value: null, Order: "2" }]);
  assert.equal(result.destination.control.readonly, true);
  assert.equal(result.sublist.attrs["list-variables"].find((item) => item.id === "LeaveUsage").lookupAddition, undefined, "Host-only plan metadata must not serialize into list variables.");
}

function find(value, predicate, output = []) {
  if (Array.isArray(value)) value.forEach((item) => find(item, predicate, output));
  else if (value && typeof value === "object") {
    if (predicate(value)) output.push(value);
    Object.values(value).forEach((item) => find(item, predicate, output));
  }
  return output;
}

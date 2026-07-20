#!/usr/bin/env node
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dataListSublistEmbeddedLookupRoutingPlan } from "./test-fixtures/data-list-sublist-embedded-lookup-routing-plan.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temp = mkdtempSync(resolve(tmpdir(), "yeeflow-phase13-routing-"));

try {
  const sourceMaterializer = readFileSync(resolve(root, "scripts/materialize-full-app-generated-final.mjs"), "utf8");
  for (const token of [
    "routeDataListSublistEmbeddedLookupAtHost",
    "coreProjectDataListSublistEmbeddedLookupIntent",
    "coreLowerDataListSublistEmbeddedLookupIntentAtHost",
  ]) assert(sourceMaterializer.includes(token), `Missing approved lookup routing token: ${token}`);

  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "pipe" });
  const sourceFirst = await materialize(root, "source", 1);
  const sourceSecond = await materialize(root, "source", 2);
  assert.deepEqual(sourceFirst.normalized, sourceSecond.normalized, "The routed materializer must be deterministic.");
  assertLookupShape(sourceFirst);
  console.log("SUBLIST_EMBEDDED_LOOKUP_SOURCE_ROUTING_PASSED");
  console.log("SUBLIST_EMBEDDED_LOOKUP_DETERMINISM_PASSED");

  const archive = resolve(temp, "plugin.zip");
  const extracted = resolve(temp, "archive");
  mkdirSync(extracted, { recursive: true });
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", archive], { cwd: root, stdio: "pipe" });
  execFileSync("unzip", ["-q", archive, "-d", extracted]);
  const archiveResult = await materialize(resolve(extracted, "yeeflow-app-builder-plugin"), "archive", 1);
  assertLookupShape(archiveResult);
  assert.deepEqual(archiveResult.normalized, sourceFirst.normalized);
  console.log("SUBLIST_EMBEDDED_LOOKUP_ARCHIVE_ROUTING_PASSED");

  const installed = resolve(temp, "installed", "yeeflow-app-builder-plugin");
  cpSync(resolve(root, "dist/yeeflow-app-builder-plugin"), installed, { recursive: true });
  const installedResult = await materialize(installed, "installed", 1);
  assertLookupShape(installedResult);
  assert.deepEqual(installedResult.normalized, sourceFirst.normalized);
  console.log("SUBLIST_EMBEDDED_LOOKUP_INSTALLED_ROUTING_PASSED");

  const missingTarget = await materialize(root, "missing-target", 1, { target: false });
  assert.equal(missingTarget.field.type, "lookup");
  assert.equal(missingTarget.field.control.attrs.listid, undefined, "Missing direct target evidence must retain Legacy fallback rather than infer a target.");
  assert.equal(missingTarget.field.control.attrs.listsetid, undefined);
  console.log("SUBLIST_EMBEDDED_LOOKUP_ROUTING_SCOPE_GATES_PASSED");

  // A temporary copy removes only the new bridge. The legacy fallback must
  // remain executable and must not fabricate target or child-resource IDs.
  const rollback = resolve(temp, "rollback-plugin");
  cpSync(root, rollback, { recursive: true, filter: (path) => !path.includes("/.git") && !path.includes("/node_modules") });
  const rollbackSource = readFileSync(resolve(rollback, "scripts/materialize-full-app-generated-final.mjs"), "utf8")
    .replace(/\n  \/\/ DATA_LIST_SUBLIST_EMBEDDED_LOOKUP_CORE_ROUTE_START[\s\S]*?\/\/ DATA_LIST_SUBLIST_LOOKUP_ADDITIONAL_CONFIGURATION_CORE_ROUTE_END\n/, "\n")
    .replace(/\nfunction routeDataListSublistEmbeddedLookupAtHost\([\s\S]*?\n}\n\n\nfunction routeDataListSublistNestedControlPlacementAtHost/, "\nfunction routeDataListSublistNestedControlPlacementAtHost");
  assert(!rollbackSource.includes("function routeDataListSublistEmbeddedLookupAtHost"));
  writeFileSync(resolve(rollback, "scripts/materialize-full-app-generated-final.mjs"), rollbackSource);
  const rollbackResult = await materialize(rollback, "rollback", 1);
  assert.equal(rollbackResult.field.type, "lookup");
  assert.equal(rollbackResult.field.control.type, "lookup");
  assert.equal(rollbackResult.field.control.attrs.listid, undefined);
  console.log("SUBLIST_EMBEDDED_LOOKUP_LEGACY_ROLLBACK_PASSED");
} finally {
  rmSync(temp, { recursive: true, force: true });
}

async function materialize(surface, label, run, planOptions = {}) {
  const cwd = resolve(temp, `${label}-${run}`);
  const specification = resolve(cwd, "functional-specification.md");
  const plan = resolve(cwd, "yeeflow-app-plan.md");
  const out = resolve(cwd, "out");
  mkdirSync(cwd, { recursive: true });
  writeFileSync(specification, "# Functional Specification\n\n| Application Name | Lookup Routing |\n");
  writeFileSync(plan, dataListSublistEmbeddedLookupRoutingPlan(planOptions));
  const module = await import(`${pathToFileURL(resolve(surface, "scripts/materialize-full-app-generated-final.mjs")).href}?${label}-${run}`);
  const result = module.materializeFullAppGeneratedFinal({
    cwd,
    functionalSpec: specification,
    appPlan: plan,
    outDir: out,
    allowFixtureApiIdsForTests: true,
  });
  assert.equal(result.status, "pass", JSON.stringify(result.findings));
  const decoded = JSON.parse(readFileSync(result.outputs.decodedResource, "utf8"));
  const balance = decoded.Childs.find((item) => item.List?.Title === "Employee Leave Balances");
  const detail = balance.Layouts.find((item) => item.Type === 1);
  const resource = JSON.parse(detail.LayoutView);
  const sublist = find(resource, (item) => item?.type === "list" && Array.isArray(item?.attrs?.["list-fields"]))[0];
  assert(sublist, "Expected one Data List Sublist control.");
  return {
    normalized: JSON.parse(JSON.stringify(decoded).replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/giu, "<uuid>")),
    field: sublist.attrs["list-fields"][0],
  };
}

function assertLookupShape(result) {
  assert.equal(result.field.type, "lookup");
  assert.equal(result.field.control.type, "lookup");
  assert.equal(result.field.control.attrs.listid, "2076284286981328907");
  assert.equal(result.field.control.attrs.listsetid, "2076284286981328898");
  assert.equal(result.field.control.attrs.listfield, "Title");
  assert.equal(result.field.control.attrs.addition, undefined);
}

function find(value, predicate, output = []) {
  if (Array.isArray(value)) value.forEach((item) => find(item, predicate, output));
  else if (value && typeof value === "object") {
    if (predicate(value)) output.push(value);
    Object.values(value).forEach((item) => find(item, predicate, output));
  }
  return output;
}

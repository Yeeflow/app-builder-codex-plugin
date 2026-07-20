#!/usr/bin/env node
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dataListSublistIdentityControlRoutingPlan } from "./test-fixtures/data-list-sublist-identity-control-routing-plan.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temp = mkdtempSync(resolve(tmpdir(), "yeeflow-phase16-routing-"));
try {
  const source = readFileSync(resolve(root, "scripts/materialize-full-app-generated-final.mjs"), "utf8");
  for (const token of ["DATA_LIST_SUBLIST_IDENTITY_CONFIGURATION_CORE_ROUTE_START", "routeDataListSublistIdentityControlAtHost", "coreProjectDataListSublistIdentityControlIntent", "coreLowerDataListSublistIdentityControlIntentAtHost", "DATA_LIST_SUBLIST_IDENTITY_CONFIGURATION_CORE_ROUTE_END"]) assert(source.includes(token));
  const first = await materialize(root, "source", 1, {});
  const second = await materialize(root, "source", 2, {});
  assert.deepEqual(first.normalized, second.normalized);
  assertIdentity(first);
  console.log("SUBLIST_IDENTITY_CONTROL_SOURCE_ROUTING_PASSED");
  console.log("SUBLIST_IDENTITY_CONTROL_DETERMINISM_PASSED");
  const archive = resolve(temp, "plugin.zip"), extracted = resolve(temp, "archive"); mkdirSync(extracted, { recursive: true });
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", archive], { cwd: root, stdio: "pipe" }); execFileSync("unzip", ["-q", archive, "-d", extracted]);
  const archived = await materialize(resolve(extracted, "yeeflow-app-builder-plugin"), "archive", 1, {}); assertIdentity(archived); assert.deepEqual(archived.normalized, first.normalized); console.log("SUBLIST_IDENTITY_CONTROL_ARCHIVE_ROUTING_PASSED");
  const installed = resolve(temp, "installed", "yeeflow-app-builder-plugin"); cpSync(resolve(root, "dist/yeeflow-app-builder-plugin"), installed, { recursive: true });
  const installedResult = await materialize(installed, "installed", 1, {}); assertIdentity(installedResult); assert.deepEqual(installedResult.normalized, first.normalized); console.log("SUBLIST_IDENTITY_CONTROL_INSTALLED_ROUTING_PASSED");
  const file = await materialize(root, "file", 1, { user: false, file: true }); assert.equal(file.field.control.type, "file-upload"); assert.equal(file.field.control.attrs.ver, undefined); console.log("SUBLIST_IDENTITY_CONTROL_SCOPE_GATES_PASSED");
  const rollback = resolve(temp, "rollback"); cpSync(root, rollback, { recursive: true, filter: (path) => !path.includes("/.git") && !path.includes("/node_modules") });
  const rollbackSource = readFileSync(resolve(rollback, "scripts/materialize-full-app-generated-final.mjs"), "utf8").replace(/\n  \/\/ DATA_LIST_SUBLIST_IDENTITY_CONFIGURATION_CORE_ROUTE_START[\s\S]*?\/\/ DATA_LIST_SUBLIST_IDENTITY_CONFIGURATION_CORE_ROUTE_END\n/, "\n").replace(/\nfunction routeDataListSublistIdentityControlAtHost\([\s\S]*?\n}\n\nfunction applyDataListSublistLookupAdditionalFieldConfigurationAtHost/, "\nfunction applyDataListSublistLookupAdditionalFieldConfigurationAtHost");
  writeFileSync(resolve(rollback, "scripts/materialize-full-app-generated-final.mjs"), rollbackSource);
  const legacy = await materialize(rollback, "rollback", 1, {}); assertIdentity(legacy); console.log("SUBLIST_IDENTITY_CONTROL_LEGACY_ROLLBACK_PASSED");
} finally { rmSync(temp, { recursive: true, force: true }); }

async function materialize(surface, label, run, options) { const cwd = resolve(temp, `${label}-${run}`), spec = resolve(cwd, "functional-specification.md"), plan = resolve(cwd, "yeeflow-app-plan.md"), out = resolve(cwd, "out"); mkdirSync(cwd, { recursive: true }); writeFileSync(spec, "# Functional Specification\n\n| Application Name | Identity routing |\n"); writeFileSync(plan, dataListSublistIdentityControlRoutingPlan(options)); const module = await import(`${pathToFileURL(resolve(surface, "scripts/materialize-full-app-generated-final.mjs")).href}?${label}-${run}`); const result = module.materializeFullAppGeneratedFinal({ cwd, functionalSpec: spec, appPlan: plan, outDir: out, allowFixtureApiIdsForTests: true }); assert.equal(result.status, "pass", JSON.stringify(result.findings)); const decoded = JSON.parse(readFileSync(result.outputs.decodedResource, "utf8")); const list = decoded.Childs.find((item) => item.List?.Title === "Employee Leave Balances"); const resource = JSON.parse(list.Layouts.find((item) => item.Type === 1).LayoutView); const sublist = find(resource, (x) => x?.type === "list" && Array.isArray(x?.attrs?.["list-fields"]))[0]; return { normalized: JSON.parse(JSON.stringify(decoded).replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/giu, "<uuid>")), field: sublist.attrs["list-fields"].find((item) => item.id === "Approver") || sublist.attrs["list-fields"][1] }; }
function assertIdentity(result) { assert.equal(result.field.type, "user"); assert.equal(result.field.control.type, "identity-picker"); assert.equal(result.field.control.attrs.list_field, true); assert.equal(result.field.control.attrs.list_field_binding, "Text7"); assert.equal(result.field.control.attrs.list_control_id, result.field.control.attrs.list_control_id); }
function find(value, predicate, output = []) { if (Array.isArray(value)) value.forEach((x) => find(x, predicate, output)); else if (value && typeof value === "object") { if (predicate(value)) output.push(value); Object.values(value).forEach((x) => find(x, predicate, output)); } return output; }

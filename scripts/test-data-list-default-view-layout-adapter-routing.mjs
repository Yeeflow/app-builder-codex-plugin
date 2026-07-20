#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pluginDist = resolve(root, "dist/yeeflow-app-builder-plugin");
const historicalZip = resolve(root, "dist/yeeflow-app-builder-plugin-0.9.71.zip");
const historicalZipSha256 = "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2";
const fixture = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/data-list-default-view-layout-routing.v0.1.0.json"), "utf8"));
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-data-list-layoutview-routing-"));

assert.equal(sha256(readFileSync(historicalZip)), historicalZipSha256, "Historical ZIP checksum must match before LayoutView routing proof.");

try {
  const materializerSource = readFileSync(resolve(root, "scripts/materialize-full-app-generated-final.mjs"), "utf8");
  assert.equal(countCalls(materializerSource, "buildDataListViewLayoutViewChecked"), fixture.expectedCallSites.checkedCallExpressions, "The checked LayoutView caller count must remain stable.");
  assert.equal((materializerSource.match(/routeDefaultViewThroughCore: true/g) || []).length, fixture.expectedCallSites.defaultCoreRouteCallExpressions, "Only the default view may enter the Core route.");
  assert.equal((materializerSource.match(/routeAdditionalViewThroughCore: true/g) || []).length, 1, "Only the approved additional Type 0 view loop may enter the additional Core route.");
  assert.equal((materializerSource.match(/routeAdditionalViewThroughCore: false/g) || []).length, 0, "No Legacy-excluded additional route marker may remain after the approved cutover.");
  assert.match(materializerSource, /function buildDataListViewLayoutView\(/u, "The Legacy LayoutView helper must remain callable for rollback.");
  assert.match(materializerSource, /function buildDataListDefaultViewLayoutViewThroughCore\(/u, "The scoped Core LayoutView bridge must remain present.");
  assert.match(materializerSource, /function buildDataListAdditionalViewLayoutViewThroughCore\(/u, "The additional-view Core bridge must remain narrow and callable.");
  assert.match(materializerSource, /viewIntent: \{ \.\.\.viewRecord, isDefault: false \}/u, "The additional route must force a non-default immutable intent.");
  assert.match(materializerSource, /slugify\(viewName\).*additional-view/u, "The additional route must construct a stable non-default scope outside Core.");

  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
  const legacyRoot = createLegacyRollbackSurface(resolve(temporary, "legacy-baseline"), root);
  const baseline = await materializeAll(legacyRoot, "legacy");
  const sourceFirst = await materializeAll(root, "source-first");
  const sourceSecond = await materializeAll(root, "source-second");
  assertParity(baseline, sourceFirst, "source");
  assert.deepEqual(sourceFirst.normalized, sourceSecond.normalized, "The Core-routed default LayoutView output must be deterministic after UUID normalization.");
  console.log("DATA_LIST_LAYOUTVIEW_ADAPTER_ROUTING_PASSED");
  console.log("DATA_LIST_LAYOUTVIEW_SOURCE_ROUTING_PASSED");
  console.log("DATA_LIST_LAYOUTVIEW_MATERIALIZER_DETERMINISM_PASSED");
  console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_ADAPTER_ROUTING_PASSED");
  console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_SOURCE_ROUTING_PASSED");

  const proofZip = resolve(temporary, "proof.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", proofZip], { cwd: root, stdio: "inherit" });
  const archiveRoot = resolve(temporary, "archive");
  mkdirSync(archiveRoot, { recursive: true });
  execFileSync("unzip", ["-q", proofZip, "-d", archiveRoot]);
  const archive = await materializeAll(resolve(archiveRoot, "yeeflow-app-builder-plugin"), "archive");
  assertParity(baseline, archive, "archive");
  console.log("DATA_LIST_LAYOUTVIEW_ARCHIVE_ROUTING_PASSED");
  console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_ARCHIVE_ROUTING_PASSED");

  const installedRoot = resolve(temporary, "installed/yeeflow-app-builder-plugin");
  cpSync(pluginDist, installedRoot, { recursive: true });
  const installed = await materializeAll(installedRoot, "installed");
  assertParity(baseline, installed, "installed");
  console.log("DATA_LIST_LAYOUTVIEW_INSTALLED_ROUTING_PASSED");
  console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_INSTALLED_ROUTING_PASSED");
  console.log("DATA_LIST_LAYOUTVIEW_MATERIALIZER_INTEGRATION_PARITY_PASSED");
  console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_MATERIALIZER_INTEGRATION_PARITY_PASSED");
  console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_MATERIALIZER_DETERMINISM_PASSED");
  console.log(`DATA_LIST_LAYOUTVIEW_ROUTING_SCOPE_GATES_PASSED defaultCases=${fixture.cases.length} additionalViewsCoreRouted=1`);
  console.log(`DATA_LIST_ADDITIONAL_VIEW_LAYOUT_ROUTING_SCOPE_GATES_PASSED matrixCases=${fixture.cases.length} additionalType0CoreRoutes=1 defaultRouteUnchanged=1`);
  console.log("DATA_LIST_LAYOUTVIEW_LEGACY_ROLLBACK_PASSED");
  console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_LEGACY_ROLLBACK_PASSED");
  assert.equal(sha256(readFileSync(historicalZip)), historicalZipSha256, "Historical ZIP checksum must match after LayoutView routing proof.");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

function createLegacyRollbackSurface(target, sourceRoot) {
  cpSync(resolve(sourceRoot, "scripts"), resolve(target, "scripts"), { recursive: true });
  cpSync(resolve(sourceRoot, "docs/reference"), resolve(target, "docs/reference"), { recursive: true });
  cpSync(resolve(pluginDist, "core"), resolve(target, "core"), { recursive: true });
  const materializer = resolve(target, "scripts/materialize-full-app-generated-final.mjs");
  const source = readFileSync(materializer, "utf8");
  const legacy = source
    .replace("  projectDataListDefaultViewLayout as coreProjectDataListDefaultViewLayout,\n", "")
    .replace("  projectDataListAdditionalViewLayout as coreProjectDataListAdditionalViewLayout,\n", "")
    .replace(/  const layoutView = routeDefaultViewThroughCore\n\s+\? buildDataListDefaultViewLayoutViewThroughCore\(\{ fields, viewRecord, listName, findings \}\)\n\s+: routeAdditionalViewThroughCore\n\s+\? buildDataListAdditionalViewLayoutViewThroughCore\(\{ fields, viewRecord, listName, findings \}\)\n\s+: buildDataListViewLayoutView\(\{ fields, viewRecord \}\);/u, "  const layoutView = buildDataListViewLayoutView({ fields, viewRecord });")
    .replace("if (!routeDefaultViewThroughCore && !routeAdditionalViewThroughCore && viewRecord && !isNoFixedDataViewFilterText(plannedFilterText) && layoutView.filter.length === 0) {", "if (viewRecord && !isNoFixedDataViewFilterText(plannedFilterText) && layoutView.filter.length === 0) {");
  const bridgeStart = legacy.indexOf("\nfunction buildDataListDefaultViewLayoutViewThroughCore(");
  const bridgeEnd = legacy.indexOf("\nfunction buildDataViewLayoutColumn", bridgeStart);
  assert.ok(bridgeStart >= 0 && bridgeEnd > bridgeStart, "Rollback surface must locate the selected LayoutView bridge.");
  const restoredLegacy = `${legacy.slice(0, bridgeStart)}${legacy.slice(bridgeEnd)}`;
  assert.notEqual(restoredLegacy, source, "Rollback surface must restore only the selected LayoutView route.");
  assert.ok(!restoredLegacy.includes("coreProjectDataListDefaultViewLayout"), "Rollback surface must remove the selected Materializer Core binding.");
  assert.ok(restoredLegacy.includes("coreLowerFixedFilterProjectionAtHost"), "Rollback retains the Local Runtime binding while restoring both independently routed LayoutView call paths.");
  writeFileSync(materializer, restoredLegacy, "utf8");
  return target;
}

async function materializeAll(surfaceRoot, label) {
  const results = [];
  for (const [index, testCase] of fixture.cases.entries()) results.push(await materialize(surfaceRoot, `${label}-${index}`, testCase));
  return results;
}

async function materialize(surfaceRoot, label, testCase) {
  const fixtureRoot = resolve(temporary, label);
  mkdirSync(fixtureRoot, { recursive: true });
  const spec = resolve(fixtureRoot, "functional-specification.md");
  const plan = resolve(fixtureRoot, "yeeflow-app-plan.md");
  const output = resolve(fixtureRoot, "output");
  writeFileSync(spec, `${testCase.functionalSpecificationLines.join("\n")}\n`, "utf8");
  writeFileSync(plan, `${testCase.appPlanLines.join("\n")}\n`, "utf8");
  const materializer = await import(`${pathToFileURL(resolve(surfaceRoot, "scripts/materialize-full-app-generated-final.mjs")).href}?routing=${label}`);
  const result = materializer.materializeFullAppGeneratedFinal({ cwd: fixtureRoot, functionalSpec: spec, appPlan: plan, outDir: output, allowFixtureApiIdsForTests: true });
  if (testCase.id.includes("malformed-filter")) {
    assert.equal(result.status, "fail", `${label} malformed filter must preserve the Legacy failure boundary.`);
    assert.ok(result.findings.some((finding) => finding.code === "DATA_VIEW_FILTER_PLANNED_BUT_NOT_MATERIALIZED"), `${label} must retain malformed-filter finding behavior.`);
    return { status: result.status, findings: normalize(result.findings), outputFiles: [] };
  }
  assert.equal(result.status, "pass", `${label} materialization must pass.`);
  const decoded = JSON.parse(readFileSync(result.outputs.decodedResource, "utf8"));
  const child = decoded.Childs?.find((candidate) => candidate.List?.Title === "Routing Records");
  assert.ok(child, `${label} must produce the Data List fixture.`);
  const layouts = child.Layouts.filter((layout) => layout.Type === 0).map((layout) => ({ ...layout, parsed: JSON.parse(layout.LayoutView) }));
  const defaultLayout = layouts.find((layout) => layout.IsDefault === true);
  assert.ok(defaultLayout, `${label} must produce a default LayoutView.`);
  assert.equal(defaultLayout.parsed.layout[0]?.FieldName, "Title", `${label} must retain Title-first behavior.`);
  assert.ok(defaultLayout.parsed.layout.length <= 12, `${label} must retain the 12-column maximum.`);
  assert.deepEqual(defaultLayout.parsed.query.slice(-5).map((field) => field.FieldName), ["ListDataID", "CreatedBy", "ModifiedBy", "Created", "Modified"], `${label} must retain static query fields.`);
  for (const column of defaultLayout.parsed.layout) assert.ok(column.FieldID, `${label} must propagate supplied FieldIDs.`);
  if (testCase.id.includes("fixed-filters")) {
    assert.equal(defaultLayout.parsed.filter.length, 2, `${label} must lower both default-view fixed filters.`);
    const additional = layouts.find((layout) => !layout.IsDefault);
    assert.ok(additional, `${label} must retain the additional Type 0 view.`);
  }
  return { normalized: normalize(decoded), outputFiles: readdirSync(output).sort(), findings: normalize(result.findings) };
}

function assertParity(expected, actual, surface) {
  assert.deepEqual(actual, expected, `${surface} must exactly match the temporary Legacy baseline after UUID normalization.`);
}

function countCalls(source, name) {
  return [...source.matchAll(new RegExp(`\\b${name}\\s*\\(`, "gu"))].length - 1;
}
function normalize(value) { return JSON.parse(JSON.stringify(value).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu, "<uuid>")); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

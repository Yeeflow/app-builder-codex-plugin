#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dataListSublistScalarSummaryProductionRoutingPlan } from "./test-fixtures/data-list-sublist-scalar-summary-production-routing-plan.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/data-list-sublist-scalar-summary-intent-production-routing.v0.1.0.json"), "utf8"));
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase10e-summary-baseline-"));

try {
  const source = readFileSync(resolve(root, "scripts/materialize-full-app-generated-final.mjs"), "utf8");
  assert.doesNotMatch(source, /DATA_LIST_SUBLIST_SCALAR_SUMMARY_INTENT_CORE_ROUTE_START/u, "This precondition must run against the unchanged Legacy production path.");
  const first = await materialize(1);
  const second = await materialize(2);
  assert.deepEqual(first.normalizedDecoded, second.normalizedDecoded, "The unchanged baseline must be deterministic.");
  assert.equal(first.summaries.length, corpus.eligibleStaticCases.length + 1, JSON.stringify(first.summaries));
  for (const expected of corpus.eligibleStaticCases) {
    const summary = first.summaries.find((item) => item.field === expected.field && item.type === expected.type);
    assert.ok(summary, `Missing static baseline summary: ${expected.id}`);
    assert.equal(summary.binding, null, `Static baseline summary must not bind a temporary variable: ${expected.id}`);
  }
  const tempSummary = first.summaries.find((item) => item.binding?.prefix === "__temp_" && item.binding?.value === corpus.requiredTempVar);
  assert.ok(tempSummary, "The retained temporary-variable summary must remain observable downstream.");
  assert.deepEqual(first.tempVars, [{ id: corpus.requiredTempVar }], "Legacy must be the sole temporary-variable owner in the baseline.");
  console.log(`SUBLIST_SCALAR_SUMMARY_INTENT_BASELINE_CORPUS_PASSED cases=${corpus.caseCount}`);
  console.log("SUBLIST_SCALAR_SUMMARY_INTENT_BASELINE_TEMP_VARIABLE_OWNERSHIP_PASSED");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

async function materialize(run) {
  const cwd = resolve(temporary, `run-${run}`);
  const specification = resolve(cwd, "functional-specification.md");
  const plan = resolve(cwd, "yeeflow-app-plan.md");
  const outDir = resolve(cwd, "output");
  mkdirSync(cwd, { recursive: true });
  writeFileSync(specification, "# Functional Specification: Scalar Summary Routing\n\n| Application Name | Employee Leave Balances |\n", "utf8");
  writeFileSync(plan, dataListSublistScalarSummaryProductionRoutingPlan(), "utf8");
  const materializer = await import(`${pathToFileURL(resolve(root, "scripts/materialize-full-app-generated-final.mjs")).href}?phase10e-baseline=${run}`);
  const result = materializer.materializeFullAppGeneratedFinal({ cwd, functionalSpec: specification, appPlan: plan, outDir, allowFixtureApiIdsForTests: true });
  assert.equal(result.status, "pass", JSON.stringify(result.findings || []));
  const decoded = JSON.parse(readFileSync(result.outputs.decodedResource, "utf8"));
  const list = decoded.Childs.find((entry) => entry.List?.Title === "Employee Leave Balances");
  const form = list.Layouts.find((entry) => entry.Type === 1 && entry.Title === "Employee Leave Balance Form");
  const control = findNodes(JSON.parse(form.LayoutView), (value) => value?.type === "list" && value?.binding === "Text7")[0];
  assert.ok(control, "The actual materializer must emit the Sublist form control.");
  return {
    summaries: control.attrs?.["list-fields-summary"] || [],
    tempVars: (JSON.parse(form.LayoutView).tempVars || []).map((item) => ({ id: item.id })),
    normalizedDecoded: normalize(decoded),
  };
}

function findNodes(value, predicate, output = []) { if (Array.isArray(value)) { value.forEach((entry) => findNodes(entry, predicate, output)); return output; } if (!value || typeof value !== "object") return output; if (predicate(value)) output.push(value); Object.values(value).forEach((entry) => findNodes(entry, predicate, output)); return output; }
function normalize(value) { return JSON.parse(JSON.stringify(value).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu, "<control-uuid>")); }

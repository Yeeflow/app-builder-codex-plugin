#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dataListSublistDynamicSummaryProductionRoutingPlan } from "./test-fixtures/data-list-sublist-dynamic-summary-production-routing-plan.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase11f-baseline-"));
try {
  const source = readFileSync(resolve(root, "scripts/materialize-full-app-generated-final.mjs"), "utf8");
  assert.doesNotMatch(source, /DATA_LIST_SUBLIST_DYNAMIC_SUMMARY_CORE_ROUTE_START/u);
  const first = await materialize(1); const second = await materialize(2);
  assert.deepEqual(first.normalized, second.normalized);
  assert.deepEqual(first.summaries.map((item) => item.binding), [{ prefix: "__list_", value: "Decimal1" }, { prefix: "__temp_", value: "leaveTotalTemp" }]);
  assert.deepEqual(first.tempVars.map((item) => item.id), ["leaveTotalTemp"]);
  console.log("SUBLIST_DYNAMIC_SUMMARY_BASELINE_CORPUS_PASSED cases=12");
  console.log("SUBLIST_DYNAMIC_SUMMARY_BASELINE_TEMP_VARIABLE_OWNERSHIP_PASSED");
} finally { rmSync(temporary, { recursive: true, force: true }); }

async function materialize(run) { const cwd = resolve(temporary, `run-${run}`), specification = resolve(cwd, "functional-specification.md"), plan = resolve(cwd, "yeeflow-app-plan.md"), outDir = resolve(cwd, "out"); mkdirSync(cwd, { recursive: true }); writeFileSync(specification, "# Functional Specification: Dynamic Summary Routing\n\n| Application Name | Employee Leave Balances |\n"); writeFileSync(plan, dataListSublistDynamicSummaryProductionRoutingPlan()); const materializer = await import(`${pathToFileURL(resolve(root, "scripts/materialize-full-app-generated-final.mjs")).href}?baseline=${run}`); const result = materializer.materializeFullAppGeneratedFinal({ cwd, functionalSpec: specification, appPlan: plan, outDir, allowFixtureApiIdsForTests: true }); assert.equal(result.status, "pass", JSON.stringify(result.findings)); const decoded = JSON.parse(readFileSync(result.outputs.decodedResource, "utf8")); const list = decoded.Childs.find((item) => item.List?.Title === "Employee Leave Balances"), form = list.Layouts.find((item) => item.Type === 1), resource = JSON.parse(form.LayoutView), control = find(resource, (item) => item?.type === "list" && item.binding === "Text7")[0]; return { summaries: control.attrs["list-fields-summary"], tempVars: resource.tempVars || [], normalized: normalize(decoded) }; }
function find(value, predicate, found = []) { if (Array.isArray(value)) value.forEach((item) => find(item, predicate, found)); else if (value && typeof value === "object") { if (predicate(value)) found.push(value); Object.values(value).forEach((item) => find(item, predicate, found)); } return found; }
function normalize(value) { return JSON.parse(JSON.stringify(value).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu, "<uuid>")); }

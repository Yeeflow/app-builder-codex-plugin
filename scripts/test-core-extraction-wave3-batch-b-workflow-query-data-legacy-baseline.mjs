#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/core-extraction-wave3-batch-b-workflow-query-data-static-plan.v0.1.0.json"), "utf8"));
const legacy = await import(pathToFileURL(resolve(root, "compatibility/differential-fixtures/core-extraction-wave3-batch-b-workflow-query-data-static-plan-legacy-baseline.v0.1.0.mjs")).href);

for (const entry of corpus.cases) {
  const input = structuredClone(entry.input);
  const before = structuredClone(input);
  if (entry.error) assert.throws(() => invoke(entry.kind, input), new RegExp(escape(entry.error)));
  else assert.doesNotThrow(() => invoke(entry.kind, input));
  assert.deepEqual(input, before, `LEGACY_BASELINE_INPUT_MUTATED:${entry.id}`);
}
assert.equal(legacy.normalizeWorkflowQueryDataMode("multiple-to-list"), "multiple_to_list_variable");
assert.equal(legacy.buildWorkflowQueryDataProperties({ listId: "1000000000000000002" }).listid, "1000000000000000002");
console.log(`CORE_EXTRACTION_WAVE3_BATCH_B_LEGACY_BASELINE_PASSED cases=${corpus.cases.length}`);

function invoke(kind, input) {
  if (kind === "mode") return legacy.normalizeWorkflowQueryDataMode(input);
  if (kind === "query-properties") return legacy.buildWorkflowQueryDataProperties(input);
  if (kind === "list-variable") return legacy.buildWorkflowListVariable(input);
  if (kind === "loop-properties") return legacy.buildWorkflowLoopProperties(input);
  if (kind === "field-map") return legacy.parseWorkflowFieldMap(input);
  throw new Error(`Unsupported corpus kind: ${kind}`);
}
function escape(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

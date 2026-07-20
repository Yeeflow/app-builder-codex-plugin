#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/core-extraction-wave3-batch-c-data-list-sublist-static-configuration.v0.1.0.json"), "utf8"));
const legacy = await import(pathToFileURL(resolve(root, "compatibility/differential-fixtures/core-extraction-wave3-batch-c-data-list-sublist-static-configuration-legacy-baseline.v0.1.0.mjs")).href);

for (const entry of corpus.cases) {
  const input = structuredClone(entry.input);
  const before = structuredClone(input);
  const result = invoke(legacy, entry.kind, input);
  assert.deepEqual(input, before, `CORE_EXTRACTION_WAVE3_BATCH_C_LEGACY_INPUT_MUTATED:${entry.id}`);
  if (entry.expectedIds) assert.deepEqual(result.map((item) => item.id), entry.expectedIds, `CORE_EXTRACTION_WAVE3_BATCH_C_LEGACY_ROWS:${entry.id}`);
}

console.log(`CORE_EXTRACTION_WAVE3_BATCH_C_LEGACY_BASELINE_PASSED cases=${corpus.cases.length}`);

function invoke(module, kind, input) {
  if (kind === "parse-row-fields") return module.parseSubListRowFields(input);
  if (kind === "parse-summaries") return module.parseSubListSummaries(input);
  if (kind === "normalize-row-type") return module.normalizeSubListRowType(input);
  if (kind === "normalize-control-type") return module.normalizeSubListColumnControlType(input.controlType, input.rowType);
  if (kind === "is-sublist-form-field") return module.isSubListFormField(input.field, input.controlType);
  throw new Error(`CORE_EXTRACTION_WAVE3_BATCH_C_UNKNOWN_CORPUS_KIND:${kind}`);
}

#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/data-list-sublist-lookup-additional-field-writeback-export.v0.1.0.json"), "utf8"));
const core = await import(pathToFileURL(resolve(root, "packages/app-builder-core-materializer/lib/internal/data-list-sublist-lookup-additional-field-intent.js")).href);
const host = await import(pathToFileURL(resolve(root, "runtimes/app-builder-core-local-runtime/lib/internal-data-list-sublist-lookup-additional-field-lowering.js")).href);
const evidence = fixture.validCases[0];
const input = Object.freeze({ surface: "data-list-sublist-lookup-additional-field", scope: Object.freeze(evidence.scope), lookup: Object.freeze({ id: evidence.lookup.id, idx: evidence.lookup.idx, targetListId: evidence.lookup.targetListId, targetListSetId: evidence.lookup.targetListSetId, appId: evidence.lookup.appId, displayField: evidence.lookup.displayField, valueField: evidence.lookup.valueField }), source: Object.freeze(evidence.source), destination: Object.freeze(evidence.destination) });
const before = JSON.stringify(input);
const result = core.projectDataListSublistLookupAdditionalFieldIntentInternal(input);
assert.equal(JSON.stringify(input), before);
assert(result.intent && Object.isFrozen(result) && Object.isFrozen(result.intent));
assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
const lowered = host.lowerDataListSublistLookupAdditionalFieldIntentForTest(result.intent);
assert.deepEqual(lowered, { FieldName: "Decimal5", FieldID: "2076284286981328912", IsShow: true, RelationName: "LeaveUsageHours", Value: null, Order: "2" });
assert.deepEqual(JSON.parse(JSON.stringify(lowered)), lowered);
for (const bad of [
  { ...input, source: { ...input.source, fieldId: "" } },
  { ...input, destination: { ...input.destination, readonly: false } },
  { ...input, source: { ...input.source, relationName: "other" } },
  { ...input, runtime: { event: "selection-change" } },
  { ...input, additionValue: null },
]) { const rejected = core.projectDataListSublistLookupAdditionalFieldIntentInternal(bad); assert.equal(rejected.intent, null); assert(rejected.findings.length); }
assert.throws(() => host.lowerDataListSublistLookupAdditionalFieldIntentForTest(Object.freeze({ ...result.intent, destination: { ...result.intent.destination, readonly: false } })), /SUBLIST_LOOKUP_ADDITIONAL_LOWERING_INVALID/);
console.log("SUBLIST_LOOKUP_ADDITIONAL_WRITEBACK_INTENT_CORE_SHADOW_IMPLEMENTED");
console.log("SUBLIST_LOOKUP_ADDITIONAL_WRITEBACK_HOST_LOWERING_SHADOW_IMPLEMENTED");
console.log("SUBLIST_LOOKUP_ADDITIONAL_WRITEBACK_EXPORT_STATIC_PARITY_PASSED");
console.log("SUBLIST_LOOKUP_ADDITIONAL_WRITEBACK_SERIALIZATION_PARITY_PASSED");
console.log("SUBLIST_LOOKUP_ADDITIONAL_WRITEBACK_CORE_IMMUTABILITY_PASSED");
console.log("SUBLIST_LOOKUP_ADDITIONAL_WRITEBACK_RUNTIME_EXCLUSION_PASSED");

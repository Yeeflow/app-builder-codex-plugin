#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/data-list-lookup-resolution-shadow.v0.1.0.json"), "utf8"));
const core = await import(pathToFileURL(resolve(root, "packages/app-builder-core-materializer/lib/internal/data-list-lookup-resolution-intent.js")).href);
const host = await import(pathToFileURL(resolve(root, "runtimes/app-builder-core-local-runtime/lib/internal-data-list-lookup-resolution-lowering.js")).href);
const legacy = createLegacyHarness();
let successCount = 0;
let hostErrorCount = 0;
let excludedCount = 0;

for (const item of corpus.cases) {
  if (item.kind === "excluded") {
    assert.ok((item.surface || "data-list") !== "data-list" || item.field.controlType !== "lookup", item.id);
    excludedCount += 1;
    continue;
  }
  const input = Object.freeze({
    surface: "data-list",
    sourceResourceKey: "Orders",
    sourceFieldKey: item.field.fieldName,
    sourceFieldOrdinal: 0,
    lookupTarget: item.field.lookupTarget,
    displayName: item.field.displayName,
    controlType: "lookup",
  });
  const beforeInput = JSON.stringify(input);
  const projected = core.projectDataListLookupResolutionIntentInternal(input);
  assert.equal(Object.isFrozen(projected), true, item.id);
  assert.equal(Object.isFrozen(projected.findings), true, item.id);
  assert.equal(JSON.stringify(input), beforeInput, item.id);
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(projected)), item.id);

  if (item.kind === "core-finding") {
    assert.equal(projected.intent, null, item.id);
    assert.equal(projected.findings[0]?.code, item.code, item.id);
    const legacyRules = legacy.rules(item.field, new Map());
    assert.equal(legacyRules, "", item.id);
    continue;
  }
  assert.ok(projected.intent, item.id);
  assert.equal(Object.isFrozen(projected.intent), true, item.id);
  assert.equal(Object.isFrozen(projected.intent.resolutionRequest), true, item.id);
  assert.equal(Object.isFrozen(projected.intent.resolutionRequest.candidateKeys), true, item.id);
  const sourceListId = item.sourceListId || "1000000000000000001";
  const sourceFieldId = item.sourceFieldId || "1000000000000000002";
  const source = Object.freeze({ sourceListId, sourceFieldId, sourceFieldListId: item.sourceFieldListId || sourceListId });
  const targetMap = Object.freeze({
    targetListIdsByLogicalKey: Object.freeze(item.targetMap || {}),
    targetScopesByLogicalKey: Object.freeze(item.targetScopes || {}),
  });
  const beforeMap = JSON.stringify(targetMap);
  if (item.kind === "host-error") {
    assert.throws(() => host.lowerDataListLookupResolutionAtHost(projected.intent, targetMap, source), new RegExp(item.code), item.id);
    assert.equal(JSON.stringify(targetMap), beforeMap, item.id);
    hostErrorCount += 1;
    continue;
  }
  const lowered = host.lowerDataListLookupResolutionAtHost(projected.intent, targetMap, source);
  const legacyRules = legacy.rules(item.field, new Map(Object.entries(item.targetMap)));
  assert.equal(lowered.rules, legacyRules, item.id);
  assert.equal(JSON.parse(lowered.rules).listid, item.targetMap[lowered.matchedCandidateKey], item.id);
  assert.equal(typeof JSON.parse(lowered.rules).listid, "string", item.id);
  assert.equal(JSON.stringify(targetMap), beforeMap, item.id);
  assert.equal(Object.isFrozen(lowered), true, item.id);
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(lowered)), item.id);
  successCount += 1;
}

assert.equal(core.projectDataListLookupResolutionIntentInternal(Object.freeze({ surface: "data-list", sourceResourceKey: "Orders", sourceFieldKey: "Lookup1", sourceFieldOrdinal: 0, lookupTarget: "Customers", displayName: "Customer", controlType: "lookup" })).intent.resolutionRequest.requestId,
  core.projectDataListLookupResolutionIntentInternal(Object.freeze({ surface: "data-list", sourceResourceKey: "Orders", sourceFieldKey: "Lookup1", sourceFieldOrdinal: 0, lookupTarget: "Customers", displayName: "Customer", controlType: "lookup" })).intent.resolutionRequest.requestId);
const validIntent = core.projectDataListLookupResolutionIntentInternal(Object.freeze({ surface: "data-list", sourceResourceKey: "Orders", sourceFieldKey: "Lookup1", sourceFieldOrdinal: 0, lookupTarget: "Customers", displayName: "Customer", controlType: "lookup" })).intent;
assert.throws(() => host.lowerDataListLookupResolutionAtHost(Object.freeze({ ...validIntent, declaredTargetKey: "", resolutionRequest: Object.freeze({ ...validIntent.resolutionRequest, candidateKeys: Object.freeze([]) }) }), Object.freeze({ targetListIdsByLogicalKey: Object.freeze({}), targetScopesByLogicalKey: Object.freeze({}) }), Object.freeze({ sourceListId: "1", sourceFieldId: "2", sourceFieldListId: "1" })), /DATA_LIST_LOOKUP_TARGET_UNRESOLVED/);

console.log("DATA_LIST_LOOKUP_RESOLUTION_CORE_SHADOW_IMPLEMENTED");
console.log("DATA_LIST_LOOKUP_RESOLUTION_HOST_LOWERING_SHADOW_IMPLEMENTED");
console.log(`DATA_LIST_LOOKUP_RESOLUTION_DIFFERENTIAL_PARITY_PASSED successCases=${successCount} legacyUnresolvedCases=1`);
console.log(`DATA_LIST_LOOKUP_RESOLUTION_SERIALIZATION_PARITY_PASSED cases=${successCount + 1}`);
console.log(`DATA_LIST_LOOKUP_RESOLUTION_CORE_IMMUTABILITY_PASSED cases=${successCount + hostErrorCount + 1}`);
console.log("DATA_LIST_LOOKUP_RESOLUTION_LOSSLESS_TARGET_ID_PARITY_PASSED");
console.log(`DATA_LIST_LOOKUP_RESOLUTION_HOST_VALIDATION_GATES_PASSED cases=${hostErrorCount + 2}`);
console.log(`DATA_LIST_LOOKUP_RESOLUTION_LEGACY_UNCHANGED excludedCases=${excludedCount}`);

function createLegacyHarness() {
  const path = resolve(root, "scripts/materialize-full-app-generated-final.mjs");
  const source = readFileSync(path, "utf8");
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  const names = ["normKey", "stringId", "inferControlType", "inferControlTypeFromFieldPlan", "normalizeControlType", "resolveLookupTargetListId", "buildFieldRules"];
  const declarations = names.map((name) => {
    const node = ast.statements.find((statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === name);
    assert.ok(node, `missing Legacy function ${name}`);
    return source.slice(node.getStart(ast), node.getEnd());
  });
  const exported = vm.runInNewContext(`${declarations.join("\n")}; ({ resolveLookupTargetListId, buildFieldRules })`, {});
  return {
    rules(field, map) {
      const target = exported.resolveLookupTargetListId(field, map);
      return exported.buildFieldRules({ field, type: "lookup", lookupTargetListId: target });
    },
  };
}

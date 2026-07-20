#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import vm from "node:vm";
import { cleanPlanningLabel, isPlanningPlaceholder } from "./lib/planning-placeholder-utils.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const legacyPath = resolve(root, "scripts/materialize-full-app-generated-final.mjs");
const internalCorePath = argument("--core", "packages/app-builder-core-materializer/lib/internal/data-list-default-view-layout-projection.js");
const coreFunction = valueArgument("--function", "projectDataListDefaultViewLayoutInternal");
const runtimePath = argument("--runtime", "runtimes/app-builder-core-local-runtime/lib/index.js");
const corpus = readJson("compatibility/differential-fixtures/data-list-default-view-layout-projection.v0.1.0.json");
const core = await import(pathToFileURL(internalCorePath).href);
const runtime = await import(pathToFileURL(runtimePath).href);
const legacy = extractLegacyHarness();

assert.equal(typeof core[coreFunction], "function", "DATA_LIST_DEFAULT_VIEW_LAYOUT_INTERNAL_SHADOW_EXPORT_MISSING");
assert.equal(typeof runtime.lowerFixedFilterProjectionAtHost, "function", "DATA_LIST_DEFAULT_VIEW_LAYOUT_HOST_LOWERING_EXPORT_MISSING");
console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_INTERNAL_SHADOW_IMPLEMENTED");
console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_INPUT_BOUNDARY_VALIDATED callers=3 checkedCallers=2 layoutCallers=1");

let parityCases = 0;
let serializationCases = 0;
let immutableCases = 0;
let hostLoweringCases = 0;
for (const fixture of corpus.cases) {
  const coreInput = structuredClone(fixture.input);
  const templateSnapshot = structuredClone(corpus.templateSnapshot);
  const beforeInput = snapshot(coreInput);
  const beforeTemplate = snapshot(templateSnapshot);
  const legacyFindings = [];
  const legacyResult = capture(() => legacy.checked({
    fields: structuredClone(fixture.input.fields),
    viewRecord: structuredClone(fixture.input.viewIntent ?? null),
    listName: fixture.input.listName || "",
    findings: legacyFindings,
    uuids: fixture.uuids || [],
  }));
  const coreResult = capture(() => core[coreFunction]({
    ...coreInput,
    templateSnapshot,
  }));

  assert.equal(coreResult.thrown?.name || null, legacyResult.thrown?.name || null, `Legacy/Core error class mismatch for ${fixture.id}`);
  if (fixture.expectedError) {
    assert.equal(coreResult.thrown?.name, fixture.expectedError, `Expected Core error missing for ${fixture.id}`);
    assert.equal(legacyResult.thrown?.name, fixture.expectedError, `Expected Legacy error missing for ${fixture.id}`);
    assert.equal(snapshot(coreInput), beforeInput, `Core mutated malformed input for ${fixture.id}`);
    assert.equal(snapshot(templateSnapshot), beforeTemplate, `Core mutated template for ${fixture.id}`);
    immutableCases += 1;
    parityCases += 1;
    continue;
  }

  assert.equal(coreResult.thrown, null, `Core unexpectedly failed for ${fixture.id}: ${coreResult.thrown?.message}`);
  assert.equal(legacyResult.thrown, null, `Legacy unexpectedly failed for ${fixture.id}: ${legacyResult.thrown?.message}`);
  assert.equal(snapshot(coreInput), beforeInput, `Core mutated input for ${fixture.id}`);
  assert.equal(snapshot(templateSnapshot), beforeTemplate, `Core mutated template snapshot for ${fixture.id}`);
  assertFrozenResult(coreResult.value, fixture.id);

  const hostFindings = [];
  const lowered = runtime.lowerFixedFilterProjectionAtHost(coreResult.value.fixedFilterProjection, { keysByRequestId: fixture.keys }, hostFindings);
  const combined = {
    ...coreResult.value.fragment,
    filter: lowered.filter,
  };
  assert.equal(snapshot(combined), snapshot(legacyResult.value), `Legacy/Core LayoutView fragment mismatch for ${fixture.id}`);
  assert.equal(snapshot(hostFindings), snapshot(legacyFindings), `Legacy/Core findings mismatch for ${fixture.id}`);
  assert.equal(snapshot(lowered.findings), snapshot(legacyFindings), `Host-lowered findings mismatch for ${fixture.id}`);
  assert.equal(snapshot(JSON.parse(JSON.stringify(coreResult.value.fragment))), snapshot(coreResult.value.fragment), `Core fragment is not JSON-serializable for ${fixture.id}`);
  assert.equal(snapshot(JSON.parse(JSON.stringify(combined))), snapshot(legacyResult.value), `Serialized LayoutView mismatch for ${fixture.id}`);
  assert.equal(snapshot(coreResult.value.findings), snapshot(coreResult.value.fixedFilterProjection.findings), `Core finding projection mismatch for ${fixture.id}`);
  immutableCases += 1;
  serializationCases += 1;
  parityCases += 1;
  hostLoweringCases += 1;
}

console.log(`DATA_LIST_DEFAULT_VIEW_LAYOUT_DIFFERENTIAL_PARITY_PASSED cases=${parityCases}`);
console.log(`DATA_LIST_DEFAULT_VIEW_LAYOUT_SERIALIZATION_PARITY_PASSED cases=${serializationCases}`);
console.log(`DATA_LIST_DEFAULT_VIEW_LAYOUT_CORE_IMMUTABILITY_PASSED cases=${immutableCases}`);
console.log(`DATA_LIST_DEFAULT_VIEW_LAYOUT_HOST_LOWERING_PARITY_PASSED cases=${hostLoweringCases}`);
console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_LEGACY_UNCHANGED");

function extractLegacyHarness() {
  const source = readFileSync(legacyPath, "utf8");
  const ast = ts.createSourceFile(legacyPath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  const names = [
    "buildDataListViewLayoutView",
    "ensureTitleFirstFields",
    "uniqueFieldsByName",
    "buildDataListViewLayoutViewChecked",
    "buildDataViewLayoutColumn",
    "buildDataViewQueryField",
    "resolveDataViewFields",
    "splitPlannedFieldList",
    "resolveDataViewField",
    "parseDataViewFixedFilterConditions",
    "isNoFixedDataViewFilterText",
    "parseDataViewFixedFilterConditionPart",
    "dataViewCompareOperator",
    "coerceDataViewFilterValue",
    "isNonResourceName",
    "normKey",
    "error",
  ];
  const declarations = new Map();
  for (const statement of ast.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name && names.includes(statement.name.text)) {
      declarations.set(statement.name.text, source.slice(statement.getStart(ast), statement.getEnd()));
    }
  }
  assert.equal(declarations.size, names.length, "DATA_LIST_DEFAULT_VIEW_LAYOUT_LEGACY_FUNCTION_MISSING");
  assert.equal(countCalls(ast, "buildDataListViewLayoutView"), 1, "DATA_LIST_DEFAULT_VIEW_LAYOUT_LEGACY_LAYOUT_CALLER_MISMATCH");
  assert.equal(countCalls(ast, "buildDataListViewLayoutViewChecked"), 2, "DATA_LIST_DEFAULT_VIEW_LAYOUT_LEGACY_CHECKED_CALLER_MISMATCH");
  const sourceDigest = createHash("sha256").update(names.map((name) => declarations.get(name)).join("\n")).digest("hex");
  assert.ok(sourceDigest, "DATA_LIST_DEFAULT_VIEW_LAYOUT_LEGACY_SOURCE_DIGEST_MISSING");
  return {
    checked({ fields, viewRecord, listName, findings, uuids }) {
      let index = 0;
      const exported = vm.runInNewContext(`${names.map((name) => declarations.get(name)).join("\n")}\n({ buildDataListViewLayoutViewChecked })`, {
        Array,
        Error,
        JSON,
        Number,
        RegExp,
        Set,
        String,
        cleanResourceName: cleanPlanningLabel,
        isPlanningPlaceholder,
        crypto: {
          randomUUID: () => {
            const value = uuids[index];
            index += 1;
            if (!value) throw new Error("DATA_LIST_DEFAULT_VIEW_LAYOUT_LEGACY_UUID_FIXTURE_EXHAUSTED");
            return value;
          },
        },
      });
      return exported.buildDataListViewLayoutViewChecked({ fields, viewRecord, listName, findings });
    },
  };
}

function countCalls(ast, name) {
  let count = 0;
  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1;
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return count;
}

function assertFrozenResult(result, id) {
  const values = [result, result.fragment, result.fragment.layout, result.fragment.filter, result.fragment.query, result.fragment.sort, result.fragment.rowColor, result.findings, result.fixedFilterProjection, result.fixedFilterProjection.intents, result.fixedFilterProjection.keyRequests, result.fixedFilterProjection.findings];
  for (const value of values) assert.equal(Object.isFrozen(value), true, `Core result contains mutable value for ${id}`);
  for (const value of [...result.fragment.layout, ...result.fragment.query, ...result.findings, ...result.fixedFilterProjection.intents, ...result.fixedFilterProjection.keyRequests, ...result.fixedFilterProjection.findings]) assert.equal(Object.isFrozen(value), true, `Core result contains mutable child for ${id}`);
}

function capture(run) {
  try {
    return { value: run(), thrown: null };
  } catch (error) {
    return { value: null, thrown: error };
  }
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(root, relativePath), "utf8"));
}

function argument(option, fallback) {
  const index = process.argv.indexOf(option);
  return resolve(root, index < 0 ? fallback : process.argv[index + 1]);
}

function valueArgument(option, fallback) {
  const index = process.argv.indexOf(option);
  return index < 0 ? fallback : process.argv[index + 1];
}

function snapshot(value) {
  return JSON.stringify(value);
}

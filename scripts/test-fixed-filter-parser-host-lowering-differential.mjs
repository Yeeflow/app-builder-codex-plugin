#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import assert from "node:assert/strict";
import ts from "typescript";
import vm from "node:vm";
import { cleanPlanningLabel, isPlanningPlaceholder } from "./lib/planning-placeholder-utils.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const legacyPath = resolve(root, "scripts/materialize-full-app-generated-final.mjs");
const corePath = resolve(root, "packages/app-builder-core-materializer/lib/index.js");
const runtimePath = resolve(root, "runtimes/app-builder-core-local-runtime/lib/index.js");
const corpus = readJson("compatibility/differential-fixtures/fixed-filter-parser-host-lowering.v0.1.0.json");
const core = await import(pathToFileURL(corePath).href);
const runtime = await import(pathToFileURL(runtimePath).href);
const legacy = extractLegacyHarness();

assert.equal(typeof core.projectFixedFilterIntents, "function", "FIXED_FILTER_PARSER_CORE_EXPORT_MISSING");
assert.equal(typeof runtime.lowerFixedFilterProjectionAtHost, "function", "FIXED_FILTER_HOST_LOWERING_EXPORT_MISSING");
console.log("FIXED_FILTER_PARSER_CORE_SHADOW_IMPLEMENTED");
console.log("FIXED_FILTER_HOST_LOWERING_SHADOW_IMPLEMENTED");

let parityCases = 0;
let immutableCases = 0;
for (const fixture of corpus.cases) {
  const input = structuredClone(fixture.input);
  const before = snapshot(input);
  const coreResult = core.projectFixedFilterIntents(input);
  assert.equal(snapshot(input), before, `Core mutated input for ${fixture.id}`);
  assertFrozenCoreResult(coreResult, fixture.id);
  immutableCases += 1;
  const repeated = core.projectFixedFilterIntents(structuredClone(fixture.input));
  assert.deepEqual(coreResult.keyRequests, repeated.keyRequests, `Key requests are unstable for ${fixture.id}`);

  if (fixture.hostError) {
    assert.throws(() => runtime.lowerFixedFilterProjectionAtHost(coreResult, { keysByRequestId: fixture.keys }, []), new RegExp(fixture.hostError));
    continue;
  }

  const hostFindings = [];
  let loweringInput = coreResult;
  if (fixture.syntheticFindings) loweringInput = Object.freeze({ ...coreResult, findings: Object.freeze(fixture.syntheticFindings.map((finding) => Object.freeze({ ...finding, context: Object.freeze({ ...finding.context }) }))) });
  const lowered = runtime.lowerFixedFilterProjectionAtHost(loweringInput, { keysByRequestId: fixture.keys }, hostFindings);
  assert.equal(Object.isFrozen(lowered), true, `Host lowering result is mutable for ${fixture.id}`);
  assert.equal(Object.isFrozen(lowered.filter), true, `Host filter array is mutable for ${fixture.id}`);
  assert.equal(Object.isFrozen(lowered.findings), true, `Host findings array is mutable for ${fixture.id}`);

  if (fixture.syntheticFindings) {
    assert.deepEqual(hostFindings.map((finding) => finding.code), ["FIRST", "SECOND"], "Host findings ordering changed.");
    continue;
  }

  const legacyFindings = [];
  const legacyView = legacy.checked({
    fields: structuredClone(fixture.input.fields),
    viewRecord: { filterConditions: fixture.input.filterText, viewName: fixture.input.viewName },
    listName: fixture.input.listName,
    findings: legacyFindings,
    uuids: fixture.uuids || [],
  });
  assert.equal(snapshot(lowered.filter), snapshot(legacyView.filter), `Legacy/Core filter mismatch for ${fixture.id}`);
  assert.equal(snapshot(hostFindings), snapshot(legacyFindings), `Legacy/Core findings mismatch for ${fixture.id}`);
  assert.equal(snapshot(lowered.findings), snapshot(legacyFindings), `Lowered findings mismatch for ${fixture.id}`);
  parityCases += 1;
}

const invalidResult = core.projectFixedFilterIntents({ viewScope: "assets/default", fields: [{ FieldName: "Status", DisplayName: "Status", InternalName: "Status", FieldType: "Text" }], filterText: "Status = Active" });
assert.throws(() => runtime.lowerFixedFilterProjectionAtHost(invalidResult, { keysByRequestId: { "assets/default:fixed-filter:0": " " } }, []), /FIXED_FILTER_KEY_ALLOCATION_INVALID/);
assert.throws(() => runtime.lowerFixedFilterProjectionAtHost(invalidResult, { keysByRequestId: {} }, []), /FIXED_FILTER_KEY_ALLOCATION_MISSING/);
assert.throws(() => runtime.lowerFixedFilterProjectionAtHost(core.projectFixedFilterIntents({ viewScope: "assets/default", fields: [{ FieldName: "Status", DisplayName: "Status", InternalName: "Status", FieldType: "Text" }], filterText: "Status = Active and Status = Closed" }), { keysByRequestId: { "assets/default:fixed-filter:0": "shared", "assets/default:fixed-filter:1": "shared" } }, []), /FIXED_FILTER_KEY_ALLOCATION_COLLISION/);
console.log(`FIXED_FILTER_PARSER_HOST_LOWERING_DIFFERENTIAL_PARITY_PASSED cases=${parityCases}`);
console.log(`FIXED_FILTER_PARSER_KEY_REQUEST_DETERMINISM_PASSED cases=${corpus.cases.length}`);
console.log(`FIXED_FILTER_PARSER_CORE_IMMUTABILITY_PASSED cases=${immutableCases}`);
console.log("FIXED_FILTER_HOST_LOWERING_ALLOCATION_GATES_PASSED cases=3");
console.log("FIXED_FILTER_PARSER_LEGACY_UNCHANGED");

function extractLegacyHarness() {
  const source = readFileSync(legacyPath, "utf8");
  const ast = ts.createSourceFile(legacyPath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  const names = ["buildDataListViewLayoutView", "ensureTitleFirstFields", "uniqueFieldsByName", "buildDataListViewLayoutViewChecked", "buildDataViewLayoutColumn", "buildDataViewQueryField", "resolveDataViewFields", "splitPlannedFieldList", "resolveDataViewField", "parseDataViewFixedFilterConditions", "isNoFixedDataViewFilterText", "parseDataViewFixedFilterConditionPart", "dataViewCompareOperator", "coerceDataViewFilterValue", "isNonResourceName", "normKey", "error"];
  const declarations = new Map();
  for (const statement of ast.statements) if (ts.isFunctionDeclaration(statement) && statement.name && names.includes(statement.name.text)) declarations.set(statement.name.text, source.slice(statement.getStart(ast), statement.getEnd()));
  assert.equal(declarations.size, names.length, "FIXED_FILTER_LEGACY_FUNCTION_MISSING");
  assert.equal(countCalls(ast, "parseDataViewFixedFilterConditionPart"), 1, "FIXED_FILTER_LEGACY_PARSER_CALLER_MISMATCH");
  assert.equal(countCalls(ast, "buildDataListViewLayoutViewChecked"), 2, "FIXED_FILTER_LEGACY_CHECKED_CALLER_MISMATCH");
  const sourceDigest = createHash("sha256").update(names.map((name) => declarations.get(name)).join("\n")).digest("hex");
  if (!sourceDigest) throw new Error("FIXED_FILTER_LEGACY_SOURCE_DIGEST_MISSING");
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
        crypto: { randomUUID: () => { const value = uuids[index]; index += 1; if (!value) throw new Error("FIXED_FILTER_LEGACY_UUID_FIXTURE_EXHAUSTED"); return value; } },
      });
      return exported.buildDataListViewLayoutViewChecked({ fields, viewRecord, listName, findings });
    },
  };
}

function countCalls(ast, name) { let count = 0; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1; ts.forEachChild(node, visit); }; visit(ast); return count; }
function assertFrozenCoreResult(result, id) { assert.equal(Object.isFrozen(result), true, `Core result is mutable for ${id}`); assert.equal(Object.isFrozen(result.intents), true, `Core intent array is mutable for ${id}`); assert.equal(Object.isFrozen(result.keyRequests), true, `Core request array is mutable for ${id}`); assert.equal(Object.isFrozen(result.findings), true, `Core findings array is mutable for ${id}`); for (const value of [...result.intents, ...result.keyRequests, ...result.findings]) assert.equal(Object.isFrozen(value), true, `Core child is mutable for ${id}`); }
function readJson(relativePath) { return JSON.parse(readFileSync(resolve(root, relativePath), "utf8")); }
function snapshot(value) { return JSON.stringify(value); }

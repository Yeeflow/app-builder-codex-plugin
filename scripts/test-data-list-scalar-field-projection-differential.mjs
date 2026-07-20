#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import choiceFieldOptionUtils from "./lib/choice-field-option-utils.cjs";
import { cleanPlanningLabel } from "./lib/planning-placeholder-utils.mjs";
import ts from "typescript";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const legacyPath = resolve(root, "scripts/materialize-full-app-generated-final.mjs");
const compiledCorePath = resolve(root, "packages/app-builder-core-materializer/lib/index.js");
const corpusPath = resolve(root, "compatibility/differential-fixtures/data-list-scalar-field-projection.v0.1.0.json");
const corpus = JSON.parse(readFileSync(corpusPath, "utf8"));
const legacyProject = extractLegacyProjector();
const core = await import(pathToFileURL(compiledCorePath).href);

if (typeof core.projectDataListScalarField !== "function") throw new Error("DATA_LIST_SCALAR_FIELD_PROJECTION_CORE_EXPORT_MISSING");
console.log("DATA_LIST_SCALAR_FIELD_PROJECTION_CORE_SHADOW_IMPLEMENTED");
console.log(`DATA_LIST_SCALAR_FIELD_PROJECTION_FIELD_MATRIX_DISCOVERED canonicalTypes=${corpus.matrix.supportedCanonicalFieldTypes.length} supportedControls=${corpus.matrix.supportedControlTypes.length} deferredControls=${corpus.matrix.deferredControlTypes.length}`);

let immutableCases = 0;
let projectedCases = 0;
let deferredCases = 0;
let thrownCases = 0;
for (const fixture of corpus.cases) {
  const legacyInput = structuredClone(fixture.input);
  const coreInput = structuredClone(fixture.input);
  const legacyBefore = snapshot(legacyInput);
  const coreBefore = snapshot(coreInput);
  const legacy = invoke(() => legacyProject(legacyInput));
  const coreResult = invoke(() => core.projectDataListScalarField(coreInput));
  assertEqual(snapshot(legacyInput), legacyBefore, `Legacy mutated input for ${fixture.id}`);
  assertEqual(snapshot(coreInput), coreBefore, `Core mutated input for ${fixture.id}`);
  immutableCases += 1;

  if (fixture.outcome === "projected") {
    assertEqual(coreResult.thrown, null, `Core threw for ${fixture.id}`);
    assertEqual(legacy.thrown, null, `Legacy threw for ${fixture.id}`);
    assertEqual(coreResult.value.findings, [], `Core emitted findings for ${fixture.id}`);
    assertEqual(Object.isFrozen(coreResult.value), true, `Core result is mutable for ${fixture.id}`);
    assertEqual(Object.isFrozen(coreResult.value.projection), true, `Core projection is mutable for ${fixture.id}`);
    assertEqual(Object.isFrozen(coreResult.value.findings), true, `Core findings are mutable for ${fixture.id}`);
    assertEqual(coreResult.value.projection, normalizedLegacyProjection(legacy.value), `Legacy/Core projection mismatch for ${fixture.id}`);
    projectedCases += 1;
    continue;
  }
  if (fixture.outcome === "throws") {
    assertEqual(legacy.thrown?.message?.startsWith(fixture.errorCode), true, `Legacy error code mismatch for ${fixture.id}`);
    assertEqual(coreResult.thrown?.message?.startsWith(fixture.errorCode), true, `Core error code mismatch for ${fixture.id}`);
    thrownCases += 1;
    continue;
  }
  assertEqual(legacy.thrown, null, `Legacy unexpectedly threw for deferred ${fixture.id}`);
  assertEqual(coreResult.thrown, null, `Core unexpectedly threw for deferred ${fixture.id}`);
  assertEqual(coreResult.value.projection, null, `Core projected deferred ${fixture.id}`);
  assertEqual(Object.isFrozen(coreResult.value), true, `Deferred Core result is mutable for ${fixture.id}`);
  assertEqual(Object.isFrozen(coreResult.value.findings), true, `Deferred Core findings are mutable for ${fixture.id}`);
  assertEqual(coreResult.value.findings.map((finding) => finding.code), [fixture.findingCode], `Deferred finding mismatch for ${fixture.id}`);
  deferredCases += 1;
}

console.log(`DATA_LIST_SCALAR_FIELD_PROJECTION_DIFFERENTIAL_PARITY_PASSED projectedCases=${projectedCases} thrownCases=${thrownCases} deferredCases=${deferredCases}`);
console.log(`DATA_LIST_SCALAR_FIELD_PROJECTION_IMMUTABILITY_PASSED cases=${immutableCases}`);
console.log("DATA_LIST_SCALAR_FIELD_PROJECTION_LEGACY_UNCHANGED");

function extractLegacyProjector() {
  const routedSource = readFileSync(legacyPath, "utf8");
  const withoutScalarRoute = routedSource.replace(/\n  \/\/ DATA_LIST_SCALAR_FIELD_PROJECTION_CORE_ROUTE_START[\s\S]*?\n  \/\/ DATA_LIST_SCALAR_FIELD_PROJECTION_CORE_ROUTE_END\n/u, "\n");
  const source = withoutScalarRoute
    .replace(/\n  \/\/ DATA_LIST_LOOKUP_RESOLUTION_CORE_ROUTE_START\n[\s\S]*?\n  \/\/ DATA_LIST_LOOKUP_RESOLUTION_CORE_ROUTE_END\n  const rules = lookupRoute \? lookupRoute\.rules : buildFieldRules\(\{ field, type, lookupTargetListId \}\);/u, "\n  const rules = buildFieldRules({ field, type, lookupTargetListId });")
    .replace("function buildFieldRecord({ field, fieldIndex, listId, fieldId, lookupTargetListId = \"\", lookupTargetIdentityMap = null, sourceResourceKey = \"\" })", "function buildFieldRecord({ field, fieldIndex, listId, fieldId, lookupTargetListId = \"\" })");
  if (source === routedSource || source === withoutScalarRoute) throw new Error("DATA_LIST_SCALAR_FIELD_PROJECTION_LEGACY_ROUTE_BASELINE_MISSING");
  const ast = ts.createSourceFile(legacyPath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  const names = [
    "buildFieldRecord",
    "normalizeFieldType",
    "normalizeControlType",
    "controlTypeForFieldType",
    "schemaSafeFieldName",
    "cleanFieldName",
    "fieldPrefix",
    "fieldIndexFromName",
    "buildFieldRules",
    "inferChoiceValues",
    "unique",
    "normKey",
  ];
  const declarations = new Map();
  for (const statement of ast.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name && names.includes(statement.name.text)) declarations.set(statement.name.text, source.slice(statement.getStart(ast), statement.getEnd()));
  }
  if (declarations.size !== names.length) throw new Error("DATA_LIST_SCALAR_FIELD_PROJECTION_LEGACY_FUNCTION_MISSING");
  const buildFieldRecordSource = declarations.get("buildFieldRecord");
  const digest = createHash("sha256").update(buildFieldRecordSource).digest("hex");
  if (digest !== corpus.legacy.functionSourceSha256) throw new Error("DATA_LIST_SCALAR_FIELD_PROJECTION_LEGACY_SOURCE_MISMATCH");
  const routedAst = ts.createSourceFile(legacyPath, routedSource, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  const callCount = countIdentifierCalls(routedAst, "buildFieldRecord");
  if (callCount !== 1) throw new Error(`DATA_LIST_SCALAR_FIELD_PROJECTION_CALLER_BOUNDARY_MISMATCH count=${callCount}`);
  const evaluator = `${names.map((name) => declarations.get(name)).join("\n")}\n({ buildFieldRecord })`;
  const exported = vm.runInNewContext(evaluator, {
    Error,
    JSON,
    Number,
    RegExp,
    Set,
    String,
    cleanResourceName: cleanPlanningLabel,
    dataListSubListVariables: () => [],
    parseChoiceOptionValues: choiceFieldOptionUtils.parseChoiceOptionValues,
    coreDefaultValueForFieldType: (fieldType) => fieldType === "Bit" ? "0" : "",
  });
  return (input) => exported.buildFieldRecord({ field: input, fieldIndex: input.fieldIndex, listId: "legacy-list-id", fieldId: "legacy-field-id" });
}

function countIdentifierCalls(ast, name) {
  let count = 0;
  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1;
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return count;
}

function normalizedLegacyProjection(record) {
  return {
    displayName: record.DisplayName ?? null,
    fieldName: record.FieldName,
    internalName: record.InternalName,
    canonicalFieldType: record.FieldType,
    canonicalControlType: record.Type,
    fieldIndex: record.FieldIndex,
    status: record.Status,
    category: record.Category,
    defaultValue: record.DefaultValue,
    rules: record.Rules,
    required: false,
    unique: false,
    filterable: false,
    sortable: false,
    system: record.IsSystem,
    index: record.IsIndex,
  };
}

function invoke(operation) {
  try {
    return { value: operation(), thrown: null };
  } catch (error) {
    return { value: undefined, thrown: { name: error?.name || "Error", message: error?.message || String(error) } };
  }
}

function snapshot(value) {
  return JSON.stringify(value);
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${message}: actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
}

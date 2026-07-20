#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corpusPath = resolve(root, "compatibility/differential-fixtures/materializer-safe-dependency-identifier.v0.1.0.json");
const legacyPath = resolve(root, "scripts/materialize-full-app-generated-final.mjs");
const compiledCorePath = resolve(root, "packages/app-builder-core-materializer/lib/index.js");
const corpus = JSON.parse(readFileSync(corpusPath, "utf8"));
const legacy = extractLegacyFunction();
const coreModule = await import(pathToFileURL(compiledCorePath).href);

if (typeof coreModule.safeDependencyIdentifier !== "function") throw new Error("MATERIALIZER_DEPENDENCY_IDENTIFIER_CORE_EXPORT_MISSING");
console.log("MATERIALIZER_DEPENDENCY_IDENTIFIER_CORE_SHADOW_IMPLEMENTED");

let immutableCases = 0;
for (const fixture of corpus.cases) {
  const legacyArguments = structuredClone(fixture.arguments);
  const coreArguments = structuredClone(fixture.arguments);
  const legacyBefore = snapshot(legacyArguments);
  const coreBefore = snapshot(coreArguments);
  const legacyResult = invoke(legacy, legacyArguments);
  const coreResult = invoke(coreModule.safeDependencyIdentifier, coreArguments);
  assertEqual(legacyResult, coreResult, `Legacy/Core result mismatch for ${fixture.id}`);
  assertEqual(legacyResult, expectedResult(fixture), `Legacy result does not match the versioned expectation for ${fixture.id}`);
  assertEqual(snapshot(legacyArguments), legacyBefore, `Legacy mutated arguments for ${fixture.id}`);
  assertEqual(snapshot(coreArguments), coreBefore, `Core mutated arguments for ${fixture.id}`);
  immutableCases += 1;
}

console.log(`MATERIALIZER_DEPENDENCY_IDENTIFIER_DIFFERENTIAL_PARITY_PASSED cases=${corpus.cases.length}`);
console.log(`MATERIALIZER_DEPENDENCY_IDENTIFIER_IMMUTABILITY_PASSED cases=${immutableCases}`);

function extractLegacyFunction() {
  const text = readFileSync(legacyPath, "utf8");
  const ast = ts.createSourceFile(legacyPath, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  const declaration = ast.statements.find((statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === "safeDependencyIdentifier");
  if (!declaration) throw new Error("MATERIALIZER_DEPENDENCY_IDENTIFIER_LEGACY_FUNCTION_MISSING");
  const exactSource = text.slice(declaration.getStart(ast), declaration.getEnd());
  if (createHash("sha256").update(exactSource).digest("hex") !== corpus.legacy.functionSourceSha256) throw new Error("MATERIALIZER_DEPENDENCY_IDENTIFIER_LEGACY_SOURCE_MISMATCH");
  return vm.runInNewContext(`(${exactSource})`);
}

function invoke(functionUnderTest, argumentsList) {
  try {
    const value = functionUnderTest(...argumentsList);
    return { value, returnType: typeof value, thrown: null };
  } catch (error) {
    return { value: undefined, returnType: "undefined", thrown: { name: error?.name || "Error", message: error?.message || String(error) } };
  }
}

function expectedResult(fixture) { return { value: fixture.expectedThrown ? undefined : fixture.expectedReturn, returnType: fixture.expectedReturnType, thrown: fixture.expectedThrown }; }
function snapshot(value) { return JSON.stringify(value); }
function assertEqual(actual, expected, message) { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${message}: actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`); }

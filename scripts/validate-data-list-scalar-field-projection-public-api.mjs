#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = resolve(root, argumentValue("--contract", "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json"));
const compiledPath = resolve(root, argumentValue("--compiled", "packages/app-builder-core-materializer/lib/index.js"));
const sourcePath = resolve(root, argumentValue("--source", "packages/app-builder-core-materializer/src/index.ts"));
const scalarContractPath = resolve(root, argumentValue("--scalar-contract", "compatibility/capability-manifests/data-list-scalar-field-projection-contract.v0.1.0.json"));
const contract = readJson(contractPath);
const scalarContract = readJson(scalarContractPath);
const requiredRuntimeExports = ["capabilityMetadata", "normalizeHexColor", "defaultValueForFieldType", "escapeRegExp", "normalizeForLooseFormMatch", "stripPlanningDocumentSuffix", "dependencyName", "safeDependencyIdentifier", "projectDataListScalarField", "projectFixedFilterIntents"];
const requiredTypeExports = ["JsonValue", "FieldControlProjectionFinding", "ScalarFieldProjectionInput", "ScalarFieldProjection", "ScalarFieldProjectionResult", "FixedFilterFieldReference", "FixedFilterIntentInput", "FixedFilterConditionIntent", "FixedFilterKeyRequest", "FixedFilterProjectionFinding", "FixedFilterProjectionResult"];

if (!requiredRuntimeExports.every((name) => contract.runtimeExports?.includes(name))) fail("DATA_LIST_SCALAR_FIELD_PROJECTION_PUBLIC_API_CONTRACT_MISMATCH", "Materializer runtime export contract omits an approved scalar projection dependency.");
if (!requiredTypeExports.every((name) => contract.typeExports?.includes(name))) fail("DATA_LIST_SCALAR_FIELD_PROJECTION_PUBLIC_API_CONTRACT_MISMATCH", "Materializer type export contract omits an approved scalar projection DTO.");
const projectionContract = contract.projectDataListScalarField;
if (!projectionContract || typeof projectionContract !== "object" || !projectionContract.input || !projectionContract.return || !projectionContract.errors || !projectionContract.immutability || !projectionContract.hostSideEffects || !projectionContract.prohibited) fail("DATA_LIST_SCALAR_FIELD_PROJECTION_PUBLIC_API_CONTRACT_MISMATCH", "Projection public API contract is incomplete.");
if (!contract.projectFixedFilterIntents || !/does not call crypto\.randomUUID/u.test(contract.projectFixedFilterIntents.hostSideEffects || "") || !/Local Runtime lowering/u.test(contract.projectFixedFilterIntents.prohibited || "")) fail("DATA_LIST_SCALAR_FIELD_PROJECTION_PUBLIC_API_CONTRACT_MISMATCH", "Fixed-filter shadow public API contract is incomplete.");
if (scalarContract.coreContract?.entryPoint !== "projectDataListScalarField" || scalarContract.coreContract?.hostEffects?.length !== 0) fail("DATA_LIST_SCALAR_FIELD_PROJECTION_PUBLIC_API_CONTRACT_MISMATCH", "Scalar projection implementation contract is incompatible with the public API.");
if (!/No Legacy field-record shape/u.test(projectionContract.prohibited) || !/runtime-frozen/u.test(projectionContract.immutability)) fail("DATA_LIST_SCALAR_FIELD_PROJECTION_PUBLIC_API_CONTRACT_MISMATCH", "Projection API contract omits required boundary prohibitions or immutability language.");

const module = await import(pathToFileURL(compiledPath).href);
if (JSON.stringify(Object.keys(module).sort()) !== JSON.stringify([...(contract.runtimeExports || [])].sort())) fail("DATA_LIST_SCALAR_FIELD_PROJECTION_PUBLIC_API_CONTRACT_MISMATCH", "Compiled Materializer Core exports an unexpected runtime surface.");
if (typeof module.projectDataListScalarField !== "function") fail("DATA_LIST_SCALAR_FIELD_PROJECTION_PUBLIC_API_CONTRACT_MISMATCH", "Compiled Materializer Core does not export projectDataListScalarField.");
if (typeof module.projectFixedFilterIntents !== "function") fail("DATA_LIST_SCALAR_FIELD_PROJECTION_PUBLIC_API_CONTRACT_MISMATCH", "Compiled Materializer Core does not export projectFixedFilterIntents.");
const source = readFileSync(sourcePath, "utf8");
const sourceAst = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
const sourceTypeExports = sourceAst.statements
  .filter((statement) => (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) && statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword))
  .map((statement) => statement.name.text)
  .sort();
if (!requiredTypeExports.every((name) => sourceTypeExports.includes(name))) fail("DATA_LIST_SCALAR_FIELD_PROJECTION_PUBLIC_API_CONTRACT_MISMATCH", "Materializer Core source omits an approved scalar projection type.");
console.log("DATA_LIST_SCALAR_FIELD_PROJECTION_PUBLIC_API_CONTRACT_PASSED");

function readJson(path) { try { return JSON.parse(readFileSync(path, "utf8")); } catch (error) { fail("DATA_LIST_SCALAR_FIELD_PROJECTION_PUBLIC_API_CONTRACT_MISMATCH", `Contract cannot be parsed: ${error.message}`); } }
function argumentValue(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

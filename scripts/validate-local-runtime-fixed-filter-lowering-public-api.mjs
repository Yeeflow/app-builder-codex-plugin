#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicApiPath = argument("--public-api", "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json");
const distributionContractPath = argument("--distribution-contract", "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json");
const sourcePath = resolve(root, "runtimes/app-builder-core-local-runtime/src/index.ts");
const compiledPath = resolve(root, "runtimes/app-builder-core-local-runtime/lib/index.js");
const api = json(publicApiPath);
const distribution = json(distributionContractPath);
const expectedExports = ["capabilityMetadata", "lowerFixedFilterProjectionAtHost", "lowerDataListScalarResourceIdentityAtHost", "lowerDataListLookupResolutionAtHost", "lowerDataListType1IdentityControlPlacementAtHost", "lowerDataListSublistScalarRowSchemaAtHost", "buildDataListSublistChildResourceInventoryAtHost"];
const expectedErrors = ["FIXED_FILTER_KEY_ALLOCATION_MISSING", "FIXED_FILTER_KEY_ALLOCATION_INVALID", "FIXED_FILTER_KEY_ALLOCATION_COLLISION"];
const source = readFileSync(sourcePath, "utf8");
const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);

if (api.schemaVersion !== "1.0.0" || api.contractVersion !== "0.1.0" || api.packageName !== "@yeeflow/app-builder-core-local-runtime" || api.packageVersion !== "0.1.0") fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_PUBLIC_API_CONTRACT_INVALID", "The Local Runtime public API identity is invalid.");
if (!same(api.runtimeExports, expectedExports)) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_PUBLIC_API_EXPORT_UNRESOLVED", "The Local Runtime public runtime export list is invalid.");
if (!exportedFunction(ast, "lowerFixedFilterProjectionAtHost") || !source.includes('export { lowerDataListScalarResourceIdentityAtHost }') || !source.includes('export { lowerDataListLookupResolutionAtHost }') || !source.includes('export { lowerDataListType1IdentityControlPlacementAtHost }') || !source.includes('export { lowerDataListSublistScalarRowSchemaAtHostInternal as lowerDataListSublistScalarRowSchemaAtHost }') || !source.includes('export { buildDataListSublistChildResourceInventoryInternal as buildDataListSublistChildResourceInventoryAtHost }') || source.includes("sublistChildResourceIdentityErrors") || !source.includes("export const capabilityMetadata")) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_PUBLIC_API_EXPORT_UNRESOLVED", "The Local Runtime source does not expose the approved public exports.");
if (/\b(?:crypto|randomUUID|process|fetch|require)\b/u.test(source) || source.includes("node:")) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_PUBLIC_API_CONTRACT_INVALID", "The Local Runtime public function must not gain hidden host dependencies.");
if (!same(api.lowerFixedFilterProjectionAtHost?.errors, expectedErrors)) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_ALLOCATION_ERROR_CONTRACT_INVALID", "The Local Runtime public API must declare the exact allocation error codes.");
if (!same(api.lowerDataListScalarResourceIdentityAtHost?.errors, ["DATA_LIST_IDENTITY_ALLOCATION_MISSING", "DATA_LIST_IDENTITY_ALLOCATION_INVALID", "DATA_LIST_IDENTITY_ALLOCATION_COLLISION", "DATA_LIST_IDENTITY_SCOPE_MISMATCH", "DATA_LIST_IDENTITY_RELATIONSHIP_BROKEN", "DATA_LIST_LOOKUP_TARGET_UNRESOLVED", "DATA_LIST_IDENTITY_LOSSY_INPUT"])) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_ALLOCATION_ERROR_CONTRACT_INVALID", "The Local Runtime scalar identity API must declare the exact identity validation error codes.");
if (typeof api.lowerFixedFilterProjectionAtHost?.mutationOwnership !== "string" || !api.lowerFixedFilterProjectionAtHost.mutationOwnership.includes("callerFindings") || !api.lowerFixedFilterProjectionAtHost.mutationOwnership.includes("sole permitted Local Runtime host side effect")) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_MUTATION_OWNERSHIP_INVALID", "The Local Runtime public API must explicitly bound caller-owned findings mutation.");
if (!source.includes("if (callerFindings) for (const finding of findings) callerFindings.push(finding)")) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_MUTATION_OWNERSHIP_INVALID", "The Local Runtime source must retain the explicit optional findings append only.");
if (!source.includes("keys?.[request.requestId]") || !source.includes("FIXED_FILTER_KEY_ALLOCATION_MISSING") || !source.includes("FIXED_FILTER_KEY_ALLOCATION_INVALID") || !source.includes("FIXED_FILTER_KEY_ALLOCATION_COLLISION")) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_ALLOCATION_ERROR_CONTRACT_INVALID", "The Local Runtime source must require supplied keys and preserve exact allocation errors.");
const artifact = (distribution.approvedArtifacts || []).find((item) => item?.packageName === api.packageName);
if (!artifact || artifact.path !== "core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs" || artifact.packageVersion !== api.packageVersion || !same(artifact.exports, expectedExports)) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_PUBLIC_API_CONTRACT_INVALID", "The Local Runtime distribution contract does not match the public API.");
const module = await import(pathToFileURL(compiledPath).href);
if (!same(Object.keys(module).sort(), [...expectedExports].sort())) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_PUBLIC_API_EXPORT_UNRESOLVED", "The compiled Local Runtime export surface does not match the approved public API.");
console.log("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_PUBLIC_API_CONTRACT_PASSED");

function exportedFunction(file, name) {
  return file.statements.some((statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === name && statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword));
}
function same(actual, expected) { return Array.isArray(actual) && JSON.stringify(actual) === JSON.stringify(expected); }
function argument(option, fallback) { const index = process.argv.indexOf(option); return resolve(root, index < 0 ? fallback : process.argv[index + 1]); }
function json(path) { try { return JSON.parse(readFileSync(path, "utf8")); } catch (error) { fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_PUBLIC_API_CONTRACT_INVALID", error.message); } }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

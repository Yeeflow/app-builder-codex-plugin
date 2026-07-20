#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corePath = resolve(root, "packages/app-builder-core-materializer/src/index.ts");
const runtimePath = resolve(root, "runtimes/app-builder-core-local-runtime/src/index.ts");
const contractPath = resolve(root, "compatibility/capability-manifests/fixed-filter-key-findings-host-contract.v0.1.0.json");
const publicContractPath = resolve(root, "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const coreSource = readFileSync(corePath, "utf8");
const runtimeSource = readFileSync(runtimePath, "utf8");
const contract = JSON.parse(readFileSync(contractPath, "utf8"));
const publicContract = JSON.parse(readFileSync(publicContractPath, "utf8"));
const ast = ts.createSourceFile(corePath, coreSource, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);

if (!coreSource.includes("export function projectFixedFilterIntents")) fail("FIXED_FILTER_PARSER_CORE_EXPORT_MISSING", "The Core fixed-filter parser export is missing.");
if (coreSource.includes("crypto.randomUUID") || hasNodeImport(ast)) fail("FIXED_FILTER_PARSER_CORE_UUID_FORBIDDEN", "Core fixed-filter parsing must not import Node or generate UUID values.");
if (!coreSource.includes("Object.freeze") || !coreSource.includes("fixed-filter:${ordinal}")) fail("FIXED_FILTER_PARSER_CORE_IMMUTABILITY_INVALID", "Core fixed-filter parsing must freeze results and use deterministic request identity.");
for (const code of ["FIXED_FILTER_KEY_ALLOCATION_MISSING", "FIXED_FILTER_KEY_ALLOCATION_INVALID", "FIXED_FILTER_KEY_ALLOCATION_COLLISION"]) if (!runtimeSource.includes(code)) fail("FIXED_FILTER_HOST_LOWERING_ALLOCATION_CODE_MISSING", `Host lowering lacks ${code}.`);
if (!runtimeSource.includes("callerFindings.push") || runtimeSource.includes("randomUUID")) fail("FIXED_FILTER_HOST_LOWERING_BOUNDARY_INVALID", "Host lowering must append explicitly and must not allocate fallback keys.");
if (!publicContract.runtimeExports?.includes("projectFixedFilterIntents") || !publicContract.projectFixedFilterIntents) fail("FIXED_FILTER_PARSER_PUBLIC_CONTRACT_INVALID", "The fixed-filter parser public shadow contract is missing.");
if (contract.implementationStatus?.coreParser !== "shadow_implemented_not_routed" || contract.implementationStatus?.hostLowering !== "shadow_implemented_not_routed") fail("FIXED_FILTER_PARSER_CONTRACT_STATUS_INVALID", "The host contract implementation status is invalid.");
console.log("FIXED_FILTER_PARSER_HOST_LOWERING_SHADOW_VALID");

function hasNodeImport(sourceFile) { let found = false; const visit = (node) => { if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.startsWith("node:")) found = true; ts.forEachChild(node, visit); }; visit(sourceFile); return found; }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

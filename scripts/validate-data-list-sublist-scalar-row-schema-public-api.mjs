#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const materializer = json(argument("--materializer-contract", "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json"));
const runtime = json(argument("--runtime-contract", "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json"));
const coreExport = "projectDataListSublistScalarRowSchema";
const runtimeExport = "lowerDataListSublistScalarRowSchemaAtHost";
const errors = ["SUBLIST_TEMPLATE_GRAPH_REFERENCE_MISSING", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_INVALID", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_DUPLICATE", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_RELATIONSHIP_BROKEN", "SUBLIST_ROW_SCHEMA_REFERENCE_MISSING", "SUBLIST_ROW_SCHEMA_REFERENCE_INVALID", "SUBLIST_ROW_SCHEMA_REFERENCE_SCOPE_MISMATCH", "SUBLIST_ROW_SCHEMA_REFERENCE_DUPLICATE", "SUBLIST_ROW_SCHEMA_REFERENCE_RELATIONSHIP_BROKEN"];
if (!Array.isArray(materializer.runtimeExports) || !materializer.runtimeExports.includes(coreExport) || materializer.runtimeExports.some((value) => /Internal|normalizeSubListRowType|dataListSubListVariables/u.test(value))) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORE_PUBLIC_API_CONTRACT_INVALID", "The Materializer Core Sublist export surface is incomplete or leaks an internal helper.");
const core = materializer[coreExport];
if (!core || !["input", "return", "errors", "immutability", "hostSideEffects", "prohibited"].every((key) => typeof core[key] === "string")) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORE_PUBLIC_API_CONTRACT_INVALID", "The Materializer Core Sublist contract is incomplete.");
for (const term of ["mutable template", "allocation map", "generated ID", "nested control", "summary", "Lookup", "Legacy record shape"]) if (!core.input.includes(term) && !core.prohibited.includes(term)) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORE_PUBLIC_API_CONTRACT_INVALID", `The Core contract does not exclude ${term}.`);
for (const term of ["frozen", "JSON-serializable", "no generated ID"]) if (!core.return.includes(term) && !core.immutability.includes(term)) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORE_PUBLIC_API_CONTRACT_INVALID", `The Core contract does not guarantee ${term}.`);
if (!Array.isArray(runtime.runtimeExports) || !runtime.runtimeExports.includes(runtimeExport) || runtime.runtimeExports.some((value) => /Internal|fallback|discover/u.test(value))) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID", "The Local Runtime Sublist export surface is incomplete or leaks an internal helper.");
const local = runtime[runtimeExport];
if (!local || !Array.isArray(local.errors) || JSON.stringify(local.errors) !== JSON.stringify(errors) || !["input", "return", "mutationOwnership", "hostSideEffects", "prohibited"].every((key) => typeof local[key] === "string")) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID", "The Local Runtime Sublist contract is incomplete or omits a stable error.");
for (const term of ["lossless", "fallback", "template", "allocation"]) if (!local.input.includes(term) && !local.prohibited.includes(term) && !local.return.includes(term)) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID", `The Local Runtime contract does not constrain ${term}.`);
console.log("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORE_PUBLIC_API_CONTRACT_PASSED");
console.log("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_PASSED");
function json(path) { try { return JSON.parse(readFileSync(resolve(root, path), "utf8")); } catch (error) { fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_PUBLIC_API_ARGUMENT_INVALID", error.message); } }
function argument(option, fallback) { const index = process.argv.indexOf(option); if (index < 0) return fallback; const value = process.argv[index + 1]; if (!value || value.startsWith("--")) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_PUBLIC_API_ARGUMENT_INVALID", `${option} requires a value.`); return value; }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

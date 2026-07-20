#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const materializer = json(argument("--materializer-contract", "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json"));
const runtime = json(argument("--runtime-contract", "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json"));
const coreExport = "projectDataListType1IdentityControlPlacement";
const runtimeExport = "lowerDataListType1IdentityControlPlacementAtHost";
const errors = ["TEMPLATE_GRAPH_REFERENCE_MISSING", "TEMPLATE_GRAPH_REFERENCE_INVALID", "TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH", "TEMPLATE_GRAPH_REFERENCE_DUPLICATE", "TEMPLATE_GRAPH_REFERENCE_RELATIONSHIP_BROKEN"];
if (!Array.isArray(materializer.runtimeExports) || !materializer.runtimeExports.includes(coreExport) || materializer.runtimeExports.some((name) => /Internal|slug|isIdentityShape|isSublistShape/u.test(name))) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_PUBLIC_API_CONTRACT_INVALID", "The Materializer Core Type 1 export surface is incomplete or leaks an internal helper.");
const core = materializer[coreExport];
if (!core || !["input", "return", "errors", "immutability", "hostSideEffects", "prohibited"].every((key) => typeof core[key] === "string")) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_PUBLIC_API_CONTRACT_INVALID", "The Materializer Core Type 1 contract is incomplete.");
for (const value of ["control ID", "mutable template object", "host context", "Legacy control fragment", "runtime expression", "resource record", "package state"]) if (!core.input.includes(value) && !core.prohibited.includes(value)) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_PUBLIC_API_CONTRACT_INVALID", `The Core contract does not exclude ${value}.`);
for (const value of ["no control ID", "frozen", "JSON-serializable"]) if (!core.return.includes(value) && !core.immutability.includes(value)) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_PUBLIC_API_CONTRACT_INVALID", `The Core contract does not guarantee ${value}.`);
if (!Array.isArray(runtime.runtimeExports) || !runtime.runtimeExports.includes(runtimeExport) || runtime.runtimeExports.some((name) => /Internal|valid\(|duplicates|clone/u.test(name))) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID", "The Local Runtime Type 1 export surface is incomplete or leaks an internal helper.");
const local = runtime[runtimeExport];
if (!local || !Array.isArray(local.errors) || errors.some((code) => !local.errors.includes(code)) || !["input", "return", "mutationOwnership", "hostSideEffects", "prohibited"].every((key) => typeof local[key] === "string")) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID", "The Local Runtime Type 1 contract is incomplete or omits an error.");
for (const value of ["control ID", "template", "control ID allocation", "Legacy fallback"]) if (!local.input.includes(value) && !local.prohibited.includes(value) && !local.hostSideEffects.includes(value)) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID", `The Local Runtime contract does not constrain ${value}.`);
console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_PUBLIC_API_CONTRACT_PASSED");
console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_PASSED");
function json(path) { try { return JSON.parse(readFileSync(resolve(root, path), "utf8")); } catch (error) { fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_PUBLIC_API_ARGUMENT_INVALID", error.message); } }
function argument(option, fallback) { const index = process.argv.indexOf(option); if (index < 0) return fallback; const value = process.argv[index + 1]; if (!value || value.startsWith("--")) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_PUBLIC_API_ARGUMENT_INVALID", `${option} requires a value.`); return value; }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

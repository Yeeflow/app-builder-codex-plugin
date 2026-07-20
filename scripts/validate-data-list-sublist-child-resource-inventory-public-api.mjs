#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const runtime = json(argument("--runtime-contract", "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json"));
const runtimeIndex = read("runtimes/app-builder-core-local-runtime/src/index.ts");
const functionName = "buildDataListSublistChildResourceInventoryAtHost";
const errors = ["SUBLIST_CHILD_RESOURCE_IDENTITY_MISSING", "SUBLIST_CHILD_RESOURCE_IDENTITY_INVALID", "SUBLIST_CHILD_RESOURCE_IDENTITY_LOSSY", "SUBLIST_CHILD_RESOURCE_IDENTITY_DUPLICATE", "SUBLIST_CHILD_RESOURCE_IDENTITY_SCOPE_MISMATCH", "SUBLIST_CHILD_RESOURCE_IDENTITY_RELATIONSHIP_BROKEN", "SUBLIST_ROW_SCHEMA_IDENTITY_MISSING", "SUBLIST_ROW_SCHEMA_IDENTITY_INVALID", "SUBLIST_ROW_SCHEMA_IDENTITY_DUPLICATE", "SUBLIST_ROW_SCHEMA_IDENTITY_SCOPE_MISMATCH", "SUBLIST_ROW_SCHEMA_IDENTITY_RELATIONSHIP_BROKEN"];
const types = ["DataListSublistChildResourceAllocation", "DataListSublistChildResourceInventoryInput", "DataListSublistChildResourceIdentityDescriptor", "DataListSublistChildResourceInventory", "SublistChildResourceIdentityError"];
if (!Array.isArray(runtime.runtimeExports) || !runtime.runtimeExports.includes(functionName) || runtime.runtimeExports.some((value) => /Internal|sublistChildResourceIdentityErrors|fallback|discover/u.test(value))) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID", "The Local Runtime export list is incomplete or exposes an internal helper.");
if (!types.every((name) => runtime.typeExports?.includes(name))) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID", "The Local Runtime DTO export list is incomplete.");
const api = runtime[functionName];
if (!api || !Array.isArray(api.errors) || JSON.stringify(api.errors) !== JSON.stringify(errors) || !["input", "return", "mutationOwnership", "hostSideEffects", "prohibited"].every((key) => typeof api[key] === "string")) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID", "The Local Runtime inventory contract is incomplete or changes a stable error.");
for (const term of ["post-API-allocation", "lossless", "immutable", "descriptors", "descriptorsByParentField"]) if (!api.input.includes(term) && !api.return.includes(term)) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID", `The public inventory contract omits ${term}.`);
for (const term of ["identity allocation", "API call", "mutable resource", "package-state", "row-schema generation", "Legacy fallback", "numeric identity coercion"]) if (!api.prohibited.includes(term)) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID", `The public inventory contract fails to prohibit ${term}.`);
if (!runtimeIndex.includes(`buildDataListSublistChildResourceInventoryInternal as ${functionName}`) || runtimeIndex.includes("sublistChildResourceIdentityErrors")) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID", "The source index public alias is incomplete or leaks an internal helper.");
console.log("SUBLIST_CHILD_RESOURCE_INVENTORY_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_PASSED");
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { try { return JSON.parse(read(path)); } catch (error) { fail("SUBLIST_CHILD_RESOURCE_INVENTORY_PUBLIC_API_ARGUMENT_INVALID", error.message); } }
function argument(option, fallback) { const index = process.argv.indexOf(option); if (index < 0) return fallback; const value = process.argv[index + 1]; if (!value || value.startsWith("--")) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_PUBLIC_API_ARGUMENT_INVALID", `${option} requires a value.`); return value; }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

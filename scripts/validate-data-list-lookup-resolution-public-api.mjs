#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const materializerPath = resolve(root, argument("--materializer-contract", "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json"));
const runtimePath = resolve(root, argument("--runtime-contract", "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json"));
const materializer = json(materializerPath, "DATA_LIST_LOOKUP_RESOLUTION_CORE_PUBLIC_API_CONTRACT_INVALID");
const runtime = json(runtimePath, "DATA_LIST_LOOKUP_RESOLUTION_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID");

const coreExport = "projectDataListLookupResolutionIntent";
const runtimeExport = "lowerDataListLookupResolutionAtHost";
const stableErrors = [
  "LOOKUP_RESOLUTION_TARGET_MAPPING_MISSING",
  "LOOKUP_RESOLUTION_TARGET_LIST_ID_INVALID",
  "LOOKUP_RESOLUTION_TARGET_SCOPE_MISMATCH",
  "LOOKUP_RESOLUTION_SOURCE_TARGET_RELATIONSHIP_BROKEN",
  "DATA_LIST_LOOKUP_TARGET_UNRESOLVED",
  "LOOKUP_RESOLUTION_TARGET_MAPPING_AMBIGUOUS",
];

if (!Array.isArray(materializer.runtimeExports) || !materializer.runtimeExports.includes(coreExport) || materializer.runtimeExports.some((name) => /Internal|normalizeKey|unique/u.test(name))) {
  fail("DATA_LIST_LOOKUP_RESOLUTION_CORE_PUBLIC_API_CONTRACT_INVALID", "Materializer Core Lookup public export contract is incomplete or leaks an internal helper.");
}
const coreContract = materializer[coreExport];
if (!coreContract || typeof coreContract.input !== "string" || typeof coreContract.return !== "string" || typeof coreContract.immutability !== "string" || typeof coreContract.prohibited !== "string") {
  fail("DATA_LIST_LOOKUP_RESOLUTION_CORE_PUBLIC_API_CONTRACT_INVALID", "Materializer Core Lookup API contract is incomplete.");
}
for (const forbidden of ["ListID", "FieldID", "target ListID", "target map", "template", "resource", "host context"]) {
  if (!coreContract.input.includes(forbidden)) fail("DATA_LIST_LOOKUP_RESOLUTION_CORE_PUBLIC_API_CONTRACT_INVALID", `Materializer Core Lookup input contract does not exclude ${forbidden}.`);
}
for (const forbidden of ["target-map lookup", "fallback discovery", "ID allocation", "numeric identity coercion", "Rules lowering", "Legacy record shape", "template/resource mutation"]) {
  if (!coreContract.prohibited.includes(forbidden)) fail("DATA_LIST_LOOKUP_RESOLUTION_CORE_PUBLIC_API_CONTRACT_INVALID", `Materializer Core Lookup contract does not prohibit ${forbidden}.`);
}

if (!Array.isArray(runtime.runtimeExports) || !runtime.runtimeExports.includes(runtimeExport) || runtime.runtimeExports.some((name) => /Internal|validateLosslessId|validateSourceContext/u.test(name))) {
  fail("DATA_LIST_LOOKUP_RESOLUTION_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID", "Local Runtime Lookup public export contract is incomplete or leaks an internal helper.");
}
const runtimeContract = runtime[runtimeExport];
if (!runtimeContract || !Array.isArray(runtimeContract.errors) || stableErrors.some((code) => !runtimeContract.errors.includes(code)) || typeof runtimeContract.mutationOwnership !== "string" || typeof runtimeContract.prohibited !== "string") {
  fail("DATA_LIST_LOOKUP_RESOLUTION_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID", "Local Runtime Lookup API contract is incomplete or omits a stable error.");
}
for (const forbidden of ["fallback", "ID allocation", "numeric identity coercion", "lookup API", "template", "resource", "Legacy fallback"]) {
  if (!runtimeContract.prohibited.includes(forbidden)) fail("DATA_LIST_LOOKUP_RESOLUTION_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID", `Local Runtime Lookup contract does not prohibit ${forbidden}.`);
}

console.log("DATA_LIST_LOOKUP_RESOLUTION_CORE_PUBLIC_API_CONTRACT_PASSED");
console.log("DATA_LIST_LOOKUP_RESOLUTION_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_PASSED");

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) fail("DATA_LIST_LOOKUP_RESOLUTION_PUBLIC_API_ARGUMENT_INVALID", `${name} requires a value.`);
  return value;
}
function json(path, code) { try { return JSON.parse(readFileSync(path, "utf8")); } catch (error) { fail(code, error.message); } }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

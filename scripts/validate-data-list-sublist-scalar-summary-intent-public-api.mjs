#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const materializer = json(argument("--materializer-contract", "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json"));
const runtime = json(argument("--runtime-contract", "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json"));
const coreExport = "projectDataListSublistScalarSummaryIntent";
const runtimeExport = "lowerDataListSublistScalarSummaryIntentAtHost";
const operations = ["total", "average", "minimum", "maximum", "count"];
const errors = ["SUBLIST_SUMMARY_REFERENCE_MISSING", "SUBLIST_SUMMARY_REFERENCE_INVALID", "SUBLIST_SUMMARY_REFERENCE_WRONG_SCOPE", "SUBLIST_SUMMARY_REFERENCE_DUPLICATE", "SUBLIST_SUMMARY_REFERENCE_RELATIONSHIP_BROKEN", "SUBLIST_TEMP_VARIABLE_REFERENCE_MISSING", "SUBLIST_TEMP_VARIABLE_REFERENCE_INVALID", "SUBLIST_TEMP_VARIABLE_REFERENCE_WRONG_SCOPE", "SUBLIST_TEMP_VARIABLE_REFERENCE_DUPLICATE", "SUBLIST_TEMP_VARIABLE_REFERENCE_RELATIONSHIP_BROKEN"];

if (!materializer.runtimeExports?.includes(coreExport) || materializer.runtimeExports.filter((entry) => entry === coreExport).length !== 1 || !["ScalarSummaryOperation", "ScalarSummarySourceType", "DataListSublistScalarSummaryIntentInput", "DataListSublistScalarSummaryFinding", "DataListSublistScalarSummaryIntent", "DataListSublistScalarSummaryIntentResult"].every((entry) => materializer.typeExports?.includes(entry))) fail("SUBLIST_SCALAR_SUMMARY_INTENT_CORE_PUBLIC_API_CONTRACT_INVALID");
const core = materializer[coreExport];
if (!core || !["input", "return", "errors", "immutability", "hostSideEffects", "prohibited"].every((key) => typeof core[key] === "string") || !operations.every((operation) => core.input.includes(operation)) || !includes(core, ["temporary-variable", "runtime", "template", "resource", "field record", "host context", "package", "frozen", "JSON"])) fail("SUBLIST_SCALAR_SUMMARY_INTENT_CORE_PUBLIC_API_CONTRACT_INVALID");
if (!runtime.runtimeExports?.includes(runtimeExport) || runtime.runtimeExports.filter((entry) => entry === runtimeExport).length !== 1 || !["DataListSublistScalarSummaryHostIntent", "DataListSublistScalarSummaryStaticMetadata"].every((entry) => runtime.typeExports?.includes(entry))) fail("SUBLIST_SCALAR_SUMMARY_INTENT_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID");
const local = runtime[runtimeExport];
if (!local || !sameArray(local.errors, errors) || !["input", "return", "mutationOwnership", "hostSideEffects", "prohibited"].every((key) => typeof local[key] === "string") || !local.return.includes("binding: null") || !includes(local, ["temporary-variable", "runtime", "Rules", "control", "template", "resource", "package"])) fail("SUBLIST_SCALAR_SUMMARY_INTENT_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_INVALID");
console.log("SUBLIST_SCALAR_SUMMARY_INTENT_CORE_PUBLIC_API_CONTRACT_PASSED");
console.log("SUBLIST_SCALAR_SUMMARY_INTENT_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_PASSED");

function json(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }
function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function includes(value, words) { return words.every((word) => [value.input, value.return, value.errors, value.immutability, value.hostSideEffects, value.prohibited, value.mutationOwnership].some((part) => String(part || "").includes(word))); }
function sameArray(actual, expected) { return JSON.stringify(actual) === JSON.stringify(expected); }
function fail(code) { console.error(code); process.exit(1); }

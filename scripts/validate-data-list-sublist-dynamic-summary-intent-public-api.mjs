#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const materializer = json(option("--materializer", "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json"));
const runtime = json(option("--runtime", "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json"));
const distribution = json(option("--distribution", "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json"));
const coreIndex = read("packages/app-builder-core-materializer/src/index.ts");
const runtimeIndex = read("runtimes/app-builder-core-local-runtime/src/index.ts");
const core = read("packages/app-builder-core-materializer/src/internal/data-list-sublist-dynamic-summary-intent.ts");
const lowerer = read("runtimes/app-builder-core-local-runtime/src/internal-data-list-sublist-dynamic-summary-intent-lowering.ts");
const coreName = "projectDataListSublistDynamicSummaryIntent";
const runtimeName = "lowerDataListSublistDynamicSummaryIntentAtHost";
const materializerArtifact = distribution.approvedArtifacts?.find((artifact) => artifact.packageName === "@yeeflow/app-builder-core-materializer");
const runtimeArtifact = distribution.approvedArtifacts?.find((artifact) => artifact.packageName === "@yeeflow/app-builder-core-local-runtime");

if (!materializer.runtimeExports?.includes(coreName) || !runtime.runtimeExports?.includes(runtimeName) || !materializerArtifact?.exports?.includes(coreName) || !runtimeArtifact?.exports?.includes(runtimeName)) fail("SUBLIST_DYNAMIC_SUMMARY_PUBLIC_API_EXPORT_ALIGNMENT_INVALID");
for (const name of ["DynamicSummaryBindingKind", "DataListSublistDynamicSummaryIntentInput", "DataListSublistDynamicSummaryFinding", "DataListSublistDynamicSummaryIntent", "DataListSublistDynamicSummaryIntentResult"]) if (!materializer.typeExports?.includes(name)) fail("SUBLIST_DYNAMIC_SUMMARY_PUBLIC_API_TYPE_ALIGNMENT_INVALID");
for (const name of ["DynamicSummaryOperation", "DataListSublistDynamicSummaryHostIntent", "DataListSublistDynamicSummaryMetadata"]) if (!runtime.typeExports?.includes(name)) fail("SUBLIST_DYNAMIC_SUMMARY_PUBLIC_API_TYPE_ALIGNMENT_INVALID");
if (!coreIndex.includes(`projectDataListSublistDynamicSummaryIntentInternal as ${coreName}`) || !runtimeIndex.includes(runtimeName)) fail("SUBLIST_DYNAMIC_SUMMARY_PUBLIC_API_INDEX_INVALID");
if (!materializer[coreName] || !runtime[runtimeName]) fail("SUBLIST_DYNAMIC_SUMMARY_PUBLIC_API_CONTRACT_MISSING");
const coreContract = JSON.stringify(materializer[coreName]);
const runtimeContract = JSON.stringify(runtime[runtimeName]);
for (const required of ["scope-resolved", "tempVars", "runtime expression", "allocate", "discover", "mutate", "write back", "host context"]) if (!coreContract.includes(required)) fail("SUBLIST_DYNAMIC_SUMMARY_CORE_PUBLIC_BOUNDARY_INVALID");
for (const required of ["temporary-variable allocation", "discovery", "scope validation", "runtime expression", "Rules/control/template binding", "resource mutation", "package output"]) if (!runtimeContract.includes(required)) fail("SUBLIST_DYNAMIC_SUMMARY_RUNTIME_PUBLIC_BOUNDARY_INVALID");
if (!core.includes("projectDataListSublistDynamicSummaryIntentInternal") || !lowerer.includes(runtimeName) || /from\s+["'](?:node:|fs|path|child_process|process)/u.test(`${core}\n${lowerer}`)) fail("SUBLIST_DYNAMIC_SUMMARY_PUBLIC_API_DEPENDENCY_BOUNDARY_INVALID");
console.log("SUBLIST_DYNAMIC_SUMMARY_INTENT_CORE_PUBLIC_API_CONTRACT_PASSED");
console.log("SUBLIST_DYNAMIC_SUMMARY_INTENT_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_PASSED");

function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function option(name, fallback) { const index = process.argv.indexOf(name); return index < 0 ? fallback : process.argv[index + 1]; }
function fail(code) { console.error(code); process.exit(1); }

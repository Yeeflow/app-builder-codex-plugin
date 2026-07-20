#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = argument("--source", "packages/app-builder-core-materializer/src/index.ts");
const compiledPath = argument("--compiled", "packages/app-builder-core-materializer/lib/index.js");
const contractPath = argument("--contract", "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const distributionPath = argument("--distribution-contract", "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json");
const source = read(sourcePath);
const contract = json(contractPath);
const distribution = json(distributionPath);
const functionName = "projectDataListDefaultViewLayout";
const internalName = "projectDataListDefaultViewLayoutInternal";
const types = ["DataListDefaultViewFieldInput", "DataListDefaultViewIntent", "DataListStaticQueryField", "DataListDefaultViewTemplateSnapshot", "DataListDefaultViewLayoutProjectionInput", "LayoutViewProjectionFinding", "DataListLayoutColumnProjection", "DataListQueryFieldProjection", "DataListDefaultViewLayoutProjection", "DataListDefaultViewLayoutProjectionResult", "FixedFilterProjectionResult"];

if (!source.includes(`as ${functionName}`) || !source.includes(internalName)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_EXPORT_MISSING", "The approved LayoutView public function is not exported from the Materializer Core index.");
if (!contract.runtimeExports?.includes(functionName) || !types.every((name) => contract.typeExports?.includes(name))) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_CONTRACT_MISMATCH", "The Materializer public API contract omits an approved LayoutView export.");
const definition = contract[functionName];
for (const key of ["input", "return", "errors", "immutability", "hostSideEffects", "prohibited"]) if (!definition?.[key]) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_CONTRACT_MISMATCH", "The LayoutView public API contract is incomplete.");
if (/(?:accepts|returns)\s+(?:a\s+)?(?:Legacy|mutable template|caller-owned findings array|host key allocation map|ListID|LayoutID|generated resource|filesystem|API state|environment state|runtime state)/i.test(`${definition.input}\n${definition.return}`)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_SHAPE_LEAKAGE", "The LayoutView public contract exposes a forbidden Legacy, mutable, or host-owned shape.");
if (!/does not mutate|runtime-frozen|JSON-serializable/i.test(`${definition.immutability}\n${definition.return}`) || !/no key|does not allocate|does not call crypto\.randomUUID/i.test(definition.hostSideEffects) || !/Local Runtime/i.test(definition.prohibited)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_CONTRACT_MISMATCH", "The LayoutView public API does not preserve the approved ownership boundary.");
const materializerArtifact = distribution.approvedArtifacts?.find((artifact) => artifact.packageName === "@yeeflow/app-builder-core-materializer");
if (!materializerArtifact || JSON.stringify(materializerArtifact.exports) !== JSON.stringify(contract.runtimeExports)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_CONTRACT_MISMATCH", "The Materializer distribution export contract does not match the public API contract.");
const module = await load(compiledPath);
const actual = Object.keys(module).sort();
const expected = [...contract.runtimeExports].sort();
if (JSON.stringify(actual) !== JSON.stringify(expected) || typeof module[functionName] !== "function" || internalName in module || "lowerFixedFilterProjectionAtHost" in module) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_EXPORT_MISMATCH", "The compiled Materializer runtime export surface is not approved.");
console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_CONTRACT_PASSED");

function argument(option, fallback) { const index = process.argv.indexOf(option); return resolve(root, index < 0 ? fallback : process.argv[index + 1]); }
function read(path) { return readFileSync(path, "utf8"); }
function json(path) { try { return JSON.parse(read(path)); } catch (error) { fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_INVALID_JSON", error.message); } }
async function load(path) { try { return await import(pathToFileURL(path).href); } catch (error) { fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_EXPORT_MISMATCH", error.message); } }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

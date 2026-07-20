#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = read("scripts/materialize-full-app-generated-final.mjs");
const adapter = read("scripts/lib/materializer-core-adapter.mjs");
const runtimeAdapter = read("scripts/lib/local-runtime-core-adapter.mjs");
const contract = json("compatibility/capability-manifests/data-list-default-view-layout-routing-proof.v0.1.0.json");
const manifestText = read("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const manifest = JSON.parse(manifestText);
const materializer = manifest.artifacts?.find((item) => item.packageName === "@yeeflow/app-builder-core-materializer");
const runtime = manifest.artifacts?.find((item) => item.packageName === "@yeeflow/app-builder-core-local-runtime");
if (contract.phase !== "phase-5q-data-list-default-view-layout-selective-routing-proof" || contract.decision?.status !== "complete" || contract.decision?.marker !== "DATA_LIST_LAYOUTVIEW_ADAPTER_ROUTING_PASSED") fail("DATA_LIST_LAYOUTVIEW_ROUTING_PROOF_CONTRACT_INVALID", "The Phase 5Q routing proof contract is incomplete.");
if (countCalls(source, "buildDataListViewLayoutViewChecked") !== 2 || (source.match(/routeDefaultViewThroughCore: true/g) || []).length !== 1 || (source.match(/routeAdditionalViewThroughCore: true/g) || []).length !== 1 || (source.match(/routeAdditionalViewThroughCore: false/g) || []).length !== 0) fail("DATA_LIST_LAYOUTVIEW_ROUTING_SCOPE_INVALID", "The retained default route or the separately approved additional Type 0 route is not exact.");
for (const text of ["coreProjectDataListDefaultViewLayout", "coreProjectDataListAdditionalViewLayout", "coreLowerFixedFilterProjectionAtHost", "function buildDataListDefaultViewLayoutViewThroughCore", "function buildDataListAdditionalViewLayoutViewThroughCore", "crypto.randomUUID()"] ) if (!source.includes(text)) fail("DATA_LIST_LAYOUTVIEW_ROUTING_BOUNDARY_INVALID", `The selected routing boundary lacks ${text}.`);
if (!adapter.includes("export const projectDataListDefaultViewLayout = core.projectDataListDefaultViewLayout;") || !runtimeAdapter.includes("export const lowerFixedFilterProjectionAtHost = runtime.lowerFixedFilterProjectionAtHost;")) fail("DATA_LIST_LAYOUTVIEW_ADAPTER_EXPORT_INVALID", "The selected adapters do not expose the approved functions.");
for (const code of contract.adapters?.localRuntime?.failureCodes || []) if (!runtimeAdapter.includes(code)) fail("DATA_LIST_LAYOUTVIEW_LOCAL_RUNTIME_ADAPTER_INVALID", `The Local Runtime adapter lacks ${code}.`);
if (!materializer || !runtime || !materializer.exports?.includes("projectDataListDefaultViewLayout") || !materializer.exports?.includes("projectDataListAdditionalViewLayout") || !runtime.exports?.includes("lowerFixedFilterProjectionAtHost") || !contract.artifacts?.materializer?.sha256 || !contract.artifacts?.localRuntime?.sha256 || !contract.artifacts?.materializer?.manifestSha256 || !contract.artifacts?.localRuntime?.manifestSha256 || !sha256(manifestText)) fail("DATA_LIST_LAYOUTVIEW_ROUTING_ARTIFACT_STALE", "The retained LayoutView route does not have the required current distributed APIs and historical proof metadata.");
if (!Array.isArray(contract.routingBoundary?.legacyExcludedScenarios) || contract.routingBoundary.legacyExcludedScenarios.length !== 1 || contract.proof?.routingCaseCount !== 2 || contract.rollback?.materializerArtifactRetained !== true) fail("DATA_LIST_LAYOUTVIEW_ROUTING_PROOF_CONTRACT_INVALID", "The routing scope or rollback boundary is incomplete.");
if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(JSON.stringify(contract))) fail("DATA_LIST_LAYOUTVIEW_ROUTING_PROOF_NON_ENGLISH", "The routing proof contract must be English-only.");
console.log("DATA_LIST_LAYOUTVIEW_ADAPTER_ROUTING_PASSED");
console.log("DATA_LIST_LAYOUTVIEW_ROUTING_PROOF_CONTRACT_VALID");

function countCalls(text, name) { return [...text.matchAll(new RegExp(`\\b${name}\\s*\\(`, "gu"))].length - 1; }
function read(relativePath) { return readFileSync(resolve(root, relativePath), "utf8"); }
function json(relativePath) { try { return JSON.parse(read(relativePath)); } catch (error) { fail("DATA_LIST_LAYOUTVIEW_ROUTING_PROOF_CONTRACT_INVALID", error.message); } }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

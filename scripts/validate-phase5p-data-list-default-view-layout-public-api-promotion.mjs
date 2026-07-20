#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = json("compatibility/capability-manifests/data-list-default-view-layout-public-api-promotion.v0.1.0.json");
const manifestText = read("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const manifest = JSON.parse(manifestText);
const materializer = manifest.artifacts?.find((item) => item.packageName === "@yeeflow/app-builder-core-materializer");
if (contract.phase !== "phase-5p-data-list-default-view-layout-public-api-distribution-promotion" || contract.decision?.status !== "complete" || contract.decision?.marker !== "DATA_LIST_DEFAULT_VIEW_LAYOUT_DISTRIBUTION_VALID") fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PROMOTION_CONTRACT_INVALID", "The Phase 5P promotion decision is incomplete.");
if (contract.publicSurface?.runtimeFunction !== "projectDataListDefaultViewLayout" || !contract.publicSurface?.runtimeExports?.includes("projectDataListDefaultViewLayout") || contract.publicSurface?.internalOnly?.includes("projectDataListDefaultViewLayout")) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PROMOTION_CONTRACT_INVALID", "The Phase 5P public surface is invalid.");
const historicalArtifact = contract.artifact;
if (!materializer || !historicalArtifact?.sha256 || !historicalArtifact?.compiledInputSha256 || !historicalArtifact?.sourceInputSha256 || !historicalArtifact?.path || !historicalArtifact?.exports?.includes("projectDataListDefaultViewLayout") || !materializer.exports?.includes("projectDataListDefaultViewLayout")) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PROMOTION_CONTRACT_INVALID", "The Phase 5P promotion surface is not preserved by the current approved distribution.");
if (!/^[a-f0-9]{64}$/u.test(contract.artifact?.distributionManifestSha256 || "") || contract.proof?.caseCount !== 12 || contract.routing !== "not_started" || contract.localRuntimeBoundary?.allowedRuntimeFunction !== "lowerFixedFilterProjectionAtHost") fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PROMOTION_CONTRACT_INVALID", "The Phase 5P proof or Local Runtime boundary is incomplete.");
console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_DISTRIBUTION_VALID");
console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_PROMOTION_CONTRACT_VALID");

function read(relativePath) { return readFileSync(resolve(root, relativePath), "utf8"); }
function json(relativePath) { try { return JSON.parse(read(relativePath)); } catch (error) { fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PROMOTION_CONTRACT_INVALID", error.message); } }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

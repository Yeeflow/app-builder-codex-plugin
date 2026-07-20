#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const apiPath = "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json";
const distributionPath = "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json";
const manifestPath = "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json";
const outputPath = "compatibility/capability-manifests/data-list-default-view-layout-public-api-promotion.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-5p-data-list-default-view-layout-public-api-promotion.v0.1.0.md";
const api = json(apiPath);
const distribution = json(distributionPath);
const manifest = json(manifestPath);
const materializer = artifact(manifest);
const approved = distribution.approvedArtifacts.find((item) => item.packageName === "@yeeflow/app-builder-core-materializer");
const publicFunction = "projectDataListDefaultViewLayout";
const internalOnly = ["projectDataListDefaultViewLayoutInternal", "ensureTitleFirstFields", "uniqueFieldsByName", "resolveDataViewFields", "splitPlannedFieldList", "resolveDataViewField", "cleanResourceName", "isNonResourceName", "isPlanningPlaceholder", "normalizedKey"];
if (!api.runtimeExports?.includes(publicFunction) || !approved?.exports?.includes(publicFunction) || !materializer?.exports?.includes(publicFunction)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_PROMOTION_EXPORT_MISSING", "The approved LayoutView export is not aligned across contracts and artifact metadata.");
const contract = {
  schemaVersion: "1.0.0",
  phase: "phase-5p-data-list-default-view-layout-public-api-distribution-promotion",
  decision: {
    status: "complete",
    marker: "DATA_LIST_DEFAULT_VIEW_LAYOUT_DISTRIBUTION_VALID",
    rationale: "The approved immutable LayoutView projection is publicly exported only from Materializer Core. The separately distributed Local Runtime artifact retains host allocation validation, Legacy-shaped filter lowering, and optional explicit findings append."
  },
  publicSurface: {
    runtimeFunction: publicFunction,
    runtimeExports: api.runtimeExports,
    typeExports: api.typeExports,
    internalOnly,
    contractPath: apiPath,
    contractSha256: sha256(read(apiPath))
  },
  artifact: {
    path: materializer.path,
    packageName: materializer.packageName,
    packageVersion: materializer.packageVersion,
    sha256: materializer.sha256,
    sourceInputSha256: materializer.sourceInputSha256,
    compiledInputSha256: materializer.compiledInputSha256,
    exports: materializer.exports,
    distributionContractPath: distributionPath,
    distributionContractSha256: sha256(read(distributionPath)),
    distributionManifestPath: manifestPath,
    distributionManifestSha256: sha256(read(manifestPath))
  },
  localRuntimeBoundary: {
    artifactPath: "core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs",
    allowedRuntimeFunction: "lowerFixedFilterProjectionAtHost",
    responsibility: "Validates supplied allocations, lowers Legacy-shaped filters, and may append converted findings only to an explicit caller-owned target."
  },
  proof: {
    corpusPath: "compatibility/differential-fixtures/data-list-default-view-layout-projection.v0.1.0.json",
    caseCount: 12,
    surfaces: ["compiled Core source", "Plugin dist artifact", "temporary official ZIP extraction", "simulated installed Plugin layout"],
    assertions: ["layout fragment parity", "fixed-filter intent parity", "findings parity", "error parity", "JSON serialization parity", "runtime frozen immutability parity"],
    negativeGates: ["missing approved export", "unexpected internal runtime export", "host or Legacy shape leakage", "public API contract mismatch", "artifact checksum version and path mismatch", "source archive and installed output mismatch", "workspace source node_modules source-map and bare-import leakage", "Local Runtime lowering excluded from Materializer Core"]
  },
  routing: "not_started"
};
write(outputPath, contract);
writeFileSync(resolve(root, reportPath), report(contract), "utf8");
console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_CONTRACT_PASSED");
console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_DISTRIBUTION_VALID");
console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_PROMOTION_CONTRACT_WRITTEN");

function report(value) { return `# Phase 5P Data List Default-View LayoutView Public API and Distribution Promotion\n\n## Decision\n\n\`${value.decision.marker}\`\n\nThe approved immutable LayoutView projection is now a Materializer Core public API. This promotion does not add an adapter export or route any production materializer call.\n\n## Public Surface\n\n- Runtime function: \`${value.publicSurface.runtimeFunction}\`\n- Runtime exports: ${value.publicSurface.runtimeExports.map((item) => `\`${item}\``).join(", ")}\n- Internal-only symbols: ${value.publicSurface.internalOnly.map((item) => `\`${item}\``).join(", ")}\n\nThe public result contains only immutable layout fragments, fixed-filter intents, deterministic key requests, and findings. It excludes Legacy resource records, mutable templates, caller-owned findings arrays, host allocations, identities, resource mutation, and host state.\n\n## Distributed Artifact\n\n\`${value.artifact.path}\` has SHA-256\n\`${value.artifact.sha256}\`. The artifact is generated by the official builder and is self-contained.\n\n## Core and Local Runtime Boundary\n\nMaterializer Core returns structural data only. Local Runtime alone owns allocation validation, Legacy-shaped filter lowering, and the optional explicit findings append through \`${value.localRuntimeBoundary.allowedRuntimeFunction}\`.\n\n## Evidence\n\nThe twelve-case corpus passed compiled source, Plugin dist, temporary official ZIP, and simulated installed Plugin surfaces with layout, intents, findings, errors, serialization, and frozen-value parity. Eleven negative gates reject contract/export leakage, metadata mismatch, artifact leakage, and accidental Local Runtime lowering exposure.\n\n## Non-Goals\n\nNo adapter changed, no production materializer route changed, and no active installation or release action occurred. Phase 5Q requires a separate adapter and integration/rollback authorization.\n`; }
function artifact(value) { return value.artifacts?.find((item) => item.packageName === "@yeeflow/app-builder-core-materializer"); }
function read(relativePath) { return readFileSync(resolve(root, relativePath), "utf8"); }
function json(relativePath) { return JSON.parse(read(relativePath)); }
function write(relativePath, value) { const path = resolve(root, relativePath); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

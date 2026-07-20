#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corePath = "packages/app-builder-core-materializer/src/internal/data-list-lookup-resolution-intent.ts";
const hostPath = "runtimes/app-builder-core-local-runtime/src/internal-data-list-lookup-resolution-lowering.ts";
const fixturePath = "compatibility/differential-fixtures/data-list-lookup-resolution-shadow.v0.1.0.json";
const contractPath = "compatibility/capability-manifests/cross-resource-lookup-resolution-host-contract.v0.1.0.json";
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const source = read(sourcePath);
const fixture = json(fixturePath);
if (!read(corePath).includes("projectDataListLookupResolutionIntentInternal") || !read(hostPath).includes("lowerDataListLookupResolutionAtHost")) fail("DATA_LIST_LOOKUP_RESOLUTION_INTERNAL_SHADOW_MISSING", "The required internal Lookup shadows are unavailable.");
if (fixture.cases.length !== 15) fail("DATA_LIST_LOOKUP_RESOLUTION_SHADOW_FIXTURE_INVALID", "The Phase 6B corpus must retain fifteen cases.");

const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
state.migration.currentPhase = "phase-6b-data-list-lookup-resolution-core-shadow";
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = "phase-6c-data-list-lookup-resolution-dual-public-distribution-readiness";
const evidence = "2026-07-18: DATA_LIST_LOOKUP_RESOLUTION_CORE_SHADOW_IMPLEMENTED, DATA_LIST_LOOKUP_RESOLUTION_HOST_LOWERING_SHADOW_IMPLEMENTED, differential parity for four Legacy-resolved cases plus one Legacy empty-Rules unresolved case, serialization and immutability, lossless 19-digit target ID, and all six stable host-contract error gates passed. The shadows remain internal-only; Legacy materializer, adapters, public exports, artifacts, and production routing remain unchanged.";
const existing = state.completed.find((item) => item.id === "phase-6b-data-list-lookup-resolution-core-shadow");
if (existing) { existing.status = "complete"; existing.evidence = evidence; } else state.completed.push({ id: "phase-6b-data-list-lookup-resolution-core-shadow", status: "complete", evidence });
state.nextSteps = state.nextSteps.filter((item) => item.id !== "phase-6-cross-resource-lookup-resolution-contract-audit" && item.id !== "phase-6b-data-list-lookup-resolution-core-shadow");
state.nextSteps.unshift({ order: 1, id: "phase-6c-data-list-lookup-resolution-dual-public-distribution-readiness", description: "Audit public API and dual-artifact distribution readiness for the independently proven internal Data List Lookup Core intent and Local Runtime host-lowering boundaries; no routing is implied." });
state.proofStatus.dataListLookupResolutionInternalShadow = "passed_internal_only";
state.proofStatus.dataListLookupResolutionDualPublicDistributionReadiness = "not_assessed";
writeJson("docs/architecture/yeeflow-app-builder-core-migration-state.json", state);

const contract = json(contractPath);
contract.internalShadow = {
  status: "complete_internal_only",
  phase: "phase-6b-data-list-lookup-resolution-core-shadow",
  core: { path: corePath, functionName: "projectDataListLookupResolutionIntentInternal", sha256: sha256(read(corePath)), publicExport: false },
  localRuntime: { path: hostPath, functionName: "lowerDataListLookupResolutionAtHost", sha256: sha256(read(hostPath)), publicExport: false },
  fixture: { path: fixturePath, caseCount: fixture.cases.length },
  decision: { phase6CDualPublicDistributionReadiness: "not_assessed", productionRouting: "not_started" },
  mutations: { legacyMaterializer: false, adapters: false, publicApis: false, artifacts: false, pluginDist: false, activeInstallation: false, historicalZip: false }
};
writeJson(contractPath, contract);

for (const path of ["compatibility/capability-manifests/resource-definition-construction-audit.v0.1.0.json", "compatibility/capability-manifests/resource-definition-construction-capability-matrix.v0.1.0.json"]) {
  const value = json(path);
  value.phase6LookupResolutionInternalShadow = {
    status: "complete_internal_only",
    marker: "DATA_LIST_LOOKUP_RESOLUTION_DIFFERENTIAL_PARITY_PASSED",
    corePath,
    localRuntimePath: hostPath,
    fixturePath,
    fixtureCaseCount: fixture.cases.length,
    publicExports: false,
    productionRouting: false,
    nextPhase: "phase-6c-data-list-lookup-resolution-dual-public-distribution-readiness"
  };
  writeJson(path, value);
}

writeText("docs/architecture/yeeflow-app-builder-phase-6b-data-list-lookup-resolution-internal-shadow.v0.1.0.md", report());
console.log("DATA_LIST_LOOKUP_RESOLUTION_PHASE6B_STATE_RECORDED");

function report() {
  return `# Phase 6B Data List Lookup-Resolution Internal Shadow\n\n## Decision\n\nThe deterministic Lookup intent and explicit host-lowering shadows are complete internally. Phase 6C dual public-distribution readiness is not assessed or accepted by this task.\n\n## Boundary\n\nMaterializer Core internal function \`projectDataListLookupResolutionIntentInternal\` accepts only a Data List logical source, logical field, ordinal, declared target text, display name, and Lookup control type. It returns frozen candidate-key requests and frozen validation findings. It has no target ListID, target map, template, resource, filesystem, environment, API, runtime, or host-effect input.\n\nLocal Runtime internal function \`lowerDataListLookupResolutionAtHost\` receives the immutable intent plus host-supplied readonly target IDs, target scopes, and source relationship context. It validates lossless decimal-string IDs, target scope, ambiguity, and source ListID/FieldID relationship, then creates a fresh Legacy-shaped \`Rules\` JSON payload. It does not allocate IDs, resolve a tenant resource, mutate a map, or mutate a Core result.\n\n## Legacy Evidence\n\nA TypeScript-AST extracted VM harness executed the exact Legacy \`resolveLookupTargetListId\` and \`buildFieldRules\` functions. Four resolved cases have identical Rules JSON. The empty-intent case has the same Legacy empty Rules output; the Core result records the contract-required unresolved finding before host lowering. Host allocation and mapping failures are separately tested contract gates because the Legacy helper only returns an empty Rules value for unresolved host maps.\n\n## Corpus\n\nThe versioned corpus has ${fixture.cases.length} cases: four successful direct, singular, display fallback, and 19-digit target paths; one empty-intent finding; six stable host validation failures; and four excluded surface or control cases.\n\n## Stable Errors\n\n- \`LOOKUP_RESOLUTION_TARGET_MAPPING_MISSING\`\n- \`LOOKUP_RESOLUTION_TARGET_LIST_ID_INVALID\`\n- \`LOOKUP_RESOLUTION_TARGET_SCOPE_MISMATCH\`\n- \`LOOKUP_RESOLUTION_SOURCE_TARGET_RELATIONSHIP_BROKEN\`\n- \`DATA_LIST_LOOKUP_TARGET_UNRESOLVED\`\n- \`LOOKUP_RESOLUTION_TARGET_MAPPING_AMBIGUOUS\`\n\n## Non-Goals\n\nNo public export, distribution artifact, adapter, production route, Legacy materializer change, active installation change, historical ZIP change, or release action occurred.\n`;
}
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function writeJson(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function writeText(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value, "utf8"); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

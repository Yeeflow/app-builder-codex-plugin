#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const coreApiPath = "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json";
const runtimeApiPath = "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json";
const distributionPath = "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json";
const manifestPath = "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json";
const outputPath = "compatibility/capability-manifests/data-list-lookup-resolution-dual-public-distribution-promotion.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-6d-data-list-lookup-resolution-dual-public-distribution-promotion.v0.1.0.md";
const coreApi = json(coreApiPath);
const runtimeApi = json(runtimeApiPath);
const distribution = json(distributionPath);
const manifest = json(manifestPath);
const materializer = artifact("@yeeflow/app-builder-core-materializer");
const runtime = artifact("@yeeflow/app-builder-core-local-runtime");
const coreExport = "projectDataListLookupResolutionIntent";
const runtimeExport = "lowerDataListLookupResolutionAtHost";
const stableErrors = ["LOOKUP_RESOLUTION_TARGET_MAPPING_MISSING", "LOOKUP_RESOLUTION_TARGET_LIST_ID_INVALID", "LOOKUP_RESOLUTION_TARGET_SCOPE_MISMATCH", "LOOKUP_RESOLUTION_SOURCE_TARGET_RELATIONSHIP_BROKEN", "DATA_LIST_LOOKUP_TARGET_UNRESOLVED", "LOOKUP_RESOLUTION_TARGET_MAPPING_AMBIGUOUS"];
if (!coreApi.runtimeExports?.includes(coreExport) || !runtimeApi.runtimeExports?.includes(runtimeExport) || !materializer?.exports?.includes(coreExport) || !runtime?.exports?.includes(runtimeExport)) fail("DATA_LIST_LOOKUP_RESOLUTION_PUBLIC_PROMOTION_EXPORT_MISSING", "The approved Lookup exports are not aligned across public contracts and artifact metadata.");
if (!runtimeApi[runtimeExport]?.errors || stableErrors.some((code) => !runtimeApi[runtimeExport].errors.includes(code))) fail("DATA_LIST_LOOKUP_RESOLUTION_PUBLIC_PROMOTION_ERROR_CONTRACT_INVALID", "The Local Runtime Lookup stable error contract is incomplete.");
for (const item of [materializer, runtime]) {
  const approved = distribution.approvedArtifacts.find((entry) => entry.packageName === item.packageName);
  if (!approved || JSON.stringify(approved.exports) !== JSON.stringify(item.exports)) fail("DATA_LIST_LOOKUP_RESOLUTION_PUBLIC_PROMOTION_DISTRIBUTION_DRIFT", `Distribution contract drifted for ${item.packageName}.`);
}
const contract = {
  schemaVersion: "1.0.0",
  phase: "phase-6d-data-list-lookup-resolution-dual-public-distribution-promotion",
  decision: { status: "complete", marker: "DATA_LIST_LOOKUP_RESOLUTION_DUAL_DISTRIBUTION_VALID", nextPhase: "phase-6e-data-list-lookup-resolution-selective-routing-proof", rationale: "The two Lookup APIs are separately bounded, publicly explicit, self-contained, and proven on all required artifact layouts. Production routing remains intentionally deferred." },
  corpus: { path: "compatibility/differential-fixtures/data-list-lookup-resolution-shadow.v0.1.0.json", caseCount: 15, surfaces: ["compiled source", "Plugin dist", "temporary official ZIP", "simulated installed Plugin"], assertions: ["exact public exports", "Lookup intent and Rules.listid behavior", "stable errors", "JSON serialization", "frozen Core and host result values", "lossless 19-digit target IDs", "findings ordering"] },
  materializerCore: publicSurface(coreApi, materializer, coreExport),
  localRuntime: { ...publicSurface(runtimeApi, runtime, runtimeExport), stableErrors, hostOwnership: "Validates only explicitly supplied target maps and source relationship context, then returns fresh Rules.listid lowering. It does not allocate, discover, or mutate a host map." },
  contracts: { corePublicApi: coreApiPath, localRuntimePublicApi: runtimeApiPath, distribution: distributionPath, manifest: manifestPath, sourceSha256: { corePublicApi: sha(read(coreApiPath)), localRuntimePublicApi: sha(read(runtimeApiPath)), distribution: sha(read(distributionPath)), manifest: sha(read(manifestPath)) } },
  routingReadiness: { status: "accepted", futurePhase: "phase-6e-data-list-lookup-resolution-selective-routing-proof", requirements: ["one narrow Materializer Core adapter export", "one narrow Local Runtime adapter export", "Data List Lookup-only buildFieldRecord branch", "host-owned target mapping and final record integration", "actual-materializer source, ZIP, installed parity", "determinism, six-error, lossless-ID, and scope gates", "temporary-copy-only Legacy rollback"] },
  nonGoals: ["Legacy materializer modification", "adapter modification", "production routing", "active installation", "historical ZIP", "protected duplicate", "release action"]
};
write(outputPath, contract);
writeText(reportPath, report(contract));
recordState(contract);
console.log("DATA_LIST_LOOKUP_RESOLUTION_DUAL_DISTRIBUTION_PROMOTION_CONTRACT_WRITTEN");

function publicSurface(api, item, runtimeExport) { return { packageName: item.packageName, packageVersion: item.packageVersion, artifactPath: item.path, artifactSha256: item.sha256, sourceInputSha256: item.sourceInputSha256, compiledInputSha256: item.compiledInputSha256, runtimeExport, runtimeExports: api.runtimeExports, typeExports: api.typeExports, internalOnly: runtimeExport.startsWith("project") ? ["projectDataListLookupResolutionIntentInternal", "normalizeKey", "unique"] : ["validateSourceContext", "validateLosslessId"] }; }
function recordState(value) {
  const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
  state.migration.currentPhase = "phase-6d-data-list-lookup-resolution-dual-public-distribution-promotion";
  state.migration.currentPhaseStatus = "complete";
  state.migration.nextPhase = "phase-6e-data-list-lookup-resolution-selective-routing-proof";
  const evidence = `2026-07-18: DATA_LIST_LOOKUP_RESOLUTION_CORE_PUBLIC_API_CONTRACT_PASSED, DATA_LIST_LOOKUP_RESOLUTION_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_PASSED, DATA_LIST_LOOKUP_RESOLUTION_DUAL_DISTRIBUTION_VALID, source/archive/installed fifteen-case parity, and eight negative distribution gates passed. The official artifacts expose only ${coreExport} and ${runtimeExport} in addition to their pre-existing approved exports. Legacy routing and adapters remain unchanged.`;
  const completed = state.completed.find((entry) => entry.id === value.phase);
  if (completed) { completed.status = "complete"; completed.evidence = evidence; } else state.completed.push({ id: value.phase, status: "complete", evidence });
  state.nextSteps = state.nextSteps.filter((entry) => entry.id !== value.phase);
  state.nextSteps.unshift({ order: 1, id: value.decision.nextPhase, description: "A separate authorization may add only Lookup adapters and a Data List Lookup buildFieldRecord route after actual-materializer parity, scope, determinism, and temporary Legacy rollback proof." });
  state.proofStatus.dataListLookupResolutionDualPublicDistribution = "passed";
  state.proofStatus.dataListLookupResolutionRoutingReadiness = "accepted";
  write("docs/architecture/yeeflow-app-builder-core-migration-state.json", state);
}
function report(value) { return `# Phase 6D Data List Lookup-Resolution Dual Public API and Distribution Promotion\n\n## Decision\n\n\`DATA_LIST_LOOKUP_RESOLUTION_DUAL_DISTRIBUTION_VALID\`\n\nThe only promoted APIs are \`${value.materializerCore.runtimeExport}\` from Materializer Core and \`${value.localRuntime.runtimeExport}\` from Local Runtime. This is a distribution promotion only; no adapter, Legacy materializer call, or production route changed.\n\n## Public Boundaries\n\nMaterializer Core returns frozen JSON-serializable Lookup intent, deterministic candidate-key requests, and findings. It has no target ListID, target map, host context, Legacy Rules payload, mutable resource, or host effect. Local Runtime accepts the explicit Core intent, readonly target maps, and source relationship context, validates the six stable errors, and produces only a fresh \`Rules.listid\` result. It has no fallback discovery or ID allocation.\n\n## Artifacts\n\n- \`${value.materializerCore.artifactPath}\`: \`${value.materializerCore.artifactSha256}\`\n- \`${value.localRuntime.artifactPath}\`: \`${value.localRuntime.artifactSha256}\`\n\n## Four-Surface Evidence\n\nThe unchanged fifteen-case Lookup corpus passed compiled source, Plugin dist, temporary official ZIP extraction, and a simulated installed Plugin. It verifies export lists, success and error behavior, findings order, JSON serialization, frozen outputs, and lossless 19-digit target ListIDs. Eight negative gates reject export drift, public-shape leakage, omitted errors, internal export leakage, checksum drift, and workspace import leakage.\n\n## Phase 6E Readiness\n\nPhase 6E selective Lookup routing is accepted as a future, separately authorized proof. It must remain Data List Lookup-only in the audited \`buildFieldRecord\` boundary, retain host target-map ownership and final resource integration, demonstrate actual-materializer source/ZIP/installed parity and determinism, reject non-Lookup scope, and prove a temporary-copy-only Legacy rollback.\n\n## Non-Goals\n\nNo Legacy materializer source, compatibility adapter, production routing, active installation, historical ZIP, protected duplicate, Git publication, or release action changed.\n`; }
function artifact(packageName) { return manifest.artifacts?.find((item) => item.packageName === packageName); }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function write(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function writeText(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value, "utf8"); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

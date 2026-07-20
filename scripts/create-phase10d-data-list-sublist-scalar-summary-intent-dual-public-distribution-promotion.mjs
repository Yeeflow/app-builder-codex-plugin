#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-10d-data-list-sublist-scalar-summary-intent-dual-public-distribution-promotion";
const contractPath = "compatibility/capability-manifests/data-list-sublist-scalar-summary-intent-dual-public-distribution-promotion.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-10d-data-list-sublist-scalar-summary-intent-dual-public-distribution-promotion.v0.1.0.md";
const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
const closurePath = "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json";
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json";
const exports = ["projectDataListSublistScalarSummaryIntent", "lowerDataListSublistScalarSummaryIntentAtHost"];
const manifest = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const artifactState = Object.fromEntries(manifest.artifacts.map((artifact) => [artifact.packageName, { path: artifact.path, sha256: artifact.sha256 }]));
const lineage = json(lineagePath);
if (lineage.approvedTransitions.some((entry) => entry.phase === phase)) fail("PHASE_10D_LINEAGE_TRANSITION_DUPLICATE");
const previous = lineage.approvedTransitions.at(-1);
const sourceSha = sha(read("scripts/materialize-full-app-generated-final.mjs"));
if (!previous || previous.phase !== "phase-9n-selective-data-list-embedded-sublist-frozen-descriptor-production-host-context-routing-proof" || sourceSha !== previous.sourceTransition?.afterSha256) fail("PHASE_10D_LINEAGE_BASELINE_INVALID");
const allowedFiles = [
  "packages/app-builder-core-materializer/src/index.ts",
  "packages/app-builder-core-materializer/src/internal/data-list-sublist-scalar-summary-intent.ts",
  "runtimes/app-builder-core-local-runtime/src/index.ts",
  "runtimes/app-builder-core-local-runtime/src/internal-data-list-sublist-scalar-summary-intent-lowering.ts",
  "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json",
  "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json",
  "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json",
  "scripts/build-core-distribution.mjs",
  "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs",
  "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs",
  "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json",
  "scripts/create-phase10d-data-list-sublist-scalar-summary-intent-dual-public-distribution-promotion.mjs",
  "scripts/validate-data-list-sublist-scalar-summary-intent-public-api.mjs",
  "scripts/test-data-list-sublist-scalar-summary-intent-distribution.mjs",
  "scripts/test-data-list-sublist-scalar-summary-intent-distribution-gates.mjs",
  "scripts/validate-phase-closure-proof-lineage.mjs",
  "scripts/test-phase-closure-proof-lineage.mjs",
  "scripts/validate-phase10a-data-list-sublist-summary-temporary-variable-contract.mjs",
  "scripts/validate-phase10b-data-list-sublist-scalar-summary-intent-shadow.mjs",
  "scripts/validate-phase10c-data-list-sublist-scalar-summary-intent-dual-distribution-readiness.mjs",
  "scripts/validate-phase8f-data-list-sublist-family-reconciliation-and-closure.mjs",
  "scripts/validate-phase9o-data-list-sublist-embedded-schema-family-closure.mjs",
  "scripts/validate-phase9l-data-list-sublist-public-contract-readiness.mjs",
  statePath,
  lineagePath,
  closurePath,
  contractPath,
  reportPath,
  "compatibility/capability-manifests/yeeflow-app-builder-capability-classification.v0.9.71.json",
  "compatibility/plugin-baselines/yeeflow-app-builder-source-dist-topology.v0.9.71.json",
  "compatibility/capability-manifests/yeeflow-app-builder-mixed-file-decomposition.v0.9.71.json",
  "compatibility/capability-manifests/materializer-seam-audit.v0.1.0.json",
  "docs/architecture/yeeflow-app-builder-materializer-seam-audit.v0.1.0.md"
];
const transition = {
  phase,
  kind: "artifact-only",
  promotionContractPath: contractPath,
  promotionContractSha256: "pending",
  promotionReportPath: reportPath,
  promotionReportSha256: "pending",
  requiredEvidenceMarker: "SUBLIST_SCALAR_SUMMARY_INTENT_DUAL_DISTRIBUTION_VALID",
  sourceTransition: { beforeSha256: sourceSha, afterSha256: sourceSha, requiredSourceTokens: [...previous.sourceTransition.requiredSourceTokens] },
  beforeArtifactState: previous.artifactState,
  artifactState,
  allowedFiles
};
const promotion = {
  schemaVersion: "1.0.0",
  phase,
  decision: { status: "complete", marker: transition.requiredEvidenceMarker, nextPhase: "phase-10e-data-list-sublist-scalar-summary-intent-selective-routing-proof" },
  publicExports: exports,
  corpus: { path: "compatibility/differential-fixtures/data-list-sublist-scalar-summary-intent-shadow.v0.1.0.json", caseCount: 16, surfaces: ["compiled source", "Plugin dist", "temporary official ZIP", "simulated installed Plugin"] },
  temporaryVariableBoundary: "Both public APIs fail closed for temporary-variable references and do not allocate, discover, scope-validate, mutate, bind, write back, or serialize temporary variables. The Local Runtime output has binding: null only.",
  artifactTransition: { before: transition.beforeArtifactState, after: transition.artifactState },
  productionMaterializer: { path: "scripts/materialize-full-app-generated-final.mjs", beforeSha256: sourceSha, afterSha256: sourceSha, changed: false },
  historicalZipSha256: "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2",
  allowedFiles
};
writeJson(contractPath, promotion);
write(reportPath, `# Phase 10D Data List Sublist Scalar Summary Intent Dual Public Distribution Promotion\n\n## Decision\n\nThe official Core distribution pipeline promoted exactly two public APIs: \`projectDataListSublistScalarSummaryIntent\` and \`lowerDataListSublistScalarSummaryIntentAtHost\`.\n\n\`SUBLIST_SCALAR_SUMMARY_INTENT_CORE_PUBLIC_API_CONTRACT_PASSED\`\n\n\`SUBLIST_SCALAR_SUMMARY_INTENT_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_PASSED\`\n\n\`SUBLIST_SCALAR_SUMMARY_INTENT_DUAL_DISTRIBUTION_VALID\`\n\n\`SUBLIST_SCALAR_SUMMARY_INTENT_ARTIFACT_SOURCE_PARITY_PASSED\`\n\n\`SUBLIST_SCALAR_SUMMARY_INTENT_ARTIFACT_ARCHIVE_PARITY_PASSED\`\n\n\`SUBLIST_SCALAR_SUMMARY_INTENT_ARTIFACT_INSTALLED_PARITY_PASSED\`\n\n\`SUBLIST_SCALAR_SUMMARY_INTENT_DISTRIBUTION_GATES_PASSED\`\n\nThe unchanged 16-case corpus passed through compiled source, Plugin dist, temporary official ZIP extraction, and simulated installed Plugin layouts. Core returns frozen JSON-safe static intent, descriptor, and finding DTOs. Local Runtime returns only fresh frozen \`{ field, type, display, binding: null }\` metadata.\n\nTemporary variables, runtime expressions, binding, Rules/control/template integration, resource mutation, package output, and production routing remain excluded. The production materializer source hash remains \`${sourceSha}\`. No adapter, active installation, historical ZIP, protected duplicate, release, or production route changed.\n\nPhase 10E is accepted for separately authorized static-summary routing evaluation only.\n`);
transition.promotionContractSha256 = sha(read(contractPath));
transition.promotionReportSha256 = sha(read(reportPath));
lineage.approvedTransitions.push(transition);
writeJson(lineagePath, lineage);
const closure = json(closurePath);
closure.closureProofLineage.approvedPhases = lineage.approvedTransitions.map((entry) => entry.phase);
closure.closureProofLineage.sha256 = sha(read(lineagePath));
writeJson(closurePath, closure);
const state = json(statePath);
state.migration.currentPhase = phase;
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = "phase-10e-data-list-sublist-scalar-summary-intent-selective-routing-proof";
state.completed.push({ id: phase, status: "complete", evidence: "2026-07-19: SUBLIST_SCALAR_SUMMARY_INTENT_CORE_PUBLIC_API_CONTRACT_PASSED, SUBLIST_SCALAR_SUMMARY_INTENT_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_PASSED, SUBLIST_SCALAR_SUMMARY_INTENT_DUAL_DISTRIBUTION_VALID, SUBLIST_SCALAR_SUMMARY_INTENT_ARTIFACT_SOURCE_PARITY_PASSED, SUBLIST_SCALAR_SUMMARY_INTENT_ARTIFACT_ARCHIVE_PARITY_PASSED, SUBLIST_SCALAR_SUMMARY_INTENT_ARTIFACT_INSTALLED_PARITY_PASSED, SUBLIST_SCALAR_SUMMARY_INTENT_DISTRIBUTION_GATES_PASSED, and PHASE_CLOSURE_PROOF_LINEAGE_VALID. Only the two approved static APIs were promoted; no production route or adapter changed." });
state.nextSteps = (state.nextSteps || []).filter((entry) => entry.id !== phase && entry.id !== "phase-10c-data-list-sublist-scalar-summary-intent-dual-public-distribution-readiness-audit");
state.nextSteps.unshift({ order: 1, id: state.migration.nextPhase, description: "Evaluate selective routing only for static scalar Sublist summaries after separate authorization. Temporary variables, runtime expressions, bindings, mutation, and package output remain excluded." });
state.proofStatus.dataListSublistScalarSummaryIntentPublicDistribution = "passed";
state.proofStatus.dataListSublistScalarSummaryIntentCorePublicApiReadiness = "accepted_and_promoted";
state.proofStatus.dataListSublistScalarSummaryIntentLocalRuntimePublicApiReadiness = "accepted_and_promoted";
state.proofStatus.dataListSublistScalarSummaryIntentDualDistributionReadiness = "passed";
state.proofStatus.dataListSublistScalarSummaryIntentDualPublicDistribution = "passed";
writeJson(statePath, state);
console.log(`PHASE_10D_PROMOTION_RECORDED artifacts=${Object.keys(artifactState).length}`);

function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function write(path, value) { writeFileSync(resolve(root, path), value, "utf8"); }
function writeJson(path, value) { write(path, `${JSON.stringify(value, null, 2)}\n`); }
function fail(code) { console.error(code); process.exit(1); }

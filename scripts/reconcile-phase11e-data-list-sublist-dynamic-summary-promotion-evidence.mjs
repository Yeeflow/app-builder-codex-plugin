#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-11e-sublist-summary-dynamic-intent-dual-public-distribution-promotion";
const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
const closurePath = "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json";
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json";
const contractPath = "compatibility/capability-manifests/data-list-sublist-dynamic-summary-intent-dual-public-distribution-promotion.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-11e-data-list-sublist-dynamic-summary-intent-dual-public-distribution-promotion.v0.1.0.md";
const lineage = json(lineagePath);
const transition = lineage.approvedTransitions?.find((item) => item.phase === phase);
if (!transition || lineage.approvedTransitions.at(-1) !== transition || transition.kind !== "artifact-only") throw new Error("PHASE_11E_LINEAGE_TRANSITION_INVALID");
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const artifactState = Object.fromEntries(distribution.artifacts.map((artifact) => [artifact.packageName, { path: artifact.path, sha256: artifact.sha256 }]));
const sourceSha256 = sha(read("scripts/materialize-full-app-generated-final.mjs"));
if (sourceSha256 !== transition.sourceTransition?.beforeSha256 || sourceSha256 !== transition.sourceTransition?.afterSha256) throw new Error("PHASE_11E_PRODUCTION_SOURCE_CHANGED");
const allowedFiles = [
  "packages/app-builder-core-materializer/src/index.ts",
  "packages/app-builder-core-materializer/src/internal/data-list-sublist-dynamic-summary-intent.ts",
  "runtimes/app-builder-core-local-runtime/src/index.ts",
  "runtimes/app-builder-core-local-runtime/src/internal-data-list-sublist-dynamic-summary-intent-lowering.ts",
  "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json",
  "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json",
  "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json",
  "scripts/build-core-distribution.mjs",
  "scripts/validate-data-list-sublist-dynamic-summary-intent-public-api.mjs",
  "scripts/test-data-list-sublist-dynamic-summary-intent-public-api.mjs",
  "scripts/test-data-list-sublist-dynamic-summary-intent-distribution.mjs",
  "scripts/validate-phase11e-data-list-sublist-dynamic-summary-dual-public-distribution-promotion.mjs",
  "scripts/test-phase11e-data-list-sublist-dynamic-summary-dual-public-distribution-promotion.mjs",
  "scripts/create-phase11e-data-list-sublist-dynamic-summary-dual-public-distribution-promotion.mjs",
  "scripts/reconcile-phase11e-data-list-sublist-dynamic-summary-promotion-evidence.mjs",
  "scripts/reconcile-phase11e-closure-lineage-mirror.mjs",
  "scripts/validate-phase-closure-proof-lineage.mjs",
  "scripts/validate-phase5r-data-list-additional-view-layout-contract-audit.mjs",
  "scripts/validate-phase11a-data-list-sublist-summary-temp-variable-lifecycle-audit.mjs",
  "scripts/validate-phase11b-data-list-sublist-summary-temp-variable-export-scope-evidence-audit.mjs",
  "scripts/validate-phase11c-data-list-sublist-dynamic-summary-intent-shadow.mjs",
  "scripts/validate-phase11d-data-list-sublist-dynamic-summary-dual-distribution-readiness.mjs",
  "scripts/validate-phase10f-data-list-sublist-summary-family-closure.mjs",
  "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs",
  "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs",
  "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json",
  contractPath,
  reportPath,
  lineagePath,
  closurePath,
  statePath,
  "compatibility/capability-manifests/phase-5r-additional-view-historical-lineage-reconciliation.v0.1.0.json",
  "compatibility/plugin-baselines/yeeflow-app-builder-source-dist-topology.v0.9.71.json",
  "compatibility/capability-manifests/yeeflow-app-builder-mixed-file-decomposition.v0.9.71.json",
  "docs/architecture/yeeflow-app-builder-mixed-file-decomposition-audit.v0.9.71.md",
  "compatibility/capability-manifests/materializer-seam-audit.v0.1.0.json",
  "docs/architecture/yeeflow-app-builder-materializer-seam-audit.v0.1.0.md",
  "compatibility/capability-manifests/yeeflow-app-builder-capability-classification.v0.9.71.json",
  "scripts/create-source-dist-topology-contract.mjs"
  ,"scripts/validate-phase5ac-data-list-resource-definition-family-closure.mjs"
  ,"scripts/validate-phase8f-data-list-sublist-family-reconciliation-and-closure.mjs"
  ,"scripts/validate-phase9o-data-list-sublist-embedded-schema-family-closure.mjs"
  ,"scripts/validate-phase9l-data-list-sublist-public-contract-readiness.mjs"
];
const contract = {
  schemaVersion: "1.0.0",
  phase,
  decision: { status: "complete", marker: "SUBLIST_DYNAMIC_SUMMARY_DUAL_DISTRIBUTION_VALID", nextPhase: "phase-11f-sublist-summary-dynamic-intent-selective-routing-proof" },
  publicExports: ["projectDataListSublistDynamicSummaryIntent", "lowerDataListSublistDynamicSummaryIntentAtHost"],
  verificationMarkers: ["SUBLIST_DYNAMIC_SUMMARY_INTENT_CORE_PUBLIC_API_CONTRACT_PASSED", "SUBLIST_DYNAMIC_SUMMARY_INTENT_LOCAL_RUNTIME_PUBLIC_API_CONTRACT_PASSED", "SUBLIST_DYNAMIC_SUMMARY_DUAL_DISTRIBUTION_VALID", "SUBLIST_DYNAMIC_SUMMARY_ARTIFACT_SOURCE_PARITY_PASSED", "SUBLIST_DYNAMIC_SUMMARY_ARTIFACT_ARCHIVE_PARITY_PASSED", "SUBLIST_DYNAMIC_SUMMARY_ARTIFACT_INSTALLED_PARITY_PASSED", "SUBLIST_DYNAMIC_SUMMARY_DISTRIBUTION_GATES_PASSED", "PHASE_CLOSURE_PROOF_LINEAGE_VALID"],
  corpus: { path: "compatibility/differential-fixtures/data-list-sublist-dynamic-summary-intent-shadow.v0.1.0.json", caseCount: 16, surfaces: ["compiled source", "Plugin dist", "temporary official ZIP", "simulated installed Plugin"] },
  temporaryVariableBoundary: "Both APIs accept only an already scope-resolved immutable binding descriptor. Neither API receives an inventory or performs allocation, discovery, scope validation, mutation, writeback, cleanup, serialization, or runtime execution.",
  artifactTransition: { before: transition.beforeArtifactState, after: artifactState },
  productionMaterializer: { path: "scripts/materialize-full-app-generated-final.mjs", beforeSha256: sourceSha256, afterSha256: sourceSha256, changed: false },
  historicalZipSha256: "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2",
  allowedFiles
};
write(contractPath, contract);
write(reportPath, `# Phase 11E Dynamic Summary Intent Dual Public Distribution Promotion\n\n## Decision\n\nPhase 11E promoted exactly two pure APIs through the official Core distribution builder: \`projectDataListSublistDynamicSummaryIntent\` and \`lowerDataListSublistDynamicSummaryIntentAtHost\`. Phase 11F routing is eligible for a separately authorized proof; no production routing changed here.\n\n## Boundary\n\nMaterializer Core accepts only already scope-resolved immutable Data List Sublist dynamic-summary DTOs and returns frozen JSON-safe intent, descriptor, and finding data. Local Runtime returns a fresh frozen Legacy-shaped static metadata fragment with an immutable \`__list_\` or \`__temp_\` binding descriptor. Neither API receives host context, inventory, \`tempVars\`, templates, resources, Rules, controls, package state, or runtime expressions. Neither API allocates, discovers, scope-validates against an inventory, mutates, binds, writes back, serializes, or cleans up temporary variables.\n\n## Four-Surface Evidence\n\nThe unchanged export-derived 16-case corpus passed compiled source, Plugin dist, temporary official ZIP extraction, and a simulated installed Plugin layout. The proof checks JSON serialization, immutable DTOs, deterministic ordering, approved aggregate operations, valid \`__list_\` and \`__temp_\` binding descriptors, runtime-expression rejection, and absence of repository, TypeScript, source-map, node_modules, and absolute-path leakage.\n\n## Lineage and Invariants\n\nThe appended artifact-only transition preserves the production materializer SHA-256 \`${sourceSha256}\` before and after promotion. The historical ZIP SHA-256 remains \`377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2\`. The closure lineage validates the explicit transition, promotion contract and report checksums, exact before/after artifact state, and absence of broad path exceptions.\n\n## Exclusions\n\nNo host scope context, temporary-variable lifecycle, runtime expression execution, Rules/control/template binding, resource mutation, package output, adapter change, or production materializer route is included. Approval Form semantics remain comparison-only.\n`);
transition.artifactState = artifactState;
transition.allowedFiles = allowedFiles;
transition.promotionContractSha256 = sha(read(contractPath));
transition.promotionReportSha256 = sha(read(reportPath));
write(lineagePath, lineage);
const closure = json(closurePath);
closure.closureProofLineage.approvedPhases = lineage.approvedTransitions.map((item) => item.phase);
closure.closureProofLineage.sha256 = sha(read(lineagePath));
write(closurePath, closure);
console.log("PHASE_11E_PROMOTION_EVIDENCE_RECONCILED");

function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function write(path, value) { writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }

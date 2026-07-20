#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "core-extraction-wave-1-planning-normalization-execution";
const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
const closurePath = "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json";
const contractPath = "compatibility/capability-manifests/core-extraction-wave1-planning-normalization-execution.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-core-extraction-wave1-planning-normalization-execution.v0.1.0.md";
const lineage = json(lineagePath); const closure = json(closurePath); const previous = lineage.approvedTransitions.at(-1);
const sourceSha = sha(read("scripts/materialize-full-app-generated-final.mjs"));
const manifest = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const artifactState = Object.fromEntries(manifest.artifacts.map((item) => [item.packageName, { path: item.path, sha256: item.sha256 }]));
const existing = lineage.approvedTransitions.find((item) => item.phase === phase);
if (existing) {
  if (JSON.stringify(existing.artifactState) !== JSON.stringify(artifactState) || existing.sourceTransition?.afterSha256 !== sourceSha) throw Error("CORE_EXTRACTION_WAVE1_LINEAGE_EXISTING_TRANSITION_DRIFT");
  console.log("CORE_EXTRACTION_WAVE1_LINEAGE_ALREADY_APPENDED");
  process.exit(0);
}
if (!previous || previous.phase !== "phase-18b-approval-form-sublist-lookup-configuration-preservation" || previous.sourceTransition?.afterSha256 !== sourceSha) throw Error("CORE_EXTRACTION_WAVE1_LINEAGE_BASELINE_INVALID");
const transition = {
  phase,
  kind: "artifact-only",
  promotionContractPath: contractPath,
  promotionContractSha256: sha(read(contractPath)),
  promotionReportPath: reportPath,
  promotionReportSha256: sha(read(reportPath)),
  requiredEvidenceMarker: "CORE_EXTRACTION_WAVE1_PLANNING_NORMALIZATION_EXECUTION_PASSED",
  sourceTransition: { beforeSha256: sourceSha, afterSha256: sourceSha, requiredSourceTokens: [...previous.sourceTransition.requiredSourceTokens] },
  beforeArtifactState: previous.artifactState,
  artifactState,
  allowedFiles: [
    "packages/app-builder-core-planning/src/markdown-planning-utils.ts",
    "packages/app-builder-core-planning/src/index.ts",
    "scripts/lib/markdown-planning-core-adapter.mjs",
    "scripts/lib/markdown-planning-utils.mjs",
    "scripts/lib/planning-placeholder-utils.mjs",
    "scripts/build-core-distribution.mjs",
    "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json",
    "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-planning.v0.1.0.mjs",
    "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json",
    "dist/yeeflow-app-builder-plugin/scripts/lib/markdown-planning-core-adapter.mjs",
    "dist/yeeflow-app-builder-plugin/scripts/lib/markdown-planning-utils.mjs",
    "dist/yeeflow-app-builder-plugin/scripts/lib/planning-placeholder-utils.mjs",
    "compatibility/differential-fixtures/core-extraction-wave1-markdown-planning-legacy-baseline.v0.1.0.mjs",
    "compatibility/differential-fixtures/core-extraction-wave1-planning-placeholder-legacy-baseline.v0.1.0.mjs",
    "compatibility/differential-fixtures/core-extraction-wave1-planning-normalization.v0.1.0.json",
    "scripts/test-core-extraction-wave1-planning-normalization.mjs",
    "scripts/test-core-extraction-wave1-planning-normalization-gates.mjs",
    "scripts/test-core-distribution-resolution.mjs",
    "scripts/create-core-extraction-wave1-planning-normalization-execution-evidence.mjs",
    "scripts/validate-core-extraction-wave1-planning-normalization-execution.mjs",
    "scripts/append-core-extraction-wave1-planning-normalization-lineage.mjs",
    contractPath,
    reportPath,
    "compatibility/capability-manifests/core-extraction-production-ownership-inventory.v0.2.0.json",
    "compatibility/capability-manifests/core-extraction-proof-envelope-registry.v0.2.0.json",
    "compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.3.0.json",
    "compatibility/capability-manifests/yeeflow-app-builder-capability-classification.v0.9.71.json",
    "compatibility/plugin-baselines/yeeflow-app-builder-source-dist-topology.v0.9.71.json",
    "compatibility/capability-manifests/yeeflow-app-builder-mixed-file-decomposition.v0.9.71.json",
    "compatibility/capability-manifests/materializer-seam-audit.v0.1.0.json",
    "docs/architecture/yeeflow-app-builder-core-migration-state.json",
    "scripts/validate-core-extraction-program-baseline-and-finite-wave-plan.mjs",
    "scripts/validate-core-extraction-wave-plan-calibration-and-proof-envelope-clustering.mjs",
    "scripts/validate-phase8f-data-list-sublist-family-reconciliation-and-closure.mjs",
    "scripts/validate-phase9o-data-list-sublist-embedded-schema-family-closure.mjs",
    "scripts/validate-phase10f-data-list-sublist-summary-family-closure.mjs",
    "scripts/validate-phase11g-data-list-sublist-dynamic-summary-family-closure.mjs",
    "scripts/validate-phase17-cross-surface-capability-portfolio-and-next-vertical-selection-audit.mjs",
    "scripts/validate-phase18a-approval-form-sublist-lookup-legacy-parity-contract-audit.mjs",
    "scripts/validate-phase18b-approval-form-sublist-lookup-configuration-preservation.mjs",
    "scripts/validate-phase-closure-proof-lineage.mjs",
    "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json",
    "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json"
  ],
};
lineage.approvedTransitions.push(transition);
write(lineagePath, lineage);
closure.closureProofLineage.approvedPhases = lineage.approvedTransitions.map((item) => item.phase);
closure.closureProofLineage.sha256 = sha(read(lineagePath));
write(closurePath, closure);
console.log("CORE_EXTRACTION_WAVE1_LINEAGE_APPENDED");

function read(path) { return readFileSync(resolve(root, path), "utf8"); } function json(path) { return JSON.parse(read(path)); } function write(path, value) { writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`); } function sha(value) { return createHash("sha256").update(value).digest("hex"); }

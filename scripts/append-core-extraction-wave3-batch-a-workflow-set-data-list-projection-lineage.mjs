#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "core-extraction-wave3-batch-a-workflow-set-data-list-projection";
const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
const closurePath = "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json";
const contractPath = "compatibility/capability-manifests/core-extraction-wave3-batch-a-workflow-set-data-list-projection.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-core-extraction-wave3-batch-a-workflow-set-data-list-projection.v0.1.0.md";
const lineage = json(lineagePath); const closure = json(closurePath); const previous = lineage.approvedTransitions.at(-1);
const sourceSha = sha(read("scripts/materialize-full-app-generated-final.mjs"));
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const artifactState = Object.fromEntries(distribution.artifacts.map((item) => [item.packageName, { path: item.path, sha256: item.sha256 }]));
if (lineage.approvedTransitions.some((item) => item.phase === phase)) throw Error("CORE_EXTRACTION_WAVE3_BATCH_A_LINEAGE_ALREADY_APPENDED");
if (previous?.phase !== "core-extraction-wave-2-approval-form-sublist-lookup-static-configuration-projection" || previous.sourceTransition?.afterSha256 !== sourceSha) throw Error("CORE_EXTRACTION_WAVE3_BATCH_A_LINEAGE_BASELINE_INVALID");
lineage.approvedTransitions.push({
  phase, kind: "artifact-only", promotionContractPath: contractPath, promotionContractSha256: sha(read(contractPath)), promotionReportPath: reportPath, promotionReportSha256: sha(read(reportPath)), requiredEvidenceMarker: "CORE_EXTRACTION_WAVE3_BATCH_A_WORKFLOW_SET_DATA_LIST_PROJECTION_EXECUTION_PASSED",
  sourceTransition: { beforeSha256: sourceSha, afterSha256: sourceSha, requiredSourceTokens: [...previous.sourceTransition.requiredSourceTokens] }, beforeArtifactState: previous.artifactState, artifactState,
  allowedFiles: [
    "packages/app-builder-core-planning/src/markdown-planning-utils.ts", "packages/app-builder-core-planning/src/index.ts", "scripts/lib/workflow-set-data-list-projection-core-adapter.mjs", "scripts/lib/workflow-set-data-list-projection-utils.mjs", "scripts/lib/markdown-planning-core-adapter.mjs", "scripts/build-core-distribution.mjs", "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json", "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-planning.v0.1.0.mjs", "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json", "dist/yeeflow-app-builder-plugin/scripts/lib/workflow-set-data-list-projection-core-adapter.mjs", "dist/yeeflow-app-builder-plugin/scripts/lib/workflow-set-data-list-projection-utils.mjs", "dist/yeeflow-app-builder-plugin/scripts/lib/markdown-planning-core-adapter.mjs", "compatibility/differential-fixtures/core-extraction-wave3-batch-a-workflow-set-data-list-projection-legacy-baseline.v0.1.0.mjs", "compatibility/differential-fixtures/core-extraction-wave3-batch-a-workflow-set-data-list-projection.v0.1.0.json", "scripts/test-core-extraction-wave3-batch-a-workflow-set-data-list-projection.mjs", "scripts/test-core-extraction-wave3-batch-a-workflow-set-data-list-projection-gates.mjs", "scripts/create-core-extraction-wave3-batch-a-workflow-set-data-list-projection-evidence.mjs", "scripts/validate-core-extraction-wave3-batch-a-workflow-set-data-list-projection.mjs", "scripts/append-core-extraction-wave3-batch-a-workflow-set-data-list-projection-lineage.mjs", contractPath, reportPath, "compatibility/capability-manifests/core-extraction-production-ownership-inventory.v0.4.0.json", "compatibility/capability-manifests/core-extraction-proof-envelope-registry.v0.4.0.json", "compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.5.0.json", "docs/architecture/yeeflow-app-builder-core-migration-state.json", "scripts/validate-core-extraction-program-baseline-and-finite-wave-plan.mjs", "scripts/validate-core-extraction-wave-plan-calibration-and-proof-envelope-clustering.mjs", "scripts/validate-phase-closure-proof-lineage.mjs", lineagePath, closurePath
  ]
});
write(lineagePath, lineage); closure.closureProofLineage.approvedPhases = lineage.approvedTransitions.map((item) => item.phase); closure.closureProofLineage.sha256 = sha(read(lineagePath)); write(closurePath, closure);
console.log("CORE_EXTRACTION_WAVE3_BATCH_A_LINEAGE_APPENDED");
function read(path) { return readFileSync(resolve(root, path), "utf8"); } function json(path) { return JSON.parse(read(path)); } function write(path, value) { writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`); } function sha(value) { return createHash("sha256").update(value).digest("hex"); }

#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "core-extraction-wave3-batch-l-final-residual-envelope-reconciliation-and-disposition";
const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
const contractPath = "compatibility/capability-manifests/core-extraction-wave3-batch-l-final-residual-envelope-reconciliation-and-disposition.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-core-extraction-wave3-batch-l-final-residual-envelope-reconciliation-and-disposition.v0.1.0.md";
const read = (path) => readFileSync(resolve(root, path), "utf8"); const json = (path) => JSON.parse(read(path)); const sha = (value) => createHash("sha256").update(value).digest("hex");
const lineage = json(lineagePath); const existing = lineage.approvedTransitions.find((item) => item.phase === phase); const previous = existing ? lineage.approvedTransitions.at(-2) : lineage.approvedTransitions.at(-1);
if (!previous) throw new Error("CORE_EXTRACTION_WAVE3_BATCH_L_LINEAGE_BASELINE_MISSING");
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json"); const artifactState = Object.fromEntries(distribution.artifacts.map((item) => [item.packageName, { path: item.path, sha256: item.sha256 }]));
const transition = {
  phase, kind: "routing", evidencePath: contractPath, evidenceSha256: sha(read(contractPath)), reportPath, reportSha256: sha(read(reportPath)), requiredEvidenceMarker: "CORE_EXTRACTION_WAVE3_BATCH_L_RESIDUAL_ENVELOPES_RECONCILED",
  sourceTransition: { beforeSha256: previous.sourceTransition.afterSha256, afterSha256: sha(read("scripts/materialize-full-app-generated-final.mjs")), requiredSourceTokens: ["coreProjectApplicationPlanStaticFoundation", "materialization-failure-dto"] },
  beforeArtifactState: previous.artifactState, artifactState,
  allowedFiles: [contractPath, reportPath, "compatibility/differential-fixtures/core-extraction-wave3-batch-l-materialization-failure-dto.v0.1.0.json", "packages/app-builder-core-planning/src/application-plan-static-foundation.ts", "packages/app-builder-core-planning/lib/application-plan-static-foundation.js", "packages/app-builder-core-planning/lib/index.js", "scripts/materialize-full-app-generated-final.mjs", "scripts/test-core-extraction-wave3-batch-l-materialization-failure-dto.mjs", "scripts/validate-core-extraction-wave3-batch-l-final-residual-envelope-reconciliation-and-disposition.mjs", "scripts/create-core-extraction-wave3-batch-l-final-residual-envelope-reconciliation-evidence.mjs", "scripts/append-core-extraction-wave3-batch-l-final-residual-envelope-reconciliation-lineage.mjs", "scripts/build-core-distribution.mjs", "scripts/validate-phase-closure-proof-lineage.mjs", "compatibility/capability-manifests/app-builder-core-planning-public-api.v0.1.0.json", "compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.6.0.json", "compatibility/capability-manifests/core-extraction-production-ownership-inventory.v1.6.0.json", "compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.17.0.json", "docs/architecture/yeeflow-app-builder-core-migration-state.json", "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-planning.v0.1.0.mjs", "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json", "dist/yeeflow-app-builder-plugin/scripts/materialize-full-app-generated-final.mjs", lineagePath, "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json"]
};
if (existing) Object.assign(existing, transition); else lineage.approvedTransitions.push(transition); writeFileSync(resolve(root, lineagePath), `${JSON.stringify(lineage, null, 2)}\n`);
const closurePath = "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json"; const closure = json(closurePath); closure.closureProofLineage.approvedPhases = lineage.approvedTransitions.map((item) => item.phase); closure.closureProofLineage.sha256 = sha(read(lineagePath)); writeFileSync(resolve(root, closurePath), `${JSON.stringify(closure, null, 2)}\n`);
console.log(existing ? "CORE_EXTRACTION_WAVE3_BATCH_L_LINEAGE_RECONCILED" : "CORE_EXTRACTION_WAVE3_BATCH_L_LINEAGE_APPENDED");

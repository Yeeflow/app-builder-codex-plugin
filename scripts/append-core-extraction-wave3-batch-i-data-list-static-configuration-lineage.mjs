#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "core-extraction-wave3-batch-i-data-list-static-configuration-selection-and-execution";
const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
const closurePath = "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json";
const evidencePath = `compatibility/capability-manifests/${phase}.v0.1.0.json`;
const reportPath = `docs/architecture/yeeflow-app-builder-${phase}.v0.1.0.md`;
const read = (path) => readFileSync(resolve(root, path), "utf8");
const json = (path) => JSON.parse(read(path));
const write = (path, value) => writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`);
const sha = (value) => createHash("sha256").update(value).digest("hex");
const lineage = json(lineagePath);
const existing = lineage.approvedTransitions.find((item) => item.phase === phase);
const previous = existing ? lineage.approvedTransitions.at(-2) : lineage.approvedTransitions.at(-1);
if (previous?.phase !== "core-extraction-wave3-batch-h-application-plan-foundation-selection-and-execution") throw Error("CORE_EXTRACTION_WAVE3_BATCH_I_LINEAGE_BASELINE_INVALID");
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const artifactState = Object.fromEntries(distribution.artifacts.map((item) => [item.packageName, { path: item.path, sha256: item.sha256 }]));
const transition = {
  phase,
  kind: "routing",
  evidencePath,
  evidenceSha256: sha(read(evidencePath)),
  reportPath,
  reportSha256: sha(read(reportPath)),
  requiredEvidenceMarker: "CORE_EXTRACTION_WAVE3_BATCH_I_DATA_LIST_STATIC_CONFIGURATION_PASSED",
  sourceTransition: {
    beforeSha256: previous.sourceTransition.afterSha256,
    afterSha256: sha(read("scripts/materialize-full-app-generated-final.mjs")),
    requiredSourceTokens: ["coreProjectDataListDefaultViewSelector", "selectedIndex"]
  },
  beforeArtifactState: previous.artifactState,
  artifactState,
  allowedFiles: [
    evidencePath, reportPath,
    "compatibility/differential-fixtures/core-extraction-wave3-batch-i-data-list-static-configuration.v0.1.0.json",
    "packages/app-builder-core-materializer/src/index.ts",
    "packages/app-builder-core-materializer/src/internal/data-list-default-view-layout-projection.ts",
    "packages/app-builder-core-materializer/lib/index.js",
    "packages/app-builder-core-materializer/lib/internal/data-list-default-view-layout-projection.js",
    "scripts/lib/materializer-core-adapter.mjs", "scripts/materialize-full-app-generated-final.mjs", "scripts/build-core-distribution.mjs",
    "scripts/test-core-extraction-wave3-batch-i-data-list-static-configuration.mjs",
    "scripts/test-core-extraction-wave3-batch-i-retained-data-list-routing.mjs",
    "scripts/test-data-list-lookup-resolution-adapter-routing.mjs",
    "scripts/validate-core-extraction-wave3-batch-i-data-list-static-configuration.mjs",
    "scripts/validate-materializer-core-adapter.mjs",
    "scripts/validate-core-extraction-wave-plan-calibration-and-proof-envelope-clustering.mjs",
    "scripts/validate-core-extraction-program-baseline-and-finite-wave-plan.mjs",
    "scripts/create-core-extraction-wave3-batch-i-data-list-static-configuration-evidence.mjs",
    "scripts/append-core-extraction-wave3-batch-i-data-list-static-configuration-lineage.mjs",
    "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json",
    "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json",
    "compatibility/capability-manifests/core-extraction-production-ownership-inventory.v1.3.0.json",
    "compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.3.0.json",
    "compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.14.0.json",
    "docs/architecture/yeeflow-app-builder-core-migration-state.json",
    "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs",
    "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json",
    "dist/yeeflow-app-builder-plugin/scripts/materialize-full-app-generated-final.mjs",
    "dist/yeeflow-app-builder-plugin/scripts/lib/materializer-core-adapter.mjs", lineagePath
  ]
};
if (existing) Object.assign(existing, transition); else lineage.approvedTransitions.push(transition);
write(lineagePath, lineage);
const closure = json(closurePath);
closure.closureProofLineage.approvedPhases = lineage.approvedTransitions.map((item) => item.phase);
closure.closureProofLineage.sha256 = sha(read(lineagePath));
write(closurePath, closure);
console.log(existing ? "CORE_EXTRACTION_WAVE3_BATCH_I_LINEAGE_RECONCILED" : "CORE_EXTRACTION_WAVE3_BATCH_I_LINEAGE_APPENDED");

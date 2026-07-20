#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-18b-approval-form-sublist-lookup-configuration-preservation";
const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
const closurePath = "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json";
const evidencePath = "compatibility/capability-manifests/approval-form-sublist-lookup-configuration-preservation.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-18b-approval-form-sublist-lookup-configuration-preservation.v0.1.0.md";
const lineage = json(lineagePath);
if (lineage.approvedTransitions.some((entry) => entry.phase === phase)) throw Error("APPROVAL_FORM_SUBLIST_LOOKUP_LINEAGE_ALREADY_APPENDED");
const before = lineage.approvedTransitions.at(-1);
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const artifacts = Object.fromEntries(distribution.artifacts.map((item) => [item.packageName, { path: item.path, sha256: sha(read(`dist/yeeflow-app-builder-plugin/${item.path}`)) }]));
if (JSON.stringify(before.artifactState) !== JSON.stringify(artifacts)) throw Error("APPROVAL_FORM_SUBLIST_LOOKUP_CORE_ARTIFACT_STATE_CHANGED");
lineage.approvedTransitions.push({
  phase, kind: "routing", evidencePath, evidenceSha256: sha(read(evidencePath)), reportPath, reportSha256: sha(read(reportPath)), requiredEvidenceMarker: "APPROVAL_FORM_SUBLIST_LOOKUP_CONFIGURATION_PRESERVATION_PASSED",
  sourceTransition: { beforeSha256: before.sourceTransition.afterSha256, afterSha256: sha(read("scripts/materialize-full-app-generated-final.mjs")), requiredSourceTokens: ["APPROVAL_FORM_SUBLIST_LOOKUP_CONFIGURATION_PRESERVATION_ROUTE_START", "lookupDisplayField: lookup?.displayField", "APPROVAL_FORM_SUBLIST_LOOKUP_CONFIGURATION_PRESERVATION_ROUTE_END"] },
  beforeArtifactState: before.artifactState, artifactState: artifacts,
  allowedFiles: ["scripts/materialize-full-app-generated-final.mjs", "scripts/lib/approval-form-layout-builder.mjs", "dist/yeeflow-app-builder-plugin/scripts/materialize-full-app-generated-final.mjs", "dist/yeeflow-app-builder-plugin/scripts/lib/approval-form-layout-builder.mjs", "scripts/test-approval-form-sublist-lookup-configuration-preservation.mjs", "scripts/create-phase18b-approval-form-sublist-lookup-configuration-preservation-evidence.mjs", "scripts/validate-phase18b-approval-form-sublist-lookup-configuration-preservation.mjs", evidencePath, "compatibility/differential-fixtures/approval-form-sublist-lookup-configuration-preservation.v0.1.0.json", reportPath, "docs/architecture/yeeflow-app-builder-core-migration-state.json", lineagePath, closurePath],
});
write(lineagePath, lineage);
const closure = json(closurePath); closure.closureProofLineage.approvedPhases = lineage.approvedTransitions.map((entry) => entry.phase); closure.closureProofLineage.sha256 = sha(read(lineagePath)); write(closurePath, closure);
console.log("APPROVAL_FORM_SUBLIST_LOOKUP_CONFIGURATION_LINEAGE_APPENDED");
function read(path) { return readFileSync(resolve(root, path), "utf8"); } function json(path) { return JSON.parse(read(path)); } function write(path, value) { writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`); } function sha(value) { return createHash("sha256").update(value).digest("hex"); }

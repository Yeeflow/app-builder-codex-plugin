#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const closurePath = argument("--closure-contract", "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json");
const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
const closure = json(closurePath); const lineageRaw = read(lineagePath); const lineage = JSON.parse(lineageRaw);
const expectedPhases = ["phase-6e-data-list-lookup-resolution-selective-routing-proof", "phase-7d-data-list-type1-identity-control-placement-dual-public-distribution-promotion", "phase-7e-data-list-type1-identity-control-placement-selective-routing-proof", "phase-8d-data-list-sublist-scalar-row-schema-dual-public-distribution-promotion", "phase-9d-data-list-sublist-child-resource-inventory-local-runtime-public-api-and-distribution-promotion", "phase-9m-data-list-sublist-embedded-schema-core-public-api-distribution-promotion", "phase-9n-selective-data-list-embedded-sublist-frozen-descriptor-production-host-context-routing-proof", "phase-10d-data-list-sublist-scalar-summary-intent-dual-public-distribution-promotion", "phase-10e-data-list-sublist-scalar-summary-intent-selective-routing-proof", "phase-11e-sublist-summary-dynamic-intent-dual-public-distribution-promotion", "phase-11f-sublist-summary-dynamic-intent-selective-routing-proof", "phase-12d-data-list-sublist-nested-control-placement-dual-public-distribution-promotion", "phase-12e-data-list-sublist-nested-control-placement-selective-routing-proof", "phase-13e-data-list-sublist-embedded-lookup-dual-public-distribution-promotion", "phase-13f-data-list-sublist-embedded-lookup-selective-routing-proof", "phase-14e-data-list-sublist-lookup-additional-field-configuration-public-distribution-promotion", "phase-14f-data-list-sublist-lookup-additional-field-configuration-selective-routing-proof", "phase-16d-data-list-sublist-identity-control-public-distribution-promotion", "phase-16e-data-list-sublist-identity-control-selective-routing-proof", "phase-18b-approval-form-sublist-lookup-configuration-preservation", "core-extraction-wave-1-planning-normalization-execution", "core-extraction-wave-2-approval-form-sublist-lookup-static-configuration-projection", "core-extraction-wave3-batch-a-workflow-set-data-list-projection", "core-extraction-wave3-batch-b-workflow-query-data-static-plan", "core-extraction-wave3-batch-c-data-list-sublist-static-configuration", "core-extraction-wave3-batch-d-workflow-static-plan", "core-extraction-wave3-batch-e-template-static-normalization", "core-extraction-wave3-batch-f-small-static-leaf-cohort", "core-extraction-wave3-batch-g-approval-form-static-configuration"];
expectedPhases.push("core-extraction-wave3-batch-h-application-plan-foundation-selection-and-execution");
expectedPhases.push("core-extraction-wave3-batch-i-data-list-static-configuration-selection-and-execution");
expectedPhases.push("core-extraction-wave3-batch-j-dashboard-static-configuration-selection-and-execution");
expectedPhases.push("core-extraction-wave3-batch-k-approval-form-sublist-static-configuration-selection-and-execution");
expectedPhases.push("core-extraction-wave3-batch-l-final-residual-envelope-reconciliation-and-disposition");
if (!closure.closureProofLineage || closure.closureProofLineage.path !== lineagePath || JSON.stringify(closure.closureProofLineage.approvedPhases) !== JSON.stringify(expectedPhases)) fail("PHASE_CLOSURE_PROOF_LINEAGE_BASELINE_STALE");
if (closure.closureProofLineage.sha256 !== sha(lineageRaw)) fail("PHASE_CLOSURE_PROOF_LINEAGE_TAMPERED");
if (lineage.protectedClosure?.baselineSha256 !== closure.source?.sha256 || JSON.stringify(lineage.closureArtifactBaselines) !== JSON.stringify(closure.artifactBaselines) || JSON.stringify(lineage.approvedTransitions?.map((x) => x.phase)) !== JSON.stringify(expectedPhases)) fail("PHASE_CLOSURE_PROOF_LINEAGE_BASELINE_STALE");
const source = read(lineage.protectedClosure.sourcePath);
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const currentArtifacts = Object.fromEntries(distribution.artifacts.map((item) => [item.packageName, { path: item.path, sha256: sha(read(`dist/yeeflow-app-builder-plugin/${item.path}`)) }]));
if (distribution.artifacts.some((item) => currentArtifacts[item.packageName].sha256 !== item.sha256)) fail("PHASE_CLOSURE_PROOF_LINEAGE_UNDOCUMENTED_CHANGE");
let previousSource = lineage.protectedClosure.baselineSha256; let previousArtifacts = lineage.closureArtifactBaselines;
for (const transition of lineage.approvedTransitions) {
  const kind = transition.kind || (transition.phase === expectedPhases[0] ? "routing" : ""); const allowed = transition.allowedFiles || (transition.phase === expectedPhases[0] ? [transition.evidencePath] : []);
  if (!transition.phase || !["routing", "artifact-only"].includes(kind) || !Array.isArray(allowed) || !allowed.length || allowed.some((path) => !path || path.includes("*") || path.endsWith("/"))) fail("PHASE_CLOSURE_PROOF_LINEAGE_BASELINE_STALE");
  if (transition.sourceTransition?.beforeSha256 !== previousSource || !transition.sourceTransition?.afterSha256 || !Array.isArray(transition.sourceTransition.requiredSourceTokens) || !transition.sourceTransition.requiredSourceTokens.length || !transition.sourceTransition.requiredSourceTokens.every((token) => source.includes(token))) fail("PHASE_CLOSURE_PROOF_LINEAGE_UNDOCUMENTED_CHANGE");
  if (kind === "artifact-only" && transition.sourceTransition.afterSha256 !== previousSource) fail("PHASE_CLOSURE_PROOF_LINEAGE_BASELINE_STALE");
  if (transition.beforeArtifactState && JSON.stringify(transition.beforeArtifactState) !== JSON.stringify(previousArtifacts)) fail("PHASE_CLOSURE_PROOF_LINEAGE_BASELINE_STALE");
  if (!transition.artifactState || !transition.requiredEvidenceMarker) fail("PHASE_CLOSURE_PROOF_LINEAGE_BASELINE_STALE");
  const evidencePath = kind === "artifact-only" ? transition.promotionContractPath : transition.evidencePath; const evidenceSha = kind === "artifact-only" ? transition.promotionContractSha256 : transition.evidenceSha256;
  if (!evidencePath || !evidenceSha || !existsSync(resolve(root, evidencePath)) || sha(read(evidencePath)) !== evidenceSha) fail("PHASE_CLOSURE_PROOF_LINEAGE_TAMPERED");
  const reportPath = kind === "artifact-only" ? transition.promotionReportPath : transition.reportPath;
  const reportSha = kind === "artifact-only" ? transition.promotionReportSha256 : transition.reportSha256;
  const missingReportCode = transition.phase === "phase-10e-data-list-sublist-scalar-summary-intent-selective-routing-proof"
    ? "PHASE_CLOSURE_PROOF_LINEAGE_TAMPERED"
    : "PHASE_CLOSURE_PROOF_LINEAGE_BASELINE_STALE";
  if (reportPath || reportSha) {
    if (!reportPath || !reportSha || !existsSync(resolve(root, reportPath))) fail(missingReportCode);
    if (sha(read(reportPath)) !== reportSha) fail("PHASE_CLOSURE_PROOF_LINEAGE_TAMPERED");
  }
  const evidence = json(evidencePath); if (evidence.decision?.marker !== transition.requiredEvidenceMarker && evidence.marker !== transition.requiredEvidenceMarker && !evidence.requiredMarkers?.includes(transition.requiredEvidenceMarker)) fail("PHASE_CLOSURE_PROOF_LINEAGE_TAMPERED");
  previousSource = transition.sourceTransition.afterSha256; previousArtifacts = transition.artifactState;
}
if (previousSource !== sha(source) || JSON.stringify(previousArtifacts) !== JSON.stringify(currentArtifacts)) fail("PHASE_CLOSURE_PROOF_LINEAGE_UNDOCUMENTED_CHANGE");
console.log("PHASE_CLOSURE_PROOF_LINEAGE_VALID");
function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); } function json(path) { return JSON.parse(read(path)); } function sha(value) { return createHash("sha256").update(value).digest("hex"); } function fail(code) { console.error(code); process.exit(1); }

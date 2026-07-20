#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
const closurePath = "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json";
const promotionPhase = "phase-14e-data-list-sublist-lookup-additional-field-configuration-public-distribution-promotion";
const routingPhase = "phase-14f-data-list-sublist-lookup-additional-field-configuration-selective-routing-proof";
const promotionPath = "compatibility/capability-manifests/data-list-sublist-lookup-additional-field-configuration-public-distribution-promotion.v0.1.0.json";
const promotionReport = "docs/architecture/yeeflow-app-builder-phase-14e-data-list-sublist-lookup-additional-field-configuration-public-distribution-promotion.v0.1.0.md";
const routingPath = "compatibility/capability-manifests/data-list-sublist-lookup-additional-field-configuration-selective-routing-proof.v0.1.0.json";
const routingReport = "docs/architecture/yeeflow-app-builder-phase-14f-data-list-sublist-lookup-additional-field-configuration-selective-routing-proof.v0.1.0.md";
const lineage = json(lineagePath);
if (lineage.approvedTransitions.some((entry) => entry.phase === promotionPhase || entry.phase === routingPhase)) throw Error("PHASE_14_CONFIGURATION_LINEAGE_ALREADY_RECORDED");
const previous = lineage.approvedTransitions.at(-1);
if (previous?.phase !== "phase-13f-data-list-sublist-embedded-lookup-selective-routing-proof") throw Error("PHASE_14_CONFIGURATION_LINEAGE_BASELINE_INVALID");
const beforeSource = previous.sourceTransition.afterSha256;
const afterSource = sha(read("scripts/materialize-full-app-generated-final.mjs"));
const beforeArtifactState = previous.artifactState;
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const artifactState = Object.fromEntries(distribution.artifacts.map((artifact) => [artifact.packageName, { path: artifact.path, sha256: artifact.sha256 }]));
const promotionAllowed = [
  "packages/app-builder-core-materializer/src/index.ts", "packages/app-builder-core-materializer/src/internal/data-list-sublist-lookup-additional-field-intent.ts",
  "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json", "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json", "scripts/build-core-distribution.mjs", "scripts/test-data-list-sublist-lookup-additional-field-configuration-distribution.mjs",
  "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs", "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json", promotionPath, promotionReport,
];
const routingAllowed = [
  "scripts/materialize-full-app-generated-final.mjs", "scripts/lib/materializer-core-adapter.mjs", "scripts/test-fixtures/data-list-sublist-embedded-lookup-routing-plan.mjs", "scripts/test-data-list-sublist-lookup-additional-field-configuration-routing.mjs", routingPath, routingReport,
];
const promotion = json(promotionPath);
promotion.artifactTransition = { before: beforeArtifactState, after: artifactState };
promotion.productionMaterializer = { path: "scripts/materialize-full-app-generated-final.mjs", beforeSha256: beforeSource, afterSha256: beforeSource, changed: false };
promotion.allowedFiles = promotionAllowed;
write(promotionPath, promotion);
const routing = json(routingPath);
routing.artifactState = artifactState;
routing.sourceTransition = { beforeSha256: beforeSource, afterSha256: afterSource };
routing.allowedRouteFiles = routingAllowed;
write(routingPath, routing);
const promotionTransition = { phase: promotionPhase, kind: "artifact-only", promotionContractPath: promotionPath, promotionContractSha256: sha(read(promotionPath)), promotionReportPath: promotionReport, promotionReportSha256: sha(read(promotionReport)), requiredEvidenceMarker: promotion.decision.marker, sourceTransition: { beforeSha256: beforeSource, afterSha256: beforeSource, requiredSourceTokens: previous.sourceTransition.requiredSourceTokens }, beforeArtifactState, artifactState, allowedFiles: promotionAllowed };
const routingTransition = { phase: routingPhase, kind: "routing", evidencePath: routingPath, evidenceSha256: sha(read(routingPath)), reportPath: routingReport, reportSha256: sha(read(routingReport)), requiredEvidenceMarker: routing.decision.marker, sourceTransition: { beforeSha256: beforeSource, afterSha256: afterSource, requiredSourceTokens: ["DATA_LIST_SUBLIST_LOOKUP_ADDITIONAL_CONFIGURATION_CORE_ROUTE_START", "applyDataListSublistLookupAdditionalFieldConfigurationAtHost", "coreProjectDataListSublistLookupAdditionalFieldIntent", "DATA_LIST_SUBLIST_LOOKUP_ADDITIONAL_CONFIGURATION_CORE_ROUTE_END"] }, beforeArtifactState: artifactState, artifactState, allowedFiles: routingAllowed };
lineage.approvedTransitions.push(promotionTransition, routingTransition);
write(lineagePath, lineage);
const closure = json(closurePath);
closure.closureProofLineage.approvedPhases = lineage.approvedTransitions.map((entry) => entry.phase);
closure.closureProofLineage.sha256 = sha(read(lineagePath));
write(closurePath, closure);
console.log("PHASE_14_CONFIGURATION_LINEAGE_RECORDED");
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function write(path, value) { writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`); }

#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
const closurePath = "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json";
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json";
const promotionPhase = "phase-13e-data-list-sublist-embedded-lookup-dual-public-distribution-promotion";
const routingPhase = "phase-13f-data-list-sublist-embedded-lookup-selective-routing-proof";
const promotionContractPath = "compatibility/capability-manifests/data-list-sublist-embedded-lookup-dual-public-distribution-promotion.v0.1.0.json";
const promotionReportPath = "docs/architecture/yeeflow-app-builder-phase-13e-data-list-sublist-embedded-lookup-dual-public-distribution-promotion.v0.1.0.md";
const routingContractPath = "compatibility/capability-manifests/data-list-sublist-embedded-lookup-selective-routing-proof.v0.1.0.json";
const routingReportPath = "docs/architecture/yeeflow-app-builder-phase-13f-data-list-sublist-embedded-lookup-selective-routing-proof.v0.1.0.md";
const lineage = json(lineagePath);
if (lineage.approvedTransitions.some((entry) => entry.phase === promotionPhase || entry.phase === routingPhase)) throw Error("PHASE_13_LOOKUP_LINEAGE_ALREADY_RECORDED");
const previous = lineage.approvedTransitions.at(-1);
if (previous?.phase !== "phase-12e-data-list-sublist-nested-control-placement-selective-routing-proof") throw Error("PHASE_13_LOOKUP_LINEAGE_BASELINE_INVALID");
const beforeSource = previous.sourceTransition.afterSha256;
const afterSource = sha(read("scripts/materialize-full-app-generated-final.mjs"));
const beforeArtifactState = previous.artifactState;
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const artifactState = Object.fromEntries(distribution.artifacts.map((artifact) => [artifact.packageName, { path: artifact.path, sha256: artifact.sha256 }]));
const promotionAllowed = [
  "packages/app-builder-core-materializer/src/index.ts",
  "packages/app-builder-core-materializer/src/internal/data-list-sublist-embedded-lookup-intent.ts",
  "runtimes/app-builder-core-local-runtime/src/index.ts",
  "runtimes/app-builder-core-local-runtime/src/internal-data-list-sublist-embedded-lookup-lowering.ts",
  "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json",
  "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json",
  "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json",
  "scripts/build-core-distribution.mjs",
  "scripts/test-data-list-sublist-embedded-lookup-distribution.mjs",
  "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs",
  "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs",
  "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json",
  promotionContractPath,
  promotionReportPath,
];
const routingAllowed = [
  "scripts/materialize-full-app-generated-final.mjs",
  "scripts/lib/materializer-core-adapter.mjs",
  "scripts/lib/local-runtime-core-adapter.mjs",
  "scripts/test-fixtures/data-list-sublist-embedded-lookup-routing-plan.mjs",
  "scripts/test-data-list-sublist-embedded-lookup-production-routing.mjs",
  routingContractPath,
  routingReportPath,
];
const promotion = {
  schemaVersion: "1.0.0", phase: promotionPhase,
  decision: { status: "complete", marker: "SUBLIST_EMBEDDED_LOOKUP_DUAL_DISTRIBUTION_VALID", nextPhase: routingPhase },
  publicExports: ["projectDataListSublistEmbeddedLookupIntent", "lowerDataListSublistEmbeddedLookupIntentAtHost"],
  corpus: { path: "compatibility/differential-fixtures/data-list-sublist-embedded-lookup-export.v0.1.0.json", surfaces: ["compiled source", "Plugin dist", "temporary official ZIP", "simulated installed Plugin"] },
  exclusions: ["additional fields writeback", "runtime Lookup execution", "target-map discovery", "template/resource mutation", "package output", "Approval Forms", "child resource identity"],
  productionMaterializer: { path: "scripts/materialize-full-app-generated-final.mjs", beforeSha256: beforeSource, afterSha256: beforeSource, changed: false },
  artifactTransition: { before: beforeArtifactState, after: artifactState }, allowedFiles: promotionAllowed,
};
write(promotionContractPath, promotion);
write(promotionReportPath, "# Phase 13E Embedded Sublist Lookup Dual Public Distribution Promotion\n\nThe official Core distribution builder promoted exactly `projectDataListSublistEmbeddedLookupIntent` and `lowerDataListSublistEmbeddedLookupIntentAtHost`. The export-derived target/display corpus passed compiled source, Plugin dist, temporary official ZIP, and simulated installed Plugin surfaces. Both APIs remain immutable and JSON-safe. `addition[]` writeback, runtime Lookup execution, target inventory discovery, template/resource mutation, package output, Approval Form semantics, and child-resource identity remain excluded.\n");
const promotionTransition = {
  phase: promotionPhase, kind: "artifact-only", promotionContractPath, promotionContractSha256: sha(read(promotionContractPath)), promotionReportPath, promotionReportSha256: sha(read(promotionReportPath)), requiredEvidenceMarker: promotion.decision.marker,
  sourceTransition: { beforeSha256: beforeSource, afterSha256: beforeSource, requiredSourceTokens: previous.sourceTransition.requiredSourceTokens }, beforeArtifactState, artifactState, allowedFiles: promotionAllowed,
};
const routing = {
  schemaVersion: "1.0.0", phase: routingPhase,
  decision: { status: "complete", marker: "SUBLIST_EMBEDDED_LOOKUP_MATERIALIZER_INTEGRATION_PARITY_PASSED", nextPhase: "phase-13g-data-list-sublist-embedded-lookup-family-closure-audit" },
  route: {
    callerPath: "buildDataListFormSubListControl -> buildDataListSubListColumn -> routeDataListSublistEmbeddedLookupAtHost",
    selectionCountPerEligibleEmbeddedLookupColumn: 1,
    targetIdentity: "Direct export-proven target ListID and ListSetID remain lossless strings.",
    embeddedColumnIdentity: "id and idx are embedded export-column semantics only, never child product resource identities.",
    excluded: ["addition writeback", "runtime Lookup execution", "target discovery", "read-only runtime enforcement", "template/resource mutation", "package output", "Approval Forms"],
  },
  verificationMarkers: ["SUBLIST_EMBEDDED_LOOKUP_SOURCE_ROUTING_PASSED", "SUBLIST_EMBEDDED_LOOKUP_ARCHIVE_ROUTING_PASSED", "SUBLIST_EMBEDDED_LOOKUP_INSTALLED_ROUTING_PASSED", "SUBLIST_EMBEDDED_LOOKUP_DETERMINISM_PASSED", "SUBLIST_EMBEDDED_LOOKUP_LEGACY_ROLLBACK_PASSED"],
  artifactState, sourceTransition: { beforeSha256: beforeSource, afterSha256: afterSource }, allowedRouteFiles: routingAllowed,
};
write(routingContractPath, routing);
write(routingReportPath, "# Phase 13F Embedded Sublist Lookup Selective Routing Proof\n\nProduction routes only a Data List embedded-Sublist Lookup column with explicit export-proven AppID 41 target ListID/ListSetID and `Title` display configuration. The route selects one immutable Core intent in `buildDataListSubListColumn` and lowers fresh custom-form `list-fields` metadata. Source, temporary official ZIP, and simulated installed Plugin runs were deterministic and passed. A temporary-copy rollback removed only the bridge and retained executable Legacy behavior. `addition[]` cross-field transfer, runtime Lookup execution, target discovery, runtime read-only enforcement, template/resource mutation, package output, and Approval Form semantics were not routed.\n");
const routingTransition = { phase: routingPhase, kind: "routing", evidencePath: routingContractPath, evidenceSha256: sha(read(routingContractPath)), reportPath: routingReportPath, reportSha256: sha(read(routingReportPath)), requiredEvidenceMarker: routing.decision.marker, sourceTransition: { ...routing.sourceTransition, requiredSourceTokens: ["DATA_LIST_SUBLIST_EMBEDDED_LOOKUP_CORE_ROUTE_START", "routeDataListSublistEmbeddedLookupAtHost", "coreProjectDataListSublistEmbeddedLookupIntent", "coreLowerDataListSublistEmbeddedLookupIntentAtHost", "DATA_LIST_SUBLIST_EMBEDDED_LOOKUP_CORE_ROUTE_END"] }, beforeArtifactState: artifactState, artifactState, allowedFiles: routingAllowed };
lineage.approvedTransitions.push(promotionTransition, routingTransition);
write(lineagePath, lineage);
const closure = json(closurePath);
closure.closureProofLineage.approvedPhases = lineage.approvedTransitions.map((entry) => entry.phase);
closure.closureProofLineage.sha256 = sha(read(lineagePath));
write(closurePath, closure);
const state = json(statePath);
state.migration.currentPhase = routingPhase;
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = routing.decision.nextPhase;
state.completed.push({ id: promotionPhase, status: "complete", evidence: "2026-07-19: exactly two immutable Data List embedded-Sublist Lookup APIs promoted through the official distribution builder." });
state.completed.push({ id: routingPhase, status: "complete", evidence: "2026-07-19: direct export-proven Lookup target/display configuration routed only to Data List Sublist custom-form list-fields; addition writeback remains deferred." });
state.proofStatus.dataListSublistEmbeddedLookupPublicDistribution = "passed";
state.proofStatus.dataListSublistEmbeddedLookupRouting = "passed";
write(statePath, state);
console.log("PHASE_13E_F_LOOKUP_PROMOTION_AND_ROUTING_RECORDED");

function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function write(path, value) { writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`); }

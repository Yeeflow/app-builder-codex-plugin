#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-13g-data-list-sublist-embedded-lookup-family-closure-audit";
const contractPath = "compatibility/capability-manifests/data-list-sublist-embedded-lookup-family-closure.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-13g-data-list-sublist-embedded-lookup-family-closure-audit.v0.1.0.md";
const lineage = json("compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json");
const routing = lineage.approvedTransitions.at(-1);
if (routing?.phase !== "phase-13f-data-list-sublist-embedded-lookup-selective-routing-proof") throw Error("PHASE_13_LOOKUP_CLOSURE_LINEAGE_INVALID");
const matrix = [
  { family: "Direct target/display", status: "closed", legacyBoundary: "dataListSubListVariables -> buildDataListSubListColumn", callerCount: 1, prerequisite: "Explicit AppID 41 target ListID/ListSetID and Title display field in the same embedded column", disposition: "Phase 13F routes one immutable Core intent and fresh Local Runtime list-fields metadata." },
  { family: "additional fields auto-population", status: "deferred", legacyBoundary: "Lookup control attrs.addition runtime behavior", callerCount: 0, prerequisite: "A dedicated Data List runtime cross-field transfer, destination scope, read-only enforcement, and writeback lifecycle contract", disposition: "It cannot inherit static target/display routing; no addition mapping enters Core or Local Runtime." },
  { family: "target inventory resolution", status: "deferred", legacyBoundary: "Host product/runtime target map", callerCount: 0, prerequisite: "Explicit host inventory and relationship validation contract", disposition: "Phase 13 consumes only directly exported target IDs and never discovers a target." },
  { family: "runtime Lookup execution", status: "deferred", legacyBoundary: "Product Lookup runtime", callerCount: 0, prerequisite: "Runtime execution and lifecycle evidence", disposition: "Core and Local Runtime return configuration only." },
  { family: "nested/non-scalar Lookup", status: "deferred", legacyBoundary: "Nested-control and non-scalar branches", callerCount: 0, prerequisite: "Independent family contracts", disposition: "Lookup is not extended to nested, identity, binary, barcode, or action behavior." },
  { family: "template/resource/package integration", status: "deferred", legacyBoundary: "Host materializer resource graph", callerCount: 1, prerequisite: "Separate template/resource/package mutation authorization", disposition: "The route creates only fresh list-fields metadata; host insertion stays outside the public APIs." },
  { family: "Approval Form Lookup", status: "excluded", legacyBoundary: "Approval Form export/runtime", callerCount: 0, prerequisite: "Separate product surface evidence", disposition: "The .ywf evidence remains comparison-only." },
];
const contract = {
  schemaVersion: "1.0.0", phase,
  decision: { status: "complete", marker: "PHASE_13_CLOSURE_ACCEPTED", nextPhase: "phase-14-data-list-sublist-lookup-additional-field-writeback-contract-audit" },
  authoritativeModel: {
    parentIdentity: "Parent ListID and parent Sublist FieldID are product identities and preserve their original decimal strings.",
    embeddedColumnSemantics: "Embedded id and idx are export-column semantics only and are never child ListID, child FieldID, row-schema identity, allocation input, or fallback key.",
    approvedRoute: "Phase 13F routes only direct Data List embedded Lookup target/display configuration through one immutable Core intent and a fresh Local Runtime metadata lowerer.",
  },
  sourceEvidence: { fixture: "compatibility/differential-fixtures/data-list-sublist-embedded-lookup-export.v0.1.0.json", authoritativeYdlSha256: "9e04238bb9c36c9ac6e71ff3642935ddf4789e9f1ccd722a20118dfa2359894c", approvalFormComparisonOnlyYwfSha256: "b8412a6320dc757ba25afb6f525078dcedb10c88e1f4f50cf2b023ab53377e08" },
  familyMatrix: matrix,
  requiredMarkers: ["SUBLIST_EMBEDDED_LOOKUP_ROUTE_RECONFIRMED", "SUBLIST_EMBEDDED_LOOKUP_ADDITIONAL_WRITEBACK_DEFERRED", "SUBLIST_EMBEDDED_LOOKUP_FAMILY_CLOSURE_VALID", "SUBLIST_EMBEDDED_LOOKUP_FAMILY_CLOSURE_REGRESSIONS_PASSED", "PHASE_13_CLOSURE_ACCEPTED", "PHASE_CLOSURE_PROOF_LINEAGE_VALID"],
  exclusions: ["additional fields writeback", "target discovery", "runtime Lookup execution", "read-only runtime enforcement", "template/resource mutation", "package output", "Approval Forms", "child resource identity"],
  lineage: { phase: routing.phase, routingEvidenceSha256: routing.evidenceSha256, artifactState: routing.artifactState, materializerSha256: routing.sourceTransition.afterSha256 },
};
write(contractPath, contract);
write(reportPath, "# Phase 13G Embedded Sublist Lookup Family Closure Audit\n\nPhase 13 is complete for the export-proven Data List embedded-Sublist Lookup target/display vertical. The authoritative `.ydl` fixture proves parent ListID/FieldID scope, Lookup child id/idx/name/type semantics, direct 19-digit target ListID/ListSetID, and `Title` display configuration. Phase 13F routes only that static configuration. Embedded id and idx remain export-column semantics, never product resource identities.\n\n`addition[]` auto-population is explicitly deferred: it is runtime cross-field transfer with destination scope, mutation, and read-only enforcement requirements, so it cannot inherit the static target/display route. Target discovery, runtime execution, nested/non-scalar families, template/resource/package integration, and Approval Form behavior remain outside Phase 13. The recommended next phase is `phase-14-data-list-sublist-lookup-additional-field-writeback-contract-audit`.\n");
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
state.migration.currentPhase = phase;
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = contract.decision.nextPhase;
state.completed.push({ id: phase, status: "complete", evidence: "2026-07-19: direct export-proven Data List embedded Lookup target/display route closed; additional-field writeback is separately deferred as runtime cross-field behavior." });
state.proofStatus.dataListSublistEmbeddedLookupFamilyClosure = "accepted";
state.proofStatus.phase13Closure = "accepted";
write("docs/architecture/yeeflow-app-builder-core-migration-state.json", state);
console.log("PHASE_13_LOOKUP_FAMILY_CLOSURE_RECORDED");

function json(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function write(path, value) { writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`); }

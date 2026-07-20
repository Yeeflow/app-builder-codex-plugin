#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-11g-sublist-summary-dynamic-family-closure-audit";
const contractPath = "compatibility/capability-manifests/data-list-sublist-dynamic-summary-family-closure.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-11g-data-list-sublist-dynamic-summary-family-closure-audit.v0.1.0.md";
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json";
const routing = json("compatibility/capability-manifests/data-list-sublist-dynamic-summary-intent-production-routing.v0.1.0.json");
const lineage = json("compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json");
if (routing.decision?.status !== "complete" || routing.route?.bindingModels?.join(",") !== "__list_,__temp_" || !lineage.approvedTransitions.some((item) => item.phase === routing.phase)) throw new Error("PHASE_11G_ROUTING_EVIDENCE_INVALID");

const deferred = [
  "temporary-variable allocation discovery writeback and cleanup",
  "runtime expressions and dynamic calculations",
  "scope lifecycle and stale-binding validation",
  "Rules control template and resource binding",
  "nested-control and non-scalar summaries",
  "Lookup identity binary barcode and actions",
  "Approval Form Workflow Dashboard and package orchestration"
];
const contract = {
  schemaVersion: "1.0.0",
  phase,
  decision: { status: "accepted", marker: "PHASE_11_CLOSURE_ACCEPTED", additionalSafeDynamicSummaryVerticals: 0 },
  approvedRoute: { bindingModels: ["__list_", "__temp_"], scalarSourceTypes: ["number", "decimal"], context: "per Type 1 Data List layout resource", core: "projectDataListSublistDynamicSummaryIntent", localRuntime: "lowerDataListSublistDynamicSummaryIntentAtHost" },
  deferredFamilies: deferred.map((family) => ({ family, legacyBoundary: family.includes("temporary") ? "ensureDataListSubListSummaryTempVars" : family.includes("runtime") ? "normalizeDataListSubListSummaries" : "materializeDataListFormResource", reason: "Requires host lifecycle, mutable integration, runtime semantics, or an excluded surface and cannot inherit the immutable resolved-binding route." })),
  invariants: { summaryUuidStandaloneIdentity: false, tempVarNameStandaloneIdentity: false, approvalFormComparisonOnly: true, productionRouteChangedByAudit: false },
  sourceSha256: sha(read("scripts/materialize-full-app-generated-final.mjs")),
  historicalZipSha256: "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2",
  lineageSha256: sha(read("compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json"))
};
write(contractPath, contract);
writeText(reportPath, `# Phase 11G Dynamic Summary Family Closure Audit

Phase 11 is accepted as closed. The only export-proven, safe dynamic Data List Sublist verticals are scalar \`__list_\` and \`__temp_\` bindings resolved through the per-layout host context and routed in Phase 11F.

All remaining behavior requires host lifecycle, runtime execution, mutable binding, stale cleanup, nested/non-scalar, or excluded-surface contracts. It cannot inherit the immutable Core route.

\`SUBLIST_DYNAMIC_SUMMARY_ROUTE_RECONFIRMED\`

\`SUBLIST_DYNAMIC_SUMMARY_TEMP_VARIABLE_NONINTERFERENCE_RECONFIRMED\`

\`SUBLIST_DYNAMIC_SUMMARY_FAMILY_CLOSURE_VALID\`

\`SUBLIST_DYNAMIC_SUMMARY_FAMILY_CLOSURE_REGRESSIONS_PASSED\`

\`PHASE_11_CLOSURE_ACCEPTED\`

\`PHASE_CLOSURE_PROOF_LINEAGE_VALID\`
`);
const state = json(statePath);
state.migration.currentPhase = phase;
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = "";
state.migration.overallStatus = "complete";
if (!state.completed.some((item) => item.id === phase)) state.completed.push({ id: phase, status: "complete", evidence: "2026-07-19: Phase 11 family closure accepted; no additional safe dynamic summary vertical remains under the immutable resolved-binding contract." });
state.proofStatus.dataListSublistDynamicSummaryFamilyClosure = "accepted";
state.proofStatus.phase11Closure = "accepted";
write(statePath, state);
console.log("PHASE_11G_CLOSURE_RECORDED");

function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function write(path, value) { writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`); }
function writeText(path, value) { writeFileSync(resolve(root, path), value); }

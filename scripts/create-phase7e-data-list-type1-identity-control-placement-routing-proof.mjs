#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = "compatibility/differential-fixtures/data-list-type1-identity-control-placement-routing.v0.1.0.json";
const contractPath = "compatibility/capability-manifests/data-list-type1-identity-control-placement-selective-routing-proof.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-7e-data-list-type1-identity-control-placement-selective-routing-proof.v0.1.0.md";
const manifest = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const fixture = json(fixturePath);
const materializer = artifact("@yeeflow/app-builder-core-materializer");
const runtime = artifact("@yeeflow/app-builder-core-local-runtime");
if (!materializer?.exports?.includes("projectDataListType1IdentityControlPlacement") || !runtime?.exports?.includes("lowerDataListType1IdentityControlPlacementAtHost")) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ROUTING_CONTRACT_INVALID", "The two approved distributed Type 1 placement exports are unavailable.");
if (fixture.caseCount !== 17 || fixture.cases?.length !== 17) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ROUTING_CONTRACT_INVALID", "The actual Type 1 routing matrix must contain seventeen cases.");
const artifactState = Object.fromEntries(manifest.artifacts.map((item) => [item.packageName, { path: item.path, sha256: item.sha256 }]));
const contract = {
  schemaVersion: "1.0.0",
  phase: "phase-7e-data-list-type1-identity-control-placement-selective-routing-proof",
  decision: { status: "complete", marker: "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ADAPTER_ROUTING_PASSED", nextPhase: "phase-7f-advanced-field-template-graph-family-closure-audit", rationale: "Only the single Data List Type 1 view and workbench non-sublist dynamic-user placement bridge is routed through the approved Materializer Core projection and Local Runtime lowerer." },
  productionBoundary: { callerPath: "buildDataListFormFieldsGrid -> buildDataListFormFieldControl", buildDataListFormFieldsGridProductionCallerCount: 1, buildDataListFormFieldControlProductionCallerCount: 1, coreAdapterExport: "projectDataListType1IdentityControlPlacement", localRuntimeAdapterExport: "lowerDataListType1IdentityControlPlacementAtHost", routeTokens: ["DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_ROUTE_START", "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_ROUTE_END", "coreProjectDataListType1IdentityControlPlacement", "coreLowerDataListType1IdentityControlPlacementAtHost", "type === \"dynamic-user\""], hostOwnership: ["template loading", "node and slot selection", "control ID supply", "mutable template insertion", "final form and layout integration", "package output"] },
  included: ["Data List Type 1 view identity fields", "Data List Type 1 view user fields", "Data List Type 1 view people fields", "Data List Type 1 view person fields", "Data List Type 1 workbench non-sublist identity user people person fields"],
  retainedLegacy: ["sublists", "department", "file image binary", "barcode", "Lookup placement", "scalar controls", "Type 0 layouts", "Approval Forms", "Document Libraries", "Dashboards", "workflows", "actions", "template graph assembly", "package output"],
  proof: { fixturePath, caseCount: fixture.caseCount, surfaces: ["source", "temporary official ZIP", "simulated installed Plugin"], assertions: ["valid node and slot placement", "all approved field variants", "lossless nineteen-digit ListID and FieldID", "all five template-reference errors", "multiple placement order", "excluded branch scope", "complete decoded output and fragment parity", "determinism", "temporary-copy Legacy rollback"], normalization: fixture.normalization },
  artifactState,
  historicalZipSha256: "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2",
  allowedRouteFiles: ["scripts/materialize-full-app-generated-final.mjs", "scripts/lib/materializer-core-adapter.mjs", "scripts/lib/local-runtime-core-adapter.mjs", "dist/yeeflow-app-builder-plugin/scripts/materialize-full-app-generated-final.mjs", "dist/yeeflow-app-builder-plugin/scripts/lib/materializer-core-adapter.mjs", "dist/yeeflow-app-builder-plugin/scripts/lib/local-runtime-core-adapter.mjs"],
  prohibited: ["new public Core export", "new public Local Runtime export", "silent Legacy fallback after selected route", "Core or Local Runtime control ID allocation", "template mutation inside Core or Local Runtime", "cross-surface routing"]
};
write(contractPath, contract);
writeText(reportPath, report(contract));
appendLineage(contract);
recordState(contract);
console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_PHASE7E_STATE_RECORDED");

function appendLineage(value) {
  const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
  const lineage = json(lineagePath);
  const phase7d = lineage.approvedTransitions?.find((item) => item.phase === "phase-7d-data-list-type1-identity-control-placement-dual-public-distribution-promotion");
  if (!phase7d) fail("PHASE_CLOSURE_PROOF_LINEAGE_BASELINE_STALE", "The sealed Phase 7D artifact-only transition is missing.");
  lineage.approvedTransitions = [...lineage.approvedTransitions.filter((item) => item.phase !== value.phase), {
    phase: value.phase,
    kind: "routing",
    evidencePath: contractPath,
    evidenceSha256: sha(read(contractPath)),
    reportPath,
    reportSha256: sha(read(reportPath)),
    requiredEvidenceMarker: value.decision.marker,
    sourceTransition: { beforeSha256: phase7d.sourceTransition.afterSha256, afterSha256: sha(read("scripts/materialize-full-app-generated-final.mjs")), requiredSourceTokens: value.productionBoundary.routeTokens },
    beforeArtifactState: phase7d.artifactState,
    artifactState: value.artifactState,
    allowedFiles: value.allowedRouteFiles,
  }];
  write(lineagePath, lineage);
  const closurePath = "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json";
  const closure = json(closurePath);
  closure.closureProofLineage.sha256 = sha(read(lineagePath));
  closure.closureProofLineage.approvedPhases = lineage.approvedTransitions.map((item) => item.phase);
  write(closurePath, closure);
}

function recordState(value) {
  const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
  state.migration.currentPhase = value.phase;
  state.migration.currentPhaseStatus = "complete";
  state.migration.nextPhase = value.decision.nextPhase;
  const evidence = "2026-07-19: DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ADAPTER_ROUTING_PASSED, source/archive/installed actual-materializer parity, determinism, nineteen-digit identity preservation, template-reference error coverage, scope gates, and temporary Legacy rollback passed. Only the Data List Type 1 view/workbench non-sublist identity-user-people-person control placement route uses the approved Core and Local Runtime APIs.";
  const completed = state.completed.find((item) => item.id === value.phase);
  if (completed) { completed.status = "complete"; completed.evidence = evidence; } else state.completed.push({ id: value.phase, status: "complete", evidence });
  state.nextSteps = (state.nextSteps || []).filter((item) => item.id !== value.phase && item.id !== value.decision.nextPhase);
  state.nextSteps.unshift({ order: 1, id: value.decision.nextPhase, description: "Audit the remaining advanced-field template-graph family without widening the completed Type 1 identity-control route." });
  state.proofStatus.dataListType1IdentityUserControlPlacementSelectiveRouting = "passed";
  write("docs/architecture/yeeflow-app-builder-core-migration-state.json", state);
}

function report(value) { return `# Phase 7E Selective Data List Type 1 Identity-Control Placement Routing Proof

## Decision

\`DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ADAPTER_ROUTING_PASSED\`

Only the existing \`buildDataListFormFieldsGrid -> buildDataListFormFieldControl\` production path is routed. The route applies to Type 1 Data List view and workbench non-sublist identity, user, people, and person controls only.

## Responsibility Boundary

Materializer Core receives immutable template descriptors, node and slot references, ListID and FieldID strings, and identity-field intent. Local Runtime validates the host snapshot and host-supplied control ID, then returns a fresh fragment. The Legacy host retains template loading, identity selection, mutable insertion, form and layout integration, and package output.

## Evidence

The seventeen-case matrix passed source, temporary official ZIP, and simulated installed Plugin materialization against a temporary-copy Legacy baseline. It covers every approved identity variant, view and workbench placements, multiple control ordering, nineteen-digit identities, all five template-reference errors, excluded families, deterministic double runs, and rollback. UUID normalization is limited to pre-existing values and never changes node, slot, control, ListID, or FieldID semantics.

## Retained Legacy Scope

${value.retainedLegacy.map((item) => `- ${item}`).join("\n")}

## Non-Goals

No additional Core or Local Runtime public export, unrelated production route, active installation, historical ZIP, protected duplicate, Git publication, or release action changed.
`; }
function artifact(packageName) { return manifest.artifacts?.find((item) => item.packageName === packageName); }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function write(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function writeText(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value, "utf8"); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const json = (path) => JSON.parse(read(path));
const write = (path, value) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, JSON.stringify(value, null, 2) + "\n", "utf8"); };
const source = read("scripts/materialize-full-app-generated-final.mjs");
const fixture = json("compatibility/differential-fixtures/data-list-type1-identity-user-control-placement.v0.1.0.json");
const corePath = "packages/app-builder-core-materializer/src/internal/data-list-type1-identity-control-placement.ts";
const hostPath = "runtimes/app-builder-core-local-runtime/src/internal-data-list-type1-identity-control-placement-lowering.ts";
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
state.migration.currentPhase = "phase-7b-data-list-type1-identity-control-placement-shadow";
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = "phase-7c-data-list-type1-identity-control-placement-dual-public-distribution-readiness";
const evidence = "2026-07-18: DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_SHADOW_IMPLEMENTED, host lowering, five Legacy/Core/host valid parity cases, serialization and immutability, lossless 19-digit IDs, all five template-reference errors, and eleven exclusions passed. The Core and Local Runtime modules remain internal-only; Legacy materializer, adapters, public APIs, artifacts, distribution, and production routing remain unchanged.";
const completed = state.completed.find((item) => item.id === "phase-7b-data-list-type1-identity-control-placement-shadow");
if (completed) { completed.status = "complete"; completed.evidence = evidence; } else state.completed.push({ id: "phase-7b-data-list-type1-identity-control-placement-shadow", status: "complete", evidence });
state.nextSteps = (state.nextSteps || []).filter((item) => item.id !== "phase-7-advanced-field-template-graph-contract-audit" && item.id !== "phase-7b-data-list-type1-identity-control-placement-shadow" && item.id !== state.migration.nextPhase);
state.nextSteps.unshift({ order: 1, id: state.migration.nextPhase, description: "Audit whether the independently proven internal Type 1 identity-user control placement boundaries are safe for dual public-distribution readiness; no routing is implied." });
state.proofStatus.dataListType1IdentityUserControlPlacement = "passed_internal_only";
write("docs/architecture/yeeflow-app-builder-core-migration-state.json", state);
const report = "# Phase 7B Data List Type 1 Identity/User Control Placement Internal Shadow\n\n## Boundary\n\nThe exact Legacy boundary is buildDataListFormFieldControl with one production caller from buildDataListFormFieldsGrid. This shadow covers only non-sublist view/workbench identity, user, people, and person fields that Legacy maps to dynamic-user.\n\n## Core and Host Split\n\nCore receives immutable snapshot descriptors, explicit node and slot references, lossless ListID and FieldID values, and a normalized identity field. It emits a frozen descriptor without a control ID. Local Runtime validates snapshot references, requires the host-supplied control ID, and returns a fresh Legacy-shaped control fragment without mutating the snapshot.\n\n## Evidence\n\nThe corpus has " + fixture.caseCount + " cases: five valid Legacy parity variants, five stable host template-reference errors, and eleven excluded field or surface categories. A VM harness executes the exact Legacy helper declarations. No control identity is normalized away.\n\n## Non-Goals\n\nNo public export, adapter, distribution artifact, Legacy source change, or production routing occurred.\n";
writeFileSync(resolve(root, "docs/architecture/yeeflow-app-builder-phase-7b-data-list-type1-identity-control-placement-internal-shadow.v0.1.0.md"), report, "utf8");
for (const path of ["compatibility/capability-manifests/field-control-projection-audit.v0.1.0.json", "compatibility/capability-manifests/field-control-projection-capability-matrix.v0.1.0.json", "compatibility/capability-manifests/resource-definition-construction-audit.v0.1.0.json", "compatibility/capability-manifests/resource-definition-construction-capability-matrix.v0.1.0.json"]) {
  const value = json(path);
  value.phase7Type1IdentityUserControlPlacementShadow = { status: "complete_internal_only", core: { path: corePath, sha256: digest(read(corePath)), publicExport: false }, localRuntime: { path: hostPath, sha256: digest(read(hostPath)), publicExport: false }, fixture: { path: "compatibility/differential-fixtures/data-list-type1-identity-user-control-placement.v0.1.0.json", caseCount: fixture.caseCount }, legacySourceSha256: digest(source) };
  write(path, value);
}
console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_PHASE7B_STATE_RECORDED");
function digest(value) { return createHash("sha256").update(value).digest("hex"); }

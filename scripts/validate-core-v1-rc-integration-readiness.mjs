#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readinessPath = argument("--contract", "compatibility/capability-manifests/core-v1-rc-integration-readiness.v1.0.0.json");
const readiness = json(readinessPath);
const assembly = json(readiness.candidateAssemblyContract);
const matrix = json(readiness.coverageMatrix);
const rollback = json(readiness.rollbackInstallPlan);
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");

expect(readiness.phase === "core-v1-release-candidate-integration-and-application-e2e-readiness", "CORE_V1_RC_PHASE_INVALID");
expect(readiness.decision?.status === "accepted" && readiness.decision?.marker === "CORE_V1_RC_INTEGRATION_READINESS_ACCEPTED", "CORE_V1_RC_DECISION_INVALID");
expect(readiness.decision?.nextPhase === "core-v1-rc-candidate-build-and-isolated-e2e-validation", "CORE_V1_RC_NEXT_PHASE_INVALID");
expect(assembly.marker === "CORE_V1_RC_CANDIDATE_ASSEMBLY_CONTRACT_VALID", "CORE_V1_RC_ASSEMBLY_MARKER_INVALID");
expect(assembly.candidate?.releaseVersion === "1.0.0-rc.1", "CORE_V1_RC_VERSION_POLICY_INVALID");
expect(assembly.candidate?.currentWorkspaceIsNotCandidate === true, "CORE_V1_RC_WORKSPACE_CANDIDATE_CONFUSION");
expect(assembly.isolatedAssembly?.required === true && assembly.isolatedAssembly?.workspaceMutationForbidden === true && assembly.isolatedAssembly?.activeInstallationMutationForbidden === true, "CORE_V1_RC_ISOLATION_POLICY_INVALID");
expect(assembly.isolatedAssembly?.assemblyMethod?.includes("explicit audited allowlist"), "CORE_V1_RC_DIRTY_WORKTREE_POLICY_INVALID");
expect(Array.isArray(assembly.isolatedAssembly?.forbiddenInputs) && assembly.isolatedAssembly.forbiddenInputs.includes("node_modules") && assembly.isolatedAssembly.forbiddenInputs.includes("historical ZIP"), "CORE_V1_RC_SNAPSHOT_LEAKAGE_POLICY_INVALID");
expect(Array.isArray(assembly.releaseGates?.prohibitedInThisReadinessAudit) && ["version bump", "candidate build", "signing", "installation", "release"].every((item) => assembly.releaseGates.prohibitedInThisReadinessAudit.includes(item)), "CORE_V1_RC_RELEASE_BYPASS_NOT_REJECTED");
expect(matrix.marker === "CORE_V1_RC_APPLICATION_E2E_COVERAGE_MATRIX_VALID" && Array.isArray(matrix.surfaces), "CORE_V1_RC_COVERAGE_MATRIX_INVALID");
const requiredSurfaces = ["data-list-scalar-fields", "data-list-embedded-sublist-descriptor", "data-list-sublist-static-and-dynamic-summaries", "data-list-sublist-lookup-and-addition-configuration", "data-list-sublist-identity-controls", "approval-form-static-configuration", "workflow-static-projections", "dashboard-static-configuration"];
expect(requiredSurfaces.every((id) => matrix.surfaces.some((item) => item.id === id)), "CORE_V1_RC_COVERAGE_SURFACE_MISSING");
expect(matrix.surfaces.length === requiredSurfaces.length, "CORE_V1_RC_COVERAGE_SURFACE_UNSCOPED");
for (const surface of matrix.surfaces) {
  expect(Array.isArray(surface.requiredCommands) && surface.requiredCommands.length > 0, "CORE_V1_RC_COVERAGE_COMMAND_MISSING");
  expect(Array.isArray(surface.runtimeExclusions) && surface.runtimeExclusions.length > 0, "CORE_V1_RC_RUNTIME_BOUNDARY_MISSING");
}
expect(rollback.marker === "CORE_V1_RC_ROLLBACK_AND_ISOLATED_INSTALL_PLAN_VALID", "CORE_V1_RC_ROLLBACK_PLAN_INVALID");
expect(rollback.installScope?.includes("disposable isolated target") && rollback.rejectionConditions?.includes("Target equals active installation"), "CORE_V1_RC_ACTIVE_INSTALL_GUARD_INVALID");
for (const [key, entry] of Object.entries(assembly.baseline || {})) {
  if (!entry || typeof entry !== "object" || !entry.path || !entry.sha256) continue;
  expect(existsSync(resolve(root, entry.path)), `CORE_V1_RC_BASELINE_MISSING:${key}`);
  expect(shaFile(entry.path) === entry.sha256, `CORE_V1_RC_BASELINE_CHECKSUM_MISMATCH:${key}`);
}
for (const [pathKey, shaKey] of [["coreV1Closure", "coreV1ClosureSha256"], ["distributionManifest", "distributionManifestSha256"], ["closureLineage", "closureLineageSha256"]]) {
  expect(sha(read(readiness.authorities[pathKey])) === readiness.authorities[shaKey], `CORE_V1_RC_AUTHORITY_CHECKSUM_MISMATCH:${pathKey}`);
}
expect(state.migration.currentPhase === readiness.phase && state.migration.currentPhaseStatus === "complete" && state.migration.nextPhase === readiness.decision.nextPhase, "CORE_V1_RC_MIGRATION_STATE_STALE");
expect(state.proofStatus?.coreV1RcIntegrationReadiness === "accepted", "CORE_V1_RC_PROOF_STATUS_STALE");
console.log("CORE_V1_RC_CANDIDATE_ASSEMBLY_CONTRACT_VALID");
console.log("CORE_V1_RC_APPLICATION_E2E_COVERAGE_MATRIX_VALID");
console.log("CORE_V1_RC_ROLLBACK_AND_ISOLATED_INSTALL_PLAN_VALID");
console.log("CORE_V1_RC_INTEGRATION_READINESS_VALID");

function argument(name, fallback) { const index = process.argv.indexOf(name); return index < 0 ? fallback : process.argv[index + 1]; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function shaFile(path) { return createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex"); }
function json(path) { try { return JSON.parse(read(path)); } catch { fail(`CORE_V1_RC_JSON_INVALID:${path}`); } }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function expect(condition, code) { if (!condition) fail(code); }
function fail(code) { console.error(code); process.exit(1); }

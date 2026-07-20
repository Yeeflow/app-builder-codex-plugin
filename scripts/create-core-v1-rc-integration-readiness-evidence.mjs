#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json";
const contractPath = "compatibility/capability-manifests/core-v1-rc-integration-readiness.v1.0.0.json";
const phase = "core-v1-release-candidate-integration-and-application-e2e-readiness";
const state = json(statePath);
state.lastUpdated = "2026-07-20";
state.migration.currentPhase = phase;
state.migration.currentPhaseStatus = "complete";
state.migration.overallStatus = "core_v1_rc_readiness_accepted";
state.migration.nextPhase = "core-v1-rc-candidate-build-and-isolated-e2e-validation";
state.completed = (state.completed || []).filter((item) => item.id !== phase);
state.completed.push({ id: phase, status: "complete", evidence: contractPath });
state.inProgress = [];
state.nextSteps = [
  { order: 0, id: "core-v1-rc-candidate-build-and-isolated-e2e-validation", description: "Create a checksummed isolated 1.0.0-rc.1 candidate workspace, build only there, and execute the declared source/archive/installed and application E2E matrix before any signing or isolated-install request." },
  ...(state.nextSteps || []).filter((item) => item.id !== "core-v1-rc-candidate-build-and-isolated-e2e-validation")
];
state.proofStatus = {
  ...state.proofStatus,
  coreV1RcCandidateAssemblyContract: "passed",
  coreV1RcApplicationE2eCoverageMatrix: "passed",
  coreV1RcRollbackInstallPlan: "passed",
  coreV1RcIntegrationReadiness: "accepted",
  coreV1RcCandidateBuild: "not_started",
  coreV1RcIsolatedInstallAcceptance: "not_started",
  coreV1RcPromotion: "not_authorized"
};
write(statePath, state);
console.log("CORE_V1_RC_INTEGRATION_READINESS_EVIDENCE_WRITTEN");

function json(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }
function write(path, value) { writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`, "utf8"); }

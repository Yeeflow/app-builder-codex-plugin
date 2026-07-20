#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-14c-data-list-sublist-lookup-additional-field-runtime-evidence-blocker";
const contractPath = "compatibility/capability-manifests/data-list-sublist-lookup-additional-field-runtime-evidence-blocker.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-14c-data-list-sublist-lookup-additional-field-runtime-evidence-blocker.v0.1.0.md";
const fixture = json("compatibility/differential-fixtures/data-list-sublist-lookup-additional-field-writeback-export.v0.1.0.json");
const materializer = read("scripts/materialize-full-app-generated-final.mjs");
const absentRuntimeTokens = ["selection change", "clear selection", "addition writeback", "target record retrieval"];
const contract = {
  schemaVersion: "1.0.0", phase,
  decision: { status: "blocked", marker: "SUBLIST_LOOKUP_ADDITIONAL_WRITEBACK_RUNTIME_EVIDENCE_BLOCKED", nextStep: "Provide Data List runtime/designer evidence covering selection, initialization, edit, repeat, clear, missing target, destination mutation, and readonly enforcement." },
  provenStaticConfiguration: fixture.validCases[0],
  missingRuntimeEvidence: Object.keys(fixture.runtimeEvidence),
  localMaterializerBoundary: { path: "scripts/materialize-full-app-generated-final.mjs", hasStaticAdditionRoute: materializer.includes("attrs.addition"), hasRuntimeWritebackRoute: false, reason: "The generated-final materializer emits package configuration and has no Data List runtime event, target-record retrieval, or destination mutation loop for embedded Lookup additions." },
  prohibitedNextActions: ["public API promotion", "distribution promotion", "production metadata routing", "runtime target retrieval", "runtime writeback", "clear-value inference", "Approval Form reuse"],
  requiredExternalEvidence: ["selection-change event payload and target retrieval", "initialization behavior", "edit-mode rehydration", "repeat-selection behavior", "clear-selection destination behavior", "missing or invalid target behavior", "destination mutation authority", "readonly enforcement timing"],
};
write(contractPath, contract);
write(reportPath, "# Phase 14C Embedded Sublist Lookup Additional-Field Runtime Evidence Blocker\n\nThe static export proves configuration only: `Decimal5` maps to readonly `LeaveUsageHours` through Lookup `attrs.addition[]`. It does not contain a Data List runtime event contract. In particular, the export does not prove selection-change, initialization, edit-mode rehydration, repeat selection, clear selection, missing-target behavior, target retrieval, destination mutation, or readonly-enforcement timing. The generated-final materializer emits configuration and has no runtime event loop for this behavior.\n\nPhase 14 therefore stops before public distribution or production routing. A future continuation requires Data List runtime/designer evidence for the listed lifecycle cases. Approval Form evidence remains comparison-only.\n");
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
state.migration.currentPhase = phase;
state.migration.currentPhaseStatus = "blocked";
state.migration.overallStatus = "blocked";
state.migration.nextPhase = "external-data-list-lookup-additional-field-runtime-evidence";
state.blocked ||= [];
if (!state.blocked.some((entry) => entry.id === phase)) state.blocked.push({ id: phase, status: "blocked", reason: contract.decision.nextStep });
state.proofStatus.dataListSublistLookupAdditionalFieldWritebackRuntime = "blocked_missing_runtime_event_evidence";
write("docs/architecture/yeeflow-app-builder-core-migration-state.json", state);
console.log("SUBLIST_LOOKUP_ADDITIONAL_WRITEBACK_RUNTIME_EVIDENCE_BLOCKED");

function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function write(path, value) { writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`); }

#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "core-extraction-wave-plan-calibration-and-proof-envelope-clustering";
const inventory = json(argument("--inventory", "compatibility/capability-manifests/core-extraction-production-ownership-inventory.v0.7.0.json"));
const registry = json(argument("--registry", "compatibility/capability-manifests/core-extraction-proof-envelope-registry.v0.7.0.json"));
const plan = json(argument("--plan", "compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.8.0.json"));
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
const candidates = inventory.functions.filter((item) => (item.category === "core-now" && ["not-extracted", "parity-ready-static-configuration-candidate", "accepted-extracted-and-routed"].includes(item.extractionStatus)) || item.extractionStatus === "reclassified-host-orchestration");
const byId = new Map(candidates.map((item) => [item.id, item]));
const allById = new Map(inventory.functions.map((item) => [item.id, item]));
assert([phase, "core-extraction-wave-1-planning-normalization-execution", "core-extraction-wave-2-approval-form-sublist-lookup-static-configuration-projection", "core-extraction-wave3-batch-a-workflow-set-data-list-projection", "core-extraction-wave3-batch-b-workflow-query-data-static-plan", "core-extraction-wave3-batch-c-data-list-sublist-static-configuration", "core-extraction-wave3-batch-g-approval-form-static-configuration", "core-extraction-wave3-batch-h-application-plan-foundation-selection-and-execution", "core-extraction-wave3-batch-i-data-list-static-configuration-selection-and-execution", "core-extraction-wave3-batch-j-dashboard-static-configuration-selection-and-execution"].includes(registry.phase));
assert.equal(registry.summary.candidateFunctionCount, registry.assignments.length, "CORE_EXTRACTION_ENVELOPE_UNASSIGNED_FUNCTION");
const assignmentIds = new Set();
for (const assignment of registry.assignments) {
  assert(allById.has(assignment.functionId), `CORE_EXTRACTION_ENVELOPE_UNKNOWN_FUNCTION: ${assignment.functionId}`);
  assert(!assignmentIds.has(assignment.functionId), `CORE_EXTRACTION_ENVELOPE_OVERLAP: ${assignment.functionId}`);
  assignmentIds.add(assignment.functionId);
  const source = allById.get(assignment.functionId);
  if (assignment.status === "reclassified-host-orchestration") assert.equal(source.category, "host-runtime", `CORE_EXTRACTION_ENVELOPE_RECLASSIFICATION_MISSING:${assignment.functionId}`);
  else assert.equal(source.category, "core-now", `CORE_EXTRACTION_ENVELOPE_HOST_MEMBER: ${assignment.functionId}`);
  assert.equal(assignment.surface, surfaceFor(source), `CORE_EXTRACTION_ENVELOPE_CROSS_SURFACE_GROUPING: ${assignment.functionId}`);
  assert.equal(assignment.wave, waveFor(source, assignment.surface), `CORE_EXTRACTION_ENVELOPE_WAVE_MISMATCH: ${assignment.functionId}`);
  assert(!assignment.productRuntimeSignals?.length, `CORE_EXTRACTION_ENVELOPE_MUTABLE_RUNTIME_MEMBER: ${assignment.functionId}`);
  assert(!assignment.dependencies?.importedModules?.some((specifier) => /(?:oauth|browser|next|react|prisma|ai-sdk|git)/iu.test(specifier)), `CORE_EXTRACTION_ENVELOPE_FORBIDDEN_CORE_DEPENDENCY: ${assignment.functionId}`);
  if (assignment.dependencies?.requiresIsolatedBoundaryBeforeCore) assert(assignment.stopConditions.includes("Stop promotion until the Node/Host module facade is isolated from the pure function boundary."), `CORE_EXTRACTION_ENVELOPE_HOST_FACADE_STOP_MISSING: ${assignment.functionId}`);
}
for (const candidate of candidates) assert(assignmentIds.has(candidate.id), `CORE_EXTRACTION_ENVELOPE_UNASSIGNED_FUNCTION:${candidate.id}`);
const envelopeMemberIds = new Set();
for (const envelope of registry.envelopes) {
  assert(envelope.id && envelope.surface && envelope.sourceModule && envelope.functionIds.length, `CORE_EXTRACTION_ENVELOPE_INVALID: ${envelope.id}`);
  assert.deepEqual(envelope.memberSurfaces, [envelope.surface], `CORE_EXTRACTION_ENVELOPE_CROSS_SURFACE_GROUPING: ${envelope.id}`);
  assert.deepEqual(envelope.memberInputOutputShapes, [envelope.inputOutputShape], `CORE_EXTRACTION_ENVELOPE_IO_SHAPE_MISMATCH: ${envelope.id}`);
  assert.deepEqual(envelope.memberDependencyProfiles, [envelope.dependencyProfile], `CORE_EXTRACTION_ENVELOPE_DEPENDENCY_PROFILE_MISMATCH: ${envelope.id}`);
  assert(envelope.stopConditions.length >= 3, `CORE_EXTRACTION_ENVELOPE_STOP_CONDITIONS_MISSING: ${envelope.id}`);
  assert(!envelope.dependencyProfile.includes("forbidden"), `CORE_EXTRACTION_ENVELOPE_FORBIDDEN_CORE_DEPENDENCY: ${envelope.id}`);
  for (const id of envelope.functionIds) { assert(assignmentIds.has(id), `CORE_EXTRACTION_ENVELOPE_UNKNOWN_FUNCTION: ${id}`); assert(!envelopeMemberIds.has(id), `CORE_EXTRACTION_ENVELOPE_OVERLAP: ${id}`); envelopeMemberIds.add(id); }
}
assert.deepEqual([...envelopeMemberIds].sort(), [...assignmentIds].sort(), "CORE_EXTRACTION_ENVELOPE_UNASSIGNED_FUNCTION");
const waveIds = ["Wave 1", "Wave 2", "Wave 3", "Core v1 closure"];
assert.deepEqual(plan.waves.map((wave) => wave.id), waveIds);
assert(["CORE_EXTRACTION_PROOF_ENVELOPE_CALIBRATION_ACCEPTED", "CORE_EXTRACTION_WAVE3_BATCH_B_WORKFLOW_QUERY_DATA_STATIC_PLAN_EXECUTION_PASSED", "CORE_EXTRACTION_WAVE3_BATCH_C_DATA_LIST_SUBLIST_STATIC_CONFIGURATION_EXECUTION_PASSED", "CORE_EXTRACTION_WAVE3_BATCH_D_WORKFLOW_STATIC_PLAN_EXECUTION_PASSED"].includes(plan.decision.marker));
assert(["Wave 1 proof-envelope contracts", "Wave 3 proof-envelope contracts", "Wave 3 Batch E proof-envelope selection", "Wave 3 Batch H proof-envelope selection", "Wave 3 Batch I proof-envelope selection", "Wave 3 Batch J proof-envelope selection", "Wave 3 Batch K proof-envelope selection"].includes(plan.execution?.nextPhase || plan.decision.nextPhase));
assert.equal(plan.scores.afterCoreV1Closure, 100);
const scheduled = new Set(plan.waves.flatMap((wave) => wave.envelopeIds));
assert.deepEqual([...scheduled].sort(), registry.envelopes.map((item) => item.id).sort(), "CORE_EXTRACTION_ENVELOPE_PLAN_COVERAGE_INVALID");
const approval = registry.assignments.find((item) => item.function.includes("normalizeApprovalSubListLookupConfiguration"));
assert(approval && approval.wave === "Wave 2" && approval.extractionStatus === "parity-ready-static-configuration-candidate", "CORE_EXTRACTION_APPROVAL_LOOKUP_CANDIDATE_LOST");
const calibrationCurrent = state.migration.currentPhase === phase && state.migration.nextPhase === "Wave 1 proof-envelope contracts";
const waveOneHistorical = state.migration.currentPhase === "core-extraction-wave-1-planning-normalization-execution" && state.migration.nextPhase === "Wave 2 proof-envelope contracts" && state.proofStatus.coreExtractionWave1PlanningNormalization === "passed_source_archive_installed_rollback";
const waveTwoHistorical = state.migration.currentPhase === "core-extraction-wave-2-approval-form-sublist-lookup-static-configuration-projection" && state.migration.nextPhase === "Wave 3 proof-envelope contracts" && state.proofStatus.coreExtractionWave2ApprovalFormSublistLookupStaticConfiguration === "passed_source_archive_installed_materializer_rollback";
const waveThreeHistorical = ["core-extraction-wave3-batch-a-workflow-set-data-list-projection", "core-extraction-wave3-batch-b-workflow-query-data-static-plan", "core-extraction-wave3-batch-c-data-list-sublist-static-configuration"].includes(state.migration.currentPhase) && state.migration.nextPhase === "Wave 3 proof-envelope contracts" && state.proofStatus.coreExtractionWave3AcceptedEnvelopeProgress;
const waveThreeBatchD = state.migration.currentPhase === "core-extraction-wave3-batch-d-workflow-static-plan" && state.migration.nextPhase === "Wave 3 Batch E proof-envelope selection" && state.proofStatus.wave3CoreExtractedEnvelopes === "6/89" && state.proofStatus.wave3TerminalDispositionEnvelopes?.total === "18/89";
const waveThreeBatchG = state.migration.currentPhase === "core-extraction-wave3-batch-g-approval-form-static-configuration" && state.migration.nextPhase === "Wave 3 Batch H proof-envelope selection" && state.proofStatus.wave3CoreExtractedEnvelopes === "24/89" && state.proofStatus.wave3TerminalDispositionEnvelopes?.total === "42/89" && state.proofStatus.coreExtractionWave3BatchGApprovalFormStaticConfiguration === "passed_source_archive_installed_materializer_rollback";
const waveThreeBatchH = state.migration.currentPhase === "core-extraction-wave3-batch-h-application-plan-foundation-selection-and-execution" && state.migration.nextPhase === "Wave 3 Batch I proof-envelope selection" && state.proofStatus.wave3CoreExtractedEnvelopes === "26/89" && state.proofStatus.wave3TerminalDispositionEnvelopes?.total === "53/89" && state.proofStatus.coreExtractionWave3BatchHApplicationPlanStaticFoundation === "passed_source_archive_installed_materializer_rollback";
const waveThreeBatchI = state.migration.currentPhase === "core-extraction-wave3-batch-i-data-list-static-configuration-selection-and-execution" && state.migration.nextPhase === "Wave 3 Batch J proof-envelope selection" && state.proofStatus.wave3CoreExtractedEnvelopes === "27/89" && state.proofStatus.wave3TerminalDispositionEnvelopes?.total === "64/89" && state.proofStatus.coreExtractionWave3BatchIDataListStaticConfiguration === "passed_source_archive_installed_materializer_rollback";
const waveThreeBatchJ = state.migration.currentPhase === "core-extraction-wave3-batch-j-dashboard-static-configuration-selection-and-execution" && state.migration.nextPhase === "Wave 3 Batch K proof-envelope selection" && state.proofStatus.wave3CoreExtractedEnvelopes === "28/89" && state.proofStatus.wave3TerminalDispositionEnvelopes?.total === "74/89" && state.proofStatus.coreExtractionWave3BatchJDashboardStaticConfiguration === "passed_source_archive_installed_materializer_rollback";
assert(calibrationCurrent || waveOneHistorical || waveTwoHistorical || waveThreeHistorical || waveThreeBatchD || waveThreeBatchG || waveThreeBatchH || waveThreeBatchI || waveThreeBatchJ);
assert.equal(state.proofStatus.coreExtractionProofEnvelopeCalibration, "accepted_finite_envelope_execution_model");
console.log("CORE_EXTRACTION_PROOF_ENVELOPE_CALIBRATION_VALID");
console.log("CORE_EXTRACTION_PROOF_ENVELOPE_COVERAGE_VALID");
console.log("CORE_EXTRACTION_PROOF_ENVELOPE_BOUNDARIES_VALID");
console.log("CORE_EXTRACTION_PROOF_ENVELOPE_WAVE_PLAN_VALID");

function surfaceFor(item) { const value = `${item.module} ${item.function}`.toLowerCase(); if (item.module.includes("markdown-planning")) return "planning-markdown"; if (item.module.includes("planning-placeholder")) return "planning-placeholders"; if (item.module.includes("workflow-query")) return "workflow-query-data-static-plan"; if (item.module.includes("workflow-set-data-list")) return "workflow-set-data-list-static-plan"; if (item.module.includes("form-control-type-authority")) return "data-list-form-control-static-schema"; if (item.module.includes("approval-form-layout")) return "approval-form-sublist-static-configuration"; if (/workflow/.test(value)) return "workflow-static-plan"; if (/approval|publicform|formaction/.test(value)) return "approval-form-static-configuration"; if (/dashboard|collection|analytics|kpi|navigator/.test(value)) return "dashboard-static-configuration"; if (/documentlibrary|document_library|document.*library/.test(value)) return "document-library-static-configuration"; if (/sublist|sub_list/.test(value)) return "data-list-sublist-static-configuration"; if (/datalist|dataview|lookup|field|list/.test(value)) return "data-list-static-configuration"; if (/template|layout/.test(value)) return "template-static-normalization"; if (/resource|package|seed|tenant|idpath/.test(value)) return "resource-definition-static-intent"; return "application-plan-static-normalization"; }
function waveFor(item, surface) { if (item.module.includes("markdown-planning") || item.module.includes("planning-placeholder")) return "Wave 1"; if (item.module.includes("approval-form-layout") && item.function === "normalizeApprovalSubListLookupConfiguration") return "Wave 2"; return "Wave 3"; }
function argument(name, fallback) { const index = process.argv.indexOf(name); return index < 0 ? fallback : process.argv[index + 1]; }
function json(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }

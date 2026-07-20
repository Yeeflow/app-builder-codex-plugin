#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ledger = readJson(argument("--ledger", "compatibility/capability-manifests/field-control-projection-family-selection-audit.v0.1.0.json"));
const matrix = readJson(argument("--matrix", "compatibility/capability-manifests/field-control-projection-remaining-capability-matrix.v0.1.0.json"));
const classifications = new Set(["eligible-contract-first-vertical", "requires-resource-definition-contract", "requires-workflow-or-form-contract", "host-orchestration-only", "defer-high-risk"]);
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const source = readFileSync(resolve(root, sourcePath), "utf8");
const lineage = readJson(resolve(root, "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json"));

if (ledger.phase !== "phase-5e-remaining-field-control-projection-family-selection-audit" || ledger.source?.path !== sourcePath || !/^[a-f0-9]{64}$/u.test(ledger.source?.sha256 || "")) fail("FIELD_CONTROL_PHASE5E_SOURCE_MISMATCH", "The sealed audit source evidence is malformed.");
const phase9d = lineage.approvedTransitions?.find((entry) => entry.phase === "phase-9d-data-list-sublist-child-resource-inventory-local-runtime-public-api-and-distribution-promotion");
const finalTransition = lineage.approvedTransitions?.at(-1);
if (!phase9d || finalTransition?.sourceTransition?.afterSha256 !== sha256(source)) fail("FIELD_CONTROL_PHASE5E_SOURCE_MISMATCH", "The sealed Phase 5E evidence is not connected to the current approved lineage state.");
if (!Array.isArray(ledger.candidates) || ledger.candidates.length !== 8 || !Array.isArray(matrix.surfaces) || matrix.surfaces.length !== 8) fail("FIELD_CONTROL_PHASE5E_AUDIT_INCOMPLETE", "The remaining projection-family matrix is incomplete.");
for (const candidate of ledger.candidates) validateCandidate(candidate);
if (ledger.selection?.status !== "NO_SAFE_REMAINING_FIELD_CONTROL_PROJECTION_VERTICAL") fail("FIELD_CONTROL_PHASE5E_SELECTION_INVALID", "The selection must explicitly close the remaining field/control family when no safe vertical exists.");
if (ledger.candidates.some((candidate) => candidate.classification === "eligible-contract-first-vertical")) fail("FIELD_CONTROL_PHASE5E_SELECTION_INVALID", "A safe candidate remains and prevents field/control family closure.");
if (ledger.selection.recommendedNextPhase !== "phase-5-resource-definition-construction-contract-audit") fail("FIELD_CONTROL_PHASE5E_SELECTION_INVALID", "The next recommended phase must be the resource-definition construction contract audit.");
const cjkPattern = new RegExp("[\\u3040-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff]", "u");
if (cjkPattern.test(JSON.stringify({ ledger, matrix }))) fail("FIELD_CONTROL_PHASE5E_NON_ENGLISH", "Persisted audit artifacts must be English-only.");
console.log("NO_SAFE_REMAINING_FIELD_CONTROL_PROJECTION_VERTICAL");
console.log(`FIELD_CONTROL_PHASE5E_AUDIT_VALID candidates=${ledger.candidates.length} noSafeVertical=true`);

function validateCandidate(candidate) {
  if (!candidate?.id || !classifications.has(candidate.classification) || typeof candidate.surface !== "string" || !Array.isArray(candidate.legacyEntryPoints) || !candidate.legacyEntryPoints.length || !Array.isArray(candidate.dependencies) || !Array.isArray(candidate.transitiveDependencies) || !Array.isArray(candidate.resourceIdDependencies) || !Array.isArray(candidate.runtimeExpressionDependencies) || !Array.isArray(candidate.hostEffects) || typeof candidate.reason !== "string") fail("FIELD_CONTROL_PHASE5E_CANDIDATE_INVALID", "A candidate is missing required classification evidence.");
  if (!candidate.fixture || !candidate.rollback || !candidate.actualMaterializerIntegrationPath || !candidate.scopedRollbackBoundary) fail("FIELD_CONTROL_PHASE5E_PROOF_BOUNDARY_MISSING", `Candidate lacks a fixture or rollback boundary: ${candidate.id}.`);
  if (candidate.classification === "eligible-contract-first-vertical") {
    if (candidate.surface.includes(",")) fail("FIELD_CONTROL_PHASE5E_CROSS_SURFACE_SELECTION", `Eligible candidate crosses resource surfaces: ${candidate.id}.`);
    if (candidate.requiresHostIds || candidate.requiresTemplateMutation || candidate.requiresRuntimeOrWorkflow) fail("FIELD_CONTROL_PHASE5E_CANDIDATE_TOO_BROAD", `Eligible candidate exceeds the immutable single-surface boundary: ${candidate.id}.`);
    if (!candidate.immutableDtoBoundary) fail("FIELD_CONTROL_PHASE5E_PROOF_BOUNDARY_MISSING", `Eligible candidate lacks an immutable DTO boundary: ${candidate.id}.`);
  }
  if (candidate.legacyEntryPoints.some((entry) => !entry.path?.startsWith(`${sourcePath}#`) || !Number.isInteger(entry.line) || !Number.isInteger(entry.productionCallerCount))) fail("FIELD_CONTROL_PHASE5E_ENTRYPOINT_INVALID", `Candidate has an invalid Legacy entry point: ${candidate.id}.`);
}
function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? resolve(root, fallback) : resolve(root, process.argv[index + 1]); }
function readJson(path) { try { return JSON.parse(readFileSync(path, "utf8")); } catch (error) { fail("FIELD_CONTROL_PHASE5E_INVALID_JSON", error.message); } }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

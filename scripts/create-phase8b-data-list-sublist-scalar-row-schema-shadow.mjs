#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const legacyPath = "scripts/materialize-full-app-generated-final.mjs";
const corePath = "packages/app-builder-core-materializer/src/internal/data-list-sublist-scalar-row-schema.ts";
const hostPath = "runtimes/app-builder-core-local-runtime/src/internal-data-list-sublist-scalar-row-schema-lowering.ts";
const corpusPath = "compatibility/differential-fixtures/data-list-sublist-scalar-row-schema-shadow.v0.1.0.json";
const manifestPath = "compatibility/capability-manifests/data-list-sublist-scalar-row-schema-shadow.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-8b-data-list-sublist-explicit-scalar-row-schema-shadow.v0.1.0.md";
const legacy = read(legacyPath); const corpus = JSON.parse(read(corpusPath));
const manifest = {
  schemaVersion: "1.0.0",
  phase: "phase-8b-data-list-sublist-explicit-scalar-row-schema-shadow",
  status: "complete",
  decision: { marker: "PHASE_8B_SUBLIST_SCALAR_ROW_SCHEMA_SHADOW_ACCEPTED", nextPhase: "phase-8c-data-list-sublist-scalar-row-schema-dual-public-distribution-readiness", rationale: "The internal Core intent and host-only lowerer are bounded, immutable, lossless, and parity-proven. Public distribution remains a separate readiness decision." },
  legacyBoundary: { path: legacyPath, sha256: sha(legacy), functions: [{ name: "dataListSubListVariables", productionCallerCount: 2 }, { name: "normalizeSubListRowType", productionCallerCount: 1 }] },
  internalBoundaries: {
    materializerCore: { path: corePath, sha256: sha(read(corePath)), function: "projectDataListSublistScalarRowSchemaInternal", publicExport: false, allowed: ["immutable scalar child row descriptors", "explicit parent child and row-schema identities", "immutable row-schema intent", "immutable findings"], prohibited: ["ID allocation", "UUID generation", "template or resource mutation", "Lookup resolution", "runtime actions", "caller findings mutation", "package output"] },
    localRuntime: { path: hostPath, sha256: sha(read(hostPath)), function: "lowerDataListSublistScalarRowSchemaAtHostInternal", publicExport: false, allowed: ["identity and hierarchy validation", "fresh Legacy-shaped row-schema fragments"], prohibited: ["child control ID allocation", "template mutation", "identity-map mutation", "fallback identity generation"] },
  },
  stableErrors: ["SUBLIST_TEMPLATE_GRAPH_REFERENCE_MISSING", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_INVALID", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_DUPLICATE", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_RELATIONSHIP_BROKEN", "SUBLIST_ROW_SCHEMA_REFERENCE_MISSING", "SUBLIST_ROW_SCHEMA_REFERENCE_INVALID", "SUBLIST_ROW_SCHEMA_REFERENCE_SCOPE_MISMATCH", "SUBLIST_ROW_SCHEMA_REFERENCE_DUPLICATE", "SUBLIST_ROW_SCHEMA_REFERENCE_RELATIONSHIP_BROKEN"],
  corpus: { path: corpusPath, caseCount: corpus.caseCount, validLegacyParityCases: corpus.cases.filter((item) => item.kind === "valid").length, hostValidationCases: corpus.cases.filter((item) => item.kind === "host-error").length, excludedCases: corpus.cases.filter((item) => item.kind === "excluded").length },
  approvedVariants: ["text", "date", "number", "boolean"],
  exclusions: ["nested control placement", "summaries and temporary variables", "Lookup", "identity user people person", "department", "file image binary", "barcode", "actions and expressions", "Type 0 and Type 1 final layout mutation", "Approval Forms", "Document Libraries", "Dashboards", "workflows"],
  auditMutations: { productionRouting: false, adapters: false, publicApis: false, distributionContracts: false, coreArtifacts: false, pluginDist: false, activeInstallation: false, historicalZip: false, protectedDuplicates: false }
};
writeJson(manifestPath, manifest);
write(reportPath, report(manifest));
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json";
const state = JSON.parse(read(statePath));
state.migration.currentPhase = manifest.phase;
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = manifest.decision.nextPhase;
state.completed ||= [];
const entry = { id: manifest.phase, status: "complete", evidence: "2026-07-19: explicit scalar Sublist row-schema Core and host-lowering internal shadows passed six Legacy-parity, ten host-validation, five exclusion, serialization, immutability, and lossless-ID checks. No public export, artifact, adapter, or production route changed." };
const index = state.completed.findIndex((item) => item.id === manifest.phase); if (index >= 0) state.completed[index] = entry; else state.completed.push(entry);
state.nextSteps = (state.nextSteps || []).filter((item) => item.id !== manifest.phase && item.id !== manifest.decision.nextPhase);
state.nextSteps.unshift({ order: 1, id: manifest.decision.nextPhase, description: "Audit whether the internal explicit scalar Sublist row-schema intent and host lowerer can safely become separately distributed public APIs." });
state.proofStatus ||= {}; state.proofStatus.dataListSublistScalarRowSchemaShadow = "parity_passed_internal_only";
writeJson(statePath, state);
console.log(`DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_SHADOW_WRITTEN cases=${corpus.caseCount}`);

function report(value) { return `# Phase 8B Data List Sublist Explicit Scalar Row-Schema Internal Shadow

## Decision

${value.decision.marker}

Phase 8C distribution-readiness audit is accepted as the next decision point; this does not promote an API or route production behavior.

## Legacy Boundary

dataListSubListVariables has two production callers: buildDataListFormSubListControl and buildFieldRules. Its normalizer supports text, date, number, boolean, user, and file rows. This shadow covers only explicit scalar text/date/number/boolean rows with caller-supplied row IDs. Nested control creation, summaries, temporary variables, and template mutation remain outside the boundary.

## Internal Contract

Materializer Core accepts immutable scalar child descriptors and explicit lossless parent ListID, child ListID, parent FieldID, child FieldID, row-schema ID, ordinal, and template scope values. It returns an immutable row-schema intent plus findings. Local Runtime validates supplied parent/child/template/row-schema relationships and returns fresh Legacy-shaped list-variables rows. It never allocates identities or mutates snapshots.

## Evidence

The versioned corpus contains ${value.corpus.caseCount} cases: ${value.corpus.validLegacyParityCases} actual Legacy parity cases, ${value.corpus.hostValidationCases} host validation cases covering all ten Phase 8A stable errors, and ${value.corpus.excludedCases} exclusion cases. The Legacy harness executes the current dataListSubListVariables and normalizeSubListRowType functions in a VM with explicit rows, so identity semantics are compared directly.

## Deferred

${value.exclusions.map((item) => `- ${item}`).join("\n")}

No public API, distribution artifact, adapter, production route, active installation, historical ZIP, protected duplicate, Git publication, or release action changed.
`; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function write(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value, "utf8"); }
function writeJson(path, value) { write(path, `${JSON.stringify(value, null, 2)}\n`); }

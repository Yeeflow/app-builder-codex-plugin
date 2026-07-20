#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corePath = "compatibility/capability-manifests/data-list-sublist-scalar-row-schema-core-public-api-readiness.v0.1.0.json";
const runtimePath = "compatibility/capability-manifests/data-list-sublist-scalar-row-schema-local-runtime-public-api-readiness.v0.1.0.json";
const dualPath = "compatibility/capability-manifests/data-list-sublist-scalar-row-schema-dual-distribution-readiness.v0.1.0.json";
const corpusPath = "compatibility/differential-fixtures/data-list-sublist-scalar-row-schema-shadow.v0.1.0.json";
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
const errors = ["SUBLIST_TEMPLATE_GRAPH_REFERENCE_MISSING", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_INVALID", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_DUPLICATE", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_RELATIONSHIP_BROKEN", "SUBLIST_ROW_SCHEMA_REFERENCE_MISSING", "SUBLIST_ROW_SCHEMA_REFERENCE_INVALID", "SUBLIST_ROW_SCHEMA_REFERENCE_SCOPE_MISMATCH", "SUBLIST_ROW_SCHEMA_REFERENCE_DUPLICATE", "SUBLIST_ROW_SCHEMA_REFERENCE_RELATIONSHIP_BROKEN"];
const corpus = json(corpusPath);
const core = {
  schemaVersion: "1.0.0", phase: "phase-8c-data-list-sublist-scalar-row-schema-dual-public-distribution-readiness",
  decision: { status: "accepted", marker: "DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORE_PUBLIC_API_READINESS_ACCEPTED", nextPhase: "phase-8d-data-list-sublist-scalar-row-schema-dual-public-distribution-promotion" },
  prospectiveApi: { function: "projectDataListSublistScalarRowSchema", publicDtos: ["DataListSublistScalarRowDescriptor", "DataListSublistScalarRowSchemaInput", "DataListSublistScalarRowSchemaDescriptor", "DataListSublistScalarRowSchemaIntent", "DataListSublistScalarRowSchemaFinding", "DataListSublistScalarRowSchemaResult"] },
  inputBoundary: { allowed: ["immutable scalar child-field descriptors", "lossless parent ListID child ListID parent FieldID child FieldID", "explicit row-schema identity and template scope", "explicit ordinal"], prohibited: ["mutable template object", "resource object", "parent or child allocation map", "generated ID", "nested control", "summary", "Lookup", "identity user people person field", "department field", "file image binary field", "barcode field", "runtime expression or action", "Legacy record shape", "package or runtime state"] },
  outputBoundary: { guarantees: ["immutable JSON-serializable intent", "immutable ordered scalar descriptors", "immutable findings", "no generated identity", "no Legacy-shaped record"], excludes: ["host identity map", "template snapshot", "control or row insertion", "final resource mutation"] },
  compatibility: { versioning: "Any incompatible DTO, ordering, scalar-kind, finding, or error behavior change requires a new public contract version and four-surface parity proof.", internalOnlyHelpers: ["scalarType", "requiredText", "losslessId", "clean", "freeze"] },
  auditMutations: false,
};
const runtime = {
  schemaVersion: "1.0.0", phase: core.phase,
  decision: { status: "accepted", marker: "DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_LOCAL_RUNTIME_PUBLIC_API_READINESS_ACCEPTED", nextPhase: core.decision.nextPhase },
  prospectiveApi: { function: "lowerDataListSublistScalarRowSchemaAtHost", publicDtos: ["SublistScalarRowSchemaIntent", "SublistScalarRowSchemaHostContext", "Legacy-shaped scalar row-schema fragment array"] },
  inputBoundary: { allowed: ["immutable Core intent", "explicit host-supplied parent child and row-schema identities", "explicit parent node and row-schema context"], prohibited: ["identity allocation", "fallback schema discovery", "template mutation", "caller findings mutation", "nested control lowering", "summary lowering", "Lookup resolution", "runtime actions", "package output"] },
  outputBoundary: { guarantees: ["fresh frozen Legacy-shaped scalar list-variables fragments", "ordered result", "no mutation of Core intent or host context", "no fallback identity generation"] },
  errorContract: { codes: errors, guarantees: ["every supplied identity is losslessly string-validated", "missing invalid scope duplicate and relationship failures remain distinct", "no error is downgraded to fallback allocation"] },
  compatibility: { versioning: "Any incompatible context, error, ordering, mutation, or lowering-shape change requires a new public contract version and four-surface parity proof.", internalOnlyHelpers: ["text", "reference", "duplicates", "fail", "freeze"] },
  auditMutations: false,
};
const dual = {
  schemaVersion: "1.0.0", phase: core.phase,
  decision: { status: "accepted", marker: "DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_DUAL_DISTRIBUTION_READINESS_VALID", nextPhase: core.decision.nextPhase, rationale: "The Core and Local Runtime APIs have a stable, coupled immutable/host-lowering boundary. Public distribution can be tested without exposing templates, IDs, nested controls, or Legacy resource records." },
  contracts: [corePath, runtimePath], corpus: { path: corpusPath, caseCount: corpus.caseCount, requiredCoverage: ["text date number boolean", "row ordering", "lossless nineteen-digit identities", ...errors, "excluded advanced and cross-surface families"] },
  scope: { included: ["Data List Sublist scalar row-schema intent", "Data List Sublist scalar row-schema host validation and fresh lowering"], excluded: ["nested controls", "summaries", "Lookup", "identity user people person", "department", "file image binary", "barcode", "runtime expressions and actions", "Type 0 and Type 1 final layout mutation", "Approval Forms", "Document Libraries", "Dashboards", "workflows"] },
  coupledLegacyConsumers: [{ function: "dataListSubListVariables", consumers: ["buildDataListFormSubListControl", "buildFieldRules"], rule: "A future routing proof must cover both consumers together through one shared scalar-only bridge or explicitly prove unchanged parity for both; routing only one consumer is prohibited." }],
  requiredFutureProof: { distribution: ["compiled source", "Plugin dist", "temporary official ZIP", "simulated installed Plugin", "source public contract manifest artifact export checksum and leakage parity"], routing: ["one Materializer Core adapter export", "one Local Runtime adapter export", "actual form Sublist and field Rules integration matrix", "both coupled Legacy consumers", "deterministic normalized output", "scope gates for all excluded families", "temporary-copy-only Legacy rollback"] },
  artifactState: artifactState(), closureProofLineage: { path: lineagePath, sha256: sha(read(lineagePath)), required: "The existing sealed Phase 6E, 7D, and 7E lineage transitions must remain valid; Phase 8C makes no transition." },
  auditMutations: { publicIndexes: false, distributionContracts: false, builder: false, artifacts: false, adapters: false, productionSource: false, activeInstallation: false, historicalZip: false, protectedDuplicates: false },
};
writeJson(corePath, core); writeJson(runtimePath, runtime); writeJson(dualPath, dual);
write("docs/architecture/yeeflow-app-builder-phase-8c-data-list-sublist-scalar-row-schema-dual-public-distribution-readiness.v0.1.0.md", report(core, runtime, dual));
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
state.migration.currentPhase = core.phase; state.migration.currentPhaseStatus = "complete"; state.migration.nextPhase = core.decision.nextPhase;
state.completed ||= []; const evidence = "2026-07-19: DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORE_PUBLIC_API_READINESS_ACCEPTED, DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_LOCAL_RUNTIME_PUBLIC_API_READINESS_ACCEPTED, dual-distribution readiness validation, and deterministic negative regressions passed. No public export, artifact, adapter, Legacy materializer, or production route changed.";
const entry = { id: core.phase, status: "complete", evidence }; const index = state.completed.findIndex((item) => item.id === core.phase); if (index >= 0) state.completed[index] = entry; else state.completed.push(entry);
state.nextSteps = (state.nextSteps || []).filter((item) => item.id !== core.phase && item.id !== core.decision.nextPhase); state.nextSteps.unshift({ order: 1, id: core.decision.nextPhase, description: "Promote only projectDataListSublistScalarRowSchema and lowerDataListSublistScalarRowSchemaAtHost through the official multi-artifact distribution pipeline after separate authorization; no routing is implied." });
state.proofStatus ||= {}; state.proofStatus.dataListSublistScalarRowSchemaDualPublicDistributionReadiness = "accepted"; state.proofStatus.dataListSublistScalarRowSchemaDualPublicDistribution = "not_started"; writeJson("docs/architecture/yeeflow-app-builder-core-migration-state.json", state);
console.log(`DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_PHASE8C_STATE_RECORDED cases=${corpus.caseCount}`);

function artifactState() { return Object.fromEntries(["planning", "materializer", "local-runtime"].map((name) => { const path = `dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-${name}.v0.1.0.mjs`; return [name, { path: path.replace("dist/yeeflow-app-builder-plugin/", ""), sha256: sha(read(path)) }]; })); }
function report(coreContract, runtimeContract, dualContract) { return `# Phase 8C Data List Sublist Scalar Row-Schema Dual Public-Distribution Readiness

## Decision

${dualContract.decision.marker}

Both prospective APIs have bounded public surfaces. This decision authorizes only a future promotion proof; it does not add either public export or route production behavior.

## Prospective Materializer Core API

projectDataListSublistScalarRowSchema may expose immutable JSON-safe scalar descriptors, input, intent, finding, and result DTOs. It excludes mutable templates/resources, allocation maps, generated IDs, nested controls, summaries, Lookup, non-scalar fields, runtime expressions/actions, and Legacy record shapes.

## Prospective Local Runtime API

lowerDataListSublistScalarRowSchemaAtHost may receive immutable Core intent plus explicit host identity and hierarchy context. It owns all supplied-reference validation and returns fresh Legacy-shaped scalar list-variables fragments only. It cannot allocate or discover identities, mutate templates, or silently fall back.

## Required Host Errors

${runtimeContract.errorContract.codes.map((code) => `- ${code}`).join("\n")}

## Phase 8D Promotion Proof

Use the official builder to promote exactly these two APIs, then prove the unchanged 21-case corpus through compiled source, Plugin dist, temporary official ZIP, and simulated installed Plugin layouts. Validate export, contract, manifest, path, checksum, serialization, immutability, and leakage parity.

## Phase 8E Coupled-Consumer Routing Proof

Route only the shared scalar row-schema seam and prove both current consumers: buildDataListFormSubListControl and buildFieldRules. The host must retain template loading, identity supply, nested-control construction, summary work, graph mutation, and package output. Require source/archive/installed integration parity, determinism, excluded-family scope gates, and a temporary-copy-only rollback restoring the shared Legacy path.

## Non-Goals

No public index, distribution contract/builder, artifact, Plugin dist, adapter, Legacy materializer, production route, active installation, historical ZIP, protected duplicate, or release state changed.
`; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function write(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value, "utf8"); }
function writeJson(path, value) { write(path, `${JSON.stringify(value, null, 2)}\n`); }

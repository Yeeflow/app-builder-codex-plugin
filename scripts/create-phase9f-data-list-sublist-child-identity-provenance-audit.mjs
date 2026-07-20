#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-9f-data-list-sublist-child-identity-provenance-and-host-provider-audit";
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const source = read(sourcePath);
const sourceSha256 = sha(source);
const ledgerPath = "compatibility/capability-manifests/data-list-sublist-child-identity-provenance.v0.1.0.json";
const matrixPath = "compatibility/capability-manifests/data-list-sublist-child-identity-source-of-truth-timing.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-9f-data-list-sublist-child-identity-provenance-and-host-provider-audit.v0.1.0.md";
for (const token of ["function buildIdPaths(planDemand)", "function allocateIds(ids, paths, findings)", "function buildResourceGraphPackage(", "function buildDataListFormSubListControl", "function dataListSubListVariables(field, seed)", "function buildFieldRules", "function deterministicUuid(seed)", "function stringId(id)"]) if (!source.includes(token)) fail("SUBLIST_LEGACY_IDENTITY_PROVENANCE_SOURCE_BOUNDARY_DRIFT", token);

const identities = [
  {
    identity: "parentListId", status: "valid-host-issued-parent-identity", source: { function: "buildIdPaths", line: 2682, expression: "decoded.Childs[index].List.ListID" }, allocation: { function: "allocateIds", line: 274, kind: "API-issued flat ids[] entry" }, timing: "before buildResourceGraphPackage", representation: "lossless decimal string through allocateIds and stringId", relation: "parent Data List scope", sharedByCoupledConsumers: false, notes: "Available to package assembly and passed as listId to buildDataListFormSubListControl; buildFieldRules does not receive it.",
  },
  {
    identity: "parentFieldId", status: "valid-host-issued-parent-identity", source: { function: "buildIdPaths", line: 2684, expression: "decoded.Childs[index].Fields[fieldIndex].FieldID" }, allocation: { function: "allocateIds", line: 274, kind: "API-issued flat ids[] entry" }, timing: "before buildFieldRecord", representation: "lossless decimal string through allocateIds and stringId", relation: "parent field belongs to parentListId", sharedByCoupledConsumers: false, notes: "Stored on the parent field record and used by the form control; buildFieldRules only receives planning input.",
  },
  {
    identity: "childListId", status: "missing", source: null, allocation: null, timing: "never created or serialized", representation: "required lossless non-empty decimal string", relation: "required distinct child resource under parentFieldId", sharedByCoupledConsumers: false, notes: "No buildIdPaths request, API allocation key, generated Childs record, template-derived resource, or package serialization carries a Sublist child ListID.", prohibitedCandidates: ["plan idx", "deterministic UUID", "placeholder", "parent ListID", "numeric coercion"],
  },
  {
    identity: "childFieldId", status: "missing", source: null, allocation: null, timing: "never created or serialized", representation: "required lossless non-empty decimal string", relation: "required distinct field belonging to childListId", sharedByCoupledConsumers: false, notes: "Sublist rows retain only logical id/name/type metadata. No row receives a FieldID and no generated child List resource owns one.", prohibitedCandidates: ["plan idx", "deterministic UUID", "placeholder", "parent FieldID", "numeric coercion"],
  },
  {
    identity: "rowSchemaId", status: "internal-presentation-key-not-provider", source: { function: "dataListSubListVariables", line: 4845, expression: "cleanResourceName(row.idx) || deterministicUuid(seed)" }, allocation: { function: "deterministicUuid", line: 6326, kind: "SHA-256-derived UUID" }, timing: "during buildFieldRecord for Rules and later again during form-control lowering, independently per consumer", representation: "UUID or planning string, not API-issued decimal identity", relation: "no validated parent-child-row-schema relationship", sharedByCoupledConsumers: false, notes: "The form-control call uses seed formName:FieldName while buildFieldRules uses field-rules:fieldName. The generated values are repeatable for one seed but differ between consumers, and planned row.idx is only plan metadata.", prohibitedCandidates: ["plan idx", "deterministic UUID", "arbitrary deterministic UUID", "placeholder", "parent identity", "numeric coercion"],
  },
];
const timing = {
  schemaVersion: "1.0.0", phase, source: { path: sourcePath, sha256: sourceSha256 },
  chain: [
    { order: 1, function: "buildIdPaths", line: 2666, event: "requests only top-level ListID, FieldID, and LayoutID allocation paths" },
    { order: 2, function: "allocateIds", line: 274, event: "maps API-issued ids[] to those requested paths as strings" },
    { order: 3, function: "buildResourceGraphPackage", line: 284, event: "builds parent fields and layouts; no Sublist child resource inventory exists" },
    { order: 4, function: "buildFieldRecord", line: 5201, event: "emits the parent field record; its list Rules path invokes buildFieldRules from planning metadata" },
    { order: 5, function: "buildFieldRules", line: 4960, event: "first coupled consumer invokes dataListSubListVariables with a field-rules-specific seed" },
    { order: 6, function: "buildDataListFormSubListControl", line: 4777, event: "later form lowering invokes dataListSubListVariables again with a form-specific seed" },
    { order: 7, function: "encodeYapkResourceOfficial", line: 295, event: "serializes the completed graph; it cannot create missing identities" },
  ],
  coupledConsumerBoundary: { sharedFunction: "dataListSubListVariables", declarationLine: 4834, consumers: [{ function: "buildDataListFormSubListControl", callLine: 4777, seed: "formName:field.FieldName" }, { function: "buildFieldRules", callLine: 4960, seed: "field-rules:field.fieldName or displayName" }], consequence: "Both calls derive row keys after their paths diverge; no value is a shared authoritative child identity." },
  identities,
};
const protectedAuditOnlyFiles = protectedFiles();
const ledger = {
  schemaVersion: "1.0.0", phase,
  decision: {
    status: "rejected", marker: "SUBLIST_LEGACY_IDENTITY_PROVIDER_REJECTED",
    rationale: "Legacy has no authoritative child resource, child field, or row-schema identity provider. Its only Sublist row identity-like value is planned row.idx or a deterministic UUID produced separately after the coupled consumers diverge. Neither establishes a child-resource relationship or satisfies the public inventory contract.",
    nextTask: "phase-9g-product-api-sublist-child-identity-provider-handoff",
    productApiPrerequisite: "Provide an explicit host-owned post-allocation inventory input with API-issued lossless child ListID, child FieldID, and row-schema identity for every parent-field/child-logical-field relationship, including parent, child, and row-schema scopes. The allocation request and response must exist before buildResourceGraphPackage lowers parent fields or custom forms.",
  },
  source: timing.source,
  provenance: timing,
  reconcilesPhase9E: "Phase 9E remains correct: allocateIds alone is insufficient. This audit found no separate Legacy host source that can fill the absent values without prohibited reuse, inference, or post-divergence generation.",
  phase8EDependency: { status: "blocked", marker: "NO_SAFE_DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_ROUTING", reason: "No validated shared child identity provider exists for both coupled consumers." },
  providerAssessment: { existingProvider: false, rejectedCandidates: ["planned row.idx", "deterministicUuid(seed)", "form control id", "column control id", "summary id", "parent ListID", "parent FieldID", "package serialization"], requiredFutureProvider: "host-owned product/API allocation and inventory provider" },
  protectedAuditOnlyFiles,
  auditMutations: { productionSource: false, apiAllocation: false, adapters: false, publicApis: false, artifacts: false, distribution: false, activeInstallation: false, historicalZip: false, protectedDuplicates: false, gitPublication: false },
};
writeJson(matrixPath, timing);
writeJson(ledgerPath, ledger);
write(reportPath, report(ledger));
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json";
const state = json(statePath);
state.migration.currentPhase = phase;
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = ledger.decision.nextTask;
state.proofStatus ||= {};
state.proofStatus.dataListSublistLegacyIdentityProvenance = "audited_rejected_no_authoritative_provider";
state.proofStatus.dataListSublistChildResourceInventoryIntegrationReadiness = "rejected_missing_api_child_identities";
state.proofStatus.dataListSublistScalarRowSchemaCoupledConsumerRouting = "blocked_missing_child_identity_map_not_wired";
upsert(state.completed, { id: phase, status: "complete", evidence: "2026-07-19: SUBLIST_LEGACY_IDENTITY_PROVENANCE_AUDITED and SUBLIST_LEGACY_IDENTITY_PROVIDER_REJECTED. Legacy has no child ListID, child FieldID, or row-schema identity provider; planned idx and deterministic UUID values are post-divergence presentation keys, not shared host identities." });
state.nextSteps = (state.nextSteps || []).filter((item) => item.id !== phase && item.id !== ledger.decision.nextTask);
state.nextSteps.unshift({ order: 1, id: ledger.decision.nextTask, description: "Product/API handoff: define and supply explicit API-issued lossless Sublist child ListID, child FieldID, and row-schema identities with parent-child-row-schema scopes before host inventory construction. No Legacy-derived workaround is approved." });
writeJson(statePath, state);
console.log("SUBLIST_LEGACY_IDENTITY_PROVENANCE_PHASE9F_STATE_RECORDED");

function protectedFiles() { const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json"); const artifacts = Object.fromEntries(distribution.artifacts.map((item) => [item.packageName, item])); return { [sourcePath]: sourceSha256, "scripts/lib/materializer-core-adapter.mjs": sha(read("scripts/lib/materializer-core-adapter.mjs")), "scripts/lib/local-runtime-core-adapter.mjs": sha(read("scripts/lib/local-runtime-core-adapter.mjs")), "runtimes/app-builder-core-local-runtime/src/index.ts": sha(read("runtimes/app-builder-core-local-runtime/src/index.ts")), "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-planning.v0.1.0.mjs": artifacts["@yeeflow/app-builder-core-planning"].sha256, "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs": artifacts["@yeeflow/app-builder-core-materializer"].sha256, "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs": artifacts["@yeeflow/app-builder-core-local-runtime"].sha256 }; }
function report(value) { return `# Phase 9F Legacy Data List Sublist Child-Identity Provenance and Host-Provider Audit\n\n## Decision\n\n\`${value.decision.marker}\`\n\nNo Legacy host-owned provider can supply the required Sublist child identities. Phase 9E remains correct: API allocation alone is insufficient, and this audit found no separate approved Legacy source.\n\n## Source of Truth and Timing\n\n| Required identity | Legacy source | Timing | Provider result |\n| --- | --- | --- | --- |\n${value.provenance.identities.map((item) => `| ${item.identity} | ${item.source ? `${item.source.function} line ${item.source.line}` : "none"} | ${item.timing} | ${item.status} |`).join("\n")}\n\nThe only row identity-like value is \`cleanResourceName(row.idx) || deterministicUuid(seed)\` in \`dataListSubListVariables\`. It is generated independently after the two coupled consumers diverge: the form-control path uses \`formName:FieldName\`; the rules path uses \`field-rules:fieldName\`. It is therefore neither a shared value nor a validated child-resource identity.\n\n## Required Product/API Handoff\n\n${value.decision.productApiPrerequisite}\n\n## Phase 8E Status\n\nPhase 8E remains blocked. It may be reconsidered only after a product/API provider exists and a separate host inventory integration proves one frozen descriptor selection is available to both coupled consumers before they diverge.\n\n## Preserved Boundaries\n\nNo production materializer behavior, API allocation, adapter, public API, artifact, distribution, active installation, historical ZIP, protected duplicate, Git, or release state changed.\n`; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function write(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value, "utf8"); }
function writeJson(path, value) { write(path, `${JSON.stringify(value, null, 2)}\n`); }
function upsert(list, value) { const current = list.find((item) => item.id === value.id); if (current) Object.assign(current, value); else list.push(value); }
function fail(code, detail) { console.error(`${code}: ${detail}`); process.exit(1); }

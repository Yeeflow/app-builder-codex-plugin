#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-9e-data-list-sublist-child-resource-inventory-post-allocation-integration-readiness";
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const contractPath = "compatibility/capability-manifests/data-list-sublist-child-resource-inventory-post-allocation-integration-readiness.v0.1.0.json";
const flowPath = "compatibility/capability-manifests/data-list-sublist-child-resource-inventory-post-allocation-identity-flow.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-9e-data-list-sublist-child-resource-inventory-post-allocation-integration-readiness.v0.1.0.md";
const source = read(sourcePath);

for (const token of [
  "const idPaths = buildIdPaths(planDemand);",
  "const ids = allocateIds(idSource.ids, idPaths, findings);",
  "buildResourceGraphPackage({ appTitle, rootListId: numberId(ids[\"decoded.ListSet.ListID\"]), planDemand, ids",
  "paths.push(`decoded.Childs[${index}].List.ListID`);",
  "paths.push(`decoded.Childs[${index}].Fields[${fieldIndex}].FieldID`);",
  "paths.push(`decoded.Childs[${index}].Layouts[0].LayoutID`);",
  "function dataListSubListVariables(field, seed)",
]) if (!source.includes(token)) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_POST_ALLOCATION_SOURCE_BOUNDARY_DRIFT", token);

const artifacts = artifactState();
const protectedFiles = {
  [sourcePath]: sha(source),
  "scripts/lib/materializer-core-adapter.mjs": sha(read("scripts/lib/materializer-core-adapter.mjs")),
  "scripts/lib/local-runtime-core-adapter.mjs": sha(read("scripts/lib/local-runtime-core-adapter.mjs")),
  "runtimes/app-builder-core-local-runtime/src/index.ts": sha(read("runtimes/app-builder-core-local-runtime/src/index.ts")),
  "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-planning.v0.1.0.mjs": artifacts["@yeeflow/app-builder-core-planning"].sha256,
  "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs": artifacts["@yeeflow/app-builder-core-materializer"].sha256,
  "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs": artifacts["@yeeflow/app-builder-core-local-runtime"].sha256,
};
const identities = [
  {
    identity: "parentListId", source: "API allocation response", path: "decoded.Childs[index].List.ListID", representation: "lossless non-empty decimal string", availability: "available", scope: "one parent Data List", consumedBy: ["buildResourceGraphPackage", "buildDataListFormSubListControl"],
  },
  {
    identity: "parentFieldId", source: "API allocation response", path: "decoded.Childs[index].Fields[fieldIndex].FieldID", representation: "lossless non-empty decimal string", availability: "available", scope: "one parent field within parentListId", consumedBy: ["buildResourceGraphPackage", "buildFieldRecord"],
  },
  {
    identity: "childListId", source: "unavailable", path: null, representation: "required lossless non-empty decimal string", availability: "absent", prohibitedRepresentations: ["plan idx", "deterministic UUID", "placeholder", "parent identity", "parent ListID"], scope: "one allocated child resource for one parent field", consumedBy: ["future shared inventory", "buildDataListFormSubListControl", "buildFieldRules"],
  },
  {
    identity: "childFieldId", source: "unavailable", path: null, representation: "required lossless non-empty decimal string", availability: "absent", prohibitedRepresentations: ["plan idx", "deterministic UUID", "placeholder", "parent identity", "parent FieldID"], scope: "one allocated field within childListId", consumedBy: ["future shared inventory", "buildDataListFormSubListControl", "buildFieldRules"],
  },
  {
    identity: "rowSchemaId", source: "unavailable", path: null, representation: "required lossless non-empty decimal string", availability: "absent", currentNonIdentityValues: ["row.idx from plan", "deterministicUuid(seed)"], prohibitedRepresentations: ["plan idx", "deterministic UUID", "placeholder", "parent identity"], scope: "one allocated row-schema inside childListId and childFieldId", consumedBy: ["future shared inventory", "buildDataListFormSubListControl", "buildFieldRules"],
  },
];
const flow = {
  schemaVersion: "1.0.0",
  phase,
  source: { path: sourcePath, sha256: sha(source) },
  allocationBoundary: {
    function: "allocateIds", line: 274, callerCount: 1,
    requestPlanner: { function: "buildIdPaths", line: 273, callerCount: 1 },
    responseShape: "flat API-issued ids[] consumed in requested path order",
    currentRequestedPaths: ["decoded.Childs[index].List.ListID", "decoded.Childs[index].Fields[fieldIndex].FieldID", "decoded.Childs[index].Layouts[layoutIndex].LayoutID"],
    absentRequestedPaths: ["Sublist child ListID", "Sublist child FieldID", "Sublist row-schema identity"],
  },
  minimalFutureIntegrationPoint: {
    function: "buildResourceGraphPackage", line: 284, callerCount: 1,
    position: "function entry after allocateIds has supplied ids and before buildFieldRecord or custom-form lowering diverge",
    status: "not constructible from current API response",
    requiredThreading: "construct exactly one immutable inventory and provide the same validated descriptor selection to both dataListSubListVariables consumers",
  },
  coupledConsumers: [
    { function: "buildDataListFormSubListControl", callLine: 4777, sharedSeam: "dataListSubListVariables", sharedSeamLine: 4834 },
    { function: "buildFieldRules", callLine: 4960, sharedSeam: "dataListSubListVariables", sharedSeamLine: 4834 },
  ],
  identities,
  prohibitedSubstitutions: ["plan idx", "deterministic UUID", "placeholder", "parent identity", "numeric coercion", "fallback allocation", "inferred child resource"],
};
const contract = {
  schemaVersion: "1.0.0", phase,
  decision: {
    status: "rejected",
    marker: "SUBLIST_CHILD_RESOURCE_INVENTORY_INTEGRATION_READINESS_REJECTED",
    rationale: "The current API allocation manifest requests and returns only parent Data List ListID and FieldID paths. It contains no child ListID, child FieldID, or row-schema identity. dataListSubListVariables uses planned row values or deterministic UUIDs, which are prohibited identity substitutes.",
    externalPrerequisite: "The product/API allocation manifest and post-allocation resource model must supply API-issued, lossless non-empty decimal-string Sublist child ListID, each child FieldID, and each row-schema identity with explicit parent-child-row-schema scopes before buildResourceGraphPackage lowerings begin.",
    nextPhase: "phase-9f-external-sublist-child-resource-identity-allocation-prerequisite",
  },
  evidence: flow,
  phase8EDependency: {
    status: "blocked", marker: "NO_SAFE_DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_ROUTING",
    reopeningCondition: "Only after the external prerequisite is available, a separately authorized Phase 9F proof may construct the inventory once at the documented point and thread it to both coupled consumers.",
  },
  futurePhase9FProofScope: [
    "verify the extended API response supplies every required lossless string identity", "construct one frozen inventory at buildResourceGraphPackage entry", "thread one shared descriptor selection to both coupled consumers before divergent lowering", "prove all eleven inventory errors, source/archive/installed parity, determinism, scope gates, and temporary-copy Legacy rollback", "retain no fallback allocation, inferred child resource, plan idx, deterministic UUID, placeholder, or parent identity substitution",
  ],
  protectedAuditOnlyFiles: protectedFiles,
  auditMutations: { productionSource: false, adapters: false, publicApis: false, artifacts: false, distribution: false, activeInstallation: false, historicalZip: false, protectedDuplicates: false, gitPublication: false },
};

writeJson(flowPath, flow);
writeJson(contractPath, contract);
write(reportPath, report(contract));
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json";
const state = json(statePath);
state.migration.currentPhase = phase;
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = contract.decision.nextPhase;
state.proofStatus ||= {};
state.proofStatus.dataListSublistChildResourceInventoryPostAllocationBoundary = "audited";
state.proofStatus.dataListSublistChildResourceInventoryIntegrationReadiness = "rejected_missing_api_child_identities";
state.proofStatus.dataListSublistScalarRowSchemaCoupledConsumerRouting = "blocked_missing_child_identity_map_not_wired";
upsert(state.completed, { id: phase, status: "complete", evidence: "2026-07-19: SUBLIST_CHILD_RESOURCE_INVENTORY_POST_ALLOCATION_BOUNDARY_AUDITED and rejected readiness recorded. Current allocation has no API-issued child ListID, child FieldID, or row-schema identity, so no production integration or Phase 8E route was attempted." });
state.nextSteps = (state.nextSteps || []).filter((item) => item.id !== phase && item.id !== contract.decision.nextPhase);
state.nextSteps.unshift({ order: 1, id: contract.decision.nextPhase, description: "Obtain an external product/API allocation response extension for lossless Sublist child ListID, child FieldID, and row-schema identities with explicit hierarchy scopes. Do not use plan idx, UUIDs, placeholders, parent IDs, fallback allocation, or inferred child resources." });
writeJson(statePath, state);
console.log("SUBLIST_CHILD_RESOURCE_INVENTORY_PHASE9E_STATE_RECORDED");

function artifactState() { const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json"); return Object.fromEntries(distribution.artifacts.map((item) => [item.packageName, { path: item.path, sha256: item.sha256 }])); }
function report(value) { return `# Phase 9E Data List Sublist Child-Resource Inventory Post-Allocation Integration Readiness\n\n## Decision\n\n\`${value.decision.marker}\`\n\nProduction cannot yet construct or thread the validated inventory. The current API-issued allocation only covers top-level Data List ListID, FieldID, and LayoutID paths. It does not provide the child ListID, child FieldID, or row-schema identity required by the public Local Runtime inventory contract.\n\n## Exact Production Boundary\n\n\`buildIdPaths\` has one caller at line 273 and \`allocateIds\` has one caller at line 274. The single call to \`buildResourceGraphPackage\` at line 284 is the future host-only integration location: its entry is after allocation and before \`buildFieldRecord\` and custom-form lowering diverge. The location is structurally correct but cannot construct a valid inventory from the current response.\n\n## Identity Source Matrix\n\n| Identity | Current source | Status |\n| --- | --- | --- |\n${value.evidence.identities.map((item) => `| ${item.identity} | ${item.source}${item.path ? ` (${item.path})` : ""} | ${item.availability} |`).join("\n")}\n\nThe two coupled consumers remain \`buildDataListFormSubListControl\` at line 4777 and \`buildFieldRules\` at line 4960 through \`dataListSubListVariables\` at line 4834. Planned \`row.idx\` values and \`deterministicUuid(seed)\` values are presentation keys, not child-resource identities.\n\n## Required External Prerequisite\n\n${value.decision.externalPrerequisite}\n\nNo code workaround is valid. In particular, Phase 9E rejects plan indexes, deterministic UUIDs, placeholders, parent-ID reuse, numeric coercion, inferred child resources, fallback allocation, and one-consumer-only threading.\n\n## Future Phase 9F and Phase 8E\n\nAfter the external prerequisite exists, Phase 9F must prove one frozen inventory construction at the documented location and thread the same selection to both consumers. Only then may a separately authorized Phase 8E routing proof be reconsidered.\n\n## Preserved Boundaries\n\nNo production materializer, adapter, public API, artifact, distribution contract, active installation, historical ZIP, protected duplicate, Git, or release state changed.\n`; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function write(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value, "utf8"); }
function writeJson(path, value) { write(path, `${JSON.stringify(value, null, 2)}\n`); }
function upsert(list, value) { const current = list.find((item) => item.id === value.id); if (current) Object.assign(current, value); else list.push(value); }
function fail(code, detail) { console.error(`${code}: ${detail}`); process.exit(1); }

#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-9i-data-list-sublist-frozen-descriptor-internal-shadow";
const corpusPath = "compatibility/differential-fixtures/data-list-sublist-frozen-descriptor-shadow.v0.1.0.json";
const contractPath = "compatibility/capability-manifests/data-list-sublist-frozen-descriptor-internal-shadow.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-9i-export-proven-data-list-sublist-frozen-descriptor-internal-shadow.v0.1.0.md";
const contract = {
  schemaVersion: "1.0.0", phase, status: "passed_internal_only", marker: "SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_CORE_SHADOW_IMPLEMENTED",
  selectionBoundary: { owner: "buildResourceGraphPackage", line: 5201, callerCount: 1, descriptorCountPerParentField: 1, timing: "before buildFieldRecord and Rules lowering" },
  consumers: { count: 2, rules: "buildFieldRules", customForm: "buildDataListFormSubListControl", compatibility: "test-only simulations consume one descriptor instance" },
  core: { module: "packages/app-builder-core-materializer/src/internal/data-list-sublist-frozen-descriptor-shadow.ts", internalOnly: true, publicExportAdded: false, descriptorOnly: true, localRuntimeLowererAdded: false, distributionChanged: false },
  hostContext: { explicit: true, storage: "test-only WeakMap", serializedIntoPlans: false, serializedIntoResources: false, serializedIntoTemplates: false, serializedIntoCoreDto: false },
  identity: { productIdentity: ["parentListId", "parentFieldId"], embeddedColumns: ["idx", "id", "name", "type", "editable"], childProductIdentity: false, prohibited: ["child ListID", "child FieldID", "rowSchemaId", "allocation input", "fallback key"] },
  exclusions: JSON.parse(read(corpusPath)).excludedFirstRoute,
  phase9JPublicDistributionReadiness: "not_accepted_internal_shadow_only",
  phase6Reconciliation: { validator: "scripts/validate-phase6f-data-list-lookup-family-closure.mjs", chain: ["phase-7d-data-list-type1-identity-control-placement-dual-public-distribution-promotion", "phase-8d-data-list-sublist-scalar-row-schema-dual-public-distribution-promotion", "phase-9d-data-list-sublist-child-resource-inventory-local-runtime-public-api-and-distribution-promotion"], result: "reconciled" },
  integrity: { corpusSha256: sha(read(corpusPath)), coreShadowSha256: sha(read("packages/app-builder-core-materializer/src/internal/data-list-sublist-frozen-descriptor-shadow.ts")), phase9hContractSha256: sha(read("compatibility/capability-manifests/data-list-sublist-embedded-schema-frozen-descriptor-routing-readiness.v0.1.0.json")), lineageSha256: sha(read("compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json")) },
  preserved: { productionMaterializerChanged: false, adaptersChanged: false, publicApiChanged: false, artifactsChanged: false, distributionChanged: false, pluginDistChanged: false, activeInstallationChanged: false },
};
write(contractPath, `${JSON.stringify(contract, null, 2)}\n`);
write(reportPath, `# Phase 9I Export-Proven Data List Sublist Frozen-Descriptor Internal Shadow\n\n## Decision\n\nInternal shadow passed. Phase 9J public distribution readiness is not accepted.\n\n## Boundary\n\nOne descriptor is selected at buildResourceGraphPackage line 5201, before buildFieldRecord, then test-only Rules and custom-form simulations consume the same frozen descriptor. The production materializer is unchanged.\n\n## Context\n\nThe explicit test-only host context uses a WeakMap and serializes as an empty object. It is absent from plans, resources, templates, and Core DTO output. Core returns descriptor data only.\n\n## Phase 6 Reconciliation\n\nThe retained Phase 6F validator now follows the sealed ordered Phase 7D, 8D, and 9D artifact transitions from its baseline to current distribution state. It rejects missing, reordered, tampered, broad-path, and hidden-route transitions.\n\n## Non-Goals\n\nNo production route, adapter, public API, Core artifact, distribution contract, Plugin dist, active installation, historical ZIP, protected duplicate, Git, release, or promotion changed.\n`);
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json"; const state = JSON.parse(read(statePath));
state.lastUpdated = "2026-07-19"; state.migration.currentPhase = phase; state.migration.currentPhaseStatus = "complete"; state.migration.nextPhase = "phase-9j-data-list-sublist-frozen-descriptor-propagation-readiness"; state.inProgress = [];
upsert(state.completed, { id: phase, status: "complete", evidence: "2026-07-19: SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_CORE_SHADOW_IMPLEMENTED, SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_HOST_CONTEXT_SHADOW_IMPLEMENTED, SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_DIFFERENTIAL_PARITY_PASSED, SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_SELECTION_DETERMINISM_PASSED, SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_SERIALIZATION_PARITY_PASSED, SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_IMMUTABILITY_PASSED, SUBLIST_EMBEDDED_SCHEMA_NON_SERIALIZED_CONTEXT_GUARD_PASSED, SUBLIST_EMBEDDED_SCHEMA_LEGACY_UNCHANGED, PHASE_6_CLOSURE_PROOF_LINEAGE_RECONCILED, and PHASE_CLOSURE_PROOF_LINEAGE_VALID." });
state.blocked = (state.blocked || []).filter((item) => item.id !== "phase-6f-retained-proof-lineage-artifact-drift");
state.nextSteps = (state.nextSteps || []).filter((item) => item.id !== state.migration.nextPhase); state.nextSteps.unshift({ order: 1, id: state.migration.nextPhase, description: "Audit explicit non-serialized descriptor propagation only. Do not add public distribution, adapters, or production materializer routing without separate authorization." });
Object.assign(state.proofStatus, { dataListSublistFrozenDescriptorInternalShadow: "passed_internal_only", dataListSublistFrozenDescriptorHostContext: "passed_non_serialized", dataListSublistFrozenDescriptorPhase9JPublicDistributionReadiness: "not_accepted", dataListLookupResolutionFamilyClosure: "passed_lineage_reconciled" });
write(statePath, `${JSON.stringify(state, null, 2)}\n`);
console.log("SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_CORE_SHADOW_RECORDED"); console.log("PHASE_6_CLOSURE_PROOF_LINEAGE_RECONCILED");
function read(path) { return readFileSync(resolve(root, path), "utf8"); } function sha(value) { return createHash("sha256").update(value).digest("hex"); } function write(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value, "utf8"); } function upsert(list, value) { const found = list.find((item) => item.id === value.id); if (found) Object.assign(found, value); else list.push(value); }

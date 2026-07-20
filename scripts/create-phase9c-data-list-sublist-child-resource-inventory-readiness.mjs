#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-9c-data-list-sublist-child-resource-inventory-local-runtime-distribution-readiness";
const contractPath = "compatibility/capability-manifests/data-list-sublist-child-resource-identity-map-contract.v0.1.0.json";
const shadowPath = "compatibility/capability-manifests/data-list-sublist-child-resource-inventory-host-shadow.v0.1.0.json";
const corpusPath = "compatibility/differential-fixtures/data-list-sublist-child-resource-inventory-shadow.v0.1.0.json";
const apiPath = "compatibility/capability-manifests/data-list-sublist-child-resource-inventory-local-runtime-public-api-readiness.v0.1.0.json";
const distributionPath = "compatibility/capability-manifests/data-list-sublist-child-resource-inventory-local-runtime-distribution-readiness.v0.1.0.json";
const errors = ["SUBLIST_CHILD_RESOURCE_IDENTITY_MISSING", "SUBLIST_CHILD_RESOURCE_IDENTITY_INVALID", "SUBLIST_CHILD_RESOURCE_IDENTITY_LOSSY", "SUBLIST_CHILD_RESOURCE_IDENTITY_DUPLICATE", "SUBLIST_CHILD_RESOURCE_IDENTITY_SCOPE_MISMATCH", "SUBLIST_CHILD_RESOURCE_IDENTITY_RELATIONSHIP_BROKEN", "SUBLIST_ROW_SCHEMA_IDENTITY_MISSING", "SUBLIST_ROW_SCHEMA_IDENTITY_INVALID", "SUBLIST_ROW_SCHEMA_IDENTITY_DUPLICATE", "SUBLIST_ROW_SCHEMA_IDENTITY_SCOPE_MISMATCH", "SUBLIST_ROW_SCHEMA_IDENTITY_RELATIONSHIP_BROKEN"];
const contract = json(contractPath);
const shadow = json(shadowPath);
const corpus = json(corpusPath);
if (contract.decision?.marker !== "SUBLIST_CHILD_RESOURCE_IDENTITY_CONTRACT_VALID" || shadow.decision?.marker !== "SUBLIST_CHILD_RESOURCE_INVENTORY_HOST_SHADOW_IMPLEMENTED" || corpus.caseCount !== 20) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_READINESS_BASELINE_INVALID");

const api = {
  schemaVersion: "1.0.0",
  phase,
  decision: { status: "accepted", marker: "SUBLIST_CHILD_RESOURCE_INVENTORY_LOCAL_RUNTIME_PUBLIC_API_READINESS_ACCEPTED", nextPhase: "phase-9d-data-list-sublist-child-resource-inventory-local-runtime-public-api-and-distribution-promotion" },
  prospectiveApi: {
    function: "buildDataListSublistChildResourceInventoryAtHost",
    publicDtos: ["DataListSublistChildResourceAllocation", "DataListSublistChildResourceInventoryInput", "DataListSublistChildResourceIdentityDescriptor", "DataListSublistChildResourceInventory", "SublistChildResourceIdentityError"],
    internalOnlyHelpers: ["buildDataListSublistChildResourceInventoryInternal", "identity", "logicalKey", "compare", "fail", "deepFreeze"],
  },
  inputBoundary: {
    allowed: ["explicit post-API-allocation host data", "immutable planned Data List Sublist relationships", "lossless non-empty string parent ListID parent FieldID child ListID child FieldID and row-schema identity", "child logical field key ordinal and explicit scopes"],
    prohibited: ["allocation authority", "API handle or API call", "mutable resource graph", "mutable package state", "template object", "row-schema generation", "package writing", "Legacy fallback", "implicit child discovery", "numeric or lossy identity"],
  },
  outputBoundary: {
    allowed: ["deep-frozen JSON-serializable descriptors", "deep-frozen descriptorsByParentField object", "stable validation error"],
    prohibited: ["Legacy record fragment", "control ID", "row-schema creation", "mutable resource", "allocation map", "package state", "private helper exposure"],
    guarantees: ["deterministic ordering", "no input mutation", "no identity fabrication", "lossless string identity preservation"],
  },
  errorContract: { codes: errors, guarantees: ["all eleven errors remain distinct and stable", "missing invalid lossy duplicate scope and relationship failures are never downgraded", "no fallback allocation or inferred child resource exists"] },
  compatibility: { versioning: "Any incompatible DTO, identity validation, ordering, mutation, or error change requires a new public contract version and four-surface parity proof.", serialization: "All public inputs and outputs are JSON-safe; returned descriptors and map arrays are deeply frozen." },
  auditMutations: false,
};

const distribution = {
  schemaVersion: "1.0.0",
  phase,
  decision: { status: "accepted", marker: "SUBLIST_CHILD_RESOURCE_INVENTORY_DISTRIBUTION_READINESS_VALID", nextPhase: api.decision.nextPhase, rationale: "The inventory boundary is a host-only, immutable descriptor builder. A future Local Runtime artifact may expose it without exposing allocation, package, resource, or Legacy behavior." },
  contracts: [apiPath, contractPath, shadowPath],
  prospectiveArtifact: { path: "core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs", requiredExport: api.prospectiveApi.function, currentArtifactContainsProspectiveExport: false, resolution: "The Plugin resolves only the self-contained relative Local Runtime artifact from its core directory." },
  corpus: { path: corpusPath, caseCount: corpus.caseCount, requiredCoverage: ["valid single multiple ordered and no-child inventory", "nineteen-digit lossless strings", ...errors, "excluded lookup identity binary and action families"] },
  futurePromotionProof: ["compiled Local Runtime source", "official Plugin dist artifact", "temporary official ZIP extraction", "simulated installed Plugin layout", "public index contract manifest artifact export checksum version and path parity", "serialization immutability error and leakage parity", "no workspace TypeScript source repository path node_modules source-map or bare-package leakage"],
  futureRoutingPrerequisites: ["a separately authorized post-API-allocation child identity allocation and inventory integration proof", "one shared inventory selection supplied to both buildDataListFormSubListControl and buildFieldRules", "no consumer may fabricate, coerce, or reuse identity", "full scalar Sublist source archive installed integration parity", "all eleven host errors and lossless nineteen-digit identities", "deterministic output and excluded-family scope gates", "temporary-copy-only Legacy rollback restoring the shared bridge"],
  phase8EDependency: { status: "blocked", marker: "NO_SAFE_DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_ROUTING", reason: "Distribution readiness does not add the absent child allocation paths or route the inventory to both coupled consumers." },
  leakageGates: ["workspace import", "TypeScript source path", "repository path", "node_modules", "source map", "bare package import", "private helper export", "allocation or API exposure", "mutable resource or package-state exposure"],
  auditMutations: { publicIndex: false, distributionContract: false, builder: false, artifact: false, adapter: false, productionSource: false, activeInstallation: false, historicalZip: false, protectedDuplicates: false },
  artifactState: artifactState(),
};

writeJson(apiPath, api);
writeJson(distributionPath, distribution);
write("docs/architecture/yeeflow-app-builder-phase-9c-data-list-sublist-child-resource-inventory-local-runtime-distribution-readiness.v0.1.0.md", report(api, distribution));
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json";
const state = json(statePath);
state.migration.currentPhase = phase;
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = api.decision.nextPhase;
state.proofStatus ||= {};
state.proofStatus.dataListSublistChildResourceInventoryLocalRuntimePublicApiReadiness = "accepted";
state.proofStatus.dataListSublistChildResourceInventoryDistributionReadiness = "accepted";
state.proofStatus.dataListSublistScalarRowSchemaCoupledConsumerRouting = "blocked_missing_child_identity_map_not_wired";
upsert(state.completed, { id: phase, status: "complete", evidence: "2026-07-19: SUBLIST_CHILD_RESOURCE_INVENTORY_LOCAL_RUNTIME_PUBLIC_API_READINESS_ACCEPTED and distribution-readiness validation/regressions passed. No Local Runtime public export, distribution artifact, adapter, Legacy materializer, or route changed. Phase 8E remains blocked until separately authorized post-allocation identity inventory integration proves both coupled consumers." });
state.nextSteps = (state.nextSteps || []).filter((item) => item.id !== phase && item.id !== api.decision.nextPhase);
state.nextSteps.unshift({ order: 1, id: api.decision.nextPhase, description: "Promote only buildDataListSublistChildResourceInventoryAtHost through the official Local Runtime distribution pipeline after separate authorization; do not route either coupled Sublist consumer." });
writeJson(statePath, state);
console.log(`SUBLIST_CHILD_RESOURCE_INVENTORY_PHASE9C_STATE_RECORDED cases=${corpus.caseCount}`);

function artifactState() { return Object.fromEntries(["planning", "materializer", "local-runtime"].map((name) => { const path = `dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-${name}.v0.1.0.mjs`; return [name, { path: path.replace("dist/yeeflow-app-builder-plugin/", ""), sha256: sha(read(path)) }]; })); }
function report(apiContract, distributionContract) { return `# Phase 9C Data List Sublist Child-Resource Inventory Local Runtime Distribution Readiness\n\n## Decision\n\n\`${distributionContract.decision.marker}\`\n\nThe internal host-only inventory boundary is ready for a future Local Runtime-only public promotion. This audit does not promote an export, build an artifact, add an adapter, or reopen Phase 8E routing.\n\n## Prospective Public API\n\n\`buildDataListSublistChildResourceInventoryAtHost\` may accept only explicit post-API-allocation host data and immutable planned Sublist relationships. It may return only deeply frozen JSON-safe descriptors and \`descriptorsByParentField\`. It cannot allocate identities, call APIs, inspect mutable resources or package state, generate row schemas, write packages, or provide a Legacy fallback.\n\n## Stable Errors\n\n${apiContract.errorContract.codes.map((code) => `- ${code}`).join("\n")}\n\n## Phase 9D Promotion Proof\n\nUse the official Local Runtime distribution builder to add exactly the prospective export. Prove the unchanged 20-case corpus through compiled source, Plugin dist, temporary official ZIP extraction, and a simulated installed Plugin. Verify export/contract/manifest/artifact/checksum/version/path parity, JSON serialization, deep immutability, all error codes, and the absence of workspace, source, repository, node_modules, source-map, or bare-package leakage.\n\n## Conditions Before Reopening Phase 8E\n\nA separate authorized integration must first prove actual post-allocation child ListID, child FieldID, and row-schema inventory availability. One shared validated descriptor selection must feed both \`buildDataListFormSubListControl\` and \`buildFieldRules\`; neither consumer may fabricate or coerce identities. The later routing proof must include source/archive/installed parity, all eleven errors, lossless nineteen-digit IDs, determinism, excluded-family scope gates, and a temporary-copy-only Legacy rollback.\n\n## Preserved Boundaries\n\nNo public Local Runtime index, distribution contract or builder, artifact, Plugin dist, adapter, Legacy materializer, production route, active installation, historical ZIP, protected duplicate, Git, or release state changed.\n`; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function write(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value, "utf8"); }
function writeJson(path, value) { write(path, `${JSON.stringify(value, null, 2)}\n`); }
function upsert(list, value) { const current = list.find((item) => item.id === value.id); if (current) Object.assign(current, value); else list.push(value); }
function fail(code) { console.error(code); process.exit(1); }

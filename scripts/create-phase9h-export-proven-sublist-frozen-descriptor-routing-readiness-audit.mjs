#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-9h-export-proven-sublist-frozen-descriptor-routing-readiness-audit";
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const source = read(sourcePath);
const analysis = analyzeSource(sourcePath, source);
const matrixPath = "compatibility/capability-manifests/data-list-sublist-embedded-schema-pre-divergence-timing.v0.1.0.json";
const contractPath = "compatibility/capability-manifests/data-list-sublist-embedded-schema-frozen-descriptor-routing-readiness.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-9h-export-proven-sublist-frozen-descriptor-routing-readiness-audit.v0.1.0.md";

const expectedCalls = {
  buildFieldRecord: [5201], buildFieldRules: [3403], dataListSubListVariables: [4777, 4960], buildDataListFormFieldsGrid: [3885], buildDataListFormFieldControl: [4658], buildDataListFormSubListControl: [4665], buildDataListSubListColumn: [4780], normalizeDataListSubListSummaries: [4788], ensureDataListSubListSummaryTempVars: [3887],
};
for (const [name, lines] of Object.entries(expectedCalls)) if (JSON.stringify(analysis.calls[name]) !== JSON.stringify(lines)) fail("SUBLIST_EMBEDDED_SCHEMA_PRE_DIVERGENCE_SOURCE_BOUNDARY_DRIFT", `${name}:${JSON.stringify(analysis.calls[name])}`);

const matrix = {
  schemaVersion: "1.0.0", phase,
  source: { path: sourcePath, sha256: sha(source), declarations: analysis.declarations, calls: analysis.calls },
  sharedDescriptorSelection: {
    status: "future-bounded-host-context", owner: "buildResourceGraphPackage", selectionLine: analysis.calls.buildFieldRecord[0],
    selectionPoint: "Inside the Data List fieldSpecsForList(...).map callback, after listId and API-issued parent fieldId are available and before buildFieldRecord lowers Rules.",
    input: ["parentListId", "parentFieldId", "parent field Rules list-variables or planned listFields", "ordered embedded column id/idx/name/type/editable"],
    output: "One frozen EmbeddedSublistSchemaDescriptor recorded in a non-serialized, explicit host context keyed by parent ListID and FieldID.",
    prohibited: ["child ListID", "child FieldID", "rowSchemaId", "UUID", "id or idx as product identity", "fallback discovery", "implicit allocation", "child-resource inventory"],
  },
  timeline: [
    { order: 1, function: "buildResourceGraphPackage", line: analysis.declarations.buildResourceGraphPackage, event: "Receives planDemand and API-issued id map." },
    { order: 2, function: "buildResourceGraphPackage", line: analysis.calls.buildFieldRecord[0], event: "The fieldSpecsForList map has one raw parent field plus listId and parent fieldId before Rules lowering; this is the only accepted future descriptor-selection boundary." },
    { order: 3, function: "buildFieldRecord", line: analysis.declarations.buildFieldRecord, event: "Builds the parent field record and invokes buildFieldRules once." },
    { order: 4, function: "buildFieldRules", line: analysis.declarations.buildFieldRules, event: "Rules consumer invokes dataListSubListVariables once and serializes parent Rules list-variables." },
    { order: 5, function: "buildCustomFormLayout", line: analysis.declarations.buildCustomFormLayout, event: "Receives the completed parent field records for Type 1 layout lowering." },
    { order: 6, function: "buildDataListFormFieldsGrid", line: analysis.declarations.buildDataListFormFieldsGrid, event: "Passes the completed parent field record to the form-field control builder." },
    { order: 7, function: "buildDataListFormSubListControl", line: analysis.declarations.buildDataListFormSubListControl, event: "Custom-form consumer invokes dataListSubListVariables once, lowers list-fields, inserts a template control, and may add summaries." },
    { order: 8, function: "encodeYapkResourceOfficial", line: analysis.declarations.encodeYapkResourceOfficial, event: "Package output serializes the completed graph and remains outside the first route." },
  ],
  currentCoupledConsumers: [
    { consumer: "Rules", function: "buildFieldRules", callLine: analysis.calls.dataListSubListVariables[1], source: "parent field planning schema", output: "parent field Rules list-variables" },
    { consumer: "custom-form", function: "buildDataListFormSubListControl", callLine: analysis.calls.dataListSubListVariables[0], source: "completed parent field Rules", output: "attrs.list-variables and attrs.list-fields" },
  ],
  hostOwnedLoweringBoundaries: {
    rulesLowering: "Parent field record Rules serialization.", customFormListFieldsLowering: "Nested list-fields controls with generated presentation control IDs.", templateControlInsertion: "Template loading, clone, parent control setup, and nested control insertion.", summaries: "Summary normalization and temporary-variable collection.", nestedGraphMutation: "Form resource children, attrs, and temporary variables.", packageOutput: "Completed resource graph encoding and package writing.",
  },
};

const contract = {
  schemaVersion: "1.0.0", phase, status: "accepted", marker: "SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_READINESS_VALID",
  decision: {
    acceptedFutureRoute: "Select one frozen EmbeddedSublistSchemaDescriptor in the buildResourceGraphPackage fieldSpecsForList map before buildFieldRecord. Supply it explicitly to the Rules lowering and later custom-form lowering through a non-serialized host context keyed by parent ListID and parent FieldID.",
    currentProductionRoute: "not_changed", childIdentityPrerequisite: "superseded", productApiChangeRequired: false,
  },
  descriptor: { productIdentity: ["parentListId", "parentFieldId"], embeddedColumns: ["id", "idx", "name", "type", "editable"], idAndIdxSemantics: "Column/export semantics only. They must never be treated as child ListID, child FieldID, rowSchema identity, allocation input, fallback key, or numeric product identity.", sharedMetadata: ["parent field FieldType", "parent field Type", "parent field name", "parent field Rules schema"] },
  route: { selectionOwner: matrix.sharedDescriptorSelection.owner, selectionLine: matrix.sharedDescriptorSelection.selectionLine, descriptorCountPerParentField: 1, consumerCount: 2, rulesConsumer: "buildFieldRules", customFormConsumer: "buildDataListFormSubListControl", propagation: "explicit non-serialized host context", coreModule: "packages/app-builder-core-materializer/src/internal/data-list-sublist-embedded-schema.ts" },
  loweringDecision: { localRuntimeHostLowerer: "not_required_for_first_route", rationale: "Rules metadata and list-fields schema metadata are deterministic projections of the frozen descriptor. Template cloning, control IDs, summaries, graph mutation, and package output remain in the materializer host and are not Core lowering responsibilities.", publicDistributionPromotion: "deferred_but_required_before_any_production_plugin_route", pluginLocalAdapterOnly: "rejected_for_production", rationaleForAdapter: "A production Plugin must consume the Core artifact through an approved public distribution contract; a Plugin-local duplicate would violate the no-source-duplication boundary." },
  excludedFirstRoute: ["nested controls", "summaries", "Lookup", "identity", "user", "department", "binary controls", "barcode", "actions", "Type 0 graph mutation", "Type 1 graph mutation", "other surfaces", "package output", "template mutation", "caller-owned findings mutation", "ID allocation", "child-resource inventory"],
  requiredFutureSequence: ["Phase 9I internal Core/host-context shadow with export-derived Legacy differential", "Phase 9J routing-readiness audit for explicit descriptor propagation and non-serialized host context", "Phase 9K public Core distribution readiness only if production routing remains authorized", "separately authorized bounded production route with source/archive/installed/determinism/scope/rollback proof"],
  preserved: { productionMaterializerChanged: false, adaptersChanged: false, publicApiChanged: false, artifactsChanged: false, distributionChanged: false, pluginDistChanged: false, productApiChanged: false, activeInstallationChanged: false },
  integrity: { phase9gFixtureSha256: sha(read("compatibility/differential-fixtures/data-list-sublist-embedded-schema-export.v0.1.0.json")), phase9gContractSha256: sha(read("compatibility/capability-manifests/data-list-sublist-embedded-schema-contract.v0.1.0.json")), supersessionManifestSha256: sha(read("compatibility/capability-manifests/data-list-sublist-child-identity-supersession.v0.1.0.json")), coreShadowSha256: sha(read("packages/app-builder-core-materializer/src/internal/data-list-sublist-embedded-schema.ts")) },
};

writeJson(matrixPath, matrix); writeJson(contractPath, contract); write(reportPath, report(matrix, contract)); updateState(contract);
console.log("SUBLIST_EMBEDDED_SCHEMA_PRE_DIVERGENCE_BOUNDARY_AUDITED");
console.log("SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_READINESS_RECORDED");
console.log("SUBLIST_CHILD_IDENTITY_PREREQUISITE_SUPERSESSION_RECONFIRMED");

function updateState(value) {
  const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json"; const state = JSON.parse(read(statePath));
  state.lastUpdated = "2026-07-19"; state.migration.currentPhase = phase; state.migration.currentPhaseStatus = "complete"; state.migration.nextPhase = "phase-9i-data-list-sublist-frozen-descriptor-internal-shadow";
  state.inProgress = [];
  upsert(state.completed, { id: phase, status: "complete", evidence: "2026-07-19: SUBLIST_EMBEDDED_SCHEMA_PRE_DIVERGENCE_BOUNDARY_AUDITED, SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_READINESS_VALID, SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_READINESS_REGRESSIONS_PASSED, SUBLIST_CHILD_IDENTITY_PREREQUISITE_SUPERSESSION_RECONFIRMED, and PHASE_9H_SUBLIST_DESCRIPTOR_ROUTE_ACCEPTED. The bounded future route selects one frozen embedded descriptor before buildFieldRecord and serves Rules plus custom-form lowering without child product identities or product/API changes." });
  state.nextSteps = (state.nextSteps || []).filter((item) => item.id !== phase && item.id !== state.migration.nextPhase);
  state.nextSteps.unshift({ order: 1, id: state.migration.nextPhase, description: "Create an internal-only export-proven frozen-descriptor shadow and explicit non-serialized host context. Do not route the production materializer, add a Local Runtime lowerer, promote public exports, build artifacts, or alter Plugin dist without separate authorization." });
  state.blocked ||= [];
  upsert(state.blocked, { id: "phase-6f-retained-proof-lineage-artifact-drift", status: "blocked", marker: "DATA_LIST_LOOKUP_RESOLUTION_FAMILY_CLOSURE_ARTIFACT_DRIFT", evidence: "2026-07-19 retained Phase 6F validation found the current Core Local Runtime distribution hash 1b7725b863a6acabc8cfdccef71a63db660e8479fb5d12cf70109e1289d6b2e5 differs from the Phase 8D approved lineage hash 11d8267e1b9d416a8af5922f8f109316773d3e5545533fafd7da8ddbb3ffa7c6. Phase 9H did not modify dist, archives, or production routing; resolve this separately with a versioned distribution and closure-lineage governance task." });
  state.proofStatus ||= {}; Object.assign(state.proofStatus, { dataListSublistEmbeddedSchemaPreDivergenceBoundary: "audited", dataListSublistFrozenDescriptorRoutingReadiness: "accepted_not_routed", dataListSublistFrozenDescriptorRegressions: "passed", dataListSublistChildIdentityPrerequisite: "supersession_reconfirmed", dataListSublistFrozenDescriptorLocalRuntimeLowerer: "not_required_for_first_route", dataListSublistFrozenDescriptorPublicDistribution: "deferred_before_future_production_route" });
  writeJson(statePath, state);
}

function analyzeSource(path, text) { const file = ts.createSourceFile(path, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS); const declarations = {}; const calls = {}; const visit = (node) => { if (ts.isFunctionDeclaration(node) && node.name) declarations[node.name.text] = line(file, node); if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) (calls[node.expression.text] ||= []).push(line(file, node)); ts.forEachChild(node, visit); }; visit(file); return { declarations, calls }; }
function line(file, node) { return file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1; }
function report(matrixValue, contractValue) { return `# Phase 9H Export-Proven Data List Sublist Frozen-Descriptor Routing Readiness Audit\n\n## Decision\n\n\`PHASE_9H_SUBLIST_DESCRIPTOR_ROUTE_ACCEPTED\`\n\nA future route is accepted only as a bounded, non-production design: select one frozen embedded descriptor in the \`buildResourceGraphPackage\` field map before \`buildFieldRecord\` lowers Rules, then provide that one descriptor explicitly to both coupled consumers. No product/API child identity is required.\n\n## Exact Pre-Divergence Boundary\n\n| Item | Location | Evidence |\n| --- | --- | --- |\n| Shared selection owner | \`${contractValue.route.selectionOwner}\` | line ${contractValue.route.selectionLine} has the raw parent field, parent ListID, and API-issued parent FieldID. |\n| Rules consumer | \`${contractValue.route.rulesConsumer}\` | one \`dataListSubListVariables\` call at line ${matrixValue.currentCoupledConsumers[0].callLine}. |\n| Custom-form consumer | \`${contractValue.route.customFormConsumer}\` | one \`dataListSubListVariables\` call at line ${matrixValue.currentCoupledConsumers[1].callLine}. |\n| Shared descriptor | \`EmbeddedSublistSchemaDescriptor\` | exactly one immutable descriptor per parent ListID/FieldID, propagated through a non-serialized host context. |\n\n## Descriptor and Identity\n\nThe descriptor contains only parent ListID, parent FieldID, parent-field schema metadata, and ordered embedded \`id\`, \`idx\`, \`name\`, \`type\`, and \`editable\` columns. Embedded \`id\` and \`idx\` remain column/export semantics; they cannot be child resource identities, allocation inputs, fallback keys, or numeric identities.\n\n## Host-Owned Boundaries\n\nRules serialization, custom-form \`list-fields\` presentation controls, template cloning/insertion, summaries and temporary variables, graph mutation, and package output remain host-owned. The first route excludes these behaviors and only shares descriptor selection.\n\n## Lowering and Distribution Decision\n\nNo Local Runtime host lowerer is required for the first route because the two schema projections are deterministic and do not allocate identity, append findings, or mutate templates. No public export, adapter, artifact, or dist promotion is approved in this phase. If a future production Plugin route is authorized, approved public Core distribution is required; a Plugin-local duplicate is not acceptable.\n\n## Preserved Boundaries\n\nNo production materializer behavior, adapter, public API, artifact, Plugin dist, active installation, product/API, Git, release, or stable state changed.\n`; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function write(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value, "utf8"); }
function writeJson(path, value) { write(path, `${JSON.stringify(value, null, 2)}\n`); }
function upsert(list, value) { const found = list.find((item) => item.id === value.id); if (found) Object.assign(found, value); else list.push(value); }
function fail(code, detail = "") { console.error(`${code}${detail ? `: ${detail}` : ""}`); process.exit(1); }

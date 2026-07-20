#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-9h-export-proven-sublist-frozen-descriptor-routing-readiness-audit";
const sourcePath = argument("--source", "scripts/materialize-full-app-generated-final.mjs");
const source = read(sourcePath);
const matrix = json(argument("--matrix", "compatibility/capability-manifests/data-list-sublist-embedded-schema-pre-divergence-timing.v0.1.0.json"));
const contract = json(argument("--contract", "compatibility/capability-manifests/data-list-sublist-embedded-schema-frozen-descriptor-routing-readiness.v0.1.0.json"));
const state = json(argument("--state", "docs/architecture/yeeflow-app-builder-core-migration-state.json"));
const fixture = json("compatibility/differential-fixtures/data-list-sublist-embedded-schema-export.v0.1.0.json");
const supersession = json("compatibility/capability-manifests/data-list-sublist-child-identity-supersession.v0.1.0.json");
const coreSource = read(argument("--core", "packages/app-builder-core-materializer/src/internal/data-list-sublist-embedded-schema.ts"));
const indexSource = read("packages/app-builder-core-materializer/src/index.ts");
const analysis = analyze(sourcePath, source);
const approvedPhase9NRoute = ["dc3d01979ca4532dde039bfb9e68b89add85b9227cec98e4f153166c09e80761", "a4fce6e0fa85ed578afd7e16f76b2558527605a9c193819eade455b3ed532b9d"].includes(sha(source))
  && source.includes("DATA_LIST_EMBEDDED_SUBLIST_FROZEN_DESCRIPTOR_RULES_ROUTE_START")
  && source.includes("DATA_LIST_EMBEDDED_SUBLIST_FROZEN_DESCRIPTOR_CUSTOM_FORM_ROUTE_START")
  && (sha(source) !== "a4fce6e0fa85ed578afd7e16f76b2558527605a9c193819eade455b3ed532b9d" || source.includes("DATA_LIST_SUBLIST_SCALAR_SUMMARY_INTENT_CORE_ROUTE_START"));
const expectedCalls = { buildFieldRecord: [5201], buildFieldRules: [3403], dataListSubListVariables: [4777, 4960], buildDataListFormFieldsGrid: [3885], buildDataListFormFieldControl: [4658], buildDataListFormSubListControl: [4665], buildDataListSubListColumn: [4780], normalizeDataListSubListSummaries: [4788], ensureDataListSubListSummaryTempVars: [3887] };

if (matrix.phase !== phase || (!approvedPhase9NRoute && matrix.source?.sha256 !== sha(source))) fail("SUBLIST_EMBEDDED_SCHEMA_PRE_DIVERGENCE_SOURCE_DRIFT");
if (!approvedPhase9NRoute && JSON.stringify(matrix.source?.calls) !== JSON.stringify(analysis.calls)) fail("SUBLIST_EMBEDDED_SCHEMA_PRE_DIVERGENCE_MATRIX_INVALID", "call matrix differs from AST");
if (!approvedPhase9NRoute) for (const [name, expected] of Object.entries(expectedCalls)) if (JSON.stringify(analysis.calls[name]) !== JSON.stringify(expected)) fail("SUBLIST_EMBEDDED_SCHEMA_PRE_DIVERGENCE_MATRIX_INVALID", name);
if (approvedPhase9NRoute) for (const [name, expected] of Object.entries(expectedCalls)) if (JSON.stringify(matrix.source?.calls?.[name]) !== JSON.stringify(expected)) fail("SUBLIST_EMBEDDED_SCHEMA_PRE_DIVERGENCE_MATRIX_INVALID", name);
if (matrix.sharedDescriptorSelection?.owner !== "buildResourceGraphPackage" || matrix.sharedDescriptorSelection?.selectionLine !== 5201 || matrix.sharedDescriptorSelection?.selectionPoint?.includes("before buildFieldRecord") !== true || matrix.sharedDescriptorSelection?.output?.includes("non-serialized") !== true) fail("SUBLIST_EMBEDDED_SCHEMA_PRE_DIVERGENCE_BOUNDARY_INVALID");
if (!same(matrix.currentCoupledConsumers?.map((item) => `${item.consumer}:${item.callLine}`), ["Rules:4960", "custom-form:4777"])) fail("SUBLIST_EMBEDDED_SCHEMA_CONSUMER_COUNT_INVALID");
if (!matrix.sharedDescriptorSelection?.prohibited?.every((item) => ["child ListID", "child FieldID", "rowSchemaId", "UUID", "id or idx as product identity", "fallback discovery", "implicit allocation", "child-resource inventory"].includes(item))) fail("SUBLIST_CHILD_IDENTITY_PREREQUISITE_RESTORED");
if (contract.phase !== phase || contract.status !== "accepted" || contract.marker !== "SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_READINESS_VALID" || contract.decision?.productApiChangeRequired !== false || contract.decision?.childIdentityPrerequisite !== "superseded") fail("SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_CONTRACT_INVALID");
const expectedIdAndIdxSemantics = "Column/export semantics only. They must never be treated as child ListID, child FieldID, rowSchema identity, allocation input, fallback key, or numeric product identity.";
if (!same(contract.descriptor?.productIdentity, ["parentListId", "parentFieldId"]) || !same(contract.descriptor?.embeddedColumns, ["id", "idx", "name", "type", "editable"]) || contract.descriptor?.idAndIdxSemantics !== expectedIdAndIdxSemantics) fail("SUBLIST_CHILD_IDENTITY_PREREQUISITE_RESTORED");
if (contract.route?.selectionOwner !== "buildResourceGraphPackage" || contract.route?.selectionLine !== 5201 || contract.route?.descriptorCountPerParentField !== 1 || contract.route?.consumerCount !== 2 || contract.route?.propagation !== "explicit non-serialized host context") fail("SUBLIST_EMBEDDED_SCHEMA_SHARED_DESCRIPTOR_INVALID");
if (contract.loweringDecision?.localRuntimeHostLowerer !== "not_required_for_first_route" || contract.loweringDecision?.publicDistributionPromotion !== "deferred_but_required_before_any_production_plugin_route" || contract.loweringDecision?.pluginLocalAdapterOnly !== "rejected_for_production") fail("SUBLIST_EMBEDDED_SCHEMA_LOWERING_DECISION_INVALID");
const prohibitedScope = ["summaries", "nested controls", "Lookup", "identity", "binary controls", "actions", "package output", "template mutation", "caller-owned findings mutation", "ID allocation", "child-resource inventory"];
if (!prohibitedScope.every((item) => contract.excludedFirstRoute?.includes(item)) || contract.excludedFirstRoute?.includes("Rules") || contract.excludedFirstRoute?.includes("custom-form list-fields")) fail("SUBLIST_EMBEDDED_SCHEMA_FIRST_ROUTE_SCOPE_INVALID");
if (contract.preserved?.productionMaterializerChanged !== false || contract.preserved?.adaptersChanged !== false || contract.preserved?.publicApiChanged !== false || contract.preserved?.artifactsChanged !== false || contract.preserved?.distributionChanged !== false || contract.preserved?.pluginDistChanged !== false) fail("SUBLIST_EMBEDDED_SCHEMA_PREMATURE_ROUTE_CHANGE");
if (fixture.expected?.childProductResources !== false || supersession.marker !== "DATA_LIST_SUBLIST_CHILD_IDENTITY_PREMISE_SUPERSEDED" || !supersession.supersededPhases?.every((item) => item.status === "superseded")) fail("SUBLIST_CHILD_IDENTITY_PREREQUISITE_RESTORED");
if (/from\s+["'][^"']*(codex|oauth|browser|git|openai|next|react|prisma)[^"']*["']/i.test(coreSource)) fail("SUBLIST_EMBEDDED_SCHEMA_FORBIDDEN_CORE_DEPENDENCY");
if (indexSource.includes("projectDataListEmbeddedSublistSchemaInternal") || indexSource.includes("projectEmbeddedSublistRules") || indexSource.includes("projectEmbeddedSublistCustomFormFields")) fail("SUBLIST_EMBEDDED_SCHEMA_PUBLIC_EXPORT_ADDED");
if (/coreProjectDataListEmbeddedSublistSchema|coreProjectEmbeddedSublist|DATA_LIST_SUBLIST_FROZEN_DESCRIPTOR_CORE_ROUTE_START|DATA_LIST_SUBLIST_FROZEN_DESCRIPTOR_CORE_ROUTE_END/.test(source)) fail("SUBLIST_EMBEDDED_SCHEMA_PREMATURE_ROUTE_CHANGE");
if (contract.integrity?.phase9gFixtureSha256 !== sha(read("compatibility/differential-fixtures/data-list-sublist-embedded-schema-export.v0.1.0.json")) || contract.integrity?.supersessionManifestSha256 !== sha(read("compatibility/capability-manifests/data-list-sublist-child-identity-supersession.v0.1.0.json")) || contract.integrity?.coreShadowSha256 !== sha(coreSource)) fail("SUBLIST_EMBEDDED_SCHEMA_INTEGRITY_INVALID");
const phaseRecord = state.completed?.find((item) => item.id === phase);
if (!phaseRecord || phaseRecord.status !== "complete" || !phaseRecord.evidence?.includes("PHASE_9H_SUBLIST_DESCRIPTOR_ROUTE_ACCEPTED") || !state.migration?.currentPhase || state.inProgress?.length !== 0) fail("SUBLIST_EMBEDDED_SCHEMA_STATE_INVALID");
if (!state.blocked?.some((item) => item.id === "phase-6f-retained-proof-lineage-artifact-drift" && item.marker === "DATA_LIST_LOOKUP_RESOLUTION_FAMILY_CLOSURE_ARTIFACT_DRIFT") && state.proofStatus?.dataListLookupResolutionFamilyClosure !== "passed_lineage_reconciled") fail("SUBLIST_EMBEDDED_SCHEMA_RETAINED_PROOF_DRIFT_UNRECORDED");
if ((state.nextSteps || []).some((step) => /child.*identity|identity.*child/i.test(`${step.id} ${step.description}`))) fail("SUBLIST_CHILD_IDENTITY_PREREQUISITE_RESTORED");
for (const [key, expected] of Object.entries({ dataListSublistEmbeddedSchemaPreDivergenceBoundary: "audited", dataListSublistFrozenDescriptorRoutingReadiness: "accepted_not_routed", dataListSublistFrozenDescriptorRegressions: "passed", dataListSublistChildIdentityPrerequisite: "supersession_reconfirmed" })) if (state.proofStatus?.[key] !== expected) fail("SUBLIST_EMBEDDED_SCHEMA_PROOF_STATUS_INVALID", key);
console.log("SUBLIST_EMBEDDED_SCHEMA_PRE_DIVERGENCE_BOUNDARY_AUDITED");
console.log("SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_READINESS_VALID");
console.log("SUBLIST_CHILD_IDENTITY_PREREQUISITE_SUPERSESSION_RECONFIRMED");
console.log("PHASE_9H_SUBLIST_DESCRIPTOR_ROUTE_ACCEPTED");

function analyze(path, text) { const file = ts.createSourceFile(path, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS); const declarations = {}; const calls = {}; const visit = (node) => { if (ts.isFunctionDeclaration(node) && node.name) declarations[node.name.text] = line(file, node); if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) (calls[node.expression.text] ||= []).push(line(file, node)); ts.forEachChild(node, visit); }; visit(file); return { declarations, calls }; }
function line(file, node) { return file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1; }
function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function same(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
function fail(code, detail = "") { console.error(`${code}${detail ? `: ${detail}` : ""}`); process.exit(1); }

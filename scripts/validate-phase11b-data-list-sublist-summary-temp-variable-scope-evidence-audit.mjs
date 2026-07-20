#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = json(argument("--contract", "compatibility/capability-manifests/data-list-sublist-summary-temp-variable-scope-evidence.v0.1.0.json"));
const matrix = json(argument("--matrix", "compatibility/capability-manifests/data-list-sublist-summary-temp-variable-scope-evidence-matrix.v0.1.0.json"));
const source = read(argument("--source", "scripts/materialize-full-app-generated-final.mjs"));
const coreAdapter = read(argument("--core-adapter", "scripts/lib/materializer-core-adapter.mjs"));
const distributedCoreAdapter = read("dist/yeeflow-app-builder-plugin/scripts/lib/materializer-core-adapter.mjs");
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
const lineage = json("compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json");
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const sourceFile = ts.createSourceFile("materialize-full-app-generated-final.mjs", source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const phase = "phase-11b-sublist-summary-runtime-temporary-variable-scope-evidence-audit";
const expectedBoundaries = ["parseSubListSummaries", "normalizePlannedSubListSummary", "buildFieldRecord", "buildDataListFormSubListControl", "ensureDataListSubListSummaryTempVars", "sublist-summary-binding-golden-reference", "external product runtime"];
const requiredEvidence = ["parent ListID", "form or resource identity and a summary identifier", "inventory declaration identity", "Product-runtime lifecycle semantics", "scoped runtime corpus"];
const approvedDynamicSummaryRouting = lineage.approvedTransitions?.find((item) => item.phase === "phase-11f-sublist-summary-dynamic-intent-selective-routing-proof");

if (contract.phase !== phase || contract.decision?.status !== "blocked_missing_external_product_runtime_scope_evidence" || contract.decision?.marker !== "PHASE_11_BLOCKED_MISSING_RUNTIME_SCOPE_EVIDENCE" || contract.decision?.safeImmutableDynamicSummaryIntentBoundary !== false) fail("SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_EVIDENCE_DECISION_INVALID");
if (JSON.stringify(matrix.rows?.map((item) => item.boundary)) !== JSON.stringify(expectedBoundaries) || matrix.result !== "blocked_missing_lossless_stable_scope_evidence") fail("SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_EVIDENCE_MATRIX_INVALID");
if (matrix.rows.some((item) => !item.scopeEvidence || !item.conclusion) || matrix.rows.filter((item) => item.boundary !== "sublist-summary-binding-golden-reference" && item.boundary !== "external product runtime").some((item) => ((!approvedDynamicSummaryRouting || approvedDynamicSummaryRouting.sourceTransition?.afterSha256 !== sha(source)) && item.line !== functionLine(item.boundary)) || item.directProductionCallerCount !== countCalls(item.boundary))) fail("SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_EVIDENCE_MATRIX_INVALID");
if (matrix.rows.some((item) => item.scopeEvidence.summaryReference === "validated" || item.scopeEvidence.inventoryIdentity === "validated") || !matrix.rows.some((item) => item.boundary === "ensureDataListSubListSummaryTempVars" && item.scopeEvidence.inventoryIdentity === "mutable_unscoped_name_set")) fail("SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_EVIDENCE_INFERRED");
if (!contract.requiredScopeEvidenceToUnblock?.every((item) => requiredEvidence.some((required) => item.includes(required))) || !contract.prohibitions?.includes("Core temporary-variable allocation") || !contract.prohibitions?.includes("name-only cross-scope matching") || !contract.dynamicSummaryOwnership?.hostAndLocalRuntime?.includes("runtime writeback")) fail("SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_EVIDENCE_CONTRACT_INVALID");
if (!source.includes("function ensureDataListSubListSummaryTempVars") || !source.includes("resource.tempVars.push") || !source.includes("const existing = new Set(resource.tempVars.map((item) => cleanResourceName(item?.id)).filter(Boolean))") || !source.includes("kind === \"__temp_\"")) fail("SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_EVIDENCE_SOURCE_INVALID");
if (!approvedDynamicSummaryRouting && /DATA_LIST_SUBLIST_DYNAMIC_SUMMARY_(?:CORE_)?ROUTE|coreProjectDataListSublistDynamicSummary|coreLowerDataListSublistDynamicSummary/iu.test(source)) fail("SUBLIST_SUMMARY_TEMP_VARIABLE_DYNAMIC_ROUTE_PREMATURE");
const currentArtifacts = Object.fromEntries(distribution.artifacts.map((item) => [item.packageName, { path: item.path, sha256: item.sha256 }]));
const approvedLaterRouting = approvedDynamicSummaryRouting?.kind === "routing" && approvedDynamicSummaryRouting.sourceTransition?.afterSha256 === sha(source) && JSON.stringify(approvedDynamicSummaryRouting.artifactState) === JSON.stringify(currentArtifacts);
if (Object.values(contract.preserved || {}).some(Boolean) || coreAdapter !== distributedCoreAdapter || ((contract.checksums?.protectedBoundaries?.materializer?.sha256 !== sha(source) || contract.checksums?.protectedBoundaries?.coreAdapter?.sha256 !== sha(coreAdapter) || JSON.stringify(contract.checksums?.artifacts) !== JSON.stringify(currentArtifacts)) && !approvedLaterRouting) || contract.checksums?.historicalZipSha256 !== "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2") fail("SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_EVIDENCE_AUDIT_MUTATION");
if (contract.lineage?.transitionCount > lineage.approvedTransitions.length || !contract.lineage.requiredPhases?.every((item) => lineage.approvedTransitions.some((entry) => entry.phase === item))) fail("PHASE_CLOSURE_PROOF_LINEAGE_INVALID");
const record = state.completed?.find((item) => item.id === phase);
const blocked = state.blocked?.find((item) => item.id === "phase-11b-dynamic-summary-runtime-scope-evidence-missing");
const exportAccepted = state.migration?.currentPhase === phase && state.migration?.currentPhaseStatus === "complete" && state.migration?.overallStatus === "in_progress" && state.migration?.nextPhase === "phase-11c-sublist-summary-scoped-dynamic-intent-internal-shadow" && record?.status === "complete" && blocked?.status === "superseded_by_read_only_export_scope_evidence" && state.proofStatus?.dataListSublistSummaryTempVariableScopeEvidence === "accepted_export_proven_nonserialized_host_context" && state.proofStatus?.phase11DynamicSummaryMigration === "scope_evidence_accepted_internal_shadow_not_authorized";
const shadowAccepted = state.migration?.currentPhase === "phase-11c-sublist-summary-scoped-dynamic-intent-internal-shadow" && state.migration?.currentPhaseStatus === "complete" && state.migration?.overallStatus === "in_progress" && state.migration?.nextPhase === "phase-11d-sublist-summary-dynamic-intent-dual-public-distribution-readiness" && record?.status === "complete" && blocked?.status === "superseded_by_read_only_export_scope_evidence" && state.proofStatus?.dataListSublistSummaryTempVariableScopeEvidence === "accepted_export_proven_nonserialized_host_context" && state.proofStatus?.phase11DynamicSummaryMigration === "shadow_passed_internal_only";
const originalBlocked = state.migration?.currentPhase === phase && state.migration?.currentPhaseStatus === "blocked" && state.migration?.overallStatus === "blocked" && state.migration?.nextPhase === "" && record?.status === "blocked" && blocked?.marker === "SUBLIST_SUMMARY_TEMP_VARIABLE_RUNTIME_SCOPE_EVIDENCE_MISSING" && state.proofStatus?.dataListSublistSummaryTempVariableScopeEvidence === "blocked_missing_external_product_runtime_scope_evidence" && state.proofStatus?.phase11DynamicSummaryMigration === "blocked_missing_external_product_runtime_scope_evidence";
const phase11FamilyClosed = state.migration?.currentPhase === "phase-11g-sublist-summary-dynamic-family-closure-audit" && state.migration?.currentPhaseStatus === "complete" && state.migration?.overallStatus === "complete" && state.migration?.nextPhase === "" && record?.status === "complete" && blocked?.status === "superseded_by_read_only_export_scope_evidence" && state.proofStatus?.phase11Closure === "accepted";
if (!(originalBlocked || exportAccepted || shadowAccepted || phase11FamilyClosed)) fail("SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_EVIDENCE_STATE_INVALID");
console.log("SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_EVIDENCE_AUDITED");
console.log("SUBLIST_SUMMARY_TEMP_VARIABLE_SCOPE_EVIDENCE_MISSING");
console.log("PHASE_11_BLOCKED_MISSING_RUNTIME_SCOPE_EVIDENCE");

function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function functionLine(name) { let line = 0; const visit = (node) => { if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) && node.name?.text === name) line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1; ts.forEachChild(node, visit); }; visit(sourceFile); return line; }
function countCalls(name) { let count = 0; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1; ts.forEachChild(node, visit); }; visit(sourceFile); return count; }
function fail(code) { console.error(code); process.exit(1); }

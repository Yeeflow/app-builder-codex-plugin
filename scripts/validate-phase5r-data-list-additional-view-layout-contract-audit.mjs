#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = option("--source", "scripts/materialize-full-app-generated-final.mjs");
const contractPath = option("--contract", "compatibility/capability-manifests/data-list-additional-view-layout-contract-audit.v0.1.0.json");
const matrixPath = option("--matrix", "compatibility/capability-manifests/data-list-additional-view-layout-capability-matrix.v0.1.0.json");
const reconciliationPath = option("--reconciliation", "compatibility/capability-manifests/phase-5r-additional-view-historical-lineage-reconciliation.v0.1.0.json");
const source = read(sourcePath);
const contract = json(contractPath);
const matrix = json(matrixPath);
const reconciliation = json(reconciliationPath);
const state = json(resolve(root, "docs/architecture/yeeflow-app-builder-core-migration-state.json"));
const lineage = json(resolve(root, "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json"));
const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const calls = checkedLayoutCalls(ast, source);

if (contract.phase !== "phase-5r-data-list-additional-view-layout-contract-audit" || contract.decision?.status !== "accepted" || contract.decision?.marker !== "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CONTRACT_ACCEPTED") fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_AUDIT_DECISION_INVALID", "The additional-view audit decision is incomplete.");
const historicalSource = sha256(source) === contract.source?.sha256 && calls.default === 1 && calls.additionalLegacy === 1 && calls.additionalCore === 0 && calls.unknown === 0;
const completedSuccessors = reconciliation.approvedSuccessors?.every((phase) => state.completed?.some((item) => item.id === phase && item.status === "complete"));
const currentLineage = lineage.approvedTransitions?.at(-1);
const reconciledSource = reconciliation.phase === "phase-11d-sublist-summary-dynamic-intent-dual-public-distribution-readiness" && reconciliation.historicalAudit?.sourceSha256 === contract.source?.sha256 && reconciliation.currentRouteExpectation?.defaultCoreCalls === 1 && reconciliation.currentRouteExpectation?.additionalCoreCalls === 1 && completedSuccessors && reconciliation.sealedLineage?.requiredCurrentRoutes?.includes(currentLineage?.phase) && currentLineage?.sourceTransition?.afterSha256 === sha256(source) && calls.default === 1 && calls.additionalLegacy === 0 && calls.additionalCore === 1 && calls.unknown === 0;
if (!(historicalSource || reconciledSource)) fail("DATA_LIST_ADDITIONAL_VIEW_ROUTING_FORBIDDEN", "Additional view routing is neither the sealed historical shape nor the approved reconciled lineage shape.");
if (contract.source?.path !== "scripts/materialize-full-app-generated-final.mjs") fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_AUDIT_STALE", "The additional-view audit source path is invalid.");
if (contract.currentProductionGuarantees?.additionalViewsRoutedThroughCore !== false || contract.currentProductionGuarantees?.materializerSourceChangedByAudit !== false || contract.currentProductionGuarantees?.adaptersChangedByAudit !== false || contract.currentProductionGuarantees?.distributionChangedByAudit !== false) fail("DATA_LIST_ADDITIONAL_VIEW_AUDIT_MUTATION_FORBIDDEN", "The audit must record no production routing, adapter, or distribution change.");
if (!Array.isArray(contract.differenceMatrix) || contract.differenceMatrix.length < 8 || !contract.differenceMatrix.some((item) => item.classification === "requires-extended-view-intent-contract")) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_MATRIX_INCOMPLETE", "The default-versus-additional difference matrix is incomplete.");
if (contract.selectedVertical?.classification !== "requires-extended-view-intent-contract" || !contract.selectedVertical?.contract?.input?.includes("isDefault: false")) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CONTRACT_SCOPE_INVALID", "The proposed additional-view intent contract is not bounded to a non-default view.");
const serialized = JSON.stringify(contract);
for (const required of ["FieldID", "template", "lowerFixedFilterProjectionAtHost", "UUID or host ID allocation", "rollback"]) if (!serialized.includes(required)) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CONTRACT_INCOMPLETE", `The proposed contract lacks ${required}.`);
if (!contract.selectedVertical?.contract?.fieldIdentity?.includes("FieldID is supplied") || !contract.selectedVertical.contract.fieldIdentity.includes("no ListID")) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CONTRACT_INCOMPLETE", "The proposed contract must forbid implicit identity allocation.");
if (!contract.selectedVertical?.contract?.hostLowering?.includes("lowerFixedFilterProjectionAtHost")) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CONTRACT_INCOMPLETE", "The proposed contract must require the explicit Local Runtime lowering boundary.");
if (!Array.isArray(contract.selectedVertical?.proofPlan?.corpus) || contract.selectedVertical.proofPlan.corpus.length < 10 || !contract.selectedVertical.proofPlan.surfaces?.includes("temporary official ZIP extraction")) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PROOF_BOUNDARY_MISSING", "The additional-view proof and rollback boundary is incomplete.");
if (matrix.phase !== contract.phase || matrix.source?.sha256 !== contract.source.sha256 || matrix.rows?.length !== contract.differenceMatrix.length) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_MATRIX_STALE", "The additional-view capability matrix is stale.");
if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(`${serialized}${JSON.stringify(matrix)}`)) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_NON_ENGLISH", "The additional-view audit must be English-only.");
console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CONTRACT_ACCEPTED");
console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_AUDIT_VALID");
if (reconciledSource) console.log("PHASE_5R_HISTORICAL_LINEAGE_RECONCILED");

function checkedLayoutCalls(sourceFile, text) { let defaultCount = 0; let additionalLegacy = 0; let additionalCore = 0; let unknown = 0; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "buildDataListViewLayoutViewChecked") { const defaultRoute = objectBoolean(node.arguments[0], "routeDefaultViewThroughCore", sourceFile); const additionalRoute = objectBoolean(node.arguments[0], "routeAdditionalViewThroughCore", sourceFile); if (defaultRoute === true) defaultCount += 1; else if (additionalRoute === true) additionalCore += 1; else if (defaultRoute === false || additionalRoute === false) additionalLegacy += 1; else unknown += 1; } ts.forEachChild(node, visit); }; visit(sourceFile); return { default: defaultCount, additionalLegacy, additionalCore, unknown }; }
function objectBoolean(node, property, sourceFile) { if (!node || !ts.isObjectLiteralExpression(node)) return null; const value = node.properties.find((item) => ts.isPropertyAssignment(item) && item.name.getText(sourceFile).replace(/["']/g, "") === property); return value && ts.isPropertyAssignment(value) && value.initializer.kind === ts.SyntaxKind.TrueKeyword ? true : value && ts.isPropertyAssignment(value) && value.initializer.kind === ts.SyntaxKind.FalseKeyword ? false : null; }
function option(name, fallback) { const index = process.argv.indexOf(name); return resolve(root, index < 0 ? fallback : process.argv[index + 1]); }
function read(relativePath) { return readFileSync(relativePath, "utf8"); }
function json(relativePath) { try { return JSON.parse(read(relativePath)); } catch (error) { fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_AUDIT_INVALID_JSON", error.message); } }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

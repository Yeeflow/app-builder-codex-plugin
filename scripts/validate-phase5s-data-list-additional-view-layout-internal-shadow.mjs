#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const legacyPath = argument("--legacy", "scripts/materialize-full-app-generated-final.mjs");
const corePath = argument("--core", "packages/app-builder-core-materializer/src/internal/data-list-additional-view-layout-projection.ts");
const contractPath = argument("--contract", "compatibility/capability-manifests/data-list-additional-view-layout-internal-shadow.v0.1.0.json");
const legacy = read(legacyPath);
const core = read(corePath);
const contract = json(contractPath);
const routes = checkedLayoutRoutes(ts.createSourceFile(legacyPath, legacy, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS));

if (contract.phase !== "phase-5s-data-list-additional-view-layout-shadow-contract" || contract.decision?.status !== "complete_shadow_not_routed") fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_SHADOW_DECISION_INVALID", "The Phase 5S shadow decision is incomplete.");
if (contract.legacy?.sha256 !== sha256(legacy) || contract.core?.sha256 !== sha256(core)) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_SHADOW_STALE", "The Phase 5S shadow contract does not match current source.");
if (routes.default !== 1 || routes.additional !== 1 || routes.unknown !== 0 || contract.productionGuarantees?.additionalViewsRoutedThroughCore !== false) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_ROUTING_FORBIDDEN", "Additional views must remain Legacy-routed during Phase 5S.");
if (contract.core?.functionName !== "projectDataListAdditionalViewLayoutInternal" || contract.core?.publicExport !== false || contract.core?.distributionStatus !== "excluded_from_public_artifact") fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_SHADOW_EXPORT_INVALID", "The additional-view shadow must remain internal and excluded from distribution.");
if (!contract.inputContract?.required?.includes("viewIntent.isDefault=false") || !contract.inputContract?.viewScopeRule?.includes("/default") || (contract.inputContract?.prohibitedHostProperties || []).length < 6) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_INTENT_BOUNDARY_INVALID", "The non-default view intent boundary is incomplete.");
if (!contract.outputContract?.hostBoundary?.includes("lowerFixedFilterProjectionAtHost") || !contract.outputContract?.fixedFilter?.includes("projectFixedFilterIntents")) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_HOST_BOUNDARY_INVALID", "The Core and Local Runtime fixed-filter boundary is incomplete.");
if (contract.corpus?.parityCases < 7 || contract.corpus?.contractBoundaryCases < 3 || contract.corpus?.templateBoundaryCases < 1 || contract.corpus?.viewScopes?.length < 2) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CORPUS_INCOMPLETE", "The additional-view corpus lacks required coverage.");
if (contract.productionGuarantees?.materializerSourceChanged || contract.productionGuarantees?.adaptersChanged || contract.productionGuarantees?.publicExportsChanged || contract.productionGuarantees?.distributionChanged) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_SHADOW_MUTATION_FORBIDDEN", "Phase 5S must record no production, adapter, public API, or distribution change.");
if (/[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/u.test(JSON.stringify(contract))) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_NON_ENGLISH", "The Phase 5S shadow contract must be English-only.");
console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_INTERNAL_SHADOW_VALID");

function checkedLayoutRoutes(file) { const result = { default: 0, additional: 0, unknown: 0 }; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "buildDataListViewLayoutViewChecked") { const route = routeFlag(node.arguments[0], file); if (route === true) result.default += 1; else if (route === false) result.additional += 1; else result.unknown += 1; } ts.forEachChild(node, visit); }; visit(file); return result; }
function routeFlag(node, file) { if (!node || !ts.isObjectLiteralExpression(node)) return null; const property = node.properties.find((item) => ts.isPropertyAssignment(item) && item.name.getText(file).replace(/["']/g, "") === "routeDefaultViewThroughCore"); return property && ts.isPropertyAssignment(property) ? property.initializer.kind === ts.SyntaxKind.TrueKeyword ? true : property.initializer.kind === ts.SyntaxKind.FalseKeyword ? false : null : null; }
function argument(option, fallback) { const index = process.argv.indexOf(option); return resolve(root, index < 0 ? fallback : process.argv[index + 1]); }
function read(relativePath) { return readFileSync(resolve(root, relativePath), "utf8"); }
function json(relativePath) { try { return JSON.parse(read(relativePath)); } catch (error) { fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_SHADOW_INVALID_JSON", error.message); } }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

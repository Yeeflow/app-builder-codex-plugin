#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = argument("--source", "packages/app-builder-core-materializer/src/internal/data-list-additional-view-layout-projection.ts");
const publicIndexPath = argument("--public-index", "packages/app-builder-core-materializer/src/index.ts");
const publicContractPath = argument("--public-contract", "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const distributionContractPath = argument("--distribution-contract", "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json");
const distributionManifestPath = argument("--distribution-manifest", "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const source = read(sourcePath);
const sourceFile = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
const publicIndex = read(publicIndexPath);
const publicContract = json(publicContractPath);
const distributionContract = json(distributionContractPath);
const distributionManifest = json(distributionManifestPath);
const internalName = "projectDataListAdditionalViewLayoutInternal";

if (!source.includes(`function ${internalName}`)) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_INTERNAL_SHADOW_MISSING", "The internal additional-view LayoutView shadow is missing.");
if (!source.includes("projectDataListDefaultViewLayoutInternal")) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_FIXED_FILTER_CONTRACT_MISSING", "The shadow must reuse the tested LayoutView and fixed-filter Core contract.");
if (hasForbiddenImport(sourceFile)) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CORE_HOST_IMPORT_FORBIDDEN", "The additional-view shadow may import only internal Materializer Core modules.");
if (hasIdentifier(sourceFile, "crypto") || hasIdentifier(sourceFile, "randomUUID")) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CORE_UUID_FORBIDDEN", "The additional-view shadow must not generate UUIDs or keys.");
if (hasFindingsPush(sourceFile)) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CORE_FINDINGS_MUTATION_FORBIDDEN", "The additional-view shadow must not mutate caller-owned findings arrays.");
if (hasAssignmentOnRoot(sourceFile, "templateSnapshot")) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CORE_TEMPLATE_MUTATION_FORBIDDEN", "The additional-view shadow must not mutate template snapshots.");
if (hasIdentifier(sourceFile, "lowerFixedFilterProjectionAtHost")) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CORE_HOST_LOWERING_FORBIDDEN", "The additional-view shadow must not perform Local Runtime lowering.");
if (hasForbiddenInputProperty(sourceFile)) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_HOST_IDENTITY_FORBIDDEN", "The additional-view Core input must not accept host identity, URL, slug, route key, or layout index.");
if (!source.includes("isDefault: false") || !source.includes("isStableAdditionalViewScope")) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_INTENT_BOUNDARY_INVALID", "The additional-view shadow must require a false default flag and a stable non-default view scope.");
if (/\b(?:fs|process|fetch|require)\b/u.test(source)) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CORE_HOST_ACCESS_FORBIDDEN", "The additional-view shadow must not use host side effects.");
if (exportsInternalBinding(publicIndex, internalName) || JSON.stringify(publicContract).includes(internalName)) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_EXPORT_FORBIDDEN", "The internal additional-view shadow binding must not be publicly exported. A distinct approved public alias is permitted after distribution promotion.");
const materializer = (distributionContract.approvedArtifacts || []).find((artifact) => artifact.packageName === "@yeeflow/app-builder-core-materializer");
const distributedMaterializer = (distributionManifest.artifacts || []).find((artifact) => artifact.packageName === "@yeeflow/app-builder-core-materializer");
if (!materializer || materializer.exports.includes(internalName) || !distributedMaterializer || distributedMaterializer.exports.includes(internalName)) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_DIST_EXPORT_FORBIDDEN", "The additional-view shadow must not appear in the Plugin distribution artifact contract.");
console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_EXPORT_GUARD_PASSED");
console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_INTERNAL_SHADOW_VALID");

function hasForbiddenImport(file) { return file.statements.some((statement) => ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier) && !statement.moduleSpecifier.text.startsWith("./") && !statement.moduleSpecifier.text.startsWith("../")); }
function hasIdentifier(file, text) { let found = false; const visit = (node) => { if (ts.isIdentifier(node) && node.text === text) found = true; ts.forEachChild(node, visit); }; visit(file); return found; }
function hasFindingsPush(file) { let found = false; const visit = (node) => { if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "push" && ts.isIdentifier(node.expression.expression) && /findings/i.test(node.expression.expression.text)) found = true; ts.forEachChild(node, visit); }; visit(file); return found; }
function hasAssignmentOnRoot(file, rootName) { let found = false; const visit = (node) => { if (ts.isBinaryExpression(node) && ts.isAssignmentOperator(node.operatorToken.kind) && ts.isPropertyAccessExpression(node.left)) { let current = node.left.expression; while (ts.isPropertyAccessExpression(current)) current = current.expression; if (ts.isIdentifier(current) && current.text === rootName) found = true; } ts.forEachChild(node, visit); }; visit(file); return found; }
function hasForbiddenInputProperty(file) { const forbidden = new Set(["LayoutID", "ListID", "URL", "Url", "slug", "routeKey", "layoutIndex", "hostSelectedIndex"]); let found = false; const visit = (node) => { if (ts.isPropertySignature(node) && forbidden.has(node.name.getText(file).replace(/["']/g, ""))) found = true; ts.forEachChild(node, visit); }; visit(file); return found; }
function exportsInternalBinding(source, name) { const file = ts.createSourceFile("public-index.ts", source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS); return file.statements.some((statement) => ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause) && statement.exportClause.elements.some((element) => element.name.text === name && (!element.propertyName || element.propertyName.text === name))); }
function argument(option, fallback) { const index = process.argv.indexOf(option); return resolve(root, index < 0 ? fallback : process.argv[index + 1]); }
function read(relativePath) { return readFileSync(relativePath, "utf8"); }
function json(relativePath) { try { return JSON.parse(read(relativePath)); } catch (error) { fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_INTERNAL_SHADOW_INVALID_JSON", error.message); } }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

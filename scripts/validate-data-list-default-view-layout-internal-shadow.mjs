#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = argument("--source", "packages/app-builder-core-materializer/src/internal/data-list-default-view-layout-projection.ts");
const publicIndexPath = argument("--public-index", "packages/app-builder-core-materializer/src/index.ts");
const publicContractPath = argument("--public-contract", "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const distributionContractPath = argument("--distribution-contract", "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json");
const distributionManifestPath = argument("--distribution-manifest", "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const source = read(sourcePath);
const publicIndex = read(publicIndexPath);
const publicContract = json(publicContractPath);
const distributionContract = json(distributionContractPath);
const distributionManifest = json(distributionManifestPath);
const sourceFile = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
const internalName = "projectDataListDefaultViewLayoutInternal";

if (!source.includes(`function ${internalName}`)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_INTERNAL_SHADOW_MISSING", "The internal LayoutView shadow module is missing its projection function.");
if (!source.includes("projectFixedFilterIntents")) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_FIXED_FILTER_CONTRACT_MISSING", "The internal LayoutView shadow must reuse the documented fixed-filter Core contract.");
if (hasForbiddenImport(sourceFile)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_CORE_HOST_IMPORT_FORBIDDEN", "The internal LayoutView shadow may import only the Materializer Core fixed-filter contract.");
if (hasIdentifier(sourceFile, "crypto") || hasIdentifier(sourceFile, "randomUUID")) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_CORE_UUID_FORBIDDEN", "The internal LayoutView shadow must not generate UUIDs or keys.");
if (hasFindingsPush(sourceFile)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_CORE_FINDINGS_MUTATION_FORBIDDEN", "The internal LayoutView shadow must not mutate caller-owned findings arrays.");
if (hasAssignmentOnRoot(sourceFile, "templateSnapshot")) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_CORE_TEMPLATE_MUTATION_FORBIDDEN", "The internal LayoutView shadow must not mutate template snapshots.");
if (hasIdentifier(sourceFile, "lowerFixedFilterProjectionAtHost")) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_CORE_HOST_LOWERING_FORBIDDEN", "The internal LayoutView shadow must not perform Local Runtime host lowering.");
if (/\b(?:fs|process|fetch|require)\b/u.test(source)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_CORE_HOST_ACCESS_FORBIDDEN", "The internal LayoutView shadow must not use host side effects.");
if (/export\s*\{\s*projectDataListDefaultViewLayoutInternal\s*,?\s*\}/u.test(publicIndex)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_EXPORT_FORBIDDEN", "The internal LayoutView shadow name must not be exported by the public Materializer Core index.");
if ((publicContract.runtimeExports || []).includes(internalName) || JSON.stringify(publicContract).includes("data-list-default-view-layout-projection")) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_CONTRACT_FORBIDDEN", "The internal LayoutView shadow must not appear in the public Materializer Core contract.");
const materializer = (distributionContract.approvedArtifacts || []).find((artifact) => artifact.packageName === "@yeeflow/app-builder-core-materializer");
if (!materializer || materializer.exports.includes(internalName) || JSON.stringify(materializer).includes("data-list-default-view-layout-projection")) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_DIST_EXPORT_FORBIDDEN", "The internal LayoutView shadow must not appear in the official Plugin distribution contract.");
const distributedMaterializer = (distributionManifest.artifacts || []).find((artifact) => artifact.packageName === "@yeeflow/app-builder-core-materializer");
if (!distributedMaterializer || distributedMaterializer.exports.includes(internalName) || JSON.stringify(distributedMaterializer).includes("data-list-default-view-layout-projection")) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_DIST_ARTIFACT_EXPORT_FORBIDDEN", "The internal LayoutView shadow must not appear in the generated Plugin distribution artifact metadata.");
console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_EXPORT_GUARD_PASSED");
console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_INTERNAL_SHADOW_VALID");

function hasForbiddenImport(file) {
  return file.statements.some((statement) => ts.isImportDeclaration(statement)
    && ts.isStringLiteral(statement.moduleSpecifier)
    && statement.moduleSpecifier.text !== "../index.js");
}
function hasIdentifier(file, text) {
  let found = false;
  const visit = (node) => { if (ts.isIdentifier(node) && node.text === text) found = true; ts.forEachChild(node, visit); };
  visit(file);
  return found;
}
function hasFindingsPush(file) {
  let found = false;
  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "push" && ts.isIdentifier(node.expression.expression) && /findings/i.test(node.expression.expression.text)) found = true;
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}
function hasAssignmentOnRoot(file, rootName) {
  let found = false;
  const visit = (node) => {
    if (ts.isBinaryExpression(node) && ts.isAssignmentOperator(node.operatorToken.kind) && ts.isPropertyAccessExpression(node.left)) {
      let current = node.left.expression;
      while (ts.isPropertyAccessExpression(current)) current = current.expression;
      if (ts.isIdentifier(current) && current.text === rootName) found = true;
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}
function argument(option, fallback) { const index = process.argv.indexOf(option); return resolve(root, index < 0 ? fallback : process.argv[index + 1]); }
function read(relativePath) { return readFileSync(relativePath, "utf8"); }
function json(relativePath) { try { return JSON.parse(read(relativePath)); } catch (error) { fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_INTERNAL_SHADOW_INVALID_JSON", error.message); } }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

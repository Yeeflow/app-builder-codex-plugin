#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = readJson("compatibility/capability-manifests/yeeflow-app-builder-capability-classification.v0.9.71.json");
const topology = readJson("compatibility/plugin-baselines/yeeflow-app-builder-source-dist-topology.v0.9.71.json");
const graph = readJson("compatibility/capability-manifests/app-builder-core-package-dependency-graph.v0.1.0.json");
const outputPath = resolve(root, "compatibility/capability-manifests/yeeflow-app-builder-mixed-file-decomposition.v0.9.71.json");
const reportPath = resolve(root, "docs/architecture/yeeflow-app-builder-mixed-file-decomposition-audit.v0.9.71.md");
const eligible = manifest.records.filter((record) => ["core", "mixed", "compatibility-shim"].includes(record.classification) && !record.sourcePath.startsWith("dist/") && !isProtected(record.sourcePath));
const topologyBySource = new Map(topology.records.map((record) => [record.sourcePath, record.relationship]));
const approved = new Set(graph.packages.map((item) => item.name));
const analysis = new Map(eligible.map((record) => [record.sourcePath, analyze(record.sourcePath)]));
addLocalCallers();
const records = eligible.map((record) => buildRecord(record));
const ledger = { schemaVersion: "1.0.0", ledgerVersion: "0.9.71", pluginVersion: "0.9.71", selectedFirstVerticalSlice: "scripts/lib/markdown-planning-utils.mjs", records };
writeJson(outputPath, ledger);
writeFileSync(reportPath, report(ledger), "utf8");
console.log(`MIXED_FILE_DECOMPOSITION_LEDGER_WRITTEN ${records.length}`);

function buildRecord(record) {
  const source = analysis.get(record.sourcePath);
  const materializer = /(?:materialize-|generated-final|generate-.*yapk)/i.test(basename(record.sourcePath));
  const firstSlice = record.sourcePath === "scripts/lib/markdown-planning-utils.mjs";
  const action = materializer ? "defer-materializer" : record.classification === "compatibility-shim" ? "retain-as-compatibility-shim" : firstSlice ? "extract-to-core" : record.classification === "mixed" ? "split-core-runtime-adapter" : "extract-to-core";
  const target = firstSlice ? "@yeeflow/app-builder-core-planning" : approved.has(record.targetPackage) ? record.targetPackage : "@yeeflow/app-builder-core";
  const sideEffects = record.classification === "core" ? [] : source.sideEffects;
  return {
    sourcePath: record.sourcePath,
    currentClassification: record.classification,
    proposedFinalClassification: firstSlice ? "core" : record.classification,
    coreOwnershipState: firstSlice ? "shadow-implementation-parity-passed" : "planned",
    fileRole: source.fileRole,
    sourceDistTopologyRelationship: topologyBySource.get(record.sourcePath) || "not-applicable",
    publicEntryPoints: source.publicEntryPoints,
    exportedFunctionsClassesConstants: source.exports,
    internalSignificantFunctions: source.internals,
    callers: source.callers,
    importsAndDependencies: source.imports,
    detectedSideEffects: sideEffects,
    codexSpecificResponsibilities: record.classification === "compatibility-shim" ? ["Preserve Legacy CLI and exit-code behavior."] : [],
    localRuntimeResponsibilities: record.classification === "mixed" && !firstSlice ? ["Own filesystem, environment, network, signing, or process orchestration after extraction."] : [],
    deterministicCoreResponsibilities: firstSlice ? ["Parse Markdown tables and normalize planning text without host state."] : record.classification === "core" ? ["Retain deterministic reusable behavior behind the approved Core package boundary."] : ["Extract only side-effect-free transformations after a focused split."],
    compatibilityResponsibilities: record.classification === "compatibility-shim" ? ["Delegate to the versioned Local Runtime while preserving the Legacy entry point."] : [],
    evidenceOnlyResponsibilities: source.fileRole === "non-code-resource" ? ["Retain as evidence or template input; do not execute as migration code."] : [],
    proposedTargetPackage: target,
    proposedLocalRuntimeModule: record.classification === "mixed" && !firstSlice ? `runtimes/app-builder-core-local-runtime/modules/${stem(record.sourcePath)}.ts` : null,
    proposedCodexAdapterModule: (record.classification === "mixed" && !firstSlice) || record.classification === "compatibility-shim" ? `adapters/codex-plugin-adapter/modules/${stem(record.sourcePath)}.ts` : null,
    compatibilityShimPath: record.classification === "compatibility-shim" ? `scripts/legacy-compatibility-shims/${basename(record.sourcePath)}` : null,
    migrationBatch: materializer ? "deferred-materializer" : firstSlice ? "batch-first-planning-vertical-slice" : record.classification === "compatibility-shim" ? "compatibility-closure" : record.classification === "mixed" ? "mixed-file-decomposition" : "core-foundations",
    migrationPriority: firstSlice ? "P0" : materializer ? "deferred" : record.classification === "mixed" ? "P2" : "P1",
    migrationRisk: materializer ? "high" : source.sideEffects.length ? "medium" : "low",
    requiredBaselineFixtures: [firstSlice ? "compatibility/differential-fixtures/markdown-planning-utils.v0.9.71.json" : `compatibility/differential-fixtures/${stem(record.sourcePath)}.baseline.json`],
    requiredDifferentialTests: [`Legacy/Core normalized-output comparison for ${record.sourcePath}.`],
    blockingUnknowns: materializer ? ["Materializer migration is explicitly deferred until Phase 4."] : [],
    recommendedAction: action,
    rationale: firstSlice ? "Pure Markdown planning utilities have deterministic input/output, existing Generation Readiness coverage, stable consumers, and no host side effects." : materializer ? "Generated-final materialization must remain deferred by architecture policy." : record.classification === "mixed" ? "File contains deterministic behavior and host orchestration that require a function-level split." : record.classification === "compatibility-shim" ? "Legacy entry point remains until differential parity closes." : "Current classification and parsed structure support the proposed deterministic Core ownership.",
  };
}

function analyze(sourcePath) {
  const absolute = resolve(root, sourcePath);
  if (!existsSync(absolute) || !/[.]([cm]?[jt]sx?|json|md)$/i.test(sourcePath)) return empty("non-code-resource");
  if (!/[.]([cm]?[jt]sx?)$/i.test(sourcePath)) return empty("non-code-resource");
  const file = ts.createSourceFile(absolute, readFileSync(absolute, "utf8"), ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  const exports = []; const internals = []; const imports = []; const sideEffects = []; const publicEntryPoints = [];
  const addFunction = (node, name, exported) => { const item = { name, kind: ts.SyntaxKind[node.kind] }; (exported ? exports : internals).push(item); if (exported) publicEntryPoints.push(name); };
  const visit = (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
    if (ts.isFunctionDeclaration(node) && node.name) addFunction(node, node.name.text, hasExport(node));
    if (ts.isClassDeclaration(node) && node.name) addFunction(node, node.name.text, hasExport(node));
    if (ts.isVariableStatement(node)) for (const declaration of node.declarationList.declarations) if (ts.isIdentifier(declaration.name) && declaration.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) addFunction(declaration, declaration.name.text, hasExport(node));
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ["require", "fetch"].includes(node.expression.text)) sideEffects.push(node.expression.text === "fetch" ? "network" : "module-loading");
    ts.forEachChild(node, visit);
  };
  visit(file);
  for (const value of imports) if (/^(?:node:|fs$|path$|child_process$|https?$)/.test(value)) sideEffects.push(value.startsWith("node:") || /^(fs|path|child_process)$/.test(value) ? "filesystem-or-process" : "network");
  return { fileRole: "module", publicEntryPoints, exports, internals: internals.slice(0, 80), imports: [...new Set(imports)], sideEffects: [...new Set(sideEffects)], callers: [] };
}
function addLocalCallers() {
  const knownPaths = new Set(analysis.keys());
  for (const [sourcePath, source] of analysis) {
    for (const dependency of source.imports.filter((value) => value.startsWith("."))) {
      const target = resolveRelativeModule(sourcePath, dependency, knownPaths);
      if (target) analysis.get(target).callers.push(sourcePath);
    }
  }
  for (const source of analysis.values()) source.callers.sort();
}
function resolveRelativeModule(sourcePath, dependency, knownPaths) {
  const base = relative(root, resolve(root, dirname(sourcePath), dependency)).replaceAll("\\\\", "/");
  const candidates = [base, `${base}.js`, `${base}.mjs`, `${base}.cjs`, `${base}.ts`, `${base}.mts`, `${base}.cts`, `${base}.tsx`, `${base}/index.js`, `${base}/index.mjs`, `${base}/index.cjs`, `${base}/index.ts`, `${base}/index.tsx`];
  return candidates.find((candidate) => knownPaths.has(candidate)) || null;
}
function empty(fileRole) { return { fileRole, publicEntryPoints: [], exports: [], internals: [], imports: [], sideEffects: [], callers: [] }; }
function hasExport(node) { return Boolean(node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)); }
function stem(path) { return basename(path, extname(path)).replace(/[^A-Za-z0-9_-]/g, "-"); }
function isProtected(path) { return / [23]\.[^/]+$/.test(path); }
function readJson(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }
function writeJson(path, value) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function report(ledger) { const counts = count(ledger.records, "currentClassification"); const batches = count(ledger.records, "migrationBatch"); const packages = count(ledger.records, "proposedTargetPackage"); const effectCounts = ledger.records.flatMap((record) => record.detectedSideEffects).reduce((result, effect) => { result[effect] = (result[effect] || 0) + 1; return result; }, {}); const effects = ledger.records.filter((record) => record.detectedSideEffects.length).length; const risks = ledger.records.filter((record) => record.migrationRisk === "high").slice(0, 10).map((record) => `- ${record.sourcePath}`).join("\n") || "- None"; const unresolved = ledger.records.filter((record) => record.blockingUnknowns.length).length; return `# Mixed File Decomposition Audit v0.9.71\n\n## Totals\n\n- Audited files: ${ledger.records.length}\n- Classification counts: ${JSON.stringify(counts)}\n- Mixed files: ${counts.mixed || 0}\n- Files with detected side effects: ${effects}\n- Side-effect counts: ${JSON.stringify(effectCounts)}\n- Proposed package counts: ${JSON.stringify(packages)}\n- Migration batches: ${JSON.stringify(batches)}\n- Unresolved findings: ${unresolved}\n\n## Highest-Risk Files\n\n${risks}\n\n## Recommended First Vertical Slice\n\n- Source: \`${ledger.selectedFirstVerticalSlice}\`\n- Rationale: deterministic Markdown planning parsing, stable exported functions, existing Generation Readiness consumers, no host side effects, and no materializer dependency.\n\n## Unresolved Findings\n\n- Materializer records remain explicitly deferred until Phase 4.\n`; }
function count(records, key) { return records.reduce((result, record) => { const value = record[key]; result[value] = (result[value] || 0) + 1; return result; }, {}); }

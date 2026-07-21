#!/usr/bin/env node

import { builtinModules } from "node:module";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = resolve(repositoryRoot, optionValue("--root") || ".");
const graphPath = resolve(workspaceRoot, optionValue("--graph") || "compatibility/capability-manifests/app-builder-core-package-dependency-graph.v0.1.0.json");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs"]);
const nodeBuiltins = new Set([...builtinModules, ...builtinModules.map((name) => `node:${name}`)]);
const hostModules = /^(?:react(?:\/|$)|next(?:\/|$)|@prisma\/client(?:\/|$)|openai(?:\/|$)|ai(?:\/|$)|@ai-sdk(?:\/|$)|@openai(?:\/|$)|@codex(?:\/|$)|codex(?:\/|$)|simple-git(?:\/|$)|isomorphic-git(?:\/|$)|octokit(?:\/|$)|playwright(?:\/|$)|puppeteer(?:\/|$)|selenium(?:\/|$)|keytar(?:\/|$)|electron(?:\/|$))/u;
const prohibitedCoreVocabulary = /\b(?:codex|workbuddy|web|cloud|openai|grok|deepseek|oauth|browser|https?|queue|persistence|retries?|telemetry|provider|credentials?|api[-_ ]?keys?|sessions?|tenant|executioncontext|capabilityprofile|modelinvocationport)\b/iu;
const findings = [];

if (!existsSync(graphPath)) fail("DEPENDENCY_BOUNDARY_GRAPH_MISSING", "Dependency boundary graph is missing.");
const graph = JSON.parse(readFileSync(graphPath, "utf8"));
const packages = Array.isArray(graph.packages) ? graph.packages.map((item) => ({ ...item, root: resolve(workspaceRoot, item.directory) })) : [];
const packageByName = new Map(packages.map((item) => [item.name, item]));
const edges = new Map(packages.map((item) => [item.name, new Set()]));

for (const packageInfo of packages) validatePackage(packageInfo);
detectCycles();

if (findings.length > 0) {
  console.error(JSON.stringify({ status: "failed", findings }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: "passed", code: "DEPENDENCY_BOUNDARIES_VALID", packageCount: packages.length, sourceFileCount: packages.reduce((count, item) => count + sourceFiles(item.root).length, 0) }, null, 2));

function validatePackage(packageInfo) {
  const manifestPath = resolve(packageInfo.root, "package.json");
  if (!existsSync(manifestPath)) return add("DEPENDENCY_BOUNDARY_PACKAGE_MANIFEST_MISSING", packageInfo.directory, "Workspace package.json is missing.");
  if (isCore(packageInfo) && prohibitedCoreVocabulary.test((packageInfo.capabilities || []).join(" "))) add("DEPENDENCY_BOUNDARY_CORE_CAPABILITY_VOCABULARY_FORBIDDEN", packageInfo.name, "Core capability metadata cannot assign host, provider, transport, authentication, or execution-orchestration responsibility to Core.");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const declaredWorkspaceDependencies = new Set(Object.keys(manifest.dependencies || {}).filter((name) => packageByName.has(name)));
  const allowedDependencies = new Set(packageInfo.allowedDependencies || []);
  const expectedDependencies = [...allowedDependencies].sort();
  if (JSON.stringify([...declaredWorkspaceDependencies].sort()) !== JSON.stringify(expectedDependencies)) add("DEPENDENCY_BOUNDARY_PACKAGE_JSON_GRAPH_MISMATCH", packageInfo.name, "package.json workspace dependencies must match the approved dependency graph.");
  for (const sourcePath of sourceFiles(packageInfo.root)) inspectSource(packageInfo, sourcePath, declaredWorkspaceDependencies, allowedDependencies);
}

function inspectSource(packageInfo, sourcePath, declaredWorkspaceDependencies, allowedDependencies) {
  const text = readFileSync(sourcePath, "utf8");
  if (isCore(packageInfo) && prohibitedCoreVocabulary.test(text)) add("DEPENDENCY_BOUNDARY_CORE_EXECUTION_VOCABULARY_FORBIDDEN", sourcePath, "Core source cannot contain host, provider, transport, authentication, or execution-orchestration vocabulary.");
  const sourceFile = ts.createSourceFile(sourcePath, text, ts.ScriptTarget.ESNext, true, scriptKind(sourcePath));
  const inspectModule = (node, specifier, kind) => {
    if (!specifier || !ts.isStringLiteralLike(specifier)) return add("DEPENDENCY_BOUNDARY_NON_LITERAL_DYNAMIC_TARGET", sourcePath, `${kind} target must be a string literal.`);
    inspectSpecifier(packageInfo, sourcePath, specifier.text, declaredWorkspaceDependencies, allowedDependencies);
  };
  const visit = (node) => {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier) inspectModule(node, node.moduleSpecifier, "import");
    if (ts.isExportDeclaration(node) && node.moduleSpecifier) inspectModule(node, node.moduleSpecifier, "export-from");
    if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference) && node.moduleReference.expression) inspectModule(node, node.moduleReference.expression, "import-equals");
    if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) inspectModule(node, node.arguments[0], "dynamic import");
      if (ts.isIdentifier(node.expression) && node.expression.text === "require") inspectModule(node, node.arguments[0], "require");
      inspectHostSideEffectCall(packageInfo, sourcePath, node);
    }
    inspectProcessAccess(packageInfo, sourcePath, node);
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

function inspectSpecifier(packageInfo, sourcePath, specifier, declaredWorkspaceDependencies, allowedDependencies) {
  if (specifier.startsWith(".") || specifier.startsWith("/")) return inspectRelativeImport(packageInfo, sourcePath, specifier);
  const workspaceName = workspacePackageName(specifier);
  if (workspaceName) {
    const dependency = packageByName.get(workspaceName);
    if (!dependency) return add("DEPENDENCY_BOUNDARY_WORKSPACE_DEPENDENCY_UNKNOWN", sourcePath, "Workspace import does not resolve to an approved workspace package.", { specifier });
    if (specifier !== workspaceName) {
      add("DEPENDENCY_BOUNDARY_WORKSPACE_DEEP_IMPORT", sourcePath, "Workspace imports cannot target a deep package path.", { specifier });
      add("DEPENDENCY_BOUNDARY_PACKAGE_PUBLIC_ENTRYPOINT_BYPASS", sourcePath, "Workspace imports must use the package public entry point.", { specifier });
    }
    if (!declaredWorkspaceDependencies.has(workspaceName)) add("DEPENDENCY_BOUNDARY_WORKSPACE_DEPENDENCY_UNDECLARED", sourcePath, "Workspace import is not declared in package.json.", { specifier });
    if (!allowedDependencies.has(workspaceName)) add("DEPENDENCY_BOUNDARY_WORKSPACE_DEPENDENCY_NOT_ALLOWED", sourcePath, "Workspace import is not allowed by the approved dependency graph.", { specifier });
    if (isCore(packageInfo) && packageInfo.name !== "@yeeflow/app-builder-core-test-fixtures" && workspaceName === "@yeeflow/app-builder-core-test-fixtures") add("DEPENDENCY_BOUNDARY_PRODUCTION_TEST_FIXTURES_IMPORT", sourcePath, "Production Core packages cannot import test fixtures.", { specifier });
    if (packageInfo.name === "@yeeflow/app-builder-core-validators" && workspaceName === "@yeeflow/app-builder-core-builder") add("DEPENDENCY_BOUNDARY_VALIDATOR_BUILDER_IMPORT", sourcePath, "Validators cannot import builder implementation.", { specifier });
    if (packageInfo.name === "@yeeflow/app-builder-core-builder" && workspaceName === "@yeeflow/app-builder-core-materializer") add("DEPENDENCY_BOUNDARY_BUILDER_MATERIALIZER_IMPORT", sourcePath, "Builder cannot import materializer.", { specifier });
    if (packageInfo.name === "@yeeflow/app-builder-core-package-engine" && workspaceName === "@yeeflow/app-builder-core-runtime-client") add("DEPENDENCY_BOUNDARY_PACKAGE_ENGINE_TRANSPORT_IMPORT", sourcePath, "Package engine cannot import API transport implementation.", { specifier });
    if (isCore(packageInfo) && (isRuntime(dependency) || isAdapter(dependency) || isExecutionContracts(dependency))) add("DEPENDENCY_BOUNDARY_CORE_FORBIDDEN_ZONE_IMPORT", sourcePath, "Core packages cannot import execution contracts, runtimes, or adapters.", { specifier });
    if (isRuntime(packageInfo) && isAdapter(dependency)) add("DEPENDENCY_BOUNDARY_RUNTIME_ADAPTER_IMPORT", sourcePath, "Runtime packages cannot import adapters.", { specifier });
    if (isAdapter(packageInfo) && (isCore(dependency) || (isRuntime(dependency) && !isExecutionService(dependency)))) add("DEPENDENCY_BOUNDARY_ADAPTER_CORE_BYPASS", sourcePath, "Adapters must use the execution contracts and execution service instead of importing Core or another runtime directly.", { specifier });
    edges.get(packageInfo.name).add(workspaceName);
    return;
  }
  if (isCore(packageInfo) && nodeBuiltins.has(specifier)) return add("DEPENDENCY_BOUNDARY_CORE_NODE_BUILTIN_FORBIDDEN", sourcePath, "Core packages cannot import Node.js built-in modules.", { specifier });
  if (isCore(packageInfo) && hostModules.test(specifier)) return add("DEPENDENCY_BOUNDARY_CORE_FORBIDDEN_HOST_IMPORT", sourcePath, "Core packages cannot import host UI, OAuth, browser, Git, AI, or Codex modules.", { specifier });
  if (isCore(packageInfo)) add("DEPENDENCY_BOUNDARY_CORE_EXTERNAL_DEPENDENCY_FORBIDDEN", sourcePath, "Core packages cannot import external packages in the Phase 1 skeleton.", { specifier });
}

function inspectRelativeImport(packageInfo, sourcePath, specifier) {
  const target = resolve(dirname(sourcePath), specifier);
  const targetOwner = packages.find((item) => isWithin(target, item.root));
  if (targetOwner && targetOwner.name !== packageInfo.name) return add("DEPENDENCY_BOUNDARY_CROSS_PACKAGE_RELATIVE_IMPORT", sourcePath, "Relative imports cannot cross package roots.", { specifier });
  if (!isWithin(target, packageInfo.root)) return add("DEPENDENCY_BOUNDARY_RELATIVE_IMPORT_ESCAPE", sourcePath, "Relative import escapes the package root.", { specifier });
}

function inspectHostSideEffectCall(packageInfo, sourcePath, node) {
  if (!isCore(packageInfo)) return;
  if (ts.isIdentifier(node.expression) && ["fetch", "WebSocket", "XMLHttpRequest"].includes(node.expression.text)) add("DEPENDENCY_BOUNDARY_CORE_HOST_SIDE_EFFECT", sourcePath, "Core packages cannot perform network host side effects.", { operation: node.expression.text });
  if (ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.expression) && node.expression.expression.text === "process") add("DEPENDENCY_BOUNDARY_CORE_HOST_SIDE_EFFECT", sourcePath, "Core packages cannot perform process host side effects.", { operation: node.expression.name.text });
}

function inspectProcessAccess(packageInfo, sourcePath, node) {
  if (!isCore(packageInfo) || !ts.isPropertyAccessExpression(node)) return;
  if (ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.expression) && node.expression.expression.text === "process" && node.expression.name.text === "env") add("DEPENDENCY_BOUNDARY_CORE_HOST_SIDE_EFFECT", sourcePath, "Core packages cannot access process environment state.", { operation: "process.env" });
}

function detectCycles() {
  const visiting = new Set();
  const visited = new Set();
  const visit = (name, trail) => {
    if (visiting.has(name)) return add("DEPENDENCY_BOUNDARY_CYCLE", name, "Workspace dependency cycle detected.", { cycle: [...trail, name] });
    if (visited.has(name)) return;
    visiting.add(name);
    for (const dependency of edges.get(name) || []) visit(dependency, [...trail, name]);
    visiting.delete(name);
    visited.add(name);
  };
  for (const packageInfo of packages) visit(packageInfo.name, []);
}

function sourceFiles(packageRoot) {
  const sourceRoot = resolve(packageRoot, "src");
  if (!existsSync(sourceRoot)) return [];
  const paths = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (sourceExtensions.has(extname(entry.name))) paths.push(path);
    }
  };
  visit(sourceRoot);
  return paths;
}

function workspacePackageName(specifier) {
  if (!specifier.startsWith("@yeeflow/")) return null;
  const [scope, name] = specifier.split("/");
  return name ? `${scope}/${name}` : null;
}
function scriptKind(path) { return /\.(?:ts|mts|cts)$/u.test(path) ? ts.ScriptKind.TS : ts.ScriptKind.JS; }
function isCore(packageInfo) { return packageInfo.directory.startsWith("packages/") && packageInfo.name !== "@yeeflow/app-builder-execution-contracts"; }
function isExecutionContracts(packageInfo) { return packageInfo.name === "@yeeflow/app-builder-execution-contracts"; }
function isExecutionService(packageInfo) { return packageInfo.name === "@yeeflow/app-builder-execution-service"; }
function isRuntime(packageInfo) { return packageInfo.directory.startsWith("runtimes/"); }
function isAdapter(packageInfo) { return packageInfo.directory.startsWith("adapters/"); }
function isWithin(path, root) { const value = relative(root, path); return value === "" || (!value.startsWith("..") && !value.startsWith("/")); }
function add(code, path, message, detail = {}) { findings.push({ code, path: relative(workspaceRoot, path) || path, message, ...detail }); }
function optionValue(option) { const index = process.argv.indexOf(option); if (index === -1) return null; const value = process.argv[index + 1]; if (!value || value.startsWith("--")) fail("DEPENDENCY_BOUNDARY_ARGUMENT_VALUE_MISSING", `${option} requires a value.`); return value; }
function fail(code, message) { console.error(JSON.stringify({ status: "failed", findings: [{ code, message }] }, null, 2)); process.exit(1); }

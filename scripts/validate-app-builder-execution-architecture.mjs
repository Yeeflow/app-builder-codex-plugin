#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const graphPath = join(repositoryRoot, "compatibility/capability-manifests/app-builder-core-package-dependency-graph.v0.1.0.json");
const findings = [];

if (!existsSync(graphPath)) fail("EXECUTION_ARCHITECTURE_GRAPH_MISSING", graphPath);
const graph = JSON.parse(readFileSync(graphPath, "utf8"));
const packageByName = new Map((graph.packages || []).map((item) => [item.name, item]));
const requiredPackages = [
  "@yeeflow/app-builder-execution-contracts",
  "@yeeflow/app-builder-execution-service",
  "@yeeflow/codex-plugin-adapter",
  "@yeeflow/web-managed-provider-fake-adapter",
  "@yeeflow/host-extension-fixture-adapter",
];

if (graph.graphVersion !== "0.2.0") add("EXECUTION_ARCHITECTURE_GRAPH_VERSION_INVALID", graphPath);
for (const name of requiredPackages) if (!packageByName.has(name)) add("EXECUTION_ARCHITECTURE_PACKAGE_MISSING", name);

const corePackages = (graph.packages || []).filter((item) => item.directory.startsWith("packages/app-builder-core"));
for (const packageInfo of corePackages) {
  if (/\b(?:Codex|WorkBuddy|OpenAI|Grok|DeepSeek|OAuth|transport|provider|credentials?|api[-_ ]?keys?|sessions?|telemetry|queues?|persistence|retries?)\b/iu.test((packageInfo.capabilities || []).join(" "))) {
    add("EXECUTION_ARCHITECTURE_CORE_CAPABILITY_VOCABULARY_FORBIDDEN", packageInfo.name);
  }
  for (const dependency of packageInfo.allowedDependencies || []) {
    if (dependency.includes("execution") || dependency.includes("adapter") || dependency.includes("local-runtime")) {
      add("EXECUTION_ARCHITECTURE_CORE_DEPENDENCY_FORBIDDEN", `${packageInfo.name} -> ${dependency}`);
    }
  }
  for (const sourcePath of sourceFiles(join(repositoryRoot, packageInfo.directory, "src"))) {
    const source = readFileSync(sourcePath, "utf8");
    if (/@yeeflow\/app-builder-execution|runtimes\/app-builder-execution-service|adapters\//u.test(source)) {
      add("EXECUTION_ARCHITECTURE_CORE_IMPORT_FORBIDDEN", sourcePath);
    }
    if (/\b(?:Codex|WorkBuddy|OpenAI|Grok|DeepSeek|OAuth|ExecutionContext|CapabilityProfile|ModelInvocationPort|modelProfileRef|credentials?|api[-_ ]?keys?|sessions?|telemetry|queues?|persistence|retries?)\b/iu.test(source)) {
      add("EXECUTION_ARCHITECTURE_CORE_VOCABULARY_FORBIDDEN", sourcePath);
    }
  }
}

assertExactDependencies("@yeeflow/app-builder-execution-contracts", []);
assertExactDependencies("@yeeflow/app-builder-execution-service", [
  "@yeeflow/app-builder-core",
  "@yeeflow/app-builder-core-contracts",
  "@yeeflow/app-builder-execution-contracts",
]);
for (const adapterName of requiredPackages.slice(2)) {
  assertExactDependencies(adapterName, [
    "@yeeflow/app-builder-execution-contracts",
    "@yeeflow/app-builder-execution-service",
  ]);
  const adapter = packageByName.get(adapterName);
  if (!adapter) continue;
  for (const sourcePath of sourceFiles(join(repositoryRoot, adapter.directory, "src"))) {
    const source = readFileSync(sourcePath, "utf8");
    if (/@yeeflow\/app-builder-core(?:["'/]|$)/u.test(source)) add("EXECUTION_ARCHITECTURE_ADAPTER_CORE_BYPASS", sourcePath);
  }
}

const service = packageByName.get("@yeeflow/app-builder-execution-service");
if (service) {
  const serviceSourcePath = join(repositoryRoot, service.directory, "src/index.ts");
  const serviceSource = readFileSync(serviceSourcePath, "utf8");
  if (/@yeeflow\/(?:codex|web-managed|host-extension).*adapter/u.test(serviceSource)) add("EXECUTION_ARCHITECTURE_SERVICE_ADAPTER_IMPORT_FORBIDDEN", serviceSourcePath);
  assertIsolatedMapping(serviceSource, serviceSourcePath, "function toCanonicalIntent", "function toExecutionOutput", "EXECUTION_ARCHITECTURE_CORE_INPUT_LEAKAGE_RISK");
  assertIsolatedMapping(serviceSource, serviceSourcePath, "function toExecutionOutput", "function validDescriptor", "EXECUTION_ARCHITECTURE_CORE_OUTPUT_LEAKAGE_RISK");
}

if (findings.length > 0) {
  console.error(JSON.stringify({ status: "failed", findings }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "passed",
  code: "APP_BUILDER_EXECUTION_ARCHITECTURE_VALID",
  graphVersion: graph.graphVersion,
  corePackageCount: corePackages.length,
  adapterCount: 3,
}, null, 2));

function assertExactDependencies(name, expected) {
  const packageInfo = packageByName.get(name);
  if (!packageInfo) return;
  const actual = [...(packageInfo.allowedDependencies || [])].sort();
  if (JSON.stringify(actual) !== JSON.stringify([...expected].sort())) add("EXECUTION_ARCHITECTURE_DEPENDENCY_SET_INVALID", name, { expected, actual });
}

function assertIsolatedMapping(source, sourcePath, startMarker, endMarker, code) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) return add("EXECUTION_ARCHITECTURE_MAPPING_MISSING", sourcePath, { startMarker, endMarker });
  const mapping = source.slice(start, end);
  if (/\b(?:context|modelProfileRef|origin|authority|capabilities|credentials?|provider|profile|secret|token)\b/iu.test(mapping)) add(code, sourcePath);
}

function sourceFiles(root) {
  if (!existsSync(root)) return [];
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const outputPath = join(root, entry.name);
    if (entry.isDirectory()) files.push(...sourceFiles(outputPath));
    else if ([".ts", ".tsx", ".mts", ".cts"].includes(extname(entry.name)) && !/\s[23]\.[^.]+$/u.test(entry.name)) files.push(outputPath);
  }
  return files;
}

function add(code, target, details = undefined) {
  findings.push({ code, target, ...(details === undefined ? {} : { details }) });
}

function fail(code, target) {
  console.error(JSON.stringify({ status: "failed", findings: [{ code, target }] }, null, 2));
  process.exit(1);
}

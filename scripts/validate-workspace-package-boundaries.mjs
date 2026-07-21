#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const graphPath = resolve(repositoryRoot, "compatibility/capability-manifests/app-builder-core-package-dependency-graph.v0.1.0.json");
const findings = [];

if (!existsSync(graphPath)) fail("WORKSPACE_BOUNDARY_GRAPH_MISSING", "Package dependency graph is missing.");
const graph = JSON.parse(readFileSync(graphPath, "utf8"));
const packages = Array.isArray(graph.packages) ? graph.packages : [];
const names = new Set(packages.map((item) => item.name));
const directories = new Set(packages.map((item) => item.directory));

for (const workspaceDirectory of discoverWorkspaceDirectories()) {
  if (!directories.has(workspaceDirectory)) findings.push(finding("WORKSPACE_BOUNDARY_PACKAGE_UNREGISTERED", workspaceDirectory, "Every workspace package must appear in the approved dependency graph."));
}

for (const item of packages) {
  const packagePath = resolve(repositoryRoot, item.directory, "package.json");
  const tsconfigPath = resolve(repositoryRoot, item.directory, "tsconfig.json");
  const sourcePath = resolve(repositoryRoot, item.directory, "src/index.ts");
  if (!existsSync(packagePath) || !existsSync(tsconfigPath) || !existsSync(sourcePath)) {
    findings.push(finding("WORKSPACE_BOUNDARY_PACKAGE_SKELETON_MISSING", item.directory, "Workspace package must contain package.json, tsconfig.json, and src/index.ts."));
    continue;
  }
  const manifest = JSON.parse(readFileSync(packagePath, "utf8"));
  if (manifest.name !== item.name) findings.push(finding("WORKSPACE_BOUNDARY_PACKAGE_NAME_MISMATCH", item.directory, "Workspace package name does not match the dependency graph."));
  const dependencies = manifest.dependencies || {};
  const actualDependencies = Object.keys(dependencies).sort();
  const expectedDependencies = [...item.allowedDependencies].sort();
  if (JSON.stringify(actualDependencies) !== JSON.stringify(expectedDependencies)) findings.push(finding("WORKSPACE_BOUNDARY_DEPENDENCY_GRAPH_MISMATCH", item.name, "Workspace package dependencies do not match the approved graph."));
  for (const dependency of actualDependencies) {
    if (!names.has(dependency) || dependencies[dependency] !== "workspace:*") findings.push(finding("WORKSPACE_BOUNDARY_DEPENDENCY_INVALID", item.name, "Workspace package dependency must be an approved workspace dependency."));
  }
  const source = readFileSync(sourcePath, "utf8");
  if (!source.includes("export const capabilityMetadata")) findings.push(finding("WORKSPACE_BOUNDARY_METADATA_EXPORT_MISSING", item.name, "Phase 1 package source must expose capability metadata."));
  if (/from\s+["'](?:react|next|@prisma\/client|openai)["']/u.test(source)) findings.push(finding("WORKSPACE_BOUNDARY_FORBIDDEN_HOST_IMPORT", item.name, "Phase 1 Core workspace skeleton cannot import host UI, Prisma, or AI SDK modules."));
}

if (findings.length > 0) {
  console.error(JSON.stringify({ status: "failed", findings }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: "passed", code: "WORKSPACE_PACKAGE_BOUNDARIES_VALID", packageCount: packages.length }, null, 2));

function finding(code, path, message) {
  return { code, path, message };
}

function fail(code, message) {
  console.error(JSON.stringify({ status: "failed", findings: [{ code, message }] }, null, 2));
  process.exit(1);
}

function discoverWorkspaceDirectories() {
  const directories = [];
  for (const zone of ["packages", "runtimes", "adapters"]) {
    const zoneRoot = resolve(repositoryRoot, zone);
    if (!existsSync(zoneRoot)) continue;
    for (const entry of readdirSync(zoneRoot, { withFileTypes: true })) {
      if (entry.isDirectory() && existsSync(resolve(zoneRoot, entry.name, "package.json"))) directories.push(`${zone}/${entry.name}`);
    }
  }
  return directories.sort();
}

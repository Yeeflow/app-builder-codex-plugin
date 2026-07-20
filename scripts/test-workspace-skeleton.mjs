#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const graphPath = resolve(repositoryRoot, "compatibility/capability-manifests/app-builder-core-package-dependency-graph.v0.1.0.json");
const graph = JSON.parse(readFileSync(graphPath, "utf8"));
const packages = graph.packages || [];

if (packages.length !== 17) throw new Error(`Expected 17 approved workspace packages, received ${packages.length}.`);
for (const item of packages) {
  const sourcePath = resolve(repositoryRoot, item.directory, "src/index.ts");
  if (!existsSync(sourcePath)) throw new Error(`Missing package source: ${item.directory}`);
  const source = readFileSync(sourcePath, "utf8");
  if (!source.includes(`packageName: "${item.name}"`) || !source.includes("export const capabilityMetadata")) throw new Error(`Package metadata export is invalid: ${item.name}`);
}
console.log("WORKSPACE_SKELETON_TESTS_PASSED 17");

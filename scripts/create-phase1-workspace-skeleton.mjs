#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packages = [
  ["packages/app-builder-core-contracts", "@yeeflow/app-builder-core-contracts", "Versioned contracts and structured error metadata.", []],
  ["packages/app-builder-core-canonical-model", "@yeeflow/app-builder-core-canonical-model", "Canonical application and resource model metadata.", ["@yeeflow/app-builder-core-contracts"]],
  ["packages/app-builder-core-planning", "@yeeflow/app-builder-core-planning", "Planning parser and projection capability metadata.", ["@yeeflow/app-builder-core-contracts", "@yeeflow/app-builder-core-canonical-model"]],
  ["packages/app-builder-core-templates", "@yeeflow/app-builder-core-templates", "Immutable template registry capability metadata.", ["@yeeflow/app-builder-core-contracts", "@yeeflow/app-builder-core-canonical-model"]],
  ["packages/app-builder-core-validators", "@yeeflow/app-builder-core-validators", "Deterministic validation capability metadata.", ["@yeeflow/app-builder-core-contracts", "@yeeflow/app-builder-core-canonical-model", "@yeeflow/app-builder-core-templates"]],
  ["packages/app-builder-core-materializer", "@yeeflow/app-builder-core-materializer", "Materialization capability metadata without implementation migration.", ["@yeeflow/app-builder-core-contracts", "@yeeflow/app-builder-core-canonical-model", "@yeeflow/app-builder-core-templates"]],
  ["packages/app-builder-core-package-engine", "@yeeflow/app-builder-core-package-engine", "Package encode and decode capability metadata.", ["@yeeflow/app-builder-core-contracts", "@yeeflow/app-builder-core-canonical-model", "@yeeflow/app-builder-core-validators"]],
  ["packages/app-builder-core-repair-engine", "@yeeflow/app-builder-core-repair-engine", "Deterministic repair capability metadata.", ["@yeeflow/app-builder-core-contracts", "@yeeflow/app-builder-core-canonical-model", "@yeeflow/app-builder-core-validators", "@yeeflow/app-builder-core-package-engine"]],
  ["packages/app-builder-core-runtime-client", "@yeeflow/app-builder-core-runtime-client", "Typed runtime operation capability metadata.", ["@yeeflow/app-builder-core-contracts"]],
  ["packages/app-builder-core", "@yeeflow/app-builder-core", "Public Core facade capability metadata.", ["@yeeflow/app-builder-core-contracts", "@yeeflow/app-builder-core-canonical-model", "@yeeflow/app-builder-core-planning", "@yeeflow/app-builder-core-templates", "@yeeflow/app-builder-core-validators", "@yeeflow/app-builder-core-materializer", "@yeeflow/app-builder-core-package-engine", "@yeeflow/app-builder-core-repair-engine", "@yeeflow/app-builder-core-runtime-client"]],
  ["runtimes/app-builder-core-local-runtime", "@yeeflow/app-builder-core-local-runtime", "Local Runtime capability metadata.", ["@yeeflow/app-builder-core", "@yeeflow/app-builder-core-runtime-client"]],
  ["adapters/codex-plugin-adapter", "@yeeflow/codex-plugin-adapter", "Codex Plugin Adapter capability metadata.", ["@yeeflow/app-builder-core-local-runtime"]],
];

for (const [directory, name, capability, dependencies] of packages) {
  const absoluteDirectory = resolve(repositoryRoot, directory);
  const sourceDirectory = resolve(absoluteDirectory, "src");
  mkdirSync(sourceDirectory, { recursive: true });
  const references = dependencies.map((dependency) => dependencyPath(directory, dependency));
  writeJson(resolve(absoluteDirectory, "package.json"), {
    name,
    version: "0.1.0",
    private: true,
    type: "module",
    exports: { ".": { types: "./lib/index.d.ts", default: "./lib/index.js" } },
    scripts: { typecheck: "tsc -p tsconfig.json --noEmit" },
    dependencies: Object.fromEntries(dependencies.map((dependency) => [dependency, "workspace:*"])),
  });
  writeJson(resolve(absoluteDirectory, "tsconfig.json"), {
    extends: "../../tsconfig.base.json",
    compilerOptions: { rootDir: "./src", outDir: "./lib", tsBuildInfoFile: "./lib/.tsbuildinfo" },
    include: ["src/**/*.ts"],
    references: references.map((reference) => ({ path: reference })),
  });
  writeFileSync(resolve(sourceDirectory, "index.ts"), `export const capabilityMetadata = {\n  packageName: "${name}",\n  version: "0.1.0",\n  capabilities: ["${capability}"],\n} as const;\n`, "utf8");
}

writeJson(resolve(repositoryRoot, "compatibility/capability-manifests/app-builder-core-package-dependency-graph.v0.1.0.json"), {
  schemaVersion: "1.0.0",
  graphVersion: "0.1.0",
  packages: packages.map(([directory, name, capability, dependencies]) => ({ directory, name, capabilities: [capability], allowedDependencies: dependencies })),
});
console.log(`PHASE1_WORKSPACE_SKELETON_WRITTEN ${packages.length}`);

function dependencyPath(fromDirectory, name) {
  const targetDirectory = name === "@yeeflow/app-builder-core-local-runtime" ? "runtimes/app-builder-core-local-runtime" : name === "@yeeflow/codex-plugin-adapter" ? "adapters/codex-plugin-adapter" : `packages/${name.replace("@yeeflow/", "")}`;
  return relative(resolve(repositoryRoot, fromDirectory), resolve(repositoryRoot, targetDirectory));
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const temporaryRoot = join(repositoryRoot, ".dependency-boundary-test-temp");
const validator = join(repositoryRoot, "scripts/validate-dependency-boundaries.mjs");

rmSync(temporaryRoot, { recursive: true, force: true });
try {
  expectPass("Valid module syntax and approved zones pass", (fixture) => {
    fixture.write("packages/core-a/src/index.ts", 'import "@yeeflow/core-b"; import type { capability } from "@yeeflow/core-b"; export { capability } from "@yeeflow/core-b"; void import("@yeeflow/core-b"); require("@yeeflow/core-b");');
    fixture.write("runtimes/local/src/index.ts", 'import "node:fs"; import "@yeeflow/core-a";');
    fixture.write("adapters/adapter/src/index.ts", 'import "@yeeflow/app-builder-core-local-runtime";');
  });
  expectCode("Core to Runtime fails", "DEPENDENCY_BOUNDARY_CORE_FORBIDDEN_ZONE_IMPORT", (fixture) => fixture.write("packages/core-a/src/index.ts", 'import "@yeeflow/app-builder-core-local-runtime";'));
  expectCode("Core to Adapter fails", "DEPENDENCY_BOUNDARY_CORE_FORBIDDEN_ZONE_IMPORT", (fixture) => fixture.write("packages/core-a/src/index.ts", 'import "@yeeflow/codex-plugin-adapter";'));
  expectCode("Undeclared workspace dependency fails", "DEPENDENCY_BOUNDARY_WORKSPACE_DEPENDENCY_UNDECLARED", (fixture) => { fixture.manifest("@yeeflow/core-a", []); fixture.write("packages/core-a/src/index.ts", 'import "@yeeflow/core-b";'); });
  expectCode("Cross-package relative import fails", "DEPENDENCY_BOUNDARY_CROSS_PACKAGE_RELATIVE_IMPORT", (fixture) => fixture.write("packages/core-a/src/index.ts", 'import "../../core-b/src/index";'));
  expectCode("Package root escape fails", "DEPENDENCY_BOUNDARY_RELATIVE_IMPORT_ESCAPE", (fixture) => fixture.write("packages/core-a/src/index.ts", 'import "../../../outside";'));
  expectCode("Deep workspace import fails", "DEPENDENCY_BOUNDARY_WORKSPACE_DEEP_IMPORT", (fixture) => fixture.write("packages/core-a/src/index.ts", 'import "@yeeflow/core-b/internal";'));
  expectCode("Dependency cycle fails", "DEPENDENCY_BOUNDARY_CYCLE", (fixture) => { fixture.allow("@yeeflow/core-b", "@yeeflow/core-a"); fixture.write("packages/core-a/src/index.ts", 'import "@yeeflow/core-b";'); fixture.write("packages/core-b/src/index.ts", 'import "@yeeflow/core-a";'); });
  expectCode("Core host imports fail", "DEPENDENCY_BOUNDARY_CORE_FORBIDDEN_HOST_IMPORT", (fixture) => fixture.write("packages/core-a/src/index.ts", 'import "react"; import "next"; import "@prisma/client"; import "openai";'));
  expectCodes("Core Node and host side effects fail", ["DEPENDENCY_BOUNDARY_CORE_NODE_BUILTIN_FORBIDDEN", "DEPENDENCY_BOUNDARY_CORE_HOST_SIDE_EFFECT"], (fixture) => fixture.write("packages/core-a/src/index.ts", 'import "node:fs"; const value = process.env.VALUE; fetch("https://example.test");'));
  expectCode("Non-literal dynamic and require fail", "DEPENDENCY_BOUNDARY_NON_LITERAL_DYNAMIC_TARGET", (fixture) => fixture.write("packages/core-a/src/index.ts", 'const target = "@yeeflow/core-b"; import(target); require(target);'));
  console.log("DEPENDENCY_BOUNDARY_TESTS_PASSED 11");
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

function expectPass(label, mutate) {
  const fixture = createFixture();
  mutate(fixture);
  const result = run(fixture);
  if (result.status !== 0) throw new Error(`${label}: ${result.output}`);
}

function expectCode(label, code, mutate) {
  const fixture = createFixture();
  mutate(fixture);
  const result = run(fixture);
  if (result.status === 0 || !result.output.includes(code)) throw new Error(`${label} did not report ${code}: ${result.output}`);
}

function expectCodes(label, codes, mutate) {
  const fixture = createFixture();
  mutate(fixture);
  const result = run(fixture);
  if (result.status === 0 || codes.some((code) => !result.output.includes(code))) throw new Error(`${label} did not report all expected codes: ${result.output}`);
}

function createFixture() {
  const root = join(temporaryRoot, `case-${Math.random().toString(16).slice(2)}`);
  const packages = [
    ["packages/core-a", "@yeeflow/core-a", ["@yeeflow/core-b"]],
    ["packages/core-b", "@yeeflow/core-b", []],
    ["runtimes/local", "@yeeflow/app-builder-core-local-runtime", ["@yeeflow/core-a"]],
    ["adapters/adapter", "@yeeflow/codex-plugin-adapter", ["@yeeflow/app-builder-core-local-runtime"]],
  ];
  const graph = { schemaVersion: "1.0.0", packages: packages.map(([directory, name, allowedDependencies]) => ({ directory, name, allowedDependencies })) };
  for (const [directory, name, dependencies] of packages) {
    mkdirSync(join(root, directory, "src"), { recursive: true });
    writeFileSync(join(root, directory, "package.json"), JSON.stringify({ name, dependencies: Object.fromEntries(dependencies.map((dependency) => [dependency, "workspace:*"])) }), "utf8");
    writeFileSync(join(root, directory, "src/index.ts"), "export const capability = true;\n", "utf8");
  }
  writeFileSync(join(root, "graph.json"), JSON.stringify(graph), "utf8");
  const packageInfo = () => graph.packages;
  return {
    root,
    write(path, source) { const output = join(root, path); mkdirSync(resolve(output, ".."), { recursive: true }); writeFileSync(output, `${source}\n`, "utf8"); },
    manifest(name, dependencies) { const item = packageInfo().find((entry) => entry.name === name); writeFileSync(join(root, item.directory, "package.json"), JSON.stringify({ name, dependencies: Object.fromEntries(dependencies.map((dependency) => [dependency, "workspace:*"])) }), "utf8"); },
    allow(name, dependency) { const item = packageInfo().find((entry) => entry.name === name); item.allowedDependencies.push(dependency); this.manifest(name, item.allowedDependencies); writeFileSync(join(root, "graph.json"), JSON.stringify(graph), "utf8"); },
  };
}

function run(fixture) {
  try {
    const output = execFileSync(process.execPath, [validator, "--root", fixture.root, "--graph", "graph.json"], { cwd: repositoryRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { status: 0, output };
  } catch (error) {
    return { status: error.status ?? 1, output: `${error.stdout || ""}${error.stderr || ""}` };
  }
}

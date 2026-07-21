#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

const architecture = run("scripts/validate-app-builder-execution-architecture.mjs");
const dependencyRegressions = run("scripts/test-dependency-boundaries.mjs");
const runtimeIsolation = run("scripts/test-app-builder-execution-service.mjs");

assertMarker(architecture, "APP_BUILDER_EXECUTION_ARCHITECTURE_VALID");
assertMarker(dependencyRegressions, "DEPENDENCY_BOUNDARY_TESTS_PASSED 16");
assertMarker(runtimeIsolation, "APP_BUILDER_EXECUTION_MODEL_RESULT_LEAKAGE_REJECTED coreInvocations=0");
assertMarker(runtimeIsolation, "APP_BUILDER_EXECUTION_CORE_INPUT_OUTPUT_ISOLATION_PASSED");

console.log("APP_BUILDER_EXECUTION_ARCHITECTURE_GATES_PASSED static=1 dependencyNegatives=16 leakageNegatives=2");

function run(path) {
  return execFileSync(process.execPath, [resolve(repositoryRoot, path)], {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function assertMarker(output, marker) {
  if (!output.includes(marker)) throw new Error(`EXECUTION_ARCHITECTURE_EXPECTED_MARKER_MISSING:${marker}`);
}

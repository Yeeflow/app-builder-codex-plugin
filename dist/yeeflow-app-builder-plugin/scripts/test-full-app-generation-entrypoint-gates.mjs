#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts/inspect-full-app-generation-entrypoints.mjs");
const REGISTRY = path.join(ROOT, "docs/reference/full-app-generation-entrypoints.json");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "full-app-entrypoints-"));
const results = [];

try {
  expectPass("registered full-app skill entrypoints pass", ["--registry", REGISTRY, "--root", ROOT]);
  const bundledRoot = createBundledPluginRoot();
  expectPass("installed plugin bundled skill layout passes", ["--registry", REGISTRY, "--root", bundledRoot]);

  const missingInputs = mutateRegistry("missing-inputs.json", (registry) => {
    registry.entrypoints[0].inputs = ["yeeflow-app-plan.md"];
  });
  expectCode("full-app entrypoint requires Functional Spec and App Plan inputs", ["--registry", missingInputs, "--root", ROOT], "FULL_APP_GENERATOR_ENTRYPOINT_INPUT_CONTRACT_INVALID");

  const misclassifiedDelivery = mutateRegistry("misclassified-delivery.json", (registry) => {
    registry.entrypoints = [{
      id: "script:delivery-workflow",
      kind: "skill-orchestrated-full-app-generator",
      path: "scripts/yeeflow-application-delivery-workflow.mjs",
      inputs: ["functional-specification.md", "yeeflow-app-plan.md"],
      supportedOutputs: ["generated-final .yapk"],
      requiredPlanningGates: ["validate-functional-specification.mjs", "validate-app-plan-template.mjs"],
      requiredGeneratedFinalGates: ["validate-yapk-package.js", "yapk-first-generation-preflight.mjs"],
    }];
  });
  expectCode("delivery workflow helper must not be classified as full-app generator", ["--registry", misclassifiedDelivery, "--root", ROOT], "FULL_APP_GENERATOR_ENTRYPOINT_MISCLASSIFIED_HELPER");

  const missingOutput = mutateRegistry("missing-output.json", (registry) => {
    registry.entrypoints[0].supportedOutputs = ["validation reports"];
  });
  expectCode("full-app entrypoint requires generated-final yapk output contract", ["--registry", missingOutput, "--root", ROOT], "FULL_APP_GENERATOR_ENTRYPOINT_OUTPUT_CONTRACT_INVALID");

  console.log(JSON.stringify({ status: "pass", cases: results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function expectPass(name, args) {
  const result = run(args);
  assert.equal(result.status, 0, `${name} should pass\nstdout=${result.stdout}\nstderr=${result.stderr}`);
  results.push(name);
}

function expectCode(name, args, code) {
  const result = run(args);
  assert.notEqual(result.status, 0, `${name} should fail`);
  assert.match(`${result.stdout}\n${result.stderr}`, new RegExp(code), `${name} should include ${code}`);
  results.push(name);
}

function run(args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: ROOT, encoding: "utf8" });
}

function mutateRegistry(name, mutate) {
  const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  mutate(registry);
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, JSON.stringify(registry, null, 2));
  return file;
}

function createBundledPluginRoot() {
  const root = path.join(tempDir, "bundled-plugin-root");
  for (const file of [
    "skills/yeeflow-application-builder/SKILL.md",
    "skills/yeeflow-application-generator/SKILL.md",
    "scripts/yeeflow-application-delivery-workflow.mjs",
    "scripts/yeeflow-package-api-automation.mjs",
    "generate-vendor-onboarding-yapk-schema-v2.mjs",
  ]) {
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, "# test fixture\n");
  }
  return root;
}

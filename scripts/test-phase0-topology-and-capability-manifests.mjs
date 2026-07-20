#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const temporaryDirectory = join(repositoryRoot, ".phase0-topology-test-temp");
const capabilityManifestPath = "compatibility/capability-manifests/yeeflow-app-builder-capability-classification.v0.9.71.json";
const topologyContractPath = "compatibility/plugin-baselines/yeeflow-app-builder-source-dist-topology.v0.9.71.json";

rmSync(temporaryDirectory, { recursive: true, force: true });
mkdirSync(temporaryDirectory, { recursive: true });

try {
  expectPass("Capability manifest passes", "scripts/validate-capability-classification-manifest.mjs", []);
  expectPass("Topology contract passes", "scripts/validate-source-dist-topology.mjs", []);

  const capabilityManifest = readJson(capabilityManifestPath);
  const coreRecord = capabilityManifest.records.find((record) => record.classification === "core");
  coreRecord.sideEffects = ["codex"];
  writeJson("invalid-core-host-side-effect.json", capabilityManifest);
  expectCode("Core host side effect fails", "scripts/validate-capability-classification-manifest.mjs", "CAPABILITY_MANIFEST_CORE_HOST_SIDE_EFFECT", ["--manifest", temporary("invalid-core-host-side-effect.json")]);

  const invalidDistributionManifest = readJson(capabilityManifestPath);
  invalidDistributionManifest.records.find((record) => record.classification === "generated-distribution").sourcePath = "scripts/invalid-distribution.mjs";
  writeJson("invalid-distribution-path.json", invalidDistributionManifest);
  expectCode("Generated distribution outside dist fails", "scripts/validate-capability-classification-manifest.mjs", "CAPABILITY_MANIFEST_GENERATED_DISTRIBUTION_PATH_INVALID", ["--manifest", temporary("invalid-distribution-path.json")]);

  const invalidMixedManifest = readJson(capabilityManifestPath);
  invalidMixedManifest.records.find((record) => record.classification === "mixed").sideEffects = [];
  writeJson("invalid-mixed-split-target.json", invalidMixedManifest);
  expectCode("Mixed record without side effects fails", "scripts/validate-capability-classification-manifest.mjs", "CAPABILITY_MANIFEST_MIXED_SPLIT_TARGET_MISSING", ["--manifest", temporary("invalid-mixed-split-target.json")]);

  const invalidCompatibilityManifest = readJson(capabilityManifestPath);
  invalidCompatibilityManifest.records.find((record) => record.classification === "compatibility-shim").targetPackage = "@yeeflow/app-builder-core";
  writeJson("invalid-compatibility-owner.json", invalidCompatibilityManifest);
  expectCode("Compatibility shim without adapter owner fails", "scripts/validate-capability-classification-manifest.mjs", "CAPABILITY_MANIFEST_COMPATIBILITY_OWNER_INVALID", ["--manifest", temporary("invalid-compatibility-owner.json")]);

  const invalidTargetManifest = readJson(capabilityManifestPath);
  invalidTargetManifest.records.find((record) => record.targetPackage).targetPackage = "@yeeflow/unapproved-package";
  writeJson("invalid-target-package.json", invalidTargetManifest);
  expectCode("Unapproved target package fails", "scripts/validate-capability-classification-manifest.mjs", "CAPABILITY_MANIFEST_TARGET_PACKAGE_INVALID", ["--manifest", temporary("invalid-target-package.json")]);

  const invalidTopology = readJson(topologyContractPath);
  invalidTopology.records.find((record) => record.relationship === "exact mirror").sourceDigest = "0".repeat(64);
  writeJson("invalid-topology-digest.json", invalidTopology);
  expectCode("Exact mirror digest drift fails", "scripts/validate-source-dist-topology.mjs", "SOURCE_DIST_TOPOLOGY_DIGEST_CHANGED", ["--contract", temporary("invalid-topology-digest.json")]);

  const unknownTopology = readJson(topologyContractPath);
  unknownTopology.records.find((record) => record.relationship === "transformed mirror").relationship = "unexpected drift";
  writeJson("unknown-topology-relationship.json", unknownTopology);
  expectCode("Unknown topology relationship fails", "scripts/validate-source-dist-topology.mjs", "SOURCE_DIST_TOPOLOGY_UNRESOLVED", ["--contract", temporary("unknown-topology-relationship.json")]);

  console.log("PHASE0_TOPOLOGY_AND_CAPABILITY_TESTS_PASSED 9");
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

function readJson(path) {
  return JSON.parse(readFileSync(join(repositoryRoot, path), "utf8"));
}

function writeJson(filename, value) {
  writeFileSync(join(temporaryDirectory, filename), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function temporary(filename) {
  return `.phase0-topology-test-temp/${filename}`;
}

function expectPass(label, script, argumentsList) {
  const result = run(script, argumentsList);
  if (result.status !== 0) throw new Error(`${label} failed: ${result.output}`);
}

function expectCode(label, script, code, argumentsList) {
  const result = run(script, argumentsList);
  if (result.status === 0 || !result.output.includes(code)) throw new Error(`${label} did not report ${code}: ${result.output}`);
}

function run(script, argumentsList) {
  try {
    const output = execFileSync(process.execPath, [join(repositoryRoot, script), ...argumentsList], { cwd: repositoryRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { status: 0, output };
  } catch (error) {
    return { status: error.status ?? 1, output: `${error.stdout || ""}${error.stderr || ""}` };
  }
}

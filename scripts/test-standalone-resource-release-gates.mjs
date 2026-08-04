#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nestedDist = resolve(root, "dist/yeeflow-app-builder-plugin");
const surfaces = existsSync(nestedDist) ? [root, nestedDist] : [root];

const parityFiles = [
  "build-ycs.js",
  "validate-ycs.js",
  "build-scheduled-ywf-wrapper.js",
  "validate-scheduled-ywf.js",
  "build-ai-resource-wrapper.js",
  "validate-ai-resource-wrapper.js",
  "build-yaia-wrapper.js",
  "validate-yaia.js",
  "build-yaic-wrapper.js",
  "validate-yaic.js",
  "finalize-ai-resource-from-official-response.js",
  "finalize-yaia-from-official-response.js",
  "finalize-yaic-from-official-response.js",
  "scripts/generate-scheduled-ywf-from-plan.mjs",
  "scripts/lib/standalone-artifact-utils.cjs",
  "scripts/test-ycs-wrapper-gates.mjs",
  "scripts/test-scheduled-ywf-wrapper-gates.mjs",
  "scripts/test-ai-resource-wrapper-gates.mjs",
  "scripts/test-skill-relative-reference-gates.mjs",
  "scripts/test-standalone-resource-release-gates.mjs",
  "docs/releases/yeeflow-app-builder-v1.2.0-standalone-resource-acceptance.json",
  "docs/releases/yeeflow-app-builder-v1.2.0.md"
];

if (surfaces.length === 2) {
  for (const relative of parityFiles) {
    assert.deepEqual(
      readFileSync(resolve(root, relative)),
      readFileSync(resolve(nestedDist, relative)),
      `source/dist mirror drift: ${relative}`,
    );
  }
}

for (const surface of surfaces) {
  for (const script of [
    "scripts/test-skill-relative-reference-gates.mjs",
    "scripts/test-ycs-wrapper-gates.mjs",
    "scripts/test-scheduled-ywf-wrapper-gates.mjs",
    "scripts/test-ai-resource-wrapper-gates.mjs",
  ]) {
    execFileSync(process.execPath, [resolve(surface, script)], {
      cwd: surface,
      encoding: "utf8",
      stdio: "pipe",
      maxBuffer: 16 * 1024 * 1024,
    });
  }
}

const acceptance = JSON.parse(readFileSync(resolve(root, "docs/releases/yeeflow-app-builder-v1.2.0-standalone-resource-acceptance.json"), "utf8"));
assert.equal(acceptance.candidateVersion, "1.2.0");
assert.equal(acceptance.evidenceAuthority, "user-confirmed-manual-validation");
assert.deepEqual(
  Object.values(acceptance.resources).map((resource) => resource.runtimeExecution),
  ["not-tested", "not-tested", "not-tested", "not-tested"],
);
assert.equal(acceptance.resources.customService.artifactOrigin, "plugin-generated");
assert.equal(acceptance.resources.scheduledWorkflow.artifactOrigin, "plugin-generated-fixture-identity");
assert.equal(acceptance.resources.aiAgent.artifactOrigin, "official-export-baseline");
assert.equal(acceptance.resources.copilot.artifactOrigin, "official-export-baseline");
assert.match(acceptance.resources.aiAgent.independentGeneration, /^not-supported/);
assert.match(acceptance.resources.copilot.independentGeneration, /^not-supported/);
assert.equal(acceptance.releaseBoundary.manualAcceptanceIsRuntimeExecutionProof, false);
assert.equal(acceptance.releaseBoundary.manualAcceptanceIsRcMarketplaceInstallProof, false);
assert.equal(acceptance.releaseBoundary.rawExportFilesIncluded, false);

console.log(JSON.stringify({
  status: "pass",
  marker: "STANDALONE_RESOURCE_RELEASE_GATES_PASSED",
  surfaces: surfaces.length,
  focusedCases: 29,
  resourceTypes: 4,
}, null, 2));

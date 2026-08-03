#!/usr/bin/env node

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageManifest = readJson("package.json");
const pluginManifestPath = "dist/yeeflow-app-builder-plugin/.codex-plugin/plugin.json";
const pluginManifest = readJson(pluginManifestPath);

if (!/^\d+\.\d+\.\d+$/u.test(packageManifest.version || "")) {
  throw new Error("PLUGIN_PATCH_RELEASE_VERSION_INVALID");
}

pluginManifest.version = packageManifest.version;
writeFileSync(resolve(root, pluginManifestPath), `${JSON.stringify(pluginManifest, null, 2)}\n`);

const mirrors = [
  "README.md",
  "CHANGELOG.md",
  "build-ydp-wrapper.js",
  "validate-ydp.js",
  "scripts/lib/standalone-ydp-codec.cjs",
  "scripts/lib/standalone-dashboard-resource-gates.mjs",
  "scripts/validate-dashboard-page-layout-template.mjs",
  "scripts/validate-dashboard-grid-table-collections.mjs",
  "scripts/validate-dashboard-generation-hard-gates.mjs",
  "scripts/validate-page-scope-template-dependencies.mjs",
  "scripts/test-ydp-wrapper-gates.mjs",
  "scripts/test-dashboard-v11-validator-alignment-gates.mjs",
  "scripts/test-fixtures/core-standalone-dashboard-body.br.base64",
  "scripts/validate-approval-workflow-publish-readiness.mjs",
  "scripts/test-approval-workflow-unicode-node-name-regressions.mjs",
  "scripts/test-approval-form-multi-field-immutable-projection.mjs",
  "scripts/materialize-full-app-generated-final.mjs",
  "scripts/validate-approval-form-fields-template.mjs",
  "scripts/test-release-1.0.3-clean-room-contracts.mjs",
  "scripts/test-fixtures/release-1.0.3-clean-room-plan.mjs",
  "scripts/test-full-app-materialization-entrypoint-gates.mjs",
  "docs/standards/app-plan-standard-template.md",
  "docs/app-plan-standard-template.md",
  "docs/README.md",
  "docs/releases/yeeflow-app-builder-v1.1.0.md",
  "docs/reference/full-app-generation-entrypoints.json",
  "scripts/validate-pre-id-allocation-readiness.mjs",
  "scripts/test-pre-id-allocation-readiness-gates.mjs",
  "scripts/lib/yeeflow-yapk-signing.mjs",
  "scripts/yeeflow-yapk-sign.mjs",
  "scripts/test-yeeflow-yapk-signing-distribution.mjs",
  "docs/yapk-generation-guardrails.md",
].map((sourcePath) => [sourcePath, sourcePath]);

mirrors.push(
  ["scripts/build-ydp-wrapper.js", "scripts/build-ydp-wrapper.js"],
  ["scripts/validate-ydp.js", "scripts/validate-ydp.js"],
  ["skills/installed/yeeflow-dashboard-generator/scripts/build-ydp-wrapper.js", "skills/yeeflow-dashboard-generator/scripts/build-ydp-wrapper.js"],
  ["skills/installed/yeeflow-dashboard-generator/scripts/validate-ydp.js", "skills/yeeflow-dashboard-generator/scripts/validate-ydp.js"],
  ["skills/installed/yeeflow-dashboard-generator/scripts/build-ydp-wrapper.js", "skills/installed/yeeflow-dashboard-generator/scripts/build-ydp-wrapper.js"],
  ["skills/installed/yeeflow-dashboard-generator/scripts/validate-ydp.js", "skills/installed/yeeflow-dashboard-generator/scripts/validate-ydp.js"],
  ["skills/installed/yeeflow-application-generator/scripts/build-ydp-wrapper.js", "skills/yeeflow-application-generator/scripts/build-ydp-wrapper.js"],
  ["skills/installed/yeeflow-application-generator/scripts/validate-ydp.js", "skills/yeeflow-application-generator/scripts/validate-ydp.js"],
  ["skills/installed/yeeflow-application-generator/scripts/build-ydp-wrapper.js", "skills/installed/yeeflow-application-generator/scripts/build-ydp-wrapper.js"],
  ["skills/installed/yeeflow-application-generator/scripts/validate-ydp.js", "skills/installed/yeeflow-application-generator/scripts/validate-ydp.js"],
  ["skills/installed/yeeflow-application-builder/SKILL.md", "skills/yeeflow-application-builder/SKILL.md"],
  ["skills/installed/yeeflow-application-generator/SKILL.md", "skills/yeeflow-application-generator/SKILL.md"],
  ["skills/installed/yeeflow-dashboard-generator/SKILL.md", "skills/yeeflow-dashboard-generator/SKILL.md"],
  ["generated-skills/yeeflow-api-operator/SKILL.md", "skills/yeeflow-api-operator/SKILL.md"],
  ["skills/installed/yeeflow-package-validator/SKILL.md", "skills/yeeflow-package-validator/SKILL.md"],
  ["skills/installed/yeeflow-yapk-package-generator/SKILL.md", "skills/yeeflow-yapk-package-generator/SKILL.md"],
);

for (const [sourcePath, destinationPath] of mirrors) {
  const destination = resolve(root, "dist/yeeflow-app-builder-plugin", destinationPath);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(resolve(root, sourcePath), destination);
}

console.log(`PLUGIN_PATCH_RELEASE_PREPARED version=${packageManifest.version} mirroredFiles=${mirrors.length}`);

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(root, relativePath), "utf8"));
}

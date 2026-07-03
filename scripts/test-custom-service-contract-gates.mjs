#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pluginRootMode } from "./lib/plugin-root-layout.mjs";

const ROOT = process.cwd();
const ROOT_MODE = pluginRootMode(ROOT);
const SKILL_ROOT =
  ROOT_MODE === "installed-cache-root"
    ? "skills/yeeflow-custom-service-generator"
    : "skills/installed/yeeflow-custom-service-generator";

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function assertExists(relativePath) {
  assert.equal(fs.existsSync(path.join(ROOT, relativePath)), true, `${relativePath} exists`);
}

function assertIncludes(relativePath, needle) {
  assert.ok(read(relativePath).includes(needle), `${relativePath} includes ${needle}`);
}

const requiredFiles = [
  "docs/standards/custom-service-nodejs22-runtime-standard.md",
  "docs/reference/custom-service-ycs-examples.normalized.json",
  "docs/training/custom-service-nodejs22-ycs-training-report.md",
  `${SKILL_ROOT}/SKILL.md`,
];

for (const file of requiredFiles) assertExists(file);

assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "Custom Service");
assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "Node.js 22");
assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "main({ connections, params, modules }");
assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "DraftConfig");
assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "modules.yeeSDKClient");
assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "no `require");
assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "SSRF");

assertIncludes(`${SKILL_ROOT}/SKILL.md`, "yeeflow-custom-service-generator");
assertIncludes(`${SKILL_ROOT}/SKILL.md`, "main({ connections, params, modules }");
assertIncludes(`${SKILL_ROOT}/SKILL.md`, "Do not generate `render");
assertIncludes(`${SKILL_ROOT}/SKILL.md`, "Do not generate `execute");
assertIncludes(`${SKILL_ROOT}/SKILL.md`, "DraftConfig");
assertIncludes(`${SKILL_ROOT}/SKILL.md`, "connections[connectionId]");

const normalized = JSON.parse(read("docs/reference/custom-service-ycs-examples.normalized.json"));
assert.equal(normalized.proofBoundary, "export-proven-normalized-summary");
assert.equal(Array.isArray(normalized.examples), true);
assert.equal(normalized.examples.length, 2);
assert.deepEqual(
  normalized.examples.map((example) => example.name).sort(),
  ["Insert Excel Data to Data List", "Sub List to HTML Table"].sort(),
);

function inspectCustomService({ draftCode, draftConfig }) {
  const issues = [];
  let parsedConfig = null;

  if (!/\bexport\s+async\s+function\s+main\b|\bexport\s+function\s+main\b|\basync\s+function\s+main\b|\bfunction\s+main\b/.test(draftCode)) {
    issues.push("CUSTOM_SERVICE_MAIN_MISSING");
  }
  if (/\brender\s*\(/.test(draftCode)) issues.push("CUSTOM_SERVICE_RENDER_ENTRYPOINT_INVALID");
  if (/\bexecute\s*\(/.test(draftCode)) issues.push("CUSTOM_SERVICE_EXECUTE_ENTRYPOINT_INVALID");
  if (/\brequire\s*\(/.test(draftCode)) issues.push("CUSTOM_SERVICE_NODE_REQUIRE_FORBIDDEN");
  if (/\bimport\s+.*\s+from\s+['\"](?:fs|path|crypto|os|child_process|http|https)['\"]/.test(draftCode)) {
    issues.push("CUSTOM_SERVICE_NODE_IMPORT_FORBIDDEN");
  }
  if (/\bprocess\b|\bglobal\b|\b__dirname\b|\b__filename\b/.test(draftCode)) {
    issues.push("CUSTOM_SERVICE_NODE_GLOBAL_FORBIDDEN");
  }
  if (/\bsetTimeout\s*\(|\bsetInterval\s*\(/.test(draftCode)) {
    issues.push("CUSTOM_SERVICE_TIMER_FORBIDDEN");
  }
  if (/localhost|127\.0\.0\.1|169\.254\.169\.254|\.local\b|\.internal\b|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+/.test(draftCode)) {
    issues.push("CUSTOM_SERVICE_SSRF_TARGET_FORBIDDEN");
  }
  if (/api[_-]?key|bearer\s+[a-z0-9._-]{10,}|password\s*[:=]|client[_-]?secret/i.test(draftCode)) {
    issues.push("CUSTOM_SERVICE_CREDENTIAL_LITERAL_FORBIDDEN");
  }

  try {
    parsedConfig = typeof draftConfig === "string" ? JSON.parse(draftConfig) : null;
  } catch {
    issues.push("CUSTOM_SERVICE_DRAFTCONFIG_INVALID_JSON_STRING");
  }

  if (!parsedConfig) {
    if (!issues.includes("CUSTOM_SERVICE_DRAFTCONFIG_INVALID_JSON_STRING")) {
      issues.push("CUSTOM_SERVICE_DRAFTCONFIG_NOT_JSON_STRING");
    }
  } else {
    for (const key of ["params", "connections", "outputs"]) {
      if (!Array.isArray(parsedConfig[key])) issues.push(`CUSTOM_SERVICE_DRAFTCONFIG_${key.toUpperCase()}_MISSING`);
    }
  }

  return { issues, parsedConfig };
}

const validService = inspectCustomService({
  draftCode: `export async function main({ connections, params, modules }: ServiceContext) { return { total: 1 }; }`,
  draftConfig: JSON.stringify({ params: [], connections: [], outputs: [{ id: "total", type: "number" }] }),
});
assert.deepEqual(validService.issues, []);

const missingMain = inspectCustomService({
  draftCode: `export async function execute(context) { return {}; }`,
  draftConfig: JSON.stringify({ params: [], connections: [], outputs: [] }),
});
assert.ok(missingMain.issues.includes("CUSTOM_SERVICE_MAIN_MISSING"));
assert.ok(missingMain.issues.includes("CUSTOM_SERVICE_EXECUTE_ENTRYPOINT_INVALID"));

const nodeBuiltin = inspectCustomService({
  draftCode: `export async function main() { const fs = require('fs'); return {}; }`,
  draftConfig: JSON.stringify({ params: [], connections: [], outputs: [] }),
});
assert.ok(nodeBuiltin.issues.includes("CUSTOM_SERVICE_NODE_REQUIRE_FORBIDDEN"));

const invalidConfig = inspectCustomService({
  draftCode: `export async function main() { return {}; }`,
  draftConfig: { params: [], connections: [], outputs: [] },
});
assert.ok(invalidConfig.issues.includes("CUSTOM_SERVICE_DRAFTCONFIG_NOT_JSON_STRING"));

const ssrf = inspectCustomService({
  draftCode: `export async function main({ modules }) { await modules.fetch('http://127.0.0.1/admin'); return {}; }`,
  draftConfig: JSON.stringify({ params: [], connections: [], outputs: [] }),
});
assert.ok(ssrf.issues.includes("CUSTOM_SERVICE_SSRF_TARGET_FORBIDDEN"));

console.log(
  JSON.stringify(
    {
      ok: true,
      gate: "custom-service-contract",
      rootMode: ROOT_MODE,
      checkedFiles: requiredFiles.length,
      checkedExamples: normalized.examples.length,
    },
    null,
    2,
  ),
);


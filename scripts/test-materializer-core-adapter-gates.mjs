#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const adapterSource = resolve(root, "scripts/lib/materializer-core-adapter.mjs");
const validArtifact = resolve(root, "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-materializer-core-adapter-gates-"));
const cases = [
  { id: "artifact-missing", code: "MATERIALIZER_CORE_ADAPTER_ARTIFACT_MISSING" },
  { id: "artifact-load-failed", code: "MATERIALIZER_CORE_ADAPTER_ARTIFACT_LOAD_FAILED", artifactText: "export const broken = ;\n" },
  { id: "required-export-missing", code: "MATERIALIZER_CORE_ADAPTER_EXPORT_MISSING", artifactText: "export const normalizeHexColor = () => \"\";\nexport const defaultValueForFieldType = () => \"\";\nexport const escapeRegExp = () => \"\";\nexport const normalizeForLooseFormMatch = () => \"\";\nexport const stripPlanningDocumentSuffix = () => \"\";\nexport const dependencyName = () => \"\";\nexport const safeDependencyIdentifier = () => \"\";\nexport const projectDataListScalarField = () => ({ projection: null, findings: [] });\nexport const capabilityMetadata = {};\n" },
  { id: "forbidden-resolution", code: "MATERIALIZER_CORE_ADAPTER_FORBIDDEN_RESOLUTION", artifactText: readFileSync(validArtifact, "utf8"), adapterTransform: (text) => text.replace("resolve(directory, `../../core/${artifactFileName}`)", "resolve(directory, `../../node_modules/${artifactFileName}`)") },
];

try {
  for (const testCase of cases) runCase(testCase);
  console.log(`MATERIALIZER_CORE_ADAPTER_GATE_REGRESSIONS_PASSED cases=${cases.length}`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

function runCase(testCase) {
  const fixture = resolve(temporary, testCase.id);
  const adapter = resolve(fixture, "scripts/lib/materializer-core-adapter.mjs");
  mkdirSync(dirname(adapter), { recursive: true });
  let text = readFileSync(adapterSource, "utf8");
  if (testCase.adapterTransform) text = testCase.adapterTransform(text);
  writeFileSync(adapter, text, "utf8");
  if (testCase.artifactText !== undefined) {
    const artifactDirectory = testCase.id === "forbidden-resolution"
      ? resolve(fixture, "node_modules")
      : resolve(fixture, "core");
    mkdirSync(artifactDirectory, { recursive: true });
    writeFileSync(resolve(artifactDirectory, "yeeflow-app-builder-core-materializer.v0.1.0.mjs"), testCase.artifactText, "utf8");
  }
  const result = spawnSync(process.execPath, ["--input-type=module", "--eval", `import(${JSON.stringify(pathToFileURL(adapter).href)})`], { encoding: "utf8" });
  assert.notEqual(result.status, 0, `${testCase.id} must fail.`);
  assert.match(`${result.stdout}\n${result.stderr}`, new RegExp(testCase.code), `${testCase.id} must emit ${testCase.code}.`);
}

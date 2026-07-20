#!/usr/bin/env node

import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist/yeeflow-app-builder-plugin");
const historicalZip = resolve(root, "dist/yeeflow-app-builder-plugin-0.9.71.zip");
const historicalChecksum = createHash("sha256").update(readFileSync(historicalZip)).digest("hex");
const publicApi = JSON.parse(readFileSync(resolve(root, "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json"), "utf8"));
const normalizeHexCorpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/materializer-normalize-hex-color.v0.1.0.json"), "utf8"));
const defaultValueCorpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/materializer-default-value-for-field-type.v0.1.0.json"), "utf8"));
const escapeRegExpCorpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/materializer-escape-regexp.v0.1.0.json"), "utf8"));
const looseFormMatchCorpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/materializer-normalize-loose-form-match.v0.1.0.json"), "utf8"));
const stripPlanningSuffixCorpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/materializer-strip-planning-document-suffix.v0.1.0.json"), "utf8"));
const dependencyNameCorpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/materializer-dependency-name.v0.1.0.json"), "utf8"));
const safeDependencyIdentifierCorpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/materializer-safe-dependency-identifier.v0.1.0.json"), "utf8"));
const scalarProjectionCorpus = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/data-list-scalar-field-projection.v0.1.0.json"), "utf8"));
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-materializer-core-distribution-"));

try {
  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
  await verify(resolve(dist, "core"));
  console.log("MATERIALIZER_CORE_DISTRIBUTION_VALID");
  console.log("MATERIALIZER_CORE_ARTIFACT_SOURCE_PARITY_PASSED");

  const proofZip = resolve(temporary, "proof.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", proofZip], { cwd: root, stdio: "inherit" });
  const archiveRoot = resolve(temporary, "archive");
  mkdirSync(archiveRoot, { recursive: true });
  execFileSync("unzip", ["-q", proofZip, "-d", archiveRoot]);
  await verify(resolve(archiveRoot, "yeeflow-app-builder-plugin/core"));
  console.log("MATERIALIZER_CORE_ARTIFACT_ARCHIVE_PARITY_PASSED");

  const installed = resolve(temporary, "installed/yeeflow-app-builder-plugin");
  cpSync(dist, installed, { recursive: true });
  await verify(resolve(installed, "core"));
  console.log("MATERIALIZER_CORE_ARTIFACT_INSTALLED_PARITY_PASSED");

  if (createHash("sha256").update(readFileSync(historicalZip)).digest("hex") !== historicalChecksum) throw new Error("Historical ZIP changed");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

async function verify(coreDirectory) {
  execFileSync(process.execPath, [resolve(root, "scripts/validate-core-distribution.mjs"), coreDirectory], { cwd: root, stdio: "inherit" });
  const manifest = JSON.parse(readFileSync(resolve(coreDirectory, "yeeflow-app-builder-core-distribution.v0.1.0.json"), "utf8"));
  const artifact = manifest.artifacts.find((item) => item.packageName === "@yeeflow/app-builder-core-materializer");
  if (!artifact) throw new Error("MATERIALIZER_CORE_DISTRIBUTION_ARTIFACT_MISSING");
  const module = await import(pathToFileURL(resolve(coreDirectory, artifact.path.split("/").at(-1))).href);
  for (const name of publicApi.runtimeExports) {
    if (!(name in module)) throw new Error(`MATERIALIZER_CORE_DISTRIBUTION_EXPORT_UNRESOLVED ${name}`);
  }
  if (typeof module.capabilityMetadata !== "object" || typeof module.normalizeHexColor !== "function" || typeof module.defaultValueForFieldType !== "function" || typeof module.escapeRegExp !== "function" || typeof module.normalizeForLooseFormMatch !== "function" || typeof module.stripPlanningDocumentSuffix !== "function" || typeof module.dependencyName !== "function" || typeof module.safeDependencyIdentifier !== "function" || typeof module.projectDataListScalarField !== "function") {
    throw new Error("MATERIALIZER_CORE_DISTRIBUTION_EXPORT_UNRESOLVED");
  }
  verifyCorpus(module.normalizeHexColor, normalizeHexCorpus);
  verifyCorpus(module.defaultValueForFieldType, defaultValueCorpus);
  verifyCorpus(module.escapeRegExp, escapeRegExpCorpus);
  verifyCorpus(module.normalizeForLooseFormMatch, looseFormMatchCorpus);
  verifyCorpus(module.stripPlanningDocumentSuffix, stripPlanningSuffixCorpus);
  verifyCorpus(module.dependencyName, dependencyNameCorpus);
  verifyArgumentsCorpus(module.safeDependencyIdentifier, safeDependencyIdentifierCorpus);
  verifyScalarProjectionCorpus(module.projectDataListScalarField, scalarProjectionCorpus);
}

function verifyScalarProjectionCorpus(functionUnderTest, corpus) {
  for (const fixture of corpus.cases) {
    const input = structuredClone(fixture.input);
    const before = JSON.stringify(input);
    const result = invokeScalarProjection(functionUnderTest, input);
    if (fixture.outcome === "throws") {
      if (!result.thrown?.message?.startsWith(fixture.errorCode)) throw new Error(`MATERIALIZER_CORE_DISTRIBUTION_PARITY_MISMATCH ${fixture.id}`);
    } else if (fixture.outcome === "deferred") {
      if (result.thrown || result.value?.projection !== null || JSON.stringify(result.value?.findings?.map((finding) => finding.code)) !== JSON.stringify([fixture.findingCode])) throw new Error(`MATERIALIZER_CORE_DISTRIBUTION_PARITY_MISMATCH ${fixture.id}`);
    } else if (result.thrown || !result.value?.projection || result.value.findings.length !== 0) {
      throw new Error(`MATERIALIZER_CORE_DISTRIBUTION_PARITY_MISMATCH ${fixture.id}`);
    }
    if (JSON.stringify(input) !== before || (result.value && !isFrozenProjectionResult(result.value))) throw new Error(`MATERIALIZER_CORE_DISTRIBUTION_MUTATION ${fixture.id}`);
  }
}

function invokeScalarProjection(functionUnderTest, input) {
  try { return { value: functionUnderTest(input), thrown: null }; }
  catch (error) { return { value: undefined, thrown: { name: error?.name || "Error", message: error?.message || String(error) } }; }
}

function isFrozenProjectionResult(value) {
  return Object.isFrozen(value) && Object.isFrozen(value.findings) && (!value.projection || Object.isFrozen(value.projection));
}

function verifyArgumentsCorpus(functionUnderTest, corpus) {
  for (const fixture of corpus.cases) {
    const argumentsList = structuredClone(fixture.arguments);
    const before = JSON.stringify(argumentsList);
    const result = invokeArguments(functionUnderTest, argumentsList);
    const expected = { value: fixture.expectedThrown ? undefined : fixture.expectedReturn, returnType: fixture.expectedReturnType, thrown: fixture.expectedThrown };
    if (JSON.stringify(result) !== JSON.stringify(expected)) throw new Error(`MATERIALIZER_CORE_DISTRIBUTION_PARITY_MISMATCH ${fixture.id}`);
    if (JSON.stringify(argumentsList) !== before) throw new Error(`MATERIALIZER_CORE_DISTRIBUTION_MUTATION ${fixture.id}`);
  }
}

function verifyCorpus(functionUnderTest, corpus) {
  for (const fixture of corpus.cases) {
    const input = fixture.invokeWithoutArgument ? undefined : structuredClone(fixture.input);
    const before = JSON.stringify(input);
    const result = invoke(functionUnderTest, fixture, input);
    const expected = { value: fixture.expectedReturn, returnType: fixture.expectedReturnType, thrown: fixture.expectedThrown };
    if (JSON.stringify(result) !== JSON.stringify(expected)) throw new Error(`MATERIALIZER_CORE_DISTRIBUTION_PARITY_MISMATCH ${fixture.id}`);
    if (JSON.stringify(input) !== before) throw new Error(`MATERIALIZER_CORE_DISTRIBUTION_MUTATION ${fixture.id}`);
  }
}

function invoke(functionUnderTest, fixture, input) {
  try {
    const value = fixture.invokeWithoutArgument ? functionUnderTest() : functionUnderTest(input);
    return { value, returnType: typeof value, thrown: null };
  } catch (error) {
    return { value: undefined, returnType: "undefined", thrown: { name: error?.name || "Error", message: error?.message || String(error) } };
  }
}

function invokeArguments(functionUnderTest, argumentsList) {
  try {
    const value = functionUnderTest(...argumentsList);
    return { value, returnType: typeof value, thrown: null };
  } catch (error) {
    return { value: undefined, returnType: "undefined", thrown: { name: error?.name || "Error", message: error?.message || String(error) } };
  }
}

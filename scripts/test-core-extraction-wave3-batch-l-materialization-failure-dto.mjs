#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-wave3-batch-l-"));
const fixture = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/core-extraction-wave3-batch-l-materialization-failure-dto.v0.1.0.json"), "utf8"));

try {
  const source = await verifySurface(root, "source");
  const sourceSecond = await verifySurface(root, "source-second");
  assert.deepEqual(source, sourceSecond, "CORE_EXTRACTION_WAVE3_BATCH_L_NONDETERMINISM");
  const rollback = await materializeFailure(createRollbackSurface(resolve(temporary, "rollback")));
  assert.deepEqual(source.materializer, rollback, "CORE_EXTRACTION_WAVE3_BATCH_L_LEGACY_ROLLBACK_DIFFERENTIAL");
  const archiveZip = resolve(temporary, "official-proof.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", archiveZip], { cwd: root, stdio: "pipe" });
  const archiveDirectory = resolve(temporary, "archive"); mkdirSync(archiveDirectory); execFileSync("unzip", ["-q", archiveZip, "-d", archiveDirectory]);
  const archive = await verifySurface(resolve(archiveDirectory, "yeeflow-app-builder-plugin"), "archive");
  assert.deepEqual(archive, source, "CORE_EXTRACTION_WAVE3_BATCH_L_ARCHIVE_DIFFERENTIAL");
  const installedRoot = resolve(temporary, "installed/yeeflow-app-builder-plugin"); cpSync(resolve(root, "dist/yeeflow-app-builder-plugin"), installedRoot, { recursive: true });
  const installed = await verifySurface(installedRoot, "installed");
  assert.deepEqual(installed, source, "CORE_EXTRACTION_WAVE3_BATCH_L_INSTALLED_DIFFERENTIAL");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_L_FAILURE_DTO_ROUTING_PASSED");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_L_SOURCE_ARCHIVE_INSTALLED_MATERIALIZER_PARITY_PASSED cases=3");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_L_SERIALIZATION_IMMUTABILITY_DETERMINISM_PASSED");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_L_SCOPE_AND_LEAKAGE_GATES_PASSED");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_L_LEGACY_ROLLBACK_PASSED");
} finally { rmSync(temporary, { recursive: true, force: true }); }

async function verifySurface(surface, label) {
  const core = await import(moduleUrl(corePath(surface)));
  assert.equal(typeof core.projectApplicationPlanStaticFoundation, "function", `CORE_EXTRACTION_WAVE3_BATCH_L_FACADE_MISSING:${label}`);
  const projected = fixture.cases.map((entry) => {
    const input = structuredClone(entry.input); const before = structuredClone(input);
    const result = core.projectApplicationPlanStaticFoundation(input);
    assert.deepEqual(input, before, `CORE_EXTRACTION_WAVE3_BATCH_L_INPUT_MUTATION:${label}:${entry.id}`);
    assert(frozenDeep(result), `CORE_EXTRACTION_WAVE3_BATCH_L_RESULT_NOT_FROZEN:${label}:${entry.id}`);
    assert.deepEqual(JSON.parse(JSON.stringify(result)), result, `CORE_EXTRACTION_WAVE3_BATCH_L_SERIALIZATION:${label}:${entry.id}`);
    assert.deepEqual(result.value, entry.expected, `CORE_EXTRACTION_WAVE3_BATCH_L_DTO_PARITY:${label}:${entry.id}`);
    return result;
  });
  assert.throws(() => core.projectApplicationPlanStaticFoundation({ kind: "materialization-failure-dto", value: { findings: [() => {}], context: {} } }), /APPLICATION_PLAN_STATIC_FAILURE_DTO_UNSAFE/);
  assert.throws(() => core.projectApplicationPlanStaticFoundation({ kind: "materialization-failure-dto", value: { findings: [], context: { createdAt: new Date() } } }), /APPLICATION_PLAN_STATIC_FAILURE_DTO_UNSAFE/);
  const coreText = readFileSync(corePath(surface), "utf8");
  for (const forbidden of ["node:fs", "node:path", "node:crypto", "WeakMap", "fetch(", "process."]) assert(!coreText.includes(forbidden), `CORE_EXTRACTION_WAVE3_BATCH_L_FORBIDDEN_CORE_DEPENDENCY:${label}:${forbidden}`);
  return { projected, materializer: await materializeFailure(surface) };
}

async function materializeFailure(surface) {
  const work = resolve(temporary, "materializer-failure"); mkdirSync(work, { recursive: true });
  const materializer = await import(moduleUrl(resolve(surface, "scripts/materialize-full-app-generated-final.mjs")));
  const report = materializer.materializeFullAppGeneratedFinal({ cwd: work, functionalSpec: "missing-specification.md", appPlan: "missing-plan.md", outDir: resolve(work, "generated-final"), allowFixtureApiIdsForTests: true });
  assert.equal(report.status, "fail", "CORE_EXTRACTION_WAVE3_BATCH_L_MATERIALIZER_FAILURE_STATUS");
  assert.equal(report.findings.length, 2, "CORE_EXTRACTION_WAVE3_BATCH_L_MATERIALIZER_FAILURE_FINDINGS");
  return JSON.parse(JSON.stringify(report));
}

function createRollbackSurface(target) {
  cpSync(resolve(root, "scripts"), resolve(target, "scripts"), { recursive: true }); cpSync(resolve(root, "docs/reference"), resolve(target, "docs/reference"), { recursive: true }); cpSync(resolve(root, "dist/yeeflow-app-builder-plugin/core"), resolve(target, "core"), { recursive: true });
  const file = resolve(target, "scripts/materialize-full-app-generated-final.mjs"); let source = readFileSync(file, "utf8");
  source = source.replace('return JSON.parse(JSON.stringify(coreProjectApplicationPlanStaticFoundation({ kind: "materialization-failure-dto", value: { findings, context } }).value));', 'return { status: "fail", ...context, findings };');
  assert(!source.includes('kind: "materialization-failure-dto"'), "CORE_EXTRACTION_WAVE3_BATCH_L_ROLLBACK_BRIDGE_RETAINED"); writeFileSync(file, source); return target;
}

function corePath(surface) { return surface === root ? resolve(root, "packages/app-builder-core-planning/lib/index.js") : resolve(surface, "core/yeeflow-app-builder-core-planning.v0.1.0.mjs"); }
function frozenDeep(value) { return !value || typeof value !== "object" || Object.isFrozen(value) && Object.values(value).every(frozenDeep); }
function moduleUrl(path) { return `${pathToFileURL(path).href}?wave3l=${Date.now()}-${Math.random()}`; }

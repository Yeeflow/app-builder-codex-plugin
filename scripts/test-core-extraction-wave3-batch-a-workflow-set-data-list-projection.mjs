#!/usr/bin/env node
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-core-wave3a-"));
const corpus = json("compatibility/differential-fixtures/core-extraction-wave3-batch-a-workflow-set-data-list-projection.v0.1.0.json");
const legacy = await import(moduleUrl(resolve(root, "compatibility/differential-fixtures/core-extraction-wave3-batch-a-workflow-set-data-list-projection-legacy-baseline.v0.1.0.mjs")));

try {
  const first = await verifySurface(root, "source-1");
  const second = await verifySurface(root, "source-2");
  assert.deepEqual(first, second, "CORE_EXTRACTION_WAVE3_BATCH_A_NONDETERMINISM");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_A_SOURCE_PARITY_PASSED");

  const zip = resolve(temporary, "wave3-batch-a-proof.zip");
  const archive = resolve(temporary, "archive");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", zip], { cwd: root, stdio: "inherit" });
  execFileSync("unzip", ["-q", zip, "-d", archive]);
  const archiveSurface = resolve(archive, "yeeflow-app-builder-plugin");
  assert.deepEqual(await verifySurface(archiveSurface, "archive"), first, "CORE_EXTRACTION_WAVE3_BATCH_A_ARCHIVE_DIFFERENTIAL");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_A_ARCHIVE_PARITY_PASSED");

  const installed = resolve(temporary, "installed/yeeflow-app-builder-plugin");
  cpSync(resolve(root, "dist/yeeflow-app-builder-plugin"), installed, { recursive: true });
  assert.deepEqual(await verifySurface(installed, "installed"), first, "CORE_EXTRACTION_WAVE3_BATCH_A_INSTALLED_DIFFERENTIAL");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_A_INSTALLED_PARITY_PASSED");

  materializerGate(root, "source");
  materializerGate(archiveSurface, "archive");
  materializerGate(installed, "installed");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_A_MATERIALIZER_PARITY_PASSED");

  const rollback = resolve(temporary, "rollback/yeeflow-app-builder-plugin");
  cpSync(installed, rollback, { recursive: true });
  restoreLegacyProjectionModule(resolve(rollback, "scripts/lib/workflow-set-data-list-projection-utils.mjs"));
  assert.deepEqual(await verifySurface(rollback, "rollback"), first, "CORE_EXTRACTION_WAVE3_BATCH_A_LEGACY_ROLLBACK_DIFFERENTIAL");
  materializerGate(rollback, "rollback");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_A_LEGACY_ROLLBACK_PASSED");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_A_DIFFERENTIAL_PARITY_PASSED");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_A_SERIALIZATION_IMMUTABILITY_DETERMINISM_PASSED");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_A_SCOPE_AND_LEAKAGE_GATES_PASSED");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

async function verifySurface(surface, label) {
  const core = await import(moduleUrl(corePath(surface)));
  const compat = await import(moduleUrl(resolve(surface, "scripts/lib/workflow-set-data-list-projection-utils.mjs")));
  assert.equal(typeof core.projectWorkflowSetDataListProjection, "function", `CORE_EXTRACTION_WAVE3_BATCH_A_PUBLIC_FACADE_MISSING:${label}`);
  assert.equal("mergeWorkflowVariableProjection" in core, false, `CORE_EXTRACTION_WAVE3_BATCH_A_HOST_MERGE_LEAKED:${label}`);
  const results = [];
  for (const item of corpus.cases) {
    const records = structuredClone(item.records);
    const record = records[0] || {};
    const before = stable({ records, record });
    const expected = { record: legacy.workflowSetDataListProjectionRecordLegacy(structuredClone(record)), variables: legacy.buildWorkflowVariablesFromSetDataListRecordsLegacy(structuredClone(records)) };
    const projected = core.projectWorkflowSetDataListProjection({ record, records });
    assert.equal(stable(projected), stable(expected), `CORE_EXTRACTION_WAVE3_BATCH_A_CORE_PARITY_MISMATCH:${label}:${item.id}`);
    assert.equal(stable({ records, record }), before, `CORE_EXTRACTION_WAVE3_BATCH_A_INPUT_MUTATION:${label}:${item.id}`);
    assert(frozenDeep(projected), `CORE_EXTRACTION_WAVE3_BATCH_A_RESULT_NOT_FROZEN:${label}:${item.id}`);
    assert.equal(stable(JSON.parse(JSON.stringify(projected))), stable(projected), `CORE_EXTRACTION_WAVE3_BATCH_A_SERIALIZATION_MISMATCH:${label}:${item.id}`);
    assert.equal(stable(compat.workflowSetDataListProjectionRecord(structuredClone(record))), stable(expected.record), `CORE_EXTRACTION_WAVE3_BATCH_A_RECORD_SHIM_MISMATCH:${label}:${item.id}`);
    assert.equal(stable(compat.buildWorkflowVariablesFromSetDataListRecords(structuredClone(records))), stable(expected.variables), `CORE_EXTRACTION_WAVE3_BATCH_A_VARIABLE_SHIM_MISMATCH:${label}:${item.id}`);
    results.push({ id: item.id, projected });
  }
  const target = { basic: [], listref: [], filter: [] };
  const hostResult = compat.mergeWorkflowVariableProjection(target, compat.buildWorkflowVariablesFromSetDataListRecords(structuredClone(corpus.cases[1].records)));
  assert.strictEqual(hostResult, target, `CORE_EXTRACTION_WAVE3_BATCH_A_HOST_MERGE_OWNERSHIP:${label}`);
  assert(target.basic.length > 0 && target.listref.length > 0, `CORE_EXTRACTION_WAVE3_BATCH_A_HOST_MERGE_UNCHANGED:${label}`);
  return results;
}

function materializerGate(surface, label) {
  const testPath = resolve(surface, "scripts/test-workflow-set-data-list-materialization-gates.mjs");
  if (surface !== root) writeFileSync(testPath, readFileSync(resolve(root, "scripts/test-workflow-set-data-list-materialization-gates.mjs")));
  const output = execFileSync(process.execPath, [testPath], { cwd: surface, encoding: "utf8" });
  assert(output.includes("workflow Set Data List materialization gates: pass"), `CORE_EXTRACTION_WAVE3_BATCH_A_MATERIALIZER_GATE_MISSING:${label}`);
}

function restoreLegacyProjectionModule(path) {
  let source = readFileSync(resolve(root, "compatibility/differential-fixtures/core-extraction-wave3-batch-a-workflow-set-data-list-projection-legacy-baseline.v0.1.0.mjs"), "utf8");
  source = source.replaceAll("workflowSetDataListProjectionRecordLegacy", "workflowSetDataListProjectionRecord").replaceAll("buildWorkflowVariablesFromSetDataListRecordsLegacy", "buildWorkflowVariablesFromSetDataListRecords").replaceAll("mergeWorkflowVariableProjectionLegacy", "mergeWorkflowVariableProjection");
  writeFileSync(path, source);
}
function frozenDeep(value) { if (!value || typeof value !== "object") return true; if (!Object.isFrozen(value)) return false; return Object.values(value).every(frozenDeep); }
function corePath(surface) { const artifact = resolve(surface, "core/yeeflow-app-builder-core-planning.v0.1.0.mjs"); try { readFileSync(artifact); return artifact; } catch { return resolve(root, "packages/app-builder-core-planning/lib/markdown-planning-utils.js"); } }
function stable(value) { return JSON.stringify(value); }
function moduleUrl(path) { return `${pathToFileURL(path).href}?wave3batcha=${Date.now()}-${Math.random()}`; }
function json(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }

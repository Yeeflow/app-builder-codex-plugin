#!/usr/bin/env node
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-core-wave3b-"));
const corpus = json("compatibility/differential-fixtures/core-extraction-wave3-batch-b-workflow-query-data-static-plan.v0.1.0.json");
const legacy = await import(moduleUrl(resolve(root, "compatibility/differential-fixtures/core-extraction-wave3-batch-b-workflow-query-data-static-plan-legacy-baseline.v0.1.0.mjs")));

try {
  const first = await verifySurface(root, "source-1");
  const second = await verifySurface(root, "source-2");
  assert.deepEqual(first, second, "CORE_EXTRACTION_WAVE3_BATCH_B_NONDETERMINISM");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_B_SOURCE_PARITY_PASSED");
  const zip = resolve(temporary, "wave3-batch-b-proof.zip"); const archive = resolve(temporary, "archive");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", zip], { cwd: root, stdio: "inherit" });
  execFileSync("unzip", ["-q", zip, "-d", archive]); const archiveSurface = resolve(archive, "yeeflow-app-builder-plugin");
  assert.deepEqual(await verifySurface(archiveSurface, "archive"), first, "CORE_EXTRACTION_WAVE3_BATCH_B_ARCHIVE_DIFFERENTIAL");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_B_ARCHIVE_PARITY_PASSED");
  const installed = resolve(temporary, "installed/yeeflow-app-builder-plugin"); cpSync(resolve(root, "dist/yeeflow-app-builder-plugin"), installed, { recursive: true });
  assert.deepEqual(await verifySurface(installed, "installed"), first, "CORE_EXTRACTION_WAVE3_BATCH_B_INSTALLED_DIFFERENTIAL");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_B_INSTALLED_PARITY_PASSED");
  materializerGate(root, "source"); materializerGate(archiveSurface, "archive"); materializerGate(installed, "installed");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_B_MATERIALIZER_PARITY_PASSED");
  const rollback = resolve(temporary, "rollback/yeeflow-app-builder-plugin"); cpSync(installed, rollback, { recursive: true });
  writeFileSync(resolve(rollback, "scripts/lib/workflow-query-data-utils.mjs"), readFileSync(resolve(root, "compatibility/differential-fixtures/core-extraction-wave3-batch-b-workflow-query-data-static-plan-legacy-baseline.v0.1.0.mjs")));
  assert.deepEqual(await verifySurface(rollback, "rollback"), first, "CORE_EXTRACTION_WAVE3_BATCH_B_LEGACY_ROLLBACK_DIFFERENTIAL"); materializerGate(rollback, "rollback");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_B_LEGACY_ROLLBACK_PASSED");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_B_DIFFERENTIAL_PARITY_PASSED");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_B_SERIALIZATION_IMMUTABILITY_DETERMINISM_PASSED");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_B_SCOPE_AND_LEAKAGE_GATES_PASSED");
} finally { rmSync(temporary, { recursive: true, force: true }); }

async function verifySurface(surface, label) {
  const core = await import(moduleUrl(corePath(surface)));
  const compat = await import(moduleUrl(resolve(surface, "scripts/lib/workflow-query-data-utils.mjs")));
  assert.equal(typeof core.projectWorkflowQueryDataStaticPlan, "function", `CORE_EXTRACTION_WAVE3_BATCH_B_PUBLIC_FACADE_MISSING:${label}`);
  const results = [];
  for (const entry of corpus.cases) {
    const input = structuredClone(entry.input); const before = structuredClone(input);
    if (entry.error) {
      assert.throws(() => core.projectWorkflowQueryDataStaticPlan({ kind: entry.kind, value: input }), new RegExp(escape(entry.error)), `CORE_EXTRACTION_WAVE3_BATCH_B_CORE_ERROR:${label}:${entry.id}`);
      assert.throws(() => invoke(compat, entry.kind, input), new RegExp(escape(entry.error)), `CORE_EXTRACTION_WAVE3_BATCH_B_SHIM_ERROR:${label}:${entry.id}`);
      continue;
    }
    const expected = invoke(legacy, entry.kind, structuredClone(input));
    const projected = core.projectWorkflowQueryDataStaticPlan({ kind: entry.kind, value: input });
    assert.equal(stable(projected.value), stable(expected), `CORE_EXTRACTION_WAVE3_BATCH_B_CORE_PARITY:${label}:${entry.id}`);
    assert.equal(stable(invoke(compat, entry.kind, structuredClone(input))), stable(expected), `CORE_EXTRACTION_WAVE3_BATCH_B_SHIM_PARITY:${label}:${entry.id}`);
    assert.deepEqual(input, before, `CORE_EXTRACTION_WAVE3_BATCH_B_INPUT_MUTATION:${label}:${entry.id}`);
    assert(frozenDeep(projected), `CORE_EXTRACTION_WAVE3_BATCH_B_RESULT_NOT_FROZEN:${label}:${entry.id}`);
    assert.equal(stable(JSON.parse(JSON.stringify(projected))), stable(projected), `CORE_EXTRACTION_WAVE3_BATCH_B_SERIALIZATION:${label}:${entry.id}`);
    results.push({ id: entry.id, projected });
  }
  assert.equal("parseWorkflowSorts" in core, false, `CORE_EXTRACTION_WAVE3_BATCH_B_HOST_SORT_PARSER_LEAKED:${label}`);
  return results;
}
function materializerGate(surface, label) { const file = resolve(surface, "scripts/test-workflow-query-data-golden-reference-gates.mjs"); if (surface !== root) writeFileSync(file, readFileSync(resolve(root, "scripts/test-workflow-query-data-golden-reference-gates.mjs"))); const output = execFileSync(process.execPath, [file], { cwd: surface, encoding: "utf8" }); assert(output.includes("full-app materializer requires explicit Workflow Set Data List configuration"), `CORE_EXTRACTION_WAVE3_BATCH_B_MATERIALIZER_GATE:${label}`); }
function invoke(module, kind, input) { if (kind === "mode") return module.normalizeWorkflowQueryDataMode(input); if (kind === "query-properties") return module.buildWorkflowQueryDataProperties(input); if (kind === "field-map") return module.parseWorkflowFieldMap(input); if (kind === "list-variable") return module.buildWorkflowListVariable(input); if (kind === "loop-properties") return module.buildWorkflowLoopProperties(input); throw new Error(`Unsupported corpus kind: ${kind}`); }
function corePath(surface) { if (surface === root) return resolve(root, "packages/app-builder-core-planning/lib/index.js"); const local = resolve(surface, "core/yeeflow-app-builder-core-planning.v0.1.0.mjs"); readFileSync(local); return local; }
function frozenDeep(value) { if (!value || typeof value !== "object") return true; return Object.isFrozen(value) && Object.values(value).every(frozenDeep); }
function stable(value) { return JSON.stringify(value); } function escape(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); } function moduleUrl(path) { return `${pathToFileURL(path).href}?wave3batchb=${Date.now()}-${Math.random()}`; } function json(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }

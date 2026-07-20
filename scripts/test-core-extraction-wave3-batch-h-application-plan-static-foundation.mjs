#!/usr/bin/env node
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-wave3-batch-h-"));
const fixture = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/core-extraction-wave3-batch-h-application-plan-static-foundation.v0.1.0.json"), "utf8"));

try {
  const source = await verifySurface(root, "source");
  const sourceSecond = await verifySurface(root, "source-second");
  assert.deepEqual(source, sourceSecond, "CORE_EXTRACTION_WAVE3_BATCH_H_NONDETERMINISM");
  const rollback = await materialize(createRollbackSurface(resolve(temporary, "rollback")), "rollback");
  assert.deepEqual(source.materialized, rollback, "CORE_EXTRACTION_WAVE3_BATCH_H_LEGACY_ROLLBACK_DIFFERENTIAL");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_H_SOURCE_PARITY_PASSED");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_H_MATERIALIZER_PARITY_PASSED");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_H_LEGACY_ROLLBACK_PASSED");
  const archiveZip = resolve(temporary, "official-proof.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", archiveZip], { cwd: root, stdio: "pipe" });
  const archiveDirectory = resolve(temporary, "archive"); mkdirSync(archiveDirectory); execFileSync("unzip", ["-q", archiveZip, "-d", archiveDirectory]);
  const archive = await verifySurface(resolve(archiveDirectory, "yeeflow-app-builder-plugin"), "archive");
  assert.deepEqual(archive, source, "CORE_EXTRACTION_WAVE3_BATCH_H_ARCHIVE_DIFFERENTIAL");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_H_ARCHIVE_PARITY_PASSED");
  const installedRoot = resolve(temporary, "installed/yeeflow-app-builder-plugin"); cpSync(resolve(root, "dist/yeeflow-app-builder-plugin"), installedRoot, { recursive: true });
  const installed = await verifySurface(installedRoot, "installed");
  assert.deepEqual(installed, source, "CORE_EXTRACTION_WAVE3_BATCH_H_INSTALLED_DIFFERENTIAL");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_H_INSTALLED_PARITY_PASSED");
  console.log(`CORE_EXTRACTION_WAVE3_BATCH_H_APPLICATION_PLAN_STATIC_FOUNDATION_CORPUS_PASSED cases=${fixture.caseCount}`);
  console.log("CORE_EXTRACTION_WAVE3_BATCH_H_SERIALIZATION_IMMUTABILITY_DETERMINISM_PASSED");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_H_SCOPE_AND_LEAKAGE_GATES_PASSED");
} finally { rmSync(temporary, { recursive: true, force: true }); }

async function verifySurface(surface, label) {
  const core = await import(moduleUrl(corePath(surface)));
  assert.equal(typeof core.projectApplicationPlanStaticFoundation, "function", `CORE_EXTRACTION_WAVE3_BATCH_H_PUBLIC_FACADE_MISSING:${label}`);
  const projected = [];
  for (const entry of fixture.cases) {
    const input = structuredClone(entry.input); const before = structuredClone(input);
    const result = core.projectApplicationPlanStaticFoundation(input);
    assert.deepEqual(input, before, `CORE_EXTRACTION_WAVE3_BATCH_H_INPUT_MUTATION:${label}:${entry.id}`);
    assert(frozenDeep(result), `CORE_EXTRACTION_WAVE3_BATCH_H_RESULT_NOT_FROZEN:${label}:${entry.id}`);
    assert.deepEqual(JSON.parse(JSON.stringify(result)), result, `CORE_EXTRACTION_WAVE3_BATCH_H_SERIALIZATION:${label}:${entry.id}`);
    projected.push(result);
  }
  assert.equal(projected[0].value.listId, "9000000000000000001", `CORE_EXTRACTION_WAVE3_BATCH_H_LOSSLESS_ID:${label}`);
  assert.equal(projected[2].value, 1, `CORE_EXTRACTION_WAVE3_BATCH_H_HEADER_NORMALIZATION:${label}`);
  assert.equal(projected[3].value, -1, `CORE_EXTRACTION_WAVE3_BATCH_H_HEADER_MISSING:${label}`);
  assert.deepEqual(projected.at(-1).value, ["Title", "Hours"], `CORE_EXTRACTION_WAVE3_BATCH_H_UNIQUE_ORDER:${label}`);
  assert.throws(() => core.projectApplicationPlanStaticFoundation({ kind: "resource-mutation", value: {} }), /APPLICATION_PLAN_STATIC_FOUNDATION_KIND_UNSUPPORTED/);
  assert.throws(() => core.projectApplicationPlanStaticFoundation({ kind: "extract-numbered-section", value: { text: "x", marker: {} } }), /APPLICATION_PLAN_STATIC_FOUNDATION_MARKER_INVALID/);
  const sourceText = readFileSync(resolve(surface === root ? root : surface, surface === root ? "packages/app-builder-core-planning/src/application-plan-static-foundation.ts" : "core/yeeflow-app-builder-core-planning.v0.1.0.mjs"), "utf8");
  for (const forbidden of ["node:fs", "node:path", "node:crypto", "WeakMap", "fetch(", "process."]) assert(!sourceText.includes(forbidden), `CORE_EXTRACTION_WAVE3_BATCH_H_FORBIDDEN_CORE_DEPENDENCY:${label}:${forbidden}`);
  return { projected, materialized: await materialize(surface, label) };
}

async function materialize(surface, label) {
  const work = resolve(temporary, `materialize-${label}`); mkdirSync(work, { recursive: true });
  const spec = resolve(work, "functional-specification.md"); const plan = resolve(work, "yeeflow-app-plan.md"); const out = resolve(work, "generated-final");
  writeFileSync(spec, "# Functional Specification: Static Foundation\n\nBusiness defaults approval status: user-default-approved-for-generation.\n");
  writeFileSync(plan, planText());
  const materializer = await import(moduleUrl(resolve(surface, "scripts/materialize-full-app-generated-final.mjs")));
  const report = materializer.materializeFullAppGeneratedFinal({ cwd: work, functionalSpec: spec, appPlan: plan, outDir: out, allowFixtureApiIdsForTests: true });
  assert.equal(report.status, "pass", `CORE_EXTRACTION_WAVE3_BATCH_H_MATERIALIZER_FAILED:${label}:${JSON.stringify(report.findings)}`);
  return normalize(JSON.parse(readFileSync(report.outputs.decodedResource, "utf8")));
}

function createRollbackSurface(target) {
  cpSync(resolve(root, "scripts"), resolve(target, "scripts"), { recursive: true }); cpSync(resolve(root, "docs/reference"), resolve(target, "docs/reference"), { recursive: true }); cpSync(resolve(root, "dist/yeeflow-app-builder-plugin/core"), resolve(target, "core"), { recursive: true });
  const file = resolve(target, "scripts/materialize-full-app-generated-final.mjs"); let source = readFileSync(file, "utf8");
  source = source.replace('import { projectApplicationPlanStaticFoundation as coreProjectApplicationPlanStaticFoundation } from "./lib/application-plan-static-foundation-core-adapter.mjs";\n', "")
    .replace('const projected = coreProjectApplicationPlanStaticFoundation({ kind: "parse-json-maybe", value }).value;\n  return projected === null ? null : JSON.parse(JSON.stringify(projected));', 'if (!value || typeof value !== "string") return null;\n  try { return JSON.parse(value); } catch { return null; }')
    .replace('return coreProjectApplicationPlanStaticFoundation({ kind: "find-header-index", value: { headers: normalizedHeaders, candidates } }).value;', 'const normalizedCandidates = candidates.map(normKey);\n  return normalizedHeaders.findIndex((header) => normalizedCandidates.includes(header));')
    .replace('return coreProjectApplicationPlanStaticFoundation({ kind: "extract-numbered-section", value: { text, marker: { source: marker.source, flags: marker.flags } } }).value;', 'const match = marker.exec(text);\n  if (!match) return "";\n  const start = match.index;\n  const next = text.slice(start + match[0].length).search(/\\n##\\s+\\d+\\.\\s+/);\n  return next === -1 ? text.slice(start) : text.slice(start, start + match[0].length + next);')
    .replace('return [...coreProjectApplicationPlanStaticFoundation({ kind: "extract-subsections", value: { text, marker: { source: marker.source, flags: marker.flags } } }).value];', 'const flags = marker.flags.includes("g") ? marker.flags : `${marker.flags}g`;\n  const globalMarker = new RegExp(marker.source, flags);\n  const matches = [...text.matchAll(globalMarker)];\n  if (!matches.length) return [];\n  return matches.map((match) => { const start = match.index; const remainder = text.slice(start + match[0].length); const next = remainder.search(/\\n#{2,4}\\s+/); return next === -1 ? text.slice(start) : text.slice(start, start + match[0].length + next); });')
    .replace('return coreProjectApplicationPlanStaticFoundation({ kind: "extract-subsection", value: { text, marker: { source: marker.source, flags: marker.flags } } }).value;', 'const match = marker.exec(text);\n  if (!match) return "";\n  const start = match.index; const remainder = text.slice(start + match[0].length); const next = remainder.search(/\\n#{2,4}\\s+/);\n  return next === -1 ? text.slice(start) : text.slice(start, start + match[0].length + next);')
    .replace('return coreProjectApplicationPlanStaticFoundation({ kind: "is-workbench-custom-form", value: record || {} }).value;', 'const text = `${record?.formType || ""} ${record?.formName || ""} ${record?.selectedTemplate || ""} ${record?.openIn || ""}`.toLowerCase();\n  return /\\bworkbench\\b/.test(text) || text.includes("data_list_form_layout_workbench");')
    .replace('return coreProjectApplicationPlanStaticFoundation({ kind: "is-table-line", value: line }).value;', 'return /^\\s*\\|.+\\|\\s*$/.test(line || "");')
    .replace('return [...coreProjectApplicationPlanStaticFoundation({ kind: "unique-case-insensitive", value: values }).value];', 'const seen = new Set(); const out = []; for (const value of values) { const key = value.toLowerCase(); if (seen.has(key)) continue; seen.add(key); out.push(value); } return out;')
    .replace('return coreProjectApplicationPlanStaticFoundation({ kind: "infer-navigation-type", value }).value;', 'if (/approval/i.test(value)) return 105; if (/dashboard/i.test(value)) return 103; if (/document\\s+library|doc\\s+library/i.test(value)) return 16; if (/report/i.test(value)) return 106; return 1;');
  for (const kind of ["parse-json-maybe", "find-header-index", "extract-numbered-section", "extract-subsections", "extract-subsection", "is-workbench-custom-form", "is-table-line", "unique-case-insensitive", "infer-navigation-type"]) assert(!source.includes(`kind: "${kind}"`), `CORE_EXTRACTION_WAVE3_BATCH_H_ROLLBACK_BRIDGE_RETAINED:${kind}`);
  writeFileSync(file, source); return target;
}

function corePath(surface) { return surface === root ? resolve(root, "packages/app-builder-core-planning/lib/index.js") : resolve(surface, "core/yeeflow-app-builder-core-planning.v0.1.0.mjs"); }
function frozenDeep(value) { return !value || typeof value !== "object" || Object.isFrozen(value) && Object.values(value).every(frozenDeep); }
function normalize(value) { return JSON.parse(JSON.stringify(value).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu, "<uuid>")); }
function moduleUrl(path) { return `${pathToFileURL(path).href}?wave3h=${Date.now()}-${Math.random()}`; }
function planText() { return `# Yeeflow App Plan: Static Foundation\n\n## Plan Status\n\n- Business defaults approval status: user-default-approved-for-generation.\n\n## 4. Data Lists and Document Libraries Plan\n\n### 4.1 Leave Balances\n\n| Field Label | Field Name | Field Type | Control Type |\n| --- | --- | --- | --- |\n| Title | Title | Text | input |\n| Balance | Balance | Decimal | input_number |\n\n## 6. Approval Forms Plan\n\n### 6.1 Leave Request\n\n| Field Label | Field Type | Control Type |\n| --- | --- | --- |\n| Title | Text | input |\n\n## 7. Navigation Plan\n\n| Group | Item | Target Resource | Yeeflow Resource Type |\n| --- | --- | --- | --- |\n| Operations | Leave Balances | Leave Balances | Data List |\n| Operations | Leave Request | Leave Request | Approval Form |\n`; }

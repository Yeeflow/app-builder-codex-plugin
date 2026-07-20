#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/core-extraction-wave3-batch-k-approval-form-sublist-static-configuration.v0.1.0.json"), "utf8"));
const temp = mkdtempSync(resolve(tmpdir(), "yeeflow-wave3-batch-k-"));
const url = (file) => `${pathToFileURL(file).href}?batchk=${Date.now()}-${Math.random()}`;
const frozenDeep = (value) => !value || typeof value !== "object" || Object.isFrozen(value) && Object.values(value).every(frozenDeep);

function normalize(value) { return JSON.parse(JSON.stringify(value).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu, "<uuid>")); }
async function lower(surface) {
  const lowerer = await import(url(resolve(surface, "scripts/lib/approval-form-layout-builder.mjs")));
  return normalize(lowerer.buildApprovalFormLayoutDef({ rootDir: surface, id: "9900000000000000001", title: "Leave Request", fields: [{ displayName: "Leave Details", fieldName: "Text1", fieldType: "List", controlType: "list", listFields: [
    { id: "Date", idx: "Date", displayName: "Leave Date", type: "DateTime" },
    { id: "Hours", idx: "Hours", displayName: "Hours", type: "Decimal" },
    { id: "Approver", idx: "Approver", displayName: "Approver", type: "identity-picker" },
  ] }] }));
}

try {
  const archiveZip = resolve(temp, "official.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", archiveZip], { cwd: root, stdio: "pipe" });
  const archiveDir = resolve(temp, "archive"); mkdirSync(archiveDir); execFileSync("unzip", ["-q", archiveZip, "-d", archiveDir]);
  const installed = resolve(temp, "installed"); cpSync(resolve(root, "dist/yeeflow-app-builder-plugin"), installed, { recursive: true });
  const surfaces = [
    await import(url(resolve(root, "packages/app-builder-core-materializer/lib/index.js"))),
    await import(url(resolve(archiveDir, "yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"))),
    await import(url(resolve(installed, "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"))),
  ];
  for (const item of fixture.cases) {
    const input = { kind: item.kind, value: item.value }; const before = JSON.stringify(input);
    const results = surfaces.map((core) => core.projectApprovalFormStaticConfiguration(input));
    assert.equal(results[0].value, item.expected); assert.deepEqual(results[0], results[1]); assert.deepEqual(results[0], results[2]);
    assert.equal(JSON.stringify(input), before); assert(frozenDeep(results[0])); assert.deepEqual(JSON.parse(JSON.stringify(results[0])), results[0]);
  }
  const lowered = await Promise.all([lower(root), lower(resolve(archiveDir, "yeeflow-app-builder-plugin")), lower(installed)]);
  assert.deepEqual(lowered[0], lowered[1]); assert.deepEqual(lowered[0], lowered[2]);
  const legacy = readFileSync(resolve(root, "scripts/lib/approval-form-layout-builder.mjs"), "utf8")
    .replace('  return projectApprovalFormStaticConfiguration({ kind: "sublist-row-field-type", value }).value;', '  const raw = normKey(value); if (raw === "lookup") return "lookup"; if (/date|time/.test(raw)) return "date"; if (/number|decimal|currency|amount|integer/.test(raw)) return "number"; if (/boolean|bit|switch|yes no/.test(raw)) return "boolean"; if (/user|identity|person/.test(raw)) return "user"; return "text";')
    .replace('  return projectApprovalFormStaticConfiguration({ kind: "sublist-row-control-type", value: type }).value;', '  if (type === "date") return "datepicker"; if (type === "number") return "input_number"; if (type === "boolean") return "switch"; if (type === "user") return "identity-picker"; return "input";');
  const rollback = resolve(temp, "approval-form-layout-builder.rollback.mjs"); writeFileSync(rollback, legacy); execFileSync(process.execPath, ["--check", rollback], { stdio: "pipe" }); assert(!legacy.includes('sublist-row-field-type'));
  console.log(`CORE_EXTRACTION_WAVE3_BATCH_K_SOURCE_ARCHIVE_INSTALLED_MATERIALIZER_PARITY_PASSED cases=${fixture.cases.length}`);
  console.log("CORE_EXTRACTION_WAVE3_BATCH_K_SERIALIZATION_IMMUTABILITY_DETERMINISM_PASSED");
  console.log("CORE_EXTRACTION_WAVE3_BATCH_K_LEGACY_ROLLBACK_PASSED");
} finally { rmSync(temp, { recursive: true, force: true }); }

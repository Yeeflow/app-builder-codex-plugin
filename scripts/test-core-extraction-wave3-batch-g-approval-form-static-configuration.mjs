#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = await import(pathToFileURL(resolve(root, "packages/app-builder-core-materializer/lib/index.js")).href);
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-wave3-batch-g-approval-static-"));

function frozenDeep(value) {
  if (!value || typeof value !== "object") return true;
  return Object.isFrozen(value) && Object.values(value).every(frozenDeep);
}

const cases = [
  { kind: "explicit-default-approval", value: "The business explicitly approved the standard Yeeflow default color." },
  { kind: "explicit-default-approval", value: "Choose a color." },
  { kind: "public-step-type", value: "Execute Custom Code" },
  { kind: "public-step-type", value: "Set Variables" },
  { kind: "full-row-field", value: { displayName: "Business Purpose", fieldType: "Text", controlType: "input" } },
  { kind: "full-row-field", value: { displayName: "Amount", fieldType: "Decimal", controlType: "input_number" } },
  {
    kind: "unique-field-specs",
    value: [
      { displayName: "Title", fieldType: "Text" },
      { displayName: "Request Title", fieldType: "Text", dynamicDisplay: "`Visible`" },
      { displayName: "Hours", fieldName: "Hours", fieldType: "Decimal", listRefId: "9000000000000000001", rowFields: [{ FieldName: "Day" }] },
      { displayName: "Hours again", fieldName: "Hours", fieldType: "Decimal" },
      { displayName: "Not applicable", fieldType: "Text" },
    ],
  },
  {
    kind: "public-field-selection",
    value: {
      requested: ["Applicant", "Title", "Applicant"],
      fields: [
        { DisplayName: "Title", FieldName: "Title", InternalName: "Title" },
        { DisplayName: "Applicant", FieldName: "Text2", InternalName: "Text2" },
        { DisplayName: "Unused", FieldName: "Text3", InternalName: "Text3" },
      ],
    },
  },
  {
    kind: "public-field-selection",
    value: { requested: [], fields: Array.from({ length: 9 }, (_, index) => ({ DisplayName: `Field ${index + 1}`, FieldName: `Text${index + 1}` })) },
  },
  { kind: "no-fields-notice", value: { role: "submission", id: "4f6cde42-1b3c-4a6e-8fc2-123456789abc" } },
  { kind: "no-fields-notice", value: { role: "task", id: "1e6cde42-1b3c-4a6e-8fc2-123456789abc" } },
];
const fixture = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/core-extraction-wave3-batch-g-approval-form-static-configuration.v0.1.0.json"), "utf8"));
assert.deepEqual(cases, fixture.cases, "The executable corpus must remain aligned with the versioned Batch G fixture.");

try {
  const archiveZip = resolve(temporary, "official-proof.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", archiveZip], { cwd: root, stdio: "pipe" });
  const archiveDirectory = resolve(temporary, "archive");
  mkdirSync(archiveDirectory);
  execFileSync("unzip", ["-q", archiveZip, "-d", archiveDirectory]);
  const archive = await import(pathToFileURL(resolve(archiveDirectory, "yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs")).href);
  cpSync(resolve(root, "dist/yeeflow-app-builder-plugin"), resolve(temporary, "plugin"), { recursive: true });
  const installed = await import(pathToFileURL(resolve(temporary, "plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs")).href);
  for (const input of cases) {
    const raw = JSON.stringify(input);
    const results = [source, archive, installed].map((module) => module.projectApprovalFormStaticConfiguration(input));
    assert.deepEqual(results[0], results[1]);
    assert.deepEqual(results[0], results[2]);
    assert.equal(JSON.stringify(input), raw, `input mutation: ${input.kind}`);
    assert(frozenDeep(results[0]), `immutable result: ${input.kind}`);
    assert.deepEqual(JSON.parse(JSON.stringify(results[0])), results[0], `JSON serialization: ${input.kind}`);
  }
  const unique = source.projectApprovalFormStaticConfiguration(cases[6]).value;
  assert.deepEqual(unique.map((field) => field.fieldName), ["Title", "requestTitle", "Hours"]);
  assert.equal(unique[1].dynamicDisplay, "Visible");
  assert.equal(unique[2].listRefId, "9000000000000000001");
  const selected = source.projectApprovalFormStaticConfiguration(cases[7]).value;
  assert.deepEqual(selected.map((field) => field.FieldName), ["Text2", "Title"]);
  assert.equal(source.projectApprovalFormStaticConfiguration(cases[8]).value.length, 8);
  assert.throws(() => source.projectApprovalFormStaticConfiguration({ kind: "no-fields-notice", value: { role: "task" } }), /host-generated deterministic id/);
  assert.throws(() => source.projectApprovalFormStaticConfiguration({ kind: "not-a-kind" }), /Unsupported Approval Form static configuration kind/);
  const implementation = await import("node:fs").then(({ readFileSync }) => readFileSync(resolve(root, "packages/app-builder-core-materializer/src/internal/approval-form-static-configuration.ts"), "utf8"));
  for (const forbidden of ["WeakMap", "fetch(", "node:fs", "node:path", "node:crypto", "process."]) assert(!implementation.includes(forbidden), `forbidden Core dependency token: ${forbidden}`);
  console.log(`CORE_EXTRACTION_WAVE3_BATCH_G_APPROVAL_STATIC_CONFIGURATION_CORPUS_PASSED cases=${cases.length} surfaces=source,archive,installed`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

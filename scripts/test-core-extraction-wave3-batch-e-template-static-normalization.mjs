#!/usr/bin/env node
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = await import(pathToFileURL(resolve(root, "packages/app-builder-core-materializer/lib/index.js")).href);
const artifactPath = resolve(root, "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs");
const archive = await import(pathToFileURL(artifactPath).href);
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-wave3-batch-e-installed-"));
try {
  cpSync(resolve(root, "dist/yeeflow-app-builder-plugin"), resolve(temporary, "plugin"), { recursive: true });
  const installed = await import(pathToFileURL(resolve(temporary, "plugin/core/yeeflow-app-builder-core-materializer.v0.1.0.mjs")).href);
  const corpus = [
    { kind: "layout-purpose-match", value: { operation: "view", purpose: "View" }, expected: true },
    { kind: "layout-purpose-match", value: { operation: "edit", purpose: "New / Edit" }, expected: true },
    { kind: "layout-purpose-match", value: { operation: "view", purpose: "Edit" }, expected: false },
    { kind: "data-table-template-id", value: "Use data_table_control_caption_scroll.", options: { approvedTemplateIds: ["data_table_control_standard_scroll", "data_table_control_caption_scroll"] }, expected: "data_table_control_caption_scroll" },
    { kind: "data-table-template-id", value: "unknown", options: { approvedTemplateIds: ["data_table_control_standard_scroll"] }, expected: "" },
    { kind: "template-add-action", value: { type: "action_button", attrs: { "action-type": "5" } }, expected: true },
    { kind: "template-add-action", value: { type: "action_button", label: "Create item", attrs: {} }, expected: true },
    { kind: "template-add-action", value: { type: "input", label: "Create" }, expected: false },
    { kind: "detail-layout-action", value: { type: "listitem", op_type: "edit" }, expected: true },
    { kind: "detail-layout-action", value: { target: "{{DetailLayoutID}}" }, expected: true },
    { kind: "source-residue-text", value: { children: [{ attrs: { headc: { title: { value: "Active Loan Pipeline" } } } }] }, expected: true },
    { kind: "source-residue-text", value: { text: "Current employee balances" }, expected: false },
  ];
  for (const entry of corpus) {
    const before = JSON.stringify(entry);
    const outputs = [source, archive, installed].map((module) => module.projectTemplateStaticNormalization(entry));
    assert.deepEqual(outputs[0], outputs[1]); assert.deepEqual(outputs[0], outputs[2]);
    assert.equal(outputs[0].value, entry.expected); assert(Object.isFrozen(outputs[0]));
    assert.equal(JSON.stringify(entry), before);
  }
  const attrs = source.projectTemplateStaticNormalization({ kind: "default-layout-attrs" });
  assert(Object.isFrozen(attrs.value)); assert(Object.isFrozen(attrs.value.appearance));
  assert.equal(JSON.parse(JSON.stringify(attrs)).value.appearance.height, 46);
  assert.throws(() => source.projectTemplateStaticNormalization({ kind: "not-a-kind" }), /Unsupported template static normalization kind/);
  const artifactText = readFileSync(artifactPath, "utf8");
  for (const forbidden of ["node_modules", "packages/", "materialize-full-app-generated-final", "from \"node:"]) assert(!artifactText.includes(forbidden));
  console.log(`CORE_EXTRACTION_WAVE3_BATCH_E_TEMPLATE_STATIC_NORMALIZATION_PASSED corpus=${corpus.length} surfaces=source,archive,installed`);
} finally { rmSync(temporary, { recursive: true, force: true }); }

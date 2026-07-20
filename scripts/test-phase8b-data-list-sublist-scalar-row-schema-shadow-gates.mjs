#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corpusPath = resolve(root, "compatibility/differential-fixtures/data-list-sublist-scalar-row-schema-shadow.v0.1.0.json");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase8b-row-schema-"));
try {
  const corpus = JSON.parse(readFileSync(corpusPath, "utf8"));
  const required = ["SUBLIST_TEMPLATE_GRAPH_REFERENCE_MISSING", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_INVALID", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_DUPLICATE", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_RELATIONSHIP_BROKEN", "SUBLIST_ROW_SCHEMA_REFERENCE_MISSING", "SUBLIST_ROW_SCHEMA_REFERENCE_INVALID", "SUBLIST_ROW_SCHEMA_REFERENCE_SCOPE_MISMATCH", "SUBLIST_ROW_SCHEMA_REFERENCE_DUPLICATE", "SUBLIST_ROW_SCHEMA_REFERENCE_RELATIONSHIP_BROKEN"];
  assert.equal(corpus.caseCount, corpus.cases.length);
  assert.ok(required.every((code) => corpus.cases.some((item) => item.error === code)));
  assert.ok(["Lookup", "Identity", "Image", "Barcode", "Workflow Action"].every((kind) => corpus.cases.some((item) => item.fieldType === kind)));
  const result = spawnSync(process.execPath, [resolve(root, "scripts/test-data-list-sublist-scalar-row-schema-shadow.mjs")], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  console.log("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_NEGATIVE_GATES_PASSED cases=3");
} finally { rmSync(temporary, { recursive: true, force: true }); }

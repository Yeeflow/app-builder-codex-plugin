#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corpusPath = resolve(root, "compatibility/differential-fixtures/markdown-planning-utils.v0.9.71.json");
const functions = new Set(["splitMarkdownTableRow", "isMarkdownTableSeparator", "parseMarkdownTables", "stripMarkdownFencedBlocks", "findMarkdownTable", "markdownRowValue", "markdownRowValues", "extractMarkdownSubsection", "isNegativeRequirementStatement", "positivePlanningText", "hasTechnicalPlaceholderIdContext"]);
if (!existsSync(corpusPath)) fail("MARKDOWN_PLANNING_DIFFERENTIAL_CORPUS_MISSING", "Markdown planning differential corpus is missing.");
let corpus;
try { corpus = JSON.parse(readFileSync(corpusPath, "utf8")); } catch (error) { fail("MARKDOWN_PLANNING_DIFFERENTIAL_CORPUS_INVALID", `Differential corpus is not valid JSON: ${error.message}`); }
if (!Array.isArray(corpus.fixtures) || !corpus.fixtures.length) fail("MARKDOWN_PLANNING_DIFFERENTIAL_CORPUS_INVALID", "Differential corpus requires a non-empty fixtures array.");
const ids = new Set();
const covered = new Set();
for (const fixture of corpus.fixtures) {
  if (!fixture || typeof fixture.id !== "string" || !fixture.id || !Array.isArray(fixture.coverage) || !Array.isArray(fixture.calls) || !fixture.calls.length) fail("MARKDOWN_PLANNING_DIFFERENTIAL_FIXTURE_INVALID", "Every fixture requires id, coverage, and non-empty calls.");
  if (ids.has(fixture.id)) fail("MARKDOWN_PLANNING_DIFFERENTIAL_FIXTURE_DUPLICATE", `Duplicate fixture id: ${fixture.id}`);
  ids.add(fixture.id);
  for (const call of fixture.calls) {
    if (!call || typeof call.function !== "string" || !Array.isArray(call.args)) fail("MARKDOWN_PLANNING_DIFFERENTIAL_CALL_INVALID", `Fixture ${fixture.id} contains an invalid call.`);
    if (!functions.has(call.function)) fail("MARKDOWN_PLANNING_DIFFERENTIAL_FUNCTION_UNKNOWN", `Fixture ${fixture.id} names an unknown function: ${call.function}`);
    covered.add(call.function);
  }
}
for (const name of functions) if (!covered.has(name)) fail("MARKDOWN_PLANNING_DIFFERENTIAL_FUNCTION_UNCOVERED", `Differential corpus does not exercise ${name}.`);
if (/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/u.test(readFileSync(corpusPath, "utf8"))) fail("MARKDOWN_PLANNING_DIFFERENTIAL_NON_ENGLISH", "Differential corpus must contain English-only persisted content.");
console.log(JSON.stringify({ status: "passed", code: "MARKDOWN_PLANNING_DIFFERENTIAL_VALID", fixtureCount: corpus.fixtures.length, functionCount: covered.size }, null, 2));
function fail(code, message) { console.error(JSON.stringify({ status: "failed", findings: [{ code, message }] }, null, 2)); process.exit(1); }

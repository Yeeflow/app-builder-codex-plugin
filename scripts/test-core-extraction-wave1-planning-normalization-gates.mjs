#!/usr/bin/env node
import assert from "node:assert/strict";

const expectedFunctionCount = 24;
const expectedScore = 27;

assert.doesNotThrow(() => validate({ functionIds: ids(expectedFunctionCount), source: "export function projectPlanningLabel() { return Object.freeze({}); }", markdownShim: 'from "./markdown-planning-core-adapter.mjs"', placeholderShim: "projectPlanningLabel", score: expectedScore }));
for (const invalid of [
  { functionIds: ids(expectedFunctionCount - 1), code: "CORE_EXTRACTION_WAVE1_TRACEABILITY_INCOMPLETE" },
  { functionIds: [...ids(expectedFunctionCount - 1), "function-0"], code: "CORE_EXTRACTION_WAVE1_FUNCTION_OVERLAP" },
  { functionIds: ids(expectedFunctionCount), source: 'import { readFileSync } from "node:fs";', code: "CORE_EXTRACTION_WAVE1_FORBIDDEN_CORE_DEPENDENCY" },
  { functionIds: ids(expectedFunctionCount), markdownShim: "export const parseMarkdownTables = () => [];", code: "CORE_EXTRACTION_WAVE1_MARKDOWN_SHIM_NOT_ROUTED" },
  { functionIds: ids(expectedFunctionCount), placeholderShim: "export const cleanPlanningLabel = () => '';", code: "CORE_EXTRACTION_WAVE1_PLACEHOLDER_SHIM_NOT_ROUTED" },
  { functionIds: ids(expectedFunctionCount), score: 26, code: "CORE_EXTRACTION_WAVE1_SCORE_UNRECONCILED" },
]) assert.throws(() => validate({ source: "export function projectPlanningLabel() { return Object.freeze({}); }", markdownShim: 'from "./markdown-planning-core-adapter.mjs"', placeholderShim: "projectPlanningLabel", score: expectedScore, ...invalid }), new RegExp(invalid.code));
console.log("CORE_EXTRACTION_WAVE1_NEGATIVE_REGRESSIONS_PASSED cases=6");

function ids(count) { return Array.from({ length: count }, (_, index) => `function-${index}`); }
function validate(candidate) {
  if (candidate.functionIds.length !== expectedFunctionCount) throw Error("CORE_EXTRACTION_WAVE1_TRACEABILITY_INCOMPLETE");
  if (new Set(candidate.functionIds).size !== candidate.functionIds.length) throw Error("CORE_EXTRACTION_WAVE1_FUNCTION_OVERLAP");
  if (!candidate.source.includes("export function projectPlanningLabel") || /node:|process\.|require\(|fetch\(|window\.|document\./u.test(candidate.source)) throw Error("CORE_EXTRACTION_WAVE1_FORBIDDEN_CORE_DEPENDENCY");
  if (!candidate.markdownShim.includes('from "./markdown-planning-core-adapter.mjs"')) throw Error("CORE_EXTRACTION_WAVE1_MARKDOWN_SHIM_NOT_ROUTED");
  if (!candidate.placeholderShim.includes("projectPlanningLabel")) throw Error("CORE_EXTRACTION_WAVE1_PLACEHOLDER_SHIM_NOT_ROUTED");
  if (candidate.score !== expectedScore) throw Error("CORE_EXTRACTION_WAVE1_SCORE_UNRECONCILED");
}

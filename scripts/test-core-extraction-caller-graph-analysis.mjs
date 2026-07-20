#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { analyzeCallerGraph } from "./lib/core-extraction-caller-graph-analysis.mjs";

const root = mkdtempSync(join(tmpdir(), "caller-graph-"));
try {
  writeFileSync(join(root, "target.mjs"), "export function importedTarget() { return 1; }\nexport function unusedExport() { return 2; }\n");
  writeFileSync(join(root, "local.mjs"), "export function buildWorkflowLoopProperties() { return 1; }\nexport function buildWorkflowListLoopProperties() { return buildWorkflowLoopProperties(); }\nfunction unreachable() { return 3; }\n[1].map((value) => value + 1);\n");
  writeFileSync(join(root, "consumer.mjs"), "import { importedTarget as imported } from './target.mjs';\nexport function useImported() { return imported(); }\n");
  const graph = analyzeCallerGraph({ root, modulePaths: ["consumer.mjs", "local.mjs", "target.mjs"] });
  const byName = (name) => graph.records.find((record) => record.function === name).callerEvidence;
  assert.equal(byName("buildWorkflowLoopProperties").directLocalCallCount, 1, "local function calls must be counted without the historical subtraction");
  assert.equal(byName("importedTarget").importedBindingCallCount, 1, "named imported bindings must resolve to the exported producer");
  assert.equal(byName("importedTarget").exportedFunctionConsumerCount, 1, "exported consumer modules must be recorded separately");
  assert.equal(graph.records.find((record) => record.function.startsWith("anonymous@")).callerEvidence.callbackOnlyInvocationCount, 1, "callback-only functions must not be recorded as callers: 0");
  assert.equal(byName("unreachable").trulyUnreachable, true, "unexported functions without any production AST invocation must be distinguished as unreachable");
  console.log("CORE_EXTRACTION_CALLER_GRAPH_ANALYSIS_REGRESSIONS_PASSED");
} finally {
  rmSync(root, { recursive: true, force: true });
}

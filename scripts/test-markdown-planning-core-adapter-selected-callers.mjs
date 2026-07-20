#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const selectedCallers = [
  "validate-workflow-set-data-list-plan.mjs",
  "validate-set-variable-plan.mjs",
  "validate-form-action-open-resource-plan.mjs",
  "validate-form-action-query-data-plan.mjs",
  "validate-form-action-set-data-list-plan.mjs",
  "validate-workflow-query-data-plan.mjs",
  "validate-workflow-loop-plan.mjs",
];
for (const caller of selectedCallers) {
  const text = readFileSync(resolve(root, "scripts", caller), "utf8");
  if (!text.includes("./lib/markdown-planning-core-adapter.mjs")) throw new Error(`CORE_COMPAT_ADAPTER_CALLER_NOT_SWITCHED: ${caller}.`);
  execFileSync(process.execPath, ["--check", resolve(root, "scripts", caller)], { cwd: root, stdio: "inherit" });
}
const focusedTests = [
  "test-workflow-set-data-list-plan-gates.mjs",
  "test-set-variable-golden-reference-gates.mjs",
  "test-form-action-open-resource-plan-gates.mjs",
  "test-form-action-query-data-plan-gates.mjs",
  "test-form-action-set-data-list-plan-gates.mjs",
  "test-workflow-query-data-golden-reference-gates.mjs",
];
for (const test of focusedTests) execFileSync(process.execPath, [resolve(root, "scripts", test)], { cwd: root, stdio: "inherit" });
console.log(`CORE_COMPAT_ADAPTER_SELECTED_CALLERS_PASSED count=${selectedCallers.length}`);

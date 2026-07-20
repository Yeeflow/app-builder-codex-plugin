#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const path = "scripts/materialize-full-app-generated-final.mjs";
const current = readFileSync(resolve(root, path), "utf8");
const baseline = execFileSync("git", ["show", `HEAD:${path}`], { cwd: root, encoding: "utf8" });
const names = [
  "hasExplicitDefaultColorApproval",
  "uniqueApprovalFieldSpecs",
  "resolvePublicFormFields",
  "normalizePublicFormPlannedStepType",
  "buildApprovalNoFieldsNotice",
  "isFullRowApprovalField",
];

function functionSource(text, name) {
  const marker = `function ${name}(`;
  const start = text.indexOf(marker);
  assert.notEqual(start, -1, `missing ${name}`);
  let parameters = 0;
  let bodyStart = -1;
  for (let index = start + marker.length - 1; index < text.length; index += 1) {
    if (text[index] === "(") parameters += 1;
    if (text[index] === ")") parameters -= 1;
    if (parameters === 0 && text[index] === "{") { bodyStart = index; break; }
  }
  assert.notEqual(bodyStart, -1, `missing body: ${name}`);
  let depth = 0;
  for (let index = bodyStart; index < text.length; index += 1) {
    if (text[index] === "{") depth += 1;
    if (text[index] === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  throw new Error(`unterminated ${name}`);
}

let rollback = current;
for (const name of names) rollback = rollback.replace(functionSource(current, name), functionSource(baseline, name));
rollback = rollback.replace("  projectApprovalFormStaticConfiguration as coreProjectApprovalFormStaticConfiguration,\n", "");
assert(!rollback.includes("coreProjectApprovalFormStaticConfiguration"), `Batch G bridge must be absent from temporary rollback copy: ${rollback.slice(Math.max(0, rollback.indexOf("coreProjectApprovalFormStaticConfiguration") - 80), rollback.indexOf("coreProjectApprovalFormStaticConfiguration") + 120)}`);
assert(readFileSync(resolve(root, "scripts/lib/approval-form-layout-builder.mjs"), "utf8").includes("projectApprovalFormSubListLookupStaticConfiguration"), "Phase 18B Lookup preservation route must remain unchanged");
for (const name of names) assert(rollback.includes(functionSource(baseline, name)), `baseline body restored: ${name}`);
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-wave3-batch-g-rollback-"));
try {
  const candidate = resolve(temporary, "materialize-full-app-generated-final.rollback.mjs");
  writeFileSync(candidate, rollback);
  execFileSync(process.execPath, ["--check", candidate], { stdio: "pipe" });
  console.log("CORE_EXTRACTION_WAVE3_BATCH_G_LEGACY_ROLLBACK_PASSED");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(skillRoot, "scripts/validate-attachment-patterns.mjs");

const passing = spawnSync(process.execPath, [validator, "--compile"], { encoding: "utf8" });
assert.equal(passing.status, 0, passing.stdout + passing.stderr);

const temporary = mkdtempSync(resolve(tmpdir(), "yf-attachment-pattern-"));
try {
  const copied = resolve(temporary, "yeeflow-custom-code-generator");
  cpSync(skillRoot, copied, { recursive: true });
  const reference = resolve(copied, "references/attachment-and-ai-recognition-golden-reference.md");
  writeFileSync(reference, readFileSync(reference, "utf8").replace("deleteMissing: false", "deleteMissing omitted"));
  const failing = spawnSync(process.execPath, [resolve(copied, "scripts/validate-attachment-patterns.mjs")], { encoding: "utf8" });
  assert.notEqual(failing.status, 0, "validator rejects a missing DefResource safety invariant");
  assert.match(failing.stderr, /ATTACHMENT_PATTERN_REQUIRED_TEXT_MISSING/);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

console.log(JSON.stringify({ ok: true, gate: "custom-code-attachment-patterns", positiveCompile: true, negativeMutation: true }, null, 2));

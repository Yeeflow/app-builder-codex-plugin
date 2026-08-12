#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-knowledge-source-bindings.mjs");
const fixture = (name) => resolve(root, "fixtures/knowledge-source-bindings", name);

function invoke(name, args = [], expectedStatus = "pass") {
  try {
    const stdout = execFileSync(process.execPath, [validator, fixture(name), ...args], { encoding: "utf8" });
    const result = JSON.parse(stdout);
    assert.equal(result.status, expectedStatus);
    return result;
  } catch (error) {
    const stdout = error.stdout?.toString() ?? "";
    const result = JSON.parse(stdout);
    assert.equal(result.status, expectedStatus);
    return result;
  }
}

const valid = invoke("valid-app.json", ["--mode", "final"]);
assert.equal(valid.summary.knowledgeBindings, 1);
assert.deepEqual(valid.findings, []);

const unresolved = invoke("unresolved-source-app.json", ["--mode", "final"], "fail");
assert.ok(unresolved.findings.some((finding) => finding.code === "AI_KNOWLEDGE_SOURCE_UNRESOLVED"));

const unbound = invoke("unbound-claim-app.json", ["--mode", "final"], "fail");
assert.ok(unbound.findings.some((finding) => finding.code === "AI_KNOWLEDGE_CLAIM_UNBOUND"));

const deletion = invoke("valid-app.json", ["--mode", "final", "--delete-target", "knowledge-contract-library"], "fail");
assert.ok(deletion.findings.some((finding) => finding.code === "KNOWLEDGE_DELETE_REFERENCED"));

console.log(JSON.stringify({ status: "pass", marker: "YEEFLOW_KNOWLEDGE_SOURCE_BINDINGS_PASSED" }));

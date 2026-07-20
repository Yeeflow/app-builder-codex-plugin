#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase9f-data-list-sublist-child-identity-provenance-audit.mjs");
const ledgerPath = "compatibility/capability-manifests/data-list-sublist-child-identity-provenance.v0.1.0.json";
const matrixPath = "compatibility/capability-manifests/data-list-sublist-child-identity-source-of-truth-timing.v0.1.0.json";
const temp = mkdtempSync(resolve(tmpdir(), "yeeflow-phase9f-provenance-"));
try {
  assert.equal(run().status, 0);
  expect(matrixPath, (value) => { value.identities.find((item) => item.identity === "rowSchemaId").status = "valid-host-provider"; }, "SUBLIST_LEGACY_ROW_SCHEMA_PROVIDER_INVALID");
  expect(matrixPath, (value) => { value.identities.find((item) => item.identity === "rowSchemaId").notes = "deterministic UUID is authoritative"; }, "SUBLIST_LEGACY_ROW_SCHEMA_PROVIDER_INVALID");
  expect(matrixPath, (value) => { value.identities.find((item) => item.identity === "childListId").source = { function: "buildDataListFormSubListControl", line: 4772, expression: "parent ListID" }; }, "SUBLIST_LEGACY_IDENTITY_PARENT_REUSE");
  expect(matrixPath, (value) => { value.identities.find((item) => item.identity === "childFieldId").representation = "number"; }, "SUBLIST_LEGACY_IDENTITY_PROVIDER_INVALID");
  expect(matrixPath, (value) => { value.coupledConsumerBoundary.consequence = "provider is generated after one consumer"; }, "SUBLIST_LEGACY_IDENTITY_POST_DIVERGENCE_PROVIDER");
  expect(matrixPath, (value) => { value.coupledConsumerBoundary.consumers.pop(); }, "SUBLIST_LEGACY_IDENTITY_PROVIDER_UNAVAILABLE_TO_CONSUMER");
  expect(ledgerPath, (value) => { value.source.sha256 = "tampered"; }, "SUBLIST_LEGACY_IDENTITY_PROVENANCE_SOURCE_DRIFT");
  expect("scripts/lib/materializer-core-adapter.mjs", (source) => `${source}\n// audit mutation\n`, "SUBLIST_LEGACY_IDENTITY_AUDIT_MUTATION", true, "--materializer-adapter");
  console.log("SUBLIST_LEGACY_IDENTITY_PROVENANCE_REGRESSIONS_PASSED cases=8");
} finally { rmSync(temp, { recursive: true, force: true }); }

function expect(path, transform, code, raw = false, option) { const target = resolve(temp, path.replaceAll("/", "_")); const original = readFileSync(resolve(root, path), "utf8"); let value = original; if (raw) value = transform(original); else { const parsed = JSON.parse(original); transform(parsed); value = `${JSON.stringify(parsed, null, 2)}\n`; } writeFileSync(target, value, "utf8"); const args = option ? [option, target] : path === ledgerPath ? ["--ledger", target] : ["--matrix", target]; const result = run(args); assert.notEqual(result.status, 0, `${code} must fail`); assert.match(`${result.stdout}${result.stderr}`, new RegExp(code)); }
function run(args = []) { return spawnSync(process.execPath, [validator, ...args], { cwd: root, encoding: "utf8" }); }

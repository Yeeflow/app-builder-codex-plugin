#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase9e-data-list-sublist-child-resource-inventory-integration-readiness.mjs");
const contractPath = "compatibility/capability-manifests/data-list-sublist-child-resource-inventory-post-allocation-integration-readiness.v0.1.0.json";
const flowPath = "compatibility/capability-manifests/data-list-sublist-child-resource-inventory-post-allocation-identity-flow.v0.1.0.json";
const temp = mkdtempSync(resolve(tmpdir(), "yeeflow-phase9e-readiness-"));
try {
  assert.equal(run().status, 0);
  expect(contractPath, (value) => { value.decision.status = "accepted"; }, "SUBLIST_CHILD_RESOURCE_INVENTORY_INTEGRATION_DECISION_INVALID");
  expect(flowPath, (value) => { value.identities.find((item) => item.identity === "childListId").source = "plan idx"; }, "SUBLIST_CHILD_RESOURCE_INTEGRATION_IDENTITY_OMITTED");
  expect(flowPath, (value) => { value.identities.find((item) => item.identity === "childFieldId").representation = "number"; }, "SUBLIST_CHILD_RESOURCE_INTEGRATION_IDENTITY_OMITTED");
  expect(flowPath, (value) => { value.identities = value.identities.filter((item) => item.identity !== "rowSchemaId"); }, "SUBLIST_CHILD_RESOURCE_INTEGRATION_IDENTITY_OMITTED");
  expect(flowPath, (value) => { value.coupledConsumers.pop(); }, "SUBLIST_CHILD_RESOURCE_INTEGRATION_ONE_CONSUMER_ONLY");
  expect(flowPath, (value) => { value.minimalFutureIntegrationPoint.position = "before API allocation"; }, "SUBLIST_CHILD_RESOURCE_INTEGRATION_BOUNDARY_INVALID");
  expect("scripts/lib/local-runtime-core-adapter.mjs", (source) => `${source}\n// audit mutation\n`, "SUBLIST_CHILD_RESOURCE_INTEGRATION_AUDIT_MUTATION", true, "--runtime-adapter");
  expect("scripts/materialize-full-app-generated-final.mjs", (source) => `${source}\n// forbidden route mutation\n`, "SUBLIST_CHILD_RESOURCE_INTEGRATION_SOURCE_DRIFT", true, "--source");
  console.log("SUBLIST_CHILD_RESOURCE_INVENTORY_INTEGRATION_READINESS_REGRESSIONS_PASSED cases=8");
} finally { rmSync(temp, { recursive: true, force: true }); }

function expect(path, transform, code, raw = false, option) { const target = resolve(temp, path.replaceAll("/", "_")); const original = readFileSync(resolve(root, path), "utf8"); let value = original; if (raw) value = transform(original); else { const parsed = JSON.parse(original); transform(parsed); value = `${JSON.stringify(parsed, null, 2)}\n`; } writeFileSync(target, value, "utf8"); const args = option ? [option, target] : path === contractPath ? ["--contract", target] : ["--flow", target]; const result = run(args); assert.notEqual(result.status, 0, `${code} must fail`); assert.match(`${result.stdout}${result.stderr}`, new RegExp(code)); }
function run(args = []) { return spawnSync(process.execPath, [validator, ...args], { cwd: root, encoding: "utf8" }); }

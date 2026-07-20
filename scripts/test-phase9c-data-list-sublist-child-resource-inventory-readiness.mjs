#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase9c-data-list-sublist-child-resource-inventory-readiness.mjs");
const apiPath = "compatibility/capability-manifests/data-list-sublist-child-resource-inventory-local-runtime-public-api-readiness.v0.1.0.json";
const distributionPath = "compatibility/capability-manifests/data-list-sublist-child-resource-inventory-local-runtime-distribution-readiness.v0.1.0.json";
const runtimeIndexPath = "runtimes/app-builder-core-local-runtime/src/index.ts";
const temp = mkdtempSync(resolve(tmpdir(), "yeeflow-phase9c-readiness-"));
try {
  assert.equal(run().status, 0);
  expect(apiPath, (value) => { value.inputBoundary.prohibited = value.inputBoundary.prohibited.filter((item) => item !== "allocation authority"); }, "SUBLIST_CHILD_RESOURCE_INVENTORY_PUBLIC_API_LEAKAGE");
  expect(apiPath, (value) => { value.errorContract.codes.pop(); }, "SUBLIST_CHILD_RESOURCE_INVENTORY_ERROR_CONTRACT_INVALID");
  expect(distributionPath, (value) => { value.futurePromotionProof = value.futurePromotionProof.filter((item) => item !== "temporary official ZIP extraction"); }, "SUBLIST_CHILD_RESOURCE_INVENTORY_DISTRIBUTION_PROOF_INCOMPLETE");
  expect(distributionPath, (value) => { value.futureRoutingPrerequisites = value.futureRoutingPrerequisites.filter((item) => item !== "one shared inventory selection supplied to both buildDataListFormSubListControl and buildFieldRules"); }, "SUBLIST_CHILD_RESOURCE_INVENTORY_ROUTING_PLAN_INCOMPLETE");
  expect(runtimeIndexPath, (source) => `${source}\nexport { buildDataListSublistChildResourceInventoryInternal } from "./internal-data-list-sublist-child-resource-inventory.js";\n`, "SUBLIST_CHILD_RESOURCE_INVENTORY_ACCIDENTAL_PUBLIC_PROMOTION", true);
  expect("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs", (source) => `${source}\nexport const buildDataListSublistChildResourceInventoryInternal = () => {};\n`, "SUBLIST_CHILD_RESOURCE_INVENTORY_ACCIDENTAL_PUBLIC_PROMOTION", true, "--artifact");
  console.log("SUBLIST_CHILD_RESOURCE_INVENTORY_DISTRIBUTION_READINESS_REGRESSIONS_PASSED cases=6");
} finally { rmSync(temp, { recursive: true, force: true }); }

function expect(path, transform, code, raw = false, option) { const target = resolve(temp, path.replaceAll("/", "_")); const original = readFileSync(resolve(root, path), "utf8"); let value = original; if (raw) value = transform(original); else { const parsed = JSON.parse(original); transform(parsed); value = `${JSON.stringify(parsed, null, 2)}\n`; } writeFileSync(target, value, "utf8"); const args = option ? [option, target] : path === apiPath ? ["--api-contract", target] : path === distributionPath ? ["--distribution-contract", target] : ["--runtime-index", target]; const result = run(args); assert.notEqual(result.status, 0, `${code} must fail`); assert.match(`${result.stdout}${result.stderr}`, new RegExp(code)); }
function run(args = []) { return spawnSync(process.execPath, [validator, ...args], { cwd: root, encoding: "utf8" }); }

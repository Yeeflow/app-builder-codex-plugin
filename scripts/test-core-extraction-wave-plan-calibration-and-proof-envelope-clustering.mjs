#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-core-extraction-wave-plan-calibration-and-proof-envelope-clustering.mjs");
const inventoryPath = resolve(root, "compatibility/capability-manifests/core-extraction-production-ownership-inventory.v0.1.0.json");
const registryPath = resolve(root, "compatibility/capability-manifests/core-extraction-proof-envelope-registry.v0.1.0.json");
const planPath = resolve(root, "compatibility/capability-manifests/core-extraction-finite-wave-plan.v0.2.0.json");
const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));
const registry = JSON.parse(readFileSync(registryPath, "utf8"));
const plan = JSON.parse(readFileSync(planPath, "utf8"));
const temp = mkdtempSync(resolve(tmpdir(), "yeeflow-core-envelope-"));
try {
  assert.equal(run(inventoryPath, registryPath, planPath).status, 0);
  expect(mutateRegistry((value) => { value.assignments.pop(); }), null, "CORE_EXTRACTION_ENVELOPE_UNASSIGNED_FUNCTION");
  expect(mutateRegistry((value) => { value.envelopes[1].functionIds.push(value.envelopes[0].functionIds[0]); }), null, "CORE_EXTRACTION_ENVELOPE_OVERLAP");
  expect(mutateRegistry((value) => { value.envelopes[0].memberSurfaces = ["dashboard-static-configuration"]; }), null, "CORE_EXTRACTION_ENVELOPE_CROSS_SURFACE_GROUPING");
  expect(mutateRegistry((value) => { value.assignments[0].productRuntimeSignals = ["browser event"]; }), null, "CORE_EXTRACTION_ENVELOPE_MUTABLE_RUNTIME_MEMBER");
  expect(mutateRegistry((value) => { value.assignments[0].dependencies.importedModules = ["@yeeflow/browser-runtime"]; }), null, "CORE_EXTRACTION_ENVELOPE_FORBIDDEN_CORE_DEPENDENCY");
  const inventoryMutation = structuredClone(inventory); inventoryMutation.functions.find((item) => item.id === registry.assignments[0].functionId).category = "host-runtime";
  expect(null, inventoryMutation, "CORE_EXTRACTION_ENVELOPE_HOST_MEMBER");
  console.log("CORE_EXTRACTION_PROOF_ENVELOPE_REGRESSIONS_PASSED cases=7");
} finally { rmSync(temp, { recursive: true, force: true }); }
function mutateRegistry(change) { const value = structuredClone(registry); change(value); const path = resolve(temp, `registry-${Math.random().toString(36).slice(2)}.json`); writeFileSync(path, `${JSON.stringify(value)}\n`); return path; }
function mutateInventory(value) { const path = resolve(temp, `inventory-${Math.random().toString(36).slice(2)}.json`); writeFileSync(path, `${JSON.stringify(value)}\n`); return path; }
function run(inventoryArgument, registryArgument, planArgument) { return spawnSync(process.execPath, [validator, "--inventory", inventoryArgument, "--registry", registryArgument, "--plan", planArgument], { cwd: root, encoding: "utf8" }); }
function expect(registryArgument, inventoryValue, code) { const result = run(inventoryValue ? mutateInventory(inventoryValue) : inventoryPath, registryArgument || registryPath, planPath); assert.notEqual(result.status, 0); assert.match(result.stdout + result.stderr, new RegExp(code)); }

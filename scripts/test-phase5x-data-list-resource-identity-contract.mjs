#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), ".."); const source = resolve(root, "compatibility/capability-manifests/data-list-resource-identity-allocation-contract.v0.1.0.json"); const validator = resolve(root, "scripts/validate-phase5x-data-list-resource-identity-contract.mjs"); const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase5x-identity-contract-"));
try { assert.equal(run(source).status, 0); for (const [id, mutate, code] of [["uuid", v => v.coreContract.prohibitions = v.coreContract.prohibitions.filter(x => x !== "crypto.randomUUID"), "DATA_LIST_IDENTITY_CORE_BOUNDARY_INVALID"], ["numeric", v => v.identityFlowMatrix.find(x => x.identity === "FieldID").representation = "number", "DATA_LIST_IDENTITY_FLOW_INCOMPLETE"], ["collision", v => v.hostContract.validationErrors = v.hostContract.validationErrors.filter(x => x !== "DATA_LIST_IDENTITY_ALLOCATION_COLLISION"), "DATA_LIST_IDENTITY_VALIDATION_INCOMPLETE"], ["rollback", v => v.futurePhase5Y.proof = [], "DATA_LIST_IDENTITY_ROUTING_PROOF_MISSING"]]) { const p = resolve(temporary, `${id}.json`); const v = JSON.parse(readFileSync(source, "utf8")); mutate(v); writeFileSync(p, `${JSON.stringify(v, null, 2)}\n`); const result = run(p); assert.notEqual(result.status, 0); assert.match(result.output, new RegExp(code)); } console.log("DATA_LIST_RESOURCE_IDENTITY_CONTRACT_REGRESSIONS_PASSED cases=4"); } finally { rmSync(temporary, { recursive: true, force: true }); }
function run(path) { const r = spawnSync(process.execPath, [validator, path], { cwd: root, encoding: "utf8" }); return { status: r.status, output: `${r.stdout}${r.stderr}` }; }

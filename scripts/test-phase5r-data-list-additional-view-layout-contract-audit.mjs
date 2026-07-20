#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase5r-data-list-additional-view-layout-contract-audit.mjs");
const source = resolve(root, "scripts/materialize-full-app-generated-final.mjs");
const contract = resolve(root, "compatibility/capability-manifests/data-list-additional-view-layout-contract-audit.v0.1.0.json");
const matrix = resolve(root, "compatibility/capability-manifests/data-list-additional-view-layout-capability-matrix.v0.1.0.json");
const reconciliation = resolve(root, "compatibility/capability-manifests/phase-5r-additional-view-historical-lineage-reconciliation.v0.1.0.json");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase5r-additional-view-audit-"));

try {
  assert.equal(run(root, source, contract, matrix, reconciliation).status, 0);
  expectFailure("additional-routing", "DATA_LIST_ADDITIONAL_VIEW_ROUTING_FORBIDDEN", (paths) => writeFileSync(paths.source, readFileSync(source, "utf8").replace("routeAdditionalViewThroughCore: true", "routeAdditionalViewThroughCore: false"), "utf8"));
  expectFailure("default-proof-reused", "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_MATRIX_INCOMPLETE", (paths) => mutate(paths.contract, (value) => { value.differenceMatrix = value.differenceMatrix.filter((item) => item.capability !== "view-selection"); }));
  expectFailure("implicit-id", "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CONTRACT_INCOMPLETE", (paths) => mutate(paths.contract, (value) => { value.selectedVertical.contract.fieldIdentity = "Implicit host identity lookup."; }));
  expectFailure("missing-runtime-lowering", "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CONTRACT_INCOMPLETE", (paths) => mutate(paths.contract, (value) => { value.selectedVertical.contract.hostLowering = "Host behavior is deferred."; }));
  expectFailure("cross-resource", "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CONTRACT_SCOPE_INVALID", (paths) => mutate(paths.contract, (value) => { value.selectedVertical.contract.input = "DataListAdditionalViewLayoutProjectionInput { isDefault: true, dashboardReference }"; }));
  console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_AUDIT_REGRESSIONS_PASSED cases=5");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

function expectFailure(id, code, mutateFixture) {
  const paths = fixture(id);
  mutateFixture(paths);
  const result = spawnSync(process.execPath, [validator, "--source", paths.source, "--contract", paths.contract, "--matrix", paths.matrix], { cwd: root, encoding: "utf8" });
  assert.notEqual(result.status, 0, `${id} must fail.`);
  assert.match(`${result.stdout}\n${result.stderr}`, new RegExp(code), `${id} must emit ${code}.`);
}
function run(cwd, sourcePath, contractPath, matrixPath, reconciliationPath) { const result = spawnSync(process.execPath, [validator, "--source", sourcePath, "--contract", contractPath, "--matrix", matrixPath, "--reconciliation", reconciliationPath], { cwd, encoding: "utf8" }); return { status: result.status, output: `${result.stdout}\n${result.stderr}` }; }
function fixture(id) { const directory = resolve(temporary, id); const paths = { source: resolve(directory, "materializer.mjs"), contract: resolve(directory, "contract.json"), matrix: resolve(directory, "matrix.json"), reconciliation: resolve(directory, "reconciliation.json") }; cpSync(source, paths.source); cpSync(contract, paths.contract); cpSync(matrix, paths.matrix); cpSync(reconciliation, paths.reconciliation); return paths; }
function mutate(path, change) { const value = JSON.parse(readFileSync(path, "utf8")); change(value); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }

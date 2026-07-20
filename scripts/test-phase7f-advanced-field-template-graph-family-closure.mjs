#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = "compatibility/capability-manifests/data-list-advanced-field-template-graph-family-closure.v0.1.0.json";
const validator = resolve(root, "scripts/validate-phase7f-advanced-field-template-graph-family-closure.mjs");
const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
const originalLineage = readFileSync(resolve(root, lineagePath), "utf8");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase7f-closure-"));
const cases = [
  { id: "department-identity-alias", code: "ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_DEPARTMENT_SEMANTICS_INVALID", mutate: (value) => { value.categories.find((item) => item.id === "department-control-semantics").reusesIdentityRoute = true; } },
  { id: "sublist-flat-placement", code: "ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_SUBLIST_SCOPE_INVALID", mutate: (value) => { value.categories.find((item) => item.id === "sublist-row-schema-nested-controls").treatsNestedControlsAsFlatPlacement = true; } },
  { id: "binary-generic-placement", code: "ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_BINARY_SCOPE_INVALID", mutate: (value) => { value.categories.find((item) => item.id === "file-image-binary-controls").treatsBinaryAsGeneric = true; } },
  { id: "lookup-resolution-confusion", code: "ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_LOOKUP_SCOPE_INVALID", mutate: (value) => { value.categories.find((item) => item.id === "lookup-control-placement").usesLookupResolutionOnly = true; } },
  { id: "omitted-eligible-family", code: "ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_CATEGORY_OMITTED", mutate: (value) => { value.categories = value.categories.filter((item) => item.id !== "newedit-and-unclassified-advanced-controls"); } },
  { id: "audit-route-mutation", code: "ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_CLOSURE_BLOCKED_ELIGIBLE_VERTICAL", mutate: (value) => { value.closureCriteria.routeOrApiOrArtifactMutationDuringAudit = true; } },
];
try {
  for (const testCase of cases) runCase(testCase);
  writeFileSync(resolve(root, lineagePath), `${originalLineage}\n`, "utf8");
  const lineage = run();
  assert.notEqual(lineage.status, 0);
  assert.match(lineage.output, /PHASE_CLOSURE_PROOF_LINEAGE_INVALID/);
  writeFileSync(resolve(root, lineagePath), originalLineage, "utf8");
  console.log(`ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_CLOSURE_REGRESSIONS_PASSED cases=${cases.length + 1}`);
} finally {
  writeFileSync(resolve(root, lineagePath), originalLineage, "utf8");
  rmSync(temporary, { recursive: true, force: true });
}
function runCase(testCase) { const value = JSON.parse(readFileSync(resolve(root, contractPath), "utf8")); testCase.mutate(value); const target = resolve(temporary, `${testCase.id}.json`); writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8"); const result = run(target); assert.notEqual(result.status, 0, testCase.id); assert.match(result.output, new RegExp(testCase.code), testCase.id); }
function run(contract) { const args = contract ? [validator, "--contract", contract] : [validator]; const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" }); return { status: result.status, output: `${result.stdout}\n${result.stderr}` }; }

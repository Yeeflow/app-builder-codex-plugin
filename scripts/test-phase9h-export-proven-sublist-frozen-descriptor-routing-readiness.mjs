#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase9h-export-proven-sublist-frozen-descriptor-routing-readiness.mjs");
const matrixPath = "compatibility/capability-manifests/data-list-sublist-embedded-schema-pre-divergence-timing.v0.1.0.json";
const contractPath = "compatibility/capability-manifests/data-list-sublist-embedded-schema-frozen-descriptor-routing-readiness.v0.1.0.json";
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const corePath = "packages/app-builder-core-materializer/src/internal/data-list-sublist-embedded-schema.ts";
const temp = mkdtempSync(resolve(tmpdir(), "yeeflow-phase9h-routing-readiness-"));
try {
  assert.equal(run().status, 0);
  mutateJson(matrixPath, (value) => { value.source.calls.dataListSubListVariables = [4960]; }, "SUBLIST_EMBEDDED_SCHEMA_PRE_DIVERGENCE_MATRIX_INVALID");
  mutateJson(contractPath, (value) => { value.descriptor.idAndIdxSemantics = "id is child FieldID"; }, "SUBLIST_CHILD_IDENTITY_PREREQUISITE_RESTORED");
  mutateJson(contractPath, (value) => { value.route.descriptorCountPerParentField = 2; }, "SUBLIST_EMBEDDED_SCHEMA_SHARED_DESCRIPTOR_INVALID");
  mutateJson(contractPath, (value) => { value.route.selectionOwner = "buildFieldRules"; }, "SUBLIST_EMBEDDED_SCHEMA_SHARED_DESCRIPTOR_INVALID");
  mutateJson(contractPath, (value) => { value.excludedFirstRoute = value.excludedFirstRoute.filter((item) => item !== "summaries"); }, "SUBLIST_EMBEDDED_SCHEMA_FIRST_ROUTE_SCOPE_INVALID");
  mutateJson(contractPath, (value) => { value.excludedFirstRoute = value.excludedFirstRoute.filter((item) => item !== "template mutation"); }, "SUBLIST_EMBEDDED_SCHEMA_FIRST_ROUTE_SCOPE_INVALID");
  mutateJson(contractPath, (value) => { value.excludedFirstRoute = value.excludedFirstRoute.filter((item) => item !== "caller-owned findings mutation"); }, "SUBLIST_EMBEDDED_SCHEMA_FIRST_ROUTE_SCOPE_INVALID");
  mutateJson(contractPath, (value) => { value.preserved.adaptersChanged = true; }, "SUBLIST_EMBEDDED_SCHEMA_PREMATURE_ROUTE_CHANGE");
  mutateRaw(sourcePath, (value) => `${value}\n// DATA_LIST_SUBLIST_FROZEN_DESCRIPTOR_CORE_ROUTE_START\n`, "SUBLIST_EMBEDDED_SCHEMA_PRE_DIVERGENCE_SOURCE_DRIFT", "--source");
  mutateRaw(corePath, (value) => `import Git from \"git\";\n${value}`, "SUBLIST_EMBEDDED_SCHEMA_FORBIDDEN_CORE_DEPENDENCY", "--core");
  console.log("SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_READINESS_REGRESSIONS_PASSED cases=11");
} finally { rmSync(temp, { recursive: true, force: true }); }

function run(args = []) { const result = spawnSync(process.execPath, [validator, ...args], { cwd: root, encoding: "utf8" }); return { status: result.status, output: `${result.stdout}${result.stderr}` }; }
function mutateJson(path, transform, code) { const value = JSON.parse(readFileSync(resolve(root, path), "utf8")); transform(value); const target = resolve(temp, path.replaceAll("/", "_")); writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8"); const option = path === matrixPath ? "--matrix" : "--contract"; const result = run([option, target]); assert.notEqual(result.status, 0, code); assert.match(result.output, new RegExp(code)); }
function mutateRaw(path, transform, code, option) { const target = resolve(temp, path.replaceAll("/", "_")); writeFileSync(target, transform(readFileSync(resolve(root, path), "utf8")), "utf8"); const result = run([option, target]); assert.notEqual(result.status, 0, code); assert.match(result.output, new RegExp(code)); }

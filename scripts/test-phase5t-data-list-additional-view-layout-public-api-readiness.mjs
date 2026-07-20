#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase5t-data-list-additional-view-layout-public-api-readiness.mjs");
const readiness = resolve(root, "compatibility/capability-manifests/data-list-additional-view-layout-public-api-readiness.v0.1.0.json");
const index = resolve(root, "packages/app-builder-core-materializer/src/index.ts");
const materializer = resolve(root, "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const distribution = resolve(root, "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json");
const runtime = resolve(root, "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase5t-additional-view-readiness-"));

try {
  assert.equal(run({}).status, 0, "The valid Phase 5T readiness audit must pass.");
  negative("default-evidence", (value) => { value.revalidation.phase5SShadow = { marker: "DATA_LIST_DEFAULT_VIEW_LAYOUT_INTERNAL_SHADOW_IMPLEMENTED", parityCases: 12, viewScopeCount: 1 }; }, "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_READINESS_EVIDENCE_MISSING");
  negative("host-leakage", (value) => { value.prospectivePublicApi.prohibitedPublicShapes = value.prospectivePublicApi.prohibitedPublicShapes.filter((item) => item !== "URL"); }, "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_API_LEAKAGE");
  negative("scope", (value) => { value.prospectivePublicApi.requiredSemantics = value.prospectivePublicApi.requiredSemantics.filter((item) => item !== "viewScope does not end with /default"); }, "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_NON_DEFAULT_SCOPE_MISSING");
  negative("runtime", (value) => { value.interArtifactResponsibilities.localRuntime = "No distributed lowering dependency."; }, "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_LOCAL_RUNTIME_DEPENDENCY_MISSING");
  negative("plans", (value) => { value.futureDistributionEvidence.requiredProof = []; value.futureSelectiveRoutingEvidence.requiredProof = []; }, "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_DISTRIBUTION_PLAN_MISSING");
  negative("promotion", (value) => { value.prospectivePublicApi.runtimeFunction = "projectDataListAdditionalViewLayout"; }, "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_ACCIDENTAL_PUBLIC_PROMOTION", { materializerMutation: (value) => { value.runtimeExports = value.runtimeExports.filter((item) => item !== "projectDataListAdditionalViewLayout"); } });
  console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_API_READINESS_REGRESSIONS_PASSED cases=6");
} finally { rmSync(temporary, { recursive: true, force: true }); }

function negative(id, mutate, code, options = {}) { const paths = fixture(id); if (mutate) { const value = JSON.parse(readFileSync(paths.readiness, "utf8")); mutate(value); writeFileSync(paths.readiness, `${JSON.stringify(value, null, 2)}\n`, "utf8"); } if (options.indexAppend) writeFileSync(paths.index, `${readFileSync(paths.index, "utf8")}${options.indexAppend}`, "utf8"); if (options.materializerMutation) { const value = JSON.parse(readFileSync(paths.materializer, "utf8")); options.materializerMutation(value); writeFileSync(paths.materializer, `${JSON.stringify(value, null, 2)}\n`, "utf8"); } const result = run(paths); assert.notEqual(result.status, 0, `${id} must fail.`); assert.match(result.output, new RegExp(code), `${id} must emit ${code}.`); }
function fixture(id) { const paths = { readiness: resolve(temporary, `${id}.readiness.json`), index: resolve(temporary, `${id}.index.ts`), materializer: resolve(temporary, `${id}.materializer.json`), distribution: resolve(temporary, `${id}.distribution.json`), runtime: resolve(temporary, `${id}.runtime.json`) }; for (const [key, path] of Object.entries(paths)) cpSync({ readiness, index, materializer, distribution, runtime }[key], path); return paths; }
function run(paths) { const args = paths.readiness ? ["--readiness", paths.readiness, "--public-index", paths.index, "--materializer-contract", paths.materializer, "--distribution-contract", paths.distribution, "--runtime-contract", paths.runtime] : []; const result = spawnSync(process.execPath, [validator, ...args], { cwd: root, encoding: "utf8" }); return { status: result.status, output: `${result.stdout || ""}${result.stderr || ""}` }; }

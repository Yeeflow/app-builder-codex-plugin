#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase5o-data-list-default-view-layout-public-api-readiness.mjs");
const readiness = resolve(root, "compatibility/capability-manifests/data-list-default-view-layout-public-api-readiness.v0.1.0.json");
const publicIndex = resolve(root, "packages/app-builder-core-materializer/src/index.ts");
const publicContract = resolve(root, "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const distributionContract = resolve(root, "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json");
const runtimeContract = resolve(root, "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase5o-layoutview-readiness-"));

try {
  assert.equal(run({}).status, 0, "The valid Phase 5O audit must pass.");
  negative("public-leakage", (value) => { value.prospectivePublicApi.prohibitedPublicShapes = []; }, "DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_LEAKAGE");
  negative("runtime-dependency", (value) => { value.interArtifactResponsibilities.localRuntime = "none"; }, "DATA_LIST_DEFAULT_VIEW_LAYOUT_INTER_ARTIFACT_BOUNDARY_INVALID");
  negative("serialization-policy", (value) => { delete value.prospectivePublicApi.serialization; }, "DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_POLICY_MISSING");
  negative("phase5p", (value) => { value.phase5PDistributionPromotion.requiredProof = []; }, "DATA_LIST_DEFAULT_VIEW_LAYOUT_PHASE5P_PROOF_MISSING");
  negative("phase5q", (value) => { value.phase5QRoutingProof.requiredProof = []; }, "DATA_LIST_DEFAULT_VIEW_LAYOUT_PHASE5Q_PROOF_MISSING");
  console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_READINESS_REGRESSIONS_PASSED cases=5");
} finally { rmSync(temporary, { recursive: true, force: true }); }

function negative(id, mutate, code) {
  const paths = { readiness: resolve(temporary, `${id}.readiness.json`), index: resolve(temporary, `${id}.index.ts`), public: resolve(temporary, `${id}.public.json`), distribution: resolve(temporary, `${id}.distribution.json`), runtime: resolve(temporary, `${id}.runtime.json`) };
  cpSync(readiness, paths.readiness); cpSync(publicIndex, paths.index); cpSync(publicContract, paths.public); cpSync(distributionContract, paths.distribution); cpSync(runtimeContract, paths.runtime);
  const value = JSON.parse(readFileSync(paths.readiness, "utf8")); mutate(value); writeFileSync(paths.readiness, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  const result = run(paths);
  assert.notEqual(result.status, 0, `${id} must fail.`);
  assert.match(result.output, new RegExp(code), `${id} must emit ${code}.`);
}
function run(paths) {
  const values = paths.readiness ? ["--readiness", paths.readiness, "--public-index", paths.index, "--public-contract", paths.public, "--distribution-contract", paths.distribution, "--runtime-contract", paths.runtime] : [];
  const result = spawnSync(process.execPath, [validator, ...values], { cwd: root, encoding: "utf8" });
  return { status: result.status, output: `${result.stdout || ""}${result.stderr || ""}` };
}

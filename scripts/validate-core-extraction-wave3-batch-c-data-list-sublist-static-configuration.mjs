#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), ".."); const read = (path) => readFileSync(resolve(root, path), "utf8"); const json = (path) => JSON.parse(read(path));
const contract = json("compatibility/capability-manifests/core-extraction-wave3-batch-c-data-list-sublist-static-configuration.v0.1.0.json"); const lineage = json("compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json"); const transition = lineage.approvedTransitions.find((entry) => entry.phase === contract.phase); const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
assert.equal(contract.marker, "CORE_EXTRACTION_WAVE3_BATCH_C_DATA_LIST_SUBLIST_STATIC_CONFIGURATION_EXECUTION_PASSED"); assert.ok(contract.requiredMarkers.includes("PHASE_CLOSURE_PROOF_LINEAGE_VALID")); assert.ok(transition, "CORE_EXTRACTION_WAVE3_BATCH_C_LINEAGE_TRANSITION_MISSING"); assert.equal(transition.kind, "routing"); assert.equal(transition.promotionContractSha256, sha(read(transition.promotionContractPath))); assert.equal(transition.promotionReportSha256, sha(read(transition.promotionReportPath))); assert.equal(transition.sourceTransition.afterSha256, sha(read("scripts/materialize-full-app-generated-final.mjs"))); const materializer = distribution.artifacts.find((entry) => entry.packageName === "@yeeflow/app-builder-core-materializer"); assert.equal(transition.artifactState["@yeeflow/app-builder-core-materializer"].sha256, materializer.sha256); assert.equal(contract.historicalZipSha256, shaBytes("dist/yeeflow-app-builder-plugin-0.9.71.zip"));
console.log("CORE_EXTRACTION_WAVE3_BATCH_C_VALIDATION_PASSED");
function sha(value) { return createHash("sha256").update(value).digest("hex"); } function shaBytes(path) { return createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex"); }

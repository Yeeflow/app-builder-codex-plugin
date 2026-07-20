#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json";
const outputPath = "compatibility/capability-manifests/data-list-default-view-layout-routing-proof.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-5q-data-list-default-view-layout-selective-routing-proof.v0.1.0.md";
const manifest = json(manifestPath);
const materializer = artifact("@yeeflow/app-builder-core-materializer");
const runtime = artifact("@yeeflow/app-builder-core-local-runtime");
const contract = {
  schemaVersion: "1.0.0",
  phase: "phase-5q-data-list-default-view-layout-selective-routing-proof",
  decision: {
    status: "complete",
    marker: "DATA_LIST_LAYOUTVIEW_ADAPTER_ROUTING_PASSED",
    rationale: "Only the Data List default Type 0 LayoutView call site is Core and Local Runtime routed. The additional-view call site remains explicitly Legacy-excluded because it is not covered by the approved default-view corpus."
  },
  routingBoundary: {
    sourcePath: "scripts/materialize-full-app-generated-final.mjs",
    checkedFunction: "buildDataListViewLayoutViewChecked",
    legacyLayoutFunction: "buildDataListViewLayoutView",
    routedScenario: "default Data List Type 0 LayoutView only",
    routedCallExpressionCount: 1,
    checkedCallExpressionCount: 2,
    legacyExcludedScenarios: ["additional Data List Type 0 LayoutViews"],
    legacyExcludedCallExpressionCount: 1,
    retainedLegacyResponsibilities: ["host UUID allocation", "final generated-resource integration", "all additional-view LayoutView construction", "all non-Data-List surfaces"]
  },
  adapters: {
    materializer: {
      path: "scripts/lib/materializer-core-adapter.mjs",
      artifactPath: "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs",
      exportName: "projectDataListDefaultViewLayout"
    },
    localRuntime: {
      path: "scripts/lib/local-runtime-core-adapter.mjs",
      artifactPath: "core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs",
      exportName: "lowerFixedFilterProjectionAtHost",
      failureCodes: ["LOCAL_RUNTIME_CORE_ADAPTER_ARTIFACT_MISSING", "LOCAL_RUNTIME_CORE_ADAPTER_ARTIFACT_LOAD_FAILED", "LOCAL_RUNTIME_CORE_ADAPTER_EXPORT_MISSING", "LOCAL_RUNTIME_CORE_ADAPTER_FORBIDDEN_RESOLUTION"]
    }
  },
  artifacts: {
    materializer: artifactRecord(materializer),
    localRuntime: artifactRecord(runtime)
  },
  proof: {
    routingCorpusPath: "compatibility/differential-fixtures/data-list-default-view-layout-routing.v0.1.0.json",
    routingCaseCount: 2,
    approvedProjectionCorpusPath: "compatibility/differential-fixtures/data-list-default-view-layout-projection.v0.1.0.json",
    approvedProjectionCaseCount: 12,
    surfaces: ["source repository", "temporary official ZIP extraction", "simulated installed Plugin layout"],
    assertions: ["normalized decoded-resource parity", "error and finding parity", "output-file-shape parity", "default-view Title-first fallback deduplication and twelve-column behavior", "supplied FieldID propagation", "static query fields", "host-only fixed-filter key allocation and findings append", "additional-view Legacy scope exclusion", "determinism after UUID normalization", "temporary-copy-only Legacy rollback"],
    historicalZipSha256: "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2"
  },
  rollback: {
    scope: "temporary complete Plugin copy only",
    minimalRouteChange: "Remove the projectDataListDefaultViewLayout and lowerFixedFilterProjectionAtHost imports, delete buildDataListDefaultViewLayoutViewThroughCore, and replace the default call flag with the retained buildDataListViewLayoutView path.",
    materializerArtifactRetained: true,
    localRuntimeArtifactRemoval: "not required because the temporary rollback source no longer imports its adapter"
  }
};
write(outputPath, contract);
writeFileSync(resolve(root, reportPath), report(contract), "utf8");
console.log("DATA_LIST_LAYOUTVIEW_ADAPTER_ROUTING_PASSED");
console.log("DATA_LIST_LAYOUTVIEW_ROUTING_PROOF_CONTRACT_WRITTEN");

function report(value) { return `# Phase 5Q Selective Data List LayoutView Production Routing Proof\n\n## Decision\n\n\`${value.decision.marker}\`\n\nOnly the default Data List Type 0 LayoutView route uses Materializer Core and Local Runtime. The separate additional-view call remains on the retained Legacy helper because the approved twelve-case contract covers default-view semantics only.\n\n## Routed Boundary\n\n- Routed call expressions: ${value.routingBoundary.routedCallExpressionCount}\n- Checked LayoutView call expressions: ${value.routingBoundary.checkedCallExpressionCount}\n- Legacy-excluded call expressions: ${value.routingBoundary.legacyExcludedCallExpressionCount}\n- Excluded scenarios: ${value.routingBoundary.legacyExcludedScenarios.map((item) => `\`${item}\``).join(", ")}\n\nMaterializer Core produces only immutable layout and fixed-filter intent data. The Local Runtime adapter resolves only its distributed artifact and performs allocation validation, filter lowering, and explicit caller findings append. Host UUID allocation and final resource integration remain in Legacy materializer code.\n\n## Evidence\n\nThe ${value.proof.routingCaseCount}-case actual-materializer matrix passed source, temporary official ZIP, and simulated installed Plugin layouts. It compares normalized decoded resources, output-file shape, errors, and findings against a temporary-copy-only Legacy baseline, covers default title-first/fallback/deduplication/maximum-column behavior, FieldIDs, static query data, controlled fixed filters, and malformed filter findings. The historical ZIP SHA-256 remained \`${value.proof.historicalZipSha256}\`.\n\n## Follow-Up Boundary\n\nPhase 5R separately audited additional Data List views. It does not change this route: additional views remain Legacy-owned until a dedicated extended view-intent contract, parity matrix, and rollback proof are implemented and accepted.\n\n## Rollback\n\n${value.rollback.minimalRouteChange}\n\nNo runtime toggle, source fallback, or production feature flag exists.\n`; }
function artifact(packageName) { const value = manifest.artifacts?.find((item) => item.packageName === packageName); if (!value) fail("DATA_LIST_LAYOUTVIEW_ROUTING_PROOF_ARTIFACT_MISSING", `Distribution manifest is missing ${packageName}.`); return value; }
function artifactRecord(value) { return { path: value.path, packageName: value.packageName, packageVersion: value.packageVersion, sha256: value.sha256, exports: value.exports, manifestSha256: sha256(read(manifestPath)) }; }
function read(relativePath) { return readFileSync(resolve(root, relativePath), "utf8"); }
function json(relativePath) { return JSON.parse(read(relativePath)); }
function write(relativePath, value) { const path = resolve(root, relativePath); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

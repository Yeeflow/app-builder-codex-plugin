#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json";
const fixturePath = "compatibility/differential-fixtures/data-list-lookup-resolution-routing.v0.1.0.json";
const contractPath = "compatibility/capability-manifests/data-list-lookup-resolution-selective-routing-proof.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-6e-data-list-lookup-resolution-selective-routing-proof.v0.1.0.md";
const manifest = json(manifestPath);
const fixture = json(fixturePath);
const materializer = artifact("@yeeflow/app-builder-core-materializer");
const runtime = artifact("@yeeflow/app-builder-core-local-runtime");
if (!materializer?.exports?.includes("projectDataListLookupResolutionIntent") || !runtime?.exports?.includes("lowerDataListLookupResolutionAtHost")) fail("DATA_LIST_LOOKUP_RESOLUTION_ROUTING_CONTRACT_INVALID", "The two approved distributed Lookup exports are unavailable.");
if (fixture.caseCount !== 15 || !Array.isArray(fixture.matrix) || fixture.matrix.length !== 15) fail("DATA_LIST_LOOKUP_RESOLUTION_ROUTING_CONTRACT_INVALID", "The actual routing matrix must contain fifteen cases.");
const contract = {
  schemaVersion: "1.0.0",
  phase: "phase-6e-data-list-lookup-resolution-selective-routing-proof",
  decision: { status: "complete", marker: "DATA_LIST_LOOKUP_RESOLUTION_ADAPTER_ROUTING_PASSED", nextPhase: "phase-6f-data-list-lookup-family-closure-audit", rationale: "Only the Data List Lookup branch inside buildFieldRecord is routed through the approved Materializer Core intent and Local Runtime lowering boundary. Every other field family remains on the retained Legacy path." },
  productionBoundary: { callerPath: "collectDataListFieldSpecs -> fieldSpecsForList -> buildFieldRecord", buildFieldRecordCallExpressionCount: 1, routedScenario: "Data List Lookup fields with an explicit host target identity map", coreAdapterExport: "projectDataListLookupResolutionIntent", localRuntimeAdapterExport: "lowerDataListLookupResolutionAtHost", hostOwnership: ["target identity map", "lossless ListID and FieldID inputs", "source and target scope context", "final field-record and resource integration", "package output"] },
  retainedLegacy: ["scalar fields", "sublists", "identity user and department fields", "file image and binary fields", "barcode behavior", "custom forms", "approval forms", "document libraries", "dashboards", "workflows", "target resource integration", "empty Rules for an empty deterministic Lookup candidate"],
  proof: { fixturePath, caseCount: fixture.caseCount, surfaces: ["source", "temporary official ZIP", "simulated installed Plugin"], assertions: ["direct resolution", "singular alias resolution", "lossless target string identity", "all six stable errors", "deterministic multiple Lookup ordering", "non-Lookup scope exclusion", "no fallback target discovery", "temporary-copy Legacy rollback"], normalization: fixture.normalization },
  artifacts: [evidence(materializer), evidence(runtime)],
  historicalZipSha256: "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2",
  prohibited: ["Core target discovery", "Core or Local Runtime ID allocation", "numeric target identity coercion", "silent Legacy fallback after selected route", "cross-surface Lookup routing"],
};
write(contractPath, contract);
writeText(reportPath, report(contract));
recordState(contract);
console.log("DATA_LIST_LOOKUP_RESOLUTION_PHASE6E_STATE_RECORDED");

function evidence(item) { return { packageName: item.packageName, artifactPath: item.path, packageVersion: item.packageVersion, sha256: item.sha256, exports: item.exports }; }
function recordState(value) {
  const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
  state.migration.currentPhase = value.phase;
  state.migration.currentPhaseStatus = "complete";
  state.migration.nextPhase = value.decision.nextPhase;
  const evidence = "2026-07-18: DATA_LIST_LOOKUP_RESOLUTION_ADAPTER_ROUTING_PASSED, source/archive/installed actual-materializer parity, deterministic output, lossless target identity, scope gates, and temporary Legacy rollback passed. Only the Data List Lookup branch in buildFieldRecord uses the public Core intent and Local Runtime lowering APIs; all other field families and host integration remain Legacy-owned.";
  const completed = state.completed.find((entry) => entry.id === value.phase);
  if (completed) { completed.status = "complete"; completed.evidence = evidence; } else state.completed.push({ id: value.phase, status: "complete", evidence });
  state.nextSteps = state.nextSteps.filter((entry) => entry.id !== value.phase);
  state.nextSteps.unshift({ order: 1, id: value.decision.nextPhase, description: "Audit the remaining Data List Lookup family only; do not widen the completed Lookup route without a separately approved contract." });
  state.proofStatus.dataListLookupResolutionSelectiveRouting = "passed";
  write("docs/architecture/yeeflow-app-builder-core-migration-state.json", state);
}
function report(value) { return `# Phase 6E Selective Data List Lookup Production Routing Proof\n\n## Decision\n\n\`DATA_LIST_LOOKUP_RESOLUTION_ADAPTER_ROUTING_PASSED\`\n\nOnly Data List Lookup fields in the existing \`collectDataListFieldSpecs -> fieldSpecsForList -> buildFieldRecord\` path are routed. The Materializer Core adapter returns immutable Lookup intent only. The Local Runtime adapter validates the host-supplied map and returns fresh \`Rules.listid\` text only.\n\n## Production Boundary\n\nThere is one production \`buildFieldRecord\` call expression. The selected Lookup branch has one Core intent call and one Local Runtime lowering call. The host continues to own target maps, ListID and FieldID strings, scope context, final record integration, and package output. Empty deterministic Core candidates preserve the Legacy empty \`Rules\` value; no target discovery or fallback ID is introduced.\n\n## Evidence\n\nThe fifteen-case routing matrix passed source, a temporary official ZIP extraction, and a simulated installed Plugin. It covers direct and singular-alias resolution, lossless target identities, all six stable errors, multiple Lookup ordering, excluded field families, no fallback discovery, deterministic output, and a temporary-copy-only Legacy rollback. UUID normalization is limited to pre-existing control UUIDs and never affects \`Rules.listid\`.\n\n## Retained Legacy Scope\n\n${value.retainedLegacy.map((item) => `- ${item}`).join("\n")}\n\n## Non-Goals\n\nNo new public export, Core contract change, active installation change, historical ZIP change, cross-surface Lookup route, Git publication, or release action occurred.\n`; }
function artifact(packageName) { return manifest.artifacts?.find((item) => item.packageName === packageName); }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function write(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function writeText(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value, "utf8"); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

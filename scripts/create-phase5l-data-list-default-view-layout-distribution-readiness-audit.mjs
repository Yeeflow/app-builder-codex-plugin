#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const internalPath = "packages/app-builder-core-materializer/src/internal/data-list-default-view-layout-projection.ts";
const publicIndexPath = "packages/app-builder-core-materializer/src/index.ts";
const publicContractPath = "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json";
const distributionContractPath = "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json";
const runtimeSourcePath = "runtimes/app-builder-core-local-runtime/src/index.ts";
const runtimePackagePath = "runtimes/app-builder-core-local-runtime/package.json";
const outputPath = "compatibility/capability-manifests/data-list-default-view-layout-distribution-readiness.v0.1.0.json";
const internalSource = read(internalPath);
const publicIndex = read(publicIndexPath);
const runtimeSource = read(runtimeSourcePath);
const publicContract = json(publicContractPath);
const distributionContract = json(distributionContractPath);
const runtimePackage = json(runtimePackagePath);
const internalAst = ts.createSourceFile(internalPath, internalSource, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
const internalFunction = "projectDataListDefaultViewLayoutInternal";
const prospectiveFunction = "projectDataListDefaultViewLayout";

if (!internalSource.includes(`function ${internalFunction}`)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_READINESS_INTERNAL_SHADOW_MISSING", "The Phase 5K internal LayoutView shadow is missing.");
if (!internalSource.includes("projectFixedFilterIntents")) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_READINESS_FIXED_FILTER_BOUNDARY_MISSING", "The internal LayoutView shadow does not consume the approved fixed-filter Core contract.");
if (!runtimeSource.includes("lowerFixedFilterProjectionAtHost")) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_READINESS_HOST_LOWERING_MISSING", "The Local Runtime fixed-filter lowering shadow is missing.");
if (hasNodeImport(internalAst) || /\b(?:crypto|randomUUID|fs|process|fetch|require)\b/u.test(internalSource)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_READINESS_CORE_HOST_LEAKAGE", "The internal LayoutView shadow has a prohibited host dependency.");

const materializerArtifact = (distributionContract.approvedArtifacts || []).find((artifact) => artifact.packageName === "@yeeflow/app-builder-core-materializer");
const localRuntimeArtifact = (distributionContract.approvedArtifacts || []).find((artifact) => artifact.packageName === "@yeeflow/app-builder-core-local-runtime");
const runtimeWorkspaceOnly = runtimePackage.private === true && !localRuntimeArtifact;
const readiness = {
  schemaVersion: "1.0.0",
  phase: "phase-5l-data-list-default-view-layout-distribution-readiness-audit",
  decision: {
    status: "rejected",
    marker: "DATA_LIST_DEFAULT_VIEW_LAYOUT_DISTRIBUTION_READINESS_REJECTED",
    rationale: "The deterministic Core shadow has a bounded prospective public contract, but complete LayoutView output requires host-owned fixed-filter lowering. lowerFixedFilterProjectionAtHost is currently a private workspace Local Runtime export with no separately versioned or distributed Plugin contract. Promoting the Core API before that companion contract would leave installed Plugin callers without a verified host-lowering boundary.",
  },
  sources: {
    internalShadow: { path: internalPath, sha256: sha256(internalSource), functionName: internalFunction },
    publicMaterializerIndex: { path: publicIndexPath, sha256: sha256(publicIndex) },
    publicMaterializerContract: { path: publicContractPath, sha256: sha256(JSON.stringify(publicContract)) },
    distributionContract: { path: distributionContractPath, sha256: sha256(JSON.stringify(distributionContract)) },
    localRuntime: { sourcePath: runtimeSourcePath, sourceSha256: sha256(runtimeSource), packagePath: runtimePackagePath, packageVersion: runtimePackage.version },
  },
  revalidation: {
    phase5KCorpus: "compatibility/differential-fixtures/data-list-default-view-layout-projection.v0.1.0.json",
    caseCount: 12,
    guarantees: [
      "Title-first selection, fallback, deduplication, the twelve-column maximum, supplied FieldIDs, static query descriptors, fixed-filter request ordering, and findings ordering are covered by Legacy/Core parity.",
      "The Core result, inputs, template snapshots, fixed-filter intents, requests, and findings are immutable and JSON-serializable.",
      "Core does not generate UUIDs or host IDs, allocate keys, load templates, mutate resources, or append caller-owned findings arrays.",
      "The Local Runtime host lowering is the only tested findings-array mutation boundary.",
    ],
  },
  prospectivePublicApi: {
    status: "defined_not_promoted",
    runtimeFunction: prospectiveFunction,
    publicInputDtos: ["DataListDefaultViewLayoutProjectionInput", "DataListDefaultViewFieldInput", "DataListDefaultViewIntent", "DataListDefaultViewTemplateSnapshot", "DataListStaticQueryField"],
    publicOutputDtos: ["DataListDefaultViewLayoutProjectionResult", "DataListDefaultViewLayoutProjection", "DataListLayoutColumnProjection", "DataListQueryFieldProjection", "LayoutViewProjectionFinding", "FixedFilterProjectionResult"],
    serialization: "Inputs and outputs must be JSON-serializable. The result contains no allocated filter key and its fragment filter remains empty until explicit host lowering.",
    immutability: "The result, nested arrays, projection records, fixed-filter intents, key requests, findings, and template snapshot handling must remain fresh and runtime-frozen without input mutation.",
    errors: "Malformed or omitted fields retain the observed Legacy TypeError class. Unparseable fixed filters become immutable DATA_VIEW_FILTER_PLANNED_BUT_NOT_MATERIALIZED findings. Allocation errors remain host-only and retain FIXED_FILTER_KEY_ALLOCATION_MISSING, FIXED_FILTER_KEY_ALLOCATION_INVALID, and FIXED_FILTER_KEY_ALLOCATION_COLLISION.",
    versioning: "Any future promotion is a minor public API addition under Materializer Core version 0.1.x only after the companion Local Runtime contract is versioned. DTO fields are additive-only; incompatible changes require a new contract version and a fresh source/archive/installed differential proof.",
    explicitInternalOnly: ["projectDataListDefaultViewLayoutInternal", "ensureTitleFirstFields", "uniqueFieldsByName", "resolveDataViewFields", "splitPlannedFieldList", "resolveDataViewField", "cleanResourceName", "isNonResourceName", "isPlanningPlaceholder", "normalizedKey"],
    prohibitedPublicInputs: ["Legacy LayoutView resource records", "mutable template objects", "caller-owned findings arrays", "host key allocation maps", "ListID", "LayoutID", "generated resource objects", "package or archive handles", "filesystem, API, environment, or runtime state"],
  },
  localRuntimeDependencyDecision: {
    status: "required_before_promotion",
    currentState: runtimeWorkspaceOnly ? "workspace_only_not_distributed" : "unexpected_distribution_state",
    requiredRuntimeFunction: "lowerFixedFilterProjectionAtHost",
    requiredContract: "A separately versioned Local Runtime host-lowering contract must define the opaque allocation response, exact allocation errors, immutable lowered result, caller-owned findings append, version compatibility, and installed Plugin resolution strategy.",
    distributionRequirement: "Before LayoutView promotion, the Local Runtime contract must be either packaged as a verified Plugin-resolvable artifact or represented by an explicitly versioned host adapter contract that is proven in source, official dist, temporary official ZIP, and simulated installed Plugin layouts.",
    rationale: "The Materializer Core API can expose filter intent, but it cannot produce the Legacy-shaped keyed filter or append host findings without the Local Runtime boundary. Core must not absorb that responsibility.",
  },
  prospectiveDistributionEvidence: {
    requiredSurfaces: ["compiled Core source artifact", "official Plugin dist artifact", "temporary official ZIP extraction", "simulated installed Plugin layout"],
    requiredChecks: ["exact public export-list parity", "artifact and manifest checksum parity", "Core and Local Runtime version compatibility", "no workspace, source, node_modules, source-map, or repository-path leakage", "all twelve LayoutView corpus cases with deterministic host allocation", "public DTO JSON serialization and runtime immutability"],
  },
  routingPrerequisites: {
    adapterExport: "scripts/lib/materializer-core-adapter.mjs may export only projectDataListDefaultViewLayout after the public artifact and Local Runtime contract pass.",
    hostLoweringAvailability: "A versioned, Plugin-resolvable Local Runtime lowering boundary must accept keysByRequestId and an explicit caller-owned findings array.",
    integrationFixture: "A full Data List default and additional view materializer fixture must compare Legacy checked LayoutView output, Core projection, host-lowered filter, and host-appended findings without normalizing observable keys.",
    requiredProof: ["source parity", "official ZIP parity", "simulated installed Plugin parity", "deterministic normalized decoded resource output", "temporary-copy-only Legacy rollback that restores only the checked LayoutView lowering"],
  },
  currentPublicSurface: {
    materializerRuntimeExports: publicContract.runtimeExports,
    internalFunctionExported: publicIndex.includes(internalFunction) || publicContract.runtimeExports.includes(internalFunction) || materializerArtifact?.exports?.includes(internalFunction) || false,
    prospectiveFunctionExported: publicIndex.includes(prospectiveFunction) || publicContract.runtimeExports.includes(prospectiveFunction) || materializerArtifact?.exports?.includes(prospectiveFunction) || false,
  },
};
writeJson(outputPath, readiness);
console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_DISTRIBUTION_READINESS_REJECTED");
console.log(`DATA_LIST_DEFAULT_VIEW_LAYOUT_DISTRIBUTION_READINESS_AUDIT_WRITTEN cases=${readiness.revalidation.caseCount} runtime=${readiness.localRuntimeDependencyDecision.currentState}`);

function hasNodeImport(sourceFile) { let found = false; const visit = (node) => { if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.startsWith("node:")) found = true; ts.forEachChild(node, visit); }; visit(sourceFile); return found; }
function read(relativePath) { return readFileSync(resolve(root, relativePath), "utf8"); }
function json(relativePath) { return JSON.parse(read(relativePath)); }
function writeJson(relativePath, value) { const path = resolve(root, relativePath); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

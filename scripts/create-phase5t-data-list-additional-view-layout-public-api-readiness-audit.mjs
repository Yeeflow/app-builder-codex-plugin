#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const shadowPath = "packages/app-builder-core-materializer/src/internal/data-list-additional-view-layout-projection.ts";
const indexPath = "packages/app-builder-core-materializer/src/index.ts";
const materializerContractPath = "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json";
const distributionContractPath = "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json";
const distributionManifestPath = "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json";
const runtimeContractPath = "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json";
const phase5RPath = "compatibility/capability-manifests/data-list-additional-view-layout-contract-audit.v0.1.0.json";
const phase5SPath = "compatibility/capability-manifests/data-list-additional-view-layout-internal-shadow.v0.1.0.json";
const corpusPath = "compatibility/differential-fixtures/data-list-additional-view-layout-projection.v0.1.0.json";
const outputPath = "compatibility/capability-manifests/data-list-additional-view-layout-public-api-readiness.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-5t-data-list-additional-view-layout-public-api-readiness-audit.v0.1.0.md";
const shadow = read(shadowPath);
const index = read(indexPath);
const materializerContract = json(materializerContractPath);
const distributionContract = json(distributionContractPath);
const distributionManifest = json(distributionManifestPath);
const runtimeContract = json(runtimeContractPath);
const phase5R = json(phase5RPath);
const phase5S = json(phase5SPath);
const corpus = json(corpusPath);
const defaultFunction = "projectDataListDefaultViewLayout";
const internalFunction = "projectDataListAdditionalViewLayoutInternal";
const prospectiveFunction = "projectDataListAdditionalViewLayout";

if (!shadow.includes(`function ${internalFunction}`) || phase5S.decision?.status !== "complete_shadow_not_routed" || phase5S.corpus?.parityCases !== 7 || phase5S.corpus?.viewScopes?.length < 2) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_READINESS_SHADOW_MISSING", "The Phase 5S additional-view shadow evidence is unavailable.");
if (phase5R.selectedVertical?.id !== "data-list-additional-type-zero-layout-projection" || phase5R.selectedVertical?.contract?.input?.includes("isDefault: false") !== true) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_READINESS_CONTRACT_MISSING", "The Phase 5R non-default view-intent contract is unavailable.");
if (!index.includes(defaultFunction) || !materializerContract.runtimeExports?.includes(defaultFunction)) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_READINESS_DEFAULT_API_MISSING", "The existing default-view public API must remain available.");
if (index.includes(prospectiveFunction) || materializerContract.runtimeExports?.includes(prospectiveFunction)) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_READINESS_ACCIDENTAL_PROMOTION", "The additional-view API must remain unexported during this audit.");
const runtimeArtifact = (distributionManifest.artifacts || []).find((item) => item.packageName === "@yeeflow/app-builder-core-local-runtime");
if (!runtimeArtifact?.exports?.includes("lowerFixedFilterProjectionAtHost") || !runtimeContract.runtimeExports?.includes("lowerFixedFilterProjectionAtHost")) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_READINESS_RUNTIME_ARTIFACT_MISSING", "The distributed Local Runtime lowering boundary is unavailable.");

const contract = {
  schemaVersion: "1.0.0",
  phase: "phase-5t-data-list-additional-view-layout-public-api-readiness-audit",
  decision: {
    status: "accepted",
    marker: "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_API_READINESS_ACCEPTED",
    selectedShape: "separate-additional-view-function",
    rationale: "A separate additive projectDataListAdditionalViewLayout API preserves the existing default-view API unchanged and makes the required isDefault false intent, non-default viewScope, and additional-only error boundary explicit. A generalized union would broaden the established default API contract without providing a compatibility advantage."
  },
  revalidation: {
    phase5RContract: { path: phase5RPath, sha256: sha256(read(phase5RPath)), marker: phase5R.decision?.marker },
    phase5SShadow: { path: phase5SPath, sha256: sha256(read(phase5SPath)), marker: phase5S.decision?.marker, parityCases: phase5S.corpus?.parityCases, viewScopeCount: phase5S.corpus?.viewScopes?.length },
    corpus: { path: corpusPath, parityCases: corpus.cases?.length, contractBoundaryCases: corpus.contractCases?.length, templateBoundaryCases: corpus.templateBoundaryCases?.length },
    publicExportGuard: "The internal function and prospective additional function are absent from the current public index, Materializer Core contract, distribution contract, and generated artifact export list.",
    localRuntimeLowering: { path: runtimeArtifact.path, sha256: runtimeArtifact.sha256, exports: runtimeArtifact.exports, functionName: "lowerFixedFilterProjectionAtHost" }
  },
  prospectivePublicApi: {
    status: "defined_not_promoted",
    runtimeFunction: prospectiveFunction,
    compatibility: "Additive Materializer Core 0.1.x export. projectDataListDefaultViewLayout remains unchanged and remains the only default-view public API.",
    publicInputDtos: ["DataListAdditionalViewLayoutProjectionInput", "DataListAdditionalViewIntent", "DataListDefaultViewFieldInput", "DataListDefaultViewTemplateSnapshot", "DataListStaticQueryField"],
    publicOutputDtos: ["DataListAdditionalViewLayoutProjectionResult", "DataListDefaultViewLayoutProjection", "DataListLayoutColumnProjection", "DataListQueryFieldProjection", "LayoutViewProjectionFinding", "FixedFilterProjectionResult"],
    publicInputProperties: ["viewScope", "fields", "viewIntent", "templateSnapshot", "listName"],
    requiredSemantics: ["viewIntent.isDefault=false", "viewScope is non-empty", "viewScope does not end with /default", "viewScope contains no whitespace or backslash", "FieldID values are caller-supplied", "template snapshot is immutable"],
    fixedFilterSemantics: "Returns immutable FixedFilterProjectionResult intents, deterministic request IDs, and immutable findings. The fragment filter remains empty until Local Runtime host lowering receives supplied keys.",
    errors: "Invalid or missing additional intent throws TypeError with DATA_LIST_ADDITIONAL_VIEW_LAYOUT_INTENT_INVALID. Invalid scope throws TypeError with DATA_LIST_ADDITIONAL_VIEW_LAYOUT_SCOPE_INVALID. Existing malformed field data preserves the observed Legacy TypeError class. Key allocation errors remain Local Runtime-only.",
    serialization: "Inputs and results are JSON-serializable. Output has no allocated filter keys or host resource record.",
    immutability: "Results, nested records, fixed-filter intents, requests, findings, and caller template snapshots are fresh and frozen. Core does not mutate inputs.",
    versioning: "DTO fields are additive-only. Any incompatible change to input validation, ordering, errors, serialization, or immutability requires a new contract version and fresh four-surface parity.",
    explicitInternalOnly: [internalFunction, "projectDataListDefaultViewLayoutInternal", "isStableAdditionalViewScope", "ensureTitleFirstFields", "uniqueFieldsByName", "resolveDataViewFields", "splitPlannedFieldList", "resolveDataViewField", "cleanResourceName", "isNonResourceName", "isPlanningPlaceholder", "normalizedKey"],
    prohibitedPublicShapes: ["Legacy LayoutView resource records", "mutable template objects", "caller-owned findings arrays", "host key allocation maps", "LayoutID", "ListID", "URL", "slug", "route key", "layout index", "generated resource objects", "package handles", "archive handles", "filesystem", "API state", "environment state", "runtime state"]
  },
  interArtifactResponsibilities: {
    materializerCore: "Projects immutable layout, query, sort, row-color, findings, fixed-filter intents, and key requests only. It accepts no host identity and allocates no filter key.",
    localRuntime: "Consumes explicit keysByRequestId, validates allocation errors, lowers Legacy-shaped filters, and may append converted findings only to an explicit caller-owned target.",
    hostMaterializer: "Selects the additional view, owns LayoutID, ListID, URL, route key, layout index, UUID allocation, and final resource integration.",
    resolution: "Both public artifacts resolve only from Plugin core paths and rely on no workspace packages, TypeScript source, node_modules, source maps, repository paths, or implicit host state."
  },
  futureDistributionEvidence: {
    status: "planned_not_started",
    requiredChanges: ["add only projectDataListAdditionalViewLayout and approved DTOs to the Materializer public index and public API contract", "align official distribution contract, builder, validator, generated manifest, and artifact metadata", "rebuild only through the official builder"],
    requiredProof: ["compiled source export and seven-case corpus parity", "Plugin dist export and corpus parity", "temporary official ZIP export and corpus parity", "simulated installed Plugin export and corpus parity", "exact manifest path, version, checksum, and export-list parity", "workspace, source, node_modules, source-map, and bare-import leakage gates", "unexpected public export and host-shape leakage gates"]
  },
  futureSelectiveRoutingEvidence: {
    status: "planned_not_started",
    callerBoundary: "Only the extraDataViews loop call expression to buildDataListViewLayoutViewChecked. The existing default route remains regression-protected.",
    integrationMatrix: ["two or more non-default scopes", "Title-first selection", "fallback and deduplication", "twelve-column maximum", "supplied FieldIDs", "static query fields", "sort and rowColor", "one, multiple, duplicate, and malformed fixed filters", "ordered host findings append", "additional-view-only scope gate", "unapproved view types and non-Data-List scope exclusion"],
    requiredProof: ["source parity", "official ZIP parity", "simulated installed Plugin parity", "deterministic normalized decoded resource output with controlled host UUID allocation", "default-view regression protection", "temporary-copy-only Legacy rollback", "retained Local Runtime allocation and findings-lowering ownership"]
  },
  currentSurface: {
    internalShadow: { path: shadowPath, sha256: sha256(shadow), functionName: internalFunction, publicExport: false },
    publicIndex: { path: indexPath, sha256: sha256(index), additionalFunctionExported: false, defaultFunctionExported: true },
    materializerContract: { path: materializerContractPath, sha256: sha256(read(materializerContractPath)), additionalFunctionExported: false, defaultFunctionExported: true },
    distributionContract: { path: distributionContractPath, sha256: sha256(read(distributionContractPath)), additionalFunctionExported: false },
    distributionManifest: { path: distributionManifestPath, sha256: sha256(read(distributionManifestPath)), additionalFunctionExported: false }
  }
};
write(outputPath, contract);
writeFileSync(resolve(root, reportPath), report(contract), "utf8");
console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_API_READINESS_ACCEPTED");
console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_API_READINESS_AUDIT_WRITTEN");

function report(value) { return `# Phase 5T Data List Additional-View LayoutView Public-API Readiness Audit\n\n## Decision\n\n\`${value.decision.marker}\`\n\nThe selected future shape is a separate additive \`${value.prospectivePublicApi.runtimeFunction}\` export. It preserves \`projectDataListDefaultViewLayout\` unchanged and keeps non-default scope and intent validation independent. This audit makes no public export, artifact, adapter, or routing change.\n\n## Prospective API\n\nThe public input requires immutable supplied FieldIDs, an immutable template snapshot, \`viewIntent.isDefault: false\`, and a non-empty non-default \`viewScope\`. It accepts no LayoutID, ListID, URL, slug, route key, or layout index. The result contains only frozen JSON-serializable fragment, fixed-filter intent, request, and finding data.\n\n## Responsibility Boundary\n\nMaterializer Core projects layout and fixed-filter intents only. Local Runtime validates supplied allocations, lowers Legacy-shaped filters, and optionally appends findings to an explicit host target. The host materializer retains selection, LayoutID, ListID, URL, route key, index, UUID allocation, and final resource integration.\n\n## Future Evidence\n\nA future promotion requires source, Plugin dist, official ZIP, and installed export/corpus parity; manifest/checksum parity; leakage and unexpected-export gates. A future route is restricted to the \`extraDataViews\` call, must protect the default route, prove deterministic integrated output with controlled UUID allocation, and provide temporary-copy-only Legacy rollback.\n\n## Current Non-Goals\n\nThe internal function is not public or distributed. No adapter, materializer route, active installation, historical ZIP, Git publication, or release state changed.\n`; }
function read(relativePath) { return readFileSync(resolve(root, relativePath), "utf8"); }
function json(relativePath) { try { return JSON.parse(read(relativePath)); } catch (error) { fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_READINESS_INVALID_JSON", error.message); } }
function write(relativePath, value) { const path = resolve(root, relativePath); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

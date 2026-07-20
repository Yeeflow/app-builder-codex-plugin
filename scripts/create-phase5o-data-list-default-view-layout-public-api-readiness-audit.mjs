#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const internalPath = "packages/app-builder-core-materializer/src/internal/data-list-default-view-layout-projection.ts";
const publicIndexPath = "packages/app-builder-core-materializer/src/index.ts";
const publicContractPath = "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json";
const distributionContractPath = "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json";
const distributionManifestPath = "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json";
const localRuntimeApiPath = "compatibility/capability-manifests/app-builder-core-local-runtime-public-api.v0.1.0.json";
const outputPath = "compatibility/capability-manifests/data-list-default-view-layout-public-api-readiness.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-5o-data-list-default-view-layout-public-api-readiness-audit.v0.1.0.md";
const internal = read(internalPath);
const publicIndex = read(publicIndexPath);
const publicContract = json(publicContractPath);
const distributionContract = json(distributionContractPath);
const distributionManifest = json(distributionManifestPath);
const runtimeApi = json(localRuntimeApiPath);
const internalFunction = "projectDataListDefaultViewLayoutInternal";
const publicFunction = "projectDataListDefaultViewLayout";
if (!internal.includes(`function ${internalFunction}`) || !internal.includes("projectFixedFilterIntents")) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_READINESS_INTERNAL_SHADOW_MISSING", "The Phase 5K internal LayoutView shadow is unavailable.");
if (publicIndex.includes(publicFunction) || publicContract.runtimeExports?.includes(publicFunction)) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_READINESS_ACCIDENTAL_PROMOTION", "The LayoutView projection must remain unexported during this audit.");
const runtimeArtifact = (distributionManifest.artifacts || []).find((item) => item.packageName === "@yeeflow/app-builder-core-local-runtime");
if (!runtimeArtifact || runtimeArtifact.path !== "core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs" || !runtimeArtifact.exports?.includes("lowerFixedFilterProjectionAtHost")) fail("DATA_LIST_DEFAULT_VIEW_LAYOUT_READINESS_RUNTIME_ARTIFACT_MISSING", "The Phase 5N Local Runtime artifact is unavailable.");
const contract = {
  schemaVersion: "1.0.0",
  phase: "phase-5o-data-list-default-view-layout-public-api-readiness-audit",
  decision: {
    status: "accepted",
    marker: "DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_READINESS_ACCEPTED",
    rationale: "The Phase 5K shadow returns only immutable structural layout, query, finding, and fixed-filter intent data. Phase 5N now supplies the separately versioned Plugin-resolvable Local Runtime artifact that alone validates supplied key allocations, lowers keyed filters, and optionally appends findings. No host behavior needs to enter the prospective Materializer Core API."
  },
  revalidation: {
    phase5KCorpus: "compatibility/differential-fixtures/data-list-default-view-layout-projection.v0.1.0.json",
    phase5KCaseCount: 12,
    phase5IFixedFilterCorpus: "compatibility/differential-fixtures/fixed-filter-parser-host-lowering.v0.1.0.json",
    phase5ICaseCount: 11,
    phase5NRuntimeArtifact: { path: runtimeArtifact.path, sha256: runtimeArtifact.sha256, exports: runtimeArtifact.exports },
    requiredSurfaces: ["compiled source", "Plugin dist", "temporary official ZIP", "simulated installed Plugin"],
    guarantees: ["immutable JSON-serializable Core projection", "deterministic fixed-filter intent requests", "Local Runtime-only allocation and findings append", "no workspace or source leakage in distributed artifacts"]
  },
  prospectivePublicApi: {
    status: "defined_not_promoted",
    runtimeFunction: publicFunction,
    publicInputDtos: ["DataListDefaultViewLayoutProjectionInput", "DataListDefaultViewFieldInput", "DataListDefaultViewIntent", "DataListDefaultViewTemplateSnapshot", "DataListStaticQueryField"],
    publicOutputDtos: ["DataListDefaultViewLayoutProjectionResult", "DataListDefaultViewLayoutProjection", "DataListLayoutColumnProjection", "DataListQueryFieldProjection", "LayoutViewProjectionFinding", "FixedFilterProjectionResult"],
    requiredFields: ["fields", "viewScope"],
    optionalFields: ["viewIntent", "templateSnapshot", "listName"],
    errors: "Malformed or omitted field data preserves the observed Legacy TypeError class. Unparseable fixed filters return immutable DATA_VIEW_FILTER_PLANNED_BUT_NOT_MATERIALIZED findings. Allocation errors are excluded from Materializer Core and remain Local Runtime-only.",
    serialization: "Inputs and results are JSON-serializable. The fragment filter is empty because it contains no allocated host key.",
    immutability: "The result, nested arrays, records, fixed-filter intents, requests, findings, and caller template snapshots are fresh and runtime-frozen without input mutation.",
    versioning: "Promotion is an additive Materializer Core 0.1.x runtime export. DTO fields are additive-only. Any incompatible input, output, ordering, error, or immutability change requires a new contract version and fresh four-surface parity.",
    explicitInternalOnly: [internalFunction, "ensureTitleFirstFields", "uniqueFieldsByName", "resolveDataViewFields", "splitPlannedFieldList", "resolveDataViewField", "cleanResourceName", "isNonResourceName", "isPlanningPlaceholder", "normalizedKey"],
    prohibitedPublicShapes: ["Legacy LayoutView resource records", "mutable template objects", "caller-owned findings arrays", "host key allocation maps", "ListID", "LayoutID", "generated resource objects", "package handles", "archive handles", "filesystem", "API state", "environment state", "runtime state"]
  },
  interArtifactResponsibilities: {
    materializerCore: "Returns layout fragment, immutable findings, and FixedFilterProjectionResult only. It allocates no key and performs no host lowering.",
    localRuntime: "Consumes host-supplied keysByRequestId, validates allocation errors, lowers Legacy-shaped filters, and may append converted findings only to an explicit caller-owned target.",
    resolution: "Both artifacts resolve only from Plugin core paths. Neither relies on workspace packages, TypeScript source, node_modules, source maps, repository paths, or implicit host state."
  },
  phase5PDistributionPromotion: {
    status: "planned_not_started",
    requiredChanges: ["add only projectDataListDefaultViewLayout and approved DTOs to the Materializer public index and public API contract", "align the official distribution contract and builder export list", "rebuild only through the official builder"],
    requiredProof: ["compiled source export and twelve-case corpus parity", "Plugin dist export and corpus parity", "temporary official ZIP export and corpus parity", "simulated installed Plugin export and corpus parity", "exact manifest path, version, checksum, and export-list parity", "public export leakage and unexpected-export negative gates"]
  },
  phase5QRoutingProof: {
    status: "planned_not_started",
    adapterExport: "Add only projectDataListDefaultViewLayout after Phase 5P passes.",
    callerBoundary: "Restrict routing to the Data List default and additional view lowering boundary around buildDataListViewLayoutViewChecked; keep final resource integration and all host mutation Legacy-owned.",
    integrationMatrix: ["default view", "additional view", "Title-first selection", "fallback and deduplication", "twelve-column maximum", "supplied FieldIDs", "static query fields", "no, one, multiple, duplicate, and malformed fixed filters", "ordered findings", "host allocations"],
    requiredProof: ["source parity", "official ZIP parity", "simulated installed Plugin parity", "deterministic normalized decoded resource output", "temporary-copy-only Legacy rollback", "retained Local Runtime allocation and findings-lowering ownership"]
  },
  currentSurface: {
    internalSource: { path: internalPath, sha256: sha256(internal), functionName: internalFunction },
    publicIndex: { path: publicIndexPath, sha256: sha256(publicIndex), prospectiveFunctionExported: false },
    materializerContract: { path: publicContractPath, sha256: sha256(read(publicContractPath)), prospectiveFunctionExported: false },
    distributionContract: { path: distributionContractPath, sha256: sha256(read(distributionContractPath)), prospectiveFunctionExported: false },
    localRuntimeContract: { path: localRuntimeApiPath, sha256: sha256(read(localRuntimeApiPath)), functionName: "lowerFixedFilterProjectionAtHost" }
  }
};
write(outputPath, contract);
writeFileSync(resolve(root, reportPath), report(contract), "utf8");
console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_READINESS_ACCEPTED");
console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_READINESS_AUDIT_WRITTEN");

function report(value) { return `# Phase 5O Data List Default-View LayoutView Public-API Readiness Audit\n\n## Decision\n\n\`${value.decision.marker}\`\n\nThe internal projection is ready for a later public API promotion because the\nMaterializer Core boundary remains structural and Phase 5N now provides the\nseparately distributed Local Runtime lowering contract. This audit makes no\npublic export, artifact, adapter, or production-route change.\n\n## Prospective Public API\n\n- Function: \`${value.prospectivePublicApi.runtimeFunction}\`\n- Inputs: ${value.prospectivePublicApi.publicInputDtos.map((item) => `\`${item}\``).join(", ")}\n- Outputs: ${value.prospectivePublicApi.publicOutputDtos.map((item) => `\`${item}\``).join(", ")}\n- Required fields: \`fields\`, \`viewScope\`\n- Optional fields: \`viewIntent\`, \`templateSnapshot\`, \`listName\`\n\nThe function returns an immutable JSON-serializable fragment and fixed-filter\nintent data only. Legacy LayoutView records, mutable templates, caller findings\narrays, allocation maps, host identities, generated resources, package handles,\nand runtime state remain outside the public API.\n\n## Inter-Artifact Boundary\n\nMaterializer Core returns no allocated filter key and never appends findings.\nLocal Runtime alone validates supplied allocations, lowers Legacy-shaped filters,\nand performs the explicit optional findings append. Both artifacts must resolve\nfrom Plugin core paths without workspace or repository leakage.\n\n## Future Phase 5P\n\nPhase 5P may promote the single public export only after source, dist, ZIP, and\ninstalled twelve-case export and corpus parity, manifest/checksum parity, and\npublic-export leakage gates pass.\n\n## Future Phase 5Q\n\nPhase 5Q may add one adapter export and route only the restricted Data List\ndefault/additional-view lowering boundary after full integration parity,\ndeterministic decoded output, and temporary-copy-only Legacy rollback prove\nthat Local Runtime retains allocation and findings-lowering ownership.\n\n## Current Non-Goals\n\nThe internal helper remains unexported. No distribution artifact, adapter,\nLegacy materializer, active installation, archive, or release action changed.\n`; }
function read(relativePath) { return readFileSync(resolve(root, relativePath), "utf8"); }
function json(relativePath) { return JSON.parse(read(relativePath)); }
function write(relativePath, value) { const path = resolve(root, relativePath); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

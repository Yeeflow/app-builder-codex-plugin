#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const runtimePath = "runtimes/app-builder-core-local-runtime/src/index.ts";
const runtimePackagePath = "runtimes/app-builder-core-local-runtime/package.json";
const distributionContractPath = "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json";
const outputPath = "compatibility/capability-manifests/local-runtime-fixed-filter-lowering-distribution-readiness.v0.1.0.json";
const runtimeSource = read(runtimePath);
const runtimePackage = json(runtimePackagePath);
const distributionContract = json(distributionContractPath);
const sourceFile = ts.createSourceFile(runtimePath, runtimeSource, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
const functionName = "lowerFixedFilterProjectionAtHost";
const stableErrors = ["FIXED_FILTER_KEY_ALLOCATION_MISSING", "FIXED_FILTER_KEY_ALLOCATION_INVALID", "FIXED_FILTER_KEY_ALLOCATION_COLLISION"];

const functionNode = exportedFunction(sourceFile, functionName);
if (!functionNode) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_FUNCTION_MISSING", "The Local Runtime fixed-filter lowering function is missing.");
if (hasNodeImport(sourceFile) || hasIdentifier(sourceFile, "crypto") || hasIdentifier(sourceFile, "randomUUID") || /\b(?:fs|process|fetch|require)\b/u.test(runtimeSource)) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_HOST_DEPENDENCY_INVALID", "The fixed-filter lowerer must not depend on filesystem, process, network, UUID, or environment behavior.");
for (const code of stableErrors) if (!runtimeSource.includes(code)) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_ERROR_MISSING", `The Local Runtime lowerer lacks ${code}.`);
if (!runtimeSource.includes("callerFindings.push") || !runtimeSource.includes("keys?.[request.requestId]") || !runtimeSource.includes("Object.freeze")) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_BOUNDARY_INVALID", "The Local Runtime lowerer must explicitly append findings, consume host keys, and freeze returned values.");
if (runtimePackage.private !== true) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_PACKAGE_VISIBILITY_INVALID", "The current Local Runtime package must remain private during this audit.");
if ((distributionContract.approvedArtifacts || []).some((artifact) => artifact.packageName === runtimePackage.name)) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_ALREADY_DISTRIBUTED", "The Local Runtime lowerer must not already have a distribution artifact during this audit.");

const readiness = {
  schemaVersion: "1.0.0",
  phase: "phase-5m-local-runtime-fixed-filter-lowering-distribution-contract-audit",
  decision: {
    status: "accepted",
    marker: "LOCAL_RUNTIME_FIXED_FILTER_LOWERING_DISTRIBUTION_READINESS_ACCEPTED",
    rationale: "The current Local Runtime lowerer has a bounded structural input contract, no filesystem, network, process, UUID, environment, package, or runtime lookup dependency, immutable returned values, and exact allocation errors. The explicit caller-owned findings append remains an allowed Local Runtime host side effect because it preserves Legacy mutation semantics without entering Core. A future artifact can remain self-contained because the lowerer consumes Core-shaped data structurally and imports no workspace package at runtime.",
  },
  sourceAudit: {
    sourcePath: runtimePath,
    sourceSha256: sha256(runtimeSource),
    packagePath: runtimePackagePath,
    packageName: runtimePackage.name,
    packageVersion: runtimePackage.version,
    functionName,
    exportedFromWorkspaceIndex: true,
    directImports: importSpecifiers(sourceFile),
    hostEffects: ["explicit caller-owned findings-array append only when callerFindings is non-null"],
    prohibitedEffects: ["filesystem", "network", "process execution", "environment access", "UUID or random generation", "key allocation", "package or archive output", "Core mutation"],
    testOnlyConsumers: [
      "scripts/test-fixed-filter-parser-host-lowering-differential.mjs",
      "scripts/test-fixed-filter-parser-host-lowering-gates.mjs",
      "scripts/test-fixed-filter-parser-distribution.mjs",
      "scripts/test-data-list-default-view-layout-projection-differential.mjs",
    ],
    productionConsumerCount: 0,
  },
  publicContract: {
    status: "defined_not_promoted",
    runtimeFunction: functionName,
    inputDtos: ["HostFixedFilterProjection", "HostFixedFilterIntent", "HostFixedFilterFinding", "HostFixedFilterAllocation"],
    outputDtos: ["FixedFilterHostLoweringResult", "LoweredFixedFilterCondition"],
    allocationRequirements: {
      hostProvidesEveryRequestId: true,
      keyType: "non-empty string",
      allocationScope: "viewScope plus requestId as defined by the paired Core key request contract",
      fallbackAllocation: "forbidden",
      uniqueness: "One key may not map to two distinct requestIds in one lowering call.",
    },
    mutationOwnership: {
      decision: "retain_explicit_caller_owned_findings_append",
      allowedSideEffect: "When callerFindings is a non-null array, append one converted immutable finding per projection finding in order.",
      noMutation: ["projection", "allocation", "projection intents", "projection key requests", "projection findings", "returned filter array", "returned findings array"],
      nullTargetBehavior: "When callerFindings is null or omitted, no external array is mutated and the immutable lowered findings remain in the returned result.",
      compatibility: "This preserves the Legacy checked LayoutView finding append contract at the explicit host boundary.",
      rollback: "A temporary route rollback restores the retained Legacy checked LayoutView path; it does not require a hidden fallback inside the Local Runtime lowerer.",
    },
    stableAllocationErrors: stableErrors,
    serialization: "Inputs and returned filters and findings are JSON-serializable structural data. Undefined showCus is omitted from lowered filter records.",
    compatibility: "The Local Runtime contract is paired with Materializer Core projectFixedFilterIntents 0.1.x by structural intent, requestId, ordinal, and finding fields. Future incompatible input or output changes require a new contract version and source/archive/installed parity proof.",
    explicitInternalOnly: ["request sorting implementation", "collision Map implementation", "finding conversion loop"],
  },
  prospectiveDistribution: {
    status: "defined_not_built",
    artifact: {
      path: "core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs",
      packageName: runtimePackage.name,
      packageVersion: runtimePackage.version,
      exports: [functionName],
    },
    relativeResolution: "The future Plugin adapter resolves the Local Runtime artifact relative to the Plugin core directory. The artifact is self-contained and requires no workspace package, TypeScript source, node_modules, or repository path at installed runtime.",
    materializerCoreResolution: "No runtime import is required. The Local Runtime lowerer consumes the paired Materializer Core fixed-filter projection as structural JSON data. The future manifest records compatibility with @yeeflow/app-builder-core-materializer 0.1.x and projectFixedFilterIntents.",
    manifestRules: ["exact artifact path", "package name and version", "SHA-256 of artifact bytes", "exact export list", "paired Materializer Core package and export compatibility", "source and compiled input SHA-256"],
    leakageProhibitions: ["workspace package imports", "TypeScript source references", "node_modules references", "sourceMappingURL references", "repository-relative paths", "absolute POSIX or Windows paths", "bare package imports"],
    requiredProof: ["compiled source artifact resolution", "official Plugin dist resolution", "temporary official ZIP extraction resolution", "simulated installed Plugin resolution", "manifest and checksum parity", "exact export-list parity", "leakage scan"],
  },
  futureIntegrationPrerequisites: {
    distributedLocalRuntimeProof: "Build the approved self-contained Local Runtime artifact through the official distribution builder and validate every required surface.",
    layoutViewPublicPromotion: "Promote the prospective Materializer Core LayoutView API only after the Local Runtime artifact and compatibility manifest pass all distribution proof.",
    adapterRouting: "Add one explicit adapter export only after both artifacts resolve from the Plugin core directory without workspace fallback.",
    fullIntegrationFixture: "Use default and additional Data List view records to compare Legacy checked LayoutView output against Core projection plus Local Runtime lowering, including exact supplied keys and findings order.",
    requiredProof: ["source parity", "official ZIP parity", "simulated installed Plugin parity", "deterministic normalized decoded resource output", "temporary-copy-only Legacy rollback"],
  },
};
writeJson(outputPath, readiness);
console.log("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_DISTRIBUTION_READINESS_ACCEPTED");
console.log(`LOCAL_RUNTIME_FIXED_FILTER_LOWERING_DISTRIBUTION_AUDIT_WRITTEN consumers=${readiness.sourceAudit.testOnlyConsumers.length} production=${readiness.sourceAudit.productionConsumerCount}`);

function exportedFunction(file, name) { return file.statements.find((statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === name && statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) || null; }
function importSpecifiers(file) { return file.statements.filter((statement) => ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)).map((statement) => statement.moduleSpecifier.text); }
function hasNodeImport(file) { return importSpecifiers(file).some((specifier) => specifier.startsWith("node:")); }
function hasIdentifier(file, text) { let found = false; const visit = (node) => { if (ts.isIdentifier(node) && node.text === text) found = true; ts.forEachChild(node, visit); }; visit(file); return found; }
function read(relativePath) { return readFileSync(resolve(root, relativePath), "utf8"); }
function json(relativePath) { return JSON.parse(read(relativePath)); }
function writeJson(relativePath, value) { const path = resolve(root, relativePath); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

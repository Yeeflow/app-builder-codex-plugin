#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readinessPath = argument("--readiness", "compatibility/capability-manifests/local-runtime-fixed-filter-lowering-distribution-readiness.v0.1.0.json");
const runtimePath = argument("--runtime", "runtimes/app-builder-core-local-runtime/src/index.ts");
const runtimePackagePath = argument("--runtime-package", "runtimes/app-builder-core-local-runtime/package.json");
const distributionContractPath = argument("--distribution-contract", "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json");
const readiness = json(readinessPath);
const runtimeSource = read(runtimePath);
const runtimePackage = json(runtimePackagePath);
const distributionContract = json(distributionContractPath);
const sourceFile = ts.createSourceFile(runtimePath, runtimeSource, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
const functionName = "lowerFixedFilterProjectionAtHost";
const stableErrors = ["FIXED_FILTER_KEY_ALLOCATION_MISSING", "FIXED_FILTER_KEY_ALLOCATION_INVALID", "FIXED_FILTER_KEY_ALLOCATION_COLLISION"];

if (readiness.phase !== "phase-5m-local-runtime-fixed-filter-lowering-distribution-contract-audit" || readiness.decision?.status !== "accepted" || readiness.decision?.marker !== "LOCAL_RUNTIME_FIXED_FILTER_LOWERING_DISTRIBUTION_READINESS_ACCEPTED") fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_DECISION_INVALID", "The Local Runtime readiness audit must record the accepted contract decision.");
if (!exportedFunction(sourceFile, functionName)) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_FUNCTION_MISSING", "The Local Runtime fixed-filter lowering function must remain exported from its workspace index.");
if (hasNodeImport(sourceFile) || hasIdentifier(sourceFile, "crypto") || hasIdentifier(sourceFile, "randomUUID") || /\b(?:fs|process|fetch|require)\b/u.test(runtimeSource)) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_HOST_DEPENDENCY_INVALID", "The fixed-filter lowerer must remain free of unrelated host dependencies.");
if (!runtimeSource.includes("keys?.[request.requestId]") || runtimeSource.includes("randomUUID")) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_IMPLICIT_ALLOCATION_FORBIDDEN", "The Local Runtime lowerer must consume supplied keys and never allocate fallback keys.");
for (const code of stableErrors) if (!runtimeSource.includes(code)) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_ALLOCATION_ERROR_CONTRACT_INCOMPLETE", `The Local Runtime lowerer lacks ${code}.`);
const contract = readiness.publicContract;
if (contract?.runtimeFunction !== functionName || contract?.mutationOwnership?.decision !== "retain_explicit_caller_owned_findings_append" || !contract.mutationOwnership?.allowedSideEffect || !contract.mutationOwnership?.nullTargetBehavior) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_CALLER_FINDINGS_MUTATION_UNDECLARED", "The Local Runtime contract must explicitly declare the only caller-owned findings mutation.");
if (contract?.allocationRequirements?.hostProvidesEveryRequestId !== true || contract?.allocationRequirements?.fallbackAllocation !== "forbidden" || contract?.allocationRequirements?.keyType !== "non-empty string") fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_IMPLICIT_ALLOCATION_FORBIDDEN", "The Local Runtime contract must require explicit host allocation and forbid fallback keys.");
if (!runtimeSource.includes("callerFindings.push") || !Array.isArray(contract.mutationOwnership?.noMutation) || !contract.mutationOwnership.noMutation.includes("projection")) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_CALLER_FINDINGS_MUTATION_UNDECLARED", "The Local Runtime contract must bound findings append and prohibit other input mutation.");
if (!Array.isArray(contract.stableAllocationErrors) || JSON.stringify(contract.stableAllocationErrors) !== JSON.stringify(stableErrors)) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_ALLOCATION_ERROR_CONTRACT_INCOMPLETE", "The Local Runtime contract must declare every stable allocation error in order.");
const distribution = readiness.prospectiveDistribution;
if (distribution?.status !== "defined_not_built" || distribution?.artifact?.path !== "core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs" || distribution.artifact?.packageName !== runtimePackage.name || !distribution.relativeResolution || !distribution.materializerCoreResolution || !Array.isArray(distribution.manifestRules)) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_DISTRIBUTION_STRATEGY_INVALID", "The readiness audit lacks a Plugin-resolvable Local Runtime distribution strategy.");
if (!Array.isArray(distribution.leakageProhibitions) || !["workspace package imports", "TypeScript source references", "node_modules references", "sourceMappingURL references", "repository-relative paths"].every((value) => distribution.leakageProhibitions.includes(value))) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_LEAKAGE_GUARD_INCOMPLETE", "The Local Runtime distribution plan lacks required leakage prohibitions.");
if (!Array.isArray(distribution.requiredProof) || distribution.requiredProof.length !== 7) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_DISTRIBUTION_STRATEGY_INVALID", "The Local Runtime distribution proof surface is incomplete.");
const routeProof = readiness.futureIntegrationPrerequisites?.requiredProof || [];
for (const required of ["source parity", "official ZIP parity", "simulated installed Plugin parity", "deterministic normalized decoded resource output", "temporary-copy-only Legacy rollback"]) if (!routeProof.includes(required)) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_ROUTING_PROOF_INCOMPLETE", "Future LayoutView routing lacks required proof.");
const declaredArtifact = (distributionContract.approvedArtifacts || []).find((artifact) => artifact?.packageName === runtimePackage.name);
const builtArtifactPath = resolve(root, "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs");
if (runtimePackage.private !== true || (declaredArtifact && (declaredArtifact.path !== distribution.artifact.path || declaredArtifact.packageVersion !== runtimePackage.version)) || (existsSync(builtArtifactPath) && !declaredArtifact)) fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_DISTRIBUTION_STRATEGY_INVALID", "The Local Runtime artifact may exist only through the approved Phase 5M distribution strategy.");
console.log("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_DISTRIBUTION_READINESS_ACCEPTED");
console.log("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_DISTRIBUTION_CONTRACT_VALID");

function exportedFunction(file, name) { return file.statements.some((statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === name && statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)); }
function importSpecifiers(file) { return file.statements.filter((statement) => ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)).map((statement) => statement.moduleSpecifier.text); }
function hasNodeImport(file) { return importSpecifiers(file).some((specifier) => specifier.startsWith("node:")); }
function hasIdentifier(file, text) { let found = false; const visit = (node) => { if (ts.isIdentifier(node) && node.text === text) found = true; ts.forEachChild(node, visit); }; visit(file); return found; }
function argument(option, fallback) { const index = process.argv.indexOf(option); return resolve(root, index < 0 ? fallback : process.argv[index + 1]); }
function read(relativePath) { return readFileSync(relativePath, "utf8"); }
function json(relativePath) { try { return JSON.parse(read(relativePath)); } catch (error) { fail("LOCAL_RUNTIME_FIXED_FILTER_LOWERING_INVALID_JSON", error.message); } }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

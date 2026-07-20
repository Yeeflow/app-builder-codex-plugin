#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const options = parseArgs(process.argv.slice(2));
const auditPath = resolve(root, options.audit || "compatibility/capability-manifests/materializer-seam-audit.v0.1.0.json");
const graphPath = resolve(root, options.graph || "compatibility/capability-manifests/app-builder-core-package-dependency-graph.v0.1.0.json");
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const classifications = new Set(["deterministic-core-candidate", "mixed-needs-boundary-adapter", "host-orchestration-only", "deferred-high-risk"]);
const audit = readJsonOrFail(auditPath, "MATERIALIZER_SEAM_AUDIT_INVALID_JSON", "Audit could not be parsed");
const graph = readJsonOrFail(graphPath, "MATERIALIZER_SEAM_AUDIT_GRAPH_INVALID_JSON", "Package dependency graph could not be parsed");
const approved = new Set(graph.packages.map((item) => item.name));
const expectedFunctions = topLevelFunctions(resolve(root, sourcePath));
const seen = new Set();

if (!Array.isArray(audit.records)) fail("MATERIALIZER_SEAM_AUDIT_RECORDS_MISSING", "Audit records must be an array.");
if (!Array.isArray(audit.directHelperModules)) fail("MATERIALIZER_SEAM_AUDIT_HELPERS_MISSING", "Audit directHelperModules must be an array.");
for (const record of audit.records) validateRecord(record);
for (const name of expectedFunctions) if (!seen.has(name)) fail("MATERIALIZER_SEAM_AUDIT_FUNCTION_UNCLASSIFIED", `Materializer function is not classified: ${name}.`);
for (const name of seen) if (!expectedFunctions.has(name)) fail("MATERIALIZER_SEAM_AUDIT_FUNCTION_OUT_OF_SCOPE", `Audit record is not a top-level materializer function: ${name}.`);
if (!audit.selection || typeof audit.selection !== "object") fail("MATERIALIZER_SEAM_AUDIT_SELECTION_MISSING", "Audit selection must be present.");
if (audit.selection.status === "selected") {
  const selected = audit.records.find((record) => record.id === audit.selection.selectedRecordId);
  if (!selected || selected.coreClassification !== "deterministic-core-candidate") fail("MATERIALIZER_SEAM_AUDIT_SELECTION_INVALID", "Selected first slice must reference a deterministic Core candidate.");
} else if (audit.selection.status !== "NO_SAFE_MATERIALIZER_CORE_SLICE_SELECTED") {
  fail("MATERIALIZER_SEAM_AUDIT_SELECTION_INVALID", "Selection status must be selected or NO_SAFE_MATERIALIZER_CORE_SLICE_SELECTED.");
}
validatePhase4fCandidateSelection(audit);
const raw = readFileSync(auditPath, "utf8");
if (/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/u.test(raw)) fail("MATERIALIZER_SEAM_AUDIT_NON_ENGLISH", "Audit contains CJK text; persisted audit content must be English.");
console.log(`MATERIALIZER_SEAM_AUDIT_VALID records=${audit.records.length} selected=${audit.selection.status}`);

function validateRecord(record) {
  const required = ["id", "sourceFile", "functionName", "exported", "callers", "inputOutputContract", "directDependencies", "transitiveDependencies", "moduleMutableStateDependencies", "detectedSideEffects", "coreClassification", "classificationReason", "requiredParityFixture", "recommendedTargetCorePackage", "rollbackImplications", "productionCallSites", "phase4fCandidateAssessment"];
  if (!record || typeof record !== "object") fail("MATERIALIZER_SEAM_AUDIT_RECORD_INVALID", "Audit record must be an object.");
  for (const field of required) if (!(field in record)) fail("MATERIALIZER_SEAM_AUDIT_RECORD_FIELD_MISSING", `Audit record is missing required field ${field}.`);
  if (record.sourceFile !== sourcePath || typeof record.functionName !== "string") fail("MATERIALIZER_SEAM_AUDIT_RECORD_SCOPE_INVALID", "Audit record must describe a materializer top-level function.");
  if (seen.has(record.functionName)) fail("MATERIALIZER_SEAM_AUDIT_FUNCTION_DUPLICATE", `Duplicate materializer function record: ${record.functionName}.`);
  seen.add(record.functionName);
  if (!classifications.has(record.coreClassification)) fail("MATERIALIZER_SEAM_AUDIT_CLASSIFICATION_UNKNOWN", `Unknown Core classification: ${record.coreClassification}.`);
  if (!record.callers || !Number.isInteger(record.callers.count) || !Array.isArray(record.callers.callerPaths)) fail("MATERIALIZER_SEAM_AUDIT_CALLER_CONTRACT_MISSING", `Caller contract is incomplete: ${record.functionName}.`);
  if (!Array.isArray(record.productionCallSites)) fail("MATERIALIZER_SEAM_AUDIT_CALL_SITE_CONTRACT_MISSING", `Production call-site contract is incomplete: ${record.functionName}.`);
  validateIo(record);
  validateParity(record);
  if (record.recommendedTargetCorePackage !== null && !approved.has(record.recommendedTargetCorePackage)) fail("MATERIALIZER_SEAM_AUDIT_TARGET_PACKAGE_UNKNOWN", `Unknown target Core package: ${record.recommendedTargetCorePackage}.`);
  validateShadowEvidence(record);
  const effects = new Set(record.detectedSideEffects || []);
  const nonDeterminism = new Set(record.nondeterminism || record.transitiveDependencies?.nonDeterminism || []);
  if (record.coreClassification === "deterministic-core-candidate") {
    if (effects.size) fail("MATERIALIZER_SEAM_AUDIT_DETERMINISTIC_HOST_EFFECT", `Deterministic Core candidate has host side effects: ${record.functionName}.`);
    if (nonDeterminism.size) fail("MATERIALIZER_SEAM_AUDIT_NONDETERMINISM_UNREJECTED", `Deterministic Core candidate has nondeterministic behavior: ${record.functionName}.`);
    if ((record.moduleMutableStateDependencies || []).length || (record.externalObjectMutationDependencies || []).length) fail("MATERIALIZER_SEAM_AUDIT_DETERMINISTIC_MUTABLE_STATE", `Deterministic Core candidate has mutable state or external mutation: ${record.functionName}.`);
    if (record.transitiveDependencies?.legacyMarkdownParserDependency) fail("MATERIALIZER_SEAM_AUDIT_LEGACY_MARKDOWN_DEPENDENCY", `Deterministic Core candidate depends on the Legacy Markdown parser: ${record.functionName}.`);
    if (!record.recommendedTargetCorePackage) fail("MATERIALIZER_SEAM_AUDIT_TARGET_PACKAGE_MISSING", `Deterministic Core candidate lacks a target package: ${record.functionName}.`);
  }
  if (nonDeterminism.size && record.coreClassification === "deterministic-core-candidate") fail("MATERIALIZER_SEAM_AUDIT_NONDETERMINISM_UNREJECTED", `Random, time, or ID generation must be rejected from deterministic Core: ${record.functionName}.`);
}

function validatePhase4fCandidateSelection(auditDocument) {
  const selection = auditDocument.phase4fCandidateSelection;
  const classifications = new Set(["eligible-single-slice", "eligible-batch-candidate", "defer-high-risk", "host-orchestration-only"]);
  const routed = new Set(["normalizeHexColor", "defaultValueForFieldType", "escapeRegExp", "normalizeForLooseFormMatch", "stripPlanningDocumentSuffix", "dependencyName", "safeDependencyIdentifier"]);
  if (!selection || typeof selection !== "object" || selection.auditOnly !== true || !Array.isArray(selection.candidates) || !Array.isArray(selection.routedFunctionsExcluded)) fail("MATERIALIZER_SEAM_AUDIT_PHASE4F_SELECTION_MISSING", "Phase 4F candidate selection must be an audit-only structured record.");
  if (selection.coreArtifactChanged !== false || selection.productionRoutingChanged !== false) fail("MATERIALIZER_SEAM_AUDIT_PHASE4F_MUTATION_FORBIDDEN", "Phase 4F selection must not record Core artifact or production-routing changes.");
  const expected = auditDocument.records.filter((record) => record.coreClassification === "deterministic-core-candidate" && !routed.has(record.functionName)).map((record) => record.id).sort();
  const actual = selection.candidates.map((candidate) => candidate.recordId).sort();
  if (JSON.stringify(expected) !== JSON.stringify(actual)) fail("MATERIALIZER_SEAM_AUDIT_PHASE4F_CANDIDATE_INVENTORY_INVALID", "Phase 4F selection must assess every remaining deterministic helper candidate exactly once.");
  for (const candidate of selection.candidates) {
    if (!classifications.has(candidate.classification) || !Array.isArray(candidate.productionCallSites) || typeof candidate.coercionAndErrorSemanticRisk !== "string" || typeof candidate.publicApiBoundary !== "string" || typeof candidate.proofSurface !== "string" || typeof candidate.batchCompatibility !== "string") fail("MATERIALIZER_SEAM_AUDIT_PHASE4F_CANDIDATE_INVALID", `Phase 4F candidate assessment is incomplete: ${candidate.functionName || candidate.recordId}.`);
  }
  if (selection.status === "selected") {
    const recommended = selection.recommendedNextSlice;
    const candidate = selection.candidates.find((item) => item.recordId === recommended?.recordId);
    if (!candidate || candidate.classification !== "eligible-single-slice" || candidate.functionName !== "normalizeForLooseFormMatch") fail("MATERIALIZER_SEAM_AUDIT_PHASE4F_RECOMMENDATION_INVALID", "Phase 4F must recommend only the approved narrow single-slice candidate.");
  } else if (selection.status !== "NO_SAFE_MATERIALIZER_PHASE_4F_SLICE_SELECTED") {
    fail("MATERIALIZER_SEAM_AUDIT_PHASE4F_RECOMMENDATION_INVALID", "Phase 4F selection status is invalid.");
  }
}

function validateShadowEvidence(record) {
  if (record.shadowImplementation === null || record.shadowImplementation === undefined) return;
  const evidence = record.shadowImplementation;
  const required = ["status", "legacyFunctionPath", "coreSourceFunctionPath", "compiledCoreFunctionPath", "corpusPath", "corpusCaseCount", "parityTest", "parityMarkers", "legacyBehavior", "productionCallerSwitch", "distributionCutover", "compatibilityAdapterCutover"];
  const behaviorFields = ["acceptedInputRule", "trimming", "caseNormalization", "malformedInput", "nullLikeInput", "jsonCoercionEdgeCase", "returnType", "thrownErrorBehavior", "mutationBehavior"];
  if (!evidence || typeof evidence !== "object" || required.some((field) => !(field in evidence)) || !Number.isInteger(evidence.corpusCaseCount) || evidence.corpusCaseCount < 1 || !Array.isArray(evidence.parityMarkers) || !evidence.parityMarkers.length || !evidence.legacyBehavior || behaviorFields.some((field) => typeof evidence.legacyBehavior[field] !== "string" || !evidence.legacyBehavior[field])) fail("MATERIALIZER_SEAM_AUDIT_SHADOW_EVIDENCE_INVALID", `Shadow implementation evidence is incomplete: ${record.functionName}.`);
  if (record.coreClassification !== "deterministic-core-candidate" || record.recommendedTargetCorePackage !== "@yeeflow/app-builder-core-materializer") fail("MATERIALIZER_SEAM_AUDIT_SHADOW_CLASSIFICATION_INVALID", `Shadow implementation is not aligned with the deterministic materializer Core boundary: ${record.functionName}.`);
}

function validateIo(record) {
  const contract = record.inputOutputContract;
  if (!contract || !contract.input || !contract.output || !contract.failureContract || !Array.isArray(contract.input.parameterNames) || !Array.isArray(contract.output.observedReturnShapes)) fail("MATERIALIZER_SEAM_AUDIT_IO_CONTRACT_MISSING", `Input/output contract is incomplete: ${record.functionName}.`);
  if (record.coreClassification === "deterministic-core-candidate" && (!contract.input.jsonSerializable || !contract.output.jsonSerializable || !contract.output.immutableInputContractRequired || !contract.failureContract.boundedAndTestable)) fail("MATERIALIZER_SEAM_AUDIT_IO_CONTRACT_INVALID", `Deterministic Core candidate has an ineligible input/output contract: ${record.functionName}.`);
}

function validateParity(record) {
  const parity = record.requiredParityFixture;
  if (!parity || !parity.fixtureShape || !parity.fixtureShape.input || typeof parity.fixtureShape.expected !== "string" || !Array.isArray(parity.assertions) || !parity.assertions.length) fail("MATERIALIZER_SEAM_AUDIT_PARITY_REQUIREMENT_MISSING", `Parity fixture requirement is incomplete: ${record.functionName}.`);
}

function topLevelFunctions(file) {
  const ast = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  const names = new Set();
  for (const statement of ast.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) names.add(statement.name.text);
    if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) names.add(declaration.name.text);
    }
  }
  return names;
}

function parseArgs(args) { const result = {}; for (let index = 0; index < args.length; index += 2) { if (!args[index]?.startsWith("--") || !args[index + 1]) fail("MATERIALIZER_SEAM_AUDIT_ARGUMENT_INVALID", "Arguments must use --name value."); result[args[index].slice(2)] = args[index + 1]; } return result; }
function readJsonOrFail(path, code, message) { try { return JSON.parse(readFileSync(path, "utf8")); } catch (error) { fail(code, `${message}: ${error.message}`); } }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }

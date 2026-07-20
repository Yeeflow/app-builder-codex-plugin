#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const source = readFileSync(resolve(root, sourcePath), "utf8");
const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const functions = topLevelFunctions(ast);
const required = ["parseDataViewFixedFilterConditions", "parseDataViewFixedFilterConditionPart", "buildDataListViewLayoutViewChecked"];
for (const name of required) if (!functions.has(name)) throw new Error(`FIXED_FILTER_HOST_CONTRACT_ENTRYPOINT_MISSING: ${name}`);
if (!hasPropertyAccessCall(functions.get("parseDataViewFixedFilterConditionPart").node, "crypto", "randomUUID")) throw new Error("FIXED_FILTER_HOST_CONTRACT_UUID_CALL_MISSING");
if (!hasPropertyAccessCall(functions.get("buildDataListViewLayoutViewChecked").node, "findings", "push")) throw new Error("FIXED_FILTER_HOST_CONTRACT_FINDINGS_PUSH_MISSING");

const contract = {
  schemaVersion: "1.0.0",
  phase: "phase-5h-fixed-filter-key-and-findings-lowering-contract-audit",
  analysisMethod: "TypeScript AST function and call-expression analysis with exact checks for crypto.randomUUID and caller-owned findings.push.",
  source: { path: sourcePath, sha256: sha256(source) },
  legacyBoundary: {
    parser: entry("parseDataViewFixedFilterConditions"),
    conditionParser: entry("parseDataViewFixedFilterConditionPart"),
    checkedLowering: entry("buildDataListViewLayoutViewChecked"),
    callers: [
      { path: `${sourcePath}#buildResourceGraphPackage`, lines: [5043, 5064], behavior: "Serializes the checked LayoutView result into default and additional Data List layout records." },
    ],
  },
  keyLifecycle: {
    legacyGeneration: "The condition parser creates one crypto.randomUUID key for every non-empty, date-now, or direct-comparison condition that resolves to a field.",
    lifecycle: "A key is written to LayoutView.filter[index].key, then serialized inside the Data List LayoutView JSON. The current materializer does not read the key again before package output.",
    uniquenessScope: "Each successfully materialized condition in one LayoutView.filter array requires one non-empty unique opaque key. The host allocation scope must be the supplied viewScope plus requestId.",
    externalObservability: "The key is externally observable in decoded and packaged LayoutView JSON; parity must preserve supplied host keys exactly.",
    ordering: "Requests and resulting conditions preserve the original parsed part ordinal. Invalid or unresolved parts produce no request and no condition; later valid parts retain their original ordinal for pre behavior.",
    duplicates: "Repeated parseable conditions remain distinct entries because requestId includes the original ordinal. The host must allocate different keys even when condition semantics are otherwise identical.",
  },
  coreDtos: {
    input: "FixedFilterIntentInput { viewScope: string, fields: readonly FixedFilterFieldReference[], filterText: string }",
    intent: "FixedFilterConditionIntent { requestId: string, ordinal: number, pre: 'and' | 'or', left: string, op: string, right: JsonValue, showCus?: boolean }",
    keyRequest: "FixedFilterKeyRequest { requestId: string, viewScope: string, ordinal: number, conditionFingerprint: string }",
    allocationResponse: "FixedFilterKeyAllocationResponse { keysByRequestId: Readonly<Record<string, string>> }",
    finding: "FixedFilterProjectionFinding { code: string, message: string, context: Readonly<Record<string, JsonValue>> }",
    result: "FixedFilterProjectionResult { intents: readonly FixedFilterConditionIntent[], keyRequests: readonly FixedFilterKeyRequest[], findings: readonly FixedFilterProjectionFinding[] }",
    loweredResult: "AllocatedFixedFilterProjectionResult { filter: readonly FixedFilterCondition[], findings: readonly FixedFilterProjectionFinding[] }",
  },
  coreProhibitions: [
    "Core must not call crypto.randomUUID or any UUID, random, time, filesystem, network, API, environment, process, archive, or package-output capability.",
    "Core must not allocate host IDs, mutate caller-owned arrays or objects, or append to a host findings array.",
    "Core must return fresh immutable JSON-serializable intents, requests, filters, and findings only.",
  ],
  identitySemantics: {
    requestIdentity: "requestId is deterministic: `${viewScope}:fixed-filter:${ordinal}`. conditionFingerprint is deterministic canonical JSON of ordinal, pre, left, op, and right and is validation evidence rather than an allocation key.",
    allocationScope: "The host treats viewScope plus requestId as the allocation namespace and returns an opaque key for every request.",
    duplicateRequests: "Duplicate semantic conditions with different ordinals produce different requestIds and require different allocated keys.",
    missingResponse: "A missing requestId produces FIXED_FILTER_KEY_ALLOCATION_MISSING and prevents lowering that condition.",
    malformedResponse: "An empty, non-string, or whitespace-only key produces FIXED_FILTER_KEY_ALLOCATION_INVALID and prevents lowering that condition.",
    collisions: "Two requestIds mapped to the same key produce FIXED_FILTER_KEY_ALLOCATION_COLLISION and prevent lowering every colliding condition.",
    ordering: "The returned filter array follows accepted intent ordinal order exactly; key allocation must not reorder it.",
  },
  findingsSemantics: {
    shape: "FixedFilterProjectionFinding is immutable JSON data with code, message, and context.",
    ordering: "Core findings follow parse order, then allocation-validation order by request ordinal.",
    deduplication: "No Core deduplication occurs. The host appends every finding in order to preserve existing caller-owned array behavior.",
    hostLowering: "The host owns `for (const finding of result.findings) findings.push(toLegacyError(finding))`; Core never receives or mutates the findings array.",
    legacyCompatibility: "The existing DATA_VIEW_FILTER_PLANNED_BUT_NOT_MATERIALIZED finding is emitted as immutable Core data only when non-empty planned filter text yields no materialized conditions.",
  },
  fixtureMatrix: [
    fixture("no-filter", "No fixed-filter text", "No intents, requests, filters, or findings."),
    fixture("one-filter", "One parseable non-empty condition", "One ordinal-zero request, one supplied key, one filter."),
    fixture("multiple-filters", "Multiple parseable conditions", "Ordered requests and filters with distinct supplied keys."),
    fixture("duplicate-filters", "Two identical parseable conditions", "Two ordinal-distinct requests and two distinct supplied keys."),
    fixture("malformed-filter", "Non-empty unparseable text", "No request and one planned-but-not-materialized finding."),
    fixture("supplied-allocation", "Valid keysByRequestId map", "Lowered keys match host values exactly."),
    fixture("missing-allocation", "One request omitted from keysByRequestId", "FIXED_FILTER_KEY_ALLOCATION_MISSING in immutable findings."),
    fixture("colliding-allocation", "Two requestIds share one host key", "FIXED_FILTER_KEY_ALLOCATION_COLLISION and no colliding lowered filters."),
    fixture("finding-ordering", "Malformed then allocation-invalid conditions", "Findings retain deterministic parse and request order."),
    fixture("legacy-mutation", "Caller-owned findings array", "Host lowering appends converted findings; Core result remains unchanged."),
  ],
  parityAndRollback: {
    parity: "A future shadow must compare unnormalized filter order, supplied opaque keys, filter values, error behavior, and ordered findings against a Legacy harness with injected host keys. It must not normalize away key behavior.",
    sourceArchiveInstalled: "After a future Core artifact exists, source, temporary official ZIP, and simulated installed Plugin proof must all use the same supplied allocation response and compare exact lowered filters and findings.",
    rollback: "A temporary-copy-only rollback restores only the fixed-filter host lowering to the retained Legacy parser while preserving the allocation contract test fixture. No production flag or fallback is permitted.",
  },
  implementationStatus: {
    phase: "phase-5i-fixed-filter-parser-and-host-lowering-shadow",
    coreParser: "shadow_implemented_not_routed",
    hostLowering: "shadow_implemented_not_routed",
    distribution: "not_started",
    productionRouting: "not_started",
  },
  shadowReadiness: {
    status: "parser_and_host_lowering_shadow_implemented_not_routed",
    rationale: "The deterministic request, host allocation, immutable findings, parser shadow, and host lowering shadow boundaries are complete. A revised LayoutView shadow remains deferred until separate contract parity acceptance and authorization.",
    remainingBlockers: ["The current Legacy parser still owns random key generation and findings-array mutation in production.", "No adapter, distribution artifact, or production route exists.", "Complete LayoutView projection must be re-audited after fixed-filter contract parity passes."],
  },
};

const fixtures = { schemaVersion: "1.0.0", contractVersion: "0.1.0", fixtureCount: contract.fixtureMatrix.length, fixtures: contract.fixtureMatrix };
writeJson("compatibility/capability-manifests/fixed-filter-key-findings-host-contract.v0.1.0.json", contract);
writeJson("compatibility/differential-fixtures/fixed-filter-key-findings-host-contract.v0.1.0.json", fixtures);
console.log(`FIXED_FILTER_KEY_FINDINGS_HOST_CONTRACT_VALID fixtures=${fixtures.fixtureCount}`);

function entry(functionName) { const value = functions.get(functionName); return { path: `${sourcePath}#${functionName}`, line: value.line, productionCallerCount: countCalls(ast, functionName) }; }
function fixture(id, scenario, expected) { return { id, scenario, expected }; }
function topLevelFunctions(sourceFile) { const result = new Map(); for (const statement of sourceFile.statements) if (ts.isFunctionDeclaration(statement) && statement.name) { const point = sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile)); result.set(statement.name.text, { line: point.line + 1, node: statement }); } return result; }
function countCalls(sourceFile, name) { let count = 0; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1; ts.forEachChild(node, visit); }; visit(sourceFile); return count; }
function hasPropertyAccessCall(node, objectName, propertyName) { let found = false; const visit = (child) => { if (ts.isCallExpression(child) && ts.isPropertyAccessExpression(child.expression) && ts.isIdentifier(child.expression.expression) && child.expression.expression.text === objectName && child.expression.name.text === propertyName) found = true; ts.forEachChild(child, visit); }; visit(node); return found; }
function writeJson(relativePath, value) { const path = resolve(root, relativePath); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

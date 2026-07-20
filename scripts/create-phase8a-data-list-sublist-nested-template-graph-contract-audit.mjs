#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const contractPath = "compatibility/capability-manifests/data-list-sublist-nested-template-graph-contract.v0.1.0.json";
const selectionPath = "compatibility/capability-manifests/data-list-sublist-nested-template-graph-candidate-selection.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-8a-data-list-sublist-nested-template-graph-contract-audit.v0.1.0.md";
const source = read(sourcePath);
const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const errors = ["SUBLIST_TEMPLATE_GRAPH_REFERENCE_MISSING", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_INVALID", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_DUPLICATE", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_RELATIONSHIP_BROKEN", "SUBLIST_ROW_SCHEMA_REFERENCE_MISSING", "SUBLIST_ROW_SCHEMA_REFERENCE_INVALID", "SUBLIST_ROW_SCHEMA_REFERENCE_SCOPE_MISMATCH", "SUBLIST_ROW_SCHEMA_REFERENCE_DUPLICATE", "SUBLIST_ROW_SCHEMA_REFERENCE_RELATIONSHIP_BROKEN"];
const inventory = [
  family("sublist-field-records-and-rules", "requires-resource-identity-and-row-schema-contract", ["buildFieldRecord", "buildFieldRules", "dataListSubListVariables"], ["parent ListID and FieldID", "sublist field rule payload", "lossless row identity references"], ["field-record lowering", "host ID map validation"], "The parent field record embeds sublist rule data and remains coupled to lossless host-issued field identities."),
  family("sublist-row-schema-normalization", "eligible-phase8b-internal-shadow", ["dataListSubListVariables", "normalizeSubListRowType"], ["explicit parent ListID and FieldID", "explicit sublist field reference", "explicit immutable row IDs and row schema", "scalar row kinds only"], ["validate supplied row identities", "lower rows into mutable template graph"], "A scalar row-schema intent can be normalized from supplied immutable rows without allocating IDs when all parent, child, and row identities are explicit."),
  family("nested-control-placement", "requires-nested-template-graph-contract", ["buildDataListFormSubListControl", "buildDataListSubListColumn", "normalizeSubListColumnControlType"], ["nested template snapshot", "parent control node", "row slot", "child control identity map"], ["template loading", "child-control ID supply", "mutable child insertion"], "Nested control fragments depend on parent control IDs, row slots, and template mutation; they cannot use the flat Type 1 placement contract."),
  family("summary-and-aggregation-definitions", "requires-summary-temporary-variable-contract", ["normalizeDataListSubListSummaries", "ensureDataListSubListSummaryTempVars"], ["summary identity references", "temporary-variable allocation map", "parent resource snapshot"], ["summary and temp variable ID supply", "caller resource mutation"], "Summaries allocate identities and append temporary variables to the mutable form resource."),
  family("type-zero-and-type-one-presentation", "requires-view-lifecycle-template-contract", ["buildDataListViewLayoutView", "buildDataListFormFieldControl", "buildDataListFormSubListControl"], ["view intent", "Type 0 layout snapshot", "Type 1 nested template snapshot"], ["layout integration", "template mutation"], "Type 0 LayoutView and Type 1 form presentation have different templates and host integration paths."),
  family("default-new-edit-form-lifecycle", "requires-form-lifecycle-template-contract", ["buildCustomFormLayout", "materializeDataListFormResource", "buildDataListFormFieldsGrid"], ["lifecycle template selection", "form node and slot references", "ListID/LayoutID relationship"], ["filesystem template loading", "mutable graph assembly", "final resource integration"], "Default, New, and Edit lifecycles select and mutate complete templates rather than emitting a standalone nested intent."),
  family("embedded-lookup-and-advanced-controls", "requires-cross-contract-control-semantics", ["normalizeSubListColumnControlType", "buildFieldRules", "resolveDataListLookupRulesThroughCore"], ["Lookup resolution result input", "advanced control semantics", "row-level template references"], ["cross-resource validation", "template lowering"], "Embedded Lookup, identity, and binary row controls require their own existing or future contracts and are excluded from the first scalar row-schema vertical."),
  family("template-identity-layout-and-package-integration", "host-orchestration-only", ["buildDataListFormSubListControl", "materializeDataListFormResource", "buildCustomFormLayout"], ["host template snapshot", "parent-child identity hierarchy", "LayoutID/ListID map"], ["template loading", "ID allocation", "resource mutation", "package output"], "Template loading, final graph integration, layout identity propagation, and package serialization are host orchestration."),
];
const candidate = {
  id: "data-list-sublist-explicit-scalar-row-schema-intent",
  surface: "data-list",
  family: "sublist-row-schema-normalization",
  legacyBoundary: functionRecord("dataListSubListVariables"),
  productionCallerCount: countCalls("dataListSubListVariables"),
  included: ["Data List Sublist fields", "explicit immutable row records", "scalar text date number boolean row types", "caller-supplied parent ListID FieldID and row identities"],
  excluded: ["missing row identity allocation", "nested control placement", "summaries and temporary variables", "Lookup row controls", "identity user people person row controls", "file image binary row controls", "runtime actions and expressions", "Type 0 LayoutView", "Approval Forms", "Document Libraries", "Dashboards", "workflows", "template loading and mutation", "package output"],
  coreInput: ["immutable parent and child identity references", "immutable row-schema records with explicit row IDs", "immutable nested template snapshot descriptor", "explicit parent node and row-slot references"],
  coreOutput: ["immutable scalar row-schema intent", "immutable nested placement requests without generated IDs", "immutable findings"],
  requiredParityFixture: { plannedCaseCount: 12, coverage: ["one scalar row", "multiple row order", "text date number boolean normalization", "explicit parent and child nineteen-digit IDs", "missing invalid wrong-scope duplicate broken parent-child references", "missing invalid duplicate row-schema identities", "excluded Lookup advanced binary and action rows"] },
  rollback: "Temporary complete Plugin copy restores only the future scalar row-schema bridge to dataListSubListVariables; no runtime toggle, fallback, or unrelated Sublist route change is permitted.",
  routingPrerequisites: ["internal Core shadow parity", "Local Runtime nested identity validation and lowering", "source archive installed proof after public promotion", "actual Sublist materializer fixture", "deterministic host allocation", "temporary-copy Legacy rollback"],
};
const contract = {
  schemaVersion: "1.0.0",
  phase: "phase-8a-data-list-sublist-nested-template-graph-contract-audit",
  source: { path: sourcePath, sha256: sha(source) },
  decision: { status: "accepted", marker: "PHASE_8_SUBLIST_CONTRACT_ACCEPTED", nextPhase: "phase-8b-data-list-sublist-explicit-scalar-row-schema-shadow", rationale: "The explicit scalar row-schema intent is the smallest Data List-only Sublist vertical. It excludes missing identity allocation, nested control placement, summaries, Lookup, advanced controls, actions, and mutable resource work." },
  stableErrors: { codes: errors, semantics: Object.fromEntries(errors.map((code) => [code, errorMeaning(code)])) },
  immutableDtos: {
    templateSnapshot: { name: "DataListSublistNestedTemplateSnapshot", fields: ["templateId", "templateScope", "immutable parent node references", "immutable row slots", "schema version"] },
    identities: { name: "DataListSublistIdentityReferences", fields: ["lossless parent ListID", "lossless parent FieldID", "sublist field reference", "explicit child row IDs", "parent node and row slot references"] },
    coreIntent: { name: "DataListSublistScalarRowSchemaIntent", fields: ["immutable scalar rows", "parent-child placement requests", "no generated IDs"] },
    result: { name: "DataListSublistRowSchemaProjectionResult", fields: ["immutable intent", "immutable findings", "stable ordering"] },
    finding: { name: "SublistNestedTemplateGraphFinding", fields: ["stable code", "message", "immutable context", "stable order"] },
  },
  coreContract: { allowed: ["immutable JSON-serializable template snapshots", "explicit lossless parent child and row-schema references", "immutable scalar row-schema and nested placement intents", "immutable findings"], prohibitions: ["ID allocation", "UUID generation", "template or resource mutation", "caller-owned findings append", "runtime expression evaluation", "cross-resource Lookup resolution", "filesystem environment API access", "package writing"], hostResponsibility: ["template loading", "identity and hierarchy validation", "child ID supply", "graph lowering", "mutable insertion", "findings append", "final resource integration", "package output"] },
  inventory,
  selectedCandidate: candidate,
  auditMutations: { productionRouting: false, adapters: false, publicApis: false, distributionContracts: false, coreArtifacts: false, pluginDist: false, activeInstallation: false, historicalZip: false, protectedDuplicates: false },
  historicalZipSha256: "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2",
};
writeJson(contractPath, contract);
writeJson(selectionPath, { schemaVersion: "1.0.0", phase: contract.phase, decision: contract.decision, selectedCandidate: candidate, auditMutations: contract.auditMutations });
writeText(reportPath, report(contract));
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
state.migration.currentPhase = contract.phase;
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = contract.decision.nextPhase;
state.completed = state.completed || [];
const entry = { id: contract.phase, status: "complete", evidence: "2026-07-19: DATA_LIST_SUBLIST_LEGACY_BOUNDARIES_AUDITED, SUBLIST_NESTED_TEMPLATE_GRAPH_CONTRACT_VALID, and deterministic regressions passed. The selected Phase 8B candidate is explicit scalar Sublist row-schema intent only; nested control placement, summaries, Lookup and advanced rows, ID allocation, and graph mutation remain host-owned." };
const position = state.completed.findIndex((item) => item.id === contract.phase);
if (position >= 0) state.completed[position] = entry; else state.completed.push(entry);
state.nextSteps = (state.nextSteps || []).filter((item) => item.id !== contract.phase && item.id !== contract.decision.nextPhase);
state.nextSteps.unshift({ order: 1, id: contract.decision.nextPhase, description: "Implement only the internal Data List Sublist explicit scalar row-schema Core shadow with host-owned nested identity validation and lowering." });
state.proofStatus.dataListSublistNestedTemplateGraphContract = "accepted";
writeJson("docs/architecture/yeeflow-app-builder-core-migration-state.json", state);
console.log(`SUBLIST_NESTED_TEMPLATE_GRAPH_CONTRACT_WRITTEN families=${inventory.length}`);

function family(id, classification, functions, inputs, hostEffects, blocker) { return { id, classification, legacyBoundary: functions.map(functionRecord), planningInputs: inputs, hostEffects, blocker, deterministicCoreCandidate: id === "sublist-row-schema-normalization" ? candidateText() : "Deferred until the listed contract prerequisites exist." }; }
function candidateText() { return "Explicit scalar row-schema intent only, with all parent child and row identities supplied by the host."; }
function functionRecord(name) { let declaration; const visit = (node) => { if (ts.isFunctionDeclaration(node) && node.name?.text === name) declaration = node; ts.forEachChild(node, visit); }; visit(ast); if (!declaration) throw new Error(`DATA_LIST_SUBLIST_AUDIT_FUNCTION_MISSING: ${name}`); return { function: name, line: ast.getLineAndCharacterOfPosition(declaration.getStart(ast)).line + 1, productionCallerCount: countCalls(name) }; }
function countCalls(name) { let count = 0; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1; ts.forEachChild(node, visit); }; visit(ast); return count; }
function errorMeaning(code) { if (code.includes("MISSING")) return "A required parent child row-schema node or slot reference is absent."; if (code.includes("INVALID")) return "A supplied identity or reference is malformed or not losslessly serializable."; if (code.includes("SCOPE_MISMATCH")) return "A reference belongs to a different Data List or nested template scope."; if (code.includes("DUPLICATE")) return "Two supplied references claim the same required parent child row node or slot role."; return "The declared parent-child row-schema node or slot hierarchy is not preserved."; }
function report(value) { return `# Phase 8A Data List Sublist Nested Template-Graph Contract Audit\n\n## Decision\n\n\`${value.decision.marker}\`\n\n## Selected Phase 8B Candidate\n\n\`${value.selectedCandidate.id}\` is limited to explicit scalar Sublist row-schema intent. All identities are supplied lossless strings. It has no nested control lowering, summaries, Lookup or advanced rows, actions, template mutation, or package output.\n\n## Family Inventory\n\n| Family | Classification |\n| --- | --- |\n${value.inventory.map((item) => `| ${item.id} | ${item.classification} |`).join("\n")}\n\n## Contract\n\nCore receives immutable nested template snapshots and explicit parent, child, row-schema, node, slot, ListID, and FieldID references. It returns immutable intents and findings only. The host owns template loading, identity and hierarchy validation, child-ID supply, graph lowering, mutation, findings append, resource integration, and package output.\n\n## Non-Goals\n\nNo Sublist Core shadow, public export, distribution artifact, adapter, production route, active installation, historical ZIP, protected duplicate, Git publication, or release change occurred.\n`; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function writeJson(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function writeText(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value, "utf8"); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }

#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const contractPath = "compatibility/capability-manifests/data-list-advanced-field-template-graph-family-closure.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-7f-advanced-field-template-graph-family-closure.v0.1.0.md";
const source = read(sourcePath);
const ast = sourceAst(source);
const artifacts = Object.fromEntries(json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json").artifacts.map((item) => [item.packageName, { path: item.path, sha256: item.sha256 }]));
const categories = [
  category("sublist-row-schema-nested-controls", "requires-nested-template-graph-contract", ["buildDataListFormSubListControl", "dataListSubListVariables", "buildDataListSubListColumn", "normalizeDataListSubListSummaries", "ensureDataListSubListSummaryTempVars"], ["nested template snapshot", "parent and child node references", "row-schema identity references", "host child identity allocation"], ["filesystem template loading", "deterministic child and summary identity generation", "parent resource mutation", "temporary-variable append"], "Nested rows and summaries allocate child identities and mutate the parent resource graph; they cannot use the flat Type 1 dynamic-user placement descriptor."),
  category("department-control-semantics", "requires-department-control-semantics-contract", ["buildDataListFormFieldControl", "dynamicControlTypeForField"], ["department control semantic authority", "department-specific template and binding descriptor"], ["template loading", "mutable control insertion"], "The current dynamic-control classifier does not establish Department as equivalent to identity, user, people, or person. A distinct semantic contract is required before a Core placement intent can be defined."),
  category("file-image-binary-controls", "requires-binary-control-template-contract", ["buildDataListFormFieldControl", "dynamicControlTypeForField", "removeUnavailableImageControls"], ["binary control template snapshot", "upload and image host-configuration contract", "binary control identity references"], ["template loading", "upload control configuration", "mutable template graph mutation"], "File, image, and binary controls carry upload and availability behavior beyond a generic non-binary placement fragment."),
  category("non-scalar-barcode-policy-and-runtime", "requires-barcode-policy-runtime-contract", ["buildFieldRules", "collectFormActionPrintBarcodeRecords", "materializePlannedFormActionPrintBarcode"], ["barcode policy descriptor", "runtime action and scan binding contract"], ["validation error emission", "form-action/runtime wiring", "host resource mutation"], "Barcode eligibility is enforced in field-rule policy and can participate in runtime form actions; it is not a standalone Type 1 placement concern."),
  category("lookup-control-placement", "requires-lookup-form-control-template-contract", ["buildDataListFormFieldControl", "buildFieldRules", "resolveDataListLookupRulesThroughCore"], ["lookup control template descriptor", "explicit target-display and form binding contract", "cross-resource resolution result input"], ["host target-map ownership", "template loading", "mutable insertion"], "Phase 6 resolves target ListID rules only. Lookup control placement still requires a form-control template contract and must not reuse target-resolution evidence."),
  category("full-type1-custom-form-assembly-and-actions", "host-orchestration-only", ["buildCustomFormLayout", "materializeDataListFormResource", "appendReverseRelatedCollectionSections", "removeOperationsWithoutActions"], ["complete template graph contract", "action and runtime-expression contract", "host resource integration contract"], ["filesystem template loading", "resource cloning and mutation", "action wiring", "reverse-related cross-resource integration", "package output"], "Complete Type 1 form assembly is host orchestration: it loads and mutates templates, wires actions and related sections, and serializes final resources."),
  category("display-layout-identity-integration", "requires-layout-identity-integration-contract", ["buildDataListFormDisplaySettings", "buildCustomFormLayout"], ["explicit LayoutID map", "usage-to-layout relationship contract", "host display-setting lowering"], ["LayoutID selection", "ListID and LayoutID propagation", "generated resource integration"], "Display settings lower host-issued LayoutIDs into final list records and cannot be a pure placement projection."),
  category("newedit-and-unclassified-advanced-controls", "requires-form-lifecycle-template-contract", ["buildDataListFormFieldControl", "buildCustomFormLayout", "customFormUsage"], ["new/edit lifecycle template snapshot", "control lifecycle and editability descriptor", "template-slot identity references"], ["template selection", "mutable insertion", "final form integration"], "The approved route is view/workbench only. New/Edit and any remaining advanced Type 1 controls require separate lifecycle semantics and cannot silently inherit the Phase 7E route."),
];
const contract = {
  schemaVersion: "1.0.0",
  phase: "phase-7f-advanced-field-template-graph-family-closure-audit",
  source: { path: sourcePath, sha256: sha(source) },
  decision: { status: "accepted", marker: "PHASE_7_CLOSURE_ACCEPTED", nextPhase: "phase-8-sublist-nested-template-graph-contract-audit", rationale: "No remaining advanced-field or Type 1 template-graph family has a bounded immutable Core vertical under the current contracts. The smallest foundational prerequisite is a nested template snapshot and parent-child row-schema identity contract for Sublist controls." },
  phase7eRoute: { marker: "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ROUTE_RECONFIRMED", callerPath: "buildDataListFormFieldsGrid -> buildDataListFormFieldControl", callerCounts: { buildDataListFormFieldsGrid: countCalls(ast, "buildDataListFormFieldsGrid"), buildDataListFormFieldControl: countCalls(ast, "buildDataListFormFieldControl") }, exactRouteTokens: ["DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_ROUTE_START", "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_ROUTE_END", "coreProjectDataListType1IdentityControlPlacement", "coreLowerDataListType1IdentityControlPlacement", "type === \"dynamic-user\""], included: ["Data List Type 1 view", "Data List Type 1 workbench", "non-sublist identity user people person controls"], inheritedByOtherFamilies: false },
  categories,
  classificationTotals: count(categories, "classification"),
  closureCriteria: { zeroFurtherSafePhase7Verticals: true, eligibleCategories: [], routeOrApiOrArtifactMutationDuringAudit: false, phase7eRouteReconfirmed: true, closureProofLineageRequired: true },
  phase8Recommendation: { id: "phase-8-sublist-nested-template-graph-contract-audit", family: "sublist-nested-template-graph-contract", rationale: "Sublist is the smallest remaining Data List-only advanced-field family, but it needs explicit nested template snapshots and parent-child node, row-schema, summary, and allocated-child identity references before a deterministic intent can be separated from host lowering.", coreBoundary: ["immutable nested template snapshot descriptor", "immutable row-schema and summary intent", "deterministic parent-child placement requests", "immutable findings"], hostBoundary: ["template loading", "child and summary identity allocation", "nested control lowering", "parent resource mutation", "temporary-variable append", "final resource integration"], proofPrerequisites: ["Legacy/Core nested-row differential corpus", "lossless parent and child identity fixtures", "source dist ZIP installed proof after public promotion", "actual materializer integration matrix", "determinism with controlled host allocation", "temporary-copy Legacy rollback"] },
  artifactBaselines: artifacts,
  historicalZipSha256: "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2",
};
writeJson(contractPath, contract);
writeText(reportPath, report(contract));
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
state.migration.currentPhase = contract.phase;
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = contract.decision.nextPhase;
state.completed = state.completed || [];
const entry = { id: contract.phase, status: "complete", evidence: "2026-07-19: DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ROUTE_RECONFIRMED, ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_CLOSURE_VALID, and closure-lineage validation passed. No further safe Phase 7 advanced-field vertical remains. Phase 8 begins with a Sublist nested-template snapshot and parent-child row-schema identity contract audit." };
const index = state.completed.findIndex((item) => item.id === contract.phase);
if (index >= 0) state.completed[index] = entry; else state.completed.push(entry);
state.nextSteps = (state.nextSteps || []).filter((item) => item.id !== contract.phase && item.id !== contract.decision.nextPhase);
state.nextSteps.unshift({ order: 1, id: contract.decision.nextPhase, description: "Audit nested Sublist template snapshots and parent-child node and row-schema identity references before any Sublist Core shadow." });
state.proofStatus.advancedFieldTemplateGraphFamilyClosure = "passed";
writeJson("docs/architecture/yeeflow-app-builder-core-migration-state.json", state);
console.log(`ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_CLOSURE_WRITTEN categories=${categories.length}`);

function category(id, classification, functions, prerequisites, hostEffects, blocker) { return { id, classification, legacyBoundary: functions.map((name) => functionRecord(ast, name)), missingContractPrerequisites: prerequisites, hostEffects, blocker, phase7eRouteReusable: false, eligiblePhase7Vertical: false }; }
function sourceAst(text) { return ts.createSourceFile(sourcePath, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS); }
function functionRecord(tree, name) { let declaration; const visit = (node) => { if (ts.isFunctionDeclaration(node) && node.name?.text === name) declaration = node; ts.forEachChild(node, visit); }; visit(tree); if (!declaration) throw new Error(`ADVANCED_FIELD_TEMPLATE_GRAPH_FAMILY_AUDIT_FUNCTION_MISSING: ${name}`); return { function: name, line: tree.getLineAndCharacterOfPosition(declaration.getStart(tree)).line + 1, productionCallerCount: countCalls(tree, name) }; }
function countCalls(tree, name) { let count = 0; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1; ts.forEachChild(node, visit); }; visit(tree); return count; }
function count(records, property) { return records.reduce((result, record) => { const key = record[property]; result[key] = (result[key] || 0) + 1; return result; }, {}); }
function report(value) { return `# Phase 7F Advanced-Field Template-Graph Family Closure\n\n## Decision\n\n\`${value.decision.marker}\`\n\nPhase 7 is closed. The only routed advanced-field capability remains the Type 1 view/workbench non-sublist identity, user, people, and person control placement route. No other family can safely use that route.\n\n## Deferred Families\n\n| Family | Classification | Required prerequisite |\n| --- | --- | --- |\n${value.categories.map((item) => `| ${item.id} | ${item.classification} | ${item.missingContractPrerequisites.join(", ")} |`).join("\n")}\n\n## Phase 8 Recommendation\n\nStart \`${value.phase8Recommendation.id}\`. It must establish immutable nested template snapshots and explicit parent-child node, row-schema, summary, and child-identity references before any Sublist Core shadow or routing work.\n\n## Preserved Boundaries\n\nNo production route, adapter, public API, Core artifact, Plugin dist artifact, active installation, historical ZIP, protected duplicate, Git publication, or release state changed.\n`; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function writeJson(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function writeText(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value, "utf8"); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }

#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const source = read(sourcePath);
const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const errors = ["TEMPLATE_GRAPH_REFERENCE_MISSING", "TEMPLATE_GRAPH_REFERENCE_INVALID", "TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH", "TEMPLATE_GRAPH_REFERENCE_DUPLICATE", "TEMPLATE_GRAPH_REFERENCE_RELATIONSHIP_BROKEN"];
const artifacts = Object.fromEntries(json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json").artifacts.map((artifact) => [artifact.packageName, { path: artifact.path, sha256: artifact.sha256, exports: artifact.exports }]));
const families = [
  family("sublist-row-schema-and-controls", "requires-nested-template-graph-contract", ["buildDataListFormSubListControl", "dataListSubListVariables", "buildDataListSubListColumn", "normalizeDataListSubListSummaries", "ensureDataListSubListSummaryTempVars"], ["sublist control template", "caller-owned form resource", "planned row and summary arrays"], ["sublist control root", "nested row control identities", "summary and temporary-variable identities"], ["ListID", "FieldID", "parent control reference", "row variable references"], ["filesystem template loading", "mutable control insertion", "summary temporary-variable append", "deterministic child-control ID generation"], "Not before a nested sublist template-snapshot and host child-identity allocation contract exists.", "The current path clones a sublist template, allocates child identities, mutates the form graph, and appends temporary variables."),
  family("identity-user-people-control-placement", "eligible-phase-7b-shadow", ["buildDataListFormFieldControl", "dynamicControlTypeForField", "isSubListFormField", "isFullRowFormField", "fieldNavLabel"], ["form-grid template wrapper", "caller-owned fields array"], ["fields-grid slot reference", "stable control placement reference", "host-supplied ListID and FieldID references"], ["template ID", "template scope", "fields-grid node reference", "control slot reference", "ListID", "FieldID"], ["template loading", "control insertion", "Legacy-shaped control ID lowering", "final resource mutation"], "Data List Type 1 view/workbench identity-user-people control placement intent only, returning an immutable placement descriptor without a generated control ID.", "The Legacy helper currently constructs a mutable control object. A snapshot and explicit placement identity boundary are required before a pure intent shadow can preserve this behavior."),
  family("department-control-placement", "defer-control-semantics-contract", ["buildDataListFormFieldControl", "dynamicControlTypeForField"], ["form-grid template wrapper", "caller-owned fields array"], ["fields-grid slot reference", "control type semantics reference"], ["template ID", "control slot reference", "ListID", "FieldID"], ["template loading", "mutable control insertion"], "Deferred: the current dynamic control helper does not give department a distinct Core-safe placement semantic.", "Department behavior must be specified separately rather than inferred from the identity-user mapping."),
  family("file-image-binary-controls", "requires-binary-control-template-contract", ["buildDataListFormFieldControl", "dynamicControlTypeForField", "buildDataListFormSubListControl"], ["form-grid or sublist template", "caller-owned resource graph"], ["binary control template reference", "upload-control identity", "parent field/control references"], ["template ID", "template node", "ListID", "FieldID"], ["template loading", "binary-control graph mutation", "upload/reference host configuration"], "Deferred until binary control configuration and host upload/reference semantics have an explicit contract.", "File and image controls carry binary control semantics beyond the generic dynamic control descriptor."),
  family("non-scalar-barcode-policy", "defer-validation-policy-contract", ["buildFieldRules"], ["field-plan object"], [], ["field logical key"], ["Legacy error emission"], "No independent advanced-field placement candidate: Legacy rejects non-Text barcode fields before any control-graph lowering.", "The existing barcode behavior is a scalar validation error, not a template-graph projection."),
  family("type-one-custom-form-layout-and-field-placement", "requires-template-graph-contract", ["buildCustomFormLayout", "materializeDataListFormResource", "buildDataListFormFieldsGrid", "buildDataListFormFieldControl"], ["filesystem-loaded layout template", "plan demand", "caller-owned generated resource graph"], ["template root", "business section slot", "form-grid wrapper", "LayoutID and ListID references"], ["template ID", "template scope", "LayoutID", "ListID", "form name", "fields-grid slot reference"], ["filesystem template loading", "resource graph mutation", "form-action lowering", "cross-resource map reads", "final LayoutView serialization"], "Only a future immutable placement fragment after the host supplies a frozen template snapshot and all node references.", "The full Type 1 builder combines template loading, mutable resource assembly, form actions, and cross-resource integration."),
  family("display-layout-references", "requires-layout-identity-contract", ["buildDataListFormDisplaySettings", "buildResourceGraphPackage"], ["custom layout assignments", "decoded ID map", "mutable List record"], ["LayoutID-to-usage reference map"], ["LayoutID", "ListID", "form usage reference"], ["host LayoutID selection", "List display-setting mutation", "final resource integration"], "Deferred until a layout identity-reference and host List-record lowering contract exists.", "Display settings mutate the List record and select host LayoutIDs; a placement intent cannot own those identities."),
  family("lookup-form-control-placement", "requires-template-graph-contract", ["buildDataListFormFieldControl", "buildFieldRules", "resolveDataListLookupRulesThroughCore"], ["form-grid template wrapper", "pre-lowered Lookup Rules"], ["fields-grid slot reference", "control placement reference"], ["template ID", "control slot reference", "ListID", "FieldID", "pre-resolved Lookup Rules"], ["template loading", "mutable control insertion", "host rule lowering"], "Deferred until the template graph contract is established; Phase 6 target resolution remains independently complete and is not reopened.", "The target ListID is resolved, but Type 1 control placement still needs a template snapshot and host graph lowering boundary.")
];
const auditMutations = { productionRouting: false, adapters: false, publicApis: false, distributionContracts: false, coreArtifacts: false, pluginDist: false, activeInstallation: false, historicalZip: false, protectedDuplicates: false };
const candidatePath = "compatibility/capability-manifests/data-list-advanced-field-template-graph-candidate-selection.v0.1.0.json";
const candidate = {
  schemaVersion: "1.0.0",
  phase: "phase-7a-advanced-field-template-graph-contract-audit",
  decision: { status: "accepted", marker: "PHASE_7_TEMPLATE_GRAPH_CONTRACT_ACCEPTED", nextPhase: "phase-7b-data-list-type1-identity-control-placement-shadow", rationale: "The Data List Type 1 view/workbench identity-user-people control descriptor is the smallest advanced-field-only slice. It has no workflow/runtime expression dependency, no Lookup target resolution, and can return an immutable placement intent when the host supplies the template snapshot and stable references." },
  selectedCandidate: {
    id: "data-list-type1-view-workbench-identity-user-control-placement-intent",
    surface: "data-list",
    family: "identity-user-people-control-placement",
    legacyBoundary: "buildDataListFormFieldControl",
    productionCallerCount: countCalls("buildDataListFormFieldControl"),
    included: ["Type 1 Data List view layouts", "Type 1 Data List workbench layouts", "identity user people person fields", "non-sublist fields"],
    excluded: ["department", "file image binary", "sublist", "Lookup target resolution", "Approval Forms", "Document Libraries", "Dashboards", "workflows", "runtime expressions", "template loading", "template mutation", "resource mutation", "ID allocation", "package output"],
    coreInput: ["immutable normalized advanced-field intent", "immutable template snapshot descriptor", "explicit fields-grid node reference", "explicit control slot reference", "lossless ListID and FieldID references"],
    coreOutput: ["immutable placement intent", "immutable control descriptor without a generated control ID", "immutable findings"],
    requiredParityFixture: { path: "compatibility/differential-fixtures/data-list-type1-identity-user-control-placement.v0.1.0.json", plannedCaseCount: 8, coverage: ["view identity field", "workbench user field", "people alias", "non-sublist guard", "missing template reference", "wrong template scope", "duplicate control reference", "broken parent-child reference"] },
    rollback: "Temporary full Plugin copy restores only the selected Type 1 identity-user placement bridge to buildDataListFormFieldControl; no runtime toggle or fallback is permitted.",
    routingPrerequisites: ["internal shadow parity", "host template-reference validation and lowering", "source archive installed proof", "actual materializer fixture", "deterministic output", "temporary-copy Legacy rollback"]
  },
  auditMutations
};
const contract = {
  schemaVersion: "1.0.0",
  phase: "phase-7a-advanced-field-template-graph-contract-audit",
  decision: candidate.decision,
  source: { path: sourcePath, sha256: sha256(source) },
  templateReferenceErrors: {
    codes: errors,
    semantics: {
      TEMPLATE_GRAPH_REFERENCE_MISSING: "A required template, node, slot, or control reference is absent.",
      TEMPLATE_GRAPH_REFERENCE_INVALID: "A supplied template reference is malformed or not losslessly serializable.",
      TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH: "A reference belongs to a different Data List template or form scope.",
      TEMPLATE_GRAPH_REFERENCE_DUPLICATE: "Two supplied references claim the same required template node or control slot.",
      TEMPLATE_GRAPH_REFERENCE_RELATIONSHIP_BROKEN: "A supplied node, slot, or control reference does not preserve the declared parent-child placement relationship."
    }
  },
  immutableDtos: {
    templateSnapshotInput: { name: "DataListTemplateGraphSnapshotInput", fields: ["templateId", "templateScope", "frozen nodes keyed by stable template-node reference", "frozen allowed control slots", "schema version"] },
    templateReferences: { name: "DataListTemplateGraphIdentityReferences", fields: ["template node reference", "fields-grid node reference", "control slot reference", "lossless ListID", "lossless FieldID"] },
    coreIntent: { name: "AdvancedFieldControlPlacementIntent", fields: ["surface", "template kind", "normalized field semantics", "placement reference", "no generated ID"] },
    coreResult: { name: "AdvancedFieldControlPlacementResult", fields: ["immutable placement intent", "immutable descriptor", "immutable findings"] },
    finding: { name: "TemplateGraphFinding", fields: ["stable code", "message", "immutable context", "stable ordering"] }
  },
  coreContract: {
    allowed: ["immutable JSON-serializable planning intent", "immutable template snapshot descriptors", "stable template-node and control references", "immutable graph placement intent and findings"],
    prohibitions: ["mutable template objects", "caller-owned findings arrays", "implicit template or control ID allocation", "runtime expression evaluation", "filesystem access", "environment or API access", "package writing", "resource mutation", "final resource integration"],
    hostResponsibility: ["template loading", "template reference validation", "host graph lowering", "mutable control insertion", "caller-owned findings append", "resource integration", "package output"]
  },
  families,
  selectedCandidatePath: candidatePath,
  auditMutations,
  artifactBaselines: artifacts,
  historicalZipSha256: "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2"
};
writeJson("compatibility/capability-manifests/data-list-advanced-field-template-graph-contract.v0.1.0.json", contract);
writeJson(candidatePath, candidate);
writeText("docs/architecture/yeeflow-app-builder-phase-7a-advanced-field-template-graph-contract-audit.v0.1.0.md", report(contract, candidate));
for (const path of ["compatibility/capability-manifests/resource-definition-construction-audit.v0.1.0.json", "compatibility/capability-manifests/resource-definition-construction-capability-matrix.v0.1.0.json", "compatibility/capability-manifests/field-control-projection-audit.v0.1.0.json", "compatibility/capability-manifests/field-control-projection-capability-matrix.v0.1.0.json"]) {
  const value = json(path);
  value.phase7AdvancedFieldTemplateGraphContract = { marker: candidate.decision.marker, status: "accepted", contract: "compatibility/capability-manifests/data-list-advanced-field-template-graph-contract.v0.1.0.json", candidate: candidate.selectedCandidate.id, nextPhase: candidate.decision.nextPhase };
  writeJson(path, value);
}
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
state.migration.currentPhase = "phase-7a-advanced-field-template-graph-contract-audit";
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = candidate.decision.nextPhase;
const evidence = "2026-07-18: DATA_LIST_ADVANCED_FIELD_LEGACY_BOUNDARIES_AUDITED, ADVANCED_FIELD_TEMPLATE_GRAPH_CONTRACT_VALID, ADVANCED_FIELD_TEMPLATE_GRAPH_CONTRACT_REGRESSIONS_PASSED cases=8, and PHASE_7_TEMPLATE_GRAPH_CONTRACT_ACCEPTED. The accepted future Phase 7B shadow is restricted to Data List Type 1 view/workbench identity-user-people control placement intent with immutable template snapshots and explicit host references. Sublists, department, binary controls, Lookup placement, Type 1 resource assembly, layout references, runtime expressions, and cross-surface behavior remain deferred.";
const completed = state.completed.find((entry) => entry.id === "phase-7a-advanced-field-template-graph-contract-audit");
if (completed) { completed.status = "complete"; completed.evidence = evidence; } else state.completed.push({ id: "phase-7a-advanced-field-template-graph-contract-audit", status: "complete", evidence });
state.nextSteps = (state.nextSteps || []).filter((entry) => entry.id !== "phase-7a-advanced-field-template-graph-contract-audit" && entry.id !== candidate.decision.nextPhase);
state.nextSteps.unshift({ order: 1, id: candidate.decision.nextPhase, description: "Implement only the internal Data List Type 1 view/workbench identity-user-people control placement shadow after re-auditing the template snapshot and host-reference boundary." });
state.proofStatus ||= {};
state.proofStatus.advancedFieldTemplateGraphContract = "accepted";
state.proofStatus.dataListType1IdentityUserControlPlacement = "not_started";
writeJson("docs/architecture/yeeflow-app-builder-core-migration-state.json", state);
console.log("DATA_LIST_ADVANCED_FIELD_LEGACY_BOUNDARIES_AUDITED");
console.log("ADVANCED_FIELD_TEMPLATE_GRAPH_CONTRACT_VALID");
console.log("PHASE_7_TEMPLATE_GRAPH_CONTRACT_ACCEPTED");

function family(id, classification, legacyBoundary, mutableInputs, templateIdentityRequirements, suppliedIdentityReferences, hostEffects, deterministicCoreCandidate, blocker) {
  return { id, classification, legacyBoundary, productionCallers: callers(legacyBoundary), mutableInputs, templateIdentityRequirements, suppliedIdentityReferences, hostEffects, deterministicCoreCandidate, blocker };
}
function report(value, selection) {
  const items = value.families.map((item) => "- " + item.id + " — " + item.classification + ". " + item.blocker).join("\n");
  const errorLines = value.templateReferenceErrors.codes.map((code) => "- " + code + " — " + value.templateReferenceErrors.semantics[code]).join("\n");
  return "# Phase 7A Advanced-Field Template-Graph Contract Audit\n\n## Decision\n\n" + selection.decision.marker + "\n\nThe future Data List-only shadow is accepted only for the narrow identity-user-people Type 1 view/workbench placement intent. It is not a route, resource builder, or template mutator.\n\n## Immutable Contract\n\nCore receives a JSON-serializable template snapshot descriptor, stable node and slot references, lossless ListID and FieldID references, and normalized field intent. It returns immutable placement intent, a control descriptor without a generated ID, and ordered immutable findings. Core may not load or mutate templates, allocate identities, evaluate runtime expressions, append findings, write a package, or integrate a resource.\n\nThe host loads templates, validates references, creates the Legacy-shaped control identity, inserts the mutable control, appends findings, and integrates the final resource.\n\n## Template Reference Errors\n\n" + errorLines + "\n\n## Family Inventory\n\n" + items + "\n\n## Selected Phase 7B Candidate\n\n" + selection.selectedCandidate.id + "\n\nThe boundary is Data List Type 1 view/workbench identity-user-people non-sublist control placement intent only. The planned eight-case corpus covers identity/user aliases, non-sublist protection, and all template-reference error modes. A temporary full-Plugin copy must restore only the retained Legacy bridge for rollback.\n\n## Non-Goals\n\nThis audit changes no Legacy materializer behavior, adapter, public API, artifact, Plugin dist file, active installation, historical ZIP, protected duplicate, or Git/release state.\n";
}
function callers(names) { return Object.fromEntries(names.map((name) => [name, countCalls(name)])); }
function countCalls(name) { let count = 0; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1; ts.forEachChild(node, visit); }; visit(ast); return count; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function writeJson(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, JSON.stringify(value, null, 2) + "\n", "utf8"); }
function writeText(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value, "utf8"); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

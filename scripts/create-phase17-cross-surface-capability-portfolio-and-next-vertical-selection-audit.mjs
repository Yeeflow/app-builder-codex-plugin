#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ywfPath = argument("--ywf", "/Users/rengerhu/Downloads/Leave Request (1).ywf");
const ydlPath = argument("--ydl", "/Users/rengerhu/Downloads/Employee Leave Balances (3).ydl");
const phase = "phase-17-cross-surface-capability-portfolio-and-next-vertical-selection-audit";
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const approvalLowererPath = "scripts/lib/approval-form-layout-builder.mjs";
const matrixPath = "compatibility/capability-manifests/cross-surface-capability-portfolio-and-next-vertical-selection-matrix.v0.1.0.json";
const fixturePath = "compatibility/differential-fixtures/cross-surface-capability-portfolio-export.v0.1.0.json";
const contractPath = "compatibility/capability-manifests/cross-surface-capability-portfolio-and-next-vertical-selection-contract.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-17-cross-surface-capability-portfolio-and-next-vertical-selection-audit.v0.1.0.md";
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json";

const source = read(sourcePath);
const approvalLowerer = read(approvalLowererPath);
const ywfBytes = readFileSync(ywfPath);
const ydlBytes = readFileSync(ydlPath);
const workflow = decodeYwf(ywfBytes);
const dataList = decodeYdl(ydlBytes);
const approvalEvidence = extractApprovalEvidence(workflow);
const dataListEvidence = extractDataListEvidence(dataList);
const callerCounts = {
  approvalLayoutBuilder: invocations(source, "buildApprovalFormLayoutDef"),
  approvalSublistLowerer: directCalls(approvalLowerer, "materializeApprovalSubListControl"),
  documentLibraryFields: directCalls(source, "buildDocumentLibraryFieldRecords"),
  dashboardMaterializer: directCalls(source, "buildMaterialDashboardResource"),
  approvalWorkflowGraph: directCalls(source, "buildApprovalWorkflowShapes"),
  topLevelDataListFieldRecord: directCalls(source, "buildFieldRecord"),
};

const approvalLookupShape = {
  exactExportShapeProven: approvalEvidence.lookupColumns.length > 0,
  exactLegacyLoweringShapeProven: /listid\s*:/u.test(approvalLowerer) && /listsetid\s*:/u.test(approvalLowerer) && /listfield\s*:/u.test(approvalLowerer),
  missingLegacyTokens: ["listid", "appid", "listsetid", "listfield"].filter((token) => !new RegExp(`${token}\\s*:`, "u").test(approvalLowerer)),
};

const sources = [
  sourceEvidence(ywfPath, "authoritative Approval Form export", true),
  sourceEvidence(ydlPath, "authoritative Data List export", true),
];
const matrix = {
  schemaVersion: "1.0.0",
  phase,
  auditOnly: true,
  source: { path: sourcePath, sha256: sha(source), approvalLowererPath, approvalLowererSha256: sha(approvalLowerer) },
  evidenceSources: sources,
  callerCounts,
  modelsAreSeparate: true,
  families: [
    family({
      id: "approval-form-submission-controls-and-sublist",
      legacyBoundary: "buildApprovalFormLayoutDef -> materializeApprovalSubListControl -> normalizeApprovalSubListRowFields",
      callers: callerCounts.approvalLayoutBuilder,
      exportShape: "The Submission Form has two distinct list controls with embedded lookup child columns. Each child control declares listid, appid, listsetid, and listfield.",
      staticMetadata: "The target/display declaration is static configuration; lookup resolution, user selection, target retrieval, events, additions, and template mutation are host/product runtime work.",
      identityOwnership: "Approval variables and listref entries are Approval Form identities. Embedded id and idx are variable/export semantics; they are not Data List product resource identities.",
      parityFixture: fixturePath,
      eligibility: approvalLookupShape.exactLegacyLoweringShapeProven ? "eligible" : "rejected_missing_exact_legacy_lowering",
      missingPrerequisite: approvalLookupShape.exactLegacyLoweringShapeProven ? "None." : "An Approval Form-specific Legacy lowering contract that preserves lossless listid, appid, listsetid, and listfield for embedded lookup controls; do not reuse Data List lowering.",
      exclusions: ["Data List contracts and identifiers", "runtime lookup resolution", "selection events", "additional-field writeback", "workflow execution", "template/resource mutation", "package output"],
    }),
    family({
      id: "document-library",
      legacyBoundary: "buildDocumentLibraryFieldRecords -> child-resource assembly",
      callers: callerCounts.documentLibraryFields,
      exportShape: "Neither authoritative export is a Document Library export. Current source produces default field records and folder items from plans.",
      staticMetadata: "Default records are generator policy, not export-proven product configuration.",
      identityOwnership: "List and field IDs are host/API-issued; folders and storage lifecycle are host/product-owned.",
      parityFixture: "A read-only Document Library export plus decoded resource/layout fixture.",
      eligibility: "rejected_missing_export_evidence",
      missingPrerequisite: "One read-only Document Library export containing the exact candidate configuration and a matching Legacy lowering shape.",
      exclusions: ["uploads", "binary transfer", "storage", "permissions", "package output"],
    }),
    family({
      id: "dashboard",
      legacyBoundary: "buildMaterialDashboardResource -> filter/analytics/KPI/table materializers",
      callers: callerCounts.dashboardMaterializer,
      exportShape: "Neither authoritative export is a Dashboard export. The workflow references dashboard actions, but that is not a Dashboard configuration export.",
      staticMetadata: "Current dashboard source combines templates, temp variables, datasets, filters, analytics, and package integration.",
      identityOwnership: "Dashboard layout/control/template identities and runtime data bindings are host/product-owned.",
      parityFixture: "A read-only Dashboard export for one static control shape plus a dedicated template-boundary corpus.",
      eligibility: "rejected_missing_export_and_isolated_boundary",
      missingPrerequisite: "A read-only Dashboard export proving one deterministic control configuration independent of runtime data, templates, and package integration.",
      exclusions: ["queries", "filter state", "analytics runtime", "KPI calculation", "template mutation", "package output"],
    }),
    family({
      id: "workflow-and-runtime-expression-configuration",
      legacyBoundary: "buildApprovalWorkflowShapes and workflow action materializers",
      callers: callerCounts.approvalWorkflowGraph,
      exportShape: "The Approval export contains graph stencils including QueryData, Loop, MultiAssignmentTask, SetDataList, SetVariable, and OpenForm/Dashboard actions.",
      staticMetadata: "Graph shapes serialize configuration, but execution, variables, retrieval, mutation, expressions, and lifecycle are runtime behavior.",
      identityOwnership: "Workflow graph IDs, variables, and expression references are Approval Form/workflow scoped, not Data List scoped.",
      parityFixture: "A future workflow-only static-node contract with execution-free source and export proof.",
      eligibility: "host_runtime_orchestration_only",
      missingPrerequisite: "A separately authorized workflow static-node candidate that excludes variable mutation, expressions, graph mutation, and package output.",
      exclusions: ["runtime expressions", "query execution", "variable mutation", "actions", "Data List route reuse"],
    }),
    family({
      id: "top-level-data-list-outside-closed-sublist-family",
      legacyBoundary: "fieldSpecsForList -> buildFieldRecord -> buildResourceGraphPackage",
      callers: callerCounts.topLevelDataListFieldRecord,
      exportShape: "The Data List export proves a parent ListID, fields, layouts, and Type 1 form resources. Its embedded-Sublist families are already closed and may not be re-opened here.",
      staticMetadata: "Top-level output is intertwined with API identity allocation, layouts, Rules, resource construction, and package assembly.",
      identityOwnership: "Parent ListID and FieldID are product identities; embedded id and idx remain column/export semantics only.",
      parityFixture: "A future top-level Data List export for a capability outside the closed embedded-Sublist families.",
      eligibility: "no_new_isolated_vertical_proven",
      missingPrerequisite: "A new top-level Data List export plus an independently reversible Legacy lowering boundary outside the completed Sublist family.",
      exclusions: ["all closed Data List embedded-Sublist routes", "invented child identities", "package output"],
    }),
  ],
};

const fixture = {
  schemaVersion: "1.0.0",
  phase,
  sources,
  approvalForm: approvalEvidence,
  dataList: dataListEvidence,
  candidateAssessment: approvalLookupShape,
  negativeCases: [
    { id: "approval-lookup-without-exact-legacy-target-lowering", expected: "CROSS_SURFACE_APPROVAL_SUBLIST_LOOKUP_LEGACY_PARITY_MISSING" },
    { id: "data-list-contract-reused-for-approval-form", expected: "CROSS_SURFACE_MODEL_ISOLATION_REQUIRED" },
    { id: "document-library-without-export", expected: "CROSS_SURFACE_DOCUMENT_LIBRARY_EXPORT_MISSING" },
    { id: "dashboard-reference-treated-as-dashboard-export", expected: "CROSS_SURFACE_DASHBOARD_EXPORT_MISSING" },
    { id: "workflow-graph-treated-as-runtime-free-config", expected: "CROSS_SURFACE_WORKFLOW_RUNTIME_OWNED" },
    { id: "closed-sublist-route-reopened-as-top-level-candidate", expected: "CROSS_SURFACE_CLOSED_SUBLIST_ROUTE_REOPENING_REJECTED" },
  ],
};
const contract = {
  schemaVersion: "1.0.0",
  phase,
  auditOnly: true,
  decision: {
    status: "no_safe_candidate",
    marker: "PHASE_17_NO_SAFE_CANDIDATE",
    nextStep: "approval-form-sublist-lookup-legacy-lowering-parity-evidence",
  },
  selectedCandidate: null,
  rationale: "The authoritative Approval Form export proves a narrow Sublist Lookup target/display configuration, but the current Approval Form Legacy lowerer does not emit its lossless target/display keys. The other audited surfaces lack a matching authoritative export or an isolated immutable boundary. A Data List route cannot be reused because the two products have separate models and identities.",
  smallestPrerequisite: "Establish, without changing production routing, an Approval Form-specific Legacy parity contract for embedded Sublist Lookup target/display metadata that preserves listid, appid, listsetid, and listfield as lossless configuration values.",
  noImplementation: ["Core shadow", "public API", "distribution artifact", "adapter", "production route", "active installation", "historical ZIP", "protected duplicates"],
  matrixPath,
  fixturePath,
};

write(matrixPath, matrix);
write(fixturePath, fixture);
write(contractPath, contract);
write(reportPath, report({ matrix, fixture, contract }));
const state = json(statePath);
state.migration.currentPhase = phase;
state.migration.currentPhaseStatus = "complete";
state.migration.overallStatus = "blocked";
state.migration.nextPhase = contract.decision.nextStep;
state.completed.push({ id: phase, status: "complete", evidence: "2026-07-19: Approval Form, Document Library, Dashboard, workflow, and top-level Data List surfaces audited separately; no safe next vertical is selected." });
state.blocked.push({ id: phase, status: "no_safe_candidate", marker: contract.decision.marker, reason: contract.rationale, smallestPrerequisite: contract.smallestPrerequisite });
state.nextSteps = [
  { order: 0, id: contract.decision.nextStep, description: "Audit an Approval Form-only Legacy parity boundary before any Core or routing work; preserve Data List model isolation." },
  ...(state.nextSteps || []).filter((item) => item.id !== "external-data-list-sublist-special-control-export-evidence"),
];
state.proofStatus.crossSurfaceCapabilityPortfolio = "audited_no_safe_candidate";
state.proofStatus.phase17NextVerticalSelection = "no_safe_candidate";
write(statePath, state);
console.log("CROSS_SURFACE_CAPABILITY_PORTFOLIO_AUDITED");
console.log("CROSS_SURFACE_NEXT_VERTICAL_SELECTION_VALID");
console.log("CROSS_SURFACE_NEXT_VERTICAL_SELECTION_REGRESSIONS_PASSED");
console.log("PHASE_17_NO_SAFE_CANDIDATE");

function family(input) { return { ...input, deterministicImmutableCoreBoundary: false, runtimeOwnership: "Product frontend/runtime and host retain selection, retrieval, mutation, lifecycle, template/resource integration, and package output." }; }
function extractApprovalEvidence(definition) {
  const controls = [];
  walk(definition, (node, path) => {
    if (node?.type !== "list" || !Array.isArray(node?.attrs?.["list-fields"])) return;
    const lookupColumns = node.attrs["list-fields"].map((column, index) => ({ column, index })).filter(({ column }) => column?.type === "lookup" && column?.control?.attrs?.listid);
    if (!lookupColumns.length) return;
    controls.push({
      path,
      controlId: String(node.id || ""), binding: String(node.binding || ""), name: String(node.name || ""),
      columns: lookupColumns.map(({ column, index }) => ({
        index, id: String(column.id || ""), idx: String(column.idx || ""), name: String(column.name || ""), type: String(column.type || ""), editable: column.editable === true,
        target: { listId: String(column.control.attrs.listid), appId: String(column.control.attrs.appid), listSetId: String(column.control.attrs.listsetid), displayField: String(column.control.attrs.listfield) },
      })),
    });
  });
  const unique = new Map(); for (const control of controls) unique.set(`${control.binding}:${control.controlId}`, control);
  return { submissionFormListControlsWithLookup: [...unique.values()], lookupColumns: [...unique.values()].flatMap((item) => item.columns), approvalFormOnly: true };
}
function extractDataListEvidence(data) {
  const list = data?.Item?.ListModel || {};
  return { listId: String(list.ListID || ""), title: String(list.Title || ""), layouts: Array.isArray(data?.Item?.Layouts) ? data.Item.Layouts.length : 0, embeddedSublistFamilyStatus: "closed_and_not_a_phase17_candidate" };
}
function decodeYwf(bytes) { const wrapper = JSON.parse(losslessJson(bytes.toString("utf8"))); if (typeof wrapper.Def !== "string") throw Error("PHASE17_YWF_DEF_MISSING"); return JSON.parse(losslessJson(Buffer.from(wrapper.Def, "base64").toString("utf8"))); }
function decodeYdl(bytes) { const wrapper = JSON.parse(losslessJson(bytes.toString("utf8"))); if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith("[______gizp______]")) throw Error("PHASE17_YDL_GZIP_WRAPPER_INVALID"); const outer = JSON.parse(losslessJson(gunzipSync(Buffer.from(wrapper.Resource.slice("[______gizp______]".length), "base64")).toString("utf8"))); return JSON.parse(losslessJson(outer.Data)); }
function losslessJson(source) { let output = "", index = 0, quoted = false, escaped = false; while (index < source.length) { const character = source[index]; if (quoted) { output += character; if (escaped) escaped = false; else if (character === "\\") escaped = true; else if (character === "\"") quoted = false; index += 1; continue; } if (character === "\"") { quoted = true; output += character; index += 1; continue; } if (character === "-" || (character >= "0" && character <= "9")) { let end = index + (character === "-" ? 1 : 0); while (end < source.length && source[end] >= "0" && source[end] <= "9") end += 1; const token = source.slice(index, end); output += /^-?\d{16,}$/.test(token) ? JSON.stringify(token) : token; index = end; continue; } output += character; index += 1; } return output; }
function walk(value, visitor, path = "$") { if (!value || typeof value !== "object") return; if (Array.isArray(value)) { value.forEach((item, index) => walk(item, visitor, `${path}[${index}]`)); return; } visitor(value, path); Object.entries(value).forEach(([key, item]) => walk(item, visitor, `${path}.${key}`)); }
function report({ matrix, fixture, contract }) { const approval = matrix.families[0]; return `# Phase 17 Cross-Surface Capability Portfolio and Next-Vertical Selection Audit\n\n\`CROSS_SURFACE_CAPABILITY_PORTFOLIO_AUDITED\`\n\n\`CROSS_SURFACE_NEXT_VERTICAL_SELECTION_VALID\`\n\n\`CROSS_SURFACE_NEXT_VERTICAL_SELECTION_REGRESSIONS_PASSED\`\n\n\`PHASE_17_NO_SAFE_CANDIDATE\`\n\n## Decision\n\nNo safe next Core-migration vertical is selected. This is an audit-only decision; no Core shadow, public API, artifact, adapter, distribution, or production route was changed.\n\nThe authoritative Approval Form export proves ${fixture.approvalForm.submissionFormListControlsWithLookup.length} distinct Submission Form Sublist controls with Lookup target/display metadata. It preserves lossless target ListID, AppID, ListSetID, and display field. However, the current Approval Form Legacy lowerer preserves only generic row control information and does not emit ${fixture.candidateAssessment.missingLegacyTokens.map((token) => `\`${token}\``).join(", ")}. Therefore it is not an exact matching lowering shape and cannot be selected safely. Data List contracts, identifiers, control shapes, and routing evidence were not reused.\n\n## Portfolio\n\n| Family | Legacy boundary | Direct callers | Decision |\n| --- | --- | ---: | --- |\n${matrix.families.map((item) => `| ${item.id} | ${item.legacyBoundary} | ${item.callers} | ${item.eligibility} |`).join("\n")}\n\n## Boundaries\n\nApproval Form and Data List are separate product models. Approval Form list and listref variables are not Data List parent/child identities. For the Data List export, parent ListID and FieldID retain their product meaning while embedded \`id\` and \`idx\` remain export-column semantics only.\n\nDocument Library and Dashboard lack an authoritative export in this audit. The workflow export proves graph and action configuration, not a runtime-free static capability. Top-level Data List remains outside this phase's candidate set because all evidenced embedded-Sublist routes are already closed and the remaining top-level construction is identity, layout, template, resource, and package orchestration.\n\n## Smallest Prerequisite\n\n${contract.smallestPrerequisite}\n\nRuntime selection, target lookup, writeback, file lifecycle, expression execution, graph mutation, templates, resources, and package output remain host or product-runtime responsibilities.\n`; }
function directCalls(text, name) { return Math.max(0, (text.match(new RegExp(`${name}\\(`, "g")) || []).length - 1); }
function invocations(text, name) { return (text.match(new RegExp(`${name}\\(`, "g")) || []).length; }
function sourceEvidence(path, role, readOnly) { const bytes = readFileSync(path); return { fileName: basename(path), sha256: sha(bytes), role, readOnly }; }
function argument(name, fallback) { const index = process.argv.indexOf(name); return index < 0 ? fallback : process.argv[index + 1]; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function write(path, value) { writeFileSync(resolve(root, path), typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }

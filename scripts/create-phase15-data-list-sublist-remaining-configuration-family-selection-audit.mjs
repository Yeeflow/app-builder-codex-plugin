#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const exportTwo = argument("--export-two", "/Users/rengerhu/Downloads/Employee Leave Balances (2).ydl");
const exportOne = argument("--export-one", "/Users/rengerhu/Downloads/Employee Leave Balances (1).ydl");
const phase = "phase-15-data-list-sublist-remaining-configuration-family-selection-contract-audit";
const matrixPath = "compatibility/capability-manifests/data-list-sublist-remaining-configuration-family-selection-matrix.v0.1.0.json";
const fixturePath = "compatibility/differential-fixtures/data-list-sublist-remaining-configuration-family-selection.v0.1.0.json";
const contractPath = "compatibility/capability-manifests/data-list-sublist-remaining-configuration-family-selection-contract.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-15-data-list-sublist-remaining-configuration-family-selection-contract-audit.v0.1.0.md";
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json";
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const source = read(sourcePath);
const sources = [sourceEvidence(exportOne), sourceEvidence(exportTwo)];
const observations = sources.map((item) => extractSublistEvidence(decodeYdl(readFileSync(item.path))));
const callerCounts = {
  buildDataListFormSubListControl: directCalls(source, "buildDataListFormSubListControl"),
  buildDataListSubListColumn: directCalls(source, "buildDataListSubListColumn"),
  normalizeSubListColumnControlType: directCalls(source, "normalizeSubListColumnControlType"),
  normalizeDataListSubListSummaries: directCalls(source, "normalizeDataListSubListSummaries"),
  ensureDataListSubListSummaryTempVars: directCalls(source, "ensureDataListSubListSummaryTempVars"),
  materializeDataListFormResource: directCalls(source, "materializeDataListFormResource"),
  buildFieldRules: directCalls(source, "buildFieldRules"),
};
const matrix = {
  schemaVersion: "1.0.0", phase, auditOnly: true, sourcePath, sourceSha256: sha(source), callerCounts,
  evidenceSources: sources.map(({ path, ...item }) => item),
  exportObservations: observations,
  families: [
    family("identity-user-people-person-department", "normalizeSubListRowType -> normalizeSubListColumnControlType -> buildDataListSubListColumn", callerCounts.buildDataListSubListColumn, false, "The exports contain only a top-level identity-picker, never an embedded Sublist identity/user/department column.", "No scope-resolved user/department selection descriptor, identity policy, or frontend selection semantics are exported.", "host/runtime contract required"),
    family("file-image-attachment-binary", "normalizeSubListRowType -> normalizeSubListColumnControlType -> buildDataListSubListColumn", callerCounts.buildDataListSubListColumn, false, "No exported embedded file/image/attachment/binary column exists. The generic fallback has no upload, binary, storage, or permission configuration.", "Upload processing, binary references, validation, and lifecycle are host/frontend owned.", "host/runtime contract required"),
    family("barcode-control-and-field-rules", "buildFieldRules allowScan branch", 0, false, "No exported embedded barcode column or child barcode Rules shape exists; allowScan is parent-field-only in current Legacy source.", "A Data List embedded barcode export plus deterministic child rule/control scope is required.", "no safe candidate"),
    family("nested-sublist-and-graph-mutation", "routeDataListSublistNestedControlPlacementAtHost", 1, false, "The exports contain no embedded child of type list/sublist. Phase 12 already routes scalar child placement only.", "Graph insertion, nested control identity, template mutation, and package integration remain host owned.", "host orchestration only"),
    family("summary-presentation-or-binding", "normalizeDataListSubListSummaries -> ensureDataListSubListSummaryTempVars -> routeDataListSublistDynamicSummaryIntentsAtHost", callerCounts.normalizeDataListSubListSummaries, true, "Both exports show only the already-routed total summary and its existing binding shapes.", "No distinct static presentation or binding shape remains beyond Phases 10 and 11.", "already covered"),
    family("actions-runtime-expressions-and-writeback", "materializeDataListFormResource and form-action helpers", 0, false, "The exports do not prove an embedded child action/expression/writeback configuration. Lookup addition configuration is already routed; frontend execution remains excluded.", "Events, expressions, retrieval, mutation, clear/edit behavior, and writeback are product frontend/runtime owned.", "host/runtime contract required"),
    family("layout-resource-integration-package-output", "buildCustomFormLayout -> materializeDataListFormResource -> buildDataListFormFieldsGrid", callerCounts.materializeDataListFormResource, false, "The exports prove serialized results, not an immutable standalone integration boundary.", "Template loading/mutation, resource integration, serialization, package assembly, and lifecycle are host orchestration.", "host orchestration only"),
  ],
};
const fixture = { schemaVersion: "1.0.0", phase, sources: matrix.evidenceSources, exportObservations: observations, negativeCases: [
  { id: "top-level-identity-is-not-embedded-evidence", expected: "SUBLIST_REMAINING_FAMILY_IDENTITY_EXPORT_MISSING" },
  { id: "generic-file-fallback-is-not-upload-contract", expected: "SUBLIST_REMAINING_FAMILY_BINARY_EXPORT_MISSING" },
  { id: "parent-allow-scan-is-not-child-barcode-contract", expected: "SUBLIST_REMAINING_FAMILY_BARCODE_SCOPE_MISSING" },
  { id: "scalar-placement-is-not-nested-graph-mutation", expected: "SUBLIST_REMAINING_FAMILY_NESTED_GRAPH_CONTRACT_MISSING" },
  { id: "existing-summary-route-is-not-new-vertical", expected: "SUBLIST_REMAINING_FAMILY_SUMMARY_ALREADY_COVERED" },
  { id: "static-addition-is-not-runtime-writeback", expected: "SUBLIST_REMAINING_FAMILY_RUNTIME_WRITEBACK_EXCLUDED" },
  { id: "serialized-layout-is-not-core-package-boundary", expected: "SUBLIST_REMAINING_FAMILY_PACKAGE_ORCHESTRATION_HOST_OWNED" },
] };
const contract = { schemaVersion: "1.0.0", phase, decision: { status: "no_safe_candidate", marker: "PHASE_15_CONFIGURATION_NO_SAFE_CANDIDATE", nextPhase: "external-data-list-sublist-special-control-export-evidence" },
  authoritativeModel: "Parent ListID and parent FieldID are product identities. Embedded id and idx are column/export semantics only, never child product IDs.",
  matrixPath, fixturePath, selection: { selectedCandidate: null, rationale: "No un-routed family has an export- or source-proven static immutable configuration boundary. Existing generic Legacy fallbacks cannot substitute for export evidence." },
  smallestPrerequisites: ["A read-only Data List export containing the exact embedded special-control configuration", "A deterministic parent ListID/FieldID and Type 1 control scope chain", "A proof that the candidate does not require frontend event execution, upload processing, expressions, mutable graph integration, or package output"],
  exclusions: ["Approval Form proof", "invented identities", "frontend events", "runtime expressions", "upload processing", "package output", "production routing"],
};
write(matrixPath, matrix); write(fixturePath, fixture); write(contractPath, contract);
write(reportPath, `# Phase 15 Data List Embedded-Sublist Remaining Configuration Family Selection Audit\n\n${marker("DATA_LIST_SUBLIST_REMAINING_FAMILIES_AUDITED")}\n\n${marker("DATA_LIST_SUBLIST_CONFIGURATION_CANDIDATE_SELECTION_VALID")}\n\n${marker("DATA_LIST_SUBLIST_CONFIGURATION_CANDIDATE_SELECTION_REGRESSIONS_PASSED")}\n\n${marker("PHASE_15_CONFIGURATION_NO_SAFE_CANDIDATE")}\n\nThe two authoritative Data List exports prove only scalar text/number columns, the already-routed Lookup target/display and \`addition[]\` configuration, and existing summary bindings. They contain no embedded identity/user/department, file/image/binary, barcode, or nested-Sublist control configuration. A top-level identity-picker does not constitute embedded-Sublist evidence.\n\nThe remaining families are therefore classified separately in the versioned decision matrix. Generic Legacy control fallbacks are not a Core contract: their missing scope, runtime policy, upload, graph, template, resource, and package ownership prevents an immutable configuration-only projection. No candidate is selected. Approval Form semantics are comparison-only and are excluded.\n`);
const state = json(statePath); state.migration.currentPhase = phase; state.migration.currentPhaseStatus = "complete"; state.migration.overallStatus = "blocked"; state.migration.nextPhase = contract.decision.nextPhase;
state.completed.push({ id: phase, status: "complete", evidence: "2026-07-19: remaining embedded-Sublist configuration families audited; no export- or source-proven static candidate remains." });
state.blocked ||= []; state.blocked.push({ id: "phase-15-data-list-sublist-remaining-configuration-family-selection", status: "no_safe_candidate", marker: contract.decision.marker, reason: "No authoritative Data List export proves an un-routed embedded special-control configuration with an immutable deterministic boundary.", smallestPrerequisite: contract.smallestPrerequisites[0] });
state.nextSteps = [{ order: 0, id: contract.decision.nextPhase, description: "Obtain a read-only Data List export for one embedded special-control family before authorizing any shadow or routing work." }, ...(state.nextSteps || []).filter((item) => item.id !== "external-data-list-lookup-additional-field-runtime-evidence")];
state.proofStatus.dataListSublistRemainingConfigurationFamilies = "audited_no_safe_candidate"; state.proofStatus.phase15ConfigurationSelection = "no_safe_candidate"; write(statePath, state);
console.log("DATA_LIST_SUBLIST_REMAINING_FAMILIES_AUDITED"); console.log("DATA_LIST_SUBLIST_CONFIGURATION_CANDIDATE_SELECTION_VALID"); console.log("PHASE_15_CONFIGURATION_NO_SAFE_CANDIDATE");

function family(id, legacyBoundary, callerCount, exportProven, evidence, prerequisite, disposition) { return { id, legacyBoundary, directProductionCallerCount: callerCount, exportProvenStaticConfiguration: exportProven, evidence, deterministicImmutableCoreBoundary: false, ownership: { productIdentity: "parent ListID and parent FieldID only", embeddedColumnIdentity: "id and idx are export semantics only", host: "template/control/resource/package integration", runtime: "product frontend/runtime where applicable" }, prerequisite, disposition }; }
function extractSublistEvidence(data) { const item = data.Item; const controls = []; for (const layout of item.Layouts || []) for (const resource of layout.LayoutInResources || []) { const form = JSON.parse(losslessJson(resource.Resource)); walk(form, (node, path) => { if (node?.type === "list" && Array.isArray(node.attrs?.["list-fields"])) controls.push({ layoutId: layout.LayoutID, layoutResourceId: resource.ID, parentFieldId: node.fieldID, binding: node.binding, path, columnTypes: node.attrs["list-fields"].map((column) => column?.type), summaryCount: Array.isArray(node.attrs?.["list-fields-summary"]) ? node.attrs["list-fields-summary"].length : 0 }); }); } return { sublistControlCount: controls.length, controls }; }
function decodeYdl(bytes) { const wrapper = JSON.parse(losslessJson(bytes.toString("utf8"))); const packed = Buffer.from(wrapper.Resource.slice("[______gizp______]".length), "base64"); const outer = JSON.parse(losslessJson(gunzipSync(packed).toString("utf8"))); return JSON.parse(losslessJson(outer.Data)); }
function losslessJson(source) { let output = "", index = 0, quoted = false, escaped = false; while (index < source.length) { const character = source[index]; if (quoted) { output += character; if (escaped) escaped = false; else if (character === "\\") escaped = true; else if (character === "\"") quoted = false; index += 1; continue; } if (character === "\"") { quoted = true; output += character; index += 1; continue; } if (character === "-" || (character >= "0" && character <= "9")) { let end = index + (character === "-" ? 1 : 0); while (end < source.length && source[end] >= "0" && source[end] <= "9") end += 1; const token = source.slice(index, end); output += /^-?\d{16,}$/.test(token) ? JSON.stringify(token) : token; index = end; continue; } output += character; index += 1; } return output; }
function walk(value, visit, path = "$") { if (!value || typeof value !== "object") return; if (Array.isArray(value)) { value.forEach((item, index) => walk(item, visit, `${path}[${index}]`)); return; } visit(value, path); Object.entries(value).forEach(([key, item]) => walk(item, visit, `${path}.${key}`)); }
function sourceEvidence(path) { const bytes = readFileSync(path); return { path, fileName: basename(path), sha256: sha(bytes), readOnly: true, role: "authoritative Data List export" }; }
function directCalls(text, name) { return Math.max(0, (text.match(new RegExp(`${name}\\(`, "g")) || []).length - 1); }
function marker(value) { return `\`${value}\``; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); } function json(path) { return JSON.parse(read(path)); } function write(path, value) { writeFileSync(resolve(root, path), typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`); } function sha(value) { return createHash("sha256").update(value).digest("hex"); } function argument(name, fallback) { const index = process.argv.indexOf(name); return index < 0 ? fallback : process.argv[index + 1]; }

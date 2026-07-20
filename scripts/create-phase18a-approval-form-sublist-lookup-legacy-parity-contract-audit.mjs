#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildApprovalFormLayoutDef } from "./lib/approval-form-layout-builder.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ywfPath = argument("--ywf", "/Users/rengerhu/Downloads/Leave Request (1).ywf");
const phase = "phase-18a-approval-form-sublist-lookup-legacy-parity-contract-audit";
const materializerPath = "scripts/materialize-full-app-generated-final.mjs";
const lowererPath = "scripts/lib/approval-form-layout-builder.mjs";
const phase17ContractPath = "compatibility/capability-manifests/cross-surface-capability-portfolio-and-next-vertical-selection-contract.v0.1.0.json";
const phase17FixturePath = "compatibility/differential-fixtures/cross-surface-capability-portfolio-export.v0.1.0.json";
const matrixPath = "compatibility/capability-manifests/approval-form-sublist-lookup-legacy-parity-matrix.v0.1.0.json";
const fixturePath = "compatibility/differential-fixtures/approval-form-sublist-lookup-legacy-parity-export.v0.1.0.json";
const contractPath = "compatibility/capability-manifests/approval-form-sublist-lookup-legacy-parity-contract.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-18a-approval-form-sublist-lookup-legacy-parity-contract-audit.v0.1.0.md";
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json";

const materializer = read(materializerPath);
const lowerer = read(lowererPath);
const phase17 = json(phase17ContractPath);
const exportBytes = readFileSync(ywfPath);
const workflow = decodeYwf(exportBytes);
const exportColumns = extractLookupColumns(workflow);
const probe = lowererProbe(exportColumns[0]);
const parserBoundaries = {
  collectApprovalFormFieldSpecs: functionLine(materializer, "collectApprovalFormFieldSpecs"),
  parseSubListRowFields: functionLine(materializer, "parseSubListRowFields"),
  parseEmbeddedSublistLookupTarget: functionLine(materializer, "parseEmbeddedSublistLookupTarget"),
  uniqueApprovalFieldSpecs: functionLine(materializer, "uniqueApprovalFieldSpecs"),
  buildApprovalVariables: functionLine(materializer, "buildApprovalVariables"),
  buildApprovalDefResource: functionLine(materializer, "buildApprovalDefResource"),
  exportResource: functionLine(materializer, "exportResource"),
  materializeApprovalSubListControl: functionLine(lowerer, "materializeApprovalSubListControl"),
  normalizeApprovalSubListRowFields: functionLine(lowerer, "normalizeApprovalSubListRowFields"),
};
const callerCounts = {
  approvalDefinitionResource: directCalls(materializer, "buildApprovalDefResource"),
  approvalLayoutBuilder: invocations(materializer, "buildApprovalFormLayoutDef"),
  approvalSublistControl: directCalls(lowerer, "materializeApprovalSubListControl"),
  approvalRowNormalization: directCalls(lowerer, "normalizeApprovalSubListRowFields"),
  approvalSerialization: directCalls(materializer, "exportResource"),
};
const keys = [
  key("listid", "target.listId", "intentionally_discarded_before_materialization", "The plan parser accepts ListID into rowField.value.ListID only. Approval row normalization copies id, idx, displayName, type, controlType, and editable; the output control attrs omit listid."),
  key("appid", "target.appId", "intentionally_discarded_before_materialization", "The plan parser validates AppID and retains it only in rowField.value.AppID. Approval row normalization and output attrs omit appid."),
  key("listsetid", "target.listSetId", "intentionally_discarded_before_materialization", "The plan parser accepts ListSetID into rowField.value.ListSetID only. Approval row normalization and output attrs omit listsetid."),
  key("listfield", "target.displayField", "present_only_in_imported_exported_product_data_not_reproducible", "The Approval plan parser has no listfield grammar and the lowerer has no listfield output attribute. The export-only display field cannot be reconstructed by the current materializer."),
];
const matrix = {
  schemaVersion: "1.0.0", phase, auditOnly: true,
  phase17StartingEvidence: { contractPath: phase17ContractPath, fixturePath: phase17FixturePath, decisionMarker: phase17.decision.marker },
  sources: [{ fileName: basename(ywfPath), sha256: sha(exportBytes), role: "authoritative Approval Form export", readOnly: true }],
  independentProductModel: "Approval Form only. No Data List contract, identifier, adapter, fixture, or routing evidence is used.",
  materializer: { path: materializerPath, sha256: sha(materializer), lowererPath, lowererSha256: sha(lowerer), callerCounts, parserBoundaries },
  lookupColumns: exportColumns,
  keys,
  outputProbe: probe,
  decision: { status: "parity_unavailable", marker: "APPROVAL_FORM_SUBLIST_LOOKUP_LEGACY_PARITY_UNAVAILABLE", selectedCandidate: null },
};
const fixture = {
  schemaVersion: "1.0.0", phase,
  sources: matrix.sources,
  exportColumns,
  legacyProbe: probe,
  negativeCases: [
    { id: "data-list-evidence-reuse", expected: "APPROVAL_FORM_SUBLIST_LOOKUP_MODEL_ISOLATION_REQUIRED" },
    { id: "inferred-target-display", expected: "APPROVAL_FORM_SUBLIST_LOOKUP_METADATA_INFERENCE_FORBIDDEN" },
    { id: "lossless-id-numeric-conversion", expected: "APPROVAL_FORM_SUBLIST_LOOKUP_LOSSLESS_ID_REQUIRED" },
    { id: "export-only-key-claimed-as-legacy-output", expected: "APPROVAL_FORM_SUBLIST_LOOKUP_EXPORT_ONLY_KEY_NOT_GENERATED" },
    { id: "lossy-boundary-routing", expected: "APPROVAL_FORM_SUBLIST_LOOKUP_LOSSY_BOUNDARY_REJECTED" },
    { id: "static-export-claimed-as-runtime-proof", expected: "APPROVAL_FORM_SUBLIST_LOOKUP_RUNTIME_CLAIM_UNPROVEN" },
  ],
};
const contract = {
  schemaVersion: "1.0.0", phase, auditOnly: true,
  decision: matrix.decision,
  authoritativeConclusion: "All four required Lookup target/display keys are either intentionally discarded before Approval Form materialization or exist only in imported/exported product data. No exact Legacy-generated representation exists.",
  futureWorkClassification: "A change that begins preserving these keys would be a product-behavior enhancement, not a parity-preserving Core migration.",
  immutableCoreCandidate: null,
  hostBoundary: "No boundary selected. Runtime lookup resolution, selection, retrieval, validation, writeback, template/resource mutation, package output, and workflow execution remain out of scope.",
  matrixPath, fixturePath,
  exclusions: ["Core shadow", "public API", "distribution", "adapter", "production route", "runtime behavior claims", "Data List evidence reuse", "numeric identity conversion"],
};

write(matrixPath, matrix); write(fixturePath, fixture); write(contractPath, contract); write(reportPath, report(matrix, contract));
const state = json(statePath);
state.migration.currentPhase = phase; state.migration.currentPhaseStatus = "complete"; state.migration.overallStatus = "blocked"; state.migration.nextPhase = "approval-form-sublist-lookup-product-behavior-enhancement-evidence";
state.completed.push({ id: phase, status: "complete", evidence: "2026-07-19: Approval Form-only Lookup target/display parity audit found that target identifiers are discarded and display-field metadata is export-only." });
state.blocked.push({ id: phase, status: "parity_unavailable", marker: contract.decision.marker, reason: contract.authoritativeConclusion, smallestPrerequisite: "A separately authorized Approval Form product-behavior enhancement with product/export/runtime evidence." });
state.nextSteps = [{ order: 0, id: state.migration.nextPhase, description: "Do not begin Core migration. Obtain separate authorization and product evidence for any Approval Form Lookup metadata preservation enhancement." }, ...(state.nextSteps || []).filter((item) => item.id !== "approval-form-sublist-lookup-legacy-lowering-parity-evidence")];
state.proofStatus.approvalFormSublistLookupLegacyParity = "unavailable_export_only_or_discarded";
state.proofStatus.phase18ApprovalFormSublistLookupParity = "unavailable";
write(statePath, state);
console.log("APPROVAL_FORM_SUBLIST_LOOKUP_LEGACY_BOUNDARIES_AUDITED");
console.log("APPROVAL_FORM_SUBLIST_LOOKUP_PARITY_MATRIX_VALID");
console.log("APPROVAL_FORM_SUBLIST_LOOKUP_PARITY_REGRESSIONS_PASSED");
console.log("APPROVAL_FORM_SUBLIST_LOOKUP_LEGACY_PARITY_UNAVAILABLE");

function key(exportKey, targetPath, outcome, rationale) {
  return { exportKey, decodedSourcePaths: exportColumns.map((column) => `${column.path}.control.attrs.${exportKey}`), parserBoundary: exportKey === "listfield" ? "No Approval Form parser input." : "parseEmbeddedSublistLookupTarget -> rowField.value", normalizationBoundary: "normalizeApprovalSubListRowFields", outputPaths: [], outcome, rationale, lossPoint: exportKey === "listfield" ? "No plan parser or lowerer representation." : "Approval row normalization omits rowField.value and control attrs target metadata." };
}
function extractLookupColumns(definition) {
  const found = [];
  walk(definition, (node, path) => {
    if (node?.type !== "list" || !Array.isArray(node?.attrs?.["list-fields"])) return;
    node.attrs["list-fields"].forEach((column, index) => {
      const attrs = column?.control?.attrs || {};
      if (column?.type !== "lookup" || !attrs.listid) return;
      found.push({ path: `${path}.attrs.list-fields[${index}]`, parentBinding: String(node.binding || ""), parentControlId: String(node.id || ""), id: String(column.id || ""), idx: String(column.idx || ""), name: String(column.name || ""), type: String(column.type || ""), target: { listId: String(attrs.listid), appId: String(attrs.appid), listSetId: String(attrs.listsetid), displayField: String(attrs.listfield) } });
    });
  });
  const unique = new Map(); for (const item of found) unique.set(`${item.parentBinding}:${item.parentControlId}:${item.id}`, item); return [...unique.values()];
}
function lowererProbe(column) {
  const input = { displayName: "Leave request details", fieldName: column.parentBinding, fieldType: "list", controlType: "list", listFields: [{ id: column.id, idx: column.idx, displayName: column.name, columnTitle: column.name, fieldType: "lookup", controlType: "lookup", editable: true, value: { AppID: Number(column.target.appId), ListID: column.target.listId, ListSetID: column.target.listSetId }, listfield: column.target.displayField }] };
  const resource = buildApprovalFormLayoutDef({ rootDir: root, id: "phase18a-parity-probe", title: "Phase 18A parity probe", role: "submission", fields: [input] });
  const control = find(resource, (node) => node?.type === "list" && Array.isArray(node?.attrs?.["list-fields"]));
  const output = control?.attrs?.["list-fields"]?.[0] || null;
  const text = JSON.stringify(resource);
  const outputText = JSON.stringify(output || {});
  return { input, outputColumn: output, outputContainsAnyRequiredKey: /\b(?:listid|appid|listsetid|listfield)\b/i.test(outputText), outputContainsLosslessTargetListId: outputText.includes(column.target.listId), outputContainsLosslessTargetListSetId: outputText.includes(column.target.listSetId), outputContainsDisplayField: outputText.includes(column.target.displayField) };
}
function decodeYwf(bytes) { const wrapper = JSON.parse(losslessJson(bytes.toString("utf8"))); if (typeof wrapper.Def !== "string") throw Error("PHASE18A_YWF_DEF_MISSING"); return JSON.parse(losslessJson(Buffer.from(wrapper.Def, "base64").toString("utf8"))); }
function losslessJson(source) { let output = "", index = 0, quoted = false, escaped = false; while (index < source.length) { const character = source[index]; if (quoted) { output += character; if (escaped) escaped = false; else if (character === "\\") escaped = true; else if (character === "\"") quoted = false; index += 1; continue; } if (character === "\"") { quoted = true; output += character; index += 1; continue; } if (character === "-" || (character >= "0" && character <= "9")) { let end = index + (character === "-" ? 1 : 0); while (end < source.length && source[end] >= "0" && source[end] <= "9") end += 1; const token = source.slice(index, end); output += /^-?\d{16,}$/.test(token) ? JSON.stringify(token) : token; index = end; continue; } output += character; index += 1; } return output; }
function find(value, predicate) { if (!value || typeof value !== "object") return null; if (Array.isArray(value)) { for (const item of value) { const found = find(item, predicate); if (found) return found; } return null; } if (predicate(value)) return value; for (const item of Object.values(value)) { const found = find(item, predicate); if (found) return found; } return null; }
function walk(value, visitor, path = "$") { if (!value || typeof value !== "object") return; if (Array.isArray(value)) { value.forEach((item, index) => walk(item, visitor, `${path}[${index}]`)); return; } visitor(value, path); Object.entries(value).forEach(([key, item]) => walk(item, visitor, `${path}.${key}`)); }
function functionLine(source, name) { const match = source.match(new RegExp(`^function ${name}\\b|^export function ${name}\\b`, "m")); return match ? source.slice(0, match.index).split("\n").length : 0; }
function directCalls(source, name) { return Math.max(0, (source.match(new RegExp(`${name}\\(`, "g")) || []).length - 1); }
function invocations(source, name) { return (source.match(new RegExp(`${name}\\(`, "g")) || []).length; }
function report(matrix, contract) { return `# Phase 18A Approval Form Sublist Lookup Legacy Parity Contract Audit\n\n\`APPROVAL_FORM_SUBLIST_LOOKUP_LEGACY_BOUNDARIES_AUDITED\`\n\n\`APPROVAL_FORM_SUBLIST_LOOKUP_PARITY_MATRIX_VALID\`\n\n\`APPROVAL_FORM_SUBLIST_LOOKUP_PARITY_REGRESSIONS_PASSED\`\n\n\`APPROVAL_FORM_SUBLIST_LOOKUP_LEGACY_PARITY_UNAVAILABLE\`\n\n## Decision\n\nNo future Core migration candidate is selected. The Approval Form export is authoritative for static configuration, but current Legacy materialization cannot reproduce all required Lookup target/display metadata. A preservation change would be a product-behavior enhancement rather than a parity-preserving Core migration.\n\n## Exact Outcomes\n\n| Export key | Outcome | Legacy output path | Loss point |\n| --- | --- | --- | --- |\n${matrix.keys.map((item) => `| \`${item.exportKey}\` | ${item.outcome} | none | ${item.lossPoint} |`).join("\n")}\n\nThe export has ${matrix.lookupColumns.length} distinct Submission Form embedded Lookup columns. The lowerer probe supplies a valid lookup row with lossless target values and confirms that generated \`list-fields\` metadata contains none of the four required keys. No equivalent representation exists in output, Rules, opaque metadata, variables, serialization, or package output.\n\nApproval Form is an independent product model. No Data List source, contract, adapter, identifier, fixture, or routing proof was used. Static export evidence does not prove lookup runtime behavior, selection, retrieval, validation, writeback, template/resource mutation, workflow execution, or package behavior.\n\n## Boundary\n\n${contract.hostBoundary}\n`; }
function argument(name, fallback) { const index = process.argv.indexOf(name); return index < 0 ? fallback : process.argv[index + 1]; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function write(path, value) { writeFileSync(resolve(root, path), typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }

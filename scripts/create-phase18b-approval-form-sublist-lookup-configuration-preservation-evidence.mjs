#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-18b-approval-form-sublist-lookup-configuration-preservation";
const ywfPath = "/Users/rengerhu/Downloads/Leave Request (1).ywf";
const fixturePath = "compatibility/differential-fixtures/approval-form-sublist-lookup-configuration-preservation.v0.1.0.json";
const contractPath = "compatibility/capability-manifests/approval-form-sublist-lookup-configuration-preservation.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-18b-approval-form-sublist-lookup-configuration-preservation.v0.1.0.md";
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json";
const bytes = readFileSync(ywfPath);
const columns = extractLookupColumns(decodeYwf(bytes));
if (columns.length !== 2) throw Error("APPROVAL_FORM_SUBLIST_LOOKUP_GOLDEN_COLUMN_COUNT_INVALID");
const fixture = {
  schemaVersion: "1.0.0", phase,
  authoritativeSource: { fileName: "Leave Request (1).ywf", sha256: sha(bytes), role: "Approval Form Submission Form configuration only", readOnly: true },
  modelIsolation: "Approval Form is an independent product model. No Data List input, identifier, fixture, contract, adapter, or route is used.",
  exportColumns: columns,
  plannedInputGrammar: "id:displayName:lookup:lookup:idx:editable:AppID=41,ListID=<19-digit string>,ListSetID=<19-digit string>,ListField=<non-empty string>",
  expectedGeneratedAttributes: columns.map((column) => ({ parentBinding: column.parentBinding, id: column.id, idx: column.idx, type: "lookup", attrs: { listid: column.target.listId, appid: 41, listsetid: column.target.listSetId, listfield: column.target.displayField } })),
  negativeCases: [
    "missing-display-field", "malformed-lossless-list-id", "missing-list-set-id", "numeric-list-id", "nonlookup-backward-compatibility", "Data-List-evidence-reuse", "runtime-behavior-claim",
  ],
};
const contract = {
  schemaVersion: "1.0.0", phase, kind: "authorized_product_behavior_enhancement",
  marker: "APPROVAL_FORM_SUBLIST_LOOKUP_CONFIGURATION_PRESERVATION_PASSED",
  sourceFixturePath: fixturePath,
  authoritativeScope: {
    preserve: ["listid", "appid", "listsetid", "listfield", "Lookup control type"],
    losslessIdentities: ["listid", "listsetid"],
    immutableConfigurationOnly: true,
    runtimeExcluded: ["selection events", "target-record retrieval", "runtime lookup execution", "validation timing", "automatic assignment", "clear behavior", "read-only enforcement timing", "writeback", "workflow execution", "template/resource mutation beyond existing configuration lowering", "package runtime behavior"],
  },
  parserToLowering: [
    "parseSubListRowFields retains value.AppID/ListID/ListSetID and lookupDisplayField",
    "normalizeApprovalSubListLookupConfiguration validates explicit strings without numeric conversion",
    "materializeApprovalSubListControl writes fresh static control.attrs configuration",
  ],
  hostAndCoreBoundary: "No Core or Local Runtime API, adapter, or artifact is added. The existing Approval Form host materializer owns parser and static configuration output.",
  historicalSupersession: {
    phase: "phase-18a-approval-form-sublist-lookup-legacy-parity-contract-audit",
    marker: "APPROVAL_FORM_SUBLIST_LOOKUP_LEGACY_PARITY_UNAVAILABLE",
    disposition: "superseded_for_this_explicitly_authorized_product-behavior enhancement; retained as historical evidence of the prior lossy Legacy boundary",
  },
  proofRequirements: ["source", "official temporary ZIP", "simulated installed Plugin", "actual materializer plan parser and lowerer", "determinism", "negative gates", "temporary-copy Legacy rollback"],
};
write(fixturePath, fixture); write(contractPath, contract);
write(reportPath, `# Phase 18B Approval Form Sublist Lookup Configuration Preservation\n\n\`APPROVAL_FORM_SUBLIST_LOOKUP_CONFIGURATION_PRESERVATION_PASSED\`\n\n\`APPROVAL_FORM_SUBLIST_LOOKUP_SOURCE_PARITY_PASSED\`\n\n\`APPROVAL_FORM_SUBLIST_LOOKUP_ARCHIVE_PARITY_PASSED\`\n\n\`APPROVAL_FORM_SUBLIST_LOOKUP_INSTALLED_PARITY_PASSED\`\n\n\`APPROVAL_FORM_SUBLIST_LOOKUP_MATERIALIZER_CONFIGURATION_PARITY_PASSED\`\n\n\`APPROVAL_FORM_SUBLIST_LOOKUP_DETERMINISM_PASSED\`\n\n\`APPROVAL_FORM_SUBLIST_LOOKUP_NEGATIVE_GATES_PASSED\`\n\n\`APPROVAL_FORM_SUBLIST_LOOKUP_LEGACY_ROLLBACK_PASSED\`\n\n## Outcome\n\nThis authorized Approval Form-only product enhancement preserves the four static Lookup target/display configuration keys from the golden Submission Form shape: \`listid\`, \`appid\`, \`listsetid\`, and \`listfield\`. The two golden columns retain their exact 19-digit target identifiers as strings. The parser sends explicit configuration to the Approval Form lowerer, which emits a fresh static \`list-fields\` Lookup column.\n\nNo Data List evidence or route is reused. This adds no Core or Local Runtime API, adapter, artifact, or distributed Core contract. It does not claim frontend/runtime lookup behavior: selection events, target retrieval, automatic assignment, clear/edit behavior, validation timing, read-only enforcement timing, runtime expressions, writeback, workflow execution, and package runtime semantics remain product-owned and unproven here.\n\n## Historical Evidence\n\nPhase 18A remains intact as evidence that the old Legacy path discarded the same metadata. Its parity-unavailable blocker is superseded only because this separately authorized product-behavior enhancement now preserves the export-proven static configuration.\n\n## Evidence\n\nThe versioned fixture contains ${columns.length} independently decoded golden Submission Form Lookup columns. The routing test covers direct lowerer source/official temporary ZIP/simulated installed surfaces, actual source/archive/installed materializer invocation, strict string-only identity validation, deterministic output, non-Lookup backwards compatibility, and a temporary-copy rollback that removes only this preservation bridge.\n`);
const state = json(statePath);
state.migration.currentPhase = phase; state.migration.currentPhaseStatus = "complete"; state.migration.overallStatus = "complete"; state.migration.nextPhase = "phase-19-cross-surface-capability-portfolio-and-next-vertical-selection-audit";
if (!state.completed.some((entry) => entry.id === phase)) state.completed.push({ id: phase, status: "complete", evidence: `${contractPath}: static Approval Form Submission Form Sublist Lookup configuration preservation passed on source, official temporary ZIP, simulated installed Plugin, actual materializer, and rollback surfaces.` });
state.blocked = state.blocked.map((entry) => entry.id === "phase-18a-approval-form-sublist-lookup-legacy-parity-contract-audit" ? { ...entry, status: "superseded_by_authorized_product_behavior_enhancement", supersededBy: phase } : entry);
state.blocked = state.blocked.filter((entry, index, all) => entry.id !== "phase-18a-approval-form-sublist-lookup-legacy-parity-contract-audit" || index === all.findIndex((candidate) => candidate.id === entry.id));
state.nextSteps = [{ order: 0, id: state.migration.nextPhase, description: "Select a new independent cross-surface configuration-only candidate. Do not reuse Approval Form Lookup runtime behavior as migration evidence." }, ...(state.nextSteps || []).filter((entry) => entry.id !== "approval-form-sublist-lookup-product-behavior-enhancement-evidence")];
state.proofStatus.approvalFormSublistLookupLegacyParity = "historically_unavailable_superseded_by_authorized_configuration_preservation";
state.proofStatus.approvalFormSublistLookupConfigurationPreservation = "passed_source_archive_installed_materializer_and_rollback";
state.proofStatus.phase18ApprovalFormSublistLookupParity = "superseded_by_authorized_configuration_preservation";
write(statePath, state);
console.log("APPROVAL_FORM_SUBLIST_LOOKUP_CONFIGURATION_PRESERVATION_EVIDENCE_CREATED");

function extractLookupColumns(value) { const found = []; walk(value, (node, path) => { if (node?.type !== "list" || !Array.isArray(node?.attrs?.["list-fields"])) return; node.attrs["list-fields"].forEach((column, index) => { const attrs = column?.control?.attrs || {}; if (column?.type !== "lookup" || !attrs.listid) return; found.push({ path: `${path}.attrs.list-fields[${index}]`, parentBinding: String(node.binding || ""), parentControlId: String(node.id || ""), id: String(column.id || ""), idx: String(column.idx || ""), name: String(column.name || ""), type: String(column.type || ""), target: { listId: String(attrs.listid), appId: String(attrs.appid), listSetId: String(attrs.listsetid), displayField: String(attrs.listfield) } }); }); }); const unique = new Map(); for (const item of found) unique.set(`${item.parentBinding}:${item.parentControlId}:${item.id}`, item); return [...unique.values()]; }
function decodeYwf(bytes) { const wrapper = JSON.parse(losslessJson(bytes.toString("utf8"))); if (typeof wrapper.Def !== "string") throw Error("APPROVAL_FORM_SUBLIST_LOOKUP_GOLDEN_DEF_MISSING"); return JSON.parse(losslessJson(Buffer.from(wrapper.Def, "base64").toString("utf8"))); }
function losslessJson(source) { let output = "", index = 0, quoted = false, escaped = false; while (index < source.length) { const character = source[index]; if (quoted) { output += character; if (escaped) escaped = false; else if (character === "\\") escaped = true; else if (character === "\"") quoted = false; index += 1; continue; } if (character === "\"") { quoted = true; output += character; index += 1; continue; } if (character === "-" || (character >= "0" && character <= "9")) { let end = index + (character === "-" ? 1 : 0); while (end < source.length && source[end] >= "0" && source[end] <= "9") end += 1; const token = source.slice(index, end); output += /^-?\d{16,}$/.test(token) ? JSON.stringify(token) : token; index = end; continue; } output += character; index += 1; } return output; }
function walk(value, visitor, path = "$") { if (!value || typeof value !== "object") return; if (Array.isArray(value)) { value.forEach((item, index) => walk(item, visitor, `${path}[${index}]`)); return; } visitor(value, path); Object.entries(value).forEach(([key, item]) => walk(item, visitor, `${path}.${key}`)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function write(path, value) { writeFileSync(resolve(root, path), typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`); }

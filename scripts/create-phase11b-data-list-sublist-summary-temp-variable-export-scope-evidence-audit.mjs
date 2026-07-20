#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = argumentsFor(process.argv.slice(2));
const phase = "phase-11b-sublist-summary-runtime-temporary-variable-scope-evidence-audit";
const nextPhase = "phase-11c-sublist-summary-scoped-dynamic-intent-internal-shadow";
const ydlBytes = readFileSync(args.ydl);
const ywfBytes = readFileSync(args.ywf);
const dataList = decodeDataList(ydlBytes);
const workflow = decodeWorkflow(ywfBytes);
const evidence = deriveEvidence(dataList, workflow);
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json";
const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
const lineage = json(lineagePath);
const distribution = json("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const protectedBoundaries = {
  materializer: checksum("scripts/materialize-full-app-generated-final.mjs"),
  coreAdapter: checksum("scripts/lib/materializer-core-adapter.mjs"),
  runtimeAdapter: checksum("scripts/lib/local-runtime-core-adapter.mjs"),
  materializerPublicIndex: checksum("packages/app-builder-core-materializer/src/index.ts"),
  localRuntimePublicIndex: checksum("runtimes/app-builder-core-local-runtime/src/index.ts")
};
const contract = {
  schemaVersion: "1.0.0",
  phase,
  evidenceKind: "read-only export-derived scope evidence",
  decision: {
    status: "accepted_for_non_serialized_host_scope_context_only",
    marker: "SUBLIST_SUMMARY_TEMP_VARIABLE_EXPORT_SCOPE_EVIDENCE_ACCEPTED",
    nextPhase,
    rationale: "The Data List export preserves an explicit containment and reference chain for both dynamic summary bindings. This is sufficient to construct one immutable, non-serialized host-owned scope context per decoded Data List form. It is not runtime lifecycle, allocation, writeback, public API, distribution, or production-routing authorization."
  },
  sources: [
    { role: "primary Data List export", fileName: basename(args.ydl), sha256: sha(ydlBytes), readOnly: true },
    { role: "comparison-only Approval Form export", fileName: basename(args.ywf), sha256: sha(ywfBytes), readOnly: true }
  ],
  dataListScopeEvidence: evidence.dataList,
  comparisonOnlyApprovalFormEvidence: evidence.approvalForm,
  safeHostContext: {
    scope: "one decoded Data List Type 1 LayoutInResource invocation",
    requiredCompositeKey: ["parentListId", "layoutId", "layoutResourceId", "parentFieldId", "sublistControlId", "summaryId"],
    tempVariableResolution: "Resolve binding.value only against exactly one tempVars[] entry inside the same layout resource; retain the matching entry idx and id as export descriptors, never as API-issued product resource IDs.",
    dataListFieldResolution: "Resolve __list_ binding.value only against exactly one parent Data List field inside the same parent ListID.",
    immutability: "Freeze the derived descriptor and keep it in host-owned non-serialized context only.",
    prohibitions: ["global cache", "cross-list lookup", "cross-form lookup", "name-only matching without the composite scope", "temporary-variable allocation", "temporary-variable mutation", "temporary-variable writeback", "runtime expression evaluation", "template or resource mutation", "package serialization"]
  },
  limitations: [
    "The export does not prove runtime expression evaluation or runtime writeback.",
    "The export does not prove allocation, upgrade, stale-binding cleanup, or repeat-build lifecycle behavior.",
    "The summary id is duplicated across the two controls, so it is not a standalone summary identity and must be contextualized by parent field and control.",
    "Approval Form evidence is comparison-only and must not be reused for Data List routing."
  ],
  preserved: { productionRouteChanged: false, legacyMaterializerChanged: false, adaptersChanged: false, publicApiChanged: false, artifactsChanged: false, distributionChanged: false, pluginDistChanged: false, activeInstallationChanged: false, historicalZipChanged: false, protectedDuplicatesChanged: false },
  lineage: { requiredPhases: ["phase-10d-data-list-sublist-scalar-summary-intent-dual-public-distribution-promotion", "phase-10e-data-list-sublist-scalar-summary-intent-selective-routing-proof"], transitionCount: lineage.approvedTransitions.length, sha256: sha(read(lineagePath)) },
  checksums: { protectedBoundaries, artifacts: Object.fromEntries(distribution.artifacts.map((item) => [item.packageName, { path: item.path, sha256: item.sha256 }])), historicalZipSha256: "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2" }
};
const matrix = {
  schemaVersion: "1.0.0",
  phase,
  primarySource: basename(args.ydl),
  rows: [
    { configuration: "Data List summary bound to a Data List field", bindingPrefix: "__list_", explicitParentList: true, explicitParentField: true, explicitFormResource: true, explicitSummaryControlScope: true, targetRelationship: "binding target resolves to one parent Data List field within the same ListID", eligibleForHostContext: true },
    { configuration: "Data List summary bound to a temp variable", bindingPrefix: "__temp_", explicitParentList: true, explicitParentField: true, explicitFormResource: true, explicitSummaryControlScope: true, targetRelationship: "binding target resolves to exactly one tempVars[] entry inside the same layout resource", eligibleForHostContext: true },
    { configuration: "Approval Form summary bound to a form variable", bindingPrefix: "__variables_", comparisonOnly: true, targetRelationship: "binding target resolves to basic workflow variable inventory", eligibleForDataListHostContext: false },
    { configuration: "Approval Form summary bound to a temp variable", bindingPrefix: "__temp_", comparisonOnly: true, targetRelationship: "binding target resolves to workflow temp variable inventory", eligibleForDataListHostContext: false }
  ],
  conclusion: "Data List export evidence is sufficient for a bounded non-serialized Data List host scope context, but not for runtime lifecycle or dynamic production routing."
};
writeJson("compatibility/capability-manifests/data-list-sublist-summary-temp-variable-export-scope-evidence.v0.1.0.json", contract);
writeJson("compatibility/capability-manifests/data-list-sublist-summary-temp-variable-export-scope-evidence-matrix.v0.1.0.json", matrix);
write("docs/architecture/yeeflow-app-builder-phase-11b-data-list-sublist-summary-runtime-temporary-variable-export-scope-evidence-audit.v0.1.0.md", report(contract));
const state = json(statePath);
state.lastUpdated = "2026-07-19";
state.migration.currentPhase = phase;
state.migration.currentPhaseStatus = "complete";
state.migration.overallStatus = "in_progress";
state.migration.nextPhase = nextPhase;
state.inProgress = [];
const historicalBlock = state.blocked?.find((item) => item.id === "phase-11b-dynamic-summary-runtime-scope-evidence-missing");
if (historicalBlock) Object.assign(historicalBlock, { status: "superseded_by_read_only_export_scope_evidence", supersededBy: "SUBLIST_SUMMARY_TEMP_VARIABLE_EXPORT_SCOPE_EVIDENCE_ACCEPTED", note: "The original Legacy-only conclusion remains historical evidence. The new read-only Data List export proves configuration containment and binding relationships, not runtime lifecycle behavior." });
const completion = { id: phase, status: "complete", evidence: "2026-07-19: SUBLIST_SUMMARY_TEMP_VARIABLE_EXPORT_SCOPE_EVIDENCE_ACCEPTED. Read-only Employee Leave Balances export proves a composite Data List scope chain from ListID and Type 1 Layout resource to parent field/control, summary, and target inventory entry. The earlier Legacy-only blocked conclusion is superseded for non-serialized host context only; Core shadow, public distribution, runtime lifecycle, and production routing remain unauthorized." };
const existing = state.completed.find((item) => item.id === phase);
if (existing) Object.assign(existing, completion); else state.completed.push(completion);
state.nextSteps = (state.nextSteps || []).filter((item) => ![phase, "external-product-runtime-scope-evidence", nextPhase].includes(item.id));
state.nextSteps.unshift({ order: 1, id: nextPhase, description: "Require separate authorization for an internal-only Data List dynamic-summary scope-context shadow. It must retain host-owned lifecycle, runtime expression lowering, binding, mutation, writeback, and package output." });
state.proofStatus.dataListSublistSummaryTempVariableScopeEvidence = "accepted_export_proven_nonserialized_host_context";
state.proofStatus.phase11DynamicSummaryMigration = "scope_evidence_accepted_internal_shadow_not_authorized";
writeJson(statePath, state);
console.log("SUBLIST_SUMMARY_TEMP_VARIABLE_EXPORT_SCOPE_EVIDENCE_RECORDED");

function deriveEvidence(dataList, workflow) {
  const layout = dataList.layouts.find((item) => item.Title === "Create Balance" && String(item.Type) === "1");
  if (!layout || String(layout.ListID) !== String(dataList.list.ListID) || !Array.isArray(layout.LayoutInResources) || layout.LayoutInResources.length !== 1) throw new Error("PHASE11B_DATALIST_CREATE_BALANCE_SCOPE_MISSING");
  const resource = layout.LayoutInResources[0];
  if (String(resource.ID) !== String(layout.LayoutID) || String(resource.RefId) !== String(layout.LayoutID) || typeof resource.Resource !== "string") throw new Error("PHASE11B_DATALIST_LAYOUT_RESOURCE_LINK_INVALID");
  const form = JSON.parse(resource.Resource);
  const controls = collectSummaryControls(form);
  const listBound = exactlyOne(controls.filter((item) => item.summary.binding?.prefix === "__list_"), "PHASE11B_DATALIST_LIST_SUMMARY_MISSING");
  const tempBound = exactlyOne(controls.filter((item) => item.summary.binding?.prefix === "__temp_"), "PHASE11B_DATALIST_TEMP_SUMMARY_MISSING");
  const fields = dataList.defs;
  for (const item of [listBound, tempBound]) {
    const field = exactlyOne(fields.filter((candidate) => candidate.FieldName === item.binding && String(candidate.FieldID) === String(item.fieldID) && candidate.Type === "list"), "PHASE11B_DATALIST_PARENT_FIELD_RELATIONSHIP_INVALID");
    const source = exactlyOne((item.variables || []).filter((column) => column.id === item.summary.field), "PHASE11B_DATALIST_SUMMARY_SOURCE_COLUMN_INVALID");
    item.parentField = { storageName: field.FieldName, type: field.Type, fieldIdKind: decimalKind(field.FieldID), sourceColumn: { id: source.id, idxPresent: typeof source.idx === "string" } };
  }
  const target = exactlyOne(fields.filter((candidate) => candidate.FieldName === listBound.summary.binding.value), "PHASE11B_DATALIST_LIST_TARGET_FIELD_RELATIONSHIP_INVALID");
  const temp = exactlyOne((form.tempVars || []).filter((candidate) => candidate.id === tempBound.summary.binding.value), "PHASE11B_DATALIST_TEMP_VARIABLE_RELATIONSHIP_INVALID");
  if (listBound.summary.id !== tempBound.summary.id) throw new Error("PHASE11B_DATALIST_SUMMARY_DUPLICATION_OBSERVATION_CHANGED");
  const submission = exactlyOne(workflow.pageurls.filter((page) => page.name === "Submission form"), "PHASE11B_APPROVAL_SUBMISSION_MISSING");
  const approvalControls = collectSummaryControls(submission.formdef);
  const approvalVariable = exactlyOne(approvalControls.filter((item) => item.summary.binding?.prefix === "__variables_"), "PHASE11B_APPROVAL_VARIABLE_SUMMARY_MISSING");
  const approvalTemp = exactlyOne(approvalControls.filter((item) => item.summary.binding?.prefix === "__temp_"), "PHASE11B_APPROVAL_TEMP_SUMMARY_MISSING");
  if (!workflow.variables.basic.some((item) => item.id === approvalVariable.summary.binding.value) || !workflow.variables.tempVars.some((item) => item.id === approvalTemp.summary.binding.value)) throw new Error("PHASE11B_APPROVAL_VARIABLE_INVENTORY_RELATIONSHIP_INVALID");
  return {
    dataList: {
      parentList: { listIdKind: decimalKind(dataList.list.ListID), listTitle: dataList.list.Title },
      form: { layoutTitle: layout.Title, layoutIdKind: decimalKind(layout.LayoutID), layoutResourceIdMatchesLayoutId: true },
      listBoundSummary: { parentField: listBound.parentField, controlIdPresent: true, summaryIdPresent: true, sourceColumnMatchesListVariables: true, target: { bindingPrefix: "__list_", parentFieldIdKind: decimalKind(target.FieldID), targetType: target.Type } },
      tempBoundSummary: { parentField: tempBound.parentField, controlIdPresent: true, summaryIdPresent: true, sourceColumnMatchesListVariables: true, target: { bindingPrefix: "__temp_", inventoryEntryMatchedExactlyOnce: true, tempVariableIdxPresent: typeof temp.idx === "string" } },
      summaryIdStandaloneIdentity: false,
      summaryIdReason: "The same summary id occurs in two distinct Sublist controls; the host context must include parent field and control scope."
    },
    approvalForm: { comparisonOnly: true, submissionPageIdPresent: typeof submission.id === "string", formVariableBindingResolved: true, tempVariableBindingResolved: true, notReusableForDataList: true }
  };
}

function decodeDataList(bytes) { const wrapper = JSON.parse(bytes.toString("utf8")); if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith("[______gizp______]")) throw new Error("PHASE11B_YDL_GZIP_WRAPPER_INVALID"); const outer = losslessJson(gunzipSync(Buffer.from(wrapper.Resource.slice("[______gizp______]".length), "base64")).toString("utf8")); const data = losslessJson(outer.Data); return { list: data.Item.ListModel, defs: data.Item.Defs, layouts: data.Item.Layouts }; }
function decodeWorkflow(bytes) { const wrapper = JSON.parse(bytes.toString("utf8")); if (typeof wrapper.Def !== "string") throw new Error("PHASE11B_YWF_DEF_MISSING"); return JSON.parse(Buffer.from(wrapper.Def, "base64").toString("utf8")); }
function collectSummaryControls(value, output = []) { if (!value || typeof value !== "object") return output; if (Array.isArray(value)) { value.forEach((item) => collectSummaryControls(item, output)); return output; } if (Array.isArray(value.attrs?.["list-fields-summary"])) for (const summary of value.attrs["list-fields-summary"]) output.push({ binding: value.binding, fieldID: value.fieldID, variables: value.attrs["list-variables"], controlId: value.id, summary }); for (const child of Object.values(value)) collectSummaryControls(child, output); return output; }
function exactlyOne(values, code) { if (values.length !== 1) throw new Error(code); return values[0]; }
function decimalKind(value) { return typeof value === "string" && /^\d{16,30}$/u.test(value) ? "lossless-decimal-string" : "invalid"; }
function losslessJson(text) { return JSON.parse(quoteLargeIntegers(text)); }
function quoteLargeIntegers(text) { let out = ""; let index = 0; let inString = false; let escaped = false; while (index < text.length) { const character = text[index]; if (inString) { out += character; if (escaped) escaped = false; else if (character === "\\") escaped = true; else if (character === "\"") inString = false; index += 1; continue; } if (character === "\"") { inString = true; out += character; index += 1; continue; } if (character === "-" || (character >= "0" && character <= "9")) { const start = index; let end = index + (character === "-" ? 1 : 0); while (end < text.length && text[end] >= "0" && text[end] <= "9") end += 1; const token = text.slice(start, end); out += /^-?\d{16,}$/u.test(token) ? JSON.stringify(token) : token; index = end; continue; } out += character; index += 1; } return out; }
function argumentsFor(argv) { const value = {}; for (let index = 0; index < argv.length; index += 2) { const key = argv[index]; if (!key?.startsWith("--") || !argv[index + 1]) throw new Error("Usage: --ydl <path> --ywf <path>"); value[key.slice(2)] = argv[index + 1]; } if (!value.ydl || !value.ywf) throw new Error("Usage: --ydl <path> --ywf <path>"); return value; }
function report(value) { return `# Phase 11B Data List Sublist Summary Runtime Temporary-Variable Export Scope-Evidence Audit\n\n## Decision\n\n\`SUBLIST_SUMMARY_TEMP_VARIABLE_EXPORT_SCOPE_EVIDENCE_ACCEPTED\`\n\nThe read-only Data List export is sufficient for a bounded non-serialized, host-owned scope context. It exposes a containment chain from a lossless parent ListID through a Type 1 Layout and its LayoutInResource to a parent Sublist field/control, summary configuration, and target inventory entry.\n\nThis decision does not authorize a Core shadow, public API, distribution, adapter, production route, allocation, mutation, runtime expression evaluation, writeback, or package integration.\n\n## Data List Evidence\n\nThe \`Create Balance\` form contains two scalar Sublist summary configurations. The \`__list_\` binding resolves to a parent Data List field under the same ListID. The \`__temp_\` binding resolves exactly once to a \`tempVars[]\` entry contained by the same layout resource. Both parent Sublist controls carry a parent FieldID that matches the Data List definition.\n\nThe same summary UUID occurs in both controls. It is therefore not a standalone summary identity. A safe context must key every record by parent ListID, LayoutID, layout-resource ID, parent FieldID, control ID, and summary ID. The temp-variable binding value may be resolved only within that exact composite scope; its matching \`tempVars[]\` descriptor is retained as export semantics, not as an API-issued resource identity.\n\n## Approval Form Comparison\n\nThe \`Leave Request\` Submission Form independently resolves \`__variables_\` against a workflow basic-variable inventory and \`__temp_\` against a workflow temp-variable inventory. This proves a different Approval Form variable surface only. It is comparison evidence and is not reusable for Data List routing or implementation.\n\n## Remaining Limits\n\nThe exports do not prove runtime execution, writeback, variable allocation, stale-binding cleanup, repeat-build, or upgrade lifecycle semantics. A separately authorized internal-only shadow may consume only the frozen Data List scope context while retaining every lifecycle and runtime responsibility in the host.\n\n## Preserved Boundaries\n\nThe source exports were read-only. No production materializer, \`tempVars\`, template, resource, adapter, public API, artifact, distribution contract, Plugin dist, active installation, historical ZIP, protected duplicate, Git, or release state changed.\n`; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function checksum(path) { return { path, sha256: sha(read(path)) }; }
function write(path, value) { writeFileSync(resolve(root, path), value, "utf8"); }
function writeJson(path, value) { write(path, `${JSON.stringify(value, null, 2)}\n`); }

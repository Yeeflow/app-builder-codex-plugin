#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ydl = argument("--ydl", "/Users/rengerhu/Downloads/Employee Leave Balances (2).ydl");
const ywf = argument("--ywf", "/Users/rengerhu/Downloads/Leave Request (1).ywf");
const phase = "phase-14a-data-list-sublist-lookup-additional-field-writeback-contract-audit";
const fixturePath = "compatibility/differential-fixtures/data-list-sublist-lookup-additional-field-writeback-export.v0.1.0.json";
const contractPath = "compatibility/capability-manifests/data-list-sublist-lookup-additional-field-writeback-contract.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-14a-data-list-sublist-lookup-additional-field-writeback-contract-audit.v0.1.0.md";
const statePath = "docs/architecture/yeeflow-app-builder-core-migration-state.json";

const ydlBytes = readFileSync(ydl);
const ywfBytes = readFileSync(ywf);
const mappings = extractWritebackMappings(decodeYdl(ydlBytes));
if (mappings.length !== 1) throw Error(`SUBLIST_LOOKUP_ADDITIONAL_WRITEBACK_EXPECTED_ONE_MAPPING: ${mappings.length}`);
const mapping = mappings[0];
const fixture = {
  schemaVersion: "1.0.0",
  phase,
  sources: [
    { role: "authoritative Data List production export", fileName: basename(ydl), sha256: sha(ydlBytes), readOnly: true },
    { role: "Approval Form comparison-only export", fileName: basename(ywf), sha256: sha(ywfBytes), readOnly: true, prohibitedFromDataListRouting: true },
  ],
  validCases: [mapping],
  negativeCases: [
    { id: "missing-source-field", expected: "SUBLIST_LOOKUP_ADDITIONAL_SOURCE_MISSING" },
    { id: "invalid-source-field-id", expected: "SUBLIST_LOOKUP_ADDITIONAL_SOURCE_INVALID" },
    { id: "ambiguous-source-field", expected: "SUBLIST_LOOKUP_ADDITIONAL_SOURCE_AMBIGUOUS" },
    { id: "missing-destination", expected: "SUBLIST_LOOKUP_ADDITIONAL_DESTINATION_MISSING" },
    { id: "ambiguous-destination", expected: "SUBLIST_LOOKUP_ADDITIONAL_DESTINATION_AMBIGUOUS" },
    { id: "wrong-parent-sublist-scope", expected: "SUBLIST_LOOKUP_ADDITIONAL_SCOPE_MISMATCH" },
    { id: "missing-target-field", expected: "SUBLIST_LOOKUP_ADDITIONAL_TARGET_FIELD_MISSING" },
    { id: "destination-not-readonly", expected: "SUBLIST_LOOKUP_ADDITIONAL_DESTINATION_READONLY_REQUIRED" },
    { id: "clear-selection-runtime-unproven", expected: "SUBLIST_LOOKUP_ADDITIONAL_CLEAR_SELECTION_RUNTIME_UNPROVEN" },
    { id: "approval-form-comparison-only", expected: "SUBLIST_LOOKUP_ADDITIONAL_APPROVAL_FORM_EXCLUDED" },
  ],
  runtimeEvidence: {
    selectionChange: "not present in static export",
    initialization: "not present in static export",
    editMode: "not present in static export",
    repeatSelection: "not present in static export",
    clearSelection: "not present in static export",
    invalidOrMissingTarget: "not present in static export",
  },
  exclusions: ["runtime target retrieval", "selection events", "expression evaluation", "destination mutation", "read-only runtime enforcement", "clearing behavior", "template/resource mutation", "package output", "Approval Form routing", "child resource identity"],
};
const contract = {
  schemaVersion: "1.0.0",
  phase,
  decision: { status: "accepted_static_intent_only", marker: "SUBLIST_LOOKUP_ADDITIONAL_WRITEBACK_STATIC_CONTRACT_ACCEPTED", nextPhase: "phase-14b-data-list-sublist-lookup-additional-field-writeback-intent-internal-shadow" },
  authoritativeScope: {
    parentProductIdentity: ["parentListId", "parentFieldId"],
    embeddedColumnSemantics: "source and destination id/idx are embedded export-column semantics only; neither is a ListID, FieldID, row-schema identity, allocation input, or fallback key.",
    staticIntent: "A direct export mapping may contain only parent scope, Lookup target/display/value configuration, one target record source field, one destination embedded column, order, and required static readonly configuration.",
  },
  evidence: {
    fixture: fixturePath,
    exactDataListPaths: mapping.paths,
    staticRepresentations: ["parent Defs[].Rules list-variables", "Type 1 LayoutInResources[].Resource list control attrs.list-variables", "Type 1 LayoutInResources[].Resource list-fields Lookup control attrs.addition"],
    runtimeTriggerEvidence: fixture.runtimeEvidence,
  },
  coreOwnership: "Core may return only frozen JSON-safe static cross-field writeback intent and immutable findings. It may not retrieve target records, subscribe to events, evaluate expressions, mutate destinations, enforce readonly behavior, clear values, validate runtime state, mutate templates/resources, or emit packages.",
  hostOwnership: ["target-record retrieval", "selection-event lifecycle", "expression evaluation", "destination mutation", "read-only runtime enforcement", "clear-selection handling", "runtime validation", "template/resource mutation", "package output"],
  stableErrors: fixture.negativeCases.map((item) => item.expected),
  candidate: {
    accepted: true,
    name: "immutable-static-additional-field-mapping-intent",
    rationale: "The export explicitly proves a single Data List mapping from target Decimal5 to readonly LeaveUsageHours in the same parent Sublist control. The shadow must not claim runtime event or writeback parity.",
    runtimeRoutingAuthorized: false,
  },
  approvalForm: { comparisonOnly: true, prohibitedFromDataListContract: true },
};
write(fixturePath, fixture);
write(contractPath, contract);
write(reportPath, `# Phase 14A Embedded Sublist Lookup Additional-Field Writeback Contract Audit\n\nThe authoritative Data List export proves one static Lookup additional-field mapping. In the Create Balance Type 1 layout, the parent Sublist field Text10 binds Lookup column LeaveUsage to target ListID 2076284286981328907. Its control has an attrs.addition entry for target field Decimal5 (FieldID 2076284286981328912) with RelationName LeaveUsageHours. The destination embedded number column is in the same parent Sublist control and its control has readonly true. The parent Rules list-variables and form list-variables/list-fields preserve the same static scope and Lookup target configuration.\n\nThe export does not prove selection-change, initialization, edit-mode, repeat-selection, clear-selection, invalid-target, retrieval, expression, mutation, or writeback timing. Therefore only an immutable static mapping-intent shadow is accepted. Runtime behavior and production runtime writeback are not authorized. The Approval Form export is comparison-only.\n`);
const state = json(statePath);
state.migration.currentPhase = phase;
state.migration.currentPhaseStatus = "complete";
state.migration.nextPhase = contract.decision.nextPhase;
state.completed.push({ id: phase, status: "complete", evidence: "2026-07-19: authoritative Data List export proves one static embedded Lookup additional-field mapping; runtime event and writeback semantics remain unproven and excluded." });
state.proofStatus.dataListSublistLookupAdditionalFieldWritebackContract = "accepted_static_intent_only";
write(statePath, state);
console.log("SUBLIST_LOOKUP_ADDITIONAL_WRITEBACK_STATIC_CONTRACT_ACCEPTED");

function extractWritebackMappings(data) {
  const item = data.Item;
  const output = [];
  for (const [layoutIndex, layout] of item.Layouts.entries()) {
    for (const [resourceIndex, layoutResource] of (layout.LayoutInResources || []).entries()) {
      const form = JSON.parse(losslessJson(layoutResource.Resource));
      walk(form, (node, controlPath) => {
        if (node?.type !== "list" || !Array.isArray(node.attrs?.["list-fields"])) return;
        const parent = item.Defs.find((field) => field.FieldID === node.fieldID && field.Type === "list");
        if (!parent) return;
        for (const [columnIndex, lookupColumn] of node.attrs["list-fields"].entries()) {
          if (lookupColumn?.type !== "lookup" || !lookupColumn?.value) continue;
          const target = JSON.parse(losslessJson(lookupColumn.value));
          const addition = Array.isArray(lookupColumn.control?.attrs?.addition) ? lookupColumn.control.attrs.addition : [];
          for (const [additionIndex, relation] of addition.entries()) {
            if (!relation?.RelationName) continue;
            const destinations = node.attrs["list-fields"].filter((column) => column?.id === relation.RelationName);
            if (destinations.length !== 1) throw Error("SUBLIST_LOOKUP_ADDITIONAL_DESTINATION_AMBIGUOUS");
            const destination = destinations[0];
            if (destination.control?.readonly !== true) throw Error("SUBLIST_LOOKUP_ADDITIONAL_DESTINATION_READONLY_REQUIRED");
            const rules = JSON.parse(losslessJson(parent.Rules));
            const ruleSource = rules["list-variables"]?.find((column) => column?.id === lookupColumn.id);
            const ruleDestination = rules["list-variables"]?.find((column) => column?.id === destination.id);
            if (!ruleSource || !ruleDestination) throw Error("SUBLIST_LOOKUP_ADDITIONAL_RULES_PARITY_MISSING");
            output.push({
              id: "create-balance-leave-usage-hours",
              paths: {
                parentRules: `Data.Item.Defs[FieldID=${parent.FieldID}].Rules[\"list-variables\"]`,
                layout: `Data.Item.Layouts[${layoutIndex}]`,
                layoutResource: `Data.Item.Layouts[${layoutIndex}].LayoutInResources[${resourceIndex}].Resource`,
                sublistControl: controlPath,
                lookupColumn: `${controlPath}.attrs[\"list-fields\"][${columnIndex}]`,
                addition: `${controlPath}.attrs[\"list-fields\"][${columnIndex}].control.attrs.addition[${additionIndex}]`,
              },
              scope: { parentListId: parent.ListID, parentFieldId: parent.FieldID, layoutId: layout.LayoutID, layoutResourceId: layoutResource.ID, parentSublistBinding: node.binding, parentSublistControlId: node.id },
              lookup: { id: lookupColumn.id, idx: lookupColumn.idx, name: lookupColumn.name, type: lookupColumn.type, targetListId: target.ListID, targetListSetId: target.ListSetID, appId: target.AppID, displayField: lookupColumn.control?.attrs?.listfield, valueField: lookupColumn.control?.binding },
              source: { fieldName: relation.FieldName, fieldId: relation.FieldID, order: relation.Order, isShow: relation.IsShow, relationName: relation.RelationName },
              destination: { id: destination.id, idx: destination.idx, name: destination.name, type: destination.type, editable: destination.editable, readonly: destination.control?.readonly === true, controlBinding: destination.control?.binding },
              representationParity: { rulesSourceId: ruleSource.id, rulesDestinationId: ruleDestination.id, listVariablesSourceId: node.attrs["list-variables"]?.find((column) => column?.id === lookupColumn.id)?.id, listVariablesDestinationId: node.attrs["list-variables"]?.find((column) => column?.id === destination.id)?.id },
            });
          }
        }
      });
    }
  }
  return output;
}

function decodeYdl(bytes) {
  const wrapper = JSON.parse(losslessJson(bytes.toString("utf8")));
  const packed = Buffer.from(wrapper.Resource.slice("[______gizp______]".length), "base64");
  const outer = JSON.parse(losslessJson(gunzipSync(packed).toString("utf8")));
  return JSON.parse(losslessJson(outer.Data));
}

function losslessJson(source) {
  let output = ""; let index = 0; let quoted = false; let escaped = false;
  while (index < source.length) {
    const character = source[index];
    if (quoted) { output += character; if (escaped) escaped = false; else if (character === "\\") escaped = true; else if (character === "\"") quoted = false; index += 1; continue; }
    if (character === "\"") { quoted = true; output += character; index += 1; continue; }
    if (character === "-" || (character >= "0" && character <= "9")) { let end = index + (character === "-" ? 1 : 0); while (end < source.length && source[end] >= "0" && source[end] <= "9") end += 1; const token = source.slice(index, end); output += /^-?\d{16,}$/.test(token) ? JSON.stringify(token) : token; index = end; continue; }
    output += character; index += 1;
  }
  return output;
}

function walk(value, visit, path = "$") { if (!value || typeof value !== "object") return; if (Array.isArray(value)) { value.forEach((item, index) => walk(item, visit, `${path}[${index}]`)); return; } visit(value, path); Object.entries(value).forEach(([key, item]) => walk(item, visit, `${path}.${key}`)); }
function argument(name, fallback) { const index = process.argv.indexOf(name); return index < 0 ? fallback : process.argv[index + 1]; }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function json(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }
function write(path, value) { writeFileSync(resolve(root, path), typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`); }

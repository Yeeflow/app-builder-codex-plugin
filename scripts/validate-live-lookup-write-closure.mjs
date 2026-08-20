#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function asArray(value) { return Array.isArray(value) ? value : []; }
function text(value) { return value === null || value === undefined ? "" : String(value).trim(); }
function key(...values) { return values.map(text).join("::"); }
function finding(code, message, pointer) { return { severity: "error", code, message, path: pointer }; }

/**
 * Validates evidence captured around a direct MCP record write. It is deliberately
 * read-only: callers provide redacted target-row resolution, intended writes, and
 * persisted readback rather than this script attempting any live API operation.
 */
export function validateLiveLookupWriteClosure(input) {
  const findings = [];
  const lookupFields = asArray(input?.lookupFields);
  const targets = asArray(input?.resolvedTargets);
  const intents = asArray(input?.writeIntents);
  const persistedRows = asArray(input?.persistedRows);

  const fields = new Map();
  lookupFields.forEach((field, index) => {
    const hostListId = text(field?.hostListId);
    const fieldName = text(field?.fieldName);
    const targetListId = text(field?.targetListId);
    const displayField = text(field?.displayField || "Title");
    const pointer = `$.lookupFields[${index}]`;
    if (!hostListId || !fieldName || !targetListId) {
      findings.push(finding("LOOKUP_WRITE_FIELD_CONTRACT_INVALID", "Each Lookup field declaration requires hostListId, fieldName, and targetListId.", pointer));
      return;
    }
    const fieldKey = key(hostListId, fieldName);
    if (fields.has(fieldKey)) {
      findings.push(finding("LOOKUP_WRITE_FIELD_DECLARATION_DUPLICATE", "Each host-list Lookup field may be declared only once.", pointer));
      return;
    }
    fields.set(fieldKey, { ...field, hostListId, fieldName, targetListId, displayField, pointer });
  });

  const targetsByKey = new Map();
  targets.forEach((target, index) => {
    const listId = text(target?.listId);
    const listDataId = text(target?.ListDataID ?? target?.listDataId);
    if (!listId || !listDataId) {
      findings.push(finding("LOOKUP_WRITE_TARGET_INVENTORY_INVALID", "Resolved target rows require listId and ListDataID.", `$.resolvedTargets[${index}]`));
      return;
    }
    const targetKey = key(listId, listDataId);
    if (targetsByKey.has(targetKey)) {
      findings.push(finding("LOOKUP_WRITE_TARGET_INVENTORY_DUPLICATE", "Resolved target rows must not duplicate a listId/ListDataID pair.", `$.resolvedTargets[${index}]`));
      return;
    }
    targetsByKey.set(targetKey, target);
  });

  const intentsByField = new Map();
  intents.forEach((intent, index) => {
    const hostListId = text(intent?.hostListId);
    const recordId = text(intent?.recordId);
    const fieldName = text(intent?.fieldName);
    const fieldKey = key(hostListId, fieldName);
    const pointer = `$.writeIntents[${index}]`;
    if (!fields.has(fieldKey)) {
      findings.push(finding("LOOKUP_WRITE_FIELD_UNDECLARED", "A Lookup write intent must name a declared host-list Lookup field.", pointer));
      return;
    }
    if (!recordId) {
      findings.push(finding("LOOKUP_WRITE_RECORD_ID_REQUIRED", "A Lookup write intent must identify the host record being written.", `${pointer}.recordId`));
      return;
    }
    const intentKey = key(hostListId, recordId, fieldName);
    if (intentsByField.has(intentKey)) {
      findings.push(finding("LOOKUP_WRITE_INTENT_DUPLICATE", "A host record may have only one write intent for a Lookup field.", pointer));
      return;
    }
    intentsByField.set(intentKey, { intent, pointer, fieldKey });
  });

  const persistedByRecord = new Map();
  persistedRows.forEach((row, index) => {
    const hostListId = text(row?.hostListId);
    const recordId = text(row?.recordId);
    if (!hostListId || !recordId || !row?.values || typeof row.values !== "object" || Array.isArray(row.values)) {
      findings.push(finding("LOOKUP_WRITE_PERSISTED_READBACK_INVALID", "Persisted readback rows require hostListId, recordId, and an object of field values.", `$.persistedRows[${index}]`));
      return;
    }
    const rowKey = key(hostListId, recordId);
    if (persistedByRecord.has(rowKey)) {
      findings.push(finding("LOOKUP_WRITE_PERSISTED_READBACK_DUPLICATE", "Persisted readback must contain one row per host list and record.", `$.persistedRows[${index}]`));
      return;
    }
    persistedByRecord.set(rowKey, row);
  });

  let resolvedReferences = 0;
  let checkedWrites = 0;
  for (const field of fields.values()) {
    const matches = [...intentsByField.values()].filter(({ fieldKey }) => fieldKey === key(field.hostListId, field.fieldName));
    if (!matches.length) {
      findings.push(finding("LOOKUP_WRITE_INTENT_MISSING", "Every declared Lookup field requires a structured direct-write intent.", field.pointer));
      continue;
    }
    for (const { intent, pointer } of matches) {
      checkedWrites += 1;
      const value = intent?.value;
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        findings.push(finding("LOOKUP_WRITE_UNSTRUCTURED", "Lookup writes must use a structured ListDataID reference, never a raw display-text string.", `${pointer}.value`));
        continue;
      }
      if (value.seedValueType !== "lookup" || value.requiresLookupListDataIDResolution !== true || value.storedValueField !== "ListDataID" || value.mustNotUseDisplayTextAsStoredValue !== true) {
        findings.push(finding("LOOKUP_WRITE_RESOLUTION_REQUIRED", "Lookup writes must explicitly require target ListDataID resolution and forbid display-text storage.", `${pointer}.value`));
      }
      if (text(value.targetListId) !== field.targetListId) {
        findings.push(finding("LOOKUP_WRITE_TARGET_LIST_MISMATCH", "The Lookup write target list must match the field's configured target list.", `${pointer}.value.targetListId`));
      }
      const resolvedListDataID = text(value.resolvedListDataID);
      const target = targetsByKey.get(key(field.targetListId, resolvedListDataID));
      if (!resolvedListDataID || !target) {
        const displayTextMatch = targets.find((candidate) => text(candidate?.listId) === field.targetListId && text(candidate?.[field.displayField]) === resolvedListDataID);
        if (displayTextMatch) {
          findings.push(finding("LOOKUP_WRITE_DISPLAY_TEXT_FORBIDDEN", "A target display value, title, or code cannot be used as the Lookup stored value; write the resolved ListDataID instead.", `${pointer}.value.resolvedListDataID`));
        }
        findings.push(finding("LOOKUP_WRITE_TARGET_RECORD_UNRESOLVED", "Lookup writes must resolve a target row in the configured target list before writing.", `${pointer}.value.resolvedListDataID`));
        continue;
      }
      const displayValue = text(target?.[field.displayField]);
      if (resolvedListDataID === displayValue || text(value.displayValueHint) === resolvedListDataID) {
        findings.push(finding("LOOKUP_WRITE_DISPLAY_TEXT_FORBIDDEN", "A target display value, title, or code cannot be used as the Lookup stored value; write the resolved ListDataID instead.", `${pointer}.value`));
      }
      const row = persistedByRecord.get(key(field.hostListId, intent.recordId));
      if (!row) {
        findings.push(finding("LOOKUP_WRITE_PERSISTED_READBACK_MISSING", "Each direct Lookup write requires a persisted row readback for the same host record.", pointer));
        continue;
      }
      const persistedValue = text(row.values?.[field.fieldName]);
      if (persistedValue !== resolvedListDataID) {
        findings.push(finding("LOOKUP_WRITE_PERSISTED_VALUE_MISMATCH", "Persisted Lookup storage must equal the resolved target ListDataID exactly.", `$.persistedRows[${[...persistedByRecord.keys()].indexOf(key(field.hostListId, intent.recordId))}].values.${field.fieldName}`));
        continue;
      }
      if (!targetsByKey.has(key(field.targetListId, persistedValue))) {
        findings.push(finding("LOOKUP_REFERENCE_PERSISTED_UNRESOLVED", "The persisted Lookup value must resolve to an existing target row in the configured list.", `${pointer}.value.resolvedListDataID`));
        continue;
      }
      resolvedReferences += 1;
    }
  }

  const evidence = input?.evidence && typeof input.evidence === "object" ? input.evidence : {};
  return {
    status: findings.length ? "fail" : "pass",
    findings,
    checkedWrites,
    evidence: {
      apiAccepted: evidence.apiAccepted === true ? "observed" : "not-provided",
      persistedReadback: persistedRows.length ? "observed" : "not-provided",
      lookupReferenceResolved: checkedWrites > 0 && resolvedReferences === checkedWrites && !findings.length ? "observed" : "not-established",
      browserActionRuntime: evidence.browserActionRuntime === true ? "observed" : "not-provided",
    },
  };
}

function usage(exitCode = 1) {
  console.log("Usage: node scripts/validate-live-lookup-write-closure.mjs --input <redacted-evidence.json>");
  process.exit(exitCode);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const inputIndex = process.argv.indexOf("--input");
  const inputPath = inputIndex >= 0 ? process.argv[inputIndex + 1] : "";
  if (!inputPath || process.argv.includes("--help") || process.argv.includes("-h")) usage(inputPath ? 0 : 1);
  const report = validateLiveLookupWriteClosure(JSON.parse(fs.readFileSync(path.resolve(inputPath), "utf8").replace(/^\uFEFF/, "")));
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}

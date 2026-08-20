#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateLiveLookupWriteClosure } from "./validate-live-lookup-write-closure.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const valid = JSON.parse(fs.readFileSync(path.join(root, "fixtures/live-lookup-write-closure/management-action-plan.valid.json"), "utf8"));
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function expectCode(value, code) {
  const report = validateLiveLookupWriteClosure(value);
  assert.equal(report.status, "fail", JSON.stringify(report, null, 2));
  assert.ok(report.findings.some((item) => item.code === code), JSON.stringify(report, null, 2));
}

const report = validateLiveLookupWriteClosure(valid);
assert.equal(report.status, "pass", JSON.stringify(report, null, 2));
assert.equal(report.checkedWrites, 3);
assert.deepEqual(report.evidence, {
  apiAccepted: "observed",
  persistedReadback: "observed",
  lookupReferenceResolved: "observed",
  browserActionRuntime: "not-provided",
});

for (const [fieldName, displayTitle] of [["Text4", "ENG-001"], ["Text14", "EVD-001"], ["Text15", "FUT-001"]]) {
  const displayTextWrite = clone(valid);
  displayTextWrite.writeIntents.find((item) => item.fieldName === fieldName).value.resolvedListDataID = displayTitle;
  displayTextWrite.persistedRows[0].values[fieldName] = displayTitle;
  expectCode(displayTextWrite, "LOOKUP_WRITE_DISPLAY_TEXT_FORBIDDEN");
}

const rawText = clone(valid);
rawText.writeIntents[0].value = "ENG-001";
expectCode(rawText, "LOOKUP_WRITE_UNSTRUCTURED");
const wrongTargetList = clone(valid);
wrongTargetList.writeIntents[0].value.targetListId = "evidence-submissions";
expectCode(wrongTargetList, "LOOKUP_WRITE_TARGET_LIST_MISMATCH");
const staleReadback = clone(valid);
staleReadback.persistedRows[0].values.Text14 = "EVD-001";
expectCode(staleReadback, "LOOKUP_WRITE_PERSISTED_VALUE_MISMATCH");
const missingReadback = clone(valid);
missingReadback.persistedRows = [];
expectCode(missingReadback, "LOOKUP_WRITE_PERSISTED_READBACK_MISSING");

console.log("LIVE_LOOKUP_WRITE_CLOSURE_REGRESSIONS_PASSED cases=8");

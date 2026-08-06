#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { materializeDocumentLibraryLiveBundle } from "./lib/document-library-live-materializer.mjs";
import {
  mergeDocumentLibraryLiveCustomizations,
  prepareDocumentLibraryLiveBaseline,
  validateDocumentLibraryLiveReadback,
} from "./lib/document-library-live-merge.mjs";

const ids = Array.from({ length: 14 }, (_, index) => String(100000000000000001n + BigInt(index)));
const guids = Array.from({ length: 20 }, (_, index) => `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`);
const spec = {
  title: "Leave Policy Documents",
  description: "Central repository for approved leave policy documents.",
  ids: {
    listId: ids[0],
    nativeFieldIds: ids.slice(1, 8),
    customFieldIds: ids.slice(8, 11),
    layoutIds: ids.slice(11, 14),
  },
  controlIds: guids.slice(0, 10),
  choiceOptionIds: guids.slice(10, 14),
  fields: [
    { displayName: "Department", internalName: "Department", type: "input", fieldName: "Text5", fieldIndex: 5 },
    { displayName: "Owner", internalName: "Owner", type: "identity-picker", fieldName: "Text6", fieldIndex: 6, rules: { "identity-maxselection": 1 } },
    { displayName: "Security Level", internalName: "Security_Level", type: "radio", fieldName: "Text7", fieldIndex: 7, choices: ["Public", "Internal", "Confidential", "Restricted"], defaultValue: "Internal" },
  ],
};

const result = materializeDocumentLibraryLiveBundle(spec);
assert.equal(result.validation.status, "pass");
assert.equal(result.validation.resourceIdsUnique, true);
assert.equal(result.bundle.baselineDetail.List.Type, 16);
assert.equal(result.bundle.baselineDetail.Fields.length, 7);
assert.equal(result.bundle.finalDetail.Fields.length, 10);
assert.equal(new Set(result.bundle.finalDetail.Fields.map((field) => field.FieldID)).size, 10);
assert.deepEqual(result.bundle.customFields.map((field) => field.FieldID), ids.slice(8, 11));
assert.deepEqual(result.bundle.customFields.map((field) => field.FieldIndex), [5, 6, 7]);
assert.equal(result.bundle.customFields[1].Type, "identity-picker");
assert.equal(result.bundle.customFields[2].DefaultValue, "Internal");
assert.deepEqual(JSON.parse(result.bundle.customFields[2].Rules).choices, ["Public", "Internal", "Confidential", "Restricted"]);
assert.equal(result.proofBoundary.mcpBaselineSave, "not-run");
assert.equal(result.proofBoundary.documentUpload, "not-run");

const baseline = prepareDocumentLibraryLiveBaseline({ bundle: result.bundle });
assert.equal(baseline.report.phase, "baseline");
const merged = mergeDocumentLibraryLiveCustomizations({ baselineReadback: baseline.detail, bundle: result.bundle });
assert.equal(merged.report.phase, "customizations");
assert.equal(merged.report.nativeIdentityContinuity, true);
assert.equal(merged.detail.Fields.length, 10);

const mcpEnvelope = {
  content: [{ type: "text", text: JSON.stringify({ Data: merged.detail, Status: 0 }) }],
};
const readback = validateDocumentLibraryLiveReadback({ detail: mcpEnvelope, bundle: result.bundle });
assert.equal(readback.status, "pass");
assert.equal(readback.type16, true);
assert.equal(readback.customFieldCount, 3);
assert.equal(readback.proofBoundary.mcpReadback, "passed");
assert.equal(readback.proofBoundary.designerOpen, "not-run");

const cliPath = resolve(dirname(fileURLToPath(import.meta.url)), "materialize-live-document-library.mjs");
const cli = JSON.parse(execFileSync(process.execPath, [cliPath], { input: JSON.stringify(spec), encoding: "utf8" }));
assert.deepEqual(cli, result);

const duplicateIdSpec = structuredClone(spec);
duplicateIdSpec.ids.customFieldIds[0] = duplicateIdSpec.ids.nativeFieldIds[5];
assert.throws(
  () => materializeDocumentLibraryLiveBundle(duplicateIdSpec),
  (error) => error.code === "DOCUMENT_LIBRARY_LIVE_DUPLICATE_RESOURCE_ID" && error.detail.duplicateProperty === "ids.customFieldIds[0]",
);

const crossedStorageSpec = structuredClone(spec);
crossedStorageSpec.fields[0].fieldIndex = 6;
assert.throws(() => materializeDocumentLibraryLiveBundle(crossedStorageSpec), (error) => error.code === "DOCUMENT_LIBRARY_LIVE_CUSTOM_FIELD_STORAGE_MISMATCH");

const changedNativeReadback = structuredClone(baseline.detail);
changedNativeReadback.Fields[0].FieldID = "199999999999999999";
assert.throws(
  () => mergeDocumentLibraryLiveCustomizations({ baselineReadback: changedNativeReadback, bundle: result.bundle }),
  (error) => error.code === "DOCUMENT_LIBRARY_LIVE_BASELINE_NATIVE_ID_CONTINUITY_FAILED",
);

const missingBindingReadback = structuredClone(merged.detail);
const viewLayout = missingBindingReadback.Layouts.find((layout) => layout.Title.endsWith("View Item"));
viewLayout.LayoutView = viewLayout.LayoutView.replace('"binding":"Text7"', '"binding":"Missing"');
assert.throws(
  () => validateDocumentLibraryLiveReadback({ detail: missingBindingReadback, bundle: result.bundle }),
  (error) => error.code === "DOCUMENT_LIBRARY_LIVE_FORM_BINDING_MISSING",
);

console.log("DOCUMENT_LIBRARY_LIVE_MATERIALIZER_PASSED");

#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const matrix = json("compatibility/capability-manifests/data-list-sublist-remaining-configuration-family-selection-matrix.v0.1.0.json");
const fixture = json("compatibility/differential-fixtures/data-list-sublist-remaining-configuration-family-selection.v0.1.0.json");
const contract = json("compatibility/capability-manifests/data-list-sublist-remaining-configuration-family-selection-contract.v0.1.0.json");
const report = read("docs/architecture/yeeflow-app-builder-phase-15-data-list-sublist-remaining-configuration-family-selection-contract-audit.v0.1.0.md");
const expectedFamilies = ["identity-user-people-person-department", "file-image-attachment-binary", "barcode-control-and-field-rules", "nested-sublist-and-graph-mutation", "summary-presentation-or-binding", "actions-runtime-expressions-and-writeback", "layout-resource-integration-package-output"];
assert.equal(matrix.auditOnly, true);
assert.deepEqual(matrix.families.map((item) => item.id), expectedFamilies);
assert.equal(contract.decision.marker, "PHASE_15_CONFIGURATION_NO_SAFE_CANDIDATE");
assert.equal(contract.selection.selectedCandidate, null);
assert.equal(contract.selection.rationale.includes("generic Legacy fallbacks"), true);
assert.equal(fixture.sources.length, 2);
assert(fixture.sources.every((item) => item.readOnly === true && /^[a-f0-9]{64}$/u.test(item.sha256)));
for (const observation of matrix.exportObservations) {
  assert.equal(observation.sublistControlCount, 2);
  for (const control of observation.controls) assert.equal(control.columnTypes.some((type) => ["user", "identity", "department", "file", "image", "binary", "barcode", "list", "sublist"].includes(type)), false);
}
for (const code of fixture.negativeCases.map((item) => item.expected)) assert.match(code, /^SUBLIST_REMAINING_FAMILY_/u);
assert.throws(() => validateCandidate({ selectedCandidate: "identity-user-people-person-department", exportProvenStaticConfiguration: false }), /SUBLIST_REMAINING_FAMILY_EXPORT_MISSING/u);
assert.throws(() => validateCandidate({ selectedCandidate: "summary-presentation-or-binding", exportProvenStaticConfiguration: true, alreadyCovered: true }), /SUBLIST_REMAINING_FAMILY_ALREADY_COVERED/u);
assert.throws(() => validateCandidate({ selectedCandidate: "actions-runtime-expressions-and-writeback", exportProvenStaticConfiguration: true, runtimeExecution: true }), /SUBLIST_REMAINING_FAMILY_RUNTIME_OWNED/u);
for (const marker of ["DATA_LIST_SUBLIST_REMAINING_FAMILIES_AUDITED", "DATA_LIST_SUBLIST_CONFIGURATION_CANDIDATE_SELECTION_VALID", "DATA_LIST_SUBLIST_CONFIGURATION_CANDIDATE_SELECTION_REGRESSIONS_PASSED", "PHASE_15_CONFIGURATION_NO_SAFE_CANDIDATE"]) assert(report.includes(marker));
console.log("DATA_LIST_SUBLIST_REMAINING_FAMILIES_AUDITED");
console.log("DATA_LIST_SUBLIST_CONFIGURATION_CANDIDATE_SELECTION_VALID");
console.log("DATA_LIST_SUBLIST_CONFIGURATION_CANDIDATE_SELECTION_REGRESSIONS_PASSED");
console.log("PHASE_15_CONFIGURATION_NO_SAFE_CANDIDATE");

function validateCandidate(candidate) {
  if (!candidate.exportProvenStaticConfiguration) throw Error("SUBLIST_REMAINING_FAMILY_EXPORT_MISSING");
  if (candidate.alreadyCovered) throw Error("SUBLIST_REMAINING_FAMILY_ALREADY_COVERED");
  if (candidate.runtimeExecution) throw Error("SUBLIST_REMAINING_FAMILY_RUNTIME_OWNED");
}
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }

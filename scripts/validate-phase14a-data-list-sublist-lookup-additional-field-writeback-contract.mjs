#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = json("compatibility/capability-manifests/data-list-sublist-lookup-additional-field-writeback-contract.v0.1.0.json");
const fixture = json("compatibility/differential-fixtures/data-list-sublist-lookup-additional-field-writeback-export.v0.1.0.json");
assert.equal(contract.decision.status, "accepted_static_intent_only");
assert.equal(contract.candidate.accepted, true);
assert.equal(contract.candidate.runtimeRoutingAuthorized, false);
assert.equal(fixture.validCases.length, 1);
const mapping = fixture.validCases[0];
assert.equal(mapping.lookup.targetListId, "2076284286981328907");
assert.equal(mapping.source.fieldName, "Decimal5");
assert.equal(mapping.destination.id, "LeaveUsageHours");
assert.equal(mapping.destination.readonly, true);
assert.equal(mapping.representationParity.rulesSourceId, mapping.lookup.id);
assert.equal(mapping.representationParity.rulesDestinationId, mapping.destination.id);
for (const code of ["SUBLIST_LOOKUP_ADDITIONAL_SOURCE_MISSING", "SUBLIST_LOOKUP_ADDITIONAL_DESTINATION_MISSING", "SUBLIST_LOOKUP_ADDITIONAL_DESTINATION_READONLY_REQUIRED", "SUBLIST_LOOKUP_ADDITIONAL_CLEAR_SELECTION_RUNTIME_UNPROVEN", "SUBLIST_LOOKUP_ADDITIONAL_APPROVAL_FORM_EXCLUDED"]) assert(contract.stableErrors.includes(code));
assert.equal(Object.values(fixture.runtimeEvidence).every((value) => value === "not present in static export"), true);
assert.equal(contract.authoritativeScope.embeddedColumnSemantics.includes("row-schema identity"), true);
console.log("SUBLIST_LOOKUP_ADDITIONAL_WRITEBACK_LEGACY_BOUNDARIES_AUDITED");
console.log("SUBLIST_LOOKUP_ADDITIONAL_WRITEBACK_STATIC_CONTRACT_VALID");
console.log("SUBLIST_LOOKUP_ADDITIONAL_WRITEBACK_STATIC_CONTRACT_REGRESSIONS_PASSED");
console.log("PHASE_14_STATIC_WRITEBACK_INTENT_CANDIDATE_ACCEPTED");

function json(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }

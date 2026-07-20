#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const reconciliation = json("compatibility/capability-manifests/data-list-sublist-lookup-additional-field-configuration-readiness-reconciliation.v0.1.0.json");
const runtimeBlocker = json("compatibility/capability-manifests/data-list-sublist-lookup-additional-field-runtime-evidence-blocker.v0.1.0.json");
const fixture = json("compatibility/differential-fixtures/data-list-sublist-lookup-additional-field-writeback-export.v0.1.0.json");
assert.equal(reconciliation.decision.marker, "SUBLIST_LOOKUP_ADDITIONAL_CONFIGURATION_READINESS_ACCEPTED");
assert.equal(reconciliation.supersession.status, "superseded-for-configuration-generation-only");
assert.equal(runtimeBlocker.decision.status, "blocked", "Historical runtime blocker must remain sealed.");
assert.equal(runtimeBlocker.localMaterializerBoundary.hasRuntimeWritebackRoute, false);
assert.equal(fixture.validCases[0].scope.parentListId, "2076284286981328899");
assert.equal(fixture.validCases[0].lookup.targetListId, "2076284286981328907");
assert(reconciliation.approvedBoundary.identityRule.includes("never product resource identities"));
for (const prohibited of ["selection events", "target-record retrieval", "runtime writeback", "Approval Forms"]) assert(reconciliation.excluded.includes(prohibited));
console.log("SUBLIST_LOOKUP_ADDITIONAL_CONFIGURATION_READINESS_VALID");
console.log("SUBLIST_LOOKUP_ADDITIONAL_CONFIGURATION_READINESS_REGRESSIONS_PASSED");

function json(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }

#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const closure = json("compatibility/capability-manifests/data-list-sublist-lookup-additional-field-configuration-family-closure.v0.1.0.json");
const route = json("compatibility/capability-manifests/data-list-sublist-lookup-additional-field-configuration-selective-routing-proof.v0.1.0.json");
const blocker = json("compatibility/capability-manifests/data-list-sublist-lookup-additional-field-runtime-evidence-blocker.v0.1.0.json");
assert.equal(closure.decision.marker, "SUBLIST_LOOKUP_ADDITIONAL_CONFIGURATION_FAMILY_CLOSURE_ACCEPTED");
assert.equal(route.route.selectionCountPerEligibleEmbeddedLookupColumn, 1);
for (const excluded of ["frontend selection events", "target retrieval", "runtime writeback", "Approval Forms"]) assert(route.route.excluded.includes(excluded));
assert.equal(blocker.decision.status, "blocked", "The frontend-runtime blocker must remain historical evidence.");
assert(!route.route.excluded.includes("embedded id or idx"), "id and idx must not be converted into a new identity rule.");
console.log("SUBLIST_LOOKUP_ADDITIONAL_CONFIGURATION_FAMILY_CLOSURE_VALID");
console.log("SUBLIST_LOOKUP_ADDITIONAL_CONFIGURATION_FAMILY_CLOSURE_REGRESSIONS_PASSED");
function json(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }

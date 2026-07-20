#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = json("compatibility/capability-manifests/data-list-sublist-embedded-lookup-family-closure.v0.1.0.json");
const lineage = json("compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json");
assert.equal(contract.decision.status, "complete");
assert.equal(contract.decision.marker, "PHASE_13_CLOSURE_ACCEPTED");
assert.equal(contract.authoritativeModel.embeddedColumnSemantics.includes("never child ListID"), true);
assert.equal(contract.exclusions.includes("additional fields writeback"), true);
assert.equal(contract.familyMatrix.find((item) => item.family === "Direct target/display")?.status, "closed");
assert.equal(contract.familyMatrix.find((item) => item.family === "additional fields auto-population")?.status, "deferred");
assert.equal(contract.familyMatrix.find((item) => item.family === "additional fields auto-population")?.disposition.includes("cannot inherit"), true);
assert.equal(contract.familyMatrix.some((item) => item.status === "closed" && /writeback|runtime|Approval/i.test(item.family)), false);
const routing = lineage.approvedTransitions.find((transition) => transition.phase === "phase-13f-data-list-sublist-embedded-lookup-selective-routing-proof");
assert.equal(routing.phase, "phase-13f-data-list-sublist-embedded-lookup-selective-routing-proof");
assert.equal(contract.lineage.routingEvidenceSha256, routing.evidenceSha256);
assert.equal(contract.lineage.materializerSha256, routing.sourceTransition.afterSha256, "The Phase 13 contract must retain its sealed materializer baseline.");
assert(lineage.approvedTransitions.some((transition) => transition.phase === "phase-14f-data-list-sublist-lookup-additional-field-configuration-selective-routing-proof"), "Later approved routing must remain explicit rather than rewriting Phase 13 evidence.");
console.log("SUBLIST_EMBEDDED_LOOKUP_ROUTE_RECONFIRMED");
console.log("SUBLIST_EMBEDDED_LOOKUP_ADDITIONAL_WRITEBACK_DEFERRED");
console.log("SUBLIST_EMBEDDED_LOOKUP_FAMILY_CLOSURE_VALID");
console.log("SUBLIST_EMBEDDED_LOOKUP_FAMILY_CLOSURE_REGRESSIONS_PASSED");
console.log("PHASE_13_CLOSURE_ACCEPTED");

function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }

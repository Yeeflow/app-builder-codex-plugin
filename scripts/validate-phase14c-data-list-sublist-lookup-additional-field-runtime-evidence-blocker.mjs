#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = JSON.parse(readFileSync(resolve(root, "compatibility/capability-manifests/data-list-sublist-lookup-additional-field-runtime-evidence-blocker.v0.1.0.json"), "utf8"));
assert.equal(contract.decision.status, "blocked");
assert.equal(contract.localMaterializerBoundary.hasStaticAdditionRoute, false);
assert.equal(contract.localMaterializerBoundary.hasRuntimeWritebackRoute, false);
assert.equal(contract.prohibitedNextActions.includes("production metadata routing"), true);
assert.equal(contract.requiredExternalEvidence.length, 8);
console.log("SUBLIST_LOOKUP_ADDITIONAL_WRITEBACK_RUNTIME_EVIDENCE_BLOCKED");
console.log("SUBLIST_LOOKUP_ADDITIONAL_WRITEBACK_RUNTIME_BLOCKER_VALID");

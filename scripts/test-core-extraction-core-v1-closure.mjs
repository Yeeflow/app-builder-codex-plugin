#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(readFileSync(resolve(root, "compatibility/capability-manifests/core-extraction-proof-envelope-registry.v1.7.0.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "docs/architecture/yeeflow-app-builder-core-migration-state.json"), "utf8"));
const wave3 = registry.envelopes.filter((item) => item.wave === "Wave 3");
const terminal = (items) => items.every((item) => ["accepted-extracted-and-routed", "reclassified-host-or-specialist-route"].includes(item.status));
assert(terminal(wave3));
assert.equal(wave3.length, 89);
assert(["core_v1_complete", "core_v1_rc_readiness_accepted"].includes(state.migration.overallStatus));
if (state.migration.overallStatus === "core_v1_rc_readiness_accepted") assert.equal(state.migration.nextPhase, "core-v1-rc-candidate-build-and-isolated-e2e-validation");
assert.throws(() => { const copy = structuredClone(wave3); copy[0].status = "deferred"; if (!terminal(copy)) throw new Error("CORE_V1_CLOSURE_UNTERMINAL_ENVELOPE_REJECTED"); }, /CORE_V1_CLOSURE_UNTERMINAL_ENVELOPE_REJECTED/);
assert.throws(() => { const copy = structuredClone(wave3); const item = copy.find((entry) => entry.status === "reclassified-host-or-specialist-route"); item.reclassificationReason = ""; item.terminalDisposition = ""; if (!copy.filter((entry) => entry.status === "reclassified-host-or-specialist-route").every((entry) => entry.reclassificationReason || entry.terminalDisposition)) throw new Error("CORE_V1_CLOSURE_REASONLESS_RECLASSIFICATION_REJECTED"); }, /CORE_V1_CLOSURE_REASONLESS_RECLASSIFICATION_REJECTED/);
console.log("CORE_V1_CLOSURE_REGRESSIONS_PASSED cases=2");

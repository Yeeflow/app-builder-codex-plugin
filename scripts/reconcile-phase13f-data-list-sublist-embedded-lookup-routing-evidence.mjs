#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const routingPath = "compatibility/capability-manifests/data-list-sublist-embedded-lookup-selective-routing-proof.v0.1.0.json";
const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
const closurePath = "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json";
const routing = json(routingPath);
if (!routing.verificationMarkers.includes("SUBLIST_EMBEDDED_LOOKUP_ROUTING_SCOPE_GATES_PASSED")) routing.verificationMarkers.push("SUBLIST_EMBEDDED_LOOKUP_ROUTING_SCOPE_GATES_PASSED");
write(routingPath, routing);
const lineage = json(lineagePath);
const transition = lineage.approvedTransitions.find((entry) => entry.phase === "phase-13f-data-list-sublist-embedded-lookup-selective-routing-proof");
if (!transition) throw Error("PHASE_13F_ROUTING_TRANSITION_MISSING");
transition.evidenceSha256 = sha(read(routingPath));
write(lineagePath, lineage);
const closure = json(closurePath);
closure.closureProofLineage.sha256 = sha(read(lineagePath));
write(closurePath, closure);
const familyClosurePath = "compatibility/capability-manifests/data-list-sublist-embedded-lookup-family-closure.v0.1.0.json";
const familyClosure = json(familyClosurePath);
familyClosure.lineage.routingEvidenceSha256 = transition.evidenceSha256;
write(familyClosurePath, familyClosure);
console.log("PHASE_13F_ROUTING_EVIDENCE_RECONCILED");

function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function write(path, value) { writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`); }

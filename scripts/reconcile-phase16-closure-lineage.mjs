#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), ".."); const read = (path) => readFileSync(resolve(root, path), "utf8"); const json = (path) => JSON.parse(read(path)); const write = (path, value) => writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`); const sha = (value) => createHash("sha256").update(value).digest("hex");
const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json"; const lineage = json(lineagePath); const closurePath = "compatibility/capability-manifests/data-list-resource-definition-family-closure.v0.1.0.json"; const closure = json(closurePath); closure.closureProofLineage.approvedPhases = lineage.approvedTransitions.map((entry) => entry.phase); closure.closureProofLineage.sha256 = sha(read(lineagePath)); write(closurePath, closure); console.log("PHASE_16_CLOSURE_LINEAGE_RECONCILED");

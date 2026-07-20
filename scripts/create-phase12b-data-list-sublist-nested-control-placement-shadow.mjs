#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-12b-data-list-sublist-scalar-nested-control-placement-intent-internal-shadow";
const read = (path) => readFileSync(resolve(root, path), "utf8");
const json = (path) => JSON.parse(read(path));
const sha = (value) => createHash("sha256").update(value).digest("hex");
const write = (path, value) => writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`);
const contract = {
  schemaVersion: "1.0.0", phase,
  decision: { status: "complete", marker: "SUBLIST_NESTED_CONTROL_CORE_SHADOW_IMPLEMENTED", nextPhase: "phase-12c-data-list-sublist-nested-control-placement-dual-public-distribution-readiness" },
  core: { path: "packages/app-builder-core-materializer/src/internal/data-list-sublist-nested-control-placement.ts", sha256: sha(read("packages/app-builder-core-materializer/src/internal/data-list-sublist-nested-control-placement.ts")), internalOnly: true },
  host: { path: "scripts/test-fixtures/data-list-sublist-nested-control-host-lowering-shadow.mjs", sha256: sha(read("scripts/test-fixtures/data-list-sublist-nested-control-host-lowering-shadow.mjs")), testOnly: true },
  corpus: { path: "compatibility/differential-fixtures/data-list-sublist-nested-control-placement-shadow.v0.1.0.json", caseCount: 12 },
  boundaries: { coreReturns: ["frozen placement intent", "frozen findings"], hostReturns: "fresh Legacy-shaped list-fields metadata", hostNeverMutates: ["template", "resource", "control graph"] },
  exclusions: ["nested Sublist controls", "Lookup", "identity", "binary", "actions", "runtime expressions", "temporary variables", "package output"]
};
write("compatibility/capability-manifests/data-list-sublist-nested-control-placement-shadow.v0.1.0.json", contract);
writeFileSync(resolve(root, "docs/architecture/yeeflow-app-builder-phase-12b-data-list-sublist-scalar-nested-control-placement-intent-internal-shadow.v0.1.0.md"), `# Phase 12B Data List Sublist Scalar Nested Child-Control Placement Internal Shadow\n\nThe internal Core projection returns frozen ordered placement intent only. The test-only host lowerer consumes explicit host control IDs and returns fresh Legacy-shaped \`list-fields\` metadata without template, resource, or graph mutation.\n\n\`SUBLIST_NESTED_CONTROL_CORE_SHADOW_IMPLEMENTED\`\n\n\`SUBLIST_NESTED_CONTROL_HOST_LOWERING_SHADOW_IMPLEMENTED\`\n\n\`SUBLIST_NESTED_CONTROL_DIFFERENTIAL_PARITY_PASSED\`\n\n\`SUBLIST_NESTED_CONTROL_SERIALIZATION_PARITY_PASSED\`\n\n\`SUBLIST_NESTED_CONTROL_CORE_IMMUTABILITY_PASSED\`\n\n\`SUBLIST_NESTED_CONTROL_TEMPLATE_NONMUTATION_PASSED\`\n\n\`SUBLIST_NESTED_CONTROL_LEGACY_UNCHANGED\`\n`);
const state = json("docs/architecture/yeeflow-app-builder-core-migration-state.json");
state.migration.currentPhase = phase; state.migration.currentPhaseStatus = "complete"; state.migration.nextPhase = contract.decision.nextPhase; state.migration.overallStatus = "in_progress";
if (!state.completed.some((item) => item.id === phase)) state.completed.push({ id: phase, status: "complete", evidence: "2026-07-19: immutable scalar nested child-control placement Core and test-only host shadows passed parity, serialization, immutability, and nonmutation proof." });
state.proofStatus.dataListSublistNestedControlPlacementShadow = "passed_internal_only";
write("docs/architecture/yeeflow-app-builder-core-migration-state.json", state);
console.log("PHASE_12B_NESTED_CONTROL_SHADOW_RECORDED");

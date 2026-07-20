#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(root, path), "utf8"); const json = (path) => JSON.parse(read(path));
const planning = await import(`${new URL("../packages/app-builder-core-planning/lib/index.js", import.meta.url).href}?retained=${Date.now()}`);
const materializer = await import(`${new URL("../packages/app-builder-core-materializer/lib/index.js", import.meta.url).href}?retained=${Date.now()}`);
const lineage = json("compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json");
for (const name of ["projectPlanningLabel", "projectWorkflowSetDataListProjection", "projectWorkflowQueryDataStaticPlan", "projectWorkflowStaticPlan", "projectApplicationPlanStaticFoundation"]) assert.equal(typeof planning[name], "function", `CORE_EXTRACTION_WAVE3_BATCH_H_RETAINED_PLANNING_EXPORT:${name}`);
for (const name of ["projectApprovalFormSubListLookupStaticConfiguration", "projectApprovalFormStaticConfiguration"]) assert.equal(typeof materializer[name], "function", `CORE_EXTRACTION_WAVE3_BATCH_H_RETAINED_MATERIALIZER_EXPORT:${name}`);
for (const path of ["scripts/lib/approval-form-layout-builder.mjs", "scripts/lib/workflow-set-data-list-projection-utils.mjs", "scripts/lib/workflow-query-data-utils.mjs", "scripts/materialize-full-app-generated-final.mjs"]) {
  const source = read(path); assert(!source.includes("TODO_RESTORE_LEGACY"), `CORE_EXTRACTION_WAVE3_BATCH_H_RETAINED_ROUTE_REGRESSION:${path}`);
}
for (const phase of ["core-extraction-wave-1-planning-normalization-execution", "core-extraction-wave-2-approval-form-sublist-lookup-static-configuration-projection", "core-extraction-wave3-batch-a-workflow-set-data-list-projection", "core-extraction-wave3-batch-b-workflow-query-data-static-plan", "core-extraction-wave3-batch-g-approval-form-static-configuration", "core-extraction-wave3-batch-h-application-plan-foundation-selection-and-execution"]) assert(lineage.approvedTransitions.some((item) => item.phase === phase), `CORE_EXTRACTION_WAVE3_BATCH_H_RETAINED_LINEAGE:${phase}`);
assert.equal(planning.projectApplicationPlanStaticFoundation({ kind: "infer-navigation-type", value: "Approval" }).value, 105);
console.log("CORE_EXTRACTION_WAVE3_BATCH_H_RETAINED_WAVE_ROUTING_REGRESSIONS_PASSED");

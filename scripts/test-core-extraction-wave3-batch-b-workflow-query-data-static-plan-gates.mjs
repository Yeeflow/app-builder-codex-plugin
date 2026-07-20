#!/usr/bin/env node
import assert from "node:assert/strict";
import { projectWorkflowQueryDataStaticPlan } from "../packages/app-builder-core-planning/lib/index.js";
assert.throws(() => projectWorkflowQueryDataStaticPlan({ kind: "query-properties", value: { listType: 999 } }), /Unsupported export-proven Workflow Query Data source type: 999/);
assert.throws(() => projectWorkflowQueryDataStaticPlan({ kind: "unknown", value: {} }), /Unsupported Workflow Query Data static-plan projection kind/);
const projection = projectWorkflowQueryDataStaticPlan({ kind: "query-properties", value: { listId: "1000000000000000002", fields: [{ id: "Title" }] } });
assert.equal(projection.value.listid, "1000000000000000002"); assert(Object.isFrozen(projection)); assert(Object.isFrozen(projection.value));
assert.equal("parseWorkflowSorts" in projection, false); assert.equal("executeQuery" in projection, false);
console.log("CORE_EXTRACTION_WAVE3_BATCH_B_NEGATIVE_REGRESSIONS_PASSED cases=5");
